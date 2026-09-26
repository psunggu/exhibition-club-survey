import { useLayoutEffect, useRef, type MouseEvent } from 'react'
import { parseHash, SECTION_OF, type Route, type SiteSection } from './lib/router'

/**
 * 사이트 띠 — 모든 화면 맨 위의 「모임 일정 · 관람 정보 · 투표」.
 *
 * 예전에는 화면마다 다른 곳으로 가는 길이 제각각이었다. 보드는 우상단 링크 둘,
 * 일정은 보드 카드 하나, 투표는 「모임 일정 보기」 하나. 그래서 일정에서 투표로,
 * 투표에서 보드로 가는 길이 없었다(2026-09-26 운영자 요청으로 이 띠를 둔다).
 *
 * **순서와 문구는 운영자가 정했다.** 바꾸지 않는다. 주소는 그대로라 톡방에
 * 뿌려진 옛 링크도 그대로 열린다.
 *
 * ── 지금 칸 ────────────────────────────────────────────────
 * 종이색으로 칠하고 아랫변을 열어 페이지와 이어 붙인다(색인 탭).
 * 투표 쪽은 `aria-current="true"` 다 — 투표 화면의 갈래 알약이 이미 `page` 라서
 * 둘 다 `page` 면 스크린리더가 「현재 페이지」 를 두 번 말한다.
 * 운영자 · 없는 주소 화면에서는 어느 칸도 켜지 않는다.
 *
 * ── 띠 안에 두지 않는 것 ───────────────────────────────────
 * h1(검사기가 문서의 첫 h1 을 읽는다), 건수 · 배지 같은 살아 있는 값(화면 대조의
 * 글자 수가 흔들린다), 페이지 안 앵커 `href="#id"`(라우터가 「그런 화면은 없습니다」 로 보낸다).
 */
const SECTIONS: { key: SiteSection; label: string; href: string }[] = [
  { key: 'calendar', label: '모임 일정', href: '#/calendar' },
  { key: 'board', label: '관람 정보', href: '#/' },
  { key: 'survey', label: '투표', href: '#/survey' },
]

export function SiteNav({ route }: { route: Route }) {
  const here = SECTION_OF[route.name]
  const nav = useRef<HTMLElement>(null)

  /**
   * 띠의 실제 높이를 `--site-nav-h` 로 알린다 — 본문의 초점 여백(app.css scroll-margin)이 쓴다.
   * 글씨를 키우면 띠가 52 → 96px 로 자라므로 한 값으로 박아 둘 수 없다.
   * CSSOM 으로 적는다(CSP 는 style 속성 문자열만 막는다).
   */
  useLayoutEffect(() => {
    const el = nav.current
    if (!el) return undefined
    const root = document.documentElement
    const put = () => root.style.setProperty('--site-nav-h', `${Math.ceil(el.getBoundingClientRect().height)}px`)
    put()
    const grow = new ResizeObserver(put)
    grow.observe(el)
    return () => {
      grow.disconnect()
      root.style.removeProperty('--site-nav-h')
    }
  }, [])

  /**
   * 지금 칸을 다시 누르면 맨 위로 간다. 긴 보드 아래쪽에서 「관람 정보」 를
   * 다시 누르는 사람은 처음으로 돌아가고 싶은 것이다.
   * 같은 화면이면 주소가 안 바뀌어 아무 일도 안 일어나므로 이동을 막고 직접 올린다.
   * 부드럽게 미끄러지지 않고 곧장 간다 — 1만 px 넘는 보드를 미끄러져 오르면 어지럽다.
   */
  const onClick = (e: MouseEvent<HTMLAnchorElement>, key: SiteSection, href: string) => {
    if (key !== here) return
    if (parseHash(window.location.hash).name === parseHash(href).name) e.preventDefault()
    window.scrollTo(0, 0)
  }

  return (
    <nav className="site-nav" aria-label="사이트 메뉴" ref={nav}>
      <ul className="site-nav-list">
        {SECTIONS.map((s) => {
          const current = s.key !== here ? undefined : s.key === 'survey' ? 'true' : 'page'
          return (
            <li key={s.key}>
              <a className="site-nav-tab" href={s.href} aria-current={current}
                onClick={(e) => onClick(e, s.key, s.href)}>
                {s.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
