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
 * ── 7월 두 건의 `regular` 를 true 로 되돌렸다 (2026-08-30) ──────
 * 톡방 원문에서 방장이 톡게시판 **공지**로 `[7월 1차 정기관람]` ·
 * `[7월 2차 정기관람]` 을 올렸으므로, 원문대로는 둘 다 정기관람이다.
 *
 * 2026-08-21 에는 이 둘을 false 로 두기로 했었다 — 지난 달력 색을 이제 와서
 * 바꾸지 않기로 한 것이다. 그 결정을 뒤집은 이유는 **달력 색 규칙이 달라져서**다.
 * 갈래마다 다른 색을 칠하던 것을 그만두고 정기/수시 두 갈래만 색으로 가르면서,
 * 완료된 칸은 정기든 수시든 같은 회색이 되었다 — 정기에만 왼쪽에 초록 선이 하나 선다.
 * 지난 달력이 뒤집히는 폭이 그만큼 작아졌고, 반대로 플래그를 false 로 두면
 * 제목이 「7월 정기관람」 인 칸과 「9월 정기관람」 인 칸이 서로 다르게 그려진다.
 * 같은 것을 같게 그리는 쪽을 택했다.
 *
 * 분류 검사(scripts/validate-meetup-taxonomy.mjs)의 회차 번호 규칙은 그대로
 * 2026-08-22 부터만 본다 — 7월 제목의 ①② 는 실제로 두 번 모인 것이라 맞는 표기다.
 */

export type MeetupKind = 'conf' | 'done' | 'dead' | 'tent'

/**
 * 어떤 자리인가. **상태(`kind`)와 섞지 않는다** — 이쪽은 달력에서 색을 갖지 않고,
 * 달력 아래 「이번 달 모임」 목록에서 글자로만 읽힌다.
 *
 * 옛 `movie: boolean` 이 여기로 흡수됐다. 불리언 하나로는 박물관 투어와 전시 관람을
 * 가를 방법이 제목 글자밖에 없었다.
 *
 * 이름이 `venue` 가 아닌 것은 그 자리가 이미 차 있어서다 — `venue` 는
 * '퐁피두센터 한화' 처럼 **장소 이름**을 담는 칸이고 팝업이 그대로 찍는다.
 */
export type VenueKind = '전시' | '박물관' | '영화' | '공연' | '모임'

export type Meetup = {
  id: string
  /** ISO 날짜. 달력 칸을 찾는 열쇠다 */
  date: string
  /** 달력 칸에 뜨는 짧은 글 */
  chip: string
  kind: MeetupKind
  /**
   * 달마다 한 번 도는 정기관람인가. 아니면 그때그때 잡힌 수시 모임이다.
   *
   * 옛 이름은 `official` 이었는데 「공식 계정」 처럼 읽혀서 바꿨다.
   * 달력에서 **색을 가르는 두 축 가운데 하나**다 (다른 하나는 `kind`).
   */
  regular: boolean
  venueKind: VenueKind
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
    regular: false,
    venueKind: '모임',
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
    regular: true,
    venueKind: '전시',
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
    regular: false,
    venueKind: '전시',
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
    regular: true,
    venueKind: '전시',
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
    regular: false,
    venueKind: '전시',
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
    regular: false,
    venueKind: '전시',
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
    regular: false,
    venueKind: '공연',
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
    regular: false,
    venueKind: '영화',
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
  // 다녀왔다 — 2026-08-23 에 운영자가 완료로 옮겼다.
  // 주석은 반드시 이 자리(덩어리 밖)에 둔다. id…status 사이에 끼우면
  // validate-meetup-taxonomy.mjs 의 정규식이 이 모임을 통째로 못 읽는다.
  {
    id: 'history-museum',
    date: '2026-08-22',
    chip: '관람 완료',
    kind: 'done',
    regular: true,
    venueKind: '박물관',
    status: '공식 정기관람',
    tone: 'official',
    title: '8월 정기관람 · 서울역사박물관',
    dateLabel: '2026. 8. 22. (토)',
    time: '오후 2시 50분 집결 · 오후 3시~5시 30분 일정',
    venue: '서울역사박물관 앞 · 종로구 새문안로 55',
    description: '오후 3시~4시 30분 박물관 관람 후 오후 4시 30분~5시 30분 1층 파스쿠찌에서 티타임과 퀴즈를 진행합니다.',
    note: '11명이 참석해 공식 정기관람을 완료했습니다. 개인별 이름은 공개하지 않습니다.',
    infoUrl: 'https://museum.seoul.go.kr/www/guide/vis/infomation.jsp?sso=ok',
    infoLabel: '박물관 관람 안내 보기 →',
    mapUrl: 'https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%97%AD%EC%82%AC%EB%B0%95%EB%AC%BC%EA%B4%80',
    completedRow: '8/22 (토) 14:50 8월 정기관람 · 서울역사박물관 · 참석 11명',
    // 저녁식사 장소를 정한 설문. 이 모임 날짜가 지나면 설문 화면이 그것을 「지난 설문」 으로 옮긴다.
    surveyIds: ['5e97b1a0-0000-4000-8000-000000000902']
  },
  {
    id: 'gaudi-visit',
    date: '2026-08-29',
    chip: '가우디 확정',
    kind: 'conf',
    regular: false,
    venueKind: '전시',
    status: '확정',
    tone: 'conf',
    title: '가우디 서울전 관람',
    dateLabel: '2026. 8. 29. (토)',
    // **집결하지 않는다.** 운영자가 2026-08-27 에 개별 참석으로 정했다.
    // 그래서 「시간 확인 중」 이 아니다 — 확인할 집결 시간 자체가 없다.
    time: '개별 관람',
    venue: '신사하우스 · 신사동',
    description: '가우디 서거 100주기를 맞아 원본 작품과 유물, 공식 공인 레플리카로 그의 창작 세계를 살펴보는 전시입니다.',
    note: '이번 관람은 개별 참석입니다. 따로 집결하지 않고 각자 편한 때에 다녀오시면 됩니다. '
      + '티켓은 각자 예매합니다. 얼리버드(30% · 19,000원) 판매는 7월 31일에 끝났으니 정가로 확인해 주세요.',
    infoUrl: 'https://feverup.com/m/665616',
    infoLabel: '전시·예매 정보 보기 →',
    mapUrl: 'https://map.kakao.com/?q=%EC%8B%A0%EC%82%AC%ED%95%98%EC%9A%B0%EC%8A%A4',
    completedRow: ''
  },
  {
    id: 'september-regular',
    date: '2026-09-19',
    chip: '서도호 17:00',
    kind: 'conf',
    regular: true,
    venueKind: '전시',
    status: '공식 정기관람',
    tone: 'official',
    title: '9월 정기관람 · 《서도호》',
    dateLabel: '2026. 9. 19. (토)',
    /**
     * 토요일이라 17~18시 관람이 가능하다. 서울관은 **수·토만 21시까지** 열고
     * 나머지 요일은 18시에 닫는다 — 다른 요일을 골랐으면 이 시간표가 성립하지 않는다.
     * 관람일 투표가 토요일로 몰린 것과 맞물린 결과다.
     */
    time: '16:50 집결 · 17:00~18:00 관람 · 18:00~ 식사·티타임',
    /**
     * 전시실은 **공식 상세에서 다시 확인했다** (2026-08-29).
     * 보드(app.js)에는 「지하 1층 3·5전시실」 로 적혀 있는데 공식은
     * 3·4·5전시실과 2층 MMCA 스튜디오다. 넓으니 관람 60분이 빠듯할 수 있다.
     */
    venue: '국립현대미술관 서울 · 지하 1층 3·4·5전시실, 2층 MMCA 스튜디오',
    description: '이주와 거주, 개인과 공동체, 공간과 기억을 탐구해 온 설치미술가 서도호의 '
      + '초기작부터 주요작, 진행 중인 프로젝트까지 조망하는 대규모 개인전입니다. '
      + '60분 관람한 뒤 저녁 식사와 티타임이 이어집니다.',
    /**
     * **예매 안내를 맨 앞에 둔다.** 이 모임에서 회원이 놓칠 수 있는 것은
     * 집결 시각이 아니라 티켓이다 — 각자 예매해야 하고, 매진되면 못 온다.
     * 신청자 이름은 적지 않는다 (AGENTS.md 「실제 회원 데이터」). 인원만 적는다.
     */
    note: '티켓은 각자 예매하셔야 합니다. 9월 7일(월) 오후 6시에 티켓이 열리고 '
      + '매진이 빠르니 그날 바로 잡아 주세요. 온라인 예매가 어려우면 현장 선착순 구매도 됩니다. '
      + '관람료는 8,000원입니다. 예매를 마치면 톡방 공지에 댓글로 알려 주세요. '
      + '만 24세 이하·학부생 등은 증빙하면 무료라고 공식 안내에 있으니 해당되면 확인해 보세요. '
      + '현재 신청 10명입니다.',
    infoUrl: 'https://booking.mmca.go.kr/product/ko/performance/548',
    infoLabel: '예매 페이지 열기 →',
    mapUrl: 'https://map.kakao.com/?q=%EA%B5%AD%EB%A6%BD%ED%98%84%EB%8C%80%EB%AF%B8%EC%88%A0%EA%B4%80%20%EC%84%9C%EC%9A%B8',
    completedRow: '',
    // 이 모임을 정한 두 투표 — 전시회(903) 와 관람일정(904). 둘 다 톡방에서 옮겨 온 것이다.
    surveyIds: [
      '5e97b1a0-0000-4000-8000-000000000903',
      '5e97b1a0-0000-4000-8000-000000000904',
    ],
  }
]

/**
 * **날짜가 아직 안 정해진 것.**
 *
 * AGENTS.md 가 정해 둔 규칙이다 — 날짜가 확정되지 않은 것은 「조율 중 · 미정」 에만 두고,
 * 확정된 뒤에 「다가오는 확정 모임」 과 달력에 함께 넣는다.
 * 옛 페이지(app/public/notice.html)에는 그 절이 있었는데 이식하면서 빠졌다.
 * 범례에는 `tent`(모집중 · 미정)가 남아 있는데 정작 그것을 보여 줄 목록이 없었다.
 *
 * ── 일부러 `date` 를 두지 않는다 ───────────────────────────
 * Meetup 으로 만들면 달력이 그 날짜 칸에 칩을 얹는다 —
 * **아직 안 정해진 것을 정해진 것처럼 칠하게 된다.** 자료 모양에서부터 막는다.
 * 후보 날짜는 `candidates` 에 두되 달력에는 안 칠하고, 글로만 적는다.
 *
 * ── 상태를 글로 적지 않는다 ────────────────────────────────
 * 「투표 중입니다」 같은 말은 손으로 적는 순간부터 낡는다. 투표가 끝나도 그 줄은 그대로다.
 * 살아 있는 상태(진행 중 · N명 / 마감)는 달력 위쪽 「설문 참여하기」 카드가
 * DB 에서 읽어 말한다. 여기에는 **변하지 않는 사실**만 적는다.
 */
export type Tentative = {
  id: string
  /** 왼쪽 딱지. 무엇이 미정인지 한 낱말로 */
  tag: string
  /** 한 줄 설명. 변하지 않는 사실만 적는다 */
  text: string
  /** 후보 날짜(ISO). 달력에는 안 칠한다 — 다 지났는지 검사가 보는 데 쓴다 */
  candidates: string[]
  /** 이 일정을 정하는 설문이 있으면 그 화면으로 가는 길 */
  surveyRoute?: string
}

/**
 * **2026-08-29 현재 비어 있다.**
 *
 * 9월 정기관람이 확정 공지되면서(《서도호》 · 9월 19일 토요일) 여기 있던 줄이
 * `MEETUPS` 의 `september-regular` 로 올라갔다. 규칙대로다 —
 * 날짜가 정해지기 전에는 여기, 정해지면 달력과 「다가오는 확정 모임」.
 *
 * 비어 있어도 화면은 절을 지우지 않는다. Calendar.tsx 가
 * 「지금 조율 중인 일정이 없습니다」 라고 적는다 —
 * 「없는 것」 과 「그런 칸이 아예 없는 것」 은 다르기 때문이다.
 */
export const TENTATIVE: Tentative[] = [
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
