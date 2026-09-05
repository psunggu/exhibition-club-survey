-- 202609050003a — 회원 화면에서 운영진이 후보 한 줄을 더할 수 있게 한다
--
-- Supabase SQL Editor 에 붙여넣어 실행한다. 여러 번 실행해도 같다.
--
-- ── 무엇을 위한 것인가 ─────────────────────────────────────
-- 식사 화면(#/survey/meal)에서 구역번호·이름을 넣은 사람이 운영진이면
-- 「장소 추가」 칸이 나타난다. 회원이 「여기 어때요」 를 말하려면 지금은
-- 운영자 화면까지 가야 하는데, 고르는 자리에서 바로 더하는 편이 자연스럽다.
--
-- ── 무엇으로 허가하나 ──────────────────────────────────────
-- **드러내는 것은 이름으로, 저장은 암호로.** 둘을 가른 이유가 있다.
--
-- 구역번호+이름은 **암호가 아니다.** 이 저장소는 그것을 「명부에 있는 사람인가」
-- 정도로만 쓰고, 캐내는 것을 막으려고 시도 횟수 제한까지 걸어 두었다
-- (survey_probe_blocked). 카톡방에 이름이 다 있는 21명 동아리에서 그것만으로
-- 쓰기를 열면 **사실상 아무나 공개 화면에 항목을 넣을 수 있게 된다.**
--
-- 그래서 아래 두 함수는 하는 일이 다르다.
--
--   survey_member_is_admin  이름을 보고 **칸을 보여 줄지**만 답한다. 읽기다.
--   survey_admin_option_add 실제로 **쓴다.** 운영자 암호를 받는다.
--
-- ── 왜 survey_admin_save 를 쓰지 않나 ──────────────────────
-- 그 함수는 설문 하나를 payload 로 통째로 다시 쓴다. 후보 한 줄을 더하려고
-- 전체를 덮으면, 그 사이 다른 사람이 고친 것이 조용히 사라진다.
-- 더하기만 하는 좁은 함수를 따로 둔다.
--
-- ── 관문은 하나다 ──────────────────────────────────────────
-- 아래 쓰기 함수도 첫 줄에서 public.survey_admin_ok 을 부른다. 그래서
-- 202609050002a 의 「POST 로만」 도 함께 걸린다 — 여기 다시 적지 않는다.

begin;

-- ── 1. 이 사람이 운영진인가 (읽기 · 칸을 보여 줄지 정할 때만 쓴다) ──
--
-- 명부(survey_members)에 있으면서 이름이 운영자 명단(survey_admins)에도 있으면 true.
-- **명단을 돌려주지 않는다.** 묻는 그 사람에 대한 예/아니오뿐이다.
--
-- survey_member_ok 을 먼저 통과해야 한다 — 시도 횟수 제한이 거기 붙어 있어서,
-- 이 함수만 따로 두드려 운영자 이름을 캐내는 길을 막는다.
create or replace function public.survey_member_is_admin(p_zone text, p_name text)
returns boolean
language plpgsql
security definer
volatile
set search_path = pg_catalog, public
as $$
begin
  if not public.survey_member_ok(p_zone, p_name) then
    return false;
  end if;
  return exists (
    select 1 from public.survey_admins a
     where a.name = btrim(coalesce(p_name, ''))
  );
end;
$$;

comment on function public.survey_member_is_admin(text, text) is
  '이 회원이 운영진인가. 화면에 칸을 보여 줄지 정할 때만 쓴다 — 쓰기 허가가 아니다.';

-- ── 2. 후보 한 줄 더하기 (쓰기 · 운영자 암호를 받는다) ──
--
-- position 은 지금 있는 것 다음으로 자동으로 매긴다. 손으로 넣게 하면
-- 겹치거나 건너뛰고, 그 어긋남은 화면 정렬에서만 뒤늦게 드러난다.
create or replace function public.survey_admin_option_add(
  p_password text,
  p_survey   uuid,
  p_title    text,
  p_venue    text,
  p_price    text,
  p_note     text
)
returns uuid
language plpgsql
security definer
volatile
set search_path = pg_catalog, public, extensions
as $$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_pos   integer;
  v_id    uuid;
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;

  if v_title = '' then
    raise exception '장소 이름을 적어 주세요.' using errcode = '22023';
  end if;

  -- 지운 설문·마감된 설문에는 더하지 않는다. 마감 뒤에 후보가 늘면
  -- 이미 나온 집계가 조용히 뜻을 바꾼다.
  if not exists (
    select 1 from public.surveys s
     where s.id = p_survey
       and s.deleted_at is null
       and now() between s.opens_at and s.closes_at
  ) then
    raise exception '열려 있는 설문이 아닙니다.' using errcode = '22023';
  end if;

  -- 같은 이름이 이미 있으면 더하지 않는다 (두 번 눌렀을 때).
  select o.id into v_id
    from public.survey_options o
   where o.survey_id = p_survey and btrim(o.title) = v_title
   limit 1;
  if v_id is not null then
    return v_id;
  end if;

  select coalesce(max(o.position), 0) + 1 into v_pos
    from public.survey_options o where o.survey_id = p_survey;

  insert into public.survey_options (survey_id, position, title, venue, price, note)
  values (p_survey, v_pos, v_title,
          nullif(btrim(coalesce(p_venue, '')), ''),
          nullif(btrim(coalesce(p_price, '')), ''),
          nullif(btrim(coalesce(p_note,  '')), ''))
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.survey_admin_option_add(text, uuid, text, text, text, text) is
  '열려 있는 설문에 후보 한 줄을 더한다. 운영자 암호를 받는다.';

-- 기본 권한이 revoke 돼 있으므로(202608060001) 하나씩 명시해서 준다.
grant execute on function public.survey_member_is_admin(text, text)                  to anon, authenticated;
grant execute on function public.survey_admin_option_add(text, uuid, text, text, text, text) to anon, authenticated;

commit;

-- ── 확인 ───────────────────────────────────────────────────

-- 기대: 두 함수 다 t
select p.proname as 함수, has_function_privilege('anon', p.oid, 'EXECUTE') as anon_실행
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('survey_member_is_admin', 'survey_admin_option_add')
 order by p.proname;

-- 기대: false — 없는 사람은 운영진이 아니다 (명단은 안 나온다)
select public.survey_member_is_admin('0000', '없는사람') as 없는사람_false여야_함;

-- **바깥에서 확인할 것**
--   POST survey_admin_option_add  틀린 암호 → 403 '운영자 암호가 맞지 않습니다.'
--   GET  survey_admin_option_add  → 401 '이 함수는 POST 로만 부를 수 있습니다.'
