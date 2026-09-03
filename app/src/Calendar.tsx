import { useEffect, useMemo, useRef, useState } from 'react'
import { monthGrid, seoulToday, WEEKDAYS } from './lib/calendar'
import { fetchDigest, SEVERITY_ICON, type Digest } from './lib/digest'
import {
  MEETUPS, monthsToShow, pastMonthsToShow, TENTATIVE, type Meetup,
} from './data/meetups'

/**
 * 옛 notice.html 의 마크업을 그대로 쓴다 — `.digest` · `.sec` · `.card` · `.cal` ·
 * `.legend` · `.completed-list` · `.calendar-fold`.
 * 스타일은 `styles/legacy-notice.css`(옛 notice.css 를 범위만 가른 것)가 낸다.
 *
 * 달라진 것은 달력 격자를 손으로 쓰지 않고 날짜에서 만든다는 것뿐이다.
 */

const KO_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

/**
 * 범례는 **색 점 둘**뿐이다. 달력이 색으로 가르는 것은 성격 하나이기 때문이다 —
 * 정기냐 수시냐. 상태(확정·미정·완료)는 색이 아니라 **채움**이 말한다.
 *
 * 옛 범례는 여섯 가지였다. 갈래(영화 모임)와 성격(공식 정기관람)과 상태(완료·확정·
 * 미정·마감)가 한 줄에 섞여 있어서, 칩 하나를 보고 어느 축을 읽어야 하는지 알 수 없었다.
 */
const LEGEND: { cls: string; label: string }[] = [
  { cls: 'regular', label: '정기' },
  { cls: 'casual', label: '수시' },
]

/** 색을 못 보는 사람에게는 이 네 줄이 범례의 전부다. 색 점과 함께 늘 붙어 다닌다. */
const LEGEND_NOTE = ['채움 = 확정', '점선 = 미정', '회색 = 완료', '붉은색 = 예매 마감']

/** 달력 아래 목록의 상태 칩 글자. 달력 칩은 좁아 글자가 몇 자 안 들어가므로 여기서 읽는다. */
const STATUS_LABEL: Record<string, string> = {
  conf: '확정', tent: '미정', done: '완료', dead: '예매 마감',
}

function DayBlock({ date }: { date: string }) {
  const m = Number(date.slice(5, 7))
  const d = Number(date.slice(8, 10))
  const w = KO_WEEK[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? ''
  return (
    <div className="db">
      <div className="m">{m}월</div>
      <div className="d">{d}</div>
      <div className="w">{w}</div>
    </div>
  )
}

/**
 * 칩의 두 축. 성격은 `regular|casual` 이 색을 정하고, 상태는 `kind` 가 채움을 정한다.
 * 갈래(전시·박물관·영화…)는 여기 들어오지 않는다 — 색을 갖지 않기 때문이다.
 */
function chipClass(m: Meetup) {
  return ['chip', m.kind, m.regular ? 'regular' : 'casual', 'event-trigger'].join(' ')
}

export function Calendar() {
  const today = useMemo(() => seoulToday(), [])
  const [digest, setDigest] = useState<Digest | null>(null)
  const [digestError, setDigestError] = useState(false)
  const [open, setOpen] = useState<Meetup | null>(null)
  /** 완료된 모임에서 보고 있는 해. null 이면 가장 최근 해를 본다. */
  const [pickedYear, setPickedYear] = useState<number | null>(null)
  const lastTrigger = useRef<HTMLElement | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ac = new AbortController()
    fetchDigest(ac.signal)
      .then(setDigest)
      .catch(() => { if (!ac.signal.aborted) setDigestError(true) })
    return () => ac.abort()
  }, [])

  /**
   * 옛 화면은 네이티브 <dialog>.showModal() 이라 초점 가둠 · Esc · 초점 복귀가
   * 공짜였다. <div> 로 옮기면서 그게 전부 사라졌다 — 되살린다.
   */
  useEffect(() => {
    if (!open) return
    const node = dialogRef.current
    node?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(null); return }
      if (e.key !== 'Tab' || !node) return
      const f = node.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      if (!f.length) return
      const first = f[0]!
      const last = f[f.length - 1]!
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      lastTrigger.current?.focus()
    }
  }, [open])

  const byDate = useMemo(() => {
    const m = new Map<string, Meetup[]>()
    for (const x of MEETUPS) m.set(x.date, [...(m.get(x.date) ?? []), x])
    return m
  }, [])

  const upcoming = MEETUPS.filter((m) => m.kind === 'conf' && m.date >= today)
  const done = MEETUPS.filter((m) => m.completedRow).sort((a, b) => b.date.localeCompare(a.date))

  /**
   * 완료된 모임을 **해 → 달**로 묶는다.
   *
   * ── 왜 자료에서 뽑나 ──────────────────────────────────────
   * 해와 달을 손으로 적어 두면 해가 바뀔 때마다 사람이 고쳐야 하고, 고치는 것을
   * 잊으면 지난 모임이 조용히 사라진다. 날짜에서 뽑으면 2027년 1월에 첫 모임이
   * 끝나는 순간 「2027년」 탭이 저절로 서고 2026년은 그 옆으로 물러난다 —
   * 달력 격자를 날짜에서 만드는 것(lib/calendar.ts)과 같은 이유다.
   *
   * ── 3일 규칙은 여기서 걷어냈다 ───────────────────────────
   * 옛 화면은 최근 3일 안에 끝난 것만 보이고 나머지는 「이전 완료 모임 보기」
   * 뒤에 숨겼다(notice.js 의 setupCompletedMeetings). 그 절은 이제 **지난 기록을
   * 찾아보는 자리**이므로, 숨기는 것이 목적과 어긋난다.
   * 가장 최근 달이 펼쳐진 채로 열리므로 방금 끝난 모임은 그대로 먼저 보인다.
   *
   * `isRecentlyCompleted` 는 lib 에 그대로 둔다 — scripts/validate-board-parity.mjs
   * 가 옛 notice.js 와 이 함수를 나란히 돌려 대조한다. 화면이 안 쓴다고 지우면
   * 그 대조가 통째로 없어진다.
   */
  const byYear = useMemo(() => {
    const years = new Map<number, Map<number, Meetup[]>>()
    for (const m of done) {
      const y = Number(m.date.slice(0, 4))
      const mo = Number(m.date.slice(5, 7))
      if (!Number.isFinite(y) || !Number.isFinite(mo)) continue
      const months = years.get(y) ?? new Map<number, Meetup[]>()
      months.set(mo, [...(months.get(mo) ?? []), m])
      years.set(y, months)
    }
    return [...years.entries()]
      .sort((a, b) => b[0] - a[0])                    // 최근 해가 앞
      .map(([year, months]) => ({
        year,
        count: [...months.values()].reduce((n, r) => n + r.length, 0),
        months: [...months.entries()]
          .sort((a, b) => b[0] - a[0])                // 최근 달이 위
          .map(([month, rows]) => ({ month, rows })),
      }))
  }, [done])

  /** 고른 해가 없거나 그 해가 사라졌으면 가장 최근 해를 본다. */
  const activeYear = byYear.find((y) => y.year === pickedYear)?.year ?? byYear[0]?.year ?? null
  const active = byYear.find((y) => y.year === activeYear) ?? null

  /**
   * 펼치는 달과 접어 두는 달은 **오늘에서 뽑는다** — 손으로 적던 목록을 대신한다.
   * `today` 는 위에서 `seoulToday()` 로 한 번 잡아 둔 값이고, 검사는 시계를 묶어
   * 같은 값을 넘긴다. 두 자리가 다른 「오늘」 을 보면 달력과 「오늘」 표시가 어긋난다.
   */
  const months = useMemo(() => monthsToShow(today), [today])
  const pastMonths = useMemo(() => pastMonthsToShow(today), [today])

  /** 고른 해의 지난 달력만. 해를 안 고른 상태(=최근 해)에서는 지금까지와 같다. */
  const pastCalendars = pastMonths.filter((p) => activeYear === null || p.year === activeYear)

  const openDialog = (m: Meetup, el: HTMLElement) => { lastTrigger.current = el; setOpen(m) }

  /**
   * 달력 칸은 좁아 칩에 글자가 몇 자 안 들어간다. **갈래는 여기서 읽는다.**
   * 칩이 「서도호 17:00」 이라고만 말할 때, 이 줄이 「정기 · 전시」 라고 붙여 준다.
   */
  const renderMonthList = (year: number, month: number) => {
    const ym = `${year}-${String(month).padStart(2, '0')}`
    const rows = MEETUPS.filter((m) => m.date.startsWith(ym))
      .sort((a, b) => a.date.localeCompare(b.date))
    if (rows.length === 0) return null
    return (
      <ul className="month-list" aria-label={`${year}년 ${month}월 모임 목록`}>
        {rows.map((m) => (
          <li key={m.id} className="mrow">
            <span className="mrow-when">
              {Number(m.date.slice(5, 7))}월 {Number(m.date.slice(8, 10))}일
              {' · '}
              {KO_WEEK[new Date(`${m.date}T00:00:00Z`).getUTCDay()] ?? ''}
            </span>
            <span className="mrow-kind">
              <span className={`mdot ${m.regular ? 'regular' : 'casual'}`} aria-hidden="true" />
              {m.regular ? '정기' : '수시'}{' · '}{m.venueKind}
            </span>
            <span className="mrow-title">{m.title || m.chip}</span>
            <span className={`mtag mtag-${m.kind}`}>{STATUS_LABEL[m.kind] ?? m.kind}</span>
          </li>
        ))}
      </ul>
    )
  }

  const renderCal = (year: number, month: number) => (
    <div className="cal" role="group" aria-label={`${year}년 ${month}월 달력`}>
      {WEEKDAYS.map((w, i) => (
        <div key={w} className={`wd${i === 0 ? ' wd-sun' : i === 6 ? ' wd-sat' : ''}`}>{w}</div>
      ))}
      {monthGrid(year, month).map((c, i) => {
        if (c.filler) return <div key={`f${i}`} className="cell off" />
        const list = byDate.get(c.date) ?? []
        const isToday = c.date === today
        return (
          <div key={c.date} className="cell">
            <span className={isToday ? 'dnum is-today' : 'dnum'}>{c.day}</span>
            {isToday && <span className="tlab">오늘</span>}
            {list.map((m) => (
              <button key={m.id} type="button" className={chipClass(m)}
                aria-haspopup="dialog"
                aria-label={`${Number(c.date.slice(5, 7))}월 ${c.day}일 ${m.chip} 상세 보기`}
                onClick={(ev) => openDialog(m, ev.currentTarget)}>
                {m.chip}
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      {/* 갱신 시각 배지(`.upd`)를 화면에서 뺐다 (2026-09-02, 운영자 요청).
          h1 바로 아래라 날짜가 가장 먼저 읽혔고, 정리봇 갱신이 며칠만 밀려도
          화면 전체가 낡은 것처럼 보였다.

          **지운 것이 아니라 감춘 것이다.** weekly-digest.public.json 의
          `updated_label` 은 그대로 있고 validate-weekly-digest 도 계속 검사한다.
          되살릴 때는 아래 한 줄을 그대로 쓴다 — updatedLabel 이 이미 `… 기준` 으로
          끝나므로 뒤에 또 붙이면 "기준 기준" 이 된다.

            {digest?.updatedLabel && <span className="upd">업데이트 {digest.updatedLabel}</span>}

          다만 낡아 보이는 원인은 이 줄이 아니라 데이터가 밀리는 것이다. 감춰 두면
          회원이 지난 마감을 지난 줄 모른다 — 갱신 주기를 대신 지켜야 한다. */}

      {/* 보드로 건너가는 안내 카드. 옛 화면에서는 이것이 두 페이지를 잇는 유일한 길이었다.
          이식본은 작은 링크 하나로 줄여 놓았었는데, 그러면 일정만 보러 온 회원이
          보드가 있다는 걸 알 방법이 없다. 옛 카드를 그대로 되살린다. */}
      <section className="board-jump" aria-labelledby="boardJumpTitle">
        <div>
          <p className="board-jump-kicker">전시·공연·영화 더 찾아보기</p>
          <h2 id="boardJumpTitle">문화 콘텐츠 공유 보드</h2>
          <p>서울·경기·인천의 최신 전시와 음악공연, 영화 정보를 한곳에서 확인하세요.</p>
        </div>
        {/* 옛 사이트는 별개 파일이라 `./` 였다. 한 앱이 된 지금은 해시 경로다. */}
        <a className="board-jump-link" href="#/">
          문화 콘텐츠 공유 보드 보러가기 <span aria-hidden="true">→</span>
        </a>
      </section>

      {/* 8월 운영 설문 결과를 회원에게 돌려주는 페이지.
          답한 사람이 자기 답이 무엇을 바꿨는지 모르면 다음 설문은 회수가 안 된다.
          `.board-jump` 를 그대로 입혀 위 카드와 형제로 보이게 둔다.
          이 문서는 SPA 밖의 정적 파일이라 해시가 아니라 파일 경로다 —
          vite.config.ts 의 copyLiveAssets 에 올라가 있어야 404 가 안 난다. */}
      <section className="board-jump result-jump" aria-labelledby="resultJumpTitle">
        <div>
          {/* 이 두 줄은 **건너간 페이지가 실제로 담은 것**만 말해야 한다.
              2026-08-30 까지는 「이렇게 반영했습니다 · 9월부터 무엇이 달라지는지」 였는데,
              그날 결과 페이지에서 앞일을 말하던 절 셋을 모두 가렸다 (#94 · #97).
              광고는 남고 물건이 없어진 꼴이라, 눌러 들어간 회원이 없는 것을 찾게 된다.
              결과 페이지 안에서 같은 종류를 세 번 고쳤는데 이 카드는 다른 화면이라 함께 안 잡혔다.
              가린 절을 되살릴 때 이 두 줄도 함께 되돌린다. */}
          <p className="board-jump-kicker">8월 운영 설문</p>
          <h2 id="resultJumpTitle">답해주신 내용을 정리했습니다</h2>
          <p>어떤 답이 얼마나 모였는지 숫자로 보여드립니다.</p>
        </div>
        <a className="board-jump-link" href="./survey-result.html">
          설문 결과 보기 <span aria-hidden="true">→</span>
        </a>
      </section>

      <details className="digest">
        <summary className="digest-head">
          <span className="digest-title-group">
            <span className="digest-eyebrow">운영진 확인용 · 공개 요약</span>
            <span className="digest-title" role="heading" aria-level={2}>주간 정리봇</span>
          </span>
          <span className="digest-summary-meta">
            {/* 기간만 넣는다. 갱신 시각은 위 `.upd` 가 맡는다 —
                둘을 한 알약에 넣었더니 알약이 넓어져 옆의 '주간 정리봇' 이
                글자당 한 줄씩 세로로 접혔다. 옛 화면도 여기는 기간만 뒀다. */}
            <span className="digest-period">
              {digestError ? '불러오지 못함' : digest ? digest.periodLabel : '불러오는 중'}
            </span>
            <span className="digest-toggle" aria-hidden="true">
              <span className="digest-toggle-open">펼치기</span>
              <span className="digest-toggle-close">접기</span>
              <span className="digest-chevron">⌄</span>
            </span>
          </span>
        </summary>
        <div className="digest-body">
          {digest && <p className="digest-intro">{digest.summary}</p>}
          <div className="digest-content" aria-live="polite">
            {digestError && <p className="digest-loading">요약을 불러오지 못했습니다.</p>}
            {!digest && !digestError && <p className="digest-loading">주간 정리 내용을 불러오는 중입니다.</p>}

            {digest && (
              <>
                <h3 className="digest-subtitle">중요 확인사항</h3>
                {digest.highlights.length === 0 ? (
                  <p className="digest-loading">현재 표시할 중요 확인사항이 없습니다.</p>
                ) : (
                  <div className="digest-highlights">
                    {digest.highlights.map((h, i) => (
                      <article key={i} className={`digest-item digest-item-${h.severity}`}>
                        <span className="digest-marker" aria-hidden="true">{SEVERITY_ICON[h.severity]}</span>
                        <div className="digest-item-body">
                          <span className="digest-status">{h.label}</span>
                          <h4>{h.title}</h4>
                          <p>{h.text}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {digest?.decisions.length ? (
              <>
                <h3 className="digest-subtitle">정해진 것</h3>
                <ul className="digest-decisions">{digest.decisions.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </>
            ) : null}
            {digest?.openQuestions.length ? (
              <>
                <h3 className="digest-subtitle">아직 정하지 않은 것</h3>
                <ul className="digest-open-questions">{digest.openQuestions.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </>
            ) : null}
          </div>
          <p className="digest-disclaimer">
            원문·실명·개인별 평가는 표시하지 않습니다.
            AI 자동 정리이므로 확정 전에는 톡방 공지와 대조해 주세요.
          </p>
        </div>
      </details>

      {upcoming.length > 0 && (
        <>
          <h2 className="sec"><span className="dot dot-conf" />다가오는 확정 모임</h2>
          {upcoming.map((m) => (
            <article key={m.id} className={m.regular ? 'card card-regular' : 'card'}>
              <DayBlock date={m.date} />
              <div>
                <span className={m.regular ? 'tag tag-regular' : 'tag'}>
                  {m.regular ? '공식 정기관람' : '확정'}
                </span>
                <h3>{m.title || m.chip}</h3>
                <p className="meta">
                  <b>{m.time || '시간 확인 중'}</b>
                  {m.venue ? ` · ${m.venue}` : ''}
                  {m.description ? <><br />{m.description}</> : null}
                </p>
                {m.note && <p className="card-alert"><b>운영진 확인:</b> {m.note}</p>}
              </div>
            </article>
          ))}
        </>
      )}

      {/**
        * **조율 중 · 미정** — 옛 화면에 있었는데 이식하면서 빠진 자리다.
        * 범례에는 `tent`(모집중 · 미정)가 남아 있는데 정작 그것을 보여 줄 목록이 없었다.
        *
        * AGENTS.md 가 정해 둔 규칙을 이 절이 실행한다 —
        * 날짜가 확정되지 않은 것은 여기에만 두고, 정해진 뒤에
        * 「다가오는 확정 모임」 과 달력에 함께 넣는다.
        *
        * **비어도 절을 없애지 않는다.** 옛 화면이 그랬다. 있다 없다 하면
        * 「조율 중인 것이 없는 것」 과 「그런 칸이 없는 것」 이 구분되지 않는다.
        */}
      <h2 className="sec"><span className="dot dot-tent" />조율 중 · 미정</h2>
      {TENTATIVE.length === 0 ? (
        <p className="trow">
          <span className="ttag t2">없음</span>
          <span>지금 조율 중인 일정이 없습니다.</span>
        </p>
      ) : TENTATIVE.map((t) => (
        <p className="trow" key={t.id}>
          <span className="ttag t1">{t.tag}</span>
          <span>
            {t.text}
            {t.surveyRoute && (
              <><br /><a href={t.surveyRoute}>투표 현황 보기 <span aria-hidden="true">→</span></a></>
            )}
          </span>
        </p>
      ))}

      <h2 className="sec"><span className="dot dot-dark" />한눈에 보는 달력</h2>
      <p className="legend">
        {LEGEND.map((l) => <span key={l.cls} className={`lchip ${l.cls}`}>{l.label}</span>)}
        <span className="legend-note">
          {LEGEND_NOTE.map((t) => <span key={t} className="lnote">{t}</span>)}
        </span>
      </p>
      {months.map(({ year, month }) => {
        // 빈 달을 말없이 비워 두면 "아직 안 만든 화면"으로 보인다.
        // 옛 화면은 9월에 이 문장을 박아 뒀다 — 여기서는 모임이 없을 때만 뜬다.
        const has = MEETUPS.some((m) => m.date.startsWith(`${year}-${String(month).padStart(2, '0')}`))
        return (
          <div key={`${year}-${month}`}>
            <h3 className="mon">{year}년 {month}월</h3>
            {!has && (
              <p className="month-empty">
                현재 확인된 {month}월 확정 일정이 없습니다. 새로운 공지가 나오면 달력에 반영합니다.
              </p>
            )}
            {renderCal(year, month)}
            {renderMonthList(year, month)}
          </div>
        )
      })}

      {active && (
        <>
          <h2 className="sec"><span className="dot dot-done" />완료된 모임</h2>

          {/**
            * 해가 하나뿐이면 탭을 그리지 않는다. 고를 것이 없는 탭 한 개는
            * 누를 수 있는 것처럼 보이면서 아무 일도 하지 않는다.
            *
            * `role="tab"` 을 쓰지 않는다 — 그것을 선언하면 화면을 읽어 주는 쪽이
            * 회원에게 화살표 키를 안내하는데, 눌러도 아무 일이 없으면 안내와 동작이
            * 어긋난다(보드 탭이 같은 이유로 키 이동을 갖췄다). 여기는 고르는 단추
            * 몇 개일 뿐이므로 `aria-pressed` 로 눌린 것을 말한다.
            */}
          {byYear.length > 1 && (
            <div className="year-tabs" aria-label="완료된 모임 연도">
              {byYear.map((y) => (
                <button key={y.year} type="button"
                  className={y.year === activeYear ? 'year-tab on' : 'year-tab'}
                  aria-pressed={y.year === activeYear}
                  onClick={() => setPickedYear(y.year)}>
                  {y.year}년 <span className="year-tab-count">{y.count}건</span>
                </button>
              ))}
            </div>
          )}

          {/* 가장 최근 달만 펼쳐 둔다. 전부 펼치면 지난 기록이 화면을 길게 밀어내고,
              전부 접으면 방금 끝난 모임을 보러 한 번 더 눌러야 한다. */}
          {active.months.map(({ month, rows }, i) => (
            <details key={`${active.year}-${month}`} className="completed-month" open={i === 0}>
              <summary>
                <span className="completed-month-title">{active.year}년 {month}월</span>
                <span className="completed-month-count">{rows.length}건</span>
              </summary>
              <div className="completed-month-body">
                <div className="completed-list">
                  {rows.map((m) => (
                    <p key={m.id} className="drow">
                      <span className="ck">✓</span><span>{m.completedRow}</span>
                    </p>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </>
      )}

      {/* 위에서 고른 해의 달력만 편다. 탭이 2026년을 가리키는데 아래에 2027년
          달력이 펼쳐져 있으면 한 화면이 두 해를 말하게 된다. */}
      {pastCalendars.length > 0 && (
        <section className="completed-calendar">
          <h3 className="completed-calendar-title">완료 일정 달력</h3>
          {pastCalendars.map(({ year, month }) => (
            <details key={`${year}-${month}`} className="calendar-fold">
              <summary>
                <span className="calendar-fold-title">{year}년 {month}월</span>
                <span className="calendar-fold-hint">지난 달력 보기</span>
              </summary>
              <div className="calendar-fold-body">{renderCal(year, month)}</div>
            </details>
          ))}
        </section>
      )}

      {open && (
        <div className="event-dialog-backdrop" onClick={() => setOpen(null)}>
          <div className="event-dialog" role="dialog" aria-modal="true"
            aria-labelledby="eventDialogTitle" ref={dialogRef} tabIndex={-1}
            onClick={(ev) => ev.stopPropagation()}>
            <div className="event-dialog-card">
              <div className="event-dialog-head">
                <div>
                  <span className="event-dialog-status" data-tone={open.tone}>{open.status}</span>
                  <h2 id="eventDialogTitle">{open.title || open.chip}</h2>
                </div>
              </div>
              <dl className="event-dialog-facts">
                <div><dt>날짜</dt><dd>{open.dateLabel || open.date.replace(/-/g, '.')}</dd></div>
                <div><dt>시간</dt><dd>{open.time || '확인 중'}</dd></div>
                <div><dt>장소</dt><dd>{open.venue || '확인 중'}</dd></div>
              </dl>
              {open.description && <p className="event-dialog-description">{open.description}</p>}
              {open.note && <p className="event-dialog-note">{open.note}</p>}
              <div className="event-dialog-actions">
                {open.infoUrl && (
                  <a className="event-dialog-link primary" href={open.infoUrl}
                    target="_blank" rel="noopener noreferrer">
                    {open.infoLabel || '공식 정보 보기 →'}
                  </a>
                )}
                {open.mapUrl && (
                  <a className="event-dialog-link secondary" href={open.mapUrl}
                    target="_blank" rel="noopener noreferrer">카카오맵 보기</a>
                )}
                <button type="button" className="event-dialog-dismiss"
                  onClick={() => setOpen(null)}>닫기</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 꼬리말. 이 화면이 무엇을 근거로 만들어졌고 어디를 봐야 하는지 맺는 자리다.
          빠져 있으면 페이지가 달력에서 툭 끊긴다.

          갱신 시각을 여기서도 뺐다 (2026-09-02). 위 `.upd` 배지만 감추면 같은 날짜가
          꼬리말에서 다시 나와 감춘 뜻이 없어진다. **근거를 밝히는 문장은 남긴다** —
          무엇을 보고 만든 화면인지까지 지우면 회원이 이 일정을 얼마나 믿어야 할지
          알 수 없다. 날짜만 빠지고 출처는 남는 형태다. */}
      <footer className="foot">
        <p>
          톡방 대화 내역과 운영진 확인사항을 기준으로 정리했습니다.
          <br />일정 변경 시 톡방 공지를 확인해 주세요.
        </p>
      </footer>
    </>
  )
}
