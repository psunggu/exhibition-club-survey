-- 202608190001a — 큐레이션 컬럼 9개
--
-- **한 번에 하나씩 실행한다.** Supabase SQL Editor 는 스크립트 전체를 한
-- 트랜잭션으로 묶는다. 그래서 앞선 시도에서는 뒤쪽 한 문장이 실패하면서
-- 앞의 alter 9개까지 통째로 되돌아갔고, 매번 아무것도 남지 않았다.
-- 파일을 나눈 이유가 그것이다 — 실패하면 **어느 단계인지 바로 드러난다.**
--
-- 전부 nullable 이라 기존 행과 기존 화면은 그대로 돈다.
-- if not exists 라 여러 번 돌려도 된다.

alter table public.events add column if not exists recommended_rank integer;
alter table public.events add column if not exists verified boolean;
alter table public.events add column if not exists discount text;
alter table public.events add column if not exists parking_fee text;
alter table public.events add column if not exists docent text;
alter table public.events add column if not exists docent_time text;
alter table public.events add column if not exists source_label text;
alter table public.events add column if not exists verification_note text;
alter table public.events add column if not exists main_url text;

comment on column public.events.recommended_rank  is '운영진이 매긴 추천 순서. 낮을수록 위';
comment on column public.events.verified          is '공식 출처에서 확인했는가';
comment on column public.events.source_label      is '무엇을 보고 확인했는지';
comment on column public.events.verification_note is '확인한 항목 — 관람료 · 기간 · 장소 등';

-- 확인 (기대: 9)
select count(*) as 새_컬럼
from information_schema.columns
where table_schema = 'public' and table_name = 'events'
  and column_name in ('recommended_rank', 'verified', 'discount', 'parking_fee', 'docent', 'docent_time', 'source_label', 'verification_note', 'main_url');
