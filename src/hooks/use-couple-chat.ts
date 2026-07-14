'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { CoupleMessage } from '@/types';

export function useCoupleChat() {
  const [messages, setMessages] = useState<CoupleMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const user = useAuthStore((s) => s.user);
  const couple = useAuthStore((s) => s.couple);

  const fetchMessages = useCallback(async () => {
    if (!couple) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_messages')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: true })
      .limit(500);
    setMessages(data || []);
    setLoading(false);
  }, [couple]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription — new messages from either partner appear instantly.
  useEffect(() => {
    if (!couple) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`couple_messages:${couple.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'couple_messages',
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => {
          const msg = payload.new as CoupleMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple]);

  const sendMessage = async (content: string) => {
    if (!couple || !user || !content.trim()) return;
    setSending(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_messages')
      .insert({ couple_id: couple.id, sender_id: user.id, content: content.trim() })
      .select()
      .single();
    if (data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
    }
    setSending(false);
  };

  const sendImage = async (file: File): Promise<string | null> => {
    if (!couple || !user) return null;
    if (!file.type.startsWith('image/')) return '이미지 파일만 보낼 수 있어요.';
    if (file.size > 10 * 1024 * 1024) return '10MB 이하 이미지만 보낼 수 있어요.';

    setSending(true);
    const supabase = createClient();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${couple.id}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('chat-images')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (upErr) {
      setSending(false);
      return '사진 업로드에 실패했어요.';
    }

    const { data: pub } = supabase.storage.from('chat-images').getPublicUrl(path);
    const { data } = await supabase
      .from('couple_messages')
      .insert({ couple_id: couple.id, sender_id: user.id, content: '', image_url: pub.publicUrl })
      .select()
      .single();

    if (data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
    }
    setSending(false);
    return null;
  };

  return { messages, loading, sending, sendMessage, sendImage, fetchMessages };
}
