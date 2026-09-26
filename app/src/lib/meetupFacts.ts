import type { Meetup } from '../data/meetups'

/**
 * 「다가오는 확정 모임」 카드의 줄 — 언제 · 어디 · 모이는 곳 · 꼭 확인.
 *
 * 운영자 요청(2026-09-26): 「간결하게, 가독성 있게, 핵심만」. 카드는 이름표 줄만 싣고,
 * 시간 · 주소 · 설명 · 운영진 확인 **전문은 「자세히 보기」 가 여는 팝업**이 그대로 보여 준다.
 * 그래서 여기서 무엇을 덜어도 잃는 정보는 없다.
 *
 * 새 모임은 필수 필드만 적는다(AGENTS.md). 그래서 줄은 **있는 자료에서 짓는다** —
 *   언제      time 에서 「… 집결」 이 아닌 첫 토막(나머지는 작은 둘째 줄)
 *   어디      venue 의 첫 토막(주소는 팝업에)
 *   모이는 곳 선택 필드 meet, 없으면 time 의 「… 집결」 토막
 *   꼭 확인   선택 필드 must, 없으면 note 의 첫 문장
 *
 * `new Date()` 를 부르지 않는다. lookbehind 정규식도 쓰지 않는다 — 옛 iOS 카카오톡
 * 인앱 브라우저는 그 문법에서 번들 전체가 멈춘다.
 */
export type MeetupFacts = { when: string; whenSub: string; where: string; meet: string; must: string }

const SEP = ' · '
// 「오후 2시 50분」 · 「1시 50분」 · 「14:50」
const TIME = '(?:(?:(?:오전|오후)\\s*)?\\d{1,2}시(?:\\s*\\d{1,2}분)?|\\d{1,2}:\\d{2})'
const MEET_RE = new RegExp(`^(.+?)\\s+(${TIME})\\s*집결$`)
/** 장소 자리에 잡힌 것이 시각 조각뿐인가(「오후 1시 50분 집결」 의 「오후」) — 그럴 때만 장소로 안 본다 */
const ONLY_TIME = new RegExp(`^(?:오전|오후|${TIME})$`)
// 숫자 바로 뒤의 마침표(「2026. 10. 1.」 · 「3.5km」)는 문장 끝으로 보지 않는다 — lookahead 만 쓴다
const SENTENCE_END = /[^\d\s][.!?](?=\s|$)/

export function meetupFacts(m: Meetup): MeetupFacts {
  const parts = (m.time ?? '').split(SEP).map((s) => s.trim()).filter(Boolean)
  const rest = parts.filter((p) => !p.includes('집결'))
  return {
    when: rest[0] ?? '확인 중',
    whenSub: rest.slice(1).join(SEP),
    where: ((m.venue ?? '').split(SEP)[0] ?? '').trim() || '확인 중',
    meet: m.meet?.trim() || meetLine(parts.find((p) => p.includes('집결')) ?? ''),
    must: m.must?.trim() || firstSentence(m.note),
  }
}

/** 「시청역 1번 출구 오후 2시 50분 집결」 → 「시청역 1번 출구 · 오후 2시 50분」 */
function meetLine(part: string): string {
  if (!part) return ''
  const [, spot = '', at = ''] = MEET_RE.exec(part) ?? []
  if (spot && !ONLY_TIME.test(spot)) return `${spot}${SEP}${at}`
  const place = part.replace(/\s*집결$/, '')
  // 「15:50 집결」 · 「오후 1시 50분 집결」 처럼 장소가 없으면 적힌 그대로 둔다
  return /^(\d|오[전후])/.test(place) ? part : place
}

function firstSentence(note: string): string {
  const t = (note ?? '').trim()
  const hit = SENTENCE_END.exec(t)
  return hit ? t.slice(0, hit.index + hit[0].length) : t
}
