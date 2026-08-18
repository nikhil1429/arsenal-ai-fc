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
//        · A DECLARED REFUSAL IS NOT A DEAD LANE (14 Aug 2026, the unleash
//          plan's Phase −1). Some lanes REFUSE BEFORE SPEND by design when
//          their inventory is empty — `dreams` is the built case: "few axes =
//          few dreams is honest, none = none" (brain.mjs:2766). Such a lane
//          RUNS on schedule and correctly writes nothing, so freshness-of-
//          artifact alone called it STALE and reddened the whole suite through
//          pulse `alive` for four days. The distinction is measured, never
//          assumed: the brain ledger's own newest row for that job, inside the
//          same cadence window, with total_tokens 0 and a note beginning
//          "skipped before spend" = the lane is ALIVE and EMPTY (a note). Any
//          other failure, or no run at all in the window, still bleeds STALE.
//
// MODES: node scripts/reconcile.mjs [report] · json · selftest
// ============================================================================

import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, mkdirSync, renameSync, mkdtempSync, utimesSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";   // THE GATE (18 Aug 2026): the one spawn — brain.mjs `gate json`, read-only
import { awakeModel } from "./herd.mjs";   // Block 8 · §14.3 — a lane's cadence is measured in the LAPTOP'S AWAKE HOURS, never the wall clock

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO      = join(__dirname, "..");
const STATE_DIR = join(REPO, "dressing-room", "state");
const OUT_DIR   = join(STATE_DIR, "brain_out");
const OUT_PATH  = join(STATE_DIR, "reconcile.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readJsonlSafe = (p) => { try { return readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
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

// LADDER G13 (9 Aug 2026) — THE PHANTOM NEEDLE. The bare quoted `"<out>"` form
// matched ANY string equal to a lane name anywhere in the tree: deep_twin's out
// "twin" collected 7 phantom consumers (slip rows' book:"twin", type tags…),
// none of which ever opened the lane. A quoted name now counts ONLY inside a
// join(...) call — the one shape that is actually a path being opened.
export function readersOfJoinContext(out, corpus, excludeBasenames = []) {
  const esc = String(out).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("join\\s*\\([^)]*[\"']" + esc + "[\"']");
  const hits = [];
  for (const { file, text } of corpus) {
    const b = basename(file);
    if (excludeBasenames.includes(b)) continue;
    if (re.test(stripComments(text))) hits.push(b);
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
// THE LEDGER READ — did the lane RUN, and what did it say? (14 Aug 2026)
// ---------------------------------------------------------------------------
// brain_ledger.jsonl is the SHARED APPEND LANE (CLAUDE.md's one documented
// exception to single-writer); this only ever READS its tail. Fail-silent by
// design and fail-CLOSED in effect: an unreadable ledger yields no rows, so
// every stale lane keeps its bleed — the exemption below can only be granted
// on evidence, never on the absence of it.
// The path is a module-level CONST, and the selftest injects `deps.ledgerRows`
// (fixtures, never a file) rather than a path — so xray's points-to analysis
// resolves this sink instead of banking it as another Unknown.
const REFUSAL_RE = /^skipped before spend/;
const LEDGER_PATH = join(STATE_DIR, "brain_ledger.jsonl");
export function lastRunsByJob(deps = {}) {
  if (deps.ledgerRows) {
    const by = {};
    for (const r of deps.ledgerRows) { if (r && r.job) by[r.job] = r; }   // file order = time order
    return by;
  }
  let lines = [];
  try { lines = readFileSync(LEDGER_PATH, "utf8").split("\n"); } catch { return {}; }
  const by = {};
  // walk the whole file forward; last row per job wins (append-only ⇒ ordered)
  for (const l of lines) {
    if (!l.trim()) continue;
    let r; try { r = JSON.parse(l); } catch { continue; }   // torn row — keep walking
    if (r && r.job) by[r.job] = r;
  }
  return by;
}

// A row is a DECLARED REFUSAL only if the organ spent nothing AND said so in the
// shape brain.mjs writes for its two pre-spend returns (required-input-absent,
// empty inventory). An ordinary failure — timeout, bad JSON, model error — is
// NOT this, and must keep bleeding.
export function isRefusalBeforeSpend(row) {
  return !!row && row.ok === false && (row.total_tokens === 0 || row.total_tokens == null)
    && REFUSAL_RE.test(String(row.note || ""));
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

// ---------------------------------------------------------------------------
// THE GATE'S TWO READS (ORGANISM_OVERHAUL 18 Aug 2026 §5.2/§5.3) — READ ONLY.
// (a) gate.jsonl — brain.mjs journals every asleep/awake transition there (one row
//     per transition, per lane). A lane ASLEEP by verdict is resting by rule; its
//     staleness is a NOTE, never a bleed — the same law as `paused` and the
//     refused-before-spend row above it. Reporting a sleeping lane as "stale" would
//     turn the ALIVE suite red on the day the gate did exactly what it exists to do.
// (b) consumption.jsonl — the lane's REACHED-HIM column. This file's own "consumers"
//     column answers "does some code read it" (a grep); the plan of record's whole
//     finding is that this is not the question. reached_him answers "did it get to
//     HIS ear/brief/card/eye, and when". Both are printed, side by side, because a
//     lane with five code readers and no reached_him in 14 days IS the bleed.
// ---------------------------------------------------------------------------
export function gateStatesFromJournal(rows) {
  const m = {};
  for (const r of rows || []) if (r && r.lane && r.state) m[r.lane] = r;
  return m;
}
// The live read: brain.mjs's own verdict for every enabled job (synchronous — the
// gate helpers are pure folds over rows brain reads itself), overlaid on the journal
// (which alone knows the non-brain lanes and the `since` instant). Any failure ⇒ the
// journal alone, never a throw: reconcile's exit-0 law.
function liveGateStates(cfg, now, outDir) {
  const journal = gateStatesFromJournal(readJsonlSafe(join(outDir, "gate.jsonl")));
  try {
    // brain.mjs's own machine face (`gate json`) — this file never imports brain
    // (reconcile is spawned BY pulse and the watchman; a heavy import here would
    // ride every sweep). Kept honest by falling back to the journal on any miss.
    const out = execFileSync(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), "brain.mjs"), "gate", "json"],
      { encoding: "utf8", timeout: 60000, windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "1" } });
    const j = JSON.parse(String(out).trim() || "{}");
    const m = { ...journal };
    for (const r of (Array.isArray(j.lanes) ? j.lanes : [])) {
      const jr = journal[r.lane];
      m[r.lane] = { ...r, ts: (jr && jr.state === r.state) ? jr.ts : now.toISOString(), journaled: !!(jr && jr.state === r.state) };
    }
    return m;
  } catch { return journal; }
}
export function reachedHimFor(rows, keys, now = new Date()) {
  const K = new Set(keys.filter(Boolean));
  let best = null;
  for (const r of rows || []) {
    if (!r || !(K.has(r.job) || K.has(r.lane)) || !r.kind) continue;
    const t = Date.parse(r.ts); if (!Number.isFinite(t)) continue;
    if (!best || t > best.t) best = { t, ts: r.ts, kind: r.kind, by: r.by || null };
  }
  return best ? { at: best.ts, kind: best.kind, by: best.by, age_days: Math.round(((now.getTime() - best.t) / 86400000) * 10) / 10 } : null;
}

function reconcileBrainLanes(deps = {}) {
  const cfg = deps.cfg !== undefined ? deps.cfg : readJson(join(STATE_DIR, "brain_config.json"));
  const corpus = gatherCorpus(deps);
  const now = deps.now || new Date();
  const outDir = deps.outDir || OUT_DIR;
  const consumedBy = consumptionMap(cfg);
  // LIVE VERDICT FIRST, JOURNAL SECOND. The journal gains a row only when a lane's
  // slot comes round (an asleep lane re-checks every scheduled slot); between the
  // gate landing and a lane's next window the journal is silent while the verdict
  // is already asleep — and that gap is exactly when the ALIVE suite would call the
  // lane stale. So the live verdict (brain.mjs gateReport, read-only) is asked
  // first and the journal fills in for lanes it does not cover; the selftest
  // injects gateRows and never loads brain.
  const gateStates = deps.gateRows !== undefined ? gateStatesFromJournal(deps.gateRows) : (deps.gateLive || liveGateStates)(cfg, now, outDir);
  const consumption = deps.consumptionRows !== undefined ? deps.consumptionRows : readJsonlSafe(join(STATE_DIR, "consumption.jsonl"));
  // THE BRAIN IS PAUSED is a DECISION, not a defect. With cfg.paused === true no job
  // runs at all, so every lane is stale by construction and reporting 16 "stale"
  // bleeds would be noise that buries the real findings (the unread lanes, which are
  // still true while paused). Same law as the disabled-job case: absence ≠ failure.
  const paused = cfg && cfg.paused === true;
  const lastRuns = lastRunsByJob(deps);
  // Block 8 · §14.3: the awake model (herd.awakeModel over presence_log.jsonl). A lane older than
  // its cadence BY THE CLOCK is not stale if the laptop was awake for less than one cadence of
  // that time — its slot never came. deps.awake lets the selftest inject one; null ⇒ clock rule.
  const awake = deps.awake !== undefined ? deps.awake : awakeModel({ sinceMs: now.getTime() - 21 * 86400000, now: now.getTime() });
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
      .concat(readersOfJoinContext(job.out, corpus, ["reconcile.mjs"]))   // G13 — join()-context only, phantoms dead
      .concat(consumedBy[job.out] || []);
    const uniqueConsumers = [...new Set(consumers)];

    // A `surface` declaration (audit #63) is the job SAYING where it lands. It is
    // a claim, not proof — so it is recorded next to the measured reader list, and
    // a job that claims a surface while nothing references it is its own finding.
    const declared = job.surface && (job.surface.where || job.surface.kind) ? job.surface : null;

    const bleeds = [];
    const notes = [];
    // THE FOLD (overhaul Block 5.2, 18 Aug 2026): a job with `folded_into` is displaced by
    // that target by design — the gate sleeps it (letter D) while the target covers the day
    // and wakes it as the fallback the night the target fails. Its staleness, and even a
    // never-produced dir, is the fold WORKING — a note naming the target, never a bleed;
    // the same law as `paused`, `asleep by THE GATE` and `_added`. Read off the config,
    // never a list here.
    const foldedInto = typeof job.folded_into === "string" && job.folded_into.trim() ? job.folded_into.trim() : null;
    if (!enabled) {
      // a disabled job is not a defect — it is a decision. Recorded, never bled.
      // G13 INVERSE SIGNAL (9 Aug 2026): but the moment a DISABLED job's
      // measured consumers go NON-empty, its own re-enable condition is met —
      // and until this line, nothing could ever say so: the notes that promise
      // "RE-ENABLE WHEN a reader exists" were promises with no messenger.
      if (uniqueConsumers.length) {
        notes.push(`re-enable condition MET — disabled, yet ${uniqueConsumers.length} reader(s) reference brain_out/${job.out}: ${uniqueConsumers.slice(0, 4).join(", ")}`);
      }
    } else if (newestMs === null) {
      // A LANE YOUNGER THAN ITS OWN CADENCE HAS NOT FAILED — IT HAS NOT BEEN
      // ASKED YET (14 Aug 2026). "never produced" is this file's loudest class
      // and it is right to be: diary was enabled, nightly, with three wired
      // readers and had never written a page. But a job ADDED TODAY is a
      // different fact wearing the same clothes, and on the day it lands the
      // suite goes red for a lane that is working exactly as designed — which
      // trains a reader to ignore the loudest signal in the report.
      // The birthday is DECLARED, never inferred: a job may carry `_added`
      // (YYYY-MM-DD). Inside one cadence of that date the absence is a note.
      // Past it, the bleed returns automatically with no cleanup to remember —
      // the note cannot rot into a permanent excuse.
      const born = job._added ? Date.parse(job._added + "T00:00:00") : NaN;
      const bornHoursAgo = Number.isFinite(born) ? (now.getTime() - born) / 3600000 : null;
      const notDueYet = bornHoursAgo !== null && bornHoursAgo <= maxAge;
      const line = fileCount === 0 && !existsSync(dir)
        ? `never produced — ${job.out}/ does not exist`
        : `never produced — ${job.out}/ is empty`;
      if (notDueYet) notes.push(`${line} — but the lane was ADDED ${job._added} (${Math.round(bornHoursAgo)}h ago) and its cadence allows ${Math.round(maxAge)}h: it has not been asked yet, and this becomes a bleed on its own the moment it is late`);
      else if (foldedInto) notes.push(`${line} — but the lane is FOLDED into ${foldedInto} (brain_config folded_into): the target does its work and the gate sleeps it on D; it runs as the fallback the night ${foldedInto} fails, so an empty dir here is the fold working, not a dead lane`);
      else bleeds.push(line);
    } else if (ageHours > maxAge) {
      const line = `newest ${job.out}/ file is ${Math.round(ageHours)}h old, cadence allows ${Math.round(maxAge)}h`;
      const lastRun = lastRuns[job.id];
      const lastRunMs = lastRun ? Date.parse(lastRun.ts || 0) : NaN;
      const ranInWindow = Number.isFinite(lastRunMs) && (now.getTime() - lastRunMs) / 3600000 <= maxAge;
      const asleep = gateStates[job.id] && gateStates[job.id].state === "asleep" ? gateStates[job.id] : null;
      if (paused) notes.push(`stale, but the brain is PAUSED (brain_config.paused) — expected: ${line}`);
      else if (asleep) {
        // ASLEEP BY THE GATE — resting by rule, not lying dead. The note carries the
        // verdict's own why and what wakes it, so a reader of this report never has to
        // open the journal to tell sleep from death. D (Block 5.2) = displaced by a fold.
        const failed = ["E", "C", "F", "D"].filter((k) => asleep.why && asleep.why[k] === false).join("+");
        notes.push(`asleep by THE GATE since ${String(asleep.ts).slice(0, 16)}Z (on ${failed || "?"}: ${asleep.detail ? failed.split("+").map((k) => asleep.detail[k]).filter(Boolean).join(" · ").slice(0, 160) : ""})${foldedInto ? ` · folded → ${foldedInto}` : ""} — wakes when: ${String(asleep.wakes_when || "").slice(0, 120)} · (${line})`);
      }
      else if (foldedInto) {
        // FOLDED, and the gate has not journaled it yet (its slot has not come round since the
        // fold landed, or the verdict read is unavailable): the fold is the reason, by config.
        notes.push(`stale, but FOLDED into ${foldedInto} (brain_config folded_into) — the target does this lane's work; the gate sleeps it on D at its next slot and wakes it as the fallback the night ${foldedInto} fails · (${line})`);
      }
      else if (typeof job.trigger === "string" && job.trigger) {
        // AN EVENT LANE (Block 5.2: teamtalk_pm + evening_voice ride `fulltime`, formation_read rides
        // `morning_signals`): it runs only when its arm is live, so between events it is idle BY
        // DESIGN — a note naming the event, never a stale bleed (the ALIVE suite would otherwise go
        // red every day he did not close). A lane with a `trigger_fallback_hm` still runs daily and
        // keeps the ordinary staleness rule.
        if (job.trigger_fallback_hm) bleeds.push(`stale — ${line}`);
        else notes.push(`stale, but an EVENT lane (brain_config trigger \`${job.trigger}\`): it runs only after the event arms it${job.trigger === "fulltime" ? " (postmatch.mjs at his full-time)" : ""} — idle between events by design · (${line})`);
      }
      else if (awake && awake.available && awake.awakeHoursSince(newestMs) !== null && awake.awakeHoursSince(newestMs) < maxAge) {
        // ASLEEP LAPTOP (Block 8 · §14.3): stale by the clock, but the machine was awake for less than
        // one cadence of that span — the lane's slot has not come round on a running laptop yet.
        notes.push(`stale by the CLOCK (${line}) but the laptop was AWAKE only ${awake.awakeHoursSince(newestMs).toFixed(1)}h of it — under one cadence: no slot was missed (herd.mjs awake model)`);
      }
      else if (ranInWindow && isRefusalBeforeSpend(lastRun)) {
        // ALIVE AND EMPTY: it ran, it refused before spending, it said why.
        notes.push(`no artifact, but the lane RAN and refused BEFORE SPEND ${Math.round((now.getTime() - lastRunMs) / 3600000)}h ago — ${String(lastRun.note || lastRun.error || "").slice(0, 120)} (${line})`);
      } else bleeds.push(`stale — ${line}${awake && awake.available && awake.awakeHoursSince(newestMs) !== null ? ` (awake ${awake.awakeHoursSince(newestMs).toFixed(0)}h of it — a slot came and it did not run)` : ""}`);
    }
    if (enabled && !uniqueConsumers.length) {
      // H0 FLOW AUDIT (10 Aug 2026): brain_config's _surface_law defined kind
      // "human_file" — "designed for the captain to read, nothing automated will" —
      // on 2 Aug, and this file never learned the word (grep human_file → zero):
      // six designed-for-his-eyes lanes (doubts, drill_forge, widget_spec, market,
      // twin_read, reanalysis) bled "no reader" on every sweep, drowning the one
      // real defect a sweep exists to surface. A DECLARED human_file lane with
      // zero measured readers is the declaration WORKING — a note, not a bleed.
      // Staleness above stays fully live for these lanes, and the bleed remains
      // for enabled lanes with no surface or kind code/job_input measuring zero
      // readers — exactly the distinction _surface_law was written to enable.
      if (declared && declared.kind === "human_file") {
        notes.push(`human_file by declaration — the reader is the captain (${String(declared.where || "").slice(0, 60)}); brain status prints it by path`);
      } else bleeds.push(declared
        ? `no reader — job declares surface "${String(declared.where || declared.kind).slice(0, 60)}" but nothing in the tree references brain_out/${job.out}`
        : `no reader and no declared surface — brain_out/${job.out} is written and opened by nothing`);
    }

    rows.push({
      job: job.id, out: job.out, enabled,
      files: fileCount,
      age_hours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
      cadence_max_hours: Math.round(maxAge),
      consumers: uniqueConsumers,
      // THE GATE (§5.2): machine-read (consumers) beside REACHED-HIM — two different
      // questions, both printed. null = never reached him on any recorded lane.
      reached_him: reachedHimFor(consumption, [job.id, job.out], now),
      gate: gateStates[job.id] ? { state: gateStates[job.id].state, since: gateStates[job.id].ts } : null,
      folded_into: foldedInto,
      declared_surface: declared ? (declared.where || declared.kind) : null,
      bleeds, notes,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// LADDER G13 · PASS 1b (9 Aug 2026) — THE UNDECLARED LANES. PASS 1 walks the
// CONFIG, so a brain_out/ dir no job declares as its `out` was never even
// looked at: nightshift/ and dugout/ (two of the busiest dirs on the machine)
// were structurally invisible to the very report that hunts unread output.
// readdir(brain_out) minus declared outs = the dirs written by side channels;
// each is reported with its measured reader count, same disease, same net.
// ---------------------------------------------------------------------------
function reconcileUndeclaredLanes(deps = {}) {
  const cfg = deps.cfg !== undefined ? deps.cfg : readJson(join(STATE_DIR, "brain_config.json"));
  const corpus = gatherCorpus(deps);
  const outDir = deps.outDir || OUT_DIR;
  const declared = new Set(((cfg && cfg.jobs) || []).map((j) => j.out).filter(Boolean));
  const rows = [];
  if (!existsSync(outDir)) return rows;
  for (const name of readdirSync(outDir)) {
    let st; try { st = statSync(join(outDir, name)); } catch { continue; }
    if (!st.isDirectory() || declared.has(name)) continue;
    // H0 FLOW AUDIT (10 Aug 2026): a dir carrying _VAULTED.md is retired residue,
    // kept by the layering law (never delete), explained by its own marker file.
    // First case: brain_out/twin/ — G11 renamed deep_twin's out to twin_read and
    // the 7 old files became permanent orphans PASS 1b re-surfaced every sweep.
    // A vaulted dir is reported (never hidden) but is not an orphan finding.
    const vaulted = existsSync(join(outDir, name, "_VAULTED.md"));
    let files = 0;
    try { files = readdirSync(join(outDir, name)).length; } catch { }
    // consumers = code readers + config-DECLARED job inputs (brain_out/dugout is
    // opened by nothing in code, but midday_digest/dugout_digest list it — a
    // declared input is a reader we can trust, same as consumptionMap's rule).
    const viaInputs = (((cfg && cfg.jobs) || []).filter((j) => (j.inputs || []).some((i) => String(typeof i === "string" ? i : (i && i.path) || "").startsWith(`brain_out/${name}`)))).map((j) => `${j.id} (job input)`);
    const consumers = [...new Set(readersOf(`brain_out/${name}`, corpus, ["reconcile.mjs"]).concat(viaInputs))];
    rows.push({ dir: name, files, consumers, vaulted, orphan: !vaulted && consumers.length === 0 });
  }
  return rows.sort((a, b) => Number(b.orphan) - Number(a.orphan) || b.files - a.files);
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
  const undeclared = reconcileUndeclaredLanes(deps);   // G13 PASS 1b
  const bus = reconcileStateBus(deps);
  const laneBleeds = lanes.filter((r) => r.bleeds.length);
  const orphans = bus.filter((r) => r.orphan);
  return {
    generated_at: (deps.now || new Date()).toISOString(),
    brain_paused: !!(cfg && cfg.paused === true),
    lanes_checked: lanes.length,
    lanes_bleeding: laneBleeds.length,
    undeclared_lanes: undeclared,
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
  if ((r.undeclared_lanes || []).length) {
    console.log(`undeclared lanes (G13 PASS 1b — dirs no job declares): ${r.undeclared_lanes.length}`);
    for (const u of r.undeclared_lanes) console.log(`  ${u.orphan ? "⚠" : "·"} brain_out/${u.dir}/ — ${u.files} file(s), ${u.consumers.length} reader(s)${u.vaulted ? " — VAULTED (retired residue, see its _VAULTED.md)" : u.consumers.length ? ` (${u.consumers.slice(0, 3).join(", ")})` : " — written by a side channel, read by NOTHING"}`);
  }
  for (const l of r.lanes.filter((x) => x.bleeds.length)) {
    console.log(`  ✗ ${l.job} → brain_out/${l.out}`);
    for (const b of l.bleeds) console.log(`      ${b}`);
  }
  const asleep = r.lanes.filter((x) => x.enabled && x.gate && x.gate.state === "asleep");
  const healthy = r.lanes.filter((x) => !x.bleeds.length && x.enabled && !(x.gate && x.gate.state === "asleep"));
  if (healthy.length) console.log(`  ✓ ${healthy.length} lane(s) fresh and consumed: ${healthy.map((h) => h.job).join(", ")}`);
  // THE GATE (18 Aug 2026): sleeping lanes named as such — resting by rule, and the
  // reached-him column beside them, because that is the whole difference.
  if (asleep.length) console.log(`  💤 ${asleep.length} lane(s) asleep by THE GATE (not stale, not dead — \`brain gate show\` says why and what wakes each): ${asleep.map((h) => h.job).join(", ")}`);
  const reached = r.lanes.filter((x) => x.enabled && x.reached_him);
  console.log(`  reached-him (consumption.jsonl, §5.2): ${reached.length}/${r.lanes.filter((x) => x.enabled).length} enabled lane(s) have EVER reached him${reached.length ? ` — ${reached.map((h) => `${h.job} ${h.reached_him.age_days}d (${h.reached_him.kind})`).join(", ")}` : ""}`);
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
  mkfile("his_lane/2026-08-04.md", 2);
  mkfile("his_stale_lane/2026-07-20.md", 24 * 15);
  mkfile("vault_lane/_VAULTED.md", 2);
  mkfile("vault_lane/2026-07-18.md", 24 * 20);
  mkfile("side_lane/2026-08-04.md", 2);

  const cfg = { jobs: [
    { id: "fresh_job",  out: "fresh_lane",  enabled: true, at: "08:00" },
    { id: "stale_job",  out: "stale_lane",  enabled: true, at: "08:00" },
    { id: "orphan_job", out: "orphan_lane", enabled: true, at: "08:00", surface: { kind: "human_read", where: "he opens it" } },
    { id: "never_job",  out: "never_lane",  enabled: true, at: "08:00" },
    { id: "off_job",    out: "off_lane",    enabled: false, at: "08:00" },
    { id: "his_file_job",  out: "his_lane",       enabled: true, at: "08:00", surface: { kind: "human_file", where: "the captain batch-glances it" } },
    { id: "his_stale_job", out: "his_stale_lane", enabled: true, at: "08:00", surface: { kind: "human_file", where: "the captain reads it" } },
  ] };
  // a fake corpus: only fresh_lane and stale_lane are referenced by anything
  const corpus = [{ file: "viz.mjs", text: `join("brain_out/fresh_lane", d); join("brain_out/stale_lane", d);` }];
  // awake: null ⇒ the CLOCK rule (hermetic — the live presence_log is never read by a selftest)
  const r = build({ awake: null,  cfg, corpus, now, outDir, stateDir: join(root, "nostate"), awake: null });

  const by = (id) => r.lanes.find((x) => x.job === id);
  ok("FRESH + CONSUMED lane bleeds nothing", by("fresh_job").bleeds.length === 0);
  ok("STALE lane is caught, and the message cites its own cadence",
    by("stale_job").bleeds.some((b) => /stale/.test(b) && /cadence allows/.test(b)));
  // Block 8 · §14.3 — THE AWAKE LAW on the same fixture: 15 days stale by the clock, but a laptop
  // awake only 6h of it has not reached one cadence ⇒ a NOTE, not a bleed; awake 60h (≥ the 48h cadence) ⇒ still a bleed,
  // and the bleed now says how many awake hours the slot had.
  {
    const rLittle = build({ cfg, corpus, now, outDir, stateDir: join(root, "nostate"), awake: { available: true, awakeHoursSince: () => 6 } });
    const rLots = build({ cfg, corpus, now, outDir, stateDir: join(root, "nostate"), awake: { available: true, awakeHoursSince: () => 60 } });
    const sLittle = rLittle.lanes.find((x) => x.job === "stale_job"), sLots = rLots.lanes.find((x) => x.job === "stale_job");
    ok("AWAKE LAW — stale by the clock but the laptop was awake < one cadence ⇒ a note naming the awake hours, NOT a bleed",
      !sLittle.bleeds.some((b) => /stale/.test(b)) && sLittle.notes.some((n) => /AWAKE only 6.0h/.test(n)));
    ok("AWAKE LAW — stale by the clock and awake ≥ one cadence ⇒ still a bleed, and it says the slot came",
      sLots.bleeds.some((b) => /stale/.test(b) && /awake 60h of it/.test(b)));
    ok("AWAKE LAW — the fresh lane is untouched by the awake model (only staleness consults it)", rLittle.lanes.find((x) => x.job === "fresh_job").bleeds.length === 0);
  }
  ok("ORPHAN lane is caught even though it is FRESH (this is the whole point)",
    by("orphan_job").bleeds.some((b) => /no reader/.test(b)));
  ok("a DECLARED surface does not excuse a missing reader (a claim is not proof)",
    by("orphan_job").bleeds.some((b) => /declares surface/.test(b)));
  ok("NEVER-PRODUCED is reported as absence, NOT as staleness (different facts)",
    by("never_job").bleeds.some((b) => /never produced/.test(b)) &&
    !by("never_job").bleeds.some((b) => /stale/.test(b)));
  ok("a DISABLED job is a decision, not a defect — no bleed", by("off_job").bleeds.length === 0);
  ok("the headline is COMPUTED, never the literal 'ok' (findings #68/#69)",
    /lane\(s\) bleeding/.test(r.status) && r.lanes_bleeding === 4);
  ok("a weekly job gets a WEEKLY bar, derived from its own /days declaration",
    Math.round(expectedMaxAgeHours({ days: ["sun"], at: "20:00" })) === 336);
  ok("a daily job gets a two-day bar", Math.round(expectedMaxAgeHours({ at: "08:00" })) === 48);

  // --- H0 FLOW AUDIT (10 Aug 2026): the human_file exemption + the vault ----
  ok("HUMAN_FILE declared + no measured reader = a NOTE, never a bleed (the declaration working)",
    by("his_file_job").bleeds.length === 0 &&
    by("his_file_job").notes.some((n) => /human_file by declaration/.test(n)));
  ok("HUMAN_FILE staleness stays FULLY LIVE — the exemption covers readers, not freshness",
    by("his_stale_job").bleeds.some((b) => /stale/.test(b)) &&
    !by("his_stale_job").bleeds.some((b) => /no reader/.test(b)));
  ok("a lesser surface kind (human_read, not the law's human_file) still bleeds — no accidental blanket",
    by("orphan_job").bleeds.some((b) => /no reader/.test(b)));
  const und = (id) => (r.undeclared_lanes || []).find((u) => u.dir === id);
  ok("PASS 1b — a _VAULTED.md dir is reported but NOT an orphan (retired residue, layering law)",
    und("vault_lane") && und("vault_lane").vaulted === true && und("vault_lane").orphan === false);
  ok("PASS 1b — an undeclared dir WITHOUT the marker still surfaces as an orphan",
    und("side_lane") && und("side_lane").orphan === true);

  // --- A NEWBORN LANE HAS NOT FAILED (14 Aug 2026) --------------------------
  const cfgNew = { jobs: [
    { id: "newborn",  out: "never_lane", enabled: true, at: "03:10", _added: "2026-08-04" },   // `now` in this selftest IS 2026-08-04
    { id: "overdue",  out: "never_lane", enabled: true, at: "03:10", _added: "2026-07-01" },
    { id: "undated",  out: "never_lane", enabled: true, at: "03:10" },
  ] };
  const rNew = build({ awake: null,  cfg: cfgNew, corpus: [{ file: "viz.mjs", text: `join("brain_out/never_lane", d);` }], now, outDir, stateDir: join(root, "nostate") });
  const laneOf = (id) => rNew.lanes.find((x) => x.job === id);
  ok("a lane ADDED today is NOT-DUE-YET (a note), not 'never produced' (a bleed)",
    laneOf("newborn").bleeds.length === 0 && laneOf("newborn").notes.some((n) => /has not been asked yet/.test(n)));
  ok("...and the excuse EXPIRES on its own: a lane added five weeks ago still bleeds",
    laneOf("overdue").bleeds.some((b) => /never produced/.test(b)));
  ok("...and a lane with no declared birthday is judged exactly as before (no silent amnesty)",
    laneOf("undated").bleeds.some((b) => /never produced/.test(b)));

  // --- A DECLARED REFUSAL IS NOT A DEAD LANE (14 Aug 2026) -----------------
  // The live case that reddened the suite for four days: `dreams` runs nightly,
  // finds the cracked-axes inventory empty, refuses BEFORE SPEND, and writes no
  // file — freshness alone called that "stale". Three witnesses, because the
  // exemption must be exactly as narrow as the fact it encodes.
  const cfg5 = { jobs: [{ id: "refuser", out: "stale_lane", enabled: true, at: "08:00" }] };
  const corpus5 = [{ file: "viz.mjs", text: `join("brain_out/stale_lane", d);` }];
  const staleOf = (rr) => rr.lanes[0].bleeds.filter((b) => /stale/.test(b));
  const rRefuse = build({ awake: null,  cfg: cfg5, corpus: corpus5, now, outDir, stateDir: join(root, "nostate"),
    ledgerRows: [{ job: "refuser", ts: new Date(now.getTime() - 3 * 3600000).toISOString(), ok: false, total_tokens: 0,
      note: "skipped before spend — the cracked-axes inventory is EMPTY" }] });
  ok("REFUSAL-BEFORE-SPEND inside the cadence window is a NOTE, not a stale bleed (the lane ran and correctly said nothing)",
    staleOf(rRefuse).length === 0 && rRefuse.lanes[0].notes.some((n) => /refused BEFORE SPEND/.test(n)));
  const rFail = build({ awake: null,  cfg: cfg5, corpus: corpus5, now, outDir, stateDir: join(root, "nostate"),
    ledgerRows: [{ job: "refuser", ts: new Date(now.getTime() - 3 * 3600000).toISOString(), ok: false, total_tokens: 4210,
      error: "claude exited 1", note: "model call failed" }] });
  ok("...but a GENUINE FAILURE in the same window still bleeds STALE — the exemption is for refusals only",
    staleOf(rFail).length === 1);
  const rOld = build({ awake: null,  cfg: cfg5, corpus: corpus5, now, outDir, stateDir: join(root, "nostate"),
    ledgerRows: [{ job: "refuser", ts: new Date(now.getTime() - 20 * 24 * 3600000).toISOString(), ok: false, total_tokens: 0,
      note: "skipped before spend — the cracked-axes inventory is EMPTY" }] });
  ok("...and a lane that STOPPED RUNNING still bleeds, however honest its last refusal was (the window is the test)",
    staleOf(rOld).length === 1);
  ok("...and with NO ledger readable at all the bleed stands — the exemption needs evidence, never its absence",
    staleOf(build({ awake: null,  cfg: cfg5, corpus: corpus5, now, outDir, stateDir: join(root, "nostate"), ledgerRows: [] })).length === 1);
  ok("isRefusalBeforeSpend rejects an ok row, a spent row, and a row with no note",
    !isRefusalBeforeSpend({ ok: true, total_tokens: 0, note: "skipped before spend — x" }) &&
    !isRefusalBeforeSpend({ ok: false, total_tokens: 9, note: "skipped before spend — x" }) &&
    !isRefusalBeforeSpend({ ok: false, total_tokens: 0 }));

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
  const r2 = build({ awake: null,  cfg: cfg2, corpus: [], now, outDir, stateDir: join(root, "nostate") });
  const by2 = (id) => r2.lanes.find((x) => x.job === id);
  ok("FALSE-POSITIVE 1 FIXED: a lane consumed as ANOTHER JOB'S INPUT is not an orphan",
    by2("produces_digest").bleeds.length === 0 &&
    by2("produces_digest").consumers.some((c) => /eats_digest \(job input\)/.test(c)));
  ok("FALSE-POSITIVE 2 FIXED: a `speak_to` lane is consumed by brain→mp3, not orphaned",
    by2("spoken").bleeds.length === 0 &&
    by2("spoken").consumers.some((c) => /mp3/.test(c)));

  // FALSE POSITIVE 3: with the brain PAUSED every lane is stale by construction.
  const cfg3 = { paused: true, jobs: [{ id: "old", out: "stale_lane", enabled: true, at: "08:00" }] };
  const r3 = build({ awake: null,  cfg: cfg3, corpus: [{ file: "viz.mjs", text: `brain_out/stale_lane` }], now, outDir, stateDir: join(root, "nostate") });
  ok("FALSE-POSITIVE 3 FIXED: a PAUSED brain makes staleness a note, never a bleed",
    r3.lanes[0].bleeds.length === 0 && r3.lanes[0].notes.some((n) => /PAUSED/.test(n)));
  ok("...and the paused state is stated out loud, not silently swallowed",
    r3.brain_paused === true);
  // FALSE POSITIVE 4: a lane read by brain.mjs ITSELF (minedAnchors → buildFingerprint)
  // was reported orphaned because brain.mjs was excluded wholesale.
  const cfg4 = { jobs: [{ id: "lex", out: "lexicon", enabled: true, at: "08:00" }] };
  mkfile("lexicon/2026-08-04.md", 2);
  const r4 = build({ awake: null,  cfg: cfg4, now, outDir, stateDir: join(root, "nostate"),
    corpus: [{ file: "brain.mjs", text: `function minedAnchors(dir = join(OUT_DIR, "brain_out/lexicon")) {}` }] });
  ok("FALSE-POSITIVE 4 FIXED: a lane consumed by brain.mjs itself is not an orphan",
    r4.lanes[0].bleeds.length === 0);
  ok("A COMMENT IS NOT A READER — prose naming the path proves nothing",
    build({ awake: null,  cfg: cfg4, now, outDir, stateDir: join(root, "nostate"),
      corpus: [{ file: "brain.mjs", text: `// writes brain_out/lexicon every night and NOTHING opened it` }] })
      .lanes[0].bleeds.some((b) => /no reader/.test(b)));
  ok("...and a URL in a comment-stripped file does not corrupt the scan",
    stripComments(`const u = "https://example.com/x"; // note`).includes("https://example.com/x"));

  ok("...but a paused brain does NOT hide a genuine no-reader finding",
    build({ awake: null,  cfg: { paused: true, jobs: [{ id: "x", out: "orphan_lane", enabled: true, at: "08:00" }] },
            corpus: [], now, outDir, stateDir: join(root, "nostate") })
      .lanes[0].bleeds.some((b) => /no reader/.test(b)));

  // ── THE GATE (overhaul 18 Aug 2026 §5.2/§5.3) — asleep is a note, reached-him is a column ──
  {
    const gateRows = [
      { ts: "2026-08-03T22:00:00Z", lane: "stale_job", state: "asleep", why: { E: true, C: false, F: true }, detail: { C: "never consumed by him" }, wakes_when: "its output reaches him" },
      { ts: "2026-08-03T22:00:00Z", lane: "fresh_job", state: "asleep" },
      { ts: "2026-08-04T02:00:00Z", lane: "fresh_job", state: "awake", why: { E: true, C: true, F: true } },
    ];
    const consumptionRows = [
      { ts: "2026-08-01T10:00:00Z", job: "fresh_job", kind: "briefed", by: "learnstate" },
      { ts: "2026-08-03T10:00:00Z", lane: "fresh_lane", kind: "sat", by: "dugout" },
      { ts: "garbage", job: "stale_job", kind: "spoken" },
    ];
    const g = build({ awake: null,  cfg, corpus, now, outDir, stateDir: join(root, "nostate"), gateRows, consumptionRows });
    const gs = g.lanes.find((x) => x.job === "stale_job"), gf = g.lanes.find((x) => x.job === "fresh_job");
    ok("GATE — a lane ASLEEP by verdict is a NOTE that names why + what wakes it, never a `stale` bleed (resting by rule ≠ lying dead)",
      gs.gate && gs.gate.state === "asleep" && !gs.bleeds.some((b) => /stale/.test(b)) && gs.notes.some((b) => /asleep by THE GATE/.test(b) && /never consumed/.test(b) && /wakes when/.test(b)));
    ok("GATE — the LAST journal row wins: a lane that slept then woke reads awake, and its staleness rule is untouched",
      gf.gate && gf.gate.state === "awake" && gf.bleeds.length === 0);
    ok("REACHED-HIM — the column comes off consumption.jsonl by job OR out-lane, newest wins, undateable rows ignored; a lane with no row reads null (never reached him) even with code readers",
      gf.reached_him && gf.reached_him.kind === "sat" && gf.reached_him.age_days === 1.1 && gs.reached_him === null && gs.consumers.length >= 1);
    ok("REACHED-HIM — the pure fold: keys match job or lane, undateable dropped, null when nothing",
      reachedHimFor(consumptionRows, ["stale_job", "stale_lane"], now) === null && reachedHimFor(consumptionRows, ["fresh_lane"], now).kind === "sat");
    ok("GATE — an ASLEEP lane still bleeds `no reader` when nothing references it (sleep hides staleness, never an orphan)",
      build({ awake: null,  cfg: { jobs: [{ id: "orphan_job", out: "orphan_lane", enabled: true, at: "08:00" }] }, corpus: [], now, outDir, stateDir: join(root, "nostate"),
        gateRows: [{ ts: "2026-08-03T22:00:00Z", lane: "orphan_job", state: "asleep" }], consumptionRows: [] }).lanes[0].bleeds.some((b) => /no reader/.test(b)));
    // ── THE FOLD (overhaul Block 5.2) — a folded lane is never a NEVER/stale bleed ──
    {
      const foldCfg = { jobs: [
        { id: "stale_job", out: "stale_lane", enabled: true, at: "03:10", folded_into: "prepare_tomorrow" },        // stale on disk, folded, gate journaled it asleep on D
        { id: "night_lane", out: "never_lane", enabled: true, at: "03:10", folded_into: "prepare_tomorrow" },        // never produced, folded → a note
        { id: "prepare_tomorrow", out: "prepare", enabled: true, at: "03:20" },
      ] };
      const fcorpus = [{ file: "x.mjs", text: 'read("brain_out/stale_lane/x") read("brain_out/never_lane/y") read("brain_out/prepare/z")' }];
      const f = build({ awake: null,  cfg: foldCfg, corpus: fcorpus, now, outDir, stateDir: join(root, "nostate"),
        gateRows: [{ ts: "2026-08-03T22:00:00Z", lane: "stale_job", state: "asleep", why: { E: true, C: true, F: true, D: false }, detail: { D: "folded → prepare_tomorrow: its artifact for 2026-08-04 exists" }, wakes_when: "the fold opens by itself the night prepare_tomorrow fails" }],
        consumptionRows: [] });
      const fs_ = f.lanes.find((x) => x.job === "stale_job"), fn = f.lanes.find((x) => x.job === "night_lane");
      ok("FOLD — a folded lane the gate journaled asleep on D reads as a note naming the letter AND the fold target (`on D · folded → prepare_tomorrow`), never a stale bleed; the row carries folded_into",
        fs_.folded_into === "prepare_tomorrow" && !fs_.bleeds.some((b) => /stale/.test(b)) && fs_.notes.some((b) => /asleep by THE GATE/.test(b) && /on D/.test(b) && /folded → prepare_tomorrow/.test(b)));
      ok("FOLD — a folded lane that NEVER produced (no dir) is a NOTE naming the fold, never the never-produced bleed (the fold working ≠ a dead lane)",
        fn.folded_into === "prepare_tomorrow" && fn.bleeds.length === 0 && fn.notes.some((b) => /never produced/.test(b) && /FOLDED into prepare_tomorrow/.test(b)));
      ok("EVENT LANE (Block 5.2) — a stale lane with a `trigger` and no fallback hour is a NOTE naming the event (idle between events by design), a trigger lane WITH a fallback hour still bleeds stale, an unfolded untriggered stale lane bleeds as before",
        (() => { const g3 = build({ awake: null,  cfg: { jobs: [{ id: "stale_job", out: "stale_lane", enabled: true, at: "20:40", trigger: "fulltime" }, { id: "sheet", out: "stale_lane", enabled: true, at: "08:45", trigger: "morning_signals", trigger_fallback_hm: "09:30" }, { id: "plain", out: "stale_lane", enabled: true, at: "03:10" }] }, corpus: fcorpus, now, outDir, stateDir: join(root, "nostate"), gateRows: [], consumptionRows: [] });
          const e = g3.lanes.find((x) => x.job === "stale_job"), sh = g3.lanes.find((x) => x.job === "sheet"), pl = g3.lanes.find((x) => x.job === "plain");
          return e && !e.bleeds.some((x) => /stale/.test(x)) && e.notes.some((x) => /EVENT lane/.test(x) && /fulltime/.test(x)) && sh && sh.bleeds.some((x) => /stale/.test(x)) && pl && pl.bleeds.some((x) => /stale/.test(x)); })());
      ok("FOLD — a folded lane that is stale with NO journal row yet is still a note (the fold is the reason, by config), while an unfolded stale lane bleeds as before",
        (() => { const g2 = build({ awake: null,  cfg: { jobs: [{ id: "stale_job", out: "stale_lane", enabled: true, at: "03:10", folded_into: "prepare_tomorrow" }, { id: "plain", out: "stale_lane", enabled: true, at: "03:10" }] }, corpus: fcorpus, now, outDir, stateDir: join(root, "nostate"), gateRows: [], consumptionRows: [] });
          const a = g2.lanes.find((x) => x.job === "stale_job"), b = g2.lanes.find((x) => x.job === "plain");
          return a && !a.bleeds.some((x) => /stale/.test(x)) && a.notes.some((x) => /FOLDED into prepare_tomorrow/.test(x)) && b && b.bleeds.some((x) => /stale/.test(x)); })());
    }
  }

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
