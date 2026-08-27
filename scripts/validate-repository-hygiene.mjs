import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * 추적 중인 파일뿐 아니라 **아직 커밋 안 한 새 파일도** 본다.
 *
 * 처음에는 `ls-files` 만 봤다. 그런데 새로 만든 파일은 아직 추적 전이라
 * 로컬에서 돌리면 조용히 건너뛰고 통과했다 — 실제로 실명이 든 새 마이그레이션이
 * 로컬을 지나 CI 에서야 걸렸다. 잡을 거면 **만든 자리에서** 잡아야 한다.
 *
 * `--exclude-standard` 를 붙여 .gitignore 가 막는 것은 빼 둔다.
 * out/ 안의 명부처럼 **일부러 저장소 밖에 두는 것**까지 잡으면 검사가 못 쓰게 된다.
 */
const gitList = (args) => execFileSync("git", args, { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const trackedFiles = [...new Set([
  ...gitList(["ls-files", "-z"]),
  ...gitList(["ls-files", "-z", "--others", "--exclude-standard"]),
])];

const failures = [];
const publicAnonConfig = "app/public/config.js";

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

/**
 * 저장소가 스스로 들고 있는 **가상 회원 명부.** 예시로 쓰인 이름은 여기 있는 것뿐이고,
 * 여기 없는 이름이 대화 형식과 함께 나오면 진짜 사람일 가능성이 높다.
 */
const fictionalNames = (() => {
  try {
    const raw = readFileSync("docs/fixtures/sample-members.json", "utf8");
    const found = raw.match(/[가-힣]{2,4}/gu) ?? [];
    return new Set([...found, "홍길동", "김철수", "이영희", "아무개", "길동"]);
  } catch {
    return new Set(["홍길동", "김철수", "이영희", "아무개", "길동"]);
  }
})();

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
    /**
     * 단톡방 대화가 저장소로 새어 들어왔는지 본다.
     *
     * 실제로 샜다. 파서를 만들면서 **주석에 실제 회원 이름을 예시로 적었다.**
     * 원본 txt 는 .gitignore 가 막고 있었지만, 사람이 손으로 옮겨 적은 것은
     * 아무것도 막지 않았다.
     *
     * 이름을 여기 적어 두면 그 자체가 유출이므로 **모양으로 잡는다** —
     * 오픈채팅 프로필 규칙(구역번호+성명)과 내보내기 파일의 줄 형식.
     *
     * 예시가 필요하면 `docs/fixtures/sample-members.json` 의 가상 회원을 쓴다.
     * 그 명부를 여기서 읽어 통과시키므로, 이름을 이 파일에 또 적을 필요가 없다
     * (적으면 그것대로 관리할 것이 하나 늘고, 진짜 이름과 섞일 위험이 생긴다).
     */
    // 줄 맨 앞에 고정하지 않는다. 옮겨 적힌 대화는 주석이나 따옴표 안에 들어와
    // 앞에 `// ` 나 `"` 가 붙는다 — 고정해 두었더니 그런 것을 통째로 놓쳤다.
    /**
     * 앞에 쉼표가 오면 구역번호가 아니라 **금액의 끝자리**다.
     * 식당 안내 문서를 올릴 때 걸렸다 — 메뉴 값을 쉼표로 끊어 적고 슬래시로 나열한 줄이었고,
     * 사람 이름은 한 글자도 없었다. 오탐이 한 번 나면 다음부터 이 검사를 대충 보게 되므로 좁혀 둔다.
     * 진짜 구역번호는 줄 앞이나 공백 뒤에 오지 쉼표 뒤에 오지 않는다.
     *
     * 걸린 문구를 **여기 그대로 옮겨 적지 않는다.** 처음에 예시로 적었더니
     * 이 파일이 스스로 걸렸다 — 실제 이름을 주석에 적어 걸렸던 것과 같은 일이다.
     */
    ["단톡방 프로필(구역번호+성명)",
      /(?<![\d/,])\d{3,4}\s*\/\s*[가-힣]{2,4}(?![\d/가-힣])/gu],
    /**
     * 슬래시 없이 **띄어쓰기로만** 이어진 꼴도 본다 — 설문 화면이 그렇게 보여 주므로
     * 옮겨 적을 때 이 모양이 된다. 실제로 이 꼴로 한 번 새어 들어왔다.
     *
     * 슬래시 규칙보다 헐거워서 두 가지를 좁혔다.
     *   · **네 자리만** 본다 — 세 자리면 `404 폴백` 같은 것이 걸린다
     *   · **19·20 으로 시작하는 것은 뺀다** — 연도다. `2026 뮤지컬` 이 걸렸었다
     * 이 저장소를 통째로 훑어 오탐이 0 인 것을 확인하고 정한 조건이다.
     */
    ["단톡방 프로필(구역번호 띄고 성명)",
      /(?<![\d/,])(?!19|20)\d{4}[ \t]+[가-힣]{2,4}(?![\d/가-힣])/gu],
    ["대화 내보내기 발화 줄", /\[[^\]\n]{1,30}\]\s*\[(?:오전|오후)\s*\d{1,2}:\d{2}\]/gu],
    ["대화 내보내기 날짜 구분선", /-{5,}\s*\d{4}년\s*\d{1,2}월\s*\d{1,2}일\s*[월화수목금토일]요일/gu],
    ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u],
    ["Supabase secret key", /\bsb_secret_[A-Za-z0-9_-]{12,}\b/u],
    ["Supabase access token", /\bsbp_(?:v\d+_)?[A-Za-z0-9_-]{20,}\b/u],
    ["GitHub token", /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,})\b/u],
    ["OpenAI API key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/u],
    ["Telegram bot token", /\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/u],
  ];

  for (const [label, pattern] of checks) {
    /**
     * **일치하는 것을 전부 본다.** 처음에는 첫 일치만 보고 넘어갔는데,
     * 파일 앞쪽에 가상 이름 예시(`4133/홍길동`)가 있으면 거기서 통과 처리되어
     * 뒤에 있는 진짜 이름을 영영 못 봤다. 결함을 넣어 시험하다 드러났다.
     */
    const hits = pattern.global ? [...text.matchAll(pattern)] : [pattern.exec(text)].filter(Boolean);
    for (const hit of hits) {
      // 가상 회원 명부에 있는 이름만 나온 자리는 예시다 — 통과시킨다
      const names = hit[0].match(/[가-힣]{2,4}/gu) ?? [];
      if (names.length && names.every((x) => fictionalNames.has(x))) continue;
      failures.push(`${file}: possible ${label} detected — ${JSON.stringify(hit[0].slice(0, 40))}`);
      break;   // 한 파일에서 같은 종류는 한 번만 알린다
    }
  }

  /**
   * **옮겨 온 투표의 투표자 실명.**
   *
   * survey_options.imported_voters 에는 톡방에서 옮겨 적은 회원 실명이 들어간다.
   * 위 두 프로필 규칙은 **구역번호가 이름 옆에 붙어 있을 때만** 잡는다.
   * 맨 이름만 늘어놓은 배열은 하나도 안 걸린다 — 재서 확인했다:
   * `imported_voters = array['…','…']` 를 네 규칙에 모두 넣어 본 결과 0건이었다.
   *
   * 그래서 이 값은 **자리에서 잡는다.** 추적되는 파일의 imported_voters 배열에는
   * 가상 명부(docs/fixtures/sample-members.json)의 이름만 올 수 있다.
   * 진짜 이름이 든 SQL 은 커밋하지 않고 운영자가 손으로 실행한다
   * (202608270001b_poll_voters.template.sql 이 그 틀이다).
   *
   * 이름은 **배열 안쪽에서만** 뽑는다. 사이에 낀 한국어 주석까지 긁으면
   * 「투표자」·「이름」 같은 낱말이 사람 이름으로 잡혀 거짓 경보가 난다 —
   * 거짓 경보가 한 번 나면 다음부터 이 검사를 대충 보게 된다.
   *
   * 배열 모양을 **세 가지** 본다. 처음에는 SQL 두 가지만 봤는데,
   * 정작 가장 위험한 자리인 docs/fixtures/supabase-responses.json 은 JSON 이라
   * 하나도 안 걸렸다 — 그 파일은 REST 응답을 통째로 떠서 추적된다.
   *   array['…','…']   SQL
   *   '{"…","…"}'      SQL 배열 리터럴
   *   : ["…","…"]      JSON · JS 목업
   */
  /**
   * **명부 대량입력 SQL 도 같은 구멍이었다.**
   *
   * `('4133', '홍길동')` 은 위 두 프로필 규칙을 **하나도 안 건드린다** — 재서 확인했다.
   * 첫 규칙은 슬래시를, 둘째는 숫자 바로 뒤의 공백을 요구하는데
   * SQL 튜플은 사이에 `', '` 가 끼기 때문이다.
   * 명부는 그 자체가 교인 명부라 이쪽이 더 위험하다.
   *
   * 그래서 **튜플 모양**을 따로 본다 — 따옴표에 싸인 3~4자리 숫자 바로 뒤에
   * 따옴표에 싸인 한글이 오는 자리. 보드 자료(`'303', 'true'` 같은 것)는
   * 뒤쪽에 한글이 없어 안 걸린다.
   *
   * **구역번호가 전부 0 이면 뺀다.** 자리표시자다 —
   * 202608220001a 의 확인 질의가 `survey_member_ok('0000', '없는사람')` 으로
   * 「없는 사람은 false 여야 한다」 를 재고 있는데, 그것까지 잡으면 거짓 경보가 된다.
   * 투표자 이름 틀의 0 으로 채운 uuid 와 같은 규칙이다.
   */
  const memberTuple = /\(\s*'(?!0+')\d{3,4}'\s*,\s*'([^']*[가-힣][^']*)'/gu;
  for (const hit of text.matchAll(memberTuple)) {
    const names = (hit[1] ?? "").match(/[가-힣]{2,4}/gu) ?? [];
    if (!names.length) continue;
    if (names.every((x) => fictionalNames.has(x))) continue;
    failures.push(`${file}: 명부 대량입력에 가상 명부 밖의 이름이 있다 `
      + `— ${JSON.stringify(hit[0].slice(0, 40))}`);
    break;
  }

  const votersLiteral =
    /imported_voters[\s\S]{0,200}?(array\s*\[[^\]]*\]|'\{[^}]*\}'|:\s*\[[^\]]*\])/gu;
  for (const hit of text.matchAll(votersLiteral)) {
    const literal = hit[1] ?? "";
    const names = literal.match(/[가-힣]{2,4}/gu) ?? [];
    if (!names.length) continue;
    if (names.every((x) => fictionalNames.has(x))) continue;
    failures.push(`${file}: imported_voters 에 가상 명부 밖의 이름이 있다 `
      + `— ${JSON.stringify(literal.slice(0, 40))}`);
    break;
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
