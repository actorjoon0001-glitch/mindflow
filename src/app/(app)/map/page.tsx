'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Plus, Search, Trash2, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { useCouplePlaces } from '@/hooks/use-couple-places';
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

export default function MapPage() {
  const { places, loading, createPlace, deletePlace } = useCouplePlaces();
  const [focus, setFocus] = useState<CouplePlace | null>(null);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // form
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [category, setCategory] = useState<CouplePlaceCategory>('restaurant');
  const [rating, setRating] = useState(0);
  const [visitedDate, setVisitedDate] = useState('');
  const [saving, setSaving] = useState(false);

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
    setName(''); setAddress(''); setMemo(''); setCategory('restaurant');
    setRating(0); setVisitedDate(''); setPending(null);
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
    if (!name.trim() || !pending) return;
    setSaving(true);
    await createPlace({
      name,
      lat: pending.lat,
      lng: pending.lng,
      address: address || undefined,
      memo: memo || undefined,
      category,
      rating: rating || null,
      visited_date: visitedDate || null,
    });
    setSaving(false);
    setShowForm(false);
    resetForm();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <MapPin size={18} className="text-rose-400" /> 우리가 다녀온 곳
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">지도를 움직여 중앙 ⊙ 에 맞추고 <span className="text-rose-300">여기에 기록</span>, 또는 장소 검색 ({places.length}곳)</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:w-64">
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="장소·주소 검색"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="secondary" size="icon" className="h-[42px] w-[42px] shrink-0" onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </Button>
            </div>

            {/* 검색 결과 목록 — 선택하면 그 위치에 핀 + 기록 폼 */}
            {searchResults.length > 0 && (
              <div className="mt-2 rounded-lg border border-surface-300 bg-surface-100 overflow-hidden">
                {searchResults.map((r, i) => (
                  <button
                    key={`${r.lat}-${r.lng}-${i}`}
                    onClick={() => pickResult(r)}
                    className="w-full text-left px-3 py-2 hover:bg-surface-200 transition-colors border-b border-surface-300 last:border-0"
                  >
                    <p className="text-sm text-gray-100 truncate">{r.name}</p>
                    {r.address && <p className="text-xs text-gray-500 truncate">{r.address}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {searchError && <p className="text-xs text-amber-400">{searchError}</p>}

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <Card className="p-2 h-[48vh] lg:h-[70vh]">
          <CoupleMap
            places={places}
            focus={focus}
            pending={pending}
            onPick={(lat, lng) => openForm(lat, lng)}
          />
        </Card>

        <div className="space-y-3 lg:h-[70vh] lg:overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-600" size={20} /></div>
          ) : places.length === 0 ? (
            <Card className="text-center py-8">
              <MapPin size={28} className="mx-auto mb-2 text-gray-600" />
              <p className="text-sm text-gray-500">아직 기록된 장소가 없어요.<br />지도를 눌러 첫 추억을 남겨보세요!</p>
            </Card>
          ) : (
            places.map((place) => {
              const cat = COUPLE_PLACE_CATEGORIES[place.category] || COUPLE_PLACE_CATEGORIES.etc;
              return (
                <Card
                  key={place.id}
                  hover
                  className={cn('p-3 group', focus?.id === place.id && 'ring-1 ring-rose-500')}
                  onClick={() => setFocus(place)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-100 truncate">{cat.emoji} {place.name}</p>
                      {place.rating ? (
                        <div className="flex gap-0.5 mt-0.5">
                          {Array.from({ length: place.rating }).map((_, i) => (
                            <Star key={i} size={11} className="text-amber-400" fill="currentColor" />
                          ))}
                        </div>
                      ) : null}
                      {place.visited_date && <p className="text-[11px] text-gray-500 mt-0.5">{place.visited_date}</p>}
                      {place.memo && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{place.memo}</p>}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePlace(place.id); }}
                      className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Add place dialog */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); resetForm(); }} title="이곳을 기록하기">
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
          {address && <p className="text-xs text-gray-500">📍 {address}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>취소</Button>
            <Button onClick={handleSave} loading={saving}><Plus size={16} /> 저장</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
