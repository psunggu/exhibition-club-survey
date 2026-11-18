/**
 * 실시간 영화 예매 순위. **scripts/update-movies.mjs 가 KOBIS 에서 받아 쓴다.**
 * 손으로 고쳐도 되지만 다음 갱신 때 덮인다 — 오래 남길 것은 여기 적지 않는다.
 *
 *   node scripts/update-movies.mjs
 *
 * **이건 events 가 아니다.** 전시·공연과 모양이 완전히 다르다 —
 * 예매율 · 상영시간 · 관람등급 · 감독 · 출연 · 포스터 · 스틸컷. KOBIS 예매율 순위이고
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
  /** 출연 — 앞의 셋. 없으면 빈 값 */
  cast: string
  summary: string
  infoUrl: string
  /** 대표 포스터 썸네일(KOBIS, 가로 192px). 없으면 빈 값 — 화면은 포스터 칸을 비운다 */
  posterUrl: string
  /** 스틸컷 썸네일 넷까지(KOBIS). 「자세히 보기」 안에 */
  stills: string[]
}

export const MOVIES: Movie[] = [
  {
    id: 'movie-20268264',
    movieCode: '20268264',
    bookingRank: 1,
    bookingRate: 22.2,
    title: '임영웅ㅣ아임 히어로 더 스타디움 2',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-18',
    runtime: 144,
    genre: '공연',
    ageRating: '전체 관람가',
    director: '오윤동, 송두선',
    cast: '임영웅',
    summary: '임영웅과 영웅시대가 함께 걸어온 10년을 기념하는 특별한 축제! 콘서트 누적 관객 100만 명 돌파라는 기념비적인 기록과 스타디움의 뜨거운 열기를 대형 스크린과 풍성한 사운드로 생생하게 담아낸 공연 실황 영화.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20268264',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x192/thn_ea18d0d1de8840719bdb8e2a2184ccf6.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_2bed968b08774a24b546a7222fd40462.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_254a333d758a4ddbbedcf6f5b5506417.JPG', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_99a3959bdf2f497d913b3c0e47e087cd.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_089d4cc963c343f2a3ae034f647c2fa9.jpg']
  },
  {
    id: 'movie-20247221',
    movieCode: '20247221',
    bookingRank: 2,
    bookingRate: 19.8,
    title: '폭설',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-18',
    runtime: 88,
    genre: '미스터리, 드라마',
    ageRating: '15세 이상 관람가',
    director: '박선우, 홍의정',
    cast: '김윤석, 구교환, 박수영',
    summary: '“눈 설(雪) 까마귀 오(烏). 여기가 어떤 곳인지도 모르고 왔어?” 퇴직을 하루 앞둔 역장 갑수는 마지막 열차를 통과시키고 평생을 지켜오던 설오역을 떠날 준비를 한다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20247221',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x192/thn_5a5e1f75fcf0463097f1a9c5512532e6.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_913e20aedf5948e091927a379c7785f0.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_1fee6fb36446431b8a3f946b98409c6d.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_41e5e1abb28248c7811e811afbac9ea2.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_2ce55f289fe14be6b9bf7241de363896.jpg']
  },
  {
    id: 'movie-20267121',
    movieCode: '20267121',
    bookingRank: 3,
    bookingRate: 10.5,
    title: '헝거게임 50번째 추첨의 날',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-18',
    runtime: 158,
    genre: '액션, 스릴러, 어드벤처',
    ageRating: '15세 이상 관람가',
    director: '프란시스 로렌스',
    cast: '조셉 자다, 맥케나 그레이스, 엘 패닝',
    summary: '시스템을 파괴하고 게임의 룰을 바꿔라 캐피톨을 비웃어 ‘역대 최하점’을 받은 흙수저 소년 헤이미치.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20267121',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x192/thn_a480582ed27c4a2797f051ecfd67d48a.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/09/thumb_x132/thn_eafdbd4b413f4bef95399a351c39a291.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/09/thumb_x132/thn_1c25e67de9594e35a020fd4e22445de4.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/09/thumb_x132/thn_df96e8cbee2545f4912b22e721dfb79a.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/09/thumb_x132/thn_1096e9ac0cf44733b34d814d54392958.jpg']
  },
  {
    id: 'movie-20261807',
    movieCode: '20261807',
    bookingRank: 4,
    bookingRate: 5.5,
    title: '극장판 치이카와: 인어 섬의 비밀',
    releaseStatus: '상영 중',
    releaseDate: '2026-09-30',
    runtime: 98,
    genre: '애니메이션',
    ageRating: '전체 관람가',
    director: '오이카와 케이',
    cast: '아오키 하루카(치이카와), 타나카 마코토(하치와레), 오자와 아리(우사기)',
    summary: '어느 날, 광장에서 쉬고 있던 치이카와와 가르마 앞에 얼굴에 전단지를 붙인 토끼가 나타난다. 그곳엔 “특별한 섬으로의 초대”라는 글귀가 적혀 있는데...',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20261807',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/08/thumb_x192/thn_9ea8c9b1c2c04a9dbd6c6d34e58456e8.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/08/thumb_x132/thn_ebda070f5cf34a8190aaea20d5ed8089.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/08/thumb_x132/thn_501b2448fd414516b1e330bd0a54a27b.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/08/thumb_x132/thn_9db22f7f47254f92b6f0599d8a67bcad.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/08/thumb_x132/thn_dca092c59d3743e995f038a1e47d1d9b.jpg']
  },
  {
    id: 'movie-20264957',
    movieCode: '20264957',
    bookingRank: 5,
    bookingRate: 4.2,
    title: '폴2: 데드포인트',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-11',
    runtime: 98,
    genre: '스릴러, 액션',
    ageRating: '15세 이상 관람가',
    director: '마이클 스피어리그, 피터 스피어이그',
    cast: '버지니아 가드너, 그레이스 캐롤라인 커리, 해리엇 슬레이터',
    summary: '고도 제한 해제 숨쉬기조차 힘든 해발 3,300m 수십 년간 출입이 금지된 가장 위험한 산, \'콴\'. 한 번의 실수가 죽음으로 이어지는 곳.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264957',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x192/thn_424ea7e5ae8842c487194e78bdecc4ae.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/08/thumb_x132/thn_8742458651754c198ba06bdf6c163496.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/08/thumb_x132/thn_e08dc431c91a4f598ea3b6f61923f92f.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/08/thumb_x132/thn_576ee541e87648b8a292426ca4790cbb.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/08/thumb_x132/thn_faa80308937444378cc08146b592dd5d.jpg']
  },
  {
    id: 'movie-20167904',
    movieCode: '20167904',
    bookingRank: 6,
    bookingRate: 3.8,
    title: '라라랜드',
    releaseStatus: '상영 중',
    releaseDate: '2017-12-08',
    runtime: 127,
    genre: '드라마, 뮤지컬, 멜로/로맨스',
    ageRating: '12세 이상 관람가',
    director: '데이미언 셔젤',
    cast: '엠마 스톤, 라이언 고슬링, 핀 위트록',
    summary: '황홀한 사랑, 순수한 희망, 격렬한 열정… 이 곳에서 모든 감정이 폭발한다! 꿈을 꾸는 사람들을 위한 별들의 도시 ‘라라랜드’.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20167904',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x192/thn_d197d4030a9b401f8d90175436dfdf15.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2016/10/thumb_x132/thn_0e81e09531a2479cb89adbf1e1fdef0a.jpg', 'https://www.kobis.or.kr/common/mast/movie/2016/11/thumb_x132/thn_e36649453fdd44ef9282b98b5166155c.jpg', 'https://www.kobis.or.kr/common/mast/movie/2016/11/thumb_x132/thn_275f4901eb25476ba032dc8664b5bf8b.jpg', 'https://www.kobis.or.kr/common/mast/movie/2016/11/thumb_x132/thn_c37d06be16bc46d6a8ea7a4968509b88.jpg']
  },
  {
    id: 'movie-20263271',
    movieCode: '20263271',
    bookingRank: 7,
    bookingRate: 3.6,
    title: '미트 페어런츠 4',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-11-25',
    runtime: 105,
    genre: '코미디',
    ageRating: '12세 이상 관람가',
    director: '존 햄버그',
    cast: '로버트 드 니로, 벤 스틸러, 아리아나 그란데',
    summary: '흠잡을 데 없는 똑똑한 예비 며느리 ‘올리비아’(아리아나 그란데)를 새로운 가족으로 인정할 수 없는 ‘포커’ 가의 예비 시아버지 ‘그렉’(벤 스틸러)의 멘탈 폭발 첫 만남을 담은 영화',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20263271',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x192/thn_e757e4fcde3b4aee908b332a9ae8dfc9.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x132/thn_01e510c374524e5cb35100881d93bcd3.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x132/thn_dc9daecd5fb84cce9d0556151390d2c4.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x132/thn_a9b33d9fee6844e8ad2297d4bd2dca79.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x132/thn_6e0d3207205a4e9f9b611689fa253d58.jpg']
  },
  {
    id: 'movie-20265321',
    movieCode: '20265321',
    bookingRank: 8,
    bookingRate: 3.1,
    title: '아름다운 초저녁달',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-18',
    runtime: 118,
    genre: '멜로/로맨스',
    ageRating: '12세 이상 관람가',
    director: '타케무라 켄타로',
    cast: '미치에다 슌스케, 안자이 세이라',
    summary: '큰 키와 시크한 외모로 교내 여학생들의 ‘왕자님’인 요이. 어느 날 또 다른 ‘왕자님’, 코하쿠와 운명처럼 부딪친다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20265321',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x192/thn_24a0554393da4c7caaaccaca924fb762.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_075c76bd90d94a02befa6dad578fb81d.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_7a67d7621a614dc89902e286347b057b.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_4b56191b62e646f68e4bb100b30f8af5.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_6648fd96b0834292934a2694b533e3a8.jpg']
  },
  {
    id: 'movie-20244970',
    movieCode: '20244970',
    bookingRank: 9,
    bookingRate: 2.5,
    title: '슬픈 열대',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-11-25',
    runtime: 107,
    genre: '액션',
    ageRating: '청소년 관람불가',
    director: '박훈정',
    cast: '이신영(루), 박유림(죠죠), 김명민(사부)',
    summary: '사부의 죽음 이후 슬픈 열대가 피로 물들기 시작했다! 버려진 아이들을 킬러로 키워낸 조직 ‘슬픈 열대’의 절대자 ‘사부’가 살해당했다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20244970',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x192/thn_8bc324993d2c4daab9c9aefd8ace75cf.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_8ed32dce71454fc2a9187235153c2699.jpeg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_8a5bd8385b9d4a649c7693f161208d44.jpeg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_2d2e1281fa454bc387640f0bf9cef6c6.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_49bf97f7971040df828b081df7641804.jpg']
  },
  {
    id: 'movie-20261694',
    movieCode: '20261694',
    bookingRank: 10,
    bookingRate: 1.9,
    title: '투어스 브이알 콘서트 : 러쉬로드',
    releaseStatus: '상영 중',
    releaseDate: '2026-03-04',
    runtime: 58,
    genre: '드라마, 공연',
    ageRating: '전체 관람가',
    director: '김지애',
    cast: '',
    summary: '청춘의 에너지가 가득한 락 페스티벌 무대. 음악이 터져 나오는 그 순간, 평범한 하루를 벗어난 TWS와의 특별한 여정이 시작된다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20261694',
    posterUrl: '',
    stills: []
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.11.18 05:08'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
