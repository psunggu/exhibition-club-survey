/**
 * 달력에 뜨는 모임. **notice.html · notice.js 에서 기계적으로 뽑았다**
 * (scratchpad/gen-meetups2.mjs). 손으로 옮겨 적지 않았다.
 *
 * **여기가 임시 자리다.** 모임은 R-03-02 에서 `club.meetups` 로 옮긴다.
 *
 * 지울 때 함께 볼 곳
 *   app/src/Calendar.tsx  byDate · upcoming · completed · open · MONTHS · PAST_MONTHS
 *   scripts/validate-weekly-digest.mjs  일정 대조 블록
 *
 * 옛 notice.html 은 달력 칸 42개를 손으로 써 넣었다. 이식본은 날짜에서 격자를
 * 만들고 여기 있는 모임을 얹는다 — 달이 바뀌어도 손댈 것이 없다.
 *
 * ── 7월 두 건의 `official` 은 일부러 false 다 ──────────────────
 * 톡방 원문에서는 방장이 톡게시판 **공지**로 `[7월 1차 정기관람]` ·
 * `[7월 2차 정기관람]` 을 올렸으므로, 원문만 보면 둘 다 공식 정기관람이다.
 * 그런데도 false 로 둔 것은 **운영자가 정한 것이다 (2026-08-21)** —
 * 지난 달력 색을 이제 와서 바꾸지 않기로 했다.
 *
 * 그래서 분류 검사(scripts/validate-meetup-taxonomy.mjs)의 `정기관람` 규칙은
 * 2026-08-22 부터만 본다. 앞으로 넣는 모임에는 그대로 적용된다.
 * 대조하다 이 대목이 또 눈에 걸리거든, 실수가 아니라 결정이다.
 */

export type MeetupKind = 'conf' | 'done' | 'dead' | 'tent'

export type Meetup = {
  id: string
  /** ISO 날짜. 달력 칸을 찾는 열쇠다 */
  date: string
  /** 달력 칸에 뜨는 짧은 글 */
  chip: string
  kind: MeetupKind
  /** 교구 공식 일정인가 */
  official: boolean
  movie: boolean
  status: string
  tone: string
  title: string
  dateLabel: string
  time: string
  venue: string
  description: string
  note: string
  infoUrl: string
  infoLabel: string
  mapUrl: string
  /** '완료된 모임' 목록에 뜨는 한 줄. 제목과 다른 문구다 */
  completedRow: string
  /**
   * 이 모임을 정하려고 돌린 설문들의 id.
   *
   * **왜 설문이 아니라 모임 쪽에 적나.** 설문이 모임보다 먼저 태어나기 때문이다 —
   * 9월 설문 안내문이 「가장 많이 받은 전시로 9월 정기 관람을 잡습니다」 인 것처럼,
   * 설문을 만드는 때에는 그 모임이 아직 없다. 모임은 언제나 나중에 확정되므로
   * 모임 줄을 쓸 때 설문 id 를 함께 적는 것이 순서에 맞고 잊을 일이 적다.
   *
   * 한 모임에 전시 설문과 식사 설문이 둘 다 붙을 수 있어 처음부터 배열이다.
   * 비워 두면 그 모임과 이어진 설문이 없다는 뜻이고, 설문 화면은 **아무것도 추측하지 않는다.**
   */
  surveyIds?: string[]
}

export const MEETUPS: Meetup[] = [
  {
    id: 'kickoff',
    date: '2026-07-05',
    chip: '킥오프 12:30',
    kind: 'done',
    official: false,
    movie: false,
    status: '완료',
    tone: 'done',
    title: '킥오프 첫모임',
    dateLabel: '2026. 7. 5. (일)',
    time: '오후 12:30',
    venue: '2별관 2층',
    description: '41교구 전시·박물관 동아리의 운영 방향과 첫 전시 일정을 함께 나눈 시작 모임입니다.',
    note: '완료된 일정입니다.',
    infoUrl: '',
    infoLabel: '',
    mapUrl: '',
    completedRow: '7/5 (일) 12:30 킥오프 첫모임 · 2별관 2층'
  },
  {
    id: 'cubist-weekend',
    date: '2026-07-11',
    chip: '큐비스트 16시',
    kind: 'done',
    official: false,
    movie: false,
    status: '완료',
    tone: 'done',
    title: '7월 정기관람 ① 〈큐비스트〉 주말 관람',
    dateLabel: '2026. 7. 11. (토)',
    time: '오후 4시',
    venue: '퐁피두센터 한화',
    description: '1907년부터 1927년까지 전개된 큐비즘의 흐름을 퐁피두센터 소장품 91점과 한국 근현대 회화로 살펴보는 개관전입니다.',
    note: '완료된 일정입니다.',
    infoUrl: 'https://www.centrepompidou-hanwha.kr/exhibition/detail?seq=96&status=INACTIVE',
    infoLabel: '공식 전시 정보 보기 →',
    mapUrl: 'https://map.kakao.com/?q=%ED%90%81%ED%94%BC%EB%91%90%EC%84%BC%ED%84%B0%20%ED%95%9C%ED%99%94',
    completedRow: '7/11 (토) 16:00 7월 정기관람 ① 〈큐비스트〉 주말 관람 · 퐁피두센터 한화'
  },
  {
    id: 'seongryul',
    date: '2026-07-26',
    chip: '성률전 관람',
    kind: 'done',
    official: false,
    movie: false,
    status: '완료',
    tone: 'done',
    title: '성률 기획전 〈여름을 닮은 우리〉',
    dateLabel: '2026. 7. 26. (일)',
    time: '3부 예배 후',
    venue: '단체방 공지 장소',
    description: '성률 작가가 애정 어린 시선으로 포착한 여름의 조각들을 한데 모은 기획전을 함께 관람했습니다.',
    note: '완료된 일정입니다. 세부 관람 기록은 단체방 공지를 확인해 주세요.',
    infoUrl: '',
    infoLabel: '',
    mapUrl: '',
    completedRow: '7/26 (일) 3부 예배 후 성률 기획전 〈여름을 닮은 우리〉 관람'
  },
  {
    id: 'cubist-evening',
    date: '2026-07-29',
    chip: '식사·관람 19시',
    kind: 'done',
    official: false,
    movie: false,
    status: '완료',
    tone: 'done',
    title: '7월 정기관람 ② 〈큐비스트〉 평일 관람',
    dateLabel: '2026. 7. 29. (수)',
    time: '오후 7시 집결·식사 후 관람',
    venue: '여의도 63빌딩 별관 G층(지하) 고메스트리트 입구',
    description: '간단히 식사한 뒤 퐁피두센터 한화의 개관전 〈큐비스트: 시각의 혁신가들〉을 함께 관람합니다.',
    note: '완료된 일정입니다. 문화의날 관람료 14,000원으로 진행했습니다.',
    infoUrl: 'https://www.centrepompidou-hanwha.kr/exhibition/detail?seq=96&status=INACTIVE',
    infoLabel: '공식 전시 정보 보기 →',
    mapUrl: 'https://map.kakao.com/?q=%ED%90%81%ED%94%BC%EB%91%90%EC%84%BC%ED%84%B0%20%ED%95%9C%ED%99%94',
    completedRow: '7/29 (수) 19:00 7월 정기관람 ② 〈큐비스트〉 평일 관람 · 식사 후 퐁피두센터 한화 관람'
  },
  {
    id: 'cubist-morning',
    date: '2026-07-29',
    chip: '오전벙개 10시',
    kind: 'done',
    official: false,
    movie: false,
    status: '완료',
    tone: 'done',
    title: '〈큐비스트〉 오전 벙개',
    dateLabel: '2026. 7. 29. (수)',
    time: '오전 10시',
    venue: '퐁피두센터 한화',
    description: '평일 저녁 관람이 어려운 회원을 위한 오전 자율 관람 모임입니다.',
    note: '완료된 일정입니다.',
    infoUrl: 'https://www.centrepompidou-hanwha.kr/exhibition/detail?seq=96&status=INACTIVE',
    infoLabel: '공식 전시 정보 보기 →',
    mapUrl: 'https://map.kakao.com/?q=%ED%90%81%ED%94%BC%EB%91%90%EC%84%BC%ED%84%B0%20%ED%95%9C%ED%99%94',
    completedRow: '7/29 (수) 10:00 〈큐비스트〉 오전 벙개 · 퐁피두센터 한화'
  },
  {
    id: 'gaudi-deadline',
    date: '2026-07-31',
    chip: '가우디 마감',
    kind: 'dead',
    official: false,
    movie: false,
    status: '예매 마감',
    tone: 'dead',
    title: '〈가우디: 서울에서 다시 태어나다〉',
    dateLabel: '2026. 7. 31. (금)',
    time: '얼리버드 판매 마감일',
    venue: '신사하우스',
    description: '가우디 서거 100주기를 맞아 원본 작품과 유물, 공식 공인 레플리카로 그의 창작 세계를 살펴보는 전시입니다. 전시는 8월 1일부터 10월 31일까지 열립니다.',
    note: '얼리버드 30% 할인가는 19,000원이며, 실제 예매 가능 여부와 조건은 예매 페이지에서 다시 확인하세요.',
    infoUrl: 'https://feverup.com/m/665616',
    infoLabel: '전시·예매 정보 보기 →',
    mapUrl: 'https://map.kakao.com/?q=%EC%8B%A0%EC%82%AC%ED%95%98%EC%9A%B0%EC%8A%A4',
    completedRow: ''
  },
  {
    id: 'classic-concert',
    date: '2026-08-15',
    chip: '공연 완료',
    kind: 'done',
    official: false,
    movie: false,
    status: '완료',
    tone: 'done',
    title: 'S Classic Week 무료 클래식 공연',
    dateLabel: '2026. 8. 15. (토)',
    time: '오후 2시',
    venue: '세종문화회관 체임버홀',
    description: '제한된 초청 좌석으로 진행한 클래식 공연입니다.',
    note: '참여자 2명으로 관람을 완료했습니다. 개인별 이름은 공개하지 않습니다.',
    infoUrl: '',
    infoLabel: '',
    mapUrl: 'https://map.kakao.com/?q=%EC%84%B8%EC%A2%85%EB%AC%B8%ED%99%94%ED%9A%8C%EA%B4%80%20%EC%B2%B4%EC%9E%84%EB%B2%84%ED%99%80',
    completedRow: '8/15 (토) 14:00 무료 클래식 공연 · 세종문화회관 체임버홀'
  },
  {
    id: 'odyssey-movie',
    date: '2026-08-16',
    chip: '영화 완료',
    kind: 'done',
    official: false,
    movie: true,
    status: '완료 · 영화 모임',
    tone: 'done',
    title: '영화 《오디세이》 관람',
    dateLabel: '2026. 8. 16. (일)',
    time: '오후 5시 집결 · 오후 5시 30분 회차 · 상영관 안내 종료 오후 8시 32분',
    venue: '영등포타임스퀘어 IMAX · 영등포구 영중로 15',
    description: '2026년 2차 정기관람 영화 모임으로 영화 러닝타임은 172분입니다.',
    note: '관람비는 2만원이며 관람 후 저녁식사와 티타임까지 완료했습니다.',
    infoUrl: '',
    infoLabel: '',
    mapUrl: 'https://map.kakao.com/?q=%EC%98%81%EB%93%B1%ED%8F%AC%ED%83%80%EC%9E%84%EC%8A%A4%ED%80%98%EC%96%B4%20IMAX',
    completedRow: '8/16 (일) 17:00 영화 《오디세이》 관람 · 영등포타임스퀘어 IMAX'
  },
  {
    id: 'history-museum',
    date: '2026-08-22',
    chip: '공식 · 집결 14:50',
    kind: 'conf',
    official: true,
    movie: false,
    status: '공식 정기관람',
    tone: 'official',
    title: '8월 정기관람 · 서울역사박물관',
    dateLabel: '2026. 8. 22. (토)',
    time: '오후 2시 50분 집결 · 오후 3시~5시 30분 일정',
    venue: '서울역사박물관 앞 · 종로구 새문안로 55',
    description: '오후 3시~4시 30분 박물관 관람 후 오후 4시 30분~5시 30분 1층 파스쿠찌에서 티타임과 퀴즈를 진행합니다.',
    note: '오후 5시 30분 이후 귀가 및 저녁식사는 자율이며 일정은 다소 변경될 수 있습니다. 참고자료는 톡게시판에서 확인해 주세요.',
    infoUrl: 'https://museum.seoul.go.kr/www/guide/vis/infomation.jsp?sso=ok',
    infoLabel: '박물관 관람 안내 보기 →',
    mapUrl: 'https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%97%AD%EC%82%AC%EB%B0%95%EB%AC%BC%EA%B4%80',
    completedRow: '',
    // 저녁식사 장소를 정한 설문. 이 모임 날짜가 지나면 설문 화면이 그것을 「지난 설문」 으로 옮긴다.
    surveyIds: ['5e97b1a0-0000-4000-8000-000000000902']
  },
  {
    id: 'gaudi-visit',
    date: '2026-08-29',
    chip: '가우디 확정',
    kind: 'conf',
    official: false,
    movie: false,
    status: '확정',
    tone: 'conf',
    title: '가우디 서울전 관람',
    dateLabel: '2026. 8. 29. (토)',
    time: '시간 확인 중',
    venue: '신사하우스 · 신사동',
    description: '가우디 서거 100주기를 맞아 원본 작품과 유물, 공식 공인 레플리카로 그의 창작 세계를 살펴보는 전시입니다.',
    note: '티켓은 각자 예매합니다. 얼리버드(30% · 19,000원) 판매는 7월 31일에 끝났으니 정가로 확인해 주세요. 집결 시간과 최종 참석자는 톡방 공지를 확인해 주세요.',
    infoUrl: 'https://feverup.com/m/665616',
    infoLabel: '전시·예매 정보 보기 →',
    mapUrl: 'https://map.kakao.com/?q=%EC%8B%A0%EC%82%AC%ED%95%98%EC%9A%B0%EC%8A%A4',
    completedRow: ''
  }
]

/** 완료 목록에만 있고 달력 칩이 없는 것 */
export const EXTRA_COMPLETED: { date: string; text: string }[] = []

/** 완료된 모임은 며칠까지 목록 맨 위에 남기나 (notice.js 의 COMPLETED_VISIBLE_DAYS) */
export const COMPLETED_VISIBLE_DAYS = 3

/** 펼쳐 보이는 달 */
export const MONTHS: { year: number; month: number }[] = [
  { year: 2026, month: 8 },
  { year: 2026, month: 9 },
]

/** 지난 달 — 옛 화면에서 '완료 일정 달력' 안에 접혀 있던 것 */
export const PAST_MONTHS: { year: number; month: number }[] = [
  { year: 2026, month: 7 },
]
