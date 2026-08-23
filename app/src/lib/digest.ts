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
}

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

/**
 * 옛 `isSafeDigest` 와 같은 검사다 — 모양이 어긋난 항목은 통째로 버린다.
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
    out.push({ severity: h.severity, label, title, text })
  }
  return out
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
