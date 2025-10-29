
import { LogEntry, JiraTicket, FormattedJiraIssue } from '../types';

const mockLogs: LogEntry[] = [
    { date: "2023-10-27", time: "10:00:01.123", msg: "Service failure detected, initiating recovery." },
    { date: "2023-10-27", time: "10:00:01.234", msg: "Process terminated with SIGSEGV, address 0x0" },
    { date: "2023-10-27", time: "10:00:01.345", msg: "segfault at 0 ip 00007f... sp 00007f..." },
    { date: "2023-10-27", time: "10:00:01.456", msg: "Core dump generated for process 1234." },
    { date: "2023-10-27", time: "10:00:02.567", msg: "cgroup out of memory: Killed process 5678 (service_name)" },
    { date: "2023-10-27", time: "10:00:02.678", msg: "oom-kill: task_memcg=/.../service_name" },
];

const mockJiraTickets: JiraTicket[] = [
    { "Ticket No": "ICONSD-1234", Summary: "Crash: NavigationService reset due to memory leak", "Similarity Score": 0.89 },
    { "Ticket No": "ICONSD-5678", Summary: "infotainment crash after long run", "Similarity Score": 0.75 },
    { "Ticket No": "ICONSD-9012", Summary: "Service failure in MediaService on startup", "Similarity Score": 0.62 },
];

export const fetchLogs = (rowId: string, regex: string): Promise<LogEntry[]> => {
    console.log(`Fetching logs for row ${rowId} with regex: ${regex}`);
    return new Promise(resolve => {
        setTimeout(() => {
            const re = new RegExp(regex, "i");
            const filteredLogs = mockLogs.filter(log => re.test(log.msg));
            resolve(filteredLogs);
        }, 1000 + Math.random() * 500);
    });
};

export const fetchSimilarTickets = (serviceName: string, rowId: string): Promise<JiraTicket[]> => {
    console.log(`Fetching similar tickets for service ${serviceName} from row ${rowId}`);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockJiraTickets.filter(t => t.Summary.toLowerCase().includes(serviceName.split('Service')[0].toLowerCase())));
        }, 1200 + Math.random() * 600);
    });
};

export const createJiraTicket = (issue: FormattedJiraIssue): Promise<{ key: string }> => {
    console.log("Creating Jira ticket with data:", issue);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) { // 90% success rate
                const ticketNumber = Math.floor(10000 + Math.random() * 90000);
                resolve({ key: `ICONSD-${ticketNumber}` });
            } else {
                reject(new Error("Failed to connect to Jira server."));
            }
        }, 1500);
    });
};
