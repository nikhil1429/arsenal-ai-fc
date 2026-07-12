# Removes ONLY the tasks INSTALL_TASKS.ps1 created. Your original
# ArsenalFC-Goalkeeper / FSRS / Calibration / Nemesis / LearningState /
# CapturePull / TimeAuditor tasks are never touched.
$new = @("ArsenalFC-Mirror","ArsenalFC-Physio-AM","ArsenalFC-Twin","ArsenalFC-Heartbeat",
"ArsenalFC-Wall-AM","ArsenalFC-Throwin","ArsenalFC-Touchline","ArsenalFC-BrainTick",
"ArsenalFC-Scorer","ArsenalFC-SetPiece","ArsenalFC-Doubtminer","ArsenalFC-Physio-PM",
"ArsenalFC-Wall-PM","ArsenalFC-Scout","ArsenalFC-BootRoom")
foreach ($t in $new) { schtasks /Delete /F /TN $t 2>$null; Write-Host "  - $t" }
Write-Host "Organism schedule removed. The pre-organism system is untouched."
