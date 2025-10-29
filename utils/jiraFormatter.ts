
import { CrashDataRow, FormattedJiraIssue } from "../types";

export const formatJiraIssue = (row: CrashDataRow): FormattedJiraIssue => {
    const serviceName = row.Service_Reason || 'Unknown Service';
    const vin = row.VIN || row.vin || 'Unknown VIN';
    const crashId = row['Crash-ID'] || 'N/A';
    
    const summary = `Crash: ${serviceName} reset on VIN ${vin} (ID: ${crashId})`;
    
    const description = `
h2. Crash Details

|_. |_. |
| Service | ${serviceName} |
| Crash-ID | ${crashId} |
| VIN | ${vin} |
| Occurrences | ${row.occurrences || 1} |
| SW Version | ${row.ecu_sw_long_name || 'N/A'} |
| Timestamp | ${row.timestamp_at_site || 'N/A'} |

h2. Reset Reason
{code:none}
${row.reset_reason || 'No reset reason provided.'}
{code}

h2. Error Information
{code:none}
${row.error_info || 'No additional error information.'}
{code}
    `.trim();

    return { summary, description };
}
