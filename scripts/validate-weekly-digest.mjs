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
const allowedHighlightKeys = new Set(["severity", "label", "title", "text"]);
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

const raw = await readFile(digestPath, "utf8");
const data = JSON.parse(raw);
const noticeScript = await readFile(noticeScriptPath, "utf8");

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

console.log("weekly-digest.public.json 및 notice.js 대체 사본 공개 데이터 검증 통과");
