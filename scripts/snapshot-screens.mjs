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
import { fileURLToPath } from 'node:url';
import { serveStatic } from './static-server.mjs';
import { FROZEN_AT, FROZEN_DAY, freezeClock } from './frozen-clock.mjs';
import { serveFrozenData, failOnFrozenMisses } from './frozen-data.mjs';

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
const server = await serveStatic(DIST, PORT);

/**
 * 화면마다 이 선택자들의 계산된 스타일과 상자를 잰다.
 *
 * ── 왜 `.card-regular` · `.tag-regular` 가 따로 있나 ──────────
 * 아래 `measure` 는 선택자마다 **첫 요소만**(`els[0]`) 잰다. 개수는 다 세지만
 * 색·상자는 맨 앞 하나 것이다. 그래서 `.card` 하나만 감시하면 **어느 카드가
 * 첫 번째인지에 따라 재는 대상이 바뀐다.**
 *
 * 2026-09-02 에 실제로 그랬다 — 카르멘(9/12)이 들어오면서 첫 카드가 정기관람
 * (서도호)에서 수시로 밀렸고, 기준의 `.card` 가 초록 세로선에서 `none` 으로,
 * `.tag` 가 초록 채움에서 연초록으로 바뀌었다. 디자인은 한 줄도 안 건드렸는데
 * 기준이 통째로 달라 보였고, 그 뒤로 **정기관람 카드의 초록 표시를 재는 자리가
 * 하나도 남지 않았다.** 그게 깨져도 이 검사는 초록불이 된다.
 *
 * 정기 전용 클래스를 따로 적으면 순서가 어떻게 바뀌든 그 스타일을 계속 잰다.
 * 같은 성질의 자리가 또 생기면(예: `.chip.regular`) 같은 이유로 여기에 더한다.
 */
const WATCH = [
  'body', '.app-shell', '.topbar', '.topbar h1', '.eyebrow',
  '.area-tabs', '.area-tab', '.area-tab.is-active',
  '.content-type-tabs', '.content-type-tab', '.content-type-tab.is-active',
  '.recommendation-group-head', '.recommendation-group-head h3',
  '.exhibition-card', '.exhibition-rank', '.exhibition-venue', '.exhibition-card h3',
  '.exhibition-summary', '.exhibition-details dt', '.exhibition-details dd',
  '.exhibition-reason', '.button.primary', '.official-info-link',
  '.stars', '.rating-source',
  '.digest', '.digest-head', '.digest-title', '.digest-decisions', '.digest-open-questions',
  '.sec', '.card', '.card-regular', '.db', '.db .d',
  '.tag', '.tag-regular',
  // 다가오는 확정 모임 카드의 핵심 줄(2026-09-26). 옛 '.meta' · '.card-alert' 는 이 카드에만 쓰였다.
  '.mfacts', '.mfact-label', '.mfact-val', '.mfact-must', '.mcard-more',
  '.cal', '.wd', '.cell', '.dnum', '.chip',
  '.survey-jump', '.survey-jump-list li',
  // 카드 안쪽 — 바깥 상자만 재면 알약 폭 · 안내문 색이 바뀌어도 통과했다(2026-09-25 변이 시험).
  // `.survey-tab` 만 적으면 위쪽 탭 줄의 알약이 첫 요소가 되므로 카드 안으로 좁힌다.
  '.survey-jump h2', '.survey-jump p:not(.board-jump-kicker)', '.survey-jump-list .survey-tab',
  // 일정 화면의 「문화 콘텐츠 공유 보드」 카드(.board-jump)는 2026-09-26 에 걷었다 — 사이트 띠가 맡는다.
  // 맨 위 사이트 띠. `.site-nav-tab` 만 적으면 일정 화면에서는 첫 칸이 지금 칸이라
  // 쉬는 칸의 모양이 기준에 안 남는다 — 둘을 따로 적는다.
  '.site-nav', '.site-nav-list', '.site-nav-tab:not([aria-current])', '.site-nav-tab[aria-current]',
];

/** 색·글자·간격·상자 — 눈에 보이는 것을 정하는 값들 */
const PROPS = [
  'color', 'backgroundColor', 'borderTopColor', 'borderTopWidth', 'borderRadius',
  'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'fontFamily',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'marginTop', 'marginBottom', 'display', 'flexDirection', 'gap',
  'textAlign', 'boxShadow', 'opacity',
  // 상자 크기는 리눅스 CI 에서 건너뛰므로, 폭을 정하는 규칙 값은 계산된 값으로 따로 본다
  'minWidth',
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
      // 맥 크로미엄은 서체 열의 BlinkMacSystemFont 를 "system-ui" 로 보고한다 — 같은 열이다.
      // 이름만 다른 것을 디자인 변화로 읽지 않도록 한 이름으로 맞춘다 (2026-09-25, 맥 기준선이 CI 리눅스에서 54곳 어긋났다).
      if (typeof style.fontFamily === 'string') style.fontFamily = style.fontFamily.replace(/"?system-ui"?/g, 'BlinkMacSystemFont');
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
     * 카드는 2026-09-25 부터 투표 화면(`투표-*`)에만 있다 — 다른 화면에서는 이 값이 0 이다.
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
// 날짜를 타는 화면이라 시계를 묶는다 — 안 묶으면 내일 이 검사가 거짓으로 실패한다
await freezeClock(page);
// DB 응답도 떠 둔 것으로 고정한다 — 보드가 갱신되면 이 검사가 거짓으로 실패한다
await serveFrozenData(page);
const SCREENS = [
  ['보드-375', `http://127.0.0.1:${PORT}${BASE}/#/`, 375],
  ['보드-1280', `http://127.0.0.1:${PORT}${BASE}/#/`, 1280],
  ['일정-375', `http://127.0.0.1:${PORT}${BASE}/#/calendar`, 375],
  ['일정-1280', `http://127.0.0.1:${PORT}${BASE}/#/calendar`, 1280],
  // 투표 현황 카드(`.survey-jump`)는 2026-09-25(#190)부터 투표 화면에만 있다. 이 두 화면이 없으면
  // 위 WATCH 의 카드 두 줄과 아래 `live` 빼기가 재는 자리를 잃는다.
  ['투표-375', `http://127.0.0.1:${PORT}${BASE}/#/survey`, 375],
  ['투표-1280', `http://127.0.0.1:${PORT}${BASE}/#/survey`, 1280],
];
const now = {};
for (const [name, url, w] of SCREENS) now[name] = await measure(page, url, w);
await browser.close();
server.close();
failOnFrozenMisses();

const points = (o) => Object.values(o).reduce((a, s) => a + Object.values(s).filter(Boolean).length, 0);

if (mode === 'save') {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  // 어느 환경에서 쟀는지 함께 남긴다 — 상자 크기는 설치된 글꼴에 따라 달라진다
  fs.writeFileSync(OUT, JSON.stringify(
    { _platform: process.platform, _frozenAt: FROZEN_AT, ...now }, null, 1));
  console.log(`기준 저장 — 화면 ${SCREENS.length}개 · 측정점 ${points(now)}개`
    + ` · ${process.platform} · 시계를 ${FROZEN_DAY} 에 묶고 쟀다`);
  console.log(`  ${path.relative(ROOT, OUT).replace(/\\/g, '/')}`);
  process.exit(0);
}

if (!fs.existsSync(OUT)) {
  console.error('기준이 없다. 먼저 `node scripts/snapshot-screens.mjs save`.');
  process.exit(1);
}
const saved = JSON.parse(fs.readFileSync(OUT, 'utf8'));
const { _platform: basePlatform, _frozenAt: baseFrozen, ...base } = saved;

/**
 * **기준을 찍은 날과 지금 재는 날이 같아야 한다.**
 * 화면이 날짜를 타므로, 묶어 둔 날이 다르면 비교 자체가 성립하지 않는다.
 * 조용히 넘어가면 「디자인이 바뀌었다」 는 엉뚱한 보고가 쏟아진다.
 */
if (baseFrozen !== FROZEN_AT) {
  console.error(baseFrozen
    ? `기준은 ${baseFrozen} 로 묶고 찍혔는데 지금은 ${FROZEN_AT} 로 잰다.`
    : '기준이 시계를 묶기 전에 찍혔다.');
  console.error('같은 날로 맞춰야 비교가 된다 — `node scripts/snapshot-screens.mjs save` 로 다시 찍는다.');
  process.exit(1);
}

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
// SCREENS 에 더했는데 기준을 안 찍었으면 그 화면은 대조되지 않은 채 통과해 버린다 — 실패로 알린다
for (const screen of Object.keys(now)) {
  if (!base[screen]) diffs.push(`${screen}: 기준에 없는 화면이다 — save 로 기준을 찍어야 대조된다`);
}
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
console.log(`화면 대조 통과 — 화면 ${Object.keys(now).length}개 · 측정점 ${points(now)}개가 기준과 같다`
  + ` (시계는 ${FROZEN_DAY} 에 묶고 쟀다)`);
