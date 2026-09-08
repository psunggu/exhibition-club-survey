#!/usr/bin/env node
/**
 * validate-ics.mjs — 달력 구독 파일(club-calendar.ics)이 규격과 자료에 맞는지 본다.
 *
 *   node scripts/validate-ics.mjs
 *
 * 빌드 산출물이 아니라 **같은 함수를 여기서 직접 불러** 검사한다 — dist 가 없어도 돈다.
 * Node 의 타입 제거 기능으로 .ts 를 그대로 읽는다(Node 22.6+).
 *
 * 보는 것
 *   · MEETUPS 의 conf·done 항목 수 = VEVENT 수, id 마다 UID 하나
 *   · 날짜(DTSTART)가 자료의 date 와 같다
 *   · 모든 줄이 75옥텟 이하, 줄 끝은 CRLF, 'undefined' 없음
 *   · 시각 읽기(parseStartTime)가 실제 자료의 표기 꼴을 제대로 읽는다
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (p) => import(pathToFileURL(path.join(ROOT, p)).href);
const { MEETUPS } = await load('app/src/data/meetups.ts');
const { buildIcs, parseStartTime } = await load('app/src/lib/ics.ts');

const fails = [];
const fail = (m) => fails.push(m);

// 시각 읽기 — 실제 자료에 있는 표기 꼴이다. 새 꼴이 생기면 여기에 더한다.
const TIME_CASES = [
  ['오후 4시', '16:00'], ['오후 12:30', '12:30'], ['오전 10시', '10:00'], ['오후 2시', '14:00'],
  ['16:50 집결 · 17:00~18:00 관람 · 18:00~ 식사·티타임', '16:50'],
  ['오후 2시 50분 집결 · 오후 3시~5시 30분 일정', '14:50'],
  ['오후 7시~9시 30분 · 입장 마감 오후 8시 30분', '19:00'],
  ['오후 5시 · 90분 · 인터미션 없음', '17:00'],
  ['3부 예배 후', null], ['개별 관람', null], ['얼리버드 판매 마감일', null],
];
for (const [input, want] of TIME_CASES) {
  const got = parseStartTime(input);
  const gotS = got ? `${String(got.h).padStart(2, '0')}:${String(got.m).padStart(2, '0')}` : null;
  if (gotS !== want) fail(`시각 읽기 — '${input}' → ${gotS} (기대 ${want})`);
}

const ics = buildIcs(MEETUPS, { now: new Date(Date.UTC(2026, 7, 22)), siteUrl: 'https://example.invalid/#/calendar' });

if (!ics.startsWith('BEGIN:VCALENDAR\r\n') || !ics.endsWith('END:VCALENDAR\r\n')) fail('VCALENDAR 로 감싸여 있지 않다');
if (/[^\r]\n/.test(ics)) fail('줄 끝이 CRLF 가 아닌 곳이 있다');
if (ics.includes('undefined') || ics.includes('null')) fail("'undefined' 나 'null' 이 본문에 찍혔다");
const lines = ics.split('\r\n');
const enc = new TextEncoder();
for (const l of lines) if (enc.encode(l).length > 75) fail(`75옥텟 넘는 줄 — ${l.slice(0, 40)}…`);

const expected = MEETUPS.filter((m) => m.kind !== 'dead' && m.kind !== 'tent');
const events = ics.split('BEGIN:VEVENT').slice(1);
if (events.length !== expected.length) fail(`VEVENT ${events.length}개 — 자료의 모임 ${expected.length}건과 다르다`);

// 접힌 줄을 펴서 필드를 읽는다
const unfolded = ics.replace(/\r\n /g, '');
for (const m of expected) {
  const uid = `UID:${m.id}@`;
  const n = unfolded.split(uid).length - 1;
  if (n !== 1) { fail(`${m.id} — UID 가 ${n}개`); continue; }
  const block = unfolded.slice(unfolded.indexOf(uid));
  const dt = /DTSTART[^:]*:(\d{8})/.exec(block)?.[1];
  if (dt !== m.date.replace(/-/g, '')) fail(`${m.id} — DTSTART ${dt} 가 date ${m.date} 와 다르다`);
  if (!block.includes(`SUMMARY:${m.title.replace(/,/g, '\\,').replace(/;/g, '\\;')}`)) fail(`${m.id} — SUMMARY 가 제목과 다르다`);
}
const timed = expected.filter((m) => parseStartTime(m.time)).length;

if (fails.length) {
  console.error(`달력 구독 파일 검사 실패 — ${fails.length}건\n`);
  fails.forEach((f) => console.error(`  · ${f}`));
  process.exit(1);
}
console.log(`달력 구독 파일 검사 통과 — 모임 ${expected.length}건 (시각 있음 ${timed} · 종일 ${expected.length - timed}) · 시각 표기 ${TIME_CASES.length}꼴 · 줄 ${lines.length}`);
