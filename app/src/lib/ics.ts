/**
 * ics.ts — `meetups.ts` 를 휴대폰 달력이 구독할 수 있는 iCalendar 문서로 만든다.
 *
 * 빌드 때 `vite.config.ts` 의 calendarFeed 플러그인이 이것을 불러 `club-calendar.ics` 를 낸다.
 * 회원은 달력 화면의 링크 하나로 구독하고, 그 뒤로 새 모임은 저절로 들어간다.
 *
 * 규칙
 *   · `MEETUPS` 만 싣는다. `TENTATIVE`(날짜 미정)는 넣지 않는다 — 정해지지 않은 것을
 *     달력에 넣으면 정해진 것처럼 보인다 (AGENTS.md 「일정」).
 *   · `dead`(예매 마감일 같은 줄)는 모임이 아니라 뺀다.
 *   · 시각을 못 읽으면 종일 일정으로 둔다. 틀린 시각보다 낫다.
 *   · 회원 이름은 자료에 없고, 여기서도 만들지 않는다.
 *
 * 순수 함수다 — `new Date()` 를 안에서 부르지 않는다 (검사가 시계를 고정한다).
 */

import type { Meetup } from '../data/meetups'

export const CALENDAR_NAME = '41교구 전시·박물관 동아리'
const UID_DOMAIN = 'exhibition-club-survey.psunggu.github.io'
const DEFAULT_HOURS = 2

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * '오후 4시' · '오후 12:30' · '오전 10시' · '16:50 집결 · …' · '오후 2시 50분 집결' → 시작 시각.
 * '3부 예배 후' · '개별 관람' 처럼 시각이 없으면 null.
 * 첫 번째로 나오는 시각만 쓴다 — 집결 시각이 관람 시각보다 앞에 적히는 관행이라 그것이 시작이다.
 */
export function parseStartTime(time: string): { h: number; m: number } | null {
  const m = /(?:(오전|오후)\s*(\d{1,2})(?::(\d{2})|시\s*(\d{1,2})\s*분|시)?)|(?:(?:^|[^\d:])(\d{1,2}):(\d{2}))/.exec(time)
  if (!m) return null
  let h: number
  let min: number
  if (m[2] !== undefined) {
    h = Number(m[2])
    min = Number(m[3] ?? m[4] ?? 0)
    if (m[1] === '오후' && h < 12) h += 12
    if (m[1] === '오전' && h === 12) h = 0
  } else {
    h = Number(m[5])
    min = Number(m[6])
  }
  if (h > 23 || min > 59) return null
  return { h, m: min }
}

const escapeText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** RFC 5545 3.1 — 한 줄은 75옥텟까지. 넘치면 다음 줄을 공백 하나로 시작해 잇는다. */
function fold(line: string): string[] {
  const enc = new TextEncoder()
  const out: string[] = []
  let cur = ''
  for (const ch of line) {
    const next = cur + ch
    const limit = out.length === 0 ? 75 : 74
    if (enc.encode(next).length > limit) {
      out.push(cur)
      cur = ch
    } else {
      cur = next
    }
  }
  out.push(cur)
  return out.map((l, i) => (i === 0 ? l : ` ${l}`))
}

const stampUtc = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`

const nextDay = (iso: string) => {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + 1))
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}`
}

export type IcsOptions = {
  /** DTSTAMP 에 쓸 시각. 빌드 시각을 넘긴다 */
  now: Date
  /** 일정 화면 주소. DESCRIPTION 끝에 붙는다 */
  siteUrl: string
}

export function buildIcs(meetups: Meetup[], opts: IcsOptions): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//41교구 전시·박물관 동아리//exhibition-club-survey//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(CALENDAR_NAME)}`,
    'X-WR-TIMEZONE:Asia/Seoul',
    // 한국은 서머타임이 없다 — 표준시 하나면 된다
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Seoul',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0900',
    'TZOFFSETTO:+0900',
    'TZNAME:KST',
    'END:STANDARD',
    'END:VTIMEZONE',
  ]
  const stamp = stampUtc(opts.now)

  for (const m of meetups) {
    if (m.kind === 'dead' || m.kind === 'tent') continue
    const ymd = m.date.replace(/-/g, '')
    const t = parseStartTime(m.time)
    const desc = [m.time, m.description, m.note, m.infoUrl ? `안내: ${m.infoUrl}` : '', `일정 화면: ${opts.siteUrl}`]
      .filter(Boolean).join('\n')

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${m.id}@${UID_DOMAIN}`)
    lines.push(`DTSTAMP:${stamp}`)
    if (t) {
      const endH = t.h + DEFAULT_HOURS
      const end = endH <= 23 ? `${ymd}T${pad(endH)}${pad(t.m)}00` : `${nextDay(m.date)}T${pad(endH - 24)}${pad(t.m)}00`
      lines.push(`DTSTART;TZID=Asia/Seoul:${ymd}T${pad(t.h)}${pad(t.m)}00`)
      lines.push(`DTEND;TZID=Asia/Seoul:${end}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${ymd}`)
      lines.push(`DTEND;VALUE=DATE:${nextDay(m.date)}`)
    }
    lines.push(`SUMMARY:${escapeText(m.title)}`)
    if (m.venue) lines.push(`LOCATION:${escapeText(m.venue)}`)
    lines.push(`DESCRIPTION:${escapeText(desc)}`)
    if (m.infoUrl) lines.push(`URL:${m.infoUrl}`)
    lines.push(`CATEGORIES:${escapeText(m.regular ? '정기관람' : '수시 모임')}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.flatMap(fold).join('\r\n') + '\r\n'
}
