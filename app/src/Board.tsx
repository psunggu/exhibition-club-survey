import { useEffect, useMemo, useState } from 'react'
import {
  AREAS, CONTENT_TYPES, EventsUnavailable, fetchEvents, filterEvents,
  type Area, type ContentType, type Event,
} from './lib/events'
import { pickNews } from './lib/news'
import {
  MOVIES, MOVIE_BOOKING_URL, MOVIE_RANKING_UPDATED_AT,
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

/**
 * **보드에 올리지 않는 것 — 영화·전시·공연 모두에 걸린다.**
 *
 * 여기는 교회 동아리의 **공개** 화면이다. 예매 순위와 전시·공연 목록은 바깥 집계를
 * 그대로 비추는 자리라 우리가 고르지 않지만, 두 가지는 거른다.
 *
 *   1. 청소년 관람불가 — 회원 중에 청소년이 있을 수 있다
 *   2. 공포·호러 — 무섭거나 혐오스러운 것을 보러 가는 모임이 아니다
 *
 * **자료에서 지우지 않고 여기서 거른다.** `movies.ts` 는 순위를 그대로 적는
 * 자리이고 전시·공연은 DB 에서 온다. 손으로 지우면 다음 갱신 때 붙여 넣으며
 * 조용히 되살아난다. 화면에서 거르면 그럴 일이 없다.
 *
 * 순위 번호는 그대로 둔다 — 걸러진 자리에서 번호가 하나 건너뛴다.
 * 다시 매기면 「전국 예매 4위」 라는 말이 거짓이 된다.
 *
 * ── 기계가 못 잡는 것 ──────────────────────────────────────
 * 「혐오스럽다」 는 장르 글자에 안 나온다. 잔혹한 범죄물, 노골적인 폭력,
 * 시신·훼손을 다룬 전시 같은 것은 **자료를 갱신하는 사람이 보고 뺀다.**
 * 아래 목록은 그 판단을 대신하지 않는다 — 확실한 것만 자동으로 막는 그물이다.
 */
/**
 * **사람이 판단해 뺀 것.** 장르·등급으로는 안 걸리는데 공개 화면에 두지 않기로 한 작품.
 *
 * **왜 뺐는지 함께 적는다.** 이름만 있으면 다음 사람이 「왜 빠졌지」 하며 되돌린다.
 * 작품이 나빠서가 아니라 **이 자리에 맞지 않아서** 빼는 경우가 대부분이다.
 */
const HIDDEN_TITLES: Record<string, string> = {
  '경주기행':
    '수학여행 가던 아이의 피살과, 법원에서 몸을 던지는 아버지가 중심 소재다. '
    + '잔혹한 묘사는 적다는 평이지만 예고 없이 훑어보는 공개 화면에 두기에는 무겁고, '
    + '실제 참사를 겪은 회원이 있을 수 있다. 작품이 나빠서가 아니다.',
}

const hiddenByTitle = (title: string) => title in HIDDEN_TITLES

const HIDDEN_AGE_RATINGS = ['청소년 관람불가']
const HIDDEN_GENRE_WORDS = ['공포', '호러']

const hiddenByGenre = (genre: string | null | undefined) =>
  HIDDEN_GENRE_WORDS.some((w) => (genre ?? '').includes(w))

/** 전시·공연은 관람등급이 없다. 장르만 본다. */
const showableEvent = (e: Event) => !hiddenByGenre(e.genre) && !hiddenByTitle(e.title)

const SHOWABLE_MOVIES = MOVIES.filter(
  (m) => !HIDDEN_AGE_RATINGS.includes(m.ageRating) && !hiddenByGenre(m.genre)
    && !hiddenByTitle(m.title))

/**
 * `8~9월` — 이번 달과 다음 달.
 *
 * 옛 부제는 이 두 글자를 손으로 박아 두었다. 그 뜻은 전시의 기간이 아니라
 * **모임을 갈 만한 시기**였다 — 전시는 몇 달씩 이어지므로 시작일에서 뽑으면
 * `4~10월` 같은 엉뚱한 폭이 나온다(실제로 그렇게 나왔다).
 * 이번 달과 다음 달로 두면 오늘 화면은 옛것과 같고, 달이 바뀌어도 손댈 것이 없다.
 */
const season = (now: Date = new Date()) => {
  const m = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', month: 'numeric' })
    .format(now))
  return `${m}~${(m % 12) + 1}월`
}

/** 별점의 노란 별을 숫자로 바꾼다. 뜻은 그대로다 — 5점 만점의 몇 점.
    색으로 말하던 것을 글자가 말하게 하는 것이라 aria-label 은 손대지 않는다. */
const stars = (rating: string | null) => {
  const v = Math.max(0, Math.min(5, Number(rating ?? 0)))
  return v ? `${v.toFixed(1)} / 5` : '-'
}

/**
 * 갈래는 색이 아니라 글자가 말한다 — 카드 머리에 붙는 중립 칩의 글자.
 *
 * **모르면 아무 말도 하지 않는다.** 예전에는 type 이 비면 '전시' 로 떨어뜨렸는데,
 * 보드에는 전시·공연·영화 어디에도 안 들어가는 「그 밖에」 묶음이 있다.
 * 그 카드에 「전시」 라고 적으면 회원이 읽는 것이 틀린 정보가 된다.
 */
const kindLabel = (type: string | null) => (type === '공연' ? '음악공연' : type || null)

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

/** 옛 `formatKoreanDate`(app.js:1647) 그대로 — "2026. 7. 29." */
const koDate = (v: string | null) => {
  if (!v) return '확인 필요'
  const [y, m, d] = v.split('-')
  if (!y || !m || !d) return v
  return `${y}. ${Number(m)}. ${Number(d)}.`
}

/** 옛 `movieTheaterMapUrl`(app.js:1654) 그대로 */
const theaterMapUrl = (area: string) =>
  `https://map.kakao.com/?q=${encodeURIComponent(`${area} 영화관`)}`

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
            {kindLabel(e.type) && (
              <div className="card-kind-line">
                <span className="card-kind-chip">{kindLabel(e.type)}</span>
              </div>
            )}
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

/** 옛 `renderMovieCard`(app.js:1604) 그대로다. 이식하며 예매율 박스와
 *  버튼 셋을 잃고 문구도 달라져 있었다. */
function MovieCard({ m, area }: { m: Movie; area: string }) {
  const releaseDateLabel = m.releaseStatus.startsWith('재개봉') ? '재개봉일' : '개봉일'
  return (
    <article className="exhibition-card movie-card">
      <div className="exhibition-rank">{m.bookingRank}</div>
      <div className="exhibition-body">
        <div className="exhibition-head">
          <div>
            <div className="card-kind-line">
              <span className="card-kind-chip">{`영화 · ${m.releaseStatus} · 전국 예매 ${m.bookingRank}위`}</span>
            </div>
            <h3>{m.title}</h3>
          </div>
          <div className="movie-booking-box" aria-label={`KOBIS 예매율 ${m.bookingRate}퍼센트`}>
            <strong>{m.bookingRate}%</strong>
            <span>KOBIS 실시간 예매율</span>
          </div>
        </div>

        <p className="exhibition-summary">{m.summary}</p>

        <dl className="exhibition-details">
          <Detail label={releaseDateLabel} value={koDate(m.releaseDate)} />
          <Detail label="러닝타임" value={`${m.runtime}분`} />
          <Detail label="장르" value={m.genre} />
          <Detail label="관람등급" value={m.ageRating} />
          <Detail label="감독" value={m.director} />
          <Detail label="상영관" value={`${area} 지역 영화관별 회차 확인`} />
        </dl>

        <p className="exhibition-reason">
          전국 실시간 예매 {m.bookingRank}위입니다. 예매율은 조회 시점에 따라 수시로 바뀝니다.
        </p>

        <div className="exhibition-actions">
          <a className="button primary" href={MOVIE_BOOKING_URL}
            target="_blank" rel="noopener noreferrer">영화관 예매</a>
          <a className="button tertiary" href={m.infoUrl}
            target="_blank" rel="noopener noreferrer">KOBIS 영화정보</a>
          <a className="button tertiary" href={theaterMapUrl(area)}
            target="_blank" rel="noopener noreferrer">주변 영화관</a>
        </div>
      </div>
    </article>
  )
}

/**
 * 소식 줄 — 문화예술 소식 하나를 목록 머리글 바로 아래에 건다.
 *
 * **영상을 페이지 안에서 재생하지 않는다.** 유튜브 iframe 을 넣으려면 CSP 에
 * `frame-src` 를 열어야 하는데, 그 실수를 잡아 줄 검사기가 없다 —
 * validate-csp-build.mjs 는 dist 의 .html · .css 만 읽으므로 React 가 만드는
 * iframe 은 시야 밖이고, CSP meta 가 「있는지」만 보고 내용은 보지 않는다.
 * frame-src 를 빠뜨려도 `npm run check` 는 통과하고 회원 화면에서만 조용히 죽는다.
 * 375px 에서 16:9 가 목록을 한 화면 밖으로 미는 문제도 있다.
 *
 * 그래서 **바깥으로 나가는 링크**다. `<a href>` 는 부르는 것이 아니라 가는 것이라
 * CSP 가 막지 않는다(validate-csp-build.mjs 의 FETCHES 정규식도 a · area 를 뺀다).
 * 유튜브 썸네일은 쓰지 않는다 — 자체 호스팅은 유튜브 약관이 금하고,
 * i.ytimg.com 직접 참조는 `img-src 'self' data:` 에 막힌다. 아이콘은 인라인 SVG 다.
 *
 * 갈래는 색이 아니라 글자가 말한다 — 카드와 같은 규칙이다.
 */
function NewsLine({ e }: { e: Event }) {
  const href = e.mainUrl ?? e.infoUrl
  if (!href) return null
  const kind = [e.genre, e.venue, e.summary].filter(Boolean).join(' · ')
  return (
    <a className="news-line" href={href} target="_blank" rel="noopener noreferrer">
      <svg className="news-line-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
        aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="3.5" stroke="currentColor" strokeWidth="2" />
        <path d="M10 9.2v5.6l4.8-2.8L10 9.2z" fill="currentColor" />
      </svg>
      {/* 갈래 · 출처 · 덧말을 **한 줄로 잇는다.** 처음에는 갈래를 알약 칩으로 따로
          세웠는데, 375px 에서 줄 높이가 155px 이 되어 첫 전시 카드를 171px 밀어냈다.
          그건 임베드를 안 쓰기로 한 이유(목록을 밀어낸다)와 같은 값이라, 칩을 접었다.
          갈래는 여전히 색이 아니라 **글자**가 말한다 — 「영상 · 유튜브」. */}
      <span className="news-line-body">
        <span className="news-line-title">{e.title}</span>
        {kind && <span className="news-line-meta">{kind}</span>}
      </span>
      {/* 새 창으로 나간다는 표시. 화살표 아이콘만으로는 화면을 읽어 주는 쪽에 안 닿는다.
          **갈래·출처를 여기 다시 적지 않는다** — 바로 위 줄에 이미 보이게 적혀 있어서,
          넣었더니 스크린리더가 같은 문장을 두 번 읽었다. */}
      <span className="visually-hidden"> (새 창으로 열림)</span>
      <svg className="news-line-out" width="15" height="15" viewBox="0 0 24 24" fill="none"
        aria-hidden="true">
        <path d="M14 4h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 4l-8.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 14.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.5"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </a>
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

  /**
   * 소식은 **`list` 가 아니라 `events` 원본에서** 뽑는다.
   * `filterEvents` 를 거치면 `eventArea` 가 지역을 서울로 떨어뜨리므로
   * 경기 · 인천 탭에서 소식이 통째로 사라진다. 지역을 타는 정보가 아니다.
   * 고르는 규칙은 `pickNews` 에 있다 — 운영자 화면과 같은 규칙을 써야
   * 「올렸는데 안 보인다」 가 생기지 않는다.
   */
  const news = useMemo(() => (events ? pickNews(events, today()) : null), [events])

  const groups = useMemo(() => {
    const out: { key: string; title: string; subtitle: string; nodes: React.ReactNode[] }[] = []
    const add = (key: string, title: string, subtitle: string, nodes: React.ReactNode[]) => {
      if (nodes.length) out.push({ key, title, subtitle, nodes })
    }
    const shows = list.filter((e) => e.type === '전시' && showableEvent(e))
    const gigs = list.filter((e) => e.type === '공연' && showableEvent(e))
    if (type === '전체' || type === '전시')
      add('전시', '추천 전시', `공식 상세 페이지로 확인한 ${area} ${season()} 전시`,
        shows.slice(0, 10).map((e, i) => <EventCard key={e.id} e={e} index={i} />))
    if (type === '전체' || type === '공연')
      add('공연', '추천 음악공연', `공식 공연장 일정 페이지에서 고르는 ${area} ${season()} 공연 후보`,
        gigs.slice(0, 10).map((e, i) => <EventCard key={e.id} e={e} index={i} />))
    if ((type === '전체' || type === '영화') && !search)
      add('영화', '실시간 영화 예매 순위',
        `${MOVIE_RANKING_UPDATED_AT} KOBIS 전국 기준 · ${area} 영화관별 상영 회차 확인`,
        SHOWABLE_MOVIES.slice(0, type === '영화' ? 10 : 5)
          .map((m) => <MovieCard key={m.id} m={m} area={area} />))
    // 소식은 아래 NewsLine 이 맡는다. 빼지 않으면 「그 밖에」 에
    // 관람료 · 주차 항목이 붙은 전시 카드 모양으로 한 번 더 뜬다.
    const rest = list.filter((e) =>
      e.type !== '전시' && e.type !== '공연' && e.type !== '소식')
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
        {/* 목록 머리글. 지금 무엇을 보고 있는지 한 줄로 말해 주는 자리다 —
            이식하면서 통째로 빠뜨렸고, 화면이 필터 바로 아래 카드부터 시작해
            "덜 만들어진" 느낌을 냈다. scripts/compare-visible-text.mjs 가 이걸 잡는다. */}
        <div className="section-heading">
          <div>
            <p className="eyebrow">공유용 목록</p>
            <h2 id="exhibitionPageTitle">
              {type === '영화' ? `${area}에서 볼 영화 예매 순위` : `${area} ${type} 추천`}
            </h2>
          </div>
          <p className="result-count" id="recommendationHint">
            {type === '영화'
              ? '전국 예매 순위 · 선택 지역의 영화관 회차 확인'
              : '지역과 유형을 차례로 선택하세요'}
          </p>
        </div>
        {/* 소식은 목록 **안**에 둔다. `.app-shell` 이 flex column 이고
            `.exhibition-page` 가 order:1 이라, 밖에 형제로 두면 order 없는 구역이
            order:0 으로 올라가 목록 위로 튀어 오른다.
            검색 중에는 감춘다 — 찾는 것과 상관없는 줄이 결과 맨 앞을 차지한다. */}
        {news && !search && <NewsLine e={news} />}
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
      </div>

      {/* 무엇을 근거로 실은 정보인지 밝히는 자리. 회원이 "이건 어디서 온 거냐"고
          물을 때 답이 되는 문단이고, 옛 화면에서 목록 끝을 맺던 블록이다. */}
      <section className="verification-panel" aria-labelledby="verificationTitle">
        <p className="eyebrow">검증 기준</p>
        <h2 id="verificationTitle">공식 한국어 페이지와 KOBIS 자료로 확인한 정보만 노출</h2>
        <p>
          전시·공연은 공식 상세 페이지의 일정, 관람료, 해설, 주차 정보를 확인합니다.
          영화는 영화진흥위원회 실시간 예매율의 전국 순위를 사용하며, 예매율과 지역별 상영
          회차는 수시로 바뀌므로 영화관 공식 예매 화면에서 다시 확인하세요.
        </p>
      </section>
    </>
  )
}
