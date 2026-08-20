#!/usr/bin/env node
/**
 * validate-survey-schema.mjs — 설문 마이그레이션이 지켜야 할 것을 지키는지 본다.
 *
 *   node scripts/validate-survey-schema.mjs
 *
 * ── 무엇을 지키나 ───────────────────────────────────────────
 * 응답에는 **이름과 구역번호**가 들어간다. 그런데 이 사이트의 anon 키는
 * 공개 저장소에 있다. 응답 표를 anon 이 읽을 수 있으면 누구나 키를 꺼내
 * "누가 무엇에 투표했는지" 명단을 통째로 내려받는다.
 *
 * 그 경계는 SQL 한 줄로 무너진다 — `grant select on public.survey_responses`
 * 한 줄이면 끝이다. 사람이 훑어서는 놓친다. 그래서 글로 검사한다.
 *
 * 이 검사기는 **DB 에 붙지 않는다.** 마이그레이션 글만 읽는다.
 * 실제 DB 가 그대로인지는 적용 후 눈으로 확인한 수치(각 파일 끝의 select)로 본다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'supabase/migrations');
const fails = [];
const fail = (m) => fails.push(m);

const read = (name) => {
  const p = path.join(DIR, name);
  if (!fs.existsSync(p)) { fail(`${name} 이 없다`); return ''; }
  return fs.readFileSync(p, 'utf8');
};

const tables = read('202608200001a_survey_tables.sql');
const funcs = read('202608200001b_survey_functions.sql');
const seed = read('202608200001c_survey_september.sql');
const tmpl = read('202608200001d_admin_password.template.sql');
const admin = read('202608200002a_survey_admin_functions.sql');
/** 함수 검사는 두 파일을 합쳐서 본다 — 같은 규칙이 둘 다에 걸린다 */
const allFuncs = `${funcs}\n${admin}`;

/* ── 1. 응답 표는 잠겨 있어야 한다 ───────────────────────── */

const LOCKED = ['survey_responses', 'survey_choices', 'survey_admins'];
const OPEN = ['surveys', 'survey_options'];

for (const t of [...LOCKED, ...OPEN]) {
  if (!new RegExp(`alter\\s+table\\s+public\\.${t}\\s+enable\\s+row\\s+level\\s+security`, 'i').test(tables)) {
    fail(`public.${t} 에 RLS 를 켜지 않았다`);
  }
}

for (const t of LOCKED) {
  // grant select/all ... on public.<t> to anon — 이게 있으면 명단이 샌다
  const granted = new RegExp(`grant\\s+[^;]*\\bon\\s+public\\.${t}\\b[^;]*\\bto\\b[^;]*\\banon\\b`, 'i');
  if (granted.test(tables) || granted.test(funcs) || granted.test(seed)) {
    fail(`public.${t} 를 anon 에게 열었다 — 이름과 구역번호가 그대로 나간다`);
  }
  // RLS 정책으로 여는 것도 같은 결과다
  const policy = new RegExp(`create\\s+policy[^;]*\\bon\\s+public\\.${t}\\b`, 'i');
  if (policy.test(tables)) {
    fail(`public.${t} 에 정책을 만들었다 — 이 표는 정책 없이 잠가 두는 것이 설계다`);
  }
}

for (const t of OPEN) {
  if (!new RegExp(`grant\\s+select\\s+on\\s+public\\.${t}`, 'i').test(tables)) {
    fail(`public.${t} 는 읽을 수 있어야 하는데 grant select 가 없다`);
  }
}

/* ── 2. 함수는 definer 이고, 부를 권한을 명시해야 한다 ───── */

/**
 * 기본 권한이 revoke 되어 있다(202608060001). 그래서 grant execute 를
 * 빠뜨리면 함수가 있어도 앱에서 부를 수 없다 — 조용히 안 되는 쪽이라 잡아 둔다.
 */
const CALLABLE = [
  'survey_submit', 'survey_my_choices', 'survey_tally',
  'survey_response_count', 'survey_participants', 'survey_admin_ok',
  'survey_admin_save', 'survey_admin_delete', 'survey_admin_list',
  'survey_admin_tally', 'survey_admin_names',
];
for (const f of CALLABLE) {
  if (!new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${f}\\b`, 'i').test(allFuncs)) {
    fail(`public.${f} 함수가 없다`);
  }
  if (!new RegExp(`grant\\s+execute\\s+on\\s+function\\s+public\\.${f}\\b[^;]*\\banon\\b`, 'i').test(allFuncs)) {
    fail(`public.${f} 에 anon 실행 권한을 주지 않았다 — 앱에서 부를 수 없다`);
  }
}

/**
 * **운영자 함수는 첫머리에서 암호를 봐야 한다.**
 * security definer 라 안 보면 누구나 설문을 지울 수 있다.
 * 함수가 늘어날 때 이 한 줄을 빠뜨리는 것이 가장 그럴듯한 사고다.
 */
for (const block of admin.split(/create\s+or\s+replace\s+function/i).slice(1)) {
  const name = (/^\s*public\.(\w+)/.exec(block) ?? [])[1];
  if (!name) continue;
  if (!/survey_admin_ok\s*\(\s*p_password\s*\)/.test(block)) {
    fail(`public.${name} 이 암호를 확인하지 않는다 — 누구나 부를 수 있다`);
  }
}

// 응답에 닿는 함수는 definer 여야 하고, search_path 를 고정해야 한다
for (const block of allFuncs.split(/create\s+or\s+replace\s+function/i).slice(1)) {
  const name = (/^\s*public\.(\w+)/.exec(block) ?? [])[1];
  if (!name || !name.startsWith('survey')) continue;
  if (name === 'survey_respondent_key') continue;   // 값만 다듬는다. 표를 안 본다.
  const head = block.split(/\bas\s+\$\$/i)[0] ?? '';
  if (!/security\s+definer/i.test(head)) {
    fail(`public.${name} 이 security definer 가 아니다 — 잠근 표에 닿지 못한다`);
  }
  if (!/set\s+search_path\s*=/i.test(head)) {
    fail(`public.${name} 에 search_path 를 고정하지 않았다`);
  }
}

// 열쇠 만드는 함수는 밖에서 못 부르게 막아 둔다
if (!/revoke\s+execute\s+on\s+function\s+public\.survey_respondent_key/i.test(allFuncs)) {
  fail('public.survey_respondent_key 를 anon 에게서 회수하지 않았다');
}

/* ── 3. 집계 함수가 이름을 흘리지 않는가 ─────────────────── */

const tally = /create\s+or\s+replace\s+function\s+public\.survey_tally[\s\S]*?\$\$;/i.exec(funcs);
if (!tally) fail('survey_tally 를 찾지 못했다');
else if (/display_name|respondent_key|\bzone\b/i.test(tally[0])) {
  fail('survey_tally 가 이름·구역번호를 건드린다 — 집계는 숫자만 돌려줘야 한다');
}

/* ── 4. 암호가 커밋되지 않았는가 ─────────────────────────── */

const PLACEHOLDER = '여기에_암호를_적는다';
if (tmpl) {
  const calls = [...tmpl.matchAll(/crypt\(\s*'([^']*)'/g)].map((m) => m[1]);
  for (const v of calls) {
    if (v !== PLACEHOLDER) fail(`암호 틀에 실제 값으로 보이는 것이 들어 있다: ${JSON.stringify(v)}`);
  }
  if (!calls.length) fail('암호 틀에서 crypt() 를 찾지 못했다');
}
for (const [name, text] of [['a', tables], ['b', funcs], ['c', seed], ['2a', admin]]) {
  if (/gen_salt\s*\(/i.test(text)) {
    fail(`${name} 파일에서 gen_salt 를 쓴다 — 암호는 틀 파일에서만 다룬다`);
  }
}

/* ── 5. 후보의 링크가 쓸 수 있는 모양인가 ────────────────── */

const KINDS = new Set(['official', 'video', 'article', 'map', 'booking']);
let linkCount = 0;
for (const m of seed.matchAll(/'(\[[\s\S]*?\])'::jsonb/g)) {
  let arr;
  try { arr = JSON.parse(m[1]); } catch { fail('후보의 links 가 올바른 JSON 이 아니다'); continue; }
  if (!Array.isArray(arr)) { fail('links 는 배열이어야 한다'); continue; }
  for (const l of arr) {
    linkCount += 1;
    if (!l || typeof l !== 'object') { fail('links 항목이 객체가 아니다'); continue; }
    if (!KINDS.has(l.kind)) fail(`links 의 kind 가 알 수 없는 값이다: ${JSON.stringify(l.kind)}`);
    if (typeof l.label !== 'string' || !l.label.trim()) fail('links 항목에 label 이 없다');
    if (typeof l.url !== 'string' || !/^https:\/\//.test(l.url)) {
      fail(`links 의 url 이 https 로 시작하지 않는다: ${JSON.stringify(l.url)}`);
    }
  }
}

/* ── 알리기 ──────────────────────────────────────────────── */

if (fails.length) {
  console.log(`설문 스키마 검사 실패 — ${fails.length}건\n`);
  fails.forEach((f) => console.log(`  · ${f}`));
  process.exit(1);
}
console.log(`설문 스키마 검사 통과 — 잠근 표 ${LOCKED.length} · 공개 표 ${OPEN.length} `
  + `· anon 이 부르는 함수 ${CALLABLE.length} · 후보 링크 ${linkCount}`);
