---
name: meetup
description: 달력에 모임을 올린다. 「10/17 토 15시 덕수궁·정동길 산책, 시청역 1번 출구 집결」 처럼 한 줄을 인자로 받아 meetups.ts 항목을 만들고 검사 뒤 PR 로 머지한다. 날짜가 아직 안 정해진 것은 조율 중(TENTATIVE)에 넣는다.
---

입력: `$ARGUMENTS` (모임 한 줄). 절차의 정본은 `docs/OPERATIONS.md` 4번, 자료 규칙은 `AGENTS.md` 「일정」.

## 1. 한 줄을 항목으로 옮긴다 (이 세션에서 직접)

`app/src/data/meetups.ts` 의 마지막 `MEETUPS` 항목과 `TENTATIVE` 를 읽고 같은 꼴로 쓴다.

- **날짜가 정해졌으면** `MEETUPS` 에 **필수 필드만**: `id · date · chip · kind: 'conf' · regular · venueKind · title · time · venue · description`. 링크가 있으면 `infoUrl`. 나머지는 `withDefaults` 가 채운다 — `dateLabel · status · tone · mapUrl` 을 적지 않는다.
  - `regular` 는 「정기관람」 일 때만 true. 제목·칩에 「정기관람」 낱말이 있으면 반드시 true, 없으면 false 여야 검사가 통과한다.
  - `venueKind` 는 `'전시' | '박물관' | '영화' | '공연' | '모임'` 가운데 하나. `chip` 은 달력 칸에 들어갈 짧은 글(장소·시각).
  - `id` 는 영문 소문자·하이픈. `date` 는 ISO.
- **날짜가 후보만 있으면** `TENTATIVE` 에 `id · tag · text · candidates`. `text` 에는 변하지 않는 사실만 적는다(「투표 중」 같은 상태 문구 금지).
- 각자 보기로 한 것은 어디에도 넣지 않는다 — 보드가 그 자리다. 그런 입력이면 그렇게 답하고 끝낸다.
- 회원 실명은 어떤 칸에도 적지 않는다.

항목을 코드 블록으로 보여 주고 **한 번만 확인을 받는다** (공개 화면에 나가는 일정이다). 확인 전에는 파일을 건드리지 않는다.

## 2. 확인 뒤 — `ops` 서브에이전트에게 맡긴다

Agent 도구로 `ops` 를 부르고 확정된 항목과 함께 아래를 전달한다.

> 저장소 `C:\D\Project\exhibition-club-survey` 에서 `docs/OPERATIONS.md` 4번 절차를 돌린다.
> 1. `git fetch origin && git checkout -b content/meetup-<id> origin/main`
> 2. `app/src/data/meetups.ts` 의 (MEETUPS 배열 끝 | TENTATIVE 배열 끝)에 아래 항목을 그대로 넣는다. 다른 줄은 손대지 않는다.
> 3. `npm run build && npm run screens:save && npm run check:quick`
> 4. 커밋 「<제목>을 달력에 올린다」(조율 중이면 「…을 조율 중에 올린다」) → 푸시 → `gh pr create --fill` → `gh pr checks --watch` → `gh pr merge --squash`
> 5. 보고: PR 번호 · 머지 여부 · 검사 결과.

## 3. 보고

세 줄 안쪽. 이 모임을 정한 설문이 있으면 `surveyIds` 를 이어야 한다고 한 줄 덧붙인다.
