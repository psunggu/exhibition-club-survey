#!/usr/bin/env node
/**
 * make-share-images.mjs — 링크 미리보기 카드와 홈 화면 아이콘을 다시 그린다 (2026-11-23).
 *
 *   node scripts/make-share-images.mjs
 *
 * 카카오톡에 주소를 붙이면 뜨는 카드(`og-card.png`, 1200×630)와 「홈 화면에 추가」 때 깔리는 아이콘
 * (`icons/icon-180 · 192 · 512.png`, 탭 아이콘 `icons/icon.svg` · `icon-32.png`)을 `app/public/` 에 쓴다.
 * 그림은 여기 적힌 SVG 를 Playwright 로 찍어 만든다 — 바깥 도구 · 바깥 그림을 쓰지 않는다.
 * 문구나 모양을 바꾸면 이 파일을 고쳐 다시 돌리고, `app/index.html` 의 `?v=` 를 올린다
 * (카카오톡은 미리보기를 오래 붙들고 있다 — 주소가 같으면 옛 카드가 뜬다).
 *
 * 색은 `tokens.css` 의 값과 같다(그림 파일은 `var()` 를 못 읽어 값을 옮겨 적었다 — AGENTS.md 「그림 파일의 색은 예외」).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { HERMETIC_LAUNCH } from './hermetic-browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app/public');
const GREEN = '#0f6e56'; const PAPER = '#f6f4ef'; const INK = '#1f1e1b'; const INK2 = '#55534b'; const LINE = '#d9d5ca';
const TITLE = '41교구 전시·박물관 동아리';
const SUBTITLE = '모임 일정 · 관람 정보 · 투표';

/** 액자 안의 풍경 — 전시를 보러 가는 모임이라는 것만 말한다. 0~512 좌표. */
const mark = `
  <rect x="112" y="136" width="288" height="240" rx="20" fill="none" stroke="#fff" stroke-width="26"/>
  <circle cx="318" cy="216" r="26" fill="#fff"/>
  <path d="M138 350 L226 240 L286 312 L322 270 L374 350 Z" fill="#fff"/>`;
/** 홈 화면 아이콘은 모서리까지 채운다(둥글리기는 휴대폰이 한다). 탭 아이콘만 스스로 둥글다. */
const icon = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${rx}" fill="${GREEN}"/>${mark}</svg>\n`;
const font = (w, f) => `@font-face{font-family:P;font-weight:${w};src:url("${pathToFileURL(path.join(OUT, 'fonts', f)).href}") format("woff2")}`;
/** 카카오톡은 카드를 2:1 로 잘라 보여 주기도 한다 — 글과 그림을 위아래 가운데에 모은다. */
const card = `<!doctype html><meta charset="utf-8"><style>
  ${font(800, 'Pretendard-ExtraBold.subset.woff2')}${font(600, 'Pretendard-SemiBold.subset.woff2')}
  html,body{margin:0}body{width:1200px;height:630px;background:${PAPER};font-family:P,sans-serif;display:flex;align-items:center;justify-content:center;gap:56px;box-sizing:border-box;border-bottom:14px solid ${GREEN}}
  svg{width:220px;height:220px;flex:none;border-radius:48px}
  h1{margin:0;font-size:74px;font-weight:800;color:${INK};letter-spacing:-1.5px;line-height:1.2;word-break:keep-all}
  p{margin:22px 0 0;font-size:40px;font-weight:600;color:${INK2}}
  small{display:block;margin-top:30px;padding-top:24px;border-top:3px solid ${LINE};font-size:28px;font-weight:600;color:${GREEN}}
</style>${icon(0).trim()}<div><h1>${TITLE.replace(' 동아리', '<br>동아리')}</h1><p>${SUBTITLE}</p><small>psunggu.github.io/exhibition-club-survey</small></div>`;

fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'icons/icon.svg'), icon(96));
const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR ?? '/tmp'), 'share-images-'));
const browser = await chromium.launch(HERMETIC_LAUNCH);
try {
  const shot = async (html, w, h, out) => {
    const file = path.join(tmp, 'page.html'); fs.writeFileSync(file, html);
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, out), clip: { x: 0, y: 0, width: w, height: h } });
    await page.close();
    console.log(`  ${out} — ${w}×${h} · ${(fs.statSync(path.join(OUT, out)).size / 1024).toFixed(1)}KB`);
  };
  const full = (size) => `<!doctype html><style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${icon(0)}`;
  for (const size of [180, 192, 512]) await shot(full(size), size, size, `icons/icon-${size}.png`);
  await shot(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:32px;height:32px}</style>${icon(96)}`, 32, 32, 'icons/icon-32.png');
  await shot(card, 1200, 630, 'og-card.png');
} finally {
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log('그렸다 — app/public/og-card.png · app/public/icons/');
