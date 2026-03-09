import { NextResponse } from "next/server";
import OpenAI from "openai";
import { searchVectors } from "@/lib/vectorStore";
import { RAG_CONFIG } from "@/lib/constants";
import { logServerError } from "@/lib/server-logger";

const solar = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_UPSTAGE_API_KEY,
    baseURL: "https://api.upstage.ai/v1/solar"
});

export async function POST(req: Request) {
    const totalStartTime = Date.now();
    try {
        const { messages, mode } = await req.json();

        // 마지막 사용자 메시지 추출
        const lastUserMessage = messages[messages.length - 1].content;
        console.log(`[Chat API] 사용자 질문 (${mode === 'free' ? '자유 대화' : '문서 기반'}):`, lastUserMessage);

        let systemContent = "당신은 Upstage Solar AI입니다. 사용자의 질문에 한국어로 친절하게 답변하세요.";

        // 자유 채팅 모드가 아닐 때만(문서 기반 모드일 때만) RAG 프로세스 실행
        if (mode !== 'free') {
            // 1. 질문 임베딩 (Query 모델 사용 필수!)
            const embedStartTime = Date.now();
            const queryEmbed = await solar.embeddings.create({
                model: "embedding-query",
                input: lastUserMessage,
                encoding_format: "float"
            });
            const queryVector = queryEmbed.data[0].embedding;
            console.log(`[Chat API] 임베딩 생성 소요 시간: ${Date.now() - embedStartTime}ms`);

            // 2. 문서 검색
            const searchStartTime = Date.now();
            const relevantDocs = searchVectors(queryVector, RAG_CONFIG.TOP_K);
            console.log(`[Chat API] 벡터 검색 소요 시간: ${Date.now() - searchStartTime}ms`);
            console.log(`[Chat API] 검색된 문서 개수: ${relevantDocs.length}`);

            if (relevantDocs.length > 0) {
                console.log("[Chat API] 검색된 문서 미리보기:", relevantDocs[0].text.substring(0, 100));
                console.log("[Chat API] 유사도 점수:", relevantDocs[0].similarity);
                
                // 검색된 문서 내용을 컨텍스트로 추가
                const contextText = relevantDocs.map(d => d.text).join("\n\n---\n\n");
                systemContent = `
                    당신은 '문서 기반 AI 비서'입니다. 
                    아래 제공된 [참고 문서] 내용을 바탕으로 사용자의 질문에 답변하세요.
                    문서에 없는 내용은 "제공된 문서에 해당 내용이 없습니다"라고 솔직하게 말하세요.
                    
                    [참고 문서]
                    ${contextText}
                `.trim();
            } else {
                console.warn("[Chat API] 검색된 문서가 없습니다! (유사도 기준 미달이거나 데이터 없음)");
                systemContent = "당신은 문서 기반 AI 비서입니다. 하지만 현재 참고할 수 있는 문서가 없습니다. 이 사실을 사용자에게 알리고 아는 선에서 일반적인 답변을 제공하세요.";
            }
        }

        // 4. 메시지 배열 재구성 (시스템 메시지 교체)
        // 기존 messages 배열에서 첫 번째 시스템 메시지가 있다면 덮어쓰거나, 없으면 추가
        const finalMessages = [
            { role: "system", content: systemContent },
            ...messages.filter((m: any) => m.role !== "system") // 기존 시스템 메시지 제거 후 새거 추가
        ];

        // 5. LLM 호출 (타임아웃 및 에러 처리 강화)
        const llmStartTime = Date.now();
        console.log("[Chat API] LLM(solar-pro3) 호출 시작...");
        
        try {
            // Next.js Edge Function 등이 아닌 Node 런타임에서도 너무 오래 걸리면 문제가 생길 수 있으므로,
            // OpenAI SDK의 timeout 옵션(기본값 10분)을 명시적으로 설정하거나 에러를 명확히 잡습니다.
            const completion = await solar.chat.completions.create({
                model: "solar-pro3",
                messages: finalMessages,
                reasoning_effort: "high",
                stream: false,
            }, { timeout: 60000 }); // 60초 타임아웃 강제 설정

            console.log(`[Chat API] LLM 호출 소요 시간: ${Date.now() - llmStartTime}ms`);

            console.log(`[Chat API] 전체 API 응답 소요 시간: ${Date.now() - totalStartTime}ms`);
            return NextResponse.json({
                content: completion.choices[0].message.content,
                usage: completion.usage
            });
        } catch (llmError: any) {
            logServerError('API_ERROR', `[Chat API] LLM 호출 실패 (소요 시간: ${Date.now() - llmStartTime}ms)`, llmError);
            return NextResponse.json({ 
                error: "LLM response failed or timed out", 
                details: llmError.message 
            }, { status: 504 }); // 504 Gateway Timeout
        }

    } catch (error: any) {
        logServerError('RUNTIME_ERROR', "[Chat API] 전반적인 에러 발생", error);
        return NextResponse.json({ error: "Chat failed", details: error.message }, { status: 500 });
    }
}