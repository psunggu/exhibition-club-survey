-- 202608200002a — 운영자 함수 (설문 올리기·고치기·지우기)
--
-- 202608200001a·b 를 먼저 실행한 뒤 이것을 실행한다.
--
-- ── 여기서 지켜야 하는 것 ───────────────────────────────────
-- 이 함수들은 security definer 라 **표 주인 권한으로 돈다.**
-- anon 이 부를 수 있으므로, 안에서 암호를 확인하지 않으면
-- 누구나 설문을 지울 수 있게 된다. 그래서 모든 함수가 첫 줄에서 암호를 본다.
--
-- 암호가 틀리면 **무엇이 틀렸는지 알려주지 않는다** — 설문이 있는지 없는지도
-- 알려주지 않는다. 있는지 없는지를 알려주면 그것만으로 훑을 수 있다.

-- ── 고치기 전에: 응답을 지키는 규칙 ────────────────────────
/**
 * 설문을 고칠 때 후보를 **지우고 새로 넣으면 안 된다.**
 * survey_choices 가 option_id 를 참조하므로 cascade 로 응답이 함께 날아간다.
 * 그래서 자리(position)를 기준으로 **있는 것은 고치고, 모자라면 넣고,
 * 남으면 지운다.** 자리를 지킨 후보의 표는 그대로 남는다.
 *
 * 후보를 줄이면 그 자리의 표는 사라진다 — 그건 어쩔 수 없고, 화면에서 미리 알린다.
 */

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
  v_days  := coalesce((p_payload ->> 'days')::integer, 0);
  v_opts  := coalesce(p_payload -> 'options', '[]'::jsonb);
  v_n     := jsonb_array_length(v_opts);

  if v_title = '' then
    raise exception '설문 제목을 적어 주세요.' using errcode = '22023';
  end if;
  if length(v_title) > 120 then
    raise exception '설문 제목이 너무 깁니다 (120자까지).' using errcode = '22023';
  end if;
  -- 올린 사람은 운영자 명단에 있는 이름이어야 한다
  if not exists (select 1 from public.survey_admins a where a.name = v_by) then
    raise exception '올린 사람을 운영자 명단에서 고르세요.' using errcode = '22023';
  end if;
  if v_days < 1 or v_days > 90 then
    raise exception '받는 기간은 1일에서 90일 사이로 정해 주세요.' using errcode = '22023';
  end if;
  -- 요구사항: 후보 1~5개
  if v_n < 1 or v_n > 5 then
    raise exception '후보는 1개에서 5개까지 넣을 수 있습니다.' using errcode = '22023';
  end if;

  -- 후보 하나하나를 미리 본다. 반쯤 저장되고 실패하는 것을 막으려는 것이다.
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
      -- https 만 받는다. javascript: 같은 것이 링크로 나가면 안 된다.
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
       results_visible, show_names, hide_after_days)
    values (
      v_title,
      nullif(btrim(coalesce(p_payload ->> 'intro', '')), ''),
      coalesce((p_payload ->> 'multi_choice')::boolean, true),
      now(),
      -- 요구사항: "올린 날로부터 며칠까지"
      now() + (v_days || ' days')::interval,
      v_by,
      coalesce(nullif(p_payload ->> 'results_visible', ''), 'after_close'),
      coalesce(nullif(p_payload ->> 'show_names', ''), 'none'),
      nullif(p_payload ->> 'hide_after_days', '')::integer
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
      -- **기한은 올린 날이 아니라 지금부터 다시 센다.** 고칠 때 연장하는 것이
      -- 자연스럽고, 원래 시작일을 기준으로 하면 이미 지난 기한이 나온다.
      closes_at       = now() + (v_days || ' days')::interval,
      created_by      = v_by,
      results_visible = coalesce(nullif(p_payload ->> 'results_visible', ''), 'after_close'),
      show_names      = coalesce(nullif(p_payload ->> 'show_names', ''), 'none'),
      hide_after_days = nullif(p_payload ->> 'hide_after_days', '')::integer,
      updated_at      = now()
     where id = v_id;
  end if;

  -- 자리마다 고치거나 넣는다 (지우고 새로 넣지 않는다 — 표가 날아간다)
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

  -- 줄어든 만큼 뒤를 지운다. 그 자리의 표는 함께 사라진다 (화면에서 미리 알린다).
  delete from public.survey_options
   where survey_id = v_id and position > v_n;

  return v_id;
end;
$$;

-- ── 지우기 ──────────────────────────────────────────────────
-- 진짜로 지우지 않고 deleted_at 만 찍는다. 응답이 남아 있어서,
-- 잘못 눌렀을 때 되돌릴 수 있어야 한다.
create or replace function public.survey_admin_delete(
  p_password text,
  p_survey   uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;
  update public.surveys set deleted_at = now(), updated_at = now()
   where id = p_survey and deleted_at is null;
  if not found then
    raise exception '없는 설문입니다.' using errcode = 'P0002';
  end if;
end;
$$;

-- ── 운영자가 보는 목록 ──────────────────────────────────────
-- 응답 수까지 함께 준다. **이름은 주지 않는다** — 운영자라도 누가 뭘 골랐는지는
-- 화면에 쌓지 않는 것이 이 설계의 약속이다 (show_names 를 켠 설문만 예외).
create or replace function public.survey_admin_list(p_password text)
returns table (
  id uuid, title text, closes_at timestamptz, created_by text,
  multi_choice boolean, results_visible text, show_names text,
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
           (select count(*) from public.survey_options o where o.survey_id = s.id),
           (select count(*) from public.survey_responses r where r.survey_id = s.id)
      from public.surveys s
     where s.deleted_at is null
     order by s.closes_at desc;
end;
$$;

-- results_visible 이 'admin' 이어도 운영자는 집계를 본다
create or replace function public.survey_admin_tally(p_password text, p_survey uuid)
returns table (option_id uuid, votes bigint)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;
  return query
    select o.id, count(c.response_id)
      from public.survey_options o
      left join public.survey_choices c on c.option_id = o.id
     where o.survey_id = p_survey
     group by o.id;
end;
$$;

-- 운영자 이름 목록. 암호가 맞아야 나온다 — 명단도 개인정보다.
create or replace function public.survey_admin_names(p_password text)
returns table (name text)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;
  return query select a.name from public.survey_admins a order by a.name;
end;
$$;

-- ── 부를 권한 ───────────────────────────────────────────────
grant execute on function public.survey_admin_save(text, jsonb)   to anon, authenticated;
grant execute on function public.survey_admin_delete(text, uuid)  to anon, authenticated;
grant execute on function public.survey_admin_list(text)          to anon, authenticated;
grant execute on function public.survey_admin_tally(text, uuid)   to anon, authenticated;
grant execute on function public.survey_admin_names(text)         to anon, authenticated;

-- 확인 (기대: 11 — 앞서 만든 6 + 방금 5)
select count(*) as anon_이_부를_수_있는_함수
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname like 'survey%'
  and has_function_privilege('anon', p.oid, 'EXECUTE');
