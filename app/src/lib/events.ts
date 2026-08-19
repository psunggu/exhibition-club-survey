/**
 * 이벤트는 **Supabase `public.events` 에서만** 읽는다 (R-01-04).
 *
 * 예전 app.js 는 DB 결과 위에 하드코딩 배열을 제목으로 덮어썼다.
 * 그래서 화면에 나가는 27건 중 22건이 코드에만 있었고, 겹치는 5건은
 * DB 와 내용이 어긋나 있었다 — "두 곳에 데이터가 있으면 반드시 어긋난다"의 실물이다.
 * 그 배열은 202608190001_events_curated_backfill.sql 로 DB 에 옮겼다 (D-24).
 *
 * **여기에 이벤트를 하드코딩하지 않는다.** 화면이 비면 DB 를 고친다.
 */

export type Event = {
  id: string
  status: string | null
  region: string | null
  type: string | null
  title: string
  genre: string | null
  startDate: string | null
  endDate: string | null
  visitDate: string | null
  time: string | null
  venue: string | null
  address: string | null
  price: number | null
  priceType: string | null
  parking: string | null
  difficulty: string | null
  rating: string | null
  owner: string | null
  infoUrl: string | null
  mapUrl: string | null
  summary: string | null
  recommendation: string | null
  notes: string | null
  ratingReason: string | null
  updatedAt: string | null
  // 큐레이션 필드 — D-24 로 더한 것들
  recommendedRank: number | null
  verified: boolean | null
  discount: string | null
  parkingFee: string | null
  docent: string | null
  docentTime: string | null
  sourceLabel: string | null
  verificationNote: string | null
  mainUrl: string | null
}

type Row = Record<string, unknown>

const str = (v: unknown): string | null =>
  v === null || v === undefined || v === '' ? null : String(v)
const num = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number(v)

/** snake_case 응답을 화면이 쓰는 모양으로 옮긴다. 여기 말고 다른 데서 변환하지 않는다. */
export function toEvent(row: Row): Event {
  return {
    id: String(row.id ?? ''),
    status: str(row.status),
    region: str(row.region),
    type: str(row.type),
    title: String(row.title ?? ''),
    genre: str(row.genre),
    startDate: str(row.start_date),
    endDate: str(row.end_date),
    visitDate: str(row.visit_date),
    time: str(row.time),
    venue: str(row.venue),
    address: str(row.address),
    price: num(row.price),
    priceType: str(row.price_type),
    parking: str(row.parking),
    difficulty: str(row.difficulty),
    rating: str(row.rating),
    owner: str(row.owner),
    infoUrl: str(row.info_url),
    mapUrl: str(row.map_url),
    summary: str(row.summary),
    recommendation: str(row.recommendation),
    notes: str(row.notes),
    ratingReason: str(row.rating_reason),
    updatedAt: str(row.updated_at),
    recommendedRank: num(row.recommended_rank),
    verified: row.verified === null || row.verified === undefined ? null : Boolean(row.verified),
    discount: str(row.discount),
    parkingFee: str(row.parking_fee),
    docent: str(row.docent),
    docentTime: str(row.docent_time),
    sourceLabel: str(row.source_label),
    verificationNote: str(row.verification_note),
    mainUrl: str(row.main_url),
  }
}

type Config = { supabaseUrl?: string; supabaseAnonKey?: string }

/**
 * 설정은 빌드에 박지 않고 실행 시점에 읽는다.
 * anon 키는 원래 공개되는 값이지만(번들은 공개다), URL 이 바뀌었을 때
 * 다시 빌드하지 않아도 되게 해 둔다.
 */
function readConfig(): Config {
  const g = globalThis as unknown as { CLUB_CONFIG?: Config }
  return g.CLUB_CONFIG ?? {}
}

export class EventsUnavailable extends Error {
  constructor(readonly reason: string) {
    super(reason)
    this.name = 'EventsUnavailable'
  }
}

/**
 * 실패하면 **던진다.** 조용히 빈 배열이나 예전 데이터로 떨어지지 않는다.
 * 옛 app.js 는 실패하면 하드코딩 배열로 떨어졌고, 그래서 DB 가 비어 있어도
 * 화면은 멀쩡해 보였다 — 고장이 보이지 않는 쪽이 더 나쁘다.
 */
export async function fetchEvents(signal?: AbortSignal): Promise<Event[]> {
  const { supabaseUrl, supabaseAnonKey } = readConfig()
  if (!supabaseUrl || !supabaseAnonKey)
    throw new EventsUnavailable('설정(CLUB_CONFIG)이 없다')

  // 정렬은 서버에 맡기지 않는다.
  // `order=recommended_rank...` 로 걸면 그 컬럼이 없는 동안 **응답 전체가 400** 이 된다
  // (42703 column does not exist). 마이그레이션 적용 전후 모두 돌아야 하므로
  // select 는 * 하나로 두고 순서는 아래에서 매긴다. 수십 행짜리라 값도 없다.
  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/events?select=*`

  const res = await fetch(url, {
    signal,
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
  })
  if (!res.ok) throw new EventsUnavailable(`Supabase 응답 ${res.status}`)

  const rows = (await res.json()) as Row[]
  if (!Array.isArray(rows)) throw new EventsUnavailable('응답이 배열이 아니다')
  return rows.map(toEvent).sort(byRecommendedThenDate)
}

/** 운영진이 매긴 추천 순서가 먼저, 없으면 시작일 빠른 순. */
export function byRecommendedThenDate(a: Event, b: Event): number {
  const ra = a.recommendedRank ?? Number.POSITIVE_INFINITY
  const rb = b.recommendedRank ?? Number.POSITIVE_INFINITY
  if (ra !== rb) return ra - rb
  return (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999')
}

// ── 걸러내기 ────────────────────────────────────────────────

export const AREAS = ['서울', '경기', '인천'] as const
export const CONTENT_TYPES = ['전체', '전시', '공연', '영화'] as const
export type Area = (typeof AREAS)[number]
export type ContentType = (typeof CONTENT_TYPES)[number]

/**
 * 지역 판정. **현재 app.js 의 `eventArea` 와 같은 규칙이다** — 화면이 달라지면 안 된다.
 *
 * `region` 은 "서울 전체" 만이 아니라 "종로/중구" · "노원/도봉/강북" 처럼
 * 서울 하위 권역으로도 들어온다. 그래서 앞 두 글자로 자르면 대부분 어디에도 안 걸린다.
 * 실제 규칙은 여러 칸을 이어 붙여 키워드를 찾고, **아무것도 안 걸리면 서울**이다.
 */
export function eventArea(e: Event): Area {
  const location = [e.region, e.address, e.venue].filter(Boolean).join(' ')
  if (location.includes('인천')) return '인천'
  if (location.includes('경기') || location.includes('수원')) return '경기'
  return '서울'
}

/** 기간이 지난 것은 보드에서 내린다. 옛 app.js 의 `isCurrent` 와 같은 규칙이다. */
export function isCurrent(e: Event, today: string): boolean {
  return !e.endDate || e.endDate >= today
}

export function filterEvents(
  events: Event[],
  { area, type, search, today }:
  { area: Area; type: ContentType; search: string; today: string },
): Event[] {
  const q = search.trim().toLowerCase()
  return events.filter((e) => {
    if (!isCurrent(e, today)) return false
    if (eventArea(e) !== area) return false
    if (type !== '전체' && e.type !== type) return false
    if (!q) return true
    return [e.title, e.venue, e.address, e.genre, e.summary, e.recommendation]
      .some((v) => (v ?? '').toLowerCase().includes(q))
  })
}
