'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { useCoupleEvents } from '@/hooks/use-couple-events';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { COUPLE_EVENT_CATEGORIES, MILESTONE_COLORS } from '@/lib/constants';
import {
  getMonthAnniversaries, getDayCount, getUpcomingMilestones, type Milestone,
} from '@/lib/couple-utils';
import type { CoupleEventCategory } from '@/types';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const CATEGORY_KEYS = Object.keys(COUPLE_EVENT_CATEGORIES) as CoupleEventCategory[];

export default function CalendarPage() {
  const couple = useAuthStore((s) => s.couple);
  const user = useAuthStore((s) => s.user);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('12:00');
  const [newEndTime, setNewEndTime] = useState('13:00');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState<CoupleEventCategory>('date');
  const [creating, setCreating] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const rangeStart = new Date(year, month, 1).toISOString();
  const rangeEnd = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  const { events, createEvent, deleteEvent } = useCoupleEvents({ start: rangeStart, end: rangeEnd });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const anniversary = couple?.anniversary_date;
  const monthAnniversaries = useMemo<Record<string, Milestone[]>>(
    () => (anniversary ? getMonthAnniversaries(anniversary, year, month) : {}),
    [anniversary, year, month],
  );
  const upcoming = useMemo(
    () => (anniversary ? getUpcomingMilestones(anniversary, 4) : []),
    [anniversary],
  );
  const dayCount = anniversary ? getDayCount(anniversary) : 0;

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {};
    events.forEach((event) => {
      const date = new Date(event.start_time).toLocaleDateString('en-CA');
      if (!map[date]) map[date] = [];
      map[date].push(event);
    });
    return map;
  }, [events]);

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];
  const selectedMilestones = selectedDate ? (monthAnniversaries[selectedDate] || []) : [];

  const navigate = (dir: number) => setCurrentDate(new Date(year, month + dir, 1));

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDate) return;
    setCreating(true);
    const start = new Date(`${newDate}T${newStartTime}`);
    const end = new Date(`${newDate}T${newEndTime}`);
    await createEvent({
      title: newTitle,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      location: newLocation || undefined,
      category: newCategory,
      color: COUPLE_EVENT_CATEGORIES[newCategory].color,
    });
    setNewTitle('');
    setNewDate('');
    setNewStartTime('12:00');
    setNewEndTime('13:00');
    setNewLocation('');
    setNewCategory('date');
    setShowNew(false);
    setCreating(false);
  };

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft size={18} />
          </Button>
          <h2 className="text-lg font-semibold text-gray-100">{year}년 {month + 1}월</h2>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight size={18} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>오늘</Button>
        </div>
        <div className="flex items-center gap-3">
          {anniversary && (
            <span className="hidden sm:flex items-center gap-1.5 text-sm text-rose-300">
              <Heart size={14} fill="currentColor" /> 우리 {dayCount.toLocaleString()}일
            </span>
          )}
          <Button onClick={() => { setNewDate(selectedDate || todayStr); setShowNew(true); }}>
            <Plus size={16} /> 일정 추가
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar grid */}
        <Card className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map((d, i) => (
              <div key={d} className={cn(
                'text-center text-xs font-medium py-2',
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
              )}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="h-20 lg:h-24" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const milestones = monthAnniversaries[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dayOfWeek = (firstDay + i) % 7;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    'h-20 lg:h-24 p-1.5 rounded-lg text-left transition-all hover:bg-surface-200 overflow-hidden',
                    isSelected && 'bg-brand-600/10 ring-1 ring-brand-500',
                    isToday && !isSelected && 'bg-surface-200',
                    milestones.length && !isSelected && 'bg-rose-500/5 ring-1 ring-rose-500/30'
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      'text-sm font-medium',
                      isToday ? 'text-brand-400' : dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-gray-300'
                    )}>{day}</span>
                    {milestones.length > 0 && <Heart size={10} className="text-rose-400" fill="currentColor" />}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {milestones.slice(0, 1).map((m) => (
                      <div key={m.label} className="text-[10px] px-1 py-0.5 rounded truncate bg-rose-500/25 text-rose-200">
                        {m.label}
                      </div>
                    ))}
                    {dayEvents.slice(0, milestones.length ? 1 : 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[10px] px-1 py-0.5 rounded truncate text-white/90"
                        style={{ backgroundColor: ev.color + '90' }}
                      >{ev.title}</div>
                    ))}
                    {dayEvents.length + milestones.length > 2 && (
                      <span className="text-[10px] text-gray-500">+{dayEvents.length + milestones.length - 2}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming milestones */}
          {upcoming.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-1.5">
                <Heart size={14} className="text-rose-400" fill="currentColor" /> 다가오는 기념일
              </h3>
              <div className="space-y-2">
                {upcoming.map((m) => (
                  <div key={m.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{m.label}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(m.date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      <span className="ml-1.5 text-rose-300 font-medium">
                        {m.dday === 0 ? 'D-DAY' : `D-${m.dday}`}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Selected date */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-100 mb-3">
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
                : '날짜를 선택하세요'}
            </h3>
            {selectedDate && (
              <div className="space-y-3">
                {selectedMilestones.map((m) => (
                  <div key={m.label} className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm', MILESTONE_COLORS[m.type])}>
                    <Heart size={12} fill="currentColor" /> {m.label}
                  </div>
                ))}
                {selectedEvents.length === 0 && selectedMilestones.length === 0 ? (
                  <p className="text-sm text-gray-600 py-4 text-center">일정이 없습니다</p>
                ) : (
                  selectedEvents.map((event) => (
                    <div key={event.id} className="flex gap-3 group">
                      <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200">{event.title}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          {new Date(event.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(event.end_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {event.location && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />{event.location}
                          </p>
                        )}
                        <span className="text-[10px] text-gray-600">
                          {event.created_by === user?.id ? '내가 추가' : '상대가 추가'}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                      >삭제</button>
                    </div>
                  ))
                )}
                <Button variant="ghost" size="sm" className="w-full" onClick={() => { setNewDate(selectedDate); setShowNew(true); }}>
                  <Plus size={14} /> 일정 추가
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* New event dialog */}
      <Dialog open={showNew} onClose={() => setShowNew(false)} title="새 일정">
        <div className="space-y-4">
          <Input id="eventTitle" placeholder="일정 제목" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
          <Input id="eventDate" label="날짜" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">시작</label>
              <input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full rounded-lg border bg-surface-100 px-3 py-2.5 text-sm text-gray-200 border-surface-300" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">종료</label>
              <input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full rounded-lg border bg-surface-100 px-3 py-2.5 text-sm text-gray-200 border-surface-300" />
            </div>
          </div>
          <Input id="eventLocation" placeholder="장소 (선택)" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">종류</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setNewCategory(key)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-all',
                    newCategory === key ? 'text-white border-transparent' : 'text-gray-400 border-surface-300 hover:bg-surface-200'
                  )}
                  style={newCategory === key ? { backgroundColor: COUPLE_EVENT_CATEGORIES[key].color } : undefined}
                >{COUPLE_EVENT_CATEGORIES[key].label}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowNew(false)}>취소</Button>
            <Button onClick={handleCreate} loading={creating}>추가</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
