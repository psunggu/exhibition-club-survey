/**
 * static-server.mjs — 화면 검사가 `dist/` 를 띄우는 작은 정적 서버. 검사기 일곱이 같이 쓴다.
 *
 * ── 왜 한 곳에 모았나 ──────────────────────────────────────
 * 전에는 검사기마다 같은 서버를 베껴 두었는데, 두 가지가 비어 있었다(2026-09-27 보안 점검).
 *   1. 주소 없이 `listen(port)` 해서 **모든 네트워크에** 열렸다. 맥 방화벽이 꺼져 있으면
 *      `npm run check` 가 도는 2분 동안 같은 와이파이의 다른 기기도 붙을 수 있었다.
 *   2. `..%2f` 를 풀어 그대로 `path.join` 해서 **`dist/` 밖 파일을 내줬다** — `~/.ssh` 까지.
 * 하나만 고치면 나머지 여섯이 그대로 남으므로 한 곳에서 막는다.
 *
 * ── 규칙 ───────────────────────────────────────────────────
 * - 내 컴퓨터(127.0.0.1)에서만 받는다. 검사도 **`http://127.0.0.1:…` 로 연다 — localhost 로 열지 않는다.**
 *   브라우저는 localhost 를 ::1 부터 두드리는데, 다른 작업 공간의 검사가 같은 포트를 ::1 로 잡고 있으면
 *   오류 없이 **그쪽 화면을 재게 된다**(예전 서버는 같은 포트면 EADDRINUSE 로 멈췄다).
 * - 풀어 낸 경로가 루트 밖이면 404. 잘못된 `%` 나 NUL 도 404 — 전에는 던져서 검사가 죽었다.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

/** 사이트 주소의 앞부분(vite `base`) */
export const BASE = '/exhibition-club-survey';

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css',
  '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };

/**
 * 요청 주소 → 루트 안의 파일 경로. 루트 밖이거나 읽을 수 없는 주소면 null.
 * 검사하기 쉽게 서버와 떼어 둔다.
 */
export function resolveRequest(rawUrl, root, { base = BASE, spa = false } = {}) {
  let u;
  try { u = decodeURIComponent((rawUrl ?? '/').split('?')[0]); } catch { return null; }
  if (u.includes('\0')) return null;
  if (u.startsWith(base)) u = u.slice(base.length);
  if (u === '' || u === '/') u = '/index.html';
  if (spa && !path.extname(u)) u = '/index.html';
  const top = path.resolve(root);
  const p = path.resolve(top, '.' + path.sep + u);
  return p.startsWith(top + path.sep) ? p : null;
}

/**
 * `root` 를 `port` 에 띄운다. 다 쓰면 돌려받은 서버를 `close()` 한다.
 * `spa` 는 확장자 없는 주소를 index.html 로 돌린다(record-frozen-data 만 쓴다).
 */
export function serveStatic(root, port, { base = BASE, spa = false } = {}) {
  const server = http.createServer((req, res) => {
    const p = resolveRequest(req.url, root, { base, spa });
    if (!p) { res.writeHead(404); res.end('404'); return; }
    fs.readFile(p, (e, d) => {
      if (e) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(p)] ?? 'application/octet-stream' });
      res.end(d);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}
