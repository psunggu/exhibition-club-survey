<#
.SYNOPSIS
  kakao-digest 의 새 요약을 공개본으로 옮겨 PR 까지 연다 — 세션 없이. 머지는 사람이 한다.

.DESCRIPTION
  docs/AUTOMATION_PLAN.md 단계 2. 지금까지는 /digest 스킬(세션)이 이 절차를 돌렸다.
  변환 · 검사 · PR 은 전부 스크립트이므로 세션이 필요 없다. 이 배치는 매일 한 번 돌며
  「새 요약 파일이 있나」 만 보고, 없으면 조용히 끝난다.

    1. <DigestDir> 에서 가장 새 digest-*.json 을 잡는다. logs/digest-public-last.json 에 적힌
       마지막 처리 파일과 같으면 끝(-Force 면 다시 한다).
    2. git fetch → 깨끗한지 → main → 브랜치 content/digest-<끝날짜>
    3. npm run digest:public -- <json>   실명·전화·이메일로 보이는 것이 남으면 이 스크립트가
                                         종료 1 로 멈춘다 → 여기서도 멈추고 사람에게 알린다.
    4. node scripts/validate-weekly-digest.mjs
    5. npm run build && npm run screens:save && npm run check:quick
    6. 바뀐 것이 없으면 끝. 있으면 커밋 「정리봇 M월 D일 ~ M월 D일」 → 푸시 → gh pr create
       **머지는 하지 않는다** — 공개 페이지에 나가는 글이라 사람이 PR 을 보고 머지한다.
    7. 풍선으로 PR 주소를 알린다. 실패하면 체크아웃을 main 으로 되돌린다.

  원본 digest-*.json 은 이 저장소에 넣지 않는다(공개본만 커밋한다).

  로그:   logs/digest-public-task-YYYYMM.log
  상태:   logs/digest-public-last.json

.PARAMETER Repo
  이 저장소 경로. 기본은 이 파일의 상위 폴더.
.PARAMETER DigestDir
  kakao-digest 산출물 폴더. 기본은 <Repo>\..\kakao-digest\output.
.PARAMETER Force
  마지막 처리 파일과 같아도 다시 한다.
.PARAMETER NoPr
  푸시·PR 없이 변환·검사까지만 하고 되돌린다. 시험용.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\digest-public-task.ps1
#>
param(
  [string]$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$DigestDir = '',
  [switch]$Force,
  [switch]$NoPr
)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $DigestDir) { $DigestDir = Join-Path (Split-Path $Repo -Parent) 'kakao-digest\output' }
$logDir = Join-Path $Repo 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir ('digest-public-task-' + (Get-Date -Format 'yyyyMM') + '.log')
$statePath = Join-Path $logDir 'digest-public-last.json'

function Log([string]$m) {
  $line = '{0} {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m
  Add-Content -Path $log -Value $line -Encoding utf8
  Write-Output $line
}
function Run([string]$line) {
  Log "> $line"
  & cmd /c "$line 2>&1" | ForEach-Object { Log "  $_" }
  if ($LASTEXITCODE -ne 0) { throw "종료 코드 $LASTEXITCODE — $line" }
}
function Show-Balloon {
  param([string]$Title, [string]$Text, [ValidateSet('Info', 'Warning', 'Error')][string]$Level = 'Info')
  try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $ni = New-Object System.Windows.Forms.NotifyIcon
    switch ($Level) {
      'Error'   { $ni.Icon = [System.Drawing.SystemIcons]::Error }
      'Warning' { $ni.Icon = [System.Drawing.SystemIcons]::Warning }
      default   { $ni.Icon = [System.Drawing.SystemIcons]::Information }
    }
    $ni.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]$Level
    $ni.BalloonTipTitle = $Title
    $ni.BalloonTipText = $Text
    $ni.Visible = $true
    $ni.ShowBalloonTip(10000)
    Start-Sleep -Milliseconds 800
    $ni.Visible = $false
    $ni.Dispose()
  } catch { Log ("알림 표시 실패(무시): {0}" -f $_.Exception.Message) }
}
function Save-State([string]$file, [string]$result, [string]$pr) {
  $s = [ordered]@{ ranAt = (Get-Date).ToString('o'); file = $file; result = $result; pr = $pr }
  [System.IO.File]::WriteAllText($statePath, ($s | ConvertTo-Json -Depth 2), (New-Object System.Text.UTF8Encoding $false))
}

Set-Location $Repo
$branch = $null

try {
  Log '=== 정리봇 공개본 배치 시작 ==='
  if (-not (Test-Path -LiteralPath $DigestDir -PathType Container)) { throw "요약 폴더가 없다: $DigestDir" }
  $newest = Get-ChildItem -LiteralPath $DigestDir -Filter 'digest-*.json' | Sort-Object Name -Descending | Select-Object -First 1
  if (-not $newest) { throw "요약 파일이 없다: $DigestDir\digest-*.json" }

  $last = $null
  if (Test-Path -LiteralPath $statePath) {
    try { $last = (Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json).file } catch { $last = $null }
  }
  if (-not $Force -and $last -eq $newest.Name) {
    Log ("새 요약 없음 — 마지막 처리 {0}" -f $last)
    exit 0
  }
  Log ("새 요약: {0} (마지막 처리: {1})" -f $newest.Name, ($(if ($last) { $last } else { '없음' })))

  # 끝날짜: digest-YYYYMMDD-YYYYMMDD.json 의 두 번째 날짜
  $endDate = if ($newest.Name -match 'digest-\d{8}-(\d{8})\.json$') { $Matches[1] } else { Get-Date -Format 'yyyyMMdd' }
  $branch = "content/digest-$endDate"

  Run 'git fetch -q --prune origin'
  $dirty = git status --porcelain
  if ($dirty) { throw '작업 트리에 커밋 안 된 변경이 있다 — 손으로 정리한 뒤 다시 돌린다' }
  Run 'git checkout -q main'
  Run 'git pull -q --ff-only origin main'
  if (git branch --list $branch) { Run "git branch -q -D $branch" }
  Run "git checkout -q -b $branch"

  # 변환 — 실명으로 보이는 값이 남으면 이 명령이 종료 1 로 멈춘다.
  & cmd /c ('npm run digest:public -- "{0}" 2>&1' -f $newest.FullName) | ForEach-Object { Log "  $_" }
  if ($LASTEXITCODE -ne 0) {
    Show-Balloon -Title '정리봇 공개본 — 사람이 볼 것' -Text ("변환이 멈췄다(종료 {0}). 실명·연락처로 보이는 값이 남았을 수 있다. 로그: {1}" -f $LASTEXITCODE, $log) -Level Error
    Save-State $newest.Name 'stopped' ''
    throw ("digest:public 종료 코드 {0} — 공개본을 쓰지 않았다" -f $LASTEXITCODE)
  }
  Run 'node scripts/validate-weekly-digest.mjs'
  Run 'npm run build'
  Run 'npm run screens:save'
  Run 'npm run check:quick'

  $changed = git status --porcelain
  if (-not $changed) {
    Log '바뀐 것 없음 — 공개본이 이미 같은 내용이다'
    Run 'git checkout -q main'
    Run "git branch -q -D $branch"
    Save-State $newest.Name 'no-change' ''
    exit 0
  }
  if ($NoPr) {
    Log '-NoPr — 변환·검사까지 확인했다. 되돌린다.'
    Run 'git checkout -q -- .'
    Run 'git checkout -q main'
    Run "git branch -q -D $branch"
    exit 0
  }

  $period = try { (Get-Content -LiteralPath (Join-Path $Repo 'app/public/weekly-digest.public.json') -Raw -Encoding UTF8 | ConvertFrom-Json).period_label } catch { $endDate }
  $msgFile = Join-Path ([System.IO.Path]::GetTempPath()) 'exhibition-club-digest-commit.txt'
  [System.IO.File]::WriteAllText($msgFile, "정리봇 $period (자동)`n", (New-Object System.Text.UTF8Encoding $false))
  Run 'git add -A'
  Run "git -c user.name=psunggu -c user.email=psunggu@users.noreply.github.com commit -q -F `"$msgFile`""
  Run "git push -q -u origin $branch"
  $prUrl = (& cmd /c 'gh pr create --fill --base main 2>&1' | ForEach-Object { Log "  $_"; $_ } | Where-Object { $_ -match '^https://' } | Select-Object -Last 1)
  Run 'git checkout -q main'
  Save-State $newest.Name 'pr-opened' "$prUrl"
  Log ("완료 — PR 을 열었다. 머지는 사람이 한다: {0}" -f $prUrl)
  Show-Balloon -Title '정리봇 공개본 PR 열림' -Text ("{0}`n확인하고 머지해 주세요: {1}" -f $period, $prUrl) -Level Info
  exit 0
}
catch {
  Log "실패: $_"
  try {
    $here = (git rev-parse --abbrev-ref HEAD 2>$null)
    if ($branch -and $here -eq $branch) {
      & git checkout -q -- . 2>&1 | ForEach-Object { Log "  $_" }
      & git checkout -q main 2>&1 | ForEach-Object { Log "  $_" }
      if (git ls-remote --heads origin $branch 2>$null) {
        Log "브랜치 $branch 는 원격에 있어 남겨 두었다"
      } else {
        & git branch -q -D $branch 2>&1 | ForEach-Object { Log "  $_" }
        Log "브랜치 $branch 를 지우고 main 으로 돌아왔다"
      }
    }
  } catch { Log "되돌리기 실패(무시): $_" }
  Show-Balloon -Title '정리봇 공개본 배치 실패' -Text ("{0}`n로그: {1}" -f $_, $log) -Level Error
  exit 1
}
