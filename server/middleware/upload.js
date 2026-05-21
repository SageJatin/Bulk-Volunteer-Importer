// server/middleware/upload.js
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save raw uploaded file to disk at uploads/temp/ [cite: 17]
    cb(null, 'uploads/temp/');
  },
  filename: function (req, file, cb) {
    // Generate UUID and append the original file extension [cite: 17]
    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    
    // We will attach the generated tempFileId to the request object 
    // so we can easily pass it back in the controller response
    req.tempFileId = uniqueId; 
    
    cb(null, uniqueId + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Detect file type by file extension, not MIME type alone [cite: 15]
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ext === '.csv' || ext === '.xlsx') {
    cb(null, true);
  } else {
    // Pass an error if it's the wrong extension
    cb(new Error('Invalid file type. Only .csv and .xlsx are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Max 5 MB limit [cite: 14]
});

module.exports = upload;