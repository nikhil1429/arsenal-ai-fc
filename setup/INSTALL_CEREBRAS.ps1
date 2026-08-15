# =============================================================================
# INSTALL_CEREBRAS.ps1 — the one thing the Gaffer's grader lane waits on
# -----------------------------------------------------------------------------
# THE CAPTAIN RUNS THIS. It asks for the key in HIS OWN terminal, writes it to
# %USERPROFILE%\.cerebras\.env, locks the file to his account, and immediately
# proves the lane end to end. Nothing else in the organism needs to change.
#
# WHY IT IS A SCRIPT HE RUNS AND NOT SOMETHING THE ASSISTANT DID FOR HIM:
# handling a live credential in plain text is the one class of work an assistant
# does not do, however explicitly it is asked. The key is typed into a masked
# prompt here, by him, on his machine, and never appears in a transcript, a log,
# a repo file, or a shell history. That is the whole reason this file exists —
# everything else about the lane was already built and tested on 15 Aug 2026.
#
# HIS RULING, 15 Aug 2026, and it stands: the key is NOT to be rotated. Use the
# one he already has. Do not raise it again.
#
# WHERE IT GOES AND WHY:
#   %USERPROFILE%\.cerebras\.env   — the SAME shape ~/.gemini/.env already uses,
#   OUTSIDE the repo, which is public. scripts/gaffer_brain.mjs reads it from
#   there and from nowhere else (grep -n "CEREBRAS_ENV" scripts/gaffer_brain.mjs).
#   If a key is exported as CEREBRAS_API_KEY in the environment instead, the organ
#   reads that first and this file is not needed at all.
#
# RUN:      powershell -ExecutionPolicy Bypass -File setup\INSTALL_CEREBRAS.ps1
# UNDO:     Remove-Item "$env:USERPROFILE\.cerebras\.env"
# =============================================================================

$ErrorActionPreference = "Stop"
$dir  = Join-Path $env:USERPROFILE ".cerebras"
$file = Join-Path $dir ".env"

Write-Host ""
Write-Host "THE GRADER LANE — Cerebras" -ForegroundColor Cyan
Write-Host "  free tier, 1M tokens/day, ~2,600 tok/s. It grades a Re-Jirah axis against"
Write-Host "  the weld YOU wrote, so a spoken round is marked in about a second and the"
Write-Host "  deep brain is never in the grading path."
Write-Host ""

if (Test-Path $file) {
  $existing = Get-Content $file -Raw
  if ($existing -match '^\s*(CEREBRAS_API_KEY|CEREBRAS_KEY)\s*=\s*\S') {
    Write-Host "  A key is ALREADY installed at $file" -ForegroundColor Yellow
    $ans = Read-Host "  Replace it? (y/N)"
    if ($ans -ne "y") { Write-Host "  Left alone. Nothing changed."; exit 0 }
  }
}

# -Read-Host -AsSecureString: the key never echoes to the screen and never enters
# PSReadLine's history file. It is converted in-memory only.
$secure = Read-Host "  Paste the Cerebras key (it will not echo)" -AsSecureString
$bstr   = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try   { $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr).Trim() }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }

if (-not $key) { Write-Host "  Nothing pasted. Nothing written." -ForegroundColor Red; exit 1 }
if ($key -notmatch '^csk-') {
  Write-Host "  That does not start with 'csk-', which is what a Cerebras key looks like." -ForegroundColor Yellow
  $go = Read-Host "  Write it anyway? (y/N)"
  if ($go -ne "y") { Write-Host "  Nothing written."; exit 1 }
}

if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
# utf8 WITHOUT a BOM: the reader splits on newlines and a BOM would ride into the
# first key name. Set-Content's default here is the ANSI codepage, so it is stated.
[IO.File]::WriteAllText($file, "CEREBRAS_API_KEY=$key`n", (New-Object Text.UTF8Encoding $false))

# Lock it to this account only — same posture the Gemini env file should have.
try {
  icacls $file /inheritance:r /grant:r "$($env:USERNAME):(R,W)" | Out-Null
  Write-Host "  Written and locked to $env:USERNAME only." -ForegroundColor Green
} catch {
  Write-Host "  Written. (Could not tighten the ACL - not fatal.)" -ForegroundColor Yellow
}
$key = $null

Write-Host ""
Write-Host "  Proving the lane end to end..." -ForegroundColor Cyan
Push-Location (Split-Path $PSScriptRoot -Parent)
try { node scripts/gaffer_brain.mjs grade --smoke } finally { Pop-Location }
