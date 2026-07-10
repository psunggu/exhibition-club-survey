const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const appPath = path.join(root, "exhibition_club_codex_package", "public", "app.js");
const publicUrl = process.env.PUBLIC_URL || "https://psunggu.github.io/exhibition-club-survey/";
const isDryRun = process.argv.includes("--dry-run");

function loadRecommendedEvents() {
  const source = fs.readFileSync(appPath, "utf8");
  const match = source.match(/const recommendedEvents = \[([\s\S]*?)\];\r?\n\r?\nconst fields/);
  if (!match) throw new Error("recommendedEvents array not found");
  return vm.runInNewContext(`[${match[1]}]`);
}

function topRecommendedEvents(events) {
  return events
    .filter((event) => {
      if (!["전시", "공연"].includes(event.type) || !event.recommendedRank || event.region === "수원/경기") return false;
      if (event.type === "전시") return event.verified === true;
      return true;
    })
    .sort((a, b) => Number(a.recommendedRank || 999) - Number(b.recommendedRank || 999))
    .slice(0, 20);
}

function stars(rating) {
  const value = Math.max(0, Math.min(5, Number(rating || 0)));
  if (!value) return "-";
  return `${"★".repeat(value)}${"☆".repeat(5 - value)}`;
}

function shortDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${year}.${Number(month)}.${Number(day)}`;
}

function dateRange(event) {
  const start = shortDate(event.startDate);
  const end = shortDate(event.endDate);
  if (!start && !end) return "일정 확인 필요";
  if (start === end || !end) return start;
  return `${start}~${end}`;
}

function infoUrl(event) {
  return event.infoUrl || event.mainUrl || publicUrl;
}

function buildMessage(events) {
  const visible = topRecommendedEvents(events);
  const exhibitions = visible.filter((event) => event.type === "전시").slice(0, 10);
  const performances = visible.filter((event) => event.type === "공연").slice(0, 10);

  const lines = [
    "서울 7~8월 전시·음악공연 주간 업데이트",
    `공유 페이지: ${publicUrl}`,
    "",
    `[추천 전시 ${exhibitions.length}건]`,
    ...exhibitions.map((event, index) => `${index + 1}. ${stars(event.rating)} ${event.title}\n   ${dateRange(event)} · ${event.venue || "장소 확인 필요"}\n   ${infoUrl(event)}`),
    "",
    `[추천 음악공연 ${performances.length}건]`,
    ...performances.map((event, index) => `${index + 1}. ${stars(event.rating)} ${event.title}\n   ${dateRange(event)} · ${event.venue || "장소 확인 필요"}\n   ${infoUrl(event)}`),
    "",
    "공연은 도슨트 항목을 제외했고, 공연정보 링크는 공식 일정 페이지 기준으로 확인합니다.",
  ];

  return lines.join("\n");
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram send failed: ${response.status} ${body}`);
  }
}

async function main() {
  const message = buildMessage(loadRecommendedEvents());
  if (isDryRun) {
    console.log(message);
    return;
  }

  await sendTelegram(message);
  console.log("Telegram update sent");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
