---
name: rank
description: 보드 순위를 다시 매긴다 — 전시는 관람평 · 예매 순위 · 공식 조회수로 15개 이내를 골라 SQL 로 넘기고, 공연(뮤지컬 · 콘서트 · 클래식 · 무용 · 연극)은 KOPIS 주간 예매 순위를 자료 파일로 옮긴다. 주 1회(scout 뒤), 「추천 순위 갱신」 요청에 쓴다.
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

## 6. 공연 예매 순위 (KOPIS → `performances.ts`)

뮤지컬 · 콘서트 · 클래식 · 무용 · 연극 탭은 KOPIS 예매상황판을 그대로 비춘다 — 고르지 않는다. 절차의 정본은 `docs/OPERATIONS.md` 3번.

1. 내장 브라우저로 `https://kopis.or.kr/por/boxoffice/boxoffice.do?menuId=MNU_000024` 를 연다. 필터는 주소로 바꾼다 — `type=w`(주간) · `startDate` · `endDate`(지난 금요일~어제 목요일, 화면의 「주간」 기본값) · `rankType=ntssAmountSm` · `genre_code`(뮤지컬 `GGGA` · 콘서트(대중음악) `CCCD` · 클래식(서양음악) `CCCA` · 무용 `BBBC` · 연극 `AAAA`) · `STDG_CPSGG_CD`(서울 `^11` · 경기 `^41` · 인천 `^28`). 열다섯 화면을 차례로 넘기며(같은 탭에서 `window.next.router.push`) 줄마다 순위 · 제목 · 기간 · 공연장 · `mt20Id` · 포스터 파일 이름을 읽는다. 화면의 「최종게시일시」 도 적는다.
2. 저장소 밖 스크래치에 `# 서울|뮤지컬` 머리와 `제목¦기간¦공연장¦id¦포스터파일` 줄로 적는다(무용은 다섯 줄, 나머지는 열 줄까지). **옮겨 적은 것이 화면과 같은지 해시로 견준다** — 묶음마다 같은 글을 브라우저와 Node 에서 FNV-1a 로 계산해 열다섯 개가 모두 같아야 한다.
3. `node scripts/shows-from-kopis.mjs <파일> --from … --to … --published '…'` → `npm run build && npm run screens:save && npm run check` → PR(콘텐츠 갱신 — 검사 통과면 스스로 머지).
4. KOPIS 가 화면 구조를 바꿔 못 읽으면 지어내지 않고 멈춘다 — 지난 순위가 날짜와 함께 남는다. Open API 인증키가 생기면 이 절을 배치로 바꾼다.

## 7. 끝에 한 번

`node scripts/validate-board-data.mjs --live` — DB 에 넣은 포스터 주소의 호스트가 CSP `img-src` 에 다 있는지 본다. 없으면 그 그림은 회원 화면에서만 빈다.
