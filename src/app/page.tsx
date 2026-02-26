"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import FileSection from "@/components/FileSection";
import ChatSection from "@/components/ChatSection";

export default function MainPage() {
    // 1. 전체 상태 관리
    const [stats, setStats] = useState({
        totalDocs: 0,
        totalTokens: 0,
        avgLatency: 0,
    });

    // 2. 상태 업데이트 핸들러 (FileSection, ChatSection에서 호출)
    const updateStats = (newDocs: number, newTokens: number, latencyMs: number) => {
        setStats((prev) => {
            // 평균 응답속도 재계산 (단순 이동평균 예시)
            const prevCount = prev.totalDocs > 0 || prev.avgLatency > 0 ? 1 : 0; // 기존 데이터가 있으면 가중치 1
            const newLatency = prev.avgLatency === 0
                ? latencyMs
                : Math.round((prev.avgLatency + latencyMs) / 2);

            return {
                totalDocs: prev.totalDocs + newDocs,
                totalTokens: prev.totalTokens + newTokens,
                avgLatency: latencyMs > 0 ? newLatency : prev.avgLatency,
            };
        });
    };

    return (
        <main className="flex h-screen max-h-screen bg-slate-50 p-6 overflow-hidden gap-6">
            <section className="w-1/3 flex flex-col gap-4">
                <Dashboard stats={stats} />
                <FileSection onUploadSuccess={(tokens) => updateStats(1, tokens, 0)} />
            </section>

            <section className="flex-1 flex flex-col">
                <ChatSection onChatComplete={(tokens, latency) => updateStats(0, tokens, latency)} />
            </section>
        </main>
    );
}
