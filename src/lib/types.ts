// lib/types.ts
/**
 * 임베딩 API 응답 타입
 */
export interface EmbeddingResponse {
    embedding: number[];  // 임베딩 벡터
    model: string;       // 사용된 모델 이름
    usage: {
        prompt_tokens: number;  // 프롬프트 토큰 수
        total_tokens: number;   // 총 토큰 수
    };
}

/**
 * LLM 생성 API 응답 타입
 */
export interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: [{
        index: number;
        message: {
            role: string;      // 역할 (system/user/assistant)
            content: string;  // 생성 내용
        };
        finish_reason: string;  // 생성 종료 이유
    }];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * 벡터 DB 검색 결과 타입
 */
export interface VectorDBResult {
    matches: Array<{
        id: string;                  // 문서 ID
        score: number;              // 유사도 점수
        metadata: {
            source: string;           // 문서 출처
            text: string;             // 문서 텍스트
        };
    }>;
}

/**
 * 문서 메타데이터 타입
 */
export interface DocumentMetadata {
    source: string;  // 문서 경로
    text: string;    // 문서 텍스트
}