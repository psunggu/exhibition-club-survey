-- 202608240002a — 8월 24일 문화 콘텐츠 추천 갱신
--
-- 공식 한국어 상세·예매 페이지에서 기간, 운영시간, 관람료, 할인,
-- 해설, 주차와 링크를 다시 확인했다. 이미 지난 공연은 추천 순위에서
-- 내리고, 9월 관람 후보 4건을 추가한다. 제목 기준으로 여러 번 실행해도
-- 중복되지 않는 순방향 마이그레이션이다.

begin;

-- 8월 20일 종료 공연은 기록은 보존하되 추천 목록에서는 내린다.
update public.events set
  status = '공유완료',
  recommended_rank = null,
  updated_at = now(),
  verification_note = '공식 상세의 2026년 8월 20일 공연 종료를 2026년 8월 24일 재확인하여 추천 목록에서 제외'
where title = '2026 성남아트센터 마티네 콘서트 - 8월 《독일, 음악의 숲》';

update public.events set
  status = '공유완료',
  recommended_rank = null,
  updated_at = now(),
  verification_note = '공식 상세의 2026년 8월 20일 공연 종료를 2026년 8월 24일 재확인하여 추천 목록에서 제외'
where title = 'ACI x 인천시향 공동기획 《조조早朝 클래식》 III';

-- 웨인 티보전을 서울 전시 6위에 넣고 기존 6~13위는 한 칸씩 내린다.
update public.events set
  recommended_rank = case title
    when '《마틴 파 : We Are Martin Parr》' then 7
    when '난지미술창작스튜디오 20주년 기념전 《사랑의 기원》' then 8
    when '《권병준: 내 마음속에 너는》' then 9
    when '2026 타이틀 매치 《오인환 vs. 장서영: 휴먼 에러》' then 10
    when '2026년 한국 대표 조각가전 《조숙진: 지나가는 자리》' then 11
    when '《킹 오브 킹스 전시: The Greatest Love》' then 12
    when '컨템포러리 아티스트 프로젝트 《이완 - 나는 쓴다》' then 13
    when '가나아트컬렉션 《기술의 저변: 경계에 선 장면들》' then 14
  end,
  updated_at = now()
where title in (
  '《마틴 파 : We Are Martin Parr》',
  '난지미술창작스튜디오 20주년 기념전 《사랑의 기원》',
  '《권병준: 내 마음속에 너는》',
  '2026 타이틀 매치 《오인환 vs. 장서영: 휴먼 에러》',
  '2026년 한국 대표 조각가전 《조숙진: 지나가는 자리》',
  '《킹 오브 킹스 전시: The Greatest Love》',
  '컨템포러리 아티스트 프로젝트 《이완 - 나는 쓴다》',
  '가나아트컬렉션 《기술의 저변: 경계에 선 장면들》'
);

-- 기존 인기·얼리버드 추천의 종료일과 사용 기간을 최신 안내로 보정한다.
update public.events set
  venue = '국립현대미술관 서울 지하 1층 3·4·5전시실 및 2층 MMCA 스튜디오',
  owner = '얼리버드 인기 추천',
  recommendation = '8월 26일까지 판매하는 20% 얼리버드로 8월 27일~9월 13일 회차를 예약할 수 있습니다. 대표 작가의 대규모 개인전이자 수·토 야간개장 전시라 9월 모임 후보로 추천합니다.',
  notes = '1시간 단위 회차당 최대 4매까지 예약할 수 있고, 이후 회차는 매주 월요일 18:00에 순차 오픈합니다. 주말·공휴일은 주차 혼잡이 예상되어 대중교통을 권장합니다.',
  rating_reason = '국립현대미술관 공식 상세의 높은 관심도, 대규모 개인전, 20% 얼리버드와 수·토 야간개장을 높게 평가.',
  discount = '얼리버드 성인 6,400원(정가 8,000원에서 20%, 8월 26일까지 판매, 8월 27일~9월 13일 사용). 다자녀카드 20%, 예술인패스 50%; 만 24세 이하·만 65세 이상·학부생 등은 증빙 시 무료. 카드·통신사 제휴 할인 공지 없음',
  docent = '정기 전시해설은 아직 미공지이며 개막 주 교육 프로그램은 별도 운영',
  docent_time = '정기 전시해설 회차 미공지(2026-08-24 확인). 8월 27일 STPI, 8월 28~30일 워크숍, 8월 29일 워크숍, 9월 5일 아트살롱은 별도 신청 프로그램',
  source_label = '국립현대미술관 공식 전시 상세·공식 예약·서울관 관람 및 주차 안내',
  verification_note = '공식 전시 상세와 예약에서 2026년 8월 27일~2027년 2월 9일, 요일별 운영시간, 전시실, 정가, 얼리버드 판매·사용 기간과 회차당 4매를 확인; 서울관 안내에서 주차요금 확인; 정기 전시해설 미공지 확인',
  updated_at = now()
where title = '《서도호》';

update public.events set
  owner = '인기 전시 추천',
  recommendation = '빛·언어·공간·사운드를 몸으로 경험하는 대형 설치전입니다. 얼리버드 신규 판매는 끝났지만 전시는 2027년 1월까지 이어져 북촌 산책과 함께 관람하기 좋습니다.',
  notes = '8월 19일 얼리버드 판매는 종료됐고 기존 구매권은 10월 31일까지 사용할 수 있습니다. 계단·어두운 공간·강한 빛·거울·물 작품이 포함되며 휠체어와 유모차는 로비까지만 진입할 수 있습니다.',
  rating_reason = '국제적 설치미술가의 국내 전시, 관객 참여형 공간 경험과 북촌 접근성을 높게 평가. 종료된 얼리버드는 추천 근거에서 제외했습니다.',
  discount = '일반 성인 22,000원, 대학생 15,000원, 어린이·청소년 12,000원. 일반 단체 성인 17,600원. 얼리버드 신규 판매는 8월 19일 종료; 기존 구매권은 10월 31일까지 사용. 카드·통신사 제휴 할인 공지 없음',
  docent = '공식 전시·예매 상세에 정기 도슨트 공지 없음',
  docent_time = '별도 정기 도슨트 회차 공지 없음(2026-08-24 확인)',
  source_label = '푸투라서울 공식 전시·티켓 상세·네이버 공식 예약',
  verification_note = '푸투라서울 공식 상세에서 2026년 8월 20일~2027년 1월 17일, 요일별 운영시간과 최종 입장·종료 시각, 연령별 관람료, 월요일 휴관, 주차 불가와 정기 도슨트 미공지를 확인',
  updated_at = now()
where title = '《세 번째 시: 에스 데블린, 다시 집으로》';

update public.events set
  owner = '운영진·얼리버드 추천',
  recommendation = '운영진 추천이자 NOL 주간 예매 상위권 전시로 9~10월 정기관람 후보에 적합합니다. 14,000원 얼리버드의 실제 사용 기간은 9월 22일~11월 29일입니다.',
  notes = '전시는 2027년 1월 20일까지지만 얼리버드 티켓은 2026년 9월 22일~11월 29일에만 사용할 수 있습니다. 선착순 한정 판매라 매진 여부와 취소 조건은 결제 직전 확인하세요.',
  rating_reason = '운영진 추천, NOL 주간 상위권(2026-08-24 확인·순위 변동 가능), 정가 대비 약 39% 할인, 9~10월 일정과 스페인 거장 미술의 대중성을 높게 평가.',
  discount = 'NOL 얼리버드 14,000원(정가 23,000원 대비 약 39%, 선착순 한정, 9월 22일~11월 29일 사용). 예술의전당 유료회원 성인·청소년 10%, 현장 우대권 11,500원(대상·증빙 조건 확인). 카드·통신사 제휴 할인 공지 없음',
  docent_time = '별도 정기 도슨트 회차 공지 없음(2026-08-24 확인)',
  source_label = '예술의전당 공식 전시 상세·NOL 공식 예매·예술의전당 주차 안내',
  verification_note = '예술의전당 공식 상세에서 기간·운영시간·장소·정가와 할인·정기 도슨트 공지 여부를 확인하고, NOL에서 얼리버드 14,000원과 9월 22일~11월 29일 사용 기간 및 주간 상위권을 확인; 주차 안내에서 관객 요금 확인',
  updated_at = now()
where title = '《스페인 미술 500년: 빛과 어둠의 연대기》';

update public.events set
  recommendation = '고야의 《카프리초스》 원작 80점을 집중해서 볼 수 있는 전시입니다. 기존 얼리버드권의 사용 기한이 8월 28일이므로 구매자는 관람 일정을 서둘러야 합니다.',
  notes = '기존 얼리버드 티켓 사용 기한은 8월 28일입니다. 신규 판매·잔여 수량과 취소 조건은 NOL 결제 화면에서 최종 확인하세요. 공식 도슨트는 입장권과 별도 상품입니다.',
  discount = '기존 NOL 얼리버드 성인 12,000원·청소년/어린이 9,600원(8월 28일까지 사용; 신규 판매·잔여 여부 최종 확인). 예술의전당 후원·골드회원 30%, 블루·그린회원 20%, 10인 이상 단체 20%, 공식 우대권 11,000원. 카드·통신사 제휴 할인 공지 없음',
  verification_note = '예술의전당 공식 상세에서 기간, 운영시간, 장소, 정가, 회원·우대 할인 확인; NOL에서 기존 얼리버드권 8월 28일 사용 기한 확인; 공식 도슨트 운영사에서 평일·주말 회차 확인; 주차 안내에서 전시 관객 요금 확인',
  updated_at = now()
where title = '《스페인의 거장 고야: 이성이 잠들 때, 괴물이 깨어난다》';

update public.events set
  "time" = '월·화·금 19:30, 수 14:00, 토·공휴일 14:00·18:00, 목·일 공연 없음. 8월 25일 특별 해설 회차는 15:00 공연',
  recommendation = '교회 문화 모임의 성격과 잘 맞는 장기 공연입니다. 8월 25일 14:45에 마지막 공지된 특별 해설이 있고, 이후 정규 공연은 10월 31일까지 이어집니다.',
  notes = '약 115분(인터미션 없음), 초등학생 이상 관람가. 8월 25일 이후 추가 특별 해설은 공식 공지가 없습니다. 공연장 직영 주차장이 없어 대중교통을 권장합니다.',
  rating_reason = '모임 주제 적합성, 창작진과 역사 소재, 8월 25일 마지막 공지 특별 해설과 장기 공연 일정을 높게 평가.',
  docent = '김관영 목사의 15분 공연 해설 특별 회차 운영',
  docent_time = '2026년 8월 25일 14:45 해설 시작, 15:00 공연 시작. 이후 추가 특별 해설 미공지(2026-08-24 확인)',
  verification_note = '공식 공연 상세에서 기간·시간·가격·관람등급을 확인하고 공식 채널에서 8월 25일 14:45 마지막 공지 특별 해설과 홍보 패키지를 확인; 공연장 FAQ에서 주차요금 확인',
  updated_at = now()
where title = '뮤지컬 《저항: 찬송이 된 사람들》';

-- 서울 전시: 현대카드 컬처프로젝트 31 웨인 티보전.
insert into public.events (
  id, status, region, type, title, genre, start_date, end_date, visit_date,
  "time", venue, address, price, price_type, parking, difficulty, rating,
  owner, info_url, map_url, summary, recommendation, notes, rating_reason,
  updated_at, recommended_rank, verified, discount, parking_fee, docent,
  docent_time, source_label, verification_note, main_url
)
select
  gen_random_uuid(), '공유완료', '종로/중구', '전시',
  '현대카드 컬처프로젝트 31 웨인 티보 전 《The Order of Things》',
  '회화, 드로잉, 미국 현대미술, 회고전', '2026-09-19', '2027-02-21', null,
  '매일 10:00-20:00, 입장 마감 19:00. 휴관일 없음',
  '동대문디자인플라자 DDP 뮤지엄 전시1관',
  '서울 중구 을지로 281, DDP 뮤지엄 지하 2층', 0,
  '성인 23,000원, 청소년 18,000원, 어린이 15,000원', '가능',
  '사전예약', '5', '인기 얼리버드 추천',
  'https://nol.yanolja.com/ticket/products/26010009',
  'https://map.kakao.com/?q=%EB%8F%99%EB%8C%80%EB%AC%B8%EB%94%94%EC%9E%90%EC%9D%B8%ED%94%8C%EB%9D%BC%EC%9E%90%20%EB%AE%A4%EC%A7%80%EC%97%84%201%EA%B4%80',
  '미국 현대미술가 웨인 티보의 75년 작업 세계를 회화와 드로잉 105점으로 조망하는 국내 첫 대규모 회고전입니다.',
  '9월 18일까지 정가 대비 40% 일반 얼리버드를 판매하고 현대카드 회원은 10,000원 전용 얼리버드를 이용할 수 있어 9~10월 정기관람 후보로 추천합니다.',
  '일반 얼리버드는 9월 19일~12월 18일에 사용할 수 있고 한정 수량은 조기 종료될 수 있습니다. 현장 대기번호 운영 시 주차 할인이 적용되지 않을 수 있어 결제 전 안내를 확인하세요.',
  '국내 첫 대규모 회고전, 105점 규모, 일반 40%·현대카드 전용 얼리버드와 DDP 접근성을 높게 평가.',
  now(), 6, true,
  '일반 얼리버드 13,800원(40%, 9월 18일 23:59까지 또는 한정 수량 소진 시 종료, 9월 19일~12월 18일 사용). 현대카드 회원 전용 얼리버드 10,000원; 9월 19일부터 현대카드 결제 시 일반권 20%(성인 18,400원·청소년 14,400원·어린이 12,000원). 기프트카드·무기명 법인카드 제외, M포인트 중복 불가. 기타 통신사 할인 공지 없음',
  'DDP 주차장 24시간 운영, 5분당 400원(1시간 4,800원), 1일 최대 50,000원. DDP 내 20,000원 이상 이용 시 1시간 할인 안내가 있으나 현장 대기번호 운영 시 전시 주차 할인이 적용되지 않을 수 있음',
  '공식 전시·예매 상세에 정기 도슨트 공지 없음',
  '별도 정기 도슨트 회차 미공지(2026-08-24 확인). 개막 후 공식 상세 재확인 필요',
  '현대카드 DIVE 공식 상세·NOL 공식 예매·DDP 공식 주차 안내',
  '현대카드 DIVE 공식 상세에서 2026년 9월 19일~2027년 2월 21일, DDP, 105점, 현대카드 얼리버드 10,000원, 정규 20%, 정확한 판매 기간과 제외 조건을 확인; NOL에서 일반 얼리버드 13,800원, 사용 기간, 운영시간·휴관 없음과 주차 유의사항 확인',
  'https://dive.hyundaicard.com/web/content/contentView.hdc?contentId=20463'
where not exists (
  select 1 from public.events
  where title = '현대카드 컬처프로젝트 31 웨인 티보 전 《The Order of Things》'
);

update public.events set
  status = '공유완료', region = '종로/중구', type = '전시',
  genre = '회화, 드로잉, 미국 현대미술, 회고전', start_date = '2026-09-19',
  end_date = '2027-02-21', visit_date = null,
  "time" = '매일 10:00-20:00, 입장 마감 19:00. 휴관일 없음',
  venue = '동대문디자인플라자 DDP 뮤지엄 전시1관',
  address = '서울 중구 을지로 281, DDP 뮤지엄 지하 2층', price = 0,
  price_type = '성인 23,000원, 청소년 18,000원, 어린이 15,000원',
  parking = '가능', difficulty = '사전예약', rating = '5',
  owner = '인기 얼리버드 추천',
  info_url = 'https://nol.yanolja.com/ticket/products/26010009',
  map_url = 'https://map.kakao.com/?q=%EB%8F%99%EB%8C%80%EB%AC%B8%EB%94%94%EC%9E%90%EC%9D%B8%ED%94%8C%EB%9D%BC%EC%9E%90%20%EB%AE%A4%EC%A7%80%EC%97%84%201%EA%B4%80',
  summary = '미국 현대미술가 웨인 티보의 75년 작업 세계를 회화와 드로잉 105점으로 조망하는 국내 첫 대규모 회고전입니다.',
  recommendation = '9월 18일까지 정가 대비 40% 일반 얼리버드를 판매하고 현대카드 회원은 10,000원 전용 얼리버드를 이용할 수 있어 9~10월 정기관람 후보로 추천합니다.',
  notes = '일반 얼리버드는 9월 19일~12월 18일에 사용할 수 있고 한정 수량은 조기 종료될 수 있습니다. 현장 대기번호 운영 시 주차 할인이 적용되지 않을 수 있어 결제 전 안내를 확인하세요.',
  rating_reason = '국내 첫 대규모 회고전, 105점 규모, 일반 40%·현대카드 전용 얼리버드와 DDP 접근성을 높게 평가.',
  updated_at = now(), recommended_rank = 6,
  verified = true,
  discount = '일반 얼리버드 13,800원(40%, 9월 18일 23:59까지 또는 한정 수량 소진 시 종료, 9월 19일~12월 18일 사용). 현대카드 회원 전용 얼리버드 10,000원; 9월 19일부터 현대카드 결제 시 일반권 20%(성인 18,400원·청소년 14,400원·어린이 12,000원). 기프트카드·무기명 법인카드 제외, M포인트 중복 불가. 기타 통신사 할인 공지 없음',
  parking_fee = 'DDP 주차장 24시간 운영, 5분당 400원(1시간 4,800원), 1일 최대 50,000원. DDP 내 20,000원 이상 이용 시 1시간 할인 안내가 있으나 현장 대기번호 운영 시 전시 주차 할인이 적용되지 않을 수 있음',
  docent = '공식 전시·예매 상세에 정기 도슨트 공지 없음',
  docent_time = '별도 정기 도슨트 회차 미공지(2026-08-24 확인). 개막 후 공식 상세 재확인 필요',
  source_label = '현대카드 DIVE 공식 상세·NOL 공식 예매·DDP 공식 주차 안내',
  verification_note = '현대카드 DIVE 공식 상세에서 2026년 9월 19일~2027년 2월 21일, DDP, 105점, 현대카드 얼리버드 10,000원, 정규 20%, 정확한 판매 기간과 제외 조건을 확인; NOL에서 일반 얼리버드 13,800원, 사용 기간, 운영시간·휴관 없음과 주차 유의사항 확인',
  main_url = 'https://dive.hyundaicard.com/web/content/contentView.hdc?contentId=20463'
where title = '현대카드 컬처프로젝트 31 웨인 티보 전 《The Order of Things》';

-- 서울 공연: 예술의전당 9월 마티네 클래식.
insert into public.events (
  id, status, region, type, title, genre, start_date, end_date, visit_date,
  "time", venue, address, price, price_type, parking, difficulty, rating,
  owner, info_url, map_url, summary, recommendation, notes, rating_reason,
  updated_at, recommended_rank, verified, discount, parking_fee, docent,
  docent_time, source_label, verification_note, main_url
)
select gen_random_uuid(), '공유완료', '강남/서초', '공연',
  'KT와 함께하는 예술의전당 마음을 담은 클래식(9월)',
  '클래식, 오케스트라, 해설 음악회', '2026-09-18', '2026-09-18',
  '2026-09-18', '2026-09-18 11:00 (120분)', '예술의전당 콘서트홀',
  '서울 서초구 남부순환로 2406', 0, '일반석 30,000원, 3층석 15,000원',
  '가능', '사전예약', '5', '서울 음악 추천',
  'https://www.sac.or.kr/site/main/show/show_view?SN=74018',
  'https://map.kakao.com/?q=%EC%98%88%EC%88%A0%EC%9D%98%EC%A0%84%EB%8B%B9%20%EC%BD%98%EC%84%9C%ED%8A%B8%ED%99%80',
  '지휘자 정병휘와 KT심포니오케스트라가 연주하고 김용배가 콘서트 가이드로 참여하는 9월 오전 클래식 공연입니다.',
  '금요일 오전 11시 해설형 클래식으로 입문자도 함께 듣기 좋고, KT 멤버십 15% 할인이 있어 서울 음악모임 후보로 추천합니다.',
  '초등학생 이상 관람가. KT 멤버십 할인과 예술의전당 회원·복지 할인은 좌석·매수·증빙 조건을 예매 화면에서 확인하세요.',
  '오전 시간대, 120분 프로그램, 공연 중 콘서트 가이드와 KT 멤버십 할인, 예술의전당 접근성이 강점.',
  now(), 15, true,
  'KT 멤버십 일반석 15%(1인 4매). 예술의전당 유료회원·싹틔우미·노블·다둥이·예술인패스·문화누리·문화릴레이·병역명문가·복지 할인은 공식 예매의 대상·좌석·매수·증빙 조건 확인. 그 밖의 카드·통신사 제휴 할인 공지 없음',
  '공연 관객 5시간 평일 6,000원(금요일), 주말·공휴일 9,000원. 초과 10분당 평일 1,000원, 주말·공휴일 1,500원',
  '공연 중 콘서트 가이드 진행',
  '2026년 9월 18일 11:00 공연에 김용배 콘서트 가이드 참여(별도 사전 도슨트 없음)',
  '예술의전당 공식 공연 상세·주차 안내',
  '예술의전당 공식 상세에서 9월 18일 11:00, 120분, 좌석별 관람료, 출연진, 김용배 콘서트 가이드와 KT 멤버십 15%를 확인; 공식 주차 안내에서 금요일 공연 관객 요금 확인',
  null
where not exists (
  select 1 from public.events
  where title = 'KT와 함께하는 예술의전당 마음을 담은 클래식(9월)'
);

update public.events set
  status = '공유완료', region = '강남/서초', type = '공연',
  genre = '클래식, 오케스트라, 해설 음악회', start_date = '2026-09-18',
  end_date = '2026-09-18', visit_date = '2026-09-18',
  "time" = '2026-09-18 11:00 (120분)', venue = '예술의전당 콘서트홀',
  address = '서울 서초구 남부순환로 2406', price = 0,
  price_type = '일반석 30,000원, 3층석 15,000원', parking = '가능',
  difficulty = '사전예약', rating = '5', owner = '서울 음악 추천',
  info_url = 'https://www.sac.or.kr/site/main/show/show_view?SN=74018',
  map_url = 'https://map.kakao.com/?q=%EC%98%88%EC%88%A0%EC%9D%98%EC%A0%84%EB%8B%B9%20%EC%BD%98%EC%84%9C%ED%8A%B8%ED%99%80',
  summary = '지휘자 정병휘와 KT심포니오케스트라가 연주하고 김용배가 콘서트 가이드로 참여하는 9월 오전 클래식 공연입니다.',
  recommendation = '금요일 오전 11시 해설형 클래식으로 입문자도 함께 듣기 좋고, KT 멤버십 15% 할인이 있어 서울 음악모임 후보로 추천합니다.',
  notes = '초등학생 이상 관람가. KT 멤버십 할인과 예술의전당 회원·복지 할인은 좌석·매수·증빙 조건을 예매 화면에서 확인하세요.',
  rating_reason = '오전 시간대, 120분 프로그램, 공연 중 콘서트 가이드와 KT 멤버십 할인, 예술의전당 접근성이 강점.',
  updated_at = now(), recommended_rank = 15,
  verified = true,
  discount = 'KT 멤버십 일반석 15%(1인 4매). 예술의전당 유료회원·싹틔우미·노블·다둥이·예술인패스·문화누리·문화릴레이·병역명문가·복지 할인은 공식 예매의 대상·좌석·매수·증빙 조건 확인. 그 밖의 카드·통신사 제휴 할인 공지 없음',
  parking_fee = '공연 관객 5시간 평일 6,000원(금요일), 주말·공휴일 9,000원. 초과 10분당 평일 1,000원, 주말·공휴일 1,500원',
  docent = '공연 중 콘서트 가이드 진행',
  docent_time = '2026년 9월 18일 11:00 공연에 김용배 콘서트 가이드 참여(별도 사전 도슨트 없음)',
  source_label = '예술의전당 공식 공연 상세·주차 안내',
  verification_note = '예술의전당 공식 상세에서 9월 18일 11:00, 120분, 좌석별 관람료, 출연진, 김용배 콘서트 가이드와 KT 멤버십 15%를 확인; 공식 주차 안내에서 금요일 공연 관객 요금 확인',
  main_url = null
where title = 'KT와 함께하는 예술의전당 마음을 담은 클래식(9월)';

-- 경기 공연: 조수미 세계무대 데뷔 40주년 기념 공연.
insert into public.events (
  id, status, region, type, title, genre, start_date, end_date, visit_date,
  "time", venue, address, price, price_type, parking, difficulty, rating,
  owner, info_url, map_url, summary, recommendation, notes, rating_reason,
  updated_at, recommended_rank, verified, discount, parking_fee, docent,
  docent_time, source_label, verification_note, main_url
)
select gen_random_uuid(), '공유완료', '안양/경기', '공연',
  '조수미 세계무대 데뷔 40주년 기념 공연 《Continuum》 - 안양',
  '성악, 클래식, 기념 공연', '2026-09-11', '2026-09-11', '2026-09-11',
  '2026-09-11 19:30 (120분, 인터미션 15분 포함)',
  '안양아트센터 관악홀', '경기 안양시 만안구 문예로36번길 16', 0,
  'R석 100,000원, S석 80,000원', '가능', '사전예약', '5',
  '경기 음악 추천',
  'https://ayac.or.kr/base/ayac/performance/read?menuLevel=2&menuNo=2&page=&performanceManagementNo=1&performanceNo=3295&searchCategory=&searchEndDate=&searchStartDate=&searchType=&searchWord=',
  'https://map.kakao.com/?q=%EC%95%88%EC%96%91%EC%95%84%ED%8A%B8%EC%84%BC%ED%84%B0%20%EA%B4%80%EC%95%85%ED%99%80',
  '소프라노 조수미의 세계무대 데뷔 40주년을 기념해 안양아트센터 관악홀에서 여는 120분 클래식 공연입니다.',
  '세계적인 성악가의 40주년 기념 무대를 경기권에서 볼 수 있고 안양시민 20% 등 공식 할인이 다양해 9월 경기 공연 1순위로 추천합니다.',
  '초등학생 이상 관람가. 할인별 매수 제한과 증빙 조건이 다르므로 예매 화면과 현장 안내를 확인하세요.',
  '상징성 있는 40주년 공연, 경기권 접근성, 다양한 공식 할인과 명확한 주차요금을 높게 평가.',
  now(), 104, true,
  'TOPING 회원 10%, 안양시민·자원봉사자 20%, 청년문화예술패스 30%, 장애인·국가유공자 등 공식 대상 50%(좌석·매수·증빙 조건 확인). 카드·통신사 제휴 할인 공지 없음',
  '09:00-21:00 운영, 141면. 공연 관객 4시간 2,000원, 이후 10분당 300원. 일반 30분 700원, 1일 최대 10,000원',
  '공식 공연 상세에 별도 해설·도슨트 공지 없음',
  '별도 사전 해설·도슨트 회차 미공지(2026-08-24 확인)',
  '안양문화예술재단 공식 공연 상세·공식 주차 안내·NOL 공식 예매',
  '안양문화예술재단 공식 상세에서 9월 11일 19:30, 120분, 관악홀, R·S석 가격을 확인하고 NOL에서 할인 항목을 교차검증; 공식 주차 안내에서 운영시간과 공연 관객 요금 확인',
  'https://nol.yanolja.com/ticket/products/26011771'
where not exists (
  select 1 from public.events
  where title = '조수미 세계무대 데뷔 40주년 기념 공연 《Continuum》 - 안양'
);

update public.events set
  status = '공유완료', region = '안양/경기', type = '공연',
  genre = '성악, 클래식, 기념 공연', start_date = '2026-09-11',
  end_date = '2026-09-11', visit_date = '2026-09-11',
  "time" = '2026-09-11 19:30 (120분, 인터미션 15분 포함)',
  venue = '안양아트센터 관악홀', address = '경기 안양시 만안구 문예로36번길 16',
  price = 0, price_type = 'R석 100,000원, S석 80,000원', parking = '가능',
  difficulty = '사전예약', rating = '5', owner = '경기 음악 추천',
  info_url = 'https://ayac.or.kr/base/ayac/performance/read?menuLevel=2&menuNo=2&page=&performanceManagementNo=1&performanceNo=3295&searchCategory=&searchEndDate=&searchStartDate=&searchType=&searchWord=',
  map_url = 'https://map.kakao.com/?q=%EC%95%88%EC%96%91%EC%95%84%ED%8A%B8%EC%84%BC%ED%84%B0%20%EA%B4%80%EC%95%85%ED%99%80',
  summary = '소프라노 조수미의 세계무대 데뷔 40주년을 기념해 안양아트센터 관악홀에서 여는 120분 클래식 공연입니다.',
  recommendation = '세계적인 성악가의 40주년 기념 무대를 경기권에서 볼 수 있고 안양시민 20% 등 공식 할인이 다양해 9월 경기 공연 1순위로 추천합니다.',
  notes = '초등학생 이상 관람가. 할인별 매수 제한과 증빙 조건이 다르므로 예매 화면과 현장 안내를 확인하세요.',
  rating_reason = '상징성 있는 40주년 공연, 경기권 접근성, 다양한 공식 할인과 명확한 주차요금을 높게 평가.',
  updated_at = now(), recommended_rank = 104,
  verified = true,
  discount = 'TOPING 회원 10%, 안양시민·자원봉사자 20%, 청년문화예술패스 30%, 장애인·국가유공자 등 공식 대상 50%(좌석·매수·증빙 조건 확인). 카드·통신사 제휴 할인 공지 없음',
  parking_fee = '09:00-21:00 운영, 141면. 공연 관객 4시간 2,000원, 이후 10분당 300원. 일반 30분 700원, 1일 최대 10,000원',
  docent = '공식 공연 상세에 별도 해설·도슨트 공지 없음',
  docent_time = '별도 사전 해설·도슨트 회차 미공지(2026-08-24 확인)',
  source_label = '안양문화예술재단 공식 공연 상세·공식 주차 안내·NOL 공식 예매',
  verification_note = '안양문화예술재단 공식 상세에서 9월 11일 19:30, 120분, 관악홀, R·S석 가격을 확인하고 NOL에서 할인 항목을 교차검증; 공식 주차 안내에서 운영시간과 공연 관객 요금 확인',
  main_url = 'https://nol.yanolja.com/ticket/products/26011771'
where title = '조수미 세계무대 데뷔 40주년 기념 공연 《Continuum》 - 안양';

-- 인천 공연: 아트센터인천 M&M 시리즈 3.
insert into public.events (
  id, status, region, type, title, genre, start_date, end_date, visit_date,
  "time", venue, address, price, price_type, parking, difficulty, rating,
  owner, info_url, map_url, summary, recommendation, notes, rating_reason,
  updated_at, recommended_rank, verified, discount, parking_fee, docent,
  docent_time, source_label, verification_note, main_url
)
select gen_random_uuid(), '공유완료', '인천', '공연',
  'M&M 시리즈 Ⅲ 《마르티누&이혁·이효》', '클래식, 오케스트라, 피아노',
  '2026-09-19', '2026-09-19', '2026-09-19',
  '2026-09-19 17:00 (100분, 인터미션 15분 포함)',
  '아트센터인천 콘서트홀', '인천 연수구 아트센터대로 222', 0,
  'R석 40,000원, S석 30,000원, A석 20,000원', '가능', '사전예약',
  '5', '인천 음악 추천',
  'https://www.aci.or.kr/main/show/view.do?SHOW_IDX=14134&menuNo=010000&sch_kind=1&show_type=all&subMenuNo=010100&viewType=img',
  'https://map.kakao.com/?q=%EC%95%84%ED%8A%B8%EC%84%BC%ED%84%B0%EC%9D%B8%EC%B2%9C%20%EC%BD%98%EC%84%9C%ED%8A%B8%ED%99%80',
  '마르티누의 작품과 피아니스트 형제 이혁·이효의 무대를 아트센터인천 콘서트홀에서 만나는 9월 M&M 시리즈 공연입니다.',
  '토요일 오후 5시 공연이고 청년 S석 10,000원 등 접근성 높은 공식 할인이 있어 인천 음악모임 후보로 추천합니다.',
  '초등학생 이상 관람가. 할인 증빙을 지참해야 합니다. NOL은 공연 관람객 무료 주차, 한국관광공사는 1시간 무료 후 30분당 600원으로 안내하므로 등록 방식·무료 시간은 방문 전 공연장에 확인하세요.',
  '주말 시간대, 형제 피아니스트와 오케스트라 프로그램, 청소년·청년 할인 폭과 송도 접근성이 강점.',
  now(), 304, true,
  '청소년 S석 5,000원, 만 19~34세 S석 10,000원. 장애인·국가유공자·병역명문가·만 65세 이상 50%, 문화누리카드·20인 이상 단체·ACI 아카데미 20%(증빙·매수 조건 확인). 카드·통신사 제휴 할인 공지 없음',
  'NOL은 공연 관람객 무료 주차로 안내하고 한국관광공사는 1시간 무료 후 30분당 600원으로 안내합니다. 주차 등록 방식·무료 시간은 아트센터인천 032-453-7700에서 최종 확인하세요.',
  '공식 공연 상세에 별도 해설·도슨트 공지 없음',
  '별도 사전 해설·도슨트 회차 미공지(2026-08-24 확인)',
  '아트센터인천 공식 공연 상세·NOL 공식 예매·한국관광공사 VISITKOREA',
  '아트센터인천 공식 상세에서 9월 19일 17:00, 100분, 좌석별 관람료와 할인·예매를 확인하고 NOL에서 공연 정보를 교차검증; NOL의 무료 주차와 한국관광공사의 1시간 무료·이후 30분당 600원 안내가 달라 두 수치를 함께 표시',
  'https://nol.yanolja.com/ticket/products/26002565'
where not exists (
  select 1 from public.events
  where title = 'M&M 시리즈 Ⅲ 《마르티누&이혁·이효》'
);

update public.events set
  status = '공유완료', region = '인천', type = '공연',
  genre = '클래식, 오케스트라, 피아노', start_date = '2026-09-19',
  end_date = '2026-09-19', visit_date = '2026-09-19',
  "time" = '2026-09-19 17:00 (100분, 인터미션 15분 포함)',
  venue = '아트센터인천 콘서트홀', address = '인천 연수구 아트센터대로 222',
  price = 0, price_type = 'R석 40,000원, S석 30,000원, A석 20,000원',
  parking = '가능', difficulty = '사전예약', rating = '5',
  owner = '인천 음악 추천',
  info_url = 'https://www.aci.or.kr/main/show/view.do?SHOW_IDX=14134&menuNo=010000&sch_kind=1&show_type=all&subMenuNo=010100&viewType=img',
  map_url = 'https://map.kakao.com/?q=%EC%95%84%ED%8A%B8%EC%84%BC%ED%84%B0%EC%9D%B8%EC%B2%9C%20%EC%BD%98%EC%84%9C%ED%8A%B8%ED%99%80',
  summary = '마르티누의 작품과 피아니스트 형제 이혁·이효의 무대를 아트센터인천 콘서트홀에서 만나는 9월 M&M 시리즈 공연입니다.',
  recommendation = '토요일 오후 5시 공연이고 청년 S석 10,000원 등 접근성 높은 공식 할인이 있어 인천 음악모임 후보로 추천합니다.',
  notes = '초등학생 이상 관람가. 할인 증빙을 지참해야 합니다. NOL은 공연 관람객 무료 주차, 한국관광공사는 1시간 무료 후 30분당 600원으로 안내하므로 등록 방식·무료 시간은 방문 전 공연장에 확인하세요.',
  rating_reason = '주말 시간대, 형제 피아니스트와 오케스트라 프로그램, 청소년·청년 할인 폭과 송도 접근성이 강점.',
  updated_at = now(), recommended_rank = 304,
  verified = true,
  discount = '청소년 S석 5,000원, 만 19~34세 S석 10,000원. 장애인·국가유공자·병역명문가·만 65세 이상 50%, 문화누리카드·20인 이상 단체·ACI 아카데미 20%(증빙·매수 조건 확인). 카드·통신사 제휴 할인 공지 없음',
  parking_fee = 'NOL은 공연 관람객 무료 주차로 안내하고 한국관광공사는 1시간 무료 후 30분당 600원으로 안내합니다. 주차 등록 방식·무료 시간은 아트센터인천 032-453-7700에서 최종 확인하세요.',
  docent = '공식 공연 상세에 별도 해설·도슨트 공지 없음',
  docent_time = '별도 사전 해설·도슨트 회차 미공지(2026-08-24 확인)',
  source_label = '아트센터인천 공식 공연 상세·NOL 공식 예매·한국관광공사 VISITKOREA',
  verification_note = '아트센터인천 공식 상세에서 9월 19일 17:00, 100분, 좌석별 관람료와 할인·예매를 확인하고 NOL에서 공연 정보를 교차검증; NOL의 무료 주차와 한국관광공사의 1시간 무료·이후 30분당 600원 안내가 달라 두 수치를 함께 표시',
  main_url = 'https://nol.yanolja.com/ticket/products/26002565'
where title = 'M&M 시리즈 Ⅲ 《마르티누&이혁·이효》';

commit;

-- 적용 확인 예시
-- select title, type, region, status, recommended_rank, updated_at
-- from public.events
-- where title in (
--   '현대카드 컬처프로젝트 31 웨인 티보 전 《The Order of Things》',
--   'KT와 함께하는 예술의전당 마음을 담은 클래식(9월)',
--   '조수미 세계무대 데뷔 40주년 기념 공연 《Continuum》 - 안양',
--   'M&M 시리즈 Ⅲ 《마르티누&이혁·이효》'
-- )
-- order by type, recommended_rank, title;
