import type { SurveyCategory } from '../lib/survey'

/**
 * **정기모임 한 장 요약.**
 *
 * 설문 화면 맨 위에 「이번 모임은 이렇게 정해졌습니다」 를 네 줄로 보여 준다.
 * 운영자가 정한 네 갈래 —
 *   무엇을 보나 · 언제 보나 · 언제 먹나 · 어디서 먹나
 *
 * ── 왜 탭이 아니라 줄인가 ──────────────────────────────────
 * 갈래마다 탭을 두면 아직 안 정한 갈래는 눌러도 「없습니다」 뿐이다.
 * 줄로 두면 **안 정한 것도 제자리에서 그렇다고 말한다** —
 * 「식사 장소 · 아직 안 정했습니다」. 회원이 알고 싶은 것은 그쪽이다.
 *
 * ── 글은 손으로, 숫자는 DB 에서 ────────────────────────────
 * `value` 는 손으로 적는다. 「19토_17-18관람/18-19식사」 같은 톡방 글자를
 * 사람이 읽는 문장으로 옮기는 일은 기계가 짐작할 것이 아니다.
 *
 * 대신 **숫자는 한 자도 적지 않는다.** `from` 에 설문과 후보만 적어 두면
 * 화면이 집계를 읽어 「11명 중 7명」 을 만든다.
 * 손으로 적어 두면 표가 바뀌어도 그 줄만 옛날 숫자로 남는다 —
 * 이 저장소가 여러 번 겪은 실패다.
 *
 * ── 「9월 것」 이라고 묶는 자리 ─────────────────────────────
 * 제자리는 `meetups.ts` 의 `surveyIds` 다. 모임이 확정되면 그쪽으로 옮긴다.
 * 지금은 9월 모임이 **확정 발표 전**이라 Meetup 이 없어서 여기에 임시로 둔다.
 * 확정되면 이 파일이 아니라 모임 줄이 설문을 가리키게 된다.
 */
export type BriefRow = {
  /** 줄을 가리키는 이름. 검사와 key 에 쓴다 */
  key: string
  /** 왼쪽 딱지. 두 줄까지 접힌다 */
  label: string
  /** 어느 탭에서 진하게 보일지 */
  category: SurveyCategory
  /**
   * 정해진 것. **`null` 이면 아직 안 정한 것**이고,
   * 그때는 화면이 `pending` 을 대신 보여 준다. 빈 문자열로 뭉개지 않는다 —
   * 「빈 값」 과 「안 정함」 이 같아지면 화면이 잘못 말할 수 있다.
   */
  value: string | null
  /** 값 아래 작은 글씨 */
  sub?: string
  /** 날짜를 크게 보여 줄 때 (`big` 이 굵게) */
  dateChip?: { big: string; small: string }
  /** 근거가 된 설문과 후보. 숫자는 화면이 여기서 읽는다 */
  from?: { surveyId: string; optionId: string }
  /** 아직 안 정했을 때 할 말 */
  pending?: string
}

export type MeetingBrief = {
  id: string
  title: string
  /** 오른쪽 위 딱지. 「확정 발표 전」 처럼 지금 상태 */
  state: string
  rows: BriefRow[]
}

const S_EXHIBIT = '5e97b1a0-0000-4000-8000-000000000903'   // 9월 전시회 투표 (톡방)
const S_SCHEDULE = '5e97b1a0-0000-4000-8000-000000000904'  // 9월 관람일정 투표 (톡방)

/**
 * 지금 요약할 모임. 없으면 `null` 로 두면 카드가 통째로 안 그려진다.
 *
 * **하나만 둔다.** 여러 모임을 한 화면에 요약하면 어느 것이 이번 것인지 흐려진다.
 * 10월 모임이 시작되면 이 값을 갈아 끼운다.
 */
export const BRIEF: MeetingBrief | null = {
  id: 'september-2026',
  title: '9월 정기모임',
  state: '확정 발표 전',
  rows: [
    {
      key: 'what',
      label: '무엇을',
      category: 'exhibition',
      value: '《서도호》 개인전',
      sub: '국립현대미술관 서울',
      from: { surveyId: S_EXHIBIT, optionId: '5e97b1a0-0000-4000-8000-000000000931' },
    },
    {
      key: 'when',
      label: '언제',
      category: 'exhibition',
      /**
       * **`value` 에 시간을 넣지 않는다.** 시간은 아래 `sub` 가 말한다.
       * 둘 다 넣었더니 진하지 않은 줄에서
       * 「9월 19일(토) 17~18시 관람 17~18시 관람」 이 됐다 —
       * 진한 줄은 날짜 딱지를 쓰고, 안 진한 줄은 `value` 를 쓰기 때문이다.
       * 진짜 자료로 화면을 열어 보다 드러났다.
       */
      value: '9월 19일(토)',
      dateChip: { big: '9월 19일', small: '토요일' },
      sub: '17~18시 관람',
      from: { surveyId: S_SCHEDULE, optionId: '5e97b1a0-0000-4000-8000-000000000948' },
    },
    {
      key: 'mealTime',
      label: '식사 시간',
      category: 'meal',
      value: '18~19시',
      // **같은 투표를 가리킨다.** 항목이 「19토_17-18관람/18-19식사」 라
      // 관람 시간과 식사 시간을 한 번에 정했다. 두 곳에 따로 적으면 언젠가 어긋난다.
      sub: '관람일정 투표에서 함께 정했습니다',
      from: { surveyId: S_SCHEDULE, optionId: '5e97b1a0-0000-4000-8000-000000000948' },
    },
    {
      key: 'mealPlace',
      label: '식사 장소',
      category: 'meal',
      value: null,
      pending: '아직 안 정했습니다',
      sub: '정해지면 이 줄이 채워집니다',
    },
  ],
}
