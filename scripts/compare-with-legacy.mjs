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

const PAIRS = [
  ['보드', `http://localhost:${PORT_OLD}/index.html`,
           `http://localhost:${PORT_NEW}${BASE}/#/`, [...GLOBAL, ...BOARD]],
  ['일정', `http://localhost:${PORT_OLD}/notice.html`,
           `http://localhost:${PORT_NEW}${BASE}/#/calendar`, [...GLOBAL, ...CAL]],
];

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

if (!report.length) {
  console.log('옛 화면과 일치 — 어긋난 곳 없음');
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
