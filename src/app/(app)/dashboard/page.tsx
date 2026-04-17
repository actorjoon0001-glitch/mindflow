'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText, CheckSquare, Calendar, Bot,
  TrendingUp, Clock, Plus, ArrowRight, Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { TASK_PRIORITY_COLORS } from '@/lib/constants';
import { AttendanceDashboardWidget } from '@/components/attendance/dashboard-widget';
import type { Note, Task, CalendarEvent } from '@/types';

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState({ notes: 0, tasks: 0, completedTasks: 0, events: 0 });
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const supabase = createClient();
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const [notesRes, tasksRes, completedRes, eventsRes, recentNotesRes, upcomingTasksRes, todayEventsRes] =
        await Promise.all([
          supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
          supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).neq('status', 'done'),
          supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'done'),
          supabase.from('events').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).gte('start_time', startOfDay),
          supabase.from('notes').select('*').eq('user_id', user!.id).order('updated_at', { ascending: false }).limit(5),
          supabase.from('tasks').select('*').eq('user_id', user!.id).neq('status', 'done').neq('status', 'cancelled').order('due_date', { ascending: true, nullsFirst: false }).limit(5),
          supabase.from('events').select('*').eq('user_id', user!.id).gte('start_time', startOfDay).lte('start_time', endOfDay).order('start_time', { ascending: true }),
        ]);

      setStats({
        notes: notesRes.count || 0,
        tasks: tasksRes.count || 0,
        completedTasks: completedRes.count || 0,
        events: eventsRes.count || 0,
      });
      setRecentNotes(recentNotesRes.data || []);
      setUpcomingTasks(upcomingTasksRes.data || []);
      setTodayEvents(todayEventsRes.data || []);
    }
    load();
  }, [user]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '새벽에도 열정적이시네요';
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '오후도 화이팅';
    return '수고한 하루였어요';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-100">
          {greeting()}, {profile?.full_name || '사용자'}님 <span className="inline-block animate-bounce">👋</span>
        </h2>
        <p className="text-gray-500">오늘도 MindFlow와 함께 생산적인 하루를 시작하세요.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: '전체 메모', value: stats.notes, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: '진행 중 할 일', value: stats.tasks, icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: '완료한 할 일', value: stats.completedTasks, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: '오늘 일정', value: stats.events, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat) => (
          <Card key={stat.label} className="card-shine">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon size={18} className={stat.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/notes?new=true">
          <Button variant="outline" size="sm" className="whitespace-nowrap">
            <Plus size={14} /> 새 메모
          </Button>
        </Link>
        <Link href="/tasks">
          <Button variant="outline" size="sm" className="whitespace-nowrap">
            <Plus size={14} /> 할 일 추가
          </Button>
        </Link>
        <Link href="/assistant">
          <Button variant="outline" size="sm" className="whitespace-nowrap">
            <Sparkles size={14} /> AI 비서
          </Button>
        </Link>
      </div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent notes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>최근 메모</CardTitle>
            <Link href="/notes" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              전체보기 <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent>
            {recentNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p>아직 메모가 없어요</p>
                <Link href="/notes?new=true">
                  <Button variant="ghost" size="sm" className="mt-2">첫 메모 작성하기</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <Link key={note.id} href={`/notes/${note.id}`} className="block">
                    <div className="p-3 rounded-lg hover:bg-surface-200 transition-colors group">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium text-gray-200 group-hover:text-gray-100">
                          {note.title || '제목 없음'}
                        </h4>
                        <span className="text-xs text-gray-600 shrink-0 ml-3">
                          {formatRelativeTime(note.updated_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {truncate(note.content || '내용 없음', 100)}
                      </p>
                      {note.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {note.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="primary">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar column */}
        <div className="space-y-4">
          {/* Today attendance */}
          <AttendanceDashboardWidget />

          {/* Upcoming tasks */}
          <Card>
            <CardHeader>
              <CardTitle>다가오는 할 일</CardTitle>
              <Link href="/tasks" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                전체보기 <ArrowRight size={12} />
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <p className="text-center py-4 text-gray-600 text-sm">할 일이 없어요</p>
              ) : (
                <div className="space-y-2">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-200 transition-colors">
                      <div className="w-4 h-4 rounded border border-surface-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-200 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={TASK_PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                          {task.due_date && (
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(task.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today schedule */}
          <Card>
            <CardHeader>
              <CardTitle>오늘 일정</CardTitle>
              <Link href="/calendar" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                캘린더 <ArrowRight size={12} />
              </Link>
            </CardHeader>
            <CardContent>
              {todayEvents.length === 0 ? (
                <p className="text-center py-4 text-gray-600 text-sm">오늘 일정이 없어요</p>
              ) : (
                <div className="space-y-2">
                  {todayEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-2">
                      <div
                        className="w-1 h-full min-h-[2rem] rounded-full shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <div>
                        <p className="text-sm text-gray-200">{event.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(event.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(event.end_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Quick Action */}
          <Link href="/assistant">
            <Card hover className="bg-gradient-to-br from-brand-950/50 to-surface-50 border-brand-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-500/20">
                  <Bot size={20} className="text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">AI 비서에게 물어보기</p>
                  <p className="text-xs text-gray-500">메모 정리, 할 일 관리를 도와드려요</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
