'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { CoupleBucketItem, BucketCategory } from '@/types';

export function useCoupleBucket() {
  const [items, setItems] = useState<CoupleBucketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const couple = useAuthStore((s) => s.couple);

  const fetchItems = useCallback(async () => {
    if (!couple) { setItems([]); setLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_bucket')
      .select('*')
      .eq('couple_id', couple.id)
      .order('done', { ascending: true })
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, [couple]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (title: string, category: BucketCategory) => {
    if (!couple || !user || !title.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_bucket')
      .insert({ couple_id: couple.id, created_by: user.id, title: title.trim(), category })
      .select()
      .single();
    if (data) setItems((prev) => [data, ...prev]);
  };

  const toggleItem = async (item: CoupleBucketItem) => {
    const supabase = createClient();
    const done = !item.done;
    const { data } = await supabase
      .from('couple_bucket')
      .update({ done, done_at: done ? new Date().toISOString() : null })
      .eq('id', item.id)
      .select()
      .single();
    if (data) setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
  };

  const deleteItem = async (id: string) => {
    const supabase = createClient();
    await supabase.from('couple_bucket').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return { items, loading, addItem, toggleItem, deleteItem };
}
