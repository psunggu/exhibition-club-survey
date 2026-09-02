-- 202608280003a — 운영자 암호가 URL 에 실리지 않게 한다
--
-- ── 무엇이 문제였나 ─────────────────────────────────────────
-- PostgREST 는 **불린 함수의 휘발성으로 거래 방식을 정한다.**
--   volatile          → POST 만 받는다. 거래는 READ WRITE
--   stable·immutable  → **GET 도 받는다.** 거래는 READ ONLY
--
-- survey_admin_ok 과 survey_admin_members 가 stable 이었다. 둘 다 인자가
-- p_password 하나다. 그래서 이런 요청이 성립했다 —
--
--   GET /rest/v1/rpc/survey_admin_members?p_password=…
--
-- **운영자 암호가 URL 쿼리에 실린다.** URL 은 본문과 달리 여기저기 남는다 —
-- Cloudflare 로그, Supabase 로그, 브라우저 기록, 그리고 그 화면에서 밖으로
-- 나가는 요청의 Referer. 암호를 해시로만 저장한 공이 거기서 새어 나간다.
-- survey_admin_members 는 그 위에 **교인 명부를 통째로** 돌려주는 함수다.
--
-- 화면은 rpc 를 전부 POST 로 보내므로(app/src/lib/survey.ts) 바뀌는 것이 없다.
-- 막는 것은 화면이 쓰지 않는 길이다.
--
-- ── 왜 create or replace 가 아니라 alter 인가 ───────────────
-- 바꾸는 것이 **속성 하나뿐**이라 본문을 다시 적을 이유가 없다.
-- 다시 적으면 옮겨 적다 어긋날 여지가 생기고, 그 어긋남은 조용하다.
-- alter function 은 본문을 건드리지 않는다.
--
-- 원본 파일(202608200001b·202608220001a)에는 stable 이 그대로 남는다.
-- 마이그레이션은 지나간 것을 고치지 않고 뒤에 덧붙인다 —
-- 202608240001a 가 survey_my_choices 를 원본 대신 새 파일에서 다시 쓴 것과 같다.
-- 처음부터 다시 돌려도 이 파일이 뒤에 와서 바로잡는다.
--
-- ── 남는 것 ─────────────────────────────────────────────────
-- 이 변경은 암호가 **로그에 남는 것**을 막는다. 암호를 **맞혀 보는 것**은
-- 못 막는다. 관문 뒤가 전부 raise 라 두드림을 세어도 거래가 되돌아가며
-- 함께 지워지기 때문이다(202608220001a 가 적어 둔 함정이다).
-- 맞혀 보는 쪽은 crypt 비용으로 늦추고(202608200001d 에서 bf 6 → 10),
-- 정말로 세려면 요청을 세는 층이 DB 앞에 있어야 한다.

alter function public.survey_admin_ok(text)      volatile;
alter function public.survey_admin_members(text) volatile;

-- ── 확인 ────────────────────────────────────────────────────

-- 기대: 두 줄 다 휘발성 = v
-- 'v' 가 아니면 PostgREST 가 여전히 GET 을 받는다.
select p.proname as 함수, p.provolatile as 휘발성
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('survey_admin_ok', 'survey_admin_members')
 order by p.proname;

-- 기대: 0줄 — 암호를 받으면서 GET 으로도 불리는 함수가 남아 있으면 안 된다.
-- provolatile 이 s(stable) 나 i(immutable) 인 것만 걸린다.
select p.proname as 아직_GET_으로_불리는_함수
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.provolatile in ('s', 'i')
   and pg_get_function_identity_arguments(p.oid) like '%text%'
   and has_function_privilege('anon', p.oid, 'EXECUTE')
   and p.proname like 'survey_admin%';
