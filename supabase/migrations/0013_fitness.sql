-- 커플 헬스: 운동 기록(부위별) + 식단 기록

-- 운동 기록: 날짜별로 어느 부위 운동했는지, PT 여부, 시간, 메모
create table if not exists public.couple_workouts (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  date date not null,
  body_parts text[] not null default '{}',
  duration_min integer,
  is_pt boolean not null default false,
  memo text,
  created_at timestamptz not null default now()
);
create index if not exists idx_couple_workouts_couple on public.couple_workouts(couple_id, date);
alter table public.couple_workouts enable row level security;
drop policy if exists "couple manage workouts" on public.couple_workouts;
create policy "couple manage workouts" on public.couple_workouts for all
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

-- 식단 기록: 끼니별 먹은 것, 사진, 칼로리
create table if not exists public.couple_meals (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  date date not null,
  meal_type text not null default 'lunch',
  content text not null,
  photo_url text,
  calories integer,
  created_at timestamptz not null default now()
);
create index if not exists idx_couple_meals_couple on public.couple_meals(couple_id, date);
alter table public.couple_meals enable row level security;
drop policy if exists "couple manage meals" on public.couple_meals;
create policy "couple manage meals" on public.couple_meals for all
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

notify pgrst, 'reload schema';
