# Supabase 공개 사이트 보안 운영

## 보안 경계

브라우저에 포함되는 Supabase anon 키는 공개 가능한 식별자입니다. 데이터 보호는 키 은닉이 아니라 테이블 권한과 RLS 정책으로 보장합니다.

public.events의 공개 역할은 다음 권한만 가져야 합니다.

| 역할 | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| anon | 허용 | 차단 | 차단 | 차단 |
| authenticated | 허용 | 차단 | 차단 | 차단 |

운영진의 등록과 수정 기능은 공개 브라우저에 다시 넣지 않습니다. 향후 필요하면 로그인한 운영자 전용 서버 또는 Supabase Edge Function을 만들고, 별도의 운영자 권한 정책과 승인 절차를 적용합니다. service_role 키는 브라우저 코드, Git 저장소, GitHub Actions 로그에 넣지 않습니다.

## 적용 파일

- 초기 스키마: supabase/schema.sql
- 기존 운영 DB용 마이그레이션: supabase/migrations/202608050001_lock_down_public_events.sql
- 배포 전 검사: scripts/validate-supabase-readonly.mjs

## 운영 DB 적용 순서

1. Supabase SQL Editor에서 현재 정책과 권한 조회 결과를 저장합니다.
2. 202608050001_lock_down_public_events.sql 전체를 한 번만 실행합니다.
3. 공개 역할에 SELECT만 남고 쓰기 정책이 없는지 확인합니다.
4. 공개 사이트에서 목록 조회가 정상인지 확인합니다.
5. 프런트엔드 변경을 배포합니다.

마이그레이션은 트랜잭션 안에서 실행되며, 공개 역할에 쓰기 권한이나 쓰기 정책이 남아 있으면 예외를 발생시켜 전체 변경을 롤백합니다.

## 적용 후 기대 상태

- information_schema.role_table_grants에서 anon과 authenticated에는 SELECT만 표시됩니다.
- pg_policies에서 public.events 정책은 events_select_public 한 개만 표시됩니다.
- 공개 페이지는 목록 조회, 검색, CSV/JSON 내보내기, 공식 링크 열기만 제공합니다.

## 장애 시 대응

공개 목록 조회가 실패하면 먼저 Supabase 상태와 브라우저 네트워크 오류를 확인합니다. 긴급 복구가 필요해도 익명 쓰기 권한은 되살리지 않고 public.events에 대한 SELECT만 anon과 authenticated에 다시 부여합니다.

등록, 수정, 삭제가 필요하면 Supabase Dashboard의 인증된 운영 절차로 처리합니다. 공개 사이트의 익명 쓰기 정책은 롤백 대상으로 사용하지 않습니다.
