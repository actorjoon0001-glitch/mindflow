'use client';

import { useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, X, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCoupleAlbum, type AlbumPhoto } from '@/hooks/use-couple-album';

function monthLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export default function AlbumPage() {
  const { photos, loading, uploading, uploadPhotos, removePhoto } = useCoupleAlbum();
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  const [viewer, setViewer] = useState<AlbumPhoto | null>(null);

  const handleDelete = async () => {
    if (!viewer) return;
    const msg = viewer.source === 'chat'
      ? '이 사진을 삭제하면 채팅에서도 사라져요. 삭제할까요?'
      : viewer.source === 'place'
      ? '이 사진을 삭제하면 지도 장소에서도 사라져요. 삭제할까요?'
      : '이 사진을 삭제할까요?';
    if (!confirm(msg)) return;
    const target = viewer;
    setViewer(null);
    await removePhoto(target);
  };

  const groups = useMemo(() => {
    const map: Record<string, AlbumPhoto[]> = {};
    photos.forEach((p) => { (map[monthLabel(p.date)] ||= []).push(p); });
    return Object.entries(map);
  }, [photos]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setErr('');
    const { failed, reason } = await uploadPhotos(files);
    if (failed && reason) setErr(reason);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Images size={18} className="text-rose-400" /> 우리 사진첩
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">앨범에 올린 사진 + 채팅 사진을 월별로 모아봐요 ({photos.length}장)</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
        <Button onClick={() => fileRef.current?.click()} loading={uploading}>
          <ImagePlus size={16} /> 사진 올리기
        </Button>
      </div>
      {err && <p className="text-xs text-red-400">{err}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-600" size={24} /></div>
      ) : photos.length === 0 ? (
        <Card className="text-center py-12">
          <Images size={32} className="mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-500">아직 사진이 없어요.<br />추억이 담긴 사진을 올려보세요! 📸</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([label, list]) => (
            <div key={label}>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">{label}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {list.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setViewer(p)}
                    className="relative aspect-square rounded-lg overflow-hidden bg-surface-100 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="사진" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    {p.source !== 'album' && (
                      <span className="absolute bottom-1 left-1 text-[9px] px-1 rounded bg-black/50 text-white/90">{p.source === 'chat' ? '채팅' : '지도'}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {viewer && (
        <div className="fixed inset-0 z-[9998] bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setViewer(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setViewer(null)}><X size={26} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewer.url} alt="사진" className="max-w-full max-h-[80vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          <div className="mt-3 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm text-white/70">
              {new Date(viewer.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              {viewer.source === 'chat' ? ' · 채팅 사진' : viewer.source === 'place' ? ` · 지도${viewer.caption ? ` · ${viewer.caption}` : ''}` : ''}
            </span>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
            >
              <Trash2 size={15} /> 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
