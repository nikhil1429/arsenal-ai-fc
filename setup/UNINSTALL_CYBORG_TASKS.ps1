# Removes ONLY the cyborg-brain tasks (INSTALL_CYBORG_TASKS.ps1's set).
$names = @("ArsenalFC-Thalamus","ArsenalFC-Cortex","ArsenalFC-Tone","ArsenalFC-Presence","ArsenalFC-DMN","ArsenalFC-Consolidate","ArsenalFC-HippoStore","ArsenalFC-HippoIndex","ArsenalFC-Examiner","ArsenalFC-NightShift","ArsenalFC-PresenceFit","ArsenalFC-Turnstile")
foreach ($n in $names) { schtasks /Delete /F /TN $n 2>$null | Out-Null; Write-Host "  - $n" }
Write-Host "Cyborg-brain tasks removed. The original organism schedule is untouched."
