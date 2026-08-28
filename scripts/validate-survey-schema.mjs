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

/** read() 가 읽은 파일 이름. 아래에서 「안 본 파일이 있나」 를 셀 때 쓴다. */
const READ_FILES = new Set();
const read = (name) => {
  READ_FILES.add(name);
  const p = path.join(DIR, name);
  if (!fs.existsSync(p)) { fail(`${name} 이 없다`); return ''; }
  return fs.readFileSync(p, 'utf8');
};

const tables = [
  read('202608200001a_survey_tables.sql'),
  read('202608210002a_survey_notes.sql'),
  read('202608220001a_members.sql'),
  /** 컬럼을 더하는 파일도 여기서 읽어야 한다 — 안 읽으면 아래 컬럼 이름 검사가
      그 컬럼을 쓰는 함수를 「없는 열을 쓴다」 고 잡는다. */
  read('202608270001a_imported_voters.sql'),
].join('\n');
const funcs = read('202608200001b_survey_functions.sql');
const seed = read('202608200001c_survey_september.sql');
const tmpl = read('202608200001d_admin_password.template.sql');
const votersTmpl = read('202608270001b_poll_voters.template.sql');
const membersTmpl = read('202608270001c_members_bulk.template.sql');
const mealTmpl = read('202608280001a_meal_place_survey.template.sql');
/** 운영자 함수는 여러 파일에 흩어져 있다. 규칙은 전부에 같이 걸린다. */
const admin = [
  read('202608200002a_survey_admin_functions.sql'),
  read('202608200003a_survey_admin_results.sql'),
  read('202608210001a_survey_category.sql'),
  read('202608210002a_survey_notes.sql'),
  read('202608220001a_members.sql'),
  read('202608240001a_anonymous.sql'),
  read('202608270001a_imported_voters.sql'),
  read('202608280002a_my_choices_gate.sql'),
  read('202608280003a_admin_gate_hardening.sql'),
].join('\n');
/** 함수 검사는 두 파일을 합쳐서 본다 — 같은 규칙이 둘 다에 걸린다 */
const allFuncs = `${funcs}\n${admin}`;

/* ── 1. 응답 표는 잠겨 있어야 한다 ───────────────────────── */

// survey_notes 도 잠근다 — 톡방 이야기나 사람 이름이 섞일 수 있는 자리다
// survey_members 는 그 자체가 교인 명부다 — 읽히면 이름과 구역번호가 통째로 샌다
// survey_probe_log 는 누가 언제 두드렸는지의 기록이다 — 이것도 열어 둘 이유가 없다
const LOCKED = ['survey_responses', 'survey_choices', 'survey_admins', 'survey_notes',
  'survey_members', 'survey_probe_log'];
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
  'survey_admin_note', 'survey_admin_note_save',
  'survey_member_ok', 'survey_roster_on',
  'survey_admin_members', 'survey_admin_member_save', 'survey_admin_member_delete',
];
for (const f of CALLABLE) {
  if (!new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${f}\\b`, 'i').test(allFuncs)) {
    fail(`public.${f} 함수가 없다`);
  }
  if (!new RegExp(`grant\\s+execute\\s+on\\s+function\\s+public\\.${f}\\b[^;]*\\banon\\b`, 'i').test(allFuncs)) {
    fail(`public.${f} 에 anon 실행 권한을 주지 않았다 — 앱에서 부를 수 없다`);
  }
}

/* ── insert 가 실제로 있는 열에 쓰는가 ────────────────────── */
/**
 * **plpgsql 은 만들 때 열 이름을 보지 않는다.** 부를 때 42703 으로 터진다.
 * 그래서 없는 열에 쓰는 함수를 만들어도 마이그레이션은 조용히 성공하고,
 * 회원이 제출을 누르는 순간에야 무너진다.
 *
 * 실제로 그럴 뻔했다 — survey_submit 을 다시 쓰면서 꼬리를 그대로 옮기지 않고
 * 손으로 다시 썼더니 `display_name` 을 `name` 으로, `updated_at` 을 `answered_at` 으로,
 * survey_choices 를 옛 모양(`survey_id, respondent_key`)으로 적었다.
 * 검사는 통과했다. 열 이름을 안 봤기 때문이다.
 *
 * 표 정의에서 열을 읽어 와 견준다 — 목록을 여기 손으로 적으면 그것부터 낡는다.
 */
/**
 * 열은 두 군데서 생긴다 — `create table` 과, 나중에 붙인 `alter table … add column`.
 * 처음엔 앞엣것만 읽었더니 `surveys.category` 처럼 뒤에 붙인 열을 없는 열이라고 잡았다.
 * 표 정의가 흩어져 있으므로 모든 마이그레이션에서 함께 긁는다.
 */
const everySql = [tables, funcs, seed, admin].join('\n');

const columnsOf = (table) => {
  const cols = new Set();
  const created = new RegExp(`create table if not exists public\\.${table}\\s*\\(([\\s\\S]*?)\\n\\);`, 'i')
    .exec(everySql);
  if (created) {
    for (const l of created[1].split('\n')) {
      const c = /^([a-z_][a-z0-9_]*)\s+[a-z]/i.exec(l.replace(/--.*$/, '').trim())?.[1];
      if (c) cols.add(c);
    }
  }
  const added = new RegExp(
    `alter\\s+table\\s+(?:only\\s+)?public\\.${table}\\s+add\\s+column\\s+(?:if\\s+not\\s+exists\\s+)?([a-z_][a-z0-9_]*)`, 'gi');
  for (const m of everySql.matchAll(added)) cols.add(m[1]);
  return cols.size ? cols : null;
};

/** 우리가 만드는 표 전부 — 손으로 적으면 표가 늘 때마다 낡는다 */
const OURS = [...new Set(
  [...everySql.matchAll(/create table if not exists public\.(\w+)/gi)].map((m) => m[1]),
)];

for (const m of allFuncs.matchAll(/insert\s+into\s+public\.(\w+)\s*\(([^)]*)\)/gi)) {
  const [, table, list] = m;
  const known = columnsOf(table);
  if (!known) continue;                      // 이 저장소가 만들지 않은 표는 넘긴다
  for (const c of list.split(',').map((x) => x.trim()).filter(Boolean)) {
    if (!known.has(c)) fail(`public.${table} 에 없는 열에 넣는다 — ${c} (부를 때 42703 으로 터진다)`);
  }
}

for (const m of allFuncs.matchAll(/do\s+update\s+set\s+([\s\S]*?);/gi)) {
  // `set a = …, b = …` 에서 왼쪽 이름만 본다
  for (const c of m[1].matchAll(/(?:^|,)\s*([a-z_][a-z0-9_]*)\s*=/gi)) {
    const col = c[1];
    // 어느 표인지 이 조각만으로는 모르니, 우리 표 어디에도 없는 이름이면 잡는다
    const anywhere = OURS.some((t) => columnsOf(t)?.has(col));
    if (!anywhere) fail(`do update set 에서 우리 표에 없는 열을 고친다 — ${col}`);
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
  /**
   * **이름이 `survey_admin_` 으로 시작하는 것만** 본다.
   * 이 파일들에는 회원용 함수(survey_submit · survey_tally 등)도 함께 들어 있고,
   * 그것들은 암호를 요구하면 안 된다 — 회원이 부르는 것이니까.
   * 처음에 그 구분 없이 걸었더니 회원용 셋을 잘못 잡았다.
   */
  if (!name.startsWith('survey_admin_')) continue;
  // survey_admin_ok 는 검사하는 쪽이지 검사받는 쪽이 아니다
  if (name === 'survey_admin_ok') continue;
  if (!/survey_admin_ok\s*\(\s*p_password\s*\)/.test(block)) {
    fail(`public.${name} 이 암호를 확인하지 않는다 — 누구나 부를 수 있다`);
  }
}

// 응답에 닿는 함수는 definer 여야 하고, search_path 를 고정해야 한다
for (const block of allFuncs.split(/create\s+or\s+replace\s+function/i).slice(1)) {
  const name = (/^\s*public\.(\w+)/.exec(block) ?? [])[1];
  if (!name || !name.startsWith('survey')) continue;
  /**
   * **표를 한 곳도 안 보는 함수는 definer 가 필요 없다.** 값만 다듬는 것들이다.
   * 예전에는 이름을 하나(survey_respondent_key) 적어 두었는데, 그런 함수가 늘 때마다
   * 목록을 고쳐야 했다 — 실제로 survey_anon_key 를 넣자마자 걸렸다.
   * 이름 대신 **본문이 표에 닿는지**를 본다.
   */
  const body = block.split(/\bas\s+\$\$/i)[1] ?? '';
  if (!/\b(from|join|into|update|delete\s+from)\s+public\./i.test(body)) continue;
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

/**
 * **마지막 정의를 본다.**
 * 예전에는 202608200001b 한 파일만 봤는데, survey_tally 는 202608210001a 에서
 * 이미 다시 정의됐고 그 정의는 이 검사를 **한 번도 안 받았다**.
 * 앞으로 또 다시 정의해도 마찬가지가 된다. 그래서 전 파일에서 찾아 마지막 것을 본다.
 *
 * `imported_voters` 도 함께 막는다 — 옮겨 온 투표의 투표자 실명이다.
 * 이름은 후보 표(survey_options)를 REST 로 읽어 화면이 가져간다.
 * 집계 함수까지 이름을 나르기 시작하면 「집계는 숫자만」 이 무너지고,
 * results_visible 을 지나 나가는 길이 하나 더 생긴다.
 */
const tallyDefs = [...allFuncs.matchAll(
  /create\s+or\s+replace\s+function\s+public\.survey_tally[\s\S]*?\$\$;/gi)];
if (!tallyDefs.length) fail('survey_tally 를 찾지 못했다');
else {
  const last = tallyDefs[tallyDefs.length - 1][0];
  if (/display_name|respondent_key|\bzone\b|imported_voters/i.test(last)) {
    fail('survey_tally 가 이름·구역번호를 건드린다 — 집계는 숫자만 돌려줘야 한다');
  }
}

/* ── 3-2. 옮겨 온 투표의 투표자 이름 ─────────────────────── */

/**
 * **공개 표에 이름칸을 만드는 일에는 조건이 붙는다.**
 *
 * survey_options 는 `grant select … to anon` 이 걸린 공개 표다. 컬럼 목록 grant 가
 * 아니라 표 단위라 **새로 더한 열은 아무 SQL 을 더 쓰지 않아도 그대로 공개된다.**
 * 그래서 이름을 이 표에 두는 것은 「보여 주기로 정했다」 와 같은 뜻이어야 한다.
 *
 * 지키게 하는 것 셋:
 *   · 개수가 표 수와 같아야 한다 — 안 그러면 화면의 두 숫자가 서로 다른 말을 한다
 *   · 빈 이름이 없어야 한다 — 빈 칩이 그려진다
 *   · **show_names 를 켠 설문에만** 담을 수 있다 — 운영자 스위치를 옆으로 지나치지 않는다
 *
 * 이 규칙이 없으면 다음 사람이 컬럼 하나로 명부를 공개해도 아무도 못 잡는다.
 * 실제로 이 검사를 넣기 전에는 전부 조용히 통과했다.
 */
const votersCol = /add\s+column\s+if\s+not\s+exists\s+imported_voters/i.test(tables);
if (!votersCol) {
  fail('imported_voters 열을 더하는 자리를 찾지 못했다');
} else {
  if (!/constraint\s+survey_options_voters_match\s+check[\s\S]*?cardinality\(\s*imported_voters\s*\)\s*=\s*imported_votes/i.test(tables)) {
    fail('imported_voters 개수가 imported_votes 와 같은지 보는 제약이 없다');
  }
  if (!/constraint\s+survey_options_voters_nonblank\s+check/i.test(tables)) {
    fail('imported_voters 에 빈 이름을 막는 제약이 없다');
  }
  for (const t of ['survey_options_voters_gate', 'surveys_show_names_gate']) {
    if (!new RegExp(`create\\s+trigger\\s+${t}\\b`, 'i').test(tables)) {
      fail(`${t} 방아쇠가 없다 — show_names 를 지나쳐 이름이 공개될 수 있다`);
    }
  }
  if (!/show_names/i.test(tables.split('survey_voters_need_show_names')[1] ?? '')) {
    fail('survey_voters_need_show_names 가 show_names 를 안 본다');
  }
}

/**
 * **틀에는 진짜 후보 id 가 없어야 한다.**
 * 전부 0 이면 그대로 실행해도 0줄이 바뀌어 아무 일도 안 난다.
 * 진짜 id 를 적어 두면 운영자가 자리표시자인 줄 모르고 실행해 가짜 이름이 들어간다.
 * (이름 자체는 validate-repository-hygiene.mjs 가 가상 명부와 대조해 본다.)
 */
if (votersTmpl) {
  const uuids = [...votersTmpl.matchAll(/'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'/gi)]
    .map((m) => m[1]);
  if (!uuids.length) fail('투표자 이름 틀에서 자리표시자 id 를 찾지 못했다');
  for (const u of uuids) {
    // 앞 네 마디가 모두 0 이어야 자리표시자다. 마지막 마디는 1·2·3 처럼 세어도 된다.
    if (!/^00000000-0000-0000-0000-/i.test(u)) {
      fail(`투표자 이름 틀에 진짜로 보이는 id 가 있다: ${u}`);
    }
  }
}

/**
 * **명부 대량입력 틀은 여러 번 돌려도 안전해야 한다.**
 *
 * 운영자가 명부를 나눠 여러 번 넣게 된다 — 톡방 프로필을 보고 옮기는 일이라
 * 한 번에 끝나지 않는다. `do update` 로 두면 다시 넣을 때마다 registered_at 이
 * 오늘로 밀려, **언제 들어온 회원인지가 사라진다.**
 * (운영자 화면의 survey_admin_member_save 도 같은 이유로 등록일자를 안 건드린다.)
 *
 * 이름 자체는 validate-repository-hygiene.mjs 가 가상 명부와 대조해 본다.
 */
if (membersTmpl) {
  /**
   * **주석을 걷어내고 본다.** 머리말이 「on conflict … do nothing 이라 안전하다」 고
   * 설명하고 있어서, 정작 본문에서 그 줄을 지워도 검사가 **주석을 읽고 통과**했다.
   * 결함을 심어 보다 드러났다 — 검사가 코드가 아니라 설명을 재고 있었다.
   */
  const body = membersTmpl.replace(/--[^\n]*/g, '');
  if (!/on\s+conflict\s*\(\s*zone\s*,\s*name\s*\)\s*do\s+nothing/i.test(body)) {
    fail('명부 대량입력 틀이 on conflict (zone, name) do nothing 이 아니다 '
      + '— 다시 넣으면 등록일자가 오늘로 밀린다');
  }
  if (/do\s+update/i.test(body)) {
    fail('명부 대량입력 틀에 do update 가 있다 — 등록일자를 덮어쓴다');
  }
  if (!/insert\s+into\s+public\.survey_members/i.test(body)) {
    fail('명부 대량입력 틀에서 survey_members insert 를 찾지 못했다');
  }
}

/**
 * **식사 장소 설문 틀 — 요약 카드와 id 가 맞아야 한다.**
 *
 * 요약 카드의 「식사 장소」 줄이 이 설문 id 를 가리키고 있어서,
 * **id 가 어긋나면 설문을 올려도 그 줄이 영영 「아직 안 정했습니다」 다.**
 * 화면은 멀쩡하고 DB 도 멀쩡한데 둘이 서로를 못 알아본다 —
 * 눈으로는 못 찾는 종류의 어긋남이라 여기서 글로 맞춰 본다.
 *
 * 그리고 **imported_respondents 를 넣으면 안 된다.** 넣는 순간
 * 「톡방에서 진행」 으로 잠겨 회원이 못 고른다 — 이 설문의 존재 이유가 사라진다.
 */
if (mealTmpl) {
  const body = mealTmpl.replace(/--[^\n]*/g, '');
  const id = /'(5e97b1a0-[0-9a-f-]+)'/i.exec(body)?.[1] ?? '';

  const briefPath = path.join(ROOT, 'app/src/data/meetingBrief.ts');
  const brief = fs.existsSync(briefPath) ? fs.readFileSync(briefPath, 'utf8') : '';
  const wanted = /decidedBy:\s*'([^']+)'/.exec(brief)?.[1] ?? '';

  if (!id) fail('식사 장소 틀에서 설문 id 를 찾지 못했다');
  else if (!wanted) fail('meetingBrief.ts 에서 decidedBy 를 찾지 못했다');
  else if (id !== wanted) {
    fail(`식사 장소 설문 id 가 요약 카드와 다르다 — 틀 ${id} · 카드 ${wanted} `
      + '(어긋나면 설문을 올려도 그 줄이 영영 「아직 안 정했습니다」 다)');
  }

  /**
   * **넣는 자리만 본다.** 처음엔 파일 전체에서 찾았더니, 맨 아래 확인 질의의
   * `imported_respondents is not null as 옮겨온것` 을 잡아 거짓 경보가 났다 —
   * 그 줄은 「옮겨 온 것이 아님」 을 **확인하려고** 읽는 자리다.
   */
  const insertCols = /insert\s+into\s+public\.surveys\s*\(([\s\S]*?)\)/i.exec(body)?.[1] ?? '';
  if (/imported_respondents/i.test(insertCols)) {
    fail('식사 장소 틀이 imported_respondents 를 넣는다 '
      + '— 넣으면 「톡방에서 진행」 으로 잠겨 회원이 못 고른다');
  }
  if (!/'meal'/.test(body)) {
    fail("식사 장소 틀의 갈래가 'meal' 이 아니다 — 전시 탭에 뜬다");
  }
}

/* ── 4. 암호가 커밋되지 않았는가 ─────────────────────────── */

/**
 * **자리표시자 모양을 본다 — 한 낱말로 못박지 않는다.**
 *
 * 예전에는 `여기에_암호를_적는다` 하나만 허용했다. 그런데 운영자가 늘면서
 * **사람마다 다른 암호**를 쓰게 됐고(survey_admin_ok 은 어느 해시든 맞으면 통과한다),
 * 그러려면 자리표시자도 사람마다 달라야 한다 —
 * 같은 자리표시자를 세 줄에 적어 두면 셋이 같은 암호를 쓰라는 말로 읽힌다.
 *
 * 지켜야 할 것은 「한 낱말이 그대로 있는가」 가 아니라 **「진짜 암호가 아닌가」** 다.
 * 그래서 `여기에_…_적는다` 꼴이면 통과시킨다. 사람이 실수로 진짜 암호를 적으면
 * 이 꼴을 벗어나므로 그대로 걸린다.
 */
const PLACEHOLDER = /^여기에_[^']*_적는다$/;
if (tmpl) {
  const calls = [...tmpl.matchAll(/crypt\(\s*'([^']*)'/g)].map((m) => m[1]);
  for (const v of calls) {
    if (!PLACEHOLDER.test(v)) fail(`암호 틀에 실제 값으로 보이는 것이 들어 있다: ${JSON.stringify(v)}`);
  }
  if (!calls.length) fail('암호 틀에서 crypt() 를 찾지 못했다');
  /**
   * **이름도 자리표시자여야 한다.**
   * 암호만 보고 이름은 안 봤더니 운영자 세 사람의 실명이 공개 저장소에 그대로 올라갔다.
   * AGENTS.md 는 운영진 명단을 소스에 두지 말라고 적어 두었고,
   * record-frozen-data.mjs 는 같은 값을 created_by 에서 이미 가리고 있었다.
   */
  for (const v of [...tmpl.matchAll(/\(\s*'([^']*)'\s*,\s*crypt\(/g)].map((m) => m[1])) {
    if (!PLACEHOLDER.test(v)) fail(`암호 틀에 운영자 실명이 있다: ${JSON.stringify(v)}`);
  }
  /** 확인 질의도 같은 자리표시자를 써야 한다 — 진짜 암호가 거기 남기 쉽다 */
  for (const v of [...tmpl.matchAll(/survey_admin_ok\(\s*'([^']*)'/g)].map((m) => m[1])) {
    if (!PLACEHOLDER.test(v)) fail(`암호 틀의 확인 질의에 실제 암호가 있다: ${JSON.stringify(v)}`);
  }
}
for (const [name, text] of [['a', tables], ['b', funcs], ['c', seed], ['2a', admin]]) {
  if (/gen_salt\s*\(/i.test(text)) {
    fail(`${name} 파일에서 gen_salt 를 쓴다 — 암호는 틀 파일에서만 다룬다`);
  }
}

/* ── 5. 후보의 링크가 쓸 수 있는 모양인가 ────────────────── */

const KINDS = new Set(['official', 'video', 'article', 'map', 'booking']);
let linkCount = 0;
/**
 * **주석을 걷어내고 본다.** 실행되지 않는 글은 검사할 것이 아니다.
 * 후보 하나를 빼면서 되살릴 값을 주석으로 남겼더니, 그 안의 JSON 조각이
 * 줄마다 `--` 를 달고 있어 「올바른 JSON 이 아니다」로 잡혔다.
 * 지운 값을 왜 지웠는지 적어 두는 것은 좋은 습관인데, 검사가 그걸 막으면 안 된다.
 */
const liveSeed = seed
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/^\s*--.*$/gm, '');
for (const m of liveSeed.matchAll(/'(\[[\s\S]*?\])'::jsonb/g)) {
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

/* ── 8. 같은 전시의 여는 시간이 두 군데서 다르면 안 된다 ──────
 *
 * 설문 후보와 보드는 **같은 전시를 각자 적는다.** 서로 베끼지 않으므로
 * 한쪽만 고치면 조용히 어긋난다. 실제로 그랬다 — 《세 번째 시》 토요일이
 * 설문은 09:30~20:00, 보드는 10:00~19:00 이었다 (2026-08-22 에 잡아 고쳤다).
 * 보고 간 사람이 문 닫힌 앞에 서게 되는 종류의 오류다.
 *
 * 글자를 통째로 비교하지는 않는다 — `화-금·일 …, 토 …` 와 `화~금·일 … / 토 …` 는
 * 구분자만 다르지 같은 말이다. 대신 **시각 구간만 뽑아서 견준다.**
 * 그래야 문장 다듬기에는 안 걸리고 시간이 달라질 때만 걸린다.
 */
const boardRows = read('202608190001b_rows.sql');
const TIME_RANGE = /(\d{1,2}):(\d{2})\s*[-~–]\s*(\d{1,2}):(\d{2})/g;
const spansOf = (text) => {
  const out = new Set();
  for (const m of (text ?? '').matchAll(TIME_RANGE)) {
    out.add(`${m[1].padStart(2, '0')}:${m[2]}-${m[3].padStart(2, '0')}:${m[4]}`);
  }
  return [...out].sort().join(', ');
};

/** 보드의 update 문에서 제목별 운영시간을 거둔다 — `"time" = '…' … where title = '…'` */
const boardHours = new Map();
for (const m of boardRows.matchAll(/"time"\s*=\s*'([^']*)'[\s\S]*?where title = '([^']*)'/g)) {
  boardHours.set(m[2], m[1]);
}
if (!boardHours.size) fail('보드 줄에서 운영시간을 하나도 못 읽었다 — 검사가 헛돈다');

let hoursChecked = 0;
const hoursSkipped = [];
for (const block of liveSeed.matchAll(/insert into public\.survey_options[\s\S]*?\n\)/g)) {
  // 제목이 꼭 《 로 시작하지는 않는다 — 「솔 르윗 개인전 《Sol LeWitt: …》」 처럼
  // 앞에 말이 붙기도 한다. 옛 규칙은 그런 후보를 조용히 건너뛰어서, 견주지도 않고
  // 「건너뜀」 에도 안 세었다 — 통과로 보이지만 아무것도 안 본 것이다.
  const t = block[0].match(/'([^']*《[^']*》[^']*)'/);
  if (!t) continue;                      // 전시 아닌 후보(식당 등)는 제목 모양이 다르다
  const onBoard = boardHours.get(t[1]);
  if (onBoard === undefined) { hoursSkipped.push(`${t[1]} — 보드에 없다`); continue; }
  const a = spansOf(block[0]);
  const b = spansOf(onBoard);
  // 한쪽이 시간을 안 적었으면 어긋난 것이 아니다 — 덜 적은 것뿐이다
  if (!a || !b) { hoursSkipped.push(`${t[1]} — 한쪽에 시간이 없다`); continue; }
  hoursChecked += 1;
  if (a !== b) {
    fail(`${t[1]} 의 여는 시간이 설문과 보드에서 다르다 — 설문 [${a}] · 보드 [${b}]`);
  }
}

/* ── 9. 검사 밖에 남은 마이그레이션이 없는가 ─────────────────
 *
 * 이 검사기는 읽을 파일을 **손으로 들고 있다.** 그래서 새 마이그레이션을 넣어도
 * 아무 말 없이 지나간다 — 실제로 202608240001a(익명 투표)를 넣었을 때
 * 함수 규칙(search_path·security definer·grant·컬럼 이름)이 하나도 안 걸렸다.
 *
 * 안 보는 파일이 있는 것 자체는 괜찮다. 자료만 넣는 파일도 있고 다른 검사기가
 * 보는 파일도 있다. 다만 **왜 안 보는지 적혀 있어야** 한다.
 * 적어 두지 않은 채로 빠지는 것이 위험하다.
 */
const ALL_SQL = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();

/** 일부러 안 보는 것 — 왜 안 보는지 함께 적는다. */
const NOT_CHECKED = new Map([
  ['202608190001a_columns.sql', '보드 표 — scripts/validate-supabase-readonly.mjs 가 본다'],
  ['202608190001b_rows.sql', '보드 자료 — 아래 시간 대조에서 따로 읽는다'],
  ['202608210001b_meal_survey.sql', '자료만 넣는다 (함수·표 없음)'],
  ['202608210001c_survey_links.sql', '자료만 넣는다 (함수·표 없음)'],
  ['202608240001b_september_poll.sql', '자료만 넣는다 (함수·표 없음)'],
  ['202608240001c_forget_names.sql', '옛 응답의 이름을 지우는 한 번짜리 (함수·표 없음)'],
  ['202608240002a_culture_content_refresh.sql', '보드 추천 자료만 갱신한다 (함수·표 없음)'],
  ['202608260001a_september_date_poll.sql', '자료만 넣는다 (함수·표 없음)'],
]);

const unseen = ALL_SQL.filter((f) => !READ_FILES.has(f) && !NOT_CHECKED.has(f));
if (unseen.length) {
  fail(`검사기가 안 보는 마이그레이션이 있다: ${unseen.join(', ')} `
    + '— 함수 규칙을 걸려면 위 read() 목록에 넣고, 일부러 안 볼 것이면 '
    + 'NOT_CHECKED 에 이유와 함께 적는다');
}
/** 지워진 파일이 목록에 남아 있으면 그것도 거짓말이다. */
const ghosts = [...NOT_CHECKED.keys()].filter((f) => !ALL_SQL.includes(f));
if (ghosts.length) {
  fail(`NOT_CHECKED 에 없는 파일이 적혀 있다: ${ghosts.join(', ')}`);
}

/* ── 알리기 ──────────────────────────────────────────────── */

if (fails.length) {
  console.log(`설문 스키마 검사 실패 — ${fails.length}건\n`);
  fails.forEach((f) => console.log(`  · ${f}`));
  process.exit(1);
}
console.log(`설문 스키마 검사 통과 — 잠근 표 ${LOCKED.length} · 공개 표 ${OPEN.length} `
  + `· anon 이 부르는 함수 ${CALLABLE.length} · 후보 링크 ${linkCount}`
  + ` · 보드와 시간 대조 ${hoursChecked}건`
  + (hoursSkipped.length
    ? `\n  건너뜀 ${hoursSkipped.length}건 — ${hoursSkipped.join(' · ')}`
    : ''));
