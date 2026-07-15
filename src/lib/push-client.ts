'use client';

import { createClient } from '@/lib/supabase/client';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

// 웹푸시 구독 후 서버에 저장. 성공 시 null, 실패 시 사유 문자열 반환.
export async function subscribeToPush(): Promise<string | null> {
  if (typeof window === 'undefined') return '지원되지 않는 환경이에요.';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return '이 브라우저는 푸시를 지원하지 않아요. (아이폰은 홈 화면에 앱을 추가해야 해요)';
  }
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) return '서버 푸시 키가 설정되지 않았어요. (VAPID 환경변수 필요)';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return '알림 권한이 거부됐어요.';

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid) as unknown as BufferSource,
    });
  }

  const json = sub.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const authKey = json.keys?.auth;
  if (!endpoint || !p256dh || !authKey) return '구독 정보를 만들지 못했어요.';

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return '로그인이 필요해요.';

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: user.id, endpoint, p256dh, auth: authKey }, { onConflict: 'endpoint' });
  if (error) return '구독 저장에 실패했어요.';

  return null;
}
