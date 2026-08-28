-- 202608280002a — 「내가 낸 것 다시 보기」 에 명부 관문을 단다
--
-- survey_my_choices 는 명부 검사도 두드림 계수도 없이 anon 에게 열려 있었다.
-- 화면은 앞서 survey_member_ok 를 부르고 통과해야 이걸 부르지만(app/src/Survey.tsx),
-- **그 관문은 화면에만 있다.** REST 로 직접 부르면 통째로 건너뛴다.
--
-- ── 무엇이 문제였나 ─────────────────────────────────────────
-- 202608220001a 에서 survey_member_ok 에 스로틀을 단 이유가 그대로 여기에 걸린다 —
-- 「명부 대조는 예/아니오를 답한다. 그래서 반복해서 물으면 명부가 나온다.」
-- survey_my_choices 는 **같은 예/아니오를 문턱 없이** 답했다.
-- 결과가 비지 않으면 그 사람은 명부에 있고 이 설문에 응답도 했다는 뜻이다.
--
-- 더 나쁜 것은 **조용하다는 점**이다. survey_submit 으로 명부를 캐내는 길을
-- 받아들일 수 있었던 근거가 202608220001a 에 적혀 있다 —
-- 「맞히면 응답이 실제로 저장된다 … 조용히 훑을 수가 없다.」
-- 이 함수는 순수 조회라 흔적이 하나도 안 남는다. 그 근거가 여기서는 성립하지 않았다.
--
-- 그리고 202608240001a 가 약속한 것 하나가 깨진다 —
-- 「설문마다 다른 열쇠가 나온다 — 두 설문에 같은 사람이 냈는지도 이어 볼 수 없다.」
-- 설문별 열쇠는 **저장된 행**을 지킬 뿐이다. 설문마다 한 번씩 이 함수를 부르면
-- 한 사람을 전 설문에 걸쳐 이어 볼 수 있다 — 그 파일이 지키겠다고 적은 REST 로.
--
-- ── 여기서는 두드림 계수가 실제로 남는다 ────────────────────
-- survey_admin_ok 에는 같은 장치를 달 수 없었다. 관문 뒤가 전부 `raise` 라
-- 거래가 되돌아가면서 방금 적은 두드림까지 함께 지워지기 때문이다
-- (202608220001a 가 이미 적어 둔 함정이다).
-- **이 함수는 raise 를 하지 않고 표를 돌려준다.** 예외가 없으니 롤백도 없고,
-- survey_member_ok 안의 survey_probe_miss 가 그대로 남는다.
--
-- ── v_roster > 0 가드가 있어야 하는 이유 ────────────────────
-- survey_member_ok 에는 **명부가 비었을 때의 가드가 없다.** 표가 비면 전원 false 다.
-- 화면은 `roster && !ok` 로 감싸 그 경우를 무시하고, survey_submit 도
-- `v_roster > 0 and …` 로 감싼다. 여기만 안 감싸면 명부를 비우는 순간
-- **아무도 자기 응답을 못 불러온다.** survey_submit 의 관용을 그대로 따른다.
--
-- 거절하는 이유는 알리지 않는다 — 빈 결과로만 답한다.
-- 「지금 막혔다」 를 알려 주면 그것도 신호가 되고, 회원에게는 어차피 같은 화면이다.
--
-- 몸통은 202608240001a 의 것과 같다. 앞에 관문 두 줄이 붙었을 뿐이다.
-- language 를 sql 에서 plpgsql 로 바꾼다 — 관문이 쓰기를 하므로 필요하다.
-- 이름·인자형·반환형이 그대로라 create or replace 로 바꿀 수 있고,
-- 소유권과 권한은 바뀌지 않으므로 202608200001b 의 anon grant 가 그대로 살아 있다.

create or replace function public.survey_my_choices(
  p_survey uuid,
  p_zone   text,
  p_name   text
)
returns table (option_id uuid)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_roster integer;
begin
  select count(*) into v_roster from public.survey_members;

  -- 명부 밖이거나 너무 잦으면 아무것도 주지 않는다.
  -- survey_member_ok 하나가 명부 검사·스로틀·빗나감 계수를 함께 한다.
  if v_roster > 0 and not public.survey_member_ok(p_zone, p_name) then
    return;
  end if;

  -- 열을 c. 로 못박는다. returns table 의 option_id 와 이름이 같아
  -- 못박지 않으면 plpgsql 이 어느 쪽인지 모른다.
  return query
    select c.option_id
      from public.survey_responses r
      join public.survey_choices c on c.response_id = r.id
     where r.survey_id = p_survey
       and r.respondent_key = public.survey_anon_key(p_survey, p_zone, p_name);
end;
$$;

comment on function public.survey_my_choices(uuid, text, text) is
  '본인이 고른 것. 명부 관문과 두드림 계수를 지난 뒤에만 답한다.';

-- ── 확인 ────────────────────────────────────────────────────

-- 기대: plpgsql · volatile(v) · definer(t)
-- volatile 이어야 한다. stable 이면 PostgREST 가 거래를 READ ONLY 로 열어
-- 안에서 두드림을 적지 못하고 25006 으로 터진다.
select l.lanname as 언어, p.provolatile as 휘발성, p.prosecdef as 정의자권한
  from pg_proc p
  join pg_language l on l.oid = p.prolang
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'survey_my_choices';

-- 기대: true — 권한은 create or replace 를 지나도 남아 있어야 한다
select has_function_privilege('anon',
  'public.survey_my_choices(uuid, text, text)', 'EXECUTE') as anon_이_부를_수_있나;
