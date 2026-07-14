'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { useNotifPrefs } from '@/stores/notif-prefs';

// 상대가 채팅을 보내면 브라우저 알림. 기본은 내용을 가리고 "새 메시지"만 표시.
// (앱이 열려 있을 때 동작 — 완전히 종료된 상태 푸시는 추후 web-push 필요)
function notify(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'couple-chat',
        data: { url: '/chat' },
      }))
      .catch(() => { /* ignore */ });
  } else {
    try { new Notification(title, { body, icon: '/icons/icon-192.png' }); } catch { /* ignore */ }
  }
}

export function ChatNotifier() {
  const couple = useAuthStore((s) => s.couple);
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const { chatPreview, hydrate } = useNotifPrefs();
  const pathname = usePathname();

  useEffect(() => { hydrate(); }, [hydrate]);

  // 최신 값을 ref로 유지해 구독을 재생성하지 않도록.
  const ref = useRef({ pathname, chatPreview, partner, userId: user?.id });
  ref.current = { pathname, chatPreview, partner, userId: user?.id };

  useEffect(() => {
    if (!couple) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat_notify:${couple.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'couple_messages', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          const msg = payload.new as { sender_id: string; content: string; image_url: string | null };
          const { userId, partner: p, pathname: path, chatPreview: preview } = ref.current;
          if (!userId || msg.sender_id === userId) return; // 내가 보낸 건 알림 X
          // 지금 채팅을 보고 있으면 알림 X
          if (path.startsWith('/chat') && typeof document !== 'undefined' && document.visibilityState === 'visible') return;

          if (preview) {
            const name = p?.full_name || p?.email || '메시지';
            const body = msg.image_url ? '사진을 보냈어요 📷' : (msg.content || '새 메시지');
            notify(`💬 ${name}`, body);
          } else {
            notify('💬 새 메시지', '새 메시지가 도착했어요');
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [couple]);

  return null;
}
