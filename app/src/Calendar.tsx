import { useEffect, useMemo, useState } from 'react'
import { isRecentlyCompleted, monthGrid, seoulToday, WEEKDAYS } from './lib/calendar'
import { fetchDigest, type Digest } from './lib/digest'
import { COMPLETED_VISIBLE_DAYS, MEETUPS, MONTHS, type Meetup } from './data/meetups'

/**
 * 옛 notice.html 의 마크업을 그대로 쓴다 — `.digest` · `.sec` · `.card` · `.cal`.
 * 스타일은 `styles/legacy-notice.css`(옛 notice.css 원본)가 낸다.
 *
 * 달라진 것은 달력 격자를 손으로 쓰지 않고 날짜에서 만든다는 것뿐이다.
 */

const KO_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

function dayBlock(date: string, official: boolean) {
  const [, m, d] = date.split('-')
  const w = KO_WEEK[new Date(`${date}T00:00:00Z`).getUTCDay()]
  return (
    <div className={official ? 'db db-official' : 'db'}>
      <div className="m">{Number(m)}월</div>
      <div className="d">{Number(d)}</div>
      <div className="w">{w}</div>
    </div>
  )
}

export function Calendar() {
  const today = useMemo(() => seoulToday(), [])
  const [digest, setDigest] = useState<Digest | null>(null)
  const [digestError, setDigestError] = useState(false)
  const [open, setOpen] = useState<Meetup | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    fetchDigest(ac.signal)
      .then(setDigest)
      .catch(() => { if (!ac.signal.aborted) setDigestError(true) })
    return () => ac.abort()
  }, [])

  const byDate = useMemo(() => {
    const m = new Map<string, Meetup[]>()
    for (const x of MEETUPS) m.set(x.date, [...(m.get(x.date) ?? []), x])
    return m
  }, [])

  const months = useMemo(
    () => [...MONTHS].sort((a, b) => a.year - b.year || a.month - b.month), [])

  const upcoming = MEETUPS.filter((m) => m.kind === 'conf' && m.date >= today)
  const completed = MEETUPS.filter(
    (m) => m.kind === 'done' && isRecentlyCompleted(m.date, today, COMPLETED_VISIBLE_DAYS))

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
            {digest?.decisions.length ? (
              <>
                <h4>정해진 것</h4>
                <ul>{digest.decisions.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </>
            ) : null}
            {digest?.openQuestions.length ? (
              <>
                <h4>아직 정하지 않은 것</h4>
                <ul>{digest.openQuestions.map((x, i) => <li key={i}>{x}</li>)}</ul>
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
              {dayBlock(m.date, m.official)}
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
      {months.map(({ year, month }) => (
        <div key={`${year}-${month}`}>
          <h3 className="cal-caption">{year}년 {month}월</h3>
          <div className="cal" role="grid" aria-label={`${year}년 ${month}월 달력`}>
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
                    <button key={m.id} type="button"
                      className={`chip ${m.kind === 'conf' ? 'conf' : m.kind}${m.official ? ' official' : ''}${m.movie ? ' movie' : ''}`}
                      onClick={() => setOpen(m)}>
                      {m.chip}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {completed.length > 0 && (
        <>
          <h2 className="sec"><span className="dot dot-done" />완료된 모임</h2>
          <div className="completed-list">
            {completed.map((m) => (
              <p key={m.id} className="drow">
                <span className="ck">✓</span>
                <span><b>{m.dateLabel || m.date.replace(/-/g, '.')}</b> {m.title || m.chip}</span>
              </p>
            ))}
          </div>
        </>
      )}

      {open && (
        <div className="event-dialog-backdrop" role="dialog" aria-modal="true"
          aria-label={open.title || open.chip} onClick={() => setOpen(null)}>
          <div className="event-dialog" onClick={(ev) => ev.stopPropagation()}>
            <div className="event-dialog-head">
              <div>
                <span className="event-dialog-status" data-tone={open.tone}>{open.status}</span>
                <h2>{open.title || open.chip}</h2>
              </div>
            </div>
            <dl className="event-dialog-facts">
              <div><dt>날짜</dt><dd>{open.dateLabel || open.date.replace(/-/g, '.')}</dd></div>
              <div><dt>시간</dt><dd>{open.time || '확인 중'}</dd></div>
              <div><dt>장소</dt><dd>{open.venue || '확인 중'}</dd></div>
            </dl>
            {open.description && <p className="event-dialog-description">{open.description}</p>}
            {open.note && <p className="event-dialog-note">{open.note}</p>}
            <div className="dialog-actions">
              {open.infoUrl && (
                <a className="event-dialog-link primary" href={open.infoUrl}
                  target="_blank" rel="noopener noreferrer">
                  {open.infoLabel || '공식 정보 보기'} <span aria-hidden="true">→</span>
                </a>
              )}
              {open.mapUrl && (
                <a className="event-dialog-link secondary" href={open.mapUrl}
                  target="_blank" rel="noopener noreferrer">카카오맵 보기</a>
              )}
              <button type="button" className="button" onClick={() => setOpen(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
