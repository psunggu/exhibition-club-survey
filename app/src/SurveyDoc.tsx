import { useEffect, useState } from 'react'
import { adminDoc, adminDocs } from './lib/survey'
import { splitBold, type AdminDoc, type DocBlock, type DocEntry } from './lib/adminDoc'

/**
 * 운영진만 읽는 분석 문서를 그린다.
 *
 * ── 서버는 자료만 준다 ─────────────────────────────────────
 * 본문은 HTML 이 아니라 **블록 배열**이다. 이유가 둘이다.
 *
 *   1) 이 앱의 CSP 는 `style-src-attr 'none'` 이라, 서버가 준 HTML 을 심으면
 *      `style="width:83%"` 가 막혀 막대가 **0 폭**이 된다.
 *      React 가 style prop 으로 그리면 CSSOM 이라 막히지 않는다.
 *   2) dangerouslySetInnerHTML 을 아예 안 쓰므로 **서버 글이 코드가 될 길이 없다.**
 *
 * 굵게는 `**…**` 하나만 쓴다 (splitBold). 그 밖은 전부 그냥 글자다.
 *
 * ── 모르는 블록은 건너뛴다 ─────────────────────────────────
 * 마이그레이션이 화면보다 앞서 나갈 수 있다. 그때 화면 전체가 죽는 것보다
 * 그 블록만 빠지는 편이 낫다 — 나머지는 읽을 수 있어야 한다.
 */

/** `**굵게**` 를 React 조각으로. 문자열로만 그리므로 HTML 이 될 수 없다. */
function T({ s }: { s: string }) {
  return <>{splitBold(s).map((p, i) => (p.b ? <b key={i}>{p.s}</b> : <span key={i}>{p.s}</span>))}</>
}

function Bars({ b }: { b: Extract<DocBlock, { k: 'bars' }> }) {
  const max = b.rows.reduce((m, r) => Math.max(m, r[2]), 0)
  return (
    <>
      <h3 className="doc-h3">{b.t} <span className="doc-kind">{b.kind}</span></h3>
      <div className="doc-card doc-chart">
        {b.rows.map((r, i) => (
          <div className={`doc-row${r[2] === max ? ' top' : ''}`} key={i}>
            <div className="doc-lab">
              <span>{r[0]}</span>
              <span className="doc-v">{r[1]}명 · {r[2]}%</span>
            </div>
            <div className="doc-track"><i style={{ width: `${r[2]}%` }} /></div>
          </div>
        ))}
      </div>
    </>
  )
}

function Gap({ b }: { b: Extract<DocBlock, { k: 'gap' }> }) {
  const bar = (side: 'a' | 'b', label: string, v: [number, number, number]) => (
    <div className="doc-pair">
      <span className="doc-k">{label}</span>
      <span className="doc-xt"><i className={`f-${side}`} style={{ width: `${v[2]}%` }} /></span>
      <span className="doc-xv">{v[0]}/{v[1]} · {v[2]}%</span>
    </div>
  )
  return (
    <div className="doc-gap">
      <div className="doc-gaphead">
        <span className="t"><T s={b.t} /></span>
        <span className={`doc-mult${b.side === 'b' ? ' b' : ''}`}>{b.mult}</span>
      </div>
      {bar('a', '자주', b.a)}
      {bar('b', '한두 번', b.b)}
      {b.note && <p className="doc-note"><T s={b.note} /></p>}
    </div>
  )
}

function Block({ b }: { b: DocBlock }) {
  switch (b.k) {
    case 'cover':
      return (
        <header className="doc-cover">
          <p className="doc-eyebrow">{b.eyebrow}</p>
          <h2 className="doc-title">{b.t}</h2>
          <p className="doc-dek"><T s={b.dek} /></p>
          <div className="doc-strip">
            {b.tiles.map((t, i) => (
              <div className="doc-tile" key={i}>
                <p className="doc-big">{t[0]}</p>
                <p>{t[1]}</p>
                <p className="doc-why">{t[2]}</p>
              </div>
            ))}
          </div>
        </header>
      )
    case 'h':
      return <><p className="doc-num">{b.n}</p><h3 className="doc-h2">{b.t}</h3></>
    case 'lede': return <p className="doc-lede"><T s={b.t} /></p>
    case 'p': return <p className="doc-p"><T s={b.t} /></p>
    case 'note': return <p className="doc-note"><T s={b.t} /></p>
    case 'card':
      return (
        <div className="doc-card doc-pad">
          {b.t && <h4 className="doc-h4">{b.t}</h4>}
          {b.ps.map((p, i) => <p className="doc-p" key={i}><T s={p} /></p>)}
        </div>
      )
    case 'flag':
      return (
        <div className="doc-flag">
          <h4 className="doc-h4">{b.t}</h4>
          {b.ps.map((p, i) => <p key={i}><T s={p} /></p>)}
        </div>
      )
    case 'person':
      return (
        <div className={`doc-card doc-pad doc-person ${b.tone}`}>
          <div className="doc-whohead">
            <h4 className="doc-h4">{b.t}</h4><span className="doc-cnt">{b.cnt}</span>
          </div>
          <p className="doc-dek2">{b.dek}</p>
          {b.pts.map((p, i) => (
            <div className="doc-pt" key={i}><b>{p[0]}</b><span><T s={p[1]} /></span></div>
          ))}
          <p className="doc-careful"><b>조심할 것</b> — <T s={b.careful} /></p>
        </div>
      )
    case 'gap': return <Gap b={b} />
    case 'rule':
      return (
        <div className={`doc-card doc-pad doc-rule ${b.kind}`}>
          <p className="doc-rn">{b.n}</p>
          <h4 className="doc-h4">{b.t}{b.chg && <span className="doc-chg">{b.chg}</span>}</h4>
          {b.ps.map((p, i) => <p className="doc-p" key={i}><T s={p} /></p>)}
          {b.quote && <p className="doc-quote">{b.quote}</p>}
          {b.ev && <p className="doc-ev">{b.ev}</p>}
        </div>
      )
    case 'bars': return <Bars b={b} />
    case 'table':
      return (
        <div className="doc-tw">
          <table>
            <thead><tr>{b.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j}><T s={c} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'quotes':
      return (
        <>
          <h3 className="doc-h3">{b.t} <span className="doc-kind">{b.kind}</span></h3>
          {b.items.map((q, i) => (
            <p className="doc-raw" key={i}><span className="doc-who">{q[0]}</span>{q[1]}</p>
          ))}
          {b.note && <p className="doc-note">{b.note}</p>}
        </>
      )
    case 'fold':
      return (
        <details className="doc-fold">
          <summary>{b.t}</summary>
          <div className="doc-foldbody">
            {b.blocks.map((x, i) => <Block b={x} key={i} />)}
          </div>
        </details>
      )
    default:
      // 마이그레이션이 화면보다 앞서 나간 경우. 그 블록만 빠지고 나머지는 읽힌다.
      return null
  }
}

export function SurveyDoc({ pw, onError }: { pw: string; onError: (e: unknown) => void }) {
  const [list, setList] = useState<DocEntry[] | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [doc, setDoc] = useState<AdminDoc | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    adminDocs(pw, ac.signal)
      // 문서가 하나뿐이면 고르는 단계를 건너뛰고 바로 편다
      .then((rows) => { setList(rows); if (rows.length === 1 && rows[0]) setSlug(rows[0].slug) })
      .catch((e: unknown) => { if (!ac.signal.aborted) onError(e) })
    return () => ac.abort()
  }, [pw, onError])

  useEffect(() => {
    if (!slug) { setDoc(null); return }
    const ac = new AbortController()
    setDoc(null)
    adminDoc(pw, slug, ac.signal)
      .then(setDoc)
      .catch((e: unknown) => { if (!ac.signal.aborted) onError(e) })
    return () => ac.abort()
  }, [pw, slug, onError])

  if (!list) return <p className="admin-hint" aria-live="polite">문서를 찾는 중…</p>
  if (!list.length) return <p className="survey-empty">아직 올라온 문서가 없습니다.</p>

  return (
    <div className="doc-wrap">
      {list.length > 1 && (
        <div className="survey-actions" style={{ marginBottom: 12 }}>
          {list.map((d) => (
            <button type="button" key={d.slug}
              className={`admin-mini${slug === d.slug ? ' on' : ''}`}
              aria-pressed={slug === d.slug}
              onClick={() => setSlug(slug === d.slug ? null : d.slug)}>{d.title}</button>
          ))}
        </div>
      )}
      {!doc && slug && <p className="admin-hint" aria-live="polite">불러오는 중…</p>}
      {doc && doc.body.map((b, i) => <Block b={b} key={i} />)}
      {doc && (
        <p className="doc-note doc-tail">
          이 문서는 <b>운영진만</b> 볼 수 있습니다. 회원 화면에는 나오지 않고,
          표에는 읽기 정책이 없어 암호 없이는 어떤 방법으로도 열 수 없습니다.
        </p>
      )}
    </div>
  )
}
