'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, CheckSquare, Calendar,
  Settings, LogOut, Heart, ChevronLeft, Map, MessageCircle, Sparkles, LayoutGrid, ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth-store';
import { useSkin } from '@/stores/skin';
import { NAV_ITEMS } from '@/lib/constants';

const icons: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, FileText, CheckSquare, Calendar, Settings, Heart, Map, MessageCircle, Sparkles, ListChecks,
};

const navItems = NAV_ITEMS.filter((item) => item.href !== '/settings');

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const { profile, signOut, couple } = useAuthStore();
  const discreet = useSkin((s) => s.discreet);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-full bg-surface border-r border-surface-300 flex flex-col transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-300">
        <div className={cn(
          'flex items-center justify-center w-9 h-9 rounded-xl text-white shrink-0',
          discreet ? 'bg-brand-600' : 'bg-gradient-to-br from-rose-500 to-pink-600'
        )}>
          {discreet ? <LayoutGrid size={18} /> : <Heart size={18} fill="currentColor" />}
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-gray-100 tracking-tight truncate">
            {discreet ? 'Workspace' : (couple?.couple_name || '우리')}
          </span>
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
          // 디스크릿 모드: 하트 홈 아이콘 → 중립 아이콘
          const Icon = discreet && item.icon === 'Heart' ? LayoutDashboard : icons[item.icon];
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
