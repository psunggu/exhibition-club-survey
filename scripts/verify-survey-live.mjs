#!/usr/bin/env node
/**
 * verify-survey-live.mjs — **진짜 Supabase** 에 붙어 설문 경계를 확인한다.
 *
 *   node scripts/verify-survey-live.mjs           읽기와 거절만 (아무것도 안 쓴다)
 *   node scripts/verify-survey-live.mjs --write   응답 한 건을 실제로 넣어 본다
 *
 * ── 왜 check 에 넣지 않나 ───────────────────────────────────
 * 이건 검사기가 아니라 **한 번 확인하는 도구**다.
 * 매번 돌리면 회원 데이터가 있는 DB 를 계속 두드리게 되고,
 * --write 는 진짜 응답을 남긴다. 마이그레이션을 적용한 직후에만 쓴다.
 *
 * 확인하는 것은 크게 둘이다.
 *   1. 응답·명단·암호 표가 **밖에서 안 읽히는가**  ← 여기가 뚫리면 명부가 샌다
 *   2. 함수가 막아야 할 것을 막는가 (마감·남의 후보·빈 이름)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

const cfg = fs.readFileSync(path.join(ROOT, 'app/public/config.js'), 'utf8');
const URL_ = (/supabaseUrl\s*:\s*["']([^"']+)/.exec(cfg) ?? [])[1];
const KEY = (/supabaseAnonKey\s*:\s*["']([^"']+)/.exec(cfg) ?? [])[1];
if (!URL_ || !KEY) { console.error('config.js 에서 URL/키를 못 읽었다'); process.exit(2); }

const base = URL_.replace(/\/$/, '');
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const fails = [];
const ok = (label, cond, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) fails.push(label);
};

const get = async (p) => {
  const r = await fetch(`${base}/rest/v1/${p}`, { headers: H });
  let body = null;
  try { body = await r.json(); } catch { /* 본문이 JSON 이 아닐 수 있다 */ }
  return { status: r.status, body };
};
const rpc = async (name, args) => {
  const r = await fetch(`${base}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: H, body: JSON.stringify(args),
  });
  let body = null;
  try { body = await r.json(); } catch { /* 그대로 */ }
  return { status: r.status, body };
};

/* ── 1. 읽어도 되는 것 ───────────────────────────────────── */

console.log('\n── 공개해도 되는 표');
const surveys = await get('surveys?select=*,survey_options(*)&deleted_at=is.null');
ok('설문을 읽을 수 있다', surveys.status === 200 && Array.isArray(surveys.body),
  `${surveys.status} · ${Array.isArray(surveys.body) ? surveys.body.length : '?'}건`);

const s0 = Array.isArray(surveys.body) ? surveys.body[0] : null;
if (!s0) { console.error('\n설문이 하나도 없다 — c 파일을 실행했는지 확인한다'); process.exit(1); }

ok('후보가 딸려 온다', Array.isArray(s0.survey_options) && s0.survey_options.length === 4,
  `${s0.survey_options?.length ?? 0}개`);
const links = (s0.survey_options ?? []).flatMap((o) => o.links ?? []);
ok('참고 링크가 들어 있다', links.length === 4, links.map((l) => l.kind).join(', '));
ok('서도호 영상 링크가 있다',
  links.some((l) => l.kind === 'video' && l.url.includes('8IvgzYaKexE')));
ok('마감이 8/21 08시다', String(s0.closes_at).startsWith('2026-08-20T23:00'),
  `${s0.closes_at} (UTC 표기)`);

/* ── 2. 읽히면 안 되는 것 ───────────────────────────────── */

console.log('\n── 잠긴 표 (여기가 이 설계의 핵심이다)');
for (const t of ['survey_responses', 'survey_choices', 'survey_admins']) {
  const r = await get(`${t}?select=*`);
  const leaked = r.status === 200 && Array.isArray(r.body);
  ok(`${t} 를 못 읽는다`, !leaked,
    leaked ? `열려 있다! ${r.body.length}행이 나왔다` : `막힘 (${r.status})`);
}

// 후보를 거쳐 응답에 닿는 우회로도 막혀 있어야 한다
const via = await get('survey_options?select=*,survey_choices(*)&limit=1');
ok('후보를 거쳐 응답으로 못 들어간다', via.status !== 200,
  via.status === 200 ? '열려 있다!' : `막힘 (${via.status})`);

/* ── 3. 함수가 막아야 할 것 ─────────────────────────────── */

console.log('\n── 함수가 거절하는가');
const optIds = (s0.survey_options ?? []).map((o) => o.id);

const noName = await rpc('survey_submit',
  { p_survey: s0.id, p_zone: '', p_name: '', p_options: [optIds[0]] });
ok('빈 이름을 거절한다', noName.status >= 400,
  noName.body?.message?.slice(0, 30) ?? String(noName.status));

const noPick = await rpc('survey_submit',
  { p_survey: s0.id, p_zone: '9999', p_name: '검사용', p_options: [] });
ok('아무것도 안 고르면 거절한다', noPick.status >= 400,
  noPick.body?.message?.slice(0, 30) ?? String(noPick.status));

const alien = await rpc('survey_submit',
  { p_survey: s0.id, p_zone: '9999', p_name: '검사용',
    p_options: ['00000000-0000-4000-8000-000000000000'] });
ok('남의 후보 uuid 를 거절한다', alien.status >= 400,
  alien.body?.message?.slice(0, 34) ?? String(alien.status));

const ghost = await rpc('survey_submit',
  { p_survey: '00000000-0000-4000-8000-000000000000',
    p_zone: '9999', p_name: '검사용', p_options: [optIds[0]] });
ok('없는 설문을 거절한다', ghost.status >= 400,
  ghost.body?.message?.slice(0, 30) ?? String(ghost.status));

const badPw = await rpc('survey_admin_ok', { p_password: '틀린암호' });
ok('틀린 운영자 암호는 false', badPw.status === 200 && badPw.body === false,
  JSON.stringify(badPw.body));

const notMine = await rpc('survey_my_choices',
  { p_survey: s0.id, p_zone: '0001', p_name: '없는사람' });
ok('없는 사람은 빈 결과', notMine.status === 200
  && Array.isArray(notMine.body) && notMine.body.length === 0,
  JSON.stringify(notMine.body)?.slice(0, 30));

const count = await rpc('survey_response_count', { p_survey: s0.id });
console.log(`\n  지금까지 응답 ${count.body}건`);

/* ── 4. 실제로 써 본다 (--write 일 때만) ────────────────── */

if (WRITE) {
  console.log('\n── 실제 응답 넣기 (검사용 한 건)');
  const ZONE = '0000'; const NAME = '검사용응답';
  const pick = [optIds[0], optIds[2]];

  const put = await rpc('survey_submit',
    { p_survey: s0.id, p_zone: ZONE, p_name: NAME, p_options: pick });
  ok('응답이 들어갔다', put.status < 400,
    put.body?.message?.slice(0, 40) ?? String(put.status));

  const mine = await rpc('survey_my_choices', { p_survey: s0.id, p_zone: ZONE, p_name: NAME });
  const got = Array.isArray(mine.body) ? mine.body.map((r) => r.option_id).sort() : [];
  ok('넣은 그대로 돌아온다', JSON.stringify(got) === JSON.stringify([...pick].sort()),
    `${got.length}개`);

  // 다시 내면 이전 것이 지워지고 새것만 남아야 한다
  const again = await rpc('survey_submit',
    { p_survey: s0.id, p_zone: ZONE, p_name: NAME, p_options: [optIds[1]] });
  ok('다시 제출이 된다', again.status < 400);
  const mine2 = await rpc('survey_my_choices', { p_survey: s0.id, p_zone: ZONE, p_name: NAME });
  const got2 = Array.isArray(mine2.body) ? mine2.body.map((r) => r.option_id) : [];
  ok('이전 선택이 지워졌다', got2.length === 1 && got2[0] === optIds[1],
    `${got2.length}개`);

  // 공백과 대소문자가 달라도 같은 사람으로 본다
  const same = await rpc('survey_my_choices',
    { p_survey: s0.id, p_zone: ` ${ZONE} `, p_name: ` ${NAME} ` });
  ok('공백이 달라도 같은 사람으로 본다',
    Array.isArray(same.body) && same.body.length === 1, `${same.body?.length ?? 0}개`);

  const tally = await rpc('survey_tally', { p_survey: s0.id });
  ok('집계가 나온다', tally.status === 200 && Array.isArray(tally.body) && tally.body.length === 4,
    `${tally.body?.length ?? 0}개 후보`);
  ok('집계에 이름이 없다',
    !JSON.stringify(tally.body ?? '').includes(NAME));

  console.log(`\n  ※ 검사용 응답 한 건이 남았다. 지우려면 SQL Editor 에서:`);
  console.log(`     delete from public.survey_responses`);
  console.log(`      where respondent_key = '${ZONE}|${NAME.toLowerCase()}';`);
} else {
  console.log('\n  (쓰기는 확인하지 않았다 — --write 를 붙이면 한 건 넣어 본다)');
}

console.log(`\n${fails.length ? `실패 ${fails.length}건: ${fails.join(', ')}` : '설문 라이브 확인 통과'}`);
process.exit(fails.length ? 1 : 0);
