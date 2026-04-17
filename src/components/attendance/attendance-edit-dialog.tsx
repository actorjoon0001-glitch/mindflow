'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_WORK_TYPE_LABELS } from '@/lib/constants';
import type {
  AttendanceRecordWithProfile,
  AttendanceStatus,
  AttendanceWorkType,
} from '@/types';

interface Props {
  record: AttendanceRecordWithProfile | null;
  onClose: () => void;
  onSave: (
    id: string,
    patch: {
      check_in: string | null;
      check_out: string | null;
      status: AttendanceStatus;
      work_type: AttendanceWorkType;
      note: string | null;
      team_name: string | null;
    },
  ) => Promise<{ error?: string } | { record: unknown }>;
  saving: boolean;
}

function toInputDateTime(iso: string | null | undefined, fallbackDate: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  void fallbackDate;
  return `${year}-${month}-${day}T${hour}:${min}`;
}

function fromInputDateTime(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function AttendanceEditDialog({ record, onClose, onSave, saving }: Props) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('working');
  const [workType, setWorkType] = useState<AttendanceWorkType>('office');
  const [note, setNote] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!record) return;
    setCheckIn(toInputDateTime(record.check_in, record.date));
    setCheckOut(toInputDateTime(record.check_out, record.date));
    setStatus(record.status);
    setWorkType(record.work_type);
    setNote(record.note ?? '');
    setTeamName(record.team_name ?? record.profile?.team_name ?? '');
    setError(null);
  }, [record]);

  if (!record) return null;

  const handleSave = async () => {
    setError(null);
    const res = await onSave(record.id, {
      check_in: fromInputDateTime(checkIn),
      check_out: fromInputDateTime(checkOut),
      status,
      work_type: workType,
      note: note.trim() || null,
      team_name: teamName.trim() || null,
    });
    if ('error' in res && res.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  const title = `${record.profile?.full_name ?? record.profile?.email ?? '직원'} — ${record.date}`;

  return (
    <Dialog open={!!record} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">출근 시간</label>
            <Input
              id="checkIn"
              type="datetime-local"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">퇴근 시간</label>
            <Input
              id="checkOut"
              type="datetime-local"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
              className="w-full px-3 py-2 rounded-lg bg-surface-100 border border-surface-300 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {Object.entries(ATTENDANCE_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">근무 유형</label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value as AttendanceWorkType)}
              className="w-full px-3 py-2 rounded-lg bg-surface-100 border border-surface-300 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {Object.entries(ATTENDANCE_WORK_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">소속팀</label>
          <Input
            id="teamName"
            placeholder="예: 개발팀"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">비고 / 메모</label>
          <Textarea
            id="attendanceNote"
            rows={3}
            placeholder="관리자 메모를 입력하세요"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>취소</Button>
          <Button onClick={handleSave} loading={saving}>저장</Button>
        </div>
      </div>
    </Dialog>
  );
}
