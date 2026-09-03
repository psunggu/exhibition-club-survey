import { useEffect, useState } from 'react'
import { useRoute } from './lib/router'
import { seoulToday } from './lib/calendar'
import { Board } from './Board'
import { Calendar } from './Calendar'
import { Survey } from './Survey'
import { SurveyAdmin } from './SurveyAdmin'
import { monthsToShow } from './data/meetups'
import {
  CATEGORY, CATEGORY_ORDER, fetchResponseCount, fetchSurveys, isOpen,
  type Survey as SurveyT, type SurveyCategory, type TabCategory,
} from './lib/survey'
import { isPastSurvey } from './lib/surveyHistory'

/**
 * `9 · 10월` — 달력이 펼치는 달을 옛 제목과 같은 모양으로 잇는다.
 *
 * 달 목록은 `monthsToShow` 가 오늘에서 뽑으므로 제목도 저절로 따라온다.
 * 예전에는 `MONTHS` 를 손으로 밀 때까지 제목이 지난 달에 멈춰 있었다(#111).
 */
const monthsLabel = (today: string) => {
  const months = monthsToShow(today)
  return months.length ? `${months.map((m) => m.month).join(' · ')}월` : ''
}

/**
 * 보드·일정·설문 등 공개 정보를 마지막으로 반영한 날짜.
 * 개별 전시의 확인일은 각 카드의 `정보 기준일`에 따로 남긴다.
 */
const SITE_INFO_UPDATED_ON = '2026.08.27'

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
/** 회원이 여기서 실제로 고를 수 있는 설문인가 — 톡방 투표는 아니다. */
const canAnswer = (s: SurveyT) => isOpen(s) && !s.mirrored

/** 참여할 수 있는 것을 먼저, 그다음 마감이 늦은 순. */
const betterPick = (a: SurveyT, b: SurveyT) =>
  (canAnswer(a) !== canAnswer(b) ? canAnswer(a) : a.closesAt > b.closesAt)

function SurveyJump() {
  const [rows, setRows] = useState<{
    category: SurveyCategory; open: boolean; mirrored: boolean;
    closesAt: string; people: number
  }[] | null>(null)
  /** 못 읽은 것과 「없다」 는 다르다. 섞으면 화면이 거짓말을 한다. */
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const ac = new AbortController()
    fetchSurveys(ac.signal)
      .then(async (all) => {
        const seen = new Map<SurveyCategory, typeof all[number]>()
        for (const s of all) {
          /**
           * **모임까지 끝난 설문은 여기 안 뜬다.**
           * 그건 지난 일이고 설문 화면의 「지난 설문」 으로 내려가 있다.
           * 여기 남겨 두면 「마감 · 13명」 이 지금 뭔가 하는 자리인 것처럼 읽힌다.
           */
          if (isPastSurvey(s)) continue
          const cur = seen.get(s.category)
          /**
           * 갈래마다 하나만 보여 주므로 **무엇을 대표로 세우는지가 중요하다.**
           * 예전에는 마감이 가장 늦은 것을 골랐는데, 톡방에서 도는 투표(mirrored)가
           * 마감이 더 늦으면 그것이 대표 자리를 빼앗아 **정작 회원이 응답할 수 있는
           * 설문을 가린다.** 여기 참여할 수 있는 것을 먼저 세우고, 그런 것이 없을 때만
           * 마감이 늦은 순으로 고른다.
           */
          if (!cur || betterPick(s, cur)) seen.set(s.category, s)
        }
        const list = await Promise.all([...seen.values()].map(async (s) => ({
          category: s.category,
          open: isOpen(s),
          mirrored: s.mirrored,
          closesAt: s.closesAt,
          people: Number(await fetchResponseCount(s.id, ac.signal)) || 0,
        })))
        setRows(list)
      })
      .catch(() => { setFailed(true); setRows([]) })   // 못 읽으면 이름만 보여 준다
    return () => ac.abort()
  }, [])

  /**
   * 현황은 **한 줄에 들어가게 짧게** 적는다.
   * `8월 28일 (금) 오후 9시까지 · 1명 참여` 로 길게 썼더니 좁은 화면에서 두 줄로 접혔고,
   * 그러면 카드 높이가 상태에 따라 달라져 화면 대조 검사가 흔들렸다.
   * 자세한 마감 시각은 설문 화면에 그대로 적혀 있다.
   */
  const stateOf = (c: TabCategory): { badge: string | null; text: string; on: boolean } | null => {
    if (!rows || failed) return null      // 아직 못 불러왔거나 못 읽었다 — 아무 말도 안 한다
    const r = rows.find((x) => x.category === c)
    // 이 갈래에 지금 참여할 것이 없다. 「마감」 과 다르다 — 마감은 있었는데 닫힌 것이다.
    if (!r) return { badge: '없음', text: '', on: true }
    const who = r.people > 0 ? ` · ${r.people}명` : ''
    if (!r.open) return { badge: null, text: `마감${who}`, on: false }
    const d = new Date(r.closesAt)
    const p = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', weekday: 'short',
    }).formatToParts(d)
    const g = (t: string) => p.find((x) => x.type === t)?.value ?? ''
    // 톡방에서 도는 투표는 **여기서 못 고른다.** 「진행 중」 이라고만 하면
    // 참여하러 눌러 들어갔다가 설문 화면에서야 「고르실 수 없습니다」 를 만난다.
    const badge = r.mirrored ? '톡방 투표' : '진행 중'
    return { badge, text: `${g('month')}/${g('day')}(${g('weekday')})까지${who}`, on: true }
  }

  /**
   * 줄로 세울 갈래 — **지금 무언가 있는 것만.**
   *
   * 갈래가 다섯이 되자 「없음」 줄이 넷까지 생겼고, 그만큼 달력이 아래로 밀렸다
   * (카드가 243px → 392px). 「없음」 은 읽는 사람에게 아무것도 알려 주지 않는다.
   * 없는 갈래는 감추고, 대신 아래 링크로 다섯 갈래 전부에 닿게 한다.
   *
   * 아직 못 불러왔거나 못 읽었을 때도 비어 있다. 그편이 낫다 —
   * 이름 다섯을 먼저 그렸다가 하나로 줄어들면 카드가 눈앞에서 접힌다.
   * 비었다가 늘어나는 쪽이 덜 튄다.
   */
  const active = rows ? CATEGORY_ORDER.filter((c) => rows.some((r) => r.category === c)) : []

  return (
    <section className="survey-jump" aria-labelledby="surveyJumpTitle">
      <p className="board-jump-kicker">모임 정하기</p>
      <h2 id="surveyJumpTitle">설문 참여하기</h2>
      {/* 안내문은 **상태에 따라 바뀌지 않는다.** 바꿨더니 줄 수가 달라져
          카드 높이가 흔들렸고, 화면 대조 검사가 그걸 디자인 변화로 읽었다.
          지금 무엇이 열려 있는지는 아래 줄들이 말한다. */}
      <p>관람할 곳과 날짜, 모임 뒤 식사까지 회원들이 골라서 정합니다. 명부에 있는 분만 응답할 수 있습니다.</p>

      <ul className="survey-jump-list">
        {active.map((c) => {
          const st = stateOf(c)
          return (
            <li key={c}>
              <a className={`survey-tab ${c} on`} href={CATEGORY[c].route}>
                {CATEGORY[c].short}
              </a>
              {st && (
                <span className={`survey-jump-state${st.on ? ' on' : ''}`}>
                  {/* 색만으로 가르지 않는다 — 배지 안에 「진행 중」·「없음」 이라 적는다.
                      배지 뒤에 빈칸을 둔다. 여백은 눈에만 보이고,
                      화면을 읽어 주는 쪽에는 「진행 중8월」 로 붙어서 나갔다. */}
                  {st.badge && <><b>{st.badge}</b>{st.text ? ' ' : ''}</>}
                  {st.text}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {/* 불러왔는데 하나도 없을 때만 적는다. 못 불러온 것과 「없다」 는 다르므로
          아직 읽는 중이거나 실패했을 때는 아무 말도 하지 않는다. */}
      {rows && !failed && active.length === 0 && (
        <p className="survey-jump-empty">지금 참여할 수 있는 설문이 없습니다.</p>
      )}

      {/* 감춘 갈래로 가는 길. **늘 보인다** — 줄이 하나도 없을 때도 여기로 들어간다. */}
      <a className="survey-jump-more" href="#/survey">
        설문 갈래 모두 보기 <span aria-hidden="true">→</span>
      </a>
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
  const onSurvey = route.name === 'survey' || route.name === 'surveyDatetime'
    || route.name === 'surveyMeal' || route.name === 'surveyClub'
    || route.name === 'surveyGoogle'
    || route.name === 'surveyEtc' || route.name === 'surveyAdmin'

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
    /** 라우트 이름 → 갈래. 어느 쪽도 아니면 첫 갈래(관람 장소)로 본다. */
    const BY_ROUTE: Partial<Record<typeof route.name, TabCategory>> = {
      surveyDatetime: 'datetime', surveyMeal: 'meal',
      surveyClub: 'club', surveyGoogle: 'google', surveyEtc: 'etc',
    }
    const category: TabCategory = BY_ROUTE[route.name] ?? 'exhibition'
    return (
      <main className="wrap">
        <p className="ov">41교구 전시·박물관 동아리</p>
        <h1>{admin ? '설문 관리' : CATEGORY[category].label}</h1>

        {/* 갈래 다섯을 모두 보여 주고 지금 보는 쪽을 진하게 둔다.
            탭에는 **짧은 이름**을 쓴다 — 긴 이름 다섯은 375px 에 안 들어간다.
            전체 이름은 바로 위 제목이 맡는다. */}
        {!admin && (
          <nav className="survey-tabs" aria-label="설문 갈래">
            {CATEGORY_ORDER.map((c) => (
              <a key={c} href={CATEGORY[c].route}
                className={`survey-tab ${c}${c === category ? ' on' : ''}`}
                aria-current={c === category ? 'page' : undefined}>
                {CATEGORY[c].short}
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
        <h1>{monthsLabel(seoulToday())} 모임 일정 안내</h1>
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
            <p className="board-updated">최종 정보 업데이트: {SITE_INFO_UPDATED_ON}</p>
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

      {route.name === 'board' && <Board />}
      {route.name === 'notFound' && (
        <div className="empty-state">
          그런 화면은 없습니다. <a href="#/">보드로 돌아가기</a>
        </div>
      )}
    </main>
  )
}
