#!/usr/bin/env node
/**
 * validate-fixtures.mjs — 예시 회원 데이터가 예시인지 확인한다 (R-01-08).
 *
 *   node scripts/validate-fixtures.mjs
 *
 * 이 파일이 막으려는 것은 두 가지다.
 *
 *   1. 표(.md)와 원본(.json)이 어긋나는 것 — 둘 중 하나만 고치면 반드시 어긋난다
 *   2. 진짜 회원 데이터가 흘러 들어오는 것 — 예시 파일이 명부가 되는 순간 목적이 사라진다
 *
 * 금지 패턴 검사는 **표와 JSON 값에만** 건다. 문서 본문에는 "실제 주소를 넣지 마라" 같은
 * 설명이 들어가는데, 거기까지 훑으면 규칙을 적었다는 이유로 실패한다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MD = path.join(ROOT, 'docs/fixtures/sample-members.md');
const JSON_PATH = path.join(ROOT, 'docs/fixtures/sample-members.json');

const problems = [];
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

if (!fs.existsSync(MD) || !fs.existsSync(JSON_PATH)) {
  console.error('예시 파일이 없다 — docs/fixtures/sample-members.{md,json}');
  process.exit(1);
}

const members = JSON.parse(read(JSON_PATH)).members;
const md = read(MD);

// ── 1) 표와 JSON 대조
//    표는 | 이름 | `문자` | 구역 | ... 꼴이다. 빈 문자는 백틱 두 따옴표로 적는다.
const EMPTY = String.fromCharCode(39, 39);           // '' — 셸/정규식 인용 사고를 피해 코드로 만든다
const rows = [...md.matchAll(/^\|\s*([가-힣]{2,4})\s*\|\s*`([^`]*)`\s*\|\s*(\d)\s*\|/gm)]
  .map((m) => ({
    full_name: m[1],
    name_letter: m[2] === EMPTY ? '' : m[2],
    district: Number(m[3]),
  }));

if (rows.length !== members.length)
  problems.push(`행 수가 다르다 — 표 ${rows.length}명 · JSON ${members.length}명`);

rows.forEach((r, i) => {
  const j = members[i];
  if (!j) return;
  const same = r.full_name === j.full_name
    && r.name_letter === j.name_letter
    && r.district === j.district;
  if (!same)
    problems.push(`${i + 1}행이 어긋난다 — 표 ${r.full_name}/${r.name_letter || '(빈)'}/${r.district}구역`
      + ` vs JSON ${j.full_name}/${j.name_letter || '(빈)'}/${j.district}구역`);
});

// ── 2) 유니크 제약을 예시가 스스로 위반하지 않는지
//    unique (full_name, name_letter) 를 예시가 어기면 스키마를 못 믿게 된다
const seen = new Map();
for (const m of members) {
  const key = `${m.full_name}|${m.name_letter}`;
  if (seen.has(key)) problems.push(`unique (full_name, name_letter) 위반 — ${m.full_name}${m.name_letter}`);
  seen.set(key, true);
}

// ── 3) name_letter 는 빈 문자열이지 null 이 아니다
//    NULL 은 유니크 제약에서 서로 다른 값으로 취급돼 중복이 조용히 통과한다
for (const m of members) {
  if (m.name_letter === null || m.name_letter === undefined)
    problems.push(`${m.full_name}: name_letter 가 null 이다. 빈 문자열이어야 한다`);
  if (m.name_letter !== '' && !/^[A-Z]$/.test(m.name_letter))
    problems.push(`${m.full_name}: name_letter 는 빈 문자열이거나 대문자 한 글자다 (현재 ${JSON.stringify(m.name_letter)})`);
}

// ── 4) 예시가 덮어야 할 경우가 빠지지 않았는지
const sameDistrictDup = members.some((a, i) => members.some((b, k) =>
  k !== i && a.full_name === b.full_name && a.district === b.district));
if (!sameDistrictDup)
  problems.push('같은 구역 동명이인이 없다 — 표시 이름이 갈리지 않는 경우라 반드시 하나는 있어야 한다');
if (!members.some((m) => m.status === 'pending'))
  problems.push('승인 대기(pending) 예시가 없다');
if (!members.some((m) => m.role === 'staff') || !members.some((m) => m.role === 'admin'))
  problems.push('staff · admin 예시가 둘 다 있어야 한다');

// ── 5) 진짜 데이터가 들어왔는지 — 값에만 건다
const FORBIDDEN = [
  [/@(gmail|naver|daum|hanmail|kakao|nate|outlook|hotmail|yahoo)\./i, '실제 메일 도메인'],
  [/\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b/, '휴대전화 번호'],
  [/\b\d{6}[-\s]?[1-4]\d{6}\b/, '주민등록번호 꼴'],
  [/"(email|phone|tel|mobile|birth|address|account)"\s*:/i, '받지 않기로 한 항목'],
];
const values = members.flatMap((m) => Object.values(m).map(String));
const tableCells = rows.flatMap((r) => [r.full_name, r.name_letter, String(r.district)]);
for (const [pattern, label] of FORBIDDEN)
  for (const v of [...values, ...tableCells])
    if (pattern.test(v)) problems.push(`${label}로 보이는 값이 있다: ${v}`);

// JSON 은 값 말고 키에도 걸어야 한다
const keys = [...new Set(members.flatMap(Object.keys))];
for (const k of keys)
  if (/email|phone|tel|mobile|birth|address|account/i.test(k))
    problems.push(`받지 않기로 한 항목이 키에 있다: ${k}`);

// ── 보고
if (problems.length) {
  console.error('예시 회원 데이터 검사 실패\n');
  problems.forEach((p) => console.error(`  · ${p}`));
  console.error('\ndocs/fixtures/sample-members.md 의 규칙을 본다.\n');
  process.exit(1);
}
console.log(
  `예시 회원 데이터 검사 통과 — ${members.length}명 · 표와 JSON 일치 · `
  + `동명이인 ${members.length - new Set(members.map((m) => m.full_name)).size}쌍 · 금지 항목 없음`);
