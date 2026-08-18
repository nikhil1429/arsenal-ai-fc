# open_dugout.ps1 — the ONE correct way to open any Dugout surface.
# Kills the stale bridge on :4114 FIRST (so a code change always loads), then
# starts a fresh hidden bridge and opens the requested mode. The brain daemons
# (:4113 thalamus, :4112 cortex, :4111 turnstile) are NEVER touched.
#   powershell -ExecutionPolicy Bypass -File open_dugout.ps1 -Mode signing
param([string]$Mode = "", [switch]$Elevated)
$repo = "C:\Users\nikhi\GitHub\arsenal-ai-fc"

# free port 4114 — only a node bridge, nothing else
Get-NetTCPConnection -LocalPort 4114 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
  $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
  if ($p -and $p.ProcessName -eq 'node') { Stop-Process -Id $p.Id -Force -Confirm:$false -ErrorAction SilentlyContinue }
}
Start-Sleep -Milliseconds 800
# 18 Aug 2026 — SELF-ELEVATE when the old bridge would not die (an ELEVATED bridge cannot be
# stopped from a normal shell: "Access is denied" — measured live on pid 9800, launched from an
# elevated app). Re-run THIS script as Administrator (one UAC click) and let it finish there;
# nothing else is done at this level. Guarded by -Elevated so it never loops.
$stillHeld = Get-NetTCPConnection -LocalPort 4114 -State Listen -ErrorAction SilentlyContinue | Where-Object { $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue; $p -and $p.ProcessName -eq 'node' }
if ($stillHeld -and -not $Elevated) {
  $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  if (-not $isAdmin) {
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`" -Mode `"$Mode`" -Elevated"
    exit 0
  }
}

# start a fresh hidden bridge (loads current code), don't auto-open its own tab
$env:DUGOUT_NO_OPEN = "1"
& wscript.exe "$repo\setup\hidden_run.vbs" node scripts\dugout.mjs

# wait for it to bind, then open the requested surface once
for ($i = 0; $i -lt 15; $i++) {
  Start-Sleep -Milliseconds 500
  if ((Get-NetTCPConnection -LocalPort 4114 -State Listen -ErrorAction SilentlyContinue)) { break }
}
$url = "http://localhost:4114/"
if ($Mode) { $url = "http://localhost:4114/?mode=$Mode" }
Start-Process $url
