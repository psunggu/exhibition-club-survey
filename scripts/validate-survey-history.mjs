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
let checked = 0;
const ok = (label, cond, detail = '') => {
  checked += 1;
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

// 새 길 — 설문 행의 meetup_id 로 이어진 것 (운영자 화면에서 고른다, 2026-09-09).
// surveyIds 가 비어 있어도 meetup_id 만으로 같은 답이 나와야 한다.
ok('meetup_id 로 이어진 설문도 지난 설문이 된다',
  lib.isPastSurvey({ ...survey('s9', CLOSED), meetupId: 'm9' }, TODAY, [meetup('m9', '2026-08-22', 'conf', [])]) === true,
  'surveyIds 없이 meetup_id 만');
ok('meetup_id 가 없는 모임을 가리키면 잇지 않는다',
  lib.meetupOfSurvey('s9', [meetup('m1', '2026-08-22', 'conf', [])], 'no-such') === null);
ok('surveyIds 가 먼저다 — 둘 다 있으면 옛 길이 이긴다',
  lib.meetupOfSurvey('s1', [meetup('m1', '2026-08-22', 'conf', ['s1']), meetup('m2', '2026-08-30', 'conf', [])], 'm2')?.id === 'm1');

ok('마감 + 모임이 내일 → 아직 지난 설문 아니다',
  lib.isPastSurvey(survey('s1', CLOSED), TODAY, [meetup('m1', '2026-08-24', 'conf', ['s1'])]) === false,
  '「마감이면 무조건」 구현을 여기서 잡는다');

ok('열린 설문은 모임이 지났어도 지난 설문이 아니다',
  lib.isPastSurvey(survey('s1', OPEN), TODAY, [meetup('m1', '2026-08-01', 'conf', ['s1'])]) === false);

// 이어진 모임이 없으면 모임 날짜 대신 마감일에서 한 달을 센다(2026-09-26 운영자 요청 —
// 「일정이 지난 투표는 지난 것으로」). 예전에는 영영 남겨 두었다. 짝은 여전히 지어내지 않는다.
const RECENT = { opensAt: '2026-08-01T00:00:00+09:00', closesAt: '2026-08-13T21:00:00+09:00' };   // TODAY 열흘 전
ok('이어진 모임이 없고 마감한 지 한 달이 넘었으면 지난 설문이다',
  lib.isPastSurvey(survey('s1', CLOSED), TODAY, [meetup('m1', '2026-08-01', 'conf', ['다른설문'])]) === true,
  '추측하지 않는다 — 다른 모임에 짝을 짓지 않고 마감일만 본다');
ok('이어진 모임이 없어도 마감 직후(열흘)는 아직 지난 설문이 아니다',
  lib.isPastSurvey(survey('s1', RECENT), TODAY, [meetup('m1', '2026-08-01', 'conf', ['다른설문'])]) === false,
  '결과를 보러 오는 때다');
ok('마감 서른 날째까지는 남고 서른하루째부터 지난 것',
  lib.isPastSurvey(survey('s1', { ...RECENT, closesAt: '2026-07-24T21:00:00+09:00' }), TODAY, []) === false
    && lib.isPastSurvey(survey('s1', { ...RECENT, closesAt: '2026-07-23T21:00:00+09:00' }), TODAY, []) === true);

ok('모임 목록이 비어도 터지지 않는다',
  typeof lib.isPastSurvey(survey('s1', CLOSED), TODAY, []) === 'boolean');

ok("kind 'dead'(예매 마감일 같은 줄)는 모임으로 치지 않는다 — 그 날짜로 접지 않는다",
  lib.isPastSurvey(survey('s1', RECENT), TODAY, [meetup('m1', '2026-07-31', 'dead', ['s1'])]) === false);

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
    survey('unlinked', { opensAt: '2020-01-01T00:00:00+09:00', closesAt: '2020-03-01T00:00:00+09:00' }),
    survey('unlinkedRecent', RECENT),
  ];
  const { live, past } = lib.splitByHistory(list, TODAY, ms);
  ok('진행 중과 마감 직후의 안 이어진 설문은 남는다',
    live.map((s) => s.id).join(',') === 'live,unlinkedRecent', live.map((s) => s.id).join(','));
  ok('지난 설문은 최근에 끝난 것부터 — 마감 한 달 넘은 안 이어진 설문도 함께',
    past.map((s) => s.id).join(',') === 'old,unlinked,older', past.map((s) => s.id).join(','));
  ok('가른 뒤에도 개수가 맞는다', live.length + past.length === list.length);
}

console.log('\n── 운영자 목록도 같은 답을 내나');
{
  /**
   * 운영자 화면은 `survey_admin_list` 로 목록을 받는데 그 답에는 **opens_at 이 없다.**
   * 그래서 판정 함수가 따로 있다. 따로 있으면 언젠가 답이 갈리므로,
   * 알맹이(pastCore)를 나눠 쓰게 해 두고 **여기서 두 답이 같은지 잰다.**
   * 이 저장소는 화면 둘이 같은 것을 두고 다르게 말한 적이 있다.
   */
  const NOW = new Date('2026-08-23T12:00:00+09:00');
  const ms = [meetup('m1', '2026-08-22', 'conf', ['s1']),
    meetup('m2', '2026-08-24', 'conf', ['s2']),
    meetup('m3', '2026-07-31', 'dead', ['s3'])];
  const A = (id, closesAt) => ({ id, closesAt });
  const PAST = '2026-08-20T21:00:00+09:00';

  ok('마감 + 모임이 어제 → 지난 관람',
    lib.isPastAdminSurvey(A('s1', PAST), TODAY, ms, NOW) === true);
  ok('마감 + 모임이 내일 → 아직 아니다',
    lib.isPastAdminSurvey(A('s2', PAST), TODAY, ms, NOW) === false,
    '모임이 남았으면 운영자가 가장 볼 때다');
  ok('아직 안 마감 → 아니다',
    lib.isPastAdminSurvey(A('s1', '2026-09-30T21:00:00+09:00'), TODAY, ms, NOW) === false);
  ok('예매 마감일(dead)은 다녀온 날이 아니다',
    lib.isPastAdminSurvey(A('s3', PAST), TODAY, ms, NOW) === false);
  ok('안 이어진 설문은 마감 직후에는 접지 않는다',
    lib.isPastAdminSurvey(A('없는설문', PAST), TODAY, ms, NOW) === false);
  ok('마감을 못 읽으면 접지 않는다',
    lib.isPastAdminSurvey(A('s1', '알수없음'), TODAY, ms, NOW) === false,
    '모르면 남기는 쪽으로 넘어진다 — 접으면 고치러 들어올 자리가 사라진다');

  // **두 화면이 같은 답을 내는가.** 이것이 이 묶음의 핵심이다.
  ok('회원 화면 판정과 답이 같다',
    ['s1', 's2', 's3', '없는설문'].every((id) =>
      lib.isPastAdminSurvey(A(id, PAST), TODAY, ms, NOW)
        === lib.isPastSurvey(survey(id, { opensAt: '2020-01-01T00:00:00+09:00', closesAt: PAST }), TODAY, ms)));
  ok('안 이어진 설문도 마감 한 달이 지나면 운영자 목록에서 접힌다',
    lib.isPastAdminSurvey(A('없는설문', '2026-07-01T21:00:00+09:00'), TODAY, ms, NOW) === true);

  const { live, past } = lib.splitAdminByHistory([A('s2', PAST), A('s1', PAST)], TODAY, ms, NOW);
  ok('운영자 목록을 둘로 가른다',
    live.map((x) => x.id).join(',') === 's2' && past.map((x) => x.id).join(',') === 's1',
    `남김 ${live.map((x) => x.id)} · 접음 ${past.map((x) => x.id)}`);
}

console.log('\n── 모임 요약 카드도 날짜로 내려가나 (2026-09-26)');
{
  const ms = [meetup('m1', '2026-08-22', 'conf', []), meetup('m2', '2026-08-23', 'conf', []),
    meetup('m3', '2026-07-31', 'dead', [])];
  ok('요약한 모임이 어제 → 지난 것(「지난 투표」 로)', lib.isPastBrief({ meetupId: 'm1' }, TODAY, ms) === true);
  ok('요약한 모임이 오늘 → 아직 맨 위', lib.isPastBrief({ meetupId: 'm2' }, TODAY, ms) === false,
    '모임 당일에는 내리지 않는다');
  ok('모임을 안 적은 요약은 내리지 않는다', lib.isPastBrief({}, TODAY, ms) === false, '추측하지 않는다');
  ok('없는 모임을 가리키면 내리지 않는다', lib.isPastBrief({ meetupId: 'no-such' }, TODAY, ms) === false);
  ok("예매 마감일(dead)은 다녀온 날이 아니다", lib.isPastBrief({ meetupId: 'm3' }, TODAY, ms) === false);
  ok('요약이 없어도 터지지 않는다', lib.isPastBrief(null, TODAY, ms) === false);
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
console.log(`\n지난 설문 판정 검사 통과 — ${checked}가지`);
