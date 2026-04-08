-- MindFlow Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  timezone text default 'Asia/Seoul',
  language text default 'ko',
  ai_provider text default 'openai',
  notification_enabled boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ============================================
-- NOTES
-- ============================================
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default '',
  content text not null default '',
  summary text,
  tags text[] default '{}',
  is_pinned boolean default false,
  is_archived boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_notes_user_id on public.notes(user_id);
create index idx_notes_created_at on public.notes(created_at desc);

alter table public.notes enable row level security;

create policy "Users can CRUD own notes"
  on public.notes for all using (auth.uid() = user_id);

-- ============================================
-- TASKS
-- ============================================
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type task_status as enum ('todo', 'in_progress', 'done', 'cancelled');

create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  note_id uuid references public.notes(id) on delete set null,
  title text not null,
  description text,
  status task_status default 'todo' not null,
  priority task_priority default 'medium' not null,
  due_date timestamptz,
  completed_at timestamptz,
  tags text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_tasks_user_id on public.tasks(user_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_due_date on public.tasks(due_date);

alter table public.tasks enable row level security;

create policy "Users can CRUD own tasks"
  on public.tasks for all using (auth.uid() = user_id);

-- ============================================
-- EVENTS (Calendar)
-- ============================================
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  note_id uuid references public.notes(id) on delete set null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  all_day boolean default false,
  location text,
  color text default '#6366f1',
  tags text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_events_user_id on public.events(user_id);
create index idx_events_start_time on public.events(start_time);

alter table public.events enable row level security;

create policy "Users can CRUD own events"
  on public.events for all using (auth.uid() = user_id);

-- ============================================
-- REMINDERS
-- ============================================
create type reminder_type as enum ('task', 'event', 'custom');

create table public.reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  title text not null,
  reminder_type reminder_type not null default 'custom',
  remind_at timestamptz not null,
  is_sent boolean default false,
  created_at timestamptz default now() not null
);

create index idx_reminders_user_id on public.reminders(user_id);
create index idx_reminders_remind_at on public.reminders(remind_at);

alter table public.reminders enable row level security;

create policy "Users can CRUD own reminders"
  on public.reminders for all using (auth.uid() = user_id);

-- ============================================
-- CHAT MESSAGES (AI Assistant)
-- ============================================
create type chat_role as enum ('user', 'assistant', 'system');

create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role chat_role not null,
  content text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now() not null
);

create index idx_chat_messages_user_id on public.chat_messages(user_id);
create index idx_chat_messages_created_at on public.chat_messages(created_at);

alter table public.chat_messages enable row level security;

create policy "Users can CRUD own chat messages"
  on public.chat_messages for all using (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_notes_updated
  before update on public.notes
  for each row execute function public.handle_updated_at();

create trigger on_tasks_updated
  before update on public.tasks
  for each row execute function public.handle_updated_at();

create trigger on_events_updated
  before update on public.events
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
