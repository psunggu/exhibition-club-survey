-- 202608300003a — 보드에 「소식」 한 줄을 세운다
--
-- 문화예술 소식 영상·기사 하나를 보드 목록 머리글 아래에 건다.
-- 화면은 Board.tsx 의 NewsLine 이 그리고, `type = '소식'` 인 행 중
-- 기간이 안 지난 첫 하나만 뜬다.
--
-- ── 왜 새 표가 아니라 events 인가 ──────────────────────────
-- 소식을 따로 두면 같은 행사가 전시 카드와 소식 줄 두 곳에 생긴다.
-- app/src/lib/events.ts 머리말이 하드코딩 배열을 걷어낸 이유가 그것이다 —
-- "두 곳에 데이터가 있으면 반드시 어긋난다". 컬럼도 새로 만들지 않는다.
--
-- ── 왜 end_date 를 거는가 ─────────────────────────────────
-- 갈아 끼우는 것을 잊었을 때 **아무 일도 안 일어나야** 한다.
-- isCurrent() 가 end_date < 오늘 인 행을 이미 내리므로, 잊으면 카드가
-- 사라질 뿐 3주 전 소식이 상단에 박혀 있지 않는다.
--
-- ── 화면이 각 칸을 어떻게 읽는가 ───────────────────────────
--   genre    갈래 칩       「영상 · 유튜브」
--   title    제목 한 줄
--   venue    출처          채널 이름
--   summary  덧붙이는 한 줄
--   main_url 나가는 링크   (info_url 은 비워 둔다 — main_url 이 먼저다)
--
-- 제목은 원본에서 앞머리 호객 문구와 이모지를 뺐다. 교구 공지 문체에 맞춘다.
-- 인용한 제목·채널명은 저작권·유튜브 약관 모두 문제없다.
-- **유튜브 썸네일은 쓰지 않는다** — 자체 호스팅은 약관이 금하고,
-- i.ytimg.com 직접 참조는 CSP 의 `img-src 'self' data:` 에 막힌다.
--
-- 제목 기준이라 여러 번 실행해도 중복되지 않는다.

begin;

-- 이미 걸려 있는 소식은 내린다. 한 번에 하나만 뜨는 자리다.
update public.events
set end_date = current_date - 1,
    updated_at = now()
where type = '소식'
  and (end_date is null or end_date >= current_date)
  and title <> '스케일 미쳐버린 전국구급 미술축제가 열립니다';

insert into public.events (
  status, region, type, title, genre,
  start_date, end_date, venue,
  price, price_type, parking,
  summary, main_url, source_label, verified, verification_note, updated_at
)
select
  '공유완료',
  '서울 전체',
  '소식',
  '스케일 미쳐버린 전국구급 미술축제가 열립니다',
  '영상 · 유튜브',
  date '2026-08-30',
  -- 키아프 9/2~6 중 가장 늦게 끝나는 날. 이 날이 지나면 줄이 사라진다.
  date '2026-09-06',
  '널 위한 문화예술',
  0,
  '무료',
  '해당 없음',
  '키아프 · 프리즈 서울 9/2~6 코엑스',
  'https://www.youtube.com/watch?v=BhCLyg-KtL4',
  '유튜브 공식 oEmbed · 2026 대한민국 미술축제 공식 사이트',
  true,
  '영상 제목·채널명은 유튜브 공식 oEmbed 로 확인. 키아프 서울 9월 2~6일·'
    || '프리즈 서울 9월 2~5일 코엑스 일정은 2026-08-30 확인',
  now()
where not exists (
  select 1 from public.events
  where title = '스케일 미쳐버린 전국구급 미술축제가 열립니다'
);

commit;

-- 확인 (기대: 1)
select count(*) as 소식_행
from public.events
where type = '소식'
  and (end_date is null or end_date >= current_date);
