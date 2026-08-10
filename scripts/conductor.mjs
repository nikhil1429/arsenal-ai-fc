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
import http from "node:http";
import { writeFileSync, appendFileSync, renameSync, readFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
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
  // (network flag removed 9 Aug F6 — nothing ever read it; the chain treats every step alike)
  // `log` overrides the derived log name ONLY where the retired task itself used a
  // different one. The Goalkeeper predates audit #98's wrapper: INSTALL_TASKS.ps1:87
  // hand-wired `>> scripts\coach.log`, and that file — not oura_coach.log — is what
  // CLAUDE.md cites as the proof this organ ever ran live, and what
  // GOALKEEPER_v2_migration.md:185 tells him to grep. Deriving "oura_coach" here
  // would have left the documented file dead forever while a new one filled up.
  { id: "goalkeeper",    at: "08:30", args: ["scripts/oura_coach.mjs"], writes: "readiness.json", log: "coach" },
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

// ---- LADDER D1 (9 Aug 2026) — THE EVENING SPINE -----------------------------
// The evening was nine loose Task Scheduler rows staggered 22:00→23:10, the same
// disease the morning had before this file existed: the stagger WAS the order,
// and one overslept evening collapses into a single unordered catch-up burst.
// One task, one chain. `at` = each retired row's LIVE time (Bell 22:00 is HIS
// ruled time, not drift — read live off schtasks 9 Aug 2026, not off a doc);
// scoreboard (H1, 10 Aug 2026) is the one born-in-chain step, its `at` derived
// from its neighbours — AFTER the scorer has proposed + matured today's gaffer
// rows (its slip read needs them), BEFORE setpiece rewrites drills.json for
// TOMORROW (the refuter-caught trap: any post-22:40 slot reads tomorrow's file).
// `needs` marks the real read-dependencies: the wall renders what the scorer and
// set-piece wrote, the wallpaper paints the wall's own render, the examiner
// stages against the set-piece's drills. A missed need still RUNS (the report
// records the degradation) — order is the product, absence is the alarm.
export const EVENING = [
  { id: "bell",       at: "22:00", args: ["scripts/brain.mjs", "bell", "fulltime"] },
  { id: "scorer",     at: "22:35", args: ["scripts/scorer.mjs"] },
  { id: "scoreboard", at: "22:38", args: ["scripts/scoreboard.mjs", "run"], needs: ["scorer"] },
  // H3 (10 Aug 2026): the model's deterministic evening step — finalize
  // yesterday's fact grid, resolve its bets, seal today's, re-derive statuses.
  // AFTER the scoreboard (its outcomes feed two facts), BEFORE setpiece.
  { id: "nikhil-model", at: "22:39", args: ["scripts/nikhil_model.mjs", "ingest"], needs: ["scoreboard"] },
  { id: "setpiece",   at: "22:40", args: ["scripts/setpiece.mjs"] },
  { id: "doubtminer", at: "22:45", args: ["scripts/doubtminer.mjs"] },
  { id: "physio-pm",  at: "22:50", args: ["scripts/physio.mjs"] },
  { id: "examiner",   at: "22:55", args: ["scripts/examiner.mjs", "stage"], needs: ["setpiece"] },
  { id: "wall-pm",    at: "23:00", args: ["scripts/viz.mjs"], needs: ["scorer", "setpiece"] },
  { id: "scout",      at: "23:05", args: ["scripts/scout.mjs"] },
  // the one non-node step: WALLPAPER.ps1 paints the wall's render onto the desktop.
  { id: "wallpaper",  at: "23:10", exec: { cmd: "powershell", args: ["-ExecutionPolicy", "Bypass", "-File", "setup\\WALLPAPER.ps1"] }, needs: ["wall-pm"] },
];

const STEP_TIMEOUT_MS = 180000;   // 3 min per organ — a hung organ must not eat the morning

// The stderr budget — UNCHANGED, this file's own number, lifted out of the inline
// `.slice(-400)` it used to live in so the two places that spend it agree.
const STDERR_CAP = 400;

// THE REASON LINE. A node crash prints, in this order: `<file>:<line>`, the offending
// source line, the caret, a BLANK line, then `SyntaxError: …` / `Error: …`, then the
// stack, then `Node.js vX`. This finds that middle line — the only part a human needs.
const REASON_RE = /^(?:[A-Za-z_$][\w$]*)?(?:Error|Exception)\b[^\r\n]*/m;

// ---- clipStderr — WHAT SURVIVES OF A DEAD ORGAN'S LAST WORDS ------------------
// (wire-audit, 10 Aug 2026.) The cut used to be `String(r.stderr).trim().slice(-400)`:
// TAIL-only, and silent about it — so the record kept the least useful end and never
// admitted anything was missing. MEASURED today on two REAL node crashes:
//   · a JSON.parse SyntaxError — 573 chars, reason line at byte 40; the kept tail began
//     at byte 173, so the record carried four anonymous stack frames and NO reason;
//   · a thrown Error inside a script — 1051 chars, reason at byte 358, tail began at
//     byte 651 → the same loss, on the shape every organ here actually fails in.
// The reason sits at no fixed offset (40 vs 358 above), so NO head/tail split can be
// trusted to catch it — it has to be FOUND. So: hoist the reason line verbatim, spend
// what the same 400-char budget has left on the tail (where the entry-point frame and
// the node version live), and NAME the cut — in the string AND in a `stderr_bytes`
// field. A truncation nobody can see is the same class of lie as a silent success,
// which is this file's own opening law.
export function clipStderr(raw, cap = STDERR_CAP) {
  const s = String(raw || "").trim();
  if (!s) return { stderr: null, stderr_bytes: null };
  if (s.length <= cap) return { stderr: s, stderr_bytes: null };  // nothing dropped, nothing to declare
  const m = REASON_RE.exec(s);
  // A reason already inside the tail we were going to keep anyway is NOT hoisted —
  // no duplicated lines, no budget spent twice.
  const reason = m && m.index < s.length - cap ? m[0].slice(0, cap) : "";
  const cut = (n) => `… [conductor: ${n} of ${s.length} chars cut] …`;
  const markLen = cut(s.length).length + 2;   // upper bound (dropped ≤ total) + the two newlines
  const tail = s.slice(s.length - Math.max(0, cap - reason.length - markLen));
  const dropped = s.length - reason.length - tail.length;
  return { stderr: (reason ? reason + "\n" : "") + cut(dropped) + "\n" + tail, stderr_bytes: s.length };
}

function writeAtomic(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
}

// ---- THE ORGAN'S VOICE — restored (10 Aug 2026) -----------------------------
// THE DEFECT: every one-shot step below runs through spawnSync with piped stdio, so
// each organ's stdout was captured into `r.stdout` and then never referenced — not
// by conduct(), not by the report, not by anything. The step row keeps stderr only,
// truncated to 400 chars, and ONLY when the exit code was non-zero. So an organ that
// fails SOFT — prints its reason and still exits 0, which is how the validators, the
// mirror's fetch and brain.mjs's own fallbacks all fail — left ZERO trace anywhere.
// That is the exact silence run_logged.cmd was written to end (audit #98: ~35 organs
// "spoke into a cmd window that closed the instant they finished").
//
// MEASURED, NOT ASSUMED — the chain took those tasks over and their logs stopped
// dead on the takeover hour. `ls scripts/*.log`, 10 Aug 2026:
//   coach · fsrs · calibration · nemesis · learning_state → all 04-08-2026 16:29,
//     the INSTALL_CONDUCTOR hour — while conductor.json for 2026-08-10 records every
//     one of those five steps as ok that morning;
//   scorer · setpiece · doubtminer · physio · viz · scout → all 08-08 22:35–23:05,
//     the last evening before INSTALL_EVENING_CONDUCTOR took those rows (D1, 9 Aug).
// The conductor's OWN log is alive (scripts/conductor.log, still via run_logged.cmd)
// but it holds only the summary lines this file prints — "ok fsrs 100ms" — never one
// word of what fsrs actually said.
//
// THE WIRE: tee each step's captured output into the log its retired task owned, in
// run_logged.cmd's format and under run_logged.cmd's contract. Nothing is invented —
// the cap, the one-generation roll and the `== <stamp> :: <cmdline>` header are that
// file's, so a log written by this chain and a log written by a task that still runs
// the old way (ArsenalFC-BrainTick does, verified live on schtasks today) are the
// same artefact for grep and for him.
//
// WHY IN NODE, NOT BY RE-WRAPPING EACH STEP IN run_logged.cmd: precedent —
// tone.mjs writes scripts/tone.log itself "rather than relying on the scheduler"
// (ORGANISM_REPAIR_PLAN.md:1249). And the re-wrap would actively cost us something:
// run_logged.cmd sends stderr into the file with `2>&1`, which would empty the pipe
// and blank the report's `stderr` field — trading this silence for a different one,
// the very field selfknowledge.mjs's undiagnosable-failure bug was about.
//
// KNOWN, PRE-EXISTING, NOT MADE NEW: `sheet` and `bell` both run brain.mjs, so they
// tee into scripts/brain.log — which the BrainDaemon holds open through the VBS
// cloak. ArsenalFC-BrainTick has appended to and rolled that same file the whole
// time; this adds volume to that lane, not a new hazard class.
const LOG_MAX_BYTES = 2097152;   // run_logged.cmd's own 2 MB cap, verbatim — not a new number

// The log a step owns. run_logged.cmd derives it from `%~n1` (basename of the script
// it was handed) and hidden_run.vbs from GetBaseName of the first *.mjs argument —
// one rule, already written twice, so it is the rule here. It falls out correctly for
// the doubled organs: `wall`+`wall-pm` both land in the one viz.log that Wall-AM and
// Wall-PM always shared, and `physio`+`physio-pm` in physio.log, exactly as before.
export function stepLogName(step) {
  if (step.log) return step.log;
  const argv = step.exec ? (step.exec.args || []) : (step.args || []);
  const f = argv.find(a => /\.(mjs|cjs|js|ps1|cmd)$/i.test(String(a)));
  return f ? String(f).split(/[\\/]/).pop().replace(/\.[^.]+$/, "") : step.id;
}

// Append one run's output, rolling exactly the way run_logged.cmd rolls: at the cap
// above, one generation kept, the rename overwriting the old .1 (its `move /y`).
// `dir` is a parameter for the same reason armTrigger's is — so the selftest can
// prove the real write against a temp directory and leave the live logs untouched.
// FAIL-SOFT BY DESIGN: a log that cannot be written must never cost him the chain,
// so every error returns null and the step is recorded as having no trace.
export function logStep(name, cmdline, body, dir = join(REPO, "scripts")) {
  const p = join(dir, `${name}.log`);
  try {
    mkdirSync(dir, { recursive: true });
    try { if (statSync(p).size > LOG_MAX_BYTES) renameSync(p, `${p}.1`); } catch { }
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    // run_logged.cmd's `%DATE% %TIME%` shape on this box, e.g. "10-08-2026 22:00:02".
    const stamp = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${d.toTimeString().slice(0, 8)}`;
    // The header goes down even when the organ said nothing, because "it woke and was
    // silent" and "it never woke at all" are different facts — run_logged.cmd stamps
    // unconditionally for precisely that reason, and a soft failure exits 0.
    appendFileSync(p, `\n== ${stamp} :: ${cmdline}\n${body}${body.endsWith("\n") ? "" : "\n"}`);
    return p;
  } catch { return null; }
}

// Arming is a WRITE to brain_queue.json, and brain.mjs's tick re-reads that file at
// write time (its own lost-update fix), so a concurrent tick cannot erase this.
//
// THE REFUSAL (10 Aug 2026, wiring audit) — A NON-OWNER MAY ADD A KEY, NEVER RESET THE
// FILE. brain.mjs:92 owns brain_queue.json; this function is a guest that writes exactly
// one key. The old body was:
//     let q = { observed_window_ceiling: null, jobs_run: {} };
//     try { if (existsSync(p)) q = JSON.parse(readFileSync(p, "utf8")); } catch { }
// — the empty catch fell through to that two-key default and writeAtomic'd it OVER a file
// that exists. So one torn read (a half-flushed tick, a killed write, a disk hiccup) and
// the guest deletes the owner's whole state. Measured on the live file the same day, it
// carries SEVEN keys: observed_window_ceiling · jobs_run · last_tick · jobs_failed ·
// triggers · mouth_said · foreign_limit_seen_ts. What each loss costs, named:
//   · jobs_run is what stops a once-a-day LLM job re-running — wiping it re-bills the day;
//   · triggers is every OTHER organ's arming, erased by the one organ arming its own;
//   · mouth_said is read by scoreboard.mjs:302; observed_window_ceiling is the budget
//     ceiling brain.mjs self-tuned from a real limit event and cannot re-derive.
// And it returned `true` regardless, so conduct() recorded the gate as GREEN. A silent
// wipe reported as a pass is the worst shape in this repo.
//
// THE THREE CASES NOW: absent ⇒ create (the cold-checkout case, unchanged). Readable ⇒
// merge (unchanged — byte-for-byte the same write as before). Present-but-unreadable ⇒
// REFUSE: return false, touch nothing, let the on-disk data survive until a good read.
// That is exactly teaching_contract.mjs load()/save() (6 Aug 2026, "never clobber a live
// file we could not read") applied to the file next door — and like that repair, no engine
// is replaced, so there is nothing to freeze under a *Legacy name: the success path is
// unchanged and the only new branch is the one that used to destroy data.
//
// THE REFUSAL IS NOT SILENT. conduct() records the gate step FAILED with the reason, which
// is what the organism-doctor skill turns 🔴 off conductor.json and what the cloud sentinel
// reads. It also means the sheet is NOT told its signals are fresh — correct: an unreadable
// queue is exactly when brain.mjs must not be handed a permission.
export function armTrigger(name, reason, dir = STATE_DIR) {
  const p = join(dir, "brain_queue.json");
  let q = { observed_window_ceiling: null, jobs_run: {} };   // cold checkout only
  if (existsSync(p)) {
    let disk = null;
    try { disk = JSON.parse(readFileSync(p, "utf8")); } catch { }
    // `null`, `[]` and `"…"` all parse cleanly and are still not this file's shape —
    // spreading a trigger onto any of them and writing it back is the same wipe.
    if (!disk || typeof disk !== "object" || Array.isArray(disk)) return false;
    q = disk;
  }
  q.triggers = q.triggers || {};
  q.triggers[name] = { ts: new Date().toISOString(), reason };
  writeAtomic(p, JSON.stringify(q, null, 2));
  return true;
}

// Is something already listening on this localhost port? A daemon that answers is a
// daemon that is alive — cheaper and more honest than parsing a process list, and it
// is the same question the organ itself asks (turnstile binds :4111 as its singleton).
// The one probe timeout this file has always had. buildStamp() reuses it rather
// than introducing a second, so there is exactly one number to ever re-tune.
const PROBE_TIMEOUT_MS = 400;
export function portOpen(port, timeoutMs = PROBE_TIMEOUT_MS) {
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

// THE BUILD CHECK (audit #108). Asks a daemon what code it is actually running.
// Deliberately tiny and fail-soft: any error, timeout or missing endpoint returns
// null, which the caller reports as "unverified" — never as a failure, because a
// daemon without a /status route (cortex, turnstile) is not broken, just silent.
// MEASURED, NOT CHOSEN (6 Aug 2026 — the captain's standing rule: no number is
// guessed). First cut invented 500ms and an 8192-byte cap out of nothing. Live
// measurement against the running thalamus on this box:
//   · /status round-trip, 8 consecutive reads: 21 21 22 22 24 24 28 30 ms (max 30).
//     So we reuse this file's OWN established probe timeout (portOpen's 400ms)
//     rather than adding a second number — 13× the observed worst case.
//   · /status payload: 147 bytes. The cap below is a runaway guard against a
//     pathological response, NOT a tuning threshold — it can never change
//     behaviour on a healthy endpoint — and it is written as an explicit multiple
//     of the measured size so the basis stays auditable instead of magic.
const STATUS_PAYLOAD_MEASURED_BYTES = 147;          // measured live, 2026-08-06
const STATUS_MAX_BYTES = STATUS_PAYLOAD_MEASURED_BYTES * 32;
export function buildStamp(port, timeoutMs = PROBE_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const to = setTimeout(() => finish(null), timeoutMs);
    try {
      const req = http.get({ host: "127.0.0.1", port, path: "/status", timeout: timeoutMs }, (res) => {
        if (res.statusCode !== 200) { res.resume(); clearTimeout(to); return finish(null); }
        let raw = "";
        res.on("data", (c) => { raw += c; if (raw.length > STATUS_MAX_BYTES) req.destroy(); });
        res.on("end", () => { clearTimeout(to); try { finish(JSON.parse(raw)); } catch { finish(null); } });
      });
      req.on("error", () => { clearTimeout(to); finish(null); });
      req.on("timeout", () => { try { req.destroy(); } catch {} clearTimeout(to); finish(null); });
    } catch { clearTimeout(to); finish(null); }
  });
}

// mtime of a repo-relative script path, or null if it cannot be read. Anchored on
// __dirname's parent so the answer never depends on the caller's CWD.
export function mtimeOf(relPath) {
  try { return statSync(join(__dirname, "..", relPath)).mtimeMs; } catch { return null; }
}

// mtime of a file a step DECLARED it writes, or null if it is not on disk at all.
// Anchored on STATE_DIR for the same reason mtimeOf is anchored on __dirname — the
// answer must never depend on the caller's CWD — and it takes a bare filename because
// that is exactly what the chain's `writes:` declares ("readiness.json", not a path).
export function stateMtimeMs(name, dir = STATE_DIR) {
  try { return statSync(join(dir, name)).mtimeMs; } catch { return null; }
}

// THE IMPORT GRAPH, NOT JUST THE ENTRY FILE (audit #108 verify pass, 6 Aug 2026).
// The first cut compared only the daemon's own file. But thalamus.mjs imports
// capture.mjs — repaired the same day — so editing a DEPENDENCY after boot left a
// genuinely stale daemon reporting "build current". A module graph is the unit that
// gets frozen at load, so the graph is what must be compared. Walks local relative
// imports transitively; node: and package imports are not ours and are skipped.
export function newestGraphMtime(relPath, seen = new Set()) {
  const abs = join(__dirname, "..", relPath);
  if (seen.has(abs)) return { ms: null, file: null };
  seen.add(abs);
  let newest = { ms: null, file: null };
  let src = "";
  try {
    newest = { ms: statSync(abs).mtimeMs, file: relPath };
    src = readFileSync(abs, "utf8");
  } catch { return newest; }
  for (const m of src.matchAll(/from\s+["'](\.\/[^"']+\.mjs)["']/g)) {
    const child = join(dirname(relPath), m[1]).replace(/\\/g, "/");
    const r = newestGraphMtime(child, seen);
    if (r.ms != null && (newest.ms == null || r.ms > newest.ms)) newest = r;
  }
  return newest;
}

// THE UNIVERSAL FALLBACK: ask the OS when the daemon has nothing to say.
// Only thalamus serves /status; cortex and turnstile hold bare port locks and would
// have read "build unverified" forever — one organ covered out of three. The process
// table knows when EVERY process started, without any daemon changing at all. Windows
// only (this box), fail-soft everywhere: any error returns null and the caller reports
// UNVERIFIED, which is an honest unknown and never a failure.
export function processStartMs(relPath, deps = {}) {
  const run = deps.run || spawnSync;
  try {
    const leaf = relPath.split("/").pop();
    const ps = `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match '${leaf.replace(".", "\\.")}' } | Select-Object -First 1 -ExpandProperty CreationDate | ForEach-Object { $_.ToUniversalTime().ToString('o') }`;
    const r = run("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8", timeout: 5000 });
    const t = Date.parse(String((r && r.stdout) || "").trim());
    return Number.isFinite(t) ? t : null;
  } catch { return null; }
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
  const tee = opts.logStep || logStep;
  const logDir = opts.logDir || join(REPO, "scripts");
  // the report names the trace repo-relative when the trace is in the repo
  const rel = (p) => p ? (p.startsWith(REPO) ? p.slice(REPO.length + 1) : p).replace(/\\/g, "/") : null;
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
      // A STALE WRITE IS A BROKEN UPSTREAM (10 Aug 2026). The production check above
      // folds "declared a file and did not rewrite it" into the step's own `ok`, so
      // this branch catches it with no new condition — but it must SAY WHICH, because
      // "goalkeeper failed" and "goalkeeper exited 0 and left readiness.json alone"
      // send an operator to two different places.
      const broken = upstream.filter(s => !s.ok).map(s => s.produced === false ? `${s.id} (exit 0, ${s.wrote} not rewritten)` : s.id);
      if (broken.length) {
        steps.push({ id: step.id, ok: false, ms: 0, skipped: `not armed — upstream failed: ${broken.join(", ")}` });
        continue;
      }
      // The reason used to assert "N signal organs fresh" on the strength of N exit
      // codes — the word `fresh` was the claim this gate could not actually make.
      // Now it can, so it states the evidence: how many of the declared files were
      // seen rewritten by this run. `unverified` is never silently counted as fresh.
      const verified = upstream.filter(s => s.produced === true).length;
      const reason = `morning conductor: ${upstream.length} signal organs ok, ${verified}/${upstream.length} declared files verified rewritten this run`;
      let ok = false;
      try { ok = !!arm(step.arm, reason); } catch (e) { steps.push({ id: step.id, ok: false, ms: Date.now() - t0, error: e.message }); continue; }
      // A REFUSAL IS NOT A SHRUG (10 Aug 2026). armTrigger now returns false rather than
      // resetting an unreadable brain_queue.json, and a row reading `ok:false` next to
      // `armed:"morning_signals"` would be a mystery to whoever finds it — the report is
      // the only thing anyone reads. So the field tells the truth about what happened,
      // and the one condition that can produce it is named in place.
      steps.push({
        id: step.id, ok, ms: Date.now() - t0, armed: ok ? step.arm : null,
        error: ok ? null : `not armed — ${step.arm}: brain_queue.json exists but did not parse, and this chain does not own it. Refused to overwrite brain.mjs's file; the queue is intact, the trigger is lost for this run.`,
      });
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
        //
        // BUT "up" IS NOT "CURRENT" (audit #108, 6 Aug 2026). This branch used to
        // report `ok: true, "already running"` and stop, which is how a thalamus that
        // booted 45 minutes BEFORE its own file was rewritten sailed through two days of
        // green 16/16 chains — and through a full audit. Node caches a module at load;
        // nothing here ever restarts a daemon; so a port answering proves only that
        // SOMETHING is listening, never that the repaired code is what answers.
        // A daemon that states its build gets checked. One that does not is reported as
        // UNVERIFIED rather than healthy — an honest unknown, never a fabricated green.
        const stamp = await (opts.buildStamp || buildStamp)(step.daemon.port);
        const onDisk = opts.mtimeOf ? opts.mtimeOf(step.args[0]) : mtimeOf(step.args[0]);
        // TIER 2 — the daemon said nothing, so ask the OS. Covers cortex and turnstile,
        // which have no /status at all, and checks the whole import GRAPH rather than
        // just the entry file. Reported separately because it is a coarser instrument:
        // process-start vs file-mtime, not the exact stamp the module itself captured.
        if (!stamp || stamp.module_mtime_ms == null) {
          const started = (opts.processStartMs || processStartMs)(step.args[0]);
          const graph = (opts.newestGraphMtime || newestGraphMtime)(step.args[0]);
          if (started != null && graph.ms != null && graph.ms > started) {
            steps.push({
              id: step.id, ok: false, ms: Date.now() - t0, port: step.daemon.port,
              daemon: "STALE BUILD — running code older than its module graph (via process table)",
              error: `booted ${new Date(started).toISOString()}; ${graph.file} last written ${new Date(graph.ms).toISOString()} — restart it to load the repairs`,
            });
            continue;
          }
          steps.push({
            id: step.id, ok: true, ms: Date.now() - t0, port: step.daemon.port,
            daemon: started != null && graph.ms != null
              ? "already running (build current — via process table)"
              : "already running (build unverified — no /status stamp and no process match)",
          });
          continue;
        }
        // EXACT EQUALITY, because there is no skew to tolerate (measured 6 Aug 2026).
        // The first cut allowed 1000ms of drift — a number chosen, not measured. But
        // both sides read mtimeMs from statSync on the SAME file: the daemon at boot,
        // this probe now. Five consecutive live reads returned a delta of exactly 0,
        // 0, 0, 0, 0. Any non-zero difference means the file genuinely changed after
        // the daemon loaded it, which is precisely what this check exists to catch —
        // so a tolerance could only ever hide a real stale build.
        if (stamp && stamp.module_mtime_ms != null && onDisk != null && stamp.module_mtime_ms !== onDisk) {
          steps.push({
            id: step.id, ok: false, ms: Date.now() - t0, port: step.daemon.port,
            daemon: "STALE BUILD — running code older than the file on disk",
            error: `booted ${stamp.booted_at || "?"} against a module last written ${new Date(onDisk).toISOString()}; restart it to load the repairs`,
          });
          continue;
        }
        steps.push({
          id: step.id, ok: true, ms: Date.now() - t0, port: step.daemon.port,
          daemon: stamp && stamp.module_mtime_ms != null ? "already running (build current)" : "already running (build unverified — no /status build stamp)",
        });
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

    // D1 — a non-node step (WALLPAPER.ps1) runs through its own executor, same
    // isolation/timeout/record shape as every node one-shot. Injectable.
    const r = step.exec
      ? (opts.runExec || ((ex) => spawnSync(ex.cmd, ex.args, {
          cwd: REPO, timeout: opts.timeoutMs || STEP_TIMEOUT_MS, encoding: "utf8", windowsHide: true,
        })))(step.exec)
      : run(step.args);
    const ms = Date.now() - t0;
    const timedOut = !!(r && (r.error && /ETIMEDOUT|timed out/i.test(String(r.error.message || r.error))));

    // ---- DID IT ACTUALLY PRODUCE? (10 Aug 2026) -------------------------------
    // THE DEFECT: `writes:` has named a state file on five steps since this chain was
    // written, and NOTHING ever read the name. The gate below did
    // `chain.filter(c => c.writes)` and used only the TRUTHINESS to build an id list —
    // so what it certified was EXIT CODES, never freshness. An organ that exits 0
    // without rewriting its file still armed morning_signals, and the sheet was then
    // built on yesterday's readiness: the 1 Aug failure in this file's own header,
    // reached by a second route the file had left open. Built, declared, not wired.
    //
    // THE TEST IS THE RUN ITSELF, NOT A THRESHOLD (his no-guessed-numbers rule): the
    // declared file must be newer than the moment THIS step started. Nothing is
    // chosen — t0 is already on the stack for the duration measurement. `>=` and not
    // `>` because both clocks are this one process's, and a write landing inside t0's
    // own millisecond happened DURING the run, not before it.
    //
    // MEASURED FIRST, so it can only ever fire on a real defect — every declared
    // writer writes unconditionally on its exit-0 path and exits NON-zero on every
    // path that skips the write: oura_coach.mjs refuses a non-persistable verdict and
    // exits 1 leaving readiness.json untouched by design ("stale-but-real beats
    // fresh-but-fabricated"), and fsrs / calibration / nemesis / learning_state each
    // end `writeAtomic(...); process.exit(0)`. Live mtimes 10 Aug 2026: all five
    // rewritten that day. So a red here means the organ genuinely did not produce.
    //
    // THE MARGIN IS MEASURED TOO, because Windows stamps file times off a coarser
    // clock (~15.6ms tick) than Date.now() reads, so a write could land a tick BEHIND
    // the moment it happened. conductor.json for 2026-08-10 gives the real step
    // durations: goalkeeper 1276ms, fsrs 100ms, calibration 82ms, nemesis 99ms,
    // learningstate 103ms — the tightest is ~5× the tick, and node's own startup
    // floors it. There is nothing to tune here; the gap is structural.
    //
    // A SIMULATED RUN CANNOT BE CHECKED, and "simulated" is NOT just `dry` — an
    // INJECTED runner is the real test (caught by the VOICE block's own non-dry
    // fixture, which declares `writes: "cards.json"` and stubs `run`). Either way no
    // child was spawned, so nothing could have written; measuring the live STATE_DIR
    // there would fail a step for a write that was never attempted — a lie in the
    // opposite direction. So the check runs when the child was REAL, or when the
    // caller injected a clock, which is how the assertions below exercise the whole
    // path without a single real process. Same short-circuit shape as the daemon
    // branch above, and the same reason.
    const exited0 = !timedOut && r && r.status === 0;
    const simulated = !!opts.dry || !!(step.exec ? opts.runExec : opts.run);
    const checkWrites = !!step.writes && !!exited0 && (!simulated || !!opts.stateMtimeMs);
    const wroteAt = checkWrites ? (opts.stateMtimeMs || stateMtimeMs)(step.writes) : null;
    const produced = checkWrites ? (wroteAt != null && wroteAt >= t0) : null;
    // THE VOICE (10 Aug 2026) — whatever the organ said goes to the log its retired
    // task owned, on a GREEN step too: a soft failure exits 0, so "log it when it
    // fails" would still hide exactly the failures the report cannot see. stdout
    // first, then stderr, which is the interleave `>> log 2>&1` produced before.
    // Suppressed under `dry`, because dry has to keep meaning "nothing happens".
    const said = `${String((r && r.stdout) || "")}${String((r && r.stderr) || "")}`;
    const cmdline = step.exec ? `${step.exec.cmd} ${step.exec.args.join(" ")}` : `node ${step.args.join(" ")}`;
    const logPath = opts.dry ? null : tee(stepLogName(step), cmdline, said, logDir);
    const clipped = clipStderr((!timedOut && r && r.status === 0) ? null : (r && r.stderr));
    steps.push({
      // EXIT 0 IS NOT PRODUCTION. A step that declared a file and did not rewrite it
      // is FAILED here — which is not a new severity, it is this file's oldest law
      // ("SILENT SUCCESS IS STILL A LIE", and its own `--dry` note on "a task
      // returning 0 after failing inside"). Folding it into `ok` is what wires it:
      // the gate's existing broken-upstream branch refuses to arm, `needs` marks the
      // sheet degraded and names the organ, and rep.failed makes the process exit
      // non-zero so Task Scheduler's Last Result says so — three live consumers, no
      // new organ.
      id: step.id, ok: !!exited0 && produced !== false, ms,
      exit: r ? r.status : null,
      // THE DECLARATION, ANSWERED. `wrote` echoes what the chain claimed so the report
      // can be read without the chain next to it; `produced` is deliberately TRI-STATE
      // — true verified, false caught stale, null NOT CHECKED (no declaration, a step
      // that already failed, or a dry run). Collapsing null into false would fabricate
      // a verdict, which is the defect one line up.
      wrote: step.writes || null,
      produced,
      stale: produced === false
        ? `declared ${step.writes} but this run did not rewrite it — ${wroteAt == null ? "the file is not on disk" : `last written ${new Date(wroteAt).toISOString()}, before this step started ${new Date(t0).toISOString()}`}`
        : null,
      // A green row now points at its own evidence. Without this the report is the
      // only thing anyone reads, and it is the one place a soft failure looks fine.
      log: rel(logPath),
      error: timedOut ? `timed out after ${opts.timeoutMs || STEP_TIMEOUT_MS}ms` : (r && r.error ? String(r.error.message || r.error) : null),
      // stderr is kept SHORT and only on failure: selfknowledge.mjs's whole
      // undiagnosable-failure bug was a runner that threw away e.stderr. WHAT it keeps
      // changed 10 Aug 2026 — the tail-only cut threw away the error MESSAGE, which is
      // the same bug one layer in. clipStderr keeps the reason and declares the cut.
      stderr: clipped.stderr,
      // NON-NULL MEANS CUT, and says how big the original was. Nothing named the
      // truncation before, so the doctor skill and the captain read a mid-stack
      // fragment as if it were the organ's whole complaint. The uncut text lives in
      // the step's own `log` above (THE VOICE, same day) — this field is what makes
      // a reader go there instead of trusting the fragment.
      stderr_bytes: clipped.stderr_bytes,
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
  if (!opts.dry && !opts.noReport) writeAtomic(opts.report || REPORT, JSON.stringify(report, null, 2));
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
        { ...base, probe: async () => true, launch: () => { launches++; },
          buildStamp: async () => ({ module_mtime_ms: 1000 }), mtimeOf: () => 1000 });
      ok("DAEMON — an ALREADY-RUNNING daemon is left alone, never relaunched",
        repUp.steps[0].ok === true && /already running/.test(repUp.steps[0].daemon) && launches === 0);

      // ---- audit #108: "UP" IS NOT "CURRENT" -------------------------------
      // The measured failure: thalamus booted 04-08 16:43:34, its file was rewritten
      // 17:28:30, and this chain reported 16/16 green for two days while every 4-Aug
      // repair sat inert. A port cannot tell you which build answers it.
      let staleLaunches = 0;
      const repStale = await conduct(
        [{ id: "thalamus", args: ["scripts/thalamus.mjs"], daemon: { port: 4113 } }],
        { ...base, probe: async () => true, launch: () => { staleLaunches++; },
          buildStamp: async () => ({ module_mtime_ms: 1000, booted_at: "2026-08-04T16:43:34Z" }), mtimeOf: () => 999999 });
      ok("#108 DAEMON — a daemon running code OLDER than its file is reported FAILED, not healthy",
        repStale.steps[0].ok === false && /STALE BUILD/.test(repStale.steps[0].daemon));
      ok("#108 DAEMON — a stale daemon is still never auto-relaunched (the double-ingest law holds)",
        staleLaunches === 0);
      ok("#108 DAEMON — the stale report names both clocks so the fix is obvious",
        /booted 2026-08-04T16:43:34Z/.test(repStale.steps[0].error) && /restart it/.test(repStale.steps[0].error));

      // A daemon with no /status build stamp (cortex, turnstile) is UNVERIFIED —
      // an honest unknown. It must NOT be failed: silence is not a defect.
      const repUnver = await conduct(
        [{ id: "cortex", args: ["scripts/cortex.mjs"], daemon: { port: 4112 } }],
        { ...base, probe: async () => true, launch: () => {}, buildStamp: async () => null, mtimeOf: () => 1000,
          processStartMs: () => null, newestGraphMtime: () => ({ ms: null, file: null }) });
      ok("#108 DAEMON — no build stamp AND no process match ⇒ UNVERIFIED, still ok (honest unknown, never a fake green)",
        repUnver.steps[0].ok === true && /build unverified/.test(repUnver.steps[0].daemon));

      // ---- verify pass: TIER 2, the process-table fallback ------------------
      // Only thalamus serves /status. Before this, cortex and turnstile read
      // "unverified" forever — the defect class was closed for ONE organ of three.
      const repOsStale = await conduct(
        [{ id: "cortex", args: ["scripts/cortex.mjs"], daemon: { port: 4112 } }],
        { ...base, probe: async () => true, launch: () => {}, buildStamp: async () => null,
          processStartMs: () => 1000, newestGraphMtime: () => ({ ms: 2000, file: "scripts/cortex.mjs" }) });
      ok("#108 DAEMON — a daemon with NO /status is still caught stale, via the process table",
        repOsStale.steps[0].ok === false && /process table/.test(repOsStale.steps[0].daemon));
      const repOsOk = await conduct(
        [{ id: "turnstile", args: ["scripts/turnstile.mjs"], daemon: { port: 4111 } }],
        { ...base, probe: async () => true, launch: () => {}, buildStamp: async () => null,
          processStartMs: () => 3000, newestGraphMtime: () => ({ ms: 2000, file: "scripts/turnstile.mjs" }) });
      ok("#108 DAEMON — booted AFTER its newest file ⇒ current (turnstile's real case, never a false alarm)",
        repOsOk.steps[0].ok === true && /build current/.test(repOsOk.steps[0].daemon));
      // the graph, not just the entry file: thalamus imports capture.mjs
      {
        const g = newestGraphMtime("scripts/thalamus.mjs");
        ok("#108 DAEMON — the staleness check walks the IMPORT GRAPH, not just the entry file",
          g.ms != null && typeof g.file === "string" && g.file.endsWith(".mjs"));
      }

      // EXACT match ⇒ current. Measured live: both sides statSync the same file and
      // the delta was 0 on 5/5 reads, so there is no skew to tolerate and any
      // difference at all is a real stale build (the 1000ms tolerance the first cut
      // invented could only have hidden one).
      const repSame = await conduct(
        [{ id: "thalamus", args: ["scripts/thalamus.mjs"], daemon: { port: 4113 } }],
        { ...base, probe: async () => true, launch: () => {},
          buildStamp: async () => ({ module_mtime_ms: 1786014546971.656 }), mtimeOf: () => 1786014546971.656 });
      ok("#108 DAEMON — an exact mtime match reads BUILD CURRENT (measured skew is 0, so equality is the test)",
        repSame.steps[0].ok === true && /build current/.test(repSame.steps[0].daemon));
      const repOneMs = await conduct(
        [{ id: "thalamus", args: ["scripts/thalamus.mjs"], daemon: { port: 4113 } }],
        { ...base, probe: async () => true, launch: () => {},
          buildStamp: async () => ({ module_mtime_ms: 1000 }), mtimeOf: () => 1001 });
      ok("#108 DAEMON — even a 1ms difference is a stale build (no invented tolerance to hide behind)",
        repOneMs.steps[0].ok === false && /STALE BUILD/.test(repOneMs.steps[0].daemon));

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

  // ---- THE REASON SURVIVES THE DOOR (wire-audit, 10 Aug 2026) ----------------
  // The cut was `.slice(-400)` — tail-only and silent. A REAL node crash, captured
  // verbatim today (573 chars; reason at byte 40; the old tail began at byte 173),
  // is the fixture: it is the exact shape every organ in both chains dies in.
  {
    const CRASH = [
      "<anonymous_script>:1",
      "{bad json}",
      " ^",
      "",
      "SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)",
      "    at JSON.parse (<anonymous>)",
      "    at file:///C:/Users/nikhi/GitHub/arsenal-ai-fc/scripts/learning_state.mjs:118:31",
      "    at ModuleJob.run (node:internal/modules/esm/module_job:271:25)",
      "    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:578:26)",
      "    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:116:5)",
      "",
      "Node.js v22.14.0",
    ].join("\n");
    const c = clipStderr(CRASH);

    // THE REGRESSION WITNESS — the old engine fails this line, the new one passes it.
    ok("STDERR — the REASON line survives the clip (the old tail-only cut dropped it — proven right here)",
      CRASH.length > STDERR_CAP
      && /SyntaxError: Expected property name/.test(c.stderr)
      && !/SyntaxError: Expected property name/.test(CRASH.slice(-STDERR_CAP)));
    ok("STDERR — the truncation NAMES ITSELF, in the string and in stderr_bytes",
      c.stderr_bytes === CRASH.length && /\[conductor: \d+ of \d+ chars cut\]/.test(c.stderr));
    ok("STDERR — the tail is still kept (entry frame + node version), inside the SAME 400-char budget",
      /Node\.js v22/.test(c.stderr) && c.stderr.length <= STDERR_CAP);
    ok("STDERR — an stderr that FITS is passed through byte-for-byte and declares NO cut",
      (() => { const s = clipStderr("boom"); return s.stderr === "boom" && s.stderr_bytes === null; })());
    ok("STDERR — nothing to say stays null (a green step adds no noise)",
      clipStderr("").stderr === null && clipStderr(null).stderr_bytes === null);
    ok("STDERR — a reason already inside the kept tail is kept ONCE, never hoisted twice",
      (() => {
        // 500 chars of noise pushes the whole thing past the cap, but the reason still
        // lands inside the last 400 — the branch where hoisting would only duplicate.
        const s = clipStderr("x".repeat(500) + "\nError: late reason\n" + "y".repeat(50));
        return s.stderr_bytes > STDERR_CAP && (s.stderr.match(/Error: late reason/g) || []).length === 1;
      })());

    // THE WIRE ITSELF — clipStderr must be what the runner actually spends on a
    // failed step. Asserting the function alone would pass with line 527 reverted.
    const repC = await conduct(
      [{ id: "learningstate", args: ["scripts/learning_state.mjs", "recompute"] }],
      { ...base, run: () => ({ status: 1, stderr: CRASH }) });
    const row = repC.steps[0];
    ok("STDERR — the RECORDED row carries the reason and admits the cut (the door, not just the helper)",
      row.ok === false && /SyntaxError: Expected property name/.test(row.stderr) && row.stderr_bytes === CRASH.length);
  }

  // the gate — a sheet is never built on inputs that did not compute
  {
    const rep = await conduct(MORNING, { ...base, run: (a) => (a[0].includes("oura_coach") ? { status: 1, stderr: "oura down" } : { status: 0, stderr: "" }), arm: () => { throw new Error("armed despite a dead body read"); } });
    const gate = rep.steps.find(s => s.id === "signals");
    ok("GATE — a failed body read does NOT arm the sheet", gate.ok === false && /goalkeeper/.test(gate.skipped));
    ok("GATE — the sheet step still RUNS (the sheet appears unconditionally)", rep.steps.find(s => s.id === "sheet").exit === 0);
    ok("GATE — but the sheet is flagged as running on stale input, never silently", /goalkeeper/.test(rep.steps.find(s => s.id === "sheet").degraded || ""));
  }

  // ---- THE PRODUCTION CHECK (10 Aug 2026) — `writes:` WAS AN ORPHAN FIELD ------
  // Declared on five steps since this chain was born, and read by NOTHING: the gate
  // did `chain.filter(c => c.writes)`, kept the truthiness to build an id list, and
  // certified EXIT CODES. So the 1 Aug disaster this whole file exists to prevent —
  // a sheet built on a stale readiness.json — stayed reachable by a quieter route:
  // any signal organ that exits 0 without rewriting its file armed the gate anyway.
  // Every assertion below goes RED against that code, which is the only reason they
  // are worth the lines.
  {
    const writers = MORNING.filter(s => s.writes);

    // (1) the wire itself — an organ that exits 0 and leaves its file untouched
    const stale = await conduct(MORNING, {
      ...base,
      run: () => ({ status: 0, stdout: "", stderr: "" }),
      // every declared file looks rewritten EXCEPT the body read
      stateMtimeMs: (name) => (name === "readiness.json" ? 1000 : Date.now()),
      arm: () => { throw new Error("armed on a file that was never rewritten") },
    });
    const gk = stale.steps.find(s => s.id === "goalkeeper");
    ok("#WIRE — an organ that EXITS 0 without rewriting its declared file is FAILED, never green",
      gk.exit === 0 && gk.ok === false && gk.produced === false && gk.wrote === "readiness.json");
    ok("#WIRE — the row names the declared file AND both clocks, so the fix needs no archaeology",
      /readiness\.json/.test(gk.stale) && /before this step started/.test(gk.stale));
    const gate = stale.steps.find(s => s.id === "signals");
    ok("#WIRE — the gate REFUSES to arm on a stale write (the 1 Aug failure's second route, closed)",
      gate.ok === false && /goalkeeper \(exit 0, readiness\.json not rewritten\)/.test(gate.skipped));
    ok("#WIRE — and the sheet still runs, flagged degraded, naming the organ that did not produce",
      stale.steps.find(s => s.id === "sheet").exit === 0
      && /goalkeeper/.test(stale.steps.find(s => s.id === "sheet").degraded || ""));
    ok("#WIRE — a stale write reaches the EXIT CODE, so Task Scheduler's Last Result says so",
      stale.failed > 0);

    // (2) the happy path is untouched — this must not cost him a morning
    const armed = [];
    const fresh = await conduct(MORNING, {
      ...base,
      run: () => ({ status: 0, stdout: "", stderr: "" }),
      stateMtimeMs: () => Date.now(),
      arm: (n, why) => { armed.push([n, why]); return true; },
    });
    ok("#WIRE — every declared file rewritten ⇒ the gate arms exactly as it always did",
      armed.length === 1 && fresh.steps.find(s => s.id === "signals").ok === true
      && writers.every(s => fresh.steps.find(r => r.id === s.id).produced === true));
    // the count is READ OFF THE CHAIN, never typed in — a sixth writer must not need
    // this assertion edited, and a writer silently dropped must break it.
    ok("#WIRE — the arm reason carries the EVIDENCE (n/n verified), not a bare claim of 'fresh'",
      new RegExp(`${writers.length}/${writers.length} declared files verified rewritten this run`).test(armed[0][1]));

    // (3) NOT CHECKED must never read as CHECKED-AND-FINE — fabricating a green here
    // would re-open the same hole from the other side.
    const dry = await conduct(MORNING, { ...base, run: () => ({ status: 0, stderr: "" }), arm: () => true });
    ok("#WIRE — a DRY run reports produced:null (not checked), never a fabricated true",
      writers.every(s => dry.steps.find(r => r.id === s.id).produced === null)
      && dry.steps.find(s => s.id === "twin").produced === null);

    // (4) the reader really touches a disk — otherwise (1)-(3) only prove the stub works
    {
      const dir = mkdtempSync(join(tmpdir(), "conductor-writes-"));
      try {
        ok("#WIRE — stateMtimeMs is null for a file that is simply not there",
          stateMtimeMs("readiness.json", dir) === null);
        writeFileSync(join(dir, "readiness.json"), "{}");
        const first = stateMtimeMs("readiness.json", dir);
        writeFileSync(join(dir, "readiness.json"), '{"again":true}');
        const second = stateMtimeMs("readiness.json", dir);
        // compared against ITSELF, never against Date.now(): one clock, no tolerance
        // to invent, and it still proves the number moves when the file is rewritten.
        ok("#WIRE — and it reads a REAL mtime off disk that MOVES when the file is rewritten",
          first != null && second != null && second >= first);
      } finally { try { rmSync(dir, { recursive: true, force: true }); } catch { } }
    }

    // (5) ORPHAN GUARD — the declaration must keep matching the organ. A `writes:` is
    // a bare state filename, and the organ that declares it names that same file in
    // its own source. Rename either side and the gate would go back to certifying a
    // file nobody writes, which is precisely the defect being closed here.
    ok("#WIRE — every `writes:` is a bare filename AND appears in its own organ's source",
      writers.length > 0 && writers.every(s =>
        !/[\\/]/.test(s.writes) && readFileSync(join(REPO, s.args[0]), "utf8").includes(s.writes)));
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

      // ---- THE REFUSAL (10 Aug 2026, wiring audit) --------------------------
      // The clobber this file used to perform, reproduced against a REAL torn queue on
      // disk: the empty catch made the guest reset the owner's file to two keys and
      // still return true. These go red the moment that behaviour comes back. The
      // fixture is the LIVE file's own key set (7 keys, read off
      // dressing-room/state/brain_queue.json on 10 Aug 2026), truncated mid-object the
      // way an interrupted write actually leaves it.
      const torn = mkdtempSync(join(tmpdir(), "conductor-arm-torn-"));
      try {
        const tPath = join(torn, "brain_queue.json");
        const WHOLE = JSON.stringify({
          observed_window_ceiling: 1600000,
          jobs_run: { "2026-08-10": { formation_read: 1, teamtalk_am: 1 } },
          last_tick: "2026-08-10T17:59:39.095Z",
          jobs_failed: { "2026-08-10": { widget_spec: 2 } },
          triggers: { nightshift: { ts: "2026-08-09T18:00:00.000Z", reason: "armed by another organ" } },
          mouth_said: { "2026-08-10": "sheet" },          // scoreboard.mjs:302 reads this
          foreign_limit_seen_ts: "2026-08-07T19:16:26.250Z",
        }, null, 2).slice(0, 260);                        // a write cut off part-way
        writeFileSync(tPath, WHOLE);

        const refused = armTrigger("morning_signals", "morning conductor: 5 signal organs fresh", torn);
        ok("ARM REFUSAL — an UNREADABLE queue is left byte-for-byte alone, and arming returns FALSE (the old code reset it to 2 keys and returned true)",
          refused === false && readFileSync(tPath, "utf8") === WHOLE);

        // the shapes that parse cleanly and are still not this file — spreading a
        // trigger onto any of them and writing it back is the same wipe by another door
        for (const [shape, text] of [["null", "null"], ["an array", "[]"], ["a string", '"queue"']]) {
          const d2 = mkdtempSync(join(tmpdir(), "conductor-arm-shape-"));
          try {
            writeFileSync(join(d2, "brain_queue.json"), text);
            ok(`ARM REFUSAL — ${shape} parses fine but is not the queue's shape ⇒ refused, file untouched`,
              armTrigger("morning_signals", "x", d2) === false
              && readFileSync(join(d2, "brain_queue.json"), "utf8") === text);
          } finally { try { rmSync(d2, { recursive: true, force: true }); } catch { } }
        }

        // THE WIRE, not just the helper: the refusal has to reach the REPORT, because
        // conductor.json is the only thing the doctor skill and the cloud sentinel read.
        // A green gate row over a refused write is precisely the lie being closed.
        const repRef = await conduct(MORNING, {
          ...base, run: () => ({ status: 0, stdout: "", stderr: "" }),
          probe: async () => false, launch: () => { },
          arm: (n, r) => armTrigger(n, r, torn),          // the real function, torn file
        });
        const gate = repRef.steps.find(s => s.id === "signals");
        ok("ARM REFUSAL — the gate step is recorded FAILED, never green, when the write was refused",
          gate.ok === false && gate.armed === null && repRef.failed >= 1);
        ok("ARM REFUSAL — the report NAMES the reason, so a 🔴 arrives with its cause instead of a mystery",
          /brain_queue\.json exists but did not parse/.test(gate.error || "")
          && /queue is intact/.test(gate.error || ""));
      } finally { try { rmSync(torn, { recursive: true, force: true }); } catch { } }

      const liveAfter = existsSync(live) ? readFileSync(live, "utf8") : null;
      ok("ARM — the LIVE queue is byte-for-byte untouched by this selftest (measured, not claimed)",
        liveAfter === liveBefore);
    } finally {
      // no orphan temp survives a pass OR a failure
      try { rmSync(dir, { recursive: true, force: true }); } catch { }
      try { rmSync(fresh, { recursive: true, force: true }); } catch { }
    }
  }

  // ---- THE ORGAN'S VOICE (10 Aug 2026) --------------------------------------
  // These would all have been GREEN on 9 Aug with every per-organ log frozen since
  // the takeover hour — that is the point. Same discipline as the ARM block above:
  // the writes are REAL (a temp dir, because logStep takes its directory for exactly
  // this reason), and the live logs are fingerprinted so "the selftest writes
  // nothing" stays measured rather than promised.
  {
    const liveFsrs = join(REPO, "scripts", "fsrs.log");
    const liveBefore = existsSync(liveFsrs) ? readFileSync(liveFsrs, "utf8") : null;
    const dir = mkdtempSync(join(tmpdir(), "conductor-voice-"));
    const dryDir = mkdtempSync(join(tmpdir(), "conductor-voice-dry-"));
    try {
      const rep = await conduct(
        [{ id: "fsrs", args: ["scripts/fsrs.mjs", "recompute"], writes: "cards.json" },
         { id: "goalkeeper", args: ["scripts/oura_coach.mjs"], log: "coach" }],
        { nowISO: base.nowISO, noReport: true, logDir: dir,
          // the soft failure this whole wire exists for: a real complaint, exit 0.
          run: (a) => a[0].includes("fsrs")
            ? { status: 0, stdout: "fsrs: recompute skipped — store unreadable\n", stderr: "" }
            : { status: 0, stdout: "", stderr: "oura: token refresh warning\n" } });
      const fsrsLog = readFileSync(join(dir, "fsrs.log"), "utf8");
      ok("VOICE — a step's STDOUT reaches its own log (the whole defect: r.stdout was captured and then never referenced)",
        /fsrs: recompute skipped — store unreadable/.test(fsrsLog));
      ok("VOICE — the log is written on a GREEN step too, because a soft failure exits 0 and no report field can see it",
        rep.steps[0].ok === true && rep.steps[0].exit === 0
        && /^\s*== \d\d-\d\d-\d{4} \d\d:\d\d:\d\d :: node scripts\/fsrs\.mjs recompute$/m.test(fsrsLog));
      ok("VOICE — stderr lands in the log even at exit 0, which the report's stderr field deliberately drops",
        /oura: token refresh warning/.test(readFileSync(join(dir, "coach.log"), "utf8")));
      ok("VOICE — the report NAMES each step's log, so a green row points at its own evidence",
        /fsrs\.log$/.test(rep.steps[0].log || "") && /coach\.log$/.test(rep.steps[1].log || ""));

      // the naming rule, on the REAL chains — one rule, taken from run_logged.cmd
      ok("VOICE — both viz slots and both physio slots name the ONE log their retired tasks shared (Wall-AM/PM, Physio-AM/PM)",
        stepLogName(MORNING.find(s => s.id === "wall")) === "viz"
        && stepLogName(EVENING.find(s => s.id === "wall-pm")) === "viz"
        && stepLogName(MORNING.find(s => s.id === "physio")) === "physio"
        && stepLogName(EVENING.find(s => s.id === "physio-pm")) === "physio");
      ok("VOICE — the ps1 step is named from its FILE, never left as 'powershell'",
        stepLogName(EVENING.find(s => s.id === "wallpaper")) === "WALLPAPER");
      ok("VOICE — the Goalkeeper keeps feeding scripts/coach.log, the file CLAUDE.md cites and GOALKEEPER_v2_migration.md greps",
        stepLogName(MORNING.find(s => s.id === "goalkeeper")) === "coach");
      ok("VOICE — every one-shot step in BOTH chains resolves to a log name (no organ left mute)",
        [...MORNING, ...EVENING].filter(s => !s.arm && !s.daemon)
          .every(s => typeof stepLogName(s) === "string" && stepLogName(s).length > 0));

      // a restored voice must not become a disk leak (finding #51's class)
      const big = join(dir, "roll.log");
      writeFileSync(big, "x".repeat(LOG_MAX_BYTES + 1));
      logStep("roll", "node scripts/roll.mjs", "after the roll", dir);
      ok("VOICE — a log past run_logged.cmd's own 2 MB cap rolls to .1 and starts clean, one generation kept",
        existsSync(`${big}.1`) && statSync(big).size < 1024 && /after the roll/.test(readFileSync(big, "utf8")));

      const repDry = await conduct([{ id: "fsrs", args: ["scripts/fsrs.mjs"] }],
        { ...base, logDir: dryDir, run: () => ({ status: 0, stdout: "must never be written", stderr: "" }) });
      ok("VOICE — a DRY run writes no log at all (dry has to keep meaning 'nothing happens')",
        !existsSync(join(dryDir, "fsrs.log")) && repDry.steps[0].log === null);

      const liveAfter = existsSync(liveFsrs) ? readFileSync(liveFsrs, "utf8") : null;
      ok("VOICE — the LIVE scripts/fsrs.log is byte-for-byte untouched by this selftest (measured, not claimed)",
        liveAfter === liveBefore);
    } finally {
      try { rmSync(dir, { recursive: true, force: true }); } catch { }
      try { rmSync(dryDir, { recursive: true, force: true }); } catch { }
    }
  }

  // ---- LADDER D1 (9 Aug 2026) — THE EVENING SPINE ---------------------------
  {
    const seen = [];
    const execs = [];
    const rep = await conduct(EVENING, {
      ...base,
      run: (a) => { seen.push(a.join(" ")); return { status: 0, stderr: "" }; },
      runExec: (ex) => { execs.push(`${ex.cmd} ${ex.args.join(" ")}`); return { status: 0, stderr: "" }; },
    });
    ok("EVENING — bell opens at HIS 22:00, wallpaper closes; order is the chain, not the clock",
      rep.order[0] === "bell" && rep.order[rep.order.length - 1] === "wallpaper"
      && EVENING[0].at === "22:00" && rep.steps.every(s => s.ok));
    // H1+H3 AMENDMENTS (10 Aug 2026): the D1 witness is re-stated, never
    // erased — the nine retired rows STAY asserted verbatim, and the closed
    // world names the TWO born-in-chain additions exactly (scoreboard 22:38
    // then nikhil-model 22:39, pinned scorer ← scoreboard ← nikhil-model ←
    // setpiece) — a length check alone would pass with ANY extra step.
    ok("EVENING — the nine retired rows are all here, the TWO additions are exactly scoreboard→nikhil-model, and no step is a daemon or a gate",
      EVENING.length === 11 && EVENING.every(s => !s.daemon && !s.arm)
      && ["bell", "scorer", "setpiece", "doubtminer", "physio-pm", "examiner", "wall-pm", "scout", "wallpaper"].every(id => EVENING.some(s => s.id === id))
      && (() => {
        const sb = EVENING.find(s => s.id === "scoreboard");
        const nm = EVENING.find(s => s.id === "nikhil-model");
        const i = EVENING.indexOf(sb);
        return sb && nm && EVENING[i - 1].id === "scorer" && EVENING[i + 1].id === "nikhil-model"
          && EVENING[i + 2].id === "setpiece"
          && (sb.needs || []).join() === "scorer" && sb.at === "22:38"
          && (nm.needs || []).join() === "scoreboard" && nm.at === "22:39";
      })());
    ok("EVENING — the ps1 step runs through its OWN executor, never the node runner",
      execs.length === 1 && /WALLPAPER\.ps1/.test(execs[0]) && !seen.some(s => /WALLPAPER/.test(s)));
    const repFail = await conduct(EVENING, {
      ...base,
      run: (a) => ({ status: a.join(" ").includes("viz.mjs") ? 1 : 0, stderr: a.join(" ").includes("viz.mjs") ? "render died" : "" }),
      runExec: () => ({ status: 0, stderr: "" }),
    });
    ok("EVENING — a dead wall still lets the wallpaper RUN, flagged degraded, never silently skipped",
      repFail.steps.find(s => s.id === "wallpaper").ok === true
      && /wall-pm/.test(repFail.steps.find(s => s.id === "wallpaper").degraded || "")
      && repFail.steps.find(s => s.id === "examiner").degraded === null);
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
    // D1 — `plan evening` shows the evening chain; bare `plan` stays the morning.
    const chain = process.argv[3] === "evening" ? EVENING : MORNING;
    for (const s of chain) console.log(`  ${String(s.at).padEnd(6)} ${s.id.padEnd(14)} ${s.arm ? `arm ${s.arm}` : s.exec ? `${s.exec.cmd} ${s.exec.args.join(" ")}` : "node " + s.args.join(" ")}${s.writes ? "  → " + s.writes : ""}${s.needs ? "  needs: " + s.needs.join(", ") : ""}`);
    console.log(`conductor: ${chain.length} steps, sequential. Nothing was run.`);
    return;
  }
  if (mode !== "morning" && mode !== "evening") { console.error("usage: node scripts/conductor.mjs [morning|evening|plan [evening]|selftest] [--no-report]"); process.exit(1); }
  // B4 (9 Aug 2026, launch worklist): --no-report used to map onto opts.dry, and dry
  // ALSO skips the daemon probe/launch step — so the flag documented as "really run,
  // just don't publish" silently left thalamus/cortex/turnstile unprobed. noReport
  // now suppresses ONLY the report write; dry stays the selftest's isolation switch.
  const noReport = process.argv.includes("--no-report");
  // D1 — the evening spine writes its OWN report file; the morning keeps its name.
  const chain = mode === "evening" ? EVENING : MORNING;
  const reportPath = mode === "evening" ? join(STATE_DIR, "conductor_evening.json") : REPORT;
  const rep = await conduct(chain, { noReport, report: reportPath });
  for (const s of rep.steps) {
    const mark = s.ok ? "ok  " : "FAIL";
    // a FAIL line names the log, because the summary in scripts/conductor.log is the
    // first thing read after a red morning and the organ's own words are the next.
    // It also names the REASON now (10 Aug 2026): `error` is only ever set on a timeout
    // or a spawn failure, so an organ that merely exited 1 printed a bare "FAIL <id>
    // 812ms" here and made the reader open a file to learn anything at all. clipStderr
    // hoists the reason to the FIRST line, so this is that line and nothing else.
    const reason = !s.ok && s.stderr ? s.stderr.split("\n")[0] : "";
    console.log(`  ${mark} ${s.id.padEnd(14)} ${String(s.ms).padStart(6)}ms${s.skipped ? "  " + s.skipped : ""}${s.error ? "  " + s.error : ""}${reason ? "  " + reason : ""}${s.degraded ? "  ⚠ " + s.degraded : ""}${!s.ok && s.log ? "  → " + s.log : ""}`);
  }
  console.log(`conductor: ${mode} chain — ${rep.ok}/${rep.ran} ok in ${Math.round(rep.total_ms / 1000)}s${noReport ? " (no report written; daemons still probed)" : ` → ${reportPath}`}`);
  // THE CHAIN CAN NOW SAY NO (audit #108, 6 Aug 2026).
  // This function printed its FAIL lines and then fell off the end, so the process
  // exited 0 no matter what broke. That is the single most expensive silence in the
  // organism: one scheduled task now carries FOURTEEN organs, and Task Scheduler's
  // Last Result was the only channel left that could report on any of them. Every
  // one of the 14 individual tasks it replaced could fail visibly; the chain that
  // replaced them could not. Same defect class this file's own `--dry` comment above
  // calls out — "a task returning 0 after failing inside".
  if (rep.failed) {
    console.error(`conductor: ${rep.failed} step(s) FAILED — exiting non-zero so Task Scheduler's Last Result says so.`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
