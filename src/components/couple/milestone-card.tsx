'use client';

import { useMemo, useState } from 'react';
import { Heart, Plus, Trash2, CalendarHeart } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/auth-store';
import { useCoupleMilestones } from '@/hooks/use-couple-milestones';
import { getUpcomingMilestones, parseLocalDate } from '@/lib/couple-utils';
import { MILESTONE_EMOJIS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Row {
  key: string;
  emoji: string;
  label: string;
  date: string;
  dday: number;
  custom?: string; // milestone id if deletable
}

function ddayFrom(dateStr: string) {
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((parseLocalDate(dateStr).getTime() - t0) / 86400000);
}

export function MilestoneCard() {
  const couple = useAuthStore((s) => s.couple);
  const { milestones, addMilestone, deleteMilestone } = useCoupleMilestones();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [emoji, setEmoji] = useState(MILESTONE_EMOJIS[0]);
  const [saving, setSaving] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const auto: Row[] = couple
      ? getUpcomingMilestones(couple.anniversary_date, 3).map((m) => ({
          key: `auto-${m.label}`, emoji: '💞', label: m.label, date: m.date, dday: m.dday,
        }))
      : [];
    const custom: Row[] = milestones
      .map((m) => ({ key: `c-${m.id}`, emoji: m.emoji, label: m.title, date: m.date, dday: ddayFrom(m.date), custom: m.id }))
      .filter((r) => r.dday >= 0);
    return [...auto, ...custom].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  }, [couple, milestones]);

  const handleAdd = async () => {
    if (!title.trim() || !date) return;
    setSaving(true);
    await addMilestone(title, date, emoji);
    setTitle(''); setDate(''); setEmoji(MILESTONE_EMOJIS[0]);
    setSaving(false);
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Heart size={14} className="text-rose-400" fill="currentColor" /> 우리 기념일
        </CardTitle>
        <button onClick={() => setOpen(true)} className="text-gray-500 hover:text-rose-300 transition-colors" title="기념일 추가">
          <Plus size={16} />
        </button>
      </CardHeader>
      {rows.length === 0 ? (
        <p className="text-center py-4 text-gray-600 text-sm">기념일을 추가해보세요</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-2 group">
              <span className="text-lg shrink-0">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{r.label}</p>
                <p className="text-[11px] text-gray-500">
                  {new Date(r.date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <span className="text-xs font-medium text-rose-300 shrink-0">{r.dday === 0 ? 'D-DAY' : `D-${r.dday}`}</span>
              {r.custom && (
                <button
                  onClick={() => deleteMilestone(r.custom!)}
                  className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="기념일 추가">
        <div className="space-y-4">
          <Input id="msTitle" placeholder="예) 첫 여행 ✈️" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <Input id="msDate" label="날짜" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">이모지</label>
            <div className="flex flex-wrap gap-1.5">
              {MILESTONE_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn('h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-all', emoji === e ? 'bg-brand-600' : 'bg-surface-100 hover:bg-surface-200')}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={handleAdd} loading={saving}><CalendarHeart size={16} /> 추가</Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}
