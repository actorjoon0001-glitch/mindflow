import type {
  AttendanceRecord,
  AttendanceSettings,
  AttendanceStatus,
  UserRole,
} from '@/types';

export function todayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function monthRange(base: Date = new Date()): { from: string; to: string } {
  const year = base.getFullYear();
  const month = base.getMonth();
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return { from: todayDateString(from), to: todayDateString(to) };
}

export function isAdminRole(role: UserRole | undefined | null): boolean {
  return role === 'admin' || role === 'manager';
}

export function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

export function isLateCheckIn(checkIn: Date, standardCheckInTime: string): boolean {
  const standardMin = parseTimeToMinutes(standardCheckInTime);
  const actualMin = checkIn.getHours() * 60 + checkIn.getMinutes();
  return actualMin > standardMin;
}

export function calcWorkMinutes(checkIn: string | null, checkOut: string | null): number | null {
  if (!checkIn || !checkOut) return null;
  const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (diffMs <= 0) return 0;
  return Math.round(diffMs / 60000);
}

export function formatWorkMinutes(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export function formatClock(iso: string | null | undefined): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function deriveTodayStatus(record: AttendanceRecord | null): AttendanceStatus {
  if (!record) return 'not_checked_in';
  // Leave / field statuses override
  const leaveStatuses: AttendanceStatus[] = [
    'field_work',
    'business_trip',
    'vacation',
    'sick_leave',
    'absent',
  ];
  if (leaveStatuses.includes(record.status)) return record.status;
  if (record.check_out) return 'checked_out';
  if (record.check_in) return record.is_late ? 'late' : 'working';
  return 'not_checked_in';
}

export interface MonthSummary {
  presentDays: number;
  lateCount: number;
  absentCount: number;
  vacationCount: number;
  totalWorkMinutes: number;
  fieldOrTripDays: number;
}

export function summarizeMonth(records: AttendanceRecord[]): MonthSummary {
  const summary: MonthSummary = {
    presentDays: 0,
    lateCount: 0,
    absentCount: 0,
    vacationCount: 0,
    totalWorkMinutes: 0,
    fieldOrTripDays: 0,
  };
  for (const r of records) {
    if (r.check_in && r.check_out) summary.presentDays += 1;
    if (r.is_late || r.status === 'late') summary.lateCount += 1;
    if (r.status === 'absent') summary.absentCount += 1;
    if (r.status === 'vacation' || r.status === 'sick_leave') summary.vacationCount += 1;
    if (r.status === 'field_work' || r.status === 'business_trip') summary.fieldOrTripDays += 1;
    if (typeof r.work_minutes === 'number') summary.totalWorkMinutes += r.work_minutes;
  }
  return summary;
}

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  id: 1,
  standard_check_in_time: '09:00:00',
  standard_check_out_time: '18:00:00',
  require_note_on_checkout: false,
  block_checkout_without_note: false,
  updated_at: new Date().toISOString(),
  updated_by: null,
};
