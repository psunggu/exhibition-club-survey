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
    id: 'movie-20262701',
    movieCode: '20262701',
    bookingRank: 1,
    bookingRate: 28.2,
    title: '듄: 파트 3',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-12-16',
    runtime: 150,
    genre: '액션',
    ageRating: '12세 이상 관람가',
    director: '드니 빌뇌브',
    cast: '티모시 샬라메, 젠데이아 콜먼, 제이슨 모모아',
    summary: '전 세계가 기다려온 그 장대한 결말 마침내 황제의 자리에 올라 절대 권력을 쥐게 된 ‘폴’(티모시 샬라메). 그러나 그의 이름으로 시작된 거대한 전쟁은 온 우주를 위험 속으로 몰아넣는다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20262701',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x192/thn_e233c4bd77284dfca043f986c8315a3b.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x132/thn_ce56bade1d1d4ebf8f753b060e1422f0.jpeg', 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x132/thn_07d2281bcba94918903d3ef7d1fc1935.jpeg', 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x132/thn_32c338f957fa40858824e60b5a8555c7.jpeg', 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x132/thn_3563a2afeb774934a6906508b277a4fa.jpeg']
  },
  {
    id: 'movie-20264608',
    movieCode: '20264608',
    bookingRank: 2,
    bookingRate: 10.7,
    title: '헥스: 마녀왕국',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-25',
    runtime: 109,
    genre: '애니메이션',
    ageRating: '전체 관람가',
    director: '폰 비라선손, 제이슨 핸드, 조시 트리니다드',
    cast: '헤일리 스테인펠드, 라시다 존스',
    summary: '“내가 마녀라고…?” 엄마에게도, 학교에서도 남들과 조금 다른 특별한(?)',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264608',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x192/thn_2b88d7735175479797c9da6d42a8a7f1.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_c49afc6824364c558404a0545bf543a3.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_1f2ab82c46f24579a6eb2ff07d5509f8.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_aaafd740c6d84d59b3a76aebd1320dc3.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_f641ec8e3f094a3f9071508508a260ae.jpg']
  },
  {
    id: 'movie-20247221',
    movieCode: '20247221',
    bookingRank: 3,
    bookingRate: 10.1,
    title: '폭설',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-18',
    runtime: 88,
    genre: '미스터리, 드라마',
    ageRating: '15세 이상 관람가',
    director: '박선우, 홍의정',
    cast: '김윤석(갑수), 구교환(현택), 박수영(최경위)',
    summary: '“눈 설(雪) 까마귀 오(烏). 여기가 어떤 곳인지도 모르고 왔어?” 퇴직을 하루 앞둔 역장 갑수는 마지막 열차를 통과시키고 평생을 지켜오던 설오역을 떠날 준비를 한다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20247221',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x192/thn_8ed53ead23da41928fa4776418c1e2c9.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_913e20aedf5948e091927a379c7785f0.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_1fee6fb36446431b8a3f946b98409c6d.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_41e5e1abb28248c7811e811afbac9ea2.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_2ce55f289fe14be6b9bf7241de363896.jpg']
  },
  {
    id: 'movie-20244970',
    movieCode: '20244970',
    bookingRank: 4,
    bookingRate: 6.2,
    title: '슬픈 열대',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-25',
    runtime: 107,
    genre: '액션',
    ageRating: '청소년 관람불가',
    director: '박훈정',
    cast: '이신영(루), 박유림(죠죠), 김명민(사부)',
    summary: '사부의 죽음 이후 슬픈 열대가 피로 물들기 시작했다! 버려진 아이들을 킬러로 키워낸 조직 ‘슬픈 열대’의 절대자 ‘사부’가 살해당했다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20244970',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x192/thn_4a9aa61846ed404396dc37a687ab6e22.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_8ed32dce71454fc2a9187235153c2699.jpeg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_8a5bd8385b9d4a649c7693f161208d44.jpeg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_2d2e1281fa454bc387640f0bf9cef6c6.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_49bf97f7971040df828b081df7641804.jpg']
  },
  {
    id: 'movie-20268264',
    movieCode: '20268264',
    bookingRank: 5,
    bookingRate: 4.8,
    title: '임영웅ㅣ아임 히어로 더 스타디움 2',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-18',
    runtime: 144,
    genre: '공연',
    ageRating: '전체 관람가',
    director: '송두선, 오윤동',
    cast: '임영웅',
    summary: '임영웅과 영웅시대가 함께 걸어온 10년을 기념하는 특별한 축제! 콘서트 누적 관객 100만 명 돌파라는 기념비적인 기록과 스타디움의 뜨거운 열기를 대형 스크린과 풍성한 사운드로 생생하게 담아낸 공연 실황 영화.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20268264',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x192/thn_ea18d0d1de8840719bdb8e2a2184ccf6.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_2bed968b08774a24b546a7222fd40462.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_254a333d758a4ddbbedcf6f5b5506417.JPG', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_99a3959bdf2f497d913b3c0e47e087cd.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_089d4cc963c343f2a3ae034f647c2fa9.jpg']
  },
  {
    id: 'movie-20261807',
    movieCode: '20261807',
    bookingRank: 6,
    bookingRate: 4.6,
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
    id: 'movie-20263866',
    movieCode: '20263866',
    bookingRank: 7,
    bookingRate: 3.7,
    title: '인간 초거대 알고리즘: 더 무비',
    releaseStatus: '상영 중',
    releaseDate: '2026-11-25',
    runtime: 129,
    genre: '드라마, 판타지',
    ageRating: '12세 이상 관람가',
    director: '유영의',
    cast: '백서빈(봉황사장), 정성욱(삼촌), 설우인(소유권이전등기소송 판사)',
    summary: '‘소송 진행하겠습니다’ ‘그런데 증거가 없잖아요?’ 도아(박서령)는 시할아버지가 자신의 남편 앞으로 남겨준 봉황버섯가게의 땅을 시이복삼촌이 몽땅 빼앗아 가버려 소송을 시작한다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20263866',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x192/thn_7c20d1abe58d4f59bb21c549a798280b.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/05/thumb_x132/thn_f64950e997574dca8eaa7ff0064242eb.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/05/thumb_x132/thn_821c2784c3444119a0d1373eecff3c50.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/05/thumb_x132/thn_e54b528f883f4ead9a15879c01c8ef46.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/07/thumb_x132/thn_194211bc88a249ed84b59b8c54ac2f9a.jpg']
  },
  {
    id: 'movie-20267121',
    movieCode: '20267121',
    bookingRank: 8,
    bookingRate: 2.8,
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
    id: 'movie-20268441',
    movieCode: '20268441',
    bookingRank: 9,
    bookingRate: 1.7,
    title: '극장판 짱구는 못말려: 기기괴괴! 나의 요괴 바캉스',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-12-03',
    runtime: 100,
    genre: '애니메이션',
    ageRating: '전체 관람가',
    director: '와타나베 마사키',
    cast: '박영남(짱구), 소연(엄마), 김환진(아빠)',
    summary: '전국 각지에서 기묘한 현상이 목격되며 세상이 떠들썩한 가운데, 방학을 맞은 짱구 가족은 아빠의 고향, 친할아버지 집으로 휴가를 떠난다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20268441',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x192/thn_f85d6420ff89438b915e35822ca42748.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x132/thn_ae0c1ec96ef0471db12471027a1617bb.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x132/thn_e332c53b2c4c46cf9a5e7900959a9cd8.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x132/thn_b9750bec02394e4fafdb67b03be7762c.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x132/thn_a245115283954f299f0c9071983f9f5c.jpg']
  },
  {
    id: 'movie-20268154',
    movieCode: '20268154',
    bookingRank: 10,
    bookingRate: 1.7,
    title: '러브 와이파이 궁',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-12-02',
    runtime: 109,
    genre: '멜로/로맨스, 코미디, 판타지',
    ageRating: '12세 이상 관람가',
    director: '사석춘',
    cast: '영훈, 이루다, 김동준',
    summary: '모태솔로 웹툰 작가 \'태풍\' 어느 날 신비한 나전농을 통해 200년 전 조선시대 궁녀 \'소향\'과 스마트폰으로 연결되는 기적 같은 일이 벌어진다!',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20268154',
    posterUrl: 'https://www.kobis.or.kr/common/mast/movie/2026/11/thumb_x192/thn_1f4a59ecef6343d39c2b81058429bd42.jpg',
    stills: ['https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_85eb05375ad749c0a0c5e38b8d1454dc.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_5ede3febd4e64a1f97b6f2a575a48a83.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_387b3561484944089c80329cc635cc9e.jpg', 'https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x132/thn_4bf68f135bd943718de59149892265e4.jpg']
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.11.28 05:00'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
