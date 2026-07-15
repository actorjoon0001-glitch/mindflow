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

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchAnswers(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', fetchAnswers);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', fetchAnswers);
    };
  }, [fetchAnswers]);

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

  // 실시간이 안 오는 경우(모바일 백그라운드 등) 대비: 창 복귀 시 새로고침.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchAnswers(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', fetchAnswers);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', fetchAnswers);
    };
  }, [fetchAnswers]);

  const submit = async (questionId: number, answer: string, guess: string): Promise<string | null> => {
    if (!couple || !user) return '로그인이 필요해요.';
    const supabase = createClient();
    const { error } = await supabase.from('couple_quiz_answers').upsert({ couple_id: couple.id, question_id: questionId, user_id: user.id, answer, guess });
    await fetchAnswers();
    return error ? (error.message || '저장에 실패했어요.') : null;
  };

  return { answers, submit, refresh: fetchAnswers };
}
