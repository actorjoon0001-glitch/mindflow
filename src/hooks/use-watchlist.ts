'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { CoupleWatch, WatchPlatform, WatchStatus } from '@/types';

export function useWatchlist() {
  const [items, setItems] = useState<CoupleWatch[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const couple = useAuthStore((s) => s.couple);

  const fetchItems = useCallback(async () => {
    if (!couple) { setItems([]); setLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_watchlist')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, [couple]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (data: {
    title: string; platform: WatchPlatform; status: WatchStatus;
    rating?: number | null; review?: string | null; url?: string | null; watched_date?: string | null;
  }) => {
    if (!couple || !user || !data.title.trim()) return;
    const supabase = createClient();
    const { data: row } = await supabase
      .from('couple_watchlist')
      .insert({ couple_id: couple.id, user_id: user.id, ...data, title: data.title.trim() })
      .select()
      .single();
    if (row) setItems((prev) => [row, ...prev]);
  };

  const updateItem = async (id: string, patch: Partial<CoupleWatch>) => {
    const supabase = createClient();
    const { data: row } = await supabase
      .from('couple_watchlist')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (row) setItems((prev) => prev.map((i) => (i.id === id ? row : i)));
  };

  const deleteItem = async (id: string) => {
    const supabase = createClient();
    await supabase.from('couple_watchlist').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return { items, loading, addItem, updateItem, deleteItem };
}
