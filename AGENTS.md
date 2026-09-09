# AGENTS.md — 프로젝트 규칙 (AI 코딩 에이전트용)

> 최종 갱신: 2026-09-08. **여기에는 규칙만 적는다.**
> 왜 그렇게 정했는지와 무슨 일이 있었는지는 `docs/HISTORY.md`, 정기 갱신 절차는 `docs/OPERATIONS.md`.
> 이 문서는 세션마다 읽히므로 길어지면 그만큼 매번 비용이 든다 — 근거는 HISTORY 로 보낸다.

## 무엇인가

41교구 전시·박물관 동아리 사이트. Vite + React 해시 라우팅 SPA(`app/`), GitHub Pages 배포, Supabase(`public` 스키마).
라우트는 여덟 — `#/`(보드) · `#/calendar`(일정) · `#/survey` · `#/survey/datetime` · `#/survey/meal` · `#/survey/club` · `#/survey/google` · `#/survey/admin`. (`#/survey/etc` 는 2026-09-09 에 뺐다.) 꺼진 설정(`selfSurvey: false`)에서는 `datetime` · `club` 탭을 그리지 않고 그 주소는 관람 장소로 보낸다(2026-09-10, `visibleTabs()`).

| 화면 | 코드 | 데이터의 정본 |
|---|---|---|
| 보드 `#/` | `Board.tsx` | 전시·공연 `public.events`(운영자가 Supabase 에서) · 영화 `data/movies.ts`(`npm run board:movies`) · 소식 한 줄 `events` 의 `type='소식'`(운영자 화면) |
| 일정 `#/calendar` | `Calendar.tsx` | 모임 `data/meetups.ts` · 정리봇 `app/public/weekly-digest.public.json`(`npm run digest:public`) |
| 설문 `#/survey/*` | `Survey.tsx` · `SurveyAdmin.tsx` | 회원 탭 넷(exhibition · datetime · meal · club) + `google`(화면만, `data/googleSurveys.ts`). DB 값에는 `etc` 도 있다(탭 없음). **투표는 톡방에서 올리고 결과도 톡방에서**(`config.js` 의 `selfSurvey: false`). 회원 화면 탭은 꺼진 설정에서 셋(관람 장소 · 식사·Tea · 구글 설문, `visibleTabs()`)이고 제목은 「… 투표 결과」(`categoryHeading()`). 운영자 화면 `#/survey/admin` 은 보드 소식 · 구글 설문 분석만 — 설문 만들기·고치기와 회원 명부는 같은 스위치로 꺼 두었다(2026-09-10) |
| 정적 | `survey-result.html` · `meal-review.html` | 회원용 설문 결과 · 운영진 식당 검토. `copyLiveAssets` 목록에 있다 |

미가동: `apps-script/Code.gs`(구글폼 자동 생성). 구글 폼은 손으로 만들어 이미 한 번 돌렸다.

## 배포

- `main` 푸시 → `deploy-pages.yml` → `npm run build` 의 `dist/` → Pages. 라이브: https://psunggu.github.io/exhibition-club-survey/ (`#/calendar` · `survey-result.html`).
- **`app/public/` 은 `publicDir` 이 아니다.** `vite.config.ts` 의 `copyLiveAssets` 목록에 적은 것만 나간다. 새 정적 파일을 넣고 목록에 안 적으면 빌드는 통과하고 **배포된 사이트에서만 404** 다.
- `club-calendar.ics`(달력 구독)는 파일이 아니라 빌드 때 `meetups.ts` 에서 만든다(`calendarFeed` · `lib/ics.ts`). `TENTATIVE` 는 넣지 않는다.
- `app/public/index.html` · `app.js` · `notice.html` · `notice.js` 는 옛 정적 페이지다. 배포되지 않고 2026-09-08 부터 검사기도 읽지 않는다 — **지운다.** `styles.css` · `notice.css` 는 `scope-legacy-css.mjs` 의 원본이라 남긴다.
- 옛 주소 `notice.html` 은 단톡방에 뿌려져 있어 `vite.config.ts` 가 `#/calendar` 리다이렉트 스텁을 만든다. 이 스텁을 지우면 옛 링크가 죽는다.
- 해시 라우팅을 히스토리 API 로 바꾸지 않는다 — 카카오톡 인앱 브라우저 때문이다.
- **`main` 은 직접 푸시가 막혀 있다**(ruleset). 모든 변경은 브랜치 + PR 이다. **콘텐츠만 바꾸는 커밋**(영화 · 모임 · 정리봇 · 문구)은 `npm run check:quick` 뒤 PR 을 열고 CI 가 통과하면 스스로 머지한다 — 리뷰를 기다리지 않는다. **화면 · 기능 변경**은 `npm run check` 까지. Supabase · 개인정보 · 인증 · 보안은 반드시 사람이 본 뒤 머지한다.
- Pages 배포 원천은 GitHub Actions 다(2026-09-08). `gh-pages` 브랜치는 없다.
- 영화 순위는 소유자 PC 의 작업 스케줄러(`scripts/update-movies-task.ps1`)가 PR 로 올려 머지한다. GitHub 러너는 KOBIS 에 못 붙는다. ruleset 에 우회 대상을 만들지 않는다.
- 정기 갱신용 스킬 `/ops` · `/digest` · `/meetup` · `/recheck` · `/scout` 와 서브에이전트 `ops` 는 `.claude/skills/` · `.claude/agents/` 에 있고 추적한다.

## 검사

- `npm run check:quick` — 빌드 + 정적 검사(약 15초). `npm run check` — 여기에 Playwright 화면 검사(접근성 · 설문 · 운영자 · 화면 대조)까지(약 2분).
- `screens:check` 는 화면이 **의도치 않게** 바뀌었는지 본다. 화면을 일부러 바꿨으면 `screens:save`. 영화 · 모임처럼 **콘텐츠가 바뀌어도 화면 숫자가 달라지므로** save 가 따라온다(`board:movies` 는 스스로 한다).
- 검사기가 못 잡는 것: 375px 가로 스크롤 · 캐시 버스팅 `?v=` 누락 · CSP 위반(브라우저 콘솔에만 뜬다) · React 가 만드는 iframe(`frame-src` 없음) · 달력 「오늘」 마커.
- `validate-survey-admin-ui` 는 `.admin-card` · `.note*` 같은 클래스 이름을 차례로 짚어 「몇 번째 설문」 을 고른다. **새 구역은 새 이름**(`.admin-news-card` · `.admin-guide*` · `.gdoc-*`)을 쓰고, 모양이 같으면 CSS 선택자만 더한다.
- 새 표 · 함수는 `validate-survey-schema.mjs` 의 `LOCKED` · `CALLABLE` 목록에 함께 적는다. 안 적으면 검사 밖이다.

## 개발 규칙

- **CSP 엄격.** 외부 CDN · 인라인 `<style>` · `style=` · 인라인 `<script>` 금지. 되는 것: React `style={{}}`, SVG 표현 속성(`<rect width fill>`). 안 되는 것: `style="…"` · `setAttribute('style')` · `<style>` 주입 · iframe. meta 의 `frame-ancestors` 는 브라우저가 무시한다 — 막고 있다고 믿지 말 것.
- 캐시 버스팅 `?v=YYYYMMDD-n`. 모바일 우선(375px 가로 스크롤 없음). `word-break: keep-all` 은 `body` 에 있다.
- **색 · 모서리 · 그림자 · 서체는 `app/public/tokens.css` 한 곳.** 다른 CSS 는 `var(--…)` 만. 팔레트 열다섯(중립 8 · 브랜드 3 · 상태 4), 새 색 금지. 색은 **상태**만 말한다 — 갈래는 글자로. `--warn` 은 확인 필요, `--stop` 은 마감 · 오류 전용.
- 여백은 4 · 8 · 12 · 16 · 22 · 32 눈금 — **새로 쓰는 값에만.** 기존 값은 손대지 않는다.
- 서체는 `app/public/fonts/` 의 Pretendard 서브셋(OFL). `@font-face` 는 `tokens.css`.

### 개인정보

- 회원에게 받는 것은 **이름 · 소속 구역** 둘뿐. 연락처 컬럼(`email` · `phone`) · 주소 · 생년월일 · 계좌 · 주민번호는 어떤 표에도 만들지 않는다. 항목을 늘리려면 처리방침 갱신과 재동의까지 계획한다.
- 이메일은 읽는 경로 자체를 만들지 않는다(`auth.users` 에만 남는다). 단체 메일 기능은 만들지 않는다. `auth.users` 를 읽자는 제안은 그 자체를 되묻는다.
- 결제 없음. 관람료 · 회비는 기록만. 계좌번호는 어떤 형태로도 저장하지 않는다.
- 실제 회원 데이터를 저장소 · 픽스처 · 문서 · 외부 도구에 넣지 않는다. 예시는 `docs/fixtures/sample-members.md`.
- **번들은 공개다.** 회원 이름 · 구역 목록 · 운영진 명단 · 내부 URL · 실명이 든 시트 주소를 소스에 적지 않는다. 화면 데이터는 RLS 를 통과한 API 응답으로만.
- 정리봇: 원본 `digest-*.json` 을 복사하지 않는다. 공개본은 `weekly-digest.public.json` 하나이고 `validate-weekly-digest.mjs` 가 실명 · 구역+이름 · 원문 형식을 막는다.
- 회원 식별: PK 는 `auth.users.id`, 교적부 규칙(동명이인 A/B)은 `unique (full_name, name_letter)`. 화면은 `구역 + 이름`, 집계는 `이름 + 문자`. 인증은 카카오 OAuth + 매직링크, **비밀번호 없음**, 운영진 승인제.

### DB

- **이 저장소의 표는 전부 `public` 이다.** `club` 스키마 규칙은 플랫폼 저장소 것이다. 새 표도 `public` 에 만든다.
- `public.events` 에는 nullable 컬럼만 더한다. 기존 컬럼의 타입 · 이름을 바꾸거나 지우지 않는다. `events` 는 anon 에게 select 만 열려 있고 쓰기 정책 · 권한을 만들지 않는다(`validate-supabase-readonly`).
- **잠긴 표**(`survey_notes` · `admin_guides`): 정책 없이 `revoke all … from anon, authenticated`, `security definer` 함수가 내준다. 함수 첫 줄에서 `public.survey_admin_ok(p_password)` — **읽기도 예외가 아니다.** `set search_path = pg_catalog, public, extensions`. `grant execute … to anon, authenticated` 를 빠뜨리면 앱이 못 부른다.
- **관문은 POST 로만 열린다** — `survey_admin_ok` 가 `request.method` 를 본다. PostgREST 는 휘발성으로 GET 을 막지 않는다. `notify pgrst` · 재시작으로 시간을 쓰지 말 것.
- **DB 를 고쳤다고 바깥이 바뀐 것은 아니다.** API 동작을 바꾸는 마이그레이션은 바깥에서 실제 요청을 쏴서 확인한다.
- 톡방 투표는 **결과만** 옮긴다(`imported_votes` · `imported_voters`). 실명은 SQL 본문에도 주석에도 적지 않는다 — `202608270001b_poll_voters.template.sql` 을 채워 손으로 실행하고 저장하지 않는다.

## 일정 — `data/meetups.ts`

- **정본은 `MEETUPS` 다.** 이 문서에 일정을 베껴 적지 않는다.
- 새 항목은 **필수 필드만** 적는다(`id · date · chip · kind · regular · venueKind · title · time · venue · description`). 날짜 표기 · 상태 딱지 · 지도 링크 · 완료 처리 · 완료 줄 · 달력 격자 · 연도 묶음은 `withDefaults` 와 `isDone` · `monthsToShow` 가 낸다. **`kind` 를 손으로 옮기지 않는다.** 참석 인원처럼 자료에 없는 것을 남길 때만 `completedRow`.
- `TENTATIVE` 는 **날짜를 맞추는 중**인 것만. 각자 보기로 한 것은 어디에도 두지 않는다 — 보드가 그 자리다.
- `monthsToShow` · `pastMonthsToShow` · `isDone` 은 `today` 를 인자로 받는다. 함수 안에서 `new Date()` 를 부르지 않는다 — 검사가 `frozen-clock.mjs` 로 시계를 묶는다.
- `validate-meetup-taxonomy` 는 `id · date · chip · kind · regular · venueKind` 가 붙어 있어야 읽는다. 그 사이에 주석을 끼우지 않는다.

## 보드

- **거르지 않는다.** 영화 순위 · 전시 목록에서 작품을 빼지 않는다. 볼지 말지는 회원이 판단한다.
- 영화는 `npm run board:movies`(KOBIS → `movies.ts` → 빌드 → 화면 기준 저장). 「최종 정보 업데이트」 는 `App.tsx` 의 `SITE_INFO_UPDATED_ON` **한 곳** — 스크립트가 올린다. 전시만 갈았으면 손으로 올린다. 자료를 안 갈았으면 날짜만 올리지 않는다.
- 소식 한 줄: 고르는 규칙은 `lib/news.ts` 의 `pickNews` 한 곳(보드와 운영자 화면이 같이 쓴다). `events` 원본에서 뽑는다(`filterEvents` 를 거치지 않는다). JSX 는 `.exhibition-page` 안. 기한은 며칠(1~180)로. 쓰기는 `news_admin_save` · `news_admin_delete` 만이고 **`type = '소식'` 조건을 빼면 보드 전체가 사정권이다.**

## 설문

- **투표는 톡방에서, 사이트는 결과만**(2026-09-09). `app/public/config.js` 의 `selfSurvey: false` 가 회원 응답을 끈다 — 모든 설문이 `mirrored` 와 같은 결과 화면이 되고 `submitResponse` 는 던진다. 응답 화면 코드는 얼마간 남긴다. 검사기는 `scripts/self-survey-config.mjs` 로 **켠 설정을 끼워** 그 코드를 재고, `validate-survey-ui` · `validate-survey-admin-ui` 끝에서 꺼진 설정도 잰다. 결과를 사이트에 옮겨 넣는 절차는 없다 — 결과는 톡방에서 나누고, 정해진 것만 요약 카드에 값으로 적는다(`docs/OPERATIONS.md` 1번).
- 설문은 **사이트에서 만들지 않는다**(2026-09-10). 투표는 톡방에서 올리고 결과도 거기서 나눈다. 운영자 화면의 「새 설문 올리기」·설문 카드·「지난 관람」 은 같은 `selfSurvey` 스위치로 꺼 두었다 — 코드와 DB 함수, 「이어지는 모임」(`meetup_id`) 은 그대로 있어 켜면 돌아온다. `meetups.ts` 의 `surveyIds` 와 `meetup_id` 는 둘 다 읽힌다(`surveyHistory.meetupOfSurvey`).
- `google` 은 화면에만 있는 갈래다. `SurveyCategory`(DB 다섯)와 `TabCategory`(+google)를 **합치지 않는다.** 운영자 화면의 「어느 화면에」 는 `POSTABLE_CATEGORY_ORDER`(넷).
- **`etc`(기타)는 탭 · 주소 · 운영자 선택지에 없지만 값은 지우지 않는다** — `toCategory` 가 모르는 값을 받아 주는 안전망이고 DB 제약도 그 값을 안다. `CATEGORY.etc.route` 는 첫 갈래로 간다.
- 운영진 전용 분석 가이드: 본문은 저장소에 없고 잠긴 표 `admin_guides` 에만. `GuideDoc.tsx` 에 도메인 문구를 하드코딩하지 않는다(`validate-survey-ui` 가 번들을 grep 한다). 구조화 JSON(`{ "sections": [...] }`), `{` 로 시작하지 않으면 마크다운 폴백. **렌더 중 throw 하지 않는다**(ErrorBoundary 가 없다). 본문 6만 자 제한 — 이미지는 data URI 로 넣지 않는다.

## 커밋

작성자 `psunggu <psunggu@users.noreply.github.com>`. 메시지는 한국어 또는 영어 명령형 한 줄. 근거가 길면 `docs/HISTORY.md` 에 한 문단.

## 다음 작업 후보 (2026-09-08)

1. **운영자 세 분이 암호를 다시 정한다** — bcrypt 비용 10 은 새로 정한 암호에만 적용된다. `202608200001d_admin_password.template.sql`. 채운 파일은 저장하지 않는다.
2. **옛 정적 파일 삭제** — `app/public/{index.html,app.js,notice.html,notice.js}`. 검사기는 이미 안 읽는다.
3. **`kakao-digest` 자동 내보내기 복구** — `last_run.json` 이 `export-failed · 채팅방 창을 찾지 못함`(2026-09-04).
4. **구글폼 자동 생성**(`apps-script/Code.gs`) — 할지 말지부터 정한다. 손으로 만든 폼이 이미 한 바퀴 돌았다.

## AI 에이전트 역할

**Claude Code 가 구현과 배포를 담당한다** — 코드 · 콘텐츠 수정, 공식 출처 확인, 검증, 커밋 · PR · 배포. **Codex 는 선택적 2차 검토**로 사용자가 직접 부른다. `AI_COLLABORATION.md` 는 역할이 바뀌기 전 문서라 참고만 한다. 공식 행사 정보와 배포 여부의 최종 판단은 공식 출처와 저장소 상태를 다시 확인한 뒤 한다.
