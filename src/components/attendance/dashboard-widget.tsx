'use client';

import Link from 'next/link';
import { Clock, LogIn, LogOut, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ATTENDANCE_STATUS_COLORS, ATTENDANCE_STATUS_LABELS } from '@/lib/constants';
import { deriveTodayStatus, formatClock, formatWorkMinutes } from '@/lib/attendance-utils';
import { useMyAttendance } from '@/hooks/use-attendance';

export function AttendanceDashboardWidget() {
  const { today, loading, mutating, checkIn, checkOut } = useMyAttendance();
  const status = deriveTodayStatus(today);
  const canCheckIn = !today?.check_in;
  const canCheckOut = !!today?.check_in && !today?.check_out;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock size={16} /> 오늘 근태
        </CardTitle>
        <Link
          href="/attendance"
          className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
        >
          상세 <ArrowRight size={12} />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-20 rounded bg-surface-100 animate-pulse" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Badge className={ATTENDANCE_STATUS_COLORS[status]}>
                {ATTENDANCE_STATUS_LABELS[status]}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatWorkMinutes(today?.work_minutes ?? null)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">출근</p>
                <p className="text-gray-200 font-medium tabular-nums">
                  {formatClock(today?.check_in)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">퇴근</p>
                <p className="text-gray-200 font-medium tabular-nums">
                  {formatClock(today?.check_out)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => checkIn()}
                loading={mutating}
                disabled={!canCheckIn}
                className="flex-1"
              >
                <LogIn size={14} /> 출근
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => checkOut()}
                loading={mutating}
                disabled={!canCheckOut}
                className="flex-1"
              >
                <LogOut size={14} /> 퇴근
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
