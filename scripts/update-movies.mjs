#!/usr/bin/env node
/**
 * update-movies.mjs — 보드의 영화 예매 순위를 KOBIS 에서 받아 `movies.ts` 를 다시 쓴다.
 *
 *   node scripts/update-movies.mjs             받아서 쓴다 (movies.ts + App.tsx 의 갱신일)
 *   node scripts/update-movies.mjs --dry-run   받기만 하고 표로 보여 준다
 *   node scripts/update-movies.mjs --top 10    몇 편까지 (기본 10)
 *
 * 예전에는 사람이 KOBIS 를 열어 열 편을 손으로 옮겨 적었다 — 주 2회, 188줄.
 * 그 일을 이 스크립트가 한다. **사람이 할 것은 실행 한 번과 결과 훑어보기다.**
 *
 * ── 어디서 받나 ─────────────────────────────────────────
 *   순위 · 예매율 · 개봉일     findRealTicketList.do (POST · 실시간 예매율 표)
 *   장르 · 상영시간 · 등급 · 감독 · 시놉시스   모바일 영화 상세 페이지
 *
 * ── 손으로 다듬어도 되는 것 ─────────────────────────────
 * `summary` 는 시놉시스의 첫 문장을 잘라 만든다. 어색하면 손으로 고쳐도 되지만
 * **다음 갱신 때 다시 덮인다.** 오래 남길 문구가 아니면 그냥 둔다.
 *
 * ── 하지 않는 것 ────────────────────────────────────────
 * 거르지 않는다. 청불이든 공포든 순위대로 싣는다 — AGENTS.md 「보드는 거르지 않는다」.
 * 재개봉 여부는 KOBIS 표에 없어 알 수 없다. 개봉일이 오늘 이전이면 「상영 중」,
 * 뒤면 「개봉 예정」 으로만 가른다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MOVIES_TS = path.join(ROOT, 'app/src/data/movies.ts');
const APP_TSX = path.join(ROOT, 'app/src/App.tsx');

const LIST_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do';
const DETAIL_URL = (code) => `https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=${code}`;
const UA = 'Mozilla/5.0 (exhibition-club-survey board updater)';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const topArg = args.indexOf('--top');
const TOP = topArg >= 0 ? Number(args[topArg + 1]) : 10;
if (!Number.isInteger(TOP) || TOP < 1 || TOP > 30) {
  console.error('--top 은 1~30 사이 정수여야 한다');
  process.exit(2);
}

/* ── 시각 (서울) ─────────────────────────────────────── */

const seoulParts = (d = new Date()) => {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: p.year, m: p.month, d: p.day, hh: p.hour === '24' ? '00' : p.hour, mm: p.minute };
};
const now = seoulParts();
const TODAY_ISO = `${now.y}-${now.m}-${now.d}`;
const TODAY_DOT = `${now.y}.${now.m}.${now.d}`;
const STAMP = `${TODAY_DOT} ${now.hh}:${now.mm}`;

/* ── 받기 ────────────────────────────────────────────── */

async function fetchText(url, init) {
  const res = await fetch(url, { ...init, headers: { 'user-agent': UA, ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

/** HTML 을 「|」 로 나뉜 글자 토막으로 — 태그는 버리고 글만 남긴다. */
const textTokens = (html) => html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, '|')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .split('|').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);

async function fetchRanking() {
  const html = await fetchText(LIST_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'allMovieYn=Y&dmlMode=search&loadEnd=0',
  });
  const rows = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  for (let m; (m = rowRe.exec(html)) !== null;) {
    const tr = m[1];
    const code = /mstView\('movie','(\d+)'\)/.exec(tr)?.[1];
    if (!code) continue;
    const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((t) => t[1]);
    const rank = Number(tds[0]?.replace(/<[^>]+>/g, '').trim());
    const title = /title="([^"]*)"/.exec(tr)?.[1]?.trim() ?? '';
    const releaseDate = tds[2]?.replace(/<[^>]+>/g, '').trim() ?? '';
    const rate = Number(tds[3]?.replace(/<[^>]+>/g, '').trim().replace('%', ''));
    if (!Number.isInteger(rank) || !title || Number.isNaN(rate)) continue;
    rows.push({ rank, code, title, releaseDate, rate });
    if (rows.length >= TOP) break;
  }
  if (!rows.length) throw new Error('실시간 예매율 표에서 한 줄도 못 읽었다 — KOBIS 화면 구조가 바뀌었을 수 있다');
  return rows;
}

/** 등급 표기를 이 사이트가 써 온 꼴로 (KOBIS 는 띄어쓰기 없이 준다). */
const AGE_RATING = {
  '전체관람가': '전체 관람가',
  '12세이상관람가': '12세 이상 관람가',
  '15세이상관람가': '15세 이상 관람가',
  '청소년관람불가': '청소년 관람불가',
};

/** 시놉시스에서 한두 문장만 — 카드 한 줄 분량(120자 안팎)으로. */
function firstSentences(text, limit = 120) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const parts = clean.match(/[^.!?…]+[.!?…]+["'”’)]?\s*|[^.!?…]+$/g) ?? [clean];
  let out = '';
  for (const p of parts) {
    if (out && (out + p).trim().length > limit) break;
    out += p;
    if (out.trim().length >= limit * 0.6) break;
  }
  out = out.trim();
  if (out.length > limit + 20) out = `${out.slice(0, limit).trim()}…`;
  return out;
}

async function fetchDetail(code) {
  const tokens = textTokens(await fetchText(DETAIL_URL(code), {
    headers: { 'user-agent': 'Mozilla/5.0 (iPhone) exhibition-club-survey board updater' },
  }));
  const after = (label) => {
    const i = tokens.indexOf(label);
    return i >= 0 ? tokens[i + 1] ?? '' : '';
  };
  const between = (from, stops) => {
    const i = tokens.indexOf(from);
    if (i < 0) return [];
    const out = [];
    for (let j = i + 1; j < tokens.length; j++) {
      if (stops.includes(tokens[j])) break;
      out.push(tokens[j]);
    }
    return out;
  };
  const genre = after('장르');
  const runtime = Number(/(\d+)\s*분/.exec(after('상영시간'))?.[1] ?? 0);
  const ageRaw = after('관람등급').replace(/\s+/g, '');
  const ageRating = AGE_RATING[ageRaw] ?? after('관람등급');
  const director = between('감독', ['출연', '스틸컷', '시놉시스', '영화사'])
    .map((s) => s.replace(/,$/, '').trim()).filter(Boolean).join(', ');
  const synopsis = between('시놉시스', ['영화사', '배급사', '수입사', '목록']).join(' ');
  return { genre, runtime, ageRating, director, summary: firstSentences(synopsis) };
}

/* ── 쓰기 ────────────────────────────────────────────── */

const q = (s) => `'${String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function renderMoviesTs(movies) {
  const items = movies.map((m) => `  {
    id: ${q(`movie-${m.code}`)},
    movieCode: ${q(m.code)},
    bookingRank: ${m.rank},
    bookingRate: ${m.rate},
    title: ${q(m.title)},
    releaseStatus: ${q(m.releaseDate && m.releaseDate <= TODAY_ISO ? '상영 중' : '개봉 예정')},
    releaseDate: ${q(m.releaseDate)},
    runtime: ${m.runtime},
    genre: ${q(m.genre)},
    ageRating: ${q(m.ageRating)},
    director: ${q(m.director)},
    summary: ${q(m.summary)},
    infoUrl: ${q(DETAIL_URL(m.code))}
  }`).join(',\n');

  return `/**
 * 실시간 영화 예매 순위. **scripts/update-movies.mjs 가 KOBIS 에서 받아 쓴다.**
 * 손으로 고쳐도 되지만 다음 갱신 때 덮인다 — 오래 남길 것은 여기 적지 않는다.
 *
 *   node scripts/update-movies.mjs
 *
 * **이건 events 가 아니다.** 전시·공연과 모양이 완전히 다르다 —
 * 예매율 · 상영시간 · 관람등급 · 감독. KOBIS 예매율 순위이고
 * \`public.events\` 에 넣을 것이 아니다.
 *
 * 거르지 않는다. 순위대로 싣고 볼지 말지는 회원이 판단한다 (AGENTS.md).
 */

export type Movie = {
  id: string
  movieCode: string
  bookingRank: number
  bookingRate: number
  title: string
  releaseStatus: string
  releaseDate: string
  runtime: number
  genre: string
  ageRating: string
  director: string
  summary: string
  infoUrl: string
}

export const MOVIES: Movie[] = [
${items}
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = ${q(STAMP)}
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
`;
}

const eolOf = (s) => (s.includes('\r\n') ? '\r\n' : '\n');
const writeKeepingEol = (file, body) => {
  const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  fs.writeFileSync(file, body.replace(/\r?\n/g, eolOf(prev)));
};

/* ── 실행 ────────────────────────────────────────────── */

console.log(`KOBIS 실시간 예매율 — 상위 ${TOP}편 · ${STAMP} 기준`);
const ranking = await fetchRanking();
const movies = [];
for (const r of ranking) {
  const d = await fetchDetail(r.code);
  movies.push({ ...r, ...d });
  const warn = [];
  if (!d.genre) warn.push('장르 없음');
  if (!d.runtime) warn.push('상영시간 없음');
  if (!d.director) warn.push('감독 없음');
  if (!d.summary) warn.push('시놉시스 없음');
  console.log(`  ${String(r.rank).padStart(2)}  ${r.rate.toFixed(1).padStart(5)}%  ${r.title}`
    + `  (${r.releaseDate || '개봉일 미상'})${warn.length ? '  ⚠ ' + warn.join(' · ') : ''}`);
}

if (dryRun) {
  console.log('\n--dry-run — 파일은 건드리지 않았다');
  process.exit(0);
}

writeKeepingEol(MOVIES_TS, renderMoviesTs(movies));

const app = fs.readFileSync(APP_TSX, 'utf8');
const nextApp = app.replace(/const SITE_INFO_UPDATED_ON = '[^']*'/, `const SITE_INFO_UPDATED_ON = '${TODAY_DOT}'`);
if (nextApp === app && !app.includes(`SITE_INFO_UPDATED_ON = '${TODAY_DOT}'`)) {
  console.error('App.tsx 에서 SITE_INFO_UPDATED_ON 을 찾지 못했다 — 손으로 올린다');
} else if (nextApp !== app) {
  fs.writeFileSync(APP_TSX, nextApp);
}

console.log(`\n썼다 — app/src/data/movies.ts (${movies.length}편) · App.tsx 갱신일 ${TODAY_DOT}`);
console.log('다음: npm run build && npm run screens:save && npm run check:quick');
