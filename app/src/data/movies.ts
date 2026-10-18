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
    bookingRate: 28.6,
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
    id: 'movie-20250053',
    movieCode: '20250053',
    bookingRank: 2,
    bookingRate: 11.1,
    title: '실낙원',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-10-21',
    runtime: 100,
    genre: '스릴러, 드라마',
    ageRating: '15세 이상 관람가',
    director: '연상호',
    summary: '9년 전 잃은 아들이 돌아왔다 그러나 내가 알던 그 아이가 아니다 9년 전 캠핑스쿨 버스 실종 사건으로 아들을 잃은 류소영은 \'낙원의 아이들\'이라는 AI 프로그램을 통해 어린 시절의 아들과 만나며 하루하루를 버텨낸다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20250053'
  },
  {
    id: 'movie-20267571',
    movieCode: '20267571',
    bookingRank: 3,
    bookingRate: 10.8,
    title: '클레이페이스',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-10-21',
    runtime: 108,
    genre: '공포(호러), 스릴러',
    ageRating: '청소년 관람불가',
    director: '제임스 왓킨스',
    summary: '얼굴을 잃고 괴물이 된 남자 공포의 민낯을 마주하라!',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20267571'
  },
  {
    id: 'movie-20259894',
    movieCode: '20259894',
    bookingRank: 4,
    bookingRate: 7.3,
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
    id: 'movie-20250654',
    movieCode: '20250654',
    bookingRank: 5,
    bookingRate: 5.6,
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
    bookingRank: 6,
    bookingRate: 3.4,
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
    id: 'movie-20266764',
    movieCode: '20266764',
    bookingRank: 7,
    bookingRate: 3,
    title: '그대, 별처럼',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-10-28',
    runtime: 134,
    genre: '멜로/로맨스',
    ageRating: '15세 이상 관람가',
    director: '후지이 미치히토',
    summary: '아름다운 바다와 하늘이 펼쳐진 세토 내해의 어느 섬. 섬으로 전학 온 카이(요코하마 류세이)와, 이 섬에서 자란 아키미(히로세 스즈).',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20266764'
  },
  {
    id: 'movie-20266189',
    movieCode: '20266189',
    bookingRank: 8,
    bookingRate: 2.9,
    title: '여전히 찬란하게',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-10-21',
    runtime: 117,
    genre: '드라마',
    ageRating: '12세 이상 관람가',
    director: '송일곤',
    summary: '“내일 너랑 서울 갈 생각하니까 심장이 막 콩닥거린다” 오랫동안 찾아 헤매던 단짝 ‘정임’과 마침내 다시 만난 ‘순옥’은 어릴 적 시골 마을에서부터 함께 염원하던 노래자랑 참가를 위해 서울행을 결심한다.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20266189'
  },
  {
    id: 'movie-20246036',
    movieCode: '20246036',
    bookingRank: 9,
    bookingRate: 2.8,
    title: '킬링타임',
    releaseStatus: '개봉 예정',
    releaseDate: '2026-10-21',
    runtime: 83,
    genre: '공포(호러), 스릴러',
    ageRating: '15세 이상 관람가',
    director: '장준엽',
    summary: '죽어야 끝나는 ‘킬링’ 라이브, 입장하시겠습니까? 인터넷 방송 중 발생한 사망 사고로 나락에 떨어진 몰카 크루 ‘킬링타임’.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20246036'
  },
  {
    id: 'movie-20256161',
    movieCode: '20256161',
    bookingRank: 10,
    bookingRate: 2.3,
    title: '타짜: 벨제붑의 노래',
    releaseStatus: '상영 중',
    releaseDate: '2026-09-23',
    runtime: 129,
    genre: '범죄, 드라마',
    ageRating: '청소년 관람불가',
    director: '최국희',
    summary: '중세 유럽, 종교인들은 카드가 악마의 도구라고 생각했다. 특히 죽음을 뜻하는 스페이드 13장엔 모두 악마의 이름이 들어 있다. 지옥으로 떨어진 추락한 천사 \'루시퍼\'와 지옥의 기존 지배자 \'벨제붑\'.',
    infoUrl: 'https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20256161'
  }
]

/** 순위 기준 시각. 화면에 그대로 보여 준다 — 언제 것인지 모르면 못 믿는다. */
export const MOVIE_RANKING_UPDATED_AT = '2026.10.19 01:00'
export const MOVIE_RANKING_SOURCE_URL = 'https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0'
export const MOVIE_BOOKING_URL = 'https://cgv.co.kr/cnm/cgvChart/movieChart'
