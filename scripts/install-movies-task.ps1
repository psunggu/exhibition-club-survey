<#
.SYNOPSIS
  update-movies-task.ps1 을 Windows 작업 스케줄러에 수·토 22:00 작업으로 등록한다.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-movies-task.ps1
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-movies-task.ps1 -Replace
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-movies-task.ps1 -Remove
#>
param(
  [string]$TaskName = "ExhibitionClub-Movies",
  [string]$At = "22:00",
  [switch]$Replace,
  [switch]$Remove
)

$ErrorActionPreference = "Stop"

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Output "Scheduled task removed: $TaskName"
  exit 0
}

$runner = Join-Path $PSScriptRoot "update-movies-task.ps1"
if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) {
  throw "Runner script not found: $runner"
}

$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask -and -not $Replace) {
  throw "Scheduled task already exists. Use -Replace only after reviewing it."
}

$powershell = (Get-Command powershell.exe -ErrorAction Stop).Source
$action = New-ScheduledTaskAction `
  -Execute $powershell `
  -Argument ('-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $runner) `
  -WorkingDirectory (Split-Path $PSScriptRoot -Parent)

# KOBIS 실시간 예매율은 저녁 회차가 잡힌 뒤인 22시가 안정적이다 (docs/OPERATIONS.md 3).
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Wednesday, Saturday -At $At
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
  -Description "Refresh the board's KOBIS movie ranking and merge it via PR (Wed/Sat)" `
  -Force:$Replace | Out-Null

Write-Output "Scheduled task installed: $TaskName"
Write-Output "Runs: Wednesday and Saturday at $At"
Write-Output "Log: $(Split-Path $PSScriptRoot -Parent)\logs\update-movies-YYYYMM.log"
