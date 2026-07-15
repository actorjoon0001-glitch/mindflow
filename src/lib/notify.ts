// 로컬 브라우저 알림 표시 (서비스워커 우선). 알림 미지원/미허용 시 사유 반환.
export function showLocalNotification(title: string, body: string, url = '/chat'): string | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return '이 브라우저는 알림을 지원하지 않아요. (아이폰은 홈 화면에 앱을 추가해야 알림이 됩니다)';
  }
  if (Notification.permission !== 'granted') {
    return '알림 권한이 허용되지 않았어요. 헤더의 🔔 버튼으로 허용해주세요.';
  }
  // vibrate: 모바일에서 진동. TS의 NotificationOptions에는 vibrate가 빠져있어 타입 확장.
  const options: NotificationOptions & { vibrate?: number[] } = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'couple-chat',
    data: { url },
    vibrate: [200, 100, 200],
  };
  // 알림과 별개로 기기 진동도 직접 한 번 울려줌(모바일 브라우저 호환).
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* ignore */ }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(title, options))
      .catch(() => {
        try { new Notification(title, options); } catch { /* ignore */ }
      });
  } else {
    try { new Notification(title, options); } catch { /* ignore */ }
  }
  return null;
}
