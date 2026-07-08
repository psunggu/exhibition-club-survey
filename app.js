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
      return remoteEvents;
    } catch (error) {
      console.warn("Supabase load failed. Falling back to local data.", error);
    }
  }

  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : sampleEvents;
  } catch {
    return sampleEvents;
  }
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(events));
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
      <td>${escapeHtml(event.parking || "-")}</td>
      <td>${event.rating ? `${event.rating}.0` : "-"}</td>
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
        <span>평점 ${event.rating || "-"}</span>
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
