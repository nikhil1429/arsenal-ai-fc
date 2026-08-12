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
  #
  # 2 Aug 2026 audit, finding #98 (cohort half) — EVERY ORGAN GETS A VOICE.
  # This used to be a bare `cmd /c cd /d $repo && node scripts\$args_` with no
  # redirect, so ~35 scheduled organs printed into a cmd window that closed the
  # instant they finished. The Boot Room's weekly verdict, the conductor's chain
  # report, every stack trace: gone. Only six organs (Goalkeeper, FSRS,
  # Calibration, Nemesis, LearningState, TimeAuditor) had a hand-appended
  # redirect, which is why those six are the only ones with a .log today.
  # run_logged.cmd does the redirect, rolls the log at 2 MB, and — critically —
  # exits with the ORGAN's code, because Task Scheduler's `Last Result` is what
  # /organism-doctor reads to decide whether an organ is alive.
  #
  # NOTE: this changes tasks created BY THIS SCRIPT. Tasks already registered keep
  # their existing command until they are re-registered (re-running this file with
  # /F overwrites them, which is the intended upgrade path).
  # 11 Aug 2026 - THE CLOAK, HIS RULING. Task Scheduler launches a `cmd /c` action
  # with a VISIBLE console in his session. With Throwin on 15 minutes and BrainTick /
  # Touchline / Wall-Live on 30, that is a window flashing across his screen roughly
  # every seven minutes, all day, while he studies - his words: "very distracting for
  # my adhd brain." hidden_task.vbs removes the window and STILL exits with the
  # organ's own code, so the Last Result contract written above is untouched. It is
  # hidden_task.vbs and NOT hidden_run.vbs on purpose: the latter is fire-and-forget
  # (right for a daemon that must outlive its launcher, a lie for a scheduled organ,
  # because the task would always report 0 and every health check would go blind).
  # Rows registered before today are re-pointed by setup\CLOAK_TASKS.ps1, which also
  # writes the revert receipt.
  $tr = "wscript.exe `"$repo\setup\hidden_task.vbs`" cmd /c $repo\setup\run_logged.cmd scripts\$args_"
  schtasks /Create /F /TN $name /TR $tr @sched | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "  + $name" } else { Write-Host "  ! FAILED $name" }
  HonourExpectedState $name
}

# ============================================================================
# THE EXPECTED-STATE GUARD (11 Aug 2026) - an installer may never RE-ARM a row
# the schedule's own contract says is designed-OFF. Written first in
# INSTALL_CYBORG_TASKS.ps1 for the ArsenalFC-Examiner scar (its re-runs staged
# tomorrow's drill at 21:55, 45 min BEFORE the setpiece it depends on) and
# brought here in the SAME pass, because the two installers disagreeing on the
# same Mk() line is this repo's oldest schedule scar (audit #98 / #108).
# ELEVEN rows created below are designed-off today: the six evening organs
# conductor.mjs now runs in order (Scorer/SetPiece/Doubtminer/Physio-PM/
# Wall-PM/Scout) and five the morning chain owns (Mirror/Physio-AM/Twin/
# Heartbeat/Wall-AM). Every one of them was re-armed, ENABLED, by a re-run of
# this file - each a second, unordered runner racing its own chain.
# WHY A FILE AND NOT A LIST HERE: dressing-room/state/tasks_expected.json is
# already the contract watchman.mjs judges the live schedule by, so the decision
# lives in ONE place; the rows stay as history so the -Revert paths still work.
# FAIL-OPEN and loud: no contract = no guard, and it says so.
# ============================================================================
$ExpectedPath = "$repo\dressing-room\state\tasks_expected.json"
$ExpectedDisabled = @()
if (Test-Path $ExpectedPath) {
  try { $ExpectedDisabled = @((Get-Content $ExpectedPath -Raw | ConvertFrom-Json).expected_disabled) }
  catch { Write-Host "  ! tasks_expected.json unreadable - EXPECTED-STATE GUARD IS OFF this run; check disabled rows by hand" }
} else {
  Write-Host "  ! tasks_expected.json missing - EXPECTED-STATE GUARD IS OFF this run; check disabled rows by hand"
}
function HonourExpectedState($name) {
  if ($ExpectedDisabled -notcontains $name) { return }
  try { schtasks /Change /TN $name /DISABLE 2>$null | Out-Null } catch { }
  # read back OFF DISK - the lesson INSTALL_EVENING_CONDUCTOR.ps1's disable-loop paid for
  $row = schtasks /query /tn $name /fo csv /v 2>$null | ConvertFrom-Csv | Select-Object -First 1
  if ($row -and $row.Status -eq "Disabled") { Write-Host "    - $name re-DISABLED (tasks_expected.json: designed-off, a conductor chain owns it)" }
  else { Write-Host "    ! $name is STILL ENABLED against tasks_expected.json - it will RACE its chain; disable it by hand" }
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

# POWER CONDITIONS (E2E finding, 12 Jul 2026): schtasks defaults set
# DisallowStartIfOnBatteries + StopIfGoingOnBatteries — on battery the whole
# organism silently queues/dies, and running jobs get KILLED mid-write on
# unplug. The body runs wherever the machine is: clear both flags on EVERY
# ArsenalFC-* task (covers the pre-existing squad tasks too).
Get-ScheduledTask | Where-Object { $_.TaskName -like "ArsenalFC*" } | ForEach-Object {
  $_.Settings.DisallowStartIfOnBatteries = $false
  $_.Settings.StopIfGoingOnBatteries = $false
  $_ | Set-ScheduledTask | Out-Null
}
Write-Host "  ~ battery kill-conditions cleared on all ArsenalFC-* tasks"

# SLEEP CONDITIONS (live finding, 14 Jul 2026): a laptop asleep past a trigger
# silently skips it — the morning spine's catch-ups came back 0x800710E0
# "refused" and the whole 02:xx overnight lane read "has not yet run" (1999).
# StartWhenAvailable = catch-up-on-wake, on EVERY task. schtasks /Create
# cannot set it; patch post-create, same shape as the battery fix above.
Get-ScheduledTask | Where-Object { $_.TaskName -like "ArsenalFC*" } | ForEach-Object {
  $_.Settings.StartWhenAvailable = $true
  $_ | Set-ScheduledTask | Out-Null
}
Write-Host "  ~ catch-up-on-wake (StartWhenAvailable) set on all ArsenalFC-* tasks"

# GOALKEEPER CLOAK (live finding, 14 Jul 2026): the pre-existing Goalkeeper
# task ran via a VISIBLE console (cmd /c node oura_coach.mjs) — the window
# begs to be closed, and closing it kills the run mid-Oura-call (the same
# 0xC000013A scar hidden_run.vbs exists for). Re-point it through the cloak.
$gk = Get-ScheduledTask -TaskName "ArsenalFC-Goalkeeper" -ErrorAction SilentlyContinue
if ($gk) {
  $gkArgs = "$repo\setup\hidden_run.vbs cmd /c node $repo\scripts\oura_coach.mjs >> $repo\scripts\coach.log 2>&1"
  $gkAct = New-ScheduledTaskAction -Execute "wscript.exe" -Argument $gkArgs
  Set-ScheduledTask -TaskName "ArsenalFC-Goalkeeper" -Action $gkAct | Out-Null
  Write-Host "  ~ Goalkeeper cloaked (hidden_run.vbs) — no more visible console to close"
}

# ============================================================================
# LADDER E1 (9 Aug 2026) — THE ORPHANS COME HOME. Four live tasks existed on the
# box with NO installer row anywhere, so one Windows reset would have silently
# dropped them and nothing could prove they ever existed. Reproduced here AT
# THEIR LIVE TIMES (read off schtasks 9 Aug 2026, not off a doc), routed through
# run_logged.cmd (the #98 default). Bell-FullTime, once on this orphan list, now
# lives in INSTALL_EVENING_CONDUCTOR.ps1 instead — do not re-add it here.
# ============================================================================
Write-Host "Adopting the four orphans (LADDER E1) ..."
Mk "ArsenalFC-CapturePull"     "capture.mjs pull"   @("/SC","HOURLY","/ST","09:00")
Mk "ArsenalFC-TimeAuditor-Full" "timeaudit.mjs full" @("/SC","DAILY","/ST","22:00")
Mk "ArsenalFC-Wall-Live"       "viz.mjs"            @("/SC","MINUTE","/MO","30","/ST","10:38")
# TimeAuditor-Pulse = ONE task, THREE calendar triggers (12:00/15:00/18:00 — the
# 3-bucket day split, ORGANISM_CLOCK.md:48). schtasks /Create cannot express
# that, so: create at 12:00, then append the 15:00 + 18:00 triggers via XML.
Mk "ArsenalFC-TimeAuditor-Pulse" "timeaudit.mjs pulse" @("/SC","DAILY","/ST","12:00")
$px = [xml](schtasks /Query /TN "ArsenalFC-TimeAuditor-Pulse" /XML)
$trigNode = $px.Task.Triggers
if (@($trigNode.CalendarTrigger).Count -lt 3) {
  foreach ($hh in "15:00","18:00") {
    $ct = $px.CreateElement("CalendarTrigger", $px.DocumentElement.NamespaceURI)
    $sb = $px.CreateElement("StartBoundary", $px.DocumentElement.NamespaceURI)
    $sb.InnerText = "2026-07-08T${hh}:00+05:30"
    $sd = $px.CreateElement("ScheduleByDay", $px.DocumentElement.NamespaceURI)
    $di = $px.CreateElement("DaysInterval", $px.DocumentElement.NamespaceURI)
    $di.InnerText = "1"
    $sd.AppendChild($di) | Out-Null
    $ct.AppendChild($sb) | Out-Null
    $ct.AppendChild($sd) | Out-Null
    $trigNode.AppendChild($ct) | Out-Null
  }
  $ptmp = Join-Path $env:TEMP "pulse_task.xml"
  $px.Save($ptmp)
  schtasks /Create /F /TN "ArsenalFC-TimeAuditor-Pulse" /XML $ptmp | Out-Null
  $verify = [xml](schtasks /Query /TN "ArsenalFC-TimeAuditor-Pulse" /XML)
  Write-Host ("  ~ Pulse triggers on disk: {0}/3" -f @($verify.Task.Triggers.CalendarTrigger).Count)
}

# LADDER E1/F14 — THE WAKE-TEST, registered as a standing measurement: a daily
# 03:52 one-liner with WakeToRun. If wakeprobe.log gains lines on lid-closed
# nights, wake timers WORK on this box (the F14 closed-lid night is real); if it
# stays empty on a closed-lid night, StartWhenAvailable catch-up is the truth.
schtasks /Create /F /TN "ArsenalFC-WakeProbe" /TR "wscript.exe `"$repo\setup\hidden_task.vbs`" cmd /c echo woke %DATE% %TIME% >> $repo\scripts\wakeprobe.log" /SC DAILY /ST 03:52 | Out-Null
$wp = Get-ScheduledTask -TaskName "ArsenalFC-WakeProbe" -ErrorAction SilentlyContinue
if ($wp) { $wp.Settings.WakeToRun = $true; $wp.Settings.StartWhenAvailable = $false; $wp | Set-ScheduledTask | Out-Null; Write-Host "  + ArsenalFC-WakeProbe (03:52, WakeToRun, NO catch-up — a woken line means a real wake)" }

# ── THE AUDIT ORGANS (12 Aug 2026) ──────────────────────────────────────────
# An audit that runs once is a hypothesis with a date on it. This repo already
# has a graveyard of one-off audits (#106/#107/#108) whose findings were stale
# within days, so the measurement is SCHEDULED or it does not exist.
#
# Deliberately NOT in the 22:00-08:00 band. That band already carries 21 tasks,
# all with StartWhenAvailable, all firing at once on a laptop that sleeps — the
# catch-up herd this very audit measures. Adding the auditor to the herd it
# audits would be the joke that writes itself. 13:10 is a waking hour, and
# StartWhenAvailable is OFF so a missed audit is simply missed rather than
# stacked onto tomorrow's wake.
schtasks /Create /F /TN "ArsenalFC-Audit" /TR "wscript.exe `"$repo\setup\hidden_task.vbs`" cmd /c node `"$repo\scripts\audit.mjs`" run >> $repo\scripts\audit.log 2>&1" /SC DAILY /ST 13:10 | Out-Null
$au = Get-ScheduledTask -TaskName "ArsenalFC-Audit" -ErrorAction SilentlyContinue
if ($au) { $au.Settings.StartWhenAvailable = $false; $au | Set-ScheduledTask | Out-Null; Write-Host "  + ArsenalFC-Audit (13:10 daily, NO catch-up - one health number, at most one card)" }

# THE BUG MUSEUM, weekly. Every real historical bug is re-introduced into a
# sandbox and the system must still catch it. It costs minutes, so it runs once a
# week rather than nightly, and Sunday 19:00 is before the Boot Room's 20:00 slot
# so a regression in the detectors is known before the genome proposal reads them.
schtasks /Create /F /TN "ArsenalFC-BugMuseum" /TR "wscript.exe `"$repo\setup\hidden_task.vbs`" cmd /c node `"$repo\scripts\mutagen.mjs`" museum >> $repo\scripts\audit.log 2>&1" /SC WEEKLY /D SUN /ST 19:00 | Out-Null
$bm = Get-ScheduledTask -TaskName "ArsenalFC-BugMuseum" -ErrorAction SilentlyContinue
if ($bm) { $bm.Settings.StartWhenAvailable = $false; $bm | Set-ScheduledTask | Out-Null; Write-Host "  + ArsenalFC-BugMuseum (SUN 19:00 - six historical bugs, re-caught or the number drops)" }

Write-Host ""
Write-Host "Done. Verify with: schtasks /Query /FO TABLE | findstr ArsenalFC"
Write-Host "Post-match stays a human ritual: npm run postmatch (30 seconds, evening)."
# LADDER E1 — every installer ENDS by showing the spine it just touched.
Write-Host ""
node "$repo\scripts\conductor.mjs" plan
node "$repo\scripts\conductor.mjs" plan evening
