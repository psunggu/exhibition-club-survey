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
    return json([OPEN_SURVEY, CLOSED_SURVEY, MANY_SURVEY, MIRROR_SURVEY]);
  }

  if (url.includes('/rpc/')) {
    const name = url.split('/rpc/')[1].split('?')[0];
    let body = {};
    try { body = JSON.parse(req.postData() ?? '{}'); } catch { /* 그대로 */ }
    sent.push({ name, body });

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
      return json(OPEN_SURVEY.survey_options.map((o, i) => ({
        option_id: o.id, votes: stored.includes(o.id) ? 3 + i : i })));
    }
    if (name === 'survey_response_count') {
      if (body.p_survey === 'srv-many') return json(13);
      if (body.p_survey === 'srv-closed') return json(5);
      if (body.p_survey === 'srv-mirror') return json(13);
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
ok('쓸 수 있는 링크만 남았다', links.length === 2,
  `${links.length}개 — ${links.map((l) => l.t).join(', ')}`);
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
const swatchesOf = async (n) => (await results[n].$$eval('.chart .chart-swatch',
  (es) => es.map((e) => getComputedStyle(e).backgroundColor)));

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

/* ── 7. 누르는 크기와 오류 ──────────────────────────────── */

console.log('\n── 마무리');
const small = await page.$$eval('a,button,input',
  (es) => es.filter((e) => e.offsetParent !== null)
    .map((e) => { const r = e.getBoundingClientRect();
      return { c: e.className.toString().split(' ')[0] || e.tagName, w: Math.round(r.width), h: Math.round(r.height) }; })
    .filter((t) => t.h > 0 && (t.h < 24 || t.w < 24)));
ok('누르는 것이 모두 24px 이상', small.length === 0,
  small.map((t) => `${t.c} ${t.w}×${t.h}`).join(', '));

/**
 * 글자 대비도 여기서 잰다.
 *
 * validate-accessibility.mjs 는 일정·보드만 본다 — 설문은 데이터가 있어야
 * 내용이 그려져서 그쪽에서는 빈 화면밖에 못 잰다. 가짜 데이터가 있는 여기가
 * 잴 수 있는 유일한 자리다. **새 화면을 검사망 밖에 두지 않는다.**
 */
const lum = (c) => {
  const v = c.map((x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const contrast = (a, b) => {
  const x = lum(a); const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const texts = await page.evaluate(() => {
  const rgb = (s) => { const m = s.match(/\d+/g); return m ? m.slice(0, 3).map(Number) : null; };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      const m = c.match(/[\d.]+/g);
      if (m && (m.length < 4 || parseFloat(m[3]) > 0.5)) return rgb(c);
    }
    return [255, 255, 255];
  };
  const INLINE = new Set(['BR', 'B', 'STRONG', 'EM', 'I', 'SPAN', 'A', 'SMALL', 'SVG']);
  return [...document.querySelectorAll('.wrap p, .wrap span, .wrap h1, .wrap h3, .wrap a, .wrap button, .wrap div')]
    .filter((e) => e.offsetParent !== null
      && [...e.children].every((c) => INLINE.has(c.tagName.toUpperCase()))
      && (e.textContent || '').trim())
    .map((e) => {
      const c = getComputedStyle(e);
      return { sel: e.className.toString().split(' ')[0] || e.tagName.toLowerCase(),
        size: parseFloat(c.fontSize) || 0, weight: Number(c.fontWeight) || 400,
        fg: rgb(c.color), bg: bgOf(e), txt: (e.textContent || '').trim().slice(0, 20) };
    });
});
const dim = [];
const seenSel = new Set();
for (const t of texts) {
  if (!t.fg || !t.bg) continue;
  const large = t.size >= 18.66 || (t.size >= 14 && t.weight >= 700);
  const need = large ? 3 : 4.5;
  const r = contrast(t.fg, t.bg);
  if (Math.round(r * 100) / 100 >= need) continue;
  if (seenSel.has(t.sel)) continue;
  seenSel.add(t.sel);
  dim.push(`.${t.sel} ${r.toFixed(2)}:1 (필요 ${need}) "${t.txt}"`);
}
ok('글자 대비가 모두 기준 이상', dim.length === 0, dim.join(' | '));
ok(`대비를 잰 글자 ${texts.length}개`, texts.length >= 30, `${texts.length}개`);

ok('오류 없음', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
server.close();

console.log(`\n${fails.length ? `설문 화면 검사 실패 — ${fails.length}건: ${fails.join(', ')}`
  : '설문 화면 검사 통과'}`);
process.exit(fails.length ? 1 : 0);
