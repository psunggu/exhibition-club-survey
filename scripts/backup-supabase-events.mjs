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
        "exhibition_club_codex_package",
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

const endpoint = new URL("/rest/v1/events", supabaseUrl);
endpoint.searchParams.set("select", "*");
endpoint.searchParams.set("order", "created_at.asc");

const response = await fetch(endpoint, {
  headers: {
    Accept: "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  },
  redirect: "error",
});

if (!response.ok) {
  throw new Error(`Supabase read failed (${response.status})`);
}

const events = await response.json();
if (!Array.isArray(events) || events.length === 0) {
  throw new Error("Backup refused because the events response is empty or invalid");
}

const ids = new Set();
for (const event of events) {
  if (!event || typeof event !== "object" || typeof event.id !== "string") {
    throw new Error("Backup refused because an event has no valid id");
  }
  if (ids.has(event.id)) {
    throw new Error(`Backup refused because event id ${event.id} is duplicated`);
  }
  ids.add(event.id);
}

const createdAt = new Date();
const backup = {
  format: "exhibition-club-events-backup/v1",
  createdAt: createdAt.toISOString(),
  source: {
    projectRef: new URL(supabaseUrl).hostname.split(".")[0],
    table: "public.events",
  },
  rowCount: events.length,
  events,
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

console.log(`Backup complete: ${events.length} rows`);
console.log(`File: ${finalPath}`);
console.log(`SHA-256: ${digest}`);
