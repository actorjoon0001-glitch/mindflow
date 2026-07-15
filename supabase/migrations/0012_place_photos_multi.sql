-- 장소(couple_places)에 사진 여러 장 저장 지원.
-- 기존 photo_url(단일)은 호환을 위해 유지하고, 첫 사진으로 계속 사용한다.

alter table public.couple_places
  add column if not exists photos text[] not null default '{}';

-- 기존에 등록된 단일 사진을 배열로 이관 (이미 이관된 행은 건드리지 않음).
update public.couple_places
  set photos = array[photo_url]
  where photo_url is not null
    and photo_url <> ''
    and (photos is null or photos = '{}');

notify pgrst, 'reload schema';
