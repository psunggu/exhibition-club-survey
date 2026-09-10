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
    bookingRate: 41.2,
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
    bookingRate: 8.8,
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
    bookingRate: 8.4,
    title: '인턴',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-09-16',
    runtime: 132,
    genre: '드라마',
    ageRating: '12세 이상 관람가',
    director: '김도영',
    summary: '올가을, 다시 출근합니다 창업 3년 만에 100억대 매출을 달성하며 브랜드 ‘WOO22’(우투투)를 패션 업계의 다크호스로 성장시킨 젊은 CEO ‘선우’(한소희).',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20256308'
  },
  {
    id: 'movie-20265146',
    movieCode: '20265146',
    bookingRank: 4,
    bookingRate: 6,
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
    id: 'movie-20262770',
    movieCode: '20262770',
    bookingRank: 5,
    bookingRate: 5,
    title: '스파이더맨: 브랜드 뉴 데이',
    releaseStatus: '상영 중',
    releaseDate: '2026-07-29',
    runtime: 144,
    genre: '액션, 어드벤처, 판타지',
    ageRating: '12세 이상 관람가',
    director: '데스틴 다니엘 크리튼',
    summary: '세상 모두에게 잊힌 피터 파커 그의 정체를 기억하는 역대급 빌런의 등장 시리즈 사상 가장 통제할 수 없는 대결이 시작된다! 4년 전 소중한 사람들을 지키기 위해 모두의 기억에서 사라진 \'피터 파커\'.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20262770'
  },
  {
    id: 'movie-20256161',
    movieCode: '20256161',
    bookingRank: 6,
    bookingRate: 4.7,
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
    id: 'movie-20224573',
    movieCode: '20224573',
    bookingRank: 7,
    bookingRate: 2.2,
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
    id: 'movie-20233219',
    movieCode: '20233219',
    bookingRank: 8,
    bookingRate: 2.1,
    title: '호프',
    releaseStatus: '상영 중',
    releaseDate: '2026-07-15',
    runtime: 156,
    genre: 'SF, 스릴러, 액션',
    ageRating: '15세 이상 관람가',
    director: '나홍진',
    summary: '지원해 줄 인력들은 산불을 끄러 갔고, 이젠 통신도 두절됐다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20233219'
  },
  {
    id: 'movie-20265423',
    movieCode: '20265423',
    bookingRank: 9,
    bookingRate: 2.1,
    title: '더 드라마',
    releaseStatus: '상영 중',
    releaseDate: '2026-09-09',
    runtime: 106,
    genre: '드라마, 멜로/로맨스',
    ageRating: '15세 이상 관람가',
    director: '크리스토퍼 보글리',
    summary: '“왜 나쁜 짓 한 번 안 한 사람처럼 그래?” 결혼식을 일주일 앞둔 행복한 커플 엠마(젠데이아)와 찰리(로버트 패틴슨). 우연히 알게 된 상대방의 비밀로 인해 단단했던 믿음이 흔들린다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20265423'
  },
  {
    id: 'movie-20266793',
    movieCode: '20266793',
    bookingRank: 10,
    bookingRate: 1.3,
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
export const MOVIE_RANKING_UPDATED_AT = '2026.09.11 01:50'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
