# AGENTS.md — 프로젝트 컨텍스트 (AI 코딩 에이전트용)

> 최종 갱신: 2026-07-21 (Claude Code 세션에서 작성)
> 이 문서는 Codex, Claude Code 등 AI 에이전트가 이어서 개발할 수 있도록 프로젝트 상태를 요약한다.

## 프로젝트 개요

41교구 박물관·갤러리 동호회(교회 전시 동호회) 지원 사이트. 구성 요소는 4개:

1. **전시·공연 공유 보드** — `exhibition_club_codex_package/public/index.html` + `app.js` + `styles.css`. 서울/경기/인천 탭, 추천 전시 목록, 카카오톡 공유문 복사 기능. 이벤트 데이터는 `app.js` 안의 배열에 하드코딩되어 있고 매주 월요일 갱신함. Supabase 연동 있음(`config.js`).
2. **모임 일정 공지 페이지** — `public/notice.html` + `notice.css` (2026-07-21 신규 추가). 카카오톡 단체방 대화를 정리해 만든 7·8월 모임 공지. 아래 "notice 페이지" 절 참고.
3. **Google Form 설문 패키지** — `apps-script/Code.gs`(Form 2개+Sheet 1개 자동 생성), `docs/`, `sheets/` 샘플. 카톡 톡게시판 투표는 데이터 추출이 불가능해서, 참석 설문을 구글폼으로 대체하기 위한 것. **아직 미가동** (config.js에 Form URL 없음).
4. **Telegram 업데이트 스크립트** — `scripts/send-telegram-update.js`. `app.js`의 recommendedEvents를 파싱해 텔레그램으로 주간 추천 목록 발송. `--dry-run` 지원.

## 배포 파이프라인 (중요)

- `main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 **`exhibition_club_codex_package/public/` 폴더를 GitHub Pages 루트로 배포**한다.
- 라이브 URL:
  - 보드: https://psunggu.github.io/exhibition-club-survey/
  - 공지: https://psunggu.github.io/exhibition-club-survey/notice.html
- `gh-pages` 브랜치는 과거 방식의 잔재. 현재는 Actions 배포만 사용.

## 개발 규칙

- **CSP가 엄격함**: 페이지들이 `<meta http-equiv="Content-Security-Policy">`로 `style-src 'self'` 등을 선언. **외부 CDN(폰트/JS/CSS), 인라인 `<style>`·`style=` 속성 사용 금지.** 스타일은 반드시 별도 .css 파일로.
- **캐시 버스팅**: CSS/JS 링크에 `?v=YYYYMMDD-n` 쿼리를 붙이고, 내용 수정 시 버전을 올린다. (예: `notice.css?v=20260721-1`)
- **모바일 우선**: 회원 대부분이 카톡 링크로 휴대폰에서 열람. 375px 폭에서 가로 스크롤 없어야 함.
- **한국어 텍스트 줄바꿈**: `word-break: keep-all` 사용 (음절 단위 줄바꿈 방지).
- **개인정보 최소화**: 이름 외 연락처·생년월일 등 수집·게시 금지. 결제·로그인 기능 없음 (docs/CODEX_TASK.md의 운영 원칙 계승).
- 커밋 작성자: `psunggu <psunggu@users.noreply.github.com>`, 커밋 메시지는 영어 또는 한국어 명령형 한 줄.

## notice 페이지 (2026-07-21 추가)

- **데이터 소스**: 카카오톡 단체방("41교구 박물관/갤러리 동호회방") 대화 내보내기 txt. 로컬 PC의 `C:\D\교회\2026년 전시 동호회\txt\`에 보관 (저장소에는 커밋하지 않음 — 개인정보 포함).
- 갱신 프로세스: 새 txt 내보내기 → 모임 일정(확정/완료/미정) 추출 → notice.html 본문 수정 → `?v=` 버전 업 → main 푸시.
- 상단에 "업데이트 YYYY. M. D. (요일) HH:mm 기준" 배지 필수 (txt 저장 시각 기준).
- 같은 내용의 카톡 공지용 PNG 이미지도 로컬에서 별도 제작함 (헤드리스 크롬 스크린샷, 저장소 외부).

### 현재 반영된 일정 (2026-07-21 22:50 기준)

- 확정: 7/29(수) 19:00 퐁피두센터 한화 〈큐비스트〉 평일 관람 (문화의날 14,000원) / 8/8(토) 15:00 서울역사박물관 (퀴즈 이벤트, 담당 김혜정)
- 완료: 7/5 킥오프, 7/11 큐비스트 주말 관람
- 미정: 7/29 오전 벙개, 가우디 서울전(얼리버드 7/31 마감), 성률 기획전, 자율 관람

## 다음 작업 후보 (우선순위 순)

1. **8월 투표 결과 반영** — 서울역사박물관 희망일정 투표가 7/21 종료됨. 최종 공지 확정되면 notice.html 갱신.
2. **구글폼 설문 가동** — `apps-script/Code.gs`를 Google Apps Script에서 실행(`setupClubSurveySystem`) → 생성된 Form 응답 URL을 `public/config.js`에 추가하고 notice/index에 버튼 연결. 질문 구성은 `docs/google_form_questions.md` 참고. 목적: 카톡 투표 대신 참석 데이터를 Sheet로 자동 수집.
3. **index ↔ notice 상호 링크** — notice 하단에는 보드 링크가 이미 있음. 보드(index.html) 쪽에 공지 페이지 링크 추가 검토.
4. **notice 자동 생성** — 카톡 txt 파서(날짜/일정 추출) 스크립트를 만들어 notice.html 본문 갱신을 자동화. txt 포맷: `[이름] [오전/오후 H:MM] 메시지`, 날짜 구분선 `--------------- 2026년 M월 D일 X요일 ---------------`.

## 참고 문서

- `exhibition_club_codex_package/README.md` — 배포·설문 세팅 절차 (일부 구버전 설명 포함: config.js 키 구성이 현재와 다름. 현재 config.js는 sheetUrl/supabase 키 사용)
- `exhibition_club_codex_package/docs/CODEX_TASK.md` — v0.1 최초 작업 지시서 (역사적 문서)
- `exhibition_club_codex_package/docs/kakao_notice.md` — 단톡방 공유문 템플릿

## 로컬 환경 (참고)

- 소유자 PC: Windows 11, 로컬 클론 `C:\D\Project\exhibition-club-survey`
- Node.js 스크립트는 `node scripts/send-telegram-update.js --dry-run`으로 검증
- 정적 사이트라 빌드 과정 없음. 로컬 확인은 `public/index.html`·`notice.html`을 브라우저로 직접 열면 됨
