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

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
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
    && CONF.has(r.confidence);
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
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// core — replay reps into per-concept FSRS cards
// ---------------------------------------------------------------------------
function buildStore(reps, f) {
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
  const store = buildStore(reps, f);
  const b = bucketize(store, now, cfg);
  const date = localDate(now);
  const generated_at = new Date(now).toISOString();
  const cards = {
    date, engine: ENGINE, request_retention: cfg.request_retention,
    total_cards: store.length,
    due_today: b.due_today, overdue: b.overdue, hardest_due: b.hardest_due,
    status: store.length ? "ok" : "awaiting_data",
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
    { ts: "2026-07-01T09:00:00Z", surface: "gem", concept: "growth", question: "g1", confidence: "knew",  correct: true },
    { ts: "2026-07-05T09:00:00Z", surface: "gem", concept: "growth", question: "g2", confidence: "shaky", correct: true },
    { ts: "2026-07-15T09:00:00Z", surface: "gem", concept: "growth", question: "g3", confidence: "knew",  correct: true },
  ];
  const lapse = [
    { ts: "2026-07-01T09:00:00Z", surface: "gem", concept: "lapse", question: "l1", confidence: "knew",    correct: true },
    { ts: "2026-07-05T09:00:00Z", surface: "gem", concept: "lapse", question: "l2", confidence: "shaky",   correct: true },
    { ts: "2026-07-15T09:00:00Z", surface: "gem", concept: "lapse", question: "l3", confidence: "guessed", correct: false }, // lapse
  ];
  const store = buildStore([...growth, ...lapse], f);
  const gC = store.find((c) => c.id === "growth");
  const lC = store.find((c) => c.id === "lapse");
  assert("correct reviews lengthen interval (growth interval ≥ 7d)", intervalDays(gC) >= 7);
  assert("incorrect resets interval (lapse interval < 2d)", intervalDays(lC) < 2);
  assert("sustained-correct interval > lapsed interval", intervalDays(gC) > intervalDays(lC));

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

  const reps = loadReps(REPS_LOG);
  const f = fsrs(generatorParameters({ request_retention: CFG.request_retention, enable_fuzz: false }));
  const { cards, fsrsStore } = compute(reps, new Date(), CFG, f);
  writeAtomic(CARDS, cards);
  writeAtomic(STORE, fsrsStore);
  console.log(`fsrs: ${cards.status} — ${cards.total_cards} cards · due_today ${cards.due_today} · overdue ${cards.overdue} · hardest [${cards.hardest_due.join(", ") || "-"}]  →  ${CARDS}`);
  process.exit(0);
}

// Windows-safe entry guard (like timeaudit.mjs / capture.mjs)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { buildStore, bucketize, compute, ratingOf, normId, loadReps };
