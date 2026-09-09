#!/usr/bin/env node
/**
 * weekly-notice.mjs — 톡방에 올릴 「주간 소식」 한 통을 사이트 자료에서 조립한다.
 *
 *   npm run notice               조립해서 보여 주고, 파일과 클립보드에 넣는다
 *   npm run notice -- --no-clip  클립보드에는 안 넣는다
 *
 * 무엇을 모으나 (전부 이미 공개된 자료다 — 새로 판단하지 않는다)
 *   · 주간 정리봇      app/public/weekly-digest.public.json
 *   · 다가오는 모임    meetups.ts 의 MEETUPS (30일 안)  ·  조율 중 TENTATIVE
 *   · 진행 중인 투표   public.surveys (anon 이 읽을 수 있는 것 = 회원용).
 *                      투표 자체는 톡방에서 하고 사이트는 현황·결과만 보여 준다(config.js 의 selfSurvey).
 *   · 보드             이번 주에 올리거나 고친 전시·공연, 영화 예매 순위 상위 3
 *
 * 하지 않는 것
 *   · 톡방에 올리지 않는다. 클립보드까지가 끝이고 붙여 넣는 것은 사람이다 (kakao-digest 규칙 4 와 같다).
 *   · 회원 이름을 만들지 않는다. 정리봇 공개본은 검사기를 거친 것이고, 나머지는 이름이 없는 자료다.
 *   · 봇 트리거(#일정 · #참석 …)가 살아 나가지 않게 # 을 전각 ＃ 으로 바꾼다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://psunggu.github.io/exhibition-club-survey/';
const NO_CLIP = process.argv.includes('--no-clip');

const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
const plus = (iso, days) => {
  const d = new Date(`${iso}T12:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d);
};
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
const md = (iso) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${m}/${d}(${WEEKDAY[new Date(`${iso}T12:00:00+09:00`).getUTCDay()]})`;
};

/* ── 자료 ────────────────────────────────────────────── */

const config = fs.readFileSync(path.join(ROOT, 'app/public/config.js'), 'utf8');
const SB_URL = /supabaseUrl:\s*"([^"]+)"/.exec(config)?.[1];
const SB_KEY = /supabaseAnonKey:\s*"([^"]+)"/.exec(config)?.[1];
// 사이트가 직접 응답을 받나. 아니면 설문 절은 「사이트에서 답하라」 가 아니라 「톡방에서 투표 중」 이어야 한다.
const SELF_SURVEY = /selfSurvey:\s*true/.test(config);
const rest = async (q) => {
  const res = await fetch(`${SB_URL}/rest/v1/${q}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!res.ok) throw new Error(`${q.split('?')[0]} 응답 ${res.status}`);
  return res.json();
};

const digest = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/public/weekly-digest.public.json'), 'utf8'));
const { MEETUPS, TENTATIVE } = await import(pathToFileURL(path.join(ROOT, 'app/src/data/meetups.ts')).href);
const { MOVIES, MOVIE_RANKING_UPDATED_AT } = await import(pathToFileURL(path.join(ROOT, 'app/src/data/movies.ts')).href);

const upcoming = MEETUPS.filter((m) => m.kind !== 'dead' && m.date >= TODAY && m.date <= plus(TODAY, 30));
const weekAgo = plus(TODAY, -7);

let surveys = [];
try {
  const rows = await rest('surveys?select=id,title,category,opens_at,closes_at,audience&deleted_at=is.null&order=closes_at.asc');
  const now = new Date().toISOString();
  surveys = rows.filter((s) => s.audience !== 'admins' && (!s.opens_at || s.opens_at <= now) && s.closes_at && s.closes_at > now);
} catch (e) { console.error(`설문을 못 읽었다 — ${e.message}. 설문 절은 비운다.`); }

let changed = [];
try {
  const rows = await rest(`events?select=title,type,venue,end_date,updated_at&type=neq.소식&updated_at=gte.${weekAgo}&order=updated_at.desc`);
  changed = rows.filter((r) => !r.end_date || r.end_date >= TODAY).slice(0, 6);
} catch (e) { console.error(`보드를 못 읽었다 — ${e.message}. 보드 절은 순위만 싣는다.`); }

// `etc` 는 탭이 없다(2026-09-09) — 아래 `?? '#/survey'` 로 첫 갈래에 떨어진다
const ROUTE = { exhibition: '#/survey', datetime: '#/survey/datetime', meal: '#/survey/meal', club: '#/survey/club' };
const SEV = { urgent: '⚠', check: '✓', planning: '…' };

/* ── 조립 ────────────────────────────────────────────── */

const L = [];
L.push(`[41교구 전시·박물관 동아리] 주간 소식 · ${md(TODAY)}`);
L.push('');

L.push(`■ 정리봇 (${digest.period_label})`);
L.push(`${digest.summary}`);
for (const h of digest.highlights) L.push(`${SEV[h.severity] ?? '·'} ${h.title} — ${h.text}`);
if (digest.open_questions?.length) {
  L.push('확인 중:');
  for (const q of digest.open_questions.slice(0, 4)) L.push(`- ${q}`);
}
L.push('');

L.push('■ 다가오는 모임');
if (upcoming.length) {
  // 시각·장소는 첫 토막만 — 「16:50 집결 · 17:00~18:00 관람 · …」 은 달력 화면이 보여 준다
  const first = (s) => String(s ?? '').split(' · ')[0];
  for (const m of upcoming) L.push(`- ${md(m.date)} ${first(m.time)} · ${m.title}${m.venue ? ` · ${first(m.venue)}` : ''}`);
} else L.push('- 30일 안에 잡힌 모임이 없습니다.');
if (TENTATIVE.length) {
  for (const t of TENTATIVE) L.push(`- [조율 중 · ${t.tag}] ${t.text}`);
}
L.push('');

if (surveys.length) {
  L.push(SELF_SURVEY ? '■ 지금 답할 수 있는 설문' : '■ 톡방에서 진행 중인 투표');
  for (const s of surveys) {
    L.push(`- ${s.title} — ${md(s.closes_at.slice(0, 10))} 마감 → ${SELF_SURVEY ? '' : '현황 '}${SITE}${ROUTE[s.category] ?? '#/survey'}`);
  }
  L.push('');
}

L.push('■ 보드');
L.push(`- 영화 예매 순위(${MOVIE_RANKING_UPDATED_AT} KOBIS): ${MOVIES.slice(0, 3).map((m) => `${m.bookingRank}위 ${m.title}`).join(' · ')}`);
if (changed.length) {
  L.push(`- 이번 주 올리거나 고친 안내 ${changed.length}건: ${changed.map((r) => r.title).join(' · ')}`);
}
L.push(`→ ${SITE}#/`);
L.push('');
L.push(`일정·달력 ${SITE}#/calendar`);
L.push(`휴대폰 달력 구독(아이폰은 이 링크로) webcal://psunggu.github.io/exhibition-club-survey/club-calendar.ics`);
L.push('※ 사이트 자료에서 자동으로 모은 글입니다. 틀린 곳은 알려 주세요.');

// 봇 트리거 무력화 — 다른 봇이 반응해 되돌아오는 것을 막는다 (# → ＃)
const text = L.join('\n').replace(/#(?=[가-힣A-Za-z])/g, '＃');

/* ── 내보내기 ─────────────────────────────────────────── */

const outDir = path.join(ROOT, 'logs');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `weekly-notice-${TODAY.replace(/-/g, '')}.txt`);
fs.writeFileSync(out, `${text}\n`, 'utf8');

if (!NO_CLIP && process.platform === 'win32') {
  try {
    execFileSync('powershell.exe', ['-NoProfile', '-Command', `Set-Clipboard -Value ([System.IO.File]::ReadAllText('${out.replace(/'/g, "''")}', [System.Text.Encoding]::UTF8))`], { stdio: 'ignore' });
    console.error('(클립보드에 넣었다 — 톡방에서 Ctrl+V. 올리기 전에 한 번 읽는다)');
  } catch { console.error('(클립보드 복사 실패 — 파일에서 복사한다)'); }
}

console.log(text);
console.error(`\n파일: ${path.relative(ROOT, out).replace(/\\/g, '/')}`);
