#!/usr/bin/env node
// ============================================================================
// calibration.mjs · ARSENAL AI FC — AGENT #2: CALIBRATION
// ----------------------------------------------------------------------------
// WHAT:  Measures self-knowledge honesty — does the captain's stated confidence
//        match his actual accuracy — and flags topics where he is confident-but-
//        WRONG (the dangerous illusion). A CONSUMER of reps_log.jsonl (Agent #0);
//        never writes it.
// WHY:   "knew"-but-wrong is a blind spot; "guessed"-and-wrong is honest. The gap
//        between claimed and real accuracy is the single most useful learning
//        signal. Domain-general: reads BOTH tracks (a knew-wrong on Python is as
//        much a blind spot as on a concept).
//
// THE SCALAR — calibration_gap = ECE (Expected Calibration Error):
//        ECE = Σ_bucket (n_b / N) · | accuracy_b − target_b |   over knew/shaky/guessed
//        targets from calibration_config.json {knew,shaky,guessed}; empty bucket skipped.
//   overconfidence_rate = P(correct==false | confidence=="knew")  (danger keys off THIS).
//
// DANGER ZONE — per TRACK+topic (canonical id; concepts{} and skills{} are separate namespaces,
//   so each entry carries its own `track`), knew-WRONG only. A topic enters iff:
//   (a) ≥ danger.min_knew_reps knew-reps, AND (b) knew-accuracy < danger.accuracy_mid.
//   confidence:"high" always; accuracy:"low" if <accuracy_low else "mid". shaky/guessed
//   wrongs NEVER enter. AXIS-SHARPEN (concept-track): if ≥2 knew-wrong reps share one axis
//   (the plurality), attach it. Bias to SILENCE (Fork 4): an early false alarm is worse
//   than a missed one.
//
// RELIABILITY FLOOR:
//   N==0            → status "awaiting_data", gap null, danger [] (nothing fabricated).
//   0<N<min_reps    → status "warming_up", gap computed, low_confidence:true, danger [] (SUPPRESSED).
//   N≥min_reps      → status "ok", low_confidence:false, danger active.
//
// TREND — rolling REP-COUNT windows (not calendar): current = ECE(last window_size),
//   prior = ECE(the window before). narrowing / widening / holding steady; <2 windows =
//   "establishing baseline (N reps)".
//
// OUTPUT: dressing-room/state/calibration.json (single writer; gitignored — derived PII).
//   { date, calibration_gap, trend, overconfidence_rate, buckets, danger_zone,
//     total_reps, status, low_confidence, registry_loaded, registry_error, gate,
//     config, corpus, generated_at }
//   (THE_MANAGER §4/§10 + extras).
//
// MODES: recompute (default) · selftest
// RULES (CONDUCTOR §4): deterministic · no API key · Node 22 ESM · Windows-safe entry
//   guard · atomic write (temp→rename) · empty-safe · never fabricate · matches fsrs.mjs style.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";        // selftest fixtures only — the loader is proved on a real file, never on a mock (capture.mjs:1070, fsrs.mjs:747)
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { supersedeReps } from "./capture.mjs";   // BLOCK 4 — the SOLE WRITER of reps_log owns what supersession means

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const REPS_LOG  = join(STATE_DIR, "reps_log.jsonl");
const CAL       = join(STATE_DIR, "calibration.json");
const CFG_PATH  = join(STATE_DIR, "calibration_config.json");   // canon (committed)
const CONCEPTS_PATH = join(STATE_DIR, "concepts.json");         // canon (committed)

const DEFAULTS = {
  targets: { knew: 0.95, shaky: 0.65, guessed: 0.30 },
  window_size: 20, min_reps: 20, trend_delta: 0.02,
  danger: { min_knew_reps: 3, accuracy_low: 0.5, accuracy_mid: 0.67 },
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const CONF   = new Set(["knew", "shaky", "guessed"]);
const TRACKS = new Set(["concept", "skill"]);
const normText = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
const round = (x, d = 4) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);
const numOr = (x, dflt) => (typeof x === "number" && !Number.isNaN(x) ? x : dflt);
const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

// E2E audit 25 Jul 2026 (4b9d982e): the three SCALAR knobs were numOr-guarded but the two
// NESTED ones were raw object spreads — `{ ...d.targets, ...(j.targets || {}) }` — so any value
// type from the hand-edited calibration_config.json walked straight into the math. A typo'd
// target ("0..67", "0.95%") makes ece() return NaN, calibration_gap serialises as null and the
// trend prints "holding steady (~NaN)" while status still reads "ok" — a silently dead scalar.
// A typo'd danger.accuracy_mid is worse: `acc >= NaN` is always false, so gate (b) never fires
// and EVERY 3-knew topic floods the danger zone labelled "the dangerous illusion", which the
// Manager, nightshift and setpiece all drill HARDEST. Guard every leaf like nemesis.mjs does.
//
// WIRING AUDIT, 11 Aug 2026 — THE SILENT CLAMP (the other half of the guard above).
// The 25 Jul repair made every leaf SAFE and left it MUTE. calibration_config.json's own
// _comment invites the captain to retune it — "A deliberate SEED, not sacred — retune from
// real data" — and the moment he types `"min_reps": "12"` (a string, a trailing space, a
// stray %) numOr throws his edit away and this organ gates at 20 forever with nothing,
// anywhere, saying so. loadConfig's bare `catch` was worse: a whole unparseable file
// vanished into DEFAULTS without even an error message. Proven this run before the repair:
// normalizeConfig({min_reps:'12'}) → 20, and the published keys were
// date,calibration_gap,trend,overconfidence_rate,buckets,danger_zone,total_reps,status,
// low_confidence,gate,generated_at — not one of them naming a rejection.
// THE ARITHMETIC IS UNTOUCHED. numLeaf calls the same numOr, with the same fallback, so
// every number this file has ever produced from every input is byte-identical (asserted
// below, fixture-for-fixture, against the 25 Jul regression's own expected values). This
// pass only makes the clamp SAY SO — and NOT ONE THRESHOLD WAS ADDED: `using` is whatever
// DEFAULTS already held. The one hole deliberately LEFT OPEN, because closing it would
// change the engine and that is his call: numOr accepts ±Infinity (typeof "number", not
// NaN), so `min_reps: 1e999` still walks in and shuts the gate forever. It is not a
// rejection, so it is not reported as one.
function describeLeaf(v) {
  // His edit, echoed back the way he typed it: a string KEEPS its quotes, so "12 " is
  // visibly a string with a trailing space rather than a number that mysteriously lost.
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number") return "NaN";        // only NaN reaches here — every other number is accepted
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;                                 // boolean · object · function · undefined
}

// One config leaf, clamped exactly as before and JOURNALLED. `rejected` is only for a key
// the captain actually WROTE and that was thrown away — an absent key falling back is a
// default, not a discard, and conflating the two would cry wolf on every fresh install.
function numLeaf(src, key, dflt, path, read) {
  const v = src[key];
  const kept = numOr(v, dflt);                     // ← the 25 Jul guard, unchanged
  if (kept !== v) {                                // identity: a leaf that legitimately EQUALS its default stays silent
    read.defaults_used.push(path);
    if (key in src) read.rejected.push({ key: path, got: describeLeaf(v), using: dflt });
  }
  return kept;
}

const KNOWN_ROOT    = ["targets", "window_size", "min_reps", "trend_delta", "danger"];
const KNOWN_TARGETS = ["knew", "shaky", "guessed"];
const KNOWN_DANGER  = ["min_knew_reps", "accuracy_low", "accuracy_mid"];

function normalizeConfig(j, meta = {}) {
  const d = DEFAULTS;
  const read = {
    source: meta.source || "in-memory",             // loadConfig overrides with what the disk actually gave
    path: meta.path || null,
    error: meta.error || null,
    rejected: [], defaults_used: [], unknown: [],
  };
  const isObj = j !== null && typeof j === "object" && !Array.isArray(j);
  if (j !== null && j !== undefined && !isObj) read.rejected.push({ key: "(root)", got: describeLeaf(j), using: "every default" });
  const o = isObj ? j : {};
  const tRaw = o.targets, gRaw = o.danger;
  const t = (tRaw && typeof tRaw === "object") ? tRaw : {};
  const g = (gRaw && typeof gRaw === "object") ? gRaw : {};
  // a whole SUB-OBJECT typed as something else takes all three of its leaves with it, and
  // the per-leaf pass below cannot see that (it walks the empty {} it was handed instead)
  if ("targets" in o && t !== tRaw) read.rejected.push({ key: "targets", got: describeLeaf(tRaw), using: "the three target defaults" });
  if ("danger"  in o && g !== gRaw) read.rejected.push({ key: "danger",  got: describeLeaf(gRaw), using: "the three danger defaults" });
  // A MISSPELLED KEY IS THE QUIETEST FAILURE OF ALL — `min_rep: 12` is not a rejection,
  // it is a no-op, and the leaf pass never even looks at it. `_`-prefixed keys are the
  // file's own prose (`_comment`), which is why the live config is not reported as unknown.
  for (const k of Object.keys(o)) if (!k.startsWith("_") && !KNOWN_ROOT.includes(k))    read.unknown.push(k);
  for (const k of Object.keys(t)) if (!k.startsWith("_") && !KNOWN_TARGETS.includes(k)) read.unknown.push(`targets.${k}`);
  for (const k of Object.keys(g)) if (!k.startsWith("_") && !KNOWN_DANGER.includes(k))  read.unknown.push(`danger.${k}`);
  return {
    targets: {
      knew:    numLeaf(t, "knew",    d.targets.knew,    "targets.knew",    read),
      shaky:   numLeaf(t, "shaky",   d.targets.shaky,   "targets.shaky",   read),
      guessed: numLeaf(t, "guessed", d.targets.guessed, "targets.guessed", read),
    },
    window_size: numLeaf(o, "window_size", d.window_size, "window_size", read),
    min_reps:    numLeaf(o, "min_reps",    d.min_reps,    "min_reps",    read),
    trend_delta: numLeaf(o, "trend_delta", d.trend_delta, "trend_delta", read),
    danger: {
      min_knew_reps: numLeaf(g, "min_knew_reps", d.danger.min_knew_reps, "danger.min_knew_reps", read),
      accuracy_low:  numLeaf(g, "accuracy_low",  d.danger.accuracy_low,  "danger.accuracy_low",  read),
      accuracy_mid:  numLeaf(g, "accuracy_mid",  d.danger.accuracy_mid,  "danger.accuracy_mid",  read),
    },
    _read: read,   // provenance, not a knob — published by compute() as `config`, read by limits.mjs
  };
}

// The published provenance block. Pure derivation off `_read`; `clean` is arithmetic over
// the lists (nothing thrown away, nothing misspelled, nothing unreadable), never a threshold.
function configRead(cfg) {
  const r = cfg && cfg._read;
  if (!r) return { source: "unknown (cfg was not built by normalizeConfig)", path: null, error: null, rejected: [], defaults_used: [], unknown: [], clean: null };
  return {
    source: r.source, path: r.path, error: r.error,
    rejected: r.rejected, defaults_used: r.defaults_used, unknown: r.unknown,
    clean: r.rejected.length === 0 && r.unknown.length === 0 && !r.error,
  };
}

function loadConfig(path = CFG_PATH) {
  // The `catch` used to be bare — an unparseable config file (one trailing comma) became
  // DEFAULTS with the reason discarded on the floor. The error now RIDES OUT in the block.
  if (!existsSync(path)) return normalizeConfig(null, { source: "defaults:absent", path });
  try {
    return normalizeConfig(JSON.parse(readFileSync(path, "utf8")), { source: "file", path });
  } catch (e) {
    // missing/malformed ⇒ defaults, via the same normaliser (fresh nested objects, never DEFAULTS' refs)
    return normalizeConfig(null, { source: "defaults:unreadable", path, error: String((e && e.message) || e).slice(0, 200) });
  }
}

// WIRING AUDIT, 11 Aug 2026 — THE SILENT REGISTRY.
// This swallowed a missing/malformed concepts.json with a bare `catch` and handed back
// empty maps, so topicOf() fell back to the raw string and NOTHING in calibration.json
// said the alias table was gone. PROVEN before the repair, on his live-shaped fixture:
// compute(reps, cfg, loadRegistry("__no_such_concepts__")) returned a danger_zone
// byte-identical to the healthy run, and /registr/i matched nowhere in the whole output.
// The silence INVERTS this organ's own bias. With the registry down every spelling of a
// topic is its own namespace, so one topic's knew-reps split across ids, each fragment
// falls under danger.min_knew_reps at gate (a), and the danger zone under-fires — the
// "bias to SILENCE" of :24 turned into a FALSE ALL-CLEAR, the one direction the honesty
// auditor was never allowed to fail in. The same split also drags down knewPerTopic()'s
// best-single-topic counter, so the gate row that was taught to stop lying this morning
// starts lying again the moment canon is unreadable.
// Every sibling reading this same registry already announces when it is down:
// capture.mjs:117 (loaded + error, and a captain's card at :966), nemesis.mjs:114
// (loaded gates axis attribution), examiner.mjs:259 (same class, fixed this morning).
// `loaded` + `error` are capture.mjs's field names ON PURPOSE — one vocabulary for one
// fault, so a cross-organ grep finds all of them at once.
// NO SECOND CARD IS FILED. capture.mjs already asks him about a dead concepts.json on a
// rolling day-key (`capture:registry:<day>`, :967) and runs daily on ArsenalFC-CapturePull;
// a second organ asking the same question would spend an anchor twice. THE ANCHOR LAW's
// other half is the point here — this organ's job is the MACHINE face: publish the fault
// where its own consumers read (calibration.json → limits.mjs's gate ledger).
function loadRegistry(path = CONCEPTS_PATH) {
  const reg = { conceptAlias: new Map(), skillAlias: new Map(), loaded: false, error: null };
  try {
    if (!existsSync(path)) { reg.error = `concepts.json not found at ${path}`; return reg; }
    const j = JSON.parse(readFileSync(path, "utf8"));
    for (const [id, def] of Object.entries(j.concepts || {})) {
      reg.conceptAlias.set(normText(id), id);
      for (const a of (def?.aliases || [])) reg.conceptAlias.set(normText(a), id);
    }
    for (const [id, def] of Object.entries(j.skills || {})) {
      reg.skillAlias.set(normText(id), id);
      for (const a of (def?.aliases || [])) reg.skillAlias.set(normText(a), id);
    }
    reg.loaded = true;
  } catch (e) {
    // malformed registry → still empty-safe (topic falls back to the raw id, exactly as
    // before), but the run now SAYS why. Same clipping as capture.mjs:136 so the message
    // survives captains_call's 140-char clip if it is ever quoted onto a card.
    reg.error = `concepts.json unreadable: ${String((e && e.message) || e).split("\n")[0].slice(0, 160)}`;
  }
  return reg;
}
const EMPTY_REG = { conceptAlias: new Map(), skillAlias: new Map(), loaded: false, error: null };

// canonical topic id for a rep (via concepts.json; raw normalized id if unknown/missing)
function topicOf(r, reg) {
  const key = normText(r.concept);
  const map = r.track === "skill" ? reg.skillAlias : reg.conceptAlias;
  return map.has(key) ? map.get(key) : key;
}

function validRep(r) {
  return r && typeof r === "object"
    && typeof r.ts === "string" && !Number.isNaN(Date.parse(r.ts))
    && CONF.has(r.confidence)
    && typeof r.correct === "boolean"
    && typeof r.concept === "string" && r.concept.trim() !== ""
    && TRACKS.has(r.track);
}

// WHY a line was dropped, in field names — never the rep's text. validRep above is the
// GATE and stays untouched (it is what every number in this file is computed over); this
// only NAMES the first failing clause, in the same order, so a drop can be diagnosed
// without hand-reading a gitignored ledger. The two are asserted to agree fixture-for-
// fixture below — a reason that disagreed with the gate would be worse than no reason.
// The vocabulary is capture.mjs's (`skipped_reasons`, :381) on purpose: one wording for
// one fault, so a cross-organ grep finds both ends of the wire at once.
function whyInvalid(r) {
  if (!r || typeof r !== "object" || Array.isArray(r)) return "not an object";
  if (typeof r.ts !== "string" || Number.isNaN(Date.parse(r.ts))) return "ts missing/unparseable";
  if (!CONF.has(r.confidence)) return "confidence not knew|shaky|guessed";
  if (typeof r.correct !== "boolean") return "correct not boolean";
  if (typeof r.concept !== "string" || r.concept.trim() === "") return "concept missing/empty";
  if (!TRACKS.has(r.track)) return "track not concept|skill";
  return null;
}

// WIRING AUDIT, 11 Aug 2026 — THE SWALLOWED LINE.
// This loader dropped every unparseable line and every line failing validRep() behind a
// bare `catch { /* skip */ }` with NO count, no reason and no field anywhere in the output
// — and total_reps, `N/20 reps`, the ECE, the trend windows and both danger gates are all
// computed over the SURVIVORS. So on the day capture writes one rep this validator rejects
// (a non-boolean `correct`, a missing `track`), his only reading is a counter that moved
// for a reason nothing on any surface states: the rep gate slides shut, or stays shut, and
// the organ built to catch quiet lies tells one. Measured before the repair on his live
// ledger: 21 lines, 21 valid, 0 dropped — the swallow is real, its victims are not here yet,
// which is exactly when to close it.
// THE CONTRAST IS THIS FILE'S OWN PRODUCER. capture.mjs's loader takes a `stats` out-param
// (:381) for precisely this reason — "a dropped line used to be invisible at every call
// site" — and parks the raw text in a quarantine sidecar it OWNS. This organ counts and
// names, and copies NOTHING: reps_log is gitignored derived study data, capture.mjs is the
// only writer of the quarantine, and a read-only consumer that starts duplicating rep text
// is a second store nobody agreed to.
// NO SECOND CARD IS FILED, for the registry repair's reason directly above: capture.mjs
// already asks him about unreadable rep lines on a rolling day-key (`reps:quarantine:<day>`,
// :941). This organ's job is the MACHINE face — publish the fault where its own consumers
// read (calibration.json → limits.mjs's ledger, which already prints `have` off the raw
// reps_log line count and had no way to know the two numbers disagree).
// `stats` is an out-param, exactly as capture.mjs's is: every existing caller passes
// nothing and gets the identical array back, byte for byte.
function loadReps(path, stats = {}) {
  stats.lines_seen = 0; stats.reps_used = 0; stats.dropped = 0; stats.dropped_reasons = [];
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const s = line.trim(); if (!s) continue;
    stats.lines_seen++;
    let o;
    try { o = JSON.parse(s); }
    catch { stats.dropped++; stats.dropped_reasons.push("unparseable JSON line"); continue; }
    if (validRep(o)) { out.push(o); stats.reps_used++; continue; }
    stats.dropped++; stats.dropped_reasons.push(whyInvalid(o) || "rejected by validRep");
  }
  // BLOCK 4 (17 Aug 2026) — a corrected verdict must stop counting here too, and the
  // stakes are highest on this organ: the calibration gap is confidence-vs-accuracy,
  // so a verdict left standing after it was walked back mis-states how well he knows
  // himself. reps_log stays append-only; the wrong row keeps its timestamp on disk.
  // capture.mjs is the SOLE WRITER of that log, so supersession is its definition,
  // imported rather than re-implemented in each of the four private readers.
  // `stats` is untouched on purpose: it counts every LINE READ, so the published
  // corpus figure still reports the whole file and this filter hides nothing.
  return supersedeReps(out);
}

// The published read of that loss — counts and reasons only, the same shape as the config
// block above. ABSENT IS NOT ZERO: a compute() called without the loader's stats (a test, a
// future importer holding its own reps) publishes null, never a confident `dropped: 0`.
// `clean` is arithmetic over the count, not a threshold; NOT ONE NUMBER IS INVENTED here.
function corpusBlock(stats) {
  if (!stats || !Number.isFinite(stats.lines_seen)) return null;
  const reasons = {};
  for (const r of (stats.dropped_reasons || [])) reasons[r] = (reasons[r] || 0) + 1;
  return {
    lines_seen: stats.lines_seen,
    reps_used: stats.reps_used,
    dropped: stats.dropped,
    reasons,                                                    // {reason: count} — no rep text ever
    line: `${stats.reps_used}/${stats.lines_seen} ledger lines read`,
    clean: stats.dropped === 0,
    source: "reps_log.jsonl (capture.mjs is its only writer; this organ never writes it)",
  };
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// core math
// ---------------------------------------------------------------------------
// ECE over a rep set (null if empty). Empty buckets are skipped (no div-by-zero).
function ece(reps, targets) {
  const N = reps.length;
  if (!N) return null;
  let sum = 0;
  for (const b of ["knew", "shaky", "guessed"]) {
    const br = reps.filter((r) => r.confidence === b);
    if (!br.length) continue;
    const acc = br.filter((r) => r.correct).length / br.length;
    sum += (br.length / N) * Math.abs(acc - targets[b]);
  }
  return sum;
}

function bucketsObj(reps) {
  const out = {};
  for (const b of ["knew", "shaky", "guessed"]) {
    const br = reps.filter((r) => r.confidence === b);
    out[b] = { n: br.length, accuracy: br.length ? round(br.filter((r) => r.correct).length / br.length) : null };
  }
  return out;
}

// per-topic knew-wrong danger zone (only meaningful at status "ok")
function computeDanger(reps, cfg, reg) {
  // group by TRACK + topic.
  // E2E audit 25 Jul 2026 (1bcef5ff): this keyed on the canonical topic NAME alone — the same
  // namespace collapse nemesis had (540b2b43). concepts.json keeps concepts{} and skills{} as
  // SEPARATE maps, and an unregistered rep falls back to its raw normalized string, so skill
  // "async" (Colab) and a concept-track "async" (Gem) pooled into ONE knew-accuracy against the
  // danger gates. Fluent skill reps could then be dragged under accuracy_mid by concept misses
  // (indicting Python the captain is solid on) or, worse, mask a real concept blind spot by
  // averaging it away. The entry also carried no track, so the Manager could not tell which
  // domain was in danger. Separate namespaces ⇒ separate verdicts, each stamped with its track.
  const byTopic = new Map();
  for (const r of reps) {
    const topic = topicOf(r, reg);
    const key = `${r.track}\u0000${topic}`;   // NUL join: no normalized topic can contain it
    if (!byTopic.has(key)) byTopic.set(key, { reps: [], track: r.track, topic });
    byTopic.get(key).reps.push(r);
  }
  const scored = [];
  for (const { reps: trs, track, topic } of byTopic.values()) {
    const knew = trs.filter((r) => r.confidence === "knew");
    if (knew.length < cfg.danger.min_knew_reps) continue;                 // gate (a)
    const acc = knew.filter((r) => r.correct).length / knew.length;
    if (acc >= cfg.danger.accuracy_mid) continue;                         // gate (b): only confident-wrong
    const entry = {
      topic, track, confidence: "high",
      accuracy: acc < cfg.danger.accuracy_low ? "low" : "mid",
    };
    // axis-sharpen (concept-track only): plurality axis among knew-wrong reps, ≥2
    const wrongs = knew.filter((r) => !r.correct && r.track === "concept" && r.axis);
    const counts = {};
    for (const r of wrongs) counts[r.axis] = (counts[r.axis] || 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length && sorted[0][1] >= 2 && (sorted.length === 1 || sorted[0][1] > sorted[1][1])) {
      entry.axis = sorted[0][0];
    }
    entry.note = "confident-wrong = the dangerous illusion → tighter interval";
    scored.push({ entry, acc });
  }
  scored.sort((a, b) => a.acc - b.acc);   // worst (lowest knew-accuracy) first
  return scored.map((s) => s.entry);
}

// knew-reps grouped exactly the way gate (a) above applies them — per TRACK+topic,
// same NUL join, same canonicalisation — sorted best-first. Derived from computeDanger's
// own grouping so the published counter and the gate can never drift apart again.
function knewPerTopic(reps, reg) {
  const m = new Map();
  for (const r of reps) {
    if (r.confidence !== "knew") continue;
    const topic = topicOf(r, reg);
    const key = `${r.track} ${topic}`;
    if (!m.has(key)) m.set(key, { track: r.track, topic, knew: 0 });
    m.get(key).knew++;
  }
  return [...m.values()].sort((a, b) => b.knew - a.knew);
}

function computeTrend(reps, cfg) {
  const N = reps.length;
  const W = cfg.window_size;
  // ORGANISM AUDIT #99/#106 — the denominator was missing. "establishing baseline
  // (9 reps)" told him where he stood and never how far that was from speaking; the
  // trend needs TWO full windows, and nothing on any surface said so. Same sentence,
  // with its n over its need.
  if (N < 2 * W) return `establishing baseline (${N}/${2 * W} reps)`;
  const ordered = reps.slice().sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  const current = ordered.slice(N - W);
  const prior   = ordered.slice(N - 2 * W, N - W);
  const ce = ece(current, cfg.targets), pe = ece(prior, cfg.targets);
  const delta = pe - ce;                  // + = gap shrinking = improving
  const f = (x) => x.toFixed(2);
  if (delta > cfg.trend_delta)  return `narrowing (${f(pe)} → ${f(ce)})`;
  if (delta < -cfg.trend_delta) return `widening (${f(pe)} → ${f(ce)})`;
  return `holding steady (~${f(ce)})`;
}

// ---------------------------------------------------------------------------
// THE UNGATE (organism audit #99 + #106, 4 Aug 2026)
// ---------------------------------------------------------------------------
// His verbatim ask: "i can not wait for so many days for gates to be opened."
// The answer is NOT to lower a gate — nine reps cannot produce a trustworthy ECE
// and manufacturing one from thin data is the exact lying failure this whole audit
// exists to hunt. The answer is that a REFUSAL becomes a MEASUREMENT with its
// denominator shown: `warming_up` is a word he can only take on faith, `9/20 reps`
// is a fact he can act on and watch move. Every suppressed field is NAMED, so the
// silence says what it is withholding instead of just being quiet.
//
// `status` / `low_confidence` are UNCHANGED and stay the machine contract —
// manager.mjs:165 gates on `status === "ok"`, and re-spelling that enum would break
// the gate rather than open it. The counter rides beside them, additive.
//
// WIRING AUDIT, 11 Aug 2026 — THE COLLAPSED SUB-GATE (`danger.min_knew_reps`).
// This published `have` = the GLOBAL knew count while computeDanger:209 applies that
// same `need` PER track+topic. On 10 Aug the live file said {have:3, need:3, line:
// "3/3 knew-reps", open:true} off a ledger whose real per-topic knew counts were
// {concept:embeddings 1, concept:hallucinations 2} — NOT ONE topic could be judged.
// limits.mjs (its only consumer, wired the day before) faithfully reprinted
// `calibration danger.min_knew_reps 3 3 OPEN`, so his gate ledger said the honesty
// auditor had looked and found nothing, when the gate it must look through had never
// opened. An empty danger_zone then reads as ACQUITTAL instead of SILENCE — the exact
// inversion this organ exists to prevent.
// The honest `have` is the BEST SINGLE TOPIC, for the same reason limits.mjs:145 reads
// physio's twin gate as the best single claim-type — "the gate opens on ONE type, not
// the sum". Nothing is invented: the number is knewPerTopic()[0], grouped by the very
// key computeDanger groups by. The global total is NOT lost, it is demoted to
// `total_knew_reps` beside its scope, so the collapse can never be silent again.
function buildGate(N, cfg, knewCount, perTopicKnew = [], reg = null) {
  const open = N >= cfg.min_reps;
  const trendNeed = 2 * cfg.window_size;
  const knewNeed = cfg.danger.min_knew_reps;
  const best = perTopicKnew.length ? perTopicKnew[0] : null;
  const bestKnew = best ? best.knew : 0;
  const knewOpen = bestKnew >= knewNeed;
  return {
    have: N, need: cfg.min_reps, unit: "reps",
    line: `${N}/${cfg.min_reps} reps`,
    open,
    // danger_zone is withheld by EITHER gate. Before today only the rep gate was
    // named here, so at N≥min_reps with no judgeable topic the list went empty and
    // `danger_zone: []` looked like a verdict. A silence must always say its name.
    withheld: (open && knewOpen) ? [] : ["danger_zone"],
    // every other number in this organ that can refuse, with its own n over its need
    sub: [
      { name: "danger_zone", have: N, need: cfg.min_reps, unit: "reps", line: `${N}/${cfg.min_reps} reps`, open },
      { name: "trend", have: N, need: trendNeed, unit: "reps", line: `${N}/${trendNeed} reps`, open: N >= trendNeed },
      {
        name: "danger.min_knew_reps",
        have: bestKnew, need: knewNeed, unit: "knew-reps",
        line: `${bestKnew}/${knewNeed} knew-reps on the best single topic`,
        open: knewOpen,
        scope: "per track+topic (computeDanger gate (a)) — NOT a global count",
        best_topic: best ? `${best.track}:${best.topic}` : null,
        topics_at_need: perTopicKnew.filter((t) => t.knew >= knewNeed).length,
        topics_with_knew: perTopicKnew.length,
        total_knew_reps: knewCount,
      },
      // WIRING AUDIT, 11 Aug 2026 — THE LOUDEST NUMBER, SHIPPED WITHOUT ITS n.
      // `overconfidence_rate` is computed in compute() at ANY knew-count ≥ 1 and had
      // NO row here, so the one scalar in this organ that names a BLIND SPOT was the
      // only one with no denominator. brain.mjs's cognitive fingerprint — which
      // conditions EVERY LLM call this organism makes — then rendered the bare number:
      // on 10 Aug it told every Gaffer call `overconfidence P(wrong|knew)=0` off THREE
      // knew-reps, a perfect-honesty verdict, printed right beside a trend that DID
      // carry its n ("21/40 reps"). Same disease as #99, in the organ built to cure it.
      // NOTHING IS SUPPRESSED. The rate publishes exactly as before, and this row is
      // deliberately NOT added to `withheld` — the `trend` precedent: a field that stays
      // readable while its gate is shut is not withheld, it is provisional, and the n
      // is what says so. Suppressing the scalar would break brain.mjs's typeof-number
      // read and manager.mjs's §4 contract to fix a reporting fault.
      // NO NEW THRESHOLD WAS INVENTED. `need` is cfg.danger.min_knew_reps — the only
      // number in this file that already states how many knew-reps make a KNEW-conditioned
      // judgement readable, the same need computeDanger applies at gate (a). The scope
      // differs on purpose: the rate is GLOBAL (compute() divides over every knew rep in
      // the ledger, both tracks), so `have` here is the total, while the row above it is
      // the best single topic. Retune that one knob and both rows move together.
      {
        name: "overconfidence_rate",
        have: knewCount, need: knewNeed, unit: "knew-reps",
        line: `${knewCount}/${knewNeed} knew-reps`,
        open: knewCount >= knewNeed,
        scope: "global (P(wrong|knew) is computed over ALL knew reps, both tracks) — NOT per topic",
        need_source: "danger.min_knew_reps (shared knob; no threshold was invented for this row)",
      },
      // WIRING AUDIT, 11 Aug 2026 — THE INPUT THAT COULD VANISH WITHOUT A WORD.
      // Both per-topic reads above (computeDanger's gate (a) and knewPerTopic's best
      // single topic) are only as trustworthy as the alias table that canonicalises
      // their keys, and until today a dead concepts.json produced numbers identical to
      // a healthy one. See the loadRegistry header for the proof and the inversion.
      // NOT ADDED TO `withheld` — the overconfidence precedent directly above: a field
      // that stays readable while its gate is shut is PROVISIONAL, not suppressed. A
      // down registry does not make the entries that DID fire false (raw ids still
      // group); it makes the list INCOMPLETE. Deleting true indictments to punish a
      // missing alias table is a trade only the captain may make.
      // NO THRESHOLD WAS INVENTED. `need` is 1 because concepts.json either parsed or
      // it did not — arithmetic, not a typed knob, the same reason fsrs.mjs's gate need
      // is 1 and limits.mjs:307 tags that row `derived` rather than `guessed`.
      {
        name: "registry",
        have: (reg && reg.loaded) ? 1 : 0, need: 1, unit: "registry",
        line: (reg && reg.loaded) ? "1/1 concepts.json read" : "0/1 concepts.json NOT read",
        open: !!(reg && reg.loaded),
        scope: "alias collapse for BOTH per-topic reads — a registry that did not load splits one topic into one namespace per spelling, so gate (a) under-fires and the danger zone under-reads",
        error: (reg && reg.error) || null,
        need_source: "not a threshold — the file parsed or it did not (derived, like fsrs.mjs's need of 1)",
      },
    ],
  };
}

// `corpusStats` is loadReps' out-param, handed straight through — the denominator every
// number below is really computed over. Optional and defaulted for the same reason the
// out-param is: every existing caller is byte-identical without it (it publishes null).
function compute(reps, cfg, reg, now, corpusStats = null) {
  const N = reps.length;
  const gap = ece(reps, cfg.targets);
  const knew = reps.filter((r) => r.confidence === "knew");
  const overconfidence_rate = knew.length ? round(knew.filter((r) => !r.correct).length / knew.length) : null;
  const trend = computeTrend(reps, cfg);
  let status, low_confidence, danger_zone;
  if (N === 0) { status = "awaiting_data"; low_confidence = true; danger_zone = []; }
  else if (N < cfg.min_reps) { status = "warming_up"; low_confidence = true; danger_zone = []; }
  else { status = "ok"; low_confidence = false; danger_zone = computeDanger(reps, cfg, reg); }
  return {
    date: localDate(now),
    calibration_gap: round(gap),
    trend,
    overconfidence_rate,
    buckets: bucketsObj(reps),
    danger_zone,
    total_reps: N,
    status, low_confidence,
    // WAS THE ALIAS TABLE EVEN THERE (11 Aug 2026 wiring audit — see loadRegistry).
    // Flat, and named exactly as capture.mjs:540 names them, so one field name answers
    // "was canon readable on this run" across every organ that touches concepts.json.
    // An `ok` status with a false here is a NARROWER claim than it looks.
    registry_loaded: !!(reg && reg.loaded),
    registry_error: (reg && reg.error) || null,
    gate: buildGate(N, cfg, knew.length, knewPerTopic(reps, reg), reg),   // #99/#106 counter; per-topic since 11 Aug 2026; registry row since the wiring audit
    // WHICH OF THESE NUMBERS ARE ACTUALLY HIS (11 Aug 2026 wiring audit). Every `need`
    // printed above is only as true as the config read that produced it, and until today
    // a discarded edit was indistinguishable from an honoured one. limits.mjs — the ledger
    // whose whole job is "a threshold is either EARNED or exposed as a guess" — reads this.
    config: configRead(cfg),
    // ...and WHICH LINES those numbers were computed over (11 Aug 2026 wiring audit, the
    // swallow closed at loadReps above). `total_reps` is the survivors; this is how many
    // lines the ledger actually held, and why the two ever differ.
    corpus: corpusBlock(corpusStats),
    generated_at: new Date(now).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// selftest — baked mocks (no real state touched)
// ---------------------------------------------------------------------------
function selftest() {
  const cfg = loadConfig("__no_such_config__");   // ⇒ DEFAULTS (also tests config-missing)
  const reg = EMPTY_REG;                           // ⇒ topic = raw id (also tests registry-missing)
  const now = new Date(2026, 7, 1, 12, 0, 0);
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  let T = 0;
  const ts = () => new Date(Date.parse("2026-07-01T00:00:00Z") + (T++) * 60000).toISOString();
  const mk = (concept, confidence, correct, o = {}) => ({
    ts: ts(), surface: o.track === "skill" ? "colab" : "gem", track: o.track || "concept",
    concept, axis: ("axis" in o) ? o.axis : (o.track === "skill" ? null : "a"),
    question: `q${T}`, confidence, correct,
  });
  const rep = (n, concept, confidence, correct, o) => Array.from({ length: n }, () => mk(concept, confidence, correct, o));
  const find = (dz, t) => dz.find((e) => e.topic === t);

  // 1) empty-safe
  const e0 = compute([], cfg, reg, now);
  assert("empty-safe: awaiting_data, gap null, danger []", e0.status === "awaiting_data" && e0.calibration_gap === null && e0.danger_zone.length === 0);

  // 2) warming_up: 10 reps incl a qualifying danger topic ⇒ danger SUPPRESSED
  const warm = [...rep(3, "chunking", "knew", false), ...rep(7, "filler", "shaky", true)];
  const w = compute(warm, cfg, reg, now);
  assert("warming_up: <20 reps ⇒ low_confidence + danger [] (suppressed)", w.status === "warming_up" && w.low_confidence === true && w.danger_zone.length === 0);

  // 3) ECE math: knew 4(3✓) shaky 2(1✓) guessed 2(0✓) ⇒ hand ECE = 0.2125
  const m3 = [...rep(3, "c", "knew", true), ...rep(1, "c", "knew", false), ...rep(1, "c", "shaky", true), ...rep(1, "c", "shaky", false), ...rep(2, "c", "guessed", false)];
  assert("ECE math matches hand-computed (0.2125)", Math.abs(ece(m3, cfg.targets) - 0.2125) < 1e-9);

  // 4) overconfidence_rate = P(wrong|knew); empty knew ⇒ null
  assert("overconfidence_rate correct (0.25) ", Math.abs(compute(m3, cfg, reg, now).overconfidence_rate - 0.25) < 1e-9);
  assert("overconfidence_rate null when no knew reps", compute([...rep(3, "c", "shaky", true)], cfg, reg, now).overconfidence_rate === null);

  // 5) buckets: n/accuracy correct; empty bucket ⇒ n:0, accuracy:null
  const b5 = compute([...rep(4, "c", "knew", true), ...rep(2, "c", "guessed", false)], cfg, reg, now).buckets;
  assert("buckets n/accuracy correct + empty bucket null", b5.knew.n === 4 && b5.knew.accuracy === 1 && b5.guessed.accuracy === 0 && b5.shaky.n === 0 && b5.shaky.accuracy === null);

  // 6-9) danger (needs status ok, N≥20). One rich mock:
  // NB: topics are normalized to lowercase by topicOf — keep mock concept ids lowercase.
  const ok = [
    ...rep(8, "filler", "shaky", true),                                   // reach N≥20, no knew
    ...rep(1, "chunking", "knew", false, { axis: "a" }), ...rep(1, "chunking", "knew", false, { axis: "b" }), ...rep(1, "chunking", "knew", true, { axis: "c" }), // 0.33 low, mixed wrong-axes ⇒ no axis
    ...rep(3, "midtopic", "knew", true), ...rep(2, "midtopic", "knew", false),  // 3/5=0.60 ⇒ mid
    ...rep(2, "twoknew", "knew", false),                                  // <3 knew ⇒ NOT danger
    ...rep(3, "shakytopic", "shaky", false),                             // no knew ⇒ NOT danger
    ...rep(2, "axisf", "knew", false, { axis: "f" }), ...rep(1, "axisf", "knew", true, { axis: "a" }), // 0.33, 2 wrong axis f ⇒ axis f
    ...rep(1, "axismix", "knew", false, { axis: "f" }), ...rep(1, "axismix", "knew", false, { axis: "c" }), ...rep(1, "axismix", "knew", true, { axis: "a" }), // mixed ⇒ no axis
    ...rep(2, "pydantic", "knew", false, { track: "skill" }), ...rep(1, "pydantic", "knew", true, { track: "skill" }), // skill 0.33 ⇒ danger no axis
  ];
  const oc = compute(ok, cfg, reg, now);
  const dz = oc.danger_zone;
  assert("status ok at N≥min_reps", oc.status === "ok" && oc.low_confidence === false);
  assert("danger fires: chunking low (no axis)", find(dz, "chunking")?.accuracy === "low" && find(dz, "chunking")?.confidence === "high" && !("axis" in find(dz, "chunking")));
  assert("danger label mid: midtopic (0.60)", find(dz, "midtopic")?.accuracy === "mid");
  assert("gate: 2-knew topic NOT in danger", !find(dz, "twoknew"));
  assert("gate: shaky-wrong topic NOT in danger", !find(dz, "shakytopic"));
  assert("axis-sharpen: shared axis ⇒ axis f", find(dz, "axisf")?.axis === "f");
  assert("axis-sharpen: mixed axes ⇒ no axis", find(dz, "axismix") && !("axis" in find(dz, "axismix")));
  assert("domain-general: skill (Python) topic CAN enter danger, no axis", find(dz, "pydantic") && !("axis" in find(dz, "pydantic")));

  // 10-12) trend
  const narrow = [...rep(20, "g", "guessed", true), ...rep(6, "g", "guessed", true), ...rep(14, "g", "guessed", false)]; // prior ECE 0.70 → current ~0.00
  assert("trend narrowing (2 full windows, gap shrinks)", compute(narrow, cfg, reg, now).trend.startsWith("narrowing"));
  const steady = rep(40, "g", "guessed", true);                          // both windows ECE 0.70 ⇒ delta 0
  assert("trend holding steady (delta < trend_delta)", compute(steady, cfg, reg, now).trend.startsWith("holding steady"));
  assert("trend establishing baseline (<40 reps)", compute(rep(30, "g", "shaky", true), cfg, reg, now).trend.includes("establishing baseline"));

  // 13) config missing ⇒ defaults used
  assert("config missing ⇒ defaults", loadConfig("__nope__").targets.knew === 0.95 && loadConfig("__nope__").min_reps === 20);

  // 14) concepts.json missing ⇒ topic = raw id
  const raw = [...rep(2, "Brand New Topic", "knew", false), ...rep(1, "Brand New Topic", "knew", false), ...rep(20, "filler", "shaky", true)];
  assert("concepts.json missing ⇒ topic = raw normalized id", !!find(compute(raw, cfg, EMPTY_REG, now).danger_zone, "brand new topic"));

  // --- E2E audit 25 Jul 2026 regressions -------------------------------------
  // 15) the NESTED config leaves are numeric-guarded too (4b9d982e). Under the old raw spread a
  //     hand-typo walked in whole: targets.knew "0.95%" ⇒ ece() NaN ⇒ calibration_gap serialises
  //     as null and the trend prints "holding steady (~NaN)" while status still reads "ok"; and
  //     danger.accuracy_mid "0..67" ⇒ `acc >= NaN` is always false ⇒ gate (b) is dead and a
  //     3-knew PERFECT topic gets stamped "confident-wrong = the dangerous illusion".
  const badCfg = normalizeConfig({ targets: { knew: "0.95%", guessed: null }, danger: { accuracy_mid: "0..67", min_knew_reps: [] } });
  assert("bad config leaves ⇒ DEFAULTS (string/null/array all rejected)",
    badCfg.targets.knew === 0.95 && badCfg.targets.guessed === 0.30
    && badCfg.danger.accuracy_mid === 0.67 && badCfg.danger.min_knew_reps === 3);
  const badRun = compute([...rep(40, "filler", "shaky", true), ...rep(3, "solid", "knew", true)], badCfg, EMPTY_REG, now);
  assert("bad config: gap + trend stay finite AND a 3/3-correct topic is NOT indicted",
    Number.isFinite(badRun.calibration_gap) && !badRun.trend.includes("NaN") && badRun.danger_zone.length === 0);

  // 16) tracks are SEPARATE namespaces (1bcef5ff). Skill "async" is fluent (3/3 knew-correct);
  //     concept-track "async" has 2 knew-wrong, below gate (a). Merged on the topic name alone
  //     they became one 5-knew pool at 0.60 < accuracy_mid, so the danger zone indicted "async"
  //     — the Python skill the captain is actually solid on.
  const m16 = [...rep(3, "async", "knew", true, { track: "skill" }), ...rep(2, "async", "knew", false), ...rep(20, "filler", "shaky", true)];
  assert("track-split: a fluent skill is not dragged into danger by a same-named concept",
    !find(compute(m16, cfg, EMPTY_REG, now).danger_zone, "async"));

  // 16b) and when BOTH tracks are genuinely in danger they are TWO entries, each stamped with its
  //      track — the old merged entry carried none, so the Manager could not tell which domain.
  const m16b = [
    ...rep(3, "parsers", "knew", false, { track: "skill" }),
    ...rep(1, "parsers", "knew", true), ...rep(3, "parsers", "knew", false),
    ...rep(20, "filler", "shaky", true),
  ];
  const p16b = compute(m16b, cfg, EMPTY_REG, now).danger_zone.filter((e) => e.topic === "parsers");
  assert("track-split: both tracks in danger ⇒ TWO entries, each carrying its own track",
    p16b.length === 2 && new Set(p16b.map((e) => e.track)).size === 2 && p16b.every((e) => TRACKS.has(e.track)));

  // --- ORGANISM AUDIT #99 / #106 (4 Aug 2026): THE UNGATE --------------------
  // A refusal must be a MEASUREMENT with its denominator shown. Not a lower gate —
  // the gate is unchanged; what changes is that the shut door has a number on it.
  {
    const nine = [...rep(2, "c", "knew", true), ...rep(2, "c", "shaky", true), ...rep(5, "c", "guessed", false)];  // the captain's live n today
    const u9 = compute(nine, cfg, reg, now);
    assert("#99 nine reps say '9/20 reps' with the denominator, beside (not instead of) the machine status",
      u9.gate.line === "9/20 reps" && u9.gate.have === 9 && u9.gate.need === 20 && u9.gate.open === false
      && u9.status === "warming_up" && u9.low_confidence === true);
    assert("#99 the silence NAMES what it is withholding (a quiet organ is indistinguishable from a broken one)",
      u9.gate.withheld.includes("danger_zone") && u9.danger_zone.length === 0);
    assert("#99 the trend shows its own need too — it wants TWO windows, and now says so",
      u9.trend === "establishing baseline (9/40 reps)" && u9.gate.sub.find((s) => s.name === "trend").need === 40);
    assert("#99 the knew-rep gate carries its OWN n, not the total (they refuse for different reasons)",
      u9.gate.sub.find((s) => s.name === "danger.min_knew_reps").have === 2
      && u9.gate.sub.find((s) => s.name === "danger.min_knew_reps").need === 3);

    // ZERO IS NOT A MEASUREMENT OF ZERO — it is "no data", and it still shows its need.
    const u0 = compute([], cfg, reg, now);
    assert("#99 an empty ledger reads 0/20 (never a silently-confident zero)",
      u0.gate.line === "0/20 reps" && u0.gate.open === false && u0.status === "awaiting_data");

    // ...and the counter OPENS on its own, from live data, never asserted.
    // FIXTURE CHANGED 11 Aug 2026: this was 20 shaky filler reps and NO knew reps at all,
    // which passed the rep gate while leaving danger_zone unreadable — the assertion
    // "stops withholding" was only true because withheld ignored the knew-gate. The
    // fixture now carries a topic that genuinely clears gate (a) (3 knew, all correct ⇒
    // no indictment), so "nothing withheld" means the danger read actually happened.
    const u20 = compute([...rep(17, "filler", "shaky", true), ...rep(3, "solid", "knew", true)], cfg, reg, now);
    assert("#99 the gate opens from the data itself and stops withholding",
      u20.gate.line === "20/20 reps" && u20.gate.open === true && u20.gate.withheld.length === 0 && u20.status === "ok");

    // THE GATE IS NOT LOWERED — the whole point. 19 reps still refuses.
    const u19 = compute([...rep(16, "filler", "shaky", true), ...rep(3, "chunking", "knew", false)], cfg, reg, now);
    assert("#99 NO GATE WAS LOWERED — a qualifying danger topic at 19 reps is still suppressed, it just says 19/20",
      u19.gate.line === "19/20 reps" && u19.gate.open === false && u19.danger_zone.length === 0);

    // the counter tracks the CONFIG, not a literal — a captain who edits min_reps
    // must see his own number, or the counter is decoration.
    const c30 = normalizeConfig({ min_reps: 30, window_size: 5 });
    const u30 = compute(nine, c30, reg, now);
    assert("#99 the counter reads the live config (min_reps 30 ⇒ 9/30), never a hardcoded 20",
      u30.gate.line === "9/30 reps" && u30.gate.sub.find((s) => s.name === "trend").need === 10);
  }

  // --- WIRING AUDIT (11 Aug 2026): THE COLLAPSED SUB-GATE --------------------
  // buildGate published the GLOBAL knew count against a need computeDanger applies
  // PER track+topic. The regression fixture is his own live 10 Aug ledger, reduced:
  // 3 knew reps spread over TWO topics, so the total reaches 3 and no topic does.
  {
    const spread = [
      ...rep(1, "embeddings", "knew", true), ...rep(2, "hallucinations", "knew", true),
      ...rep(18, "filler", "shaky", true),
    ];
    const s = compute(spread, cfg, reg, now);
    const kg = s.gate.sub.find((x) => x.name === "danger.min_knew_reps");
    assert("#wire the knew-gate counts the BEST SINGLE TOPIC, never the global total (his live 3 knew over 2 topics ⇒ 2/3 SHUT, not 3/3 OPEN)",
      kg.have === 2 && kg.need === 3 && kg.open === false
      && kg.total_knew_reps === 3 && kg.topics_at_need === 0 && kg.topics_with_knew === 2);
    assert("#wire an empty danger_zone under a shut knew-gate is NAMED as withheld — silence, never acquittal",
      s.status === "ok" && s.danger_zone.length === 0 && s.gate.withheld.includes("danger_zone"));

    // it opens on its own the moment ONE topic gets there, and says which one
    const reach = [...rep(3, "hallucinations", "knew", true), ...rep(18, "filler", "shaky", true)];
    const r2 = compute(reach, cfg, reg, now);
    const kg2 = r2.gate.sub.find((x) => x.name === "danger.min_knew_reps");
    assert("#wire one topic reaching the need opens it, names it, and clears the withholding",
      kg2.have === 3 && kg2.open === true && kg2.best_topic === "concept:hallucinations"
      && kg2.topics_at_need === 1 && r2.gate.withheld.length === 0);

    // and it groups by TRACK+topic, exactly as gate (a) does (1bcef5ff's namespace split)
    const split = [
      ...rep(2, "async", "knew", true, { track: "skill" }), ...rep(2, "async", "knew", true),
      ...rep(18, "filler", "shaky", true),
    ];
    const kg3 = compute(split, cfg, EMPTY_REG, now).gate.sub.find((x) => x.name === "danger.min_knew_reps");
    assert("#wire the count is per TRACK+topic: 2 skill 'async' + 2 concept 'async' is 2, not 4",
      kg3.have === 2 && kg3.total_knew_reps === 4 && kg3.topics_with_knew === 2 && kg3.open === false);

    // the counter follows the CONFIG's need, never a literal (same law as #99's min_reps check)
    const kg4 = compute(reach, normalizeConfig({ danger: { min_knew_reps: 5 } }), reg, now)
      .gate.sub.find((x) => x.name === "danger.min_knew_reps");
    assert("#wire the knew-gate reads the live config need (min_knew_reps 5 ⇒ 3/5 SHUT)",
      kg4.need === 5 && kg4.have === 3 && kg4.open === false && kg4.topics_at_need === 0);
  }

  // --- WIRING AUDIT (11 Aug 2026): THE RATE THAT SHIPPED WITHOUT ITS n -------
  // overconfidence_rate is computed at ANY knew-count ≥ 1 and had no row in the
  // counter, so brain.mjs's fingerprint told every LLM call "P(wrong|knew)=0" off
  // three knew-reps. The fixture is his live 10 Aug ledger, reduced: 21 reps, 3
  // knew, all correct ⇒ a rate of exactly 0 that means almost nothing.
  {
    const live = [...rep(1, "embeddings", "knew", true), ...rep(2, "hallucinations", "knew", true), ...rep(18, "filler", "shaky", true)];
    const l = compute(live, cfg, reg, now);
    const oc = l.gate.sub.find((x) => x.name === "overconfidence_rate");
    assert("#wire the loudest scalar now carries its denominator — a rate of 0 arrives as 3/3 knew-reps, never bare",
      l.overconfidence_rate === 0 && !!oc && oc.have === 3 && oc.need === 3 && oc.line === "3/3 knew-reps" && oc.unit === "knew-reps");
    assert("#wire the rate's n is GLOBAL, unlike the per-topic knew gate beside it (3 knew over 2 topics ⇒ 3 here, 2 there)",
      oc.have === 3 && l.gate.sub.find((x) => x.name === "danger.min_knew_reps").have === 2);

    // ONE knew rep still produces a rate — that is the whole defect. It must now
    // announce itself as 1/3, SHUT, so no reader can mistake it for a measurement.
    const one = [...rep(1, "c", "knew", false), ...rep(19, "filler", "shaky", true)];
    const o1 = compute(one, cfg, reg, now).gate.sub.find((x) => x.name === "overconfidence_rate");
    assert("#wire a single knew-rep yields a rate of 1 and the counter says 1/3 SHUT (the ungated scalar is now visibly provisional)",
      compute(one, cfg, reg, now).overconfidence_rate === 1 && o1.have === 1 && o1.open === false);

    // NOT withheld — the trend precedent. The rate stays published; only its
    // reliability is now legible. Suppressing it would break the machine contract.
    assert("#wire the rate is NOT suppressed when its gate is shut (trend precedent: readable + provisional, never withheld)",
      !compute(one, cfg, reg, now).gate.withheld.includes("overconfidence_rate")
      && typeof compute(one, cfg, reg, now).overconfidence_rate === "number");

    // no knew reps ⇒ null rate, and the row reads 0/3 rather than vanishing
    const o0 = compute([...rep(20, "c", "shaky", true)], cfg, reg, now);
    assert("#wire zero knew-reps ⇒ rate null AND the row still shows 0/3 (absent is not zero)",
      o0.overconfidence_rate === null && o0.gate.sub.find((x) => x.name === "overconfidence_rate").line === "0/3 knew-reps");

    // and the need follows the CONFIG it borrowed, never a literal typed here
    const o5 = compute(live, normalizeConfig({ danger: { min_knew_reps: 5 } }), reg, now)
      .gate.sub.find((x) => x.name === "overconfidence_rate");
    assert("#wire the rate's need is the live danger.min_knew_reps knob (5 ⇒ 3/5 SHUT), not a threshold invented for this row",
      o5.need === 5 && o5.have === 3 && o5.open === false);
  }

  // --- WIRING AUDIT (11 Aug 2026): THE SILENT CLAMP -------------------------
  // THE DEFECT: normalizeConfig clamped every bad leaf to DEFAULTS and published
  // NOTHING about it, and loadConfig's bare catch swallowed a whole unparseable
  // file. The captain is invited BY THE CONFIG'S OWN _comment to retune it; the
  // day he types "12" instead of 12, this organ gates at 20 forever and limits.mjs
  // faithfully reprints 20 as his number. These assertions are the net: the
  // journal, the LAYERING proof that no arithmetic moved, then THE WIRE.
  {
    // 1) HIS EDIT, THROWN AWAY, NAMED — with the value exactly as he typed it.
    const typo = normalizeConfig({ min_reps: "12" });
    const rj = typo._read.rejected.find((x) => x.key === "min_reps");
    assert("#clamp a string min_reps is still clamped to 20 AND the discard is published, quoting his own edit back",
      typo.min_reps === 20 && !!rj && rj.got === '"12"' && rj.using === 20 && typo._read.defaults_used.includes("min_reps"));

    // 2) LAYERING PROOF — the arithmetic did not move. Same fixture as regression
    //    15 above, same four expected numbers, now also carrying its journal.
    const badCfg2 = normalizeConfig({ targets: { knew: "0.95%", guessed: null }, danger: { accuracy_mid: "0..67", min_knew_reps: [] } });
    assert("#clamp the numbers are BYTE-IDENTICAL to the pre-journal normaliser (nothing was replaced, only observed)",
      badCfg2.targets.knew === 0.95 && badCfg2.targets.guessed === 0.30
      && badCfg2.danger.accuracy_mid === 0.67 && badCfg2.danger.min_knew_reps === 3
      && badCfg2.targets.shaky === 0.65 && badCfg2.window_size === 20 && badCfg2.min_reps === 20 && badCfg2.trend_delta === 0.02
      && badCfg2._read.rejected.length === 4);

    // 3) A DEFAULT IS NOT A DISCARD. An absent key falls back silently (fresh install);
    //    a key typed to its own default value must not be cried wolf over either.
    const absent = normalizeConfig({});
    const same   = normalizeConfig({ min_reps: 20 });
    assert("#clamp an ABSENT key is defaults_used but never 'rejected', and a key typed to its own default is silent",
      absent._read.rejected.length === 0 && absent._read.defaults_used.length === 9
      && same._read.rejected.length === 0 && !same._read.defaults_used.includes("min_reps"));

    // 4) THE QUIETEST FAILURE: a misspelled KEY is not a rejection, it is a no-op —
    //    the leaf pass never sees it, so it needed its own lane. `_comment` is prose.
    const misspelt = normalizeConfig({ _comment: "prose", min_rep: 12, danger: { min_new_reps: 5 } });
    assert("#clamp a misspelled key is reported as unknown (a no-op edit, invisible to every other check) and `_comment` is not",
      misspelt.min_reps === 20 && misspelt._read.unknown.includes("min_rep")
      && misspelt._read.unknown.includes("danger.min_new_reps") && !misspelt._read.unknown.includes("_comment"));

    // 5) a whole SUB-OBJECT typed as something else takes three leaves with it, and the
    //    per-leaf pass walks an empty {} it cannot report from
    const subObj = normalizeConfig({ targets: "0.95" });
    assert("#clamp a sub-object typed as a string is named once, not lost in three silent leaf fallbacks",
      subObj.targets.knew === 0.95 && !!subObj._read.rejected.find((x) => x.key === "targets" && x.got === '"0.95"'));

    // 6) loadConfig on disk: absent vs UNREADABLE are different facts and now say so.
    //    The unreadable fixture is THIS FILE — it exists, and it is certainly not JSON,
    //    so no temp file is written and nothing on the real bus is touched.
    const missing = loadConfig("__no_such_config__");
    const unread  = loadConfig(fileURLToPath(import.meta.url));
    assert("#clamp a MISSING config reads 'defaults:absent' with no error and nothing rejected",
      missing._read.source === "defaults:absent" && missing._read.error === null && missing._read.rejected.length === 0 && missing.min_reps === 20);
    assert("#clamp an UNREADABLE config no longer vanishes into a bare catch — the parse error rides out with the defaults",
      unread._read.source === "defaults:unreadable" && typeof unread._read.error === "string" && unread._read.error.length > 0 && unread.min_reps === 20);

    // 7) THE WIRE. compute() PUBLISHES the block — this is the field limits.mjs reads.
    //    Cut `config:` out of compute and this goes red, instead of the journal being
    //    written to a local variable and dying there (the producer-with-no-consumer
    //    shape this whole audit exists to hunt).
    const dirty = compute([...rep(3, "c", "knew", true)], typo, reg, now);
    const cleanOut = compute([...rep(3, "c", "knew", true)], loadConfig("__no_such_config__"), reg, now);
    assert("#wire THE WIRE: the config read is PUBLISHED in calibration.json, carrying source + the discarded leaf",
      !!dirty.config && dirty.config.clean === false && dirty.config.rejected.length === 1
      && dirty.config.rejected[0].key === "min_reps" && dirty.config.rejected[0].using === 20);
    assert("#wire a clean read publishes clean:true with empty lists — the block is always there, so a reader never has to guess",
      cleanOut.config.clean === true && cleanOut.config.rejected.length === 0 && cleanOut.config.unknown.length === 0
      && cleanOut.config.source === "defaults:absent");
    assert("#wire the published need and the published provenance travel TOGETHER (the gate says 20; the block says that 20 is NOT his)",
      dirty.gate.need === 20 && dirty.config.defaults_used.includes("min_reps"));

    // 8) NO THRESHOLD WAS INVENTED: every `using` value is a value DEFAULTS already held.
    const all = normalizeConfig({ targets: { knew: "a", shaky: "a", guessed: "a" }, window_size: "a", min_reps: "a", trend_delta: "a", danger: { min_knew_reps: "a", accuracy_low: "a", accuracy_mid: "a" } });
    const flat = { "targets.knew": DEFAULTS.targets.knew, "targets.shaky": DEFAULTS.targets.shaky, "targets.guessed": DEFAULTS.targets.guessed,
      window_size: DEFAULTS.window_size, min_reps: DEFAULTS.min_reps, trend_delta: DEFAULTS.trend_delta,
      "danger.min_knew_reps": DEFAULTS.danger.min_knew_reps, "danger.accuracy_low": DEFAULTS.danger.accuracy_low, "danger.accuracy_mid": DEFAULTS.danger.accuracy_mid };
    assert("#clamp all nine leaves report, and every `using` is the value DEFAULTS already held — no number was invented for this block",
      all._read.rejected.length === 9 && all._read.rejected.every((x) => x.using === flat[x.key]));
  }

  // --- WIRING AUDIT (11 Aug 2026): THE SWALLOWED LINE ------------------------
  // loadReps dropped unparseable and invalid lines behind `catch { /* skip */ }` with no
  // count anywhere, so every number in this file rode the survivors and said so nowhere.
  // These go red if the loader stops counting, if the block stops publishing, if a missing
  // read is ever reported as a confident zero, or if the reason-namer drifts from the gate.
  // Proved on a REAL FILE in tmpdir, not a mock: the defect lived in the file read itself.
  {
    const dir = join(tmpdir(), "arsenal_calibration_selftest");
    mkdirSync(dir, { recursive: true });
    const p = join(dir, "reps_log.jsonl");
    const good = (q) => JSON.stringify({ ts: "2026-08-10T09:00:00Z", surface: "gem", track: "concept", concept: "tokenization", axis: "a", question: q, confidence: "knew", correct: true });
    writeFileSync(p, [
      good("q1"),
      "{ this is not json",                                                                              // unparseable
      JSON.stringify({ ts: "2026-08-10T09:02:00Z", track: "concept", concept: "x", question: "q3", confidence: "knew", correct: "yes" }),   // correct not boolean
      JSON.stringify({ ts: "2026-08-10T09:03:00Z", track: "colab", concept: "x", question: "q4", confidence: "knew", correct: true }),      // track not concept|skill
      "",                                                                                                // blank lines are not lines
      good("q5"),
    ].join("\n") + "\n", "utf8");

    const st = {};
    const loaded = loadReps(p, st);
    assert("#swallow the loader COUNTS what it drops — 6 lines in, 2 reps out, 3 dropped, and the arithmetic closes",
      loaded.length === 2 && st.lines_seen === 5 && st.reps_used === 2 && st.dropped === 3
      && st.reps_used + st.dropped === st.lines_seen);
    assert("#swallow every drop carries a REASON in field names (a bare count sends a human hunting a gitignored ledger by eye)",
      st.dropped_reasons.length === 3
      && st.dropped_reasons.includes("unparseable JSON line")
      && st.dropped_reasons.includes("correct not boolean")
      && st.dropped_reasons.includes("track not concept|skill"));

    const cb = compute(loaded, cfg, reg, now, st);
    assert("#swallow the loss is PUBLISHED, and total_reps is reconcilable against the ledger it came from",
      !!cb.corpus && cb.corpus.reps_used === cb.total_reps && cb.corpus.dropped === 3
      && cb.corpus.lines_seen === cb.corpus.reps_used + cb.corpus.dropped
      && cb.corpus.line === "2/5 ledger lines read" && cb.corpus.clean === false
      && cb.corpus.reasons["unparseable JSON line"] === 1);
    // NO REP TEXT LEAVES THE LEDGER. reps_log is gitignored derived study data and
    // capture.mjs owns the only sidecar it may be copied into; a read-only consumer that
    // starts duplicating his questions is a second store nobody agreed to.
    assert("#swallow the published block carries counts and reasons ONLY — never a rep's text",
      !JSON.stringify(cb.corpus).includes("tokenization") && !JSON.stringify(cb.corpus).includes("q3"));

    // ABSENT IS NOT ZERO — the lesson limits.mjs states as law and doubtminer's selftest
    // calls "the same class of lie": a compute() with no loader stats must not claim a
    // clean read it never performed.
    assert("#swallow a compute() with no loader stats publishes corpus:null, never a confident 0 dropped",
      compute(loaded, cfg, reg, now).corpus === null);

    // a clean ledger still publishes — silence would make "no drops" indistinguishable
    // from "the counter is gone", which is the defect one level up.
    const p2 = join(dir, "clean.jsonl");
    writeFileSync(p2, good("q1") + "\n" + good("q2") + "\n", "utf8");
    const st2 = {}; loadReps(p2, st2);
    assert("#swallow a clean read still says so (2/2, clean:true) — a missing block and a clean one must never look alike",
      corpusBlock(st2).clean === true && corpusBlock(st2).dropped === 0 && corpusBlock(st2).line === "2/2 ledger lines read");
    const st3 = {}; loadReps(join(dir, "__no_such_log__"), st3);
    assert("#swallow a missing ledger reads 0/0 rather than vanishing (absent ledger ≠ unmeasured)",
      corpusBlock(st3).lines_seen === 0 && corpusBlock(st3).reps_used === 0 && corpusBlock(st3).clean === true);

    // THE REASON-NAMER MUST NEVER DISAGREE WITH THE GATE. validRep decides; whyInvalid only
    // explains. A drift here would publish a reason for a rep that was counted, or none for
    // one that was not — worse than the silence this repair closed.
    const cases = [
      { ts: "2026-08-10T09:00:00Z", confidence: "knew", correct: true, concept: "c", track: "concept" },   // valid
      null, 42, [], { }, { ts: "nope", confidence: "knew", correct: true, concept: "c", track: "concept" },
      { ts: "2026-08-10T09:00:00Z", confidence: "sure", correct: true, concept: "c", track: "concept" },
      { ts: "2026-08-10T09:00:00Z", confidence: "knew", correct: 1, concept: "c", track: "concept" },
      { ts: "2026-08-10T09:00:00Z", confidence: "knew", correct: true, concept: "   ", track: "concept" },
      { ts: "2026-08-10T09:00:00Z", confidence: "knew", correct: true, concept: "c", track: "python" },
    ];
    assert("#swallow whyInvalid agrees with validRep on every fixture — the reason explains the gate, it never becomes one",
      cases.every((c) => (whyInvalid(c) === null) === !!validRep(c)));

    try { rmSync(dir, { recursive: true, force: true }); } catch { /* tmp cleanup is a courtesy */ }
  }

  // --- WIRING AUDIT (11 Aug 2026): THE SILENT REGISTRY ----------------------
  // THE DEFECT: loadRegistry swallowed a missing/malformed concepts.json in a bare
  // catch and compute() published NOTHING about it — the run came out identical to a
  // healthy one. Every sibling that reads this registry already says when it is down
  // (capture.mjs, nemesis.mjs, examiner.mjs); this one did not. The net below: the two
  // failure modes told apart, the DAMAGE reproduced on real files, then THE WIRE.
  {
    // real files, because a mocked loader proves nothing about the loader. OS temp, so
    // nothing on the bus is touched (capture.mjs:1070's precedent).
    const rdir = join(tmpdir(), "arsenal_calibration_registry_selftest");
    mkdirSync(rdir, { recursive: true });
    const goodPath = join(rdir, "concepts.json");
    const badPath  = join(rdir, "concepts_broken.json");
    const CANON = { concepts: { tokenization: { aliases: ["bpe"] } }, skills: { pydantic: {} } };
    writeFileSync(goodPath, JSON.stringify(CANON, null, 2));
    writeFileSync(badPath, JSON.stringify(CANON, null, 2) + ",");   // one stray comma — capture.mjs's own 10 Aug fixture, the typo that orphaned 85 concepts
    const gReg = loadRegistry(goodPath), bReg = loadRegistry(badPath), mReg = loadRegistry("__no_such_concepts__");

    assert("#reg a healthy concepts.json loads and SAYS so — loaded:true, no error, and the alias actually resolves",
      gReg.loaded === true && gReg.error === null && gReg.conceptAlias.get("bpe") === "tokenization" && gReg.skillAlias.get("pydantic") === "pydantic");
    assert("#reg MISSING and UNREADABLE are different facts and each now names itself — both still empty-safe, exactly as before",
      mReg.loaded === false && /not found/.test(mReg.error || "") && mReg.conceptAlias.size === 0
      && bReg.loaded === false && /unreadable/.test(bReg.error || "") && bReg.conceptAlias.size === 0);

    // THE DAMAGE, REPRODUCED. Same 22 reps, same config. Canon readable ⇒ "bpe" and
    // "tokenization" are ONE topic with 3 knew-wrong and the danger zone indicts it.
    // Canon down ⇒ each spelling is its own namespace (2 and 1), both fall under gate
    // (a), and the list goes EMPTY: the bias-to-silence of :24 inverted into a false
    // all-clear, which is the one direction this organ may never fail in.
    const frag = [...rep(2, "tokenization", "knew", false), ...rep(1, "bpe", "knew", false), ...rep(19, "filler", "shaky", true)];
    const healthy = compute(frag, cfg, gReg, now);
    const downRun = compute(frag, cfg, bReg, now);
    assert("#reg THE DAMAGE: a dead registry splits one 3-knew topic into 2+1 and the danger zone goes EMPTY (an under-count, never an acquittal)",
      healthy.danger_zone.length === 1 && healthy.danger_zone[0].topic === "tokenization" && downRun.danger_zone.length === 0);

    // THE WIRE. Cut the two flags out of compute() and this goes red, instead of the
    // fault being known inside loadRegistry and dying there.
    assert("#reg THE WIRE: the run PUBLISHES whether canon was readable — registry_loaded + registry_error, capture.mjs:540's own field names",
      healthy.registry_loaded === true && healthy.registry_error === null
      && downRun.registry_loaded === false && /unreadable/.test(downRun.registry_error || ""));
    const gRow = healthy.gate.sub.find((x) => x.name === "registry");
    const bRow = downRun.gate.sub.find((x) => x.name === "registry");
    assert("#reg the counter carries the registry as a gate of its own — 1/1 OPEN vs 0/1 SHUT, with the reason on the row (this is the row limits.mjs prints)",
      !!gRow && gRow.have === 1 && gRow.need === 1 && gRow.open === true && gRow.error === null
      && !!bRow && bRow.have === 0 && bRow.need === 1 && bRow.open === false && /unreadable/.test(bRow.error || ""));

    // THE TRACER'S OWN CASE — a ledger with no alias in play. Here the arithmetic is
    // genuinely identical, and BEFORE today so was every byte: /registr/i matched
    // nowhere in either output, so nothing downstream could tell canon had gone. The
    // knew-gate's "2/3 knew-reps" (above) says NOT ENOUGH DATA; only this row says the
    // data was there and the table that joins it could not be read.
    const plain = [...rep(3, "hallucinations", "knew", true), ...rep(18, "filler", "shaky", true)];
    const pHealthy = compute(plain, cfg, gReg, now), pDown = compute(plain, cfg, bReg, now);
    assert("#reg identical arithmetic (same gap, same danger count, same gate line) and yet the two runs are NO LONGER indistinguishable",
      pHealthy.calibration_gap === pDown.calibration_gap
      && pHealthy.danger_zone.length === pDown.danger_zone.length && pHealthy.gate.line === pDown.gate.line
      && JSON.stringify(pHealthy) !== JSON.stringify(pDown) && /registr/i.test(JSON.stringify(pDown)));

    // NOT WITHHELD — the overconfidence precedent. A down registry makes the list
    // INCOMPLETE, not false; deleting the indictments that DID fire is a trade only the
    // captain may make.
    const stillFires = compute([...rep(3, "tokenization", "knew", false), ...rep(19, "filler", "shaky", true)], cfg, bReg, now);
    assert("#reg a registry-down run still publishes the topics it CAN judge, and 'registry' is never added to withheld (provisional, not suppressed)",
      stillFires.danger_zone.length === 1 && !stillFires.gate.withheld.includes("registry") && stillFires.registry_loaded === false);

    rmSync(rdir, { recursive: true, force: true });
  }

  const passed = checks.every(([, ok2]) => ok2);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  const mode = (process.argv[2] || "recompute").toLowerCase();
  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }
  const cfg = loadConfig();
  const reg = loadRegistry();
  const corpusStats = {};
  const reps = loadReps(REPS_LOG, corpusStats);
  const out = compute(reps, cfg, reg, new Date(), corpusStats);
  writeAtomic(CAL, out);
  // #106 — the console line leads with the counter, not the word. A refusal a human
  // reads must carry the number that would end it.
  // 11 Aug 2026: this keyed the withholding clause on the ROOT gate, so the knew-gate's
  // refusal was invisible on the one line a human actually sees — 21 reps printed
  // "danger 0" with no clause at all. It now keys on the LIST being non-empty and names
  // the gate that shut, so "danger 0" can never again read as "looked, found nothing".
  const kn = out.gate.sub.find((s) => s.name === "danger.min_knew_reps");
  const held = out.gate.withheld.length
    ? ` (${out.status}; withholding ${out.gate.withheld.join(", ")}${kn && !kn.open ? ` — ${kn.line}` : ""})`
    : "";
  // ...and the config read that every one of those needs rests on. Silent until something
  // is actually wrong, because a line that always prints is a line nobody reads.
  const cr = out.config;
  const cfgBits = [];
  if (cr.error) cfgBits.push(`UNREADABLE (${cr.source}): ${cr.error}`);
  if (cr.rejected.length) cfgBits.push(`${cr.rejected.length} edit(s) DISCARDED → ${cr.rejected.map((x) => `${x.key}=${x.got} ignored, using ${x.using}`).join(" · ")}`);
  if (cr.unknown.length) cfgBits.push(`${cr.unknown.length} unknown key(s) (typo? nothing reads them): ${cr.unknown.join(", ")}`);
  console.log(`calibration: ${out.gate.line}${held} — gap ${out.calibration_gap} · overconf ${out.overconfidence_rate} · danger ${out.danger_zone.length} · ${out.trend}  →  ${CAL}`);
  if (cfgBits.length) console.log(`  CONFIG (${CFG_PATH}): ${cfgBits.join("  ·  ")}`);
  // ...and the lines that never reached the arithmetic. Silent on a clean read, same
  // discipline as the config line above: a clause that always prints is a clause nobody
  // reads. When it does print it names the reasons, because "2 dropped" sends a human
  // hunting through a 21-line gitignored ledger by eye.
  const cp = out.corpus;
  if (cp && cp.dropped) {
    console.log(`  CORPUS (${REPS_LOG}): ${cp.line} — ${cp.dropped} line(s) NOT counted: `
      + Object.entries(cp.reasons).map(([why, n]) => `${n}× ${why}`).join(" · ")
      + `  (they are still in the ledger; triage: node scripts/capture.mjs quarantine)`);
  }
  // ...and the alias table both per-topic reads rest on. Same silent-until-wrong rule as
  // the two clauses above. When it DOES print it is the most important sentence on the
  // screen: every "danger N" printed higher up is an UNDER-count, because each spelling
  // of a topic was counted as its own topic (see loadRegistry).
  if (!out.registry_loaded) {
    console.log(`  ⚠ REGISTRY DOWN (${CONCEPTS_PATH}): ${out.registry_error || "concepts.json not read"}`
      + ` — topics did NOT collapse to their aliases, so danger_zone and the knew-gate both under-read`);
  }
  process.exit(0);
}

// Windows-safe entry guard (like timeaudit.mjs / fsrs.mjs)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { compute, ece, computeDanger, computeTrend, bucketsObj, buildGate, loadReps, loadConfig, normalizeConfig, loadRegistry, topicOf, whyInvalid, corpusBlock };
