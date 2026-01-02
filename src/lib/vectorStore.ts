// 간단한 인메모리 벡터 저장소 (전역 변수 활용)

interface Document {
    text: string;
    embedding: number[];
}

// Next.js 개발 환경에서 HMR(Hot Module Replacement)로 인해
// 전역 변수가 초기화되는 것을 방지하기 위해 globalThis에 저장합니다.
const globalStore = global as unknown as { vectorStore: Document[] };

if (!globalStore.vectorStore) {
    globalStore.vectorStore = [];
}

// 외부에서 import해서 쓸 변수와 함수들
export const vectorStore = globalStore.vectorStore;

export function addDocument(text: string, embedding: number[]) {
    // 중복 방지를 위해 간단히 텍스트 길이 등으로 체크할 수도 있지만,
    // 여기서는 일단 무조건 추가합니다.
    vectorStore.push({ text, embedding });
    console.log(`[VectorStore] 문서 추가됨. 현재 총 ${vectorStore.length}개`);
}

export function searchVectors(queryEmbedding: number[], topK = 10) {
    if (vectorStore.length === 0) {
        console.log("[VectorStore] 저장된 문서가 없습니다.");
        return [];
    }

    // 코사인 유사도 계산 후 정렬
    const results = vectorStore.map(doc => {
        const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
        return { ...doc, similarity };
    })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

    return results;
}

// 코사인 유사도 계산 함수
function cosineSimilarity(a: number[], b: number[]) {
    if (a.length !== b.length) return 0;

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
}
