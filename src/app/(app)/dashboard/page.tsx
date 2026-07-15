'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar, MapPin, MessageCircle, Sparkles, Heart, ArrowRight, Clock,
  CheckSquare, CalendarClock, HandHeart, Dices, Loader2, X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DailyLoveQuote } from '@/components/couple/daily-love-quote';
import { CoupleMainPhoto } from '@/components/couple/couple-main-photo';
import { MilestoneCard } from '@/components/couple/milestone-card';
import { InviteCode } from '@/components/couple/couple-gate';
import { useAuthStore } from '@/stores/auth-store';
import { useSkin } from '@/stores/skin';
import { createClient } from '@/lib/supabase/client';
import { getDayCount, getUpcomingMilestones } from '@/lib/couple-utils';
import { COUPLE_PLACE_CATEGORIES } from '@/lib/constants';
import type { CoupleEvent, CouplePlace } from '@/types';

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile);
  const partner = useAuthStore((s) => s.partner);
  const couple = useAuthStore((s) => s.couple);
  const user = useAuthStore((s) => s.user);
  const discreet = useSkin((s) => s.discreet);
  const [placeCount, setPlaceCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<CoupleEvent[]>([]);
  const [recentPlaces, setRecentPlaces] = useState<CouplePlace[]>([]);
  const [pokeSent, setPokeSent] = useState(false);
  const [rouletteLoading, setRouletteLoading] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);

  const sendPoke = async () => {
    if (!couple || !user || pokeSent) return;
    const supabase = createClient();
    await supabase.from('couple_messages').insert({
      couple_id: couple.id, sender_id: user.id, content: '💗 콕! 보고 싶어요',
    });
    setPokeSent(true);
    setTimeout(() => setPokeSent(false), 3000);
  };

  const spinRoulette = async () => {
    setRouletteLoading(true);
    setRouletteResult(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '오늘 즐길 만한 데이트 아이디어를 딱 하나만 랜덤으로 짧고 재밌게 추천해줘. 캘린더에 일정은 절대 추가하지 말고, 2~3문장으로만.' }),
      });
      const data = await res.json();
      setRouletteResult(data.content || '아이디어를 불러오지 못했어요. 다시 시도해주세요!');
    } catch {
      setRouletteResult('아이디어를 불러오지 못했어요. 다시 시도해주세요!');
    }
    setRouletteLoading(false);
  };

  const anniversary = couple?.anniversary_date;
  const dayCount = anniversary ? getDayCount(anniversary) : 0;
  const nextMilestone = useMemo(
    () => (anniversary ? getUpcomingMilestones(anniversary, 1)[0] : null),
    [anniversary],
  );

  useEffect(() => {
    if (!couple) return;
    async function load() {
      const supabase = createClient();
      const nowIso = new Date().toISOString();
      const [placesCountRes, eventsRes, placesRes] = await Promise.all([
        supabase.from('couple_places').select('id', { count: 'exact', head: true }).eq('couple_id', couple!.id),
        supabase.from('couple_events').select('*').eq('couple_id', couple!.id).gte('start_time', nowIso).order('start_time', { ascending: true }).limit(5),
        supabase.from('couple_places').select('*').eq('couple_id', couple!.id).order('created_at', { ascending: false }).limit(4),
      ]);
      setPlaceCount(placesCountRes.count || 0);
      setUpcomingEvents(eventsRes.data || []);
      setRecentPlaces(placesRes.data || []);
    }
    load();
  }, [couple]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {discreet ? (
        /* 디스크릿 모드: 무채색 업무 대시보드 헤더 */
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-100">대시보드</h2>
          <p className="text-sm text-gray-500 mt-1">오늘의 일정과 항목을 확인하세요.</p>
        </Card>
      ) : (
        <>
          {/* Anniversary hero */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-700 border-0 text-white p-6 lg:p-8">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Heart size={16} fill="currentColor" /> {couple?.couple_name || '우리'}
              </div>
              <div className="mt-2 flex items-end gap-3 flex-wrap">
                <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
                  우리 함께한 지 <span className="tabular-nums">{dayCount.toLocaleString()}</span>일
                </h2>
              </div>
              <p className="mt-2 text-white/85 text-sm">
                {anniversary && `${new Date(anniversary + 'T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}부터`}
                {nextMilestone && ` · ${nextMilestone.label}까지 D-${nextMilestone.dday}`}
              </p>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {!partner && couple && (
                  <div className="flex items-center gap-2 text-sm bg-white/15 rounded-lg px-3 py-1.5">
                    <span>초대 코드</span> <InviteCode code={couple.invite_code} />
                    <span className="text-white/70">를 상대에게 공유하세요</span>
                  </div>
                )}
              </div>
            </div>
            <Heart size={180} className="absolute -right-8 -bottom-10 text-white/10" fill="currentColor" />
          </Card>

          {/* 우리 대표 사진 */}
          <CoupleMainPhoto />

          {/* Daily love quote */}
          <DailyLoveQuote />
        </>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {(discreet
          ? [
              { label: '이용 일수', value: `${dayCount.toLocaleString()}일`, icon: CalendarClock, color: 'text-slate-300', bg: 'bg-slate-500/10' },
              { label: '다음 일정', value: nextMilestone ? `D-${nextMilestone.dday}` : '-', icon: Sparkles, color: 'text-slate-300', bg: 'bg-slate-500/10' },
              { label: '저장된 위치', value: `${placeCount}곳`, icon: MapPin, color: 'text-slate-300', bg: 'bg-slate-500/10' },
              { label: '예정 항목', value: `${upcomingEvents.length}개`, icon: CheckSquare, color: 'text-slate-300', bg: 'bg-slate-500/10' },
            ]
          : [
              { label: '함께한 날', value: `${dayCount.toLocaleString()}일`, icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10' },
              { label: '다음 기념일', value: nextMilestone ? `D-${nextMilestone.dday}` : '-', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: '다녀온 곳', value: `${placeCount}곳`, icon: MapPin, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { label: '예정된 일정', value: `${upcomingEvents.length}개`, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ]
        ).map((stat) => (
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
        {!discreet && partner && (
          <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={sendPoke} disabled={pokeSent}>
            <HandHeart size={14} className="text-rose-400" /> {pokeSent ? '콕! 보냈어요' : '콕 찌르기'}
          </Button>
        )}
        <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={spinRoulette} disabled={rouletteLoading}>
          {rouletteLoading ? <Loader2 size={14} className="animate-spin" /> : <Dices size={14} className="text-amber-400" />} 데이트 룰렛
        </Button>
        <Link href="/calendar"><Button variant="outline" size="sm" className="whitespace-nowrap"><Calendar size={14} /> 일정 추가</Button></Link>
        <Link href="/map"><Button variant="outline" size="sm" className="whitespace-nowrap"><MapPin size={14} /> 장소 기록</Button></Link>
        <Link href="/bucket"><Button variant="outline" size="sm" className="whitespace-nowrap"><CheckSquare size={14} /> 버킷리스트</Button></Link>
      </div>

      {/* Date roulette result */}
      {rouletteResult && (
        <Card className="bg-gradient-to-br from-amber-950/30 to-surface-50 border-amber-900/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Dices size={18} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-300 mb-1">오늘의 데이트 룰렛 🎲</p>
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{rouletteResult}</p>
              </div>
            </div>
            <button onClick={() => setRouletteResult(null)} className="text-gray-600 hover:text-gray-400 shrink-0"><X size={16} /></button>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Upcoming events */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>다가오는 우리 일정</CardTitle>
            <Link href="/calendar" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              캘린더 <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p>예정된 일정이 없어요</p>
                <Link href="/calendar"><Button variant="ghost" size="sm" className="mt-2">첫 일정 만들기</Button></Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-200 transition-colors">
                    <div className="w-1 self-stretch min-h-[2.5rem] rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-200 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(event.start_time).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                        {' '}
                        {new Date(event.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar column */}
        <div className="space-y-4">
          {/* Our milestones */}
          {!discreet && <MilestoneCard />}

          {/* Recent places */}
          <Card>
            <CardHeader>
              <CardTitle>최근 다녀온 곳</CardTitle>
              <Link href="/map" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                지도 <ArrowRight size={12} />
              </Link>
            </CardHeader>
            <CardContent>
              {recentPlaces.length === 0 ? (
                <p className="text-center py-4 text-gray-600 text-sm">아직 기록이 없어요</p>
              ) : (
                <div className="space-y-2">
                  {recentPlaces.map((place) => {
                    const cat = COUPLE_PLACE_CATEGORIES[place.category] || COUPLE_PLACE_CATEGORIES.etc;
                    return (
                      <div key={place.id} className="flex items-center gap-2 p-1.5">
                        <span className="text-lg">{cat.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-200 truncate">{place.name}</p>
                          {place.visited_date && <p className="text-[11px] text-gray-500">{place.visited_date}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI recommendation */}
          <Link href="/assistant">
            <Card hover className="bg-gradient-to-br from-brand-950/50 to-surface-50 border-brand-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-500/20">
                  <Sparkles size={20} className="text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">AI 데이트 추천</p>
                  <p className="text-xs text-gray-500">코스·맛집 추천, 이번 달 정리</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
