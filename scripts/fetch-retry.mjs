/**
 * fetch-retry.mjs — 잠깐 끊긴 바깥 사이트를 한 번에 포기하지 않는다.
 *
 * 왜 있나: 영화 순위 배치가 2026-09-12 13:55 에 KOBIS 연결 시간 초과(undici 기본 10초)
 * 한 번으로 통째로 실패했다. 낮에는 KOBIS 가 느리고, 배치는 PC 가 깨어나는 아무 때나 돈다.
 * 한 번 실패는 흔하고 세 번 연속 실패는 드물다 — 그 차이를 여기서 흡수한다.
 *
 * 다시 시도하는 것: 연결 실패(`fetch failed`) · 시간 초과 · HTTP 5xx · 429.
 * 다시 시도하지 않는 것: HTTP 4xx(429 제외) — 주소나 요청이 틀린 것이라 기다려도 안 바뀐다.
 *
 * 의존성 없음. undici 의 연결 시간 초과는 밖에서 못 늘리므로(dispatcher 가 필요하다)
 * 시도마다 AbortSignal.timeout 을 따로 걸고, 실패하면 간격을 두고 다시 부른다.
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 이 오류는 기다렸다 다시 하면 풀릴 수 있는가. */
export function isTransient(err) {
  if (!err) return false;
  const name = err.name ?? '';
  if (name === 'AbortError' || name === 'TimeoutError') return true;
  if (err instanceof TypeError && /fetch failed/i.test(err.message ?? '')) return true;
  const cause = err.cause;
  if (cause && /ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|UND_ERR_CONNECT_TIMEOUT|UND_ERR_SOCKET/i
    .test(`${cause.code ?? ''} ${cause.name ?? ''} ${cause.message ?? ''}`)) return true;
  if (typeof err.status === 'number') return err.status === 429 || err.status >= 500;
  return false;
}

/**
 * fetch 를 최대 `attempts` 번 시도한다. 시도마다 `timeoutMs` 를 걸고,
 * 실패하면 `delaysMs[i]` 만큼 쉬고 다시 한다. 마지막 실패는 그대로 던진다.
 *
 * `onRetry(attempt, err)` 로 무슨 일이 있었는지 밖에서 로그에 남길 수 있다 —
 * 조용히 재시도하면 「가끔 느리다」 는 사실이 아무 데도 안 남는다.
 */
export async function fetchWithRetry(url, init = {}, {
  attempts = 3, timeoutMs = 30000, delaysMs = [5000, 15000], onRetry = () => {}, fetchImpl = fetch,
} = {}) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) {
        const e = new Error(`${url} → HTTP ${res.status}`);
        e.status = res.status;
        throw e;
      }
      return res;
    } catch (err) {
      last = err;
      if (i === attempts - 1 || !isTransient(err)) throw err;
      onRetry(i + 1, err);
      await sleep(delaysMs[Math.min(i, delaysMs.length - 1)] ?? 0);
    }
  }
  throw last;
}
