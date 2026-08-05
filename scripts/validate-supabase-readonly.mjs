import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8").replace(/\r\n/g, "\n");

const schemaPath = "exhibition_club_codex_package/supabase/schema.sql";
const migrationPath =
  "exhibition_club_codex_package/supabase/migrations/202608050001_lock_down_public_events.sql";
const appPath = "exhibition_club_codex_package/public/app.js";
const htmlPath = "exhibition_club_codex_package/public/index.html";
const configPath = "exhibition_club_codex_package/public/config.js";

const schema = read(schemaPath);
const migration = read(migrationPath);
const app = read(appPath);
const html = read(htmlPath);
const config = read(configPath);

const failures = [];

function requireMatch(label, value, pattern) {
  if (!pattern.test(value)) failures.push(label + ": 필수 보안 규칙이 없습니다.");
}

function forbidMatch(label, value, pattern) {
  if (pattern.test(value)) failures.push(label + ": 금지된 공개 쓰기 경로가 남아 있습니다.");
}

for (const [label, sql] of [
  [schemaPath, schema],
  [migrationPath, migration],
]) {
  requireMatch(
    label + " 권한 회수",
    sql,
    /revoke\s+all\s+on\s+table\s+public\.events\s+from\s+public\s*,\s*anon\s*,\s*authenticated\s*;/i,
  );
  requireMatch(
    label + " 읽기 권한",
    sql,
    /grant\s+select\s+on\s+table\s+public\.events\s+to\s+anon\s*,\s*authenticated\s*;/i,
  );
  requireMatch(
    label + " SELECT 정책",
    sql,
    /create\s+policy\s+"events_select_public"[\s\S]*?for\s+select[\s\S]*?to\s+anon\s*,\s*authenticated[\s\S]*?using\s*\(true\)\s*;/i,
  );
  requireMatch(
    label + " 기존 정책 전체 제거",
    sql,
    /select\s+policyname[\s\S]*?from\s+pg_policies[\s\S]*?execute\s+format\('drop policy %I on public\.events'/i,
  );
  forbidMatch(
    label + " 쓰기 정책",
    sql,
    /create\s+policy[\s\S]*?on\s+public\.events[\s\S]*?for\s+(?:insert|update|delete|all)\b/i,
  );
}

requireMatch(
  migrationPath + " 실행 후 테이블 권한 검증",
  migration,
  /information_schema\.role_table_grants[\s\S]*?grantee\s+in\s*\('PUBLIC'\s*,\s*'anon'\s*,\s*'authenticated'\)[\s\S]*?privilege_type\s*<>\s*'SELECT'/i,
);
requireMatch(
  migrationPath + " 실행 후 열 권한 검증",
  migration,
  /information_schema\.column_privileges[\s\S]*?privilege_type\s+in\s*\('INSERT'\s*,\s*'UPDATE'\)/i,
);

forbidMatch(
  appPath + " HTTP 쓰기 메서드",
  app,
  /method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i,
);
forbidMatch(
  appPath + " Supabase 쓰기 함수",
  app,
  /\.(?:upsert|insert|update|delete|remove)\s*\(/i,
);
forbidMatch(
  appPath + " 공개 편집 UI 연결",
  app,
  /\b(?:openDialog|saveFromForm|deleteCurrentEvent|data-edit)\b/i,
);
forbidMatch(
  htmlPath + " 공개 편집 UI",
  html,
  /id=["'](?:openFormButton|eventDialog|eventForm|deleteButton|sheetLink)["']/i,
);
forbidMatch(
  configPath + " 운영 Sheet 링크",
  config,
  /\bsheetUrl\b|docs\.google\.com\/.*\/edit/i,
);

requireMatch(htmlPath + " 폼 제출 차단", html, /form-action\s+'none'/i);
requireMatch(htmlPath + " 인라인 스크립트 차단", html, /script-src-attr\s+'none'/i);
requireMatch(htmlPath + " 인라인 스타일 차단", html, /style-src-attr\s+'none'/i);

if (failures.length > 0) {
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("Supabase 공개 events 읽기 전용 보안 검증 통과");
