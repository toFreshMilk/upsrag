import { NextResponse } from "next/server";
import OpenAI from "openai";
import { addDocument } from "@/lib/vectorStore";
import {splitTextIntoChunks} from "@/lib/chunking";

const API_KEY = process.env.NEXT_PUBLIC_UPSTAGE_API_KEY;

const upstage = new OpenAI({
    apiKey: API_KEY,
    baseURL: "https://api.upstage.ai/v1/solar"
});

export async function POST(req: Request) {
    try {
        if (!API_KEY) {
            console.error("API Key is missing!");
            return NextResponse.json({ error: "Server Configuration Error: API Key missing" }, { status: 500 });
        }

        const formData = await req.formData();
        const file = formData.get("document") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`[Embed API] Processing file: ${file.name} (${file.size} bytes)`);

        // 1. Parsing 요청 (옵션 추가)
        const parseFormData = new FormData();
        parseFormData.append("document", file);
        parseFormData.append("model", "document-parse"); // 전용 모델 명시

        // [중요] OCR 자동 활성화 및 포맷 지정
        parseFormData.append("ocr", "auto");
        // JSON 문자열로 보내야 하는 경우를 대비해 문자열 처리
        parseFormData.append("output_formats", JSON.stringify(['html', 'text']));

        const parseRes = await fetch("https://api.upstage.ai/v1/document-digitization", {
            method: "POST",
            headers: { Authorization: `Bearer ${API_KEY}` },
            body: parseFormData,
        });

        if (!parseRes.ok) {
            const errText = await parseRes.text();
            console.error("[Embed API] Parsing Error Response:", errText);
            return NextResponse.json({ error: `Parsing failed: ${errText}` }, { status: 500 });
        }

        const parseData = await parseRes.json();

        // [디버깅] 응답 데이터 구조 확인 로그
        if (parseData.content) {
            console.log("[Embed API] Content Text Length:", parseData.content.text?.length);
            console.log("[Embed API] Content HTML Length:", parseData.content.html?.length);
        } else {
            console.log("[Embed API] No content field in response");
        }

        // 텍스트가 없으면 HTML 태그를 제거해서라도 텍스트를 만들어봄
        let textContent = parseData.content?.text || "";

        if (!textContent && parseData.content?.html) {
            console.log("[Embed API] 텍스트 필드가 비어있어 HTML에서 텍스트 추출을 시도합니다.");
            // 간단히 태그 제거 (정규식) 및 공백 정리
            textContent = parseData.content.html
                .replace(/<[^>]*>?/gm, ' ') // 태그 제거
                .replace(/\s+/g, ' ')       // 연속 공백 제거
                .trim();
        }

        if (!textContent) {
            console.warn("[Embed API] No text extracted (Raw Data Preview):", JSON.stringify(parseData).substring(0, 200));
            return NextResponse.json({ error: "파싱된 텍스트가 없습니다. (빈 문서이거나 이미지일 수 있음)" }, { status: 400 });
        }

        const chunks = splitTextIntoChunks(textContent, 2000, 200); // 2000자씩 자르고 200자 겹침

        console.log(`[Embed API] Total chunks created: ${chunks.length}`);

        let totalTokens = 0;

        // 모든 청크를 순회하며 임베딩 (병렬 처리 시 Rate Limit 걸릴 수 있으니 순차 처리 추천)
        for (const chunk of chunks) {
            const embedRes = await upstage.embeddings.create({
                model: "embedding-passage",
                input: chunk,
            });

            // 3. Storage
            addDocument(chunk, embedRes.data[0].embedding);
            totalTokens += embedRes.usage.total_tokens;
        }

        console.log("[Embed API] All chunks embedded. Total tokens:", totalTokens);

        return NextResponse.json({
            success: true,
            tokens: totalTokens,
            preview: `총 ${chunks.length}개 조각으로 임베딩됨.`
        });

    } catch (error: any) {
        console.error("[Embed API] Critical Error:", error);
        return NextResponse.json({ error: error.message || "Unknown Error" }, { status: 500 });
    }
}
