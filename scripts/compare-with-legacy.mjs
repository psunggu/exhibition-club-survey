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

/**
 * ── 일정 화면은 이 대조에서 뺐다 (2026-08-30) ──────────────
 *
 * 이 검사의 목적은 **이식이 옛 화면에 충실했나**였고, 그건 끝났다.
 * 남은 문제는 옛 페이지가 **얼어 있다**는 것이다 — notice.html 은 8월 29일
 * 가우디를 「다가오는 확정」 으로 손으로 박아 두었고 앞으로도 그대로다.
 * 이식본은 데이터를 읽으므로 모임이 하나 완료될 때마다 첫 카드가 바뀌고,
 * `.card` · `.tag` · 보이는 글이 옛 화면과 어긋난다.
 *
 * 그때마다 예외를 한 줄씩 적으면 목록이 달마다 길어지고, 결국 아무도 안 읽는다.
 * **모임이 끝나는 것은 고장이 아니라 정상이다.** 그것을 실패로 부르는 검사는
 * 수명이 다한 것이다.
 *
 * 일정 화면의 디자인은 다른 것들이 지킨다 —
 *   snapshot-screens.mjs      기준과 견줘 의도치 않은 변화를 잡는다 (일정 두 폭 포함)
 *   validate-accessibility    대비 · 누르는 크기 · 팝업 안까지
 *   validate-meetup-taxonomy  분류와 범례
 *   validate-weekly-digest    notice.html 을 아직 읽는다
 *
 * 그래서 app/public/notice.html · notice.css 는 **여전히 지우면 안 된다.**
 * notice.css 는 legacy-notice.css 의 원본이고, notice.html 은 위 검사기가 읽는다.
 */

const PAIRS = [
  ['보드', `http://localhost:${PORT_OLD}/index.html`,
           `http://localhost:${PORT_NEW}${BASE}/#/`, [...GLOBAL, ...BOARD]],
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
