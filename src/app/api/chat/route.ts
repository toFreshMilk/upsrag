import { NextResponse } from "next/server";
import OpenAI from "openai";
import { searchVectors } from "@/lib/vectorStore";
import { RAG_CONFIG } from "@/lib/constants";


const solar = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_UPSTAGE_API_KEY,
    baseURL: "https://api.upstage.ai/v1/solar"
});

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // 마지막 사용자 메시지 추출
        const lastUserMessage = messages[messages.length - 1].content;
        console.log("[Chat API] 사용자 질문:", lastUserMessage);

        // 1. 질문 임베딩 (Query 모델 사용 필수!)
        // 중요: 질문용 모델인 'embedding-query'를 써야 문서('embedding-passage')랑 매칭이 잘 됩니다.
        const queryEmbed = await solar.embeddings.create({
            model: "embedding-query",
            input: lastUserMessage,
        });
        const queryVector = queryEmbed.data[0].embedding;

        // 2. 문서 검색
        const relevantDocs = searchVectors(queryVector, RAG_CONFIG.TOP_K);
        console.log(`[Chat API] 검색된 문서 개수: ${relevantDocs.length}`);

        if (relevantDocs.length > 0) {
            console.log("[Chat API] 검색된 문서 미리보기:", relevantDocs[0].text.substring(0, 100));
            console.log("[Chat API] 유사도 점수:", relevantDocs[0].similarity);
        } else {
            console.warn("[Chat API] 검색된 문서가 없습니다! (유사도 기준 미달이거나 데이터 없음)");
        }

        // 3. 시스템 프롬프트 구성 (RAG Context 주입)
        let systemContent = "당신은 Upstage Solar AI입니다. 사용자의 질문에 한국어로 친절하게 답변하세요.";

        if (relevantDocs.length > 0) {
            // 검색된 문서 내용을 컨텍스트로 추가
            const contextText = relevantDocs.map(d => d.text).join("\n\n---\n\n");
            systemContent = `
                당신은 '문서 기반 AI 비서'입니다. 
                아래 제공된 [참고 문서] 내용을 바탕으로 사용자의 질문에 답변하세요.
                문서에 없는 내용은 "제공된 문서에 해당 내용이 없습니다"라고 솔직하게 말하세요.
                
                [참고 문서]
                ${contextText}
             `.trim();
        }

        // 4. 메시지 배열 재구성 (시스템 메시지 교체)
        // 기존 messages 배열에서 첫 번째 시스템 메시지가 있다면 덮어쓰거나, 없으면 추가
        const finalMessages = [
            { role: "system", content: systemContent },
            ...messages.filter((m: any) => m.role !== "system") // 기존 시스템 메시지 제거 후 새거 추가
        ];

        // 5. LLM 호출
        const completion = await solar.chat.completions.create({
            model: "solar-pro2",
            messages: finalMessages,
            stream: false,
        });

        return NextResponse.json({
            content: completion.choices[0].message.content,
            usage: completion.usage
        });

    } catch (error: any) {
        console.error("[Chat API] Error:", error);
        return NextResponse.json({ error: "Chat failed" }, { status: 500 });
    }
}
