'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { toDateStr } from '@/lib/couple-utils';

const today = () => toDateStr(new Date());

export function useDailyQuestion() {
  const couple = useAuthStore((s) => s.couple);
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const [answers, setAnswers] = useState<{ user_id: string; answer: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const date = today();

  const fetchAnswers = useCallback(async () => {
    if (!couple) { setAnswers([]); setLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_question_answers')
      .select('user_id, answer')
      .eq('couple_id', couple.id)
      .eq('question_date', date);
    setAnswers(data || []);
    setLoading(false);
  }, [couple, date]);

  useEffect(() => { fetchAnswers(); }, [fetchAnswers]);

  useEffect(() => {
    if (!couple) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`q_answers:${couple.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_question_answers', filter: `couple_id=eq.${couple.id}` }, () => fetchAnswers())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [couple, fetchAnswers]);

  // 실시간 미수신 대비: 창 복귀 시 새로고침.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchAnswers(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', fetchAnswers);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', fetchAnswers);
    };
  }, [fetchAnswers]);

  const myAnswer = answers.find((a) => a.user_id === user?.id)?.answer ?? null;
  const partnerAnswer = partner ? (answers.find((a) => a.user_id === partner.id)?.answer ?? null) : null;
  const bothAnswered = !!myAnswer && !!partnerAnswer;

  const submit = async (answer: string): Promise<string | null> => {
    if (!couple) return '커플 연결이 필요해요.';
    if (!user) return '로그인이 필요해요.';
    if (!answer.trim()) return '답변을 입력해주세요.';
    const supabase = createClient();
    const { error } = await supabase.from('couple_question_answers').upsert({
      couple_id: couple.id, question_date: date, user_id: user.id, answer: answer.trim(),
    });
    await fetchAnswers();
    return error ? (error.message || '저장에 실패했어요.') : null;
  };

  return { myAnswer, partnerAnswer, bothAnswered, loading, submit, hasPartner: !!partner };
}

export function useCoupleMood() {
  const couple = useAuthStore((s) => s.couple);
  const user = useAuthStore((s) => s.user);
  const partner = useAuthStore((s) => s.partner);
  const [moods, setMoods] = useState<{ user_id: string; emoji: string; note: string | null }[]>([]);
  const date = today();

  const fetchMoods = useCallback(async () => {
    if (!couple) { setMoods([]); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_moods')
      .select('user_id, emoji, note')
      .eq('couple_id', couple.id)
      .eq('date', date);
    setMoods(data || []);
  }, [couple, date]);

  useEffect(() => { fetchMoods(); }, [fetchMoods]);

  useEffect(() => {
    if (!couple) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`moods:${couple.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_moods', filter: `couple_id=eq.${couple.id}` }, () => fetchMoods())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [couple, fetchMoods]);

  const myMood = moods.find((m) => m.user_id === user?.id) ?? null;
  const partnerMood = partner ? (moods.find((m) => m.user_id === partner.id) ?? null) : null;

  const setMood = async (emoji: string, note?: string) => {
    if (!couple || !user) return;
    const supabase = createClient();
    await supabase.from('couple_moods').upsert({
      couple_id: couple.id, user_id: user.id, date, emoji, note: note ?? null,
    });
    fetchMoods();
  };

  return { myMood, partnerMood, setMood, hasPartner: !!partner };
}
