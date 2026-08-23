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
    bookingRate: 71.5,
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
    id: 'movie-20262770',
    movieCode: '20262770',
    bookingRank: 2,
    bookingRate: 7.8,
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
    id: 'movie-20247458',
    movieCode: '20247458',
    bookingRank: 3,
    bookingRate: 5.6,
    title: '경주기행',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-08-26',
    runtime: 110,
    genre: '범죄',
    ageRating: '15세 이상 관람가',
    director: '김미조',
    summary: '8년 전 수학여행을 떠난 뒤 돌아오지 못한 막내 경주의 생일을 맞아 경주로 향한 엄마와 세 딸이, 낯선 남자를 차에 태운 채 복수의 여정을 시작하는 범죄극입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20247458'
  },
  {
    id: 'movie-20264557',
    movieCode: '20264557',
    bookingRank: 4,
    bookingRate: 3.8,
    title: '오크 스트리트의 마지막 날',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-08-26',
    runtime: 99,
    genre: '액션, 어드벤처, 미스터리, SF, 스릴러',
    ageRating: '12세 이상 관람가',
    director: '데이빗 로버트 밋첼',
    summary: '1982년의 한 동네가 공룡이 지배하는 선사시대로 이동하면서, 한 가족이 살아남아 일상으로 돌아갈 길을 찾는 SF 어드벤처입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264557'
  },
  {
    id: 'movie-20264635',
    movieCode: '20264635',
    bookingRank: 5,
    bookingRate: 1,
    title: '명탐정 코난: 하이웨이의 타천사',
    releaseStatus: '상영 중',
    releaseDate: '2026-08-12',
    runtime: 109,
    genre: '애니메이션',
    ageRating: '12세 이상 관람가',
    director: 'KOBIS 감독 정보 미등록',
    summary: '요코하마 모터사이클 축제에서 벌어진 폭주 오토바이 사건과 AI 사이카의 연관성을 쫓는 코난 극장판입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264635'
  },
  {
    id: 'movie-20264035',
    movieCode: '20264035',
    bookingRank: 6,
    bookingRate: 0.9,
    title: '인시디어스: 그들이 넘어왔다',
    releaseStatus: '상영 중',
    releaseDate: '2026-08-20',
    runtime: 105,
    genre: '공포, 미스터리, 스릴러',
    ageRating: '15세 이상 관람가',
    director: '제이콥 체이스',
    summary: '젬마와 딸 마야가 영혼의 세계와 연결된 존재에게 쫓기며, 악령이 현실로 넘어오는 통로를 막으려는 공포영화입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264035'
  },
  {
    id: 'movie-20253289',
    movieCode: '20253289',
    bookingRank: 7,
    bookingRate: 0.9,
    title: '극장판 귀멸의 칼날: 무한성편',
    releaseStatus: '재개봉 예정',
    releaseDate: '2026-08-26',
    runtime: 155,
    genre: '애니메이션',
    ageRating: '15세 이상 관람가',
    director: '소토자키 하루오',
    summary: '탄지로와 귀살대가 혈귀의 본거지 무한성에서 벌이는 최종 결전을 그린 극장판 애니메이션입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20253289'
  },
  {
    id: 'movie-20265505',
    movieCode: '20265505',
    bookingRank: 8,
    bookingRate: 0.8,
    title: '터치드 콘서트 [하이라이트 포] : 더 무비',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-08-26',
    runtime: 109,
    genre: '공연',
    ageRating: '전체 관람가',
    director: '손석, 오정민',
    summary: '밴드 터치드의 콘서트 무대와 제작기, 인터뷰를 함께 담아 현장의 에너지를 스크린으로 전하는 공연 실황 영화입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20265505'
  },
  {
    id: 'movie-20265388',
    movieCode: '20265388',
    bookingRank: 9,
    bookingRate: 0.7,
    title: '고스트밴드',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-08-26',
    runtime: 82,
    genre: '애니메이션',
    ageRating: '전체 관람가',
    director: '금동호',
    summary: '영혼을 볼 수 있는 싱어송라이터가 음악을 사랑했던 유령들과 밴드를 결성하며 벌어지는 판타지 음악 애니메이션입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20265388'
  },
  {
    id: 'movie-20100810',
    movieCode: '20100810',
    bookingRank: 10,
    bookingRate: 0.7,
    title: '마루 밑 아리에티',
    releaseStatus: '재개봉 상영 중',
    releaseDate: '2026-08-19',
    runtime: 94,
    genre: '애니메이션',
    ageRating: '전체 관람가',
    director: '요네바야시 히로마사',
    summary: '사람들의 집 마루 밑에서 물건을 빌려 살아가는 작은 소녀 아리에티가 소년 쇼우와 만나며 시작되는 우정 이야기입니다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20100810'
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.08.24 03:12'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
