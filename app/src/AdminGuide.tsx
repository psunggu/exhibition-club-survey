import { useEffect, useState } from 'react'
import { adminGuide, adminGuideSave } from './lib/survey'

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
 * ── 왜 서식을 조금 읽나 ─────────────────────────────────────
 * 분석 가이드는 대여섯 쪽짜리다. 「분석 메모」처럼 통글자로 흘리면 휴대폰에서
 * 어디가 어디인지 안 보인다. 그렇다고 마크다운 라이브러리를 들일 일은 아니라서,
 * **줄 첫머리 세 가지만** 읽는다 — 그 이상은 안 읽고 글자 그대로 둔다.
 *
 *   ## 제목      · - 목록      · 그 밖에는 문단
 */
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
      {/* **`.note-*` 를 쓰지 않는다.** 검사기가 그 이름으로 「분석 메모」 를 짚는데,
          같은 이름을 쓰자 `.note-state` 첫 요소가 이 가이드로 바뀌어 메모 검사가
          엉뚱한 것을 읽었다. (`.admin-card` 와 같은 사정이다.) */}
      <summary className="admin-guide-head">
        <span>{label}</span>
        <span className="admin-guide-state">{body ? '있음' : '아직 없음'}</span>
      </summary>
      <div className="admin-guide-body">
        {editing
          ? (
            <>
              <textarea className="admin-input" rows={18} value={draft}
                placeholder={'분석 가이드를 붙여 넣으세요.\n\n## 로 시작하는 줄은 제목, - 로 시작하는 줄은 목록으로 그려집니다.'}
                onChange={(e) => setDraft(e.target.value)} />
              <div className="survey-actions" style={{ marginTop: 10 }}>
                <button type="button" className="survey-submit" disabled={busy}
                  onClick={() => { void save() }}>{busy ? '저장 중…' : '저장'}</button>
                <button type="button" className="admin-mini"
                  onClick={() => { setDraft(body); setEditing(false) }}>그만두기</button>
              </div>
            </>
          )
          : (
            <>
              {body
                ? <Rendered body={body} />
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
