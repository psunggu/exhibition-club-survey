-- 202608200003a — 운영자가 보는 설문 결과 (후보별 · 사람별)
--
-- 202608200002a 를 먼저 실행한 뒤 이것을 실행한다.
--
-- ── 왜 이 함수만 이름을 돌려주나 ───────────────────────────
-- 지금까지 어떤 함수도 "누가 무엇을 골랐는지" 를 돌려주지 않았다.
-- 운영진은 모임을 꾸리려면 그걸 알아야 한다 — 누가 오는지, 몇 명이 갈지.
--
-- 그래서 **이 함수 하나만** 이름을 준다. 대신 조건이 붙는다.
--   · 암호가 맞아야 한다 (틀리면 아무것도 안 나온다)
--   · 회원용 함수(survey_tally · survey_participants)는 지금 그대로다
--   · 설문 화면의 안내 문구도 사실대로 고쳤다 —
--     "회원에게는 보이지 않고, 운영진은 확인합니다"
--
-- 화면에 적힌 약속과 DB 가 하는 일이 어긋나면 안 된다. 둘을 같이 바꾼다.

create or replace function public.survey_admin_results(
  p_password text,
  p_survey   uuid
)
-- **`position` 을 이름으로 쓸 수 없다.** 컬럼 이름으로는 되지만(그래서
-- survey_options.position 은 멀쩡하다), returns table 의 이름 자리는
-- 함수 인자처럼 파싱되어 `position(… in …)` 함수로 읽힌다 —
-- 42601 syntax error at or near "position" 이 그것이다.
-- title 도 o.title 과 헷갈리지 않게 이름을 달리 둔다.
returns table (
  option_id       uuid,
  option_position integer,
  option_title    text,
  votes           bigint,
  voters          text[]
)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;

  return query
    select
      o.id,
      o.position,
      o.title,
      count(c.response_id),
      -- '4133 홍길동' 꼴로 모은다. 먼저 응답한 사람이 앞에 온다.
      coalesce(
        array_agg(r.zone || ' ' || r.display_name order by r.created_at)
          filter (where r.id is not null),
        '{}'::text[]
      )
      from public.survey_options o
      left join public.survey_choices  c on c.option_id  = o.id
      left join public.survey_responses r on r.id        = c.response_id
     where o.survey_id = p_survey
     group by o.id, o.position, o.title
     order by o.position;
end;
$$;

/**
 * 참여한 사람 전체. 후보를 하나도 안 고른 사람은 없지만(함수가 막는다),
 * "누가 아직 안 했나" 를 보려면 참여자 목록 자체가 필요하다.
 */
create or replace function public.survey_admin_respondents(
  p_password text,
  p_survey   uuid
)
returns table (who text, answered_at timestamptz, picks bigint)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;

  return query
    select r.zone || ' ' || r.display_name,
           r.updated_at,
           (select count(*) from public.survey_choices c where c.response_id = r.id)
      from public.survey_responses r
     where r.survey_id = p_survey
     order by r.created_at;
end;
$$;

grant execute on function public.survey_admin_results(text, uuid)     to anon, authenticated;
grant execute on function public.survey_admin_respondents(text, uuid) to anon, authenticated;

-- 확인 (기대: 13 — 앞서 11 + 방금 2)
select count(*) as anon_이_부를_수_있는_함수
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname like 'survey%'
  and has_function_privilege('anon', p.oid, 'EXECUTE');
