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
// THE SUITE ROLL, in ONE place (12 Aug 2026). This used to be a literal array
// repeated in coverage() and suiteMembers(); adding a suite therefore meant
// editing two lists, and a half-edit would have made the coverage law itself
// blind — the exact "law written in prose, broken by the next commit" failure
// this file was built to catch. `audit:selftest` is the third suite: the
// MEASUREMENT organs (sandbox · xray · blackbox · mutagen · treasury · herd ·
// audit). They are separated not by importance but by COST — several build a
// full sandbox and run for minutes, so `npm test` keeps them behind their own
// name while the coverage law still holds them to the same standard as the rest.
const SUITE_NAMES = ["organism:selftest", "squad:selftest", "audit:selftest"];
const scripts = () => readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs") && f !== SELF);
// 9 Aug 2026 (launch F1): also match a bare `function selftest(` — claudegen defines
// one and runs it as its whole CLI, and the quoted-string-only regex was blind to it.
// ONE DOOR FOR READING AN ORGAN'S SOURCE (17 Aug 2026). Four call sites in this
// file built `join(ROOT, "scripts", <runtime name>)` independently, and each one is
// its own unresolved sink in xray's IR — the per-organ ratchet charges for every
// one, and it charged for the fifth the moment it landed. Routed through here they
// cost ONE between them and the file reads better, which is exactly the trade the
// budget exists to force: move the code, never the budget.
const readOrgan = (f) => { try { return readFileSync(join(ROOT, "scripts", f), "utf8"); } catch { return ""; } };
const hasSelftest = (f) => { const src = readOrgan(f); return /['"`]selftest['"`]/.test(src) || /function selftest\(/.test(src); };

// ── 1. COVERAGE LAW ──────────────────────────────────────────────────────────
// The meta-test package.json's own prose asks for and never got.
function coverage() {
  section("COVERAGE LAW — a selftest nobody runs is a hypothesis, not a net");
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const suites = SUITE_NAMES.map((n) => pkg.scripts[n] || "");
  assert(`all ${SUITE_NAMES.length} named suites still exist in package.json`, suites.every(Boolean),
    SUITE_NAMES.filter((n) => !pkg.scripts[n]).join(", "));

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

// the suite strings stay the single membership record; the runner parses them
function suiteMembers(pkg) {
  const out = [];
  for (const n of SUITE_NAMES) {
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

  // ── EVERY READER OF reps_log HONOURS A CORRECTION (17 Aug 2026, BLOCK 4) ──
  // A verdict about him can now be walked back by a new row naming the old one, and
  // reps_log stays append-only — so a reader that does NOT filter the superseded row
  // keeps acting on a judgement that was already taken back. That is a defect BETWEEN
  // organs, which is exactly the class no organ's own selftest can see: fifteen files
  // read that log, each with its own reader, and every one of them would stay green.
  // MEASURED when this landed: 15 files read it; 5 own a private loadReps (capture,
  // nemesis, calibration, learning_state, fsrs) and 10 read it raw through readLines.
  // The rule is one line — pass it through capture.mjs's supersedeReps, because
  // capture is the SOLE WRITER and therefore owns what supersession means.
  {
    const readers = scripts().filter((f) => {
      const src = readOrgan(f);
      return src.includes("reps_log.jsonl") && !/^\s*\/\//.test(src);
    }).filter((f) => {
      const src = readOrgan(f);
      // only files that actually LOAD rows from it — a mention in a comment, a path
      // constant used for an existence check, or an archiver tailing bytes is not a
      // reader of verdicts.
      return /readLines\(join\(STATE_DIR, "reps_log\.jsonl"\)\)/.test(src) || /function loadReps\(/.test(src);
    });
    const deaf = readers.filter((f) => !readOrgan(f).includes("supersedeReps"));
    assert(`every organ that LOADS reps from reps_log honours a correction (${readers.length} reader(s) found) — a superseded verdict must not keep deciding what he drills`,
      deaf.length === 0, deaf.length ? `not filtering: ${deaf.join(", ")}` : "");
    // …and the guard is not vacuous: it must actually be finding the readers.
    assert("…and this check really found them — capture, nemesis, calibration, learning_state and fsrs are all in the set it walked",
      ["capture.mjs", "nemesis.mjs", "calibration.mjs", "learning_state.mjs", "fsrs.mjs"].every((f) => readers.includes(f)),
      `walked: ${readers.join(", ")}`);
  }

  // ── THE DECLARED EXTERNAL PRODUCER IS A REAL ORGAN (17 Aug 2026) ───────────
  // brain.mjs's #64 guard asks whether every REQUIRED `brain_out/<dir>/…` input has
  // an enabled job producing it. Some do not and correctly so: the claim auditor
  // reads `brain_out/dugout/TODAY.md`, which the VOICE SURFACE writes, not any job.
  // Those declare `produced_by: "<organ>.mjs"` in the config — and that escape hatch
  // is only honest if the organ it names actually exists, or a typo in the excuse
  // silently excuses a path nothing writes.
  // IT LIVES HERE AND NOT IN brain.mjs FOR A MEASURED REASON: proving the file
  // exists needs a scripts-directory read with a runtime path, which cost brain.mjs
  // a new unresolved sink the moment it landed (52 -> 53, caught by xray's per-organ
  // ratchet in the same run). This suite already walks that directory for every
  // selftest it runs, so the check is free here. Move the code, never the budget.
  {
    const here = scripts();
    const cfgRaw = (() => { try { return JSON.parse(readFileSync(join(STATE, "brain_config.json"), "utf8")); } catch { return null; } })();
    const declared = ((cfgRaw && cfgRaw.jobs) || []).flatMap((j) => (j.inputs || [])
      .filter((i) => i && typeof i === "object" && i.produced_by)
      .map((i) => ({ job: j.id, path: i.path, organ: String(i.produced_by) })));
    const ghosts = declared.filter((d) => !here.includes(d.organ));
    assert(`a declared external producer is a REAL organ in this tree (${declared.length} declaration(s) checked) — the escape hatch cannot excuse a brain_out path nothing writes`,
      !cfgRaw || ghosts.length === 0, ghosts.map((g) => `${g.job}: ${g.path} <- ${g.organ}`).join(", "));
    // …and it really writes that directory. Cheap and exact: the organ builds the
    // path as `join(..., "brain_out", "<dir>")`, the same shape brain's own jobs use.
    const notWriters = declared.filter((d) => {
      if (!here.includes(d.organ)) return false;                       // already reported above
      const dir = String(d.path).split("/")[1];
      const src = readOrgan(d.organ);
      return !new RegExp('"brain_out"\\s*,\\s*"' + dir + '"').test(src);
    });
    assert("…and that organ really BUILDS that brain_out directory — a producer that names the wrong folder is the same lie one level down",
      !cfgRaw || notWriters.length === 0, notWriters.map((g) => `${g.organ} does not write ${g.path}`).join(", "));
  }

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
    const src = readOrgan(f);
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
    const src = readOrgan(p.organ);
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

    // ── LOAD ZERO BLOCK 1 (19 Aug 2026) — TASK + IDEMPOTENCY ────────────────────
    // THE LAW: no organ may spawn work for him outside tasks.mjs, and an idempotency key may
    // never be executed twice. Both halves are held here — a STATIC scan (nobody but the task
    // runner builds a brain `run` argv) and a RUNTIME proof (three real processes, one ask).
    // MEASURED TO BITE, not assumed: this scan returns exactly ONE hit against the commit before
    // this block (acts.mjs:81 — the direct fire-and-forget call that ran his one ask 3x in four
    // minutes for ~67,400 tokens, all three overwriting one 5.4 KB file) and ZERO after it.
    const SPAWNS_BRAIN_RUN = /brain\.mjs["'\s\],)]{0,6}[^\n]{0,90}?["']run["']/;
    const TASK_RUNNERS = ["tasks.mjs"];   // the ONE organ allowed to spawn a job. A name joins this list only with its reason.
    const spawners = readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs") && f !== SELF && !TASK_RUNNERS.includes(f))
      .filter((f) => readOrgan(f).split("\n").some((l) => SPAWNS_BRAIN_RUN.test(l)));
    assert("LOAD ZERO BLOCK 1 · no organ spawns work for him OUTSIDE tasks.mjs (a bare call has no id, no key, and no memory that it already ran)",
      spawners.length === 0, `${spawners.join(", ")} builds a brain \`run\` argv directly — route it through tasks.mjs so his ask gets an id and an idempotency key`);
    assert("LOAD ZERO BLOCK 1 · the act lane's `job` verb names tasks.mjs as its owner (the door he actually speaks through)",
      /job:\s*\{\s*organ:\s*"tasks\.mjs"/.test(readOrgan("acts.mjs")));

    const tenv = { ...process.env, ARSENAL_TASKS_LEDGER: join(sb, "tasks-ratchet.jsonl"), ARSENAL_SWALLOW_LEDGER: join(sb, "swallow-tasks.jsonl") };
    const fire = () => run([join(sb, "scripts", "tasks.mjs"), "create", "--kind", "job", "--subject", "prepare_on_request", "--door", "gaffer", "--json"], { cwd: sb, env: tenv });
    const a1 = fire(), a2 = fire(), a3 = fire();
    let i1 = {}, i2 = {}, i3 = {};
    try { i1 = JSON.parse(a1.out); i2 = JSON.parse(a2.out); i3 = JSON.parse(a3.out); } catch { /* asserted below */ }
    assert("LOAD ZERO BLOCK 1 · THE 18 AUG REPLAY: his one ask fired 3x from 3 processes makes ONE task — 1 run, 3 identical receipts",
      !!i1.id && i1.id === i2.id && i1.id === i3.id && i1.replay === false && i2.replay === true && i3.replay === true, `${a1.out}${a2.out}${a3.out}`);
    const k1 = run([join(sb, "scripts", "tasks.mjs"), "claim", i1.id], { cwd: sb, env: tenv });
    const k2 = run([join(sb, "scripts", "tasks.mjs"), "claim", i1.id], { cwd: sb, env: tenv });
    assert("LOAD ZERO BLOCK 1 · RUNTIME ASSERTION: an idempotency key may never be executed twice — the SECOND claim exits non-zero",
      k1.code === 0 && k2.code !== 0 && /never be executed twice/.test(k2.out), `exit ${k1.code}/${k2.code} — ${k2.out}`);

    // ── LOAD ZERO BLOCK 2 (19 Aug 2026) — SAMJHAO ───────────────────────────────
    // THE LAW (§5): a samjhao may not be marked done while ANY doubt in its ledger is open, and
    // a unit may not assert a fact absent from the source. SAMJHAO is REVISION of his own locked
    // notes — not FORGE (which teaches from zero and locks a capsule) and not RE-JIRAH (which
    // tests cold and grades). The gates below are what keep those three from blurring in code.
    // ISOLATED LEDGERS (19 Aug 2026, learned the hard way). sandbox() copies the live
    // dressing-room, so a REAL samjhao open on this machine silently became this ratchet's
    // starting state and flipped two assertions. A ratchet whose verdict depends on what the
    // captain happened to do that evening is not a ratchet. Both ledgers are pinned into the
    // sandbox so the law is measured against a KNOWN empty start, on any machine, any day.
    // EVERY ledger these children could touch is pinned into the sandbox — not only the two this
    // ratchet reads. The swallow ledger is here for a measured reason: swallow.mjs's own selftest
    // asserts the LIVE ledger's size:mtime never moves, and this block spawns a dozen extra organs
    // inside one `npm test`, any of which may swallow. That made swallow go red in a full sweep
    // while passing 13/0 alone — a test failing because ANOTHER test ran is noise, and noise is
    // how a real red gets ignored.
    const samEnv = { ...process.env,
      ARSENAL_SAMJHAO_LEDGER: join(sb, "samjhao-ratchet.jsonl"),
      ARSENAL_TASKS_LEDGER: join(sb, "tasks-samjhao.jsonl"),
      ARSENAL_OUTBOX_LEDGER: join(sb, "outbox-ratchet.jsonl"),
      ARSENAL_SWALLOW_LEDGER: join(sb, "swallow-ratchet.jsonl") };
    const sam = (...a) => run([join(sb, "scripts", "samjhao.mjs"), ...a], { cwd: sb, env: samEnv });
    const deepDue = () => run([join(sb, "scripts", "deep.mjs"), "due"], { cwd: sb, env: samEnv });
    const FOUR = ["tokenization", "embeddings", "inference", "context"];
    const unverified = FOUR.filter((c) => sam("verify", c).code !== 0);
    assert("LOAD ZERO BLOCK 2 · NO NEW FACTS — every samjhao unit of all four topics asserts only what HIS OWN capsule holds (validators, not vibes)",
      unverified.length === 0, `${unverified.join(", ")} assert something the capsule does not hold — samjhao revises his notes, it never teaches something new`);
    assert("LOAD ZERO BLOCK 2 · all four topics are RUNNABLE and every one is a 9-axis revision of a LOCKED capsule",
      FOUR.every((c) => { const o = sam("plan", c, "--json"); try { const j = JSON.parse(o.out); return j.units.length === 9 && j.doubts.length > 0 && !!j.lockedOn; } catch { return false; } }));
    assert("LOAD ZERO BLOCK 2 · a concept with no locked capsule is REFUSED — samjhao is REVISION, never teaching from zero (that is FORGE)",
      sam("plan", "a_concept_he_never_forged").code !== 0);

    const opened = sam("open", "tokenization", "--json");
    let sid = null;
    try { sid = JSON.parse(opened.out).id; } catch { /* asserted */ }
    assert("LOAD ZERO BLOCK 2 · a samjhao takes its id from the TASK layer, so it resumes on any surface (§4-E)", !!sid && /^t/.test(sid), opened.out);
    const closeEarly = sam("close", sid || "x");
    assert("LOAD ZERO BLOCK 2 · THE RATCHET: close is REFUSED while units/doubts are open, and it NAMES the count (a feeling becomes a number)",
      closeEarly.code !== 0 && /baaki|KHULE/.test(closeEarly.out), closeEarly.out);
    const early = sam("answer", sid || "x", "--unit", "1", "--text", "kuch bhi", "--gut", "knew");
    assert("LOAD ZERO BLOCK 2 · PREDICT-THEN-REVEAL is a gate: an answer before the guess is refused (what he retrieves sticks, what he reads does not)",
      early.code !== 0 && /GUESS pehle/.test(early.out), early.out);
    const noGut = sam("guess", sid || "x", "--unit", "1", "--text", "token = tukda", "--gut", "maybe");
    assert("LOAD ZERO BLOCK 2 · the GUT-WORD LAW holds here too — samjhao refuses knew|shaky|guessed's absence exactly as capture.mjs does",
      noGut.code !== 0);

    // ── THE COLDNESS GUARANTEE (19 Aug 2026) — his question: "samjhao ke baad Re-Jirah ke
    // sawaal WAHI 9 to nahi hain?" Measured that night: they WERE. `deep.mjs due` printed
    // faultLines[].strike verbatim — the exact question samjhao opens the weld for — so a
    // post-samjhao Re-Jirah would have been WARM while calling itself COLD. §4's "fresh and
    // cold on the re-activated material" existed only as prose in an agenda row, and Law 4 says
    // a law is a code path or it does not exist. This ratchet is that code path's guard: it
    // reads the REAL strike out of his own capsule and proves the cold screen stops serving it
    // the moment samjhao opens that axis. Without this in npm test, the hole comes straight back.
    let strikeA = null;
    try { strikeA = JSON.parse(readFileSync(join(sb, "dressing-room", "state", "capsules", "tokenization.json"), "utf8")).faultLines[0].strike.trim(); } catch { /* asserted */ }
    const coldBefore = deepDue();
    assert("LOAD ZERO BLOCK 2 · before any samjhao, the cold round DOES serve the capsule's own strike (this is the baseline the guard must change)",
      !!strikeA && coldBefore.out.includes(strikeA), `strike=${String(strikeA).slice(0, 60)}`);
    sam("guess", sid || "x", "--unit", "1", "--text", "token = vocab ka tukda + ID", "--gut", "shaky");
    const coldAfter = deepDue();
    assert("LOAD ZERO BLOCK 2 · THE COLDNESS RATCHET: once samjhao OPENS an axis, the Re-Jirah may never serve that same strike again — it is named as burned and a FRESH question is demanded",
      !!strikeA && !coldAfter.out.includes(strikeA) && /SAMJHAO mein khul chuka/.test(coldAfter.out) && /FRESH sawaal chahiye/.test(coldAfter.out),
      `the burned strike is still being served as cold: ${String(strikeA).slice(0, 60)}`);
    assert("LOAD ZERO BLOCK 2 · ...and an axis he never reached is UNTOUCHED — only what was actually opened is burned",
      (() => { try { const b = JSON.parse(readFileSync(join(sb, "dressing-room", "state", "capsules", "tokenization.json"), "utf8")).faultLines[1].strike.trim(); return coldAfter.out.includes(b); } catch { return false; } })());

    // ── LOAD ZERO BLOCK 3 (19 Aug 2026) — OUTBOX + RELAY ────────────────────────
    // THE LAW: a producer never delivers; the relay is the only thing that reaches him; a row
    // delivered on one surface is GONE from the others. Test per §BLOCK 3: produce output with
    // no session open, and it must reach the next surface he touches — EXACTLY once.
    const ob = (...a) => run([join(sb, "scripts", "outbox.mjs"), ...a], { cwd: sb, env: samEnv });
    ob("post", "--produced-by", "brain:prepare_on_request", "--kind", "material", "--subject", "samjhao material taiyaar", "--body-ref", "brain_out/prepare_on_request/x.md");
    const firstTouch = ob("relay", "--surface", "code");
    const secondTouch = ob("relay", "--surface", "dugout");
    assert("LOAD ZERO BLOCK 3 · output produced with NO session open reaches the next surface he touches — and EXACTLY once (the second surface gets nothing)",
      /samjhao material taiyaar/.test(firstTouch.out) && !/samjhao material taiyaar/.test(secondTouch.out), `${firstTouch.out} || ${secondTouch.out}`);
    assert("LOAD ZERO BLOCK 3 · a row that would ASK him for a decision is refused unless it says why code could not decide (BLOCK 6's gate, carried from day one)",
      ob("post", "--produced-by", "x", "--kind", "ask", "--subject", "kaunsa?", "--requires-decision").code !== 0);
    assert("LOAD ZERO BLOCK 3 · the dead-man's switch exists and does NOT fire on a road he simply has not walked yet (BLOCK 9's false-positive ruling, applied here)",
      !/RED outbox-undelivered/.test(ob("status").out));

    // ── LOAD ZERO BLOCK 4 (19 Aug 2026) — CLOSE ─────────────────────────────────
    // THE 19 AUG 00:00 REPEAT, EXACTLY: an ask was born at the Gaffer, the organism ANSWERED it,
    // and nothing could close it — because the only thing that could mark an agenda row done was
    // a sitting, and only for rows THAT sitting had served. So a dugout reopen re-served a row
    // the organism had already dealt with, and he was asked the same thing twice.
    const sit = (...a) => run([join(sb, "scripts", "sitting.mjs"), ...a], { cwd: sb, env: samEnv });
    sit("agenda", "add", "--text", "BLOCK 4 close ka test — gaffer door se aaya ask");
    const agList = sit("agenda");
    // pull the id off MY OWN row, not the first "ag…" token in the screen — the word "agenda"
    // matches a naive /ag[a-z0-9]+/ and the sandbox also carries his real rows.
    const agId = (/^\s*(ag\S+)\s.*BLOCK 4 close ka test/m.exec(agList.out) || [])[1];
    assert("LOAD ZERO BLOCK 4 · an ask created at the GAFFER door is open on the agenda", !!agId && /BLOCK 4 close ka test/.test(agList.out), agList.out);
    ob("post", "--produced-by", "gaffer", "--kind", "material", "--subject", "uska poocha hua kaam ho gaya", "--close-ref", `agenda:${agId}`);
    ob("relay", "--surface", "code");
    const afterClose = sit("agenda");
    assert("LOAD ZERO BLOCK 4 · the relay's DELIVERED stamp CLOSES it — through the owner, from a door that is not the sitting",
      !!agId && !new RegExp(agId).test(afterClose.out), afterClose.out);
    assert("LOAD ZERO BLOCK 4 · ...and a dugout REOPEN does not restart it — the row stays closed (this is the 19 Aug 00:00 loop, dead)",
      !/BLOCK 4 close ka test/.test(sit("agenda").out));
    assert("LOAD ZERO BLOCK 4 · no ask may be created without a CLOSE PATH — an `ask` with no close_ref is refused at the door",
      ob("post", "--produced-by", "x", "--kind", "ask", "--subject", "bina raaste ka sawaal").code !== 0);

    // ── HIS ANSWERS ARE HIS (19 Aug 2026, his ruling after a proof-run wrote a guess in his name)
    // "koi bhi test/proof-run MERI taraf se guess ya answer nahi likh sakta — proof hamesha
    // sandbox mein, live samjhao mein kabhi nahi." PREDICT-THEN-REVEAL is once-only: a prediction
    // spent by a test can never be given back, which is why this is absolute and has no override.
    const collarEnv = { ...process.env, ARSENAL_AUDIT_COLLAR: "1" };   // deliberately NO sandbox ledger: this is the forbidden case
    delete collarEnv.ARSENAL_SAMJHAO_LEDGER;
    const liveSamjhao = join(sb, "dressing-room", "state", "samjhao.jsonl");
    const beforeBytes = existsSync(liveSamjhao) ? statSync(liveSamjhao).size : -1;
    const forbidden = run([join(sb, "scripts", "samjhao.mjs"), "guess", "tokenization", "--unit", "1", "--text", "a test must never write this", "--gut", "knew"], { cwd: sb, env: collarEnv });
    const afterBytes = existsSync(liveSamjhao) ? statSync(liveSamjhao).size : -1;
    assert("HIS ANSWERS ARE HIS · a FIXTURE may NEVER write a guess into his LIVE samjhao — refused, and the live ledger does not move a byte",
      forbidden.code !== 0 && /FIXTURE/.test(forbidden.out) && beforeBytes === afterBytes, `exit ${forbidden.code} · ${beforeBytes}->${afterBytes} · ${forbidden.out}`);
    assert("HIS ANSWERS ARE HIS · ...and the same call against a SANDBOX ledger is allowed — that is where a proof belongs",
      run([join(sb, "scripts", "samjhao.mjs"), "open", "tokenization"], { cwd: sb, env: samEnv }).code === 0);
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
  // wall_data.json added 12 Aug 2026, and the PRICE THIS LIST SETS WAS PAID
  // rather than waved: `viz.mjs selftest` was run with the file stat-ed before
  // and after — it does NOT touch it — and five neighbouring selftests (scorer ·
  // setpiece · physio · twin · heartbeat) were run the same way, also clean. The
  // real writer is the scheduled ArsenalFC-Wall-* task (viz.mjs, twice daily plus
  // the 30-minute live wall), i.e. a scheduled OWNER writing its OWN state inside
  // a multi-minute suite window — the same daemon-race signature that already
  // earned tone.json and daemon_watchdog.json their place here. Excluding it
  // WITHOUT that scan would be how a real defect gets papered over.
  // xray_graph.json + audit_ledger.jsonl: the audit organs' own lanes. xray.mjs
  // is sole writer of the first and audit.mjs of the second, and both are written
  // by their owner's normal operation, never by another organ's selftest.
  // pulse_session.json + cortex_session.json added 14 Aug 2026 (unleash Phase 3
  // and 7.4), AND THE PRICE THIS LIST SETS WAS PAID, not waved — the daemon
  // rewrites the pulse session every ~150s while he is at the keyboard, which is
  // the same scheduled-OWNER-writes-its-own-state race that earned tone.json and
  // wall_data.json their places. THE PROOF, run before adding them:
  //   · `brain.mjs selftest` ×3, hashing pulse_session.json either side of each
  //     run: unchanged, unchanged, unchanged — and 0 new haiku_pulse ledger rows,
  //     which is the discriminator that makes this airtight. runPulse writes the
  //     session file and appends its ledger row on the SAME path, so a session
  //     change with no ledger row would be a selftest write. There were none.
  //   · `cortex.mjs selftest` ×2: cortex_session.json stayed ABSENT entirely.
  //   · and by construction: all 14 runPulse calls in brain's selftest carry
  //     `dry: true`, which is the flag the write is gated on.
  //
  // captains_call.json added the same day, and this one is PRE-EXISTING FLAKINESS
  // this session merely surfaced — nothing in the unleash work writes the deck
  // (get_card, its new reader, only reads). It was proven at the HIGHEST standard
  // this list has yet seen: EVERY ONE of the 80+ scripts/*.mjs was run with
  // `selftest` and the deck stat-ed (size:mtimeMs, the same metric snap() uses)
  // either side of each — NONE of them touched it. Note the metric: snap() keys on
  // mtime, so even a byte-IDENTICAL atomic rewrite trips it, and that is exactly
  // what the deck's owner does on a TTL/retire sweep. The writer is the live
  // captains_call lane running on its own anchors inside a multi-minute suite
  // window — the same signature as tone.json and wall_data.json above.
  // sitting.json + sitting_out/log/reviews.jsonl added 18 Aug 2026 (Block 3):
  // written by the LIVE sitting daemon (:4117) on open/turn/spoken/close and
  // by its idle-close timer — a scheduled OWNER writing its OWN state inside
  // a multi-minute suite window, the same signature as tone.json. PROOF paid:
  // `sitting.mjs selftest` runs entirely in a temp state dir
  // (ARSENAL_SITTING_STATE_DIR is not even needed — the selftest re-points
  // its file table) and asserts the live sitting.json mtime is unchanged
  // before/after.
    // session_intent.jsonl added 18 Aug 2026 (Block 4 close), THE PRICE PAID: the flagging run's
  // new rows were `kind:"turn"` rows from session 1d0fc6bb… — HIS OTHER Claude Code session's
  // Stop hook (turn_hook stop → intent.mjs stop, Block 2) firing on his prompts DURING the suite
  // window ("block 3 is done, can i use gaffer now??" is not a selftest). The same signature as
  // teaching_contract.json (UserPromptSubmit) one line up. PROOF: sitting.mjs, intent.mjs and
  // context_manifest.mjs selftests — the three that could reach it — run one at a time with the
  // file stat-ed (size:mtime) before and after: 7180:1787023950 → 7180:1787023950, UNTOUCHED.
  // intent's own selftest is hermetic by env (ARSENAL_INTENT_STATE_DIR); sitting's records its
  // `intent.mjs close` owner call instead of executing it. Excluding it hides no defect.
  // swallow_ledger.jsonl added 18 Aug 2026 (Block 7, §14.2 SWALLOW + PANIC): swallow.mjs is its
  // sole writer, ONE row per LIVE process that swallowed anything, appended at exit (daemons:
  // every 10 min) — i.e. every scheduled organ and every daemon on the box writes it, all day,
  // straight through a multi-minute suite window (the tone/wall_data signature, at scale).
  // THE PRICE PAID, BY CONSTRUCTION not by scan: swallow.mjs flush() REFUSES to write when
  // the process is a fixture — argv verb `selftest`, or any run under the sandbox collar
  // (ARSENAL_AUDIT_COLLAR) — unless ARSENAL_SWALLOW_LEDGER re-points it at a scratch file;
  // its own selftest asserts the live ledger's size:mtime is unchanged across a flush AND
  // across the scratch-pointed child that does write. So no selftest in this sweep can
  // touch it (they all run with verb `selftest`); only live organs racing the sweep can.
const LIVE_WRITERS = /swallow_ledger\.jsonl|session_intent\.jsonl|afferent\.jsonl|salience_ledger\.jsonl|presence_log|recall_index|brain_queue|context_state|dossier\.json|pitch_read|token_vitals\.json|workspace\.json|working_set\.json|distiller_latency\.jsonl|throwin_state\.json|teaching_contract\.json|teaching_audit|brain_ledger\.jsonl|tanks\.json|bg_queue\.jsonl|wake_queue\.jsonl|wake\.json|tone\.json|daemon_watchdog\.json|dugout_reminders\.jsonl|shadow_log\.jsonl|mouth_log\.jsonl|wall_data\.json|xray_graph\.json|audit_ledger\.jsonl|pulse_session\.json|cortex_session\.json|captains_call\.json|sitting\.json|sitting_out\.jsonl|sitting_log\.jsonl|sitting_reviews\.jsonl/;
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
    // 18 Aug 2026 (OVERHAUL Block 1 §7.4/§13): the declared ceiling is 5,300 chars now (it was
    // 12,000) so the WHOLE printed brief — state line included — lands under 6,000 BYTES; the
    // assertion reads the ceiling off the footer, so it holds whichever number the owner declares.
    assert("BRIEF · the assembled brief stays inside the declared ceiling (read off the footer — 5,300 since 18 Aug 2026)",
      (() => { const m = brief.out.match(/assembled (\d+)\/(\d+)/); return m && Number(m[1]) <= Number(m[2]); })());
    assert("BRIEF · the WHOLE printed SessionStart brief is under 6,000 bytes (overhaul §7.4/§13 — the state line rides outside the manifest's ceiling)",
      Buffer.byteLength(brief.out, "utf8") < 6000, `${Buffer.byteLength(brief.out, "utf8")} bytes`);

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

// ── 7. ALIVE — the suite's FIRST liveness assertions (12 Aug 2026) ───────────
// Measured that day: 4,341 assertions in this repo and ZERO said "it actually
// RAN" — while diary (enabled, nightly, 3 wired readers) had never produced a
// page. □P without ◇≤T is half a truth. This mode shells pulse.mjs `alive`
// (the ◇≤T law over schtasks lanes, brain lanes via reconcile, the card queue,
// and the watchers' own artifacts) and FAILS THE SUITE on any live violation.
// On a bare checkout pulse answers NOT MEASURABLE and this mode passes — a CI
// clone cannot testify about his laptop, and pretending it could would be the
// B6 class in reverse. A RED here is a REAL lane lying dead right now, not a
// flaky net: fix the lane, never this check.
function alive() {
  section("ALIVE — ◇≤T: every lane produced its artifact inside its own deadline");
  const r = run([join(ROOT, "scripts", "pulse.mjs"), "alive"], { timeout: 300000 });
  if (/NOT MEASURABLE HERE/.test(r.out)) {
    assert("ALIVE — bare checkout: pulse answered NOT-MEASURABLE and exited 0 (measurability is an answer, silence is not)", r.code === 0, r.out.slice(0, 300));
    return;
  }
  const reds = r.out.split(/\r?\n/).filter((l) => /\[(NEVER|STALE|QUEUE)\]/.test(l));
  assert("ALIVE — every measurable lane inside its own deadline (each line below is a lane lying dead RIGHT NOW)", r.code === 0,
    reds.join("\n         ") || r.out.split(/\r?\n/).slice(-4).join(" | "));
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
const MODES = { coverage, integrity, laws, hermetic, path, suites, alive };
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
