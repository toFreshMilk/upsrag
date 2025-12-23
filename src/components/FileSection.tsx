"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// Props 인터페이스 추가
interface FileSectionProps {
    onUploadSuccess: (tokens: number) => void;
}

export default function FileSection({ onUploadSuccess }: FileSectionProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [statusMsg, setStatusMsg] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setStatus("idle");
            setStatusMsg("");
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setStatusMsg("문서 분석 및 임베딩 중...");

        try {
            const formData = new FormData();
            formData.append("document", file);

            const res = await fetch("/api/embed", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("업로드 실패");

            const data = await res.json();
            setStatus("success");

            // 토큰 수 계산 (텍스트 길이를 대략 4로 나누거나, 서버에서 정확한 토큰 수 반환 필요)
            // 여기서는 텍스트 길이의 0.25배로 추정
            const estimatedTokens = data.text ? Math.ceil(data.text.length * 0.25) : 0;

            setStatusMsg(`임베딩 완료!`);

            // 부모에게 알림
            onUploadSuccess(estimatedTokens);

            setFile(null);
        } catch (error) {
            console.error(error);
            setStatus("error");
            setStatusMsg("처리 중 오류가 발생했습니다.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        // ... (기존 JSX와 동일, 변경 없음)
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            {/* 헤더 */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5" />
                    문서 업로드
                </h2>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-center items-center gap-4">
                {/* 드래그 앤 드롭 영역 */}
                <div className="w-full relative">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.gif"
                    />
                    <label
                        htmlFor="file-upload"
                        className={`border-2 border-dashed rounded-xl p-8 w-full flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${file ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"}`}
                    >
                        {file ? (
                            <>
                                <FileText className="w-10 h-10 text-blue-500 mb-2" />
                                <p className="font-medium text-slate-700">{file.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                                <p className="text-slate-600 font-medium">문서 선택 또는 드래그</p>
                                <p className="text-xs text-slate-400 mt-1">PDF, 이미지 파일 지원</p>
                            </>
                        )}
                    </label>
                </div>

                {/* 상태 메시지 */}
                {statusMsg && (
                    <div className={`flex items-center gap-2 text-sm p-3 rounded-lg w-full
                ${status === 'success' ? 'bg-green-50 text-green-700' :
                        status === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                        {status === 'success' && <CheckCircle className="w-4 h-4" />}
                        {status === 'error' && <AlertCircle className="w-4 h-4" />}
                        {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {statusMsg}
                    </div>
                )}

                {/* 전송 버튼 */}
                <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                    {isUploading ? "처리 중..." : "임베딩 시작"}
                </button>
            </div>
        </div>
    );
}
