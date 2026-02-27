"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ChatSectionProps {
    onChatComplete: (tokens: number, latency: number) => void;
}

export default function ChatSection({ onChatComplete }: ChatSectionProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "안녕하세요! Upstage Solar AI입니다. 무엇을 도와드릴까요?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // 스크롤 제어 상태
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 메시지 추가/로딩 시 자동 스크롤 (사용자가 맨 아래에 있을 때만)
    useEffect(() => {
        if (isAutoScroll) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading, isAutoScroll]);

    // 스크롤 감지 핸들러
    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        // 맨 아래 근처(50px 이내)에 있으면 자동 스크롤 활성화
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setIsAutoScroll(isAtBottom);
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput("");

        // 사용자 메시지 추가 시에는 무조건 스크롤 하단으로 이동
        const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
        setMessages(newMessages);
        setIsAutoScroll(true);
        setIsLoading(true);

        const startTime = Date.now();

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMessage = data.details || data.error || "알 수 없는 오류가 발생했습니다.";
                throw new Error(`API Error: ${errorMessage}`);
            }

            const endTime = Date.now();
            const latency = endTime - startTime;

            onChatComplete(data.usage?.total_tokens || 0, latency);
            setMessages([...newMessages, { role: "assistant", content: data.content }]);
        } catch (error: any) {
            console.error(error);
            setMessages([...newMessages, { 
                role: "assistant", 
                content: `⚠️ 오류가 발생했습니다: ${error.message}\n잠시 후 다시 시도해주세요.` 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            {/* 1. 헤더 영역 */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-500" />
                    Solar Chat (Reasoning)
                </h2>
            </div>

            {/* 2. 메시지 리스트 영역 */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 scroll-smooth"
            >
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>

                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                ${m.role === 'user' ? 'bg-slate-800 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                            </div>

                            <div className={`p-4 rounded-2xl text-sm shadow-sm overflow-hidden
                ${m.role === 'user'
                                ? 'bg-slate-800 text-white rounded-tr-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>

                                {m.role === 'user' ? (
                                    <div className="whitespace-pre-wrap">{m.content}</div>
                                ) : (
                                    <div className="prose prose-sm prose-slate max-w-none break-words
                    prose-headings:text-slate-800 prose-headings:font-bold prose-h1:text-lg prose-h2:text-base
                    prose-p:leading-relaxed prose-pre:bg-slate-100 prose-pre:text-slate-700 prose-code:text-pink-600">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {m.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* 로딩 인디케이터 */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mt-1">
                                <Bot className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-medium mr-1">Reasoning...</span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 스크롤 앵커 */}
                <div ref={bottomRef} className="h-1" />
            </div>

            {/* 3. 입력창 영역 */}
            <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex gap-2 relative">
                    <input
                        className="flex-1 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                        placeholder="무엇이든 물어보세요..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && sendMessage()}
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1.5 bg-indigo-600 text-white p-1.5 rounded-lg
              hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
