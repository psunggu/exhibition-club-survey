-- 202608240001a — 익명 투표
--
-- 운영자 결정 (2026-08-24): **명부 확인은 하되 이름은 안 남긴다.**
-- 구역번호와 이름은 「회원인가」 와 「이미 냈나」 를 보는 데에만 쓰고,
-- 응답 행에는 그 값을 되돌릴 수 없게 섞은 열쇠만 남긴다.
--
-- ── 무엇이 지켜지고 무엇이 안 지켜지나 ─────────────────────
-- 지켜지는 것
--   · 명부에 있는 사람만 낼 수 있다 (전과 같다)
--   · 한 사람이 한 설문에 한 번만 낸다 (전과 같다 — 열쇠 모양만 바뀐다)
--   · 응답 행에 이름·구역번호가 안 들어간다. 운영자 화면에도 「익명」 으로만 나온다
--   · 설문마다 다른 열쇠가 나온다 — 두 설문에 같은 사람이 냈는지도 이어 볼 수 없다
--
-- **안 지켜지는 것 — 여기는 솔직해야 한다.**
--   명부가 21명뿐이라, **DB 를 통째로 볼 수 있는 사람**은 21개를 하나씩 넣어 보며
--   열쇠를 맞춰 볼 수 있다. 그건 어떤 방식으로도 못 막는다 — 그 사람은 명부 자체를
--   이미 읽을 수 있기 때문이다. 이 변경이 막는 것은 **운영자 화면과 REST 로 보이는 것**이다.
--   회원에게 「운영진도 누가 뭘 골랐는지 모릅니다」 라고 적는 것은 그 범위에서 참이다.
--
-- ── 이미 저장된 응답은 건드리지 않는다 ─────────────────────
-- 지울 수도 있었지만 안 지웠다. 되돌릴 수 없는 일이고, 그때는 이름을 적는 설문이었다.
-- 지금 살아 있는 설문 가운데 응답을 더 받을 수 있는 것은 없어서(하나는 마감,
-- 하나는 톡방에서 진행) 옛 행과 새 행이 한 설문에서 섞일 일도 없다.
-- 옛 이름까지 지우려면 아래 주석을 풀어 한 번 돌리면 된다.

/* 옛 응답의 이름까지 지우려면 이것을 실행한다. 되돌릴 수 없다.
update public.survey_responses
   set respondent_key = md5('anon|' || survey_id::text || '|' || respondent_key),
       zone = '', display_name = '익명'
 where display_name <> '익명';
*/

-- ── 열쇠를 한 곳에서 만든다 ────────────────────────────────
-- 내는 쪽(survey_submit)과 다시 보는 쪽(survey_my_choices)이 **같은 열쇠**를 만들어야
-- 한다. 두 곳에 따로 적으면 한쪽만 고쳐져서, 회원이 고치려고 들어왔을 때
-- 옛 응답을 못 찾고 새 줄을 하나 더 만든다 — 한 사람이 두 표가 된다.
create or replace function public.survey_anon_key(p_survey uuid, p_zone text, p_name text)
returns text
language sql
immutable
set search_path = pg_catalog, public
as $$
  -- 설문 id 를 섞는다. 같은 사람이라도 설문마다 열쇠가 달라져,
  -- 두 설문의 응답을 한 사람 것으로 이어 볼 수 없다.
  select md5('anon|' || p_survey::text || '|' || public.survey_respondent_key(p_zone, p_name));
$$;

comment on function public.survey_anon_key(uuid, text, text) is
  '익명 응답 열쇠. 구역번호·이름은 명부 확인과 중복 방지에만 쓰고 행에는 안 남긴다.';

-- ── 낼 때 ─────────────────────────────────────────────────
-- 아래는 202608220001a 의 survey_submit 과 **마지막 네 줄만** 다르다.
-- 열쇠를 survey_anon_key 로 만들고, zone·display_name 에 사람을 안 적는다.
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
  -- **여기서 한 번만 접는다.** 아래 모든 곳이 이 값을 쓴다.
  v_zone    text := regexp_replace(btrim(coalesce(p_zone, '')), '[^0-9]', '', 'g');
  v_name    text := btrim(coalesce(p_name, ''));
  v_opts    uuid[];
  v_bad     integer;
  v_roster  integer;
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

  -- 밖에서 진행된 투표를 옮겨 온 설문이다. 여기서 받으면 표가 사라진다.
  if v_survey.imported_respondents is not null then
    raise exception '이 투표는 톡방에서 진행합니다. 이 화면은 결과만 보여 드립니다.'
      using errcode = '22023';
  end if;

  if now() < v_survey.opens_at then
    raise exception '아직 시작되지 않은 설문입니다.' using errcode = '22023';
  end if;
  if now() > v_survey.closes_at then
    raise exception '마감된 설문입니다.' using errcode = '22023';
  end if;

  select count(*) into v_roster from public.survey_members;

  if v_roster > 0 and public.survey_probe_blocked() then
    raise exception '잠시 뒤에 다시 시도해 주세요.' using errcode = '22023';
  end if;

  if v_roster > 0 and not exists (
      select 1 from public.survey_members m
       where m.zone = v_zone and m.name = v_name
    ) then
    raise exception '등록된 회원이 아닙니다. 구역번호와 이름을 단톡방 프로필과 같게 적어 주세요.'
      using errcode = '22023';
  end if;

  v_opts := (select coalesce(array_agg(distinct o), '{}'::uuid[])
               from unnest(coalesce(p_options, '{}'::uuid[])) o);

  if array_length(v_opts, 1) is null then
    raise exception '적어도 하나는 골라 주세요.' using errcode = '22023';
  end if;
  if not v_survey.multi_choice and array_length(v_opts, 1) > 1 then
    raise exception '이 설문은 하나만 고를 수 있습니다.' using errcode = '22023';
  end if;

  select count(*) into v_bad
    from unnest(v_opts) o
   where not exists (
     select 1 from public.survey_options so
      where so.id = o and so.survey_id = p_survey
   );
  if v_bad > 0 then
    raise exception '이 설문의 후보가 아닌 항목이 섞여 있습니다.' using errcode = '22023';
  end if;

  -- ── 여기부터가 달라진 곳 ────────────────────────────────
  -- 이름과 구역번호는 위에서 다 썼다. 행에는 안 남긴다.
  v_key := public.survey_anon_key(p_survey, v_zone, v_name);

  insert into public.survey_responses (survey_id, respondent_key, zone, display_name)
  values (p_survey, v_key, '', '익명')
  on conflict (survey_id, respondent_key)
  do update set updated_at = now();

  delete from public.survey_choices
   where response_id = (select id from public.survey_responses
                         where survey_id = p_survey and respondent_key = v_key);

  insert into public.survey_choices (response_id, option_id)
  select r.id, o
    from public.survey_responses r, unnest(v_opts) o
   where r.survey_id = p_survey and r.respondent_key = v_key;
end;
$$;

-- ── 내가 뭘 냈는지 다시 볼 때 ──────────────────────────────
-- 같은 열쇠를 써야 자기 응답을 찾는다. 안 그러면 고치려고 들어온 회원이
-- 빈 화면을 보고 다시 고르게 되고, 그 순간 한 사람이 두 표가 된다.
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
     and r.respondent_key = public.survey_anon_key(p_survey, p_zone, p_name);
$$;

-- ── 운영자가 보는 목록 ─────────────────────────────────────
-- 이름이 안 들어오므로 `zone || ' ' || display_name` 이 앞에 빈칸이 붙은 「 익명」 이 된다.
-- 옛 응답(이름이 남아 있는 것)은 전처럼 보인다 — 그때는 이름을 적는 설문이었다.
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
    select btrim(r.zone || ' ' || r.display_name),
           r.updated_at,
           (select count(*) from public.survey_choices c where c.response_id = r.id)
      from public.survey_responses r
     where r.survey_id = p_survey
     order by r.created_at;
end;
$$;

-- **일부러 grant 를 안 준다.** 이 함수는 security definer 함수 안에서만 불린다 —
-- 그 안에서는 만든 사람 권한으로 돌아가므로 anon 권한이 필요 없다.
-- 같은 성격의 survey_respondent_key 도 grant 가 없다. 안 주어도 되는 권한은 안 준다.

-- ── 확인 ───────────────────────────────────────────────────
-- 기대: 같은 사람은 같은 열쇠 · 설문이 다르면 다른 열쇠 · 32자리
select
  public.survey_anon_key('5e97b1a0-0000-4000-8000-000000000901', '4133', '홍길동')
    = public.survey_anon_key('5e97b1a0-0000-4000-8000-000000000901', ' 4133 ', ' 홍길동 ') as 같은사람_같은열쇠,
  public.survey_anon_key('5e97b1a0-0000-4000-8000-000000000901', '4133', '홍길동')
    <> public.survey_anon_key('5e97b1a0-0000-4000-8000-000000000902', '4133', '홍길동') as 다른설문_다른열쇠,
  length(public.survey_anon_key('5e97b1a0-0000-4000-8000-000000000901', '4133', '홍길동')) as 열쇠길이;
