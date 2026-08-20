#!/usr/bin/env node
/**
 * validate-accessibility.mjs — 글자 대비와 누르는 크기가 다시 낮아지지 않게 지킨다.
 *
 *   node scripts/validate-accessibility.mjs
 *
 * ── 왜 지켜야 하나 ──────────────────────────────────────────
 * 회원 대부분이 톡방에서 휴대폰으로 연다. 밝은 데서 보는 사람도 있고,
 * 달력 칩은 눌러서 상세를 여는 버튼이다. 그래서 두 가지를 잰다 —
 *   · 작은 글자는 배경과 4.5:1  (WCAG 2.1 AA · 큰 글자는 3:1)
 *   · 누르는 것은 24px 이상     (WCAG 2.5.8 AA)
 *
 * 색을 조금 밝게 바꾸거나 padding 을 줄이면 조용히 기준 아래로 내려간다.
 * 눈으로는 거의 티가 안 나므로 사람이 알아채지 못한다 — 그래서 잰다.
 *
 * **경계에 딱 붙이지 않는다.** 처음 고쳤을 때 4.4999…:1 이 나와
 * 반올림에 따라 통과와 미달을 오갔다. 그래서 여유를 둔 값을 쓴다.
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
await new Promise((r) => server.listen(8252, r));

/** WCAG 상대 휘도 → 대비비 */
const lum = (c) => {
  const v = c.map((x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const contrast = (a, b) => {
  const x = lum(a); const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 },
  locale: 'ko-KR', timezoneId: 'Asia/Seoul' });

const fails = [];
const notes = [];

/**
 * 화면이 **다 그려진 뒤에** 재야 한다.
 *
 * 처음에는 시간만 기다렸다가, 보드가 아직 "불러오는 중"일 때 재고
 * "글자 6개 검사 통과" 라고 말했다. 아무것도 안 보고 통과하는 검사기는
 * 없느니만 못하다 — 그래서 기다릴 것을 이름으로 적고, 덜 그려졌으면 실패시킨다.
 */
const READY = { 일정: '.cal .cell', 보드: '.exhibition-card' };
const MIN_TEXTS = { 일정: 100, 보드: 300 };

for (const [name, route] of [['일정', '#/calendar'], ['보드', '#/']]) {
  // 해시만 바꾸면 다시 그리지 않을 수 있다. 매번 새로 연다.
  await page.goto('about:blank');
  await page.goto(`http://localhost:8252${BASE}/${route}`, { waitUntil: 'networkidle' });
  try {
    await page.waitForSelector(READY[name], { timeout: 30000, state: 'attached' });
  } catch {
    fails.push(`${name} 화면이 그려지지 않아 잴 수 없었다 (${READY[name]} 없음)`);
    continue;
  }
  await page.waitForTimeout(1200);

  const data = await page.evaluate(() => {
    const rgb = (s) => { const m = s.match(/\d+/g); return m ? m.slice(0, 3).map(Number) : null; };
    /** 투명한 조상을 거슬러 올라가 실제로 깔린 색을 찾는다 */
    const bgOf = (el) => {
      for (let e = el; e; e = e.parentElement) {
        const c = getComputedStyle(e).backgroundColor;
        const m = c.match(/[\d.]+/g);
        if (m && (m.length < 4 || parseFloat(m[3]) > 0.5)) return rgb(c);
      }
      return [255, 255, 255];
    };
    /**
     * `children.length === 0` 으로만 거르면 <br> 이 든 문단이 빠진다 —
     * 실제로 그래서 꼬리말(2.79:1)을 처음 감사에서 놓쳤다.
     * 그래서 자식이 <br>·<b>·<span> 뿐인 것도 글자 마디로 본다.
     */
    const INLINE = new Set(['BR', 'B', 'STRONG', 'EM', 'I', 'SPAN', 'A', 'SMALL']);
    const leafish = (e) => [...e.children].every((c) => INLINE.has(c.tagName));

    const texts = [...document.querySelectorAll('p,span,h1,h2,h3,h4,dt,dd,li,button,a,summary,strong,b')]
      .filter((e) => e.offsetParent !== null && leafish(e) && (e.textContent || '').trim())
      .map((e) => {
        const c = getComputedStyle(e);
        return { sel: e.className.toString().split(' ')[0] || e.tagName.toLowerCase(),
          size: parseFloat(c.fontSize) || 0, weight: Number(c.fontWeight) || 400,
          fg: rgb(c.color), bg: bgOf(e), txt: (e.textContent || '').trim().slice(0, 22) };
      });

    const targets = [...document.querySelectorAll('a,button,summary,input,[role="button"]')]
      .filter((e) => e.offsetParent !== null)
      .map((e) => { const r = e.getBoundingClientRect();
        return { sel: e.className.toString().split(' ')[0] || e.tagName.toLowerCase(),
          w: Math.round(r.width), h: Math.round(r.height),
          txt: (e.textContent || '').trim().slice(0, 22) }; })
      .filter((t) => t.h > 0);

    /**
     * **한 줄일 때의 높이**를 규칙에서 계산한다.
     *
     * 재기만 하면 지금 데이터에 기댄다 — 실제로 달력 칩은 글자가 두 줄로 접혀
     * padding 을 21px 짜리로 되돌려도 40px 로 재졌고, 검사기가 통과시켰다.
     * 짧은 칩 하나만 생기면 바로 기준 아래로 내려간다.
     * 그래서 글자 한 줄 + 위아래 여백 + 테두리로 최소 높이를 따진다.
     */
    const minHeights = [];
    for (const sel of ['.chip', '.official-info-link', '.lchip']) {
      const e = [...document.querySelectorAll(sel)].find((x) => x.offsetParent !== null);
      if (!e) continue;
      const c = getComputedStyle(e);
      const fs = parseFloat(c.fontSize) || 0;
      const lhRaw = c.lineHeight;
      const lh = lhRaw === 'normal' ? fs * 1.2 : (parseFloat(lhRaw) || fs * 1.2);
      const box = c.boxSizing === 'border-box';
      const pad = (parseFloat(c.paddingTop) || 0) + (parseFloat(c.paddingBottom) || 0);
      const bd = (parseFloat(c.borderTopWidth) || 0) + (parseFloat(c.borderBottomWidth) || 0);
      const minH = parseFloat(c.minHeight) || 0;
      const oneLine = Math.max(box ? Math.max(lh + pad + bd, minH) : lh + pad + bd, minH);
      minHeights.push({ sel, oneLine: Math.round(oneLine * 10) / 10 });
    }

    return { texts, targets, minHeights };
  });

  const seen = new Set();
  for (const t of data.texts) {
    if (!t.fg || !t.bg) continue;
    const large = t.size >= 18.66 || (t.size >= 14 && t.weight >= 700);
    const need = large ? 3 : 4.5;
    const r = contrast(t.fg, t.bg);
    // 소수점 셋째 자리에서 반올림해 비교한다 — 4.4999 를 미달로 부르지 않기 위해서다
    if (Math.round(r * 100) / 100 >= need) continue;
    const key = `${name}.${t.sel}`;
    if (seen.has(key)) continue;
    seen.add(key);
    fails.push(`${name} .${t.sel} 글자 대비 ${r.toFixed(2)}:1 (필요 ${need}) "${t.txt}"`);
  }

  const seenT = new Set();
  for (const t of data.targets) {
    if (t.h >= 24 && t.w >= 24) continue;
    const key = `${name}.${t.sel}`;
    if (seenT.has(key)) continue;
    seenT.add(key);
    fails.push(`${name} .${t.sel} 누르는 크기 ${t.w}×${t.h}px (필요 24px) "${t.txt}"`);
  }

  // 글자가 한 줄인 경우에도 24px 를 넘는가 — 지금 데이터가 어떻든 성립해야 한다
  for (const m of data.minHeights ?? []) {
    if (m.oneLine >= 24) continue;
    fails.push(`${name} ${m.sel} 글자가 한 줄이면 높이 ${m.oneLine}px (필요 24px) `
      + '— 지금은 글자가 접혀 넘기고 있을 뿐, 짧은 항목이 생기면 바로 내려간다');
  }

  // 잰 개수가 터무니없이 적으면 화면이 덜 그려진 것이다 — 통과로 넘기지 않는다
  if (data.texts.length < MIN_TEXTS[name]) {
    fails.push(`${name} 글자를 ${data.texts.length}개밖에 못 쟀다 (최소 ${MIN_TEXTS[name]}) `
      + '— 화면이 덜 그려진 채로 잰 것이므로 통과로 볼 수 없다');
  }
  notes.push(`${name} 글자 ${data.texts.length} · 누르는 것 ${data.targets.length}`);
}

await browser.close();
server.close();

if (fails.length) {
  console.log(`접근성 검사 실패 — ${fails.length}건\n`);
  fails.forEach((f) => console.log(`  · ${f}`));
  console.log('\n색은 색조를 두고 밝기만 낮춘다. 누르는 것은 padding 을 키운다.');
  process.exit(1);
}
console.log(`접근성 검사 통과 — ${notes.join(' · ')} (대비 4.5:1 · 누르는 크기 24px)`);
