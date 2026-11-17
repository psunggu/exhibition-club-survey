#!/usr/bin/env node
/**
 * validate-secrets.mjs — API 키 · 토큰 · 암호가 저장소로 들어오는지 본다 (2026-11-17).
 *
 *   node scripts/validate-secrets.mjs                  작업 폴더(추적 + 아직 커밋 안 한 새 파일) — check:quick · CI
 *   node scripts/validate-secrets.mjs --staged         커밋하려고 올려 둔 것 — .githooks/pre-commit
 *   node scripts/validate-secrets.mjs --range <rev…>   그 커밋들이 새로 들이는 파일 — .githooks/pre-push · CI
 *   node scripts/validate-secrets.mjs --history        기록 전체(가끔 손으로 — `npm run check:secrets -- --history`)
 *
 * 이 저장소는 공개다. 한 번 푸시된 키는 커밋을 지워도 남는다 — 그래서 **나가기 전에** 잡는다.
 * 걸렸는데 이미 푸시된 값이면 지우기 전에 **그 키부터 폐기 · 재발급**한다(docs/OPERATIONS.md 6번).
 *
 * 찾은 값은 앞 네 글자와 길이만 찍는다 — CI 로그도 공개다.
 * 개인정보(실명 · 대화 원문)는 validate-repository-hygiene 이 본다. 여기는 비밀값만.
 * 어느 모드든 먼저 규칙을 스스로 시험한다 — 규칙이 고장 나 「0건」 이 되는 것을 통과로 읽지 않으려고.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';

const MAX_BYTES = 2_000_000;
/** 같은 줄에 이 표시가 있으면 넘긴다. 통과 줄에 몇 곳인지 찍으니 PR 에서 새로 생긴 것이 보인다. */
const ALLOW_MARK = 'secret-scan:allow';
/**
 * 기록에 이미 나가 있고 사람이 확인해 둔 값 — 값이 아니라 sha256 만 적는다. 기록 검사(--history)에서만 넘긴다.
 * 매번 같은 실패가 뜨면 그 검사를 대충 보게 된다. 새로 더할 때는 무엇을 확인했는지 함께 적는다.
 */
const ACKNOWLEDGED = new Map([
  ['0d9b02f344bebd956b5b84cf9520d92f2eec37dffb739d68fa5930f188359a07', '2026-11-17 옛 사이트(7~8월)의 전시 목록 시트 주소 — 로그인 없이는 열리지 않는다(401)'],
]);
const git = (args, opt = {}) => execFileSync('git', args, { maxBuffer: 1 << 30, ...opt });

/* ── 규칙 ───────────────────────────────────────────── */
const PLACEHOLDER = /^(?:x+|\*+|\.+|0+|your[_-].*|.*(?:example|placeholder|changeme|dummy|sample|redacted|여기에).*)$/i;
const classes = (v) => [/[a-z]/, /[A-Z]/, /\d/].filter((re) => re.test(v)).length;
const looksRandom = (v) => !PLACEHOLDER.test(v) && classes(v) >= 2 && new Set(v).size >= 8;
/** 값 칸(마지막 괄호)을 꺼내 판정한다. 규칙에 판정 함수가 없으면 일치 자체가 발견이다. */
const RULES = [
  ['개인 키(private key)', /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/g],
  ['AWS 액세스 키', /(?<![A-Z0-9])(?:AKIA|ASIA)[0-9A-Z]{16}(?![A-Z0-9])/g],
  ['AWS 비밀 키', /aws_secret_access_key["']?\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})(?![A-Za-z0-9/+=])/gi],
  ['Google API 키', /(?<![A-Za-z0-9_-])AIza[0-9A-Za-z_-]{35}(?![A-Za-z0-9_-])/g],
  ['Google OAuth 비밀값', /(?<![A-Za-z0-9_-])GOCSPX-[A-Za-z0-9_-]{28,}/g],
  ['Google 서비스 계정 키 파일', /"type"\s*:\s*"service_account"/g],
  ['GitHub 토큰', /(?<![A-Za-z0-9_])(?:github_pat_[A-Za-z0-9_]{22,}|gh[pousr]_[A-Za-z0-9]{36,})/g],
  ['Slack 토큰', /(?<![A-Za-z0-9])xox[abeoprs]-[A-Za-z0-9-]{10,}/g],
  ['Slack · Discord 웹훅 주소', /https:\/\/(?:hooks\.slack\.com\/services\/[A-Za-z0-9/]{20,}|(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]{20,})/g],
  // 소문자 낱말을 하이픈으로 이은 것(CSS 클래스 · 슬러그)은 키가 아니다 — 숫자와 대문자가 함께 있어야 한다
  ['Anthropic · OpenAI API 키', /(?<![A-Za-z0-9_-])sk-(?:ant-|proj-|svcacct-)?([A-Za-z0-9_-]{20,})/g, (v) => /\d/.test(v) && /[A-Z]/.test(v)],
  ['Stripe 비밀 키', /(?<![A-Za-z0-9])[sr]k_live_[A-Za-z0-9]{16,}/g],
  ['npm 토큰', /(?<![A-Za-z0-9_])npm_[A-Za-z0-9]{36}(?![A-Za-z0-9])/g],
  ['npm 인증 줄(_authToken)', /_authToken\s*=\s*(?!\$\{)([^\s$]{8,})/g, (v) => !PLACEHOLDER.test(v)],
  ['Supabase 비밀 키', /(?<![A-Za-z0-9_])sb_secret_[A-Za-z0-9_-]{12,}/g],
  ['Supabase 액세스 토큰', /(?<![A-Za-z0-9_])sbp_(?:v\d+_)?[A-Za-z0-9_-]{20,}/g],
  ['Telegram 봇 토큰', /(?<![A-Za-z0-9])\d{8,12}:[A-Za-z0-9_-]{30,}/g],
  ['카카오 API 키', /KakaoAK\s+[0-9a-f]{32}(?![0-9a-f])/gi],
  // KOPIS(?service=) · KOBIS(?key=) · 공공데이터포털(?serviceKey=) 인증키가 주소에 실린 꼴
  ['주소에 실린 API 키(?key= · ?service= …)', /[?&](?:service|servicekey|key|apikey|api_key|access_token|token|secret|client_secret)=([A-Za-z0-9%+/_.-]{16,})/gi, looksRandom],
  ['주소에 실린 계정 · 암호(user:pass@)', /[a-z][a-z0-9+.-]*:\/\/[^\s/:@'"`]+:([^\s/@'"`]{3,})@[^\s/'"`]+/gi, (v) => !PLACEHOLDER.test(v) && !/^[[<{$]/.test(v)],
  ['Authorization 머리글에 적은 토큰', /authorization["']?\s*[:=]\s*["'`](?:Bearer|Basic|KakaoAK)\s+([A-Za-z0-9+/=_.-]{16,})["'`]/gi, (v) => !PLACEHOLDER.test(v)],
  // 이름이 암호 쪽이면 낮은 무작위도라도 잡는다(사람이 지은 암호). 한글이 섞인 값은 안내 문구로 본다
  ['암호를 값으로 적은 줄', /(?<![A-Za-z0-9])[A-Za-z0-9_.-]*(?:passw(?:or)?d|pwd)[A-Za-z0-9_-]*["'`]?\s*(?::|=>?)\s*["'`]([^"'`\s]{8,})["'`]/gi, (v) => !PLACEHOLDER.test(v) && !/[가-힣]/.test(v) && !/^[[<{$]/.test(v)],
  ['키 · 토큰을 값으로 적은 줄', /(?<![A-Za-z0-9])[A-Za-z0-9_.-]*(?:api[_-]?key|secret|token|credential|private[_-]?key|access[_-]?key|auth[_-]?key|service[_-]?key)[A-Za-z0-9_-]*["'`]?\s*(?::|=>?)\s*["'`]([A-Za-z0-9+/=_.-]{16,})["'`]/gi, looksRandom],
  // 폼 편집 · 응답 시트 주소(AGENTS.md — 어디에도 적지 않는다). 회원용 응답 링크(/forms/d/e/…/viewform)는 뺀다
  ['구글 문서 편집 주소', /docs\.google\.com\/(?:forms|spreadsheets|document)\/d\/(?!e\/)[A-Za-z0-9_-]{25,}/g],
];
const BLOCKED_NAMES = [
  [/^\.env(?:\..+)?$/i, (n) => n !== '.env.example'],
  [/\.(?:pem|p12|pfx|key|keystore|jks)$/i], [/^id_(?:rsa|dsa|ecdsa|ed25519)$/], [/^\.netrc$/],
  [/^(?:secrets?|credentials?)\.(?:json|ya?ml|txt)$/i], [/^service[-_]?account.*\.json$/i],
  [/^config\.local\.json$/i], [/^service_role/i],
];
const mask = (v) => (v.length < 8 ? `(${v.length}자)` : `${v.slice(0, 4)}…(${v.length}자)`);
const jwtRole = (token) => {
  try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).role ?? ''; } catch { return null; }
};

/** 한 파일을 훑어 `{ line, label, shown, value }` 을 낸다. `value` 는 묶는 데만 쓰고 찍지 않는다. */
function scan(name, text) {
  const found = []; let allowed = 0;
  const base = name.split('/').at(-1);
  if (BLOCKED_NAMES.some(([re, ok]) => re.test(base) && (!ok || ok(base)))) found.push({ line: 0, label: '저장소에 두지 않는 파일 이름', shown: '', value: base });
  const lineAt = (i) => text.slice(0, i).split('\n').length;
  const add = (i, label, value) => {
    const start = text.lastIndexOf('\n', i - 1) + 1; const end = text.indexOf('\n', i);
    if (text.slice(start, end < 0 ? undefined : end).includes(ALLOW_MARK)) { allowed += 1; return; }
    found.push({ line: lineAt(i), label, shown: mask(value), value });
  };
  for (const [label, re, judge] of RULES) {
    for (const m of text.matchAll(re)) {
      const value = m[1] ?? m[0];
      if (!judge || judge(value)) add(m.index, label, value);
    }
  }
  // JWT — anon 은 번들에 실려 나가는 공개 값이다. 그 밖의 역할(service_role · authenticated)과 역할 없는 토큰은 비밀이다
  for (const m of text.matchAll(/(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g)) {
    const role = jwtRole(m[0]);
    if (role !== null && role !== 'anon') add(m.index, role === 'service_role' ? 'Supabase service_role 키' : 'JWT(로그인 · 서비스 토큰)', m[0]);
  }
  return { found, allowed };
}

/* ── 규칙이 실제로 잡는지 — 견본은 조각을 이어 만든다(이 파일이 스스로 걸리지 않게) ── */
function selfTest() {
  const r = (n, s = 'aB3dE5gH7jK9mN1pQ') => s.repeat(Math.ceil(n / s.length)).slice(0, n);
  const jwt = (role) => ['eyJ' + r(20), Buffer.from(JSON.stringify(role ? { role } : { sub: 'u' })).toString('base64url'), r(24)].join('.');
  const must = [
    '-----BEGIN ' + 'OPENSSH PRIVATE KEY-----', 'AKIA' + 'ABCDEFGHIJ234567', 'AIza' + r(35), 'gh' + 'p_' + r(36), 'github_' + 'pat_' + r(30),
    'xox' + 'b-' + r(24), 'sk-' + 'ant-' + r(40), 'sk-' + r(40), 'sk_' + 'live_' + r(24), 'npm' + '_' + r(36), 'sb_' + 'secret_' + r(24), 'sbp' + '_' + r(40),
    '123456789:' + r(35), 'KakaoAK ' + '0123456789abcdef'.repeat(2), 'https://x.test/a?service=' + '0f1e2d3c4b5a6978'.repeat(2), 'https://x.test/a?serviceKey=' + r(40),
    'postgres://admin:' + 'Hunter2secret' + '@db.x.test:5432/app', 'authorization: "Bearer ' + r(30) + '"', 'const admin_pass' + 'word = "' + 'club2026go' + '"',
    'KOPIS_API_' + 'KEY = "' + '0f1e2d3c4b5a6978'.repeat(2) + '"', '{ "client_' + 'secret": "' + r(24) + '" }', '"type": ' + '"service_account"',
    'https://docs.google.com/' + 'spreadsheets/d/' + r(44) + '/edit', jwt('service_role'), jwt('authenticated'), jwt(''),
  ];
  const mustNot = [
    jwt('anon'), '.sk' + '-skeleton-loading-placeholder-row', 'password: "여기에_암호를_적는다"', 'api_key = "YOUR_API_KEY_GOES_HERE"', 'const token = process.env.KOPIS_KEY',
    'https://kopis.or.kr/_next/image?url=%2Fupload%2FpfmPoster%2FPF_PF302842_261008_143949.jpg&w=256&q=75', 'postgresql://postgres:[YOUR-PASSWORD]@db.x.supabase.co',
    'https://docs.google.com/forms/d/e/' + r(56) + '/viewform', 'authorization: `Bearer ${key}`', 'where a.password_hash = crypt(coalesce(p_password, \'\'), a.password_hash)',
    'gh' + 'p_' + r(36) + ' // ' + ALLOW_MARK,
  ];
  const bad = [
    ...must.filter((s) => !scan('x.txt', s).found.length).map((s) => `못 잡음: ${s.slice(0, 12)}…`),
    ...mustNot.filter((s) => scan('x.txt', s).found.length).map((s) => `잘못 잡음: ${s.slice(0, 24)}…`),
    ...['.env', '.env.local', 'deploy.pem', 'kopis.key', 'id_ed25519', 'config.local.json', 'secrets.json'].filter((n) => !scan(n, '').found.length).map((n) => `파일 이름 못 잡음: ${n}`),
    ...['.env.example', 'keyboard.ts', 'README.md'].filter((n) => scan(n, '').found.length).map((n) => `파일 이름 잘못 잡음: ${n}`),
  ];
  if (bad.length) { console.error(`비밀값 검사의 규칙이 고장 났다 — 아무것도 통과시키지 않는다\n  · ${bad.join('\n  · ')}`); process.exit(1); }
  return must.length + mustNot.length;
}

/* ── 어디를 볼지 ─────────────────────────────────────── */
const args = process.argv.slice(2);
const mode = args[0] ?? '';
const readable = (buf) => buf.length <= MAX_BYTES && !buf.includes(0);
const names = (a) => git(a, { encoding: 'utf8' }).split('\0').filter(Boolean);

/** 커밋 범위가 새로 들이는 파일(blob)을 한 번씩 — 지웠다가 다시 넣은 것, 중간 커밋에만 있던 것까지. */
function blobsOf(revs) {
  const safe = revs.every((a) => a === '--not' || a === '--all' || a === '--remotes' || /^--remotes=[\w.-]+$/.test(a) || /^[\w./^~@{}-]+$/.test(a) && !a.startsWith('-'));
  if (!revs.length || !safe) { console.error('쓰는 법: --range <커밋 범위>  (예: origin/main..HEAD)'); process.exit(2); }
  const objects = git(['rev-list', '--objects', ...revs], { encoding: 'utf8' }).split('\n').filter(Boolean).map((l) => [l.slice(0, l.indexOf(' ') < 0 ? undefined : l.indexOf(' ')), l.indexOf(' ') < 0 ? '' : l.slice(l.indexOf(' ') + 1)]);
  if (!objects.length) return [];
  const path = new Map(objects);
  const out = git(['cat-file', '--batch'], { input: objects.map(([sha]) => sha).join('\n') + '\n' });
  const files = [];
  for (let i = 0; i < out.length;) {
    const nl = out.indexOf(10, i);
    const [sha, type, size] = out.subarray(i, nl).toString('utf8').split(' ');
    if (type === 'missing' || !size) { i = nl + 1; continue; }   // 얕게 받은 저장소에 없는 것
    const body = out.subarray(nl + 1, nl + 1 + Number(size));
    i = nl + 1 + Number(size) + 1;
    if (type === 'blob') files.push({ name: path.get(sha) || sha, sha, buf: body });
  }
  return files;
}

const tested = selfTest();
let files; let what;
if (mode === '--staged') {
  files = names(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']).map((name) => ({ name, buf: git(['show', `:${name}`]) }));
  what = '커밋하려는 파일';
} else if (mode === '--range' || mode === '--history') {
  files = blobsOf(mode === '--history' ? ['--all'] : args.slice(1));
  what = mode === '--history' ? '기록 전체의 파일' : '올리려는 커밋의 파일';
} else if (!mode) {
  files = [...new Set([...names(['ls-files', '-z']), ...names(['ls-files', '-z', '--others', '--exclude-standard'])])]
    .filter((name) => fs.existsSync(name)).map((name) => ({ name, buf: fs.readFileSync(name) }));
  what = '작업 폴더 파일';
} else {
  console.error('쓰는 법: node scripts/validate-secrets.mjs [--staged | --range <커밋 범위> | --history]');
  process.exit(2);
}

// 기록을 볼 때는 같은 값을 한 줄로 묶는다 — 한 번 적힌 값이 그 파일의 판마다 다시 나온다
const groups = new Map(); let allowed = 0; const known = new Set();
for (const f of files) {
  const res = scan(f.name, readable(f.buf) ? f.buf.toString('utf8') : '');
  allowed += res.allowed;
  for (const hit of res.found) {
    const digest = createHash('sha256').update(hit.value).digest('hex');
    if (mode === '--history' && ACKNOWLEDGED.has(digest)) { known.add(digest); continue; }
    const key = mode === '--history' ? `${hit.label}\0${hit.value}` : `${f.name}\0${hit.line}\0${hit.label}\0${groups.size}`;
    groups.set(key, { hit, f, count: (groups.get(key)?.count ?? 0) + 1 });   // rev-list 는 새 것부터 낸다 — 마지막이 가장 오래된 판
  }
}
const problems = [...groups.values()].map(({ hit, f, count }) => {
  // 그 값이 처음 들어온 커밋을 함께 적는다 — 무엇을 폐기해야 하는지 찾을 수 있게
  const since = mode === '--history' ? ` · 처음 ${git(['log', '--all', '--format=%h %cs', `--find-object=${f.sha}`], { encoding: 'utf8' }).trim().split('\n').at(-1)}${count > 1 ? ` · 같은 값이 ${count}개 판에` : ''}` : '';
  return `${f.name}${hit.line ? `:${hit.line}` : ''} — ${hit.label}${hit.shown ? ` ${hit.shown}` : ''}${since}`;
});
if (problems.length) {
  console.error(`비밀값 검사 실패 — ${what} ${files.length}개에서 ${problems.length}건\n\n  · ${problems.join('\n  · ')}\n\n`
    + '  값을 저장소 밖(~/.config/… · 600)으로 옮긴다. 이미 푸시된 값이면 지우기 전에 그 키부터 폐기 · 재발급한다(docs/OPERATIONS.md 6번).\n'
    + `  키가 아닌데 걸렸으면 그 줄에 「${ALLOW_MARK}」 를 적고 PR 에서 사람이 본다.\n`);
  process.exit(1);
}
console.log(`비밀값 검사 통과 — ${what} ${files.length}개 · 규칙 ${RULES.length + 2}가지(견본 ${tested}개로 시험)${allowed ? ` · 허용 표시 ${allowed}곳` : ''}${known.size ? ` · 확인해 둔 옛 값 ${known.size}건` : ''}`);
