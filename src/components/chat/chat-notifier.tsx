'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { useNotifPrefs } from '@/stores/notif-prefs';
import { showLocalNotification } from '@/lib/notify';

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
            showLocalNotification(`💬 ${name}`, body);
          } else {
            showLocalNotification('💬 새 메시지', '새 메시지가 도착했어요');
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [couple]);

  return null;
}
