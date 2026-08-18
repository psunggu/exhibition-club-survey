# CLAUDE.md

프로젝트 컨텍스트는 아래 문서가 정본이다. 작업 전에 반드시 읽는다.

@AGENTS.md

이 문서에는 Claude Code 세션에서만 필요한 운영 사항을 적는다. 프로젝트 규칙·구조·일정 현황은 `AGENTS.md`에서 관리하고 여기에 중복해 적지 않는다.

## 세션 시작 루틴

Claude Code 웹·데스크톱 세션이나 다른 기기에서 작업했을 수 있으므로 **로컬 클론이 조용히 뒤처진다.** 실제로 2026-08-09 세션 시작 시 로컬 `main`이 3커밋 뒤처져 있었다. 작업 전 항상 확인한다.

```bash
git fetch origin --prune && git status -sb && git log --oneline main..origin/main
```

관련 저장소인 `C:\D\Project\kakao-digest`도 함께 확인한다. 주간 정리봇 데이터가 그쪽에서 넘어온다.

## 배포 전 검증

빌드 과정이 없고 `package.json`도 없다. `main`에 푸시하면 곧바로 Pages로 나가므로, 푸시 전에 CI(`.github/workflows/validate.yml`)와 같은 검사를 로컬에서 돌린다.

```bash
node scripts/validate-repository-hygiene.mjs && node scripts/validate-weekly-digest.mjs && node scripts/validate-supabase-readonly.mjs && node scripts/validate-supabase-p1.mjs && node --check app/public/app.js && node --check app/public/config.js && node --check app/public/notice.js
```

`validate-weekly-digest.mjs`가 `weekly-digest.public.json`과 `notice.js`의 `FALLBACK_DIGEST` 일치를 검사한다. 둘 중 하나만 고치면 여기서 걸린다 — 이 검사를 우회하지 말고 양쪽을 함께 고친다.

## 검증 스크립트가 잡지 못하는 것

CI가 통과해도 아래는 사람이 확인해야 한다. 공개 페이지라 되돌리기가 늦다.

- **375px 모바일 가로 스크롤** — 회원 대부분이 카톡 링크로 휴대폰에서 연다.
- **캐시 버스팅 `?v=` 누락** — 올리지 않으면 회원 화면에 옛 CSS/JS가 남는다.
- **CSP 위반** — 인라인 `style=`·`<style>`·`<script>`, 외부 CDN. 브라우저 콘솔에만 뜨고 CI는 못 잡는다.
- **달력의 "오늘" 마커** — `notice.js`가 접속 시점 기준으로 동적 계산하므로, 날짜 관련 수정 후에는 실제로 열어서 확인한다.

로컬 확인은 `app/public/notice.html`을 브라우저로 직접 열면 된다.

## 커밋

작성자는 `psunggu <psunggu@users.noreply.github.com>`. Claude가 만든 커밋에는 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` 트레일러를 붙인다.

## 역할

`AGENTS.md`의 「AI 에이전트 역할」을 따른다.
**프로젝트 규칙을 여기에 중복해 적지 않는다.**
