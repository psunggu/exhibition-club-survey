import { useEffect, useState } from 'react'
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
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  /**
   * 옛 CSS 두 장이 각자 `body` · `h1` · `:root` 를 정의한다.
   * 한 문서에 같이 넣으면 뒤가 이기므로, 어느 쪽을 적용할지 body 클래스로 가른다.
   * (scripts/scope-legacy-css.mjs 가 그 클래스 아래로 범위를 옮겨 뒀다.)
   */
  useEffect(() => {
    const cls = onCalendar ? 'calendar-page' : 'board-page'
    document.body.classList.add(cls)
    return () => document.body.classList.remove(cls)
  }, [onCalendar])

  /**
   * 감싸개가 화면마다 다르다 — 옛 사이트가 그랬다.
   *   보드   `.app-shell`  1440px · flex
   *   일정   `.wrap`       560px  · block
   * 하나로 묶었더니 일정 화면의 폭과 흐름이 보드 것을 따라가 어긋났다.
   */
  if (onCalendar) {
    return (
      <main className="wrap">
        <p className="ov">41교구 전시·박물관 동아리</p>
        <h1>모임 일정 안내</h1>
        <a className="topbar-notice-link" href="#/">
          콘텐츠 보드 보기 <span aria-hidden="true">→</span>
        </a>
        <Calendar />
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">100주년 기념교회 41교구 전시·박물관 동아리</p>
          <h1>문화 콘텐츠 공유 보드</h1>
          <div className="board-meta-line">
            {/* 옛 화면에 있던 "최종 업데이트" 줄. 그때는 손으로 적었고,
                이제 DB 의 가장 최근 확인일에서 뽑는다 — 낡을 수 없다. */}
            {updatedAt && <p className="board-updated">최종 업데이트: {updatedAt}</p>}
            <span className="update-schedule">· 매주 수요일·토요일 22시 업데이트</span>
          </div>
        </div>
        <a className="topbar-notice-link" href="#/calendar">
          모임 일정 보기 <span aria-hidden="true">→</span>
        </a>
      </header>

      {route.name === 'board' && <Board onUpdatedAt={setUpdatedAt} />}
      {route.name === 'notFound' && (
        <div className="empty-state">
          그런 화면은 없습니다. <a href="#/">보드로 돌아가기</a>
        </div>
      )}
    </main>
  )
}
