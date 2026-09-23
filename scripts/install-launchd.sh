#!/bin/bash
# 이 저장소의 배치를 맥 launchd(LaunchAgent)에 등록한다 — Windows 의 install-*-task.ps1 자리.
# plist 는 커밋하지 않는다. 이 스크립트가 경로를 채워 ~/Library/LaunchAgents 에 쓰고 bootstrap 한다.
# 잠자기 중이던 시각은 깨어난 뒤 한 번 돈다(Windows 의 StartWhenAvailable 과 같은 효과). cron 은 놓친 실행을 건너뛰어 쓰지 않는다.
#
#   scripts/install-launchd.sh <작업> [--uninstall]
#
#   supabase-backup  매일 02:30  events 표 백업(저장소 밖 ~/Library/Application Support/ExhibitionClub/backups)
#   movies           수·토 05:00 영화 순위 → PR → 머지   (scripts/update-movies-task.sh)
#   recheck          월 06:00    공식 출처 재확인          (scripts/recheck-task.sh)
#   digest           매일 06:30  정리봇 공개본 → PR       (scripts/digest-public-task.sh)
#
# launchd 로그: ~/Library/Logs/com.psunggu.exhibition-<작업>.log (래퍼 로그는 logs/*-YYYYMM.log)
# 바로 한 번 돌리기: launchctl kickstart gui/$(id -u)/com.psunggu.exhibition-<작업>
set -euo pipefail

JOB="${1:-}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.psunggu.exhibition-$JOB"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/$LABEL.log"
DOMAIN="gui/$(id -u)"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

at() { printf '<dict><key>Hour</key><integer>%d</integer><key>Minute</key><integer>%d</integer></dict>' "$1" "$2"; }
weekly() { printf '<dict><key>Weekday</key><integer>%d</integer><key>Hour</key><integer>%d</integer><key>Minute</key><integer>%d</integer></dict>' "$1" "$2" "$3"; }

case "$JOB" in
  supabase-backup)
    ARGS=("$(command -v node)" "$REPO/scripts/backup-supabase-events.mjs"
      --config-url "https://psunggu.github.io/exhibition-club-survey/config.js"
      --output-dir "$HOME/Library/Application Support/ExhibitionClub/backups")
    WORKDIR="$REPO/scripts"
    WHEN="$(at 2 30)" ;;
  movies)
    ARGS=(/bin/bash "$REPO/scripts/update-movies-task.sh")
    WORKDIR="$REPO"
    WHEN="$(weekly 3 5 0)$(weekly 6 5 0)" ;;
  recheck)
    ARGS=(/bin/bash "$REPO/scripts/recheck-task.sh")
    WORKDIR="$REPO"
    WHEN="$(weekly 1 6 0)" ;;
  digest)
    ARGS=(/bin/bash "$REPO/scripts/digest-public-task.sh")
    WORKDIR="$REPO"
    WHEN="$(at 6 30)" ;;
  *)
    echo "사용법: $0 <supabase-backup|movies|recheck|digest> [--uninstall]" >&2
    exit 2 ;;
esac

launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
if [[ "${2:-}" == "--uninstall" ]]; then
  rm -f "$PLIST"
  echo "제거: $LABEL"
  exit 0
fi

xml() { local s="${1//&/&amp;}"; s="${s//</&lt;}"; printf '%s' "${s//>/&gt;}"; }
PROGRAM=""
for a in "${ARGS[@]}"; do PROGRAM+="    <string>$(xml "$a")</string>"$'\n'; done

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
$PROGRAM  </array>
  <key>WorkingDirectory</key><string>$(xml "$WORKDIR")</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$HOME/.local/bin</string>
    <key>LANG</key><string>ko_KR.UTF-8</string>
  </dict>
  <key>StartCalendarInterval</key>
  <array>$WHEN</array>
  <key>StandardOutPath</key><string>$(xml "$LOG")</string>
  <key>StandardErrorPath</key><string>$(xml "$LOG")</string>
</dict>
</plist>
PLIST
plutil -lint "$PLIST" >/dev/null
launchctl bootstrap "$DOMAIN" "$PLIST"
echo "등록: $LABEL → $PLIST"
echo "launchd 로그: $LOG"
echo "바로 한 번: launchctl kickstart $DOMAIN/$LABEL"
