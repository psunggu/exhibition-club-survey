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
    bookingRate: 17.8,
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
    bookingRate: 10.9,
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
    id: 'movie-20267697',
    movieCode: '20267697',
    bookingRank: 3,
    bookingRate: 9.9,
    title: '명탐정 코난: 30호 살인 사건',
    releaseStatus: '상영 중',
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
    bookingRank: 4,
    bookingRate: 6.8,
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
    id: 'movie-20267412',
    movieCode: '20267412',
    bookingRank: 5,
    bookingRate: 5.1,
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
    id: 'movie-20247221',
    movieCode: '20247221',
    bookingRank: 6,
    bookingRate: 4.3,
    title: '폭설',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-11-18',
    runtime: 88,
    genre: '미스터리, 드라마',
    ageRating: '15세 이상 관람가',
    director: '박선우, 홍의정',
    summary: '“눈 설(雪) 까마귀 오(烏). 여기가 어떤 곳인지도 모르고 왔어?” 퇴직을 하루 앞둔 역장 갑수는 마지막 열차를 통과시키고 평생을 지켜오던 설오역을 떠날 준비를 한다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20247221'
  },
  {
    id: 'movie-20210087',
    movieCode: '20210087',
    bookingRank: 7,
    bookingRate: 4.2,
    title: '듄',
    releaseStatus: '상영 중',
    releaseDate: '2022-02-09',
    runtime: 155,
    genre: 'SF',
    ageRating: '12세 이상 관람가',
    director: '드니 빌뇌브',
    summary: '“듄을 지배하는 자가 우주를 지배한다!” 10191년, 아트레이데스 가문의 후계자인 폴(티모시 샬라메)은 시공을 초월한 존재이자 전 우주를 구원할 예지된 자의 운명을 타고났다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20210087'
  },
  {
    id: 'movie-20264957',
    movieCode: '20264957',
    bookingRank: 8,
    bookingRate: 3.3,
    title: '폴2: 데드포인트',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-11-11',
    runtime: 98,
    genre: '스릴러, 액션',
    ageRating: '15세 이상 관람가',
    director: '마이클 스피어리그, 피터 스피어이그',
    summary: '고도 제한 해제 숨쉬기조차 힘든 해발 3,300m 수십 년간 출입이 금지된 가장 위험한 산, \'콴\'. 한 번의 실수가 죽음으로 이어지는 곳.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264957'
  },
  {
    id: 'movie-20261694',
    movieCode: '20261694',
    bookingRank: 9,
    bookingRate: 3.2,
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
    id: 'movie-20264481',
    movieCode: '20264481',
    bookingRank: 10,
    bookingRate: 2.9,
    title: '모자 쓴 고양이',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-06',
    runtime: 106,
    genre: '애니메이션',
    ageRating: '전체 관람가',
    director: '알레산드로 칼로니, 에리카 리비노자',
    summary: '이제껏 본 적 없는 ‘씽’나는 ‘냥’리법석이 펼쳐진다! 기상천외한 마법으로 소동을 일으키는 ‘모자 쓴 고양이’에게 주어진 특급 임무!',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264481'
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.11.07 05:00'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
