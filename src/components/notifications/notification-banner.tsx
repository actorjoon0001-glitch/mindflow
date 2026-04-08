'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationBanner() {
  const { permission, enableNotifications } = useNotifications();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wasDismissed = localStorage.getItem('mindflow-notif-dismissed');
    if (permission === 'default' && !wasDismissed) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [permission]);

  const handleEnable = async () => {
    const success = await enableNotifications();
    if (success) setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('mindflow-notif-dismissed', 'true');
  };

  if (!show || dismissed || permission !== 'default') return null;

  return (
    <div className="mx-4 lg:mx-6 mt-4 p-4 rounded-xl bg-brand-600/10 border border-brand-500/20 flex items-center gap-4 animate-slide-up">
      <div className="p-2 rounded-lg bg-brand-500/20 shrink-0">
        <BellRing size={20} className="text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200">알림을 켜시겠어요?</p>
        <p className="text-xs text-gray-500 mt-0.5">할 일 마감, 일정 시작 전에 브라우저 알림을 보내드립니다.</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={handleDismiss}>나중에</Button>
        <Button size="sm" onClick={handleEnable}>
          <Bell size={14} /> 알림 켜기
        </Button>
      </div>
      <button onClick={handleDismiss} className="text-gray-600 hover:text-gray-400 shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}
