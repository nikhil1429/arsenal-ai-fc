#!/usr/bin/env node
// ============================================================================
// reconcile.mjs · ARSENAL AI FC — THE PRODUCE-AND-CONSUME RECONCILIATION
// ----------------------------------------------------------------------------
// WHAT:  Every day, for every artifact the organism PRODUCES, ask two questions:
//          (a) FRESHNESS — did it advance within its own declared cadence?
//          (b) CONSUMPTION — does anything actually read it?
//        Anything that fails either question is reported as a bleed.
//
// WHY:   This is the ONE instrument the 2 Aug 2026 audit named as the thing that
//        would have caught most of the audit itself. Its §6 "RESIDUAL RISK" is
//        blunt about the organism's deepest defect:
//
//            "It detects failure, never absence."
//
//        Every organ can tell you it FAILED. None of them can tell you it was
//        never READ. So the machine spent ~2.87M tokens all-time writing into
//        brain_out directories no line of code opens, wrote three nightly renders
//        into filenames viz can never resolve, built a 38-node concept graph
//        nightly for zero readers, and produced an 88,950-byte self-portrait whose
//        only two consumers had been deleted two weeks earlier — while every
//        status line stayed green, because nothing was FAILING.
//
//        Run once, this check would independently have caught audit findings
//        #65, #63, #72, #73, #46, #52, #33, #86, #27 and #95.
//
// HOW:   Deterministic, no LLM, read-only. It never repairs anything and never
//        deletes anything — it only reports. Two passes:
//          PASS 1 · BRAIN LANES — every job in brain_config.json declares `out`
//                   (a brain_out/ directory) and now, after audit #63, a
//                   `surface` naming where that output appears. Check the
//                   directory's real mtime against the job's own declared
//                   cadence, and check that something in the tree actually
//                   references it.
//          PASS 2 · STATE ARTIFACTS — every file on the state bus, counted by how
//                   many scripts reference it. Zero references = an artifact the
//                   organism writes and nobody opens.
//
// LAWS:  · NEVER GUESS A NUMBER. The staleness bar is derived from each job's OWN
//          declared cadence (see `expectedMaxAgeHours`), never invented.
//        · EXIT 0 ALWAYS on a successful run. Task Scheduler's `Last Result` is
//          what /organism-doctor reads to decide if an organ is ALIVE; encoding a
//          verdict in the exit code makes a healthy organ look broken. The verdict
//          rides in reconcile.json and on stdout, where verdicts belong.
//        · ABSENCE IS NOT FAILURE. A job that has never run is reported as
//          "never produced", never as "stale" — they are different facts.
//
// MODES: node scripts/reconcile.mjs [report] · json · selftest
// ============================================================================

import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, mkdirSync, renameSync, mkdtempSync, utimesSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO      = join(__dirname, "..");
const STATE_DIR = join(REPO, "dressing-room", "state");
const OUT_DIR   = join(STATE_DIR, "brain_out");
const OUT_PATH  = join(STATE_DIR, "reconcile.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// the corpus we search for readers — every place a path could be referenced
// ---------------------------------------------------------------------------
function gatherCorpus(deps = {}) {
  if (deps.corpus) return deps.corpus;
  const files = [];
  const walk = (dir, exts, depth = 0) => {
    if (depth > 4 || !existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".git")) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p, exts, depth + 1);
      else if (exts.some((x) => e.name.endsWith(x))) files.push(p);
    }
  };
  walk(join(REPO, "scripts"), [".mjs"]);
  walk(join(REPO, "hooks"), [".mjs"]);
  walk(join(REPO, ".claude"), [".md", ".json"]);
  walk(join(REPO, "setup"), [".ps1", ".cmd", ".vbs"]);
  return files.map((f) => ({ file: f, text: (() => { try { return readFileSync(f, "utf8"); } catch { return ""; } })() }));
}

// A COMMENT IS NOT A READER.
// The first live run counted `brain.mjs`'s own audit comment — "writes
// brain_out/lexicon/<date>.md every night and NOTHING opened it" — as evidence
// that something opened it. A path named in prose is the opposite of consumption,
// and this repo's code is unusually comment-dense, so this matters here.
function stripComments(text) {
  return String(text)
    .replace(/\/\*[\s\S]*?\*\//g, " ")        // block comments
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1")     // line comments (the [^:] guard spares https://)
    .replace(/^\s*(#|REM |')[^\n]*/gim, " "); // .ps1 / .cmd / .vbs comment forms
}

// Who references `needle`, excluding the files that are allowed to (its writer)?
function readersOf(needle, corpus, excludeBasenames = []) {
  const hits = [];
  for (const { file, text } of corpus) {
    const b = basename(file);
    if (excludeBasenames.includes(b)) continue;
    if (stripComments(text).includes(needle)) hits.push(b);
  }
  return [...new Set(hits)];
}

// ---------------------------------------------------------------------------
// cadence → how old is TOO old, derived from the job's own declaration
// ---------------------------------------------------------------------------
// NOT A GUESS (the captain's standing rule). The rule is stated once and applied
// uniformly: an artifact is stale past TWO of its own periods — one full period
// to be produced, one more to notice it wasn't. A daily job may therefore be a
// day late without crying; two days is a real signal.
function expectedMaxAgeHours(job) {
  const daysList = Array.isArray(job.days) ? job.days.length : 0;
  if (daysList && daysList < 7) return 24 * (7 / daysList) * 2;   // e.g. Sundays only → 8 days
  if (job.window === "overnight" || job.at || job.max_per_day) return 24 * 2;
  return 24 * 2;
}

// ---------------------------------------------------------------------------
// PASS 1 — the brain lanes
// ---------------------------------------------------------------------------
// A lane can be consumed in three different ways, and only one of them is a plain
// code reference. Missing the other two produced FALSE POSITIVES on the first live
// run — it accused `teamtalk_am`, `dugout_digest` and `evening_voice` of having no
// reader when all three are consumed, just not by a `join("brain_out/...")` call.
// A reconciler that cries wolf is the exact defect it exists to remove.
function consumptionMap(cfg) {
  const byOut = {};                      // "dugout_digest" -> ["midday_cartridge (job input)", ...]
  const add = (out, who) => { (byOut[out] ||= []).push(who); };
  for (const job of (cfg && cfg.jobs) || []) {
    // (1) ANOTHER JOB'S INPUT. brain_config declares these explicitly, so this is a
    //     declaration we can trust rather than a grep we have to interpret.
    for (const i of job.inputs || []) {
      const p = typeof i === "string" ? i : (i && i.path);
      const m = typeof p === "string" && p.match(/^brain_out\/([^/]+)/);
      if (m) add(m[1], `${job.id} (job input)`);
    }
    // (2) BRAIN RENDERS IT TO SPEECH. `speak_to` means brain.mjs hands the text to
    //     speak.mjs and an mp3 lands in club/media — brain.mjs is a real consumer
    //     here, not the writer. Driven by the job's own declaration, not a guess.
    if (job.speak_to && job.out) add(job.out, `brain.mjs → mp3 (speak_to: ${job.speak_to})`);
  }
  return byOut;
}

function reconcileBrainLanes(deps = {}) {
  const cfg = deps.cfg !== undefined ? deps.cfg : readJson(join(STATE_DIR, "brain_config.json"));
  const corpus = gatherCorpus(deps);
  const now = deps.now || new Date();
  const outDir = deps.outDir || OUT_DIR;
  const consumedBy = consumptionMap(cfg);
  // THE BRAIN IS PAUSED is a DECISION, not a defect. With cfg.paused === true no job
  // runs at all, so every lane is stale by construction and reporting 16 "stale"
  // bleeds would be noise that buries the real findings (the unread lanes, which are
  // still true while paused). Same law as the disabled-job case: absence ≠ failure.
  const paused = cfg && cfg.paused === true;
  const rows = [];

  for (const job of (cfg && cfg.jobs) || []) {
    if (!job.out) continue;
    const dir = join(outDir, job.out);
    const enabled = job.enabled !== false;

    // --- freshness ---------------------------------------------------------
    let newestMs = null, fileCount = 0;
    if (existsSync(dir)) {
      for (const f of readdirSync(dir)) {
        try {
          const st = statSync(join(dir, f));
          if (!st.isFile()) continue;
          fileCount++;
          if (newestMs === null || st.mtimeMs > newestMs) newestMs = st.mtimeMs;
        } catch {}
      }
    }
    const ageHours = newestMs === null ? null : (now.getTime() - newestMs) / 3600000;
    const maxAge = expectedMaxAgeHours(job);

    // --- consumption -------------------------------------------------------
    // The organ that WRITES brain_out is brain.mjs, so it is never its own reader.
    // brain.mjs is deliberately NOT excluded for the `brain_out/<out>` needle.
    // Its WRITE path is generic — `join(OUT_DIR, job.out || job.id, ...)` — and never
    // contains a literal lane name, so a literal `brain_out/lexicon` inside brain.mjs
    // can only be a READ. That is exactly how `minedAnchors()` consumes the lexicon
    // lane (audit #5's fix), and excluding brain.mjs wholesale reported that wiring as
    // an orphan. Comments are stripped first, so the audit's own prose about the lane
    // is not mistaken for a reader.
    // Neither needle excludes brain.mjs, and both reasons are the same: brain's WRITE
    // path is `writeAtomic(join(OUT_DIR, job.out || job.id, ...))`, which contains
    // neither a literal `brain_out/<name>` nor a quoted `"<name>"`. So either literal
    // appearing in brain.mjs can only be a READ — which is precisely how audit #5's
    // fix reads the lexicon lane: `minedAnchors(dir = join(OUT_DIR, "lexicon"))`.
    // Comments are stripped first, so the audit's prose about a lane is not a reader.
    const consumers = readersOf(`brain_out/${job.out}`, corpus, ["reconcile.mjs"])
      .concat(readersOf(`"${job.out}"`, corpus, ["reconcile.mjs"]))
      .concat(consumedBy[job.out] || []);
    const uniqueConsumers = [...new Set(consumers)];

    // A `surface` declaration (audit #63) is the job SAYING where it lands. It is
    // a claim, not proof — so it is recorded next to the measured reader list, and
    // a job that claims a surface while nothing references it is its own finding.
    const declared = job.surface && (job.surface.where || job.surface.kind) ? job.surface : null;

    const bleeds = [];
    const notes = [];
    if (!enabled) {
      // a disabled job is not a defect — it is a decision. Recorded, never bled.
    } else if (newestMs === null) {
      bleeds.push(fileCount === 0 && !existsSync(dir)
        ? `never produced — ${job.out}/ does not exist`
        : `never produced — ${job.out}/ is empty`);
    } else if (ageHours > maxAge) {
      const line = `newest ${job.out}/ file is ${Math.round(ageHours)}h old, cadence allows ${Math.round(maxAge)}h`;
      if (paused) notes.push(`stale, but the brain is PAUSED (brain_config.paused) — expected: ${line}`);
      else bleeds.push(`stale — ${line}`);
    }
    if (enabled && !uniqueConsumers.length) {
      bleeds.push(declared
        ? `no reader — job declares surface "${String(declared.where || declared.kind).slice(0, 60)}" but nothing in the tree references brain_out/${job.out}`
        : `no reader and no declared surface — brain_out/${job.out} is written and opened by nothing`);
    }

    rows.push({
      job: job.id, out: job.out, enabled,
      files: fileCount,
      age_hours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
      cadence_max_hours: Math.round(maxAge),
      consumers: uniqueConsumers,
      declared_surface: declared ? (declared.where || declared.kind) : null,
      bleeds, notes,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// PASS 2 — the state bus
// ---------------------------------------------------------------------------
function reconcileStateBus(deps = {}) {
  const corpus = gatherCorpus(deps);
  const dir = deps.stateDir || STATE_DIR;
  const rows = [];
  if (!existsSync(dir)) return rows;

  for (const name of readdirSync(dir)) {
    if (!/\.(json|jsonl|md)$/.test(name)) continue;
    if (/\.(bak|tmp|orig)$/.test(name)) continue;
    if (/^reconcile\.json$/.test(name)) continue;
    let st; try { st = statSync(join(dir, name)); } catch { continue; }
    if (!st.isFile()) continue;

    const refs = readersOf(name, corpus, ["reconcile.mjs"]);
    // A config the organism only ever reads is fine; an OUTPUT nobody reads is not.
    // We cannot tell those apart from the filesystem, so we report the count and
    // let the reader judge — claiming to know would be the same lie we are hunting.
    rows.push({
      file: name,
      bytes: st.size,
      referenced_by: refs,
      orphan: refs.length === 0,
    });
  }
  return rows.sort((a, b) => Number(b.orphan) - Number(a.orphan) || b.bytes - a.bytes);
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------
function build(deps = {}) {
  const cfg = deps.cfg !== undefined ? deps.cfg : readJson(join(STATE_DIR, "brain_config.json"));
  const lanes = reconcileBrainLanes(deps);
  const bus = reconcileStateBus(deps);
  const laneBleeds = lanes.filter((r) => r.bleeds.length);
  const orphans = bus.filter((r) => r.orphan);
  return {
    generated_at: (deps.now || new Date()).toISOString(),
    brain_paused: !!(cfg && cfg.paused === true),
    lanes_checked: lanes.length,
    lanes_bleeding: laneBleeds.length,
    state_files_checked: bus.length,
    state_orphans: orphans.length,
    lanes,
    orphans: orphans.map((o) => ({ file: o.file, bytes: o.bytes })),
    // The headline is COMPUTED, never a literal — audit findings #68/#69 were two
    // fields that always read "ok" while the detail beneath them said otherwise.
    status: laneBleeds.length === 0 && orphans.length === 0 ? "all produced work reaches a reader" : `${laneBleeds.length} lane(s) bleeding · ${orphans.length} orphaned artifact(s)`,
  };
}

function printReport(r) {
  console.log(`\n== PRODUCE-AND-CONSUME RECONCILIATION  [${r.generated_at.slice(0, 10)}] ==`);
  if (r.brain_paused) console.log(`NOTE: brain_config.paused === true — no job is running, so staleness is EXPECTED and is reported as a note, not a bleed. "No reader" findings are still live.`);
  console.log(`brain lanes: ${r.lanes_checked} checked · ${r.lanes_bleeding} bleeding`);
  for (const l of r.lanes.filter((x) => x.bleeds.length)) {
    console.log(`  ✗ ${l.job} → brain_out/${l.out}`);
    for (const b of l.bleeds) console.log(`      ${b}`);
  }
  const healthy = r.lanes.filter((x) => !x.bleeds.length && x.enabled);
  if (healthy.length) console.log(`  ✓ ${healthy.length} lane(s) fresh and consumed: ${healthy.map((h) => h.job).join(", ")}`);
  const off = r.lanes.filter((x) => !x.enabled);
  if (off.length) console.log(`  · ${off.length} disabled (a decision, not a defect): ${off.map((h) => h.job).join(", ")}`);
  console.log(`\nstate bus: ${r.state_files_checked} artifact(s) · ${r.state_orphans} referenced by nothing`);
  for (const o of r.orphans.slice(0, 20)) console.log(`  ? ${o.file}  (${o.bytes} bytes)`);
  if (r.orphans.length > 20) console.log(`  … and ${r.orphans.length - 20} more`);
  console.log(`\nSTATUS: ${r.status}\n`);
}

// ---------------------------------------------------------------------------
// selftest — fixtures only, never touches the live bus
// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const ok = (n, c) => { if (c) { pass++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}`); } };
  const now = new Date("2026-08-04T12:00:00Z");
  const wf = writeFileSync, mk = mkdirSync;
  const root = mkdtempSync(join(tmpdir(), "reconcile-"));
  const outDir = join(root, "brain_out");

  const mkfile = (rel, ageHours) => {
    const p = join(outDir, rel);
    mk(dirname(p), { recursive: true });
    wf(p, "x");
    const t = new Date(now.getTime() - ageHours * 3600000);
    utimesSync(p, t, t);
  };
  mkfile("fresh_lane/2026-08-04.md", 2);
  mkfile("stale_lane/2026-07-20.md", 24 * 15);
  mkfile("orphan_lane/2026-08-04.md", 2);

  const cfg = { jobs: [
    { id: "fresh_job",  out: "fresh_lane",  enabled: true, at: "08:00" },
    { id: "stale_job",  out: "stale_lane",  enabled: true, at: "08:00" },
    { id: "orphan_job", out: "orphan_lane", enabled: true, at: "08:00", surface: { kind: "human_read", where: "he opens it" } },
    { id: "never_job",  out: "never_lane",  enabled: true, at: "08:00" },
    { id: "off_job",    out: "off_lane",    enabled: false, at: "08:00" },
  ] };
  // a fake corpus: only fresh_lane and stale_lane are referenced by anything
  const corpus = [{ file: "viz.mjs", text: `join("brain_out/fresh_lane", d); join("brain_out/stale_lane", d);` }];
  const r = build({ cfg, corpus, now, outDir, stateDir: join(root, "nostate") });

  const by = (id) => r.lanes.find((x) => x.job === id);
  ok("FRESH + CONSUMED lane bleeds nothing", by("fresh_job").bleeds.length === 0);
  ok("STALE lane is caught, and the message cites its own cadence",
    by("stale_job").bleeds.some((b) => /stale/.test(b) && /cadence allows/.test(b)));
  ok("ORPHAN lane is caught even though it is FRESH (this is the whole point)",
    by("orphan_job").bleeds.some((b) => /no reader/.test(b)));
  ok("a DECLARED surface does not excuse a missing reader (a claim is not proof)",
    by("orphan_job").bleeds.some((b) => /declares surface/.test(b)));
  ok("NEVER-PRODUCED is reported as absence, NOT as staleness (different facts)",
    by("never_job").bleeds.some((b) => /never produced/.test(b)) &&
    !by("never_job").bleeds.some((b) => /stale/.test(b)));
  ok("a DISABLED job is a decision, not a defect — no bleed", by("off_job").bleeds.length === 0);
  ok("the headline is COMPUTED, never the literal 'ok' (findings #68/#69)",
    /lane\(s\) bleeding/.test(r.status) && r.lanes_bleeding === 3);
  ok("a weekly job gets a WEEKLY bar, derived from its own /days declaration",
    Math.round(expectedMaxAgeHours({ days: ["sun"], at: "20:00" })) === 336);
  ok("a daily job gets a two-day bar", Math.round(expectedMaxAgeHours({ at: "08:00" })) === 48);

  // --- THE THREE FALSE POSITIVES from the first live run -------------------
  // A reconciler that cries wolf is the exact defect it exists to remove, so each
  // one gets a permanent regression witness.
  const cfg2 = { jobs: [
    { id: "produces_digest", out: "digest_lane", enabled: true, at: "08:00" },
    { id: "eats_digest",     out: "eater_lane",  enabled: true, at: "08:00",
      inputs: ["brain_out/digest_lane/TODAY.md", { path: "timeaudit.json", required: true }] },
    { id: "spoken",          out: "spoken_lane", enabled: true, at: "08:00", speak_to: "teamtalk_am" },
  ] };
  mkfile("digest_lane/2026-08-04.md", 2);
  mkfile("eater_lane/2026-08-04.md", 2);
  mkfile("spoken_lane/2026-08-04.md", 2);
  const r2 = build({ cfg: cfg2, corpus: [], now, outDir, stateDir: join(root, "nostate") });
  const by2 = (id) => r2.lanes.find((x) => x.job === id);
  ok("FALSE-POSITIVE 1 FIXED: a lane consumed as ANOTHER JOB'S INPUT is not an orphan",
    by2("produces_digest").bleeds.length === 0 &&
    by2("produces_digest").consumers.some((c) => /eats_digest \(job input\)/.test(c)));
  ok("FALSE-POSITIVE 2 FIXED: a `speak_to` lane is consumed by brain→mp3, not orphaned",
    by2("spoken").bleeds.length === 0 &&
    by2("spoken").consumers.some((c) => /mp3/.test(c)));

  // FALSE POSITIVE 3: with the brain PAUSED every lane is stale by construction.
  const cfg3 = { paused: true, jobs: [{ id: "old", out: "stale_lane", enabled: true, at: "08:00" }] };
  const r3 = build({ cfg: cfg3, corpus: [{ file: "viz.mjs", text: `brain_out/stale_lane` }], now, outDir, stateDir: join(root, "nostate") });
  ok("FALSE-POSITIVE 3 FIXED: a PAUSED brain makes staleness a note, never a bleed",
    r3.lanes[0].bleeds.length === 0 && r3.lanes[0].notes.some((n) => /PAUSED/.test(n)));
  ok("...and the paused state is stated out loud, not silently swallowed",
    r3.brain_paused === true);
  // FALSE POSITIVE 4: a lane read by brain.mjs ITSELF (minedAnchors → buildFingerprint)
  // was reported orphaned because brain.mjs was excluded wholesale.
  const cfg4 = { jobs: [{ id: "lex", out: "lexicon", enabled: true, at: "08:00" }] };
  mkfile("lexicon/2026-08-04.md", 2);
  const r4 = build({ cfg: cfg4, now, outDir, stateDir: join(root, "nostate"),
    corpus: [{ file: "brain.mjs", text: `function minedAnchors(dir = join(OUT_DIR, "brain_out/lexicon")) {}` }] });
  ok("FALSE-POSITIVE 4 FIXED: a lane consumed by brain.mjs itself is not an orphan",
    r4.lanes[0].bleeds.length === 0);
  ok("A COMMENT IS NOT A READER — prose naming the path proves nothing",
    build({ cfg: cfg4, now, outDir, stateDir: join(root, "nostate"),
      corpus: [{ file: "brain.mjs", text: `// writes brain_out/lexicon every night and NOTHING opened it` }] })
      .lanes[0].bleeds.some((b) => /no reader/.test(b)));
  ok("...and a URL in a comment-stripped file does not corrupt the scan",
    stripComments(`const u = "https://example.com/x"; // note`).includes("https://example.com/x"));

  ok("...but a paused brain does NOT hide a genuine no-reader finding",
    build({ cfg: { paused: true, jobs: [{ id: "x", out: "orphan_lane", enabled: true, at: "08:00" }] },
            corpus: [], now, outDir, stateDir: join(root, "nostate") })
      .lanes[0].bleeds.some((b) => /no reader/.test(b)));

  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "FAILURES: " + fail} (${pass} passed, ${fail} failed)`);
  return fail === 0;
}
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "report").toLowerCase();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  const r = build();
  writeAtomic(OUT_PATH, r);
  if (mode === "json") console.log(JSON.stringify(r, null, 2));
  else printReport(r);
  // EXIT 0 ALWAYS on a successful run — the verdict rides in the file and on
  // stdout, never in the exit code (see LAWS in the header).
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error("reconcile error:", e.message); process.exit(1); });
}

export { build, reconcileBrainLanes, reconcileStateBus, expectedMaxAgeHours, readersOf, stripComments, consumptionMap, selftest };
