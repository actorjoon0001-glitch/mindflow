export * from './database';
export * from './ai';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface DashboardStats {
  totalNotes: number;
  totalTasks: number;
  completedTasks: number;
  upcomingEvents: number;
}
