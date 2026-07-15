'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Plus, Search, Trash2, Star, Loader2, X, ImagePlus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { useCouplePlaces } from '@/hooks/use-couple-places';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { COUPLE_PLACE_CATEGORIES } from '@/lib/constants';
import type { CouplePlace, CouplePlaceCategory } from '@/types';
import type { GeoResult } from '@/app/api/geocode/route';

const CoupleMap = dynamic(() => import('@/components/map/couple-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-surface-100 rounded-xl">
      <Loader2 className="animate-spin text-gray-600" size={24} />
    </div>
  ),
});

const CATEGORY_KEYS = Object.keys(COUPLE_PLACE_CATEGORIES) as CouplePlaceCategory[];

// 장소의 사진 목록 (photos 배열 우선, 없으면 기존 photo_url 로 대체).
function placePhotos(p: CouplePlace): string[] {
  if (p.photos && p.photos.length) return p.photos;
  return p.photo_url ? [p.photo_url] : [];
}

export default function MapPage() {
  const { places, loading, createPlace, updatePlace, deletePlace } = useCouplePlaces();
  const couple = useAuthStore((s) => s.couple);
  const [focus, setFocus] = useState<CouplePlace | null>(null);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // form
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [category, setCategory] = useState<CouplePlaceCategory>('date');
  const [rating, setRating] = useState(0);
  const [visitedDate, setVisitedDate] = useState('');
  const [saving, setSaving] = useState(false);

  // edit / photos (여러 장)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]); // 이미 저장된 URL (수정 시 유지)
  const [newPhotos, setNewPhotos] = useState<{ file: File; preview: string }[]>([]); // 새로 고른 파일
  const [photoError, setPhotoError] = useState('');

  const pickPhotos = (files: File[]) => {
    setPhotoError('');
    const valid: { file: File; preview: string }[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) { setPhotoError('이미지 파일만 올릴 수 있어요.'); continue; }
      if (file.size > 10 * 1024 * 1024) { setPhotoError('10MB 이하 이미지만 올릴 수 있어요.'); continue; }
      valid.push({ file, preview: URL.createObjectURL(file) });
    }
    if (valid.length) setNewPhotos((prev) => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeNewPhoto = (idx: number) => {
    setNewPhotos((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeExistingPhoto = (url: string) => {
    setExistingPhotos((prev) => prev.filter((u) => u !== url));
  };

  const clearPhotos = () => {
    setPhotoError('');
    setExistingPhotos([]);
    setNewPhotos((prev) => { prev.forEach((n) => URL.revokeObjectURL(n.preview)); return []; });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // geocode search
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);

  const openForm = (lat: number, lng: number, addr?: string, placeName?: string) => {
    setPending({ lat, lng });
    if (addr) setAddress(addr);
    if (placeName) setName(placeName);
    setShowForm(true);
  };

  const resetForm = () => {
    setName(''); setAddress(''); setMemo(''); setCategory('date');
    setRating(0); setVisitedDate(''); setPending(null);
    setEditingId(null);
    clearPhotos();
  };

  // 기존 장소 수정: 폼을 그 장소 값으로 채워서 연다.
  const openEdit = (place: CouplePlace) => {
    setEditingId(place.id);
    setName(place.name);
    setAddress(place.address || '');
    setMemo(place.memo || '');
    setCategory(place.category);
    setRating(place.rating || 0);
    setVisitedDate(place.visited_date || '');
    setPending({ lat: place.lat, lng: place.lng });
    setExistingPhotos(placePhotos(place));
    setNewPhotos([]);
    setPhotoError('');
    setShowForm(true);
  };

  const pickResult = (r: GeoResult) => {
    setSearchResults([]);
    setSearchQ('');
    setFocus(null);
    openForm(r.lat, r.lng, r.address, r.name);
  };

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQ)}`);
      const data = await res.json();
      const results: GeoResult[] = data.results || [];
      if (results.length === 1) {
        pickResult(results[0]);
      } else if (results.length > 1) {
        setSearchResults(results);
      } else {
        setSearchError('검색 결과가 없어요. 지도를 움직여 직접 추가해보세요.');
      }
    } catch {
      setSearchError('검색에 실패했어요. 지도를 움직여 직접 추가해보세요.');
    }
    setSearching(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (!editingId && !pending) return;
    setSaving(true);

    // 새로 고른 사진들을 스토리지에 업로드하고 공개 URL을 모은다.
    const uploadedUrls: string[] = [];
    if (newPhotos.length && couple) {
      const supabase = createClient();
      for (const { file } of newPhotos) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = `${couple.id}/places/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('chat-images')
          .upload(path, file, { contentType: file.type, upsert: false });
        if (!upErr) {
          const { data: pub } = supabase.storage.from('chat-images').getPublicUrl(path);
          uploadedUrls.push(pub.publicUrl);
        }
      }
      if (uploadedUrls.length < newPhotos.length) {
        setPhotoError('일부 사진 업로드에 실패했어요.');
      }
    }

    // 유지할 기존 사진 + 새로 올린 사진. photo_url 은 호환을 위해 첫 사진으로.
    const finalPhotos = [...existingPhotos, ...uploadedUrls];
    const photoUrl = finalPhotos[0] ?? null;

    if (editingId) {
      await updatePlace(editingId, {
        name,
        address: address || null,
        memo: memo || null,
        category,
        rating: rating || null,
        visited_date: visitedDate || null,
        photos: finalPhotos,
        photo_url: photoUrl,
      });
    } else if (pending) {
      await createPlace({
        name,
        lat: pending.lat,
        lng: pending.lng,
        address: address || undefined,
        memo: memo || undefined,
        category,
        rating: rating || null,
        visited_date: visitedDate || null,
        photos: finalPhotos,
        photo_url: photoUrl,
      });
    }
    setSaving(false);
    setShowForm(false);
    resetForm();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3 animate-fade-in">
      {/* Map with floating search (카카오맵 스타일)
          isolate: Leaflet 내부의 높은 z-index가 저장 폼(Dialog)을 덮지 않도록 스택 컨텍스트 격리 */}
      <div className="relative isolate rounded-2xl overflow-hidden h-[68vh] shadow-lg">
        <CoupleMap
          places={places}
          focus={focus}
          pending={pending}
          onPick={(lat, lng) => openForm(lat, lng)}
        />

        {/* Floating search bar */}
        <div className="absolute top-3 inset-x-3 z-[600]">
          <div className="bg-white rounded-xl shadow-md flex items-center gap-2 pl-3 pr-1.5 h-11">
            <Search size={17} className="text-gray-400 shrink-0" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="장소·주소 검색 (예: 아스가르드)"
              className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            />
            {searchQ && (
              <button onClick={() => { setSearchQ(''); setSearchResults([]); setSearchError(''); }} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X size={16} />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={searching}
              className="shrink-0 h-8 px-3 rounded-lg bg-brand-600 text-white text-sm font-medium flex items-center gap-1 disabled:opacity-60"
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : '검색'}
            </button>
          </div>

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
              {searchResults.map((r, i) => (
                <button
                  key={`${r.lat}-${r.lng}-${i}`}
                  onClick={() => pickResult(r)}
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 flex items-start gap-2"
                >
                  <MapPin size={15} className="text-brand-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">{r.name}</p>
                    {r.address && <p className="text-xs text-gray-500 truncate">{r.address}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchError && (
            <div className="mt-2 bg-white rounded-lg shadow px-3 py-2 text-xs text-amber-600">{searchError}</div>
          )}
        </div>
      </div>

      {/* Saved places */}
      <div>
        <p className="text-xs text-gray-500 mb-2 px-1">우리가 다녀온 곳 · {places.length}곳</p>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-600" size={20} /></div>
        ) : places.length === 0 ? (
          <p className="text-center py-4 text-sm text-gray-600">지도를 움직여 중앙 ⊙ 에 맞추고 <span className="text-rose-300">여기에 기록</span> 하거나, 위에서 검색해보세요!</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {places.map((place) => {
              const cat = COUPLE_PLACE_CATEGORIES[place.category] || COUPLE_PLACE_CATEGORIES.etc;
              return (
                <div
                  key={place.id}
                  onClick={() => setFocus(place)}
                  className={cn(
                    'shrink-0 w-44 cursor-pointer rounded-xl border bg-surface-50 p-3 group transition-all',
                    focus?.id === place.id ? 'border-rose-500 ring-1 ring-rose-500' : 'border-surface-300 hover:border-surface-400',
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: cat.color }}>
                      {cat.emoji} {cat.label}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(place); }}
                        className="text-gray-600 hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-all"
                        title="수정"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePlace(place.id); }}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        title="삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {(() => {
                    const pics = placePhotos(place);
                    if (!pics.length) return null;
                    return (
                      <div className="relative mt-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pics[0]} alt={place.name} loading="lazy" decoding="async" className="w-full h-20 object-cover rounded-lg" />
                        {pics.length > 1 && (
                          <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/60 text-white flex items-center gap-0.5">
                            <ImagePlus size={9} /> {pics.length}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <p className="text-sm font-medium text-gray-100 truncate mt-1.5">{place.name}</p>
                  {place.rating ? (
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: place.rating }).map((_, i) => (
                        <Star key={i} size={10} className="text-amber-400" fill="currentColor" />
                      ))}
                    </div>
                  ) : null}
                  {place.visited_date && <p className="text-[11px] text-gray-500 mt-0.5">{place.visited_date}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / edit place dialog */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={editingId ? '장소 수정하기' : '이곳을 기록하기'}>
        <div className="space-y-4">
          <Input id="placeName" label="장소 이름" placeholder="예) 성수 감성 카페" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">종류</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-all',
                    category === key ? 'text-white border-transparent' : 'text-gray-400 border-surface-300 hover:bg-surface-200'
                  )}
                  style={category === key ? { backgroundColor: COUPLE_PLACE_CATEGORIES[key].color } : undefined}
                >{COUPLE_PLACE_CATEGORIES[key].emoji} {COUPLE_PLACE_CATEGORIES[key].label}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">별점</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n === rating ? 0 : n)}>
                  <Star size={22} className={n <= rating ? 'text-amber-400' : 'text-surface-400'} fill={n <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <Input id="visitedDate" label="방문한 날 (선택)" type="date" value={visitedDate} onChange={(e) => setVisitedDate(e.target.value)} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">메모 (선택)</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="그날의 추억을 적어보세요"
              rows={3}
              className="w-full rounded-lg border bg-surface-100 px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">사진 (선택 · 여러 장 가능)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => pickPhotos(Array.from(e.target.files || []))}
            />
            {(existingPhotos.length > 0 || newPhotos.length > 0) && (
              <div className="grid grid-cols-3 gap-2">
                {existingPhotos.map((url) => (
                  <div key={url} className="relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="사진" className="w-full h-full object-cover rounded-lg border border-surface-300" />
                    <button
                      onClick={() => removeExistingPhoto(url)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                      aria-label="사진 제거"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                {newPhotos.map((n, idx) => (
                  <div key={n.preview} className="relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.preview} alt="첨부 미리보기" className="w-full h-full object-cover rounded-lg border border-surface-300" />
                    <button
                      onClick={() => removeNewPhoto(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                      aria-label="사진 제거"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-surface-400 text-sm text-gray-400 hover:bg-surface-200 transition-colors"
            >
              <ImagePlus size={16} /> 사진 추가
            </button>
            {photoError && <p className="text-xs text-amber-400">{photoError}</p>}
          </div>
          {address && <p className="text-xs text-gray-500">📍 {address}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>취소</Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? <><Pencil size={16} /> 수정 저장</> : <><Plus size={16} /> 저장</>}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
