"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface FileSectionProps {
    onUploadSuccess: (tokens: number) => void;
}

export default function FileSection({ onUploadSuccess }: FileSectionProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [statusMsg, setStatusMsg] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            console.log(`Selected ${selectedFiles.length} files`);
            setFiles(selectedFiles);
            setStatus("idle");
            setStatusMsg("");
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            alert("파일을 먼저 선택해주세요.");
            return;
        }

        const validFiles = files.filter(f => f.size > 0);
        if (validFiles.length === 0) {
            alert("선택된 파일 크기가 0 byte입니다. 올바른 파일을 선택해주세요.");
            return;
        }

        setIsUploading(true);
        setStatus("idle");
        
        let totalEstimatedTokens = 0;
        let successCount = 0;

        for (let i = 0; i < validFiles.length; i++) {
            const currentFile = validFiles[i];
            setStatusMsg(`문서 분석 및 임베딩 중... (${i + 1}/${validFiles.length})`);
            
            try {
                const formData = new FormData();
                formData.append("document", currentFile);

                console.log(`Uploading file: ${currentFile.name}`);

                const res = await fetch("/api/embed", {
                    method: "POST",
                    body: formData,
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || `${currentFile.name} 업로드 실패`);
                }

                totalEstimatedTokens += (data.tokens || 0);
                successCount++;
            } catch (error: any) {
                console.error(`Error uploading ${currentFile.name}:`, error);
                // 진행 중 에러가 나면 일단 멈추거나 계속할지 결정할 수 있지만, 여기서는 바로 중단하고 에러 표시
                setStatus("error");
                setStatusMsg(`[${currentFile.name}] ${error.message || "처리 중 오류가 발생했습니다."}`);
                setIsUploading(false);
                return;
            }
        }

        setStatus("success");
        setStatusMsg(`총 ${successCount}개 파일 임베딩 완료! (${totalEstimatedTokens} 토큰)`);
        onUploadSuccess(totalEstimatedTokens);
        setFiles([]); // 성공 후 초기화
        setIsUploading(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5" />
                    문서 업로드
                </h2>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-center items-center gap-4">
                <div className="w-full relative">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.gif,.docx,.doc"
                        multiple // 다중 파일 선택 허용
                    />
                    <label
                        htmlFor="file-upload"
                        className={`border-2 border-dashed rounded-xl p-8 w-full flex flex-col items-center justify-center cursor-pointer transition-colors
                ${files.length > 0 ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"}`}
                    >
                        {files.length > 0 ? (
                            <>
                                <FileText className="w-10 h-10 text-blue-500 mb-2" />
                                <p className="font-medium text-slate-700">
                                    {files.length === 1 ? files[0].name : `${files[0].name} 외 ${files.length - 1}개`}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    총 {(files.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1)} KB
                                </p>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                                <p className="text-slate-600 font-medium">문서 선택 (다중 선택 가능)</p>
                                <p className="text-xs text-slate-400 mt-1">PDF, 이미지, DOCX 지원</p>
                            </>
                        )}
                    </label>
                </div>

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

                <button
                    onClick={handleUpload}
                    disabled={files.length === 0 || isUploading}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                    {isUploading ? "처리 중..." : "임베딩 시작"}
                </button>
            </div>
        </div>
    );
}
