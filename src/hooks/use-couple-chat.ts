'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { CoupleMessage } from '@/types';

export function useCoupleChat() {
  const [messages, setMessages] = useState<CoupleMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [partnerReadAt, setPartnerReadAt] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const couple = useAuthStore((s) => s.couple);
  const partner = useAuthStore((s) => s.partner);

  // 내가 지금 채팅을 봤다고 기록 → 상대 화면의 "1" 이 사라짐.
  const markRead = useCallback(async () => {
    if (!couple || !user) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    const supabase = createClient();
    await supabase
      .from('couple_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('couple_id', couple.id)
      .eq('user_id', user.id);
  }, [couple, user]);

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

  const fetchPartnerRead = useCallback(async () => {
    if (!couple || !partner) { setPartnerReadAt(null); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_members')
      .select('last_read_at')
      .eq('couple_id', couple.id)
      .eq('user_id', partner.id)
      .maybeSingle();
    setPartnerReadAt(data?.last_read_at ?? null);
  }, [couple, partner]);

  useEffect(() => {
    fetchMessages();
    fetchPartnerRead();
    markRead();
  }, [fetchMessages, fetchPartnerRead, markRead]);

  // 창을 다시 볼 때 읽음 처리
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') markRead(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', markRead);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', markRead);
    };
  }, [markRead]);

  // Realtime — 새 메시지 + 상대 읽음 상태.
  useEffect(() => {
    if (!couple) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`couple_chat:${couple.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'couple_messages', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          const msg = payload.new as CoupleMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          // 상대가 보낸 새 메시지를 내가 보고 있으면 읽음 처리
          if (msg.sender_id !== user?.id) markRead();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'couple_members', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          const row = payload.new as { user_id: string; last_read_at: string };
          if (partner && row.user_id === partner.id) setPartnerReadAt(row.last_read_at);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple, partner, user, markRead]);

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

  return { messages, loading, sending, partnerReadAt, sendMessage, sendImage, fetchMessages };
}
