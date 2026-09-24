#!/bin/bash
# kakao-digest 의 새 요약을 공개본으로 옮겨 PR 까지 연다 — 세션 없이. 머지는 사람이 한다.
# digest-public-task.ps1(Windows 작업 스케줄러) 과 같은 절차다. 맥의 launchd 가 매일 06:30 에 돌린다.
#
#   1. <DIGEST_DIR> 에서 가장 새 digest-*.json 을 잡는다. logs/digest-public-last.json 에 적힌
#      마지막 처리 파일과 같으면 끝(--force 면 다시 한다).
#   2. git fetch → origin/main 공개본이 같은 기간이면 상태만 적고 끝 → 깨끗한지 → main → 브랜치 content/digest-<끝날짜>
#   3. npm run digest:public -- <json>   실명·전화·이메일로 보이는 것이 남으면 이 스크립트가
#                                        종료 1 로 멈춘다 → 여기서도 멈추고 사람에게 알린다.
#   4. node scripts/validate-weekly-digest.mjs
#   5. npm run build && npm run screens:save && npm run check:quick
#   6. 바뀐 것이 없으면 끝. 있으면 커밋 「정리봇 M월 D일 ~ M월 D일」 → 푸시 → gh pr create
#      **머지는 하지 않는다** — 공개 페이지에 나가는 글이라 사람이 PR 을 보고 머지한다.
#   7. 맥 알림으로 PR 주소를 알린다. 실패하면 체크아웃을 main 으로 되돌린다.
#
# 원본 digest-*.json 은 이 저장소에 넣지 않는다(공개본만 커밋한다).
#
# 로그:   logs/digest-public-task-YYYYMM.log
# 상태:   logs/digest-public-last.json
# 옵션:
#   --digest-dir <폴더>  kakao-digest 산출물 폴더. 기본은 <저장소>/../kakao-digest/output.
#   --force  마지막 처리 파일과 같아도, main 에 같은 기간이 있어도 다시 한다. **시험용이거나, 머지 없이 닫힌 PR 의 기간을 다시 올릴 때만.** 공개본을 손으로 고친 뒤(문구 다듬기 ·
#            낡은 확인 중 줄 삭제) 같은 원본을 다시 변환하면 그 손질이 되돌아간다 — 2026-09-14 시험에서
#            실제로 그런 PR 이 열렸고 닫았다. 운영에서는 새 원본이 있을 때만 돌리므로 이 문제가 없다.
#   --no-pr  푸시·PR 없이 변환·검사까지만 하고 되돌린다. 시험용.
# 설치:   scripts/install-launchd.sh digest
set -o pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DIGEST_DIR=""
FORCE=0
NO_PR=0
while [ $# -gt 0 ]; do
  case "$1" in
    --digest-dir) DIGEST_DIR="$2"; shift 2 ;;
    --force) FORCE=1; shift ;;
    --no-pr) NO_PR=1; shift ;;
    *) echo "모르는 옵션: $1" >&2; exit 2 ;;
  esac
done
[ -z "$DIGEST_DIR" ] && DIGEST_DIR="$(dirname "$REPO")/kakao-digest/output"

LOG_DIR="$REPO/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/digest-public-task-$(date +%Y%m).log"
STATE_PATH="$LOG_DIR/digest-public-last.json"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" | tee -a "$LOG"; }
run() {
  log "> $*"
  "$@" 2>&1 | while IFS= read -r l; do log "  $l"; done
  local rc=${PIPESTATUS[0]}
  if [ "$rc" -ne 0 ]; then log "실패: 종료 코드 $rc — $*"; return "$rc"; fi
}
# 맥 알림. 글은 argv 로 넘긴다 — 따옴표가 섞여도 AppleScript 가 깨지지 않는다.
notify() {
  osascript -e 'on run argv' -e 'display notification (item 2 of argv) with title (item 1 of argv)' -e 'end run' "$1" "$2" \
    >/dev/null 2>&1 || log '알림 표시 실패(무시)'
}
save_state() {
  node -e '
    const [p, file, result, pr] = process.argv.slice(1);
    const pad = (n) => String(n).padStart(2, "0");
    const d = new Date();
    const ranAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    require("fs").writeFileSync(p, JSON.stringify({ ranAt, file, result, pr }, null, 2));
  ' "$STATE_PATH" "$1" "$2" "$3"
}

BRANCH=""
fail() {
  log "실패: $1"
  local here
  here="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
  if [ -n "$BRANCH" ] && [ "$here" = "$BRANCH" ]; then
    git checkout -q -- . 2>&1 | while IFS= read -r l; do log "  $l"; done
    git checkout -q main 2>&1 | while IFS= read -r l; do log "  $l"; done
    if [ -n "$(git ls-remote --heads origin "$BRANCH" 2>/dev/null)" ]; then
      log "브랜치 $BRANCH 는 원격에 있어 남겨 두었다"
    else
      git branch -q -D "$BRANCH" 2>&1 | while IFS= read -r l; do log "  $l"; done
      log "브랜치 $BRANCH 를 지우고 main 으로 돌아왔다"
    fi
  fi
  notify '정리봇 공개본 배치 실패' "$1 — 로그: $LOG"
  exit 1
}

cd "$REPO" || exit 1
log '=== 정리봇 공개본 배치 시작 ==='
[ -d "$DIGEST_DIR" ] || fail "요약 폴더가 없다: $DIGEST_DIR"
NEWEST="$(ls -1 "$DIGEST_DIR" 2>/dev/null | grep -E '^digest-.*\.json$' | sort -r | head -1)"
[ -n "$NEWEST" ] || fail "요약 파일이 없다: $DIGEST_DIR/digest-*.json"

LAST=""
if [ -f "$STATE_PATH" ]; then
  LAST="$(node -e 'try { process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).file || "") } catch {}' "$STATE_PATH")"
fi
if [ "$FORCE" -eq 0 ] && [ "$LAST" = "$NEWEST" ]; then
  log "새 요약 없음 — 마지막 처리 $LAST"
  exit 0
fi
log "새 요약: $NEWEST (마지막 처리: ${LAST:-없음})"

# 끝날짜: digest-YYYYMMDD-YYYYMMDD.json 의 두 번째 날짜
END_DATE="$(printf '%s' "$NEWEST" | sed -nE 's/^digest-[0-9]{8}-([0-9]{8})\.json$/\1/p')"
[ -z "$END_DATE" ] && END_DATE="$(date +%Y%m%d)"
BRANCH_NAME="content/digest-$END_DATE"

run git fetch -q --prune origin || fail 'git fetch'
# 같은 기간의 공개본이 이미 main 에 있으면 PR 을 열지 않는다 — 손으로 다듬어 머지한 문구가 되돌아간다(#183).
# 원본 period_start·period_end 를 digest-to-public.mjs 의 kDate 꼴로 만들어 origin/main 공개본의 period_label 과 견준다.
# 어느 쪽이든 못 읽으면(빈 값) 예전처럼 진행한다.
if [ "$FORCE" -eq 0 ]; then
  NEW_PERIOD="$(node -e 'try { const r = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); const k = (s) => { const [, m, d] = String(s).split("-").map(Number); return `${m}월 ${d}일`; }; if (r.period_start && r.period_end) process.stdout.write(`${k(r.period_start)} ~ ${k(r.period_end)}`); } catch {}' "$DIGEST_DIR/$NEWEST")"
  MAIN_PERIOD="$(git show origin/main:app/public/weekly-digest.public.json 2>/dev/null | node -e 'let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => { try { process.stdout.write(JSON.parse(s).period_label || "") } catch {} })')"
  if [ -n "$NEW_PERIOD" ] && [ "$NEW_PERIOD" = "$MAIN_PERIOD" ]; then
    log "이미 main 에 있음 — $NEWEST ($NEW_PERIOD) 공개본이 origin/main 에 있다. PR 을 열지 않는다"
    save_state "$NEWEST" already-on-main ''
    exit 0
  fi
fi
[ -n "$(git status --porcelain)" ] && fail '작업 트리에 커밋 안 된 변경이 있다 — 손으로 정리한 뒤 다시 돌린다'
run git checkout -q main || fail 'checkout main'
run git pull -q --ff-only origin main || fail 'pull main'
if [ -n "$(git branch --list "$BRANCH_NAME")" ]; then run git branch -q -D "$BRANCH_NAME" || fail 'branch -D'; fi
run git checkout -q -b "$BRANCH_NAME" || fail 'checkout branch'
BRANCH="$BRANCH_NAME"

# 변환 — 실명으로 보이는 값이 남으면 이 명령이 종료 1 로 멈춘다.
if ! run npm run digest:public -- "$DIGEST_DIR/$NEWEST"; then
  notify '정리봇 공개본 — 사람이 볼 것' "변환이 멈췄다. 실명·연락처로 보이는 값이 남았을 수 있다. 로그: $LOG"
  save_state "$NEWEST" stopped ''
  fail 'digest:public 실패 — 공개본을 쓰지 않았다'
fi
run node scripts/validate-weekly-digest.mjs || fail 'validate-weekly-digest'

# 바뀌었는지는 **공개본 JSON 으로만** 판정한다. screens:save 는 같은 내용이어도 기준 파일을
# 다시 쓰므로(실측 11줄) git status 전체로 보면 늘 「바뀜」 이 되어 매일 빈 PR 이 열린다.
if [ -z "$(git status --porcelain -- app/public/weekly-digest.public.json)" ]; then
  log '바뀐 것 없음 — 공개본이 이미 같은 내용이다'
  run git checkout -q -- .
  run git checkout -q main
  run git branch -q -D "$BRANCH"
  save_state "$NEWEST" no-change ''
  exit 0
fi
run npm run build || fail 'npm run build'
run npm run screens:save || fail 'npm run screens:save'
run npm run check:quick || fail 'npm run check:quick'
if [ "$NO_PR" -eq 1 ]; then
  log '--no-pr — 변환·검사까지 확인했다. 되돌린다.'
  run git checkout -q -- .
  run git checkout -q main
  run git branch -q -D "$BRANCH"
  exit 0
fi

PERIOD="$(node -e 'try { process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).period_label || "") } catch {}' app/public/weekly-digest.public.json)"
[ -z "$PERIOD" ] && PERIOD="$END_DATE"
MSG_FILE="${TMPDIR:-/tmp}/exhibition-club-digest-commit.txt"
printf '정리봇 %s (자동)\n' "$PERIOD" > "$MSG_FILE"
run git add -A || fail 'git add'
run git -c user.name=psunggu -c user.email=psunggu@users.noreply.github.com commit -q -F "$MSG_FILE" || fail 'git commit'
run git push -q -u origin "$BRANCH" || fail 'git push'
PR_OUT="$(gh pr create --fill --base main 2>&1)"
PR_RC=$?
while IFS= read -r l; do log "  $l"; done <<< "$PR_OUT"
[ "$PR_RC" -ne 0 ] && fail 'gh pr create'
PR_URL="$(printf '%s\n' "$PR_OUT" | grep -E '^https://' | tail -1)"
run git checkout -q main || fail 'checkout main'
save_state "$NEWEST" pr-opened "$PR_URL"
log "완료 — PR 을 열었다. 머지는 사람이 한다: $PR_URL"
notify '정리봇 공개본 PR 열림' "$PERIOD — 확인하고 머지해 주세요: $PR_URL"
exit 0
