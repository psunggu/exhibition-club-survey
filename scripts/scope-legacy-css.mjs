#!/usr/bin/env node
/**
 * scope-legacy-css.mjs — 옛 CSS 두 장의 **적용 범위만** 라우트별로 가른다.
 *
 *   node scripts/scope-legacy-css.mjs
 *
 * ── 왜 필요한가 ────────────────────────────────────────────
 * 옛 사이트는 index.html(styles.css) 과 notice.html(notice.css) **두 장의 별개 페이지**였다.
 * 각 CSS 는 자기가 그 페이지의 유일한 스타일시트라고 보고 `:root` · `body` · 맨 `h1` 같은
 * 페이지 전역 선택자를 쓴다. 충돌할 일이 없었다.
 *
 * SPA 로 합치면서 둘을 한 문서에 같이 넣었다. 같은 특정도에서는 **뒤가 이긴다.**
 * 그래서 보드 화면인데 notice.css 의 body 배경 · h1 27px · Pretendard 글꼴이 걸렸다.
 * 실측으로 67곳이 옛 화면과 달랐고, 거의 전부가 이 한 뿌리에서 나왔다.
 *
 * ── 무엇을 하나 ────────────────────────────────────────────
 * **값은 한 글자도 바꾸지 않는다.** 페이지 전역 선택자에 라우트 클래스만 앞에 붙인다.
 *
 *   :root      → body.board-page          (사용자 정의 속성은 상속되므로 body 로 충분)
 *   body       → body.board-page
 *   h1         → body.board-page h1
 *   * , *::before → body.board-page * ...
 *
 * 클래스로 시작하는 선택자(.exhibition-card 등)는 건드리지 않는다.
 * 옛 화면에서도 그 클래스는 한 페이지에만 나타났으므로 충돌하지 않는다.
 *
 * ── tokens.css 는 두 벌로 복사한다 ────────────────────────
 * 색·모서리·그림자는 app/public/tokens.css 한 장에만 적는다. 그 파일의 `:root` 를
 * **각 스코프로 한 벌씩** 만들어 생성물 맨 앞에 붙인다. 그래서 보드 화면과
 * 일정·설문 화면이 같은 값을 서로 다른 이름 없이 나눠 쓴다.
 *
 * 맨 앞에 붙이는 이유는 뒤에 오는 규칙이 이기게 하기 위해서다 — 변수를 먼저 세우고,
 * 그것을 쓰는 규칙이 뒤따른다.
 *
 * 옛 정적 페이지 두 장은 tokens.css 를 그대로 <link> 한다. 그쪽은 `:root` 그대로다.
 *
 * 원본(app/public/styles.css · notice.css · tokens.css)은 **손대지 않는다.**
 * 이 스크립트가 app/src/styles/legacy-*.css 를 다시 만든다. 손으로 고치지 말 것.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 세 화면이 나눠 쓰는 값. 스코프마다 한 벌씩 복사해 붙인다. */
const TOKENS = 'app/public/tokens.css';

const JOBS = [
  { from: 'app/public/styles.css', to: 'app/src/styles/legacy-board.css', scope: 'body.board-page' },
  { from: 'app/public/notice.css', to: 'app/src/styles/legacy-notice.css', scope: 'body.calendar-page' },
];

/** 페이지 전역으로 퍼지는 선택자인가 — 이것들만 범위를 가른다. */
const GLOBALISH = /^(:root|\*|html|body|h[1-6]|p|a|ul|ol|li|dl|dt|dd|button|input|select|textarea|label|table|th|td|img|figure|blockquote|code|pre|hr|small|strong|summary|details|dialog|main|header|footer|section|article|nav|form|fieldset)(\b|::?|\[|$)/;

/**
 * 선택자 하나에 범위를 붙인다.
 *
 * **`:where()` 로 감싼다 — 특정도를 0 으로 만들기 위해서다.**
 * 그냥 `body.board-page h3` 로 쓰면 특정도가 (0,1,2)가 되어
 * `.recommendation-group-head h3`(0,1,1) 같은 **클래스 규칙을 이겨 버린다.**
 * 실제로 그렇게 만들었다가 그룹 제목이 18px 에서 15px 로 줄었다.
 * `:where(body.board-page) h3` 는 (0,0,1) 로 맨 `h3` 와 같아, 원래의 승부가 유지된다.
 */
function scopeOne(sel, scope) {
  const s = sel.trim();
  if (!s) return s;
  if (s.startsWith('@')) return s;
  if (!GLOBALISH.test(s)) return s;                       // .클래스 · #id 는 그대로

  const cls = scope.replace(/^body/, '');                  // '.board-page'
  const w = `:where(${scope})`;
  if (s === ':root' || s === 'body') return `body${`:where(${cls})`}`;
  if (s.startsWith('body')) return `body:where(${cls})${s.slice(4)}`;
  if (s.startsWith('html')) return s;                      // html 은 body 아래로 못 넣는다
  if (s.startsWith(':root')) return `body:where(${cls})${s.slice(5)}`;
  return `${w} ${s}`;
}

/** 최상위 쉼표로만 자른다 — :not(a, b) 안의 쉼표는 건드리지 않는다. */
function splitSelectors(list) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of list) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/** 중괄호 균형을 세며 선언 블록의 선택자만 바꾼다. @media 안쪽도 같은 규칙을 적용한다. */
function transform(css, scope) {
  let out = '';
  let i = 0;
  let head = '';
  const stack = [];
  while (i < css.length) {
    const ch = css[i];

    // 주석은 그대로 흘린다
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      const stop = end < 0 ? css.length : end + 2;
      head += css.slice(i, stop);
      i = stop;
      continue;
    }

    if (ch === '{') {
      /**
       * 주석은 head 에 그대로 흘려 담기므로, 선택자 **바로 앞**에 주석이 있으면
       * head.trim() 이 「주석 + 선택자」 가 되어 버린다. 그러면 GLOBALISH 에 안 걸려
       * `:root` 도 `body` 도 범위가 안 입혀진 채 지나간다 — 조용히.
       * 실제로 tokens.css 의 머리말 주석 때문에 `:root` 가 그대로 새어 나갔다.
       * 그래서 마지막 주석 뒤부터를 진짜 선택자로 본다.
       */
      const lastComment = head.lastIndexOf('*/');
      const prefix = lastComment < 0 ? '' : head.slice(0, lastComment + 2);
      const selRaw = lastComment < 0 ? head : head.slice(lastComment + 2);
      const sel = selRaw.trim();
      if (sel.startsWith('@')) {          // @media · @supports 등 — 그대로 두고 안으로 들어간다
        out += head + '{';
        stack.push('at');
      } else {
        const scoped = splitSelectors(sel).map((s) => scopeOne(s, scope)).join(', ');
        out += prefix + selRaw.replace(sel, scoped) + '{';
        stack.push('rule');
        // 선언 블록 안은 건드리지 않는다 — 닫는 } 까지 그대로 복사
        let depth = 1, j = i + 1;
        while (j < css.length && depth > 0) {
          if (css[j] === '{') depth++;
          else if (css[j] === '}') depth--;
          j++;
        }
        out += css.slice(i + 1, j);
        stack.pop();
        head = '';
        i = j;
        continue;
      }
      head = '';
      i++;
      continue;
    }

    if (ch === '}') { out += head + '}'; head = ''; stack.pop(); i++; continue; }

    head += ch;
    i++;
  }
  return out + head;
}

const tokensSrc = fs.readFileSync(path.join(ROOT, TOKENS), 'utf8');

let changed = 0;
for (const job of JOBS) {
  const src = fs.readFileSync(path.join(ROOT, job.from), 'utf8');
  // 값은 tokens.css 한 곳에만 있고, 여기서는 범위만 입혀 앞에 세운다.
  const tokens = transform(tokensSrc, job.scope);
  const body = tokens + `\r\n\r\n/* ── 여기부터 ${job.from} ── */\r\n\r\n` + transform(src, job.scope);
  const header = `/* 이 파일은 생성된 것이다. 손으로 고치지 말 것.
 *
 *   원본     ${TOKENS} + ${job.from}   (한 글자도 바꾸지 않는다)
 *   생성기   scripts/scope-legacy-css.mjs
 *   범위     ${job.scope}
 *
 * 옛 사이트는 두 장의 별개 페이지라 각 CSS 가 :root · body · 맨 h1 같은
 * 페이지 전역 선택자를 마음껏 썼다. SPA 로 합치면 뒤에 온 쪽이 이긴다 —
 * 실제로 보드 화면에 notice.css 의 body 배경과 h1 27px 이 걸려 있었다.
 *
 * 그래서 **값은 그대로 두고 적용 범위만** 라우트 클래스로 가른다.
 * 클래스 선택자는 건드리지 않는다.
 */
`;
  const prev = fs.existsSync(path.join(ROOT, job.to))
    ? fs.readFileSync(path.join(ROOT, job.to), 'utf8') : '';
  const next = header + body;
  if (prev !== next) { fs.writeFileSync(path.join(ROOT, job.to), next); changed++; }
  const scoped = (body.match(new RegExp(job.scope.replace('.', '\\.'), 'g')) ?? []).length;
  console.log(`${job.to}  ← ${job.from}  · 범위 적용 ${scoped}곳`);
}
console.log(changed ? `${changed}개 파일 갱신` : '변경 없음');
