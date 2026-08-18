/**
 * 달력에 뜨는 모임. **notice.html · notice.js 에서 기계적으로 뽑았다** —
 * 손으로 옮겨 적지 않았다 (scratchpad/gen-meetups.mjs).
 *
 * **여기가 임시 자리다.** 모임은 R-03-02 에서 `club.meetups` 로 옮긴다.
 * 그때 이 파일은 지운다. 지금 DB 에 넣지 않는 이유는 회원 테이블이 아직 없어서,
 * 모임을 넣으면 참석 응답 · 스레드가 갈 곳 없이 뜨기 때문이다.
 *
 * 옛 notice.html 은 달력 칸을 손으로 써 넣었다(월마다 42칸). 이식본은
 * 날짜에서 격자를 만들고 여기 있는 모임을 얹는다 — 달이 바뀌어도 손댈 것이 없다.
 */

export type MeetupKind = 'conf' | 'done' | 'dead'

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
    mapUrl: ''
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
    mapUrl: 'https://map.kakao.com/?q=%ED%90%81%ED%94%BC%EB%91%90%EC%84%BC%ED%84%B0%20%ED%95%9C%ED%99%94'
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
    mapUrl: ''
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
    venue: '여의도 63빌딩 별관 G층 고메스트리트 입구',
    description: '간단히 식사한 뒤 퐁피두센터 한화의 개관전 〈큐비스트: 시각의 혁신가들〉을 함께 관람합니다.',
    note: '완료된 일정입니다. 문화의날 관람료 14,000원으로 진행했습니다.',
    infoUrl: 'https://www.centrepompidou-hanwha.kr/exhibition/detail?seq=96&status=INACTIVE',
    infoLabel: '공식 전시 정보 보기 →',
    mapUrl: 'https://map.kakao.com/?q=%ED%90%81%ED%94%BC%EB%91%90%EC%84%BC%ED%84%B0%20%ED%95%9C%ED%99%94'
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
    mapUrl: 'https://map.kakao.com/?q=%EC%8B%A0%EC%82%AC%ED%95%98%EC%9A%B0%EC%8A%A4'
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
    mapUrl: 'https://map.kakao.com/?q=%EC%84%B8%EC%A2%85%EB%AC%B8%ED%99%94%ED%9A%8C%EA%B4%80%20%EC%B2%B4%EC%9E%84%EB%B2%84%ED%99%80'
  },
  {
    id: 'odyssey-movie',
    date: '2026-08-16',
    chip: '공식 · 영화 완료',
    kind: 'done',
    official: false,
    movie: true,
    status: '완료 · 공식 정기관람 · 영화',
    tone: 'done',
    title: '영화 《오디세이》 정기관람',
    dateLabel: '2026. 8. 16. (일)',
    time: '오후 5시 집결 · 오후 5시 30분 회차 · 상영관 안내 종료 오후 8시 32분',
    venue: '영등포 타임스퀘어 IMAX · 영등포구 영중로 15',
    description: '2026년 2차 정기관람 영화 모임으로 영화 러닝타임은 172분입니다.',
    note: '관람비는 2만원이며 관람 후 저녁식사와 티타임까지 완료했습니다.',
    infoUrl: '',
    infoLabel: '',
    mapUrl: 'https://map.kakao.com/?q=%EC%98%81%EB%93%B1%ED%8F%AC%20%ED%83%80%EC%9E%84%EC%8A%A4%ED%80%98%EC%96%B4%20IMAX'
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
    mapUrl: 'https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%97%AD%EC%82%AC%EB%B0%95%EB%AC%BC%EA%B4%80'
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
    note: '관람일은 8월 29일로 확정되었습니다. 집결 시간과 최종 참석자는 톡방 공지를 확인해 주세요.',
    infoUrl: 'https://feverup.com/m/665616',
    infoLabel: '전시·예매 정보 보기 →',
    mapUrl: 'https://map.kakao.com/?q=%EC%8B%A0%EC%82%AC%ED%95%98%EC%9A%B0%EC%8A%A4'
  }
]

/** 완료된 모임은 며칠까지 목록에 남기나 (notice.js 의 COMPLETED_VISIBLE_DAYS) */
export const COMPLETED_VISIBLE_DAYS = 3

/** 달력에 그릴 달. 옛 notice.html 이 8 · 9월 두 장을 손으로 써 두었던 자리다. */
export const MONTHS: { year: number; month: number }[] = [{year:2026,month:8},{year:2026,month:9},{year:2026,month:7}]
