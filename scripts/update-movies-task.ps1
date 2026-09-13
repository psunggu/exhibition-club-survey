<#
.SYNOPSIS
  보드 영화 순위를 KOBIS 에서 받아 PR 로 올리고 머지한다 — 이 PC 의 작업 스케줄러가 수·토 05:00 에 돌린다.

.DESCRIPTION
  GitHub 호스트 러너에서는 KOBIS 접속이 막혀(연결 시간 초과) 크론 워크플로를 쓸 수 없었다.
  그래서 이 PC 에서 돈다. 사람이 손으로 하던 것과 같은 절차다 (docs/OPERATIONS.md 3):
    git pull → 브랜치 → npm run board:movies → npm run check:quick → 커밋 → PR → CI 대기 → 머지

  main 은 ruleset 으로 보호돼 있고 이 스크립트는 사용자 계정의 gh 로 PR 을 열어 머지한다.
  우회 권한을 만들지 않는다. 검사가 하나라도 실패하면 PR 을 열지 않고 멈춘다.

  로그: <저장소>\logs\update-movies-YYYYMM.log  (*.log 는 gitignore)

.PARAMETER Repo
  저장소 경로. 기본은 이 파일의 상위 폴더.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\update-movies-task.ps1
#>
param(
  [string]$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

# 네이티브 명령의 stderr 를 오류로 승격시키지 않는다 — git 은 진행 상황을 stderr 로 쓴다.
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$logDir = Join-Path $Repo 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir ('update-movies-' + (Get-Date -Format 'yyyyMM') + '.log')

function Log([string]$m) {
  $line = '{0} {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m
  Add-Content -Path $log -Value $line -Encoding utf8
  Write-Output $line
}

# cmd /c 로 돌려 stdout·stderr 를 한 줄씩 로그에 남기고, 종료 코드만 본다.
function Run([string]$line) {
  Log "> $line"
  & cmd /c "$line 2>&1" | ForEach-Object { Log "  $_" }
  if ($LASTEXITCODE -ne 0) { throw "종료 코드 $LASTEXITCODE — $line" }
}

Set-Location $Repo
$branch = 'content/movies-' + (Get-Date -Format 'yyyyMMdd-HHmm')

try {
  Log '=== 영화 순위 갱신 시작 ==='
  Run 'git fetch -q --prune origin'

  $dirty = git status --porcelain
  if ($dirty) { throw '작업 트리에 커밋 안 된 변경이 있다 — 손으로 정리한 뒤 다시 돌린다' }

  Run 'git checkout -q main'
  Run 'git pull -q --ff-only origin main'
  Run "git checkout -q -b $branch"

  Run 'npm run board:movies'
  Run 'npm run check:quick'

  $changed = git status --porcelain
  if (-not $changed) {
    Log '바뀐 것 없음 — 끝'
    Run 'git checkout -q main'
    Run "git branch -q -D $branch"
    exit 0
  }

  # 커밋 메시지는 UTF-8 파일로 넘긴다 — cmd /c 를 거치면 한글이 깨진다.
  # 저장소 밖(temp)에 둔다. 저장소 안에 두면 git add -A 가 같이 집어 간다 — 실제로 한 번 그랬다.
  $stamp = Get-Date -Format 'M월 d일'
  $msgFile = Join-Path ([System.IO.Path]::GetTempPath()) 'exhibition-club-movies-commit.txt'
  [System.IO.File]::WriteAllText($msgFile, "보드 영화 순위를 $stamp 기준으로 갱신한다 (자동)`n", (New-Object System.Text.UTF8Encoding $false))
  Run 'git add -A'
  Run "git -c user.name=psunggu -c user.email=psunggu@users.noreply.github.com commit -q -F `"$msgFile`""
  Run "git push -q -u origin $branch"
  Run 'gh pr create --fill --base main'
  Start-Sleep -Seconds 20
  Run 'gh pr checks --watch -i 30'

  # 보호 규칙이 strict 라, 브랜치를 만든 뒤 main 이 움직였으면(정리봇·모임 머지 등)
  # 「브랜치가 뒤처졌다」 로 머지가 거부된다. 그때는 브랜치를 main 에 맞추고 검사를 다시 기다린다.
  & cmd /c 'gh pr merge --squash 2>&1' | ForEach-Object { Log "  $_" }
  if ($LASTEXITCODE -ne 0) {
    Log '머지 거부 — 브랜치를 main 에 맞추고 한 번 더 시도한다'
    Run 'gh pr update-branch'
    Start-Sleep -Seconds 30
    Run 'gh pr checks --watch -i 30'
    Run 'gh pr merge --squash'
  }

  Run 'git checkout -q main'
  Run 'git pull -q --ff-only origin main'
  Run "git branch -q -D $branch"
  Run "git push -q origin --delete $branch"
  Log '완료 — 머지됐고 배포 워크플로가 이어서 돈다'
  exit 0
}
catch {
  Log "실패: $_"
  # ── 체크아웃을 main 으로 되돌린다 ──────────────────────────────────────
  # 2026-09-12 실패 뒤 체크아웃이 content/movies-… 에 남아 있었다. 사람이 그 저장소에서
  # 다음 작업을 시작하면 엉뚱한 브랜치 위에서 하게 되고, 다음 배치는 「작업 트리가
  # 지저분하다」 로 서지 않아도 브랜치 위에서 돈다. 실패했어도 자리는 원래대로 둔다.
  # 커밋을 push 한 뒤(PR 이 열린 뒤)라면 브랜치는 남긴다 — PR 이 그 브랜치를 가리킨다.
  try {
    $here = (git rev-parse --abbrev-ref HEAD 2>$null)
    if ($here -eq $branch) {
      & git checkout -q main 2>&1 | ForEach-Object { Log "  $_" }
      $pushed = (git ls-remote --heads origin $branch 2>$null)
      if ($pushed) {
        Log "브랜치 $branch 는 원격에 있어(PR 열림) 남겨 두었다 — PR 을 보고 손으로 정리한다"
      } else {
        & git branch -q -D $branch 2>&1 | ForEach-Object { Log "  $_" }
        Log "브랜치 $branch 를 지우고 main 으로 돌아왔다 — 다음 배치가 그대로 다시 시도한다"
      }
    }
  } catch {
    Log "되돌리기 실패(무시): $_"
  }
  exit 1
}
