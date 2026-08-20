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
const admin = [
  read('202608200002a_survey_admin_functions.sql'),
  read('202608200003a_survey_admin_results.sql'),
].join('\n');
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
  'survey_admin_results', 'survey_admin_respondents',
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

/* ── 2-2. returns table 에 예약어를 쓰지 않았는가 ────────── */

/**
 * **`position` 같은 이름은 `returns table` 에서 못 쓴다.**
 * 컬럼 이름으로는 되므로(survey_options.position 은 멀쩡하다) 눈으로는 멀쩡해 보이는데,
 * returns table 의 이름 자리는 함수 인자처럼 파싱되어
 * `position(… in …)` 함수로 읽힌다 — 42601 syntax error 가 난다.
 *
 * 실제로 그렇게 실패했다. 나는 이 SQL 을 실행해 볼 수 없어서(운영자 권한이 없다)
 * 사람이 붙여넣고 나서야 알았다. 그래서 글로 미리 잡는다.
 *
 * PostgreSQL 의 col_name_keyword 가운데 이런 자리에서 걸리는 것들이다.
 */
const RESERVED = new Set([
  'position', 'between', 'coalesce', 'exists', 'extract', 'greatest', 'least',
  'nullif', 'overlay', 'substring', 'treat', 'trim', 'values', 'xmlattributes',
  'xmlconcat', 'xmlelement', 'xmlexists', 'xmlforest', 'xmlparse', 'xmlpi',
  'xmlroot', 'xmlserialize', 'row', 'setof', 'out', 'in', 'inout', 'default',
]);
/** 앞쪽에서 **가장 가까운** 함수 선언을 찾는다. 처음 것을 집으면 엉뚱한 파일로 안내한다. */
const heads = [...allFuncs.matchAll(/create\s+or\s+replace\s+function\s+public\.(\w+)/gi)]
  .map((h) => ({ at: h.index, name: h[1] }));
const ownerOf = (at) => heads.filter((h) => h.at < at).at(-1)?.name ?? '?';

for (const m of allFuncs.matchAll(/returns\s+table\s*\(([\s\S]*?)\)\s*\n/gi)) {
  const fnName = ownerOf(m.index);
  for (const col of m[1].split(',')) {
    const name = (/^\s*(\w+)/.exec(col) ?? [])[1];
    if (name && RESERVED.has(name.toLowerCase())) {
      fail(`public.${fnName} 의 returns table 에 예약어 '${name}' 를 썼다 `
        + '— 42601 syntax error 가 난다. 이름을 바꾼다 (예: option_position)');
    }
  }
}

/* ── 2-3. 반환 모양을 바꿀 때 drop 을 했는가 ─────────────── */

/**
 * **`create or replace function` 은 반환 모양을 바꾸지 못한다.**
 *
 * 컬럼을 더하거나 이름을 바꾸면
 * `42P13 cannot change return type of existing function` 이 난다.
 * 먼저 `drop function` 을 해야 하고, 지우면 **실행 권한도 함께 사라지므로**
 * 다시 줘야 한다.
 *
 * 실제로 그렇게 실패했다 — survey_admin_list 에 컬럼 둘을 더하면서 놓쳤다.
 * 나는 이 SQL 을 돌려볼 수 없으므로(운영자 권한이 없다) 글로 잡는다.
 *
 * 마이그레이션을 순서대로 읽어 같은 함수의 반환 모양이 달라지는 자리를 찾고,
 * 그 파일에 drop 과 재부여가 함께 있는지 본다.
 */
{
  const order = [
    ['b', funcs],
    ['2a', read('202608200002a_survey_admin_functions.sql')],
    ['3a', read('202608200003a_survey_admin_results.sql')],
    ['21a', read('202608210001a_survey_category.sql')],
  ];

  /**
   * **조각으로 갈라 하나씩 본다.**
   * 처음에는 정규식 하나로 `function … ) returns …` 를 잡았는데,
   * 괄호와 returns 사이에 **주석 줄**이 있으면 \s* 가 못 넘어가고
   * 뒤 함수의 returns 를 끌어와 엉뚱하게 "바뀌었다" 고 했다 (survey_admin_results).
   * 조각마다 첫 returns 만 보면 그런 일이 없다.
   */
  /** 주석을 걷어낸다. 주석 안의 `returns table` 이 먼저 잡혀 엉뚱한 모양을 읽었다. */
  const strip = (text) => text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')     // /* … */
    .replace(/^\s*--.*$/gm, '');             // -- 한 줄

  const shapesOf = (text) => {
    const out = [];
    for (const chunk of strip(text).split(/create\s+or\s+replace\s+function/i).slice(1)) {
      const name = (/^\s*public\.(\w+)/.exec(chunk) ?? [])[1];
      if (!name) continue;
      const m = /\breturns\s+([\s\S]*?)\s*\blanguage\s/i.exec(chunk);
      if (!m) continue;
      out.push([name, m[1].replace(/\s+/g, ' ').trim()]);
    }
    return out;
  };

  const seen = new Map();
  for (const [tag, text] of order) {
    if (!text) continue;
    for (const [name, ret] of shapesOf(text)) {
      const before = seen.get(name);
      if (before && before.ret !== ret) {
        const hasDrop = new RegExp(`drop\\s+function\\s+if\\s+exists\\s+public\\.${name}\\b`, 'i').test(text);
        const hasGrant = new RegExp(`grant\\s+execute\\s+on\\s+function\\s+public\\.${name}\\b[^;]*anon`, 'i').test(text);
        if (!hasDrop) {
          fail(`public.${name} 의 반환 모양이 ${before.where} → ${tag} 에서 바뀌는데 `
            + 'drop function 이 없다 — 42P13 이 난다');
        } else if (!hasGrant) {
          fail(`public.${name} 을 drop 했는데 실행 권한을 다시 주지 않았다 `
            + '— 지우면 권한도 함께 사라진다');
        }
      }
      seen.set(name, { ret, where: tag });
    }
  }
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
