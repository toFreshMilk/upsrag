export function logClientError(type: 'API_ERROR' | 'RUNTIME_ERROR', message: string, details?: any) {
    try {
        let serializedDetails = details;
        if (details instanceof Error) {
            serializedDetails = {
                message: details.message,
                stack: details.stack,
                name: details.name
            };
        }

        fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, message, details: serializedDetails }),
        }).catch(err => console.error("Client logger failed", err));
    } catch (e) {
        console.error("Logger formatting failed", e);
    }
}