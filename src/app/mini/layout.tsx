import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'MindFlow Mini',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f0f14',
};

export default function MiniLayout({ children }: { children: React.ReactNode }) {
  return children;
}
