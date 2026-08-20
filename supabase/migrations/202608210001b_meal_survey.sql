-- 202608210001b — 서울역사박물관 단체 저녁식사 추천 (이미 끝난 투표)
--
-- 202608210001a 를 먼저 실행한 뒤 이것을 실행한다.
--
-- ── 이 설문은 여기서 받은 것이 아니다 ──────────────────────
-- 톡방 톡게시판 투표로 이미 끝난 것을 **결과만 옮겨 온다.**
-- 그래서 응답자 표는 비어 있고, 후보마다 `imported_votes` 로 표 수만 담는다.
-- 없는 사람 13명을 지어내지 않는다 — 운영자 화면의 "누가 골랐는지" 도 비어 있다.
--
--   투표 제목   저녁식사 장소 투표 (복수 투표 2곳 가능)
--   참여        13명 전원 · 표 합계 25 (한 사람이 최대 2곳)
--   마감        예정은 8/21 08:00 이었으나 전원이 투표해 일찍 끝냄
--   정리 세션   cse_01Cbv5oRdovdGht3pNRECacH
--
-- 아이디를 고정해 두었으므로 여러 번 돌려도 같은 설문 하나다.

insert into public.surveys
  (id, title, intro, multi_choice, opens_at, closes_at, created_by,
   results_visible, show_names, hide_after_days,
   category, source_note, imported_respondents)
values (
  '5e97b1a0-0000-4000-8000-000000000902',
  '서울역사박물관 단체 저녁식사 추천',
  '8월 22일 서울역사박물관 관람 뒤 단체 저녁식사 장소를 정하기 위한 투표였습니다. '
  || '한 사람이 두 곳까지 고를 수 있었고, 13명 전원이 참여해 마감했습니다.',
  true,
  timestamptz '2026-08-18 09:00:00+09',
  -- 예정된 마감은 8/21 08:00 이었지만 **13명이 모두 투표해 일찍 끝났다.**
  -- 그래서 지난 시각으로 두어 화면이 결과만 보여 주게 한다.
  --
  -- 어차피 이 설문은 아래 imported_respondents 때문에 여기서 응답을 받지 않는다 —
  -- 옮겨 온 숫자가 집계를 덮어써서, 여기서 받은 표는 어디에도 안 나타나기 때문이다.
  timestamptz '2026-08-21 01:00:00+09',
  '박지현',
  'always',   -- 끝난 투표라 결과를 바로 보여 준다
  'none',     -- 옮겨 온 숫자뿐이라 보여 줄 이름 자체가 없다
  null,
  'meal',
  '카카오톡 톡게시판 투표 결과를 옮겨 옴 · 정리 세션 cse_01Cbv5oRdovdGht3pNRECacH',
  13
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

-- ── 후보 13곳 ──────────────────────────────────────────────
-- 표를 많이 받은 순이 아니라 **투표 화면에 있던 순서 그대로** 둔다.
-- 순서를 바꾸면 원래 투표와 대조하기 어려워진다.
insert into public.survey_options (id, survey_id, position, title, imported_votes)
values
  ('5e97b1a0-0000-4000-8000-000000000921', '5e97b1a0-0000-4000-8000-000000000902',  1, '우슴',                    6),
  ('5e97b1a0-0000-4000-8000-000000000922', '5e97b1a0-0000-4000-8000-000000000902',  2, '이화전통육개장',           1),
  ('5e97b1a0-0000-4000-8000-000000000923', '5e97b1a0-0000-4000-8000-000000000902',  3, '탄백',                    3),
  ('5e97b1a0-0000-4000-8000-000000000924', '5e97b1a0-0000-4000-8000-000000000902',  4, '신의주찹쌀순대 광화문점',   0),
  ('5e97b1a0-0000-4000-8000-000000000925', '5e97b1a0-0000-4000-8000-000000000902',  5, '광화문국밥',              0),
  ('5e97b1a0-0000-4000-8000-000000000926', '5e97b1a0-0000-4000-8000-000000000902',  6, '멘츠루 시청점',           0),
  ('5e97b1a0-0000-4000-8000-000000000927', '5e97b1a0-0000-4000-8000-000000000902',  7, '사발',                    8),
  ('5e97b1a0-0000-4000-8000-000000000928', '5e97b1a0-0000-4000-8000-000000000902',  8, '올리페페 광화문점',        6),
  ('5e97b1a0-0000-4000-8000-000000000929', '5e97b1a0-0000-4000-8000-000000000902',  9, '광화문 난포',             0),
  ('5e97b1a0-0000-4000-8000-00000000092a', '5e97b1a0-0000-4000-8000-000000000902', 10, '광화문 미진',             0),
  ('5e97b1a0-0000-4000-8000-00000000092b', '5e97b1a0-0000-4000-8000-000000000902', 11, '진주회관',                0),
  ('5e97b1a0-0000-4000-8000-00000000092c', '5e97b1a0-0000-4000-8000-000000000902', 12, '중앙해장 광화문점',        1),
  ('5e97b1a0-0000-4000-8000-00000000092d', '5e97b1a0-0000-4000-8000-000000000902', 13, '애슐리퀸즈 종각점',        0)
on conflict (id) do update set
  position = excluded.position,
  title = excluded.title,
  imported_votes = excluded.imported_votes;

-- 확인 (기대: 후보 13 · 표 합계 25 · 참여 13)
select
  (select count(*) from public.survey_options
    where survey_id = '5e97b1a0-0000-4000-8000-000000000902') as 후보,
  (select sum(imported_votes) from public.survey_options
    where survey_id = '5e97b1a0-0000-4000-8000-000000000902') as 표_합계,
  public.survey_response_count('5e97b1a0-0000-4000-8000-000000000902') as 참여;
