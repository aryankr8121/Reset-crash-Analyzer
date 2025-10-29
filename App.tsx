import React, { useState, useCallback } from 'react';
import { CrashDataRow } from './types';
import { processCsvData } from './utils/csvProcessor';
import FileUploader from './components/FileUploader';
import CrashRow from './components/CrashRow';
import BulkActionBar from './components/BulkActionBar';

const App: React.FC = () => {
  const [crashData, setCrashData] = useState<CrashDataRow[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set<string>());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);


  const handleDataLoaded = useCallback(async (data: any[], file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);
    setSelectedRowIds(new Set()); // Clear selection on new file
    try {
      const processedData = await processCsvData(data);
      setCrashData(processedData);
    } catch (e) {
      setError(e instanceof Error ? `Error processing CSV: ${e.message}` : 'An unknown error occurred.');
      setCrashData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setCrashData([]);
    setSelectedRowIds(new Set());
    setIsLoading(false);
  }, []);

  const handleClear = () => {
    setCrashData([]);
    setError(null);
    setFileName('');
    setSelectedRowIds(new Set());
  };

  const handleSelectionChange = (rowId: string) => {
    setSelectedRowIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(rowId)) {
            newSet.delete(rowId);
        } else {
            newSet.add(rowId);
        }
        return newSet;
    });
  };
  
  const selectedRows = crashData.filter(row => selectedRowIds.has(row.id));

  return (
    <div className={`flex min-h-screen bg-gray-900 text-gray-200 font-sans ${isModalOpen ? 'overflow-hidden' : ''}`}>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto pb-24"> {/* Added padding-bottom for bulk action bar */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-cyan-400">
              🚗 Reset Crash Analyzer
            </h1>
            <p className="text-gray-400 mt-2">
              Upload a crash report CSV to analyze resets, find similar issues, and create Jira tickets.
            </p>
          </header>

          <FileUploader onDataLoaded={handleDataLoaded} onError={handleFileError} onClear={handleClear} disabled={isLoading} />
          
          <div className="text-center mt-4">
            <a href="/example_crash_report.csv" download="example_crash_report.csv" className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline">
              Download example CSV file
            </a>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center mt-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
              <p className="ml-4 text-lg">Processing CSV data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md mt-6" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {crashData.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-2 text-gray-300">Analysis for <span className="text-cyan-400">{fileName}</span></h2>
              <p className="mb-4 text-gray-400">Found {crashData.length} unique crash events to analyze. Select rows to perform bulk actions.</p>
              <div className="space-y-4">
                {crashData.map((row, index) => (
                  <CrashRow 
                    key={row.id} 
                    rowData={row} 
                    index={index}
                    isSelected={selectedRowIds.has(row.id)}
                    onSelectionChange={handleSelectionChange}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
         {selectedRows.length > 0 && (
          <BulkActionBar
            selectedRows={selectedRows}
            onClearSelection={() => setSelectedRowIds(new Set())}
            onModalToggle={setIsModalOpen}
          />
        )}
      </main>
    </div>
  );
};

export default App;