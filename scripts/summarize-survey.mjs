#!/usr/bin/env node
/**
 * summarize-survey.mjs — 끝난(또는 진행 중인) 설문을 한 장으로 뽑아 준다.
 *
 *   node scripts/summarize-survey.mjs                    # 설문 목록
 *   node scripts/summarize-survey.mjs <설문id|갈래>       # 한 설문 자세히
 *
 *   갈래는 `exhibition` · `meal` 을 쓸 수 있다. 같은 갈래가 여럿이면 가장 최근 것.
 *
 * ── 왜 이게 있나 ────────────────────────────────────────────
 * 운영자 화면에도 집계가 있지만 그건 **암호가 있어야** 열린다.
 * 이 스크립트는 anon 열쇠로 볼 수 있는 것만 쓴다 — 숫자는 나오고 **이름은 안 나온다.**
 * 누가 무엇을 골랐는지는 운영자 화면에서 봐야 한다. 그게 설계한 대로다.
 *
 * 옮겨 온 설문(톡방 투표)은 `imported_votes` 가 집계를 덮어쓴다.
 * 그 경우 survey_tally 를 보면 0 이 나오므로 후보 행의 값을 먼저 쓴다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = fs.readFileSync(path.join(ROOT, 'app/public/config.js'), 'utf8');
const pick = (k) => {
  const m = new RegExp(`${k}\\s*:\\s*['"]([^'"]+)`).exec(cfg);
  if (!m) throw new Error(`config.js 에서 ${k} 를 못 찾았다`);
  return m[1];
};
const URL_BASE = pick('supabaseUrl');
const KEY = pick('supabaseAnonKey');
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const get = async (p) => {
  const r = await fetch(`${URL_BASE}/rest/v1/${p}`, { headers: H });
  if (!r.ok) throw new Error(`${p} → ${r.status} ${await r.text()}`);
  return r.json();
};
const rpc = async (fn, body) => {
  const r = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${fn} → ${r.status} ${await r.text()}`);
  const t = await r.text();          // void 를 돌려주는 함수는 본문이 빈다
  return t ? JSON.parse(t) : null;
};

const kst = (d) => new Date(d).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
const bar = (n, max) => '█'.repeat(max ? Math.round((n / max) * 24) : 0);

const surveys = await get('surveys?select=*&order=created_at');
const arg = process.argv[2];

if (!arg) {
  console.log('설문 목록\n');
  for (const s of surveys) {
    const n = await rpc('survey_response_count', { p_survey: s.id });
    const closed = new Date(s.closes_at) <= new Date();
    console.log(`  [${s.category}] ${s.title}`);
    console.log(`     ${s.id}`);
    console.log(`     ${closed ? '마감' : '진행 중'} · 마감 ${kst(s.closes_at)} · 응답 ${n}건\n`);
  }
  console.log('자세히 보려면: node scripts/summarize-survey.mjs <설문id 또는 갈래>');
  process.exit(0);
}

const s = surveys.find((x) => x.id === arg)
  ?? [...surveys].reverse().find((x) => x.category === arg);
if (!s) {
  console.log(`'${arg}' 에 해당하는 설문이 없다. 갈래: ${[...new Set(surveys.map((x) => x.category))].join(' · ')}`);
  process.exit(1);
}

const now = new Date();
const close = new Date(s.closes_at);
const closed = close <= now;
const mins = Math.round((close - now) / 60000);

const options = await get(`survey_options?select=*&survey_id=eq.${s.id}&order=position`);
const tally = (await rpc('survey_tally', { p_survey: s.id })) ?? [];
const byId = new Map(tally.map((t) => [t.option_id, Number(t.votes)]));
const people = Number(await rpc('survey_response_count', { p_survey: s.id })) || 0;

// 옮겨 온 설문은 후보 행의 값이 집계를 덮어쓴다
const rows = options.map((o) => ({
  ...o,
  votes: o.imported_votes ?? byId.get(o.id) ?? 0,
}));
const total = rows.reduce((n, r) => n + r.votes, 0);
const max = Math.max(0, ...rows.map((r) => r.votes));
const voters = s.imported_respondents ?? people;

console.log(`■ ${s.title}`);
console.log(`  ${s.intro}\n`);
console.log(`  마감    ${kst(s.closes_at)} (KST) — ${closed ? '마감됨' : `${Math.floor(mins / 60)}시간 ${mins % 60}분 남음`}`);
console.log(`  참여    ${voters}명 · 고른 항목 ${total}개${s.multi_choice ? ' (여러 개 고르기)' : ''}`);
if (s.source_note) console.log(`  출처    ${s.source_note}`);

console.log('\n■ 집계 (표 많은 순)');
for (const r of [...rows].sort((a, b) => b.votes - a.votes)) {
  const pct = voters ? Math.round((r.votes / voters) * 100) : 0;
  console.log(`\n  ${String(r.votes).padStart(2)}표  ${bar(r.votes, max)}`);
  console.log(`      ${r.title}`);
  console.log(`      ${voters ? `참여 ${voters}명 가운데 ${r.votes}명 (${pct}%)` : '참여자 없음'}`);
  for (const [label, v] of [['장소', r.venue], ['요금', r.price], ['시간', r.hours], ['메모', r.note]]) {
    if (v) console.log(`      ${label} · ${v}`);
  }
  for (const l of r.links ?? []) console.log(`      ${l.kind} · ${l.url}`);
}

const zero = rows.filter((r) => r.votes === 0);
if (zero.length) console.log(`\n  0표: ${zero.map((r) => r.title).join(' · ')}`);

console.log('\n■ 읽을 때 주의할 것');
if (s.multi_choice) {
  console.log(`  · 한 사람이 여러 개 고를 수 있어 표 합계(${total})가 참여자 수(${voters})보다 큽니다.`);
  console.log('    "몇 명이 이걸 골랐나" 로 읽어야지 득표율로 나누면 안 됩니다.');
}
if (voters > 0 && voters < 5) {
  console.log(`  · 참여가 ${voters}명뿐이라 한 명만 달라져도 순위가 뒤집힙니다. 결과로 단정하기 어렵습니다.`);
}
const top = [...rows].sort((a, b) => b.votes - a.votes);
if (top.length >= 2 && top[0].votes - top[1].votes <= 1 && top[0].votes > 0) {
  console.log(`  · 1위와 2위가 ${top[0].votes - top[1].votes}표 차입니다. 순위 차이로 읽지 마세요.`);
}
/**
 * **옮겨 온 투표에는 이름이 담길 수 있다** (survey_options.imported_voters, 2026-08-27).
 * 그때는 회원 화면에도 이름이 뜨므로 「운영자 화면에서만」 이 거짓이 된다.
 * 담긴 설문에서는 그 사실을 그대로 말한다.
 */
const named = rows.some((r) => Array.isArray(r.imported_voters) && r.imported_voters.length);
console.log(named
  ? '  · 이 투표는 톡방에서 옮겨 온 것이라 후보마다 고른 사람 이름이 함께 있습니다. '
    + '그 이름은 회원 화면에도 그대로 보입니다.'
  : '  · 이 숫자에는 이름이 없습니다. 누가 무엇을 골랐는지는 운영자 화면에서만 볼 수 있습니다.');
