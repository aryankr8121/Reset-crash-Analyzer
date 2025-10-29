
export interface CrashDataRow {
  id: string; 
  [key: string]: any;
}

export interface LogEntry {
  date: string;
  time: string;
  msg: string;
}

export interface JiraTicket {
  'Ticket No': string;
  Summary: string;
  'Similarity Score'?: number;
}

export interface FormattedJiraIssue {
    summary: string;
    description: string;
}
