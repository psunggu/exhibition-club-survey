# CLAUDE.md

프로젝트 규칙은 아래 문서가 정본이다. 작업 전에 읽는다.

@AGENTS.md

이 문서에는 Claude Code 세션에서만 필요한 운영 사항을 적는다. 프로젝트 규칙은 `AGENTS.md`, 결정의 근거와 이력은 `docs/HISTORY.md`, 정기 갱신 절차는 `docs/OPERATIONS.md` 에서 관리하고 여기에 중복해 적지 않는다.

## 세션 시작 루틴

다른 기기나 웹 세션에서 작업했을 수 있어 **로컬 클론이 조용히 뒤처진다.** 작업 전 한 줄로 확인한다.

```bash
git fetch origin --prune && git status -sb && git log --oneline main..origin/main
```

`C:\D\Project\kakao-digest` 는 **정리봇을 갱신할 때만** 본다. 매 세션 볼 필요 없다.

## 세션을 여는 일과 안 여는 일

영화 순위 · 정리봇 · 모임 추가 · 설문 개설은 `docs/OPERATIONS.md` 의 명령 하나로 끝난다. 그 일로 세션을 열었다면 그 명령을 돌리고 끝낸다 — 자료를 읽고 옮겨 적지 않는다.

## 배포 전 검증

`main` 에 푸시하면 곧바로 Pages 로 나간다. 푸시 전에 로컬에서 검사한다.

```bash
npm run check:quick
```

콘텐츠만 바꿨으면 이것으로 충분하다(빌드 · CSP · 위생 · 정리봇 · 픽스처 · 일정 분류 · 설문 스키마 · 읽기 전용 경계). 화면이나 기능을 바꿨으면 전체를 돌린다 — Playwright 화면 검사까지 약 2분이다.

```bash
npm run check
```

출력이 길면 `| tail -20` 으로 잘라 읽는다. 통과 로그를 다 읽을 이유가 없다.

`screens:check` 는 화면이 **의도치 않게** 바뀌었는지 본다. 화면을 일부러 바꿨다면 먼저 `check` 로 어느 화면이 얼마나 달라졌는지 읽고, 그다음 `npm run screens:save` 로 기준을 갱신하고, 무엇이 왜 바뀌었는지 커밋 메시지에 적는다. 콘텐츠 갱신(영화 · 모임)은 예외다 — 바뀌는 것이 정해져 있어 save 가 절차에 들어 있다.

## 검증 스크립트가 잡지 못하는 것

CI 가 통과해도 아래는 사람이 확인한다. 공개 페이지라 되돌리기가 늦다.

- **375px 모바일 가로 스크롤** — 회원 대부분이 카톡 링크로 휴대폰에서 연다.
- **캐시 버스팅 `?v=` 누락** — 올리지 않으면 회원 화면에 옛 CSS/JS 가 남는다.
- **CSP 위반** — 인라인 `style=` · `<style>` · `<script>`, 외부 CDN, React 가 만드는 iframe. 브라우저 콘솔에만 뜬다.
- **달력의 「오늘」 마커** — 접속 시점 기준으로 계산하므로 날짜 관련 수정 뒤에는 실제로 열어 본다.

로컬 확인은 `npm run dev`. 일정은 `#/calendar`, 보드는 `#/`. 파일을 브라우저로 직접 여는 방식은 안 된다 — 해시 라우팅과 `base` 경로 때문이다.

## 커밋

작성자는 `psunggu <psunggu@users.noreply.github.com>`. Claude 가 만든 커밋에는 `Co-Authored-By: Claude <noreply@anthropic.com>` 꼴의 트레일러를 붙인다(모델 이름은 그때 쓰는 것으로).

## 역할

`AGENTS.md` 의 「AI 에이전트 역할」 을 따른다. **프로젝트 규칙을 여기에 중복해 적지 않는다.**
