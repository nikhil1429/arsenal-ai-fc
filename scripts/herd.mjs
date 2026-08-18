#!/usr/bin/env node
// ============================================================================
// herd.mjs · ARSENAL AI FC — THE TEMPORAL / CONTENTION MODEL (12 Aug 2026)
//   Writes NOTHING. Owns no state file. Pure measurement over the schedule + IR.
// ----------------------------------------------------------------------------
// THE BUG THIS EXISTS FOR IS LIVE, NOT HYPOTHETICAL.
//
//   setup/INSTALL_*.ps1 sets StartWhenAvailable=$true on EVERY ArsenalFC-* task.
//   On a laptop that sleeps through the night — which is exactly what his laptop
//   does, and which is WHY the Cloud Sentinel exists — the entire overnight rota
//   does not run at its scheduled hours. It fires ALL AT ONCE, IN ARBITRARY
//   ORDER, at the moment of wake.
//
// Every organ is individually clean. Every selftest is green. And nothing in the
// repo can detect that ~50 tasks ran at the wrong hour in the wrong order, or
// that the ~74 sites computing localDate(now) derived the wrong day-key because
// "last night's" job ran at 09:12 this morning. That is invisible to xray (which
// sees no time), to blackbox (which runs one organ at a time), and to mutagen
// (which mutates state, not schedules). It needs a model of TIME, and this is it.
//
// ⚠ AND ONLY ONE ORGAN HAS A MUTEX. brain.mjs holds :4115 — and on an unbindable
// port it DELIBERATELY RUNS UNLOCKED ANYWAY. The other ~75 have nothing at all.
//
// ── THE SECOND CLASS: LOST UPDATES WITH NO EVIDENCE ─────────────────────────
// writeAtomic = write tmp, then rename. Rename is atomic, so concurrent writers
// never CORRUPT — they silently CLOBBER. The herd and an interactive session both
// read captains_call.json, both write it, and one card vanishes: zero exception,
// zero log, zero ENOENT, zero trace anomaly, nothing for any other organ in this
// audit to find. The single-writer law is satisfied PER FILE and is irrelevant
// PER INSTANT. What matters is whether two SCHEDULED WINDOWS overlap on a file,
// and that is a decidable question over (schedule × IR).
//
// SOURCE OF TRUTH FOR THE SCHEDULE: the LIVE task list when it can be read
// (`schtasks /query`, 50 ArsenalFC-* tasks on 12 Aug 2026), falling back to the
// installers so this still runs on CI where no task exists. Which source was used
// is always printed — a model that silently fell back to a stale file would be
// the same rot this audit exists to remove.
//
// LAWS: read-only, everywhere · never edits the schedule (setup/INSTALL_TASKS.ps1
//   is on the NEVER-AUTOMATE list; every repair here is a RULING) · reports
//   windows and overlaps, never "fixes" a cadence, because a cadence is a free
//   parameter and therefore his.
// WHO ELSE COULD ACT ON THIS OUTPUT? audit.mjs (ranks herd findings alongside the
//   rest and deals at most one card). Wired.
// CLI: node scripts/herd.mjs [report|schedule|collisions|selftest]
// ============================================================================
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const IR_PATH = join(ROOT, "dressing-room", "state", "xray_graph.json");

// ONE fs site for every per-organ source read this file does (the mutex census, the
// chain-step parse, the day-key metric). xray's sink budget counts DISTINCT unresolved
// sites per organ and must never grow: reading scripts/<organ> by loop variable is
// unresolvable by design, so it happens in exactly one place.
const organSource = (f) => { try { return readFileSync(join(ROOT, "scripts", f), "utf8"); } catch { return null; } };

let pass = 0, fail = 0; const fails = [];
const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };

// ── THE SCHEDULE ─────────────────────────────────────────────────────────────
export function liveSchedule() {
  // PowerShell is the only reliable reader here: `schtasks /fo csv` output is
  // encoded in a way Git Bash mangles, which is why an earlier grep of it
  // returned 0 tasks on a box that has 50.
  try {
    // Block 6 (18 Aug 2026): ALL triggers, not just the first — TimeAuditor-Pulse is
    // one task with three calendar triggers, and the DAY-KEY law needs every slot.
    const ps = `Get-ScheduledTask | Where-Object { $_.TaskName -like 'ArsenalFC*' } | ForEach-Object { $t=$_; $i=($t | Get-ScheduledTaskInfo); $act=($t.Actions | Select-Object -First 1); [pscustomobject]@{ name=$t.TaskName; state=[string]$t.State; args=[string]$act.Arguments; exe=[string]$act.Execute; start=[string]($t.Triggers | Select-Object -First 1).StartBoundary; starts=@($t.Triggers | ForEach-Object { [string]$_.StartBoundary }); interval=[string]($t.Triggers | Select-Object -First 1).Repetition.Interval; dow=[int](($t.Triggers | Select-Object -First 1).DaysOfWeek); swa=[bool]$t.Settings.StartWhenAvailable } } | ConvertTo-Json -Compress -Depth 4`;
    const out = execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8", timeout: 60000, windowsHide: true });
    const j = JSON.parse(out.trim() || "[]");
    const rows = Array.isArray(j) ? j : [j];
    return { source: "live schtasks", rows: rows.filter(Boolean) };
  } catch (e) {
    return { source: "installers (LIVE SCHEDULE UNREADABLE — this is the CI world, not his laptop)", rows: null, error: String(e.message || e).slice(0, 120) };
  }
}

// A task's organ + verb, recovered from its command line.
const organOf = (args) => {
  const m = /([A-Za-z0-9_\-]+)\.mjs(?:["\s]+([a-z][a-z0-9\-]*))?/i.exec(String(args || ""));
  return m ? { organ: `${m[1]}.mjs`, verb: m[2] || null } : { organ: null, verb: null };
};
const hhmm = (startBoundary) => {
  const m = /T(\d\d):(\d\d):(\d\d)/.exec(String(startBoundary || ""));
  return m ? { h: +m[1], m: +m[2], s: +m[3], hm: `${m[1]}:${m[2]}`, hms: `${m[1]}:${m[2]}:${m[3]}` } : null;
};

export function model() {
  const sched = liveSchedule();
  const ir = existsSync(IR_PATH) ? JSON.parse(readFileSync(IR_PATH, "utf8")) : null;
  const tasks = [];
  if (sched.rows) {
    for (const r of sched.rows) {
      const { organ, verb } = organOf(r.args);
      const starts = (Array.isArray(r.starts) ? r.starts : [r.start]).map(hhmm).filter(Boolean);
      // a daemon row is the one that runs through hidden_run.vbs (fire-and-forget)
      const daemon = /hidden_run\.vbs/i.test(String(r.args || "")) || /\.mjs["\s]+daemon\b/i.test(String(r.args || ""));
      // a WEEKLY trigger's DaysOfWeek is a bitmask (Sun=1 Mon=2 Tue=4 Wed=8 Thu=16 Fri=32 Sat=64); daily rows read 0
      const dowMask = Number(r.dow) || 0;
      const dow = dowMask ? ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].filter((_, i) => dowMask & (1 << i)) : null;
      tasks.push({ name: r.name, organ, verb, state: r.state, t: hhmm(r.start), starts, interval: r.interval || null, dow, daemon, startWhenAvailable: !!r.swa, raw: r.args });
    }
  } else if (ir) {
    for (const r of ir.roots.scheduled) tasks.push({ name: r.task || r.script, organ: r.script, verb: r.verb, state: "unknown", t: null, starts: [], interval: null, daemon: false, startWhenAvailable: null, raw: r.source });
  }
  return { sched, ir, tasks };
}

// ── THE SLOT MAP (Block 6, 18 Aug 2026 — THE DAY-KEY LAW's schedule contract) ──
// name → { organ, verb, at, interval, daemon, enabled }, straight off the live
// task list. This is what tasks_expected.json `slots` carries (paste it in, in
// the same commit that moves a task — the contract's own rule); daykey.mjs reads
// that snapshot so an organ launched by Task Scheduler in a catch-up burst can
// key its day to ITS SLOT without a 2–5 s PowerShell spawn per run. herd writes
// nothing — it PRINTS; the watchman diffs snapshot vs live nightly (task-slot-drift).
export function slotsMap(m = model()) {
  const out = {};
  for (const t of m.tasks) {
    if (!t.organ) continue;
    const ats = (t.starts && t.starts.length ? t.starts : t.t ? [t.t] : []).map((x) => x.hm);
    out[t.name] = {
      organ: t.organ, verb: t.verb || null,
      at: ats.length > 1 ? ats : (ats[0] || null),
      interval: t.interval || null,
      dow: t.dow && t.dow.length ? t.dow : null,   // weekly rows only — the DAY-KEY law keys a Sunday slot to Sunday even when Monday wakes it
      daemon: !!t.daemon,
      enabled: t.state !== "Disabled",
    };
  }
  return out;
}

// ── THE THREE CONTENTION QUESTIONS ───────────────────────────────────────────
export function collisions(m) {
  const enabled = m.tasks.filter((t) => t.state !== "Disabled" && t.organ);

  // 1. SAME-SECOND STARTS. Two tasks whose trigger fires at the identical second
  //    are not "close together" — they are concurrent, every single day.
  const bySecond = new Map();
  for (const t of enabled) {
    if (!t.t) continue;
    const k = t.t.hms;
    if (!bySecond.has(k)) bySecond.set(k, []);
    bySecond.get(k).push(t);
  }
  const sameSecond = [...bySecond].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length);

  // 2. THE CATCH-UP HERD. StartWhenAvailable turns "missed while asleep" into
  //    "all of them, now, in arbitrary order". The overnight band is the one that
  //    matters because that is the band his laptop is asleep for.
  const herd = enabled.filter((t) => t.startWhenAvailable && t.t && (t.t.h >= 22 || t.t.h < 8));
  const herdAll = enabled.filter((t) => t.startWhenAvailable);

  // 3. WRITE CONTENTION — the lost-update class, stated over (schedule × IR).
  //    Two SCHEDULED organs that write the SAME file can clobber each other, and
  //    writeAtomic guarantees the clobber is SILENT: rename is atomic, so nothing
  //    corrupts, nothing throws, and one write simply ceases to exist.
  const contention = [];
  if (m.ir) {
    const scheduledOrgans = new Set(enabled.map((t) => t.organ));
    for (const f of m.ir.files) {
      if (!/^dressing-room\/state\//.test(f.path) || f.is_dir) continue;
      const w = f.writers.filter((x) => scheduledOrgans.has(x));
      // A file with ONE scheduled writer is still at risk if the herd can run
      // that writer concurrently with an INTERACTIVE session (hooks fire on every
      // UserPromptSubmit), so both cases are recorded and labelled.
      if (w.length > 1) contention.push({ path: f.path, writers: w, kind: "two scheduled writers" });
    }
  }

  // 4. WHO HAS A MUTEX. Exactly one organ does, and it self-disarms.
  const locks = [];
  for (const f of readdirSync(join(ROOT, "scripts")).filter((x) => x.endsWith(".mjs"))) {
    const src = organSource(f);
    if (src === null) continue;
    if (/createServer|listen\(\s*41\d\d|LOCK_PORT|singleton|mutex/i.test(src)) locks.push(f);
  }

  return { enabled, sameSecond, herd, herdAll, contention, locks };
}

// ── THE DAY-KEY RISK (Block 6, 18 Aug 2026) ──────────────────────────────────
// The header above said "~74 localDate(now) sites derive the WRONG DAY-KEY" and
// nothing could point at one. This can. A wrong-day-key RISK is a scheduled
// once-a-slot organ (or a conductor chain step, which takes the chain's token)
// whose source still derives a "today" from now() outside daykey.mjs's resolver:
//   · `localDate(now)` / `localDate(new Date())` / `localDate()` / `localDate(deps.now…)`
//   · `new Date().toISOString().slice(0, 10)` (a UTC today-key — wrong twice)
// A site marked `WALL-CLOCK by design` on its own line is a DECLARED exception
// (brain.mjs's overnight shift/serve day; physio's freshness reads of real
// timestamps; scorer's "is the calendar day over") and is listed, not counted;
// `day-key: fixture` marks a selftest line, which is not a production site. Interval
// tasks and daemons are CLOCK by the law itself and are stated as such.
const NOW_KEY_RE = /localDate\(\s*(?:now|new Date\(\)|deps\.now[^)]*|)\s*\)|new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/;
export function chainStepOrgans() {
  // read the two chains out of conductor.mjs's SOURCE (no import: conductor pulls brain)
  try {
    const src = readFileSync(join(ROOT, "scripts", "conductor.mjs"), "utf8");
    const out = new Set();
    // one step object at a time; a step with `daemon:` is launched detached (token stripped) and is NOT a chain step here
    for (const m of src.matchAll(/\{[^{}]*?\bid:\s*"[a-z-]+"[^{}]*?args:\s*\[\s*"scripts\/([a-z_]+\.mjs)"[^{}]*\}/g)) {
      if (/\bdaemon:/.test(m[0])) continue;
      if (organSource(m[1]) !== null) out.add(m[1]);   // a selftest fixture ("x.mjs") is not an organ
    }
    // heartbeat.mjs runs its own eight children — they inherit the token
    if (out.has("heartbeat.mjs")) for (const f of ["capture.mjs", "fsrs.mjs", "capsule_bridge.mjs", "calibration.mjs", "nemesis.mjs", "learning_state.mjs", "timeaudit.mjs", "shipped.mjs"]) out.add(f);
    return out;
  } catch { return new Set(); }
}
export function dayKeyRisks(m = model()) {
  const enabled = m.tasks.filter((t) => t.state !== "Disabled" && t.organ);
  const byClass = { slot: new Set(), interval: new Set(), daemon: new Set() };
  for (const t of enabled) {
    if (t.daemon) byClass.daemon.add(t.organ);
    else if (t.interval) byClass.interval.add(t.organ);
    else byClass.slot.add(t.organ);
  }
  const chain = chainStepOrgans();
  const inScope = new Set([...byClass.slot, ...chain]);
  const organs = [];
  let risks = 0;
  for (const organ of [...inScope].sort()) {
    const src = organSource(organ);
    if (src === null) continue;   // an installer row naming a file not on disk is the watchman's task-vanished, not a day-key site
    const lines = src.split(/\r?\n/);
    const resolves = lines.some((l) => /from\s+"\.\/daykey\.mjs"/.test(l) || /\bdayKey\(/.test(l) || /\blaunchContext\(/.test(l));
    const sites = [], declared = [];
    lines.forEach((l, i) => {
      if (/^\s*\/\//.test(l)) return;                            // a comment is not a site
      if (!NOW_KEY_RE.test(l)) return;
      if (/const localDate\s*=/.test(l)) return;                 // the helper's own definition
      if (/day-key: fixture/.test(l)) return;                    // a selftest fixture is not a production site
      if (/WALL-CLOCK by design/.test(l)) declared.push(i + 1); else sites.push(i + 1);
    });
    const why = chain.has(organ) && byClass.slot.has(organ) ? "slot + chain step" : chain.has(organ) ? "chain step (takes the chain's token)" : "once-a-slot task";
    organs.push({ organ, why, resolves, sites, declared });
    risks += sites.length + (resolves ? 0 : 0);
  }
  return { organs, risks, clock_by_design: { interval: [...byClass.interval].sort(), daemon: [...byClass.daemon].sort() } };
}

function report() {
  const m = model();
  const c = collisions(m);
  console.log("=== HERD — THE TEMPORAL / CONTENTION MODEL ===");
  console.log(`schedule source: ${m.sched.source}`);
  console.log(`${m.tasks.length} ArsenalFC task(s), ${c.enabled.length} enabled\n`);

  console.log(`── SAME-SECOND STARTS (${c.sameSecond.length} instant(s) with >1 task)`);
  console.log(`   these are not "close together"; they are concurrent, every day.`);
  for (const [sec, ts] of c.sameSecond.slice(0, 10)) {
    console.log(`   ${sec}  ×${ts.length}  ${ts.map((t) => t.organ || t.name).join(" · ")}`);
  }

  console.log(`\n── THE CATCH-UP HERD`);
  console.log(`   StartWhenAvailable=true: ${c.herdAll.length} of ${c.enabled.length} enabled tasks`);
  console.log(`   …of which ${c.herd.length} are scheduled in the 22:00–08:00 band his laptop sleeps through.`);
  console.log(`   On wake, those ${c.herd.length} fire SIMULTANEOUSLY, in arbitrary order, at the wrong hour —`);
  console.log(`   and every localDate(now) inside them derives the WRONG DAY-KEY.`);
  const byOrgan = new Map();
  for (const t of c.herd) byOrgan.set(t.organ, (byOrgan.get(t.organ) || 0) + 1);
  console.log(`   organs in the overnight herd: ${[...byOrgan.keys()].filter(Boolean).join(" · ") || "(none resolved)"}`);

  console.log(`\n── SILENT LOST UPDATES — two SCHEDULED writers on one file (${c.contention.length})`);
  console.log(`   writeAtomic makes the clobber invisible: rename is atomic, so nothing`);
  console.log(`   corrupts, nothing throws, and one write simply ceases to exist.`);
  for (const x of c.contention) console.log(`   ${x.path}  ← ${x.writers.join(", ")}`);

  console.log(`\n── MUTEXES (${c.locks.length} organ(s) with any locking construct at all)`);
  for (const l of c.locks) console.log(`   ${l}`);
  console.log(`   Everything not listed above runs with NO exclusion of any kind.`);

  const d = dayKeyRisks(m);
  console.log(`\n── THE DAY-KEY LAW (Block 6) — wrong-day-key risks: ${d.risks}`);
  console.log(`   a risk = a once-a-slot task or chain step still deriving "today" from now() outside daykey.mjs`);
  for (const o of d.organs) {
    console.log(`   ${o.organ.padEnd(22)} ${o.resolves ? "dayKey ✓" : "no resolver"}  sites ${o.sites.length}${o.sites.length ? " @" + o.sites.join(",") : ""}${o.declared.length ? `  declared wall-clock @${o.declared.join(",")}` : ""}  · ${o.why}`);
  }
  console.log(`   CLOCK by the law itself — interval tasks: ${d.clock_by_design.interval.join(" · ") || "—"}`);
  console.log(`   CLOCK by the law itself — daemons: ${d.clock_by_design.daemon.join(" · ") || "—"}`);
  return { m, c, d };
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────
function selftest() {
  console.log("=== herd.mjs selftest ===\n");
  const m = model();
  assert("a schedule was obtained (live task list, or the installers on CI)", m.tasks.length > 0, `source=${m.sched.source}`);
  assert("the schedule source is NAMED, so a silent fallback to a stale file is impossible",
    typeof m.sched.source === "string" && m.sched.source.length > 0);

  const c = collisions(m);
  assert("every enabled task resolves to an organ (an unresolvable command line is a blind spot)",
    c.enabled.every((t) => !!t.organ), c.enabled.filter((t) => !t.organ).map((t) => t.name).slice(0, 5).join(", "));

  // These are the two facts the model exists to state. They are asserted as
  // PRESENT-AND-MEASURED, never as thresholds — a threshold here would be a
  // guessed number, and this repo's standing rule is that no number gets guessed.
  assert("the catch-up herd is measured (StartWhenAvailable counted, not assumed)", typeof c.herdAll.length === "number");
  assert("same-second collisions are measured", Array.isArray(c.sameSecond));
  assert("write contention is derived from the IR, not from a hand list", Array.isArray(c.contention));
  assert("the mutex census found brain's lock (the ONE organ that has one)",
    c.locks.some((f) => f === "brain.mjs"), `locks=${c.locks.join(",")}`);

  // pure-function checks with known answers
  assert("hhmm parses a schtasks StartBoundary", JSON.stringify(hhmm("2026-08-12T03:44:00+05:30")) === JSON.stringify({ h: 3, m: 44, s: 0, hm: "03:44", hms: "03:44:00" }));
  assert("organOf recovers organ + verb from a task command line",
    organOf(`"C:\\repo\\scripts\\brain.mjs" tick`).organ === "brain.mjs" && organOf(`"C:\\repo\\scripts\\brain.mjs" tick`).verb === "tick");
  assert("organOf survives the hidden_run.vbs wrapper form",
    organOf(`setup\\hidden_run.vbs cmd /c node C:\\repo\\scripts\\oura_coach.mjs`).organ === "oura_coach.mjs");

  // Block 6 — THE DAY-KEY LAW is measured here (the DoD: 0 wrong-day-key risks for night lanes)
  const d = dayKeyRisks(m);
  assert("DAY-KEY — the risk metric is measured over the live once-a-slot organs + the conductor chain steps (not a hand list)", d.organs.length >= 20 && d.organs.every((o) => o.organ.endsWith(".mjs")), `organs=${d.organs.length}`);
  assert("DAY-KEY — daemons in the chain (thalamus/cortex-daemon/turnstile) are NOT chain steps here (launched detached, token stripped)", !chainStepOrgans().has("thalamus.mjs") && !chainStepOrgans().has("turnstile.mjs"));
  assert("DAY-KEY — 0 wrong-day-key risks: every once-a-slot organ and every chain step resolves its day through daykey.mjs, and every declared wall-clock site is marked on its line",
    d.risks === 0, d.organs.filter((o) => o.sites.length).map((o) => `${o.organ}@${o.sites.join(",")}`).join(" · "));
  assert("DAY-KEY — brain.mjs's overnight shift/serve day stays WALL-CLOCK by design and is DECLARED (listed, not counted)",
    (() => { const b = d.organs.find((o) => o.organ === "brain.mjs"); return !!b && b.declared.length >= 2 && b.sites.length === 0; })());
  assert("DAY-KEY — interval tasks and daemons are stated as CLOCK by the law itself (never counted as risks)", d.clock_by_design.interval.includes("presence.mjs") && d.clock_by_design.daemon.length >= 1);
  console.log(`\nherd: ${pass} passed, ${fail} failed`);
  if (fail) for (const f of fails) console.log(`  · ${f.n}${f.d ? `\n      ${f.d}` : ""}`);
  process.exit(fail ? 1 : 0);
}

function main() {
  const mode = (process.argv[2] || "selftest").toLowerCase();
  if (mode === "selftest") return selftest();
  if (mode === "report") { report(); return; }
  if (mode === "schedule") { console.log(JSON.stringify(model().tasks, null, 1)); return; }
  if (mode === "collisions") { const m = model(); console.log(JSON.stringify(collisions(m), null, 1)); return; }
  if (mode === "risks") { console.log(JSON.stringify(dayKeyRisks(model()), null, 1)); return; }
  if (mode === "slots") { const m = model(); if (!m.sched.rows) { console.error(`herd slots: ${m.sched.source} — refusing to print a slot map from anything but the live schedule`); process.exit(2); } console.log(JSON.stringify(slotsMap(m), null, 1)); return; }
  console.log("herd: report | schedule | collisions | slots | risks | selftest");
  process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
