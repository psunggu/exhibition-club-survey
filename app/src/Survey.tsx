import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CATEGORY, fetchMyChoices, fetchResponseCount, fetchSurveys, fetchTally,
  isOpen, isVisible, koDeadline, submitResponse, SurveyUnavailable,
  type Survey as SurveyT, type SurveyCategory, type SurveyLink, type SurveyOption,
} from './lib/survey'
import { ResultChart } from './SurveyChart'

/**
 * 설문 화면.
 *
 * ── 흐름 ────────────────────────────────────────────────────
 * 1. 구역번호 + 이름을 적는다   ← 중복을 막는 열쇠라 먼저 받는다
 * 2. 이전에 응답했으면 그때 고른 것을 불러와 체크해 둔다
 * 3. 고치고 다시 내면 **이전 선택을 지우고 새로 저장한다**
 *
 * 이름을 먼저 받는 이유는 요구사항 그대로다 — 한 사람이 한 번만.
 * 다만 이름만으로는 남의 이름을 적는 것을 막지 못한다. 교구 단톡방이라
 * 악의보다 실수가 문제이고, 구역번호를 함께 받는 것이 그 실수를 줄인다.
 */

const ICON = {
  video: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M10 9.2v5.6l4.8-2.8L10 9.2z" fill="currentColor" />
    </svg>
  ),
  link: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
}

function LinkChip({ l }: { l: SurveyLink }) {
  const video = l.kind === 'video'
  return (
    <a className={video ? 'survey-link video' : 'survey-link'}
      href={l.url} target="_blank" rel="noopener noreferrer">
      {video ? ICON.video : ICON.link}
      {l.label}
    </a>
  )
}

function Facts({ o }: { o: SurveyOption }) {
  const rows: [string, string][] = []
  if (o.period) rows.push(['기간', o.period])
  if (o.venue) rows.push(['장소', o.venue])
  if (o.hours) rows.push(['시간', o.hours])
  if (o.price) rows.push(['관람료', o.price])
  if (!rows.length) return null
  return (
    <p className="survey-facts">
      {rows.map(([k, v], i) => (
        <span key={k}>
          {i > 0 && <br />}
          <b>{k}</b> {v}
        </span>
      ))}
    </p>
  )
}

function OneSurvey({ s }: { s: SurveyT }) {
  const open = isOpen(s)
  const [zone, setZone] = useState('')
  const [name, setName] = useState('')
  const [locked, setLocked] = useState(false)      // 이름을 확정했나
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [had, setHad] = useState(false)            // 이전 응답이 있었나
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'error' | 'done' | 'info'; text: string } | null>(null)
  const [tally, setTally] = useState<Map<string, number> | null>(null)
  const [total, setTotal] = useState(0)
  const ac = useRef<AbortController | null>(null)

  useEffect(() => () => ac.current?.abort(), [])

  const loadTally = useCallback(async () => {
    try {
      const [t, n] = await Promise.all([fetchTally(s.id), fetchResponseCount(s.id)])
      // 아직 볼 때가 아니면 서버가 빈 결과를 준다 — 그때는 아무것도 안 보인다
      setTally(t.size ? t : null)
      setTotal(Number(n) || 0)
    } catch { setTally(null) }
  }, [s.id])

  useEffect(() => { void loadTally() }, [loadTally])

  /** 이름을 확정하고 이전 응답을 불러온다 */
  const confirmWho = async () => {
    const z = zone.trim(); const n = name.trim()
    if (!z || !n) { setMsg({ kind: 'error', text: '구역번호와 이름을 모두 적어 주세요.' }); return }
    setBusy(true); setMsg(null)
    try {
      const mine = await fetchMyChoices(s.id, z, n)
      setPicked(new Set(mine))
      setHad(mine.length > 0)
      setLocked(true)
      if (mine.length > 0) {
        setMsg({ kind: 'info',
          text: '이전에 응답하신 내용을 불러왔습니다. 고쳐서 다시 제출하면 새 응답으로 바뀝니다.' })
      }
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof SurveyUnavailable ? e.reason : '불러오지 못했습니다.' })
    } finally { setBusy(false) }
  }

  const toggle = (id: string) => {
    if (!open || !locked) return
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        if (!s.multiChoice) next.clear()   // 하나만 고르는 설문
        next.add(id)
      }
      return next
    })
    setMsg(null)
  }

  const send = async () => {
    if (!picked.size) { setMsg({ kind: 'error', text: '적어도 하나는 골라 주세요.' }); return }
    setBusy(true); setMsg(null)
    ac.current?.abort()
    ac.current = new AbortController()
    try {
      await submitResponse(s.id, zone.trim(), name.trim(), [...picked], ac.current.signal)
      setHad(true)
      setMsg({ kind: 'done', text: '제출했습니다. 마감 전이면 언제든 다시 고칠 수 있습니다.' })
      await loadTally()
    } catch (e) {
      // 서버가 사람이 읽을 문장으로 돌려준다 — 그대로 보여 준다
      setMsg({ kind: 'error', text: e instanceof SurveyUnavailable ? e.reason : '제출하지 못했습니다.' })
    } finally { setBusy(false) }
  }

  /** 응답 화면의 작은 막대를 그릴 기준 — 가장 많이 받은 후보 */
  const topVotes = useMemo(() => {
    if (!tally) return 0
    return Math.max(...[...tally.values()], 0)
  }, [tally])

  /**
   * **끝난 설문은 결과만 보여 준다.**
   * 잠긴 체크박스를 늘어놓으면 "왜 눌리지 않지" 를 먼저 겪게 된다.
   * 받는 화면과 결과 화면을 가르는 것이 이 조각이다.
   */
  if (!open) {
    const rows = s.options.map((o) => ({
      optionId: o.id, position: o.position, title: o.title,
      votes: tally?.get(o.id) ?? 0, voters: [] as string[],
    }))
    const anyTally = tally !== null
    return (
      <section aria-labelledby={`survey-${s.id}`}>
        <div className="survey-head">
          <span className="tag">마감</span>
          <h3 id={`survey-${s.id}`}>{s.title}</h3>
          {s.intro && <p className="survey-intro">{s.intro}</p>}
          <span className="survey-deadline closed">{koDeadline(s.closesAt)} 마감됨</span>
        </div>

        {anyTally
          ? (
            <div className="survey-result">
              <p className="survey-result-sum">
                <b>{total}명</b>이 참여했습니다.
              </p>
              <ResultChart rows={rows} total={total} multiChoice={s.multiChoice} />
            </div>
          )
          : (
            <p className="survey-empty">
              마감된 설문입니다. 결과는 운영진이 톡방에 알려 드립니다.
            </p>
          )}
      </section>
    )
  }

  return (
    <section aria-labelledby={`survey-${s.id}`}>
      <div className="survey-head">
        <span className="tag">진행 중</span>
        <h3 id={`survey-${s.id}`}>{s.title}</h3>
        {s.intro && <p className="survey-intro">{s.intro}</p>}
        <span className="survey-deadline">{koDeadline(s.closesAt)}까지</span>
      </div>

      {open && (
        <div className="survey-who">
          <p className="survey-facts" style={{ margin: 0 }}>
            <b>먼저 누구신지 알려 주세요</b>
          </p>
          <div className="survey-who-fields">
            <label className="survey-field zone">
              <span>구역번호</span>
              <input value={zone} inputMode="numeric" autoComplete="off"
                placeholder="4133" disabled={locked}
                onChange={(e) => setZone(e.target.value)} />
            </label>
            <label className="survey-field name">
              <span>이름</span>
              <input value={name} autoComplete="off"
                placeholder="홍길동" disabled={locked}
                onChange={(e) => setName(e.target.value)} />
            </label>
          </div>
          {/* **화면이 거짓말을 하면 안 된다.** 처음에는 "화면 어디에도 보이지 않습니다"
              라고 적었는데, 운영자 화면에서 누가 무엇을 골랐는지 볼 수 있게 되면서
              그 문장이 사실이 아니게 됐다. DB 를 바꿀 때 이 문구도 같이 바꾼다. */}
          <p className="survey-who-note">
            단톡방 프로필과 같게 적어 주세요. 같은 이름이 여러 분 계셔서 구역번호까지 받습니다.
            {' '}다른 회원에게는 이름이 보이지 않고 숫자만 보입니다. 모임을 꾸리기 위해
            운영진은 누가 무엇을 골랐는지 확인합니다.
          </p>
          {!locked && (
            <div className="survey-actions">
              <button type="button" className="survey-submit" disabled={busy}
                onClick={() => { void confirmWho() }}>
                {busy ? '확인 중…' : '확인'}
              </button>
            </div>
          )}
          {locked && (
            <div className="survey-actions">
              <button type="button" className="survey-submit"
                style={{ background: '#fff', color: '#0f6e56', border: '1px solid #0f6e56' }}
                onClick={() => { setLocked(false); setPicked(new Set()); setHad(false); setMsg(null) }}>
                이름 고치기
              </button>
              <span className="survey-status">{zone} {name}</span>
            </div>
          )}
        </div>
      )}

      {s.options.map((o) => {
        const on = picked.has(o.id)
        const votes = tally?.get(o.id) ?? null
        const usable = open && locked
        return (
          <label key={o.id}
            className={`survey-option${on ? ' picked' : ''}${usable ? '' : ' locked'}`}>
            <input
              type={s.multiChoice ? 'checkbox' : 'radio'}
              name={`survey-${s.id}`}
              checked={on}
              disabled={!usable}
              onChange={() => toggle(o.id)} />
            <div className="survey-option-body">
              <div className="survey-option-title">{o.title}</div>
              <Facts o={o} />
              {o.note && <p className="survey-note">{o.note}</p>}
              {o.links.length > 0 && (
                <div className="survey-links">
                  {o.links.map((l) => <LinkChip key={l.url} l={l} />)}
                </div>
              )}
              {votes !== null && (
                <div className="survey-tally">
                  <span className="survey-bar" aria-hidden="true">
                    <i style={{ width: topVotes ? `${Math.round((votes / topVotes) * 100)}%` : '0%' }} />
                  </span>
                  <span className="survey-votes">{votes}표</span>
                </div>
              )}
            </div>
          </label>
        )
      })}

      {open && locked && (
        <div className="survey-actions">
          <button type="button" className="survey-submit" disabled={busy || !picked.size}
            onClick={() => { void send() }}>
            {busy ? '보내는 중…' : had ? '다시 제출' : '제출'}
          </button>
        </div>
      )}

      {msg && (
        <p className={`survey-status survey-message ${msg.kind === 'info' ? '' : msg.kind}`}
          role={msg.kind === 'error' ? 'alert' : 'status'}
          style={{ marginTop: 10 }}>
          {msg.text}
        </p>
      )}
    </section>
  )
}

export function Survey({ category }: { category: SurveyCategory }) {
  const [surveys, setSurveys] = useState<SurveyT[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    fetchSurveys(ac.signal)
      .then((rows) => setSurveys(rows.filter((s) => isVisible(s) && s.category === category)))
      .catch((e: unknown) => {
        if (ac.signal.aborted) return
        setError(e instanceof SurveyUnavailable ? e.reason : '불러오지 못했습니다.')
      })
    return () => ac.abort()
  }, [category])

  if (error) {
    return (
      <p className="survey-empty" role="alert">
        설문을 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.<br />{error}
      </p>
    )
  }
  if (!surveys) return <p className="survey-empty" aria-live="polite">불러오는 중…</p>
  if (!surveys.length) {
    return (
      <p className="survey-empty">
        지금 {CATEGORY[category].short} 설문이 없습니다. 새 설문이 올라오면 톡방에 안내드립니다.
      </p>
    )
  }

  return <>{surveys.map((s) => <OneSurvey key={s.id} s={s} />)}</>
}
