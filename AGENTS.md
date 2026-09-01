# AGENTS.md — 프로젝트 컨텍스트 (AI 코딩 에이전트용)

> 최종 갱신: 2026-08-31 (보드 소식 · 구글 설문 갈래 · 운영진 분석 가이드 · 완료 모임 해·달 묶음)
> 이 문서는 Codex, Claude Code 등 AI 에이전트가 이어서 개발할 수 있도록 프로젝트 상태를 요약한다.

## 프로젝트 개요

41교구 전시·박물관 동아리 지원 사이트. 구성 요소는 8개:

1. **문화 콘텐츠 공유 보드** — `app/public/index.html` + `app.js` + `styles.css`. 100주년 기념교회 41교구 전시·박물관 동아리에서 사용하는 서울/경기/인천 탭, 추천 전시·음악공연·영화 목록, 카카오톡 공유문 복사 기능. 이벤트 데이터는 `app.js` 안의 배열에 하드코딩되어 있고 매주 수요일·토요일 22시에 갱신함. Supabase 연동 있음(`config.js`).
2. **모임 일정 화면** — SPA 라우트 `#/calendar` (`app/src/Calendar.tsx`). 2026-08 이식 전에는 `app/public/notice.html` + `notice.css` + `notice.js` 였고, 그 파일들은 지금도 **지우면 안 된다** — `notice.css` 는 `legacy-notice.css` 의 원본이고(생성기가 만든다), `notice.html` · `notice.js` 는 `validate-weekly-digest` · `validate-board-parity` 가 읽는다. 다만 **일정 화면은 2026-08-30 에 `compare-with-legacy` · `compare-visible-text` 대조에서 뺐다** — 옛 페이지는 일정이 손으로 박힌 채 얼어 있어서, 모임이 완료될 때마다 정상적인 변화를 실패로 부르기 때문이다. 이유는 그 스크립트 안에 적어 두었다. 상단 `주간 정리봇`은 `weekly-digest.public.json`을 읽고, 실패 시 동일한 공개용 대체 사본을 표시한다. 두 데이터는 검증 스크립트가 일치 여부를 검사한다. 단톡방에 URL이 공유되어 회원들이 수시로 열람 — 방장이 공지 일정표에 등록함. 아래 "notice 페이지" 절 참고.
3. **Google Form 설문 패키지** — `apps-script/Code.gs`(Form 2개+Sheet 1개 자동 생성), `docs/`, `sheets/` 샘플. 카톡 톡게시판 투표는 데이터 추출이 불가능해서, 참석 설문을 구글폼으로 대체하기 위한 것. **자동 생성분은 아직 미가동** (config.js에 Form URL 없음). 다만 **구글 폼 자체는 손으로 만들어 이미 한 번 돌렸다** — 2026-08-23~26 운영 설문(17분 응답). 그 결과가 아래 6·8번이다.
4. **Telegram 업데이트 스크립트** — `scripts/send-telegram-update.js`. `app.js`의 recommendedEvents를 파싱해 텔레그램으로 주간 추천 목록 발송. `--dry-run` 지원.
5. **설문 결과 회신 페이지(회원용)** — `app/public/survey-result.html` + `survey-result.css`, 정적 파일이며 `#/calendar` 화면의 카드에서 들어간다. 2026-08 운영 설문의 **집계 숫자만** 싣는다. 이름·자유서술 원문·참여 빈도별 집단 구분·미응답자 수는 넣지 않는다 — 공개 페이지라 회원이 자기 얘기로 읽을 수 있는 것은 전부 뺐다.
6. **보드 소식 한 줄** — 보드 목록 머리글 아래에 문화예술 소식(영상·기사) 하나를 링크로 건다.
   `public.events` 의 `type = '소식'` 행이고, 운영자 화면에서 올리고·고치고·지운다.
   아래 「보드 소식」 절 참고.
7. **구글 설문 결과 갈래** — 설문 화면의 여섯째 탭 `#/survey/google`. 구글 폼으로 받은 회차를
   모아서 센 숫자로 보여 주고, 자세한 집계는 5번 페이지로 넘긴다. 회차 자료는
   `app/src/data/googleSurveys.ts`. **이 갈래는 투표를 받지 않는다** — DB 갈래가 아니다.
   아래 「구글 설문 갈래」 절 참고.
8. **운영진 전용 분석 가이드** — 구글 설문 회차마다 딸리는 긴 분석 문서. 운영자 화면에서만
   보이고, 본문은 **저장소가 아니라 잠긴 표 `public.admin_guides`** 에만 산다.
   아래 「운영진 전용 분석 가이드」 절 참고.

## 배포 파이프라인 (중요)

- `main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 **`npm run build` 산출물인 `dist/`를 GitHub Pages 루트로 배포**한다. (2026-08 이식 완료. 그 전에는 `app/public/`을 그대로 올렸다.)
- **`app/public/`은 `publicDir`이 아니다.** Vite는 `root: 'app'`으로 돌고, `app/public`의 파일은 `vite.config.ts`의 `copyLiveAssets` **allowlist에 이름을 적은 것만** `dist/`에 실린다. 새 정적 파일을 넣고 목록에 안 적으면 빌드는 통과하고 **배포된 사이트에서만 404**가 난다. 선례: `meal-review.html`, `survey-result.html`.
- 화면은 해시 라우팅 SPA다 (`app/src/lib/router.ts`). 카카오톡 인앱 브라우저 때문에 해시를 쓴다 — 히스토리 API 방식으로 바꾸지 않는다. 라우트는 아홉이다:
  `#/`(보드) · `#/calendar`(일정) · `#/survey`(관람 장소) · `#/survey/datetime` ·
  `#/survey/meal` · `#/survey/club` · `#/survey/google` · `#/survey/etc` · `#/survey/admin`
- 옛 주소 `notice.html`은 단톡방에 이미 뿌려져 있어서, 빌드가 `#/calendar`로 넘기는 리다이렉트 스텁을 대신 만들어 둔다. 이 스텁을 지우면 옛 링크가 죽는다.
- 일정·참여 인원·문구처럼 공개 콘텐츠만 바꾸는 소규모 수정은 검증 후 일반 Git으로 `main`에 직접 커밋·푸시한다.
- 화면 구조나 기능 변경은 별도 브랜치와 PR을 권장한다. Supabase·개인정보·인증·보안 변경은 반드시 별도 브랜치와 PR로 검토한다.
- GitHub CLI(`gh`)는 필수가 아니다. PR 또는 Actions를 터미널에서 관리할 때만 선택적으로 사용하며, 기본 배포는 Git Credential Manager와 일반 Git을 사용한다.
- 라이브 URL:
  - 보드: https://psunggu.github.io/exhibition-club-survey/
  - 일정: https://psunggu.github.io/exhibition-club-survey/#/calendar (옛 `notice.html` 주소는 여기로 넘어간다)
  - 설문 결과 회신(회원용): https://psunggu.github.io/exhibition-club-survey/survey-result.html
- `gh-pages` 브랜치는 과거 방식의 잔재. 현재는 Actions 배포만 사용.

## 개발 규칙

- **CSP가 엄격함**: 페이지들이 `<meta http-equiv="Content-Security-Policy">`로 `style-src 'self'`, `script-src 'self'` 등을 선언. **외부 CDN(폰트/JS/CSS), 인라인 `<style>`·`style=` 속성·인라인 `<script>` 사용 금지.** 스타일은 별도 .css, 스크립트는 별도 .js 파일로.
  - **무엇이 되고 무엇이 안 되는지는 2026-08-31 에 Playwright 로 실측했다** (프로젝트 CSP 문자열 그대로):
    | 방식 | 결과 |
    |---|---|
    | React `style={{}}` (CSSOM 프로퍼티 세터) | **된다** — `SurveyChart` 가 이미 쓰는 길 |
    | SVG 표현 속성 `<rect width fill>` · `<circle cx r>` | **된다** — style 속성이 아니라 CSP 대상이 아니다 |
    | HTML `style="…"` 속성 · `setAttribute('style')` | **막힌다** (`style-src-attr 'none'`) |
    | SVG 내부 `<style>` · 동적 `<style>` 주입 | **막힌다** |
    지표·차트는 위 두 가지로만 그린다. 반복 스타일은 `.css` 클래스로.
  - **유튜브 등 iframe 임베드는 안 한다.** `frame-src` 가 없어 `default-src 'self'` 로 폴백되므로
    막힌다. 열려면 `frame-src https://www.youtube-nocookie.com https://www.youtube.com` 한 줄이면
    되지만 **그 실수를 잡아 줄 검사기가 없다** — `validate-csp-build` 는 dist 의 `.html`·`.css` 만
    읽어 React 가 만드는 iframe 을 못 보고, CSP meta 가 「있는지」만 보고 내용은 안 본다.
    빠뜨려도 `npm run check` 는 초록불이고 회원 화면에서만 죽는다. 바깥으로 **나가는** `<a href>` 는
    부르는 것이 아니라 가는 것이라 CSP 가 막지 않는다 — 영상은 그 길로 보낸다.
  - **meta 의 `frame-ancestors` 는 브라우저가 무시한다** (실측 확인). meta 에서 무시되는 것은
    `report-uri` · `frame-ancestors` · `sandbox` 셋이다. 여섯 파일에 적혀 있지만 전부 무효고,
    GitHub Pages 는 응답 헤더를 못 붙여 고칠 길이 사실상 없다. **막고 있다고 믿지 말 것.**
    (같은 meta 에서 `frame-src` 는 정상 동작한다 — 둘을 섞지 않는다.)
- **캐시 버스팅**: CSS/JS 링크에 `?v=YYYYMMDD-n` 쿼리를 붙이고, 내용 수정 시 버전을 올린다. (예: `notice.css?v=20260721-1`)
- **모바일 우선**: 회원 대부분이 카톡 링크로 휴대폰에서 열람. 375px 폭에서 가로 스크롤 없어야 함.
- **한국어 텍스트 줄바꿈**: `word-break: keep-all` 사용 (음절 단위 줄바꿈 방지).
  `styles.css`·`notice.css` 의 `body` 에 걸어 두었으므로 낱낱의 규칙에 다시 적을 필요는 없다.
- **색·모서리·그림자·서체는 `app/public/tokens.css` 한 곳에만 적는다.** 다른 CSS 는 `var(--…)` 로
  참조만 한다. 팔레트는 중립 8 · 브랜드 3 · 상태 4 로 열다섯이고, **여기 없는 색을 새로 만들지 않는다.**
  - 색이 말하는 것은 **상태**뿐이다. 갈래(전시·공연·영화 / 설문 갈래)는 색으로 나누지 않고 글자로 적는다.
  - `--warn` 은 「확인 필요」, `--stop` 은 「마감·오류」 전용이다. 다른 뜻에 쓰면 색이 글자를 부정한다.
  - 세 화면에 닿는 길: 옛 정적 페이지는 `tokens.css` 를 `<link>` 하고, SPA 는
    `scripts/scope-legacy-css.mjs` 가 두 스코프로 한 벌씩 복사해 생성물 앞에 붙인다.
    설문 화면의 body 클래스는 `calendar-page` 라 그쪽 한 벌을 같이 쓴다.
- **여백은 4 · 8 · 12 · 16 · 22 · 32 눈금을 쓴다 — 새로 쓰는 값에만 적용한다.**
  기존 336곳은 눈금 밖이지만 손대지 않기로 했다 (2026-08-30). 대부분이 `10px`·`14px` 인데,
  올리면 375px 에서 넘칠 위험이 있고 내리면 화면이 빡빡해진다 — 회원에게 안 보이는 이득을 위해
  공개 화면 전체를 2px 씩 움직일 이유가 없다고 보았다. 고칠 일이 생긴 자리부터 눈금으로 옮긴다.
- **서체는 저장소 안에 있다**: `app/public/fonts/` 의 Pretendard 한글 서브셋 woff2 다섯 굵기
  (400·600·700·800·900 · 합계 1.35MB · SIL OFL 1.1, `OFL.txt` 동봉). CSP 가 CDN 을 막으므로
  파일을 넣는다. `@font-face` 는 `tokens.css` 에 있다.
  - **새 정적 파일을 `app/public/` 에 넣으면 `vite.config.ts` 의 `copyLiveAssets` 목록에도 적는다.**
    안 적으면 빌드는 통과하고 **배포된 사이트에서만 404** 가 난다.
- **개인정보 최소 수집**: 회원에게 받는 것은 **이름 · 소속 구역** 둘뿐이다.
  - **연락처 컬럼을 어떤 앱 테이블에도 만들지 않는다** (`email`·`phone` 모두).
  - 주소·생년월일·계좌번호·주민등록번호는 어떤 경우에도 만들지 않는다.
  - 항목을 늘리려면 개인정보 처리방침 갱신과 **재동의**까지 함께 계획한다.
- **이메일은 읽는 경로 자체를 만들지 않는다**: 로그인 수단으로 Supabase Auth(`auth.users`)에
  남는 것이 전부다. `profiles`에 복사하지 않고, 운영진 화면·명부·내보내기 어디에도 띄우지 않는다.
  단체 메일 발송 기능은 **만들지 않는다**(R-07-03) — 카톡 오픈방이 그 자리를 대신한다.
  `auth.users`를 읽는 기능을 새로 만들자는 제안이 나오면 그 자체를 되묻는다.
- **결제 기능 없음**: 관람료·회비는 **기록만** 한다. 송금은 시스템 밖이다.
  계좌번호는 어떤 형태로도 저장하지 않는다 (D-21).
- **회원 식별**: DB 기본키는 `auth.users.id`(UUID)다. 교회 교적부 규칙(동명이인 등록 순 A/B)은
  **PK가 아니라 유니크 제약**으로 둔다 — `unique (full_name, name_letter)`.
  교적부가 정정되면 그 컬럼만 고치면 되고 참조는 깨지지 않는다.
- **이름 표시**: 화면·게시물은 `구역 + 이름`(3구역 홍길동),
  집계·대조는 `이름 + 문자`(홍길동A). 같은 구역에 동명이인이 있으면 화면에도 문자를 붙이되,
  판단은 코드가 한다.
- **인증**: 카카오 OAuth + 이메일 매직링크. **비밀번호는 만들지 않는다.**
  가입은 운영진 승인제(`status = pending` → `approved`)이고,
  승인 시 운영진이 교적부와 대조해 구분 문자를 지정한다.
- **실제 회원 데이터**: 저장소·테스트 픽스처·문서·외부 도구에 넣지 않는다.
  예시가 필요하면 `docs/fixtures/sample-members.md`를 쓴다.
- **번들은 공개다**: 로그인 뒤 화면이라도 코드는 누구나 내려받는다.
  회원 이름, 구역 목록, 운영진 명단, 내부 URL을 소스에 하드코딩하지 않는다.
  화면에 보일 모든 데이터는 RLS를 통과한 API 응답으로만 온다.
- **`club` 스키마 규칙은 이 저장소 것이 아니다 (2026-08-31 정정).**
  원문은 「새로 만드는 것은 전부 `club` 스키마, `public` 에 새 표를 만들지 않는다」였다.
  **실제로는 이 저장소에 `club` 객체가 하나도 없고 표 열 개가 전부 `public` 에 있다** —
  `surveys` · `survey_options` · `survey_responses` · `survey_choices` · `survey_admins` ·
  `survey_notes` · `survey_members` · `survey_probe_log` · `admin_guides` · `events`.
  규칙과 코드가 정반대였고, 규칙을 믿고 작업하면 매번 어긋난다.
  - 그 규칙은 **플랫폼 저장소(`exhibition-club-platform`)** 의 회원·모임 스키마에 해당한다.
    마이그레이션 원본도 거기 `supabase/migrations/` 에 있다.
  - **이 저장소에서는 새 표도 `public` 에 만든다.** `club` 은 PostgREST 에 노출돼 있지 않아
    스키마를 새로 여는 설정 변경이 필요하고, 옆의 설문 표들과 갈라 놓을 이유가 없다.
    **스키마 이름이 아니라 잠그는 방식이 안전을 만든다** — 아래 「잠긴 표」 규칙을 따른다.
  - **`public.events`**: 보드의 콘텐츠 표이고 회원 개인정보가 아니다. 큐레이션 필드를
    **nullable 컬럼으로** 더한다 (D-24). 한 전시의 정보를 두 표로 나누면
    "두 곳에 데이터가 있으면 반드시 어긋난다"가 형태만 바꿔 돌아온다.
  - 기존 컬럼의 타입·이름을 바꾸거나 지우지 않는다. **더하기만 한다.**
- **잠긴 표 — 운영진만 볼 것을 담는 방법**: 정책을 **하나도 만들지 않고**
  `revoke all … from anon, authenticated` 한 뒤, `security definer` 함수가 암호를 보고 내준다.
  `survey_notes`(설문별 메모) · `admin_guides`(분석 가이드)가 그 꼴이다.
  - 함수 첫 줄에서 `public.survey_admin_ok(p_password)` 를 부른다. **읽기도 예외가 아니다.**
  - `set search_path = pg_catalog, public, extensions` 를 반드시 붙인다.
  - `grant execute … to anon, authenticated` 를 빠뜨리면 함수가 있어도 앱이 못 부른다
    (기본 권한이 revoke 돼 있다 — 202608060001).
  - `validate-survey-schema.mjs` 가 이 넷을 전부 검사한다. 새 표·함수를 만들면
    거기 `LOCKED` 와 `CALLABLE` 목록에 **함께 적는다** — 안 적으면 검사 밖으로 나간다.
- **주간 정리 공개 데이터**: GitHub Pages는 운영진 전용이 아니라 공개 페이지다. 원본 `digest-*.json`을 복사하지 말고, 원문·실명·닉네임·구역번호+이름·개인별 평가를 뺀 `weekly-digest.public.json`과 `notice.js`의 `FALLBACK_DIGEST`만 함께 갱신한다. 배포 전 `node scripts/validate-weekly-digest.mjs`를 실행해 두 값의 일치 여부까지 확인한다.
- 커밋 작성자: `psunggu <psunggu@users.noreply.github.com>`, 커밋 메시지는 영어 또는 한국어 명령형 한 줄.

## notice 페이지 (2026-07-21 추가)

- **데이터 소스**: 카카오톡 단체방 대화 내보내기 txt. 실제 경로는 `kakao-digest`의 Git 제외 로컬 설정에만 보관하며 이 저장소에는 커밋하지 않음(개인정보 포함).
- 갱신 프로세스: 새 txt 내보내기 → 모임 일정(확정/완료/미정) 추출 → notice.html 본문 수정 → `?v=` 버전 업 → main 푸시.
- 상단에 "업데이트 YYYY. M. D. (요일) HH:mm 기준" 배지 필수. PC 내보내기의 최신 날짜 구분선과 해당 날짜의 최신 메시지 시각을 기준으로 한다.
- 같은 내용의 카톡 공지용 PNG 이미지도 로컬에서 별도 제작함 (헤드리스 크롬 스크린샷, 저장소 외부).

### 일정의 정본은 `app/src/data/meetups.ts` 다

여기 일정 목록을 **베껴 적지 않는다.** 2026-08-31 까지 이 자리에 8월 일정을 손으로 적어 두었는데,
모임이 끝나도 갱신되지 않아 두 달 가까이 틀린 채로 있었다 —
"두 곳에 데이터가 있으면 반드시 어긋난다"가 이 문서 안에서 벌어진 것이다.
**지금 무슨 일정이 있는지는 `MEETUPS` 를 읽는다.**

규칙만 여기 적는다:

- 달력은 전시·공연·영화 모임을 구분해 표시한다. 날짜가 확정되지 않은 것은 `TENTATIVE`
  (`조율 중 · 미정`)에만 두고, 확정된 뒤에 `MEETUPS` 로 옮겨 달력과 「다가오는 확정 모임」에 넣는다.
- **「완료된 모임」은 해 → 달로 자동으로 묶인다** (2026-08-31). 날짜에서 뽑으므로 해가 바뀌면
  연도 탭이 저절로 생기고, 가장 최근 달만 펼쳐진다. 손으로 적을 것이 없다.
- **다만 달력 격자는 아직 손으로 적는다** — `MONTHS`(위에 펼치는 달)와 `PAST_MONTHS`
  (「완료 일정 달력」에 접는 달). **달이 바뀌면 사람이 고쳐야 한다.**
  지금 `MONTHS = [2026-08, 2026-09]`, `PAST_MONTHS = [2026-07]` 이라
  **10월이 되면 달력이 8·9월에 멈춘다.** 완료 목록처럼 자동화하는 것이 다음 후보다.
- `kind: 'done'` 인데 `completedRow` 가 비면 그 모임은 완료 목록에도 예정 목록에도 없이
  조용히 사라진다 — `validate-meetup-taxonomy` 가 그것을 잡는다.

## 보드 소식 (2026-08-30 추가)

보드 목록 머리글 아래 **한 줄**. `public.events` 의 `type = '소식'` 행 중 기간이 안 지난 것 하나만 뜬다.

- **고르는 규칙은 `lib/news.ts` 의 `pickNews` 한 곳에 있다.** 보드와 운영자 화면이 같은 함수를 쓴다 —
  갈라지면 운영자 화면의 「보드에 보임」이 거짓말을 한다.
- 지역을 타지 않는다. `filterEvents` 를 거치면 `eventArea` 가 서울로 떨어뜨려
  경기·인천 탭에서 사라지므로 **`events` 원본에서 뽑는다.**
- JSX 는 `.exhibition-page` **안**에 둔다. `.app-shell` 이 flex column 이고 그 안이 `order:1` 이라,
  밖에 형제로 두면 order 없는 구역이 목록 **위로 튀어 오른다.**
- 기한은 날짜가 아니라 **며칠**로 받는다(1~180). 잊었을 때 사라지는 쪽이 낫다 —
  실패 모드가 「카드가 없다」이지 「3주 전 소식이 상단에 박혀 있다」가 아니다.
- 쓰기는 `news_admin_save` · `news_admin_delete` 만. `public.events` 는 anon 에게 select 만
  열려 있고 쓰기 정책·권한을 만들 수 없다(`validate-supabase-readonly` 가 둘 다 금지로 검사).
  두 함수 모두 `type = '소식'` 행에만 닿는다 — **이 조건을 빼면 보드 전체가 사정권에 든다.**

## 구글 설문 갈래 (2026-08-30 추가)

`#/survey/google`. 구글 폼으로 받은 회차를 모아서 센 숫자로 보여 준다.

- **`google` 은 화면에만 있는 갈래다.** 여기서 투표를 받지 않으므로 `surveys` 행으로 존재한 적이 없고
  DB 의 `surveys_category_check` 도 그 값을 모른다.
- 그래서 타입이 둘이다 — `SurveyCategory`(DB 다섯: exhibition·datetime·meal·club·etc)와
  `TabCategory`(= 그 다섯 + google). **합치지 않는다.** 합치면 「저장할 수 있는 값」과
  「탭에 있는 값」이 같다고 타입이 말하게 되는데 사실이 아니다.
- 운영자 화면의 「어느 화면에」 목록은 `POSTABLE_CATEGORY_ORDER`(다섯)를 쓴다.
  `CATEGORY_ORDER`(여섯)를 쓰면 화면에서는 고를 수 있는데 저장에서 서버가 거절한다.
- **`etc`(기타)의 이름을 바꾸지 않는다.** 그 갈래는 `toCategory` 가 **모르는 값을 받아 주는
  안전망**이다 — 나중에 갈래를 더 만들면 옛 번들을 쓰는 회원 화면에서 그 설문이 전시 탭에
  섞이지 않고 「기타」에 뜬다. 이름을 바꾸면 그 설문들이 딴것인 척하게 된다.
- 회차 자료는 `app/src/data/googleSurveys.ts`. **원본 구글 시트 주소를 여기 적지 않는다** —
  번들이 공개라 실명이 든 시트로 가는 길을 누구나 갖게 된다.

## 운영진 전용 분석 가이드 (2026-08-31 추가)

구글 설문 회차마다 딸리는 긴 분석 문서. 운영자 화면에서만 보인다.

- **본문은 저장소에 없다.** 참여 빈도별 집단 구분·미응답자 수·자유서술 인용이 들어가는데,
  그건 공개 화면 금지 항목이다. **번들도 공개 저장소의 `.sql` 도 공개**라 거기 적으면
  암호가 가림막이 된다. 운영자가 화면에서 붙여 넣고 잠긴 표 `admin_guides` 에만 산다.
- **렌더러(`GuideDoc.tsx`)에 도메인 문구를 하드코딩하지 않는다.** 「코어」·「주변부」 같은 말을
  적으면 공개 번들에 실린다. 렌더러는 「규칙」·「근거 —」 같은 **일반 라벨만** 갖고,
  값·문구는 전부 JSON 에서 온다. `validate-survey-ui` 가 `dist/assets/*.js` 를 grep 해
  도메인 문구가 없음을 기계로 보증한다 — 화면 글 검사만으로는 못 잡는다.
- 본문은 **구조화 JSON**(`{ "sections": [...] }`)이고 지표 막대·페르소나 카드·격차 덤벨·편성
  카드로 그려진다. 첫 글자가 `{` 가 아니면 옛 **마크다운 폴백**(`##`·`-`)으로 간다 — 지우지 않는다.
- **렌더 중 절대 throw 하지 않는다.** 저장소에 ErrorBoundary 가 하나도 없어
  던지면 운영자 화면 전체가 하얗게 죽는다. 파싱은 컴포넌트 안 try/catch 로 받아
  오류 배너를 그리고 저장을 막되 화면은 살린다. 모르는 섹션 타입도 폴백으로 그린다.
- 저장 함수가 본문을 **6만 자**로 제한한다. 그래서 래스터 이미지를 data URI 로 넣지 않는다
  (40KB PNG ≈ 54,000자로 예산을 거의 다 삼킨다). 지표는 숫자에서 SVG 로 그린다.

## 검사기가 클래스 이름을 짚는다

`validate-survey-admin-ui` 는 `.admin-card`·`.note*` 같은 이름을 **차례로 짚어** 「몇 번째 설문」을
고른다. 새 화면이 같은 이름을 쓰면 그 검사가 엉뚱한 것을 누른다 — 실제로 두 번 겪었다
(`.admin-card` → 소식이 0번이 됨, `.note` → 가이드가 메모로 잡힘).
**새 구역은 새 이름을 쓰고**(`.admin-news-card`·`.admin-guide*`·`.gdoc-*`),
모양이 같으면 CSS 규칙에 선택자만 더한다.

## 다음 작업 후보 (우선순위 순 · 2026-08-31 갱신)

1. **달력 격자 자동화** — `MONTHS` · `PAST_MONTHS` 가 손으로 박혀 있다. **2026-09-02 에
   실제로 이 일이 났다** — 9월이 되었는데 제목이 「8 · 9월」 로 남아 #111 에서 손으로
   밀었다. 손으로 미는 한 매달 같은 커밋을 반복한다. 「완료된 모임」 목록은 이미 날짜에서
   뽑아 자동으로 도니 같은 방식으로 격자도 뽑는다(이번 달·다음 달을 펼치고 지난 달은 접는다).
   검사가 `frozen-clock.mjs` 로 시각을 고정하므로 그쪽과 함께 봐야 한다.
2. **#83 을 처리한다 (보안 · 최우선)** — 운영자 관문을 굳히는 변경이다. 내용과 근거는
   PR #83 에 있다.

   **이 저장소는 public 이다.** 아직 적용되지 않은 결함의 재현 경로를 여기에 적지 않는다 —
   `main` 의 문서는 늘 보이는 자리이고, 적어 두면 고치기 전까지 안내문이 된다.
   상세는 PR 에서 보고, 여기서는 **아직 안 끝났다는 것**만 기록한다.

   상태 (2026-09-02): 충돌을 풀어 `MERGEABLE/CLEAN` 이고 CI 통과. 머지만으로는 부족하고
   **Supabase 운영 DB 에 마이그레이션을 적용해야** 실제로 닫힌다. bcrypt 비용 상향은
   이미 저장된 해시에 적용되지 않으므로 운영자 세 분이 암호를 다시 정해야 한다.

   같이 열려 있던 나머지는 정리됐다 — #102 는 머지(`26fba14`), #27 · #18 은
   `exhibition_club_codex_package/` 가 사라져 대상 경로가 없으므로 2026-09-02 에 닫았다.
3. **보드 「최종 정보 업데이트」 날짜** — 세 곳(`App.tsx` 의 `SITE_INFO_UPDATED_ON`,
   `app.js` 의 `boardUpdatedAt`, `index.html` 본문)이 함께 움직여야 한다
   (`validate-board-parity` 가 검사). 보드 자료를 갱신할 때 같이 올린다.
4. **구글폼 자동 생성 가동** — `apps-script/Code.gs` 를 Apps Script 에서 실행
   (`setupClubSurveySystem`) → 생성된 Form 응답 URL 을 `public/config.js` 에 추가.
   질문 구성은 `docs/google_form_questions.md`. 목적: 참석 데이터를 Sheet 로 자동 수집.
   (설문 자체는 손으로 만들어 이미 한 번 돌렸고, 그 결과는 `#/survey/google` 에 있다.)
5. **notice 자동 생성** — 카톡 txt 파서(날짜/일정 추출)로 본문 갱신을 자동화.
   txt 포맷: `[이름] [오전/오후 H:MM] 메시지`, 날짜 구분선
   `--------------- 2026년 M월 D일 X요일 ---------------`.
6. ~~index ↔ notice 상호 링크~~ — 완료. 한 앱이 되면서 상단 탭으로 오간다.

## 톡방 투표를 옮겨 올 때 (2026-08-27)

톡방에서 진행한 투표는 사이트에 **결과만** 옮겨 온다. 숫자는
`survey_options.imported_votes`, 투표자 이름은 `survey_options.imported_voters` 에 담는다.

**실명은 저장소에 커밋하지 않는다.** SQL 본문에도, 머리말 주석에도 적지 않는다
(머리말에 원본을 글자 그대로 옮기는 관례가 있는데, 그 관례는 **후보 이름**에만 해당한다).

| 하는 일 | 어디서 |
|---|---|
| 컬럼·제약·방아쇠 | `202608270001a_imported_voters.sql` — 한 번만 실행 |
| 이름 넣기 | `202608270001b_poll_voters.template.sql` 을 채워 **운영자가 손으로** 실행 |

지켜지는 것 셋:

- 이름 개수가 `imported_votes` 와 다르면 DB 가 거절한다
- `show_names` 를 켠 설문에만 담을 수 있다. 담긴 뒤에 도로 끄는 것도 막힌다
- 표를 받은 후보에 이름이 하나라도 빠지면 화면이 **아무 이름도 안 보여 준다**

검사기 셋이 실명 커밋을 막는다 — `validate-repository-hygiene`(추적 파일의 이름 배열),
`record-frozen-data`(고정본에서 「회원」 으로 바꿈), `validate-survey-schema`(제약·방아쇠·자리표시자).

## 참고 문서

- `app/README.md` — 배포·설문 세팅 절차 (일부 구버전 설명 포함: config.js 키 구성이 현재와 다름. 현재 config.js는 sheetUrl/supabase 키 사용)
- `app/docs/CODEX_TASK.md` — v0.1 최초 작업 지시서 (역사적 문서)
- `app/docs/kakao_notice.md` — 단톡방 공유문 템플릿

## 로컬 환경 (참고)

- 소유자 PC: Windows 11, 로컬 클론 `C:\D\Project\exhibition-club-survey`
- Node.js 스크립트는 `node scripts/send-telegram-update.js --dry-run`으로 검증
- 빌드가 있다(Vite + React). 로컬 확인은 `npm run dev` — 일정은 `#/calendar`, 보드는 `#/`. 파일을 브라우저로 직접 여는 방식은 `base` 경로와 해시 라우팅 때문에 더 이상 안 된다.
- 배포 전 검사는 `npm run check` 하나로 돈다(빌드 · CSP · 화면 대조 · 검증기 전부).

## AI 에이전트 역할 (2026-08-17 변경)

**역할이 뒤바뀌었다.** 이전에는 Codex가 실행, Claude가 리뷰였다.

- **Claude Code가 구현과 배포를 담당한다.** 코드·콘텐츠 수정, 공식 출처 확인,
  검증 실행, Git 커밋·PR·배포까지.
- **Codex는 선택적 2차 검토**로만 쓴다. 필요할 때 사용자가 직접 호출한다.
- 협업 절차와 산출물 형식은 `AI_COLLABORATION.md`를 따르되, **역할이 뒤바뀐 것에 유의**한다.
- 공식 행사 정보와 배포 여부의 최종 판단은 공식 출처와 저장소 상태를 **다시 확인한 뒤** 수행한다.
  이 원칙은 담당이 바뀌어도 그대로다.
