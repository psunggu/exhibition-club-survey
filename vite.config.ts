import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// package.json 이 type: module 이라 CommonJS 의 __dirname 이 없다.
// 빌드가 우연히 통과해도 언젠가 undefined 로 터진다.
const HERE = path.dirname(fileURLToPath(import.meta.url))

/**
 * 정적 파일을 **원본 자리에서** 가져온다. 복사본을 저장소에 두지 않는다.
 *
 * config.js 에는 anon 키가 들어 있고, scripts/validate-repository-hygiene.mjs 가
 * **키가 한 파일에만 있는지** 검사한다. 복사본을 만들면 그 검사가 잡는다 —
 * 실제로 잡혔고, 그래서 이렇게 바꿨다.
 *
 * app/public 을 publicDir 로 쓰지 못하는 이유는 그 안에 지금 라이브로 나가는
 * index.html · notice.html 이 있어서다. 이식이 끝나면 정리한다 (R-01-02).
 */
function copyLiveAssets(): Plugin {
  const FILES = [
    'config.js',
    'weekly-digest.public.json',
    // 운영진이 만든 식당 검토 문서. 설문 화면에서 링크로 열린다.
    // 인라인 <style> 을 걷어내고 표 수를 최종 집계로 고쳐 올린 판이다.
    'meal-review.html',
    'meal-review.css',
  ]
  const from = (f: string) => path.resolve(HERE, 'app/public', f)
  return {
    name: 'copy-live-assets',
    apply: 'build',
    generateBundle() {
      for (const f of FILES) {
        const p = from(f)
        if (!fs.existsSync(p)) throw new Error(`정적 파일이 없다: ${p}`)
        this.emitFile({ type: 'asset', fileName: f, source: fs.readFileSync(p) })
      }
      this.emitFile({ type: 'asset', fileName: 'notice.html', source: NOTICE_REDIRECT })
    },
  }
}

/**
 * `/notice.html` 은 **이미 단톡방에 공유된 주소다.**
 * 배포를 dist 로 옮기면 그 링크가 404 가 된다 — 회원이 옛 메시지를 눌렀을 때 빈 화면을 본다.
 *
 * 스크립트가 아니라 `meta refresh` 로 넘긴다. CSP 가 `script-src 'self'` 라
 * 인라인 스크립트는 못 쓰지만 meta 는 막히지 않는다.
 * 자동 이동이 안 되는 환경을 위해 링크도 함께 둔다.
 */
const NOTICE_REDIRECT = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; style-src 'none'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests" />
  <meta http-equiv="refresh" content="0; url=./#/calendar" />
  <title>모임 일정 안내 — 옮겨졌습니다</title>
  <link rel="canonical" href="./#/calendar" />
</head>
<body>
  <p>모임 일정 안내가 <a href="./#/calendar">새 주소</a>로 옮겨졌습니다.</p>
  <p>자동으로 넘어가지 않으면 위 링크를 눌러 주세요.</p>
</body>
</html>
`

// dev 서버에서도 같은 파일을 내준다
function serveLiveAssets(): Plugin {
  return {
    name: 'serve-live-assets',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /\/(config\.js|weekly-digest\.public\.json)$/.exec(req.url ?? '')
        if (!m) return next()
        const name = m[1] as string
        const p = path.resolve(HERE, 'app/public', name)
        if (!fs.existsSync(p)) return next()
        res.setHeader('content-type', name.endsWith('.js') ? 'text/javascript' : 'application/json')
        res.end(fs.readFileSync(p))
      })
    },
  }
}

/**
 * 이 설정에서 CSP 때문에 못 건드리는 것들이 있다 (R-01-07).
 *
 * 페이지가 `script-src 'self'` · `style-src 'self'` 를 선언하고 있어서
 * **인라인 <script> · <style> · style= 이 하나라도 나오면 화면이 깨진다.**
 * 빌드 도구가 조용히 인라인을 뿜는 자리가 몇 군데 있어 아래에서 막았다.
 * 바꾸기 전에 `npm run check:csp` 로 확인할 것.
 */
export default defineConfig({
  root: 'app',
  // GitHub Pages 는 https://psunggu.github.io/exhibition-club-survey/ 에 붙는다.
  // base 가 틀리면 자산 경로가 전부 404 가 된다.
  base: '/exhibition-club-survey/',
  plugins: [react(), copyLiveAssets(), serveLiveAssets()],

  // publicDir 은 쓰지 않는다. 정적 파일은 위 플러그인이 app/public 에서 가져온다.
  publicDir: false,

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // 모듈 프리로드 폴리필은 **인라인 <script> 로 들어간다.** CSP 에 걸린다.
    modulePreload: { polyfill: false },
    // 작은 자산을 data: URI 로 인라인하면 CSS 안에 박힌다. 파일로 내보낸다.
    assetsInlineLimit: 0,
    cssCodeSplit: true,
    sourcemap: false,
    target: 'es2020',
  },

  server: { port: 5173, host: true },
})
