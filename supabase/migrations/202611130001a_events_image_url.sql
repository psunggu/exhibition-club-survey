-- 보드 순위 줄의 포스터(2026-11-13). 공식 페이지의 대표 이미지 주소를 그대로 적는다 — 복사해 두지 않는다.
-- AGENTS.md 「DB」: public.events 에는 nullable 컬럼만 더한다. 권한 · 정책은 바꾸지 않는다
-- (events 는 표 단위로 anon · authenticated 에 select 만 — 새 열도 그대로 읽힌다).
-- 화면은 select=* 라 이 열이 생기기 전에도 돈다(image_url 이 없으면 포스터 칸을 비운다).
alter table public.events add column if not exists image_url text;
