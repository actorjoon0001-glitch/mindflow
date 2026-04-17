'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, CheckSquare, Calendar,
  Bot, Settings, LogOut, Brain, ChevronLeft, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth-store';

const icons: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, FileText, CheckSquare, Calendar, Bot, Settings, Clock,
};

const navItems = [
  { label: '대시보드', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: '메모', href: '/notes', icon: 'FileText' },
  { label: '할 일', href: '/tasks', icon: 'CheckSquare' },
  { label: '캘린더', href: '/calendar', icon: 'Calendar' },
  { label: '근태관리', href: '/attendance', icon: 'Clock' },
  { label: 'AI 비서', href: '/assistant', icon: 'Bot' },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuthStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-full bg-surface border-r border-surface-300 flex flex-col transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-300">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white shrink-0">
          <Brain size={20} />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-gray-100 tracking-tight">MindFlow</span>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'ml-auto p-1.5 rounded-lg hover:bg-surface-200 text-gray-500 hover:text-gray-300 transition-all',
            collapsed && 'ml-0'
          )}
        >
          <ChevronLeft size={16} className={cn('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = icons[item.icon];
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-600/15 text-brand-400'
                  : 'text-gray-400 hover:bg-surface-200 hover:text-gray-200'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-surface-300 p-3 space-y-2">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
            pathname === '/settings'
              ? 'bg-brand-600/15 text-brand-400'
              : 'text-gray-400 hover:bg-surface-200 hover:text-gray-200'
          )}
        >
          <Settings size={20} className="shrink-0" />
          {!collapsed && <span>설정</span>}
        </Link>

        <div className={cn('flex items-center gap-3 px-3 py-2', collapsed && 'justify-center')}>
          <Avatar name={profile?.full_name || profile?.email || 'U'} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {profile?.full_name || '사용자'}
              </p>
              <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg hover:bg-surface-200 text-gray-500 hover:text-red-400 transition-colors"
              title="로그아웃"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
