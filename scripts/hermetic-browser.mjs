/**
 * hermetic-browser.mjs — 검사용 브라우저가 **바깥 서버에 닿지 않게** 한다 (2026-11-17).
 *
 * 보드가 포스터를 남의 서버(KOPIS · KOBIS · 미술관)에서 부르게 된 뒤(#286 · #288), 화면 검사가
 * `networkidle` 을 기다리다 그 서버가 느린 날 30초 시간 초과로 죽었다 — 11/14 새벽 영화 배치의
 * PR(#291)이 그렇게 CI 에서 떨어져 순위가 사흘 묵었다. GitHub 러너는 KOBIS 에 아예 못 붙는다.
 * 검사가 재는 것은 우리 화면이지 남의 서버가 아니다.
 *
 * 127.0.0.1 밖의 이름은 풀리지 않게 한다 — 요청이 곧바로 실패해 기다릴 것이 없다.
 * `page.route` 로 가로채 채워 주는 요청(Supabase 고정본 등)은 이름 풀이보다 앞에서 잡히므로 그대로 된다.
 * 포스터는 못 불러오면 빈 칸으로 그려지고 칸 크기는 같다(`.rank-poster` 의 aspect-ratio) — 화면 기준과 무관하다.
 *
 * 쓰는 법: `chromium.launch(HERMETIC_LAUNCH)`. 바깥 사이트를 읽는 스크립트(recheck · render-notice)에는 쓰지 않는다.
 */
export const HERMETIC_LAUNCH = {
  args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost'],
};
