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
// ⛔ THIS FILE MAY NEVER HOLD A CREDENTIAL. The headless five must run as HIS
//   account (they read his state, his tokens, his study). WinSW takes a username
//   and password in its XML — and a password in a definition file in a git repo
//   is exactly the class his 14-Aug privacy ruling exists to stop. So the XML
//   this emits carries the USERNAME ONLY, `install.ps1` prompts HIM at HIS console
//   with the OS's own credential dialog, and the secret goes from his keyboard to
//   the SCM. A session never sees it, and neither does the repo. `selftest` proves
//   no emitted file can contain a password element.
//
// MODES: emit · status · selftest · help  (an unknown mode REFUSES — the S9 law)
// SOLE WRITER of setup/services/* — nothing else generates those files.
// ============================================================================

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { DAEMONS } from "./daemon_watchdog.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
const OUT = join(REPO, "setup", "services");

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
export function winswXml(row, { username = ".\\%USERNAME%" } = {}) {
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

// ---- emit -------------------------------------------------------------------
export function emit({ write = true } = {}) {
  const files = [];
  for (const row of headless()) files.push({ path: join(OUT, `${idOf(row)}.xml`), body: winswXml(row) });
  for (const row of desktop()) files.push({ path: join(OUT, `${idOf(row)}.logon.ps1`), body: logonTaskPs1(row) });
  files.push({ path: join(OUT, "install.ps1"), body: installerPs1() });
  files.push({ path: join(OUT, "README.md"), body: readme() });
  if (write) { mkdirSync(OUT, { recursive: true }); for (const f of files) writeFileSync(f.path, f.body); }
  return files;
}

function installerPs1() {
  const h = headless(), d = desktop();
  return `# ============================================================================
# install.ps1 — GENERATED by scripts/services.mjs (S9 · OWNERSHIP, 28 Aug 2026)
#
# THIS IS THE ONE THING THAT NEEDS HIS HANDS. Everything else in S9 is on disk.
# Run it from an ELEVATED PowerShell (services need admin to register):
#     powershell -ExecutionPolicy Bypass -File setup\\services\\install.ps1
#
# IT WILL ASK FOR HIS WINDOWS PASSWORD, ONCE. That is not avoidable and it is not
# a smell: the headless daemons must run AS HIM (they read his state, his tokens,
# his study), and Windows will not let a service log on as a user without the
# user's own credential. The password goes from his keyboard into the Service
# Control Manager. It is never written to a file, never echoed, and no Claude
# session ever sees it — that is a standing law, not a courtesy.
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
$winsw = $env:ARSENAL_WINSW
if (-not $winsw) { $winsw = Join-Path $here "WinSW.exe" }
if (-not (Test-Path $winsw)) {
  Write-Host ""
  Write-Host "  WinSW.exe not found at: $winsw"
  Write-Host "  Download the x64 release from https://github.com/winsw/winsw/releases,"
  Write-Host "  drop it in setup\\services\\, and re-run. (Or set ARSENAL_WINSW to its path.)"
  Write-Host "  Nothing has been changed."
  exit 1
}

Write-Host ""
Write-Host "  Arsenal AI FC - OWNERSHIP INSTALL (S9)"
Write-Host "  ${h.length} headless daemon(s) as services, ${d.length} desktop surface(s) as logon tasks."
Write-Host "  Windows will ask for your password once, for the services only."
Write-Host ""

$cred = Get-Credential -UserName "$env:USERDOMAIN\\$env:USERNAME" \`
        -Message "Arsenal AI FC: the account the daemons run as. This goes straight to Windows - it is not stored anywhere."

${h.map((r) => `# --- ${r.name} ---
& $winsw install (Join-Path $here "${idOf(r)}.xml") --username $cred.UserName --password $cred.GetNetworkCredential().Password
& $winsw stop    (Join-Path $here "${idOf(r)}.xml")  2>$null   # belt: install must never leave it running
sc.exe config "${idOf(r)}" start= demand | Out-Null            # S12 flips these to auto, on his word
Write-Host "  ~ ${idOf(r)} installed as a SERVICE (start=demand, not running)"`).join("\n")}

${d.map((r) => `& powershell -ExecutionPolicy Bypass -File (Join-Path $here "${idOf(r)}.logon.ps1")`).join("\n")}

Remove-Variable cred -ErrorAction SilentlyContinue   # it does not outlive this script

Write-Host ""
Write-Host "  DONE - and NOTHING IS RUNNING. Verify:  node scripts/services.mjs status"
Write-Host "  S12 is what turns the organism back on, stage by stage, on your word."
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

  // ⛔ THE CREDENTIAL LAW. The single most important assertion in this file.
  const emitted = emit({ write: false });
  assert("NO CREDENTIAL, ANYWHERE — no emitted file contains a <password> element or an assigned password literal",
    emitted.every((f) => !/<password>/i.test(f.body))
    && emitted.filter((f) => f.path.endsWith(".xml")).every((f) => /<username>/.test(f.body)));

  // The install prompts; it does not embed. Proven off the installer's own text.
  const inst = emitted.find((f) => f.path.endsWith("install.ps1"));
  assert("THE CREDENTIAL COMES FROM HIS KEYBOARD — the installer uses Get-Credential and drops the variable afterwards",
    !!inst && /Get-Credential/.test(inst.body) && /Remove-Variable cred/.test(inst.body));

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
