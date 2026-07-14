// 로컬 브라우저 알림 표시 (서비스워커 우선). 알림 미지원/미허용 시 사유 반환.
export function showLocalNotification(title: string, body: string, url = '/chat'): string | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return '이 브라우저는 알림을 지원하지 않아요. (아이폰은 홈 화면에 앱을 추가해야 알림이 됩니다)';
  }
  if (Notification.permission !== 'granted') {
    return '알림 권한이 허용되지 않았어요. 헤더의 🔔 버튼으로 허용해주세요.';
  }
  const options: NotificationOptions = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'couple-chat',
    data: { url },
  };
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
