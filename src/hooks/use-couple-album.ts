'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/image';
import { useAuthStore } from '@/stores/auth-store';

export interface AlbumPhoto {
  key: string;
  id: string | null; // couple_photos.id (앨범 업로드만 삭제 가능)
  ownerId: string;   // 원본 행 id (album: couple_photos, chat: couple_messages, place: couple_places)
  url: string;
  caption: string | null;
  date: string; // ISO (taken_date 또는 created_at)
  source: 'album' | 'chat' | 'place';
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
    const [albumRes, chatRes, placesRes] = await Promise.all([
      supabase.from('couple_photos').select('*').eq('couple_id', couple.id),
      supabase.from('couple_messages').select('id, image_url, created_at').eq('couple_id', couple.id).not('image_url', 'is', null),
      supabase.from('couple_places').select('*').eq('couple_id', couple.id),
    ]);

    const album: AlbumPhoto[] = (albumRes.data || []).map((p) => ({
      key: `a-${p.id}`, id: p.id, ownerId: p.id, url: p.url, caption: p.caption,
      date: p.taken_date ? `${p.taken_date}T00:00:00` : p.created_at, source: 'album',
    }));
    const chat: AlbumPhoto[] = (chatRes.data || []).map((m) => ({
      key: `c-${m.id}`, id: null, ownerId: m.id, url: m.image_url as string, caption: null,
      date: m.created_at, source: 'chat',
    }));
    // 지도 장소 사진도 앨범에 자동 포함 (photos 배열 우선, 없으면 photo_url).
    const place: AlbumPhoto[] = [];
    (placesRes.data || []).forEach((pl) => {
      const pics: string[] = (pl.photos && pl.photos.length) ? pl.photos : (pl.photo_url ? [pl.photo_url] : []);
      const d = pl.visited_date ? `${pl.visited_date}T00:00:00` : pl.created_at;
      pics.forEach((url, i) => place.push({
        key: `p-${pl.id}-${i}`, id: null, ownerId: pl.id, url, caption: pl.name, date: d, source: 'place',
      }));
    });

    const merged = [...album, ...chat, ...place].sort((a, b) => b.date.localeCompare(a.date));
    setPhotos(merged);
    setLoading(false);
  }, [couple]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const uploadPhoto = async (file: File, caption?: string, takenDate?: string): Promise<string | null> => {
    if (!couple || !user) return null;
    if (!file.type.startsWith('image/')) return '이미지 파일만 올릴 수 있어요.';
    if (file.size > 20 * 1024 * 1024) return '20MB 이하 이미지만 올릴 수 있어요.';
    setUploading(true);
    const supabase = createClient();
    const compressed = await compressImage(file); // 업로드 전 자동 압축
    const ext = (compressed.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${couple.id}/album/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('chat-images').upload(path, compressed, { contentType: compressed.type });
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

  // 여러 장을 한 번에 업로드. 압축 후 병렬 업로드로 속도 개선. 성공/실패 개수 반환.
  const uploadPhotos = async (files: File[]): Promise<{ ok: number; failed: number; reason?: string }> => {
    if (!couple || !user) return { ok: 0, failed: files.length, reason: '로그인이 필요해요.' };
    setUploading(true);
    const supabase = createClient();
    let reason: string | undefined;

    const results = await Promise.all(files.map(async (file) => {
      if (!file.type.startsWith('image/')) { reason ||= '이미지 파일만 올릴 수 있어요.'; return false; }
      if (file.size > 20 * 1024 * 1024) { reason ||= '20MB 이하 이미지만 올릴 수 있어요.'; return false; }
      try {
        const compressed = await compressImage(file);
        const ext = (compressed.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = `${couple.id}/album/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('chat-images').upload(path, compressed, { contentType: compressed.type });
        if (upErr) { reason ||= '일부 사진 업로드에 실패했어요.'; return false; }
        const { data: pub } = supabase.storage.from('chat-images').getPublicUrl(path);
        await supabase.from('couple_photos').insert({ couple_id: couple.id, created_by: user.id, url: pub.publicUrl });
        return true;
      } catch { reason ||= '일부 사진 업로드에 실패했어요.'; return false; }
    }));

    const ok = results.filter(Boolean).length;
    const failed = results.length - ok;
    await fetchPhotos();
    setUploading(false);
    return { ok, failed, reason };
  };

  const deletePhoto = async (id: string) => {
    const supabase = createClient();
    await supabase.from('couple_photos').delete().eq('id', id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // 출처에 맞게 사진 삭제. album=couple_photos, chat=메시지, place=장소 photos에서 제거.
  const removePhoto = async (photo: AlbumPhoto) => {
    const supabase = createClient();
    if (photo.source === 'album') {
      await supabase.from('couple_photos').delete().eq('id', photo.ownerId);
    } else if (photo.source === 'chat') {
      await supabase.from('couple_messages').delete().eq('id', photo.ownerId);
    } else if (photo.source === 'place') {
      const { data: pl } = await supabase
        .from('couple_places')
        .select('photos, photo_url')
        .eq('id', photo.ownerId)
        .maybeSingle();
      const remaining = ((pl?.photos as string[] | null) || []).filter((u) => u !== photo.url);
      await supabase
        .from('couple_places')
        .update({ photos: remaining, photo_url: remaining[0] ?? null })
        .eq('id', photo.ownerId);
    }
    setPhotos((prev) => prev.filter((p) => p.key !== photo.key));
  };

  return { photos, loading, uploading, uploadPhoto, uploadPhotos, deletePhoto, removePhoto };
}
