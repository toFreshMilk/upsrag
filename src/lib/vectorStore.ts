import { RAG_CONFIG } from "@/lib/constants";
import fs from 'fs';
import path from 'path';

interface Document {
    text: string;
    embedding: number[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const VECTOR_FILE = path.join(DATA_DIR, 'vectors.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load vectors from file
function loadVectors(): Document[] {
    try {
        if (fs.existsSync(VECTOR_FILE)) {
            const data = fs.readFileSync(VECTOR_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("[VectorStore] Failed to load vectors:", error);
    }
    return [];
}

// Save vectors to file
function saveVectors(vectors: Document[]) {
    try {
        fs.writeFileSync(VECTOR_FILE, JSON.stringify(vectors, null, 2), 'utf-8');
    } catch (error) {
        console.error("[VectorStore] Failed to save vectors:", error);
    }
}

export function addDocument(text: string, embedding: number[]) {
    const vectors = loadVectors();
    vectors.push({ text, embedding });
    saveVectors(vectors);
    console.log(`[VectorStore] 문서 추가됨 (파일 저장). 현재 총 ${vectors.length}개`);
}

export function searchVectors(queryEmbedding: number[], topK = RAG_CONFIG.TOP_K) {
    const vectors = loadVectors();
    
    if (vectors.length === 0) {
        console.log("[VectorStore] 저장된 문서가 없습니다.");
        return [];
    }

    // 코사인 유사도 계산 후 정렬
    const results = vectors.map(doc => {
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
