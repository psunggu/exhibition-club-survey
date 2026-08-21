/**
 * frozen-data.mjs — 화면을 잴 때 **DB 응답도 한 번 떠 둔 것으로 고정한다.**
 *
 * ── 왜 필요한가 ────────────────────────────────────────────
 * 시계를 묶어도 화면은 여전히 흔들린다. 보드 내용이 통째로 DB 에서 오기 때문이다.
 * 재 봤다 (보드-1280):
 *
 *   DB 를 읽을 때   전시 카드 20개 · 글자 11,316자 · 높이 10,927px
 *   DB 를 막을 때   전시 카드  0개 · 글자    141자 · 높이    286px
 *
 * 그런데 보드는 **매주 수·토 22시에 갱신**된다. 전시가 하나 늘거나 끝나면
 * 그날 밤부터 화면 대조가 실패한다 — 디자인은 한 곳도 안 바뀐 채로.
 * 시계를 묶은 이유와 똑같다. 거짓 경보는 검사를 죽인다.
 *
 * ── 무엇을 잃고 무엇을 지키나 ───────────────────────────────
 * 이 고정본을 쓰면 화면 검사는 **진짜 DB 가 멀쩡한지 더 이상 안 본다.**
 * 그건 원래 이 검사의 일이 아니고, 그 일을 하는 검사가 따로 있다.
 *   verify-survey-live.mjs        실제 REST 로 설문을 확인한다
 *   validate-supabase-readonly.mjs 공개 표가 읽기 전용인지 확인한다
 * 덤으로 CI 가 Supabase 접속 여부에 걸리지 않는다.
 *
 * **대신 이런 것을 못 잡는다.** 새로 들어온 전시의 제목이 유난히 길어 칸을 넘치거나,
 * 자료가 늘어 목록이 접히는 일. 고정본을 다시 뜨기 전까지는 안 보인다.
 * 그러니 보드에 눈에 띄게 다른 모양의 자료가 들어오면 다시 뜨는 것이 맞다 —
 * 그때는 화면 기준도 같이 다시 찍는다. 두 파일은 늘 짝이다.
 *
 * ── 없는 요청이 오면 ────────────────────────────────────────
 * **조용히 빈 값을 주지 않는다.** 그러면 화면이 텅 빈 채로 「통과」 가 나온다.
 * 못 찾은 요청을 모아 두고, 부른 쪽이 검사 끝에서 실패로 처리한다.
 * 화면이 새 자료를 읽기 시작했다면 고정본을 다시 떠야 한다는 뜻이다.
 *
 *   node scripts/record-frozen-data.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FROZEN_DATA_FILE = path.join(ROOT, 'docs/fixtures/supabase-responses.json');

/** 요청 하나를 가리키는 이름. 주소와 보낸 몸통까지 봐야 RPC 가 구분된다. */
export function requestKey(method, url, postData) {
  const u = new URL(url);
  return `${method} ${u.pathname}${u.search}${postData ? ` + ${postData}` : ''}`;
}

const misses = new Set();
/** 고정본에 없던 요청들 — 검사 끝에서 확인한다 */
export const frozenMisses = () => [...misses];

/**
 * 페이지가 Supabase 를 부르면 떠 둔 답을 대신 준다.
 * `goto` 보다 먼저 불러야 첫 그림부터 같은 자료로 그려진다.
 */
export async function serveFrozenData(page) {
  if (!fs.existsSync(FROZEN_DATA_FILE)) {
    console.error('DB 고정본이 없다 — `node scripts/record-frozen-data.mjs` 로 한 번 떠 둔다.');
    process.exit(1);
  }
  const saved = JSON.parse(fs.readFileSync(FROZEN_DATA_FILE, 'utf8'));
  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request();
    const key = requestKey(req.method(), req.url(), req.postData());
    const hit = saved.responses[key];
    if (!hit) {
      misses.add(key);
      // 500 을 준다. 빈 200 을 주면 화면이 「자료가 없는 정상 화면」 처럼 그려져
      // 놓친 것을 아무도 눈치채지 못한다.
      return route.fulfill({ status: 500, contentType: 'application/json',
        body: '{"message":"고정본에 없는 요청"}' });
    }
    return route.fulfill({ status: hit.status, contentType: hit.contentType, body: hit.body });
  });
  return saved;
}

/** 검사 끝에서 부른다 — 놓친 요청이 있으면 실패로 끝낸다. */
export function failOnFrozenMisses() {
  const m = frozenMisses();
  if (!m.length) return;
  console.error(`\nDB 고정본에 없는 요청 ${m.length}가지 — 화면이 덜 그려진 채로 쟀다.`);
  m.forEach((k) => console.error(`  · ${k.slice(0, 160)}`));
  console.error('`node scripts/record-frozen-data.mjs` 로 다시 떠야 한다.\n');
  process.exit(1);
}
