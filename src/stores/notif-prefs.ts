'use client';

import { create } from 'zustand';

// 채팅 알림 설정. 기본은 내용 숨김(카카오톡의 '내용 가리기'처럼).
const KEY = 'chat-notif-preview';

interface NotifPrefsState {
  chatPreview: boolean; // true면 알림에 메시지 내용 표시
  hydrate: () => void;
  toggle: () => void;
}

export const useNotifPrefs = create<NotifPrefsState>((set, get) => ({
  chatPreview: false,
  hydrate: () => {
    try { set({ chatPreview: localStorage.getItem(KEY) === '1' }); } catch { /* ignore */ }
  },
  toggle: () => {
    const v = !get().chatPreview;
    try { v ? localStorage.setItem(KEY, '1') : localStorage.removeItem(KEY); } catch { /* ignore */ }
    set({ chatPreview: v });
  },
}));
