-- 202608200001b — 설문 함수
--
-- a 파일을 먼저 실행한 뒤 이것을 실행한다.
--
-- ── 왜 전부 함수를 거치나 ───────────────────────────────────
-- 응답 표에는 이름과 구역번호가 들어가고, 이 사이트의 anon 키는 공개 저장소에 있다.
-- 표를 직접 열어 두면 누구나 명단을 통째로 내려받는다.
--
-- 그래서 응답에 닿는 길은 아래 함수뿐이다. 각 함수는 **꼭 필요한 것만** 돌려준다.
--   survey_submit        쓴다. 돌려주는 것은 없다.
--   survey_my_choices    본인이 고른 것만. 남의 것은 안 나온다.
--   survey_tally         숫자만. 이름은 안 나온다.
--   survey_participants  이름만. 무엇을 골랐는지는 안 나온다.
--
-- security definer 라 함수는 표 주인 권한으로 돈다. 그래서 **함수 안에서
-- 검사하지 않으면 검사가 아예 없는 것**이 된다 — 아래 검사가 전부다.

-- ── 값 다듬기 ───────────────────────────────────────────────
-- '4133' + '박성규' → '4133|박성규'. 공백과 대소문자 차이로 같은 사람이
-- 두 번 세지지 않게 한다. 한 설문에 한 사람 하나가 이 열쇠로 지켜진다.
create or replace function public.survey_respondent_key(p_zone text, p_name text)
returns text
language sql
immutable
set search_path = pg_catalog, public
as $$
  select lower(regexp_replace(coalesce(p_zone, ''), '\s+', '', 'g'))
      || '|'
      || lower(regexp_replace(coalesce(p_name, ''), '\s+', '', 'g'));
$$;

-- ── 응답하기 ────────────────────────────────────────────────
/**
 * 한 사람이 한 설문에 하나. 다시 하면 **이전 선택을 지우고 새로 넣는다.**
 * (요구사항: "이전에 선택한 A설문을 초기화 하고 다시 설문")
 *
 * 지우고-넣기가 한 트랜잭션 안에서 일어나야 중간에 끊겨도 반쪽이 남지 않는다.
 * 함수 하나가 곧 트랜잭션이므로 그 성질을 그대로 쓴다.
 */
create or replace function public.survey_submit(
  p_survey  uuid,
  p_zone    text,
  p_name    text,
  p_options uuid[]
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_survey  public.surveys%rowtype;
  v_key     text;
  v_zone    text := btrim(coalesce(p_zone, ''));
  v_name    text := btrim(coalesce(p_name, ''));
  v_opts    uuid[];
  v_bad     integer;
begin
  if v_zone = '' or v_name = '' then
    raise exception '구역번호와 이름을 모두 적어 주세요.' using errcode = '22023';
  end if;
  if length(v_zone) > 12 or length(v_name) > 30 then
    raise exception '구역번호나 이름이 너무 깁니다.' using errcode = '22023';
  end if;

  select * into v_survey from public.surveys
   where id = p_survey and deleted_at is null;
  if not found then
    raise exception '없는 설문입니다.' using errcode = 'P0002';
  end if;
  if now() < v_survey.opens_at then
    raise exception '아직 시작되지 않은 설문입니다.' using errcode = '22023';
  end if;
  if now() > v_survey.closes_at then
    raise exception '마감된 설문입니다.' using errcode = '22023';
  end if;

  -- 같은 것을 두 번 보내도 한 번으로 센다
  v_opts := (select coalesce(array_agg(distinct o), '{}'::uuid[])
               from unnest(coalesce(p_options, '{}'::uuid[])) o);

  if array_length(v_opts, 1) is null then
    raise exception '적어도 하나는 골라 주세요.' using errcode = '22023';
  end if;
  if not v_survey.multi_choice and array_length(v_opts, 1) > 1 then
    raise exception '이 설문은 하나만 고를 수 있습니다.' using errcode = '22023';
  end if;

  -- **다른 설문의 후보를 끼워 넣지 못하게 막는다.** 함수가 definer 라
  -- 여기서 안 막으면 아무 uuid 나 들어간다.
  select count(*) into v_bad
    from unnest(v_opts) o
   where not exists (
     select 1 from public.survey_options so
      where so.id = o and so.survey_id = p_survey
   );
  if v_bad > 0 then
    raise exception '이 설문의 후보가 아닌 항목이 섞여 있습니다.' using errcode = '22023';
  end if;

  v_key := public.survey_respondent_key(v_zone, v_name);

  insert into public.survey_responses (survey_id, respondent_key, zone, display_name)
  values (p_survey, v_key, v_zone, v_name)
  on conflict (survey_id, respondent_key)
  do update set display_name = excluded.display_name,
                zone         = excluded.zone,
                updated_at   = now();

  -- 이전 선택을 비우고 새로 넣는다
  delete from public.survey_choices
   where response_id = (select id from public.survey_responses
                         where survey_id = p_survey and respondent_key = v_key);

  insert into public.survey_choices (response_id, option_id)
  select r.id, o
    from public.survey_responses r, unnest(v_opts) o
   where r.survey_id = p_survey and r.respondent_key = v_key;
end;
$$;

-- ── 본인이 고른 것 ──────────────────────────────────────────
-- 이름과 구역번호를 아는 사람에게 그 사람 응답만 돌려준다.
-- 남의 응답은 어떤 인자를 넣어도 나오지 않는다.
create or replace function public.survey_my_choices(
  p_survey uuid,
  p_zone   text,
  p_name   text
)
returns table (option_id uuid)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select c.option_id
    from public.survey_responses r
    join public.survey_choices c on c.response_id = r.id
   where r.survey_id = p_survey
     and r.respondent_key = public.survey_respondent_key(p_zone, p_name);
$$;

-- ── 집계 ────────────────────────────────────────────────────
/**
 * 후보별 숫자만. **이름은 어떤 경우에도 나오지 않는다.**
 * 설문의 results_visible 을 지킨다 — 아직 볼 때가 아니면 빈 결과를 준다.
 */
create or replace function public.survey_tally(p_survey uuid)
returns table (option_id uuid, votes bigint)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v public.surveys%rowtype;
begin
  select * into v from public.surveys where id = p_survey and deleted_at is null;
  if not found then
    return;
  end if;
  if v.results_visible = 'admin' then
    return;
  end if;
  if v.results_visible = 'after_close' and now() <= v.closes_at then
    return;
  end if;

  return query
    select o.id, count(c.response_id)
      from public.survey_options o
      left join public.survey_choices c on c.option_id = o.id
     where o.survey_id = p_survey
     group by o.id;
end;
$$;

-- 몇 명이 참여했는지. 이건 언제나 볼 수 있다 — 숫자 하나라 아무것도 드러내지 않는다.
create or replace function public.survey_response_count(p_survey uuid)
returns bigint
language sql
security definer
set search_path = pg_catalog, public
as $$
  select count(*) from public.survey_responses where survey_id = p_survey;
$$;

-- 참여한 사람 이름. show_names 가 'participants' 인 설문에서만 나온다.
-- 무엇을 골랐는지는 여기서도 나오지 않는다.
create or replace function public.survey_participants(p_survey uuid)
returns table (display_name text)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v public.surveys%rowtype;
begin
  select * into v from public.surveys where id = p_survey and deleted_at is null;
  if not found or v.show_names <> 'participants' then
    return;
  end if;
  return query
    select r.display_name from public.survey_responses r
     where r.survey_id = p_survey
     order by r.created_at;
end;
$$;

-- ── 운영자 ──────────────────────────────────────────────────
-- 암호는 표에 해시로만 있고, 대조는 여기서만 일어난다.
-- 맞고 틀림만 돌려준다 — 어느 운영자인지도 알려주지 않는다.
create or replace function public.survey_admin_ok(p_password text)
returns boolean
language sql
security definer
stable
set search_path = pg_catalog, public, extensions
as $$
  select exists (
    select 1 from public.survey_admins a
     where a.password_hash = crypt(coalesce(p_password, ''), a.password_hash)
  );
$$;

-- ── 함수를 부를 권한 ────────────────────────────────────────
-- 기본 권한이 revoke 되어 있으므로(202608060001) 하나씩 명시해서 준다.
grant execute on function public.survey_submit(uuid, text, text, uuid[])   to anon, authenticated;
grant execute on function public.survey_my_choices(uuid, text, text)       to anon, authenticated;
grant execute on function public.survey_tally(uuid)                        to anon, authenticated;
grant execute on function public.survey_response_count(uuid)               to anon, authenticated;
grant execute on function public.survey_participants(uuid)                 to anon, authenticated;
grant execute on function public.survey_admin_ok(text)                     to anon, authenticated;

-- 열쇠 만드는 함수는 안에서만 쓴다
revoke execute on function public.survey_respondent_key(text, text) from public, anon, authenticated;

-- 확인 (기대: 6)
select count(*) as anon_이_부를_수_있는_함수
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname like 'survey%'
  and has_function_privilege('anon', p.oid, 'EXECUTE');
