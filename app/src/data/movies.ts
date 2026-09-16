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
    id: 'movie-20250654',
    movieCode: '20250654',
    bookingRank: 1,
    bookingRate: 22.9,
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
    id: 'movie-20255033',
    movieCode: '20255033',
    bookingRank: 2,
    bookingRate: 17.9,
    title: '암살자(들)',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-09-23',
    runtime: 130,
    genre: '범죄, 드라마',
    ageRating: '12세 이상 관람가',
    director: '허진호',
    summary: '1974년 8월 15일, 대한민국을 충격에 빠뜨린 영부인 저격사건의 의혹과 배후를 추적하는 이야기',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20255033'
  },
  {
    id: 'movie-20256308',
    movieCode: '20256308',
    bookingRank: 3,
    bookingRate: 12.8,
    title: '인턴',
    releaseStatus: '상영 중',
    releaseDate: '2026-09-16',
    runtime: 132,
    genre: '드라마',
    ageRating: '12세 이상 관람가',
    director: '김도영',
    summary: '올가을, 다시 출근합니다 창업 3년 만에 100억대 매출을 달성하며 브랜드 ‘WOO22’(우투투)를 패션 업계의 다크호스로 성장시킨 젊은 CEO ‘선우’(한소희).',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20256308'
  },
  {
    id: 'movie-20256161',
    movieCode: '20256161',
    bookingRank: 4,
    bookingRate: 10,
    title: '타짜: 벨제붑의 노래',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-09-23',
    runtime: 129,
    genre: '범죄, 드라마',
    ageRating: '청소년 관람불가',
    director: '최국희',
    summary: '중세 유럽, 종교인들은 카드가 악마의 도구라고 생각했다. 특히 죽음을 뜻하는 스페이드 13장엔 모두 악마의 이름이 들어 있다. 지옥으로 떨어진 추락한 천사 \'루시퍼\'와 지옥의 기존 지배자 \'벨제붑\'.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20256161'
  },
  {
    id: 'movie-20263870',
    movieCode: '20263870',
    bookingRank: 5,
    bookingRate: 4.3,
    title: '레지던트 이블: 0번째 밤',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-09-17',
    runtime: 93,
    genre: '공포(호러), 액션, SF',
    ageRating: '청소년 관람불가',
    director: '잭 크레거',
    summary: '의료 택배 기사 브라이언(오스틴 에이브람스)은 긴급 배달을 맡아 심야에 라쿤 시티 종합 병원으로 향한다. 눈발을 헤치며 가던 중 갑자기 차로 뛰어든 누군가를 치게 되고, 죽은 줄 알았던 이가 다시 그를 덮쳐온다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20263870'
  },
  {
    id: 'movie-20261807',
    movieCode: '20261807',
    bookingRank: 6,
    bookingRate: 4.3,
    title: '극장판 치이카와: 인어 섬의 비밀',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-09-30',
    runtime: 98,
    genre: '애니메이션',
    ageRating: '전체 관람가',
    director: '오이카와 케이',
    summary: '어느 날, 광장에서 쉬고 있던 치이카와와 가르마 앞에 얼굴에 전단지를 붙인 토끼가 나타난다. 그곳엔 “특별한 섬으로의 초대”라는 글귀가 적혀 있는데...',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20261807'
  },
  {
    id: 'movie-20265146',
    movieCode: '20265146',
    bookingRank: 7,
    bookingRate: 3.6,
    title: '옵세션',
    releaseStatus: '상영 중',
    releaseDate: '2026-09-02',
    runtime: 108,
    genre: '공포(호러)',
    ageRating: '청소년 관람불가',
    director: '커리 바커',
    summary: '“너무 너무 너무 너무 사랑해 사랑해 사랑해 사랑해” ‘니키’를 짝사랑하던 ‘베어’는 골동품 상점에서 구입한 ‘원 위시 윌로우’에 ‘니키’가 자신을 가장 사랑하게 해달라고 소원을 빈다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20265146'
  },
  {
    id: 'movie-20224573',
    movieCode: '20224573',
    bookingRank: 8,
    bookingRate: 3.5,
    title: '부활남: 더 레드',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-09-30',
    runtime: 101,
    genre: '액션',
    ageRating: '15세 이상 관람가',
    director: '백',
    summary: '절친 ‘영하’(강기영)의 현실적인 쓴소리와 동생 ‘예린’(김시아)의 든든한 지원에도 면접에서 떨어지기 일쑤인 취업 준비생 ‘석환’(구교환).',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20224573'
  },
  {
    id: 'movie-20254904',
    movieCode: '20254904',
    bookingRank: 9,
    bookingRate: 3.1,
    title: '가능한 사랑',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-09-23',
    runtime: 164,
    genre: '드라마',
    ageRating: '청소년 관람불가',
    director: '이창동',
    summary: '해고노동자와 그의 아내 그리고 다큐멘터리 감독과 그녀의 남편, 두 부부가 다큐멘터리 제작을 위해 만나 서로 다른 삶과 숨은 욕망을 마주하는 이야기',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20254904'
  },
  {
    id: 'movie-20266793',
    movieCode: '20266793',
    bookingRank: 10,
    bookingRate: 1.8,
    title: '엔하이픈 브이알콘서트 : 데스티니',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-09-18',
    runtime: 52,
    genre: '공연',
    ageRating: '전체 관람가',
    director: '김지애',
    summary: '개기월식이 시작된 밤. 운명으로 묶인 두 존재가 세상의 추격을 피해 도망친다. 전생부터 이어진 저주 같은 사랑은 점점 더 깊어지고, 그들은 결국 피할 수 없는 운명과 마주한다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20266793'
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.09.16 20:13'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
