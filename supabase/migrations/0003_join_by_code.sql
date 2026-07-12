-- Fix: 아직 커플에 속하지 않은 사용자는 couples 테이블을 초대 코드로 조회할 수 없어
-- (RLS로 막힘) 합류가 실패하던 문제. SECURITY DEFINER 함수로 안전하게 합류 처리.
--
-- 이 함수는 항상 auth.uid() 본인만 멤버로 추가하며, 정원(2명) 초과·중복 가입을
-- 방지합니다. 성공 시 couple_id 를, 실패(코드 없음/정원초과/이미 커플 있음) 시
-- NULL 을 반환합니다. (단일 따옴표 본문 — 웹 SQL 에디터 복붙 안전)

create or replace function public.join_couple_by_code(code text)
returns uuid
language sql
security definer
set search_path = public
as 'insert into public.couple_members (couple_id, user_id)
    select c.id, auth.uid()
    from public.couples c
    where c.invite_code = upper(trim(code))
      and (select count(*) from public.couple_members m where m.couple_id = c.id) < 2
      and not exists (select 1 from public.couple_members m2 where m2.user_id = auth.uid())
    returning couple_id';

grant execute on function public.join_couple_by_code(text) to authenticated;
