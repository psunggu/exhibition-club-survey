import { useEffect, useMemo, useRef, useState } from 'react'
import { isRecentlyCompleted, monthGrid, seoulToday, WEEKDAYS } from './lib/calendar'
import { fetchDigest, SEVERITY_ICON, type Digest } from './lib/digest'
import {
  COMPLETED_VISIBLE_DAYS, MEETUPS, MONTHS, PAST_MONTHS, TENTATIVE, type Meetup,
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

/** 색을 못 보는 사람에게는 이 세 줄이 범례의 전부다. 색 점과 함께 늘 붙어 다닌다. */
const LEGEND_NOTE = ['채움 = 확정', '점선 = 미정', '회색 = 완료']

/** 달력 아래 목록의 상태 칩 글자. 달력 칩은 좁아 글자가 몇 자 안 들어가므로 여기서 읽는다. */
const STATUS_LABEL: Record<string, string> = {
  conf: '확정', tent: '미정', done: '완료', dead: '예매 마감',
}

function DayBlock({ date, regular }: { date: string; regular: boolean }) {
  const m = Number(date.slice(5, 7))
  const d = Number(date.slice(8, 10))
  const w = KO_WEEK[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? ''
  return (
    <div className={regular ? 'db db-regular' : 'db'}>
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
  const [showOlder, setShowOlder] = useState(false)
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
  const recent = done.filter((m) => isRecentlyCompleted(m.date, today, COMPLETED_VISIBLE_DAYS))
  const older = done.filter((m) => !recent.includes(m))

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
      {/* 언제까지의 내용인지 밝히는 줄. 옛 화면은 h1 바로 아래 이 자리에 뒀고,
          날짜를 손으로 적었다. 여기서는 정리봇이 실제로 읽어들인 시점을 쓴다. */}
      {/* updatedLabel 은 이미 `… 기준` 으로 끝난다. 뒤에 또 붙이면 "기준 기준" 이 된다. */}
      {digest?.updatedLabel && <span className="upd">업데이트 {digest.updatedLabel}</span>}

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
          <p className="board-jump-kicker">8월 운영 설문</p>
          <h2 id="resultJumpTitle">답해주신 내용, 이렇게 반영했습니다</h2>
          <p>어떤 답이 모였는지, 9월부터 무엇이 달라지는지 정리했습니다.</p>
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
              <DayBlock date={m.date} regular={m.regular} />
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
      {MONTHS.map(({ year, month }) => {
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

      {/* 옛 화면은 최근 3일 안에 끝난 것이 하나도 없으면 이 절 전체를 감췄다
          (notice.js 의 setupCompletedMeetings — list.hidden · title.hidden).
          그때는 '이전 완료 모임 보기' 버튼도 함께 사라진다. */}
      {done.length > 0 && (
        <>
          <h2 className="sec" hidden={recent.length === 0}><span className="dot dot-done" />완료된 모임</h2>
          <div className="completed-list" hidden={recent.length === 0}>
            {recent.map((m) => (
              <p key={m.id} className="drow">
                <span className="ck">✓</span><span>{m.completedRow}</span>
              </p>
            ))}
            {showOlder && older.map((m) => (
              <p key={m.id} className="drow">
                <span className="ck">✓</span><span>{m.completedRow}</span>
              </p>
            ))}
          </div>
          {older.length > 0 && recent.length > 0 && (
            <button className="completed-toggle" type="button"
              aria-expanded={showOlder} onClick={() => setShowOlder((v) => !v)}>
              {showOlder ? '이전 완료 모임 접기' : '이전 완료 모임 보기'}
            </button>
          )}
        </>
      )}

      {PAST_MONTHS.length > 0 && (
        <section className="completed-calendar">
          <h3 className="completed-calendar-title">완료 일정 달력</h3>
          {PAST_MONTHS.map(({ year, month }) => (
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
          빠져 있으면 페이지가 달력에서 툭 끊긴다. */}
      <footer className="foot">
        <p>
          {digest?.updatedLabel
            ? `${digest.updatedLabel}까지의 대화 내역과 운영진 확인사항을 기준으로 정리했습니다.`
            : '톡방 대화 내역과 운영진 확인사항을 기준으로 정리했습니다.'}
          <br />일정 변경 시 톡방 공지를 확인해 주세요.
        </p>
      </footer>
    </>
  )
}
