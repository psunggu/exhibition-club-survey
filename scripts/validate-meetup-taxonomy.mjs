#!/usr/bin/env node
/**
 * validate-meetup-taxonomy.mjs — 모임 분류가 흔들리지 않게 잡아 둔다.
 *
 *   node scripts/validate-meetup-taxonomy.mjs
 *
 * ── 규칙 ────────────────────────────────────────────────────
 * 달력 범례는 **여섯 가지뿐이다.**
 *   완료 · 확정 · 공식 정기관람 · 모집중 · 미정 · 예매 마감 · 영화 모임
 *
 * 전시 모임은 `공식 정기관람` 과 `그 외 모임` 으로만 나뉜다.
 * 공식인지 아닌지는 `official` 한 곳에서만 정한다 — 상태 글이나 칩 글자가
 * 아니라. 두 군데서 정하면 반드시 어긋난다.
 *
 * 실제로 어긋나 있었다: 8월 16일 영화 모임은 `official: false` 인데
 * 상태 글은 `완료 · 공식 정기관람 · 영화` 라고 말하고 있었다.
 * 색은 영화 모임인데 글자는 공식이라, 보는 사람마다 다르게 읽었다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
const fail = (m) => fails.push(m);

/* ── 범례는 여섯 가지 ────────────────────────────────────── */

const LEGEND = [
  ['done', '완료'],
  ['conf', '확정'],
  ['official', '공식 정기관람'],
  ['tent', '모집중 · 미정'],
  ['dead', '예매 마감'],
  ['movie', '영화 모임'],
];

const cal = fs.readFileSync(path.join(ROOT, 'app/src/Calendar.tsx'), 'utf8');
const block = /const LEGEND[^=]*=\s*\[([\s\S]*?)\n\]/.exec(cal);
if (!block) fail('Calendar.tsx 에서 LEGEND 를 찾지 못했다');
else {
  const got = [...block[1].matchAll(/cls:\s*'([^']+)'\s*,\s*label:\s*'([^']+)'/g)]
    .map((m) => [m[1], m[2]]);
  if (got.length !== LEGEND.length) {
    fail(`범례는 ${LEGEND.length}가지여야 한다 — 지금 ${got.length}가지`);
  }
  LEGEND.forEach(([cls, label], i) => {
    const g = got[i];
    if (!g) { fail(`범례 ${i + 1}번째(${label})가 없다`); return; }
    if (g[0] !== cls || g[1] !== label) {
      fail(`범례 ${i + 1}번째가 다르다 — 있어야 할 것 ${cls}/${label}, 있는 것 ${g[0]}/${g[1]}`);
    }
  });
}

/* ── 공식 여부는 한 곳에서만 정한다 ──────────────────────── */

const src = fs.readFileSync(path.join(ROOT, 'app/src/data/meetups.ts'), 'utf8');
const RE = /id:\s*'([\w-]+)',[\s\S]*?chip:\s*'([^']*)',\s*kind:\s*'(\w+)',\s*official:\s*(\w+),\s*movie:\s*(\w+),\s*status:\s*'([^']*)'/g;

const meetups = [];
for (let m; (m = RE.exec(src)) !== null;) {
  meetups.push({ id: m[1], chip: m[2], kind: m[3],
    official: m[4] === 'true', movie: m[5] === 'true', status: m[6] });
}
if (!meetups.length) fail('meetups.ts 에서 모임을 하나도 읽지 못했다');

const KINDS = new Set(['conf', 'done', 'dead', 'tent']);
const SAYS_OFFICIAL = /공식/;

for (const m of meetups) {
  if (!KINDS.has(m.kind)) fail(`${m.id}: kind '${m.kind}' 는 허용된 값이 아니다`);

  // 글자가 '공식' 이라고 말하면 official 도 true 여야 한다. 반대도 같다.
  const textSaysOfficial = SAYS_OFFICIAL.test(m.chip) || SAYS_OFFICIAL.test(m.status);
  if (textSaysOfficial && !m.official) {
    fail(`${m.id}: 글자는 '공식' 이라는데 official 은 false 다 `
      + `(chip='${m.chip}' status='${m.status}') — 색과 글이 어긋난다`);
  }
  if (m.official && !textSaysOfficial) {
    fail(`${m.id}: official 은 true 인데 어디에도 '공식' 이라 적혀 있지 않다`);
  }

  // 영화 모임은 그 자체로 한 갈래다. 공식과 겹쳐 칠할 수 없다.
  if (m.official && m.movie) {
    fail(`${m.id}: 공식 정기관람과 영화 모임을 함께 둘 수 없다 — 달력에서 한 가지 색만 칠해진다`);
  }
}

/* ── 알리기 ──────────────────────────────────────────────── */

if (fails.length) {
  console.log(`모임 분류 검사 실패 — ${fails.length}건\n`);
  fails.forEach((f) => console.log(`  · ${f}`));
  process.exit(1);
}

const n = (p) => meetups.filter(p).length;
console.log('모임 분류 검사 통과 — '
  + `범례 ${LEGEND.length}가지 · 모임 ${meetups.length}건 `
  + `(공식 정기관람 ${n((m) => m.official)} · 영화 모임 ${n((m) => m.movie)} · `
  + `그 외 ${n((m) => !m.official && !m.movie)})`);
