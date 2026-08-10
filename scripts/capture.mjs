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
//   READS it (single-writer preserved). Missing or UNREADABLE registry = still logs,
//   no crash — but it JUDGES NOTHING: `unregistered` reads null (unknown), history on
//   disk is never re-canonicalized, and a captain's card is filed. See THE REGISTRY
//   GATE (10 Aug 2026) below; before it, a single trailing comma in the canon rewrote
//   every stored concept id into a phantom twin.
//
// MODES: paste [file] · rep · pull · quarantine [retry] · selftest
//   quarantine (10 Aug 2026) is the READ end of reps_log.jsonl.quarantine.jsonl —
//   the sidecar this file has written since 30 Jul and NOTHING in the organism read.
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
// P6.1 (full-organism audit, 7 Aug 2026) — the Gemini surface's OUTCOME ledger.
// One JSON line per pasted batch: measured stats, judged by NOBODY until there is
// 30-45d of real data (his standing rule). capture.mjs is its single writer.
const GEMINI_QUALITY = join(STATE_DIR, "gemini_quality.jsonl");
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
// `error` (10 Aug 2026, THE REGISTRY GATE below) — WHY it did not load. `loaded:false`
// alone cannot tell "canon is missing" from "canon is unreadable", and the two need
// different words from the captain. Additive: the two importers read only `.loaded`
// (presence.mjs:632 · thalamus.mjs:585) and are untouched by it.
const EMPTY_REG = { conceptAlias: new Map(), skillAlias: new Map(), loaded: false, error: null };

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
    // malformed registry → treat as empty (empty-safe), but SAY why. The gate below
    // is what stops "empty" from being read as "this concept does not exist".
    reg.error = `concepts.json unreadable: ${String((e && e.message) || e).split("\n")[0].slice(0, 160)}`;
  }
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
// THE REGISTRY GATE (wiring audit, 10 Aug 2026 — his "make sure everything in the
// entire organism is connected to everywhere where it is required")
// ---------------------------------------------------------------------------
// loadRegistry has SET `loaded` since v2 (:123) and this file — the registry's OWNER —
// never read it. All three occurrences were writes. Both IMPORTERS gate on it
// (presence.mjs:632 `if (!reg || !reg.loaded) return null`, thalamus.mjs:585 falls back
// to the raw token) and nemesis.mjs:314 passes its own `reg.loaded` into analyzeTopic.
// The owner was the single organ that read "canon unreadable" as "canon empty".
//
// PROVEN before the repair, on a SANDBOX COPY of the real concepts.json with one
// trailing comma appended (85 concepts → 0):
//   paste ⇒ "⚠ UNREGISTERED concept(s): embeddings — these coined phantom topics.
//            add them to dressing-room/state/concepts.json"
//   …and `embeddings` is IN that file. One typo, and the advice is to add what is
//   already there while the whole hand-curated corpus is orphaned.
//
// The half nobody had seen is worse, and it is why this is a GATE and not a warning:
// loadReps re-validates EVERY line already on disk (:315) and ingestUnlocked then
// rewrites the file from that result (:449). So one trailing comma REWROTE HISTORY.
// Measured on a fixture in the same run:
//   before          ⇒ tool_use unregistered=false · vector_search unregistered=false
//   after ONE ingest ⇒ tool use unregistered=true  · vector search unregistered=true
// Every stored canonical id de-canonicalized ON DISK, permanently. That is precisely
// the fabricated-rep failure the 30 Jul normText audit fought (its own comment, :100)
// arriving through a different door: fsrs cards, nemesis entries and calibration
// topics all key on `concept`, so every real topic silently forks a phantom twin.
//
// THE RULE: a registry that could not be read MAKES NO CLAIM. It does not fold the id,
// it does not assert `unregistered`, and it never edits what is already stored.
//   unregistered === true   the registry was read and does NOT have this concept
//   unregistered === false  the registry was read and DOES
//   unregistered === null   the registry could not be read — WE DO NOT KNOW
// `null` is this file's established vocabulary for an unmeasured value, not a new one:
// `observed_at` is null on pre-#24 rows for the identical reason (:157 — "an unmeasured
// silence is never a measured zero"). It is FALSY, so physio's phantom bleed
// (physio.mjs:372 `.filter(r => r.unregistered)`) correctly stops accusing real
// concepts, and a later healthy load re-derives it — which is the "reps retro-register
// on next load" the paste output has always promised.
//
// The stored string is kept VERBATIM rather than trimmed or folded, because trimming
// is already a judgement and this branch exists to make none. A row written by the
// healthy path is canonical to begin with, so verbatim is exactly what preserves it.

// FROZEN (layering law) — the pre-gate enrichment, verbatim, as it ran from v2 until
// 10 Aug 2026. Kept because every row currently on disk was written by it, and a reader
// comparing the two must be able to see that the ONLY difference is the guard.
const enrichConceptLegacy = (o, reg) => canonicalize(o.concept, o.track, reg);

// PLAN OF RECORD.
function enrichConcept(o, reg) {
  if (!reg || reg.loaded !== true) {
    return {
      canonical: o.concept,
      // carried through, never re-asserted: a row that a HEALTHY registry already
      // judged keeps that judgement. Only an unjudged row reads null.
      unregistered: typeof o.unregistered === "boolean" ? o.unregistered : null,
    };
  }
  return enrichConceptLegacy(o, reg);
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

// THE --correct PARSER (audit #108, 6 Aug 2026). Lives here, next to validateRep,
// because it is the CLI half of the same law: a rep's correctness is either stated
// or the rep does not exist. It returns `undefined` — never a default — for anything
// that is not literally "true"/"false", so the rep then fails validateRep's own
// `typeof o.correct !== "boolean"` gate. The bug this replaces defaulted to `false`,
// which is a valid boolean and therefore invisible to every downstream check.
function parseCorrectFlag(raw) {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).trim().toLowerCase();
  return s === "true" ? true : s === "false" ? false : undefined;
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
    // through the GATE, same as `concept` — an unreadable registry must not rewrite
    // a stored confusion-pair into its own folded spelling either.
    confused_with = enrichConcept({ concept: o.confused_with, track: o.track }, reg).canonical;
  }
  // edge (v3): optional; null or free-text string stored VERBATIM (not canonicalized)
  let edge = null;
  if (o.edge !== undefined && o.edge !== null) {
    if (typeof o.edge !== "string") return { ok: false, error: "edge not string" };
    edge = o.edge;
  }
  if (o.note !== undefined && typeof o.note !== "string") return { ok: false, error: "note not string" };

  // enrich: canonicalize concept + unregistered flag (unknown ⇒ soft, still logged).
  // Through THE REGISTRY GATE since 10 Aug 2026 — an unreadable canon claims nothing.
  const { canonical, unregistered } = enrichConcept(o, reg);
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
    // THE REGISTRY GATE's report half (10 Aug 2026). Without this a caller cannot tell
    // "zero unregistered concepts" from "the registry could not be read, so nothing was
    // checked" — and those are opposite facts. `unregistered` below is EMPTY on a dead
    // registry by construction (the gate stores null, which never enters this array),
    // so the count alone would read as a clean bill of health.
    registry_loaded: !!(reg && reg.loaded),
    registry_error: (reg && reg.error) || null,
    unregistered: [...new Set(unregistered)],
    skipped_existing: loadStats.skipped || 0,
    skipped_reasons: [...new Set(loadStats.skipped_reasons || [])],
    quarantined, quarantine_path: quarantined ? path + ".quarantine.jsonl" : null,
    appended_rows: toAppend,      // P6.1 — the paste lane's quality stats read these
  };
}

// ---------------------------------------------------------------------------
// P6.1 — THE GEMINI SURFACE'S HONEST ANSWER (full-organism audit, 7 Aug 2026;
// AMENDED 9 Aug 2026 by the P7 harvest lane, his 'data flows everywhere' word).
// The 7 Aug text said "permanently impossible — the transcript never arrives".
// That boundary MOVED: since /harvest (scripts/harvest.mjs), a Gem sitting's
// transcript CAN arrive on the afferent bus — but only for the sittings he
// harvests, so transcript-level compliance is measurable exactly as harvested
// and no further. This lane stays what it always was, OUTCOME, not process:
//   1. shape validation at the door (validateRep — ts/gut/axis law, already live),
//   2. THIS: per-batch MEASURED stats, recorded to gemini_quality.jsonl and
//      judged by nobody until 30-45d of real data exists (his standing rule),
//   3. the day's cold Examiner retrieval test — if the teaching was bad, the
//      cold outcome cracks HERE, where the machine can see it.
// The watchman's report measures the harvest lane live every night (§6.2).
// Pure — the selftest drives it with fixtures.
//
// ── FROZEN 10 Aug 2026 (LAYERING law) ──────────────────────────────────────
// This is the 7 Aug engine VERBATIM, kept under a *Legacy name exactly as
// hippocampus.identityCartridgeLegacy / dugout.capsuleProjectionLegacy /
// fsrs.buildStoreLegacy are kept. Why it stays: the two wired readers
// (scout.mjs attachGemini · watchman.mjs c11) were written against THIS row
// shape, and a 30-45d review must be able to re-derive a row with the code that
// would have written it. No migration was needed — the ledger had never been
// written even once (that is the defect the plan of record below repairs), so
// there is not a single legacy row on disk. The plan of record is
// geminiBatchStats.
export function geminiBatchStatsLegacy(rows, observedAt = null) {
  const n = (Array.isArray(rows) ? rows : []).length;
  if (!n) return null;
  const by = (f) => rows.reduce((o, r) => { const k = String(r[f]); o[k] = (o[k] || 0) + 1; return o; }, {});
  const tss = rows.map((r) => Date.parse(r.ts)).filter(Number.isFinite);
  return {
    at: observedAt || new Date().toISOString(),
    n,
    surfaces: by("surface"),
    tracks: by("track"),
    concepts: [...new Set(rows.map((r) => r.concept))],
    axes: [...new Set(rows.map((r) => r.axis).filter(Boolean))].sort(),
    confidence_mix: by("confidence"),
    correct_rate: +(rows.filter((r) => r.correct === true).length / n).toFixed(2),
    // measured, never judged: a batch that is 100% knew-correct is RECORDED here —
    // whether that is mastery or a surface that never commits a real gut-word is a
    // 30-45d question, not this line's.
    all_knew_correct: rows.every((r) => r.confidence === "knew" && r.correct === true),
    ts_span_min: tss.length >= 2 ? Math.round((Math.max(...tss) - Math.min(...tss)) / 60000) : 0,
  };
}

// ── THE PLAN OF RECORD — THE LANE THAT HAD NO PRODUCER (wiring audit, 10 Aug 2026)
// Traced live: gemini_quality.jsonl has TWO wired readers (scout.mjs:795 →
// attachGemini · watchman.mjs:210/376 → c11) and HAS NEVER EXISTED ON DISK. Cause:
// the recorder in main() was gated on `mode === "paste"`, justified by a comment
// making two claims that are both false in this repo —
//   • "the paste door IS the off-machine handoff" — it is not. THREE in-session
//     organs shell it: dugout.mjs:1486 (voice), turnstile.mjs:74 (clipboard),
//     throwin.mjs:440 (phone lane), and all three hardcode surface "gem".
//   • "the `rep` door is the in-session surface the teaching audit already covers" —
//     teaching_audit.mjs audits CLAUDE'S TURNS for contract drift; it never reads a
//     rep. And audit #107 built `rep` precisely so a sitting's reps are banked one at
//     a time instead of on a clean close, which makes `rep` the PRIMARY door for the
//     very sittings this lane exists to measure. Evidence on live state: 19 of the 21
//     reps in reps_log.jsonl arrived through it (each with its own distinct
//     observed_at, i.e. its own ingest); the other 2 are dugout-voice.
// So the gate moves off the DOOR and onto the ROWS. Two changes, both DERIVED from
// fields already on the rep — no new schema, no threshold, nothing guessed:
//   1. only surface "gem" rows are measured (a `colab` Drive-pull batch has no
//      business in a lane named gemini), and `of_batch` says how much of the ingest
//      that was, so a mixed batch is readable rather than silently trimmed;
//   2. the row NAMES its own provenance — `door` ("paste"|"rep") and `notes` (the
//      distinct note strings the calling organ declared: dugout writes
//      "dugout-voice think:140ms" / "scrimmage-voice"). This is the honest half.
//      surface "gem" is a CLAIM, not a measurement: the `rep` door DEFAULTS it and
//      the three organs above hardcode it, so NOTHING in the schema proves a row came
//      from Gemini. Recording door+notes is what lets HIS 30-45d review slice the lane
//      instead of trusting a label the machine cannot verify. Whether `surface` should
//      gain a third value so a Claude-Code rep stops calling itself "gem" is HIS
//      vocabulary call, not this repair's — it is canon (INPUT CONTRACT :33 ·
//      MANUAL_WIRING.md · throwin's cartridge contract) and nothing downstream reads
//      surface today (grepped: zero `.surface` reads on a rep outside this file).
// Still judged by NOBODY until 30-45d of real data exists (his standing rule).
// Pure — the selftest drives it with fixtures.
export function geminiBatchStats(rows, observedAt = null, door = null) {
  const all = Array.isArray(rows) ? rows : [];
  const gem = all.filter((r) => r && r.surface === "gem");
  const n = gem.length;
  if (!n) return null;
  const by = (f) => gem.reduce((o, r) => { const k = String(r[f]); o[k] = (o[k] || 0) + 1; return o; }, {});
  const tss = gem.map((r) => Date.parse(r.ts)).filter(Number.isFinite);
  return {
    at: observedAt || new Date().toISOString(),
    door,                                  // which CLI door recorded it: "paste" | "rep"
    n,
    of_batch: all.length,                  // rows in the whole ingest; n of them were surface "gem"
    // the calling organ's own words, verbatim — the only provenance the machine
    // actually holds. Empty array = nobody declared anything (the bare CLI door).
    notes: [...new Set(gem.map((r) => r.note).filter((s) => typeof s === "string" && s.trim()))].sort(),
    surfaces: by("surface"),
    tracks: by("track"),
    concepts: [...new Set(gem.map((r) => r.concept))],
    axes: [...new Set(gem.map((r) => r.axis).filter(Boolean))].sort(),
    confidence_mix: by("confidence"),
    correct_rate: +(gem.filter((r) => r.correct === true).length / n).toFixed(2),
    // measured, never judged: a batch that is 100% knew-correct is RECORDED here —
    // whether that is mastery or a surface that never commits a real gut-word is a
    // 30-45d question, not this line's.
    all_knew_correct: gem.every((r) => r.confidence === "knew" && r.correct === true),
    ts_span_min: tss.length >= 2 ? Math.round((Math.max(...tss) - Math.min(...tss)) / 60000) : 0,
  };
}

// P6.1 REPAIR — THE APPEND THAT LIED (wiring audit, 10 Aug 2026).
// Shipped 7 Aug as `try { appendFileSync(GEMINI_QUALITY, …) } catch { /* a ledger
// miss never blocks reps */ }` followed by an UNCONDITIONAL "gemini-quality row
// recorded … → gemini_quality.jsonl". PROVEN in a sandbox copy with the ledger made
// un-appendable: the paste printed "row recorded (n 1 …)" and the ledger stayed EMPTY.
// That is the worst shape this lane can take — it exists to hold 30-45d of evidence
// for HIS Gemini review (his standing rule: no number until the data is real), and its
// only two readers count LINES (scout.mjs:794 · watchman.mjs:210), so a lane losing
// every row reports an honest-looking zero and nothing anywhere says a write failed.
// The 7 Aug intent is KEPT — the reps are already on disk when we get here, so this
// returns a REPORT and never throws, never changes the exit code. What changes is that
// a miss is now SAID, at the one place a human is looking, exactly like the
// unregistered / skipped-line warnings the 30 Jul audit added above it.
// Two deliberate choices:
//   • VERIFIED ON DISK, not on the absence of an exception. An append that throws and
//     an append that silently writes nothing are the same lie to the reader, so we
//     compare the file's size before and after against the bytes we handed it.
//   • On failure the row goes to a QUARANTINE sidecar — same pattern, same file, as
//     the reps quarantine (ingestUnlocked's `path + ".quarantine.jsonl"`). This row is
//     NOT reproducible by re-pasting: the CLI only computes stats when r.appended > 0,
//     and a re-paste of the same batch dedups to 0 appended. Lose it here and the
//     evidence for his review is gone for good. The sidecar is NOT counted by scout or
//     the watchman — it is salvage, and the console says so.
export function recordGeminiQuality(path, stats) {
  const line = JSON.stringify(stats) + "\n";
  const bytes = Buffer.byteLength(line, "utf8");
  const sizeOf = (p) => { try { return existsSync(p) ? statSync(p).size : 0; } catch { return null; } };
  const before = sizeOf(path);
  const fail = (why) => {
    const sidecar = path + ".quarantine.jsonl";
    let saved = false;
    try { appendFileSync(sidecar, line, "utf8"); saved = true; } catch { /* salvage is best-effort; the console still tells the truth */ }
    return { ok: false, why, saved, sidecar: saved ? sidecar : null };
  };
  try { appendFileSync(path, line, "utf8"); }
  catch (e) { return fail(`${(e && e.code) || "error"}: ${(e && e.message) || e}`); }
  const after = sizeOf(path);
  if (after === null) return fail("the append threw nothing but the ledger cannot be stat'd — treat as NOT recorded");
  if (before !== null && after < before + bytes) return fail(`the ledger grew ${after - before} of ${bytes} bytes — the row is NOT fully on disk`);
  return { ok: true, bytes, size: after };
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

// ---------------------------------------------------------------------------
// THE REJECTION THAT NAMED NO REASON, AND THE LOG NOBODY READ (wiring audit,
// 10 Aug 2026 — his "everything connected to everywhere it is required")
// ---------------------------------------------------------------------------
// ingestUnlocked has built `errors` since v1 (:429, returned :455) and exactly ONE
// caller ever read it — `paste` (:1167, "rejected reasons: …"). pullFromInbox took
// the COUNT (`r.rejected`) and dropped the REASONS on the floor, and its own
// line-parse catch below was a bare `rejected++` with no reason at all. The file
// then archived to done/ regardless, and the run never came back.
// PROVEN before the repair, on a 4-rep fixture carrying 3 bad reps (bad axis "a-i",
// missing ts, malformed JSON): `pulled 1 from 1 file(s) (rejected 3, duplicates 0)`
// — three rejections, zero reasons, and `errors` was not even a KEY on the return.
// This is the one lane that runs 14×/day with nobody watching, so it is the one
// lane where a silent drop is permanent: a malformed Colab export dies whole.
//
// TWO HALVES, and the second is the one that matters:
//  1. THE REASONS ARE CARRIED — per file, per line number — into the return and
//     the note, exactly like the unregistered / ts_corrected / quarantined
//     warnings the 30 Jul audit already added beside them.
//  2. THE WIRE. The note's only destination is scripts/capture.log, and a grep of
//     the whole repo finds ZERO readers of that file — only prose in
//     MANUAL_WIRING.md and two audit docs telling a HUMAN to `tail` it, which is
//     not a wire. A producer with no consumer is a black box. So a pull that
//     rejected reps hands ONE one-line card to captains_call.mjs through the
//     OWNER'S OWN CLI, never its state file (owners-only; precedent
//     awayday.mjs:411 and watchman.mjs:772, both `file --line … --key …`).
//     THE ANCHOR LAW is why a card and not a fatter log line: the machine must
//     NEVER repair a rep it could not read (that would be inventing his data), so
//     the only actor who can fix a malformed export and re-drop it is HIM — and an
//     ask that needs the captain rides an anchor he already hits.
//
// NO NEW THRESHOLD IS INVENTED HERE:
//   · the key is `capture:rejected:<local day>` — the ROLLING shape
//     captains_call.fileGuard already understands (its own header, 10 Aug). 14
//     pulls a day mint at most ONE card, and while that card sits unanswered
//     tomorrow's pull mints nothing either. No nagging, no deck flood.
//   · the spawn ceiling is LOCK_STALE_MS (:375), this file's own already-written
//     answer to "how long may another local process hold us before we call it
//     dead". Borrowed, not chosen.
//   · counts, filenames and reasons in the line are MEASURED. Nothing rounded.
// The card is a PROPOSAL: it asks, it never re-ingests anything on his behalf.
// pull: ingest new *.jsonl from the Drive inbox → move processed files to /done.
// deps.fileCard is the selftest's seam (awayday.mjs:409 pattern) — production passes nothing.
function pullFromInbox(inboxPath, repsPath, reg = EMPTY_REG, deps = {}) {
  if (!existsSync(inboxPath)) {
    return { pulled: 0, files: 0, wired: false, rejections: [], carded: false, card_error: null, note: `inbox not found (${inboxPath}) — Google Drive for Desktop not wired yet; nothing pulled` };
  }
  const files = readdirSync(inboxPath).filter((f) => f.toLowerCase().endsWith(".jsonl"));
  const doneDir = join(inboxPath, "done");
  let pulled = 0, rejected = 0, duplicates = 0, failed = 0, quarantined = 0, quarantinePath = null, ts_corrected = 0;
  const failures = [];
  const unregistered = [];
  // one string per lost rep, "<file>[:L<n>] — <why>". INVARIANT: rejections.length
  // === rejected, always. That equality is the whole repair and the selftest holds it.
  const rejections = [];
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
      let lineNo = 0;
      for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
        lineNo++;
        const s = line.trim(); if (!s) continue;
        // WAS `catch { rejected++; }` — a rep counted and buried. The raw text does
        // survive in done/, so naming file + LINE NUMBER is the whole difference
        // between "rejected 3" and a rep he can actually find and re-export.
        try { cands.push(JSON.parse(s)); }
        catch (e) { rejected++; rejections.push(`${f}:L${lineNo} unreadable JSON — ${(e && e.message) || String(e)}`); }
      }
      const r = ingest(repsPath, cands, reg);
      pulled += r.appended; rejected += r.rejected; duplicates += r.duplicates;
      // THE FIELD NOBODY READ: ingestUnlocked has returned `errors` since v1 and only
      // `paste` (:1167) ever looked. Attributed by file — a pull spans many.
      for (const err of r.errors || []) rejections.push(`${f} — ${err}`);
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
  // THE WIRE (see this function's header). Only fires when reps were actually lost —
  // an empty inbox, the other thirteen pulls a day, and a clean file all cost nothing.
  const carding = cardRejectedReps(rejections, deps);
  const uniqUnreg = [...new Set(unregistered)];
  const note = `pulled ${pulled} from ${files.length - failed} file(s)`
    + (failed ? `; ${failed} file(s) FAILED and stay in the inbox: ${failures.slice(0, 5).join("; ")}` : "")
    + (uniqUnreg.length ? `; ⚠ UNREGISTERED concept(s) coined: ${uniqUnreg.join(", ")} — add them to concepts.json` : "")
    // THE REGISTRY GATE (10 Aug 2026). This note is the pull lane's ONLY written record
    // (it is what reaches capture.log), and before the gate it could say "0 unregistered"
    // on a run where the registry was unreadable and nothing had been checked at all.
    + (reg && reg.loaded ? "" : `; ⚠ REGISTRY DOWN — ${(reg && reg.error) || "concepts.json not loaded"}; nothing canonicalized, nothing rewritten`)
    + (ts_corrected ? `; ⚠ ${ts_corrected} rep(s) claimed a ts AFTER arrival — corrected to the observed clock` : "")
    + (quarantined ? `; ⚠ ${quarantined} unreadable reps_log line(s) moved to ${quarantinePath}` : "")
    // the reasons the count never carried. Capped at 5 like the `failures` line above it,
    // and the remainder is COUNTED rather than dropped — the full list is on the return.
    + (rejections.length ? `; ⚠ ${rejections.length} rep(s) REJECTED — ${rejections.slice(0, 5).join(" · ")}`
        + (rejections.length > 5 ? ` · +${rejections.length - 5} more` : "")
        + `; raw text is in ${doneDir}` : "");
  return { pulled, files: files.length, rejected, duplicates, failed, failures, unregistered: uniqUnreg, ts_corrected, quarantined, quarantine_path: quarantinePath, wired: true, note, rejections, carded: carding.carded, card_said: carding.said, card_error: carding.error,
    registry_loaded: !!(reg && reg.loaded), registry_error: (reg && reg.error) || null };
}

// The one door out of the unattended lane. Returns a REPORT and NEVER throws: the
// reps that DID land are already on disk by the time we get here, and a card that
// cannot be filed must not turn a good pull into a failed scheduled task (same rule
// as chainHeartbeat above, and as awayday.mjs's own fileCard catch).
// The line is front-loaded — captains_call clips every card at 140 chars
// (captains_call.mjs:1030 `clip(line, 140)`), so the ASK comes first and the reason
// takes whatever is left rather than the other way round.
// (the done/ path is deliberately NOT in the line — the card is clipped at 140 and a
//  Windows Drive path would eat the reason; the full path is in the note, for Claude.)
function cardRejectedReps(rejections, deps = {}) {
  if (!rejections.length) return { carded: false, said: null, error: null };
  const fileCard = deps.fileCard || ((line, key) => execFileSync(process.execPath,
    [join(__dirname, "captains_call.mjs"), "file", "--line", line, "--key", key],
    { encoding: "utf8", windowsHide: true, timeout: LOCK_STALE_MS }));
  // LOCAL day, from this file's OWN localDate() (the helper cardQuarantine keys on,
  // same shape as captains_call.localDate). A UTC day would roll the key at 05:30 IST
  // — mid-morning — and split one day's asks across two key families.
  const line = `Colab/Gem inbox se ${rejections.length} rep REJECT hue — raw done/ mein safe hai, export theek karke dobara daalein? ${rejections[0]}`;
  try {
    // THE OWNER'S OWN WORD, echoed — not our guess at it (live run, 10 Aug 2026: the
    // second rejected pull of the same day printed "card filed" while fileGuard had
    // actually minted NOTHING, because `capture:rejected:<day>` was already live. The
    // suppression is correct and wanted; claiming a fresh card for it is not).
    const said = String(fileCard(line, `capture:rejected:${localDate()}`) || "").trim().split("\n")[0];
    return { carded: true, said: said || null, error: null };
  } catch (e) {
    // NOT recorded as filed. If this is swallowed, the rejection reaches nobody at
    // all — capture.log has no readers, which is the defect this wire exists to fix.
    return { carded: false, said: null, error: `${(e && e.code) || "error"}: ${String((e && e.message) || e).split("\n")[0].slice(0, 160)}` };
  }
}

// ---------------------------------------------------------------------------
// THE QUARANTINE'S MISSING CONSUMER (wiring audit, 10 Aug 2026)
// ---------------------------------------------------------------------------
// The 30 Jul repair above stopped the data LOSS — an unreadable reps_log line is
// parked in `reps_log.jsonl.quarantine.jsonl` before the rewrite deletes it. What it
// never built was the other end of that wire. A grep over scripts/*.mjs on 10 Aug
// 2026 found "quarantine.jsonl" in exactly ONE script: this one. No organ read it, no
// organ counted it (repo-wide it appears only in .gitignore:111 and MANUAL_WIRING.md).
// A producer with no consumer is a black box, not a feedback loop — real reps left
// the corpus and the only notice was console text telling him to "Inspect that file",
// which is a command to remember, and THE ANCHOR LAW forbids that. Worse in the pull
// lane: ArsenalFC-CapturePull fires 14× a day unattended, so that console goes to a
// log nobody opens.
// Both ends are connected here, inside the OWNER of both files:
//   READ   — quarantineTriage() re-runs the SAME validator over the parked raw text
//            and says which lines would come back today, which are already back, and
//            which are still broken and why. `capture.mjs quarantine` prints it.
//   NOTICE — cardQuarantine() hands the ask to captains_call.mjs's own CLI, so it
//            rides an anchor he already hits instead of a console line. OWNERS-ONLY
//            (precedent: dugout.mjs shells doubtminer.mjs; awayday.mjs:411 and
//            watchman.mjs:772 file their cards through this exact door) — this file
//            never opens captains_call.json, and the selftest asserts that.
// Restoring is NEVER automatic: `quarantine retry` is a command a session runs on HIS
// word, and it goes through `ingest` — same validator, same writer lock, same dedupe
// key — so a parked line can only return the way any rep returns. Nothing is deleted
// from the sidecar either: the dedupe makes a second retry a no-op, so the salvage
// text stays readable forever.
const quarantinePathFor = (repsPath) => repsPath + ".quarantine.jsonl";
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

// Pure read — never writes, never spawns. `recoverable` holds the RAW parked objects
// (not the enriched reps): retry must re-enter through the front door so the arrival
// clock, the canonicalisation and the dedupe all run exactly once more.
export function quarantineTriage(repsPath, reg = EMPTY_REG) {
  const sidecar = quarantinePathFor(repsPath);
  if (!existsSync(sidecar)) return { sidecar, exists: false, parked: 0, recoverable: [], already_back: 0, broken: [] };
  const existingKeys = new Set(loadReps(repsPath, reg).map(keyOf));
  const recoverable = [], broken = [];
  let parked = 0, already_back = 0;
  for (const line of readFileSync(sidecar, "utf8").split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    parked++;
    let o;
    try { o = JSON.parse(s); } catch { broken.push({ line: s, why: "unparseable JSON line" }); continue; }
    const v = validateRep(o, reg);
    if (!v.ok) { broken.push({ line: s, why: v.error }); continue; }
    if (existingKeys.has(keyOf(v.rep))) { already_back++; continue; }   // an earlier retry (or a re-paste) already restored it
    recoverable.push(o);
  }
  return { sidecar, exists: true, parked, recoverable, already_back, broken };
}

// The card is IDEMPOTENT by day AND by family: captains_call.fileGuard treats a key
// ending in a bare YYYY-MM-DD as ROLLING, so a second quarantine while the first ask
// is still unanswered mints nothing (captains_call.mjs:874). Returns a REPORT and
// never throws — the reps are already on disk by the time we get here, and a card
// that could not be filed must not turn a successful ingest into a failure. It must,
// however, be SAID: an unfiled card means the parked lines reach nobody at all.
export function cardQuarantine({ count, day = localDate(), scriptsDir = __dirname, exec = execFileSync } = {}) {
  if (!count) return { filed: false, why: "nothing quarantined" };
  const cc = join(scriptsDir, "captains_call.mjs");
  if (!existsSync(cc)) return { filed: false, why: `captains_call.mjs not found at ${cc}` };
  const line = `${count} rep line(s) reps_log se padhi hi nahi gayi — quarantine mein park hain, corpus se BAHAR. Wapas daalein?`;
  const key = `reps:quarantine:${day}`;
  try {
    exec(process.execPath, [cc, "file", "--line", line, "--key", key], { encoding: "utf8", windowsHide: true, stdio: "pipe" });
    return { filed: true, key, line };
  } catch (e) {
    return { filed: false, key, line, why: `${(e && e.code) || "error"}: ${String((e && e.message) || e).split("\n")[0].slice(0, 160)}` };
  }
}

// THE REGISTRY GATE's anchor (10 Aug 2026). Same shape, same organ, same rolling-day
// key family as cardQuarantine above — deliberately, because it is the same law: only
// the CAPTAIN can fix this. concepts.json is hand-curated canon (this file's own header,
// :52) and the machine repairing it would be inventing his syllabus. And the lane that
// matters is unattended: ArsenalFC-CapturePull fires 14×/day into a stdout nobody reads,
// which is physio.mjs:369's own recorded lesson ("a defect only visible on a console
// nobody reads is still invisible"). A rolling YYYY-MM-DD key mints at most ONE card a
// day and mints nothing while the first is unanswered (captains_call.mjs:874), so 14
// pulls cannot flood the deck. It PROPOSES; it never edits concepts.json.
export function cardRegistryDown({ why, day = localDate(), scriptsDir = __dirname, exec = execFileSync } = {}) {
  if (!why) return { filed: false, why: "registry loaded — nothing to ask" };
  const cc = join(scriptsDir, "captains_call.mjs");
  if (!existsSync(cc)) return { filed: false, why: `captains_call.mjs not found at ${cc}` };
  // front-loaded: captains_call clips at 140 chars (captains_call.mjs:1030), so the ASK
  // comes first and the reason takes whatever is left.
  const line = `concepts.json padha hi nahi gaya — naye reps bina registry ke log ho rahe hain, purane chhue nahi gaye. Theek karein? (${why})`;
  const key = `capture:registry:${day}`;
  try {
    exec(process.execPath, [cc, "file", "--line", line, "--key", key], { encoding: "utf8", windowsHide: true, stdio: "pipe" });
    return { filed: true, key, line };
  } catch (e) {
    return { filed: false, key, line, why: `${(e && e.code) || "error"}: ${String((e && e.message) || e).split("\n")[0].slice(0, 160)}` };
  }
}

// The CLI half of the gate, shared by BOTH write lanes — mirrors noticeQuarantine below.
// It says the ONE thing the old output could not: the reps landed, nothing on disk was
// rewritten, and `unregistered` is UNKNOWN rather than true. The pre-gate code printed
// the opposite ("these coined phantom topics · add them to concepts.json") about
// concepts that were already in the file.
function noticeRegistry(lane, reg) {
  if (!reg || reg.loaded === true) return null;
  const why = reg.error || "concepts.json not loaded";
  const c = cardRegistryDown({ why });
  console.log(`${lane}: ⚠ REGISTRY DOWN — ${why}`);
  console.log(`${lane}:   Reps ARE captured and NOTHING already in reps_log was rewritten, but no concept was canonicalized: unregistered reads null (unknown), never true.`);
  console.log(c.filed
    ? `${lane}:   A captain's card is filed (${c.key}); it deals at his next anchor. concepts.json is hand-curated canon — only he edits it. Reps retro-register on the next healthy load.`
    : `${lane}:   The captain's card could NOT be filed (${c.why}), so nothing else in the organism knows. Fix dressing-room/state/concepts.json now.`);
  return c;
}

// The CLI half, shared by BOTH lanes — the pull lane was the one that mattered and
// the one the 30 Jul repair could not reach, because a warning printed into an
// unattended scheduled task's stdout is a warning nobody receives.
function noticeQuarantine(lane, r) {
  if (!r || !r.quarantined) return null;
  const c = cardQuarantine({ count: r.quarantined });
  console.log(c.filed
    ? `${lane}:   ⚠ their raw text is parked in ${r.quarantine_path} — they are NOT in reps_log any more. A captain's card is filed (${c.key}); it deals at his next anchor. Triage: node scripts/capture.mjs quarantine`
    : `${lane}:   ⚠ their raw text is parked in ${r.quarantine_path} — they are NOT in reps_log any more, and the captain's card could NOT be filed (${c.why}), so NOTHING else in the organism knows. Triage now: node scripts/capture.mjs quarantine`);
  return c;
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
  // P6.1 — the Gemini outcome lane: appended rows ride the return, and the pure
  // stats function measures without judging (each side can fail).
  assert("P6.1 — ingest returns the appended rows for the quality lane",
    Array.isArray(r.appended_rows) && r.appended_rows.length === 2);
  assert("P6.1 — geminiBatchStats measures mix/rate/span and flags-without-judging all-knew-correct",
    (() => {
      const rows = [
        { ts: "2026-08-07T10:00:00Z", surface: "gem", track: "concept", concept: "hallucinations", axis: "a", confidence: "knew", correct: true },
        { ts: "2026-08-07T10:30:00Z", surface: "gem", track: "concept", concept: "hallucinations", axis: "b", confidence: "shaky", correct: false },
      ];
      const s = geminiBatchStats(rows, "2026-08-07T11:00:00Z");
      const all = geminiBatchStats(rows.map((x) => ({ ...x, confidence: "knew", correct: true })));
      return s.n === 2 && s.correct_rate === 0.5 && s.confidence_mix.knew === 1 && s.confidence_mix.shaky === 1
        && s.ts_span_min === 30 && s.all_knew_correct === false && all.all_knew_correct === true
        && geminiBatchStats([]) === null;
    })());
  // ── P6.1 REPAIR · THE LANE THAT HAD NO PRODUCER (wiring audit, 10 Aug 2026) ──
  // THIS is the assertion the 7 Aug shape could never fail. gemini_quality.jsonl had
  // two wired readers and had never existed, because the recorder was gated on
  // `mode === "paste"` while 19 of the 21 live reps arrive through `rep`. If anyone
  // re-gates the lane on the DOOR, or drops the provenance the 30-45d review needs,
  // this goes red. (The CLI half of the same wire — a real `capture.mjs rep` run
  // producing a real ledger line — lives in organism_test.mjs, in a sandbox, because
  // GEMINI_QUALITY resolves against the real state dir.)
  assert("P6.1 WIRE — the `rep` door PRODUCES a stats row, and the row NAMES its door (the paste-only gate is gone)",
    (() => {
      const one = [{ ts: "2026-08-10T10:47:15.190Z", surface: "gem", track: "concept", concept: "hallucinations", axis: "a", confidence: "guessed", correct: true }];
      const s = geminiBatchStats(one, "2026-08-10T10:47:15.194Z", "rep");
      const p = geminiBatchStats(one, null, "paste");
      return s !== null && s.door === "rep" && s.n === 1 && s.of_batch === 1 && Array.isArray(s.notes) && s.notes.length === 0
        && p.door === "paste";
    })());
  assert("P6.1 WIRE — provenance is the calling organ's own words, verbatim and deduped (dugout-voice / scrimmage-voice)",
    (() => {
      const rows = [
        { ts: "2026-07-17T19:00:29.304Z", surface: "gem", track: "concept", concept: "embeddings", axis: "a", confidence: "shaky", correct: false, note: "dugout-voice think:140ms" },
        { ts: "2026-07-17T19:01:55.561Z", surface: "gem", track: "concept", concept: "embeddings", axis: "d", confidence: "knew", correct: true, note: "dugout-voice think:140ms" },
      ];
      const s = geminiBatchStats(rows, null, "paste");
      // one distinct note, not two — and it is the organ's string untouched, which is
      // what makes a voice batch separable from an off-machine one at review time.
      return s.notes.length === 1 && s.notes[0] === "dugout-voice think:140ms";
    })());
  assert("P6.1 WIRE — a colab batch is NOT recorded into a lane named gemini, and a mixed batch says how much of it was gem",
    (() => {
      const colab = [{ ts: "2026-08-10T10:00:00Z", surface: "colab", track: "skill", concept: "pydantic", axis: null, confidence: "knew", correct: true }];
      const mixed = colab.concat([{ ts: "2026-08-10T10:05:00Z", surface: "gem", track: "concept", concept: "hallucinations", axis: "a", confidence: "shaky", correct: false }]);
      const m = geminiBatchStats(mixed, null, "pull");
      return geminiBatchStats(colab, null, "pull") === null
        && m.n === 1 && m.of_batch === 2 && m.surfaces.colab === undefined && m.surfaces.gem === 1;
    })());
  assert("LAYERING — the 7 Aug engine is FROZEN verbatim as geminiBatchStatsLegacy (no filter, no door), and both still live here",
    (() => {
      const colab = [{ ts: "2026-08-10T10:00:00Z", surface: "colab", track: "skill", concept: "pydantic", axis: null, confidence: "knew", correct: true }];
      const l = geminiBatchStatsLegacy(colab, "2026-08-10T11:00:00Z");
      return typeof geminiBatchStatsLegacy === "function" && typeof geminiBatchStats === "function"
        && l !== null && l.n === 1 && l.door === undefined && l.of_batch === undefined
        && geminiBatchStats(colab, "2026-08-10T11:00:00Z", "pull") === null;   // the two DIFFER — that is the change, and it is visible
    })());
  // P6.1 REPAIR (10 Aug 2026) — THE APPEND MUST NOT BE ABLE TO LIE AGAIN.
  // This is the assertion the 7 Aug shape could never fail: the write sat in an
  // empty catch and the "row recorded" line printed unconditionally, so a ledger
  // that took nothing still read as success. These three drive the real function
  // against a real filesystem — a green here means a blocked ledger is REPORTED.
  assert("P6.1 — recordGeminiQuality: a written row is verified ON DISK (ok + the line is really there)",
    (() => {
      const okPath = join(dir, "gq_ok.jsonl");
      if (existsSync(okPath)) rmSync(okPath);
      const res = recordGeminiQuality(okPath, { at: "2026-08-10T00:00:00Z", n: 1 });
      const lines = readFileSync(okPath, "utf8").split("\n").filter((l) => l.trim());
      return res.ok === true && lines.length === 1 && JSON.parse(lines[0]).n === 1;
    })());
  assert("P6.1 — recordGeminiQuality: an unwritable ledger returns ok:false (never a silent success)",
    (() => {
      // a path under a directory that does not exist → the append throws ENOENT.
      const dead = join(dir, "no_such_dir_" + process.pid, "gemini_quality.jsonl");
      const res = recordGeminiQuality(dead, { at: "2026-08-10T00:00:00Z", n: 1 });
      return res.ok === false && typeof res.why === "string" && res.why.length > 0 && res.saved === false;
    })());
  assert("P6.1 — recordGeminiQuality: a blocked ledger salvages the row to the quarantine sidecar",
    (() => {
      // the ledger path is occupied by a DIRECTORY → the append throws, but the
      // state dir itself is writable, which is exactly the sandbox case that proved
      // the original defect (ledger un-appendable, everything else fine).
      const blocked = join(dir, "gq_blocked.jsonl");
      if (existsSync(blocked)) rmSync(blocked, { recursive: true });
      mkdirSync(blocked, { recursive: true });
      const side = blocked + ".quarantine.jsonl";
      if (existsSync(side)) rmSync(side);
      const res = recordGeminiQuality(blocked, { at: "2026-08-10T00:00:00Z", n: 2 });
      const saved = existsSync(side) ? readFileSync(side, "utf8").split("\n").filter((l) => l.trim()) : [];
      return res.ok === false && res.saved === true && res.sidecar === side
        && saved.length === 1 && JSON.parse(saved[0]).n === 2;
    })());

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

  // 3d) THE --correct FLAG IS PARSED, NEVER DEFAULTED (audit #108, 6 Aug 2026).
  // The `rep` door coerced with `=== "true"`, so a MISSING or misspelt flag became
  // `false` — a valid boolean that validateRep could never reject, writing a miss he
  // never made into the field calibration/nemesis/fsrs all key on. These assertions
  // are the lock: only the two literals may produce a boolean.
  assert("correct-parse: literal true/false only", parseCorrectFlag("true") === true && parseCorrectFlag("false") === false);
  assert("correct-parse: case/space tolerant", parseCorrectFlag("  TRUE ") === true && parseCorrectFlag("False") === false);
  assert("correct-parse: MISSING flag ⇒ undefined, never false", parseCorrectFlag(undefined) === undefined);
  assert("correct-parse: 1/yes/garbage ⇒ undefined, never false", ["1", "yes", "y", "0", "no", "--gut", ""].every((v) => parseCorrectFlag(v) === undefined));
  assert("correct-parse: undefined then fails validateRep (same lock as paste)", validateRep(rep({ correct: parseCorrectFlag(undefined) }), reg).ok === false);

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
  assert("concepts.json missing ⇒ still logs (never a crash, never a lost rep)", nr.appended === 1);
  assert("UNREGISTERED IS NAMED, not just flagged (the count had no consumer before)",
    Array.isArray(ur.unregistered) && ur.unregistered.includes("brand new concept"));
  // AMENDED BY THE REGISTRY GATE (10 Aug 2026). This line used to read
  // `nr.unregistered.length === 1` — a MISSING concepts.json was allowed to accuse the
  // rep of being a phantom. It is the same false claim the malformed case made against
  // the live canon (85 real concepts, all suddenly "unregistered"), and it fed the same
  // consumer: physio.mjs:372 bleeds every truthy `unregistered` as a phantom topic. A
  // registry that was never read judges nothing, whether it is missing or broken.
  assert("GATE: a MISSING registry accuses nobody either — the rep lands unjudged (null), and the report says the registry was down",
    nr.unregistered.length === 0 && nr.registry_loaded === false && /not found/.test(nr.registry_error || "")
    && loadReps(p2, loadRegistry(join(dir, "no_such_concepts.json")))[0].unregistered === null);

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

  // ── THE REJECTION LANE'S REASONS + ITS ONE READER (wiring audit, 10 Aug 2026) ──
  // These are the assertions that FAIL if the wire breaks again. Before the repair
  // this exact fixture printed "pulled 1 from 1 file(s) (rejected 3, duplicates 0)"
  // and `errors` was not even a key on the return.
  {
    const inbox3 = join(dir, "inbox3"); mkdirSync(inbox3, { recursive: true });
    writeFileSync(join(inbox3, "colab_export.jsonl"), [
      JSON.stringify(rep({ ts: "2026-07-11T12:10:00Z", question: "rej_ok" })),          // good
      JSON.stringify(rep({ ts: "2026-07-11T12:11:00Z", question: "rej_axis", axis: "a-i" })), // validateRep: bad axis
      JSON.stringify({ surface: "gem", track: "concept", concept: "tokenization", axis: "b", question: "rej_ts", confidence: "shaky", correct: false }), // no ts
      '{"ts":"2026-07-11T12:13:00Z","surface":"colab" BROKEN',                            // unparseable line
    ].join("\n") + "\n");
    const cards = [];
    const pr3 = pullFromInbox(inbox3, p, reg, { fileCard: (line, key) => { cards.push({ line, key }); return `captains_call: filed c9 — it deals at his next anchor\n`; } });
    assert("REJECTIONS CARRY A REASON: every rejected rep is named, count matches exactly (was: a bare count, reasons dropped)",
      pr3.rejected === 3 && Array.isArray(pr3.rejections) && pr3.rejections.length === 3);
    assert("...the validateRep reasons come from ingest's `errors`, which pull never read before",
      pr3.rejections.some((s) => /colab_export\.jsonl — .*axis/i.test(s)) && pr3.rejections.some((s) => /colab_export\.jsonl — .*ts/i.test(s)));
    assert("...and an unparseable inbox line names its FILE and LINE NUMBER, not just `rejected++`",
      pr3.rejections.some((s) => /^colab_export\.jsonl:L4 unreadable JSON — /.test(s)));
    assert("...the note SAYS the reasons and points at the raw text in done/ (capture.log's line is no longer a bare count)",
      /3 rep\(s\) REJECTED/.test(pr3.note) && /unreadable JSON/.test(pr3.note) && /raw text is in /.test(pr3.note));
    assert("THE WIRE: a rejected pull files exactly ONE captain's card through captains_call's own CLI — the lane's only reader (capture.log has none)",
      pr3.carded === true && cards.length === 1 && /\d+ rep REJECT hue/.test(cards[0].line) && cards[0].line.includes("colab_export.jsonl"));
    assert("...keyed capture:rejected:<local day> — the ROLLING shape fileGuard already dedups, so 14 pulls a day mint at most one card",
      /^capture:rejected:\d{4}-\d{2}-\d{2}$/.test(cards[0].key));
    assert("...and the deck's OWN word is echoed back, never our guess at it (a suppressed re-file must not read as a fresh card)",
      pr3.card_said === "captains_call: filed c9 — it deals at his next anchor");
    assert("...the good rep still landed (the card is a proposal, never a gate on capture)", !!findQ("rej_ok"));
    // a clean pull must stay silent — no card for an ordinary night
    const inbox4 = join(dir, "inbox4"); mkdirSync(inbox4, { recursive: true });
    writeFileSync(join(inbox4, "clean.jsonl"), JSON.stringify(rep({ ts: "2026-07-11T12:20:00Z", question: "rej_clean" })) + "\n");
    const clean = [];
    const pr4 = pullFromInbox(inbox4, p, reg, { fileCard: (line, key) => clean.push({ line, key }) });
    assert("...and a CLEAN pull files nothing (13 of the 14 daily pulls must cost the deck zero)",
      pr4.rejections.length === 0 && pr4.carded === false && clean.length === 0);
    // the card must never be able to fail the pull, or one un-writable deck kills capture
    // (a fresh inbox — inbox3's file is already archived to done/ by the pull above)
    const inbox5 = join(dir, "inbox5"); mkdirSync(inbox5, { recursive: true });
    writeFileSync(join(inbox5, "boom.jsonl"), "{ not json at all\n");
    const boom = pullFromInbox(inbox5, p, reg, { fileCard: () => { throw new Error("deck locked"); } });
    assert("...a card that CANNOT be filed is reported, never thrown, and never recorded as filed",
      boom.rejections.length === 1 && boom.carded === false && /deck locked/.test(String(boom.card_error)));
  }

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

  // --- THE QUARANTINE WIRE (wiring audit, 10 Aug 2026) ----------------------
  // These four exist because the sidecar was written for eleven days and read by
  // NOTHING. Break any end of the wire again and one of them goes red.
  {
    const qp = join(dir, "q_reps.jsonl");
    if (existsSync(qp)) rmSync(qp);
    if (existsSync(quarantinePathFor(qp))) rmSync(quarantinePathFor(qp));
    // one good rep on disk, then a hand-mangled line beside it, then an ingest that
    // rewrites the file — exactly the 30 Jul scenario that parks and deletes.
    ingest(qp, [rep({ question: "q-keep" })], reg);
    appendFileSync(qp, '{"ts":"2026-08-10T09:00:00Z","surface":"gem","track":"concept","concept":"tokenization","axis":"a","question":"q-park","confidence":"knew"\n', "utf8");  // truncated → unparseable
    appendFileSync(qp, JSON.stringify({ ts: "2026-08-10T09:05:00Z", surface: "gem", track: "concept", concept: "tokenization", axis: "a", question: "q-fixable", confidence: "knew", correct: true }) + "\n", "utf8");
    const qr = ingest(qp, [rep({ question: "q-new" })], reg);
    assert("quarantine wire — the sidecar is still WRITTEN before the rewrite (the 30 Jul repair)",
      qr.quarantined === 1 && existsSync(quarantinePathFor(qp)));
    // Only the truncated line parks (the second appended line was valid and survived
    // the rewrite). A REPAIRED line goes into the sidecar by hand, because that is the
    // real recovery path: parked text is text, he fixes it, and retry re-ingests it.
    appendFileSync(quarantinePathFor(qp), JSON.stringify({ ts: "2026-08-10T09:10:00Z", surface: "gem", track: "concept", concept: "tokenization", axis: "b", question: "q-repaired", confidence: "shaky", correct: false }) + "\n", "utf8");
    const t = quarantineTriage(qp, reg);
    assert("quarantine wire — the parked text is READ BACK and triaged (until 10 Aug 2026 no organ read this file at all)",
      t.exists && t.parked === 2 && t.recoverable.length === 1 && t.broken.length === 1
      && /unparseable/.test(t.broken[0].why) && t.recoverable[0].question === "q-repaired");
    // retry returns a parked rep through the FRONT DOOR, and is idempotent after it.
    const back = ingest(qp, t.recoverable, reg);
    const again = quarantineTriage(qp, reg);
    assert("quarantine wire — retry restores a recoverable line through ingest, and a second pass is a no-op (already_back)",
      back.appended === 1 && loadReps(qp, reg).some((x) => x.question === "q-repaired")
      && again.recoverable.length === 0 && again.already_back === 1 && again.parked === 2);
    // THE NOTICE. It must leave this process as a captain's card, on the owner's CLI.
    const calls = [];
    const c = cardQuarantine({ count: 3, day: "2026-08-10", scriptsDir: __dirname, exec: (bin, argv) => { calls.push({ bin, argv }); return ""; } });
    assert("quarantine wire — the notice rides an ANCHOR: it shells captains_call.mjs file --line with a ROLLING day-key (reps:quarantine:<day>)",
      c.filed === true && calls.length === 1 && calls[0].argv[0].endsWith("captains_call.mjs")
      && calls[0].argv[1] === "file" && calls[0].argv[2] === "--line"
      && calls[0].argv.includes("--key") && calls[0].argv[calls[0].argv.indexOf("--key") + 1] === "reps:quarantine:2026-08-10"
      && /3 rep line/.test(calls[0].argv[3])
      // a card that cannot be filed is REPORTED, never thrown — the reps are on disk already
      && cardQuarantine({ count: 1, scriptsDir: __dirname, exec: () => { throw Object.assign(new Error("nope"), { code: "ENOENT" }); } }).filed === false);
    // OWNERS-ONLY, asserted on this file's own source (precedent: awayday.mjs:538).
    // OWNERS-ONLY, asserted on this file's own source — scoped to the wire's body the
    // way awayday.mjs:538 scopes its own, because the whole-file grep matches the
    // sentence you are reading (a check that fails on its own documentation is noise).
    const ownSrc = readFileSync(join(__dirname, "capture.mjs"), "utf8");
    const wireSrc = ownSrc.slice(ownSrc.indexOf("export function cardQuarantine"), ownSrc.indexOf("function noticeQuarantine"));
    assert("quarantine wire — capture never opens the deck's state file; it hands the ask to that organ's CLI (owners-only)",
      wireSrc.length > 0 && /captains_call\.mjs/.test(wireSrc) && !/captains_call\.json/.test(wireSrc)
      && !/(writeFileSync|appendFileSync|writeAtomic|rmSync)\s*\([^)]*captains_call/.test(ownSrc));
    // BOTH ENDS STILL CONNECTED. A helper nobody calls is the same dead wire in a new
    // coat, so the call sites are asserted too — paste, pull, and the read door.
    assert("quarantine wire — both ingest lanes still fire the notice, and the read door is still on the CLI",
      /noticeQuarantine\("paste", r\)/.test(ownSrc) && /noticeQuarantine\("pull", r\)/.test(ownSrc)
      && /mode === "quarantine"/.test(ownSrc) && /quarantineTriage\(REPS_LOG, reg\)/.test(ownSrc));
  }

  // --- THE REGISTRY GATE (wiring audit, 10 Aug 2026) ------------------------
  // `loaded` was SET at :123 and read NOWHERE in its own owner. Both facts asserted
  // here were MEASURED on a sandbox copy of the live concepts.json (85 concepts, one
  // trailing comma appended) before the gate existed — remove the gate and the
  // history-rewrite assertion fails on exactly that evidence again.
  {
    const okPath  = join(dir, "gate_concepts.json");
    const badPath = join(dir, "gate_concepts_bad.json");
    const canon = { concepts: { tool_use: { aliases: ["tool use"] }, vector_search: { aliases: [] } } };
    writeFileSync(okPath, JSON.stringify(canon));
    writeFileSync(badPath, JSON.stringify(canon) + ",");   // ONE trailing comma: the realistic hand-edit slip on hand-curated canon
    const good = loadRegistry(okPath), dead = loadRegistry(badPath);

    assert("GATE: a malformed concepts.json loads dead AND names why (loaded:false was SET and never READ by its own owner before 10 Aug)",
      good.loaded === true && dead.loaded === false && /unreadable/.test(dead.error || ""));
    assert("GATE: 'not found' and 'unreadable' stay DIFFERENT errors — the captain needs different words for a missing canon and a broken one",
      /not found/.test(loadRegistry(join(dir, "__no_such_concepts__.json")).error || ""));

    const gp = join(dir, "reps_gate.jsonl"); if (existsSync(gp)) rmSync(gp);
    const gRep = (n, c) => ({ ts: `2026-07-1${n}T10:00:00Z`, surface: "gem", track: "concept", concept: c, axis: "a", question: "g" + n, confidence: "knew", correct: true });
    ingest(gp, [gRep(1, "tool use"), gRep(2, "vector_search")], good);
    assert("GATE: a HEALTHY registry canonicalizes exactly as it always did — the gate did not weaken the normal path",
      loadReps(gp, good).map((r) => `${r.concept}:${r.unregistered}`).join("|") === "tool_use:false|vector_search:false");

    // THE MEASURED DAMAGE, frozen. loadReps re-validates every stored line (:315) and
    // ingestUnlocked rewrites the file from that result (:449), so before the gate this
    // ONE ingest turned both stored rows into `tool use`/`vector search`,
    // unregistered=true — every real topic forking a phantom twin on disk, forever.
    const gr = ingest(gp, [gRep(3, "tool use")], dead);
    const after = readFileSync(gp, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert("GATE: a dead registry NEVER rewrites history — both stored canonical ids survive an ingest (measured before the gate: tool_use → 'tool use', unregistered false → true)",
      after[0].concept === "tool_use" && after[0].unregistered === false
      && after[1].concept === "vector_search" && after[1].unregistered === false);
    assert("GATE: the NEW rep makes NO CLAIM — unregistered is null (unknown), never the phantom accusation an unreadable canon used to produce",
      gr.appended === 1 && after[2].unregistered === null);
    assert("GATE: the report SAYS the registry was down — an empty `unregistered` array alone reads as a clean bill of health and is not one",
      gr.registry_loaded === false && /unreadable/.test(gr.registry_error || "") && gr.unregistered.length === 0);

    // IDEMPOTENCE — the law normText (:100) and #24 both obey. A second dead-registry
    // pass must not move a byte, or the dedupe key splits and reps re-append forever.
    const snap = readFileSync(gp, "utf8");
    const again = ingest(gp, [gRep(3, "tool use")], dead);
    assert("GATE: a second dead-registry ingest is a pure duplicate and moves NOTHING on disk",
      again.appended === 0 && again.duplicates === 1 && readFileSync(gp, "utf8") === snap);

    // RETRO-REGISTRATION — the promise the paste output has always printed out loud.
    const healed = loadReps(gp, good);
    assert("GATE: once the canon parses again the unjudged rep retro-registers (null → a real verdict), which is what the paste output has always promised",
      healed[2].concept === "tool_use" && healed[2].unregistered === false);

    assert("LAYERING: the frozen pre-gate engine is still in the file and still agrees with the plan of record whenever the registry IS readable",
      JSON.stringify(enrichConcept({ concept: "tool use", track: "concept" }, good))
      === JSON.stringify(enrichConceptLegacy({ concept: "tool use", track: "concept" }, good)));

    // THE WIRE. concepts.json is hand-curated canon — only HE can fix it — and the lane
    // that breaks is unattended (CapturePull, 14×/day, stdout nobody reads).
    const gcalls = [];
    const rc = cardRegistryDown({ why: "concepts.json unreadable: Unexpected token", day: "2026-08-10", scriptsDir: __dirname, exec: (bin, argv) => { gcalls.push(argv); return ""; } });
    assert("GATE WIRE: the ask rides an ANCHOR — capture shells captains_call.mjs's OWN CLI with a ROLLING day-key (capture:registry:<day>), so 14 pulls mint at most one card",
      rc.filed === true && gcalls.length === 1 && gcalls[0][0].endsWith("captains_call.mjs")
      && gcalls[0][gcalls[0].indexOf("--key") + 1] === "capture:registry:2026-08-10");
    assert("GATE WIRE: an unfilable card is REPORTED, never thrown — the reps are already on disk and a dead deck must not fail the pull",
      cardRegistryDown({ why: "x", scriptsDir: __dirname, exec: () => { throw new Error("deck locked"); } }).filed === false);
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

  if (mode === "paste" || mode === "rep") {
    let cands;
    if (mode === "rep") {
      // ── ONE REP, AS IT HAPPENS (audit #107, 5 Aug 2026) ─────────────────────
      // Every rep used to hinge on a perfect end-of-session close: build the whole
      // array, write a temp file, paste it. Measured cost of that coupling — FOUR
      // recorded forge sessions on `hallucinations`, all four `method_clean false`,
      // and reps_log standing at NINE lines total, which is why calibration (gate 20),
      // nemesis (20) and learning_state (12) are all still dormant. A session that
      // ends messily loses the whole day's reps, and his sessions end messily.
      // So: a second door, same lock. This builds ONE rep and hands it to the SAME
      // ingest() — identical validation, identical dedupe, identical reporting. No
      // second validator can drift from the first, because there isn't one.
      const flag = (n) => { const i = process.argv.indexOf("--" + n); return i >= 0 ? process.argv[i + 1] : undefined; };
      const track = (flag("track") || "concept").toLowerCase();
      const axisRaw = flag("axis");
      const lat = flag("latency");
      // ── --correct IS PARSED, NEVER COERCED (audit #108, 6 Aug 2026) ───────────
      // This line used to read `String(flag("correct")).toLowerCase() === "true"`.
      // An unconditional coercion means a FORGOTTEN flag, a misspelt one, or
      // `--correct 1` / `--correct yes` all silently produce `false` — a fully
      // VALID boolean, so validateRep's `typeof o.correct !== "boolean"` waved it
      // straight through and wrote a rep he never got wrong. `correct` is the field
      // calibration, nemesis and fsrs ALL key on, so one forgotten flag poisons the
      // calibration curve with a fake miss and nothing anywhere objects. `paste` never
      // had this hole, which made the newer door strictly weaker than the old one —
      // the exact opposite of this block's own "same door, same lock" promise.
      // Now: anything that is not literally true/false becomes `undefined`, so the
      // SAME validator that guards a pasted rep rejects it. No second validator.
      const correct = parseCorrectFlag(flag("correct"));
      const one = {
        // `ts` is stamped HERE, at the moment of capture, which is the honest value —
        // this door exists precisely so the rep is not reconstructed hours later. (v4's
        // observed_at/ts_claimed machinery still applies on ingest.)
        ts: new Date().toISOString(),
        surface: flag("surface") || (track === "skill" ? "colab" : "gem"),
        track,
        concept: flag("concept"),
        // A skill rep MUST carry axis null (the contract's own rule); a concept rep
        // must carry a single letter. We pass the value through UNCHANGED so
        // capture's own validator gives the same verdict it would give a pasted rep.
        axis: track === "skill" ? null : axisRaw,
        question: flag("q") || flag("question"),
        confidence: flag("gut") || flag("confidence"),
        correct,
      };
      // latency_ms is written ONLY when actually supplied — never invented. The
      // genome's criterion_gated_pass reads it, and a fabricated number corrupts the
      // fluency ladder (the law is in SKILL.md and in this file's own header).
      if (lat !== undefined && Number.isFinite(Number(lat))) one.latency_ms = Number(lat);
      if (!one.concept || !one.question || !one.confidence || one.correct === undefined) {
        console.error("rep: --concept, --q, --gut and --correct are all required.");
        console.error('  node scripts/capture.mjs rep --concept hallucinations --axis a --q "kya hai" --gut shaky --correct true');
        console.error("  GUT-WORD LAW: --gut is what he committed BEFORE answering. No gut-word, no rep. Never re-graded after.");
        if (one.correct === undefined) {
          console.error(`  --correct must be literally true or false (got: ${flag("correct") === undefined ? "MISSING" : JSON.stringify(flag("correct"))}).`);
          console.error("  It is NEVER defaulted: a missing flag used to become `false` and write a miss he never made.");
        }
        process.exit(1);
      }
      cands = [one];
    } else {
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
      try { cands = parseBlob(text); }
      catch (e) { console.error(`paste: not valid JSON — nothing ingested (${e.message})`); process.exit(1); }
    }
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
    // FIRST, because it changes how every line under it must be read: if the registry is
    // down, "0 unregistered" means "nothing was checked", not "all clean". (10 Aug 2026)
    noticeRegistry(mode === "rep" ? "rep" : "paste", reg);
    // The two silences the 30 Jul audit found: an unknown concept, and a dropped line.
    // Both are now LOUD at the one place a human is looking.
    if (r.unregistered && r.unregistered.length) {
      console.log(`paste: ⚠ UNREGISTERED concept(s): ${r.unregistered.join(", ")} — these coined phantom topics.`);
      console.log(`paste:   add them to dressing-room/state/concepts.json (hand-curated canon — the captain's call), then reps retro-register on next load.`);
    }
    if (r.skipped_existing) {
      console.log(`paste: ⚠ ${r.skipped_existing} EXISTING line(s) in reps_log could not be read: ${r.skipped_reasons.join(" · ")}`);
      // 10 Aug 2026 — "Inspect that file" used to be the WHOLE notice, and nothing in
      // the organism read that file. The card is the notice now (see noticeQuarantine).
      if (!noticeQuarantine("paste", r)) {
        console.log(`paste:   nothing was rewritten this run, so they are still in reps_log. Inspect it before the next successful ingest.`);
      }
    }
    if (r.ts_corrected) console.log(`paste: ⚠ ${r.ts_corrected} rep(s) claimed a timestamp AFTER they arrived — ts corrected to the observed clock (ts_claimed keeps the original).`);
    if (r.errors.length) console.log(`  rejected reasons: ${r.errors.slice(0, 10).join("; ")}`);
    // P6.1 REPAIR — THE LANE'S PRODUCER (wiring audit, 10 Aug 2026). This gate read
    // `mode === "paste"`, which is the whole reason gemini_quality.jsonl had two wired
    // readers and had never once been written. The traced cause and the evidence live
    // in geminiBatchStats' header above — read it before touching this line again.
    // BOTH doors record now. There is no second engine to drift: `rep` and `paste`
    // already share one ingest, one validator and one writer lock, and what decides
    // what gets measured is the ROWS (surface "gem"), not which door they walked in.
    // `mode` rides along so the row can NAME its door — the label the 30-45d review
    // needs and the machine can actually prove.
    if (r.appended > 0) {
      const stats = geminiBatchStats(r.appended_rows, r.observed_at, mode);
      if (stats) {
        // 10 Aug 2026 — the write REPORTS now (see recordGeminiQuality): the success
        // line is printed only when the row is verified on disk. It used to print
        // either way, which is how a dead lane could look alive for weeks.
        const gq = recordGeminiQuality(GEMINI_QUALITY, stats);
        // the surrounding lines in this block have always printed a fixed "paste:"
        // prefix even on the `rep` door (a pre-existing wart this repair does not
        // widen); these lines carry the REAL door, because "which door" is now data.
        if (gq.ok) {
          console.log(`${mode}: gemini-quality row recorded (door ${mode} · n ${stats.n}/${stats.of_batch} gem · gut mix ${Object.entries(stats.confidence_mix).map(([k, v]) => `${k} ${v}`).join("/")} · correct ${Math.round(stats.correct_rate * 100)}%) → gemini_quality.jsonl`);
          // the §6.2 harvest note belongs to the OFF-MACHINE handoff, so it stays on
          // the paste door — an in-session `rep` does not need it once per rep.
          if (mode === "paste") console.log("paste: (Gemini ka TRANSCRIPT ab /harvest se aa sakta hai — jo sitting harvest hui, wahan process bhi dikhta hai. Yeh lane phir bhi sirf OUTCOME record karti hai; faisla 30-45d ke data ke baad. Cold check = day-end Examiner.)");
        } else {
          console.log(`${mode}: ⚠ gemini-quality row NOT recorded — ${gq.why}`);
          console.log(`${mode}:   your ${r.appended} rep(s) ARE safe in reps_log; only this batch's OUTCOME stats missed ${GEMINI_QUALITY}.`);
          console.log(gq.saved
            ? `${mode}:   the row was salvaged to ${gq.sidecar} — scout.mjs and the watchman count the LEDGER only, so until it is merged back this batch is invisible to both.`
            : `${mode}:   the salvage sidecar could not be written either — this batch's stats are LOST.`);
          console.log(`${mode}:   re-running this door does NOT recover it: the same reps dedup to 0 appended and no stats row is computed. Free the ledger file first.`);
        }
      }
    }
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
    // THE REGISTRY GATE's anchor on the unattended lane — the whole reason it is a card
    // and not a console line. This runs 14×/day into a stdout nobody reads. (10 Aug 2026)
    noticeRegistry("pull", reg);
    // The card is the ONLY reader this lane has (see pullFromInbox's header): whether
    // it was filed decides whether the rejection reached a human or died in capture.log.
    if (r.rejections && r.rejections.length) {
      console.log(r.carded
        ? `pull: ⚠ ${r.rejections.length} rejected rep(s) → captains_call (key capture:rejected:${localDate()}): ${r.card_said || "handed to the deck"}`
        : `pull: ⚠ ${r.rejections.length} rejected rep(s) and the card could NOT be filed${r.card_error ? ` (${r.card_error})` : ""} — nothing else reads this lane, so the reasons above are the only record.`);
    }
    // 10 Aug 2026 — THE LANE THAT NEEDED IT MOST. `pull` runs 14× a day with nobody
    // reading its stdout, so a quarantine here reached no one at all until the card.
    noticeQuarantine("pull", r);
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

  // THE QUARANTINE DOOR (10 Aug 2026) — the read end of the sidecar nothing read.
  if (mode === "quarantine") {
    const t = quarantineTriage(REPS_LOG, reg);
    if (!t.exists) { console.log(`quarantine: nothing parked — ${t.sidecar} does not exist (no reps_log line has ever been unreadable).`); process.exit(0); }
    console.log(`quarantine: ${t.parked} line(s) parked in ${t.sidecar} — ${t.recoverable.length} would come back today, ${t.already_back} already back in reps_log, ${t.broken.length} still broken.`);
    for (const b of t.broken.slice(0, 10)) console.log(`  ✗ ${b.why}\n     ${b.line.slice(0, 160)}`);
    if (t.broken.length > 10) console.log(`  … and ${t.broken.length - 10} more`);
    if (process.argv[3] !== "retry") {
      console.log(t.recoverable.length
        ? "quarantine: `node scripts/capture.mjs quarantine retry` puts the recoverable ones back through the front door (same validator, same dedupe). HIS word first — this is his corpus."
        : "quarantine: nothing is recoverable as-is. A broken line is TEXT: fix it in the sidecar by hand, then retry. Nothing here is ever deleted.");
      process.exit(0);
    }
    if (!t.recoverable.length) { console.log("quarantine retry: nothing recoverable — reps_log untouched."); process.exit(0); }
    const rr = ingest(REPS_LOG, t.recoverable, reg);
    console.log(`quarantine retry: appended ${rr.appended}, duplicates ${rr.duplicates}, rejected ${rr.rejected} → ${REPS_LOG} (total ${rr.total}). The sidecar is NOT cleared — a second retry dedups to 0.`);
    if (rr.appended > 0) console.log("quarantine retry: derived state does NOT yet include these — run `node scripts/heartbeat.mjs`.");
    process.exit(0);
  }

  console.log("THE SHARED CAPTURE LAYER (Agent #0)\n  node capture.mjs paste [file] [--chain]   append pasted Gem/Colab session JSON (--chain: recompute derived state now)\n  node capture.mjs rep --concept <c> --axis <a> --q \"<what was tested>\" --gut knew|shaky|guessed --correct true|false\n                                            ONE rep, as it happens — same validator as paste. --correct is never defaulted.\n  node capture.mjs pull [--no-chain]        ingest new reps from the Drive inbox (chains the heartbeat when reps land)\n  node capture.mjs quarantine [retry]       triage the reps parked out of reps_log (retry = re-ingest the recoverable ones)\n  node capture.mjs selftest                 run baked-mock checks");
  process.exit(0);
}

// Windows-safe entry guard (normalise argv[1] to a file:// URL, like timeaudit.mjs)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { validateRep, ingest, loadReps, pullFromInbox, keyOf, keyOfLegacy, loadRegistry, canonicalize, resolveClocks, chainHeartbeat, chainTimeoutMs, quarantinePathFor, enrichConcept, enrichConceptLegacy };
