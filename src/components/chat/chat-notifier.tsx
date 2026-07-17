'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { useNotifPrefs } from '@/stores/notif-prefs';
import { useSkin } from '@/stores/skin';
import { showLocalNotification } from '@/lib/notify';

// 디스크릿(업무 위장) 모드에서 쓰는 중립 알림
const WORK_ICON = '/icons/icon-work-192.png';

export function ChatNotifier() {
  const couple = useAuthStore((s) => s.couple);
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const { chatPreview, hydrate } = useNotifPrefs();
  const { discreet, hydrate: hydrateSkin } = useSkin();
  const pathname = usePathname();

  useEffect(() => { hydrate(); hydrateSkin(); }, [hydrate, hydrateSkin]);

  // 최신 값을 ref로 유지해 구독을 재생성하지 않도록.
  const ref = useRef({ pathname, chatPreview, partner, userId: user?.id, discreet });
  ref.current = { pathname, chatPreview, partner, userId: user?.id, discreet };

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
          const { userId, partner: p, pathname: path, chatPreview: preview, discreet: isDiscreet } = ref.current;
          if (!userId || msg.sender_id === userId) return; // 내가 보낸 건 알림 X
          // 지금 채팅을 보고 있으면 알림 X
          if (path.startsWith('/chat') && typeof document !== 'undefined' && document.visibilityState === 'visible') return;

          if (isDiscreet) {
            // 업무 위장: 하트·이름·내용 감추고 중립 아이콘/문구로.
            showLocalNotification('새 메시지', '새 메시지가 도착했습니다.', '/chat', { icon: WORK_ICON });
          } else if (preview) {
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
