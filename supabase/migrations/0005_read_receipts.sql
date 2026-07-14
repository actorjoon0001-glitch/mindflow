-- 카카오톡식 읽음표시: 멤버별 '마지막으로 읽은 시각'을 저장하고,
-- 내 메시지 중 상대가 아직 안 읽은 것에 "1" 을 표시.

alter table public.couple_members
  add column if not exists last_read_at timestamptz not null default now();

-- 본인 읽음 상태만 갱신 가능
drop policy if exists "Members can update own read state" on public.couple_members;
create policy "Members can update own read state"
  on public.couple_members for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 읽음 상태 실시간 반영 (상대가 읽으면 내 화면의 "1" 이 즉시 사라지도록)
alter publication supabase_realtime add table public.couple_members;

notify pgrst, 'reload schema';
