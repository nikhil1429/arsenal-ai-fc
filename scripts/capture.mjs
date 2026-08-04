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
// v4 AMENDMENT — THE OBSERVED ARRIVAL CLOCK (organism audit #24, 4 Aug 2026):
//   `ts` was AUTHORED BY THE MODEL and never checked against a clock capture owns.
//   Live proof in reps_log.jsonl: four reps spanning 90 minutes all carry the
//   millisecond `.795`, three of them exactly 1000 ms apart. Capture now stamps its
//   OWN arrival instant (`observed_at`) and keeps the author's claim verbatim
//   (`ts_claimed`) — nothing is destroyed. See THE THREE CLOCKS below for which one
//   `ts` resolves to and why it is not blindly the observed one.
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
//   still appended with unregistered:true — SOFT, never hard-rejected), plus the
//   three clocks (ts_claimed · observed_at · ts_source).
//   Dedup key = ts_claimed + concept + axis + question. Structurally-malformed
//   reps are REJECTED.
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

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, openSync, closeSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";     // #25 — the heartbeat chain (see chainHeartbeat)

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
// REGISTRY KEY NORMALISATION (used ONLY for concept/skill id + alias lookup).
// AUDIT (30 Jul 2026): ids are snake_case (`tool_use`, `rag_eval`, `vector_search`) but a
// rep is written in prose ("tool use"), and folding only whitespace meant the two never met —
// `canonicalize("tool use")` returned unregistered:true against a registry that HAD tool_use.
// Every multi-word concept in the syllabus was invisible to its own registry entry. Folding
// `_` and `-` to a space fixes it once, for every id present and future, instead of asking
// each entry to hand-list its own spelling.
// ORDER MATTERS AND IT BIT ONCE (same-day regression audit, 30 Jul 2026): the first
// version trimmed BEFORE folding, so "-embeddings" folded to " embeddings" — a leading
// space nothing removed afterwards. That made normText NON-IDEMPOTENT, and because
// loadReps re-canonicalises every existing line, the on-disk rep and a fresh candidate
// produced different keyOf values: the SAME rep appended on every single ingest, and the
// stored concept silently flipped from an unregistered " embeddings" to the real
// `embeddings` — fabricated reps landing on a real FSRS card. Fold first, THEN trim.
const normText = (s) => String(s).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
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

// ---------------------------------------------------------------------------
// THE THREE CLOCKS (organism audit #24, 4 Aug 2026)
// ---------------------------------------------------------------------------
// EVIDENCE: reps_log.jsonl rows 3-6 read 20:28:02.795Z · 20:28:03.795Z ·
// 20:28:04.795Z · 21:58:02.795Z — four reps across ninety minutes sharing one
// millisecond, three of them exactly 1000 ms apart. .claude/skills/forge/SKILL.md
// step 1 tells the model to BUILD the array including `ts`; this file only ever
// asked that the string PARSE. So the ledger's spine was a plausible fiction.
//
//   ts_claimed  — what the author wrote, normalized to ISO. Never destroyed.
//   observed_at — the instant CAPTURE saw the rep. A fact this process owns.
//                 null on rows written before this amendment: we do not know when
//                 they arrived, and inventing a stamp would be the exact lie the
//                 amendment exists to end.
//   ts          — the best available instant. Every consumer keeps reading this.
//
// WHY `ts` IS NOT BLINDLY observed_at. The arrival clock is an UPPER BOUND on when
// the rep happened, not the event time: a FORGE session runs 20:00–22:00 and the
// whole array lands in one paste at 22:30, and a Colab export pulled the next
// morning arrives ~12 hours after the reps it carries. Overwriting `ts` with the
// arrival instant would move those reps to the WRONG CALENDAR DAY and silently
// break every organ that keys on the captain's midnight — scorer's repsOnDate,
// touchline's repsToday (touchline.mjs:397), learning_state's last_seen. So the
// claim is preferred while it is CONSISTENT with the observation, and the
// observation wins where the claim is impossible: a rep cannot have happened after
// it arrived. That is a fact-check, not a guess, and it needs no threshold.
//
// The distortion #24 actually costs — FSRS replaying a burst as N zero-elapsed
// reviews — is fixed where it lives, in fsrs.mjs's live replay path, against
// FSRS's own scheduling resolution. capture's job is to stop LOSING the evidence.
function resolveClocks(o, opts) {
  const tsMs = Date.parse(o.ts);
  if (Number.isNaN(tsMs)) return null;
  const iso = (ms) => new Date(ms).toISOString();
  const parseIso = (v) => {
    if (typeof v !== "string" || v.trim() === "") return null;
    const ms = Date.parse(v);
    return Number.isNaN(ms) ? null : iso(ms);
  };
  // IDEMPOTENCE IS LOAD-BEARING (the same law normText obeys, and for the same
  // reason): loadReps re-validates every line already on disk, so a second pass
  // over a stored rep must return the identical object or the dedupe key splits
  // and the rep re-appends forever. A stored observed_at / ts_claimed therefore
  // always WINS over anything the caller offers.
  const observed_at = parseIso(o.observed_at) || parseIso(opts && opts.observedAt) || null;
  const ts_claimed = parseIso(o.ts_claimed) || iso(tsMs);
  let ts = ts_claimed, ts_source = "claimed";
  if (observed_at && Date.parse(ts_claimed) > Date.parse(observed_at)) {
    ts = observed_at;                       // impossible claim → the fact wins
    ts_source = "observed(claim_after_arrival)";
  }
  return { ts, ts_claimed, observed_at, ts_source };
}

// opts.observedAt — the arrival instant, supplied ONLY by ingest (which is the one
// place a rep genuinely arrives). loadReps deliberately passes nothing, so
// re-reading the log can never restamp history as "arrived now".
function validateRep(o, reg = EMPTY_REG, opts = {}) {
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
  const clocks = resolveClocks(o, opts);
  if (!clocks) return { ok: false, error: `ts not a parseable date (${o.ts})` };
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
    ts: clocks.ts, surface: o.surface, track: o.track, concept: canonical,
    axis: o.axis, question: o.question, confidence: o.confidence, correct: o.correct,
    latency_ms, aided, unregistered, confused_with, edge,
    // THE THREE CLOCKS (#24) — additive; `ts` above keeps its meaning for every
    // existing consumer, and the provenance now rides beside it instead of being lost.
    ts_claimed: clocks.ts_claimed, observed_at: clocks.observed_at, ts_source: clocks.ts_source,
  };
  if (o.note !== undefined) rep.note = o.note;
  return { ok: true, rep };
}

// DEDUP KEY (audit 30 Jul 2026): was [ts, question] only. A FORGE session logs many
// reps in one burst, and its most common question text is literally "Bolo." — so two
// reps on DIFFERENT concepts sharing a rounded/reused ts collapsed into one and the
// second was silently counted as a duplicate. concept+axis are what make a rep a
// distinct measurement, so they belong in its identity.
// FROZEN (layering law) — the pre-#24 identity, verbatim. Kept because it is the
// identity every row currently on disk was written under, and because a future
// reader comparing the two must be able to see exactly what changed.
const keyOfLegacy = (r) => JSON.stringify([r.ts, r.concept, r.axis ?? null, r.question]);

// PLAN OF RECORD (#24, 4 Aug 2026): the identity rides ts_CLAIMED, not ts.
// `ts` may now be corrected toward the observed arrival clock, and observed_at is
// stamped fresh on every arrival — so keying on `ts` would make the SAME rep
// pasted twice look like two different reps the moment a correction fired. The
// author's claim is the only clock that is stable across re-ingests. For every row
// written before this amendment ts_claimed is derived from ts, so the two keys are
// byte-identical on the existing log and no rep is orphaned.
const keyOf = (r) => JSON.stringify([r.ts_claimed ?? r.ts, r.concept, r.axis ?? null, r.question]);

// load existing reps (defensive: skip unparseable lines; missing file = empty)
// `stats` is an optional out-param: a dropped line used to be invisible at every
// call site, so a half-written or hand-mangled reps_log silently shrank the corpus
// every consumer reasoned from. Callers that don't care pass nothing. (audit 30 Jul 2026)
function loadReps(path, reg = EMPTY_REG, stats = {}) {
  stats.skipped = 0;
  stats.skipped_reasons = [];
  stats.skipped_lines = [];        // the RAW text, so it can be rescued before a rewrite
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    let o;
    try { o = JSON.parse(s); }
    catch { stats.skipped++; stats.skipped_reasons.push("unparseable JSON line"); stats.skipped_lines.push(s); continue; }
    const v = validateRep(o, reg);
    if (v.ok) out.push(v.rep);
    else { stats.skipped++; stats.skipped_reasons.push(v.error); stats.skipped_lines.push(s); }
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
// RENAME RETRY (research 31 Jul 2026). Nineteen other scripts read reps_log.jsonl
// with a plain readFileSync and no lock. On Windows a rename over a path another
// process holds open fails with EPERM/EACCES/EBUSY — and this is the LAST step of
// an ingest, so the throw lands after the merge and destroys the WHOLE batch. A
// study session's reps are the one thing in this repo that cannot be regenerated.
// A bounded retry costs at most 75ms and turns a race into a non-event.
const RENAME_TRIES = 3, RENAME_RETRY_MS = 25;
const RENAME_RETRY_CODES = new Set(["EPERM", "EACCES", "EBUSY"]);
function writeAtomic(path, reps) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${++tmpSeq}.${Date.now().toString(36)}.tmp`;
  try {
    writeFileSync(tmp, reps.map((r) => JSON.stringify(r)).join("\n") + (reps.length ? "\n" : ""));
    let lastErr = null;
    for (let attempt = 1; attempt <= RENAME_TRIES; attempt++) {
      try { renameSync(tmp, path); lastErr = null; break; }
      catch (e) {
        lastErr = e;
        if (!RENAME_RETRY_CODES.has(e && e.code) || attempt === RENAME_TRIES) break;
        sleepSync(RENAME_RETRY_MS);   // declared below; ESM hoists the fn, and this runs later
      }
    }
    if (lastErr) throw lastErr;
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
// opts.observedAt (#24): the arrival instant stamped on THIS batch. Defaulted here
// rather than per-rep so every rep in one paste/pull shares one honest arrival
// stamp — they did arrive together. Injectable so the selftest can drive it.
function ingestUnlocked(path, candidates, reg = EMPTY_REG, opts = {}) {
  const observedAt = (typeof opts.observedAt === "string" && !Number.isNaN(Date.parse(opts.observedAt)))
    ? new Date(Date.parse(opts.observedAt)).toISOString()
    : new Date().toISOString();
  const loadStats = {};
  const existing = loadReps(path, reg, loadStats);
  const seen = new Set(existing.map(keyOf));
  const toAppend = [];
  let rejected = 0, duplicates = 0;
  const errors = [];
  // UNREGISTERED SURFACE (audit 30 Jul 2026): capture has always SET unregistered:true
  // on an unknown concept, but nothing anywhere read it — so a phantom topic (a typo, or
  // a syllabus concept never added to concepts.json) grew its own FSRS cards and nemesis
  // entries in total silence. It is counted and named at the call site now.
  const unregistered = [];
  for (const c of candidates) {
    const v = validateRep(c, reg, { observedAt });
    if (!v.ok) { rejected++; errors.push(v.error); continue; }
    const k = keyOf(v.rep);
    if (seen.has(k)) { duplicates++; continue; }
    if (v.rep.unregistered) unregistered.push(v.rep.concept);
    seen.add(k); toAppend.push(v.rep);
  }
  // QUARANTINE BEFORE REWRITE (regression audit, 30 Jul 2026). writeAtomic rewrites the
  // file from `existing`, which holds ONLY the lines that validated — so every unreadable
  // line was silently DELETED by the next successful ingest. (That data loss predates the
  // audit; what the first fix added was a warning that said the opposite, telling him to
  // "inspect it" at the exact moment the text stopped existing.) Nothing is destroyed now:
  // the raw text is appended to a sibling quarantine file first, and only then do we rewrite.
  let quarantined = 0;
  if (toAppend.length && loadStats.skipped) {
    try {
      appendFileSync(path + ".quarantine.jsonl",
        loadStats.skipped_lines.map((l) => l + "\n").join(""), "utf8");
      quarantined = loadStats.skipped_lines.length;
    } catch { /* quarantine is a courtesy, never a reason to lose the good reps */ }
  }
  if (toAppend.length) writeAtomic(path, existing.concat(toAppend));
  // #24 HONESTY COUNTER: an authored timestamp is not a measurement, and the human
  // reading `appended 7` deserves to know which clock those seven rode in on.
  const ts_corrected = toAppend.filter((r) => r.ts_source !== "claimed").length;
  return {
    appended: toAppend.length, rejected, duplicates,
    total: existing.length + toAppend.length, errors,
    observed_at: observedAt, ts_corrected,
    unregistered: [...new Set(unregistered)],
    skipped_existing: loadStats.skipped || 0,
    skipped_reasons: [...new Set(loadStats.skipped_reasons || [])],
    quarantined, quarantine_path: quarantined ? path + ".quarantine.jsonl" : null,
  };
}

// the plan of record: the same ingest, with the read-modify-rewrite window held
// under the writer lock so a concurrent paste/pull can't overwrite the other's reps.
// (opts carries lock tuning — selftest uses it to age a lock out instantly, callers
//  in production pass nothing and get the LOCK_* defaults — and, since #24,
//  observedAt, which the selftest injects to drive the arrival clock deterministically.)
function ingest(path, candidates, reg = EMPTY_REG, opts = {}) {
  return withRepsLock(path, () => ingestUnlocked(path, candidates, reg, opts), opts);
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
  let pulled = 0, rejected = 0, duplicates = 0, failed = 0, quarantined = 0, quarantinePath = null, ts_corrected = 0;
  const failures = [];
  const unregistered = [];
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
      // The unattended lane must carry the same two warnings the interactive one does —
      // CapturePull runs 14×/day with nobody watching, and it was the ONLY lane that
      // stayed mute about a phantom concept or a quarantined line. (regression audit 30 Jul)
      for (const u of r.unregistered || []) unregistered.push(u);
      ts_corrected += r.ts_corrected || 0;                       // #24 — carried into the unattended lane too
      quarantined += r.quarantined || 0;
      if (r.quarantine_path) quarantinePath = r.quarantine_path;
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
  const uniqUnreg = [...new Set(unregistered)];
  const note = `pulled ${pulled} from ${files.length - failed} file(s)`
    + (failed ? `; ${failed} file(s) FAILED and stay in the inbox: ${failures.slice(0, 5).join("; ")}` : "")
    + (uniqUnreg.length ? `; ⚠ UNREGISTERED concept(s) coined: ${uniqUnreg.join(", ")} — add them to concepts.json` : "")
    + (ts_corrected ? `; ⚠ ${ts_corrected} rep(s) claimed a ts AFTER arrival — corrected to the observed clock` : "")
    + (quarantined ? `; ⚠ ${quarantined} unreadable reps_log line(s) moved to ${quarantinePath}` : "");
  return { pulled, files: files.length, rejected, duplicates, failed, failures, unregistered: uniqUnreg, ts_corrected, quarantined, quarantine_path: quarantinePath, wired: true, note };
}

// ---------------------------------------------------------------------------
// THE HEARTBEAT CHAIN (organism audit #25, 4 Aug 2026)
// ---------------------------------------------------------------------------
// ArsenalFC-CapturePull runs `capture.mjs pull` at 09:00 repeating hourly (14 fires
// a day). ArsenalFC-FSRS / Calibration / Nemesis / LearningState run ONCE, at
// 08:40–08:44. So a rep that landed from Colab at 14:00 was really ingested — the
// live readers (scorer, touchline, dugout) saw it that evening — but every DERIVED
// organ (cards.json, calibration.json, nemesis, learning_state.json) kept yesterday's
// answer until 08:39 the next morning. The paste lane never had this hole: the
// forge skill chains `capture.mjs paste` → `heartbeat.mjs` by hand, and
// turnstile.mjs:175 execFiles heartbeat the moment the clipboard gate ingests.
// The pull lane simply never got the same wire.
//
// TWO THINGS THIS MUST NOT DO, and how each is prevented:
//   1. RECURSE. heartbeat_config.json's order runs `capture.mjs pull` FIRST, so a
//      naive chain is capture → heartbeat → capture → heartbeat. Broken two ways at
//      once: we pass heartbeat's own `--skip=capture` (heartbeat.mjs:456-463), and we
//      export ARSENAL_CAPTURE_CHAINED=1 so any capture inside the chained beat
//      refuses to chain again. Either alone terminates it; both, and it cannot start.
//   2. FIRE ON A QUIET PULL. The chain is gated on `pulled > 0`. Thirteen of the
//      fourteen daily pulls find an empty inbox and cost exactly nothing — the 08:39
//      beat's own capture step is unchanged unless reps genuinely arrived.
const CHAIN_ENV = "ARSENAL_CAPTURE_CHAINED";
const HEARTBEAT_CFG = join(STATE_DIR, "heartbeat_config.json");

// NOT GUESSED. heartbeat caps EACH organ at heartbeat_config.timeout_ms and runs
// them strictly in sequence (heartbeat.mjs:462-464), so the beat's own worst case is
// exactly timeout_ms × (number of organs). We borrow heartbeat's contract instead of
// inventing a ceiling. If the config is unreadable we pass NO timeout at all rather
// than pick a number: heartbeat already bounds every child it spawns, so the honest
// answer is "let the organ that owns the bound enforce it".
function chainTimeoutMs(cfgPath = HEARTBEAT_CFG) {
  try {
    const j = JSON.parse(readFileSync(cfgPath, "utf8"));
    const n = Array.isArray(j.order) ? j.order.filter((e) => e && typeof e === "object" && typeof e.script === "string").length : 0;
    const t = Number.isFinite(j.timeout_ms) ? j.timeout_ms : 0;
    if (n > 0 && t > 0) return n * t;              // e.g. 8 organs × 120000 ms = 960000 ms
  } catch { /* unreadable canon → no ceiling of our own (see above) */ }
  return null;
}

// Returns a REPORT, never throws: a failed recompute must not turn a successful
// ingest into a non-zero exit. The reps are already on disk by the time we get here.
function chainHeartbeat({ reason, scriptsDir = __dirname, exec = execFileSync, env = process.env } = {}) {
  if (env[CHAIN_ENV] === "1") return { ran: false, why: "already inside a chained heartbeat (no recursion)" };
  const hb = join(scriptsDir, "heartbeat.mjs");
  if (!existsSync(hb)) return { ran: false, why: `heartbeat.mjs not found at ${hb}` };
  const timeout = chainTimeoutMs();
  const t0 = Date.now();
  try {
    exec(process.execPath, [hb, "run", "--skip=capture"], {
      stdio: "pipe", windowsHide: true,
      env: { ...env, [CHAIN_ENV]: "1" },
      ...(timeout ? { timeout } : {}),
    });
    return { ran: true, ms: Date.now() - t0, why: reason, timeout_ms: timeout };
  } catch (e) {
    return { ran: false, ms: Date.now() - t0, why: `heartbeat FAILED (${(e && e.code) || (e && e.status) || "error"}) — the reps ARE captured; derived state is stale until the next beat` };
  }
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
  assert("UNREGISTERED IS NAMED, not just flagged (the count had no consumer before)",
    Array.isArray(ur.unregistered) && ur.unregistered.includes("brand new concept") && nr.unregistered.length === 1);

  // ---- audit 30 Jul 2026 ----
  // SNAKE_CASE ↔ PROSE: ids are snake_case, reps are prose. They must meet.
  const snakePath = join(dir, "concepts_snake.json");
  writeFileSync(snakePath, JSON.stringify({
    version: 1, axes: {},
    concepts: { tool_use: { aliases: [] }, vector_search: { aliases: ["top-k sampling"] } },
    skills: { python_basics: { aliases: [] } },
  }));
  const snakeReg = loadRegistry(snakePath);
  assert("snake_case id resolves from its prose spelling ('tool use' → tool_use)",
    canonicalize("tool use", "concept", snakeReg).canonical === "tool_use"
    && canonicalize("Tool  Use", "concept", snakeReg).unregistered === false);
  assert("hyphens fold too, and the skill map is folded the same way",
    canonicalize("VECTOR-SEARCH", "concept", snakeReg).canonical === "vector_search"
    && canonicalize("python basics", "skill", snakeReg).canonical === "python_basics");
  assert("a genuinely unknown concept is still unregistered (folding ≠ matching anything)",
    canonicalize("quantum tunnelling", "concept", snakeReg).unregistered === true);
  // IDEMPOTENCE is the load-bearing property, not prettiness: loadReps re-canonicalises
  // every existing line, so canonicalize(canonicalize(x)) !== canonicalize(x) means the
  // same rep re-appends on every ingest, forever. A markdown bullet leaking into a concept
  // string ("- embeddings") is the realistic way that happens.
  const idem = (raw, track = "concept") => {
    const once = canonicalize(raw, track, snakeReg).canonical;
    return once === canonicalize(once, track, snakeReg).canonical;
  };
  assert("IDEMPOTENT — edge separators cannot survive one pass",
    ["- embeddings", "embeddings-", "_tool_use_", "  tool--use  ", "-", "tool_use"].every((s) => idem(s)));
  assert("a leading-separator concept does not re-append on every ingest (the C1 regression)",
    (() => {
      const pe = join(dir, "reps_edge.jsonl"); if (existsSync(pe)) rmSync(pe);
      const edge = { ts: "2026-07-11T14:00:00Z", surface: "gem", track: "concept", concept: "- forge locks", axis: "a", question: "edge", confidence: "knew", correct: true };
      const a = ingest(pe, [edge], reg), b = ingest(pe, [edge], reg), c = ingest(pe, [edge], reg);
      return a.appended === 1 && b.appended === 0 && c.appended === 0 && b.duplicates === 1;
    })());

  // DEDUP IDENTITY: a rep is (ts, concept, axis, question) — a FORGE burst logs many
  // reps whose question is literally "Bolo." on different concepts and axes.
  const pk = join(dir, "reps_key.jsonl"); if (existsSync(pk)) rmSync(pk);
  const boloTs = "2026-07-11T12:00:00Z";
  const bolo = (concept, axis) => ({ ts: boloTs, surface: "gem", track: "concept", concept, axis, question: "Bolo.", confidence: "knew", correct: true });
  const k1 = ingest(pk, [bolo("tokenization", "a"), bolo("tokenization", "b"), bolo("pydantic-ish", "a")], reg);
  assert("same ts + same question on DIFFERENT axis/concept are distinct reps (were 2 silent dupes)",
    k1.appended === 3 && k1.duplicates === 0);
  const k2 = ingest(pk, [bolo("tokenization", "a")], reg);
  assert("a truly identical rep is STILL a duplicate (dedup did not just get weaker)",
    k2.appended === 0 && k2.duplicates === 1);

  // A CORRUPT EXISTING LINE IS COUNTED, NOT SWALLOWED
  const pc = join(dir, "reps_corrupt.jsonl"); if (existsSync(pc)) rmSync(pc);
  writeFileSync(pc, JSON.stringify(rep({ ts: "2026-07-11T13:00:00Z", question: "good" })) + "\n{ truncated json\n");
  const cr = ingest(pc, [rep({ ts: "2026-07-11T13:01:00Z", question: "next" })], reg);
  assert("an unreadable existing line is REPORTED (every consumer silently shrank the corpus before)",
    cr.skipped_existing === 1 && cr.skipped_reasons.length === 1);

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

  // CONCURRENT READER (31 Jul 2026). Nineteen scripts read reps_log with no lock,
  // and on Windows a rename over a path another process holds open fails EPERM —
  // a throw that lands AFTER the merge, at the last step of an ingest.
  //
  // WHAT THE RETRY ACTUALLY BUYS, stated honestly: real readers do readFileSync,
  // which holds the handle for microseconds, so the overlap is TRANSIENT and three
  // bounded attempts across ~75ms clear it. A handle held for the WHOLE operation
  // (measured here, and it genuinely still fails) cannot be renamed over by anyone,
  // and no amount of retrying changes that. So the guarantee this pins is not "the
  // write always succeeds" — it is "a failure NEVER costs data": the throw is
  // catchable, the ORIGINAL file is byte-intact, no orphan temp is left, and the
  // caller (paste) turns it into a clean 're-run the same command' refusal instead
  // of an uncaught stack trace that reads like the reps are gone.
  const conc = join(dir, "concurrent.jsonl");
  const concBefore = JSON.stringify(rep({ ts: "2026-07-12T09:00:00Z", question: "held_open_first" })) + "\n";
  writeFileSync(conc, concBefore);
  let fd = null, concThrew = false, concErr = null;
  try {
    fd = openSync(conc, "r");                                    // a reader holding it open for the whole call
    try { ingest(conc, [rep({ ts: "2026-07-12T09:01:00Z", question: "held_open_second" })], reg); }
    catch (e) { concThrew = true; concErr = e; }
  } finally { if (fd !== null) { try { closeSync(fd); } catch { /* nothing to salvage */ } } }
  const concOrphans = readdirSync(dir).filter((f) => f.startsWith("concurrent.jsonl.") && f.endsWith(".tmp"));
  assert("CONCURRENT READER: a rename blocked by a held handle throws CATCHABLY and costs NO data (original intact, no orphan temp)",
    concThrew && RENAME_RETRY_CODES.has(concErr && concErr.code)
    && readFileSync(conc, "utf8") === concBefore && concOrphans.length === 0);
  // and once the reader lets go, the very same ingest lands — which is exactly what
  // the paste refusal tells him to do ("re-run the same command").
  const concRetry = ingest(conc, [rep({ ts: "2026-07-12T09:01:00Z", question: "held_open_second" })], reg);
  assert("CONCURRENT READER: re-running after the handle is released ingests normally — the reps were never lost",
    concRetry.appended === 1 && readFileSync(conc, "utf8").trim().split("\n").filter(Boolean).length === 2);

  // --- ORGANISM AUDIT #24 (4 Aug 2026): THE OBSERVED ARRIVAL CLOCK -----------
  // The live log's rows 3-6 span 90 minutes and share the millisecond `.795`.
  // capture could not tell an authored timestamp from a measured one, because it
  // never took a measurement of its own.
  {
    const pc24 = join(dir, "reps_clocks.jsonl"); if (existsSync(pc24)) rmSync(pc24);
    const ARRIVED = "2026-07-31T23:00:00.000Z";
    const findIn = (path, q) => loadReps(path, reg).find((r) => r.question === q);

    ingest(pc24, [rep({ ts: "2026-07-31T20:28:02.795Z", question: "c1" })], reg, { observedAt: ARRIVED });
    const c1 = findIn(pc24, "c1");
    assert("#24 THE THREE CLOCKS — the author's claim is kept verbatim AND an arrival stamp capture owns is added",
      c1.ts_claimed === "2026-07-31T20:28:02.795Z" && c1.observed_at === ARRIVED && c1.ts === c1.ts_claimed && c1.ts_source === "claimed");

    // an IMPOSSIBLE claim (a rep cannot happen after it arrived) loses to the fact.
    // No threshold is involved — this is a fact-check, not a tolerance.
    ingest(pc24, [rep({ ts: "2026-08-05T09:00:00.000Z", question: "c2" })], reg, { observedAt: ARRIVED });
    const c2 = findIn(pc24, "c2");
    assert("#24 an impossible claim (ts AFTER arrival) is CORRECTED to the observed clock, claim still stored",
      c2.ts === ARRIVED && c2.ts_source === "observed(claim_after_arrival)" && c2.ts_claimed === "2026-08-05T09:00:00.000Z");

    // ...and the correction is COUNTED where a human is looking.
    const cr24 = ingest(pc24, [rep({ ts: "2026-08-06T09:00:00.000Z", question: "c3" })], reg, { observedAt: ARRIVED });
    assert("#24 the correction is counted in the ingest report (never a silent rewrite)", cr24.ts_corrected === 1 && cr24.observed_at === ARRIVED);

    // IDEMPOTENCE — re-reading the log must not restamp history as "arrived now",
    // and must not split the dedupe key. This is the property that makes the
    // amendment safe: loadReps re-validates EVERY line on every ingest.
    const before24 = loadReps(pc24, reg);
    const again24 = ingest(pc24, [rep({ ts: "2026-07-31T20:28:02.795Z", question: "c1" })], reg, { observedAt: "2026-08-04T12:00:00.000Z" });
    const after24 = loadReps(pc24, reg);
    assert("#24 IDEMPOTENT — a stored rep keeps its own arrival stamp on reload, and re-ingesting it is still a duplicate",
      again24.appended === 0 && again24.duplicates === 1
      && after24.length === before24.length
      && findIn(pc24, "c1").observed_at === ARRIVED
      && JSON.stringify(after24) === JSON.stringify(before24));

    // a row written BEFORE this amendment has no arrival stamp — and we say so
    // rather than inventing one. An unmeasured silence is never a measured zero.
    const pLegacy = join(dir, "reps_legacy.jsonl"); if (existsSync(pLegacy)) rmSync(pLegacy);
    writeFileSync(pLegacy, JSON.stringify({ ts: "2026-07-30T20:28:02.795Z", surface: "gem", track: "concept", concept: "tokenization", axis: "a", question: "old", confidence: "knew", correct: true }) + "\n");
    const old = loadReps(pLegacy, reg)[0];
    assert("#24 a pre-amendment row reads observed_at:null (we do NOT know when it arrived) and ts_claimed backfills from ts",
      old.observed_at === null && old.ts_claimed === "2026-07-30T20:28:02.795Z" && old.ts === old.ts_claimed);

    // and its identity is UNCHANGED, so no existing rep is orphaned by the new key
    assert("#24 the new identity is byte-identical to the frozen legacy one on a pre-amendment row",
      keyOf(old) === keyOfLegacy(old));

    // one paste = one arrival instant. The reps really did arrive together; three
    // different stamps a millisecond apart would be the same fiction in a new place.
    const burst = ingest(pc24, [
      rep({ ts: "2026-07-31T20:28:02.795Z", question: "b1", axis: "a" }),
      rep({ ts: "2026-07-31T20:28:03.795Z", question: "b2", axis: "c" }),
      rep({ ts: "2026-07-31T20:28:04.795Z", question: "b3", axis: "e" }),
    ], reg, { observedAt: ARRIVED });
    const stamps = ["b1", "b2", "b3"].map((q) => findIn(pc24, q).observed_at);
    assert("#24 one batch = ONE arrival instant (the burst arrived together; it did not arrive 1000ms apart)",
      burst.appended === 3 && new Set(stamps).size === 1 && stamps[0] === ARRIVED);
  }

  // --- ORGANISM AUDIT #25 (4 Aug 2026): THE HEARTBEAT CHAIN -----------------
  {
    const calls = [];
    const fakeExec = (bin, argv, opts) => { calls.push({ bin, argv, env: opts && opts.env }); return ""; };
    const c = chainHeartbeat({ reason: "test", scriptsDir: __dirname, exec: fakeExec, env: {} });
    assert("#25 the chain shells heartbeat.mjs with heartbeat's OWN --skip=capture (recursion cannot start)",
      c.ran === true && calls.length === 1 && calls[0].argv[0].endsWith("heartbeat.mjs") && calls[0].argv.includes("--skip=capture"));
    assert("#25 the chained child is marked, so a capture inside the beat refuses to chain again",
      calls[0].env[CHAIN_ENV] === "1"
      && chainHeartbeat({ reason: "t", exec: fakeExec, env: { [CHAIN_ENV]: "1" } }).ran === false
      && calls.length === 1);
    // a failed recompute must never turn a successful ingest into a failure —
    // the reps are already on disk by the time the chain runs.
    const boom = chainHeartbeat({ reason: "t", scriptsDir: __dirname, env: {}, exec: () => { const e = new Error("x"); e.code = "ETIMEDOUT"; throw e; } });
    assert("#25 a failed heartbeat is REPORTED, never thrown — and it says the reps are safe",
      boom.ran === false && /ETIMEDOUT/.test(boom.why) && /reps ARE captured/.test(boom.why));
    // the timeout is DERIVED from heartbeat's own contract, never picked
    const tcfg = join(dir, "hb_cfg.json");
    writeFileSync(tcfg, JSON.stringify({ order: [{ name: "a", script: "a.mjs" }, { name: "b", script: "b.mjs" }, { name: "c", script: "c.mjs" }], timeout_ms: 1000 }));
    assert("#25 the chain ceiling is heartbeat's own timeout_ms × its own organ count (3 × 1000), not a number we chose",
      chainTimeoutMs(tcfg) === 3000 && chainTimeoutMs(join(dir, "__no_hb_cfg__")) === null);
  }

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
  const flags = process.argv.slice(3).filter((a) => a.startsWith("--"));
  const wantsChain = flags.includes("--chain");
  const noChain = flags.includes("--no-chain");

  if (mode === "paste") {
    const fileArg = process.argv.slice(3).find((a) => !a.startsWith("--"));
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
    // A CLEAN REFUSAL, NEVER A STACK TRACE (31 Jul 2026). If the ingest throws —
    // a held file, a full disk — the captain must be told his reps are recoverable
    // by re-running, not shown a Node traceback that reads like the data is gone.
    let r;
    try { r = ingest(REPS_LOG, cands, reg); }
    catch (e) {
      console.error(`paste: FAILED — nothing was ingested (${(e && e.code) || "error"}: ${(e && e.message) || e}).`);
      console.error("paste:   Your reps are NOT lost: re-run the same command. If it repeats, another process is holding reps_log open.");
      process.exit(1);
    }
    console.log(`paste: appended ${r.appended}, rejected ${r.rejected}, duplicates ${r.duplicates} → ${REPS_LOG} (total ${r.total})`);
    // The two silences the 30 Jul audit found: an unknown concept, and a dropped line.
    // Both are now LOUD at the one place a human is looking.
    if (r.unregistered && r.unregistered.length) {
      console.log(`paste: ⚠ UNREGISTERED concept(s): ${r.unregistered.join(", ")} — these coined phantom topics.`);
      console.log(`paste:   add them to dressing-room/state/concepts.json (hand-curated canon — the captain's call), then reps retro-register on next load.`);
    }
    if (r.skipped_existing) {
      console.log(`paste: ⚠ ${r.skipped_existing} EXISTING line(s) in reps_log could not be read: ${r.skipped_reasons.join(" · ")}`);
      console.log(r.quarantined
        ? `paste:   their raw text was saved to ${r.quarantine_path} before the rewrite — they are NOT in reps_log any more. Inspect that file.`
        : `paste:   nothing was rewritten this run, so they are still in reps_log. Inspect it before the next successful ingest.`);
    }
    if (r.ts_corrected) console.log(`paste: ⚠ ${r.ts_corrected} rep(s) claimed a timestamp AFTER they arrived — ts corrected to the observed clock (ts_claimed keeps the original).`);
    if (r.errors.length) console.log(`  rejected reasons: ${r.errors.slice(0, 10).join("; ")}`);
    // #26 — the paste lane's recompute. OPT-IN, and that is deliberate: the forge
    // skill (SKILL.md step 2) and turnstile.mjs:175 already chain heartbeat right
    // after their paste, and dugout.mjs:1143 shells this synchronously on every
    // voice log_reps call — an unconditional blocking beat there would stall the
    // live voice surface, and two heartbeats racing would have two fsrs processes
    // renaming the same fixed `cards.json.tmp`. So: pass --chain and you get it now;
    // don't, and the exit line SAYS what is stale instead of implying it is fresh.
    if (r.appended > 0) {
      if (wantsChain) {
        const c = chainHeartbeat({ reason: `paste appended ${r.appended}` });
        console.log(c.ran
          ? `paste: heartbeat chained (${c.ms}ms) — cards/calibration/nemesis/learning_state now reflect these reps.`
          : `paste: heartbeat NOT chained — ${c.why}`);
      } else {
        console.log("paste: derived state (cards · calibration · nemesis · learning_state) does NOT yet include these reps — run `node scripts/heartbeat.mjs`, or re-run this with --chain.");
      }
    }
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
    // #25 — THE FIX. A rep pulled at 14:00 used to leave every derived organ on
    // yesterday's answer until 08:39 tomorrow. Now the pull that actually brought
    // reps in triggers the same ordered recompute the morning beat runs.
    if (r.pulled > 0 && !noChain) {
      const c = chainHeartbeat({ reason: `pull ingested ${r.pulled}` });
      console.log(c.ran
        ? `pull: heartbeat chained (${c.ms}ms) — cards/calibration/nemesis/learning_state reflect these reps now, not at 08:39 tomorrow.`
        : `pull: heartbeat NOT chained — ${c.why}`);
    }
    process.exit(0);
  }

  console.log("THE SHARED CAPTURE LAYER (Agent #0)\n  node capture.mjs paste [file] [--chain]   append pasted Gem/Colab session JSON (--chain: recompute derived state now)\n  node capture.mjs pull [--no-chain]        ingest new reps from the Drive inbox (chains the heartbeat when reps land)\n  node capture.mjs selftest                 run baked-mock checks");
  process.exit(0);
}

// Windows-safe entry guard (normalise argv[1] to a file:// URL, like timeaudit.mjs)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { validateRep, ingest, loadReps, pullFromInbox, keyOf, keyOfLegacy, loadRegistry, canonicalize, resolveClocks, chainHeartbeat, chainTimeoutMs };
