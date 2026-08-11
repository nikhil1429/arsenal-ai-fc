# ============================================================================
# INSTALL_EVENING_CONDUCTOR.ps1 - retire the evening burst, hand it to one chain
# ----------------------------------------------------------------------------
# LADDER D1 (9 Aug 2026), built under his blanket ruling ("okay let's implement
# every thing") — the same disease INSTALL_CONDUCTOR.ps1 cured in the morning:
# nine loose rows staggered 22:00→23:10 whose stagger WAS the order, and a
# missed evening collapses into one unordered catch-up burst. One task
# (ArsenalFC-Evening-Conductor, 22:00 — the Bell's time, HIS ruled 22:00) runs
# `conductor.mjs evening`: Bell → Scorer → SetPiece → Doubtminer → Physio-PM →
# Examiner → Wall-PM → Scout → Wallpaper, with needs[] recorded per step.
# The nine are DISABLED (not deleted) — same reversible pattern as the morning.
# REVERT: run with -Revert.
# ============================================================================
param([switch]$Revert, [switch]$WhatIf)

$repo = "C:\Users\nikhi\GitHub\arsenal-ai-fc"
$task = "ArsenalFC-Evening-Conductor"

# The nine the chain replaces — ids match `node scripts/conductor.mjs plan evening`.
$replaced = @(
  "ArsenalFC-Bell-FullTime",  # 22:00  (HIS time — the chain opens with it)
  "ArsenalFC-Scorer",         # 22:35
  "ArsenalFC-SetPiece",       # 22:40
  "ArsenalFC-Doubtminer",     # 22:45
  "ArsenalFC-Physio-PM",      # 22:50
  "ArsenalFC-Examiner",       # 22:55
  "ArsenalFC-Wall-PM",        # 23:00
  "ArsenalFC-Scout",          # 23:05
  "ArsenalFC-Wallpaper"       # 23:10
)

function Say($m) { Write-Host $m }

if ($Revert) {
  Say "REVERTING - re-enabling the 9 evening rows and removing the chain."
  foreach ($t in $replaced) {
    if ($WhatIf) { Say "  would ENABLE  $t"; continue }
    schtasks /Change /TN $t /ENABLE 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { Say "  + re-enabled $t" } else { Say "  ! could not re-enable $t" }
  }
  if (-not $WhatIf) { schtasks /Delete /F /TN $task 2>$null | Out-Null }
  Say "Revert complete. The evening is back to 9 separate alarms."
  return
}

# --- 1. register the chain ---------------------------------------------------
# 11 Aug 2026 - THE CLOAK (see setup\hidden_task.vbs): no visible console, and the
# conductor's own exit code still reaches Task Scheduler's Last Result.
$tr = "wscript.exe `"$repo\setup\hidden_task.vbs`" cmd /c $repo\setup\run_logged.cmd scripts\conductor.mjs evening"
Say "Registering $task at 22:00 (the Bell's own time) ..."
if ($WhatIf) { Say "  would run: schtasks /Create /F /TN $task /TR `"$tr`" /SC DAILY /ST 22:00" }
else {
  schtasks /Create /F /TN $task /TR $tr /SC DAILY /ST 22:00 | Out-Null
  if ($LASTEXITCODE -eq 0) { Say "  + $task" } else { Say "  ! FAILED to create $task"; return }
  # power conditions + StartWhenAvailable, element-created and READ BACK —
  # the exact lesson INSTALL_CONDUCTOR.ps1:131-158 paid for.
  $x = [xml](schtasks /Query /TN $task /XML)
  $st = $x.Task.Settings
  $st.DisallowStartIfOnBatteries = "false"
  $st.StopIfGoingOnBatteries     = "false"
  if (-not $st.StartWhenAvailable) {
    $el = $x.CreateElement("StartWhenAvailable", $x.DocumentElement.NamespaceURI)
    $el.InnerText = "true"
    $st.AppendChild($el) | Out-Null
  } else { $st.StartWhenAvailable = "true" }
  $tmp = Join-Path $env:TEMP "evening_conductor_task.xml"
  $x.Save($tmp)
  schtasks /Create /F /TN $task /XML $tmp | Out-Null
  $v = [xml](schtasks /Query /TN $task /XML)
  $vs = $v.Task.Settings
  if (($vs.DisallowStartIfOnBatteries -eq "false") -and ($vs.StartWhenAvailable -eq "true")) {
    Say "  + power conditions cleared + StartWhenAvailable (verified on disk) - a missed evening runs LATE, not never"
  } else {
    Say "  ! settings NOT verified on disk - check Task Scheduler by hand"
  }
}

# --- 2. disable the 9 it replaces (verified off disk, have/need counted) -----
Say "Disabling the 9 rows the chain now runs in order ..."
$disabled = @(); $stuck = @()
foreach ($t in $replaced) {
  if ($WhatIf) { Say "  would DISABLE $t"; continue }
  try { schtasks /Change /TN $t /DISABLE 2>$null | Out-Null } catch { }
  $row = schtasks /query /tn $t /fo csv /v 2>$null | ConvertFrom-Csv | Select-Object -First 1
  if (-not $row)                      { Say "  · $t not present (skipped)" }
  elseif ($row.Status -eq "Disabled") { $disabled += $t; Say "  - disabled $t" }
  else                                { $stuck += $t;    Say "  ! $t is STILL $($row.Status) - disable it by hand" }
}
if (-not $WhatIf) {
  Say ("  => {0}/{1} disabled (verified on disk)" -f $disabled.Count, $replaced.Count)
  if ($stuck.Count) { Say ("  => STILL ENABLED: {0} - these will double-run against the chain" -f ($stuck -join ", ")) }
}

Say ""
Say "Done. The evening is now ONE ordered chain instead of 9 alarms."
Say "Verify:  node scripts\conductor.mjs plan evening"
Say "Revert:  powershell -ExecutionPolicy Bypass -File setup\INSTALL_EVENING_CONDUCTOR.ps1 -Revert"
