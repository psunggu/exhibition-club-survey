#!/usr/bin/env node
/**
 * compare-with-legacy.mjs — **옛 페이지**와 이식본을 나란히 재서 어긋난 곳을 찾는다.
 *
 *   node scripts/compare-with-legacy.mjs
 *
 * snapshot-screens.mjs 와 목적이 다르다. 그쪽은 "지금 상태에서 더 바뀌지 않았나"를 보고,
 * 이쪽은 **"옛 화면과 같아졌나"**를 본다.
 *
 * 처음에 기준을 이식본에서 찍은 것이 잘못이었다. 이식본 자체가 옛 화면과
 * 어긋나 있었기 때문이다 — 두 legacy CSS 를 한 페이지에 같이 넣으면서
 * 뒤에 온 notice.css 가 board 의 body·h1 같은 전역 선택자를 덮어썼다.
 * 옛 사이트는 두 장의 별개 페이지라 충돌할 일이 없던 것이다.
 *
 * **기준은 옛 페이지다.** app/public/index.html · notice.html 을 그대로 띄워 잰다.
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { FROZEN_DAY, freezeClock } from './frozen-clock.mjs';
import { serveFrozenData, failOnFrozenMisses } from './frozen-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OLD = path.join(ROOT, 'app/public');
const DIST = path.join(ROOT, 'dist');
const PORT_OLD = 8192;
const PORT_NEW = 8193;
const BASE = '/exhibition-club-survey';

for (const [p, label] of [[OLD, 'app/public'], [DIST, 'dist']]) {
  if (!fs.existsSync(p)) { console.error(`${label} 이 없다.`); process.exit(1); }
}

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright 가 없어 건너뛴다'); process.exit(0); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css',
  '.js': 'text/javascript', '.json': 'application/json' };
const serve = (root, port, strip) => {
  const s = http.createServer((req, res) => {
    let u = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (strip && u.startsWith(BASE)) u = u.slice(BASE.length);
    if (u === '' || u === '/') u = '/index.html';
    fs.readFile(path.join(root, u), (e, d) => {
      if (e) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(u)] ?? 'application/octet-stream' });
      res.end(d);
    });
  });
  return new Promise((r) => s.listen(port, () => r(s)));
};
const sOld = await serve(OLD, PORT_OLD, false);
const sNew = await serve(DIST, PORT_NEW, true);

/** 페이지 전역 — 두 CSS 가 다투는 곳이 여기다 */
const GLOBAL = ['body', 'h1'];
/** 보드 화면 */
const BOARD = ['.app-shell', '.topbar', '.topbar h1', '.eyebrow', '.topbar-notice-link',
  '.area-tabs', '.area-tab', '.area-tab.is-active',
  '.content-type-tabs', '.content-type-tab', '.content-type-tab.is-active',
  '.exhibition-card', '.exhibition-rank', '.exhibition-venue', '.exhibition-summary',
  '.exhibition-details dt', '.exhibition-details dd', '.exhibition-reason',
  '.button.primary', '.official-info-link', '.stars', '.rating-source',
  '.recommendation-group-head', '.recommendation-group-head h3',
  '.movie-card', '.movie-status-badge', '.movie-ranking-badge'];
/** 일정 화면 */
const CAL = ['.digest', '.digest-head', '.digest-title', '.digest-period',
  '.sec', '.card', '.db', '.db .d', '.db .m', '.tag', '.meta', '.card-alert',
  '.mon', '.cal', '.wd', '.cell', '.dnum', '.chip', '.legend', '.lchip',
  '.completed-list', '.drow'];

const PROPS = ['color', 'backgroundColor', 'backgroundImage', 'fontSize', 'fontWeight',
  'lineHeight', 'letterSpacing', 'fontFamily', 'minHeight',
  'paddingTop', 'paddingLeft', 'marginTop', 'marginBottom', 'borderRadius',
  'display', 'textAlign', 'boxShadow'];

async function measure(page, url, sels, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1100);
  return page.evaluate(({ sels, props }) => {
    const out = {};
    for (const sel of sels) {
      const els = [...document.querySelectorAll(sel)];
      if (!els.length) { out[sel] = null; continue; }
      const cs = getComputedStyle(els[0]);
      const st = {};
      for (const p of props) st[p] = cs[p];
      out[sel] = { count: els.length, style: st };
    }
    return out;
  }, { sels, props: PROPS });
}

const browser = await chromium.launch();
const page = await browser.newPage();
// 날짜를 타는 화면이라 시계를 묶는다 — 안 묶으면 내일 이 검사가 거짓으로 실패한다
await freezeClock(page);
// DB 응답도 떠 둔 것으로 고정한다 — 보드가 갱신되면 이 검사가 거짓으로 실패한다
await serveFrozenData(page);

const PAIRS = [
  ['보드', `http://localhost:${PORT_OLD}/index.html`,
           `http://localhost:${PORT_NEW}${BASE}/#/`, [...GLOBAL, ...BOARD]],
  ['일정', `http://localhost:${PORT_OLD}/notice.html`,
           `http://localhost:${PORT_NEW}${BASE}/#/calendar`, [...GLOBAL, ...CAL]],
];

/**
 * **알고서 다르게 둔 것.**
 *
 * 이 검사는 「옛 화면과 같아졌나」 를 본다. 그래서 다른 곳은 전부 실패로 봐야 맞다.
 * 다만 **일부러 다르게 만든 것**이 하나 있고, 그걸 실패로 두면 사람이 검사를 끄게 된다.
 * 지우는 대신 여기 적어 두고, 통과할 때도 **화면에 그대로 보여 준다** —
 * 숨기면 그 다음 사람이 이유를 모른 채 되돌린다.
 *
 * 적을 때는 좁게 적는다. 선택자 하나, 값 하나까지 맞아야 넘어간다.
 */
const EXPECTED = [
  {
    screen: '일정', sel: '.drow', prop: 'display', old: 'none', now: 'flex',
    why: '옛 페이지는 완료된 모임을 통째로 접어 두고 「N개 펼쳐보기」 로만 보여 준다. '
      + '이식본은 사흘 안에 끝난 것만 펼쳐 두고 그 이전 것을 접는다 '
      + '(app/src/Calendar.tsx 의 recent/older, COMPLETED_VISIBLE_DAYS=3). '
      + '다녀온 직후에 「다녀왔습니다」 가 바로 보이는 편이 낫다고 보아 그렇게 두었다.',
  },
  {
    screen: '보드', sel: '.movie-status-badge', kind: '사라짐',
    why: '갈래를 색으로 나누지 않기로 하며(디자인 통일 2단계) 영화 카드의 배지 둘을 '
      + '중립 칩(.card-kind-chip) 하나로 합쳤다. **글자는 그대로 남아 있다** — '
      + '「영화 · 상영 중 · 전국 예매 1위」 처럼 한 칩에 이어 붙는다. '
      + '옛 페이지는 아직 배지 둘을 따로 그리므로 여기서만 어긋난다.',
  },
  {
    screen: '보드', sel: '.movie-ranking-badge', kind: '사라짐',
    why: '위와 같은 병합이다. 순위는 같은 칩 뒷부분에 붙어 있다.',
  },
  {
    screen: '일정', sel: '.lchip', prop: 'color',
    old: 'rgb(85, 83, 75)', now: 'rgb(31, 30, 27)',
    why: '달력 범례를 여섯 칸에서 색 점 둘로 줄였다(디자인 통일 3단계). '
      + '옛 범례는 갈래(영화 모임)와 성격(공식 정기관람)과 상태(완료·확정·미정·마감)를 '
      + '한 줄에 섞어 두어, 칩 하나를 보고 어느 축을 읽어야 하는지 알 수 없었다. '
      + '이제 색은 정기/수시만 가르고, 채움·점선·회색이 무엇인지는 옆의 글자 셋이 말한다. '
      + '재는 것이 첫 번째 .lchip 이라 옛 화면의 「완료」 칸과 이식본의 「정기」 칸이 맞붙는다 — '
      + '달력 칩(.chip)은 옛 화면과 값이 같다.',
  },
  {
    screen: '일정', sel: '.lchip', prop: 'backgroundColor',
    old: 'rgb(241, 239, 232)', now: 'rgb(255, 255, 255)',
    why: '위와 같은 범례 개편이다. 옛 「완료」 칸은 베이지, 새 「정기」 칸은 흰 바탕에 초록 점이다.',
  },
  /*
   * ── 아래 셋은 한 가지 사실에서 나온다 ─────────────────────
   * 이 검사도, 화면 대조도 **선택자에 처음 맞는 것 하나**를 잰다.
   * 「다가오는 확정 모임」 의 첫 카드가 2026-08-30 에 바뀌었다 —
   * 가우디 서울전(8/29, 수시 · tone conf)이 완료로 옮겨 가면서
   * 9월 정기관람(tone official)이 첫 자리에 올라왔다.
   *
   * 고정본 notice.html 은 가우디가 아직 예정이던 때에 묶여 있어 영영 conf 를 첫
   * 카드로 그린다. 그래서 **모양이 바뀐 것이 아니라 재는 대상이 바뀐 것이다** —
   * conf 카드끼리 대면 값은 그대로다.
   *
   * 값을 좁게 박아 둔다. 첫 카드가 또 바뀌면 이 검사는 다시 실패하고,
   * 그때 사람이 한 번 더 읽게 된다. 넓게 적어 조용히 넘어가게 두지 않는다.
   */
  {
    screen: '일정', sel: '.card', prop: 'boxShadow',
    old: 'none', now: 'rgb(15, 110, 86) 4px 0px 0px 0px inset',
    why: '첫 확정 카드가 가우디(수시)에서 9월 정기관람(공식)으로 바뀌었다. '
      + '공식 정기관람 카드는 왼쪽에 초록 띠를 두르고, 수시 카드는 두르지 않는다. '
      + '가우디를 2026-08-30 에 완료로 옮기면서 순서가 바뀐 것이지 카드 모양이 바뀐 것이 아니다.',
  },
  {
    screen: '일정', sel: '.tag', prop: 'color',
    old: 'rgb(10, 91, 69)', now: 'rgb(255, 255, 255)',
    why: '위와 같은 자리바꿈이다. 첫 카드의 딱지가 「확정」(연초록 바탕 · 진초록 글자)에서 '
      + '「공식 정기관람」(진초록 바탕 · 흰 글자)으로 바뀌었다.',
  },
  {
    screen: '일정', sel: '.tag', prop: 'backgroundColor',
    old: 'rgb(225, 245, 238)', now: 'rgb(15, 110, 86)',
    why: '위와 같은 자리바꿈이다. 바탕색이 뒤집힌 쪽이다.',
  },
  {
    screen: '일정', sel: '.lchip', prop: 'display',
    old: 'block', now: 'flex',
    why: '색 점을 ::before 로 글자 앞에 세우려고 inline-flex 로 바꿨다. 인라인 style 없이 CSP 를 지킨다.',
  },
];

// kind 를 적은 항목은 「사라짐 · 새로생김」 을, 그렇지 않은 항목은 값 하나를 가리킨다.
const expectedHit = (r) => EXPECTED.find((e) => e.screen === r.screen && e.sel === r.sel
  && (e.kind
    ? e.kind === r.kind
    : e.prop === r.prop && e.old === String(r.old) && e.now === String(r.now)));

const report = [];
for (const [name, oldUrl, newUrl, sels] of PAIRS) {
  const a = await measure(page, oldUrl, sels, 375);
  const b = await measure(page, newUrl, sels, 375);
  for (const sel of sels) {
    const x = a[sel], y = b[sel];
    if (!x && !y) continue;
    if (x && !y) { report.push({ screen: name, sel, kind: '사라짐', detail: `옛 화면에 ${x.count}개, 이식본에 없음` }); continue; }
    if (!x && y) { report.push({ screen: name, sel, kind: '새로생김', detail: `이식본에만 ${y.count}개` }); continue; }
    for (const p of PROPS) {
      if (x.style[p] !== y.style[p])
        report.push({ screen: name, sel, kind: '값다름', prop: p, old: x.style[p], now: y.style[p] });
    }
  }
}
await browser.close();
sOld.close(); sNew.close();
failOnFrozenMisses();

const known = report.filter(expectedHit);
const unexpected = report.filter((r) => !expectedHit(r));
if (known.length) {
  console.log(`알고서 다르게 둔 곳 ${known.length}건 — 실패로 세지 않는다`);
  known.forEach((r) => {
    const e = expectedHit(r);
    // 값다름 은 prop 이 있고, 사라짐/새로생김 은 detail 이 있다
    console.log(r.prop
      ? `  · ${r.screen} ${r.sel}.${r.prop}: ${r.old} → ${r.now}`
      : `  · ${r.screen} ${r.sel}: ${r.kind} — ${r.detail}`);
    console.log(`    ${e.why}`);
  });
  console.log('');
}
report.length = 0;
report.push(...unexpected);

if (!report.length) {
  console.log(`옛 화면과 일치 — 어긋난 곳 없음 (시계는 ${FROZEN_DAY} 에 묶고 쟀다)`);
  process.exit(0);
}
const byScreen = {};
for (const r of report) (byScreen[r.screen] ??= []).push(r);
console.log(`옛 화면과 어긋난 곳 ${report.length}건\n`);
for (const [screen, rows] of Object.entries(byScreen)) {
  console.log(`── ${screen} (${rows.length})`);
  const missing = rows.filter((r) => r.kind !== '값다름');
  for (const r of missing) console.log(`  [${r.kind}] ${r.sel} — ${r.detail}`);
  const diffs = rows.filter((r) => r.kind === '값다름');
  const bySel = {};
  for (const d of diffs) (bySel[d.sel] ??= []).push(d);
  for (const [sel, ds] of Object.entries(bySel)) {
    console.log(`  ${sel}`);
    for (const d of ds.slice(0, 4))
      console.log(`      ${d.prop}: ${String(d.old).slice(0, 44)} → ${String(d.now).slice(0, 44)}`);
    if (ds.length > 4) console.log(`      … ${ds.length - 4}개 더`);
  }
  console.log('');
}
process.exit(1);
