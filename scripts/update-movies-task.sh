#!/bin/bash
# 보드 영화 순위를 KOBIS 에서 받아 PR 로 올리고 머지한다 — 맥의 launchd 가 수·토 05:00 에 돌린다.
# update-movies-task.ps1(Windows 작업 스케줄러) 과 같은 절차다. ps1 은 참고용으로 남겨 둔다.
#
# GitHub 호스트 러너에서는 KOBIS 접속이 막혀(연결 시간 초과) 크론 워크플로를 쓸 수 없었다.
# 그래서 이 컴퓨터에서 돈다. 사람이 손으로 하던 것과 같은 절차다 (docs/OPERATIONS.md 3):
#   git pull → 브랜치 → npm run board:movies → npm run check:quick → 커밋 → PR → CI 대기 → 머지
#
# main 은 ruleset 으로 보호돼 있고 이 스크립트는 사용자 계정의 gh 로 PR 을 열어 머지한다.
# 우회 권한을 만들지 않는다. 검사가 하나라도 실패하면 PR 을 열지 않고 멈춘다.
#
# 로그: <저장소>/logs/update-movies-YYYYMM.log  (*.log 는 gitignore)
# 설치: scripts/install-launchd.sh movies
set -o pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$REPO/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/update-movies-$(date +%Y%m).log"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" | tee -a "$LOG"; }

# 명령의 stdout·stderr 를 한 줄씩 로그에 남기고, 종료 코드만 본다.
run() {
  log "> $*"
  "$@" 2>&1 | while IFS= read -r l; do log "  $l"; done
  local rc=${PIPESTATUS[0]}
  if [ "$rc" -ne 0 ]; then log "실패: 종료 코드 $rc — $*"; return "$rc"; fi
}

cd "$REPO" || exit 1
BRANCH="content/movies-$(date +%Y%m%d-%H%M)"

# ── 실패하면 체크아웃을 main 으로 되돌린다 ─────────────────────────────
# 2026-09-12 실패 뒤 체크아웃이 content/movies-… 에 남아 있었다. 사람이 그 저장소에서
# 다음 작업을 시작하면 엉뚱한 브랜치 위에서 하게 되고, 다음 배치는 「작업 트리가
# 지저분하다」 로 서지 않아도 브랜치 위에서 돈다. 실패했어도 자리는 원래대로 둔다.
# 커밋을 push 한 뒤(PR 이 열린 뒤)라면 브랜치는 남긴다 — PR 이 그 브랜치를 가리킨다.
fail() {
  log "실패: $1"
  local here
  here="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
  if [ "$here" = "$BRANCH" ]; then
    git checkout -q main 2>&1 | while IFS= read -r l; do log "  $l"; done
    if [ -n "$(git ls-remote --heads origin "$BRANCH" 2>/dev/null)" ]; then
      log "브랜치 $BRANCH 는 원격에 있어(PR 열림) 남겨 두었다 — PR 을 보고 손으로 정리한다"
    else
      git branch -q -D "$BRANCH" 2>&1 | while IFS= read -r l; do log "  $l"; done
      log "브랜치 $BRANCH 를 지우고 main 으로 돌아왔다 — 다음 배치가 그대로 다시 시도한다"
    fi
  fi
  osascript -e 'on run argv' -e 'display notification (item 1 of argv) with title "영화 순위 갱신 실패"' -e 'end run' "$1" \
    >/dev/null 2>&1 || true
  exit 1
}

log '=== 영화 순위 갱신 시작 ==='
run git fetch -q --prune origin || fail 'git fetch'

if [ -n "$(git status --porcelain)" ]; then
  fail '작업 트리에 커밋 안 된 변경이 있다 — 손으로 정리한 뒤 다시 돌린다'
fi

run git checkout -q main || fail 'checkout main'
run git pull -q --ff-only origin main || fail 'pull main'
run git checkout -q -b "$BRANCH" || fail 'checkout branch'

run npm run board:movies || fail 'npm run board:movies'
run npm run check:quick || fail 'npm run check:quick'

if [ -z "$(git status --porcelain)" ]; then
  log '바뀐 것 없음 — 끝'
  run git checkout -q main
  run git branch -q -D "$BRANCH"
  exit 0
fi

# 커밋 메시지는 UTF-8 파일로 넘긴다.
# 저장소 밖(temp)에 둔다. 저장소 안에 두면 git add -A 가 같이 집어 간다 — 실제로 한 번 그랬다.
MSG_FILE="${TMPDIR:-/tmp}/exhibition-club-movies-commit.txt"
printf '보드 영화 순위를 %s 기준으로 갱신한다 (자동)\n' "$(date '+%-m월 %-d일')" > "$MSG_FILE"
run git add -A || fail 'git add'
run git -c user.name=psunggu -c user.email=psunggu@users.noreply.github.com commit -q -F "$MSG_FILE" || fail 'git commit'
run git push -q -u origin "$BRANCH" || fail 'git push'
run gh pr create --fill --base main || fail 'gh pr create'
sleep 20
run gh pr checks --watch -i 30 || fail 'gh pr checks'

# 보호 규칙이 strict 라, 브랜치를 만든 뒤 main 이 움직였으면(정리봇·모임 머지 등)
# 「브랜치가 뒤처졌다」 로 머지가 거부된다. 그때는 브랜치를 main 에 맞추고 검사를 다시 기다린다.
if ! run gh pr merge --squash; then
  log '머지 거부 — 브랜치를 main 에 맞추고 한 번 더 시도한다'
  run gh pr update-branch || fail 'gh pr update-branch'
  sleep 30
  run gh pr checks --watch -i 30 || fail 'gh pr checks (2)'
  run gh pr merge --squash || fail 'gh pr merge (2)'
fi

run git checkout -q main || fail 'checkout main'
run git pull -q --ff-only origin main || fail 'pull main'
run git branch -q -D "$BRANCH"
run git push -q origin --delete "$BRANCH"
log '완료 — 머지됐고 배포 워크플로가 이어서 돈다'
exit 0
