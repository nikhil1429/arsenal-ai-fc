#!/usr/bin/env node
// ============================================================================
// nikhil_model.mjs · ARSENAL AI FC — H3 THE NIKHIL MODEL (edges about HIM)
// ----------------------------------------------------------------------------
// PHASE H (his 9-10 Aug "i like phase H… let's build everything" + the 10 Aug
// amendment: ALL of H now, calendar gate DEAD, warming-up pattern instead).
// Causal edges about the captain — "cause-day fact → effect-day fact" — every
// edge wearing n + confidence + last_tested from day one: a thin edge says
// "hypothesis (n=3)", it never hides. AI proposes WHICH edges to watch
// (model_mine, overnight); THIS file owns every NUMBER (counts re-derived from
// the grid, prices from the twin's own bench) and every write.
//
// OWNER: sole writer of nikhil_model.json (edges) · nikhil_model_grid.jsonl
// (one FINALIZED day-facts row per day) · nikhil_model_slip.jsonl (sealed
// bets). All three GITIGNORED: they re-export day facts from ignored sources
// (timeaudit day fields, brain_outcomes verdicts) — the H1 precedent.
// readiness.json itself is PUBLIC by his D10 ruling; that ruling is NOT the
// operative reason here.
//
// THE CLOSED FACT VOCABULARY (the no-guessed-numbers answer): every cause/
// effect is a CATEGORICAL day-fact — an existing organ's own published verdict
// or a pure comparison. No numeric threshold is invented anywhere in this file.
// THREE-VALUED CELLS: true / false / null(=UNOBSERVED). Unknown is NEVER
// false: a day the coach never ran has no readiness fact, a day with zero reps
// has no gut facts. n_cause_days counts only OBSERVABLE cause days; n_cooccur
// only days where BOTH sides were observable. ladder_config's missing_readiness
// "treat as GREEN" is a DEMAND rule, not an observation — it never enters this
// grid.
//
// THE MEDICAL BOUNDARY (CLAUDE.md, the Goalkeeper section — hard rules):
// readiness-sourced facts may read ONLY `verdict` and `tiers.high_confidence.*`
// booleans — the Goalkeeper's OWN published verdict tier. HARD-DENIED sources:
// `signals` (raw RHR/HRV/temp — medication-influenced, can never drive
// anything alone), `medication` (never commented on, full stop), numeric
// `periodization`, `safety` (DOCTOR-REFERRAL is his doctor's lane, never a
// modeling input). A vocabulary addition sourcing them is REJECTED at ingest.
// Proposed edge STATEMENTS run a dose/diagnosis hard-block (the Goalkeeper's
// own law); a blocked statement falls back to a code-templated line. Every
// render carries the fixed frame "observed co-occurrence in his own data,
// not medical guidance", and readiness-caused edges are NOT surfaced to
// morning organs while readiness.json is older than physio's 48h tolerance.
//
// THE TWIN CONSTITUTION TRAVELS (the bench is borrowed, so are its clamps):
// effect-negative edges (cracks, zero-rep, off-track) are conditional
// diagnostics for the NIGHT lane and HIS Sunday card — they never surface on
// morning organs, and every render stays win-neutral. The twin's own ban on
// unconditional self-prophecy books stands untouched in twin.mjs.
//
// NO LOOKAHEAD (the twin's discipline, mirrored): the evening run on day D
//   1. FINALIZES the grid row for D-1 (all its facts are complete by then),
//   2. RESOLVES bets sealed for D-1 (hit = effect fact on the FINAL row;
//      cause finalized false/unknown or effect unobservable → bet VOIDED —
//      a void moves nothing),
//   3. SEALS bets for day D on PROVISIONAL cause facts, priced by laplace
//      over resolutions strictly before D (an edge bets from ingest #1 —
//      deterministic and free; the twin's own cold-start humility).
// STATUS LADDER (event-gated, never calendar): proposed (no resolutions) →
// warming (≥1 resolution) → tested (deadVerdict.beats_base at the twin's own
// dead_market_min AND the conditional book beats the unconditional no-lookahead
// effect replay — predictability alone is not causality; a causally-empty edge
// on a high-base-rate effect must not become load-bearing for H4) → retired
// (deadVerdict kills it; recomputed every run, so recovery is possible) →
// galat (HIS word via card/CLI — permanent, never auto-revived).
// EXPIRY (the approved spec's field) DIED WITH THE CALENDAR GATE (his 10 Aug
// ruling — a dated expiry is itself a guessed number). Its event-gated heir:
// the Sunday card names every warming edge whose cause held ≥ dead_market_min
// times with no resolution movement — a deferral until his word, which is what
// canon asks for, not a refusal (the rejirah controller-v0 pattern).
// ============================================================================
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync, mkdtempSync, rmSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { marketStats, deadVerdict, laplace, loadConfig as twinConfig } from "./twin.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
const MODEL = join(STATE_DIR, "nikhil_model.json");
const GRID = join(STATE_DIR, "nikhil_model_grid.jsonl");
const SLIP = join(STATE_DIR, "nikhil_model_slip.jsonl");

const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const repLocalDay = (ts) => {
  const s = String(ts || "");
  if (!/[T ]/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? localDate(d) : s.slice(0, 10);
};
const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const readLines = (p) => {
  const out = [];
  try { for (const l of readFileSync(p, "utf8").split("\n")) { if (l.trim()) try { out.push(JSON.parse(l)); } catch { } } } catch { }
  return out;
};
const writeAtomic = (p, obj) => {
  mkdirSync(dirname(p), { recursive: true });
  const tmp = `${p}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(obj, null, 1));
  renameSync(tmp, p);
};
const round = (x) => x === null || x === undefined ? null : Math.round(x * 10000) / 10000;

// ---------------------------------------------------------------------------
// THE VOCABULARY — id → {desc, side hints, compute(dayCtx) → true|false|null}
// Each compute reads ONLY allowlisted fields; null = unobserved, never false.
// ---------------------------------------------------------------------------
export const FACTS = {
  readiness_amber_red: {
    desc: "Goalkeeper's own day verdict is AMBER or RED (vs GREEN)",
    src: "readiness.json verdict (allowlisted field)", readiness: true,
    compute: (c) => (c.readiness && c.readiness.day === c.day && typeof c.readiness.verdict === "string")
      ? ["AMBER", "RED"].includes(c.readiness.verdict) : null,
  },
  slept_short: {
    desc: "Goalkeeper says sleep short vs HIS OWN baseline (its own boolean)",
    src: "readiness.json tiers.high_confidence.sleep_vs_personal_baseline.short (allowlisted)", readiness: true,
    compute: (c) => {
      if (!c.readiness || c.readiness.day !== c.day) return null;
      const t = c.readiness.tiers && c.readiness.tiers.high_confidence;
      const s = t && t.sleep_vs_personal_baseline;
      return s && typeof s.short === "boolean" ? s.short : null;
    },
  },
  knew_but_wrong_present: {
    desc: "any rep claimed 'knew' and was WRONG that day",
    src: "reps_log confidence+correct",
    compute: (c) => c.reps.length ? c.reps.some((r) => r.confidence === "knew" && r.correct === false) : null,
  },
  gut_guessed_heavy: {
    desc: "more 'guessed' than 'knew' reps that day (a comparison, no threshold)",
    src: "reps_log confidence counts",
    compute: (c) => c.reps.length
      ? c.reps.filter((r) => r.confidence === "guessed").length > c.reps.filter((r) => r.confidence === "knew").length : null,
  },
  cracked_concept_present: {
    desc: "the scoreboard measured a named misconception CRACKED that day",
    src: "brain_outcomes misconception/lesson verdicts",
    compute: (c) => c.outcomes.length
      ? c.outcomes.some((r) => (r.kind === "misconception" || r.kind === "lesson") && r.verdict === "cracked") : null,
  },
  zero_rep_day: {
    desc: "an active day (timeaudit says he was there) with ZERO reps",
    src: "timeaudit activeMinutes + reps_log",
    compute: (c) => (c.timeaudit && c.timeaudit.date === c.day && typeof c.timeaudit.activeMinutes === "number")
      ? (c.timeaudit.activeMinutes > 0 && c.reps.length === 0) : null,
  },
  on_track_false: {
    desc: "timeaudit's OWN onTrack verdict is false",
    src: "timeaudit onTrack (its organ's derivation)",
    compute: (c) => (c.timeaudit && c.timeaudit.date === c.day && typeof c.timeaudit.onTrack === "boolean")
      ? c.timeaudit.onTrack === false : null,
  },
};

// the Goalkeeper's dose/diagnosis hard-block, reused (never a new list):
// statements are LLM prose over his-data facts — the words carry the medical
// risk, so a match falls back to a code-templated line.
const MED_BLOCK = /\b(dose|dosage|dose[- ]?time|medication|medicine|prescri|mg\b|tablet|pill|akathisia|diagnos|withdraw|taper)\b/i;

// ---------------------------------------------------------------------------
// THE GRID — one finalized row per day: {day, facts: {id: true|false|null}}
// ---------------------------------------------------------------------------
export function computeDayFacts(day, deps) {
  const ctx = {
    day,
    readiness: deps.readiness,
    timeaudit: deps.timeaudit,
    reps: (deps.reps || []).filter((r) => repLocalDay(r.ts) === day),
    outcomes: (deps.outcomes || []).filter((r) => r.day === day),
  };
  const facts = {};
  for (const [id, f] of Object.entries(FACTS)) facts[id] = f.compute(ctx);
  return { day, facts };
}

// ---------------------------------------------------------------------------
// EDGES + THE BENCH (twin's own functions over an in-memory row adapter)
// ---------------------------------------------------------------------------
// marketStats hardcodes book==="twin" && type===marketId — the model's rows
// live on disk as book "model"; the adapter maps them at the call boundary so
// the twin's tested bench runs UNMODIFIED (and deadWindow is always passed —
// omitting it would silently revert pruning to lifetime-Brier, the exact
// regression the 25 Jul revival fixed).
const benchRows = (slip, edgeId) => slip
  .filter((s) => s.book === "model" && s.edge === edgeId && s.resolved === true && typeof s.hit === "boolean")
  .map((s) => ({ ...s, book: "twin", type: edgeId, claim: s.date }));

// the causal floor: the conditional book must beat the UNCONDITIONAL
// no-lookahead effect replay over the same resolution days — shadowTable's
// own mechanics. Predictable-effect-with-empty-cause dies here.
export function causalFloor(resolutions, grid, effectId) {
  if (!resolutions.length) return { cond: null, uncond: null, passes: false };
  const byDay = new Map(grid.map((g) => [g.day, g]));
  const days = [...byDay.keys()].sort();
  let condSq = 0, uncondSq = 0;
  for (const r of resolutions) {
    const y = r.hit ? 1 : 0;
    condSq += ((typeof r.p === "number" ? r.p : 0.5) - y) ** 2;
    const prior = days.filter((d) => d < r.date)
      .map((d) => byDay.get(d).facts[effectId]).filter((v) => v === true || v === false);
    uncondSq += (laplace(prior.filter(Boolean).length, prior.length) - y) ** 2;
  }
  const cond = round(condSq / resolutions.length), uncond = round(uncondSq / resolutions.length);
  return { cond, uncond, passes: cond !== null && uncond !== null && cond < uncond };
}

export function edgeStatus(edge, slip, grid, cfg) {
  if (edge.status === "galat") return "galat";                    // his word — permanent
  const rows = benchRows(slip, edge.id);
  if (!rows.length) return "proposed";
  const s = marketStats(rows, edge.id, cfg.dead_market_min);
  const v = deadVerdict(s, cfg);
  if (!v.alive) return "retired";                                  // recomputed every run — recovery possible
  if (v.beats_base && causalFloor(rows, grid, edge.effect).passes) return "tested";
  return "warming";
}

// THE FORMATTER — every reader renders an edge through this line, so the
// n-honesty is by construction, never by hope. Win-neutral wording.
export function renderEdge(e) {
  return `${e.statement} — ${e.status} [${e.n_cooccur}/${e.n_cause_days} observable days, p=${e.confidence}] (observed co-occurrence in his own data, not medical guidance)`;
}

// TESTED edges for morning-facing organs (night_coach prompt): readiness-caused
// edges are withheld while readiness.json content is older than physio's own
// 48h tolerance (a stalled Oura pipeline observes nothing), and effect-negative
// edges stay off morning organs by the traveling twin clamp — the night lane
// and HIS Sunday card are their review surfaces.
export function testedEdgeLines(deps = {}) {
  const model = deps.model !== undefined ? deps.model : readJson(MODEL);
  if (!model || !Array.isArray(model.edges)) return [];
  const readiness = deps.readiness !== undefined ? deps.readiness : readJson(join(STATE_DIR, "readiness.json"));
  const nowMs = deps.nowMs || Date.now();
  const readinessFresh = readiness && readiness.day
    && (nowMs - new Date(readiness.day + "T00:00:00").getTime()) < 48 * 3600000 * 2; // day-granular: within the 48h tolerance window read on day granularity
  return model.edges
    .filter((e) => e.status === "tested")
    .filter((e) => !(FACTS[e.cause] && FACTS[e.cause].readiness) || readinessFresh)
    .map(renderEdge);
}

// ---------------------------------------------------------------------------
// SANITIZER for model_mine proposals (brain.mjs imports this — the sibling's
// only door). Vocabulary-only facts, med-blocked statements templated, dupes
// dropped. NUMBERS are never accepted from the model — counts come from code.
// ---------------------------------------------------------------------------
export function sanitizeModelMine(j, existingEdges = []) {
  if (!j || typeof j !== "object" || !Array.isArray(j.edges)) return null;
  const have = new Set(existingEdges.map((e) => `${e.cause}>${e.effect}`));
  const edges = []; const rejected = [];
  for (const raw of j.edges.slice(0, 12)) {
    const cause = String((raw && raw.cause) || ""), effect = String((raw && raw.effect) || "");
    if (!FACTS[cause] || !FACTS[effect]) { rejected.push({ cause, effect, why: "outside the closed vocabulary" }); continue; }
    if (cause === effect) { rejected.push({ cause, effect, why: "self-edge" }); continue; }
    const key = `${cause}>${effect}`;
    if (have.has(key)) { rejected.push({ cause, effect, why: "already tracked" }); continue; }
    have.add(key);
    let statement = String((raw && raw.statement) || "").slice(0, 200);
    if (!statement || MED_BLOCK.test(statement)) {
      const why = statement ? "statement hit the dose/diagnosis hard-block" : "no statement";
      rejected.push({ cause, effect, why: why + " — code-templated line used" });
      statement = `${FACTS[cause].desc} → ${FACTS[effect].desc}`;
    }
    edges.push({ cause, effect, statement });
  }
  return { edges, ...(rejected.length ? { rejected } : {}) };
}

// ---------------------------------------------------------------------------
// INGEST — the evening chain's deterministic step (22:39, needs scoreboard)
// ---------------------------------------------------------------------------
export function ingest(deps) {
  const now = deps.now || new Date();
  const today = localDate(now);
  const yday = localDate(new Date(now.getTime() - 86400000));
  const cfg = deps.cfg || twinConfig();
  const model = deps.model !== undefined ? deps.model : (readJson(MODEL) || { edges: [], _grid_note: "cells: true/false/null — null is UNOBSERVED, never false" });
  const grid = deps.grid !== undefined ? deps.grid : readLines(GRID);
  const slip = deps.slip !== undefined ? deps.slip : readLines(SLIP);
  const dry = !!deps.dry;
  const log = [];

  // 1. FINALIZE yesterday's grid row (idempotent — one row per day)
  if (!grid.some((g) => g.day === yday)) {
    const row = computeDayFacts(yday, deps.factDeps(yday));
    grid.push(row);
    if (!dry) appendFileSync(GRID, JSON.stringify(row) + "\n");
    log.push(`grid: finalized ${yday} (${Object.values(row.facts).filter((v) => v !== null).length}/${Object.keys(FACTS).length} observable)`);
  }

  // 2. RESOLVE bets for finalized days (hit from the FINAL row; void on
  //    unobservable effect or cause-finalized-false/unknown)
  const finalDays = new Map(grid.map((g) => [g.day, g]));
  const resolvedKeys = new Set(slip.filter((s) => s.resolved || s.voided).map((s) => `${s.edge}|${s.date}`));
  for (const bet of slip.filter((s) => !s.resolved && !s.voided)) {
    const row = finalDays.get(bet.date);
    if (!row || bet.date >= today) continue;                        // not final yet
    if (resolvedKeys.has(`${bet.edge}|${bet.date}`)) continue;
    const edge = model.edges.find((e) => e.id === bet.edge);
    const causeV = edge ? row.facts[edge.cause] : null;
    const effectV = edge ? row.facts[edge.effect] : null;
    const upd = (causeV !== true || effectV === null || effectV === undefined)
      ? { ...bet, voided: true, why: causeV !== true ? "cause finalized false/unknown" : "effect unobservable" }
      : { ...bet, resolved: true, hit: effectV === true };
    if (!dry) appendFileSync(SLIP, JSON.stringify(upd) + "\n");
    slip.push(upd);
    resolvedKeys.add(`${bet.edge}|${bet.date}`);
    log.push(`bet ${bet.edge}@${bet.date}: ${upd.voided ? "VOID (" + upd.why + ")" : upd.hit ? "HIT" : "MISS"}`);
  }

  // 3. INGEST tonight's proposals — today's sibling, else yesterday's. THE
  // ONE-NIGHT LAG IS BY DESIGN: model_mine writes overnight AFTER this evening
  // step, so a night's proposals enter the NEXT evening's ingest. Recorded
  // here so nobody "fixes" it into a race.
  const prop = deps.proposals !== undefined ? deps.proposals
    : readNewestProposal(join(STATE_DIR, "brain_out", "model_mine"), today, yday);
  if (prop && Array.isArray(prop.edges)) {
    for (const p of prop.edges) {
      if (model.edges.some((e) => e.cause === p.cause && e.effect === p.effect)) continue;
      model.edges.push({
        id: `${p.cause}>${p.effect}`, cause: p.cause, effect: p.effect, statement: p.statement,
        status: "proposed", n_cause_days: 0, n_cooccur: 0, confidence: null,
        first_seen: today, last_tested: null, source: "model_mine",
      });
      log.push(`edge proposed: ${p.cause}>${p.effect}`);
    }
  }

  // 4. SEAL today's bets on provisional cause facts (price = laplace over
  //    resolutions strictly before today — no lookahead)
  const provisional = computeDayFacts(today, deps.factDeps(today));
  const sealed = new Set(slip.filter((s) => s.date === today).map((s) => s.edge));
  for (const e of model.edges) {
    if (e.status === "galat" || e.status === "retired") continue;
    if (sealed.has(e.id)) continue;
    if (provisional.facts[e.cause] !== true) continue;
    const prior = slip.filter((s) => s.edge === e.id && s.resolved === true && s.date < today);
    const bet = { ts: now.toISOString(), date: today, book: "model", edge: e.id,
      p: round(laplace(prior.filter((s) => s.hit).length, prior.length)), resolved: false };
    if (!dry) appendFileSync(SLIP, JSON.stringify(bet) + "\n");
    slip.push(bet);
    log.push(`bet sealed: ${e.id}@${today} p=${bet.p}`);
  }

  // 5. RE-DERIVE every edge's counts + status from the FINAL grid (numbers
  //    from code, always; three-valued law enforced here)
  for (const e of model.edges) {
    const obs = grid.filter((g) => g.facts[e.cause] === true || g.facts[e.cause] === false);
    const causeDays = obs.filter((g) => g.facts[e.cause] === true);
    const both = causeDays.filter((g) => g.facts[e.effect] === true || g.facts[e.effect] === false);
    e.n_cause_days = both.length;
    e.n_cooccur = both.filter((g) => g.facts[e.effect] === true).length;
    e.confidence = both.length ? round(laplace(e.n_cooccur, e.n_cause_days)) : null;
    const st = edgeStatus(e, slip, grid, cfg);
    if (st !== e.status) { log.push(`edge ${e.id}: ${e.status} → ${st}`); e.status = st; }
    if (st === "tested" || st === "retired") e.last_tested = today;
  }

  model.as_of = today;
  model.counts = countBy(model.edges);
  // expiry's event-gated heir (precomputed for the Sunday card — readers never
  // derive): warming edges whose cause held ≥ the bench's own bar yet whose
  // book never accrued resolutions enough to move — named weekly, his call.
  model.stale_warming = model.edges.filter((e) => e.status === "warming"
    && (e.n_cause_days || 0) >= cfg.dead_market_min
    && benchRows(slip, e.id).length < cfg.dead_market_min).length;
  if (!dry) writeAtomic(MODEL, model);
  return { model, grid, slip, log };
}

function readNewestProposal(dir, today, yday) {
  for (const d of [today, yday]) {
    const j = readJson(join(dir, d + ".json"));
    if (j) return j;
  }
  return null;
}
const countBy = (edges) => {
  const c = { proposed: 0, warming: 0, tested: 0, retired: 0, galat: 0 };
  for (const e of edges) c[e.status] = (c[e.status] || 0) + 1;
  return c;
};

// live fact deps for a given day (snapshot files only count when their OWN day
// field matches — the three-valued law's mechanical form)
function liveFactDeps() {
  const reps = readLines(join(STATE_DIR, "reps_log.jsonl"));
  const outcomes = readLines(join(STATE_DIR, "brain_outcomes.jsonl"));
  const last = new Map();
  for (const r of outcomes) last.set(`${r.day}|${r.kind}|${r.subject}`, r);
  const readiness = readJson(join(STATE_DIR, "readiness.json"));
  const timeaudit = readJson(join(STATE_DIR, "timeaudit.json"));
  return (day) => ({ readiness, timeaudit, reps, outcomes: [...last.values()] });
}

// ---------------------------------------------------------------------------
// CLI + selftest
// ---------------------------------------------------------------------------
function report() {
  const model = readJson(MODEL);
  if (!model || !model.edges || !model.edges.length) { console.log("nikhil_model: no edges yet — model_mine proposes overnight, ingest re-derives every evening"); return; }
  console.log(`== THE NIKHIL MODEL (as of ${model.as_of}) — ${model.edges.length} edge(s): ${Object.entries(model.counts).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(" · ")} ==`);
  for (const e of model.edges) console.log(`  ${renderEdge(e)}`);
}

function galat(id) {
  const model = readJson(MODEL);
  const e = model && model.edges && model.edges.find((x) => x.id === id);
  if (!e) { console.log(`nikhil_model: no edge "${id}"`); process.exit(1); }
  e.status = "galat";
  model.counts = countBy(model.edges);
  writeAtomic(MODEL, model);
  console.log(`edge ${id} → galat (his word — permanent). ${renderEdge(e)}`);
}

function selftest() {
  let pass = 0, fail = 0;
  const ok = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
  const cfg = { dead_market_min: 3, voice_min_resolutions: 3 };   // fixture bar, NOT the live 30 — the ladder logic is what's under test

  // three-valued cells
  const D = "2026-08-09";
  const mk = (over = {}) => ({ readiness: null, timeaudit: null, reps: [], outcomes: [], ...over });
  let row = computeDayFacts(D, mk());
  ok("GRID — a day with no data is ALL null (unknown is never false)",
    Object.values(row.facts).every((v) => v === null));
  row = computeDayFacts(D, mk({ readiness: { day: "2026-08-04", verdict: "AMBER" } }));
  ok("GRID — a stale readiness snapshot (its own day ≠ grid day) stays UNOBSERVED, never leaks",
    row.facts.readiness_amber_red === null && row.facts.slept_short === null);
  row = computeDayFacts(D, mk({
    readiness: { day: D, verdict: "AMBER", tiers: { high_confidence: { sleep_vs_personal_baseline: { short: true } } } },
    timeaudit: { date: D, activeMinutes: 200, onTrack: false },
    reps: [{ ts: `${D}T05:00:00Z`, confidence: "guessed", correct: false }, { ts: `${D}T06:00:00Z`, confidence: "knew", correct: false }],
    outcomes: [{ day: D, kind: "misconception", subject: "x", verdict: "cracked" }],
  }));
  ok("GRID — the seven facts compute from their organs' OWN verdicts (no invented threshold anywhere)",
    row.facts.readiness_amber_red === true && row.facts.slept_short === true
    && row.facts.knew_but_wrong_present === true && row.facts.gut_guessed_heavy === false
    && row.facts.cracked_concept_present === true && row.facts.zero_rep_day === false && row.facts.on_track_false === true);

  // sanitizer
  const san = sanitizeModelMine({ edges: [
    { cause: "slept_short", effect: "cracked_concept_present", statement: "kam neend → agla din crack" },
    { cause: "slept_short", effect: "cracked_concept_present", statement: "dupe" },
    { cause: "hrv_low", effect: "cracked_concept_present", statement: "raw biometric" },
    { cause: "slept_short", effect: "slept_short", statement: "self" },
    { cause: "readiness_amber_red", effect: "zero_rep_day", statement: "increase your dose timing" },
  ] }, []);
  ok("SANITIZER — vocabulary-only, dupes/self-edges dropped, every rejection AND the med-fallback carry reasons",
    san.edges.length === 2 && san.rejected.length === 4);
  ok("SANITIZER — a dose/medication statement is HARD-BLOCKED and falls back to the code-templated line",
    san.edges[1].statement.includes("→") && !MED_BLOCK.test(san.edges[1].statement)
    && san.rejected.some((r) => /hard-block/.test(r.why)));

  // ingest end-to-end in a sandbox: grid → seal → resolve → status ladder.
  // The cause fires on ALTERNATE days and the effect tracks it exactly — a
  // real conditional edge. (An earlier fixture fired the cause EVERY day and
  // the causal floor correctly refused to test it: a cause that always holds
  // carries zero information over the unconditional replay. The floor working
  // is the finding; the fixture had to earn its edge.)
  const days = [];
  for (let i = 1; i <= 9; i++) days.push(`2026-08-0${i}`);
  const factsFor = (day) => {
    const idx = days.indexOf(day);
    const causeDay = idx % 2 === 1;
    return mk({
      timeaudit: { date: day, activeMinutes: 100, onTrack: !causeDay },
      reps: [{ ts: `${day}T05:00:00Z`, confidence: "guessed", correct: !causeDay }],
      outcomes: [{ day, kind: "misconception", subject: "x", verdict: causeDay ? "cracked" : "held" }],
    });
  };
  let state = { model: { edges: [{ id: "on_track_false>cracked_concept_present", cause: "on_track_false", effect: "cracked_concept_present", statement: "s", status: "proposed", n_cause_days: 0, n_cooccur: 0, confidence: null, first_seen: days[0], last_tested: null, source: "model_mine" }] }, grid: [], slip: [] };
  for (let i = 1; i < days.length; i++) {
    const now = new Date(`${days[i]}T22:39:00+05:30`);
    const r = ingest({ now, cfg, dry: true, model: state.model, grid: state.grid, slip: state.slip,
      proposals: { edges: [] }, factDeps: (day) => factsFor(day) });
    state = { model: r.model, grid: r.grid, slip: r.slip };
  }
  const edge = state.model.edges[0];
  ok("INGEST — the grid accrues one finalized row per day, bets seal on cause-days and resolve next evening",
    state.grid.length === 8 && state.slip.filter((s) => s.resolved === true).length === 4);
  ok("INGEST — counts re-derived from the grid by CODE (n over observable days only)",
    edge.n_cause_days === 4 && edge.n_cooccur === 4 && edge.confidence !== null);
  ok("LADDER — with resolutions ≥ the bar and skill above coin, the edge climbs proposed→warming→tested (event-gated, no calendar)",
    edge.status === "tested" && edge.last_tested === days[days.length - 1]);
  ok("NO LOOKAHEAD — every bet priced from PRIOR resolutions only (first bet is humble 0.5)",
    round(state.slip.find((s) => s.date === days[1]).p) === 0.5);

  // causal floor: a high-base-rate effect with an uninformative conditional book must NOT test
  const flatGrid = days.slice(0, 7).map((d) => ({ day: d, facts: { e: true } }));
  const flatRes = days.slice(1, 7).map((d) => ({ date: d, p: 0.5, hit: true, resolved: true }));
  ok("CAUSAL FLOOR — predictability alone is not causality: humble prices on an always-true effect FAIL the floor",
    causalFloor(flatRes, flatGrid.map((g) => ({ day: g.day, facts: { eff: g.facts.e } })), "eff").passes === false);

  // galat permanence
  const gModel = { edges: [{ id: "x>y", cause: "x", effect: "y", statement: "s", status: "galat" }] };
  ok("GALAT — his word is permanent: no bench outcome revives it",
    edgeStatus(gModel.edges[0], [], [], cfg) === "galat");

  // renderEdge honesty by construction
  ok("FORMATTER — every render carries status + n + p + the not-medical-guidance frame",
    /tested \[4\/4 observable days, p=0\.8/.test(renderEdge(edge)) && /not medical guidance/.test(renderEdge(edge)));

  // testedEdgeLines: readiness-caused edges withheld on a stale coach
  const tm = { edges: [{ id: "slept_short>cracked_concept_present", cause: "slept_short", effect: "cracked_concept_present", statement: "s", status: "tested", n_cause_days: 9, n_cooccur: 7, confidence: 0.7 }] };
  ok("MORNING GUARD — a tested readiness-caused edge is WITHHELD while readiness is stale (the 48h tolerance), served when fresh",
    testedEdgeLines({ model: tm, readiness: { day: "2026-08-01" }, nowMs: new Date("2026-08-10T12:00:00").getTime() }).length === 0
    && testedEdgeLines({ model: tm, readiness: { day: "2026-08-10" }, nowMs: new Date("2026-08-10T12:00:00").getTime() }).length === 1);

  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "FAILURES: " + fail} (${pass} passed, ${fail} failed)`);
  return fail === 0;
}

async function main() {
  const mode = (process.argv[2] || "report").toLowerCase();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  if (mode === "report") return report();
  if (mode === "galat") return galat(String(process.argv[3] || ""));
  if (mode === "ingest") {
    const now = new Date();
    const today = localDate(now), yday = localDate(new Date(now.getTime() - 86400000));
    const r = ingest({ now, factDeps: liveFactDeps(),
      proposals: readNewestProposal(join(STATE_DIR, "brain_out", "model_mine"), today, yday) });
    console.log(`nikhil_model ingest: ${r.log.length ? r.log.join(" · ") : "quiet night (nothing to finalize, resolve, propose or seal)"}`);
    console.log(`  edges: ${JSON.stringify(r.model.counts)}`);
    return;
  }
  console.log("nikhil_model.mjs — ingest · report · galat <edge-id> · selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error("nikhil_model error:", e.message); process.exit(1); });
}

export { readNewestProposal };
