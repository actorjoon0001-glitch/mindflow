'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { CoupleEvent } from '@/types';

export function useCoupleEvents(range?: { start: string; end: string }) {
  const [events, setEvents] = useState<CoupleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const couple = useAuthStore((s) => s.couple);

  const fetchEvents = useCallback(async () => {
    if (!couple) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from('couple_events')
      .select('*')
      .eq('couple_id', couple.id)
      .order('start_time', { ascending: true });

    if (range?.start) query = query.gte('start_time', range.start);
    if (range?.end) query = query.lte('start_time', range.end);

    const { data } = await query;
    setEvents(data || []);
    setLoading(false);
  }, [couple, range?.start, range?.end]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (data: {
    title: string; start_time: string; end_time: string;
    description?: string; location?: string; color?: string;
    category?: CoupleEvent['category']; all_day?: boolean;
  }) => {
    if (!couple || !user) return null;
    const supabase = createClient();
    const { data: event } = await supabase
      .from('couple_events')
      .insert({ couple_id: couple.id, created_by: user.id, ...data })
      .select()
      .single();
    if (event) {
      setEvents((prev) => [...prev, event].sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ));
    }
    return event;
  };

  const deleteEvent = async (id: string) => {
    const supabase = createClient();
    await supabase.from('couple_events').delete().eq('id', id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return { events, loading, fetchEvents, createEvent, deleteEvent };
}
