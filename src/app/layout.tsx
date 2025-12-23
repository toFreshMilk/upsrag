import type { Metadata } from "next";
import "./globals.css"; // 이 부분이 필수입니다!

export const metadata: Metadata = {
  title: "Upstage RAG Prototype",
  description: "Solar LLM Document Embedding & Chat",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="ko">
      <body>{children}</body>
      </html>
  );
}
