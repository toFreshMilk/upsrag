"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

// Props 인터페이스 추가
interface ChatSectionProps {
    onChatComplete: (tokens: number, latency: number) => void;
}

export default function ChatSection({ onChatComplete }: ChatSectionProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "안녕하세요! 문서에 대해 궁금한 점을 물어보세요." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput("");

        const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        const startTime = Date.now(); // 시간 측정 시작

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!res.ok) throw new Error("API Error");

            const data = await res.json();
            const endTime = Date.now(); // 시간 측정 종료
            const latency = endTime - startTime;

            // 부모 컴포넌트(Dashboard)로 지표 업데이트
            // (토큰 수는 예시로 50개, 실제로는 백엔드에서 usage 정보를 받아와야 정확함)
            onChatComplete(data.usage?.total_tokens || 50, latency);

            setMessages([...newMessages, { role: "assistant", content: data.content }]);
        } catch (error) {
            setMessages([...newMessages, { role: "assistant", content: "오류가 발생했습니다." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // ... (기존 JSX와 동일, 변경 없음)
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            {/* 헤더 */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-500" />
                    Solar Chat
                </h2>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 
                ${m.role === 'user' ? 'bg-slate-800 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                            </div>
                            <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                ${m.role === 'user'
                                ? 'bg-slate-800 text-white rounded-tr-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                                {m.content}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* 입력 영역 */}
            <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex gap-2">
                    <input
                        className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="질문을 입력하세요..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
