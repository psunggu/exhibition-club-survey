#!/usr/bin/env node
/**
 * validate-csp-build.mjs — 빌드 산출물이 CSP를 어기지 않는지 확인한다 (R-01-07).
 *
 *   npm run build && node scripts/validate-csp-build.mjs
 *
 * 페이지가 `script-src 'self'` · `style-src 'self'` · `script-src-attr 'none'` ·
 * `style-src-attr 'none'` 을 선언한다. **인라인이 하나라도 나오면 그 부분이 조용히 죽는다.**
 * 화면이 통째로 안 뜨는 게 아니라 일부만 안 먹어서, 눈으로는 놓치기 쉽다.
 *
 * 빌드 도구가 인라인을 뿜는 자리는 정해져 있다.
 *   · 모듈 프리로드 폴리필 → 인라인 <script>
 *   · assetsInlineLimit → CSS 안의 data: URI
 *   · 일부 플러그인 → style= 속성
 * vite.config.ts 에서 막아 뒀고, 이 검사기는 **막힌 채로 있는지**를 본다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST)) {
  console.error('dist/ 가 없다. 먼저 `npm run build` 를 돌린다.');
  process.exit(1);
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});

const files = walk(DIST);
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const problems = [];

/**
 * 주석은 실행되지 않는다. 스캔 전에 걷어낸다.
 * 걷어내지 않으면 "인라인 <script> 를 쓰지 마라" 라고 적은 주석 자체가
 * 위반으로 잡힌다 — 실제로 그렇게 걸렸다.
 */
const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

// ── HTML: 인라인 script/style, style= 속성, 외부 호스트
for (const f of files.filter((f) => f.endsWith('.html'))) {
  const html = stripComments(fs.readFileSync(f, 'utf8'));

  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] ?? '';
    const body = (m[2] ?? '').trim();
    if (body && !/\bsrc=/i.test(attrs))
      problems.push(`${rel(f)}: 인라인 <script> 가 있다 (${body.length}자) — modulePreload 폴리필일 가능성이 높다`);
  }

  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi))
    if ((m[1] ?? '').trim())
      problems.push(`${rel(f)}: 인라인 <style> 가 있다 (${(m[1] ?? '').trim().length}자)`);

  for (const m of html.matchAll(/\sstyle\s*=\s*["'][^"']*["']/gi))
    problems.push(`${rel(f)}: style= 속성이 있다 — ${m[0].trim().slice(0, 60)}`);

  // on* 이벤트 속성도 script-src-attr 'none' 에 걸린다
  for (const m of html.matchAll(/\son[a-z]+\s*=\s*["'][^"']*["']/gi))
    problems.push(`${rel(f)}: 인라인 이벤트 속성이 있다 — ${m[0].trim().slice(0, 40)}`);

  // 외부 호스트를 부르면 default-src 'self' 에 걸린다
  for (const m of html.matchAll(/(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi)) {
    const url = m[1] ?? '';
    if (!/^https:\/\/[^/]*\.supabase\.co\//.test(url))
      problems.push(`${rel(f)}: 외부 호스트를 부른다 — ${url}`);
  }

  // CSP 선언 자체가 살아 있는지
  if (!/http-equiv=["']Content-Security-Policy["']/i.test(html))
    problems.push(`${rel(f)}: CSP meta 선언이 없다`);
}

// ── CSS: @import 로 외부를 부르거나 data: URI 가 박혔는지
for (const f of files.filter((f) => f.endsWith('.css'))) {
  const css = fs.readFileSync(f, 'utf8');
  for (const m of css.matchAll(/@import\s+(?:url\()?["']?(https?:\/\/[^"')]+)/gi))
    problems.push(`${rel(f)}: 외부 @import — ${m[1]}`);
  for (const m of css.matchAll(/url\(\s*["']?(https?:\/\/[^"')]+)/gi))
    problems.push(`${rel(f)}: 외부 자산을 부른다 — ${m[1]}`);
  // 이미지 data: URI 는 img-src 'self' data: 로 허용되지만,
  // 폰트는 default-src 'self' 라 data: 가 막힌다
  for (const m of css.matchAll(/url\(\s*["']?data:font\/[^"')]+/gi))
    problems.push(`${rel(f)}: 폰트가 data: URI 로 박혔다 — default-src 'self' 에 막힌다`);
}

// ── 자산 경로가 base 를 따르는지. 틀리면 배포 후 전부 404 다.
const BASE = '/exhibition-club-survey/';
for (const f of files.filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/(?:src|href)\s*=\s*["'](\/[^"']*)["']/gi)) {
    const url = m[1] ?? '';
    if (!url.startsWith(BASE))
      problems.push(`${rel(f)}: 절대 경로가 base(${BASE})를 따르지 않는다 — ${url}`);
  }
}

if (problems.length) {
  console.error('CSP 빌드 검사 실패\n');
  problems.forEach((p) => console.error(`  · ${p}`));
  console.error('\nvite.config.ts 의 modulePreload · assetsInlineLimit 를 확인한다.\n');
  process.exit(1);
}

const html = files.filter((f) => f.endsWith('.html')).length;
const css = files.filter((f) => f.endsWith('.css')).length;
const js = files.filter((f) => f.endsWith('.js')).length;
console.log(`CSP 빌드 검사 통과 — HTML ${html} · CSS ${css} · JS ${js} · 인라인 없음 · base 경로 일치`);
