# ============================================================================
# UNINSTALL_ARCHIVE.ps1 — removes ONLY what INSTALL_ARCHIVE.ps1 created.
#   powershell -ExecutionPolicy Bypass -File setup\UNINSTALL_ARCHIVE.ps1
#
# IT NEVER TOUCHES $ARSENAL_ARCHIVE. The archive is the permanent record and it
# is app-independent by design: uninstalling the software that feeds it must not
# be able to delete it. If the folder is ever to go, that is his hand, not a
# script's — LAW 2, and the reason data/ is called sacred.
# ============================================================================
$repo = "C:\Users\nikhi\GitHub\arsenal-ai-fc"

foreach ($t in "ArsenalFC-Archivist","ArsenalFC-ArchiveVitals","ArsenalFC-ArchiveFixity","ArsenalFC-ArchiveSeal","ArsenalFC-ArchiveAudit") {
  schtasks /Delete /F /TN $t 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "  - $t removed" } else { Write-Host "  . $t was not present" }
}

$dst = "$repo\.git\hooks\pre-commit"
if (Test-Path $dst) {
  $body = Get-Content $dst -Raw
  if ($body -match "archivist\.mjs tripwire") { Remove-Item $dst -Force; Write-Host "  - commit tripwire removed" }
  else { Write-Host "  ! .git\hooks\pre-commit is NOT the archive tripwire - left alone" }
}

# no ternary: this box runs Windows PowerShell 5.1, where `? :` is a parse error
$arc = $env:ARSENAL_ARCHIVE
if (-not $arc) { $arc = "$env:USERPROFILE\CyborgArchive" }
Write-Host ""
Write-Host "The archive itself is UNTOUCHED at $arc"
Write-Host "Nothing here can delete the permanent record. That is deliberate."
