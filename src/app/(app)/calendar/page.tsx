'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Clock, MapPin,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { useEvents } from '@/hooks/use-events';
import { cn } from '@/lib/utils';
import { EVENT_COLORS } from '@/lib/constants';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newLocation, setNewLocation] = useState('');
  const [newColor, setNewColor] = useState(EVENT_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const rangeStart = new Date(year, month, 1).toISOString();
  const rangeEnd = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  const { events, loading, createEvent, deleteEvent } = useEvents({ start: rangeStart, end: rangeEnd });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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

  const navigate = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

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
      color: newColor,
    });
    setNewTitle('');
    setNewDate('');
    setNewStartTime('09:00');
    setNewEndTime('10:00');
    setNewLocation('');
    setShowNew(false);
    setCreating(false);
  };

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft size={18} />
          </Button>
          <h2 className="text-lg font-semibold text-gray-100">
            {year}년 {month + 1}월
          </h2>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight size={18} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
            오늘
          </Button>
        </div>
        <Button onClick={() => { setNewDate(selectedDate || todayStr); setShowNew(true); }}>
          <Plus size={16} /> 일정 추가
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar grid */}
        <Card className="p-4">
          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map((d, i) => (
              <div key={d} className={cn(
                'text-center text-xs font-medium py-2',
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
              )}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first week */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="h-20 lg:h-24" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dayOfWeek = (firstDay + i) % 7;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    'h-20 lg:h-24 p-1.5 rounded-lg text-left transition-all',
                    'hover:bg-surface-200',
                    isSelected && 'bg-brand-600/10 ring-1 ring-brand-500',
                    isToday && !isSelected && 'bg-surface-200'
                  )}
                >
                  <span className={cn(
                    'text-sm font-medium',
                    isToday ? 'text-brand-400' : dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-gray-300'
                  )}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[10px] px-1 py-0.5 rounded truncate text-white/90"
                        style={{ backgroundColor: ev.color + '90' }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-gray-500">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected date sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-100 mb-3">
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
                : '날짜를 선택하세요'}
            </h3>
            {selectedDate && (
              <div className="space-y-3">
                {selectedEvents.length === 0 ? (
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
                      </div>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                      >
                        삭제
                      </button>
                    </div>
                  ))
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => { setNewDate(selectedDate); setShowNew(true); }}
                >
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
          <Input
            id="eventTitle"
            placeholder="일정 제목"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <Input
            id="eventDate"
            label="날짜"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">시작</label>
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full rounded-lg border bg-surface-100 px-3 py-2.5 text-sm text-gray-200 border-surface-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">종료</label>
              <input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full rounded-lg border bg-surface-100 px-3 py-2.5 text-sm text-gray-200 border-surface-300"
              />
            </div>
          </div>
          <Input
            id="eventLocation"
            placeholder="장소 (선택)"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">색상</label>
            <div className="flex gap-2">
              {EVENT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-transform',
                    newColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-surface-50 scale-110'
                  )}
                  style={{ backgroundColor: color }}
                />
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
