import { useCallback, useEffect, useRef, useState } from 'react'
import {
  adminDelete, adminList, adminMemberDelete, adminMembers, adminMemberSave,
  adminNames, adminNote, adminNoteSave,
  adminRespondents, adminResults, adminSave,
  emptyDraft, emptyOption, fetchResponseCount, fetchSurveys, fromDateInput,
  formatPeriod, koDay, koDeadline, koShort, parsePeriod, SurveyUnavailable, toDateInput, toDraft,
  type AdminResult, type AdminRespondent, type AdminSurvey,
  type Draft, type DraftOption, type Member, type SurveyLinkKind,
  type SurveyOption,
} from './lib/survey'
import { fetchEvents } from './lib/events'
import { boardPicks, type BoardPick } from './lib/pickFromBoard'
import { MOVIES } from './data/movies'
import { Analysis, Metrics, ResultChart } from './SurveyChart'

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

/**
 * 구역 열 곳에 줄 색. **검증기로 찾아낸 것이라 손으로 고치지 않는다.**
 * 하나라도 바꾸면 맞닿은 조각의 분리도가 무너진다 —
 * 바꿔야 하면 dataviz 의 validate_palette 로 다시 찾아야 한다.
 * 차례가 곧 조각 차례다. 밝기가 한 칸씩 번갈아 오르내린다.
 */
const ZONE_COLORS = [
  '#c1507a', '#f68262', '#aa6f05', '#b1ae1e', '#3a933d',
  '#14c2ab', '#008ca5', '#61acfd', '#7b6bd0', '#d585dd',
] as const

/**
 * 같은 색을 **글자에 쓸 때의 짝.**
 *
 * 위 조각 색을 글자에 그대로 쓰면 안 된다 — 바탕(#fbfaf7)에서 대비가 2.16~4.28:1 이라
 * 본문 기준 4.5:1 을 못 넘는다. 흐린 글씨는 나이 드신 분이 먼저 못 읽는다.
 *
 * 그래서 **색상과 채도는 그대로 두고 밝기만 내려** 4.5:1 을 넘긴 값을 계산해 뒀다.
 * 조각과 글자가 같은 색으로 보이면서 읽히기도 한다. 열 개 모두 통과한다.
 * 위 배색을 바꾸면 이것도 다시 계산해야 한다.
 */
const ZONE_INK = [
  '#bc4b76', '#bf5031', '#a06600', '#7b7600', '#28842d',
  '#00816d', '#007e97', '#2875c2', '#7565c9', '#a154a9',
] as const

const zoneColor = (i: number) => ZONE_COLORS[i % ZONE_COLORS.length]!
const zoneInk = (i: number) => ZONE_INK[i % ZONE_INK.length]!

const KINDS: { v: SurveyLinkKind; label: string }[] = [
  { v: 'official', label: '공식·예매' },
  { v: 'video', label: '영상' },
  { v: 'article', label: '기사' },
  { v: 'map', label: '지도' },
]

/**
 * 결과 — 후보별 표 수와 **누가 골랐는지**.
 *
 * 이름이 나오는 유일한 자리다. 암호 뒤에 있고, 회원 화면에는 지금도 숫자만 나온다.
 * 운영진이 모임을 꾸리려면 누가 오는지 알아야 해서 여는 것이다.
 */
/**
 * 분석 메모 — 밖에서 정리한 내용을 붙여 두는 자리.
 *
 * 접어 둔다. 결과를 보러 온 사람이 긴 글을 먼저 만나면 정작 숫자를 못 본다.
 * 열어서 고칠 수 있고, 비우면 지워진다.
 */
function Note({ pw, surveyId, onError }: {
  pw: string; surveyId: string; onError: (e: unknown) => void
}) {
  const [body, setBody] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const ac = new AbortController()
    adminNote(pw, surveyId, ac.signal)
      .then((v) => { setBody(v); setDraft(v) })
      .catch((e: unknown) => { if (!ac.signal.aborted) onError(e) })
    return () => ac.abort()
  }, [pw, surveyId, onError])

  const save = async () => {
    setBusy(true); setSaved(false)
    try {
      await adminNoteSave(pw, surveyId, draft)
      setBody(draft.trim())
      setEditing(false)
      setSaved(true)
    } catch (e) { onError(e) } finally { setBusy(false) }
  }

  if (body === null) return null

  return (
    <details className="note" open={editing || undefined}>
      <summary className="note-head">
        <span>운영진 참고 · 분석 메모</span>
        <span className="note-state">{body ? '있음' : '아직 없음'}</span>
      </summary>
      <div className="note-body">
        {editing
          ? (
            <>
              <textarea className="admin-input" rows={12} value={draft}
                placeholder="밖에서 정리한 분석을 붙여 넣으세요. 줄바꿈은 그대로 보입니다."
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
                ? <p className="note-text">{body}</p>
                : <p className="admin-hint" style={{ margin: 0 }}>
                    아직 적어 둔 분석이 없습니다.
                  </p>}
              <div className="survey-actions" style={{ marginTop: 10 }}>
                <button type="button" className="admin-mini"
                  onClick={() => setEditing(true)}>{body ? '고치기' : '적기'}</button>
                {saved && <span className="survey-status done">저장했습니다.</span>}
              </div>
            </>
          )}

        {/* 편집 중에만 띄웠더니 저장한 뒤 사라졌다 — 정작 글이 담긴 뒤에 안 보인다.
            탭이 열려 있는 동안 늘 보이게 둔다. */}
        <p className="admin-hint" style={{ marginTop: 10, marginBottom: 0 }}>
          이 메모는 <b>운영자 화면에서만</b> 보입니다. 회원 화면에는 나오지 않습니다.
        </p>
      </div>
    </details>
  )
}

function Results({ pw, surveyId, multiChoice, onError }: {
  pw: string; surveyId: string; multiChoice: boolean; onError: (e: unknown) => void
}) {
  const [rows, setRows] = useState<AdminResult[] | null>(null)
  const [people, setPeople] = useState<AdminRespondent[]>([])
  /**
   * **참여 인원을 응답자 목록 길이로 세면 안 된다.**
   * 톡방에서 옮겨 온 설문은 응답자 행이 하나도 없다 — 사람을 지어내지 않았기 때문이다.
   * 그래서 목록은 비어 있는데 실제 참여는 13명이다.
   * 목록 카드는 survey_response_count 를 쓰는데 여기서는 안 써서,
   * 카드는 "응답 13건" · 결과는 "참여 0명" 으로 어긋났다.
   */
  const [total, setTotal] = useState(0)
  // 분석에는 후보의 관람료·장소·기간이 필요하다. 그건 공개 표라 그냥 읽는다 —
  // 이것 때문에 함수를 새로 만들 이유가 없다.
  const [options, setOptions] = useState<SurveyOption[]>([])

  useEffect(() => {
    const ac = new AbortController()
    Promise.all([
      adminResults(pw, surveyId, ac.signal),
      adminRespondents(pw, surveyId, ac.signal),
      fetchSurveys(ac.signal),
      fetchResponseCount(surveyId, ac.signal),
    ])
      .then(([r, p, all, n]) => {
        setRows(r); setPeople(p)
        setTotal(Number(n) || 0)
        setOptions(all.find((s) => s.id === surveyId)?.options ?? [])
      })
      .catch((e: unknown) => { if (!ac.signal.aborted) onError(e) })
    return () => ac.abort()
  }, [pw, surveyId, onError])

  if (!rows) return <p className="admin-hint" aria-live="polite">결과를 불러오는 중…</p>

  return (
    <div className="admin-results">
      <p className="admin-results-sum">
        참여 <b>{total}명</b>
        {total > 0 && <> · 고른 항목 <b>{rows.reduce((n, r) => n + r.votes, 0)}개</b></>}
      </p>

      <ResultChart rows={rows} total={total} multiChoice={multiChoice} />

      {/* 위 차트가 크기를 보여 주므로 여기서는 **막대를 다시 그리지 않는다.**
          같은 데이터를 두 번 그리면 어느 쪽을 봐야 할지 헷갈린다.
          이 목록이 맡는 것은 차트가 못 보여 주는 것 — 누가 골랐는지다. */}
      {rows.map((r) => (
        <div className="admin-result" key={r.optionId}>
          <div className="admin-result-head">
            <span className="admin-result-title">{r.position}. {r.title}</span>
            <span className="admin-result-votes">{r.votes}표</span>
          </div>
          {r.voters.length > 0
            /* key 에 이름을 쓰지 않는다 — 동명이인이 있으면 React 가 같은 줄로 본다.
               명부에 실제로 동명이인이 있어서 가정이 아니라 사실이다. */
            ? (
              <p className="admin-voters">
                {r.voters.map((v, i) => (
                  <span className="admin-voter" key={`${r.optionId}-${i}`}>{v}</span>
                ))}
              </p>
            )
            : <p className="admin-hint" style={{ margin: '6px 0 0' }}>아직 고른 사람이 없습니다.</p>}
        </div>
      ))}

      {/**
        * **이름을 옮겨 온 설문에서는 이 문장이 거짓이 된다.**
        * 「누가 골랐는지는 없습니다」 는 옮겨 온 설문에 응답 행이 없어서 참이었는데,
        * 이제 후보마다 이름을 담을 수 있어 위에 이름이 떠 있을 수 있다.
        * 그대로 두면 운영자 화면만 「없습니다」 라고 말한다.
        */}
      {people.length === 0 && total > 0 && (
        <p className="admin-hint" style={{ marginTop: 12 }}>
          {/**
            * **`rows[].voters` 로 가르면 안 된다.** 그 배열에는 두 가지가 섞여 들어온다 —
            * 옮겨 적은 이름(imported_voters)과 실제 응답자(`구역번호 이름`).
            * 후자는 옛 응답에만 남아 있고 그것 때문에 이 문장이 뒤집히면 안 된다.
            * `options` 쪽을 보면 **옮겨 적은 이름이 있을 때만** 참이다.
            */}
          {options.some((o) => o.importedVoters.length > 0)
            ? '이 설문은 밖(톡방)에서 진행된 것을 옮겨 왔습니다. 응답 행이 없어 아래 '
              + '「참여한 사람」 목록은 비어 있고, 후보마다 옮겨 적은 이름이 위에 있습니다. '
              + '그 이름은 회원 화면에도 그대로 보입니다.'
            : '이 설문은 밖(톡방)에서 진행된 것을 옮겨 왔습니다. 숫자만 있고 '
              + '누가 골랐는지는 없습니다 — 없는 사람을 지어내지 않았습니다.'}
        </p>
      )}

      {people.length > 0 && (
        <div className="admin-people">
          <span className="admin-links-title">참여한 사람 ({people.length}명)</span>
          {people.map((p) => (
            <div className="admin-person" key={p.who}>
              <span>{p.who}</span>
              <span className="admin-person-meta">{p.picks}개 · {koShort(p.answeredAt)}</span>
            </div>
          ))}
        </div>
      )}

      <Metrics rows={rows} total={total} multiChoice={multiChoice} />

      {options.length > 0 && (
        <Analysis rows={rows} options={options} total={total} />
      )}

      <Note pw={pw} surveyId={surveyId} onError={onError} />

      {/**
        * **이 문장은 이제 늘 참이 아니다.**
        * 사이트에서 받은 응답의 이름은 운영자 화면에만 나온다 — 그것은 그대로다.
        * 그런데 톡방 투표를 옮겨 오면서 담은 이름(imported_voters)은 **회원 화면에도 뜬다.**
        * 두 경우를 한 문장으로 묶으면 운영자가 「여기서만 보인다」 고 믿고 이름을 넣는다.
        */}
      <p className="admin-hint" style={{ marginTop: 12, marginBottom: 0 }}>
        {options.some((o) => o.importedVoters.length > 0)
          ? <>옮겨 적은 이름은 <b>회원 화면에도 그대로</b> 보입니다. 감추려면 설문의
            「이름 보임」 을 끄고 후보의 이름을 지워야 합니다.</>
          : <>이 이름들은 <b>운영자 화면에서만</b> 보입니다. 회원 화면에는 숫자만 나옵니다.</>}
      </p>
    </div>
  )
}

/**
 * 회원 명부.
 *
 * **이 목록이 곧 교인 명부다.** 그래서 운영자 암호를 지나야만 보인다 —
 * 표는 잠겨 있고(정책 없음), 이름을 통째로 돌려주는 함수는 이것 하나뿐이다.
 * 회원 화면은 자기 한 쌍이 맞는지만 물어볼 수 있고 명단은 못 받는다.
 *
 * 접어 두는 이유는 설문 목록을 먼저 보여 주려는 것이고,
 * 어깨너머로 스무 명의 이름이 그냥 펼쳐져 있지 않게 하려는 것이기도 하다.
 */
/**
 * 구역별 인원 — 파이(도넛).
 *
 * ── 색은 **찾아낸 것**이지 고른 것이 아니다 ────────────────
 * 구역이 열 곳이라 열 색이 필요한데, 아무 열 색이나 쓰면 서로 구분되지 않는다.
 * 처음 눈대중으로 고른 열 색은 정상 시력으로도 못 가릴 만큼 가까운 쌍이 있었다
 * (ΔE 9.6, 기준 15). 색각이상에서는 ΔE 3.1 까지 떨어졌다.
 *
 * 그래서 색상각·밝기·채도를 훑어 **기준을 넘는 조합을 찾아냈다.**
 * 밝기를 한 칸씩 번갈아 준 것이 결정적이었다 — 색상만으로는 열 개가 안 갈린다.
 *   · 정상 시력 최악 짝 ΔE 16.0 (기준 15)
 *   · 색각이상 최악 짝 ΔE 11.4 (이름표가 있으면 6 이 바닥)
 * 지금 쓰는 다섯 색과 같은 대역(밝기 0.59~0.73 · 채도 0.15 언저리)이라 옆에 놓아도 이질감이 없다.
 *
 * **바탕과의 대비는 3:1 을 넘지 못한다.** 그래서 조각마다 이름표가 반드시 있어야 한다 —
 * 색만으로 알아보게 두면 안 된다. 이름표를 떼면 이 배색은 쓸 수 없다.
 *
 * 이름표는 구역번호에서 **공통 앞자리를 뗀 나머지**를 쓴다.
 * 지금은 전부 `41` 로 시작해서 뒤 두 자리만 남기면 짧아지고, 조각 위에 들어간다.
 * 구역 체계가 바뀌어 공통 앞자리가 없어지면 저절로 전체 번호를 쓴다.
 */
function ZoneDonut({ rows, total }: { rows: { zone: string; n: number }[]; total: number }) {
  const R = 54
  const W = 24
  const C = 2 * Math.PI * R
  const GAP = 2

  /**
   * 모든 구역이 함께 쓰는 앞자리를 찾는다.
   * 뗀 뒤에 한 글자도 안 남는 구역이 생기면 아예 떼지 않는다 —
   * 빈 이름표는 조각이 어느 구역인지 말해 주지 못한다.
   */
  const common = rows.length > 1
    ? rows.reduce((p, r) => {
      let i = 0
      while (i < p.length && i < r.zone.length && p[i] === r.zone[i]) i += 1
      return p.slice(0, i)
    }, rows[0]!.zone)
    : ''
  const prefix = common && rows.every((r) => r.zone.length > common.length) ? common : ''
  const short = (z: string) => (prefix && z.startsWith(prefix) ? z.slice(prefix.length) : z)

  let at = 0
  const arcs = rows.map((r) => {
    const len = (r.n / total) * C
    const mid = at + len / 2
    const seg = { ...r, len: Math.max(0, len - GAP), off: at, angle: (mid / C) * 360 - 90 }
    at += len
    return seg
  })

  return (
    <div className="zone-chart">
      <svg viewBox="0 0 190 150" className="zone-donut" role="img"
        aria-label={`구역별 인원 — ${rows.map((r) => `${r.zone} ${r.n}명`).join(', ')}`}>
        <g transform="translate(20 0)">
          <circle cx="70" cy="75" r={R} fill="none" stroke="#ece9e1" strokeWidth={W} />
          {arcs.map((a, i) => (
            <circle key={a.zone} cx="70" cy="75" r={R} fill="none"
              stroke={zoneColor(i)} strokeWidth={W}
              strokeDasharray={`${a.len} ${C - a.len}`}
              strokeDashoffset={-a.off}
              transform="rotate(-90 70 75)">
              <title>{a.zone} — {a.n}명</title>
            </circle>
          ))}
          {/* 조각마다 이름표. 이 색들은 바탕과의 대비가 3:1 을 못 넘어서,
              이름표가 없으면 색만으로 조각을 가려야 한다. 그건 안 된다. */}
          {arcs.map((a, i) => {
            const rad = (a.angle * Math.PI) / 180
            return (
              <text key={a.zone} className="zone-slice-label"
                style={{ stroke: zoneColor(i) }}
                x={70 + Math.cos(rad) * R} y={75 + Math.sin(rad) * R + 4}
                textAnchor="middle">{short(a.zone)}</text>
            )
          })}
          <text x="70" y="71" textAnchor="middle" className="chart-donut-num">{total}</text>
          <text x="70" y="87" textAnchor="middle" className="chart-donut-cap">명</text>
        </g>
      </svg>

      <ul className="zone-legend">
        {rows.map((r, i) => (
          <li key={r.zone}>
            <span className="chart-swatch" style={{ background: zoneColor(i) }} aria-hidden="true" />
            <b>{r.zone}</b>
            <span>{r.n}명 · {Math.round((r.n / total) * 100)}%</span>
          </li>
        ))}
      </ul>

      {prefix && (
        <p className="admin-hint" style={{ margin: '8px 0 0' }}>
          조각 위 숫자는 구역번호에서 공통인 <b>{prefix}</b> 를 뗀 뒷자리입니다.
        </p>
      )}
    </div>
  )
}

function Members({ pw, onError }: { pw: string; onError: (e: unknown) => void }) {
  const [rows, setRows] = useState<Member[] | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [edit, setEdit] = useState<Member | null>(null)   // 고치는 중인 회원
  const [zone, setZone] = useState('')
  const [name, setName] = useState('')
  const [at, setAt] = useState(() => toDateInput(new Date().toISOString()))
  const ac = useRef<AbortController | null>(null)

  useEffect(() => () => ac.current?.abort(), [])

  const load = useCallback(async () => {
    ac.current?.abort(); ac.current = new AbortController()
    try { setRows(await adminMembers(pw, ac.current.signal)) }
    catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) onError(e) }
  }, [pw, onError])

  useEffect(() => { if (open && rows === null) void load() }, [open, rows, load])

  const clear = () => {
    setEdit(null); setZone(''); setName('')
    setAt(toDateInput(new Date().toISOString()))
  }

  const save = async () => {
    setBusy(true)
    try {
      await adminMemberSave(pw, {
        id: edit?.id ?? null, zone, name, registeredAt: fromDateInput(at),
      })
      clear()
      setRows(null)          // 다시 읽는다
      await load()
    } catch (e) { onError(e) } finally { setBusy(false) }
  }

  const remove = async (m: Member) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`${m.zone} ${m.name} 님을 명부에서 지웁니다. 계속할까요?`)) return
    setBusy(true)
    try { await adminMemberDelete(pw, m.id); setRows(null); await load() }
    catch (e) { onError(e) } finally { setBusy(false) }
  }

  /**
   * **구역번호를 줄마다 함께 보여 준다.**
   * 예전에는 구역을 묶음 제목으로만 두고 줄에는 이름만 뒀는데,
   * 이름 옆에 아무것도 없어서 어디까지가 번호이고 어디부터가 이름인지 눈에 안 들어왔다.
   * 이제 줄마다 `구역번호 · 이름` 이 나란히 서고, 번호는 다른 모양으로 칠한다.
   */
  const sorted = [...(rows ?? [])].sort((a, b) =>
    a.zone.localeCompare(b.zone) || a.name.localeCompare(b.name, 'ko'))

  /** 구역별 인원 — 파이에 쓴다 */
  const perZone = Object.entries(
    (rows ?? []).reduce<Record<string, number>>((acc, m) => {
      acc[m.zone] = (acc[m.zone] ?? 0) + 1; return acc
    }, {}),
  ).map(([zone, n]) => ({ zone, n })).sort((a, b) => a.zone.localeCompare(b.zone))

  /**
   * 구역이 파이에서 몇 번째 조각인지. **명단 글꼴 색이 그 조각을 따라간다.**
   * 파이와 명단을 잇는 것이 색이므로, 차례가 어긋나면 둘이 다른 이야기를 한다.
   */
  const slotOf = new Map(perZone.map((z, i) => [z.zone, i]))

  return (
    <details className="admin-members" open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>회원 명부{rows ? ` (${rows.length}명)` : ''}</summary>

      <p className="admin-hint" style={{ marginTop: 10 }}>
        명부에 있는 사람만 설문에 응답할 수 있습니다. 구역번호와 이름을
        <b> 단톡방 프로필과 같게</b> 넣어 주세요 — 회원이 적는 것과 글자가 같아야 통과합니다.
        명부가 비어 있는 동안에는 아무도 막지 않습니다.
      </p>

      <div className="admin-row">
        <label className="survey-field" style={{ width: 110 }}>
          <span>구역번호</span>
          <input className="admin-input" value={zone} inputMode="numeric"
            onChange={(e) => setZone(e.target.value)} placeholder="4133" />
        </label>
        <label className="survey-field" style={{ flexGrow: 1 }}>
          <span>이름</span>
          <input className="admin-input" value={name}
            onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
        </label>
        <label className="survey-field" style={{ width: 150 }}>
          <span>등록일자</span>
          <input className="admin-input" type="date" value={at}
            onChange={(e) => setAt(e.target.value)} />
        </label>
      </div>

      <div className="survey-actions" style={{ marginTop: 4, marginBottom: 14 }}>
        <button type="button" className="survey-submit" disabled={busy || !zone.trim() || !name.trim()}
          onClick={() => { void save() }}>
          {busy ? '저장 중…' : edit ? '고친 내용 저장' : '회원 넣기'}
        </button>
        {edit && (
          <button type="button" className="admin-mini" onClick={clear}>그만두기</button>
        )}
      </div>

      {rows === null && <p className="admin-hint">불러오는 중…</p>}
      {rows !== null && !rows.length && (
        <p className="survey-empty">아직 명부가 비어 있습니다. 지금은 누구나 응답할 수 있습니다.</p>
      )}

      {perZone.length > 0 && (
        <>
          <span className="admin-links-title">구역별 인원</span>
          <ZoneDonut rows={perZone} total={(rows ?? []).length} />
        </>
      )}

      {sorted.length > 0 && (
        <div className="admin-memberlist">
          <div className="admin-member head" aria-hidden="true">
            <span className="admin-member-zone">구역번호</span>
            <span className="admin-member-name">이름</span>
            <span className="admin-member-at">등록일자</span>
          </div>
          {sorted.map((m) => {
            const slot = slotOf.get(m.zone) ?? 0
            const ink = zoneInk(slot)
            return (
            <div className="admin-member" key={m.id}>
              {/* 구역번호와 이름은 **그냥 글자다.** 칩으로 감쌌더니 누르는 것처럼 보였고,
                  줄마다 알약이 늘어서서 정작 이름이 안 읽혔다.
                  파이 조각과 잇는 일은 색만으로 충분하다. */}
              <span className="admin-member-zone" style={{ color: ink }}>{m.zone}</span>
              <span className="admin-member-name" style={{ color: ink }}>{m.name}</span>
              <span className="admin-member-at">{koDay(m.registeredAt)}</span>
              <button type="button" className="admin-mini" disabled={busy}
                onClick={() => {
                  setEdit(m); setZone(m.zone); setName(m.name); setAt(toDateInput(m.registeredAt))
                }}>고치기</button>
              <button type="button" className="admin-mini danger" disabled={busy}
                onClick={() => { void remove(m) }}>지우기</button>
            </div>
            )
          })}
        </div>
      )}
    </details>
  )
}

/**
 * 보드에 있는 것을 골라 후보로 넣는다.
 *
 * 후보에 넣을 내용은 이미 보드에 다 있다 — 기간·장소·운영시간·관람료·예매 링크.
 * 그걸 손으로 다시 적는 자리가 틀리는 자리다. 골라서 그대로 가져온다.
 *
 * **보드에 없는 것은 아래에서 손으로 넣으면 된다.** 이 칸은 거들 뿐 대신하지 않는다.
 */
function BoardPicker({ used, room, onAdd }: {
  used: string[]                       // 이미 넣은 제목 — 두 번 넣지 않게
  room: number                         // 앞으로 몇 개 더 넣을 수 있나
  onAdd: (opts: DraftOption[]) => void
}) {
  const [kind, setKind] = useState<'전시' | '공연' | '영화'>('전시')
  const [q, setQ] = useState('')
  const [picks, setPicks] = useState<BoardPick[] | null>(null)
  const [chosen, setChosen] = useState<Set<string>>(new Set())
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    fetchEvents()
      .then((events) => { if (alive) setPicks(boardPicks(events, MOVIES)) })
      // 보드를 못 읽어도 설문 올리기는 되어야 한다 — 손으로 넣는 길이 남아 있다
      .catch(() => { if (alive) { setPicks([]); setErr('보드를 불러오지 못했습니다. 아래에서 손으로 넣어 주세요.') } })
    return () => { alive = false }
  }, [])

  const usedSet = new Set(used.map((t) => t.trim()).filter(Boolean))
  const shown = (picks ?? [])
    .filter((p) => p.kind === kind)
    .filter((p) => !q.trim() || (p.title + p.hint).toLowerCase().includes(q.trim().toLowerCase()))

  const toggle = (key: string) => setChosen((prev) => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })

  const add = () => {
    const opts = (picks ?? []).filter((p) => chosen.has(p.key)).slice(0, room).map((p) => p.toOption())
    if (opts.length) onAdd(opts)
    setChosen(new Set())
  }

  const over = chosen.size > room

  return (
    <details className="admin-picker">
      <summary>보드에서 고르기{picks ? ` (${picks.length}건)` : ''}</summary>

      <p className="admin-hint" style={{ marginTop: 10 }}>
        문화 콘텐츠 공유 보드에 있는 것을 고르면 <b>기간·장소·운영시간·관람료·링크가 함께 들어옵니다.</b>
        넣은 뒤에 고쳐도 됩니다. 보드에 없으면 아래에서 손으로 넣어 주세요.
      </p>
      {err && <p className="admin-warn">{err}</p>}

      <div className="admin-kinds">
        {(['전시', '공연', '영화'] as const).map((k) => (
          <button key={k} type="button"
            className={`admin-kind${kind === k ? ' on' : ''}`}
            aria-pressed={kind === k}
            onClick={() => setKind(k)}>{k}</button>
        ))}
      </div>

      <label className="survey-field" style={{ margin: '10px 0' }}>
        <span>제목으로 찾기</span>
        <input className="admin-input" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="이름 일부를 적으면 걸러집니다" />
      </label>

      {picks === null && <p className="admin-hint">불러오는 중…</p>}
      {picks !== null && !shown.length && (
        <p className="survey-empty">{kind} 가운데 찾는 것이 없습니다. 아래에서 손으로 넣어 주세요.</p>
      )}

      <div className="admin-picklist">
        {shown.map((p) => {
          const already = usedSet.has(p.title)
          return (
            <label key={p.key} className={`admin-pick${already ? ' used' : ''}`}>
              <input type="checkbox" checked={chosen.has(p.key)} disabled={already}
                onChange={() => toggle(p.key)} />
              <span className="admin-pick-body">
                <span className="admin-pick-title">{p.title}</span>
                <span className="admin-pick-hint">{already ? '이미 후보에 있습니다' : p.hint}</span>
              </span>
            </label>
          )
        })}
      </div>

      {chosen.size > 0 && (
        <div className="survey-actions" style={{ marginTop: 12 }}>
          <button type="button" className="survey-submit" disabled={over} onClick={add}>
            고른 {chosen.size}개를 후보로 넣기
          </button>
          <button type="button" className="admin-mini" onClick={() => setChosen(new Set())}>
            선택 지우기
          </button>
        </div>
      )}
      {over && (
        <p className="admin-warn" style={{ marginTop: 10 }}>
          후보는 5개까지입니다. <b>{room}개</b>만 더 넣을 수 있는데 {chosen.size}개를 고르셨습니다.
        </p>
      )}
    </details>
  )
}

/**
 * **비어 있을 때 Tab 을 누르면 예시가 그대로 채워진다.**
 *
 * 예시(placeholder)가 대개 그대로 쓸 만한 문장인데, 지금은 눈으로 읽고 손으로 옮겨 적어야 했다.
 * 옮겨 적는 자리는 틀리는 자리다.
 *
 * Tab 을 가로채는 것이 조심스러워서 **비어 있을 때만** 가로챈다.
 * 한 번 채워지면 Tab 은 원래대로 다음 칸으로 넘어간다 — 칸에 갇히지 않는다.
 * 예시가 싫으면 그냥 타이핑을 시작하면 되고, 채워진 것을 지우고 Tab 하면 넘어간다.
 */
function useTabToFill(value: string, placeholder: string | undefined, onChange: (v: string) => void) {
  return (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key !== 'Tab' || e.shiftKey) return
    if (value.trim() || !placeholder?.trim()) return   // 이미 적었거나 채울 예시가 없으면 그대로 둔다
    e.preventDefault()
    onChange(placeholder)
  }
}

function Field({ label, value, onChange, placeholder, area = false }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; area?: boolean
}) {
  const onKeyDown = useTabToFill(value, placeholder, onChange)
  const fillable = !value.trim() && !!placeholder?.trim()
  return (
    <label className="survey-field" style={{ marginBottom: 9 }}>
      <span>
        {label}
        {fillable && <em className="field-tab">Tab 누르면 예시가 채워집니다</em>}
      </span>
      {area
        ? <textarea className="admin-input" rows={3} value={value} onKeyDown={onKeyDown}
            placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input className="admin-input" value={value} onKeyDown={onKeyDown}
            placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </label>
  )
}

/**
 * 기간 — **달력에서 시작과 끝을 고른다.**
 *
 * 예전에는 `2026. 8. 27. ~ 2027. 2. 9.` 를 손으로 적었다.
 * 점과 물결과 공백을 매번 같은 자리에 찍어야 했고, 어긋나면 회원 화면에서 그대로 어긋나 보였다.
 *
 * ── 저장하는 값은 그대로 글이다 ────────────────────────────
 * DB 의 `period` 는 지금도 자유로운 글이다. 달력은 **적는 방법**만 바꾼다.
 * 그래야 이미 들어 있는 값과, 날짜 범위가 아닌 값(영화의 `개봉 예정 · 2026. 7. 29. 개봉`)이
 * 그대로 살아 있다.
 *
 * ── 못 알아보는 값은 건드리지 않는다 ───────────────────────
 * 있는 값이 날짜 범위로 안 읽히면 달력을 채우지 못한다. 그때 값을 지워 버리면
 * 사람이 적어 둔 것을 앗아가는 셈이다. 그래서 **글 칸을 함께 열어 두고**
 * 달력은 비운 채로 둔다 — 고칠지 말지는 쓰는 사람이 정한다.
 */
function PeriodField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const known = !value.trim() || parsePeriod(value) !== null
  const [from, setFrom] = useState(() => parsePeriod(value)?.from ?? '')
  const [to, setTo] = useState(() => parsePeriod(value)?.to ?? '')

  /**
   * **밖에서 값이 바뀌면 달력도 따라와야 한다.**
   * 처음엔 `useState` 초기값으로만 읽었는데, 그건 이 조각이 처음 그려질 때 한 번뿐이다.
   * 보드에서 고른 후보가 들어와도 달력이 빈 채로 남았다 — 후보 자리를 재사용하기 때문이다.
   *
   * 내가 방금 내보낸 값이면 다시 읽지 않는다. 그러면 끝 날짜만 고른 경우
   * (`formatPeriod('', t)` 는 날짜 하나만 남긴다) 그 값이 시작 칸으로 튀어 오른다.
   */
  const mine = useRef(value)
  useEffect(() => {
    if (value === mine.current) return
    mine.current = value
    const p = parsePeriod(value)
    setFrom(p?.from ?? '')
    setTo(p?.to ?? '')
  }, [value])

  const push = (f: string, t: string) => {
    setFrom(f); setTo(t)
    const next = formatPeriod(f, t)
    mine.current = next
    onChange(next)
  }

  return (
    <div className="survey-field" style={{ marginBottom: 9 }}>
      <span>기간</span>
      <div className="admin-row" style={{ alignItems: 'center', gap: 8 }}>
        <input className="admin-input" type="date" aria-label="시작일"
          value={from} onChange={(e) => push(e.target.value, to)} />
        <span className="period-tilde" aria-hidden="true">~</span>
        <input className="admin-input" type="date" aria-label="끝나는 날"
          value={to} onChange={(e) => push(from, e.target.value)} />
      </div>

      {/* 고른 결과가 회원 화면에 어떻게 보일지 그대로 보여 준다 */}
      {value.trim() && <p className="admin-hint" style={{ margin: '6px 0 0' }}>화면에는 <b>{value}</b> 로 보입니다.</p>}

      {!known && (
        <>
          <p className="admin-hint" style={{ margin: '6px 0 4px' }}>
            지금 적힌 기간이 날짜 범위가 아니라 달력으로는 못 고칩니다. 아래에서 고쳐 주세요.
          </p>
          <input className="admin-input" value={value}
            aria-label="기간(직접 적기)" onChange={(e) => onChange(e.target.value)} />
        </>
      )}
    </div>
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
      <PeriodField value={o.period} onChange={(v) => set('period', v)} />
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
  const [open, setOpen] = useState<string | null>(null)   // 결과를 펼친 설문
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

        {/* 마감된 설문을 열면 남은 날이 1일로 되돌아온다. 아무것도 안 바꾸고 저장만 눌러도
            설문이 **다시 열린다.** 화면에 그 말이 없으면 모르고 누른다. */}
        {draft.wasClosed && (
          <p className="admin-warn">
            <b>이 설문은 이미 마감됐습니다.</b> 여기서 저장하면 <b>다시 열립니다</b> —
            오늘부터 {draft.days}일 뒤가 새 마감이 됩니다.
            마감을 유지하려면 저장하지 말고 나가세요.
            이 화면으로는 마감을 지난 시각으로 되돌릴 수 없습니다.
          </p>
        )}

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

        {/**
          * 고른 것을 **빈 후보 자리부터 채운다.**
          * 새 설문은 빈 후보 한 칸으로 시작하는데, 그걸 두고 뒤에 붙이면
          * 빈 칸이 남아 저장할 때 서버가 거절한다.
          */}
        <BoardPicker
          used={draft.options.map((o) => o.title)}
          room={Math.max(0, 5 - draft.options.filter((o) => o.title.trim()).length)}
          onAdd={(opts) => set({
            options: [...draft.options.filter((o) => o.title.trim()), ...opts].slice(0, 5),
          })} />

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

      <Members pw={pw} onError={(e) => say(e, '명부를 다루지 못했습니다.')} />

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
            {/* 결과는 눌러서 편다. 설문이 여러 개일 때 전부 펼쳐 두면
                긴 이름 목록에 묻혀 목록 자체를 못 본다. */}
            <button type="button" className="admin-mini"
              aria-expanded={open === s.id}
              onClick={() => setOpen(open === s.id ? null : s.id)}>
              {open === s.id ? '결과 닫기' : '결과 보기'}
            </button>
            <button type="button" className="admin-mini" disabled={busy}
              onClick={() => { void startEdit(s.id) }}>고치기</button>
            <button type="button" className="admin-mini danger" disabled={busy}
              onClick={() => { void remove(s) }}>지우기</button>
          </div>
          {open === s.id && (
            <Results pw={pw} surveyId={s.id} multiChoice={s.multiChoice}
              onError={(e) => say(e, '결과를 불러오지 못했습니다.')} />
          )}
        </div>
      ))}
    </div>
  )
}
