import { useRoute } from './lib/router'
import { Board } from './Board'
import { Calendar } from './Calendar'

/**
 * 셸도 옛 화면 그대로다 — `.app-shell` · `.topbar` · `.eyebrow`.
 *
 * 옛 사이트는 보드와 일정이 **두 장의 페이지**였고 우상단 링크로 오갔다.
 * 지금은 한 앱 안의 두 화면이지만, 그 링크의 자리와 문구를 유지한다.
 * 회원이 누르던 자리가 그대로여야 이질감이 없다.
 */
export function App() {
  const route = useRoute()
  const onCalendar = route.name === 'calendar'

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">100주년 기념교회 41교구 전시·박물관 동아리</p>
          <h1>{onCalendar ? '모임 일정 안내' : '문화 콘텐츠 공유 보드'}</h1>
          <div className="board-meta-line">
            <span className="update-schedule">매주 수요일·토요일 22시 업데이트</span>
          </div>
        </div>
        <a className="topbar-notice-link" href={onCalendar ? '#/' : '#/calendar'}>
          {onCalendar ? '콘텐츠 보드 보기' : '모임 일정 보기'} <span aria-hidden="true">→</span>
        </a>
      </header>

      {route.name === 'board' && <Board />}
      {onCalendar && <Calendar />}
      {route.name === 'notFound' && (
        <div className="empty-state">
          그런 화면은 없습니다. <a href="#/">보드로 돌아가기</a>
        </div>
      )}
    </main>
  )
}
