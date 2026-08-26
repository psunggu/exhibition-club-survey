-- 202608270001b — 옮겨 온 투표에 투표자 이름을 넣는 **틀**
--
-- ⚠️ **이 파일을 그대로 실행하지 않는다.** 아래 자리표시자를 실제 값으로 바꾼 뒤
--    Supabase SQL Editor 에 붙여넣어 실행하고, **저장하지 않는다.**
--
-- 이 저장소는 공개다. 실명이 한 번 커밋되면 지워도 히스토리에 남는다.
-- 그래서 이 파일에는 **가상 회원 이름**(docs/fixtures/sample-members.json)만 두고,
-- 진짜 이름은 어디에도 적지 않는다. 운영자 암호(202608200001d)와 같은 방식이다.
--
-- scripts/validate-repository-hygiene.mjs 가 추적되는 파일의 imported_voters 에
-- 가상 명부 밖의 이름이 있으면 잡는다. 실수로 커밋해도 CI 가 막는다.
--
-- 아래 후보 id 는 전부 0 이라 **그대로 실행하면 0줄이 바뀐다.** 아무 일도 일어나지 않는다.
--
-- ── 순서 ───────────────────────────────────────────────────
-- 1. 아래 ① 을 먼저 돌려 후보 id 와 표 수를 받는다
-- 2. 톡방 투표에서 항목을 펼쳐 이름을 확인한다 (톡방 화면 글자 그대로)
-- 3. ② 로 「이름 보임」 스위치를 켠다
-- 4. ③ 의 자리표시자를 채워 한 번에 실행한다
-- 5. ④ 로 개수가 맞는지 확인한다
--
-- **이 파일에는 이름을 적지 않는다.** 머리말에 「옮긴 원본을 글자 그대로 적는다」 는
-- 이 저장소의 관례가 있지만, 그 관례는 **후보 이름**에 대한 것이다.
-- 사람 이름은 주석에도 적지 않는다 — 주석도 똑같이 커밋된다.

-- ── ① 후보 id 와 표 수를 받는다 ────────────────────────────
-- 아래 0 자리에 설문 id 를 넣는다.
--   9월 관람일정 투표 = 5e97b1a0-0000-4000-8000-000000000904
select o.id, o.position, o.title, o.imported_votes as 표
  from public.survey_options o
 where o.survey_id = '00000000-0000-0000-0000-000000000000'
 order by o.position;

-- ── ② 「이름 보임」 스위치를 켠다 ───────────────────────────
-- 이걸 먼저 켜지 않으면 ③ 이 거절당한다 (survey_options_voters_gate).
-- 일부러 그렇게 만들었다 — DB 에 이름이 있다는 것은 곧
-- 「운영자가 보이기로 정했다」 여야 하기 때문이다.
update public.surveys
   set show_names = 'participants'
 where id = '00000000-0000-0000-0000-000000000000';

-- ── ③ 이름을 넣는다 ────────────────────────────────────────
-- **표를 받은 후보는 하나도 빠뜨리지 않는다.** 일부만 채우면 화면이
-- 이름을 아예 안 보여 준다 (반만 보여 주면 나머지가 0표처럼 읽히기 때문이다).
-- 0표 후보는 array[]::text[] 로 두거나 아예 빼도 된다.
--
-- 이름은 **톡방 화면에 적힌 그대로** 적는다. 구역번호를 붙이지도, 떼지도 않는다.
-- 개수가 표 수와 다르면 DB 가 거절한다 (survey_options_voters_match).
update public.survey_options as o
   set imported_voters = v.names
  from (values
    -- (후보 id, 이름들)  ← ① 에서 받은 id 로 바꾸고, 이름을 채운다
    ('00000000-0000-0000-0000-000000000001'::uuid, array['김하늘']),
    ('00000000-0000-0000-0000-000000000002'::uuid, array['박서준', '이가온']),
    ('00000000-0000-0000-0000-000000000003'::uuid, array['최윤슬', '정다인', '한도윤'])
  ) as v(option_id, names)
 where o.id = v.option_id;

-- ── ④ 확인 ─────────────────────────────────────────────────
-- 기대: 스위치 participants · 어긋난_줄 0 · 표를받고_이름없는_후보 0
-- 마지막이 0 이 아니면 화면은 이름을 **아예 안 보여 준다.** 빠뜨린 후보를 마저 채운다.
-- (반만 보여 주면 이름 없는 줄이 「아무도 안 골랐다」 로 읽히는데 그 줄에도 표가 있다.)
select
  (select show_names from public.surveys
    where id = '00000000-0000-0000-0000-000000000000') as 스위치,
  count(*) filter (
    where imported_voters is not null
      and cardinality(imported_voters) is distinct from imported_votes
  ) as 어긋난_줄,
  count(*) filter (
    where coalesce(imported_votes, 0) > 0 and imported_voters is null
  ) as 표를받고_이름없는_후보
  from public.survey_options
 where survey_id = '00000000-0000-0000-0000-000000000000';
