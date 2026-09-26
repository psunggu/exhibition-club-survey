/**
 * 화면마다 보던 자리를 기억했다가, 돌아오면 거기 세운다 — 뒤로 · 앞으로 가기, 새로 고침,
 * 다른 페이지(설문 결과 등)에 다녀오기 모두.
 *
 * ── 왜 브라우저에 맡기지 않나 (2026-09-26 실측) ───────────────
 * · 해시 이동으로 뒤로 가면 브라우저는 **옛 화면이 아직 그려져 있을 때** 자리를 되살린다.
 *   짧은 쪽 길이에 걸리고, 보드는 목록을 새로 받아 오느라 처음엔 더 짧다 —
 *   일정 1500px 에서 다녀오면 1066px 에, 보드 3000px 에서 다녀오면 맨 위에 섰다.
 * · 새로 고침은 맨 위 띠가 붙은 뒤로 1500px → 1548px · 0px 로 들쭉날쭉했다.
 * 그래서 전부 여기서 한다(`scrollRestoration = 'manual'`).
 *
 * ── 어떻게 ─────────────────────────────────────────────────
 * 기록 칸(history entry)마다 이름표(`siteKey`)를 단다 — 새로 고침 뒤에도 state 는 남는다.
 * 스크롤할 때마다 그 이름표 아래 자리를 적고(replaceState 는 사파리가 횟수를 막으므로
 * 메모리에), 잠깐 뒤 · 페이지를 떠날 때 sessionStorage 에 옮긴다 — 새로 고침 · 다른
 * 페이지에서 돌아오기는 메모리가 비기 때문이다. 적는 것은 이름표와 숫자뿐이다.
 * 뒤로 가면 popstate 가 **브라우저가 옛 화면 길이에 걸린 자리로 스크롤을 내기 전에**
 * 돌아갈 자리를 떠 둔다.
 */

const STORE = 'site-scroll'
/** 한 탭에서 이만큼만 기억한다 — 오래된 것부터 버린다. */
const KEEP = 60
/** 되살리기를 그만두는 때 — 회원이 스스로 움직이기 시작하면 끌어당기지 않는다. */
const GIVE_UP = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const

const positions = load()
/** 뒤로 · 앞으로 가기로 도착한 칸과 돌아갈 자리. 다음 화면 그리기에서 한 번 쓰고 비운다. */
let pending: { key: string; y: number | undefined; at: number } | null = null
/** 되살리는 동안에는 적지 않는다 — 덜 자란 페이지에 걸린 자리를 기억하면 안 된다. */
let restoring = false
let saveTimer = 0

function load(): Map<string, number> {
  try {
    const raw = JSON.parse(sessionStorage.getItem(STORE) ?? '[]') as unknown
    if (Array.isArray(raw)) {
      return new Map(raw.filter((e): e is [string, number] =>
        Array.isArray(e) && typeof e[0] === 'string' && typeof e[1] === 'number'))
    }
  } catch { /* 사생활 보호 모드 · 깨진 값 — 기억 없이 시작한다 */ }
  return new Map()
}

function save() {
  window.clearTimeout(saveTimer)
  try { sessionStorage.setItem(STORE, JSON.stringify([...positions].slice(-KEEP))) } catch { /* 못 적으면 메모리만 쓴다 */ }
}

function remember(key: string, y: number) {
  positions.delete(key)   // 최근에 쓴 것을 뒤로 — 넘치면 앞에서부터 버린다
  positions.set(key, Math.round(y))
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(save, 300)
}

const keyOf = (): string | undefined => {
  const k: unknown = history.state?.siteKey
  return typeof k === 'string' ? k : undefined
}

/** 해시 링크로 새 기록 칸이 생기면 state 가 비어 있다 — 이름표를 단다. */
function tagEntry() {
  if (keyOf()) return
  const siteKey = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  history.replaceState({ ...(history.state ?? {}), siteKey }, '')
}

/** 링크를 누르는 순간의 자리를 적는다. */
export function rememberHere() {
  tagEntry()
  const key = keyOf()
  if (key) remember(key, window.scrollY)
}

/** 이번 화면 바뀜이 뒤로 · 앞으로 가기였으면 돌아갈 자리를, 아니면 undefined 를 준다. 한 번만. */
export function takePending(): number | undefined {
  const p = pending
  pending = null
  if (!p || p.key !== keyOf()) return undefined
  return p.y
}

/** 새로 고침 · 다른 페이지에서 돌아온 칸이면 그때의 자리를 준다. 처음 온 칸은 이름표가 없다. */
export function savedHere(): number | undefined {
  const key = keyOf()
  return key ? positions.get(key) : undefined
}

/**
 * y 에 세운다. 페이지가 아직 짧으면 자랄 때마다 다시 맞추다가,
 * 닿거나 6초가 지나거나 회원이 움직이면 멈추고 그 자리를 적는다.
 * 돌려주는 함수는 **적지 않고** 그만둔다 — 화면이 또 바뀌어 거둘 때 쓴다.
 */
export function restoreTo(y: number) {
  window.scrollTo(0, y)
  if (Math.abs(window.scrollY - y) <= 1) return undefined
  restoring = true
  const grow = new ResizeObserver(() => {
    window.scrollTo(0, y)
    if (Math.abs(window.scrollY - y) <= 1) stop()
  })
  const timer = window.setTimeout(() => stop(), 6000)
  function cancel() {
    grow.disconnect()
    window.clearTimeout(timer)
    for (const ev of GIVE_UP) window.removeEventListener(ev, stop)
    restoring = false
  }
  function stop() {
    cancel()
    const key = keyOf()
    if (key) remember(key, window.scrollY)
  }
  grow.observe(document.body)
  for (const ev of GIVE_UP) window.addEventListener(ev, stop, { passive: true })
  return cancel
}

/** 스크롤 · 뒤로 가기 · 해시 바뀜 · 떠나기를 지켜본다. 떼어 내는 함수를 돌려준다. */
export function watchScroll() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  tagEntry()
  let frame = 0
  const onScroll = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      // 뒤로 가기가 막 일어났으면 브라우저가 옛 화면 길이에 걸린 자리일 수 있다 — 다시 그려질 때까지 적지 않는다
      if (restoring || (pending && performance.now() - pending.at < 1000)) return
      const key = keyOf()
      if (key) remember(key, window.scrollY)
    })
  }
  const onPop = () => {
    const key = keyOf()
    pending = key ? { key, y: positions.get(key), at: performance.now() } : null
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('popstate', onPop)
  window.addEventListener('hashchange', tagEntry)
  // 떠나는 순간의 자리까지 적고 옮겨 둔다 — 새로 고침 · 다른 페이지에 다녀오기
  const onHide = () => {
    const key = keyOf()
    if (key && !restoring) positions.set(key, Math.round(window.scrollY))
    save()
  }
  window.addEventListener('pagehide', onHide)
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('popstate', onPop)
    window.removeEventListener('hashchange', tagEntry)
    window.removeEventListener('pagehide', onHide)
  }
}
