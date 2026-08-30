/**
 * 보드 소식 — 운영자가 올리고·고치고·지운다.
 *
 * ── 읽기와 쓰기가 다른 길로 간다 ────────────────────────────
 * **읽기**는 `public.events` 를 그대로 select 한다. anon 에게 열려 있는 표라
 * 보드와 운영자 화면이 같은 길을 쓴다. 읽기에 암호를 씌워 봐야 같은 행을
 * 누구나 REST 로 읽을 수 있으니, 자물쇠가 있는 척만 하게 된다.
 *
 * **쓰기**는 security definer 함수를 거친다. events 에는 쓰기 권한도 쓰기 정책도
 * 없고(validate-supabase-readonly.mjs 가 금지로 검사한다), 브라우저가 든 것은
 * anon 키뿐이다. 진짜 자물쇠는 함수 안의 암호 확인이다 — 화면을 우회해도 막힌다.
 *
 * 소식이 왜 별도 표가 아니라 events 의 한 행인지는
 * supabase/migrations/202608300003a_culture_news_row.sql 머리말에 적었다.
 */

import { rpc, SurveyUnavailable } from './survey'
import { isCurrent, type Event } from './events'

export type News = {
  id: string
  title: string
  url: string
  genre: string | null
  venue: string | null
  summary: string | null
  startDate: string | null
  endDate: string | null
}

/** 운영자 화면이 채우는 칸. 저장할 때 그대로 서버로 간다. */
export type NewsDraft = {
  id: string | null
  title: string
  url: string
  genre: string
  venue: string
  summary: string
  days: number
}

/** 고르는 갈래. 색이 아니라 **글자**가 갈래를 말한다 (AGENTS.md). */
export const NEWS_KINDS = ['영상 · 유튜브', '영상', '기사', '소식'] as const

/** 처음 여는 빈 칸. 기본 30일 — 한 달이면 대개 다음 소식으로 갈린다. */
export const emptyNews = (): NewsDraft => ({
  id: null, title: '', url: '', genre: NEWS_KINDS[0], venue: '', summary: '', days: 30,
})

const toNews = (e: Event): News => ({
  id: e.id,
  title: e.title,
  url: e.mainUrl ?? e.infoUrl ?? '',
  genre: e.genre,
  venue: e.venue,
  summary: e.summary,
  startDate: e.startDate,
  endDate: e.endDate,
})

/**
 * 보드에 지금 뜨는 소식 하나를 고른다.
 *
 * **기간이 안 지난 것 중 가장 최근에 올린 것.** 예전에는 events 의 전체 정렬
 * (recommended_rank → start_date 오름차순)에 기대어 첫 하나를 집었는데,
 * 그러면 소식이 둘일 때 **가장 오래된 것**이 뜬다. 새 소식을 올렸는데 옛것이
 * 그대로 있는 것은 고장으로 보이지 않아서 더 나쁘다.
 */
export function pickNews(events: Event[], today: string): Event | null {
  const live = events.filter((e) => e.type === '소식' && isCurrent(e, today))
  if (!live.length) return null
  return [...live].sort((a, b) =>
    (b.startDate ?? '').localeCompare(a.startDate ?? '')
    || b.id.localeCompare(a.id))[0] ?? null
}

/** 지난 것까지 전부. 운영자는 치울 것을 봐야 하므로 내리지 않는다. */
export function allNews(events: Event[]): News[] {
  return events
    .filter((e) => e.type === '소식')
    .map(toNews)
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
}

export const newsSave = (pw: string, d: NewsDraft, signal?: AbortSignal) =>
  rpc<string>('news_admin_save', {
    p_password: pw,
    p_payload: {
      id: d.id,
      title: d.title.trim(),
      url: d.url.trim(),
      genre: d.genre.trim(),
      venue: d.venue.trim(),
      summary: d.summary.trim(),
      days: d.days,
    },
  }, signal)

export const newsDelete = (pw: string, id: string, signal?: AbortSignal) =>
  rpc<null>('news_admin_delete', { p_password: pw, p_news: id }, signal)

export { SurveyUnavailable as NewsUnavailable }
