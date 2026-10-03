# 맥 launchd 배치가 같이 쓰는 함수. 실행하지 않고 `. "$REPO/scripts/batch-lib.sh"` 로 불러 쓴다.
# 쓰는 곳: update-movies-task.sh · digest-public-task.sh

# ── 네트워크 호출(gh · git)에는 시간 제한을 둔다 ─────────────────────────
# 2026-09-26 머지 호출이 응답 없이 2시간 45분 멈췄다(새벽 잠자기 중 네트워크). 맥에는 timeout 명령이
# 없어 기본으로 있는 perl 로 감싼다. **alarm 만 걸고 exec 하면 안 된다** — gh 는 Go 프로그램이라
# SIGALRM 을 스스로 잡아 무시한다(실측: 4초 제한이 39초 넘게 안 끊겼다). 그래서 perl 이 명령을 자식으로
# 띄워 기다리고, 시간이 되면 TERM(2초 안에 안 끝나면 KILL)을 보낸 뒤 142 로 끝낸다.
# 정상 종료면 자식의 종료 코드를 그대로, 시그널로 죽었으면 128+번호를 돌려준다.
with_timeout() {
  local secs="$1" rc; shift
  perl -MPOSIX=:sys_wait_h -e '
    my $s = shift @ARGV; my $p = fork; defined $p or exit 126;
    if (!$p) { exec @ARGV or exit 127 }
    $SIG{ALRM} = sub {
      kill "TERM", $p;
      for (1 .. 20) { exit 142 if waitpid($p, WNOHANG) == $p; select(undef, undef, undef, 0.1) }
      kill "KILL", $p; waitpid $p, 0; exit 142;
    };
    alarm $s; waitpid $p, 0; alarm 0;
    exit($? & 127 ? 128 + ($? & 127) : $? >> 8);
  ' "$secs" "$@"; rc=$?
  [ "$rc" -eq 142 ] && echo "시간 초과 — ${secs}초 안에 끝나지 않았다" >&2
  return "$rc"
}
