#!/usr/bin/env node
/**
 * validate-survey-admin-ui.mjs — 운영자 화면을 실제로 눌러 본다.
 *
 *   node scripts/validate-survey-admin-ui.mjs
 *
 * ── 가짜 서버는 진짜와 **똑같이** 굴어야 한다 ──────────────
 * 지난번에 여기서 크게 데였다. survey_submit 이 `null` 이라는 본문 있는 답을
 * 주도록 흉내 냈는데, 진짜 PostgREST 는 **204 빈 본문**을 준다.
 * 그래서 검사는 통과하고 라이브에서만 제출이 깨졌다.
 *
 * 그 규칙을 여기서도 지킨다 —
 *   아무것도 안 돌려주는 함수(survey_admin_delete)  → 204 · 빈 본문
 *   값을 돌려주는 함수(survey_admin_save → uuid)     → 200 · JSON
 *   여러 행을 돌려주는 함수                          → 200 · 배열
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '/exhibition-club-survey';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('playwright 가 없어 건너뛴다'); process.exit(0); }

const fails = [];
const ok = (label, cond, detail = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) fails.push(label);
};

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css',
  '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (u.startsWith(BASE)) u = u.slice(BASE.length);
  if (u === '' || u === '/') u = '/index.html';
  fs.readFile(path.join(ROOT, 'dist', u), (e, d) => {
    if (e) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(u)] ?? 'application/octet-stream' });
    res.end(d);
  });
});
await new Promise((r) => server.listen(8265, r));

const PW = '맞는암호';
let saved = null;       // 마지막으로 저장된 payload
let deleted = [];
let surveys = [{
  id: 'srv-1', title: '9월 정기 관람 전시 추천', closes_at: new Date(Date.now() + 86400e3).toISOString(),
  created_by: '박지현', multi_choice: true, results_visible: 'always', show_names: 'none',
  option_count: 4, response_count: 3,
}];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 900 },
  locale: 'ko-KR', timezoneId: 'Asia/Seoul' });

await ctx.route('**/rest/v1/**', async (route) => {
  const url = route.request().url();
  const json = (b) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
  const noContent = () => route.fulfill({ status: 204, body: '' });
  const deny = (m) => route.fulfill({ status: 400, contentType: 'application/json',
    body: JSON.stringify({ message: m }) });

  if (url.includes('/rest/v1/surveys')) {
    return json([{ id: 'srv-1', title: '9월 정기 관람 전시 추천', intro: '골라 주세요.',
      multi_choice: true, opens_at: new Date(Date.now() - 3600e3).toISOString(),
      closes_at: new Date(Date.now() + 86400e3).toISOString(), created_by: '박지현',
      results_visible: 'always', show_names: 'none', hide_after_days: null,
      survey_options: [
        { id: 'o1', position: 1, title: '서도호 개인전', period: '2026. 8. 27. ~ 2027. 2. 9.',
          venue: '국립현대미술관 서울', hours: null, price: '8,000원 / 얼리버드 6,400원',
          note: '얼리버드 예매 8/17~8/26',
          links: [{ kind: 'video', label: '참고 영상', url: 'https://youtu.be/x' }] },
        { id: 'o2', position: 2, title: '에스 데블린', period: '2026. 8. 20. ~ 2027. 1. 17.',
          venue: '푸투라서울', hours: null, price: '22,000원', note: null, links: [] },
        { id: 'o3', position: 3, title: '이대원', period: '2026. 8. 6. ~ 11. 8.',
          venue: '국립현대미술관 덕수궁관', hours: null,
          price: '2,000원 + 덕수궁 입장료 1,000원', note: null, links: [] },
      ] }]);
  }

  if (!url.includes('/rpc/')) return route.continue();
  const name = url.split('/rpc/')[1].split('?')[0];
  let body = {};
  try { body = JSON.parse(route.request().postData() ?? '{}'); } catch { /* 그대로 */ }

  // **암호 확인은 진짜처럼 서버가 한다.** 화면이 우회해도 여기서 막혀야 한다.
  if (name.startsWith('survey_admin') && name !== 'survey_admin_ok') {
    if (body.p_password !== PW) return deny('운영자 암호가 맞지 않습니다.');
  }

  if (name === 'survey_admin_names') return json([{ name: '박지현' }, { name: '박성규' }]);
  if (name === 'survey_admin_list') return json(surveys.filter((s) => !deleted.includes(s.id)));
  if (name === 'survey_admin_save') {
    const p = body.p_payload ?? {};
    if (!String(p.title ?? '').trim()) return deny('설문 제목을 적어 주세요.');
    const n = (p.options ?? []).length;
    if (n < 1 || n > 5) return deny('후보는 1개에서 5개까지 넣을 수 있습니다.');
    if (!String(p.created_by ?? '').trim()) return deny('올린 사람을 운영자 명단에서 고르세요.');
    if (!(p.days >= 1 && p.days <= 90)) return deny('받는 기간은 1일에서 90일 사이로 정해 주세요.');
    /**
     * **진짜 함수가 보는 것을 여기서도 본다.**
     * 처음에는 빈 후보 제목을 통과시켰고, 그래서 "서버가 막는다" 검사가
     * 막지 않는 서버를 상대로 도는 셈이 됐다. 가짜가 관대하면 검사가 헐거워진다.
     */
    for (const [i, o] of (p.options ?? []).entries()) {
      if (!String(o.title ?? '').trim()) return deny(`${i + 1}번째 후보의 제목이 비어 있습니다.`);
      for (const l of o.links ?? []) {
        if (!/^https:\/\//.test(l.url ?? '')) return deny('링크는 https 로 시작해야 합니다.');
        if (!['official', 'video', 'article', 'map', 'booking'].includes(l.kind)) {
          return deny('링크 종류가 알 수 없는 값입니다.');
        }
        if (!String(l.label ?? '').trim()) return deny('링크 이름이 비어 있습니다.');
      }
    }
    saved = p;
    if (!p.id) surveys = [...surveys, { id: 'srv-new', title: p.title,
      closes_at: new Date(Date.now() + p.days * 86400e3).toISOString(),
      created_by: p.created_by, multi_choice: p.multi_choice,
      results_visible: p.results_visible, show_names: p.show_names,
      option_count: n, response_count: 0 }];
    return json('srv-new');                       // uuid 를 돌려준다
  }
  if (name === 'survey_admin_delete') { deleted.push(body.p_survey); return noContent(); }
  if (name === 'survey_admin_results') {
    return json([
      { option_id: 'o1', option_position: 1, option_title: '서도호 개인전', votes: 2,
        voters: ['4133 김하늘', '4112 박서준'] },
      { option_id: 'o2', option_position: 2, option_title: '에스 데블린', votes: 0, voters: [] },
      { option_id: 'o3', option_position: 3, option_title: '이대원', votes: 1, voters: ['4121 이가온'] },
    ]);
  }
  if (name === 'survey_admin_respondents') {
    return json([
      { who: '4133 김하늘', answered_at: new Date(Date.now() - 7200e3).toISOString(), picks: 1 },
      { who: '4112 박서준', answered_at: new Date(Date.now() - 3600e3).toISOString(), picks: 1 },
      { who: '4121 이가온', answered_at: new Date(Date.now() - 600e3).toISOString(), picks: 1 },
    ]);
  }
  return json([]);
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('dialog', (d) => d.accept());            // 지우기 확인창

const go = async () => {
  await page.goto('about:blank');
  await page.goto(`http://localhost:8265${BASE}/#/survey/admin`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.survey-who', { timeout: 20000 });
  await page.waitForTimeout(400);
};

/* ── 1. 암호 ────────────────────────────────────────────── */

console.log('\n── 암호');
await go();
ok('암호를 먼저 묻는다', (await page.$$('.admin-card')).length === 0);
ok('암호 칸이 가려진다',
  await page.$eval('.admin-input', (e) => e.type === 'password'));

await page.fill('.admin-input', '틀린암호');
await page.click('.survey-who .survey-submit');
await page.waitForTimeout(600);
ok('틀린 암호는 막힌다',
  (await page.$eval('.survey-message.error', (e) => e.textContent.trim()).catch(() => ''))
    .includes('암호'));
ok('틀린 암호로는 목록이 안 보인다', (await page.$$('.admin-card')).length === 0);

await page.fill('.admin-input', PW);
await page.click('.survey-who .survey-submit');
await page.waitForTimeout(800);
ok('맞는 암호로 들어간다', (await page.$$('.admin-card')).length === 1);
ok('응답 수가 보인다',
  (await page.$eval('.admin-card', (e) => e.textContent)).includes('3건'));

/* ── 1-2. 결과 보기 ────────────────────────────────────── */

console.log('\n── 결과 보기');
/** 자리(index)로 찾으면 버튼이 하나 늘 때마다 어긋난다 — 실제로 그랬다. 글자로 찾는다. */
const cardBtn = async (n, text) => {
  const cards = await page.$$('.admin-card');
  const btns = await cards[n].$$('.admin-mini');
  for (const b of btns) {
    if ((await b.textContent()).trim() === text) return b;
  }
  throw new Error(`카드 ${n} 에서 「${text}」 버튼을 못 찾았다`);
};
await (await cardBtn(0, '결과 보기')).click();
await page.waitForSelector('.admin-results', { timeout: 8000 });
await page.waitForTimeout(500);

const bars = await page.$$eval('.admin-result-votes', (es) => es.map((e) => e.textContent.trim()));
ok('후보별 표 수가 보인다', bars.length === 3, bars.join(' · '));
const voters = await page.$$eval('.admin-voter', (es) => es.map((e) => e.textContent.trim()));
ok('누가 골랐는지 이름이 보인다', voters.length === 3, voters.join(', '));
ok('이름에 구역번호가 붙는다', voters.every((v) => /^\d{3,4} /.test(v)));
ok('표가 0인 후보는 그렇게 말한다',
  (await page.$eval('.admin-results', (e) => e.textContent)).includes('아직 고른 사람이 없습니다'));
ok('참여자 수가 보인다',
  (await page.$eval('.admin-results-sum', (e) => e.textContent.trim())).includes('3명'));
ok('참여자 목록이 있다', (await page.$$('.admin-person')).length === 3);

/**
 * **막대가 실제로 그려지는지 잰다.**
 * `.survey-bar` 는 회원 화면에서 flex 안에 놓여 `flex-grow` 로 폭을 얻는데,
 * 여기서는 블록 안이라 inline 인 채 0×0 이 됐다 — 화면에는 그냥 막대가 없었다.
 * 있는지 없는지를 눈으로만 보면 놓친다.
 */
/**
 * **여러 개 고르는 설문에는 파이/도넛을 그리면 안 된다.**
 * 조각을 더하면 100%가 넘는데 그림은 전체를 나눈 것처럼 보인다.
 * 이 설문(srv-1)은 multi_choice 라 가로 막대여야 한다.
 */
ok('여러 개 고르는 설문은 막대다', (await page.$$('.chart-bars')).length === 1);
ok('여러 개 고르는 설문에 도넛이 없다', (await page.$('.chart-donut')) === null);
ok('분모가 응답자 수임을 밝힌다',
  (await page.$eval('.chart-caption', (e) => e.textContent.trim())).includes('응답자 수를 넘습니다'));

const barBoxes = await page.$$eval('.chart-track', (es) => es.map((e) => {
  const r = e.getBoundingClientRect();
  const i = e.querySelector('.chart-fill');
  return { w: Math.round(r.width), h: Math.round(r.height),
    fill: i ? Math.round(i.getBoundingClientRect().width) : 0 };
}));
ok('막대에 크기가 있다', barBoxes.length === 3 && barBoxes.every((b) => b.w > 40 && b.h >= 4),
  barBoxes.map((b) => `${b.w}×${b.h}`).join(' · '));
ok('표가 많은 쪽이 더 길다',
  barBoxes[0].fill > barBoxes[2].fill && barBoxes[2].fill > barBoxes[1].fill,
  barBoxes.map((b) => b.fill).join(' · '));

// 색만으로 알아보게 하지 않는다 — 마크 옆에 이름이 붙어 있어야 한다
const barNames = await page.$$eval('.chart-bar-name', (es) => es.map((e) => e.textContent.trim()));
ok('막대마다 이름이 붙어 있다', barNames.length === 3, barNames.join(' · '));

// 같은 데이터를 두 번 그리지 않는다
ok('아래 목록에 막대를 또 그리지 않는다',
  (await page.$$('.admin-result .survey-bar')).length === 0);

/* ── 1-3. 분석 ─────────────────────────────────────────── */

console.log('\n── 작품 특징 분석');
ok('특징 표가 있다', (await page.$$('.analysis-row')).length === 4, '머리줄 + 후보 3');

const analysisText = await page.$eval('.analysis', (e) => e.textContent);
ok('관람료를 읽어 냈다', analysisText.includes('8,000원') && analysisText.includes('22,000원'),
  '8,000 / 22,000');
// `2,000원 + 덕수궁 입장료 1,000원` → 함께 내야 하는 돈이라 더한다
ok('같이 내는 관람료를 더한다', analysisText.includes('3,000원'));
// `2026. 8. 6. ~ 11. 8.` — 끝에 해가 없으면 시작 해를 쓴다
ok('해가 생략된 기간을 읽어 낸다', analysisText.includes('2026. 11. 8.'));
ok('얼리버드를 표시한다', (await page.$$('.analysis-flag')).length === 1);

/**
 * 응답 3명이면 기준(ENOUGH=3)을 채우므로 경향 문장이 나오고 경고는 안 나온다.
 * 그 반대쪽(1~2명이면 경향을 말하지 않는 것)은 화면을 다시 그려야 해서
 * 여기서 재지 않는다 — 대신 기준을 넘겼을 때 실제로 문장이 나오는지를 본다.
 */
ok('기준을 넘기면 경향을 말한다', (await page.$$('.analysis-lines li')).length > 0,
  `${(await page.$$('.analysis-lines li')).length}줄`);
ok('기준을 넘기면 "이릅니다" 경고가 없다', !analysisText.includes('경향을 말하기는 이릅니다'));
ok('회원 화면과 다르다는 안내가 있다',
  (await page.$eval('.admin-results', (e) => e.textContent)).includes('운영자 화면에서만'));

// 다시 누르면 접힌다 — 설문이 여러 개일 때 목록이 이름에 묻히지 않게
await (await cardBtn(0, '결과 닫기')).click();
await page.waitForTimeout(400);
ok('다시 누르면 접힌다', (await page.$$('.admin-results')).length === 0);

/* ── 2. 새 설문 ─────────────────────────────────────────── */

console.log('\n── 새 설문 올리기');
await page.click('.survey-actions .survey-submit');   // 새 설문 올리기
await page.waitForSelector('.admin-form', { timeout: 5000 });

const inputs = await page.$$('.admin-form .admin-input');
await inputs[0].fill('10월 정기 관람 전시 추천');
await page.waitForTimeout(200);

// 제목 없는 후보로 저장하면 서버가 막아야 한다
const saveBtn = async () => (await page.$$('.admin-form .survey-submit'))[0];
await (await saveBtn()).click();
await page.waitForTimeout(700);
ok('빈 후보를 서버가 막는다',
  (await page.$eval('.admin-form .survey-message.error', (e) => e.textContent.trim()).catch(() => ''))
    .length > 0);

// 후보를 채운다
const all = await page.$$('.admin-option .admin-input');
await all[0].fill('구정아 개인전');
await page.waitForTimeout(150);

// 링크에 http 를 넣으면 막혀야 한다
await page.click('.admin-links .admin-mini');
await page.waitForTimeout(250);
const linkRow = await page.$$('.admin-link-row .admin-input');
await linkRow[1].fill('참고 영상');
await linkRow[2].fill('http://example.com');
await (await saveBtn()).click();
await page.waitForTimeout(700);
ok('https 아닌 링크를 막는다',
  (await page.$eval('.admin-form .survey-message.error', (e) => e.textContent.trim()).catch(() => ''))
    .includes('https'));

await linkRow[2].fill('https://youtu.be/abc');
await (await saveBtn()).click();
await page.waitForTimeout(900);

ok('저장됐다', saved !== null);
ok('제목이 그대로 갔다', saved?.title === '10월 정기 관람 전시 추천', saved?.title);
ok('올린 사람이 채워졌다', !!saved?.created_by, saved?.created_by);
ok('후보 1개를 보냈다', (saved?.options ?? []).length === 1, `${(saved?.options ?? []).length}개`);
ok('링크가 함께 갔다', (saved?.options?.[0]?.links ?? []).length === 1);
ok('기한을 날수로 보낸다', typeof saved?.days === 'number' && saved.days >= 1, String(saved?.days));
ok('목록으로 돌아왔다', (await page.$$('.admin-card')).length === 2);

/* ── 3. 후보 5개 제한 ───────────────────────────────────── */

console.log('\n── 후보 개수');
await page.click('.survey-actions .survey-submit');
await page.waitForSelector('.admin-form');
for (let i = 0; i < 6; i += 1) {
  const btn = await page.$('.admin-form > .admin-mini');
  if (btn) { await btn.click(); await page.waitForTimeout(120); }
}
const optCount = (await page.$$('.admin-option')).length;
ok('후보는 5개까지만 늘어난다', optCount === 5, `${optCount}개`);
ok('5개가 되면 넣기 버튼이 사라진다', (await page.$('.admin-form > .admin-mini')) === null);

/* ── 4. 고치기 ──────────────────────────────────────────── */

console.log('\n── 고치기');
await page.click('.admin-form .admin-mini:not(.danger), .admin-form .survey-actions .admin-mini');
await page.waitForTimeout(400);
await go();
await page.fill('.admin-input', PW);
await page.click('.survey-who .survey-submit');
await page.waitForTimeout(800);
await (await cardBtn(0, '고치기')).click();
await page.waitForSelector('.admin-form', { timeout: 8000 });
await page.waitForTimeout(500);
const editTitle = await page.$eval('.admin-form .admin-input', (e) => e.value);
ok('고칠 설문 내용이 채워져 있다', editTitle.includes('9월'), editTitle);
const editOptions = (await page.$$('.admin-option')).length;
ok('기존 후보가 그대로 실려 있다', editOptions === 3, `${editOptions}개`);
ok('제목이 「설문 고치기」다',
  (await page.$eval('.admin-title', (e) => e.textContent.trim())) === '설문 고치기');

/* ── 5. 지우기 (204 빈 본문) ───────────────────────────── */

console.log('\n── 지우기');
await page.click('.admin-form .survey-actions .admin-mini');   // 그만두기
await page.waitForTimeout(400);
const before = (await page.$$('.admin-card')).length;
const first = (await page.$$('.admin-card'))[0];
await (await first.$$('.admin-mini.danger'))[0].click();
await page.waitForTimeout(1200);
const after = (await page.$$('.admin-card')).length;
ok('지워졌다 (204 빈 본문을 받아낸다)', after === before - 1, `${before} → ${after}`);
ok('지웠다고 알려 준다',
  (await page.$eval('.survey-message.done', (e) => e.textContent.trim()).catch(() => ''))
    .includes('지웠'));

/* ── 6. 누르는 크기와 오류 ─────────────────────────────── */

console.log('\n── 마무리');
const small = await page.$$eval('a,button,input,select,textarea',
  (es) => es.filter((e) => e.offsetParent !== null)
    .map((e) => { const r = e.getBoundingClientRect();
      return { c: e.className.toString().split(' ')[0] || e.tagName, w: Math.round(r.width), h: Math.round(r.height) }; })
    .filter((t) => t.h > 0 && (t.h < 24 || t.w < 24)));
ok('누르는 것이 모두 24px 이상', small.length === 0,
  small.map((t) => `${t.c} ${t.w}×${t.h}`).join(', '));
ok('오류 없음', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
server.close();

console.log(`\n${fails.length ? `운영자 화면 검사 실패 — ${fails.length}건: ${fails.join(', ')}`
  : '운영자 화면 검사 통과'}`);
process.exit(fails.length ? 1 : 0);
