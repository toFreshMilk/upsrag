export function splitTextIntoChunks(text: string, chunkSize = 2000, overlap = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        // 끝 지점 계산 (텍스트 길이 초과 방지)
        const end = Math.min(start + chunkSize, text.length);

        // 청크 생성
        let chunk = text.slice(start, end);

        // 마지막 청크가 아니면, 자연스러운 문장 끊기를 위해 마지막 공백/마침표 찾기 시도
        if (end < text.length) {
            const lastSpace = chunk.lastIndexOf(' ');
            if (lastSpace > chunkSize * 0.8) { // 80% 이상 지점에서 공백이 있으면 거기서 끊음
                chunk = chunk.slice(0, lastSpace);
                start += lastSpace + 1 - overlap; // 겹치게 이동
                chunks.push(chunk);
                continue;
            }
        }

        chunks.push(chunk);
        start += chunkSize - overlap; // 오버랩만큼 겹쳐서 다음 시작
    }

    return chunks;
}
