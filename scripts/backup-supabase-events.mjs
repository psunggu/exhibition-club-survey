import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDir, "..");

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function loadConfigSource() {
  const configUrl = argumentValue("--config-url");
  const configPath = argumentValue("--config-path");
  if (configUrl && configPath) {
    throw new Error("Use only one of --config-url or --config-path");
  }

  if (configUrl) {
    const response = await fetch(configUrl, {
      headers: { Accept: "text/javascript" },
      redirect: "error",
    });
    if (!response.ok) {
      throw new Error(`Unable to download public config (${response.status})`);
    }
    return response.text();
  }

  const resolvedConfigPath = path.resolve(
    configPath ??
      path.join(
        repositoryRoot,
        "app",
        "public",
        "config.js",
      ),
  );
  return fs.readFile(resolvedConfigPath, "utf8");
}

function readPublicSupabaseConfig(source) {
  const url = source.match(/supabaseUrl\s*:\s*["']([^"']+)["']/)?.[1];
  const anonKey = source.match(/supabaseAnonKey\s*:\s*["']([^"']+)["']/)?.[1];
  if (!url || !anonKey) {
    throw new Error("Public Supabase URL or anonymous key is missing from config");
  }
  return { url, anonKey };
}

function timestampForFile(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

const configSource = await loadConfigSource();
const { url: supabaseUrl, anonKey } = readPublicSupabaseConfig(configSource);
const localAppData = process.env.LOCALAPPDATA ??
  path.join(os.homedir(), "AppData", "Local");
const outputDirectory = path.resolve(
  argumentValue("--output-dir") ??
    process.env.EXHIBITION_BACKUP_DIR ??
    path.join(localAppData, "ExhibitionClub", "backups"),
);

if (isInside(repositoryRoot, outputDirectory)) {
  throw new Error("Backup output must be outside the Git repository");
}

async function readTable(table, order) {
  const endpoint = new URL(`/rest/v1/${table}`, supabaseUrl);
  endpoint.searchParams.set("select", "*");
  endpoint.searchParams.set("order", order);

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    redirect: "error",
  });

  if (!response.ok) {
    throw new Error(`Supabase read of ${table} failed (${response.status})`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    throw new Error(`Backup refused because the ${table} response is invalid`);
  }

  const ids = new Set();
  for (const row of rows) {
    if (!row || typeof row !== "object" || typeof row.id !== "string") {
      throw new Error(`Backup refused because a ${table} row has no valid id`);
    }
    if (ids.has(row.id)) {
      throw new Error(`Backup refused because ${table} id ${row.id} is duplicated`);
    }
    ids.add(row.id);
  }
  return rows;
}

const events = await readTable("events", "created_at.asc");
if (events.length === 0) {
  throw new Error("Backup refused because the events response is empty or invalid");
}

// 설문 두 표(2026-10-04 운영자 요청) — 무료 요금제라 Supabase 자체 백업이 없고 저장소에도 원본이 없다.
// 익명 키로 읽으므로 RLS 가 회원에게 보이는 설문(deleted_at 이 없고 audience = 'members')과 그 선택지만 내준다.
// 운영진 전용 · 지운 설문과 잠긴 표(admin_guides · survey_notes)는 여기서 받지 못한다.
// survey_options.imported_voters(투표자 이름)는 저장하지 않는다 — 명부 · 응답처럼 개인정보를 PC 에 복사하지 않는다.
const OMITTED_COLUMNS = { survey_options: ["imported_voters"] };
const surveys = await readTable("surveys", "created_at.asc");
const surveyOptions = (await readTable("survey_options", "survey_id.asc,position.asc"))
  .map((row) => Object.fromEntries(
    Object.entries(row).filter(([column]) => !OMITTED_COLUMNS.survey_options.includes(column)),
  ));
const surveyIds = new Set(surveys.map((survey) => survey.id));
for (const option of surveyOptions) {
  if (!surveyIds.has(option.survey_id)) {
    throw new Error(`Backup refused because survey option ${option.id} points to a survey missing from the backup`);
  }
}

const createdAt = new Date();
const backup = {
  format: "exhibition-club-events-backup/v2",
  createdAt: createdAt.toISOString(),
  source: {
    projectRef: new URL(supabaseUrl).hostname.split(".")[0],
    tables: ["public.events", "public.surveys", "public.survey_options"],
    omittedColumns: { "public.survey_options": OMITTED_COLUMNS.survey_options },
  },
  // rowCount 는 v1 과 같이 events 의 줄 수다.
  rowCount: events.length,
  rowCounts: {
    events: events.length,
    surveys: surveys.length,
    survey_options: surveyOptions.length,
  },
  events,
  surveys,
  survey_options: surveyOptions,
};
const content = `${JSON.stringify(backup, null, 2)}\n`;
const digest = crypto.createHash("sha256").update(content).digest("hex");
const filename = `events-${timestampForFile(createdAt)}.json`;
const finalPath = path.join(outputDirectory, filename);
const temporaryPath = `${finalPath}.${process.pid}.tmp`;
const checksumPath = `${finalPath}.sha256`;

await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx" });
await fs.rename(temporaryPath, finalPath);
await fs.writeFile(checksumPath, `${digest}  ${filename}\n`, {
  encoding: "utf8",
  flag: "wx",
});

console.log(`Backup complete: ${events.length} events, ${surveys.length} surveys, ${surveyOptions.length} survey options`);
console.log(`File: ${finalPath}`);
console.log(`SHA-256: ${digest}`);

// 30일 정리 (2026-09-16 운영자 결정). 파일명의 시각으로 판정한다 — 수정 시각은 복사·복원으로 바뀔 수 있다.
// 새 백업이 방금 성공한 뒤에만 지우고, 최근 5개는 날짜와 무관하게 남긴다. --keep-days 0 이면 정리하지 않는다.
const keepDays = Number(argumentValue("--keep-days") ?? 30);
if (Number.isFinite(keepDays) && keepDays > 0) {
  const cutoff = createdAt.getTime() - keepDays * 86_400_000;
  const stamps = (await fs.readdir(outputDirectory))
    .map((name) => /^events-(\d{8}T\d{6}Z)\.json$/.exec(name)?.[1])
    .filter(Boolean)
    .sort();
  const protectedStamps = new Set(stamps.slice(-5));
  let removed = 0;
  for (const stamp of stamps) {
    if (protectedStamps.has(stamp)) continue;
    const at = Date.parse(stamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, "$1-$2-$3T$4:$5:$6Z"));
    if (!(at < cutoff)) continue;
    for (const suffix of [".json", ".json.sha256"]) {
      await fs.rm(path.join(outputDirectory, `events-${stamp}${suffix}`), { force: true });
    }
    removed += 1;
  }
  console.log(`Pruned: ${removed} backup(s) older than ${keepDays} days`);
}
