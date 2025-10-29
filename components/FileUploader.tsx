
import React, { useRef, useState } from 'react';
import Papa from 'papaparse';

interface FileUploaderProps {
  onDataLoaded: (data: any[], file: File) => void;
  onError: (error: string) => void;
  onClear: () => void;
  disabled: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onDataLoaded, onError, onClear, disabled }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            onError(`Error parsing CSV: ${results.errors[0].message}`);
          } else {
            onDataLoaded(results.data, file);
          }
        },
        error: (err) => {
          onError(`Failed to read file: ${err.message}`);
        },
      });
    }
  };
  
  const handleClearFile = () => {
    setFileName(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    onClear();
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 w-full">
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-lg font-medium text-gray-200">Upload Crash CSV</h3>
                <p className="text-sm text-gray-400 mt-1">Select a CSV file to begin analysis.</p>
            </div>
            <div className="flex items-center space-x-2">
                <label htmlFor="file-upload" className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <span>{fileName ? 'Change File' : 'Select File'}</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} disabled={disabled} ref={fileInputRef}/>
                </label>
                {fileName && (
                    <button onClick={handleClearFile} className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">
                        Clear
                    </button>
                )}
            </div>
        </div>
        {fileName && <p className="text-sm text-cyan-400 mt-4">Selected: {fileName}</p>}
    </div>
  );
};

export default FileUploader;
