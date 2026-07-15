'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { CoupleAiMessage } from '@/types';

export function useChat() {
  const [messages, setMessages] = useState<CoupleAiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const couple = useAuthStore((s) => s.couple);

  const fetchMessages = useCallback(async () => {
    if (!couple) { setMessages([]); setInitialLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_ai_messages')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages(data || []);
    setInitialLoading(false);
  }, [couple]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // 커플이 함께 보도록 실시간 동기화 (상대가 물어본 추천도 바로 보임).
  useEffect(() => {
    if (!couple) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`ai_chat:${couple.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'couple_ai_messages', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          const m = payload.new as CoupleAiMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'couple_ai_messages', filter: `couple_id=eq.${couple.id}` },
        () => fetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [couple, fetchMessages]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchMessages(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', fetchMessages);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', fetchMessages);
    };
  }, [fetchMessages]);

  const insert = async (role: 'user' | 'assistant', content: string) => {
    if (!couple || !user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_ai_messages')
      .insert({ couple_id: couple.id, user_id: user.id, role, content })
      .select()
      .single();
    if (data) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
  };

  const sendMessage = async (content: string, includeChat = true) => {
    if (!user || !couple || !content.trim()) return;
    setLoading(true);

    await insert('user', content);

    let assistantContent = '';
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, includeChat }),
      });
      const response = await res.json();
      assistantContent = response.content || 'AI 응답을 불러오지 못했어요.';
      if (response.executedActions?.length) {
        assistantContent += '\n\n✅ ' + response.executedActions.join('\n✅ ');
      }
    } catch {
      assistantContent = 'AI 응답을 불러오지 못했어요. 잠시 후 다시 시도해주세요.';
    }

    await insert('assistant', assistantContent);
    setLoading(false);
  };

  const clearChat = async () => {
    if (!couple) return;
    const supabase = createClient();
    await supabase.from('couple_ai_messages').delete().eq('couple_id', couple.id);
    setMessages([]);
  };

  return { messages, loading, initialLoading, sendMessage, clearChat, myId: user?.id };
}
