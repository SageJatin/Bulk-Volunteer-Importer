import { useState } from 'react';
import axios from 'axios';

export default function Step2FieldMapper({ 
  tempFileId, 
  fileDetails, 
  fieldMappings, 
  setFieldMappings, 
  setValidationResults,
  onNext 
}) {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  
  // State for the Enum value mappings (Constraint 5)
  const [valueMappings] = useState({
  gender: {},
  highestEducation: {}
});

  const dbFields = [
    { value: 'firstName', label: 'First Name (Required)' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email (Required)' },
    { value: 'phone', label: 'Phone (Required)' },
    { value: 'gender', label: 'Gender (Required Enum)' },
    { value: 'dob', label: 'Date of Birth (Required)' },
    { value: 'city', label: 'City (Required)' },
    { value: 'state', label: 'State (Required)' },
    { value: 'highestEducation', label: 'Education (Required Enum)' },
    { value: 'accountNumber', label: 'Account Number' },
    { value: 'ifscCode', label: 'IFSC Code' }
  ];

  const handleMappingChange = (csvHeader, selectedDbField) => {
    setFieldMappings(prev => {
      const newMappings = { ...prev };
      if (selectedDbField) {
        newMappings[csvHeader] = selectedDbField;
      } else {
        delete newMappings[csvHeader];
      }
      return newMappings;
    });
  };

  // Helper to check if a DB field is already selected elsewhere (Constraint 4)
  const isFieldDisabled = (dbFieldValue, currentCsvHeader) => {
    const isSelected = Object.values(fieldMappings).includes(dbFieldValue);
    const isSelectedByMe = fieldMappings[currentCsvHeader] === dbFieldValue;
    return isSelected && !isSelectedByMe;
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/volunteers/validate-mapping', {
        tempFileId,
        fieldMappings,
        valueMappings
      });
      
      setValidationResults(response.data);
      onNext(); // Move to Step 3
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 2: Map Columns</h2>
      <p className="text-sm text-gray-600 mb-6">Match your file's columns to the database fields.</p>

      <div className="bg-white border rounded-lg overflow-hidden mb-6 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 font-semibold text-gray-700">CSV Column</th>
              <th className="p-3 font-semibold text-gray-700">Sample Data</th>
              <th className="p-3 font-semibold text-gray-700">Map To</th>
            </tr>
          </thead>
          <tbody>
            {fileDetails.headers.map((header, index) => (
              <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-800">{header}</td>
                <td className="p-3 text-gray-500 italic">
                  {fileDetails.preview[0] ? fileDetails.preview[0][index] : 'No data'}
                </td>
                <td className="p-3">
                  <select 
                    className="border border-gray-300 rounded p-2 w-full text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={fieldMappings[header] || ''}
                    onChange={(e) => handleMappingChange(header, e.target.value)}
                  >
                    <option value="">-- Select Field --</option>
                    {dbFields.map(field => (
                      <option 
                        key={field.value} 
                        value={field.value}
                        disabled={isFieldDisabled(field.value, header)}
                      >
                        {field.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-red-500 mb-4 font-medium">{error}</p>}

      <div className="flex justify-between items-center mt-8">
        <p className="text-sm text-gray-500">
          {Object.keys(fieldMappings).length} fields mapped
        </p>
        <button 
          onClick={handleValidate} 
          disabled={isValidating || Object.keys(fieldMappings).length === 0}
          className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isValidating ? 'Validating...' : 'Validate & Preview'}
        </button>
      </div>
    </div>
  );
}