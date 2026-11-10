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
    id: 'movie-20268264',
    movieCode: '20268264',
    bookingRank: 1,
    bookingRate: 12.9,
    title: '임영웅 | 아임 히어로 더 스타디움 2',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-11-18',
    runtime: 144,
    genre: '공연',
    ageRating: '전체 관람가',
    director: '오윤동, 송두선',
    summary: '임영웅과 영웅시대가 함께 걸어온 10년을 기념하는 특별한 축제! 콘서트 누적 관객 100만 명 돌파라는 기념비적인 기록과 스타디움의 뜨거운 열기를 대형 스크린과 풍성한 사운드로 생생하게 담아낸 공연 실황 영화.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20268264'
  },
  {
    id: 'movie-20261807',
    movieCode: '20261807',
    bookingRank: 2,
    bookingRate: 9.9,
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
    id: 'movie-20210087',
    movieCode: '20210087',
    bookingRank: 3,
    bookingRate: 8.9,
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
    id: 'movie-20247221',
    movieCode: '20247221',
    bookingRank: 4,
    bookingRate: 8.7,
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
    id: 'movie-20167904',
    movieCode: '20167904',
    bookingRank: 5,
    bookingRate: 6.7,
    title: '라라랜드',
    releaseStatus: '상영 중',
    releaseDate: '2017-12-08',
    runtime: 127,
    genre: '드라마, 뮤지컬, 멜로/로맨스',
    ageRating: '12세 이상 관람가',
    director: '데이미언 셔젤',
    summary: '황홀한 사랑, 순수한 희망, 격렬한 열정… 이 곳에서 모든 감정이 폭발한다! 꿈을 꾸는 사람들을 위한 별들의 도시 ‘라라랜드’.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20167904'
  },
  {
    id: 'movie-20264957',
    movieCode: '20264957',
    bookingRank: 6,
    bookingRate: 5.4,
    title: '폴2: 데드포인트',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-11',
    runtime: 98,
    genre: '스릴러, 액션',
    ageRating: '15세 이상 관람가',
    director: '마이클 스피어리그, 피터 스피어이그',
    summary: '고도 제한 해제 숨쉬기조차 힘든 해발 3,300m 수십 년간 출입이 금지된 가장 위험한 산, \'콴\'. 한 번의 실수가 죽음으로 이어지는 곳.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264957'
  },
  {
    id: 'movie-20259894',
    movieCode: '20259894',
    bookingRank: 7,
    bookingRate: 4.4,
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
    id: 'movie-20267121',
    movieCode: '20267121',
    bookingRank: 8,
    bookingRate: 3.7,
    title: '헝거게임 50번째 추첨의 날',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-11-18',
    runtime: 158,
    genre: '액션, 스릴러, 어드벤처',
    ageRating: '15세 이상 관람가',
    director: '프란시스 로렌스',
    summary: '시스템을 파괴하고 게임의 룰을 바꿔라 캐피톨을 비웃어 ‘역대 최하점’을 받은 흙수저 소년 헤이미치.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20267121'
  },
  {
    id: 'movie-20261694',
    movieCode: '20261694',
    bookingRank: 9,
    bookingRate: 3.4,
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
    id: 'movie-20266589',
    movieCode: '20266589',
    bookingRank: 10,
    bookingRate: 3.3,
    title: '프레셔',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-11',
    runtime: 100,
    genre: '스릴러',
    ageRating: '12세 이상 관람가',
    director: '앤소니 마라스',
    summary: '역사를 바꿀 최대 규모의 상륙작전을 72시간 앞둔 연합군 지휘부 기상학자 ‘스태그’(앤드류 스캇)는 D-Day 당일 치명적인 폭풍우를 예보하고, 최고 사령관 ‘아이젠하워’(브렌든 프레이저)는 작전을 강행할 것인지, 멈출 것인지 극한의 선택에 내몰린다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20266589'
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.11.11 05:08'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
