import React, { useState, useEffect, useCallback } from 'react';
import { CrashDataRow, LogEntry, JiraTicket, FormattedJiraIssue } from '../types';
import { fetchLogs, fetchSimilarTickets, createJiraTicket } from '../services/mockApi';
import { formatJiraIssue } from '../utils/jiraFormatter';
import { ChevronDownIcon, MinusIcon, PlusIcon, ClipboardIcon, ClipboardCheckIcon } from './icons';
import Spinner from './Spinner';

interface CrashRowProps {
  rowData: CrashDataRow;
  index: number;
  isSelected: boolean;
  onSelectionChange: (id: string) => void;
}

const parseRecoveryEvent = (log: string): { [key: string]: string | number } => {
    const data: { [key: string]: string | number } = {};
    if (!log || typeof log !== 'string') return data;

    const exitCodeMatch = log.match(/exit_code:\s*(\d+)/);
    if (exitCodeMatch) data["exit_code"] = parseInt(exitCodeMatch[1], 10);

    const resultMatch = log.match(/result:\s*(\w+)/);
    if (resultMatch) data["result"] = resultMatch[1];
    
    return data;
};

const CrashRow: React.FC<CrashRowProps> = ({ rowData, index, isSelected, onSelectionChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [occurrences, setOccurrences] = useState(() => parseInt(rowData.occurrences || '1', 10));
  const [payloadRegex, setPayloadRegex] = useState('');
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);

  const [similarTickets, setSimilarTickets] = useState<JiraTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const [jiraPreview, setJiraPreview] = useState<FormattedJiraIssue | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketCreationStatus, setTicketCreationStatus] = useState<{success: boolean, message: string} | null>(null);
  const [isCopied, setIsCopied] = useState(false);


  useEffect(() => {
    const serviceData = parseRecoveryEvent(rowData.reset_reason || "");
    let defaultRegex = "Service failure|oom-kill|SIGKILL|segfault|SIGSEGV|cgroup out of memory";
    if (serviceData.exit_code === 9) {
      defaultRegex = "Service failure|oom-kill|SIGKILL|cgroup out of memory";
    } else if (serviceData.exit_code === 11) {
      defaultRegex = "Service failure|segfault|SIGSEGV";
    }
    setPayloadRegex(defaultRegex);
  }, [rowData.reset_reason]);

  const loadData = useCallback(async () => {
    if (isExpanded && logs.length === 0 && similarTickets.length === 0) { // Only load if not already loaded
        setIsLoadingLogs(true);
        setIsLoadingTickets(true);
        
        fetchLogs(rowData.id, payloadRegex).then(setLogs).finally(() => setIsLoadingLogs(false));
        fetchSimilarTickets(rowData.Service_Reason || '', rowData.id).then(setSimilarTickets).finally(() => setIsLoadingTickets(false));
    }
  }, [isExpanded, rowData.id, rowData.Service_Reason, payloadRegex, logs.length, similarTickets.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  useEffect(() => {
    const rowCopy = { ...rowData, occurrences, error_info: selectedLogs.length > 0 ? `[Pre-analysis]:\n${selectedLogs.join('\n')}` : rowData.error_info || '' };
    setJiraPreview(formatJiraIssue(rowCopy));
  }, [rowData, occurrences, selectedLogs]);


  const handleCreateTicket = async () => {
      if (!jiraPreview) return;
      setIsCreatingTicket(true);
      setTicketCreationStatus(null);
      try {
          const result = await createJiraTicket(jiraPreview);
          setTicketCreationStatus({ success: true, message: `✅ Created Jira issue: ${result.key}`});
      } catch (error) {
          setTicketCreationStatus({ success: false, message: `❌ Failed to create Jira issue: ${error instanceof Error ? error.message : 'Unknown error'}`});
      } finally {
          setIsCreatingTicket(false);
      }
  }

  const handleLogSelection = (msg: string) => {
    setSelectedLogs(prev => prev.includes(msg) ? prev.filter(m => m !== msg) : [...prev, msg]);
  }
  
  const handleCopyToClipboard = () => {
    if (!jiraPreview) return;
    
    const textToCopy = `Summary: ${jiraPreview.summary}\n\nDescription:\n${jiraPreview.description}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className={`bg-gray-800/60 border rounded-lg overflow-hidden transition-colors ${isSelected ? 'border-cyan-500' : 'border-gray-700'}`}>
      <div
        className="w-full text-left p-4 flex justify-between items-center bg-gray-800 hover:bg-gray-700/50"
      >
        <div className="flex items-center space-x-4 flex-1 min-w-0">
             <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelectionChange(rowData.id)}
                className="h-5 w-5 rounded border-gray-500 bg-gray-900 text-cyan-600 focus:ring-cyan-500 cursor-pointer flex-shrink-0"
            />
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="flex-1 text-left min-w-0"
            >
                <span className="font-semibold text-lg text-gray-200 truncate">
                    Reset {index + 1} &rarr; <span className="text-cyan-400">{rowData.Service_Reason || 'N/A'}</span>
                </span>
            </button>
        </div>
        <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="ml-4 p-1"
        >
            <ChevronDownIcon className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 md:p-6 space-y-8 bg-gray-800/30">
          {/* Details & Occurrences */}
          <section>
            <h3 className="text-xl font-semibold mb-3 text-gray-300">Row Details</h3>
            <div className="overflow-x-auto bg-gray-900/50 p-2 rounded-md">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    {Object.keys(rowData).filter(k => k !== 'id').map(key => <th key={key} className="p-2 text-left font-medium text-gray-400">{key}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Object.keys(rowData).filter(k => k !== 'id').map(key => <td key={key} className="p-2 text-gray-300 font-mono whitespace-nowrap">{rowData[key]}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center space-x-4">
                <h4 className="text-md font-medium text-gray-300">Occurrence Rate: <span className="text-cyan-400 font-bold text-lg">{occurrences}</span></h4>
                <div className="flex items-center">
                    <button onClick={() => setOccurrences(p => p > 1 ? p - 1 : 1)} className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300"><MinusIcon/></button>
                    <button onClick={() => setOccurrences(p => p + 1)} className="p-1 ml-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300"><PlusIcon/></button>
                </div>
            </div>
          </section>

          {/* Log Filtering */}
          <section>
            <h3 className="text-xl font-semibold mb-3 text-gray-300 flex items-center">
              Log Analysis
              {isLoadingLogs && <Spinner size="sm" className="ml-3" />}
            </h3>
            <input
              type="text"
              value={payloadRegex}
              onChange={(e) => setPayloadRegex(e.target.value)}
              className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 font-mono disabled:opacity-50"
              disabled={isLoadingLogs}
            />
            {isLoadingLogs ? (
                <div className="flex items-center justify-center my-4 text-gray-400">Loading logs...</div>
            ) : (
              logs.length > 0 ? (
                <div className="mt-4 max-h-96 overflow-y-auto bg-gray-900/50 p-2 rounded-md border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Select log lines for Jira description:</p>
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start p-1.5 rounded hover:bg-gray-700/50">
                      <input type="checkbox" checked={selectedLogs.includes(log.msg)} onChange={() => handleLogSelection(log.msg)} className="mt-1 h-4 w-4 rounded border-gray-500 bg-gray-800 text-cyan-600 focus:ring-cyan-500 cursor-pointer"/>
                      <label className="ml-3 block text-sm text-gray-300 font-mono cursor-pointer">{log.date} {log.time} - {log.msg}</label>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-4 text-gray-500">No logs found for this filter.</p>
            )}
          </section>

          {/* Similar Tickets */}
          <section>
             <h3 className="text-xl font-semibold mb-3 text-gray-300 flex items-center">
                Similar Jira Tickets
                {isLoadingTickets && <Spinner size="sm" className="ml-3" />}
             </h3>
             {isLoadingTickets ? (
                <div className="flex items-center justify-center my-4 text-gray-400">Fetching similar tickets...</div>
             ) : (
                 similarTickets.length > 0 ? (
                    <div className="overflow-x-auto bg-gray-900/50 p-2 rounded-md border border-gray-700">
                        <table className="min-w-full text-sm text-left">
                            <thead className="border-b border-gray-700">
                                <tr>
                                    <th className="p-2 font-medium text-gray-400">Ticket No</th>
                                    <th className="p-2 font-medium text-gray-400">Summary</th>
                                    <th className="p-2 font-medium text-gray-400">Similarity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {similarTickets.map(ticket => (
                                    <tr key={ticket['Ticket No']} className="hover:bg-gray-700/50">
                                        <td className="p-2 text-cyan-400">{ticket['Ticket No']}</td>
                                        <td className="p-2 text-gray-300">{ticket.Summary}</td>
                                        <td className="p-2 text-gray-300">{ticket['Similarity Score']?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 ) : <p className="mt-4 text-gray-500">No similar tickets found.</p>
             )}
          </section>

          {/* Jira Preview & Creation */}
          <section>
             <div className="flex justify-between items-center mb-3">
                 <h3 className="text-xl font-semibold text-gray-300">📝 Jira Ticket Preview</h3>
                 <button 
                    onClick={handleCopyToClipboard} 
                    disabled={!jiraPreview || isCopied}
                    className="px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-700 hover:bg-gray-600 text-gray-300"
                >
                    {isCopied ? (
                        <>
                            <ClipboardCheckIcon className="w-4 h-4 mr-2 text-green-400" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <ClipboardIcon className="w-4 h-4 mr-2" />
                            Copy
                        </>
                    )}
                </button>
             </div>
             {jiraPreview && (
                 <div className="space-y-4">
                     <input type="text" readOnly value={jiraPreview.summary} className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-md font-semibold"/>
                     <textarea readOnly value={jiraPreview.description} rows={10} className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-md font-mono text-sm"/>
                     <button onClick={handleCreateTicket} disabled={isCreatingTicket} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-500 flex items-center">
                         {isCreatingTicket ? <><Spinner size="sm" className="mr-2"/> Creating...</> : 'Create Jira Ticket'}
                     </button>
                     {ticketCreationStatus && (
                         <p className={`mt-2 text-sm ${ticketCreationStatus.success ? 'text-green-400' : 'text-red-400'}`}>{ticketCreationStatus.message}</p>
                     )}
                 </div>
             )}
          </section>
        </div>
      )}
    </div>
  );
};

export default CrashRow;