export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type ReminderType = 'task' | 'event' | 'custom';
export type ChatRole = 'user' | 'assistant' | 'system';
export type UserRole = 'employee' | 'manager' | 'admin';

export type AttendanceStatus =
  | 'not_checked_in'
  | 'working'
  | 'checked_out'
  | 'late'
  | 'absent'
  | 'field_work'
  | 'business_trip'
  | 'vacation'
  | 'sick_leave';

export type AttendanceWorkType = 'office' | 'remote' | 'field' | 'business_trip';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  language: string;
  ai_provider: string;
  notification_enabled: boolean;
  role: UserRole;
  team_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  work_type: AttendanceWorkType;
  team_name: string | null;
  note: string | null;
  is_late: boolean;
  work_minutes: number | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecordWithProfile extends AttendanceRecord {
  profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'team_name' | 'role'> | null;
}

export interface AttendanceSettings {
  id: number;
  standard_check_in_time: string;
  standard_check_out_time: string;
  require_note_on_checkout: boolean;
  block_checkout_without_note: boolean;
  updated_at: string;
  updated_by: string | null;
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
      attendance_records: {
        Row: AttendanceRecord;
        Insert: Partial<AttendanceRecord> & { user_id: string; date: string };
        Update: Partial<AttendanceRecord>;
      };
      attendance_settings: {
        Row: AttendanceSettings;
        Insert: Partial<AttendanceSettings>;
        Update: Partial<AttendanceSettings>;
      };
    };
  };
}
