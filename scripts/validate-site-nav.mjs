#!/usr/bin/env node
/**
 * validate-site-nav.mjs — 맨 위 사이트 띠(「모임 일정 · 관람 정보 · 투표」)를 지킨다.
 *
 *   node scripts/validate-site-nav.mjs      (npm run build 뒤)
 *
 * ── 왜 따로 두나 ────────────────────────────────────────────
 * 띠는 모든 화면에 붙는 유일한 것이라, 한 화면씩 보는 기존 검사기들 틈에 끼워 넣으면
 * 어디서는 재고 어디서는 빠진다. 화면 대조는 `position` · `top` 을 재지 않아 띠가
 * 화면에 붙지 않게 돼도 통과하고, 글씨 200% 검사는 `.wrap` 안만 본다. 그래서 한곳에 모은다.
 *
 * ── 무엇을 보나 ────────────────────────────────────────────
 *   (가) 주소마다 — 띠가 하나이고 맨 앞에 있는지, 세 칸의 글자 · 주소 · 순서,
 *        어느 칸이 켜지는지(aria-current), 띠 안에 h1 이 없는지, 창 제목,
 *        페이지 안 앵커(href="#id")가 없는지 — 해시 라우터가 「그런 화면은 없습니다」 로 보낸다
 *   (나) 글씨를 키운 휴대폰 — 320 · 360 · 375px 에서 ×1.6 · ×2 로 키워도
 *        가로로 넘치지 않고, 줄이 겹치지 않고, 세 칸의 글자 높이가 맞는지
 *   (다) 내려도 띠가 화면 위에 붙어 있는지
 *   (라) 누르면 — 다른 칸은 새 화면 맨 위로 · 제목에 초점, 지금 칸은 맨 위로,
 *        뒤로 가기는 보던 자리로
 *   (마) 보드 · 일정 · 투표에서 띠가 똑같이 그려지는지 — 화면마다 body 규칙이 다르다
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { freezeClock } from './frozen-clock.mjs';
import { serveFrozenData, failOnFrozenMisses } from './frozen-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '/exhibition-club-survey';
const PORT = 8263;

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright 가 없어 건너뛴다'); process.exit(0); }

if (!fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) {
  console.error('dist 가 없다 — npm run build 를 먼저 돌린다.');
  process.exit(1);
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css',
  '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (u.startsWith(BASE)) u = u.slice(BASE.length);
  if (u === '' || u === '/') u = '/index.html';
  fs.readFile(path.join(ROOT, 'dist', u), (e, d) => {
    if (e) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(u)] ?? 'application/octet-stream' });
    res.end(d);
  });
});
await new Promise((r) => server.listen(PORT, r));
const URL0 = `http://localhost:${PORT}${BASE}/`;

const fails = [];
const ok = (name, cond, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${name}${!cond && detail ? ` — ${detail}` : ''}`);
  if (!cond) fails.push(name);
};

const LABELS = ['모임 일정', '관람 정보', '투표'];
const HREFS = ['#/calendar', '#/', '#/survey'];
const SITE = '41교구 전시·박물관 동아리';
/** 주소 → 켜지는 칸(0·1·2 / 없음) · aria-current 값 · 창 제목 */
const ROUTES = [
  ['', 1, 'page', '관람 정보 · 문화 콘텐츠 공유 보드'],
  ['#/', 1, 'page', '관람 정보 · 문화 콘텐츠 공유 보드'],
  ['#/calendar', 0, 'page', `모임 일정 · ${SITE}`],
  // 투표 화면의 갈래 알약이 이미 page 라서 띠는 true — 「현재 페이지」 가 두 번 읽히지 않게
  ['#/survey', 2, 'true', `투표 · ${SITE}`],
  ['#/survey/meal', 2, 'true', `투표 · ${SITE}`],
  ['#/survey/google', 2, 'true', `투표 · ${SITE}`],
  ['#/survey/club', 2, 'true', `투표 · ${SITE}`],   // 숨긴 갈래의 옛 주소 — 관람 장소로 떨어진다
  ['#/survey/admin', null, null, '문화 콘텐츠 공유 보드'],
  ['#/no-such-screen', null, null, '문화 콘텐츠 공유 보드'],
];

const browser = await chromium.launch();
const context = await browser.newContext({ locale: 'ko-KR', timezoneId: 'Asia/Seoul' });
const page = await context.newPage();
await freezeClock(page);
await serveFrozenData(page);

const open = async (hash, width = 375) => {
  await page.setViewportSize({ width, height: 812 });
  await page.goto('about:blank');
  await page.goto(URL0 + hash, { waitUntil: 'networkidle' });
  await page.waitForSelector('.site-nav');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
};

/* ── (가) 주소마다 ─────────────────────────────────────────── */
console.log('\n(가) 주소마다 띠의 모양과 켜지는 칸');
for (const [hash, on, cur, title] of ROUTES) {
  await open(hash);
  const m = await page.evaluate(() => {
    const navs = document.querySelectorAll('nav.site-nav');
    const nav = navs[0];
    const tabs = [...nav.querySelectorAll('.site-nav-tab')];
    return {
      count: navs.length,
      first: document.getElementById('root')?.firstElementChild === nav,
      labels: tabs.map((a) => a.textContent.trim()),
      hrefs: tabs.map((a) => a.getAttribute('href')),
      current: tabs.map((a) => a.getAttribute('aria-current')),
      h1InNav: nav.querySelectorAll('h1').length,
      stray: [...document.querySelectorAll('a[href^="#"]:not([href^="#/"])')].map((a) => a.getAttribute('href')),
      title: document.title,
    };
  });
  const want = LABELS.map((_, i) => (i === on ? cur : null));
  const name = hash || '(해시 없음)';
  ok(`${name} — 띠 하나, 맨 앞`, m.count === 1 && m.first, `개수 ${m.count}, 맨 앞 ${m.first}`);
  ok(`${name} — 세 칸 글자 · 주소 · 순서`,
    m.labels.join('|') === LABELS.join('|') && m.hrefs.join('|') === HREFS.join('|'),
    `${m.labels.join('·')} / ${m.hrefs.join(' ')}`);
  ok(`${name} — 켜진 칸 ${on === null ? '없음' : `「${LABELS[on]}」=${cur}`}`,
    JSON.stringify(m.current) === JSON.stringify(want), JSON.stringify(m.current));
  ok(`${name} — 띠 안에 h1 없음`, m.h1InNav === 0);
  ok(`${name} — 페이지 안 앵커 없음`, m.stray.length === 0, m.stray.join(' '));
  ok(`${name} — 창 제목`, m.title === title, m.title);
}

/* ── (나) 글씨를 키운 휴대폰 ───────────────────────────────── */
/**
 * 안드로이드 · 카톡의 글자 크기 설정처럼 글자만 키운다(칸 폭은 그대로).
 * 스타일시트를 넣으면 CSP 가 막으므로 CSSOM 으로 칸마다 준다 — CSP 는 CSSOM 을 막지 않는다.
 * 지금 칸을 「투표」(가장 짧은 이름)로 둔다 — 다른 칸만 두 줄로 접힐 때 어긋남이 가장 크다.
 */
console.log('\n(나) 글씨를 키운 휴대폰 — 지금 칸 「투표」');
const heights = [];
for (const width of [320, 360, 375]) {
  for (const scale of [1, 1.6, 2]) {
    await open('#/survey', width);
    const m = await page.evaluate((s) => {
      const nav = document.querySelector('.site-nav');
      const tabs = [...nav.querySelectorAll('.site-nav-tab')];
      for (const a of tabs) a.style.fontSize = `${16 * s}px`;
      const lineBoxes = (a) => {
        const lines = [];
        const walk = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
        for (let n = walk.nextNode(); n; n = walk.nextNode()) {
          if (!n.textContent.trim()) continue;
          const rg = document.createRange(); rg.selectNodeContents(n);
          for (const r of rg.getClientRects()) {
            if (r.width < 1) continue;
            const l = lines.find((x) => Math.abs(x.top - r.top) < 2);
            if (l) l.bottom = Math.max(l.bottom, r.bottom); else lines.push({ top: r.top, bottom: r.bottom });
          }
        }
        return lines.sort((x, y) => x.top - y.top);
      };
      const rows = tabs.map((a) => {
        const r = a.getBoundingClientRect();
        const lines = lineBoxes(a);
        const cs = getComputedStyle(a);
        return {
          current: a.hasAttribute('aria-current'), h: r.height,
          center: (lines[0].top + lines[lines.length - 1].bottom) / 2,
          overlap: lines.some((l, i) => i > 0 && l.top < lines[i - 1].bottom - 1),
          ratio: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize),
        };
      });
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        navH: Math.round(nav.getBoundingClientRect().height), rows,
      };
    }, scale);
    const rest = m.rows.filter((r) => !r.current);
    const cur = m.rows.find((r) => r.current);
    const centers = m.rows.map((r) => r.center);
    const tag = `${width}px ×${scale}`;
    heights.push(`${tag}=${m.navH}`);
    ok(`${tag} — 가로로 넘치지 않는다`, !m.overflow);
    ok(`${tag} — 줄 높이가 비율이다(≥1.2)`, m.rows.every((r) => r.ratio >= 1.2), m.rows.map((r) => r.ratio.toFixed(2)).join('/'));
    ok(`${tag} — 칸 안의 줄이 겹치지 않는다`, !m.rows.some((r) => r.overlap));
    ok(`${tag} — 쉬는 칸 높이가 같다`, Math.abs(rest[0].h - rest[1].h) <= 1, rest.map((r) => r.h).join('/'));
    ok(`${tag} — 지금 칸은 쉬는 칸보다 4 길다`, Math.abs(cur.h - rest[0].h - 4) <= 1, `${cur.h} − ${rest[0].h}`);
    ok(`${tag} — 세 칸의 글자 높이가 맞는다`, Math.max(...centers) - Math.min(...centers) <= 1,
      centers.map((c) => c.toFixed(1)).join('/'));
    if (scale === 1) ok(`${tag} — 띠 높이 52`, m.navH === 52, String(m.navH));
  }
}
console.log(`  · 띠 높이: ${heights.join(' · ')}`);

/* ── (다) 내려도 붙어 있다 ─────────────────────────────────── */
console.log('\n(다) 내려도 띠가 위에 붙어 있다');
for (const hash of ['#/', '#/calendar']) {
  await open(hash);
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(150);
  const top = await page.evaluate(() => [window.scrollY, document.querySelector('.site-nav').getBoundingClientRect().top]);
  ok(`${hash} — 1200px 내려도 띠의 위치가 0`, top[0] >= 1100 && Math.round(top[1]) === 0, `scrollY ${top[0]}, top ${top[1]}`);
}

/* ── (라) 누르면 ───────────────────────────────────────────── */
console.log('\n(라) 누르면');
/**
 * 손가락처럼 그 자리를 누른다. locator.click() 은 누르기 전에 스스로 페이지를 굴려서
 * (이 띠에서는 434px) 「누를 때의 자리」 가 틀어지고, 뒤로 가기 검사가 헛돈다.
 */
const press = async (label) => {
  const box = await page.locator('.site-nav-tab', { hasText: label }).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};
const state = () => page.evaluate(() => ({
  hash: location.hash, y: Math.round(window.scrollY),
  focus: document.activeElement?.tagName === 'H1' && !!document.activeElement.closest('main'),
}));

await open('#/');
await page.waitForSelector('.exhibition-card');
await page.evaluate(() => window.scrollTo(0, 4000));
await press('모임 일정');
await page.waitForFunction(() => location.hash === '#/calendar');
await page.waitForTimeout(200);
let s = await state();
ok('보드 아래쪽에서 「모임 일정」 → 일정 맨 위, 제목에 초점', s.y === 0 && s.focus, JSON.stringify(s));

await page.evaluate(() => window.scrollTo(0, 800));
await press('모임 일정');
await page.waitForTimeout(200);
s = await state();
ok('일정에서 「모임 일정」 다시 누름 → 맨 위, 주소 그대로', s.y === 0 && s.hash === '#/calendar', JSON.stringify(s));

await open('#/survey/meal');
await page.evaluate(() => window.scrollTo(0, 300));
await press('투표');
await page.waitForFunction(() => location.hash === '#/survey');
await page.waitForTimeout(200);
s = await state();
ok('식사·Tea 에서 「투표」 → 관람 장소 맨 위', s.y === 0, JSON.stringify(s));

await open('#/');
await page.waitForSelector('.exhibition-card');
await page.evaluate(() => window.scrollTo(0, 3000));
await page.waitForTimeout(150);
await press('모임 일정');
await page.waitForFunction(() => location.hash === '#/calendar');
await page.waitForTimeout(300);
await page.goBack();
await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
await page.waitForTimeout(600);
s = await state();
// 보드는 목록을 새로 받아 와서 처음엔 짧다 — 다 자란 뒤 그 자리에 서야 한다
ok('보드 3000px → 「모임 일정」 → 뒤로 가기 → 보던 자리', Math.abs(s.y - 3000) <= 2, JSON.stringify(s));

await open('#/calendar');
await page.evaluate(() => window.scrollTo(0, 1500));
await page.waitForTimeout(150);
await press('투표');
await page.waitForFunction(() => location.hash === '#/survey');
await page.waitForTimeout(300);
await page.goBack();
await page.waitForFunction(() => location.hash === '#/calendar');
await page.waitForTimeout(600);
s = await state();
// 투표 화면이 짧아 브라우저에 맡기면 1066px 에 섰다(2026-09-26)
ok('일정 1500px → 「투표」 → 뒤로 가기 → 보던 자리', Math.abs(s.y - 1500) <= 2, JSON.stringify(s));

// 앞으로 가기도 떠날 때의 자리다 — 링크로 떠난 칸만 기억하면 앞으로 가기가 맨 위로 떨어졌다(2026-09-26 검토)
await open('#/');
await page.waitForSelector('.exhibition-card');
await page.evaluate(() => window.scrollTo(0, 3000));
await page.waitForTimeout(150);
await press('모임 일정');
await page.waitForFunction(() => location.hash === '#/calendar');
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 1200));
await page.waitForTimeout(300);
await page.goBack();
await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
await page.waitForTimeout(600);
await page.goForward();
await page.waitForFunction(() => location.hash === '#/calendar');
await page.waitForTimeout(600);
s = await state();
ok('보드 → 일정 1200px → 뒤로 → 앞으로 가기 → 일정 1200px', Math.abs(s.y - 1200) <= 2, JSON.stringify(s));

// 새로 고침 · 다른 페이지에서 돌아오기도 보던 자리다 — 브라우저에 맡겼을 때 1548px · 0px 로 들쭉날쭉했다.
// **느린 기기처럼** 잰다 — 리눅스 CI 에서는 자리를 맞춘 뒤 늦게 온 자료(정리봇 · 목록)가 위쪽 높이를
// 바꿔 일정은 25px, 보드는 카드가 83px 밀렸다(2026-09-26). CPU 를 4배 늦추고 자료를 1.2초 늦게 준다.
const cdp = await context.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
// 새로 고침에서도 글꼴을 캐시에서 꺼내지 않게 한다 — 그래야 글꼴이 자리를 맞춘 **뒤에** 바뀐다
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
const late = async (route) => { await new Promise((r) => setTimeout(r, 1200)); await route.fallback(); };
await page.route('**/rest/v1/**', late);
await page.route('**/weekly-digest.public.json', late);
await page.route('**/*.woff2', late);
await open('#/calendar');
await page.evaluate(() => window.scrollTo(0, 1500));
await page.waitForTimeout(300);
const beforeReload = await page.evaluate(() => Math.round(window.scrollY));
await page.reload({ waitUntil: 'commit' });
// 실패하면 무엇이 언제 움직였는지 남긴다 — CI 에서만 나는 일은 로그밖에 볼 것이 없다
const timeline = [];
for (const t of [0, 150, 300, 600, 1200, 2400, 4000]) {
  await page.waitForTimeout(t ? t - (timeline.at(-1)?.t ?? 0) : 0);
  timeline.push({ t, ...(await page.evaluate(() => ({ y: Math.round(window.scrollY),
    h: document.documentElement.scrollHeight, fonts: document.fonts.status }))) });
}
s = await state();
ok('일정 1500px 에서 새로 고침 → 보던 자리', Math.abs(s.y - beforeReload) <= 2,
  `${beforeReload} → ${JSON.stringify(s)} · ${timeline.map((p) => `${p.t}ms y${p.y} h${p.h} ${p.fonts}`).join(' | ')}`);

// 보드는 새로 고치면 글꼴 · 목록이 다시 들어오며 몇십 px 씩 자리가 바뀐다(실측 −21px).
// 픽셀이 아니라 **화면 가운데에 보이던 카드가 그대로인지** 본다.
const cardInView = () => page.evaluate(() => {
  const card = document.elementFromPoint(187, 400)?.closest('.exhibition-card');
  return card ? { title: card.querySelector('h3')?.textContent?.trim(), top: Math.round(card.getBoundingClientRect().top) } : null;
});
await open('#/');
await page.waitForSelector('.exhibition-card');
await page.evaluate(() => window.scrollTo(0, 3000));
await page.waitForTimeout(300);
const seen = await cardInView();
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.exhibition-card');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2000);
const again = await cardInView();
ok('보드 3000px 에서 새로 고침 → 목록이 다 온 뒤 같은 카드가 같은 자리', !!seen && !!again
  && seen.title === again.title && Math.abs(seen.top - again.top) <= 40, `${JSON.stringify(seen)} → ${JSON.stringify(again)}`);

await open('#/survey/google');
await page.evaluate(() => window.scrollTo(0, 300));
await page.waitForTimeout(300);
const yGoogle = await page.evaluate(() => Math.round(window.scrollY));
await page.goto(`${URL0}survey-result.html`, { waitUntil: 'load' });
await page.goBack({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);
s = await state();
ok('구글 설문에서 결과 페이지에 다녀오면 보던 자리', s.hash === '#/survey/google' && Math.abs(s.y - yGoogle) <= 2,
  `${yGoogle} → ${JSON.stringify(s)}`);
await page.unroute('**/*.woff2', late);
await page.unroute('**/weekly-digest.public.json', late);
await page.unroute('**/rest/v1/**', late);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });

// 띠의 칸으로 초점이 가도 페이지가 구르지 않는다 — html 에 scroll-padding 을 줬을 때 칸마다 360px 굴렀다
await open('#/calendar');
await page.evaluate(() => window.scrollTo(0, 2500));
await page.waitForTimeout(200);
const before = await page.evaluate(() => Math.round(window.scrollY));
await page.evaluate(() => { for (const a of document.querySelectorAll('.site-nav-tab')) a.focus(); });
await page.waitForTimeout(200);
s = await state();
ok('띠의 칸으로 초점이 옮겨 가도 제자리', s.y === before, `${before} → ${s.y}`);

// 안 구르고 떠난 칸 — 스크롤 이벤트가 없어 자리가 비면, 앞으로 가기에서 앞 화면의 자리를 물려받았다
await open('#/');
await page.waitForSelector('.exhibition-card');
await press('모임 일정');
await page.waitForFunction(() => location.hash === '#/calendar');
await page.waitForTimeout(300);
await page.goBack();
await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
await page.waitForTimeout(600);
await page.evaluate(() => window.scrollTo(0, 2000));
await page.waitForTimeout(300);
await page.goForward();
await page.waitForFunction(() => location.hash === '#/calendar');
await page.waitForTimeout(800);
s = await state();
ok('안 구르고 떠난 일정에 앞으로 가기로 돌아오면 맨 위', s.y === 0, JSON.stringify(s));

// 보드의 필터도 자리와 함께 — 필터만 기본값으로 돌아가면 엉뚱한 목록의 한가운데에 섰다
await open('#/');
await page.waitForSelector('.exhibition-card');
await page.locator('.content-type-tab', { hasText: '음악공연' }).click();
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 600));
await page.waitForTimeout(300);
const typeBefore = await page.$eval('.content-type-tab.is-active', (e) => e.textContent.trim());
const cardBefore = await cardInView();
await press('모임 일정');
await page.waitForFunction(() => location.hash === '#/calendar');
await page.waitForTimeout(300);
await page.goBack();
await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
await page.waitForSelector('.exhibition-card');
await page.waitForTimeout(1500);
const typeAfter = await page.$eval('.content-type-tab.is-active', (e) => e.textContent.trim());
const cardAfter = await cardInView();
ok('보드에서 고른 유형 · 보던 카드가 뒤로 가기 뒤에도 그대로',
  typeAfter === typeBefore && cardBefore?.title === cardAfter?.title,
  `${typeBefore} ${JSON.stringify(cardBefore)} → ${typeAfter} ${JSON.stringify(cardAfter)}`);

// 되살리기는 한 번에 하나 — 다른 페이지에서 돌아와 보드 목록을 기다리던 되살리기가 뒤로 가기 뒤까지
// 남아 앞 화면(일정)을 보드의 자리로 끌고 갔고, 그 자리를 일정 것으로 적었다(2026-09-26 검토)
await open('#/calendar');
await page.evaluate(() => window.scrollTo(0, 800));
await page.waitForTimeout(300);
await press('관람 정보');
await page.waitForFunction(() => location.hash === '#/');
await page.waitForSelector('.exhibition-card');
await page.evaluate(() => window.scrollTo(0, 3000));
await page.waitForTimeout(300);
await page.goto(`${URL0}survey-result.html`, { waitUntil: 'load' });
const slowList = async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.fallback(); };
await page.route('**/rest/v1/events**', slowList);
await page.goBack({ waitUntil: 'commit' });
await page.waitForSelector('.site-nav');
await page.waitForTimeout(250);
await page.goBack();
await page.waitForFunction(() => location.hash === '#/calendar');
await page.waitForTimeout(3000);
await page.unroute('**/rest/v1/events**', slowList);
s = await state();
ok('보드 목록을 기다리는 중에 뒤로 가도 일정은 보던 자리(800)', Math.abs(s.y - 800) <= 2, JSON.stringify(s));

/* ── (마) 세 화면에서 똑같이 ───────────────────────────────── */
console.log('\n(마) 보드 · 일정 · 투표에서 띠가 똑같다');
const PROPS = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'backgroundColor',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopLeftRadius',
  'borderBottomLeftRadius', 'webkitFontSmoothing'];
const looks = {};
for (const hash of ['#/', '#/calendar', '#/survey']) {
  await open(hash);
  looks[hash] = await page.evaluate((props) => {
    const pick = (el) => { const c = getComputedStyle(el); const r = el.getBoundingClientRect();
      return JSON.stringify([...props.map((p) => c[p]), Math.round(r.height)]); };
    return {
      nav: pick(document.querySelector('.site-nav')),
      rest: pick(document.querySelector('.site-nav-tab:not([aria-current])')),
      current: pick(document.querySelector('.site-nav-tab[aria-current]')),
    };
  }, PROPS);
}
for (const part of ['nav', 'rest', 'current']) {
  const vals = Object.values(looks).map((l) => l[part]);
  ok(`${part === 'nav' ? '띠' : part === 'rest' ? '쉬는 칸' : '지금 칸'}의 계산된 모양이 세 화면에서 같다`,
    vals.every((v) => v === vals[0]), vals.join('\n      '));
}

await browser.close();
server.close();
failOnFrozenMisses();

console.log(`\n${fails.length ? `사이트 띠 검사 실패 — ${fails.length}건: ${fails.join(', ')}` : '사이트 띠 검사 통과'}`);
process.exit(fails.length ? 1 : 0);
