import { NextResponse } from "next/server";
import OpenAI from "openai";

// Upstage 클라이언트 (임베딩용)
const upstage = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_UPSTAGE_API_KEY,
    baseURL: "https://api.upstage.ai/v1/solar"
});

// 간단한 인메모리 벡터 저장소 (프로토타입용)
// 실제 서비스에선 Pinecone, Supabase 등을 써야 함
let vectorStore: { text: string; embedding: number[] }[] = [];

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("document") as File;

        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        // 1. Document Parsing API 호출 (문서 -> 텍스트 변환)
        const parseFormData = new FormData();
        parseFormData.append("document", file);
        parseFormData.append("model", "document-parse");

        const parseRes = await fetch("https://api.upstage.ai/v1/document-digitization", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_UPSTAGE_API_KEY}` },
            body: parseFormData,
        });

        if (!parseRes.ok) throw new Error("Document parsing failed");

        const parseData = await parseRes.json();
        const textContent = parseData.content.text || "";

        if (!textContent) return NextResponse.json({ error: "No text extracted" }, { status: 400 });

        // 2. Embedding API 호출 (텍스트 -> 벡터 변환)
        // 텍스트가 너무 길면 잘라서 보내야 하지만, 여기선 앞부분 2000자만 예시로 처리
        const chunk = textContent.substring(0, 2000);

        const embedRes = await upstage.embeddings.create({
            model: "embedding-passage", // 문서용 모델
            input: chunk,
        });

        const embedding = embedRes.data[0].embedding;

        // 3. 인메모리 저장 (서버 재시작 시 초기화됨)
        vectorStore.push({ text: chunk, embedding });

        return NextResponse.json({
            success: true,
            tokens: embedRes.usage.total_tokens,
            textPreview: chunk.substring(0, 100) + "..."
        });

    } catch (error: any) {
        console.error("Embedding Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// 검색을 위한 함수 (다른 API에서 import해서 사용)
export function searchVectors(queryEmbedding: number[]) {
    // 코사인 유사도 계산
    return vectorStore.map(doc => {
        const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
        return { ...doc, similarity };
    })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3); // 상위 3개 문서 반환
}

function cosineSimilarity(a: number[], b: number[]) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magA * magB);
}
