<#
.SYNOPSIS
  recheck-task.ps1 을 Windows 작업 스케줄러에 주 1회(월 06:00) 작업으로 등록한다.

.DESCRIPTION
  docs/AUTOMATION_PLAN.md 단계 4. PC 가 자고 있으면 StartWhenAvailable 로 깨어날 때 돈다.
  AI 는 달라진 페이지가 있을 때만 부르므로 대부분의 주는 토큰 0 이다.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-recheck-task.ps1
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-recheck-task.ps1 -Replace
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-recheck-task.ps1 -Remove
#>
param(
  [string]$TaskName = "ExhibitionClub-Recheck",
  [string]$Day = "Monday",
  [string]$At = "06:00",
  [switch]$Replace,
  [switch]$Remove
)

$ErrorActionPreference = "Stop"

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Output "Scheduled task removed: $TaskName"
  exit 0
}

$runner = Join-Path $PSScriptRoot "recheck-task.ps1"
if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) { throw "Runner script not found: $runner" }

$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask -and -not $Replace) { throw "Scheduled task already exists. Use -Replace only after reviewing it." }

$powershell = (Get-Command powershell.exe -ErrorAction Stop).Source
$action = New-ScheduledTaskAction `
  -Execute $powershell `
  -Argument ('-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $runner) `
  -WorkingDirectory (Split-Path $PSScriptRoot -Parent)

$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Day -At $At
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Recheck exhibitions/meetups against official pages weekly; call AI only when something changed" `
  -Force:$Replace | Out-Null

Write-Output "Scheduled task installed: $TaskName"
Write-Output "Runs: $Day at $At (StartWhenAvailable)"
Write-Output "Log: $(Split-Path $PSScriptRoot -Parent)\logs\recheck-task-YYYYMM.log"
