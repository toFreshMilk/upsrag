import fs from 'fs';
import path from 'path';

export function logServerError(type: 'API_ERROR' | 'RUNTIME_ERROR', message: string, details?: any) {
    try {
        const logFile = path.join(process.cwd(), 'server.log');
        const timestamp = new Date().toISOString();
        let detailStr = '';
        if (details) {
            if (details instanceof Error) {
                detailStr = ` | Details: ${details.message}
Stack: ${details.stack}`;
            } else {
                detailStr = ` | Details: ${typeof details === 'object' ? JSON.stringify(details) : details}`;
            }
        }
        const logMessage = `[${timestamp}] [${type}] ${message}${detailStr}
`;
        
        fs.appendFileSync(logFile, logMessage, 'utf-8');
        console.error(logMessage); // 콘솔에도 출력
    } catch (e) {
        console.error("Failed to write to server.log", e);
    }
}