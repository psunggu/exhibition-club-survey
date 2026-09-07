# 운영 절차 — 정기 갱신 네 가지

> 2026-09-08 작성. 되풀이되는 갱신을 **어디서 · 무엇으로 · 얼마나 자주** 하는지 적는다.
> 규칙은 `AGENTS.md`, 이력과 근거는 `docs/HISTORY.md`.

## 원칙

1. **데이터는 한 곳에만.** 같은 값을 두 파일에 쓰는 절차는 만들지 않는다. 두 곳에 있으면 반드시 어긋난다.
2. **되풀이 작업은 스크립트가 한다.** 사람은 실행 한 번과 결과 훑어보기만 한다.
3. **AI 세션은 판단이 필요한 곳에만 연다.** 자료를 옮겨 적는 데 세션을 쓰지 않는다.
4. **콘텐츠 커밋은 `npm run check:quick`, 화면·기능 변경은 `npm run check` + PR.**

## 한눈에

| 항목 | 주기 | 하는 곳 | 명령 | AI 세션 |
|---|---|---|---|---|
| 1. 관람 장소 설문 | 달마다 | 운영자 화면 `#/survey/admin` | 없음 | 안 연다 |
| 2. 주간 정리봇 | 주 1회 | `kakao-digest` → 이 저장소 | `npm run digest:public -- <digest.json>` | 문구 다듬을 때만 |
| 3. 보드 · 영화 순위 | 수·토 22시 | 이 저장소 | `npm run board:movies` | 안 연다 |
| 3. 보드 · 전시·공연 | 수시 | Supabase SQL Editor (`public.events`) | 없음 | 안내문 쓸 때만 |
| 4. 확정 모임 | 확정될 때 | `app/src/data/meetups.ts` | 항목 하나 추가 | 안 연다 |

## 1. 관람 장소 설문 — `#/survey`

- **운영자 화면에서 만든다.** `#/survey/admin` → 「새 설문 올리기」. 제목·안내문·갈래·후보·링크·받는 기간을 거기서 넣는다.
  SQL 마이그레이션을 쓰지 않는다 — 그 길은 2026-08 에 화면이 없을 때 쓰던 것이다.
- 후보를 나중에 더할 때도 운영자 화면(「장소 추가」)이다.
- 톡방에서 이미 끝난 투표를 옮겨 올 때만 SQL 이다 — `202608270001b_poll_voters.template.sql` 을 채워 운영자가 손으로 실행하고 **채운 파일은 저장하지 않는다.**
- 설문이 모임을 정하면 그 모임 항목의 `surveyIds` 에 설문 id 를 적는다(4번). 요약 카드(`meetingBrief.ts` 의 `decidedBy`)가 있으면 그 id 도 맞춘다.

## 2. 주간 정리봇 — `#/calendar` 상단

```
kakao-digest\scripts\weekly_collect.ps1     내보내기 → 누적 → LLM 요약 → output\digest-YYYYMMDD-YYYYMMDD.json
npm run digest:public -- C:\D\Project\kakao-digest\output\digest-….json
node scripts/validate-weekly-digest.mjs
git commit -am "정리봇 M월 D일 ~ M월 D일" && git push -u origin HEAD && gh pr create --fill && gh pr checks --watch && gh pr merge --squash
```

- `digest:public` 이 원본(개인정보 포함)을 공개 틀로 옮긴다 — 기간·시각·대화 수·요약·확인사항·결정·확인 중.
  익명화 식별자 「멤버 N」 은 「회원」 으로 바꾸고, 이름·전화·이메일로 보이는 것이 남으면 **쓰지 않고 멈춘다.**
- 결과를 한 번 훑는다. 확인사항의 `severity`(urgent · check · planning)와 문구가 어색하면 JSON 을 직접 고친다.
  고쳤으면 검사기를 다시 돌린다.
- `--dry-run` 을 붙이면 쓰지 않고 보여만 준다.
- **원본 `digest-*.json` 은 이 저장소에 넣지 않는다** (`.gitignore` 가 막고 있지만 `git add -f` 는 못 막는다).
- 지금 `kakao-digest` 의 자동 내보내기가 멈춰 있다 — `last_run.json` 이 `export-failed · 채팅방 창을 찾지 못함`(2026-09-04).
  창 제목(`-Room` 인자)이 실제 방 이름과 같은지 먼저 본다.

## 3. 문화 콘텐츠 보드 — `#/`

### 영화 예매 순위 (수요일·토요일 22시)

```
npm run board:movies
npm run check:quick
git commit -am "보드 영화 순위를 M월 D일 기준으로 갱신한다" && git push -u origin HEAD && gh pr create --fill && gh pr checks --watch && gh pr merge --squash
```

- `board:movies` 는 KOBIS 실시간 예매율 상위 10편을 받아 `movies.ts` 를 다시 쓰고, `App.tsx` 의 갱신일을 오늘로 올리고,
  빌드해서 화면 기준(`screen-baseline.json`)을 저장한다. 세 파일이 함께 바뀌는 것이 정상이다.
- 받기만 보려면 `node scripts/update-movies.mjs --dry-run`.
- `summary` 는 시놉시스 첫 문장이다. 손으로 다듬어도 되지만 다음 갱신 때 덮인다.
- 거르지 않는다. 순위대로 싣는다.

### 전시·공연 (`public.events`)

- 운영자가 Supabase SQL Editor 에서 넣고 고친다. 큐레이션 필드는 nullable 컬럼이다 (`202608190001a_columns.sql`).
- 안내문(추천·할인·확인 메모)을 새로 쓸 때만 AI 세션을 연다 — 공식 출처를 다시 확인하고 쓴다.
- 전시만 갈고 영화는 안 갈았으면 `App.tsx` 의 `SITE_INFO_UPDATED_ON` 을 손으로 오늘로 올린다. **한 곳뿐이다.**
  자료를 안 갈았으면 날짜만 올리지 않는다.
- 소식 한 줄은 운영자 화면에서 올리고 지운다. 기한은 며칠로 받는다.

## 4. 다가오는 확정 모임 — `#/calendar`

- `app/src/data/meetups.ts` 의 `MEETUPS` 에 항목 하나를 더한다. **필수 필드만 적는다** — 나머지는 `withDefaults` 가 채운다.

```ts
{
  id: 'october-regular',
  date: '2026-10-17',
  chip: '10월 정기관람 16시',
  kind: 'conf',
  regular: true,
  venueKind: '전시',
  title: '10월 정기관람 《전시 이름》',
  time: '오후 4시',
  venue: '미술관 이름',
  description: '한 줄 소개.',
  infoUrl: 'https://…',   // 없으면 빼도 된다
},
```

- 저절로 되는 것: 날짜 표기(`dateLabel`) · 상태 딱지(`status` · `tone`) · 지도 링크(`mapUrl`, 장소 이름으로) · 완료 처리 · 완료 목록 줄 · 달력 격자 · 연도 묶음.
  참석 인원처럼 자료에 없는 것을 완료 줄에 남기고 싶을 때만 `completedRow` 를 적는다.
- 날짜가 아직 안 정해진 것은 `TENTATIVE` 에만 둔다. 동호회 일정으로 안 잡는 것은 어디에도 두지 않는다 — 보드가 그 자리다.
- 일정 화면이 달라지므로 화면 기준을 갱신한다:

```
npm run build && npm run screens:save && npm run check:quick
git commit -am "10월 정기관람을 달력에 올린다" && git push -u origin HEAD && gh pr create --fill && gh pr checks --watch && gh pr merge --squash
```

## AI 세션에서 토큰을 아끼는 법

- **세션마다 읽히는 것은 `CLAUDE.md` + `AGENTS.md` 뿐이다.** `AGENTS.md` 에는 규칙만 둔다. 근거·이력·실측은 `docs/HISTORY.md` 로 보내고, 필요할 때만 연다.
- 위 표에서 「안 연다」 인 항목은 세션 없이 처리한다. 세션을 열었다면 그 명령 하나를 돌리고 끝낸다.
- 검사는 `check:quick`(약 15초) 을 기본으로 한다. `check`(약 2분 · 통과 로그 120줄)는 화면·기능 변경과 PR 때만.
  긴 검사 출력은 `| tail -20` 으로 잘라 읽는다.
- 세션 시작 루틴은 `git fetch` 한 줄이다. `kakao-digest` 저장소는 정리봇을 갱신할 때만 본다.
- `main` 은 직접 푸시가 막혀 있다(ruleset). 콘텐츠 커밋도 PR 이지만 **본문은 한 줄, CI 통과 즉시 스스로 머지**한다. 리뷰 왕복을 두지 않는다.

```bash
git push -u origin HEAD && gh pr create --fill && gh pr checks --watch && gh pr merge --squash
```
- 커밋 메시지는 한 줄이다. 근거를 길게 적을 일이면 코드 주석이 아니라 `docs/HISTORY.md` 에 한 문단으로 적는다.
