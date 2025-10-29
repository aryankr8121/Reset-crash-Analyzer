import { CrashDataRow } from '../types';

export const processCsvData = (data: any[]): Promise<CrashDataRow[]> => {
    return new Promise((resolve) => {
        const columnsToIgnore = [
            'update_time', 'frozen_resets', 'Lifecycle_Duration_h', 'ynr', 'vnr', 'ecu_sw',
            'Kilometer', 'speed', 'timestamp_abs', 'ecu_hw', 'booking_to', 'booking_from', 'fips_id'
        ];
        
        const filteredData = data.map(row => {
            const newRow: { [key: string]: any } = {};
            for (const key in row) {
                if (!columnsToIgnore.includes(key)) {
                    newRow[key.trim()] = row[key] || "";
                }
            }
            return newRow;
        });
        
        const deduplicatedData = removeDuplicates(filteredData);
        
        // Add a unique ID for React keys
        const dataWithIds = deduplicatedData.map((row, index) => ({
            ...row,
            id: `${row['Crash-ID'] || 'no-id'}-${index}`
        }));
        
        resolve(dataWithIds);
    });
};

// Fix: Changed parameter and return type from CrashDataRow[] to a generic object array
// because the 'id' property is not available at this stage of processing.
const removeDuplicates = (data: { [key: string]: any }[]): { [key: string]: any }[] => {
    if (!data || data.length === 0) {
        return [];
    }
    
    // Step 1: Deduplicate by 'Crash-ID'
    const byCrashId = new Map<string, { [key: string]: any }>();
    const withoutCrashId: { [key: string]: any }[] = [];

    data.forEach(row => {
        const crashId = row['Crash-ID']?.trim();
        if (crashId && crashId.toLowerCase() !== 'n/a' && crashId !== '') {
            if (!byCrashId.has(crashId)) {
                byCrashId.set(crashId, row);
            }
        } else {
            withoutCrashId.push(row);
        }
    });

    const crashIdDeduplicated = Array.from(byCrashId.values());

    // Step 2: Deduplicate rows without a valid Crash-ID
    if (withoutCrashId.length === 0) {
        return crashIdDeduplicated;
    }
    
    const byCompositeKey = new Map<string, { [key: string]: any }>();
    
    let vinCol: string | undefined = undefined;
    if (withoutCrashId.length > 0) {
        vinCol = Object.keys(withoutCrashId[0]).find(k => k.toLowerCase() === 'vin');
    }

    withoutCrashId.forEach(row => {
        const rr = String(row.reset_reason || '');
        
        const exitCodeMatch = rr.match(/exit[_\s-]*code\s*[:=]\s*(\d+)/i);
        const exitCode = exitCodeMatch ? exitCodeMatch[1] : 'NA';

        const serviceMatch = rr.match(/service\s*:\s*\[([^\]]+)\]/i);
        const service = serviceMatch ? serviceMatch[1].trim() : 'UNKNOWN';

        const vin = vinCol ? row[vinCol] : 'NO_VIN';

        const key = `${exitCode}-${service}-${vin}`;
        
        if (!byCompositeKey.has(key)) {
            byCompositeKey.set(key, row);
        }
    });

    const compositeKeyDeduplicated = Array.from(byCompositeKey.values());

    return [...crashIdDeduplicated, ...compositeKeyDeduplicated];
};
