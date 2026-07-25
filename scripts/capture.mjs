#!/usr/bin/env node
// ============================================================================
// capture.mjs · ARSENAL AI FC — AGENT #0: THE SHARED CAPTURE LAYER (v2)
// ----------------------------------------------------------------------------
// WHAT:  The single writer of dressing-room/state/reps_log.jsonl — one JSON
//        object per line, one line per study/drill "rep." Three downstream
//        agents READ it and compute their own view (never write it):
//          FSRS ← concept cards + schedule · Calibration ← confidence gap
//          Nemesis ← ranked recurring misses. (#4 learning-state finalizes the
//          axis/fluency controller at R1.)
// WHY:   One capture, three consumers — no brittle per-agent hooks (CONDUCTOR §7).
//
// v2 AMENDMENT (ontology at ground-zero; reps_log was EMPTY → zero migration):
//   Enriches each rep with track (concept vs skill), axis (a–i, concept-only),
//   latency_ms, aided (skill-only), and unregistered (concept not in the registry).
//   Canon: AI concepts = 9-axis (decay-prone) · Python = SKILL (fluency, NO axis).
//   The change is strictly ADDITIVE (layering): every prior check retained.
//
// CAPTURE-HOOK: captain works only on Colab / Gems (cloud). Two intake paths:
//     • paste  — Gems: paste the Drill-Gem's session JSON array → append.
//     • pull   — Colab→Drive (Option B): reads *.jsonl from the Drive inbox →
//                append → move to <inbox>/done. (See MANUAL_WIRING.md.)
//
// INPUT CONTRACT (one rep, one JSON object):
//   { ts:ISO, surface:"gem"|"colab",
//     track:"concept"|"skill",              // drives downstream ontology
//     concept:string,                       // normalized via concepts.json aliases
//     axis:"a".."i"|null,                   // ONLY track:"concept"; skill MUST be null
//     question:string, confidence:"knew"|"shaky"|"guessed", correct:boolean,
//     latency_ms:int>=0|null,               // optional
//     aided:boolean|null,                   // optional — ONLY track:"skill"
//     confused_with:string|null,            // v3 optional — canonicalized like concept (feeds confusion-pairs)
//     edge:string|null,                     // v3 optional — verbatim knowledge-boundary text (feeds edge-map)
//     note?:string }
//   Enriched-on-write: concept→canonical, unregistered:boolean (unknown concept is
//   still appended with unregistered:true — SOFT, never hard-rejected).
//   Dedup key = ts + question. Structurally-malformed reps are REJECTED.
//
// OUTPUT: dressing-room/state/reps_log.jsonl (append-only JSONL, single writer).
//   Missing/empty = valid (awaiting data). NEVER fabricates a rep.
//
// REGISTRY: dressing-room/state/concepts.json (canon, hand-curated). capture only
//   READS it (single-writer preserved). Missing registry = still logs (all reps
//   unregistered:true), no crash.
//
// MODES: paste [file] · pull · selftest
// RULES (CONDUCTOR §4): deterministic · no API key · Node 22 ESM · Windows-safe
//   entry guard · atomic write (temp→rename) · empty-safe · never fabricate.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const REPS_LOG  = join(STATE_DIR, "reps_log.jsonl");
const CONFIG_PATH   = join(STATE_DIR, "capture_config.json");   // machine-local (gitignored)
const CONCEPTS_PATH = join(STATE_DIR, "concepts.json");         // canon (committed)

// Colab→Drive inbox (Option B). Resolved from CONFIG, never a hardcoded user path:
//   1) env ARSENAL_REPS_INBOX  →  2) capture_config.json {"inbox":"..."}  →  3) unset = dormant.
function resolveInbox() {
  if (process.env.ARSENAL_REPS_INBOX && process.env.ARSENAL_REPS_INBOX.trim()) return process.env.ARSENAL_REPS_INBOX.trim();
  try {
    if (existsSync(CONFIG_PATH)) {
      const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
      if (cfg && typeof cfg.inbox === "string" && cfg.inbox.trim()) return cfg.inbox.trim();
    }
  } catch { /* malformed config → unconfigured, never crash */ }
  return null;
}

// ---------------------------------------------------------------------------
// registry — canonical concept/skill vocab (read-only). Empty-safe if missing.
// ---------------------------------------------------------------------------
const normText = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
const EMPTY_REG = { conceptAlias: new Map(), skillAlias: new Map(), loaded: false };

function loadRegistry(path = CONCEPTS_PATH) {
  const reg = { conceptAlias: new Map(), skillAlias: new Map(), loaded: false };
  try {
    if (!existsSync(path)) return reg;
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
  } catch { /* malformed registry → treat as empty (empty-safe) */ }
  return reg;
}

// resolve a raw concept string → { canonical, unregistered } for the given track
function canonicalize(raw, track, reg) {
  const key = normText(raw);
  const map = track === "skill" ? reg.skillAlias : reg.conceptAlias;
  if (map.has(key)) return { canonical: map.get(key), unregistered: false };
  return { canonical: key, unregistered: true };
}

// ---------------------------------------------------------------------------
// validation — accept ONLY well-typed reps; enrich concept + unregistered.
// Strictly additive over v1 (all prior checks retained).
// ---------------------------------------------------------------------------
const SURFACES   = new Set(["gem", "colab"]);
const TRACKS     = new Set(["concept", "skill"]);
const CONFIDENCE = new Set(["knew", "shaky", "guessed"]);        // gut-word, committed BEFORE the answer
const AXES       = new Set("abcdefghi".split(""));               // 9 axes a–i (canon; FORGE faultLines a–i)

function validateRep(o, reg = EMPTY_REG) {
  if (o === null || typeof o !== "object" || Array.isArray(o)) return { ok: false, error: "not an object" };
  if (typeof o.ts !== "string" || o.ts.trim() === "") return { ok: false, error: "ts missing/not-string" };
  // ts must actually PARSE as a date. E2E audit (25 Jul 2026): the gate only asked for a
  // non-empty string, so an LLM-authored ts ("yesterday 9pm", "19/07/2026 21:30") sailed
  // through capture and was then SILENTLY discarded by every consumer downstream — fsrs
  // validRep, calibration, nemesis and learning_state all require
  // !Number.isNaN(Date.parse(ts)). The rep sat in the log looking captured while it
  // scheduled no card and showed in no view. Reject it HERE, loud, with a reason the
  // paste output prints — and store the normalized ISO form so the dedupe key
  // (ts + question) cannot split on two spellings of the same instant.
  const tsMs = Date.parse(o.ts);
  if (Number.isNaN(tsMs)) return { ok: false, error: `ts not a parseable date (${o.ts})` };
  const tsISO = new Date(tsMs).toISOString();
  if (!SURFACES.has(o.surface)) return { ok: false, error: `surface not gem|colab (${o.surface})` };
  if (!TRACKS.has(o.track)) return { ok: false, error: `track not concept|skill (${o.track})` };
  if (typeof o.concept !== "string" || o.concept.trim() === "") return { ok: false, error: "concept missing/empty" };
  if (typeof o.question !== "string" || o.question.trim() === "") return { ok: false, error: "question missing/empty" };
  if (!CONFIDENCE.has(o.confidence)) return { ok: false, error: `confidence not knew|shaky|guessed (${o.confidence})` };
  if (typeof o.correct !== "boolean") return { ok: false, error: "correct not boolean" };
  // axis: field required (null allowed). Non-null ⇒ track=concept AND a..i. skill ⇒ null.
  if (o.axis === undefined) return { ok: false, error: "axis missing (use null)" };
  if (o.axis !== null) {
    if (o.track !== "concept") return { ok: false, error: "axis only on track=concept (skill+axis)" };
    if (!AXES.has(o.axis)) return { ok: false, error: `axis not a..i (${o.axis})` };
  }
  // latency_ms: optional; null or int>=0
  let latency_ms = null;
  if (o.latency_ms !== undefined && o.latency_ms !== null) {
    if (!Number.isInteger(o.latency_ms) || o.latency_ms < 0) return { ok: false, error: `latency_ms not int>=0 or null (${o.latency_ms})` };
    latency_ms = o.latency_ms;
  }
  // aided: optional; ONLY track=skill; boolean or null
  let aided = null;
  if (o.aided !== undefined && o.aided !== null) {
    if (o.track !== "skill") return { ok: false, error: "aided only on track=skill" };
    if (typeof o.aided !== "boolean") return { ok: false, error: "aided not boolean/null" };
    aided = o.aided;
  }
  // confused_with (v3): optional; null or a canonicalized concept/skill id (SAME path as `concept`)
  let confused_with = null;
  if (o.confused_with !== undefined && o.confused_with !== null) {
    if (typeof o.confused_with !== "string" || o.confused_with.trim() === "") return { ok: false, error: "confused_with not string" };
    confused_with = canonicalize(o.confused_with, o.track, reg).canonical;
  }
  // edge (v3): optional; null or free-text string stored VERBATIM (not canonicalized)
  let edge = null;
  if (o.edge !== undefined && o.edge !== null) {
    if (typeof o.edge !== "string") return { ok: false, error: "edge not string" };
    edge = o.edge;
  }
  if (o.note !== undefined && typeof o.note !== "string") return { ok: false, error: "note not string" };

  // enrich: canonicalize concept + unregistered flag (unknown ⇒ soft, still logged)
  const { canonical, unregistered } = canonicalize(o.concept, o.track, reg);
  const rep = {
    ts: tsISO, surface: o.surface, track: o.track, concept: canonical,
    axis: o.axis, question: o.question, confidence: o.confidence, correct: o.correct,
    latency_ms, aided, unregistered, confused_with, edge,
  };
  if (o.note !== undefined) rep.note = o.note;
  return { ok: true, rep };
}

const keyOf = (r) => JSON.stringify([r.ts, r.question]);

// load existing reps (defensive: skip unparseable lines; missing file = empty)
function loadReps(path, reg = EMPTY_REG) {
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    try { const o = JSON.parse(s); const v = validateRep(o, reg); if (v.ok) out.push(v.rep); } catch { /* skip corrupt line */ }
  }
  return out;
}

// atomic write: temp file → rename (a parse-fail reads as missing, never half-written)
// E2E audit (25 Jul 2026): the temp name was the FIXED `path + ".tmp"`. Two live
// processes run this file — dugout.mjs shells `capture.mjs paste <tmp>` on every
// log_reps tool call, heartbeat runs `capture.mjs pull` on the schedule — so both
// wrote the SAME temp path and either could rename the other's half-written file
// over reps_log. Temp is now unique per process AND per call, and a failed write
// deletes its own temp instead of leaving an orphan next to gitignored personal
// state (the repo-root `*.tmp` rule covers it, but we don't leave litter for it).
let tmpSeq = 0;
function writeAtomic(path, reps) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${++tmpSeq}.${Date.now().toString(36)}.tmp`;
  try {
    writeFileSync(tmp, reps.map((r) => JSON.stringify(r)).join("\n") + (reps.length ? "\n" : ""));
    renameSync(tmp, path);
  } catch (e) {
    try { rmSync(tmp, { force: true }); } catch { /* best-effort cleanup; the throw below is the truth */ }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// writer lock — reps_log has one logical writer (this file) but SEVERAL live
// processes running it (dugout `paste` on voice reps · heartbeat `pull` on the
// schedule). E2E audit (25 Jul 2026): ingest() is a read-modify-REWRITE of the
// whole log with no lock, so a paste and a pull overlapping inside that window
// silently LOSE one batch — the second writer rewrites the file from its own
// stale snapshot and the first writer's reps vanish. This is an OS-level
// exclusive-create (wx) lock. Two hard rules encoded here:
//   • it never wedges capture: a lock left behind by a killed writer is broken
//     once it goes stale, and a lock we can't take at all is stepped over;
//   • it never refuses a rep: on timeout we break the lock and write anyway —
//     racing a rep is bad, dropping the captain's rep on the floor is worse.
// The lock deliberately carries a *.tmp suffix so the repo-root `*.tmp` ignore
// already covers it: a crash can't leave an untracked sibling in a PUBLIC repo.
// ---------------------------------------------------------------------------
const LOCK_STALE_MS   = 30_000;   // older than this ⇒ its owner is dead, break it
const LOCK_TIMEOUT_MS = 5_000;    // waited this long ⇒ break it and proceed anyway
const LOCK_POLL_MS    = 25;
const LOCK_MAX_TRIES  = 600;      // absolute backstop: never spin forever
const lockPathOf = (path) => `${path}.lock.tmp`;
const sleepSync = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch { /* no SAB → skip the nap, the try-loop still bounds itself */ } };

function withRepsLock(path, fn, opts = {}) {
  const lock     = lockPathOf(path);
  const staleMs  = Number.isFinite(opts.staleMs)   ? opts.staleMs   : LOCK_STALE_MS;
  const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : LOCK_TIMEOUT_MS;
  try { mkdirSync(dirname(path), { recursive: true }); } catch { /* dir may already exist */ }
  const started = Date.now();
  let held = false, tries = 0;
  while (!held && ++tries <= LOCK_MAX_TRIES) {
    try {
      writeFileSync(lock, JSON.stringify({ pid: process.pid, at: Date.now() }), { flag: "wx" });
      held = true;
    } catch (e) {
      if (!e || e.code !== "EEXIST") return fn();   // can't lock at all (read-only dir, odd FS) → run unlocked rather than block capture
      let ageMs;
      try { ageMs = Date.now() - statSync(lock).mtimeMs; } catch { continue; }  // lock vanished mid-check → retry the grab
      if (ageMs > staleMs || Date.now() - started > timeoutMs) { try { rmSync(lock, { force: true }); } catch { /* someone else broke it first */ } continue; }
      sleepSync(LOCK_POLL_MS);
    }
  }
  if (!held) return fn();                            // backstop exhausted → write anyway, never lose the rep
  try { return fn(); } finally { try { rmSync(lock, { force: true }); } catch { /* best-effort release */ } }
}

// ingest candidates → validate + dedup (vs existing AND within batch) → atomic append.
// LAYERING (E2E audit 25 Jul 2026): this is the original engine, byte-for-byte —
// it assumes it is alone with the file. `ingest` below is the plan of record and
// runs exactly this under the writer lock. Nothing else should call it unlocked.
function ingestUnlocked(path, candidates, reg = EMPTY_REG) {
  const existing = loadReps(path, reg);
  const seen = new Set(existing.map(keyOf));
  const toAppend = [];
  let rejected = 0, duplicates = 0;
  const errors = [];
  for (const c of candidates) {
    const v = validateRep(c, reg);
    if (!v.ok) { rejected++; errors.push(v.error); continue; }
    const k = keyOf(v.rep);
    if (seen.has(k)) { duplicates++; continue; }
    seen.add(k); toAppend.push(v.rep);
  }
  if (toAppend.length) writeAtomic(path, existing.concat(toAppend));
  return { appended: toAppend.length, rejected, duplicates, total: existing.length + toAppend.length, errors };
}

// the plan of record: the same ingest, with the read-modify-rewrite window held
// under the writer lock so a concurrent paste/pull can't overwrite the other's reps.
// (opts is lock tuning only — selftest uses it to age a lock out instantly; callers
//  in production pass nothing and get the LOCK_* defaults.)
function ingest(path, candidates, reg = EMPTY_REG, opts = {}) {
  return withRepsLock(path, () => ingestUnlocked(path, candidates, reg), opts);
}

// parse a pasted blob into an array of candidate objects
function parseBlob(text) {
  const t = (text || "").trim();
  if (!t) return [];
  const j = JSON.parse(t);              // throws on malformed JSON → caller reports
  return Array.isArray(j) ? j : [j];
}

// pull: ingest new *.jsonl from the Drive inbox → move processed files to /done.
function pullFromInbox(inboxPath, repsPath, reg = EMPTY_REG) {
  if (!existsSync(inboxPath)) {
    return { pulled: 0, files: 0, wired: false, note: `inbox not found (${inboxPath}) — Google Drive for Desktop not wired yet; nothing pulled` };
  }
  const files = readdirSync(inboxPath).filter((f) => f.toLowerCase().endsWith(".jsonl"));
  const doneDir = join(inboxPath, "done");
  let pulled = 0, rejected = 0, duplicates = 0, failed = 0;
  const failures = [];
  for (const f of files) {
    const full = join(inboxPath, f);
    // PER-FILE ISOLATION (E2E audit 25 Jul 2026): the read + ingest + move used to run
    // bare, so ONE bad file killed the whole pull. The inbox is a Google Drive for
    // Desktop folder — an online-only placeholder or a file the sync engine still holds
    // open throws EBUSY/EPERM/ENOENT on read, the exception escaped pullFromInbox, the
    // scheduled ArsenalFC-CapturePull process died, and every file alphabetically BEHIND
    // it stayed unpulled that night (and every night, until the captain noticed). One
    // unreadable file must cost one file, never the batch.
    try {
      const cands = [];
      for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
        const s = line.trim(); if (!s) continue;
        try { cands.push(JSON.parse(s)); } catch { rejected++; }
      }
      const r = ingest(repsPath, cands, reg);
      pulled += r.appended; rejected += r.rejected; duplicates += r.duplicates;
      mkdirSync(doneDir, { recursive: true });
      // collision-safe archive: renameSync OVERWRITES an existing destination on both
      // Windows and POSIX, so a same-named file from an earlier session (Colab reuses
      // export names) was silently destroyed in done/. Park the newcomer beside it.
      let dest = join(doneDir, f);
      if (existsSync(dest)) {
        const dot = f.lastIndexOf(".");
        dest = join(doneDir, `${f.slice(0, dot)}.${Date.now().toString(36)}${f.slice(dot)}`);
      }
      renameSync(full, dest);
    } catch (e) {
      // reps may already be ingested when only the MOVE failed — that's safe: the file
      // stays in the inbox and next run's ts+question dedupe swallows the re-read.
      failed++; failures.push(`${f}: ${e?.code || e?.message || String(e)}`);
      continue;
    }
  }
  const note = `pulled ${pulled} from ${files.length - failed} file(s)` + (failed ? `; ${failed} file(s) FAILED and stay in the inbox: ${failures.slice(0, 5).join("; ")}` : "");
  return { pulled, files: files.length, rejected, duplicates, failed, failures, wired: true, note };
}

// ---------------------------------------------------------------------------
// selftest — baked mock in a temp dir; the real reps_log is NEVER touched.
// ---------------------------------------------------------------------------
function selftest() {
  const dir = join(tmpdir(), "arsenal_capture_selftest");
  mkdirSync(dir, { recursive: true });
  const p = join(dir, "reps_log.jsonl");
  if (existsSync(p)) rmSync(p);

  // baked registry: concept "tokenization" (alias bpe) + skill "pydantic"
  const cpath = join(dir, "concepts.json");
  writeFileSync(cpath, JSON.stringify({
    version: 1, axes: {}, concepts: { tokenization: { aliases: ["tokenizer", "bpe"] } }, skills: { pydantic: { aliases: [] } },
  }));
  const reg = loadRegistry(cpath);

  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const rep = (over) => ({ ts: "2026-07-11T09:00:00Z", surface: "gem", track: "concept", concept: "tokenization", axis: "a", question: "what is bpe?", confidence: "knew", correct: true, ...over });
  const findQ = (q) => loadReps(p, reg).find((r) => r.question === q);

  // 1) empty-safe
  assert("empty-safe: missing log loads as 0 reps", loadReps(p, reg).length === 0);

  // 2) valid-append
  let r = ingest(p, [rep(), rep({ ts: "2026-07-11T09:05:00Z", question: "q2" })], reg);
  assert("valid-append: 2 valid reps appended", r.appended === 2 && loadReps(p, reg).length === 2);

  // 3) malformed-reject (7): missing ts, out-of-set conf, numeric conf, bad surface, missing concept, non-bool correct, note wrong type
  const bad = [
    rep({ ts: undefined, question: "b1" }),
    rep({ confidence: "sure", question: "b2" }),
    rep({ confidence: 90, question: "b3" }),
    rep({ surface: "notebook", question: "b4" }),
    rep({ concept: "", question: "b5" }),
    rep({ correct: "yes", question: "b6" }),
    rep({ note: 123, question: "b7" }),
  ];
  const before = loadReps(p, reg).length;
  r = ingest(p, [rep({ ts: "2026-07-11T09:10:00Z", question: "good1" }), ...bad], reg);
  assert("malformed-reject: 7 rejected, only 1 valid appended", r.rejected === 7 && r.appended === 1 && loadReps(p, reg).length === before + 1);

  // 3b/3c) confidence enum
  assert("enum-reject: confidence outside {knew,shaky,guessed} rejected", ingest(p, [rep({ ts: "2026-07-11T09:12:00Z", question: "ec", confidence: "sorta" })], reg).rejected === 1);
  assert("enum-accept: knew/shaky/guessed all valid", ["knew", "shaky", "guessed"].every((c, i) => ingest(p, [rep({ ts: `2026-07-11T10:0${i}:00Z`, question: `enumok${i}`, confidence: c })], reg).appended === 1));

  // --- v2: track / axis / latency / aided / registry ---
  assert("axis-accept: a..i valid on concept", ingest(p, [rep({ ts: "2026-07-11T11:00:00Z", question: "ax_a", axis: "a" }), rep({ ts: "2026-07-11T11:01:00Z", question: "ax_i", axis: "i" })], reg).appended === 2);
  assert("axis-reject: bad axis letter rejected", ingest(p, [rep({ ts: "2026-07-11T11:02:00Z", question: "ax_z", axis: "z" })], reg).rejected === 1);
  ingest(p, [rep({ ts: "2026-07-11T11:03:00Z", question: "skill_null", surface: "colab", track: "skill", concept: "pydantic", axis: null })], reg);
  assert("skill-must-have-null-axis: accepted + stored axis null", findQ("skill_null")?.axis === null);
  assert("skill+axis ⇒ reject", ingest(p, [rep({ ts: "2026-07-11T11:04:00Z", question: "skill_ax", track: "skill", concept: "pydantic", axis: "a" })], reg).rejected === 1);
  ingest(p, [rep({ ts: "2026-07-11T11:05:00Z", question: "lat", latency_ms: 1200 })], reg);
  assert("latency accept (int≥0) + null default", findQ("lat")?.latency_ms === 1200 && findQ("ax_a")?.latency_ms === null);
  assert("latency-reject: negative/non-int", ingest(p, [rep({ ts: "2026-07-11T11:06:00Z", question: "lbad", latency_ms: -5 })], reg).rejected === 1 && ingest(p, [rep({ ts: "2026-07-11T11:07:00Z", question: "lbad2", latency_ms: 5.5 })], reg).rejected === 1);
  assert("aided-only-on-skill: concept+aided ⇒ reject", ingest(p, [rep({ ts: "2026-07-11T11:08:00Z", question: "ca", aided: true })], reg).rejected === 1);
  ingest(p, [rep({ ts: "2026-07-11T11:09:00Z", question: "sa", surface: "colab", track: "skill", concept: "pydantic", axis: null, aided: true })], reg);
  assert("aided accepted on skill", findQ("sa")?.aided === true);

  // --- v3: confused_with (canonicalized like concept) + edge (verbatim) ---
  ingest(p, [rep({ ts: "2026-07-11T11:13:00Z", question: "cw", confused_with: "BPE" })], reg);  // alias of tokenization
  assert("confused_with accept + canonicalizes (BPE→tokenization)", findQ("cw")?.confused_with === "tokenization");
  assert("confused_with null/absent ⇒ null", findQ("ax_a")?.confused_with === null);
  assert("confused_with non-string ⇒ reject", ingest(p, [rep({ ts: "2026-07-11T11:14:00Z", question: "cwbad", confused_with: 123 })], reg).rejected === 1);
  ingest(p, [rep({ ts: "2026-07-11T11:15:00Z", question: "eg", edge: "can size chunks, shaky on overlap tradeoffs" })], reg);
  assert("edge accept (verbatim)", findQ("eg")?.edge === "can size chunks, shaky on overlap tradeoffs");
  assert("edge null/absent ⇒ null", findQ("ax_a")?.edge === null);
  assert("edge non-string ⇒ reject", ingest(p, [rep({ ts: "2026-07-11T11:16:00Z", question: "egbad", edge: 5 })], reg).rejected === 1);

  // registry: alias resolves; unknown ⇒ unregistered:true (not dropped)
  ingest(p, [rep({ ts: "2026-07-11T11:10:00Z", question: "alias", concept: "BPE" })], reg);
  assert("registered alias ⇒ canonical + unregistered:false", findQ("alias")?.concept === "tokenization" && findQ("alias")?.unregistered === false);
  const ur = ingest(p, [rep({ ts: "2026-07-11T11:11:00Z", question: "unknown", concept: "brand new concept" })], reg);
  assert("unknown concept ⇒ appended with unregistered:true (never dropped)", ur.appended === 1 && findQ("unknown")?.unregistered === true);
  // concepts.json missing ⇒ still logs (empty registry)
  const p2 = join(dir, "reps_noreg.jsonl"); if (existsSync(p2)) rmSync(p2);
  const nr = ingest(p2, [rep({ ts: "2026-07-11T11:12:00Z", question: "noreg" })], loadRegistry(join(dir, "no_such_concepts.json")));
  assert("concepts.json missing ⇒ still logs (unregistered:true)", nr.appended === 1);

  // dedup + empty-ingest + pull-dormant
  const cnt = loadReps(p, reg).length;
  assert("dedup: identical ts+question not re-appended", ingest(p, [rep()], reg).duplicates === 1 && loadReps(p, reg).length === cnt);
  const p3 = join(dir, "reps_empty.jsonl"); if (existsSync(p3)) rmSync(p3);
  ingest(p3, [], reg);
  assert("empty-ingest: no file fabricated", !existsSync(p3));
  assert("pull dormant: missing inbox → 0 pulled, wired=false", pullFromInbox(join(dir, "no_such_inbox"), p, reg).wired === false);

  // --- E2E audit (25 Jul 2026) regressions ---------------------------------
  // ts gate: unparseable timestamps used to be APPENDED here and then silently
  // dropped by fsrs/calibration/nemesis/learning_state (all Date.parse-gated).
  assert("ts-reject: unparseable ts ('yesterday 9pm') rejected at the gate",
    ingest(p, [rep({ ts: "yesterday 9pm", question: "tsbad" })], reg).rejected === 1 && !findQ("tsbad"));
  assert("ts-reject: locale ts ('19/07/2026 21:30') rejected at the gate",
    ingest(p, [rep({ ts: "19/07/2026 21:30", question: "tsbad2" })], reg).rejected === 1);
  ingest(p, [rep({ ts: "2026-07-11T09:20:00Z", question: "tsnorm" })], reg);
  assert("ts-normalize: stored as canonical ISO (dedupe key can't split on format)",
    findQ("tsnorm")?.ts === "2026-07-11T09:20:00.000Z");

  // writer lock: held for the critical section, released after, and a lock left
  // behind by a killed writer is broken instead of wedging capture forever.
  let lockedInside = false;
  withRepsLock(p, () => { lockedInside = existsSync(lockPathOf(p)); });
  assert("writer-lock: held during the critical section, released after",
    lockedInside === true && !existsSync(lockPathOf(p)));
  writeFileSync(lockPathOf(p), JSON.stringify({ pid: 0, at: 0 }));      // abandoned lock from a killed writer
  const heldRun = ingest(p, [rep({ ts: "2026-07-11T09:21:00Z", question: "lockheld" })], reg, { staleMs: 0 });
  assert("writer-lock: stale lock broken + released — the rep is never lost",
    heldRun.appended === 1 && !!findQ("lockheld") && !existsSync(lockPathOf(p)));

  // writeAtomic: a failed rename must not leave its temp behind (and the temp is
  // no longer the fixed path+".tmp" that two live writers used to share).
  const blocked = join(dir, "blocked.jsonl"); mkdirSync(blocked, { recursive: true });   // rename onto a dir ⇒ EPERM/EISDIR
  let threw = false;
  try { writeAtomic(blocked, [rep()]); } catch { threw = true; }
  const orphans = readdirSync(dir).filter((f) => f.endsWith(".tmp"));
  assert("writeAtomic: failed write cleans up its own temp (no orphan .tmp sibling)", threw && orphans.length === 0);
  rmSync(blocked, { recursive: true, force: true });

  // pull isolation: one unreadable file used to throw straight out of pullFromInbox
  // and kill the scheduled pull, stranding every file behind it.
  const inbox = join(dir, "inbox"); mkdirSync(inbox, { recursive: true });
  mkdirSync(join(inbox, "aaa_broken.jsonl"), { recursive: true });       // a directory ⇒ readFileSync throws EISDIR
  writeFileSync(join(inbox, "bbb_good.jsonl"), JSON.stringify(rep({ ts: "2026-07-11T12:00:00Z", question: "pulled_ok" })) + "\n");
  const pr = pullFromInbox(inbox, p, reg);
  assert("pull isolation: broken file counted as failed, the good file still ingested",
    pr.pulled === 1 && pr.failed === 1 && !!findQ("pulled_ok") && existsSync(join(inbox, "aaa_broken.jsonl")));

  // pull archive: a name collision in done/ must not silently overwrite the older file.
  const inbox2 = join(dir, "inbox2"); mkdirSync(join(inbox2, "done"), { recursive: true });
  writeFileSync(join(inbox2, "done", "ccc.jsonl"), "");                  // an older session already archived
  writeFileSync(join(inbox2, "ccc.jsonl"), JSON.stringify(rep({ ts: "2026-07-11T12:01:00Z", question: "pulled_collide" })) + "\n");
  const pr2 = pullFromInbox(inbox2, p, reg);
  assert("pull archive: collision keeps BOTH files in done/ (no silent overwrite)",
    pr2.pulled === 1 && pr2.failed === 0 && readdirSync(join(inbox2, "done")).filter((f) => f.startsWith("ccc")).length === 2);

  rmSync(dir, { recursive: true, force: true });
  const passed = checks.every(([, ok]) => ok);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }
  const reg = loadRegistry();

  if (mode === "paste") {
    const fileArg = process.argv[3];
    let text;
    if (fileArg) {
      if (!existsSync(fileArg)) { console.error(`paste: file not found: ${fileArg}`); process.exit(1); }
      text = readFileSync(fileArg, "utf8");
    } else if (!process.stdin.isTTY) {
      text = readFileSync(0, "utf8");                 // piped stdin
    } else {
      console.error("paste: provide a JSON file arg or pipe JSON via stdin.\n  node capture.mjs paste session.json"); process.exit(1);
    }
    let cands;
    try { cands = parseBlob(text); }
    catch (e) { console.error(`paste: not valid JSON — nothing ingested (${e.message})`); process.exit(1); }
    const r = ingest(REPS_LOG, cands, reg);
    console.log(`paste: appended ${r.appended}, rejected ${r.rejected}, duplicates ${r.duplicates} → ${REPS_LOG} (total ${r.total})`);
    if (r.errors.length) console.log(`  rejected reasons: ${r.errors.slice(0, 10).join("; ")}`);
    process.exit(0);
  }

  if (mode === "pull") {
    const inbox = resolveInbox();
    if (!inbox) {
      console.log("pull: inbox not configured — set env ARSENAL_REPS_INBOX or capture_config.json {inbox:...}; nothing pulled.");
      process.exit(0);
    }
    const r = pullFromInbox(inbox, REPS_LOG, reg);
    console.log(`pull: ${r.note}` + (r.wired ? ` (rejected ${r.rejected || 0}, duplicates ${r.duplicates || 0})` : ""));
    if (!r.wired) console.log(`  to enable: create ${inbox} (or fix ARSENAL_REPS_INBOX / capture_config.json), then enable task ArsenalFC-CapturePull.`);
    process.exit(0);
  }

  console.log("THE SHARED CAPTURE LAYER (Agent #0)\n  node capture.mjs paste [file]   append pasted Gem/Colab session JSON\n  node capture.mjs pull           ingest new reps from the Drive inbox\n  node capture.mjs selftest       run baked-mock checks");
  process.exit(0);
}

// Windows-safe entry guard (normalise argv[1] to a file:// URL, like timeaudit.mjs)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { validateRep, ingest, loadReps, pullFromInbox, keyOf, loadRegistry, canonicalize };
