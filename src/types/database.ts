export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type ReminderType = 'task' | 'event' | 'custom';
export type ChatRole = 'user' | 'assistant' | 'system';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  language: string;
  ai_provider: string;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  color: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  task_id: string | null;
  event_id: string | null;
  title: string;
  reminder_type: ReminderType;
  remind_at: string;
  is_sent: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  metadata: Json;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string }; Update: Partial<Profile> };
      notes: { Row: Note; Insert: Partial<Note> & { user_id: string }; Update: Partial<Note> };
      tasks: { Row: Task; Insert: Partial<Task> & { user_id: string; title: string }; Update: Partial<Task> };
      events: { Row: CalendarEvent; Insert: Partial<CalendarEvent> & { user_id: string; title: string; start_time: string; end_time: string }; Update: Partial<CalendarEvent> };
      reminders: { Row: Reminder; Insert: Partial<Reminder> & { user_id: string; title: string; remind_at: string }; Update: Partial<Reminder> };
      chat_messages: { Row: ChatMessage; Insert: Partial<ChatMessage> & { user_id: string; role: ChatRole; content: string }; Update: Partial<ChatMessage> };
    };
  };
}
