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
    id: 'movie-20262770',
    movieCode: '20262770',
    bookingRank: 1,
    bookingRate: 58.8,
    title: '스파이더맨: 브랜드 뉴 데이',
    releaseStatus: '상영 중',
    releaseDate: '2026-07-29',
    runtime: 144,
    genre: '액션, 어드벤처, 판타지',
    ageRating: '12세 이상 관람가',
    director: '데스틴 다니엘 크리튼',
    summary: '모두의 기억에서 사라진 피터 파커가 통제하기 힘든 힘과 자신의 정체를 아는 적을 마주하는 새로운 스파이더맨 이야기입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20262770'
  },
  {
    id: 'movie-20250654',
    movieCode: '20250654',
    bookingRank: 2,
    bookingRate: 23.9,
    title: '오디세이',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-08-05',
    runtime: 172,
    genre: '액션, 드라마, 어드벤처',
    ageRating: '15세 이상 관람가',
    director: '크리스토퍼 놀란',
    summary: '트로이 전쟁을 마친 오디세우스가 신들의 분노와 괴물의 시련을 넘어 가족이 기다리는 왕국으로 돌아가는 여정입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20250654'
  },
  {
    id: 'movie-20233219',
    movieCode: '20233219',
    bookingRank: 3,
    bookingRate: 6,
    title: '호프',
    releaseStatus: '상영 중',
    releaseDate: '2026-07-15',
    runtime: 156,
    genre: 'SF, 스릴러, 액션',
    ageRating: '15세 이상 관람가',
    director: '나홍진',
    summary: '통신이 끊긴 외딴 마을에서 주민들이 정체불명의 존재와 맞서는 나홍진 감독의 SF 스릴러입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20233219'
  },
  {
    id: 'movie-20262381',
    movieCode: '20262381',
    bookingRank: 4,
    bookingRate: 4.5,
    title: '사랑의 하츄핑: 고래보석의 전설',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-08-05',
    runtime: 105,
    genre: '애니메이션',
    ageRating: '전체 관람가',
    director: '김수훈',
    summary: '로미와 하츄핑이 바닷속으로 사라진 엄마를 찾아 거대한 심해의 비밀과 맞서는 가족 애니메이션입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20262381'
  },
  {
    id: 'movie-20255484',
    movieCode: '20255484',
    bookingRank: 5,
    bookingRate: 1.1,
    title: '오케이 마담2',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-08-12',
    runtime: 108,
    genre: '코미디',
    ageRating: '15세 이상 관람가',
    director: '이철하',
    summary: '초호화 크루즈가 납치 사건 현장이 되면서 평범한 가족의 엄마 미영이 다시 전직 요원의 실력을 발휘하는 코미디 액션입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20255484'
  },
  {
    id: 'movie-20261784',
    movieCode: '20261784',
    bookingRank: 6,
    bookingRate: 1,
    title: '미니언즈 & 몬스터즈',
    releaseStatus: '상영 중',
    releaseDate: '2026-07-15',
    runtime: 89,
    genre: '애니메이션',
    ageRating: '전체 관람가',
    director: '피에르 꼬팽',
    summary: '천만 관객 감독을 꿈꾸는 미니언즈 제임스·헨리·에드가 몬스터를 찾아 떠나는 어드벤처입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20261784'
  },
  {
    id: 'movie-20264148',
    movieCode: '20264148',
    bookingRank: 7,
    bookingRate: 0.8,
    title: '어떻게 해야 했을까?',
    releaseStatus: '상영 중',
    releaseDate: '2026-07-29',
    runtime: 101,
    genre: '다큐멘터리',
    ageRating: '12세 이상 관람가',
    director: '공식 정보 확인',
    summary: '조현병 증상이 나타난 누나와 20여 년간 침묵한 가족을 남동생이 기록한 일본 다큐멘터리입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264148'
  },
  {
    id: 'movie-20264635',
    movieCode: '20264635',
    bookingRank: 8,
    bookingRate: 0.7,
    title: '명탐정 코난: 하이웨이의 타천사',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-08-12',
    runtime: 109,
    genre: '애니메이션',
    ageRating: '12세 이상 관람가',
    director: '공식 정보 확인',
    summary: '요코하마 모터사이클 축제에서 벌어진 폭주 오토바이 사건과 AI 사이카의 연관성을 쫓는 코난 극장판입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264635'
  },
  {
    id: 'movie-20259946',
    movieCode: '20259946',
    bookingRank: 9,
    bookingRate: 0.6,
    title: '모아나',
    releaseStatus: '상영 중',
    releaseDate: '2026-07-08',
    runtime: 115,
    genre: '어드벤처, 액션',
    ageRating: '전체 관람가',
    director: '토마스 케일',
    summary: '모투누이 섬의 모아나가 저주를 풀기 위해 마우이와 바다로 나서는 디즈니 실사 모험입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20259946'
  },
  {
    id: 'movie-20259781',
    movieCode: '20259781',
    bookingRank: 10,
    bookingRate: 0.6,
    title: '토이 스토리 5',
    releaseStatus: '상영 중',
    releaseDate: '2026-06-17',
    runtime: 101,
    genre: '애니메이션, 어드벤처, 코미디',
    ageRating: '전체 관람가',
    director: '앤드류 스탠튼',
    summary: '픽사의 대표 장난감 시리즈가 다섯 번째 장편 애니메이션으로 돌아온 작품입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20259781'
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.08.02 02:22'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
