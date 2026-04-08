'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { CalendarEvent } from '@/types';

export function useEvents(range?: { start: string; end: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: true });

    if (range?.start) query = query.gte('start_time', range.start);
    if (range?.end) query = query.lte('start_time', range.end);

    const { data } = await query;
    setEvents(data || []);
    setLoading(false);
  }, [user, range?.start, range?.end]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (data: {
    title: string; start_time: string; end_time: string;
    description?: string; location?: string; color?: string; all_day?: boolean;
  }) => {
    if (!user) return null;
    const supabase = createClient();
    const { data: event } = await supabase
      .from('events')
      .insert({ user_id: user.id, ...data })
      .select()
      .single();
    if (event) setEvents((prev) => [...prev, event].sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ));
    return event;
  };

  const updateEvent = async (id: string, data: Partial<CalendarEvent>) => {
    const supabase = createClient();
    const { data: updated } = await supabase
      .from('events')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (updated) {
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    }
    return updated;
  };

  const deleteEvent = async (id: string) => {
    const supabase = createClient();
    await supabase.from('events').delete().eq('id', id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return { events, loading, fetchEvents, createEvent, updateEvent, deleteEvent };
}
