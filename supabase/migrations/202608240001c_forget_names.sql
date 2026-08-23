-- 202608240001c — 옛 응답에 남아 있던 이름을 지운다
--
-- 운영자 요청 (2026-08-24). **되돌릴 수 없다.**
--
-- 202608240001a 에서 익명 투표로 바꾸면서, 앞으로 받는 응답에는 이름을 안 남기게 했다.
-- 그때 이미 저장된 응답은 일부러 안 건드렸다 — 그때는 이름을 적는 설문이었고,
-- 지우는 것은 되돌릴 수 없기 때문이다. 이제 그것까지 지운다.
--
-- ── 무엇이 없어지나 ────────────────────────────────────────
-- survey_responses 의 zone · display_name 이 '' 와 '익명' 이 된다.
-- **누가 응답했는지 다시는 알 수 없다.** 운영자 화면의 응답자 목록도 「익명」 만 남는다.
--
-- ── 무엇이 남나 ────────────────────────────────────────────
-- 표는 그대로다. 몇 명이 참여했는지, 무엇이 몇 표를 받았는지는 하나도 안 변한다.
-- 열쇠도 **새 함수가 만드는 것과 똑같은 값**으로 바꾼다
--   옛 열쇠 = survey_respondent_key(zone, name)
--   새 열쇠 = md5('anon|' || survey_id || '|' || 옛 열쇠) = survey_anon_key(...)
-- 그래서 그 설문이 다시 열리더라도 같은 사람은 자기 응답을 그대로 찾는다 —
-- 한 사람이 두 표가 되는 일이 없다.
--
-- ── 먼저 보고 나서 지운다 ──────────────────────────────────
-- 아래 select 를 먼저 돌려서 **몇 줄이 바뀌는지** 확인한 뒤 update 를 돌린다.
-- 이름은 찍지 않는다. 지우려고 여는 창에서 이름을 늘어놓을 이유가 없다.

-- ① 먼저 이것만 돌린다 — 무엇이 바뀔지 본다 (아무것도 안 바꾼다)
select s.title                                as 설문,
       count(*)                               as 바뀔_줄,
       count(*) filter (where r.display_name = '익명') as 이미_익명,
       min(r.created_at)                      as 가장_오래된,
       max(r.created_at)                      as 가장_최근
  from public.survey_responses r
  join public.surveys s on s.id = r.survey_id
 group by s.title
 order by s.title;

-- ② 위를 보고 괜찮으면 이것을 돌린다. **되돌릴 수 없다.**
--    `where` 가 있어서 여러 번 돌려도 안전하다 — 이미 지운 줄은 다시 안 건드린다.
update public.survey_responses
   set respondent_key = md5('anon|' || survey_id::text || '|' || respondent_key),
       zone = '',
       display_name = '익명'
 where display_name <> '익명';

-- ③ 확인 — 기대: 이름 남은 줄 0
select count(*) filter (where display_name <> '익명') as 이름_남은_줄,
       count(*)                                      as 전체_응답,
       count(*) filter (where zone <> '')            as 구역번호_남은_줄
  from public.survey_responses;
