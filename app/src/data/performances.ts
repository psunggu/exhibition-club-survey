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
      { id: 'PF300974', rank: 1, title: '두 도시 이야기', start: '2026-11-11', end: '2027-02-08', venue: '광림아트센터', poster: 'PF_PF300974_260915_132402.gif' },
      { id: 'PF292160', rank: 2, title: '겨울왕국 [서울]', start: '2026-08-13', end: '2027-03-01', venue: '샤롯데씨어터', poster: 'PF_PF292160_260601_111455.gif' },
      { id: 'PF302015', rank: 3, title: '시카고 [서울]', start: '2026-12-05', end: '2027-03-14', venue: 'LG아트센터 서울', poster: 'PF_PF302015_260929_151431.gif' },
      { id: 'PF302842', rank: 4, title: '오페라의 유령 40주년 스페셜 시즌', start: '2026-12-22', end: '2027-02-28', venue: '블루스퀘어', poster: 'PF_PF302842_261008_143949.jpg' },
      { id: 'PF302677', rank: 5, title: '미세스 다웃파이어 [서울]', start: '2026-12-03', end: '2027-02-21', venue: 'GS아트센터', poster: 'PF_PF302677_261007_113759.jpg' },
      { id: 'PF302516', rank: 6, title: '레베카 [서울]', start: '2026-11-24', end: '2027-03-14', venue: '충무아트센터', poster: 'PF_PF302516_261006_134804.jpg' },
      { id: 'PF303673', rank: 7, title: '여신님이 보고 계셔 [대학로]', start: '2026-11-24', end: '2027-03-01', venue: '유니플렉스', poster: 'PF_PF303673_261019_104705.gif' },
      { id: 'PF303043', rank: 8, title: '스위니토드 (SWEENEY TODD)', start: '2026-12-04', end: '2027-05-02', venue: '디큐브링크아트센터', poster: 'PF_PF303043_261012_171201.gif' },
      { id: 'PF306985', rank: 9, title: '나르치스와 골드문트', start: '2026-12-22', end: '2027-03-14', venue: '예스24 스테이지(구. DCF대명문화공장)', poster: 'PF_PF306985_261119_142956.jpg' },
      { id: 'PF304574', rank: 10, title: '인간실격: 사양 편', start: '2026-12-11', end: '2027-03-07', venue: '예스24 스테이지(구. DCF대명문화공장)', poster: 'PF_PF304574_261027_130640.jpg' },
    ],
    콘서트: [
      { id: 'PF307107', rank: 1, title: 'DAY6 Special Concert: The Present', start: '2026-12-18', end: '2026-12-20', venue: '올림픽공원', poster: 'PF_PF307107_261120_144210.gif' },
      { id: 'PF306978', rank: 2, title: 'KIMCHIKURA x ANISAMA [서울]', start: '2027-01-23', end: '2027-01-24', venue: '블루스퀘어', poster: 'PF_PF306978_261119_140758.gif' },
      { id: 'PF306729', rank: 3, title: 'ONEWE SEASON LIVE, 冬花: ONE moment WE bloom', start: '2026-12-12', end: '2026-12-13', venue: '예스24 라이브홀 (구. 악스코리아)', poster: 'PF_PF306729_261117_145818.jpg' },
      { id: 'PF307132', rank: 4, title: '손태진 전국투어 콘서트: Bon Voyage [서울]', start: '2027-01-09', end: '2027-01-10', venue: '올림픽공원', poster: 'PF_PF307132_261120_162245.gif' },
      { id: 'PF307045', rank: 5, title: 'CRUSH CONCERT: CRUSH H♥UR', start: '2026-12-25', end: '2026-12-26', venue: '올림픽공원', poster: 'PF_PF307045_261120_110346.png' },
      { id: 'PF306428', rank: 6, title: 'HYUKOH 33 TOUR [서울]', start: '2027-01-16', end: '2027-01-17', venue: '올림픽공원', poster: 'PF_PF306428_261113_165359.jpg' },
      { id: 'PF306552', rank: 7, title: '안성훈 & 진해성 콘서트: 투맨쇼', start: '2026-12-12', end: '2026-12-12', venue: '세종대학교 대양홀', poster: 'PF_PF306552_261116_152007.jpg' },
      { id: 'PF307018', rank: 8, title: '어반자카파 콘서트: 크리스마스', start: '2026-12-24', end: '2026-12-26', venue: '블루스퀘어', poster: 'PF_PF307018_261119_161938.gif' },
      { id: 'PF306868', rank: 9, title: 'PENTAGON 10th Anniversary Tour: 101010: 010101 [서울 (앵콜) ]', start: '2026-12-31', end: '2026-12-31', venue: '블루스퀘어', poster: 'PF_PF306868_261118_160447.gif' },
      { id: 'PF306800', rank: 10, title: '클릭비의 특별한 연말파티: 송~년회', start: '2026-12-30', end: '2026-12-31', venue: '연세대학교 대강당', poster: 'PF_PF306800_261118_130753.jpg' },
    ],
    클래식: [
      { id: 'PF303357', rank: 1, title: '송년 음악회, 환희: 그대 음성에 내 마음 열리고', start: '2026-11-30', end: '2026-11-30', venue: '세종문화회관', poster: 'PF_PF303357_261014_164051.jpg' },
      { id: 'PF303355', rank: 2, title: '크리스마스 콘서트: 유키 구라모토와 친구들', start: '2026-12-25', end: '2026-12-25', venue: '롯데콘서트홀', poster: 'PF_PF303355_261014_163311.jpg' },
      { id: 'PF306988', rank: 3, title: '김선욱 베토벤 피아노 소나타 전곡 시리즈 Ⅰ (01.13)', start: '2027-01-13', end: '2027-01-13', venue: '예술의전당 [서울]', poster: 'PF_PF306988_261119_143948.gif' },
      { id: 'PF306776', rank: 4, title: '김선욱 베토벤 피아노 소나타 전곡 시리즈 Ⅳ', start: '2027-03-27', end: '2027-03-27', venue: '예술의전당 [서울]', poster: 'PF_PF306776_261118_110157.jpg' },
      { id: 'PF306994', rank: 5, title: '김선욱 베토벤 피아노 소나타 전곡 시리즈 Ⅱ (01.17)', start: '2027-01-17', end: '2027-01-17', venue: '예술의전당 [서울]', poster: 'PF_PF306994_261119_145612.gif' },
      { id: 'PF307017', rank: 6, title: '김선욱 베토벤 피아노 소나타 전곡 시리즈 Ⅲ (03.21)', start: '2027-03-21', end: '2027-03-21', venue: '예술의전당 [서울]', poster: 'PF_PF307017_261119_160946.gif' },
      { id: 'PF303291', rank: 7, title: '지브리 & 디즈니 영화음악 FESTA [서울] (01.02)', start: '2027-01-02', end: '2027-01-02', venue: '롯데콘서트홀', poster: 'PF_PF303291_261014_131734.jpg' },
      { id: 'PF303358', rank: 8, title: '크리스마스 지브리 & 디즈니 OST 콘서트', start: '2026-12-21', end: '2026-12-21', venue: '롯데콘서트홀', poster: 'PF_PF303358_261014_164608.jpg' },
      { id: 'PF307020', rank: 9, title: '낭만주의 거장, 차이코프스키 & 라흐마니노프 [서울]', start: '2027-01-10', end: '2027-01-10', venue: '예술의전당 [서울]', poster: 'PF_PF307020_261119_162529.gif' },
      { id: 'PF306106', rank: 10, title: '신카이 마코토 하이라이트 필름콘서트 [서울 마포]', start: '2027-01-09', end: '2027-01-09', venue: '마포아트센터', poster: 'PF_PF306106_261111_142138.gif' },
    ],
    무용: [
      { id: 'PF303402', rank: 1, title: '유니버설발레단, 호두까기인형 [서울 종로]', start: '2026-12-17', end: '2026-12-30', venue: '세종문화회관', poster: 'PF_PF303402_261016_101506.gif' },
      { id: 'PF306802', rank: 2, title: '천년의 몸짓: 김근희 80년 인생, 춤', start: '2026-12-01', end: '2026-12-01', venue: '국립국악원', poster: 'PF_PF306802_261118_131123.jpg' },
      { id: 'PF303266', rank: 3, title: '국립발레단, 카멜리아 레이디', start: '2026-11-10', end: '2026-11-15', venue: '예술의전당 [서울]', poster: 'PF_PF303266_261103_165440.gif' },
      { id: 'PF306599', rank: 4, title: '국립무용단, 미인', start: '2027-04-01', end: '2027-04-04', venue: '국립극장', poster: 'PF_PF306599_261116_165349.jpg' },
      { id: 'PF306606', rank: 5, title: '국립무용단, 축제', start: '2027-02-04', end: '2027-02-09', venue: '국립극장', poster: 'PF_PF306606_261116_170524.jpg' },
    ],
    연극: [
      { id: 'PF295977', rank: 1, title: '국립극장, 마당놀이: 춘풍처도 온다', start: '2026-11-27', end: '2027-01-24', venue: '국립극장', poster: 'PF_PF295977_261104_130521.gif' },
      { id: 'PF303036', rank: 2, title: '러브레터 [서울 강남]', start: '2026-11-05', end: '2026-12-27', venue: 'KT&G 상상마당 대치아트홀', poster: 'PF_PF303036_261012_165250.gif' },
      { id: 'PF302924', rank: 3, title: '포쉬 [대학로]', start: '2026-11-03', end: '2027-01-24', venue: '굿씨어터', poster: 'PF_PF302924_261012_131605.jpg' },
      { id: 'PF306732', rank: 4, title: 'WBB: We Borrowed Brokenness [대학로]', start: '2026-12-11', end: '2027-03-07', venue: '링크더스페이스(LINK THE SPACE)', poster: 'PF_PF306732_261117_150807.png' },
      { id: 'PF297978', rank: 5, title: '꽃의 비밀 [대학로]', start: '2026-09-12', end: '2026-11-29', venue: '링크아트센터', poster: 'PF_PF297978_260807_141003.gif' },
      { id: 'PF298502', rank: 6, title: '유리동물원 [서울 서초]', start: '2026-10-17', end: '2026-11-22', venue: '예술의전당 [서울]', poster: 'PF_PF298502_260814_102324.gif' },
      { id: 'PF303908', rank: 7, title: '오픈 더 도어 [대학로]', start: '2026-12-05', end: '2027-03-07', venue: '예스24아트원(구.대학로아트원씨어터)', poster: 'PF_PF303908_261020_142951.jpg' },
      { id: 'PF303133', rank: 8, title: '인트라 무로스 (INTRA MUROS)', start: '2026-11-10', end: '2027-02-14', venue: '충무아트센터', poster: 'PF_PF303133_261013_105306.gif' },
      { id: 'PF306558', rank: 9, title: '비공식 클래스', start: '2026-11-26', end: '2026-12-27', venue: 'KBS스포츠월드(아레나)', poster: 'PF_PF306558_261116_153452.gif' },
      { id: 'PF296942', rank: 10, title: '연극열전10, 네이처 오브 포겟팅', start: '2026-09-18', end: '2026-11-29', venue: '세종문화회관', poster: 'PF_PF296942_260727_103259.gif' },
    ],
  },
  경기: {
    뮤지컬: [
      { id: 'PF301001', rank: 1, title: '광화문 연가 [수원]', start: '2027-01-02', end: '2027-01-03', venue: '경기아트센터(구. 경기도문화의전당)', poster: 'PF_PF301001_260915_143727.gif' },
      { id: 'PF299684', rank: 2, title: '빨래 [수원]', start: '2026-12-25', end: '2026-12-27', venue: '경기아트센터(구. 경기도문화의전당)', poster: 'PF_PF299684_260831_111230.gif' },
      { id: 'PF306432', rank: 3, title: '뮤지컬 갈라 라라라: Live & Love & Life [안양]', start: '2026-11-27', end: '2026-11-27', venue: '평촌아트홀', poster: 'PF_PF306432_261113_170742.gif' },
      { id: 'PF305737', rank: 4, title: '송년음악회 Ⅱ, 가장 완벽한 엔딩 [하남]', start: '2026-12-26', end: '2026-12-26', venue: '하남문화예술회관', poster: 'PF_PF305737_261109_123809.gif' },
      { id: 'PF294046', rank: 5, title: '빨래 [하남]', start: '2026-11-13', end: '2026-11-15', venue: '하남문화예술회관', poster: 'PF_PF294046_260618_151101.gif' },
      { id: 'PF303612', rank: 6, title: '오지게 재밌는 가시나들 [안산]', start: '2026-12-04', end: '2026-12-05', venue: '안산문화예술의전당', poster: 'PF_PF303612_261016_141757.jpg' },
      { id: 'PF305920', rank: 7, title: '빨래 [평택 남부]', start: '2026-12-19', end: '2026-12-19', venue: '평택시남부문예회관', poster: 'PF_PF305920_261110_103251.jpg' },
      { id: 'PF303193', rank: 8, title: '오지게 재밌는 가시나들 [과천]', start: '2026-12-11', end: '2026-12-12', venue: '과천시민회관', poster: 'PF_PF303193_261013_141054.gif' },
      { id: 'PF304684', rank: 9, title: '언브로큰 조선 [남양주]', start: '2026-11-20', end: '2026-11-22', venue: '예술마을 그리다', poster: 'PF_PF304684_261028_131500.gif' },
      { id: 'PF306042', rank: 10, title: '애기봉 [김포]', start: '2026-12-11', end: '2026-12-12', venue: '김포아트홀', poster: 'PF_PF306042_261111_110434.gif' },
    ],
    콘서트: [
      { id: 'PF306699', rank: 1, title: 'FORESTELLA CONCERT, BEYOND: EDGE OF LIGHT [일산]', start: '2026-12-24', end: '2026-12-25', venue: '킨텍스', poster: 'PF_PF306699_261117_134224.jpg' },
      { id: 'PF303361', rank: 2, title: 'COUNTDOWN FANTASY', start: '2026-12-31', end: '2026-12-31', venue: '킨텍스', poster: 'PF_PF303361_261014_165246.jpg' },
      { id: 'PF299948', rank: 3, title: 'WONDERLIVET (원더리벳)', start: '2026-11-20', end: '2026-11-22', venue: '킨텍스', poster: 'PF_PF299948_260902_154833.png' },
      { id: 'PF303493', rank: 4, title: '이찬원 콘서트: 찬스 감사제: 함께여서 찬란했습니다', start: '2026-12-18', end: '2026-12-20', venue: '킨텍스', poster: 'PF_PF303493_261015_151253.jpg' },
      { id: 'PF306544', rank: 5, title: '케미콘서트 시즌11, 케이윌 X 나윤권 [하남]', start: '2026-12-12', end: '2026-12-12', venue: '하남문화예술회관', poster: 'PF_PF306544_261116_150225.gif' },
      { id: 'PF301028', rank: 6, title: '무명전설 크리스마스 콘서트 [수원 (앵콜) ]', start: '2026-12-25', end: '2026-12-25', venue: '수원컨벤션센터', poster: 'PF_PF301028_260916_104910.gif' },
      { id: 'PF304581', rank: 7, title: '이무진 전국투어 콘서트, 겨울 인사: From Winter [고양]', start: '2026-11-28', end: '2026-11-29', venue: '고양아람누리', poster: 'PF_PF304581_261027_132951.gif' },
      { id: 'PF301394', rank: 8, title: 'GUMMY Tour Concert: LOVE [용인]', start: '2027-01-09', end: '2027-01-10', venue: '용인포은아트홀', poster: 'PF_PF301394_260921_130122.gif' },
      { id: 'PF301332', rank: 9, title: '김건모. 35TH ANNIVERSARY LIVE TOUR [고양]', start: '2026-12-26', end: '2026-12-26', venue: '킨텍스', poster: 'PF_PF301332_260918_143733.jpg' },
      { id: 'PF306500', rank: 10, title: 'CHRISTMAS CONCERT: 하모나이즈 & 정선아 [군포]', start: '2026-12-23', end: '2026-12-23', venue: '군포문화예술회관', poster: 'PF_PF306500_261116_134033.gif' },
    ],
    클래식: [
      { id: 'PF307011', rank: 1, title: '라 보엠 [군포]', start: '2026-12-18', end: '2026-12-19', venue: '군포문화예술회관', poster: 'PF_PF307011_261119_153718.gif' },
      { id: 'PF304575', rank: 2, title: '크리스마스 지브리 & 디즈니 OST 콘서트 [성남]', start: '2026-12-24', end: '2026-12-25', venue: '성남아트센터', poster: 'PF_PF304575_261027_131319.gif' },
      { id: 'PF306343', rank: 3, title: '성남아트센터 송년음악회', start: '2026-12-31', end: '2026-12-31', venue: '성남아트센터', poster: 'PF_PF306343_261113_113255.gif' },
      { id: 'PF306968', rank: 4, title: '리베란테 스페셜 콘서트 with 레자르 앙상블 [안양]', start: '2026-12-05', end: '2026-12-05', venue: '평촌아트홀', poster: 'PF_PF306968_261119_133137.gif' },
      { id: 'PF304242', rank: 5, title: '조수미 세계무대 데뷔 40주년 기념공연: Continuum [고양]', start: '2026-12-30', end: '2026-12-30', venue: '고양아람누리', poster: 'PF_PF304242_261023_101508.gif' },
      { id: 'PF295605', rank: 6, title: '크리스마스 영화음악 & 캐롤 FESTA [부천]', start: '2026-12-24', end: '2026-12-24', venue: '부천시민회관', poster: 'PF_PF295605_260708_132154.gif' },
      { id: 'PF302323', rank: 7, title: '파리나무 십자가 소년합창단 특별 초청공연 [수원]', start: '2026-12-13', end: '2026-12-13', venue: '수원SK아트리움', poster: 'PF_PF302323_261002_113807.gif' },
      { id: 'PF301376', rank: 8, title: '11월의 크리스마스 콘서트: 로열 콘세르트헤바우 오케스트라 브라스 앙상블 [의정부]', start: '2026-11-27', end: '2026-11-27', venue: '의정부예술의전당', poster: 'PF_PF301376_260921_114603.gif' },
      { id: 'PF307012', rank: 9, title: '성남시립교향악단 송년음악회 [성남]', start: '2026-12-11', end: '2026-12-11', venue: '성남아트센터', poster: 'PF_PF307012_261119_154548.gif' },
      { id: 'PF303460', rank: 10, title: '크리스마스 콘서트: 유키 구라모토와 친구들 [용인]', start: '2026-12-26', end: '2026-12-26', venue: '용인포은아트홀', poster: 'PF_PF303460_261015_140421.gif' },
    ],
    무용: [
      { id: 'PF301911', rank: 1, title: '유니버설발레단, 호두까기인형 [고양]', start: '2026-11-14', end: '2026-11-15', venue: '고양아람누리', poster: 'PF_PF301911_260929_101242.jpeg' },
      { id: 'PF301127', rank: 2, title: '윤별 발레 컴퍼니, 그랜드 갈라 [용인]', start: '2026-12-12', end: '2026-12-12', venue: '용인포은아트홀', poster: 'PF_PF301127_260916_163503.gif' },
      { id: 'PF303363', rank: 3, title: 'BAC 특별기획, 호두까기인형', start: '2026-12-27', end: '2026-12-27', venue: '부천아트센터', poster: 'PF_PF303363_261014_165855.gif' },
      { id: 'PF300506', rank: 4, title: '유니버설발레단, 호두까기인형 [평택]', start: '2026-11-20', end: '2026-11-21', venue: '평택아트센터', poster: 'PF_PF300506_260909_145621.jpg' },
      { id: 'PF304912', rank: 5, title: '인천시티발레단, 미녀와 야수 [평택]', start: '2026-12-11', end: '2026-12-11', venue: '평택시서부문예회관', poster: 'PF_PF304912_261030_121808.jpg' },
    ],
    연극: [
      { id: 'PF302597', rank: 1, title: '친정엄마와 2박3일 [하남]', start: '2026-12-04', end: '2026-12-05', venue: '하남문화예술회관', poster: 'PF_PF302597_261006_161337.png' },
      { id: 'PF302165', rank: 2, title: '친정엄마와 2박3일 [고양]', start: '2026-12-19', end: '2026-12-20', venue: '고양어울림누리', poster: 'PF_PF302165_260930_152920.jpg' },
      { id: 'PF304739', rank: 3, title: '당진, 겨울나무 손 잡고 봄 꽃. [고양]', start: '2026-11-20', end: '2026-11-29', venue: '고양아람누리', poster: 'PF_PF304739_261028_151042.jpg' },
      { id: 'PF301233', rank: 4, title: '불편한 편의점 [의정부]', start: '2026-11-21', end: '2026-11-21', venue: '의정부예술의전당', poster: 'PF_PF301233_260917_151556.gif' },
      { id: 'PF301550', rank: 5, title: '보잉보잉 [수원]', start: '2026-11-07', end: '2026-12-27', venue: 'KBS 수원아트홀', poster: 'PF_PF301550_261120_144014.gif' },
      { id: 'PF289131', rank: 6, title: 'ASAC 청소년 연극, 유원 [안산]', start: '2026-11-26', end: '2026-11-27', venue: '안산문화예술의전당', poster: 'PF_PF289131_260410_144112.gif' },
      { id: 'PF305566', rank: 7, title: '어느계단 이야기 [수원]', start: '2026-12-03', end: '2026-12-06', venue: '경기아트센터(구. 경기도문화의전당)', poster: 'PF_PF305566_261120_161943.gif' },
      { id: 'PF304175', rank: 8, title: '꽃의 비밀 [용인]', start: '2026-12-19', end: '2026-12-20', venue: '용인시평생학습관 (여성회관)', poster: 'PF_PF304175_261022_134249.gif' },
      { id: 'PF305511', rank: 9, title: '꽃의 비밀 [고양]', start: '2027-01-23', end: '2027-01-24', venue: '고양어울림누리', poster: 'PF_PF305511_261105_104336.png' },
      { id: 'PF305510', rank: 10, title: '미안해 아빠 [수원]', start: '2027-01-01', end: '2027-03-01', venue: 'KBS 수원아트홀', poster: 'PF_PF305510_261105_103849.png' },
    ],
  },
  인천: {
    뮤지컬: [
      { id: 'PF301439', rank: 1, title: '광화문 연가 [인천]', start: '2026-12-19', end: '2026-12-20', venue: '인천문화예술회관', poster: 'PF_PF301439_260921_143643.gif' },
      { id: 'PF298550', rank: 2, title: '팬레터 [인천]', start: '2026-11-21', end: '2026-11-22', venue: '인천문화예술회관', poster: 'PF_PF298550_260814_134230.gif' },
      { id: 'PF304911', rank: 3, title: '당신만이 [부평]', start: '2026-12-12', end: '2026-12-23', venue: '부평아트센터', poster: 'PF_PF304911_261030_121144.jpg' },
      { id: 'PF305210', rank: 4, title: '바다의 불빛 [인천]', start: '2026-11-28', end: '2026-11-29', venue: '트라이보울', poster: 'PF_PF305210_261103_110533.jpg' },
      { id: 'PF304258', rank: 5, title: '청소년을 위한 공연축제 Ⅱ, 페이크북 [인천]', start: '2026-12-12', end: '2026-12-12', venue: '인천문화예술회관', poster: 'PF_PF304258_261023_110205.jpg' },
      { id: 'PF302370', rank: 6, title: '커피콘서트 Ⅸ. 뮤지컬 라흐마니노프 [인천]', start: '2026-11-18', end: '2026-11-18', venue: '인천문화예술회관', poster: 'PF_PF302370_261002_141021.jpg' },
      { id: 'PF306974', rank: 7, title: '산타와 루돌프 [인천 서해]', start: '2026-12-05', end: '2026-12-08', venue: '아띠홀', poster: 'PF_PF306974_261119_135102.png' },
      { id: 'PF303902', rank: 8, title: '사랑을 노래한 시 [인천]', start: '2026-12-04', end: '2026-12-20', venue: '신포아트홀', poster: 'PF_PF303902_261020_141505.jpg' },
      { id: 'PF306144', rank: 9, title: '르네상스 맨 [인천]', start: '2026-11-20', end: '2026-11-21', venue: '남동소래아트홀', poster: 'PF_PF306144_261111_153725.jpg' },
    ],
    콘서트: [
      { id: 'PF306578', rank: 1, title: '한로로 5th 단독콘서트: 물음표', start: '2027-01-02', end: '2027-01-03', venue: '네이버 아레나 앳 인스파이어(구. 인스파이어 엔터테인먼트 리조트)', poster: 'PF_PF306578_261116_161238.gif' },
      { id: 'PF301684', rank: 2, title: '조용필 & 위대한탄생 콘서트 [인천]', start: '2027-01-09', end: '2027-01-09', venue: '송도컨벤시아', poster: 'PF_PF301684_260923_133218.jpg' },
      { id: 'PF302022', rank: 3, title: 'MONSTA X WORLD TOUR, THE X: NEXUS [인천 (앵콜) ]', start: '2026-11-21', end: '2026-11-22', venue: '네이버 아레나 앳 인스파이어(구. 인스파이어 엔터테인먼트 리조트)', poster: 'PF_PF302022_260929_153703.gif' },
      { id: 'PF301500', rank: 4, title: 'GUMMY Tour Concert : LOVE [인천]', start: '2026-12-31', end: '2026-12-31', venue: '송도컨벤시아', poster: 'PF_PF301500_260921_171333.gif' },
      { id: 'PF300401', rank: 5, title: '무명전설 전국투어 콘서트 [인천]', start: '2026-12-05', end: '2026-12-05', venue: '인천남동체육관', poster: 'PF_PF300401_260908_132947.gif' },
      { id: 'PF298469', rank: 6, title: '이승철 40주년 콘서트, THE VOICE: LEE SEUNG CHUL [인천]', start: '2026-12-12', end: '2026-12-12', venue: '네이버 아레나 앳 인스파이어(구. 인스파이어 엔터테인먼트 리조트)', poster: 'PF_PF298469_260813_151004.jpg' },
      { id: 'PF303398', rank: 7, title: '영탁 단독 콘서트: TAK SHOW5 [인천]', start: '2026-12-19', end: '2026-12-20', venue: '인천남동체육관', poster: 'PF_PF303398_261015_103548.jpg' },
      { id: 'PF304197', rank: 8, title: '변진섭 전국투어 콘서트: 변천사 시즌 2.7: 타임머신 [인천]', start: '2026-12-12', end: '2026-12-12', venue: '인천문화예술회관', poster: 'PF_PF304197_261022_142615.jpg' },
      { id: 'PF304908', rank: 9, title: '먼데이키즈 연말 콘서트: 여정, 두번째 다시 우리 [부평]', start: '2026-12-19', end: '2026-12-19', venue: '부평아트센터', poster: 'PF_PF304908_261030_115323.png' },
      { id: 'PF302373', rank: 10, title: '부평아트센터 브런치콘서트, 작가의 재즈 (11월)', start: '2026-11-26', end: '2026-11-26', venue: '부평아트센터', poster: 'PF_PF302373_261002_141638.gif' },
    ],
    클래식: [
      { id: 'PF302912', rank: 1, title: '크리스마스 지브리 & 디즈니 OST 콘서트 [인천]', start: '2026-12-06', end: '2026-12-06', venue: '아트센터 인천', poster: 'PF_PF302912_261012_125151.gif' },
      { id: 'PF305157', rank: 2, title: '고전과 낭만사이, 베토벤 & 차이코프스키 & 라흐마니노프 [인천]', start: '2026-12-31', end: '2026-12-31', venue: '아트센터 인천', poster: 'PF_PF305157_261102_164645.gif' },
      { id: 'PF303800', rank: 3, title: '나 홀로 집에 인 콘서트 [인천]', start: '2026-12-12', end: '2026-12-12', venue: '아트센터 인천', poster: 'PF_PF303800_261019_153827.gif' },
      { id: 'PF297763', rank: 4, title: '크리스마스 영화음악 & 캐롤 콘서트 [인천]', start: '2026-12-25', end: '2026-12-25', venue: '아트센터 인천', poster: 'PF_PF297763_260805_135750.gif' },
      { id: 'PF304114', rank: 5, title: '제18회 베하필하모닉 오케스트라 송년 콘서트 [인천]', start: '2026-12-08', end: '2026-12-08', venue: '아트센터 인천', poster: 'PF_PF304114_261022_104747.gif' },
      { id: 'PF304609', rank: 6, title: '지브리 & 디즈니 콘서트 [인천]', start: '2027-01-30', end: '2027-01-30', venue: '아트센터 인천', poster: 'PF_PF304609_261027_143649.gif' },
      { id: 'PF304907', rank: 7, title: 'ACI 송년음악회, 오페라 갈라 콘서트 [인천]', start: '2026-12-05', end: '2026-12-05', venue: '아트센터 인천', poster: 'PF_PF304907_261030_114935.gif' },
      { id: 'PF306104', rank: 8, title: '제199회 인천시립합창단 정기연주회', start: '2026-12-10', end: '2026-12-10', venue: '아트센터 인천', poster: 'PF_PF306104_261111_141745.png' },
      { id: 'PF305597', rank: 9, title: '송년음악회: 일리야 라쉬코프스키, 라흐마니노프 3개의 피아노 협주곡 [인천]', start: '2026-12-17', end: '2026-12-17', venue: '인천서해구문화회관(구. 인천서구문화회관)', poster: 'PF_PF305597_261105_145109.jpg' },
      { id: 'PF288841', rank: 10, title: '탈리스 스콜라스: 시스티나의 영감 [인천]', start: '2026-11-15', end: '2026-11-15', venue: '아트센터 인천', poster: 'PF_PF288841_260602_165545.gif' },
    ],
    무용: [
      { id: 'PF296661', rank: 1, title: '호두까기 인형 [인천]', start: '2026-12-04', end: '2026-12-05', venue: '부평아트센터', poster: 'PF_PF296661_260722_143206.gif' },
      { id: 'PF305177', rank: 2, title: '정형일 BALLET CREATIVE, 호두까기 인형 [인천]', start: '2026-12-12', end: '2026-12-12', venue: '인천서해구문화회관(구. 인천서구문화회관)', poster: 'PF_PF305177_261102_173735.jpg' },
      { id: 'PF302362', rank: 3, title: '제93회 인천시립무용단 정기공연: 먼 눈', start: '2026-11-13', end: '2026-11-14', venue: '인천문화예술회관', poster: 'PF_PF302362_261002_135343.png' },
      { id: 'PF305825', rank: 4, title: '해설이 있는 발레, 호두까기 인형 [인천]', start: '2026-12-22', end: '2026-12-22', venue: '인천수봉문화회관', poster: 'PF_PF305825_261109_151556.jpg' },
      { id: 'PF300634', rank: 5, title: '트라이보울 시리즈: 99 아트컴퍼니의 제, 타오르는 삶 [인천]', start: '2026-11-25', end: '2026-11-25', venue: '트라이보울', poster: 'PF_PF300634_260910_145134.gif' },
    ],
    연극: [
      { id: 'PF304588', rank: 1, title: '서푼짜리 오페라 [인천]', start: '2026-11-29', end: '2026-12-06', venue: '인천문화예술회관', poster: 'PF_PF304588_261027_134903.gif' },
      { id: 'PF304845', rank: 2, title: '용동권번: 흩날리는 꽃송이 [인천]', start: '2026-11-07', end: '2026-11-29', venue: '인천여관1965', poster: 'PF_PF304845_261029_141127.jpg' },
      { id: 'PF304957', rank: 3, title: '아무도 불안하지 않다 [인천]', start: '2026-11-12', end: '2026-11-14', venue: '문학시어터', poster: 'PF_PF304957_261030_143815.jpg' },
      { id: 'PF301100', rank: 4, title: '운빨로맨스 [인천 제물포]', start: '2026-11-20', end: '2026-11-21', venue: '제물포구문화체육센터(구. 동구문화체육센터)', poster: 'PF_PF301100_260916_152058.gif' },
      { id: 'PF305933', rank: 5, title: '늙은 배우의 노래 [인천]', start: '2026-11-20', end: '2026-11-21', venue: '학산소극장', poster: 'PF_PF305933_261110_110624.jpg' },
      { id: 'PF305037', rank: 6, title: '오나리스 [인천]', start: '2026-11-13', end: '2026-11-15', venue: '공간 불모지랩', poster: 'PF_PF305037_261102_123527.png' },
      { id: 'PF306447', rank: 7, title: '몇 개의 음을 내뱉고 수상한 말을 읊조린다 [인천]', start: '2026-12-11', end: '2026-12-12', venue: '부평아트센터', poster: 'PF_PF306447_261116_104007.gif' },
      { id: 'PF306778', rank: 8, title: '나잇나잇 (NIGHT NIGHT) [인천]', start: '2026-12-26', end: '2026-12-26', venue: '문학시어터', poster: 'PF_PF306778_261118_110425.jpg' },
      { id: 'PF306842', rank: 9, title: '인생 2장 (Chapter Two) [인천]', start: '2026-12-24', end: '2026-12-27', venue: '떼아뜨르 다락 소극장', poster: 'PF_PF306842_261118_145311.gif' },
      { id: 'PF302737', rank: 10, title: '내일은 내일에게 [인천]', start: '2026-11-14', end: '2026-11-14', venue: '인천문화예술회관', poster: 'PF_PF302737_261007_144130.jpg' },
    ],
  },
}

/** 집계 기간(예매일 기준)과 KOPIS 최종 게시 시각 — 화면에 그대로 보여 준다. */
export const SHOW_RANKING_PERIOD = '11/13~11/19'
export const SHOW_RANKING_PUBLISHED_AT = '2026.11.22 17:27'
export const SHOW_RANKING_SOURCE_URL = 'https://kopis.or.kr/por/boxoffice/boxoffice.do?menuId=MNU_000024'

const KOPIS = 'https://kopis.or.kr'
/** 줄인 그림(가로 256px, 12~20KB) — KOPIS 가 자기 화면에 쓰는 것과 같은 길이다. 원본은 0.06~2MB 라 그대로 쓰지 않는다. */
export const showPosterUrl = (s: Show) =>
  `${KOPIS}/_next/image?url=${encodeURIComponent(`/upload/pfmPoster/${s.poster}`)}&w=256&q=75`
/** 줄인 그림을 못 받으면 원본으로 한 번 더 */
export const showPosterFallbackUrl = (s: Show) => `${KOPIS}/upload/pfmPoster/${s.poster}`
export const showInfoUrl = (s: Show) => `${KOPIS}/por/db/pblprfr/pblprfrView.do?menuId=MNU_00020&mt20Id=${s.id}`
