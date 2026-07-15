'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Bell, BellOff, Briefcase, Lock, PanelRightOpen, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/use-notifications';
import { subscribeToPush } from '@/lib/push-client';
import { useBossMode } from '@/stores/boss-mode';
import { useAppLock } from '@/stores/app-lock';
import { useSkin } from '@/stores/skin';

const pageNames: Record<string, string> = {
  '/dashboard': '홈',
  '/today': '오늘의 우리',
  '/calendar': '캘린더',
  '/map': '지도',
  '/album': '사진첩',
  '/chat': '채팅',
  '/bucket': '버킷리스트',
  '/games': '커플 게임',
  '/assistant': 'AI 추천',
  '/notes': '메모',
  '/tasks': '할 일',
  '/settings': '설정',
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const title = Object.entries(pageNames).find(([key]) => pathname.startsWith(key))?.[1] || '';
  const { permission, enableNotifications } = useNotifications();
  const activateBoss = useBossMode((s) => s.activate);
  const requestLock = useAppLock((s) => s.requestLock);
  const { discreet, toggle: toggleSkin, hydrate: hydrateSkin } = useSkin();

  // 스킨/잠금 상태를 이 기기 저장값에서 복원.
  useEffect(() => { hydrateSkin(); }, [hydrateSkin]);

  // 디스크릿 모드: 상단 테마색(PWA 타이틀바)·창 제목을 무채색/중립으로.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', discreet ? '#0f0f14' : '#ec4899');
    document.title = discreet ? 'Workspace' : '우리 - 둘만의 캘린더 · 지도 · 채팅';
  }, [discreet]);

  const handleBellClick = async () => {
    if (permission !== 'granted') {
      await enableNotifications();
    }
    // 권한 허용과 별개로 웹푸시 구독까지 등록해야 앱을 꺼도 상대 메시지 알림이 온다.
    subscribeToPush().catch(() => { /* 조용히 무시 */ });
  };

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
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-200"
          title={discreet ? '커플 테마로 보기' : '디스크릿 모드 (업무용처럼 보이기)'}
          onClick={toggleSkin}
        >
          {discreet ? <EyeOff size={18} /> : <Eye size={18} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-200"
          title="화면 잠금 (자리 비울 때)"
          onClick={requestLock}
        >
          <Lock size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-200"
          title="업무 화면으로 전환 (Ctrl/⌘+B, 해제: Esc)"
          onClick={activateBoss}
        >
          <Briefcase size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400"
          title="미니 창 열기"
          onClick={() => window.open('/mini', 'mindflow-mini', 'width=360,height=520,top=100,right=100,resizable=yes')}
        >
          <PanelRightOpen size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 relative"
          onClick={handleBellClick}
          title={permission === 'granted' ? '알림 활성화됨' : '알림 켜기'}
        >
          {permission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
          {permission === 'granted' && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
          )}
        </Button>
      </div>
    </header>
  );
}
