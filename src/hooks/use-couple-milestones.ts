'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { CoupleMilestone } from '@/types';

export function useCoupleMilestones() {
  const [milestones, setMilestones] = useState<CoupleMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const couple = useAuthStore((s) => s.couple);

  const fetchMilestones = useCallback(async () => {
    if (!couple) { setMilestones([]); setLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_milestones')
      .select('*')
      .eq('couple_id', couple.id)
      .order('date', { ascending: true });
    setMilestones(data || []);
    setLoading(false);
  }, [couple]);

  useEffect(() => { fetchMilestones(); }, [fetchMilestones]);

  const addMilestone = async (title: string, date: string, emoji: string) => {
    if (!couple || !user || !title.trim() || !date) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_milestones')
      .insert({ couple_id: couple.id, created_by: user.id, title: title.trim(), date, emoji: emoji || '💗' })
      .select()
      .single();
    if (data) setMilestones((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
  };

  const deleteMilestone = async (id: string) => {
    const supabase = createClient();
    await supabase.from('couple_milestones').delete().eq('id', id);
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  return { milestones, loading, addMilestone, deleteMilestone };
}
