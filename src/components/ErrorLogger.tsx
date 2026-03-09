"use client";

import { useEffect } from "react";
import { logClientError } from "@/lib/logger";

export default function ErrorLogger() {
    useEffect(() => {
        const handleWindowError = (event: ErrorEvent) => {
            logClientError('RUNTIME_ERROR', `Unhandled Client Error: ${event.message}`, event.error);
        };

        const handlePromiseRejection = (event: PromiseRejectionEvent) => {
            logClientError('RUNTIME_ERROR', `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`, event.reason);
        };

        window.addEventListener('error', handleWindowError);
        window.addEventListener('unhandledrejection', handlePromiseRejection);

        return () => {
            window.removeEventListener('error', handleWindowError);
            window.removeEventListener('unhandledrejection', handlePromiseRejection);
        };
    }, []);

    return null;
}