import React from 'react';
import { CrashDataRow } from '../types';
import { formatJiraIssue } from '../utils/jiraFormatter';
import { XIcon } from './icons';

interface PreviewModalProps {
  rows: CrashDataRow[];
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ rows, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-cyan-400">Jira Ticket Preview ({rows.length})</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        
        <div className="p-6 overflow-y-auto space-y-6">
          {rows.map((row) => {
            const issue = formatJiraIssue(row);
            return (
              <div key={row.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">{issue.summary}</h3>
                <div className="bg-gray-900 p-3 rounded-md">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{issue.description}</pre>
                </div>
              </div>
            );
          })}
        </div>

        <footer className="p-4 border-t border-gray-700 flex-shrink-0 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-md hover:bg-cyan-700"
            >
              Close
            </button>
        </footer>
      </div>
    </div>
  );
};

export default PreviewModal;