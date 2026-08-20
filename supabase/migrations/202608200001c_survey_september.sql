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
  -- 8/21(금) 17시. 요일이 맞고, 다음 날 서울역사박물관 정기관람(8/22 15:00~17:30)과도
  -- 겹치지 않는다. 원래 8/21 08시였는데 응답이 적어 같은 날 오후로 늘렸다.
  timestamptz '2026-08-21 17:00:00+09',
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
  '서도호 개인전',
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
  '화~금·일 10:00~18:00 / 토 09:30~20:00 / 월 휴무',
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

-- ── 후보 4 · 스페인 미술 500년 ─────────────────────────────
insert into public.survey_options
  (id, survey_id, position, title, period, venue, hours, price, note, links)
values (
  '5e97b1a0-0000-4000-8000-000000000914',
  '5e97b1a0-0000-4000-8000-000000000901',
  4,
  '《스페인 미술 500년: 빛과 어둠의 연대기》',
  '2026. 9. 22. ~ 2027. 1. 20.',
  '예술의전당 한가람디자인미술관',
  '화~일 10:00~19:00 / 월 휴관',
  '23,000원 / 얼리버드 14,000원',
  '얼리버드 — 예매 8/4~8/31 · 관람 9/22~11/29',
  '[
    {"kind": "official", "label": "예매 페이지", "url": "https://mobileticket.interpark.com/goods/26010709"}
  ]'::jsonb
)
on conflict (id) do update set
  title = excluded.title, period = excluded.period, venue = excluded.venue,
  hours = excluded.hours, price = excluded.price, note = excluded.note,
  links = excluded.links;

-- 확인 (기대: 설문 1 · 후보 4 · 링크 4)
select
  (select count(*) from public.surveys where id = '5e97b1a0-0000-4000-8000-000000000901') as 설문,
  (select count(*) from public.survey_options
    where survey_id = '5e97b1a0-0000-4000-8000-000000000901') as 후보,
  (select sum(jsonb_array_length(links)) from public.survey_options
    where survey_id = '5e97b1a0-0000-4000-8000-000000000901') as 링크;
