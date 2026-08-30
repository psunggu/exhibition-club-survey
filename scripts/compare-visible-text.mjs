#!/usr/bin/env node
/**
 * compare-visible-text.mjs — 옛 화면에 **보이던 글**이 이식본에도 있는지 본다.
 *
 *   node scripts/compare-visible-text.mjs
 *
 * ── 왜 이 검사가 따로 필요한가 ──────────────────────────────
 * compare-with-legacy.mjs 는 선택자를 **나열해서** 계산된 스타일을 대조한다.
 * 나열하지 않은 것은 보지 않으므로 **블록이 통째로 빠진 것을 못 잡는다.**
 *
 * 실제로 그렇게 놓쳤다. 스타일이 한 곳도 안 다르다고 보고했는데
 * 목록 머리글 · 검증 기준 패널 · 보드로 가는 안내 카드가 빠져 있었다.
 * 사용자가 눈으로 보고 "구성이 덜 완성됐다"고 했고, 그 말이 맞았다.
 *
 * 그래서 **화면에 실제로 보이는 글자**를 통째로 비교한다.
 * 눈에 보이지 않던 것(옛 화면에서도 hidden 이던 패널)은 애초에 빠져도 문제가 아니므로,
 * innerText 를 쓴다 — display:none 인 것은 여기 안 들어온다.
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { FROZEN_DAY, freezeClock } from './frozen-clock.mjs';
import { serveFrozenData, failOnFrozenMisses } from './frozen-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '/exhibition-club-survey';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright 가 없어 건너뛴다'); process.exit(0); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css',
  '.js': 'text/javascript', '.json': 'application/json' };
const serve = (root, port, strip) => new Promise((r) => {
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
  s.listen(port, () => r(s));
});

const sOld = await serve(path.join(ROOT, 'app/public'), 8214, false);
const sNew = await serve(path.join(ROOT, 'dist'), 8215, true);

const browser = await chromium.launch();
const page = await browser.newPage();
// 날짜를 타는 화면이라 시계를 묶는다 — 안 묶으면 내일 이 검사가 거짓으로 실패한다
await freezeClock(page);
// DB 응답도 떠 둔 것으로 고정한다 — 보드가 갱신되면 이 검사가 거짓으로 실패한다
await serveFrozenData(page);
await page.setViewportSize({ width: 375, height: 900 });

const lines = async (url) => {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    // 스크린리더 전용 글은 눈에 안 보이므로 비교 대상이 아니다
    document.querySelectorAll('.visually-hidden').forEach((e) => e.remove());
    return document.body.innerText.split('\n').map((s) => s.trim()).filter(Boolean);
  });
};

/**
 * 날짜·시각·건수처럼 **데이터에 따라 달라지는 것**은 빼고 본다.
 * 이식본은 DB 를 읽으므로 값이 다른 것이 정상이다 — 구조가 빠졌는지를 본다.
 */
const VOLATILE = [
  /^\d{4}[.\-]\d{1,2}[.\-]\d{1,2}/, /^\d+건$/, /^\d+%$/, /^\d+분$/,
  // `기준$` 만 걸면 고정 문구인 `검증 기준` 까지 삼킨다 — 실제로 그 줄을
  // 지워 놓고 검사기를 돌렸을 때 통과했다. 숫자가 든 줄만 값으로 본다.
  /최종 업데이트/, /업데이트 \d/, /\d.*기준$/, /^\d{4}\. \d{1,2}\. \d{1,2}\./,
  /^\d{1,2}월$/, /^\d{1,2}$/, /^[가-힣]요일$/,
];
const volatile = (l) => VOLATILE.some((r) => r.test(l));

/**
 * 글자가 정확히 같지 않아도 **같은 내용이면 빠진 것이 아니다.**
 *
 * 처음에는 완전 일치만 봤더니 `오후 3시 ~ 5시` 와 `오후 3시~5시` 처럼
 * 띄어쓰기만 다른 줄까지 "빠졌다"고 불러세웠다. 실제로 빠진 블록과
 * 문구가 다듬어진 줄이 한 목록에 섞이면 어느 쪽이 진짜인지 알 수 없다.
 *
 * 그래서 공백·문장부호를 지운 뒤 이식본 어느 줄엔가 **들어 있으면** 문구 차이로 본다.
 * 어디에도 없으면 그때가 블록이 빠진 것이다.
 */
const norm = (l) => l.replace(/[\s·~,.()]/g, '');

/**
 * **알고서 모양을 바꾼 글.**
 *
 * 이 검사는 「이식하며 블록이 빠지지 않았나」 를 본다. 그래서 없어진 줄은 전부 실패로 봐야 맞다.
 * 다만 디자인 통일 2단계에서 **일부러 모양을 바꾼 글**이 있고,
 * 그걸 실패로 두면 사람이 검사를 통째로 끄게 된다.
 * 지우는 대신 여기 적어 두고, 통과할 때도 **화면에 그대로 보여 준다** —
 * 숨기면 그 다음 사람이 이유를 모른 채 되돌린다.
 * (compare-with-legacy.mjs 의 EXPECTED 와 같은 방식이다.)
 *
 * 적을 때는 좁게 적는다. 정규식 하나가 한 가지 글만 잡아야 한다.
 */
const EXPECTED_GONE = [
  {
    re: /^★[★☆]{4}$/,
    why: '별점의 노란 별을 숫자로 바꿨다 — 「4.0 / 5」. 5점 만점의 몇 점이라는 뜻도, '
      + '스크린리더가 읽는 aria-label 문구도 그대로다. 색으로 말하던 것을 글자가 말하게 한 것이다.',
  },
  {
    // 데이터에 실제로 있는 네 값을 그대로 적는다 (app/src/data/movies.ts) —
    // 「재개봉」 하나로 뭉뚱그렸더니 「재개봉 예정」·「재개봉 상영 중」 이 안 걸려,
    // 보드 자료가 그 상태로 바뀌는 주에 이 검사가 거짓으로 실패할 참이었다.
    re: /^(상영 중|개봉 예정|재개봉 상영 중|재개봉 예정)$/,
    why: '영화 카드의 배지 둘을 중립 칩 하나로 합쳤다. **글자는 지워지지 않았다** — '
      + '「영화 · 상영 중 · 전국 예매 1위」 처럼 한 칩 안에 이어 붙는다. '
      + '이 검사가 못 알아보는 것은 여덟 자 미만인 조각을 포함으로 봐주지 않기 때문이다.',
  },
  {
    re: /^전국 예매 \d+위$/,
    why: '위와 같은 병합이다. 순위는 같은 칩 뒷부분에 붙어 있다.',
  },
  {
    re: /^(모집중 · 미정|예매 마감|영화 모임)$/,
    why: '달력 범례를 여섯 칸에서 색 점 둘(정기 · 수시)과 설명 넷으로 바꿨다 '
      + '(디자인 통일 3단계). 옛 범례는 갈래와 성격과 상태를 한 줄에 섞어 두어 '
      + '칩 하나를 보고 어느 축을 읽어야 하는지 알 수 없었다. '
      + '「영화 모임」 은 이제 색을 갖지 않고 달력 아래 「이번 달 모임」 목록에 '
      + '「수시 · 영화」 로 적힌다. 「모집중 · 미정」 은 점선 칩과 「점선 = 미정」 이 대신한다.',
  },
]
const expectedGone = (l) => EXPECTED_GONE.find((e) => e.re.test(l));

const PAIRS = [
  ['보드', `http://localhost:8214/index.html`, `http://localhost:8215${BASE}/#/`],
  ['일정', `http://localhost:8214/notice.html`, `http://localhost:8215${BASE}/#/calendar`],
];

let missing = 0;
let reworded = 0;
for (const [name, oldUrl, newUrl] of PAIRS) {
  const a = await lines(oldUrl);
  const bLines = await lines(newUrl);
  const b = new Set(bLines);
  const bNorm = bLines.map(norm);

  const gone = [];
  const drift = [];
  const known = [];
  for (const l of a) {
    if (b.has(l) || volatile(l)) continue;
    const e = expectedGone(l);
    if (e) { known.push([l, e]); continue; }
    const n = norm(l);
    // 짧은 조각은 우연히 들어맞기 쉬우니 길이가 있는 줄만 포함으로 봐준다
    if (n.length >= 8 && bNorm.some((x) => x.includes(n) || n.includes(x))) drift.push(l);
    else gone.push(l);
  }

  if (known.length) {
    console.log(`\n── ${name}: 알고서 모양을 바꾼 줄 ${known.length}개 — 실패로 세지 않는다`);
    const seen = new Set();
    for (const [l, e] of known) {
      console.log(`  · ${l.slice(0, 72)}`);
      if (seen.has(e.why)) continue;
      seen.add(e.why);
      console.log(`    ${e.why}`);
    }
  }

  reworded += drift.length;
  if (drift.length) {
    console.log(`\n── ${name}: 문구만 다듬어진 줄 ${drift.length}개 (내용은 있다)`);
    drift.forEach((l) => console.log(`  ~ ${l.slice(0, 72)}`));
  }
  if (!gone.length) { console.log(`\n${name} — 빠진 블록 없음`); continue; }
  missing += gone.length;
  console.log(`\n── ${name}: 옛 화면에 보였는데 **없는** 글 ${gone.length}줄`);
  gone.forEach((l) => console.log(`  · ${l.slice(0, 76)}`));
}

await browser.close();
sOld.close(); sNew.close();
failOnFrozenMisses();

if (missing) {
  console.log(`\n총 ${missing}줄이 빠졌다. 값이 달라진 것(날짜·건수)과 문구만 다듬어진 것은`);
  console.log('이미 걸렀으므로, 남은 것은 **구조가 빠진 것**이다.\n');
  process.exit(1);
}
console.log(`\n보이는 글 대조 통과 (문구만 다듬어진 줄 ${reworded}개는 통과로 본다)`
  + ` — 시계는 ${FROZEN_DAY} 에 묶고 쟀다`);
