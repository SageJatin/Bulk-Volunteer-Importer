import { useState } from 'react';
import Step1Upload from './components/Step1Upload';
import Step2FieldMapper from './components/Step2FieldMapper';
import Step3ValidationPreview from './components/Step3ValidationPreview';
import Step4Execute from './components/Step4Execute';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Shared State
  const [tempFileId, setTempFileId] = useState(null);
  const [fileDetails, setFileDetails] = useState({ headers: [], preview: [], totalRows: 0 });
  const [fieldMappings, setFieldMappings] = useState({});
  const [validationResults, setValidationResults] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Bulk Volunteer Import</h1>
        
        {/* Progress Indicator */}
        <div className="flex justify-between mb-8 text-sm text-gray-500 border-b pb-4">
          <span className={currentStep >= 1 ? "font-bold text-blue-600" : ""}>1. Upload</span>
          <span className={currentStep >= 2 ? "font-bold text-blue-600" : ""}>2. Map Fields</span>
          <span className={currentStep >= 3 ? "font-bold text-blue-600" : ""}>3. Validate</span>
          <span className={currentStep >= 4 ? "font-bold text-blue-600" : ""}>4. Import</span>
        </div>

        {/* Wizard Steps */}
        {currentStep === 1 && (
          <Step1Upload 
            onNext={(id, details) => {
              setTempFileId(id);
              setFileDetails(details);
              setCurrentStep(2);
            }} 
          />
        )}

        {currentStep === 2 && (
          <Step2FieldMapper 
            tempFileId={tempFileId}
            fileDetails={fileDetails}
            fieldMappings={fieldMappings}
            setFieldMappings={setFieldMappings}
            setValidationResults={setValidationResults}
            onNext={() => setCurrentStep(3)}
          />
        )}
        
        {currentStep === 3 && (
          <Step3ValidationPreview 
            validationResults={validationResults}
            onBack={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <Step4Execute 
            tempFileId={tempFileId}
            fieldMappings={fieldMappings}
          />
        )}
        {/* We will uncomment these as we build them */}
        {/* {currentStep === 2 && <Step2FieldMapper ... />} */}
        {/* {currentStep === 3 && <Step3ValidationPreview ... />} */}
        {/* {currentStep === 4 && <Step4Execute ... />} */}
      </div>
    </div>
  );
}

export default App;