-- 202608200001a — 설문 표 만들기
--
-- **한 번에 하나씩 실행한다.** Supabase SQL Editor 는 스크립트 전체를 한
-- 트랜잭션으로 묶는다. 뒤쪽 한 문장이 실패하면 앞의 것까지 통째로 되돌아가
-- 아무것도 남지 않는다 — 지난번에 실제로 두 번 그랬다. 그래서 파일을 나눈다.
--
--   a  표와 권한          ← 지금 이 파일
--   b  함수 (읽고 쓰는 유일한 통로)
--   c  9월 설문 내용
--
-- ── 이 설계에서 지켜야 하는 것 ──────────────────────────────
-- 응답에는 **이름과 구역번호**가 들어간다. 그런데 이 사이트의 anon 키는
-- 공개 저장소에 있다. 응답 표를 anon 이 읽을 수 있게 두면 누구나 키를 꺼내
-- "누가 무엇에 투표했는지" 명단을 통째로 내려받는다.
--
-- 그래서 이렇게 가른다.
--   surveys · survey_options   누구나 읽는다 (공개해도 되는 내용)
--   survey_responses · survey_choices   **아무도 직접 못 읽는다**
--
-- 응답 관련은 전부 b 파일의 함수를 거친다. 집계 숫자와 본인 응답만 나온다.

create extension if not exists pgcrypto;

-- ── 설문 ────────────────────────────────────────────────────
create table if not exists public.surveys (
  id            uuid primary key default gen_random_uuid(),
  title         text        not null,
  intro         text,
  -- 후보를 여러 개 고를 수 있나. 추천 단계는 여러 개, 최종 투표는 하나.
  multi_choice  boolean     not null default true,
  opens_at      timestamptz not null default now(),
  closes_at     timestamptz not null,
  created_by    text        not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,

  -- 아래 셋은 **설문마다 따로 정한다.** 하나로 못 박으면 추천 단계와
  -- 최종 투표에 같은 규칙이 걸려 둘 중 하나가 어색해진다.
  --   always       응답하면 바로 집계가 보인다
  --   after_close  마감 뒤에 보인다
  --   admin        운영자만 본다
  results_visible text not null default 'after_close'
    check (results_visible in ('always', 'after_close', 'admin')),
  --   none          숫자만. 이름은 어디에도 안 나온다
  --   participants  참여한 사람 이름만 (무엇을 골랐는지는 안 보인다)
  show_names text not null default 'none'
    check (show_names in ('none', 'participants')),
  -- 마감 뒤 며칠까지 화면에 남길지. null 이면 운영자가 지울 때까지 남는다.
  hide_after_days integer check (hide_after_days is null or hide_after_days >= 0),

  check (closes_at > opens_at)
);

-- ── 후보 ────────────────────────────────────────────────────
create table if not exists public.survey_options (
  id         uuid primary key default gen_random_uuid(),
  survey_id  uuid    not null references public.surveys(id) on delete cascade,
  position   integer not null,
  title      text    not null,
  period     text,
  venue      text,
  hours      text,
  price      text,
  note       text,
  /**
   * 관람을 고르는 데 참고가 되는 링크. 공식 페이지 하나로는 부족해서
   * 영상·기사·지도까지 붙일 수 있게 목록으로 둔다.
   *
   *   [{"kind": "official", "label": "예매 페이지", "url": "https://…"},
   *    {"kind": "video",    "label": "9월 전시 소개 영상", "url": "https://…"}]
   *
   * kind 는 화면에서 아이콘을 고르는 데 쓴다 — official · video · article · map.
   */
  links      jsonb   not null default '[]'::jsonb
    check (jsonb_typeof(links) = 'array'),
  created_at timestamptz not null default now(),

  unique (survey_id, position)
);

-- ── 응답 (밖에서 못 읽는다) ─────────────────────────────────
create table if not exists public.survey_responses (
  id             uuid primary key default gen_random_uuid(),
  survey_id      uuid not null references public.surveys(id) on delete cascade,
  -- '4133|박성규' 꼴로 정규화한 값. 한 설문에 한 사람 하나.
  respondent_key text not null,
  zone           text not null,
  display_name   text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (survey_id, respondent_key)
);

create table if not exists public.survey_choices (
  response_id uuid not null references public.survey_responses(id) on delete cascade,
  option_id   uuid not null references public.survey_options(id) on delete cascade,
  primary key (response_id, option_id)
);

-- ── 운영자 암호 ─────────────────────────────────────────────
-- 이름만으로는 누구나 사칭할 수 있어서 공유 암호를 하나 둔다.
-- **암호 원문은 어디에도 저장하지 않는다** — bcrypt 해시만 둔다.
-- 이 표는 anon 이 읽지 못한다. 대조는 b 파일의 함수 안에서만 일어난다.
create table if not exists public.survey_admins (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- ── 자물쇠 ──────────────────────────────────────────────────
alter table public.surveys           enable row level security;
alter table public.survey_options    enable row level security;
alter table public.survey_responses  enable row level security;
alter table public.survey_choices    enable row level security;
alter table public.survey_admins     enable row level security;

-- 정책을 하나도 만들지 않은 표는 RLS 아래서 **아무도 못 읽는다.**
-- 응답 셋(responses · choices · admins)이 그렇다 — 일부러 비워 둔다.

drop policy if exists surveys_read on public.surveys;
create policy surveys_read on public.surveys
  for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists survey_options_read on public.survey_options;
create policy survey_options_read on public.survey_options
  for select to anon, authenticated
  using (exists (
    select 1 from public.surveys s
    where s.id = survey_id and s.deleted_at is null
  ));

-- 기본 권한이 revoke 되어 있으므로(202608060001) 읽을 표만 명시해서 준다.
grant select on public.surveys        to anon, authenticated;
grant select on public.survey_options to anon, authenticated;

-- 응답 셋은 권한 자체를 주지 않는다. 함수(security definer)로만 닿는다.
revoke all on public.survey_responses from anon, authenticated;
revoke all on public.survey_choices   from anon, authenticated;
revoke all on public.survey_admins    from anon, authenticated;

create index if not exists survey_options_survey_idx  on public.survey_options (survey_id, position);
create index if not exists survey_responses_survey_idx on public.survey_responses (survey_id);
create index if not exists survey_choices_option_idx   on public.survey_choices (option_id);

-- 확인 (기대: 표 5 · 정책 2)
select
  (select count(*) from information_schema.tables
    where table_schema = 'public'
      and table_name in ('surveys','survey_options','survey_responses','survey_choices','survey_admins')) as 표,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename in ('surveys','survey_options')) as 정책;
