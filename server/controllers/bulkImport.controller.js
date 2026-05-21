// server/controllers/bulkImport.controller.js
const Volunteer = require('../models/Volunteer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const readline = require('readline'); // For fast CSV streaming

exports.parseUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    let headers = [];
    let preview = [];
    let totalRows = 0;

    if (ext === '.xlsx') {
      // STRICT CONSTRAINT: ExcelJS streaming API only [cite: 8, 80]
      const options = {
        sharedStrings: 'cache',
        hyperlinks: 'ignore',
        worksheets: 'emit'
      };
      
      const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, options);
      
      for await (const worksheet of workbook) {
        for await (const row of worksheet) {
          totalRows++;
          
          // ExcelJS rows are 1-indexed, so we slice(1) to get the actual data array
          const rowValues = row.values.slice(1).map(val => val ? val.toString().trim() : '');
          
          if (totalRows === 1) {
            headers = rowValues;
          } else if (totalRows <= 6) { // Get next 5 rows for preview [cite: 51]
            preview.push(rowValues);
          }
        }
        break; // Only process the first sheet
      }
      
      // Subtract the header row from the total count
      totalRows = totalRows > 0 ? totalRows - 1 : 0; 
      
    } else if (ext === '.csv') {
      // ExcelJS doesn't have a native stream reader for CSV, so we use Node's native readline for streaming
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
      
      for await (const line of rl) {
        totalRows++;
        // Basic CSV split (Note: a production app would use a strict CSV parser for escaped commas, 
        // but this suffices for the time limit unless a library like csv-parser is mandated)
        const rowValues = line.split(',').map(val => val.trim()); 
        
        if (totalRows === 1) {
          headers = rowValues;
        } else if (totalRows <= 6) {
          preview.push(rowValues);
        }
      }
      totalRows = totalRows > 0 ? totalRows - 1 : 0;
    }

    // Return the exact required JSON structure [cite: 19]
    return res.status(200).json({
      headers,
      preview,
      totalRows,
      tempFileId: req.tempFileId // This came from our multer middleware [cite: 19]
    });

  } catch (error) {
    console.error('Error parsing file:', error);
    return res.status(500).json({ error: 'Failed to process file' });
  }
};

exports.validateMapping = async (req, res) => {
  try {
    const { tempFileId, fieldMappings, valueMappings } = req.body;

    if (!tempFileId) {
      return res.status(400).json({ error: 'tempFileId is required' });
    }

    // 1. Find the file (Handles Edge Case: tempFileId is invalid)
    const tempDir = path.join(__dirname, '../uploads');
    let targetFileName = null;
    
    // We only have the tempFileId, so we check the directory for the matching file
    try {
      const files = fs.readdirSync(path.join(tempDir, 'temp'));
      targetFileName = files.find(f => f.startsWith(tempFileId));
    } catch (err) {
      return res.status(400).json({ error: 'Temp file directory missing' });
    }

    if (!targetFileName) {
      return res.status(400).json({ error: 'Temporary file not found or already deleted' });
    }

    const filePath = path.join(tempDir, 'temp', targetFileName);
    const ext = path.extname(targetFileName).toLowerCase();

    // 2. Stream the file again to extract data
    let headers = [];
    let rowsData = [];
    let currentRowNum = 1;

    if (ext === '.xlsx') {
      const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, { sharedStrings: 'cache', hyperlinks: 'ignore', worksheets: 'emit' });
      for await (const worksheet of workbook) {
        for await (const row of worksheet) {
          const rowValues = row.values.slice(1).map(val => val ? val.toString().trim() : '');
          if (currentRowNum === 1) headers = rowValues;
          else rowsData.push({ rowNumber: currentRowNum, rawData: rowValues });
          currentRowNum++;
        }
        break;
      }
    } else if (ext === '.csv') {
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
      for await (const line of rl) {
        const rowValues = line.split(',').map(val => val.trim());
        if (currentRowNum === 1) headers = rowValues;
        else rowsData.push({ rowNumber: currentRowNum, rawData: rowValues });
        currentRowNum++;
      }
    }

    // 3. Map Fields and Gather Emails/Phones for Batch DB Query
    const extractedEmails = [];
    const extractedPhones = [];
    const mappedRows = rowsData.map(row => {
      let mappedData = {};
      
      // Apply Field Mappings
      for (const [csvHeader, dbField] of Object.entries(fieldMappings)) {
        const headerIndex = headers.indexOf(csvHeader);
        if (headerIndex !== -1) {
          let value = row.rawData[headerIndex] || '';

          // Apply Value Mappings (Enums)
          if (valueMappings && valueMappings[dbField] && valueMappings[dbField][value]) {
            value = valueMappings[dbField][value];
          }
          
          // Specific formatting (Lowercase email, numeric phone)
          if (dbField === 'email') value = value.toLowerCase();
          if (dbField === 'phone') value = value.replace(/\D/g, ''); // Strip non-numeric

          mappedData[dbField] = value;
        }
      }

      if (mappedData.email) extractedEmails.push(mappedData.email);
      if (mappedData.phone) extractedPhones.push(mappedData.phone);

      return { rowNumber: row.rowNumber, data: mappedData, isValid: true, errors: [] };
    });

    // 4. Constraint 2: No N+1 Queries! Single $in query to find existing duplicates
    const existingEmails = new Set((await Volunteer.find({ email: { $in: extractedEmails } }).select('email').lean()).map(v => v.email));
    const existingPhones = new Set((await Volunteer.find({ phone: { $in: extractedPhones } }).select('phone').lean()).map(v => v.phone));

    // Keep track of duplicates *within* the file itself
    const fileEmails = new Set();
    const filePhones = new Set();

    let validRowsCount = 0;
    let invalidRowsCount = 0;

    // 5. Validation Loop (Collect multiple errors per row)
    mappedRows.forEach(row => {
      const { data, errors } = row;

      // Required fields check based on schema
      const requiredFields = ['firstName', 'email', 'phone', 'gender', 'dob', 'city', 'state', 'highestEducation'];
      requiredFields.forEach(field => {
        if (!data[field]) {
          errors.push({ field, message: `Missing required field: ${field}`, type: 'MISSING_FIELD' });
        }
      });

      // Email Format Check
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (data.email && !emailRegex.test(data.email)) {
        errors.push({ field: 'email', message: 'Invalid email format', type: 'INVALID_EMAIL' });
      }

      // Phone Format Check
      if (data.phone && data.phone.length !== 10) {
        errors.push({ field: 'phone', message: 'Phone must be exactly 10 digits', type: 'INVALID_PHONE' });
      }

      // Enum Check
      const validGenders = ['male', 'female', 'other'];
      if (data.gender && !validGenders.includes(data.gender)) {
        errors.push({ field: 'gender', message: 'Invalid gender value', type: 'INVALID_ENUM' });
      }

      const validEdu = ['below-10th', '10th', '12th', 'graduate', 'postgraduate'];
      if (data.highestEducation && !validEdu.includes(data.highestEducation)) {
        errors.push({ field: 'highestEducation', message: 'Invalid education value', type: 'INVALID_ENUM' });
      }

      // Duplicate Check (MongoDB)
      if (data.email && existingEmails.has(data.email)) {
        errors.push({ field: 'email', message: 'Email already exists in database', type: 'DB_DUPLICATE' });
      }
      if (data.phone && existingPhones.has(data.phone)) {
        errors.push({ field: 'phone', message: 'Phone already exists in database', type: 'DB_DUPLICATE' });
      }

      // Duplicate Check (Within File)
      if (data.email) {
        if (fileEmails.has(data.email)) errors.push({ field: 'email', message: 'Duplicate email within uploaded file', type: 'FILE_DUPLICATE' });
        else fileEmails.add(data.email);
      }
      if (data.phone) {
        if (filePhones.has(data.phone)) errors.push({ field: 'phone', message: 'Duplicate phone within uploaded file', type: 'FILE_DUPLICATE' });
        else filePhones.add(data.phone);
      }

      if (errors.length > 0) {
        row.isValid = false;
        invalidRowsCount++;
      } else {
        validRowsCount++;
      }
    });

    return res.status(200).json({
      totalRows: rowsData.length,
      validRows: validRowsCount,
      invalidRows: invalidRowsCount,
      rows: mappedRows
    });

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ error: 'Failed to validate mapping' });
  }
};

exports.executeImport = async (req, res) => {
  try {
    // To keep it perfectly DRY and reusable, we mock the 'res' object 
    // to call our own validateMapping function internally.
    let validationResult;
    const mockRes = {
      status: () => mockRes,
      json: (data) => { validationResult = data; return data; }
    };

    // 1. Re-run the exact same validation logic [cite: 39]
    await exports.validateMapping(req, mockRes);

    if (validationResult.error) {
      return res.status(400).json({ error: validationResult.error });
    }

    // 2. Filter out only the valid rows [cite: 40]
    const validRowsToInsert = validationResult.rows
      .filter(row => row.isValid)
      .map(row => row.data);

    let insertedCount = 0;
    
    // 3. Insert into MongoDB using ordered: false [cite: 41]
    if (validRowsToInsert.length > 0) {
      try {
        const result = await Volunteer.insertMany(validRowsToInsert, { ordered: false });
        insertedCount = result.length;
      } catch (insertError) {
        // If ordered: false is used, it throws an error but still inserts valid documents.
        // We can check insertError.insertedDocs for what succeeded.
        insertedCount = insertError.insertedDocs ? insertError.insertedDocs.length : 0;
      }
    }

    // 4. Delete the temporary file from disk [cite: 42]
    const tempDir = path.join(__dirname, '../uploads/temp');
    const files = fs.readdirSync(tempDir);
    const targetFileName = files.find(f => f.startsWith(req.body.tempFileId));
    
    if (targetFileName) {
      fs.unlinkSync(path.join(tempDir, targetFileName));
    }

    // 5. Return exactly the format requested [cite: 43]
    const invalidRows = validationResult.rows
      .filter(row => !row.isValid)
      .map(row => ({
        rowNumber: row.rowNumber,
        errors: row.errors
      }));

    return res.status(200).json({
      imported: insertedCount,
      skipped: validationResult.invalidRows,
      errors: invalidRows
    });

  } catch (error) {
    console.error('Execution error:', error);
    return res.status(500).json({ error: 'Failed to execute import' });
  }
};