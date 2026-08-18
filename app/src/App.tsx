import { useRoute } from './lib/router'
import { Board } from './Board'
import { Calendar } from './Calendar'

/**
 * 뼈대만 있는 상태다. 화면 이식은 R-01-04(콘텐츠 보드) · R-01-05(달력)에서 한다.
 * 지금 라이브 사이트는 여전히 app/public 이 나가고 있고, 배포 경로는
 * 이식이 끝난 뒤에 바꾼다 — 이 단계에서 이용자에게 보이는 것은 달라지지 않는다.
 */
export function App() {
  const route = useRoute()

  return (
    <main className="shell">
      <header className="mast">
        <p className="eyebrow">100주년 기념교회 41교구 전시 · 박물관 동아리</p>
        <h1>문화 콘텐츠 공유 보드</h1>
      </header>

      <nav className="nav" aria-label="주요 화면">
        <a href="#/" aria-current={route.name === 'board' ? 'page' : undefined}>보드</a>
        <a href="#/calendar" aria-current={route.name === 'calendar' ? 'page' : undefined}>일정</a>
      </nav>

      <section className="panel">
        {route.name === 'board' && <Board />}
        {route.name === 'calendar' && <Calendar />}
        {route.name === 'notFound' && (
          <p>
            그런 화면은 없다. <a href="#/">보드로 돌아가기</a>
          </p>
        )}
      </section>

      <footer className="foot">
        <p className="tiny">Phase 01 뼈대 · 화면은 아직 이식 전이다</p>
      </footer>
    </main>
  )
}
