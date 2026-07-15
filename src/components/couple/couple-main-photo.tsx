'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2, ImagePlus } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';

// 메인 화면에 걸어두는 둘이 찍은 대표 사진 1장. (couples.main_photo_url)
export function CoupleMainPhoto() {
  const couple = useAuthStore((s) => s.couple);
  const updateCouple = useAuthStore((s) => s.updateCouple);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  if (!couple) return null;
  const photo = couple.main_photo_url;

  const onPick = async (file?: File) => {
    setErr('');
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('이미지 파일만 올릴 수 있어요.'); return; }
    if (file.size > 10 * 1024 * 1024) { setErr('10MB 이하 이미지만 올릴 수 있어요.'); return; }
    setUploading(true);
    const supabase = createClient();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${couple.id}/main/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('chat-images').upload(path, file, { contentType: file.type });
    if (error) { setErr('업로드에 실패했어요.'); setUploading(false); return; }
    const { data: pub } = supabase.storage.from('chat-images').getPublicUrl(path);
    await updateCouple({ main_photo_url: pub.publicUrl });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const remove = async () => {
    if (!confirm('대표 사진을 지울까요?')) return;
    await updateCouple({ main_photo_url: null });
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      {photo ? (
        <div className="relative group rounded-2xl overflow-hidden border border-surface-300 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="우리 사진" className="w-full max-h-80 object-cover" />
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-end gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/90 text-gray-800 font-medium disabled:opacity-60"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />} 변경
            </button>
            <button
              onClick={remove}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-black/50 text-white"
            >
              <Trash2 size={13} /> 삭제
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-2xl border-2 border-dashed border-surface-400 hover:border-rose-400 hover:bg-surface-100 transition-colors py-10 flex flex-col items-center justify-center gap-2 text-gray-400"
        >
          {uploading ? (
            <Loader2 size={26} className="animate-spin text-rose-400" />
          ) : (
            <ImagePlus size={26} className="text-rose-400" />
          )}
          <span className="text-sm font-medium">둘이 찍은 사진 올리기 📸</span>
          <span className="text-xs text-gray-500">메인 화면에 대표 사진으로 걸어둬요</span>
        </button>
      )}
      {err && <p className="text-xs text-amber-400 mt-1.5">{err}</p>}
    </div>
  );
}
