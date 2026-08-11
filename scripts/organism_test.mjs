#!/usr/bin/env node
// ============================================================================
// organism_test.mjs · ARSENAL AI FC — THE CROSS-ORGAN TEST SUITE (6 Aug 2026)
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. Every organ owns a `selftest` and 61 of them are green. But a
// per-organ selftest can only ever assert what ONE file believes. Four defect classes
// live BETWEEN the organs, and by construction no organ's own selftest can see them:
//
//   1. COVERAGE — a selftest nobody runs. package.json:_selftest_coverage_law states
//      the rule in prose ("add it here in the same commit") and nothing enforced it.
//      Measured 6 Aug 2026: the four organs the audit #107 commit ADDED — rejirah,
//      python_state, widget, context_manifest — were in NO suite. The rule was written
//      down and then broken by the very next commit that touched the file.
//   2. CHAIN — `organism:selftest` is a && chain. brain.mjs sits at position 16 of 43,
//      so one red organ means the 27 organs AFTER it are never run at all, and the
//      suite reports "failed" rather than "27 unverified". A count that goes DOWN
//      when something breaks is the wrong shape for a net.
//   3. LAW DRIFT — the same law enforced by two writers, differently. The gut-word law
//      ("no gut-word, no rep") is hard-refused by capture.mjs and accepted-as-null by
//      rejirah.mjs. Each organ's selftest passes; the LAW is still broken.
//   4. HERMETICITY — "mock tests use no live credentials" (CLAUDE.md) says nothing
//      about live STATE. A selftest that writes into dressing-room/state corrupts the
//      thing it is meant to protect, and would do it silently.
//
// LAWS: READ-ONLY on dressing-room/state · spawns organs as CHILD PROCESSES (never
//   imports them, so a top-level side effect cannot leak in) · every assertion NAMES
//   the law it is holding · a RED here is a real defect, not a flaky net.
// CLI: node scripts/organism_test.mjs [all|coverage|integrity|laws|hermetic|path]
// ============================================================================
import { readFileSync, readdirSync, statSync, existsSync, cpSync, rmSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE = join(ROOT, "dressing-room", "state");
const NODE = process.execPath;

let pass = 0, fail = 0;
const fails = [];
const assert = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; fails.push({ name, detail }); console.log(`  FAIL ${name}${detail ? `\n         ${detail}` : ""}`); }
};
const section = (t) => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 66 - t.length))}`);

// run an organ as a child; never import (a top-level side effect must not leak in)
const run = (args, opts = {}) => {
  const r = spawnSync(NODE, args, { cwd: opts.cwd || ROOT, encoding: "utf8", timeout: opts.timeout || 120000, ...(opts.env ? { env: opts.env } : {}) });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
};

// This file is excluded from its own coverage check: it IS the suite, so it has no
// `selftest` mode to wire anywhere. Named here rather than filtered silently.
const SELF = "organism_test.mjs";
const scripts = () => readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs") && f !== SELF);
// 9 Aug 2026 (launch F1): also match a bare `function selftest(` — claudegen defines
// one and runs it as its whole CLI, and the quoted-string-only regex was blind to it.
const hasSelftest = (f) => { const src = readFileSync(join(ROOT, "scripts", f), "utf8"); return /['"`]selftest['"`]/.test(src) || /function selftest\(/.test(src); };

// ── 1. COVERAGE LAW ──────────────────────────────────────────────────────────
// The meta-test package.json's own prose asks for and never got.
function coverage() {
  section("COVERAGE LAW — a selftest nobody runs is a hypothesis, not a net");
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const suiteNames = ["organism:selftest", "squad:selftest"];
  const suites = suiteNames.map((n) => pkg.scripts[n] || "");
  assert("both named suites still exist in package.json", suites.every(Boolean));

  const inSuite = new Map();   // file -> how many suites name it
  suites.forEach((s) => {
    for (const m of s.matchAll(/scripts\/([A-Za-z0-9_\-]+)\.mjs/g)) {
      inSuite.set(m[1], (inSuite.get(m[1]) || 0) + 1);
    }
  });

  const withTest = scripts().filter(hasSelftest).map((f) => f.replace(/\.mjs$/, ""));
  const orphans = withTest.filter((f) => !inSuite.has(f));
  assert("EVERY organ with a selftest is wired into a suite (package.json:_selftest_coverage_law)",
    orphans.length === 0, orphans.length ? `orphaned: ${orphans.join(", ")}` : "");

  const dupes = [...inSuite].filter(([, n]) => n > 1).map(([f]) => f);
  assert("…and appears in EXACTLY one suite (no double-billing)", dupes.length === 0,
    dupes.length ? `in both suites: ${dupes.join(", ")}` : "");

  const ghosts = [...inSuite.keys()].filter((f) => !existsSync(join(ROOT, "scripts", f + ".mjs")));
  assert("no suite names an organ that no longer exists on disk", ghosts.length === 0,
    ghosts.length ? `ghosts: ${ghosts.join(", ")}` : "");

  // CHAIN SHAPE (defect class 2). The && chains are KEPT — they are the membership
  // record and a useful fast-fail — but they must not be the authority, because a red
  // at position 16 of 43 left 27 organs unrun AND unreported. The fix is that an
  // authoritative runner exists which runs every member independently.
  assert("an authoritative runner exists that does NOT short-circuit (`npm test`)",
    /organism_test\.mjs/.test(pkg.scripts.test || ""),
    "package.json has no `test` script pointing at the independent runner");
  const members = suiteMembers(pkg);
  // floor ratcheted 58 → 59 on 8 Aug 2026: benchmark.mjs (the outward loop) joined squad:selftest.
  // floor ratcheted 59 → 69 on 9 Aug 2026: harvest.mjs (P7, the Gemini harvest lane) joined
  // organism:selftest at a live count of 69 — the floor rides the real count, not the last edit.
  assert("the runner covers every member of both suites (coverage cannot shrink on a red)",
    members.length >= 69, `only ${members.length} members parsed out of the two suites`);
}

// the two suite strings stay the single membership record; the runner parses them
function suiteMembers(pkg) {
  const out = [];
  for (const n of ["organism:selftest", "squad:selftest"]) {
    for (const m of (pkg.scripts[n] || "").matchAll(/scripts\/([A-Za-z0-9_\-]+)\.mjs/g)) {
      if (!out.includes(m[1])) out.push(m[1]);
    }
  }
  return out;
}

// ── 1b. THE RUNNER — every member, independently, all results reported ───────
function suites() {
  section("SUITES — every member run INDEPENDENTLY (one red never hides the rest)");
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const members = suiteMembers(pkg);
  const red = [];
  for (const m of members) {
    const file = join(ROOT, "scripts", m + ".mjs");
    // test_coach_v2 is itself a harness and is invoked bare (package.json documents this)
    const r = run(m === "test_coach_v2" ? [file] : [file, "selftest"]);
    if (r.code !== 0) red.push({ m, tail: r.out.split(/\r?\n/).filter(Boolean).slice(-3).join(" | ") });
    console.log(`  ${r.code === 0 ? "ok  " : "FAIL"} ${m}`);
  }
  assert(`all ${members.length} suite members pass (every one RUN, not chained)`, red.length === 0,
    red.map((r) => `${r.m}: ${r.tail}`).join("\n         "));
}

// ── 2. STATIC INTEGRITY ──────────────────────────────────────────────────────
function integrity() {
  section("STATIC INTEGRITY — every organ parses, every state file parses");
  const bad = scripts().filter((f) => run(["--check", join(ROOT, "scripts", f)]).code !== 0);
  assert(`all ${scripts().length} organs parse under this Node (${process.version})`, bad.length === 0,
    bad.length ? `parse failures: ${bad.join(", ")}` : "");

  const badJson = [], badJsonl = [];
  for (const f of readdirSync(STATE)) {
    const p = join(STATE, f);
    if (!statSync(p).isFile()) continue;
    if (f.endsWith(".json")) { try { JSON.parse(readFileSync(p, "utf8")); } catch { badJson.push(f); } }
    else if (f.endsWith(".jsonl")) {
      const lines = readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean);
      for (const [i, l] of lines.entries()) { try { JSON.parse(l); } catch { badJsonl.push(`${f}:${i + 1}`); break; } }
    }
  }
  assert("every state .json parses (the bus is the contract between organs)", badJson.length === 0, badJson.join(", "));
  assert("every state .jsonl parses on every row (one bad row poisons a whole reader)", badJsonl.length === 0, badJsonl.join(", "));

  // ── 2b. THE DISCOVERY-PATH CONTRACT (wiring audit, 10 Aug 2026) ────────────
  // A fifth defect class, and it is the same shape as the four above: it lives
  // BETWEEN a doc and an organ, so no organ's own selftest can ever see it.
  // Six docs tell a session "read the surface from the CODE, never from here" and
  // hand it a literal command — e.g. talk/SKILL.md:39 `grep -n "MODES:"
  // scripts/capture.mjs`, MORNING_RUNBOOK.md:127 the same for postmatch. That
  // makes the `// MODES:` header a WIRE, not a comment: it is the only surface a
  // session following the documented path ever sees.
  // MEASURED THE DAY THIS WAS WRITTEN — three organs' headers had rotted behind
  // their own dispatch: capture.mjs omitted `rep` (audit #107's one-rep door, so
  // the documented path taught a capture that cannot bank a rep as it happens),
  // scout.mjs omitted `chrome-stamp` + the `missions` alias, postmatch.mjs omitted
  // `interview`. All three were live, all three invisible on the path the docs name.
  // DIRECTION IS DELIBERATE: dispatch ⊆ header only. The reverse (a header word
  // with no dispatch) was probed across all 74 organs and is unusable as a net —
  // default modes are fallthroughs, not `===` compares, and prose bleeds into the
  // token stream. A red here must be a real defect, so the noisy half is not run.
  const paths = discoveryPaths();
  const liars = [];
  for (const [organ, where] of paths) {
    const f = join(ROOT, "scripts", organ + ".mjs");
    if (!existsSync(f)) { liars.push(`${organ}.mjs — named by ${where.join(", ")}, but NO SUCH SCRIPT`); continue; }
    const src = readFileSync(f, "utf8");
    const blk = headerModesBlock(src);
    if (blk === null) { liars.push(`${organ}.mjs has NO "// MODES:" header, and ${where.join(", ")} greps for one`); continue; }
    const dispatched = argvModes(src);
    if (!dispatched) continue;   // no argv[2] dispatch to compare against
    // word-boundary match, hyphen-aware: `rep` must not be satisfied by `reps_log`
    const missing = [...dispatched].filter((t) => !new RegExp(`(^|[^a-z0-9_-])${t}([^a-z0-9_-]|$)`, "m").test(blk));
    if (missing.length) liars.push(`${organ}.mjs dispatches ${missing.join(", ")} — absent from its MODES header (${where.join(", ")} sends a session there)`);
  }
  assert(`the MODES header of all ${paths.size} organs a doc points a session at names EVERY mode that organ dispatches (a documented discovery path may not lie)`,
    liars.length === 0, liars.join("\n         "));

  // ── 2c. THE ARMING-DESTINATION CONTRACT (dead-wire pass, 11 Aug 2026) ──────
  // A sixth defect class of the same shape: an organ ARMS a brain trigger and
  // nothing on the other end ever fires. No organ's selftest can see it — the
  // arming lives in one file, the destination in a state file, and both are green.
  //
  // WHY THIS IS NOT "every arming has a declared consumer". A tracer filed exactly
  // that against postmatch.mjs (`brain.mjs trigger reanalysis`, every 30th matchday)
  // and it would have gone red on a CAPTAIN'S RULING: deep_reanalysis was un-gated
  // from trigger-only to nightly on 9 Aug 2026 (P1 unleash, his word), so the arming
  // has no consumer BY DESIGN and the re-read fires every overnight window instead —
  // strictly more often than the milestone it was armed for. brain_config's own
  // `_window_note` records it, and says re-gating is one edit. A net that reddens on
  // a deliberate, documented decision teaches sessions to ignore the net.
  // So the law held here is the one that actually matters: an arming must still REACH
  // the work it was armed for, which has exactly two legal shapes —
  //   (a) a job DECLARES the trigger (consumed on run: brain.mjs:2831), or
  //   (b) the P1-unleash shape — an enabled, UN-GATED job whose `out` is that name,
  //       which runs on its own schedule and supersedes the arming.
  // It goes red the day deep_reanalysis is disabled or deleted while postmatch still
  // arms it, the day formation_read loses its trigger while the conductor still arms
  // morning_signals, or the day a new arming is added with nothing on the far end.
  // Names are DERIVED from source, never listed here: a new arming joins the net by
  // existing. Both call shapes are matched — the brain.mjs CLI (postmatch) and
  // conductor.mjs's direct armTrigger(), which writes brain_queue.json itself.
  const armings = new Map();   // trigger name -> the organ that arms it
  for (const f of scripts()) {
    const src = readFileSync(join(ROOT, "scripts", f), "utf8");
    for (const m of src.matchAll(/"trigger",\s*"([a-z_]+)"/g)) armings.set(m[1], f);
    for (const m of src.matchAll(/\barmTrigger\(\s*"([a-z_]+)"/g)) armings.set(m[1], f);
  }
  const brainJobs = JSON.parse(readFileSync(join(STATE, "brain_config.json"), "utf8")).jobs || [];
  const orphaned = [];
  for (const [name, organ] of armings) {
    const consumer = brainJobs.find((j) => j.trigger === name);                             // (a)
    const superseder = brainJobs.find((j) => j.out === name && !j.trigger && j.enabled);    // (b)
    if (consumer && !consumer.enabled) orphaned.push(`${organ} arms '${name}' but its only consumer (${consumer.id}) is DISABLED — the arming is inert and nothing says so`);
    else if (!consumer && !superseder) orphaned.push(`${organ} arms '${name}' and NOTHING reaches it — no job declares that trigger, and no enabled un-gated job outs '${name}'`);
  }
  assert(`all ${armings.size} brain triggers armed anywhere in the organism reach live work (a declared consumer, or the un-gated job that supersedes it)`,
    orphaned.length === 0, orphaned.join("\n         "));

  // ── 2d. THE PRODUCER-CALLER CONTRACT (dead-wire pass, 11 Aug 2026) ─────────
  // A seventh defect class, same shape as 2b/2c and invisible to every organ's own
  // selftest: a WRITER that is the sole producer of a state field, whose CLI mode
  // nothing ever invokes. The organ is green, the readers are green, and the field
  // is null forever.
  //
  // THE SCAR THAT PUT THIS HERE. `course.mjs at <n>` is the only thing that writes
  // course.json's `current` + `current_at` (markCurrent — `done` deliberately leaves
  // the position where it was). It had ZERO callers: `grep -rn "course.mjs at"
  // --exclude-dir=.git` returned its own usage banner, learnstate.mjs's hint string
  // and doc prose; no hook, no skill, no scheduled task (`grep -i course setup/*.ps1`
  // → 0). So `current` was null from the 7 Aug ingest onward, `brief` could only ever
  // print "not started", the resume second never appeared, and learnstate.mjs's
  // 11 Aug PARKED-age tag was unreachable — the wire hid its own absence.
  //
  // WHY A TABLE AND NOT A DERIVED SWEEP, unlike 2b/2c. The derived question — "does
  // every CLI mode have a caller?" — is unusable as a net: most modes are meant to be
  // typed by a human or by a session, and the majority would go red on purpose. What
  // is checkable is the narrow case where a SPECIFIC producer's only legitimate caller
  // is a named surface, established once and then liable to be dropped. Entries are
  // added by whoever traces one, WITH the evidence, and each is two-sided so neither
  // half can rot alone: the organ must still dispatch the mode, and the surface must
  // still name it.
  const PRODUCER_CALLERS = [{
    organ: "course.mjs",
    mode: "at",
    // the caller is a SKILL, not an organ, on purpose: only the live session knows
    // which chapter he opened. An organ inferring it would be guessing on his behalf.
    callers: [".claude/skills/learn/SKILL.md"],
    names: /course\.mjs at\b/,
    field: "course.json `current` / `current_at`",
  }];
  const unwired = [];
  for (const p of PRODUCER_CALLERS) {
    const src = readFileSync(join(ROOT, "scripts", p.organ), "utf8");
    const modes = argvModes(src);
    if (!modes || !modes.has(p.mode)) {
      unwired.push(`${p.organ} no longer dispatches \`${p.mode}\`, but ${p.callers.join(", ")} still calls it — the caller now names a command that does not exist`);
      continue;
    }
    for (const c of p.callers) {
      const f = join(ROOT, c);
      if (!existsSync(f)) { unwired.push(`${c} is GONE — nothing calls \`${p.organ} ${p.mode}\`, so ${p.field} can never be written`); continue; }
      if (!p.names.test(readFileSync(f, "utf8"))) unwired.push(`${c} no longer names \`${p.organ} ${p.mode}\` — the ONLY producer of ${p.field} is back to zero callers (the 11 Aug scar)`);
    }
  }
  assert(`all ${PRODUCER_CALLERS.length} sole-producer command(s) are still both DISPATCHED by their organ and NAMED by the surface that calls them`,
    unwired.length === 0, unwired.join("\n         "));
}

// Which organs does a skill or runbook tell a session to discover by grepping its
// MODES header? Derived, never listed: the day a new skill names a new organ, that
// organ joins the net on its own. The generated repo bundle is skipped by NAME for
// the same reason repo_bundle.mjs:158 skips it — it inlines every script's source,
// so it matches everything and means nothing.
const BUNDLE_MD = "ARSENAL_FC_FULL_REPO_BUNDLE.md";
function discoveryPaths() {
  const docs = [];
  const skills = join(ROOT, ".claude", "skills");
  const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith(".md")) docs.push(p); } };
  if (existsSync(skills)) walk(skills);
  for (const f of readdirSync(ROOT)) if (f.endsWith(".md") && f !== BUNDLE_MD) docs.push(join(ROOT, f));
  const out = new Map();
  for (const p of docs) {
    const rel = p.slice(ROOT.length + 1).replace(/\\/g, "/");
    // same line, ≤80 chars between: a doc that says MODES and then names a script.
    for (const m of readFileSync(p, "utf8").matchAll(/MODES:[^\n]{0,80}?scripts\/([a-z0-9_]+)\.mjs/g)) {
      if (!out.has(m[1])) out.set(m[1], []);
      if (!out.get(m[1]).includes(rel)) out.get(m[1]).push(rel);
    }
  }
  return out;
}

// the header's MODES line plus its indented continuation lines (scout + postmatch wrap)
function headerModesBlock(src) {
  const lines = src.split(/\r?\n/);
  const i = lines.findIndex((l) => /^\/\/\s*MODES:/.test(l));
  if (i < 0) return null;
  let b = lines[i];
  for (let j = i + 1; j < lines.length && /^\/\/\s+\S/.test(lines[j]) && !/^\/\/\s*={4}/.test(lines[j]); j++) b += "\n" + lines[j];
  return b;
}

// modes the CLI actually accepts. The dispatch variable is LEARNED from its own
// `= process.argv[2]` assignment, then only literals compared against THAT name are
// collected — so an unrelated `model === "opus"` can never be mistaken for a mode.
function argvModes(src) {
  const m = src.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\(?\s*process\.argv\[2\]/);
  if (!m) return null;
  const region = src.slice(src.indexOf(m[0]));   // the entry block only, never the selftest above it
  const out = new Set();
  const re = new RegExp(`${m[1]}\\s*===\\s*"([a-z][a-z0-9_\\-]*)"`, "g");
  let x; while ((x = re.exec(region))) out.add(x[1]);
  return out;
}

// ── 3. CROSS-ORGAN LAW CONSISTENCY ───────────────────────────────────────────
// One law, two writers. Each organ's own selftest is green; the LAW can still be broken.
function laws() {
  section("LAW CONSISTENCY — the same law, held the same way by every writer");
  const sb = sandbox();
  try {
    // THE GUT-WORD LAW. CLAUDE.md + LEARNING_LAYER_MAP.md:424: "Gut-word nahi → rep nahi."
    const noGutRep = run([join(sb, "scripts", "capture.mjs"), "rep", "--concept", "x", "--axis", "a", "--q", "t", "--correct", "true"], { cwd: sb });
    assert("GUT-WORD LAW · capture.mjs REFUSES a rep with no gut-word (exit non-zero)", noGutRep.code !== 0);

    const badGut = run([join(sb, "scripts", "capture.mjs"), "rep", "--concept", "x", "--axis", "a", "--q", "t", "--gut", "maybe", "--correct", "true"], { cwd: sb });
    assert("GUT-WORD LAW · capture.mjs rejects a gut-word outside knew|shaky|guessed",
      /rejected 1|not knew\|shaky\|guessed/.test(badGut.out));

    const noGutGrade = run([join(sb, "scripts", "rejirah.mjs"), "grade", "embeddings", "a", "held"], { cwd: sb });
    assert("GUT-WORD LAW · rejirah.mjs holds the SAME law on a Re-Jirah round",
      noGutGrade.code !== 0,
      `rejirah accepted a round with no gut-word (exit ${noGutGrade.code}). capture.mjs refuses the identical omission — one law, two writers, two answers. The round still counts toward rounds/nextDue/FSRS history while producing ZERO calibration signal (rejirah.mjs:297 skips calibrationGap when gut is null).`);

    const badGutGrade = run([join(sb, "scripts", "rejirah.mjs"), "grade", "embeddings", "a", "held", "--gut", "maybe"], { cwd: sb });
    assert("GUT-WORD LAW · rejirah.mjs rejects an out-of-vocabulary gut-word", badGutGrade.code !== 0);

    // THE FOUR LEGAL QUESTION-MOMENTS (PROJECT_OS / CLAUDE.md: only four exist by design)
    const badMoment = run([join(sb, "scripts", "forge_session.mjs"), "moment", "pop_quiz"], { cwd: sb });
    assert("FOUR-MOMENTS LAW · forge_session refuses a question-moment outside the four", badMoment.code !== 0);
  } finally { rmSync(sb, { recursive: true, force: true }); }
}

// ── 4. HERMETICITY ───────────────────────────────────────────────────────────
// A selftest that writes into live state corrupts the thing it protects.
function hermetic() {
  section("HERMETICITY — a selftest must never touch dressing-room/state");
  const snap = () => {
    const m = new Map();
    const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); const s = statSync(p); if (s.isDirectory()) walk(p); else m.set(p, `${s.size}:${s.mtimeMs}`); } };
    walk(STATE); return m;
  };
  // Files written by LIVE DAEMONS are excluded — a diff there is the organism breathing,
  // not the test writing. Every name here was PROVEN daemon-written before being excluded,
  // by running all 61 selftests one at a time and stat-ing the file after each: zero
  // selftests touched any of them (6 Aug 2026). Their writers are the processes that are
  // actually up — brain.mjs (token_vitals), thalamus/dugout/distiller (workspace),
  // distiller/mcp-memory (working_set). Excluding a file WITHOUT that scan would be how a
  // real defect gets papered over, so the scan is the price of every future addition here.
  // ADDED 6 Aug 2026, and the scan above was RUN before adding them — not assumed.
  // This assertion was FLAPPING: it named throwin_state.json on one run and
  // teaching_contract.json on another, i.e. it was catching a poller and a hook that
  // happened to fire during the window, never a test write. That matters more than it
  // used to, because /organism-doctor now declares `npm test` the authority — so the
  // authority was crying wolf by default, which is how a real red gets ignored.
  //   · throwin_state.json     — the throw-in poller stamps last_poll_at on its own cadence
  //   · teaching_contract.json — the UserPromptSubmit hook increments the turn clock, and
  //                              teaching_audit stages drifts, both mid-run
  // PROOF (the price the header above sets for every addition): all 65 selftests were run
  // ONE AT A TIME with both files stat-ed before and after each. Neither file was touched
  // by a single selftest. Excluding them therefore hides no defect.
  // brain_ledger.jsonl + tanks.json added 7 Aug 2026, per this list's own proof
  // protocol (daemon-written, not selftest-written): the flagging run's writes were
  // dmn_rollout ledger rows stamped 00:23:43Z — INSIDE the suite window — from the
  // DMN whose hourly task had fired at 05:15 IST in that morning's wake catch-up
  // burst, with NightShift simultaneously mid-shift (both bill tanks via fuelboard
  // recordUse and append their own ledger rows; dmn.mjs:118 names brain_ledger a
  // shared append-only lane). No selftest bills the live board by design: fuelboard's
  // uses mem() fixtures, dmn/council/nightshift inject recordUse, distiller's T8
  // billing lives in defaultGen which selftests replace via deps.gen.
  // bg_queue.jsonl + wake_queue.jsonl + wake.json added 7 Aug 2026, per this list's own
  // proof protocol. STATIC PROOF: createNucleus (thalamus.mjs:592) has exactly TWO callers
  // in the repo — the selftest rig at :1178, which injects appendBgQueue/appendWakeQueue/
  // writeWake into in-memory arrays, and the DAEMON at :1925, which injects only `log` and
  // is therefore the ONLY path that can reach the disk-writing defaults at :597/:601/:603.
  // No selftest can write these three files. The daemon on :4113 writes them whenever a real
  // afferent is gated (M22 :804 "queued", :924 "returned") or the DMN posts a drained thought
  // back (:1024) — and .claude/settings.json fires hooks/afferent-post.mjs on EVERY
  // UserPromptSubmit and Stop, so ANY session running during a sweep feeds that gate. The
  // flagging run's rows were ONE real moment, m_1786109201204_1055369738: its id encodes
  // 13:26:41.204Z (matching its own ts), carrying a 14,763-char live spotlight suppressed as
  // "capped", then drained 14:15:15Z and returned 14:17:37Z — the organism breathing straight
  // through the suite window. It is also FLAPPING, which is the daemon-race signature: the
  // very next full run, same code, same machine, was green on hermeticity.
  // PROOF (the price this header sets): all 65 selftests were run ONE AT A TIME with the whole
  // state tree stat-ed after each. ZERO selftests touched dressing-room/state at all — these
  // three included. M14 (wake_queue) and M22 (bg_queue) added nucleus writers without updating
  // this list; that omission, not any test, is the defect. Excluding them hides nothing.
  // G6/G16 additions (9 Aug 2026): tone now writes every 5 min, the daemon
  // watchdog every 10, reminders/shadows every 1-10 — all LIVE tasks whose own
  // writes can race a multi-minute suite run. Their files join the exemption
  // for the same reason the originals did: a scheduled OWNER writing its OWN
  // state mid-suite is not a selftest leak.
  // G16 sliver (10 Aug 2026): distiller_latency.jsonl — the switch-to-read
  // latency journal, written by the same ArsenalFC-Distiller 15-min task that
  // already earned working_set.json its exemption above. STATIC PROOF (the
  // price this list sets): the one appendFileSync to it sits inside
  // distiller.mjs run(), which no selftest calls — distiller's own selftest
  // exercises detectSwitches/measureLatency/latencyReport on fixtures only
  // (same class as the createNucleus two-caller proof above).
  const LIVE_WRITERS = /afferent\.jsonl|salience_ledger\.jsonl|presence_log|recall_index|brain_queue|context_state|dossier\.json|pitch_read|token_vitals\.json|workspace\.json|working_set\.json|distiller_latency\.jsonl|throwin_state\.json|teaching_contract\.json|teaching_audit|brain_ledger\.jsonl|tanks\.json|bg_queue\.jsonl|wake_queue\.jsonl|wake\.json|tone\.json|daemon_watchdog\.json|dugout_reminders\.jsonl|shadow_log\.jsonl|mouth_log\.jsonl/;
  const before = snap();
  const targets = scripts().filter(hasSelftest);
  for (const f of targets) run([join(ROOT, "scripts", f), "selftest"]);
  const after = snap();

  const touched = [];
  for (const [p, v] of after) {
    if (LIVE_WRITERS.test(p)) continue;
    if (!before.has(p)) touched.push(`CREATED ${p.replace(STATE, "state")}`);
    else if (before.get(p) !== v) touched.push(`MODIFIED ${p.replace(STATE, "state")}`);
  }
  for (const p of before.keys()) if (!after.has(p) && !LIVE_WRITERS.test(p)) touched.push(`DELETED ${p.replace(STATE, "state")}`);
  assert(`running all ${targets.length} selftests leaves live state untouched`, touched.length === 0, touched.slice(0, 8).join("\n         "));

  // THE ONE SANCTIONED WRITE (6 Aug 2026). thalamus.mjs:1790 declares one deliberate
  // non-hermetic check: audit #10's whole claim is "the diagnostics now have somewhere
  // to land", and a test that never writes the file proves nothing about that. It calls
  // fileLog() IN-PROCESS — it does not reach the running daemon on :4113. So this does
  // not assert "no write"; it asserts the write stays INSIDE the organ's own gitignored,
  // size-rotated log and never touches the state bus. That is the line that matters.
  const tlog = join(ROOT, "scripts", "thalamus.log");
  const sizeOf = (p) => (existsSync(p) ? statSync(p).size : 0);
  const sBefore = snap();
  const tBefore = sizeOf(tlog);
  run([join(ROOT, "scripts", "thalamus.mjs"), "selftest"]);
  assert("the one sanctioned selftest write lands in the organ's OWN log, never on the state bus",
    sizeOf(tlog) >= tBefore && [...snap()].every(([p, v]) => LIVE_WRITERS.test(p) || sBefore.get(p) === v),
    "thalamus selftest wrote outside scripts/thalamus.log");
  assert("…and that log is gitignored, so a test run can never reach the public remote",
    run(["-e", `process.exit(require('child_process').execSync('git check-ignore -q scripts/thalamus.log && echo y || echo n',{cwd:${JSON.stringify(ROOT)}}).toString().trim()==='y'?0:1)`]).code === 0);
}

// ── 5. THE LEARNING PATH, END TO END ─────────────────────────────────────────
// The only question that matters: can he sit down and study today?
function path() {
  section("LEARNING PATH — the loop he actually uses, driven end to end");
  const sb = sandbox();
  const S = (f) => join(sb, "scripts", f);
  try {
    const start = run([S("forge_session.mjs"), "start", "e2e-probe", "--force"], { cwd: sb });
    assert("FORGE · a session opens", start.code === 0 && /e2e-probe/.test(start.out));

    const reopen = run([S("forge_session.mjs"), "start", "another"], { cwd: sb });
    assert("FORGE · an open session BLOCKS a second start (the coverage report is the only record)",
      reopen.code !== 0 && /close/.test(reopen.out));

    for (let i = 0; i <= 11; i++) run([S("forge_session.mjs"), "step", String(i)], { cwd: sb });
    for (const a of "abcdefghi") run([S("forge_session.mjs"), "axis", a, "done"], { cwd: sb });
    const close = run([S("forge_session.mjs"), "close"], { cwd: sb });
    const cov = JSON.parse(close.out.slice(close.out.indexOf("{"), close.out.lastIndexOf("}") + 1));
    assert("FORGE · all 12 steps are recorded (0-11)", cov.steps_pct === 100 && cov.steps_missed.length === 0);
    assert("FORGE · batch-marked axes are caught as UNGRADED, not counted as taught",
      cov.axes_ungraded.length === 9 && cov.axes_graded.length === 0);
    assert("FORGE · a 0.2-minute 'session' is reported as NOT method_clean (theatre is named)",
      cov.method_clean === false);
    assert("FORGE · the undriven widget gate is named (built is not driven)", cov.widget_gates < 2);

    // ── THE DEFERRED-CARRY WIRE (dead-wire repair, 11 Aug 2026) ──────────────
    // forge_session.mjs's LAWS promise deferred axes are reported "so Re-Jirah can pick
    // them up"; for weeks rejirah.mjs never read axes_deferred at all, and since its axis
    // universe is a LOCKED capsule's a-i, a defer on an unlocked concept (all 8 live rows
    // are `hallucinations`, unlocked) entered no queue anywhere. This drives the whole wire
    // end to end — forge WRITES the defer, rejirah READS it — so it breaks the moment the
    // two organs are disconnected again, which a same-file selftest alone cannot catch.
    run([S("forge_session.mjs"), "start", "e2e-defer", "--force"], { cwd: sb });
    run([S("forge_session.mjs"), "axis", "g", "defer"], { cwd: sb });
    run([S("forge_session.mjs"), "close"], { cwd: sb });
    const carry = run([S("rejirah.mjs"), "due"], { cwd: sb });
    assert("RE-JIRAH · a DEFERRED axis on an unlocked concept reaches the Re-Jirah queue (forge LAWS: 'deferred ≠ dropped')",
      carry.code === 0 && /DEFERRED, NOT DROPPED/.test(carry.out) && /e2e-defer/.test(carry.out) && /\bg · defend/.test(carry.out));
    assert("RE-JIRAH · the carry names it as UNLOCKED and invents no due-date for it (no lockedOn ⇒ no honest schedule)",
      /NOT LOCKED/.test(carry.out));

    const grade = run([S("rejirah.mjs"), "grade", "embeddings", "a", "held", "--gut", "knew"], { cwd: sb });
    assert("RE-JIRAH · a cold round grades and schedules the next due date", grade.code === 0 && /next due/.test(grade.out));

    const rclose = run([S("rejirah.mjs"), "close", "embeddings"], { cwd: sb });
    assert("RE-JIRAH · close prints the reJirahDone gist patch (HIS paste — nothing auto-saves)",
      rclose.code === 0 && /reJirahDone/.test(rclose.out));
    assert("RE-JIRAH · close REPORTS the successive-relearning criterion without BLOCKING",
      /successive-relearning/.test(rclose.out));

    const pend = run([S("rejirah.mjs"), "pending"], { cwd: sb });
    assert("RE-JIRAH · the closed round reads PENDING until the gist paste lands (proof, not assumption)",
      /embeddings/.test(pend.out) && /PENDING|pending|GIST|gist/.test(pend.out));

    const due = run([S("deep.mjs"), "due"], { cwd: sb });
    assert("DEEP · the cold queue serves QUESTIONS ONLY (no answers leak into a cold round)",
      due.code === 0 && /COLD/.test(due.out) && !/reJirahDone/.test(due.out));

    const rep = run([S("capture.mjs"), "rep", "--concept", "embeddings", "--axis", "a", "--q", "probe", "--gut", "shaky", "--correct", "true"], { cwd: sb });
    assert("CAPTURE · one valid rep lands with zero capture tax", rep.code === 0 && /appended 1/.test(rep.out));

    // ── THE GEMINI-QUALITY WIRE (wiring audit, 10 Aug 2026) ──────────────────
    // gemini_quality.jsonl had TWO wired readers (scout.mjs attachGemini ·
    // watchman.mjs c11) and had NEVER existed on disk: capture.mjs only recorded a
    // row when `mode === "paste"`, while 19 of the 21 live reps arrive through
    // `rep`. A producer-less consumer reports 0 forever and looks healthy doing it.
    // This is the CLI half of the repair, and it belongs here rather than in
    // capture's own selftest because GEMINI_QUALITY resolves against the real state
    // dir — only this sandbox can let the real door write a real ledger safely.
    // It goes red the moment the recorder is re-gated on the door, or the row stops
    // naming which door wrote it.
    assert("CAPTURE→GEMINI-QUALITY · the `rep` door WRITES the outcome ledger its two readers count (it never did until 10 Aug 2026)",
      (() => {
        const gq = join(sb, "dressing-room", "state", "gemini_quality.jsonl");
        if (!existsSync(gq)) return false;
        const lines = readFileSync(gq, "utf8").split("\n").filter((l) => l.trim());
        if (!lines.length) return false;
        const row = JSON.parse(lines[lines.length - 1]);
        return row.door === "rep" && row.n === 1 && row.of_batch === 1
          && row.surfaces && row.surfaces.gem === 1 && row.confidence_mix.shaky === 1;
      })(),
      "the rep door produced no gemini_quality row — the lane is a black box again (scout + watchman will report 0 forever)");

    // ORGAN-SAFE, INVERTED (7 Aug 2026). learnstate.mjs:562 prints NOTHING when
    // ARSENAL_ORGAN=1 — correct by design (a headless organ prompt must never carry his
    // personal memory), but it makes these two assertions depend on who is running the
    // suite. Measured: suite run from inside an organ -> 12 passed / 2 failed; the same
    // code with ARSENAL_ORGAN stripped -> 14 / 0. The HUMAN-facing brief is what is under
    // test here, so the child is given the human's env explicitly rather than inheriting
    // an organ's. A test that reports a defect because of who launched it is not a net.
    const humanEnv = { ...process.env }; delete humanEnv.ARSENAL_ORGAN;
    const brief = run([S("learnstate.mjs"), "brief"], { cwd: sb, env: humanEnv });
    assert("BRIEF · SessionStart still assembles and reports its byte manifest",
      brief.code === 0 && /context manifest:/.test(brief.out));
    assert("BRIEF · the assembled brief stays inside the declared 12,000-char ceiling",
      (() => { const m = brief.out.match(/assembled (\d+)\/(\d+)/); return m && Number(m[1]) <= Number(m[2]); })());

    // ── THE MANIFEST LEDGER'S CONSUMER (dead-wire repair, 11 Aug 2026) ───────
    // assemble() has returned {manifest, bytes, ceiling, total, footer} since 5 Aug and
    // the ONE production caller (learnstate.mjs:1201) reads `.text` and nothing else, so
    // every structured field was consumed only by the selftest that computes it. The two
    // assertions ABOVE are the proof: they are this suite regexing a SENTENCE for the one
    // ceiling check the organism owns, because this file's header law forbids importing an
    // organ and there was no out-of-process door onto the structure. There is now —
    // `context_manifest.mjs ledger`, one JSON line, deliberately WITHOUT `text` so a net
    // can read the accounting without ever holding his memory.
    // Both stay. The prose pair tests the PRODUCTION path (the SessionStart hook really
    // printing a footer); these test the LEDGER. Layering, not replacing.
    const led = run([S("context_manifest.mjs"), "ledger"], { cwd: sb, env: humanEnv });
    const L = (() => { try { return JSON.parse(led.out.trim().split(/\r?\n/).pop()); } catch { return null; } })();
    assert("BRIEF · the manifest's accounting is reachable AS STRUCTURE — one JSON line, parts each carrying id + state + bytes",
      led.code === 0 && L && Array.isArray(L.manifest) && L.manifest.length > 0
      && L.manifest.every((p) => typeof p.id === "string" && typeof p.state === "string" && typeof p.bytes === "number"),
      `context_manifest.mjs ledger did not return a parseable ledger (exit ${led.code}). Without it the only ceiling check in the organism is a regex over a printed sentence.`);
    assert("BRIEF · the ceiling check reads the FIELD, not a sentence — total <= ceiling, both as numbers",
      L && Number.isFinite(L.total) && Number.isFinite(L.ceiling) && L.total <= L.ceiling,
      L ? `total ${L.total} vs ceiling ${L.ceiling} — a FOOTER_RESERVE overrun looks exactly like this` : "no ledger to read");
    // DROPPED is the one state that is unambiguously a WIRE break: the part was produced,
    // billed, and then did not appear in the delivered text (context_manifest.mjs's
    // reconcile()). MISSING/EMPTY are data conditions — a bare CI checkout has no
    // hippocampus and must stay green — so they are deliberately NOT asserted on here.
    // Nothing in the organism catches a DROPPED leg today; the footer says it to a reader
    // and no net reads the footer.
    assert("BRIEF · no context part reads DROPPED — a leg that was measured and then did not reach the session is a wire break, and nothing else catches it",
      L && !L.manifest.some((p) => p.state === "DROPPED"),
      L ? `DROPPED: ${L.manifest.filter((p) => p.state === "DROPPED").map((p) => `${p.id} (${p.note})`).join(", ")}` : "no ledger to read");
    // The omission is the reason the door is safe to open at all — pin it, or the next
    // hand that "helpfully" adds `text` puts his memory on any consumer's stdout.
    assert("BRIEF · the ledger NEVER carries the assembled text — his memory, card and staged rulings stay out of every consumer's stdout",
      L && !("text" in L) && !JSON.stringify(L.manifest).includes("COLD-START"));
  } finally { rmSync(sb, { recursive: true, force: true }); }
}

// a throwaway copy of the organism — every mutating test runs HERE, never on live state
function sandbox() {
  const d = mkdtempSync(join(tmpdir(), "arsenal-test-"));
  for (const p of ["scripts", "dressing-room", "learning-layer", "package.json"]) {
    if (existsSync(join(ROOT, p))) cpSync(join(ROOT, p), join(d, p), { recursive: true });
  }
  if (existsSync(join(ROOT, "node_modules"))) cpSync(join(ROOT, "node_modules"), join(d, "node_modules"), { recursive: true });
  // DORMANT-SAFE MIRROR (7 Aug 2026, the away-day red). dressing-room/state/capsules/
  // is a gitignored mirror (gist = master), so a fresh checkout — which is what the CI
  // runner IS, forever, by design — has none, and the five RE-JIRAH/DEEP cross-checks
  // above went red on every push while passing at home. Their subject is the LOOP
  // (grade → close → patch → pending → cold questions), not his content, so when the
  // sandbox copy carries no capsule the sandbox is seeded with a MINIMAL fixture one —
  // in the SANDBOX only, never the live mirror (mirror.mjs stays its only writer).
  const capDir = join(d, "dressing-room", "state", "capsules");
  const hasCapsule = existsSync(capDir) && readdirSync(capDir).some((f) => f.endsWith(".json"));
  if (!hasCapsule) {
    mkdirSync(capDir, { recursive: true });
    writeFileSync(join(capDir, "embeddings.json"), JSON.stringify({
      id: "embeddings", num: "02", title: "Embeddings (CI fixture)", lockedOn: "2026-06-21",
      reJirahDone: [], status: "tempered",
      faultLines: "abcdefghi".split("").map((a) => ({ axis: a, title: `axis ${a}`, strike: `fixture strike ${a}?`, weld: "fixture weld", status: "held" })),
    }, null, 2));
  }
  return d;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
const MODES = { coverage, integrity, laws, hermetic, path, suites };
function main() {
  const mode = (process.argv[2] || "all").toLowerCase();
  if (mode === "selftest") { console.log("organism_test is itself the test suite — run `node scripts/organism_test.mjs all`"); process.exit(0); }
  const chosen = mode === "all" ? Object.keys(MODES) : [mode];
  if (chosen.some((c) => !MODES[c])) { console.log(`organism_test: ${Object.keys(MODES).join(" | ")} | all`); process.exit(1); }
  console.log("=== ARSENAL AI FC — CROSS-ORGAN TEST SUITE ===");
  for (const c of chosen) MODES[c]();
  console.log(`\n${"=".repeat(70)}\norganism_test: ${pass} passed, ${fail} failed`);
  if (fail) {
    console.log("\nEach RED below is a real defect between organs — not a flaky net:");
    for (const f of fails) console.log(`  · ${f.name}${f.detail ? `\n      ${f.detail}` : ""}`);
  }
  process.exit(fail ? 1 : 0);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
