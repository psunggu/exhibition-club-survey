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
  if (isOpen(s)) return false
  const m = meetupOfSurvey(s.id, meetups)
  if (!m) return false
  // 'dead' 는 모임이 아니라 예매 마감일 같은 줄이다. 그 날짜는 영영 「다녀온 날」이 아니다.
  if (m.kind === 'dead') return false
  return m.date < today
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
