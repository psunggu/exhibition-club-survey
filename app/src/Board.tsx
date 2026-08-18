import { useEffect, useMemo, useState } from 'react'
import {
  AREAS, CONTENT_TYPES, EventsUnavailable, fetchEvents, filterEvents,
  type Area, type ContentType, type Event,
} from './lib/events'

const today = () => new Date().toISOString().slice(0, 10)

const won = (e: Event) =>
  e.price === 0 ? '무료' : e.price ? `${e.price.toLocaleString('ko-KR')}원` : (e.priceType ?? '확인 필요')

const period = (e: Event) =>
  [e.startDate, e.endDate].filter(Boolean).join(' ~ ').replace(/-/g, '.') || '기간 확인 필요'

export function Board() {
  const [events, setEvents] = useState<Event[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [area, setArea] = useState<Area>('서울')
  const [type, setType] = useState<ContentType>('전체')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const ac = new AbortController()
    fetchEvents(ac.signal)
      .then(setEvents)
      .catch((e: unknown) => {
        if (ac.signal.aborted) return
        setError(e instanceof EventsUnavailable ? e.reason : String(e))
      })
    return () => ac.abort()
  }, [])

  const list = useMemo(
    () => (events ? filterEvents(events, { area, type, search, today: today() }) : []),
    [events, area, type, search],
  )

  if (error) {
    return (
      <div className="note warn" role="alert">
        <p><strong>정보를 불러오지 못했습니다.</strong> 잠시 뒤 새로고침해 주세요.</p>
        <p className="tiny">{error}</p>
      </div>
    )
  }
  if (!events) return <p aria-live="polite">불러오는 중…</p>

  return (
    <>
      <div className="filters">
        <div className="tabs" role="tablist" aria-label="지역">
          {AREAS.map((a) => (
            <button key={a} type="button" role="tab" aria-selected={a === area}
              className={a === area ? 'tab on' : 'tab'} onClick={() => setArea(a)}>
              {a}
            </button>
          ))}
        </div>
        <div className="tabs" role="tablist" aria-label="유형">
          {CONTENT_TYPES.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={t === type}
              className={t === type ? 'tab on' : 'tab'} onClick={() => setType(t)}>
              {t}
            </button>
          ))}
        </div>
        <label className="search">
          <span className="tiny">검색</span>
          <input type="search" value={search} placeholder="제목 · 장소 · 장르"
            onChange={(e) => setSearch(e.target.value)} />
        </label>
      </div>

      <p className="tiny" aria-live="polite">{list.length}건</p>

      {list.length === 0 ? (
        <div className="note">
          <p><strong>조건에 맞는 정보가 없습니다.</strong></p>
          <p className="tiny">지역이나 유형을 바꿔 보시거나, 검색어를 지워 보세요.</p>
        </div>
      ) : (
        <ul className="cards">
          {list.map((e) => (
            <li key={e.id} className="card">
              <div className="card-head">
                <h2>{e.title}</h2>
                {e.verified && <span className="badge good">확인됨</span>}
              </div>
              <p className="meta">
                {[e.type, e.genre, e.venue].filter(Boolean).join(' · ')}
              </p>
              <dl className="facts">
                <div><dt>기간</dt><dd>{period(e)}</dd></div>
                <div><dt>관람료</dt><dd>{won(e)}{e.discount ? ` · ${e.discount}` : ''}</dd></div>
                {e.docent && <div><dt>도슨트</dt><dd>{e.docent}{e.docentTime ? ` · ${e.docentTime}` : ''}</dd></div>}
                {(e.parking ?? e.parkingFee) && (
                  <div><dt>주차</dt><dd>{[e.parking, e.parkingFee].filter(Boolean).join(' · ')}</dd></div>
                )}
              </dl>
              {e.summary && <p>{e.summary}</p>}
              {e.recommendation && <p className="rec"><strong>추천</strong> — {e.recommendation}</p>}
              {e.notes && <p className="tiny">{e.notes}</p>}
              <p className="links">
                {e.infoUrl && <a href={e.infoUrl} rel="noreferrer noopener">공식 정보</a>}
                {e.mainUrl && <a href={e.mainUrl} rel="noreferrer noopener">기관 페이지</a>}
                {e.mapUrl && <a href={e.mapUrl} rel="noreferrer noopener">지도</a>}
              </p>
              {e.sourceLabel && (
                <p className="tiny">출처 — {e.sourceLabel}
                  {e.updatedAt ? ` · ${e.updatedAt.replace(/-/g, '.')} 확인` : ''}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
