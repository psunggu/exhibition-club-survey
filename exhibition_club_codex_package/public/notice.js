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

  function markToday() {
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
  }

  markToday();
  loadDigest();
})();
