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
const RE = /id:\s*'([\w-]+)',\s*date:\s*'([\d-]+)',\s*chip:\s*'([^']*)',\s*kind:\s*'(\w+)',\s*official:\s*(\w+),\s*movie:\s*(\w+),\s*status:\s*'([^']*)'/g;

const meetups = [];
for (let m; (m = RE.exec(src)) !== null;) {
  // 제목과 완료 줄은 **이 모임 덩어리 안에서만** 찾는다.
  // 덩어리를 안 자르면 다음 모임 것을 집어 와서 엉뚱한 곳을 지적한다.
  const next = src.indexOf("\n    id: '", m.index + 1);
  const chunk = src.slice(m.index, next === -1 ? src.length : next);
  const grab = (k) => (new RegExp(`${k}:\\s*'([^']*)'`).exec(chunk) ?? [, ''])[1];
  meetups.push({ id: m[1], date: m[2], chip: m[3], kind: m[4],
    official: m[5] === 'true', movie: m[6] === 'true', status: m[7],
    title: grab('title'), completedRow: grab('completedRow'),
    description: grab('description') });
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

/* ── `정기관람` 은 공식 모임만 쓴다 · 회차 번호는 안 붙인다 ─── */
/**
 * 8월 16일 영화 모임의 완료 줄이 `8월 정기관람 ②` 라고 적혀 있었다.
 * 그 모임은 `official: false` · `movie: true` 인 영화 모임이고,
 * 8월의 공식 정기관람은 8/22 서울역사박물관 **하나뿐**이라 ① 이 없었다.
 * 회원이 보면 8월 첫 모임을 놓친 줄 안다. 색은 영화인데 글자는 정기관람이었다.
 *
 * 지난 일은 그대로 둔다 — 7월 ①② 는 7/11 · 7/29 로 실제 두 번 모였으니 맞는 표기다.
 * 규칙은 **8/22 부터** 지킨다. 이 분류를 정한 뒤 처음 오는 공식 정기관람이 그날이다.
 * 그래서 새 모임을 넣을 때만 걸리고, 옛 기록을 고쳐 쓸 일이 없다.
 */
const RULE_FROM = '2026-08-22';
const SAYS_REGULAR = /정기관람/;

/**
 * 번호는 **앞뒤 양쪽**을 본다.
 * 처음엔 뒤에 오는 것만 봤더니(`정기관람 ②`) 앞에 붙은 `2026년 2차 정기관람` 을 놓쳤다.
 * 우리가 쓰는 두 꼴을 다 막아야 같은 일이 안 생긴다.
 */
const NUMBERED = /(?:[①-⑳]|\d+\s*차)\s*정기관람|정기관람\s*[①-⑳\d]/;

for (const m of meetups.filter((x) => x.date >= RULE_FROM)) {
  // 설명문도 본다 — 짝 없는 회차가 거기 숨어 있었다
  const fields = [['chip', m.chip], ['status', m.status], ['title', m.title],
    ['completedRow', m.completedRow], ['description', m.description]];

  for (const [name, text] of fields) {
    if (!text) continue;

    if (SAYS_REGULAR.test(text) && !m.official) {
      fail(`${m.id}: ${name} 이 '정기관람' 이라는데 official 은 false 다 `
        + `(${name}='${text}') — 공식이 아니면 그렇게 부르지 않는다`);
    }
    if (NUMBERED.test(text)) {
      fail(`${m.id}: ${name} 에 회차 번호가 붙었다 (${name}='${text}') `
        + `— 짝 없는 번호는 못 온 모임이 있는 줄로 읽힌다. 달과 장소로 구분한다`);
    }
  }
}

/* ── 날짜와 완료 표시가 어긋나지 않는가 ──────────────────────
 *
 * 이 검사가 없어서 실제로 어긋난 채 지나갔다. 2026-08-22 서울역사박물관 모임은
 * 다음 날에도 `kind: 'conf'` 에 `completedRow` 가 비어 있었고, 그 결과
 * 달력에서 **완료 목록에도 예정 목록에도 없이** 조용히 사라졌다.
 * 같은 날 설문 화면은 「모임까지 끝난 설문입니다」 라고 말하고 있었다 —
 * 한 사이트의 두 화면이 같은 모임을 두고 정반대로 말한 것이다.
 *
 * ── 셋 가운데 둘만 곧바로 실패로 본다 ───────────────────────
 * 앞의 둘은 **날짜를 안 탄다** — 언제 돌려도 답이 같은 논리 모순이라 바로 실패다.
 * 마지막 하나는 날짜를 타므로 유예를 둔다. 모임 다음 날부터 실패로 처리하면
 * 아직 완료 줄 문구를 못 정한 사이에 관계없는 작업까지 막힌다.
 * 그렇다고 영영 경고로만 두면 아무도 안 본다. 그래서 **알리되, 2주가 지나면 실패**다.
 */
const STALE_WARN_DAYS = 1;    // 이 날부터 알린다
const STALE_FAIL_DAYS = 14;   // 이 날부터 실패로 본다

/** 오늘(KST). 이 검사만 진짜 날짜를 본다 — 낡았는지를 묻는 검사이기 때문이다. */
const todayKst = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const daysSince = (iso) => Math.round(
  (Date.parse(`${todayKst}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / 86400000);

const stale = [];
for (const m of meetups) {
  // 'dead' 는 모임이 아니라 예매 마감일 같은 줄이다. 다녀올 것이 없으니 완료도 없다.
  if (m.kind === 'dead') continue;

  if (m.kind === 'done' && !m.completedRow) {
    fail(`${m.id}: kind 가 'done' 인데 완료 줄(completedRow)이 비어 있다 `
      + '— 달력의 「완료된 모임」 목록은 완료 줄이 있는 것만 싣는다. 이대로면 어디에도 안 뜬다');
  }
  if (m.completedRow && daysSince(m.date) < 0) {
    fail(`${m.id}: 아직 안 지난 모임(${m.date})에 완료 줄이 적혀 있다 `
      + `— 오늘은 ${todayKst} 다. 다녀오지 않은 일을 다녀왔다고 적으면 안 된다`);
  }
  if (m.kind === 'conf' && !m.completedRow) {
    const d = daysSince(m.date);
    if (d >= STALE_FAIL_DAYS) {
      fail(`${m.id}: ${m.date} 모임이 ${d}일 지났는데 아직 'conf' 이고 완료 줄이 없다 `
        + '— 달력에서 완료 목록에도 예정 목록에도 안 뜬다. kind 를 done 으로 옮기고 완료 줄을 적는다');
    } else if (d >= STALE_WARN_DAYS) {
      stale.push(`${m.id} (${m.date} · ${d}일 지남)`);
    }
  }
}

/* ── 알리기 ──────────────────────────────────────────────── */

if (fails.length) {
  console.log(`모임 분류 검사 실패 — ${fails.length}건\n`);
  fails.forEach((f) => console.log(`  · ${f}`));
  process.exit(1);
}

if (stale.length) {
  console.log(`\n⚠ 다녀왔는데 완료 표시가 안 된 모임 ${stale.length}건 — 달력에서 안 보인다`);
  stale.forEach((t) => console.log(`  · ${t}`));
  console.log("  app/src/data/meetups.ts 에서 kind 를 'done' 으로 옮기고 completedRow 를 적는다.");
  console.log(`  ${STALE_FAIL_DAYS}일이 지나면 실패로 바뀐다.\n`);
}

const n = (p) => meetups.filter(p).length;
console.log('모임 분류 검사 통과 — '
  + `범례 ${LEGEND.length}가지 · 모임 ${meetups.length}건 `
  + `(공식 정기관람 ${n((m) => m.official)} · 영화 모임 ${n((m) => m.movie)} · `
  + `그 외 ${n((m) => !m.official && !m.movie)})`);
