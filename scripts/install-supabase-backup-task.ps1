param(
  [string]$TaskName = "ExhibitionClub-Supabase-Backup",
  [string]$DailyAt = "02:30",
  [string]$ConfigUrl = "https://psunggu.github.io/exhibition-club-survey/config.js",
  [string]$BackupDirectory = (Join-Path $env:LOCALAPPDATA "ExhibitionClub\backups"),
  [switch]$Replace
)

$ErrorActionPreference = "Stop"
$backupScript = Join-Path $PSScriptRoot "backup-supabase-events.mjs"
if (-not (Test-Path -LiteralPath $backupScript -PathType Leaf)) {
  throw "Backup script not found: $backupScript"
}

$nodePath = (Get-Command node -ErrorAction Stop).Source
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask -and -not $Replace) {
  throw "Scheduled task already exists. Use -Replace only after reviewing it."
}

$arguments = '"{0}" --config-url "{1}" --output-dir "{2}"' -f `
  $backupScript, $ConfigUrl, $BackupDirectory
$action = New-ScheduledTaskAction `
  -Execute $nodePath `
  -Argument $arguments `
  -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $DailyAt
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 15)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Back up the public Supabase events table outside Git" `
  -Force:$Replace | Out-Null

Write-Output "Scheduled task installed: $TaskName"
Write-Output "Daily time: $DailyAt"
Write-Output "Backup directory: $BackupDirectory"
