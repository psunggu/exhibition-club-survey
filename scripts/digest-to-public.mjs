#!/usr/bin/env node
/**
 * digest-to-public.mjs — kakao-digest 가 만든 요약(개인정보 포함)을
 * 공개용 `weekly-digest.public.json` 으로 옮겨 쓴다.
 *
 *   node scripts/digest-to-public.mjs <kakao-digest/output/digest-YYYYMMDD-YYYYMMDD.json>
 *   node scripts/digest-to-public.mjs <…> --dry-run     쓰지 않고 결과만 보여 준다
 *
 * 예전에는 사람이(대개 Claude 세션이) 원본 요약을 읽고 공개본을 처음부터 다시 썼다.
 * 이 스크립트는 **틀을 기계로 채우고**, 사람은 결과를 훑어 문구만 다듬는다.
 * 다듬을 것이 없으면 그대로 커밋한다.
 *
 * ── 원본 → 공개본 대응 ─────────────────────────────────
 *   period_start · period_end     → period_label   「8월 15일 ~ 9월 1일」
 *   generated_at                  → updated_label  「2026. 9. 2. 02:39 기준」
 *   message_count                 → message_count
 *   decisions[0] (없으면 topics[0]) → summary
 *   events (지나지 않은 것만)      → highlights    확정 → check · 논의중/미정 → planning
 *   decisions · open_questions    → 그대로 (8개 · 180자 한도)
 *
 * ── 개인정보 ────────────────────────────────────────────
 * 원본은 익명화돼 「멤버 3」 같은 내부 식별자가 남는다. 전부 「회원」 으로 바꾼다.
 * 그 밖에 이름·전화·이메일로 보이는 것이 남으면 **쓰지 않고 멈춘다.**
 * 마지막 방어선은 validate-weekly-digest.mjs 다 — 이 스크립트가 통과시켜도 그쪽이 다시 본다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app/public/weekly-digest.public.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const src = args.find((a) => !a.startsWith('--'));
if (!src) {
  console.error('쓰는 법: node scripts/digest-to-public.mjs <digest-….json> [--dry-run]');
  process.exit(2);
}

const raw = JSON.parse(fs.readFileSync(src, 'utf8'));

/* ── 날짜 ────────────────────────────────────────────── */

const kDate = (iso) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${m}월 ${d}일`;
};
const seoulLabel = (isoOrNull) => {
  const d = isoOrNull ? new Date(isoOrNull) : new Date();
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  // 「2026. 9. 2. 02:39 기준」 — 달·날은 0 을 떼고, 시각은 두 자리
  return `${p.year}. ${Number(p.month)}. ${Number(p.day)}. ${p.hour === '24' ? '00' : p.hour}:${p.minute} 기준`;
};
const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
// 정오(KST)로 두면 UTC 로도 같은 날이라 요일이 어긋나지 않는다
const dateWithDay = (iso) => `${kDate(iso)}(${WEEKDAY[new Date(`${iso}T12:00:00+09:00`).getUTCDay()]})`;

/* ── 글자 ────────────────────────────────────────────── */

const scrub = (s) => String(s ?? '')
  .replace(/멤버\s*\d+/g, '회원')
  // LLM 은 날짜를 ISO 로 적는다. 회원 화면은 「9월 19일」 이다.
  .replace(/\b\d{4}-(\d{2})-(\d{2})\b/g, (_, m, d) => `${Number(m)}월 ${Number(d)}일`)
  .replace(/[<>]/g, '')
  .replace(/\s+/g, ' ')
  .trim();
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

/* ── 조립 ────────────────────────────────────────────── */

const decisions = (raw.decisions ?? []).map(scrub).filter(Boolean).slice(0, 8).map((s) => clip(s, 180));
const openQuestions = (raw.open_questions ?? []).map(scrub).filter(Boolean).slice(0, 8).map((s) => clip(s, 180));
const topics = (raw.topics ?? []).map(scrub).filter(Boolean);

const summary = clip(decisions[0] ?? topics[0] ?? '이번 기간에는 새로 정해진 것이 없습니다.', 160);

const highlights = [];
for (const e of raw.events ?? []) {
  if (e.date && e.date < todayIso) continue;          // 지난 일정은 싣지 않는다
  const confirmed = e.status === '확정';
  const facts = [
    e.date ? `${dateWithDay(e.date)}${e.time ? ` ${e.time}` : ''}` : '날짜 미정',
    e.place ?? null,
    e.note ?? null,
  ].filter(Boolean).map(scrub);
  highlights.push({
    severity: confirmed ? 'check' : 'planning',
    label: confirmed ? '확정' : (e.status === '논의중' ? '조율 중' : '미정'),
    title: clip(scrub(e.title), 80),
    text: clip(facts.join(' · '), 240),
  });
  if (highlights.length >= 8) break;
}
if (!highlights.length) {
  highlights.push({
    severity: 'check',
    label: '확인 필요',
    title: clip(openQuestions[0] ?? '이번 기간 확인할 일정이 없습니다', 80),
    text: clip(openQuestions[0] ?? '새로 잡힌 모임이 없습니다. 다음 정리 때 다시 안내합니다.', 240),
  });
}

const next = {
  schema_version: 2,
  bot_name: '주간 정리봇',
  period_label: `${kDate(raw.period_start)} ~ ${kDate(raw.period_end)}`,
  updated_label: seoulLabel(raw.generated_at),
  message_count: Number(raw.message_count ?? 0),
  summary,
  highlights,
  decisions,
  open_questions: openQuestions,
};

/* ── 개인정보 방어선 (validate-weekly-digest.mjs 와 같은 눈) ── */

const sensitive = [
  ['이메일', /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/u],
  ['전화번호', /(?:01[016789]|0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}/u],
  ['소속번호+이름', /(?:^|[^\d])\d{4}[\s/_.\-|]*[가-힣]{2,4}(?:$|[^가-힣])/u],
  ['구역+이름', /\d{1,2}\s*구역\s*[가-힣]{2,4}/u],
  ['카카오 대화 원문 형식', /\[[^\]\r\n]+\]\s*\[[^\]\r\n]+\]/u],
];
const flat = JSON.stringify(next);
const hits = sensitive.map(([label, re]) => [label, flat.match(re)?.[0]]).filter(([, h]) => h);
if (hits.length) {
  console.error('개인정보로 보이는 값이 있어 쓰지 않았다 — 원본 요약에서 그 줄을 고치고 다시 돌린다');
  hits.forEach(([label, h]) => console.error(`  · ${label}: ${JSON.stringify(h.trim())}`));
  process.exit(1);
}

/* ── 출력 ────────────────────────────────────────────── */

console.log(`${next.period_label} | ${next.updated_label} | 대화 ${next.message_count}건`);
console.log(`요약  ${next.summary}`);
console.log(`확인사항 ${highlights.length} · 결정 ${decisions.length} · 확인중 ${openQuestions.length}`);
highlights.forEach((h) => console.log(`  [${h.severity}] ${h.label} — ${h.title}`));

if (dryRun) {
  console.log('\n--dry-run — 파일은 건드리지 않았다');
  process.exit(0);
}

const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
const eol = prev.includes('\r\n') ? '\r\n' : '\n';
fs.writeFileSync(OUT, `${JSON.stringify(next, null, 2)}\n`.replace(/\n/g, eol));
console.log(`\n썼다 — ${path.relative(ROOT, OUT).replace(/\\/g, '/')}`);
console.log('다음: node scripts/validate-weekly-digest.mjs  (문구를 다듬었으면 다시 돌린다)');
