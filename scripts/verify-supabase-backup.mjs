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

if (backup.format !== "exhibition-club-events-backup/v1") {
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

const requiredFields = ["id", "title", "created_at", "updated_at"];
const ids = new Set();
for (const event of backup.events) {
  for (const field of requiredFields) {
    if (event[field] === null || event[field] === undefined || event[field] === "") {
      throw new Error(`Event is missing required field: ${field}`);
    }
  }
  if (ids.has(event.id)) throw new Error(`Duplicate event id: ${event.id}`);
  ids.add(event.id);
}

const digest = crypto.createHash("sha256").update(content).digest("hex");
const checksumPath = `${resolvedPath}.sha256`;
try {
  const checksum = (await fs.readFile(checksumPath, "utf8")).trim().split(/\s+/)[0];
  if (checksum !== digest) throw new Error("Backup SHA-256 checksum does not match");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

console.log(`Backup verified: ${backup.rowCount} rows`);
console.log(`Created: ${backup.createdAt}`);
console.log(`SHA-256: ${digest}`);
