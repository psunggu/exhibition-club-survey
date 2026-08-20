/**
 * 설문 읽고 쓰기.
 *
 * ── 왜 응답만 함수를 거치나 ─────────────────────────────────
 * 설문과 후보는 표에서 그대로 읽는다 (공개해도 되는 내용).
 * 응답은 **표를 직접 못 읽는다** — 이름과 구역번호가 들어가는데
 * 이 사이트의 anon 키는 공개 저장소에 있어서, 표를 열어 두면 누구나
 * "누가 무엇에 투표했는지" 명단을 통째로 내려받는다.
 *
 * 그래서 응답 관련은 전부 RPC 를 거치고, 각 함수는 꼭 필요한 것만 돌려준다.
 * (supabase/migrations/202608200001b_survey_functions.sql)
 */

export type SurveyLinkKind = 'official' | 'video' | 'article' | 'map' | 'booking'

export type SurveyLink = {
  kind: SurveyLinkKind
  label: string
  url: string
}

export type SurveyOption = {
  id: string
  position: number
  title: string
  period: string | null
  venue: string | null
  hours: string | null
  price: string | null
  note: string | null
  links: SurveyLink[]
}

export type Survey = {
  id: string
  title: string
  intro: string | null
  multiChoice: boolean
  opensAt: string
  closesAt: string
  createdBy: string
  resultsVisible: 'always' | 'after_close' | 'admin'
  showNames: 'none' | 'participants'
  hideAfterDays: number | null
  options: SurveyOption[]
}

export class SurveyUnavailable extends Error {
  constructor(readonly reason: string) {
    super(reason)
    this.name = 'SurveyUnavailable'
  }
}

type Config = { supabaseUrl?: string; supabaseAnonKey?: string }
const readConfig = (): Config =>
  (globalThis as unknown as { CLUB_CONFIG?: Config }).CLUB_CONFIG ?? {}

const base = () => {
  const { supabaseUrl, supabaseAnonKey } = readConfig()
  if (!supabaseUrl || !supabaseAnonKey)
    throw new SurveyUnavailable('설정(CLUB_CONFIG)이 없다')
  return {
    url: supabaseUrl.replace(/\/$/, ''),
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
  }
}

const str = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? null : s
}

const LINK_KINDS = new Set<SurveyLinkKind>(['official', 'video', 'article', 'map', 'booking'])

/**
 * 링크는 jsonb 라 무엇이든 들어올 수 있다. **모양이 어긋난 것은 버린다.**
 * 화면에 `undefined` 가 뜨거나 `javascript:` 가 링크로 나가는 쪽이
 * 하나 빠지는 것보다 나쁘다.
 */
function parseLinks(v: unknown): SurveyLink[] {
  if (!Array.isArray(v)) return []
  const out: SurveyLink[] = []
  for (const raw of v) {
    if (!raw || typeof raw !== 'object') continue
    const l = raw as Record<string, unknown>
    const kind = l.kind as SurveyLinkKind
    const label = str(l.label)
    const url = str(l.url)
    if (!LINK_KINDS.has(kind) || !label || !url) continue
    if (!/^https:\/\//i.test(url)) continue
    out.push({ kind, label, url })
  }
  return out
}

type OptionRow = Record<string, unknown>
type SurveyRow = Record<string, unknown> & { survey_options?: OptionRow[] }

function toOption(r: OptionRow): SurveyOption {
  return {
    id: String(r.id ?? ''),
    position: typeof r.position === 'number' ? r.position : 0,
    title: str(r.title) ?? '(제목 없음)',
    period: str(r.period),
    venue: str(r.venue),
    hours: str(r.hours),
    price: str(r.price),
    note: str(r.note),
    links: parseLinks(r.links),
  }
}

function toSurvey(r: SurveyRow): Survey {
  const rv = str(r.results_visible)
  const sn = str(r.show_names)
  return {
    id: String(r.id ?? ''),
    title: str(r.title) ?? '(제목 없음)',
    intro: str(r.intro),
    multiChoice: r.multi_choice !== false,
    opensAt: str(r.opens_at) ?? '',
    closesAt: str(r.closes_at) ?? '',
    createdBy: str(r.created_by) ?? '',
    resultsVisible: rv === 'always' || rv === 'admin' ? rv : 'after_close',
    showNames: sn === 'participants' ? 'participants' : 'none',
    hideAfterDays: typeof r.hide_after_days === 'number' ? r.hide_after_days : null,
    options: (r.survey_options ?? []).map(toOption).sort((a, b) => a.position - b.position),
  }
}

/**
 * 설문과 후보를 한 번에 읽는다.
 *
 * **표가 아직 없어도 화면 전체가 죽지 않아야 한다.** 마이그레이션을 적용하기
 * 전에는 42P01(relation does not exist)이 오는데, 그때는 "설문 없음"으로 본다 —
 * 보드와 일정은 설문과 무관하게 돌아야 하기 때문이다.
 * 그 밖의 실패는 던진다. 조용히 비우면 고장이 안 보인다.
 */
export async function fetchSurveys(signal?: AbortSignal): Promise<Survey[]> {
  const { url, headers } = base()
  const q = 'select=*,survey_options(*)&deleted_at=is.null&order=closes_at.desc'
  const res = await fetch(`${url}/rest/v1/surveys?${q}`, { signal, headers })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    // 아직 표를 만들기 전 — 설문 기능만 조용히 쉰다
    if (res.status === 404 || /42P01|does not exist/i.test(body)) return []
    throw new SurveyUnavailable(`Supabase 응답 ${res.status}`)
  }

  const rows = (await res.json()) as SurveyRow[]
  if (!Array.isArray(rows)) throw new SurveyUnavailable('응답이 배열이 아니다')
  return rows.map(toSurvey)
}

/** RPC 한 번. 실패하면 서버가 준 메시지를 그대로 올린다 — 사람이 읽을 문장이다. */
async function rpc<T>(name: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const { url, headers } = base()
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST', headers, signal, body: JSON.stringify(body),
  })
  if (!res.ok) {
    let message = `Supabase 응답 ${res.status}`
    try {
      const j = (await res.json()) as { message?: string }
      if (j?.message) message = j.message
    } catch { /* 본문이 JSON 이 아니면 상태 코드만 쓴다 */ }
    throw new SurveyUnavailable(message)
  }
  return (await res.json()) as T
}

export const submitResponse = (
  surveyId: string, zone: string, name: string, optionIds: string[], signal?: AbortSignal,
) => rpc<null>('survey_submit',
  { p_survey: surveyId, p_zone: zone, p_name: name, p_options: optionIds }, signal)

export const fetchMyChoices = async (
  surveyId: string, zone: string, name: string, signal?: AbortSignal,
): Promise<string[]> => {
  const rows = await rpc<{ option_id: string }[]>('survey_my_choices',
    { p_survey: surveyId, p_zone: zone, p_name: name }, signal)
  return Array.isArray(rows) ? rows.map((r) => r.option_id) : []
}

/** 후보별 표 수. 아직 볼 때가 아니면 빈 map 이 온다 — 서버가 정한다. */
export const fetchTally = async (
  surveyId: string, signal?: AbortSignal,
): Promise<Map<string, number>> => {
  const rows = await rpc<{ option_id: string; votes: number }[]>('survey_tally',
    { p_survey: surveyId }, signal)
  const m = new Map<string, number>()
  if (Array.isArray(rows)) for (const r of rows) m.set(r.option_id, Number(r.votes) || 0)
  return m
}

export const fetchResponseCount = (surveyId: string, signal?: AbortSignal) =>
  rpc<number>('survey_response_count', { p_survey: surveyId }, signal)

/* ── 시간 판정 ─────────────────────────────────────────────
   서버가 진짜 판정을 하지만(함수 안에서 막는다), 화면도 알아야
   "마감됨"을 보여 주고 체크박스를 잠글 수 있다. */

export const isOpen = (s: Survey, now = new Date()): boolean => {
  const o = Date.parse(s.opensAt)
  const c = Date.parse(s.closesAt)
  if (Number.isNaN(o) || Number.isNaN(c)) return false
  const t = now.getTime()
  return t >= o && t <= c
}

/** 마감 뒤 hideAfterDays 가 지나면 목록에서 내린다. null 이면 계속 남는다. */
export const isVisible = (s: Survey, now = new Date()): boolean => {
  if (s.hideAfterDays === null) return true
  const c = Date.parse(s.closesAt)
  if (Number.isNaN(c)) return true
  return now.getTime() <= c + s.hideAfterDays * 24 * 60 * 60 * 1000
}

/** `8월 21일 (금) 오전 8시` — 옛 화면의 날짜 말투에 맞춘다. */
export function koDeadline(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'long', day: 'numeric',
    weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
  }).formatToParts(d)
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? ''
  const min = g('minute') === '00' ? '' : ` ${Number(g('minute'))}분`
  return `${g('month')} ${g('day')}일 (${g('weekday')}) ${g('dayPeriod')} ${g('hour')}시${min}`
}
