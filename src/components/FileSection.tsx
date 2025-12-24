"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface FileSectionProps {
    onUploadSuccess: (tokens: number) => void;
}

export default function FileSection({ onUploadSuccess }: FileSectionProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [statusMsg, setStatusMsg] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            console.log("File Selected:", selectedFile.name, selectedFile.size, "bytes");
            setFile(selectedFile);
            setStatus("idle");
            setStatusMsg("");
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert("파일을 먼저 선택해주세요.");
            return;
        }

        if (file.size === 0) {
            alert("파일 크기가 0 byte입니다. 올바른 파일을 선택해주세요.");
            return;
        }

        setIsUploading(true);
        setStatusMsg("문서 분석 및 임베딩 중...");
        setStatus("idle");

        try {
            const formData = new FormData();
            // 파일을 직접 append 합니다.
            formData.append("document", file);

            console.log("Uploading file:", file.name);

            const res = await fetch("/api/embed", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "업로드 실패");
            }

            setStatus("success");
            const estimatedTokens = data.tokens || 0;
            setStatusMsg(`임베딩 완료! (${estimatedTokens} 토큰)`);

            onUploadSuccess(estimatedTokens);
            setFile(null); // 성공 후 초기화
        } catch (error: any) {
            console.error("Upload Error:", error);
            setStatus("error");
            setStatusMsg(error.message || "처리 중 오류가 발생했습니다.");
        } finally {
            setIsUploading(false);
        }
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
                                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                                <p className="text-slate-600 font-medium">문서 선택 또는 드래그</p>
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
                    disabled={!file || isUploading}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                    {isUploading ? "처리 중..." : "임베딩 시작"}
                </button>
            </div>
        </div>
    );
}
