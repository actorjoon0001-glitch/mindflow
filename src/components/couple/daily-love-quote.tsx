'use client';

import { useEffect, useMemo, useState } from 'react';
import { Heart, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getDailyQuote } from '@/lib/love-quotes';
import { toDateStr } from '@/lib/couple-utils';
import { useNotifications } from '@/hooks/use-notifications';

const STORAGE_KEY = 'daily-love-quote-notified';

export function DailyLoveQuote() {
  const quote = useMemo(() => getDailyQuote(), []);
  const { permission, enableNotifications, sendNotification } = useNotifications();
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  // 하루 한 번, 알림 권한이 있으면 오늘의 문구를 푸시로 보냄.
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const today = toDateStr(new Date());
    if (localStorage.getItem(STORAGE_KEY) === today) return;
    sendNotification('💌 오늘의 한마디', quote, '/dashboard');
    localStorage.setItem(STORAGE_KEY, today);
  }, [quote, sendNotification]);

  return (
    <Card className="bg-gradient-to-br from-rose-950/40 via-pink-950/30 to-surface-50 border-rose-900/40">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-rose-500/20 shrink-0">
          <Heart size={18} className="text-rose-400" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-rose-300/80 mb-1">💌 오늘의 한마디</p>
          <p className="text-sm text-gray-100 leading-relaxed">{quote}</p>
          {ready && permission !== 'granted' && permission !== 'unsupported' && (
            <button
              onClick={enableNotifications}
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200 transition-colors"
            >
              <Bell size={11} /> 매일 아침 알림 받기
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
