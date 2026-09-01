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

/**
 * ── 카드 **속**은 빼고 읽는다 (2026-08-30) ─────────────────
 *
 * 이 검사가 실제로 잡아 온 것은 전부 **페이지 뼈대**였다 — 목록 머리글,
 * 검증 기준 패널, 보드로 가는 안내 카드. 카드 속을 잡은 적은 한 번도 없다.
 *
 * 그런데 카드 속은 이제 **비교할 수가 없다.** 옛 app.js 는 DB 결과 위에
 * 하드코딩 배열을 덮어쓰므로(app/src/lib/events.ts 머리말), 옛 보드의 추천 목록은
 * 2026-08 에 손으로 박힌 채 **얼어 있다.** 이식본은 DB 를 읽는다.
 * 그래서 운영진이 추천 순위를 하나 바꾸면 — 정상적인 주간 갱신이다 —
 * 두 화면의 상위 10건 명단이 갈리고, 밀려난 카드의 글이 「빠진 블록」 으로 잡힌다.
 *
 * 실제로 그렇게 걸렸다. 「웨인 티보」 를 추천 6위로 넣자 조숙진(10위)이 11위로
 * 밀려 이식본의 상위 10에서 빠졌고, 옛 화면은 얼어 있어 그대로 보여 주고 있었다.
 * **보드 자료가 바뀌는 것은 고장이 아니다.** 그것을 실패로 부르는 검사는 수명이 다한 것이다.
 * (일정 화면을 이 대조에서 뺀 것과 같은 판단이다. compare-with-legacy.mjs 의 같은 대목 참고.)
 *
 * 뼈대 비교는 그대로 살아 있고, 이 검사의 값어치도 거기 있었다.
 * 카드 **골격**은 다른 것들이 지킨다 —
 *   compare-with-legacy.mjs   .exhibition-card 계열의 계산된 스타일을 옛 화면과 잰다
 *   snapshot-screens.mjs      카드 수와 상자를 기준과 잰다
 *   validate-accessibility    카드 안의 대비 · 누르는 크기
 *
 * 몇 장을 뺐는지 **화면에 적는다.** 말없이 줄이면 다음 사람이 「전부 봤다」 고 읽는다.
 */
const lines = async (url) => {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    // 스크린리더 전용 글은 눈에 안 보이므로 비교 대상이 아니다
    document.querySelectorAll('.visually-hidden').forEach((e) => e.remove());
    const cards = document.querySelectorAll('.exhibition-card');
    const dropped = cards.length;
    cards.forEach((e) => e.remove());
    return {
      dropped,
      lines: document.body.innerText.split('\n').map((s) => s.trim()).filter(Boolean),
    };
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
 *
 * **2026-08-30 이후로 아래 셋은 걸리지 않는다.** 전부 카드 **속**의 글인데,
 * 위 `lines()` 가 카드를 통째로 빼고 읽기 때문이다(이유는 그쪽 주석에 있다).
 * 지우지 않고 둔다 — 카드 속을 다시 견주기로 하면 그날 바로 필요해지고,
 * 그때 이 세 가지가 왜 달라졌는지 다시 알아내게 하고 싶지 않다.
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

]
const expectedGone = (l) => EXPECTED_GONE.find((e) => e.re.test(l));

/**
 * ── 일정 화면은 이 대조에서 뺐다 (2026-08-30) ──────────────
 * 옛 notice.html 은 8월 29일 가우디를 「다가오는 확정」 으로 손으로 박아 둔 채 얼어 있다.
 * 이식본은 데이터를 읽으므로 모임이 완료될 때마다 그 글이 다른 절로 옮겨 가고,
 * 이 검사는 그것을 「빠진 블록」 이라 부른다. **모임이 끝나는 것은 고장이 아니다.**
 * 자세한 사정과 대신 지키는 검사들은 compare-with-legacy.mjs 의 같은 대목에 적었다.
 */
const PAIRS = [
  ['보드', `http://localhost:8214/index.html`, `http://localhost:8215${BASE}/#/`],
];

let missing = 0;
let reworded = 0;
for (const [name, oldUrl, newUrl] of PAIRS) {
  const oldRead = await lines(oldUrl);
  const newRead = await lines(newUrl);
  console.log(`\n── ${name}: 카드 속은 빼고 뼈대만 견준다 `
    + `— 옛 화면 ${oldRead.dropped}장 · 이식본 ${newRead.dropped}장 제외`);
  const a = oldRead.lines;
  const bLines = newRead.lines;
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
