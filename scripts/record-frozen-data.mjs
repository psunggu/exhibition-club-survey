#!/usr/bin/env node
/**
 * record-frozen-data.mjs — 화면 검사가 쓸 **DB 응답을 한 번 떠서 저장한다.**
 *
 *   node scripts/record-frozen-data.mjs
 *
 * 왜 고정본을 쓰는지는 frozen-data.mjs 에 적었다.
 * 여기서는 **뜨는 방법**만 다룬다.
 *
 * 옛 페이지와 이식본이 **서로 다른 주소로** 같은 표를 읽는다.
 *   옛것   /rest/v1/events?select=*&order=visit_date.asc.nullslast&order=start_date.asc.nullslast
 *   이식본 /rest/v1/events?select=*
 * 둘 다 떠 두지 않으면 옛 화면 대조가 빈 보드를 재게 된다.
 * 그래서 짐작으로 목록을 적지 않고, **실제로 띄워서 오간 것을 그대로 받아 적는다.**
 *
 * dist 가 필요하다 — `npm run build` 가 먼저다.
 * 네트워크가 있어야 한다 (이 스크립트만. 이걸 뜬 뒤에는 검사에 네트워크가 필요 없다).
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { freezeClock, FROZEN_DAY } from './frozen-clock.mjs';
import { requestKey, FROZEN_DATA_FILE } from './frozen-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '/exhibition-club-survey';
const OLD = path.join(ROOT, 'app/public');
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST)) {
  console.error('dist/ 가 없다. 먼저 `npm run build`.');
  process.exit(1);
}

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('playwright 가 없다 — `npm i -D playwright`'); process.exit(1); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css',
  '.js': 'text/javascript', '.json': 'application/json' };
const serve = (root, port, spa) => new Promise((done) => {
  const s = http.createServer((req, res) => {
    let u = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (u.startsWith(BASE)) u = u.slice(BASE.length);
    if (u === '' || u === '/') u = '/index.html';
    if (spa && !path.extname(u)) u = '/index.html';
    fs.readFile(path.join(root, u), (e, d) => {
      if (e) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(u)] ?? 'application/octet-stream' });
      res.end(d);
    });
  });
  s.listen(port, () => done(s));
});

const sOld = await serve(OLD, 8216, false);
const sNew = await serve(DIST, 8217, true);

/**
 * **사람 이름은 떠 두지 않는다.**
 * surveys.created_by 에 설문을 올린 운영진 이름이 들어 있다. 명부에 있는 이름이다.
 * 공개 화면(보드·일정)은 이 값을 쓰지 않고 운영자 화면에서만 고르는 칸에 쓰므로,
 * 지워도 재는 화면은 한 글자도 안 달라진다. 그러면 안 담는 편이 맞다.
 *
 * 빈 문자열로 둔다. 그럴싸한 가짜 이름을 넣으면 이 파일을 읽는 사람이
 * 그게 진짜 값인 줄 안다.
 */
const REDACT_KEYS = new Set(['created_by']);
const redacted = new Set();
const redact = (node) => {
  if (Array.isArray(node)) { node.forEach(redact); return node; }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) {
      if (REDACT_KEYS.has(k) && typeof node[k] === 'string' && node[k]) {
        redacted.add(k); node[k] = '';
      } else redact(node[k]);
    }
  }
  return node;
};
const responses = {};
const browser = await chromium.launch();

/** 화면 검사들이 실제로 여는 자리 전부. 하나라도 빠지면 그 화면이 빈 채로 재진다. */
const VISITS = [
  ['이식 보드', `http://localhost:8217${BASE}/#/`],
  ['이식 일정', `http://localhost:8217${BASE}/#/calendar`],
  ['이식 설문', `http://localhost:8217${BASE}/#/survey`],
  ['이식 설문·식사', `http://localhost:8217${BASE}/#/survey/meal`],
  ['옛 보드', 'http://localhost:8216/index.html'],
  ['옛 일정', 'http://localhost:8216/notice.html'],
];

for (const [label, url] of VISITS) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  // 뜰 때도 시계를 묶는다 — 「오늘」 에 따라 다른 자료를 부르는 화면이 있을 수 있다
  await freezeClock(page);
  const got = [];
  page.on('response', async (res) => {
    const u = res.url();
    if (!u.includes('/rest/v1/')) return;
    const req = res.request();
    let body = '';
    try { body = await res.text(); } catch { return; }
    const key = requestKey(req.method(), u, req.postData());
    if (responses[key]) return;
    // JSON 이면 사람 이름을 지우고 담는다. JSON 이 아니면 그대로 둔다.
    let stored = body;
    try { stored = JSON.stringify(redact(JSON.parse(body))); } catch { /* JSON 이 아니다 */ }
    responses[key] = {
      status: res.status(),
      contentType: (res.headers()['content-type'] ?? 'application/json').split(';')[0],
      body: stored,
    };
    got.push(`${key.slice(0, 90)} — ${(stored.length / 1024).toFixed(1)}KB`);
  });
  await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.close();
  console.log(`── ${label}`);
  if (got.length) got.forEach((g) => console.log(`   ${g}`));
  else console.log('   (새로 뜬 것 없음)');
}

await browser.close();
sOld.close(); sNew.close();

const keys = Object.keys(responses);
if (!keys.length) {
  console.error('\n아무것도 못 떴다 — 네트워크나 config.js 를 확인한다.');
  process.exit(1);
}
/** 500 이나 빈 몸통을 떠 두면 그 화면이 영영 빈 채로 재진다. 그런 것은 안 받는다. */
const bad = keys.filter((k) => responses[k].status >= 400);
if (bad.length) {
  console.error(`\n오류 응답이 섞였다 — 저장하지 않는다.`);
  bad.forEach((k) => console.error(`  · ${responses[k].status}  ${k.slice(0, 120)}`));
  process.exit(1);
}

fs.mkdirSync(path.dirname(FROZEN_DATA_FILE), { recursive: true });
fs.writeFileSync(FROZEN_DATA_FILE, JSON.stringify(
  { _recordedOn: FROZEN_DAY,
    _note: '화면 검사 전용. 실제 DB 확인은 verify-survey-live.mjs 가 한다.',
    _redacted: [...redacted],
    responses }, null, 1));

const size = fs.statSync(FROZEN_DATA_FILE).size;
console.log(`\nDB 고정본 저장 — 요청 ${keys.length}가지 · ${(size / 1024).toFixed(0)}KB`);
console.log(`  ${path.relative(ROOT, FROZEN_DATA_FILE).replace(/\\/g, '/')}`);
console.log('화면 기준도 다시 찍는다 — `node scripts/snapshot-screens.mjs save`');
