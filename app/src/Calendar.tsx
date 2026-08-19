import { useEffect, useMemo, useRef, useState } from 'react'
import { isRecentlyCompleted, monthGrid, seoulToday, WEEKDAYS } from './lib/calendar'
import { fetchDigest, SEVERITY_ICON, type Digest } from './lib/digest'
import {
  COMPLETED_VISIBLE_DAYS, MEETUPS, MONTHS, PAST_MONTHS, type Meetup,
} from './data/meetups'

/**
 * 옛 notice.html 의 마크업을 그대로 쓴다 — `.digest` · `.sec` · `.card` · `.cal` ·
 * `.legend` · `.completed-list` · `.calendar-fold`.
 * 스타일은 `styles/legacy-notice.css`(옛 notice.css 를 범위만 가른 것)가 낸다.
 *
 * 달라진 것은 달력 격자를 손으로 쓰지 않고 날짜에서 만든다는 것뿐이다.
 */

const KO_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

/** 옛 notice.html:89-96 의 범례. 색만으로 뜻을 전하지 않게 하는 자리다. */
const LEGEND: { cls: string; label: string }[] = [
  { cls: 'done', label: '완료' },
  { cls: 'conf', label: '확정' },
  { cls: 'official', label: '공식 정기관람' },
  { cls: 'tent', label: '모집중 · 미정' },
  { cls: 'dead', label: '예매 마감' },
  { cls: 'movie', label: '영화 모임' },
]

function DayBlock({ date, official }: { date: string; official: boolean }) {
  const m = Number(date.slice(5, 7))
  const d = Number(date.slice(8, 10))
  const w = KO_WEEK[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? ''
  return (
    <div className={official ? 'db db-official' : 'db'}>
      <div className="m">{m}월</div>
      <div className="d">{d}</div>
      <div className="w">{w}</div>
    </div>
  )
}

function chipClass(m: Meetup) {
  return ['chip', m.kind, m.official ? 'official' : '', m.movie ? 'movie' : '', 'event-trigger']
    .filter(Boolean).join(' ')
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
      <details className="digest">
        <summary className="digest-head">
          <span className="digest-title-group">
            <span className="digest-eyebrow">운영진 확인용 · 공개 요약</span>
            <span className="digest-title" role="heading" aria-level={2}>주간 정리봇</span>
          </span>
          <span className="digest-summary-meta">
            <span className="digest-period">
              {digestError ? '불러오지 못함'
                : digest ? [digest.periodLabel, digest.updatedLabel].filter(Boolean).join(' · ')
                : '불러오는 중'}
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
            <article key={m.id} className={m.official ? 'card card-official' : 'card'}>
              <DayBlock date={m.date} official={m.official} />
              <div>
                <span className={m.official ? 'tag tag-official' : 'tag'}>
                  {m.official ? '공식 정기관람' : '확정'}
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

      <h2 className="sec"><span className="dot dot-dark" />한눈에 보는 달력</h2>
      <p className="legend">
        {LEGEND.map((l) => <span key={l.cls} className={`lchip ${l.cls}`}>{l.label}</span>)}
      </p>
      {MONTHS.map(({ year, month }) => (
        <div key={`${year}-${month}`}>
          <h3 className="mon">{year}년 {month}월</h3>
          {renderCal(year, month)}
        </div>
      ))}

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
    </>
  )
}
