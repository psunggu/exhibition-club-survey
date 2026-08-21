#!/usr/bin/env node
/**
 * snapshot-screens.mjs — 화면이 그대로인지 대조할 기준을 만든다.
 *
 *   node scripts/snapshot-screens.mjs save     기준을 찍는다
 *   node scripts/snapshot-screens.mjs check    지금 화면을 기준과 대조한다
 *
 * **왜 필요한가.** "기존 디자인을 바꾸지 않는다"가 조건인데,
 * 눈으로 비교하면 반드시 놓친다. 간격 2px, 색 한 단계, 줄바꿈 위치는
 * 스크린샷을 나란히 놓고 봐도 잘 안 보인다.
 *
 * 그래서 **계산된 스타일과 레이아웃 상자를 숫자로** 찍어 둔다.
 * 접근성이나 코드를 고친 뒤 이 검사가 통과하면, 보이는 것은 그대로다.
 *
 * dist 를 띄워서 재므로 `npm run build` 가 먼저다.
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'docs/fixtures/screen-baseline.json');
const BASE = '/exhibition-club-survey';
const PORT = 8191;

const mode = process.argv[2] ?? 'check';
if (!['save', 'check'].includes(mode)) {
  console.error('사용법: node scripts/snapshot-screens.mjs [save|check]');
  process.exit(1);
}
if (!fs.existsSync(DIST)) {
  console.error('dist/ 가 없다. 먼저 `npm run build`.');
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('playwright 가 없어 건너뛴다 — `npm i -D playwright && npx playwright install chromium`');
  process.exit(0);
}

// ── dist 를 그대로 내주는 최소 서버
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css',
  '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (u.startsWith(BASE)) u = u.slice(BASE.length);
  if (u === '' || u === '/') u = '/index.html';
  const p = path.join(DIST, u);
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] ?? 'application/octet-stream' });
    res.end(d);
  });
});
await new Promise((r) => server.listen(PORT, r));

/** 화면마다 이 선택자들의 계산된 스타일과 상자를 잰다. */
const WATCH = [
  'body', '.app-shell', '.topbar', '.topbar h1', '.eyebrow', '.topbar-notice-link',
  '.area-tabs', '.area-tab', '.area-tab.is-active',
  '.content-type-tabs', '.content-type-tab', '.content-type-tab.is-active',
  '.recommendation-group-head', '.recommendation-group-head h3',
  '.exhibition-card', '.exhibition-rank', '.exhibition-venue', '.exhibition-card h3',
  '.exhibition-summary', '.exhibition-details dt', '.exhibition-details dd',
  '.exhibition-reason', '.button.primary', '.official-info-link',
  '.stars', '.rating-source',
  '.digest', '.digest-head', '.digest-title', '.sec', '.card', '.db', '.db .d',
  '.tag', '.meta', '.card-alert',
  '.cal', '.wd', '.cell', '.dnum', '.chip',
  '.survey-jump', '.survey-jump-list li',
];

/** 색·글자·간격·상자 — 눈에 보이는 것을 정하는 값들 */
const PROPS = [
  'color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderRadius',
  'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'fontFamily',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'marginTop', 'marginBottom', 'display', 'flexDirection', 'gap',
  'textAlign', 'boxShadow', 'opacity',
];

async function measure(page, url, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);   // Supabase · digest 응답
  return page.evaluate(({ watch, props }) => {
    const round = (v) => {
      const n = Number.parseFloat(v);
      return Number.isFinite(n) && /px$/.test(v) ? `${Math.round(n * 10) / 10}px` : v;
    };
    const out = {};
    for (const sel of watch) {
      const els = [...document.querySelectorAll(sel)];
      if (!els.length) { out[sel] = null; continue; }
      const el = els[0];
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const style = {};
      for (const p of props) style[p] = round(cs[p]);
      out[sel] = { count: els.length, box: { w: Math.round(r.width), h: Math.round(r.height) }, style };
    }
    /**
     * **살아 있는 값이 든 자리는 글자 수에서 뺀다.**
     *
     * 이 검사는 디자인이 흔들리지 않는지 본다. 그런데 설문 현황 카드에는
     * 마감 시각·참여 인원·「진행 중인 설문 N개」 가 들어 있어 잴 때마다 길이가 달라진다.
     * 응답이 하나 늘어도, 하루가 지나도, 불러오기가 늦어도 값이 바뀐다.
     * 실제로 CI 에서 1222 대 1164 로 갈렸다 — 디자인은 하나도 안 바뀐 채로.
     *
     * 카드의 **생김새**는 위 WATCH 의 `.survey-jump` 와 `.survey-jump-list li` 가 지킨다 —
     * 상자와 색은 불러왔든 못 불러왔든 같다는 것을 재서 확인했다.
     * 다만 `.survey-jump-state` 는 넣지 않는다. 못 불러오면 그 조각은 아예 안 그려지고,
     * 인원이 한 자리에서 두 자리가 되면 폭도 변한다 — 지켜볼 수 없는 값이다.
     */
    const live = [...document.querySelectorAll('.survey-jump')]
      .map((e) => e.innerText.replace(/\s+/g, ' ').trim().length)
      .reduce((a, b) => a + b, 0);
    out['#문서'] = {
      scrollWidth: document.documentElement.scrollWidth,
      textLength: document.body.innerText.replace(/\s+/g, ' ').trim().length - live,
      cardCount: document.querySelectorAll('.exhibition-card').length,
      chipCount: document.querySelectorAll('.cell .chip').length,
    };
    return out;
  }, { watch: WATCH, props: PROPS });
}

const browser = await chromium.launch();
const page = await browser.newPage();
const SCREENS = [
  ['보드-375', `http://localhost:${PORT}${BASE}/#/`, 375],
  ['보드-1280', `http://localhost:${PORT}${BASE}/#/`, 1280],
  ['일정-375', `http://localhost:${PORT}${BASE}/#/calendar`, 375],
  ['일정-1280', `http://localhost:${PORT}${BASE}/#/calendar`, 1280],
];
const now = {};
for (const [name, url, w] of SCREENS) now[name] = await measure(page, url, w);
await browser.close();
server.close();

const points = (o) => Object.values(o).reduce((a, s) => a + Object.values(s).filter(Boolean).length, 0);

if (mode === 'save') {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  // 어느 환경에서 쟀는지 함께 남긴다 — 상자 크기는 설치된 글꼴에 따라 달라진다
  fs.writeFileSync(OUT, JSON.stringify({ _platform: process.platform, ...now }, null, 1));
  console.log(`기준 저장 — 화면 ${SCREENS.length}개 · 측정점 ${points(now)}개 · ${process.platform}`);
  console.log(`  ${path.relative(ROOT, OUT).replace(/\\/g, '/')}`);
  process.exit(0);
}

if (!fs.existsSync(OUT)) {
  console.error('기준이 없다. 먼저 `node scripts/snapshot-screens.mjs save`.');
  process.exit(1);
}
const saved = JSON.parse(fs.readFileSync(OUT, 'utf8'));
const { _platform: basePlatform, ...base } = saved;

/**
 * **상자 크기는 환경을 넘지 못한다.** 설치된 한글 글꼴이 다르면 같은 글이
 * 다른 폭으로 그려지고, 그래서 리눅스 CI 에서 상자만 수십 곳 어긋난다.
 * 색 · 글자크기 · 여백 같은 계산된 값은 글꼴과 무관하므로 어디서든 비교된다.
 *
 * 기준을 찍은 환경과 같을 때만 상자를 본다. 다르면 그 사실을 밝히고 건너뛴다 —
 * 조용히 넘어가면 "통과했으니 레이아웃도 같다"고 오해하게 된다.
 */
const sameEnv = !basePlatform || basePlatform === process.platform;
if (!sameEnv) {
  console.log(`기준은 ${basePlatform} 에서 찍혔고 지금은 ${process.platform} 이다.`);
  console.log('글꼴이 달라 글자 폭이 달라지므로 **상자 크기는 비교하지 않는다.**');
  console.log('색 · 글자 · 여백 등 계산된 값만 본다.\n');
}

const diffs = [];
for (const screen of Object.keys(base)) {
  const b = base[screen], c = now[screen];
  if (!c) { diffs.push(`${screen}: 화면이 사라졌다`); continue; }
  for (const sel of Object.keys(b)) {
    const bv = b[sel], cv = c[sel];
    if (!bv && !cv) continue;
    if (!bv || !cv) { diffs.push(`${screen} ${sel}: ${bv ? '사라졌다' : '새로 생겼다'}`); continue; }
    if (sel === '#문서') {
      for (const k of Object.keys(bv)) {
        if (k === 'scrollWidth' && !sameEnv) continue;   // 레이아웃 값이라 글꼴을 탄다
        if (bv[k] !== cv[k]) diffs.push(`${screen} ${sel}.${k}: ${bv[k]} → ${cv[k]}`);
      }
      continue;
    }
    if (bv.count !== cv.count) diffs.push(`${screen} ${sel}: 개수 ${bv.count} → ${cv.count}`);
    if (sameEnv && (bv.box.w !== cv.box.w || bv.box.h !== cv.box.h))
      diffs.push(`${screen} ${sel}: 상자 ${bv.box.w}×${bv.box.h} → ${cv.box.w}×${cv.box.h}`);
    for (const p of Object.keys(bv.style))
      if (bv.style[p] !== cv.style[p])
        diffs.push(`${screen} ${sel}.${p}: ${bv.style[p]} → ${cv.style[p]}`);
  }
}

if (diffs.length) {
  console.error(`화면이 달라졌다 — ${diffs.length}곳\n`);
  diffs.slice(0, 60).forEach((d) => console.error(`  · ${d}`));
  if (diffs.length > 60) console.error(`  … 그 밖에 ${diffs.length - 60}곳`);
  console.error('\n의도한 변경이면 `node scripts/snapshot-screens.mjs save` 로 기준을 갱신한다.\n');
  process.exit(1);
}
console.log(`화면 대조 통과 — 화면 4개 · 측정점 ${points(now)}개가 기준과 같다`);
