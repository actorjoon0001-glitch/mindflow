-- 채팅 사진 첨부: couple_messages 에 image_url 추가 + Storage 버킷/권한 설정.

alter table public.couple_messages add column if not exists image_url text;
-- 이미지만 보내는 메시지는 content 가 빈 문자열('')이 됩니다.
alter table public.couple_messages alter column content set default '';

-- ============================================
-- STORAGE: chat-images 버킷 (공개 읽기, 인증 사용자만 업로드)
-- ============================================
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

drop policy if exists "chat images public read" on storage.objects;
create policy "chat images public read"
  on storage.objects for select
  using (bucket_id = 'chat-images');

drop policy if exists "chat images authenticated upload" on storage.objects;
create policy "chat images authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'chat-images');

drop policy if exists "chat images owner delete" on storage.objects;
create policy "chat images owner delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'chat-images' and owner = auth.uid());

notify pgrst, 'reload schema';
