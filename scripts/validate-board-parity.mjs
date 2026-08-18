#!/usr/bin/env node
/**
 * validate-board-parity.mjs — 이식한 보드가 원본과 같은 결과를 내는지 확인한다 (R-01-04).
 *
 *   node scripts/validate-board-parity.mjs
 *
 * Phase 01 의 목표는 **"이 단계가 끝나도 이용자에게 보이는 것은 지금과 같아야 한다"** 이다.
 * 눈으로 비교하면 반드시 놓친다. 같은 데이터를 두 구현에 넣고 결과를 대조한다.
 *
 *   원본  app/public/app.js 의 eventArea · matchesFilter (실제 소스에서 뽑아 쓴다)
 *   이식  app/src/lib/events.ts 의 eventArea · filterEvents
 *
 * app.js 를 지운 뒤에는 이 검사기도 함께 지운다 — 비교할 원본이 없어지기 때문이다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEGACY = path.join(ROOT, 'app/public/app.js');

if (!fs.existsSync(LEGACY)) {
  console.log('원본 app.js 가 없다 — 이식이 끝났다면 이 검사기를 지운다.');
  process.exit(0);
}

// ── 원본 구현을 소스에서 그대로 꺼낸다 (베껴 적지 않는다)
const js = fs.readFileSync(LEGACY, 'utf8');
const fn = (name) => {
  const m = js.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n}`));
  if (!m) throw new Error(`원본에서 ${name} 을 찾지 못했다`);
  return m[0];
};
const legacy = {};
eval(`${fn('eventArea')}\nlegacy.eventArea = eventArea;`);

// ── 이식 구현
const { eventArea: portedArea, toEvent } = await import(
  'file://' + path.join(ROOT, 'app/src/lib/events.ts').replace(/\\/g, '/')
).catch(async () => {
  // .ts 는 그대로 못 불러온다. 필요한 두 함수만 소스에서 꺼내 쓴다.
  const src = fs.readFileSync(path.join(ROOT, 'app/src/lib/events.ts'), 'utf8');
  const body = src.match(/export function eventArea[\s\S]*?\n}/)[0]
    .replace(/export function/, 'function')
    .replace(/:\s*Event/g, '').replace(/:\s*Area/g, '');
  const scope = {};
  eval(`${body}\nscope.eventArea = eventArea;`);
  return { eventArea: scope.eventArea, toEvent: null };
});

// ── 같은 데이터로 돌린다
const CASES = [
  { region: '서울 전체', address: '', venue: '서울시립미술관' },
  { region: '종로/중구', address: '', venue: '국립현대미술관 서울' },
  { region: '노원/도봉/강북', address: '', venue: '' },
  { region: '관악/동작/금천', address: '', venue: '' },
  { region: '영등포/구로', address: '', venue: '' },
  { region: '경기 전체', address: '', venue: '수원전통문화관' },
  { region: '', address: '', venue: '성남아트센터' },
  { region: '인천 전체', address: '', venue: '인천시립박물관' },
  { region: '', address: '인천 서구', venue: '검단선사박물관' },
  { region: '', address: '', venue: '' },                       // 아무것도 없으면 서울
  { region: '수원', address: '', venue: '' },
  { region: '', address: '경기도 성남시', venue: '' },
];

const problems = [];
for (const c of CASES) {
  const a = legacy.eventArea({ area: undefined, ...c });
  const b = portedArea(c);
  if (a !== b)
    problems.push(`region=${JSON.stringify(c.region)} venue=${JSON.stringify(c.venue)} `
      + `address=${JSON.stringify(c.address)} → 원본 ${a} · 이식 ${b}`);
}

if (problems.length) {
  console.error('보드 이식 대조 실패 — 지역 판정이 원본과 다르다\n');
  problems.forEach((p) => console.error(`  · ${p}`));
  console.error('');
  process.exit(1);
}
console.log(`보드 이식 대조 통과 — 지역 판정 ${CASES.length}가지가 원본과 일치`);
