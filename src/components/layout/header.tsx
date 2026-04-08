'use client';

import { usePathname } from 'next/navigation';
import { Menu, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pageNames: Record<string, string> = {
  '/dashboard': '대시보드',
  '/notes': '메모',
  '/tasks': '할 일',
  '/calendar': '캘린더',
  '/assistant': 'AI 비서',
  '/settings': '설정',
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const title = Object.entries(pageNames).find(([key]) => pathname.startsWith(key))?.[1] || '';

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-surface-300 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-surface-200 text-gray-400"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-100">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Search size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </Button>
      </div>
    </header>
  );
}
