-- 웹푸시 구독 저장 (앱을 꺼도 알림 받기)

create table if not exists public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_push_subs_user on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- 본인 구독 관리
drop policy if exists "manage own push subs" on public.push_subscriptions;
create policy "manage own push subs" on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 상대(같은 커플)의 구독을 읽어 푸시를 보낼 수 있게
drop policy if exists "partner read push subs" on public.push_subscriptions;
create policy "partner read push subs" on public.push_subscriptions for select
  using (public.same_couple(user_id));

notify pgrst, 'reload schema';
