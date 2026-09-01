-- 202608290001a — 설문 갈래를 다섯으로 늘린다
--
-- 앞의 마이그레이션을 모두 실행한 뒤 이것을 실행한다.
--
-- ── 왜 ────────────────────────────────────────────────────
-- 설문을 정기적으로 받기로 했고, 종류가 갈렸다. 지금까지는 둘뿐이라
-- (전시 관람 / 식사·티타임) 날짜를 정하는 설문도, 운영에 관한 설문도
-- 전부 「전시 관람」 탭에 섞여 있었다.
--
--   exhibition  전시 관람 장소      ← 값은 그대로 둔다 (이름만 바뀐다)
--   datetime    전시 관람 일자·시간  ← 새로
--   meal        관람 후 식사 & Tea
--   club        동아리 운영·요청 사항 ← 새로
--   etc         기타                ← 새로
--
-- ── 값을 바꾸지 않는 이유 ─────────────────────────────────
-- exhibition 은 실제로는 장소를 고르는 설문이었지만 **값을 place 로 바꾸지 않는다.**
-- 이미 쌓인 설문 행을 전부 고쳐야 하고, 하나라도 놓치면 그 설문이
-- 어느 탭에도 안 뜬다. 화면에 보이는 이름만 바꿨다 (app/src/lib/survey.ts).
--
-- ── 두 곳을 함께 고쳐야 한다 ──────────────────────────────
-- 1. surveys_category_check   — 표에 넣을 수 있는 값
-- 2. survey_admin_save 의 검사 — 운영자 화면이 보내는 값
-- 하나만 고치면 화면에서는 고를 수 있는데 저장에서 막히거나(또는 그 반대)
-- 어느 쪽이 막았는지 모를 오류가 뜬다.

-- 1) 표 제약 — 검사 제약은 고쳐 넣을 수 없다. 지우고 다시 만든다.
alter table public.surveys drop constraint if exists surveys_category_check;

alter table public.surveys
  add constraint surveys_category_check
  check (category in ('exhibition', 'datetime', 'meal', 'club', 'etc'));

comment on column public.surveys.category is
  '전시 관람 장소(exhibition) · 일자와 시간(datetime) · 관람 후 식사와 Tea(meal) · 동아리 운영과 요청(club) · 기타(etc)';

-- 2) 운영자 저장 함수 — 갈래 검사 한 줄만 다르고 나머지는 202608210001a 와 같다.
--    (반환 모양이 그대로라 지울 필요가 없다. create or replace 로 덮는다.)
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
  if v_cat not in ('exhibition', 'datetime', 'meal', 'club', 'etc') then
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

-- 확인 (기대: 허용값 5 · 옛 설문이 전부 제약을 통과)
select
  (select count(*) from unnest(array['exhibition','datetime','meal','club','etc']) v) as 허용_갈래,
  (select count(*) from public.surveys
    where category not in ('exhibition','datetime','meal','club','etc')) as 제약_밖_설문,
  (select count(*) from public.surveys where deleted_at is null) as 살아있는_설문;
