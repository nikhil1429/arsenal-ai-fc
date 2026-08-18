# ============================================================================
# INSTALL_ARCHIVE.ps1 — THE ARCHIVE's schedule + its commit tripwire
#   (ARCHIVE__DAY_ONE_SPEC.md §7.5 + §7.6, built 14 Aug 2026)
#
# Run ONCE:  powershell -ExecutionPolicy Bypass -File setup\INSTALL_ARCHIVE.ps1
# REVERT:    setup\UNINSTALL_ARCHIVE.ps1  (removes ONLY what this file creates)
#
# WHY A SEPARATE INSTALLER and not three more rows in INSTALL_TASKS.ps1: the
# archive is deliberately app-independent. It must be installable, revertible and
# reasonable-about on its own, without re-running the installer that owns 30
# other organs. Same Mk() conventions as INSTALL_TASKS.ps1 (run_logged.cmd for
# the log + the honest exit code, hidden_task.vbs for THE CLOAK — his ruling,
# 11 Aug 2026: a console window flashing across his screen while he studies is
# "very distracting for my adhd brain").
#
# THE CADENCE, and why `run` is every 15 minutes: afferent.jsonl is a WRITE-AHEAD
# LOG and the archive is the durable store behind it. Anything lost from the WAL
# before it is archived is lost forever, so the gap between "he said it" and
# "it is permanent" is the whole risk, and 15 minutes is the number that keeps it
# small without the archivist ever landing in the 22:00-08:00 catch-up herd.
# ============================================================================
$repo = "C:\Users\nikhi\GitHub\arsenal-ai-fc"

function Mk($name, $args_, $sched) {
  $tr = "wscript.exe `"$repo\setup\hidden_task.vbs`" cmd /c $repo\setup\run_logged.cmd scripts\$args_"
  schtasks /Create /F /TN $name /TR $tr @sched | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "  + $name" } else { Write-Host "  ! FAILED $name" }
}

Write-Host "Installing THE ARCHIVE ..."

# 1. THE TAIL — the only lane whose delay is measured in data loss.
Mk "ArsenalFC-Archivist"     "archivist.mjs run"    @("/SC","MINUTE","/MO","15")

# 2. VITALS (LAW 6) — 23:40, after the evening spine has written its rows and
#    before the overnight band. Counts, fill rates, silence detection. Zero LLM.
Mk "ArsenalFC-ArchiveVitals" "archivist.mjs vitals" @("/SC","DAILY","/ST","23:40")

# 3. FIXITY — monthly, 1st, 04:00. Bit rot is real and silent: a drive in a
#    drawer degrades and NOTHING tells you. This is the only thing standing
#    between him and a corrupted archive he still believes.
#    schtasks MONTHLY: /D 1 = the first day of every month.
Mk "ArsenalFC-ArchiveFixity" "archivist.mjs verify" @("/SC","MONTHLY","/D","1","/ST","04:00")

# 4. SEAL — the bag is regenerated weekly so the external disk is never more
#    than a week from a valid, verifiable BagIt copy. Saturday morning, outside
#    the sleep band and outside his study hours.
Mk "ArsenalFC-ArchiveSeal"   "archivist.mjs seal"   @("/SC","WEEKLY","/D","SAT","/ST","09:20")

# 5. THE AUDIT (spec §16) - monthly, 1st, 04:20. NOT the same job as fixity, and
#    the twenty-minute gap is deliberate: 04:00 is taken and two full walks of
#    34,000 records should not overlap.
#    FIXITY asks "has anything CHANGED since the seal" using the archive's own
#    program. THE AUDIT asks the only question nothing else asks: "is the README
#    still SUFFICIENT" - it recomputes every hash, field order, IST partition and
#    schema conformance from the PUBLISHED DOCUMENTS, with code that imports
#    nothing from this repo. If the canonical-bytes rule ever drifts, fixity and
#    the selftest both stay green (they use the same wrong function twice) and
#    only this goes red.
#    MONTHLY IS THE FLOOR, NOT THE TRIGGER - his ruling. The real trigger is an
#    event: a passing run is part of the definition of done for any change to the
#    archive README recipe, SCHEMA/v1.json, canon(), istStamp() or buildRecord().
#    And if it has not run in 90 days the watchman raises it, because an auditor
#    that silently stops is worse than none - the green memory persists.
Mk "ArsenalFC-ArchiveAudit"  "archive_audit.mjs run" @("/SC","MONTHLY","/D","1","/ST","04:20")

# POWER + SLEEP CONDITIONS — the same two live findings INSTALL_TASKS.ps1 paid
# for (12 Jul: battery kill-conditions silently queue or kill the whole organism;
# 14 Jul: a laptop asleep past a trigger skips it forever without catch-up).
# The archivist above all must not be a lane that quietly stops.
#
# THE MONTHLY TRAP, measured on the first live install (14 Aug 2026):
# Set-ScheduledTask threw "The parameter is incorrect" on ArsenalFC-ArchiveFixity
# and ONLY on it. A task created with `schtasks /SC MONTHLY /D 1` comes back
# through the CIM layer with a monthly trigger the same layer will not write
# back, so the settings silently did not apply — and they failed on the one lane
# whose whole job is detecting silent corruption. Left as-is it would have been:
# refuses to start on battery, killed on unplug, and a missed 04:00 on the 1st
# skipped forever with no catch-up. A fixity check that quietly never runs is
# strictly worse than none, because it looks like assurance.
# The XML path has no such restriction, so every task is hardened through the
# CIM layer first and falls back to XML the moment it refuses. Same trick
# INSTALL_TASKS.ps1 already uses for the TimeAuditor-Pulse triggers.
#
# AND THE TRAP INSIDE THE TRAP, also measured: schtasks emits Settings elements
# ONLY for values that differ from the default, so a task with catch-up off has
# NO <StartWhenAvailable> node at all and assigning to it throws "the property
# cannot be found". The element has to be CREATED, and created in the schema's
# own position (…DisallowStartIfOnBatteries · StopIfGoingOnBatteries ·
# StartWhenAvailable…) or the scheduler rejects the document. Proven live: after
# this, the fixity lane reads Batteries=False, StopOnBat=False, CatchUp=True with
# its 01 Sep 04:00 trigger intact.
function SetSetting($x, $s, $name_, $value, $afterLocalName) {
  $node = $s.SelectSingleNode("*[local-name()='$name_']")
  if ($node) { $node.InnerText = $value; return }
  $node = $x.CreateElement($name_, $x.DocumentElement.NamespaceURI)
  $node.InnerText = $value
  $anchor = $s.SelectSingleNode("*[local-name()='$afterLocalName']")
  if ($anchor) { $s.InsertAfter($node, $anchor) | Out-Null } else { $s.AppendChild($node) | Out-Null }
}
function HardenViaXml($name) {
  try {
    $x = [xml]((schtasks /Query /TN $name /XML) | Out-String)
    $s = $x.Task.Settings
    SetSetting $x $s "DisallowStartIfOnBatteries" "false" "MultipleInstancesPolicy"
    SetSetting $x $s "StopIfGoingOnBatteries" "false" "DisallowStartIfOnBatteries"
    SetSetting $x $s "StartWhenAvailable" "true" "StopIfGoingOnBatteries"
    $p = Join-Path $env:TEMP ("arsenal_" + ($name -replace "[^A-Za-z0-9]", "_") + ".xml")
    $x.Save($p)
    schtasks /Create /F /TN $name /XML $p | Out-Null
    Remove-Item $p -Force -ErrorAction SilentlyContinue
    $back = Get-ScheduledTask -TaskName $name
    if (-not $back.Settings.DisallowStartIfOnBatteries -and $back.Settings.StartWhenAvailable) {
      Write-Host "    ~ $name hardened via XML (the CIM layer refused it)"
    } else {
      Write-Host "    ! $name STILL has battery/catch-up defaults - it will die on battery and skip missed runs. Fix by hand."
    }
  } catch { Write-Host "    ! $name could not be hardened: $($_.Exception.Message)" }
}
foreach ($t in "ArsenalFC-Archivist","ArsenalFC-ArchiveVitals","ArsenalFC-ArchiveFixity","ArsenalFC-ArchiveSeal","ArsenalFC-ArchiveAudit") {
  $task = Get-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue
  if (-not $task) { continue }
  $task.Settings.DisallowStartIfOnBatteries = $false
  $task.Settings.StopIfGoingOnBatteries = $false
  $task.Settings.StartWhenAvailable = $true
  try { $task | Set-ScheduledTask -ErrorAction Stop | Out-Null } catch { HardenViaXml $t }
}
# READ BACK OFF DISK - the lesson INSTALL_EVENING_CONDUCTOR.ps1's disable-loop
# paid for: an installer that reports what it INTENDED is not a measurement.
$bad = @(Get-ScheduledTask -TaskName "ArsenalFC-Archiv*" | Where-Object { $_.Settings.DisallowStartIfOnBatteries -or -not $_.Settings.StartWhenAvailable })
if ($bad.Count -eq 0) { Write-Host "  ~ battery kill-conditions cleared + catch-up-on-wake set on all 5 archive tasks (read back off disk)" }
else { Write-Host ("  ! STILL WRONG on: " + (($bad | ForEach-Object { $_.TaskName }) -join ", ")) }

# ── THE COMMIT TRIPWIRE ──────────────────────────────────────────────────────
# .git/hooks is NOT versioned, which is why hooks/pre-commit is the tracked
# source of truth and this copies it into place. Re-run after any fresh clone.
$src = "$repo\hooks\pre-commit"
$dst = "$repo\.git\hooks\pre-commit"
if (Test-Path $src) {
  Copy-Item $src $dst -Force
  Write-Host "  + commit tripwire installed at .git\hooks\pre-commit"
  node "$repo\scripts\archivist.mjs" tripwire
} else {
  Write-Host "  ! hooks\pre-commit missing - THE TRIPWIRE IS NOT INSTALLED"
}
# ── THE FREEZE GUARD (OVERHAUL Block 8, 18 Aug 2026) ────────────────────────
# hooks/commit-msg is the tracked source; git runs it AFTER the message exists
# (pre-commit cannot see -m). Layers beside the tripwire, never replaces it.
$fsrc = "$repo\hooks\commit-msg"
$fdst = "$repo\.git\hooks\commit-msg"
if (Test-Path $fsrc) {
  Copy-Item $fsrc $fdst -Force
  Write-Host "  + freeze guard installed at .git\hooks\commit-msg"
  node "$repo\scripts\freeze.mjs" status
} else {
  Write-Host "  ! hooks\commit-msg missing - THE FREEZE GUARD IS NOT INSTALLED"
}

# ── FIRST RUN, so no lane is born already looking dead ───────────────────────
# pulse.mjs `alive` reads schtasks and calls a task with no run on record the
# loudest class there is. A brand-new task is indistinguishable from an abandoned
# one until it has run once, so each is fired here and the organism never starts
# by reporting a red it created itself.
foreach ($t in "ArsenalFC-Archivist","ArsenalFC-ArchiveVitals","ArsenalFC-ArchiveFixity","ArsenalFC-ArchiveSeal","ArsenalFC-ArchiveAudit") {
  schtasks /Run /TN $t | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "  > $t fired once (a never-run lane reads as a dead lane)" }
}

Write-Host ""
# (the filter below read "ArchiveArsenalFC" until 15 Aug 2026 - a transposition
#  that matched nothing, so the installer's own verification step printed empty)
Write-Host "Done. Verify with: schtasks /Query /FO TABLE | findstr ArsenalFC-Archiv"
node "$repo\scripts\archivist.mjs" status
