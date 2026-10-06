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
    bookingRate: 27.9,
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
    id: 'movie-20255033',
    movieCode: '20255033',
    bookingRank: 2,
    bookingRate: 15.2,
    title: '암살자(들)',
    releaseStatus: '상영 중',
    releaseDate: '2026-09-23',
    runtime: 130,
    genre: '범죄, 드라마',
    ageRating: '12세 이상 관람가',
    director: '허진호',
    summary: '1974년 8월 15일, 대한민국을 충격에 빠뜨린 영부인 저격사건의 의혹과 배후를 추적하는 이야기',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20255033'
  },
  {
    id: 'movie-20250654',
    movieCode: '20250654',
    bookingRank: 3,
    bookingRate: 13.2,
    title: '오디세이',
    releaseStatus: '상영 중',
    releaseDate: '2026-08-05',
    runtime: 172,
    genre: '액션, 드라마, 어드벤처',
    ageRating: '15세 이상 관람가',
    director: '크리스토퍼 놀란',
    summary: '이 시대 영화계 최고의 거장 크리스토퍼 놀란 감독의 새로운 신화 인류 최고의 고전 [오디세이아]가 스크린에 펼쳐진다!',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20250654'
  },
  {
    id: 'movie-20256161',
    movieCode: '20256161',
    bookingRank: 4,
    bookingRate: 10.6,
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
    id: 'movie-20265062',
    movieCode: '20265062',
    bookingRank: 5,
    bookingRate: 7.5,
    title: '룩백',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-10-08',
    runtime: 100,
    genre: '드라마',
    ageRating: '전체 관람가',
    director: '고레에다 히로카즈',
    summary: '학교 신문에서 네컷 만화를 그리는 자신만만한 소녀 ‘후지노’와 그를 동경하지만 세상 밖이 두려워 방 안에 틀어박힌 외톨이 ‘쿄모토’.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20265062'
  },
  {
    id: 'movie-20224573',
    movieCode: '20224573',
    bookingRank: 6,
    bookingRate: 3.8,
    title: '부활남: 더 레드',
    releaseStatus: '상영 중',
    releaseDate: '2026-09-30',
    runtime: 101,
    genre: '액션',
    ageRating: '15세 이상 관람가',
    director: '백',
    summary: '절친 ‘영하’(강기영)의 현실적인 쓴소리와 동생 ‘예린’(김시아)의 든든한 지원에도 면접에서 떨어지기 일쑤인 취업 준비생 ‘석환’(구교환).',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20224573'
  },
  {
    id: 'movie-20266610',
    movieCode: '20266610',
    bookingRank: 7,
    bookingRate: 3.5,
    title: '입에 대한 앙케트',
    releaseStatus: '상영 중',
    releaseDate: '2026-10-07',
    runtime: 88,
    genre: '공포(호러)',
    ageRating: '15세 이상 관람가',
    director: '시미즈 다카시',
    summary: '“그날 밤, 무슨 일이 있었는지 말씀드릴게요” 심령 명소로 유명한 묘지. 그곳에 저주받은 나무가 있다는 괴담에 이끌려 ‘쇼타’ 일행은 담력 시험에 나선다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20266610'
  },
  {
    id: 'movie-20265486',
    movieCode: '20265486',
    bookingRank: 8,
    bookingRate: 2.7,
    title: '퓨리어스',
    releaseStatus: '상영 중',
    releaseDate: '2026-10-07',
    runtime: 113,
    genre: '액션, 범죄',
    ageRating: '청소년 관람불가',
    director: '타니가키 켄지',
    summary: '말을 할 수 없는 평범한 아버지 왕웨이(사묘). 어느 날 그의 딸 레이니가 거대 범죄 조직에 납치되고, 부패한 경찰마저 외면하자 직접 딸을 찾아 나선다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20265486'
  },
  {
    id: 'movie-20266263',
    movieCode: '20266263',
    bookingRank: 9,
    bookingRate: 2.5,
    title: '전자오락수호대',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-10-14',
    runtime: 110,
    genre: '애니메이션',
    ageRating: '12세 이상 관람가',
    director: '엄영식',
    summary: '플레이어가 게임을 즐길 수 있도록 무대 뒤에서 세팅하는 비밀 조직 ‘전자오락수호대’. 게임 속 모든 것을 만드는 그들의 최우선 수칙은 보안 유지다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20266263'
  },
  {
    id: 'movie-20264775',
    movieCode: '20264775',
    bookingRank: 10,
    bookingRate: 1.5,
    title: '디거',
    releaseStatus: '상영 중',
    releaseDate: '2026-10-03',
    runtime: 128,
    genre: '코미디, 드라마',
    ageRating: '15세 이상 관람가',
    director: '알레한드로 곤잘레스 이냐리투',
    summary: '톰 크루즈 & 알레한드로 G. 이냐리투 감독의 역대급 만남! 끝까지 파거나, 죽거나! 전 세계를 뒤흔든 대재앙 ‘디거 록웰’의 삽 끝에서 시작된 이야기를 확인하라!',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264775'
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.10.07 05:10'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
