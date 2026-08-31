import { useEffect, useMemo, useState } from 'react'
import { adminGuide, adminGuideSave } from './lib/survey'
import { GuideDoc, looksLikeJson, parseGuideDoc } from './GuideDoc'

/**
 * 운영진만 읽는 긴 글 — 구글 설문 회차의 분석 가이드.
 *
 * ── 본문이 저장소에 없다 ────────────────────────────────────
 * 이 글에는 공개 화면에 넣지 않기로 한 것들이 들어 있다 (AGENTS.md) —
 * 참여 빈도별 집단 구분, 미응답자 수, 자유서술 인용.
 * **번들은 공개라** 화면 코드에 두면 암호가 가림막이 된다. 공개 저장소의 .sql 도 같다.
 * 그래서 운영자가 화면에서 붙여 넣고, 글은 잠긴 표(admin_guides)에만 산다.
 * 화면을 우회해도 서버가 암호를 본다 — 진짜 자물쇠는 거기에 있다.
 *
 * ── 두 가지 본문을 받는다 ───────────────────────────────────
 * · **구조화 JSON**(첫 글자 `{`) → GuideDoc 이 지표 막대·페르소나·격차 차트로 그린다.
 *   유지보수를 위해 이쪽이 새 방식이다 — 「지표를 그대로」 보여 준다.
 * · **옛 마크다운**(##·-) → 아래 Rendered 로 폴백. 옛 본문이 죽지 않게 남겨 둔다.
 *
 * ── JSON 은 쉼표 하나에 통째로 깨진다 ───────────────────────
 * 그래서 편집 중 **실시간 미리보기**가 필수다. 파싱은 반드시 여기서 받는다 —
 * 저장소에 ErrorBoundary 가 없어 렌더 중 던지면 운영자 화면 전체가 하얗게 죽는다.
 */

/* ── 옛 마크다운 폴백 (지우지 말 것) ─────────────────────────
   validate-survey-admin-ui 가 옛 본문의 ##/- 렌더를 아직 단언한다. */
type Line =
  | { kind: 'h'; text: string }
  | { kind: 'li'; text: string }
  | { kind: 'p'; text: string }

export function parseGuide(body: string): Line[] {
  const out: Line[] = []
  for (const raw of body.split('\n')) {
    const l = raw.trim()
    if (!l) continue
    if (l.startsWith('## ')) out.push({ kind: 'h', text: l.slice(3).trim() })
    else if (l.startsWith('- ')) out.push({ kind: 'li', text: l.slice(2).trim() })
    else out.push({ kind: 'p', text: l })
  }
  return out
}

function Rendered({ body }: { body: string }) {
  const lines = parseGuide(body)
  return (
    <div className="guide-text">
      {lines.map((l, i) => {
        if (l.kind === 'h') return <h4 key={i} className="guide-h">{l.text}</h4>
        if (l.kind === 'li') return <p key={i} className="guide-li">{l.text}</p>
        return <p key={i} className="guide-p">{l.text}</p>
      })}
    </div>
  )
}

/**
 * 본문 한 벌을 그린다 — **절대 던지지 않는다.**
 * JSON 이면 형태를 보고 GuideDoc, 아니면 마크다운 폴백.
 * JSON 인데 깨졌으면 오류 배너를 그린다(빈 화면 대신).
 */
function GuideBody({ body }: { body: string }) {
  if (!looksLikeJson(body)) return <Rendered body={body} />
  const res = parseGuideDoc(body)
  if (!res.ok) {
    return (
      <p className="gdoc-error" role="alert">
        <b>이 가이드를 읽을 수 없습니다.</b> {res.error}
        <br />「고치기」 를 눌러 편집칸에서 바로잡을 수 있습니다.
      </p>
    )
  }
  return <GuideDoc doc={res.doc} />
}

export function AdminGuide({ pw, guideKey, label, onError }: {
  pw: string
  /** 무엇에 대한 글인가. 구글 설문 회차 id 를 그대로 쓴다 */
  guideKey: string
  label: string
  onError: (e: unknown) => void
}) {
  const [body, setBody] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const ac = new AbortController()
    adminGuide(pw, guideKey, ac.signal)
      .then((v) => { setBody(v); setDraft(v) })
      .catch((e: unknown) => { if (!ac.signal.aborted) onError(e) })
    return () => ac.abort()
  }, [pw, guideKey, onError])

  /** 편집칸의 실시간 판정. JSON 이면 파싱 결과, 아니면 마크다운으로 본다. */
  const check = useMemo(() => {
    const t = draft.trim()
    if (!t) return { state: 'empty' as const }
    if (!looksLikeJson(draft)) return { state: 'markdown' as const }
    const res = parseGuideDoc(draft)
    return res.ok
      ? { state: 'json' as const, doc: res.doc }
      : { state: 'error' as const, error: res.error }
  }, [draft])

  /** 6만 자 한도 근접·이미지 data URI — 저장은 막지 않고 알리기만 한다. */
  const warn = useMemo(() => {
    const ws: string[] = []
    if (draft.length > 55000)
      ws.push(`길이 ${draft.length.toLocaleString('ko-KR')}자 — 6만 자 한도에 가깝습니다.`)
    if (/["'(]\s*data:/.test(draft))
      ws.push('이미지 data: 주소가 있습니다 — 용량 한도(6만 자)를 넘길 위험이 큽니다.')
    return ws
  }, [draft])

  const save = async () => {
    setBusy(true); setSaved(false)
    try {
      await adminGuideSave(pw, guideKey, draft)
      setBody(draft.trim())
      setEditing(false)
      setSaved(true)
    } catch (e) { onError(e) } finally { setBusy(false) }
  }

  // 못 읽은 것과 「없다」 는 다르다. 못 읽었으면 아무 말도 하지 않는다.
  if (body === null) return null

  return (
    <details className="admin-guide" open={editing || undefined}>
      <summary className="admin-guide-head">
        <span>{label}</span>
        <span className="admin-guide-state">{body ? '있음' : '아직 없음'}</span>
      </summary>
      <div className="admin-guide-body">
        {editing
          ? (
            <>
              <textarea className="admin-input" rows={16} value={draft}
                placeholder={'분석 가이드를 붙여 넣으세요. { "sections": [ … ] } 구조화 JSON 이면\n지표 막대·페르소나·격차 차트로 그려지고, 아래에서 미리 볼 수 있습니다.'}
                onChange={(e) => setDraft(e.target.value)} />

              {check.state === 'error' && (
                <p className="gdoc-error" role="alert">
                  <b>JSON 을 읽을 수 없습니다.</b> {check.error}
                </p>
              )}
              {warn.map((w) => (
                <p className="gdoc-hint" key={w}>{w}</p>
              ))}

              <div className="survey-actions" style={{ marginTop: 10 }}>
                {/* 오류면 저장을 막는다 — 깨진 JSON 을 넣으면 읽을 때 오류 배너만 남는다 */}
                <button type="button" className="survey-submit"
                  disabled={busy || check.state === 'error'}
                  onClick={() => { void save() }}>{busy ? '저장 중…' : '저장'}</button>
                <button type="button" className="admin-mini"
                  onClick={() => { setDraft(body); setEditing(false) }}>그만두기</button>
              </div>

              {/* 미리보기 — 저장 전에 그려질 모습을 그대로 본다 */}
              {(check.state === 'json' || check.state === 'markdown') && draft.trim() && (
                <div className="gdoc-preview">
                  <p className="gdoc-preview-cap">미리보기</p>
                  {check.state === 'json'
                    ? <GuideDoc doc={check.doc} />
                    : <Rendered body={draft} />}
                </div>
              )}
            </>
          )
          : (
            <>
              {body
                ? <GuideBody body={body} />
                : (
                  <p className="admin-hint" style={{ margin: 0 }}>
                    아직 붙여 넣은 가이드가 없습니다. 「적기」 를 눌러 넣으세요.
                  </p>
                )}
              <div className="survey-actions" style={{ marginTop: 10 }}>
                <button type="button" className="admin-mini"
                  onClick={() => setEditing(true)}>{body ? '고치기' : '적기'}</button>
                {saved && <span className="survey-status done">저장했습니다.</span>}
              </div>
            </>
          )}

        <p className="admin-hint" style={{ marginTop: 10, marginBottom: 0 }}>
          이 글은 <b>운영자 화면에서만</b> 보입니다. 회원 화면에도, 저장소에도,
          공개 번들에도 들어가지 않습니다 — 잠긴 표에 있고 암호를 확인한 뒤에만 나옵니다.
        </p>
      </div>
    </details>
  )
}
