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
# neuromodulation - hourly (cheap; follows the Governor wherever it goes)
Mk "ArsenalFC-Tone"           "tone.mjs"                     @("/SC","HOURLY")
# predictive presence - the stall sensor, every 10 minutes
Mk "ArsenalFC-Presence"       "presence.mjs sense"           @("/SC","MINUTE","/MO","10")
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
# the stall sensor fits itself to HIS baselines, weekly
Mk "ArsenalFC-PresenceFit"    "presence.mjs calibrate"       @("/SC","WEEKLY","/D","SUN","/ST","03:30")

# POWER CONDITIONS (the E2E scar): clear battery kill-flags on every task
Get-ScheduledTask | Where-Object { $_.TaskName -like "ArsenalFC*" } | ForEach-Object {
  $_.Settings.DisallowStartIfOnBatteries = $false
  $_.Settings.StopIfGoingOnBatteries = $false
  $_ | Set-ScheduledTask | Out-Null
}
Write-Host "  ~ battery kill-conditions cleared on all ArsenalFC-* tasks"
Write-Host ""
Write-Host "Done. The Kennel's heartbeat task is NOT installed yet - it ships when the Pi arrives (groundsman.mjs header: TRANSPORT)."
