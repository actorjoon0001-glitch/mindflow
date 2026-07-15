-- 함께 본 것(넷플릭스·유튜브 등) 기록 + 보고싶은 것 위시리스트
create table if not exists public.couple_watchlist (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  platform text not null default 'netflix',
  status text not null default 'watched', -- 'watched' | 'want'
  rating smallint check (rating between 1 and 5),
  review text,
  url text,
  watched_date date,
  created_at timestamptz not null default now()
);
create index if not exists idx_couple_watchlist_couple on public.couple_watchlist(couple_id, status);
alter table public.couple_watchlist enable row level security;
drop policy if exists "couple manage watchlist" on public.couple_watchlist;
create policy "couple manage watchlist" on public.couple_watchlist for all
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

notify pgrst, 'reload schema';
