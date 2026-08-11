# ============================================================================
# INSTALL_CYBORG_TASKS.ps1 - the CYBORG BRAIN's schedule (CYBORG_BRAIN.md M0-M10)
# Run once:  powershell -ExecutionPolicy Bypass -File setup\INSTALL_CYBORG_TASKS.ps1
#
# LAYERING: the original organism schedule (INSTALL_TASKS.ps1) is UNTOUCHED.
# These are the evolution's organs only. REVERT: UNINSTALL_CYBORG_TASKS.ps1.
# The two daemons also self-start whenever the Dugout boots (dugout.mjs main),
# so a matchday works even if logon tasks haven't fired yet.
# ============================================================================
$repo = "C:\Users\nikhi\GitHub\arsenal-ai-fc"
function Mk($name, $args_, $sched) {
  # 6 Aug 2026 audit, finding #108 - EVERY CYBORG ORGAN GETS A VOICE TOO.
  # This line used to be a bare `cmd /c cd /d $repo && node scripts\$args_` with no
  # redirect. INSTALL_TASKS.ps1's Mk() was fixed on 2 Aug (finding #98) to route
  # through run_logged.cmd; this file - written for the evolution's organs - was
  # never brought along, so the two installers disagreed on the same line. The
  # measured consequence: 15 of the 31 enabled ArsenalFC-* tasks still run the bare
  # unlogged form - re-measured on review 6 Aug 2026, and the count of 15 is exactly
  # right, but the FIRST draft of this comment said those 15 "have no log file at ALL"
  # and that predicate is false: Tone and Bell-FullTime are in the 15 and tone.log /
  # brain.log both exist (older hand-runs and other lanes write them). Stated correctly
  # it is worse, not better - 21 of the 31 enabled tasks have no log file today, and
  # the two organs actually misbehaving (NightShift, SelfKnowledge) are both
  # registered here - i.e. undiagnosable BY DESIGN, because their stdout went to a
  # cmd window that closed the instant they finished. run_logged.cmd redirects to
  # scripts\<organ>.log, rolls it at 2 MB, and exits with the ORGAN's code so Task
  # Scheduler's Last Result (what /organism-doctor reads) still means what it says.
  # NOTE: this changes tasks created BY THIS SCRIPT. Already-registered tasks keep
  # their old bare command until this file is RE-RUN (/F overwrites = the upgrade
  # path). MkHidden below is deliberately NOT changed here - it routes through
  # hidden_run.vbs for the console-cloak scar (0xC000013A) and wrapping it is a
  # different design question, not this repair.
  #
  # 11 Aug 2026 - THE CLOAK, HIS RULING. A `cmd /c` action is launched by Task
  # Scheduler with a VISIBLE console in his session; with the organs on 15- and
  # 30-minute triggers that is a window flashing across his screen roughly every
  # seven minutes, all day, while he studies. His words: "very distracting for my
  # adhd brain." hidden_task.vbs takes the window away and STILL exits with the
  # organ's own code, so run_logged.cmd's Last Result contract above survives
  # intact - which is why it is hidden_task.vbs here and not hidden_run.vbs (that
  # one is fire-and-forget, correct for a daemon, a lie for a scheduled row).
  $tr = "wscript.exe `"$repo\setup\hidden_task.vbs`" cmd /c $repo\setup\run_logged.cmd scripts\$args_"
  schtasks /Create /F /TN $name /TR $tr @sched | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "  + $name" } else { Write-Host "  ! FAILED $name" }
  HonourExpectedState $name
}

# ============================================================================
# THE EXPECTED-STATE GUARD (11 Aug 2026) - an installer may never RE-ARM a row
# the schedule's own contract says is designed-OFF.
# ----------------------------------------------------------------------------
# THE SCAR: Mk uses `schtasks /Create /F`, which registers ENABLED and has no
# "keep the current state" mode. So every re-run of this file un-retired
# ArsenalFC-Examiner at 21:55 - a row LADDER D1 disabled on 9 Aug when
# conductor.mjs took the step (EVENING, 22:55, needs:["setpiece"]). Un-retired
# it does REAL damage, not a duplicate: 21:55 is BEFORE setpiece rewrites
# drills.json at 22:40, so the drill stages against YESTERDAY's file and 22:55
# then overwrites it. (The row's own comment - "staged after the evening
# spine" - was written when the spine started at 21:35; it has been false since
# the chain moved the spine to 22:00.) MkHidden carried the identical hole for
# Thalamus / Cortex / Turnstile, all three designed-off today.
#
# THE WIRE: dressing-room/state/tasks_expected.json is ALREADY the schedule's
# contract - watchman.mjs diffs live schtasks against it nightly and REDs /
# WARNs the drift ("an expected-disabled task ENABLED is a double-run WARN").
# It had exactly one blind spot: the installers that CAUSE that drift never
# read it. Now they do. Nothing is hardcoded here and no row is deleted - the
# rows stay as history, so INSTALL_EVENING_CONDUCTOR.ps1 -Revert still works,
# and the ONE place that decides which organs are designed-off stays the file
# the watchman already judges by. FAIL-OPEN: an unreadable/missing contract
# leaves every row enabled and SAYS so - a silent install is the worse failure.
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

Write-Host "Installing THE CYBORG BRAIN's schedule..."

# the two daemons - daily 07:00 start, INVISIBLE via hidden_run.vbs (scar
# 0xC000013A: a visible console begs to be closed; closing it kills the
# daemon). ONLOGON needs elevation; the Dugout ALSO boots both on every
# matchday start. EADDRINUSE/singleton guards make double-starts harmless.
function MkHidden($name, $args_, $sched) {
  $tr = "wscript.exe `"$repo\setup\hidden_run.vbs`" node scripts\$args_"
  schtasks /Create /F /TN $name /TR $tr @sched | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "  + $name (hidden)" } else { Write-Host "  ! FAILED $name" }
  HonourExpectedState $name
}
MkHidden "ArsenalFC-Thalamus" "thalamus.mjs"                 @("/SC","DAILY","/ST","07:00")
MkHidden "ArsenalFC-Cortex"   "cortex.mjs"                   @("/SC","DAILY","/ST","07:02")
MkHidden "ArsenalFC-Turnstile" "turnstile.mjs"               @("/SC","DAILY","/ST","07:04")
# working-memory (P3): the resident PACEMAKER daemon (~75s poll). Singleton via the
# tick lock (:4115), so a stray BrainTick can never double-run it.
MkHidden "ArsenalFC-BrainDaemon" "brain.mjs daemon"          @("/SC","DAILY","/ST","07:06")
# neuromodulation - every 5 min (G16, 9 Aug 2026: zero-LLM and LATENCY is its
# failure mode - an hour-old tone modulates the wrong hour)
Mk "ArsenalFC-Tone"           "tone.mjs"                     @("/SC","MINUTE","/MO","5")
# predictive presence - the stall sensor, every minute (G6, 9 Aug 2026: the
# sensor samples fast; its detection WINDOW is untouched)
Mk "ArsenalFC-Presence"       "presence.mjs sense"           @("/SC","MINUTE","/MO","1")
# working-memory (P1): the FREE distiller (working_set) every 15 min
Mk "ArsenalFC-Distiller"      "distiller.mjs"                @("/SC","MINUTE","/MO","15")
# LADDER G6 (9 Aug 2026): the ArsenalFC-Context row is GONE — the brain daemon's
# own header carries the context bridge now, and this per-minute task was its
# double-ingesting duplicate. tasks_expected.json lists it designed-absent; the
# watchman REDs its resurrection. (Was: Mk "ArsenalFC-Context" "context.mjs once" MINUTE/1)
# the Rest Room - hourly; its own gates (away/tone/headroom) do the deciding
Mk "ArsenalFC-DMN"            "dmn.mjs"                      @("/SC","HOURLY")
# the hippocampus - nightly consolidation + store maintenance + hourly sweep
Mk "ArsenalFC-Consolidate"    "hippocampus.mjs consolidate"  @("/SC","DAILY","/ST","02:10")
Mk "ArsenalFC-HippoStore"     "hippocampus.mjs consolidate-store" @("/SC","DAILY","/ST","02:20")
Mk "ArsenalFC-HippoIndex"     "hippocampus.mjs index"        @("/SC","HOURLY")
# the Live Examiner - tomorrow's code round. RETIRED as a standalone alarm by
# LADDER D1 (9 Aug 2026): conductor.mjs runs it INSIDE the evening chain at
# 22:55 with needs:["setpiece"], because staging reads the drills.json setpiece
# rewrites at 22:40. The 21:55 row below is kept ONLY as history + the revert
# path (INSTALL_EVENING_CONDUCTOR.ps1 -Revert re-enables it); the expected-state
# guard disables it the instant it is created, so a re-run of this installer can
# no longer stage tomorrow's drill against YESTERDAY's file. Its old comment
# said "staged after the evening spine" - false since the spine moved to 22:00.
Mk "ArsenalFC-Examiner"       "examiner.mjs stage"           @("/SC","DAILY","/ST","21:55")
# THE NIGHT SHIFT (M11) - the idle free-quota drain: probe banks, distractors,
# embed backfill, the Scout pack, the Gem cartridge, the gate-tune report
Mk "ArsenalFC-NightShift"     "nightshift.mjs"               @("/SC","DAILY","/ST","02:40")
# working-memory (P5): overnight deepening - the concept graph, the ONE Opus path (cortex)
Mk "ArsenalFC-ConceptGraph"   "cortex.mjs consolidate"       @("/SC","DAILY","/ST","03:00")
# the Gaffer's SELF-KNOWLEDGE - PERMANENTLY FROZEN by his 7 Aug 2026 ruling ("mujhe organism
# kisi ko explain nahi karna hai" - the guest/keynote surface is NOT to be built, thread
# closed). This installer used to recreate the task ENABLED on every re-run, silently undoing
# the freeze (9 Aug launch audit). The task is no longer created at all; if an old copy
# exists, disable it:  schtasks /change /tn ArsenalFC-SelfKnowledge /disable
# Mk "ArsenalFC-SelfKnowledge"  "selfknowledge.mjs"          @("/SC","WEEKLY","/D","SUN","/ST","04:00")   # frozen, kept as history
# the stall sensor fits itself to HIS baselines, weekly
Mk "ArsenalFC-PresenceFit"    "presence.mjs calibrate"       @("/SC","WEEKLY","/D","SUN","/ST","03:30")
# D4 (9 Aug 2026, launch worklist) - the constitution's unconditional reminder promise
# (dugout.mjs :775) finally gets its out-of-process caller, and the shadow sampler stops
# depending on the Dugout window being open. Both lanes existed since #52/#53; no task ran them.
# G6 (9 Aug 2026): both cadences RECONCILED to the constants the code itself
# declares — reminders mirror dugout.mjs's own 30000ms in-process interval (a
# 30-min task was 60x slower than the promise it carries), shadows mirror the
# 600000ms interval at dugout.mjs's sampler.
Mk "ArsenalFC-DugoutReminders" "dugout.mjs fire-reminders"    @("/SC","MINUTE","/MO","1")
Mk "ArsenalFC-ShadowDetect"    "dugout.mjs shadow-detect"     @("/SC","MINUTE","/MO","10")
# LADDER D2 (9 Aug 2026) - the daemon watchdog: probe :4111/:4112/:4113/:4116
# every 10 min, relaunch DOWN daemons via the VBS cloak, resync one pass after
# the thalamus recovers. The dugout (:4114) is deliberately excluded (his surface).
Mk "ArsenalFC-Daemon-Watchdog" "daemon_watchdog.mjs pass"     @("/SC","MINUTE","/MO","10")
# LADDER D3 (9 Aug 2026) - the unattended state push (receipt: groundsman.mjs
# pushOnlyPass header, his 9 Aug blanket ruling). 03:45 = after the night lane's
# writers (nightshift 02:40, conceptgraph 03:00) so the push carries tonight's
# outputs, and hours before the cloud sentinel's 10:30 read.
Mk "ArsenalFC-Groundsman-Push" "groundsman.mjs push"          @("/SC","DAILY","/ST","03:45")

# POWER CONDITIONS (the E2E scar): clear battery kill-flags on every task
Get-ScheduledTask | Where-Object { $_.TaskName -like "ArsenalFC*" } | ForEach-Object {
  $_.Settings.DisallowStartIfOnBatteries = $false
  $_.Settings.StopIfGoingOnBatteries = $false
  $_ | Set-ScheduledTask | Out-Null
}
Write-Host "  ~ battery kill-conditions cleared on all ArsenalFC-* tasks"

# SLEEP CONDITIONS (live finding, 14 Jul 2026): the 02:xx night lane had NEVER
# fired — the laptop sleeps at 2am, schtasks /Create sets no wake/catch-up.
# StartWhenAvailable = run-on-next-wake for every task; WakeToRun on the night
# lane so it can wake the machine (NOTE: works only if the power plan allows
# wake timers — powercfg RTCWAKE read 0x0 on 14 Jul; the captain's one-liner:
#   powercfg /SETACVALUEINDEX SCHEME_CURRENT SUB_SLEEP RTCWAKE 1
# Without it the lane still fires as a catch-up at first morning wake.)
Get-ScheduledTask | Where-Object { $_.TaskName -like "ArsenalFC*" } | ForEach-Object {
  $_.Settings.StartWhenAvailable = $true
  $_ | Set-ScheduledTask | Out-Null
}
foreach ($n in "Consolidate","HippoStore","NightShift","PresenceFit","Examiner","ConceptGraph") {
  $t = Get-ScheduledTask -TaskName "ArsenalFC-$n" -ErrorAction SilentlyContinue
  if ($t) { $t.Settings.WakeToRun = $true; $t | Set-ScheduledTask | Out-Null }
}
Write-Host "  ~ catch-up-on-wake set on all tasks; night lane armed to wake the machine"

# working-memory (P3-review): the resident --daemon (ArsenalFC-BrainDaemon) is the PRIMARY
# pacer; the base schedule's ArsenalFC-BrainTick (30-min) STAYS as a fallback for when the
# daemon is down. They can never double-run OR double-spend — the tick lock (:4115)
# serializes tick() cross-process (jobs_run is persisted at tick-end, so a serialized
# follower sees the claim and skips the job). So INSTALL_TASKS.ps1 stays untouched.
Write-Host "  ~ BrainDaemon is primary; BrainTick stays as a lock-coordinated fallback"

Write-Host ""
Write-Host "Done. The Kennel's heartbeat task is NOT installed yet - it ships when the Pi arrives (groundsman.mjs header: TRANSPORT)."
# LADDER E1 - every installer ENDS by showing the spine it just touched.
node "$repo\scripts\conductor.mjs" plan
node "$repo\scripts\conductor.mjs" plan evening
