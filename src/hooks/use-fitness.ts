'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { CoupleWorkout, CoupleMeal, WorkoutBodyPart, MealType } from '@/types';

// 최근 N일치만 불러온다 (기본 60일).
function sinceDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function useFitness(rangeDays = 60) {
  const [workouts, setWorkouts] = useState<CoupleWorkout[]>([]);
  const [meals, setMeals] = useState<CoupleMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const couple = useAuthStore((s) => s.couple);

  const fetchAll = useCallback(async () => {
    if (!couple) { setWorkouts([]); setMeals([]); setLoading(false); return; }
    const supabase = createClient();
    const since = sinceDate(rangeDays);
    const [wRes, mRes] = await Promise.all([
      supabase.from('couple_workouts').select('*').eq('couple_id', couple.id).gte('date', since).order('date', { ascending: false }),
      supabase.from('couple_meals').select('*').eq('couple_id', couple.id).gte('date', since).order('date', { ascending: false }),
    ]);
    setWorkouts(wRes.data || []);
    setMeals(mRes.data || []);
    setLoading(false);
  }, [couple, rangeDays]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addWorkout = async (data: {
    date: string; body_parts: WorkoutBodyPart[];
    duration_min?: number | null; is_pt?: boolean; memo?: string | null;
  }) => {
    if (!couple || !user) return;
    const supabase = createClient();
    const { data: row } = await supabase
      .from('couple_workouts')
      .insert({ couple_id: couple.id, user_id: user.id, ...data })
      .select()
      .single();
    if (row) setWorkouts((prev) => [row, ...prev]);
  };

  const deleteWorkout = async (id: string) => {
    const supabase = createClient();
    await supabase.from('couple_workouts').delete().eq('id', id);
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const addMeal = async (data: {
    date: string; meal_type: MealType; content: string;
    calories?: number | null; photo_url?: string | null;
  }) => {
    if (!couple || !user) return;
    const supabase = createClient();
    const { data: row } = await supabase
      .from('couple_meals')
      .insert({ couple_id: couple.id, user_id: user.id, ...data })
      .select()
      .single();
    if (row) setMeals((prev) => [row, ...prev]);
  };

  const deleteMeal = async (id: string) => {
    const supabase = createClient();
    await supabase.from('couple_meals').delete().eq('id', id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  return { workouts, meals, loading, addWorkout, deleteWorkout, addMeal, deleteMeal };
}
