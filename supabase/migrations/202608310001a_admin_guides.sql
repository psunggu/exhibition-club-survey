-- 202608310001a — 운영진만 읽는 긴 글을 담는 자리
--
-- 202608200001d(운영자 암호)와 202608200002a(survey_admin_ok)를 먼저 실행한 뒤 돌린다.
--
-- ── 왜 필요한가 ────────────────────────────────────────────
-- 구글 설문 1차 분석 같은 **운영자용 문서**를 화면에 띄우려는 것이다.
-- 그 글에는 공개 화면에 넣지 않기로 한 것들이 들어 있다 (AGENTS.md) —
-- 참여 빈도별 집단 구분(코어·주변부), 미응답자 수, 자유서술 인용.
--
-- **번들은 공개다.** 화면 코드에 본문을 넣으면 암호는 가림막일 뿐이고
-- 누구나 `assets/index-*.js` 를 받아 읽는다. 배포된 번들을 실제로 받아 확인했다.
-- **공개 저장소의 .sql 에 적어도 같다** — 그래서 이 파일에는 본문이 없다.
-- 글은 운영자 화면에서 붙여 넣고, 오직 이 표에만 산다.
--
-- ── survey_notes 와 무엇이 다른가 ──────────────────────────
-- 구조는 똑같다(잠근 표 + 암호 함수 둘). 다른 것은 **무엇에 매다는가**뿐이다.
--   survey_notes  survey_id  — `surveys` 행이 있어야 한다
--   admin_guides  key(text)  — 설문 행이 없는 것에도 맨다
-- 구글 설문은 여기서 투표를 받지 않아 `surveys` 행이 없다. 그래서 notes 에 못 넣는다.
-- 억지로 넣으려고 가짜 설문 행을 만들면 회원 화면과 집계가 그 행을 세게 된다.
--
-- ── 왜 public 스키마인가 ───────────────────────────────────
-- AGENTS.md 는 새 객체를 `club` 에 두라고 한다. 다만 이 저장소의 설문 표는 전부
-- `public` 에 있고(survey_notes · survey_members · survey_probe_log …),
-- `club` 은 PostgREST 에 노출돼 있지 않아 스키마를 새로 여는 설정 변경이 필요하다.
-- **잠그는 방식이 같으면 스키마 이름은 위험을 바꾸지 않는다** — 정책이 없어
-- 아무도 못 읽는 것은 마찬가지다. 옆에 있는 survey_notes 와 같은 자리에 둔다.

create table if not exists public.admin_guides (
  key        text primary key,
  body       text not null,
  updated_at timestamptz not null default now()
);

comment on table public.admin_guides
  is '운영진만 읽는 긴 글. 잠긴 표라 암호 함수로만 닿는다. 회원 화면에 나가지 않는다.';
comment on column public.admin_guides.key
  is '무엇에 대한 글인가. 구글 설문 회차 id 를 그대로 쓴다 (예: g-2026-08).';

alter table public.admin_guides enable row level security;

-- **정책을 만들지 않는다 = RLS 아래서 아무도 못 읽는다.** 일부러 비워 둔다.
-- survey_notes 와 같은 방식이고, validate-survey-schema 가 이 표를 잠긴 표로 검사한다.
revoke all on public.admin_guides from anon, authenticated;

/* ── 읽기 ──────────────────────────────────────────────────
   없으면 빈 글자를 준다 — 「없다」 와 「못 읽는다」 를 화면에서 가르기 위해서다
   (survey_admin_note 과 같은 규칙). */
create or replace function public.survey_admin_guide(
  p_password text,
  p_key      text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v text;
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;
  select g.body into v from public.admin_guides g where g.key = p_key;
  return coalesce(v, '');
end;
$$;

/* ── 쓰기 ──────────────────────────────────────────────────
   빈 값을 넣으면 지운다 — 빈 글을 남겨 두면 화면에 빈 절이 뜬다. */
create or replace function public.survey_admin_guide_save(
  p_password text,
  p_key      text,
  p_body     text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_key  text;
  v_body text;
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;

  v_key  := btrim(coalesce(p_key, ''));
  v_body := btrim(coalesce(p_body, ''));

  if v_key = '' then
    raise exception '어떤 글인지 지정되지 않았습니다.' using errcode = '22023';
  end if;
  if length(v_key) > 80 then
    raise exception '이름이 너무 깁니다 (80자까지).' using errcode = '22023';
  end if;
  -- 한 사람이 실수로 붙여 넣기를 반복해도 표가 부풀지 않게 위를 막는다.
  if length(v_body) > 60000 then
    raise exception '글이 너무 깁니다 (6만 자까지).' using errcode = '22023';
  end if;

  if v_body = '' then
    delete from public.admin_guides where key = v_key;
    return;
  end if;

  insert into public.admin_guides (key, body, updated_at)
  values (v_key, v_body, now())
  on conflict (key) do update
    set body = excluded.body, updated_at = now();
end;
$$;

-- 기본 권한이 revoke 되어 있다(202608060001). grant 를 빠뜨리면 함수가 있어도
-- 앱에서 부를 수 없다 — 조용히 안 되는 쪽이다.
grant execute on function public.survey_admin_guide(text, text)       to anon, authenticated;
grant execute on function public.survey_admin_guide_save(text, text, text) to anon, authenticated;

-- 확인 (기대: 함수 2 · 정책 0 · anon 권한 0)
select
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('survey_admin_guide', 'survey_admin_guide_save')) as 함수,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'admin_guides')           as 정책_0이어야_함,
  (select count(*) from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'admin_guides'
      and grantee in ('PUBLIC', 'anon', 'authenticated'))                 as anon권한_0이어야_함;
