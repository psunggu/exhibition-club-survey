-- 202608240001b — 톡방에서 진행한 9월 정기관람 전시회 투표 결과
--
-- 2026-08-24 에 운영자가 톡방 투표 화면을 그대로 옮겨 달라고 했다.
--
-- ── 옮긴 원본 (카카오톡 톡게시판) ──────────────────────────
--   올린 사람   4111 (운영진)
--   올린 때     8월 22일 오전 6:33 · 공지 · 15명 읽음
--   끝난 때     8월 23일 오전 12:00
--   제목        9월 정기관람 전시회 투표(최대 3개까지 선택 가능)
--   방식        복수선택 · 익명투표
--   참여        11명
--
--   서도호 개인전                    7명
--   구정아 : 우스모스                2명
--   솔르윗 :open structure           4명
--   에스 데블린 : 다시 집으로         4명
--   스페인 미술 500년                5명
--   이대원 : 당신을 슬프게 하는 것은~ 1명
--   조은: 오늘의 정원                5명
--                                  합 28표 (11명 × 최대 3 = 33 이하라 앞뒤가 맞는다)
--
-- ── 글자를 손대지 않는다 ───────────────────────────────────
-- 항목 이름을 **투표 화면 글자 그대로** 적는다. 띄어쓰기가 제각각이지만
-- (`구정아 : ` · `솔르윗 :` · `조은: `) 그대로 둔다.
-- 식사 설문 때 「보기 좋으라고」 띄어쓰기를 손댔다가, 나중에 원본과 한 줄씩
-- 맞춰 보기 전까지 아무도 못 알아챈 어긋남이 생겼다. 같은 실수를 안 한다.
--
-- 우리 사이트 후보와 이름이 다른 것도 그대로 둔다 —
-- 예: 사이트는 《세 번째 시: 에스 데블린, 다시 집으로》, 톡방은 「에스 데블린 : 다시 집으로」.
-- 여기는 **톡방에서 무엇을 보고 골랐는지**를 남기는 자리다.

insert into public.surveys
  (id, title, intro, multi_choice, opens_at, closes_at, created_by,
   results_visible, show_names, hide_after_days,
   category, source_note, imported_respondents)
values (
  '5e97b1a0-0000-4000-8000-000000000903',
  '9월 정기관람 전시회 투표 (톡방)',
  '톡방에서 진행한 익명 투표입니다. 한 사람이 세 개까지 고를 수 있었고 11명이 참여했습니다. '
  || '항목 이름은 톡방 투표 화면 글자 그대로 옮겼습니다.',
  true,
  timestamptz '2026-08-22 06:33:00+09',
  timestamptz '2026-08-23 00:00:00+09',
  '박지현',
  'always',   -- 끝난 투표라 결과를 바로 보여 준다
  'none',     -- 익명 투표였다. 보여 줄 이름 자체가 없다
  null,       -- 기록이므로 안 내린다
  'exhibition',
  '카카오톡 톡게시판 투표 결과를 옮겨 옴 · 2026-08-22 06:33 게시 · 2026-08-23 00:00 종료',
  11
)
on conflict (id) do update set
  title = excluded.title, intro = excluded.intro,
  multi_choice = excluded.multi_choice,
  opens_at = excluded.opens_at, closes_at = excluded.closes_at,
  results_visible = excluded.results_visible,
  show_names = excluded.show_names,
  category = excluded.category,
  source_note = excluded.source_note,
  imported_respondents = excluded.imported_respondents,
  updated_at = now();

-- 순서는 **투표 화면에 있던 차례 그대로**. 표를 많이 받은 순으로 바꾸지 않는다 —
-- 바꾸면 나중에 원본과 대조하기 어려워진다.
insert into public.survey_options (id, survey_id, position, title, imported_votes)
values
  ('5e97b1a0-0000-4000-8000-000000000931', '5e97b1a0-0000-4000-8000-000000000903', 1, '서도호 개인전',                    7),
  ('5e97b1a0-0000-4000-8000-000000000932', '5e97b1a0-0000-4000-8000-000000000903', 2, '구정아 : 우스모스',                2),
  ('5e97b1a0-0000-4000-8000-000000000933', '5e97b1a0-0000-4000-8000-000000000903', 3, '솔르윗 :open structure',           4),
  ('5e97b1a0-0000-4000-8000-000000000934', '5e97b1a0-0000-4000-8000-000000000903', 4, '에스 데블린 : 다시 집으로',         4),
  ('5e97b1a0-0000-4000-8000-000000000935', '5e97b1a0-0000-4000-8000-000000000903', 5, '스페인 미술 500년',                5),
  ('5e97b1a0-0000-4000-8000-000000000936', '5e97b1a0-0000-4000-8000-000000000903', 6, '이대원 : 당신을 슬프게 하는 것은~', 1),
  ('5e97b1a0-0000-4000-8000-000000000937', '5e97b1a0-0000-4000-8000-000000000903', 7, '조은: 오늘의 정원',                5)
on conflict (id) do update set
  position = excluded.position,
  title = excluded.title,
  imported_votes = excluded.imported_votes;

-- ── 사이트에서 받던 9월 설문은 닫는다 ──────────────────────
-- 톡방에서 11명이 이미 정했다. 사이트 설문은 1명에서 멈췄고 후보도 달랐다
-- (톡방에는 「조은: 오늘의 정원」 이 있고 「스페인 미술 500년」 도 들어 있었다).
-- 두 곳에서 따로 받으면 어느 쪽이 뜻인지 알 수 없게 된다.
--
-- 지우지 않고 마감만 한다. 무엇을 후보로 올렸고 어떤 안내를 했는지는 남는다.
update public.surveys
   set closes_at = timestamptz '2026-08-24 00:00:00+09',
       updated_at = now()
 where id = '5e97b1a0-0000-4000-8000-000000000901'
   and closes_at > timestamptz '2026-08-24 00:00:00+09';

-- ── 확인 ───────────────────────────────────────────────────
-- 기대: 후보 7 · 표 합 28 · 참여 11 · 9월 설문 마감됨(true)
select
  (select count(*) from public.survey_options
    where survey_id = '5e97b1a0-0000-4000-8000-000000000903') as 후보,
  (select sum(imported_votes) from public.survey_options
    where survey_id = '5e97b1a0-0000-4000-8000-000000000903') as 표합,
  (select imported_respondents from public.surveys
    where id = '5e97b1a0-0000-4000-8000-000000000903') as 참여,
  (select closes_at < now() from public.surveys
    where id = '5e97b1a0-0000-4000-8000-000000000901') as 사이트설문_마감됨;
