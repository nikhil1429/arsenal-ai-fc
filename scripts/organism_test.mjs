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
const hasSelftest = (f) => /['"`]selftest['"`]/.test(readFileSync(join(ROOT, "scripts", f), "utf8"));

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
  assert("the runner covers every member of both suites (coverage cannot shrink on a red)",
    members.length >= 59, `only ${members.length} members parsed out of the two suites`);
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
  const LIVE_WRITERS = /afferent\.jsonl|salience_ledger\.jsonl|presence_log|recall_index|brain_queue|context_state|dossier\.json|pitch_read|token_vitals\.json|workspace\.json|working_set\.json|throwin_state\.json|teaching_contract\.json|teaching_audit|brain_ledger\.jsonl|tanks\.json|bg_queue\.jsonl|wake_queue\.jsonl|wake\.json/;
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
