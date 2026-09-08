#!/usr/bin/env node
/**
 * scout-exhibitions.mjs — 주요 기관의 공식 목록에서 **보드에 아직 없는 전시**를 찾아 후보로 모은다.
 *
 *   npm run scout             새로 보이는 후보만 (지난번에 본 것은 건너뛴다)
 *   npm run scout -- --all    지금 열려 있거나 예정인 후보 전부
 *
 * 어디서 (2026-09-09 실측 · 열쇠 없이 읽히는 공식 페이지만)
 *   · 서울시립미술관   whatson 목록 (서소문·북서울·남서울·사진미술관 … 전 분관)
 *   · 예술의전당       show/dataList JSON — 분류 6(전시장)만
 *   · 국립중앙박물관   특별전 현재·예정 목록
 *   · 국립현대미술관   현재 전시 (이 PC 에서 자주 연결이 안 된다 — 실패하면 그대로 적는다)
 *
 * 무엇을 하나
 *   1. 각 기관의 목록을 받아 제목 · 장소 · 기간 · 링크를 뽑는다.
 *   2. 보드(public.events)에 이미 있는 제목은 뺀다. 지난번에 이미 보여 준 후보도 뺀다(logs/scout-seen.json).
 *   3. logs/scout-YYYYMMDD.md 에 후보와 **운영자가 붙여 넣을 insert 틀**을 쓴다.
 *
 * 하지 않는 것
 *   · 고르지 않는다. 취향으로 거르지 않는다 — 고르는 것은 운영자다 (AGENTS.md 「보드는 거르지 않는다」).
 *   · DB 에 쓰지 않는다. 관람료·요약·추천 문구는 /scout 스킬이 공식 상세를 읽고 채운다.
 */

import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';

dns.setDefaultResultOrder('ipv4first');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG_DIR = path.join(ROOT, 'logs');
const SEEN = path.join(LOG_DIR, 'scout-seen.json');
const ALL = process.argv.includes('--all');
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
const STAMP = TODAY.replace(/-/g, '');

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
  accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
  'accept-language': 'ko-KR,ko;q=0.9',
};
async function get(url, extra = {}) {
  const res = await fetch(url, { headers: { ...HEADERS, ...extra }, signal: AbortSignal.timeout(20000), redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
const clean = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim().replace(/[,·]\s*$/, '');
// 너무 먼 예정(예술의전당은 2028년까지 내준다)은 뺀다 — 넉 달 안에 시작하는 것만
const HORIZON = (() => { const d = new Date(`${TODAY}T12:00:00+09:00`); d.setUTCDate(d.getUTCDate() + 120); return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d); })();
const isoDate = (s) => {
  const m = /(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/.exec(s ?? '');
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : '';
};
const period = (s) => {
  const parts = String(s ?? '').split(/~|-\s|–|—/).map(isoDate).filter(Boolean);
  const m = [...String(s ?? '').matchAll(/(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/g)].map((x) => `${x[1]}-${x[2].padStart(2, '0')}-${x[3].padStart(2, '0')}`);
  return { start: m[0] ?? parts[0] ?? '', end: m[1] ?? parts[1] ?? '' };
};

/* ── 기관별 어댑터 ─────────────────────────────────── */

async function sema() {
  const html = await get('https://sema.seoul.go.kr/kr/whatson/landing?whatChoice2=N&whatChoice3=N&whatChoice4=N&whatChoice5=N&whatsonMenuDivList=EX&whenType=ALL_DAY');
  const out = [];
  for (const m of html.matchAll(/id="dv_(\d+)"[\s\S]*?<strong class="o_h1">([\s\S]*?)<\/strong>[\s\S]*?epEcPlaceNm[^>]*>([\s\S]*?)<\/span>[\s\S]*?<span class="o_h3">([\s\S]*?)<\/span>/g)) {
    const { start, end } = period(clean(m[4]));
    out.push({ source: '서울시립미술관', id: `sema-${m[1]}`, title: clean(m[2]), venue: clean(m[3]) || '서울시립미술관', start, end,
      url: `https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=${m[1]}` });
  }
  return out;
}

async function sac() {
  const q = (params) => get(`https://www.sac.or.kr/site/main/show/dataList?${params}`, { accept: 'application/json', 'x-requested-with': 'XMLHttpRequest', referer: 'https://www.sac.or.kr/site/main/show/show_list?searchType=EXHIBITION' });
  const ongoing = JSON.parse(await q(`cp=1&PAGE_SIZE=100&END_DATE=${TODAY}&mainSort=1`)).paging?.result ?? [];
  const upcoming = JSON.parse(await q(`cp=1&PAGE_SIZE=100&BEGIN_DATE=${TODAY}&catePriArr=6&mainSort=1`)).paging?.result ?? [];
  const seen = new Set();
  const out = [];
  for (const it of [...ongoing, ...upcoming]) {
    if (String(it.CATEGORY_PRIMARY) !== '6' || seen.has(it.SN)) continue;   // 6 = 전시장
    seen.add(it.SN);
    const { start, end } = period(it.PBLPRFR_PERIOD);
    out.push({ source: '예술의전당', id: `sac-${it.SN}`, title: clean(it.PROGRAM_SUBJECT), venue: `예술의전당 ${clean(it.PLACE_NAME)}`, start, end,
      url: `https://www.sac.or.kr/site/main/show/show_view?SN=${it.SN}`, price: clean(it.PRICE_INFO) });
  }
  return out;
}

async function museum() {
  const out = [];
  for (const kind of ['current', 'upcoming']) {
    let html;
    try { html = await get(`https://www.museum.go.kr/site/main/exhiSpecialTheme/list/${kind}`); } catch { continue; }
    // 항목 하나 = 이 exhiSpThemId 부터 다음 exhiSpThemId 까지 (기간·장소가 안쪽 <li> 에 있어 <li> 로 자르면 잘린다)
    const idx = [...html.matchAll(/exhiSpThemId=(\d+)/g)];
    const seenId = new Set();
    for (let i = 0; i < idx.length; i++) {
      const id = idx[i][1];
      if (seenId.has(id)) continue;
      seenId.add(id);
      // 같은 id 가 그림 링크와 제목 링크에 두 번 나온다 — 다른 id 가 나올 때까지가 한 항목이다
      const next = idx.slice(i + 1).find((m) => m[1] !== id);
      const block = html.slice(idx[i].index, next ? next.index : idx[i].index + 4000);
      const title = clean(/<strong>((?!기간|장소)[\s\S]*?)<\/strong>/.exec(block)?.[1] ?? /alt="([^"]+)"/.exec(block)?.[1] ?? '');
      const dates = /기간<\/strong>\s*<p>([\s\S]*?)<\/p>/.exec(block)?.[1] ?? '';
      const venue = clean(/장소<\/strong>\s*<p>([\s\S]*?)<\/p>/.exec(block)?.[1] ?? '') || '국립중앙박물관';
      const { start, end } = period(clean(dates));
      if (!title) continue;
      out.push({ source: '국립중앙박물관', id: `nmk-${id}`, title, venue, start, end,
        // 목록의 상대 링크는 목록 페이지로 되돌아간다(302). 상세를 여는 주소는 이것이다 (2026-09-09 실측)
        url: `https://www.museum.go.kr/MUSEUM/contents/M0202010000.do?schM=view&menuId=${kind}&exhiSpThemId=${id}` });
    }
  }
  return out;
}

async function mmca() {
  const html = await get('https://www.mmca.go.kr/exhibitions/progressList.do');
  const out = [];
  const seen = new Set();
  for (const m of html.matchAll(/exhId=(\d+)[^>]*>([\s\S]{0,400}?)<\/a>/g)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    const title = clean(/alt="([^"]+)"/.exec(m[2])?.[1] ?? m[2]);
    if (!title) continue;
    const { start, end } = period(clean(m[2]));
    out.push({ source: '국립현대미술관', id: `mmca-${m[1]}`, title, venue: '국립현대미술관', start, end,
      url: `https://www.mmca.go.kr/exhibitions/exhibitionsDetail.do?exhId=${m[1]}` });
  }
  return out;
}

/* ── 보드에 이미 있는 것 ─────────────────────────────── */

const norm = (s) => String(s ?? '').replace(/[《》〈〉「」『』()\[\]:：·\-–—,.'"“”‘’!?\s]/g, '').toLowerCase();
async function boardTitles() {
  const cfg = fs.readFileSync(path.join(ROOT, 'app/public/config.js'), 'utf8');
  const url = /supabaseUrl:\s*"([^"]+)"/.exec(cfg)?.[1];
  const key = /supabaseAnonKey:\s*"([^"]+)"/.exec(cfg)?.[1];
  const res = await fetch(`${url}/rest/v1/events?select=title`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`events 응답 ${res.status}`);
  return (await res.json()).map((r) => norm(r.title)).filter(Boolean);
}
const onBoard = (titles, t) => {
  const n = norm(t);
  return n.length >= 4 && titles.some((b) => b.includes(n) || n.includes(b));
};

/* ── 실행 ────────────────────────────────────────────── */

fs.mkdirSync(LOG_DIR, { recursive: true });
const seen = fs.existsSync(SEEN) ? JSON.parse(fs.readFileSync(SEEN, 'utf8')) : {};
const titles = await boardTitles();

const found = [];
const failed = [];
for (const [name, fn] of [['서울시립미술관', sema], ['예술의전당', sac], ['국립중앙박물관', museum], ['국립현대미술관', mmca]]) {
  try {
    const list = await fn();
    found.push(...list);
    console.log(`${name}: ${list.length}건`);
  } catch (e) {
    failed.push(`${name} — ${e.message}${e.cause?.code ? ` (${e.cause.code})` : ''}`);
    console.log(`${name}: 실패 — ${e.message}`);
  }
}

const current = found.filter((c) => (!c.end || c.end >= TODAY) && (!c.start || c.start <= HORIZON));
const fresh = current.filter((c) => !onBoard(titles, c.title));
const picked = ALL ? fresh : fresh.filter((c) => !seen[c.id]);
for (const c of current) seen[c.id] = seen[c.id] ?? TODAY;
fs.writeFileSync(SEEN, JSON.stringify(seen, null, 1));

const sql = (c) => `insert into public.events
  (status, region, type, title, start_date, end_date, venue, price, price_type, info_url, main_url, summary, recommendation, verified, source_label, verification_note)
values
  ('검토중', '서울 전체', '전시', '${c.title.replace(/'/g, "''")}',
   ${c.start ? `date '${c.start}'` : 'null'}, ${c.end ? `date '${c.end}'` : 'null'},
   '${c.venue.replace(/'/g, "''")}', 0, '${c.price ? '유료' : '확인 필요'}',
   '${c.url}', '${c.url}',
   '<한 줄 소개 — 공식 상세에서>', '<추천 이유 · 관람료 · 휴관일 — 공식 상세에서>',
   false, '${c.source} 공식 목록', '${TODAY} 공식 목록에서 후보로 담음. 상세 확인 전');`;

const lines = [`# 전시 후보 — ${TODAY}`, '',
  `기관 4곳 · 열려 있거나 예정 ${current.length}건 · 보드에 없는 것 ${fresh.length}건 · ${ALL ? '전부' : '이번에 새로 보인 것'} ${picked.length}건`,
  failed.length ? `읽지 못한 곳: ${failed.join(' / ')}` : '기관 4곳 모두 읽음', '',
  '고르는 것은 운영자다. 아래 insert 는 틀이다 — `<…>` 자리는 /scout 스킬이 공식 상세를 읽고 채운 뒤 운영자가 붙여 넣는다.', ''];
for (const c of picked) {
  lines.push(`## ${c.title}`, `- ${c.source} · ${c.venue} · ${c.start || '?'} ~ ${c.end || '?'}${c.price ? ` · ${c.price}` : ''}`, `- ${c.url}`, '', '```sql', sql(c), '```', '');
}
const out = path.join(LOG_DIR, `scout-${STAMP}.md`);
fs.writeFileSync(out, lines.join('\n'));

console.log(`\n${lines[2]}`);
for (const c of picked) console.log(`  · [${c.source}] ${c.title} · ${c.venue} · ${c.start || '?'}~${c.end || '?'}`);
if (failed.length) console.log(`읽지 못한 곳: ${failed.join(' / ')}`);
console.log(`\n자료: ${path.relative(ROOT, out).replace(/\\/g, '/')}`);
