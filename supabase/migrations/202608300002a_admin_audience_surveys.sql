-- 202608300002a — 운영진용 설문을 만든다 (운영자 화면에서만 보이고, 운영진이 답한다)
--
-- Supabase SQL Editor 에 붙여넣어 실행한다. 여러 번 실행해도 같다.
--
-- ── 무엇이 필요했나 ───────────────────────────────────────
-- 무엇을 회원에게 물을지 **운영진끼리 먼저 정해야 하는** 설문이 생겼다.
-- 지금 구조에는 그 자리가 없다. 설문은 「회원에게 보이거나(deleted_at is null)
-- 아무에게도 안 보이거나(deleted_at)」 둘뿐이라, 감추면 운영자도 못 본다.
-- 실제로 202608300001a 로 감춘 운영 설문은 운영자 목록에서도 사라졌다.
--
-- ── 어떻게 ────────────────────────────────────────────────
-- `audience` 한 칸을 더한다.
--   'members'  지금까지의 모든 설문. 회원이 본다 (기본값)
--   'admins'   운영자 화면에서만 보이고, 운영자 암호로만 답한다
--
-- ── 자물쇠는 어디에 있나 ──────────────────────────────────
-- **번들은 공개다.** anon 키도 config.js 에 그대로 있다. 화면에서 안 그리는 것은
-- 감추는 것이 아니라 **안 보여 주는 척**일 뿐이고, REST 로 표를 직접 부르면 나온다.
-- 그래서 막는 자리는 넷이다. 화면은 하나도 아니다.
--
--   1) RLS         surveys · survey_options 에서 audience='admins' 를 뺀다
--                  → REST 로 직접 불러도 행 자체가 안 온다
--   2) 회원 함수    submit · tally · participants · response_count 가 거절한다
--                  → 설문 id 를 알아내도 답하거나 집계를 볼 수 없다
--   3) 운영자 함수  전부 survey_admin_ok(암호) 를 먼저 통과해야 한다
--   4) 화면        운영자 화면에서만 그린다 (편의일 뿐, 여기가 자물쇠는 아니다)
--
-- ── 이름은 남기지 않는다 ──────────────────────────────────
-- 운영진이 답할 때도 **회원 설문과 똑같이** 구역+이름으로 명부와 대조하지만,
-- 행에 남는 것은 익명 키뿐이다 (survey_anon_key). 2026-08-24 에 회원 설문을
-- 그렇게 바꿨고, 운영진이라고 다르게 둘 이유가 없다.
-- 같은 사람이 두 번 답하는 것은 그 키의 유니크 제약이 막는다.

begin;

-- ── 1. 한 칸 더하기 ───────────────────────────────────────
-- 기존 행은 전부 'members' 가 된다. 지금까지의 설문은 다 회원용이었다.
alter table public.surveys
  add column if not exists audience text not null default 'members';

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.surveys'::regclass and conname = 'surveys_audience_check'
  ) then
    alter table public.surveys
      add constraint surveys_audience_check check (audience in ('members', 'admins'));
  end if;
end $$;

comment on column public.surveys.audience is
  '누가 보는 설문인가. members=회원 화면, admins=운영자 화면에서만. RLS 가 이 값으로 거른다.';


-- ── 2. RLS — 회원 쪽에서는 행 자체가 안 오게 ───────────────
-- 이것이 첫 번째이자 가장 중요한 자물쇠다. 화면 코드를 아무리 고쳐도 여기를
-- 통과하지 못하면 anon 은 그 행을 못 읽는다.
drop policy if exists surveys_read on public.surveys;
create policy surveys_read on public.surveys
  for select to anon, authenticated
  using (deleted_at is null and audience = 'members');

drop policy if exists survey_options_read on public.survey_options;
create policy survey_options_read on public.survey_options
  for select to anon, authenticated
  using (exists (
    select 1 from public.surveys s
    where s.id = survey_id and s.deleted_at is null and s.audience = 'members'
  ));


-- ── 3. 답하기 — 몸통 하나를 둘이 나눠 쓴다 ─────────────────
-- survey_submit 의 몸통을 그대로 옮겨 온다. **손으로 다시 쓰지 않는다** —
-- 예전에 그렇게 하다가 열 이름을 셋이나 틀렸고, 검사는 통과했다
-- (validate-survey-schema 의 「열 이름」 대목에 그 사고가 적혀 있다).
--
-- 이 함수에는 anon 실행 권한을 **주지 않는다.** 아래 두 창구로만 들어온다.
create or replace function public.survey_submit_core(
  p_survey  uuid,
  p_zone    text,
  p_name    text,
  p_options uuid[],
  p_admin   boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_survey  public.surveys%rowtype;
  v_key     text;
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

  -- **여기가 갈림길이다.** 암호를 통과하지 않고 들어온 길로는
  -- 운영진용 설문에 답할 수 없다. 설문 id 를 알아내도 마찬가지다.
  if v_survey.audience = 'admins' and not p_admin then
    raise exception '없는 설문입니다.' using errcode = 'P0002';
  end if;

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

-- 회원 창구. 몸통은 위와 같고, 운영진용 설문은 「없는 설문」 으로 돌려보낸다.
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
begin
  perform public.survey_submit_core(p_survey, p_zone, p_name, p_options, false);
end;
$$;

-- 운영진 창구. 암호를 먼저 통과한다.
create or replace function public.survey_admin_submit(
  p_password text,
  p_survey   uuid,
  p_zone     text,
  p_name     text,
  p_options  uuid[]
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;
  perform public.survey_submit_core(p_survey, p_zone, p_name, p_options, true);
end;
$$;


-- ── 4. 회원 쪽 읽기 함수 셋도 막는다 ───────────────────────
-- RLS 를 지나가는 길이 아니라 security definer 함수라, 여기서 따로 막아야 한다.
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
  -- 운영진용 설문의 집계는 회원 쪽 창구로 나가지 않는다.
  -- 운영자는 survey_admin_tally · survey_admin_results 로 본다.
  if v.audience = 'admins' then
    return;
  end if;
  if v.results_visible = 'admin' then
    return;
  end if;
  if v.results_visible = 'after_close' and now() <= v.closes_at then
    return;
  end if;

  return query
    select o.id,
           coalesce(o.imported_votes, count(c.response_id))::bigint
      from public.survey_options o
      left join public.survey_choices c on c.option_id = o.id
     where o.survey_id = p_survey
     group by o.id, o.imported_votes, o.position
     order by o.position;
end;
$$;

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
  if not found or v.audience = 'admins' or v.show_names <> 'participants' then
    return;
  end if;
  return query
    select r.display_name from public.survey_responses r
     where r.survey_id = p_survey
     order by r.created_at;
end;
$$;

-- 몇 명이 답했는지도 회원 쪽으로는 안 준다. 0 을 준다 —
-- **없는 설문과 같은 답**이라야 「거기 뭔가 있다」 는 것도 안 새어 나간다.
create or replace function public.survey_response_count(p_survey uuid)
returns bigint
language sql
security definer
set search_path = pg_catalog, public
as $$
  select case
    when (select s.audience from public.surveys s where s.id = p_survey) = 'admins' then 0
    else coalesce(
      (select s.imported_respondents from public.surveys s where s.id = p_survey),
      (select count(*) from public.survey_responses r where r.survey_id = p_survey)
    )
  end::bigint;
$$;


-- ── 5. 운영자 목록 — audience 를 함께 준다 ─────────────────
-- **returns table 이 바뀌므로 지우고 다시 만든다.** create or replace 로는
-- 반환 모양을 못 바꾼다 (42P13). 지운 뒤 grant 도 다시 준다.
drop function if exists public.survey_admin_list(text);
create or replace function public.survey_admin_list(p_password text)
returns table (
  id uuid, title text, closes_at timestamptz, created_by text,
  multi_choice boolean, results_visible text, show_names text,
  category text, source_note text, audience text,
  option_count bigint, response_count bigint
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
    select s.id, s.title, s.closes_at, s.created_by,
           s.multi_choice, s.results_visible, s.show_names,
           s.category, s.source_note, s.audience,
           (select count(*) from public.survey_options o where o.survey_id = s.id),
           -- survey_response_count 를 부르지 않는다 — 그 함수는 위에서
           -- 운영진용 설문에 0 을 주도록 바꿨다. 운영자에게는 진짜 수를 준다.
           coalesce(
             s.imported_respondents,
             (select count(*) from public.survey_responses r where r.survey_id = s.id)
           )::bigint
      from public.surveys s
     where s.deleted_at is null
     order by s.closes_at desc;
end;
$$;


-- ── 6. 운영자 저장 — audience 를 받는다 ────────────────────
-- **고칠 때 값이 안 오면 지금 값을 지킨다.** coalesce(…, 'members') 로 두면
-- 운영진용 설문을 제목만 고쳐도 회원에게 튀어나온다.
create or replace function public.survey_admin_save(
  p_password text,
  p_payload  jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_id      uuid;
  v_days    integer;
  v_title   text;
  v_by      text;
  v_cat     text;
  v_aud     text;
  v_opts    jsonb;
  v_n       integer;
  v_i       integer;
  v_o       jsonb;
  v_links   jsonb;
  v_l       jsonb;
  v_exists  uuid;
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;

  v_title := btrim(coalesce(p_payload ->> 'title', ''));
  v_by    := btrim(coalesce(p_payload ->> 'created_by', ''));
  v_cat   := coalesce(nullif(p_payload ->> 'category', ''), 'exhibition');
  v_aud   := nullif(p_payload ->> 'audience', '');
  v_days  := coalesce((p_payload ->> 'days')::integer, 0);
  v_opts  := coalesce(p_payload -> 'options', '[]'::jsonb);
  v_n     := jsonb_array_length(v_opts);

  if v_title = '' then
    raise exception '설문 제목을 적어 주세요.' using errcode = '22023';
  end if;
  if length(v_title) > 120 then
    raise exception '설문 제목이 너무 깁니다 (120자까지).' using errcode = '22023';
  end if;
  if v_cat not in ('exhibition', 'datetime', 'meal', 'club', 'etc') then
    raise exception '설문 갈래가 올바르지 않습니다.' using errcode = '22023';
  end if;
  if v_aud is not null and v_aud not in ('members', 'admins') then
    raise exception '설문을 누가 보는지가 올바르지 않습니다.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.survey_admins a where a.name = v_by) then
    raise exception '올린 사람을 운영자 명단에서 고르세요.' using errcode = '22023';
  end if;
  if v_days < 1 or v_days > 90 then
    raise exception '받는 기간은 1일에서 90일 사이로 정해 주세요.' using errcode = '22023';
  end if;
  if v_n < 1 or v_n > 20 then
    raise exception '후보는 1개에서 20개까지 넣을 수 있습니다.' using errcode = '22023';
  end if;

  for v_i in 0 .. v_n - 1 loop
    v_o := v_opts -> v_i;
    if btrim(coalesce(v_o ->> 'title', '')) = '' then
      raise exception '%번째 후보의 제목이 비어 있습니다.', v_i + 1 using errcode = '22023';
    end if;
    v_links := coalesce(v_o -> 'links', '[]'::jsonb);
    if jsonb_typeof(v_links) <> 'array' then
      raise exception '%번째 후보의 링크 모양이 잘못됐습니다.', v_i + 1 using errcode = '22023';
    end if;
    for v_l in select jsonb_array_elements(v_links) loop
      if (v_l ->> 'url') !~ '^https://' then
        raise exception '%번째 후보의 링크는 https 로 시작해야 합니다.', v_i + 1 using errcode = '22023';
      end if;
      if (v_l ->> 'kind') not in ('official', 'video', 'article', 'map', 'booking') then
        raise exception '%번째 후보의 링크 종류가 알 수 없는 값입니다.', v_i + 1 using errcode = '22023';
      end if;
      if btrim(coalesce(v_l ->> 'label', '')) = '' then
        raise exception '%번째 후보의 링크 이름이 비어 있습니다.', v_i + 1 using errcode = '22023';
      end if;
    end loop;
  end loop;

  v_id := nullif(p_payload ->> 'id', '')::uuid;

  if v_id is null then
    insert into public.surveys
      (title, intro, multi_choice, opens_at, closes_at, created_by,
       results_visible, show_names, hide_after_days, category, audience)
    values (
      v_title,
      nullif(btrim(coalesce(p_payload ->> 'intro', '')), ''),
      coalesce((p_payload ->> 'multi_choice')::boolean, true),
      now(),
      now() + (v_days || ' days')::interval,
      v_by,
      coalesce(nullif(p_payload ->> 'results_visible', ''), 'after_close'),
      coalesce(nullif(p_payload ->> 'show_names', ''), 'none'),
      nullif(p_payload ->> 'hide_after_days', '')::integer,
      v_cat,
      coalesce(v_aud, 'members')
    )
    returning id into v_id;
  else
    select id into v_exists from public.surveys
     where id = v_id and deleted_at is null;
    if not found then
      raise exception '없는 설문입니다.' using errcode = 'P0002';
    end if;

    update public.surveys set
      title           = v_title,
      intro           = nullif(btrim(coalesce(p_payload ->> 'intro', '')), ''),
      multi_choice    = coalesce((p_payload ->> 'multi_choice')::boolean, true),
      closes_at       = now() + (v_days || ' days')::interval,
      created_by      = v_by,
      results_visible = coalesce(nullif(p_payload ->> 'results_visible', ''), 'after_close'),
      show_names      = coalesce(nullif(p_payload ->> 'show_names', ''), 'none'),
      hide_after_days = nullif(p_payload ->> 'hide_after_days', '')::integer,
      category        = v_cat,
      audience        = coalesce(v_aud, audience),
      updated_at      = now()
     where id = v_id;
  end if;

  for v_i in 0 .. v_n - 1 loop
    v_o := v_opts -> v_i;
    v_links := coalesce(v_o -> 'links', '[]'::jsonb);

    select id into v_exists from public.survey_options
     where survey_id = v_id and position = v_i + 1;

    if found then
      update public.survey_options set
        title  = btrim(v_o ->> 'title'),
        period = nullif(btrim(coalesce(v_o ->> 'period', '')), ''),
        venue  = nullif(btrim(coalesce(v_o ->> 'venue',  '')), ''),
        hours  = nullif(btrim(coalesce(v_o ->> 'hours',  '')), ''),
        price  = nullif(btrim(coalesce(v_o ->> 'price',  '')), ''),
        note   = nullif(btrim(coalesce(v_o ->> 'note',   '')), ''),
        links  = v_links
       where id = v_exists;
    else
      insert into public.survey_options
        (survey_id, position, title, period, venue, hours, price, note, links)
      values (
        v_id, v_i + 1, btrim(v_o ->> 'title'),
        nullif(btrim(coalesce(v_o ->> 'period', '')), ''),
        nullif(btrim(coalesce(v_o ->> 'venue',  '')), ''),
        nullif(btrim(coalesce(v_o ->> 'hours',  '')), ''),
        nullif(btrim(coalesce(v_o ->> 'price',  '')), ''),
        nullif(btrim(coalesce(v_o ->> 'note',   '')), ''),
        v_links
      );
    end if;
  end loop;

  delete from public.survey_options
   where survey_id = v_id and position > v_n;

  return v_id;
end;
$$;


-- ── 6-2. 운영자 조회 ────────────────────────────
-- 운영자 화면은 설문을 고치거나 답하려면 후보까지 들어 있는 통째를 봐야 한다.
-- 그런데 지금까지는 REST 로 직접 읽어 왜으므로 **RLS 를 지나간다** —
-- 위에서 그 정책을 audience='members' 로 조였으니, 운영진용 설문은
-- 운영자에게도 「설문을 찾지 못했습니다」 가 된다. 그래서 암호로 여는 창구를 따로 둔다.
--
-- 모양은 REST 가 주던 것과 같게 맞춘다 (행 + survey_options 배열).
-- 화면이 쓰던 변환기(toSurvey)를 그대로 다시 쓸 수 있게 하려는 것이다.
create or replace function public.survey_admin_get(
  p_password text,
  p_survey   uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v jsonb;
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;

  select to_jsonb(s) || jsonb_build_object(
           'survey_options',
           coalesce((select jsonb_agg(to_jsonb(o) order by o.position)
                       from public.survey_options o
                      where o.survey_id = s.id), '[]'::jsonb),
           -- 몇 명이 답했나도 여기 싸서 보낸다. 회원 창구인
           -- survey_response_count 는 운영진용 설문에 0 을 주므로,
           -- 운영자 화면이 그것을 그대로 쓰면 항상 0명이 된다.
           'response_count',
           coalesce(
             s.imported_respondents,
             (select count(*) from public.survey_responses r where r.survey_id = s.id)
           ))
    into v
    from public.surveys s
   where s.id = p_survey and s.deleted_at is null;

  if v is null then
    raise exception '없는 설문입니다.' using errcode = 'P0002';
  end if;
  return v;
end;
$$;


-- ── 7. 부를 권한 ──────────────────────────────────────────
-- 기본 권한이 revoke 되어 있으므로(202608060001) 줄 것만 명시한다.
grant execute on function public.survey_submit(uuid, text, text, uuid[])            to anon, authenticated;
grant execute on function public.survey_admin_submit(text, uuid, text, text, uuid[]) to anon, authenticated;
grant execute on function public.survey_tally(uuid)                                 to anon, authenticated;
grant execute on function public.survey_participants(uuid)                          to anon, authenticated;
grant execute on function public.survey_response_count(uuid)                        to anon, authenticated;
grant execute on function public.survey_admin_list(text)                            to anon, authenticated;
grant execute on function public.survey_admin_save(text, jsonb)                     to anon, authenticated;
grant execute on function public.survey_admin_get(text, uuid)                        to anon, authenticated;

-- 몸통은 **아무에게도 주지 않는다.** 위 두 창구를 통해서만 들어온다.
-- 창구가 security definer 라 소유자 권한으로 부르므로 이래도 동작한다.
revoke all on function public.survey_submit_core(uuid, text, text, uuid[], boolean)
  from public, anon, authenticated;


-- ── 8. 감춰 둔 운영 설문을 운영진용으로 되살린다 ───────────
-- 202608300001a 에서 deleted_at 을 찍어 감췄던 그 설문이다. 지우지 않았으므로
-- 후보 열 개가 그대로 있다. 이제 회원이 아니라 **운영진이** 그것으로 정한다.
update public.surveys set
  deleted_at = null,
  audience   = 'admins',
  updated_at = now()
 where id = '5e97b1a0-0000-4000-8000-000000000906';

commit;


-- ── 확인 ───────────────────────────────────────────────────
-- 기대: 운영 설문이 audience='admins' · deleted_at 없음 · 후보 10개
select id, title, audience, deleted_at,
       (select count(*) from public.survey_options o where o.survey_id = s.id) as 후보수
  from public.surveys s
 where id = '5e97b1a0-0000-4000-8000-000000000906';

-- 기대: 회원에게 보이는 설문 3건 (운영 설문은 여기 없어야 한다)
select count(*) as 회원에게_보이는_설문
  from public.surveys
 where deleted_at is null and audience = 'members';

-- 기대: 0 — 회원 창구로는 집계가 안 나온다
select count(*) as 회원창구_집계줄
  from public.survey_tally('5e97b1a0-0000-4000-8000-000000000906');

-- 기대: 0 — 몇 명 답했는지도 회원 창구로는 안 나온다
select public.survey_response_count('5e97b1a0-0000-4000-8000-000000000906') as 회원창구_응답수;
