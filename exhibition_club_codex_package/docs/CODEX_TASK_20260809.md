# CODEX_TASK_20260809.md

Claude 리뷰 세션(2026-08-09)에서 나온 지적 사항. `notice.html`·`weekly-digest.public.json`·`notice.js` FALLBACK·원본 digest·`AGENTS.md` 다섯 곳의 일정 정보를 대조한 결과다.

작업 전 `AGENTS.md`의 "개발 규칙"을 읽을 것. 특히 CSP(인라인 스타일·스크립트 금지), 캐시 버스팅 `?v=`, 375px 모바일, `word-break: keep-all`.

푸시 전 검증:

```bash
node scripts/validate-repository-hygiene.mjs && node scripts/validate-weekly-digest.mjs && node scripts/validate-supabase-readonly.mjs && node scripts/validate-supabase-p1.mjs && node --check exhibition_club_codex_package/public/app.js && node --check exhibition_club_codex_package/public/notice.js
```

## 정합성이 확인된 것 (수정 불필요)

- 8/15·8/22·8/29 토요일, 8/16 일요일 — 요일 전부 정확
- `message_count` 243, 기간 라벨 `7월 30일 ~ 8월 6일` — 원본 digest와 일치
- `weekly-digest.public.json`과 `notice.js`의 `FALLBACK_DIGEST` — 완전 일치
- 검증 스크립트 5종 전부 통과

---

## E1. 영화 《오디세이》 상영 종료 시각이 산술적으로 맞지 않는다 (우선순위 높음)

**문제**

같은 카드 안에서 두 숫자가 10분 어긋나 있다.

| 위치 | 표기 |
|---|---|
| `notice.html:84` | 오후 5시 30분 ~ **오후 8시 32분** 관람 |
| `notice.html:88` | 상영시간 **172분** |

17:30 + 172분 = **20:22**다. 20:32가 되려면 상영시간이 182분이어야 한다. 원본 digest의 note에도 "상영시간 172분"으로 되어 있으므로, **종료 시각 쪽이 틀렸을 가능성이 높다.** 다만 광고·예고편 포함 여부에 따라 172분이 순수 러닝타임일 수 있어 단정할 수 없다.

**이 작업은 사실 확인이 선행된다. 값을 추측해서 고치지 말 것.**

8/16 관람 뒤에 저녁식사·티타임이 이어지므로 회원의 실제 일정에 영향이 있다. 소유자가 실제 상영 정보(타임스퀘어 IMAX 해당 회차)를 확인한 뒤, 아래 둘 중 하나로 확정한다.

- **종료 시각이 틀린 경우** → 6곳의 `오후 8시 32분`을 올바른 값으로 교체
- **상영시간이 틀린 경우** → `172분`을 `182분`으로 교체 (2곳)

**구현 위치 — `오후 8시 32분` 계열 6곳을 반드시 함께 고칠 것**

| 파일 | 위치 | 표기 형태 |
|---|---|---|
| `public/notice.html` | `:84` | `오후 5시 30분 ~ 오후 8시 32분 관람` |
| `public/notice.js` | `:19` (FALLBACK_DIGEST) | `오후 5시 30분부터 오후 8시 32분까지` |
| `public/notice.js` | `:387` (eventDetails 팝업) | `오후 5시 30분~오후 8시 32분 관람` |
| `public/weekly-digest.public.json` | `:13` | `오후 5시 30분부터 오후 8시 32분까지` |
| `scripts/validate-weekly-digest.mjs` | `:171` | `digestTokens` 배열의 `"오후 8시 32분"` |
| `AGENTS.md` | `:45` | `17:30~20:32` |

`172분` 계열은 `public/notice.html:88`과 `public/notice.js:389` 2곳이다.

**여기서 반드시 알아야 할 것**: `scripts/validate-weekly-digest.mjs:171`이 기대값을 **하드코딩**하고 있다. 이 파일을 같이 고치지 않으면 나머지를 모두 고쳐도 검증이 실패한다. 반대로 검증만 고치고 본문을 빠뜨려도 실패한다 — 이 커플링이 의도된 안전장치이므로 우회하지 말 것.

`weekly-digest.public.json`과 `notice.js`의 `FALLBACK_DIGEST`는 문자 단위로 일치해야 한다(`validate-weekly-digest.mjs:141`).

**검증**

1. 위 검증 명령 5종 통과
2. `notice.html`의 `?v=` 갱신 — 현재 `notice.css?v=20260806-2`, `notice.js?v=20260806-3` (`notice.html:11~12`)
3. 브라우저로 `public/notice.html`을 열어 8/16 카드와 달력 팝업의 시각이 같은지 육안 확인

---

## E2. `card-alert`(운영진 확인)가 바로 위 본문의 반복이다 (우선순위 중간)

**문제**

`card-alert`는 페이지에서 가장 강한 강조 장치인데, 3개 중 2개가 바로 위 `meta` 문장의 재진술이다.

- `notice.html:71` — 본문에 "참여자 2명 확정"이 이미 있는데 알림도 "참여자 2명으로 확정됐으며 추가 모집은 종료되었습니다"
- `notice.html:101` — 본문에 "오후 2시 50분 집결"이 이미 있는데 알림도 "오후 2시 50분 서울역사박물관 앞 집결로 확정되었습니다"

강조 박스가 반복에 소모되면, 실제로 일정이 **바뀌었을 때** 그 박스가 눈에 띄지 않는다. 매주 갱신되는 페이지에서 이건 실질적인 손실이다.

**요구사항**

`card-alert`에는 본문에 없는 정보만 넣는다. 원본 digest의 `open_questions`와 이벤트 `note`에 넣을 값이 이미 있다.

- 8/15 클래식 — 본문에 없는 정보: 관람 후 **주차 관련 사항은 추가 확인 예정**
- 8/29 가우디 — **얼리버드 기간 내 티켓 구매 권장** (시한이 있는 정보라 특히 가치가 높다). 현재 이 카드에는 `card-alert`가 아예 없다.
- 8/22 서울역사박물관 — 본문과 겹치지 않는 내용이 없으면 `card-alert`를 **지운다.** 채우려고 문장을 만들지 말 것.

**구현 위치**

`public/notice.html`의 `<p class="card-alert">` 3곳(`:71`, `:88`, `:101`)과 가우디 카드(`:105`부터 시작하는 `<article>`).

**주의**

`card-alert` 유무는 `validate-weekly-digest.mjs`가 검사하지 않으므로 검증은 통과한다. 문구 판단은 사람이 해야 한다. 문장을 새로 쓸 때 원본 digest에 근거가 없는 내용을 지어내지 말 것.

**검증**

`?v=` 갱신 후 375px 폭에서 카드 레이아웃이 깨지지 않는지 확인. `card-alert`를 지운 카드의 하단 여백을 눈으로 볼 것.

---

## E3. 원본의 미확인 사항이 공개 페이지에 실리지 않는다 (우선순위 중간)

**문제**

원본 digest에는 `open_questions` 4건이 있는데 공개 페이지에는 거의 반영되지 않는다. `weekly-digest.public.json` 스키마에 해당 필드 자체가 없다(`validate-weekly-digest.mjs:20~29`의 `allowedRootKeys`).

미반영된 항목:

- 8/15 클래식 공연 주차 가능 여부
- 8/29 가우디 집결 시간과 최종 참석자 (카드에 "톡방 공지 확인"으로만 처리됨)
- 8/16 오디세이 관람 후 식사·티타임 장소와 인원
- 8/22 서울역사박물관 세부 일정

회원 입장에서 "무엇이 아직 안 정해졌는지"를 알 방법이 없다. 확정 정보만 보이면 안 정해진 것도 정해진 줄 알게 된다.

**요구사항**

`weekly-digest.public.json` 스키마에 `open_questions`를 추가하고 주간 정리봇 영역에 렌더링한다.

- `allowedRootKeys`에 `open_questions` 추가 (`validate-weekly-digest.mjs:20~29`)
- 검증 규칙은 `decisions`와 같은 형태를 따른다 — 배열, 최대 8개, 각 항목 `assertPublicText(..., 180)` (`validate-weekly-digest.mjs:111~116` 참고)
- `schema_version`을 `2`로 올리고 `validate-weekly-digest.mjs:80`의 단언을 함께 수정
- `notice.js`의 `FALLBACK_DIGEST`도 동일하게 갱신 (두 값은 문자 단위로 일치해야 함)
- 렌더링 문구는 "확인 중" 또는 "아직 정해지지 않음" 성격이 드러나게 한다. 확정 정보와 시각적으로 구분할 것

**개인정보 주의**

`AGENTS.md`의 "주간 공개 데이터" 규칙이 그대로 적용된다. 원본 `open_questions`를 **복사하지 말 것.** 실명·닉네임·구역번호+이름·개인별 평가를 제거한 공개용 문장으로 다시 쓴다. `validate-weekly-digest.mjs:119~129`의 민감정보 패턴 검사가 1차 방어선이지만, 통과했다고 안전한 게 아니다.

**검증**

검증 명령 5종 통과 + `?v=` 갱신 + 375px 확인. `notice.js`가 `weekly-digest.public.json` 요청에 실패했을 때의 폴백 경로도 확인할 것(네트워크 탭에서 해당 요청을 차단하고 새로고침).

---

## 확인만 필요한 항목 (코드 변경 없음)

**8/22 서울역사박물관의 확정 근거**

원본 digest는 이 일정을 `미정`으로 분류하고 "집결시간과 세부 일정은 최종 확인 필요"를 남겼는데, 공개 페이지는 `확정 · 집결 14:50`이다.

`AGENTS.md`에 공개 페이지가 "운영진 확인사항"을 병합한다고 되어 있으므로 운영진이 별도로 확정한 값으로 보인다. 다만 **대화 기록에는 근거가 없는 값**이므로 출처를 한 번 확인해 두는 게 좋다. 확인되면 `AGENTS.md`의 "현재 반영된 일정" 절에 근거를 한 줄 남길 것 — 다음 갱신 때 같은 의문이 반복된다.
