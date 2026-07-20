const options = {
  statuses: ["검토중", "공유완료", "관람예정", "관람완료", "보류", "취소"],
  regions: ["서울 전체", "종로/중구", "강남/서초", "마포/서대문", "용산/성동", "송파/강동", "영등포/구로", "동대문/성북", "노원/도봉/강북", "강서/양천", "관악/동작/금천", "수원/경기", "인천"],
  types: ["전시", "공연", "기타"],
  priceTypes: ["무료", "유료", "할인 확인", "초대/이벤트", "확인 필요"],
  parking: ["가능", "불가", "확인 필요"],
  difficulty: ["가볍게", "사전예약", "긴 관람"],
};

const storageKey = "seoul-culture-board-events-v1";
const config = window.CLUB_CONFIG || {};
const supabase = createSupabaseClient(config);

const sampleEvents = [
  {
    id: crypto.randomUUID(),
    status: "공유완료",
    region: "영등포/구로",
    type: "전시",
    title: "《큐비스트: 시각의 혁신가들》",
    genre: "입체주의, 근현대미술",
    startDate: "2026-06-04",
    endDate: "2026-10-04",
    visitDate: "2026-07-18",
    time: "화·목·금·일 10:00-18:00, 수·토 10:00-21:00, 월 휴관",
    venue: "퐁피두센터 한화",
    address: "서울 영등포구 63로 50, 63빌딩",
    price: 28000,
    priceType: "유료",
    parking: "가능",
    difficulty: "긴 관람",
    rating: "",
    owner: "",
    infoUrl: "https://www.centrepompidou-hanwha.kr/exhibition/detail?seq=96&status=INACTIVE",
    mapUrl: "",
    summary: "퐁피두센터 한화 개관전. 1907~1927년 큐비즘의 흐름을 퐁피두센터 소장품과 한국 근현대 작품으로 조망하는 전시입니다.",
    recommendation: "7~8월 모임의 대표 후보로 적합합니다. 대형 개관전이라 사전 예매와 혼잡도 확인을 권장합니다.",
    notes: "출처: 퐁피두센터 한화 한국어 공식 상세·관람 안내.",
    ratingReason: "",
    updatedAt: "2026-07-20",
  },
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
    summary: "서울시립 북서울미술관에서 진행되는 유휴공간 전시입니다. 기간이 길어 7~8월 중 일정 조율이 쉽습니다.",
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
    visitDate: "2026-07-25",
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
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010002",
    recommendedRank: 2,
    verified: true,
    status: "공유완료",
    region: "영등포/구로",
    type: "전시",
    title: "《큐비스트: 시각의 혁신가들》",
    genre: "입체주의, 근현대미술",
    startDate: "2026-06-04",
    endDate: "2026-10-04",
    visitDate: "2026-08-01",
    time: "화·목·금·일 10:00-18:00(입장마감 17:30), 수·토 10:00-21:00(입장마감 20:30), 월 휴관",
    venue: "퐁피두센터 한화",
    address: "서울 영등포구 63로 50, 63빌딩",
    price: 28000,
    priceType: "유료",
    discount: "카드·통신사 제휴 할인 공지 없음. 매월 마지막 수요일 현장 예매 50%, 20인 이상 단체 할인. 기타 대상별 할인은 공식 예매 화면 확인",
    parking: "가능",
    parkingFee: "당일 전시 티켓 소지 시 63빌딩 지하주차장 평일 1시간, 주말 2시간 무료. 이후 시간당 6,000원",
    docent: "정규 무료 도슨트와 오디오가이드 운영",
    docentTime: "평일(화·수·목·금) 11:30, 14:00, 16:30 / 주말(토·일) 11:30, 16:30. 회차별 현장 선착순 50명",
    difficulty: "사전예약",
    rating: "5",
    owner: "TOP 2",
    infoUrl: "https://www.centrepompidou-hanwha.kr/exhibition/detail?seq=96&status=INACTIVE",
    mapUrl: "https://map.kakao.com/?q=%EC%84%BC%ED%84%B0%20%ED%90%81%ED%94%BC%EB%91%90%20%ED%95%9C%ED%99%94%20%EC%84%9C%EC%9A%B8",
    summary: "퐁피두센터 한화 개관전. 1907~1927년 파리를 중심으로 전개된 큐비즘의 흐름을 퐁피두센터 소장품 92점과 한국 근현대 회화 21점 등으로 조망합니다.",
    recommendation: "신규 미술관 개관전이라 화제성이 높고, 7~8월 유료 특별전 후보로 가장 강합니다.",
    notes: "한국어 공식 상세 및 관람 안내 기준. 도슨트는 전시장 상황에 따라 취소·변경 가능.",
    ratingReason: "국제 컬렉션, 개관전 화제성, 작품 대중성이 높음.",
    sourceLabel: "퐁피두센터 한화 한국어 공식 상세·관람 안내",
    verificationNote: "한국어 공식 페이지에서 전시명, 작품 수, 운영시간, 관람료·문화가 있는 날 할인, 도슨트, 주차료 확인",
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010003",
    recommendedRank: 3,
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
    owner: "TOP 3",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1553791",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EC%82%AC%EC%A7%84%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "서울시립 사진미술관에서 열리는 마틴 파 전시로, 사진 중심 관람을 원하는 모임에 적합합니다.",
    recommendation: "새 사진미술관 방문과 함께 묶기 좋아 8월 모임 후보로 추천합니다.",
    notes: "창동역 도보권. 차량보다 대중교통 이용 권장.",
    ratingReason: "사진 장르의 접근성, 신설 미술관 방문성, 8월 일정 안정성이 좋음.",
    sourceLabel: "SeMA 공식 전시 상세·사진미술관 방문안내",
    verificationNote: "SeMA 공식 상세에서 전시명, 장소, 기간, 관람료, 도슨트 3회차 확인",
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010004",
    recommendedRank: 4,
    verified: true,
    status: "공유완료",
    region: "종로/중구",
    type: "전시",
    title: "난지미술창작스튜디오 20주년 기념전 《사랑의 기원》",
    genre: "동시대미술, 설치, 영상, 퍼포먼스",
    startDate: "2026-04-30",
    endDate: "2026-09-06",
    visitDate: "2026-07-26",
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
    owner: "TOP 4",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1523485",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%EB%AF%B8%EC%88%A0%EA%B4%80%20%EC%84%9C%EC%86%8C%EB%AC%B8%EB%B3%B8%EA%B4%80",
    summary: "난지미술창작스튜디오 10~19기 출신 작가 17명(팀)의 영상, 설치, 조각, 회화, 퍼포먼스 등 60여 점을 조망합니다.",
    recommendation: "동시대미술을 폭넓게 보고 싶은 모임에 적합합니다. 유영국전과 같은 날 묶어 보기 좋습니다.",
    notes: "서소문본관 주차 협소. 연계 프로그램 일정은 별도 확인.",
    ratingReason: "여러 작가와 매체를 한 번에 볼 수 있어 단체 관람 후 토론에 좋음.",
    sourceLabel: "SeMA 공식 전시 상세·보도자료",
    verificationNote: "SeMA 공식 상세에서 전시명, 장소, 기간, 관람료, 도슨트 15:00 확인",
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010005",
    recommendedRank: 5,
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
    owner: "TOP 5",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1538201",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EB%B6%81%EC%84%9C%EC%9A%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "미디어 아티스트 권병준 개인전. 포옹을 시각화한 대형 로봇 작품과 AI 기반 사운드 작품을 중심으로 구성됩니다.",
    recommendation: "가족 동반 회원이나 미디어아트에 관심 있는 모임원에게 좋습니다.",
    notes: "북서울미술관은 주차 가능하지만 요일별 5부제 적용.",
    ratingReason: "체험성, 사운드, 어린이 친화 프로그램의 장점이 뚜렷함.",
    sourceLabel: "SeMA 공식 전시 상세·북서울미술관 방문안내",
    verificationNote: "SeMA 공식 상세에서 전시명, 기간, 관람료, 매일 14:30 도슨트 확인",
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010006",
    recommendedRank: 6,
    verified: true,
    status: "공유완료",
    region: "관악/동작/금천",
    type: "전시",
    title: "서울시립 서서울미술관 개관 특별 미디어 소장품전 《서서울의 투명한 |청소년| 기계》",
    genre: "미디어아트, 소장품전",
    startDate: "2026-05-14",
    endDate: "2026-07-26",
    visitDate: "2026-07-19",
    time: "화-금 10:00-20:00, 토/일/공휴일 10:00-19:00, 월 휴관",
    venue: "서울시립 서서울미술관",
    address: "서울 금천구 시흥대로79길 65",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "5분 250원(시간당 3,000원), 일 최대 24,000원. 입차는 관람 종료 30분 전까지",
    docent: "공식 상세에 정기 도슨트 공지 없음",
    docentTime: "별도 정기 도슨트 회차 공지 없음",
    difficulty: "가볍게",
    rating: "4",
    owner: "TOP 6",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1528398",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EC%84%9C%EC%84%9C%EC%9A%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "서울시립 서서울미술관 개관 특별 미디어 소장품전입니다. 7월 26일까지라 7월 모임 후보로 우선 검토하면 좋습니다.",
    recommendation: "새 미술관 탐방과 미디어 소장품전을 함께 경험할 수 있습니다.",
    notes: "입장마감은 관람 종료 30분 전. 7월 말 종료 전 방문 권장.",
    ratingReason: "신규 공립 미디어 특화 미술관의 개관 분위기를 볼 수 있음.",
    sourceLabel: "SeMA 공식 전시 상세·서서울미술관 방문안내",
    verificationNote: "SeMA 공식 상세에서 전시명, 기간, 관람료, 운영시간 확인; 도슨트 공지 없음",
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010007",
    recommendedRank: 7,
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
    owner: "TOP 7",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1556711",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EB%82%A8%EC%84%9C%EC%9A%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "남서울미술관에서 열리는 한국 대표 조각가전입니다. 7월 29일 개막 후 8월 모임 후보로 안정적입니다.",
    recommendation: "사당역 접근성이 좋아 모임 동선이 편하고, 조각 중심 전시라 회화 전시와 다른 결을 줍니다.",
    notes: "미술관 내 주차 불가. 인근 사당 공영주차장 이용.",
    ratingReason: "8월 일정 안정성, 교통 접근성, 조각 장르의 차별성이 좋음.",
    sourceLabel: "SeMA 공식 전시 상세·남서울미술관 방문안내",
    verificationNote: "SeMA 공식 상세에서 전시명, 기간, 관람료, 매일 13:00 도슨트 확인",
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010008",
    recommendedRank: 8,
    verified: true,
    status: "공유완료",
    region: "노원/도봉/강북",
    type: "전시",
    title: "유휴공간 전시 《보편타당한 당신 ― 심이다은》",
    genre: "동시대미술",
    startDate: "2026-06-25",
    endDate: "2027-04-11",
    visitDate: "2026-08-29",
    time: "화-목 10:00-20:00, 금 10:00-21:00, 토/일/공휴일 10:00-19:00, 월 휴관",
    venue: "서울시립 북서울미술관",
    address: "서울 노원구 동일로 1238",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "5분 250원(시간당 3,000원), 월요일 무료. 요일제 운영",
    docent: "도슨트 미운영",
    docentTime: "본 전시는 도슨트를 운영하지 않습니다.",
    difficulty: "가볍게",
    rating: "4",
    owner: "TOP 8",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1549929",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EB%B6%81%EC%84%9C%EC%9A%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "북서울미술관의 유휴공간 전시입니다. 전시 기간이 길어 8월 말까지 일정 조율이 쉽습니다.",
    recommendation: "다른 북서울미술관 전시와 함께 묶어 보기 좋은 보조 추천작입니다.",
    notes: "북서울미술관 주차는 유료이며 요일별 5부제 적용.",
    ratingReason: "일정 여유가 크고 북서울권 회원 접근성이 좋음.",
    sourceLabel: "SeMA 공식 전시 상세·북서울미술관 방문안내",
    verificationNote: "SeMA 공식 상세에서 전시명, 기간, 관람료, 도슨트 미운영 확인",
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010009",
    recommendedRank: 9,
    verified: true,
    status: "공유완료",
    region: "강서/양천",
    type: "전시",
    title: "서울식물원 여름행사 《식물원은 미술관: 프리다가 사랑한 식물들》",
    genre: "식물·예술, 전시·문화행사",
    startDate: "2026-07-15",
    endDate: "2026-08-17",
    visitDate: "2026-07-25",
    time: "10:00-17:00, 매주 월요일 휴관",
    venue: "서울식물원 식물문화센터",
    address: "서울 강서구 마곡동로 161",
    price: 0,
    priceType: "전시 무료, 일부 체험·강연은 프로그램별 상이",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음. 일부 체험·강연 참가비는 프로그램별 안내 확인",
    parking: "가능",
    parkingFee: "08:00-21:00(지상 주차장은 24시간), 승용차 5분당 150원(시간당 1,800원). 주차장 협소",
    docent: "도슨트 강연·저자강연 운영",
    docentTime: "상설 정기 도슨트는 없으며 도슨트 강연·저자 강연은 별도 프로그램으로 운영(공식 행사 상세에 고정 회차 미공개)",
    difficulty: "가볍게",
    rating: "5",
    owner: "TOP 9",
    infoUrl: "https://botanicpark.seoul.go.kr/front/board/newsView.do?sn=19301",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9D%EB%AC%BC%EC%9B%90%20%EC%8B%9D%EB%AC%BC%EB%AC%B8%ED%99%94%EC%84%BC%ED%84%B0",
    summary: "프리다 칼로가 사랑한 꽃과 식물을 주제로 전시·공간 연출과 음악회, 영화, 도슨트 강연, 체험 프로그램을 함께 즐기는 서울식물원 여름행사입니다.",
    recommendation: "전시와 식물원 산책, 도슨트·체험 프로그램을 함께 구성할 수 있어 동호회 모임에 특히 좋습니다.",
    notes: "서울식물원 공식 안내 기준. 행사 세부 프로그램과 참가비는 공식 공지·프로그램별 안내에서 재확인하세요.",
    ratingReason: "전시·식물원 산책·도슨트·체험 프로그램을 함께 구성할 수 있어 단체 모임 적합성이 높음.",
    sourceLabel: "서울식물원 공식 행사 안내",
    verificationNote: "서울식물원 공식 안내에서 행사 기간, 운영시간, 프로그램, 주차료 확인",
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010010",
    recommendedRank: 10,
    verified: true,
    status: "공유완료",
    region: "종로/중구",
    type: "전시",
    title: "《알렉사에게》",
    genre: "동시대미술, 인공지능, 아카이브",
    startDate: "2026-03-26",
    endDate: "2026-07-26",
    visitDate: "2026-07-25",
    time: "화-금 10:00-20:00, 토·일·공휴일 10:00-19:00, 월요일·1월 1일 휴관. 관람 종료 1시간 전 입장 마감",
    venue: "서울시립 미술아카이브 모음동",
    address: "서울 종로구 평창문화로 101",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "화-일 5분당 150원, 1일(8시간) 최대 14,400원. 주차장 협소·승용차 5부제 시행",
    docent: "정기 전시해설 운영",
    docentTime: "매주 화-일 13:00, 14:00, 15:00. 휴관일·전시 개막일 미운영",
    difficulty: "가볍게",
    rating: "4",
    owner: "TOP 10",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1513028",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EB%AF%B8%EC%88%A0%EC%95%84%EC%B9%B4%EC%9D%B4%EB%B8%8C",
    summary: "인공지능과 검색 알고리즘이 정보를 재구성하는 방식을 영상, 조각, 사진, 회화, 아카이브 등으로 되짚는 전시입니다.",
    recommendation: "7월 26일까지라 이번 주말 우선 후보입니다. 하루 세 차례 정기 해설이 있어 전시 주제를 함께 이해하기 좋습니다.",
    notes: "7월 26일 종료. 주차장이 협소하고 승용차 5부제를 시행하므로 대중교통 이용을 권장합니다.",
    ratingReason: "무료 관람, 하루 3회 해설, 인공지능이라는 시의성 있는 주제가 모임 대화에 적합함.",
    sourceLabel: "SeMA 공식 전시 상세·미술아카이브 방문안내",
    verificationNote: "공식 상세에서 기간, 운영시간, 관람료, 도슨트 3회차 확인; 방문안내에서 주차요금·5부제 확인",
    updatedAt: "2026-07-20",
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
    infoUrl: "https://www.namuk.or.kr/kr/1332/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGa3IlMkY5NSUyRjE4NTYlMkZhcnRjbFZpZXcuZG8lM0Y%3D",
    mapUrl: "https://map.kakao.com/?q=%EA%B5%AD%EB%A6%BD%EB%86%8D%EC%97%85%EB%B0%95%EB%AC%BC%EA%B4%80%20%EC%88%98%EC%9B%90",
    summary: "꽃이 자연에서 삶, 문화, 산업으로 이어지는 과정을 회화와 공예 등 소장품으로 살펴보는 전시입니다.",
    recommendation: "무료 전시이고 기간이 길어 수원권 회원과 가볍게 모이기 좋습니다. 꽃과 생활문화 주제라 대화 소재도 편안합니다.",
    notes: "국립농업박물관 공식 전시·오시는 길 안내 기준. 전시해설 예약 여부는 방문 전 확인하세요.",
    ratingReason: "무료, 긴 전시 기간, 생활문화 주제의 접근성이 좋음.",
    sourceLabel: "국립농업박물관 공식 전시 공지",
    verificationNote: "공식 상세에서 전시명, 기간, 운영시간, 장소, 관람료 확인; 공식 오시는 길에서 무료 주차와 206대 확인",
    updatedAt: "2026-07-20",
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
    updatedAt: "2026-07-20",
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
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010301",
    recommendedRank: 301,
    verified: true,
    status: "공유완료",
    region: "인천",
    type: "전시",
    title: "박신양 작가 초대전 《제4의 벽》",
    genre: "회화, 표현주의, 기획초대전",
    startDate: "2026-07-09",
    endDate: "2026-08-02",
    visitDate: "2026-08-01",
    time: "10:00-18:00(17:30 입장 마감), 전시 기간 중 휴관 없음",
    venue: "인천문화예술회관 대전시실",
    address: "인천광역시 남동구 예술로 149",
    price: 0,
    priceType: "무료",
    discount: "무료 전시: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "전시 관람객 로비 사전정산기 이용 시 1,500원. 일반요금 최초 30분 600원, 이후 15분당 300원, 전일 6,000원",
    docent: "도슨트 프로그램과 박신양 작가 아티스트 토크 운영",
    docentTime: "아티스트 토크 2026-08-01 14:00(예약 필수, 1회차 7월 18일 종료). 일반 도슨트는 고정 회차 미공지",
    difficulty: "가볍게",
    rating: "5",
    owner: "인천 추천 1",
    infoUrl: "https://www.incheon.go.kr/art/ART010201/view?progrmSn=10823&resveGroupSn=25&resveProgrmSeCode=C",
    mapUrl: "https://map.kakao.com/?q=%EC%9D%B8%EC%B2%9C%EB%AC%B8%ED%99%94%EC%98%88%EC%88%A0%ED%9A%8C%EA%B4%80%20%EB%8C%80%EC%A0%84%EC%8B%9C%EC%8B%A4",
    summary: "박신양 작가가 14년간 작업한 회화 120여 점을 통해 작가와 관객 사이의 심리적 벽을 허물고 소통을 시도하는 기획 초대전입니다.",
    recommendation: "무료 대규모 회화전이며 8월 1일 작가 토크가 남아 있어 인천 모임 대표 후보로 추천합니다.",
    notes: "초등학생 이상 관람. 전시는 예약 없이 관람할 수 있으나 아티스트 토크는 선착순 예약이 필요합니다.",
    ratingReason: "무료 대규모 기획전, 남은 작가 토크 회차, 명확한 주차 정보와 대중교통 접근성이 강점.",
    sourceLabel: "인천문화예술회관 공식 전시·아티스트 토크·주차 안내",
    verificationNote: "공식 상세에서 기간, 운영시간, 휴관 없음, 무료, 아티스트 토크 예약 조건 확인; 공식 이미지에서 8월 1일 14:00 회차 확인",
    updatedAt: "2026-07-20",
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
    updatedAt: "2026-07-20",
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
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010201",
    recommendedRank: 11,
    status: "공유완료",
    region: "강남/서초",
    type: "공연",
    title: "디즈니 판타지아 인 콘서트",
    genre: "클래식, 영화음악, 오케스트라",
    startDate: "2026-08-04",
    endDate: "2026-08-04",
    visitDate: "2026-08-04",
    time: "2026-08-04 19:30 (100분, 인터미션 15분 포함)",
    venue: "예술의전당 콘서트홀",
    address: "서울 서초구 남부순환로 2406",
    price: 0,
    priceType: "R석 100,000원, S석 80,000원, A석 60,000원, B석 40,000원",
    discount: "카드·통신사 제휴 할인 공지 없음. 후원·골드회원 10%, 블루·그린회원 5%, 장애인·국가유공자 등 50%(증빙 필수)",
    parking: "가능",
    parkingFee: "공연 관객 5시간 6,000원, 주말·공휴일 9,000원. 초과 시 일반요금 10분당 1,000원(주말·공휴일 1,500원)",
    docent: "공연: 도슨트 적용 대상 아님",
    docentTime: "별도 해설 프로그램 없음",
    difficulty: "사전예약",
    rating: "5",
    owner: "서울 음악 1",
    infoUrl: "https://www.sac.or.kr/site/main/show/show_view?SN=81252",
    mainUrl: "https://www.sac.or.kr/",
    mapUrl: "https://map.kakao.com/?q=%EC%98%88%EC%88%A0%EC%9D%98%EC%A0%84%EB%8B%B9%20%EC%BD%98%EC%84%9C%ED%8A%B8%ED%99%80",
    summary: "디즈니 애니메이션 《판타지아》와 《판타지아 2000》의 장면을 70인조 이상 오케스트라의 라이브 연주와 함께 감상하는 공연입니다.",
    recommendation: "클래식 입문자도 즐기기 쉬운 영화음악 공연으로, 모임 구성원의 취향 폭이 넓을 때 특히 좋습니다.",
    notes: "초등학생 이상 관람가. 할인 증빙 미지참 시 현장 차액을 내야 합니다.",
    ratingReason: "대중성, 오케스트라 규모, 공식 예매 정보의 명확성, 단체 관람 적합성이 높음.",
    sourceLabel: "예술의전당 공식 공연 상세·주차 안내",
    verificationNote: "공식 상세에서 일시, 러닝타임, 좌석별 관람료, 할인과 주차요금 확인",
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010202",
    recommendedRank: 104,
    status: "공유완료",
    region: "수원/경기",
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
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010203",
    recommendedRank: 12,
    status: "공유완료",
    region: "송파/강동",
    type: "공연",
    title: "롯데콘서트홀 추천: 지브리&디즈니 영화음악 FESTA (8/9)",
    genre: "영화음악, 오케스트라",
    startDate: "2026-08-09",
    endDate: "2026-08-09",
    visitDate: "2026-08-09",
    time: "2026-08-09 13:30, 18:00 (120분, 인터미션 15분)",
    venue: "롯데콘서트홀",
    address: "서울 송파구 올림픽로 300 롯데월드몰 8층",
    price: 0,
    priceType: "R석 120,000원, S석 100,000원, A석 80,000원, B석 70,000원 (시야방해석 별도)",
    discount: "카드·통신사 제휴 할인 공지 없음. 4인 25%, 3인 20%, 2인 15% 패키지, 학생 15%, 얼리버드 25~30%, 장애인·국가유공자 50%(조건·증빙 확인)",
    parking: "가능",
    parkingFee: "당일 티켓 소지자 4시간 정액 4,800원. 초과 시 10:00-20:00 10분당 500원, 그 외 10분당 200원",
    docent: "공연: 도슨트 적용 대상 아님",
    docentTime: "별도 해설 프로그램 없음",
    difficulty: "사전예약",
    rating: "4",
    owner: "서울 음악 3",
    infoUrl: "https://nol.yanolja.com/ticket/products/26006406",
    linkLabel: "롯데콘서트홀 연동 NOL 예매",
    mainUrl: "https://www.lotteconcerthall.com/product/ko/performance/year",
    mapUrl: "https://map.kakao.com/?q=%EB%A1%AF%EB%8D%B0%EC%BD%98%EC%84%9C%ED%8A%B8%ED%99%80",
    summary: "스튜디오 지브리와 디즈니 영화음악을 서울 페스타 필하모닉 오케스트라의 연주로 감상하는 공연입니다.",
    recommendation: "회원들이 함께 즐기기 쉬운 친숙한 영화음악 공연으로, 8월 모임 후보에 추천합니다.",
    notes: "롯데콘서트홀과 연동 판매되는 NOL 티켓 공연 전용 페이지에서 예매·잔여석을 확인하세요.",
    ratingReason: "영화음악의 대중성, 단체 관람 적합성, 롯데콘서트홀 접근성을 기준으로 한 모임 추천 별점.",
    sourceLabel: "롯데콘서트홀 공식 일정·주차 안내 및 연동 NOL 예매",
    verificationNote: "공식 일정과 연동 예매에서 일시, 러닝타임, 관람료, 할인 확인; 공식 주차 안내에서 요금 확인",
    updatedAt: "2026-07-20",
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
    updatedAt: "2026-07-20",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010205",
    recommendedRank: 305,
    status: "공유완료",
    region: "인천",
    type: "공연",
    title: "인천시립청소년교향악단 창단연주회 《IYPO, The New Wave》",
    genre: "클래식, 청소년 오케스트라",
    startDate: "2026-07-25",
    endDate: "2026-07-25",
    visitDate: "2026-07-25",
    time: "2026-07-25 17:00",
    venue: "인천문화예술회관 대공연장",
    address: "인천광역시 남동구 예술로 149",
    price: 0,
    priceType: "무료(사전 예약 필수, 1인 4매)",
    discount: "무료 공연: 카드·통신사 할인 적용 대상 없음",
    parking: "가능",
    parkingFee: "공연장 로비 사전정산기 이용 시 1,500원. 일반요금 최초 30분 600원, 이후 15분당 300원",
    docent: "공연: 도슨트 적용 대상 아님",
    docentTime: "별도 해설 프로그램 없음",
    difficulty: "사전예약",
    rating: "4",
    owner: "인천 음악 2",
    infoUrl: "https://www.incheon.go.kr/art/ART010101/view?progrmSn=10818&resveGroupSn=5&resveProgrmSeCode=C",
    mainUrl: "https://www.incheon.go.kr/art/",
    mapUrl: "https://map.kakao.com/?q=%EC%9D%B8%EC%B2%9C%EB%AC%B8%ED%99%94%EC%98%88%EC%88%A0%ED%9A%8C%EA%B4%80%20%EB%8C%80%EA%B3%B5%EC%97%B0%EC%9E%A5",
    summary: "인천시립청소년교향악단의 창단 및 제1회 정기연주회로, 전석 무료 사전예약 공연입니다.",
    recommendation: "비용 부담 없이 단체 관람하기 좋은 인천 음악공연이며, 청소년 오케스트라의 첫 무대를 함께 볼 수 있습니다.",
    notes: "8세 이상 관람가. 무료 지정석이며 사전 예약이 필수입니다.",
    ratingReason: "무료 관람, 지역 초연성, 토요일 시간대, 대공연장 접근성이 좋음.",
    sourceLabel: "인천문화예술회관 공식 공연 상세·주차 안내",
    verificationNote: "공식 상세에서 일시, 무료 사전예약 조건, 장소 확인; 공식 주차 안내에서 요금 확인",
    updatedAt: "2026-07-20",
  },
];

const fields = [
  "status", "region", "type", "title", "genre", "startDate", "endDate", "visitDate", "time",
  "venue", "address", "price", "priceType", "parking", "difficulty", "rating", "owner",
  "infoUrl", "mapUrl", "summary", "recommendation", "notes", "ratingReason",
];

let events = [];
const supportedAreas = ["서울", "경기", "인천"];
let activeArea = "서울";
const boardUpdatedAt = "2026.07.20 21:10";
const dataUpdatedAt = "2026-07-20";

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
  weeklyShareTitle: $("#weeklyShareTitle"),
  shareMeta: $("#shareMeta"),
  exhibitionPageTitle: $("#exhibitionPageTitle"),
  dialog: $("#eventDialog"),
  form: $("#eventForm"),
  dialogTitle: $("#dialogTitle"),
  deleteButton: $("#deleteButton"),
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
  applyConfig();
  elements.boardUpdatedAt.textContent = `최종 업데이트: ${boardUpdatedAt}`;
  populateSelect("#regionFilter", options.regions, true);
  populateSelect("#typeFilter", options.types, true);
  populateSelect("#statusFilter", options.statuses, true);
  populateSelect("#parkingFilter", options.parking, true);
  populateSelect("#status", options.statuses);
  populateSelect("#region", options.regions);
  populateSelect("#type", options.types);
  populateSelect("#priceType", options.priceTypes);
  populateSelect("#parking", options.parking);
  populateSelect("#difficulty", options.difficulty);
  populateSelect("#rating", ["", "1", "2", "3", "4", "5"], false, "관람 후 입력");

  $("#openFormButton").addEventListener("click", () => openDialog());
  $("#closeDialogButton").addEventListener("click", closeDialog);
  $("#cancelButton").addEventListener("click", closeDialog);
  $("#resetButton").addEventListener("click", resetFilters);
  $("#exportCsvButton").addEventListener("click", exportCsv);
  elements.copyKakaoButton.addEventListener("click", copyKakaoShare);
  elements.form.addEventListener("submit", saveFromForm);
  elements.deleteButton.addEventListener("click", deleteCurrentEvent);
  elements.areaTabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveArea(tab.dataset.area));
  });

  Object.values(elements.filters).forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });

  events = await loadEvents();
  render();
}

function applyConfig() {
  if (config.sheetUrl) {
    $("#sheetLink").href = config.sheetUrl;
  }
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

  try {
    const saved = localStorage.getItem(storageKey);
    return mergeRecommendedEvents(saved ? JSON.parse(saved) : sampleEvents);
  } catch {
    return mergeRecommendedEvents(sampleEvents);
  }
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(events));
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
    const isCurrent = !event.endDate || event.endDate >= dataUpdatedAt;
    return !isRecommended && isCurrent;
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

function eventArea(event) {
  const location = [event.area, event.region, event.address, event.venue].filter(Boolean).join(" ");
  if (location.includes("인천")) return "인천";
  if (location.includes("경기") || location.includes("수원")) return "경기";
  return "서울";
}

function render() {
  const list = filteredEvents();
  elements.weeklyShareTitle.textContent = `${activeArea} 7~8월 추천 목록`;
  elements.shareMeta.textContent = `2026.07.20 기준. ${activeArea} 추천 정보는 모임 전 공식 페이지에서 일정, 휴관일, 예매, 주차 정보를 다시 확인하세요.`;
  elements.exhibitionPageTitle.textContent = `${activeArea} 추천 전시·음악공연`;
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
          ${event.infoUrl ? `<a href="${escapeAttribute(event.infoUrl)}" target="_blank" rel="noopener">링크</a>` : ""}
          <button type="button" data-edit="${event.id}">수정</button>
        </div>
      </td>
    </tr>
  `).join("");

  elements.rows.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => openDialog(button.dataset.edit));
  });
}

function renderCards(list) {
  elements.cards.innerHTML = list.map((event) => `
    <article class="event-card">
      <div class="card-head">
        ${statusPill(event.status)}
        <button class="button tertiary" type="button" data-edit="${event.id}">수정</button>
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

  elements.cards.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => openDialog(button.dataset.edit));
  });
}

function renderExhibitionPage(list) {
  const groups = [
    { type: "전시", title: "추천 전시", subtitle: `공식 상세 페이지로 확인한 ${activeArea} 7~8월 전시`, max: 10 },
    { type: "공연", title: "추천 음악공연", subtitle: `공식 공연장 일정 페이지에서 고르는 ${activeArea} 7~8월 공연 후보`, max: 10 },
  ];

  elements.exhibitionPageCards.innerHTML = groups.map((group) => {
    const items = list.filter((event) => event.type === group.type).slice(0, group.max);
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
          ${items.map((event, index) => renderRecommendationCard(event, index)).join("")}
        </div>
      </section>
    `;
  }).join("");

}

function renderRecommendationCard(event, index) {
  return `
    <article class="exhibition-card">
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
          ${event.type === "공연" ? "" : detailItem("도슨트 운영시간", formatDocentTime(event))}
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
  const list = topRecommendedEvents();
  const lines = [
    `[${activeArea} 7~8월 추천 전시·음악공연]`,
    "2026.07.20 기준 / 모임 전 공식 페이지 재확인",
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

  lines.push("업데이트 원칙: 매주 모임 전 일정, 휴관일, 예매, 도슨트, 주차 정보를 공식 페이지 기준으로 갱신");
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

function openDialog(id = "") {
  const event = id ? events.find((item) => item.id === id) : null;
  elements.dialogTitle.textContent = event ? "공연·전시 정보 수정" : "새 공연·전시 추가";
  elements.deleteButton.hidden = !event;
  $("#eventId").value = event?.id || "";

  fields.forEach((field) => {
    const input = $(`#${field}`);
    if (input) input.value = event?.[field] ?? "";
  });

  if (!event) {
    $("#status").value = "검토중";
    $("#region").value = "서울 전체";
    $("#type").value = "전시";
    $("#priceType").value = "유료";
    $("#parking").value = "확인 필요";
    $("#difficulty").value = "가볍게";
  }

  elements.dialog.showModal();
}

function closeDialog() {
  elements.dialog.close();
  elements.form.reset();
}

async function saveFromForm(event) {
  event.preventDefault();
  const id = $("#eventId").value || crypto.randomUUID();
  const payload = { id, updatedAt: new Date().toISOString().slice(0, 10) };

  fields.forEach((field) => {
    const input = $(`#${field}`);
    payload[field] = input?.value.trim() || "";
  });

  payload.price = Number(payload.price || 0);

  try {
    const saved = supabase
      ? await supabase.upsert(payload)
      : payload;

    const existingIndex = events.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      events[existingIndex] = saved;
    } else {
      events.unshift(saved);
    }

    if (!supabase) persist();
  } catch (error) {
    console.error("Save failed.", error);
    alert("저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    return;
  }

  closeDialog();
  render();
}

async function deleteCurrentEvent() {
  const id = $("#eventId").value;
  if (!id) return;

  try {
    if (supabase) await supabase.remove(id);
    events = events.filter((event) => event.id !== id);
    if (!supabase) persist();
  } catch (error) {
    console.error("Delete failed.", error);
    alert("삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    return;
  }

  closeDialog();
  render();
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
    "Content-Type": "application/json",
  };

  async function request(path = "", init = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...headers,
        Prefer: "return=representation",
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase ${response.status}: ${await response.text()}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  return {
    async list() {
      const rows = await request("?select=*&order=visit_date.asc.nullslast&order=start_date.asc.nullslast");
      return rows.map(fromDbEvent);
    },
    async upsert(event) {
      const isExisting = events.some((item) => item.id === event.id);
      const payload = toDbEvent(event);
      const rows = isExisting
        ? await request(`?id=eq.${encodeURIComponent(event.id)}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await request("", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      return fromDbEvent(rows[0]);
    },
    async remove(id) {
      await request(`?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
}

function toDbEvent(event) {
  return {
    id: event.id,
    status: event.status || "검토중",
    region: event.region || "서울 전체",
    type: event.type || "전시",
    title: event.title,
    genre: event.genre || null,
    start_date: event.startDate || null,
    end_date: event.endDate || null,
    visit_date: event.visitDate || null,
    time: event.time || null,
    venue: event.venue || null,
    address: event.address || null,
    price: Number(event.price || 0),
    price_type: event.priceType || "유료",
    parking: event.parking || "확인 필요",
    difficulty: event.difficulty || "가볍게",
    rating: event.rating ? Number(event.rating) : null,
    owner: event.owner || null,
    info_url: event.infoUrl || null,
    map_url: event.mapUrl || null,
    summary: event.summary || null,
    recommendation: event.recommendation || null,
    notes: event.notes || null,
    rating_reason: event.ratingReason || null,
  };
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
