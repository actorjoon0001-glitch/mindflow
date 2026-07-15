-- 사진 앨범: 앨범에 직접 올린 사진 (채팅 사진은 couple_messages 에서 함께 가져옴)
-- 저장소는 기존 chat-images 버킷 재사용.

create table if not exists public.couple_photos (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid references public.couples(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  url text not null,
  caption text,
  taken_date date,
  created_at timestamptz not null default now()
);
create index if not exists idx_couple_photos_couple on public.couple_photos(couple_id);

alter table public.couple_photos enable row level security;
drop policy if exists "couple manage photos" on public.couple_photos;
create policy "couple manage photos" on public.couple_photos for all
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

notify pgrst, 'reload schema';
