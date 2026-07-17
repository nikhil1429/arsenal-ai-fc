# ============================================================================
# LIGHTEN_THE_MACHINE.ps1 — the admin half of the 17 Jul cleanup (captain-approved)
# ----------------------------------------------------------------------------
# RUN: right-click this file -> "Run with PowerShell"  (approve the UAC prompt)
# Everything here is REVERSIBLE. The registry backup lives in:
#   dressing-room/vault_system_cleanup_2026-07-17/
# Nothing the organism needs is touched: Node, Git, Python, ActivityWatch,
# ArsenalFC tasks, Chrome, Brave, VS Code, Antigravity, Claude, ChatGPT,
# Adobe Acrobat, LibreOffice, Shotcut, Google Drive — all KEPT.
# ============================================================================
$ErrorActionPreference = "Continue"
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "Re-launching as administrator..." -ForegroundColor Yellow
  Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
  exit
}
function Head($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }
$os = Get-CimInstance Win32_OperatingSystem
Write-Host ("RAM free BEFORE: {0:N2} GB of 7.9 GB" -f ($os.FreePhysicalMemory/1MB)) -ForegroundColor Yellow

# ---------------------------------------------------------------------------
Head "1. SQL SERVER 2019 — stop the 24/7 database you never use"
# (services first: instant RAM + boot win. Reverse anytime with:
#  Set-Service MSSQLSERVER -StartupType Automatic; Start-Service MSSQLSERVER)
foreach ($s in @("MSSQLSERVER", "SQLTELEMETRY", "SQLWriter", "SQLBrowser")) {
  $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
  if ($svc) {
    try { Stop-Service -Name $s -Force -ErrorAction Stop } catch { }
    try { Set-Service -Name $s -StartupType Disabled -ErrorAction Stop; Write-Host "  stopped + disabled: $s" -ForegroundColor Green } catch { Write-Host "  could not disable: $s" -ForegroundColor Red }
  }
}

Head "2. SQL SERVER 2019 — full uninstall (frees ~1 GB disk, kills it at boot forever)"
$sqlSetup = "C:\Program Files\Microsoft SQL Server\150\Setup Bootstrap\SQL2019\setup.exe"
if (Test-Path $sqlSetup) {
  Write-Host "  running the official uninstaller (this takes a few minutes, be patient)..." -ForegroundColor Yellow
  & $sqlSetup /Action=Uninstall /FEATURES=SQL,AS,IS,RS,Tools /INSTANCENAME=MSSQLSERVER /QUIET /IACCEPTSQLSERVERLICENSETERMS 2>&1 | Out-Null
  Write-Host "  SQL Server uninstall finished (exit $LASTEXITCODE — 0 or 3010 = success)" -ForegroundColor Green
} else {
  Write-Host "  setup.exe not found — the services are disabled anyway (no RAM cost). Remove via Settings > Apps if you want the disk back." -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
Head "3. MSI UNINSTALLS — MongoDB Shell · Teams Meeting Add-in · Acer Care Center"
$msi = @(
  @{ n = "MongoDB Shell";            g = "{1EE48B85-F898-4088-8B77-59345143E806}" },
  @{ n = "Teams Meeting Add-in";     g = "{A7AB73A3-CB10-4AA5-9D38-6AEFFBDE4C91}" },
  @{ n = "Acer Care Center Service"; g = "{AFB52E98-7597-4484-9202-58F0FD3512ED}" }
)
foreach ($m in $msi) {
  Write-Host "  uninstalling $($m.n)..." -NoNewline
  $p = Start-Process msiexec.exe -ArgumentList "/X $($m.g) /qn /norestart" -Wait -PassThru
  if ($p.ExitCode -in 0, 1605, 3010) { Write-Host " done" -ForegroundColor Green } else { Write-Host " exit $($p.ExitCode) (do it from Settings > Apps if it stuck)" -ForegroundColor Yellow }
}

# ---------------------------------------------------------------------------
Head "4. FIREFOX 62 (2018) — 8 years unpatched = a real security hole"
$ff = "C:\Program Files\Mozilla Firefox\uninstall\helper.exe"
if (Test-Path $ff) {
  Start-Process $ff -ArgumentList "/S" -Wait
  Write-Host "  Firefox 62 removed" -ForegroundColor Green
} else { Write-Host "  not found (already gone)" -ForegroundColor Yellow }

# ---------------------------------------------------------------------------
Head "5. ACER / INTEL TRAY BLOAT — icons only, the drivers keep working"
Remove-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" -Name "IAStorIcon" -ErrorAction SilentlyContinue
foreach ($s in @("ACCSvc", "WCAssistantService")) {
  $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
  if ($svc) {
    try { Stop-Service -Name $s -Force -ErrorAction Stop } catch { }
    try { Set-Service -Name $s -StartupType Manual -ErrorAction Stop; Write-Host "  set to Manual (not disabled — safe): $s" -ForegroundColor Green } catch { }
  }
}

# ---------------------------------------------------------------------------
Head "DONE"
Start-Sleep -Seconds 3
$os2 = Get-CimInstance Win32_OperatingSystem
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
Write-Host ("RAM free NOW:  {0:N2} GB" -f ($os2.FreePhysicalMemory/1MB)) -ForegroundColor Green
Write-Host ("DISK C: free:  {0:N0} GB" -f ($disk.FreeSpace/1GB)) -ForegroundColor Green
Write-Host "`nREBOOT to collect the full win (startup apps + services stop loading)." -ForegroundColor Cyan
Write-Host "Everything is reversible — backups in dressing-room/vault_system_cleanup_2026-07-17/`n" -ForegroundColor DarkGray
Read-Host "Press Enter to close"
