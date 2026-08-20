import { useCallback, useEffect, useState } from 'react'
import {
  adminDelete, adminList, adminNames, adminSave, emptyDraft, emptyOption,
  fetchSurveys, koDeadline, SurveyUnavailable, toDraft,
  type AdminSurvey, type Draft, type DraftOption, type SurveyLinkKind,
} from './lib/survey'

/**
 * 운영자 화면 — 설문 올리기 · 고치기 · 지우기.
 *
 * ── 암호를 어떻게 다루나 ────────────────────────────────────
 * **어디에도 저장하지 않는다.** 이 화면이 들고 있다가 부를 때마다 보내고,
 * 새로고침하면 사라진다. sessionStorage 에 두면 같은 기기를 쓰는 다른 사람이
 * 꺼낼 수 있고, 여기 암호는 두 분이 나눠 쓰는 것이라 더 그렇다.
 *
 * 진짜 검사는 전부 DB 함수 안에서 일어난다. 이 화면의 검사는 손이 덜 가게
 * 도와주는 것일 뿐이고, 화면을 우회해도 서버가 막는다.
 */

const KINDS: { v: SurveyLinkKind; label: string }[] = [
  { v: 'official', label: '공식·예매' },
  { v: 'video', label: '영상' },
  { v: 'article', label: '기사' },
  { v: 'map', label: '지도' },
]

function Field({ label, value, onChange, placeholder, area = false }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; area?: boolean
}) {
  return (
    <label className="survey-field" style={{ marginBottom: 9 }}>
      <span>{label}</span>
      {area
        ? <textarea className="admin-input" rows={3} value={value}
            placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input className="admin-input" value={value}
            placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </label>
  )
}

function OptionEditor({ o, i, total, onChange, onRemove }: {
  o: DraftOption; i: number; total: number
  onChange: (o: DraftOption) => void; onRemove: () => void
}) {
  const set = (k: keyof DraftOption, v: string) => onChange({ ...o, [k]: v })
  const setLink = (n: number, patch: Partial<DraftOption['links'][number]>) =>
    onChange({ ...o, links: o.links.map((l, j) => (j === n ? { ...l, ...patch } : l)) })

  return (
    <div className="admin-option">
      <div className="admin-option-head">
        <strong>후보 {i + 1}</strong>
        {total > 1 && (
          <button type="button" className="admin-mini danger" onClick={onRemove}>이 후보 빼기</button>
        )}
      </div>
      <Field label="제목" value={o.title} onChange={(v) => set('title', v)}
        placeholder="서도호 개인전" />
      <Field label="기간" value={o.period} onChange={(v) => set('period', v)}
        placeholder="2026. 8. 27. ~ 2027. 2. 9." />
      <Field label="장소" value={o.venue} onChange={(v) => set('venue', v)}
        placeholder="국립현대미술관 서울" />
      <Field label="시간" value={o.hours} onChange={(v) => set('hours', v)}
        placeholder="화~일 10:00~19:00 / 월 휴관" />
      <Field label="관람료" value={o.price} onChange={(v) => set('price', v)}
        placeholder="8,000원 / 얼리버드 6,400원" />
      <Field label="알려둘 것" value={o.note} onChange={(v) => set('note', v)} area
        placeholder="예매가 어려운 전시입니다. 줄바꿈도 그대로 보입니다." />

      <div className="admin-links">
        <span className="admin-links-title">참고 링크</span>
        {o.links.map((l, j) => (
          <div className="admin-link-row" key={j}>
            <select className="admin-input kind" value={l.kind}
              onChange={(e) => setLink(j, { kind: e.target.value as SurveyLinkKind })}>
              {KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
            </select>
            <input className="admin-input" value={l.label} placeholder="예매 페이지"
              onChange={(e) => setLink(j, { label: e.target.value })} />
            <input className="admin-input" value={l.url} placeholder="https://…"
              onChange={(e) => setLink(j, { url: e.target.value })} />
            <button type="button" className="admin-mini danger"
              onClick={() => onChange({ ...o, links: o.links.filter((_, k) => k !== j) })}>빼기</button>
          </div>
        ))}
        <button type="button" className="admin-mini"
          onClick={() => onChange({ ...o, links: [...o.links, { kind: 'official', label: '', url: '' }] })}>
          링크 넣기
        </button>
        <p className="admin-hint">
          영상은 종류를 「영상」으로 두면 다른 색 칩으로 보입니다. 주소는 https 로 시작해야 합니다.
        </p>
      </div>
    </div>
  )
}

export function SurveyAdmin() {
  const [pw, setPw] = useState('')
  const [authed, setAuthed] = useState(false)
  const [names, setNames] = useState<string[]>([])
  const [list, setList] = useState<AdminSurvey[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'error' | 'done'; text: string } | null>(null)

  const say = (e: unknown, fallback: string) =>
    setMsg({ kind: 'error', text: e instanceof SurveyUnavailable ? e.reason : fallback })

  const reload = useCallback(async (password: string) => {
    const [ns, ls] = await Promise.all([adminNames(password), adminList(password)])
    setNames(ns)
    setList(ls)
    return ns
  }, [])

  const login = async () => {
    if (!pw.trim()) { setMsg({ kind: 'error', text: '암호를 적어 주세요.' }); return }
    setBusy(true); setMsg(null)
    try {
      await reload(pw)
      setAuthed(true)
    } catch (e) { say(e, '들어가지 못했습니다.') } finally { setBusy(false) }
  }

  const startNew = () => {
    const d = emptyDraft()
    setDraft({ ...d, createdBy: names[0] ?? '' })
    setMsg(null)
  }

  const startEdit = async (id: string) => {
    setBusy(true); setMsg(null)
    try {
      const all = await fetchSurveys()
      const found = all.find((s) => s.id === id)
      if (!found) { setMsg({ kind: 'error', text: '설문을 찾지 못했습니다.' }); return }
      setDraft(toDraft(found))
    } catch (e) { say(e, '불러오지 못했습니다.') } finally { setBusy(false) }
  }

  const save = async () => {
    if (!draft) return
    setBusy(true); setMsg(null)
    try {
      await adminSave(pw, draft)
      await reload(pw)
      setDraft(null)
      setMsg({ kind: 'done', text: draft.id ? '고쳤습니다.' : '올렸습니다.' })
    } catch (e) { say(e, '저장하지 못했습니다.') } finally { setBusy(false) }
  }

  const remove = async (s: AdminSurvey) => {
    const warn = s.responseCount > 0
      ? `「${s.title}」을 지웁니다. 응답 ${s.responseCount}건도 화면에서 함께 사라집니다. 계속할까요?`
      : `「${s.title}」을 지웁니다. 계속할까요?`
    // eslint-disable-next-line no-alert
    if (!window.confirm(warn)) return
    setBusy(true); setMsg(null)
    try {
      await adminDelete(pw, s.id)
      await reload(pw)
      setMsg({ kind: 'done', text: '지웠습니다.' })
    } catch (e) { say(e, '지우지 못했습니다.') } finally { setBusy(false) }
  }

  useEffect(() => { if (authed && !draft && !names.length) void reload(pw) }, [authed, draft, names.length, pw, reload])

  /* ── 암호 ─────────────────────────────────────────────── */

  if (!authed) {
    return (
      <div className="survey-who">
        <p className="survey-facts" style={{ margin: 0 }}><b>운영자 확인</b></p>
        <p className="survey-who-note" style={{ marginTop: 6 }}>
          설문을 올리거나 고치려면 운영자 암호가 필요합니다. 암호는 저장하지 않고,
          새로고침하면 다시 물어봅니다.
        </p>
        <label className="survey-field" style={{ marginTop: 10 }}>
          <span>운영자 암호</span>
          <input className="admin-input" type="password" value={pw} autoComplete="off"
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void login() }} />
        </label>
        <div className="survey-actions">
          <button type="button" className="survey-submit" disabled={busy}
            onClick={() => { void login() }}>{busy ? '확인 중…' : '들어가기'}</button>
        </div>
        {msg && <p className="survey-status survey-message error" role="alert">{msg.text}</p>}
      </div>
    )
  }

  /* ── 편집 ─────────────────────────────────────────────── */

  if (draft) {
    const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })
    return (
      <div className="admin-form">
        <h3 className="admin-title">{draft.id ? '설문 고치기' : '새 설문 올리기'}</h3>

        <Field label="설문 제목" value={draft.title} onChange={(v) => set({ title: v })}
          placeholder="9월 정기 관람 전시 추천" />
        <Field label="안내 문구" value={draft.intro} onChange={(v) => set({ intro: v })} area
          placeholder="아래 후보 가운데 함께 보고 싶은 전시를 골라 주세요." />

        <div className="admin-row">
          <label className="survey-field" style={{ flexGrow: 1 }}>
            <span>올린 사람</span>
            <select className="admin-input" value={draft.createdBy}
              onChange={(e) => set({ createdBy: e.target.value })}>
              {!draft.createdBy && <option value="">고르세요</option>}
              {names.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="survey-field" style={{ width: 120 }}>
            <span>며칠까지</span>
            <input className="admin-input" type="number" min={1} max={90} value={draft.days}
              onChange={(e) => set({ days: Number(e.target.value) || 1 })} />
          </label>
        </div>
        <p className="admin-hint">
          오늘부터 {draft.days}일 뒤인 <b>{koDeadline(new Date(Date.now() + draft.days * 86_400_000).toISOString())}</b>에 마감됩니다.
          {draft.id && ' 고칠 때도 지금부터 다시 셉니다.'}
        </p>

        <div className="admin-row">
          <label className="survey-field" style={{ flexGrow: 1 }}>
            <span>고르는 방식</span>
            <select className="admin-input" value={draft.multiChoice ? 'multi' : 'one'}
              onChange={(e) => set({ multiChoice: e.target.value === 'multi' })}>
              <option value="multi">여러 개 고르기 (추천 받을 때)</option>
              <option value="one">하나만 고르기 (최종 투표)</option>
            </select>
          </label>
        </div>

        <div className="admin-row">
          <label className="survey-field" style={{ flexGrow: 1 }}>
            <span>결과 공개</span>
            <select className="admin-input" value={draft.resultsVisible}
              onChange={(e) => set({ resultsVisible: e.target.value as Draft['resultsVisible'] })}>
              <option value="always">응답하면 바로</option>
              <option value="after_close">마감 뒤에</option>
              <option value="admin">운영자만</option>
            </select>
          </label>
          <label className="survey-field" style={{ flexGrow: 1 }}>
            <span>참여자 이름</span>
            <select className="admin-input" value={draft.showNames}
              onChange={(e) => set({ showNames: e.target.value as Draft['showNames'] })}>
              <option value="none">보이지 않음</option>
              <option value="participants">참여한 사람만 보임</option>
            </select>
          </label>
        </div>
        <p className="admin-hint">
          누가 무엇을 골랐는지는 어느 설정에서도 보이지 않습니다.
        </p>

        {draft.options.map((o, i) => (
          <OptionEditor key={i} o={o} i={i} total={draft.options.length}
            onChange={(next) => set({ options: draft.options.map((x, j) => (j === i ? next : x)) })}
            onRemove={() => set({ options: draft.options.filter((_, j) => j !== i) })} />
        ))}

        {draft.options.length < 5 && (
          <button type="button" className="admin-mini"
            onClick={() => set({ options: [...draft.options, emptyOption()] })}>
            후보 넣기 ({draft.options.length}/5)
          </button>
        )}

        <div className="survey-actions" style={{ marginTop: 16 }}>
          <button type="button" className="survey-submit" disabled={busy}
            onClick={() => { void save() }}>
            {busy ? '저장 중…' : draft.id ? '고친 내용 저장' : '설문 올리기'}
          </button>
          <button type="button" className="admin-mini" onClick={() => { setDraft(null); setMsg(null) }}>
            그만두기
          </button>
        </div>
        {msg && (
          <p className={`survey-status survey-message ${msg.kind}`}
            role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>
        )}
      </div>
    )
  }

  /* ── 목록 ─────────────────────────────────────────────── */

  return (
    <div>
      <div className="survey-actions" style={{ marginBottom: 14 }}>
        <button type="button" className="survey-submit" onClick={startNew}>새 설문 올리기</button>
      </div>

      {msg && (
        <p className={`survey-status survey-message ${msg.kind}`}
          role={msg.kind === 'error' ? 'alert' : 'status'}
          style={{ marginBottom: 12 }}>{msg.text}</p>
      )}

      {!list.length && <p className="survey-empty">아직 올린 설문이 없습니다.</p>}

      {list.map((s) => (
        <div className="admin-card" key={s.id}>
          <div className="admin-card-title">{s.title}</div>
          <p className="survey-facts" style={{ marginTop: 6 }}>
            <b>마감</b> {koDeadline(s.closesAt)}<br />
            <b>후보</b> {s.optionCount}개 · <b>응답</b> {s.responseCount}건<br />
            <b>올린 사람</b> {s.createdBy}
          </p>
          <div className="survey-actions" style={{ marginTop: 10 }}>
            <button type="button" className="admin-mini" disabled={busy}
              onClick={() => { void startEdit(s.id) }}>고치기</button>
            <button type="button" className="admin-mini danger" disabled={busy}
              onClick={() => { void remove(s) }}>지우기</button>
          </div>
        </div>
      ))}
    </div>
  )
}
