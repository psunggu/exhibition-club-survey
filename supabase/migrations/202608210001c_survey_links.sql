-- 202608210001c — 설문에 참고 문서를 붙일 수 있게 한다
--
-- 202608210001b 를 먼저 실행한 뒤 이것을 실행한다. 여러 번 돌려도 결과가 같다.
--
-- ── 왜 필요한가 ────────────────────────────────────────────
-- 지금은 링크를 **후보마다** 붙일 수 있다 (survey_options.links).
-- 그런데 후보 열세 곳을 한꺼번에 다루는 문서 — 식당 검토 문서 같은 것 — 는
-- 어느 한 후보에 붙일 수가 없다. 붙이면 나머지 열두 곳에서는 안 보인다.
--
-- 그래서 설문 자체에 붙이는 자리를 만든다. 후보 링크와 모양이 같다:
--   [{"kind":"article","label":"저녁식사 장소 검토","url":"…"}]
--   kind 는 화면에서 아이콘을 고르는 데 쓴다 — official · video · article · map.
--
-- 앞으로 다른 설문에도 쓸 수 있다. 그래서 식사 설문에만 값을 넣는 것이 아니라
-- 열(column)을 만들어 둔다.

alter table public.surveys
  add column if not exists links jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'surveys_links_is_array'
  ) then
    alter table public.surveys
      add constraint surveys_links_is_array check (jsonb_typeof(links) = 'array');
  end if;
end $$;

comment on column public.surveys.links is
  '설문 전체에 걸리는 참고 문서. 후보 하나에 붙일 수 없는 것을 여기에 둔다.';

-- ── 식사 설문에 검토 문서를 붙인다 ─────────────────────────
-- 이 문서는 운영진이 만든 것을 사이트에 옮겨 올린 것이다.
-- 원본은 8/20 23:00 집계라 사발 7표 · 중앙해장 2표인데, 올릴 때
-- **최종 집계(8표 · 1표)로 고치고** 저녁이 자율이라는 것을 맨 위에 밝혀 두었다.
-- 고친 내용은 문서 첫 화면에 그대로 적혀 있다.
update public.surveys set
  links = '[{"kind":"article","label":"식당 13곳 검토 문서 (운영진용)","url":"https://psunggu.github.io/exhibition-club-survey/meal-review.html"}]'::jsonb
where id = '5e97b1a0-0000-4000-8000-000000000902';

-- ── 확인 (기대: 식사 설문 1건에 링크 1개) ──────────────────
select title,
       jsonb_array_length(links) as 링크_수,
       links -> 0 ->> 'label'    as 첫_링크
from public.surveys
where jsonb_array_length(links) > 0;
