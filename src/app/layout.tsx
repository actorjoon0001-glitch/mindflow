import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PWARegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: '우리 - 둘만의 캘린더 · 지도 · 채팅',
  description: '커플을 위한 기념일 캘린더, 함께 가본 곳 지도 기록, 둘만의 채팅과 AI 데이트 추천',
  manifest: '/manifest.json',
  applicationName: '우리',
  appleWebApp: {
    capable: true,
    title: '우리',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
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
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
