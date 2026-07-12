import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '우리 - 둘만의 캘린더 · 지도 · 채팅',
  description: '커플을 위한 기념일 캘린더, 함께 가본 곳 지도 기록, 둘만의 채팅과 AI 데이트 추천',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ec4899',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
