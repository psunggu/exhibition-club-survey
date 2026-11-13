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
    bookingRate: 14.9,
    title: '임영웅 | 아임 히어로 더 스타디움 2',
    releaseStatus: '개봉 예정',
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
    id: 'movie-20261807',
    movieCode: '20261807',
    bookingRank: 2,
    bookingRate: 11.3,
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
    id: 'movie-20247221',
    movieCode: '20247221',
    bookingRank: 3,
    bookingRate: 8.8,
    title: '폭설',
    releaseStatus: '개봉 예정',
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
    id: 'movie-20259894',
    movieCode: '20259894',
    bookingRank: 4,
    bookingRate: 5.7,
    title: '최종면접',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-04',
    runtime: 107,
    genre: '미스터리',
    ageRating: '15세 이상 관람가',
    director: '김정훈',
    cast: '조이현, 김재원, 신승호',
    summary: '5000:1의 경쟁률, 제한시간 2시간, 단 1명의 합격자 치열한 경쟁률을 뚫고 최종면접에 오른 6명의 지원자.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20259894',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x192/thn_24b8bf9b98f6446cbd083435b7f92164.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_704528cf36064e318e90c17d49199396.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_108a3fd84df245db8d4e92a4849b88ee.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_b92cd978be144f7089964cb48ed36816.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_82f7c0a2a0b84307926c9043815eaa4b.jpg']
  },
  {
    id: 'movie-20264957',
    movieCode: '20264957',
    bookingRank: 5,
    bookingRate: 5.1,
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
    id: 'movie-20210087',
    movieCode: '20210087',
    bookingRank: 6,
    bookingRate: 5,
    title: '듄',
    releaseStatus: '상영 중',
    releaseDate: '2022-02-09',
    runtime: 155,
    genre: 'SF',
    ageRating: '12세 이상 관람가',
    director: '드니 빌뇌브',
    cast: '티모시 샬라메, 레베카 퍼거슨, 오스카 아이삭',
    summary: '“듄을 지배하는 자가 우주를 지배한다!” 10191년, 아트레이데스 가문의 후계자인 폴(티모시 샬라메)은 시공을 초월한 존재이자 전 우주를 구원할 예지된 자의 운명을 타고났다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20210087',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x192/thn_d9364b67f5ce403e917d01cef141bee7.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2021/08/thumb_x132/thn_ce0e9ebbd948434cbaa4782f59a45bb9.jpg', 'https://www.kobis.or.kr/common/mast/movie/2021/08/thumb_x132/thn_8f612c4c6e54462eb66884e5ff91423f.jpeg', 'https://www.kobis.or.kr/common/mast/movie/2021/08/thumb_x132/thn_6f0d1a399e2c4866829c46a4e2b3e2f1.jpeg', 'https://www.kobis.or.kr/common/mast/movie/2021/08/thumb_x132/thn_289023e0ca064bdc9ed44d5793744b0d.jpeg']
  },
  {
    id: 'movie-20167904',
    movieCode: '20167904',
    bookingRank: 7,
    bookingRate: 4,
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
    id: 'movie-20267121',
    movieCode: '20267121',
    bookingRank: 8,
    bookingRate: 4,
    title: '헝거게임 50번째 추첨의 날',
    releaseStatus: '개봉 예정',
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
    id: 'movie-20267846',
    movieCode: '20267846',
    bookingRank: 9,
    bookingRate: 3.8,
    title: '극장판 마카앤로니: 기억탐험 대소동!',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-11-14',
    runtime: 71,
    genre: '애니메이션',
    ageRating: '전체 관람가',
    director: '우경민',
    cast: '해당정보없음',
    summary: '언제나 티격태격하지만 둘도 없는 콤비였던 마카와 로니! 어느 날, 사소한 오해와 말다툼 끝에 대격돌하게 된 로니는 홧김에 발명품을 사용해 마카에 대한 기억을 몽땅 지워버리기로 결심한다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20267846',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x192/thn_334a56af5ecf4c5db6737765c4e42a74.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_efaf1ad547f6440aaeaf87c88399db03.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_7dd825c13fc449bb9b22adebcf4d1c32.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_1aa27fa90fc6435a9f08ae53d93765c0.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_0bd13118114c426b900b00213b5cdad1.jpg']
  },
  {
    id: 'movie-20267697',
    movieCode: '20267697',
    bookingRank: 10,
    bookingRate: 3.5,
    title: '명탐정 코난: 30호 살인 사건',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-05',
    runtime: 93,
    genre: '애니메이션, 액션, 미스터리',
    ageRating: '12세 이상 관람가',
    director: '카마나카 노부하루',
    cast: '타카야마 미나미, 야마구치 캇페이',
    summary: '‘토토 타워’가 디자인된 10만 원권 신권 지폐가 발행되어 세상이 떠들썩한 가운데, 코난과 어린이 탐정단, 브라운 박사, 미란이와 보라는 한국 지폐 인쇄국 원주 공장을 방문한다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20267697',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x192/thn_3336b74f51a946babe62ed76c3f57a73.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_71ca10a5bdd6417da7a50ac9c199c885.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_1f02cc546d114d9e822c71460f95e803.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_a0044aaf4d4d49d68f01fde785485544.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_a1deac99831d42fa88962af75ecbaf2a.jpg']
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.11.13 23:42'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
