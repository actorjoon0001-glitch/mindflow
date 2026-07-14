-- 메시지 반응(이모지). 커플 1:1 이라 사용자당 메시지당 하나의 반응.

create table if not exists public.couple_message_reactions (
  message_id uuid references public.couple_messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  couple_id uuid references public.couples(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists idx_msg_reactions_couple on public.couple_message_reactions(couple_id);

alter table public.couple_message_reactions enable row level security;

drop policy if exists "read couple reactions" on public.couple_message_reactions;
create policy "read couple reactions"
  on public.couple_message_reactions for select
  using (couple_id = public.my_couple_id());

drop policy if exists "manage own reactions" on public.couple_message_reactions;
create policy "manage own reactions"
  on public.couple_message_reactions for all
  using (user_id = auth.uid() and couple_id = public.my_couple_id())
  with check (user_id = auth.uid() and couple_id = public.my_couple_id());

alter publication supabase_realtime add table public.couple_message_reactions;

notify pgrst, 'reload schema';
