'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { subscribeToPush } from '@/lib/push-client';

// 알림 권한이 이미 허용된 기기라면, 앱을 열 때마다 푸시 구독을 자동 등록/갱신한다.
// (설정 화면의 "푸시 켜기"를 따로 누르지 않아도 상대 메시지 알림이 오도록)
// 권한이 아직 'default'인 경우엔 여기서 요청하지 않는다 → 원치 않는 권한 팝업 방지.
export function PushAutoSubscribe() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'granted') return;

    // 이미 허용된 상태 → subscribeToPush()는 권한 팝업 없이 조용히 구독을 만들고 DB에 저장.
    subscribeToPush().catch(() => { /* 조용히 무시 */ });
  }, [user]);

  return null;
}
