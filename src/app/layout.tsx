import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Rate Your 회식",
  description: "회식 별점 평가 앱 - 회식 후 참여자들이 별점을 매기는 모바일 웹 앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-stone-50 min-h-screen">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
