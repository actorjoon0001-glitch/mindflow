export const APP_NAME = 'MindFlow';
export const APP_DESCRIPTION = 'AI-powered memo & schedule management';

export const NAV_ITEMS = [
  { label: '대시보드', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: '메모', href: '/notes', icon: 'FileText' },
  { label: '할 일', href: '/tasks', icon: 'CheckSquare' },
  { label: '캘린더', href: '/calendar', icon: 'Calendar' },
  { label: '근태관리', href: '/attendance', icon: 'Clock' },
  { label: 'AI 비서', href: '/assistant', icon: 'Bot' },
  { label: '설정', href: '/settings', icon: 'Settings' },
] as const;

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-500/20 text-slate-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-amber-500/20 text-amber-400',
  urgent: 'bg-red-500/20 text-red-400',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: '할 일',
  in_progress: '진행 중',
  done: '완료',
  cancelled: '취소',
};

export const EVENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
];

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  not_checked_in: '출근 전',
  working: '근무 중',
  checked_out: '퇴근 완료',
  late: '지각',
  absent: '결근',
  field_work: '외근',
  business_trip: '출장',
  vacation: '휴가',
  sick_leave: '병가',
};

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  not_checked_in: 'bg-slate-500/20 text-slate-400',
  working: 'bg-emerald-500/20 text-emerald-400',
  checked_out: 'bg-blue-500/20 text-blue-400',
  late: 'bg-amber-500/20 text-amber-400',
  absent: 'bg-red-500/20 text-red-400',
  field_work: 'bg-purple-500/20 text-purple-400',
  business_trip: 'bg-indigo-500/20 text-indigo-400',
  vacation: 'bg-cyan-500/20 text-cyan-400',
  sick_leave: 'bg-pink-500/20 text-pink-400',
};

export const ATTENDANCE_WORK_TYPE_LABELS: Record<string, string> = {
  office: '사무실',
  remote: '재택',
  field: '외근',
  business_trip: '출장',
};

export const ADMIN_ROLES = ['admin', 'manager'] as const;
