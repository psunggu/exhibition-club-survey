/**
 * 구글 폼으로 정기적으로 받는 설문의 **회차 목록.**
 *
 * ── 왜 앱 안에서 시트를 읽지 않나 ───────────────────────────
 * CSP 가 `connect-src 'self' https://*.supabase.co` 라 브라우저가
 * docs.google.com 을 부를 수 없다. 실시간 조회는 불가능하고,
 * **모아서 센 숫자만 여기 적어 둔다.**
 *
 * ── 여기 적지 않는 것 ───────────────────────────────────────
 * · 응답자 이름 · 자유서술 원문 — AGENTS.md 「실제 회원 데이터」
 * · **원본 구글 시트 주소** — 번들은 공개다. 주소를 적으면 실명이 든 시트로
 *   가는 길을 누구나 갖게 된다(「내부 URL을 소스에 하드코딩하지 않는다」).
 *   운영진은 각자 구글 드라이브에서 연다.
 * · 미응답자 수 — 회원이 자기 얘기로 읽을 수 있는 것은 공개 화면에 안 싣는다.
 *
 * ── 숫자의 출처는 한 곳이다 ─────────────────────────────────
 * 자세한 집계는 `app/public/survey-result.html` 한 장이 갖고 있고, 여기 `highlights`
 * 는 그 페이지에서 **그대로 옮긴 네 줄**이다. 두 곳이 어긋나지 않게, 고칠 일이
 * 생기면 그 페이지를 먼저 고치고 여기를 맞춘다.
 *
 * ── 회차를 더할 때 ──────────────────────────────────────────
 * 이 파일에 줄을 하나 더하고, 회원용 결과 페이지를 만들어
 * `vite.config.ts` 의 `copyLiveAssets` 목록에 적는다. 안 적으면 빌드는 통과하고
 * **배포된 사이트에서만 404** 가 난다.
 */

export type GoogleSurveyRound = {
  id: string
  /** 몇 차인가. 화면에 「1차」 로 붙는다 */
  round: number
  title: string
  /** 언제부터 언제까지 받았나 */
  period: string
  /** 몇 분이 답했나. 총원과 미응답자 수는 적지 않는다 */
  answered: number
  /** 「2026. 8. 26. 기준」 — 결과 페이지의 배지와 같은 값 */
  asOf: string
  /** 회원용 결과 페이지. 정적 파일이라 해시 라우팅 밖이다 */
  resultUrl: string
  /** 결과 페이지에서 그대로 옮긴 대표 숫자 넷 */
  highlights: { question: string; answer: string; percent: number }[]
  /** 이 회차로 무엇이 달라졌나 — 한 줄 */
  outcome: string
}

export const GOOGLE_SURVEYS: GoogleSurveyRound[] = [
  {
    id: 'g-2026-08',
    round: 1,
    title: '동아리 운영 설문',
    period: '2026년 8월 23일 ~ 26일',
    /**
     * **두 번 늘었다.** 처음 집계한 8월 26일에는 17건이었는데, 운영규정 동의 공지
     * (마감 8월 31일) 뒤에 8월 31일·9월 1일 한 건씩 더 들어와 19건이 됐다.
     * 그중 한 사람이 두 번 낸 것을 빼서 **유효 18명**이다.
     *
     * 여기 숫자는 운영자 화면의 회차 카드에 그대로 뜬다. 분석 가이드는 18명으로
     * 세는데 이 카드가 17명이라고 말하면 **같은 화면 안에서 두 값이 어긋난다.**
     * 아래 백분율도 그때 다시 센 값이다 — 함께 고치지 않으면 카드만 옛말을 한다.
     */
    answered: 18,
    asOf: '2026. 9. 1. 기준 · 중복 1건 제외',
    resultUrl: './survey-result.html',
    highlights: [
      { question: '언제가 좋은가', answer: '토요일 오후', percent: 83 },
      { question: '어디가 편한가', answer: '서울 도심 · 종로 · 중구', percent: 78 },
      { question: '무엇에 관심이 있는가', answer: '미술 전시 · 갤러리', percent: 72 },
      { question: '고를 때 무엇이 중요한가', answer: '작품 · 전시의 내용과 완성도', percent: 72 },
    ],
    outcome: '토요일 오후를 기본 시간대로 고정하고, 도심에서 용산으로 이어지는 축으로 잡았습니다.',
  },
]

/** 최근 회차가 앞. 회차 번호가 같으면 id 로 가른다. */
export const googleSurveysNewestFirst = (): GoogleSurveyRound[] =>
  [...GOOGLE_SURVEYS].sort((a, b) => b.round - a.round || b.id.localeCompare(a.id))
