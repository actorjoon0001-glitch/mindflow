'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { Note } from '@/types';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });
    setNotes(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = async (data: { title: string; content: string; tags?: string[] }) => {
    if (!user) return null;
    const supabase = createClient();
    const { data: note, error } = await supabase
      .from('notes')
      .insert({ user_id: user.id, ...data })
      .select()
      .single();
    if (!error && note) {
      setNotes((prev) => [note, ...prev]);
    }
    return note;
  };

  const updateNote = async (id: string, data: Partial<Note>) => {
    const supabase = createClient();
    const { data: updated } = await supabase
      .from('notes')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (updated) {
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    }
    return updated;
  };

  const deleteNote = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notes').delete().eq('id', id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return { notes, loading, fetchNotes, createNote, updateNote, deleteNote };
}

export function useNote(id: string) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase.from('notes').select('*').eq('id', id).single();
      setNote(data);
      setLoading(false);
    }
    fetch();
  }, [id]);

  return { note, setNote, loading };
}
