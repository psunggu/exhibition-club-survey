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
  const FILES = ['config.js', 'weekly-digest.public.json']
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
    },
  }
}

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
