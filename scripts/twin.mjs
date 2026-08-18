#!/usr/bin/env node
// ============================================================================
// twin.mjs · ARSENAL AI FC — THE ORGANISM: THE TWIN (the book on the captain)
// ----------------------------------------------------------------------------
// WHAT:  The Good Regulator Theorem made mechanical (THE_ORGANISM §IV.1): a
//        deterministic agent that holds the loop's generative model of the
//        captain and is forced to BET, SEALED, every morning — then face the
//        Evening Scorer like everyone else. Opens humble: three unconditioned
//        daily binary markets at Laplace-smoothed base rates.
// WHY:   A loop that would fuse with him must PREDICT him — and be scored when
//        it's wrong, by the same arithmetic that scores his knowledge.
// CONSTITUTIONAL CLAMPS (from adversarial review — each selftested):
//   · WIN-ONLY VOICING — the derby between captain and book is voiced ONLY in
//     the direction the captain wins ("you're outrunning your own curve").
//     Book-beats-captain resolves SILENTLY into scheduling weight. A fitted
//     twin is unwinnable by construction; voiced both ways it is a whip.
//   · COLD-START GAG — no market speaks until ≥30 scored resolutions AND it
//     beats the coin flip. A morning prophecy of failure delivered to a
//     shame-spiral brain before it sits is the initiation wall with a
//     probability stapled to it.
//   · DEAD-MARKET PRUNING — a market that can't beat the coin flip after 30
//     bets is flagged dead and stops sealing. The twin prunes its own delusions.
//     (Both clamps read "beat base rate" until the E2E audit of 25 Jul 2026
//     proved that baseline was the HINDSIGHT-fitted constant — unbeatable by
//     construction, so every healthy market died the day it matured. The
//     honest, no-hindsight baseline is the uninformative 0.5 book. See
//     deadVerdictLegacy / deadVerdict — the old arithmetic is frozen, not lost.)
//   · NO DREAD-CLASS MARKETS — no session-abandon / failure-probability
//     market exists in config or code. Ever.
// M20 — THE SHADOW BOOKS (the cyborg stretch): K counterfactual books run in
//   parallel beside the live book, PURE CODE, zero LLM — laplace_all (the
//   live book, frozen), window14 (recency), ewma (α=0.15), dow (day-of-week).
//   Every scored resolution replays through every book with NO LOOKAHEAD
//   (each bet priced from PRIOR history only) → a Brier table inside
//   twin.json. A shadow that beats the configured book by ≥10% at n≥30
//   emits a bootroom-grammar PROPOSAL (twin.json.proposals) — the captain
//   applies by editing twin_config.json → books.<market>. The live book's
//   VOICE CLAMPS (win-only, cold-start gag, pruning) are untouched either way.
//
// INPUT:  twin_config.json (canon) · slip.jsonl (scorer's resolutions, read-only)
// OUTPUT: predictions.jsonl (append; sealed bets) + twin.json (sole writer)
// MODES:  run (default: seal today, idempotent) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dayKey, addDays } from "./daykey.mjs";   // Block 6 — THE DAY-KEY LAW

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "twin_config.json");
const PRED      = join(STATE_DIR, "predictions.jsonl");
const TWIN      = join(STATE_DIR, "twin.json");
const SLIP      = join(STATE_DIR, "slip.jsonl");

const DEFAULTS = {
  markets: [
    { id: "first_focus_by_0930", desc: "first Learning-bucket focus lands by 09:30" },
    { id: "floor_touched", desc: "the never-zero floor is touched today" },
    { id: "session_happened", desc: "a real study session happens today" },
  ],
  voice_min_resolutions: 30,
  dead_market_min: 30,
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const round = (x, d = 4) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      const markets = Array.isArray(j.markets) && j.markets.length ? j.markets : DEFAULTS.markets;
      return {
        markets: markets.filter(m => m && m.id && !/abandon|fail|dread|quit|stall/i.test(m.id)), // no dread-class, structurally
        voice_min_resolutions: typeof j.voice_min_resolutions === "number" ? j.voice_min_resolutions : DEFAULTS.voice_min_resolutions,
        dead_market_min: typeof j.dead_market_min === "number" ? j.dead_market_min : DEFAULTS.dead_market_min,
        // M20 — per-market book choice (captain-applied; unknown book → live default)
        // E2E audit 25 Jul 2026: was `v in BOOKS` — the `in` operator walks the
        // PROTOTYPE CHAIN, so a typo'd/pasted "__proto__", "constructor" or
        // "toString" passed validation and then crashed every twin run before a
        // single bet was sealed (BOOKS["__proto__"] is Object.prototype: truthy,
        // not callable). Own-property check only.
        books: Object.fromEntries(Object.entries(j.books || {}).filter(([, v]) => typeof v === "string" && Object.hasOwn(BOOKS, v))),
      };
    }
  } catch { /* malformed → defaults */ }
  return { ...JSON.parse(JSON.stringify(DEFAULTS)), books: {} };
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

const readLines = (p) => {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch {}
  return out;
};

// ---------------------------------------------------------------------------
// pure core
// ---------------------------------------------------------------------------
// E2E audit 25 Jul 2026 (HIGH — the slip is APPEND-ONLY): scorer.mjs is the
// slip's sole writer and runs TWICE a day BY DESIGN (21:35 task + full-time).
// When a verdict FLIPS it re-appends a row with the same (book,type,date) —
// its twinPrior gate only suppresses an IDENTICAL verdict — and its own
// computeTiers reads LAST-WINS on book|type|date|claim. twin.mjs read the raw
// filter and counted the premature row AND its correction as two independent
// resolutions: one phantom hit + one phantom miss on a single day, dragging
// `base` toward 0.5, adding p²+(1-p)² ≥ 0.5 to the Brier sum, tripping the
// 30-resolution gag/pruning thresholds on fewer REAL days, and feeding a ghost
// bet into every shadow-book replay. We now dedupe on the scorer's own key.
// Map.set keeps the FIRST insertion slot and the LAST value, so a correction
// settles back into its own chronological position — exactly what the
// no-lookahead replay in shadowTable needs.
const lastWins = (rows) => {
  const m = new Map();
  for (const s of rows) m.set(`${s.book}|${s.type}|${s.date}|${s.claim}`, s);
  return [...m.values()];
};

// E2E audit 25 Jul 2026 (CRITICAL): the honest, no-hindsight baseline — the
// Brier of the uninformative constant-0.5 book. See deadVerdict below.
const COIN_BRIER = 0.25;

// market stats from the scorer's slip (book==="twin", type===market id)
function marketStats(slip, marketId, deadWindow = 0) {
  const rows = lastWins(slip.filter(s => s.book === "twin" && s.type === marketId && s.resolved === true && typeof s.hit === "boolean"));
  const n = rows.length;
  const hits = rows.filter(r => r.hit).length;
  const base = n ? hits / n : 0.5;
  const sq = (rs, price) => rs.reduce((a, r) => a + (price(r) - (r.hit ? 1 : 0)) ** 2, 0) / rs.length;
  let brier = null, baseBrier = null, recentBrier = null;
  if (n) {
    brier = sq(rows, r => (typeof r.p === "number" ? r.p : 0.5));
    baseBrier = sq(rows, () => base);   // FROZEN: the hindsight constant, report-only (see deadVerdictLegacy)
    // E2E audit 25 Jul 2026 (CRITICAL, revival path): the verdict brier rides a
    // TRAILING window, so a market is judged on the book it runs TODAY rather
    // than on its cold-start era. Pruning is recomputed every run, so a market
    // whose recent scoring recovers comes back to life instead of being held
    // hostage forever by ancient humble 0.5 seals.
    const w = deadWindow > 0 ? rows.slice(-deadWindow) : rows;
    recentBrier = sq(w, r => (typeof r.p === "number" ? r.p : 0.5));
  }
  return { n, hits, base, brier: round(brier), baseBrier: round(baseBrier), recentBrier: round(recentBrier) };
}

// FROZEN — the pre-audit dead-market verdict, kept verbatim for the record.
// The E2E audit (25 Jul 2026) proved it structurally UNPASSABLE: baseBrier is
// the IN-SAMPLE-OPTIMAL constant (base = hits/n, fitted in hindsight to the
// very outcomes it is scored against; algebraically base·(1-base)). For any
// unconditional book the sealed price is independent of the outcome, so the
// cross-term vanishes in expectation and Σ(pᵢ-base)² > 0 ⇒ brier > baseBrier,
// always. Monte Carlo over θ∈{0.5…0.95} × n∈{30…365} put P(brier ≥ baseBrier)
// at 1.0000 in EVERY cell (θ=0.8, n=30: 0.177 vs 0.155). So every HEALTHY
// market flipped dead at resolution 30 — and dead is terminal: sealToday
// filters m.alive ⇒ no new bets ⇒ the slip freezes ⇒ the identical dead
// verdict recomputes forever, and beats_base (required by computeVoice) could
// never be earned. The twin self-lobotomized exactly when it matured.
const deadVerdictLegacy = (s, cfg) => ({
  alive: !(s.n >= cfg.dead_market_min && s.brier !== null && s.brier >= s.baseBrier),
  beats_base: s.n >= cfg.dead_market_min && s.brier !== null && s.brier < s.baseBrier,
});

// PLAN OF RECORD — the same clamp, against an honest baseline no hindsight was
// fitted to: the uninformative constant-0.5 book (Brier 0.25). "Still can't
// beat a coin flip after 30 bets" IS the delusion the pruning was written to
// catch. The other candidate — the no-lookahead sequential base-rate replay —
// was REJECTED on purpose: the live laplace_all book IS that replay, so it
// would tie itself and die on the >= tie-break, i.e. the same permanent death
// in a new costume.
const deadVerdict = (s, cfg) => {
  const b = s.recentBrier !== null ? s.recentBrier : s.brier;
  return {
    alive: !(s.n >= cfg.dead_market_min && b !== null && b >= COIN_BRIER),
    beats_base: s.n >= cfg.dead_market_min && b !== null && b < COIN_BRIER,
  };
};

// Laplace-smoothed probability for today's seal
const laplace = (hits, n) => (hits + 1) / (n + 2);

// M20 — THE BOOKS: each prices tomorrow from a market's resolution history.
// laplace_all is the live book, FROZEN (the original pricing, verbatim).
// All pure code; ctx.date lets the day-of-week book condition on the bet day.
const BOOKS = {
  laplace_all: (rows) => laplace(rows.filter(r => r.hit).length, rows.length),
  window14: (rows) => { const w = rows.slice(-14); return laplace(w.filter(r => r.hit).length, w.length); },
  ewma: (rows) => { let p = 0.5; for (const r of rows) p = p + 0.15 * ((r.hit ? 1 : 0) - p); return p; },
  dow: (rows, ctx = {}) => {
    const d = ctx.date ? new Date(ctx.date).getDay() : null;
    const same = d === null ? [] : rows.filter(r => r.date && new Date(r.date).getDay() === d);
    const base = same.length >= 4 ? same : rows;       // thin weekday → the whole book
    return laplace(base.filter(r => r.hit).length, base.length);
  },
};
// E2E audit 25 Jul 2026 (HIGH): deduped last-wins, same as marketStats — the
// books price from REAL days, never from a correction counted twice.
const marketRows = (slip, marketId) => lastWins(slip.filter(s => s.book === "twin" && s.type === marketId && s.resolved === true && typeof s.hit === "boolean"));

function computeMarkets(slip, cfg, todayStr = dayKey()) {   // Block 6 — day-key
  return cfg.markets.map(m => {
    const s = marketStats(slip, m.id, cfg.dead_market_min);
    const { alive, beats_base } = deadVerdict(s, cfg);   // E2E audit 25 Jul 2026 (CRITICAL) — honest baseline; deadVerdictLegacy kept frozen above
    const wanted = (cfg.books && cfg.books[m.id]) || "laplace_all";
    // E2E audit 25 Jul 2026: `typeof === "function"` guard, not truthiness. The
    // config filter used `v in BOOKS`, which walks the prototype chain, so
    // "__proto__" / "constructor" / "toString" survived validation and
    // BOOKS["__proto__"] is Object.prototype — truthy, uncallable, TypeError
    // before a single bet was sealed. The filter is fixed (Object.hasOwn) AND
    // the call site refuses anything that is not a real book.
    // ...and twin.json reports the book that ACTUALLY priced the bet, not the
    // one the config asked for — a silent fallback that lies on the bus is how
    // a bad config survives a review.
    const bookId = typeof BOOKS[wanted] === "function" && Object.hasOwn(BOOKS, wanted) ? wanted : "laplace_all";
    const price = BOOKS[bookId](marketRows(slip, m.id), { date: todayStr });
    return { id: m.id, desc: m.desc, p: round(price), n_resolved: s.n, alive, beats_base, book: bookId, gate: marketGate(s.n, cfg) };
  });
}

// ---------------------------------------------------------------------------
// THE UNGATE (organism audit #105 + #106, 4 Aug 2026)
// ---------------------------------------------------------------------------
// The COLD-START GAG is constitutional and stays exactly where it is: no market
// speaks below voice_min_resolutions, because a morning prophecy delivered to a
// shame-spiral brain on thin data is the initiation wall with a probability stapled
// to it. But "warming_up" told him nothing — not how many resolutions the twin has,
// not how many it needs, not which market is the laggard. Live today: three markets
// at 5, 10 and 10 of 30. That is a measurement, and it should read as one.
// NOTHING HERE LOWERS A GAG OR MANUFACTURES A VOICE.
const marketGate = (n, cfg) => ({
  have: n, need: cfg.voice_min_resolutions, unit: "scored resolutions",
  line: `${n}/${cfg.voice_min_resolutions} scored resolutions`,
  open: n >= cfg.voice_min_resolutions,
});

// The twin as a whole is only as mature as its THINNEST market — one market at 30
// while another sits at 5 is not a mature twin, and reporting the max would be the
// flattering read. Worst market, named.
function buildGate(markets, cfg) {
  const need = cfg.voice_min_resolutions;
  const worst = markets.reduce((w, m) => (w === null || m.n_resolved < w.n_resolved ? m : w), null);
  const have = worst ? worst.n_resolved : 0;
  return {
    have, need, unit: "scored resolutions",
    line: `${have}/${need} scored resolutions`,
    open: markets.length > 0 && markets.every((m) => m.n_resolved >= need),
    slowest_market: worst ? worst.id : null,
    withheld: markets.length && markets.every((m) => m.n_resolved >= need) ? [] : ["voice"],
    per_market: markets.map((m) => ({ id: m.id, ...marketGate(m.n_resolved, cfg) })),
  };
}

// M20 — the Brier table: every book replays every market with NO LOOKAHEAD
// (bet i priced from rows 0..i-1 only) — the honest offline tournament.
function shadowTable(slip, cfg) {
  const table = [];
  for (const m of cfg.markets) {
    const rows = marketRows(slip, m.id);
    for (const bookId of Object.keys(BOOKS)) {
      let sum = 0;
      rows.forEach((r, i) => {
        const p = BOOKS[bookId](rows.slice(0, i), { date: r.date });
        sum += (p - (r.hit ? 1 : 0)) ** 2;
      });
      table.push({ market: m.id, book: bookId, n: rows.length, brier: rows.length ? round(sum / rows.length) : null });
    }
  }
  return table;
}
// M20 — the genome's voice: a clearly-sharper shadow files a bootroom-grammar
// proposal. REPORT-ONLY — the captain applies by editing twin_config.json;
// the live book's voice clamps are untouched either way.
function proposeBookSwaps(table, cfg, todayStr) {
  const props = [];
  for (const m of cfg.markets) {
    const rowsFor = table.filter(t => t.market === m.id && t.n >= cfg.dead_market_min && t.brier !== null);
    if (!rowsFor.length) continue;
    const liveBook = (cfg.books && cfg.books[m.id]) || "laplace_all";
    const live = rowsFor.find(t => t.book === liveBook);
    if (!live) continue;
    const best = rowsFor.slice().sort((a, b) => a.brier - b.brier)[0];
    if (best.book === liveBook || best.brier > live.brier * 0.9) continue;   // hysteresis: ≥10% sharper or silence
    props.push({
      id: `twin-book-${todayStr}-${m.id}`,
      target: `twin_config.json → books.${m.id}`,
      diff: { old: liveBook, new: best.book },
      evidence: [
        `replayed ${live.n} scored resolutions with NO LOOKAHEAD (each bet priced from prior history only)`,
        `live book ${liveBook}: Brier ${live.brier} · shadow ${best.book}: Brier ${best.brier} (≥10% sharper)`,
      ],
      predicted_effect: `sharper prediction error on "${m.id}" → truer PE salience → truer wakes`,
      metric: { name: `brier_${m.id}`, min_events: cfg.dead_market_min, window_days: 30 },
      review_after_days: 30,
      revert_diff: { new: liveBook },
      status: "proposed", proposed_on: todayStr, engine: "shadow_books",
      human_note: "apply by editing twin_config.json books — the voice clamps are untouched either way",
    });
  }
  return props;
}

// E2E audit 25 Jul 2026: the local day BEFORE todayStr, computed on a fixed
// UTC midnight so no timezone can slide it a day. todayStr is already the
// captain's local date, so the arithmetic stays in his calendar.
const prevDay = (todayStr) => {
  const t = Date.parse(`${todayStr}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  const d = new Date(t - 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

// WIN-ONLY VOICE: non-null ONLY when a mature, base-beating market resolved
// YESTERDAY in the captain's favor AGAINST the book (book said p<0.5, outcome true).
function computeVoice(slip, markets, cfg, todayStr) {
  const yesterday = prevDay(todayStr);
  for (const m of markets) {
    if (m.n_resolved < cfg.voice_min_resolutions || !m.beats_base || !m.alive) continue;
    // E2E audit 25 Jul 2026 (HIGH): dedupe last-wins here too — a corrected
    // resolution must not be able to speak as its own superseded twin.
    const rows = lastWins(slip.filter(s => s.book === "twin" && s.type === m.id && s.resolved && typeof s.p === "number"));
    // ...and pick the newest row BY DATE, not by file order. File order only
    // held because the scorer happens to append chronologically; a single
    // out-of-order or backfilled row let a stale win jump the queue.
    const dated = rows.filter(r => r.date !== undefined).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const last = dated[dated.length - 1];
    if (!last) continue;
    // E2E audit 25 Jul 2026: the comment above always SAID "resolved YESTERDAY"
    // but the code only asked for `last.date < todayStr`. With no new
    // resolutions (missed scorer runs, captain travelling, instrument dark) the
    // same week-old row kept qualifying and twin.json re-emitted the identical
    // "you're outrunning your own curve" brag every single morning — a brag
    // that repeats is not a brag, it is wallpaper. Yesterday, or silence.
    if (yesterday === null || last.date !== yesterday) continue;
    if (last.hit === true && last.p < 0.5) {
      const pct = Math.round(last.p * 100);
      return `the book had you at ${pct}% for "${m.desc}" — you landed it anyway. You're outrunning your own curve.`;
    }
    // book-beats-captain → SILENT by constitution (no else branch, ever)
  }
  return null;
}

function sealToday(existingPreds, markets, todayStr, nowIso) {
  const sealed = new Set(existingPreds.filter(p => p.date === todayStr).map(p => p.market));
  return markets.filter(m => m.alive && !sealed.has(m.id))
    .map(m => ({ date: todayStr, market: m.id, p: m.p, n_resolved: m.n_resolved, sealed_at: nowIso }));
}

// cfg is TRAILING + OPTIONAL so every pre-existing 5-arg caller keeps working
// (layering, never replace) and, absent one, falls back to DEFAULTS — which is the
// literal 30 this function used to hardcode, so behaviour is unchanged by default.
//
// ORGANISM AUDIT #105 (4 Aug 2026), found while wiring the counter: the maturity
// test here was the LITERAL `30`, twice, while the real gag arithmetic reads
// cfg.voice_min_resolutions (computeVoice:289) and cfg.dead_market_min. The captain
// editing twin_config.json would have moved the gag and NOT the status wearing its
// name — twin.json would have said "ok" while every market was still gagged, or
// "warming_up" over a twin that was speaking. One threshold, one source.
function buildTwin(markets, voice, now, shadow = null, proposals = [], cfg = null) {
  const c = {
    voice_min_resolutions: (cfg && typeof cfg.voice_min_resolutions === "number") ? cfg.voice_min_resolutions : DEFAULTS.voice_min_resolutions,
  };
  const anyData = markets.some(m => m.n_resolved > 0);
  const gate = buildGate(markets, c);
  return {
    date: dayKey(now),   // Block 6 — day-key
    status: anyData ? (gate.open ? "ok" : "warming_up") : "awaiting_data",
    low_confidence: !gate.open,
    // #105/#106 — the have/need counter, beside the machine status (never replacing
    // it: dugout.mjs:1256 and its selftest at :2033 read `twin.status === "ok"`).
    gate,
    generated_at: now.toISOString(),
    markets,
    voice,
    // M20 — the shadow tournament rides the bus (report-only; captain applies)
    shadow_books: shadow,
    proposals,
  };
}

// ---------------------------------------------------------------------------
// selftest — fixture slip; no real state touched
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = loadConfig("__no_such__");
  const now = new Date(2026, 6, 12, 8, 35, 0);
  const today = "2026-07-12";
  // distinct, real calendar days — one bet per day, as the append-only slip means it
  const dayN = (i, from = Date.UTC(2026, 4, 1)) => { const d = new Date(from + i * 86400000); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`; };

  // cold start: no slip at all
  const cold = computeMarkets([], cfg);
  assert("cold start: three humble markets at p=0.5", cold.length === 3 && cold.every(m => m.p === 0.5 && m.alive));
  assert("cold start: twin awaiting_data", buildTwin(cold, null, now).status === "awaiting_data");
  assert("COLD-START GAG — voice null on zero data", computeVoice([], cold, cfg, today) === null);

  // young market (n=10): still gagged even on a captain win
  const young = Array.from({ length: 10 }, (_, i) => ({ book: "twin", type: "floor_touched", date: `2026-07-0${(i % 9) + 1}`, resolved: true, hit: true, p: 0.3 }));
  const youngM = computeMarkets(young, cfg);
  assert("COLD-START GAG — voice null below 30 resolutions even on wins", computeVoice(young, youngM, cfg, today) === null);

  // mature, base-beating market where the captain beat the book yesterday
  const mature = Array.from({ length: 35 }, (_, i) => ({
    book: "twin", type: "floor_touched", date: `2026-06-${String(i + 1).padStart(2, "0")}`,
    resolved: true, hit: i % 3 !== 0, p: i % 3 !== 0 ? 0.8 : 0.2,   // well-calibrated → beats base
  }));
  mature.push({ book: "twin", type: "floor_touched", date: "2026-07-11", resolved: true, hit: true, p: 0.35 });
  const matureM = computeMarkets(mature, cfg);
  const voice = computeVoice(mature, matureM, cfg, today);
  assert("WIN-ONLY VOICE speaks on mature market + captain win", typeof voice === "string" && voice.includes("outrunning your own curve"));
  assert("voice is odds, not encouragement (quotes the book's own number)", /\d+%/.test(voice));

  // book-beats-captain: SILENT
  const bookWin = mature.slice(0, 35).concat([{ book: "twin", type: "floor_touched", date: "2026-07-11", resolved: true, hit: false, p: 0.2 }]);
  assert("WIN-ONLY LAW — book-beats-captain is silent", computeVoice(bookWin, computeMarkets(bookWin, cfg), cfg, today) === null);

  // E2E audit 25 Jul 2026 — the brag is YESTERDAY's or it is silence. The old
  // gate only asked `last.date < todayStr`, so with no fresh resolutions the
  // identical line re-rendered every morning through postmatch and viz.
  assert("STALE VOICE: the win resolved yesterday speaks", typeof computeVoice(mature, matureM, cfg, "2026-07-12") === "string");
  assert("STALE VOICE: the SAME win is silent the next morning (a brag that repeats is wallpaper)", computeVoice(mature, matureM, cfg, "2026-07-13") === null);
  assert("STALE VOICE: still silent a week on, however dark the instrument went", computeVoice(mature, matureM, cfg, "2026-07-19") === null);
  // ...and `last` is newest BY DATE, not last in file order (the scorer only
  // happens to append chronologically — a backfill breaks that assumption).
  const backfilled = mature.slice(0, 35).concat([
    { book: "twin", type: "floor_touched", claim: "floor_touched", date: "2026-07-11", resolved: true, hit: false, p: 0.2 },  // yesterday: the book won → silence
    { book: "twin", type: "floor_touched", claim: "floor_touched", date: "2026-07-04", resolved: true, hit: true, p: 0.2 },   // appended late: a week-old captain win
  ]);
  assert("NEWEST BY DATE: a late-appended OLD win cannot speak over yesterday's loss", computeVoice(backfilled, computeMarkets(backfilled, cfg), cfg, today) === null);

  // E2E audit 25 Jul 2026 (HIGH) — the scorer's CORRECTION rows.
  // scorer.mjs runs 21:35 AND at full-time; a flipped verdict is a second row
  // on the same (book,type,date). Twin used to score both as real bets.
  {
    const corrected = [
      { book: "twin", type: "floor_touched", claim: "floor_touched", date: "2026-07-10", resolved: true, hit: true, p: 0.6 },
      { book: "twin", type: "floor_touched", claim: "floor_touched", date: "2026-07-11", resolved: true, hit: false, p: 0.6 }, // 21:35 — floor not touched YET
      { book: "twin", type: "floor_touched", claim: "floor_touched", date: "2026-07-11", resolved: true, hit: true, p: 0.6 },  // 22:30 he touched it → full-time corrects
    ];
    const st = marketStats(corrected, "floor_touched");
    assert("LAST-WINS: a 21:35 miss corrected at full-time counts ONCE, as the HIT", st.n === 2 && st.hits === 2 && st.base === 1);
    assert("LAST-WINS: the books price from real days, not phantom bets", marketRows(corrected, "floor_touched").length === 2);
  }

  // E2E audit 25 Jul 2026 (CRITICAL) — a HEALTHY unconditional market must
  // survive maturity. This fixture is exactly what the live laplace_all book
  // produces: sequential prices from PRIOR history only, on a real ~80% market.
  {
    const honest = []; let h = 0;
    for (let i = 0; i < 35; i++) {
      const hit = i % 5 !== 4;                                   // 28 hits / 35 = 0.8
      honest.push({ book: "twin", type: "session_happened", claim: "session_happened", date: dayN(i), resolved: true, hit, p: round(laplace(h, i)) });
      if (hit) h++;
    }
    const hs = marketStats(honest, "session_happened", cfg.dead_market_min);
    const hm = computeMarkets(honest, cfg).find(m => m.id === "session_happened");
    assert("HONEST BASELINE: a well-calibrated 80% market at n=35 STAYS ALIVE", hm.n_resolved === 35 && hm.alive === true);
    assert("HONEST BASELINE: ...and can earn beats_base, so the voice is reachable at all", hm.beats_base === true);
    // the proof the old clamp was unpassable, not merely strict:
    assert("the FROZEN legacy verdict is what killed it (hindsight base beat the live book)", hs.brier > hs.baseBrier && deadVerdictLegacy(hs, cfg).alive === false);
  }

  // E2E audit 25 Jul 2026 — a book name off the prototype chain is not a book.
  {
    const poisoned = loadConfigFromObject({ markets: [{ id: "floor_touched", desc: "floor" }], books: { floor_touched: "__proto__", session_happened: "constructor", first_focus_by_0930: "window14" } });
    assert("BOOK VALIDATION: __proto__/constructor are stripped, real books survive", Object.keys(poisoned.books).length === 1 && poisoned.books.first_focus_by_0930 === "window14");
    const forced = computeMarkets([], { markets: [{ id: "floor_touched", desc: "floor" }], voice_min_resolutions: 30, dead_market_min: 30, books: { floor_touched: "__proto__" } });
    assert("BOOK VALIDATION: a poisoned book seals anyway — falls back AND reports the truth", forced[0].p === 0.5 && forced[0].book === "laplace_all");
  }

  // dead market pruning: predictions systematically anti-calibrated
  const dead = Array.from({ length: 35 }, (_, i) => ({ book: "twin", type: "session_happened", date: `2026-06-${String(i + 1).padStart(2, "0")}`, resolved: true, hit: i % 2 === 0, p: i % 2 === 0 ? 0.1 : 0.9 }));
  const deadM = computeMarkets(dead, cfg).find(m => m.id === "session_happened");
  assert("DEAD-MARKET PRUNING — anti-calibrated market dies at 30+", deadM.alive === false);
  assert("dead market stops sealing", sealToday([], computeMarkets(dead, cfg), today, now.toISOString()).every(s => s.market !== "session_happened"));

  // sealing: idempotent, Laplace
  const seals = sealToday([], cold, today, now.toISOString());
  assert("seal writes one bet per market", seals.length === 3 && seals.every(s => s.date === today));
  assert("seal idempotent (same day, no double-seal)", sealToday(seals, cold, today, now.toISOString()).length === 0);
  assert("Laplace smoothing (3 hits / 4 → 0.667)", laplace(3, 4) > 0.66 && laplace(3, 4) < 0.67);

  // NO DREAD-CLASS: config filter strips any such market
  const dreadCfg = { markets: [{ id: "session_abandon_prob", desc: "x" }, { id: "floor_touched", desc: "y" }], voice_min_resolutions: 30, dead_market_min: 30 };
  const filtered = loadConfigFromObject(dreadCfg);
  assert("NO DREAD-CLASS MARKETS — abandon/fail markets structurally stripped", filtered.markets.length === 1 && filtered.markets[0].id === "floor_touched");

  // M20 — THE SHADOW BOOKS: replay tournament, no lookahead, genome proposal
  {
    // a regime shift: 25 misses then 15 hits — recency books must outprice history
    // E2E audit 25 Jul 2026: this fixture used to wrap its dates with (i % 28),
    // so 12 of the 40 "bets" landed on a day already bet — which on the real
    // append-only slip means a CORRECTION, not a second bet. Once twin.mjs
    // started reading last-wins (as scorer.mjs always has) the fixture
    // collapsed to 28 rows and the regime shift dissolved. Forty bets now means
    // forty distinct, real calendar days; the hit pattern and the assertions'
    // intent are unchanged.
    const shift = [];
    for (let i = 0; i < 40; i++) shift.push({ book: "twin", type: "floor_touched", date: dayN(i), resolved: true, hit: i >= 25, p: 0.5 });
    const oneCfg = { markets: [{ id: "floor_touched", desc: "floor" }], voice_min_resolutions: 30, dead_market_min: 30, books: {} };
    const table = shadowTable(shift, oneCfg);
    assert("SHADOW TABLE: every book replays every market (4 books × 1 market)", table.length === 4 && new Set(table.map(t => t.book)).size === 4 && table.every(t => t.n === 40));
    const briers = Object.fromEntries(table.map(t => [t.book, t.brier]));
    assert("a regime shift: the recency books outscore the frozen live book", briers.window14 < briers.laplace_all && briers.ewma < briers.laplace_all);
    assert("NO LOOKAHEAD: an empty prior prices 0.5 (the first bet is humble)", BOOKS.laplace_all([]) === 0.5 && BOOKS.ewma([]) === 0.5 && BOOKS.window14([]) === 0.5);
    const props = proposeBookSwaps(table, oneCfg, "2026-07-15");
    assert("GENOME: a ≥10% sharper shadow files a bootroom-grammar proposal", props.length === 1 && ["id", "target", "diff", "evidence", "predicted_effect", "metric", "review_after_days", "revert_diff"].every(k => k in props[0]));
    assert("GENOME: the revert is the live book, the human applies (report-only)", props[0].revert_diff.new === "laplace_all" && props[0].human_note.includes("voice clamps are untouched"));
    // hysteresis: a near-tie stays silent
    const tieTable = [{ market: "floor_touched", book: "laplace_all", n: 40, brier: 0.20 }, { market: "floor_touched", book: "window14", n: 40, brier: 0.19 }, { market: "floor_touched", book: "ewma", n: 40, brier: 0.21 }, { market: "floor_touched", book: "dow", n: 40, brier: 0.22 }];
    assert("GENOME: a near-tie (<10%) files NOTHING (no twitchy swaps)", proposeBookSwaps(tieTable, oneCfg, "2026-07-15").length === 0);
    // thin data stays silent
    assert("GENOME: under 30 resolutions the tournament is silent", proposeBookSwaps(shadowTable(shift.slice(0, 20), oneCfg), oneCfg, "2026-07-15").length === 0);
    // the captain's applied swap changes the PRICE, never the clamps
    const swapped = computeMarkets(shift, { ...oneCfg, books: { floor_touched: "window14" } }, "2026-07-15");
    const stock = computeMarkets(shift, oneCfg, "2026-07-15");
    assert("an applied swap re-prices the market (recency sees the shift)", swapped[0].book === "window14" && swapped[0].p > stock[0].p);
    assert("the swap NEVER touches alive/beats_base (clamp arithmetic frozen)", swapped[0].alive === stock[0].alive && swapped[0].beats_base === stock[0].beats_base);
    // voice clamps ride the recorded slip, not the book choice.
    // E2E audit 25 Jul 2026: this used to run on the `shift` fixture, whose flat
    // p=0.5 can never earn a voice — so it compared null === null and only ever
    // proved identical SILENCE. A clamp check that cannot fail is worse than no
    // check. It now runs on the `mature` market, which ACTUALLY SPEAKS: if a
    // future edit ever made computeVoice quote the configured book's price
    // instead of the recorded slip p, this breaks.
    const swapCfg = { ...cfg, books: { floor_touched: "window14" } };
    const vSwapped = computeVoice(mature, computeMarkets(mature, swapCfg, today), swapCfg, today);
    const vStock = computeVoice(mature, computeMarkets(mature, cfg, today), cfg, today);
    assert("VOICE CLAMPS UNTOUCHED: an EARNED voice is byte-identical under any book", typeof vStock === "string" && vStock.includes("outrunning your own curve") && vSwapped === vStock);
    // twin.json carries the tournament
    const t = buildTwin(stock, null, now, table, props);
    assert("twin.json carries the shadow table + proposals (report-only, on the bus)", t.shadow_books.length === 4 && t.proposals.length === 1);
  }

  // --- ORGANISM AUDIT #105 / #106 (4 Aug 2026): THE UNGATE -------------------
  {
    // the captain's live shape today: three markets at 5, 10 and 10 of 30
    const liveish = [];
    const add = (type, n) => { for (let i = 0; i < n; i++) liveish.push({ book: "twin", type, claim: type, date: dayN(i), resolved: true, hit: i % 2 === 0, p: 0.5 }); };
    add("first_focus_by_0930", 5); add("floor_touched", 10); add("session_happened", 10);
    const lm = computeMarkets(liveish, cfg, today);
    const lt = buildTwin(lm, null, now, null, [], cfg);
    assert("#105 the twin says '5/30 scored resolutions' with its denominator, not the bare word",
      lt.gate.line === "5/30 scored resolutions" && lt.gate.have === 5 && lt.gate.need === 30 && lt.gate.open === false
      && lt.status === "warming_up" && lt.low_confidence === true);
    assert("#105 the counter reports the THINNEST market and names it (reporting the max would be the flattering read)",
      lt.gate.slowest_market === "first_focus_by_0930"
      && lt.gate.per_market.find(g => g.id === "floor_touched").line === "10/30 scored resolutions");
    assert("#105 every market carries its own counter, so 'silent' is never mistaken for 'broken'",
      lm.every(m => m.gate && m.gate.need === 30 && m.gate.open === false) && lt.gate.withheld.includes("voice"));
    assert("#105 a cold twin reads 0/30, not an empty silence",
      buildTwin(computeMarkets([], cfg, today), null, now, null, [], cfg).gate.line === "0/30 scored resolutions");

    // THE GAG IS NOT LOWERED — the whole point. 29 resolutions still cannot speak.
    const near = [];
    for (const t of ["first_focus_by_0930", "floor_touched", "session_happened"]) for (let i = 0; i < 29; i++) near.push({ book: "twin", type: t, claim: t, date: dayN(i), resolved: true, hit: true, p: 0.2 });
    const nearT = buildTwin(computeMarkets(near, cfg, today), computeVoice(near, computeMarkets(near, cfg, today), cfg, today), now, null, [], cfg);
    assert("#105 NO GAG WAS LOWERED — at 29/30 the twin is still silent, it just says 29/30",
      nearT.gate.line === "29/30 scored resolutions" && nearT.gate.open === false && nearT.voice === null && nearT.status === "warming_up");

    // AND THE BUG FOUND WHILE WIRING IT: the maturity test was the literal 30 while
    // the gag reads cfg.voice_min_resolutions. Move the config and they disagreed.
    const cfg10 = { ...cfg, voice_min_resolutions: 10 };
    const t10 = buildTwin(computeMarkets(liveish, cfg10, today), null, now, null, [], cfg10);
    assert("#105 status + counter ride the CONFIG's threshold, not a literal (twin_config.json is now the single source)",
      t10.gate.need === 10 && t10.gate.line === "5/30 scored resolutions".replace("30", "10") && t10.gate.open === false);
    const allTen = [];
    for (const t of ["first_focus_by_0930", "floor_touched", "session_happened"]) for (let i = 0; i < 10; i++) allTen.push({ book: "twin", type: t, claim: t, date: dayN(i), resolved: true, hit: i % 2 === 0, p: 0.5 });
    const tOpen = buildTwin(computeMarkets(allTen, cfg10, today), null, now, null, [], cfg10);
    assert("#105 ...so lowering voice_min_resolutions to 10 makes BOTH the status and the counter open together (they used to disagree)",
      tOpen.gate.open === true && tOpen.status === "ok" && tOpen.low_confidence === false);
    assert("#105 BACKWARD-COMPAT — a 5-arg buildTwin caller still works and still gets DEFAULTS' 30",
      buildTwin(computeMarkets(allTen, cfg, today), null, now).gate.need === 30
      && buildTwin(computeMarkets(allTen, cfg, today), null, now).status === "warming_up");
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// config-from-object helper (mirrors loadConfig's filter; used by selftest)
function loadConfigFromObject(j) {
  const markets = Array.isArray(j.markets) && j.markets.length ? j.markets : DEFAULTS.markets;
  return {
    markets: markets.filter(m => m && m.id && !/abandon|fail|dread|quit|stall/i.test(m.id)),
    voice_min_resolutions: typeof j.voice_min_resolutions === "number" ? j.voice_min_resolutions : DEFAULTS.voice_min_resolutions,
    dead_market_min: typeof j.dead_market_min === "number" ? j.dead_market_min : DEFAULTS.dead_market_min,
    // E2E audit 25 Jul 2026: mirrors loadConfig's own-property filter (was `in BOOKS`)
    books: Object.fromEntries(Object.entries(j.books || {}).filter(([, v]) => typeof v === "string" && Object.hasOwn(BOOKS, v))),
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const cfg = loadConfig();
  const now = new Date();
  const today = dayKey(now);   // Block 6 — day-key
  const slip = readLines(SLIP);
  const preds = readLines(PRED);
  const markets = computeMarkets(slip, cfg, today);
  const seals = sealToday(preds, markets, today, now.toISOString());
  if (seals.length) {
    mkdirSync(dirname(PRED), { recursive: true });
    appendFileSync(PRED, seals.map(s => JSON.stringify(s)).join("\n") + "\n");
  }
  const voice = computeVoice(slip, markets, cfg, today);
  const shadow = shadowTable(slip, cfg);
  const proposals = proposeBookSwaps(shadow, cfg, today);
  const out = buildTwin(markets, voice, now, shadow, proposals, cfg);
  writeAtomic(TWIN, out);
  // #106 — the counter leads. "silent" alone reads like a broken organ; "silent
  // (5/30 scored resolutions, slowest: first_focus_by_0930)" reads like a clock.
  const voiceBit = voice ? "EARNED" : `silent (${out.gate.line}${out.gate.slowest_market ? `, slowest: ${out.gate.slowest_market}` : ""})`;
  console.log(`twin: ${seals.length} bet(s) sealed (${markets.filter(m => m.alive).length}/${markets.length} markets alive) · voice ${voiceBit} · shadow books ${proposals.length ? proposals.length + " swap proposal(s) filed" : "quiet"} → ${TWIN}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

// E2E audit 25 Jul 2026: deadVerdict + the frozen deadVerdictLegacy are exported
// so the pruning arithmetic — old and new — is inspectable from outside.
export { computeMarkets, computeVoice, sealToday, buildTwin, buildGate, marketGate, marketStats, laplace, loadConfig, loadConfigFromObject, shadowTable, proposeBookSwaps, BOOKS, lastWins, deadVerdict, deadVerdictLegacy };
