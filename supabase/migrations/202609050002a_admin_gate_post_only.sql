-- 202609050002a — 운영자 관문을 POST 로만 열어, 암호가 URL 에 실리는 길을 막는다
--
-- Supabase SQL Editor 에 붙여넣어 실행한다. 여러 번 실행해도 같다.
--
-- ── 202608280003a(#83)로는 막히지 않았다 ───────────────────
-- 그 파일은 두 함수를 `volatile` 로 바꾸면 PostgREST 가 GET 을 안 받는다고 적었다.
-- **이 배포에서는 사실이 아니다.** 2026-09-05 에 실측했다.
--
--   · `survey_response_count` 는 휘발성 선언이 없어 기본값 VOLATILE 인데,
--     GET 으로 불러도 200 과 결과를 되돌려 준다
--   · `OPTIONS /rest/v1/rpc/survey_admin_ok` 의 Allow 는 휘발성을 바꾼 뒤에도
--     `GET, HEAD, POST, OPTIONS` 그대로다
--   · 임시 탐침 함수로 확인한 결과, GET 요청은 `transaction_read_only = on` 이었다
--
-- 즉 이 PostgREST 는 volatile 함수의 GET 을 **막는 것이 아니라 읽기 전용
-- 트랜잭션으로 돌린다.** 관문은 읽기만 하므로 아무 문제 없이 실행됐다.
-- `notify pgrst, 'reload schema'` 도 프로젝트 재시작도 이것을 바꾸지 못했다 —
-- 캐시 문제가 아니었기 때문이다.
--
-- **202608280003a 의 `alter ... volatile` 은 되돌리지 않는다.** 해롭지 않고,
-- 암호 검사 함수가 질의 안에서 인라인·캐시되지 않는 편이 낫다.
--
-- ── 그래서 무엇을 하나 ─────────────────────────────────────
-- PostgREST 는 요청 메서드를 트랜잭션 설정으로 넘겨 준다. 같은 탐침으로 확인했다 —
-- GET 요청에서 'GET', POST 요청에서 'POST' 가 정확히 온다.
-- 관문 첫머리에서 그 값을 보고 POST 가 아니면 거절한다.
--
-- ── 왜 관문 하나만 고치면 되나 ─────────────────────────────
-- 암호(`p_password`)를 받는 함수가 열아홉인데 **전부 첫 줄에서
-- `public.survey_admin_ok` 을 부른다** (AGENTS.md 「잠긴 표」 규칙, 2026-09-05 확인).
-- 그러니 여기서 raise 하면 열아홉이 함께 막힌다. 열아홉 곳에 같은 검사를 복사하면
-- 언젠가 한 곳이 빠지고, 빠진 곳은 조용하다.
--
-- ── NULL 을 통과시키는 이유 ────────────────────────────────
-- `current_setting('request.method', true)` 는 PostgREST 를 거치지 않은 호출에서
-- NULL 이다 — SQL Editor, psql, 다른 함수 안에서 부를 때. 그때는 막지 않는다.
-- `v_method is not null and v_method <> 'POST'` 가 그 뜻이다.
-- HEAD 도 함께 막힌다 (Allow 에 HEAD 가 있고, HEAD 역시 URL 에 인자를 싣는다).
--
-- ── 앱은 영향받지 않는다 ───────────────────────────────────
-- `app/src/lib/survey.ts:303` 에서 모든 rpc 가 POST 한 곳을 거친다.

begin;

-- 본문은 202608200001b 의 것 그대로다. 앞에 관문만 달았다.
-- `language sql` 로는 분기를 쓸 수 없어 plpgsql 로 바꾼다.
-- 휘발성은 202608280003a 가 만든 `volatile` 을 그대로 잇는다.
create or replace function public.survey_admin_ok(p_password text)
returns boolean
language plpgsql
security definer
volatile
set search_path = pg_catalog, public, extensions
as $$
declare
  v_method text := current_setting('request.method', true);
begin
  -- HTTP 를 거쳐 들어왔는데 POST 가 아니면 거절한다.
  -- GET·HEAD 는 인자를 URL 에 싣고, URL 은 본문과 달리 로그·브라우저 기록·
  -- Referer 에 남는다. 암호를 해시로만 저장한 공이 거기서 새어 나간다.
  if v_method is not null and v_method <> 'POST' then
    raise exception '이 함수는 POST 로만 부를 수 있습니다.'
      using errcode = '42501';
  end if;

  return exists (
    select 1 from public.survey_admins a
     where a.password_hash = crypt(coalesce(p_password, ''), a.password_hash)
  );
end;
$$;

-- create or replace 는 권한을 지우지 않지만, 처음부터 다시 돌리는 경우를 위해 남긴다.
grant execute on function public.survey_admin_ok(text) to anon, authenticated;

commit;

-- ── 확인 ───────────────────────────────────────────────────

-- 기대: plpgsql · 휘발성 v · anon 실행 가능 t
select
  l.lanname                                      as 언어,
  p.provolatile                                  as 휘발성,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_실행
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_language  l on l.oid = p.prolang
 where n.nspname = 'public' and p.proname = 'survey_admin_ok';

-- 기대: false — SQL Editor 는 PostgREST 를 안 거치므로 관문이 열려 있고,
-- 틀린 암호라 false 가 나온다. 여기서 오류가 나면 관문이 잘못 막고 있는 것이다.
select public.survey_admin_ok('NOT-A-REAL-PASSWORD') as sql_editor_에서는_통과;

-- **바깥에서 확인해야 하는 것** (이 파일 안에서는 확인할 수 없다)
--   POST /rest/v1/rpc/survey_admin_ok   → 200 false   (화면이 쓰는 길, 살아 있어야 함)
--   GET  /rest/v1/rpc/survey_admin_ok   → 403         '이 함수는 POST 로만…'
-- pg_proc 만 보는 확인으로는 오늘 일을 못 잡았다. 반드시 실제 요청으로 확인한다.
