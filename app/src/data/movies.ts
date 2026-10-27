/**
 * 실시간 영화 예매 순위. **scripts/update-movies.mjs 가 KOBIS 에서 받아 쓴다.**
 * 손으로 고쳐도 되지만 다음 갱신 때 덮인다 — 오래 남길 것은 여기 적지 않는다.
 *
 *   node scripts/update-movies.mjs
 *
 * **이건 events 가 아니다.** 전시·공연과 모양이 완전히 다르다 —
 * 예매율 · 상영시간 · 관람등급 · 감독. KOBIS 예매율 순위이고
 * `public.events` 에 넣을 것이 아니다.
 *
 * 거르지 않는다. 순위대로 싣고 볼지 말지는 회원이 판단한다 (AGENTS.md).
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
    id: 'movie-20261807',
    movieCode: '20261807',
    bookingRank: 1,
    bookingRate: 26.6,
    title: '극장판 치이카와: 인어 섬의 비밀',
    releaseStatus: '상영 중',
    releaseDate: '2026-09-30',
    runtime: 98,
    genre: '애니메이션',
    ageRating: '전체 관람가',
    director: '오이카와 케이',
    summary: '어느 날, 광장에서 쉬고 있던 치이카와와 가르마 앞에 얼굴에 전단지를 붙인 토끼가 나타난다. 그곳엔 “특별한 섬으로의 초대”라는 글귀가 적혀 있는데...',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20261807'
  },
  {
    id: 'movie-20259894',
    movieCode: '20259894',
    bookingRank: 2,
    bookingRate: 10.7,
    title: '최종면접',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-11-04',
    runtime: 107,
    genre: '미스터리',
    ageRating: '15세 이상 관람가',
    director: '김정훈',
    summary: '5000:1의 경쟁률, 제한시간 2시간, 단 1명의 합격자 치열한 경쟁률을 뚫고 최종면접에 오른 6명의 지원자.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20259894'
  },
  {
    id: 'movie-20264498',
    movieCode: '20264498',
    bookingRank: 3,
    bookingRate: 10.1,
    title: '하트 오브 비스트',
    releaseStatus: '상영 중',
    releaseDate: '2026-10-28',
    runtime: 101,
    genre: '드라마, 액션',
    ageRating: '12세 이상 관람가',
    director: '데이비드 에이어',
    summary: '비행기 추락 사고로 알래스카 오지에 고립된 전직 육군 특수부대원 ‘제임스 ’(브래드 피트)와 그의 은퇴한 군견 ‘오딘’이 매 순간 닥쳐오는 죽음의 위협 속에서 오직 서로에게만 의지한 채 처절한 사투를 벌이는 어드벤처 생존 드라마',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264498'
  },
  {
    id: 'movie-20231795',
    movieCode: '20231795',
    bookingRank: 4,
    bookingRate: 8.8,
    title: '수능, 출제의 비밀',
    releaseStatus: '상영 중',
    releaseDate: '2026-10-28',
    runtime: 99,
    genre: '코미디',
    ageRating: '12세 이상 관람가',
    director: '이용재',
    summary: '수능 D-DAY, 정답은 이미 정해져 있다?',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20231795'
  },
  {
    id: 'movie-20155762',
    movieCode: '20155762',
    bookingRank: 5,
    bookingRate: 5.2,
    title: '진격의 거인: 홍련의 화살',
    releaseStatus: '상영 중',
    releaseDate: '2026-10-28',
    runtime: 119,
    genre: '애니메이션, 판타지',
    ageRating: '15세 이상 관람가',
    director: '아라키 테츠로',
    summary: '거인이 모든 것을 지배하는 세계. 거인의 먹이가 된 인류는 50미터 높이의 거대한 벽을 쌓아, 벽 밖으로 나갈 자유를 포기한 대가로 거인의 침략을 막아내고 있다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20155762'
  },
  {
    id: 'movie-20250053',
    movieCode: '20250053',
    bookingRank: 6,
    bookingRate: 3.3,
    title: '실낙원',
    releaseStatus: '상영 중',
    releaseDate: '2026-10-21',
    runtime: 100,
    genre: '스릴러, 드라마',
    ageRating: '15세 이상 관람가',
    director: '연상호',
    summary: '9년 전 잃은 아들이 돌아왔다 그러나 내가 알던 그 아이가 아니다 9년 전 캠핑스쿨 버스 실종 사건으로 아들을 잃은 류소영은 \'낙원의 아이들\'이라는 AI 프로그램을 통해 어린 시절의 아들과 만나며 하루하루를 버텨낸다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20250053'
  },
  {
    id: 'movie-20256161',
    movieCode: '20256161',
    bookingRank: 7,
    bookingRate: 2.9,
    title: '타짜: 벨제붑의 노래',
    releaseStatus: '상영 중',
    releaseDate: '2026-09-23',
    runtime: 129,
    genre: '범죄, 드라마',
    ageRating: '청소년 관람불가',
    director: '최국희',
    summary: '중세 유럽, 종교인들은 카드가 악마의 도구라고 생각했다. 특히 죽음을 뜻하는 스페이드 13장엔 모두 악마의 이름이 들어 있다. 지옥으로 떨어진 추락한 천사 \'루시퍼\'와 지옥의 기존 지배자 \'벨제붑\'.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20256161'
  },
  {
    id: 'movie-20267412',
    movieCode: '20267412',
    bookingRank: 8,
    bookingRate: 2.7,
    title: '극장판 마법소녀 마도카☆마기카〈발푸르기스의 회천〉',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-11-04',
    runtime: 119,
    genre: '애니메이션',
    ageRating: '15세 이상 관람가',
    director: '신보 아키유키',
    summary: '어느 지방 도시 미타키하라시에 사는 카나메 마도카는 조금 소극적이지만 어디에나 있는 여자 중학생. 하지만 "마법소녀"가 된 마녀와 싸우는 소녀들이 존재한다는 것을 알게 되고, 그 싸움에 자신도 휘말린다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20267412'
  },
  {
    id: 'movie-20266764',
    movieCode: '20266764',
    bookingRank: 9,
    bookingRate: 2.7,
    title: '그대, 별처럼',
    releaseStatus: '상영 중',
    releaseDate: '2026-10-28',
    runtime: 134,
    genre: '멜로/로맨스',
    ageRating: '15세 이상 관람가',
    director: '후지이 미치히토',
    summary: '아름다운 바다와 하늘이 펼쳐진 세토 내해의 어느 섬. 섬으로 전학 온 카이(요코하마 류세이)와, 이 섬에서 자란 아키미(히로세 스즈).',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20266764'
  },
  {
    id: 'movie-20268151',
    movieCode: '20268151',
    bookingRank: 10,
    bookingRate: 2.1,
    title: '요루시카 라이브 [도작]',
    releaseStatus: '상영 중',
    releaseDate: '2026-10-28',
    runtime: 87,
    genre: '공연',
    ageRating: '12세 이상 관람가',
    director: '해당정보없음',
    summary: '작곡가 n-buna의 치밀한 리딩과 보컬 suis의 독보적인 음색이 만들어낸 또 하나의 세계.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20268151'
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.10.28 05:00'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
