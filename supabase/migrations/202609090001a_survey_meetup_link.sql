-- 202609090001a — 설문을 모임에 잇는 칸을 더한다 (운영자 화면 「이어지는 모임」)
--
-- Supabase SQL Editor 에 붙여넣어 실행한다. 여러 번 실행해도 같다.
--
-- ── 무엇이 필요했나 ───────────────────────────────────────
-- 설문과 모임의 연결은 지금까지 app/src/data/meetups.ts 의 surveyIds 에 사람이 적었다.
-- 설문 하나를 열 때마다 코드 커밋 하나가 따라왔고, 잊으면 설문 카드에 「이어진 모임 없음」 이
-- 떴다. 설문 행에 meetup_id 한 칸을 두면 운영자 화면에서 고르는 것으로 끝난다.
-- 옛 길(surveyIds)은 그대로 둔다 — 화면(surveyHistory.meetupOfSurvey)이 둘 다 본다.
--
-- ── 자물쇠 ────────────────────────────────────────────────
-- 쓰는 길은 survey_admin_save 뿐이고 첫 줄에서 survey_admin_ok(암호) 를 지난다.
-- 읽기는 surveys 의 기존 RLS 그대로다(회원용 행만). 값은 meetups.ts 의 id 꼴로만 받는다.
-- 개인정보가 아니다 — 모임 id 는 번들에 이미 있는 값이다.

begin;

-- ── 1. 한 칸 더하기 ───────────────────────────────────────
alter table public.surveys add column if not exists meetup_id text;
alter table public.surveys drop constraint if exists surveys_meetup_id_check;
alter table public.surveys add constraint surveys_meetup_id_check
  check (meetup_id is null or meetup_id ~ '^[a-z0-9][a-z0-9-]{0,59}$');
comment on column public.surveys.meetup_id is
  '이 설문이 정하는 모임 (app/src/data/meetups.ts 의 id). 운영자 화면에서 고른다. null 이면 안 이어짐';

-- ── 2. 저장 함수 — meetup_id 를 받는다 ─────────────────────
-- 202608300002a 의 본문 그대로에 meetup_id 네 줄만 더했다 (선언 · 읽기 · 검사 · insert/update).
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
  v_meet    text;
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;

  v_title := btrim(coalesce(p_payload ->> 'title', ''));
  v_by    := btrim(coalesce(p_payload ->> 'created_by', ''));
  v_cat   := coalesce(nullif(p_payload ->> 'category', ''), 'exhibition');
  v_aud   := nullif(p_payload ->> 'audience', '');
  v_meet  := nullif(btrim(coalesce(p_payload ->> 'meetup_id', '')), '');
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
  -- 이어지는 모임 id — meetups.ts 의 id 꼴(영문 소문자·숫자·하이픈)만. 없으면 null.
  if v_meet is not null and v_meet !~ '^[a-z0-9][a-z0-9-]{0,59}$' then
    raise exception '이어지는 모임 id 가 올바르지 않습니다.' using errcode = '22023';
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
       results_visible, show_names, hide_after_days, category, audience, meetup_id)
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
      coalesce(v_aud, 'members'),
      v_meet
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
      meetup_id       = v_meet,
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

-- ── 3. 운영자 목록 — meetup_id 를 함께 내준다 ────────────────
-- 운영자 화면의 「지난 관람」 판정이 이 값을 본다 (surveyHistory.isPastAdminSurvey).
-- returns table 의 열이 늘어 drop 이 먼저다.
drop function if exists public.survey_admin_list(text);
create or replace function public.survey_admin_list(p_password text)
returns table (
  id uuid, title text, closes_at timestamptz, created_by text,
  multi_choice boolean, results_visible text, show_names text,
  category text, source_note text, audience text,
  option_count bigint, response_count bigint, meetup_id text
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
           coalesce(
             s.imported_respondents,
             (select count(*) from public.survey_responses r where r.survey_id = s.id)
           )::bigint,
           s.meetup_id
      from public.surveys s
     where s.deleted_at is null
     order by s.closes_at desc;
end;
$$;

grant execute on function public.survey_admin_save(text, jsonb) to anon, authenticated;
grant execute on function public.survey_admin_list(text)        to anon, authenticated;

commit;

-- 확인 (기대: 1행 · meetup_id 열이 있다)
select column_name, data_type from information_schema.columns
 where table_schema = 'public' and table_name = 'surveys' and column_name = 'meetup_id';
