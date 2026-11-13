---
name: rank
description: 보드 전시 추천 순위를 다시 매긴다 — 관람평 · 예매 순위 · 공식 조회수로 15개 이내를 고르고, 순위 · 근거 · 포스터 주소를 SQL 로 운영자에게 넘긴다. 주 1회(scout 뒤), 「추천 순위 갱신」 요청에 쓴다.
---

보드 「추천 전시」 는 `recommended_rank` 가 있는 것만, 한 목록에 15개까지 뜬다(AGENTS.md 「보드」). 이 스킬은 **순서만** 정한다 — 전시 정보(기간 · 관람료)는 `/recheck` 몫이다. DB 에 직접 쓰지 않는다.

## 1. 후보

진행 중 · 예정인 `public.events`(공개 API, `type` 이 소식이 아닌 것)에서 뺀다 — 함께 본 전시(`meetups.ts` 의 지난 모임 `eventIds`), 일주일 안에 끝나는 것, 어린이 · 교육 프로그램, 날짜가 정해진 공연형(다원예술 등).

## 2. 지표 — 있는 것만, 지어내지 않는다

- **NOL**: 내장 브라우저에서 사람이 보듯 몇 쪽만 연다 — 전시 주간 순위 `https://nol.yanolja.com/ticket/display/ranking/exhibition?period=W&category=EXHIBITION` 한 쪽과, 보드 후보의 상품 페이지 `nol.yanolja.com/ticket/products/<번호>`(한 주 열 쪽 안팎). 상품 페이지에는 평점 · 리뷰 수 · 「전시/행사 주간 N위」 · 「찜 N명」 이 보인다. 스크립트 · curl 로 긁지 않고, 막히거나 확인 화면이 뜨면 우회하지 않고 그 전시는 「NOL 지표 없음」 으로 둔다.
- **국립현대미술관**: `https://www.mmca.go.kr/exhibitions/AjaxExhibitionList.do?exhFlag=1&pageIndex=1`(헤더 `x-requested-with: XMLHttpRequest`)의 `exhReadCnt`(조회수) · `exhThumbImg`(포스터). 조회수는 쌓인 값이라 개막 전 · 막 연 전시는 「개막 전 조회수」 로 적는다.
- 둘 다 없으면 매체 소개 · 「국내 첫」 같은 사실 한 줄. 이것만 있는 전시는 지표가 있는 것 뒤에 둔다.

## 3. 순서와 근거

지표가 단단한 것(관람평 수백 건 · 주간 상위 · 조회수 10만대) → 개막 전 기대(예매 순위 · 찜) → 매체 소개 순. 서울 목록이 15개를 넘지 않게, 근거가 약하면 덜 고른다. `rating`(5 · 4)은 근거의 세기, `rating_reason` 은 줄 맨 아래에 그대로 보이는 한 줄 — 「관람평 ★4.5(143건) · NOL 전시 주간 예매 7위 · 찜 1,751명 (11/13 기준)」 꼴.

## 4. 포스터 주소(`image_url`)

공식 페이지의 대표 이미지 주소를 그대로 — 국립현대미술관 `exhThumbImg`, 서울시립미술관 상세의 `/common/imgFileView?FILE_ID=…` 첫 그림, 예술의전당 og:image(`/site/main/file/thumbnail/uu/…`). 호스트가 `app/index.html` CSP `img-src` 에 없으면 그 PR 을 먼저(보안 — 사람이 본 뒤 머지). 남의 서버 그림을 저장소에 복사하지 않는다.

## 5. 넘기기

SQL 한 묶음을 채팅에 통째로. **`events` 에는 update 마다 `updated_at` 을 now() 로 찍는 트리거(`events_set_updated_at`)가 있다** — 순위만 바꿔도 「정보 기준일」 과 주간 소식의 「이번 주 고친 안내」 가 순위 날짜로 바뀐다(2026-11-13 에 41행이 그렇게 됐다). 그래서 트리거를 끄고 한 묶음(transaction)으로:

```sql
begin;
alter table public.events disable trigger events_set_updated_at;
update public.events set recommended_rank = null where recommended_rank is not null;
update public.events set recommended_rank = 1, rating = '5', rating_reason = '…', image_url = '…' where id = '<id>';
-- … 고른 것마다(작은따옴표는 두 번)
alter table public.events enable trigger events_set_updated_at;
commit;
```

중간에 실패하면 끈 것까지 함께 되돌아간다. `verification_note` 도 건드리지 않는다 — 순위는 사실 확인이 아니다. 실행했다고 하면 공개 API 로 순위 · 근거 · 이미지가 들어갔는지 본다. 열다섯 줄 + 코드 블록을 넘기지 않는다.
