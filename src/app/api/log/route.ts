import { NextResponse } from 'next/server';
import { logServerError } from '@/lib/server-logger';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, message, details } = body;
        
        logServerError(type || 'RUNTIME_ERROR', message || 'Unknown client error', details);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to log" }, { status: 500 });
    }
}