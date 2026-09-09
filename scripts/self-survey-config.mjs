/**
 * self-survey-config.mjs — 검사기가 `config.js` 의 `selfSurvey` 를 바꿔 끼운다.
 *
 * ── 왜 필요한가 ────────────────────────────────────────────
 * 2026-09-09 부터 투표는 톡방에서 하고 사이트는 결과만 보여 준다. 배포되는
 * `app/public/config.js` 는 `selfSurvey: false` 다. 그런데 회원이 사이트에서
 * 응답하던 화면 코드는 얼마간 남겨 둔다 — 그 코드를 잰 검사(`validate-survey-ui` 의
 * 이름 확인 · 체크 · 제출 흐름)는 **켠 설정에서만** 뜻이 있다.
 *
 * 검사기는 `dist/` 를 그대로 서빙하므로, 이 헬퍼가 `config.js` 응답만 가로채
 * 원하는 값으로 바꿔 준다. 화면 코드도 배포 설정 파일도 손대지 않는다.
 *
 * 켠 채로 다 재고 나서 **꺼진 설정으로 한 번 더 잰다** — 배포되는 것은 꺼진 쪽이다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'app/public/config.js');

/** 배포 설정 파일을 읽어 `selfSurvey` 만 원하는 값으로 바꾼 본문. */
export function configWithSelfSurvey(on) {
  const src = fs.readFileSync(SRC, 'utf8');
  const line = `  selfSurvey: ${on ? 'true' : 'false'},`;
  if (/^\s*selfSurvey:/m.test(src)) {
    return src.replace(/^\s*selfSurvey:\s*(?:true|false)\s*,?\s*$/m, line);
  }
  // 키가 아예 없으면(옛 설정) 닫는 괄호 앞에 넣는다
  return src.replace(/\n};\s*$/, `\n${line}\n};\n`);
}

/**
 * 페이지나 컨텍스트가 `config.js` 를 부르면 바꾼 본문을 준다.
 * 이미 걸어 둔 것이 있으면 걷어 내고 다시 건다 — 켠 뒤 끄는 흐름을 위해서다.
 */
export async function serveSelfSurveyConfig(target, on) {
  await target.unroute('**/config.js').catch(() => {});
  await target.route('**/config.js', (route) => route.fulfill({
    status: 200, contentType: 'text/javascript', body: configWithSelfSurvey(on),
  }));
}
