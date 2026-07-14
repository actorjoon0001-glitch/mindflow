'use client';

import { useEffect } from 'react';

// 앱 설치(PWA)를 위해 서비스워커를 등록. 실패해도 앱 동작에는 영향 없음.
export function PWARegister() {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ });
    }
  }, []);
  return null;
}
