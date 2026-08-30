#!/usr/bin/env node
// ============================================================================
// services.mjs · ARSENAL AI FC — WHO OWNS A DAEMON'S LIFE (S9 · OWNERSHIP, 28 Aug 2026)
// ----------------------------------------------------------------------------
// WHY: until this file, a dead daemon's only owner was daemon_watchdog.mjs, and
//   the watchdog was a LAUNCHER — it relaunched off "port closed", every 10
//   minutes, with no idea what the organism's state was supposed to be. Two
//   measured consequences, both in the audit:
//     · `ArsenalFC-Daemon-Watchdog` is LogonType=Interactive. No interactive
//       session ⇒ no watchdog ⇒ no restarts. THE SUPERVISOR HAD THE SAME
//       MORTALITY AS THE SUPERVISED.
//     · on 28 Aug 2026 an orientation `--help` fell through to its default pass
//       and relaunched four daemons into an organism his standing order says is
//       SWITCHED OFF (queue/2026-08-28_s9-accidental-daemon-wake.md).
//   So ownership moves to the OS, which is the only thing that outlives a logon
//   session, and the watchdog becomes a reporter (see its header).
//
// WHAT THIS FILE IS: a GENERATOR and a READER. It writes service/task definitions
//   to disk and it reports what is installed. IT INSTALLS NOTHING AND IT STARTS
//   NOTHING — S9 installs ownership, S12 turns things on, HIS word per stage. A
//   rung that leaves something running has broken the switch-off.
//
// THE JUGAD RULE (S3), APPLIED: the order says "the headless five" and "the
//   desktop two". Those are QUANTIFIERS, and this file never types them as a
//   list. Both sets are DERIVED from the `surface` column each row declares in
//   daemon_watchdog.mjs's DAEMONS table, and `selftest` REFUSES a row that
//   declares nothing. Add a seventh daemon tomorrow and it is owned or it is red.
//
// ⛔ THIS FILE MAY NEVER HOLD A CREDENTIAL. WinSW takes a username and password in
//   its XML — and a password in a definition file in a git repo is exactly the class
//   his 14-Aug privacy ruling exists to stop. So the XML this emits carries the
//   USERNAME ONLY, `install.ps1` prompts at HIS console with the OS's own credential
//   dialog, and the secret goes from his keyboard to the SCM. A session never sees it,
//   and neither does the repo. `selftest` proves no emitted file can contain a
//   password element.
//
// ⚠ CORRECTED 29 Aug 2026 — this block used to read "the headless five must run as HIS
//   account". That was a WISH stated as a MECHANISM, and the machine refused it: his
//   account is a Microsoft account signed into with a PIN, so the SCM has no password
//   to log on with and all five failed 1326 on the first start ever attempted. They now
//   run as a dedicated local account (see SERVICE_ACCOUNT) and reach his study through
//   granted paths and the <env> block, not through his identity.
//
// MODES: emit · status · selftest · help  (an unknown mode REFUSES — the S9 law)
// SOLE WRITER of setup/services/* — nothing else generates those files.
// ============================================================================

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { DAEMONS } from "./daemon_watchdog.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
const OUT = join(REPO, "setup", "services");

// ---- THE SERVICE IDENTITY (29 Aug 2026 — HIS WORD "1 kardo", option 1) -------
// WHY THIS EXISTS AT ALL, measured not guessed: on 29 Aug all five services failed to
// start with SCM error 1326 (ERROR_LOGON_FAILURE) — "unable to log on as .\nikhi with
// the currently configured password". `Get-LocalUser nikhi` reads
// PrincipalSource=MicrosoftAccount, PasswordLastSet=31-05-2020, and he signs in with a
// PIN. A service cannot log on with a PIN, and the six-year-old MSA password is not
// recoverable by anyone here. So the HEADLESS five move to a DEDICATED LOCAL account.
//
// ONE CONSTANT, THREE CONSUMERS — his standing law (a class is fixed at one code path,
// never at the three sites that show it): the XML's <username>, install.ps1's credential
// prompt, and the log-on-as-a-service grant that install.ps1 performs from that same
// credential. Change it here and all three move together.
//
// ⛔ THE DESKTOP TWO ARE NOT AFFECTED AND MUST NEVER BE. Dugout and Turnstile read his
// clipboard and paint his screen — they need HIS interactive session, so their logon
// tasks keep $env:USERNAME. `emit` derives the two sets from the DAEMONS table's
// `surface` column, so this constant can only ever reach the headless set.
export const SERVICE_ACCOUNT_NAME = "arsenal-svc";
// WinSW's <username> wants the dot form. Windows' own credential UI does NOT: measured
// 30 Aug 2026, `Get-Credential -UserName ".\arsenal-svc"` pre-fills the box, accepts a
// typed password, and returns $null on OK — no error, no dialog, nothing. The same name
// resolves perfectly through NTAccount and installs perfectly through sc.exe. So the two
// spellings are derived from ONE name rather than typed twice, and each consumer gets the
// form it actually accepts. (icacls wants neither — it gets the SID. Four tools, four
// opinions about one account, and that is the whole reason this is a constant.)
export const SERVICE_ACCOUNT = `.\\${SERVICE_ACCOUNT_NAME}`;

// HIS profile, DERIVED — the services run as someone else but `claude -p` must ride HIS
// login (see the <env> block's own comment for why this is not optional).
const HIS_HOME = homedir();

// ---- THE OWNERSHIP TABLE ----------------------------------------------------
// DAEMONS is the source of truth for the residents. The DUGOUT is not in it —
// deliberately, and the exclusion is nineteen days old: it is HIS interactive
// voice surface, it opens when he opens it and dies when he closes it, and a
// watchdog relaunching it headless would be the machine overriding his hands.
// That reasoning made it invisible to the WATCHDOG. It does not make it
// unowned: it is still a thing that should come back when he logs in, and it is
// the second of the order's "desktop two". So it is added HERE, at the ownership
// layer, with its own reason — the watchdog's exclusion is untouched (L9).
const DUGOUT = {
  name: "dugout", port: 4114, args: ["scripts/dugout.mjs"], surface: "desktop",
  why_not_a_service: "HIS voice surface — it needs a microphone and a browser, which session 0 has neither of",
  // ⚠ AND IT IS NOT AUTO-STARTED EITHER. The logon task this emits for the dugout
  // is registered DISABLED, because "it opens when he opens it" is a ruling, not
  // an oversight. What it buys him is RestartOnFailure once he HAS opened it.
  logon_start: false,
};

export function surfaces() {
  const rows = [...DAEMONS.map((d) => ({ ...d })), { ...DUGOUT }];
  return rows;
}
export const headless = () => surfaces().filter((r) => r.surface === "headless");
export const desktop = () => surfaces().filter((r) => r.surface === "desktop");

// The service id a row owns. Derived, never typed — the ArsenalFC- prefix is the
// same one every existing task uses, so `schtasks`/`sc` listings stay one family.
export const idOf = (r) => `ArsenalFC-${r.name.charAt(0).toUpperCase()}${r.name.slice(1)}`;

// ---- WinSW XML --------------------------------------------------------------
// Escaped through one function so a future arg containing & or < cannot produce
// an XML file that silently fails to parse at service-install time.
const xmlEscape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// `username` is a NAME, never a secret. WinSW resolves ".\<user>" against the
// local machine; the password is supplied interactively by install.ps1 and lands
// in the Service Control Manager, never here. See the header's ⛔ block.
export function winswXml(row, { username = SERVICE_ACCOUNT } = {}) {
  const id = idOf(row);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  GENERATED by scripts/services.mjs (S9 · OWNERSHIP, 28 Aug 2026). Do not hand-edit:
  re-run \`node scripts/services.mjs emit\` and the change lands in every row at once.

  ⛔ NO PASSWORD LIVES IN THIS FILE, EVER. setup/services/install.ps1 prompts for it
  at HIS console and hands it to the SCM. A credential in a repo file is the class
  his 14-Aug-2026 privacy ruling forbids outright.
-->
<service>
  <id>${xmlEscape(id)}</id>
  <name>${xmlEscape(id)}</name>
  <description>${xmlEscape(`Arsenal AI FC — the ${row.name} daemon${row.port != null ? ` (singleton lock :${row.port})` : " (portless resident)"}. Owned by the OS so it outlives a logon session.`)}</description>

  <executable>node</executable>
  <arguments>${xmlEscape(row.args.join(" "))}</arguments>
  <workingdirectory>${xmlEscape(REPO)}</workingdirectory>

  <!-- THE SERVICE RUNS AS SOMEBODY ELSE, BUT "claude -p" MUST RIDE HIS LOGIN.
       MEASURED 29 Aug 2026: the Max OAuth credential is a PLAIN JSON FILE at
       <his profile>\\.claude\\.credentials.json (509 bytes, rewritten at his 09:37
       /login) — "cmdkey /list" shows NO Claude entry, so it is not DPAPI-wrapped and
       not bound to his user. That is the only reason a different account can use it.
       The CLI locates it through CLAUDE_CONFIG_DIR, and falls back to HOME/USERPROFILE.
       Point all three at HIS profile or every LLM lane authenticates as nobody and the
       whole brain group is dark for a reason no log would explain.
       ⚠ MODIFY, not read: a token refresh REWRITES that file. Read-only here buys a
       working organism until the access token expires and then a silent death.
       ⚠ SAY IT PLAINLY: this grants the service account the power to act as him on
       Claude. That is inherent to running his LLM lanes headlessly, not a slip. -->
  <env name="CLAUDE_CONFIG_DIR" value="${xmlEscape(join(HIS_HOME, ".claude"))}"/>
  <env name="HOME" value="${xmlEscape(HIS_HOME)}"/>
  <env name="USERPROFILE" value="${xmlEscape(HIS_HOME)}"/>

  <!-- AND THE BINARY MUST BE FINDABLE. Every LLM organ calls bare "claude" through
       execFileSync (talk.mjs:145, brain.mjs:2351), and on this box the CLI is a
       PER-USER install at ${xmlEscape(join(HIS_HOME, ".local", "bin"))} that appears in
       NEITHER the machine PATH nor the user PATH (measured 29 Aug 2026). Without this
       line the service starts fine, runs fine, and every model call dies with a
       spawn-ENOENT that reads like a refusal rather than a missing binary. -->
  <env name="PATH" value="${xmlEscape(join(HIS_HOME, ".local", "bin"))};%PATH%"/>

  <!-- RestartOnFailure, the honest version: the OS restarts it, forever, with a
       backoff. This is what replaces the watchdog's arm. -->
  <onfailure action="restart" delay="10 sec"/>
  <onfailure action="restart" delay="30 sec"/>
  <onfailure action="restart" delay="60 sec"/>
  <resetfailure>1 hour</resetfailure>

  <!-- A LAPTOP TRUTH, said once (the rung's own words): on a machine that sleeps,
       honest 24x7 is at-logon + catch-up + restart-on-failure. "Automatic (Delayed)"
       is the closest a service gets; true always-on is a power-plan/lid decision and
       that is HIS call, on a card, never a blocker. -->
  <startmode>Automatic</startmode>
  <delayedAutoStart/>

  <serviceaccount>
    <username>${xmlEscape(username)}</username>
    <allowservicelogonright>true</allowservicelogonright>
  </serviceaccount>

  <log mode="roll-by-size">
    <sizeThreshold>10240</sizeThreshold>
    <keepFiles>4</keepFiles>
  </log>
  <logpath>${xmlEscape(join(REPO, "scripts"))}</logpath>
</service>
`;
}

// ---- The logon task for a DESKTOP row ---------------------------------------
// Not a service, and the file says why in its own body so the next reader does not
// "fix" it into one. RestartOnFailure + StartWhenAvailable are the two settings the
// audit named: the first is supervision, the second is the catch-up a sleeping
// laptop needs (a missed 07:00 runs when the lid opens, instead of being skipped).
export function logonTaskPs1(row) {
  const id = idOf(row);
  return `# GENERATED by scripts/services.mjs (S9 · OWNERSHIP, 28 Aug 2026) — do not hand-edit.
#
# ${row.name} IS A LOGON TASK AND NOT A SERVICE, ON PURPOSE:
#   ${row.why_not_a_service || "it needs HIS interactive desktop session; session 0 cannot see it"}
# Installing it as a service would SUCCEED and then do nothing, which is worse than
# failing — session-0 isolation is silent.
#
# This registers the task. It does NOT start it: S9 installs ownership, S12 turns
# things on, HIS word per stage.

$ErrorActionPreference = "Stop"
$repo = "${REPO}"
$id   = "${id}"

$action    = New-ScheduledTaskAction -Execute "wscript.exe" \`
             -Argument ("\`"$repo\\setup\\hidden_run.vbs\`" node ${row.args.join(" ").replace(/\//g, "\\")}") \`
             -WorkingDirectory $repo
$trigger   = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

# THE TWO SETTINGS THE AUDIT ASKED FOR, by name:
#   StartWhenAvailable — a laptop that was asleep at the trigger runs the task when
#                        it wakes, instead of silently skipping the day.
#   RestartOnFailure   — the supervision that used to live in the watchdog's arm.
# Battery kill-conditions are cleared here for the same reason every other installer
# in setup/ clears them (the 12-Jul scar: the whole organism queued itself off).
$settings = New-ScheduledTaskSettingsSet \`
             -StartWhenAvailable \`
             -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) \`
             -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries \`
             -ExecutionTimeLimit (New-TimeSpan -Hours 0)

Register-ScheduledTask -TaskName $id -Action $action -Trigger $trigger \`
  -Principal $principal -Settings $settings -Force | Out-Null

# ⛔ REGISTERED ${row.logon_start === false ? "AND IMMEDIATELY DISABLED" : "DISABLED"} — this is not a mistake.
# The organism is SWITCHED OFF by his order of 20 Aug 2026. S9 installs ownership;
# S12 enables, stage by stage, on his word. Enabling here would break the switch-off.
Disable-ScheduledTask -TaskName $id | Out-Null

Write-Host "  ~ $id registered as a LOGON TASK (disabled — S12 enables it on his word)"
`;
}

// ---- grant-paths.ps1 --------------------------------------------------------
// Generated from GRANT_SET so the ACLs and the probe can never drift apart: one list,
// two consumers. Run elevated, AFTER the account exists.
function grantPathsPs1() {
  const lines = GRANT_SET.map((g) => {
    // RX_SELF carries no (OI)(CI) and is emitted without /T — the folder entry itself, so
    // node can lstat an ancestor, with nothing inside it granted.
    const lvl = g.level === "M" ? "(OI)(CI)M" : g.level === "RX" ? "(OI)(CI)RX" : "(RX)";
    const recurse = g.level === "RX_SELF" ? "$false" : "$true";
    return `Grant "${g.path()}" "${lvl}" ${recurse} "${g.why.replace(/"/g, "'")}"`;
  }).join("\n");
  return `# ============================================================================
# grant-paths.ps1 — GENERATED by scripts/services.mjs. Do not hand-edit.
#
# Gives ${SERVICE_ACCOUNT} the LEAST privilege that lets the headless five actually
# run. The path list is derived (see GRANT_SET's comment in services.mjs for the
# atlas query that produced it). Run ELEVATED, after the account exists.
#
# It grants and never revokes: re-running is safe and idempotent.
# ============================================================================
$ErrorActionPreference = "Stop"
$account = "${SERVICE_ACCOUNT}"

# FAIL LOUDLY IF THE ACCOUNT IS NOT THERE. icacls will happily "succeed" against a
# name it cannot resolve in some shells, and a silent no-op here surfaces days later
# as an access-denied nobody can trace.
try { $sid = (New-Object System.Security.Principal.NTAccount($account.TrimStart('.','\\'))).Translate([System.Security.Principal.SecurityIdentifier]).Value }
catch { Write-Host "  X cannot resolve $account - create the account first. Nothing changed."; exit 1 }
Write-Host "  account : $account"
Write-Host "  sid     : $sid"

# ⚠ icacls IS GIVEN THE SID, NEVER THE NAME — measured 29 Aug 2026, on him, mid-run.
# The first version passed "\${account}" through, and \`.\\arsenal-svc\` (the same spelling
# WinSW and Get-Credential both accept) made icacls fail on EVERY path with
#     .\\arsenal-svc: No mapping between account names and security IDs was done.
# icacls does not understand the .\\ prefix, and the account resolved perfectly one line
# above — so a name that four other tools accept is still the wrong argument here. The SID
# form (*S-1-5-...) has no spelling to get wrong and no locale to translate.
$principal = "*$sid"

$bad = 0
function Grant([string]$path, [string]$level, [bool]$recurse, [string]$why) {
  if (-not (Test-Path $path)) { Write-Host "  X missing path: $path"; $script:bad++; return }
  # THE CLAIM IS READ OFF THE OUTCOME. icacls prints "Successfully processed" even for
  # partial failures, so the exit code is what is believed, not the words.
  # \$recurse is FALSE only for an ancestor we must let node lstat without opening what is
  # inside it — /T there would walk his other repositories, which is not ours to grant.
  $out = if (\$recurse) { & icacls $path /grant "\${principal}:\${level}" /T /C 2>&1 }
         else           { & icacls $path /grant "\${principal}:\${level}" 2>&1 }
  if ($LASTEXITCODE -ne 0) { Write-Host "  X FAILED $level on $path"; $out | Select-Object -Last 3 | ForEach-Object { Write-Host "      $_" }; $script:bad++ }
  else { Write-Host "  ~ $level  $path" ; Write-Host "        ($why)" }
}

Write-Host ""
Write-Host "  Granting least-privilege paths to $account"
Write-Host ""
${lines}
Write-Host ""
if ($bad -gt 0) { Write-Host "  INCOMPLETE - $bad path(s) failed. Fix and re-run; it is safe to repeat."; exit 1 }
Write-Host "  DONE - paths granted. Nothing is running. Next: install.ps1, then probe.ps1."
`;
}

// ---- grant-service-control.ps1 — THE SELF-HEALING HOLE (F-A6) ---------------
// WHY: every service XML this file emits carries <onfailure action="restart"/>, and S9's own
// header calls that "what replaces the watchdog's arm". MEASURED 30 Aug 2026, in the context
// service's own wrapper log, an hour after it started clean:
//     Thread failed unexpectedly
//     WinSW.CommandException: Failed to open the service control manager database.
//     Access is denied.
// The child exited, WinSW tried to honour its own restart clause, and the dedicated service
// account cannot open the SCM. So the arm is not weak — it is DEAD, on all five, and it fails
// with an access error rather than silently doing nothing. Ownership moved to the OS at S9;
// the ability to act did not move with it.
//
// THE FIX IS THE SMALLEST ONE THAT EXISTS: the account gets start/stop/query on ITS OWN five
// services and nothing else. Not machine-wide, not administrator, not LocalSystem.
//   RP start · WP stop · LC query-status · CC query-config · SW enumerate-dependents ·
//   LO interrogate · RC read-control
// DELIBERATELY WITHHELD: DC/SD (delete the service) · WD/WO (change its permissions or owner).
// So it may restart itself and may never rewrite its own rules — which is the same posture the
// repo root already has on disk (read-only to the daemon that runs from it).
//
// ⚠ IT APPENDS, IT NEVER REWRITES. `sc sdset` takes a WHOLE descriptor, so a hand-typed string
// is one typo away from locking every account out of a service. This reads the live descriptor,
// writes it to a dated backup file first, appends ONE ace, and refuses if the ace is already
// there. The backup file IS the revert path and its name is printed.
function grantServiceControlPs1() {
  return `# ============================================================================
# grant-service-control.ps1 — GENERATED by scripts/services.mjs. Do not hand-edit.
#
# Lets ${SERVICE_ACCOUNT} restart ITS OWN services when a child dies — the arm the
# S9 XMLs already ask for and the SCM has been refusing. Run ELEVATED.
#
# Least privilege: start/stop/query only. It may NOT delete a service and may NOT
# change a service's permissions or owner.
# Idempotent: an account already present is skipped, not doubled.
# Revert: the pre-change descriptor of every service is written to a backup file
#         whose full path is printed at the end. sc.exe sdset <name> <old> undoes it.
# ============================================================================
$ErrorActionPreference = "Stop"
$account = "${SERVICE_ACCOUNT}"
$services = @(${headless().map((r) => `"${idOf(r)}"`).join(", ")})

try { $sid = (New-Object System.Security.Principal.NTAccount("${SERVICE_ACCOUNT_NAME}")).Translate([System.Security.Principal.SecurityIdentifier]).Value }
catch { Write-Host "  X cannot resolve ${SERVICE_ACCOUNT_NAME} - create the account first. Nothing changed."; exit 1 }

# START + STOP + the three reads WinSW needs to know what it is restarting.
# No DC/SD (delete), no WD/WO (rewrite permissions) - see the generator's comment.
$ace = "(A;;CCLCSWRPWPLORC;;;" + $sid + ")"
$backup = Join-Path $env:USERPROFILE ("arsenal-service-sddl-backup.txt")

Write-Host ""
Write-Host "  Granting SELF-RESTART to $account on its own $($services.Count) service(s)"
Write-Host "  sid : $sid"
Write-Host ""

$bad = 0
$lines = @("# Arsenal AI FC - service descriptors BEFORE grant-service-control.ps1", "# revert one row with:  sc.exe sdset <name> <descriptor>")
foreach ($s in $services) {
  # READ THE LIVE ONE. Never assume the five are identical, even when they were emitted
  # together - a hand fix on one service would be silently overwritten by a stored copy.
  $old = ((sc.exe sdshow $s) -join "").Trim()
  if ($LASTEXITCODE -ne 0 -or -not $old.StartsWith("D:")) {
    Write-Host "  X $s - could not read its descriptor; skipped, nothing changed"
    $bad++; continue
  }
  $lines += ($s + " " + $old)
  if ($old -like ("*" + $sid + "*")) { Write-Host "  = $s already granted - skipped"; continue }

  # APPEND to the DACL, never rewrite it. An S: (audit) section, if present, must stay
  # AFTER the DACL, so the ace goes at the END OF D: and not at the end of the string.
  # (The first version wrote [^S]* here, which cannot work: SY, SW, SD and SU all contain
  # an S, so it could never reach a literal "S:". It fell through to the else every time
  # and was right by accident. Split on the marker, not on "anything but its first letter".)
  $sacl = ""
  $dacl = $old
  $cut  = $old.IndexOf("S:")
  if ($cut -gt 0) { $dacl = $old.Substring(0, $cut); $sacl = $old.Substring($cut) }

  # ⚠ TWO FORMS, TRIED IN ORDER, BECAUSE THE FIRST ONE WAS MEASURED TO FAIL — 30 Aug 2026.
  # sc.exe accepted the service and then answered "The specified datatype is invalid" on all
  # five, while .NET's own RawSecurityDescriptor parsed the SAME string cleanly and round-
  # tripped it byte-identical. So the descriptor is valid and sc.exe wants a different SHAPE
  # of it. The documented difference is that sdset can demand a SACL section even where
  # sdshow returned none. Rather than guess which, this TRIES and REPORTS which one worked —
  # and whichever it is becomes a measured fact instead of a belief.
  $forms = @(
    @{ name = "D: only";        sd = ($dacl + $ace + $sacl) },
    @{ name = "D: + empty S:";  sd = ($dacl + $ace + $(if ($sacl) { $sacl } else { "S:" })) }
  )
  $done = $false
  foreach ($f in $forms) {
    $out = & sc.exe sdset $s $f.sd 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Host "  . $s accepted the [$($f.name)] form"; $done = $true; break }
    Write-Host "  . $s refused the [$($f.name)] form: $(($out | Where-Object { $_ -match '\S' } | Select-Object -Last 1))"
  }
  if (-not $done) {
    Write-Host "  X $s FAILED - every form refused. Nothing changed for this service."
    $bad++; continue
  }
  # THE CLAIM IS READ OFF THE OUTCOME, never off the call - sdset has printed SUCCESS on
  # descriptors it did not fully apply. Ask the SCM what it holds now.
  $back = ((sc.exe sdshow $s) -join "").Trim()
  if ($back -like ("*" + $sid + "*")) { Write-Host "  ~ $s granted, verified by read-back" }
  else { Write-Host "  X $s - sdset returned success but the read-back does NOT carry the account"; $bad++ }
}

Set-Content -Path $backup -Value $lines -Encoding utf8
Write-Host ""
Write-Host "  revert file: $backup"
if ($bad -gt 0) { Write-Host "  INCOMPLETE - $bad service(s) failed. Safe to re-run."; exit 1 }
Write-Host "  DONE. Nothing was started or stopped."
Write-Host "  PROVE IT: kill a daemon's node child and it must come back on its own within ~15s."
`;
}

// ---- probe.ps1 — THE MANDATORY PROOF ----------------------------------------
// Ruled 29 Aug 2026: the brain daemon is not trusted until ONE headless round-trip and
// a read/write probe on every granted path have PASSED **as the service account**.
//
// ⚠ IT IS RED-FIRST WHERE IT CAN BE. A probe that only ever proves greens is worthless:
// if the harness itself were broken, every check would "pass". So two checks are
// designed to FAIL and are only green when they DO fail — a write into an ungranted
// path, and a write into the read-only repo-root grant. If either of those succeeds,
// the grants are wider than they were ruled to be, and that is a finding, not a pass.
function probePs1() {
  const probes = GRANT_SET.map((g) => {
    const p = g.path();
    return g.level === "M"
      ? `ProbeWrite "${p}" $true  "granted MODIFY - a write here MUST succeed"`
      : `ProbeWrite "${p}" $false "granted READ-ONLY${g.level === "RX_SELF" ? " (this folder only)" : ""} - a write here MUST be refused"`;
  }).join("\n");
  const reads = GRANT_SET.map((g) => `ProbeRead "${g.path()}"`).join("\n");
  return `# ============================================================================
# probe.ps1 — GENERATED by scripts/services.mjs. Do not hand-edit.
#
# THE PROOF THAT MUST PASS BEFORE THE BRAIN DAEMON IS TRUSTED (ruled 29 Aug 2026).
# Run it ELEVATED. It asks for ${SERVICE_ACCOUNT}'s password once, relaunches itself
# AS that account, and runs every check from inside that identity - because a check
# run as him proves nothing about what the service can do.
#
#     powershell -ExecutionPolicy Bypass -File "${join(OUT, "probe.ps1")}"
#
# ⚠ THE PATH IS ABSOLUTE ON PURPOSE. An elevated console always opens in
# C:\\WINDOWS\\system32, never in the repo — a relative path here is a trap that
# reports "the argument does not exist" for a file that plainly does. Measured
# 29 Aug 2026, on him, mid-rung.
# ============================================================================
param([switch]$AsAccount, [string]$Out)
$ErrorActionPreference = "Continue"
$account = "${SERVICE_ACCOUNT}"
$repo    = "${REPO}"
$cfgdir  = "${join(HIS_HOME, ".claude")}"

if (-not $AsAccount) {
  $tmp = Join-Path $env:TEMP ("arsenal_probe_" + [guid]::NewGuid().ToString("N") + ".txt")
  # ⚠ THE HAND-BACK FILE NEEDS ITS OWN GRANT — measured 30 Aug 2026, on him. The child runs
  # as the service account, and this path lives under HIS AppData\\Local\\Temp, which that
  # account cannot write to and MUST NOT be given wholesale. So the parent (already
  # elevated) creates the one file and grants modify on THAT FILE ALONE, by SID. Without
  # it the child starts, runs every check, and dies unable to report — which reads exactly
  # like "the account could not start a process" and sends the reader hunting logon rights
  # that were never the problem.
  New-Item -ItemType File -Path $tmp -Force | Out-Null
  try { $psid = (New-Object System.Security.Principal.NTAccount("${SERVICE_ACCOUNT_NAME}")).Translate([System.Security.Principal.SecurityIdentifier]).Value }
  catch { Write-Host "  X cannot resolve ${SERVICE_ACCOUNT_NAME} - create the account first."; exit 1 }
  & icacls $tmp /grant "*\${psid}:(M)" | Out-Null
  Write-Host ""
  Write-Host "  Arsenal AI FC - SERVICE ACCOUNT PROOF"
  Write-Host "  Enter \${account}'s password (the one you set when you created it)."
  Write-Host ""
  # ⚠ NOT Get-Credential — MEASURED 30 Aug 2026, on him, twice. The GUI credential dialog
  # pre-filled with a dot-form local account takes the typed password and returns \$null on
  # OK, with no error and no second chance; the caller then dies on "Cannot validate
  # argument on parameter 'Credential'". Read-Host is the same keyboard, the same
  # SecureString and the same never-written-down guarantee, minus a dialog that can lie.
  \$sec = Read-Host -AsSecureString "  \${account}'s password"
  if (-not \$sec -or \$sec.Length -eq 0) { Write-Host "  X no password entered - nothing is proven."; exit 1 }
  \$c = New-Object System.Management.Automation.PSCredential("\$env:COMPUTERNAME\\${SERVICE_ACCOUNT_NAME}", \$sec)
  $self = $MyInvocation.MyCommand.Path
  Start-Process -FilePath "powershell.exe" -Credential $c -WindowStyle Hidden -Wait \`
    -ArgumentList @("-ExecutionPolicy","Bypass","-File",$self,"-AsAccount","-Out",$tmp)
  # THE FILE EXISTING PROVES NOTHING — the parent created it. Only CONTENT proves the child
  # ran and reported. Asserting existence here would turn a dead child into a silent pass,
  # which is the exact shape this whole proof exists to refuse.
  $back = if (Test-Path $tmp) { (Get-Content $tmp -Raw) } else { $null }
  if ($back -and $back.Trim()) { $back.TrimEnd() -split "\`r?\`n" | ForEach-Object { Write-Host $_ }; Remove-Item $tmp -Force -EA SilentlyContinue }
  else { Write-Host "  X the child produced no output. Either the account could not start a process (logon right), or it could not write the hand-back file. Nothing is proven." ; exit 1 }
  return
}

$L = New-Object System.Collections.ArrayList
function Say([string]$s) { [void]$L.Add($s) }
$fail = 0
function Ok([string]$what)   { Say ("  PASS  " + $what) }
function No([string]$what)   { Say ("  FAIL  " + $what); $script:fail++ }

# ---- 1. IDENTITY. Everything below is meaningless if this is not the service account.
$me = (whoami)
if ($me -match [regex]::Escape($account.TrimStart('.','\\'))) { Ok "running as $me" }
else { No "expected \${account}, got $me - NOTHING BELOW IS TRUSTWORTHY"; Say "----"; Set-Content -Path $Out -Value $L -Encoding utf8; exit 1 }

function ProbeRead([string]$path) {
  try { $null = Get-ChildItem -Path $path -ErrorAction Stop | Select-Object -First 1; Ok "read  $path" }
  catch { No "read  $path - $($_.Exception.Message)" }
}
function ProbeWrite([string]$path, [bool]$shouldSucceed, [string]$why) {
  $f = Join-Path $path (".arsenal_probe_" + [guid]::NewGuid().ToString("N"))
  $wrote = $false
  try { Set-Content -Path $f -Value "probe" -ErrorAction Stop; $wrote = $true } catch { $wrote = $false }
  # ⚠ THE CLEANUP IS ASSERTED, NOT ASSUMED — measured 30 Aug 2026: the first version fired
  # Remove-Item with -EA SilentlyContinue and left SIX probe files behind in the repo working
  # tree, which the next "git status" picked up as untracked litter. A proof that dirties the
  # thing it is proving is a defect, and a silent cleanup is how it hides.
  if ($wrote) {
    Remove-Item $f -Force -EA SilentlyContinue
    if (Test-Path $f) { No "probe litter LEFT BEHIND at $f - a proof may not dirty the repo"; return }
  }
  if ($wrote -eq $shouldSucceed) { Ok "write $path -> $(if($wrote){'allowed'}else{'refused'})  ($why)" }
  else { No "write $path -> $(if($wrote){'ALLOWED'}else{'REFUSED'}) but expected the opposite  ($why)" }
}

# ---- 2. READS on every granted path
${reads}

# ---- 3. WRITES, each asserted against what it was GRANTED (two of these are RED-first)
${probes}

# ---- 4. THE UNGRANTED CONTROL. If this passes, the probe cannot tell green from red.
# ⚠ THE CONTROL WAS WRONG FIRST, AND THE PROBE CAUGHT ITS OWN AUTHOR — 30 Aug 2026.
# It used to write into $env:PUBLIC, which is WORLD-WRITABLE BY DESIGN on Windows, so it
# failed while the grants were perfectly correct. A control that fails for a reason that
# has nothing to do with what it controls is worse than no control: it teaches the reader
# to discount a RED. The control is now HIS PROFILE ROOT, which is both genuinely ungranted
# and the thing we actually care about — it proves the grants are SURGICAL: the account
# reaches .claude and .local\\bin INSIDE this folder and cannot touch the folder itself.
ProbeWrite "${HIS_HOME}" $false "his profile root - never granted; a write here MUST be refused, or every green above is vacuous"

# ---- 5. THE CREDENTIAL IS REACHABLE AND IS A TOKEN, not merely a file that exists
$credFile = Join-Path $cfgdir ".credentials.json"
try {
  $j = Get-Content $credFile -Raw -ErrorAction Stop | ConvertFrom-Json
  if ($j.claudeAiOauth -and $j.claudeAiOauth.accessToken) { Ok "oauth credential readable and shaped (no value printed)" }
  else { No "credential file read but carries no claudeAiOauth.accessToken" }
} catch { No "cannot read $credFile - $($_.Exception.Message)" }

# ---- 6. THE ROUND TRIP. The whole point: can this account actually spend on HIS Max plan?
$env:CLAUDE_CONFIG_DIR = $cfgdir
$env:HOME = "${HIS_HOME}"
$env:USERPROFILE = "${HIS_HOME}"
# ⚠ AND THE PATH, WHICH THIS PROBE FORGOT ON ITS FIRST RUN — 30 Aug 2026, caught live.
# The service XML prepends this directory to PATH; the probe set the other three env vars
# and not this one, so it reported "The term 'claude' is not recognized" — a RED that was
# the PROBE's defect, not the account's. A proof must mirror the environment it is
# certifying, or it certifies something that will never exist. Same list, same order.
$env:PATH = "${join(HIS_HOME, ".local", "bin")};" + $env:PATH
try {
  $r = & claude -p "Reply with exactly one word: pong" 2>&1 | Out-String
  if ($r -match "pong") { Ok "headless round-trip: claude -p answered as him" }
  else { No "claude -p did not answer 'pong'. First 200 chars: " + ($r.Trim() -replace "\\s+"," ").Substring(0,[Math]::Min(200,$r.Trim().Length)) }
} catch { No "claude -p could not run - $($_.Exception.Message)" }

Say "----"
if ($fail -eq 0) { Say "  PROOF GREEN - $($L.Count - 1) check(s), 0 failed. The brain daemon may be trusted." }
else { Say "  PROOF RED - $fail check(s) failed. DO NOT start the brain daemon." }
Set-Content -Path $Out -Value $L -Encoding utf8
`;
}

// ---- THE GRANT SET — least privilege, ONE list, TWO consumers ---------------
// DERIVED, not typed from memory. `flow_atlas.json` was queried over the five headless
// rows on 29 Aug 2026: every witnessed data edge touching brain/context/cortex/sitting/
// thalamus resolves inside the repo — 15 writes + 33 reads under dressing-room/state,
// 1 write under dressing-room/state/brain_out, 12 reads at the repo root, and ZERO paths
// outside the repo. Two runtime paths the atlas cannot see are added with their own
// reason, because the atlas maps DATA edges and a process needs more than data:
//   · scripts/  — the WinSW <logpath> for all five, plus the .log each organ rolls
//   · ~/.claude — the CLI's config dir (see the XML <env> block for the whole argument)
// ⚠ THE PRIVACY COST, SAID OUT LOUD rather than buried: `modify` on ~/.claude gives this
// account his session transcripts under projects/ and his history.jsonl, not merely the
// token. That is the price of running HIS Claude login headlessly and it was ruled with
// eyes open (29 Aug, option 1). It is NOT a slip, and a future reader may narrow it —
// but only with a measurement showing the CLI survives the narrowing.
// ⚠ read_only is REAL: the repo root grant is ReadAndExecute so a daemon cannot rewrite
// its own source or the laws. Writes are confined to the two buses.
export const GRANT_SET = [
  { path: () => join(REPO, "dressing-room"), level: "M",  why: "the state bus — 16 witnessed writes by the five (atlas)" },
  { path: () => join(REPO, "scripts"),       level: "M",  why: "the WinSW logpath and each organ's rolling .log" },
  { path: () => REPO,                        level: "RX", why: "source + node_modules + the root docs the five read (12 atlas reads); READ-ONLY on purpose" },
  { path: () => join(HIS_HOME, ".claude"),   level: "M",  why: "the CLI config dir — the OAuth file is rewritten on refresh, so read-only dies at token expiry" },
  // ⚠ FOUND BY MEASURING, 29 Aug 2026, and it would have been a silent organism-wide
  // death: every LLM organ shells out as bare `execFileSync("claude", …)` (talk.mjs:145,
  // brain.mjs:2351), and `Get-Command claude` resolves to ${join(HIS_HOME, ".local", "bin", "claude.exe")}
  // — a PER-USER install that is in NEITHER the machine PATH nor the user PATH. A
  // different account would find no `claude` at all, every LLM lane would fail, and the
  // failure would read as "the model refused", never as "the binary was not on PATH".
  // So the directory is granted here AND prepended to the service PATH in the XML.
  { path: () => join(HIS_HOME, ".local", "bin"), level: "RX", why: "the claude CLI binary itself — per-user install, absent from every machine-wide PATH" },
  // ⚠ THE ANCESTOR, AND IT IS NOT INHERITED — measured 30 Aug 2026 from the service's own
  // err.log, which is the only place it could have been found:
  //     Error: EPERM: operation not permitted, lstat 'C:\\Users\\nikhi\\GitHub'
  //       at Object.realpathSync ... at resolveMainPath ... at runMain
  // Node resolves its entry script through realpathSync, and realpathSync lstats EVERY
  // ancestor of the path. Windows' bypass-traverse-checking lets a granted deep folder be
  // OPENED without rights on its parents — which is why every probe passed — but it does
  // not permit an lstat OF the parent. So all four services started, node died before
  // executing one line, and the SCM reported a clean "Stopped".
  // SELF-ONLY on purpose: `GitHub\\` holds his OTHER repositories, and this account has no
  // business in any of them. The RX_SELF level emits no (OI)(CI) and no /T, so it grants
  // exactly the one directory entry node must stat and nothing inside it.
  { path: () => dirname(REPO), level: "RX_SELF", why: "node's realpathSync lstats every ancestor of the entry script — this folder ONLY, never its contents" },
];

// The fixed .ps1 helpers this file generates, held as DATA so `emit` and the BOM assert
// count ONE set. The assert used to carry a literal `+2`; adding two helpers turned a
// green gate red for exactly the right reason, and the fix is to delete the literal, not
// to bump it — the S3 jugad rule again: a quantifier is derived or it rots.
export const PS1_HELPERS = [
  { name: "install.ps1", body: () => installerPs1() },
  { name: "grant-logon-right.ps1", body: () => grantRightPs1() },
  { name: "grant-paths.ps1", body: () => grantPathsPs1() },
  { name: "grant-service-control.ps1", body: () => grantServiceControlPs1() },
  { name: "probe.ps1", body: () => probePs1() },
];

// ---- emit -------------------------------------------------------------------
export function emit({ write = true } = {}) {
  const raw = [];
  for (const row of headless()) raw.push({ path: join(OUT, `${idOf(row)}.xml`), body: winswXml(row) });
  for (const row of desktop()) raw.push({ path: join(OUT, `${idOf(row)}.logon.ps1`), body: logonTaskPs1(row) });
  for (const h of PS1_HELPERS) raw.push({ path: join(OUT, h.name), body: h.body() });
  raw.push({ path: join(OUT, "README.md"), body: readme() });
  // The BOM is applied HERE, in the one place every file passes through, so a new
  // .ps1 added later cannot miss it. See withBom's header for why it is mandatory.
  const files = raw.map(withBom);
  if (write) { mkdirSync(OUT, { recursive: true }); for (const f of files) writeFileSync(f.path, f.body); }
  return files;
}

// ⛔ EVERY .ps1 GETS A UTF-8 BOM, AND IT IS NOT COSMETIC — IT IS A PARSE BUG.
// Windows PowerShell 5.1 (which is what is on this box) decodes a BOM-less .ps1 as the
// system ANSI codepage, NOT as UTF-8. An em-dash is UTF-8 `E2 80 94`; read as CP1252
// that is `â` `€` `"` — and that third character is a STRAIGHT DOUBLE QUOTE, which
// terminates the enclosing PowerShell string early. Measured, not theorised: both
// generated logon tasks failed to parse with
//   line 41 col 88: Unexpected token ')' … The string is missing the terminator: "
// on a `Write-Host "… (disabled — S12 enables it …)"` line. He was one command away
// from running these elevated, and they would have died at PARSE time.
// The repo already knew this — setup/INSTALL_TASKS.ps1 carries a BOM. Matching it.
const BOM = "﻿";
const withBom = (f) => (f.path.endsWith(".ps1") && !f.body.startsWith(BOM) ? { ...f, body: BOM + f.body } : f);

function installerPs1() {
  const h = headless(), d = desktop();
  return `# ============================================================================
# install.ps1 — GENERATED by scripts/services.mjs (S9 · OWNERSHIP, 28 Aug 2026)
#
# THIS IS THE ONE THING THAT NEEDS HIS HANDS. Everything else in S9 is on disk.
# Run it from an ELEVATED PowerShell (services need admin to register):
#     powershell -ExecutionPolicy Bypass -File "${join(OUT, "install.ps1")}"
#
# ⚠ ABSOLUTE ON PURPOSE — an elevated console opens in C:\\WINDOWS\\system32, never in
# the repo, so a relative path here fails with "the argument does not exist" for a file
# that is plainly there. Measured on him, 29 Aug 2026.
#
# IT ASKS FOR ONE PASSWORD, ONCE — AND IT IS **NOT HIS**. It is the password of the
# dedicated local service account (${SERVICE_ACCOUNT}), which he creates in the same
# console visit. Windows will not let a service log on without a credential, and it
# cannot use his: his own account is a MICROSOFT account signed into with a PIN, and on
# 29 Aug 2026 all five services proved it by failing to start with SCM error 1326
# (ERROR_LOGON_FAILURE) against a six-year-old MSA password nobody has. The earlier
# version of this comment said the daemons "must run AS HIM" — that was true as a wish
# and false as a mechanism, and it cost one console visit before it was measured.
#
# LOSING THIS PASSWORD IS HARMLESS, FOREVER. It is a fresh account that owns nothing:
# no DPAPI secrets, no browser profile, no files of his. An administrator resets it in
# one step. Nothing of his is ever behind it.
#
# The password goes from his keyboard into the Service Control Manager. It is never
# written to a file, never echoed, and no Claude session ever sees it — a standing law,
# not a courtesy.
#
# ⛔ NOTHING IS STARTED. Every service is installed with start=demand and every
# task is registered disabled. S12 turns things on, stage by stage, on his word.
# ============================================================================
$ErrorActionPreference = "Stop"
$repo = "${REPO}"
$here = Join-Path $repo "setup\\services"

# WinSW is a single .exe. It is NOT vendored into the repo — it is a binary, and a
# binary in a git repo is a supply-chain question nobody asked. Point this at the
# copy he downloads, or set ARSENAL_WINSW.
# ANY WinSW*.exe IN THIS FOLDER WILL DO, and that is deliberate. Windows hides known
# extensions in Explorer, so renaming the downloaded "WinSW-x64.exe" to "WinSW.exe"
# produces "WinSW.exe.exe" on disk - which is exactly what happened here on the first
# try. Demanding one exact filename would have stopped him with a "not found" for a
# file he could plainly see. Pattern-matched instead, newest first.
$winsw = $env:ARSENAL_WINSW
if (-not $winsw) {
  $found = Get-ChildItem -Path $here -Filter "WinSW*.exe" -File -ErrorAction SilentlyContinue |
           Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($found) { $winsw = $found.FullName }
}
if (-not $winsw -or -not (Test-Path $winsw)) {
  Write-Host ""
  Write-Host "  No WinSW*.exe found in: $here"
  Write-Host "  Download the x64 release from https://github.com/winsw/winsw/releases,"
  Write-Host "  drop it in setup\\services\\ under any WinSW* name, and re-run."
  Write-Host "  (Or set ARSENAL_WINSW to its full path.)"
  Write-Host "  Nothing has been changed."
  exit 1
}
Write-Host "  using WinSW: $winsw"

Write-Host ""
Write-Host "  Arsenal AI FC - OWNERSHIP INSTALL (S9)"
Write-Host "  ${h.length} headless daemon(s) as services, ${d.length} desktop surface(s) as logon tasks."
Write-Host "  Windows will ask ONCE for the SERVICE ACCOUNT's password (${SERVICE_ACCOUNT}) - NOT yours."
Write-Host ""

# ⚠ CONSOLE PROMPT, NOT THE GUI CREDENTIAL DIALOG — measured 30 Aug 2026, twice, on him.
# That dialog, pre-filled with a dot-form local account, takes the typed password and hands
# back \$null on OK, with no error; every caller then dies on "argument is null or empty"
# nowhere near the cause. Read-Host is the same keyboard and the same SecureString, and it
# cannot silently return nothing. The selftest now BANS the dialog by name, so this cannot
# be undone by accident.
\$sec = Read-Host -AsSecureString "  ${SERVICE_ACCOUNT}'s password (NOT your own login)"
if (-not \$sec -or \$sec.Length -eq 0) { Write-Host "  X no password entered - nothing installed."; exit 1 }
$cred = New-Object System.Management.Automation.PSCredential("\$env:COMPUTERNAME\\${SERVICE_ACCOUNT_NAME}", \$sec)

# ⚠ THE PASSWORD IS PULLED OUT INTO A VARIABLE ON PURPOSE, and this is a real bug fix,
# not a style choice. Written first as \`--password $cred.GetNetworkCredential().Password\`
# INLINE in the native call. PowerShell parses native-command arguments in ARGUMENT
# MODE, where a method-call chain like .GetNetworkCredential().Password is NOT reliably
# evaluated — it can reach WinSW as literal text. The service would then install with a
# junk password and fail to start with a logon error that points at his account instead
# of at this line. Caught by re-reading the generated file before he ran it elevated.
$plainPw = $cred.GetNetworkCredential().Password

# ── COMPARING TWO WINDOWS ACCOUNT NAMES IS NOT STRING EQUALITY ────────────────
# Windows NORMALISES a local service account to the dot form. A service installed as
# "LAPTOP-XYZ\\nikhi" reads back as ".\\nikhi", and both are the SAME account.
# The first version tried to normalise the dot form into the computer-name form using a
# -replace whose replacement string was written "$env:COMPUTERNAME\\\\". PowerShell does
# not escape backslashes inside double quotes, so that produced TWO literal backslashes
# and the comparison could never match. It then printed five "wrong account" warnings on
# an install that was entirely CORRECT. A false alarm is a lie in the other direction,
# and it cost him a round trip. Compare the PARTS, never the spelling.
function Test-SameAccount([string]$a, [string]$b) {
  if (-not $a -or -not $b) { return $false }
  $ua = ($a -split '\\\\')[-1]; $ub = ($b -split '\\\\')[-1]
  if ($ua -ine $ub) { return $false }
  $ha = if ($a -match '\\\\') { ($a -split '\\\\')[0] } else { '.' }
  $hb = if ($b -match '\\\\') { ($b -split '\\\\')[0] } else { '.' }
  $local = @('.', $env:COMPUTERNAME, $env:USERDOMAIN)
  return ($ha -ieq $hb) -or (($local -contains $ha) -and ($local -contains $hb))
}

# ── LOG ON AS A SERVICE ───────────────────────────────────────────────────────
# sc.exe sets the account but does NOT grant SeServiceLogonRight; WinSW's own
# <allowservicelogonright> only applies when WinSW sets the account, which it does not
# here (the credential goes through sc.exe so it never touches a file). Without the
# right, every service installs cleanly and then fails to START - and it would surface
# at S12 as a confusing "logon failure", far from its cause. Granted here, where the
# script is already elevated, and REPORTED either way.
function Grant-ServiceLogonRight([string]$account) {
  try {
    $sid = (New-Object System.Security.Principal.NTAccount($account)).Translate([System.Security.Principal.SecurityIdentifier]).Value
    $inf = Join-Path $env:TEMP "arsenal_sec.inf"; $db = Join-Path $env:TEMP "arsenal_sec.sdb"
    secedit /export /cfg $inf /areas USER_RIGHTS | Out-Null
    $txt = Get-Content $inf
    $line = $txt | Where-Object { $_ -match '^SeServiceLogonRight' }
    if ($line -and $line -match [regex]::Escape($sid)) { Remove-Item $inf -Force -EA SilentlyContinue; return "already" }
    $new = if ($line) { "$line,*$sid" } else { "SeServiceLogonRight = *$sid" }
    $out = if ($line) { $txt -replace [regex]::Escape($line), $new } else { $txt -replace '^\\[Privilege Rights\\]', "[Privilege Rights]\`r\`n$new" }
    Set-Content -Path $inf -Value $out -Encoding Unicode
    secedit /configure /db $db /cfg $inf /areas USER_RIGHTS | Out-Null
    Remove-Item $inf, $db -Force -EA SilentlyContinue
    return "granted"
  } catch { return "FAILED: $($_.Exception.Message)" }
}
$rightState = Grant-ServiceLogonRight $cred.UserName
Write-Host "  log-on-as-a-service right: $rightState"

# ── HOW WinSW v2 ACTUALLY WORKS, learned by running it and being wrong first ──
# WinSW v2 (the current STABLE line, and what he downloaded) finds its config by its
# OWN EXECUTABLE NAME: <exe-basename>.xml sitting beside it. It does NOT accept a
# config path as an argument - that is the v3 form, and assuming it produced this on
# every one of five services:
#   FATAL - System.IO.FileNotFoundException: Unable to locate WinSW.exe.[xml|yml]
#           file within executable directory
# So the exe is COPIED ONCE PER SERVICE to <ServiceId>.exe, beside the <ServiceId>.xml
# that is already generated here. That is the documented v2 pattern, not a workaround.
# The copies are gitignored; they cost disk, and disk is the cheap resource here.
$failed = @()

${h.map((r) => `# --- ${r.name} ---
$id  = "${idOf(r)}"
$exe = Join-Path $here "$id.exe"
Copy-Item -LiteralPath $winsw -Destination $exe -Force
# v2 takes NO config argument - it reads "$id.xml" because the exe is named "$id.exe".
& $exe install 2>&1 | ForEach-Object { if ($_ -match "FATAL|Exception") { Write-Host "      winsw: $_" } }
# THE CLAIM IS READ OFF THE OUTCOME, NEVER OFF THE CALL. The previous build printed
# "installed as a SERVICE" unconditionally and said it five times while installing
# NOTHING - the exact defect this whole rung exists to remove, committed inside the
# organ that removes it. Ask the SCM instead.
$svc = Get-Service -Name $id -ErrorAction SilentlyContinue
if (-not $svc) {
  Write-Host "  X $id FAILED to install - see the winsw line(s) above"
  $failed += $id
} else {
  # The account is set through sc.exe, NOT through the XML: WinSW would take a
  # <password> element, and a password persisted in a repo file is the one thing
  # this generator refuses to do.
  sc.exe config $id obj= $cred.UserName password= $plainPw | Out-Null
  sc.exe config $id start= demand | Out-Null   # S12 flips these to auto, on his word
  $acct = (Get-CimInstance Win32_Service -Filter "Name='$id'").StartName
  if (Test-SameAccount $acct $cred.UserName) {
    Write-Host "  ~ $id installed, runs as $acct, start=demand, NOT running"
  } else {
    Write-Host "  ! $id installed but its logon account reads '$acct', not '$($cred.UserName)'"
    Write-Host "      fix once in services.msc -> $id -> Log On tab, or it will fail to start at S12"
    $failed += "$id (account)"
  }
}`).join("\n\n")}

${d.map((r) => `& powershell -ExecutionPolicy Bypass -File (Join-Path $here "${idOf(r)}.logon.ps1")`).join("\n")}

Remove-Variable cred, plainPw -ErrorAction SilentlyContinue   # neither outlives this script

Write-Host ""
if ($failed.Count -gt 0) {
  # A non-zero exit, because a summary nobody can act on is how the first version of
  # this script reported five failures as five successes.
  Write-Host "  INCOMPLETE - $($failed.Count) problem(s): $($failed -join ', ')"
  Write-Host "  Nothing is running. Re-run this file after fixing, it is safe to repeat."
  exit 1
}
Write-Host "  DONE - and NOTHING IS RUNNING. Verify:  node scripts/services.mjs status"
Write-Host "  S12 is what turns the organism back on, stage by stage, on your word."
`;
}

// ---- the one right sc.exe cannot grant, on its own, asking for nothing -------
// WHY THIS IS ITS OWN FILE AND NOT PART OF install.ps1: the grant was added to the
// installer AFTER he had already run it successfully, so on this machine it has never
// executed. Making him re-run the whole installer to pick it up would mean typing his
// password again and re-installing five services that are already correct — friction
// for a thing that needs neither a credential nor a service. This asks for NOTHING,
// changes exactly one setting, and is safe to run repeatedly.
// It is also what S12's pre-flight should call before it turns anything on.
function grantRightPs1() {
  return `# ============================================================================
# grant-logon-right.ps1 — GENERATED by scripts/services.mjs (S9 · OWNERSHIP)
#
# Grants "Log on as a service" (SeServiceLogonRight) to the account the daemons run as.
# Run ELEVATED:
#     powershell -ExecutionPolicy Bypass -File "${join(OUT, "grant-logon-right.ps1")}"
#
# WHY IT IS NEEDED: sc.exe sets a service's logon account but does NOT grant this right,
# and WinSW's own <allowservicelogonright> never applied here because the credential
# deliberately goes through sc.exe and never touches a file. Without the right, every
# service installs cleanly and then FAILS TO START — surfacing much later as a confusing
# "logon failure" nowhere near its cause.
#
# It asks for NO password and installs NOTHING. Safe to run again.
# ============================================================================
$ErrorActionPreference = "Stop"
$account = if ($args.Count -ge 1) { $args[0] } else { "$env:USERNAME" }

try { $sid = (New-Object System.Security.Principal.NTAccount($account)).Translate([System.Security.Principal.SecurityIdentifier]).Value }
catch { Write-Host "  cannot resolve account '$account': $($_.Exception.Message)"; exit 1 }

Write-Host "  account : $account"
Write-Host "  sid     : $sid"

# ── THE WRITE GOES THROUGH THE LSA API, NOT THROUGH secedit ───────────────────
# The first version edited the exported .inf and fed it back with
# \`secedit /configure\`. It ran without complaint and changed NOTHING — the read-back
# proved the right still absent, which is the only reason we know. secedit's INF
# round-trip is fragile (it silently drops a section it does not fully parse) and this
# is Windows 11 HOME, where there is no secpol.msc to fall back to either.
#
# LsaAddAccountRights is the API the policy editor itself calls. It works on Home, it
# is idempotent, and it returns a real error code instead of a shrug.
$sig = @'
using System;
using System.Runtime.InteropServices;
public static class ArsenalLsa {
  [StructLayout(LayoutKind.Sequential)]
  struct LSA_UNICODE_STRING { public ushort Length; public ushort MaximumLength; public IntPtr Buffer; }
  [StructLayout(LayoutKind.Sequential)]
  struct LSA_OBJECT_ATTRIBUTES { public int Length; public IntPtr RootDirectory; public IntPtr ObjectName; public int Attributes; public IntPtr SecurityDescriptor; public IntPtr SecurityQualityOfService; }
  [DllImport("advapi32.dll", SetLastError=true)]
  static extern uint LsaOpenPolicy(IntPtr SystemName, ref LSA_OBJECT_ATTRIBUTES oa, int access, out IntPtr handle);
  [DllImport("advapi32.dll", SetLastError=true)]
  static extern uint LsaAddAccountRights(IntPtr policy, byte[] sid, LSA_UNICODE_STRING[] rights, int count);
  [DllImport("advapi32.dll", SetLastError=true)]
  static extern uint LsaEnumerateAccountRights(IntPtr policy, byte[] sid, out IntPtr rights, out uint count);
  [DllImport("advapi32.dll")] static extern uint LsaFreeMemory(IntPtr p);
  [DllImport("advapi32.dll")] static extern uint LsaClose(IntPtr h);
  [DllImport("advapi32.dll")] static extern int LsaNtStatusToWinError(uint status);
  public static int Grant(byte[] sid, string right) {
    var oa = new LSA_OBJECT_ATTRIBUTES(); oa.Length = Marshal.SizeOf(oa);
    IntPtr h;
    uint st = LsaOpenPolicy(IntPtr.Zero, ref oa, 0x10 | 0x20 | 0x00000800, out h);
    if (st != 0) return LsaNtStatusToWinError(st);
    var r = new LSA_UNICODE_STRING[1];
    r[0].Buffer = Marshal.StringToHGlobalUni(right);
    r[0].Length = (ushort)(right.Length * 2);
    r[0].MaximumLength = (ushort)((right.Length + 1) * 2);
    st = LsaAddAccountRights(h, sid, r, 1);
    LsaClose(h);
    Marshal.FreeHGlobal(r[0].Buffer);
    return LsaNtStatusToWinError(st);
  }
  // THE READ, through the SAME API as the write. secedit's export was the first
  // verifier and it disagreed with a write that had returned SUCCESS — so it was
  // measuring something other than live LSA. Two mechanisms that disagree is one
  // mechanism too many; this reads back from where the write landed.
  public static string[] Rights(byte[] sid, out int err) {
    err = 0; var oa = new LSA_OBJECT_ATTRIBUTES(); oa.Length = Marshal.SizeOf(oa); IntPtr h;
    uint st = LsaOpenPolicy(IntPtr.Zero, ref oa, 0x20 | 0x00000800, out h);
    if (st != 0) { err = LsaNtStatusToWinError(st); return new string[0]; }
    IntPtr buf; uint cnt;
    st = LsaEnumerateAccountRights(h, sid, out buf, out cnt);
    if (st != 0) { err = LsaNtStatusToWinError(st); LsaClose(h); return new string[0]; }
    var list = new System.Collections.Generic.List<string>();
    int sz = Marshal.SizeOf(typeof(LSA_UNICODE_STRING));
    for (int i = 0; i < cnt; i++) {
      var u = (LSA_UNICODE_STRING)Marshal.PtrToStructure(new IntPtr(buf.ToInt64() + i * sz), typeof(LSA_UNICODE_STRING));
      list.Add(Marshal.PtrToStringUni(u.Buffer, u.Length / 2));
    }
    LsaFreeMemory(buf); LsaClose(h);
    return list.ToArray();
  }
}
'@
try { Add-Type -TypeDefinition $sig -ErrorAction Stop } catch { }
$sidObj = New-Object System.Security.Principal.SecurityIdentifier($sid)
$bytes  = New-Object byte[] ($sidObj.BinaryLength)
$sidObj.GetBinaryForm($bytes, 0)

# READ FIRST — through the same API the write uses. Error 5 here means this window is
# not elevated (the read needs rights too), and that is reported as UNKNOWN, never as
# "not granted": a permission failure is not a measurement.
$e = 0
$before = [ArsenalLsa]::Rights($bytes, [ref]$e)
if ($e -eq 5) {
  Write-Host "  RESULT  : CANNOT READ — this window is not ELEVATED (access denied)."
  Write-Host "            Re-run from an Administrator PowerShell. Nothing was changed."
  exit 1
}
if ($e -ne 0) { Write-Host "  note    : reading rights returned Win32 error $e" }
Write-Host "  before  : $(if ($before.Count) { $before -join ', ' } else { '(none)' })"

if ($before -contains "SeServiceLogonRight") {
  Write-Host "  RESULT  : ALREADY GRANTED — nothing to do."
  exit 0
}

$rc = [ArsenalLsa]::Grant($bytes, "SeServiceLogonRight")
# PRINTED ALWAYS, not only on failure. The previous build printed this only when it was
# non-zero, so a SUCCESSFUL grant that a broken verifier then called a failure looked
# like silence — and silence is where a wrong diagnosis hides.
Write-Host "  grant rc: $rc$(if ($rc -eq 0) { ' (success)' } else { ' (Win32 error)' })"

# READ IT BACK. A claim is read off the outcome, never off the call — the law this
# whole rung exists to enforce, and the one I broke three times building it.
$e2 = 0
$after = [ArsenalLsa]::Rights($bytes, [ref]$e2)
Write-Host "  after   : $(if ($after.Count) { $after -join ', ' } else { '(none)' })"

if ($after -contains "SeServiceLogonRight") {
  Write-Host "  RESULT  : GRANTED — read back from live LSA, not inferred from the call."
  exit 0
}
Write-Host "  RESULT  : FAILED — the grant returned $rc and the right is still absent."
Write-Host "            (secpol.msc does NOT exist on Windows Home, so that is not the fallback.)"
Write-Host "            Report the whole block above; S12 must not turn anything on until this reads GRANTED."
exit 1
`;
}

function readme() {
  return `# setup/services — WHO OWNS A DAEMON'S LIFE (S9 · OWNERSHIP, 28 Aug 2026)

**Every file in this folder is GENERATED.** Do not hand-edit them; edit the \`surface\`
column in \`DAEMONS\` (scripts/daemon_watchdog.mjs) or \`scripts/services.mjs\`, then:

\`\`\`
node scripts/services.mjs emit
\`\`\`

## Why this exists

The watchdog used to be the only thing that restarted a dead daemon, and it was
\`LogonType=Interactive\` — so **no logged-in session meant no supervisor at all**.
It also relaunched purely off "port closed", which on 28 Aug 2026 meant an
orientation \`--help\` woke four daemons inside a switched-off organism.

Ownership now belongs to the OS. The watchdog reports; it does not launch.

## The two classes, and why the split is not negotiable

| class | who | how | why not the other way |
|---|---|---|---|
| headless | ${headless().map((r) => r.name).join(" · ")} | WinSW **service**, restart-on-failure, delayed auto-start | — |
| desktop | ${desktop().map((r) => r.name).join(" · ")} | **logon task**, RestartOnFailure + StartWhenAvailable | session 0 has no clipboard, no mic, no browser — a service would install fine and do nothing |

## Install

\`powershell -ExecutionPolicy Bypass -File setup\\services\\install.ps1\` (elevated).
It asks for your Windows password once, for the services. **It goes to Windows, not
to a file** — no credential is ever written here, and no session sees it.

**Nothing starts.** Services install \`start=demand\`, tasks register disabled.
S12 turns the organism back on, stage by stage, on your word.
`;
}

// ---- status: what is actually installed, read-only --------------------------
// It SHELLS OUT to sc.exe/schtasks and it never changes anything. A row that is
// not installed is not an error here — S9 emits, HE installs, and the gap between
// those two is exactly what this is for.
export function status(deps = {}) {
  // stderr is PIPED, not inherited: `sc.exe query` on an absent service writes
  // "The system cannot find the file specified." to stderr, and an absent service
  // is the NORMAL state before he installs. Letting it through would print an
  // ERROR line during a healthy read — a false alarm in the one surface that is
  // supposed to tell him whether anything is wrong.
  const sh = deps.exec || ((exe, args) => { try { return execFileSync(exe, args, { encoding: "utf8", timeout: 15000, stdio: ["ignore", "pipe", "pipe"] }); } catch (e) { return String((e && e.stdout) || ""); } });
  const rows = [];
  for (const r of headless()) {
    const out = sh("sc.exe", ["query", idOf(r)]);
    rows.push({ name: r.name, kind: "service", installed: /SERVICE_NAME/i.test(out), running: /RUNNING/i.test(out) });
  }
  for (const r of desktop()) {
    const out = sh("schtasks", ["/Query", "/TN", idOf(r)]);
    rows.push({ name: r.name, kind: "logon task", installed: /\S/.test(out) && !/ERROR/i.test(out), running: /Running/i.test(out) });
  }
  return rows;
}

// ⚠ SAY WHAT WAS MEASURED, NOT WHAT IT IMPLIES (§9-D SHAPE 7 — a predicate
// assuming a material shape). `running` here is "the OS-owned SERVICE or TASK is
// running". It is NOT "the daemon is running": a daemon started by hand, by the
// old VBS lane, or by a watchdog relaunch is a BARE NODE PROCESS that no `sc
// query` can see. On the day this was written four such processes were alive
// while every service was uninstalled — so the tempting sentence, "nothing
// running", would have been a false all-clear on exactly the question the
// switch-off cares about. The line now scopes its own claim and points at the
// instrument that CAN answer the other half.
export function statusLine(rows) {
  const miss = rows.filter((r) => !r.installed).map((r) => r.name);
  const run = rows.filter((r) => r.running).map((r) => r.name);
  return `services: ${rows.length - miss.length}/${rows.length} owned by the OS`
    + (miss.length ? ` · NOT INSTALLED: ${miss.join(", ")} (run setup/services/install.ps1 — his hands, one visit)` : "")
    + (run.length
      ? ` · ⚠ RUNNING as an OS unit: ${run.join(", ")} — the organism is supposed to be OFF until S12`
      : " · no OS unit running (this says NOTHING about bare node processes — `node scripts/daemon_watchdog.mjs status` reads those)");
}

// ---- CLI --------------------------------------------------------------------
// ONE SOURCE FOR THE MODES. Written first as a `MODES` array beside a separate
// `usage()` string — two lists of the same thing, which is exactly what THE JUGAD
// RULE (S3) is for, and the law pack caught it on the same run that shipped it.
// The valid set and the help text are now the same object: a mode cannot exist
// without a line explaining it, and a line cannot describe a mode that is refused.
const MODE_DOC = {
  emit: "(re)generate setup/services/* from the surface column each daemon declares",
  status: "what the OS actually owns right now — read-only, changes nothing",
  selftest: "the organ's own proofs",
  help: "this",
};
const MODES = Object.keys(MODE_DOC);
const usage = () => [
  "services — who owns a daemon's life (S9 · OWNERSHIP). It GENERATES and REPORTS. It never installs, never starts.",
  "",
  ...MODES.map((m) => `  node scripts/services.mjs ${m.padEnd(9)} # ${MODE_DOC[m]}`),
  "",
  "Install is HIS: powershell -ExecutionPolicy Bypass -File setup\\services\\install.ps1 (elevated, asks his password once).",
].join("\n");

async function main() {
  const mode = process.argv[2] || "status";
  if (!MODES.includes(mode)) { console.error(`services: unknown mode "${mode}" — REFUSING.\n\n${usage()}`); process.exit(2); }
  if (mode === "help") { console.log(usage()); return; }
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "emit") {
    const files = emit();
    console.log(`services: emitted ${files.length} file(s) into setup/services/ — ${headless().length} service(s), ${desktop().length} logon task(s). NOTHING installed, NOTHING started.`);
    for (const f of files) console.log(`  ~ ${f.path.replace(REPO + "\\", "").replace(REPO + "/", "")}`);
    return;
  }
  console.log(statusLine(status()));
}

// ---- SELFTEST ---------------------------------------------------------------
async function selftest() {
  let pass = 0, fail = 0;
  const assert = (what, cond) => { if (cond) { pass++; console.log(`  ✓ ${what}`); } else { fail++; console.log(`  ✗ ${what}`); } };
  console.log("== services selftest ==\n");

  // DECLARE-OR-DIE — the S7 ratchet shape. A daemon with no `surface` is not
  // "defaulted" into a class; it is REFUSED, because guessing wrong here means
  // either a service that silently does nothing or a surface with no owner.
  assert("DECLARE-OR-DIE — every DAEMONS row declares a surface, and it is one of the two known classes",
    DAEMONS.length > 0 && DAEMONS.every((d) => d.surface === "headless" || d.surface === "desktop"));

  // THE JUGAD RULE (S3): the quantifiers are DERIVED. This asserts the counts the
  // order names — five and two — WITHOUT either file containing that list, so a
  // seventh daemon added tomorrow makes this red instead of quietly unowned.
  assert("THE JUGAD RULE — 'the headless five' and 'the desktop two' are derived from the surface column, never typed as a list",
    headless().length === 5 && desktop().length === 2
    && desktop().map((r) => r.name).sort().join(",") === "dugout,turnstile");

  const emitted = emit({ write: false });

  // EVERY SOURCE-TRUTH CHECK BELOW RUNS OVER CODE, NEVER OVER COMMENTS — and this
  // helper exists because the same trap bit THREE times in one rung: the comment that
  // explains a defect necessarily QUOTES the defect, and a naive scan then reads the
  // warning as the crime. Strip `#` (PowerShell) and `<!-- -->` (XML) first, once,
  // in one place, so the next assertion cannot re-learn this.
  const codeOf = (f) => (f.path.endsWith(".xml")
    ? f.body.replace(/<!--[\s\S]*?-->/g, "")
    : f.body.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n"));

  // ⛔ THE CREDENTIAL LAW. The single most important assertion in this file.
  assert("NO CREDENTIAL, ANYWHERE — no emitted file contains a password element or an assigned password literal",
    emitted.every((f) => !/<password>/i.test(codeOf(f)))
    && emitted.filter((f) => f.path.endsWith(".xml")).every((f) => /<username>/.test(f.body)));

  // The install prompts; it does not embed. Proven off the installer's own text.
  const inst = emitted.find((f) => f.path.endsWith("install.ps1"));
  // ⚠ TIGHTENED 30 Aug 2026, and the old form is now BANNED rather than required. This
  // assert used to demand `Get-Credential`. Measured twice on his box: the GUI credential
  // dialog, pre-filled with a dot-form local account, accepts a typed password and returns
  // $null on OK — no error, no retry, and the caller dies far from the cause. A prompt that
  // can silently return nothing is not a prompt. Read-Host -AsSecureString is the same
  // keyboard and the same SecureString, and it cannot lie. The rule gets STRICTER: the
  // secret must come from the console prompt, the GUI form may not appear at all, and both
  // variables still die with the script.
  assert("THE CREDENTIAL COMES FROM HIS KEYBOARD — console prompt only (the GUI dialog is BANNED: measured to return $null on OK), and BOTH variables are dropped afterwards",
    !!inst && /Read-Host -AsSecureString/.test(inst.body) && !/Get-Credential/.test(inst.body)
    && /Remove-Variable cred, plainPw/.test(inst.body));

  // ARGUMENT-MODE BUG, pinned so it cannot come back. PowerShell does not reliably
  // evaluate a method-call chain in a native command's arguments, so the password
  // must be a plain variable by the time it reaches WinSW — never `.GetNetworkCredential()`
  // inline. This shipped wrong once and was caught by re-reading the generated file.
  const instCode = !inst ? "" : codeOf(inst);
  // The password reaches sc.exe as a RESOLVED VARIABLE. A method-call chain in a
  // native command's arguments is parsed in argument mode and is not reliably
  // evaluated — it would reach the SCM as literal text, and the service would then
  // fail to start with a logon error pointing at HIS account instead of at this line.
  assert("NO METHOD-CALL CHAIN IN A NATIVE ARGUMENT — the password reaches the SCM as a resolved variable, never as an inline .GetNetworkCredential() expression",
    /password= \$plainPw/.test(instCode)
    && /^\$plainPw = \$cred\.GetNetworkCredential\(\)\.Password$/m.test(instCode)
    && !/(--password|password=) \$cred\.GetNetworkCredential/.test(instCode));

  // ⛔ THE SWITCH-OFF. A rung that leaves something running has broken it, and the
  // generated files are where that would happen silently.
  assert("THE SWITCH-OFF HOLDS — every service installs start=demand, every logon task registers DISABLED, and the installer starts nothing",
    !!inst && /start= demand/.test(inst.body) && !/sc\.exe start/i.test(inst.body) && !/Start-ScheduledTask/.test(inst.body)
    && emitted.filter((f) => f.path.endsWith(".logon.ps1")).every((f) => /Disable-ScheduledTask/.test(f.body)));

  // Session-0 isolation is the REASON, and the reason has to survive in the file a
  // future session will read, or it gets "fixed" into a service.
  assert("SESSION-0 IS WRITTEN DOWN — each desktop task's own file says why it can never be a service",
    emitted.filter((f) => f.path.endsWith(".logon.ps1")).every((f) => /session 0/i.test(f.body))
    && emitted.filter((f) => f.path.endsWith(".logon.ps1")).length === 2);

  // ⛔ THE BOM. This is the assertion that stops a generated script from dying at PARSE
  // time on his elevated console. Both logon tasks shipped BOM-less once and BOTH failed
  // to parse — an em-dash read as CP1252 ends with a straight quote that closes the
  // string early. Asserted on EVERY .ps1, so a new one cannot be added without it.
  // The COUNT is derived (one logon task per desktop row, plus install + grant), not a
  // literal: it was written as `=== 3` and broke the moment a fourth .ps1 was added —
  // a magic number in a test is the same disease as a magic number in an organ.
  const ps1 = emitted.filter((f) => f.path.endsWith(".ps1"));
  assert("EVERY GENERATED .ps1 CARRIES A UTF-8 BOM — without it Windows PowerShell 5.1 reads it as ANSI and a single em-dash breaks the parse",
    ps1.length === desktop().length + PS1_HELPERS.length
    && ps1.every((f) => f.body.charCodeAt(0) === 0xFEFF)
    && emitted.filter((f) => !f.path.endsWith(".ps1")).every((f) => f.body.charCodeAt(0) !== 0xFEFF));

  // WinSW IS NEVER VENDORED, and the installer must not demand one exact filename.
  // Both halves were learned the hard way in one minute: the downloaded binary landed
  // as `WinSW.exe.exe` (Explorer hides known extensions), and a `git add setup/services`
  // swept the 18 MB exe into a commit that was caught before it reached the public remote.
  assert("WinSW IS RESOLVED BY PATTERN, NEVER BY ONE EXACT NAME — a WinSW.exe.exe from a hidden-extension rename still installs",
    !!inst && /Filter "WinSW\*\.exe"/.test(inst.body) && !/Join-Path \$here "WinSW\.exe"/.test(inst.body));

  // ⛔ THE CLAIM IS READ OFF THE OUTCOME. This is the assertion I owe him.
  // The first shipped installer printed "installed as a SERVICE" unconditionally,
  // once per row, and said it FIVE TIMES on a run that installed NOTHING — WinSW v2
  // had thrown FileNotFoundException on every call. That is the 11-Aug "dispatch is
  // not the outcome" law broken inside the very rung whose subject is that law.
  // A success line may now only appear inside a branch that asked the SCM first.
  assert("A SUCCESS LINE IS GATED ON A REAL READING — the installer asks Get-Service/StartName before it claims anything, and exits non-zero when any row failed",
    /Get-Service -Name \$id/.test(instCode)
    && /if \(-not \$svc\)/.test(instCode)
    && /Win32_Service -Filter/.test(instCode)
    && /\$failed \+= \$id/.test(instCode)
    && /exit 1/.test(instCode)
    // …and the success sentence lives INSIDE the else-branch, never at statement level.
    && /\} else \{[\s\S]*?installed, runs as \$acct/.test(instCode));

  // WinSW v2 IS THE STABLE LINE AND IT TAKES NO CONFIG ARGUMENT. Pinned because the
  // v3 form (`install <config.xml>`) parses fine, runs fine, and fails at RUNTIME with
  // a stack trace that names a file nobody wrote — the most expensive kind of wrong.
  assert("WinSW v2's REAL CONTRACT — the exe is copied per service so it finds <id>.xml by its own name; no config path is ever passed as an argument",
    !!inst && /Copy-Item -LiteralPath \$winsw -Destination \$exe/.test(inst.body)
    && /& \$exe install/.test(inst.body)
    && !/\$winsw install \(Join-Path/.test(inst.body));

  // The two settings the audit named, by name, on every desktop row.
  assert("THE AUDIT'S TWO SETTINGS — RestartOnFailure and StartWhenAvailable are on every logon task",
    emitted.filter((f) => f.path.endsWith(".logon.ps1")).every((f) => /-StartWhenAvailable/.test(f.body) && /-RestartCount 3/.test(f.body)));

  // Restart-on-failure is the whole point of moving off the watchdog's arm.
  assert("THE ARM IS REPLACED — every service XML carries onfailure=restart with a backoff, which is what the watchdog used to do badly",
    emitted.filter((f) => f.path.endsWith(".xml")).every((f) => (f.body.match(/<onfailure action="restart"/g) || []).length === 3));

  // The args must be what actually launches these organs, or the service starts a
  // ghost. Source truth against the manual restart verb, the same check
  // daemon_watchdog's selftest makes against START_DAEMONS.vbs.
  const vbs = readFileSync(join(REPO, "setup", "START_DAEMONS.vbs"), "utf8");
  assert("SOURCE TRUTH — every headless service launches EXACTLY the command the real logon lane launches",
    headless().every((r) => vbs.includes(r.args.join(" ").replace(/\//g, "\\"))));

  // status must never be able to change anything.
  const calls = [];
  status({ exec: (exe, args) => { calls.push(`${exe} ${args.join(" ")}`); return ""; } });
  assert("STATUS IS READ-ONLY — it only ever queries; no start, stop, config or delete verb reaches a shell",
    calls.length === surfaces().length
    && calls.every((c) => /^sc\.exe query |^schtasks \/Query /.test(c)));

  // The line has to be loud about the one thing that would mean the switch-off broke.
  assert("THE LINE SHOUTS IF ANYTHING IS RUNNING — a running row is flagged against the switch-off, not reported as health",
    /⚠ RUNNING as an OS unit: brain/.test(statusLine([{ name: "brain", kind: "service", installed: true, running: true }])));

  // SHAPE 7 — the quiet line must not overclaim. It measured OS units; a bare node
  // process is invisible to it, and on the day this was written four of those were
  // alive. A line that said "nothing running" would have been false.
  assert("SHAPE 7 — the all-quiet line scopes its claim to OS units and names the instrument that reads bare processes",
    /no OS unit running/.test(statusLine([{ name: "brain", kind: "service", installed: true, running: false }]))
    && /daemon_watchdog\.mjs status/.test(statusLine([{ name: "brain", kind: "service", installed: true, running: false }]))
    && !/nothing running/.test(statusLine([{ name: "brain", kind: "service", installed: true, running: false }])));

  console.log(`\nservices selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
