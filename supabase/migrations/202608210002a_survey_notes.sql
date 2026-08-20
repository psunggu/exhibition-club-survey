-- 202608210002a — 설문마다 운영진이 보는 분석 메모
--
-- 앞의 마이그레이션을 모두 실행한 뒤 이것을 실행한다.
--
-- ── 왜 따로 표를 두나 ──────────────────────────────────────
-- `surveys` 는 **누구나 읽는 표**다. 분석 메모에는 톡방에서 오간 이야기나
-- 사람 이름이 섞일 수 있어서, 거기 컬럼으로 붙이면 그대로 공개된다.
--
-- 그래서 잠근 표를 따로 둔다. 정책을 하나도 만들지 않으므로 **아무도 못 읽고**,
-- 암호를 아는 사람만 아래 함수로 닿는다.
--
-- 회원에게도 보여 줄 일이 생기면 그때 공개 여부를 값으로 두면 된다.
-- 지금은 그런 요구가 없으므로 운영진만 본다.

create table if not exists public.survey_notes (
  survey_id  uuid primary key references public.surveys(id) on delete cascade,
  body       text not null,
  updated_at timestamptz not null default now()
);

comment on table public.survey_notes
  is '설문마다 운영진이 참고하는 분석 메모. 잠긴 표라 함수로만 닿는다.';

alter table public.survey_notes enable row level security;

-- 정책을 만들지 않는다 = RLS 아래서 아무도 못 읽는다. 일부러 비워 둔다.
revoke all on public.survey_notes from anon, authenticated;

/* ── 읽기 ──────────────────────────────────────────────────
   없으면 빈 문자열을 준다. "없다" 와 "못 읽는다" 를 화면에서 가르기 위해서다. */
create or replace function public.survey_admin_note(
  p_password text,
  p_survey   uuid
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
  select n.body into v from public.survey_notes n where n.survey_id = p_survey;
  return coalesce(v, '');
end;
$$;

/* ── 쓰기 ──────────────────────────────────────────────────
   빈 값을 넣으면 지운다 — 빈 메모를 남겨 두면 화면에 빈 탭이 뜬다. */
create or replace function public.survey_admin_note_save(
  p_password text,
  p_survey   uuid,
  p_body     text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v text := btrim(coalesce(p_body, ''));
begin
  if not public.survey_admin_ok(p_password) then
    raise exception '운영자 암호가 맞지 않습니다.' using errcode = '28000';
  end if;
  if not exists (select 1 from public.surveys s where s.id = p_survey and s.deleted_at is null) then
    raise exception '없는 설문입니다.' using errcode = 'P0002';
  end if;
  -- 너무 긴 글은 화면에서도 읽기 어렵고 실수로 붙여넣은 것일 때가 많다
  if length(v) > 20000 then
    raise exception '메모가 너무 깁니다 (20,000자까지).' using errcode = '22023';
  end if;

  if v = '' then
    delete from public.survey_notes where survey_id = p_survey;
    return;
  end if;

  insert into public.survey_notes (survey_id, body)
  values (p_survey, v)
  on conflict (survey_id) do update set body = excluded.body, updated_at = now();
end;
$$;

grant execute on function public.survey_admin_note(text, uuid)             to anon, authenticated;
grant execute on function public.survey_admin_note_save(text, uuid, text)  to anon, authenticated;

-- 확인 (기대: 표 1 · 정책 0 · anon 이 부르는 함수 15)
select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'survey_notes') as 표,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'survey_notes') as 정책,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'survey%'
      and has_function_privilege('anon', p.oid, 'EXECUTE')) as 부를_수_있는_함수;
