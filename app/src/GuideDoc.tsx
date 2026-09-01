/**
 * GuideDoc — 운영진 분석 가이드를 **구조화 JSON 에서** 리치하게 그린다.
 *
 * ── 왜 JSON 인가 ────────────────────────────────────────────
 * 옛 방식은 마크다운을 손으로 붙여넣고 ##/- 만 읽었다. PDF 의 지표·집단·격차 같은
 * 시각 구조가 전부 사라졌다. 이제 분석을 구조화 데이터로 담고, 렌더러가 그것을
 * 막대·페르소나 카드·격차 차트·편성표로 그린다. 「지표를 그대로」가 그 뜻이다.
 *
 * ── 절대 지키는 두 가지 ─────────────────────────────────────
 * 1. **도메인 문구를 여기에 하드코딩하지 않는다.** 번들은 공개다 — 「코어」·「주변부」·
 *    금지 지표 같은 말을 이 파일에 적으면 잠긴 표에 둔 뜻이 없어진다. 값·문구는 전부
 *    JSON(잠긴 표)에서 온다. 이 파일은 「규칙」·「근거 —」 같은 **일반 라벨**만 갖는다.
 * 2. **절대 throw 하지 않는다.** 저장소에 ErrorBoundary 가 없다 — 렌더 중 던지면
 *    운영자 화면 전체가 하얗게 죽는다. 모든 필드 접근은 기본값으로 감싸고,
 *    모르는 섹션 타입은 폴백으로 그린다. 파싱 자체는 AdminGuide 가 try/catch 로 받는다.
 *
 * ── 지표를 어떻게 그리나 (CSP) ──────────────────────────────
 * 막대·격차 점은 **SVG 표현 속성**(<rect width=…>, <circle cx=…>)으로 그린다 —
 * style 속성이 아니라 CSP style-src 와 무관하다(실측 확인). viewBox 를 0..100 으로 두어
 * 퍼센트가 곧 x 좌표다. 색은 인라인이 아니라 .css 클래스(var(--…))로 준다.
 */

export type GuideMetric = { value?: string; text?: string; bar?: number }
export type GuideBlock = { type?: string; text?: string; source?: string }

export type GuideSection = Record<string, unknown> & { type?: string }
export type GuideDocData = { title?: string; sections?: GuideSection[] }

/** 첫 비공백 문자가 `{` 인가 — JSON 본문인지 마크다운인지 가른다. */
export const looksLikeJson = (body: string): boolean => body.trimStart().startsWith('{')

/**
 * 형태를 가볍게 본다. **엄격하지 않다** — sections 가 배열이기만 하면 그린다.
 * 모르는 섹션은 렌더러가 폴백으로 그리므로, 여기서 막지 않는다.
 * 반환: 성공이면 doc, 실패면 사람이 읽을 한국어 이유.
 */
export function parseGuideDoc(body: string):
{ ok: true; doc: GuideDocData } | { ok: false; error: string } {
  let raw: unknown
  try {
    raw = JSON.parse(body)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `JSON 형식이 올바르지 않습니다 — ${msg}` }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return { ok: false, error: '문서가 객체가 아닙니다. { "sections": [ … ] } 모양이어야 합니다.' }
  const doc = raw as GuideDocData
  if (!Array.isArray(doc.sections))
    return { ok: false, error: '"sections" 배열이 없습니다. { "sections": [ … ] } 모양이어야 합니다.' }
  return { ok: true, doc }
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
/** 막대는 0..100 안의 유한수일 때만 그린다. 나머지(7/17 같은 값)는 막대 없이 숫자만. */
const barOf = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : NaN
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null
}

/** 지표 한 줄 — 값 + 글 + (있으면) 막대. survey-result.html 의 .stat 결. */
function Stat({ m }: { m: GuideMetric }) {
  const bar = barOf(m.bar)
  return (
    <div className="gdoc-stat">
      <div className="gdoc-stat-top">
        <span className="gdoc-stat-v">{str(m.value) || '·'}</span>
        <span className="gdoc-stat-t">{str(m.text)}</span>
      </div>
      {bar !== null && (
        <svg className="gdoc-bar" viewBox="0 0 100 6" preserveAspectRatio="none"
          role="img" aria-label={`${str(m.value)} ${str(m.text)}`}>
          <rect className="gdoc-bar-track" x="0" y="0" width="100" height="6" rx="3" />
          <rect className="gdoc-bar-fill" x="0" y="0" width={bar} height="6" rx="3" />
        </svg>
      )}
    </div>
  )
}

function Callout({ c }: { c: Record<string, unknown> }) {
  const label = str(c.label)
  const clue = str(c.tone) === 'clue'
  return (
    <p className={`gdoc-callout${clue ? ' clue' : ''}`}>
      {label && <b className="gdoc-callout-l">{label}</b>}
      {str(c.text)}
    </p>
  )
}

function Headline({ s }: { s: GuideSection }) {
  return (
    <section className="gdoc-sec">
      <h4 className="gdoc-h">{str(s.title)}</h4>
      {str(s.lead) && <p className="gdoc-lead">{str(s.lead)}</p>}
      {arr<GuideMetric>(s.stats).map((m, i) => <Stat key={i} m={m} />)}
    </section>
  )
}

function Personas({ s }: { s: GuideSection }) {
  return (
    <section className="gdoc-sec">
      <h4 className="gdoc-h">{str(s.title)}</h4>
      {arr<Record<string, unknown>>(s.items).map((p, i) => (
        <article className="gdoc-persona" key={i}>
          <div className="gdoc-persona-head">
            <span className="gdoc-persona-name">{str(p.name)}</span>
            <span className="gdoc-persona-size">{str(p.size)}</span>
          </div>
          {str(p.gloss) && <p className="gdoc-persona-gloss">{str(p.gloss)}</p>}
          {arr<GuideMetric>(p.metrics).map((m, j) => <Stat key={j} m={m} />)}
          {arr<Record<string, unknown>>(p.callouts).map((c, j) => <Callout key={j} c={c} />)}
        </article>
      ))}
    </section>
  )
}

/**
 * 갈라지는 지점 — 두 값을 한 축에 찍는 덤벨.
 *
 * 색으로 두 극을 가르지 않는다(둘 다 같은 색). 어느 쪽이 어느 값인지는 **글자**가 말한다 —
 * 위 읽기 줄과 점 옆 라벨. 격차는 선분 길이로도 보이고 「차이 53p」 로도 적힌다.
 */
function Divergence({ s }: { s: GuideSection }) {
  const poles = (s.poles ?? {}) as Record<string, unknown>
  const a = str(poles.a) || 'A'
  const b = str(poles.b) || 'B'
  return (
    <section className="gdoc-sec">
      <h4 className="gdoc-h">{str(s.title)}</h4>
      {arr<Record<string, unknown>>(s.items).map((it, i) => {
        const av = barOf(it.a)
        const bv = barOf(it.b)
        return (
          <div className="gdoc-div" key={i}>
            <div className="gdoc-div-label">{str(it.label)}</div>
            <div className="gdoc-div-read">
              <span>{a} {av ?? '?'}</span>
              <span>{b} {bv ?? '?'}</span>
              {str(it.gap) && <b className="gdoc-div-gap">차이 {str(it.gap)}</b>}
            </div>
            {av !== null && bv !== null && (
              <svg className="gdoc-div-plot" viewBox="0 0 100 16" preserveAspectRatio="none"
                role="img" aria-label={`${a} ${av}, ${b} ${bv}, 차이 ${str(it.gap)}`}>
                <line className="gdoc-div-base" x1="0" y1="8" x2="100" y2="8" />
                <line className="gdoc-div-seg" x1={Math.min(av, bv)} y1="8"
                  x2={Math.max(av, bv)} y2="8" />
                <circle className="gdoc-div-dot" cx={av} cy="8" r="5" />
                <circle className="gdoc-div-dot" cx={bv} cy="8" r="5" />
              </svg>
            )}
            {str(it.note) && <div className="gdoc-div-note">{str(it.note)}</div>}
          </div>
        )
      })}
    </section>
  )
}

/** 규칙(keep)·금지(avoid) — 색만으로 가르지 않는다. keep 은 ✓·초록 선, avoid 는 ✕·어두운 선. */
function Directives({ s }: { s: GuideSection }) {
  const avoid = str(s.variant) === 'avoid'
  return (
    <section className="gdoc-sec">
      <h4 className="gdoc-h">{str(s.title)}</h4>
      {arr<Record<string, unknown>>(s.items).map((it, i) => (
        <article className={`gdoc-rule${avoid ? ' avoid' : ''}`} key={i}>
          <div className="gdoc-rule-head">
            <span className="gdoc-rule-tag" aria-hidden="true">{avoid ? '✕' : '✓'}</span>
            <span className="gdoc-rule-n">{str(it.number)}</span>
            <span className="gdoc-rule-title">{str(it.title)}</span>
          </div>
          {arr<GuideBlock>(it.body).map((blk, j) => (
            str(blk.type) === 'quote'
              ? (
                <p className="gdoc-quote" key={j}>
                  {str(blk.source) && <span className="gdoc-quote-src">{str(blk.source)} · </span>}
                  {str(blk.text)}
                </p>
              )
              : <p className="gdoc-rule-body" key={j}>{str(blk.text)}</p>
          ))}
          {str(it.evidence) && (
            <p className="gdoc-ev"><b>근거</b> {str(it.evidence)}</p>
          )}
        </article>
      ))}
    </section>
  )
}

/**
 * 편성표 — **가로표를 행-당-카드로 접는다.** 375px 에서 5칸 표는 가로 스크롤을 낳는다.
 * 첫 칸을 배지로 세우고 나머지를 `머리 · 값` 목록으로 편다.
 */
function TableCards({ s }: { s: GuideSection }) {
  const cols = arr<string>(s.columns)
  return (
    <section className="gdoc-sec">
      <h4 className="gdoc-h">{str(s.title)}</h4>
      {arr<unknown[]>(s.rows).map((row, i) => {
        const cells = arr<string>(row)
        return (
          <article className="gdoc-sched" key={i}>
            <span className="gdoc-sched-badge">{str(cells[0])}</span>
            <dl className="gdoc-sched-grid">
              {cells.slice(1).map((cell, j) => (
                <div key={j}>
                  <dt>{str(cols[j + 1])}</dt>
                  <dd>{str(cell)}</dd>
                </div>
              ))}
            </dl>
          </article>
        )
      })}
    </section>
  )
}

function Actions({ s }: { s: GuideSection }) {
  return (
    <section className="gdoc-sec">
      <h4 className="gdoc-h">{str(s.title)}</h4>
      <ul className="gdoc-todo">
        {arr<string>(s.items).map((t, i) => <li key={i}>{str(t)}</li>)}
      </ul>
    </section>
  )
}

function Footer({ s }: { s: GuideSection }) {
  return (
    <section className="gdoc-sec">
      <h4 className="gdoc-h">{str(s.title)}</h4>
      {str(s.meta) && <p className="gdoc-caveat gdoc-caveat-meta">{str(s.meta)}</p>}
      {arr<string>(s.notes).map((n, i) => <p className="gdoc-caveat" key={i}>{str(n)}</p>)}
    </section>
  )
}

/** 모르는 섹션 타입 — 죽지 않고 제목 + 원문(JSON)을 접어 보여 준다(forward-compatible). */
function Unknown({ s }: { s: GuideSection }) {
  return (
    <section className="gdoc-sec">
      {str(s.title) && <h4 className="gdoc-h">{str(s.title)}</h4>}
      <p className="gdoc-caveat">알 수 없는 구성입니다(type: {str(s.type) || '없음'}).</p>
    </section>
  )
}

const RENDERERS: Record<string, (p: { s: GuideSection }) => React.ReactElement> = {
  headline: Headline,
  personas: Personas,
  divergence: Divergence,
  directives: Directives,
  table: TableCards,
  actions: Actions,
  footer: Footer,
}

export function GuideDoc({ doc }: { doc: GuideDocData }) {
  return (
    <div className="gdoc">
      {str(doc.title) && <p className="gdoc-doc-title">{str(doc.title)}</p>}
      {arr<GuideSection>(doc.sections).map((s, i) => {
        const R = RENDERERS[str(s.type)] ?? Unknown
        return <R key={i} s={s} />
      })}
    </div>
  )
}
