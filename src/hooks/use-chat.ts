'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
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

    // Get AI response via server API
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content }),
    });
    const response = await res.json();

    // Build assistant message with executed action info
    let assistantContent = response.content || '';
    if (response.executedActions?.length) {
      assistantContent += '\n\n✅ ' + response.executedActions.join('\n✅ ');
    }

    // Save assistant message
    const { data: assistantMsg } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        role: 'assistant' as const,
        content: assistantContent,
        metadata: { actions: response.actions, executedActions: response.executedActions },
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
