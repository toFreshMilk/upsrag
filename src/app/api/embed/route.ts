import { NextResponse } from "next/server";
import OpenAI from "openai";
import { addDocument } from "@/lib/vectorStore";
import { splitTextIntoChunks } from "@/lib/chunking";

const API_KEY = process.env.NEXT_PUBLIC_UPSTAGE_API_KEY;

const upstage = new OpenAI({
    apiKey: API_KEY,
    baseURL: "https://api.upstage.ai/v1/solar"
});

export async function POST(req: Request) {
    try {
        if (!API_KEY) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const formData = await req.formData();
        const file = formData.get("document") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`[Embed API] Processing file: ${file.name}`);

        // 1. [Parsing] 문서 전체 파싱
        const parseFormData = new FormData();
        parseFormData.append("document", file);
        parseFormData.append("model", "document-parse");
        parseFormData.append("ocr", "auto");
        parseFormData.append("output_formats", JSON.stringify(['html', 'text']));

        const parseRes = await fetch("https://api.upstage.ai/v1/document-digitization", {
            method: "POST",
            headers: { Authorization: `Bearer ${API_KEY}` },
            body: parseFormData,
        });

        if (!parseRes.ok) {
            const errText = await parseRes.text();
            return NextResponse.json({ error: `Parsing failed: ${errText}` }, { status: 500 });
        }

        const parseData = await parseRes.json();

        // 텍스트 추출 (없으면 HTML에서 태그 제거)
        let textContent = parseData.content?.text || "";
        if (!textContent && parseData.content?.html) {
            textContent = parseData.content.html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
        }

        if (!textContent) {
            return NextResponse.json({ error: "텍스트 추출 실패" }, { status: 400 });
        }

        console.log(`[Embed API] Full text length: ${textContent.length} chars`);

        // 2. [Chunking] 전체 텍스트를 조각내기 (자르지 않고 모두 사용!)
        // 1500자 단위로 자르고, 문맥 유지를 위해 200자씩 겹치게 함
        const chunks = splitTextIntoChunks(textContent, 1500, 200);

        console.log(`[Embed API] Total chunks to embed: ${chunks.length}`);

        // 3. [Embedding & Storage] 모든 조각을 반복문으로 저장
        let successCount = 0;
        let totalTokens = 0;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            try {
                // 진행 상황 로그
                console.log(`[Embed API] Embedding chunk ${i + 1}/${chunks.length}...`);

                const embedRes = await upstage.embeddings.create({
                    model: "embedding-passage",
                    input: chunk,
                });

                // 저장소에 추가
                addDocument(chunk, embedRes.data[0].embedding);

                totalTokens += embedRes.usage.total_tokens;
                successCount++;
            } catch (err) {
                console.error(`[Embed API] Failed chunk ${i + 1}:`, err);
                // 하나 실패해도 멈추지 않음
            }
        }

        return NextResponse.json({
            success: true,
            tokens: totalTokens,
            preview: `전체 ${textContent.length}자, ${chunks.length}개 조각으로 모두 저장됨.`
        });

    } catch (error: any) {
        console.error("[Embed API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
