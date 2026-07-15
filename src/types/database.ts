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

export type CoupleEventCategory = 'date' | 'anniversary' | 'trip' | 'plan' | 'etc';
export type CouplePlaceCategory = 'restaurant' | 'cafe' | 'date' | 'culture' | 'activity' | 'travel' | 'shopping' | 'nature' | 'etc';

export interface Couple {
  id: string;
  couple_name: string;
  anniversary_date: string; // YYYY-MM-DD
  invite_code: string;
  main_photo_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoupleMember {
  couple_id: string;
  user_id: string;
  last_read_at: string;
  created_at: string;
}

export interface CoupleEvent {
  id: string;
  couple_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  color: string;
  category: CoupleEventCategory;
  created_at: string;
  updated_at: string;
}

export interface CouplePlace {
  id: string;
  couple_id: string;
  created_by: string | null;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  memo: string | null;
  category: CouplePlaceCategory;
  rating: number | null;
  visited_date: string | null;
  photo_url: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface CoupleMessage {
  id: string;
  couple_id: string;
  sender_id: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
}

export interface CoupleMessageReaction {
  message_id: string;
  user_id: string;
  couple_id: string;
  emoji: string;
  created_at: string;
}

export interface CoupleMilestone {
  id: string;
  couple_id: string;
  created_by: string | null;
  title: string;
  date: string; // YYYY-MM-DD
  emoji: string;
  created_at: string;
}

export interface CoupleQuestionAnswer {
  couple_id: string;
  question_date: string;
  user_id: string;
  answer: string;
  created_at: string;
}

export interface CoupleMood {
  couple_id: string;
  user_id: string;
  date: string;
  emoji: string;
  note: string | null;
  updated_at: string;
}

export interface CouplePhoto {
  id: string;
  couple_id: string;
  created_by: string | null;
  url: string;
  caption: string | null;
  taken_date: string | null;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export type BucketCategory = 'place' | 'food' | 'activity' | 'travel' | 'etc';

export type WorkoutBodyPart = 'chest' | 'back' | 'shoulder' | 'arm' | 'leg' | 'abs' | 'cardio' | 'fullbody';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface CoupleWorkout {
  id: string;
  couple_id: string;
  user_id: string | null;
  date: string; // YYYY-MM-DD
  body_parts: WorkoutBodyPart[];
  duration_min: number | null;
  is_pt: boolean;
  memo: string | null;
  created_at: string;
}

export interface CoupleMeal {
  id: string;
  couple_id: string;
  user_id: string | null;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  content: string;
  photo_url: string | null;
  calories: number | null;
  created_at: string;
}

export interface CoupleAiMessage {
  id: string;
  couple_id: string;
  user_id: string | null;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export type WatchPlatform = 'netflix' | 'youtube' | 'disney' | 'tving' | 'watcha' | 'coupang' | 'cinema' | 'etc';
export type WatchStatus = 'watched' | 'want';

export interface CoupleWatch {
  id: string;
  couple_id: string;
  user_id: string | null;
  title: string;
  platform: WatchPlatform;
  status: WatchStatus;
  rating: number | null;
  review: string | null;
  url: string | null;
  watched_date: string | null;
  created_at: string;
}

export interface CoupleBucketItem {
  id: string;
  couple_id: string;
  created_by: string | null;
  title: string;
  category: BucketCategory;
  done: boolean;
  done_at: string | null;
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
      couples: {
        Row: Couple;
        Insert: Partial<Couple> & { invite_code: string };
        Update: Partial<Couple>;
      };
      couple_members: {
        Row: CoupleMember;
        Insert: { couple_id: string; user_id: string };
        Update: Partial<CoupleMember>;
      };
      couple_events: {
        Row: CoupleEvent;
        Insert: Partial<CoupleEvent> & { couple_id: string; title: string; start_time: string; end_time: string };
        Update: Partial<CoupleEvent>;
      };
      couple_places: {
        Row: CouplePlace;
        Insert: Partial<CouplePlace> & { couple_id: string; name: string; lat: number; lng: number };
        Update: Partial<CouplePlace>;
      };
      couple_messages: {
        Row: CoupleMessage;
        Insert: Partial<CoupleMessage> & { couple_id: string; sender_id: string; content: string };
        Update: Partial<CoupleMessage>;
      };
      couple_message_reactions: {
        Row: CoupleMessageReaction;
        Insert: { message_id: string; user_id: string; couple_id: string; emoji: string };
        Update: Partial<CoupleMessageReaction>;
      };
      couple_milestones: {
        Row: CoupleMilestone;
        Insert: Partial<CoupleMilestone> & { couple_id: string; title: string; date: string };
        Update: Partial<CoupleMilestone>;
      };
      couple_bucket: {
        Row: CoupleBucketItem;
        Insert: Partial<CoupleBucketItem> & { couple_id: string; title: string };
        Update: Partial<CoupleBucketItem>;
      };
      couple_question_answers: {
        Row: CoupleQuestionAnswer;
        Insert: { couple_id: string; question_date: string; user_id: string; answer: string };
        Update: Partial<CoupleQuestionAnswer>;
      };
      couple_moods: {
        Row: CoupleMood;
        Insert: { couple_id: string; user_id: string; date: string; emoji: string; note?: string | null };
        Update: Partial<CoupleMood>;
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: { user_id: string; endpoint: string; p256dh: string; auth: string };
        Update: Partial<PushSubscriptionRow>;
      };
      couple_photos: {
        Row: CouplePhoto;
        Insert: Partial<CouplePhoto> & { couple_id: string; url: string };
        Update: Partial<CouplePhoto>;
      };
      couple_workouts: {
        Row: CoupleWorkout;
        Insert: Partial<CoupleWorkout> & { couple_id: string; date: string };
        Update: Partial<CoupleWorkout>;
      };
      couple_meals: {
        Row: CoupleMeal;
        Insert: Partial<CoupleMeal> & { couple_id: string; date: string; content: string };
        Update: Partial<CoupleMeal>;
      };
      couple_watchlist: {
        Row: CoupleWatch;
        Insert: Partial<CoupleWatch> & { couple_id: string; title: string };
        Update: Partial<CoupleWatch>;
      };
      couple_ai_messages: {
        Row: CoupleAiMessage;
        Insert: Partial<CoupleAiMessage> & { couple_id: string; role: string; content: string };
        Update: Partial<CoupleAiMessage>;
      };
    };
    Functions: {
      join_couple_by_code: {
        Args: { code: string };
        Returns: string | null;
      };
    };
  };
}
