const CACHE_NAME = 'mindflow-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'MindFlow', body: '새로운 알림이 있습니다.', url: '/dashboard' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'mindflow-notification',
    data: { url: data.url || '/dashboard' },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: '열기' },
      { action: 'dismiss', title: '닫기' },
    ],
  };

  // 앱이 열려(포커스) 있으면 서버 푸시 알림은 띄우지 않는다.
  // → 인앱 알림(ChatNotifier)이 처리하므로 중복 방지 + 디스크릿(업무 위장) 모드가 깨지지 않음.
  event.waitUntil((async () => {
    const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const focused = clientsArr.some((c) => c.focused || c.visibilityState === 'visible');
    if (focused) return;
    await self.registration.showNotification(data.title, options);
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
