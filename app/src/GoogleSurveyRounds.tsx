import { AdminGuide } from './AdminGuide'
import { googleSurveysNewestFirst, type GoogleSurveyRound } from './data/googleSurveys'

/**
 * 구글 폼으로 받은 정기 설문의 **회차 목록.**
 *
 * 회원 화면(`#/survey/google`)과 운영자 화면이 **같은 숫자를 본다.** 운영진에게만
 * 다른 집계를 보여 줄 이유가 없다 — 결과 페이지는 어차피 공개고, 두 벌로 두면
 * 반드시 어긋난다.
 *
 * 운영자 화면에만 **하나 더 붙는다** — 회차마다의 「운영진 전용 · 분석 가이드」.
 * 그 글에는 집단 구분 · 미응답자 수 · 자유서술 인용이 들어가서 회원 화면에
 * 실을 수 없다. 본문은 저장소가 아니라 잠긴 표에 있다 (AdminGuide.tsx).
 *
 * 이 갈래는 **투표를 받지 않는다.** 구글 폼에서 받은 것을 모아서 돌려주는 자리다.
 * 그래서 DB 갈래가 아니고, 운영자 화면의 「어느 화면에」 목록에도 안 나온다
 * (lib/survey.ts 의 POSTABLE_CATEGORY_ORDER 주석).
 */
function Round({ r, pw, onError }: {
  r: GoogleSurveyRound
  /** 운영자 화면에서만 온다. 없으면 가이드를 아예 그리지 않는다. */
  pw?: string
  onError?: (e: unknown) => void
}) {
  return (
    <article className="gsurvey">
      <div className="gsurvey-head">
        <div>
          {/* 회차는 색이 아니라 글자로 말한다 */}
          <span className="gsurvey-round">{r.round}차</span>
          <h3 className="gsurvey-title">{r.title}</h3>
        </div>
        <span className="gsurvey-count">{r.answered}분 응답</span>
      </div>

      <p className="gsurvey-when">{r.period} · {r.asOf}</p>

      <dl className="gsurvey-stats">
        {r.highlights.map((h) => (
          <div key={h.question}>
            <dt>{h.question}</dt>
            <dd>
              <span className="gsurvey-answer">{h.answer}</span>
              {/* 막대는 그리지 않는다. 자세한 집계는 결과 페이지 한 곳이 갖는다 —
                  여기서 다시 그리면 두 곳이 어긋날 자리를 하나 더 만드는 것이다. */}
              <span className="gsurvey-pct">{h.percent}%</span>
            </dd>
          </div>
        ))}
      </dl>

      <p className="gsurvey-outcome">{r.outcome}</p>

      <a className="gsurvey-link" href={r.resultUrl}>
        정리한 결과 전체 보기 <span aria-hidden="true">→</span>
      </a>

      {/* **운영진만.** 집단 구분 · 미응답자 수 · 자유서술 인용이 들어가는 글이라
          회원 화면에는 이 자리가 아예 없다 (pw 가 안 오면 그리지 않는다). */}
      {pw && onError && (
        <AdminGuide pw={pw} guideKey={r.id} label="운영진 전용 · 분석 가이드"
          onError={onError} />
      )}
    </article>
  )
}

export function GoogleSurveyRounds({ pw, onError }: {
  /** 운영자 화면에서만 넘어온다. 이것이 있으면 회차마다 분석 가이드가 붙는다. */
  pw?: string
  onError?: (e: unknown) => void
} = {}) {
  const forAdmin = !!pw
  const rounds = googleSurveysNewestFirst()

  if (!rounds.length) {
    return (
      <p className="survey-empty">
        아직 정리해 올린 구글 설문이 없습니다.
      </p>
    )
  }

  return (
    <>
      <p className="admin-hint gsurvey-intro">
        구글 폼으로 받은 설문을 <b>모아서 센 숫자</b>로 정리한 것입니다.
        누가 무엇이라고 썼는지와 자유롭게 적어주신 글은 싣지 않았습니다.
        {forAdmin && (
          <>
            {' '}
            {/* 운영진이 「여기서 회차를 만들 수 있나」 를 묻지 않게 미리 답해 둔다.
                원본 시트 주소는 여기 적지 않는다 — 번들이 공개라 실명이 든 시트로
                가는 길을 누구나 갖게 된다 (data/googleSurveys.ts 머리말). */}
            <b>회차를 더하는 것은 배포가 필요합니다</b> — 시트를 정리해 저장소에 넣는
            방식이라 이 화면에서 바로 올릴 수는 없습니다.
          </>
        )}
      </p>
      {rounds.map((r) => <Round key={r.id} r={r} pw={pw} onError={onError} />)}
    </>
  )
}
