'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { aiProvider } from '@/lib/ai/provider';
import type { ChatMessage } from '@/types';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages(data || []);
    setInitialLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;
    setLoading(true);

    const supabase = createClient();

    // Save user message
    const { data: userMsg } = await supabase
      .from('chat_messages')
      .insert({ user_id: user.id, role: 'user' as const, content })
      .select()
      .single();

    if (userMsg) setMessages((prev) => [...prev, userMsg]);

    // Get AI response
    const response = await aiProvider.chat({ message: content });

    // Save assistant message
    const { data: assistantMsg } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        role: 'assistant' as const,
        content: response.content,
        metadata: { actions: response.actions },
      })
      .select()
      .single();

    if (assistantMsg) setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  };

  const clearChat = async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('chat_messages').delete().eq('user_id', user.id);
    setMessages([]);
  };

  return { messages, loading, initialLoading, sendMessage, clearChat };
}
