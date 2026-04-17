'use client';

import { useState } from 'react';
import { Clock, UserCog, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { isAdminRole } from '@/lib/attendance-utils';
import { cn } from '@/lib/utils';
import { EmployeeAttendanceView } from '@/components/attendance/employee-view';
import { AdminAttendanceView } from '@/components/attendance/admin-view';

type Mode = 'me' | 'admin';

export default function AttendancePage() {
  const profile = useAuthStore((s) => s.profile);
  const initialized = useAuthStore((s) => s.initialized);
  const canAdmin = isAdminRole(profile?.role);
  const [mode, setMode] = useState<Mode>(canAdmin ? 'admin' : 'me');

  if (!initialized) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded bg-surface-100 animate-pulse" />
        <div className="h-40 rounded-xl bg-surface-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Clock size={24} /> 근태관리
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'me'
              ? '오늘 출퇴근과 이번 달 근태를 한눈에 확인하세요.'
              : '팀원의 근태를 조회하고 기록을 수정할 수 있어요.'}
          </p>
        </div>

        {canAdmin && (
          <div className="inline-flex items-center p-1 rounded-lg bg-surface-100 border border-surface-300">
            <button
              onClick={() => setMode('me')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                mode === 'me' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200',
              )}
            >
              <User size={14} /> 내 근태
            </button>
            <button
              onClick={() => setMode('admin')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                mode === 'admin' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200',
              )}
            >
              <UserCog size={14} /> 관리자
            </button>
          </div>
        )}
      </div>

      {mode === 'admin' && canAdmin ? <AdminAttendanceView /> : <EmployeeAttendanceView />}
    </div>
  );
}
