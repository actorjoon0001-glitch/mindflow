'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

export interface AlbumPhoto {
  key: string;
  id: string | null; // couple_photos.id (앨범 업로드만 삭제 가능)
  url: string;
  caption: string | null;
  date: string; // ISO (taken_date 또는 created_at)
  source: 'album' | 'chat';
}

export function useCoupleAlbum() {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const couple = useAuthStore((s) => s.couple);

  const fetchPhotos = useCallback(async () => {
    if (!couple) { setPhotos([]); setLoading(false); return; }
    const supabase = createClient();
    const [albumRes, chatRes] = await Promise.all([
      supabase.from('couple_photos').select('*').eq('couple_id', couple.id),
      supabase.from('couple_messages').select('id, image_url, created_at').eq('couple_id', couple.id).not('image_url', 'is', null),
    ]);

    const album: AlbumPhoto[] = (albumRes.data || []).map((p) => ({
      key: `a-${p.id}`, id: p.id, url: p.url, caption: p.caption,
      date: p.taken_date ? `${p.taken_date}T00:00:00` : p.created_at, source: 'album',
    }));
    const chat: AlbumPhoto[] = (chatRes.data || []).map((m) => ({
      key: `c-${m.id}`, id: null, url: m.image_url as string, caption: null,
      date: m.created_at, source: 'chat',
    }));

    const merged = [...album, ...chat].sort((a, b) => b.date.localeCompare(a.date));
    setPhotos(merged);
    setLoading(false);
  }, [couple]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const uploadPhoto = async (file: File, caption?: string, takenDate?: string): Promise<string | null> => {
    if (!couple || !user) return null;
    if (!file.type.startsWith('image/')) return '이미지 파일만 올릴 수 있어요.';
    if (file.size > 10 * 1024 * 1024) return '10MB 이하 이미지만 올릴 수 있어요.';
    setUploading(true);
    const supabase = createClient();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${couple.id}/album/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('chat-images').upload(path, file, { contentType: file.type });
    if (upErr) { setUploading(false); return '업로드에 실패했어요.'; }
    const { data: pub } = supabase.storage.from('chat-images').getPublicUrl(path);
    await supabase.from('couple_photos').insert({
      couple_id: couple.id, created_by: user.id, url: pub.publicUrl,
      caption: caption || null, taken_date: takenDate || null,
    });
    await fetchPhotos();
    setUploading(false);
    return null;
  };

  const deletePhoto = async (id: string) => {
    const supabase = createClient();
    await supabase.from('couple_photos').delete().eq('id', id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  return { photos, loading, uploading, uploadPhoto, deletePhoto };
}
