import { NextResponse } from "next/server";
import OpenAI from "openai";

// Upstage Solar 클라이언트 설정
const solar = new OpenAI({
    apiKey: process.env.UPSTAGE_API_KEY,
    baseURL: "https://api.upstage.ai/v1/solar" // 기본 URL
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages } = body;

        // Solar Reasoning 모델 호출
        const completion = await solar.chat.completions.create({
            model: "solar-pro2", // 최신 Reasoning 지원 모델
            messages: [
                { role: "system", content: "당신은 깊이 생각하고 논리적으로 답변하는 Solar AI입니다." },
                ...messages
            ],
            reasoning_effort: "high", // 추론 강도 설정 (low, medium, high)
            stream: false,
        });

        const answer = completion.choices[0].message;
        const usage = completion.usage;

        return NextResponse.json({
            content: answer.content,
            usage: usage
        });

    } catch (error: any) {
        console.error("Solar API Error:", error);
        return NextResponse.json(
            { error: "Solar API 호출 실패", details: error.message },
            { status: 500 }
        );
    }
}
