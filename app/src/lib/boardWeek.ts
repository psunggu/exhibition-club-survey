/**
 * 「이번 주 전시 소식」 — 관람 정보 화면 맨 위에 접지 않고 보여 주는 두 묶음 (2026-11-23, 운영자 요청).
 *
 *   · 새로 올림  — 지난 7일 안에 보드에 들어온 전시(`created_at`)
 *   · 곧 끝남    — 오늘부터 7일 안에 끝나는 전시(`end_date`)
 *
 * 톡방에 주간 소식 글로 올리던 내용이다. 「곧 끝남」 은 추천 순위에서 빠져 있어(끝나기 일주일 전부터
 * 순위를 주지 않는다 — /rank) 목록에서는 안 보인다. 여기서 눌러야 찾을 수 있다.
 *
 * 고른 지역의 것만 싣는다 — 아래 목록과 같은 지역을 말해야 한다.
 * `today` 를 인자로 받는다. 함수 안에서 시계를 읽지 않는다(검사가 시계를 묶는다).
 */
import { eventArea, isCurrent, type Area, type Event } from './events'

/** 묶음마다 바로 보여 주는 줄 수. 넘치면 「외 N건」. */
export const WEEK_SHOWN = 3

export type WeekItem = { event: Event; when: string }

/**
 * 좁은 줄에 실을 이름 — 제목에 《…》 가 있으면 그 안의 전시 이름만.
 * 「서울시립 서서울미술관 뉴미디어 국제전 《셰자드 다우드: 미래의 기억》」 은 한 줄에 다 못 실어
 * 정작 전시 이름이 잘렸다. 검색은 온전한 제목으로 한다.
 */
export const weekName = (title: string): string => /《[^》]+》/.exec(title)?.[0] ?? title

const DAY = 86_400_000
const shift = (iso: string, days: number): string =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10)
const md = (iso: string): string => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`
/** `created_at` 은 UTC 시각이다 — 서울 날짜로 바꿔 견준다(밤 9시 뒤에 넣은 것이 하루 밀리지 않게). */
const seoulDay = (ts: string): string => {
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d)
}

export function boardWeek(
  events: readonly Event[], area: Area, today: string, visited: ReadonlySet<string>,
): { added: WeekItem[]; ending: WeekItem[] } {
  const pool = events.filter((e) =>
    e.type === '전시' && isCurrent(e, today) && eventArea(e) === area && !visited.has(e.id))
  const since = shift(today, -6)
  const until = shift(today, 7)
  const byStart = (a: Event, b: Event) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999')
  const byEnd = (a: Event, b: Event) => (a.endDate ?? '9999').localeCompare(b.endDate ?? '9999')
  const ending = pool.filter((e) => e.endDate !== null && e.endDate <= until).sort(byEnd)
    .map((event) => ({ event, when: event.endDate === today ? '오늘까지' : `${md(event.endDate as string)}까지` }))
  const endingIds = new Set(ending.map((x) => x.event.id))
  // 막 올렸는데 곧 끝나는 것은 「곧 끝남」 에만 — 같은 전시를 두 번 싣지 않는다
  const added = pool.filter((e) => e.createdAt !== null && seoulDay(e.createdAt) >= since && !endingIds.has(e.id)).sort(byStart)
    .map((event) => ({ event, when: event.startDate && event.startDate > today ? `${md(event.startDate)} 개막` : '진행 중' }))
  return { added, ending }
}
