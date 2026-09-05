/**
 * 실시간 영화 예매 순위. **app/public/app.js 에서 기계적으로 뽑았다**
 * (scratchpad/gen-movies.mjs).
 *
 * **이건 events 가 아니다.** 전시·공연과 모양이 완전히 다르다 —
 * 예매율 · 상영시간 · 관람등급 · 감독. KOBIS 박스오피스 순위이고
 * `public.events` 에 넣을 것이 아니다.
 *
 * **여기가 임시 자리다.** Phase 06(콘텐츠 자동화)에서 KOBIS 를 주 1회
 * 자동 수집하게 되면 이 파일은 지운다. 그때까지는 손으로 갱신한다 —
 * 옛 app.js 에서 하던 것과 같다.
 *
 * R-01-04 에서 "하드코딩 이벤트 배열"을 걷어냈지만 영화는 그 대상이
 * 아니었다. 그래서 처음 이식할 때 빠졌고, 영화 탭이 빈 화면이 됐다.
 * 회원 입장에서는 그냥 고장이라 되살렸다.
 */

export type Movie = {
  id: string
  movieCode: string
  bookingRank: number
  bookingRate: number
  title: string
  releaseStatus: string
  releaseDate: string
  runtime: number
  genre: string
  ageRating: string
  director: string
  summary: string
  infoUrl: string
}

export const MOVIES: Movie[] = [
  {
    id: 'movie-20250654',
    movieCode: '20250654',
    bookingRank: 1,
    bookingRate: 54.3,
    title: '오디세이',
    releaseStatus: '상영 중',
    releaseDate: '2026-08-05',
    runtime: 172,
    genre: '액션, 드라마, 어드벤처',
    ageRating: '15세 이상 관람가',
    director: '크리스토퍼 놀란',
    summary: '트로이 전쟁을 마친 오디세우스가 신들의 분노와 괴물의 시련을 넘어 가족이 기다리는 왕국으로 돌아가는 여정입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20250654'
  },
  {
    id: 'movie-20256308',
    movieCode: '20256308',
    bookingRank: 2,
    bookingRate: 6.1,
    title: '인턴',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-09-16',
    runtime: 132,
    genre: '드라마',
    ageRating: '12세 이상 관람가',
    director: '김도영',
    summary: '패션 브랜드를 일군 젊은 대표와 경력 37년의 실버 인턴이 서로에게 없는 시선을 나누며 일상에 온기를 더해 갑니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20256308'
  },
  {
    id: 'movie-20262770',
    movieCode: '20262770',
    bookingRank: 3,
    bookingRate: 6,
    title: '스파이더맨: 브랜드 뉴 데이',
    releaseStatus: '상영 중',
    releaseDate: '2026-07-29',
    runtime: 144,
    genre: '액션, 어드벤처, 판타지',
    ageRating: '12세 이상 관람가',
    director: '데스틴 다니엘 크리튼',
    summary: '기억에서 지워진 삶을 다시 시작하는 스파이더맨이 새로운 위협과 마주하며 자신의 자리를 찾아갑니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20262770'
  },
  {
    id: 'movie-20265146',
    movieCode: '20265146',
    bookingRank: 4,
    bookingRate: 4.3,
    title: '옵세션',
    releaseStatus: '상영 중',
    releaseDate: '2026-09-02',
    runtime: 109,
    genre: '공포(호러)',
    ageRating: '청소년 관람불가',
    director: '커리 바커',
    summary: '짝사랑하던 상대의 마음을 얻으려 소원을 빈 뒤, 되돌릴 수 없는 대가와 마주하는 공포극입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20265146'
  },
  {
    id: 'movie-20247458',
    movieCode: '20247458',
    bookingRank: 5,
    bookingRate: 2.2,
    title: '경주기행',
    releaseStatus: '상영 중',
    releaseDate: '2026-08-26',
    runtime: 110,
    genre: '범죄',
    ageRating: '15세 이상 관람가',
    director: '김미조',
    summary: '경주를 배경으로 얽힌 사건과 사람들을 좇아가는 범죄 드라마입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20247458'
  },
  {
    id: 'movie-20204641',
    movieCode: '20204641',
    bookingRank: 6,
    bookingRate: 2.2,
    title: '비광',
    releaseStatus: '상영 중',
    releaseDate: '2026-09-02',
    runtime: 109,
    genre: '드라마, 가족',
    ageRating: '15세 이상 관람가',
    director: '이지원',
    summary: '한때 톱스타 부부였던 두 사람이, 사건의 용의자로 지목된 딸을 지키려 8년 전의 인연과 다시 마주합니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20204641'
  },
  {
    id: 'movie-20264918',
    movieCode: '20264918',
    bookingRank: 7,
    bookingRate: 2,
    title: '싱 어게인',
    releaseStatus: '상영 중',
    releaseDate: '2026-09-02',
    runtime: 98,
    genre: '드라마',
    ageRating: '15세 이상 관람가',
    director: '존 카니',
    summary: '무명 축가 가수와 나락 직전의 팝스타가 우연히 만나 함께 만든 단 한 곡을 둘러싼 이야기입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264918'
  },
  {
    id: 'movie-20233219',
    movieCode: '20233219',
    bookingRank: 8,
    bookingRate: 1.6,
    title: '호프',
    releaseStatus: '상영 중',
    releaseDate: '2026-07-15',
    runtime: 156,
    genre: 'SF, 스릴러, 액션',
    ageRating: '15세 이상 관람가',
    director: '나홍진',
    summary: '통신이 끊긴 마을에서 정체 모를 존재와 맞서게 된 사람들이 겪는 비극을 그립니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20233219'
  },
  {
    id: 'movie-20265423',
    movieCode: '20265423',
    bookingRank: 9,
    bookingRate: 1.2,
    title: '더 드라마',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-09-09',
    runtime: 106,
    genre: '드라마, 멜로/로맨스',
    ageRating: '15세 이상 관람가',
    director: '크리스토퍼 보글리',
    summary: '결혼을 앞둔 커플이 우연히 알게 된 비밀 하나로 서로에 대한 믿음이 흔들리는 로맨스 스릴러입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20265423'
  },
  {
    id: 'movie-20264915',
    movieCode: '20264915',
    bookingRank: 10,
    bookingRate: 0.7,
    title: '딥 워터',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-09-09',
    runtime: 107,
    genre: '스릴러, 공포(호러)',
    ageRating: '15세 이상 관람가',
    director: '레니 할린',
    summary: '태평양 한복판에 추락한 여객기에서 살아남은 승객들이 침몰하는 기체와 상어 떼 속에서 탈출을 시도합니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264915'
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.09.05 21:40'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
