/**
 * 공연 주간 예매 순위. **scripts/shows-from-kopis.mjs 가 쓴다 — 손으로 고치지 않는다.**
 * 출처: (재)예술경영지원센터 공연예술통합전산망(KOPIS, kopis.or.kr) 예매상황판 · 주간 · 총티켓예매액 순.
 *
 * **이건 events 가 아니다.** 영화 순위(movies.ts)와 같은 자리다 — 바깥 집계를 그대로 비춘다.
 * 거르지 않는다. 순위대로 싣고 볼지 말지는 회원이 판단한다(AGENTS.md 「보드」).
 * 포스터는 KOPIS 의 그림 주소를 그대로 부른다(복사해 두지 않는다).
 */

export type ShowGenre = '뮤지컬' | '콘서트' | '클래식' | '무용' | '연극'
export type ShowArea = '서울' | '경기' | '인천'

export type Show = {
  /** KOPIS 공연 id (PF…) */
  id: string
  rank: number
  title: string
  /** ISO 날짜 */
  start: string
  end: string
  venue: string
  /** KOPIS 포스터 파일 이름 — 주소는 showPosterUrl 이 짓는다 */
  poster: string
}

export const SHOWS: Record<ShowArea, Record<ShowGenre, Show[]>> = {
  서울: {
    뮤지컬: [
      { id: 'PF302842', rank: 1, title: '오페라의 유령 40주년 스페셜 시즌', start: '2026-12-22', end: '2027-02-28', venue: '블루스퀘어', poster: 'PF_PF302842_261008_143949.jpg' },
      { id: 'PF302015', rank: 2, title: '시카고 [서울]', start: '2026-12-05', end: '2027-03-14', venue: 'LG아트센터 서울', poster: 'PF_PF302015_260929_151431.gif' },
      { id: 'PF292160', rank: 3, title: '겨울왕국 [서울]', start: '2026-08-13', end: '2027-03-01', venue: '샤롯데씨어터', poster: 'PF_PF292160_260601_111455.gif' },
      { id: 'PF302516', rank: 4, title: '레베카 [서울]', start: '2026-11-24', end: '2027-03-14', venue: '충무아트센터', poster: 'PF_PF302516_261006_134804.jpg' },
      { id: 'PF306119', rank: 5, title: '해밀턴 내한공연 (Musical HAMILTON) [서울]', start: '2027-01-21', end: '2027-03-20', venue: '세종문화회관', poster: 'PF_PF306119_261111_144716.png' },
      { id: 'PF302677', rank: 6, title: '미세스 다웃파이어 [서울]', start: '2026-12-03', end: '2027-02-21', venue: 'GS아트센터', poster: 'PF_PF302677_261007_113759.jpg' },
      { id: 'PF301746', rank: 7, title: '마하고니 [대학로]', start: '2026-11-03', end: '2027-01-24', venue: '링크아트센터', poster: 'PF_PF301746_260928_114407.jpg' },
      { id: 'PF282162', rank: 8, title: '서울시뮤지컬단, 크리스마스 캐럴', start: '2026-12-02', end: '2026-12-27', venue: '세종문화회관', poster: 'PF_PF282162_251224_140222.png' },
      { id: 'PF303043', rank: 9, title: '스위니토드 (SWEENEY TODD)', start: '2026-12-04', end: '2027-05-02', venue: '디큐브링크아트센터', poster: 'PF_PF303043_261012_171201.gif' },
      { id: 'PF294946', rank: 10, title: '엘리자벳', start: '2026-08-16', end: '2026-11-15', venue: '블루스퀘어', poster: 'PF_PF294946_260701_134627.gif' },
    ],
    콘서트: [
      { id: 'PF305815', rank: 1, title: '성시경 연말 콘서트: 성시경', start: '2026-12-31', end: '2027-01-03', venue: '올림픽공원', poster: 'PF_PF305815_261109_145843.gif' },
      { id: 'PF306096', rank: 2, title: '터치드 (TOUCHED) 단독 콘서트: HIGHLIGHT Ⅴ', start: '2027-01-23', end: '2027-01-24', venue: '고려대학교 화정체육관', poster: 'PF_PF306096_261111_135653.gif' },
      { id: 'PF305189', rank: 3, title: 'NCT WISH 2nd CONCERT TOUR INTO THE WISH: Face Our WISH [서울]', start: '2027-01-15', end: '2027-01-16', venue: '고척스카이돔', poster: 'PF_PF305189_261103_100858.jpg' },
      { id: 'PF306428', rank: 4, title: 'HYUKOH 33 TOUR [서울]', start: '2027-01-16', end: '2027-01-17', venue: '올림픽공원', poster: 'PF_PF306428_261113_165359.jpg' },
      { id: 'PF306047', rank: 5, title: '캣츠아이 첫 단독 내한공연 [서울]', start: '2027-02-04', end: '2027-02-04', venue: '올림픽공원', poster: 'PF_PF306047_261111_111415.gif' },
      { id: 'PF305548', rank: 6, title: 'N.Flying LIVE: Once Upon a Snowball', start: '2026-12-24', end: '2026-12-26', venue: '고려대학교 화정체육관', poster: 'PF_PF305548_261105_131101.jpg' },
      { id: 'PF306240', rank: 7, title: 'Awesome Stage Special Concert: KIMSUNGKYU', start: '2026-12-12', end: '2026-12-12', venue: 'KBS스포츠월드(아레나)', poster: 'PF_PF306240_261112_133130.jpg' },
      { id: 'PF305899', rank: 8, title: 'B1A4 FAN CONCERT: 잘가요, 굿바이', start: '2026-12-13', end: '2026-12-13', venue: '연세대학교 대강당', poster: 'PF_PF305899_261109_174031.jpg' },
      { id: 'PF302337', rank: 9, title: 'TOMORROW X TOGETHER WORLD TOUR: STEAL THE WIND [서울]', start: '2026-11-13', end: '2026-11-15', venue: '올림픽공원', poster: 'PF_PF302337_261002_130537.gif' },
      { id: 'PF306417', rank: 10, title: 'FLARE U FANCON TOUR: Where U\'RE [서울]', start: '2026-12-26', end: '2026-12-27', venue: '장충체육관', poster: 'PF_PF306417_261113_161502.jpg' },
    ],
    클래식: [
      { id: 'PF305658', rank: 1, title: '제42회 쏠리스트앙상블 송년음악회', start: '2026-12-03', end: '2026-12-03', venue: '세종문화회관', poster: 'PF_PF305658_261106_115306.png' },
      { id: 'PF305666', rank: 2, title: '라라라 송년음악회', start: '2026-12-28', end: '2026-12-28', venue: '롯데콘서트홀', poster: 'PF_PF305666_261106_130053.jpg' },
      { id: 'PF305969', rank: 3, title: '귀를 기울이면 필름 콘서트', start: '2026-12-30', end: '2026-12-31', venue: '롯데콘서트홀', poster: 'PF_PF305969_261110_135041.gif' },
      { id: 'PF291863', rank: 4, title: '사이먼 래틀 경 & 바이에른 방송교향악단 (11.13)', start: '2026-11-13', end: '2026-11-13', venue: '예술의전당 [서울]', poster: 'PF_PF291863_260520_135739.gif' },
      { id: 'PF305995', rank: 5, title: '필그림스 뮤직 크리스마스 콘서트', start: '2026-12-09', end: '2026-12-09', venue: '영산아트홀', poster: 'PF_PF305995_261110_144454.gif' },
      { id: 'PF305446', rank: 6, title: '이 무지치 신년음악회', start: '2027-01-12', end: '2027-01-12', venue: '예술의전당 [서울]', poster: 'PF_PF305446_261104_134016.gif' },
      { id: 'PF304110', rank: 7, title: '현대자동차그룹과 함께하는 백건우와 영 프렌즈 [서울]', start: '2026-12-02', end: '2026-12-02', venue: '예술의전당 [서울]', poster: 'PF_PF304110_261022_104031.gif' },
      { id: 'PF304315', rank: 8, title: '디즈니 인 콘서트: Beyond the Magic [서울]', start: '2026-12-25', end: '2026-12-25', venue: '예술의전당 [서울]', poster: 'PF_PF304315_261023_141405.gif' },
      { id: 'PF303355', rank: 9, title: '크리스마스 콘서트: 유키 구라모토와 친구들', start: '2026-12-25', end: '2026-12-25', venue: '롯데콘서트홀', poster: 'PF_PF303355_261014_163311.jpg' },
      { id: 'PF305559', rank: 10, title: '양인모의 베토벤 바이올린 소나타 전곡 Ⅲ', start: '2027-01-24', end: '2027-01-24', venue: '예술의전당 [서울]', poster: 'PF_PF305559_261105_133749.gif' },
    ],
    무용: [
      { id: 'PF303402', rank: 1, title: '유니버설발레단, 호두까기인형 [서울 종로]', start: '2026-12-17', end: '2026-12-30', venue: '세종문화회관', poster: 'PF_PF303402_261016_101506.gif' },
      { id: 'PF303266', rank: 2, title: '국립발레단, 카멜리아 레이디', start: '2026-11-10', end: '2026-11-15', venue: '예술의전당 [서울]', poster: 'PF_PF303266_261103_165440.gif' },
      { id: 'PF305440', rank: 3, title: '제6회 SAL 기획공연: DELTA', start: '2026-12-05', end: '2026-12-06', venue: '국립극장', poster: 'PF_PF305440_261104_132956.jpg' },
      { id: 'PF303096', rank: 4, title: '호두까기 인형 [서울 광진]', start: '2026-12-11', end: '2026-12-13', venue: '나루아트센터', poster: 'PF_PF303096_261012_185739.gif' },
      { id: 'PF282166', rank: 5, title: '서울시발레단, 트리플 빌: 올 포 한스 판 마넨', start: '2026-11-19', end: '2026-11-22', venue: '세종문화회관', poster: 'PF_PF282166_251224_141535.png' },
    ],
    연극: [
      { id: 'PF305728', rank: 1, title: '두 번째 아이', start: '2026-12-08', end: '2027-03-28', venue: 'LG아트센터 서울', poster: 'PF_PF305728_261109_114350.gif' },
      { id: 'PF298289', rank: 2, title: '스타크로스드 [대학로]', start: '2026-09-22', end: '2026-12-13', venue: '예스24아트원(구.대학로아트원씨어터)', poster: 'PF_PF298289_260812_103259.jpg' },
      { id: 'PF303036', rank: 3, title: '러브레터 [서울 강남]', start: '2026-11-05', end: '2026-12-27', venue: 'KT&G 상상마당 대치아트홀', poster: 'PF_PF303036_261012_165250.gif' },
      { id: 'PF297978', rank: 4, title: '꽃의 비밀 [대학로]', start: '2026-09-12', end: '2026-11-29', venue: '링크아트센터', poster: 'PF_PF297978_260807_141003.gif' },
      { id: 'PF295977', rank: 5, title: '국립극장, 마당놀이: 춘풍처도 온다', start: '2026-11-27', end: '2027-01-24', venue: '국립극장', poster: 'PF_PF295977_261104_130521.gif' },
      { id: 'PF306341', rank: 6, title: '멘치카', start: '2026-12-22', end: '2027-01-17', venue: '더 서울라이티움 (갤러리아포레)', poster: 'PF_PF306341_261113_112624.gif' },
      { id: 'PF298502', rank: 7, title: '유리동물원 [서울 서초]', start: '2026-10-17', end: '2026-11-22', venue: '예술의전당 [서울]', poster: 'PF_PF298502_260814_102324.gif' },
      { id: 'PF305968', rank: 8, title: '슛 더 크로우 (Shoot the Crow)', start: '2026-12-08', end: '2027-03-07', venue: '링크아트센터', poster: 'PF_PF305968_261110_134826.jpg' },
      { id: 'PF298745', rank: 9, title: '클로저 [대학로]', start: '2026-09-15', end: '2026-12-06', venue: '예스24 스테이지(구. DCF대명문화공장)', poster: 'PF_PF298745_260818_154141.gif' },
      { id: 'PF296942', rank: 10, title: '연극열전10, 네이처 오브 포겟팅', start: '2026-09-18', end: '2026-11-29', venue: '세종문화회관', poster: 'PF_PF296942_260727_103259.gif' },
    ],
  },
  경기: {
    뮤지컬: [
      { id: 'PF301001', rank: 1, title: '광화문 연가 [수원]', start: '2027-01-02', end: '2027-01-03', venue: '경기아트센터(구. 경기도문화의전당)', poster: 'PF_PF301001_260915_143727.gif' },
      { id: 'PF305737', rank: 2, title: '송년음악회 Ⅱ, 가장 완벽한 엔딩 [하남]', start: '2026-12-26', end: '2026-12-26', venue: '하남문화예술회관', poster: 'PF_PF305737_261109_123809.gif' },
      { id: 'PF305920', rank: 3, title: '빨래 [평택 남부]', start: '2026-12-19', end: '2026-12-19', venue: '평택시남부문예회관', poster: 'PF_PF305920_261110_103251.jpg' },
      { id: 'PF299684', rank: 4, title: '빨래 [수원]', start: '2026-12-25', end: '2026-12-27', venue: '경기아트센터(구. 경기도문화의전당)', poster: 'PF_PF299684_260831_111230.gif' },
      { id: 'PF306432', rank: 5, title: '뮤지컬 갈라 라라라: Live & Love & Life [안양]', start: '2026-11-27', end: '2026-11-27', venue: '평촌아트홀', poster: 'PF_PF306432_261113_170742.gif' },
      { id: 'PF294046', rank: 6, title: '빨래 [하남]', start: '2026-11-13', end: '2026-11-15', venue: '하남문화예술회관', poster: 'PF_PF294046_260618_151101.gif' },
      { id: 'PF303612', rank: 7, title: '오지게 재밌는 가시나들 [안산]', start: '2026-12-04', end: '2026-12-05', venue: '안산문화예술의전당', poster: 'PF_PF303612_261016_141757.jpg' },
      { id: 'PF305395', rank: 8, title: '바둑이와 세리 [용인]', start: '2026-12-19', end: '2026-12-19', venue: '용인문화예술원', poster: 'PF_PF305395_261104_105402.gif' },
      { id: 'PF306042', rank: 9, title: '애기봉 [김포]', start: '2026-12-11', end: '2026-12-12', venue: '김포아트홀', poster: 'PF_PF306042_261111_110434.gif' },
      { id: 'PF303193', rank: 10, title: '오지게 재밌는 가시나들 [과천]', start: '2026-12-11', end: '2026-12-12', venue: '과천시민회관', poster: 'PF_PF303193_261013_141054.gif' },
    ],
    콘서트: [
      { id: 'PF306284', rank: 1, title: 'WAVE of ECLIPSE [고양]', start: '2026-12-19', end: '2026-12-19', venue: '킨텍스', poster: 'PF_PF306284_261112_150728.jpg' },
      { id: 'PF303361', rank: 2, title: 'COUNTDOWN FANTASY', start: '2026-12-31', end: '2026-12-31', venue: '킨텍스', poster: 'PF_PF303361_261014_165246.jpg' },
      { id: 'PF303493', rank: 3, title: '이찬원 콘서트: 찬스 감사제: 함께여서 찬란했습니다', start: '2026-12-18', end: '2026-12-20', venue: '킨텍스', poster: 'PF_PF303493_261015_151253.jpg' },
      { id: 'PF301286', rank: 4, title: 'GUMMY Tour Concert: LOVE [성남]', start: '2026-11-21', end: '2026-11-22', venue: '성남아트센터', poster: 'PF_PF301286_260918_130043.gif' },
      { id: 'PF305863', rank: 5, title: '박창근 장르 연말 콘서트: Good to See You [구리]', start: '2026-12-30', end: '2026-12-31', venue: '구리아트홀', poster: 'PF_PF305863_261109_162656.gif' },
      { id: 'PF304838', rank: 6, title: '플라이 투더 스카이 전국투어 콘서트, FLY TO THE SKY TOUR: Ⅱ [용인]', start: '2026-12-19', end: '2026-12-20', venue: '용인포은아트홀', poster: 'PF_PF304838_261029_134912.jpg' },
      { id: 'PF301028', rank: 7, title: '무명전설 크리스마스 콘서트 [수원 (앵콜) ]', start: '2026-12-25', end: '2026-12-25', venue: '수원컨벤션센터', poster: 'PF_PF301028_260916_104910.gif' },
      { id: 'PF301394', rank: 8, title: 'GUMMY Tour Concert: LOVE [용인]', start: '2027-01-09', end: '2027-01-10', venue: '용인포은아트홀', poster: 'PF_PF301394_260921_130122.gif' },
      { id: 'PF304910', rank: 9, title: '진성 단독 토크콘서트: 진성쑈 [안양]', start: '2026-12-12', end: '2026-12-12', venue: '안양아트센터', poster: 'PF_PF304910_261030_120941.gif' },
      { id: 'PF304718', rank: 10, title: '변진섭 전국투어 콘서트: 변천사 시즌 2.7: 타임머신 [성남]', start: '2026-12-06', end: '2026-12-06', venue: '성남아트센터', poster: 'PF_PF304718_261028_143025.gif' },
    ],
    클래식: [
      { id: 'PF306343', rank: 1, title: '성남아트센터 송년음악회', start: '2026-12-31', end: '2026-12-31', venue: '성남아트센터', poster: 'PF_PF306343_261113_113255.gif' },
      { id: 'PF304575', rank: 2, title: '크리스마스 지브리 & 디즈니 OST 콘서트 [성남]', start: '2026-12-24', end: '2026-12-25', venue: '성남아트센터', poster: 'PF_PF304575_261027_131319.gif' },
      { id: 'PF304242', rank: 3, title: '조수미 세계무대 데뷔 40주년 기념공연: Continuum [고양]', start: '2026-12-30', end: '2026-12-30', venue: '고양아람누리', poster: 'PF_PF304242_261023_101508.gif' },
      { id: 'PF305463', rank: 4, title: '라 트라비아타 [시흥]', start: '2026-12-11', end: '2026-12-12', venue: '시흥아트센터', poster: 'PF_PF305463_261104_141848.gif' },
      { id: 'PF303954', rank: 5, title: '크리스마스 지브리 & 디즈니 OST 콘서트 with 첼로댁 [부천]', start: '2026-12-24', end: '2026-12-24', venue: '부천아트센터', poster: 'PF_PF303954_261021_104144.jpg' },
      { id: 'PF305984', rank: 6, title: '고양월드클래식, 고양-몽펠리에 페스티벌 오케스트라 with 백건우 [고양]', start: '2026-12-19', end: '2026-12-19', venue: '고양아람누리', poster: 'PF_PF305984_261110_142210.jpeg' },
      { id: 'PF302323', rank: 7, title: '파리나무 십자가 소년합창단 특별 초청공연 [수원]', start: '2026-12-13', end: '2026-12-13', venue: '수원SK아트리움', poster: 'PF_PF302323_261002_113807.gif' },
      { id: 'PF301376', rank: 8, title: '11월의 크리스마스 콘서트: 로열 콘세르트헤바우 오케스트라 브라스 앙상블 [의정부]', start: '2026-11-27', end: '2026-11-27', venue: '의정부예술의전당', poster: 'PF_PF301376_260921_114603.gif' },
      { id: 'PF295605', rank: 9, title: '크리스마스 영화음악 & 캐롤 FESTA [부천]', start: '2026-12-24', end: '2026-12-24', venue: '부천시민회관', poster: 'PF_PF295605_260708_132154.gif' },
      { id: 'PF300141', rank: 10, title: '오페라 정원, 라 보엠 [성남]', start: '2026-11-14', end: '2026-11-14', venue: '성남아트센터', poster: 'PF_PF300141_260904_130206.gif' },
    ],
    무용: [
      { id: 'PF301911', rank: 1, title: '유니버설발레단, 호두까기인형 [고양]', start: '2026-11-14', end: '2026-11-15', venue: '고양아람누리', poster: 'PF_PF301911_260929_101242.jpeg' },
      { id: 'PF303363', rank: 2, title: 'BAC 특별기획, 호두까기인형', start: '2026-12-27', end: '2026-12-27', venue: '부천아트센터', poster: 'PF_PF303363_261014_165855.gif' },
      { id: 'PF304808', rank: 3, title: 'The Original 안성맞춤 오리지널, 더 클래식: 애매모호한 백조들 [안성]', start: '2026-12-04', end: '2026-12-05', venue: '안성맞춤아트홀', poster: 'PF_PF304808_261029_123437.gif' },
      { id: 'PF305822', rank: 4, title: '송년 발레 갈라 페스티벌, 아우레아 발레단 [안양]', start: '2026-12-02', end: '2026-12-02', venue: '안양아트센터', poster: 'PF_PF305822_261109_150808.gif' },
      { id: 'PF300506', rank: 5, title: '유니버설발레단, 호두까기인형 [평택]', start: '2026-11-20', end: '2026-11-21', venue: '평택아트센터', poster: 'PF_PF300506_260909_145621.jpg' },
    ],
    연극: [
      { id: 'PF302597', rank: 1, title: '친정엄마와 2박3일 [하남]', start: '2026-12-04', end: '2026-12-05', venue: '하남문화예술회관', poster: 'PF_PF302597_261006_161337.png' },
      { id: 'PF302165', rank: 2, title: '친정엄마와 2박3일 [고양]', start: '2026-12-19', end: '2026-12-20', venue: '고양어울림누리', poster: 'PF_PF302165_260930_152920.jpg' },
      { id: 'PF305511', rank: 3, title: '꽃의 비밀 [고양]', start: '2027-01-23', end: '2027-01-24', venue: '고양어울림누리', poster: 'PF_PF305511_261105_104336.png' },
      { id: 'PF300833', rank: 4, title: '불편한 편의점 [성남]', start: '2026-11-14', end: '2026-11-15', venue: '성남아트리움 (구. 성남시민회관)', poster: 'PF_PF300833_260914_141106.gif' },
      { id: 'PF303377', rank: 5, title: '꽃의 비밀 [이천]', start: '2026-12-11', end: '2026-12-12', venue: '이천아트홀', poster: 'PF_PF303377_261014_175148.gif' },
      { id: 'PF304739', rank: 6, title: '당진, 겨울나무 손 잡고 봄 꽃. [고양]', start: '2026-11-20', end: '2026-11-29', venue: '고양아람누리', poster: 'PF_PF304739_261028_151042.jpg' },
      { id: 'PF304175', rank: 7, title: '꽃의 비밀 [용인]', start: '2026-12-19', end: '2026-12-20', venue: '용인시평생학습관 (여성회관)', poster: 'PF_PF304175_261022_134249.gif' },
      { id: 'PF292790', rank: 8, title: '국립극단, 스카팽 [화성]', start: '2026-11-20', end: '2026-11-22', venue: '화성예술의전당', poster: 'PF_PF292790_260602_133415.gif' },
      { id: 'PF301233', rank: 9, title: '불편한 편의점 [의정부]', start: '2026-11-21', end: '2026-11-21', venue: '의정부예술의전당', poster: 'PF_PF301233_260917_151556.gif' },
      { id: 'PF294311', rank: 10, title: '맞선 [수원]', start: '2026-10-17', end: '2026-11-21', venue: '소극장 울림터 (극단 메카네)', poster: 'PF_PF294311_260622_141558.jpg' },
    ],
  },
  인천: {
    뮤지컬: [
      { id: 'PF301439', rank: 1, title: '광화문 연가 [인천]', start: '2026-12-19', end: '2026-12-20', venue: '인천문화예술회관', poster: 'PF_PF301439_260921_143643.gif' },
      { id: 'PF298550', rank: 2, title: '팬레터 [인천]', start: '2026-11-21', end: '2026-11-22', venue: '인천문화예술회관', poster: 'PF_PF298550_260814_134230.gif' },
      { id: 'PF304258', rank: 3, title: '청소년을 위한 공연축제 Ⅱ, 페이크북 [인천]', start: '2026-12-12', end: '2026-12-12', venue: '인천문화예술회관', poster: 'PF_PF304258_261023_110205.jpg' },
      { id: 'PF305210', rank: 4, title: '바다의 불빛 [인천]', start: '2026-11-28', end: '2026-11-29', venue: '트라이보울', poster: 'PF_PF305210_261103_110533.jpg' },
      { id: 'PF303912', rank: 5, title: '쉐도우 [인천]', start: '2026-12-04', end: '2026-12-05', venue: '제물포구문화체육센터(구. 동구문화체육센터)', poster: 'PF_PF303912_261020_144334.gif' },
      { id: 'PF304911', rank: 6, title: '당신만이 [부평]', start: '2026-12-12', end: '2026-12-23', venue: '부평아트센터', poster: 'PF_PF304911_261030_121144.jpg' },
    ],
    콘서트: [
      { id: 'PF301684', rank: 1, title: '조용필 & 위대한탄생 콘서트 [인천]', start: '2027-01-09', end: '2027-01-09', venue: '송도컨벤시아', poster: 'PF_PF301684_260923_133218.jpg' },
      { id: 'PF306100', rank: 2, title: '팬텀싱어 페스티벌 [인천]', start: '2026-12-25', end: '2026-12-25', venue: '송도컨벤시아', poster: 'PF_PF306100_261111_140850.gif' },
      { id: 'PF301500', rank: 3, title: 'GUMMY Tour Concert : LOVE [인천]', start: '2026-12-31', end: '2026-12-31', venue: '송도컨벤시아', poster: 'PF_PF301500_260921_171333.gif' },
      { id: 'PF306105', rank: 4, title: 'X-MAS SUDDENLY FESTA [인천]', start: '2026-12-26', end: '2026-12-26', venue: '송도컨벤시아', poster: 'PF_PF306105_261111_141745.gif' },
      { id: 'PF303398', rank: 5, title: '영탁 단독 콘서트: TAK SHOW5 [인천]', start: '2026-12-19', end: '2026-12-20', venue: '인천남동체육관', poster: 'PF_PF303398_261015_103548.jpg' },
      { id: 'PF281962', rank: 6, title: '마이 케미컬 로맨스 내한공연', start: '2026-11-07', end: '2026-11-07', venue: '파라다이스시티', poster: 'PF_PF281962_251222_125508.jpg' },
      { id: 'PF300401', rank: 7, title: '무명전설 전국투어 콘서트 [인천]', start: '2026-12-05', end: '2026-12-05', venue: '인천남동체육관', poster: 'PF_PF300401_260908_132947.gif' },
      { id: 'PF298469', rank: 8, title: '이승철 40주년 콘서트, THE VOICE: LEE SEUNG CHUL [인천]', start: '2026-12-12', end: '2026-12-12', venue: '인스파이어 엔터테인먼트 리조트', poster: 'PF_PF298469_260813_151004.jpg' },
      { id: 'PF304197', rank: 9, title: '변진섭 전국투어 콘서트: 변천사 시즌 2.7: 타임머신 [인천]', start: '2026-12-12', end: '2026-12-12', venue: '인천문화예술회관', poster: 'PF_PF304197_261022_142615.jpg' },
      { id: 'PF304908', rank: 10, title: '먼데이키즈 연말 콘서트: 여정, 두번째 다시 우리 [부평]', start: '2026-12-19', end: '2026-12-19', venue: '부평아트센터', poster: 'PF_PF304908_261030_115323.png' },
    ],
    클래식: [
      { id: 'PF306104', rank: 1, title: '제199회 인천시립합창단 정기연주회', start: '2026-12-10', end: '2026-12-10', venue: '아트센터 인천', poster: 'PF_PF306104_261111_141745.png' },
      { id: 'PF305157', rank: 2, title: '고전과 낭만사이, 베토벤 & 차이코프스키 & 라흐마니노프 [인천]', start: '2026-12-31', end: '2026-12-31', venue: '아트센터 인천', poster: 'PF_PF305157_261102_164645.gif' },
      { id: 'PF302912', rank: 3, title: '크리스마스 지브리 & 디즈니 OST 콘서트 [인천]', start: '2026-12-06', end: '2026-12-06', venue: '아트센터 인천', poster: 'PF_PF302912_261012_125151.gif' },
      { id: 'PF304907', rank: 4, title: 'ACI 송년음악회, 오페라 갈라 콘서트 [인천]', start: '2026-12-05', end: '2026-12-05', venue: '아트센터 인천', poster: 'PF_PF304907_261030_114935.gif' },
      { id: 'PF304609', rank: 5, title: '지브리 & 디즈니 콘서트 [인천]', start: '2027-01-30', end: '2027-01-30', venue: '아트센터 인천', poster: 'PF_PF304609_261027_143649.gif' },
      { id: 'PF303800', rank: 6, title: '나 홀로 집에 인 콘서트 [인천]', start: '2026-12-12', end: '2026-12-12', venue: '아트센터 인천', poster: 'PF_PF303800_261019_153827.gif' },
      { id: 'PF297763', rank: 7, title: '크리스마스 영화음악 & 캐롤 콘서트 [인천]', start: '2026-12-25', end: '2026-12-25', venue: '아트센터 인천', poster: 'PF_PF297763_260805_135750.gif' },
      { id: 'PF303165', rank: 8, title: '양방언 Evolution [인천]', start: '2026-11-26', end: '2026-11-26', venue: '인천문화예술회관', poster: 'PF_PF303165_261013_131301.jpg' },
      { id: 'PF304916', rank: 9, title: '월드 애니메이션 OST 콘서트 [인천]', start: '2027-01-31', end: '2027-01-31', venue: '아트센터 인천', poster: 'PF_PF304916_261030_123721.gif' },
      { id: 'PF304114', rank: 10, title: '제18회 베하필하모닉 오케스트라 송년 콘서트 [인천]', start: '2026-12-08', end: '2026-12-08', venue: '아트센터 인천', poster: 'PF_PF304114_261022_104747.gif' },
    ],
    무용: [
      { id: 'PF302362', rank: 1, title: '제93회 인천시립무용단 정기공연: 먼 눈', start: '2026-11-13', end: '2026-11-14', venue: '인천문화예술회관', poster: 'PF_PF302362_261002_135343.png' },
      { id: 'PF305177', rank: 2, title: '정형일 BALLET CREATIVE, 호두까기 인형 [인천]', start: '2026-12-12', end: '2026-12-12', venue: '인천서해구문화회관(구. 인천서구문화회관)', poster: 'PF_PF305177_261102_173735.jpg' },
      { id: 'PF296661', rank: 3, title: '호두까기 인형 [인천]', start: '2026-12-04', end: '2026-12-05', venue: '부평아트센터', poster: 'PF_PF296661_260722_143206.gif' },
      { id: 'PF305825', rank: 4, title: '해설이 있는 발레, 호두까기 인형 [인천]', start: '2026-12-22', end: '2026-12-22', venue: '인천수봉문화회관', poster: 'PF_PF305825_261109_151556.jpg' },
      { id: 'PF300638', rank: 5, title: '트라이보울 시리즈, 백연 발레프로젝트와이: MELTING 멜팅 [인천]', start: '2026-12-12', end: '2026-12-12', venue: '트라이보울', poster: 'PF_PF300638_260910_150305.gif' },
    ],
    연극: [
      { id: 'PF304588', rank: 1, title: '서푼짜리 오페라 [인천]', start: '2026-11-29', end: '2026-12-06', venue: '인천문화예술회관', poster: 'PF_PF304588_261027_134903.gif' },
      { id: 'PF304957', rank: 2, title: '아무도 불안하지 않다 [인천]', start: '2026-11-12', end: '2026-11-14', venue: '문학시어터', poster: 'PF_PF304957_261030_143815.jpg' },
      { id: 'PF304845', rank: 3, title: '용동권번: 흩날리는 꽃송이 [인천]', start: '2026-11-07', end: '2026-11-29', venue: '인천여관1965', poster: 'PF_PF304845_261029_141127.jpg' },
      { id: 'PF306110', rank: 4, title: '부평문화사랑방 입주단체 상설공연 시리즈, 챌린지 청혼', start: '2026-11-20', end: '2026-11-20', venue: '부평문화사랑방', poster: 'PF_PF306110_261111_142954.gif' },
      { id: 'PF305060', rank: 5, title: '코끼리 코, 끼리, 코, 끼리 코 [인천]', start: '2026-11-05', end: '2026-11-07', venue: '문학시어터', poster: 'PF_PF305060_261102_132315.jpg' },
      { id: 'PF302705', rank: 6, title: '사계의 새 [인천]', start: '2026-11-07', end: '2026-11-07', venue: '청라복합문화센터 블루노바홀', poster: 'PF_PF302705_261007_132920.jpg' },
    ],
  },
}

/** 집계 기간(예매일 기준)과 KOPIS 최종 게시 시각 — 화면에 그대로 보여 준다. */
export const SHOW_RANKING_PERIOD = '11/6~11/12'
export const SHOW_RANKING_PUBLISHED_AT = '2026.11.13 17:33'
export const SHOW_RANKING_SOURCE_URL = 'https://kopis.or.kr/por/boxoffice/boxoffice.do?menuId=MNU_000024'

const KOPIS = 'https://kopis.or.kr'
/** 줄인 그림(가로 256px, 12~20KB) — KOPIS 가 자기 화면에 쓰는 것과 같은 길이다. 원본은 0.06~2MB 라 그대로 쓰지 않는다. */
export const showPosterUrl = (s: Show) =>
  `${KOPIS}/_next/image?url=${encodeURIComponent(`/upload/pfmPoster/${s.poster}`)}&w=256&q=75`
/** 줄인 그림을 못 받으면 원본으로 한 번 더 */
export const showPosterFallbackUrl = (s: Show) => `${KOPIS}/upload/pfmPoster/${s.poster}`
export const showInfoUrl = (s: Show) => `${KOPIS}/por/db/pblprfr/pblprfrView.do?menuId=MNU_00020&mt20Id=${s.id}`
