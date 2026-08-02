(function () {
  "use strict";

  var DIGEST_URL = "weekly-digest.public.json?v=20260803-1";
  var COMPLETED_VISIBLE_DAYS = 3;
  var DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
  var FALLBACK_DIGEST = {
    "schema_version": 1,
    "bot_name": "주간 정리봇",
    "period_label": "7월 27일 ~ 8월 2일",
    "updated_label": "2026. 8. 2. 19:41 기준",
    "message_count": 300,
    "summary": "최근 7일 대화에서 확정 일정과 투표 중인 영화 모임, 추가 공연 참여 확인사항을 선별했습니다.",
    "highlights": [
      {
        "severity": "planning",
        "label": "투표 진행",
        "title": "영화 《오디세이》 정기관람",
        "text": "8월 9일 16:20 연남 CGV 2D와 8월 16일 14:00·17:30 영등포 타임스퀘어 IMAX가 후보입니다. 투표 종료 후 최종 날짜와 상영 시간을 확정해야 합니다."
      },
      {
        "severity": "check",
        "label": "참여 확인",
        "title": "8월 15일 무료 클래식 공연",
        "text": "오후 2시 세종문화회관 체임버홀 공연의 제한 좌석 참여자를 모집 중입니다. 최종 참석자와 주차 가능 여부 확인이 필요합니다."
      },
      {
        "severity": "check",
        "label": "세부 확인",
        "title": "8월 22일 서울역사박물관 정기관람",
        "text": "오후 3시부터 5시까지의 확정 일정입니다. 집결 장소, 진행 순서와 최종 참석자는 톡게시판에서 다시 확인해야 합니다."
      },
      {
        "severity": "planning",
        "label": "날짜 확정",
        "title": "가우디 서울전 8월 29일 관람",
        "text": "관람일은 8월 29일로 확정됐습니다. 집결 시간과 최종 참석자는 추가 확인이 필요합니다."
      }
    ],
    "decisions": [
      "가우디 서울전 관람일을 8월 29일로 확정했습니다.",
      "영화 《오디세이》 관람일을 세 가지 후보로 투표하고 있습니다.",
      "8월 15일 무료 클래식 공연 참여자를 제한 좌석 범위에서 모집하고 있습니다."
    ]
  };
  var SEVERITY_ICONS = {
    urgent: "!",
    check: "?",
    planning: "→",
    done: "✓"
  };

  function createElement(tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function isoDateToDayNumber(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return null;

    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var timestamp = Date.UTC(year, month - 1, day);
    var parsed = new Date(timestamp);
    if (parsed.getUTCFullYear() !== year ||
        parsed.getUTCMonth() !== month - 1 ||
        parsed.getUTCDate() !== day) return null;

    return Math.floor(timestamp / DAY_IN_MILLISECONDS);
  }

  function koreanTodayDayNumber(now) {
    var current = now || new Date();
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(current);
      var values = {};
      parts.forEach(function (part) {
        if (part.type !== "literal") values[part.type] = part.value;
      });
      return isoDateToDayNumber(values.year + "-" + values.month + "-" + values.day);
    } catch (error) {
      return Math.floor(Date.UTC(
        current.getFullYear(),
        current.getMonth(),
        current.getDate()
      ) / DAY_IN_MILLISECONDS);
    }
  }

  function isRecentCompletedDate(value, todayDayNumber) {
    var completedDayNumber = isoDateToDayNumber(value);
    var today = Number.isInteger(todayDayNumber)
      ? todayDayNumber
      : koreanTodayDayNumber();
    if (completedDayNumber === null || today === null) return false;

    var elapsedDays = today - completedDayNumber;
    return elapsedDays >= 0 && elapsedDays < COMPLETED_VISIBLE_DAYS;
  }

  function isSafeDigest(data) {
    if (!data || data.schema_version !== 1) return false;
    if (!isNonEmptyString(data.bot_name) ||
        !isNonEmptyString(data.period_label) ||
        !isNonEmptyString(data.updated_label) ||
        !isNonEmptyString(data.summary) ||
        !Number.isInteger(data.message_count) ||
        data.message_count < 0) return false;
    if (!Array.isArray(data.highlights) ||
        data.highlights.length < 1 ||
        data.highlights.length > 8 ||
        !Array.isArray(data.decisions) ||
        data.decisions.length > 8) return false;

    return data.highlights.every(function (item) {
      if (!item ||
          !Object.prototype.hasOwnProperty.call(SEVERITY_ICONS, item.severity) ||
          !isNonEmptyString(item.label) ||
          !isNonEmptyString(item.title) ||
          !isNonEmptyString(item.text)) return false;

      var hasCompletedDate = Object.prototype.hasOwnProperty.call(item, "completed_date");
      return item.severity === "done"
        ? hasCompletedDate && isoDateToDayNumber(item.completed_date) !== null
        : !hasCompletedDate;
    }) && data.decisions.every(isNonEmptyString);
  }

  function renderDigest(data) {
    var title = document.getElementById("weeklyDigestTitle");
    var period = document.getElementById("weeklyDigestPeriod");
    var intro = document.getElementById("weeklyDigestIntro");
    var content = document.getElementById("weeklyDigestContent");
    if (!title || !period || !intro || !content) return;

    title.textContent = data.bot_name;
    period.textContent = data.period_label;
    intro.textContent = data.summary + " 대화 " + data.message_count + "건을 검토했습니다.";

    var priorityTitle = createElement("h3", "digest-subtitle", "중요 확인사항");
    var highlightList = createElement("div", "digest-highlights");

    var visibleHighlights = data.highlights.filter(function (item) {
      return item.severity !== "done" || isRecentCompletedDate(item.completed_date);
    });

    visibleHighlights.forEach(function (item) {
      var card = createElement("article", "digest-item digest-item-" + item.severity);
      var marker = createElement("span", "digest-marker", SEVERITY_ICONS[item.severity]);
      marker.setAttribute("aria-hidden", "true");

      var body = createElement("div", "digest-item-body");
      var badge = createElement("span", "digest-status", item.label);
      var heading = createElement("h4", "", item.title);
      var description = createElement("p", "", item.text);

      body.appendChild(badge);
      body.appendChild(heading);
      body.appendChild(description);
      card.appendChild(marker);
      card.appendChild(body);
      highlightList.appendChild(card);
    });

    if (visibleHighlights.length === 0) {
      highlightList.appendChild(createElement(
        "p",
        "digest-loading",
        "현재 표시할 중요 확인사항이 없습니다."
      ));
    }

    var decisionPanel = createElement("section", "digest-decisions");
    var decisionTitle = createElement("h3", "digest-subtitle", "이번 주 정리");
    var decisionList = createElement("ul");
    data.decisions.forEach(function (decision) {
      decisionList.appendChild(createElement("li", "", decision));
    });
    decisionPanel.appendChild(decisionTitle);
    decisionPanel.appendChild(decisionList);

    var source = createElement(
      "p",
      "digest-source",
      data.updated_label + " · 공개 가능한 일정 정보만 표시"
    );

    content.replaceChildren(priorityTitle, highlightList, decisionPanel, source);
  }

  function fetchDigest(retriesRemaining) {
    fetch(DIGEST_URL, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("digest fetch failed");
        return response.json();
      })
      .then(function (data) {
        if (!isSafeDigest(data)) throw new Error("invalid digest schema");
        renderDigest(data);
      })
      .catch(function () {
        if (retriesRemaining < 1) return;
        window.setTimeout(function () {
          fetchDigest(retriesRemaining - 1);
        }, 800);
      });
  }

  function loadDigest() {
    // JSON 요청이 막혀도 검토를 마친 공개 요약 사본은 즉시 표시한다.
    renderDigest(FALLBACK_DIGEST);
    if (window.fetch) fetchDigest(1);
  }

  function setupCompletedMeetings() {
    var title = document.getElementById("completedMeetingsTitle");
    var list = document.getElementById("completedMeetings");
    var toggle = document.getElementById("completedMeetingsToggle");
    if (!list || !toggle) return;

    var allRows = Array.prototype.slice.call(list.querySelectorAll(".drow"));
    var rows = [];
    for (var rowIndex = 0; rowIndex < allRows.length; rowIndex++) {
      var row = allRows[rowIndex];
      row.hidden = true;
      if (isRecentCompletedDate(row.getAttribute("data-completed-date"))) {
        rows.push(row);
      } else {
        row.remove();
      }
    }

    if (rows.length === 0) {
      list.hidden = true;
      toggle.hidden = true;
      if (title) title.hidden = true;
      return;
    }

    list.hidden = false;
    if (title) title.hidden = false;

    function updateCompletedState(expanded) {
      for (var index = 0; index < rows.length; index++) {
        rows[index].hidden = !expanded;
      }
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.textContent = expanded
        ? "완료된 모임 접기"
        : "완료된 모임 " + rows.length + "개 펼쳐보기";
    }

    toggle.hidden = false;
    updateCompletedState(false);
    toggle.addEventListener("click", function () {
      updateCompletedState(toggle.getAttribute("aria-expanded") !== "true");
    });
  }

  loadDigest();
  setupCompletedMeetings();

  var eventDetails = {
    kickoff: {
      status: "완료",
      tone: "done",
      title: "킥오프 첫모임",
      date: "2026. 7. 5. (일)",
      time: "오후 12:30",
      venue: "2별관 2층",
      description: "동호회 운영 방향과 첫 전시 일정을 함께 나눈 시작 모임입니다.",
      note: "완료된 일정입니다.",
      infoUrl: "",
      infoLabel: "",
      mapUrl: ""
    },
    "cubist-weekend": {
      status: "완료",
      tone: "done",
      title: "7월 정기관람 ① 〈큐비스트〉 주말 관람",
      date: "2026. 7. 11. (토)",
      time: "오후 4시",
      venue: "퐁피두센터 한화",
      description: "1907년부터 1927년까지 전개된 큐비즘의 흐름을 퐁피두센터 소장품 91점과 한국 근현대 회화로 살펴보는 개관전입니다.",
      note: "완료된 일정입니다.",
      infoUrl: "https://www.centrepompidou-hanwha.kr/exhibition/detail?seq=96&status=INACTIVE",
      infoLabel: "공식 전시 정보 보기 →",
      mapUrl: "https://map.kakao.com/?q=%ED%90%81%ED%94%BC%EB%91%90%EC%84%BC%ED%84%B0%20%ED%95%9C%ED%99%94"
    },
    seongryul: {
      status: "완료",
      tone: "done",
      title: "성률 기획전 〈여름을 닮은 우리〉",
      date: "2026. 7. 26. (일)",
      time: "3부 예배 후",
      venue: "단체방 공지 장소",
      description: "성률 작가가 애정 어린 시선으로 포착한 여름의 조각들을 한데 모은 기획전을 함께 관람했습니다.",
      note: "완료된 일정입니다. 세부 관람 기록은 단체방 공지를 확인해 주세요.",
      infoUrl: "",
      infoLabel: "",
      mapUrl: ""
    },
    "cubist-evening": {
      status: "완료",
      tone: "done",
      title: "7월 정기관람 ② 〈큐비스트〉 평일 관람",
      date: "2026. 7. 29. (수)",
      time: "오후 7시 집결·식사 후 관람",
      venue: "여의도 63빌딩 별관 G층 고메스트리트 입구",
      description: "간단히 식사한 뒤 퐁피두센터 한화의 개관전 〈큐비스트: 시각의 혁신가들〉을 함께 관람합니다.",
      note: "완료된 일정입니다. 문화의날 관람료 14,000원으로 진행했습니다.",
      infoUrl: "https://www.centrepompidou-hanwha.kr/exhibition/detail?seq=96&status=INACTIVE",
      infoLabel: "공식 전시 정보 보기 →",
      mapUrl: "https://map.kakao.com/?q=%ED%90%81%ED%94%BC%EB%91%90%EC%84%BC%ED%84%B0%20%ED%95%9C%ED%99%94"
    },
    "cubist-morning": {
      status: "완료",
      tone: "done",
      title: "〈큐비스트〉 오전 벙개",
      date: "2026. 7. 29. (수)",
      time: "오전 10시",
      venue: "퐁피두센터 한화",
      description: "평일 저녁 관람이 어려운 회원을 위한 오전 자율 관람 모임입니다.",
      note: "완료된 일정입니다.",
      infoUrl: "https://www.centrepompidou-hanwha.kr/exhibition/detail?seq=96&status=INACTIVE",
      infoLabel: "공식 전시 정보 보기 →",
      mapUrl: "https://map.kakao.com/?q=%ED%90%81%ED%94%BC%EB%91%90%EC%84%BC%ED%84%B0%20%ED%95%9C%ED%99%94"
    },
    "gaudi-deadline": {
      status: "예매 마감",
      tone: "dead",
      title: "〈가우디: 서울에서 다시 태어나다〉",
      date: "2026. 7. 31. (금)",
      time: "얼리버드 판매 마감일",
      venue: "신사하우스",
      description: "가우디 서거 100주기를 맞아 원본 작품과 유물, 공식 공인 레플리카로 그의 창작 세계를 살펴보는 전시입니다. 전시는 8월 1일부터 10월 31일까지 열립니다.",
      note: "얼리버드 30% 할인가는 19,000원이며, 실제 예매 가능 여부와 조건은 예매 페이지에서 다시 확인하세요.",
      infoUrl: "https://feverup.com/m/665616",
      infoLabel: "전시·예매 정보 보기 →",
      mapUrl: "https://map.kakao.com/?q=%EC%8B%A0%EC%82%AC%ED%95%98%EC%9A%B0%EC%8A%A4"
    },
    "gaudi-visit": {
      status: "확정",
      tone: "conf",
      title: "가우디 서울전 관람",
      date: "2026. 8. 29. (토)",
      time: "시간 확인 중",
      venue: "신사하우스 · 신사동",
      description: "가우디 서거 100주기를 맞아 원본 작품과 유물, 공식 공인 레플리카로 그의 창작 세계를 살펴보는 전시입니다.",
      note: "관람일은 8월 29일로 확정되었습니다. 집결 시간과 최종 참석자는 톡방 공지를 확인해 주세요.",
      infoUrl: "https://feverup.com/m/665616",
      infoLabel: "전시·예매 정보 보기 →",
      mapUrl: "https://map.kakao.com/?q=%EC%8B%A0%EC%82%AC%ED%95%98%EC%9A%B0%EC%8A%A4"
    },
    "classic-concert": {
      status: "모집 중",
      tone: "tent",
      title: "S Classic Week 무료 클래식 공연",
      date: "2026. 8. 15. (토)",
      time: "오후 2시",
      venue: "세종문화회관 체임버홀",
      description: "제한된 초청 좌석으로 함께 관람할 참여자를 모집 중인 클래식 공연입니다.",
      note: "최종 참석 여부와 주차 가능 여부는 톡방 공지를 확인해 주세요.",
      infoUrl: "",
      infoLabel: "",
      mapUrl: "https://map.kakao.com/?q=%EC%84%B8%EC%A2%85%EB%AC%B8%ED%99%94%ED%9A%8C%EA%B4%80%20%EC%B2%B4%EC%9E%84%EB%B2%84%ED%99%80"
    },
    "history-museum": {
      status: "확정",
      tone: "conf",
      title: "8월 정기관람 · 서울역사박물관",
      date: "2026. 8. 22. (토)",
      time: "오후 3시 ~ 5시",
      venue: "서울역사박물관 · 종로구 새문안로 55",
      description: "서울의 장소와 역사, 기억을 살펴보는 정기관람입니다. 관람 중 퀴즈 이벤트와 정답자 선물을 진행합니다.",
      note: "참고자료와 담당 운영진은 톡게시판에서 확인해 주세요.",
      infoUrl: "https://museum.seoul.go.kr/www/guide/vis/infomation.jsp?sso=ok",
      infoLabel: "박물관 관람 안내 보기 →",
      mapUrl: "https://map.kakao.com/?q=%EC%84%9C%EC%9A%B8%EC%97%AD%EC%82%AC%EB%B0%95%EB%AC%BC%EA%B4%80"
    }
  };

  var dialog = document.getElementById("eventDetailsDialog");
  var dialogStatus = document.getElementById("eventDialogStatus");
  var dialogTitle = document.getElementById("eventDialogTitle");
  var dialogDate = document.getElementById("eventDialogDate");
  var dialogTime = document.getElementById("eventDialogTime");
  var dialogVenue = document.getElementById("eventDialogVenue");
  var dialogDescription = document.getElementById("eventDialogDescription");
  var dialogNote = document.getElementById("eventDialogNote");
  var dialogInfoLink = document.getElementById("eventDialogInfoLink");
  var dialogMapLink = document.getElementById("eventDialogMapLink");
  var lastEventTrigger = null;

  function setSafeExternalLink(link, url, label) {
    link.hidden = true;
    link.removeAttribute("href");
    if (!url) return;

    try {
      var parsed = new URL(url, window.location.href);
      if (parsed.protocol !== "https:") return;
      link.href = parsed.href;
      link.textContent = label;
      link.hidden = false;
    } catch (error) {
      link.hidden = true;
    }
  }

  function openEventDialog(eventId) {
    var detail = eventDetails[eventId];
    if (!detail || !dialog) return;

    dialogStatus.textContent = detail.status;
    dialogStatus.dataset.tone = detail.tone;
    dialogTitle.textContent = detail.title;
    dialogDate.textContent = detail.date;
    dialogTime.textContent = detail.time;
    dialogVenue.textContent = detail.venue;
    dialogDescription.textContent = detail.description;
    dialogNote.textContent = detail.note;
    dialogNote.hidden = !detail.note;
    setSafeExternalLink(dialogInfoLink, detail.infoUrl, detail.infoLabel);
    setSafeExternalLink(dialogMapLink, detail.mapUrl, "카카오맵 보기");

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeEventDialog() {
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
    if (lastEventTrigger) lastEventTrigger.focus();
  }

  var eventTriggers = document.querySelectorAll("[data-event-id]");
  for (var triggerIndex = 0; triggerIndex < eventTriggers.length; triggerIndex++) {
    eventTriggers[triggerIndex].addEventListener("click", function (event) {
      lastEventTrigger = event.currentTarget;
      openEventDialog(event.currentTarget.dataset.eventId);
    });
  }

  var closeButtons = document.querySelectorAll("[data-dialog-close]");
  for (var closeIndex = 0; closeIndex < closeButtons.length; closeIndex++) {
    closeButtons[closeIndex].addEventListener("click", closeEventDialog);
  }

  if (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeEventDialog();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !dialog || !dialog.open) return;
    event.preventDefault();
    closeEventDialog();
  });

  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth() + 1;
  var day = now.getDate();

  var calendars = document.querySelectorAll(".cal[data-year][data-month]");
  for (var i = 0; i < calendars.length; i++) {
    if (Number(calendars[i].dataset.year) !== year ||
        Number(calendars[i].dataset.month) !== month) continue;

    var nums = calendars[i].querySelectorAll(".cell .dnum");
    for (var j = 0; j < nums.length; j++) {
      if (Number(nums[j].textContent.trim()) !== day) continue;
      nums[j].classList.add("is-today");
      var label = document.createElement("span");
      label.className = "tlab";
      label.textContent = "오늘";
      nums[j].insertAdjacentElement("afterend", label);
      return;
    }
  }
})();
