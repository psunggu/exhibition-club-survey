# HISTORY.md — 결정의 근거와 이력

> `AGENTS.md` 에서 2026-09-08 에 옮겨 왔다. 규칙은 `AGENTS.md` 에, **왜 그렇게 정했는지와 무슨 일이 있었는지**는 여기에 적는다.
> 세션마다 읽히는 문서가 아니다. 규칙의 이유가 궁금할 때 연다.

## 이식 — 옛 정적 페이지에서 SPA 로 (2026-08)

- 원래는 `app/public/index.html + app.js + styles.css`(보드) 와 `notice.html + notice.js + notice.css`(일정) 두 장의 정적 페이지였고, `main` 에 푸시하면 `app/public/` 이 그대로 Pages 로 나갔다.
- 2026-08 에 Vite + React 해시 라우팅 SPA 로 옮겼고 배포도 `dist/` 로 바뀌었다. 옛 페이지는 배포되지 않게 됐지만 **검사기 여섯이 그 파일을 「원본」으로 읽어** 지우지 못했다 — 화면 대조(`compare-with-legacy` · `compare-visible-text`), 보드 이식 대조(`validate-board-parity`), 정리봇 사본 대조(`validate-weekly-digest` 의 `notice.js` `FALLBACK_DIGEST`), 읽기 전용 검사(`validate-supabase-readonly` 의 `app.js`), 텔레그램 발송(`send-telegram-update.js` 가 `app.js` 배열을 파싱).
- 그 결과 영화 순위를 갈 때마다 죽은 파일 두 곳(`app.js` 의 `boardUpdatedAt`, `index.html` 본문)을 함께 고쳤고, 정리봇은 JSON 과 `notice.js` 사본을 둘 다 고쳤다. 「두 곳에 데이터가 있으면 반드시 어긋난다」 를 검사기가 강제하는 모양이었다.
- 일정 화면은 2026-08-30 에 옛 화면 대조에서 먼저 뺐다 — 옛 페이지는 일정이 손으로 박힌 채 얼어 있어 모임이 완료될 때마다 정상적인 변화를 실패로 불렀다.
- **2026-09-08 에 나머지도 끊었다.** 검사기 넷과 텔레그램 스크립트를 지우고, 남은 검사기는 옛 파일을 읽지 않게 고쳤다. `styles.css` · `notice.css` 는 `scope-legacy-css.mjs` 의 원본이라 남긴다. `notice.html` 옛 주소는 `vite.config.ts` 가 리다이렉트 스텁을 만들어 살린다.
- 옛 `notice.html` 갱신 절차(카톡 txt 내보내기 → 본문 손으로 수정 → `?v=` 올림 → 푸시, 상단 「업데이트 기준」 배지, 공지용 PNG 별도 제작)는 이제 쓰지 않는다. 같은 일을 `kakao-digest` 와 `scripts/digest-to-public.mjs` 가 한다. 카톡 txt 포맷은 `[이름] [오전/오후 H:MM] 메시지`, 날짜 구분선 `--------------- 2026년 M월 D일 X요일 ---------------`.

## CSP — 무엇이 되고 무엇이 안 되는지 (2026-08-31 Playwright 실측)

프로젝트 CSP 문자열 그대로 잰 결과다.

| 방식 | 결과 |
|---|---|
| React `style={{}}` (CSSOM 프로퍼티 세터) | 된다 — `SurveyChart` 가 이미 쓰는 길 |
| SVG 표현 속성 `<rect width fill>` · `<circle cx r>` | 된다 — style 속성이 아니라 CSP 대상이 아니다 |
| HTML `style="…"` 속성 · `setAttribute('style')` | 막힌다 (`style-src-attr 'none'`) |
| SVG 내부 `<style>` · 동적 `<style>` 주입 | 막힌다 |

- 유튜브 iframe: `frame-src` 가 없어 `default-src 'self'` 로 폴백돼 막힌다. 열려면 `frame-src https://www.youtube-nocookie.com https://www.youtube.com` 한 줄이지만 **그 실수를 잡는 검사기가 없다** — `validate-csp-build` 는 dist 의 `.html` · `.css` 만 읽어 React 가 만드는 iframe 을 못 보고, CSP meta 가 있는지만 본다. 빠뜨려도 `npm run check` 는 초록불이고 회원 화면에서만 죽는다. 바깥으로 나가는 `<a href>` 는 CSP 가 막지 않는다 — 영상은 그 길로 보낸다.
- meta 의 `frame-ancestors` 는 브라우저가 무시한다(실측). meta 에서 무시되는 것은 `report-uri` · `frame-ancestors` · `sandbox` 셋. 여섯 파일에 적혀 있지만 전부 무효고 GitHub Pages 는 응답 헤더를 못 붙여 고칠 길이 사실상 없다. 같은 meta 에서 `frame-src` 는 정상 동작한다.

## 디자인 토큰과 여백 눈금 (2026-08-30)

- 팔레트는 중립 8 · 브랜드 3 · 상태 4 로 열다섯. 색은 상태만 말한다 — 갈래(전시·공연·영화 / 설문 갈래)를 색으로 나누던 것을 그만두고 글자로 적기로 했다.
- 여백 눈금 4 · 8 · 12 · 16 · 22 · 32 는 **새로 쓰는 값에만** 적용한다. 기존 336곳은 눈금 밖이지만 손대지 않기로 했다. 대부분이 `10px` · `14px` 인데, 올리면 375px 에서 넘칠 위험이 있고 내리면 화면이 빡빡해진다 — 회원에게 안 보이는 이득을 위해 공개 화면 전체를 2px 씩 움직일 이유가 없다고 보았다. 고칠 일이 생긴 자리부터 눈금으로 옮긴다.
- 서체는 Pretendard 한글 서브셋 woff2 다섯 굵기(400 · 600 · 700 · 800 · 900, 합계 1.35MB, SIL OFL 1.1). CSP 가 CDN 을 막으므로 파일을 저장소에 넣었다.

## `club` 스키마 규칙 정정 (2026-08-31)

원문은 「새로 만드는 것은 전부 `club` 스키마, `public` 에 새 표를 만들지 않는다」 였다. **실제로는 이 저장소에 `club` 객체가 하나도 없고 표 열 개가 전부 `public` 에 있다** — `surveys` · `survey_options` · `survey_responses` · `survey_choices` · `survey_admins` · `survey_notes` · `survey_members` · `survey_probe_log` · `admin_guides` · `events`. 규칙과 코드가 정반대였고, 규칙을 믿고 작업하면 매번 어긋났다.

그 규칙은 플랫폼 저장소(`exhibition-club-platform`)의 회원·모임 스키마에 해당한다. 마이그레이션 원본도 거기 `supabase/migrations/` 에 있다. 이 저장소에서는 새 표도 `public` 에 만든다 — `club` 은 PostgREST 에 노출돼 있지 않아 스키마를 새로 여는 설정 변경이 필요하고, 옆의 설문 표들과 갈라 놓을 이유가 없다. **스키마 이름이 아니라 잠그는 방식이 안전을 만든다.**

## 운영자 관문 — #83 과 #129 (2026-08-28 ~ 09-05)

- 암호를 받는 함수 열아홉이 모두 첫 줄에서 `public.survey_admin_ok(p_password)` 를 부른다(2026-09-05 에 셈). 그래서 `survey_admin_ok` 하나가 관문이고, 거기 검사를 걸면 열아홉이 함께 걸린다 — 열아홉 곳에 복사하면 언젠가 한 곳이 빠지고, 빠진 곳은 조용하다.
- #83(`202608280003a`)은 bcrypt 비용을 6 → 10 으로 올리고 「휘발성을 바꾸면 GET 이 막힌다」 고 적었다. **이 배포에서는 사실이 아니었다.** `alter function … volatile` 로는 GET 이 막히지 않는다 — 읽기 전용 트랜잭션으로 돌 뿐이다. 근거: `survey_response_count` 는 휘발성 선언이 없어 기본값 VOLATILE 인데 GET 으로 200 을 낸다. `OPTIONS` 의 `Allow` 도 늘 `GET, HEAD, POST, OPTIONS` 다. GET 요청 안에서 `transaction_read_only` 가 `on` 인 것까지 확인했다. `notify pgrst, 'reload schema'` 도 프로젝트 재시작도 바꾸지 못했다 — 캐시 문제가 아니었고, 그 둘로 시간을 썼다.
- `pg_proc` 을 보는 확인 질의는 「DB 가 바뀌었나」 에만 답한다. #83 은 그 질의가 초록불인 채로 아무것도 막지 못했다. API 동작을 바꾸는 마이그레이션은 바깥에서 실제 요청을 쏴서 확인한다.
- 실제로 막은 것은 `request.method` 를 직접 보는 #129(`202609050002a`)다. 첫머리에서 `current_setting('request.method', true)` 가 POST 가 아니면 raise 한다. GET · HEAD 는 인자를 URL 에 싣고, URL 은 로그·브라우저 기록·Referer 에 남는다. `request.method` 가 NULL 이면(SQL Editor · psql · 함수 안) 막지 않는다. 둘 다 운영 DB 에 적용했고 바깥에서 확인했다 — GET 은 `401 · 이 함수는 POST 로만 부를 수 있습니다`, POST 는 정상.
- 비용 10 은 **다시 정한 암호에만** 적용된다. 이미 저장된 해시는 6 그대로다. 운영자 세 분이 `202608200001d_admin_password.template.sql` 을 채워 다시 정해야 한다. 채운 파일은 저장하지 않는다.

## 보드를 걸렀다가 되돌린 일 (2026-09-05)

청소년 관람불가와 공포·호러를 자동으로 막고(#125), 장르로는 안 잡히는 《경주기행》 을 손으로 뺐다(#126). 그랬더니 다음 작품이 또 걸렸고 어디서 멈출지 기준이 서지 않아 전부 되돌렸다(#127). 영화진흥위원회 집계를 그대로 비추고 무엇을 볼지는 회원이 판단한다 — 판단 재료(관람등급·장르·상영시간·감독·줄거리)는 카드에 있다. 다시 거르기로 한다면 왜 거르는지와 어디서 멈추는지부터 정한다. 지운 코드는 #125 · #126 에 남아 있다.

## 일정 자료의 자동화 이력

- 2026-08-31 까지 `AGENTS.md` 에 8월 일정을 손으로 적어 두었는데 모임이 끝나도 갱신되지 않아 두 달 가까이 틀린 채로 있었다. 그 뒤로 일정은 `meetups.ts` 만 정본이다.
- 「완료된 모임」 해 → 달 묶음(2026-08-31), 달력 격자 `monthsToShow` · `pastMonthsToShow`(2026-09-03), 관람일이 지나면 자동 완료 `isDone` · `shownKind`(2026-09-05) 순으로 손으로 적던 것을 뺐다. 자동 완료 전에는 `'conf'` → `'done'` 을 잊으면 그 모임이 완료 목록에도 예정 목록에도 없이 사라졌고 검사기가 14일 뒤에야 알려 줬다. 그 14일 규칙은 잡을 것이 없어져 뺐다.
- 7월 두 건의 `regular` 를 2026-08-21 에 false 로 두었다가 2026-08-30 에 true 로 되돌렸다. 달력 색 규칙이 정기/수시 두 갈래로 바뀌면서 지난 달력이 뒤집히는 폭이 작아졌고, 같은 것을 같게 그리는 쪽을 택했다.
- 스페인전은 2026-09-05 에 `TENTATIVE` 에서 뺐다. 운영자가 동호회 일정으로 잡지 않고 각자 보기로 했기 때문이다 — 조율할 것이 없는 줄을 「조율 중」 아래 두면 회원이 기다리게 된다.
- 2026-09-08 에 새 항목의 필수 필드를 줄였다(`withDefaults`). 날짜 표기 · 상태 딱지 · 지도 링크는 다른 칸에서 나오는 값이라 손으로 적을수록 어긋날 자리만 늘었다.

## 검사기가 클래스 이름을 짚다가 엉뚱한 것을 누른 일

`validate-survey-admin-ui` 는 `.admin-card` · `.note*` 같은 이름을 차례로 짚어 「몇 번째 설문」 을 고른다. 새 화면이 같은 이름을 쓰면 엉뚱한 것을 누른다 — 실제로 두 번 겪었다(`.admin-card` → 소식이 0번이 됨, `.note` → 가이드가 메모로 잡힘). 그래서 새 구역은 새 이름(`.admin-news-card` · `.admin-guide*` · `.gdoc-*`)을 쓰고, 모양이 같으면 CSS 규칙에 선택자만 더한다.

## 보드 소식 한 줄 (2026-08-30)

- 지역을 타지 않는다. `filterEvents` 를 거치면 `eventArea` 가 서울로 떨어뜨려 경기·인천 탭에서 사라지므로 `events` 원본에서 뽑는다.
- JSX 는 `.exhibition-page` 안에 둔다. `.app-shell` 이 flex column 이고 그 안이 `order:1` 이라, 밖에 형제로 두면 order 없는 구역이 목록 위로 튀어 오른다.
- 기한을 날짜가 아니라 며칠(1~180)로 받는 이유: 잊었을 때 사라지는 쪽이 낫다 — 실패 모드가 「카드가 없다」 이지 「3주 전 소식이 상단에 박혀 있다」 가 아니다.

## 구글 설문 갈래 (2026-08-30)

- 2026-08-23~26 운영 설문(17분 → n=20 까지 갱신)은 구글 폼을 손으로 만들어 돌렸다. 결과는 `#/survey/google` 과 `survey-result.html` 에 있다. `apps-script/Code.gs` 의 자동 생성분은 아직 가동한 적이 없다.
- `google` 은 화면에만 있는 갈래라 `surveys` 행으로 존재한 적이 없고 DB 의 `surveys_category_check` 도 그 값을 모른다. 그래서 `SurveyCategory`(다섯)와 `TabCategory`(여섯)를 합치지 않는다.
- `etc`(기타)는 `toCategory` 가 모르는 값을 받아 주는 안전망이다 — 갈래를 더 만들면 옛 번들을 쓰는 회원 화면에서 그 설문이 전시 탭에 섞이지 않고 「기타」 에 뜬다.

## 운영진 전용 분석 가이드 (2026-08-31)

- 본문에 참여 빈도별 집단 구분 · 미응답자 수 · 자유서술 인용이 들어가는데 공개 화면 금지 항목이다. 번들도 공개 저장소의 `.sql` 도 공개라 거기 적으면 암호가 가림막이 된다. 그래서 운영자가 화면에서 붙여 넣고 잠긴 표 `admin_guides` 에만 산다.
- 렌더러(`GuideDoc.tsx`)에 「코어」 · 「주변부」 같은 도메인 문구를 적으면 공개 번들에 실린다. `validate-survey-ui` 가 `dist/assets/*.js` 를 grep 해 도메인 문구가 없음을 기계로 보증한다.
- 저장소에 ErrorBoundary 가 없어 렌더 중 throw 하면 운영자 화면 전체가 하얗게 죽는다. 그래서 파싱은 컴포넌트 안 try/catch 다.
- 저장 함수가 본문을 6만 자로 제한한다. 40KB PNG 는 data URI 로 약 54,000자라 예산을 거의 다 삼킨다 — 지표는 숫자에서 SVG 로 그린다.

## 톡방 투표를 옮겨 올 때 (2026-08-27)

| 하는 일 | 어디서 |
|---|---|
| 컬럼·제약·방아쇠 | `202608270001a_imported_voters.sql` — 한 번만 실행 |
| 이름 넣기 | `202608270001b_poll_voters.template.sql` 을 채워 운영자가 손으로 실행 |

지켜지는 것 셋: 이름 개수가 `imported_votes` 와 다르면 DB 가 거절한다 · `show_names` 를 켠 설문에만 담을 수 있고 담긴 뒤에 도로 끄는 것도 막힌다 · 표를 받은 후보에 이름이 하나라도 빠지면 화면이 아무 이름도 안 보여 준다. 검사기 셋이 실명 커밋을 막는다 — `validate-repository-hygiene`(추적 파일의 이름 배열), `record-frozen-data`(고정본에서 「회원」 으로 바꿈), `validate-survey-schema`(제약·방아쇠·자리표시자).

## 투표는 톡방에서, 사이트는 결과만 (2026-09-09)

- 회원이 사이트에서 직접 응답하는 갈래를 껐다. 운영자가 투표는 톡방에서 하기로 정했다 — 회원이 이미 거기 있고, 구역번호 · 명부 확인은 참여를 막는 문턱이었다. 「기타」 갈래도 필요 없다고 해서 뺐다.
- 코드는 지우지 않고 `config.js` 의 `selfSurvey: false` 로 끈다. 얼마간 이대로 운영해 보고 필요 없으면 그때 지운다. 검사기(`validate-survey-ui` · `validate-survey-admin-ui`)는 `scripts/self-survey-config.mjs` 로 켠 설정을 끼워 응답 코드를 계속 재고, `validate-survey-ui` 끝에서 꺼진 설정으로 한 번 더 잰다 — 배포되는 것은 꺼진 쪽이라 그쪽을 안 재면 회원 화면은 아무도 안 본 채로 나간다.
- 끄면 무엇이 바뀌나: 달력 카드 「설문 참여하기」 → 「투표 현황」, 배지 「진행 중」 → 「톡방 투표」, 설문 화면은 모든 설문이 결과 화면(이름 칸 · 체크 칸 없음, 열린 것에는 「톡방에서 진행합니다」 안내), 요약 카드 「여기서 고르실 수 있습니다」 → 「현황 보기」, 보드 머리 「설문 참여하기」 → 「투표 결과 보기」, `submitResponse` 는 던진다. 이미 있던 `mirrored`(톡방 투표를 옮겨 온 설문) 흐름을 모든 설문에 적용한 것이라 새 화면은 없다.
- **결과를 옮겨 넣는 길은 아직 SQL 이다**(`202608270001b_poll_voters.template.sql`). 운영자 화면에서 표 수를 적는 자리는 없다 — 다음 할 일. 그때까지 열린 설문은 「투표는 톡방에서 진행 중 · 결과는 마감 뒤 옮겨 적는다」 로 뜬다.
- 「기타」 는 탭 · 주소(`#/survey/etc`) · 운영자 선택지에서 뺐다. 값 `etc` 는 남긴다 — `toCategory` 의 안전망이고 DB 제약도 그 값을 안다. `etc` 로 남은 설문은 회원 탭에는 없고 운영자 목록에서만 보인다. 옛 `#/survey/etc` 링크는 「그런 화면은 없습니다」 로 떨어진다.
- 같은 날 9월 식사 장소가 운영자 결정으로 정해졌다(꽃누리들밥 경복궁점 · 인원은 적지 않는다). 요약 카드의 그 줄은 `decidedBy`(설문이 정함)에서 `value`(손으로 정함)로 바꿨고, `from` 도 두지 않았다 — 있으면 「N명 중 M명」 이 붙는다. `validate-survey-ui` 의 「설문 상태 다섯 가지」 는 그 줄에 `decidedBy` 가 있을 때만 돌고, 없으면 손으로 정한 값이 그대로 나오는지 · 투표 중이라 하지 않는지 · 인원을 안 적는지를 대신 잰다. 코드는 남아 있어 다음 모임에서 `decidedBy` 를 다시 쓰면 살아난다. 정리봇 공개본의 「식사 장소 조율 중」 두 줄도 함께 걷어 냈다 — 같은 화면에서 한 카드는 정했다 하고 옆 카드는 조율 중이라 하면 안 된다.

## 역할 변경 (2026-08-17)

이전에는 Codex 가 실행, Claude 가 리뷰였다. 그 뒤로 Claude Code 가 구현과 배포를 맡고 Codex 는 사용자가 필요할 때 부르는 2차 검토다. `AI_COLLABORATION.md` 는 옛 역할(Claude 읽기 전용) 기준으로 쓰였다.

## 참고 문서

- `app/README.md` — 배포·설문 세팅 절차. 일부 구버전 설명 포함(config.js 키 구성이 현재와 다름. 현재 config.js 는 supabase 키만 쓴다).
- `app/docs/CODEX_TASK.md` · `CODEX_TASK_20260809.md` · `DESIGN_UNIFY_TASK.md` — 지시서. 역사적 문서.
- `app/docs/kakao_notice.md` — 단톡방 공유문 템플릿.
- `docs/fixtures/sample-members.md` — 가상 회원 예시.
- 소유자 PC: Windows 11, 로컬 클론 `C:\D\Project\exhibition-club-survey`, 정리봇 저장소 `C:\D\Project\kakao-digest`.
