import { useEffect, useMemo, useState } from 'react'
import {
  isRecentlyCompleted, monthGrid, seoulToday, WEEKDAYS,
} from './lib/calendar'
import { fetchDigest, type Digest } from './lib/digest'
import { COMPLETED_VISIBLE_DAYS, MEETUPS, MONTHS, type Meetup } from './data/meetups'

const KIND_LABEL: Record<Meetup['kind'], string> = {
  conf: '확정', done: '완료', dead: '마감',
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

  // 달은 이른 순으로 보여준다. 옛 마크업은 8 · 9 · 7월 순으로 흩어져 있었다.
  const months = useMemo(
    () => [...MONTHS].sort((a, b) => a.year - b.year || a.month - b.month),
    [],
  )

  const upcoming = MEETUPS.filter((m) => m.kind === 'conf' && m.date >= today)
  const completed = MEETUPS.filter(
    (m) => m.kind === 'done' && isRecentlyCompleted(m.date, today, COMPLETED_VISIBLE_DAYS))

  return (
    <>
      <section className="panel">
        <h2>주간 정리봇</h2>
        {digestError && <p className="tiny">요약을 불러오지 못했습니다.</p>}
        {!digest && !digestError && <p className="tiny" aria-live="polite">불러오는 중…</p>}
        {digest && (
          <>
            <p className="tiny">
              {[digest.periodLabel, digest.updatedLabel,
                digest.messageCount ? `메시지 ${digest.messageCount}건` : '']
                .filter(Boolean).join(' · ')}
            </p>
            <p>{digest.summary}</p>
            {digest.decisions.length > 0 && (
              <>
                <h3>정해진 것</h3>
                <ul className="bullets">{digest.decisions.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </>
            )}
            {digest.openQuestions.length > 0 && (
              <>
                <h3>아직 정하지 않은 것</h3>
                <ul className="bullets">{digest.openQuestions.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </>
            )}
          </>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="panel">
          <h2>다가오는 확정 모임</h2>
          <ul className="cards">
            {upcoming.map((m) => (
              <li key={m.id} className="card">
                <div className="card-head">
                  <h3>{m.title || m.chip}</h3>
                  {m.official && <span className="badge good">공식</span>}
                </div>
                <dl className="facts">
                  <div><dt>날짜</dt><dd>{m.dateLabel || m.date.replace(/-/g, '.')}</dd></div>
                  {m.time && <div><dt>시간</dt><dd>{m.time}</dd></div>}
                  {m.venue && <div><dt>장소</dt><dd>{m.venue}</dd></div>}
                </dl>
                {m.description && <p>{m.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <h2>한눈에 보는 달력</h2>
        {months.map(({ year, month }) => (
          <div key={`${year}-${month}`} className="cal-block">
            <h3>{year}년 {month}월</h3>
            <div className="cal" role="grid" aria-label={`${year}년 ${month}월 달력`}>
              {WEEKDAYS.map((w, i) => (
                <div key={w} className={`wd${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}`}>{w}</div>
              ))}
              {monthGrid(year, month).map((c, i) => {
                if (c.filler) return <div key={`f${i}`} className="cell off" />
                const list = byDate.get(c.date) ?? []
                const isToday = c.date === today
                return (
                  <div key={c.date} className={isToday ? 'cell is-today' : 'cell'}>
                    <span className="dnum">{c.day}</span>
                    {isToday && <span className="tlab">오늘</span>}
                    {list.map((m) => (
                      <button key={m.id} type="button" className={`chip ${m.kind}`}
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
      </section>

      {completed.length > 0 && (
        <section className="panel">
          <h2>완료된 모임</h2>
          <p className="tiny">끝난 지 {COMPLETED_VISIBLE_DAYS}일이 지나면 자동으로 내려갑니다.</p>
          <ul className="bullets">
            {completed.map((m) => (
              <li key={m.id}>{m.dateLabel || m.date.replace(/-/g, '.')} — {m.title || m.chip}</li>
            ))}
          </ul>
        </section>
      )}

      {open && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label={open.title || open.chip}>
          <div className="sheet-card">
            <div className="card-head">
              {open.status && <span className="badge">{KIND_LABEL[open.kind]} · {open.status}</span>}
              <h2>{open.title || open.chip}</h2>
            </div>
            <dl className="facts">
              <div><dt>날짜</dt><dd>{open.dateLabel || open.date.replace(/-/g, '.')}</dd></div>
              {open.time && <div><dt>시간</dt><dd>{open.time}</dd></div>}
              {open.venue && <div><dt>장소</dt><dd>{open.venue}</dd></div>}
            </dl>
            {open.description && <p>{open.description}</p>}
            {open.note && <p className="tiny">{open.note}</p>}
            <p className="links">
              {open.infoUrl && (
                <a href={open.infoUrl} rel="noreferrer noopener">{open.infoLabel || '공식 정보'}</a>
              )}
              {open.mapUrl && <a href={open.mapUrl} rel="noreferrer noopener">카카오맵</a>}
              <button type="button" className="tab" onClick={() => setOpen(null)}>닫기</button>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
