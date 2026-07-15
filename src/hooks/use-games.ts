'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

export type BalanceMap = Record<number, { user_id: string; choice: string }[]>;
export type QuizMap = Record<number, { user_id: string; answer: string; guess: string }[]>;

export function useBalanceGame() {
  const couple = useAuthStore((s) => s.couple);
  const user = useAuthStore((s) => s.user);
  const [answers, setAnswers] = useState<BalanceMap>({});

  const fetchAnswers = useCallback(async () => {
    if (!couple) { setAnswers({}); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_balance_answers')
      .select('question_id, user_id, choice')
      .eq('couple_id', couple.id);
    const map: BalanceMap = {};
    (data || []).forEach((r) => { (map[r.question_id] ||= []).push({ user_id: r.user_id, choice: r.choice }); });
    setAnswers(map);
  }, [couple]);

  useEffect(() => { fetchAnswers(); }, [fetchAnswers]);

  useEffect(() => {
    if (!couple) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`balance:${couple.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_balance_answers', filter: `couple_id=eq.${couple.id}` }, () => fetchAnswers())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [couple, fetchAnswers]);

  const submit = async (questionId: number, choice: string) => {
    if (!couple || !user) return;
    const supabase = createClient();
    await supabase.from('couple_balance_answers').upsert({ couple_id: couple.id, question_id: questionId, user_id: user.id, choice });
    fetchAnswers();
  };

  return { answers, submit };
}

export function useCoupleQuiz() {
  const couple = useAuthStore((s) => s.couple);
  const user = useAuthStore((s) => s.user);
  const [answers, setAnswers] = useState<QuizMap>({});

  const fetchAnswers = useCallback(async () => {
    if (!couple) { setAnswers({}); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_quiz_answers')
      .select('question_id, user_id, answer, guess')
      .eq('couple_id', couple.id);
    const map: QuizMap = {};
    (data || []).forEach((r) => { (map[r.question_id] ||= []).push({ user_id: r.user_id, answer: r.answer, guess: r.guess }); });
    setAnswers(map);
  }, [couple]);

  useEffect(() => { fetchAnswers(); }, [fetchAnswers]);

  useEffect(() => {
    if (!couple) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`quiz:${couple.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_quiz_answers', filter: `couple_id=eq.${couple.id}` }, () => fetchAnswers())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [couple, fetchAnswers]);

  const submit = async (questionId: number, answer: string, guess: string) => {
    if (!couple || !user) return;
    const supabase = createClient();
    await supabase.from('couple_quiz_answers').upsert({ couple_id: couple.id, question_id: questionId, user_id: user.id, answer, guess });
    fetchAnswers();
  };

  return { answers, submit };
}
