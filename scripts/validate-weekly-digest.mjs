import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// 공개 요약은 이 JSON 한 파일뿐이다.
// 옛 notice.js 의 FALLBACK_DIGEST 사본과 notice.html 본문 대조는 2026-09-08 에 없앴다 —
// 옛 페이지가 배포되지 않게 된 뒤로도 같은 값을 두 곳에 쓰게 만들던 검사였다.
const digestPath = resolve(
  "app",
  "public",
  "weekly-digest.public.json"
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
// scripts/digest-to-public.mjs 가 같은 눈으로 먼저 보지만, 손으로 다듬은 뒤를 여기서 다시 본다.
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

const text = JSON.stringify(data);
for (const { label, pattern } of sensitivePatterns) {
  const hit = text.match(pattern);
  if (hit) {
    fail(`weekly-digest.public.json에 ${label}로 보이는 값이 있습니다: ${JSON.stringify(hit[0].trim())}`);
  }
}

console.log("주간 정리봇 공개 데이터 검증 통과");
