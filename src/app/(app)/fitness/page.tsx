'use client';

import { useMemo, useRef, useState } from 'react';
import { Dumbbell, Plus, Trash2, Utensils, Flame, Clock, Star, Loader2, ImagePlus, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { useFitness } from '@/hooks/use-fitness';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/image';
import { cn } from '@/lib/utils';
import { BODY_PARTS, MEAL_TYPES } from '@/lib/constants';
import type { WorkoutBodyPart, MealType, CoupleWorkout, CoupleMeal } from '@/types';

const BODY_KEYS = Object.keys(BODY_PARTS) as WorkoutBodyPart[];
const MEAL_KEYS = Object.keys(MEAL_TYPES) as MealType[];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDate(s: string) {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

export default function FitnessPage() {
  const { workouts, meals, loading, addWorkout, deleteWorkout, addMeal, deleteMeal } = useFitness();
  const profile = useAuthStore((s) => s.profile);
  const partner = useAuthStore((s) => s.partner);
  const user = useAuthStore((s) => s.user);
  const couple = useAuthStore((s) => s.couple);
  const myId = user?.id;

  const nameFor = (uid: string | null) =>
    uid && uid === myId ? (profile?.full_name || '나') : (partner?.full_name || '상대');

  // ── 이번 주(최근 7일) 요약 ─────────────────
  const weekAgo = daysAgoStr(6);
  const weekWorkouts = workouts.filter((w) => w.date >= weekAgo);
  const myDays = new Set(weekWorkouts.filter((w) => w.user_id === myId).map((w) => w.date)).size;
  const partnerDays = new Set(weekWorkouts.filter((w) => w.user_id && w.user_id !== myId).map((w) => w.date)).size;
  const weekParts = useMemo(() => {
    const set = new Set<string>();
    weekWorkouts.forEach((w) => (w.body_parts || []).forEach((p) => set.add(p)));
    return Array.from(set);
  }, [weekWorkouts]);

  // ── 워크아웃 폼 ─────────────────
  const [wOpen, setWOpen] = useState(false);
  const [wDate, setWDate] = useState(todayStr());
  const [wParts, setWParts] = useState<WorkoutBodyPart[]>([]);
  const [wDuration, setWDuration] = useState('');
  const [wPt, setWPt] = useState(false);
  const [wMemo, setWMemo] = useState('');
  const [wSaving, setWSaving] = useState(false);

  const resetW = () => { setWDate(todayStr()); setWParts([]); setWDuration(''); setWPt(false); setWMemo(''); };
  const togglePart = (p: WorkoutBodyPart) =>
    setWParts((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const saveWorkout = async () => {
    if (!wParts.length) return;
    setWSaving(true);
    await addWorkout({
      date: wDate,
      body_parts: wParts,
      duration_min: wDuration ? Number(wDuration) : null,
      is_pt: wPt,
      memo: wMemo || null,
    });
    setWSaving(false);
    setWOpen(false);
    resetW();
  };

  // ── 식단 폼 ─────────────────
  const [mOpen, setMOpen] = useState(false);
  const [mDate, setMDate] = useState(todayStr());
  const [mType, setMType] = useState<MealType>('lunch');
  const [mContent, setMContent] = useState('');
  const [mCal, setMCal] = useState('');
  const [mSaving, setMSaving] = useState(false);
  const mFileRef = useRef<HTMLInputElement>(null);
  const [mPhoto, setMPhoto] = useState<{ file: File; preview: string } | null>(null);

  const resetM = () => {
    setMDate(todayStr()); setMType('lunch'); setMContent(''); setMCal('');
    setMPhoto((prev) => { if (prev) URL.revokeObjectURL(prev.preview); return null; });
    if (mFileRef.current) mFileRef.current.value = '';
  };

  const pickMealPhoto = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setMPhoto((prev) => { if (prev) URL.revokeObjectURL(prev.preview); return { file, preview: URL.createObjectURL(file) }; });
  };

  const saveMeal = async () => {
    if (!mContent.trim()) return;
    setMSaving(true);
    let photoUrl: string | null = null;
    if (mPhoto && couple) {
      const supabase = createClient();
      const compressed = await compressImage(mPhoto.file);
      const ext = (compressed.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${couple.id}/meals/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('chat-images').upload(path, compressed, { contentType: compressed.type });
      if (!error) {
        const { data: pub } = supabase.storage.from('chat-images').getPublicUrl(path);
        photoUrl = pub.publicUrl;
      }
    }
    await addMeal({
      date: mDate, meal_type: mType, content: mContent.trim(),
      calories: mCal ? Number(mCal) : null, photo_url: photoUrl,
    });
    setMSaving(false);
    setMOpen(false);
    resetM();
  };

  // 날짜별 그룹
  const workoutDays = useMemo(() => groupByDate(workouts), [workouts]);
  const mealDays = useMemo(() => groupByDate(meals), [meals]);

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* 이번 주 요약 */}
      <Card className="bg-gradient-to-br from-emerald-950/40 to-surface-50 border-emerald-900/40">
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell size={18} className="text-emerald-400" />
          <h2 className="text-base font-semibold text-gray-100">이번 주 운동</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-100 p-3 text-center">
            <p className="text-xs text-gray-500">{profile?.full_name || '나'}</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">{myDays}<span className="text-sm text-gray-500">일</span></p>
          </div>
          <div className="rounded-xl bg-surface-100 p-3 text-center">
            <p className="text-xs text-gray-500">{partner?.full_name || '상대'}</p>
            <p className="text-2xl font-bold text-rose-400 mt-0.5">{partnerDays}<span className="text-sm text-gray-500">일</span></p>
          </div>
        </div>
        {weekParts.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1.5">이번 주 운동한 부위</p>
            <div className="flex flex-wrap gap-1.5">
              {weekParts.map((p) => {
                const b = BODY_PARTS[p];
                return (
                  <span key={p} className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: b.color }}>
                    {b.emoji} {b.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* 운동 기록 */}
      <Card>
        <CardHeader>
          <CardTitle>운동 기록</CardTitle>
          <Button size="sm" onClick={() => setWOpen(true)}><Plus size={14} /> 운동 추가</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-600" size={20} /></div>
          ) : workoutDays.length === 0 ? (
            <p className="text-center py-6 text-sm text-gray-600">아직 운동 기록이 없어요. PT 다녀오면 기록해봐요! 💪</p>
          ) : (
            <div className="space-y-4">
              {workoutDays.map(([date, items]) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-gray-400 mb-2">{fmtDate(date)}</p>
                  <div className="space-y-2">
                    {(items as CoupleWorkout[]).map((w) => (
                      <div key={w.id} className="rounded-xl border border-surface-300 bg-surface-50 p-3 group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium text-gray-300">{nameFor(w.user_id)}</span>
                            {w.is_pt && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 flex items-center gap-0.5"><Star size={9} fill="currentColor" /> PT</span>}
                            {w.duration_min ? <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Clock size={9} /> {w.duration_min}분</span> : null}
                          </div>
                          <button onClick={() => deleteWorkout(w.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"><Trash2 size={13} /></button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(w.body_parts || []).map((p) => {
                            const b = BODY_PARTS[p];
                            if (!b) return null;
                            return <span key={p} className="text-[11px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: b.color }}>{b.emoji} {b.label}</span>;
                          })}
                        </div>
                        {w.memo && <p className="text-xs text-gray-400 mt-2 whitespace-pre-wrap">{w.memo}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 식단 기록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Utensils size={16} className="text-orange-400" /><CardTitle>식단 기록</CardTitle></div>
          <Button size="sm" onClick={() => setMOpen(true)}><Plus size={14} /> 식단 추가</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-600" size={20} /></div>
          ) : mealDays.length === 0 ? (
            <p className="text-center py-6 text-sm text-gray-600">먹은 걸 기록하면 서로 식단 관리에 도움이 돼요 🥗</p>
          ) : (
            <div className="space-y-4">
              {mealDays.map(([date, items]) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-gray-400 mb-2">{fmtDate(date)}</p>
                  <div className="space-y-2">
                    {(items as CoupleMeal[]).map((m) => {
                      const mt = MEAL_TYPES[m.meal_type] || MEAL_TYPES.lunch;
                      return (
                        <div key={m.id} className="rounded-xl border border-surface-300 bg-surface-50 p-3 group flex gap-3">
                          {m.photo_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.photo_url} alt={m.content} loading="lazy" className="w-16 h-16 object-cover rounded-lg shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-surface-200 text-gray-300">{mt.emoji} {mt.label}</span>
                                <span className="text-xs text-gray-500">{nameFor(m.user_id)}</span>
                                {m.calories ? <span className="text-[10px] text-orange-400 flex items-center gap-0.5"><Flame size={9} /> {m.calories}kcal</span> : null}
                              </div>
                              <button onClick={() => deleteMeal(m.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"><Trash2 size={13} /></button>
                            </div>
                            <p className="text-sm text-gray-200 mt-1 break-words">{m.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 운동 추가 다이얼로그 */}
      <Dialog open={wOpen} onClose={() => { setWOpen(false); resetW(); }} title="운동 기록하기">
        <div className="space-y-4">
          <Input id="wDate" label="날짜" type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">운동 부위 (여러 개 선택)</label>
            <div className="flex flex-wrap gap-2">
              {BODY_KEYS.map((p) => {
                const b = BODY_PARTS[p];
                const on = wParts.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePart(p)}
                    className={cn('px-3 py-1.5 rounded-lg text-sm border transition-all', on ? 'text-white border-transparent' : 'text-gray-400 border-surface-300 hover:bg-surface-200')}
                    style={on ? { backgroundColor: b.color } : undefined}
                  >{b.emoji} {b.label}</button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input id="wDur" label="운동 시간(분·선택)" type="number" inputMode="numeric" placeholder="예) 60" value={wDuration} onChange={(e) => setWDuration(e.target.value)} />
            </div>
            <button
              onClick={() => setWPt(!wPt)}
              className={cn('self-end h-[42px] px-4 rounded-lg text-sm border transition-all flex items-center gap-1', wPt ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'text-gray-400 border-surface-300')}
            >
              <Star size={14} fill={wPt ? 'currentColor' : 'none'} /> PT
            </button>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">메모 (선택)</label>
            <textarea value={wMemo} onChange={(e) => setWMemo(e.target.value)} rows={2} placeholder="오늘 운동은 어땠나요?"
              className="w-full rounded-lg border bg-surface-100 px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setWOpen(false); resetW(); }}>취소</Button>
            <Button onClick={saveWorkout} loading={wSaving} disabled={!wParts.length}><Plus size={16} /> 저장</Button>
          </div>
        </div>
      </Dialog>

      {/* 식단 추가 다이얼로그 */}
      <Dialog open={mOpen} onClose={() => { setMOpen(false); resetM(); }} title="식단 기록하기">
        <div className="space-y-4">
          <Input id="mDate" label="날짜" type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">끼니</label>
            <div className="flex flex-wrap gap-2">
              {MEAL_KEYS.map((t) => {
                const mt = MEAL_TYPES[t];
                const on = mType === t;
                return (
                  <button key={t} onClick={() => setMType(t)}
                    className={cn('px-3 py-1.5 rounded-lg text-sm border transition-all', on ? 'bg-brand-600 text-white border-transparent' : 'text-gray-400 border-surface-300 hover:bg-surface-200')}
                  >{mt.emoji} {mt.label}</button>
                );
              })}
            </div>
          </div>
          <Input id="mContent" label="먹은 것" placeholder="예) 닭가슴살 샐러드, 고구마" value={mContent} onChange={(e) => setMContent(e.target.value)} autoFocus />
          <Input id="mCal" label="칼로리(kcal·선택)" type="number" inputMode="numeric" placeholder="예) 450" value={mCal} onChange={(e) => setMCal(e.target.value)} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">사진 (선택)</label>
            <input ref={mFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickMealPhoto(e.target.files?.[0])} />
            {mPhoto ? (
              <div className="relative w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mPhoto.preview} alt="미리보기" className="w-full max-h-48 object-cover rounded-lg border border-surface-300" />
                <button onClick={() => setMPhoto((prev) => { if (prev) URL.revokeObjectURL(prev.preview); return null; })} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"><X size={15} /></button>
              </div>
            ) : (
              <button onClick={() => mFileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-surface-400 text-sm text-gray-400 hover:bg-surface-200 transition-colors">
                <ImagePlus size={16} /> 사진 올리기
              </button>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setMOpen(false); resetM(); }}>취소</Button>
            <Button onClick={saveMeal} loading={mSaving} disabled={!mContent.trim()}><Plus size={16} /> 저장</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function groupByDate<T extends { date: string }>(rows: T[]): [string, T[]][] {
  const map: Record<string, T[]> = {};
  rows.forEach((r) => { (map[r.date] ||= []).push(r); });
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
}
