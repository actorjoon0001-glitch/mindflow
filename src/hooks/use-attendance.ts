'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import {
  DEFAULT_ATTENDANCE_SETTINGS,
  calcWorkMinutes,
  isLateCheckIn,
  monthRange,
  todayDateString,
} from '@/lib/attendance-utils';
import type {
  AttendanceRecord,
  AttendanceRecordWithProfile,
  AttendanceSettings,
  AttendanceStatus,
  AttendanceWorkType,
} from '@/types';

export interface AttendanceAdminFilters {
  from: string;
  to: string;
  teamName?: string;
  userQuery?: string;
  status?: AttendanceStatus | 'all';
}

/**
 * Employee-facing hook: my today + this month.
 */
export function useMyAttendance() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<AttendanceSettings>(DEFAULT_ATTENDANCE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [hasNoteToday, setHasNoteToday] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    const dateStr = todayDateString();
    const { from, to } = monthRange();

    const [settingsRes, todayRes, monthRes, notesRes] = await Promise.all([
      supabase.from('attendance_settings').select('*').eq('id', 1).maybeSingle(),
      supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .maybeSingle(),
      supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false }),
      supabase
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${dateStr}T00:00:00`)
        .lte('created_at', `${dateStr}T23:59:59`),
    ]);

    if (settingsRes.data) setSettings(settingsRes.data);
    setToday(todayRes.data ?? null);
    setMonthRecords(monthRes.data ?? []);
    setHasNoteToday((notesRes.count ?? 0) > 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const upsertToday = async (patch: Partial<AttendanceRecord>) => {
    if (!user) return null;
    const supabase = createClient();
    const dateStr = todayDateString();
    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(
        {
          user_id: user.id,
          date: dateStr,
          team_name: profile?.team_name ?? null,
          created_by: user.id,
          updated_by: user.id,
          ...patch,
        },
        { onConflict: 'user_id,date' },
      )
      .select()
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    setToday(data);
    setMonthRecords((prev) => {
      const exists = prev.some((r) => r.id === data.id);
      return exists ? prev.map((r) => (r.id === data.id ? data : r)) : [data, ...prev];
    });
    return data;
  };

  const checkIn = async (workType: AttendanceWorkType = 'office') => {
    if (!user) return { error: '로그인이 필요합니다.' };
    if (today?.check_in) return { error: '이미 출근 처리되었어요.' };
    setMutating(true);
    const now = new Date();
    const late = isLateCheckIn(now, settings.standard_check_in_time);
    const record = await upsertToday({
      check_in: now.toISOString(),
      status: late ? 'late' : 'working',
      is_late: late,
      work_type: workType,
    });
    setMutating(false);
    return record ? { record } : { error: '출근 처리에 실패했어요.' };
  };

  const checkOut = async () => {
    if (!user) return { error: '로그인이 필요합니다.' };
    if (!today?.check_in) return { error: '출근 기록이 없어서 퇴근할 수 없어요.' };
    if (today.check_out) return { error: '이미 퇴근 처리되었어요.' };
    if (settings.block_checkout_without_note && !hasNoteToday) {
      return { error: '오늘 업무일지(메모)를 먼저 작성해주세요.', blocked: true };
    }
    setMutating(true);
    const now = new Date();
    const workMinutes = calcWorkMinutes(today.check_in, now.toISOString());
    const record = await upsertToday({
      check_out: now.toISOString(),
      status: 'checked_out',
      work_minutes: workMinutes,
    });
    setMutating(false);
    return record ? { record } : { error: '퇴근 처리에 실패했어요.' };
  };

  const setStatus = async (status: AttendanceStatus, note?: string) => {
    setMutating(true);
    const record = await upsertToday({ status, note: note ?? today?.note ?? null });
    setMutating(false);
    return record ? { record } : { error: '상태 변경에 실패했어요.' };
  };

  return {
    today,
    monthRecords,
    settings,
    loading,
    mutating,
    hasNoteToday,
    refetch: fetchAll,
    checkIn,
    checkOut,
    setStatus,
  };
}

/**
 * Admin hook: browse and edit all attendance records.
 */
export function useAttendanceAdmin(initial: Partial<AttendanceAdminFilters> = {}) {
  const { from, to } = monthRange();
  const [filters, setFilters] = useState<AttendanceAdminFilters>({
    from: initial.from ?? from,
    to: initial.to ?? to,
    teamName: initial.teamName,
    userQuery: initial.userQuery,
    status: initial.status ?? 'all',
  });
  const [records, setRecords] = useState<AttendanceRecordWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from('attendance_records')
      .select('*, profile:profiles!attendance_records_user_id_fkey(id, full_name, email, team_name, role)')
      .gte('date', filters.from)
      .lte('date', filters.to)
      .order('date', { ascending: false });
    if (filters.teamName) query = query.eq('team_name', filters.teamName);
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    const { data, error } = await query;
    if (error) {
      console.error(error);
      setRecords([]);
    } else {
      let result = (data as AttendanceRecordWithProfile[]) ?? [];
      if (filters.userQuery) {
        const q = filters.userQuery.toLowerCase();
        result = result.filter(
          (r) =>
            r.profile?.full_name?.toLowerCase().includes(q) ||
            r.profile?.email?.toLowerCase().includes(q),
        );
      }
      setRecords(result);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const updateRecord = async (id: string, patch: Partial<AttendanceRecord>) => {
    setUpdating(true);
    const supabase = createClient();
    const { data: me } = await supabase.auth.getUser();
    const payload: Partial<AttendanceRecord> = { ...patch, updated_by: me?.user?.id ?? null };
    if (patch.check_in || patch.check_out) {
      const current = records.find((r) => r.id === id);
      const checkIn = patch.check_in ?? current?.check_in ?? null;
      const checkOut = patch.check_out ?? current?.check_out ?? null;
      payload.work_minutes = calcWorkMinutes(checkIn, checkOut);
    }
    const { data, error } = await supabase
      .from('attendance_records')
      .update(payload)
      .eq('id', id)
      .select('*, profile:profiles!attendance_records_user_id_fkey(id, full_name, email, team_name, role)')
      .single();
    setUpdating(false);
    if (error) {
      console.error(error);
      return { error: error.message };
    }
    setRecords((prev) => prev.map((r) => (r.id === id ? (data as AttendanceRecordWithProfile) : r)));
    return { record: data };
  };

  const teams = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      const t = r.team_name ?? r.profile?.team_name;
      if (t) set.add(t);
    }
    return Array.from(set).sort();
  }, [records]);

  return {
    filters,
    setFilters,
    records,
    teams,
    loading,
    updating,
    refetch: fetchRecords,
    updateRecord,
  };
}
