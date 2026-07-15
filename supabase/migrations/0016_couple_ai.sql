-- AI 데이트 플래너 대화를 커플이 함께 공유 (기존엔 개인별이라 서로 안 보였음)
create table if not exists public.couple_ai_messages (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  role text not null, -- 'user' | 'assistant'
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_couple_ai_couple on public.couple_ai_messages(couple_id, created_at);
alter table public.couple_ai_messages enable row level security;
drop policy if exists "couple manage ai messages" on public.couple_ai_messages;
create policy "couple manage ai messages" on public.couple_ai_messages for all
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

alter publication supabase_realtime add table public.couple_ai_messages;

notify pgrst, 'reload schema';
