'use client';

import { create } from 'zustand';

const KEY = 'boss-mode';

interface BossModeState {
  active: boolean;
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
  hydrate: () => void;
}

function persist(active: boolean) {
  try {
    if (active) sessionStorage.setItem(KEY, '1');
    else sessionStorage.removeItem(KEY);
  } catch { /* storage unavailable */ }
}

export const useBossMode = create<BossModeState>((set, get) => ({
  active: false,
  activate: () => { persist(true); set({ active: true }); },
  deactivate: () => { persist(false); set({ active: false }); },
  toggle: () => (get().active ? get().deactivate() : get().activate()),
  hydrate: () => {
    try {
      if (sessionStorage.getItem(KEY) === '1') set({ active: true });
    } catch { /* storage unavailable */ }
  },
}));
