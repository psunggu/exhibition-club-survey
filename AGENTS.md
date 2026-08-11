# AGENTS.md — 프로젝트 컨텍스트 (AI 코딩 에이전트용)

> 최종 갱신: 2026-07-27 (Codex 세션에서 갱신)
> 이 문서는 Codex, Claude Code 등 AI 에이전트가 이어서 개발할 수 있도록 프로젝트 상태를 요약한다.

## 프로젝트 개요

41교구 전시·박물관 동아리 지원 사이트. 구성 요소는 4개:

1. **문화 콘텐츠 공유 보드** — `exhibition_club_codex_package/public/index.html` + `app.js` + `styles.css`. 100주년 기념교회 41교구 전시·박물관 동아리에서 사용하는 서울/경기/인천 탭, 추천 전시·음악공연·영화 목록, 카카오톡 공유문 복사 기능. 이벤트 데이터는 `app.js` 안의 배열에 하드코딩되어 있고 매주 수요일·토요일 22시에 갱신함. Supabase 연동 있음(`config.js`).
2. **모임 일정 공지 페이지** — `public/notice.html` + `notice.css` + `notice.js` (2026-07-21 신규 추가). 카카오톡 단체방 대화를 정리해 만든 8·9월 중심 모임 공지. 상단 `주간 정리봇`은 `public/weekly-digest.public.json`을 기준 데이터로 읽고, 요청 실패 시 `notice.js`의 동일한 공개용 대체 사본을 표시한다. 두 데이터는 검증 스크립트가 일치 여부를 검사한다. 달력의 "오늘" 마커는 notice.js가 접속 시점 날짜로 동적 표시(`data-year`, `data-month`, `.dnum` 매칭). 단톡방에 URL이 공유되어 회원들이 수시로 열람 — 방장이 공지 일정표에 등록함. 아래 "notice 페이지" 절 참고.
3. **Google Form 설문 패키지** — `apps-script/Code.gs`(Form 2개+Sheet 1개 자동 생성), `docs/`, `sheets/` 샘플. 카톡 톡게시판 투표는 데이터 추출이 불가능해서, 참석 설문을 구글폼으로 대체하기 위한 것. **아직 미가동** (config.js에 Form URL 없음).
4. **Telegram 업데이트 스크립트** — `scripts/send-telegram-update.js`. `app.js`의 recommendedEvents를 파싱해 텔레그램으로 주간 추천 목록 발송. `--dry-run` 지원.

## 배포 파이프라인 (중요)

- `main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 **`exhibition_club_codex_package/public/` 폴더를 GitHub Pages 루트로 배포**한다.
- 일정·참여 인원·문구처럼 공개 콘텐츠만 바꾸는 소규모 수정은 검증 후 일반 Git으로 `main`에 직접 커밋·푸시한다.
- 화면 구조나 기능 변경은 별도 브랜치와 PR을 권장한다. Supabase·개인정보·인증·보안 변경은 반드시 별도 브랜치와 PR로 검토한다.
- GitHub CLI(`gh`)는 필수가 아니다. PR 또는 Actions를 터미널에서 관리할 때만 선택적으로 사용하며, 기본 배포는 Git Credential Manager와 일반 Git을 사용한다.
- 라이브 URL:
  - 보드: https://psunggu.github.io/exhibition-club-survey/
  - 공지: https://psunggu.github.io/exhibition-club-survey/notice.html
- `gh-pages` 브랜치는 과거 방식의 잔재. 현재는 Actions 배포만 사용.

## 개발 규칙

- **CSP가 엄격함**: 페이지들이 `<meta http-equiv="Content-Security-Policy">`로 `style-src 'self'`, `script-src 'self'` 등을 선언. **외부 CDN(폰트/JS/CSS), 인라인 `<style>`·`style=` 속성·인라인 `<script>` 사용 금지.** 스타일은 별도 .css, 스크립트는 별도 .js 파일로.
- **캐시 버스팅**: CSS/JS 링크에 `?v=YYYYMMDD-n` 쿼리를 붙이고, 내용 수정 시 버전을 올린다. (예: `notice.css?v=20260721-1`)
- **모바일 우선**: 회원 대부분이 카톡 링크로 휴대폰에서 열람. 375px 폭에서 가로 스크롤 없어야 함.
- **한국어 텍스트 줄바꿈**: `word-break: keep-all` 사용 (음절 단위 줄바꿈 방지).
- **개인정보 최소화**: 이름 외 연락처·생년월일 등 수집·게시 금지. 결제·로그인 기능 없음 (docs/CODEX_TASK.md의 운영 원칙 계승).
- **주간 정리 공개 데이터**: GitHub Pages는 운영진 전용이 아니라 공개 페이지다. 원본 `digest-*.json`을 복사하지 말고, 원문·실명·닉네임·구역번호+이름·개인별 평가를 뺀 `weekly-digest.public.json`과 `notice.js`의 `FALLBACK_DIGEST`만 함께 갱신한다. 배포 전 `node scripts/validate-weekly-digest.mjs`를 실행해 두 값의 일치 여부까지 확인한다.
- 커밋 작성자: `psunggu <psunggu@users.noreply.github.com>`, 커밋 메시지는 영어 또는 한국어 명령형 한 줄.

## notice 페이지 (2026-07-21 추가)

- **데이터 소스**: 카카오톡 단체방 대화 내보내기 txt. 실제 경로는 `kakao-digest`의 Git 제외 로컬 설정에만 보관하며 이 저장소에는 커밋하지 않음(개인정보 포함).
- 갱신 프로세스: 새 txt 내보내기 → 모임 일정(확정/완료/미정) 추출 → notice.html 본문 수정 → `?v=` 버전 업 → main 푸시.
- 상단에 "업데이트 YYYY. M. D. (요일) HH:mm 기준" 배지 필수. PC 내보내기의 최신 날짜 구분선과 해당 날짜의 최신 메시지 시각을 기준으로 한다.
- 같은 내용의 카톡 공지용 PNG 이미지도 로컬에서 별도 제작함 (헤드리스 크롬 스크린샷, 저장소 외부).

### 현재 반영된 일정 (2026-08-06 19:56 기준)

- 확정: **8/15(토) 14:00 세종문화회관 체임버홀 무료 클래식 공연** (참여자 2명, 모집 종료), **8/16(일) 17:00 영등포 타임스퀘어 IMAX 집결·17:30 회차·상영관 안내 종료 20:32 영화 《오디세이》 관람** (영화 러닝타임 172분, 관람비 2만원, 이후 식사·티타임), **8/22(토) 14:50 서울역사박물관 앞 집결, 15:00~17:00 일정** (퀴즈 이벤트, 담당 운영진), **8/29(토) 가우디 서울전** (신사하우스, 시간 확인 중)
- 완료: 7/5 킥오프, 7/11 큐비스트 주말 관람, 7/26 성률 기획전 〈여름을 닮은 우리〉 관람, 7/29 오전 〈큐비스트〉 벙개, 7/29 저녁 식사·〈큐비스트〉 평일 관람
- 9월: 현재 확인된 확정 일정 없음

달력은 전시·공연·영화 모임을 구분해 표시한다. 날짜가 확정되지 않은 영화는
`조율 중 · 미정`에만 두고, 확정된 뒤에 다가오는 확정 모임과 달력에 함께 넣는다.
지난 달력(현재 2026년 7월)은 상단 달력에서 제외하고 `완료된 모임` 아래의
`완료 일정 달력`에 접힌 상태로 둔다.

## 다음 작업 후보 (우선순위 순)

1. **구글폼 설문 가동** — `apps-script/Code.gs`를 Google Apps Script에서 실행(`setupClubSurveySystem`) → 생성된 Form 응답 URL을 `public/config.js`에 추가하고 notice/index에 버튼 연결. 질문 구성은 `docs/google_form_questions.md` 참고. 목적: 카톡 투표 대신 참석 데이터를 Sheet로 자동 수집.
2. **index ↔ notice 상호 링크** — notice 하단에는 보드 링크가 이미 있음. 보드(index.html) 쪽에 공지 페이지 링크 추가 검토.
3. **notice 자동 생성** — 카톡 txt 파서(날짜/일정 추출) 스크립트를 만들어 notice.html 본문 갱신을 자동화. txt 포맷: `[이름] [오전/오후 H:MM] 메시지`, 날짜 구분선 `--------------- 2026년 M월 D일 X요일 ---------------`.

## 참고 문서

- `exhibition_club_codex_package/README.md` — 배포·설문 세팅 절차 (일부 구버전 설명 포함: config.js 키 구성이 현재와 다름. 현재 config.js는 sheetUrl/supabase 키 사용)
- `exhibition_club_codex_package/docs/CODEX_TASK.md` — v0.1 최초 작업 지시서 (역사적 문서)
- `exhibition_club_codex_package/docs/kakao_notice.md` — 단톡방 공유문 템플릿

## 로컬 환경 (참고)

- 소유자 PC: Windows 11, 로컬 클론 `C:\D\Project\exhibition-club-survey`
- Node.js 스크립트는 `node scripts/send-telegram-update.js --dry-run`으로 검증
- 정적 사이트라 빌드 과정 없음. 로컬 확인은 `public/index.html`·`notice.html`을 브라우저로 직접 열면 됨

## Codex·Claude 협업 역할

- 공통 협업 절차와 산출물 형식은 저장소 루트의 `AI_COLLABORATION.md`를 따른다.
- **Codex는 실행 담당**이다: 실제 코드·콘텐츠 수정, 공식 출처 확인, 검증 실행, 변경 범위 검토, Git 커밋·PR·배포를 담당한다.
- **Claude는 리뷰 담당**이다: 변경사항 리뷰, 한국어 문구 검토, 일정 정보의 내부 정합성 확인, 개선 제안을 담당한다.
- Claude는 사용자의 별도 지시가 없는 한 파일 수정, `git add`, 커밋, 브랜치 변경, stash, reset, push, PR 병합 및 배포를 하지 않는다.
- 공식 행사 정보와 배포 여부의 최종 판단은 Codex가 현재 공식 출처와 저장소 상태를 다시 확인한 뒤 수행한다.
- 같은 작업 폴더에서 리뷰할 때 Codex는 리뷰 대상 diff를 고정하고, Claude의 리뷰가 끝날 때까지 해당 파일을 추가 수정하지 않는다.
