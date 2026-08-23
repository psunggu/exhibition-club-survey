import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const digestPath = resolve(
  "app",
  "public",
  "weekly-digest.public.json"
);
const noticeScriptPath = resolve(
  "app",
  "public",
  "notice.js"
);
const noticeHtmlPath = resolve(
  "app",
  "public",
  "notice.html"
);

const allowedRootKeys = new Set([
  "schema_version",
  "bot_name",
  "period_label",
  "updated_label",
  "message_count",
  "summary",
  "highlights",
  "decisions",
  "open_questions"
]);
const allowedHighlightKeys = new Set([
  "severity",
  "label",
  "title",
  "text",
  "completed_date"
]);
const allowedSeverities = new Set(["urgent", "check", "planning"]);

function fail(message) {
  throw new Error(`weekly-digest.public.json 검증 실패: ${message}`);
}

function assertExactKeys(value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${path}.${key} 필드는 공개할 수 없습니다.`);
  }
}

function assertPublicText(value, path, maxLength) {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${path} 값은 비어 있지 않은 문자열이어야 합니다.`);
  }
  if (value.length > maxLength) fail(`${path} 값이 ${maxLength}자를 초과합니다.`);
  if (/[<>]/u.test(value)) fail(`${path} 값에 HTML 문자가 포함되어 있습니다.`);
}

const raw = await readFile(digestPath, "utf8");
const data = JSON.parse(raw);
const noticeScript = await readFile(noticeScriptPath, "utf8");
const noticeHtml = await readFile(noticeHtmlPath, "utf8");

if (!data || Array.isArray(data) || typeof data !== "object") {
  fail("최상위 값은 객체여야 합니다.");
}
assertExactKeys(data, allowedRootKeys, "root");

if (data.schema_version !== 2) fail("schema_version은 2여야 합니다.");
if (data.bot_name !== "주간 정리봇") fail("bot_name은 '주간 정리봇'이어야 합니다.");
if (!Number.isInteger(data.message_count) || data.message_count < 0) {
  fail("message_count는 0 이상의 정수여야 합니다.");
}

assertPublicText(data.period_label, "period_label", 40);
assertPublicText(data.updated_label, "updated_label", 50);
assertPublicText(data.summary, "summary", 160);

if (!Array.isArray(data.highlights) || data.highlights.length < 1 || data.highlights.length > 8) {
  fail("highlights는 1~8개의 항목이어야 합니다.");
}
for (const [index, item] of data.highlights.entries()) {
  if (!item || Array.isArray(item) || typeof item !== "object") {
    fail(`highlights[${index}]는 객체여야 합니다.`);
  }
  assertExactKeys(item, allowedHighlightKeys, `highlights[${index}]`);
  if (item.severity === "done") {
    fail(`highlights[${index}] 완료 항목은 중요 확인사항에 넣을 수 없습니다.`);
  }
  if (!allowedSeverities.has(item.severity)) {
    fail(`highlights[${index}].severity 값이 허용 목록에 없습니다.`);
  }
  assertPublicText(item.label, `highlights[${index}].label`, 20);
  assertPublicText(item.title, `highlights[${index}].title`, 80);
  assertPublicText(item.text, `highlights[${index}].text`, 240);
  if (Object.hasOwn(item, "completed_date")) {
    fail(`highlights[${index}].completed_date는 중요 확인사항에서 사용할 수 없습니다.`);
  }
}

if (!Array.isArray(data.decisions) || data.decisions.length > 8) {
  fail("decisions는 최대 8개의 배열이어야 합니다.");
}
for (const [index, decision] of data.decisions.entries()) {
  assertPublicText(decision, `decisions[${index}]`, 180);
}

if (!Array.isArray(data.open_questions) || data.open_questions.length > 8) {
  fail("open_questions는 최대 8개의 배열이어야 합니다.");
}
for (const [index, question] of data.open_questions.entries()) {
  assertPublicText(question, `open_questions[${index}]`, 180);
}

// 공개 페이지로 나가기 직전의 마지막 방어선이다.
// 오탐(사람이 한 번 확인)이 미탐(그대로 공개)보다 항상 안전하므로 넉넉하게 잡는다.
const sensitivePatterns = [
  { label: "이메일", pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/u },
  { label: "전화번호", pattern: /(?:01[016789]|0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}/u },
  // 카카오톡 표시명은 "1011 김하늘" 외에 "1041/박서준", "1021-이가온" 처럼
  // 구분자가 섞여 온다. \s* 로만 두면 슬래시·하이픈 형식을 통째로 놓친다.
  // 예시 이름은 docs/fixtures/sample-members.json 의 가상 회원만 쓴다 —
  // validate-repository-hygiene.mjs 가 그 명부에 없는 이름을 잡아낸다.
  // (실측 2026-08-17: 실제 방에서 쓰이는 8개 표시명 형식 중 4개만 잡혔다)
  {
    label: "소속번호+이름",
    pattern: /(?:^|[^\d])\d{4}[\s/_.\-|]*[가-힣]{2,4}(?:$|[^가-힣])/u
  },
  // 새 플랫폼이 화면 표기로 정한 "구역 + 이름" 형식. 자릿수가 1~2라
  // 위 4자리 패턴으로는 잡히지 않는다.
  { label: "구역+이름", pattern: /\d{1,2}\s*구역\s*[가-힣]{2,4}/u },
  { label: "익명화 내부 식별자", pattern: /멤버\s*\d+/u },
  { label: "카카오 대화 원문 형식", pattern: /\[[^\]\r\n]+\]\s*\[[^\]\r\n]+\]/u }
];

// 게이트를 요약 JSON 한 곳에만 걸면, 사람이 자유 서술로 채우는 notice.html 본문이
// 검사 밖에 남는다. 개인정보가 섞일 위험은 자동 생성물보다 손으로 쓰는 쪽이 크다.
const noticeBodyText = noticeHtml
  .replace(/<script[\s\S]*?<\/script>/gu, " ")
  .replace(/<style[\s\S]*?<\/style>/gu, " ")
  .replace(/<[^>]+>/gu, " ")
  .replace(/\s+/gu, " ");

const scanTargets = [
  { name: "weekly-digest.public.json", text: JSON.stringify(data) },
  { name: "notice.html 본문", text: noticeBodyText }
];

for (const { name, text } of scanTargets) {
  for (const { label, pattern } of sensitivePatterns) {
    const hit = text.match(pattern);
    if (hit) {
      fail(`${name}에 ${label}로 보이는 값이 있습니다: ${JSON.stringify(hit[0].trim())}`);
    }
  }
}

const fallbackMatch = noticeScript.match(/var FALLBACK_DIGEST = (\{[\s\S]*?\n  \});/u);
if (!fallbackMatch) fail("notice.js에 공개 요약 대체 사본이 없습니다.");

let fallbackData;
try {
  fallbackData = JSON.parse(fallbackMatch[1]);
} catch {
  fail("notice.js의 공개 요약 대체 사본이 올바른 JSON이 아닙니다.");
}

if (JSON.stringify(fallbackData) !== JSON.stringify(data)) {
  fail("notice.js의 공개 요약 대체 사본이 weekly-digest.public.json과 다릅니다.");
}

const confirmedStart = noticeHtml.indexOf("다가오는 확정 모임");
const tentativeStart = noticeHtml.indexOf("조율 중 · 미정");
const calendarStart = noticeHtml.indexOf("한눈에 보는 달력");
if (!(confirmedStart >= 0 && confirmedStart < calendarStart)) {
  fail("notice.html의 확정 모임과 달력 영역 순서를 확인할 수 없습니다.");
}
if (tentativeStart >= 0 && !(confirmedStart < tentativeStart && tentativeStart < calendarStart)) {
  fail("notice.html의 조율 중·미정 영역 순서를 확인할 수 없습니다.");
}

const confirmedEnd = tentativeStart >= 0 ? tentativeStart : calendarStart;
const confirmedSection = noticeHtml.slice(confirmedStart, confirmedEnd);
const tentativeSection = tentativeStart >= 0
  ? noticeHtml.slice(tentativeStart, calendarStart)
  : "";
// 일정의 확정·완료 상태가 본문과 달력에서 엇갈리는 회귀를 배포 전에 차단한다.
const confirmedEvents = [
  // history-museum(8/22)은 2026-08-23 에 완료로 옮겼다. 이제 「다가오는 확정 모임」 이 아니라
  // 달력의 회색 「관람 완료」 칩과 「완료된 모임」 목록에 있다.
  // 완료된 모임을 확정으로 요구하면 이 검사가 화면과 반대되는 것을 지키게 된다.
  {
    id: "gaudi-visit",
    titleToken: "8월 29일",
    digestTokens: ["8월 29일", "확정"]
  }
];

for (const expected of confirmedEvents) {
  const eventMarker = `data-event-id="${expected.id}"`;
  if (!confirmedSection.includes(eventMarker)) {
    fail(`${expected.id}가 다가오는 확정 모임 영역에 없습니다.`);
  }
  if (tentativeSection.includes(eventMarker)) {
    fail(`${expected.id}가 조율 중·미정 영역에도 중복되어 있습니다.`);
  }

  const calendarButton = noticeHtml.match(
    new RegExp(`<button[^>]*class="[^"]*\\bconf\\b[^"]*"[^>]*${eventMarker}[^>]*>`, "u")
  );
  if (!calendarButton) fail(`${expected.id} 달력 표시가 확정 상태가 아닙니다.`);

  if (expected.official) {
    const officialCard = new RegExp(
      `<article[^>]*class="[^"]*\\bcard-official\\b[^"]*"[^>]*${eventMarker}`,
      "u"
    );
    if (!officialCard.test(confirmedSection)) {
      fail(`${expected.id} 카드에 공식 정기관람 표시가 없습니다.`);
    }
    if (!calendarButton[0].includes("official")) {
      fail(`${expected.id} 달력에 공식 정기관람 색상이 없습니다.`);
    }
  }

  const detailsStart = noticeScript.indexOf(`"${expected.id}": {`);
  const detailsEnd = noticeScript.indexOf("\n    }", detailsStart);
  const detailsBlock = detailsStart >= 0 && detailsEnd > detailsStart
    ? noticeScript.slice(detailsStart, detailsEnd)
    : "";
  const expectedTone = expected.official ? "official" : "conf";
  if (!detailsBlock.includes(`tone: "${expectedTone}"`)) {
    fail(`${expected.id} 상세 팝업 상태가 ${expectedTone}이 아닙니다.`);
  }

  const digestItem = data.highlights.find((item) => item.title.includes(expected.titleToken));
  if (!digestItem) fail(`${expected.titleToken} 일정이 주간 정리봇에 없습니다.`);
  const digestText = `${digestItem.label} ${digestItem.title} ${digestItem.text}`;
  if (expected.official && digestItem.label !== "공식 정기관람") {
    fail(`${expected.titleToken} 일정이 주간 정리봇에서 공식 정기관람으로 표시되지 않습니다.`);
  }
  for (const token of expected.digestTokens) {
    if (!digestText.includes(token)) {
      fail(`${expected.titleToken} 일정의 '${token}' 정보가 주간 정리봇과 일치하지 않습니다.`);
    }
  }
}

const completedEvents = [
  { id: "classic-concert", completedDate: "2026-08-15" },
  { id: "odyssey-movie", completedDate: "2026-08-16" }
];

for (const expected of completedEvents) {
  const eventMarker = `data-event-id="${expected.id}"`;
  if (confirmedSection.includes(eventMarker)) {
    fail(`${expected.id}가 완료됐는데 다가오는 확정 모임 영역에 남아 있습니다.`);
  }
  if (tentativeSection.includes(eventMarker)) {
    fail(`${expected.id}가 완료됐는데 조율 중·미정 영역에 있습니다.`);
  }

  const completedRow = noticeHtml.match(
    new RegExp(`<p[^>]*${eventMarker}[^>]*>`, "u")
  );
  if (!completedRow || !completedRow[0].includes(`data-completed-date="${expected.completedDate}"`)) {
    fail(`${expected.id}가 완료된 모임 목록에 올바른 날짜로 없습니다.`);
  }

  const calendarButton = noticeHtml.match(
    new RegExp(`<button[^>]*class="[^"]*\\bdone\\b[^"]*"[^>]*${eventMarker}[^>]*>`, "u")
  );
  if (!calendarButton) fail(`${expected.id} 달력 표시가 완료 상태가 아닙니다.`);

  const detailsStart = noticeScript.indexOf(`"${expected.id}": {`);
  const detailsEnd = noticeScript.indexOf("\n    }", detailsStart);
  const detailsBlock = detailsStart >= 0 && detailsEnd > detailsStart
    ? noticeScript.slice(detailsStart, detailsEnd)
    : "";
  if (!detailsBlock.includes('tone: "done"') || !detailsBlock.includes('status: "완료')) {
    fail(`${expected.id} 상세 팝업 상태가 완료가 아닙니다.`);
  }
}

if (tentativeSection.includes("《오디세이》")) {
  fail("확정된 영화 《오디세이》가 조율 중·미정 영역에 남아 있습니다.");
}

console.log("주간 정리봇 공개 데이터와 모임 일정 안내 정합성 검증 통과");
