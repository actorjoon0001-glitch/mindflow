'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { Task, TaskStatus } from '@/types';

export function useTasks(filter?: { status?: TaskStatus }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    const { data } = await query;
    setTasks(data || []);
    setLoading(false);
  }, [user, filter?.status]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data: { title: string; priority?: string; due_date?: string; note_id?: string }) => {
    if (!user) return null;
    const supabase = createClient();
    const { data: task } = await supabase
      .from('tasks')
      .insert({ user_id: user.id, ...data })
      .select()
      .single();
    if (task) setTasks((prev) => [task, ...prev]);
    return task;
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    const supabase = createClient();
    if (data.status === 'done') {
      data.completed_at = new Date().toISOString();
    }
    const { data: updated } = await supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  };

  const deleteTask = async (id: string) => {
    const supabase = createClient();
    await supabase.from('tasks').delete().eq('id', id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return { tasks, loading, fetchTasks, createTask, updateTask, deleteTask };
}
