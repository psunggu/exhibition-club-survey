---
name: digest
description: 주간 정리봇 갱신 — 사람이 ~/KakaoDigest/inbox 에 저장한 대화를 병합·요약(weekly_collect.sh)하고, 공개본으로 옮겨 검사한 뒤 PR 로 머지한다. 매주 한 번, 「정리봇 갱신」 요청에 쓴다.
---

주간 정리봇을 한 바퀴 돌린다. 절차의 정본은 `docs/OPERATIONS.md` 2번이다.

## 1. 원본 만들기 (이 맥에서만 된다 — 내보내기는 사람이 한다)

사람이 카톡 방 → ≡ → 채팅방 설정 → 대화 내용 관리 → 대화 내용 저장으로 `~/KakaoDigest/inbox` 에 저장하면 launchd(`kakao-weekly`)가 곧바로 병합·요약한다. 세션은 처리됐는지부터 본다.
방 이름은 저장소에 적지 않는다(두 저장소 다 공개다) — `weekly_collect.sh` 가 `config.local.json` 의 `room` 을 스스로 읽는다. 세션은 그 값 · inbox 파일 이름 · `last_run.json` 의 `room` · `message` 를 읽거나 출력하지 않는다.

```bash
K="$HOME/D/Project/kakao-digest"; jq -r '"병합·요약 \(.startedAt[:16]) \(.result)/\(.exitCode) 새 \(.steps.collect.new // "-")건 공지 \(if .steps.summary.noticeFile then "생성" else "없음" end)"' "$K/last_run.json"; echo "가장 새 요약 $(ls "$K/output" | grep -E '^digest-[0-9]{8}-[0-9]{8}\.json$' | sort -t- -k3 | tail -1) · inbox 대기 $(find ~/KakaoDigest/inbox -maxdepth 1 -type f \( -name '*.csv' -o -name '*.txt' \) | wc -l | tr -d ' ')개"
```

- 가장 새 요약의 끝 날짜가 공개본(`period_label`)보다 뒤면 2로.
- 병합·요약이 `error`(1)면 **먼저 멈춘다** — 오류 때는 inbox 파일을 일부러 남겨 둔다. `tail -20 ~/Library/Logs/com.psunggu.kakao-weekly.log` 를 보고한다(`kakao-digest/logs/` 는 옛 줄에 방 이름이 있어 읽지 않는다. launchd 로그도 드물게 inbox 경로에 방 이름이 찍힌다 — 그 줄은 옮기지 않는다). kickstart 는 원인을 고친 뒤에만.
- `error` 가 아닌데 inbox 대기가 있으면 launchd 가 아직 안 돈 것이다 — `launchctl kickstart gui/$(id -u)/com.psunggu.kakao-weekly` 뒤, `launchctl print gui/$(id -u)/com.psunggu.kakao-weekly | grep 'state ='` 가 `not running` 이고 위 줄의 병합 시각이 kickstart 뒤로 바뀌었으면 끝난 것이다(kickstart 는 비동기이고 `last exit code` 는 도는 동안 옛 값이다). 세션에서 `weekly_collect.sh` 를 직접 부르지 않는다 — 샌드박스가 API 키·네트워크를 막는다.
- 방금 돈 병합이 `ok` 인데 공지 없음이면 「새 메시지 N건 — 요약 건너뜀」 으로 보고하고 끝낸다.
- `no-new`(종료 2)는 저장 파일이 오래됐다는 뜻이다(맥 CSV 는 저장한 지 36시간) — 카톡에서 다시 저장해 달라고 한다. 방이 조용했으면 종료 0 에 새 0건이고, 8일 넘게 조용하면 `stale`(3)이다 — 그대로 보고한다. 병합이 7일 넘었으면 **멈추고** 저장을 부탁한다. 다른 것을 시도하지 않는다.

## 2. 공개본으로 옮기고 올리기 — 배치와 같은 스크립트

매일 06:30 launchd(`exhibition-digest`)가 도는 스크립트를 그대로 쓴다 — 상태 파일(`logs/digest-public-last.json`)을 같이 써야 손으로 올린 기간을 배치가 다시 열지 않는다. 배치가 이미 연 PR(`gh pr list --state open | grep content/digest-`)이 있으면 돌리지 않고 그 PR 을 머지로 넘긴다.

```bash
cd "$HOME/D/Project/exhibition-club-survey" && bash scripts/digest-public-task.sh 2>&1 | tail -20
```

- 작업 트리가 깨끗해야 한다. main 을 받아 `content/digest-<끝날짜>` 에서 변환 · 검사(`check:quick` 까지) · 커밋 · PR 을 하고 main 으로 돌아온다.
- 출력에 「새 요약 없음」 · 「이미 main 에 있음」 · 「바뀐 것 없음」 이 있으면 올릴 것이 없다 — 그대로 보고하고 끝낸다. 다만 「새 요약 없음」 인데 `jq -r .result logs/digest-public-last.json` 이 `stopped` 면 지난 배치가 개인정보 검사로 멈춘 것이다 — 사람에게 넘긴다. `pr-opened` 인데 그 PR 이 머지 없이 닫혔고 main 에 그 기간이 없으면 `--force`.
- `digest:public` 이 개인정보로 보이는 값 때문에 멈추면 그 출력을 보고하고 끝낸다. 다른 실패도 마지막 20줄을 보고하고 멈춘다.
- `--force` 는 이미 처리한 요약을 다시 올릴 때만 — 공개본 손질이 되돌아간다. 원격에 옛 `content/digest-<끝날짜>` 브랜치가 남아 있으면 먼저 `git push origin --delete` 로 지운다.
- 스크립트는 **머지하지 않는다.** `/digest` 를 부른 것이 머지 승인이다 — 문구 손질은 머지 뒤 3절에서 새 PR 로. 세션이 `gh pr checks <번호> --watch` → `gh pr merge <번호> --squash` → `gh pr view <번호> --json state` 로 머지를 확인한다.

## 3. 사용자에게 보고

PR 의 공개본(`app/public/weekly-digest.public.json`)에서 기간 · 확인사항 제목들 · 결정 수 · 확인 중 수를 읽어 PR 번호와 함께 다섯 줄 안쪽으로 적는다. 문구가 어색한 확인사항이 있으면 그 줄만 인용하고 「고칠까요」 라고 묻는다 — 고치기로 하면 새 브랜치에서 JSON 을 직접 고치고 `node scripts/validate-weekly-digest.mjs` 뒤 PR 로 올린다(스크립트를 `--force` 로 다시 돌리지 않는다).

## 4. 톡방에 올릴 주간 소식 한 통

머지가 끝나면 `npm run notice` 를 돌린다. 정리봇 + 다가오는 모임 + 열린 설문 + 보드 순위를 한 통으로 조립해 `logs/weekly-notice-YYYYMMDD.txt` 에 쓰고 클립보드에 넣는다. 그 글을 그대로 보여 주고 「톡방에 붙여 넣기 전에 한 번 읽어 달라」 고 한다. **톡방에 올리는 것은 사람 일이다** — 자동 게시 기능을 만들지 않는다.
