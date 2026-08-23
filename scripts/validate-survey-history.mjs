#!/usr/bin/env node
/**
 * validate-survey-history.mjs — 「지난 설문」 판정 규칙을 잰다.
 *
 *   node scripts/validate-survey-history.mjs
 *
 * ── 왜 화면 검사와 따로 두나 ────────────────────────────────
 * 이 규칙은 두 갈래를 가른다.
 *   마감 + 이어진 모임이 지났다  → 지난 설문 (히스토리로 내린다)
 *   마감 + 모임이 아직           → 지난 설문 아님 (그대로 둔다)
 *
 * 두 번째 갈래가 중요하다. 「마감이면 무조건 접는다」 는 잘못된 구현도
 * 지금 자료에서는 화면상 똑같아 보인다 — 식사 설문이 마침 둘 다 참이기 때문이다.
 * 그 잘못을 잡으려면 **모임이 아직 안 지난 마감 설문**을 만들어 봐야 하는데,
 * 그건 실제 자료로는 만들 수 없다. 그래서 모임 목록을 손으로 넣어 잰다.
 *
 * 마지막 두 가지는 **진짜 meetups.ts 와 진짜 설문 id** 로 잰다 —
 * 손으로 만든 자료만 재면 연결이 실제로 걸려 있는지는 끝내 모른다.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'app/src/lib/surveyHistory.ts');

let esbuild;
try { esbuild = await import('esbuild'); }
catch { console.log('esbuild 가 없어 건너뛴다'); process.exit(0); }

if (!fs.existsSync(SRC)) {
  console.error('app/src/lib/surveyHistory.ts 가 없다');
  process.exit(1);
}

// TS 를 그대로는 못 불러온다. 딸린 것까지 묶어 임시 파일로 낸 뒤 불러온다.
const out = path.join(os.tmpdir(), `survey-history-${process.pid}.mjs`);
await esbuild.build({
  entryPoints: [SRC], bundle: true, format: 'esm', platform: 'node',
  outfile: out, logLevel: 'silent',
});
const lib = await import(`file://${out.replace(/\\/g, '/')}`);
fs.rmSync(out, { force: true });

const fails = [];
const ok = (label, cond, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) fails.push(label);
};

/**
 * 마감 여부는 `isOpen` 이 **진짜 지금 시각**으로 판정한다(주입할 수 없다).
 * 그래서 확실히 지난 값과 확실히 먼 값을 쓴다 — 이 검사가 몇 해 뒤에도 같은 뜻이도록.
 */
const CLOSED = { opensAt: '2020-01-01T00:00:00+09:00', closesAt: '2020-01-02T00:00:00+09:00' };
const OPEN = { opensAt: '2020-01-01T00:00:00+09:00', closesAt: '2099-01-01T00:00:00+09:00' };
const survey = (id, when) => ({ id, ...when });
const meetup = (id, date, kind, surveyIds) => ({ id, date, kind, surveyIds });

console.log('\n── 손으로 만든 자료로 두 갈래를 가르나');
const TODAY = '2026-08-23';

ok('마감 + 모임이 어제 → 지난 설문',
  lib.isPastSurvey(survey('s1', CLOSED), TODAY, [meetup('m1', '2026-08-22', 'conf', ['s1'])]) === true);

ok('마감 + 모임이 오늘 → 아직 지난 설문 아니다',
  lib.isPastSurvey(survey('s1', CLOSED), TODAY, [meetup('m1', '2026-08-23', 'conf', ['s1'])]) === false,
  '모임 당일에는 접지 않는다');

ok('마감 + 모임이 내일 → 아직 지난 설문 아니다',
  lib.isPastSurvey(survey('s1', CLOSED), TODAY, [meetup('m1', '2026-08-24', 'conf', ['s1'])]) === false,
  '「마감이면 무조건」 구현을 여기서 잡는다');

ok('열린 설문은 모임이 지났어도 지난 설문이 아니다',
  lib.isPastSurvey(survey('s1', OPEN), TODAY, [meetup('m1', '2026-08-01', 'conf', ['s1'])]) === false);

ok('이어진 모임이 없으면 지난 설문이 아니다',
  lib.isPastSurvey(survey('s1', CLOSED), TODAY, [meetup('m1', '2026-08-01', 'conf', ['다른설문'])]) === false,
  '추측하지 않는다');

ok('모임 목록이 비어도 터지지 않는다',
  lib.isPastSurvey(survey('s1', CLOSED), TODAY, []) === false);

ok("kind 'dead'(예매 마감일 같은 줄)는 모임으로 치지 않는다",
  lib.isPastSurvey(survey('s1', CLOSED), TODAY, [meetup('m1', '2026-07-31', 'dead', ['s1'])]) === false);

ok('한 모임에 설문이 둘 붙어도 둘 다 잡는다', (() => {
  const ms = [meetup('m1', '2026-08-22', 'conf', ['s1', 's2'])];
  return lib.isPastSurvey(survey('s1', CLOSED), TODAY, ms) === true
    && lib.isPastSurvey(survey('s2', CLOSED), TODAY, ms) === true;
})());

console.log('\n── 목록을 가르고 정렬하나');
{
  const ms = [meetup('m1', '2026-08-22', 'conf', ['old']), meetup('m2', '2026-08-01', 'conf', ['older'])];
  const list = [
    survey('live', OPEN),
    survey('older', { opensAt: '2020-01-01T00:00:00+09:00', closesAt: '2020-01-02T00:00:00+09:00' }),
    survey('old', { opensAt: '2020-01-01T00:00:00+09:00', closesAt: '2020-06-02T00:00:00+09:00' }),
    survey('unlinked', CLOSED),
  ];
  const { live, past } = lib.splitByHistory(list, TODAY, ms);
  ok('진행 중과 안 이어진 마감 설문은 그대로 남는다',
    live.map((s) => s.id).join(',') === 'live,unlinked', live.map((s) => s.id).join(','));
  ok('지난 설문은 최근에 끝난 것부터',
    past.map((s) => s.id).join(',') === 'old,older', past.map((s) => s.id).join(','));
  ok('가른 뒤에도 개수가 맞는다', live.length + past.length === list.length);
}

console.log('\n── 진짜 자료로 연결이 실제로 걸려 있나');
{
  const MEAL = '5e97b1a0-0000-4000-8000-000000000902';
  const linked = lib.meetupOfSurvey(MEAL);
  ok('식사 설문이 모임에 이어져 있다', linked !== null,
    linked ? `${linked.id} · ${linked.date}` : 'meetups.ts 의 surveyIds 를 확인한다');

  if (linked) {
    ok('모임 다음 날에는 지난 설문이다',
      lib.isPastSurvey(survey(MEAL, CLOSED), '2026-08-23') === true);
    ok('모임 당일에는 아직 아니다',
      lib.isPastSurvey(survey(MEAL, CLOSED), '2026-08-22') === false);
  } else {
    console.log('  – 날짜 판정 두 가지 — 건너뜀 (연결이 없어 잴 수 없다)');
    fails.push('연결이 없어 날짜 판정을 못 쟀다');
  }
}

if (fails.length) {
  console.log(`\n지난 설문 판정 검사 실패 — ${fails.length}건`);
  fails.forEach((f) => console.log(`  · ${f}`));
  process.exit(1);
}
console.log('\n지난 설문 판정 검사 통과 — 14가지');
