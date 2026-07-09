const options = {
  statuses: ["검토중", "공유완료", "관람예정", "관람완료", "보류", "취소"],
  regions: ["서울 전체", "종로/중구", "강남/서초", "마포/서대문", "용산/성동", "송파/강동", "영등포/구로", "동대문/성북", "노원/도봉/강북", "강서/양천", "관악/동작/금천"],
  types: ["전시", "공연", "기타"],
  priceTypes: ["무료", "유료", "할인 확인", "초대/이벤트"],
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
    title: "The Cubists: Inventing Modern Vision",
    genre: "입체주의, 근현대미술",
    startDate: "2026-06-04",
    endDate: "2026-10-04",
    visitDate: "2026-07-18",
    time: "운영시간 확인 필요",
    venue: "센터 퐁피두 한화",
    address: "서울 영등포구 63빌딩 일대",
    price: 0,
    priceType: "확인 필요",
    parking: "확인 필요",
    difficulty: "긴 관람",
    rating: "",
    owner: "",
    infoUrl: "https://www.wallpaper.com/architecture/centre-pompidou-hanwha-korea",
    mapUrl: "",
    summary: "센터 퐁피두 한화 개관전. 1907~1927년 입체주의 흐름을 중심으로 피카소, 브라크, 후안 그리스 등 주요 작가를 소개하는 전시입니다.",
    recommendation: "7~8월 모임의 대표 후보로 적합합니다. 대형 개관전이라 사전 예매와 혼잡도 확인을 권장합니다.",
    notes: "출처: Wallpaper 보도 및 Centre Pompidou Hanwha 관련 공개 정보. 공식 예매/운영시간은 방문 전 재확인하세요.",
    ratingReason: "",
    updatedAt: "2026-07-09",
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
    status: "공유완료",
    region: "종로/중구",
    type: "전시",
    title: "2026년 한국 근대 거장전 《유영국: 산은 내 안에 있다》",
    genre: "한국 추상미술, 회고전",
    startDate: "2026-05-19",
    endDate: "2026-10-25",
    visitDate: "2026-07-25",
    time: "화-목 10:00-20:00, 금 10:00-21:00, 토/일/공휴일 10:00-19:00, 월 휴관",
    venue: "서울시립미술관 서소문본관",
    address: "서울 중구 덕수궁길 61",
    price: 0,
    priceType: "무료",
    discount: "유료전시일 경우 관람자 최초 20분 주차요금 면제. 장애인, 국가유공자, 경차, 저공해차, 다둥이카드 등 주차 할인.",
    parking: "가능",
    docent: "오디오 가이드와 연계 프로그램 운영. 전시해설 일정은 공식 페이지 확인.",
    difficulty: "긴 관람",
    rating: "5",
    owner: "TOP 1",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/landing?whatChoice2=N&whatChoice3=N&whatChoice4=N&whatChoice5=N&whatsonMenuDivList=EX&whenType=ALL_DAY",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%EB%AF%B8%EC%88%A0%EA%B4%80%20%EC%84%9C%EC%86%8C%EB%AC%B8%EB%B3%B8%EA%B4%80",
    summary: "유영국 탄생 110주년을 맞아 미공개작 포함 170여 점과 아카이브로 작가의 60여 년 예술 세계를 조망하는 대형 회고전입니다.",
    recommendation: "모임 대표 관람작으로 가장 추천. 한국 추상미술을 깊게 보기에 좋고, 관람 후 대화 소재가 풍부합니다.",
    notes: "SeMA 서소문본관 주차장은 협소하고 5부제를 시행하므로 대중교통 우선 권장.",
    ratingReason: "작품 규모, 작가 중요도, 연계 프로그램, 모임 대화성 모두 높음.",
    sourceLabel: "SeMA 공식 전시 목록·보도자료",
    updatedAt: "2026-07-09",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010002",
    recommendedRank: 2,
    status: "공유완료",
    region: "영등포/구로",
    type: "전시",
    title: "The Cubists: Inventing Modern Vision",
    genre: "입체주의, 근현대미술",
    startDate: "2026-06-04",
    endDate: "2026-10-04",
    visitDate: "2026-08-01",
    time: "운영시간은 공식 예매 페이지 확인",
    venue: "센터 퐁피두 한화 서울",
    address: "서울 영등포구 63로 50, 63빌딩 별관",
    price: 28000,
    priceType: "유료",
    discount: "할인권, 패키지, 주차 할인은 예매처 확인 필요.",
    parking: "확인 필요",
    docent: "전시해설·오디오가이드 여부는 예매처 확인.",
    difficulty: "사전예약",
    rating: "5",
    owner: "TOP 2",
    infoUrl: "https://www.wallpaper.com/architecture/centre-pompidou-hanwha-korea",
    mapUrl: "https://map.kakao.com/?q=%EC%84%BC%ED%84%B0%20%ED%90%81%ED%94%BC%EB%91%90%20%ED%95%9C%ED%99%94%20%EC%84%9C%EC%9A%B8",
    summary: "센터 퐁피두 한화 서울 개관전. 1907~1927년 입체주의 흐름을 피카소, 브라크, 후안 그리스 등 주요 작가 중심으로 소개합니다.",
    recommendation: "신규 미술관 개관전이라 화제성이 높고, 7~8월 유료 특별전 후보로 가장 강합니다.",
    notes: "보도 기준 일반권 28,000원. 운영시간, 할인, 주차, 혼잡도는 방문 전 예매처에서 재확인.",
    ratingReason: "국제 컬렉션, 개관전 화제성, 작품 대중성이 높음.",
    sourceLabel: "Wallpaper·Le Monde 보도",
    updatedAt: "2026-07-09",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010003",
    recommendedRank: 3,
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
    discount: "관람료 무료. 부설주차장은 운영체제 개편으로 이용 어려움.",
    parking: "불가",
    docent: "7월 18일 전시 연계 세미나가 있으며, 전시해설은 공식 페이지 확인.",
    difficulty: "가볍게",
    rating: "5",
    owner: "TOP 3",
    infoUrl: "https://sema.seoul.go.kr/kr/visit/photosema",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EC%82%AC%EC%A7%84%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "서울시립 사진미술관에서 열리는 마틴 파 전시로, 사진 중심 관람을 원하는 모임에 적합합니다.",
    recommendation: "새 사진미술관 방문과 함께 묶기 좋아 8월 모임 후보로 추천합니다.",
    notes: "창동역 도보권. 차량보다 대중교통 이용 권장.",
    ratingReason: "사진 장르의 접근성, 신설 미술관 방문성, 8월 일정 안정성이 좋음.",
    sourceLabel: "SeMA 사진미술관 공식 페이지",
    updatedAt: "2026-07-09",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010004",
    recommendedRank: 4,
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
    discount: "유료전시일 경우 관람자 최초 20분 주차요금 면제. 공공주차 할인 적용.",
    parking: "가능",
    docent: "퍼포먼스, 대담, 강연 등 연계 프로그램 운영.",
    difficulty: "긴 관람",
    rating: "4",
    owner: "TOP 4",
    infoUrl: "https://sema.seoul.go.kr/kr/bbs/611333/getBbsDetail?bbsNo=1533988",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%EB%AF%B8%EC%88%A0%EA%B4%80%20%EC%84%9C%EC%86%8C%EB%AC%B8%EB%B3%B8%EA%B4%80",
    summary: "난지미술창작스튜디오 10~19기 출신 작가 17명(팀)의 영상, 설치, 조각, 회화, 퍼포먼스 등 60여 점을 조망합니다.",
    recommendation: "동시대미술을 폭넓게 보고 싶은 모임에 적합합니다. 유영국전과 같은 날 묶어 보기 좋습니다.",
    notes: "서소문본관 주차 협소. 연계 프로그램 일정은 별도 확인.",
    ratingReason: "여러 작가와 매체를 한 번에 볼 수 있어 단체 관람 후 토론에 좋음.",
    sourceLabel: "SeMA 공식 전시 목록·보도자료",
    updatedAt: "2026-07-09",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010005",
    recommendedRank: 5,
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
    discount: "관람료 무료. 주차요금 경차, 저공해차, 다둥이카드 등 할인.",
    parking: "가능",
    docent: "어린이 해설 프로그램과 워크숍 운영.",
    difficulty: "가볍게",
    rating: "4",
    owner: "TOP 5",
    infoUrl: "https://sema.seoul.go.kr/kr/bbs/611333/getBbsDetail?bbsNo=1550497",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EB%B6%81%EC%84%9C%EC%9A%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "미디어 아티스트 권병준 개인전. 포옹을 시각화한 대형 로봇 작품과 AI 기반 사운드 작품을 중심으로 구성됩니다.",
    recommendation: "가족 동반 회원이나 미디어아트에 관심 있는 모임원에게 좋습니다.",
    notes: "북서울미술관은 주차 가능하지만 요일별 5부제 적용.",
    ratingReason: "체험성, 사운드, 어린이 친화 프로그램의 장점이 뚜렷함.",
    sourceLabel: "SeMA 북서울미술관 공식 페이지·보도자료",
    updatedAt: "2026-07-09",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010006",
    recommendedRank: 6,
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
    discount: "관람료 무료. 주차요금 5분당 250원, 일 최대 24,000원.",
    parking: "가능",
    docent: "전시해설 여부는 공식 페이지 확인.",
    difficulty: "가볍게",
    rating: "4",
    owner: "TOP 6",
    infoUrl: "https://sema.seoul.go.kr/kr/visit/seoseoul",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EC%84%9C%EC%84%9C%EC%9A%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "서울시립 서서울미술관 개관 특별 미디어 소장품전입니다. 7월 26일까지라 7월 모임 후보로 우선 검토하면 좋습니다.",
    recommendation: "새 미술관 탐방과 미디어 소장품전을 함께 경험할 수 있습니다.",
    notes: "입장마감은 관람 종료 30분 전. 7월 말 종료 전 방문 권장.",
    ratingReason: "신규 공립 미디어 특화 미술관의 개관 분위기를 볼 수 있음.",
    sourceLabel: "SeMA 공식 전시 목록·서서울미술관 방문안내",
    updatedAt: "2026-07-09",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010007",
    recommendedRank: 7,
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
    discount: "관람료 무료. 미술관 내 주차 시설 없음.",
    parking: "불가",
    docent: "전시해설 여부는 공식 페이지 확인.",
    difficulty: "가볍게",
    rating: "4",
    owner: "TOP 7",
    infoUrl: "https://sema.seoul.go.kr/kr/visit/namseoul",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EB%82%A8%EC%84%9C%EC%9A%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "남서울미술관에서 열리는 한국 대표 조각가전입니다. 7월 29일 개막 후 8월 모임 후보로 안정적입니다.",
    recommendation: "사당역 접근성이 좋아 모임 동선이 편하고, 조각 중심 전시라 회화 전시와 다른 결을 줍니다.",
    notes: "미술관 내 주차 불가. 인근 사당 공영주차장 이용.",
    ratingReason: "8월 일정 안정성, 교통 접근성, 조각 장르의 차별성이 좋음.",
    sourceLabel: "SeMA 공식 전시 목록·남서울미술관 방문안내",
    updatedAt: "2026-07-09",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010008",
    recommendedRank: 8,
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
    discount: "관람료 무료. 주차요금 경차, 저공해차, 다둥이카드 등 할인.",
    parking: "가능",
    docent: "전시해설 여부는 공식 페이지 확인.",
    difficulty: "가볍게",
    rating: "4",
    owner: "TOP 8",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/landing?whatChoice2=N&whatChoice3=N&whatChoice4=N&whatChoice5=N&whatsonMenuDivList=EX&whenType=ALL_DAY",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EB%B6%81%EC%84%9C%EC%9A%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "북서울미술관의 유휴공간 전시입니다. 전시 기간이 길어 8월 말까지 일정 조율이 쉽습니다.",
    recommendation: "다른 북서울미술관 전시와 함께 묶어 보기 좋은 보조 추천작입니다.",
    notes: "북서울미술관 주차는 유료이며 요일별 5부제 적용.",
    ratingReason: "일정 여유가 크고 북서울권 회원 접근성이 좋음.",
    sourceLabel: "SeMA 공식 전시 목록·북서울미술관 방문안내",
    updatedAt: "2026-07-09",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010009",
    recommendedRank: 9,
    status: "공유완료",
    region: "노원/도봉/강북",
    type: "전시",
    title: "《글짓, 쓰는 예술》",
    genre: "동시대미술, 텍스트, 설치",
    startDate: "2026-04-23",
    endDate: "2026-07-12",
    visitDate: "2026-07-11",
    time: "화-목 10:00-20:00, 금 10:00-21:00, 토/일/공휴일 10:00-19:00, 월 휴관",
    venue: "서울시립 북서울미술관",
    address: "서울 노원구 동일로 1238",
    price: 0,
    priceType: "무료",
    discount: "관람료 무료. 주차요금 경차, 저공해차, 다둥이카드 등 할인.",
    parking: "가능",
    docent: "다양한 연계 프로그램 예정. 전시해설 여부는 공식 페이지 확인.",
    difficulty: "가볍게",
    rating: "4",
    owner: "TOP 9",
    infoUrl: "https://sema.seoul.go.kr/kr/bbs/611333/getBbsDetail?bbsNo=1532704",
    mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%8B%9C%EB%A6%BD%20%EB%B6%81%EC%84%9C%EC%9A%B8%EB%AF%B8%EC%88%A0%EA%B4%80",
    summary: "글쓰기를 미술의 재료로 삼는 10인(팀)의 작가가 펼치는 전시입니다.",
    recommendation: "7월 12일까지라 이번 주 긴급 후보. 글과 시각예술을 함께 보는 모임에 좋습니다.",
    notes: "종료 임박. 방문 가능 여부를 먼저 확인하세요.",
    ratingReason: "주제는 좋지만 종료가 임박해 일정 리스크가 있음.",
    sourceLabel: "SeMA 공식 전시 목록·보도자료",
    updatedAt: "2026-07-09",
  },
  {
    id: "79c9f5b1-8684-4c2e-89be-a71bc5010010",
    recommendedRank: 10,
    status: "공유완료",
    region: "서울 전체",
    type: "전시",
    title: "[2026 신진미술인 지원] 허수인 개인전 《사적인 프로토콜》",
    genre: "동시대미술, 신진작가",
    startDate: "2026-07-01",
    endDate: "2026-07-18",
    visitDate: "2026-07-12",
    time: "운영시간과 세부 장소는 공식 상세 페이지 확인",
    venue: "서울시립미술관 신진미술인 지원 프로그램",
    address: "서울 세부 장소 공식 페이지 확인",
    price: 0,
    priceType: "무료",
    discount: "관람료와 할인은 상세 페이지 확인.",
    parking: "확인 필요",
    docent: "작가/전시해설 여부는 공식 페이지 확인.",
    difficulty: "가볍게",
    rating: "3",
    owner: "TOP 10",
    infoUrl: "https://sema.seoul.go.kr/kr/whatson/landing?whatChoice2=N&whatChoice3=N&whatChoice4=N&whatChoice5=N&whatsonMenuDivList=EX&whenType=ALL_DAY",
    mapUrl: "",
    summary: "서울시립미술관 2026 신진미술인 지원 프로그램 전시입니다.",
    recommendation: "짧은 기간 전시라 신진작가 전시에 관심 있는 회원에게 빠르게 공유하면 좋습니다.",
    notes: "7월 18일까지. 세부 장소, 예약, 관람료는 공식 상세 페이지 확인 필요.",
    ratingReason: "발견성은 높지만 세부 정보 확인이 필요해 보조 후보로 추천.",
    sourceLabel: "SeMA 공식 전시 목록",
    updatedAt: "2026-07-09",
  },
];

const fields = [
  "status", "region", "type", "title", "genre", "startDate", "endDate", "visitDate", "time",
  "venue", "address", "price", "priceType", "parking", "difficulty", "rating", "owner",
  "infoUrl", "mapUrl", "summary", "recommendation", "notes", "ratingReason",
];

let events = [];

const $ = (selector) => document.querySelector(selector);

const elements = {
  rows: $("#eventRows"),
  cards: $("#eventCards"),
  empty: $("#emptyState"),
  resultCount: $("#resultCount"),
  kakaoShareText: $("#kakaoShareText"),
  copyKakaoButton: $("#copyKakaoButton"),
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
      id: existing?.id || event.id,
    };
  });

  const extras = originals.filter((event) => !recommendedTitles.has(normalizeTitle(event.title)));
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

function render() {
  const list = filteredEvents();
  renderMetrics();
  renderKakaoShare();
  renderRows(list);
  renderCards(list);
  elements.resultCount.textContent = `${list.length}건`;
  elements.empty.hidden = list.length > 0;
}

function renderMetrics() {
  const ratings = events.map((event) => Number(event.rating)).filter(Boolean);
  const avg = ratings.length
    ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
    : "-";

  $("#metricTotal").textContent = events.length;
  $("#metricPlanned").textContent = events.filter((event) => event.status === "관람예정").length;
  $("#metricFree").textContent = events.filter((event) => event.priceType === "무료" || event.priceType === "초대/이벤트").length;
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
  if (event.priceType === "무료" || price === 0) return "무료";
  return `${price.toLocaleString("ko-KR")}원`;
}

function formatParkingDocent(event) {
  const parking = escapeHtml(event.parking || "-");
  const docent = event.docent ? `<span class="sub-note">도슨트 ${escapeHtml(event.docent)}</span>` : "";
  return `${parking}${docent}`;
}

function formatStars(rating) {
  const value = Math.max(0, Math.min(5, Number(rating || 0)));
  if (!value) return "-";
  return `${"★".repeat(value)}${"☆".repeat(5 - value)}`;
}

function topRecommendedEvents(source = events) {
  return [...source]
    .filter((event) => event.type === "전시")
    .sort((a, b) => {
      const rankDiff = Number(a.recommendedRank || 999) - Number(b.recommendedRank || 999);
      if (rankDiff) return rankDiff;
      const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
      if (ratingDiff) return ratingDiff;
      return (a.visitDate || a.startDate || "").localeCompare(b.visitDate || b.startDate || "");
    })
    .slice(0, 10);
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
    "[서울 7~8월 추천 전시 TOP 10]",
    "2026.07.09 기준 / 모임 전 공식 페이지 재확인",
    "",
  ];

  list.forEach((event, index) => {
    lines.push(`${index + 1}. ${formatStars(event.rating)} ${event.title}`);
    lines.push(`   일정: ${formatShareDateRange(event)} / 운영: ${event.time || "확인 필요"}`);
    lines.push(`   장소: ${event.venue || "-"} (${event.address || "주소 확인 필요"})`);
    lines.push(`   관람료: ${formatSharePrice(event)} / 할인: ${event.discount || "확인 필요"}`);
    lines.push(`   도슨트: ${event.docent || "확인 필요"} / 주차: ${formatShareParking(event)}`);
    lines.push(`   추천: ${event.recommendation || event.summary || "-"}`);
    if (event.infoUrl) lines.push(`   링크: ${event.infoUrl}`);
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
