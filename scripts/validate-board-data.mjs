#!/usr/bin/env node
/**
 * validate-board-data.mjs — 보드 자료와 CSP 가 서로 맞는지 본다 (2026-11-14).
 *
 *   node scripts/validate-board-data.mjs          저장소 안의 파일만 (check:quick 에 들어 있다)
 *   node scripts/validate-board-data.mjs --live   여기에 DB `events.image_url` 까지 (네트워크 — /rank 뒤에 손으로)
 *
 * 보드 그림은 남의 서버 주소를 그대로 부른다. 그 호스트가 `app/index.html` 의 CSP `img-src` 에 없으면
 * **빌드도 검사도 통과하고 회원 화면에서만 그림이 빈다**(브라우저 콘솔에만 뜬다). 반대로 `img-src` 를
 * `https:` 처럼 넓게 열면 아무 서버의 그림이나 불러올 수 있게 된다 — 둘 다 여기서 막는다.
 *
 * 보는 것
 *   · CSP img-src — 와일드카드 · 스킴만 적은 출처(`https:`) · http 출처가 없는지
 *   · movies.ts — 포스터 · 스틸컷 주소가 https 이고 호스트가 img-src 에 있는지, 순위가 1부터 차례인지
 *   · performances.ts — 그림을 부르는 호스트가 img-src 에 있는지, 묶음마다 순위 · id · 기간 · 포스터 파일 꼴
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const problems = [];
const fail = (m) => { if (!problems.includes(m)) problems.push(m); };

/* ── CSP ─────────────────────────────────────────────── */
// content="…" 안에 'self' 같은 작은따옴표가 있다 — 큰따옴표까지만 읽는다
const csp = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i.exec(read('app/index.html'))?.[1] ?? '';
const imgSrc = (/(?:^|;)\s*img-src\s+([^;]+)/.exec(csp)?.[1] ?? '').trim().split(/\s+/).filter(Boolean);
if (!imgSrc.length) fail('app/index.html: CSP 에 img-src 가 없다');
const ALLOWED_KEYWORDS = new Set(["'self'", 'data:']);
const hosts = new Set();
for (const src of imgSrc) {
  if (ALLOWED_KEYWORDS.has(src)) continue;
  if (!/^https:\/\/[a-z0-9.-]+$/.test(src)) fail(`img-src: 「${src}」 — https 호스트 하나만 적는다(와일드카드 · 스킴만 · http · 경로 금지)`);
  else hosts.add(src);
}
const inCsp = (url, where) => {
  let origin = '';
  try { const u = new URL(url); origin = u.protocol === 'https:' ? u.origin : ''; } catch { /* 아래에서 잡는다 */ }
  if (!origin) fail(`${where}: https 주소가 아니다 — ${String(url).slice(0, 80)}`);
  else if (!hosts.has(origin)) fail(`${where}: ${origin} 이 CSP img-src 에 없다 — 회원 화면에서 그림이 빈다`);
};

/* ── 영화 (KOBIS) ────────────────────────────────────── */
const movies = read('app/src/data/movies.ts');
// 값을 스킴으로 미리 거르지 않는다 — `//host/…` · `/common/…` 같은 꼴도 여기서 걸려야 한다(빈 값만 건너뛴다)
const posters = [...movies.matchAll(/posterUrl: '([^']*)'/g)].map((m) => m[1]);
const stills = [...movies.matchAll(/stills: \[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]));
const movieUrls = [...posters, ...stills].filter(Boolean);
for (const u of new Set(movieUrls)) inCsp(u, 'movies.ts');
const ranks = [...movies.matchAll(/bookingRank: (\d+)/g)].map((m) => Number(m[1]));
if (!ranks.length) fail('movies.ts: 영화가 한 편도 없다');
// KOBIS 는 동률에 같은 순위를 준다(1,2,2,4) — 그것은 받는다. 1로 시작 · 내려가지 않음 · 줄 번호를 넘지 않음만 본다
// (넘으면 중간 줄을 못 읽고 건너뛴 것이다). 「1부터 차례」 로 재면 동률이 든 날 새벽 배치가 멈춘다(2026-11-14 리뷰).
if (ranks[0] !== 1 || ranks.some((r, i) => r > i + 1 || (i > 0 && r < ranks[i - 1]))) fail(`movies.ts: 순위가 1로 시작해 내려가지 않고 이어져야 한다 — ${ranks.join(',')}`);
if (posters.length !== ranks.length) fail(`movies.ts: 영화 ${ranks.length}편인데 posterUrl 칸이 ${posters.length}개`);
if (ranks.length && !posters.some(Boolean)) fail('movies.ts: 포스터가 한 장도 없다 — KOBIS 상세 화면 구조가 바뀌었을 수 있다(update-movies.mjs 의 fetchImages)');

/* ── 공연 (KOPIS) ────────────────────────────────────── */
const shows = read('app/src/data/performances.ts');
const kopis = /const KOPIS = '([^']+)'/.exec(shows)?.[1] ?? '';
inCsp(`${kopis}/upload/pfmPoster/x.gif`, 'performances.ts(KOPIS)');
// 주소를 짓는 세 함수가 모두 그 호스트에서 시작하는지, 파일에 다른 호스트가 적히지 않았는지
for (const [name, head] of [['showPosterUrl', '/_next/image?url='], ['showPosterFallbackUrl', '/upload/pfmPoster/'], ['showInfoUrl', '/por/db/pblprfr/']]) {
  if (!shows.includes(`export const ${name} = (s: Show) =>`) || !new RegExp(`${name} = \\(s: Show\\) =>\\s*\`\\$\\{KOPIS\\}${head.replace(/[/?]/g, '\\$&')}`).test(shows)) fail(`performances.ts: ${name} 가 \`\${KOPIS}${head}\` 로 시작하지 않는다`);
}
for (const m of shows.matchAll(/https?:\/\/[^\s'"`)]+/g)) {
  if (!m[0].startsWith(`${kopis}/`) && m[0] !== kopis) fail(`performances.ts: KOPIS 가 아닌 주소가 적혀 있다 — ${m[0].slice(0, 60)}`);
}
const ISO = /^\d{4}-\d{2}-\d{2}$/;
let showCount = 0;
for (const area of shows.matchAll(/^ {2}(서울|경기|인천): \{\n([\s\S]*?)\n {2}\},/gm)) {
  for (const list of area[2].matchAll(/^ {4}(\S+): \[\n([\s\S]*?)\n? {4}\],/gm)) {
    const where = `performances.ts ${area[1]}·${list[1]}`;
    const rows = [...list[2].matchAll(/\{ id: '([^']*)', rank: (\d+), title: '((?:[^'\\]|\\.)*)', start: '([^']*)', end: '([^']*)', venue: '((?:[^'\\]|\\.)*)', poster: '([^']*)' \}/g)];
    const lines = list[2].split('\n').filter((l) => l.trim()).length;
    if (rows.length !== lines) fail(`${where}: 읽지 못한 줄이 있다(${rows.length}/${lines})`);
    if (rows.length > 10) fail(`${where}: 열 편을 넘는다`);
    const seen = new Set();
    rows.forEach(([, id, rank, title, start, end, venue, poster], i) => {
      if (Number(rank) !== i + 1) fail(`${where}: ${i + 1}번째 줄의 순위가 ${rank}`);
      if (!/^PF\d{4,8}$/.test(id) || seen.has(id)) fail(`${where}: id 꼴이 틀리거나 겹친다 — ${id}`);
      seen.add(id);
      if (!ISO.test(start) || !ISO.test(end) || start > end) fail(`${where}: 기간 — ${start}~${end}`);
      if (!/^PF_PF\d+_\d{6}_\d{6}\.(gif|jpe?g|png)$/i.test(poster) || !poster.includes(`_${id}_`)) fail(`${where}: 포스터 파일 — ${poster}`);
      if (!title.trim() || !venue.trim() || /[<>]/.test(title + venue)) fail(`${where}: 제목 · 장소 — ${id}`);
    });
    showCount += rows.length;
  }
}
if (!showCount) fail('performances.ts: 공연을 한 편도 못 읽었다 — 파일 꼴이 바뀌었으면 이 검사기도 고친다');
if (!/SHOW_RANKING_PERIOD = '\d{1,2}\/\d{1,2}~\d{1,2}\/\d{1,2}'/.test(shows)) fail('performances.ts: 집계 기간 표기');

/* ── DB 의 포스터 주소 (--live) ──────────────────────── */
let live = '';
if (process.argv.includes('--live')) {
  const cfg = read('app/public/config.js');
  const url = /supabaseUrl: "([^"]+)"/.exec(cfg)?.[1]; const key = /supabaseAnonKey: "([^"]+)"/.exec(cfg)?.[1];
  try {
    const res = await fetch(`${url}/rest/v1/events?select=title,image_url&image_url=not.is.null`, {
      headers: { apikey: key, authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    for (const r of rows) inCsp(r.image_url, `events.image_url(${String(r.title).slice(0, 16)})`);
    live = ` · DB 포스터 ${rows.length}건`;
  } catch (err) {
    fail(`--live: DB 를 못 읽었다 — ${err.message}`);
  }
}

if (problems.length) {
  console.error(`보드 자료 검사 실패\n\n  · ${problems.join('\n  · ')}\n`);
  process.exit(1);
}
console.log(`보드 자료 검사 통과 — 그림 호스트 ${hosts.size}곳 · 영화 ${ranks.length}편(그림 ${new Set(movieUrls).size}장) · 공연 ${showCount}편${live}`);
