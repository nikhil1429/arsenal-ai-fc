# ============================================================================
# CLOAK_TASKS.ps1 - TAKE THE WINDOWS AWAY (11 Aug 2026, HIS ruling)
#
#   powershell -ExecutionPolicy Bypass -File setup\CLOAK_TASKS.ps1
#   powershell -ExecutionPolicy Bypass -File setup\CLOAK_TASKS.ps1 -WhatIf
#   powershell -ExecutionPolicy Bypass -File setup\CLOAK_TASKS.ps1 -Revert
#
# HIS WORDS, 11 Aug 2026: "my terminal keeps popping up and then closing a lot of
# times which is very distracting for me ... very distracting for my adhd brain."
#
# WHAT IT DOES: re-points every ArsenalFC-* task whose action launches a console
# host (cmd / cmd.exe / powershell) through setup\hidden_task.vbs - the cloak
# that runs with NO window and still exits with the ORGAN's own code, so
# Task Scheduler's `Last Result` (what /organism-doctor and watchman.mjs read to
# call an organ alive) keeps telling the truth. See hidden_task.vbs's header for
# why hidden_run.vbs - the DAEMON cloak - is the wrong tool for a scheduled row.
#
# WHAT IT DOES NOT TOUCH:
#   - the command itself: every argument is carried through byte-for-byte
#   - triggers, schedules, power/wake settings
#   - Enabled/Disabled state: read back off disk after every write, and if a
#     row's state moved, this says so loudly instead of hoping
#   - rows already cloaked (Execute = wscript.exe): skipped, so re-runs are safe
#
# REVERT: every original action is written to setup\CLOAK_receipt.json BEFORE
# the first write. -Revert replays that receipt exactly. Nothing here is a
# one-way door.
#
# THIS FILE MUST STAY ASCII. Written first with em-dashes, it would not parse at
# all: Windows PowerShell 5.1 reads a UTF-8-no-BOM script as ANSI, so every
# multi-byte character became mojibake mid-string and the parser died on line 95.
# Same law as run_logged.cmd's "MUST stay CRLF + ASCII" header.
# ============================================================================
param([switch]$Revert, [switch]$WhatIf)

$repo    = "C:\Users\nikhi\GitHub\arsenal-ai-fc"
$vbs     = "$repo\setup\hidden_task.vbs"
$receipt = "$repo\setup\CLOAK_receipt.json"

if (-not (Test-Path $vbs)) { Write-Host "! hidden_task.vbs missing at $vbs - nothing done."; exit 1 }

# ---------------------------------------------------------------------------
# REVERT - replay the receipt, exactly as it was recorded.
# ---------------------------------------------------------------------------
if ($Revert) {
  if (-not (Test-Path $receipt)) { Write-Host "! no receipt at $receipt - nothing to revert."; exit 1 }
  $rows = (Get-Content $receipt -Raw | ConvertFrom-Json).rows
  foreach ($r in $rows) {
    if ($WhatIf) { Write-Host ("  would restore {0} -> {1} {2}" -f $r.name, $r.execute, $r.arguments); continue }
    try {
      $act = New-ScheduledTaskAction -Execute $r.execute -Argument $r.arguments
      Set-ScheduledTask -TaskName $r.name -Action $act -ErrorAction Stop | Out-Null
      Write-Host "  ~ restored $($r.name)"
    } catch { Write-Host "  ! FAILED to restore $($r.name): $($_.Exception.Message)" }
  }
  Write-Host ""
  Write-Host "Reverted. The windows will come back on the next trigger."
  exit 0
}

# ---------------------------------------------------------------------------
# CLOAK
# ---------------------------------------------------------------------------
Write-Host "Cloaking the organism's scheduled rows (no more popping consoles)..."
$tasks = Get-ScheduledTask | Where-Object { $_.TaskName -like "ArsenalFC*" } | Sort-Object TaskName

$saved   = @()
$cloaked = 0
$skipped = 0
$failed  = 0

foreach ($t in $tasks) {
  $a = $t.Actions[0]
  if (-not $a -or -not $a.Execute) { $skipped++; continue }
  $exe = [System.IO.Path]::GetFileName($a.Execute).ToLower()

  if ($exe -eq "wscript.exe") {
    Write-Host ("  . {0,-32} already cloaked" -f $t.TaskName); $skipped++; continue
  }
  if (@("cmd.exe","cmd","powershell.exe","powershell") -notcontains $exe) {
    Write-Host ("  . {0,-32} not a console host ({1}) - left alone" -f $t.TaskName, $exe); $skipped++; continue
  }

  # Carry the command through byte-for-byte, only prefixed by the cloak.
  $newArgs = '"{0}" {1} {2}' -f $vbs, $a.Execute, $a.Arguments
  $saved += [pscustomobject]@{ name = $t.TaskName; execute = $a.Execute; arguments = $a.Arguments }

  if ($WhatIf) { Write-Host ("  would cloak {0}" -f $t.TaskName); $cloaked++; continue }

  $wasEnabled = ($t.State -ne "Disabled")
  try {
    $act = New-ScheduledTaskAction -Execute "wscript.exe" -Argument $newArgs
    Set-ScheduledTask -TaskName $t.TaskName -Action $act -ErrorAction Stop | Out-Null
  } catch { Write-Host ("  ! FAILED {0}: {1}" -f $t.TaskName, $_.Exception.Message); $failed++; continue }

  # READ BACK OFF DISK - the lesson INSTALL_TASKS.ps1's disable-loop paid for.
  $back = Get-ScheduledTask -TaskName $t.TaskName -ErrorAction SilentlyContinue
  $nowEnabled = ($back -and $back.State -ne "Disabled")
  $ok = $back -and ([System.IO.Path]::GetFileName($back.Actions[0].Execute).ToLower() -eq "wscript.exe")
  if (-not $ok) {
    Write-Host ("  ! {0} did NOT take the cloak - check it by hand" -f $t.TaskName); $failed++; continue
  }
  if ($wasEnabled -ne $nowEnabled) {
    Write-Host ("  ! {0} CLOAKED but its enabled-state moved ({1} -> {2}) - fix by hand" -f $t.TaskName, $wasEnabled, $nowEnabled)
  } else {
    Write-Host ("  + {0,-32} cloaked" -f $t.TaskName)
  }
  $cloaked++
}

if (-not $WhatIf -and $saved.Count -gt 0) {
  # Never overwrite an older receipt with a cloaked-state one: if a receipt already
  # exists, its rows are the ORIGINALS and must survive. Merge, originals win.
  $rows = $saved
  if (Test-Path $receipt) {
    try {
      $old = (Get-Content $receipt -Raw | ConvertFrom-Json).rows
      $names = @($old | ForEach-Object { $_.name })
      $rows = @($old) + @($saved | Where-Object { $names -notcontains $_.name })
      Write-Host "  ~ receipt merged with the existing one (older originals kept)"
    } catch { Write-Host "  ! existing receipt unreadable - writing a fresh one" }
  }
  [pscustomobject]@{
    note    = "Original scheduled-task actions before CLOAK_TASKS.ps1. Restore with: CLOAK_TASKS.ps1 -Revert"
    written = (Get-Date).ToString("s")
    rows    = $rows
  } | ConvertTo-Json -Depth 5 | Set-Content -Path $receipt -Encoding utf8
  Write-Host "  ~ receipt: $receipt"
}

Write-Host ""
Write-Host ("Done. cloaked {0} - skipped {1} - failed {2}" -f $cloaked, $skipped, $failed)
Write-Host "Verify:  schtasks /Query /FO TABLE | findstr ArsenalFC"
Write-Host "Undo:    powershell -ExecutionPolicy Bypass -File setup\CLOAK_TASKS.ps1 -Revert"
