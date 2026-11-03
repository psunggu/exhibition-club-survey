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
    id: 'movie-20259894',
    movieCode: '20259894',
    bookingRank: 1,
    bookingRate: 18.9,
    title: '최종면접',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-04',
    runtime: 107,
    genre: '미스터리',
    ageRating: '15세 이상 관람가',
    director: '김정훈',
    summary: '5000:1의 경쟁률, 제한시간 2시간, 단 1명의 합격자 치열한 경쟁률을 뚫고 최종면접에 오른 6명의 지원자.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20259894'
  },
  {
    id: 'movie-20261807',
    movieCode: '20261807',
    bookingRank: 2,
    bookingRate: 14.4,
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
    id: 'movie-20267412',
    movieCode: '20267412',
    bookingRank: 3,
    bookingRate: 10.3,
    title: '극장판 마법소녀 마도카☆마기카〈발푸르기스의 회천〉',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-04',
    runtime: 119,
    genre: '애니메이션',
    ageRating: '15세 이상 관람가',
    director: '신보 아키유키',
    summary: '어느 지방 도시 미타키하라시에 사는 카나메 마도카는 조금 소극적이지만 어디에나 있는 여자 중학생. 하지만 "마법소녀"가 된 마녀와 싸우는 소녀들이 존재한다는 것을 알게 되고, 그 싸움에 자신도 휘말린다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20267412'
  },
  {
    id: 'movie-20267697',
    movieCode: '20267697',
    bookingRank: 4,
    bookingRate: 8.3,
    title: '명탐정 코난: 30호 살인 사건',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-11-05',
    runtime: 93,
    genre: '애니메이션, 액션, 미스터리',
    ageRating: '12세 이상 관람가',
    director: '카마나카 노부하루',
    summary: '‘토토 타워’가 디자인된 10만 원권 신권 지폐가 발행되어 세상이 떠들썩한 가운데, 코난과 어린이 탐정단, 브라운 박사, 미란이와 보라는 한국 지폐 인쇄국 원주 공장을 방문한다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20267697'
  },
  {
    id: 'movie-20264498',
    movieCode: '20264498',
    bookingRank: 5,
    bookingRate: 5.2,
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
    bookingRank: 6,
    bookingRate: 4.8,
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
    id: 'movie-20261694',
    movieCode: '20261694',
    bookingRank: 7,
    bookingRate: 4.2,
    title: '투어스 브이알 콘서트 : 러쉬로드',
    releaseStatus: '상영 중',
    releaseDate: '2026-03-04',
    runtime: 58,
    genre: '드라마, 공연',
    ageRating: '전체 관람가',
    director: '김지애',
    summary: '청춘의 에너지가 가득한 락 페스티벌 무대. 음악이 터져 나오는 그 순간, 평범한 하루를 벗어난 TWS와의 특별한 여정이 시작된다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20261694'
  },
  {
    id: 'movie-20243927',
    movieCode: '20243927',
    bookingRank: 8,
    bookingRate: 3.3,
    title: '낮과 밤은 서로에게',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-04',
    runtime: 79,
    genre: '멜로/로맨스',
    ageRating: '15세 이상 관람가',
    director: '김종관',
    summary: '같은 꿈을 꾼 두 사람, 유진과 현오 엉뚱한 재회 속에서 영민에게 세상의 비밀을 이야기해 주는 상미 첫 만남에 불신과 호기심의 경계를 오가는 소설가 혜진과 영화감독 동남 이별 앞에 선 오랜 연인, 나경과 종수의 서툰…',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20243927'
  },
  {
    id: 'movie-20261695',
    movieCode: '20261695',
    bookingRank: 9,
    bookingRate: 2,
    title: '욕쟁이 할머니',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-04',
    runtime: 72,
    genre: '다큐멘터리, 가족',
    ageRating: '전체 관람가',
    director: '홍승표',
    summary: '포천 \'욕쟁이 할머니\'로 불리며 평생 따뜻한 밥상을 내어주었던 나의 어머니. 어머니가 떠난 뒤, 막내아들 홍승표 화백은 식당과 그림 속에 남겨진 어머니를 다시 마주한다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20261695'
  },
  {
    id: 'movie-20266765',
    movieCode: '20266765',
    bookingRank: 10,
    bookingRate: 1.9,
    title: '와일드 호스 나인',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-04',
    runtime: 116,
    genre: '미스터리, 범죄, 스릴러',
    ageRating: '15세 이상 관람가',
    director: '마틴 맥도나',
    summary: '"올해 최고의 영화" -Deadline- 제83회 베니스국제영화제 남우주연상 수상작 1973년, CIA 베테랑 요원 ‘크리스’와 ‘리’는 임무 수행을 위해 태평양 한가운데 자리한 외딴 낙원, 이스터섬으로 향한다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20266765'
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.11.04 05:02'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
