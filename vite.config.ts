import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  plugins: [react()],

  // 정적 자산은 여기서 그대로 복사된다.
  // app/public 은 아직 **현재 라이브 사이트**라 건드리지 않는다 —
  // 이식(R-01-04·05)이 끝난 뒤에 배포 경로를 dist 로 바꾼다.
  publicDir: 'static',

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
