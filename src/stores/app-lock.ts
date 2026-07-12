'use client';

import { create } from 'zustand';

// 로컬 PIN 화면 잠금. PIN은 이 기기(localStorage)에만 SHA-256 해시로 저장되며,
// Supabase 로그인 비밀번호와는 완전히 별개입니다. (자리 비울 때 임시 잠금용)

const HASH_KEY = 'app-lock-pin';
const LOCKED_KEY = 'app-lock-locked';

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`couple-lock:v1:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface AppLockState {
  hasPin: boolean;
  locked: boolean;
  setupOpen: boolean;
  lockAfterSetup: boolean;
  hydrate: () => void;
  openSetup: (lockAfter?: boolean) => void;
  closeSetup: () => void;
  setPin: (pin: string) => Promise<void>;
  clearPin: () => void;
  lock: () => void;
  requestLock: () => void;
  unlock: (pin: string) => Promise<boolean>;
}

export const useAppLock = create<AppLockState>((set, get) => ({
  hasPin: false,
  locked: false,
  setupOpen: false,
  lockAfterSetup: false,

  hydrate: () => {
    try {
      const hasPin = !!localStorage.getItem(HASH_KEY);
      const locked = hasPin && localStorage.getItem(LOCKED_KEY) === '1';
      set({ hasPin, locked });
    } catch { /* storage unavailable */ }
  },

  openSetup: (lockAfter = false) => set({ setupOpen: true, lockAfterSetup: lockAfter }),
  closeSetup: () => set({ setupOpen: false, lockAfterSetup: false }),

  setPin: async (pin) => {
    const hash = await hashPin(pin);
    try { localStorage.setItem(HASH_KEY, hash); } catch { /* ignore */ }
    const lockAfter = get().lockAfterSetup;
    set({ hasPin: true, setupOpen: false, lockAfterSetup: false });
    if (lockAfter) get().lock();
  },

  clearPin: () => {
    try {
      localStorage.removeItem(HASH_KEY);
      localStorage.removeItem(LOCKED_KEY);
    } catch { /* ignore */ }
    set({ hasPin: false, locked: false });
  },

  lock: () => {
    if (!get().hasPin) return;
    try { localStorage.setItem(LOCKED_KEY, '1'); } catch { /* ignore */ }
    set({ locked: true });
  },

  requestLock: () => (get().hasPin ? get().lock() : get().openSetup(true)),

  unlock: async (pin) => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(HASH_KEY); } catch { /* ignore */ }
    if (!stored) { set({ locked: false }); return true; }
    const hash = await hashPin(pin);
    if (hash === stored) {
      try { localStorage.removeItem(LOCKED_KEY); } catch { /* ignore */ }
      set({ locked: false });
      return true;
    }
    return false;
  },
}));
