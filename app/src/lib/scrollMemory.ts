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
/**
 * 지금 돌고 있는 되살리기(멈추는 함수). **한 번에 하나만** 돈다 — 새로 고침 뒤 보드 목록을
 * 기다리던 되살리기가 뒤로 가기 뒤까지 남아 앞 화면을 보드의 자리로 끌고 가 그 자리를
 * 앞 화면 것으로 적었다(2026-09-26 검토). 도는 동안에는 자리를 적지 않는다.
 */
let active: (() => void) | null = null
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

/** 링크를 누르는 순간의 자리를 적는다. 링크로 연 새 화면에서도 부른다 — 맨 위(0)를 적어 둔다. */
export function rememberHere() {
  active?.()
  tagEntry()
  const key = keyOf()
  if (key) remember(key, window.scrollY)
}

/** 이번 화면 바뀜이 뒤로 · 앞으로 가기였으면 돌아갈 자리를, 아니면 undefined 를 준다. 한 번만. */
export function takePending(): number | undefined {
  const p = pending
  pending = null
  if (!p || p.key !== keyOf()) return undefined
  // 이름표는 있는데 적힌 자리가 없으면(오래돼 버렸거나) 맨 위 — 앞 화면의 자리를 물려받지 않게
  return p.y ?? 0
}

/** 새로 고침 · 다른 페이지에서 돌아온 칸이면 그때의 자리를 준다. 처음 온 칸은 이름표가 없다. */
export function savedHere(): number | undefined {
  const key = keyOf()
  return key ? positions.get(key) : undefined
}

/**
 * y 에 세운다. 닿았다고 바로 멈추지 않는다 — **글꼴이 다 오고 페이지가 잠잠해질 때까지**
 * 흔들리면 다시 맞춘다. 리눅스처럼 한글 글꼴이 없는 기기는 Pretendard 가 오기 전의
 * 대체 글꼴로 먼저 그려져, 자리를 맞춘 뒤 글꼴이 바뀌면 일정은 25px, 보드는 카드가
 * 83px 밀렸다(2026-09-26 CI). 6초가 지나거나 회원이 움직이면 멈추고 그 자리를 적는다.
 * 돌려주는 함수는 **적지 않고** 그만둔다 — 화면이 또 바뀌어 거둘 때 쓴다.
 */
export function restoreTo(y: number) {
  active?.()
  const key = keyOf()
  let ended = false
  /**
   * 글꼴이 다 왔는지는 **멈출 때마다 새로** 본다. 처음 한 번만 보면 틀린다 — 되살리기가 시작될 때는
   * 글꼴을 아직 부르기 전이라 'loaded' 로 읽히고, 그 뒤에 불러 와 바뀐다(CI 실측: 150ms 에 loading).
   */
  const fontsDone = () => !document.fonts || document.fonts.status === 'loaded'
  let quiet = 0
  /** 다시 맞추고, 잠잠한지 600ms 뒤에 본다 */
  const settle = () => {
    if (ended) return
    if (keyOf() !== key) { cancel(); return }   // 그사이 다른 화면으로 갔다
    window.scrollTo(0, y)
    window.clearTimeout(quiet)
    quiet = window.setTimeout(() => {
      if (fontsDone() && Math.abs(window.scrollY - y) <= 1) stop()
    }, 600)
  }
  const grow = new ResizeObserver(settle)
  const timer = window.setTimeout(() => stop(), 6000)
  function cancel() {
    if (ended) return
    ended = true
    grow.disconnect()
    window.clearTimeout(timer)
    window.clearTimeout(quiet)
    for (const ev of GIVE_UP) window.removeEventListener(ev, stop)
    document.fonts?.removeEventListener('loadingdone', settle)
    if (active === cancel) active = null
  }
  function stop() {
    if (ended) return
    cancel()
    if (key && keyOf() === key) remember(key, window.scrollY)
  }
  active = cancel
  grow.observe(document.body)
  for (const ev of GIVE_UP) window.addEventListener(ev, stop, { passive: true })
  // 글꼴이 바뀌면 글줄이 달라져 위쪽 높이가 변한다 — 그때마다 다시 맞춘다
  document.fonts?.addEventListener('loadingdone', settle)
  settle()
  return cancel
}

/**
 * 기록 칸마다 작은 값 하나를 기억한다 — 보드의 지역 · 유형 · 검색어.
 * 자리만 되살리고 필터는 기본값(서울 · 전체)으로 돌아가면, 회원은 필터를 바꿔 보던
 * 목록이 아니라 엉뚱한 목록의 한가운데에 선다 — 필터 탭은 화면 밖이라 바뀐 줄도 모른다.
 */
export function readEntry(name: string): unknown {
  const key = keyOf()
  if (!key) return undefined
  try { return JSON.parse(sessionStorage.getItem(`site-entry:${key}:${name}`) ?? 'null') ?? undefined } catch { return undefined }
}

export function writeEntry(name: string, value: unknown) {
  tagEntry()
  const key = keyOf()
  if (!key) return
  try { sessionStorage.setItem(`site-entry:${key}:${name}`, JSON.stringify(value)) } catch { /* 못 적으면 기억 없이 간다 */ }
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
      if (active || (pending && performance.now() - pending.at < 1000)) return
      const key = keyOf()
      if (key) remember(key, window.scrollY)
    })
  }
  const onPop = () => {
    active?.()
    const key = keyOf()
    pending = key ? { key, y: positions.get(key), at: performance.now() } : null
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('popstate', onPop)
  window.addEventListener('hashchange', tagEntry)
  // 떠나는 순간의 자리까지 적고 옮겨 둔다 — 새로 고침 · 다른 페이지에 다녀오기
  const onHide = () => {
    const key = keyOf()
    if (key && !active) positions.set(key, Math.round(window.scrollY))
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
