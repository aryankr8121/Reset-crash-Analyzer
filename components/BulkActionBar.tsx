import React, { useState } from 'react';
import { CrashDataRow } from '../types';
import { createJiraTicket, fetchLogs } from '../services/mockApi';
import { formatJiraIssue } from '../utils/jiraFormatter';
import PreviewModal from './PreviewModal';

interface BulkActionBarProps {
  selectedRows: CrashDataRow[];
  onClearSelection: () => void;
  onModalToggle: (isOpen: boolean) => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedRows, onClearSelection, onModalToggle }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalOpen = () => {
    setIsModalOpen(true);
    onModalToggle(true);
  }

  const handleModalClose = () => {
    setIsModalOpen(false);
    onModalToggle(false);
  }

  const handleBulkCreateTickets = async () => {
    setIsLoading(true);
    let count = 0;
    setStatusMessage(`Creating tickets... (0/${selectedRows.length})`);
    
    const results = await Promise.allSettled(
      selectedRows.map(async (row) => {
        const issue = formatJiraIssue(row);
        const result = await createJiraTicket(issue);
        count++;
        setStatusMessage(`Creating tickets... (${count}/${selectedRows.length})`);
        return result;
      })
    );
    
    const successes = results.filter(r => r.status === 'fulfilled').length;
    setIsLoading(false);
    setStatusMessage(`Process complete: ${successes} succeeded, ${selectedRows.length - successes} failed.`);
    
    setTimeout(() => {
      setStatusMessage(null);
      if (successes > 0) {
        onClearSelection();
      }
    }, 5000);
  };

  const handleBulkDownloadLogs = async () => {
    setIsLoading(true);
    setStatusMessage('Fetching logs for selected rows...');
    
    const allLogs = await Promise.all(
      selectedRows.map(row => {
        // Use a generic regex for bulk download
        const serviceData = row.reset_reason.match(/exit_code:\s*(\d+)/);
        let regex = "Service failure";
        if (serviceData && serviceData[1] === '9') regex = "Service failure|oom-kill|SIGKILL|cgroup out of memory";
        if (serviceData && serviceData[1] === '11') regex = "Service failure|segfault|SIGSEGV";
        return fetchLogs(row.id, regex);
      })
    );

    let logContent = `Bulk Log Export for ${selectedRows.length} items\n`;
    logContent += `Timestamp: ${new Date().toISOString()}\n\n`;

    selectedRows.forEach((row, index) => {
        logContent += `======================================================================\n`;
        logContent += `  ITEM ${index + 1} | Crash-ID: ${row['Crash-ID'] || 'N/A'} | Service: ${row.Service_Reason}\n`;
        logContent += `======================================================================\n\n`;
        if (allLogs[index].length > 0) {
            logContent += allLogs[index].map(log => `[${log.date} ${log.time}] ${log.msg}`).join('\n');
        } else {
            logContent += 'No logs found for this item with the default filter.\n';
        }
        logContent += '\n\n';
    });
    
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `crash_logs_export_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsLoading(false);
    setStatusMessage('Logs downloaded.');
    setTimeout(() => setStatusMessage(null), 5000);
  };


  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <span className="font-bold text-lg text-cyan-400">{selectedRows.length}</span>
              <span className="ml-2 text-gray-300">item{selectedRows.length > 1 ? 's' : ''} selected</span>
            </div>
            
            {isLoading && statusMessage && (
               <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div>
                  <p className="ml-3 text-cyan-300">{statusMessage}</p>
              </div>
            )}

            {!isLoading && statusMessage && <p className="text-green-400">{statusMessage}</p>}
            
            {!isLoading && !statusMessage && (
              <div className="flex items-center space-x-3">
                <button onClick={handleModalOpen} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                  Show Preview
                </button>
                <button onClick={handleBulkCreateTickets} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
                  Create Jira Tickets
                </button>
                <button onClick={handleBulkDownloadLogs} className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-md hover:bg-cyan-700">
                  Download Logs
                </button>
                <button onClick={onClearSelection} className="px-4 py-2 bg-gray-600 text-gray-200 text-sm font-medium rounded-md hover:bg-gray-500">
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && <PreviewModal rows={selectedRows} onClose={handleModalClose}/>}
    </>
  );
};

export default BulkActionBar;