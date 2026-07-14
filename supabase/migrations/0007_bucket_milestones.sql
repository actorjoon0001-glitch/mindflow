-- 버킷리스트 + 커스텀 기념일(D-day)

-- 커스텀 기념일: 커플이 직접 만드는 D-day (첫 여행/첫 영화 등)
create table if not exists public.couple_milestones (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  date date not null,
  emoji text not null default '💗',
  created_at timestamptz not null default now()
);
create index if not exists idx_couple_milestones_couple on public.couple_milestones(couple_id);
alter table public.couple_milestones enable row level security;
drop policy if exists "couple manage milestones" on public.couple_milestones;
create policy "couple manage milestones" on public.couple_milestones for all
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

-- 버킷리스트: 같이 하고 싶은 것
create table if not exists public.couple_bucket (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  category text not null default 'etc',
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_couple_bucket_couple on public.couple_bucket(couple_id);
alter table public.couple_bucket enable row level security;
drop policy if exists "couple manage bucket" on public.couple_bucket;
create policy "couple manage bucket" on public.couple_bucket for all
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

notify pgrst, 'reload schema';
