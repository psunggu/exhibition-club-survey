<#
.SYNOPSIS
  보드 영화 순위를 KOBIS 에서 받아 PR 로 올리고 머지한다 — 이 PC 의 작업 스케줄러가 수·토 22:00 에 돌린다.

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
  $stamp = Get-Date -Format 'M월 d일'
  $msgFile = Join-Path $logDir 'commit-message.txt'
  [System.IO.File]::WriteAllText($msgFile, "보드 영화 순위를 $stamp 기준으로 갱신한다 (자동)`n", (New-Object System.Text.UTF8Encoding $false))
  Run 'git add -A'
  Run "git -c user.name=psunggu -c user.email=psunggu@users.noreply.github.com commit -q -F `"$msgFile`""
  Run "git push -q -u origin $branch"
  Run 'gh pr create --fill --base main'
  Start-Sleep -Seconds 20
  Run 'gh pr checks --watch'
  Run 'gh pr merge --squash'

  Run 'git checkout -q main'
  Run 'git pull -q --ff-only origin main'
  Run "git branch -q -D $branch"
  Run "git push -q origin --delete $branch"
  Log '완료 — 머지됐고 배포 워크플로가 이어서 돈다'
  exit 0
}
catch {
  Log "실패: $_"
  Log "브랜치 $branch 는 남겨 두었다 — 로그를 보고 손으로 정리한다"
  exit 1
}
