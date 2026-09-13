<#
.SYNOPSIS
  digest-public-task.ps1 을 Windows 작업 스케줄러에 매일 06:30 작업으로 등록한다.

.DESCRIPTION
  docs/AUTOMATION_PLAN.md 단계 2. 새 요약이 없는 날은 로그 한 줄로 끝난다(토큰 0, 알림 없음).
  새 요약이 있으면 공개본 PR 을 열고 풍선으로 알린다 — 머지는 사람이 한다.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-digest-task.ps1
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-digest-task.ps1 -Replace
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-digest-task.ps1 -Remove
#>
param(
  [string]$TaskName = "ExhibitionClub-Digest",
  [string]$At = "06:30",
  [switch]$Replace,
  [switch]$Remove
)

$ErrorActionPreference = "Stop"

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Output "Scheduled task removed: $TaskName"
  exit 0
}

$runner = Join-Path $PSScriptRoot "digest-public-task.ps1"
if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) { throw "Runner script not found: $runner" }

$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask -and -not $Replace) { throw "Scheduled task already exists. Use -Replace only after reviewing it." }

$powershell = (Get-Command powershell.exe -ErrorAction Stop).Source
$action = New-ScheduledTaskAction `
  -Execute $powershell `
  -Argument ('-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $runner) `
  -WorkingDirectory (Split-Path $PSScriptRoot -Parent)

$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 20)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Convert the newest kakao-digest summary to the public digest and open a PR (daily; merge is manual)" `
  -Force:$Replace | Out-Null

Write-Output "Scheduled task installed: $TaskName"
Write-Output "Runs: daily at $At (StartWhenAvailable)"
Write-Output "Log: $(Split-Path $PSScriptRoot -Parent)\logs\digest-public-task-YYYYMM.log"
