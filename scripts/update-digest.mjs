#!/usr/bin/env node
/**
 * update-digest.mjs — 주간 정리봇 공개 요약을 **두 곳에 같은 값으로** 써 넣는다.
 *
 *   node scripts/update-digest.mjs <새 요약.json>
 *
 * 요약은 두 군데 있다. `app/public/weekly-digest.public.json` 이 본체이고,
 * `app/public/notice.js` 안의 `FALLBACK_DIGEST` 가 파일을 못 읽었을 때 쓰는 사본이다.
 * 한쪽만 고치면 validate-weekly-digest.mjs 가 어긋났다고 잡는다 —
 * 손으로 두 번 고치다 보면 반드시 어긋나므로, 한 값에서 둘 다 쓴다.
 *
 * **개인정보는 여기서 막지 않는다.** 막는 것은 검사기 쪽 일이고,
 * 이 파일은 옮겨 쓰기만 한다. 쓰고 나서 반드시 검사기를 돌린다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
if (!src) { console.error('쓰는 법: node scripts/update-digest.mjs <새 요약.json>'); process.exit(2); }

const next = JSON.parse(fs.readFileSync(src, 'utf8'));

const jsonPath = path.join(ROOT, 'app/public/weekly-digest.public.json');
const jsPath = path.join(ROOT, 'app/public/notice.js');

const prev = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// 본체
const eolOf = (s) => (s.includes('\r\n') ? '\r\n' : '\n');
const jsonRaw = fs.readFileSync(jsonPath, 'utf8');
const body = `${JSON.stringify(next, null, 2)}\n`;
fs.writeFileSync(jsonPath, body.replace(/\n/g, eolOf(jsonRaw)));

// notice.js 안의 사본. 들여쓰기를 원래 모양(2칸 안쪽)에 맞춘다.
const jsRaw = fs.readFileSync(jsPath, 'utf8');
const jsEol = eolOf(jsRaw);
const jsFlat = jsRaw.replace(/\r\n/g, '\n');
const re = /var FALLBACK_DIGEST = (\{[\s\S]*?\n {2}\});/u;
if (!re.test(jsFlat)) { console.error('notice.js 에서 FALLBACK_DIGEST 를 찾지 못했다'); process.exit(1); }
const indented = JSON.stringify(next, null, 2).split('\n')
  .map((l, i) => (i === 0 ? l : `  ${l}`)).join('\n');
fs.writeFileSync(jsPath, jsFlat.replace(re, `var FALLBACK_DIGEST = ${indented};`).replace(/\n/g, jsEol));

const n = (d) => `${d.highlights.length}건 · 결정 ${(d.decisions ?? []).length} · 확인중 ${(d.open_questions ?? []).length}`;
console.log('주간 정리봇 요약을 갱신했다 (본체 + notice.js 사본)');
console.log(`  전  ${prev.period_label} | ${prev.updated_label} | ${n(prev)}`);
console.log(`  후  ${next.period_label} | ${next.updated_label} | ${n(next)}`);
console.log('\n다음: node scripts/validate-weekly-digest.mjs');
