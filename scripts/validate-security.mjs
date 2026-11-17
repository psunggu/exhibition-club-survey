#!/usr/bin/env node
/**
 * validate-security.mjs — 보안 설정이 느슨해지지 않았는지 본다 (2026-11-17).
 *
 *   node scripts/validate-security.mjs                    저장소 안의 것만 — check:quick · CI
 *   node scripts/validate-security.mjs --audit --github   여기에 npm 취약점 · GitHub 저장소 설정(네트워크 — `npm run check:security`)
 *
 * 다른 검사기가 보는 것은 다시 보지 않는다 — 빌드 결과의 인라인 · 바깥 호출(validate-csp-build),
 * img-src(validate-board-data), DB 읽기 전용 경계(validate-supabase-readonly), 비밀값(validate-secrets).
 *
 * 보는 것
 *   · 워크플로 — 권한 최소 · pull_request_target 없음 · run 줄에 바깥 입력을 끼우지 않음 · 액션 버전 고정
 *   · 화면 코드 — HTML 을 글자로 끼워 넣는 길(innerHTML · eval …) · 새 창 링크의 noopener
 *   · CSP 문구 — 페이지마다 script-src 가 'self' 뿐인지, 넓은 출처가 없는지
 *   · 스크립트 — 인증서 검사 끄기 · 내려받아 바로 실행 · 모든 네트워크에 여는 서버
 *   · .gitignore — 키 · 환경 파일을 막는 그물이 그대로인지
 * 네트워크를 쓰는 두 가지(--audit · --github)는 알리기만 하고 실패로 치지 않는다 — 바깥 사정으로 무인 배치가 멈추면 안 된다.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT);
const SELF = 'scripts/validate-security.mjs';
const read = (p) => fs.readFileSync(p, 'utf8');
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 });
const tracked = (...dirs) => [...new Set(['ls-files -z', 'ls-files -z --others --exclude-standard']
  .flatMap((a) => run('git', [...a.split(' '), '--', ...dirs]).split('\0')))].filter((f) => f && f !== SELF && fs.existsSync(f));
const problems = [];
const fail = (m) => { if (!problems.includes(m)) problems.push(m); };
const lineOf = (text, i) => text.slice(0, i).split('\n').length;

/* ── 워크플로 ────────────────────────────────────────── */
const WRITE_OK = new Set(['pages', 'id-token']);          // Pages 배포에 필요한 둘뿐
const workflows = tracked('.github/workflows').filter((f) => /\.ya?ml$/.test(f));
for (const f of workflows) {
  const text = read(f); const lines = text.split('\n');
  if (!/^permissions:/m.test(text)) fail(`${f}: 맨 위에 permissions 가 없다 — 없으면 토큰이 넓은 기본 권한을 받는다`);
  if (/pull_request_target/.test(text)) fail(`${f}: pull_request_target — 남의 PR 코드가 저장소 권한으로 돈다`);
  if (/write-all/.test(text)) fail(`${f}: permissions: write-all`);
  for (const m of text.matchAll(/^\s+([a-z-]+):\s*write\s*$/gm)) if (!WRITE_OK.has(m[1])) fail(`${f}:${lineOf(text, m.index)}: ${m[1]}: write — 쓰기 권한을 더하는 변경은 사람이 본다`);
  for (const m of text.matchAll(/uses:\s*(\S+)/g)) {
    const [name, ref = ''] = m[1].split('@');
    if (!ref || /^(?:main|master|latest|HEAD)$/.test(ref)) fail(`${f}:${lineOf(text, m.index)}: ${m[1]} — 버전을 고정한다`);
    else if (!/^(?:actions|github)\//.test(name) && !/^[0-9a-f]{40}$/.test(ref)) fail(`${f}:${lineOf(text, m.index)}: ${m[1]} — GitHub 것이 아닌 액션은 커밋 해시로 고정한다`);
    if (/^actions\/checkout$/.test(name) && !/persist-credentials:\s*false/.test(lines.slice(lineOf(text, m.index), lineOf(text, m.index) + 4).join('\n'))) fail(`${f}:${lineOf(text, m.index)}: checkout 에 persist-credentials: false 가 없다`);
  }
  // run 줄 안의 ${{ github.event… }} 는 PR 제목 · 브랜치 이름이 그대로 셸 명령이 된다
  lines.forEach((line, i) => {
    const m = /^(\s*)(?:- )?run:\s*(.*)$/.exec(line);
    if (!m) return;
    const indent = m[1].length + (line.includes('- run:') ? 2 : 0);
    const body = [m[2]];
    for (let j = i + 1; j < lines.length && (!lines[j].trim() || lines[j].search(/\S/) > indent); j += 1) body.push(lines[j]);
    if (/\$\{\{[^}]*(?:github\.event\.|github\.head_ref|github\.ref_name|inputs\.)/.test(body.join('\n'))) fail(`${f}:${i + 1}: run 줄에 바깥 입력(\${{ github.event… }})을 끼웠다 — env 로 받아 쓴다`);
  });
}

/* ── 화면 코드 ───────────────────────────────────────── */
const UNSAFE = [
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/g], ['eval()', /\beval\s*\(/g], ['new Function()', /new\s+Function\s*\(/g],
  ['innerHTML · outerHTML 에 쓰기', /\.(?:inner|outer)HTML\s*\+?=/g], ['document.write', /document\.write(?:ln)?\s*\(/g], ['insertAdjacentHTML', /insertAdjacentHTML/g],
  ['글자를 코드로 돌리는 타이머', /set(?:Timeout|Interval)\(\s*['"`]/g], ['javascript: 주소', /(?:href|src|action)\s*=\s*\{?\s*['"`]\s*javascript:/gi],
];
const appFiles = tracked('app').filter((f) => /\.(?:tsx?|jsx?|html|gs)$/.test(f));
for (const f of appFiles) {
  const text = read(f);
  for (const [label, re] of UNSAFE) for (const m of text.matchAll(re)) fail(`${f}:${lineOf(text, m.index)}: ${label} — 글자가 코드로 돈다. React 가 그리게 둔다`);
  for (const m of text.matchAll(/window\.open\s*\(/g)) if (!/noopener/.test(text.slice(m.index, text.indexOf('\n', m.index)))) fail(`${f}:${lineOf(text, m.index)}: window.open 에 noopener 가 없다`);
  // 새 창 링크 — 그 태그 안에 noopener 가 있어야 한다(열린 쪽이 window.opener 로 이 화면을 바꿀 수 있다)
  for (const m of text.matchAll(/target=["']_blank["']/g)) {
    const start = text.lastIndexOf('<', m.index);
    let end = m.index; do { end = text.indexOf('>', end + 1); } while (end > 0 && text[end - 1] === '=');
    if (!/noopener/.test(text.slice(start, end < 0 ? undefined : end))) fail(`${f}:${lineOf(text, m.index)}: target="_blank" 인데 rel 에 noopener 가 없다`);
  }
}

/* ── CSP 문구 ────────────────────────────────────────── */
const WIDE = /^(?:\*|https?:|data:|blob:|'unsafe-inline'|'unsafe-eval'|'unsafe-hashes'|'strict-dynamic')$/;
const pages = ['app/index.html', ...tracked('app/public').filter((f) => f.endsWith('.html'))];
for (const f of pages) {
  const csp = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i.exec(read(f))?.[1];
  if (!csp) { fail(`${f}: CSP meta 가 없다`); continue; }
  const dir = Object.fromEntries(csp.split(';').map((d) => d.trim().split(/\s+/)).filter((d) => d[0]).map(([k, ...v]) => [k, v]));
  for (const k of ['default-src', 'script-src']) if ((dir[k] ?? []).join(' ') !== "'self'") fail(`${f}: ${k} 가 'self' 하나가 아니다 — ${(dir[k] ?? ['없음']).join(' ')}`);
  for (const k of ['object-src', 'base-uri']) if ((dir[k] ?? []).join(' ') !== "'none'") fail(`${f}: ${k} 'none' 이 빠졌다`);
  for (const [k, v] of Object.entries(dir)) {
    for (const src of v) {
      if (WIDE.test(src) && !(k === 'img-src' && src === 'data:')) fail(`${f}: ${k} 에 넓은 출처 「${src}」`);
      if (src.includes('*') && !(k === 'connect-src' && src === 'https://*.supabase.co')) fail(`${f}: ${k} 에 와일드카드 「${src}」`);
      if (/^http:/.test(src)) fail(`${f}: ${k} 에 http 출처 「${src}」`);
    }
  }
}

/* ── 스크립트 · 훅 ───────────────────────────────────── */
const RISKY = [
  ['인증서 검사를 끈다', /reject[U]nauthorized\s*:\s*false|NODE_TLS_REJECT_[U]NAUTHORIZED|\bcurl\b[^\n|]*\s(?:-k|--insecure)\b/g],
  ['내려받아 바로 실행한다', /\b(?:curl|wget)\b[^\n]*\|\s*(?:sudo\s+)?(?:ba|z)?sh\b/g],
  ['모든 네트워크에 여는 서버', /0\.0\.0\.0|\bhost:\s*true\b/g],
];
for (const f of tracked('scripts', '.claude/hooks', '.githooks', '.github/workflows', 'vite.config.ts', 'package.json')) {
  // 주석 줄은 비운다 — 「전에는 이랬다」 를 적은 설명이 걸린다(줄 번호는 그대로)
  const text = read(f).split('\n').map((l) => (/^\s*(?:\/\/|\/?\*|#)/.test(l) ? '' : l)).join('\n');
  for (const [label, re] of RISKY) for (const m of text.matchAll(re)) fail(`${f}:${lineOf(text, m.index)}: ${label}`);
  if (f !== 'scripts/static-server.mjs' && /\bcreate[S]erver\s*\(/.test(text)) fail(`${f}: 서버를 따로 띄운다 — scripts/static-server.mjs 의 serveStatic 만 쓴다(127.0.0.1 에만 열린다)`);
}

/* ── .gitignore 그물 ─────────────────────────────────── */
const PROBES = ['.env', '.env.local', 'config.local.json', 'x.pem', 'x.key', 'x.p12', 'x.pfx', 'secrets.json', 'service_role.txt'];
let ignored = '';
try { ignored = run('git', ['check-ignore', ...PROBES]); } catch (err) { ignored = String(err.stdout ?? ''); }
for (const p of PROBES) if (!ignored.split('\n').includes(p)) fail(`.gitignore: 「${p}」 꼴을 더는 막지 않는다 — 키 · 환경 파일 규칙을 지우지 않는다`);

/* ── 바깥 사정 (알리기만) ────────────────────────────── */
const notes = [];
if (process.argv.includes('--audit')) {
  try {
    let out = '';
    try { out = run('npm', ['audit', '--json']); } catch (err) { out = String(err.stdout ?? ''); }   // 취약점이 있으면 npm 이 1로 끝난다
    const { metadata, vulnerabilities = {} } = JSON.parse(out);
    const v = metadata.vulnerabilities;
    const serious = Object.values(vulnerabilities).filter((x) => ['high', 'critical'].includes(x.severity)).map((x) => `${x.name}(${x.severity}${x.isDirect ? '' : ' · 간접'})`);
    notes.push(`${serious.length ? '⚠' : '✓'} npm 취약점 — 치명 ${v.critical} · 높음 ${v.high} · 중간 ${v.moderate} · 낮음 ${v.low}${serious.length ? ` — ${serious.join(', ')} → npm audit fix 를 PR 로` : ''}`);
  } catch (err) { notes.push(`⚠ npm 취약점 — 확인하지 못했다(${String(err.message).slice(0, 60)})`); }
}
if (process.argv.includes('--github')) {
  const repo = /github\.com[:/]([^/]+\/[^/.\s]+)/.exec(run('git', ['remote', 'get-url', 'origin']))?.[1];
  const api = (p) => JSON.parse(run('gh', ['api', `repos/${repo}${p}`]));
  const on = (label, ok, how) => notes.push(`${ok ? '✓' : '⚠'} ${label} — ${ok ? '켜짐' : `꺼짐 → ${how}`}`);
  try {
    const sa = api('').security_and_analysis ?? {};
    on('GitHub 비밀값 스캔', sa.secret_scanning?.status === 'enabled', 'Settings → Advanced Security');
    on('GitHub 푸시 보호(알려진 키 꼴은 서버가 거절)', sa.secret_scanning_push_protection?.status === 'enabled', 'Settings → Advanced Security');
    let alerts = true; try { run('gh', ['api', `repos/${repo}/vulnerability-alerts`]); } catch { alerts = false; }
    on('Dependabot 취약점 알림', alerts, 'Settings → Advanced Security → Dependabot alerts');
    const rules = api('/rulesets').filter((r) => r.enforcement === 'active' && r.target === 'branch').length;
    on('main 보호 규칙(ruleset)', rules > 0, 'Settings → Rules');
  } catch (err) { notes.push(`⚠ GitHub 설정 — 확인하지 못했다(gh 로그인 필요: ${String(err.message).split('\n')[0].slice(0, 60)})`); }
  let hooks = ''; try { hooks = run('git', ['config', 'core.hooksPath']).trim(); } catch { /* 안 켜짐 */ }
  on('이 컴퓨터의 커밋 · 푸시 전 비밀값 검사(git 훅)', hooks === '.githooks', 'npm run hooks:install');
}

if (problems.length) {
  console.error(`보안 설정 검사 실패\n\n  · ${problems.join('\n  · ')}\n`);
  process.exit(1);
}
console.log(`보안 설정 검사 통과 — 워크플로 ${workflows.length} · 화면 코드 ${appFiles.length} · CSP ${pages.length}쪽 · .gitignore 그물 ${PROBES.length}`);
if (notes.length) console.log(`\n  ${notes.join('\n  ')}\n`);
