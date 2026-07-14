export const APP_NAME = '우리';
export const APP_DESCRIPTION = '둘만의 캘린더 · 지도 · 채팅';

export const NAV_ITEMS = [
  { label: '홈', href: '/dashboard', icon: 'Heart' },
  { label: '오늘의 우리', href: '/today', icon: 'Sun' },
  { label: '캘린더', href: '/calendar', icon: 'Calendar' },
  { label: '지도', href: '/map', icon: 'Map' },
  { label: '채팅', href: '/chat', icon: 'MessageCircle' },
  { label: '버킷리스트', href: '/bucket', icon: 'ListChecks' },
  { label: 'AI 추천', href: '/assistant', icon: 'Sparkles' },
  { label: '메모', href: '/notes', icon: 'FileText' },
  { label: '할 일', href: '/tasks', icon: 'CheckSquare' },
  { label: '설정', href: '/settings', icon: 'Settings' },
] as const;

// Primary items shown in the mobile bottom bar.
export const MOBILE_NAV_ITEMS = [
  { label: '홈', href: '/dashboard', icon: 'Heart' },
  { label: '캘린더', href: '/calendar', icon: 'Calendar' },
  { label: '지도', href: '/map', icon: 'Map' },
  { label: '채팅', href: '/chat', icon: 'MessageCircle' },
  { label: 'AI', href: '/assistant', icon: 'Sparkles' },
] as const;

export const COUPLE_EVENT_CATEGORIES: Record<string, { label: string; color: string }> = {
  date: { label: '데이트', color: '#ec4899' },
  anniversary: { label: '기념일', color: '#f43f5e' },
  trip: { label: '여행', color: '#06b6d4' },
  plan: { label: '약속', color: '#8b5cf6' },
  etc: { label: '기타', color: '#6366f1' },
};

export const COUPLE_PLACE_CATEGORIES: Record<string, { label: string; emoji: string; color: string }> = {
  restaurant: { label: '맛집', emoji: '🍽️', color: '#f97316' },
  cafe: { label: '카페', emoji: '☕', color: '#a16207' },
  activity: { label: '액티비티', emoji: '🎡', color: '#8b5cf6' },
  travel: { label: '여행', emoji: '✈️', color: '#06b6d4' },
  etc: { label: '기타', emoji: '📍', color: '#ec4899' },
};

export const BUCKET_CATEGORIES: Record<string, { label: string; emoji: string }> = {
  place: { label: '가보고 싶은 곳', emoji: '📍' },
  food: { label: '먹고 싶은 것', emoji: '🍽️' },
  activity: { label: '같이 하고 싶은 것', emoji: '🎯' },
  travel: { label: '여행', emoji: '✈️' },
  etc: { label: '기타', emoji: '💭' },
};

export const MILESTONE_EMOJIS = ['💗', '🎉', '✈️', '🎬', '🍰', '🌸', '🏠', '💍', '🐣', '⭐'];

export const MILESTONE_COLORS: Record<string, string> = {
  start: 'bg-rose-500/20 text-rose-300',
  hundred: 'bg-pink-500/20 text-pink-300',
  month: 'bg-fuchsia-500/20 text-fuchsia-300',
  year: 'bg-amber-500/20 text-amber-300',
};

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
