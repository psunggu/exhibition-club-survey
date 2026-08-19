/**
 * 달력 격자와 "오늘" 판정 (R-01-05).
 *
 * 옛 notice.html 은 달마다 42칸을 **손으로 써 넣었다.** 달이 바뀌면 사람이 고쳐야 했고,
 * 실제로 그게 매달 하는 일 중 하나였다. 여기서는 날짜에서 격자를 만든다.
 *
 * **시간대를 KST 로 고정한다.** 옛 코드는 두 곳이 어긋나 있었다 —
 * 완료 모임 숨김은 `koreanTodayDayNumber()` 로 KST 를 썼는데,
 * 달력의 "오늘" 마커는 `new Date()` 로 브라우저 로컬 시간을 썼다.
 * 한국에서 열면 같지만 여행 중에 열면 다른 날에 표시가 붙는다.
 * 의도는 분명히 KST 쪽이므로(그쪽만 공들여 만들어 뒀다) 둘 다 KST 로 맞췄다.
 */

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * `2026-08-19` → 1970-01-01 부터의 일수. 시간대 계산 없이 날짜만 비교하려는 것이다.
 *
 * **되짚어 검산한다.** `Date.UTC` 는 `2026-13-40` 같은 값을 조용히 굴려서
 * 그럴듯한 날짜로 바꿔 놓는다. 형식만 맞으면 통과시키면 없는 날짜가 숫자가 된다 —
 * 원본 `isoDateToDayNumber` 도 같은 이유로 검산한다.
 */
export function isoToDayNumber(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''))
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const ts = Date.UTC(year, month - 1, day)
  const back = new Date(ts)
  if (back.getUTCFullYear() !== year
    || back.getUTCMonth() !== month - 1
    || back.getUTCDate() !== day) return null
  return Math.floor(ts / DAY_MS)
}

/** 서울 기준 오늘. 브라우저 시간대와 무관하게 같은 날을 가리킨다. */
export function seoulToday(now: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now)
    const v: Record<string, string> = {}
    for (const p of parts) if (p.type !== 'literal') v[p.type] = p.value
    return `${v.year}-${v.month}-${v.day}`
  } catch {
    // Intl 이 없거나 시간대를 모르면 로컬로 떨어진다. 옛 코드와 같은 대비다.
    const p = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
  }
}

/**
 * 완료된 모임을 며칠까지 목록에 남길지.
 * 옛 `isRecentCompletedDate` 와 같은 규칙 — 오늘 이전이고 N일 안이면 보인다.
 */
export function isRecentlyCompleted(date: string, today: string, visibleDays: number): boolean {
  const d = isoToDayNumber(date)
  const t = isoToDayNumber(today)
  if (d === null || t === null) return false
  const elapsed = t - d
  return elapsed >= 0 && elapsed < visibleDays
}

export type Cell = {
  /** 그 달에 속하지 않는 앞뒤 빈 칸 */
  filler: boolean
  day: number
  /** ISO 날짜. filler 면 빈 문자열 */
  date: string
}

/**
 * 한 달 격자. 일요일 시작, 그 달의 날짜만 채우고 앞은 빈 칸으로 민다.
 * 옛 마크업이 `<div class="cell off"></div>` 를 앞에 깔던 것과 같은 모양이다.
 */
export function monthGrid(year: number, month: number): Cell[] {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const lead = first.getUTCDay()                              // 0 = 일요일
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const p = (n: number) => String(n).padStart(2, '0')

  const cells: Cell[] = []
  for (let i = 0; i < lead; i++) cells.push({ filler: true, day: 0, date: '' })
  for (let d = 1; d <= days; d++)
    cells.push({ filler: false, day: d, date: `${year}-${p(month)}-${p(d)}` })

  // 마지막 주도 7칸을 채운다. 안 채우면 격자 오른쪽 아래가 뚫려
  // 회색 바닥이 드러난다 — 옛 마크업은 8월 42칸 · 7월 35칸으로
  // 언제나 7의 배수를 손으로 채워 두었다.
  while (cells.length % 7 !== 0) cells.push({ filler: true, day: 0, date: '' })
  return cells
}

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const
