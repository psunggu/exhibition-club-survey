-- 202608210001a — 설문 갈래와 옮겨 온 투표 결과
--
-- 앞의 마이그레이션을 모두 실행한 뒤 이것을 실행한다.
--
-- ── 두 가지를 더한다 ───────────────────────────────────────
-- 1. **갈래(category)** — 전시 관람 / 식사·티타임. 화면에서 색으로 가른다.
-- 2. **옮겨 온 결과** — 톡방에서 이미 끝난 투표를 여기에 담는다.
--
-- ── 왜 사람을 지어내지 않나 ────────────────────────────────
-- 톡방 투표에는 **숫자만 있고 누가 골랐는지가 없다.** 그걸 이 스키마에 넣으려면
-- 응답자 13명을 만들어야 하는데, 그러면 **없는 사람을 명부에 적는 것**이 된다.
-- 나중에 그 이름으로 무언가를 하면 거짓 위에 쌓이게 된다.
--
-- 그래서 숫자는 숫자로 담는다. `imported_votes` 가 있으면 집계는 그 값을 쓰고,
-- 응답자 표는 비어 있는 채로 둔다 — 운영자 화면의 "누가 골랐는지" 도 비어 있다.
-- 그게 사실이다.

alter table public.surveys
  add column if not exists category text not null default 'exhibition';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'surveys_category_check') then
    alter table public.surveys
      add constraint surveys_category_check check (category in ('exhibition', 'meal'));
  end if;
end $$;

comment on column public.surveys.category is '전시 관람(exhibition) · 식사와 티타임(meal)';

-- 어디서 옮겨 온 결과인지. 운영자 화면에서만 본다 — 회원에게는 뜻이 없다.
alter table public.surveys
  add column if not exists source_note text;

-- 옮겨 온 투표의 참여 인원. null 이면 응답 표를 세어 쓴다.
alter table public.surveys
  add column if not exists imported_respondents integer
    check (imported_respondents is null or imported_respondents >= 0);

-- 옮겨 온 투표의 후보별 표 수. null 이면 응답 표를 세어 쓴다.
alter table public.survey_options
  add column if not exists imported_votes integer
    check (imported_votes is null or imported_votes >= 0);

comment on column public.survey_options.imported_votes
  is '톡방 등 밖에서 이미 끝난 투표의 표 수. 있으면 집계가 이 값을 쓴다.';

/* ── 집계가 옮겨 온 값을 쓰도록 고친다 ─────────────────────
   회원용이다. 여전히 **숫자만** 돌려준다 — 이름은 나오지 않는다. */
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
    select o.id,
           -- 옮겨 온 값이 있으면 그것, 없으면 실제로 센 값
           coalesce(o.imported_votes, count(c.response_id))::bigint
      from public.survey_options o
      left join public.survey_choices c on c.option_id = o.id
     where o.survey_id = p_survey
     group by o.id, o.imported_votes, o.position
     order by o.position;
end;
$$;

create or replace function public.survey_response_count(p_survey uuid)
returns bigint
language sql
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    (select s.imported_respondents from public.surveys s where s.id = p_survey),
    (select count(*) from public.survey_responses r where r.survey_id = p_survey)
  )::bigint;
$$;

/* ── 운영자용도 같이 고친다 ────────────────────────────────
   옮겨 온 설문은 voters 가 비어 있다. 지어내지 않았기 때문이고, 그게 사실이다. */
create or replace function public.survey_admin_results(
  p_password text,
  p_survey   uuid
)
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
      coalesce(o.imported_votes, count(c.response_id))::bigint,
      coalesce(
        array_agg(r.zone || ' ' || r.display_name order by r.created_at)
          filter (where r.id is not null),
        '{}'::text[]
      )
      from public.survey_options o
      left join public.survey_choices  c on c.option_id  = o.id
      left join public.survey_responses r on r.id        = c.response_id
     where o.survey_id = p_survey
     group by o.id, o.position, o.title, o.imported_votes
     order by o.position;
end;
$$;

-- 목록에 갈래와 출처를 함께 준다
create or replace function public.survey_admin_list(p_password text)
returns table (
  id uuid, title text, closes_at timestamptz, created_by text,
  multi_choice boolean, results_visible text, show_names text,
  category text, source_note text,
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
           s.category, s.source_note,
           (select count(*) from public.survey_options o where o.survey_id = s.id),
           public.survey_response_count(s.id)
      from public.surveys s
     where s.deleted_at is null
     order by s.closes_at desc;
end;
$$;

/* ── 후보 개수 한도를 올린다 ───────────────────────────────
   전시는 1~5개로 충분했지만 **식사 장소는 13곳이 나왔다.**
   5로 묶어 두면 실제로 쓰는 설문을 운영자 화면에서 만들 수 없다. */
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
  v_days  := coalesce((p_payload ->> 'days')::integer, 0);
  v_opts  := coalesce(p_payload -> 'options', '[]'::jsonb);
  v_n     := jsonb_array_length(v_opts);

  if v_title = '' then
    raise exception '설문 제목을 적어 주세요.' using errcode = '22023';
  end if;
  if length(v_title) > 120 then
    raise exception '설문 제목이 너무 깁니다 (120자까지).' using errcode = '22023';
  end if;
  if v_cat not in ('exhibition', 'meal') then
    raise exception '설문 갈래가 올바르지 않습니다.' using errcode = '22023';
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
       results_visible, show_names, hide_after_days, category)
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
      v_cat
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

grant execute on function public.survey_admin_save(text, jsonb) to anon, authenticated;

-- 확인 (기대: 새 컬럼 4)
select count(*) as 새_컬럼
from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'surveys' and column_name in ('category', 'source_note', 'imported_respondents'))
    or (table_name = 'survey_options' and column_name = 'imported_votes'));
