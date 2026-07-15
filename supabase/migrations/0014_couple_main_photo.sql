-- 메인 화면에 걸어둘 둘이 찍은 대표 사진 1장
alter table public.couples
  add column if not exists main_photo_url text;

notify pgrst, 'reload schema';
