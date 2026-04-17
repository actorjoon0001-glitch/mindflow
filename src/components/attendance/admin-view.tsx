'use client';

import { useMemo, useState } from 'react';
import { Filter, Pencil, Users, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ATTENDANCE_STATUS_COLORS,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_WORK_TYPE_LABELS,
} from '@/lib/constants';
import { formatClock, formatWorkMinutes, todayDateString } from '@/lib/attendance-utils';
import { formatDate } from '@/lib/utils';
import { useAttendanceAdmin } from '@/hooks/use-attendance';
import type { AttendanceRecordWithProfile, AttendanceStatus } from '@/types';
import { AttendanceEditDialog } from './attendance-edit-dialog';

export function AdminAttendanceView() {
  const { filters, setFilters, records, teams, loading, updating, updateRecord } =
    useAttendanceAdmin();
  const [editing, setEditing] = useState<AttendanceRecordWithProfile | null>(null);

  const today = todayDateString();
  const summary = useMemo(() => {
    const todayRecords = records.filter((r) => r.date === today);
    return {
      totalToday: todayRecords.length,
      present: todayRecords.filter((r) => r.check_in && !r.check_out).length,
      checkedOut: todayRecords.filter((r) => r.check_out).length,
      late: todayRecords.filter((r) => r.is_late || r.status === 'late').length,
      notCheckedIn: todayRecords.filter((r) => !r.check_in).length,
      leave: todayRecords.filter((r) =>
        ['vacation', 'sick_leave', 'field_work', 'business_trip', 'absent'].includes(r.status),
      ).length,
    };
  }, [records, today]);

  return (
    <div className="space-y-6">
      {/* Today summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: '오늘 근무 중', value: summary.present, Icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: '오늘 퇴근 완료', value: summary.checkedOut, Icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: '지각', value: summary.late, Icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: '미출근', value: summary.notCheckedIn, Icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((s) => (
          <Card key={s.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">{s.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.Icon size={18} className={s.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={16} /> 필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">시작일</label>
              <Input
                id="from"
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">종료일</label>
              <Input
                id="to"
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">팀</label>
              <select
                value={filters.teamName ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, teamName: e.target.value || undefined }))
                }
                className="w-full px-3 py-2.5 rounded-lg bg-surface-100 border border-surface-300 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">전체</option>
                {teams.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">상태</label>
              <select
                value={filters.status ?? 'all'}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    status: e.target.value as AttendanceStatus | 'all',
                  }))
                }
                className="w-full px-3 py-2.5 rounded-lg bg-surface-100 border border-surface-300 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">전체</option>
                {Object.entries(ATTENDANCE_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">이름/이메일</label>
              <Input
                id="userQuery"
                placeholder="검색"
                value={filters.userQuery ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, userQuery: e.target.value || undefined }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>근태 기록 ({records.length}건)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 rounded bg-surface-100 animate-pulse" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <p className="text-center py-8 text-gray-600 text-sm">조건에 맞는 기록이 없어요.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-surface-300">
                    <th className="py-2 pr-3 font-medium">날짜</th>
                    <th className="py-2 pr-3 font-medium">이름</th>
                    <th className="py-2 pr-3 font-medium">팀</th>
                    <th className="py-2 pr-3 font-medium">출근</th>
                    <th className="py-2 pr-3 font-medium">퇴근</th>
                    <th className="py-2 pr-3 font-medium">근무시간</th>
                    <th className="py-2 pr-3 font-medium">상태</th>
                    <th className="py-2 pr-3 font-medium">유형</th>
                    <th className="py-2 pr-3 font-medium">비고</th>
                    <th className="py-2 font-medium text-right">수정</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-surface-200/50 hover:bg-surface-100/40">
                      <td className="py-2 pr-3 text-gray-300 tabular-nums whitespace-nowrap">
                        {formatDate(r.date, { month: 'short', day: 'numeric', weekday: 'short' })}
                      </td>
                      <td className="py-2 pr-3 text-gray-200 whitespace-nowrap">
                        {r.profile?.full_name ?? r.profile?.email ?? '—'}
                      </td>
                      <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">
                        {r.team_name ?? r.profile?.team_name ?? '-'}
                      </td>
                      <td className="py-2 pr-3 text-gray-300 tabular-nums">
                        {formatClock(r.check_in)}
                        {r.is_late && (
                          <Badge className="ml-2" variant="warning">지각</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-gray-300 tabular-nums">
                        {formatClock(r.check_out)}
                      </td>
                      <td className="py-2 pr-3 text-gray-300 tabular-nums">
                        {formatWorkMinutes(r.work_minutes)}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge className={ATTENDANCE_STATUS_COLORS[r.status]}>
                          {ATTENDANCE_STATUS_LABELS[r.status]}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">
                        {ATTENDANCE_WORK_TYPE_LABELS[r.work_type]}
                      </td>
                      <td className="py-2 pr-3 text-gray-500 text-xs max-w-[160px] truncate">
                        {r.note || '-'}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing(r)}
                          className="!p-1.5"
                        >
                          <Pencil size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AttendanceEditDialog
        record={editing}
        saving={updating}
        onClose={() => setEditing(null)}
        onSave={(id, patch) => updateRecord(id, patch)}
      />
    </div>
  );
}
