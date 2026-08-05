import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);

const failures = [];
const publicAnonConfig = "exhibition_club_codex_package/public/config.js";

function normalized(file) {
  return file.replaceAll("\\", "/");
}

function isBlockedPath(file) {
  const path = normalized(file);
  const name = path.split("/").at(-1);

  if (/(^|\/)(?:outputs|backups?|local-backups)\//iu.test(path)) return true;
  if (name !== ".env.example" && /^\.env(?:\.|$)/iu.test(name)) return true;
  if (/\.(?:pem|p12|pfx)$/iu.test(name)) return true;
  if (/^events-\d{8}T\d{6}Z\.json(?:\.sha256)?$/iu.test(name)) return true;
  return false;
}

function decodeJwtRole(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(decoded).role;
  } catch {
    return null;
  }
}

for (const file of trackedFiles) {
  if (isBlockedPath(file)) {
    failures.push(`${file}: local credential, key, or backup artifact is tracked`);
    continue;
  }

  let bytes;
  try {
    bytes = readFileSync(file);
  } catch {
    failures.push(`${file}: tracked file could not be read`);
    continue;
  }

  if (bytes.length > 2_000_000 || bytes.includes(0)) continue;
  const text = bytes.toString("utf8");
  const checks = [
    ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u],
    ["Supabase secret key", /\bsb_secret_[A-Za-z0-9_-]{12,}\b/u],
    ["GitHub token", /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,})\b/u],
    ["OpenAI API key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/u],
    ["Telegram bot token", /\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/u],
  ];

  for (const [label, pattern] of checks) {
    if (pattern.test(text)) failures.push(`${file}: possible ${label} detected`);
  }

  const jwtPattern = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gu;
  for (const token of text.match(jwtPattern) ?? []) {
    const role = decodeJwtRole(token);
    if (role === "service_role") {
      failures.push(`${file}: Supabase service_role JWT detected`);
    } else if (role && !(role === "anon" && normalized(file) === publicAnonConfig)) {
      failures.push(`${file}: unexpected JWT role detected`);
    }
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Repository hygiene checks passed (${trackedFiles.length} tracked files)`);
