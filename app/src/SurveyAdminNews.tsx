import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchEvents } from './lib/events'
import {
  allNews, emptyNews, newsDelete, newsSave, NEWS_KINDS, pickNews,
  type News as NewsItem, type NewsDraft,
} from './lib/news'

/**
 * 보드 소식 — 영상·기사 주소 하나를 올리고·고치고·지운다.
 *
 * ── 왜 운영자 화면에 있나 ───────────────────────────────────
 * 설문의 일부가 아니라 **보드 내용**이다. 그래도 운영자 자리가 여기 하나뿐이라
 * 같은 암호 뒤에 둔다. 자물쇠를 하나 더 만들면 운영진이 외울 것만 늘어난다.
 *
 * ── 읽기와 쓰기가 다른 길로 간다 ────────────────────────────
 * 목록은 보드와 **같은 길**로 읽는다(events select). 읽기에 암호를 씌워도
 * 같은 행을 누구나 REST 로 읽을 수 있어서 실제로 막는 것이 없다.
 * 쓰기만 news_admin_save · news_admin_delete 를 거치고, 암호는 그 안에서 본다 —
 * 이 화면의 검사는 손이 덜 가게 도와주는 것일 뿐이고, 화면을 우회해도 서버가 막는다.
 *
 * 지난 소식도 감추지 않는다. 운영자는 치울 것을 봐야 한다.
 *
 * SurveyAdmin.tsx 에 두지 않은 이유는 길이뿐이다 — 그 파일은 이미 1,200줄이 넘는다.
 */
export function News({ pw, onError }: { pw: string; onError: (e: unknown) => void }) {
  const [rows, setRows] = useState<NewsItem[] | null>(null)
  const [liveId, setLiveId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [d, setD] = useState<NewsDraft>(emptyNews)
  const ac = useRef<AbortController | null>(null)

  useEffect(() => () => ac.current?.abort(), [])

  const load = useCallback(async () => {
    ac.current?.abort(); ac.current = new AbortController()
    try {
      const all = await fetchEvents(ac.current.signal)
      setRows(allNews(all))
      /**
       * 보드가 고르는 것과 **같은 함수**로 고른다.
       * 규칙이 갈라지면 이 화면의 「보드에 보임」 이 거짓말이 된다.
       */
      setLiveId(pickNews(all, today())?.id ?? null)
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) onError(e)
    }
  }, [onError])

  // 펼칠 때 읽는다. 운영자가 설문만 보러 왔을 때 보드까지 부르지 않는다.
  useEffect(() => { if (open && rows === null) void load() }, [open, rows, load])

  const set = (patch: Partial<NewsDraft>) => setD((cur) => ({ ...cur, ...patch }))
  const clear = () => setD(emptyNews())

  const save = async () => {
    setBusy(true)
    try { await newsSave(pw, d); clear(); setRows(null); await load() }
    catch (e) { onError(e) } finally { setBusy(false) }
  }

  const edit = (n: NewsItem) => {
    /** 남은 날수로 되돌린다 — 서버가 「며칠」 만 받으므로 화면도 같은 단위로 묻는다. */
    const left = n.endDate
      ? Math.ceil((Date.parse(`${n.endDate}T00:00:00Z`) - Date.now()) / 86400e3)
      : 30
    setD({
      id: n.id, title: n.title, url: n.url,
      genre: n.genre ?? NEWS_KINDS[0], venue: n.venue ?? '', summary: n.summary ?? '',
      days: nearestSpan(left),
    })
  }

  const remove = async (n: NewsItem) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`「${n.title}」 소식을 지웁니다. 되돌릴 수 없습니다. 계속할까요?`)) return
    setBusy(true)
    try { await newsDelete(pw, n.id); if (d.id === n.id) clear(); setRows(null); await load() }
    catch (e) { onError(e) } finally { setBusy(false) }
  }

  const url = d.url.trim()
  const badUrl = url !== '' && !isHttps(url)
  const ready = d.title.trim() !== '' && isHttps(url)

  return (
    <details className="admin-members" open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>보드 소식{rows ? ` (${rows.length}건)` : ''}</summary>

      <p className="admin-hint" style={{ marginTop: 10 }}>
        보드 목록 맨 위에 <b>한 줄</b>로 걸립니다. 기간이 남은 것 중 가장 나중에 올린
        하나만 보입니다. 영상은 페이지 안에서 재생하지 않고 눌렀을 때 유튜브로
        넘어갑니다 — 주소만 넣으시면 됩니다.
      </p>

      <div className="admin-row">
        <label className="survey-field" style={{ flexGrow: 1 }}>
          <span>제목</span>
          <input className="admin-input" value={d.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="스케일 미쳐버린 전국구급 미술축제가 열립니다" />
        </label>
      </div>

      <div className="admin-row">
        <label className="survey-field" style={{ flexGrow: 1 }}>
          <span>주소</span>
          <input className="admin-input" value={d.url} inputMode="url"
            aria-invalid={badUrl || undefined}
            onChange={(e) => set({ url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..." />
        </label>
      </div>
      {/* 서버도 같은 것을 본다(news_admin_save). 여기 검사는 미리 알려 주는 것뿐이다. */}
      {badUrl && (
        <p className="admin-hint" role="alert">주소는 https:// 로 시작해야 합니다.</p>
      )}

      <div className="admin-row">
        <label className="survey-field" style={{ width: 150 }}>
          <span>갈래</span>
          <select className="admin-input" value={d.genre}
            onChange={(e) => set({ genre: e.target.value })}>
            {NEWS_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <label className="survey-field" style={{ flexGrow: 1 }}>
          <span>출처</span>
          <input className="admin-input" value={d.venue}
            onChange={(e) => set({ venue: e.target.value })} placeholder="널 위한 문화예술" />
        </label>
        <label className="survey-field" style={{ width: 130 }}>
          <span>보일 기간</span>
          <select className="admin-input" value={String(d.days)}
            onChange={(e) => set({ days: Number(e.target.value) })}>
            {SPANS.map((n) => <option key={n} value={n}>{n}일</option>)}
          </select>
        </label>
      </div>

      <div className="admin-row">
        <label className="survey-field" style={{ flexGrow: 1 }}>
          <span>덧붙이는 말</span>
          <input className="admin-input" value={d.summary}
            onChange={(e) => set({ summary: e.target.value })}
            placeholder="키아프 · 프리즈 서울 9/2~6 코엑스" />
        </label>
      </div>
      <p className="admin-hint">
        기간이 지나면 <b>알아서 내려갑니다</b> — 갈아 끼우는 것을 잊어도 낡은 소식이
        남지 않습니다. 갈래 · 출처 · 덧붙이는 말은 화면에서 한 줄로 이어 붙으니
        짧게 적어 주세요.
      </p>

      <div className="survey-actions" style={{ marginTop: 4, marginBottom: 14 }}>
        <button type="button" className="survey-submit" disabled={busy || !ready}
          onClick={() => { void save() }}>
          {busy ? '저장 중…' : d.id ? '고친 내용 저장' : '소식 올리기'}
        </button>
        {d.id && (
          <button type="button" className="admin-mini" onClick={clear}>그만두기</button>
        )}
      </div>

      {rows && !rows.length && <p className="survey-empty">아직 올린 소식이 없습니다.</p>}

      {(rows ?? []).map((n) => (
        <div className="admin-news-card" key={n.id}>
          <div className="admin-card-title">
            {/* 지금 보이는 것을 **글자로** 적는다 — 색만으로 가르지 않는다. */}
            {n.id === liveId && (
              <span className="tag tag-tent" style={{ marginRight: 6 }}>보드에 보임</span>
            )}
            {n.title}
          </div>
          <p className="survey-facts" style={{ marginTop: 6 }}>
            <b>갈래</b> {[n.genre, n.venue].filter(Boolean).join(' · ') || '-'}<br />
            <b>기간</b> {n.startDate ?? '-'} ~ {n.endDate ?? '기한 없음'}
            {expired(n) && ' · 기간이 지나 보이지 않습니다'}<br />
            <b>주소</b> {n.url}
          </p>
          <div className="survey-actions" style={{ marginTop: 10 }}>
            <button type="button" className="admin-mini" disabled={busy}
              onClick={() => edit(n)}>고치기</button>
            <button type="button" className="admin-mini danger" disabled={busy}
              onClick={() => { void remove(n) }}>지우기</button>
          </div>
        </div>
      ))}
    </details>
  )
}

const today = () => new Date().toISOString().slice(0, 10)

/** 서버가 https 만 받는다. `javascript:` 같은 것이 링크로 나가면 안 된다. */
const isHttps = (v: string) => v.slice(0, 8).toLowerCase() === 'https://'

const expired = (n: NewsItem) => !!n.endDate && n.endDate < today()

/** 고를 수 있는 기간. 날짜를 손으로 받지 않는 이유는 마이그레이션 머리말에 적었다. */
const SPANS = [7, 14, 30, 60, 90, 180] as const

/** 남은 날수를 고를 수 있는 값 중 가장 가까운 것으로 맞춘다. */
const nearestSpan = (left: number) =>
  SPANS.reduce((best, n) => (Math.abs(n - left) < Math.abs(best - left) ? n : best), SPANS[2])
