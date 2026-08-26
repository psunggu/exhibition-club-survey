-- 202608270001a — 옮겨 온 투표에 **투표자 이름**을 담는다
--
-- 운영자 결정 (2026-08-27): 톡방에서 진행한 투표를 옮겨 올 때
-- 「톡방과 똑같이」 이름을 그대로 보여 준다.
--
-- ── 이 파일에는 실명이 없다 ────────────────────────────────
-- **이 저장소는 공개다.** 한 번 커밋된 것은 지워도 히스토리에 남는다.
-- 그래서 여기서는 **담을 칸만 만들고**, 실제 이름은 넣지 않는다.
-- 이름을 넣는 SQL 은 202608270001b_poll_voters.template.sql 의 틀을 채워
-- 운영자가 손으로 한 번 실행하고 저장하지 않는다 (운영자 암호와 같은 방식이다).
--
-- scripts/validate-repository-hygiene.mjs 가 추적되는 파일의 imported_voters 에
-- 가상 명부(docs/fixtures/sample-members.json) 밖의 이름이 있으면 잡는다.
--
-- ── 왜 컬럼인가 ────────────────────────────────────────────
-- 표 수(imported_votes)가 이미 survey_options 에 있다. 이름은 그 수를 이루는 것이라
-- 같은 줄에 두는 것이 맞다. 따로 표를 만들면 둘이 어긋나도 아무도 모른다 —
-- 여기 두면 아래 CHECK 하나로 **개수가 어긋나는 것을 DB 가 막는다.**
--
-- ── 글자를 손대지 않는다 ───────────────────────────────────
-- 톡방 화면에 적힌 그대로 넣는다. 구역번호를 붙이지도, 떼지도, 성을 가리지도 않는다.
-- 운영자가 「톡방과 똑같이」 라고 정했다. 화면도 이 값을 그대로 그린다.

alter table public.survey_options
  add column if not exists imported_voters text[];

comment on column public.survey_options.imported_voters is
  '옮겨 온 투표의 투표자 이름. 톡방 화면 그대로 적는다. 개수는 imported_votes 와 같아야 한다.';

/* ── 개수가 어긋나면 화면이 거짓말을 한다 ──────────────────
   「7명」 이라고 적어 놓고 이름이 5개면 둘 중 하나는 틀린 것인데,
   보는 사람은 어느 쪽이 틀렸는지 알 수 없다. 그래서 DB 에서 막는다.

   **화면이 이름 개수로 막대를 다시 그리게 두지 않는다.** 그렇게 하면 운영자가
   하나 빠뜨린 것이 조용히 덮여 아무도 못 알아챈다. 막대는 끝까지 표 수로 그리고,
   어긋난 값은 애초에 안 들어가게 여기서 막는다.

   `cardinality` 를 쓴다 — `array_length(x, 1)` 은 빈 배열에 **NULL** 을 줘서
   0표 항목이 검사를 통째로 빠져나간다. cardinality('{}') 는 0 이다.

   이름을 아예 안 넣는 설문(지금까지의 모든 옮겨 온 투표)은 NULL 이라 그냥 지나간다. */
alter table public.survey_options
  drop constraint if exists survey_options_voters_match;

alter table public.survey_options
  add constraint survey_options_voters_match check (
    imported_voters is null
    or (imported_votes is not null and cardinality(imported_voters) = imported_votes)
  );

/* ── 빈 이름은 안 받는다 ───────────────────────────────────
   `array['박서준','']` 처럼 하나가 비면 화면에 빈 칩이 그려진다.
   개수는 맞으니 위 CHECK 는 통과한다 — 그래서 따로 막는다.

   **CHECK 안에는 서브쿼리를 못 쓴다** (0A000 cannot use subquery in check constraint).
   그래서 `unnest` 로 풀어 보는 대신 배열 연산자로 쓴다 —
   `= any(...)` 는 배열 연산이라 서브쿼리가 아니다.

   NULL 원소도 따로 막는다. `array['박서준', null]` 은 개수가 2라 위 CHECK 를 지나가고,
   화면에서는 빈 칩이 된다. array_position 은 NULL 을 찾아 준다
   (비교를 `is not distinct from` 으로 한다). */
alter table public.survey_options
  drop constraint if exists survey_options_voters_nonblank;

alter table public.survey_options
  add constraint survey_options_voters_nonblank check (
    imported_voters is null
    or (
      not ('' = any(imported_voters))
      and array_position(imported_voters, null) is null
    )
  );

/* ── 이름을 담으려면 「이름 보임」 을 켜야 한다 ────────────
   설문에는 이미 이름을 보여 줄지 정하는 스위치가 있다 — surveys.show_names.
   그런데 imported_voters 는 survey_options 에 있고, 앱은 후보를 REST 로 그냥 읽는다.
   **그대로 두면 show_names 가 'none' 인 설문에서도 이름이 나간다** — 스위치를 옆으로 지나친다.
   운영자가 「이름은 안 보임」 으로 두고 안심하는 사이에 이름이 공개되는 것이 가장 나쁜 실패다.

   그래서 **담는 단계에서** 막는다. 이름이 있는 설문은 반드시 show_names='participants' 다.
   그러면 「DB 에 이름이 있다」 = 「운영자가 보이기로 정했다」 가 되어,
   공개 REST 로 나가는 것도 실수가 아니라 뜻한 대로가 된다.

   CHECK 제약으로는 못 쓴다 — 다른 표(surveys)를 봐야 하는데 CHECK 안에서는 안 된다.
   양쪽에 건다. 한쪽만 걸면 반대 방향으로 빠져나간다 —
   이름을 넣은 뒤에 스위치를 도로 끄면 화면은 계속 이름을 보여 준다. */
create or replace function public.survey_voters_need_show_names()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_show text;
begin
  if new.imported_voters is null then
    return new;
  end if;
  select s.show_names into v_show
    from public.surveys s where s.id = new.survey_id;
  if v_show is distinct from 'participants' then
    raise exception
      '이름을 담으려면 설문의 show_names 를 먼저 participants 로 바꿔 주세요. (설문 %)', new.survey_id
      using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists survey_options_voters_gate on public.survey_options;
create trigger survey_options_voters_gate
  before insert or update of imported_voters, survey_id on public.survey_options
  for each row execute function public.survey_voters_need_show_names();

create or replace function public.survey_show_names_keeps_voters()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.show_names is distinct from 'participants'
     and exists (select 1 from public.survey_options o
                  where o.survey_id = new.id and o.imported_voters is not null) then
    raise exception
      '이 설문에는 후보마다 이름이 담겨 있습니다. 먼저 이름을 지우고 바꿔 주세요. (설문 %)', new.id
      using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists surveys_show_names_gate on public.surveys;
create trigger surveys_show_names_gate
  before update of show_names on public.surveys
  for each row execute function public.survey_show_names_keeps_voters();

/* ── 운영자 화면도 같은 것을 본다 ──────────────────────────
   지금까지 옮겨 온 설문은 운영자 화면에서 voters 가 늘 비어 있었다.
   지어낼 것이 없어서였는데, 이제 담을 곳이 생겼으니 있으면 보여 준다.

   **반환 모양이 그대로라 지울 필요가 없다.** 컬럼을 더하거나 뺐다면
   42P13 (cannot change return type) 때문에 drop 부터 해야 한다 —
   202608210001a 에서 실제로 겪은 일이다. 여기는 배열 안의 값만 달라진다. */
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
      -- 옮겨 온 이름이 있으면 그것. 없으면 실제로 낸 사람들.
      -- 사이트에서 받은 응답은 2026-08-24 부터 전부 「익명」 이라 이름이 안 나온다.
      coalesce(
        o.imported_voters,
        array_agg(r.zone || ' ' || r.display_name order by r.created_at)
          filter (where r.id is not null),
        '{}'::text[]
      )
      from public.survey_options o
      left join public.survey_choices  c on c.option_id  = o.id
      left join public.survey_responses r on r.id        = c.response_id
     where o.survey_id = p_survey
     group by o.id, o.position, o.title, o.imported_votes, o.imported_voters
     order by o.position;
end;
$$;

-- ── 확인 ───────────────────────────────────────────────────
-- 기대: 컬럼_생김 t · 제약 2 · 방아쇠 2 · 개수어긋난_줄 0
--       · 스위치안켜고_이름있는_설문 0 · 이름담긴_설문 0 (아직 아무것도 안 넣었으니 0)
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'survey_options'
      and column_name = 'imported_voters') = 1 as 컬럼_생김,
  (select count(*) from pg_constraint
    where conrelid = 'public.survey_options'::regclass
      and conname in ('survey_options_voters_match',
                      'survey_options_voters_nonblank')) as 제약,
  (select count(*) from pg_trigger
    where not tgisinternal
      and tgname in ('survey_options_voters_gate', 'surveys_show_names_gate')) as 방아쇠,
  (select count(*) from public.survey_options
    where imported_voters is not null
      and cardinality(imported_voters) is distinct from imported_votes) as 개수어긋난_줄,
  (select count(*) from public.survey_options o
     join public.surveys s on s.id = o.survey_id
    where o.imported_voters is not null
      and s.show_names is distinct from 'participants') as 스위치안켜고_이름있는_설문,
  (select count(distinct survey_id) from public.survey_options
    where imported_voters is not null) as 이름담긴_설문;
