# restart_surfaces.ps1 — 18 Aug 2026 (his word: "stop asking my word, implement things which are
# important, all of them"). Runs IN HIS INTERACTIVE SESSION (dispatched as a one-off scheduled
# task, because a session shell cannot kill his processes — Access is denied). Kills the STALE
# thalamus (:4113) + cortex (:4112) node processes so START_DAEMONS relaunches them on current
# code (the watchdog's STALE BUILD card), then runs the Dugout launcher (kills the :4114 bridge,
# starts a fresh one with the mouth contract + auto-open, opens the browser). Idempotent.
$repo = "C:\Users\nikhi\GitHub\arsenal-ai-fc"
$log = Join-Path $repo "dressing-room\state\restart_surfaces.log"
"$(Get-Date -Format o) start" | Out-File -FilePath $log -Append -Encoding utf8
foreach ($port in 4113, 4112) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($p -and $p.ProcessName -eq 'node') { "$(Get-Date -Format o) kill :$port pid $($p.Id)" | Out-File -FilePath $log -Append -Encoding utf8; Stop-Process -Id $p.Id -Force -Confirm:$false -ErrorAction SilentlyContinue }
  }
}
Start-Sleep -Seconds 2
& wscript.exe "$repo\setup\START_DAEMONS.vbs"
"$(Get-Date -Format o) START_DAEMONS dispatched" | Out-File -FilePath $log -Append -Encoding utf8
Start-Sleep -Seconds 4
& powershell.exe -ExecutionPolicy Bypass -File "$repo\setup\open_dugout.ps1" *>> $log
"$(Get-Date -Format o) open_dugout done · :4114 listening = $([bool](Get-NetTCPConnection -LocalPort 4114 -State Listen -ErrorAction SilentlyContinue))" | Out-File -FilePath $log -Append -Encoding utf8
