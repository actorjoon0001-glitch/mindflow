-- 커플 게임: 밸런스 게임 + 커플 퀴즈(상대 답 맞히기)

-- 밸런스 게임: 문항별 A/B 선택
create table if not exists public.couple_balance_answers (
  couple_id uuid references public.couples(id) on delete cascade not null,
  question_id integer not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  choice text not null,
  created_at timestamptz not null default now(),
  primary key (couple_id, question_id, user_id)
);
create index if not exists idx_balance_couple on public.couple_balance_answers(couple_id);
alter table public.couple_balance_answers enable row level security;
drop policy if exists "couple read balance" on public.couple_balance_answers;
create policy "couple read balance" on public.couple_balance_answers for select
  using (couple_id = public.my_couple_id());
drop policy if exists "manage own balance" on public.couple_balance_answers;
create policy "manage own balance" on public.couple_balance_answers for all
  using (couple_id = public.my_couple_id() and user_id = auth.uid())
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());

-- 커플 퀴즈: 내 답(answer) + 상대 답 예상(guess)
create table if not exists public.couple_quiz_answers (
  couple_id uuid references public.couples(id) on delete cascade not null,
  question_id integer not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  answer text not null,
  guess text not null,
  created_at timestamptz not null default now(),
  primary key (couple_id, question_id, user_id)
);
create index if not exists idx_quiz_couple on public.couple_quiz_answers(couple_id);
alter table public.couple_quiz_answers enable row level security;
drop policy if exists "couple read quiz" on public.couple_quiz_answers;
create policy "couple read quiz" on public.couple_quiz_answers for select
  using (couple_id = public.my_couple_id());
drop policy if exists "manage own quiz" on public.couple_quiz_answers;
create policy "manage own quiz" on public.couple_quiz_answers for all
  using (couple_id = public.my_couple_id() and user_id = auth.uid())
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());

alter publication supabase_realtime add table public.couple_balance_answers;
alter publication supabase_realtime add table public.couple_quiz_answers;

notify pgrst, 'reload schema';
