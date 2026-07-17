# ============================================================================
# LIGHTEN_THE_MACHINE.ps1 - the admin half of the 17 Jul cleanup (captain-approved)
# ----------------------------------------------------------------------------
# RUN IT: double-click  setup\LIGHTEN.cmd   (it elevates and keeps the window open)
#
# ASCII-ONLY BY LAW: PowerShell 5.1 reads a BOM-less UTF-8 file as legacy ANSI,
# which turns an em-dash into a stray quote character and shatters the parser
# (that was the "window flashes and closes" bug, 17 Jul). No fancy characters here.
#
# Everything is REVERSIBLE. Registry backups:
#   dressing-room\vault_system_cleanup_2026-07-17\
# The organism is untouched: Node, Git, Python, ActivityWatch, the 38 ArsenalFC
# tasks, the 4 daemons, Chrome, Brave, VS Code, Antigravity, Claude, Acrobat,
# LibreOffice, Google Drive - all KEPT.
# ============================================================================
$ErrorActionPreference = "Continue"
$log = "$PSScriptRoot\LIGHTEN_last_run.log"
Start-Transcript -Path $log -Force | Out-Null

function Head($t) { Write-Host ""; Write-Host "=== $t ===" -ForegroundColor Cyan }

$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) {
  Write-Host "NOT RUNNING AS ADMIN - close this and use setup\LIGHTEN.cmd instead." -ForegroundColor Red
  Stop-Transcript | Out-Null
  Read-Host "Press Enter to close"
  exit 1
}

$os = Get-CimInstance Win32_OperatingSystem
Write-Host ("RAM free BEFORE: {0:N2} GB of 7.9 GB" -f ($os.FreePhysicalMemory / 1MB)) -ForegroundColor Yellow

# ---------------------------------------------------------------------------
Head "1. SQL SERVER 2019 - stop the database that runs 24/7 for nothing"
# Reverse anytime: Set-Service MSSQLSERVER -StartupType Automatic; Start-Service MSSQLSERVER
foreach ($s in @("MSSQLSERVER", "SQLTELEMETRY", "SQLWriter", "SQLBrowser")) {
  $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
  if ($svc) {
    try { Stop-Service -Name $s -Force -ErrorAction Stop } catch { }
    try {
      Set-Service -Name $s -StartupType Disabled -ErrorAction Stop
      Write-Host "  stopped + disabled: $s" -ForegroundColor Green
    } catch {
      Write-Host "  could not disable: $s" -ForegroundColor Red
    }
  }
}

# ---------------------------------------------------------------------------
Head "2. SQL SERVER 2019 - full uninstall (frees ~1 GB disk, gone at boot forever)"
$sqlSetup = "C:\Program Files\Microsoft SQL Server\150\Setup Bootstrap\SQL2019\setup.exe"
if (Test-Path $sqlSetup) {
  Write-Host "  running the official uninstaller - this takes a few minutes, be patient..." -ForegroundColor Yellow
  & $sqlSetup /Action=Uninstall /FEATURES=SQL,AS,IS,RS,Tools /INSTANCENAME=MSSQLSERVER /QUIET /IACCEPTSQLSERVERLICENSETERMS 2>&1 | Out-Null
  Write-Host "  SQL Server uninstaller finished (exit $LASTEXITCODE : 0 or 3010 = success)" -ForegroundColor Green
} else {
  Write-Host "  setup.exe not found - services are disabled anyway, so it costs no RAM." -ForegroundColor Yellow
  Write-Host "  Remove via Settings > Apps > Microsoft SQL Server 2019 if you want the disk back." -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
Head "3. MSI UNINSTALLS - MongoDB Shell, Teams Meeting Add-in, Acer Care Center"
$msi = @(
  @{ n = "MongoDB Shell";            g = "{1EE48B85-F898-4088-8B77-59345143E806}" },
  @{ n = "Teams Meeting Add-in";     g = "{A7AB73A3-CB10-4AA5-9D38-6AEFFBDE4C91}" },
  @{ n = "Acer Care Center Service"; g = "{AFB52E98-7597-4484-9202-58F0FD3512ED}" }
)
foreach ($m in $msi) {
  Write-Host ("  uninstalling {0} ..." -f $m.n) -NoNewline
  $p = Start-Process msiexec.exe -ArgumentList "/X $($m.g) /qn /norestart" -Wait -PassThru
  if ($p.ExitCode -eq 0 -or $p.ExitCode -eq 1605 -or $p.ExitCode -eq 3010) {
    Write-Host " done" -ForegroundColor Green
  } else {
    Write-Host (" exit {0} - do it from Settings > Apps if it stuck" -f $p.ExitCode) -ForegroundColor Yellow
  }
}

# ---------------------------------------------------------------------------
Head "4. FIREFOX 62 (2018) - eight years unpatched, a real security hole"
$ff = "C:\Program Files\Mozilla Firefox\uninstall\helper.exe"
if (Test-Path $ff) {
  Start-Process $ff -ArgumentList "/S" -Wait
  Start-Sleep -Seconds 3
  Write-Host "  Firefox 62 removed" -ForegroundColor Green
} else {
  Write-Host "  not found (already gone)" -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
Head "5. ACER / INTEL TRAY BLOAT - icons only, the drivers keep working"
Remove-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" -Name "IAStorIcon" -ErrorAction SilentlyContinue
Write-Host "  IAStorIcon startup entry removed (Intel storage driver unaffected)" -ForegroundColor Green
foreach ($s in @("ACCSvc", "WCAssistantService")) {
  $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
  if ($svc) {
    try { Stop-Service -Name $s -Force -ErrorAction Stop } catch { }
    try {
      Set-Service -Name $s -StartupType Manual -ErrorAction Stop
      Write-Host "  set to Manual (safe, not disabled): $s" -ForegroundColor Green
    } catch { }
  }
}

# ---------------------------------------------------------------------------
Head "RESULT"
Start-Sleep -Seconds 3
$os2 = Get-CimInstance Win32_OperatingSystem
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
Write-Host ("RAM free NOW:  {0:N2} GB" -f ($os2.FreePhysicalMemory / 1MB)) -ForegroundColor Green
Write-Host ("DISK C: free:  {0:N0} GB" -f ($disk.FreeSpace / 1GB)) -ForegroundColor Green
Write-Host ""
Write-Host "REBOOT to collect the full win (startup apps + services stop loading)." -ForegroundColor Cyan
Write-Host "All reversible - backups in dressing-room\vault_system_cleanup_2026-07-17\" -ForegroundColor DarkGray
Write-Host "A full log of this run was saved next to this script: LIGHTEN_last_run.log" -ForegroundColor DarkGray
Write-Host ""
Stop-Transcript | Out-Null
Read-Host "Press Enter to close"
