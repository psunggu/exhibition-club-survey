# 운영 절차 — 정기 갱신 네 가지

> 2026-09-08 작성. 되풀이되는 갱신을 **어디서 · 무엇으로 · 얼마나 자주** 하는지 적는다.
> 규칙은 `AGENTS.md`, 이력과 근거는 `docs/HISTORY.md`.

## 원칙

1. **데이터는 한 곳에만.** 같은 값을 두 파일에 쓰는 절차는 만들지 않는다. 두 곳에 있으면 반드시 어긋난다.
2. **되풀이 작업은 스크립트가 한다.** 사람은 실행 한 번과 결과 훑어보기만 한다.
3. **AI 세션은 판단이 필요한 곳에만 연다.** 자료를 옮겨 적는 데 세션을 쓰지 않는다.
4. **콘텐츠 커밋은 `npm run check:quick`, 화면·기능 변경은 `npm run check` + PR.**

## 한눈에

| 항목 | 주기 | 누가 | 어떻게 | AI 토큰 |
|---|---|---|---|---|
| 1. 톡방 투표 → 결과 옮기기 | 달마다 | 운영자 | 톡방 투표 → 운영자 화면 `#/survey/admin` 에 그릇 → SQL 템플릿으로 표 수 | 0 |
| 2. 주간 정리봇 | 주 1회 | Claude Code `/digest` | kakao-digest → `npm run digest:public` → PR | 적음 |
| 3. 보드 · 영화 순위 | 수·토 05시 | **이 PC 의 작업 스케줄러** (`ExhibitionClub-Movies`) | `npm run board:movies` → PR → 머지 → 배포 | 0 |
| 3. 보드 · 전시·공연 | 수시 | 운영자 | Supabase SQL Editor (`public.events`) | 안내문 쓸 때만 |
| 4. 확정 모임 | 확정될 때 | Claude Code `/meetup "한 줄"` | `meetups.ts` 항목 → PR | 적음 |

세션을 열었을 때 「뭐부터 할까」 는 `/ops` — 넷이 각각 얼마나 오래됐는지 열 줄로 보고한다.

**주 1회 `/recheck`** — 보드의 전시·공연과 다가오는 모임의 기간·관람료·휴관·시간이 공식 페이지와 아직 맞는지 본다. `npm run recheck` 가 공식 페이지에서 사실이 적힌 줄만 잘라 `logs/recheck-YYYYMMDD.md` 에 모으고(지난주와 같은 페이지는 본문을 싣지 않는다), 세션이 달라진 것만 표로 보고한다. DB 는 고치지 않는다 — 운영자가 붙여 넣을 `update` 한 줄을 만들어 준다. 여기가 AI 가 매주 조금 쓰는 유일한 자리이고, 그럴 만한 자리다 — 틀린 정보가 회원에게 나가는 것이 이 사이트의 가장 큰 실패다.

### 자동화 구성 (2026-09-08)

- **`scripts/update-movies-task.ps1`** — 이 PC 의 작업 스케줄러가 수·토 05:00 에 돌린다(`scripts/install-movies-task.ps1` 로 등록). 새벽인 이유는 낮·저녁에는 사람이 PC 를 쓰고 있어서다. `board:movies` + `check:quick` 뒤 사용자 계정의 `gh` 로 PR 을 열고 CI 를 기다려 머지한다. 그 사이 `main` 이 움직여 머지가 거부되면 `gh pr update-branch` 로 맞추고 한 번 더 시도한다. **우회 권한을 만들지 않는다** — 사람과 같은 길이다. 로그는 `logs\update-movies-YYYYMM.log`. GitHub 호스트 러너에서는 KOBIS 가 연결 시간 초과로 막혀 크론 워크플로는 쓸 수 없었다(2026-09-08 실측).
  ```
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-movies-task.ps1
  ```
- **`.claude/skills/`** — `/ops` · `/digest` · `/meetup` · `/recheck` · `/scout`. 부를 때만 읽히므로 세션 고정 비용이 늘지 않는다.
- **`.claude/agents/ops.md`** — 위 스킬이 실행을 맡기는 서브에이전트. Sonnet, 도구는 Bash · Read · Edit · Grep · Glob. 판단은 하지 않고 절차만 돌린다.
- Pages 배포 원천은 2026-09-08 부터 **GitHub Actions** 다. `gh-pages` 브랜치는 지웠다.

## 1. 톡방 투표와 결과 — `#/survey`

**투표는 톡방에서 한다. 사이트는 현황과 결과만 보여 준다**(2026-09-09 부터). 회원이 사이트에서 직접 고르는 화면은 `app/public/config.js` 의 `selfSurvey: false` 로 꺼 두었다 — 켜면 옛 응답 화면이 돌아온다.

1. **톡방에 투표를 올린다**(카카오톡 투표). 후보와 마감을 거기서 정한다.
2. **운영자 화면에 같은 설문을 만든다.** `#/survey/admin` → 「새 설문 올리기」. 제목·안내문·갈래·후보·마감을 톡방과 같게 넣는다. 이것이 결과를 담을 그릇이고, 회원 화면에는 「톡방에서 진행 중」 으로 뜬다. 모임과 잇는 것은 폼 맨 위 「이어지는 모임」.
3. **마감 뒤 표 수를 옮긴다** — `202608270001b_poll_voters.template.sql` 을 채워 운영자가 손으로 실행하고 **채운 파일은 저장하지 않는다.** 표 수(`imported_votes`)가 들어가면 화면이 결과를 그리고 요약 카드가 1위를 채운다. 이름까지 담는 것은 `show_names` 를 켠 설문에서만.
   운영자 화면에서 표 수를 적는 자리는 아직 없다 — 만들 때는 DB 함수와 검사기(`validate-survey-schema` 의 `CALLABLE`)를 함께 늘린다.

- 후보를 나중에 더할 때는 운영자 화면(「장소 추가」)이다. SQL 마이그레이션으로 설문을 만들지 않는다.
- **모임에 이어진 설문은 폼 맨 위 「이어지는 모임」 에서 고른다**(2026-09-09). 다가오는 모임을 고르면 새 설문의 제목·안내·갈래(식사)·마감(모임 이틀 전)이 미리 채워지고, 저장하면 설문 행의 `meetup_id` 로 이어진다. `meetups.ts` 의 `surveyIds` 를 손으로 적을 필요가 없다 — 옛 설문의 `surveyIds` 는 그대로 살아 있다. 요약 카드(`meetingBrief.ts` 의 `decidedBy`)를 쓰는 모임이면 그 id 는 아직 코드에서 맞춘다.

## 2. 주간 정리봇 — `#/calendar` 상단

```
kakao-digest\scripts\weekly_collect.ps1     내보내기 → 누적 → LLM 요약 → output\digest-YYYYMMDD-YYYYMMDD.json
npm run digest:public -- C:\D\Project\kakao-digest\output\digest-….json
node scripts/validate-weekly-digest.mjs
git commit -am "정리봇 M월 D일 ~ M월 D일" && git push -u origin HEAD && gh pr create --fill
```

- `digest:public` 이 원본(개인정보 포함)을 공개 틀로 옮긴다 — 기간·시각·대화 수·요약·확인사항·결정·확인 중.
  익명화 식별자 「멤버 N」 은 「회원」 으로 바꾸고, 이름·전화·이메일로 보이는 것이 남으면 **쓰지 않고 멈춘다.**
- 결과를 한 번 훑는다. 확인사항의 `severity`(urgent · check · planning)와 문구가 어색하면 JSON 을 직접 고친다.
  고쳤으면 검사기를 다시 돌린다.
- `--dry-run` 을 붙이면 쓰지 않고 보여만 준다.
- 머지 뒤 **`npm run notice`** — 정리봇 + 다가오는 모임 + 톡방에서 진행 중인 투표 + 보드 순위를 「주간 소식」 한 통으로 조립해 `logs/weekly-notice-YYYYMMDD.txt` 에 쓰고 클립보드에 넣는다. 톡방에는 사람이 붙여 넣는다(자동 게시는 만들지 않는다). 봇 트리거 `#` 는 전각으로 바꿔 나간다.
- **원본 `digest-*.json` 은 이 저장소에 넣지 않는다** (`.gitignore` 가 막고 있지만 `git add -f` 는 못 막는다).
- `kakao-digest` 의 작업 스케줄러 작업 `KakaoWeeklyDigest` 는 화·금 22:00 에 돈다. 관리자 권한으로 등록된 작업이라 일반 세션에서는 시각을 못 바꾼다 — 새벽으로 옮기려면 **관리자 PowerShell** 에서 `kakao-digest\scripts\install_task.ps1 -Room <방 이름> -Day Tuesday,Friday -Time 05:00` 을 돌린다. 실패는 거의 늘 「채팅방 창을 찾지 못함」(종료 코드 11)이다 — 방을 독립 창으로 띄워 두었는지, 화면이 잠겨 있지 않았는지 본다.

## 3. 문화 콘텐츠 보드 — `#/`

### 영화 예매 순위 (수요일·토요일 05시)

**이 PC 의 작업 스케줄러가 한다** (`ExhibitionClub-Movies` → `scripts/update-movies-task.ps1`). 손으로 돌릴 일이 생기면:

```
npm run board:movies
npm run check:quick
git commit -am "보드 영화 순위를 M월 D일 기준으로 갱신한다" && git push -u origin HEAD && gh pr create --fill
```

- `board:movies` 는 KOBIS 실시간 예매율 상위 10편을 받아 `movies.ts` 를 다시 쓰고, `App.tsx` 의 갱신일을 오늘로 올리고,
  빌드해서 화면 기준(`screen-baseline.json`)을 저장한다. 세 파일이 함께 바뀌는 것이 정상이다.
- 받기만 보려면 `node scripts/update-movies.mjs --dry-run`.
- `summary` 는 시놉시스 첫 문장이다. 손으로 다듬어도 되지만 다음 갱신 때 덮인다.
- 거르지 않는다. 순위대로 싣는다.

### 전시·공연 (`public.events`)

- **새 전시 찾기는 `/scout`** (주 1회). `npm run scout` 가 서울시립미술관·예술의전당·국립중앙박물관·국립현대미술관 공식 목록에서 보드에 없는 전시를 `logs/scout-YYYYMMDD.md` 에 모으고, 스킬이 공식 상세를 읽어 관람료·운영시간·소개를 채운 `insert` 문을 만든다. 고르는 것은 운영자이고, DB 에 넣는 것도 운영자다. 보드는 `status` 로 거르지 않으므로 넣는 순간 회원이 본다 — 빈 칸이 남은 채로 넣지 않는다.
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
- **달력 구독 파일(`club-calendar.ics`)은 빌드 때 `MEETUPS` 에서 저절로 만들어진다**(`vite.config.ts` 의 calendarFeed · `lib/ics.ts`). 따로 갱신할 것이 없다. 회원이 한 번 구독하면 새 모임이 휴대폰 달력에 저절로 들어간다. `time` 에 「오후 4시」 「16:50 집결」 처럼 시각을 적으면 그 시각으로, 못 읽으면 종일 일정으로 들어간다 — `validate-ics.mjs` 가 시각 표기 꼴을 검사한다.
- 일정 화면이 달라지므로 화면 기준을 갱신한다:

```
npm run build && npm run screens:save && npm run check:quick
git commit -am "10월 정기관람을 달력에 올린다" && git push -u origin HEAD && gh pr create --fill
```

## AI 세션에서 토큰을 아끼는 법

- **세션마다 읽히는 것은 `CLAUDE.md` + `AGENTS.md` 뿐이다.** `AGENTS.md` 에는 규칙만 둔다. 근거·이력·실측은 `docs/HISTORY.md` 로 보내고, 필요할 때만 연다.
- 위 표에서 「안 연다」 인 항목은 세션 없이 처리한다. 세션을 열었다면 그 명령 하나를 돌리고 끝낸다.
- 검사는 `check:quick`(약 15초) 을 기본으로 한다. `check`(약 2분 · 통과 로그 120줄)는 화면·기능 변경과 PR 때만.
  긴 검사 출력은 `| tail -20` 으로 잘라 읽는다.
- 세션 시작 루틴은 `git fetch` 한 줄이다. `kakao-digest` 저장소는 정리봇을 갱신할 때만 본다.
- `main` 은 직접 푸시가 막혀 있다(ruleset). 콘텐츠 커밋도 PR 이지만 **본문은 한 줄, CI 통과 즉시 스스로 머지**한다. 리뷰 왕복을 두지 않는다.

```bash
git push -u origin HEAD && gh pr create --fill
gh pr checks --watch && gh pr merge --squash
```

  자동 머지(`--auto`)는 저장소 설정에서 꺼져 있다. PR 을 연 뒤 **한 번 더 푸시하면 앞 검사가 취소되어** `--watch` 가 실패로 끝나니, 그때는 `gh pr checks` 로 새 검사가 통과했는지 보고 머지한다. 머지 뒤 배포 워크플로가 같은 검사를 한 번 더 돌린다 — 거기서 실패하면 배포되지 않는다.
- 커밋 메시지는 한 줄이다. 근거를 길게 적을 일이면 코드 주석이 아니라 `docs/HISTORY.md` 에 한 문단으로 적는다.
