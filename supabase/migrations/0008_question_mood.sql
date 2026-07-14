-- 오늘의 질문(둘 다 답하면 공개) + 오늘의 기분 공유

-- 오늘의 질문 답변 (커플/날짜/사용자별 1개)
create table if not exists public.couple_question_answers (
  couple_id uuid references public.couples(id) on delete cascade not null,
  question_date date not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  answer text not null,
  created_at timestamptz not null default now(),
  primary key (couple_id, question_date, user_id)
);
create index if not exists idx_question_answers_couple on public.couple_question_answers(couple_id, question_date);
alter table public.couple_question_answers enable row level security;
drop policy if exists "couple read answers" on public.couple_question_answers;
create policy "couple read answers" on public.couple_question_answers for select
  using (couple_id = public.my_couple_id());
drop policy if exists "couple manage own answer" on public.couple_question_answers;
create policy "couple manage own answer" on public.couple_question_answers for all
  using (couple_id = public.my_couple_id() and user_id = auth.uid())
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());

-- 오늘의 기분 (커플/사용자/날짜별 1개)
create table if not exists public.couple_moods (
  couple_id uuid references public.couples(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  emoji text not null,
  note text,
  updated_at timestamptz not null default now(),
  primary key (couple_id, user_id, date)
);
create index if not exists idx_couple_moods_couple on public.couple_moods(couple_id, date);
alter table public.couple_moods enable row level security;
drop policy if exists "couple read moods" on public.couple_moods;
create policy "couple read moods" on public.couple_moods for select
  using (couple_id = public.my_couple_id());
drop policy if exists "couple manage own mood" on public.couple_moods;
create policy "couple manage own mood" on public.couple_moods for all
  using (couple_id = public.my_couple_id() and user_id = auth.uid())
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());

alter publication supabase_realtime add table public.couple_question_answers;
alter publication supabase_realtime add table public.couple_moods;

notify pgrst, 'reload schema';
