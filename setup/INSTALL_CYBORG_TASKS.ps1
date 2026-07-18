# ============================================================================
# INSTALL_CYBORG_TASKS.ps1 - the CYBORG BRAIN's schedule (CYBORG_BRAIN.md M0-M10)
# Run once:  powershell -ExecutionPolicy Bypass -File setup\INSTALL_CYBORG_TASKS.ps1
#
# LAYERING: the original organism schedule (INSTALL_TASKS.ps1) is UNTOUCHED.
# These are the evolution's organs only. REVERT: UNINSTALL_CYBORG_TASKS.ps1.
# The two daemons also self-start whenever the Dugout boots (dugout.mjs main),
# so a matchday works even if logon tasks haven't fired yet.
# ============================================================================
$repo = "C:\Users\nikhi\GitHub\arsenal-ai-fc"
function Mk($name, $args_, $sched) {
  $tr = "cmd /c cd /d $repo && node scripts\$args_"
  schtasks /Create /F /TN $name /TR $tr @sched | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "  + $name" } else { Write-Host "  ! FAILED $name" }
}
Write-Host "Installing THE CYBORG BRAIN's schedule..."

# the two daemons - daily 07:00 start, INVISIBLE via hidden_run.vbs (scar
# 0xC000013A: a visible console begs to be closed; closing it kills the
# daemon). ONLOGON needs elevation; the Dugout ALSO boots both on every
# matchday start. EADDRINUSE/singleton guards make double-starts harmless.
function MkHidden($name, $args_, $sched) {
  $tr = "wscript.exe `"$repo\setup\hidden_run.vbs`" node scripts\$args_"
  schtasks /Create /F /TN $name /TR $tr @sched | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "  + $name (hidden)" } else { Write-Host "  ! FAILED $name" }
}
MkHidden "ArsenalFC-Thalamus" "thalamus.mjs"                 @("/SC","DAILY","/ST","07:00")
MkHidden "ArsenalFC-Cortex"   "cortex.mjs"                   @("/SC","DAILY","/ST","07:02")
MkHidden "ArsenalFC-Turnstile" "turnstile.mjs"               @("/SC","DAILY","/ST","07:04")
# working-memory (P3): the resident PACEMAKER daemon (~75s poll). Singleton via the
# tick lock (:4115), so a stray BrainTick can never double-run it.
MkHidden "ArsenalFC-BrainDaemon" "brain.mjs daemon"          @("/SC","DAILY","/ST","07:06")
# neuromodulation - hourly (cheap; follows the Governor wherever it goes)
Mk "ArsenalFC-Tone"           "tone.mjs"                     @("/SC","HOURLY")
# predictive presence - the stall sensor, every 10 minutes
Mk "ArsenalFC-Presence"       "presence.mjs sense"           @("/SC","MINUTE","/MO","10")
# working-memory (P1): the FREE distiller (working_set) every 15 min
Mk "ArsenalFC-Distiller"      "distiller.mjs"                @("/SC","MINUTE","/MO","15")
# working-memory (P3): the ambient CONTEXT bridge - AW window deltas -> the thalamus
# river, every minute (the ~60s floor is this cadence; each run only emits on a change)
Mk "ArsenalFC-Context"        "context.mjs once"             @("/SC","MINUTE","/MO","1")
# the Rest Room - hourly; its own gates (away/tone/headroom) do the deciding
Mk "ArsenalFC-DMN"            "dmn.mjs"                      @("/SC","HOURLY")
# the hippocampus - nightly consolidation + store maintenance + hourly sweep
Mk "ArsenalFC-Consolidate"    "hippocampus.mjs consolidate"  @("/SC","DAILY","/ST","02:10")
Mk "ArsenalFC-HippoStore"     "hippocampus.mjs consolidate-store" @("/SC","DAILY","/ST","02:20")
Mk "ArsenalFC-HippoIndex"     "hippocampus.mjs index"        @("/SC","HOURLY")
# the Live Examiner - tomorrow's code round staged after the evening spine
Mk "ArsenalFC-Examiner"       "examiner.mjs stage"           @("/SC","DAILY","/ST","21:55")
# THE NIGHT SHIFT (M11) - the idle free-quota drain: probe banks, distractors,
# embed backfill, the Scout pack, the Gem cartridge, the gate-tune report
Mk "ArsenalFC-NightShift"     "nightshift.mjs"               @("/SC","DAILY","/ST","02:40")
# working-memory (P5): overnight deepening - the concept graph, the ONE Opus path (cortex)
Mk "ArsenalFC-ConceptGraph"   "cortex.mjs consolidate"       @("/SC","DAILY","/ST","03:00")
# the stall sensor fits itself to HIS baselines, weekly
Mk "ArsenalFC-PresenceFit"    "presence.mjs calibrate"       @("/SC","WEEKLY","/D","SUN","/ST","03:30")

# POWER CONDITIONS (the E2E scar): clear battery kill-flags on every task
Get-ScheduledTask | Where-Object { $_.TaskName -like "ArsenalFC*" } | ForEach-Object {
  $_.Settings.DisallowStartIfOnBatteries = $false
  $_.Settings.StopIfGoingOnBatteries = $false
  $_ | Set-ScheduledTask | Out-Null
}
Write-Host "  ~ battery kill-conditions cleared on all ArsenalFC-* tasks"

# SLEEP CONDITIONS (live finding, 14 Jul 2026): the 02:xx night lane had NEVER
# fired — the laptop sleeps at 2am, schtasks /Create sets no wake/catch-up.
# StartWhenAvailable = run-on-next-wake for every task; WakeToRun on the night
# lane so it can wake the machine (NOTE: works only if the power plan allows
# wake timers — powercfg RTCWAKE read 0x0 on 14 Jul; the captain's one-liner:
#   powercfg /SETACVALUEINDEX SCHEME_CURRENT SUB_SLEEP RTCWAKE 1
# Without it the lane still fires as a catch-up at first morning wake.)
Get-ScheduledTask | Where-Object { $_.TaskName -like "ArsenalFC*" } | ForEach-Object {
  $_.Settings.StartWhenAvailable = $true
  $_ | Set-ScheduledTask | Out-Null
}
foreach ($n in "Consolidate","HippoStore","NightShift","PresenceFit","Examiner","ConceptGraph") {
  $t = Get-ScheduledTask -TaskName "ArsenalFC-$n" -ErrorAction SilentlyContinue
  if ($t) { $t.Settings.WakeToRun = $true; $t | Set-ScheduledTask | Out-Null }
}
Write-Host "  ~ catch-up-on-wake set on all tasks; night lane armed to wake the machine"

# working-memory (P3-review): the resident --daemon (ArsenalFC-BrainDaemon) is the PRIMARY
# pacer; the base schedule's ArsenalFC-BrainTick (30-min) STAYS as a fallback for when the
# daemon is down. They can never double-run OR double-spend — the tick lock (:4115)
# serializes tick() cross-process (jobs_run is persisted at tick-end, so a serialized
# follower sees the claim and skips the job). So INSTALL_TASKS.ps1 stays untouched.
Write-Host "  ~ BrainDaemon is primary; BrainTick stays as a lock-coordinated fallback"

Write-Host ""
Write-Host "Done. The Kennel's heartbeat task is NOT installed yet - it ships when the Pi arrives (groundsman.mjs header: TRANSPORT)."
