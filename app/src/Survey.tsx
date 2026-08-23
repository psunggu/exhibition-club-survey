import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CATEGORY, fetchMyChoices, fetchResponseCount, fetchSurveys, fetchTally,
  isOpen, isVisible, koDeadline, memberOk, rosterOn, submitResponse, SurveyUnavailable,
  type Survey as SurveyT, type SurveyCategory, type SurveyLink, type SurveyOption,
} from './lib/survey'
import { Analysis, Metrics, ResultChart, summarize } from './SurveyChart'
import { meetupOfSurvey, splitByHistory } from './lib/surveyHistory'

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

/**
 * 마감된 설문에서 **후보의 안내를 잃지 않게** 접어서 남긴다.
 *
 * 마감되면 후보 칸이 통째로 사라지는데, 그때 예매 링크·참고 영상·운영시간·
 * 「얼리버드 언제까지」 같은 note 까지 함께 사라졌다.
 * 9월 설문은 얼리버드가 8/26 에 끝나고 전시는 8/27 에 여는데,
 * 정작 그 안내가 마감과 동시에 화면에서 없어졌다 — 아직 필요한 정보다.
 *
 * 펼쳐 두지 않는 이유는 결과부터 보여 주려는 것이다. 접힌 채로 두면
 * 결과 화면의 성격은 그대로 두면서 필요한 사람만 열어 볼 수 있다.
 */
function OptionDetails({ options, category }: {
  options: SurveyOption[]; category: SurveyCategory
}) {
  const worth = options.filter((o) => o.links.length > 0 || o.note
    || o.period || o.venue || o.hours || o.price)
  if (!worth.length) return null
  return (
    <details className="survey-details">
      <summary>후보 자세히 보기 ({worth.length}개)</summary>
      <p className="survey-details-hint">
        {category === 'meal'
          ? '설문은 마감됐지만 가게 정보는 그대로 둡니다. 순서는 톡방 투표 항목 그대로입니다.'
          : '설문은 마감됐지만 예매와 관람에 필요한 안내는 그대로 둡니다.'}
      </p>
      {worth.map((o) => (
        <div className="survey-details-item" key={o.id}>
          <div className="survey-option-title">{o.title}</div>
          <Facts o={o} category={category} />
          {o.note && <p className="survey-note">{o.note}</p>}
          {o.links.length > 0 && (
            <div className="survey-links">
              {o.links.map((l) => <LinkChip key={l.url} l={l} />)}
            </div>
          )}
        </div>
      ))}
    </details>
  )
}

function Facts({ o, category }: { o: SurveyOption; category: SurveyCategory }) {
  // 식당에 `관람료` 라고 쓰면 딴 얘기가 된다. 갈래에 따라 말이 달라져야 한다.
  const meal = category === 'meal'
  const rows: [string, string][] = []
  if (o.period) rows.push(['기간', o.period])
  if (o.venue) rows.push(['장소', o.venue])
  if (o.hours) rows.push([meal ? '영업시간' : '시간', o.hours])
  if (o.price) rows.push([meal ? '1인 예산' : '관람료', o.price])
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
      /**
       * **명부에 있는 사람인지 여기서 먼저 알려 준다.**
       * 서버도 제출할 때 막지만, 그때 알려 주면 다 고르고 나서 되돌아와야 한다.
       * 이름을 확정하는 이 자리가 바로잡기 가장 쉬운 순간이다.
       *
       * 명부가 비어 있으면 이 함수가 false 를 주는데, 그때는 막지 않는다 —
       * 서버도 같은 규칙이라 화면만 막으면 앞뒤가 안 맞는다.
       */
      const [ok, roster] = await Promise.all([memberOk(z, n), rosterOn()])
      if (roster && !ok) {
        /**
         * **무엇이 잘못됐는지 그대로 말한다.**
         * 처음에는 캐내는 사람에게 힌트가 될까 봐 「이 설문에 응답할 수 없습니다」 로 뭉갰는데,
         * 이 자리에는 다른 실패 이유가 없다 — 거절이 곧 "명부에 없다" 라서
         * 뭉개도 감춰지는 것이 없었다. 정작 회원만 왜 안 되는지 모르게 됐다.
         * 서버가 내는 문장과 같게 둔다.
         */
        setMsg({ kind: 'error',
          text: '등록된 회원이 아닙니다. 구역번호와 이름을 단톡방 프로필과 같게 적어 주세요.' })
        return
      }
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
  if (!open || s.mirrored) {
    const rows = s.options.map((o) => ({
      optionId: o.id, position: o.position, title: o.title,
      votes: tally?.get(o.id) ?? 0, voters: [] as string[],
    }))
    const anyTally = tally !== null
    return (
      <section className={open ? undefined : 'survey-off'}
        aria-labelledby={`survey-${s.id}`}>
        <div className="survey-head">
          <span className="tag">{s.mirrored && open ? '톡방에서 진행 중' : '마감'}</span>
          <h3 id={`survey-${s.id}`}>{s.title}</h3>
          {s.intro && <p className="survey-intro">{s.intro}</p>}
          <span className={`survey-deadline${open ? '' : ' closed'}`}>
            {open ? `${koDeadline(s.closesAt)}까지` : `${koDeadline(s.closesAt)} 마감됨`}
          </span>
          {s.mirrored && (
            <p className="survey-mirror-note">
              이 투표는 <b>톡방에서 진행합니다.</b> 이 화면은 결과를 옮겨 보여 드리는 곳이라
              여기서는 고르실 수 없습니다.
            </p>
          )}
          {/* 후보 하나에 붙일 수 없는 문서 — 열세 곳을 한꺼번에 다루는 검토 문서 같은 것 */}
          {s.links.length > 0 && (
            <div className="survey-links survey-doc-links">
              {s.links.map((l) => <LinkChip key={l.url} l={l} />)}
            </div>
          )}
        </div>

        {anyTally
          ? (
            <div className="survey-result">
              <p className="survey-result-sum">
                <b>{total}명</b>이 참여했습니다.
              </p>
              <ResultChart rows={rows} total={total} multiChoice={s.multiChoice} />
              {/* 마감된 설문에는 지표와 읽을 거리를 함께 둔다.
                  작품 특징 표는 채워진 것이 있을 때만 뜬다 —
                  가게 이름뿐인 설문에서는 "확인 필요" 만 늘어서기 때문이다. */}
              <Metrics rows={rows} total={total} multiChoice={s.multiChoice} />
              <Analysis rows={rows} options={s.options} total={total} />
              <OptionDetails options={s.options} category={s.category} />
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
            <b>단톡방 프로필과 같게</b> 적어 주세요.
            {' '}이름은 다른 회원에게 보이지 않고 운영진만 확인합니다.
          </p>
          {!locked && (
            <div className="survey-actions">
              <button type="button" className="survey-submit" disabled={busy}
                onClick={() => { void confirmWho() }}>
                {busy ? '확인 중…' : '확인'}
              </button>
            </div>
          )}
          {/**
            * 이름에 대한 답은 **이름 칸 옆에서** 한다.
            * 아래쪽에만 두었더니 후보 네 개를 지나 화면 밖에 떠서,
            * 「등록된 회원이 아닙니다」 를 눌러 놓고도 아무 일도 안 일어난 것처럼 보였다.
            * 고칠 곳이 바로 위에 있는데 답이 저 아래 있으면 안 된다.
            */}
          {!locked && msg && (
            <p className={`survey-status survey-message ${msg.kind === 'info' ? '' : msg.kind}`}
              role={msg.kind === 'error' ? 'alert' : 'status'}
              style={{ marginTop: 10 }}>
              {msg.text}
            </p>
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
              <Facts o={o} category={s.category} />
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

      {/* 이름을 확정한 뒤의 답(제출 결과 따위)만 여기 둔다.
          확정 전 것은 위 이름 칸 옆에서 이미 보여 줬다 — 두 번 뜨면 안 된다. */}
      {locked && msg && (
        <p className={`survey-status survey-message ${msg.kind === 'info' ? '' : msg.kind}`}
          role={msg.kind === 'error' ? 'alert' : 'status'}
          style={{ marginTop: 10 }}>
          {msg.text}
        </p>
      )}
    </section>
  )
}

/**
 * 지난 설문 한 줄 — **접힌 채로도 무엇이었는지 알 수 있어야 한다.**
 *
 * 접으면 화면 낭독기는 summary 만 읽고, 브라우저에 따라 페이지 안 검색에도 안 걸린다.
 * 그러니 「자세히 보기」 같은 말로 접으면 안 된다. 무엇을 정한 설문이었는지,
 * 어느 모임 것이었는지, 어떻게 끝났는지가 **접힌 줄 안에** 다 들어 있어야 한다.
 *
 * 안을 열기 전에는 그리지 않는다. 닫힌 <details> 안에 두어도 React 는 그려 두므로
 * 볼 사람도 없는 집계를 매번 불러오게 된다.
 */
function SurveyHistoryItem({ s }: { s: SurveyT }) {
  const meet = meetupOfSurvey(s.id)
  const [opened, setOpened] = useState(false)
  const [sum, setSum] = useState<{ result: string; people: number } | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    Promise.all([fetchTally(s.id, ac.signal), fetchResponseCount(s.id, ac.signal)])
      .then(([t, n]) => {
        const total = Number(n) || 0
        const rows = s.options.map((o) => ({
          optionId: o.id, position: o.position, title: o.title,
          votes: t.get(o.id) ?? 0, voters: [] as string[],
        }))
        const m = summarize(rows, total)
        // 동점이면 하나만 적으면 거짓말이 된다 — 화면의 다른 곳과 같은 규칙을 쓴다.
        const result = !m.votes || !m.leaders.length
          ? '집계가 남아 있지 않습니다'
          : m.leaders.length === 1
            ? `${m.leaders[0]!.title} ${m.top}명`
              + (total > 0 ? ` (${Math.round(m.topShare * 100)}%)` : '')
            : `${m.leaders.map((r) => r.title).join(' · ')} 공동 1위 (각 ${m.top}명)`
        setSum({ result, people: total })
      })
      .catch(() => setSum(null))       // 못 읽으면 결과 줄만 비운다
    return () => ac.abort()
  }, [s.id, s.options])

  return (
    <details
      className="survey-past"
      onToggle={(e) => setOpened((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        <span className="survey-past-title">{s.title}</span>
        <span className="survey-past-facts">
          <span><b>연관 전시 관람</b>{' '}
            {meet ? `${meet.title} · ${meet.dateLabel}` : '이어진 모임 없음'}</span>
          <span><b>설문 결과</b>{' '}{sum ? sum.result : '불러오는 중…'}</span>
          <span><b>종료된 일자</b>{' '}{koDeadline(s.closesAt)}
            {sum && sum.people > 0 ? ` · ${sum.people}명 참여` : ''}</span>
        </span>
      </summary>
      {/* 열었을 때에만 그린다. 안에는 원래 마감 화면이 그대로 들어간다 —
          집계 그래프도, 후보 안내도 잃지 않는다. */}
      {opened && <div className="survey-past-body"><OneSurvey s={s} /></div>}
    </details>
  )
}

/**
 * **모임까지 끝난 설문을 따로 모은다.**
 *
 * 식사 설문은 hide_after_days 가 없어 목록에서 영영 안 내려간다.
 * 그래서 다녀온 지 한참 지난 투표가 화면 맨 위를 차지하고 있었다.
 * 지우지는 않는다 — 어디서 먹었는지, 몇 명이 골랐는지는 두고두고 찾는 기록이다.
 */
function SurveyHistory({ items }: { items: SurveyT[] }) {
  if (!items.length) return null
  return (
    <section className="survey-history" aria-labelledby="surveyHistoryTitle">
      <h2 id="surveyHistoryTitle">지난 설문 ({items.length})</h2>
      <p className="survey-history-hint">
        모임까지 끝난 설문입니다. 결과는 지우지 않고 그대로 둡니다.
      </p>
      {items.map((s) => <SurveyHistoryItem key={s.id} s={s} />)}
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

  // 모임까지 끝난 것은 아래 「지난 설문」 으로 내린다. 지우지는 않는다.
  const { live, past } = splitByHistory(surveys)
  return (
    <>
      {live.map((s) => <OneSurvey key={s.id} s={s} />)}
      {!live.length && past.length > 0 && (
        <p className="survey-empty">
          지금 {CATEGORY[category].short} 설문이 없습니다. 새 설문이 올라오면 톡방에 안내드립니다.
        </p>
      )}
      <SurveyHistory items={past} />
    </>
  )
}
