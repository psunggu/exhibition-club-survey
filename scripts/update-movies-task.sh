#!/bin/bash
# 보드 영화 순위를 KOBIS 에서 받아 PR 로 올리고 머지한다 — 맥의 launchd 가 수·토 05:00 에 돌린다.
# 2026-10 부터 gh 시간 제한과 머지 실패 뒤 PR 상태 확인을 더했다.
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

# gh 호출의 시간 제한(with_timeout) — 정리봇 배치와 같이 쓴다. 왜 perl 로 fork 하는지는 그 파일에.
. "$REPO/scripts/batch-lib.sh" || fail 'scripts/batch-lib.sh 를 못 읽었다'

# PR 상태(OPEN · MERGED · CLOSED). 네트워크가 잠깐 끊긴 것이면 몇 번 더 묻고, 끝내 모르면 UNKNOWN.
# stdout 이 돌려주는 값이다 — 여기서 log 를 부르지 않는다(log 는 stdout 에도 찍어 값이 섞인다).
pr_state() {
  local i s
  for i in 1 2 3; do
    s="$(with_timeout 60 gh pr view "$PR" --json state -q .state 2>/dev/null)"
    case "$s" in OPEN|MERGED|CLOSED) echo "$s"; return 0 ;; esac
    [ "$i" -lt 3 ] && sleep "${PR_STATE_RETRY_SLEEP:-30}"
  done
  echo UNKNOWN
}

# ── 머지 — 호출이 실패로 끝나도 서버에서는 머지됐을 수 있다 ──────────────
# 2026-09-30 #206: 머지는 됐는데 응답만 끊겨(connection reset) 실패로 읽고 update-branch 를 했다가,
# 이미 머지된 뒤라 충돌로 멈추고 브랜치를 남겼다. 다음 동작을 고르기 전에 PR 상태를 직접 본다.
# 보호 규칙이 strict 라, 브랜치를 만든 뒤 main 이 움직였으면(정리봇·모임 머지 등) 「브랜치가 뒤처졌다」 로
# 머지가 거부된다 — 그때(상태 OPEN)만 브랜치를 main 에 맞추고 검사를 다시 기다린다.
merge_pr() {
  local state
  run with_timeout 300 gh pr merge "$PR" --squash && return 0
  state="$(pr_state)"; log "머지 호출이 실패로 끝났다 — PR 상태 $state"
  case "$state" in
    MERGED) log '서버에서는 이미 머지됐다 — 이어서 정리한다'; return 0 ;;
    OPEN) ;;
    CLOSED) fail "PR #$PR 이 닫혀 있다 — 누가 닫았는지 보고 손으로 정리한다" ;;
    *) fail "PR #$PR 상태를 읽지 못했다 — PR 을 보고 손으로 정리한다" ;;
  esac
  log '머지 거부 — 브랜치를 main 에 맞추고 한 번 더 시도한다'
  # 시간 초과로 끊긴 머지가 서버에서 늦게 끝나면 방금은 OPEN 이었어도 지금은 MERGED 라 update-branch 가
  # 충돌로 실패한다(9/30 과 같은 꼴). 실패하면 상태를 한 번 더 본다.
  if ! run with_timeout 120 gh pr update-branch "$PR"; then
    [ "$(pr_state)" = MERGED ] && { log '그 사이 서버에서 머지됐다 — 이어서 정리한다'; return 0; }
    fail 'gh pr update-branch'
  fi
  sleep "${MERGE_RETRY_SLEEP:-30}"
  run with_timeout 1800 gh pr checks "$PR" --watch -i 30 || fail 'gh pr checks (2)'
  run with_timeout 300 gh pr merge "$PR" --squash && return 0
  state="$(pr_state)"; log "두 번째 머지 호출도 실패로 끝났다 — PR 상태 $state"
  [ "$state" = MERGED ] && { log '서버에서는 이미 머지됐다 — 이어서 정리한다'; return 0; }
  fail 'gh pr merge (2)'
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
run with_timeout 120 gh pr create --fill --base main || fail 'gh pr create'
# 뒤의 호출이 모두 이 PR 을 번호로 가리키게 한다 — 브랜치로 찾으면 머지 뒤에 못 찾을 수 있다.
PR="$(with_timeout 60 gh pr view --json number -q .number 2>/dev/null)"
case "$PR" in ''|*[!0-9]*) fail 'PR 번호를 읽지 못했다' ;; esac
log "PR #$PR"
sleep 20
run with_timeout 1800 gh pr checks "$PR" --watch -i 30 || fail 'gh pr checks'

merge_pr

run git checkout -q main || fail 'checkout main'
run git pull -q --ff-only origin main || fail 'pull main'
run git branch -q -D "$BRANCH"
# 저장소가 머지 뒤 브랜치를 지운다(2026-10-04 deleteBranchOnMerge) — 남아 있을 때만 지운다. 없는 것을 지우면 「실패」 줄만 남는다.
if with_timeout 60 git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  run with_timeout 120 git push -q origin --delete "$BRANCH"
fi
log '완료 — 머지됐고 배포 워크플로가 이어서 돈다'
exit 0
