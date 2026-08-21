-- 202608200001c — 9월 정기 관람 전시 추천 설문
--
-- a · b 를 먼저 실행한 뒤 이것을 실행한다.
-- 아이디를 고정해 두었으므로 **여러 번 돌려도 같은 설문 하나**다.
--
-- ── 넣기 전에 확인한 것 ────────────────────────────────────
-- 링크는 전부 실제로 열어 봤다 (2026-08-20).
--   booking.mmca.go.kr/…/548           200
--   kko.to/_RB0zDH0kK                  200
--   mobileticket.interpark.com/…       200
--   youtube.com/watch?v=8IvgzYaKexE    200
--   mmca.go.kr/…?exhFlag=1             500  ← 넣지 않았다 (아래 3번 참고)

insert into public.surveys
  (id, title, intro, multi_choice, opens_at, closes_at, created_by,
   results_visible, show_names, hide_after_days)
values (
  '5e97b1a0-0000-4000-8000-000000000901',
  '9월 정기 관람 전시 추천',
  '아래 후보 가운데 함께 보고 싶은 전시를 골라 주세요. 여러 개 고르셔도 됩니다. '
  || '추천을 모은 뒤 투표로 최종 선정할 예정입니다.',
  true,
  timestamptz '2026-08-20 09:00:00+09',
  -- **운영자가 예정보다 일찍 닫았다 (2026-08-21 03:50).**
  -- 마감은 두 번 옮겨졌다: 처음 8/21 08시 → 응답이 적어 같은 날 17시로 늘림
  -- → 그래도 2건에서 멈춰 더 기다리지 않고 닫음.
  -- 지난 시각으로 두면 화면이 투표받는 자리에서 결과 자리로 바뀐다(저녁식사 설문과 같은 방식).
  --
  -- 응답 2건으로 9월 전시를 정하기는 어렵다. 톡방에서 따로 정하거나 다시 받아야 하는데,
  -- 그 판단은 이 파일이 아니라 운영진이 한다.
  timestamptz '2026-08-21 03:50:00+09',
  '박지현',
  'always',      -- 응답하면 바로 집계가 보인다
  'none',        -- 이름은 어디에도 안 나온다
  null           -- 마감 뒤에도 결과가 남는다
)
on conflict (id) do update set
  title = excluded.title, intro = excluded.intro,
  multi_choice = excluded.multi_choice,
  opens_at = excluded.opens_at, closes_at = excluded.closes_at,
  results_visible = excluded.results_visible,
  show_names = excluded.show_names,
  hide_after_days = excluded.hide_after_days,
  updated_at = now();

-- ── 후보 1 · 서도호 개인전 ─────────────────────────────────
insert into public.survey_options
  (id, survey_id, position, title, period, venue, hours, price, note, links)
values (
  '5e97b1a0-0000-4000-8000-000000000911',
  '5e97b1a0-0000-4000-8000-000000000901',
  1,
  '《서도호》',
  '2026. 8. 27. ~ 2027. 2. 9.',
  '국립현대미술관 서울',
  null,
  '8,000원 / 얼리버드 6,400원 (20% 할인)',
  '단체 관람 예약이 쉽지 않은 전시입니다. 1시간 단위 한정수량이고 예매 건당 최대 4매, '
  || '매주 월요일 18시에 일주일 단위로 열리며 조기 매진될 수 있습니다. '
  || E'\n얼리버드 — 예매 8/17 18:00~8/26 23:50 · 관람 8/27~9/13'
  || E'\n무료 관람 — 매월 마지막 수요일 문화가 있는 날, 수·토 야간개장 18시·19시 회차, '
  || '대한민국 미술축제 9/1~9/6, 추석연휴 일부'
  || E'\n휴관 — 9/8, 9/25, 12/1',
  '[
    {"kind": "official", "label": "예매 페이지", "url": "https://booking.mmca.go.kr/product/ko/performance/548"},
    {"kind": "video",    "label": "참고 영상 · 9월 전시 3대장 (서도호·구정아·솔 르윗)", "url": "https://www.youtube.com/watch?v=8IvgzYaKexE"}
  ]'::jsonb
)
on conflict (id) do update set
  title = excluded.title, period = excluded.period, venue = excluded.venue,
  hours = excluded.hours, price = excluded.price, note = excluded.note,
  links = excluded.links;

-- ── 후보 2 · 에스 데블린 ───────────────────────────────────
insert into public.survey_options
  (id, survey_id, position, title, period, venue, hours, price, note, links)
values (
  '5e97b1a0-0000-4000-8000-000000000912',
  '5e97b1a0-0000-4000-8000-000000000901',
  2,
  '《세 번째 시: 에스 데블린, 다시 집으로》',
  '2026. 8. 20. ~ 2027. 1. 17.',
  '푸투라서울 · 종로구 북촌로 61',
  -- **토요일 시간을 고쳤다 (2026-08-22).** 09:30~20:00 이라 적혀 있었는데,
  -- 우리 보드의 같은 전시 줄(202608190001b_rows.sql)은 토 10:00-19:00 이고
  -- 그쪽이 푸투라서울 공식 상세를 보고 적은 값이다. 운영자가 10:00~19:00 이 맞다고 확인했다.
  -- 한 사이트 안에서 같은 전시의 여는 시간이 두 가지면, 보고 간 사람이 헛걸음한다.
  '화~금·일 10:00~18:00 / 토 10:00~19:00 / 월 휴무',
  '22,000원',
  null,
  '[
    {"kind": "official", "label": "전시 정보", "url": "https://kko.to/_RB0zDH0kK"}
  ]'::jsonb
)
on conflict (id) do update set
  title = excluded.title, period = excluded.period, venue = excluded.venue,
  hours = excluded.hours, price = excluded.price, note = excluded.note,
  links = excluded.links;

-- ── 후보 3 · 이대원 ────────────────────────────────────────
-- **공식 링크를 비워 두었다.** 받은 주소
-- https://www.mmca.go.kr/exhibitions/exhibitionsDetail.do?exhFlag=1 는 500 을 낸다.
-- MMCA 상세 페이지는 exhId 가 있어야 전시가 특정된다 — exhFlag 만으로는 안 된다.
-- 정확한 주소를 알려 주시면 links 에 넣는다. 그때까지 없는 링크를 두지 않는다.
insert into public.survey_options
  (id, survey_id, position, title, period, venue, hours, price, note, links)
values (
  '5e97b1a0-0000-4000-8000-000000000913',
  '5e97b1a0-0000-4000-8000-000000000901',
  3,
  '《이대원: 당신을 슬프게 하는 것은 하나도 없다》',
  '2026. 8. 6. ~ 11. 8.',
  '국립현대미술관 덕수궁관 1~4전시실',
  null,
  '2,000원 + 덕수궁 입장료 1,000원',
  null,
  '[]'::jsonb
)
on conflict (id) do update set
  title = excluded.title, period = excluded.period, venue = excluded.venue,
  hours = excluded.hours, price = excluded.price, note = excluded.note,
  links = excluded.links;

-- ── 후보 4 였던 것 · 스페인 미술 500년 — **뺐다** ─────────────
--
-- 2026-08-22 에 운영자가 후보에서 뺐다. 이유는 날짜다.
--   · 2026-09-22 개막이라 9월에 볼 수 있는 날이 9/22~9/30 뿐이다
--   · 그 사이 토요일은 9/26 하나인데 바로 앞 9/25 가 추석이다
--   · 우리 보드도 이 전시 관람 예정일을 2026-10-17 로 잡아 두었다 — 사실상 10월 후보다
--
-- **하나만 고르는 설문으로 바꾸면서 더 중요해졌다.** 여러 개 고를 때는 그냥 한 표였지만,
-- 하나만 고르면 이 전시를 고른 사람은 다른 것을 못 고른다.
-- 9월에 가기 어려운 후보에 표가 몰리면 정작 갈 수 있는 전시가 밀린다.
--
-- 10월 설문을 열 때 다시 쓰려고 값은 지우지 않고 주석으로 남긴다.
-- 되살리려면 아래를 풀고 position 을 새로 정하면 된다.
--
-- insert into public.survey_options
--   (id, survey_id, position, title, period, venue, hours, price, note, links)
-- values (
--   '5e97b1a0-0000-4000-8000-000000000914',
--   '5e97b1a0-0000-4000-8000-000000000901',
--   4,
--   '《스페인 미술 500년: 빛과 어둠의 연대기》',
--   '2026. 9. 22. ~ 2027. 1. 20.',
--   '예술의전당 한가람디자인미술관',
--   '화~일 10:00~19:00 / 월 휴관',
--   '23,000원 / 얼리버드 14,000원',
--   '얼리버드 — 예매 8/4~8/31 · 관람 9/22~11/29',
--   '[{"kind": "official", "label": "예매 페이지",
--      "url": "https://mobileticket.interpark.com/goods/26010709"}]'::jsonb
-- );
--
-- 이미 넣었던 것을 지운다. 여러 번 돌려도 안전하다.
delete from public.survey_options
 where id = '5e97b1a0-0000-4000-8000-000000000914';

-- 확인 (기대: 설문 1 · 후보 4 · 링크 4)
select
  (select count(*) from public.surveys where id = '5e97b1a0-0000-4000-8000-000000000901') as 설문,
  (select count(*) from public.survey_options
    where survey_id = '5e97b1a0-0000-4000-8000-000000000901') as 후보,
  (select sum(jsonb_array_length(links)) from public.survey_options
    where survey_id = '5e97b1a0-0000-4000-8000-000000000901') as 링크;
