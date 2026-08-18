const options = {
  statuses: ["검토중", "공유완료", "관람예정", "관람완료", "보류", "취소"],
  regions: ["서울 전체", "종로/중구", "강남/서초", "마포/서대문", "용산/성동", "송파/강동", "영등포/구로", "동대문/성북", "노원/도봉/강북", "강서/양천", "관악/동작/금천", "수원/경기", "인천"],
  types: ["전시", "공연", "영화", "기타"],
  priceTypes: ["무료", "유료", "할인 확인", "초대/이벤트", "확인 필요"],
  parking: ["가능", "불가", "확인 필요"],
  difficulty: ["가볍게", "사전예약", "긴 관람"],
};

const config = window.CLUB_CONFIG || {};
const supabase = createSupabaseClient(config);

const sampleEvents = [
  {
    id: crypto.randomUUID(),
    status: "공유완료",
    region: "서울 전체",
    type: "전시",
    title: "[2026 신진미술인 지원] 허수인 개인전 《사적인 프로토콜》",
    genre: "동시대미술",
    startDate: "2026-07-01",
    endDate: "2026-07-18",
    visitDate: "2026-07-11",
    time: "운영시간 확인 필요",
    venue: "서울시립미술관 신진미술인 지원 프로그램",
    address: "",
    price: 0,
    priceType: "확인 필요",
    parking: "확인 필요",
    difficulty: "가볍게",
    rating: "",
    owner: "",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/landing",
    mapUrl: "",
    summary: "서울시립미술관 전시와 프로그램 목록에 올라온 2026 신진미술인 지원 프로그램 전시입니다.",
    recommendation: "짧은 기간 전시라 7월 초·중순 후보로 먼저 검토하면 좋습니다.",
    notes: "출처: 서울시립미술관 전시와 프로그램 목록. 세부 장소와 관람료는 상세 페이지/현장 안내 확인 필요.",
    ratingReason: "",
    updatedAt: "2026-07-09",
  },
  {
    id: crypto.randomUUID(),
    status: "공유완료",
    region: "노원/도봉/강북",
    type: "전시",
    title: "유휴공간 전시 《보편타당한 당신 ― 심이다은》",
    genre: "동시대미술",
    startDate: "2026-06-25",
    endDate: "2027-04-11",
    visitDate: "2026-08-08",
    time: "운영시간 확인 필요",
    venue: "서울시립 북서울미술관",
    address: "",
    price: 0,
    priceType: "확인 필요",
    parking: "확인 필요",
    difficulty: "가볍게",
    rating: "",
    owner: "",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/landing",
    mapUrl: "",
    summary: "서울시립 북서울미술관에서 진행되는 유휴공간 전시입니다. 기간이 길어 8~9월 중 일정 조율이 쉽습니다.",
    recommendation: "북서울권 회원들이 가볍게 모이기 좋은 후보입니다.",
    notes: "출처: 서울시립미술관 전시와 프로그램 목록. 운영시간, 휴관일, 주차는 방문 전 확인하세요.",
    ratingReason: "",
    updatedAt: "2026-07-09",
  },
  {
    id: crypto.randomUUID(),
    status: "공유완료",
    region: "서울 전체",
    type: "전시",
    title: "[2026 신진미술인 지원] 반재하 개인전 《모퉁이를 돌면 거짓 친구》",
    genre: "동시대미술",
    startDate: "2026-06-19",
    endDate: "2026-07-12",
    visitDate: "2026-07-10",
    time: "운영시간 확인 필요",
    venue: "서울시립미술관 신진미술인 지원 프로그램",
    address: "",
    price: 0,
    priceType: "확인 필요",
    parking: "확인 필요",
    difficulty: "가볍게",
    rating: "",
    owner: "",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/landing",
    mapUrl: "",
    summary: "서울시립미술관 전시와 프로그램 목록에 올라온 신진미술인 지원 프로그램 전시입니다.",
    recommendation: "7월 12일까지라 바로 갈 수 있는 가까운 일정 후보입니다.",
    notes: "출처: 서울시립미술관 전시와 프로그램 목록. 세부 장소와 관람료는 상세 페이지/현장 안내 확인 필요.",
    ratingReason: "",
    updatedAt: "2026-07-09",
  },
  {
    id: crypto.randomUUID(),
    status: "공유완료",
    region: "종로/중구",
    type: "기타",
    title: "그림이 된 이야기",
    genre: "미술아카이브 프로그램",
    startDate: "2026-06-20",
    endDate: "2026-07-19",
    visitDate: "2026-07-12",
    time: "운영시간 확인 필요",
    venue: "서울시립 미술아카이브",
    address: "",
    price: 0,
    priceType: "확인 필요",
    parking: "확인 필요",
    difficulty: "가볍게",
    rating: "",
    owner: "",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/landing",
    mapUrl: "",
    summary: "서울시립 미술아카이브에서 진행되는 7월 미술 프로그램입니다.",
    recommendation: "전시 관람 전후로 가볍게 붙일 수 있는 프로그램 후보입니다.",
    notes: "출처: 서울시립미술관 전시와 프로그램 목록. 모집/예약 마감일과 참여 조건 확인 필요.",
    ratingReason: "",
    updatedAt: "2026-07-09",
  },
  {
    id: crypto.randomUUID(),
    status: "공유완료",
    region: "종로/중구",
    type: "기타",
    title: "2026 예술가의 런치박스 <생성하는 테이블>",
    genre: "미술관 프로그램",
    startDate: "2026-06-24",
    endDate: "2026-08-27",
    visitDate: "2026-08-27",
    time: "운영시간 확인 필요",
    venue: "서울시립미술관 서소문본관",
    address: "",
    price: 0,
    priceType: "확인 필요",
    parking: "확인 필요",
    difficulty: "사전예약",
    rating: "",
    owner: "",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/landing",
    mapUrl: "",
    summary: "음식을 매개로 현대미술을 경험하는 서울시립미술관 프로그램입니다. 8월 일정까지 이어집니다.",
    recommendation: "전시 관람보다 대화형 프로그램을 선호하는 모임원에게 추천할 수 있습니다.",
    notes: "출처: 서울시립미술관 전시와 프로그램 목록. 모집 마감과 예약 여부를 먼저 확인하세요.",
    ratingReason: "",
    updatedAt: "2026-07-09",
  },
];

const recommendedEvents = [
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010001",
    recommendedRank: 1,
    verified: true,
    status: "공유완료",
    region: "종로/중구",
    type: "전시",
    title: "2026년 한국 근대 거장전 《유영국: 산은 내 안에 있다》",
    genre: "한국 추상미술, 회고전",
    startDate: "2026-05-19",
    endDate: "2026-10-25",
    visitDate: "2026-08-08",
    time: "서울시립미술관 서소문본관 관람시간 적용: 화-목 10:00-20:00, 금 10:00-21:00, 토/일/공휴일 10:00-19:00, 월 휴관",
    venue: "서울시립미술관 서소문본관 1층 전시실",
    address: "서울 중구 덕수궁길 61",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "평일 5분 400원(시간당 4,800원), 토·공휴일 5분 300원(시간당 3,600원). 주차장 협소·요일제 운영",
    docent: "공식 상세 페이지 기준 도슨트 운영",
    docentTime: "매주 화~일 11:00, 현장 선착순 20명. 전시·관 사정에 따라 변동 가능",
    difficulty: "긴 관람",
    rating: "5",
    owner: "TOP 1",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1529410",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%EB%AF%B8%EC%88%A0%EA%B4%80%20%EC%84%9C%EC%86%8C%EB%AC%B8%EB%B3%B8%EA%B4%80",
    summary: "유영국 탄생 110주년을 맞아 미공개작 포함 170여 점과 아카이브로 작가의 60여 년 예술 세계를 조망하는 대형 회고전입니다.",
    recommendation: "모임 대표 관람작으로 가장 추천. 한국 추상미술을 깊게 보기에 좋고, 관람 후 대화 소재가 풍부합니다.",
    notes: "SeMA 서소문본관 주차장은 협소하고 5부제를 시행하므로 대중교통 우선 권장.",
    ratingReason: "작품 규모, 작가 중요도, 연계 프로그램, 모임 대화성 모두 높음.",
    sourceLabel: "SeMA 공식 전시 상세",
    verificationNote: "공식 상세 페이지에서 전시명, 장소, 기간, 관람료, 도슨트 회차 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010011",
    recommendedRank: 2,
    verified: true,
    status: "공유완료",
    region: "종로/중구",
    type: "전시",
    title: "《서도호》",
    genre: "설치미술, 한국 현대미술, 대규모 개인전",
    startDate: "2026-08-27",
    endDate: "2027-02-09",
    visitDate: "2026-09-05",
    time: "월·화·목·금·일 10:00-18:00, 수·토 10:00-21:00. 1월 1일·설날·추석 휴관",
    venue: "국립현대미술관 서울 지하 1층 3·5전시실",
    address: "서울 종로구 삼청로 30",
    price: 0,
    priceType: "성인 8,000원",
    discount: "얼리버드 성인 6,400원(공식 관람료 8,000원에 티켓링크 공식 공지 20% 적용, 8월 17일 18:00 오픈). 다자녀카드 20%, 예술인패스 50%; 만 24세 이하·만 65세 이상·학부생 등은 증빙 시 무료. 카드·통신사 제휴 할인 공지 없음",
    parking: "가능",
    parkingFee: "최초 1시간 4,200원, 이후 10분당 700원, 1일 최대 30,000원. 유료 전시 이용 시 1시간 감면; 08:00-23:00 운영, 384대",
    docent: "공식 서울관 전시해설 시간표에 아직 미등재",
    docentTime: "정기 전시해설 회차 미공지(2026-08-17 확인). 개막 후 공식 전시해설 시간표 재확인 필요",
    difficulty: "사전예약",
    rating: "5",
    owner: "얼리버드 인기 추천",
    infoUrl: "https://booking.mmca.go.kr/product/ko/performance/548",
    mainUrl: "https://www.mmca.go.kr/exhibitions/exhibitionsDetail.do?exhId=202601200002041",
    mapUrl: "https://map.kakao.com/?q=%EA%B5%AD%EB%A6%BD%ED%98%84%EB%8C%80%EB%AF%B8%EC%88%A0%EA%B4%80%20%EC%84%9C%EC%9A%B8",
    summary: "이주와 거주, 개인과 공동체, 공간과 기억을 탐구해 온 설치미술가 서도호의 초기작부터 주요작, 진행 중인 프로젝트까지 조망하는 대규모 개인전입니다.",
    recommendation: "공식 전시 상세 조회수가 6만 건을 넘은 관심 전시로, 8월 17일 시작한 20% 얼리버드를 활용해 8월 말~9월 초 모임 후보로 추천합니다.",
    notes: "회차당 최대 4매, 1시간 단위 예약제로 운영합니다. 얼리버드 판매 종료일과 사용 가능 회차는 예약 화면에서 최종 확인하세요. 주말·공휴일에는 공식 예약 페이지도 주차가 어렵다고 안내하므로 대중교통을 우선 권장합니다.",
    ratingReason: "국립현대미술관 공식 상세 조회수 63,205회(2026-08-17 확인), 대표 작가의 대규모 개인전, 저렴한 얼리버드와 야간개장의 장점을 높게 평가.",
    sourceLabel: "국립현대미술관 공식 전시 상세·공식 예약·서울관 관람 및 주차 안내·티켓링크 공식 얼리버드 공지",
    verificationNote: "국립현대미술관 공식 상세와 예약 페이지에서 기간, 운영시간, 장소, 일반 관람료, 얼리버드 시작 시각 확인; 티켓링크 공식 공지에서 20% 할인 확인; 서울관 안내에서 할인·무료 대상과 주차요금 확인; 전시해설 시간표에 아직 미등재 확인",
    updatedAt: "2026-08-17",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010012",
    recommendedRank: 3,
    verified: true,
    status: "공유완료",
    region: "종로/중구",
    type: "전시",
    title: "《세 번째 시: 에스 데블린, 다시 집으로》",
    genre: "설치미술, 빛, 공간, 사운드",
    startDate: "2026-08-20",
    endDate: "2027-01-17",
    visitDate: "2026-09-12",
    time: "화-금·일 10:00-18:00, 토 10:00-19:00, 월 휴관. 권장 관람시간 약 60분",
    venue: "푸투라서울",
    address: "서울 종로구 북촌로 61",
    price: 0,
    priceType: "성인 22,000원, 대학생 15,000원, 청소년·어린이 12,000원",
    discount: "성인 얼리버드 17,600원(정가 대비 20%, 8월 19일까지 판매, 8월 20일~10월 31일 사용). 네이버페이 최대 5% 적립 안내; 카드·통신사 제휴 할인 공지 없음",
    parking: "불가",
    parkingFee: "전용 주차장 없음. 정독도서관 공영주차장·국립현대미술관 주차장·현대계동사옥 주차장·삼청제1공영주차장 등 인근 유료 주차장 이용",
    docent: "공식 전시·예약 상세에 정기 도슨트 공지 없음",
    docentTime: "별도 정기 도슨트 회차 공지 없음(2026-08-17 확인)",
    difficulty: "사전예약",
    rating: "5",
    owner: "얼리버드 추천",
    infoUrl: "https://booking.naver.com/booking/5/bizes/1562003",
    mainUrl: "https://futuraseoul.org/93",
    mapUrl: "https://map.kakao.com/?q=%ED%91%B8%ED%88%AC%EB%9D%BC%EC%84%9C%EC%9A%B8",
    summary: "세계적인 무대·설치미술가 에스 데블린이 빛, 언어, 공간, 사운드와 관객의 움직임으로 현존과 상호소속의 감각을 탐구하는 전시입니다.",
    recommendation: "빛과 공간을 몸으로 경험하는 몰입형 설치전으로, 북촌 산책과 함께 묶기 좋습니다. 판매 종료가 임박한 성인 20% 얼리버드를 우선 확인하세요.",
    notes: "얼리버드는 8월 19일까지 판매하며 10월 31일까지 사용할 수 있습니다. 계단·어두운 공간·강한 빛·거울·물 작품이 포함되고 휠체어와 유모차는 로비까지만 진입 가능합니다.",
    ratingReason: "국제적 설치미술가의 국내 전시, 관객 참여형 공간 경험, 북촌 접근성과 현재 판매 중인 얼리버드의 시급성을 높게 평가.",
    sourceLabel: "푸투라서울 공식 전시 상세·네이버 공식 예약",
    verificationNote: "공식 상세와 예약 페이지에서 기간, 요일별 운영시간, 관람료, 성인 얼리버드 판매·사용 기간, 관람 유의사항, 주차 불가와 인근 주차장 안내 확인; 정기 도슨트 공지 없음",
    updatedAt: "2026-08-17",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010013",
    recommendedRank: 4,
    verified: true,
    status: "공유완료",
    region: "강남/서초",
    type: "전시",
    title: "《스페인의 거장 고야: 이성이 잠들 때, 괴물이 깨어난다》",
    genre: "서양미술, 판화, 스페인 미술",
    startDate: "2026-06-26",
    endDate: "2026-09-30",
    visitDate: "2026-08-23",
    time: "화-일 10:00-19:00, 입장 마감 18:00. 매주 월요일 휴관",
    venue: "예술의전당 한가람미술관 제7전시실",
    address: "서울 서초구 남부순환로 2406",
    price: 0,
    priceType: "성인 20,000원, 청소년·어린이 16,000원",
    discount: "NOL 얼리버드 성인 12,000원·청소년/어린이 9,600원(40%, 8월 28일까지 사용). 예술의전당 후원·골드회원 30%, 블루·그린회원 20%, 10인 이상 단체 20%, 공식 우대권 11,000원(대상·증빙 확인); 카드·통신사 제휴 할인 공지 없음",
    parking: "가능",
    parkingFee: "전시 관객 3시간 평일 4,000원, 주말·공휴일 6,000원. 초과 시 일반요금 10분당 1,000원(주말·공휴일 1,500원)",
    docent: "사전예약형 공식 유료 도슨트 프로그램 운영",
    docentTime: "화-금 11:00·13:00, 토·일 11:00·13:00·15:00. 회차별 약 60분, 사전예약 필수",
    difficulty: "사전예약",
    rating: "5",
    owner: "얼리버드 인기 추천",
    infoUrl: "https://nol.yanolja.com/ticket/products/26006433",
    mainUrl: "https://www.sac.or.kr/site/main/show/show_view?SN=78392",
    mapUrl: "https://map.kakao.com/?q=%EC%98%88%EC%88%A0%EC%9D%98%EC%A0%84%EB%8B%B9%20%ED%95%9C%EA%B0%80%EB%9E%8C%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "고야의 대표 판화 연작 《카프리초스》 원작 80점을 중심으로 이성과 욕망, 사회 비판과 인간 본성에 관한 작가의 시선을 살펴보는 전시입니다.",
    recommendation: "공식 예매 페이지에 다수의 관람 후기가 쌓인 인기 얼리버드 후보입니다. 8월 28일까지 사용할 수 있어 8월 하순에 바로 관람할 모임에 추천합니다.",
    notes: "얼리버드는 8월 28일까지 관람 가능한 한정 티켓이므로 잔여 수량과 취소 조건을 예매 화면에서 확인하세요. 공식 도슨트는 입장권과 별도 상품입니다.",
    ratingReason: "NOL 얼리버드 예매 페이지의 후기 68건과 예술의전당 관람평 17건(2026-08-17 검색·공식 상세 확인), 고야 원작 판화 80점, 40% 할인을 인기·가성비 신호로 평가.",
    sourceLabel: "예술의전당 공식 전시 상세·NOL 공식 예매·온느뮤지엄 공식 도슨트·예술의전당 주차 안내",
    verificationNote: "예술의전당 공식 상세에서 기간, 운영시간, 장소, 정가, 회원·우대 할인 확인; NOL 공식 예매에서 40% 얼리버드와 사용 기한 확인; 공식 도슨트 운영사에서 평일·주말 회차 확인; 예술의전당 주차 안내에서 전시 관객 요금 확인",
    updatedAt: "2026-08-17",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010002",
    recommendedRank: 5,
    verified: true,
    status: "공유완료",
    region: "강남/서초",
    type: "전시",
    title: "《스페인 미술 500년: 빛과 어둠의 연대기》",
    genre: "스페인 미술, 서양미술, 해외명화",
    startDate: "2026-09-22",
    endDate: "2027-01-20",
    visitDate: "2026-10-17",
    time: "화-일 10:00-19:00, 입장 마감 18:00. 매주 월요일 휴관, 공휴일 정상 운영",
    venue: "예술의전당 한가람디자인미술관 제1·2·3전시실",
    address: "서울 서초구 남부순환로 2406",
    price: 0,
    priceType: "성인 23,000원, 청소년 18,000원, 어린이 14,000원",
    discount: "NOL 얼리버드 14,000원(정가 23,000원 대비 39% 할인, 선착순 한정). 예술의전당 유료회원 성인·청소년 10%, 현장 우대권 11,500원(대상·증빙 조건 확인)",
    parking: "가능",
    parkingFee: "전시 관객 3시간 평일 4,000원, 주말·공휴일 6,000원. 초과 시 일반요금 10분당 1,000원(주말·공휴일 1,500원)",
    docent: "공식 상세에 정기 도슨트 공지 없음",
    docentTime: "별도 정기 도슨트 회차 공지 없음(2026-08-08 확인)",
    difficulty: "사전예약",
    rating: "5",
    owner: "운영진 추천",
    infoUrl: "https://nol.yanolja.com/ticket/products/26010709",
    mainUrl: "https://www.sac.or.kr/site/main/show/show_view?SN=77679",
    mapUrl: "https://map.kakao.com/?q=%EC%98%88%EC%88%A0%EC%9D%98%EC%A0%84%EB%8B%B9%20%ED%95%9C%EA%B0%80%EB%9E%8C%EB%94%94%EC%9E%90%EC%9D%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "엘 그레코부터 벨라스케스·고야·소로야까지, 500년에 걸친 스페인 미술의 흐름을 예술의전당 한가람디자인미술관에서 만나는 특별전입니다.",
    recommendation: "운영진 추천 · 공식 얼리버드 예매가 진행 중인 전시입니다. 9~10월 정기관람으로 추진하기 좋고, 얼리버드 사용 가능 기간 안에서 일정 조율을 권장합니다.",
    notes: "얼리버드 티켓 사용 가능 기간은 2026-09-22~11-29이며, 선착순 한정 판매로 조기 매진될 수 있습니다. 주말·공휴일 예술의전당 주차장은 혼잡할 수 있어 대중교통을 권장합니다.",
    ratingReason: "운영진 추천, 정가 대비 39% 얼리버드, 9~10월의 넉넉한 일정과 스페인 거장 미술을 폭넓게 보는 주제성을 높게 평가.",
    sourceLabel: "예술의전당 공식 전시 상세·NOL 공식 예매·예술의전당 주차 안내",
    verificationNote: "예술의전당 공식 상세에서 기간·운영시간·장소·정가·할인·정기 도슨트 공지 여부 확인; NOL 예매에서 얼리버드 가격·사용 기간 확인; 공식 주차 안내에서 관객 요금 확인",
    updatedAt: "2026-08-08",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010003",
    recommendedRank: 6,
    verified: true,
    status: "공유완료",
    region: "노원/도봉/강북",
    type: "전시",
    title: "《마틴 파 : We Are Martin Parr》",
    genre: "사진, 현대미술",
    startDate: "2026-07-16",
    endDate: "2026-10-18",
    visitDate: "2026-08-08",
    time: "화-금 10:00-20:00, 토/일/공휴일 10:00-19:00, 월 휴관",
    venue: "서울시립 사진미술관",
    address: "서울 도봉구 마들로13길 68",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "불가",
    parkingFee: "부설주차장 운영체제 개편으로 이용 어려움. 인근 공영·민영주차장 요금 별도 확인",
    docent: "정기 도슨트 운영",
    docentTime: "매일 11:00, 13:00, 15:00. 1월 1일·설·추석 연휴 미운영",
    difficulty: "가볍게",
    rating: "5",
    owner: "TOP 6",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1553791",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EC%82%AC%EC%A7%84%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "서울시립 사진미술관에서 열리는 마틴 파 전시로, 사진 중심 관람을 원하는 모임에 적합합니다.",
    recommendation: "새 사진미술관 방문과 함께 묶기 좋아 8월 모임 후보로 추천합니다.",
    notes: "창동역 도보권. 차량보다 대중교통 이용 권장.",
    ratingReason: "사진 장르의 접근성, 신설 미술관 방문성, 8월 일정 안정성이 좋음.",
    sourceLabel: "SeMA 공식 전시 상세·사진미술관 방문안내",
    verificationNote: "SeMA 공식 상세에서 전시명, 장소, 기간, 관람료, 도슨트 3회차 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010004",
    recommendedRank: 7,
    verified: true,
    status: "공유완료",
    region: "종로/중구",
    type: "전시",
    title: "난지미술창작스튜디오 20주년 기념전 《사랑의 기원》",
    genre: "동시대미술, 설치, 영상, 퍼포먼스",
    startDate: "2026-04-30",
    endDate: "2026-09-06",
    visitDate: "2026-08-16",
    time: "화-목 10:00-20:00, 금 10:00-21:00, 토/일/공휴일 10:00-19:00, 월 휴관",
    venue: "서울시립미술관 서소문본관",
    address: "서울 중구 덕수궁길 61",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "평일 5분 400원(시간당 4,800원), 토·공휴일 5분 300원(시간당 3,600원). 주차장 협소·요일제 운영",
    docent: "정기 도슨트와 퍼포먼스·대담·강연 등 연계 프로그램 운영",
    docentTime: "매주 화~일 15:00. 전시 개막일 미운영; 연계 프로그램은 회차별 별도 공지",
    difficulty: "긴 관람",
    rating: "4",
    owner: "TOP 7",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1523485",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%EB%AF%B8%EC%88%A0%EA%B4%80%20%EC%84%9C%EC%86%8C%EB%AC%B8%EB%B3%B8%EA%B4%80",
    summary: "난지미술창작스튜디오 10~19기 출신 작가 17명(팀)의 영상, 설치, 조각, 회화, 퍼포먼스 등 60여 점을 조망합니다.",
    recommendation: "동시대미술을 폭넓게 보고 싶은 모임에 적합합니다. 유영국전과 같은 날 묶어 보기 좋습니다.",
    notes: "서소문본관 주차 협소. 연계 프로그램 일정은 별도 확인.",
    ratingReason: "여러 작가와 매체를 한 번에 볼 수 있어 단체 관람 후 토론에 좋음.",
    sourceLabel: "SeMA 공식 전시 상세·보도자료",
    verificationNote: "SeMA 공식 상세에서 전시명, 장소, 기간, 관람료, 도슨트 15:00 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010005",
    recommendedRank: 8,
    verified: true,
    status: "공유완료",
    region: "노원/도봉/강북",
    type: "전시",
    title: "《권병준: 내 마음속에 너는》",
    genre: "미디어아트, 사운드, 어린이+",
    startDate: "2026-06-11",
    endDate: "2027-05-16",
    visitDate: "2026-08-15",
    time: "화-목 10:00-20:00, 금 10:00-21:00, 토/일/공휴일 10:00-19:00, 월 휴관",
    venue: "서울시립 북서울미술관",
    address: "서울 노원구 동일로 1238",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "5분 250원(시간당 3,000원), 월요일 무료. 요일제 운영",
    docent: "매일 정기 도슨트와 어린이 해설·워크숍 운영",
    docentTime: "매일 14:30(월요일·1월 1일·설·추석 연휴 제외). 어린이 해설·워크숍은 프로그램별 회차 확인",
    difficulty: "가볍게",
    rating: "4",
    owner: "TOP 8",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1538201",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EB%B6%81%EC%84%9C%EC%9A%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "미디어 아티스트 권병준 개인전. 포옹을 시각화한 대형 로봇 작품과 AI 기반 사운드 작품을 중심으로 구성됩니다.",
    recommendation: "가족 동반 회원이나 미디어아트에 관심 있는 모임원에게 좋습니다.",
    notes: "북서울미술관은 주차 가능하지만 요일별 5부제 적용.",
    ratingReason: "체험성, 사운드, 어린이 친화 프로그램의 장점이 뚜렷함.",
    sourceLabel: "SeMA 공식 전시 상세·북서울미술관 방문안내",
    verificationNote: "SeMA 공식 상세에서 전시명, 기간, 관람료, 매일 14:30 도슨트 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010006",
    recommendedRank: 9,
    verified: true,
    status: "공유완료",
    region: "노원/도봉/강북",
    type: "전시",
    title: "2026 타이틀 매치 《오인환 vs. 장서영: 휴먼 에러》",
    genre: "영상, 사진, 설치, 동시대미술",
    startDate: "2026-08-13",
    endDate: "2026-10-25",
    visitDate: "2026-09-12",
    time: "화-목 10:00-20:00, 금 10:00-21:00, 토·일·공휴일 10:00-19:00, 월요일·1월 1일 휴관. 관람 종료 1시간 전 입장 마감",
    venue: "서울시립 북서울미술관 전시실 1~4",
    address: "서울 노원구 동일로 1238",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "5분 250원(시간당 3,000원), 월요일 무료. 요일제 운영",
    docent: "정기 도슨트 운영",
    docentTime: "2026-08-14~10-25 매일 11:00, 15:00. 추석 연휴(9월 24~26일) 미운영",
    difficulty: "긴 관람",
    rating: "5",
    owner: "TOP 9",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1563285",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EB%B6%81%EC%84%9C%EC%9A%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "오인환과 장서영의 영상·사진·설치 23점으로 기술 시대의 인간적 오류와 창작의 본질을 묻는 북서울미술관 대표 연례전입니다.",
    recommendation: "8월 13일 개막해 9월 내내 관람할 수 있고, 하루 두 차례 도슨트가 있어 모임 대화와 일정 조율에 모두 좋습니다.",
    notes: "추석 연휴인 9월 24~26일에는 도슨트를 운영하지 않습니다. 주차장은 요일제를 적용하므로 차량 번호를 확인하세요.",
    ratingReason: "전시 규모, 명확한 2회 도슨트, 8~9월 일정 안정성과 동시대적 주제가 강점.",
    sourceLabel: "SeMA 공식 전시 상세·북서울미술관 방문안내",
    verificationNote: "공식 상세에서 기간, 운영시간, 무료, 작품 23점, 매일 11:00·15:00 도슨트와 추석 미운영 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010007",
    recommendedRank: 10,
    verified: true,
    status: "공유완료",
    region: "관악/동작/금천",
    type: "전시",
    title: "2026년 한국 대표 조각가전 《조숙진: 지나가는 자리》",
    genre: "조각, 한국 현대미술",
    startDate: "2026-07-29",
    endDate: "2026-11-15",
    visitDate: "2026-08-22",
    time: "화-금 10:00-20:00, 토/일/공휴일 10:00-18:00, 월 휴관",
    venue: "서울시립 남서울미술관",
    address: "서울 관악구 남부순환로 2076",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "불가",
    parkingFee: "미술관 내 주차 시설 없음. 인근 사당 공영주차장 등 외부 주차장 요금 별도 확인",
    docent: "정기 도슨트 운영",
    docentTime: "전시 기간 중 매일 13:00. 개막일·추석 연휴 미운영",
    difficulty: "가볍게",
    rating: "4",
    owner: "TOP 10",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1556711",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EB%82%A8%EC%84%9C%EC%9A%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "남서울미술관에서 열리는 한국 대표 조각가전으로, 11월까지 이어져 8~9월 모임 후보로 안정적입니다.",
    recommendation: "사당역 접근성이 좋아 모임 동선이 편하고, 조각 중심 전시라 회화 전시와 다른 결을 줍니다.",
    notes: "미술관 내 주차 불가. 인근 사당 공영주차장 이용.",
    ratingReason: "8~9월 일정 안정성, 교통 접근성, 조각 장르의 차별성이 좋음.",
    sourceLabel: "SeMA 공식 전시 상세·남서울미술관 방문안내",
    verificationNote: "SeMA 공식 상세에서 전시명, 기간, 관람료, 매일 13:00 도슨트 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010008",
    recommendedRank: 11,
    verified: true,
    status: "공유완료",
    region: "강서/양천",
    type: "전시",
    title: "《킹 오브 킹스 전시: The Greatest Love》",
    genre: "몰입형 전시, 인터랙티브 미디어, 기독교 문화",
    startDate: "2025-10-31",
    endDate: "2026-08-31",
    visitDate: "2026-08-15",
    time: "월-목 10:30-20:00, 금-일·공휴일 10:30-20:30, 연중무휴. 관람 종료 60분 전 입장 마감(관람 약 60분)",
    venue: "롯데몰 김포공항점 1층 전시홀",
    address: "서울 강서구 하늘길 38",
    price: 0,
    priceType: "성인 22,000원, 청소년 20,000원, 어린이 17,000원",
    discount: "공식 카드·통신사 제휴 할인 공지 없음. 네이버 예약 강서구·김포시 주민 10% 특가(15,300~19,800원, 증빙·적용 조건 확인), 네이버페이 결제 시 최대 5% 적립 안내",
    parking: "가능",
    parkingFee: "티켓 구매 시 3시간 무료, 이후 30분당 1,000원. 롯데몰 김포공항점 지하주차장 K/L/M/N 구역 권장",
    docent: "공식 홈페이지·예매 상세에 정기 도슨트 공지 없음",
    docentTime: "별도 정기 도슨트 회차 공지 없음",
    difficulty: "사전예약",
    rating: "5",
    owner: "TOP 11",
    infoUrl: "https://www.kingofkings-exhibition.com/",
    mainUrl: "https://booking.naver.com/booking/5/bizes/1500781",
    mapUrl: "https://map.kakao.com/?q=%ED%82%B9%20%EC%98%A4%EB%B8%8C%20%ED%82%B9%EC%8A%A4%20%EC%A0%84%EC%8B%9C%20%EB%A1%AF%EB%8D%B0%EB%AA%B0%20%EA%B9%80%ED%8F%AC%EA%B3%B5%ED%95%AD%EC%A0%90",
    summary: "찰스 디킨스 원작과 애니메이션 《킹 오브 킹스》의 사랑 이야기를 대형 스크린, 공간음향, VFX와 개인화 인터랙션으로 체험하는 몰입형 전시입니다.",
    recommendation: "41교구 전시·박물관 동아리의 성격과 잘 맞고, 세대가 함께 사랑의 의미를 나누기 좋은 참여형 콘텐츠라 우선 추천합니다.",
    notes: "전 연령 관람 가능하며 만 12세 이하는 보호자 동반이 필요합니다. 20명 이상 단체는 전시 콜센터에 별도 문의하세요.",
    ratingReason: "모임 주제 적합성, 체험성, 김포공항역 접근성, 전 연령 관람 가능성을 높게 평가.",
    sourceLabel: "킹 오브 킹스 전시 공식 홈페이지·네이버 공식 예약",
    verificationNote: "공식 홈페이지와 예약 상세에서 기간, 연중무휴, 운영시간, 관람료, 주민 특가, 주차 3시간 무료·추가요금 확인; 정기 도슨트 공지 없음",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010009",
    recommendedRank: 12,
    verified: true,
    status: "공유완료",
    region: "강남/서초",
    type: "전시",
    title: "컨템포러리 아티스트 프로젝트 《이완 - 나는 쓴다》",
    genre: "현대서예, 설치, 동시대미술",
    startDate: "2026-07-17",
    endDate: "2026-09-27",
    visitDate: "2026-09-05",
    time: "10:00-19:00, 매주 월요일 휴관. 입장 마감 18:30",
    venue: "예술의전당 서울서예박물관 제3전시실",
    address: "서울 서초구 남부순환로 2406",
    price: 0,
    priceType: "성인 5,000원, 어린이·청소년 2,500원",
    discount: "카드·통신사 제휴 할인 공지 없음. 같은 기간 예술의전당 공연·전시 티켓 제시 시 50% 할인",
    parking: "가능",
    parkingFee: "전시 관객 3시간 평일 4,000원, 주말·공휴일 6,000원. 초과 시 일반요금 10분당 1,000원(주말·공휴일 1,500원)",
    docent: "공식 상세에 정기 도슨트 공지 없음",
    docentTime: "별도 정기 도슨트 회차 공지 없음",
    difficulty: "가볍게",
    rating: "4",
    owner: "TOP 12",
    infoUrl: "https://www.sac.or.kr/site/main/show/show_view?SN=76454",
    mapUrl: "https://map.kakao.com/?q=%EC%98%88%EC%88%A0%EC%9D%98%EC%A0%84%EB%8B%B9%20%EC%84%9C%EC%9A%B8%EC%84%9C%EC%98%88%EB%B0%95%EB%AC%BC%EA%B4%80",
    summary: "정통 서예를 설치와 다양한 매체로 확장해 온 이완의 작품 세계를 ‘오늘날 서예를 동시대미술로 볼 수 있는가’라는 질문과 함께 살펴봅니다.",
    recommendation: "부담 없는 관람료와 9월 말까지의 안정적인 일정이 장점이며, 예술의전당 공연과 같은 날 묶으면 티켓 할인도 받을 수 있습니다.",
    notes: "무료 전시·공연 관객은 예술의전당 주차 정액 할인이 아닌 일반요금이 적용될 수 있으므로 정산 전 확인하세요.",
    ratingReason: "합리적인 가격, 공연 연계 50% 할인, 현대서예라는 장르 차별성과 9월 일정이 강점.",
    sourceLabel: "예술의전당 공식 전시 상세·보도자료·주차 안내",
    verificationNote: "공식 상세와 보도자료에서 기간, 운영시간, 관람료, 연계 티켓 50% 할인 확인; 공식 주차 안내에서 전시 관객 정액요금 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010010",
    recommendedRank: 13,
    verified: true,
    status: "공유완료",
    region: "종로/중구",
    type: "전시",
    title: "가나아트컬렉션 《기술의 저변: 경계에 선 장면들》",
    genre: "한국 현대미술, 기술, 산업사회",
    startDate: "2026-04-16",
    endDate: "2026-11-22",
    visitDate: "2026-08-29",
    time: "화-목 10:00-20:00, 금 10:00-21:00, 토·일·공휴일 10:00-19:00, 월요일·1월 1일 휴관. 관람 종료 1시간 전 입장 마감",
    venue: "서울시립미술관 서소문본관 2층",
    address: "서울 중구 덕수궁길 61",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "평일 5분 400원(시간당 4,800원), 토·공휴일 5분 300원(시간당 3,600원). 주차장 협소·요일제 운영",
    docent: "천경자컬렉션과 통합 정기 전시해설 운영",
    docentTime: "매일 14:00. 매주 월요일·추석 연휴(9월 24~26일) 미운영, 8월 17일 등 공식 추가 운영일 포함",
    difficulty: "가볍게",
    rating: "4",
    owner: "TOP 13",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1509709",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%EB%AF%B8%EC%88%A0%EA%B4%80%20%EC%84%9C%EC%86%8C%EB%AC%B8%EB%B3%B8%EA%B4%80",
    summary: "1970~90년대 산업화·도시화와 매체 환경 변화 속 한국 사회의 풍경을 가나아트컬렉션과 SeMA 소장품 26점으로 살펴보는 전시입니다.",
    recommendation: "서소문본관의 다른 전시와 묶어 보기 좋고, 매일 14시 통합 해설로 작품의 사회적 맥락을 함께 이해할 수 있습니다.",
    notes: "도슨트는 2층 천경자컬렉션 전시실 입구에서 시작. 주차장이 협소해 대중교통 우선 권장.",
    ratingReason: "무료 관람, 정확한 매일 해설, 한국 사회사와 연결되는 대화성이 강점.",
    sourceLabel: "SeMA 공식 전시 상세·서소문본관 방문안내",
    verificationNote: "공식 상세에서 기간, 운영시간, 무료, 작품 26점, 매일 14:00 통합 도슨트 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010101",
    recommendedRank: 101,
    verified: true,
    status: "공유완료",
    region: "수원/경기",
    type: "전시",
    title: "국립농업박물관 《손끝에서 핀 나날의 꽃》",
    genre: "소장품전, 공예, 생활문화",
    startDate: "2026-06-09",
    endDate: "2026-10-05",
    visitDate: "2026-08-03",
    time: "10:00-18:00(17:00 입장 마감), 매주 월요일 휴관. 10월 5일은 대체공휴일로 개관",
    venue: "국립농업박물관",
    address: "경기도 수원시 권선구 수인로 154",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "무료. 관람객 주차장 206대, 운영시간 이후 출입문 폐쇄",
    docent: "공식 전시 상세에 별도 정기 도슨트 공지 없음",
    docentTime: "별도 정기 도슨트 회차 공지 없음. 박물관 상설 전시해설 예약과는 별도",
    difficulty: "가볍게",
    rating: "4",
    owner: "수원 추천 1",
    infoUrl: "https://namuk.or.kr/bbs/kr/168/1849/artclView.do",
    mainUrl: "https://namuk.or.kr/kr/200/subview.do",
    mapUrl: "https://map.kakao.com/?q=%EA%B5%AD%EB%A6%BD%EB%86%8D%EC%97%85%EB%B0%95%EB%AC%BC%EA%B4%80%20%EC%88%98%EC%9B%90",
    summary: "꽃이 자연에서 삶, 문화, 산업으로 이어지는 과정을 회화와 공예 등 소장품으로 살펴보는 전시입니다.",
    recommendation: "무료 전시이고 기간이 길어 수원권 회원과 가볍게 모이기 좋습니다. 꽃과 생활문화 주제라 대화 소재도 편안합니다.",
    notes: "국립농업박물관 공식 전시·오시는 길 안내 기준. 전시해설 예약 여부는 방문 전 확인하세요.",
    ratingReason: "무료, 긴 전시 기간, 생활문화 주제의 접근성이 좋음.",
    sourceLabel: "국립농업박물관 공식 전시 공지",
    verificationNote: "공식 기획전시 목록·상세·리플릿에서 전시명, 기간, 운영시간, 장소, 관람료 확인; 공식 오시는 길에서 무료 주차와 206대 확인",
    updatedAt: "2026-08-12",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010102",
    recommendedRank: 102,
    verified: true,
    status: "공유완료",
    region: "수원/경기",
    type: "전시",
    title: "미디어·아트 융합 전시 《DREAM LIGHT》",
    genre: "미디어아트, 레이저, 공간음향",
    startDate: "2025-09-26",
    endDate: "",
    visitDate: "2026-08-10",
    time: "화-토 09:30-21:30(입장 마감 21:00), 일 09:30-17:30(입장 마감 17:00), 월요일·법정공휴일 휴관",
    venue: "수원시미디어센터",
    address: "경기도 수원시 팔달구 창룡대로 64",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "불가",
    parkingFee: "센터 내 주차장 없음. 인근 공영주차장 이용(별도 주차지원 없음)",
    docent: "공식 전시 페이지에 정기 도슨트 공지 없음",
    docentTime: "별도 정기 도슨트 회차 공지 없음",
    difficulty: "가볍게",
    rating: "4",
    owner: "수원 추천 2",
    infoUrl: "https://www.swcf.or.kr/?p=396",
    mapUrl: "https://map.kakao.com/?q=%EC%88%98%EC%9B%90%EC%8B%9C%EB%AF%B8%EB%94%94%EC%96%B4%EC%84%BC%ED%84%B0",
    summary: "레이저, 미디어아트, 공간 음향이 어우러진 상설 미디어 전시입니다. 수원의 역사와 빛의 이미지를 감각적으로 볼 수 있습니다.",
    recommendation: "저녁 운영 시간이 길어 평일 퇴근 후 모임 후보로 좋습니다. 사진·영상 촬영은 가능하지만 삼각대와 플래시는 사용할 수 없습니다.",
    notes: "내부가 어두워 이동 시 주의 필요. 사진·영상 촬영은 가능하지만 삼각대와 플래시는 사용할 수 없습니다.",
    ratingReason: "야간 시간대 활용성, 미디어아트 체험성, 수원 지역성이 좋음.",
    sourceLabel: "수원문화재단 Dream Light 안내",
    verificationNote: "수원문화재단·수원시미디어센터 공식 페이지에서 상설운영, 09:30 개장, 주소, 주차 불가 확인",
    updatedAt: "2026-08-08",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010103",
    recommendedRank: 103,
    verified: true,
    status: "공유완료",
    region: "수원/경기",
    type: "전시",
    title: "수원전통문화관 《혜경궁홍씨의 봉수당 진찬연》",
    genre: "전통문화, 상설전시, 역사",
    startDate: "2024-12-24",
    endDate: "2026-12-31",
    visitDate: "2026-08-17",
    time: "화-토 10:00-17:00, 월요일·법정공휴일 휴관",
    venue: "수원전통문화관 식생활체험관 상설전시실",
    address: "경기도 수원시 팔달구 정조로 893(장안동)",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "불가",
    parkingFee: "전시관 주차공간 없음. 인근 공영주차장 요금 별도 확인",
    docent: "공식 전시 상세에 별도 정기 도슨트 공지 없음",
    docentTime: "별도 정규 도슨트 회차 공지 없음",
    difficulty: "가볍게",
    rating: "4",
    owner: "수원 추천 3",
    infoUrl: "https://www.swcf.or.kr/?cate=&curMonth=1&curYear=2026&idx=2776&listUrl=29&p=29_view",
    mapUrl: "https://map.kakao.com/?q=%EC%88%98%EC%9B%90%EC%A0%84%ED%86%B5%EB%AC%B8%ED%99%94%EA%B4%80%20%EC%8B%9D%EC%83%9D%ED%99%9C%EC%B2%B4%ED%97%98%EA%B4%80",
    summary: "1795년 을묘원행 당시 봉수당 진찬연에서 혜경궁 홍씨에게 올린 반과상을 재현한 전통문화 상설전시입니다.",
    recommendation: "수원화성·행궁권 산책과 함께 묶기 좋습니다. 짧고 무료라 부담 없이 공유할 수 있는 보조 후보입니다.",
    notes: "전시관 주차공간 없음. 자차 이용 시 장안동 공영주차장 등 인근 유료 공영주차장을 이용하세요.",
    ratingReason: "무료, 역사성, 행궁권 동선 장점이 있으나 규모는 비교적 작을 수 있음.",
    sourceLabel: "수원문화재단 행사정보",
    verificationNote: "공식 상세에서 기간, 운영시간, 장소, 관람료, 주차 불가 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010301",
    recommendedRank: 301,
    verified: true,
    status: "공유완료",
    region: "인천",
    type: "전시",
    title: "2026 기획특별전 《조선을 밝힌 인천의 지성들》",
    genre: "고문헌, 조선후기, 지역사",
    startDate: "2026-08-20",
    endDate: "2026-09-27",
    visitDate: "2026-09-19",
    time: "화-일 09:00-18:00(17:30 입장 마감), 월요일·1월 1일 휴관. 공휴일인 월요일은 개관",
    venue: "인천시립박물관 2층 기획전시실",
    address: "인천광역시 연수구 청량로160번길 26",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "무료. 24시간 운영, 34면으로 주차공간이 협소함",
    docent: "자원봉사자 전시해설 운영",
    docentTime: "10:00-17:00 중 희망 시 안내데스크 문의. 정해진 회차형 도슨트는 공식 공지 없음",
    difficulty: "가볍게",
    rating: "5",
    owner: "인천 추천 1",
    infoUrl: "https://www.incheon.go.kr/museum/MU010209/3067541",
    mapUrl: "https://map.kakao.com/?q=%EC%9D%B8%EC%B2%9C%EC%8B%9C%EB%A6%BD%EB%B0%95%EB%AC%BC%EA%B4%80",
    summary: "병와 이형상, 소남 윤동규, 하곡 정제두 등 조선후기 인천의 지성을 이끈 인물들을 고문헌 100여 점으로 조명하는 기획특별전입니다.",
    recommendation: "8월 20일 개막해 9월 말까지 이어지는 인천 대표 역사전으로, 지역사와 인문학에 관심 있는 모임에 좋습니다.",
    notes: "주차면이 34면으로 적어 주말에는 대중교통을 우선 권장합니다. 해설은 고정 회차가 아니라 안내데스크에 요청하는 방식입니다.",
    ratingReason: "인천 지역성, 고문헌 100여 점의 규모, 무료 관람과 8~9월 일정 안정성이 강점.",
    sourceLabel: "인천시립박물관 공식 예정전시·관람·주차 안내",
    verificationNote: "공식 예정전시에서 기간, 장소, 주제와 자료 규모 확인; 공식 관람·통합예약 페이지에서 운영시간, 무료, 해설 방식, 무료 주차 34면 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010302",
    recommendedRank: 302,
    verified: true,
    status: "공유완료",
    region: "인천",
    type: "전시",
    title: "《바윗돌에 숨은 비밀, 인천 고인돌 이야기》",
    genre: "고고학, 어린이 체험, 역사",
    startDate: "2026-07-14",
    endDate: "2027-05-16",
    visitDate: "2026-08-01",
    time: "화-일 09:00-18:00, 수요일 20:00까지 연장, 월요일·1월 1일 휴관(월요일이 공휴일이면 개관)",
    venue: "검단선사박물관 2층 특별전시실",
    address: "인천광역시 검단구 고산후로121번길 7",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "무료. 건물 옆 1면으로 매우 협소해 만차 시 인근 주차장 이용",
    docent: "정기 전시해설 운영",
    docentTime: "개관일 10:30, 13:30, 15:00. 정규 시간 외 요청 가능, 단체는 사전 신청",
    difficulty: "가볍게",
    rating: "5",
    owner: "인천 추천 2",
    infoUrl: "https://www.incheon.go.kr/culture/CU050101/view?nttNo=2045983",
    mapUrl: "https://map.kakao.com/?q=%EA%B2%80%EB%8B%A8%EC%84%A0%EC%82%AC%EB%B0%95%EB%AC%BC%EA%B4%80",
    summary: "인천의 고인돌을 어린이 눈높이의 유물, 이야기, 체험으로 살펴보는 특별전입니다.",
    recommendation: "전시 기간이 길고 무료라 가족 회원과 함께 보기 좋으며, 인천의 지역사를 대화 주제로 삼기 좋습니다.",
    notes: "인천광역시 공식 문화행사 안내 기준. 수요일은 오후 8시까지 연장 운영합니다.",
    ratingReason: "무료 관람, 긴 전시 기간, 어린이·성인 모두 접근하기 쉬운 지역사 주제.",
    sourceLabel: "인천광역시·검단선사박물관 공식 전시 안내",
    verificationNote: "공식 상세에서 기간, 운영시간, 휴관일, 장소, 관람료 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010303",
    recommendedRank: 303,
    verified: true,
    status: "공유완료",
    region: "인천",
    type: "전시",
    title: "검단선사박물관 작은전시 《뼈로 만든 장신구》",
    genre: "고고학, 유물, 장신구",
    startDate: "2026-06-09",
    endDate: "2026-09-06",
    visitDate: "2026-08-08",
    time: "화-일 09:00-18:00, 수요일 20:00까지 연장, 월요일·1월 1일 휴관(월요일이 공휴일이면 개관)",
    venue: "검단선사박물관 1층 상설전시실",
    address: "인천광역시 검단구 고산후로121번길 7",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "무료. 건물 옆 1면으로 매우 협소해 만차 시 인근 주차장 이용",
    docent: "박물관 정기 전시해설 운영",
    docentTime: "개관일 10:30, 13:30, 15:00. 작은전시 해설 포함 여부는 현장 확인, 단체는 사전 신청",
    difficulty: "가볍게",
    rating: "4",
    owner: "인천 추천 3",
    infoUrl: "https://www.incheon.go.kr/museum/MU060103/3076040",
    mapUrl: "https://map.kakao.com/?q=%EA%B2%80%EB%8B%A8%EC%84%A0%EC%82%AC%EB%B0%95%EB%AC%BC%EA%B4%80",
    summary: "운남동 패총에서 나온 뼈와 이빨 재질 장신구 6점을 통해 선사시대 사람들의 꾸밈 문화를 살펴봅니다.",
    recommendation: "고인돌 특별전과 같은 박물관에서 함께 볼 수 있어 한 번의 방문으로 두 전시를 비교하기 좋습니다.",
    notes: "작은전시 공식 상세와 박물관 공통 관람시간 기준. 방문 전 휴관일을 재확인하세요.",
    ratingReason: "무료이고 다른 특별전과 연계 관람하기 좋지만 전시 규모가 작음.",
    sourceLabel: "검단선사박물관 공식 전시 안내",
    verificationNote: "공식 상세에서 전시명, 기간, 장소, 출품 내용 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010210",
    recommendedRank: 11,
    verified: true,
    status: "공유완료",
    region: "종로/중구",
    type: "공연",
    title: "서울시합창단 명작시리즈 Ⅲ 《한여름의 메시아》",
    genre: "합창, 클래식, 해설 음악회",
    startDate: "2026-08-27",
    endDate: "2026-08-28",
    visitDate: "2026-08-27",
    time: "2026-08-27·28 19:30 (120분, 인터미션 15분 포함)",
    venue: "세종문화회관 세종체임버홀",
    address: "서울 종로구 세종대로 175",
    price: 0,
    priceType: "R석 40,000원, S석 30,000원",
    discount: "카드·통신사 제휴 할인 공지 없음. 세종S멤버십 20~30%, 문화릴레이 20%, 청소년·임신부·다둥이 30%, 장애인·국가유공자·문화누리카드 50%(좌석·매수·증빙 조건 확인)",
    parking: "가능(세종로 공영주차장)",
    parkingFee: "공연 티켓 제시 시 4시간 8,000원, 이후 5분당 430원. 평일 승용차 5부제 시행",
    docent: "공연 중 해설 진행",
    docentTime: "2026-08-27·28 19:30 공연에 서울시합창단 이영만 단장 해설 포함(별도 도슨트 회차 없음)",
    difficulty: "사전예약",
    rating: "5",
    owner: "서울 음악 1",
    infoUrl: "https://www.sejongpac.or.kr/portal/performance/performance/performTicket.do?menuNo=200320&performIdx=36784",
    mapUrl: "https://map.kakao.com/?q=%EC%84%B8%EC%A2%85%EB%AC%B8%ED%99%94%ED%9A%8C%EA%B4%80%20%EC%84%B8%EC%A2%85%EC%B2%B4%EC%9E%84%EB%B2%84%ED%99%80",
    summary: "헨델의 오라토리오 《메시아》를 서울시합창단의 합창과 이영만 단장의 해설로 만나는 여름 기획공연입니다.",
    recommendation: "교회 문화 모임의 성격과 잘 맞고, 작품 해설이 포함돼 합창 입문자도 함께 감상하기 좋은 8월 서울 공연입니다.",
    notes: "7세 이상 관람가. 할인 증빙을 지참해야 하며, 평일 주차 5부제 때문에 차량 끝자리를 미리 확인하세요.",
    ratingReason: "모임 주제 적합성, 해설 구성, 합리적인 가격과 2회 공연 일정이 강점.",
    sourceLabel: "세종문화회관 공식 공연 상세·주차 안내",
    verificationNote: "공식 상세에서 8월 27·28일 19:30, 120분, 좌석별 관람료, 할인과 주차요금을 확인",
    updatedAt: "2026-08-05",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010202",
    recommendedRank: 104,
    status: "공유완료",
    region: "성남/경기",
    type: "공연",
    title: "2026 성남아트센터 마티네 콘서트 - 8월 《독일, 음악의 숲》",
    genre: "클래식, 해설 음악회",
    startDate: "2026-08-20",
    endDate: "2026-08-20",
    visitDate: "2026-08-20",
    time: "2026-08-20 11:00 (100분, 인터미션 10분 포함)",
    venue: "성남아트센터 콘서트홀",
    address: "경기도 성남시 분당구 성남대로 808",
    price: 0,
    priceType: "전석 25,000원",
    discount: "카드·통신사 제휴 할인 공지 없음. 장애인·국가유공자 50%, 예술인패스·성남 다자녀가정·20인 이상 단체 20%(증빙 필수)",
    parking: "가능",
    parkingFee: "공연 티켓 제시 시 5시간 2,000원. 이후 일반 초과요금 적용",
    docent: "공연 중 해설 진행",
    docentTime: "2026-08-20 11:00 공연 전체에 한석준 해설 포함(별도 도슨트 회차 없음)",
    difficulty: "사전예약",
    rating: "4",
    owner: "경기 음악 1",
    infoUrl: "https://www.snart.or.kr/main/prex/prefer/view.do?prfr_exhb_sn=100138",
    mainUrl: "https://www.snart.or.kr/",
    mapUrl: "https://map.kakao.com/?q=%EC%84%B1%EB%82%A8%EC%95%84%ED%8A%B8%EC%84%BC%ED%84%B0%20%EC%BD%98%EC%84%9C%ED%8A%B8%ED%99%80",
    summary: "아나운서 한석준의 해설과 함께 독일 클래식 음악을 듣는 성남아트센터의 오전 기획공연입니다.",
    recommendation: "낮 모임을 선호하거나 클래식 입문 해설이 필요한 회원에게 좋은 경기권 음악 후보입니다.",
    notes: "미취학 아동 입장 불가. 할인 증빙은 현장 지참이 필요합니다.",
    ratingReason: "합리적인 가격, 해설 구성, 경기 남부 접근성, 공식 할인 정보가 명확함.",
    sourceLabel: "성남문화재단 공식 공연 상세·주차 안내",
    verificationNote: "공식 상세에서 일시, 러닝타임, 관람료, 할인과 공연 관람객 주차요금 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010206",
    recommendedRank: 105,
    status: "공유완료",
    region: "성남/경기",
    type: "공연",
    title: "2026 성남아트센터 오후의 콘서트 - 9월 《탱고, 한낮의 열정》",
    genre: "탱고, 월드뮤직, 음악과 춤",
    startDate: "2026-09-02",
    endDate: "2026-09-02",
    visitDate: "2026-09-02",
    time: "2026-09-02 15:00 (90분, 인터미션 10분 포함)",
    venue: "성남아트센터 앙상블시어터",
    address: "경기도 성남시 분당구 성남대로 808",
    price: 0,
    priceType: "전석 20,000원",
    discount: "카드·통신사 제휴 할인 공지 없음. 장애인·국가유공자 50%, 청년문화예술패스·문화누리카드·성남 다자녀가정 20%, 10인 이상 단체 30%(증빙 필수)",
    parking: "가능",
    parkingFee: "공연 티켓 제시 시 5시간 2,000원. 이후 일반 초과요금 적용",
    docent: "공연: 도슨트 적용 대상 아님",
    docentTime: "별도 해설 프로그램 공지 없음",
    difficulty: "사전예약",
    rating: "5",
    owner: "경기 음악 2",
    infoUrl: "https://www.snart.or.kr/main/prex/prefer/view.do?prfr_exhb_sn=100118",
    mainUrl: "https://www.snart.or.kr/",
    mapUrl: "https://map.kakao.com/?q=%EC%84%B1%EB%82%A8%EC%95%84%ED%8A%B8%EC%84%BC%ED%84%B0%20%EC%95%99%EC%83%81%EB%B8%94%EC%8B%9C%EC%96%B4%ED%84%B0",
    summary: "아르헨티나 정통 탱고부터 아스토르 피아졸라의 누에보 탱고까지 음악과 춤으로 만나는 성남아트센터 기획공연입니다.",
    recommendation: "평일 오후 3시 공연이고 10인 이상 단체 할인이 있어 경기권 낮 모임으로 구성하기 좋습니다.",
    notes: "미취학 아동 입장 불가. 공연 일부 구간에 연무 효과를 사용하며 할인 증빙을 현장에 지참해야 합니다.",
    ratingReason: "음악과 춤의 대중성, 전석 2만원, 10인 이상 단체 30% 할인과 9월 초 일정이 강점.",
    sourceLabel: "성남문화재단 공식 공연 상세·주차 안내",
    verificationNote: "공식 상세에서 9월 2일 15:00, 90분, 관람료, 할인과 연무 안내 확인; 공연장 주차 안내에서 관객 요금 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010203",
    recommendedRank: 12,
    status: "공유완료",
    region: "강남/서초",
    type: "공연",
    title: "한화생명과 함께하는 예술의전당 11시 콘서트(9월)",
    genre: "마티네 클래식, 오케스트라",
    startDate: "2026-09-10",
    endDate: "2026-09-10",
    visitDate: "2026-09-10",
    time: "2026-09-10 11:00 (100분)",
    venue: "예술의전당 콘서트홀",
    address: "서울 서초구 남부순환로 2406",
    price: 0,
    priceType: "일반석 30,000원, 3층석 15,000원",
    discount: "카드·통신사 제휴 할인 공지 없음. 싹틔우미·노블 40%, 후원 25%, 골드 20%, 블루·그린·문화릴레이 10%, 장애인·국가유공자 등 50%(좌석·매수·증빙 조건 확인)",
    parking: "가능",
    parkingFee: "공연 관객 5시간 평일 6,000원, 주말·공휴일 9,000원. 초과 시 일반요금 10분당 1,000원(주말·공휴일 1,500원)",
    docent: "공연: 도슨트 적용 대상 아님",
    docentTime: "2026-08-15 공식 상세 기준 별도 해설자·도슨트 회차 미표기",
    difficulty: "사전예약",
    rating: "5",
    owner: "서울 음악 2",
    infoUrl: "https://www.sac.or.kr/site/main/show/show_view?SN=79803",
    mainUrl: "https://www.sac.or.kr/",
    mapUrl: "https://map.kakao.com/?q=%EC%98%88%EC%88%A0%EC%9D%98%EC%A0%84%EB%8B%B9%20%EC%BD%98%EC%84%9C%ED%8A%B8%ED%99%80",
    summary: "송안훈 지휘, 윤동환·차준호 협연, 프라임필하모닉오케스트라 연주로 슈트라우스 2세·생상스·베토벤·차이콥스키를 듣습니다.",
    recommendation: "평일 오전 마티네 공연이고 3층석은 15,000원이라 가격 부담이 낮아 클래식 입문자와 함께 관람하기 좋습니다.",
    notes: "초등학생 이상 관람가. 3층석은 복지 할인을 제외한 대부분 할인에서 제외되며, 할인 증빙을 현장에 지참해야 합니다.",
    ratingReason: "합리적인 가격, 폭넓은 프로그램과 9월 모임 일정 적합성이 강점.",
    sourceLabel: "예술의전당 공식 공연 상세·주차 안내",
    verificationNote: "공식 상세에서 일시, 러닝타임, 좌석별 관람료, 출연·프로그램과 할인 확인; 기존 강석우 해설 표기는 현재 상세에 없어 제거; 공식 주차 안내에서 요금 확인",
    updatedAt: "2026-08-15",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010207",
    recommendedRank: 13,
    status: "공유완료",
    region: "강남/서초",
    type: "공연",
    title: "뮤지컬 《저항: 찬송이 된 사람들》",
    genre: "창작뮤지컬, 역사, 기독교",
    startDate: "2026-04-10",
    endDate: "2026-10-31",
    visitDate: "2026-08-25",
    time: "월·화·금 19:30, 수 14:00, 토·공휴일 14:00·18:00, 목·일 공연 없음. 남은 8/25 도슨트 특별 회차는 15:00 공연",
    venue: "광야아트센터",
    address: "서울특별시 강남구 선릉로 806, 킹콩빌딩 3층",
    price: 0,
    priceType: "일반석 50,000원, 발코니석·시야/소리제한석 35,000원",
    discount: "카드·통신사 제휴 할인 공지 없음. 교회 게시판 홍보 패키지는 포스터 부착 후 QR 증빙 시 일반석 50% 예매권 2매 제공(신청·재고 조건 확인); 시야/소리제한석 할인 불가",
    parking: "가능",
    parkingFee: "광야아트센터 직영 주차장은 없음. 외부 업체 운영 킹콩빌딩 주차장 10분당 1,000원 또는 인근 유료 주차장 이용",
    docent: "김관영 목사의 15분 공연 해설 운영",
    docentTime: "남은 회차 2026-08-25 14:45 도슨트 시작, 15:00 공연 시작(8/4·11 회차 종료, 8/18 미운영)",
    difficulty: "사전예약",
    rating: "5",
    owner: "서울 음악 3",
    infoUrl: "https://stgwangya-mo.imweb.me/Resistance",
    mainUrl: "https://stgwangya-mo.imweb.me/88",
    mapUrl: "https://map.kakao.com/?q=%EA%B4%91%EC%95%BC%EC%95%84%ED%8A%B8%EC%84%BC%ED%84%B0",
    summary: "18세기 프랑스에서 개종을 거부하고 38년간 투옥된 위그노 여성 마리 뒤랑과 공동체의 신앙·자유를 다룬 창작뮤지컬입니다.",
    recommendation: "교회 모임의 성격과 잘 맞는 작품이며, 남은 8월 특별 회차인 8/25에는 공연 15분 전 해설이 붙어 작품의 역사적 배경을 이해하며 관람하기 좋습니다.",
    notes: "약 115분(인터미션 없음), 초등학생 이상 관람가. 공연장 직영 주차장이 없고 주변 교통이 혼잡해 대중교통 이용 권장.",
    ratingReason: "모임 주제 적합성, 창작진과 역사 소재, 남은 8/25 도슨트 특별 회차, 장기 공연 일정이 강점.",
    sourceLabel: "광야아트센터 공식 공연 상세·카카오 공식채널·공연장 FAQ",
    verificationNote: "공식 공연 상세에서 기간·시간·가격·관람등급 확인, 공식채널에서 8월 도슨트 중 남은 8/25 회차와 홍보 패키지 할인 확인, 공연장 FAQ에서 주차요금 확인",
    updatedAt: "2026-08-12",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010209",
    recommendedRank: 14,
    verified: true,
    status: "공유완료",
    region: "강남/서초",
    type: "공연",
    title: "강남심포니오케스트라 제118회 정기연주회",
    genre: "클래식, 오케스트라, 첼로 협주곡",
    startDate: "2026-09-09",
    endDate: "2026-09-09",
    visitDate: "2026-09-09",
    time: "2026-09-09 19:30 (100분)",
    venue: "예술의전당 콘서트홀",
    address: "서울 서초구 남부순환로 2406",
    price: 0,
    priceType: "R석 50,000원, S석 30,000원, A석 20,000원",
    discount: "카드·통신사 제휴 할인 공지 없음. 후원·골드 30%, 블루·그린 20%, 강남구민·예술인패스·10인 이상 단체 30%, 학생·대학생·임신부·경로·다둥이·장애인·국가유공자 50%(좌석·매수·증빙 조건 확인)",
    parking: "가능",
    parkingFee: "공연 관객 5시간 평일 6,000원, 주말·공휴일 9,000원. 초과 시 일반요금 10분당 1,000원(주말·공휴일 1,500원)",
    docent: "공연: 도슨트 적용 대상 아님",
    docentTime: "별도 공연 해설·도슨트 프로그램 공지 없음",
    difficulty: "사전예약",
    rating: "5",
    owner: "서울 음악 4",
    infoUrl: "https://www.sac.or.kr/site/main/show/show_view?SN=77682",
    mainUrl: "https://www.sac.or.kr/",
    mapUrl: "https://map.kakao.com/?q=%EC%98%88%EC%88%A0%EC%9D%98%EC%A0%84%EB%8B%B9%20%EC%BD%98%EC%84%9C%ED%8A%B8%ED%99%80",
    summary: "데이비드 이 지휘, 심준호 협연으로 바그너의 《뉘른베르크의 명가수》 전주곡, 쇼스타코비치 첼로 협주곡 1번, 베토벤 교향곡 7번을 듣습니다.",
    recommendation: "수요일 저녁 공연이고 A석 2만원부터 선택할 수 있으며, 대중적인 베토벤 7번과 첼로 협주곡을 한 무대에서 듣는 9월 서울 음악공연 후보입니다.",
    notes: "초등학생 이상 관람가. 할인 증빙은 현장에 지참해야 하며, 공연일 주차장 혼잡으로 대중교통 이용을 권장합니다.",
    ratingReason: "주요 교향곡·협주곡 구성, 좌석별 가격 선택지, 폭넓은 30~50% 할인과 9월 저녁 일정이 강점.",
    sourceLabel: "예술의전당 공식 공연 상세·주차 안내",
    verificationNote: "공식 상세에서 9월 9일 19:30, 100분, 좌석별 관람료, 출연·프로그램과 할인 확인; 공식 주차 안내에서 공연 관객 요금 확인",
    updatedAt: "2026-08-15",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010204",
    recommendedRank: 304,
    status: "공유완료",
    region: "인천",
    type: "공연",
    title: "ACI x 인천시향 공동기획 《조조早朝 클래식》 III",
    genre: "클래식, 오케스트라, 마티네",
    startDate: "2026-08-20",
    endDate: "2026-08-20",
    visitDate: "2026-08-20",
    time: "2026-08-20 11:00 (90분)",
    venue: "아트센터인천 콘서트홀",
    address: "인천광역시 연수구 아트센터대로 222",
    price: 0,
    priceType: "전석 25,000원",
    discount: "카드·통신사 제휴 할인 공지 없음. 장애인·국가유공자·병역명문가·만 65세 이상 50%, 문화누리카드·20인 이상 단체·ACI 아카데미 20%(증빙 필수)",
    parking: "가능",
    parkingFee: "무료 주차. 공연일 만차 가능성이 있어 대중교통 이용 권장",
    docent: "공연: 도슨트 적용 대상 아님",
    docentTime: "별도 해설 프로그램 없음",
    difficulty: "사전예약",
    rating: "5",
    owner: "인천 음악 1",
    infoUrl: "https://www.aci.or.kr/main/show/view.do?SHOW_IDX=14138&menuNo=010000&sch_kind=1&show_type=all&subMenuNo=010100&viewType=img",
    mainUrl: "https://www.aci.or.kr/",
    mapUrl: "https://map.kakao.com/?q=%EC%95%84%ED%8A%B8%EC%84%BC%ED%84%B0%EC%9D%B8%EC%B2%9C%20%EC%BD%98%EC%84%9C%ED%8A%B8%ED%99%80",
    summary: "아트센터인천과 인천시립교향악단이 공동기획한 오전 클래식 공연입니다.",
    recommendation: "송도권에서 부담 없는 가격과 시간대로 만날 수 있는 인천 대표 음악공연 후보입니다.",
    notes: "초등학생 이상 관람가. 아트센터인천 홈페이지 예매 시 별도 예매수수료가 없습니다.",
    ratingReason: "지역 대표 오케스트라, 오전 시간대, 합리적인 가격, 할인 폭이 강점.",
    sourceLabel: "아트센터인천 공식 공연 상세·예매 안내",
    verificationNote: "공식 상세에서 일시, 러닝타임, 관람료, 할인, 공식 예매 링크 확인",
    updatedAt: "2026-07-31",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010205",
    recommendedRank: 305,
    status: "공유완료",
    region: "인천",
    type: "공연",
    title: "클래식 인사이트 V: 인천시티오페라단 《오페라로 떠나는 유럽 여행》",
    genre: "오페라, 클래식, 갈라 콘서트",
    startDate: "2026-09-12",
    endDate: "2026-09-12",
    visitDate: "2026-09-12",
    time: "2026-09-12 17:00 (80분)",
    venue: "아트센터인천 콘서트홀",
    address: "인천광역시 연수구 아트센터대로 222",
    price: 0,
    priceType: "R석 20,000원, S석 10,000원",
    discount: "카드·통신사 제휴 할인 공지 없음. 장애인·국가유공자·병역명문가·만 65세 이상 50%(대상별 매수·증빙 조건 확인)",
    parking: "가능",
    parkingFee: "무료 주차. 공연일 만차 가능성이 있어 대중교통 이용 권장",
    docent: "공연: 도슨트 적용 대상 아님",
    docentTime: "별도 해설 프로그램 없음",
    difficulty: "사전예약",
    rating: "5",
    owner: "인천 음악 2",
    infoUrl: "https://www.aci.or.kr/main/show/view.do?SHOW_IDX=14190&menuNo=010000&sch_kind=1&show_type=all&subMenuNo=010100&viewType=img",
    mainUrl: "https://www.aci.or.kr/",
    mapUrl: "https://map.kakao.com/?q=%EC%95%84%ED%8A%B8%EC%84%BC%ED%84%B0%EC%9D%B8%EC%B2%9C%20%EC%BD%98%EC%84%9C%ED%8A%B8%ED%99%80",
    summary: "인천시티오페라단과 함께 유럽 오페라의 대표 장면과 선율을 80분 동안 만나는 아트센터인천 기획공연입니다.",
    recommendation: "토요일 오후 공연이고 R석 2만원·S석 1만원으로 부담이 적어 9월 인천 모임 대표 음악공연으로 추천합니다.",
    notes: "초등학생 이상 관람가. 아트센터인천 홈페이지 예매 시 별도 예매수수료가 없으며, 할인 증빙을 현장에 지참해야 합니다.",
    ratingReason: "합리적인 가격, 주말 시간대, 오페라 입문성, 공식 예매 정보의 명확성이 강점.",
    sourceLabel: "아트센터인천 공식 공연 상세·예매 안내",
    verificationNote: "공식 상세에서 9월 12일 17:00, 80분, 좌석별 관람료, 할인과 공식 예매 링크 확인",
    updatedAt: "2026-07-31",
  },
];

const movieRankingSourceUrl = "https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do?allMovieYn=Y&dmlMode=search&loadEnd=0";
const movieBookingUrl = "https://cgv.co.kr/cnm/cgvChart/movieChart";
const movieRankingUpdatedAt = "2026.08.02 02:22";
const recommendedMovies = [
  {
    id: "movie-20262770",
    movieCode: "20262770",
    bookingRank: 1,
    bookingRate: 58.8,
    title: "스파이더맨: 브랜드 뉴 데이",
    releaseStatus: "상영 중",
    releaseDate: "2026-07-29",
    runtime: 144,
    genre: "액션, 어드벤처, 판타지",
    ageRating: "12세 이상 관람가",
    director: "데스틴 다니엘 크리튼",
    summary: "모두의 기억에서 사라진 피터 파커가 통제하기 힘든 힘과 자신의 정체를 아는 적을 마주하는 새로운 스파이더맨 이야기입니다.",
    infoUrl: "https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20262770",
  },
  {
    id: "movie-20250654",
    movieCode: "20250654",
    bookingRank: 2,
    bookingRate: 23.9,
    title: "오디세이",
    releaseStatus: "개봉 예정",
    releaseDate: "2026-08-05",
    runtime: 172,
    genre: "액션, 드라마, 어드벤처",
    ageRating: "15세 이상 관람가",
    director: "크리스토퍼 놀란",
    summary: "트로이 전쟁을 마친 오디세우스가 신들의 분노와 괴물의 시련을 넘어 가족이 기다리는 왕국으로 돌아가는 여정입니다.",
    infoUrl: "https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20250654",
  },
  {
    id: "movie-20233219",
    movieCode: "20233219",
    bookingRank: 3,
    bookingRate: 6.0,
    title: "호프",
    releaseStatus: "상영 중",
    releaseDate: "2026-07-15",
    runtime: 156,
    genre: "SF, 스릴러, 액션",
    ageRating: "15세 이상 관람가",
    director: "나홍진",
    summary: "통신이 끊긴 외딴 마을에서 주민들이 정체불명의 존재와 맞서는 나홍진 감독의 SF 스릴러입니다.",
    infoUrl: "https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20233219",
  },
  {
    id: "movie-20262381",
    movieCode: "20262381",
    bookingRank: 4,
    bookingRate: 4.5,
    title: "사랑의 하츄핑: 고래보석의 전설",
    releaseStatus: "개봉 예정",
    releaseDate: "2026-08-05",
    runtime: 105,
    genre: "애니메이션",
    ageRating: "전체 관람가",
    director: "김수훈",
    summary: "로미와 하츄핑이 바닷속으로 사라진 엄마를 찾아 거대한 심해의 비밀과 맞서는 가족 애니메이션입니다.",
    infoUrl: "https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20262381",
  },
  {
    id: "movie-20255484",
    movieCode: "20255484",
    bookingRank: 5,
    bookingRate: 1.1,
    title: "오케이 마담2",
    releaseStatus: "개봉 예정",
    releaseDate: "2026-08-12",
    runtime: 108,
    genre: "코미디",
    ageRating: "15세 이상 관람가",
    director: "이철하",
    summary: "초호화 크루즈가 납치 사건 현장이 되면서 평범한 가족의 엄마 미영이 다시 전직 요원의 실력을 발휘하는 코미디 액션입니다.",
    infoUrl: "https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20255484",
  },
  {
    id: "movie-20261784",
    movieCode: "20261784",
    bookingRank: 6,
    bookingRate: 1.0,
    title: "미니언즈 & 몬스터즈",
    releaseStatus: "상영 중",
    releaseDate: "2026-07-15",
    runtime: 89,
    genre: "애니메이션",
    ageRating: "전체 관람가",
    director: "피에르 꼬팽",
    summary: "천만 관객 감독을 꿈꾸는 미니언즈 제임스·헨리·에드가 몬스터를 찾아 떠나는 어드벤처입니다.",
    infoUrl: "https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20261784",
  },
  {
    id: "movie-20264148",
    movieCode: "20264148",
    bookingRank: 7,
    bookingRate: 0.8,
    title: "어떻게 해야 했을까?",
    releaseStatus: "상영 중",
    releaseDate: "2026-07-29",
    runtime: 101,
    genre: "다큐멘터리",
    ageRating: "12세 이상 관람가",
    director: "공식 정보 확인",
    summary: "조현병 증상이 나타난 누나와 20여 년간 침묵한 가족을 남동생이 기록한 일본 다큐멘터리입니다.",
    infoUrl: "https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264148",
  },
  {
    id: "movie-20264635",
    movieCode: "20264635",
    bookingRank: 8,
    bookingRate: 0.7,
    title: "명탐정 코난: 하이웨이의 타천사",
    releaseStatus: "개봉 예정",
    releaseDate: "2026-08-12",
    runtime: 109,
    genre: "애니메이션",
    ageRating: "12세 이상 관람가",
    director: "공식 정보 확인",
    summary: "요코하마 모터사이클 축제에서 벌어진 폭주 오토바이 사건과 AI 사이카의 연관성을 쫓는 코난 극장판입니다.",
    infoUrl: "https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20264635",
  },
  {
    id: "movie-20259946",
    movieCode: "20259946",
    bookingRank: 9,
    bookingRate: 0.6,
    title: "모아나",
    releaseStatus: "상영 중",
    releaseDate: "2026-07-08",
    runtime: 115,
    genre: "어드벤처, 액션",
    ageRating: "전체 관람가",
    director: "토마스 케일",
    summary: "모투누이 섬의 모아나가 저주를 풀기 위해 마우이와 바다로 나서는 디즈니 실사 모험입니다.",
    infoUrl: "https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20259946",
  },
  {
    id: "movie-20259781",
    movieCode: "20259781",
    bookingRank: 10,
    bookingRate: 0.6,
    title: "토이 스토리 5",
    releaseStatus: "상영 중",
    releaseDate: "2026-06-17",
    runtime: 101,
    genre: "애니메이션, 어드벤처, 코미디",
    ageRating: "전체 관람가",
    director: "앤드류 스탠튼",
    summary: "픽사의 대표 장난감 시리즈가 다섯 번째 장편 애니메이션으로 돌아온 작품입니다.",
    infoUrl: "https://www.kobis.or.kr/kobis/mobile/mast/mvie/searchMovieDtl.do?movieCd=20259781",
  },
];

const fields = [];

let events = [];
const supportedAreas = ["서울", "경기", "인천"];
const supportedContentTypes = ["전체", "전시", "공연", "영화"];
let activeArea = "서울";
let activeContentType = "전체";
const boardUpdatedAt = "2026.08.17 21:54";
const dataUpdatedAt = "2026-08-17";
const dataUpdatedLabel = dataUpdatedAt.replace(/-/g, ".");
const retiredRecommendationTitles = new Set([
  "《큐비스트: 시각의 혁신가들》",
  "[2026 신진미술인 지원 프로그램] 최은빈 개인전 《Airborne》",
  "서울식물원 여름행사 《식물원은 미술관: 프리다가 사랑한 식물들》",
  "박신양 작가 초대전 《제4의 벽》",
  "롯데콘서트홀 추천: 지브리&디즈니 영화음악 FESTA (8/9)",
  "인천시립합창단 제197회 정기연주회 《2026 뮤지컬 & 시네마 어드벤처》",
  "2026 제6회 《S Classic Week》 4th ‘사람의 조화’",
].map(normalizeTitle));

const $ = (selector) => document.querySelector(selector);

const elements = {
  rows: $("#eventRows"),
  cards: $("#eventCards"),
  exhibitionPageCards: $("#exhibitionPageCards"),
  empty: $("#emptyState"),
  resultCount: $("#resultCount"),
  kakaoShareText: $("#kakaoShareText"),
  copyKakaoButton: $("#copyKakaoButton"),
  boardUpdatedAt: $("#boardUpdatedAt"),
  areaTabs: [...document.querySelectorAll("[data-area]")],
  contentTypeTabs: [...document.querySelectorAll("[data-content-type]")],
  weeklyShareTitle: $("#weeklyShareTitle"),
  shareMeta: $("#shareMeta"),
  exhibitionPageTitle: $("#exhibitionPageTitle"),
  recommendationHint: $("#recommendationHint"),
  filters: {
    search: $("#searchInput"),
    region: $("#regionFilter"),
    type: $("#typeFilter"),
    status: $("#statusFilter"),
    parking: $("#parkingFilter"),
  },
};

init();

async function init() {
  elements.boardUpdatedAt.textContent = `최종 업데이트: ${boardUpdatedAt}`;
  populateSelect("#regionFilter", options.regions, true);
  populateSelect("#typeFilter", options.types, true);
  populateSelect("#statusFilter", options.statuses, true);
  populateSelect("#parkingFilter", options.parking, true);
  $("#resetButton").addEventListener("click", resetFilters);
  $("#exportCsvButton").addEventListener("click", exportCsv);
  elements.copyKakaoButton.addEventListener("click", copyKakaoShare);
  elements.areaTabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveArea(tab.dataset.area));
  });
  elements.contentTypeTabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveContentType(tab.dataset.contentType));
  });
  setupTabKeyboard(elements.areaTabs);
  setupTabKeyboard(elements.contentTypeTabs);

  Object.values(elements.filters).forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });

  events = await loadEvents();
  render();
}

function populateSelect(selector, values, includeAll = false, placeholder = "") {
  const select = $(selector);
  select.innerHTML = "";
  if (includeAll) {
    select.append(new Option("전체", ""));
  } else if (placeholder) {
    select.append(new Option(placeholder, ""));
  }
  values.forEach((value) => select.append(new Option(value, value)));
}

async function loadEvents() {
  if (supabase) {
    try {
      const remoteEvents = await supabase.list();
      return mergeRecommendedEvents(remoteEvents);
    } catch (error) {
      console.warn("Supabase load failed. Falling back to local data.", error);
    }
  }

  return mergeRecommendedEvents(sampleEvents);
}

function mergeRecommendedEvents(sourceEvents = []) {
  const originals = Array.isArray(sourceEvents) ? sourceEvents : [];
  const recommendedTitles = new Set(recommendedEvents.map((event) => normalizeTitle(event.title)));
  const byTitle = new Map();

  originals.forEach((event) => {
    byTitle.set(normalizeTitle(event.title), event);
  });

  const recommended = recommendedEvents.map((event) => {
    const titleKey = normalizeTitle(event.title);
    const existing = byTitle.get(titleKey);
    return {
      ...(existing || {}),
      ...event,
      updatedAt: dataUpdatedAt,
      id: existing?.id || event.id,
    };
  });

  const extras = originals.filter((event) => {
    const isRecommended = recommendedTitles.has(normalizeTitle(event.title));
    const isRetiredRecommendation = retiredRecommendationTitles.has(normalizeTitle(event.title));
    const isCurrent = !event.endDate || event.endDate >= dataUpdatedAt;
    return !isRecommended && !isRetiredRecommendation && isCurrent;
  });
  return [...recommended, ...extras];
}

function normalizeTitle(title) {
  return String(title || "").replace(/\s+/g, " ").trim();
}

function filteredEvents() {
  const search = elements.filters.search.value.trim().toLowerCase();
  return events.filter((event) => {
    const matchesSearch = !search || [
      event.title,
      event.venue,
      event.address,
      event.summary,
      event.recommendation,
      event.notes,
      event.owner,
    ].some((value) => String(value || "").toLowerCase().includes(search));

    return matchesSearch
      && matchesFilter(event.region, elements.filters.region.value)
      && matchesFilter(event.type, elements.filters.type.value)
      && matchesFilter(event.status, elements.filters.status.value)
      && matchesFilter(event.parking, elements.filters.parking.value);
  }).sort((a, b) => (a.visitDate || a.startDate || "").localeCompare(b.visitDate || b.startDate || ""));
}

function matchesFilter(value, filter) {
  return !filter || value === filter;
}

function setActiveArea(area) {
  if (!supportedAreas.includes(area) || area === activeArea) return;
  activeArea = area;
  elements.areaTabs.forEach((tab) => {
    const selected = tab.dataset.area === activeArea;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
  render();
}

function setupTabKeyboard(tabs) {
  tabs.forEach((tab, index) => {
    tab.addEventListener("keydown", (event) => {
      let nextIndex = index;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else return;

      event.preventDefault();
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    });
  });
}

function setActiveContentType(contentType) {
  if (!supportedContentTypes.includes(contentType) || contentType === activeContentType) return;
  activeContentType = contentType;
  elements.contentTypeTabs.forEach((tab) => {
    const selected = tab.dataset.contentType === activeContentType;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
  render();
}

function contentTypeLabel(contentType = activeContentType) {
  return {
    전체: "전체",
    전시: "전시",
    공연: "음악공연",
    영화: "영화",
  }[contentType] || "전체";
}

function eventArea(event) {
  const location = [event.area, event.region, event.address, event.venue].filter(Boolean).join(" ");
  if (location.includes("인천")) return "인천";
  if (location.includes("경기") || location.includes("수원")) return "경기";
  return "서울";
}

function render() {
  const list = filteredEvents();
  const typeLabel = contentTypeLabel();
  if (activeContentType === "영화") {
    elements.weeklyShareTitle.textContent = "전국 영화 실시간 예매 순위";
    elements.shareMeta.textContent = `${movieRankingUpdatedAt} KOBIS 기준. 순위는 전국 기준이며 ${activeArea} 상영 회차는 영화관 예매 화면에서 확인하세요.`;
    elements.exhibitionPageTitle.textContent = `${activeArea}에서 볼 영화 예매 순위`;
    elements.recommendationHint.textContent = "전국 예매 순위 · 선택 지역의 영화관 회차 확인";
  } else {
    elements.weeklyShareTitle.textContent = `${activeArea} ${typeLabel} 추천`;
    elements.shareMeta.textContent = `${dataUpdatedLabel} 기준. 모임 전 공식 페이지에서 일정, 휴관일, 예매, 주차 정보를 다시 확인하세요.`;
    elements.exhibitionPageTitle.textContent = `${activeArea} ${typeLabel} 추천`;
    elements.recommendationHint.textContent = "지역과 유형을 차례로 선택하세요";
  }
  renderMetrics();
  renderKakaoShare();
  renderExhibitionPage(topRecommendedEvents());
  renderRows(list);
  renderCards(list);
  elements.resultCount.textContent = `${list.length}건`;
  elements.empty.hidden = list.length > 0;
}

function renderMetrics() {
  const areaEvents = events.filter((event) => eventArea(event) === activeArea);
  const ratings = areaEvents.map((event) => Number(event.rating)).filter(Boolean);
  const avg = ratings.length
    ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
    : "-";

  $("#metricTotal").textContent = areaEvents.length;
  $("#metricPlanned").textContent = areaEvents.filter((event) => event.status === "관람예정").length;
  $("#metricFree").textContent = areaEvents.filter((event) => event.priceType === "무료" || event.priceType === "초대/이벤트").length;
  $("#metricRating").textContent = avg;
}

function renderRows(list) {
  elements.rows.innerHTML = list.map((event) => `
    <tr>
      <td>${statusPill(event.status)}</td>
      <td>${escapeHtml(event.type)}</td>
      <td class="title-cell">
        <strong>${escapeHtml(event.title)}</strong>
        <span>${escapeHtml(event.summary || event.recommendation || "")}</span>
      </td>
      <td>${escapeHtml(event.region)}</td>
      <td>${formatDateRange(event)}</td>
      <td class="money">${formatPrice(event)}</td>
      <td>${formatParkingDocent(event)}</td>
      <td>${formatStars(event.rating)}</td>
      <td>${escapeHtml(event.owner || "-")}</td>
      <td>
        <div class="row-actions">
          ${event.infoUrl ? `<a href="${escapeAttribute(event.infoUrl)}" target="_blank" rel="noopener">공식 정보</a>` : "-"}
        </div>
      </td>
    </tr>
  `).join("");
}

function renderCards(list) {
  elements.cards.innerHTML = list.map((event) => `
    <article class="event-card">
      <div class="card-head">
        ${statusPill(event.status)}
        ${event.infoUrl ? `<a class="button tertiary" href="${escapeAttribute(event.infoUrl)}" target="_blank" rel="noopener">공식 정보</a>` : ""}
      </div>
      <div class="card-title">${escapeHtml(event.title)}</div>
      <div class="card-meta">
        <span>${escapeHtml(event.type)} · ${escapeHtml(event.region)}</span>
        <span>${formatDateRange(event)}</span>
        <span>${formatPrice(event)}</span>
        <span>주차 ${escapeHtml(event.parking || "-")}</span>
        <span>평점 ${formatStars(event.rating)}</span>
      </div>
      ${event.summary ? `<p class="card-summary">${escapeHtml(event.summary)}</p>` : ""}
    </article>
  `).join("");

}

function renderExhibitionPage(list) {
  const groups = [];
  if (activeContentType === "전체" || activeContentType === "전시") {
    groups.push({
      type: "전시",
      title: "추천 전시",
      subtitle: `공식 상세 페이지로 확인한 ${activeArea} 8~9월 전시`,
      items: list.filter((event) => event.type === "전시").slice(0, 10),
    });
  }
  if (activeContentType === "전체" || activeContentType === "공연") {
    groups.push({
      type: "공연",
      title: "추천 음악공연",
      subtitle: `공식 공연장 일정 페이지에서 고르는 ${activeArea} 8~9월 공연 후보`,
      items: list.filter((event) => event.type === "공연").slice(0, 10),
    });
  }
  if (activeContentType === "전체" || activeContentType === "영화") {
    groups.push({
      type: "영화",
      title: "실시간 영화 예매 순위",
      subtitle: `${movieRankingUpdatedAt} KOBIS 전국 기준 · ${activeArea} 영화관별 상영 회차 확인`,
      items: recommendedMovies.slice(0, activeContentType === "영화" ? 10 : 5),
    });
  }

  elements.exhibitionPageCards.innerHTML = groups.map((group) => {
    const items = group.items;
    if (!items.length) return "";

    return `
      <section class="recommendation-group" aria-label="${escapeAttribute(group.title)}">
        <div class="recommendation-group-head">
          <div>
            <h3>${escapeHtml(group.title)}</h3>
            <p>${escapeHtml(group.subtitle)}</p>
          </div>
          <span>${items.length}건</span>
        </div>
        <div class="exhibition-grid">
          ${items.map((item, index) => group.type === "영화" ? renderMovieCard(item) : renderRecommendationCard(item, index)).join("")}
        </div>
      </section>
    `;
  }).join("");

}

function renderMovieCard(movie) {
  const upcomingClass = movie.releaseStatus === "개봉 예정" ? " upcoming" : "";
  return `
    <article class="exhibition-card movie-card">
      <div class="exhibition-rank">${escapeHtml(movie.bookingRank)}</div>
      <div class="exhibition-body">
        <div class="exhibition-head">
          <div>
            <div class="movie-status-line">
              <span class="movie-status-badge${upcomingClass}">${escapeHtml(movie.releaseStatus)}</span>
              <span class="movie-ranking-badge">전국 예매 ${escapeHtml(movie.bookingRank)}위</span>
            </div>
            <h3>${escapeHtml(movie.title)}</h3>
          </div>
          <div class="movie-booking-box" aria-label="KOBIS 예매율 ${escapeHtml(movie.bookingRate)}퍼센트">
            <strong>${escapeHtml(movie.bookingRate)}%</strong>
            <span>KOBIS 실시간 예매율</span>
          </div>
        </div>

        <p class="exhibition-summary">${escapeHtml(movie.summary)}</p>

        <dl class="exhibition-details">
          ${detailItem("개봉일", formatKoreanDate(movie.releaseDate))}
          ${detailItem("러닝타임", `${movie.runtime}분`)}
          ${detailItem("장르", movie.genre)}
          ${detailItem("관람등급", movie.ageRating)}
          ${detailItem("감독", movie.director)}
          ${detailItem("상영관", `${activeArea} 지역 영화관별 회차 확인`)}
        </dl>

        <p class="exhibition-reason">전국 실시간 예매 ${escapeHtml(movie.bookingRank)}위입니다. 예매율은 조회 시점에 따라 수시로 바뀝니다.</p>

        <div class="exhibition-actions">
          <a class="button movie-booking-button" href="${escapeAttribute(movieBookingUrl)}" target="_blank" rel="noopener">영화관 예매</a>
          <a class="button tertiary" href="${escapeAttribute(movie.infoUrl)}" target="_blank" rel="noopener">KOBIS 영화정보</a>
          <a class="button tertiary" href="${escapeAttribute(movieTheaterMapUrl())}" target="_blank" rel="noopener">주변 영화관</a>
        </div>
      </div>
    </article>
  `;
}

function formatKoreanDate(value) {
  if (!value) return "확인 필요";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${year}. ${Number(month)}. ${Number(day)}.`;
}

function movieTheaterMapUrl(area = activeArea) {
  return `https://map.kakao.com/?q=${encodeURIComponent(`${area} 영화관`)}`;
}

function renderRecommendationCard(event, index) {
  const cardClass = event.type === "공연" ? " performance-card" : "";
  return `
    <article class="exhibition-card${cardClass}">
      <div class="exhibition-rank">${index + 1}</div>
      <div class="exhibition-body">
        <div class="exhibition-head">
          <div>
            <p class="exhibition-venue">${escapeHtml([event.region, event.venue || "장소 확인 필요"].filter(Boolean).join(" · "))}</p>
            <h3>${escapeHtml(event.title)}</h3>
          </div>
          <div class="rating-box">
            <div class="stars" aria-label="추천 별점 ${escapeHtml(event.rating || "-")}점">${formatStars(event.rating)}</div>
            <div class="rating-source">${escapeHtml(formatRatingSource(event))}</div>
          </div>
        </div>

        <p class="exhibition-summary">${escapeHtml(event.summary || event.recommendation || "")}</p>

        <dl class="exhibition-details">
          ${detailItem("관람일정", formatDateRange(event))}
          ${detailItem("운영시간", event.time || "확인 필요")}
          ${detailItem("관람료", formatSharePrice(event))}
          ${detailItem("카드·통신사 할인", event.discount || "확인 필요")}
          ${detailItem("위치", [event.venue, event.address].filter(Boolean).join(" · ") || "확인 필요")}
          ${detailItem(event.type === "공연" ? "공연 해설·도슨트" : "도슨트 운영시간", formatDocentTime(event))}
          ${detailItem("주차/주차료", formatParkingInfo(event))}
        </dl>

        <p class="exhibition-reason">${escapeHtml(event.recommendation || "")}</p>

        <div class="exhibition-actions">
          <a class="button primary" href="${escapeAttribute(kakaoMapUrl(event))}" target="_blank" rel="noopener">카카오맵</a>
          ${infoPageUrl(event) ? renderInlineRecommendationInfo(event) : ""}
        </div>
      </div>
    </article>
  `;
}

function infoPageUrl(event) {
  return event.infoUrl || event.mainUrl || "";
}

function renderInlineRecommendationInfo(event) {
  if (event.type === "전시") {
    return `<a class="button tertiary" href="${escapeAttribute(infoPageUrl(event))}" target="_blank" rel="noopener">전시 정보·예약</a>`;
  }

  const label = "공연 정보";
  const officialLabel = event.linkLabel || "공식 예매 페이지";
  return `
    <details class="recommendation-inline-details">
      <summary class="button tertiary">${label}</summary>
      <div class="recommendation-inline-body">
        <p>${escapeHtml(event.summary || event.recommendation || "")}</p>
        <dl>
          ${detailItem("관람일정", formatDateRange(event))}
          ${detailItem("운영시간", event.time || "확인 필요")}
          ${detailItem("관람료", formatSharePrice(event))}
          ${detailItem("할인", event.discount || "확인 필요")}
          ${detailItem("공연 해설·도슨트", formatDocentTime(event))}
          ${detailItem("정보 기준일", event.updatedAt || "확인 필요")}
        </dl>
        <a class="official-info-link" href="${escapeAttribute(infoPageUrl(event))}" target="_blank" rel="noopener">${escapeHtml(officialLabel)}</a>
      </div>
    </details>
  `;
}

function detailItem(label, value) {
  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value || "-")}</dd>
    </div>
  `;
}

function statusPill(status) {
  const className = {
    "관람예정": "plan",
    "관람완료": "done",
    "공유완료": "done",
    "보류": "hold",
    "취소": "cancel",
  }[status] || "";
  return `<span class="pill ${className}">${escapeHtml(status || "검토중")}</span>`;
}

function formatDateRange(event) {
  const start = event.startDate || "";
  const end = event.endDate || "";
  if (!start && !end) return "-";
  if (start === end || !end) return escapeHtml(start);
  return `${escapeHtml(start)} ~ ${escapeHtml(end)}`;
}

function formatPrice(event) {
  const price = Number(event.price || 0);
  if (event.priceType === "확인 필요") return "확인 필요";
  if (price === 0 && event.priceType && event.priceType !== "무료") return event.priceType;
  if (event.priceType === "무료" || price === 0) return "무료";
  return `${price.toLocaleString("ko-KR")}원`;
}

function formatParkingDocent(event) {
  const parking = escapeHtml(event.parking || "-");
  if (event.type === "공연") return parking;
  const docent = event.docent ? `<span class="sub-note">도슨트 ${escapeHtml(event.docent)}</span>` : "";
  return `${parking}${docent}`;
}

function formatStars(rating) {
  const value = Math.max(0, Math.min(5, Number(rating || 0)));
  if (!value) return "-";
  return `${"★".repeat(value)}${"☆".repeat(5 - value)}`;
}

function topRecommendedEvents(source = events, area = activeArea) {
  const visibleTypes = new Set(["전시", "공연"]);
  return [...source]
    .filter((event) => {
      if (!visibleTypes.has(event.type) || !event.recommendedRank || eventArea(event) !== area) return false;
      if (event.type === "전시") return event.verified === true;
      return true;
    })
    .sort((a, b) => {
      const rankDiff = Number(a.recommendedRank || 999) - Number(b.recommendedRank || 999);
      if (rankDiff) return rankDiff;
      const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
      if (ratingDiff) return ratingDiff;
      return (a.visitDate || a.startDate || "").localeCompare(b.visitDate || b.startDate || "");
    })
    .slice(0, 20);
}

function formatRatingSource(event) {
  const source = event.sourceLabel || "공식 정보";
  const reason = event.ratingReason || "모임 추천 기준";
  return `별점 출처: ${source} · 기준: ${reason}`;
}

function formatDocentTime(event) {
  if (event.docentTime) return event.docentTime;
  if (event.type === "공연") return "해당 없음";
  if (event.docent) return `${event.docent} / 시간은 공식 페이지 확인`;
  return "공식 페이지 확인";
}

function formatParkingInfo(event) {
  const status = event.parking || "확인 필요";
  if (event.parkingFee) return `${status} · ${event.parkingFee}`;
  return status;
}

function renderKakaoShare() {
  elements.kakaoShareText.textContent = buildKakaoShareText();
}

async function copyKakaoShare() {
  const text = buildKakaoShareText();
  try {
    await navigator.clipboard.writeText(text);
    const original = elements.copyKakaoButton.textContent;
    elements.copyKakaoButton.textContent = "복사 완료";
    window.setTimeout(() => {
      elements.copyKakaoButton.textContent = original;
    }, 1400);
  } catch {
    window.prompt("아래 내용을 복사해서 카카오톡에 붙여넣으세요.", text);
  }
}

function buildKakaoShareText() {
  if (activeContentType === "영화") return buildMovieKakaoShareText(recommendedMovies);

  const list = topRecommendedEvents().filter((event) => (
    activeContentType === "전체" || event.type === activeContentType
  ));
  const lines = [
    `[${activeArea} ${contentTypeLabel()} 추천]`,
    `${dataUpdatedLabel} 기준 / 모임 전 공식 페이지 재확인`,
    "",
  ];

  list.forEach((event, index) => {
    lines.push(`${index + 1}. ${formatStars(event.rating)} ${event.title}`);
    lines.push(`   일정: ${formatShareDateRange(event)} / 운영: ${event.time || "확인 필요"}`);
    lines.push(`   장소: ${event.venue || "-"} (${event.address || "주소 확인 필요"})`);
    lines.push(`   관람료: ${formatSharePrice(event)} / 할인: ${event.discount || "확인 필요"}`);
    if (event.type === "공연") {
      lines.push(`   주차: ${formatShareParking(event)}`);
    } else {
      lines.push(`   도슨트: ${event.docent || "확인 필요"} / 주차: ${formatShareParking(event)}`);
    }
    lines.push(`   추천: ${event.recommendation || event.summary || "-"}`);
    if (infoPageUrl(event)) lines.push(`   링크: ${infoPageUrl(event)}`);
    lines.push("");
  });

  if (activeContentType === "전체") {
    lines.push("[전국 영화 실시간 예매 TOP 5]");
    recommendedMovies.slice(0, 5).forEach((movie) => {
      lines.push(`${movie.bookingRank}. [${movie.releaseStatus}] ${movie.title} · 예매율 ${movie.bookingRate}%`);
      lines.push(`   개봉: ${formatKoreanDate(movie.releaseDate)} / ${movie.runtime}분 / ${movie.ageRating}`);
      lines.push(`   영화정보: ${movie.infoUrl}`);
    });
    lines.push("");
  }

  lines.push("업데이트 원칙: 전시·공연은 공식 상세, 영화는 KOBIS 실시간 예매율 기준으로 갱신");
  return lines.join("\n");
}

function buildMovieKakaoShareText(movies) {
  const lines = [
    "[전국 영화 실시간 예매 TOP 10]",
    `${movieRankingUpdatedAt} KOBIS 기준 / ${activeArea} 영화관별 회차 확인`,
    "",
  ];

  movies.forEach((movie) => {
    lines.push(`${movie.bookingRank}. [${movie.releaseStatus}] ${movie.title} · 예매율 ${movie.bookingRate}%`);
    lines.push(`   개봉: ${formatKoreanDate(movie.releaseDate)} / ${movie.runtime}분 / ${movie.genre}`);
    lines.push(`   등급: ${movie.ageRating} / 감독: ${movie.director}`);
    lines.push(`   영화정보: ${movie.infoUrl}`);
    lines.push("");
  });

  lines.push(`실시간 순위: ${movieRankingSourceUrl}`);
  lines.push(`영화관 예매: ${movieBookingUrl}`);
  lines.push("예매율과 상영 회차는 수시로 바뀌므로 예매 직전에 다시 확인하세요.");
  return lines.join("\n");
}

function formatShareDateRange(event) {
  const start = formatShortDate(event.startDate);
  const end = formatShortDate(event.endDate);
  if (!start && !end) return "확인 필요";
  if (start === end || !end) return start;
  return `${start}~${end}`;
}

function formatShortDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${year}.${Number(month)}.${Number(day)}`;
}

function formatSharePrice(event) {
  const base = formatPrice(event);
  if (event.priceType && event.priceType !== "무료" && base === "무료") return event.priceType;
  return base;
}

function formatShareParking(event) {
  if (!event.parking) return "확인 필요";
  if (event.notes) return `${event.parking} (${event.notes})`;
  return event.parking;
}

function kakaoMapUrl(event) {
  if (event.mapUrl) return event.mapUrl;
  const query = [event.venue, event.address].filter(Boolean).join(" ");
  return `https://map.kakao.com/?q=${encodeURIComponent(query || event.title || "서울 전시")}`;
}

function resetFilters() {
  Object.values(elements.filters).forEach((control) => {
    control.value = "";
  });
  render();
}

function exportCsv() {
  const headers = [
    "상태", "지역", "구분", "행사명", "장르/분야", "시작일", "종료일", "관람일 후보",
    "시간", "장소명", "주소", "관람료", "할인/무료", "주차 여부", "동행 난이도",
    "평점", "담당자", "예매/정보 링크", "위치 링크", "내용 요약", "추천 포인트", "주의사항", "평점 근거", "업데이트일",
  ];
  const rows = filteredEvents().map((event) => [
    event.status, event.region, event.type, event.title, event.genre, event.startDate, event.endDate,
    event.visitDate, event.time, event.venue, event.address, event.price, event.priceType, event.parking,
    event.difficulty, event.rating, event.owner, event.infoUrl, event.mapUrl, event.summary,
    event.recommendation, event.notes, event.ratingReason, event.updatedAt,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `seoul-culture-events-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function createSupabaseClient({ supabaseUrl, supabaseAnonKey }) {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const baseUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/events`;
  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  };

  async function list() {
    const query = "?select=*&order=visit_date.asc.nullslast&order=start_date.asc.nullslast";
    const response = await fetch(`${baseUrl}${query}`, { headers });

    if (!response.ok) {
      throw new Error(`Supabase ${response.status}: ${await response.text()}`);
    }

    const rows = await response.json();
    return rows.map(fromDbEvent);
  }

  return { list };
}

function fromDbEvent(row) {
  return {
    id: row.id,
    status: row.status,
    region: row.region,
    type: row.type,
    title: row.title,
    genre: row.genre || "",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    visitDate: row.visit_date || "",
    time: row.time || "",
    venue: row.venue || "",
    address: row.address || "",
    price: row.price || 0,
    priceType: row.price_type,
    parking: row.parking,
    difficulty: row.difficulty,
    rating: row.rating ? String(Number(row.rating)) : "",
    owner: row.owner || "",
    infoUrl: row.info_url || "",
    mapUrl: row.map_url || "",
    summary: row.summary || "",
    recommendation: row.recommendation || "",
    notes: row.notes || "",
    ratingReason: row.rating_reason || "",
    updatedAt: String(row.updated_at || "").slice(0, 10),
  };
}
