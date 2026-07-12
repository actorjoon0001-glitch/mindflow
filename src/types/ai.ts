export interface AISummaryResult {
  summary: string;
  tags: string[];
  tasks: ExtractedTask[];
  events: ExtractedEvent[];
}

export interface ExtractedTask {
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

export interface ExtractedEvent {
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
}

export interface CoupleContext {
  coupleName?: string;
  dayCount?: number;
  anniversaryDate?: string;
  upcomingEvents?: string[];
  recentPlaces?: string[];
}

export interface ChatRequest {
  message: string;
  context?: {
    recentNotes?: string[];
    upcomingTasks?: string[];
    todayEvents?: string[];
  };
  couple?: CoupleContext;
}

export interface ChatResponse {
  content: string;
  actions?: AIAction[];
}

export type AIAction =
  | { type: 'create_task'; data: ExtractedTask }
  | { type: 'create_event'; data: ExtractedEvent & { category?: string } }
  | { type: 'create_couple_event'; data: ExtractedEvent & { category?: string } }
  | { type: 'create_note'; data: { title: string; content: string } };

export interface MonthlyRecapRequest {
  monthLabel: string;
  dayCount: number;
  events: { title: string; date: string; location?: string }[];
  places: { name: string; category: string; visitedDate?: string }[];
}
