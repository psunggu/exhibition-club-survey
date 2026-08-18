/**
 * 주간 정리봇 요약 (R-01-05).
 *
 * 데이터는 아직 `weekly-digest.public.json` 에서 읽는다. DB 연동은 R-03-02 다.
 *
 * **이 JSON 은 공개 파일이다.** 원본 digest 에는 실명·닉네임·구역번호+이름·개인별
 * 평가가 들어 있고, 그것을 걷어낸 공개본만 저장소에 둔다 (AGENTS.md).
 * `scripts/validate-weekly-digest.mjs` 가 CI 에서 그 경계를 지킨다 —
 * 여기서 필드를 늘리려면 그 검사기부터 본다.
 */

export type Digest = {
  botName: string
  periodLabel: string
  updatedLabel: string
  messageCount: number
  summary: string
  highlights: string[]
  decisions: string[]
  openQuestions: string[]
}

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : []

/**
 * 모양이 어긋나면 받지 않는다. 옛 `isSafeDigest` 와 같은 취지다 —
 * 화면에 반쯤 깨진 요약을 띄우느니 안 띄우는 편이 낫다.
 */
export function parseDigest(raw: unknown): Digest | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  const summary = typeof d.summary === 'string' ? d.summary.trim() : ''
  if (!summary) return null
  return {
    botName: typeof d.bot_name === 'string' ? d.bot_name : '주간 정리봇',
    periodLabel: typeof d.period_label === 'string' ? d.period_label : '',
    updatedLabel: typeof d.updated_label === 'string' ? d.updated_label : '',
    messageCount: typeof d.message_count === 'number' ? d.message_count : 0,
    summary,
    highlights: strArray(d.highlights),
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
