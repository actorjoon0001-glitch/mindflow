-- MindFlow Attendance Management
-- Adds attendance records, settings, and role/team fields to profiles.

-- ============================================
-- PROFILES: role & team
-- ============================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('employee', 'manager', 'admin');
  end if;
end$$;

alter table public.profiles
  add column if not exists role user_role not null default 'employee';

alter table public.profiles
  add column if not exists team_name text;

-- Admins/managers can read every profile (needed for admin attendance views)
drop policy if exists "Admins and managers can view all profiles" on public.profiles;
create policy "Admins and managers can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'manager')
    )
  );

-- ============================================
-- ATTENDANCE ENUMS
-- ============================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type attendance_status as enum (
      'not_checked_in', -- 출근전
      'working',        -- 근무중
      'checked_out',    -- 퇴근완료
      'late',           -- 지각
      'absent',         -- 결근
      'field_work',     -- 외근
      'business_trip',  -- 출장
      'vacation',       -- 휴가
      'sick_leave'      -- 병가
    );
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'attendance_work_type') then
    create type attendance_work_type as enum ('office', 'remote', 'field', 'business_trip');
  end if;
end$$;

-- ============================================
-- ATTENDANCE SETTINGS (single-row config)
-- ============================================
create table if not exists public.attendance_settings (
  id integer primary key default 1,
  standard_check_in_time time not null default '09:00:00',
  standard_check_out_time time not null default '18:00:00',
  require_note_on_checkout boolean not null default false,
  block_checkout_without_note boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint attendance_settings_singleton check (id = 1)
);

insert into public.attendance_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.attendance_settings enable row level security;

drop policy if exists "Everyone can read attendance settings" on public.attendance_settings;
create policy "Everyone can read attendance settings"
  on public.attendance_settings for select
  using (auth.uid() is not null);

drop policy if exists "Only admins can update attendance settings" on public.attendance_settings;
create policy "Only admins can update attendance settings"
  on public.attendance_settings for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================
-- ATTENDANCE RECORDS
-- ============================================
create table if not exists public.attendance_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status attendance_status not null default 'not_checked_in',
  work_type attendance_work_type not null default 'office',
  team_name text,
  note text,
  is_late boolean not null default false,
  work_minutes integer,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_records_user_date_unique unique (user_id, date)
);

create index if not exists idx_attendance_user_id on public.attendance_records(user_id);
create index if not exists idx_attendance_date on public.attendance_records(date desc);
create index if not exists idx_attendance_status on public.attendance_records(status);
create index if not exists idx_attendance_team on public.attendance_records(team_name);

alter table public.attendance_records enable row level security;

-- Employees: CRUD their own records
drop policy if exists "Users can view own attendance" on public.attendance_records;
create policy "Users can view own attendance"
  on public.attendance_records for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own attendance" on public.attendance_records;
create policy "Users can insert own attendance"
  on public.attendance_records for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own attendance" on public.attendance_records;
create policy "Users can update own attendance"
  on public.attendance_records for update
  using (auth.uid() = user_id);

-- Admins/managers: read & modify everyone's records
drop policy if exists "Admins and managers can view all attendance" on public.attendance_records;
create policy "Admins and managers can view all attendance"
  on public.attendance_records for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  );

drop policy if exists "Admins and managers can update all attendance" on public.attendance_records;
create policy "Admins and managers can update all attendance"
  on public.attendance_records for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  );

drop policy if exists "Admins and managers can insert any attendance" on public.attendance_records;
create policy "Admins and managers can insert any attendance"
  on public.attendance_records for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  );

-- updated_at trigger
drop trigger if exists on_attendance_updated on public.attendance_records;
create trigger on_attendance_updated
  before update on public.attendance_records
  for each row execute function public.handle_updated_at();

drop trigger if exists on_attendance_settings_updated on public.attendance_settings;
create trigger on_attendance_settings_updated
  before update on public.attendance_settings
  for each row execute function public.handle_updated_at();
