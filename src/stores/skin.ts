'use client';

import { create } from 'zustand';

// 디스크릿(업무용) 스킨. 켜면 하트·핑크·커플명을 감춰 평범한 업무 툴처럼 보이게 함.
// 이 기기(localStorage)에만 저장되며 언제든 토글 가능.

const KEY = 'app-skin-discreet';

interface SkinState {
  discreet: boolean;
  hydrate: () => void;
  toggle: () => void;
  setDiscreet: (v: boolean) => void;
}

function persist(v: boolean) {
  try {
    if (v) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch { /* storage unavailable */ }
}

export const useSkin = create<SkinState>((set, get) => ({
  discreet: false,
  hydrate: () => {
    try {
      if (localStorage.getItem(KEY) === '1') set({ discreet: true });
    } catch { /* storage unavailable */ }
  },
  toggle: () => {
    const v = !get().discreet;
    persist(v);
    set({ discreet: v });
  },
  setDiscreet: (v) => {
    persist(v);
    set({ discreet: v });
  },
}));
