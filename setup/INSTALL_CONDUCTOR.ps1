# ============================================================================
# INSTALL_CONDUCTOR.ps1 - retire the morning burst, hand the morning to one chain
# ----------------------------------------------------------------------------
# 2 Aug 2026 audit, findings #41 / #42 / #43.
#
# NOT RUN AUTOMATICALLY. This file changes the machine's schedule, so it is
# written, reviewed, and run BY THE CAPTAIN. Nothing here has been executed.
#
# WHY THIS EXISTS - measured on 4 Aug 2026, not theorised:
#   29 ArsenalFC-* tasks all fired at the same instant (16:28:23) as a
#   missed-schedule catch-up burst after the machine woke. 4 of them FAILED:
#     ArsenalFC-Wall-AM            exit 1
#     ArsenalFC-Wall-PM            exit 1
#     ArsenalFC-TimeAuditor-Pulse  exit 1
#   Every one of them succeeds when run alone - the Time-Auditor pulse was
#   re-run by hand minutes later and exited 0 with a clean report. They did not
#   fail because they are broken; they failed because 29 processes started at
#   once and their dependencies (ActivityWatch, the state bus, each other) were
#   not up yet. The audit predicted this as a "15-task morning catch-up burst".
#   The real number is 29.
#
#   A burst also has NO ORDER. The audit records the 1 Aug inversion, where the
#   sheet was written BEFORE the body read it depends on. conductor.mjs exists to
#   make the morning a sequence instead of a stampede: 16 steps, one at a time,
#   each with a timeout, and a late start yields a LATE day rather than a BROKEN
#   one. Its selftest is green against the real organs.
#
# WHAT THIS DOES
#   1. Registers ArsenalFC-Morning-Conductor at 08:45.
#   2. Disables the 14 tasks the conductor now runs itself.
#   3. Does NOT touch: BrainTick (every 30 min, all day), CapturePull, Context,
#      Presence, Distiller, Throwin, Touchline, Tone, HippoIndex, the evening
#      spine (Scorer/SetPiece/Doubtminer/Physio-PM/Wall-PM/Scout/Examiner), the
#      Bell, Wallpaper, BootRoom, or the 5 deliberately-disabled LLM tasks.
#
# WAKE-TO-RUN IS DELIBERATELY *NOT* SET HERE (audit #43).
#   `powercfg /a` reports S3 disabled on this box - it is a Modern Standby
#   machine - and no Power-Troubleshooter record has ever shown
#   "Timer - Task Scheduler" as a wake source. So WakeToRun is a HYPOTHESIS on
#   this hardware, not a known fix. Test it first (see WAKE-TEST below); only
#   then add /RI-style wake settings. Setting it blind would look like a fix and
#   silently change nothing.
#
# REVERT: run with -Revert. Every step is reversible in one command.
# ============================================================================
param([switch]$Revert, [switch]$WhatIf)

$repo = "C:\Users\nikhi\GitHub\arsenal-ai-fc"
$conductorTask = "ArsenalFC-Morning-Conductor"

# The 14 the conductor replaces - each one appears as a step in
# `node scripts/conductor.mjs plan`. Verified against that output.
$replaced = @(
  "ArsenalFC-Mirror",         # 06:55
  "ArsenalFC-SprintSync",     # 07:00
  "ArsenalFC-Thalamus",       # 07:00
  "ArsenalFC-Cortex",         # 07:02  (already disabled - listed for completeness)
  "ArsenalFC-Turnstile",      # 07:04
  "ArsenalFC-Physio-AM",      # 07:30
  "ArsenalFC-Goalkeeper",     # 08:30
  "ArsenalFC-Twin",           # 08:35
  "ArsenalFC-Heartbeat",      # 08:39
  "ArsenalFC-FSRS",           # 08:40
  "ArsenalFC-Calibration",    # 08:42
  "ArsenalFC-Nemesis",        # 08:43
  "ArsenalFC-LearningState",  # 08:44
  "ArsenalFC-Wall-AM"         # 08:50
)

function Say($m) { Write-Host $m }

if ($Revert) {
  Say "REVERTING - re-enabling the 14 tasks and removing the conductor."
  foreach ($t in $replaced) {
    if ($WhatIf) { Say "  would ENABLE  $t"; continue }
    schtasks /Change /TN $t /ENABLE 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { Say "  + re-enabled $t" } else { Say "  ! could not re-enable $t" }
  }
  if ($WhatIf) { Say "  would DELETE  $conductorTask" }
  else {
    schtasks /Delete /F /TN $conductorTask 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { Say "  - removed $conductorTask" } else { Say "  ! $conductorTask not present" }
  }
  Say "Revert complete. The morning is back to 14 separate alarms."
  return
}

# --- 1. register the conductor ---------------------------------------------
# Uses run_logged.cmd so the chain report survives the window closing
# (audit #98 - the Boot Room's weekly verdict was lost exactly this way).
$tr = "cmd /c $repo\setup\run_logged.cmd scripts\conductor.mjs morning"
Say "Registering $conductorTask at 08:45 ..."
if ($WhatIf) { Say "  would run: schtasks /Create /F /TN $conductorTask /TR `"$tr`" /SC DAILY /ST 08:45" }
else {
  schtasks /Create /F /TN $conductorTask /TR $tr /SC DAILY /ST 08:45 | Out-Null
  if ($LASTEXITCODE -eq 0) { Say "  + $conductorTask" } else { Say "  ! FAILED to create $conductorTask"; return }

  # Power conditions (E2E finding, 12 Jul 2026): schtasks defaults set
  # DisallowStartIfOnBatteries + StopIfGoingOnBatteries, so on battery the whole
  # morning silently queues or dies mid-write. Clear both, and let a missed run
  # start late rather than never.
  $x = [xml](schtasks /Query /TN $conductorTask /XML)
  $x.Task.Settings.DisallowStartIfOnBatteries = "false"
  $x.Task.Settings.StopIfGoingOnBatteries     = "false"
  $x.Task.Settings.StartWhenAvailable         = "true"
  $tmp = Join-Path $env:TEMP "conductor_task.xml"
  $x.Save($tmp)
  schtasks /Create /F /TN $conductorTask /XML $tmp | Out-Null
  if ($LASTEXITCODE -eq 0) { Say "  + power conditions cleared, StartWhenAvailable on" }
  else { Say "  ! could not apply power settings - do it by hand in Task Scheduler" }
  Remove-Item $tmp -ErrorAction SilentlyContinue
}

# --- 2. disable the 14 it replaces ------------------------------------------
Say "Disabling the 14 tasks the conductor now runs in order ..."
foreach ($t in $replaced) {
  if ($WhatIf) { Say "  would DISABLE $t"; continue }
  schtasks /Change /TN $t /DISABLE 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { Say "  - disabled $t" } else { Say "  ! $t not found (skipped)" }
}

Say ""
Say "Done. The morning is now ONE ordered chain instead of 14 alarms."
Say "Verify:  node scripts\conductor.mjs plan"
Say "Revert:  powershell -ExecutionPolicy Bypass -File setup\INSTALL_CONDUCTOR.ps1 -Revert"
Say ""
Say "STILL TO TEST BY HAND (audit #43) - the WAKE-TEST:"
Say "  1. schtasks /Create /F /TN ArsenalFC-WakeProbe /TR `"cmd /c echo woke >> $repo\scripts\wakeprobe.log`" /SC ONCE /ST <10 min from now>"
Say "  2. Set its 'Wake the computer to run this task' box, then let the machine sleep."
Say "  3. If wakeprobe.log gains a line, WakeToRun works on this box and is worth"
Say "     setting on the conductor, the evening bell, and the wallpaper."
Say "     If it does not, WakeToRun is a no-op here and StartWhenAvailable (set"
Say "     above) is the real fix - a missed morning then runs LATE instead of never."
