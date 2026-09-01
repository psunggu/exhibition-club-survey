> **[완료된 지시서 — 2026-08-30]** 이 문서는 **할 일이 아니라 기록이다.**
> 다섯 단계 모두 반영됐고 라이브로 나갔다 — PR #93(1~5단계) · PR #96(뒷정리).
>
> **지금의 규칙은 여기가 아니라 아래에 있다.** 이 문서를 근거로 무엇을 고치지 않는다.
>
> | 무엇 | 어디 |
> | --- | --- |
> | 색 · 모서리 · 그림자 · 서체의 실제 값 | `app/public/tokens.css` |
> | 지켜야 할 규칙 | `AGENTS.md` 의 「개발 규칙」 |
> | 규칙을 강제하는 것 | `validate-meetup-taxonomy` · `validate-accessibility` · `scope-legacy-css --check` |
> | 왜 그렇게 정했나 | PR #93 본문과 커밋 열일곱 개 |
>
> **아래 표의 값을 그대로 믿지 말 것.** 실제로 반영된 것은 여섯 곳에서 다르다.
>
> 1. 합친 영화 칩에 `상영 중` 을 남겼다. 예시대로면 그 글자가 사라져 「문구를 바꾸지
>    않는다」 와 어긋난다.
> 2. 갈래 칸 이름은 `venue` 가 아니라 `venueKind` 다. `venue` 는 이미
>    `'퐁피두센터 한화'` 같은 **장소 이름**이 쓰고 있고 팝업이 그대로 찍는다.
> 3. 수시 완료 글자색은 `#706d65` 가 아니라 `#6e6c64` 다. 표의 값은 칩 바탕
>    `#f1efe8` 위에서 **4.49:1** 로 기준(4.5)에 못 미친다 — 지시서는 흰 바탕(5.17)과
>    페이지 바탕(4.95)만 재고 칩 바탕을 재지 않았다.
> 4. `--shadow` 알파는 `0.06` 이다. 1단계 값 표와 5단계 예시가 서로 다르게 적혀
>    있어(0.06 / 0.05) 먼저 적용된 쪽을 따랐다. 눈에 보이는 차이는 없다.
> 5. 서체 굵기는 셋이 아니라 **다섯**(400·600·700·800·900)이다. 화면이 실제로 쓰는
>    굵기를 세어 보니 800 이 28곳, 900 이 14곳이라 셋만 넣으면 그 마흔두 곳이 700 으로
>    주저앉는다. 전체 판이 아니라 **한글 서브셋**(2.3MB → 1.35MB)을 골랐다.
> 6. 여백 눈금은 **새로 쓰는 값에만** 적용한다. 기존 336곳(대부분 `10px`·`14px`)은
>    손대지 않았다 — 올리면 375px 에서 넘칠 위험이 있고 내리면 화면이 빡빡해지는데,
>    어느 쪽도 지시서에 적혀 있지 않다. 방침은 `AGENTS.md` 에 적었다.
>
> 그 밖에 이 작업 도중 **아홉 건의 결함**을 함께 고쳤다(대비 미달인 팝업 글자 둘,
> 낱말 가운데서 끊기던 한국어, 팔레트 밖에 남아 있던 색들, 정의 없는 변수 참조).
> 그 목록은 PR #93 본문에 있다.

---
# 디자인 통일 작업 지시서

> 근거 문서: Omelette 「디자인 통일 제안」 (진단 · 시스템 · Before/After · 달력 체계)
> (원문 머리말: 이 파일을 `app/docs/` 에 넣어 세션에서 읽히게 하라고 적혀 있었다.
> 지금은 그 자리에 있으나 **읽히는 규칙은 위 표의 것들이다.**)

## 목표

화면 세 벌(보드 · 일정 · 설문)이 각자 다른 팔레트를 쓰고 있다. 바탕색이 두 종류, 초록이 두 가지, 강조색이 12가지다. **구조와 문구는 그대로 두고 색 · 서체 · 모서리만** 한 벌로 맞춘다.

원칙 셋.

1. 바탕은 하나 — 따뜻한 `#f6f4ef`. 이미 두 화면이 이 색이므로 보드를 옮긴다.
2. 색은 상태만 말한다 — 전시 · 공연 · 영화를 색으로 나누지 않는다. 갈래는 글자가 말한다.
3. 한 값은 한 곳에서 — 색 · 모서리 · 그림자를 `tokens.css` 한 장에 둔다.

## 시작 전에 반드시 확인할 것

- **`app/src/styles/legacy-*.css` 는 생성물이다.** 직접 고치면 다음 생성에서 지워진다. 원본 `app/public/styles.css` · `app/public/notice.css` 를 고치고 `scripts/scope-legacy-css.mjs` 를 다시 돌린다.
- **CSP 가 인라인 스타일과 외부 CDN 을 막는다.** `style-src 'self'` 다. 웹폰트를 CDN 에서 불러오면 조용히 실패한다 — 파일을 저장소에 넣는다.
- **`snapshot-screens.mjs check` 가 전부 걸린다.** 의도한 변경이므로, 단계마다 `check` 로 무엇이 얼마나 달라졌는지 먼저 읽고 그다음 `save` 로 기준을 갱신한다. `save` 부터 하지 않는다.
- 375px 가로 스크롤과 캐시 버스팅 `?v=` 는 사람이 확인한다.

## 단계

다섯 단계를 **각각 별도 커밋**으로 나눈다. 1번만 해도 「다른 사이트 같다」 는 느낌은 사라진다.

---

### 1단계 — 바탕 · 글자 · 초록을 한 벌로 (반나절)

`app/public/styles.css` 의 `:root` 열아홉 줄을 아래대로 바꾼다. 클래스 선택자는 건드리지 않는다.

| 변수 | 지금 | 바꿀 값 | 비고 |
| --- | --- | --- | --- |
| `--bg` | `#f5f7f8` | `#f6f4ef` | 따뜻한 쪽으로 |
| `--panel` | `#ffffff` | `#ffffff` | 유지 |
| `--panel-soft` | `#eef6f1` | `#f1efe8` | 초록 기운을 뺀다 |
| `--ink` | `#17202a` | `#1f1e1b` | |
| `--muted` | `#667085` | `#55534b` | |
| `--line` | `#d8dee5` | `#e8e5de` | |
| `--line-soft` | `#e8edf2` | `#f1efe8` | |
| `--green` | `#146c43` | `#0f6e56` | 초록 둘을 하나로 |
| `--green-dark` | `#0f5132` | `#0a5b45` | |
| `--red` | `#9f2d44` | `#a32d2d` | 「마감 · 오류」 전용 |
| `--amber` | `#b56b00` | `#854f0b` | 「확인 필요」 전용 |
| `--amber-soft` | `#fff4d8` | `#faeeda` | |
| `--shadow` | `0 18px 48px rgba(31,41,55,.08)` | `0 7px 24px rgba(31,30,27,.06)` | 얕게 |
| `--blue` `--purple` `--purple-soft` `--orange` `--orange-dark` `--orange-soft` | — | **삭제** | 2단계에서 참조가 사라진다 |

같은 파일의 `body` 배경에서 초록 그라디언트를 지운다.

```css
/* 지금 */
background:
  linear-gradient(180deg, rgba(20, 108, 67, 0.12), rgba(245, 247, 248, 0) 260px),
  var(--bg);

/* 바꿀 것 */
background: var(--bg);
```

**완료 기준** — 보드와 일정 화면을 번갈아 열었을 때 바탕색이 같다. `--blue` 등 여섯 변수를 지웠으므로 `npm run build` 가 통과하고 화면에 검정/투명으로 깨진 곳이 없다(2단계를 함께 하지 않으면 깨지므로 1·2단계는 이어서 한다).

---

### 2단계 — 갈래 색을 글자로 (하루)

`app/public/styles.css`.

지울 블록:

- `.area-tab[data-area="경기"]` · `.area-tab[data-area="인천"]` — 지역마다 다른 강조색. 셋 다 `--green` 을 쓴다.
- `.content-type-tab[data-content-type="전시"|"공연"|"영화"]` — 갈래마다 다른 강조색.
- `.performance-card` 의 `border-left: 5px solid var(--purple)` 와 `.performance-card .exhibition-rank/.exhibition-venue/.exhibition-reason` 색.
- `.movie-card` 의 `border-left` · `.exhibition-rank` · `.exhibition-venue` · `.exhibition-reason` 색, `.button.movie-booking-button` 의 주황 배경.

바꿀 것:

```css
.content-type-tab { --tab-accent: #55534b; }
.content-type-tab.is-active { background: #1f1e1b; color: #ffffff; }

/* 순위 숫자는 갈래와 무관하게 늘 같다 */
.exhibition-rank { background: #f1efe8; color: #1f1e1b; }

/* 별점의 노란색을 없앤다 — 숫자로 적는다 */
.stars { color: #1f1e1b; }
```

`app/src/Board.tsx` 에서 두 곳을 손댄다.

- `stars()` 를 `★☆` 반복 대신 `4.0 / 5` 형태로 바꾼다. `aria-label` 은 지금 문구를 유지한다.
- 카드 머리에 갈래 칩을 하나 넣는다 — `전시` · `음악공연` · `영화`. 중립 칩(`#f1efe8` / `#55534b`)이고, 영화 카드는 `영화 · 전국 예매 3위` 처럼 순위를 같은 칩에 붙인다. `movie-status-badge` · `movie-ranking-badge` 두 개는 이 칩 하나로 합친다.

`.button.movie-booking-button` 은 `.button.primary` 로 바꾼다 — 「예매」 도 주된 행동이므로 초록 하나면 된다.

**완료 기준** — 보드 한 화면에 초록 외의 색이 없다(마감 · 확인 필요 배지 제외). 영화 카드와 전시 카드의 테두리 · 순위 블록이 같다.

---

### 3단계 — 달력을 두 축으로 (이틀)

가장 손이 많이 가지만 「산만하다」 의 원인이다. **데이터부터 고친다.**

`app/src/data/meetups.ts`:

1. `official: boolean` → `regular: boolean` 로 이름을 바꾼다. 지금 이름은 「공식 계정」 처럼 읽힌다.
2. **7월 정기관람 ① (2026-07-11) · ② (2026-07-29) 의 값을 `true` 로 고친다.** 지금 `false` 다. 제목에 「정기관람」 이 있는데 플래그가 없으면 같은 정기관람이 달마다 다른 색으로 그려진다.
3. `venue: '전시' | '박물관' | '영화' | '공연' | '모임'` 을 추가한다. 지금은 `movie: boolean` 하나뿐이라 박물관 투어와 전시 관람을 구분할 방법이 제목 글자밖에 없다. `movie` 는 `venue: '영화'` 로 흡수한다.
4. `kind: 'conf' | 'tent' | 'done' | 'dead'` 는 그대로 둔다. 상태는 이미 잘 나뉘어 있다.

현재 11건의 분류(참고):

| 날짜 | 제목 | regular | venue | kind |
| --- | --- | --- | --- | --- |
| 07-05 | 킥오프 첫모임 | false | 모임 | done |
| 07-11 | 7월 정기관람 ① 〈큐비스트〉 주말 | **true** | 전시 | done |
| 07-26 | 성률 기획전 | false | 전시 | done |
| 07-29 | 7월 정기관람 ② 〈큐비스트〉 평일 | **true** | 전시 | done |
| 07-29 | 〈큐비스트〉 오전 벙개 | false | 전시 | done |
| 07-31 | 〈가우디〉 | false | 전시 | dead |
| 08-15 | S Classic Week | false | 공연 | done |
| 08-16 | 영화 《오디세이》 | false | 영화 | done |
| 08-22 | 8월 정기관람 · 서울역사박물관 | true | 박물관 | done |
| 08-29 | 가우디 서울전 관람 | false | 전시 | conf |
| 09-19 | 9월 정기관람 · 《서도호》 | true | 전시 | conf |

`app/public/notice.css` 의 달력 칩과 `app/src/Calendar.tsx` 의 `LEGEND` 를 아래 규칙으로 바꾼다. **색은 둘, 상태는 채움이 말한다.**

| | 확정 (`conf`) | 모집중·미정 (`tent`) | 완료 (`done`) |
| --- | --- | --- | --- |
| **정기** (`regular: true`) | 배경 `#0f6e56` / 글자 `#fff` | 배경 `#fff` / `1px dashed #0f6e56` / 글자 `#0a5b45` | 배경 `#f1efe8` / 글자 `#55534b` / `inset 2px 0 0 #0f6e56` |
| **수시** (`regular: false`) | 배경 `#1f1e1b` / 글자 `#fff` | 배경 `#fff` / `1px dashed #b6b2a6` / 글자 `#55534b` | 배경 `#f1efe8` / 글자 `#706d65` |

`dead`(예매 마감)만 성격과 무관하게 `#fcebeb` / `#a32d2d` 다. 지금 손을 써야 하는 것에만 쓰는 색이라 한 달에 한두 칸만 붉다.

`LEGEND` 여섯 줄을 지우고 두 줄로 바꾼다 — 「● 정기 / ● 수시」 색 점 둘, 그다음 「채움 = 확정 · 점선 = 미정 · 회색 = 완료」 글자 셋. 남보라(`#4f46e5` `#4338ca` `#e0e7ff`)와 자주(`#fae8ff` `#86198f`)는 전부 지운다. 확정 모임 카드의 날짜 블록은 `#0f6e56` 이 된다.

**달력 아래에 「이번 달 모임」 목록을 새로 넣는다.** 달력 칩은 좁아 글자가 몇 자 안 들어가므로, 갈래는 여기서 읽는다. 한 줄 구성: `날짜 · 요일` / `● 정기|수시 · venue` / 제목 / 상태 칩. 시간 순. 한 날에 둘이면(7/29) 두 줄이 된다.

`app/src/styles/survey.css` 쪽도 같이 정리한다 — `.survey-tab.exhibition|meal|datetime|club|etc` 다섯 색을 지우고, 선택된 탭만 `#1f1e1b` 배경으로 둔다. `.survey-go.meal` 의 주황(`#a54f1f`)을 `#0f6e56` 으로 바꿔 「응답」 버튼을 하나로 만든다. `.survey-tab` 배지의 파랑(`#eef1f8` / `#4b6283`)은 초록 tint(`#e1f5ee` / `#0a5b45`)로 바꾼다.

**완료 기준** — 달력 한 달에 색이 붙는 칸이 다섯 이하다. 정기와 수시가 색으로 구분된다. 범례를 읽고 나면 칩을 누르지 않아도 무엇인지 안다.

---

### 4단계 — 모서리 · 그림자 · 서체 (반나절 + 서체 작업)

`app/public/styles.css` 전역:

- 탭 묶음 `.area-tabs` · `.content-type-tabs` 의 `border-radius: 3px` → `12px`, 탭 항목의 `2px` → `9px`.
- 카드 · 패널의 `border-radius: 8px` → `14px` (`.exhibition-card` `.exhibition-page` `.verification-panel` `.toolbar` `.guide-panel` `.event-area` `.recommendation-inline-body` `.empty-state` `dialog`).
- 버튼 · 입력칸 · `.icon-button` · `.row-actions` 의 `8px` → `10px`.
- 여백은 4 · 8 · 12 · 16 · 22 · 32 단위만 쓴다.
- 누르는 것 최소 44px(모바일 48px)을 유지한다 — 지금 값들은 대체로 통과한다.

**서체.** `app/public/notice.css` 는 `'Pretendard'` 를 선언하지만 **폰트 파일이 없다.** `app/index.html` · `app/public/index.html` 에 링크도 `@font-face` 도 없어서, 지금은 세 화면 모두 기기 기본 고딕으로 그려진다 — 기기마다 글자 모양이 달라지는 원인이다. CDN 은 CSP 가 막으므로 파일을 넣는다.

1. Pretendard 서브셋 `woff2` 를 `app/public/fonts/` 에 넣는다 (400 · 600 · 700 셋이면 충분하다).
2. `styles.css` · `notice.css` 맨 위에 `@font-face` 를 선언한다. `font-display: swap`.
3. `styles.css` 의 `body` `font-family` 를 `notice.css` 와 같은 스택으로 맞춘다.
4. `font-src` 는 CSP 에 없으므로 `default-src 'self'` 로 떨어진다 — 로컬 파일이면 통과한다. 브라우저 콘솔에서 확인한다.

**완료 기준** — 375px · 데스크톱 양쪽에서 보드와 일정의 글자 모양이 같다. 콘솔에 CSP 위반이 없다.

---

### 5단계 — `tokens.css` 한 장으로 (하루)

`app/public/tokens.css` 를 새로 만들고 1~4단계에서 정한 값을 한 곳에 모은다. `styles.css` 와 `notice.css` 는 값을 직접 쓰지 않고 변수만 참조한다.

```css
:root {
  /* 중립 */
  --paper: #f6f4ef;  --card: #ffffff;  --sunken: #f1efe8;
  --line: #e8e5de;   --line-strong: #d9d5ca;
  --ink: #1f1e1b;    --ink-2: #55534b;  --ink-3: #706d65;
  /* 브랜드 */
  --green: #0f6e56;  --green-dark: #0a5b45;  --green-tint: #e1f5ee;
  /* 상태 */
  --warn: #854f0b;   --warn-tint: #faeeda;
  --stop: #a32d2d;   --stop-tint: #fcebeb;
  /* 모양 */
  --r-card: 14px;    --r-control: 10px;
  --shadow: 0 7px 24px rgba(31, 30, 27, 0.05);
}
```

`scripts/scope-legacy-css.mjs` 가 `tokens.css` 를 두 스코프에 함께 넣도록 손본다. 넣기 전에 스크립트가 `:root` 를 어떻게 다루는지 읽는다 — 지금은 `body:where(.board-page)` 로 옮기고 있다.

**완료 기준** — 색 값을 바꿀 때 고칠 곳이 한 줄이다. `grep -c '#[0-9a-f]\{6\}' app/public/styles.css` 가 크게 줄어든다.

---

## 검증

단계마다 아래를 돈다.

```bash
npm run check                              # 빌드 · CSP · 화면 대조를 한 번에
node scripts/snapshot-screens.mjs check    # 먼저 무엇이 달라졌는지 읽는다
node scripts/snapshot-screens.mjs save     # 의도한 변경이면 기준 갱신
```

사람이 확인할 것:

- 375px 에서 가로 스크롤이 생기지 않는가 (회원 대부분이 카톡 링크로 휴대폰에서 연다)
- 정적 페이지의 CSS 링크에 `?v=` 를 올렸는가
- 콘솔에 CSP 위반이 없는가 (인라인 `style=`, 외부 CDN, 폰트)
- 달력의 「오늘」 마커가 실제 날짜에 붙는가
- 대비: 새 글자색이 새 바탕에서 4.5:1 을 넘는가. `#706d65` 는 흰 바탕 5.17 · `#f6f4ef` 4.95 로 통과한다. `#8a877d` 는 3.6 이라 본문에 쓰지 않는다.

## 커밋 메시지 예

```
design: 보드 팔레트를 따뜻한 계열로 통일 (1단계)

바탕 #f5f7f8 → #f6f4ef, 초록 #146c43 → #0f6e56 로 일정·설문 화면과 맞췄다.
쓰이지 않게 된 --blue --purple --orange 계열 여섯 변수를 지웠다.
화면 대조 기준을 갱신했다 — 색만 달라지고 배치는 그대로다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

## 하지 않을 것

- 구조와 문구를 바꾸지 않는다. 회원이 3년 가까이 봐 온 화면이다.
- `legacy-*.css` 를 직접 고치지 않는다.
- 새 색을 만들지 않는다. 위 표에 없는 값이 필요하면 먼저 묻는다.
- 별점 · 순위 · 예매율 같은 숫자의 뜻을 바꾸지 않는다. 색만 뗀다.
