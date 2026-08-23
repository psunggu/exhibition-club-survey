#!/usr/bin/env node
/**
 * validate-survey-ui.mjs — 설문 화면이 실제로 동작하는지 눌러 본다.
 *
 *   node scripts/validate-survey-ui.mjs
 *
 * ── 왜 가짜 서버를 세우나 ───────────────────────────────────
 * 진짜 Supabase 에 붙이면 검사를 돌릴 때마다 회원 데이터에 쓰기가 남는다.
 * 그렇다고 안 눌러 보면 "빌드가 통과했다" 까지밖에 모른다 —
 * 이번 작업에서 화면이 뜨는 것과 동작하는 것이 다르다는 걸 여러 번 겪었다.
 *
 * 그래서 응답만 가로채 **진짜와 같은 모양의 답**을 돌려주고,
 * 화면이 보낸 것을 받아 적어 확인한다. 화면 코드는 손대지 않는다.
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
await new Promise((r) => server.listen(8261, r));

/* ── 가짜 데이터 ─────────────────────────────────────────── */

const iso = (d) => new Date(d).toISOString();
const HOUR = 3600_000;
const now = Date.now();

const OPEN_SURVEY = {
  id: 'srv-open', title: '9월 정기 관람 전시 추천',
  intro: '함께 보고 싶은 전시를 골라 주세요.',
  multi_choice: true,
  opens_at: iso(now - HOUR), closes_at: iso(now + 24 * HOUR),
  created_by: '박지현', results_visible: 'always', show_names: 'none', hide_after_days: null,
  survey_options: [
    { id: 'opt-1', position: 1, title: '서도호 개인전', period: '2026. 8. 27. ~ 2027. 2. 9.',
      venue: '국립현대미술관 서울', hours: null, price: '8,000원', note: '단체 예약이 어렵습니다.',
      links: [
        { kind: 'official', label: '예매 페이지', url: 'https://booking.mmca.go.kr/x' },
        { kind: 'video', label: '참고 영상', url: 'https://www.youtube.com/watch?v=x' },
        // 아래 셋은 **버려져야 한다** — 화면에 나오면 검사 실패다
        { kind: 'video', label: '나쁜 주소', url: 'javascript:alert(1)' },
        { kind: '이상한종류', label: 'x', url: 'https://example.com' },
        { kind: 'official', label: '', url: 'https://example.com' },
      ] },
    { id: 'opt-2', position: 2, title: '에스 데블린', period: null, venue: '푸투라서울',
      hours: null, price: '22,000원', note: null, links: [] },
    { id: 'opt-3', position: 3, title: '이대원', period: null, venue: '덕수궁관',
      hours: null, price: '2,000원', note: null, links: [] },
  ],
};

const CLOSED_SURVEY = {
  ...OPEN_SURVEY, id: 'srv-closed', title: '지난 설문',
  opens_at: iso(now - 48 * HOUR), closes_at: iso(now - HOUR),
  survey_options: OPEN_SURVEY.survey_options.map((o) => ({ ...o, id: `${o.id}-c` })),
};

/**
 * 후보가 다섯을 넘는 마감 설문. **색을 돌려쓰지 않는지 여기서 잰다** —
 * 식사 설문(13곳)에서 6번째부터 앞의 색이 다시 나왔던 것을 막기 위해서다.
 */
const MANY_SURVEY = {
  id: 'srv-many', title: '저녁식사 장소 투표', intro: null,
  multi_choice: true,
  opens_at: iso(now - 48 * HOUR), closes_at: iso(now - 2 * HOUR),
  created_by: '박지현', results_visible: 'always', show_names: 'none', hide_after_days: null,
  /**
   * 이름을 **한글로 끝나게** 둔다. `후보 1` 처럼 숫자로 끝나면
   * 조사를 고를 수 없어 괄호 형태로 떨어지고, 그러면 조사 검사가
   * 실제 경로를 재지 못한다 (진짜 후보 이름은 사발·우슴처럼 한글이다).
   */
  survey_options: ['사발', '우슴', '탄백', '난포', '미진', '국밥', '해장', '회관']
    .map((name, i) => ({
      id: `many-${i}`, position: i + 1, title: name,
      period: null, venue: null, hours: null, price: null, note: null, links: [],
    })),
};
const MANY_VOTES = [6, 1, 3, 0, 0, 8, 6, 1];

/**
 * 톡방에서 진행 중인 투표를 옮겨 온 설문. **마감이 아직 안 지났다.**
 * 그래도 여기서는 응답을 받으면 안 된다 — 옮겨 온 숫자가 집계를 덮어써서
 * 여기서 받은 표는 어디에도 나타나지 않기 때문이다(표가 조용히 사라진다).
 */
const MIRROR_SURVEY = {
  id: 'srv-mirror', title: '저녁식사 장소 투표', intro: null,
  multi_choice: true,
  opens_at: iso(now - 24 * HOUR), closes_at: iso(now + 7 * HOUR),
  created_by: '박지현', results_visible: 'always', show_names: 'none', hide_after_days: null,
  // 갈래는 이 검사와 무관하다. 같은 화면에서 보려고 전시로 둔다.
  category: 'exhibition',
  imported_respondents: 13,
  survey_options: Array.from({ length: 3 }, (_, i) => ({
    id: `mir-${i}`, position: i + 1, title: `가게 ${i + 1}`,
    period: null, venue: null, hours: null, price: null, note: null, links: [],
  })),
};

/**
 * ── 식사 갈래 두 건 — **「지난 설문」이 두 갈래를 실제로 가르는지** 재려고 둔다.
 *
 * MEAL_PAST 의 id 는 **진짜 설문 uuid** 다. app/src/data/meetups.ts 의
 * history-museum(2026-08-22)에 이 id 가 적혀 있어서, 그 날짜가 지난 지금은
 * 「지난 설문」 으로 내려가야 한다. 가짜 id 를 쓰면 연결이 진짜로 걸려 있는지
 * 끝내 못 재므로 일부러 진짜 값을 쓴다.
 *
 * MEAL_LOOSE 는 **마감됐지만 어느 모임과도 안 이어진** 설문이다.
 * 이것이 있어야 「마감이면 무조건 내린다」 는 잘못된 구현이 걸린다 —
 * 그 구현은 이 설문도 히스토리로 내려 버린다.
 */
const MEAL_PAST = {
  id: '5e97b1a0-0000-4000-8000-000000000902',
  title: '서울역사박물관 저녁식사 장소 추천', intro: null,
  multi_choice: true,
  opens_at: iso(now - 72 * HOUR), closes_at: iso(now - 48 * HOUR),
  created_by: '', results_visible: 'always', show_names: 'none', hide_after_days: null,
  category: 'meal', imported_respondents: 13,
  /**
   * **이름 하나는 일부러 길고 띄어쓰기가 없다.**
   * 짧은 이름만 두었더니 「글자를 200% 로 키워도 안 겹친다」 검사가 헛돌았다 —
   * overflow-wrap 을 지워도 통과했다. 실제로 넘쳤던 것이 이런 긴 이름이다.
   */
  survey_options: ['사발', '신의주찹쌀순대광화문점', '올리페페광화문점'].map((t, i) => ({
    id: `meal-p-${i}`, position: i + 1, title: t,
    period: null, venue: null, hours: null, price: null, note: null, links: [],
  })),
};

const MEAL_LOOSE = {
  ...MEAL_PAST, id: 'srv-meal-loose', title: '아직 모임이 안 잡힌 식사 설문',
  imported_respondents: null,
  survey_options: MEAL_PAST.survey_options.map((o) => ({ ...o, id: `${o.id}-l` })),
};

/* ── 브라우저 ────────────────────────────────────────────── */

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 900 },
  locale: 'ko-KR', timezoneId: 'Asia/Seoul' });

/** 화면이 보낸 RPC 를 여기에 적어 둔다 */
let sent = [];
let stored = [];          // 서버에 저장된 것처럼 굴 목록

await ctx.route('**/rest/v1/**', async (route) => {
  const req = route.request();
  const url = req.url();
  const json = (body) => route.fulfill({ status: 200,
    contentType: 'application/json', body: JSON.stringify(body) });

  if (url.includes('/rest/v1/surveys')) {
    return json([OPEN_SURVEY, CLOSED_SURVEY, MANY_SURVEY, MIRROR_SURVEY,
      MEAL_PAST, MEAL_LOOSE]);
  }

  if (url.includes('/rpc/')) {
    const name = url.split('/rpc/')[1].split('?')[0];
    let body = {};
    try { body = JSON.parse(req.postData() ?? '{}'); } catch { /* 그대로 */ }
    sent.push({ name, body });

    /**
     * **가짜 명부.** 진짜 서버처럼 예/아니오만 답한다.
     * 이걸 안 두면 화면이 명부 거절을 한 번도 안 겪어 보고 통과한다.
     */
    if (name === 'survey_roster_on') return json(true);
    if (name === 'survey_member_ok') {
      const z = String(body.p_zone ?? '').replace(/[^0-9]/g, '');
      const n = String(body.p_name ?? '').trim();
      return json(z === '4133' && n === '홍길동');
    }
    if (name === 'survey_my_choices') return json(stored.map((id) => ({ option_id: id })));
    if (name === 'survey_submit') {
      stored = [...(body.p_options ?? [])];
      /**
       * **진짜와 똑같이 204 에 빈 본문을 준다.**
       * 처음에는 `null` 이라는 본문 있는 답을 주도록 흉내 냈는데,
       * 그래서 `res.json()` 이 빈 본문에서 터지는 것을 못 잡았다 —
       * 검사는 통과하고 라이브에서 제출이 실패했다.
       * 가짜 서버가 진짜보다 친절하면 검사가 거짓말을 한다.
       */
      return route.fulfill({ status: 204, body: '' });
    }
    if (name === 'survey_tally') {
      if (body.p_survey === 'srv-many') {
        return json(MANY_SURVEY.survey_options.map((o, i) => ({
          option_id: o.id, votes: MANY_VOTES[i] })));
      }
      if (body.p_survey === 'srv-closed') {
        return json(CLOSED_SURVEY.survey_options.map((o, i) => ({
          option_id: o.id, votes: [4, 2, 1][i] })));
      }
      if (body.p_survey === 'srv-mirror') {
        return json(MIRROR_SURVEY.survey_options.map((o, i) => ({
          option_id: o.id, votes: [6, 8, 1][i] })));
      }
      if (body.p_survey === MEAL_PAST.id) {
        return json(MEAL_PAST.survey_options.map((o, i) => ({
          option_id: o.id, votes: [8, 6, 2][i] })));
      }
      if (body.p_survey === MEAL_LOOSE.id) {
        return json(MEAL_LOOSE.survey_options.map((o, i) => ({
          option_id: o.id, votes: [1, 0, 0][i] })));
      }
      return json(OPEN_SURVEY.survey_options.map((o, i) => ({
        option_id: o.id, votes: stored.includes(o.id) ? 3 + i : i })));
    }
    if (name === 'survey_response_count') {
      if (body.p_survey === 'srv-many') return json(13);
      if (body.p_survey === 'srv-closed') return json(5);
      if (body.p_survey === 'srv-mirror') return json(13);
      if (body.p_survey === MEAL_PAST.id) return json(13);
      if (body.p_survey === MEAL_LOOSE.id) return json(1);
      return json(stored.length ? 1 : 0);
    }
    return json([]);
  }
  return route.continue();
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));

const go = async () => {
  await page.goto('about:blank');
  await page.goto(`http://localhost:8261${BASE}/#/survey`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.survey-head', { timeout: 20000 });
  await page.waitForTimeout(600);
};

/* ── 1. 그려지는가 ──────────────────────────────────────── */

console.log('\n── 화면');
await go();

const heads = await page.$$eval('.survey-head h3', (es) => es.map((e) => e.textContent.trim()));
ok('설문 네 건이 보인다', heads.length === 4, heads.join(' · '));

/**
 * 마감된 설문은 **결과 화면**이라 체크박스가 없다. 그래서 후보 칸은 진행 중인 3개뿐이다.
 * (잠긴 체크박스를 늘어놓으면 "왜 안 눌리지" 를 먼저 겪게 되므로 갈랐다.)
 */
const opts = await page.$$('.survey-option');
ok('진행 중 설문의 후보만 체크 칸이 있다', opts.length === 3, `${opts.length}개`);

const links = await page.$$eval('.survey-link',
  (es) => es.map((e) => ({ t: e.textContent.trim(), h: e.getAttribute('href') })));

/**
 * 링크가 뜨는 자리는 **둘**이다 — 진행 중 설문의 후보 칸과,
 * 마감된 설문의 접힌 `후보 자세히 보기`.
 * 뒤엣것을 만들기 전에는 앞엣것만 세면 됐는데, 이제 합쳐서 세면
 * 어느 쪽이 늘고 줄었는지 알 수 없다. 자리를 갈라서 잰다.
 */
const openLinks = await page.$$('.survey-option .survey-link');
const foldedLinks = await page.$$('.survey-details .survey-link');
ok('진행 중 설문의 링크', openLinks.length === 2, `${openLinks.length}개`);
ok('마감 설문의 링크가 접힌 채로 남아 있다', foldedLinks.length === 2, `${foldedLinks.length}개`);
ok('링크는 이 두 자리에만 있다', links.length === openLinks.length + foldedLinks.length,
  `${links.length}개 — ${links.map((l) => l.t).join(', ')}`);

/** 접기는 기본으로 닫혀 있어야 한다 — 결과부터 보여 주려는 것이다 */
const folded = await page.$('.survey-details');
if (folded) ok('후보 자세히 보기는 접힌 채로 뜬다', !(await folded.evaluate((e) => e.open)));
ok('javascript: 주소가 걸러졌다', !links.some((l) => /^javascript:/i.test(l.h ?? '')));
ok('링크는 새 창으로 연다',
  await page.$$eval('.survey-link', (es) => es.every((e) => e.target === '_blank'
    && (e.rel || '').includes('noopener'))));

/* ── 2. 이름을 받기 전에는 못 고른다 ────────────────────── */

console.log('\n── 이름 먼저');
const firstBox = await page.$('.survey-option input');
ok('이름 전에는 체크가 잠겨 있다', await firstBox.isDisabled());

await page.click('.survey-who .survey-submit');
await page.waitForTimeout(400);
let status = await page.$eval('.survey-message.error', (e) => e.textContent.trim()).catch(() => '');
ok('빈 채로 확인하면 막는다', status.includes('구역번호'), status.slice(0, 40));

/**
 * **명부에 없으면 그 자리에서 알려 준다.**
 * 답을 화면 맨 아래에만 두었더니 후보 네 개를 지나 화면 밖에 떠서,
 * 눌러 놓고도 아무 일 없는 것처럼 보였다. 고칠 칸 바로 옆에 있어야 한다.
 */
await page.fill('.survey-field.zone input', '4133');
await page.fill('.survey-field.name input', '없는이름');
await page.click('.survey-who .survey-submit');
await page.waitForTimeout(600);
const denied = await page.$eval('.survey-who .survey-message.error', (e) => e.textContent.trim())
  .catch(() => '');
ok('명부에 없으면 등록된 회원이 아니라고 한다', denied.includes('등록된 회원이 아닙니다'), denied.slice(0, 34));
ok('그 안내가 이름 칸 안에 있다', (await page.$$('.survey-who .survey-message')).length === 1);
ok('명부에 없으면 체크가 안 풀린다',
  await page.$eval('.survey-option input', (e) => e.disabled));

/* ── 3. 이름을 넣으면 열린다 ────────────────────────────── */

await page.fill('.survey-field.zone input', '4133');
await page.fill('.survey-field.name input', '홍길동');
await page.click('.survey-who .survey-submit');
await page.waitForTimeout(700);

ok('이전 응답을 물어봤다', sent.some((s) => s.name === 'survey_my_choices'));
const askedWho = sent.find((s) => s.name === 'survey_my_choices')?.body ?? {};
ok('구역번호와 이름을 함께 보냈다',
  askedWho.p_zone === '4133' && askedWho.p_name === '홍길동',
  JSON.stringify({ z: askedWho.p_zone, n: askedWho.p_name }));

ok('이제 체크할 수 있다', !(await (await page.$('.survey-option input')).isDisabled()));

/* ── 4. 고르고 제출 ─────────────────────────────────────── */

console.log('\n── 응답');
sent = [];
const boxes = await page.$$('.survey-option input:not([disabled])');
await boxes[0].click();
await boxes[2].click();
await page.waitForTimeout(200);

const submit = await page.$$('.survey-actions .survey-submit');
await submit[submit.length - 1].click();
await page.waitForTimeout(800);

const sub = sent.find((s) => s.name === 'survey_submit')?.body ?? {};
ok('제출을 보냈다', !!sent.find((s) => s.name === 'survey_submit'));
ok('고른 둘만 보냈다', Array.isArray(sub.p_options) && sub.p_options.length === 2
  && sub.p_options.includes('opt-1') && sub.p_options.includes('opt-3'),
  JSON.stringify(sub.p_options));
ok('제출 뒤 알려 준다',
  (await page.$eval('.survey-message.done', (e) => e.textContent.trim()).catch(() => '')).includes('제출'));
ok('제출 뒤 집계를 다시 읽는다',
  sent.filter((s) => s.name === 'survey_tally').length >= 1);

const votes = await page.$$eval('.survey-votes', (es) => es.map((e) => e.textContent.trim()));
ok('집계가 보인다', votes.length >= 3, votes.slice(0, 3).join(' · '));

/* ── 5. 다시 오면 이전 선택이 살아 있다 ─────────────────── */

console.log('\n── 다시 응답');
await go();
await page.fill('.survey-field.zone input', '4133');
await page.fill('.survey-field.name input', '홍길동');
await page.click('.survey-who .survey-submit');
await page.waitForTimeout(800);

const checked = await page.$$eval('.survey-option input:not([disabled])',
  (es) => es.map((e) => e.checked));
ok('이전에 고른 둘이 체크되어 있다',
  checked.filter(Boolean).length === 2, `${checked.filter(Boolean).length}개`);
ok('다시 응답임을 알려 준다',
  (await page.$eval('.survey-message', (e) => e.textContent.trim()).catch(() => '')).includes('이전'));
const again = await page.$$eval('.survey-actions .survey-submit',
  (es) => es.map((e) => e.textContent.trim()));
ok('버튼이 「다시 제출」로 바뀐다', again.includes('다시 제출'), again.join(' · '));

/* ── 6. 마감된 설문 ─────────────────────────────────────── */

console.log('\n── 마감');
// 마감 설문에는 체크 칸 자체가 없고 결과만 있다
ok('마감 설문에 체크 칸이 없다', (await page.$$('.survey-option.locked')).length === 0);
ok('결과만 보여 주는 설문이 셋', (await page.$$('.survey-result')).length === 3,
  `${(await page.$$('.survey-result')).length}개`);

/**
 * **마감 전인데도 고를 수 없어야 한다.**
 * 옮겨 온 설문에서 응답을 받으면 그 표는 집계에 안 나타난다 —
 * 저장은 되는데 보이지 않으니 회원은 자기 표가 반영된 줄 안다. 그게 제일 나쁘다.
 */
const mirrorNote = await page.$$eval('.survey-mirror-note', (es) => es.map((e) => e.textContent));
ok('톡방에서 한다고 알려 준다', mirrorNote.length === 1
  && mirrorNote[0].includes('톡방에서 진행'), `${mirrorNote.length}개`);
const mirrorTag = await page.$$eval('.survey-head .tag', (es) => es.map((e) => e.textContent.trim()));
ok('진행 중이라고 표시한다', mirrorTag.includes('톡방에서 진행 중'), mirrorTag.join(' · '));
ok('옮겨 온 설문에 이름 칸이 없다', (await page.$$('.survey-who')).length === 1,
  `${(await page.$$('.survey-who')).length}개`);

/**
 * **색을 돌려쓰지 않는지 본다.**
 *
 * 후보가 다섯을 넘으면 색이 모자란다. 처음에는 그냥 돌려썼고,
 * 식사 설문(후보 13곳)에서 6번째부터 앞의 색이 다시 나왔다 —
 * 같은 색이 다른 곳을 가리키니 색이 이름 노릇을 못 한다.
 * 그때는 전부 한 색으로 가야 하고, 이름은 옆 글자가 맡는다.
 */
const results = await page.$$('.survey-result');
// 카드 수가 기대와 다르면 여기서 TypeError 로 죽어 **뒤의 검사가 통째로 안 돌았다.**
// 깨끗하게 빈 배열을 주고 그 자리에서만 실패하게 한다.
const swatchesOf = async (n) => (results[n]
  ? results[n].$$eval('.chart .chart-swatch', (es) => es.map((e) => getComputedStyle(e).backgroundColor))
  : []);

// 후보 3개 — 자리마다 제 색을 쓴다
const few = await swatchesOf(0);
ok('후보가 적으면 자리마다 다른 색', few.length === 3 && new Set(few).size === 3,
  `후보 ${few.length}개 · 색 ${new Set(few).size}가지`);

// 후보 8개 — 색이 모자라므로 돌려쓰지 않고 한 색으로 간다
const many = await swatchesOf(1);
ok('후보가 많으면 색을 돌려쓰지 않는다', many.length === 8 && new Set(many).size === 1,
  `후보 ${many.length}개 · 색 ${new Set(many).size}가지`);

/* ── 마감 설문의 지표와 읽을 거리 ──────────────────────── */

console.log('\n── 마감 설문의 지표');

/**
 * 후보 8개짜리 마감 설문(표 6·1·3·0·0·8·6·1 · 참여 13명)에서
 * 지표가 실제로 계산되는지 본다. 눈으로 "있네" 가 아니라 값을 맞춰 본다.
 */
const stats = await results[1].$$eval('.stat', (es) => es.map((e) => ({
  label: e.querySelector('.stat-label').textContent.trim(),
  value: e.querySelector('.stat-value').textContent.trim(),
})));
const val = (l) => stats.find((x) => x.label === l)?.value ?? '';
ok('참여 인원', val('참여') === '13명', val('참여'));
ok('고른 항목 합계', val('고른 항목') === '25개', val('고른 항목'));
ok('표를 받은 후보', val('표를 받은 후보') === '6/8', val('표를 받은 후보'));
ok('1위 득표율', val('1위 득표율') === '62%', val('1위 득표율'));

const insight = await results[1].$$eval('.metrics .analysis-lines li',
  (es) => es.map((e) => e.textContent.trim()));
ok('읽을 거리가 나온다', insight.length >= 3, `${insight.length}줄`);

// **조사를 괄호로 두지 않는다** — `사발이(가)` 는 읽기가 걸린다
ok('괄호 조사가 없다', !insight.some((l) => /이\(가\)|은\(는\)/.test(l)),
  insight.find((l) => /이\(가\)|은\(는\)/.test(l)) ?? '없음');

/**
 * **`13명 중 0명` 을 줄마다 되풀이하지 않는다.**
 * 0표가 여럿이면 같은 글자가 반복돼 눈에 걸린다. 분모는 캡션이 한 번만 말한다.
 */
const vals = await results[1].$$eval('.chart-bar-val', (es) => es.map((e) => e.textContent.trim()));
ok('0표는 짧게 적는다', vals.filter((v) => v === '없음').length === 2,
  vals.join(' · '));
ok('분모를 줄마다 되풀이하지 않는다', !vals.some((v) => v.includes('중')),
  vals.find((v) => v.includes('중')) ?? '없음');

// 이름만 있는 후보에는 작품 특징 표를 그리지 않는다 (확인 필요만 늘어선다)
ok('특징 없는 설문에는 특징 표가 없다',
  (await results[1].$$('.analysis')).length === 0);
const badges = await page.$$eval('.survey-deadline', (es) => es.map((e) => e.textContent.trim()));
ok('마감 표시가 있다', badges.some((b) => b.includes('마감됨')), badges.join(' | '));
const whoForms = await page.$$('.survey-who');
ok('받는 설문에만 이름 칸이 있다', whoForms.length === 1, `${whoForms.length}개`);

/* ── 지난 설문 (식사 갈래) ──────────────────────────────────
 *
 * 여기서 재는 것은 **두 갈래를 가르는가** 다.
 *   마감 + 이어진 모임이 지났다 → 「지난 설문」 으로 내린다
 *   마감 + 안 이어졌다          → 그대로 둔다
 * 두 번째가 없으면 「마감이면 무조건 내린다」 는 잘못된 구현이 그냥 통과한다.
 */

console.log('\n── 지난 설문 (식사)');
await page.goto('about:blank');
await page.goto(`http://localhost:8261${BASE}/#/survey/meal`, { waitUntil: 'networkidle' });
await page.waitForSelector('.survey-history, .survey-head', { timeout: 20000 });
await page.waitForTimeout(900);

const pastCards = await page.$$('.survey-past');
ok('모임까지 끝난 설문이 지난 설문으로 내려간다', pastCards.length === 1, `${pastCards.length}개`);

const liveHeads = await page.$$eval('.survey-head h3', (es) => es.map((e) => e.textContent.trim()));
ok('안 이어진 마감 설문은 그대로 남는다',
  liveHeads.length === 1 && liveHeads[0] === '아직 모임이 안 잡힌 식사 설문',
  liveHeads.join(' · ') || '한 건도 없다');

if (pastCards.length === 1) {
  const card = pastCards[0];
  ok('지난 설문은 접힌 채로 뜬다', !(await card.evaluate((e) => e.open)));

  const sum = await card.$eval('summary', (e) => e.innerText.replace(/\s+/g, ' ').trim());
  /** 접히면 화면 낭독기는 이 줄만 읽는다. 무엇이었는지가 여기 다 있어야 한다. */
  ok('접힌 줄에 설문 제목이 있다', sum.includes('서울역사박물관 저녁식사'), sum.slice(0, 40));
  ok('접힌 줄에 연관 전시 관람이 있다', sum.includes('연관 전시 관람') && sum.includes('8월 정기관람'),
    /연관 전시 관람[^A-Za-z]*?([^\n]{0,34})/.exec(sum)?.[1] ?? '없다');
  ok('접힌 줄에 설문 결과가 있다', /설문 결과.*\d+명/.test(sum),
    /설문 결과\s*([^\n]{0,24})/.exec(sum)?.[1] ?? '없다');
  ok('접힌 줄에 종료된 일자가 있다', sum.includes('종료된 일자'));

  const before = await page.$$eval('.survey-past-body .survey-result',
    (es) => es.reduce((n, e) => n + e.getBoundingClientRect().height, 0));
  ok('접힌 동안에는 결과가 화면에 없다', before === 0, `${Math.round(before)}px`);

  /**
   * **높이만 재면 안 된다.** summary 안에 네 줄이 들어 있어 높이가 늘 100px 을 넘는다 —
   * padding 과 min-height 를 통째로 0 으로 만들어도 이 검사는 ✓ 가 떴다. 실패할 수 없는 검사였다.
   * 실제로 깨지는 것은 **여백**이다: 위아래 여백이 없으면 글자가 카드 테두리에 붙고,
   * 오른쪽 여백이 없으면 ⌄ 화살표가 글자 위로 올라탄다.
   */
  const box = await card.$eval('summary', (e) => {
    const r = e.getBoundingClientRect(); const c = getComputedStyle(e);
    return { w: Math.round(r.width), h: Math.round(r.height),
      pt: parseFloat(c.paddingTop), pb: parseFloat(c.paddingBottom), pr: parseFloat(c.paddingRight) };
  });
  ok('접기 손잡이가 24px 이상', box.h >= 24 && box.w >= 24, `${box.w}×${box.h}`);
  ok('접기 줄에 여백이 있다 (글자가 테두리·화살표에 안 붙는다)',
    box.pt >= 8 && box.pb >= 8 && box.pr >= 20,
    `위 ${box.pt} · 아래 ${box.pb} · 오른쪽 ${box.pr}`);

  await card.$eval('summary', (e) => e.click());
  await page.waitForTimeout(1200);
  const after = await page.$$eval('.survey-past-body .survey-result',
    (es) => es.reduce((n, e) => n + e.getBoundingClientRect().height, 0));
  ok('열면 결과가 보인다', after > 0, `${Math.round(after)}px`);
  ok('열면 화살표가 뒤집힌다',
    await card.$eval('summary', (e) => getComputedStyle(e, '::after').content.includes('⌃')));
}
/**
 * **글자를 키워도 글자끼리 겹치면 안 된다 (WCAG 1.4.4 Resize Text).**
 *
 * 휴대폰에서 글꼴을 키워 보는 분이 실제로 겪는다. 잰 적이 없어서 몰랐는데,
 * 320px 화면에서 글자를 200% 로 키우니 막대 그래프의 가게 이름이 표 수 위로
 * 7곳 올라타 있었다 — 띄어쓰기 없는 한글 이름이 `word-break: keep-all` 때문에
 * 쪼개지지 않고 옆 칸으로 넘친 것이다.
 *
 * 글자 상자가 아니라 **글자마디의 진짜 사각형(Range)** 을 잰다.
 * 요소 상자만 보면 넘친 글자가 부모 안에 있는 것처럼 보여 못 잡는다.
 */
await page.setViewportSize({ width: 320, height: 900 });
await page.waitForTimeout(400);
await page.evaluate((scale) => {
  // **한 번에 모아 읽고 나서** 적용한다. 하나씩 읽고 쓰면 자식이 부모의 커진 값을
  // 또 배로 키워 4배·8배가 된다 — 그러면 겹침이 아니라 측정 방법이 결함이 된다.
  const els = [...document.querySelectorAll('body *')];
  const sizes = els.map((e) => parseFloat(getComputedStyle(e).fontSize));
  els.forEach((e, i) => { if (Number.isFinite(sizes[i])) e.style.fontSize = `${sizes[i] * scale}px`; });
}, 2);
await page.waitForTimeout(500);
const zoomHits = await page.evaluate(() => {
  const rects = [];
  for (const el of document.querySelectorAll('.chart-bar-row span, .chart-bar-head span')) {
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const box of r.getClientRects()) {
        if (box.width > 0 && box.height > 0) {
          rects.push({ cls: el.className, t: n.textContent.trim().slice(0, 12), box });
        }
      }
    }
  }
  const hit = [];
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i].box; const c = rects[j].box;
      const w = Math.min(a.right, c.right) - Math.max(a.left, c.left);
      const h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
      if (w > 1 && h > 1) hit.push(`${rects[i].cls}「${rects[i].t}」↔${rects[j].cls}「${rects[j].t}」`);
    }
  }
  return { hit, seen: rects.length };
});
ok('글자를 200% 로 키워도 글자끼리 안 겹친다', zoomHits.hit.length === 0,
  zoomHits.hit.length ? zoomHits.hit.slice(0, 3).join(' | ') : `글자마디 ${zoomHits.seen}개 확인`);
// 넘치면 **무엇이** 넘쳤는지 말한다. 그냥 ✗ 만 뜨면 어디를 고쳐야 할지 모른다.
const spill = await page.evaluate(() => {
  const over = [...document.querySelectorAll('.wrap *')]
    .filter((e) => e.scrollWidth > e.clientWidth + 1)
    .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ${e.scrollWidth}>${e.clientWidth}`);
  const far = [...document.querySelectorAll('.wrap *')]
    .map((e) => ({ s: `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`,
      r: Math.round(e.getBoundingClientRect().right) }))
    .sort((x, y) => y.r - x.r).slice(0, 3);
  return { doc: document.documentElement.scrollWidth, win: window.innerWidth,
    over: over.slice(0, 4), far: far.map((x) => `${x.s}→${x.r}`) };
});
ok('그때도 가로로 넘치지 않는다', spill.doc <= spill.win + 1,
  `문서 ${spill.doc} / 창 ${spill.win} · 칸 넘침 [${spill.over.join(', ')}] · 오른쪽 끝 [${spill.far.join(', ')}]`);
await page.setViewportSize({ width: 390, height: 900 });



/**
 * **흐리기로 「비활성」 을 표현하지 않았는지 여기서 못박는다.**
 * 이 화면의 대비 검사는 opacity 를 식에 넣지 않는다. 그래서 `opacity: .5` 를 걸면
 * 실제로는 2:1 로 떨어져도 「대비 기준 이상」 이 ✓ 로 나온다.
 * 식을 고치는 대신, **이 자리에서는 흐리기 자체를 금지**한다 — 훨씬 잡기 쉽다.
 */
const dimmed = await page.$$eval('.survey-history, .survey-history *, .survey-off, .survey-off *',
  (es) => es.filter((e) => Number(getComputedStyle(e).opacity) < 1)
    .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`).slice(0, 4));
ok('지난 설문과 마감 설문에 흐리기를 쓰지 않았다', dimmed.length === 0, dimmed.join(', '));


/**
 * **참여가 적으면 접힌 줄이 비율을 외치면 안 된다.**
 *
 * 펼친 화면은 참여 3명 미만이면 「1위 득표율」 을 아예 안 보여 주고
 * 「한 명만 달라져도 순위가 뒤집힙니다」 라고 적는다. 접힌 줄만 「2명 (100%)」 이라고
 * 외치면 한 화면이 서로 반대되는 말을 하게 된다.
 *
 * 이 갈래는 지금 자료(13명)로는 절대 안 나온다. 그래서 응답을 2건으로 바꿔치고 잰다.
 */
await page.route('**/rpc/survey_tally', async (route) => {
  const b = JSON.parse(route.request().postData() ?? '{}');
  if (b.p_survey !== MEAL_PAST.id) return route.fallback();
  return route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify([{ option_id: MEAL_PAST.survey_options[0].id, votes: 2 }]) });
});
await page.route('**/rpc/survey_response_count', async (route) => {
  const b = JSON.parse(route.request().postData() ?? '{}');
  if (b.p_survey !== MEAL_PAST.id) return route.fallback();
  return route.fulfill({ status: 200, contentType: 'application/json', body: '2' });
});
await page.goto('about:blank');
await page.goto(`http://localhost:8261${BASE}/#/survey/meal`, { waitUntil: 'networkidle' });
await page.waitForSelector('.survey-past', { timeout: 20000 });
await page.waitForTimeout(1100);
const thin = await page.$eval('.survey-past > summary',
  (e) => e.innerText.replace(/\s+/g, ' ').trim());
ok('참여가 적으면 비율을 외치지 않는다', !/\(\d+%\)/.test(thin),
  /설문 결과\s*([^\n]{0,40})/.exec(thin)?.[1] ?? thin.slice(0, 40));
ok('참여가 적다는 것을 접힌 줄에도 적는다', thin.includes('참여가 적어'),
  /설문 결과\s*([^\n]{0,40})/.exec(thin)?.[1] ?? '없다');
await page.unroute('**/rpc/survey_tally');
await page.unroute('**/rpc/survey_response_count');

/**
 * **포커스 표시도 대비를 지켜야 한다 (WCAG 1.4.11 · 3:1).**
 * 알파 24% 짜리 테두리를 쓰고 있었는데 카드 바탕 위에 합성하면 1.43:1 이었다.
 * 글자 대비 검사는 색의 알파를 버리고 앞 세 숫자만 보므로 이것을 못 잡는다.
 */
await page.goto(`http://localhost:8261${BASE}/#/survey/meal`, { waitUntil: 'networkidle' });
await page.waitForSelector('.survey-past', { timeout: 20000 });
await page.waitForTimeout(700);
const focusRatio = await page.evaluate(() => {
  const el = document.querySelector('.survey-past > summary');
  el.focus();
  const c = getComputedStyle(el);
  const num = (s) => (s.match(/[0-9.]+/g) ?? []).map(Number);
  const [r, g, b, a = 1] = num(c.outlineColor);
  let bg = [255, 255, 255];
  for (let e = el; e; e = e.parentElement) {
    const m = num(getComputedStyle(e).backgroundColor);
    if (m.length && (m.length < 4 || m[3] > 0.5)) { bg = m.slice(0, 3); break; }
  }
  const mix = [r, g, b].map((v, i) => v * a + bg[i] * (1 - a));
  const lum = (c2) => { const v = c2.map((x) => { const t = x / 255;
    return t <= 0.03928 ? t / 12.92 : ((t + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const x = lum(mix); const y = lum(bg);
  return { r: (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05), w: parseFloat(c.outlineWidth) };
});
ok('포커스 표시가 3:1 이상이다', focusRatio.r >= 3 && focusRatio.w >= 2,
  `${focusRatio.r.toFixed(2)}:1 · ${focusRatio.w}px`);

/** 마감은 **글자로도** 알린다 — 색만으로 가르지 않는다 */
const offTag = await page.$eval('.survey-off .tag',
  (e) => ({ t: e.textContent.trim(), h: Math.round(e.getBoundingClientRect().height) }))
  .catch(() => null);
ok('마감 설문에 「마감」 이라고 적혀 있다', offTag?.t === '마감' && offTag.h > 0,
  offTag ? `${offTag.t} ${offTag.h}px` : '태그가 없다');

/* ── 달력의 「설문 참여하기」 카드 ────────────────────────────
 *
 * 여기서 재는 것은 **「마감」 과 「없음」 을 가르는가** 다.
 *   마감 + 모임이 아직   → 「마감 · N명」 (아직 볼 일이 남았다)
 *   모임까지 끝났다      → 그 갈래에 남은 것이 없으니 「없음」
 *
 * 이 갈래는 화면 대조 검사가 못 본다 — 그쪽 시계는 2026-08-22 에 묶여 있고
 * 그날은 모임 당일이라 「없음」 이 아예 안 그려진다. 여기가 유일하게 잴 수 있는 자리다.
 */

console.log('\n── 달력 카드');

const jumpRows = async () => page.$$eval('.survey-jump-list li',
  (es) => es.map((e) => e.textContent.trim().replace(/\s+/g, ' ')));

// ① 목 그대로 — 식사 갈래에는 「모임이 아직인 마감 설문」(MEAL_LOOSE)이 남아 있다
await page.goto('about:blank');
await page.goto(`http://localhost:8261${BASE}/#/calendar`, { waitUntil: 'networkidle' });
await page.waitForSelector('.survey-jump-list li', { timeout: 20000 });
await page.waitForTimeout(1500);
const withLoose = await jumpRows();
ok('모임이 아직인 마감 설문은 「마감」 이라고 적는다',
  withLoose.some((t) => t.includes('식사') && t.includes('마감') && !t.includes('없음')),
  withLoose.join(' / '));

// ② 식사 갈래에 **모임까지 끝난 것만** 남겼을 때
await page.route('**/rest/v1/surveys*', (route) => route.fulfill({ status: 200,
  contentType: 'application/json', body: JSON.stringify([OPEN_SURVEY, MEAL_PAST]) }));
await page.goto('about:blank');
await page.goto(`http://localhost:8261${BASE}/#/calendar`, { waitUntil: 'networkidle' });
await page.waitForSelector('.survey-jump-list li', { timeout: 20000 });
await page.waitForTimeout(1800);
const onlyPast = await jumpRows();
ok('모임까지 끝났으면 「없음」 이라고 적는다',
  onlyPast.some((t) => t.includes('식사') && t.includes('없음')), onlyPast.join(' / '));
ok('그때 「마감」 이라고는 안 적는다',
  !onlyPast.some((t) => t.includes('식사') && t.includes('마감')), onlyPast.join(' / '));

/** 「없음」 배지는 「진행 중」 과 **같은 모양**이어야 한다 (운영자가 그렇게 정했다). */
const jumpBadges = await page.$$eval('.survey-jump-state b', (es) => es.map((e) => {
  const c = getComputedStyle(e);
  return { t: e.textContent.trim(),
    css: `${c.backgroundColor}|${c.color}|${c.borderRadius}|${c.fontSize}|${c.fontWeight}` };
}));
const run = jumpBadges.find((x) => x.t === '진행 중');
const none = jumpBadges.find((x) => x.t === '없음');
ok('「없음」 과 「진행 중」 이 같은 배지 모양이다',
  !!run && !!none && run.css === none.css,
  run && none ? `${none.css}${run.css === none.css ? '' : ` ≠ ${run.css}`}`
    : `배지 ${jumpBadges.map((x) => x.t).join(', ') || '없다'}`);

await page.unroute('**/rest/v1/surveys*');

/* ── 7. 누르는 크기와 오류 ──────────────────────────────── */

console.log('\n── 마무리');

/**
 * **두 화면을 다 잰다.** 예전에는 마지막에 열려 있던 화면 하나만 쟀다.
 * 식사 화면을 열고 나서 그대로 재니 잰 글자가 187개에서 66개로 줄었다 —
 * 전시 화면의 색이 통째로 검사망 밖으로 나간 것인데, 화면에는 「통과」 로 보인다.
 *
 * **접힌 것은 열고 잰다.** 닫힌 <details> 안은 offsetParent 가 null 이라
 * 아래 두 검사가 아예 안 본다. 접어 두었다는 이유로 색과 누르는 크기가
 * 감사에서 빠지면, 접기를 넣을수록 검사가 눈을 감는 꼴이 된다.
 */
const measureScreen = async (route) => {
  await page.goto('about:blank');
  await page.goto(`http://localhost:8261${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.survey-head, .survey-history', { timeout: 20000 });
  await page.waitForTimeout(700);
  return measureA11y(page);   // 접힌 것을 펼치고 잰다
};
const SCREENS = [['전시', '/#/survey'], ['식사', '/#/survey/meal']];
const allSmall = [];
const allTexts = [];
for (const [label, route] of SCREENS) {
  const r = await measureScreen(route);
  allSmall.push(...r.small.map((t) => ({ ...t, c: `${label} ${t.c}` })));
  allTexts.push(...r.texts);
  console.log(`  · ${label} 화면 — 글자 ${r.texts.length}개 · 누르는 것 확인`);
}

ok('누르는 것이 모두 24px 이상', allSmall.length === 0,
  allSmall.map((t) => `${t.c} ${t.w}×${t.h}`).join(', '));

const dim = dimTexts(allTexts);

ok('글자 대비가 모두 기준 이상', dim.length === 0, dim.join(' | '));
ok(`대비를 잰 글자 ${allTexts.length}개`, allTexts.length >= 200, `${allTexts.length}개`);

ok('오류 없음', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();

server.close();

console.log(`\n${fails.length ? `설문 화면 검사 실패 — ${fails.length}건: ${fails.join(', ')}`
  : '설문 화면 검사 통과'}`);
process.exit(fails.length ? 1 : 0);
