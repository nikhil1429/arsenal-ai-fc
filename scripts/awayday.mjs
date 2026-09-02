#!/usr/bin/env node
// ============================================================================
// awayday.mjs · ARSENAL AI FC — THE AWAY-DAY RUNNER (public-safe CI lane)
// ----------------------------------------------------------------------------
// WHAT:  The one lane allowed to run in a CLOUD runner (CYBORG_BRAIN.md §9):
//        genuinely public-safe deterministic chores on the PUBLIC repo —
//        selftest CI, bundle regen. A CI lane, NOT a home for the brain
//        (Actions can't hold a long-lived Claude OAuth session).
// ----------------------------------------------------------------------------
// THE FIRST LOCK IS OPEN, BY HIS RULING (10 Aug 2026 · wire audit).
//        This header used to end by promising the data never left the house,
//        and ci_manifest.json + .github/workflows/awayday.yml both said the
//        gitignore kept personal files out of any cloud checkout "by
//        construction". All three were FALSE, and had been since decision D10
//        (5 Aug 2026), re-confirmed by him 10 Aug — "dono rehne do":
//            dressing-room/state/readiness.json · intake_log.json ·
//            reps_log.jsonl are TRACKED, so a cloud checkout of this PUBLIC
//            repo DOES carry his biometric + medication-timing + study state.
//        Verify live, never from this comment:  git ls-files dressing-room/state
//        His data, his call — the runner does NOT reverse it and does not
//        refuse over it. What it stops doing is pretending, and what it does
//        instead is rebuild the missing lock in CODE:
// THE GUARD — TWO LOCKS, both enforced in vetJobs(), both fail the whole run:
//        LOCK 1 · every job must carry `public_safe: true` in ci_manifest.json.
//                 One unflagged job refuses the WHOLE run, loudly, and nothing
//                 executes.
//        LOCK 2 · no runnable job may NAME the personal lane in its command.
//                 A flag is a claim; the command is the evidence. This check
//                 already existed — but only inside selftest(), where it read
//                 the manifest TEXT. It never saw the command the runner
//                 dispatches, so a manifest edited after the last green
//                 selftest could have piped biometrics straight into a public
//                 CI log. Built, present, not wired — the same shape as every
//                 other defect found on this audit day.
//        And exposure() READS the checkout it is standing in (git, not prose)
//        and prints it on every run, so the CI log names the open lock instead
//        of a header quietly lying about it.
// MODES: node scripts/awayday.mjs run · check · list · exposure · selftest
//        `run` is the CLOUD half (it executes the jobs). `check` is the HOUSE
//        half (it reads the cloud's verdict back home) — see THE READ-BACK.
//        That list is no longer prose kept in step by hand: it is printed FROM
//        the MODE TABLE at main(), and an unrecognised mode now REFUSES with
//        exit 1 instead of printing help and exiting 0 — see the comment there.
// ============================================================================

import { readFileSync, existsSync, writeFileSync, rmSync, mkdirSync, renameSync, readdirSync } from "node:fs";  // rm/tmpdir: selftest only. writeFileSync also carries the ONE state file this organ owns (awayday.json, house side) — never written from a cloud runner, which only ever calls `run`.
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync, execFileSync, spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(__dirname, "..", "ci_manifest.json");
const STATE    = join(__dirname, "..", "dressing-room", "state", "awayday.json");  // SOLE WRITER: this organ. Nothing else may touch it.
const WORKFLOW = "awayday.yml";            // .github/workflows/awayday.yml — this organ IS its runner; the selftest asserts that file still exists
// 120000 ms — BORROWED, not tuned: the exact ceiling groundsman.mjs:130 already
// puts on a git network call from this house. No number here is a measured one.
const NET_TIMEOUT_MS = 120000;

// TELL "ABSENT" FROM "BROKEN" (10 Aug 2026, wire-audit). This was one line with an
// empty catch, so a manifest that EXISTS but has one stray comma came back null and
// run() then printed "no ci_manifest.json". The CI log told the reader to add a file
// that was already on disk — the away-day lane stays red while the fix is hunted at
// the wrong door, and `list` printed "0 public-safe job(s)" and exited 0, a silent
// green over an unparseable guard file. A parse error is now its own return value and
// is named in the refusal, with the path, so the log points at the actual character.
// Returns { json, badJson }: badJson is null unless the file exists and does not parse.
const readJson = (p) => {
  if (!existsSync(p)) return { json: null, badJson: null };
  try { return { json: JSON.parse(readFileSync(p, "utf8")), badJson: null }; }
  catch (e) { return { json: null, badJson: String((e && e.message) || e).split("\n")[0].slice(0, 200) }; }
};

// THE PERSONAL LANE — ONE PATTERN, THREE USES (10 Aug 2026, wire-audit). NOT a new
// invention and NOT a guessed list: this is selftest()'s own "no personal-file references"
// regex (unchanged since 29 Jul, still asserted below), lifted to a constant so the COMMAND
// the runner dispatches and the CHECKOUT it stands in are vetted by the same definition as
// the manifest text the tests read. One edit changes all three; they cannot drift apart.
const PERSONAL = /oura|readiness|reps_log|intake|hippocampus|transcript/i;

// DATA, NOT MACHINERY. Scoped to dressing-room/ because that is the state bus (CLAUDE.md:
// "agents read/write a JSON state bus at dressing-room/state/*.json"). scripts/oura_auth.mjs,
// scripts/oura_coach.mjs and scripts/hippocampus.mjs match the same word-list and are SUPPOSED
// to sit in a public checkout — CYBORG_BRAIN.md §11: the public repo holds the machinery,
// never the moments. Without this scope the exposure read would cry wolf about source files.
const PERSONAL_DATA_ROOT = "dressing-room/";

function trackedFiles(deps = {}) {
  if (deps.tracked !== undefined) return deps.tracked;
  try {
    return execSync("git ls-files", { encoding: "utf8", cwd: join(__dirname, ".."), timeout: 30000, stdio: ["ignore", "pipe", "ignore"] })
      .split("\n").map(s => s.trim()).filter(Boolean);
  } catch { return null; }        // null, NOT [] — an empty array would read as "nothing tracked"
}

// WHAT PERSONAL STATE IS ACTUALLY STANDING IN THIS CHECKOUT — read from git, never from a
// comment, because a comment is exactly what rotted here. It REPORTS and never refuses: those
// files are tracked by HIS ruling, and a runner that refused over them would be silently
// reversing a captain decision on his own repo.
// known:false is reported as UNKNOWN and never as CLEAN — an absence with no field naming it
// gets read as a zero, which is the other defect found on this same audit day.
function exposure(deps = {}) {
  const tracked = trackedFiles(deps);
  if (tracked === null) return { known: false, files: [], line: "checkout exposure UNKNOWN — git could not be read here. That is a MISSING READ, not a clean bill." };
  const files = tracked.filter(p => p.startsWith(PERSONAL_DATA_ROOT) && PERSONAL.test(p));
  return { known: true, files, line: files.length
    ? `checkout exposure: ${files.length} tracked personal-state file(s) ARE in this checkout — ${files.join(", ")}. His D10 ruling (5 Aug, re-confirmed 10 Aug); the old gitignore lock is open on purpose, so public_safe + the command gate below are the ONLY locks left.`
    : `checkout exposure: no tracked file under ${PERSONAL_DATA_ROOT} matches the personal lane.` };
}

// FROZEN VERBATIM (LAYERING law) — the 29 Jul guard: the public_safe flag and nothing else.
// It was written when the gitignore lock was real, so it only ever had one lock to enforce.
// Kept in-file, uncalled, so the change of engine below is readable rather than archaeological.
function vetJobsLegacy(manifest) {
  // Array.isArray, not `|| []` (10 Aug 2026): a `jobs` that is an object/string used to
  // reach .filter and die as a bare TypeError. Anything not an array is zero jobs, and
  // zero jobs is now a refusal in run() below — loud beats obscure.
  const raw = manifest && manifest.jobs;
  const jobs = Array.isArray(raw) ? raw : [];
  const refused = jobs.filter(j => j.public_safe !== true);
  return { runnable: jobs.filter(j => j.public_safe === true), refused };
}

function vetJobs(manifest) {
  const raw = manifest && manifest.jobs;
  const jobs = Array.isArray(raw) ? raw : [];
  const refused = [], runnable = [];
  for (const j of jobs) {
    // LOCK 1 — the flag.
    if (j.public_safe !== true) { refused.push({ job: j, name: j.name, why: "no public_safe:true" }); continue; }
    // LOCK 2 — the evidence (10 Aug 2026, wire-audit). A flag is a CLAIM a human typed; the
    // command is what actually runs in a cloud log. This test is the same JSON-text test the
    // selftest has always run over the manifest — it just never ran over the job about to be
    // dispatched, so a manifest edited after the last green selftest was ungoverned.
    if (PERSONAL.test(JSON.stringify(j))) { refused.push({ job: j, name: j.name, why: "flagged public_safe but the job NAMES the personal lane" }); continue; }
    runnable.push(j);
  }
  return { runnable, refused };
}
// ============================================================================
// THE FAILURE TAIL — what a red run is ALLOWED to say about itself
// ----------------------------------------------------------------------------
// EXTRACTED AND FIXED 2 Sep 2026 (floor audit, bead af-wxx). This was three lines
// inside the default `exec` closure below, and it had ZERO test coverage: every
// selftest in this file injects `exec`, so the closure has never once been driven
// by a test. It is a function now for exactly that reason — the bite below drives
// THIS, not a copy of it.
//
// WHAT IT USED TO BE, verbatim, so the change is readable without git:
//     const lines = out.trim().split(/\r?\n/).filter((l) => l.trim());
//     const red = lines.filter((l) => /✗|(^|\s)FAIL(ED)?\b/u.test(l)).slice(0, 6);
//     const tail = [...red, "· · ·", ...lines.slice(-3)].join(" | ").slice(0, 650);
// Edited in place, not frozen as a *Legacy body: the three `*Legacy` freezes in
// this file are all EXPORTED or dispatch-selectable alternatives a caller can still
// choose, and this is neither — it is one private expression, and its own 12 Aug
// revision was made in place the same way, with the superseded behaviour kept in
// the comment above it. That comment is kept below, unchanged.
//
// MEASURED ON LIVE RUN 33596776404 (2 Sep 2026, read through the public check-runs
// annotations API — the ONE surface a signed-out reader can reach, since the logs
// endpoint answers 403 without admin rights and both the web log and the job
// summary need a sign-in). THREE DEFECTS, all in those three lines:
//   D1 · A PASSING LINE WAS ELIGIBLE. An assert prints "  ✓ <name>" or "  ✗ <name>"
//        (the assert helper in selftest() below), and the filter read the whole
//        line — so any ✓ whose PROSE contains ✗ or FAIL matched. On that run all
//        six slots went to passing asserts: "FAIL-CLOSED", "receipt ✗ with the
//        owner's error", "a ✗ says what could not be done", "a FAILED spool write",
//        "FAIL-OPEN". The annotation named five green checks and no failure.
//   D2 · THE ORGAN-NAMING LINE COULD NEVER MATCH. Every organ ends its selftest
//        with "<organ> selftest: N passed, M failed" — lowercase `failed`, and the
//        pattern is uppercase-only with no `i` flag. The single most identifying
//        line in the whole output was ineligible by construction.
//   D3 · THE CAP ATE THE TAIL. `.slice(0, 650)` was applied AFTER joining red +
//        separator + tail, so a long red block deleted the "· · ·" and the tail
//        with it — that run's annotation ends mid-word. And `.slice(0, 6)` kept the
//        FIRST six matches while the failure is always at the END of the output.
// CONSEQUENCE, and it is the whole reason this rung exists: after 469 runs of this
// lane, WHICH MEMBER KILLS IT HAS NEVER BEEN KNOWN. The bead could only say "red
// for the same pre-existing reasons" because no reachable surface ever named one.
//
// THE BUDGET IS NOT MOVED. 650 here and 700 in dispatchAll stay exactly as they
// are — this fixes ALLOCATION, not budget, and raising a cap to make something fit
// is how the last cap stopped being believed. The tail is RESERVED first and the
// red block spends what is left, so the red can never again eat the tail.
const TAIL_BUDGET = 650;          // unchanged since 12 Aug 2026 — see above
const LINE_CAP    = 180;          // per line; a member's NAME leads its line, so a
                                  // left-anchored clip always keeps the name
// A PASSING ASSERT IS NEVER EVIDENCE OF A FAILURE (D1). First non-space glyph "✓"
// ⇒ the line is a pass by construction, whatever its prose says. Nothing real is
// lost: a failure cannot print itself with a tick.
const isPassLine = (l) => /^\s*✓/u.test(l);
// STRICTLY MORE THAN BEFORE, never less (D2): the original uppercase FAIL/FAILED
// and ✗ tests are both kept verbatim, and the organ summary line is ADDED beside
// them. `[1-9]\d*` so a clean "0 failed" footer is not dragged in.
const isRedLine = (l) => !isPassLine(l)
  && (/✗|(^|\s)FAIL(ED)?\b/u.test(l) || /\b[1-9]\d*\s+failed\b/i.test(l));
const clipLine = (l, n = LINE_CAP) => (l.length > n ? l.slice(0, n - 1) + "…" : l);
// ── D3, ROUND 2 — CORRECTED BY THE LIVE RUN THAT PROVED ROUND 1 (2 Sep 2026) ──
// The first fix reserved the TAIL first, and the very next away-day run showed what that
// costs. Live run on 8c6dd2a, read back through the annotations API: no ✓ line survived
// (D1 held in production), but the red block came back EMPTY. Arithmetic, measured on that
// run: three clipped tail lines spent ~513 of the 650, the separator 11, leaving 126 — less
// than one clipped line — so every red was dropped and the annotation carried only the tail.
// Reserving the tail cured "the tail disappears" by creating "the failure disappears", which
// is the worse of the two. TWO THINGS ARE FIXED HERE, both measured on that run:
//   1 · THE CLAIM OUTRANKS THE CONTEXT. The red block is a claim — "these lines went red" —
//       and it is what the surface exists for. It is packed FIRST out of everything except a
//       floor kept for the tail, so a chatty tail can never again starve the line that names
//       the failure, and the tail can never vanish either.
//   2 · STRONG EVIDENCE OUTRANKS RECENT EVIDENCE. Recency alone was the wrong key: `out` is
//       `stdout + stderr` CONCATENATED, not interleaved, so "newest" means the end of stderr,
//       and on that run the three newest reds were brain's standing warnings ("the last 5 of
//       10 calls ALL FAILED") while the assert lines sit in stdout. A line carrying ✗ or an
//       organ's own "N failed" summary NAMES the member; a warning that merely contains the
//       word does not. Strong first, newest within each class.
const isStrongRed = (l) => !isPassLine(l) && (/✗/u.test(l) || /\b[1-9]\d*\s+failed\b/i.test(l));
// The tail's guaranteed minimum, and it is a SHARE, not a flat number: a flat 220 out of a
// 260-char budget left 29 for the claim, which is under one line — the same starvation this
// round exists to fix, just moved to small budgets. Caught by the ranking assert below.
const TAIL_FLOOR = 220;
const tailFloorFor = (budget) => Math.min(TAIL_FLOOR, Math.floor(budget / 3));
const SEP = " | · · · | ";
// Packs as many of `arr` as fit in `room`, in the order given, joined by " | ".
function packLines(arr, room) {
  const kept = [];
  let used = 0;
  for (const l of arr) {
    const c = clipLine(l);
    const cost = c.length + (kept.length ? 3 : 0);   // " | "
    if (used + cost > room) break;
    kept.push(c);
    used += cost;
  }
  return kept;
}
function failureTail(out, deps = {}) {
  const budget = deps.budget || TAIL_BUDGET;
  const lines = String(out).trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return "";
  // LAW PACK's SHAPE 4 asks whether "the last N rows" are being mistaken for "the RECENT rows"
  // without anything checking a time. There is no time here to check: these are the lines of a
  // child process that has already EXITED, and "the last three" means literally the last three
  // it printed. That is one of the three shapes judgeTrailingN's own comment says it cut before
  // the rule was trusted — "a process's captured OUTPUT" — and it is flagged here only because
  // that carve-out keys on the receiver's NAME (`.out`, `.stdout`, …) while this one is called
  // `lines`. Declared at the site, per the rule's own mechanism, and the baseline is NOT moved:
  // trailing-n stays frozen at 0.   law-waiver:trailing-n
  const tailAll = lines.slice(-3).reverse();                       // newest first, so a squeeze
  const redAll = lines.filter(isRedLine);                          // drops the OLDEST tail line
  const ranked = [...redAll.filter(isStrongRed).reverse(), ...redAll.filter((l) => !isStrongRed(l)).reverse()];
  const floor = tailAll.length ? tailFloorFor(budget) : 0;
  const redPart = packLines(ranked, Math.max(0, budget - floor - (tailAll.length ? SEP.length : 0))).join(" | ");
  const tailPart = packLines(tailAll, Math.max(0, budget - redPart.length - (redPart ? SEP.length : 0)))
    .reverse().join(" | ");                                        // …then back to reading order
  if (!redPart) return tailPart;
  if (!tailPart) return redPart;
  return redPart + SEP + tailPart;
}

async function run(deps = {}) {
  // deps.path lets the selftest drive a REAL file through this exact read (below), so the
  // absent-vs-broken split is proven end-to-end and not just at the helper.
  const path = deps.path || MANIFEST;
  let manifest = deps.manifest, badJson = null;
  if (manifest === undefined) { const r = readJson(path); manifest = r.json; badJson = r.badJson; }
  if (badJson) return { ok: false, badJson, why: `ci_manifest.json is PRESENT but is not valid JSON — ${badJson} · file: ${path} · fix the file, do not add one` };
  if (!manifest) return { ok: false, why: "no ci_manifest.json — nothing runs in the cloud without the manifest" };
  const { runnable, refused } = vetJobs(manifest);
  // The refusal now carries WHICH lock each job tripped — with two locks, "lack public_safe:true"
  // would be a wrong diagnosis half the time, and a wrong diagnosis in a CI log costs an hour.
  if (refused.length) return { ok: false, refused: refused.map(j => j.name), why: `REFUSED: ${refused.map(j => `${j.name} (${j.why})`).join(" · ")} — the away-day runner does not negotiate` };
  // A GREEN RUN THAT RAN NOTHING (10 Aug 2026, wire-audit). This returned ok:true with
  // ran:[] for ANY manifest carrying no runnable jobs — `jobs: []`, a typo'd key (`job:`),
  // a `jobs` that is not an array, or `{}` — so `node scripts/awayday.mjs run`, which IS
  // the entire CI lane (.github/workflows/awayday.yml:29), printed "awayday: ran " and
  // exited 0 having verified nothing. Proven against an isolated copy before the fix:
  // {"jobs":[]}, {"job":[…]} and {} each -> {ok:true,ran:[]} with the injected exec counter
  // still at 0. The invariant was already written down — the selftest's "the real manifest
  // … runnable.length >= 1" below — but that assertion executes only INSIDE
  // `npm run organism:selftest`, i.e. inside a job that did not run: the guard lived inside
  // the thing it guarded and could never fire in the one case it exists for. Same invariant,
  // no new number (>=1 is that assertion's own bar), moved AHEAD of the jobs where an empty
  // manifest fails the run. To pause CI deliberately, disable the workflow — never by
  // emptying the manifest, which is indistinguishable from a manifest someone broke.
  if (!runnable.length) return { ok: false, empty: true, why: "NOTHING TO RUN: ci_manifest.json declares no public-safe jobs (empty jobs[], missing or typo'd key, or jobs not an array) — a cloud run that executes zero jobs is not a pass, it is an untested push" };
  // THE OPEN LOCK, NAMED IN THE LOG (10 Aug 2026, wire-audit). Read live from git and printed
  // BEFORE a single job dispatches, so the CI log leads with what this checkout is actually
  // carrying instead of a header's stale promise. Carried out in the result too — a read that
  // reaches no consumer is the exact defect this repair exists for.
  const exp = deps.exposure !== undefined ? deps.exposure : exposure(deps);
  (deps.log || console.error)(`awayday: ${exp.line}`);
  // CAPTURE + RELAY (12 Aug 2026, E1). This was execSync with stdio "inherit", so a red
  // job's own last lines — the ONLY place the failing selftest is NAMED — existed solely
  // inside the runner's log, which needs a GitHub sign-in to read. Three E1 causes in a
  // row had to be reproduced blind at home because of it (and the third, still open when
  // this landed, is machine-locale-shaped and CANNOT be reproduced at home: Node on this
  // laptop is en-IN, the runner en-US, and LC_ALL does not override ICU on Windows). The
  // child's output is captured, relayed verbatim to stderr (the CI log is unchanged), and
  // on failure its TAIL rides the thrown message one-lined — which dispatchAll records as
  // `why` and ciAnnotate lifts into the public Annotations panel, the one surface an
  // unauthenticated curl can already read (proven 12 Aug, commit cd32886).
  const exec = deps.exec || ((cmd) => {
    const r = spawnSync(cmd, { shell: true, encoding: "utf8", cwd: join(__dirname, ".."), timeout: 1200000, maxBuffer: 64 * 1024 * 1024 });
    const out = (r.stdout || "") + (r.stderr || "");
    if (out) process.stderr.write(out);
    if (r.error) throw new Error(`spawn failed: ${String(r.error.message || r.error)}`);
    if (r.status !== 0) {
      // FAILING LINES FIRST, tail second (12 Aug 2026, round 2): the first tail
      // was the last 8 lines blind, and brain's selftest prints its FOOTER plus
      // two standing ntfy warnings after the one ✗ line that matters — so the
      // annotation carried everything except the failure. A red run's readable
      // surface must lead with the lines that went red.
      // The three lines that used to sit here are now failureTail() above — see the
      // header there for the three defects that made this print ✓ lines for 469 runs.
      const tail = failureTail(out);
      throw new Error(`exit ${r.status} · ${tail || "(no output)"}`);
    }
    return out;
  });
  const dispatch = deps.dispatch || (DISPATCH === "fail-fast" ? dispatchFailFastLegacy : dispatchAll);
  const d = dispatch(runnable, exec, deps.log || console.error);
  // ONE SHAPE OUT OF EITHER ENGINE. The frozen lane reports `failed` as a single name
  // string; the plan of record reports a list. Both are normalised here so the ledger in
  // main() — and ciAnnotate below, which has read `r.failed` as a string since it was
  // written — see exactly one shape whichever engine is selected.
  const failures = Array.isArray(d.failures) ? d.failures : (d.failed ? [{ name: d.failed, why: d.why }] : []);
  // NOT-RUN IS DERIVED, NEVER DECLARED: whatever was runnable and appears in neither the
  // passed nor the failed list was never attempted. Derived, so it holds for BOTH engines
  // and cannot drift — a job silently dropped from the lane IS the defect being closed.
  const named = new Set([...d.ran, ...failures.map((f) => f.name)]);
  const notRun = runnable.map((j) => j.name).filter((n) => !named.has(n));
  if (failures.length || notRun.length) return {
    ok: false, ran: d.ran, failures, notRun, exposure: exp,
    failed: failures.map((f) => f.name).join(", "),
    why: `${failures.length} of ${runnable.length} job(s) FAILED: ${failures.map((f) => `${f.name} (${f.why})`).join(" · ")}`
      + ` · PASSED: ${d.ran.length ? d.ran.join(", ") : "none"}`
      + (notRun.length ? ` · NOT RUN: ${notRun.join(", ")}` : ""),
  };
  return { ok: true, ran: d.ran, failures: [], notRun: [], exposure: exp };
}

// ── THE DISPATCH — every job RUN, every job NAMED (10 Aug 2026, wiring audit) ──
// July fixed HALF of this: it named the job that FAILED. It never named the jobs that then
// never happened, and it never ran them. Traced on an isolated copy with a 2-job manifest
// and job 1 failing: the complete output contained "organism-selftests" and the string
// "squad-selftests" appeared NOWHERE in it. So one red job silently dropped
// squad-selftests — 22 selftests carrying the whole learning loop (capture · forge_session
// · rejirah · python_state · widget · context_manifest · captains_call) — without one line
// saying they were gone. The lane reported on half the organism, and the half it dropped
// was the half he studies with.
// This is not a new ruling. package.json:_runner_law made exactly this call for the local
// suites on 6 Aug 2026 — "a net whose coverage silently SHRINKS when something breaks is
// the wrong shape" — and organism_test.mjs `suites()` is its implementation (every member
// run INDEPENDENTLY, all results reported). The cloud lane never got the fix. It has it
// now, and nothing is softened: a red job still fails the whole run.
// COST: none a green run does not already pay — on a green push both jobs ran anyway, so
// the worst case here IS the green-run duration (workflow timeout-minutes: 25, unchanged).
// Named, not buried (the fsrs.mjs review_unit precedent): flipping back is ONE edit here.
const DISPATCH = "all";   // "all" = plan of record · "fail-fast" = the frozen pre-10-Aug lane

// PLAN OF RECORD: attempt every runnable job, report all of them. `log` is injected by
// run() (deps.log || console.error) so a red-path selftest fixture never prints a fake
// JOB FAILED banner into a GREEN CI log — awayday's own selftest runs inside the very
// job the away-day CI runs.
function dispatchAll(runnable, exec, log = console.error) {
  const ran = [], failures = [];
  for (const j of runnable) {
    try { exec(j.run); ran.push(j.name); } catch (e) {
      // 700, not 200 (12 Aug 2026): the default exec now ends its message with the child's
      // output TAIL — the failing selftest's own last lines — and a 200-char cap cut that
      // tail off before the failing member's name. One line either way; the frozen legacy
      // dispatch below keeps its original 200.
      const why = String((e && e.message) || e).split("\n")[0].slice(0, 700);
      log(`\naway-day: JOB FAILED — "${j.name}"\n  command : ${j.run}\n  platform: ${process.platform} node ${process.version}\n  error   : ${why}\n  (the remaining job(s) still run — one red job must not hide the rest)`);
      failures.push({ name: j.name, why });
    }
  }
  return { ran, failures };
}

// FROZEN (layering law) — the pre-10-Aug dispatch loop, its own comment included. It
// produced every away-day result to date, so it stays readable and callable: a reader
// comparing the two behaviours must be able to run both. Kept, not deleted. ONE mechanical
// change, named here rather than hidden: `(deps.log || console.error)` became the injected
// `log` param, because the loop no longer sits inside run() and has no `deps` in scope.
// Behaviour is identical — same default (console.error), same everything else.
function dispatchFailFastLegacy(runnable, exec, log = console.error) {
  const ran = [];
  // NAME THE FAILING JOB (29 Jul 2026). A throw from execSync used to escape raw,
  // so a red run said only "Process completed with exit code 1" — with two jobs in
  // the manifest and 40+ selftests inside them, that pointed at nothing. This ran
  // red on every push for two weeks partly because the signal was unreadable.
  for (const j of runnable) {
    try { exec(j.run); } catch (e) {
      const why = String((e && e.message) || e).split("\n")[0].slice(0, 200);
      // deps.log (10 Aug 2026): awayday's own selftest runs INSIDE organism:selftest, which
      // is the job the away-day CI runs — so a red-path fixture printed a full 'JOB FAILED'
      // banner into every GREEN CI log, naming the real suite. A fake failure notice in the
      // one log this file exists to keep readable. Default is unchanged: console.error.
      log(`\naway-day: JOB FAILED — "${j.name}"\n  command : ${j.run}\n  platform: ${process.platform} node ${process.version}\n  error   : ${why}`);
      return { ok: false, failed: j.name, why, ran };
    }
    ran.push(j.name);
  }
  return { ok: true, ran };
}

// THE RED VERDICT MUST LEAVE THE RUNNER (10 Aug 2026, wire-audit). run() has set
// `failed: j.name` since 29 Jul and NOTHING has ever read it — not main() (which printed
// only r.why, a duplicate of the string already console.error'd above), not the workflow,
// not one grep in the repo. The failing job's name survived as free text and as nothing
// else: a producer with no consumer. There is no state file to write here and writing one
// would be deader still — the away-day lane runs in a CLOUD runner whose filesystem is
// thrown away at the end of the job and which the home organism never sees. The consumer
// that DOES exist in that runner is GitHub's own log parser: an `::error` workflow command
// is lifted into the run's Annotations panel, onto the commit, and into the red email —
// which is exactly where "which job died" is needed and exactly where it never arrived.
// Off a runner (GITHUB_ACTIONS unset) this emits nothing, so a local `run` keeps plain lines.
// Escapes per GitHub's workflow-command spec: messages escape % CR LF; property values
// additionally escape : and , (they are the parser's own delimiters).
const ciEscape = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const ciEscapeProp = (s) => ciEscape(s).replace(/:/g, "%3A").replace(/,/g, "%2C");
function ciAnnotate(r, env = process.env, out = console.error) {
  if (!r || r.ok !== false) return null;              // a green run has no verdict to carry
  if (env.GITHUB_ACTIONS !== "true") return null;     // nobody is parsing off the runner
  const job = r.failed || (r.refused || []).join(", ") || "away-day";
  const line = `::error file=ci_manifest.json,title=${ciEscapeProp(`away-day: ${job}`)}::${ciEscape(r.why || "")}`;
  out(line);
  return line;
}

// ============================================================================
// THE READ-BACK — the house half (10 Aug 2026, wire-audit, second pass)
// ----------------------------------------------------------------------------
// THE DEAD WIRE: this organ was a PRODUCER WITH NO CONSUMER at the ORGANISM
// level. `grep writeFileSync|appendFileSync scripts/awayday.mjs` returned
// nothing and `grep -rn 'workflows|/actions/runs|ci_status|away-day' scripts/`
// returned comments only — no organ anywhere knew whether the cloud lane was
// green or red. 81 commits to main since 29 Jul, plus a nightly 03:00 IST cron
// (.github/workflows/awayday.yml:10), each fire that lane; a red one reached the
// captain ONLY as a Gmail subject line. The fossil is still in the repo:
// scripts/context.log:7 — "Run failed: away-day - main (fae9d47)". A red email
// is a REPORT TO READ, which the anchor law forbids, so in practice it was read
// by nobody: this check found the lane RED on HEAD (2c23168) and red on the
// commit before it, and the organism had no idea.
// WHY THE WATCHMAN CANNOT COVER IT: its nightly sweep runs the SAME suites
// LOCALLY, where the gitignored credentials and the full working tree exist. A
// failure that only happens in a clean cloud checkout is invisible to it by
// construction. That is the exact class of red this lane exists to catch.
// WHY A READ AND NOT A WRITE: ciAnnotate above is the cloud half and it is the
// most a runner can do — that runner's filesystem is thrown away and CI must
// never push home. So the verdict can only travel one way: the HOUSE reads it.
// NO CREDENTIAL: the repo is public, and GitHub's Actions API answers a public
// repo unauthenticated. This carries no token and therefore cannot leak one.
// WHO FIRES IT: groundsman.mjs's push lane (ArsenalFC-Groundsman-Push, daily
// 03:45), read-back FIRST and unconditional — last night's push is what produced
// the verdict now sitting on GitHub, and the cloud cron lands at 03:00, so the
// verdict read at 03:45 is ~45 minutes old, not a week.
// WHO CONSUMES IT: (1) on RED ONLY, ONE captains_call card at his next anchor. The
// card carries no exec — haan settles it and the session acts on his word. AI
// proposes, human approves; nothing here acts for him. Since 11 Aug 2026 the
// card also carries the failing run's URL on its `open` dispatch (--open), so
// his haan hands the session a link instead of a run number to look up.
// (2) physio.mjs reads awayday.json RAW and bleeds `away_day_lane_red` (and
// `away_day_read_blind` when the FETCH itself failed) into loop_vitals.json — the
// state surface dugout, manager, talk and bootroom already open — and carries this
// file on its stale table, so a read-back that stops FIRING is caught too. (3)
// /organism-doctor reads the verdict in its chart pass.
// CORRECTED 11 Aug 2026 (wire audit): (1) used to read "awayday.json, the machine-
// face record a session Claude reads whole". That consumer did not exist. Traced
// this run: the ONLY reader of this file anywhere in the repo was THIS file, taking
// two keys (carded_run_id, state) for its own card lock, while the lane sat RED on
// 8df28ba with its one card already dealt — thirteen of the fifteen fields written
// here reached no organ at all. And the card cannot cover it, because LOCK 1 makes
// it an EDGE by design: one card per run id, so a week-long red is silent after the
// first. physio's bleed is what persists, and it self-clears on green. The selftest
// below holds that read by source — delete it and this organ is a black box again.
// ============================================================================

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";      // per-pid, same scar capture.mjs:319 fixed
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// FROZEN VERBATIM (LAYERING law) — the pre-11-Aug reader, its comment included. Frozen rather
// than edited away because this function is EXPORTED: a caller outside this file that expected a
// bare string-or-null can still read exactly what it used to get, sitting next to the reason the
// shape changed. Kept in-file, uncalled, like vetJobsLegacy and dispatchFailFastLegacy above.
// The slug is READ from the remote, never hardcoded — a fork or a rename must
// not leave this silently polling somebody else's repo.
function repoSlugLegacy(deps = {}) {
  const git = deps.gitRemote || (() => execFileSync("git", ["remote", "get-url", "origin"],
    { encoding: "utf8", windowsHide: true, cwd: join(__dirname, ".."), timeout: NET_TIMEOUT_MS }));
  try {
    const m = String(git()).trim().match(/github\.com[:/]+([^/]+)\/(.+?)(?:\.git)?$/i);
    return m ? `${m[1]}/${m[2]}` : null;
  } catch { return null; }
}

// The slug is READ from the remote, never hardcoded — a fork or a rename must
// not leave this silently polling somebody else's repo.
// TELL "ABSENT" FROM "BROKEN", FOR GIT TOO (11 Aug 2026, wire-audit). Returns
// { slug, gitError }: gitError is null unless the git call ITSELF failed — not on PATH, a
// 120s timeout, not-a-repo. The frozen lane above swallowed all three into the SAME null a
// gitlab remote returns, and its one caller could not tell them apart. This is not a new
// invention: it is readJson's shape (:65), which split exactly this confusion for the
// manifest on 10 Aug — "there is no github remote" and "git could not answer" are different
// facts, and only one of them means there is no cloud lane to read back. Both still yield
// slug:null, so the parse contract is unchanged; the caller now reads gitError beside it.
function repoSlug(deps = {}) {
  const git = deps.gitRemote || (() => execFileSync("git", ["remote", "get-url", "origin"],
    { encoding: "utf8", windowsHide: true, cwd: join(__dirname, ".."), timeout: NET_TIMEOUT_MS }));
  let out;
  // ONLY the exec is inside the try — the regex below cannot throw, and leaving it in the
  // catch's reach is what let an exec failure masquerade as a parse miss in the first place.
  try { out = String(git()); }
  catch (e) { return { slug: null, gitError: String((e && e.message) || e).split("\n")[0].slice(0, 160) }; }
  const m = out.trim().match(/github\.com[:/]+([^/]+)\/(.+?)(?:\.git)?$/i);
  return { slug: m ? `${m[1]}/${m[2]}` : null, gitError: null };
}

// GitHub's own vocabulary, not ours: `status` says whether it finished,
// `conclusion` says how. RED is only what GitHub itself calls a failure —
// "cancelled"/"skipped"/"neutral" are human or no-op outcomes and are reported
// verbatim but never carded. Anything still in flight is not a verdict at all.
const RED_CONCLUSIONS = ["failure", "timed_out", "startup_failure"];

// ============================================================================
// EVERY LANE, NOT ONE LANE (2 Sep 2026, floor audit · bead af-7fn)
// ----------------------------------------------------------------------------
// WHAT WAS FOUND, by grep, on 2 Sep: `.github/workflows/suite.yml` — THE NEUTRAL
// BASELINE MACHINE, commissioned 1 Sep as the blueprint's rung 0.4 — was RED on
// BOTH matrix legs (136 passed / 7 failed, node 22 and node 24) and
// `grep -rn "suite\.yml"` over the whole repo matched exactly one thing: the git
// index. No organ, script, skill or package.json entry read it. This organ, the
// one built to read a cloud verdict back home, could not see it either, because
// WORKFLOW was a single hardcoded filename. suite.yml's own header says "A
// verdict nobody can reach is not a verdict"; it solved that for a signed-out
// HUMAN — it emits ::error annotations because the log endpoint 403s and the job
// summary needs a login — and for NO ORGAN at all.
// THE LIST IS READ FROM DISK, NEVER WRITTEN DOWN. A literal roster of lanes here
// would be the exact jugad LAW PACK's own rule refuses, and the same mistake
// W0-C's NO SHIM CALLEE ratchet was born from three days ago. A third workflow
// added tomorrow is read back the day it lands, with no edit in this file.
// ABSENT ≠ BROKEN, for the directory too: an unreadable workflows dir yields the
// away-day lane alone, so this can never silently read back nothing.
function workflowLanes(deps = {}) {
  const dir = deps.workflowDir || join(__dirname, "..", ".github", "workflows");
  let names = [];
  try { names = (deps.readdir || readdirSync)(dir).filter((f) => /\.ya?ml$/i.test(f)); }
  catch { return [WORKFLOW]; }
  if (!names.includes(WORKFLOW)) names.push(WORKFLOW);   // this organ IS awayday.yml's runner
  return names.sort();
}
function verdictOf(runRow) {
  if (!runRow) return { state: "unknown", why: "the lane has never run on main" };
  if (runRow.status !== "completed") return { state: "running", why: runRow.status || "in flight" };
  if (runRow.conclusion === "success") return { state: "green", why: "success" };
  if (RED_CONCLUSIONS.includes(runRow.conclusion)) return { state: "red", why: runRow.conclusion };
  return { state: "unknown", why: runRow.conclusion || "no conclusion" };
}

// `workflow` is a PARAMETER since 2 Sep 2026 (af-7fn) — it was WORKFLOW, closed over, which is
// what made this reader blind to every lane but its own. The default keeps every existing caller
// and every injected fixture working unchanged.
async function fetchLatestRun(slug, deps = {}, workflow = WORKFLOW) {
  if (deps.fetchRun) return deps.fetchRun(slug, workflow);
  // per_page=1 is not a tuned number: the endpoint is scoped to THIS workflow on
  // main, and the newest run is the only one whose verdict is current.
  const url = `https://api.github.com/repos/${slug}/actions/workflows/${workflow}/runs?branch=main&per_page=1`;
  const res = await fetch(url, {
    headers: { "user-agent": "arsenal-ai-fc-awayday", accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(NET_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText}`);
  const j = await res.json();
  return (j.workflow_runs || [])[0] || null;
}

// SILENCE MUST NEVER LOOK GREEN — ONE IMPLEMENTATION, TWO WAYS TO GO DARK (11 Aug 2026).
// Lifted verbatim out of the fetch path below so the git path cannot drift from it. A laptop
// that could not complete the read keeps the LAST KNOWN verdict character-for-character and
// stamps the failed read beside it with the hour it failed: an unreachable check is not
// evidence of a passing lane, and overwriting a red with a blank would be worse than not
// checking at all. The `checked_at` move is the load-bearing half — a stale timestamp under a
// verdict nobody re-read is exactly how "the lane is fine" gets believed for a week.
function keepLastKnown(prior, now, unreachable, write) {
  const next = { ...(prior || { version: 1, state: "unknown" }), checked_at: now.toISOString(), unreachable };
  (write || ((o) => writeAtomic(STATE, o)))(next);
  return next;
}

async function checkLane(deps = {}) {
  const now = deps.now || new Date();
  const prior = deps.prior !== undefined ? deps.prior : readJson(STATE).json;
  // A BROKEN GIT IS NOT AN ABSENT LANE (11 Aug 2026, wire-audit). This line read a bare
  // string-or-null, so a git EXEC failure arrived as the same null a gitlab remote returns and
  // the refusal below fired: no verdict stamp, no unreachable field, no card, no write at all.
  // Proven on this file's own exports BEFORE the fix:
  //   repoSlug({gitRemote:()=>{throw new Error('spawn git ENOENT')}}) === null   ← identical to
  //   repoSlug({gitRemote:()=>'git@gitlab.com:x/y.git'})             === null
  //   checkLane({slug:null,…}) → {ok:false,state:"unknown",carded:false}, injected write() never called
  // So one bad 03:45 — git off PATH, a 120s timeout, a half-cloned tree — left awayday.json
  // holding an OLD verdict under its OLD checked_at with `unreachable: null` beside it, which
  // reads as a check that ran and found nothing wrong. The fetch path fixed that shape at :370
  // and readJson fixed it at :57; git was the third door and it was still open.
  // deps.slug stays the selftest's direct seam and skips git entirely, so an injected fixture
  // can never manufacture a git error — the two paths are driven separately below.
  const { slug, gitError } = deps.slug !== undefined ? { slug: deps.slug, gitError: null } : repoSlug(deps);
  if (gitError) {
    const next = keepLastKnown(prior, now, `git could not be read here — ${gitError}`, deps.write);
    return { ok: false, state: next.state || "unknown", carded: false, unreachable: next.unreachable,
      why: `could not read origin's remote URL (${gitError}) — this is a MISSING READ, not an absent lane; last known verdict kept (${next.state || "unknown"})` };
  }
  // Genuinely no github remote: a fork or a rename, a permanent fact about this checkout and
  // not a failed read. It stays a refusal with no write — deliberately unchanged.
  if (!slug) return { ok: false, state: "unknown", carded: false, why: "no github remote on origin — there is no cloud lane to read back" };

  let runRow = null, unreachable = null;
  try { runRow = await fetchLatestRun(slug, deps); }
  catch (e) { unreachable = String((e && e.message) || e).slice(0, 160); }

  if (unreachable) {
    const next = keepLastKnown(prior, now, unreachable, deps.write);
    return { ok: false, state: next.state || "unknown", carded: false, unreachable, why: `could not reach GitHub — last known verdict kept (${next.state || "unknown"})` };
  }

  const v = verdictOf(runRow);
  const runId = runRow ? runRow.id : null;
  // LOCK 1 on duplicate cards lives HERE, in this file, which is what makes
  // awayday.json load-bearing rather than a log: the same red run never cards
  // twice, so a lane that stays red for a week is one card, not seven. LOCK 2 is
  // captains_call's own --key idempotency (LADDER B8) — two independent locks,
  // the same discipline as the groundsman's publish allowlist.
  //
  // ⚠ CORRECTED 2 Sep 2026 (af-7fn): THE LINE ABOVE STATED THE LAW AND THE CODE BELOW HAS NEVER
  // IMPLEMENTED IT. The test was `prior.carded_run_id !== runId` — a RUN id, not a red EPISODE —
  // so an unbroken red carded again on every new run id. MEASURED on his live captains_call the
  // day this was found: TWELVE `awayday:red:*` cards for one continuous red, against a comment
  // promising one. The suite lane made it impossible to leave alone: it fires on push to `**`
  // AND on pull_request, so per-run-id would have carded him once per push.
  // FIXED AS A CLASS, NOT A PATCH (his standing law — an issue is never the one instance): BOTH
  // lanes now card once when a lane ENTERS red, stay silent while it stays red, and re-arm on
  // green. Two different card laws inside one organ would be exactly the patch shape he refuses.
  // NOTHING IS HIDDEN BY THIS — it is the EDGE that got quieter, and the design already says the
  // edge was never the state: physio bleeds the red into loop_vitals for as long as it stands and
  // self-clears on green (see awayDayRead's header there, and the WHO CONSUMES IT block above).
  // `red_since` is the episode's own stamp, so "carded" can never again mean "carded for a run".
  const wasRed = !!(prior && prior.state === "red");
  const shouldCard = v.state === "red" && runId !== null && !(wasRed && prior.carded_run_id != null);

  const next = {
    version: 1,
    checked_at: now.toISOString(),
    repo: slug,
    workflow: WORKFLOW,
    state: v.state,
    why: v.why,
    run_id: runId,
    status: runRow ? runRow.status : null,
    conclusion: runRow ? runRow.conclusion : null,
    head_sha: runRow ? String(runRow.head_sha || "").slice(0, 7) : null,
    event: runRow ? runRow.event : null,
    ran_at: runRow ? runRow.updated_at : null,
    run_url: runRow ? runRow.html_url : null,
    // The episode's own two fields (af-7fn). `carded_run_id` keeps its NAME and its meaning for
    // every existing reader — the run whose red was carded — it simply stops being re-stamped by
    // each new run of the SAME red. Cleared on any non-red verdict, which is what re-arms the card.
    carded_run_id: v.state === "red" ? (shouldCard ? runId : (prior ? prior.carded_run_id ?? null : null)) : null,
    red_since: v.state === "red" ? ((wasRed && prior.red_since) || now.toISOString()) : null,
    unreachable: null,
  };

  // HOISTED out of the `if` below (af-7fn) so every lane files through the SAME door with the
  // same seam. Unchanged otherwise — still the owner's CLI, still no exec.
  const fileCardFn = deps.fileCard || ((l, k, u) => execFileSync(process.execPath,
    [join(__dirname, "captains_call.mjs"), "file", "--line", l, "--key", k, ...(u ? ["--open", u] : [])],
    { encoding: "utf8", windowsHide: true, cwd: join(__dirname, ".."), timeout: NET_TIMEOUT_MS }));

  let carded = false;
  if (shouldCard) {
    // OWNERS-ONLY (precedent: dugout.mjs shells doubtminer.mjs). This organ never
    // opens that organ's state file — it hands the ask to its own CLI, and the
    // selftest below asserts the path name appears nowhere in this function.
    const line = `away-day CI lane RED on ${next.head_sha} — the cloud clean-checkout is failing (run ${runId}). Dekh lein?`;
    const key = `awayday:red:${runId}`;
    // TRUNCATED AT THE DOOR (repaired 11 Aug 2026, wiring audit). The card used
    // to carry the run NUMBER and nothing else — next.run_url sat right here in
    // scope, `check` mode printed it, and the one sentence that actually reaches
    // him dropped it (live: c27 + c36, both dispatch `none`, both naming a bare
    // 11-digit run id). His haan then left the session with an integer to look
    // up in a state file no session opens — a command to remember, which the
    // ANCHOR LAW forbids. The URL now rides the card's `open` dispatch, so haan
    // prints the link the session reads. The LINE is unchanged: 140 chars is his
    // reading budget, and a URL spent half of it. Still no exec — captains_call
    // only PRINTS an `open` locator; nothing acts for him.
    try { fileCardFn(line, key, next.run_url); carded = true; }
    catch (e) {
      // A card that could not be filed must NOT be recorded as filed, or the red
      // never reaches him and lock 1 suppresses every retry after it.
      next.carded_run_id = prior ? prior.carded_run_id ?? null : null;
      next.card_error = String((e && e.message) || e).split("\n")[0].slice(0, 160);
    }
  }
  // ── EVERY OTHER LANE (af-7fn) ───────────────────────────────────────────────────────────
  // The away-day lane keeps the top level BYTE-FOR-BYTE — physio, /organism-doctor and this
  // organ's own card lock all read those fields by name, and layering means adding beside, never
  // moving (L9). Each other workflow's verdict lands under `lanes` in the SAME shape, so
  // physio's `awayDayRead` reads one of these without a second parser existing anywhere.
  // A LANE THAT CANNOT BE READ IS NAMED, NEVER SKIPPED: `unreachable` carries the reason and the
  // last known verdict is kept verbatim, which is the rule the away-day path already follows —
  // silence must never look green, and that is the whole reason this organ exists.
  const others = workflowLanes(deps).filter((w) => w !== WORKFLOW);
  const priorLanes = (prior && prior.lanes) || {};
  next.lanes = {};
  for (const wf of others) {
    const was = priorLanes[wf] || null;
    let row = null, laneUnreachable = null;
    try { row = await fetchLatestRun(slug, deps, wf); }
    catch (e) { laneUnreachable = String((e && e.message) || e).slice(0, 160); }
    if (laneUnreachable) {
      next.lanes[wf] = { ...(was || { state: "unknown" }), workflow: wf, checked_at: now.toISOString(), unreachable: laneUnreachable };
      continue;
    }
    const lv = verdictOf(row);
    const lid = row ? row.id : null;
    const laneWasRed = !!(was && was.state === "red");
    const laneShouldCard = lv.state === "red" && lid !== null && !(laneWasRed && was.carded_run_id != null);
    const lane = {
      workflow: wf, checked_at: now.toISOString(), state: lv.state, why: lv.why, run_id: lid,
      status: row ? row.status : null, conclusion: row ? row.conclusion : null,
      head_sha: row ? String(row.head_sha || "").slice(0, 7) : null,
      event: row ? row.event : null, ran_at: row ? row.updated_at : null, run_url: row ? row.html_url : null,
      carded_run_id: lv.state === "red" ? (laneShouldCard ? lid : (was ? was.carded_run_id ?? null : null)) : null,
      red_since: lv.state === "red" ? ((laneWasRed && was.red_since) || now.toISOString()) : null,
      unreachable: null,
    };
    if (laneShouldCard) {
      // The lane NAMES ITSELF in the line: with more than one lane, "CI lane RED" is a wrong
      // diagnosis half the time, and a wrong diagnosis in his one card costs him the sitting.
      const laneName = wf.replace(/\.ya?ml$/i, "");
      try {
        fileCardFn(`${laneName} CI lane RED on ${lane.head_sha} — the cloud verdict on this lane is failing (run ${lid}). Dekh lein?`,
          `awayday:red:${laneName}:${lid}`, lane.run_url);
        carded = true;
      } catch (e) {
        lane.carded_run_id = was ? was.carded_run_id ?? null : null;
        lane.card_error = String((e && e.message) || e).split("\n")[0].slice(0, 160);
      }
    }
    next.lanes[wf] = lane;
  }

  (deps.write || ((o) => writeAtomic(STATE, o)))(next);
  return { ok: true, state: v.state, why: v.why, run_id: runId, head_sha: next.head_sha, run_url: next.run_url, carded,
    lanes: next.lanes };
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const good = { jobs: [{ name: "selftests", run: "npm run organism:selftest", public_safe: true }] };
  const sneaky = { jobs: [{ name: "selftests", run: "x", public_safe: true }, { name: "biometric-sync", run: "node scripts/oura_coach.mjs" }] };

  const r1 = await run({ manifest: good, exec: () => {} });
  assert("flagged jobs run", r1.ok && r1.ran.includes("selftests"));
  let executed = false;
  const r2 = await run({ manifest: sneaky, exec: () => { executed = true; } });
  assert("ONE unflagged job → the WHOLE run refused, loudly, nothing executes", r2.ok === false && r2.why.includes("biometric-sync") && executed === false);
  assert("no manifest → nothing runs in the cloud", (await run({ manifest: null })).ok === false);
  // THE EMPTY-MANIFEST WIRE (10 Aug 2026). This assertion could not exist while the >=1 bar
  // lived only in the "real manifest" check below — that one runs INSIDE the very job an
  // emptied manifest would skip. These four drive run() directly, so they still fire in a
  // checkout whose manifest has been emptied, typo'd or malformed: exactly the case.
  let ranAnything = false;
  const countExec = () => { ranAnything = true; };
  const emptyShapes = [{ jobs: [] }, { job: [{ name: "selftests", run: "x", public_safe: true }] }, { jobs: { name: "selftests", public_safe: true } }, {}];
  const emptyResults = [];
  for (const m of emptyShapes) emptyResults.push(await run({ manifest: m, exec: countExec }));
  assert("ZERO runnable jobs (empty jobs[] · typo'd key · jobs not an array · bare {}) → the run FAILS, nothing executes — a green CI that ran nothing is the bug", emptyResults.every(r => r.ok === false && r.empty === true) && ranAnything === false);

  // THE ABSENT-VS-BROKEN WIRE (10 Aug 2026). Drives a REAL trailing-comma file through the
  // production read path. Before the fix this said "no ci_manifest.json" about a file sitting
  // on disk, and CI's only instruction was to add the file it already had. Written to the OS
  // temp dir — the repo is never touched, so this stays public-safe in a cloud runner.
  const bad = join(tmpdir(), `awayday_selftest_bad_${process.pid}.json`);
  const gone = join(tmpdir(), `awayday_selftest_absent_${process.pid}.json`);
  try {
    writeFileSync(bad, '{ "jobs": [ { "name": "a", "run": "x", "public_safe": true }, ] }', "utf8");
    const rBad = await run({ path: bad, exec: () => { throw new Error("a broken manifest must never reach a job"); } });
    assert("a PRESENT but malformed manifest is named as a parse error, not reported as missing",
      rBad.ok === false && !!rBad.badJson && /not valid JSON/.test(rBad.why) && !rBad.why.includes("no ci_manifest.json"));
    assert("the broken-manifest refusal names the file so the fix is hunted at the right door", rBad.why.includes(bad));
    const rGone = await run({ path: gone });
    assert("a genuinely ABSENT manifest still reads as absent (the two stay distinguishable)",
      rGone.ok === false && !rGone.badJson && rGone.why.includes("no ci_manifest.json"));
  } finally { rmSync(bad, { force: true }); rmSync(gone, { force: true }); }

  const realRead = readJson(MANIFEST);
  const real = realRead.json;
  assert("the REAL manifest parses — a stray comma here fails CI at this line, not three doors away", realRead.badJson === null && !!real);
  assert("the real manifest exists and every job is flagged", real && vetJobs(real).refused.length === 0 && vetJobs(real).runnable.length >= 1);
  assert("the real manifest contains no personal-file references", !JSON.stringify(real).match(/oura|readiness|reps_log|intake|hippocampus|transcript/i));

  // THE WIRE (10 Aug 2026). `failed` was an ORPHAN FIELD for twelve days — set on the red
  // path, read by nobody. These four fail the moment the red verdict stops reaching a
  // consumer, which is the only way to notice an orphan before the next audit finds it.
  const CI = { GITHUB_ACTIONS: "true" };
  const rFail = await run({ manifest: good, log: () => {}, exec: () => { throw new Error("boom: 3 tests failed"); } });
  const ann = ciAnnotate(rFail, CI, () => {});
  assert("a failed job's NAME reaches GitHub's log parser as a field, not free text",
    rFail.failed === "selftests" && typeof ann === "string" && ann.startsWith("::error ") && ann.includes("title=away-day%3A selftests") && ann.includes("boom"));
  assert("the refusal path carries its job names machine-readably too",
    Array.isArray(r2.refused) && r2.refused.includes("biometric-sync") && ciAnnotate(r2, CI, () => {}).includes("biometric-sync"));
  assert("off a runner nothing is annotated, and a green run never annotates",
    ciAnnotate(rFail, {}, () => {}) === null && ciAnnotate({ ok: true, ran: [] }, CI, () => {}) === null);
  assert("main()'s red path CALLS the emitter and names the failed job — the consumer runs, not just exists",
    (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
             const tail = src.slice(src.indexOf("async function main"));   // NOT a split on the mode string — this probe's own regex would match first
             return /ciAnnotate\(r\)/.test(tail) && /r\.failed/.test(tail); })());

  // ── THE FAILURE TAIL, BITTEN ON THE REAL THING (2 Sep 2026, floor audit · af-wxx) ──
  // The five ✓ lines below are VERBATIM from live away-day run 33596776404 (head 9f8d486),
  // read through the public check-runs annotations API. They are what the annotation
  // actually carried instead of the failure, for 469 runs. This fixture is the bite: it
  // drives failureTail() itself, not a copy of it, and every assert here is red on the
  // three-line expression this replaced.
  const LIVE_RED = [
    "  ✓ S13 RUNNER — TRANSITIVE, FAIL-CLOSED, ROOT NAMED: an unwritten brain_out input walks to the job whose `out` names that lane",
    "  ✓ take_note when the owner errors: routed:false on the row, receipt ✗ with the owner's error — never a fake done",
    "  ✓ the six thin act tools (set_agenda · set_preference · add_rule · queue_job · file_card · fire_mission) are declared and each is ONE dispatch; a ✗ says what could not be done",
    "  ✓ #wire: a FAILED spool write is never silent, and never sets the paid-and-waiting flag",
    "  ✓ C3.8 — FAIL-OPEN: an unreachable owner never blocks the lane",
    "  ✗ THE ONE THAT DIED: pacer.mjs refuses an open loop older than its own deadline",
    "",
    "pacer selftest: 41 passed, 1 failed",
  ].join("\n");
  const liveTail = failureTail(LIVE_RED);
  // THE TWO HALVES ARE JUDGED SEPARATELY, and that split is the finding itself. The RED
  // BLOCK is a claim — "these lines went red" — and quoting a green check there is the bug.
  // The TAIL is not a claim: it is the last three lines verbatim, showing where the output
  // stopped, and it may legitimately contain a ✓. Asserting "no ✓ anywhere" would have been
  // the easy assert and the wrong law.
  const liveRedBlock = liveTail.split(" | · · · | ")[0];
  assert("D1 — the RED BLOCK never quotes a PASSING assert, however much ✗ or FAIL its prose carries (five such lines filled every slot on live run 33596776404)",
    !liveRedBlock.includes("✓") && !liveRedBlock.includes("S13 RUNNER") && !liveRedBlock.includes("FAIL-OPEN"));
  assert("D1 — and the line that DID go red is named, which is the whole point of the surface",
    liveRedBlock.includes("✗ THE ONE THAT DIED") && liveRedBlock.includes("pacer.mjs"));
  assert("D2 — the organ's own summary line is captured: lowercase `failed` was ineligible under the uppercase-only pattern, and it is the single most identifying line in the output",
    liveRedBlock.includes("pacer selftest: 41 passed, 1 failed"));
  // The line still appears — in the TAIL, which quotes the last lines verbatim and is not a
  // claim. What must not happen is a RED BLOCK being built out of it, and the absence of the
  // "· · ·" separator is exactly how you tell: no separator means nothing was claimed red.
  assert("D2 — but a clean footer is not dragged in: `0 failed` produces NO red claim at all",
    !failureTail("everything fine\nrouter selftest: 12 passed, 0 failed").includes("· · ·"));
  assert("D3 — the tail and its separator survive a red block far bigger than the whole budget; they used to be deleted by the cap that was applied after the join",
    (() => { const big = failureTail([...Array(40)].map((_, i) => `  ✗ red number ${i} ` + "x".repeat(200)).join("\n") + "\nLAST LINE OF OUTPUT");
             return big.includes("· · ·") && big.includes("LAST LINE OF OUTPUT"); })());
  assert("D3 — when the reds do not all fit, the NEWEST survive and the oldest are dropped: in a fail-fast chain the failure is the last thing printed",
    (() => { const big = failureTail([...Array(40)].map((_, i) => `  ✗ red number ${i} ` + "x".repeat(200)).join("\n") + "\nLAST LINE OF OUTPUT");
             return big.includes("red number 39") && !big.includes("red number 0 "); })());
  // ── D3 ROUND 2, BITTEN ON THE LIVE RUN THAT EXPOSED ROUND 1 (2 Sep 2026) ──
  // These three tail lines are VERBATIM from the away-day annotation on 8c6dd2a — the run that
  // proved round 1 in production and, in the same breath, showed it had starved the red block:
  // three clipped tail lines spent ~513 of the 650 and every red was dropped.
  const STARVING_TAIL = [
    "  ✗ THE MEMBER THAT ACTUALLY DIED: reconcile.mjs refuses a ledger it cannot re-derive",
    "brain: ⚠ ntfy topic is set INSIDE brain_config.json — that file is COMMITTED to a public repo. Move it to env ARSENAL_NTFY_TOPIC or dressing-room/state/throwin_topic.txt (gitignored), and rotate the topic that is already public",
    "brain: ⚠⚠ DEAD BRAIN — the last 5 of 10 calls ALL FAILED. every recent brain call failed and no row named a status. Last error reads: validator: banned",
    "awayday: checkout exposure: 3 tracked personal-state file(s) ARE in this checkout — dressing-room/state/intake_log.json, dressing-room/state/readiness.json, dressing-room/state/reps_log.jsonl",
  ].join("\n");
  const starved = failureTail(STARVING_TAIL);
  assert("D3/2 — A CHATTY TAIL CAN NEVER STARVE THE FAILURE: on live run 8c6dd2a these exact three tail lines ate the whole budget and the red block came back EMPTY. The claim is packed first now, out of everything but the tail's floor",
    starved.includes("✗ THE MEMBER THAT ACTUALLY DIED") && starved.includes("reconcile.mjs"));
  assert("D3/2 — and the tail still survives beside it: curing 'the tail disappears' by making the failure disappear is the worse of the two bugs",
    starved.includes("· · ·") && starved.includes("awayday: checkout exposure"));
  assert("D3/2 — STRONG EVIDENCE OUTRANKS RECENT EVIDENCE: `out` is stdout+stderr CONCATENATED, so 'newest' is the end of stderr, where standing warnings live. A ✗ or an organ's own `N failed` NAMES the member; a warning that merely contains the word does not",
    // The law is ORDER, not exclusion: the weak red is still evidence and still belongs in the
    // block — it must simply never come before the line that names the member. Written as
    // "the weak one is absent" first, which was the third easy-assert of this rung and wrong
    // for the third time; the weak line is genuinely useful once it is not in the way.
    (() => { const t = failureTail("  ✗ the assert that died: turnstile refuses a stale clipboard\nnoise\nbrain: the last 5 of 10 calls ALL FAILED\nmore noise\nstill more noise", { budget: 260 });
             const block = t.split(SEP)[0];
             return block.includes("the assert that died")
               && block.indexOf("the assert that died") < block.indexOf("ALL FAILED"); })());
  assert("the budget is honoured, not merely re-spent — 650 is unchanged from 12 Aug 2026 and this rung moved no cap",
    failureTail([...Array(40)].map((_, i) => `  ✗ ` + "x".repeat(300)).join("\n")).length <= 650
    && /const TAIL_BUDGET = 650;/.test(readFileSync(fileURLToPath(import.meta.url), "utf8")));
  assert("empty or whitespace-only child output yields no tail at all, so the caller's `(no output)` fallback still fires",
    failureTail("") === "" && failureTail("   \n  \n") === "");
  assert("the default exec CALLS failureTail — the fix cannot be orphaned the way `failed` was for twelve days (the ciAnnotate probe pattern)",
    (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
             const closure = src.slice(src.indexOf("const exec = deps.exec ||"), src.indexOf("const dispatch = deps.dispatch"));
             return /failureTail\(out\)/.test(closure); })());

  // THE DROPPED-JOB WIRE (10 Aug 2026, wiring audit). run() returned on the FIRST red job, so
  // with the real 2-job manifest one red left squad-selftests — 22 selftests, the entire
  // learning loop — unrun AND unnamed: traced on an isolated copy, the string
  // "squad-selftests" appeared NOWHERE in the full output. These five fail the moment a job
  // can be dropped from the lane without a line saying so.
  const twoJobs = { jobs: [
    { name: "organism-selftests", run: "RED", public_safe: true },
    { name: "squad-selftests", run: "GREEN", public_safe: true },
  ] };
  const seen = [];
  const boom = (cmd) => { seen.push(cmd); if (cmd === "RED") throw new Error("boom: 3 tests failed"); };
  const rTwo = await run({ manifest: twoJobs, log: () => {}, exec: boom });
  assert("a RED first job does NOT stop the second — squad-selftests is actually RUN", seen.includes("GREEN"));
  assert("…and the verdict NAMES every job, the red one and the green one",
    rTwo.why.includes("organism-selftests") && rTwo.why.includes("squad-selftests") && rTwo.ran.includes("squad-selftests"));
  assert("…and the run still FAILS — carrying on is not softening the red",
    rTwo.ok === false && rTwo.failures.length === 1 && rTwo.failed === "organism-selftests");
  // The FROZEN lane, driven through the same door: it still stops at the first red (layering,
  // not deletion) and the door now DERIVES the name of what it skipped, so even a stopping
  // engine can no longer drop a job in silence.
  const rLegacy = await run({ manifest: twoJobs, dispatch: dispatchFailFastLegacy, log: () => {}, exec: boom });
  assert("the FROZEN fail-fast lane is kept AND the job it skips is now NAMED at the door (derived, not declared)",
    rLegacy.ok === false && !rLegacy.ran.includes("squad-selftests") && (rLegacy.notRun || []).includes("squad-selftests") && rLegacy.why.includes("NOT RUN"));
  assert("main()'s red path PRINTS the not-run ledger — the consumer runs, not just exists",
    (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
             const tail = src.slice(src.indexOf("async function main"));
             return /r\.notRun/.test(tail) && /NOT RUN/.test(tail); })());

  // ── THE READ-BACK WIRE (10 Aug 2026, second pass) ─────────────────────────
  // Every check below is fixture-driven: no network, no repo write, so this
  // stays safe inside the very CI job it is reading back. They fail the moment
  // the cloud verdict stops reaching the house — the defect this organ carried
  // for six weeks while the lane sat RED on HEAD.
  {
    const T = new Date("2026-08-10T04:00:00Z");
    const redRun = { id: 31359935125, status: "completed", conclusion: "failure", head_sha: "2c231686f11280614d2804debb4b4cfbdf7ccc26", event: "push", updated_at: "2026-08-10T05:52:15Z", html_url: "https://github.com/x/y/actions/runs/31359935125" };
    const greenRun = { ...redRun, id: 42, conclusion: "success" };
    // `readdir` is pinned to the away-day lane alone (af-7fn) so every assertion below keeps
    // testing exactly what it was written to test. Without it these would silently start
    // driving whatever workflows happen to be on disk — the fixture would drift with the repo,
    // which is the opposite of a fixture. The multi-lane behaviour gets its OWN block further
    // down, with its own explicit two-lane roster.
    const drive = async (runRow, prior, extra = {}) => {
      let wrote = null; const cards = [];
      const r = await checkLane({ now: T, slug: "nikhil1429/arsenal-ai-fc", prior, fetchRun: async () => runRow,
        readdir: () => [WORKFLOW],
        write: (o) => { wrote = o; }, fileCard: (l, k, u) => cards.push({ l, k, u }), ...extra });
      return { r, wrote, cards };
    };

    const red = await drive(redRun, null);
    assert("A RED CLOUD LANE REACHES THE HOUSE: the verdict is written to state AND one card is filed at his next anchor — the wire that did not exist while the lane sat red on HEAD",
      red.r.state === "red" && red.wrote.state === "red" && red.wrote.run_id === redRun.id && red.wrote.head_sha === "2c23168"
      && red.cards.length === 1 && red.cards[0].k === `awayday:red:${redRun.id}` && /RED/.test(red.cards[0].l));
    assert("the card rides the OWNER's CLI and carries no exec — haan settles it and the session acts on his word (AI proposes, human approves)",
      (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
               return src.includes("captains_call.mjs") && src.includes('"file", "--line"') && !/captains_call\.json/.test(src.slice(src.indexOf("async function checkLane"), src.indexOf("async function selftest"))); })());
    // TRUNCATED AT THE DOOR (11 Aug 2026). This is the assertion c27 and c36 did
    // not have: the run_url the state file records must be the run_url the CARD
    // carries. It fails if the door ever narrows back to line + key.
    assert("THE LINK REACHES HIM: the red card carries the run's URL, verbatim and identical to the one written to awayday.json — never a bare run number he has to look up",
      red.cards[0].u === redRun.html_url && red.wrote.run_url === redRun.html_url
      && red.cards[0].u.endsWith(String(redRun.id))
      // and the REAL door (not just the injected one) spells the owner's flag —
      // captains_call.mjs `file --open` is the other half of this contract, held
      // by its own selftest ("LOCATOR — …").
      && /"--open", u/.test(readFileSync(fileURLToPath(import.meta.url), "utf8")));

    const again = await drive(redRun, red.wrote);
    assert("LOCK 1 — the SAME red run never cards twice (a week-long red is one card, not seven), and awayday.json is what remembers it",
      again.cards.length === 0 && again.wrote.carded_run_id === redRun.id && again.wrote.state === "red");
    // ⚠ THIS ASSERT REPLACES ONE THAT ENCODED THE OPPOSITE LAW, and that is said out loud rather
    // than quietly rewritten. It read: "a NEW red run does card again — lock 1 dedups a run, it
    // never silences the lane", and it passed for three weeks while the lane dealt TWELVE cards
    // for ONE unbroken red — the exact thing the comment beside it promised would not happen.
    // The law it was protecting is "the lane can never go permanently silent", and that law is
    // NOT dropped: it is asserted below in the form that actually holds — green RE-ARMS the card
    // — and the standing red is carried by physio's bleed, which is asserted at the seam.
    const newRed = await drive({ ...redRun, id: 99, head_sha: "deadbee0000" }, red.wrote);
    assert("A NEW RED RUN INSIDE THE SAME RED DOES NOT CARD AGAIN — one card per red EPISODE, which is what the line above this always claimed and what the code never did (12 cards were dealt for one unbroken red)",
      newRed.cards.length === 0 && newRed.wrote.state === "red" && newRed.wrote.carded_run_id === redRun.id);
    assert("…and the EPISODE's own stamp is what makes that possible: red_since is set when the red opens and never re-stamped by a later run of the same red",
      red.wrote.red_since === T.toISOString() && newRed.wrote.red_since === red.wrote.red_since);
    const wentGreen = await drive(greenRun, newRed.wrote);
    assert("GREEN CLEARS THE EPISODE — carded_run_id and red_since both drop, which is what re-arms the card; a lane can never go permanently silent",
      wentGreen.wrote.state === "green" && wentGreen.wrote.carded_run_id === null && wentGreen.wrote.red_since === null
      && wentGreen.cards.length === 0);
    const redAgain = await drive({ ...redRun, id: 123 }, wentGreen.wrote);
    assert("…and the NEXT red after a green cards again — the silence is bounded by the red itself, never by time",
      redAgain.cards.length === 1 && redAgain.cards[0].k === "awayday:red:123");

    // ── EVERY LANE, NOT ONE LANE (af-7fn, 2 Sep 2026) ────────────────────────────────────
    // suite.yml was RED on both node legs and NO organ in the house could see it, this one
    // included. These fail the moment the read-back narrows back to a single lane.
    const twoLane = async (rows, prior) => {
      let wrote = null; const cards = [];
      await checkLane({ now: T, slug: "nikhil1429/arsenal-ai-fc", prior,
        readdir: () => ["awayday.yml", "suite.yml"],
        fetchRun: async (_s, wf) => rows[wf], write: (o) => { wrote = o; },
        fileCard: (l, k, u) => cards.push({ l, k, u }) });
      return { wrote, cards };
    };
    const bothRed = await twoLane({ "awayday.yml": redRun, "suite.yml": { ...redRun, id: 777, head_sha: "5uitered0000", html_url: "https://github.com/x/y/actions/runs/777" } }, null);
    assert("A SECOND CLOUD LANE REACHES THE HOUSE: suite.yml's verdict is written under `lanes`, in the SAME row shape, so physio reads it with awayDayRead and no second parser exists anywhere",
      bothRed.wrote.lanes["suite.yml"].state === "red" && bothRed.wrote.lanes["suite.yml"].run_id === 777
      && bothRed.wrote.lanes["suite.yml"].head_sha === "5uitere" && bothRed.wrote.lanes["suite.yml"].workflow === "suite.yml");
    assert("the away-day lane keeps the TOP LEVEL byte-for-byte — physio, /organism-doctor and this organ's own card lock all read those fields by name, so the new lanes are added BESIDE, never in place of (L9)",
      bothRed.wrote.state === "red" && bothRed.wrote.run_id === redRun.id && bothRed.wrote.workflow === WORKFLOW
      && bothRed.wrote.run_url === redRun.html_url);
    assert("each red lane NAMES ITSELF in its own card — with more than one lane, 'CI lane RED' is a wrong diagnosis half the time, and a wrong diagnosis in his one card costs him the sitting",
      bothRed.cards.length === 2 && bothRed.cards.some((c) => c.k === "awayday:red:suite:777" && /^suite CI lane RED/.test(c.l))
      && bothRed.cards.some((c) => c.k === `awayday:red:${redRun.id}`));
    const stillBothRed = await twoLane({ "awayday.yml": { ...redRun, id: 2 }, "suite.yml": { ...redRun, id: 888 } }, bothRed.wrote);
    assert("the episode law holds PER LANE, not globally — new run ids on both, still red on both, ZERO further cards",
      stillBothRed.cards.length === 0 && stillBothRed.wrote.lanes["suite.yml"].carded_run_id === 777);
    const suiteBlind = await twoLane({ "awayday.yml": redRun, get "suite.yml"() { throw new Error("getaddrinfo ENOTFOUND api.github.com"); } }, bothRed.wrote);
    assert("A LANE THAT CANNOT BE READ IS NAMED, NEVER SKIPPED: the failure is stamped on the row and the last known verdict is kept verbatim — silence must never look green, which is the whole reason this organ exists",
      /ENOTFOUND/.test(suiteBlind.wrote.lanes["suite.yml"].unreachable || "")
      && suiteBlind.wrote.lanes["suite.yml"].state === "red" && suiteBlind.wrote.lanes["suite.yml"].run_id === 777);
    assert("THE LANE LIST IS READ FROM DISK, NEVER WRITTEN DOWN — a workflow added tomorrow is read back the day it lands, and a literal roster here would be the exact jugad LAW PACK's own rule refuses",
      (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
               const fn = src.slice(src.indexOf("function workflowLanes"), src.indexOf("function verdictOf"));
               return /readdir/.test(fn) && !/["']suite\.ya?ml["']/.test(fn)
                 && workflowLanes({ readdir: () => ["a.yml", "b.yaml", "notes.md"] }).join() === "a.yml,awayday.yml,b.yaml"; })());
    assert("…and an UNREADABLE workflows directory yields the away-day lane alone, so this can never silently read back nothing (absent ≠ broken, for the directory too)",
      workflowLanes({ readdir: () => { throw new Error("ENOENT"); } }).join() === WORKFLOW);
    assert("main()'s check mode PRINTS every lane, not just the first — a lane that is read but never printed is the same silence this rung came from (the groundsman relays this block into the push log)",
      (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
               const tail = src.slice(src.indexOf("async function main"));
               return /r\.lanes/.test(tail) && /Object\.entries/.test(tail); })());
    assert("physio bleeds the OTHER lanes into loop_vitals, named, and reads them with awayDayRead — the standing state this organ's own card is deliberately NOT (the card is an edge, the bleed is the state)",
      (() => { const p = readFileSync(join(__dirname, "physio.mjs"), "utf8");
               return /ci_lane_red/.test(p) && /awayDay\.lanes|awayDay && world\.awayDay\.lanes|world\.awayDay\.lanes/.test(p) && /awayDayRead\(raw\)/.test(p); })());

    const green = await drive(greenRun, red.wrote);
    assert("a GREEN lane writes the verdict and files NOTHING — he is never woken for good news",
      green.r.state === "green" && green.wrote.state === "green" && green.cards.length === 0);
    const flight = await drive({ ...redRun, status: "in_progress", conclusion: null }, null);
    const odd = await drive({ ...redRun, conclusion: "cancelled" }, null);
    assert("a run still in flight is not a verdict, and cancelled/skipped are reported but never carded",
      flight.r.state === "running" && flight.cards.length === 0 && odd.r.state === "unknown" && odd.cards.length === 0);

    const dark = await drive(null, red.wrote, { fetchRun: async () => { throw new Error("getaddrinfo ENOTFOUND api.github.com"); } });
    assert("SILENCE NEVER LOOKS GREEN: an unreachable check KEEPS the last known red verbatim and stamps the failed read beside it",
      dark.r.ok === false && dark.wrote.state === "red" && dark.wrote.run_id === redRun.id && /ENOTFOUND/.test(dark.wrote.unreachable) && dark.cards.length === 0);

    const cardDead = await drive({ ...redRun, id: 77 }, null, { fileCard: () => { throw new Error("captains_call exploded"); } });
    assert("a card that could NOT be filed is not recorded as filed — otherwise lock 1 would suppress every retry and the red would never reach him",
      cardDead.wrote.carded_run_id === null && /exploded/.test(cardDead.wrote.card_error));

    assert("the slug is READ from origin, never hardcoded — a fork must not poll somebody else's repo",
      repoSlug({ gitRemote: () => "https://github.com/nikhil1429/arsenal-ai-fc.git\n" }).slug === "nikhil1429/arsenal-ai-fc"
      && repoSlug({ gitRemote: () => "git@github.com:someone/other.git" }).slug === "someone/other"
      && repoSlug({ gitRemote: () => "not-a-remote" }).slug === null);
    assert("no remote → the check refuses instead of inventing a repo to poll",
      (await checkLane({ now: T, slug: null, prior: null, write: () => { throw new Error("must not write"); } })).ok === false);

    // ── THE GIT SILENCE (11 Aug 2026, wire-audit) ──────────────────────────
    // A git EXEC failure came back as the SAME null a gitlab remote returns, and the check
    // then returned before any write: a 03:45 pass on a laptop where git could not run left
    // the file's own last verdict standing under its old checked_at with `unreachable: null`
    // beside it — a stale red (or a stale green) reading as freshly confirmed. These four
    // fail the moment the two silences stop being told apart, or the broken one stops
    // stamping. The last one keeps the FROZEN reader honest per the layering law.
    assert("a git EXEC failure is NOT the same answer as a non-github remote — the reader names which one happened",
      repoSlug({ gitRemote: () => { throw new Error("spawn git ENOENT"); } }).gitError !== null
      && /ENOENT/.test(repoSlug({ gitRemote: () => { throw new Error("spawn git ENOENT"); } }).gitError)
      && repoSlug({ gitRemote: () => "git@gitlab.com:x/y.git" }).gitError === null
      && repoSlug({ gitRemote: () => "git@gitlab.com:x/y.git" }).slug === null);
    const T2 = new Date("2026-08-11T04:00:00Z");
    let gitWrote = null; const gitCards = [];
    const gitDark = await checkLane({ now: T2, prior: red.wrote,
      gitRemote: () => { throw new Error("spawn git ENOENT"); },
      fetchRun: async () => { throw new Error("the network must not be reached without a slug"); },
      write: (o) => { gitWrote = o; }, fileCard: (l, k) => gitCards.push({ l, k }) });
    assert("A BROKEN GIT IS STAMPED, NOT SWALLOWED: the last known red is kept verbatim, `unreachable` names git, and checked_at MOVES — a failed read must never leave a stale verdict looking freshly confirmed",
      gitDark.ok === false && !!gitWrote && gitWrote.state === "red" && gitWrote.run_id === redRun.id
      && /git could not be read/.test(gitWrote.unreachable) && /ENOENT/.test(gitWrote.unreachable)
      && gitWrote.checked_at === T2.toISOString() && gitWrote.checked_at !== red.wrote.checked_at
      && /MISSING READ/.test(gitDark.why) && gitCards.length === 0);
    let gitlabWrote = null;
    const noLane = await checkLane({ now: T2, prior: red.wrote, gitRemote: () => "git@gitlab.com:x/y.git", write: (o) => { gitlabWrote = o; } });
    assert("…and a GENUINELY absent lane (a non-github remote) still refuses without writing — the split is real, not both paths collapsed into one",
      noLane.ok === false && noLane.state === "unknown" && !noLane.unreachable && /no github remote/.test(noLane.why) && gitlabWrote === null);
    assert("the FROZEN pre-11-Aug reader is kept and still callable, returning the old bare shape it always did (layering, not deletion)",
      repoSlugLegacy({ gitRemote: () => "git@github.com:someone/other.git" }) === "someone/other"
      && repoSlugLegacy({ gitRemote: () => { throw new Error("spawn git ENOENT"); } }) === null);
    assert(`the workflow this organ reads back still exists at .github/workflows/${WORKFLOW} — a rename would leave the check polling a lane that is gone`,
      existsSync(join(__dirname, "..", ".github", "workflows", WORKFLOW)));
    assert("groundsman's push lane FIRES the read-back — a check nobody runs is the same dead wire in a new coat",
      /awayday\.mjs.{0,20}["']check["']/.test(readFileSync(join(__dirname, "groundsman.mjs"), "utf8")));
    // THE OTHER HALF OF THE SAME WIRE (11 Aug 2026, wire audit). The check above
    // proves the verdict is FETCHED; this proves it is READ. Until today nothing
    // read it: the card is one-per-run-id by design, so past that single card a red
    // lane was invisible to the whole body. physio.mjs is the consumer — it reads
    // this file raw, bleeds on red, and publishes the verdict to loop_vitals.json.
    // Held by source rather than by running physio (that writes loop_vitals.json,
    // and a selftest must not mutate a neighbour's state file), exactly as the
    // groundsman check above is held.
    {
      const physio = readFileSync(join(__dirname, "physio.mjs"), "utf8");
      assert("physio.mjs READS the verdict back into the body — the consumer this organ went six weeks without",
        /readJson\(join\(STATE_DIR,\s*"awayday\.json"\)\)/.test(physio) && /away_day_lane_red/.test(physio));
    }
  }

  // ── THE VANISHED FIRST LOCK (10 Aug 2026, wire-audit) ────────────────────────────────
  // The guard's stated FIRST lock stopped existing on 5 Aug (his D10 ruling) and three files
  // went on promising it for five days: this header, ci_manifest.json:2 and the workflow's own
  // comment. Nothing in code disagreed with them, because nothing in code had ever looked.
  // These five make the checkout readable, make the second lock real, and put the wording
  // itself under test.
  let leaked = false;
  const flaggedButPersonal = { jobs: [{ name: "nightly-bundle", run: "node scripts/repo_bundle.mjs && type dressing-room\\state\\readiness.json", public_safe: true }] };
  const rLeak = await run({ manifest: flaggedButPersonal, log: () => {}, exposure: { known: true, files: [], line: "" }, exec: () => { leaked = true; } });
  assert("LOCK 2 · a job FLAGGED public_safe whose command names the personal lane is refused anyway, and nothing executes — the flag is a claim, the command is the evidence",
    rLeak.ok === false && rLeak.why.includes("nightly-bundle") && /personal lane/.test(rLeak.why) && leaked === false);

  const trackedSample = ["dressing-room/state/readiness.json", "dressing-room/state/intake_log.json", "scripts/oura_coach.mjs", "package.json"];
  const eSeen = exposure({ tracked: trackedSample });
  assert("the checkout is READ, never assumed: tracked personal STATE is named, machinery that merely shares the word is not",
    eSeen.known === true && eSeen.files.length === 2 && eSeen.files.includes("dressing-room/state/readiness.json") && !eSeen.files.some(f => f.startsWith("scripts/")));
  assert("an unreadable git reports UNKNOWN, never a clean bill — an unnamed absence reads as a zero",
    exposure({ tracked: null }).known === false && /UNKNOWN/.test(exposure({ tracked: null }).line));
  assert("run() carries the checkout exposure out to its caller and prints it before any job — a read nobody can see is the defect this repair exists for",
    r1.exposure && r1.exposure.line && typeof r1.exposure.known === "boolean");

  // ── THE CLI DOOR (11 Aug 2026, wire-audit) ───────────────────────────────────────────
  // The four locks above all guard what happens AFTER a mode is recognised. Nothing
  // guarded the door itself: an unrecognised mode printed a hand-typed usage line and
  // exited 0 — measured, `node scripts/awayday.mjs runn` → exit 0, zero jobs. Both ends
  // of this organ are a single string in someone else's file (the workflow's `run`, the
  // groundsman's `check`), so a rename on either end failed OPEN. These four fail the
  // moment that can happen again. See THE MODE TABLE at main() for the whole story.
  {
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const mainTail = src.slice(src.indexOf("async function main"));
    // Assembled from fragments, exactly like the rot guard below: written out whole this
    // pattern would match its own source line and capture a mode that does not exist.
    const branches = [...mainTail.matchAll(new RegExp("mode " + '=== "([a-z]+)"', "g"))].map(m => m[1]);
    assert(`the MODE TABLE and main()'s dispatch branches are the SAME SET — a mode cannot be advertised without existing, or exist without being advertised (branches: ${branches.join(", ") || "NONE"} · table: ${Object.keys(MODES).join(", ")})`,
      branches.length > 0 && branches.every(m => Object.hasOwn(MODES, m)) && Object.keys(MODES).every(m => branches.includes(m)));

    // Driven through the REAL CLI, not the function: the exit code IS the defect, and an
    // exit code cannot be asserted from inside the process that would have to exit.
    const cli = (args) => {
      try { return { code: 0, out: execFileSync(process.execPath, [fileURLToPath(import.meta.url), ...args], { encoding: "utf8", windowsHide: true, timeout: NET_TIMEOUT_MS, stdio: ["ignore", "pipe", "pipe"] }) }; }
      catch (e) { return { code: e.status ?? 1, out: String((e.stdout || "") + (e.stderr || "")) }; }
    };
    const typo = cli(["runn"]);
    const bare = cli([]);
    assert("A TYPO'D OR MISSING MODE FAILS THE LANE: both exit non-zero and say NOTHING RAN — before this they printed help and exited 0, so a renamed mode in awayday.yml or groundsman.mjs was a GREEN push that executed nothing",
      typo.code !== 0 && bare.code !== 0 && /unknown mode "runn"/.test(typo.out) && /NOTHING RAN/.test(typo.out) && /no mode given/.test(bare.out));
    assert("the usage the CLI prints is DERIVED from the table, so a live mode cannot stay undiscoverable — `exposure` was, from the day it shipped until this repair",
      Object.keys(MODES).every(m => typo.out.includes(m)) && typo.out.includes("exposure") && typo.out.includes(usageLine()));

    // BOTH ENDS OF THE WIRE, READ FROM THE FILES THAT HOLD THEM. The cloud half and the
    // house half each name a mode in a string this file cannot see; if either is renamed
    // or deleted, this is where it is caught — not in a green CI log that ran nothing.
    const callSites = [
      { file: join(__dirname, "..", ".github", "workflows", WORKFLOW), what: "the cloud half", re: /awayday\.mjs[ \t]+([a-z]+)/g },
      { file: join(__dirname, "groundsman.mjs"),                       what: "the house half", re: /awayday\.mjs"\)\s*,\s*"([a-z]+)"/g },
    ];
    const siteModes = [], broken = [];
    for (const s of callSites) {
      if (!existsSync(s.file)) { broken.push(`${s.what}: ${s.file.split(/[\\/]/).pop()} is GONE`); continue; }
      const hits = [...readFileSync(s.file, "utf8").matchAll(s.re)].map(m => m[1]);
      if (!hits.length) { broken.push(`${s.what}: no awayday call site left in ${s.file.split(/[\\/]/).pop()}`); continue; }
      for (const h of hits) { siteModes.push(`${s.what}=${h}`); if (!Object.hasOwn(MODES, h)) broken.push(`${s.what}: calls "${h}", which this file does not dispatch`); }
    }
    assert(`both call sites still exist AND still name a mode this file dispatches (${siteModes.join(" · ") || "NONE FOUND"})${broken.length ? " — BROKEN: " + broken.join(" · ") : ""}`,
      broken.length === 0 && siteModes.length >= 2);
  }

  // THE ROT GUARD. The defect repaired here was not a bug in a function — it was three files
  // promising a lock the captain had deliberately opened. This repo's scar tissue is full of
  // rot that got deleted and then re-typed verbatim (CLAUDE.md, audit #108: "exactly the rot
  // this same audit deleted … re-introduced two bullets above them"), so the WORDING is now
  // under test too. The patterns are ASSEMBLED FROM FRAGMENTS at runtime: written out whole
  // they would match this very file, and the guard would be red the day it was written.
  const rottedClaims = [["never leaves", " his house"], ["absent in ", "(this|a) (cloud )?checkout"], ["gitignored and ", "therefore absent"]];
  const awayFiles = [fileURLToPath(import.meta.url), MANIFEST, join(__dirname, "..", ".github", "workflows", "awayday.yml")];
  const scanned = awayFiles.filter(f => existsSync(f));
  const rot = [];
  for (const f of scanned) {
    const text = readFileSync(f, "utf8");
    for (const frag of rottedClaims) if (new RegExp(frag.join(""), "i").test(text)) rot.push(`${f.split(/[\\/]/).pop()} :: /${frag.join("")}/`);
  }
  assert(`no away-day file re-claims the vanished gitignore lock (${scanned.length}/${awayFiles.length} scanned)${rot.length ? " — FOUND: " + rot.join(" · ") : ""}`,
    scanned.length >= 2 && rot.length === 0);

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ── THE MODE TABLE (11 Aug 2026, wire-audit) ─────────────────────────────────
// WHY A TABLE AND NOT A STRING. main() ended with a hand-typed usage line and a
// bare `return`, so ANY unrecognised mode printed help and exited 0. The whole
// cloud lane is ONE step — .github/workflows/awayday.yml: `node scripts/awayday.mjs
// run` — and the house half is ONE spawn — groundsman.mjs: `awayday.mjs check`.
// A typo or a rename on either end therefore produced a GREEN push that executed
// zero jobs and told nobody: exactly the silent green this file already refuses one
// layer in, for an empty manifest (run(): "NOTHING TO RUN") and for an unparseable
// one (`list`). Proven before the fix: `node scripts/awayday.mjs runn` → the usage
// line, exit 0, nothing run.
// The rot was already visible in that line. `exposure` shipped as a live mode
// (dispatched below, advertised in the header) and the hand-typed string never
// learned about it — so the one command that names what a public clone of his repo
// carries was undiscoverable from the CLI. One table now feeds BOTH the dispatch
// guard and the printed usage: a mode cannot exist without being advertised, and
// cannot be advertised without existing. The selftest holds both directions.
const MODES = {
  run:      "execute the public-safe jobs — THE CLOUD HALF (.github/workflows/awayday.yml)",
  check:    "read the cloud lane's verdict back home — THE HOUSE HALF (groundsman's push lane)",
  list:     "print the runnable + refused jobs and this checkout's exposure",
  exposure: "print what a public clone of this checkout carries (read live from git)",
  selftest: "run this organ's own assertions",
};
const usageLine = () => `awayday.mjs — ${Object.keys(MODES).join(" | ")}`;

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  // THE REFUSAL — see THE MODE TABLE above. Exit 1, because a mode that dispatches
  // nothing is a lane that ran nothing, and no CI step or spawn may read that as a
  // pass. The typed word is echoed back: "unknown mode" without it costs the reader
  // the one thing they need to see the typo.
  if (!Object.hasOwn(MODES, mode)) {
    console.error(mode ? `awayday: unknown mode "${mode}" — NOTHING RAN.` : "awayday: no mode given — NOTHING RAN.");
    console.error(usageLine());
    for (const [m, what] of Object.entries(MODES)) console.error(`  ${m.padEnd(9)} ${what}`);
    process.exit(1);
  }
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "list") {
    // `list` used to print "0 public-safe job(s)" and exit 0 on an unparseable manifest —
    // a silent green over a broken guard file. It now fails, and names the parse error.
    const { json, badJson } = readJson(MANIFEST);
    if (badJson) { console.error(`awayday: ci_manifest.json is PRESENT but is not valid JSON — ${badJson} · file: ${MANIFEST}`); process.exit(1); }
    const { runnable, refused } = vetJobs(json);
    console.log(`awayday: ${runnable.length} public-safe job(s)${refused.length ? ` · ${refused.length} REFUSED — ${refused.map(j => `${j.name} (${j.why})`).join(" · ")}` : ""}`);
    console.log(`awayday: ${exposure().line}`);   // the human read tells the same truth as the CI log
    return;
  }
  // The checkout read on its own, for a session or a human asking what a cloud clone carries.
  if (mode === "exposure") { const e = exposure(); console.log(`awayday: ${e.line}`); process.exit(e.known ? 0 : 1); }
  if (mode === "run") {
    const r = await run();
    if (!r.ok) {
      ciAnnotate(r);                                  // the machine-readable verdict, to the only consumer a cloud runner has
      console.error(`awayday: ${r.why}`);
      // r.failed AND r.ran on the red path (10 Aug 2026). The old red line reprinted the
      // error string and stopped there: it never named the job as a field, and never said
      // which jobs had PASSED before the fall — with two suites in the manifest that is the
      // first thing you need to know before opening 40+ selftests.
      // THE LEDGER (10 Aug 2026, wiring audit). Every runnable job is named on the red path —
      // FAILED, PASSED, and NOT RUN. "passed before it" was only true while the lane stopped at
      // the first red; the dispatch now attempts every job, so a pass can land AFTER a failure
      // and "before it" would be a lie. NOT RUN is the line that never existed at all: it is
      // exactly what squad-selftests needed and never got.
      if (r.failed) console.error(`awayday: FAILED JOB — ${r.failed}`);
      console.error(`awayday: PASSED — ${(r.ran || []).length ? r.ran.join(", ") : "none"}`);
      if ((r.notRun || []).length) console.error(`awayday: NOT RUN — ${r.notRun.join(", ")} (named, so a dropped job is never silent)`);
      process.exit(1);
    }
    console.log(`awayday: ran ${r.ran.join(", ")}`);
    return;
  }
  if (mode === "check") {
    // THE HOUSE HALF. Exit code is deliberately 0 even on a red lane: the verdict
    // lives in awayday.json and on the card, and this is spawned by the
    // groundsman's push lane, which must never be failed by news it merely read.
    const r = await checkLane();
    const where = r.head_sha ? ` on ${r.head_sha}` : "";
    console.log(`awayday: cloud lane ${String(r.state).toUpperCase()}${where} — ${r.why}${r.carded ? " · card filed, it deals at his next anchor" : ""}`);
    if (r.state === "red" && r.run_url) console.log(`awayday: ${r.run_url}`);
    // EVERY OTHER LANE PRINTS TOO (af-7fn). The groundsman relays this block into the push log,
    // and a lane that is read but never printed is the same silence this rung came from.
    for (const [wf, lane] of Object.entries(r.lanes || {})) {
      const w = lane.head_sha ? ` on ${lane.head_sha}` : "";
      console.log(`awayday: ${wf} ${String(lane.state).toUpperCase()}${w} — ${lane.unreachable ? `NOT READ TODAY :: ${lane.unreachable} (verdict on disk is the last known one)` : lane.why}`);
      if (lane.state === "red" && lane.run_url) console.log(`awayday: ${lane.run_url}`);
    }
    return;
  }
  // UNREACHABLE BY CONSTRUCTION — a mode declared in the table with no branch above.
  // Loud, never a clean return: a half-added mode must not look like a run that worked.
  // The selftest asserts the table and the branches are the same set, so this line is
  // the runtime half of a check that also fails at test time.
  console.error(`awayday: mode "${mode}" is in the MODE TABLE but has no dispatch branch — half-added mode, NOTHING RAN`);
  process.exit(1);
}

// a failing job must FAIL the run with a clean line, never an unhandled-rejection stack
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(`awayday: FAILED — ${e && e.message ? e.message : e}`); process.exit(1); });

export { vetJobs, run, checkLane, verdictOf, repoSlug, failureTail, workflowLanes };
