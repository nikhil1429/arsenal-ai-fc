// ============================================================================
// scripts/conductor.mjs — THE MORNING CONDUCTOR
//
// WHY: the morning was 15 separate Windows alarms staggered 5 minutes apart, and
//      that stagger WAS the pipeline order — Goalkeeper 08:30 writes readiness.json,
//      the sheet at 08:45 reads it. Nothing encoded the dependency; only the clock did.
//      Windows fires ONE collapsed catch-up on wake, never the N missed occurrences,
//      so the moment the laptop slept through the morning the entire order evaporated:
//      observed 1 Aug 2026 — 15 tasks in a single 10:03:09 burst, Goalkeeper writing
//      readiness at 10:03:14 while the sheet had already been generated at 09:58:33
//      off a FOUR-DAY-OLD body read. Stale readiness nulled the timing feature, the
//      timing feature's own house phrase ("one clean 90-min block") then failed the
//      no-invented-numbers validator on the digit the wrapper itself had injected, the
//      sheet fell back to the skeleton, and the fallback source silenced the morning
//      push. One overslept morning, five downstream failures, zero alarms.
//
// WHAT: one task, one ordered chain, run to completion in sequence. A late start now
//       produces a LATE day, not a BROKEN one — which is the only property that
//       actually matters on a laptop that sleeps.
//
// LAWS:
//   - ORDER IS THE PRODUCT. Sequential, never parallel. The whole point is the order.
//   - A STEP'S FAILURE IS NOT THE CHAIN'S FAILURE. One dead organ must not cost him the
//     other fourteen. Every step is isolated, timed out, and recorded.
//   - THE SHEET RUNS LAST AND ONLY BEHIND ITS INPUTS. `signals` arms the trigger the
//     sheet job waits on, so a sheet can never again be built on inputs that had not
//     been computed yet — not even in a catch-up burst where everything fires at once.
//   - IDEMPOTENT. Safe to run twice; every organ it calls already recomputes in place.
//   - SILENT SUCCESS IS STILL A LIE. Every run writes conductor.json — what ran, what
//     failed, how long, in what order — because "it returned 0" was exactly the signal
//     that hid this for two weeks (Windows reports 0 for a script that failed inside).
// ============================================================================
import { spawnSync, spawn } from "node:child_process";
import net from "node:net";
import { writeFileSync, renameSync, readFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
const STATE_DIR = join(REPO, "dressing-room", "state");
const REPORT = join(STATE_DIR, "conductor.json");

// ---- THE CHAIN — the morning, in dependency order ---------------------------
// `at` is the wall-clock time the replaced task used to hold; kept purely so this
// file stays readable next to the old schedule and next to ORGANISM_ANATOMY.
export const MORNING = [
  { id: "mirror",        at: "06:55", args: ["scripts/mirror.mjs"] },
  { id: "sprintsync",    at: "07:00", args: ["scripts/sprintsync.mjs"] },
  // THE THREE DAEMONS (4 Aug 2026 — caught during the schtasks install, before it ran).
  // These do NOT exit. `node scripts/thalamus.mjs` is an HTTP relay on :4113 that runs for
  // days; cortex and turnstile are the same shape (turnstile holds a singleton lock on
  // :4111 precisely because "two turnstiles double-ingest"). Run synchronously like every
  // other step, they would each block the chain for the full STEP_TIMEOUT_MS, be KILLED at
  // the timeout, and be recorded as failures — and killing the thalamus mid-morning takes
  // the whole nucleus down. The old schtasks entries always knew this: they launched these
  // three through `wscript hidden_run.vbs` (fire-and-forget, no window), never inline.
  // So: `daemon.port` marks them. The runner probes the port first — if it answers, the
  // daemon is already up and is LEFT ALONE (relaunching risks a second instance) — and
  // otherwise launches it DETACHED through the same VBS cloak, which now also logs.
  { id: "thalamus",      at: "07:00", args: ["scripts/thalamus.mjs"],  daemon: { port: 4113 } },
  { id: "cortex",        at: "07:02", args: ["scripts/cortex.mjs"],    daemon: { port: 4112 } },
  { id: "turnstile",     at: "07:04", args: ["scripts/turnstile.mjs"], daemon: { port: 4111 } },
  { id: "physio",        at: "07:30", args: ["scripts/physio.mjs"] },
  // ---- the body read. EVERYTHING below depends on this file existing and being today's.
  { id: "goalkeeper",    at: "08:30", args: ["scripts/oura_coach.mjs"], writes: "readiness.json", network: true },
  { id: "twin",          at: "08:35", args: ["scripts/twin.mjs"] },
  { id: "heartbeat",     at: "08:39", args: ["scripts/heartbeat.mjs"] },
  { id: "fsrs",          at: "08:40", args: ["scripts/fsrs.mjs", "recompute"], writes: "cards.json" },
  { id: "calibration",   at: "08:42", args: ["scripts/calibration.mjs", "recompute"], writes: "calibration.json" },
  { id: "nemesis",       at: "08:43", args: ["scripts/nemesis.mjs", "recompute"], writes: "weaknesses.json" },
  { id: "learningstate", at: "08:44", args: ["scripts/learning_state.mjs", "recompute"], writes: "learning_state.json" },
  // ---- the gate: every signal above is now today's. Only now may the sheet be built.
  { id: "signals",       at: "08:44", arm: "morning_signals" },
  { id: "sheet",         at: "08:45", args: ["scripts/brain.mjs", "tick"], needs: ["goalkeeper", "learningstate"] },
  { id: "wall",          at: "08:50", args: ["scripts/viz.mjs"] },
];

const STEP_TIMEOUT_MS = 180000;   // 3 min per organ — a hung organ must not eat the morning

function writeAtomic(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
}

// Arming is a WRITE to brain_queue.json, and brain.mjs's tick re-reads that file at
// write time (its own lost-update fix), so a concurrent tick cannot erase this.
export function armTrigger(name, reason, dir = STATE_DIR) {
  const p = join(dir, "brain_queue.json");
  let q = { observed_window_ceiling: null, jobs_run: {} };
  try { if (existsSync(p)) q = JSON.parse(readFileSync(p, "utf8")); } catch { }
  q.triggers = q.triggers || {};
  q.triggers[name] = { ts: new Date().toISOString(), reason };
  writeAtomic(p, JSON.stringify(q, null, 2));
  return true;
}

// Is something already listening on this localhost port? A daemon that answers is a
// daemon that is alive — cheaper and more honest than parsing a process list, and it
// is the same question the organ itself asks (turnstile binds :4111 as its singleton).
export function portOpen(port, timeoutMs = 400) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    let done = false;
    const finish = (v) => { if (!done) { done = true; try { sock.destroy(); } catch {} resolve(v); } };
    sock.setTimeout(timeoutMs);
    sock.once("connect", () => finish(true));
    sock.once("timeout", () => finish(false));
    sock.once("error", () => finish(false));
    try { sock.connect(port, "127.0.0.1"); } catch { finish(false); }
  });
}

// Launch a long-running organ the way the schtasks entries always did: through the
// VBS cloak, with NO window and NO wait. A visible console begs to be closed, and
// closing it kills the daemon (the 0xC000013A scar, 14 Jul 2026). hidden_run.vbs now
// also redirects stdout+stderr to scripts/<name>.log and rolls it (audit #10), so a
// detached launch is no longer a silent one.
export function launchDetached(args) {
  const vbs = join(REPO, "setup", "hidden_run.vbs");
  if (existsSync(vbs)) {
    const c = spawn("wscript.exe", [vbs, "node", ...args], { cwd: REPO, detached: true, stdio: "ignore", windowsHide: true });
    c.unref();
    return;
  }
  // No cloak (a non-Windows checkout, or CI): still never block the chain.
  const c = spawn(process.execPath, args, { cwd: REPO, detached: true, stdio: "ignore" });
  c.unref();
}

export async function conduct(chain = MORNING, opts = {}) {
  const run = opts.run || ((args) => spawnSync(process.execPath, args, {
    cwd: REPO, timeout: opts.timeoutMs || STEP_TIMEOUT_MS, encoding: "utf8", windowsHide: true,
  }));
  const arm = opts.arm || armTrigger;
  const nowISO = opts.nowISO || (() => new Date().toISOString());
  const started = nowISO();
  const steps = [];

  for (const step of chain) {
    const t0 = Date.now();
    // A gate step performs no work of its own — it certifies that everything above it
    // ran, and hands the sheet its permission. If the organs it certifies did not
    // produce, it must NOT arm: a sheet built on yesterday is worse than no sheet,
    // and the absence alarm in brain.mjs will say so out loud either way.
    if (step.arm) {
      // read `writes` off the CHAIN, not off the recorded step — the record is a result,
      // it never carried the declaration. Getting this backwards made the gate a no-op
      // that armed on a dead body read, which is the exact failure it exists to prevent.
      const writers = chain.filter(c => c.writes).map(c => c.id);
      const upstream = steps.filter(s => writers.includes(s.id));
      const broken = upstream.filter(s => !s.ok).map(s => s.id);
      if (broken.length) {
        steps.push({ id: step.id, ok: false, ms: 0, skipped: `not armed — upstream failed: ${broken.join(", ")}` });
        continue;
      }
      let ok = false;
      try { ok = !!arm(step.arm, `morning conductor: ${upstream.length} signal organs fresh`); } catch (e) { steps.push({ id: step.id, ok: false, ms: Date.now() - t0, error: e.message }); continue; }
      steps.push({ id: step.id, ok, ms: Date.now() - t0, armed: step.arm });
      continue;
    }
    // A step whose declared prerequisites failed still RUNS — the sheet must appear
    // unconditionally (manager.mjs guarantees it) — but the degradation is recorded,
    // never inferred, so tomorrow's debugging does not start from a blank page.
    const missing = (step.needs || []).filter(n => !(steps.find(s => s.id === n) || {}).ok);

    // ---- DAEMON STEPS: probe, then launch DETACHED. Never block the chain. ----
    if (step.daemon) {
      // A DRY run with no injected launcher must never start a real daemon. Without
      // this, the selftest's isolation block — which passes no stub — would spawn
      // thalamus/cortex/turnstile for real on any machine where those ports are closed,
      // and on the away-day CI runner (no wscript, every port closed) it would leave
      // orphaned node processes behind on every push. Same law as timeaudit's
      // "the selftest must never touch the live bus". An injected launcher still runs,
      // so the daemon logic itself stays fully exercised by the tests below.
      if (opts.dry && !opts.launch) {
        steps.push({ id: step.id, ok: true, ms: Date.now() - t0, daemon: "dry — not launched", port: step.daemon.port });
        continue;
      }
      const probe = opts.probe || portOpen;
      const launch = opts.launch || launchDetached;
      let up = false;
      try { up = await probe(step.daemon.port); } catch { up = false; }
      if (up) {
        // Already serving. Relaunching would race a singleton lock at best and
        // double-ingest at worst — turnstile's own header says so.
        steps.push({ id: step.id, ok: true, ms: Date.now() - t0, daemon: "already running", port: step.daemon.port });
        continue;
      }
      let err = null;
      try { launch(step.args); } catch (e) { err = String(e && e.message || e); }
      // A detached launch has no exit code to wait for — claiming one would be the
      // fabricated-success defect this whole audit exists to hunt. Report what is
      // true: it was STARTED. The daemon's own log (scripts/<name>.log, now written
      // by hidden_run.vbs) is where its health actually lives.
      steps.push({
        id: step.id, ok: !err, ms: Date.now() - t0,
        daemon: err ? "launch failed" : "launched (detached — exit code not awaited)",
        port: step.daemon.port, error: err,
      });
      continue;
    }

    const r = run(step.args);
    const ms = Date.now() - t0;
    const timedOut = !!(r && (r.error && /ETIMEDOUT|timed out/i.test(String(r.error.message || r.error))));
    steps.push({
      id: step.id, ok: !timedOut && r && r.status === 0, ms,
      exit: r ? r.status : null,
      error: timedOut ? `timed out after ${opts.timeoutMs || STEP_TIMEOUT_MS}ms` : (r && r.error ? String(r.error.message || r.error) : null),
      // stderr is kept SHORT and only on failure: selfknowledge.mjs's whole
      // undiagnosable-failure bug was a runner that threw away e.stderr.
      stderr: (!timedOut && r && r.status === 0) ? null : String((r && r.stderr) || "").trim().slice(-400) || null,
      degraded: missing.length ? `ran on stale input — ${missing.join(", ")} failed` : null,
    });
  }

  const ok = steps.filter(s => s.ok).length;
  const report = {
    started, finished: nowISO(),
    total_ms: steps.reduce((a, s) => a + s.ms, 0),
    ran: steps.length, ok, failed: steps.length - ok,
    // ORDER IS THE PRODUCT — record it explicitly so a future audit can prove the
    // chain held, instead of inferring order from file mtimes the way this bug had to be.
    order: steps.map(s => s.id),
    steps,
  };
  if (!opts.dry) writeAtomic(opts.report || REPORT, JSON.stringify(report, null, 2));
  return report;
}

// ---- selftest — fully injected; no child processes, no state writes -------------
async function selftest() {
  let pass = 0, fail = 0;
  const ok = (n, c) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ " + n); } };
  const base = { dry: true, nowISO: () => "2026-08-02T03:15:00.000Z" };

  // the property the whole file exists for
  {
    const seen = [];
    const armed = [];
    const rep = await conduct(MORNING, { ...base, run: (a) => { seen.push(a[0]); return { status: 0, stderr: "" }; }, arm: (n) => { armed.push([n, seen.length]); return true; }, probe: async () => false, launch: () => {} });
    const gk = seen.indexOf("scripts/oura_coach.mjs");
    const ls = seen.indexOf("scripts/learning_state.mjs");
    const sheet = seen.indexOf("scripts/brain.mjs");
    ok("ORDER — the body read precedes the sheet (the 1 Aug inversion, impossible now)", gk > -1 && sheet > -1 && gk < sheet);

    // ---- DAEMONS (4 Aug 2026) — caught during the install, BEFORE it ran ----
    // thalamus/cortex/turnstile never exit. Run inline they would each block for the
    // full STEP_TIMEOUT_MS, be killed, and be logged as failures — and killing the
    // thalamus takes the nucleus down mid-morning.
    {
      const dmns = MORNING.filter(s => s.daemon);
      ok("DAEMON — the three long-running organs are declared, not treated as one-shots",
        dmns.length === 3 && ["thalamus", "cortex", "turnstile"].every(id => dmns.some(d => d.id === id)));

      // already up → left alone, and NOT relaunched (turnstile: "two turnstiles double-ingest")
      let launches = 0;
      const repUp = await conduct(
        [{ id: "thalamus", args: ["scripts/thalamus.mjs"], daemon: { port: 4113 } }],
        { ...base, probe: async () => true, launch: () => { launches++; } });
      ok("DAEMON — an ALREADY-RUNNING daemon is left alone, never relaunched",
        repUp.steps[0].ok === true && repUp.steps[0].daemon === "already running" && launches === 0);

      // down → launched detached, and the chain does NOT wait for an exit code
      const spawned = [];
      const repDown = await conduct(
        [{ id: "turnstile", args: ["scripts/turnstile.mjs"], daemon: { port: 4111 } },
         { id: "after", args: ["scripts/x.mjs"] }],
        { ...base, probe: async () => false, launch: (a) => { spawned.push(a[0]); },
          run: () => ({ status: 0, stdout: "", stderr: "" }) });
      ok("DAEMON — a DOWN daemon is launched detached, and the chain continues past it",
        spawned.length === 1 && repDown.steps[0].ok === true && repDown.steps.length === 2 && repDown.steps[1].ok === true);
      ok("DAEMON — the report says the exit code was NOT awaited (no fabricated success)",
        /exit code not awaited/.test(repDown.steps[0].daemon));
      ok("DAEMON — a daemon step NEVER reaches the synchronous runner (that is the hang)",
        repDown.steps[0].exit === undefined);

      // a launch that throws is a real failure, and it is named
      const repErr = await conduct(
        [{ id: "thalamus", args: ["scripts/thalamus.mjs"], daemon: { port: 4113 } }],
        { ...base, probe: async () => false, launch: () => { throw new Error("wscript missing"); } });
      ok("DAEMON — a launch that throws is reported as a FAILURE, with its reason",
        repErr.steps[0].ok === false && /wscript missing/.test(repErr.steps[0].error));

      // the probe itself must answer honestly on a port nobody is serving
      ok("DAEMON — portOpen says false for a port nobody is listening on",
        (await portOpen(59999, 200)) === false);

      // THE SELFTEST MUST NEVER START A REAL DAEMON. A dry run with no injected
      // launcher short-circuits before probe AND before launch — otherwise this very
      // suite would spawn thalamus/cortex/turnstile on any box where those ports are
      // closed, and the away-day CI runner would leak three node processes per push.
      const repDry = await conduct(
        [{ id: "thalamus", args: ["scripts/thalamus.mjs"], daemon: { port: 4113 } }], { ...base });
      ok("DAEMON — a DRY run never launches anything, and says so instead of pretending",
        repDry.steps[0].daemon === "dry — not launched" && repDry.steps[0].ok === true);
    }
    ok("ORDER — every signal organ precedes the sheet", ls > -1 && ls < sheet);
    ok("ORDER — the wall renders after the sheet it renders", seen.indexOf("scripts/viz.mjs") > sheet);
    ok("ORDER — the trigger is armed AFTER the signals and BEFORE the sheet", armed.length === 1 && armed[0][1] === ls + 1 && armed[0][1] === sheet);
    // 4 Aug 2026: this used to compare `seen` against EVERY step carrying `args`. The three
    // daemons carry args too but deliberately never reach the synchronous runner, so the
    // count alone would now be wrong in a way that hides the interesting fact. Assert both
    // halves: every one-shot really ran, AND nothing vanished from the report.
    ok("ORDER — sequential, one run per step, nothing dropped (daemons launched, not run inline)",
      seen.length === MORNING.filter(s => s.args && !s.daemon).length &&
      rep.steps.length === MORNING.length);
    ok("ORDER — the three daemons are still in the report, each with its port",
      MORNING.filter(s => s.daemon).every(d => {
        const row = rep.steps.find(s => s.id === d.id);
        return row && row.port === d.daemon.port && typeof row.daemon === "string";
      }));
  }

  // failure isolation — one dead organ must not cost him the other fourteen
  {
    const seen = [];
    const rep = await conduct(MORNING, { ...base, run: (a) => { seen.push(a[0]); return a[0].includes("twin") ? { status: 1, stderr: "boom" } : { status: 0, stderr: "" }; }, arm: () => true });
    ok("ISOLATION — a mid-chain failure does not stop the chain", seen.length === MORNING.filter(s => s.args && !s.daemon).length);
    ok("ISOLATION — the failure is recorded with its exit code and stderr", rep.steps.find(s => s.id === "twin").ok === false && /boom/.test(rep.steps.find(s => s.id === "twin").stderr));
    ok("ISOLATION — a healthy step keeps no stderr noise", rep.steps.find(s => s.id === "mirror").stderr === null);
    ok("ISOLATION — the report counts honestly", rep.ran === MORNING.length && rep.failed === 1);
  }

  // the gate — a sheet is never built on inputs that did not compute
  {
    const rep = await conduct(MORNING, { ...base, run: (a) => (a[0].includes("oura_coach") ? { status: 1, stderr: "oura down" } : { status: 0, stderr: "" }), arm: () => { throw new Error("armed despite a dead body read"); } });
    const gate = rep.steps.find(s => s.id === "signals");
    ok("GATE — a failed body read does NOT arm the sheet", gate.ok === false && /goalkeeper/.test(gate.skipped));
    ok("GATE — the sheet step still RUNS (the sheet appears unconditionally)", rep.steps.find(s => s.id === "sheet").exit === 0);
    ok("GATE — but the sheet is flagged as running on stale input, never silently", /goalkeeper/.test(rep.steps.find(s => s.id === "sheet").degraded || ""));
  }

  // a hung organ must not eat the morning
  {
    const rep = await conduct([{ id: "hang", args: ["x.mjs"] }], { ...base, timeoutMs: 50, run: () => ({ status: null, error: new Error("spawnSync ETIMEDOUT") }) });
    ok("TIMEOUT — a hung organ is failed and named, never left to block the chain", rep.steps[0].ok === false && /timed out/.test(rep.steps[0].error));
  }

  // arming is a merge, never a clobber
  //
  // AUDIT #76 (4 Aug 2026) — THESE TWO ASSERTIONS COULD NOT FAIL. The block was:
  //     const before = existsSync(live) ? JSON.parse(readFileSync(live)) : null;
  //     ok("ARM — the live queue is untouched …", true);              // <- a LITERAL
  //     ok("ARM — jobs_run survives arming …", before === null || typeof before.jobs_run === "object");
  // It never called armTrigger, so it proved nothing about arming; `before` was a
  // dead read; and the second line passed unconditionally whenever the live file
  // was absent (which is exactly the cloud-CI checkout the away-day lane runs on).
  // A green that cannot go red is worth less than no test at all — it advertises
  // a regression net over the ONE write the conductor performs.
  //
  // The block now does the real thing: it arms a REAL brain_queue.json in a fresh
  // OS temp dir (armTrigger takes its directory as a parameter, which is the whole
  // reason it does), reads the file back off disk, and proves the merge. The live
  // queue is fingerprinted before and after and must be byte-for-byte identical —
  // so "the selftest writes nothing" is now MEASURED, not promised.
  {
    const live = join(STATE_DIR, "brain_queue.json");
    const liveBefore = existsSync(live) ? readFileSync(live, "utf8") : null;

    const dir = mkdtempSync(join(tmpdir(), "conductor-arm-"));
    const fresh = mkdtempSync(join(tmpdir(), "conductor-arm-cold-"));
    try {
      const qPath = join(dir, "brain_queue.json");
      // a realistic prior queue: a window ceiling the brain self-tuned, a jobs_run
      // ledger, and a trigger someone else armed earlier today.
      writeFileSync(qPath, JSON.stringify({
        observed_window_ceiling: 812345,
        jobs_run: { haiku_pulse: 41, teamtalk_am: 1 },
        triggers: { nightshift: { ts: "2026-08-01T18:00:00.000Z", reason: "armed by another organ" } },
      }, null, 2));

      const armed = armTrigger("morning_signals", "morning conductor: 5 signal organs fresh", dir);
      const after = JSON.parse(readFileSync(qPath, "utf8"));

      ok("ARM — armTrigger actually writes the named trigger with a stamp and a reason",
        armed === true && !!after.triggers.morning_signals
        && /morning conductor/.test(after.triggers.morning_signals.reason)
        && !Number.isNaN(Date.parse(after.triggers.morning_signals.ts)));
      ok("ARM — jobs_run and the self-tuned window ceiling SURVIVE arming (read-modify-write, not overwrite)",
        after.observed_window_ceiling === 812345
        && after.jobs_run && after.jobs_run.haiku_pulse === 41 && after.jobs_run.teamtalk_am === 1);
      ok("ARM — another organ's trigger is merged, never clobbered",
        !!after.triggers.nightshift && after.triggers.nightshift.reason === "armed by another organ");

      // a cold checkout has no queue file at all — the gate must create one, not throw
      armTrigger("morning_signals", "cold start", fresh);
      const cold = JSON.parse(readFileSync(join(fresh, "brain_queue.json"), "utf8"));
      ok("ARM — a missing queue is CREATED (the cloud-checkout case), never crashed on",
        !!cold.triggers.morning_signals && typeof cold.jobs_run === "object");

      const liveAfter = existsSync(live) ? readFileSync(live, "utf8") : null;
      ok("ARM — the LIVE queue is byte-for-byte untouched by this selftest (measured, not claimed)",
        liveAfter === liveBefore);
    } finally {
      // no orphan temp survives a pass OR a failure
      try { rmSync(dir, { recursive: true, force: true }); } catch { }
      try { rmSync(fresh, { recursive: true, force: true }); } catch { }
    }
  }

  console.log(fail === 0 ? `\nALL CHECKS PASSED (${pass} passed, 0 failed)` : `\n${fail} FAILED (${pass} passed)`);
  return fail === 0;
}

async function main() {
  const mode = (process.argv[2] || "morning").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  // `--dry` USED TO LIE: it suppressed only the report while every organ ran for real
  // and the trigger was genuinely armed. A flag whose name promises "nothing happens"
  // must mean it — that is the same class of mistake as a task returning 0 after
  // failing inside. `plan` shows the chain and touches nothing; `--no-report` is the
  // honest name for "really run, just don't publish the report".
  if (mode === "plan") {
    for (const s of MORNING) console.log(`  ${String(s.at).padEnd(6)} ${s.id.padEnd(14)} ${s.arm ? `arm ${s.arm}` : "node " + s.args.join(" ")}${s.writes ? "  → " + s.writes : ""}${s.needs ? "  needs: " + s.needs.join(", ") : ""}`);
    console.log(`conductor: ${MORNING.length} steps, sequential. Nothing was run.`);
    return;
  }
  if (mode !== "morning") { console.error("usage: node scripts/conductor.mjs [morning|plan|selftest] [--no-report]"); process.exit(1); }
  const dry = process.argv.includes("--no-report");
  const rep = await conduct(MORNING, { dry });
  for (const s of rep.steps) {
    const mark = s.ok ? "ok  " : "FAIL";
    console.log(`  ${mark} ${s.id.padEnd(14)} ${String(s.ms).padStart(6)}ms${s.skipped ? "  " + s.skipped : ""}${s.error ? "  " + s.error : ""}${s.degraded ? "  ⚠ " + s.degraded : ""}`);
  }
  console.log(`conductor: morning chain — ${rep.ok}/${rep.ran} ok in ${Math.round(rep.total_ms / 1000)}s${dry ? " (dry — no report written)" : ` → ${REPORT}`}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
