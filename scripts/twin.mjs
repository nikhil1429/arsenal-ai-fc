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
//     beats base rate. A morning prophecy of failure delivered to a
//     shame-spiral brain before it sits is the initiation wall with a
//     probability stapled to it.
//   · DEAD-MARKET PRUNING — a market that can't beat base rate after 30 bets
//     is flagged dead and stops sealing. The twin prunes its own delusions.
//   · NO DREAD-CLASS MARKETS — no session-abandon / failure-probability
//     market exists in config or code. Ever.
//
// INPUT:  twin_config.json (canon) · slip.jsonl (scorer's resolutions, read-only)
// OUTPUT: predictions.jsonl (append; sealed bets) + twin.json (sole writer)
// MODES:  run (default: seal today, idempotent) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
      };
    }
  } catch { /* malformed → defaults */ }
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
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
// market stats from the scorer's slip (book==="twin", type===market id)
function marketStats(slip, marketId) {
  const rows = slip.filter(s => s.book === "twin" && s.type === marketId && s.resolved === true && typeof s.hit === "boolean");
  const n = rows.length;
  const hits = rows.filter(r => r.hit).length;
  const base = n ? hits / n : 0.5;
  let brier = null, baseBrier = null;
  if (n) {
    brier = rows.reduce((a, r) => a + ((typeof r.p === "number" ? r.p : 0.5) - (r.hit ? 1 : 0)) ** 2, 0) / n;
    baseBrier = rows.reduce((a, r) => a + (base - (r.hit ? 1 : 0)) ** 2, 0) / n;
  }
  return { n, hits, base, brier: round(brier), baseBrier: round(baseBrier) };
}

// Laplace-smoothed probability for today's seal
const laplace = (hits, n) => (hits + 1) / (n + 2);

function computeMarkets(slip, cfg) {
  return cfg.markets.map(m => {
    const s = marketStats(slip, m.id);
    const alive = !(s.n >= cfg.dead_market_min && s.brier !== null && s.brier >= s.baseBrier);
    const beats_base = s.n >= cfg.dead_market_min && s.brier !== null && s.brier < s.baseBrier;
    return { id: m.id, desc: m.desc, p: round(laplace(s.hits, s.n)), n_resolved: s.n, alive, beats_base };
  });
}

// WIN-ONLY VOICE: non-null ONLY when a mature, base-beating market resolved
// YESTERDAY in the captain's favor AGAINST the book (book said p<0.5, outcome true).
function computeVoice(slip, markets, cfg, todayStr) {
  for (const m of markets) {
    if (m.n_resolved < cfg.voice_min_resolutions || !m.beats_base || !m.alive) continue;
    const rows = slip.filter(s => s.book === "twin" && s.type === m.id && s.resolved && typeof s.p === "number");
    const last = rows[rows.length - 1];
    if (!last || last.date === undefined) continue;
    if (last.date >= todayStr) continue;                    // only settled days speak
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

function buildTwin(markets, voice, now) {
  const anyData = markets.some(m => m.n_resolved > 0);
  return {
    date: localDate(now),
    status: anyData ? (markets.every(m => m.n_resolved >= 30) ? "ok" : "warming_up") : "awaiting_data",
    low_confidence: !markets.every(m => m.n_resolved >= 30),
    generated_at: now.toISOString(),
    markets,
    voice,
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
  const today = localDate(now);
  const slip = readLines(SLIP);
  const preds = readLines(PRED);
  const markets = computeMarkets(slip, cfg);
  const seals = sealToday(preds, markets, today, now.toISOString());
  if (seals.length) {
    mkdirSync(dirname(PRED), { recursive: true });
    appendFileSync(PRED, seals.map(s => JSON.stringify(s)).join("\n") + "\n");
  }
  const voice = computeVoice(slip, markets, cfg, today);
  writeAtomic(TWIN, buildTwin(markets, voice, now));
  console.log(`twin: ${seals.length} bet(s) sealed (${markets.filter(m => m.alive).length}/${markets.length} markets alive) · voice ${voice ? "EARNED" : "silent"} → ${TWIN}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { computeMarkets, computeVoice, sealToday, buildTwin, marketStats, laplace, loadConfig, loadConfigFromObject };
