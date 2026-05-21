import { useState } from 'react';
import axios from 'axios';

export default function Step4Execute({ tempFileId, fieldMappings }) {
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleImport = async () => {
    setIsImporting(true);
    setError('');

    try {
      // Execute the final import on the backend
      const response = await axios.post('http://localhost:5000/api/volunteers/execute-import', {
        tempFileId,
        fieldMappings,
        // If you built the advanced valueMappings state in Step 2, pass it here as well.
        valueMappings: {} 
      });
      
      setResults(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to execute import.');
    } finally {
      setIsImporting(false);
    }
  };

  // CONSTRAINT 5: Client-Side Blob Download
  const downloadErrorReport = () => {
    if (!results || !results.errors || results.errors.length === 0) return;

    // 1. Prepare CSV Headers
    const headers = ['Row Number', 'Error Details'];
    const csvRows = [headers.join(',')];

    // 2. Format the invalid rows
    results.errors.forEach(row => {
      // Combine all errors for the row into a single string
      const errorMessages = row.errors.map(e => `${e.field}: ${e.message}`).join(' | ');
      
      // Wrap the message in quotes so commas in the text don't break the CSV format
      csvRows.push(`${row.rowNumber},"${errorMessages}"`);
    });

    // 3. Generate Blob and URL entirely in the browser
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // 4. Trigger download via hidden anchor tag
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'import_error_report.csv');
    document.body.appendChild(link);
    link.click();
    
    // 5. Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="text-center py-8">
      <h2 className="text-2xl font-semibold mb-6">Step 4: Execute Import</h2>

      {!results && !error && (
        <div>
          <p className="text-gray-600 mb-8">
            Validation complete. You are ready to import the valid records into the database.
          </p>
          <button 
            onClick={handleImport}
            disabled={isImporting}
            className="bg-blue-600 text-white px-8 py-3 rounded text-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
          >
            {isImporting ? 'Importing Data...' : 'Import Now'}
          </button>
        </div>
      )}

      {error && <p className="text-red-500 font-medium mb-4">{error}</p>}

      {results && (
        <div className="max-w-md mx-auto bg-white border rounded-lg p-6 shadow-sm">
          <div className="mb-6">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="text-xl font-bold text-gray-800">Import Complete</h3>
          </div>
          
          <div className="flex justify-around bg-gray-50 p-4 rounded-lg mb-6 border">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{results.imported}</p>
              <p className="text-sm text-gray-500 font-medium">Imported</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">{results.skipped}</p>
              <p className="text-sm text-gray-500 font-medium">Skipped</p>
            </div>
          </div>

          {results.skipped > 0 && (
            <button 
              onClick={downloadErrorReport}
              className="w-full border border-red-500 text-red-600 px-4 py-2 rounded font-medium hover:bg-red-50 transition-colors"
            >
              Download Error Report (.csv)
            </button>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="w-full mt-4 text-blue-600 font-medium hover:underline"
          >
            Start New Import
          </button>
        </div>
      )}
    </div>
  );
}