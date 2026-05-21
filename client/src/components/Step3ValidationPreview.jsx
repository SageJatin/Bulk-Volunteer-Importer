export default function Step3ValidationPreview({ validationResults, onBack, onNext }) {
  if (!validationResults) return null;

  const { totalRows, validRows, invalidRows, rows } = validationResults;

  // Extract column headers dynamically based on the mapped data
  const columns = rows.length > 0 ? Object.keys(rows[0].data) : [];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Step 3: Validation Preview</h2>
      
      {/* Summary Header */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded border text-sm">
        <span className="font-medium text-gray-700">Total Rows: {totalRows}</span>
        <span className="font-medium text-green-600 px-3 py-1 bg-green-100 rounded-full">
          {validRows} rows valid
        </span>
        <span className="font-medium text-red-600 px-3 py-1 bg-red-100 rounded-full">
          {invalidRows} rows invalid
        </span>
      </div>

      {/* Data Table */}
      <div className="bg-white border rounded-lg overflow-x-auto max-h-[500px] shadow-sm mb-6">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-100 border-b sticky top-0 z-10">
            <tr>
              <th className="p-3 font-semibold text-gray-700 border-r">Row</th>
              {columns.map(col => (
                <th key={col} className="p-3 font-semibold text-gray-700 capitalize">{col}</th>
              ))}
              <th className="p-3 font-semibold text-gray-700">Row Errors</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr 
                key={index} 
                className={`border-b last:border-0 ${row.isValid ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <td className="p-3 border-r font-medium text-gray-600">{row.rowNumber}</td>
                
                {/* Dynamically render each mapped cell */}
                {columns.map(col => {
                  // Find if there is a specific error for this field
                  const fieldError = row.errors.find(e => e.field === col);
                  return (
                    <td key={col} className="p-3 align-top">
                      <span className={fieldError ? 'text-red-700 font-medium' : 'text-gray-800'}>
                        {row.data[col] || '-'}
                      </span>
                      {fieldError && (
                        <span className="block text-xs text-red-600 mt-1 font-semibold">
                          {fieldError.message}
                        </span>
                      )}
                    </td>
                  );
                })}

                {/* Catch-all for row-level errors (like missing unmapped required fields) */}
                <td className="p-3 align-top whitespace-normal min-w-[200px]">
                  {!row.isValid && (
                    <ul className="list-disc list-inside text-xs text-red-600">
                      {row.errors.map((err, i) => (
                        <li key={i}>{err.message}</li>
                      ))}
                    </ul>
                  )}
                  {row.isValid && <span className="text-green-600 text-xs font-semibold">Ready to import</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={onBack} 
          className="text-gray-600 border border-gray-300 px-6 py-2 rounded hover:bg-gray-50 transition-colors font-medium"
        >
          Back to Mapping
        </button>
        <button 
          onClick={onNext} 
          className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          Proceed to Import
        </button>
      </div>
    </div>
  );
}