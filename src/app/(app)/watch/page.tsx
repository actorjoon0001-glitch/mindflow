'use client';

import { useMemo, useState } from 'react';
import { Film, Plus, Trash2, Star, Loader2, ExternalLink, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { useWatchlist } from '@/hooks/use-watchlist';
import { cn } from '@/lib/utils';
import { WATCH_PLATFORMS } from '@/lib/constants';
import type { WatchPlatform, WatchStatus } from '@/types';

const PLATFORM_KEYS = Object.keys(WATCH_PLATFORMS) as WatchPlatform[];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WatchPage() {
  const { items, loading, addItem, updateItem, deleteItem } = useWatchlist();
  const [tab, setTab] = useState<WatchStatus>('watched');

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<WatchPlatform>('netflix');
  const [status, setStatus] = useState<WatchStatus>('watched');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [url, setUrl] = useState('');
  const [watchedDate, setWatchedDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle(''); setPlatform('netflix'); setStatus('watched');
    setRating(0); setReview(''); setUrl(''); setWatchedDate(todayStr());
  };

  const openAdd = (initial: WatchStatus) => { reset(); setStatus(initial); setOpen(true); };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await addItem({
      title, platform, status,
      rating: status === 'watched' ? (rating || null) : null,
      review: review || null,
      url: url.trim() || null,
      watched_date: status === 'watched' ? (watchedDate || null) : null,
    });
    setSaving(false);
    setOpen(false);
    reset();
  };

  const watched = useMemo(() => items.filter((i) => i.status === 'watched'), [items]);
  const want = useMemo(() => items.filter((i) => i.status === 'want'), [items]);
  const list = tab === 'watched' ? watched : want;

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Film size={18} className="text-rose-400" /> 함께 본 것
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">넷플릭스·유튜브 등 둘이 본 것과 보고 싶은 것을 기록해요</p>
        </div>
        <Button size="sm" onClick={() => openAdd(tab)}><Plus size={14} /> 추가</Button>
      </div>

      {/* 탭 */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('watched')}
          className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-colors', tab === 'watched' ? 'bg-brand-600 text-white' : 'bg-surface-100 text-gray-400')}
        >본 것 {watched.length}</button>
        <button
          onClick={() => setTab('want')}
          className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-colors', tab === 'want' ? 'bg-brand-600 text-white' : 'bg-surface-100 text-gray-400')}
        >보고싶어요 {want.length}</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-600" size={22} /></div>
      ) : list.length === 0 ? (
        <Card className="text-center py-12">
          <Film size={30} className="mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-500">
            {tab === 'watched' ? '함께 본 작품을 기록해보세요 🍿' : '보고 싶은 작품을 담아두세요 💭'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((it) => {
            const pf = WATCH_PLATFORMS[it.platform] || WATCH_PLATFORMS.etc;
            return (
              <div key={it.id} className="rounded-xl border border-surface-300 bg-surface-50 p-3 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: pf.color }}>{pf.emoji} {pf.label}</span>
                    <span className="text-sm font-medium text-gray-100 break-words">{it.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {it.status === 'want' && (
                      <button
                        onClick={() => updateItem(it.id, { status: 'watched', watched_date: todayStr() })}
                        className="text-emerald-400 hover:text-emerald-300 opacity-0 group-hover:opacity-100 transition-all"
                        title="봤어요로 이동"
                      ><Check size={15} /></button>
                    )}
                    <button onClick={() => deleteItem(it.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
                {it.status === 'watched' && it.rating ? (
                  <div className="flex gap-0.5 mt-1.5">
                    {Array.from({ length: it.rating }).map((_, i) => (
                      <Star key={i} size={12} className="text-amber-400" fill="currentColor" />
                    ))}
                  </div>
                ) : null}
                {it.review && <p className="text-xs text-gray-400 mt-1.5 whitespace-pre-wrap break-words">&ldquo;{it.review}&rdquo;</p>}
                <div className="flex items-center gap-3 mt-1.5">
                  {it.watched_date && <span className="text-[11px] text-gray-500">{it.watched_date}</span>}
                  {it.url && (
                    <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-0.5">
                      <ExternalLink size={11} /> 링크
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 추가 다이얼로그 */}
      <Dialog open={open} onClose={() => { setOpen(false); reset(); }} title="작품 기록하기">
        <div className="space-y-4">
          <Input id="title" label="제목" placeholder="예) 폭싹 속았수다" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">플랫폼</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_KEYS.map((k) => {
                const p = WATCH_PLATFORMS[k];
                const on = platform === k;
                return (
                  <button key={k} onClick={() => setPlatform(k)}
                    className={cn('px-3 py-1.5 rounded-lg text-sm border transition-all', on ? 'text-white border-transparent' : 'text-gray-400 border-surface-300 hover:bg-surface-200')}
                    style={on ? { backgroundColor: p.color } : undefined}
                  >{p.emoji} {p.label}</button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">상태</label>
            <div className="flex gap-2">
              <button onClick={() => setStatus('watched')} className={cn('flex-1 py-2 rounded-lg text-sm border transition-all', status === 'watched' ? 'bg-brand-600 text-white border-transparent' : 'text-gray-400 border-surface-300')}>봤어요</button>
              <button onClick={() => setStatus('want')} className={cn('flex-1 py-2 rounded-lg text-sm border transition-all', status === 'want' ? 'bg-brand-600 text-white border-transparent' : 'text-gray-400 border-surface-300')}>보고싶어요</button>
            </div>
          </div>
          {status === 'watched' && (
            <>
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
              <Input id="watchedDate" label="본 날짜" type="date" value={watchedDate} onChange={(e) => setWatchedDate(e.target.value)} />
            </>
          )}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">한줄평 (선택)</label>
            <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={2} placeholder="둘이 본 소감을 남겨보세요"
              className="w-full rounded-lg border bg-surface-100 px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </div>
          <Input id="url" label="링크 (선택)" placeholder="유튜브/넷플릭스 링크" value={url} onChange={(e) => setUrl(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setOpen(false); reset(); }}>취소</Button>
            <Button onClick={save} loading={saving} disabled={!title.trim()}><Plus size={16} /> 저장</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
