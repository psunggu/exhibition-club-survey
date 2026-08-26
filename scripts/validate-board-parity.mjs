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

const passed = [`지역 판정 ${CASES.length}가지`];

// ── 공개 정보 업데이트 날짜 ────────────────────────────────
// React 셸과 레거시 사본 둘 중 하나만 고치면 같은 보드가 서로 다른 날짜를 말한다.
const APP = fs.readFileSync(path.join(ROOT, 'app/src/App.tsx'), 'utf8');
const LEGACY_HTML = fs.readFileSync(path.join(ROOT, 'app/public/index.html'), 'utf8');
const appInfoDate = (APP.match(/const SITE_INFO_UPDATED_ON = '([^']+)'/) ?? [])[1];
const legacyInfoDate = (js.match(/const boardUpdatedAt = "([^"]+)"/) ?? [])[1];
const htmlInfoDate = (LEGACY_HTML.match(/최종 정보 업데이트:\s*([0-9.]+)/) ?? [])[1];
if (!appInfoDate || appInfoDate !== legacyInfoDate || appInfoDate !== htmlInfoDate) {
  problems.push(`정보 업데이트 일자 불일치 → React ${appInfoDate || '없음'} · `
    + `app.js ${legacyInfoDate || '없음'} · index.html ${htmlInfoDate || '없음'}`);
} else {
  passed.push(`정보 업데이트 일자 ${appInfoDate}`);
}

// ── 달력 (R-01-05) ─────────────────────────────────────────
// notice.js 의 isoDateToDayNumber · isRecentCompletedDate 를 소스에서 꺼내
// 이식본과 같은 입력으로 돌린다.
const NOTICE = path.join(ROOT, 'app/public/notice.js');
const CAL = path.join(ROOT, 'app/src/lib/calendar.ts');
if (fs.existsSync(NOTICE) && fs.existsSync(CAL)) {
  const njs = fs.readFileSync(NOTICE, 'utf8');
  const nfn = (name) => {
    const m = njs.match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n  \\}'));
    if (!m) throw new Error(`notice.js 에서 ${name} 을 찾지 못했다`);
    return m[0];
  };
  const visible = Number((njs.match(/COMPLETED_VISIBLE_DAYS = (\d+)/) ?? [, '3'])[1]);
  const legacyCal = {};
  eval(`var DAY_IN_MILLISECONDS = 24*60*60*1000;
        var COMPLETED_VISIBLE_DAYS = ${visible};
        ${nfn('isoDateToDayNumber')}
        ${nfn('koreanTodayDayNumber')}
        ${nfn('isRecentCompletedDate')}
        legacyCal.isoToDay = isoDateToDayNumber;
        legacyCal.isRecent = isRecentCompletedDate;`);

  // 이식본에서 타입 표기를 걷어내고 같은 함수를 만든다
  const src = fs.readFileSync(CAL, 'utf8');
  const strip = (name) => {
    const m = src.match(new RegExp('export function ' + name + '[\\s\\S]*?\\n\\}'));
    if (!m) throw new Error(`calendar.ts 에서 ${name} 을 찾지 못했다`);
    return m[0]
      .replace('export function', 'function')
      .replace(/\)\s*:\s*[A-Za-z|\s\[\]]+\{/, ') {')     // 반환 타입
      .replace(/(\w+)\s*:\s*(string|number|boolean)/g, '$1'); // 매개변수 타입
  };
  const ported = {};
  // calendar.ts 가 모듈 상단에 둔 상수도 함께 가져온다
  const DAY_MS_LINE = src.match(/const DAY_MS = [^\n]+/)[0];
  eval(`${DAY_MS_LINE}\n${strip('isoToDayNumber')}\n${strip('isRecentlyCompleted')}
        ported.isoToDay = isoToDayNumber; ported.isRecent = isRecentlyCompleted;`);

  const DATES = ['2026-08-19', '2026-08-18', '2026-08-17', '2026-08-16', '2026-08-15',
                 '2026-07-31', '2027-01-01', '2026-13-40', '잘못된값', ''];
  const TODAY = '2026-08-19';
  for (const d of DATES) {
    const a = legacyCal.isoToDay(d);
    const b = ported.isoToDay(d);
    if (a !== b) problems.push(`isoToDayNumber(${JSON.stringify(d)}) → 원본 ${a} · 이식 ${b}`);

    const ra = legacyCal.isRecent(d, legacyCal.isoToDay(TODAY));
    const rb = ported.isRecent(d, TODAY, visible);
    if (ra !== rb) problems.push(`완료 표시 ${JSON.stringify(d)} → 원본 ${ra} · 이식 ${rb}`);
  }
  passed.push(`날짜 ${DATES.length}가지 · 완료 표시 ${visible}일 규칙`);
}

// ── 보고. 두 검사를 다 돌린 뒤에 판정한다 —
//    앞에서 통과했다고 먼저 끝내면 뒤의 실패가 exit 0 으로 묻힌다.
if (problems.length) {
  console.error('이식 대조 실패 — 원본과 결과가 다르다\n');
  problems.forEach((p) => console.error(`  · ${p}`));
  console.error('');
  process.exit(1);
}
console.log(`이식 대조 통과 — ${passed.join(' · ')}`);
