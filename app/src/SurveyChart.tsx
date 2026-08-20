import type { AdminResult } from './lib/survey'
import type { SurveyOption } from './lib/survey'

/**
 * 설문 결과 차트와 간단한 분석.
 *
 * ── 왜 파이가 아닐 때가 있나 ────────────────────────────────
 * **고르는 방식에 따라 맞는 그림이 다르다.**
 *
 *   하나만 고르기   응답자 수와 표 수가 같다 → 전체를 나눈 조각이다 → 도넛
 *   여러 개 고르기  한 사람이 여럿을 고른다 → 합이 응답자 수를 넘는다 → 가로 막대
 *
 * 여러 개 고르는 설문에 파이를 그리면 **없는 전체를 있는 것처럼 보이게 한다** —
 * 조각을 더하면 100%가 넘는데 그림은 100%처럼 보인다. 그래서 가르는 것이다.
 * 막대 쪽은 `9명 중 6명` 처럼 분모를 응답자 수로 적는다.
 *
 * ── 색 ──────────────────────────────────────────────────────
 * 사이트의 달력 범례 색(초록·남색·주황·빨강·자홍)을 그대로 쓰려다 **버렸다.**
 * 검증기를 돌려 보니 빨강↔주황이 정상 시야에서도 ΔE 9.9 라 구분이 안 된다
 * (칩으로는 글자가 함께 있어 괜찮았던 것이다). 차트에서는 색이 곧 이름이라 못 쓴다.
 *
 * 그래서 검증을 통과한 다섯 가지를 자리 순서대로 쓴다 — 돌려쓰지 않는다.
 * 후보는 최대 5개라 언제나 자리마다 제 색이 있다.
 * 대비가 3:1 에 못 미치는 색이 있어 **모든 조각에 글자 이름을 함께 둔다**(검증기 요구).
 */

const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'] as const

const hue = (i: number) => SERIES[i] ?? SERIES[SERIES.length - 1]

/* ── 도넛 (하나만 고르기) ──────────────────────────────────── */

function Donut({ rows, total }: { rows: AdminResult[]; total: number }) {
  const R = 52
  const W = 22
  const C = 2 * Math.PI * R
  const GAP = 2                      // 조각 사이 바탕 틈

  let at = 0
  const arcs = rows.filter((r) => r.votes > 0).map((r) => {
    const len = (r.votes / total) * C
    const seg = { r, len: Math.max(0, len - GAP), off: at }
    at += len
    return seg
  })

  return (
    <div className="chart-donut-wrap">
      <svg viewBox="0 0 140 140" className="chart-donut" role="img"
        aria-label={`${total}명이 응답했고, ${rows.map((r) => `${r.title} ${r.votes}표`).join(', ')}`}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="#ece9e1" strokeWidth={W} />
        {arcs.map(({ r, len, off }) => (
          <circle key={r.optionId} cx="70" cy="70" r={R} fill="none"
            stroke={hue(rows.indexOf(r))} strokeWidth={W}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-off}
            transform="rotate(-90 70 70)">
            <title>{r.title} — {r.votes}표</title>
          </circle>
        ))}
        <text x="70" y="66" textAnchor="middle" className="chart-donut-num">{total}</text>
        <text x="70" y="82" textAnchor="middle" className="chart-donut-cap">명 응답</text>
      </svg>

      {/* 도넛은 색이 곧 이름이라 범례가 반드시 있어야 한다 */}
      <ul className="chart-legend">
        {rows.map((r, i) => (
          <li key={r.optionId}>
            <span className="chart-swatch" style={{ background: hue(i) }} aria-hidden="true" />
            <span className="chart-legend-name">{r.title}</span>
            <span className="chart-legend-val">
              {r.votes}표{total > 0 && ` · ${Math.round((r.votes / total) * 100)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── 가로 막대 (여러 개 고르기) ───────────────────────────── */

function Bars({ rows, total }: { rows: AdminResult[]; total: number }) {
  return (
    <div className="chart-bars">
      {rows.map((r, i) => {
        const pct = total > 0 ? (r.votes / total) * 100 : 0
        return (
          <div className="chart-bar-row" key={r.optionId}>
            <div className="chart-bar-head">
              {/* 이름을 마크 옆에 직접 둔다 — 색만으로 알아보게 하지 않는다 */}
              <span className="chart-swatch" style={{ background: hue(i) }} aria-hidden="true" />
              <span className="chart-bar-name">{r.title}</span>
              <span className="chart-bar-val">
                {total > 0 ? `${total}명 중 ${r.votes}명` : `${r.votes}명`}
              </span>
            </div>
            <div className="chart-track" role="img"
              aria-label={`${r.title}: ${total}명 중 ${r.votes}명`}>
              <div className="chart-fill" style={{ width: `${pct}%`, background: hue(i) }}>
                <title>{r.title} — {r.votes}명 ({Math.round(pct)}%)</title>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ResultChart({ rows, total, multiChoice }: {
  rows: AdminResult[]; total: number; multiChoice: boolean
}) {
  if (!rows.length) return null
  const anyVote = rows.some((r) => r.votes > 0)
  if (!anyVote) {
    return <p className="admin-hint" style={{ margin: '4px 0 0' }}>아직 아무도 고르지 않았습니다.</p>
  }
  return (
    <div className="chart">
      <p className="chart-caption">
        {multiChoice
          ? '여러 개 고르는 설문이라 합이 응답자 수를 넘습니다. 분모는 응답한 사람 수입니다.'
          : '하나만 고르는 설문이라 조각을 모두 더하면 응답자 수가 됩니다.'}
      </p>
      {multiChoice ? <Bars rows={rows} total={total} /> : <Donut rows={rows} total={total} />}
    </div>
  )
}

/* ── 작품 특징으로 보는 분석 ──────────────────────────────── */

/**
 * 관람료를 숫자로. `/` 앞쪽(정가)만 보고, 그 안의 `원` 금액을 더한다.
 *
 *   `8,000원 / 얼리버드 6,400원`          → 8000   (얼리버드는 따로 센다)
 *   `2,000원 + 덕수궁 입장료 1,000원`     → 3000   (같이 내야 하는 돈이다)
 *
 * 못 읽으면 **null 을 준다.** 0 으로 두면 무료 전시처럼 보여 분석이 뒤집힌다.
 */
export function parsePrice(price: string | null): number | null {
  if (!price) return null
  if (/무료/.test(price)) return 0
  const base = price.split('/')[0] ?? ''
  const nums = [...base.matchAll(/([\d,]+)\s*원/g)]
    .map((m) => Number((m[1] ?? '').replace(/,/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (!nums.length) return null
  return nums.reduce((a, b) => a + b, 0)
}

/** `2026. 8. 27. ~ 2027. 2. 9.` · `2026. 8. 6. ~ 11. 8.` → 끝나는 날 */
export function parseEnd(period: string | null): Date | null {
  if (!period) return null
  const parts = period.split('~')
  if (parts.length < 2) return null
  const nums = (s: string) => [...s.matchAll(/\d+/g)].map((x) => Number(x[0]))
  const end = nums(parts[1] ?? '')
  const start = nums(parts[0] ?? '')

  let y: number; let m: number; let d: number
  if (end.length >= 3) {
    y = end[0] as number; m = end[1] as number; d = end[2] as number
  } else if (end.length === 2 && start.length >= 1) {
    m = end[0] as number
    d = end[1] as number
    y = start[0] as number
    // 끝 달이 시작 달보다 앞서면 해가 넘어간 것이다 (`2026. 8. 6. ~ 11. 8.` 는 같은 해)
    if (start.length >= 2 && m < (start[1] as number)) y += 1
  } else return null
  if (!(y > 2000 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  // 되짚어 검산 — 2026-02-31 같은 값이 조용히 굴러가지 않게
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return dt
}

const won = (n: number) => (n === 0 ? '무료' : `${n.toLocaleString('ko-KR')}원`)

export function Analysis({ rows, options, total }: {
  rows: AdminResult[]; options: SurveyOption[]; total: number
}) {
  const byId = new Map(options.map((o) => [o.id, o]))
  const today = Date.now()

  const facts = rows.map((r) => {
    const o = byId.get(r.optionId)
    const end = parseEnd(o?.period ?? null)
    return {
      r,
      price: parsePrice(o?.price ?? null),
      venue: o?.venue ?? null,
      early: /얼리버드/.test(`${o?.price ?? ''} ${o?.note ?? ''}`),
      end,
      daysLeft: end ? Math.ceil((end.getTime() - today) / 86_400_000) : null,
    }
  })

  const picked = facts.filter((f) => f.r.votes > 0)
  const priced = facts.filter((f) => f.price !== null)
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null)

  /**
   * **응답이 적으면 경향을 말하지 않는다.**
   * 1~2명으로 "회원들은 싼 전시를 선호합니다" 같은 문장을 만들면
   * 그건 분석이 아니라 지어낸 이야기다. 사실만 늘어놓고 그렇게 밝힌다.
   */
  const ENOUGH = 3
  const enough = total >= ENOUGH

  const lines: string[] = []
  if (enough) {
    /**
     * **표로 가중한 평균**을 후보 전체 평균과 견준다.
     *
     * 처음에는 "표를 받은 후보"와 "전체"를 견줬는데, 모든 후보가 한 표라도 받으면
     * 두 값이 같아져 문장이 통째로 사라졌다 — 실제로 그랬다.
     * 가중 평균은 표가 어느 가격대로 쏠렸는지를 늘 말해 준다.
     */
    const allAvg = avg(priced.map((f) => f.price as number))
    const votesOnPriced = priced.reduce((n, f) => n + f.r.votes, 0)
    const weighted = votesOnPriced > 0
      ? Math.round(priced.reduce((n, f) => n + (f.price as number) * f.r.votes, 0) / votesOnPriced)
      : null
    if (allAvg !== null && weighted !== null && priced.length > 1) {
      const diff = weighted - allAvg
      if (Math.abs(diff) >= 1000) {
        lines.push(`표는 ${diff < 0 ? '싼' : '비싼'} 쪽으로 쏠렸습니다 — `
          + `표로 가중한 평균 관람료가 ${won(weighted)}이고 후보 전체 평균은 ${won(allAvg)}입니다.`)
      } else {
        lines.push('관람료로는 갈리지 않았습니다 — 표가 특정 가격대로 쏠리지 않았습니다.')
      }
    }

    const byVenue = new Map<string, number>()
    for (const f of facts) {
      if (!f.venue) continue
      const key = (f.venue.split(/[·,]/)[0] ?? f.venue).trim()
      byVenue.set(key, (byVenue.get(key) ?? 0) + f.r.votes)
    }
    const topVenue = [...byVenue.entries()].sort((a, b) => b[1] - a[1])[0]
    if (topVenue && topVenue[1] > 0 && byVenue.size > 1) {
      lines.push(`장소로는 ${topVenue[0]} 쪽이 ${topVenue[1]}표로 가장 많습니다.`)
    }

    const earlyPicked = picked.filter((f) => f.early).length
    const earlyAll = facts.filter((f) => f.early).length
    if (earlyAll > 0 && earlyAll < facts.length) {
      lines.push(`얼리버드가 있는 후보 ${earlyAll}개 가운데 ${earlyPicked}개가 표를 받았습니다.`)
    }
  }

  // 사실 자체는 응답 수와 상관없이 늘 쓸모가 있다
  const soon = facts
    .filter((f) => f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 60)
    .sort((a, b) => (a.daysLeft as number) - (b.daysLeft as number))

  return (
    <div className="analysis">
      <span className="admin-links-title">작품 특징으로 보기</span>

      <div className="analysis-table" role="table" aria-label="후보별 특징">
        <div className="analysis-row analysis-head" role="row">
          <span role="columnheader">후보</span>
          <span role="columnheader">관람료</span>
          <span role="columnheader">끝나는 날</span>
          <span role="columnheader">표</span>
        </div>
        {facts.map((f, i) => (
          <div className="analysis-row" role="row" key={f.r.optionId}>
            <span role="cell" className="analysis-name">
              <span className="chart-swatch" style={{ background: hue(i) }} aria-hidden="true" />
              {f.r.title}
              {f.early && <span className="analysis-flag">얼리버드</span>}
            </span>
            <span role="cell">{f.price === null ? '확인 필요' : won(f.price)}</span>
            <span role="cell">
              {f.end
                ? `${f.end.getUTCFullYear()}. ${f.end.getUTCMonth() + 1}. ${f.end.getUTCDate()}.`
                : '확인 필요'}
              {f.daysLeft !== null && f.daysLeft > 0 && (
                <span className="analysis-days"> {f.daysLeft}일 남음</span>
              )}
            </span>
            <span role="cell" className="analysis-votes">{f.r.votes}</span>
          </div>
        ))}
      </div>

      {lines.length > 0 && (
        <ul className="analysis-lines">
          {lines.map((l) => <li key={l}>{l}</li>)}
        </ul>
      )}

      {!enough && (
        <p className="admin-hint" style={{ margin: '10px 0 0' }}>
          응답이 {total}명이라 경향을 말하기는 이릅니다. 위 표는 후보 자체의 특징이라
          응답 수와 상관없이 그대로입니다.
        </p>
      )}

      {soon[0] && (
        <p className="analysis-soon">
          <b>챙길 것</b> {soon[0].r.title}은(는) {soon[0].daysLeft}일 뒤에 끝납니다.
          {soon[0].early && ' 얼리버드가 있으니 예매 기간을 먼저 확인하세요.'}
        </p>
      )}
    </div>
  )
}
