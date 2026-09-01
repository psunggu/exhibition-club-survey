/**
 * surveyHistory.ts — **어떤 설문이 「지난 설문」인가**를 정한다.
 *
 * ── 왜 날짜만 보나 ─────────────────────────────────────────
 * 이 앱에는 「모임이 끝났다」를 말하는 값이 셋인데 서로 어긋난다.
 *
 *   날짜가 지났나        m.date < 오늘        자동
 *   kind 가 done 인가    손으로 적는 값       사람
 *   completedRow 가 있나 손으로 적는 값       사람
 *
 * 2026-08-22 서울역사박물관 모임은 다음 날인 8/23 에도 kind 가 'conf' 였고
 * completedRow 도 비어 있었다. 사람 손을 기다리는 값에 화면 동작을 걸면
 * 화면이 하루씩 거짓말을 한다. **자동으로 옳아지는 것은 날짜 비교뿐이다.**
 *
 * ── 왜 추측하지 않나 ───────────────────────────────────────
 * 설문 제목으로 모임을 찾는 방법도, 마감일 뒤 첫 모임을 집는 방법도 재 봤다.
 * 지금 자료에서는 둘 다 맞는 답을 내지만 우연이다.
 *   · 제목 맞추기 — 「저녁식사」 는 8/16 영화 모임에도, 「장소」 는 7/26 모임에도 걸린다.
 *     이번에 맞은 이유는 「서울역사박물관」 이라는 드문 이름이 우연히 제목에 있어서다.
 *   · 마감 뒤 첫 모임 — 7/31 은 모임이 아니라 예매 마감일(kind 'dead')인데 그것을 집는다.
 *     한 날짜에 모임이 둘인 날(7/29)도 있어 배열 순서가 답을 정해 버린다.
 *
 * 그래서 **이어진 모임이 없으면 지난 설문으로 보지 않는다.** 틀린 짝을 지어
 * 「8월 22일 모임 끝남」 이라고 적느니, 접지 않고 그대로 두는 편이 낫다.
 * 연결은 app/src/data/meetups.ts 의 `surveyIds` 가 사람 손으로 적는다.
 */

import { MEETUPS, type Meetup } from '../data/meetups'
import { seoulToday } from './calendar'
import { isOpen, type Survey } from './survey'

/** 이 설문을 위해 열린 모임. 없으면 null — 지어내지 않는다. */
export function meetupOfSurvey(surveyId: string, meetups: Meetup[] = MEETUPS): Meetup | null {
  return meetups.find((m) => m.surveyIds?.includes(surveyId)) ?? null
}

/**
 * 「집계도 끝났고 모임도 지났나」 — 둘 다 참일 때만 지난 설문이다.
 *
 * 마감됐지만 모임이 아직이면 **접지 않는다.** 그때가 오히려 이 화면이
 * 가장 필요한 때다 — 어디로 가기로 했는지, 몇 시에 만나는지를 보러 온다.
 */
export function isPastSurvey(
  s: Survey,
  today: string = seoulToday(),
  meetups: Meetup[] = MEETUPS,
): boolean {
  return pastCore(s.id, !isOpen(s), today, meetups)
}

/**
 * 판정의 알맹이. **회원 화면과 운영자 화면이 이것 하나를 나눠 쓴다.**
 *
 * 운영자 화면은 목록을 `survey_admin_list` 로 받는데, 그 답에는 `opens_at` 이 없어
 * `isOpen` 을 부를 수 없다. 그렇다고 운영자 화면에 「마감이면 지난 것」 같은
 * **두 번째 규칙**을 두면, 언젠가 두 화면이 같은 설문을 두고 다르게 말한다.
 * 이 저장소가 이미 겪은 실패다 — 달력과 설문 화면이 하루 동안 어긋났다.
 * 그래서 「닫혔나」 만 밖에서 받고 나머지 판단은 여기 한 곳에 둔다.
 */
function pastCore(
  id: string,
  closed: boolean,
  today: string,
  meetups: Meetup[],
): boolean {
  if (!closed) return false
  const m = meetupOfSurvey(id, meetups)
  if (!m) return false
  // 'dead' 는 모임이 아니라 예매 마감일 같은 줄이다. 그 날짜는 영영 「다녀온 날」이 아니다.
  if (m.kind === 'dead') return false
  return m.date < today
}

/**
 * 운영자 목록의 한 줄이 「지난 관람」 인가.
 *
 * 받는 것이 `Survey` 가 아니라 **id 와 마감뿐**이라 따로 둔다.
 * 판단은 위 pastCore 가 하므로 회원 화면과 답이 갈리지 않는다.
 */
export function isPastAdminSurvey(
  s: { id: string; closesAt: string },
  today: string = seoulToday(),
  meetups: Meetup[] = MEETUPS,
  now: Date = new Date(),
): boolean {
  const c = Date.parse(s.closesAt)
  // 마감을 못 읽으면 **지난 것으로 보지 않는다.** 접어 버리면 운영자가
  // 고치러 들어올 자리가 사라진다 — 모르면 남기는 쪽으로 넘어진다.
  if (Number.isNaN(c)) return false
  return pastCore(s.id, now.getTime() > c, today, meetups)
}

/** 운영자 목록을 「지금 것」과 「지난 관람」으로 가른다. 순서는 그대로 둔다. */
export function splitAdminByHistory<T extends { id: string; closesAt: string }>(
  list: T[],
  today: string = seoulToday(),
  meetups: Meetup[] = MEETUPS,
  now: Date = new Date(),
): { live: T[]; past: T[] } {
  const live: T[] = []
  const past: T[] = []
  for (const s of list) (isPastAdminSurvey(s, today, meetups, now) ? past : live).push(s)
  past.sort((a, b) => (a.closesAt < b.closesAt ? 1 : a.closesAt > b.closesAt ? -1 : 0))
  return { live, past }
}

/** 설문 목록을 「지금 볼 것」과 「지난 것」으로 가른다. 순서는 그대로 둔다. */
export function splitByHistory(
  list: Survey[],
  today: string = seoulToday(),
  meetups: Meetup[] = MEETUPS,
): { live: Survey[]; past: Survey[] } {
  const live: Survey[] = []
  const past: Survey[] = []
  for (const s of list) (isPastSurvey(s, today, meetups) ? past : live).push(s)
  // 지난 것은 **최근에 끝난 것부터**. 옛날 것을 먼저 보여 줄 이유가 없다.
  past.sort((a, b) => (a.closesAt < b.closesAt ? 1 : a.closesAt > b.closesAt ? -1 : 0))
  return { live, past }
}
