import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const fileIndex = process.argv.indexOf("--file");
const backupPath = fileIndex >= 0 ? process.argv[fileIndex + 1] : null;
if (!backupPath) {
  throw new Error("Usage: node scripts/verify-supabase-backup.mjs --file <backup.json>");
}

const resolvedPath = path.resolve(backupPath);
const content = await fs.readFile(resolvedPath, "utf8");
const backup = JSON.parse(content);

// v1 은 events 만, v2(2026-10-04 부터)는 surveys · survey_options 도 담는다.
const isV2 = backup.format === "exhibition-club-events-backup/v2";
if (!isV2 && backup.format !== "exhibition-club-events-backup/v1") {
  throw new Error("Unsupported backup format");
}
if (!Array.isArray(backup.events) || backup.events.length === 0) {
  throw new Error("Backup contains no events");
}
if (backup.rowCount !== backup.events.length) {
  throw new Error("Backup row count does not match the events array");
}
if (Number.isNaN(Date.parse(backup.createdAt))) {
  throw new Error("Backup creation time is invalid");
}

function checkRows(table, rows, requiredFields) {
  if (!Array.isArray(rows)) throw new Error(`Backup has no ${table} array`);
  const ids = new Set();
  for (const row of rows) {
    for (const field of requiredFields) {
      if (row[field] === null || row[field] === undefined || row[field] === "") {
        throw new Error(`${table} row is missing required field: ${field}`);
      }
    }
    if (ids.has(row.id)) throw new Error(`Duplicate ${table} id: ${row.id}`);
    ids.add(row.id);
  }
  return ids;
}

checkRows("events", backup.events, ["id", "title", "created_at", "updated_at"]);

if (isV2) {
  for (const table of ["events", "surveys", "survey_options"]) {
    if (backup.rowCounts?.[table] !== backup[table]?.length) {
      throw new Error(`Backup row count does not match the ${table} array`);
    }
  }
  const surveyIds = checkRows("surveys", backup.surveys, ["id", "title", "created_at"]);
  checkRows("survey_options", backup.survey_options, ["id", "survey_id", "position", "title"]);
  for (const option of backup.survey_options) {
    if (!surveyIds.has(option.survey_id)) {
      throw new Error(`Survey option ${option.id} points to a survey missing from the backup`);
    }
    // 투표자 이름은 백업에 두지 않는다(backup-supabase-events.mjs 의 OMITTED_COLUMNS).
    if ("imported_voters" in option) {
      throw new Error("Backup must not contain survey_options.imported_voters");
    }
  }
}

const digest = crypto.createHash("sha256").update(content).digest("hex");
const checksumPath = `${resolvedPath}.sha256`;
try {
  const checksum = (await fs.readFile(checksumPath, "utf8")).trim().split(/\s+/)[0];
  if (checksum !== digest) throw new Error("Backup SHA-256 checksum does not match");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

console.log(isV2
  ? `Backup verified: ${backup.rowCount} events, ${backup.surveys.length} surveys, ${backup.survey_options.length} survey options`
  : `Backup verified: ${backup.rowCount} events`);
console.log(`Created: ${backup.createdAt}`);
console.log(`SHA-256: ${digest}`);
