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
 *
 * ── 예외가 하나 있다 (2026-08-27) ───────────────────────────
 * **옮겨 온 톡방 투표의 투표자 이름**(survey_options.imported_voters)은 공개 표에 있다.
 * 위 원칙을 어기는 것이 아니라, **일부러 공개하기로 정한 것**이다 —
 * 운영자가 「톡방과 똑같이 보여 줘」 라고 했고, 그 화면은 회원 누구나 본다.
 *
 * 그래서 위 문단의 「누가 무엇에 투표했는지」 가 이 한 갈래에서는 공개된다.
 * 대신 아무나 넣을 수 없게 두 겹을 걸었다.
 *   · DB 방아쇠 — show_names 를 켠 설문에만 담을 수 있다 (202608270001a)
 *   · 화면 — show_names 가 꺼져 있으면 담겨 있어도 안 그린다 (Survey.tsx)
 *
 * **사이트에서 받은 응답의 이름은 여전히 어디에도 안 남는다** (2026-08-24 익명화).
 * 두 가지를 섞어 생각하면 안 된다.
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
  /**
   * 옮겨 온 투표(톡방)에서 이 후보를 고른 사람들. 톡방 화면 글자 그대로다.
   *
   * 사이트에서 직접 받은 설문은 **늘 비어 있다** — 2026-08-24 부터 이름을 저장하지 않는다.
   * 그러니 이 값이 차 있다는 것은 곧 「톡방 투표를 옮겨 온 것」 이라는 뜻이다.
   * 옛 설문이나 마이그레이션 적용 전에도 비어 있다 (links 와 같은 이유로 빈 배열이다).
   */
  importedVoters: string[]
}

/**
 * **DB 에 저장되는 갈래.** `surveys_category_check`(202608290001a) 와 같아야 한다.
 * 이 목록을 늘리려면 제약과 `survey_admin_save` 를 함께 고쳐야 한다.
 */
export type SurveyCategory = 'exhibition' | 'datetime' | 'meal' | 'club' | 'etc'

/**
 * **화면 탭의 갈래.** DB 갈래에 화면에만 있는 `google` 이 하나 더 붙는다.
 *
 * 구글 설문은 구글 폼에서 받은 것을 정리해 보여 주는 자리이지 여기서 투표를
 * 받지 않는다. 그래서 `surveys` 행으로 존재한 적이 없고 DB 도 그 값을 모른다.
 * **두 이름을 하나로 합치지 않는다** — 합치면 「저장할 수 있는 값」 과
 * 「탭에 있는 값」 이 같다고 타입이 말하게 되고, 그건 사실이 아니다.
 */
export type TabCategory = SurveyCategory | 'google'

/**
 * 갈래마다 색과 이름이 다르다. 화면 여러 곳에서 쓰므로 한 곳에 둔다.
 *
 * **저장되는 값(`exhibition`)은 바꾸지 않는다.** 처음엔 「전시 관람 설문」 하나였고
 * 실제로는 장소를 고르는 설문이었다. 이름만 「관람 장소」 로 바꾸고 값은 그대로 둔다 —
 * 값을 바꾸면 이미 쌓인 설문 행을 전부 고쳐야 하고, 하나라도 놓치면
 * 그 설문이 어느 탭에도 안 뜬다.
 *
 * 차례가 곧 탭 차례다. 모임을 정하는 순서(장소 → 날짜 → 식사)를 따르고,
 * 그 뒤에 운영과 기타가 온다.
 */
export const CATEGORY = {
  exhibition: { label: '전시 관람 장소 설문',      short: '관람 장소',  route: '#/survey' },
  datetime:   { label: '전시 관람 일자·시간 설문', short: '일자·시간',  route: '#/survey/datetime' },
  meal:       { label: '관람 후 식사 & Tea 설문',  short: '식사·Tea',   route: '#/survey/meal' },
  club:       { label: '동아리 운영·요청 사항 설문', short: '운영·요청', route: '#/survey/club' },
  google:     { label: '구글 설문 결과',           short: '구글 설문',  route: '#/survey/google' },
  etc:        { label: '기타 설문',                short: '기타',       route: '#/survey/etc' },
} as const

/** 탭에 그릴 차례. `CATEGORY` 의 키 차례와 같게 둔다. */
export const CATEGORY_ORDER: readonly TabCategory[]
  = ['exhibition', 'datetime', 'meal', 'club', 'google', 'etc']

/**
 * **운영자가 설문을 올릴 수 있는 갈래.** 위 목록과 하나가 다르다.
 *
 * `google` 은 화면에만 있는 갈래다 — 구글 폼으로 받아 정리한 결과를 보여 주는
 * 자리이지 여기서 투표를 받지 않는다. DB 의 `surveys_category_check` 도
 * 그 값을 모른다(202608290001a 의 다섯 가지뿐).
 *
 * **두 목록을 하나로 합치지 않는다.** 합치면 운영자 화면에서 고를 수는 있는데
 * 저장에서 서버가 거절하고, 어느 쪽이 막았는지 모를 오류가 뜬다 —
 * 202608290001a 머리말이 「두 곳을 함께 고쳐야 한다」 고 적어 둔 그 사고다.
 * 나중에 이 갈래로도 투표를 받기로 하면 제약과 survey_admin_save 를 함께 늘리고
 * 그때 이 목록을 지운다.
 */
export const POSTABLE_CATEGORY_ORDER: readonly SurveyCategory[]
  = ['exhibition', 'datetime', 'meal', 'club', 'etc']

/**
 * DB 가 준 값을 갈래로 읽는다. **비어 있는 것과 모르는 것을 다르게 다룬다.**
 *
 * · 비어 있음(null·빈 글자) → `exhibition`.
 *   열이 `not null default 'exhibition'` 이라 실제 행은 늘 차 있지만,
 *   열이 생기기 전의 응답이나 갈래를 안 보내는 옛 경로가 여기로 온다.
 *   그때는 DB 기본값과 같은 자리에 두는 것이 맞다.
 *
 * · 모르는 값 → `etc`.
 *   나중에 갈래를 더 만들었을 때, 옛 번들을 쓰는 사람의 화면에서 그 설문이
 *   조용히 전시 탭에 섞이지 않게 한다. 「기타」 에 뜨면 적어도 보이기는 한다.
 *
 * 처음엔 둘을 묶어 전부 `etc` 로 보냈더니 갈래 없는 붙박이 설문이 전시 탭에서
 * 통째로 사라졌다 — validate-survey-ui 가 그걸 잡았다.
 */
export const toCategory = (v: unknown): SurveyCategory => {
  const s = typeof v === 'string' ? v.trim() : ''
  if (s === '') return 'exhibition'
  return (CATEGORY_ORDER as readonly string[]).includes(s) ? (s as SurveyCategory) : 'etc'
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
  category: SurveyCategory
  /**
   * 밖(톡방)에서 진행된 투표를 옮겨 온 설문인가.
   * 그렇다면 여기서는 **응답을 받지 않고 결과만 보여 준다** —
   * 옮겨 온 숫자가 집계를 덮어써서, 여기서 받은 표는 나타나지 않기 때문이다.
   */
  /** 설문 전체에 걸리는 참고 문서 (후보 하나에 붙일 수 없는 것) */
  links: SurveyLink[]
  mirrored: boolean
  /**
   * 누가 보는 설문인가. 회원 화면으로 온 것은 **항상 `members`** 다 —
   * RLS 가 그러지 않은 행을 안 준다. 이 값이 `admins` 일 수 있는 것은
   * 운영자 창구(survey_admin_get)로 불러왔을 때뿐이다.
   */
  audience: 'members' | 'admins'
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

/**
 * 옮겨 온 투표의 투표자 이름을 읽는다 (survey_options.imported_voters, text[]).
 *
 * parseLinks 와 같은 태도다 — **모양이 어긋난 것은 버린다.** 배열이 아니면 빈 배열이라,
 * 컬럼이 없던 때(옛 설문·마이그레이션 적용 전)도 저절로 처리된다.
 *
 * 빈 글자는 걸러 낸다. DB 제약이 막고 있지만(survey_options_voters_nonblank),
 * 화면이 DB 제약을 믿고 빈 칩을 그리게 두지 않는다.
 */
function parseVoters(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map(str).filter((s): s is string => s !== null)
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
    importedVoters: parseVoters(r.imported_voters),
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
    category: toCategory(str(r.category)),
    /**
     * 설문 전체에 걸리는 참고 문서. 후보 하나에 붙일 수 없는 것이 여기 온다.
     * 열이 없던 때의 응답도 읽어야 하므로 없으면 빈 배열이다.
     */
    links: parseLinks(r.links),
    mirrored: r.imported_respondents !== null && r.imported_respondents !== undefined,
    audience: str(r.audience) === 'admins' ? 'admins' : 'members',
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

/** RPC 한 번. 실패하면 서버가 준 메시지를 그대로 올린다 — 사람이 읽을 문장이다.
 *
 *  **내보내는 이유**: 보드 소식(lib/news.ts)도 같은 창구를 쓴다. 베껴 두면 아래
 *  204 빈 본문 처리가 한쪽에만 남는다 — 그 실수는 이미 한 번 라이브에서 터졌다. */
export async function rpc<T>(name: string, body: unknown, signal?: AbortSignal): Promise<T> {
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

  /**
   * **본문이 없을 수 있다.** 아무것도 안 돌려주는 함수(survey_submit)에
   * PostgREST 는 `204 No Content` 를 준다 — 본문 길이 0 이다.
   * 거기에 대고 `res.json()` 을 부르면 던진다.
   *
   * 처음에 그걸 놓쳤다. 가짜 서버가 `null` 이라는 **본문 있는** 답을 주도록
   * 흉내 냈던 탓에 검사는 통과했고, 라이브에서 제출이 실패했다.
   * 그래서 검사기 쪽도 진짜와 같이 204 빈 본문을 주도록 고쳤다.
   */
  const text = await res.text()
  if (!text) return null as T
  return JSON.parse(text) as T
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

/* ── 운영자 ────────────────────────────────────────────────
   암호는 **어디에도 저장하지 않는다.** 화면이 들고 있다가 부를 때마다 보낸다.
   sessionStorage 에 두면 같은 기기를 쓰는 다른 사람이 꺼낼 수 있다. */

export type AdminSurvey = {
  id: string
  title: string
  closesAt: string
  createdBy: string
  multiChoice: boolean
  resultsVisible: string
  showNames: string
  /**
   * 누가 보는 설문인가 — `members` 는 회원 화면, `admins` 는 **운영자 화면에서만.**
   *
   * 이 값으로 화면을 가르지만 **여기가 자물쇠는 아니다.** 번들은 공개라
   * 화면 코드는 누구나 읽고 고칠 수 있다. 진짜로 막는 것은 DB 쪽 넷이다 —
   * RLS 가 행을 안 주고, 회원용 함수 넷이 거절하고, 운영자 함수는 암호를 묻는다
   * (202608300002a).
   */
  audience: 'members' | 'admins'
  optionCount: number
  responseCount: number
}

export type DraftLink = { kind: SurveyLinkKind; label: string; url: string }

export type DraftOption = {
  title: string
  period: string
  venue: string
  hours: string
  price: string
  note: string
  links: DraftLink[]
}

export type Draft = {
  id: string | null
  title: string
  intro: string
  multiChoice: boolean
  days: number
  /**
   * 열 때 이미 마감돼 있었나. **화면에 알려 주려고만 쓴다 — 서버로 보내지 않는다.**
   * 서버는 마감을 늘 `지금 + days` 로 다시 계산하므로, 마감된 설문을 열어
   * 아무것도 안 바꾸고 저장만 눌러도 **다시 열린다.** 그걸 알고 누르게 한다.
   */
  wasClosed: boolean
  createdBy: string
  resultsVisible: 'always' | 'after_close' | 'admin'
  showNames: 'none' | 'participants'
  /**
   * 어느 화면에 올릴 설문인가 — 전시 관람(`#/survey`) · 식사·티타임(`#/survey/meal`).
   *
   * **서버는 진작부터 이 값을 받고 있었다.** 화면이 안 보냈을 뿐이라
   * 관리 화면으로 만든 설문은 전부 `exhibition` 으로 떨어졌고,
   * 식사 설문을 올리는 길이 SQL 밖에 없었다.
   *
   * 갈래를 **늘리는 것이 아니라** 있는 둘 중에서 고르게만 한다 —
   * `surveys.category` 의 CHECK 는 그대로 둔다.
   */
  category: SurveyCategory
  /**
   * 회원에게 보일 설문인가, 운영진끼리 정할 설문인가.
   *
   * **고칠 때 반드시 지금 값을 실어 보낸다.** 안 보내면 서버가
   * 지금 값을 지키기는 하지만, 화면이 「회원용」 으로 보이면서 실제로는
   * 운영진용인 어깼난 상태가 된다.
   */
  audience: 'members' | 'admins'
  options: DraftOption[]
}

export const emptyOption = (): DraftOption =>
  ({ title: '', period: '', venue: '', hours: '', price: '', note: '', links: [] })

export const emptyDraft = (): Draft => ({
  id: null, title: '', intro: '', multiChoice: true, days: 3, createdBy: '',
  wasClosed: false,
  resultsVisible: 'after_close', showNames: 'none',
  // 기본값은 서버와 같게 둔다 (survey_admin_save 도 비면 exhibition 이다)
  category: 'exhibition',
  // 새 설문은 회원용이 기본이다. 운영진용은 일부러 고르게 한다 —
  // 기본을 반대로 두면 회원에게 보여야 할 설문이 조용히 안 보이는 쪽으로 넘어진다.
  audience: 'members',
  options: [emptyOption()],
})

export const adminNames = async (pw: string, signal?: AbortSignal): Promise<string[]> => {
  const rows = await rpc<{ name: string }[]>('survey_admin_names', { p_password: pw }, signal)
  return Array.isArray(rows) ? rows.map((r) => r.name) : []
}

/* ── 회원 명부 ──────────────────────────────────────────────
 * 명단 전체를 읽는 길은 **운영자 암호를 아는 사람에게만** 열려 있다.
 * 회원 화면은 `memberOk` 로 자기 한 쌍만 물어볼 수 있고, 명단은 못 받는다.
 */

export type Member = { id: string; zone: string; name: string; registeredAt: string }

/** 이 구역번호와 이름이 명부에 있나. 명단은 안 돌려준다. */
export const memberOk = (zone: string, name: string, signal?: AbortSignal) =>
  rpc<boolean>('survey_member_ok', { p_zone: zone, p_name: name }, signal)

/**
 * 명부로 거르고 있나. **인원수는 안 준다.**
 * 숫자를 주면 한 명씩 물어 명부를 캐내는 사람에게 언제 멈출지 알려 주는 셈이 된다.
 */
export const rosterOn = (signal?: AbortSignal) =>
  rpc<boolean>('survey_roster_on', {}, signal)

export const adminMembers = async (pw: string, signal?: AbortSignal): Promise<Member[]> => {
  const rows = await rpc<Record<string, unknown>[]>('survey_admin_members', { p_password: pw }, signal)
  if (!Array.isArray(rows)) return []
  return rows.map((r) => ({
    id: String(r.member_id ?? ''),
    zone: str(r.member_zone) ?? '',
    name: str(r.member_name) ?? '',
    registeredAt: str(r.member_at) ?? '',
  }))
}

export const adminMemberSave = (
  pw: string, m: { id: string | null; zone: string; name: string; registeredAt: string },
  signal?: AbortSignal,
) => rpc<string>('survey_admin_member_save', {
  p_password: pw, p_id: m.id, p_zone: m.zone, p_name: m.name, p_at: m.registeredAt || null,
}, signal)

export const adminMemberDelete = (pw: string, id: string, signal?: AbortSignal) =>
  rpc<null>('survey_admin_member_delete', { p_password: pw, p_id: id }, signal)

/* ── 후보의 기간 ────────────────────────────────────────────
 * DB 에 담기는 것은 `2026. 8. 27. ~ 2027. 2. 9.` 같은 **글**이다.
 * 달력 칸은 적는 방법만 바꾸는 것이라, 글 ↔ 날짜를 오갈 수 있어야 한다.
 */

/** `2026. 8. 27.` · `2026.8.27` · `2026-08-27` 을 모두 `2026-08-27` 로 본다 */
const oneDate = (s: string): string | null => {
  const m = /^\s*(\d{4})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})\s*\.?\s*$/.exec(s)
  if (!m) return null
  const [, y, mo, d] = m
  const iso = `${y}-${String(Number(mo)).padStart(2, '0')}-${String(Number(d)).padStart(2, '0')}`
  // 2026-02-31 같은 것을 걸러낸다 — Date 가 조용히 3월로 넘겨 버린다
  const t = new Date(`${iso}T00:00:00+09:00`)
  return Number.isNaN(t.getTime()) || !iso.endsWith(String(t.getDate()).padStart(2, '0')) ? null : iso
}

/**
 * 적혀 있는 기간을 달력이 읽을 수 있는 두 날짜로 되돌린다.
 * **날짜 범위로 안 읽히면 null 이다** — 영화의 `개봉 예정 · 2026. 7. 29. 개봉` 같은 것.
 * 그때는 손대지 말아야 한다. 억지로 날짜를 뽑아내면 원래 뜻이 사라진다.
 */
export function parsePeriod(text: string): { from: string; to: string } | null {
  const s = (text ?? '').trim()
  if (!s) return null
  const parts = s.split('~')
  if (parts.length === 1) {
    const one = oneDate(parts[0]!)
    return one ? { from: one, to: '' } : null
  }
  if (parts.length !== 2) return null
  const from = oneDate(parts[0]!)
  const to = oneDate(parts[1]!)
  if (!from || !to) return null
  return { from, to }
}

/** 달력이 준 두 날짜를 회원 화면에 뜨는 글로 만든다 */
export function formatPeriod(from: string, to: string): string {
  const ko = (iso: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
    const [y, m, d] = iso.split('-')
    return `${y}. ${Number(m)}. ${Number(d)}.`
  }
  const a = ko(from); const b = ko(to)
  if (a && b) return `${a} ~ ${b}`
  return a || b
}

/**
 * 날짜만. **시각은 빼고 보여 준다.**
 * 명부에 `8. 22. 00:00` 이라고 뜨니 `00:00` 이 눈을 잡아끌었는데,
 * 정작 그 숫자는 아무 뜻이 없다 — 등록일자에 시각을 받지 않기 때문이다.
 */
export function koDay(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(d)
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? ''
  return `${g('year')}. ${g('month')}. ${g('day')}.`
}

/** 날짜 칸(`type="date"`)에 넣을 꼴. 한국 시간 기준으로 자른다. */
export const toDateInput = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
  return p                                    // en-CA 는 YYYY-MM-DD 로 준다
}

/** 날짜 칸이 준 `YYYY-MM-DD` 를 한국 시간 자정으로 되돌린다 */
export const fromDateInput = (v: string): string =>
  (/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00+09:00` : '')

export const adminList = async (pw: string, signal?: AbortSignal): Promise<AdminSurvey[]> => {
  const rows = await rpc<Record<string, unknown>[]>('survey_admin_list', { p_password: pw }, signal)
  if (!Array.isArray(rows)) return []
  return rows.map((r) => ({
    id: String(r.id ?? ''),
    title: str(r.title) ?? '',
    closesAt: str(r.closes_at) ?? '',
    createdBy: str(r.created_by) ?? '',
    multiChoice: r.multi_choice !== false,
    resultsVisible: str(r.results_visible) ?? '',
    showNames: str(r.show_names) ?? '',
    // 서버가 안 주는 옛 판이면 회원용으로 본다 — 없는 값을 운영진용으로 읽으면
    // 회원 설문이 운영자 화면에만 갇힌다. 모르면 덜 감추는 쪽으로 넘어진다.
    audience: str(r.audience) === 'admins' ? 'admins' : 'members',
    optionCount: Number(r.option_count) || 0,
    responseCount: Number(r.response_count) || 0,
  }))
}

export const adminSave = (pw: string, d: Draft, signal?: AbortSignal) =>
  rpc<string>('survey_admin_save', {
    p_password: pw,
    p_payload: {
      id: d.id,
      title: d.title,
      intro: d.intro,
      multi_choice: d.multiChoice,
      days: d.days,
      created_by: d.createdBy,
      results_visible: d.resultsVisible,
      show_names: d.showNames,
      category: d.category,
      audience: d.audience,
      options: d.options.map((o) => ({
        title: o.title, period: o.period, venue: o.venue,
        hours: o.hours, price: o.price, note: o.note,
        // 빈 줄은 보내지 않는다 — 서버가 https 를 요구하므로 빈 것은 거절당한다
        links: o.links.filter((l) => l.url.trim() && l.label.trim()),
      })),
    },
  }, signal)

/**
 * 고칠 · 답할 설문 하나를 후보까지 불러온다. **암호로 열며, RLS 를 안 지난다.**
 *
 * fetchSurveys 로는 안 된다 — 그쪽은 REST 로 표를 직접 읽어 RLS 를 거치고,
 * 그 정책은 audience='members' 만 내준다 (202608300002a).
 * 예전에는 이 함수 없이 fetchSurveys 로 고칠 설문을 찾았고,
 * 운영진용 설문을 넣자 운영자에게도 「설문을 찾지 못했습니다」 가 됐다.
 *
 * 서버가 REST 와 **같은 모양**으로 돌려주므로 변환기를 다시 쓴다.
 */
export const adminGetWithCount = async (
  pw: string, id: string, signal?: AbortSignal,
): Promise<{ survey: Survey; responseCount: number }> => {
  const row = await rpc<SurveyRow>('survey_admin_get', { p_password: pw, p_survey: id }, signal)
  if (!row || typeof row !== 'object') throw new Error('설문을 불러오지 못했습니다.')
  // 응답 수를 같이 받는다. 회원 창구인 survey_response_count 는
  // 운영진용 설문에 0 을 주므로 그것을 쓰면 항상 0명이 된다.
  return { survey: toSurvey(row), responseCount: Number(row.response_count) || 0 }
}

export const adminGet = async (pw: string, id: string, signal?: AbortSignal): Promise<Survey> =>
  (await adminGetWithCount(pw, id, signal)).survey

/**
 * 운영진이 운영진용 설문에 답한다.
 *
 * 받는 것은 회원 설문과 똑같다 — 구역번호와 이름으로 명부와 대조한다.
 * **그러나 저장되는 것은 익명 키뿐이다.** 이름도 구역도 행에 안 남는다
 * (survey_anon_key · 2026-08-24). 운영진이라고 다르게 둘 이유가 없다.
 * 같은 사람이 두 번 답하는 것은 그 키의 유니크 제약이 막는다.
 */
export const adminSubmit = (
  pw: string, id: string, zone: string, name: string, optionIds: string[],
  signal?: AbortSignal,
) => rpc<null>('survey_admin_submit', {
  p_password: pw, p_survey: id, p_zone: zone, p_name: name, p_options: optionIds,
}, signal)

export const adminDelete = (pw: string, id: string, signal?: AbortSignal) =>
  rpc<null>('survey_admin_delete', { p_password: pw, p_survey: id }, signal)

/**
 * 운영진이 참고하는 분석 메모. **잠긴 표라 함수로만 닿는다** —
 * 톡방 이야기나 사람 이름이 섞일 수 있어 공개 표에 두지 않았다.
 */
export const adminNote = async (pw: string, id: string, signal?: AbortSignal): Promise<string> => {
  const v = await rpc<string | null>('survey_admin_note',
    { p_password: pw, p_survey: id }, signal)
  return typeof v === 'string' ? v : ''
}

export const adminNoteSave = (pw: string, id: string, body: string, signal?: AbortSignal) =>
  rpc<null>('survey_admin_note_save',
    { p_password: pw, p_survey: id, p_body: body }, signal)

/**
 * 운영진만 읽는 긴 글 (202608310001a).
 *
 * `adminNote` 와 구조가 같고 **매다는 자리만 다르다** — 저쪽은 설문 id,
 * 이쪽은 이름표(구글 설문 회차 id). 구글 설문은 surveys 행이 없어서 저쪽에 못 넣는다.
 *
 * 본문은 **저장소에 없다.** 운영자가 화면에서 붙여 넣고 잠긴 표에만 산다 —
 * 번들이 공개라 화면 코드에 두면 암호가 가림막이 된다.
 */
export const adminGuide = async (pw: string, key: string, signal?: AbortSignal): Promise<string> => {
  const v = await rpc<string | null>('survey_admin_guide',
    { p_password: pw, p_key: key }, signal)
  return typeof v === 'string' ? v : ''
}

export const adminGuideSave = (pw: string, key: string, body: string, signal?: AbortSignal) =>
  rpc<null>('survey_admin_guide_save',
    { p_password: pw, p_key: key, p_body: body }, signal)

/** 고칠 설문을 편집용 모양으로 바꾼다 */
export const toDraft = (s: Survey): Draft => ({
  id: s.id,
  title: s.title,
  intro: s.intro ?? '',
  multiChoice: s.multiChoice,
  // 남은 날짜로 되돌린다 (서버는 "지금부터 며칠" 로 다시 센다)
  days: Math.max(1, Math.ceil((Date.parse(s.closesAt) - Date.now()) / 86_400_000)),
  wasClosed: Date.parse(s.closesAt) <= Date.now(),
  createdBy: s.createdBy,
  resultsVisible: s.resultsVisible,
  showNames: s.showNames,
  // 고칠 때 지금 갈래를 그대로 들고 온다. 안 그러면 저장할 때마다 전시로 끌려간다.
  category: s.category,
  // 고칠 때 지금 값을 그대로 들고 온다 — 제목만 고쳐도
  // 운영진용 설문이 회원에게 튀어나오면 되돌릴 수 없다.
  audience: s.audience,
  options: s.options.map((o) => ({
    title: o.title, period: o.period ?? '', venue: o.venue ?? '',
    hours: o.hours ?? '', price: o.price ?? '', note: o.note ?? '',
    links: o.links.map((l) => ({ kind: l.kind, label: l.label, url: l.url })),
  })),
})

/**
 * 운영자가 보는 결과. **이름이 나오는 유일한 자리다.**
 * 회원용 survey_tally 는 지금도 숫자만 준다 — 이건 암호 뒤에 있다.
 */
export type AdminResult = {
  optionId: string
  position: number
  title: string
  votes: number
  voters: string[]        // '4133 홍길동'
}

export type AdminRespondent = {
  who: string
  answeredAt: string
  picks: number
}

export const adminResults = async (
  pw: string, surveyId: string, signal?: AbortSignal,
): Promise<AdminResult[]> => {
  const rows = await rpc<Record<string, unknown>[]>('survey_admin_results',
    { p_password: pw, p_survey: surveyId }, signal)
  if (!Array.isArray(rows)) return []
  return rows.map((r) => ({
    optionId: String(r.option_id ?? ''),
    position: Number(r.option_position) || 0,
    title: str(r.option_title) ?? '',
    votes: Number(r.votes) || 0,
    voters: Array.isArray(r.voters) ? r.voters.filter((v): v is string => typeof v === 'string') : [],
  })).sort((a, b) => a.position - b.position)
}

export const adminRespondents = async (
  pw: string, surveyId: string, signal?: AbortSignal,
): Promise<AdminRespondent[]> => {
  const rows = await rpc<Record<string, unknown>[]>('survey_admin_respondents',
    { p_password: pw, p_survey: surveyId }, signal)
  if (!Array.isArray(rows)) return []
  return rows.map((r) => ({
    who: str(r.who) ?? '',
    answeredAt: str(r.answered_at) ?? '',
    picks: Number(r.picks) || 0,
  }))
}

/** `8. 20. 22:14` — 결과 표에 넣을 짧은 시각 */
export function koShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? ''
  return `${g('month')}. ${g('day')}. ${g('hour')}:${g('minute')}`
}
