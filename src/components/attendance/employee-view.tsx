'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Clock, LogIn, LogOut, MapPin, Plane, Palmtree, Stethoscope,
  CheckCircle2, AlertCircle, FileText, CalendarClock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ATTENDANCE_STATUS_COLORS,
  ATTENDANCE_STATUS_LABELS,
} from '@/lib/constants';
import {
  deriveTodayStatus,
  formatClock,
  formatWorkMinutes,
  summarizeMonth,
} from '@/lib/attendance-utils';
import { formatDate } from '@/lib/utils';
import { useMyAttendance } from '@/hooks/use-attendance';
import type { AttendanceStatus } from '@/types';

const QUICK_STATUSES: { status: AttendanceStatus; label: string; icon: typeof MapPin }[] = [
  { status: 'field_work', label: '외근', icon: MapPin },
  { status: 'business_trip', label: '출장', icon: Plane },
  { status: 'vacation', label: '휴가', icon: Palmtree },
  { status: 'sick_leave', label: '병가', icon: Stethoscope },
];

export function EmployeeAttendanceView() {
  const {
    today,
    monthRecords,
    settings,
    loading,
    mutating,
    hasNoteToday,
    checkIn,
    checkOut,
    setStatus,
  } = useMyAttendance();
  const [toast, setToast] = useState<{ kind: 'info' | 'error' | 'success'; msg: string } | null>(null);

  const status = deriveTodayStatus(today);
  const summary = summarizeMonth(monthRecords);
  const now = new Date();

  const showToast = (kind: 'info' | 'error' | 'success', msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCheckIn = async () => {
    const res = await checkIn();
    if ('error' in res && res.error) showToast('error', res.error);
    else showToast('success', '출근 처리 완료!');
  };

  const handleCheckOut = async () => {
    const res = await checkOut();
    if ('error' in res && res.error) {
      showToast(('blocked' in res && res.blocked) ? 'error' : 'error', res.error);
    } else {
      showToast('success', '수고하셨어요. 퇴근 완료!');
    }
  };

  const handleQuickStatus = async (s: AttendanceStatus) => {
    const res = await setStatus(s);
    if ('error' in res && res.error) showToast('error', res.error);
    else showToast('success', `${ATTENDANCE_STATUS_LABELS[s]} 상태로 설정했어요.`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 rounded-xl bg-surface-100 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-surface-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const canCheckIn = !today?.check_in;
  const canCheckOut = !!today?.check_in && !today?.check_out;
  const showNoteWarning =
    settings.require_note_on_checkout && !hasNoteToday && canCheckOut;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-xl animate-slide-in-right text-sm font-medium ${
            toast.kind === 'error'
              ? 'bg-red-500/90 text-white'
              : toast.kind === 'success'
                ? 'bg-emerald-500/90 text-white'
                : 'bg-brand-600/90 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Today status card */}
      <Card className="card-shine">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarClock size={14} />
              {formatDate(now, { weekday: 'long' })}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Badge className={ATTENDANCE_STATUS_COLORS[status]}>
                {ATTENDANCE_STATUS_LABELS[status]}
              </Badge>
              <span className="text-xs text-gray-500">
                기준 출근 {settings.standard_check_in_time.slice(0, 5)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">출근</p>
                <p className="text-xl font-bold text-gray-100 mt-1">
                  {formatClock(today?.check_in)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">퇴근</p>
                <p className="text-xl font-bold text-gray-100 mt-1">
                  {formatClock(today?.check_out)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">근무시간</p>
                <p className="text-xl font-bold text-gray-100 mt-1">
                  {formatWorkMinutes(today?.work_minutes ?? null)}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 lg:w-64">
            <Button
              size="lg"
              onClick={handleCheckIn}
              loading={mutating}
              disabled={!canCheckIn}
              className="w-full"
            >
              <LogIn size={18} /> 출근하기
            </Button>
            <Button
              size="lg"
              variant={canCheckOut ? 'secondary' : 'outline'}
              onClick={handleCheckOut}
              loading={mutating}
              disabled={!canCheckOut}
              className="w-full"
            >
              <LogOut size={18} /> 퇴근하기
            </Button>
          </div>
        </div>

        {showNoteWarning && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-300">
              오늘 업무일지(메모)가 아직 작성되지 않았어요.{' '}
              <Link href="/notes?new=true" className="underline">
                지금 작성
              </Link>
              {settings.block_checkout_without_note && ' — 작성 전에는 퇴근할 수 없어요.'}
            </div>
          </div>
        )}
      </Card>

      {/* Quick status */}
      <div>
        <p className="text-xs text-gray-500 mb-2">빠른 상태 변경</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_STATUSES.map(({ status: s, label, icon: Icon }) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => handleQuickStatus(s)}
              disabled={mutating}
            >
              <Icon size={14} /> {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: '정상 출근', value: `${summary.presentDays}일`, color: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: CheckCircle2 },
          { label: '지각', value: `${summary.lateCount}회`, color: 'text-amber-400', bg: 'bg-amber-500/10', Icon: Clock },
          { label: '결근', value: `${summary.absentCount}일`, color: 'text-red-400', bg: 'bg-red-500/10', Icon: AlertCircle },
          { label: '총 근무', value: formatWorkMinutes(summary.totalWorkMinutes), color: 'text-brand-400', bg: 'bg-brand-500/10', Icon: Clock },
        ].map((s) => (
          <Card key={s.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-gray-100 mt-1">{s.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.Icon size={18} className={s.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Month records */}
      <Card>
        <CardHeader>
          <CardTitle>이번 달 근태 기록</CardTitle>
          <Link href="/notes" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            <FileText size={12} /> 업무일지
          </Link>
        </CardHeader>
        <CardContent>
          {monthRecords.length === 0 ? (
            <p className="text-center py-8 text-gray-600 text-sm">아직 기록이 없어요.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-surface-300">
                    <th className="py-2 pr-3 font-medium">날짜</th>
                    <th className="py-2 pr-3 font-medium">상태</th>
                    <th className="py-2 pr-3 font-medium">출근</th>
                    <th className="py-2 pr-3 font-medium">퇴근</th>
                    <th className="py-2 pr-3 font-medium">근무시간</th>
                    <th className="py-2 font-medium">메모</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRecords.map((r) => (
                    <tr key={r.id} className="border-b border-surface-200/50">
                      <td className="py-2 pr-3 text-gray-300">
                        {formatDate(r.date, { month: 'short', day: 'numeric', weekday: 'short' })}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge className={ATTENDANCE_STATUS_COLORS[r.status]}>
                          {ATTENDANCE_STATUS_LABELS[r.status]}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-gray-300 tabular-nums">{formatClock(r.check_in)}</td>
                      <td className="py-2 pr-3 text-gray-300 tabular-nums">{formatClock(r.check_out)}</td>
                      <td className="py-2 pr-3 text-gray-300 tabular-nums">{formatWorkMinutes(r.work_minutes)}</td>
                      <td className="py-2 text-gray-500 text-xs">{r.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
