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

Write-Host ""
Write-Host "Done. Verify with: schtasks /Query /FO TABLE | findstr ArsenalFC"
Write-Host "Post-match stays a human ritual: npm run postmatch (30 seconds, evening)."
