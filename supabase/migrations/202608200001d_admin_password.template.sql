-- 202608200001d — 운영자 암호 (틀)
--
-- ⚠️ **이 파일을 그대로 실행하지 않는다.** 아래 자리표시자를 실제 암호로 바꾼 뒤
--    Supabase SQL Editor 에 붙여넣어 실행하고, **저장하지 않는다.**
--
-- 이 저장소는 공개다. 암호 원문이 커밋되면 그 순간 의미가 없어진다.
-- 그래서 이 파일에는 자리표시자만 두고, 실제 암호는 어디에도 적지 않는다.
-- (scripts/validate-repository-hygiene.mjs 가 자리표시자가 바뀐 채 커밋되면 잡는다.)
--
-- 표에는 bcrypt 해시만 들어간다. 해시에서 암호를 되돌릴 수 없고,
-- 대조는 public.survey_admin_ok() 안에서만 일어난다.
--
-- ── 정하실 것 ───────────────────────────────────────────────
-- 박지현·박성규 두 분이 **같은 암호 하나**를 나눠 씁니다.
-- 단톡방에 적지 마시고 두 분이 따로 주고받으세요.
-- 바꾸고 싶으면 이 파일을 다시 한 번 돌리면 덮어씁니다.

insert into public.survey_admins (name, password_hash)
values
  ('박지현', crypt('여기에_암호를_적는다', gen_salt('bf'))),
  ('박성규', crypt('여기에_암호를_적는다', gen_salt('bf')))
on conflict (name) do update set password_hash = excluded.password_hash;

-- 확인 (기대: true)
-- 방금 정한 암호를 넣어 맞는지 본다. 확인했으면 이 줄도 지우고 나간다.
select public.survey_admin_ok('여기에_암호를_적는다') as 암호_맞음;
