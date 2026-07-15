'use client';

import { useEffect, useState } from 'react';
import { Bell, Share, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { subscribeToPush } from '@/lib/push-client';

// 아이폰 사용자를 위한 알림 설정 안내 배너.
// - 사파리 탭(홈 화면 미설치): 웹푸시가 불가능하므로 "홈 화면에 추가" 안내
// - 홈 화면 앱(standalone)인데 알림 권한 미허용: 탭 한 번으로 알림 켜기
// 안드로이드/데스크톱이거나 이미 알림이 켜진 경우엔 아무것도 표시하지 않는다.
export function IosPushGuide() {
  const user = useAuthStore((s) => s.user);
  const [mode, setMode] = useState<'install' | 'enable' | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    if (!isIOS) return; // 아이폰만 대상 (안드로이드는 브라우저 그대로 됨)

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (!standalone) {
      setMode('install'); // 사파리 탭 → 홈 화면 추가 안내
      return;
    }
    // 홈 화면 앱인데 아직 알림 권한이 없으면 켜기 유도
    if ('Notification' in window && Notification.permission !== 'granted') {
      setMode('enable');
    }
  }, [user]);

  const handleEnable = async () => {
    setLoading(true);
    setMsg('');
    const reason = await subscribeToPush();
    if (reason) {
      setMsg(reason);
      setLoading(false);
      return;
    }
    // 켜자마자 이 기기로 테스트 푸시를 보내 진동/알림을 바로 확인.
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setMsg('✅ 알림을 켰어요! 방금 테스트 알림이 진동과 함께 왔는지 확인해보세요 😊');
        setTimeout(() => setDismissed(true), 4000);
      } else {
        setMsg(data.reason || '⚠️ 알림 발송에 실패했어요. 잠시 후 다시 시도해보세요.');
      }
    } catch {
      setMsg('✅ 알림 권한을 켰어요! 이제 메시지 알림이 옵니다.');
      setTimeout(() => setDismissed(true), 4000);
    }
    setLoading(false);
  };

  if (!mode || dismissed) return null;

  return (
    <div className="mx-4 lg:mx-6 mt-3 rounded-xl border border-brand-500/40 bg-brand-500/10 p-3">
      <div className="flex items-start gap-2">
        <Bell size={18} className="text-brand-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          {mode === 'install' ? (
            <>
              <p className="text-sm font-medium text-gray-100">아이폰 알림을 받으려면 홈 화면에 추가하세요</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                사파리 하단의 <Share size={12} className="inline align-text-bottom" /> <b>공유</b> 버튼 → <b>&quot;홈 화면에 추가&quot;</b> →
                홈 화면의 <b>우리</b> 아이콘으로 앱을 열면 알림을 켤 수 있어요.
                <br />
                <span className="text-gray-500">(아이폰은 사파리 탭 상태에서는 알림이 오지 않아요)</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-100">알림을 켜면 메시지가 진동으로 와요</p>
              <p className="text-xs text-gray-400 mt-1">아래 버튼을 눌러 알림을 허용해주세요. 바로 테스트 알림도 보내드려요.</p>
              <button
                onClick={handleEnable}
                disabled={loading}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium disabled:opacity-60"
              >
                <Bell size={14} /> {loading ? '켜는 중…' : '알림 켜기'}
              </button>
              {msg && <p className={`text-xs mt-2 ${msg.startsWith('✅') ? 'text-emerald-400' : 'text-amber-400'}`}>{msg}</p>}
            </>
          )}
        </div>
        <button onClick={() => setDismissed(true)} className="text-gray-500 hover:text-gray-300 shrink-0" aria-label="닫기">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
