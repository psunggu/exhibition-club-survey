#!/usr/bin/env node
/**
 * render-notice-image.mjs — 단톡방에 붙일 **일정 공지 이미지**를 만든다.
 *
 *   node scripts/render-notice-image.mjs            라이브 사이트에서
 *   node scripts/render-notice-image.mjs --local    로컬 dist 에서
 *
 * ── 왜 화면을 찍어서 만드나 ────────────────────────────────
 * 공지 이미지를 따로 그리면 사이트와 디자인이 **갈라진다.**
 * 실제로 예전 공지 이미지(7-8월)는 손으로 맞춘 것이라, 사이트가 바뀔 때마다
 * 다시 맞춰야 했다.
 *
 * 그래서 일정 화면 그 자체를 찍는다. 색·글꼴·간격이 어긋날 수 없다 —
 * 같은 CSS 를 쓰기 때문이다. 대신 공유용으로 어울리지 않는 것만 감춘다.
 *
 * 480 CSS px 를 3배로 찍어 1440px 이미지를 만든다.
 * 예전 공지 이미지가 1440px 이었고, 카카오톡에서 확대해도 글자가 깨지지 않는 크기다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const local = process.argv.includes('--local');
const BASE_PATH = '/exhibition-club-survey';

/** 공유 이미지에 넣지 않을 것 — 눌러야 뜻이 있는 것, 이미지에선 죽은 것 */
const HIDE = [
  '.board-jump',      // 이미지에서는 누를 수 없다
  '.digest',          // 운영진 확인용 요약이라 공지에 넣지 않는다
  '.completed-toggle',
  '.completed-calendar',
];

let server = null;
let url = 'https://psunggu.github.io/exhibition-club-survey/#/calendar';

if (local) {
  const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css',
    '.js': 'text/javascript', '.json': 'application/json' };
  server = http.createServer((req, res) => {
    let u = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (u.startsWith(BASE_PATH)) u = u.slice(BASE_PATH.length);
    if (u === '' || u === '/') u = '/index.html';
    fs.readFile(path.join(ROOT, 'dist', u), (e, d) => {
      if (e) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(u)] ?? 'application/octet-stream' });
      res.end(d);
    });
  });
  await new Promise((r) => server.listen(8240, r));
  url = `http://localhost:8240${BASE_PATH}/#/calendar`;
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 480, height: 1200 },
  deviceScaleFactor: 3,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3000);

// 접힌 것을 펼친다 — 이미지에서는 눌러서 열 수 없다
await page.evaluate(() => {
  document.querySelectorAll('details').forEach((d) => { d.open = true; });
});

const result = await page.evaluate((sel) => {
  let n = 0;
  for (const s of sel) {
    document.querySelectorAll(s).forEach((el) => { el.style.display = 'none'; n += 1; });
  }

  /**
   * 감추고 나면 **내용 없는 제목이 남는다.**
   * 실제로 `완료된 모임` 제목만 덩그러니 남아 만들다 만 것처럼 보였다.
   * (사이트에서는 그 아래 접힌 달력이 있어 멀쩡하다 — 이미지에서만 생기는 일이다.)
   *
   * 그래서 제목마다 다음 제목까지의 사이에 보이는 것이 있는지 세어 보고,
   * 하나도 없으면 제목도 함께 감춘다. 무엇을 감추든 알아서 맞는다.
   */
  const dangling = [];
  const heads = [...document.querySelectorAll('h2.sec')];
  for (const h of heads) {
    let seen = false;
    // 꼬리말에서 멈춘다. 안 그러면 꼬리말 글자를 그 절의 내용으로 세어
    // 빈 제목이 살아남는다 — 처음에 그래서 감춰지지 않았다.
    for (let el = h.nextElementSibling; el && !el.matches('h2.sec, footer, .foot'); el = el.nextElementSibling) {
      const cs = getComputedStyle(el);
      if (cs.display !== 'none' && cs.visibility !== 'hidden' && el.textContent.trim()) { seen = true; break; }
    }
    if (!seen) { h.style.display = 'none'; dangling.push(h.textContent.trim()); }
  }
  return { n, dangling };
}, HIDE);

await page.waitForTimeout(600);

const outDir = path.join(ROOT, 'out');
fs.mkdirSync(outDir, { recursive: true });
const stamp = await page.evaluate(() => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date()).replace(/-/g, ''));
const out = path.join(outDir, `모임일정공지_${stamp}.png`);

await page.screenshot({ path: out, fullPage: true });

const size = await page.evaluate(() => ({
  w: document.documentElement.scrollWidth, h: document.body.scrollHeight,
}));

await browser.close();
if (server) server.close();

const bytes = fs.statSync(out).size;
console.log(`만들었다: ${out}`);
console.log(`  원본 ${size.w}×${size.h} CSS px → 이미지 ${size.w * 3}×${size.h * 3} px · ${(bytes / 1024).toFixed(0)}KB`);
console.log(`  감춘 것 ${result.n}개 (${HIDE.join(' ')})`);
if (result.dangling.length) console.log(`  내용이 없어 함께 감춘 제목: ${result.dangling.join(' · ')}`);
console.log(`  출처 ${local ? '로컬 dist' : '라이브 사이트'}`);
if (bytes > 20 * 1024 * 1024) console.log('  ※ 20MB 가 넘는다. 카카오톡에서 화질이 떨어질 수 있다.');
