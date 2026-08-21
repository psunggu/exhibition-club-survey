import { useEffect, useState } from 'react'
import { useRoute } from './lib/router'
import { Board } from './Board'
import { Calendar } from './Calendar'
import { Survey } from './Survey'
import { SurveyAdmin } from './SurveyAdmin'
import { MONTHS } from './data/meetups'
import {
  CATEGORY, fetchResponseCount, fetchSurveys, isOpen, koDeadline,
  type SurveyCategory,
} from './lib/survey'

/** `8 · 9월` — 달력이 펼치는 달을 옛 제목과 같은 모양으로 잇는다. */
const monthsLabel = () =>
  MONTHS.length ? `${MONTHS.map((m) => m.month).join(' · ')}월` : ''

/**
 * 달력 화면의 설문 카드 — **지금 무엇이 열려 있는지 한 줄로 보여 준다.**
 *
 * 예전에는 갈래 이름 둘만 있어서, 눌러 보기 전에는 지금 참여할 것이 있는지 알 수 없었다.
 * 회원이 달력을 보러 왔다가 「아, 지금 고를 게 있구나」 를 알아야 참여가 는다.
 *
 * ── 못 읽어도 화면이 죽지 않는다 ───────────────────────────
 * 설문을 못 불러와도 갈래 이름과 링크는 그대로 남는다.
 * 달력을 보러 온 사람이 설문 때문에 빈 화면을 보면 안 된다.
 */
function SurveyJump() {
  const [rows, setRows] = useState<{
    category: SurveyCategory; open: boolean; closesAt: string; people: number
  }[] | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    fetchSurveys(ac.signal)
      .then(async (all) => {
        const seen = new Map<SurveyCategory, typeof all[number]>()
        // 갈래마다 **가장 늦게 닫히는 것** 하나만 보여 준다. 지금 참여할 것이 그것이다.
        for (const s of all) {
          const cur = seen.get(s.category)
          if (!cur || s.closesAt > cur.closesAt) seen.set(s.category, s)
        }
        const list = await Promise.all([...seen.values()].map(async (s) => ({
          category: s.category,
          open: isOpen(s),
          closesAt: s.closesAt,
          people: Number(await fetchResponseCount(s.id, ac.signal)) || 0,
        })))
        setRows(list)
      })
      .catch(() => setRows([]))       // 못 읽으면 이름만 보여 준다
    return () => ac.abort()
  }, [])

  const stateOf = (c: SurveyCategory) => {
    const r = rows?.find((x) => x.category === c)
    if (!r) return null
    const who = r.people > 0 ? ` · ${r.people}명 참여` : ''
    return r.open
      ? { on: true, text: `${koDeadline(r.closesAt)}까지${who}` }
      : { on: false, text: `마감${who}` }
  }

  const openCount = (rows ?? []).filter((r) => r.open).length

  return (
    <section className="survey-jump" aria-labelledby="surveyJumpTitle">
      <p className="board-jump-kicker">모임 정하기</p>
      <h2 id="surveyJumpTitle">설문 참여하기</h2>
      <p>
        {rows === null
          ? '함께 볼 전시와 모임 뒤 식사를 회원들이 골라서 정합니다.'
          : openCount > 0
            ? `지금 참여할 수 있는 설문이 ${openCount}개 있습니다. 명부에 있는 분만 응답할 수 있습니다.`
            : '지금 진행 중인 설문은 없습니다. 지난 결과는 눌러서 보실 수 있습니다.'}
      </p>

      <ul className="survey-jump-list">
        {(['exhibition', 'meal'] as const).map((c) => {
          const st = stateOf(c)
          return (
            <li key={c}>
              <a className={`survey-tab ${c} on`} href={CATEGORY[c].route}>
                {CATEGORY[c].short}
              </a>
              {st && (
                <span className={`survey-jump-state${st.on ? ' on' : ''}`}>
                  {/* 색만으로 가르지 않는다 — 열린 것에는 「진행 중」 이라 적는다.
                      배지 뒤에 빈칸을 둔다. 여백은 눈에만 보이고,
                      화면을 읽어 주는 쪽에는 「진행 중8월」 로 붙어서 나갔다. */}
                  {st.on && <><b>진행 중</b>{' '}</>}
                  {st.text}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

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
  const onSurvey = route.name === 'survey' || route.name === 'surveyMeal'
    || route.name === 'surveyAdmin'
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  /**
   * 옛 CSS 두 장이 각자 `body` · `h1` · `:root` 를 정의한다.
   * 한 문서에 같이 넣으면 뒤가 이기므로, 어느 쪽을 적용할지 body 클래스로 가른다.
   * (scripts/scope-legacy-css.mjs 가 그 클래스 아래로 범위를 옮겨 뒀다.)
   *
   * 설문은 일정과 같은 좁은 감싸개를 쓴다 — 폼이라 넓으면 읽기 나쁘다.
   */
  useEffect(() => {
    const cls = onCalendar || onSurvey ? 'calendar-page' : 'board-page'
    document.body.classList.add(cls)
    return () => document.body.classList.remove(cls)
  }, [onCalendar, onSurvey])

  if (onSurvey) {
    const admin = route.name === 'surveyAdmin'
    const category: SurveyCategory = route.name === 'surveyMeal' ? 'meal' : 'exhibition'
    return (
      <main className="wrap">
        <p className="ov">41교구 전시·박물관 동아리</p>
        <h1>{admin ? '설문 관리' : CATEGORY[category].label}</h1>

        {/* 갈래를 오갈 수 있게 둘 다 보인다. 지금 보는 쪽이 진하다. */}
        {!admin && (
          <nav className="survey-tabs" aria-label="설문 갈래">
            {(['exhibition', 'meal'] as const).map((c) => (
              <a key={c} href={CATEGORY[c].route}
                className={`survey-tab ${c}${c === category ? ' on' : ''}`}
                aria-current={c === category ? 'page' : undefined}>
                {CATEGORY[c].label}
              </a>
            ))}
          </nav>
        )}

        <a className="board-jump-link" href={admin ? '#/survey' : '#/calendar'}
          style={{ marginBottom: 18 }}>
          {admin ? '설문 화면으로' : '모임 일정 보기'} <span aria-hidden="true">→</span>
        </a>
        {admin ? <SurveyAdmin /> : <Survey category={category} />}
        {/* 운영자 자리는 눈에 띄게 두지 않는다. 주소를 아는 사람이 들어오고,
            들어와도 암호가 없으면 아무것도 못 한다 — 진짜 자물쇠는 DB 함수 안에 있다. */}
        {!admin && (
          <p className="admin-hint" style={{ marginTop: 22, textAlign: 'right' }}>
            <a className="admin-entry" href="#/survey/admin">운영자</a>
          </p>
        )}
      </main>
    )
  }

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
        {/* 옛 제목은 `8 · 9월 모임 일정 안내` 였다. 손으로 적힌 달이라 10월이 되면
            틀린 제목이 된다. 달력이 펼치는 달에서 뽑으면 문구는 그대로면서 낡지 않는다. */}
        <h1>{monthsLabel()} 모임 일정 안내</h1>
        <SurveyJump />
        {/* 보드로 가는 길은 Calendar 안의 `.board-jump` 카드가 맡는다 (옛 화면과 같은 자리). */}
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
        <div className="topbar-links">
          <a className="topbar-notice-link" href="#/survey">
            설문 참여하기 <span aria-hidden="true">→</span>
          </a>
          <a className="topbar-notice-link" href="#/calendar">
            모임 일정 보기 <span aria-hidden="true">→</span>
          </a>
        </div>
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
