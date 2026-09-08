---
name: digest
description: 주간 정리봇 갱신 — kakao-digest 파이프라인(내보내기 · 병합 · 요약)을 돌리고, 공개본으로 옮겨 검사한 뒤 PR 로 머지한다. 매주 한 번, 「정리봇 갱신」 요청에 쓴다.
---

주간 정리봇을 한 바퀴 돌린다. 절차의 정본은 `docs/OPERATIONS.md` 2번이다.

## 1. 원본 만들기 (이 PC 에서만 된다)

PowerShell 로 돌린다. 카카오톡이 떠 있고 **대상 방이 독립 창으로 열려 있어야** 한다.
방 이름은 저장소에 적지 않는다(두 저장소 다 공개다) — `kakao-digest\config.local.json` 의 `room` 에서 읽는다.

```
Set-Location C:\D\Project\kakao-digest; $room = (Get-Content .\config.local.json -Raw | ConvertFrom-Json).room; if (-not $room) { throw 'config.local.json 에 room 이 없다' }; & .\scripts\weekly_collect.ps1 -Room $room -NoOpen; "exit=$LASTEXITCODE"
```

- 종료 코드 11(「채팅방 창을 찾지 못함」)이면 **멈추고** 사용자에게 방을 독립 창으로 띄워 달라고 한다. 다른 것을 시도하지 않는다.
- 종료 코드 0 이면 `C:\D\Project\kakao-digest\output\` 에서 가장 새 `digest-*.json` 의 경로를 잡는다.
- 신규 메시지가 0건이라 요약을 건너뛰었으면 그대로 보고하고 끝낸다.

## 2. 공개본으로 옮기고 올리기 — `ops` 서브에이전트에게 맡긴다

Agent 도구로 `ops` 를 부르고 아래를 그대로 전달한다(경로는 1에서 잡은 것).

> 저장소 `C:\D\Project\exhibition-club-survey` 에서 `docs/OPERATIONS.md` 2번 절차를 돌린다.
> 1. `git fetch origin && git checkout -b content/digest-<끝날짜 YYYYMMDD> origin/main`
> 2. `npm run digest:public -- <digest.json 경로>` — 개인정보로 보이는 값 때문에 멈추면 그 출력을 보고하고 끝낸다.
> 3. `node scripts/validate-weekly-digest.mjs`
> 4. `npm run build && npm run screens:save && npm run check:quick`
> 5. 커밋 「정리봇 M월 D일 ~ M월 D일」 → 푸시 → `gh pr create --fill` → `gh pr checks --watch` → `gh pr merge --squash`
> 6. 보고: 기간 · 확인사항 제목들 · 결정 수 · 확인 중 수 · PR 번호.

## 3. 사용자에게 보고

에이전트 보고를 다섯 줄 안쪽으로 옮긴다. 문구가 어색한 확인사항이 있으면 그 줄만 인용하고 「고칠까요」 라고 묻는다 — 고치기로 하면 JSON 을 직접 고치고 검사기를 다시 돌려 같은 흐름으로 올린다.
카톡 공지문은 kakao-digest 가 클립보드에 넣어 두었다고 알려 준다. 톡방에 붙이는 것은 사람 일이다.
