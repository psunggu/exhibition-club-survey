(function () {
  "use strict";

  var DIGEST_URL = "weekly-digest.public.json?v=20260731-1";
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
      return item &&
        Object.prototype.hasOwnProperty.call(SEVERITY_ICONS, item.severity) &&
        isNonEmptyString(item.label) &&
        isNonEmptyString(item.title) &&
        isNonEmptyString(item.text);
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

    data.highlights.forEach(function (item) {
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

  function renderDigestError() {
    var period = document.getElementById("weeklyDigestPeriod");
    var content = document.getElementById("weeklyDigestContent");
    if (period) period.textContent = "확인 필요";
    if (!content) return;

    var error = createElement(
      "p",
      "digest-error",
      "주간 정리 내용을 불러오지 못했습니다. 최신 일정은 단체방 공지를 확인해 주세요."
    );
    content.replaceChildren(error);
  }

  function loadDigest() {
    if (!window.fetch) {
      renderDigestError();
      return;
    }

    fetch(DIGEST_URL, { credentials: "same-origin", cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("digest fetch failed");
        return response.json();
      })
      .then(function (data) {
        if (!isSafeDigest(data)) throw new Error("invalid digest schema");
        renderDigest(data);
      })
      .catch(renderDigestError);
  }

  loadDigest();

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

  var headings = document.querySelectorAll(".mon");
  for (var i = 0; i < headings.length; i++) {
    var match = headings[i].textContent.match(/(\d{4})년\s*(\d{1,2})월/);
    if (!match || Number(match[1]) !== year || Number(match[2]) !== month) continue;

    var cal = headings[i].nextElementSibling;
    if (!cal || !cal.classList.contains("cal")) continue;

    var nums = cal.querySelectorAll(".cell .dnum");
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
