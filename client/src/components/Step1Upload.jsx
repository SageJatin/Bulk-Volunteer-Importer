import { useState } from 'react';
import axios from 'axios';

export default function Step1Upload({ onNext }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      
      if (!validTypes.includes(selectedFile.type) && ext !== 'csv' && ext !== 'xlsx') {
        setError('Please upload a valid .csv or .xlsx file.');
        setFile(null);
      } else if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File exceeds the 5MB limit.');
        setFile(null);
      } else {
        setError('');
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/volunteers/parse-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { tempFileId, headers, preview, totalRows } = response.data;
      
      // Pass the data up to App.jsx and move to Step 2
      onNext(tempFileId, { headers, preview, totalRows });
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 1: Upload Data File</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input 
          type="file" 
          accept=".csv, .xlsx" 
          onChange={handleFileChange}
          className="mb-4"
        />
        <p className="text-sm text-gray-500">Max file size: 5MB (.csv or .xlsx)</p>
      </div>

      {error && <p className="text-red-500 mt-4 font-medium">{error}</p>}

      {file && !error && (
        <div className="mt-6">
          <p className="font-medium text-gray-700">Selected file: {file.name}</p>
          <button 
            onClick={handleUpload} 
            disabled={isUploading}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload and Preview'}
          </button>
        </div>
      )}
    </div>
  );
}