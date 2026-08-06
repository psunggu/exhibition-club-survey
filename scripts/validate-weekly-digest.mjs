import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const digestPath = resolve(
  "exhibition_club_codex_package",
  "public",
  "weekly-digest.public.json"
);
const noticeScriptPath = resolve(
  "exhibition_club_codex_package",
  "public",
  "notice.js"
);
const noticeHtmlPath = resolve(
  "exhibition_club_codex_package",
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
  "decisions"
]);
const allowedHighlightKeys = new Set([
  "severity",
  "label",
  "title",
  "text",
  "completed_date"
]);
const allowedSeverities = new Set(["urgent", "check", "planning", "done"]);

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

function assertIsoDate(value, path) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    fail(`${path} 값은 YYYY-MM-DD 형식이어야 합니다.`);
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day) {
    fail(`${path} 값은 실제 달력 날짜여야 합니다.`);
  }
}

const raw = await readFile(digestPath, "utf8");
const data = JSON.parse(raw);
const noticeScript = await readFile(noticeScriptPath, "utf8");
const noticeHtml = await readFile(noticeHtmlPath, "utf8");

if (!data || Array.isArray(data) || typeof data !== "object") {
  fail("최상위 값은 객체여야 합니다.");
}
assertExactKeys(data, allowedRootKeys, "root");

if (data.schema_version !== 1) fail("schema_version은 1이어야 합니다.");
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
  if (!allowedSeverities.has(item.severity)) {
    fail(`highlights[${index}].severity 값이 허용 목록에 없습니다.`);
  }
  assertPublicText(item.label, `highlights[${index}].label`, 20);
  assertPublicText(item.title, `highlights[${index}].title`, 80);
  assertPublicText(item.text, `highlights[${index}].text`, 240);
  if (item.severity === "done") {
    assertIsoDate(item.completed_date, `highlights[${index}].completed_date`);
  } else if (Object.hasOwn(item, "completed_date")) {
    fail(`highlights[${index}].completed_date는 완료 항목에만 사용할 수 있습니다.`);
  }
}

if (!Array.isArray(data.decisions) || data.decisions.length > 8) {
  fail("decisions는 최대 8개의 배열이어야 합니다.");
}
for (const [index, decision] of data.decisions.entries()) {
  assertPublicText(decision, `decisions[${index}]`, 180);
}

const publicText = JSON.stringify(data);
const sensitivePatterns = [
  { label: "이메일", pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/u },
  { label: "전화번호", pattern: /(?:01[016789]|0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}/u },
  { label: "구역번호+이름", pattern: /(?:^|[^\d])\d{4}\s*[가-힣]{2,4}(?:$|[^가-힣])/u },
  { label: "익명화 내부 식별자", pattern: /멤버\s*\d+/u },
  { label: "카카오 대화 원문 형식", pattern: /\[[^\]\r\n]+\]\s*\[[^\]\r\n]+\]/u }
];

for (const { label, pattern } of sensitivePatterns) {
  if (pattern.test(publicText)) fail(`${label}로 보이는 값이 포함되어 있습니다.`);
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
// 요약에서는 확정인데 본문·달력에는 미정으로 남는 분류 회귀를 배포 전에 차단한다.
const confirmedEvents = [
  {
    id: "classic-concert",
    titleToken: "8월 15일",
    digestTokens: ["오후 2시", "세종문화회관 체임버홀", "참여자 2명", "확정"]
  },
  {
    id: "odyssey-movie",
    titleToken: "8월 16일",
    digestTokens: ["오후 5시", "영등포 타임스퀘어 IMAX", "오후 5시 30분", "오후 8시 32분", "2만원", "확정"]
  },
  {
    id: "history-museum",
    titleToken: "8월 22일",
    digestTokens: ["오후 2시 50분", "서울역사박물관 앞", "오후 3시", "오후 5시", "확정"]
  },
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

  const detailsStart = noticeScript.indexOf(`"${expected.id}": {`);
  const detailsEnd = noticeScript.indexOf("\n    }", detailsStart);
  const detailsBlock = detailsStart >= 0 && detailsEnd > detailsStart
    ? noticeScript.slice(detailsStart, detailsEnd)
    : "";
  if (!detailsBlock.includes('tone: "conf"')) {
    fail(`${expected.id} 상세 팝업 상태가 확정이 아닙니다.`);
  }

  const digestItem = data.highlights.find((item) => item.title.includes(expected.titleToken));
  if (!digestItem) fail(`${expected.titleToken} 일정이 주간 정리봇에 없습니다.`);
  const digestText = `${digestItem.label} ${digestItem.title} ${digestItem.text}`;
  for (const token of expected.digestTokens) {
    if (!digestText.includes(token)) {
      fail(`${expected.titleToken} 일정의 '${token}' 정보가 주간 정리봇과 일치하지 않습니다.`);
    }
  }
}

if (tentativeSection.includes("《오디세이》")) {
  fail("확정된 영화 《오디세이》가 조율 중·미정 영역에 남아 있습니다.");
}

console.log("주간 정리봇 공개 데이터와 모임 일정 안내 정합성 검증 통과");
