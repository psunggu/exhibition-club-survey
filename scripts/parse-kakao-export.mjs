#!/usr/bin/env node
/**
 * parse-kakao-export.mjs — 카카오톡 대화 내보내기에서 **일정만** 뽑는다.
 *
 *   node scripts/parse-kakao-export.mjs "<대화.txt>"            일정 후보만
 *   node scripts/parse-kakao-export.mjs "<대화.txt>" --since 2026-08-14
 *   node scripts/parse-kakao-export.mjs "<대화.txt>" --all      전체(가려진 채로)
 *
 * ── 이 파일이 지켜야 하는 것 ────────────────────────────────
 * 이 저장소는 **공개**다. 대화 원본에는 오픈채팅 프로필 규칙(교구+성명) 때문에
 * `4133/박성규` 같은 **구역번호 + 실명**이 줄마다 들어 있다.
 * 그래서 원본은 저장소 바깥(C:\D\교회\…)에 두고, .gitignore 가 혹시 들어와도 막는다.
 *
 * 이 스크립트는 **원본을 절대 그대로 내보내지 않는다.** 내보내기 전에
 *   · 말한 사람 이름 → `회원1` 처럼 고정된 가명 (같은 사람은 늘 같은 번호)
 *   · 본문 속 `구역/이름` → `[회원]`
 *   · 전화·계좌·이메일·주민등록 꼴 숫자 → 종류만 남기고 지움
 * 를 거친다. 가명은 대화의 흐름을 따라가려고 두는 것이지 누구인지 알려고 두는 게 아니다.
 *
 * 지운 자리는 **개수를 세어 보고한다.** 조용히 지우면 검사기가 있으나 마나다.
 */

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith('--'));
const wantAll = argv.includes('--all');
const sinceArg = argv[argv.indexOf('--since') + 1];
const since = argv.includes('--since') ? sinceArg : null;

if (!file) {
  console.error('쓰는 법: node scripts/parse-kakao-export.mjs "<대화.txt>" [--since 2026-08-14] [--all]');
  process.exit(2);
}
if (!fs.existsSync(file)) { console.error(`파일이 없다: ${file}`); process.exit(2); }

/* ── 지우개 ──────────────────────────────────────────────── */

const redactions = new Map();
const count = (k) => redactions.set(k, (redactions.get(k) ?? 0) + 1);

/** 같은 사람은 늘 같은 번호. 이름 자체는 어디에도 남기지 않는다. */
const alias = new Map();
/**
 * **명단은 대화가 알려 준다.** 말한 사람 칸이 곧 이 방의 회원 명부다
 * (`4133/박성규` 꼴). 거기서 성명과 이름을 모아 두었다가 본문에서도 지운다.
 *
 * 이게 필요한 이유: 호칭 규칙만으로는 샌다. 실제로 `준섭 형제님` 이
 * 그대로 빠져나갔다 — `형제` 를 목록에 안 넣었고, 이름만 부르는 자리는
 * 규칙으로 잡을 수 없기 때문이다. 명부로 지우면 부르는 방식과 무관하게 걸린다.
 */
const roster = new Set();
const noteName = (display) => {
  const m = /(?:\d{3,4}\s*\/\s*)?([가-힣]{2,4})/.exec(display.trim());
  if (!m) return;
  const full = m[1];
  if (full.length >= 2) roster.add(full);
  if (full.length >= 3) roster.add(full.slice(1));   // 성을 뗀 이름
};
const aliasFor = (name) => {
  const key = name.trim();
  if (!alias.has(key)) { alias.set(key, `회원${alias.size + 1}`); noteName(key); }
  return alias.get(key);
};

/**
 * 본문에서 지운다. **순서가 중요하다** — 전화번호를 먼저 지우지 않으면
 * `구역/이름` 규칙이 숫자 일부를 먹어 엉뚱하게 남는다.
 */
function scrub(s) {
  let t = s;
  t = t.replace(/\b01[016789][-. ]?\d{3,4}[-. ]?\d{4}\b/g, () => { count('연락처'); return '[연락처]'; });
  t = t.replace(/\b\d{6}[-]\d{7}\b/g, () => { count('주민등록번호꼴'); return '[식별번호]'; });
  t = t.replace(/\b\d{2,3}-\d{2,6}-\d{2,6}\b/g, () => { count('계좌'); return '[계좌]'; });
  t = t.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, () => { count('메일'); return '[메일]'; });
  // 오픈채팅 프로필 규칙: 4133/박성규
  t = t.replace(/\b\d{3,4}\s*\/\s*[가-힣]{2,4}\b/g, () => { count('구역+이름'); return '[회원]'; });
  // 호칭이 붙은 실명. `형제·자매` 를 빠뜨렸다가 `준섭 형제님` 이 새어 나갔다.
  t = t.replace(/[가-힣]{2,4}\s*(방장|집사|권사|장로|목사|전도사|간사|형제|자매|형님|누님|선생님)(님)?/g,
    (_, r) => { count('이름+호칭'); return `[회원] ${r}`; });
  // 명부에 있는 이름은 부르는 방식과 상관없이 지운다. 긴 이름부터 지워야
  // `박성규` 가 `성규` 로 먼저 잘려 반쪽만 남는 일이 없다.
  for (const n of [...roster].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (re.test(t)) t = t.replace(re, () => { count('명부 이름'); return '[회원]'; });
  }
  return t;
}

/* ── 읽기 ────────────────────────────────────────────────── */

const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const lines = raw.split('\n');

const DATE_SEP = /^-{5,}\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*([월화수목금토일])요일\s*-{5,}$/;
const SPEAK = /^\[([^\]]+)\]\s*\[(오전|오후)\s*(\d{1,2}):(\d{2})\]\s*([\s\S]*)$/;
/** 들어왔다·나갔다·내보냈다 — 사람 목록 그 자체라 통째로 버린다 */
const SYSTEM = /(들어왔습니다|나갔습니다|내보냈습니다|방장이 되었습니다|공지로 등록)/;

const p2 = (n) => String(n).padStart(2, '0');
const msgs = [];
let date = null;
let cur = null;
const push = () => { if (cur && cur.text.trim()) msgs.push(cur); cur = null; };

for (const line of lines) {
  const d = DATE_SEP.exec(line.trim());
  if (d) { push(); date = `${d[1]}-${p2(+d[2])}-${p2(+d[3])}`; continue; }

  const m = SPEAK.exec(line);
  if (m) {
    push();
    if (!date) continue;
    let h = Number(m[3]) % 12;
    if (m[2] === '오후') h += 12;
    cur = { date, time: `${p2(h)}:${m[4]}`, who: aliasFor(m[1]), text: m[5] };
    continue;
  }
  // 앞 줄에 이어지는 여러 줄 메시지
  if (cur) { cur.text += `\n${line}`; continue; }
  if (SYSTEM.test(line)) count('입퇴장 안내');
}
push();

const kept = msgs
  .filter((m) => !SYSTEM.test(m.text))
  .filter((m) => !since || m.date >= since)
  .map((m) => ({ ...m, text: scrub(m.text).trim() }))
  .filter((m) => m.text && !/^(사진|동영상|이모티콘|삭제된 메시지|파일: )/.test(m.text));

/* ── 일정으로 보이는 것 고르기 ───────────────────────────── */

/**
 * 잡담 4천 줄에서 일정만 건지려는 것이다. 놓치는 것보다 더 가져오는 쪽이 낫다 —
 * 사람이 눈으로 한 번 더 거를 것이므로.
 */
const DATEISH = /(\d{1,2}\s*월\s*\d{1,2}\s*일|\d{1,2}\/\d{1,2}|\d{1,2}일\s*\(?[월화수목금토일]\)?|다음\s*주|이번\s*주|내일|모레|주말|평일)/;
const TIMEISH = /(오전|오후)\s*\d{1,2}\s*시|\b\d{1,2}:\d{2}\b|\d{1,2}\s*시\s*(\d{1,2}\s*분)?/;
const PLANISH = /(확정|미정|모임|관람|집결|모집|마감|예매|일정|공지|참석|투표|신청|취소|연기|변경|장소|만나|출발|티켓|얼리버드|할인|전시|공연|영화)/;

/**
 * 일정 이야기는 짧다. 긴 글은 전시 감상문이지 일정이 아니다 —
 * 실제로 3천 자짜리 감상문이 `전시·작품` 때문에 점수를 얻어 딸려 왔다.
 * 회원이 쓴 글이라 옮겨 둘 이유도 없다.
 */
const MAX = 400;
const score = (t) => (DATEISH.test(t) ? 2 : 0) + (TIMEISH.test(t) ? 2 : 0) + (PLANISH.test(t) ? 1 : 0);
const picked = wantAll ? kept : kept.filter((m) => {
  if (m.text.length > MAX) return false;
  // 날짜가 없으면 일정이 아니다. 시각이나 일정 낱말만으로는 부족하다.
  return DATEISH.test(m.text) && score(m.text) >= 3;
});

/* ── 내보내기 ────────────────────────────────────────────── */

let last = '';
for (const m of picked) {
  if (m.date !== last) { console.log(`\n──────── ${m.date}`); last = m.date; }
  const body = m.text.split('\n').map((l, i) => (i ? `           ${l}` : l)).join('\n');
  console.log(`  ${m.time} ${m.who.padEnd(6)} ${body}`);
}

const total = redactions.size ? [...redactions].map(([k, v]) => `${k} ${v}`).join(' · ') : '없음';
console.log(`\n────────────────────────────────────────────`);
console.log(`파일    ${path.basename(file)}`);
console.log(`메시지  전체 ${msgs.length} · 남긴 것 ${kept.length} · 일정 후보 ${picked.length}`);
console.log(`말한이  ${alias.size}명 (가명 처리)`);
console.log(`지운 것 ${total}`);
console.log(`\n※ 이름은 전부 가명이다. 원본은 저장소 바깥에 두고 커밋하지 않는다.`);
