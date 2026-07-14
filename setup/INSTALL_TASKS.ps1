# ============================================================================
# INSTALL_TASKS.ps1 — THE ORGANISM's schedule (ORGANISM_ANATOMY §7)
# Run ONCE in an elevated-or-normal PowerShell:
#   powershell -ExecutionPolicy Bypass -File setup\INSTALL_TASKS.ps1
#
# LAYERING: your existing ArsenalFC-* tasks (Goalkeeper 08:30, FSRS 08:40,
# Calibration 08:42, Nemesis 08:43, LearningState 08:44, CapturePull hourly,
# TimeAuditor) are left UNTOUCHED. The new tasks coexist; the heartbeat's
# recomputes are idempotent with the old cascade.
# REVERT: setup\UNINSTALL_TASKS.ps1 removes ONLY the tasks created here.
# ============================================================================
$repo = "C:\Users\nikhi\GitHub\arsenal-ai-fc"
function Mk($name, $args_, $sched) {
  # cmd /c form avoids the nested-quote trap ("Program Files" in node's path):
  # cd into the repo, then let PATH resolve node. No embedded quotes needed.
  $tr = "cmd /c cd /d $repo && node scripts\$args_"
  schtasks /Create /F /TN $name /TR $tr @sched | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "  + $name" } else { Write-Host "  ! FAILED $name" }
}
Write-Host "Installing THE ORGANISM's schedule..."

# morning spine
Mk "ArsenalFC-Mirror"      "mirror.mjs"     @("/SC","DAILY","/ST","06:55")
Mk "ArsenalFC-Physio-AM"   "physio.mjs"     @("/SC","DAILY","/ST","07:30")
Mk "ArsenalFC-Twin"        "twin.mjs"       @("/SC","DAILY","/ST","08:35")
Mk "ArsenalFC-Heartbeat"   "heartbeat.mjs"  @("/SC","DAILY","/ST","08:39")
Mk "ArsenalFC-Wall-AM"     "viz.mjs"        @("/SC","DAILY","/ST","08:50")
# in-day senses (files only, never pings)
Mk "ArsenalFC-Throwin"     "throwin.mjs"    @("/SC","MINUTE","/MO","15")
Mk "ArsenalFC-Touchline"   "touchline.mjs"  @("/SC","MINUTE","/MO","30")
# the hot brain — self-governing: overnight-heavy, study-hour-protecting
Mk "ArsenalFC-BrainTick"   "brain.mjs tick" @("/SC","MINUTE","/MO","30")
# evening spine
Mk "ArsenalFC-Scorer"      "scorer.mjs"     @("/SC","DAILY","/ST","21:35")
Mk "ArsenalFC-SetPiece"    "setpiece.mjs"   @("/SC","DAILY","/ST","21:40")
Mk "ArsenalFC-Doubtminer"  "doubtminer.mjs" @("/SC","DAILY","/ST","21:45")
Mk "ArsenalFC-Physio-PM"   "physio.mjs"     @("/SC","DAILY","/ST","21:50")
Mk "ArsenalFC-Wall-PM"     "viz.mjs"        @("/SC","DAILY","/ST","22:00")
Mk "ArsenalFC-Scout"       "scout.mjs"      @("/SC","DAILY","/ST","22:05")
# Sunday only: the genome files its proposal
Mk "ArsenalFC-BootRoom"    "bootroom.mjs"   @("/SC","WEEKLY","/D","SUN","/ST","20:00")

# POWER CONDITIONS (E2E finding, 12 Jul 2026): schtasks defaults set
# DisallowStartIfOnBatteries + StopIfGoingOnBatteries — on battery the whole
# organism silently queues/dies, and running jobs get KILLED mid-write on
# unplug. The body runs wherever the machine is: clear both flags on EVERY
# ArsenalFC-* task (covers the pre-existing squad tasks too).
Get-ScheduledTask | Where-Object { $_.TaskName -like "ArsenalFC*" } | ForEach-Object {
  $_.Settings.DisallowStartIfOnBatteries = $false
  $_.Settings.StopIfGoingOnBatteries = $false
  $_ | Set-ScheduledTask | Out-Null
}
Write-Host "  ~ battery kill-conditions cleared on all ArsenalFC-* tasks"

# SLEEP CONDITIONS (live finding, 14 Jul 2026): a laptop asleep past a trigger
# silently skips it — the morning spine's catch-ups came back 0x800710E0
# "refused" and the whole 02:xx overnight lane read "has not yet run" (1999).
# StartWhenAvailable = catch-up-on-wake, on EVERY task. schtasks /Create
# cannot set it; patch post-create, same shape as the battery fix above.
Get-ScheduledTask | Where-Object { $_.TaskName -like "ArsenalFC*" } | ForEach-Object {
  $_.Settings.StartWhenAvailable = $true
  $_ | Set-ScheduledTask | Out-Null
}
Write-Host "  ~ catch-up-on-wake (StartWhenAvailable) set on all ArsenalFC-* tasks"

# GOALKEEPER CLOAK (live finding, 14 Jul 2026): the pre-existing Goalkeeper
# task ran via a VISIBLE console (cmd /c node oura_coach.mjs) — the window
# begs to be closed, and closing it kills the run mid-Oura-call (the same
# 0xC000013A scar hidden_run.vbs exists for). Re-point it through the cloak.
$gk = Get-ScheduledTask -TaskName "ArsenalFC-Goalkeeper" -ErrorAction SilentlyContinue
if ($gk) {
  $gkArgs = "$repo\setup\hidden_run.vbs cmd /c node $repo\scripts\oura_coach.mjs >> $repo\scripts\coach.log 2>&1"
  $gkAct = New-ScheduledTaskAction -Execute "wscript.exe" -Argument $gkArgs
  Set-ScheduledTask -TaskName "ArsenalFC-Goalkeeper" -Action $gkAct | Out-Null
  Write-Host "  ~ Goalkeeper cloaked (hidden_run.vbs) — no more visible console to close"
}

Write-Host ""
Write-Host "Done. Verify with: schtasks /Query /FO TABLE | findstr ArsenalFC"
Write-Host "Post-match stays a human ritual: npm run postmatch (30 seconds, evening)."
