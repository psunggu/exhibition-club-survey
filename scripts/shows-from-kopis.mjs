#!/usr/bin/env node
/**
 * shows-from-kopis.mjs — KOPIS(공연예술통합전산망) 주간 예매 순위를 `performances.ts` 로 옮긴다.
 *
 *   node scripts/shows-from-kopis.mjs <목록.txt> --from 2026-11-06 --to 2026-11-12 --published '2026.11.13 17:33'
 *
 * 입력은 `/rank` 스킬이 KOPIS 예매상황판 화면에서 읽어 적은 글 파일이다(저장소 밖 스크래치에 둔다).
 *   # 서울|뮤지컬
 *   제목¦2026.12.22~2027.02.28¦공연장¦PF302842¦PF_PF302842_261008_143949.jpg
 * 지역은 서울 · 경기 · 인천, 갈래는 뮤지컬 · 콘서트(대중음악) · 클래식(서양음악) · 무용 · 연극.
 *
 * **여기서 KOPIS 에 접속하지 않는다.** 순위를 받는 일은 화면을 읽는 쪽(스킬)이 하고,
 * 이 스크립트는 받은 글이 꼴에 맞는지 검사해 자료 파일로 바꾸기만 한다 — 꼴이 어긋나면 쓰지 않고 멈춘다.
 * KOPIS Open API 인증키를 받으면 받는 일까지 스크립트로 옮긴다(docs/BACKLOG.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app/src/data/performances.ts');
const AREAS = ['서울', '경기', '인천'];
const GENRES = ['뮤지컬', '콘서트', '클래식', '무용', '연극'];
const MAX_PER_LIST = 10;

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith('--'));
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : ''; };
const from = opt('from'); const to = opt('to'); const published = opt('published');
const ISO = /^\d{4}-\d{2}-\d{2}$/;
if (!input || !ISO.test(from) || !ISO.test(to) || from > to || !/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/.test(published)) {
  console.error("쓰는 법: node scripts/shows-from-kopis.mjs <목록.txt> --from YYYY-MM-DD --to YYYY-MM-DD --published 'YYYY.MM.DD HH:MM'");
  process.exit(2);
}

/** 화면에서 딸려 온 폭 없는 글자 · 겹친 빈칸을 걷어낸다. 꺾쇠는 받지 않는다(제목에 태그가 섞이면 멈춘다). */
const clean = (s) => String(s ?? '').replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim();
const problems = [];
const lists = Object.fromEntries(AREAS.map((a) => [a, Object.fromEntries(GENRES.map((g) => [g, []]))]));
let cur = null;
for (const [n, raw] of fs.readFileSync(input, 'utf8').split('\n').entries()) {
  const line = raw.trim();
  if (!line) continue;
  if (line.startsWith('# ')) {
    const [area, genre] = line.slice(2).split('|').map((s) => s.trim());
    cur = AREAS.includes(area) && GENRES.includes(genre) ? lists[area][genre] : null;
    if (!cur) problems.push(`${n + 1}줄: 모르는 묶음 — ${line}`);
    continue;
  }
  if (!cur) { problems.push(`${n + 1}줄: 묶음 머리(# 지역|갈래) 없이 나온 줄`); continue; }
  const [title, period, venue, id, poster] = line.split('¦').map(clean);
  const m = /^(\d{4})\.(\d{2})\.(\d{2})~(\d{4})\.(\d{2})\.(\d{2})$/.exec(period ?? '');
  const start = m ? `${m[1]}-${m[2]}-${m[3]}` : ''; const end = m ? `${m[4]}-${m[5]}-${m[6]}` : '';
  const bad = [];
  if (!title || !venue || /[<>]/.test(title + venue)) bad.push('제목 · 장소');
  if (!m || start > end || Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) bad.push('기간');
  if (!/^PF\d{4,8}$/.test(id ?? '')) bad.push('id');
  if (!/^PF_PF\d{4,8}_\d{6}_\d{6}\.(gif|jpe?g|png)$/i.test(poster ?? '') || !(poster ?? '').includes(`_${id}_`)) bad.push('포스터 파일');
  if (cur.some((r) => r.id === id)) bad.push('같은 묶음에 같은 id');
  if (bad.length) { problems.push(`${n + 1}줄: ${bad.join(' · ')} — ${line.slice(0, 60)}`); continue; }
  if (cur.length < MAX_PER_LIST) cur.push({ id, rank: cur.length + 1, title, start, end, venue, poster });
}
const total = AREAS.flatMap((a) => GENRES.map((g) => lists[a][g].length)).reduce((x, y) => x + y, 0);
if (!total) problems.push('한 줄도 못 읽었다');
if (problems.length) {
  console.error(`자료가 꼴에 안 맞는다 — 파일을 쓰지 않았다\n  · ${problems.join('\n  · ')}`);
  process.exit(1);
}

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const row = (r) => `      { id: ${q(r.id)}, rank: ${r.rank}, title: ${q(r.title)}, start: ${q(r.start)}, end: ${q(r.end)}, venue: ${q(r.venue)}, poster: ${q(r.poster)} },`;
const body = AREAS.map((a) => `  ${a}: {\n${GENRES.map((g) => `    ${g}: [\n${lists[a][g].map(row).join('\n')}\n    ],`).join('\n')}\n  },`).join('\n');
const md = (iso) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;

fs.writeFileSync(OUT, `/**
 * 공연 주간 예매 순위. **scripts/shows-from-kopis.mjs 가 쓴다 — 손으로 고치지 않는다.**
 * 출처: (재)예술경영지원센터 공연예술통합전산망(KOPIS, kopis.or.kr) 예매상황판 · 주간 · 총티켓예매액 순.
 *
 * **이건 events 가 아니다.** 영화 순위(movies.ts)와 같은 자리다 — 바깥 집계를 그대로 비춘다.
 * 거르지 않는다. 순위대로 싣고 볼지 말지는 회원이 판단한다(AGENTS.md 「보드」).
 * 포스터는 KOPIS 의 그림 주소를 그대로 부른다(복사해 두지 않는다).
 */

export type ShowGenre = ${GENRES.map(q).join(' | ')}
export type ShowArea = ${AREAS.map(q).join(' | ')}

export type Show = {
  /** KOPIS 공연 id (PF…) */
  id: string
  rank: number
  title: string
  /** ISO 날짜 */
  start: string
  end: string
  venue: string
  /** KOPIS 포스터 파일 이름 — 주소는 showPosterUrl 이 짓는다 */
  poster: string
}

export const SHOWS: Record<ShowArea, Record<ShowGenre, Show[]>> = {
${body}
}

/** 집계 기간(예매일 기준)과 KOPIS 최종 게시 시각 — 화면에 그대로 보여 준다. */
export const SHOW_RANKING_PERIOD = ${q(`${md(from)}~${md(to)}`)}
export const SHOW_RANKING_PUBLISHED_AT = ${q(published)}
export const SHOW_RANKING_SOURCE_URL = 'https://kopis.or.kr/por/boxoffice/boxoffice.do?menuId=MNU_000024'

const KOPIS = 'https://kopis.or.kr'
/** 줄인 그림(가로 256px, 12~20KB) — KOPIS 가 자기 화면에 쓰는 것과 같은 길이다. 원본은 0.06~2MB 라 그대로 쓰지 않는다. */
export const showPosterUrl = (s: Show) =>
  \`\${KOPIS}/_next/image?url=\${encodeURIComponent(\`/upload/pfmPoster/\${s.poster}\`)}&w=256&q=75\`
/** 줄인 그림을 못 받으면 원본으로 한 번 더 */
export const showPosterFallbackUrl = (s: Show) => \`\${KOPIS}/upload/pfmPoster/\${s.poster}\`
export const showInfoUrl = (s: Show) => \`\${KOPIS}/por/db/pblprfr/pblprfrView.do?menuId=MNU_00020&mt20Id=\${s.id}\`
`);
console.log(`썼다 — app/src/data/performances.ts (${total}편 · ${md(from)}~${md(to)} · 게시 ${published})`);
for (const a of AREAS) console.log(`  ${a}: ${GENRES.map((g) => `${g} ${lists[a][g].length}`).join(' · ')}`);
