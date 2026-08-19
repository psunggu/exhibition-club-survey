import { useEffect, useMemo, useState } from 'react'
import {
  AREAS, CONTENT_TYPES, EventsUnavailable, fetchEvents, filterEvents,
  type Area, type ContentType, type Event,
} from './lib/events'
import {
  MOVIES, MOVIE_BOOKING_URL, MOVIE_RANKING_SOURCE_URL, MOVIE_RANKING_UPDATED_AT,
  type Movie,
} from './data/movies'

/**
 * 옛 화면의 마크업을 **그대로** 쓴다 — `.exhibition-card` · `.area-tab` 계열.
 *
 * 회원이 3년 가까이 봐 온 화면이라, 새로 그리면 이질감이 생긴다.
 * 그래서 `styles/legacy-board.css`(옛 styles.css 원본)를 손대지 않고 들여오고,
 * 여기서 같은 클래스 이름과 같은 구조를 낸다.
 *
 * 값을 만드는 함수들도 옛 app.js 와 같은 규칙이다 —
 * formatStars · formatDateRange · formatSharePrice · formatDocentTime ·
 * formatParkingInfo · formatRatingSource.
 */

const today = () => new Date().toISOString().slice(0, 10)

const stars = (rating: string | null) => {
  const v = Math.max(0, Math.min(5, Number(rating ?? 0)))
  return v ? '★'.repeat(v) + '☆'.repeat(5 - v) : '-'
}

const dateRange = (e: Event) => {
  const s = e.startDate ?? ''
  const t = e.endDate ?? ''
  if (!s && !t) return '-'
  if (s === t || !t) return s
  return `${s} ~ ${t}`
}

const price = (e: Event) => {
  if (e.priceType === '확인 필요') return '확인 필요'
  const n = Number(e.price ?? 0)
  const base = n === 0 ? '무료' : `${n.toLocaleString('ko-KR')}원`
  if (e.priceType && e.priceType !== '무료' && base === '무료') return e.priceType
  return base
}

const docentTime = (e: Event) => {
  if (e.docentTime) return e.docentTime
  if (e.type === '공연') return '해당 없음'
  if (e.docent) return `${e.docent} / 시간은 공식 페이지 확인`
  return '공식 페이지 확인'
}

const parkingInfo = (e: Event) =>
  e.parkingFee ? `${e.parking ?? '확인 필요'} · ${e.parkingFee}` : (e.parking ?? '확인 필요')

const ratingSource = (e: Event) =>
  `별점 출처: ${e.sourceLabel ?? '공식 정보'} · 기준: ${e.ratingReason ?? '모임 추천 기준'}`

const kakaoMapUrl = (e: Event) =>
  e.mapUrl ?? `https://map.kakao.com/?q=${encodeURIComponent(e.venue ?? e.title)}`

function Detail({ label, value }: { label: string; value: string | null }) {
  return <div><dt>{label}</dt><dd>{value || '-'}</dd></div>
}

/**
 * 옛 `renderInlineRecommendationInfo`(app.js:1702) 그대로다.
 * **유형마다 다른 마크업을 낸다** — 전시는 바로 가는 버튼 하나,
 * 공연은 접이식 상세 안에 정보와 예매 링크를 담았다.
 * 이식할 때 이 갈래를 놓쳐 둘 다 같은 링크로 만들었고,
 * 그래서 공연 카드의 접이식 '공연 정보'가 통째로 사라져 있었다.
 */
function InlineInfo({ e }: { e: Event }) {
  const href = e.infoUrl ?? e.mainUrl
  if (!href) return null

  if (e.type === '전시') {
    return (
      <a className="button tertiary" href={href} target="_blank" rel="noopener noreferrer">
        전시 정보·예약
      </a>
    )
  }

  return (
    <details className="recommendation-inline-details">
      <summary className="button tertiary">공연 정보</summary>
      <div className="recommendation-inline-body">
        <p>{e.summary ?? e.recommendation ?? ''}</p>
        <dl>
          <Detail label="관람일정" value={dateRange(e)} />
          <Detail label="운영시간" value={e.time ?? '확인 필요'} />
          <Detail label="관람료" value={price(e)} />
          <Detail label="할인" value={e.discount ?? '확인 필요'} />
          <Detail label="공연 해설·도슨트" value={docentTime(e)} />
          <Detail label="정보 기준일" value={e.updatedAt ?? '확인 필요'} />
        </dl>
        <a className="official-info-link" href={href} target="_blank" rel="noopener noreferrer">
          공식 예매 페이지
        </a>
      </div>
    </details>
  )
}

function EventCard({ e, index }: { e: Event; index: number }) {
  return (
    <article className={`exhibition-card${e.type === '공연' ? ' performance-card' : ''}`}>
      <div className="exhibition-rank">{index + 1}</div>
      <div className="exhibition-body">
        <div className="exhibition-head">
          <div>
            <p className="exhibition-venue">
              {[e.region, e.venue || '장소 확인 필요'].filter(Boolean).join(' · ')}
            </p>
            <h3>{e.title}</h3>
          </div>
          <div className="rating-box">
            <div className="stars" role="img" aria-label={`추천 별점 ${e.rating ?? '-'}점`}>{stars(e.rating)}</div>
            <div className="rating-source">{ratingSource(e)}</div>
          </div>
        </div>

        <p className="exhibition-summary">{e.summary ?? e.recommendation ?? ''}</p>

        <dl className="exhibition-details">
          <Detail label="관람일정" value={dateRange(e)} />
          <Detail label="운영시간" value={e.time ?? '확인 필요'} />
          <Detail label="관람료" value={price(e)} />
          <Detail label="카드·통신사 할인" value={e.discount ?? '확인 필요'} />
          <Detail label="위치" value={[e.venue, e.address].filter(Boolean).join(' · ') || '확인 필요'} />
          <Detail label={e.type === '공연' ? '공연 해설·도슨트' : '도슨트 운영시간'} value={docentTime(e)} />
          <Detail label="주차/주차료" value={parkingInfo(e)} />
        </dl>

        {e.recommendation && <p className="exhibition-reason">{e.recommendation}</p>}

        <div className="exhibition-actions">
          <a className="button primary" href={kakaoMapUrl(e)} target="_blank" rel="noopener noreferrer">
            카카오맵
          </a>
          <InlineInfo e={e} />
        </div>
      </div>
    </article>
  )
}

function MovieCard({ m }: { m: Movie }) {
  return (
    <article className="exhibition-card movie-card">
      <div className="exhibition-rank">{m.bookingRank}</div>
      <div className="exhibition-body">
        <div className="exhibition-head">
          <div>
            <p className="exhibition-venue movie-status-line">
              <span className="movie-status-badge">{m.releaseStatus}</span>
              <span className="movie-ranking-badge">예매율 {m.bookingRate}%</span>
            </p>
            <h3>{m.title}</h3>
          </div>
        </div>

        <p className="exhibition-summary">{m.summary}</p>

        <dl className="exhibition-details">
          <Detail label="개봉일" value={m.releaseDate} />
          <Detail label="상영시간" value={`${m.runtime}분`} />
          <Detail label="장르" value={m.genre} />
          <Detail label="관람등급" value={m.ageRating} />
          <Detail label="감독" value={m.director} />
        </dl>

        <div className="exhibition-actions">
          <a className="button primary" href={MOVIE_BOOKING_URL} target="_blank" rel="noopener noreferrer">
            예매 확인
          </a>
          <a className="official-info-link" href={m.infoUrl} target="_blank" rel="noopener noreferrer">
            영화 정보 보기 <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </article>
  )
}

const TAB_ICON: Record<ContentType, string> = {
  전체: 'tab-icon-all', 전시: 'tab-icon-exhibition', 공연: 'tab-icon-music', 영화: 'tab-icon-movie',
}
const TAB_LABEL: Record<ContentType, string> = {
  전체: '전체', 전시: '전시', 공연: '음악공연', 영화: '영화',
}


/**
 * 탭 묶음에서 화살표 키로 이동한다 — 옛 `setupTabKeyboard`(app.js:1430) 복원.
 *
 * `role="tablist"` 를 선언해 놓고 키보드 이동이 없으면, 스크린리더는 회원에게
 * 화살표를 쓰라고 안내하는데 눌러도 아무 일이 없다. 안내와 동작이 어긋나는 것이
 * 아예 role 이 없는 것보다 나쁘다.
 *
 * 옛 동작 그대로 **초점을 옮기며 곧바로 선택**한다(자동 활성).
 * roving tabindex 는 넣지 않았다 — Tab 키 순서가 옛 화면과 달라진다.
 */
function tabKeys<T>(items: readonly T[], current: T, set: (v: T) => void) {
  return (e: React.KeyboardEvent<HTMLElement>) => {
    const i = items.indexOf(current)
    let n = i
    if (e.key === 'ArrowLeft') n = (i - 1 + items.length) % items.length
    else if (e.key === 'ArrowRight') n = (i + 1) % items.length
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = items.length - 1
    else return
    e.preventDefault()
    const next = items[n]
    if (next === undefined) return
    set(next)
    ;(e.currentTarget.children[n] as HTMLElement | undefined)?.focus()
  }
}

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

  const groups = useMemo(() => {
    const out: { key: string; title: string; subtitle: string; nodes: React.ReactNode[] }[] = []
    const add = (key: string, title: string, subtitle: string, nodes: React.ReactNode[]) => {
      if (nodes.length) out.push({ key, title, subtitle, nodes })
    }
    if (type === '전체' || type === '전시')
      add('전시', '추천 전시', `공식 상세 페이지로 확인한 ${area} 전시`,
        list.filter((e) => e.type === '전시').slice(0, 10)
          .map((e, i) => <EventCard key={e.id} e={e} index={i} />))
    if (type === '전체' || type === '공연')
      add('공연', '추천 음악공연', `공식 공연장 일정 페이지에서 고르는 ${area} 공연 후보`,
        list.filter((e) => e.type === '공연').slice(0, 10)
          .map((e, i) => <EventCard key={e.id} e={e} index={i} />))
    if ((type === '전체' || type === '영화') && !search)
      add('영화', '실시간 영화 예매 순위',
        `${MOVIE_RANKING_UPDATED_AT} KOBIS 전국 기준 · ${area} 영화관별 상영 회차 확인`,
        MOVIES.slice(0, type === '영화' ? 10 : 5).map((m) => <MovieCard key={m.id} m={m} />))
    const rest = list.filter((e) => e.type !== '전시' && e.type !== '공연')
    if (type === '전체' && rest.length)
      add('기타', '그 밖에', '', rest.map((e, i) => <EventCard key={e.id} e={e} index={i} />))
    return out
  }, [list, type, area, search])

  if (error) {
    return (
      <div className="empty-state" role="alert">
        <strong>정보를 불러오지 못했습니다.</strong> 잠시 뒤 새로고침해 주세요.
        <br /><span className="rating-source">{error}</span>
      </div>
    )
  }
  if (!events) return <p className="empty-state" aria-live="polite">불러오는 중…</p>

  return (
    <>
      {/* 화면에는 안 보이고 스크린리더에만 읽힌다.
          조기 return 과 달리 **사라지지 않아야** 라이브 영역으로 동작한다. */}
      <p className="visually-hidden" role="status" aria-live="polite">
        {`${TAB_LABEL[type]} · ${area} · ${groups.reduce((n, g) => n + g.nodes.length, 0)}건`}
      </p>
      <nav className="area-tabs" role="tablist" aria-label="추천 지역 선택"
        onKeyDown={tabKeys(AREAS, area, setArea)}>
        {AREAS.map((a) => (
          <button key={a} type="button" role="tab" data-area={a}
            className={a === area ? 'area-tab is-active' : 'area-tab'}
            aria-selected={a === area} onClick={() => setArea(a)}>{a}</button>
        ))}
      </nav>

      <nav className="content-type-tabs" role="tablist" aria-label="문화 유형 선택"
        onKeyDown={tabKeys(CONTENT_TYPES, type, setType)}>
        {CONTENT_TYPES.map((t) => (
          <button key={t} type="button" role="tab" data-content-type={t}
            className={t === type ? 'content-type-tab is-active' : 'content-type-tab'}
            id={`tab-${t}`} aria-controls="recommendationPanel"
            aria-selected={t === type} onClick={() => setType(t)}>
            <span className={`content-type-tab-icon ${TAB_ICON[t]}`} aria-hidden="true" />
            <span className="content-type-tab-label">{TAB_LABEL[t]}</span>
          </button>
        ))}
      </nav>

      <div className="search-row">
        <label className="search-field">
          <span className="visually-hidden">검색</span>
          <input type="search" value={search} placeholder="제목 · 장소 · 장르 검색"
            onChange={(e) => setSearch(e.target.value)} />
        </label>
      </div>

      <div className="exhibition-page" id="recommendationPanel"
        role="tabpanel" aria-labelledby={`tab-${type}`}>
        {groups.length === 0 ? (
          <div className="empty-state">
            <strong>조건에 맞는 정보가 없습니다.</strong>
            <br />지역이나 유형을 바꿔 보시거나, 검색어를 지워 보세요.
          </div>
        ) : groups.map((g) => (
          <section key={g.key} className="recommendation-group" aria-label={g.title}>
            <div className="recommendation-group-head">
              <div>
                <h3 role="heading" aria-level={2}>{g.title}</h3>
                {g.subtitle && <p>{g.subtitle}</p>}
              </div>
              <span>{g.nodes.length}건</span>
            </div>
            <div className="exhibition-grid">{g.nodes}</div>
          </section>
        ))}
        {groups.some((g) => g.key === '영화') && (
          <p className="rating-source">
            순위 출처 —{' '}
            <a href={MOVIE_RANKING_SOURCE_URL} target="_blank" rel="noopener noreferrer">KOBIS 실시간 예매율</a>
          </p>
        )}
      </div>
    </>
  )
}
