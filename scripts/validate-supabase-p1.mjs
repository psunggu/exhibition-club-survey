import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8").replace(/\r\n/g, "\n");

const schemaPath = "exhibition_club_codex_package/supabase/schema.sql";
const migrationPath =
  "exhibition_club_codex_package/supabase/migrations/202608060001_harden_default_privileges_and_function.sql";
const rollbackPath = migrationPath.replace(/\.sql$/, ".rollback.sql");

const schema = read(schemaPath);
const migration = read(migrationPath);
const rollback = read(rollbackPath);
const failures = [];

function requireMatch(label, value, pattern) {
  if (!pattern.test(value)) failures.push(`${label}: required guard is missing`);
}

for (const [label, sql] of [
  [schemaPath, schema],
  [migrationPath, migration],
]) {
  requireMatch(
    `${label} table defaults`,
    sql,
    /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+in\s+schema\s+public\s+revoke\s+all\s+on\s+tables\s+from\s+public\s*,\s*anon\s*,\s*authenticated\s*,\s*service_role\s*;/i,
  );
  requireMatch(
    `${label} sequence defaults`,
    sql,
    /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+in\s+schema\s+public\s+revoke\s+all\s+on\s+sequences\s+from\s+public\s*,\s*anon\s*,\s*authenticated\s*,\s*service_role\s*;/i,
  );
  requireMatch(
    `${label} global PUBLIC function default`,
    sql,
    /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+revoke\s+execute\s+on\s+functions\s+from\s+public\s*;/i,
  );
  requireMatch(
    `${label} Data API function defaults`,
    sql,
    /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+in\s+schema\s+public\s+revoke\s+execute\s+on\s+functions\s+from\s+anon\s*,\s*authenticated\s*,\s*service_role\s*;/i,
  );
}

requireMatch(
  `${schemaPath} function search_path`,
  schema,
  /create\s+or\s+replace\s+function\s+public\.set_updated_at\(\)[\s\S]*?set\s+search_path\s*=\s*''/i,
);
requireMatch(
  `${migrationPath} function search_path`,
  migration,
  /alter\s+function\s+public\.set_updated_at\(\)\s+set\s+search_path\s*=\s*''\s*;/i,
);
requireMatch(
  `${migrationPath} database postcondition`,
  migration,
  /pg_default_acl[\s\S]*?aclexplode[\s\S]*?raise\s+exception/i,
);
requireMatch(
  `${migrationPath} implicit PUBLIC execute postcondition`,
  migration,
  /defaclnamespace\s*=\s*0[\s\S]*?new postgres functions still inherit PUBLIC execute/i,
);
requireMatch(
  `${migrationPath} existing read-only contract`,
  migration,
  /has_table_privilege\('anon',\s*'public\.events',\s*'SELECT'\)[\s\S]*?has_table_privilege\('anon',\s*'public\.events',\s*'INSERT'\)/i,
);
requireMatch(
  `${rollbackPath} risk warning`,
  rollback,
  /Emergency rollback only[\s\S]*reintroduces the P1 exposure risk/i,
);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Supabase P1 default privilege and function guards passed");
