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
import { dimTexts, measureA11y } from './a11y-probe.mjs';

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
let noteBody = '';     // 분석 메모 — 처음에는 비어 있다
/**
 * **옮겨 적은 투표자 이름이 있는가.** 처음에는 없다 — 지금 살아 있는 설문들이 그렇고,
 * 그 상태에서 운영자 화면이 「누가 골랐는지는 없습니다」 라고 말하는 것이 참이다.
 * 뒤에서 이 값을 켜고 결과를 다시 열어, 이름이 생기면 그 문장이 바뀌는지 잰다.
 * 처음부터 켜 두면 옛 문장이 검사 밖으로 나간다.
 */
/** 화면이 부른 RPC 이름. 「회원 창구가 아니라 운영자 창구로 갔나」 를 재는 데 쓴다. */
const calls = [];
let withVoterNames = false;
/**
 * 보드 소식 두 줄. `end_date` 가 지난 것과 안 지난 것을 함께 둔다 —
 * 하나만 두면 「기간이 지나면 안 보인다」 를 한 번도 재지 않는다.
 */
let newsRows = [
  { id: 'nw-1', type: '소식', status: '공유완료', title: '가짜 미술축제 소식',
    genre: '영상 · 유튜브', venue: '가짜 문화채널', summary: '9월 코엑스',
    start_date: '2026-08-30', end_date: '2099-01-01',
    main_url: 'https://www.youtube.com/watch?v=fake' },
  { id: 'nw-2', type: '소식', status: '공유완료', title: '지나간 가짜 소식',
    genre: '기사', venue: '가짜신문', summary: null,
    start_date: '2026-01-01', end_date: '2026-01-31',
    main_url: 'https://example.com/old' },
];
let newsSaved = null;
let newsDeleted = [];
/**
 * 운영진 전용 분석 가이드. **본문은 저장소에 없고 잠긴 표에만 산다** —
 * 여기서는 서버가 내주는 것을 흉내 낸다.
 * 회원 화면에 이 글자가 한 번이라도 나오면 그 자체가 사고다(아래에서 잰다).
 */
/**
 * 분석 가이드 목 — **구조화 JSON**. 실제 본문이 JSON 이므로 그 경로를 잰다.
 * 섹션 타입을 하나씩 넣어 리치 렌더가 다 그려지는지 본다.
 * 도메인 문구(코어·주변부)를 넣어 두면 회원 화면 누출 검사가 진짜 값으로 돈다.
 */
const guideDoc = {
  schema: 'admin-guide.v1',
  title: '가짜 1차 분석',
  sections: [
    { type: 'headline', title: '한눈에', lead: '가짜 요약.', stats: [
      { value: '82%', bar: 82, text: '가짜 지표 하나' },
      { value: '7/17', text: '막대 없는 값' } ] },
    { type: 'personas', title: '세 사람', items: [
      { name: '코어', size: '9명', gloss: '가짜.', metrics: [{ value: '78%', bar: 78, text: '가짜' }],
        callouts: [{ label: '주의', tone: 'caution', text: '가짜 주의' }] },
      { name: '주변부', size: '8명', metrics: [{ value: '75%', bar: 75, text: '가짜' }] } ] },
    { type: 'divergence', title: '갈라짐', poles: { a: '코어', b: '주변부' }, items: [
      { label: '가짜 축', a: 22, b: 75, gap: '53p', note: '가짜 note' } ] },
    { type: 'directives', variant: 'keep', title: '규칙', items: [
      { number: '01', title: '가짜 규칙', body: [{ type: 'text', text: '가짜 본문' },
        { type: 'quote', text: '가짜 인용' }], evidence: '가짜 근거' } ] },
    { type: 'directives', variant: 'avoid', title: '금지', items: [
      { number: '01', title: '가짜 금지', body: [{ type: 'text', text: '가짜' }], evidence: '가짜' } ] },
    { type: 'table', title: '편성', columns: ['시기', '무엇'], rows: [['9월', '가짜 일정']] },
    { type: 'actions', title: '이번 주', items: ['가짜 할 일'] },
    { type: 'footer', title: '읽는 법', meta: '가짜 표본', notes: ['가짜 주의'] },
  ],
};
let guideBody = JSON.stringify(guideDoc);
let guideSaved = null;

let surveys = [{
  id: 'srv-1', title: '9월 정기 관람 전시 추천', closes_at: new Date(Date.now() + 86400e3).toISOString(),
  created_by: '김하늘', multi_choice: true, results_visible: 'always', show_names: 'none',
  option_count: 4, response_count: 3,
}, {
  /**
   * **운영진용 설문 한 건.** 회원용만 두면 「운영진용」 배지도 「답하기」 단추도
   * 한 번도 안 그려지고, 그 자리를 통째로 지워도 검사가 통과한다.
   * 실제로 갈래 목록을 그렇게 놓쳤다 — 운영자가 새 갈래를 못 고르는 채 배포됐다.
   */
  id: 'srv-2', title: '운영진끼리 정할 것',
  closes_at: new Date(Date.now() + 86400e3).toISOString(),
  created_by: '김하늘', multi_choice: true, results_visible: 'admin', show_names: 'none',
  audience: 'admins', option_count: 3, response_count: 0,
}, {
  /**
   * **다녀온 모임의 설문 한 건.** 「지난 관람」 으로 접혀야 한다.
   *
   * id 를 지어내면 안 된다 — 접는 판정이 meetups.ts 의 surveyIds 를 보고
   * 「이 설문을 위해 열린 모임이 있었나 · 그 날이 지났나」 를 따지기 때문이다.
   * 그래서 **진짜로 이어져 있는 id** 를 쓴다 (history-museum · 2026-08-22).
   * 아무 id 나 쓰면 접히지 않고, 그러면 접는 자리를 통째로 지워도 검사가 통과한다.
   */
  id: '5e97b1a0-0000-4000-8000-000000000902', title: '서울역사박물관 저녁식사 장소 추천',
  closes_at: '2026-08-20T16:00:00+00:00',
  created_by: '김하늘', multi_choice: true, results_visible: 'always', show_names: 'none',
  audience: 'members', option_count: 13, response_count: 13,
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

  /**
   * **가짜 보드.** 새 설문을 올릴 때 여기서 골라 후보로 넣을 수 있어야 한다.
   * 이걸 안 두면 「보드에서 고르기」 가 늘 빈 채로 지나가고, 옮겨 담기가 맞는지 못 잰다.
   */
  if (url.includes('/rest/v1/events')) {
    return json([
      { id: 'ev-1', type: '전시', status: '공유완료', title: '《가짜 전시》',
        start_date: '2026-09-01', end_date: '2026-12-31',
        venue: '가짜미술관 2전시실', address: '서울 어딘가',
        time: '화-일 10:00-18:00, 월 휴관', price: 0, price_type: '성인 9,000원',
        info_url: 'https://example.com/book', main_url: 'https://example.com/detail',
        map_url: 'https://map.kakao.com/?q=test',
        notes: '사전예약제입니다.', discount: '얼리버드 7,000원' },
      { id: 'ev-2', type: '공연', status: '공유완료', title: '가짜 오케스트라 정기연주회',
        start_date: '2026-09-20', end_date: '2026-09-20',
        venue: '가짜아트홀', time: '2026-09-20 19:30', price_type: '전석 3만원',
        info_url: 'https://example.com/perf' },
      // `기타` 는 고르는 목록에 나오면 안 된다 — 전시·공연·영화 셋으로만 나눈다
      { id: 'ev-3', type: '기타', status: '공유완료', title: '가짜 워크숍' },
      /**
       * **보드 소식.** 운영자 화면의 「보드 소식」 이 이 길로 읽는다(events select) —
       * 쓰기만 함수를 거치고 읽기는 보드와 같은 창구다.
       * 하나는 살아 있고 하나는 기간이 지났다. 지난 것도 목록에 남아야
       * 운영자가 치울 수 있고, 「보드에 보임」 은 살아 있는 쪽에만 붙어야 한다.
       */
      ...newsRows,
    ]);
  }

  if (url.includes('/rest/v1/surveys')) {
    return json([mockSurveyRow()]);
  }


  if (!url.includes('/rpc/')) return route.continue();
  const name = url.split('/rpc/')[1].split('?')[0];
  calls.push(name);
  let body = {};
  try { body = JSON.parse(route.request().postData() ?? '{}'); } catch { /* 그대로 */ }

  // **암호 확인은 진짜처럼 서버가 한다.** 화면이 우회해도 여기서 막혀야 한다.
  /**
   * **`survey_admin` 앞머리로 걸면 새 갈래가 관문 밖으로 나간다.**
   * news_admin_save 를 더했을 때 실제로 그랬다 — 진짜 함수는 암호를 보는데
   * 가짜 서버는 안 봐서, 「암호가 틀리면 막힌다」 를 소식에 대해서는
   * 한 번도 재지 않는 검사가 될 뻔했다. 진짜 규칙과 같은 잣대를 쓴다.
   */
  if (name.includes('_admin_') && name !== 'survey_admin_ok') {
    if (body.p_password !== PW) return deny('운영자 암호가 맞지 않습니다.');
  }

  /**
   * **진짜 news_admin_save 가 보는 것을 여기서도 본다.**
   * 가짜가 관대하면 「서버가 막는다」 검사가 막지 않는 서버를 상대로 돈다.
   */
  if (name === 'news_admin_save') {
    const p = body.p_payload ?? {};
    if (!String(p.title ?? '').trim()) return deny('소식 제목을 적어 주세요.');
    if (!/^https:\/\//.test(String(p.url ?? ''))) return deny('주소는 https:// 로 시작해야 합니다.');
    if (!(p.days >= 1 && p.days <= 180)) return deny('보일 기간은 1일에서 180일 사이로 정해 주세요.');
    newsSaved = p;
    if (!p.id) {
      newsRows = [...newsRows, { id: 'nw-new', type: '소식', status: '공유완료',
        title: p.title, genre: p.genre, venue: p.venue, summary: p.summary,
        start_date: '2026-08-30',
        end_date: new Date(Date.now() + p.days * 86400e3).toISOString().slice(0, 10),
        main_url: p.url }];
    } else {
      newsRows = newsRows.map((n) => (n.id === p.id
        ? { ...n, title: p.title, genre: p.genre, venue: p.venue,
            summary: p.summary, main_url: p.url }
        : n));
    }
    return json(p.id ?? 'nw-new');            // uuid 를 돌려준다
  }
  if (name === 'survey_admin_guide') return json(guideBody);
  if (name === 'survey_admin_guide_save') {
    guideSaved = { key: body.p_key, body: body.p_body };
    guideBody = String(body.p_body ?? '');
    return noContent();                        // 아무것도 안 돌려준다 → 204 빈 본문
  }
  if (name === 'news_admin_delete') {
    newsDeleted.push(body.p_news);
    newsRows = newsRows.filter((n) => n.id !== body.p_news);
    return noContent();                        // 아무것도 안 돌려주는 함수 → 204 빈 본문
  }

  if (name === 'survey_admin_names') return json([{ name: '김하늘' }, { name: '박서준' }]);
  if (name === 'survey_admin_list') return json(surveys.filter((s) => !deleted.includes(s.id)));
  /**
   * 운영자 화면은 후보와 응답 수를 **이 창구로만** 읽는다 (202608300002a).
   * 예전에는 REST 로 표를 직접 읽고 survey_response_count 를 따로 불렀는데,
   * 운영진용 설문은 RLS 가 안 내주고 그 함수도 0 을 주므로 둘 다 못 쓴다.
   * 모양은 REST 가 주던 것과 같고 response_count 만 얹혀 있다.
   */
  if (name === 'survey_admin_get') return json({ ...mockSurveyRow(), response_count: 13 });  // 13 을 그대로 적는다 — MOCK_PEOPLE 은 아래에서 선언되고,
                                                                     // 이 콜백은 그 줄에 닿기 전(top-level await)에 이미 불린다
  if (name === 'survey_admin_submit') return noContent();
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
  /**
   * **참여 인원은 응답자 목록이 아니라 이 함수가 준다.**
   * 옮겨 온 설문은 응답자 행이 없어서 목록은 비어 있는데 참여는 13명이다.
   * 가짜 서버가 이걸 안 답하면 화면이 0 명으로 보이고, 그 어긋남을 못 잡는다.
   */
  if (name === 'survey_response_count') return json(13);
  if (name === 'survey_admin_note') return json(noteBody);
  if (name === 'survey_admin_note_save') {
    noteBody = String(body.p_body ?? '').trim();
    // 진짜와 같이 아무것도 안 돌려준다
    return noContent();
  }
  if (name === 'survey_admin_respondents') {
    // **일부러 비운다.** 톡방에서 옮겨 온 설문이 이렇다 —
    // 숫자는 13명인데 누가 골랐는지는 없다(사람을 지어내지 않았으므로).
    return json([]);
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
// 씨앗은 셋 — 회원용(srv-1) · 운영진용(srv-2) · 다녀온 것(902).
// 마지막 하나는 「지난 관람」 으로 접히므로 **바깥에 보이는 것은 둘**이다.
ok('맞는 암호로 들어간다',
  (await page.$$('.admin-card:not(details .admin-card)')).length === 2);
ok('응답 수가 보인다',
  (await page.$eval('.admin-card', (e) => e.textContent)).includes('3건'));

// **이 묶음은 지우기·고치기보다 앞에 둔다.** 뒤에 두었더니 그때는 씨앗이
// 이미 지워진 뒤라 접히는 자리가 아예 안 그려졌고, 그걸 「없다」 고 읽었다.
/* ── 지난 관람 ──────────────────────────────────────────── */
/**
 * 다녀온 모임의 설문은 지워지지 않는다(결과가 기록이다). 그래서 쌓인다.
 * 접어 두지 않으면 **지금 돌려야 할 설문이 끝난 것들에 밀린다.**
 * 판정은 회원 화면과 같은 규칙을 쓰며, 그 규칙 자체는
 * validate-survey-history 가 따로 잰다. 여기서는 **화면에 실제로 접히는가**만 본다.
 */
{
  // **.admin-members 만으로는 안 된다** — 회원 명부가 같은 class 를 쓴다.
  // 처음에 그렇게 잡았다가 명부의 여는 줄을 「지난 관람」 이라고 읽었다.
  const fold = await page.$('details.admin-past summary');
  const foldText = fold ? (await fold.textContent()).trim() : '';
  ok('「지난 관람」 이 접혀 있다', /지난 관람 \d+건/.test(foldText), foldText || '(없음)');

  // 접힌 것 안쪽까지 세면 「위 목록에 없다」 를 잴 수 없다. 바깥만 센다.
  const topTitles = await page.$$eval('.admin-card:not(details .admin-card) .admin-card-title',
    (es) => es.map((e) => e.textContent.trim()));
  ok('다녀온 설문이 위 목록에 없다',
    !topTitles.some((t) => t.includes('서울역사박물관')), topTitles.join(' · '));

  if (fold) { await fold.click(); await page.waitForTimeout(400); }
  const inFold = await page.$$eval('details.admin-past .admin-card .admin-card-title',
    (es) => es.map((e) => e.textContent.trim()));
  ok('펴면 그 안에 있다', inFold.some((t) => t.includes('서울역사박물관')),
    inFold.join(' · ') || '(비어 있음)');
  ok('접힌 카드에도 단추가 그대로 있다',
    (await page.$$('details.admin-past .admin-card .admin-mini')).length >= 3);
}

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
/**
 * **응답자 목록이 비어도 참여 인원은 제대로 나와야 한다.**
 * 처음에는 목록 길이로 셌더니, 옮겨 온 설문에서 목록 카드는 "응답 13건" 인데
 * 결과는 "참여 0명" 으로 어긋났다. 스크린샷을 보고 알았다.
 */
ok('참여 인원이 옳다',
  (await page.$eval('.admin-results-sum', (e) => e.textContent.trim())).includes('13명'),
  await page.$eval('.admin-results-sum', (e) => e.textContent.trim()));
ok('이름 목록은 비어 있다', (await page.$$('.admin-person')).length === 0);
ok('왜 비었는지 밝힌다',
  (await page.$eval('.admin-results', (e) => e.textContent)).includes('지어내지 않았습니다'));

/**
 * **이름을 옮겨 오면 그 문장이 거짓이 된다.**
 * 「누가 골랐는지는 없습니다 — 없는 사람을 지어내지 않았습니다」 는 옮겨 온 설문에
 * 응답 행이 없어서 참이었다. 이제 후보마다 이름을 담을 수 있어, 담긴 설문에서는
 * 회원 화면에 이름이 뜨는데 운영자 화면만 「없습니다」 라고 말하게 된다.
 *
 * 결과를 접었다 다시 펴면 화면이 목록을 다시 읽는다 — 그 사이에 가짜 서버를 바꾼다.
 */
withVoterNames = true;
await (await cardBtn(0, '결과 닫기')).click();
await (await cardBtn(0, '결과 보기')).click();
await page.waitForSelector('.admin-results', { timeout: 8000 });
await page.waitForTimeout(500);
const namedAdmin = await page.$eval('.admin-results', (e) => e.textContent);
ok('옮겨 적은 이름이 있으면 없다고 하지 않는다', !namedAdmin.includes('지어내지 않았습니다'));
ok('대신 어디를 보라고 알려 준다', namedAdmin.includes('회원 화면에도 그대로 보입니다'),
  namedAdmin.slice(-90).replace(/\s+/g, ' '));
/**
 * **「운영자 화면에서만 보입니다」 도 함께 뒤집혀야 한다.**
 * 두 문장이 같은 화면에 있는데 하나만 고치면, 운영자가 아래쪽 문장을 읽고
 * 「여기서만 보이는구나」 하고 이름을 넣는다. 실제로 이 검사가 그 상태를 잡아냈다.
 */
/**
 * 「운영자 화면에서만」 이라는 말은 화면에 둘 있다 — **메모**와 **이름**.
 * 메모 쪽은 지금도 참이라 건드리면 안 된다. 이름 쪽만 잰다.
 * 그래서 이름 문장에만 있는 「회원 화면에는 숫자만 나옵니다」 로 가른다.
 */
ok('「회원 화면에는 숫자만 나옵니다」 를 그대로 두지 않는다',
  !namedAdmin.includes('회원 화면에는 숫자만 나옵니다'),
  namedAdmin.slice(-110).replace(/\s+/g, ' '));
withVoterNames = false;
await (await cardBtn(0, '결과 닫기')).click();
await (await cardBtn(0, '결과 보기')).click();
await page.waitForSelector('.admin-results', { timeout: 8000 });
await page.waitForTimeout(500);

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
const caption = await page.$eval('.chart-caption', (e) => e.textContent.trim());
/**
 * **캡션이 사실을 말하는지 데이터에서 계산해 잰다.**
 * 예전엔 `합이 N명을 넘습니다` 가 늘 있어야 한다고 기대했는데,
 * 이 가짜 설문은 13명에 3표라 **넘지 않는다.** 검사가 거짓말을 기대하고 있었다.
 * 저녁식사 설문(13명·25표)에서만 참이라 여태 안 드러났다.
 */
const MOCK_VOTES = 2 + 0 + 1;   // survey_admin_results 가 답하는 표
const MOCK_PEOPLE = 13;         // survey_response_count 가 답하는 참여자
const saysExceeds = /합이 \d+명을 넘습니다/.test(caption);
ok('캡션이 합계와 참여자 관계를 옳게 말한다',
  saysExceeds === (MOCK_VOTES > MOCK_PEOPLE),
  `표 ${MOCK_VOTES} · 참여 ${MOCK_PEOPLE} → ${caption.slice(0, 40)}`);
ok('캡션이 비율의 기준을 알려 준다', caption.includes('가운데 몇 명인지'), caption.slice(-24));

/** 0표 줄은 눈으로도 귀로도 같은 말이어야 한다 — 보이는 글자만 고치면 반쪽이다. */
const zeroLabel = await page.$$eval('.chart-track', (es) => es.map((e) => e.getAttribute('aria-label')));
ok('0표 줄을 읽어 줄 때 「N명 중 0명」이라 하지 않는다',
  zeroLabel.every((l) => !/중 0명/.test(l ?? '')),
  zeroLabel.join(' | ').slice(0, 70));

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

/* ── 1-4. 분석 메모 접기 탭 ────────────────────────────── */

console.log('\n── 분석 메모');
await (await cardBtn(0, '결과 보기')).click();
await page.waitForSelector('.note', { timeout: 8000 });
await page.waitForTimeout(400);

ok('접혀 있다', !(await page.$eval('.note', (e) => e.open)));
ok('비었다고 알려 준다',
  (await page.$eval('.note-state', (e) => e.textContent.trim())) === '아직 없음');

await page.click('.note-head');
await page.waitForTimeout(300);
ok('열린다', await page.$eval('.note', (e) => e.open));

// 적기 → 저장
const noteBtns = await page.$$('.note-body .admin-mini');
await noteBtns[0].click();
await page.waitForSelector('.note-body textarea', { timeout: 5000 });
await page.fill('.note-body textarea', '사발 8표로 1위.\n상위 3곳이 80%.');
await page.click('.note-body .survey-submit');
await page.waitForTimeout(800);

ok('저장했다고 알려 준다',
  (await page.$eval('.note-body .survey-status.done', (e) => e.textContent.trim()).catch(() => ''))
    .includes('저장'));
const noteText = await page.$eval('.note-text', (e) => e.textContent).catch(() => '');
ok('적은 글이 보인다', noteText.includes('사발 8표'), noteText.slice(0, 20));
// 줄바꿈을 그대로 살린다 — 붙여 넣은 글이 한 줄로 뭉치면 못 읽는다
ok('줄바꿈이 살아 있다',
  (await page.$eval('.note-text', (e) => getComputedStyle(e).whiteSpace)) === 'pre-wrap');
ok('있음으로 바뀐다',
  (await page.$eval('.note-state', (e) => e.textContent.trim())) === '있음');
ok('회원에게 안 보인다고 밝힌다',
  (await page.$eval('.note-body', (e) => e.textContent)).includes('운영자 화면에서만'));

await (await cardBtn(0, '결과 닫기')).click();
await page.waitForTimeout(300);

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
/**
 * **갈래를 실제로 보내는가.**
 * 서버는 진작부터 category 를 받고 있었는데 화면이 안 보내서,
 * 관리 화면으로 만든 설문이 전부 전시 관람으로 떨어졌다 —
 * 식사·티타임 설문을 올릴 길이 SQL 밖에 없었던 이유다.
 * 값을 안 보내면 서버가 조용히 'exhibition' 으로 채우므로, **보냈는지**를 직접 본다.
 */
ok('갈래를 함께 보낸다', saved?.category === 'exhibition', String(saved?.category));

// 바깥에 보이는 씨앗 둘 + 방금 올린 하나 (다녀온 것은 접혀 있다)
ok('목록으로 돌아왔다',
  (await page.$$('.admin-card:not(details .admin-card)')).length === 3);

/* ── 보드에서 골라 후보로 넣기 ───────────────────────────── */
/**
 * 후보에 넣을 내용은 이미 보드에 있다. 손으로 다시 적는 자리가 틀리는 자리라
 * **골라서 그대로 가져오는지**를 잰다 — 제목만이 아니라 기간·장소·관람료·링크까지.
 *
 * 앞의 흐름과 섞지 않으려고 설문을 새로 연다.
 * 처음엔 같은 폼 안에서 이어 했더니, 골라 넣은 후보가 뒤따르는 검사의
 * 후보 자리를 차지해 멀쩡하던 검사가 깨졌다.
 */
console.log('\n── 보드에서 고르기');
await page.click('.survey-actions .survey-submit');
await page.waitForSelector('.admin-form');
await page.click('.admin-picker > summary');
await page.waitForTimeout(700);

const pickTitles = () => page.$$eval('.admin-pick-title', (es) => es.map((e) => e.textContent.trim()));

ok('보드를 불러왔다', (await page.$$('.admin-pick')).length > 0,
  `${(await page.$$('.admin-pick')).length}건`);
ok('기타는 목록에 없다', !(await pickTitles()).some((t) => t.includes('워크숍')));
ok('전시 갈래가 먼저 보인다', (await pickTitles()).some((t) => t.includes('가짜 전시')));

await page.click('.admin-kinds .admin-kind:nth-child(2)');
await page.waitForTimeout(250);
ok('공연으로 바꾸면 공연만 보인다',
  (await pickTitles()).some((t) => t.includes('오케스트라'))
  && !(await pickTitles()).some((t) => t.includes('가짜 전시')));

await page.click('.admin-kinds .admin-kind:nth-child(3)');
await page.waitForTimeout(250);
ok('영화 갈래도 목록이 있다', (await pickTitles()).length > 0, `${(await pickTitles()).length}건`);

await page.click('.admin-kinds .admin-kind:nth-child(1)');
await page.waitForTimeout(250);
await page.click('.admin-pick input');
await page.waitForTimeout(200);
await page.click('.admin-picker .survey-submit');
await page.waitForTimeout(600);

const optVals = await page.$$eval('.admin-option .admin-input', (es) => es.map((e) => e.value ?? ''));
ok('제목이 들어왔다', optVals.some((v) => v.includes('가짜 전시')), optVals[0]?.slice(0, 22));
// 기간은 이제 글이 아니라 달력 두 칸에 들어간다
ok('기간이 달력에 들어왔다', optVals.includes('2026-09-01') && optVals.includes('2026-12-31'),
  optVals.filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v)).join(' ~ '));
ok('장소가 함께 들어왔다', optVals.some((v) => v.includes('가짜미술관')));
ok('관람료가 함께 들어왔다', optVals.some((v) => v.includes('9,000원')));
ok('안내와 할인이 함께 들어왔다',
  optVals.some((v) => v.includes('사전예약제') && v.includes('얼리버드 7,000원')));

const linkVals = await page.$$eval('.admin-link-row .admin-input', (es) => es.map((e) => e.value ?? ''));
ok('링크도 함께 들어왔다', linkVals.some((v) => v.includes('example.com/book')),
  `${linkVals.filter(Boolean).length}칸`);

// 같은 것을 두 번 넣지 못한다
ok('이미 넣은 것은 못 고른다',
  await page.$eval('.admin-pick.used input', (e) => e.disabled).catch(() => false));

// 손으로 넣는 길도 그대로 있어야 한다 — 보드에 없는 것은 이렇게 넣는다
ok('손으로 넣는 버튼이 남아 있다',
  (await page.$$eval('.admin-form .admin-mini', (es) => es.map((e) => e.textContent)))
    .some((t) => t.includes('후보 넣기')));

await page.click('.admin-form .admin-mini');   // 그만두기는 아래에서 누른다
await page.waitForTimeout(200);

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
/* ── 기간은 달력으로 고른다 ─────────────────────────────── */
/**
 * 예전에는 `2026. 8. 27. ~ 2027. 2. 9.` 를 손으로 적었다. 점과 물결을 매번 같은 자리에
 * 찍어야 했고, 어긋나면 회원 화면에서 그대로 어긋나 보였다.
 *
 * 저장되는 값은 지금도 **글**이다. 달력은 적는 방법만 바꾼다 —
 * 그래야 날짜 범위가 아닌 값(영화의 `개봉 예정 · …`)이 그대로 살아 있다.
 */
const dateInputs = await page.$$eval('.admin-option input[type=date]', (es) => es.map((e) => e.value));
ok('기간이 달력 두 칸이다', dateInputs.length >= 2, `${dateInputs.length}칸`);
ok('적혀 있던 기간이 달력에 들어와 있다',
  dateInputs[0] === '2026-08-27' && dateInputs[1] === '2027-02-09',
  `${dateInputs[0]} ~ ${dateInputs[1]}`);

// 날짜를 바꾸면 회원 화면에 뜰 글이 따라 바뀐다
const firstDate = (await page.$$('.admin-option input[type=date]'))[0];
await firstDate.fill('2026-09-05');
await page.waitForTimeout(250);
ok('날짜를 바꾸면 글도 따라 바뀐다',
  (await page.$$eval('.admin-option .admin-hint', (es) => es.map((e) => e.textContent)))
    .some((t) => t.includes('2026. 9. 5. ~ 2027. 2. 9.')));

/**
 * **고칠 때 갈래가 살아남는가.**
 *
 * `toDraft` 가 갈래를 안 들고 오면, 운영자가 식사 설문을 열어 아무것도 안 바꾸고
 * 저장만 눌러도 그 설문이 **전시 관람 탭으로 조용히 옮겨 간다.**
 * 새 설문 검사만으로는 이 길이 안 지나가서 결함을 심어 보다 드러났다.
 *
 * 여기서는 **저장하지 않는다** — 저장하면 폼이 닫혀 뒤따르는 지우기 검사가 깨진다.
 * 폼에 실린 값만 봐도 `toDraft` 가 갈래를 들고 왔는지 알 수 있다.
 */
const editCat = await page.evaluate(() => {
  const f = [...document.querySelectorAll('.admin-form .survey-field')]
    .find((e) => e.querySelector('span')?.textContent?.trim() === '어느 화면에');
  return f?.querySelector('select')?.value ?? null;
});
ok('고칠 때 갈래가 살아남는다', editCat === 'meal', String(editCat));

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

/* ── 식사 갈래로 올릴 수 있는가 ─────────────────────────────
 *
 * **일부러 지우기 뒤에 둔다.** 가짜 서버가 새 설문에 늘 같은 id(srv-new)를 주는데,
 * 여기서 하나 더 저장하면 목록에 같은 id 가 둘이 되어 **지우기 검사가 흔들린다.**
 * 이 검사가 보려는 것은 갈래가 서버까지 가느냐지 목록 개수가 아니다.
 */
saved = null;
await page.click('.survey-actions .survey-submit');   // 새 설문 올리기
await page.waitForSelector('.admin-form', { timeout: 8000 });
await page.waitForTimeout(300);

const catLabels = await page.$$eval('.admin-form .survey-field span',
  (es) => es.map((e) => e.textContent.trim()));
ok('갈래 고르는 칸이 있다', catLabels.includes('어느 화면에'), catLabels.slice(0, 7).join(' · '));

/** 「어느 화면에」 칸을 **이름으로** 찾는다 — 순서로 찾으면 칸이 하나 늘 때마다 깨진다 */
const pickCategory = (v) => page.evaluate((want) => {
  const f = [...document.querySelectorAll('.admin-form .survey-field')]
    .find((e) => e.querySelector('span')?.textContent?.trim() === '어느 화면에');
  const sel = f?.querySelector('select');
  if (!sel) return null;
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(sel, want);                         // React 가 알아채게 값을 넣는다
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  return sel.value;
}, v);

/**
 * **고를 수 있는 갈래가 소스의 CATEGORY 와 같은가.**
 *
 * 다른 검사들은 「보내는가」·「살아남는가」 만 재고 **「무엇을 고를 수 있는가」** 는 안 쟀다.
 * 그래서 2026-08-29 에 갈래를 다섯으로 늘렸을 때, 화면·주소·DB 는 늘었는데
 * 이 `<select>` 의 `<option>` 둘만 옛 목록으로 남은 것을 **못 잡았다** —
 * 운영자는 새 갈래를 아예 고를 수 없었고 검사는 전부 통과했다.
 *
 * 소스를 글자로 읽어 맞춘다 (.ts 는 그냥 import 가 안 된다).
 * 값과 차례가 하나라도 어긋나면 그 갈래는 운영자 화면에서 만들 길이 없어진다.
 */
const SRC = fs.readFileSync(path.join(ROOT, 'app/src/lib/survey.ts'), 'utf8');
// **POSTABLE_ 쪽을 읽는다.** 화면이 고를 수 있는 갈래는 탭 목록과 하나가 다르다 —
// 「구글 설문」 은 화면에만 있는 갈래라 DB 가 거절한다 (lib/survey.ts 주석 참고).
// `[^=]*` 로 타입 표기를 건너뛴다 — `: readonly SurveyCategory[]` 안의 대괄호에
// 정규식이 걸려 소스를 빈 목록으로 읽었고, 검사가 그대로 실패했다.
const wantCats = (SRC.match(/POSTABLE_CATEGORY_ORDER[^=]*= \[([^\]]+)\]/)?.[1] ?? '')
  .split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
const gotCats = await page.$$eval('.admin-form select.admin-input', (sels) => {
  const s = sels.find((x) => [...x.options].some((o) => o.value === 'exhibition'));
  return s ? [...s.options].map((o) => o.value) : [];
});
ok('고를 수 있는 갈래가 소스와 같다',
  wantCats.length >= 2 && JSON.stringify(gotCats) === JSON.stringify(wantCats),
  `화면 [${gotCats.join(', ')}] / 소스 [${wantCats.join(', ')}]`);

ok('식사 갈래를 고를 수 있다', (await pickCategory('meal')) === 'meal');

// 첫 흐름과 같은 방식으로 채운다 — 서버가 제목·후보·올린 사람을 다 본다
const mealInputs = await page.$$('.admin-form .admin-input');
await mealInputs[0].fill('9월 식사 장소 투표');
await page.waitForTimeout(150);
const mealOpt = await page.$$('.admin-option .admin-input');
await mealOpt[0].fill('사발');
await page.waitForTimeout(150);
await (await saveBtn()).click();
await page.waitForTimeout(900);

const mealErr = await page.$eval('.admin-form .survey-message.error', (e) => e.textContent.trim())
  .catch(() => '');
ok('식사 갈래로 저장된다', saved?.category === 'meal',
  saved === null ? `저장이 안 됐다 — ${mealErr || '까닭 모름'}` : String(saved?.category));


/* ── 6. 누르는 크기와 오류 ─────────────────────────────── */

console.log('\n── 마무리');
// 긴 흐름 끝에 남은 화면은 글자가 얼마 없다. 내용이 있는 상태로 돌아가서 잰다 —
// 얇은 화면을 재고 「통과」 하면 그게 제일 위험하다.
// 긴 흐름 끝에 남은 화면은 글자가 얼마 없다(303자). 그래서 **두 자리를 잰다** —
// 목록 화면과, 색을 실제로 쓰는 결과 화면. 얇은 화면 하나만 재고 「통과」 하면
/* ── 운영진용 설문 ──────────────────────────────────────── */
/**
 * 이 화면의 값어치는 **회원이 못 보는 것을 운영진이 보는 것**이다.
 * 그러니 「운영진용으로 표시되나 · 답할 자리가 있나 · 회원용에는 안 붙나」 를 잰다.
 * 자물쇠 자체는 DB 에 있고(202608300002a) 여기서 잴 수 없다 —
 * 여기서 재는 것은 **운영자가 그 자물쇠를 쓸 수 있는가**다.
 */
await go();
await page.fill('.admin-input', PW);
await page.click('.survey-who .survey-submit');
await page.waitForSelector('.admin-card', { timeout: 20000 });
await page.waitForTimeout(600);

{
  const cards = await page.$$('.admin-card');
  const titleOf = async (i) => (await cards[i].$eval('.admin-card-title', (e) => e.textContent)).trim();
  const t0 = await titleOf(0);
  const t1 = await titleOf(1);
  // 목록은 마감 차례라 둘 중 어느 쪽이 먼저일지 고정하지 않는다
  const adminIdx = t0.includes('운영진끼리') ? 0 : 1;
  const memberIdx = adminIdx === 0 ? 1 : 0;

  ok('운영진용 설문에 「운영진용」 이 붙는다',
    (await titleOf(adminIdx)).includes('운영진용'), await titleOf(adminIdx));
  ok('회원용 설문에는 안 붙는다',
    !(await titleOf(memberIdx)).includes('운영진용'), await titleOf(memberIdx));

  const btnTexts = async (i) => Promise.all(
    (await cards[i].$$('.admin-mini')).map(async (b) => (await b.textContent()).trim()));
  ok('운영진용에는 「답하기」 가 있다', (await btnTexts(adminIdx)).includes('답하기'),
    (await btnTexts(adminIdx)).join(' · '));
  ok('회원용에는 「답하기」 가 없다', !(await btnTexts(memberIdx)).includes('답하기'),
    (await btnTexts(memberIdx)).join(' · '));

  // 펴서 실제로 답하는 자리가 그려지는지
  await (await cardBtn(adminIdx, '답하기')).click();
  await page.waitForSelector('.admin-entry .survey-option', { timeout: 20000 });
  const optN = (await page.$$('.admin-entry .survey-option')).length;
  ok('후보가 그려진다', optN === 3, `${optN}개`);
  const fields = await page.$$eval('.admin-entry .survey-field span',
    (es) => es.map((e) => e.textContent.trim()));
  ok('구역번호와 이름을 받는다',
    fields.includes('구역번호') && fields.includes('이름'), fields.join(' · '));
  ok('이름이 저장되지 않는다고 알린다',
    (await page.$eval('.admin-entry .admin-hint', (e) => e.textContent)).includes('저장되지 않습니다'));

  // 하나 골라 보내고, 운영자 창구로 갔는지 본다
  await page.click('.admin-entry .survey-option input');
  await page.click('.admin-entry .survey-submit');
  await page.waitForTimeout(700);
  ok('회원 창구가 아니라 운영자 창구로 보낸다',
    calls.includes('survey_admin_submit') && !calls.includes('survey_submit'),
    calls.filter((c) => c.includes('submit')).join(' · ') || '(부른 적 없음)');
}

/* ── 새 설문을 올릴 때 운영진용을 고를 수 있나 ─────────────── */
{
  await page.click('.survey-actions .survey-submit');   // 새 설문 올리기
  await page.waitForSelector('.admin-form', { timeout: 20000 });
  const opts = await page.$$eval('.admin-form select',
    (sels) => sels.flatMap((s) => [...s.options].map((o) => o.value)));
  ok('새 설문 양식에서 운영진용을 고를 수 있다',
    opts.includes('admins') && opts.includes('members'),
    `audience 값 ${opts.filter((v) => v === 'admins' || v === 'members').join(' · ')}`);
}

// 그게 제일 위험하다.
const spots = [];
await go();
await page.fill('.admin-input', PW);
await page.click('.survey-who .survey-submit');
await page.waitForSelector('.admin-card', { timeout: 20000 });
await page.waitForTimeout(900);
spots.push(await measureA11y(page));

/* ── 보드 소식 ─────────────────────────────────────────────
 * 운영자가 영상 주소를 올리고·고치고·지운다. 보드에 나가는 유일한 자유 입력이라
 * 여기서 막지 못하면 회원 화면에 그대로 걸린다.
 */
// 지우기 확인창은 262행에서 이미 받고 있다. 여기서 또 걸면 같은 창을 두 번
// 받아 「already handled」 로 터진다.

const newsSummary = page.locator('.admin-members > summary', { hasText: '보드 소식' });
ok('보드 소식 자리가 있다', await newsSummary.count() === 1);
/**
 * **먼저 닫는다.** 바로 위 measureA11y 가 `openFolds` 로 페이지의 <details> 를
 * 전부 열어 두고 간다(a11y-probe.mjs:43). 그 상태에서 누르면 여는 것이 아니라
 * **닫는** 것이 되어, 아래 검사가 통째로 빈 화면을 상대로 돌았다.
 * 눌러서 여는 길을 재려면 닫힌 데서 시작해야 한다.
 */
await page.evaluate(() => {
  document.querySelectorAll('details').forEach((d) => { d.open = false; });
});
await page.waitForTimeout(300);
await newsSummary.click();
await page.waitForSelector('.admin-members[open] .admin-news-card', { timeout: 20000 });
await page.waitForTimeout(500);

const newsBox = page.locator('.admin-members', { hasText: '보드 소식' }).first();
const newsText = await newsBox.innerText();
ok('지난 소식도 목록에 남는다', newsText.includes('지나간 가짜 소식'));
ok('지난 것은 안 보인다고 알린다', newsText.includes('기간이 지나 보이지 않습니다'));
/** 「보드에 보임」 은 살아 있는 하나에만 붙어야 한다 — 둘에 붙으면 거짓말이다. */
ok('보드에 보이는 것을 하나만 짚는다',
  (newsText.match(/보드에 보임/g) ?? []).length === 1,
  `${(newsText.match(/보드에 보임/g) ?? []).length}건`);

const newsInputs = newsBox.locator('.admin-input');
const newsSave = newsBox.locator('.survey-submit');
/** 칸 차례 — 제목 · 주소 · 갈래 · 출처 · 기간 · 덧붙이는 말 */
await newsInputs.nth(0).fill('새 가짜 소식');
await newsInputs.nth(1).fill('http://insecure.example.com');
await page.waitForTimeout(200);
ok('https 가 아니면 저장을 막는다', await newsSave.isDisabled());
ok('https 가 아니면 그 자리에서 알린다',
  (await newsBox.innerText()).includes('https:// 로 시작해야 합니다'));

await newsInputs.nth(1).fill('https://www.youtube.com/watch?v=new');
await newsInputs.nth(3).fill('새 채널');
await page.waitForTimeout(200);
ok('https 면 저장할 수 있다', await newsSave.isEnabled());
await newsSave.click();
await page.waitForTimeout(900);
ok('소식을 운영자 창구로 보낸다', calls.includes('news_admin_save'));
ok('보낸 것이 화면에 적은 그대로다',
  newsSaved?.title === '새 가짜 소식'
  && newsSaved?.url === 'https://www.youtube.com/watch?v=new'
  && newsSaved?.venue === '새 채널'
  && newsSaved?.id === null,
  JSON.stringify(newsSaved));
ok('기간을 날짜가 아니라 날수로 보낸다',
  typeof newsSaved?.days === 'number' && newsSaved.days >= 1 && newsSaved.days <= 180,
  String(newsSaved?.days));

/** 고치기 — 칸이 채워지고, 저장할 때 id 가 함께 가야 새 줄이 하나 더 생기지 않는다. */
await newsBox.locator('.admin-news-card', { hasText: '가짜 미술축제 소식' })
  .locator('button', { hasText: '고치기' }).click();
await page.waitForTimeout(300);
ok('고치기가 칸을 채운다', await newsInputs.nth(0).inputValue() === '가짜 미술축제 소식');
await newsInputs.nth(0).fill('고친 가짜 소식');
await newsSave.click();
await page.waitForTimeout(900);
ok('고칠 때 id 를 함께 보낸다', newsSaved?.id === 'nw-1', String(newsSaved?.id));
ok('고친 제목이 목록에 반영된다',
  (await newsBox.innerText()).includes('고친 가짜 소식'));

/** 지우기 */
await newsBox.locator('.admin-news-card', { hasText: '지나간 가짜 소식' })
  .locator('button', { hasText: '지우기' }).click();
await page.waitForTimeout(900);
ok('지우기가 운영자 창구로 간다', newsDeleted.includes('nw-2'), newsDeleted.join(','));
ok('지운 것이 목록에서 사라진다',
  !(await newsBox.innerText()).includes('지나간 가짜 소식'));

/* ── 구글 설문 · 운영진 전용 분석 가이드 ───────────────────
 * 이 글에는 집단 구분 · 미응답자 수 · 자유서술 인용이 들어간다.
 * **운영자 화면에만 있어야 하고 회원 화면에는 한 글자도 없어야 한다.**
 */
const gBox = page.locator('.admin-members', { hasText: '구글 설문 결과' }).first();
ok('구글 설문 자리가 있다', await gBox.count() === 1);
await page.evaluate(() => {
  document.querySelectorAll('details').forEach((d) => { d.open = false; });
});
await page.waitForTimeout(200);
await gBox.locator('> summary').click();
await page.waitForSelector('.gsurvey', { timeout: 20000 });
await page.waitForTimeout(400);

const guideFold = gBox.locator('.admin-guide').first();
ok('회차마다 분석 가이드가 붙는다', await guideFold.count() === 1);
await guideFold.locator('> summary').click();
await page.waitForSelector('.admin-guide[open] .gdoc', { timeout: 20000 });
await page.waitForTimeout(400);

/* ── JSON 본문이 지표·페르소나·격차·편성으로 그려진다 ────── */
ok('JSON 을 오류 없이 읽는다', await guideFold.locator('.gdoc-error').count() === 0);
ok('지표 막대를 그린다', await guideFold.locator('.gdoc-bar-fill').count() >= 3,
  `${await guideFold.locator('.gdoc-bar-fill').count()}개`);
/** 막대 폭은 SVG width 속성 = 값 그대로 (인라인 style 아님 → CSP 안전) */
ok('막대 폭이 값을 따른다',
  (await guideFold.locator('.gdoc-bar-fill').first().getAttribute('width')) === '82');
ok('페르소나 카드가 선다', await guideFold.locator('.gdoc-persona').count() === 2);
ok('격차 차트를 그린다', await guideFold.locator('.gdoc-div-plot').count() === 1);
ok('규칙·금지 카드가 선다', await guideFold.locator('.gdoc-rule').count() === 2);
ok('편성을 행-카드로 접는다', await guideFold.locator('.gdoc-sched').count() === 1);
const gText = await guideFold.innerText();
ok('값이 글자로 남는다', gText.includes('82%') && gText.includes('차이 53p'));
ok('어디에만 보이는지 화면이 말한다', gText.includes('운영자 화면에서만'));
ok('375px 가로 스크롤 없음',
  await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));

/* ── 깨진 JSON 은 화면을 죽이지 않고 막는다 ──────────────── */
await guideFold.locator('.admin-guide-body .admin-mini', { hasText: '고치기' }).click();
await page.waitForSelector('.admin-guide textarea', { timeout: 8000 });
await guideFold.locator('textarea').fill('{ "sections": [ }');   // 문법 오류
await page.waitForTimeout(300);
ok('깨진 JSON 에 오류를 보인다', await guideFold.locator('.gdoc-error').count() >= 1);
ok('깨진 JSON 이면 저장을 막는다',
  await guideFold.locator('.survey-submit').isDisabled());
ok('깨져도 화면이 살아 있다', await guideFold.count() === 1);

/* ── 옛 마크다운 본문은 폴백으로 그려진다 (미리보기로 확인) ── */
await guideFold.locator('textarea').fill('## 옛 제목\n- 옛 목록');
await page.waitForTimeout(300);
ok('마크다운 폴백이 산다', await guideFold.locator('.gdoc-preview .guide-h').count() === 1);
ok('마크다운 미리보기가 제목을 그린다',
  (await guideFold.locator('.gdoc-preview .guide-h').innerText()) === '옛 제목');

// 편집 원복 — 뒤 검사에 영향 없게 그만두기
await guideFold.locator('.admin-guide-body .admin-mini', { hasText: '그만두기' }).click();
await page.waitForTimeout(300);

// 펼친 채로 한 번 더 잰다 — 새로 생긴 칸과 단추의 대비·크기도 같은 잣대로 본다
spots.push(await measureA11y(page));
await newsSummary.click();
await page.waitForTimeout(300);
await (await cardBtn(0, '결과 보기')).click();
await page.waitForSelector('.admin-results', { timeout: 20000 });
await page.waitForTimeout(900);
spots.push(await measureA11y(page));
/**
 * **이 화면에는 대비를 재는 대목이 하나도 없었다.**
 * 회원 설문 화면에는 있는데 여기만 없어서, 0표 글자색을 바꿨을 때
 * 운영자 화면 색도 같이 바뀌었는데 그대로 통과했다. 같은 잣대를 쓴다.
 */
const small = spots.flatMap((r) => r.small);
const texts = spots.flatMap((r) => r.texts);
ok('누르는 것이 모두 24px 이상', small.length === 0,
  small.map((t) => `${t.c} ${t.w}×${t.h}`).join(', '));
const dim = dimTexts(texts);
ok('글자 대비가 모두 기준 이상', dim.length === 0, dim.join(' | '));
ok(`대비를 잰 글자 ${texts.length}개`, texts.length >= 30, `${texts.length}개`);
ok('오류 없음', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
server.close();

console.log(`\n${fails.length ? `운영자 화면 검사 실패 — ${fails.length}건: ${fails.join(', ')}`
  : '운영자 화면 검사 통과'}`);
process.exit(fails.length ? 1 : 0);

/**
 * **가짜 설문 한 건.** REST(`/rest/v1/surveys`)와 운영자 창구(`survey_admin_get`)가
 * 같은 것을 주어야 한다 — 화면이 둘을 오가며 읽기 때문이다.
 * 함수 선언이라 호이스팅된다. 위 route 콜백이 요청 때 부르므로 순서를 안 탄다.
 */
function mockSurveyRow() {
  return { id: 'srv-1', title: '9월 정기 관람 전시 추천', intro: '골라 주세요.',
      multi_choice: true, opens_at: new Date(Date.now() - 3600e3).toISOString(),
      closes_at: new Date(Date.now() + 86400e3).toISOString(), created_by: '김하늘',
      results_visible: 'always', show_names: 'none', hide_after_days: null,
      /**
       * **일부러 식사 갈래다.** 고치기 흐름에서 갈래가 살아남는지 재려면
       * 기본값(exhibition)이 아닌 값이어야 한다 — 기본값이면 `toDraft` 가
       * 갈래를 통째로 잃어버려도 검사가 그대로 통과한다.
       * 운영자 화면은 갈래로 목록을 가르지 않으므로 다른 검사에는 영향이 없다.
       */
      category: 'meal',
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
      ].map((o, i) => (withVoterNames
        // 이름은 가상 명부(docs/fixtures/sample-members.json)에서 가져온다
        ? { ...o, imported_voters: [['최윤슬', '정다인'], [], ['한도윤']][i] }
        : o)) };
}
