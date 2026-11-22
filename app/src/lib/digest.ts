/**
 * 주간 정리봇 요약 (R-01-05).
 *
 * 데이터는 아직 `weekly-digest.public.json` 에서 읽는다. DB 연동은 R-03-02 다.
 *
 * **이 JSON 은 공개 파일이다.** 원본 digest 에는 실명·닉네임·구역번호+이름·개인별
 * 평가가 들어 있고, 그것을 걷어낸 공개본만 저장소에 둔다 (AGENTS.md).
 * `scripts/validate-weekly-digest.mjs` 가 CI 에서 그 경계를 지킨다 —
 * 여기서 필드를 늘리려면 그 검사기부터 본다.
 *
 * ── 고쳤던 것 ──────────────────────────────────────────────
 * `highlights` 를 문자열 배열로 잘못 읽어 **언제나 빈 배열**이었다.
 * 실제로는 `{severity,label,title,text}` 객체 배열이고, 옛 화면에서는 이것이
 * 정리봇 본문 그 자체였다. 파서가 조용히 버리고 있었고 JSON 도 검사기도
 * 정상이라 화면에서만 사라졌다. 완료 항목은 아래 정책에 따라 별도 목록에 둔다.
 */

export const SEVERITY_ICON = {
  urgent: '!', check: '?', planning: '→',
} as const

export type Severity = keyof typeof SEVERITY_ICON

export type Highlight = {
  severity: Severity
  label: string
  title: string
  text: string
  /** 일정 날짜 `YYYY-MM-DD`. 날짜 없는 안내(전시 정보 · 확인 필요)에는 없다 — 그런 카드는 늘 보인다. */
  date?: string
}

/**
 * 「확정」 은 공개본에서 「확인 필요」 와 같은 `check` 로 온다(색도 같다). 물음표는 확정에 맞지 않아
 * 글자만 체크로 바꾼다 — 달력의 완료 줄과 같은 ✓ (2026-10-15 운영자 요청).
 */
const LABEL_ICON: Readonly<Record<string, string>> = { 확정: '✓' }

export const highlightIcon = (h: Highlight): string => LABEL_ICON[h.label] ?? SEVERITY_ICON[h.severity]

export type Digest = {
  botName: string
  periodLabel: string
  updatedLabel: string
  messageCount: number
  summary: string
  highlights: Highlight[]
  decisions: string[]
  openQuestions: string[]
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : []

const isSeverity = (v: unknown): v is Severity =>
  typeof v === 'string' && v in SEVERITY_ICON

/** `YYYY-MM-DD` — 글자 그대로 견주면 날짜 순서다. */
const isIsoDay = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

/**
 * 옛 `isSafeDigest` 와 같은 검사다 — 모양이 어긋난 항목은 통째로 버린다(날짜 칸도 같다).
 * 완료 항목은 중요 확인사항이 아니다. 완료 목록과 `decisions` 에만 남기고 여기서는 받지 않는다.
 */
function parseHighlights(v: unknown): Highlight[] {
  if (!Array.isArray(v)) return []
  const out: Highlight[] = []
  for (const raw of v) {
    if (!raw || typeof raw !== 'object') continue
    const h = raw as Record<string, unknown>
    if (!isSeverity(h.severity)) continue
    const label = str(h.label)
    const title = str(h.title)
    const text = str(h.text)
    if (!label || !title || !text) continue
    if ('completed_date' in h) continue
    if (h.date !== undefined && !isIsoDay(h.date)) continue
    out.push({ severity: h.severity, label, title, text, ...(isIsoDay(h.date) ? { date: h.date } : {}) })
  }
  return out
}

/**
 * 화면에 낼 확인사항 — 날짜가 지난 것은 뺀다(당일은 둔다). 날짜 없는 안내는 그대로.
 *
 * 공개본은 새 요약이 들어올 때만 다시 만들어진다. 만들 때 지난 일정을 빼도(`digest-to-public.mjs`)
 * 다음 요약까지는 그대로라, 10/11 모임 두 건이 10/15 에도 「확정」 으로 남았다(2026-10-15).
 * 그래서 화면이 같은 규칙으로 다시 본다. `today` 는 부르는 쪽이 넘긴다 — `isDone` 과 같다.
 */
export const shownHighlights = (list: readonly Highlight[], today: string): Highlight[] =>
  list.filter((h) => !h.date || h.date >= today)

/**
 * 「이번 주 소식」 — 첫 화면에 접지 않고 보여 주는 줄 (2026-11-23, 운영자 요청).
 * 톡방에 주간 소식 글을 따로 올리지 않고, 들어오면 바로 읽히게 한다.
 */

/** 딱지 색. 색은 상태만 말한다 — 확정 · 취소 · 아직 정하는 중, 나머지(전시 정보 등)는 중립. */
export type NewsTone = 'conf' | 'stop' | 'warn' | 'info'
const NEWS_TONE: Readonly<Record<string, NewsTone>> = { 확정: 'conf', 취소: 'stop', '조율 중': 'warn', 미정: 'warn' }
export const newsTone = (h: Highlight): NewsTone => NEWS_TONE[h.label] ?? 'info'

/** 한 줄로 줄인 글 — 첫 문장만. 전문은 바로 아래 「자세히 보기」 에 있다. 날짜의 점(2026. 11. 22.)에서는 끊지 않는다. */
export const newsLine = (text: string): string => {
  const cut = text.search(/(?<!\d)[.。]\s/)
  return (cut < 0 ? text : text.slice(0, cut)).replace(/[.。]\s*$/, '')
}

/**
 * 바로 보이는 줄 — 모임에 관한 것(확정 · 취소 · 조율 중)을 앞에 두고 모두 합쳐 셋까지.
 * 모임 소식만 셋을 넘으면 다섯까지 다 보여 준다 — 모임이 바뀐 것을 「더 보기」 뒤에 숨기지 않는다.
 */
export function topNews(list: readonly Highlight[]): Highlight[] {
  const meet = list.filter((h) => newsTone(h) !== 'info').slice(0, 5)
  const info = list.filter((h) => newsTone(h) === 'info')
  return [...meet, ...info].slice(0, Math.max(3, meet.length))
}

export function parseDigest(raw: unknown): Digest | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  const summary = str(d.summary)
  if (!summary) return null
  return {
    botName: str(d.bot_name) || '주간 정리봇',
    periodLabel: str(d.period_label),
    updatedLabel: str(d.updated_label),
    messageCount: typeof d.message_count === 'number' ? d.message_count : 0,
    summary,
    highlights: parseHighlights(d.highlights),
    decisions: strArray(d.decisions),
    openQuestions: strArray(d.open_questions),
  }
}

/** 정적 파일이라 base 를 앞에 붙여야 한다. 안 붙이면 배포본에서 404 다. */
const url = () => `${import.meta.env.BASE_URL}weekly-digest.public.json`

export async function fetchDigest(signal?: AbortSignal): Promise<Digest | null> {
  const res = await fetch(url(), { signal, credentials: 'same-origin' })
  if (!res.ok) throw new Error(`정리봇 응답 ${res.status}`)
  return parseDigest(await res.json())
}
