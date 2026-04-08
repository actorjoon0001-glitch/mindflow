'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, CheckSquare, Calendar, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { label: '대시보드', href: '/dashboard', Icon: LayoutDashboard },
  { label: '메모', href: '/notes', Icon: FileText },
  { label: '할 일', href: '/tasks', Icon: CheckSquare },
  { label: '캘린더', href: '/calendar', Icon: Calendar },
  { label: 'AI 비서', href: '/assistant', Icon: Bot },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface border-t border-surface-300 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ label, href, Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors',
                isActive ? 'text-brand-400' : 'text-gray-500'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
