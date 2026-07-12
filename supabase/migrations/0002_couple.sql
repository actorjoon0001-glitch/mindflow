-- MindFlow → Couple App
-- Adds couple pairing, shared calendar, place map records, and a private 1:1 chat.

-- ============================================
-- COUPLES
-- ============================================
create table if not exists public.couples (
  id uuid default uuid_generate_v4() primary key,
  couple_name text not null default '우리',
  anniversary_date date not null default '2026-06-06',
  invite_code text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.couple_members (
  couple_id uuid references public.couples(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  created_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create index if not exists idx_couple_members_user on public.couple_members(user_id);

-- Returns the couple the current user belongs to. SECURITY DEFINER so it can be
-- used inside RLS policies without causing recursive policy evaluation.
-- (Single-quoted body — avoids $$ dollar-quoting so it survives copy-paste into
--  the Supabase web SQL editor.)
create or replace function public.my_couple_id()
returns uuid language sql stable security definer set search_path = public
as 'select couple_id from public.couple_members where user_id = auth.uid() limit 1';

-- True when the current user and `target` belong to the same couple.
-- SECURITY DEFINER to bypass couple_members RLS (avoids recursion in policies).
create or replace function public.same_couple(target uuid)
returns boolean language sql stable security definer set search_path = public
as 'select exists (select 1 from public.couple_members m1 join public.couple_members m2 on m1.couple_id = m2.couple_id where m1.user_id = auth.uid() and m2.user_id = target)';

-- Partners must be able to read each other's profile (name/avatar in chat, etc.)
drop policy if exists "Couple members can view each other" on public.profiles;
create policy "Couple members can view each other"
  on public.profiles for select
  using (id = auth.uid() or public.same_couple(id));

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;

drop policy if exists "Members can view their couple" on public.couples;
create policy "Members can view their couple"
  on public.couples for select
  using (id = public.my_couple_id() or created_by = auth.uid());

drop policy if exists "Users can create a couple" on public.couples;
create policy "Users can create a couple"
  on public.couples for insert
  with check (created_by = auth.uid());

drop policy if exists "Members can update their couple" on public.couples;
create policy "Members can update their couple"
  on public.couples for update
  using (id = public.my_couple_id() or created_by = auth.uid());

drop policy if exists "Members can view membership" on public.couple_members;
create policy "Members can view membership"
  on public.couple_members for select
  using (user_id = auth.uid() or couple_id = public.my_couple_id());

drop policy if exists "Users can join a couple" on public.couple_members;
create policy "Users can join a couple"
  on public.couple_members for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can leave a couple" on public.couple_members;
create policy "Users can leave a couple"
  on public.couple_members for delete
  using (user_id = auth.uid());

-- ============================================
-- COUPLE EVENTS (shared calendar)
-- ============================================
create table if not exists public.couple_events (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  all_day boolean not null default false,
  location text,
  color text not null default '#ec4899',
  category text not null default 'date',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_couple_events_couple on public.couple_events(couple_id);
create index if not exists idx_couple_events_start on public.couple_events(start_time);

alter table public.couple_events enable row level security;

drop policy if exists "Couple members can manage events" on public.couple_events;
create policy "Couple members can manage events"
  on public.couple_events for all
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

-- ============================================
-- COUPLE PLACES (map records of visited spots)
-- ============================================
create table if not exists public.couple_places (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  memo text,
  category text not null default 'restaurant',
  rating smallint check (rating between 1 and 5),
  visited_date date,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_couple_places_couple on public.couple_places(couple_id);

alter table public.couple_places enable row level security;

drop policy if exists "Couple members can manage places" on public.couple_places;
create policy "Couple members can manage places"
  on public.couple_places for all
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

-- ============================================
-- COUPLE MESSAGES (private 1:1 chat)
-- ============================================
create table if not exists public.couple_messages (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_couple_messages_couple on public.couple_messages(couple_id, created_at);

alter table public.couple_messages enable row level security;

drop policy if exists "Couple members can read messages" on public.couple_messages;
create policy "Couple members can read messages"
  on public.couple_messages for select
  using (couple_id = public.my_couple_id());

drop policy if exists "Couple members can send messages" on public.couple_messages;
create policy "Couple members can send messages"
  on public.couple_messages for insert
  with check (couple_id = public.my_couple_id() and sender_id = auth.uid());

drop policy if exists "Senders can delete own messages" on public.couple_messages;
create policy "Senders can delete own messages"
  on public.couple_messages for delete
  using (sender_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================
drop trigger if exists on_couples_updated on public.couples;
create trigger on_couples_updated
  before update on public.couples
  for each row execute function public.handle_updated_at();

drop trigger if exists on_couple_events_updated on public.couple_events;
create trigger on_couple_events_updated
  before update on public.couple_events
  for each row execute function public.handle_updated_at();

drop trigger if exists on_couple_places_updated on public.couple_places;
create trigger on_couple_places_updated
  before update on public.couple_places
  for each row execute function public.handle_updated_at();

-- ============================================
-- REALTIME (for live chat)
-- ============================================
-- Note: re-running this line after the table is already published raises
-- "already member of publication" — safe to remove that single line on re-runs.
alter publication supabase_realtime add table public.couple_messages;
