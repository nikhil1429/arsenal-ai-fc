#!/usr/bin/env node
// ============================================================================
// fsrs.mjs · ARSENAL AI FC — AGENT #1: FSRS (spaced-repetition scheduler)
// ----------------------------------------------------------------------------
// WHAT:  A CONSUMER of dressing-room/state/reps_log.jsonl (Agent #0). It never
//        writes reps_log. It replays each concept's study history through the
//        real FSRS algorithm and emits a due/overdue schedule for the Manager.
// WHY:   Turns raw drill reps into "what should I review today, and what's
//        slipping" — deterministic, zero-LLM, no tokens.
//
// FSRS IMPLEMENTATION (vetted — NOT hand-rolled math):
//   ts-fsrs (npm) — FSRS-6.0, 21-weight default parameters. request_retention
//   0.90 (configurable via env FSRS_RETENTION). enable_fuzz=false → deterministic
//   (same reps always yield the same schedule; required for a reproducible selftest).
//   Version is read at runtime from node_modules/ts-fsrs/package.json.
//
// CARD UNIT = CONCEPT (stable identity across changing questions):
//   Card id = normalized concept string (trim + lowercase + collapse whitespace).
//   Every rep on that concept = one review event, replayed in ts order.
//
// RATING MAP (rep → FSRS grade):
//   incorrect         → Again (1)
//   correct + guessed → Hard  (2)
//   correct + shaky   → Good  (3)
//   correct + knew    → Easy  (4)
//
// TRACK FILTER (v2): ONLY reps with track=="concept" become FSRS cards.
//   track=="skill" (Python) reps are IGNORED — canon: Python is fluency (a #4
//   learning-state signal), not a decay-prone spaced-recall card.
//
// OUTPUTS (single writer = this file; both gitignored — personal study data):
//   dressing-room/state/cards.json      → { date, engine, request_retention,
//       total_cards, due_today, overdue, hardest_due:[concept...], status,
//       generated_at }  (Manager-facing summary, THE_MANAGER §10 shape;
//       status:"awaiting_data" when there are no reps yet).
//   dressing-room/state/fsrs_store.json → { date, engine, request_retention,
//       generated_at, cards:[{concept,id,stability,difficulty,last_review,due,
//       reps,lapses,state}] }  (per-card store).
//
// EMPTY-SAFE: no reps → cards.json = {due_today:0, overdue:0, hardest_due:[],
//   status:"awaiting_data"} and an empty store. NEVER fabricates a card.
//
// MODES:
//   node fsrs.mjs recompute   (default) — read reps_log → write cards.json + store
//   node fsrs.mjs selftest    — baked-mock asserts (no real state) → ALL CHECKS PASSED
//
// RULES (CONDUCTOR §4): deterministic · no API key · Node 22 ESM · Windows-safe
//   entry guard · atomic writes (temp→rename) · match CLAUDE.md + timeaudit.mjs.
// ============================================================================

// rmSync: selftest-only — the CAPSULE FLOOR block cleans up its own temp dir
// (E2E audit 25 Jul 2026 found it leaking one dir per run). Never used on state.
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fsrs, generatorParameters, createEmptyCard, Rating } from "ts-fsrs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const REPS_LOG  = join(STATE_DIR, "reps_log.jsonl");
const CARDS     = join(STATE_DIR, "cards.json");
const STORE     = join(STATE_DIR, "fsrs_store.json");

const CFG = {
  request_retention: clamp01(Number(process.env.FSRS_RETENTION)) ?? 0.90,   // target retention
  hardestDueMax: 8,                                                          // cap on hardest_due list
  // ORGANISM AUDIT #24 (4 Aug 2026) — THE LIVE-PATH REVIEW UNIT.
  // "local_day" = plan of record · "none" = the frozen pre-audit replay
  // (buildStoreLegacy). Named, not buried: flipping it back is one edit.
  review_unit: "local_day",
  // Which rep speaks for a collapsed day. "worst" = the lowest FSRS grade in the
  // day. See THE REVIEW UNIT below for why this direction and not the other.
  collapse_rating: "worst",
};

let TSFSRS_VERSION = "unknown";
try { TSFSRS_VERSION = JSON.parse(readFileSync(join(__dirname, "..", "node_modules", "ts-fsrs", "package.json"), "utf8")).version; } catch { /* keep 'unknown' */ }
const ENGINE = `fsrs-6 (ts-fsrs ${TSFSRS_VERSION})`;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function clamp01(x) { return (typeof x === "number" && !Number.isNaN(x) && x > 0 && x < 1) ? x : null; }
const CONF = new Set(["knew", "shaky", "guessed"]);
const normId = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
const round = (x, d = 4) => Math.round(x * 10 ** d) / 10 ** d;
const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

function validRep(r) {
  return r && typeof r === "object"
    && typeof r.ts === "string" && !Number.isNaN(Date.parse(r.ts))
    && typeof r.concept === "string" && r.concept.trim() !== ""
    && typeof r.correct === "boolean"
    && CONF.has(r.confidence)
    && r.track === "concept";   // CONCEPT-track only — skill (Python) reps are NOT cards (fluency = #4)
}

function ratingOf(r) {
  if (!r.correct) return Rating.Again;
  if (r.confidence === "guessed") return Rating.Hard;
  if (r.confidence === "shaky")  return Rating.Good;
  return Rating.Easy; // knew
}

// read reps_log (missing/empty = [] ; skip corrupt lines defensively)
function loadReps(path) {
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const s = line.trim(); if (!s) continue;
    try { const o = JSON.parse(s); if (validRep(o)) out.push(o); } catch { /* skip */ }
  }
  return out;
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// scan-fix 15 Jul — THE CAPSULE FLOOR: his gist capsules carry REAL review
// history (lockedOn = the passed Jirah; each reJirahDone = a passed re-weld,
// all dated) — yet FSRS waited on reps_log and told the Re-Jirah conductor
// "nothing due" about ground he MASTERED weeks ago. Locked history replays as
// knew-correct events (surface:"capsule") so the decay guard covers the
// locked book from day zero. NOT fabrication: no dated lock → no card, ever.
// Live reps on the same concept later merge into the same card (normId).
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// THE RE-JIRAH BRIDGE (organism audit #108, 6 Aug 2026)
// ---------------------------------------------------------------------------
// THE BUG: rejirah.mjs is the single writer of rejirah_log.jsonl and FSRS never
// opened that file — `grep -c rejirah_log scripts/fsrs.mjs` returned 0. So the
// two schedulers CLAIMED a division of labour ("FSRS owns WHEN a concept returns;
// Re-Jirah owns WHICH AXES and HOW HARD") while sharing no data at all. The only
// thing that crossed was the reJirahDone DATE, and the seeder below stamped every
// one of them `confidence:"knew", correct:true` — an unconditional Rating.Easy.
// Net effect: a round in which he cracked every axis, graded honestly, pushed the
// card's interval FURTHER OUT. The loop's own back edge punished honesty.
//
// Two things had to change, and neither is a new number:
//   1. GRADE, NOT ASSUMPTION. A reJirahDone date now inherits the ROUND'S REAL
//      RESULT: any axis cracked ⇒ correct:false. This mirrors the rule already
//      settled at #24 for same-day reps — the WORST grade speaks — because a round
//      is one review event and a partially-cracked round is not a clean recall.
//      The gut-word is the round's worst committed gut, never inferred (rejirah.mjs
//      refuses to derive gut from result for exactly this reason; so do we).
//   2. THE REAL CLOCK. rejirah.mjs deliberately records the DUE-date on a close row
//      (FORGE_SPEC §4; capsule_bridge tests `done.has(due)`), and that is correct
//      FOR THE CAPSULE. But FSRS is a spaced-repetition engine: feeding it a due-date
//      as a review TIMESTAMP replays the review inside the interval chain — closing
//      an overdue round today would stamp a review 42 days in the past. That also
//      defeated #24's same-day collapse, which can only let the worst grade speak
//      when the rows SHARE a local day. So we take the close row's own `ts` — the
//      moment he actually sat it, which rejirah.mjs has always preserved.
//
// A reJirahDone date with NO matching close row keeps the old behaviour verbatim
// (a knew/correct replay at the recorded date) — those are his hand-written gist
// entries from before the controller existed, and we have no grades for them. They
// are TAGGED `seed_basis:"legacy-gist"` so an unmeasured pass can never again be
// mistaken for a measured one.
function readRejirahRounds(path = join(STATE_DIR, "rejirah_log.jsonl")) {
  const grades = [];               // {ts, concept, axis, result, gut, round}
  const closes = [];               // {ts, concept, round, due, axes_graded}
  try {
    if (!existsSync(path)) return new Map();
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const s = line.trim(); if (!s) continue;
      try {
        const j = JSON.parse(s);
        if (!j || !j.concept) continue;
        if (j.kind === "round-close") closes.push(j);
        else if (j.axis) grades.push(j);
      } catch { }
    }
  } catch { return new Map(); }

  // Key on concept + the DUE date's calendar day, because that is the only field
  // the capsule's reJirahDone array carries back. Day-granularity, not instant:
  // the gist stores "2026-06-24", the close row stores a full ISO string.
  const dayOf = (d) => { const t = Date.parse(d); return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10); };
  const out = new Map();
  // A ROUND IS A TIME WINDOW, NOT AN AXIS NAME (verify pass, 6 Aug 2026).
  // First cut matched grades by `round` number with an axis-NAME fallback. But the
  // grade CLI (rejirah.mjs, the `grade` case) never passes a round number, so every
  // real row carries round:null and the fallback ALWAYS won — matching on concept +
  // axis letter with no time bound at all. Reproduced on a two-round fixture: round 2
  // held both axes on `knew` and still came back {cracked:true, worstGut:"guessed"},
  // having swallowed round 1's crack; and round 1 read round 2's rows too, so a later
  // crack retroactively dirtied an earlier clean round. Once he cracked an axis once,
  // that concept could never seed a clean round again and FSRS would lapse the card on
  // every close — the loop punishing honesty in a second, subtler way.
  // The window is the one rejirah.mjs's own `close` already uses: rows after the
  // PREVIOUS close for this concept, up to and including this one. Deriving it here
  // (rather than making the CLI stamp a round number) also repairs rows already on disk.
  const closesByConcept = new Map();
  for (const c of closes) {
    if (Number.isNaN(Date.parse(c.ts))) continue;
    const k = String(c.concept).toLowerCase().trim();
    if (!closesByConcept.has(k)) closesByConcept.set(k, []);
    closesByConcept.get(k).push(c);
  }
  for (const list of closesByConcept.values()) list.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  for (const c of closes) {
    const day = dayOf(c.due);
    if (!day || Number.isNaN(Date.parse(c.ts))) continue;
    const concept = String(c.concept).toLowerCase().trim();
    const siblings = closesByConcept.get(concept) || [];
    const idx = siblings.indexOf(c);
    const since = idx > 0 ? Date.parse(siblings[idx - 1].ts) : -Infinity;   // the previous round's close
    const until = Date.parse(c.ts);
    // Round number is still honoured WHEN BOTH SIDES CARRY ONE — a future CLI that
    // stamps it stays exact — but the time window is what actually decides today.
    const named = new Set(Array.isArray(c.axes_graded) ? c.axes_graded : []);
    const mine = grades.filter((g) => {
      if (String(g.concept).toLowerCase().trim() !== concept) return false;
      const t = Date.parse(g.ts);
      if (Number.isNaN(t) || t <= since || t > until) return false;          // this round's window only
      if (c.round != null && g.round != null) return g.round === c.round;
      return named.size ? named.has(g.axis) : true;
    });
    const cracked = mine.some((g) => g.result === "cracked");
    // WORST gut wins, same principle as the worst grade. Never inferred: a round
    // with no committed gut-word stays null and the caller keeps "knew" rather than
    // inventing a confidence he did not state.
    const rank = { guessed: 3, shaky: 2, knew: 1 };
    const worstGut = mine.map((g) => g.gut).filter(Boolean)
      .sort((a, b) => (rank[b] || 0) - (rank[a] || 0))[0] || null;
    out.set(`${concept}|${day}`, { ts: c.ts, cracked, worstGut, graded: mine.length });
  }
  return out;
}

function capsuleSeedReps(dir = join(STATE_DIR, "capsules"), rounds = readRejirahRounds()) {
  const out = [];
  try {
    for (const f of readdirSync(dir).filter(x => x.endsWith(".json"))) {
      try {
        const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
        const concept = String(j.id || f.replace(".json", "")).trim();
        if (!concept) continue;
        const dates = [];
        if (j.lockedOn && !Number.isNaN(Date.parse(j.lockedOn))) dates.push(j.lockedOn);
        for (const d of (Array.isArray(j.reJirahDone) ? j.reJirahDone : [])) if (d && !Number.isNaN(Date.parse(d))) dates.push(d);
        // E2E audit 25 Jul 2026 found: dates were emitted raw, so a capsule whose
        // re-weld happened ON the lock day (lockedOn also listed in reJirahDone), or
        // a duplicated entry in the gist array, replayed TWO Easy reviews at the exact
        // same instant. FSRS treats them as two real recalls: card.reps inflates and
        // the zero-elapsed second review still raises stability → the card's `due`
        // is pushed further out than his actual history earns, and the decay guard
        // goes quiet on ground he has NOT re-welded. Same instant = one event, so
        // dedupe on the normalized ISO timestamp (not the raw string: "2026-06-15"
        // and "2026-06-15T00:00:00Z" are the same moment and must collapse too).
        // Set preserves insertion order → lock stays first, chronology unchanged.
        // #24's dedupe rule is UNCHANGED — same instant = one event — but it now runs
        // on the FINAL timestamp, after a matched round has swapped its due-date for
        // the moment he actually sat it. Deduping before the swap would collapse the
        // wrong pairs. The lock is always index 0 when present and is never looked up
        // in the round map: a lock IS the passed Jirah by definition, not a re-weld.
        const lockIso = (j.lockedOn && !Number.isNaN(Date.parse(j.lockedOn))) ? new Date(j.lockedOn).toISOString() : null;
        const key = concept.toLowerCase().trim();
        const seen = new Set();
        for (const d of dates) {
          const rawIso = new Date(d).toISOString();
          const round = rawIso === lockIso ? null : rounds.get(`${key}|${rawIso.slice(0, 10)}`);
          const ts = round ? new Date(round.ts).toISOString() : rawIso;
          if (Number.isNaN(Date.parse(ts)) || seen.has(ts)) continue;
          seen.add(ts);
          out.push({
            ts, surface: "capsule", track: "concept", concept,
            question: `capsule lock/re-weld (${concept})`,
            // A graded round speaks for itself; an ungraded date keeps the frozen
            // legacy assumption AND says so, so the two can never be confused again.
            confidence: round ? (round.worstGut || "knew") : "knew",
            correct: round ? !round.cracked : true,
            seed_basis: round ? "rejirah-graded" : "legacy-gist",
          });
        }
      } catch { }
    }
  } catch { }
  return out;
}

// ---------------------------------------------------------------------------
// THE REVIEW UNIT (organism audit #24, 4 Aug 2026)
// ---------------------------------------------------------------------------
// THE BUG, in the captain's own ledger: reps_log.jsonl rows 3-6 read
// 20:28:02.795Z · 20:28:03.795Z · 20:28:04.795Z · 21:58:02.795Z — four reps across
// ninety minutes sharing one millisecond, three of them exactly 1000 ms apart.
// Those timestamps were AUTHORED by the model (the forge skill tells it to write
// `ts`), never measured. buildStore then replayed them as three separate FSRS
// reviews with elapsed_days = 0 between them — precisely the failure capsuleSeedReps
// was patched to avoid for capsule dates (:147) and left unguarded on the live path.
// Measured effect on the live card: stability 0.0265 against 0.3760 at honest spacing.
//
// WHY THE UNIT IS THE CALENDAR DAY, AND WHY THAT IS NOT A GUESSED THRESHOLD.
// The audit's own suggestion was "closer together than a few minutes = one event",
// but a few minutes is a number nobody measured. FSRS does not need one: its unit of
// account IS the day. ts-fsrs computes elapsed_days by flooring the millisecond gap
// to whole days, so two reviews inside one day carry elapsed_days = 0 — they are
// arithmetically incapable of contributing interval information. Collapsing them
// therefore DESTROYS NOTHING FSRS can use, while NOT collapsing them manufactures
// review events that never happened. The unit is read off the algorithm's own
// resolution, not chosen. (Live consequence, stated so it is not a surprise: the
// seven `hallucinations` reps all fall on IST 31 Jul, so the card goes from a
// fabricated 7 reviews to its real 1.)
//
// WHICH REP SPEAKS FOR THE DAY — the WORST grade in it. He probed `hallucinations`
// on nine axes in one sitting and broke on several; taking the best (or the last,
// which in a FORGE session is usually post-teaching) would let one lucky axis
// certify a concept he did not hold. Worst is the conservative direction, the same
// direction calibration's danger zone and learning-state's ladder already take. The
// day's LAST instant is used as the review time so chronology is unchanged.
//
// THE CAPTAIN'S MIDNIGHT, not Greenwich's — the same boundary touchline.mjs:65 and
// scorer.mjs already run on. localDate() is local by construction.
const localDayOf = (ts) => { const d = new Date(ts); return Number.isNaN(d.getTime()) ? String(ts).slice(0, 10) : localDate(d); };

// Groups one concept's chronologically-sorted reps into review EVENTS.
// cfg.review_unit === "none" ⇒ one event per rep, i.e. the frozen legacy behaviour.
function collapseReviews(sorted, cfg) {
  if (!cfg || cfg.review_unit !== "local_day") return sorted.map((r) => ({ rep: r, merged: 1, day: localDayOf(r.ts) }));
  const groups = [];
  for (const r of sorted) {
    const day = localDayOf(r.ts);
    const cur = groups[groups.length - 1];
    if (cur && cur.day === day) { cur.reps.push(r); continue; }
    groups.push({ day, reps: [r] });
  }
  return groups.map((g) => {
    const last = g.reps[g.reps.length - 1];
    let speaks = last;
    if (cfg.collapse_rating === "worst") for (const r of g.reps) if (ratingOf(r) < ratingOf(speaks)) speaks = r;
    // the day's LAST instant, carrying the day's WORST grade
    return { rep: { ...last, confidence: speaks.confidence, correct: speaks.correct }, merged: g.reps.length, day: g.day };
  });
}

// ---------------------------------------------------------------------------
// core — replay reps into per-concept FSRS cards
// ---------------------------------------------------------------------------
// FROZEN (layering law) — the pre-#24 replay, byte-for-byte. It is what produced
// every fsrs_store.json on disk today, so it stays readable and callable: a future
// reader comparing the two schedules must be able to run both.
function buildStoreLegacy(reps, f) {
  const groups = new Map();               // id -> { display, reps:[] }
  for (const r of reps) {
    if (!validRep(r)) continue;
    const id = normId(r.concept);
    if (!id) continue;
    if (!groups.has(id)) groups.set(id, { display: r.concept, reps: [] });
    const g = groups.get(id);
    g.display = r.concept;                 // last-seen original text = display
    g.reps.push(r);
  }
  const store = [];
  for (const [id, g] of groups) {
    const sorted = g.reps.slice().sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    let card = createEmptyCard(new Date(sorted[0].ts));
    for (const r of sorted) card = f.next(card, new Date(r.ts), ratingOf(r)).card;
    store.push({
      concept: g.display, id,
      stability: round(card.stability),
      difficulty: round(card.difficulty),
      last_review: card.last_review ? new Date(card.last_review).toISOString() : null,
      due: new Date(card.due).toISOString(),
      reps: card.reps, lapses: card.lapses, state: card.state,
    });
  }
  return store;
}

// PLAN OF RECORD (#24): the same replay, against the review UNIT rather than
// against whatever millisecond the model happened to author. Every card now carries
// its own arithmetic — raw_reps, review_events, collapsed — so the number FSRS acted
// on is inspectable beside the number he actually logged. cfg is trailing +
// optional so every pre-existing 2-arg caller keeps working (layering, never replace).
function buildStore(reps, f, cfg = CFG) {
  const groups = new Map();               // id -> { display, reps:[] }
  for (const r of reps) {
    if (!validRep(r)) continue;
    const id = normId(r.concept);
    if (!id) continue;
    if (!groups.has(id)) groups.set(id, { display: r.concept, reps: [] });
    const g = groups.get(id);
    g.display = r.concept;                 // last-seen original text = display
    g.reps.push(r);
  }
  const store = [];
  for (const [id, g] of groups) {
    const sorted = g.reps.slice().sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    // THE ONE CHANGED LINE, and everything below it is unchanged: FSRS is handed
    // review EVENTS, not raw reps. With review_unit "none" this is the identity
    // transform and buildStore is buildStoreLegacy.
    const events = collapseReviews(sorted, cfg);
    let card = createEmptyCard(new Date(events[0].rep.ts));
    for (const e of events) card = f.next(card, new Date(e.rep.ts), ratingOf(e.rep)).card;
    store.push({
      concept: g.display, id,
      stability: round(card.stability),
      difficulty: round(card.difficulty),
      last_review: card.last_review ? new Date(card.last_review).toISOString() : null,
      due: new Date(card.due).toISOString(),
      reps: card.reps, lapses: card.lapses, state: card.state,
      // #24 — the arithmetic, on the bus. `reps` is what FSRS scheduled from;
      // raw_reps is what he actually logged. Reporting only one of them is how the
      // authored-timestamp fiction stayed invisible for a fortnight.
      raw_reps: sorted.length, review_events: events.length,
      collapsed: sorted.length - events.length,
      review_unit: (cfg && cfg.review_unit) || "none",
    });
  }
  return store;
}

// classify due vs overdue vs future against `now`; rank hardest by soonest-due, then lowest-stability
function bucketize(store, now, cfg) {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  let overdue = 0, due_today = 0;
  const dueCards = [];
  for (const c of store) {
    const due = new Date(c.due);
    if (due < start) { overdue++; dueCards.push(c); }
    else if (due < end) { due_today++; dueCards.push(c); }
  }
  dueCards.sort((a, b) => (Date.parse(a.due) - Date.parse(b.due)) || (a.stability - b.stability));
  const hardest_due = dueCards.slice(0, cfg.hardestDueMax).map((c) => c.concept);
  return { overdue, due_today, hardest_due };
}

function compute(reps, now, cfg, f) {
  const store = buildStore(reps, f, cfg);
  const b = bucketize(store, now, cfg);
  const date = localDate(now);
  const generated_at = new Date(now).toISOString();
  // #24 — the collapse, summed across every card, so the difference between what he
  // logged and what FSRS scheduled from is a printed number and not an inference.
  const raw = store.reduce((a, c) => a + (c.raw_reps || 0), 0);
  const events = store.reduce((a, c) => a + (c.review_events || 0), 0);
  const cards = {
    date, engine: ENGINE, request_retention: cfg.request_retention,
    total_cards: store.length,
    due_today: b.due_today, overdue: b.overdue, hardest_due: b.hardest_due,
    status: store.length ? "ok" : "awaiting_data",
    // ORGANISM AUDIT #106 — THE UNGATE. A refusal must be a measurement with its
    // denominator shown, never the bare word. fsrs's only gate is "does one card
    // exist", so it says so with its n rather than saying "awaiting_data" and
    // leaving the captain to guess how far off he is.
    gate: {
      have: store.length, need: 1, unit: "cards",
      line: `${store.length}/1 cards`,
      open: store.length >= 1,
      withheld: store.length ? [] : ["due_today", "overdue", "hardest_due"],
    },
    collapse: {
      unit: (cfg.review_unit || "none"), rating: cfg.collapse_rating || null,
      raw_reps: raw, review_events: events, collapsed: raw - events,
      line: `${events}/${raw} review events (${raw - events} same-day reps merged)`,
      note: "FSRS schedules in whole days; reps inside one day carry elapsed_days=0 and cannot inform an interval (organism audit #24)",
    },
    generated_at,
  };
  const fsrsStore = { date, engine: ENGINE, request_retention: cfg.request_retention, generated_at, cards: store };
  return { cards, fsrsStore };
}

// ---------------------------------------------------------------------------
// selftest — baked mock (no real state touched)
// ---------------------------------------------------------------------------
function selftest() {
  const f = fsrs(generatorParameters({ request_retention: 0.90, enable_fuzz: false }));
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const iso = (ms) => new Date(ms).toISOString();
  const intervalDays = (c) => (Date.parse(c.due) - Date.parse(c.last_review)) / 86400000;

  // --- FSRS replay: sustained-correct lengthens interval; a lapse resets it ---
  const growth = [
    { ts: "2026-07-01T09:00:00Z", surface: "gem", track: "concept", concept: "growth", question: "g1", confidence: "knew",  correct: true },
    { ts: "2026-07-05T09:00:00Z", surface: "gem", track: "concept", concept: "growth", question: "g2", confidence: "shaky", correct: true },
    { ts: "2026-07-15T09:00:00Z", surface: "gem", track: "concept", concept: "growth", question: "g3", confidence: "knew",  correct: true },
  ];
  const lapse = [
    { ts: "2026-07-01T09:00:00Z", surface: "gem", track: "concept", concept: "lapse", question: "l1", confidence: "knew",    correct: true },
    { ts: "2026-07-05T09:00:00Z", surface: "gem", track: "concept", concept: "lapse", question: "l2", confidence: "shaky",   correct: true },
    { ts: "2026-07-15T09:00:00Z", surface: "gem", track: "concept", concept: "lapse", question: "l3", confidence: "guessed", correct: false }, // lapse
  ];
  const store = buildStore([...growth, ...lapse], f);
  const gC = store.find((c) => c.id === "growth");
  const lC = store.find((c) => c.id === "lapse");
  assert("correct reviews lengthen interval (growth interval ≥ 7d)", intervalDays(gC) >= 7);
  assert("incorrect resets interval (lapse interval < 2d)", intervalDays(lC) < 2);
  assert("sustained-correct interval > lapsed interval", intervalDays(gC) > intervalDays(lC));

  // --- v2: skill-track reps are IGNORED by FSRS (Python fluency ≠ spaced-recall card) ---
  const skill = [{ ts: "2026-07-01T09:00:00Z", surface: "colab", track: "skill", concept: "pydantic", question: "s1", confidence: "knew", correct: true }];
  const storeSkill = buildStore([...growth, ...skill], f);
  assert("skill-track rep ⇒ ZERO cards", !storeSkill.some((c) => c.id === "pydantic"));
  assert("concept-track mocks still produce cards", storeSkill.some((c) => c.id === "growth"));

  // --- bucketize: due / overdue counts ---
  const now = new Date(2026, 7, 1, 12, 0, 0); // Aug 1 2026, local noon
  const D = (offMs) => iso(now.getTime() + offMs);
  const synth = [
    { concept: "over2", id: "over2", due: D(-2 * 86400000), stability: 1 },
    { concept: "over1", id: "over1", due: D(-1 * 86400000), stability: 5 },
    { concept: "today", id: "today", due: D(+1 * 3600000),  stability: 2 },
    { concept: "future", id: "future", due: D(+8 * 86400000), stability: 9 },
  ];
  const b = bucketize(synth, now, CFG);
  assert("due/overdue counts (overdue=2, due_today=1)", b.overdue === 2 && b.due_today === 1);

  // --- hardest_due ranks by soonest-due, then lowest-stability ---
  assert("hardest_due ordered soonest-due first", JSON.stringify(b.hardest_due) === JSON.stringify(["over2", "over1", "today"]));
  const tie = [
    { concept: "tieHigh", id: "tieHigh", due: D(-3 * 86400000), stability: 9 },
    { concept: "tieLow",  id: "tieLow",  due: D(-3 * 86400000), stability: 2 },
  ];
  const bt = bucketize(tie, now, CFG);
  assert("hardest_due tie-break by lowest-stability", bt.hardest_due[0] === "tieLow");

  // --- empty-safe ---
  const empty = compute([], now, CFG, f);
  assert("empty-safe: status awaiting_data, zero counts, no cards", empty.cards.status === "awaiting_data" && empty.cards.due_today === 0 && empty.cards.overdue === 0 && empty.cards.hardest_due.length === 0 && empty.fsrsStore.cards.length === 0);

  // --- scan-fix 15 Jul: THE CAPSULE FLOOR (real dates in, cards out; never fabricated) ---
  {
    const tmp = join(tmpdir(), `fsrs-caps-${Date.now()}`);
    // E2E audit 25 Jul 2026 found: this block created the temp dir and never removed
    // it, so every organism-doctor health check left another fsrs-caps-* dir in %TEMP%
    // forever. try/finally + rmSync mirrors capture.mjs's selftest cleanup. Scoped to
    // this dir only — selftest touches no real state, and main() never calls rmSync.
    try {
    mkdirSync(tmp, { recursive: true });
    writeFileSync(join(tmp, "tokenization.json"), JSON.stringify({ id: "tokenization", lockedOn: "2026-06-15", reJirahDone: ["2026-06-18", "2026-06-29"] }));
    writeFileSync(join(tmp, "embeddings.json"), JSON.stringify({ id: "embeddings", lockedOn: "2026-06-21", reJirahDone: [] }));
    writeFileSync(join(tmp, "broken.json"), JSON.stringify({ id: "broken" }));                     // no dated lock → no card
    const seeds = capsuleSeedReps(tmp);
    assert("CAPSULE FLOOR: lock + each re-weld replay as dated knew-correct events", seeds.length === 4 && seeds.every(r => r.surface === "capsule" && r.confidence === "knew" && r.correct === true && r.track === "concept"));
    assert("CAPSULE FLOOR: an undated capsule seeds NOTHING (never fabricated)", !seeds.some(r => r.concept === "broken"));
    const capStore = buildStore(seeds, f);
    assert("CAPSULE FLOOR: one card per locked concept, real review counts", capStore.length === 2 && capStore.find(c => c.id === "tokenization").reps === 3 && capStore.find(c => c.id === "embeddings").reps === 1);
    const capB = bucketize(capStore, new Date(2026, 6, 15, 12, 0, 0), CFG);   // 15 Jul: weeks past the single-review locks
    assert("CAPSULE FLOOR: weeks-old single-review locks come due (the decay guard is ON)", capB.overdue + capB.due_today >= 1 && capB.hardest_due.length >= 1);
    // live reps on the same concept MERGE into the capsule card (one identity)
    const merged = buildStore([...seeds, { ts: "2026-07-10T09:00:00Z", surface: "gem", track: "concept", concept: "embeddings", question: "m1", confidence: "shaky", correct: true }], f);
    assert("CAPSULE FLOOR: a live rep merges into the capsule card (normId identity)", merged.find(c => c.id === "embeddings").reps === 2);

    // E2E audit 25 Jul 2026 regression: same-instant duplicate dates must collapse.
    // Own sub-dir (not *.json → capsuleSeedReps skips it above, so the counts asserted
    // there stay exactly as they were). `dupe` locked 15 Jun with a same-day re-weld
    // AND a repeated gist entry: 4 raw dates, 2 distinct instants. Pre-fix this emitted
    // 4 seeds → card.reps 4 with three zero-elapsed Easy reviews inflating stability.
    const dupDir = join(tmp, "dupe-case");
    mkdirSync(dupDir, { recursive: true });
    writeFileSync(join(dupDir, "dupe.json"), JSON.stringify({ id: "dupe", lockedOn: "2026-06-15", reJirahDone: ["2026-06-15T00:00:00.000Z", "2026-06-29", "2026-06-29"] }));
    const dupSeeds = capsuleSeedReps(dupDir);
    assert("CAPSULE FLOOR: same-instant dates dedupe (4 raw dates ⇒ 2 review events)", dupSeeds.length === 2 && dupSeeds[0].ts === "2026-06-15T00:00:00.000Z" && dupSeeds[1].ts === "2026-06-29T00:00:00.000Z");
    const dupStore = buildStore(dupSeeds, f);
    assert("CAPSULE FLOOR: dedupe ⇒ card.reps is the REAL review count (2, not 4)", dupStore.length === 1 && dupStore[0].reps === 2);
    // --- ORGANISM AUDIT #108 (6 Aug 2026): THE RE-JIRAH BRIDGE ---------------
    // Pre-fix, FSRS never opened rejirah_log.jsonl and stamped EVERY reJirahDone
    // date knew/correct. A round where he honestly cracked every axis therefore
    // replayed as Rating.Easy and pushed the card FURTHER out — the back edge
    // punished honesty. These assertions are the lock on both halves of the fix.
    const rjDir = join(tmp, "rejirah-case");
    mkdirSync(rjDir, { recursive: true });
    writeFileSync(join(rjDir, "cracked.json"), JSON.stringify({ id: "cracked", lockedOn: "2026-06-01", reJirahDone: ["2026-06-24"] }));
    writeFileSync(join(rjDir, "held.json"), JSON.stringify({ id: "held", lockedOn: "2026-06-01", reJirahDone: ["2026-06-24"] }));
    writeFileSync(join(rjDir, "legacy.json"), JSON.stringify({ id: "legacy", lockedOn: "2026-06-01", reJirahDone: ["2026-06-24"] }));
    const rjLog = join(tmp, "rejirah_log.jsonl");
    writeFileSync(rjLog, [
      // a round he SAT on 5 Aug for a due-date of 24 Jun — one axis cracked
      { ts: "2026-06-20T10:00:00.000Z", concept: "cracked", axis: "a", result: "held", gut: "shaky", round: 1 },
      { ts: "2026-06-20T10:05:00.000Z", concept: "cracked", axis: "b", result: "cracked", gut: "guessed", round: 1 },
      { ts: "2026-08-05T18:00:00.000Z", concept: "cracked", kind: "round-close", round: 1, due: "2026-06-24", axes_graded: ["a", "b"] },
      // a round where every axis held
      { ts: "2026-06-20T11:00:00.000Z", concept: "held", axis: "a", result: "held", gut: "knew", round: 1 },
      { ts: "2026-08-05T19:00:00.000Z", concept: "held", kind: "round-close", round: 1, due: "2026-06-24", axes_graded: ["a"] },
    ].map(r => JSON.stringify(r)).join("\n") + "\n");
    const rounds = readRejirahRounds(rjLog);
    const rjSeeds = capsuleSeedReps(rjDir, rounds);
    const seedFor = (c) => rjSeeds.filter(s => s.concept === c);
    const reweld = (c) => seedFor(c).find(s => s.seed_basis !== undefined && s.ts !== "2026-06-01T00:00:00.000Z");
    assert("#108 a CRACKED round seeds correct:false — honesty no longer reads as Easy",
      reweld("cracked").correct === false && reweld("cracked").seed_basis === "rejirah-graded");
    assert("#108 the round's WORST gut speaks (guessed beats shaky), never inferred from the result",
      reweld("cracked").confidence === "guessed");
    assert("#108 an all-HELD round still seeds correct:true",
      reweld("held").correct === true && reweld("held").confidence === "knew");
    assert("#108 the review is stamped when he SAT it, not the backdated due-date",
      reweld("cracked").ts === "2026-08-05T18:00:00.000Z" && reweld("held").ts === "2026-08-05T19:00:00.000Z");
    assert("#108 a reJirahDone with NO close row keeps the frozen legacy replay, and SAYS so",
      reweld("legacy").correct === true && reweld("legacy").ts === "2026-06-24T00:00:00.000Z" && reweld("legacy").seed_basis === "legacy-gist");
    assert("#108 the LOCK is never looked up in the round map — a lock IS the passed Jirah",
      seedFor("cracked").find(s => s.ts === "2026-06-01T00:00:00.000Z").correct === true);
    assert("#108 a missing rejirah_log is empty-safe (no throw, every date reads legacy)",
      readRejirahRounds(join(tmp, "nope.jsonl")).size === 0 && capsuleSeedReps(rjDir, new Map()).every(s => s.seed_basis === "legacy-gist" || s.correct === true));
    // THE TWO-ROUND FIXTURE THE FIRST CUT DID NOT HAVE (verify pass, 6 Aug 2026).
    // Every assertion above hand-writes round:1 on its grade rows — a shape the live
    // CLI never produces, because `rejirah.mjs grade` passes no round number at all.
    // So the axis-name fallback ran unbounded in production while the suite stayed
    // green. These rows carry round:null ON PURPOSE: this is the real shape.
    const twoRoundLog = join(tmp, "two_rounds.jsonl");
    writeFileSync(twoRoundLog, [
      // R1 — he cracked b
      { ts: "2026-07-01T10:00:00.000Z", concept: "twin", axis: "a", result: "held", gut: "knew", round: null },
      { ts: "2026-07-01T10:05:00.000Z", concept: "twin", axis: "b", result: "cracked", gut: "guessed", round: null },
      { ts: "2026-07-01T18:00:00.000Z", concept: "twin", kind: "round-close", round: null, due: "2026-07-02", axes_graded: ["a", "b"] },
      // R2 — a month later, BOTH held cleanly. The same two axis letters.
      { ts: "2026-08-01T10:00:00.000Z", concept: "twin", axis: "a", result: "held", gut: "knew", round: null },
      { ts: "2026-08-01T10:05:00.000Z", concept: "twin", axis: "b", result: "held", gut: "knew", round: null },
      { ts: "2026-08-01T18:00:00.000Z", concept: "twin", kind: "round-close", round: null, due: "2026-08-02", axes_graded: ["a", "b"] },
    ].map(r => JSON.stringify(r)).join("\n") + "\n");
    const tr = readRejirahRounds(twoRoundLog);
    const r1 = tr.get("twin|2026-07-02"), r2 = tr.get("twin|2026-08-02");
    assert("#108 R2 — a clean round stays clean; it does NOT inherit R1's crack (round:null, the real CLI shape)",
      r2 && r2.cracked === false && r2.worstGut === "knew" && r2.graded === 2);
    assert("#108 R1 — an earlier round is not retroactively rewritten by a later one",
      r1 && r1.cracked === true && r1.worstGut === "guessed" && r1.graded === 2);
    assert("#108 each round sees ONLY its own window (2 grades each, never all 4)",
      r1.graded === 2 && r2.graded === 2);

    // The whole point: the cracked card must now be due SOONER than the held one.
    const crackedCard = buildStore(seedFor("cracked"), f)[0];
    const heldCard = buildStore(seedFor("held"), f)[0];
    assert("#108 a cracked round pulls the card IN, an all-held round pushes it OUT",
      new Date(crackedCard.due).getTime() < new Date(heldCard.due).getTime() && crackedCard.stability < heldCard.stability);
    } finally {
      rmSync(tmp, { recursive: true, force: true });   // no fsrs-caps-* left behind
    }
  }

  // --- ORGANISM AUDIT #24 (4 Aug 2026): THE REVIEW UNIT ----------------------
  // The live ledger's own shape: a FORGE burst whose timestamps the MODEL wrote —
  // three reps one second apart, then a fourth ninety minutes later, all on one
  // calendar day. Pre-fix this replayed as FOUR reviews with elapsed_days = 0.
  {
    const burstDay = (h, m, s, ms, conf, correct) => ({
      ts: new Date(2026, 6, 31, h, m, s, ms).toISOString(), surface: "gem", track: "concept",
      concept: "hallucinations", question: "Bolo.", confidence: conf, correct,
    });
    const burst = [
      burstDay(20, 28, 2, 795, "guessed", false),
      burstDay(20, 28, 3, 795, "guessed", false),
      burstDay(20, 28, 4, 795, "knew", true),
      burstDay(21, 58, 2, 795, "shaky", true),
    ];
    const legacy = buildStoreLegacy(burst, f)[0];
    const fixed = buildStore(burst, f, CFG)[0];
    assert("#24 the FROZEN legacy replay still counts the authored burst as 4 reviews (it is kept, not deleted)",
      legacy.reps === 4);
    assert("#24 the live path now replays one calendar day as ONE review event, and shows its arithmetic",
      fixed.reps === 1 && fixed.review_events === 1 && fixed.raw_reps === 4 && fixed.collapsed === 3);
    // ASSERT THE REAL INVARIANT, not a downstream side-effect. (The first draft of
    // this check asserted `lapses === 1` on both engines; ts-fsrs does not count a
    // FIRST review as a lapse — a New card graded Again is learning, not a relapse —
    // so both read 0 and the assertion proved nothing about which grade won. What is
    // actually being claimed is that the day's WORST grade, at the day's LAST
    // instant, is what FSRS is handed.)
    const sortedBurst = burst.slice().sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    const ev = collapseReviews(sortedBurst, CFG);
    assert("#24 the WORST grade in the day speaks for it, at the day's LAST instant (a lucky axis cannot certify a broken concept)",
      ev.length === 1 && ev[0].merged === 4
      && ratingOf(ev[0].rep) === Math.min(...sortedBurst.map(ratingOf))
      && ev[0].rep.correct === false && ev[0].rep.confidence === "guessed"
      && ev[0].rep.ts === sortedBurst[sortedBurst.length - 1].ts);
    assert("#24 ...and 'worst' is a NAMED knob: turning it off lets the day's last rep speak instead",
      collapseReviews(sortedBurst, { ...CFG, collapse_rating: "last" })[0].rep.confidence === "shaky");
    assert("#24 zero-elapsed replays really did move the schedule — the two stabilities differ",
      legacy.stability !== fixed.stability);

    // ...and a genuine multi-day history is UNTOUCHED: this must fix the fiction
    // without flattening real spacing, which is the whole point.
    const spread = [
      { ts: "2026-07-01T09:00:00Z", surface: "gem", track: "concept", concept: "spread", question: "s1", confidence: "knew", correct: true },
      { ts: "2026-07-05T09:00:00Z", surface: "gem", track: "concept", concept: "spread", question: "s2", confidence: "knew", correct: true },
      { ts: "2026-07-15T09:00:00Z", surface: "gem", track: "concept", concept: "spread", question: "s3", confidence: "knew", correct: true },
    ];
    const sp = buildStore(spread, f, CFG)[0];
    assert("#24 three reps on three different days stay THREE reviews (real spacing is never flattened)",
      sp.reps === 3 && sp.review_events === 3 && sp.collapsed === 0
      && JSON.stringify(buildStoreLegacy(spread, f)[0].due) === JSON.stringify(sp.due));

    // the unit is a NAMED knob, and turning it off restores the frozen engine exactly
    const off = buildStore(burst, f, { ...CFG, review_unit: "none" })[0];
    assert("#24 review_unit:'none' reproduces the frozen legacy schedule byte-for-byte (the switch is real)",
      off.reps === legacy.reps && off.stability === legacy.stability && off.due === legacy.due);

    // the capsule floor rides the same unit and is NOT disturbed: its dates are
    // already one-per-instant, and distinct days stay distinct.
    const capsuleLike = [
      { ts: "2026-06-15T00:00:00.000Z", surface: "capsule", track: "concept", concept: "cap", question: "lock", confidence: "knew", correct: true },
      { ts: "2026-06-29T00:00:00.000Z", surface: "capsule", track: "concept", concept: "cap", question: "reweld", confidence: "knew", correct: true },
    ];
    assert("#24 capsule seeds on distinct days are untouched by the collapse (capsuleSeedReps is not touched at all)",
      buildStore(capsuleLike, f, CFG)[0].reps === 2 && buildStore(capsuleLike, f, CFG)[0].collapsed === 0);

    // and the counter reaches cards.json, where a human reads it
    const cc = compute(burst, new Date(2026, 7, 1, 12, 0, 0), CFG, f).cards;
    assert("#24 cards.json carries the collapse arithmetic (raw vs scheduled), never just the scheduled number",
      cc.collapse.raw_reps === 4 && cc.collapse.review_events === 1 && cc.collapse.collapsed === 3 && cc.collapse.line.includes("1/4"));
  }

  // --- ORGANISM AUDIT #106: the status line is a have/need counter ------------
  {
    const now106 = new Date(2026, 7, 1, 12, 0, 0);
    const g0 = compute([], now106, CFG, f).cards;
    const g1 = compute(growth, now106, CFG, f).cards;
    assert("#106 an empty schedule says 0/1 cards with its denominator, not just 'awaiting_data'",
      g0.status === "awaiting_data" && g0.gate.line === "0/1 cards" && g0.gate.open === false && g0.gate.withheld.includes("hardest_due"));
    assert("#106 ...and the counter tracks the real n once cards exist",
      g1.gate.have === 1 && g1.gate.open === true && g1.gate.line === "1/1 cards" && g1.gate.withheld.length === 0);
  }

  const passed = checks.every(([, ok]) => ok);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  const mode = (process.argv[2] || "recompute").toLowerCase();
  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }

  const reps = [...capsuleSeedReps(), ...loadReps(REPS_LOG)];   // the capsule floor + his live reps, one card per concept
  const f = fsrs(generatorParameters({ request_retention: CFG.request_retention, enable_fuzz: false }));
  const { cards, fsrsStore } = compute(reps, new Date(), CFG, f);
  writeAtomic(CARDS, cards);
  writeAtomic(STORE, fsrsStore);
  console.log(`fsrs: ${cards.status} (${cards.gate.line}) — ${cards.total_cards} cards · due_today ${cards.due_today} · overdue ${cards.overdue} · hardest [${cards.hardest_due.join(", ") || "-"}] · ${cards.collapse.line}  →  ${CARDS}`);
  process.exit(0);
}

// Windows-safe entry guard (like timeaudit.mjs / capture.mjs)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { buildStore, buildStoreLegacy, collapseReviews, localDayOf, bucketize, compute, ratingOf, normId, loadReps, CFG };
