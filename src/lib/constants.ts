export const APP_NAME = 'MindFlow';
export const APP_DESCRIPTION = 'AI-powered memo & schedule management';

export const NAV_ITEMS = [
  { label: '대시보드', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: '메모', href: '/notes', icon: 'FileText' },
  { label: '할 일', href: '/tasks', icon: 'CheckSquare' },
  { label: '캘린더', href: '/calendar', icon: 'Calendar' },
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
