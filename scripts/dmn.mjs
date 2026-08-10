#!/usr/bin/env node
// ============================================================================
// dmn.mjs · ARSENAL AI FC — THE DEFAULT MODE NETWORK ("The Rest Room")
// ----------------------------------------------------------------------------
// WHAT:  The brain region that fires when the captain is AWAY (CYBORG_BRAIN.md
//        §7a): idle free tanks become scratch cortex. It pulls his REAL
//        weak-point vector (calibration danger zone + stalling concepts +
//        lowest-confidence Twin markets), fans a MONTE-CARLO INTERVIEW
//        SIMULATION across the pool — each rollout a different interviewer
//        persona probing exactly those soft spots — then deterministically
//        clusters where the simulated candidate stalls and PRE-DRAFTS the
//        15-second reframe + next drill for each predicted stall into
//        dmn_precache.json.
// M16 — THE DREAM STADIUM (the cyborg stretch): the old engine dreamed on ONE
//        tank, 8 serial rollouts (a wire-scar: parallelism available, unused).
//        The new engine borrows EVERY idle tank — the away-gate IS the
//        tank-borrow gate: with the captain gone there is no conversation to
//        stall, so pickTank's mid-talk T1/T2 clamp does not bind — and drains
//        them in PARALLEL (per-lane serial for RPM sanity, Promise.all across
//        lanes), up to ~100 rollouts/night. A VERIFICATION PHASE then attacks
//        every cluster with a hostile counter-rollout: a "broken" reframe is
//        DROPPED — better no ammunition than wrong ammunition. The old engine
//        is FROZEN VERBATIM below as dreamLegacy (layering, never replace).
// LAWS:  OUTPUT IS INERT — it only loads ammunition; nothing reads it aloud
//        (M7's Predictive Presence serves it through the earned-voice gate).
//        Dreams ONLY about real weak points from real reps — never fabricated
//        ones (no signal → no dream, honest skip). Fires ONLY when: the
//        captain is away (ActivityWatch AFK), the tone allows it (conserve =
//        MUTED — a depleted captain rests), and the lanes have measured
//        headroom (use-it-or-lose-it quota; blast radius $0). Rollouts are
//        hard-capped. Sole writer of dmn_precache.json (gitignored — it names
//        his weaknesses).
// MODES: node scripts/dmn.mjs            → gate-checked dream pass
//        node scripts/dmn.mjs --force    → skip the away-check (real-run/test)
//        node scripts/dmn.mjs status · selftest
// ============================================================================

import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generatePool, loadHippoKeys } from "./hippocampus.mjs";
// 17 Jul: the dreams ride Claude (cognition law) — the lane/borrow machinery
// stays as the ROLLOUT BUDGET; lane.key is now just a slot label.
// E2E audit 25 Jul 2026: this pulled the SYNC claudeGen (execFileSync). Every
// `await gen(...)` inside Promise.all therefore blocked the whole event loop, so
// the M16 "PARALLEL lanes" were strictly serial — a full stadium night was ~108
// blocking `claude -p` calls back to back (30 min to hours for one hourly pass,
// passes overlapping each other). claudeGenAsync returns the SAME shape off a
// real promise, so Promise.all across lanes finally buys real concurrency while
// each lane stays serial for RPM sanity. (It also removes the sync-return trap
// that made the old `gen(...).catch(...)` a TypeError.)
import { claudeGenAsync, ledgerForensics } from "./claudegen.mjs";
import { loadBoard, headroomOf, recordUse, record429, stateOf } from "./fuelboard.mjs";
import { currentTone } from "./tone.mjs";
// WIRING AUDIT (11 Aug 2026): dossierKey/conceptRegistry come from here too —
// the weak vector's `concept` slot has to survive thalamus's OWN precache join
// (thalamus.mjs:900), so it is resolved with thalamus's OWN resolver rather than
// a second matcher that could drift away from it. Read-only, same as pendingBg.
import { pendingBg, dossierKey, conceptRegistry } from "./thalamus.mjs";   // M22 — read-only; the thalamus owns bg_queue.jsonl
// WIRING AUDIT (11 Aug 2026): the SECOND SPOTLIGHT serves the same moment shape the
// WAKE does, so it now serves it through the SAME door instead of its own blind cut.
// Read-only import — cortex.mjs owns that door; see the block above drainBg for why.
import { momentBlock } from "./cortex.mjs";

// E2E audit 25 Jul 2026: claudeGen is SYNCHRONOUS (execFileSync) and returns a
// plain object — calling .catch() on it is a TypeError that kills the whole pass
// the instant the LLM lane actually works. A thunk + try/catch tolerates BOTH a
// sync return and a promise, so injected async deps keep working too.
// Audit 4 Aug 2026 (#8): the old form was `catch { return { ok: false }; }` — it
// DISCARDED the exception. A 22-hour outage then left zero forensics: record429
// stores only a timestamp, so the only record of WHY the Rest Room died was a
// message that named the wrong engine. The text is now carried out as `error`.
const genSafe = async (fn) => {
  try { return await fn(); }
  catch (e) { return { ok: false, threw: true, error: String((e && e.message) || e).slice(0, 600) }; }
};
// THE DEFAULT LANE GENERATOR — async by law (see the import note above). Named so
// the selftest can prove it never hands back a synchronous value again.
const DMN_MODEL = "sonnet";
const defaultGen = (p, _lane) => claudeGenAsync(p, DMN_MODEL);

// ── #8 · WHOSE ENGINE FAILED? ───────────────────────────────────────────────
// Since the 17 Jul migration EVERY rollout rides `claude -p` (see the header):
// the tanks are a ROLLOUT BUDGET, not a Gemini quota this organ spends. But the
// old code wrote any `limit_hit` through fuelboard.record429 — the fuelboard's
// GEMINI-quota instrument — and fuelboard.mjs:96 turns one `last_429` stamp into
// DEAD-TILL-LOCAL-MIDNIGHT. On 1 Aug 2026 one Claude-side error killed five
// tanks in 2.6s and the DMN skipped for ~22h reporting "idle-tank headroom 0",
// i.e. the exact lie this file's own comment at :155 already warns about.
// A Gemini fault is now the ONLY thing that may touch a tank:
//   · `status === 429` — the wire shape a real Gemini/HTTP client returns
//     (claudeGen has NO `status` field; it signals a plan wall as `limit_hit`)
//   · an explicit `engine: "gemini"` on an injected generator
// Everything else stands the LANE down (budget discipline, unchanged) and is
// recorded in the brain ledger instead of on the fuel gauge.
const geminiFault = (r) => !!(r && (r.status === 429 || r.engine === "gemini"));
const engineFault = (r) => !!(r && (r.limit_hit || r.threw) && !geminiFault(r));

// ── #7 · THE DMN'S SPEND BECOMES VISIBLE TO THE BRAIN BUDGET ────────────────
// Measured 4 Aug 2026: 0 of 2,882 brain_ledger.jsonl rows are DMN, while a full
// stadium night fires up to ~57 `claude -p` calls (49 rollouts + up to 8
// counter-rollouts) — every one of them on the same Max subscription window
// brain.mjs rations. The window could therefore be spent twice over and the
// governor would never see it. Rows are the SAME shape brain.mjs and cortex.mjs
// write (cortex.mjs:301 is the precedent), so windowUsage() picks them up with
// no change on the brain side. HONESTY: a component the engine did not report
// is null, never 0, and an estimated total says so (`tokens_estimated`).
// A ledger write is TELEMETRY — same law as safeUse: it may never kill the pass.
// (BLEDGER itself is declared with the other paths below, after __dirname.)
const DMN_JOBS = ["dmn_rollout", "dmn_counter", "dmn_bg_drain"];
function ledgerRow(job, r, lane, now = new Date()) {
  return {
    ts: now.toISOString(), job, engine: "claude", model: DMN_MODEL,
    input_tokens: r.input_tokens ?? null, output_tokens: r.output_tokens ?? null,
    cache_creation_tokens: r.cache_creation_tokens ?? null, cache_read_tokens: r.cache_read_tokens ?? null,
    total_tokens: r.total_tokens || 0, tokens_estimated: r.tokens_estimated !== false && !(r.input_tokens || r.output_tokens),
    duration_ms: r.duration_ms || 0, ok: !!r.ok, error: r.error || null, limit_hit: !!r.limit_hit,
    // #8 forensics: which lane, and what the engine actually said. The three
    // engine fields moved to claudegen's ledgerForensics on 10 Aug 2026 (wiring
    // audit): they were hand-written HERE and nowhere else, so error_envelope —
    // the one field carrying stop_reason/session_id when the CLI still returns a
    // `result` — reached 0 of the organism's 4,558 ledger rows. Same shape now
    // in nightshift's genLedgered; `lane` stays dmn's own.
    lane: lane || null, ...ledgerForensics(r),
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const PRECACHE  = join(STATE_DIR, "dmn_precache.json");
const BLEDGER   = join(STATE_DIR, "brain_ledger.jsonl");   // #7 — the shared window ledger (append-only; brain.mjs owns the schema)
const AW = "http://localhost:5600";

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const MAX_ROLLOUTS = 8;                              // legacy engine's cap (frozen)
// MIN_STADIUM_BUDGET preserves the pre-audit literal `8` in `totalBudget < 8`
// VERBATIM — no new number is guessed here. It is the legacy engine's own
// rollout cap (MAX_ROLLOUTS above): below one legacy dream's worth of budget
// there is nothing to cluster, so the stadium stands down. Named + surfaced as
// a have/need counter (#106) instead of a bare inequality.
const MIN_STADIUM_BUDGET = MAX_ROLLOUTS;
const MAX_ROLLOUTS_NIGHT = 100;                      // the stadium's hard cap (clusters saturate ~100)
const ROLLOUTS_PER_WEAK = 25;                        // depth per weak point before diminishing returns
const PERSONAS = ["a brisk recruiter screening for buzzwords", "a staff engineer mid-incident demanding ordered steps", "a principal engineer dissecting line-level mechanism", "a skeptical PM asking why an LLM at all"];
const PRECACHE_CAP = 6;                              // unchanged — the cap was never the problem
const WEAK_JOURNAL = join(STATE_DIR, "dmn_weak_vector.jsonl");

// ===========================================================================
// KAAM 2 (10 Aug 2026) — THE REST ROOM STOPS DELETING ITS OWN NIGHT
// ---------------------------------------------------------------------------
// MEASURED, not asserted: 25 dream passes since 6 Aug, roughly 1,154 metered
// calls, and EXACTLY ONE pass's output exists. The writer did a full replace —
// no read of the prior file, no merge anywhere — so each pass destroyed the last.
// By his local day, all 5 passes of 9 Aug were destroyed; the survivor is a
// 10 Aug 04:44 IST pass. 24 of 25 nights, paid for and deleted.
//
// The cap is NOT the defect and does not move: 6 entries was always enough. The
// defect is that the 6 were re-picked from ONE pass instead of from the day.
//
// THE CUT ORDER IS WRITTEN DOWN BEFORE THE CAP CUTS. That was the plan's own
// warning and it is the only subtle part: merge first, then sort, then cut —
// cut first and a better later entry vanishes with nothing said.
//   1. VERIFIED before unverified.
//   2. then VOTES (how many independent rollouts landed on this same stall).
//   3. then RECENCY (last_seen), newest first.
// DELIBERATE DEVIATION FROM THE PLAN, recorded rather than silently taken: the
// plan wrote this order as "votes, then verified, then recency". Verified is put
// FIRST here because this file's own law is "better no ammunition than wrong
// ammunition", and because the drill lane only ever consumes VERIFIED entries —
// a votes-first cut would let a 3-vote unverified entry evict a 2-vote verified
// one and quietly empty the very lane the merge exists to feed. If he wants the
// plan's literal order, it is this one function.
export function cutOrder(a, b) {
  return (Number(!!b.verified) - Number(!!a.verified))
    || ((b.votes || 0) - (a.votes || 0))
    || (String(b.last_seen || "").localeCompare(String(a.last_seen || "")));
}

// Identity of a dream: the same stall, on the same concept, is the same thought
// arriving again — that is a VOTE, not a duplicate.
const dreamKey = (e) => `${String(e.concept || "").toLowerCase()} ${String(e.stall_signature || "").toLowerCase()}`;

// WITHIN ONE DAY the file accumulates; a NEW day starts a clean sheet. That
// boundary is not a guessed number — it is the same local-day boundary every
// other organ in this repo already uses, and the drill compiler reads the file
// once per evening, so a day is exactly the window that has a consumer.
export function mergePrecache(prior, fresh) {
  if (!prior || !Array.isArray(prior.entries) || prior.date !== fresh.date) {
    return { ...fresh, entries: fresh.entries.slice(0, PRECACHE_CAP), passes_today: 1, merged: false,
      entries_seen_today: fresh.entries.length, rollouts_today: fresh.rollouts || 0 };
  }
  const byKey = new Map();
  for (const e of prior.entries) byKey.set(dreamKey(e), { ...e, first_seen: e.first_seen || prior.dreamed_at, last_seen: e.last_seen || prior.dreamed_at });
  for (const e of fresh.entries) {
    const k = dreamKey(e), old = byKey.get(k);
    byKey.set(k, old ? {
      ...e,
      // a repeat stall GAINS votes — that is the whole point of keeping the day
      votes: (old.votes || 0) + (e.votes || 0),
      // verified is a floor, never a ceiling: a broken cluster is DROPPED before
      // it ever reaches here (see the counter-rollout), so `false` only ever
      // means "this pass could not check it", which must not un-verify a night.
      verified: !!(old.verified || e.verified),
      first_seen: old.first_seen, last_seen: fresh.dreamed_at, passes: (old.passes || 1) + 1,
    } : { ...e, first_seen: fresh.dreamed_at, last_seen: fresh.dreamed_at, passes: 1 });
  }
  const all = [...byKey.values()].sort(cutOrder);
  return { ...fresh, entries: all.slice(0, PRECACHE_CAP), merged: true,
    passes_today: (prior.passes_today || 1) + 1,
    entries_seen_today: all.length,                       // says out loud what the cap dropped
    rollouts_today: (prior.rollouts_today || prior.rollouts || 0) + (fresh.rollouts || 0),
    // the day's weak vectors, deduped — the file itself now carries what it aimed at
    weak_vector: fresh.weak_vector };
}

// FROZEN, per the layering law: the exact pre-KAAM-2 behaviour, kept in the file
// so the improvement stays a measured difference rather than a claim. Nothing
// calls it; the selftest pins what it used to do.
export function mergePrecacheLegacy(_prior, fresh) {
  return { ...fresh, entries: fresh.entries.slice(0, PRECACHE_CAP) };   // full replace — the prior file was never read
}

// One line per pass. Append-only, and it is the ONLY durable record of what the
// Rest Room was aiming at on a given night — the precache itself rolls at the day
// boundary and its two inputs are gitignored with no history.
// ITS READER, since 11 Aug 2026: scoreboard.mjs JOIN 4 (`dmn_aim` / `dmn_aim_day`
// rows in brain_outcomes.jsonl, evening chain 22:38), which joins each night's
// aim to HIS reps on those concepts the same local day. For its first day alive
// this journal had NO reader at all — four rows, zero consumers — which made the
// measurement it exists for impossible without him opening a gitignored .jsonl
// himself. If that join is ever removed, this file is a black box again.
function journalWeakVector(row) {
  try {
    mkdirSync(dirname(WEAK_JOURNAL), { recursive: true });
    appendFileSync(WEAK_JOURNAL, JSON.stringify(row) + "\n");
  } catch { }   // fail silent, never loud — a journal must never cost a dream
}

// ---------------------------------------------------------------------------
// THE WEAK-POINT VECTOR — real signal only; empty = no dream (honest)
// ---------------------------------------------------------------------------
function weakVector(deps = {}) {
  const out = [];
  const cal = deps.calibration !== undefined ? deps.calibration : readJson(join(STATE_DIR, "calibration.json"));
  for (const d of (cal && cal.danger_zone) || []) out.push({ concept: d.topic || d.concept, why: "confident-but-wrong (danger zone)" });
  const ls = deps.ls !== undefined ? deps.ls : readJson(join(STATE_DIR, "learning_state.json"));
  const concepts = (ls && (ls.concepts || [])) || [];
  // E2E audit 25 Jul 2026: this leg read c.trend / c.trajectory / c.name — keys the
  // PRODUCER never writes. learning_state.mjs emits concepts as
  // { id, track, axis, fluency, velocity: { slope: "stalling"|"regressing"|... }, edge }
  // (learning_state.mjs:185,224), so "stalling concepts" — one of the three advertised
  // signals — was structurally dead: a concept could stall for weeks and never once
  // reach a dream. Mirrors examiner.mjs:75; the old keys stay in the chain (layering,
  // never replace) so injected/older shapes keep reading.
  for (const c of (Array.isArray(concepts) ? concepts : [])) {
    const slope = String((c.velocity && c.velocity.slope) || c.trend || c.trajectory || "");
    if (["stalling", "regressing"].includes(slope)) out.push({ concept: c.id || c.name || c.concept, why: `trajectory ${slope}` });
  }
  const twin = deps.twin !== undefined ? deps.twin : readJson(join(STATE_DIR, "twin.json"));
  // WIRING AUDIT (11 Aug 2026) — THE TWIN LEG PUT PROSE IN A CONCEPT FIELD.
  // It read `out.push({ concept: m.desc, ... })`. `desc` is the market's ENGLISH
  // SENTENCE, copied verbatim out of twin_config.json (twin.mjs:221 emits it
  // unchanged) — live today all three are BEHAVIOUR markets: "a real study
  // session happens today", "the never-zero floor is touched today", "first
  // Learning-bucket focus lands by 09:30". Every consumer treats this field as a
  // CONCEPT ID: rolloutPrompt() below writes it into "the candidate's known soft
  // spot" and fans ROLLOUTS_PER_WEAK personas + a counter-rollout at it,
  // setpiece.mjs:492 renders the surviving entry as a rest_room drill's
  // `concepts: [d.concept]`, and thalamus's precache join (thalamus.mjs:900)
  // resolves entry.concept through the concepts.json registry — where a
  // habit-tracking sentence can NEVER match, so a twin-sourced entry is
  // un-joinable by the very reader it was drafted for. Dormant on 11 Aug (live
  // markets at p=0.25/0.29/0.71, all outside the ±0.15 band) — one market
  // drifting to the coin-flip was all it took to fire.
  // THE FIX IS THE FIELD'S CONTRACT, NOT THE LEG. A market may enter the weak
  // vector only when it actually NAMES CANON: `conceptRegistry`/`dossierKey` are
  // thalamus's own resolvers, already exported and already the exact join this
  // entry has to survive downstream — reuse, not a second matcher. An explicit
  // `market.concept` wins if the config ever grows one (same shape as
  // setpiece.mjs:583's "council.mjs may carry ids one day"), else the desc's
  // WORDS are resolved one by one. Verified live 11 Aug: all three descs resolve
  // to nothing, so the leg is honestly dormant instead of loudly wrong.
  // NOT DECIDED HERE: whether the Twin should carry a concept-level market at
  // all. That is the captain's call on twin_config.json, not code's.
  const reg = deps.registry !== undefined ? deps.registry : conceptRegistry();
  for (const m of (twin && twin.markets) || []) {
    if (!(m.alive && m.n_resolved >= 5 && Math.abs(m.p - 0.5) < 0.15)) continue;
    const id = marketConcept(m, reg);
    if (!id) continue;                 // names no concept → no dream about it (better silent than absurd)
    out.push({ concept: id, why: "the Twin can't call it (max uncertainty)", market: m.id, market_desc: m.desc });
  }
  const seen = new Set();
  return out.filter(w => w.concept && !seen.has(w.concept) && seen.add(w.concept)).slice(0, 4);
}

// A Twin market → a canonical concept id, or null when it names none.
// The `reg.loaded` guard is load-bearing: dossierKey() passes ANY token straight
// back lowercased when the registry failed to load (thalamus.mjs:608), so
// without it a missing/held concepts.json would hand every word of the sentence
// back as a "concept" — the original bug, one word at a time.
function marketConcept(m, reg) {
  if (!(reg && reg.loaded)) return null;
  if (m.concept) return dossierKey(String(m.concept).toLowerCase(), reg);
  for (const w of String(m.desc || "").toLowerCase().split(/[^a-z0-9]+/)) {
    if (!w) continue;
    const id = dossierKey(w, reg);
    if (id) return id;
  }
  return null;
}

// FROZEN, per the layering law: the pre-11-Aug-2026 vector, verbatim, so the
// repair stays a MEASURED difference rather than a claim. Nothing calls it; the
// selftest pins what it used to emit (a prose sentence in the concept slot).
function weakVectorLegacy(deps = {}) {
  const out = [];
  const cal = deps.calibration !== undefined ? deps.calibration : readJson(join(STATE_DIR, "calibration.json"));
  for (const d of (cal && cal.danger_zone) || []) out.push({ concept: d.topic || d.concept, why: "confident-but-wrong (danger zone)" });
  const ls = deps.ls !== undefined ? deps.ls : readJson(join(STATE_DIR, "learning_state.json"));
  const concepts = (ls && (ls.concepts || [])) || [];
  for (const c of (Array.isArray(concepts) ? concepts : [])) {
    const slope = String((c.velocity && c.velocity.slope) || c.trend || c.trajectory || "");
    if (["stalling", "regressing"].includes(slope)) out.push({ concept: c.id || c.name || c.concept, why: `trajectory ${slope}` });
  }
  const twin = deps.twin !== undefined ? deps.twin : readJson(join(STATE_DIR, "twin.json"));
  for (const m of (twin && twin.markets) || []) {
    if (m.alive && m.n_resolved >= 5 && Math.abs(m.p - 0.5) < 0.15) out.push({ concept: m.desc, why: "the Twin can't call it (max uncertainty)", market: m.id });
  }
  const seen = new Set();
  return out.filter(w => w.concept && !seen.has(w.concept) && seen.add(w.concept)).slice(0, 4);
}

// ---------------------------------------------------------------------------
// THE GATES — away · tone · headroom (all three, or no dream)
// ---------------------------------------------------------------------------
const AFK_STALE_MS = 30 * 60 * 1000;                 // how stale the LAST AFK heartbeat may be before we stop trusting it
async function isAway(deps = {}) {
  const fetchFn = deps.fetchFn || fetch;
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetchFn(`${AW}/api/0/buckets`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { away: false, why: "ActivityWatch unreachable — assume present" };
    const buckets = await r.json();
    const afk = Object.keys(buckets).find(b => b.startsWith("aw-watcher-afk"));
    if (!afk) return { away: false, why: "no AFK bucket — assume present" };
    const ev = await (await fetchFn(`${AW}/api/0/buckets/${encodeURIComponent(afk)}/events?limit=1`)).json();
    const last = ev && ev[0];
    if (!last) return { away: false, why: "no AFK events" };
    // E2E audit 25 Jul 2026: the freshness test was `now - event.timestamp < 6h`,
    // i.e. it measured from the event's START. aw-watcher-afk merges a continuous
    // AFK stretch into ONE event: `timestamp` stays pinned at the moment he walked
    // away while `duration` grows on every heartbeat. So after 6 hours away the
    // check flipped to "present per ActivityWatch" and the Rest Room refused to
    // dream for the rest of the night — it went blind during exactly the longest,
    // most borrowable absences (sleep 23:00-07:00: every tick from ~05:00 skipped).
    // Freshness now rides the event's END, which is the thing that actually proves
    // the watcher is still alive; the window is short for that reason.
    const endMs = new Date(last.timestamp).getTime() + (Number(last.duration) || 0) * 1000;
    const away = !!(last.data && last.data.status === "afk") && (Date.now() - endMs) < AFK_STALE_MS;
    return { away, why: away ? "AFK per ActivityWatch" : "present per ActivityWatch" };
  } catch { return { away: false, why: "AFK check failed — assume present (never dream over his shoulder)" }; }
}

// M16 — THE TANK-BORROW GATE: when the captain is away there is no live
// conversation a borrow could stall, so pickTank's mid-talk T1/T2 clamp does
// not bind — every enabled, keyed, non-COLD tank with measured headroom is
// legal scratch cortex. Each lane may spend ONLY its own headroom
// (ceiling·(1−reserve) − used): use-it-or-lose-it quota, blast radius $0.
function borrowableTanks(board, keys = []) {
  // E2E audit 25 Jul 2026: this ALSO required `keys[t.key_index]` — a live GEMINI
  // key — to legalize a lane. Since the 17 Jul swap every rollout rides `claude -p`,
  // so a missing Gemini key says nothing about whether the lane can run. The moment
  // the captain cleaned up the now-useless GEMINI_API_KEY entries, borrowableTanks
  // would return [] forever and the whole Rest Room would die quietly behind the
  // misleading message "idle-tank headroom 0 < 8". The key stays as the slot LABEL
  // (advisory); enabled · non-COLD · measured headroom are the only real gates.
  return board.tanks
    .filter(t => t.enabled && t.key_index !== null && ["HOT", "WARM"].includes(stateOf(t)))
    .map(t => ({ tank: t, key: keys[t.key_index] || null, budget: headroomOf(t) }))
    .filter(l => l.budget > 0);
}

// ---------------------------------------------------------------------------
// THE DREAM — rollouts → deterministic clustering → verification → precache
// ---------------------------------------------------------------------------
function rolloutPrompt(weak, persona) {
  return `Simulate ONE tough interview probe. You are ${persona}. The candidate is an AI Product Engineer applicant whose known soft spot is: "${weak.concept}" (${weak.why}). Output STRICT JSON, no fences: {"stall_point": "<the exact sub-question where such a candidate most plausibly stalls, <=120 chars>", "reframe_15s": "<the 15-second reframe that would un-stick him, spoken, <=200 chars>", "drill": "<one concrete 10-minute drill for tomorrow, <=120 chars>"}`;
}
// M16 — the counter-rollout: hostile review before ammunition may be racked
function counterPrompt(c) {
  return `You are a hostile staff-engineer REVIEWER verifying pre-drafted coaching ammunition before it may ever be served to a learner. Concept: "${c.concept}". Claimed stall-point: "${c.stall_point}". The 15-second reframe: "${c.reframe_15s}". The drill: "${c.drill}". Attack all three: (1) is the reframe TECHNICALLY CORRECT — no subtle wrongness a junior would absorb? (2) is the drill concrete and doable in ~10 minutes? (3) is the stall plausible for an AI Product Engineer candidate? If ALL three hold answer sound, else broken. Output STRICT JSON, no fences: {"verdict":"sound"|"broken","why":"<=100 chars"}`;
}
const normKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(w => w.length > 3).sort().slice(0, 6).join("-");

function clusterRollouts(rollouts) {
  const clusters = new Map();
  for (const r of rollouts) {
    if (!r || !r.stall_point || !r.reframe_15s) continue;
    const k = normKey(r.stall_point);
    if (!k) continue;
    const c = clusters.get(k) || { ...r, votes: 0 };
    c.votes++;
    clusters.set(k, c);
  }
  return [...clusters.values()].sort((a, b) => b.votes - a.votes);
}

// M16 — THE DREAM STADIUM (the plan of record)
async function dream(deps = {}) {
  const now = deps.now || new Date();
  const tone = deps.tone || currentTone();
  if (!tone.effects.dmn_allowed) return { ok: false, skipped: "tone is conserve — a depleted captain rests; no dreaming" };
  if (!deps.force) {
    const a = deps.awayCheck ? await deps.awayCheck() : await isAway(deps);
    if (!a.away) return { ok: false, skipped: `not away (${a.why}) — the Rest Room only fires when he's gone` };
  }
  const weak = deps.weak || weakVector(deps);
  if (!weak.length) return { ok: false, skipped: "no real weak points on the bus — nothing honest to dream about" };
  const board = deps.board || loadBoard();
  const keys = deps.keys || loadHippoKeys();
  const lanes = borrowableTanks(board, keys);
  const totalBudget = lanes.reduce((a, l) => a + l.budget, 0);
  if (totalBudget < MIN_STADIUM_BUDGET) {
    // #8 + #106 — THE SKIP LINE THAT LIED. The old text was
    //   "idle-tank headroom 0 < 8 — the stadium only spends use-it-or-lose-it quota"
    // which reads as "the free Gemini pool is spent". On 1 Aug the pool was 99%
    // FULL: five tanks were frozen COLD by a CLAUDE-side error mis-written as a
    // Gemini 429. The line now shows have/need AND names the real reason a lane
    // is unavailable, so the captain can tell an empty pool from a faulted board.
    const all = (board.tanks || []);
    const cold = all.filter(t => t.enabled && t.key_index !== null && !["HOT", "WARM"].includes(stateOf(t)));
    const why = cold.length
      ? ` · ${cold.length}/${all.length} tank(s) frozen: ${cold.map(t => `${t.id}=${stateOf(t)}${t.last_429 ? `(faulted ${String(t.last_429).slice(0, 19)})` : ""}`).join(", ")} — a frozen tank is a FAULT stamp, not spent quota`
      : ` · ${lanes.length}/${all.length} lane(s) borrowable — genuinely spent`;
    return { ok: false, skipped: `idle-tank headroom ${totalBudget}/${MIN_STADIUM_BUDGET} needed${why}` };
  }
  // E2E audit 25 Jul 2026 — THE VERIFICATION RESERVE. The planner used to hand
  // EVERY unit of measured headroom to rollouts; the verification phase then spent
  // up to 8 MORE units, round-robin, with no budget check at all. A lane that had
  // exactly exhausted its headroom kept absorbing counter-rollouts, so the spend
  // ran past the ceiling·(1−reserve) line that headroomOf protects ("never the
  // core") and that this file's LAWS header calls inviolable. Counter-rollouts are
  // now BUDGETED FIRST — they are the cheaper half of the dream, and unverified
  // ammunition is worth less than none — and each lane's remaining budget is
  // tracked through BOTH phases (see lane.spent below).
  const verifyReserve = Math.min(8, Math.max(1, Math.floor(totalBudget * 0.25)));
  const nRoll = Math.min(MAX_ROLLOUTS_NIGHT, Math.max(0, totalBudget - verifyReserve), weak.length * ROLLOUTS_PER_WEAK);
  // round-robin the rollouts onto lanes, capped by each lane's OWN budget
  const plan = lanes.map(l => ({ ...l, jobs: [], spent: 0 }));
  let placed = 0;
  while (placed < nRoll && plan.some(l => l.jobs.length < l.budget)) {
    for (const lane of plan) {
      if (placed >= nRoll) break;
      if (lane.jobs.length >= lane.budget) continue;
      lane.jobs.push({ w: weak[placed % weak.length], persona: PERSONAS[placed % PERSONAS.length] });
      placed++;
    }
  }
  const gen = deps.generate || defaultGen;
  const use = deps.recordUse || recordUse;
  const fault = deps.record429 || record429;
  // E2E audit 25 Jul 2026: recordUse/record429 are non-transactional
  // load→mutate→save passes over tanks.json, and nightshift/council write the same
  // file at night. On Windows a renameSync onto a file another process holds throws
  // EPERM — and that throw came straight out of the lane, rejected the Promise.all
  // and killed the whole dream mid-pass, losing every rollout already paid for.
  // A gauge write is TELEMETRY: it must never be able to kill the thing it measures.
  const safeUse = (id, units, naive) => { try { use(id, units, naive); } catch { } };
  const safeFault = (id) => { try { fault(id); } catch { } };
  // #7 — the meter. Injected in the selftest; a throw here is telemetry failing,
  // never the dream failing (same law as safeUse above).
  const ledger = deps.appendLedger || ((row) => appendFileSync(BLEDGER, JSON.stringify(row) + "\n"));
  const meter = (job, r, laneId) => { try { ledger(ledgerRow(job, r, laneId, new Date())); } catch { } };
  // #8 — THE SHARED-ENGINE FAILURE GUARD (not a budget: a guard that stops ONE
  // identical failure repeating across every lane). All lanes ride ONE upstream
  // Claude engine, so the fuelboard's founding premise — "7 accounts = 7
  // independent pools" — does not hold here. When that one engine refuses, the
  // remaining lanes will each pay a call to be told the same thing. The first
  // engine-side refusal stands the WHOLE stadium down and records why.
  const engine = { down: null, error: null };
  const rollouts = [];
  // THE STADIUM — lanes drain in PARALLEL; inside a lane the calls stay serial
  // (per-project RPM is the real ceiling, not concurrency). A wire 429 STANDS
  // THE LANE DOWN and records the fault on the fuelboard (starvation guard
  // floors the learned ceiling) — a dry lane never burns its whole budget.
  await Promise.all(plan.map(async (lane) => {
    for (const job of lane.jobs) {
      if (engine.down) { lane.dry = true; break; }   // #8 — the shared engine already refused; do not re-ask it per lane
      const r = await genSafe(() => gen(rolloutPrompt(job.w, job.persona), lane));
      safeUse(lane.tank.id, 1, 3000);                // measured spend on ITS OWN gauge + naive-shadow
      lane.spent++;                                  // …and on the lane's own remaining-budget counter (audit 25 Jul)
      meter("dmn_rollout", r, lane.tank.id);         // #7 — the brain window SEES this call now
      if (!r.ok) {
        // audit 25 Jul: claudeGen signals a plan/rate limit as `limit_hit`; it has
        // no `status` field, so the old `r.status === 429` never fired and a dry
        // lane silently burned its whole budget. `status` kept for injected deps.
        // audit 4 Aug (#8): the two causes are now TOLD APART. A wire/Gemini 429
        // faults the tank (that gauge measures Gemini quota). A Claude-side wall
        // stands the lane — and the shared engine — down WITHOUT touching the
        // fuel board, because no Gemini quota was spent to justify freezing it.
        if (geminiFault(r)) { safeFault(lane.tank.id); lane.dry = true; break; }
        if (engineFault(r)) {
          lane.dry = true;
          if (!engine.down) { engine.down = "claude"; engine.error = r.error || (r.limit_hit ? "plan/rate wall" : "engine threw"); }
          break;
        }
        continue;
      }
      try {
        const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
        const obj = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
        rollouts.push({ ...obj, concept: job.w.concept, persona: job.persona, lane: lane.tank.id });
      } catch { }
    }
  }));
  // #8 — name the engine, not the tanks. "dry" used to mean "the Gemini pool is
  // spent"; on the shared Claude lane it usually means the subscription refused.
  if (!rollouts.length) return { ok: false, skipped: `every rollout failed/dry — no dream tonight${engine.down ? ` (the ${engine.down} engine stood the stadium down: ${String(engine.error).slice(0, 160)} — NO Gemini tank was faulted for it)` : ""}`, engine_down: engine.down, engine_error: engine.error };
  const clusters = clusterRollouts(rollouts).slice(0, 8);
  // THE VERIFICATION PHASE — every cluster faces ONE hostile counter-rollout.
  // "broken" → DROPPED (better no ammunition than wrong ammunition); a lane
  // hiccup keeps the draft but marks it unverified (drafts are inert by law).
  const entries = [];
  // E2E audit 25 Jul 2026 — TWO defects lived in the old one-liner
  //   `const lane = liveLanes.length ? liveLanes[i % liveLanes.length] : plan[i % plan.length];`
  // (1) no remaining-budget check: a lane already at its measured headroom still
  //     absorbed counter-spend, breaking "each lane may spend ONLY its own headroom";
  // (2) the fallback: when EVERY lane had stood down dry (rate-limited), it happily
  //     fired 8 more counter-rollouts through those same dead lanes at the very
  //     engine that just refused us — spending past recorded ceilings to get
  //     nothing. Now the assignment is computed UP FRONT against live lanes that
  //     still have budget, each unit CLAIMED synchronously (no two counter-rollouts
  //     can share the last slot across the parallel awaits), and a cluster with no
  //     legal lane simply keeps its draft UNVERIFIED — inert by law, honest.
  const verifyLanes = plan.filter(l => !l.dry && l.spent < l.budget);
  const assign = [];
  let vi = 0;
  for (const c of clusters) {
    let lane = null;
    for (let k = 0; k < verifyLanes.length; k++) {
      const cand = verifyLanes[(vi + k) % verifyLanes.length];
      if (cand.spent < cand.budget) { lane = cand; vi = (vi + k + 1) % verifyLanes.length; break; }
    }
    if (lane) lane.spent++;                          // claim the unit before any await
    assign.push({ c, lane });
  }
  await Promise.all(assign.map(async ({ c, lane }) => {
    let verified = null;
    if (lane && !engine.down) {                      // #8 — never fire a counter at an engine that just refused
      const r = await genSafe(() => gen(counterPrompt(c), lane));
      safeUse(lane.tank.id, 1, 2000);
      meter("dmn_counter", r, lane.tank.id);         // #7
      if (!r.ok && geminiFault(r)) safeFault(lane.tank.id);
      if (!r.ok && engineFault(r) && !engine.down) { engine.down = "claude"; engine.error = r.error || "plan/rate wall"; }
      if (r.ok) {
        try {
          const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
          const v = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
          verified = v.verdict === "sound" ? true : v.verdict === "broken" ? false : null;
        } catch { }
      }
    }
    if (verified === false) return;
    entries.push({ concept: c.concept, stall_signature: c.stall_point, reframe: c.reframe_15s, drill: c.drill, votes: c.votes, verified: verified === true });
  }));
  if (!entries.length) return { ok: false, skipped: "verification killed every cluster — better no ammunition than wrong ammunition" };
  entries.sort(cutOrder);
  const fresh = { date: localDate(now), dreamed_at: now.toISOString(), engine: "stadium", lanes: plan.filter(l => l.jobs.length).map(l => l.tank.id), rollouts: rollouts.length, verified: entries.filter(e => e.verified).length, entries, inert: true,
    // KAAM 2 (10 Aug 2026) — JOURNAL THE WEAK VECTOR. The Rest Room dreamed
    // against a weak-point vector and recorded NO trace of it, so a whole week of
    // its output is now unverifiable: nobody can say what it was aiming at on any
    // given night, and the two inputs it derives from are gitignored with no
    // history. Two lines of record — one in the file, one appended to a journal
    // that survives the merge and the day roll. The plan calls this "worth more
    // than any downstream tuning" and it is: without it, every later measurement
    // of whether the DMN aimed well is a guess.
    weak_vector: weak.map(w => ({ concept: w.concept, why: w.why })),
    // honesty (#8/#106): a PARTIAL night must not read like a full one
    planned_rollouts: nRoll, engine_down: engine.down || null, engine_error: engine.error || null };
  // THE TEST SEAM IS THE WRITE ITSELF (10 Aug 2026). A caller that redirects the
  // write is BY DEFINITION not writing live state, so the two new side-channels
  // this pass adds — reading the prior precache, and appending to the weak-vector
  // journal — follow the write wherever it goes. Getting this wrong is not
  // hypothetical: the identical shape was found live in teaching_audit.mjs the
  // same morning, where a selftest cpSync'd his real forge_session.json and went
  // red the moment he closed a session. One rule, at the seam, kills the class:
  // never let a new default reach live state on a path a test already redirected.
  const redirected = !!deps.write;
  const prior = (deps.readPrior || (redirected ? () => null : () => readJson(PRECACHE)))();
  const out = mergePrecache(prior, fresh);
  (deps.write || ((o) => writeAtomic(PRECACHE, o)))(out);
  (deps.journalWeak || (redirected ? () => {} : journalWeakVector))({ at: fresh.dreamed_at, date: fresh.date, engine: "stadium",
    rollouts: rollouts.length, planned_rollouts: nRoll, weak_vector: fresh.weak_vector,
    entries_this_pass: entries.length, verified_this_pass: fresh.verified });
  return { ok: true, entries: out.entries.length, rollouts: rollouts.length, planned_rollouts: nRoll, verified: out.verified, lanes: out.lanes, engine_down: engine.down, engine_error: engine.error };
}

// ---------------------------------------------------------------------------
// M22 — THE BG DRAIN: the gate suppressed a wake (refractory/capped) but the
// THOUGHT queued in bg_queue.jsonl (thalamus-owned). Idle free lanes give each
// its second spotlight; results fold back THROUGH :4113/bg-drained (single-
// writer preserved) and wait on the nucleus's shelf for his next recall-match.
// Thalamus down / lane dry → entries simply stay queued (honest retry).
// Mid-day the mouth/eyes lanes (T1/T2) are NEVER borrowed — pickTank's law.
// ---------------------------------------------------------------------------
const BG_DRAIN_CAP = 6;

// ── WIRING AUDIT (11 Aug 2026) — TRUNCATED_AT_DOOR ──────────────────────────
// The drain handed the model `JSON.stringify({text, event_key, concept_tokens})
// .slice(0, 600)` — frozen verbatim below as bgMomentBlockLegacy. `text` is the
// FIRST key and the only unbounded one, so on any real moment the cut landed
// inside it and BOTH structural fields fell off the end entirely.
// MEASURED on the only moment that has ever entered bg_queue.jsonl
// (m_1786109201204_1055369738, queued "capped", drained 2026-08-07T14:15Z):
// text 14,763 chars, envelope 15,133 → 600 delivered, 14,533 dropped. The kept
// fragment ends mid-string ("…budget is for\n   studying, not for ag") so it is
// not parseable JSON, and `.includes("concept_tokens") === false` — the field
// the nucleus's recall-shelf keys the returned insight on (matchBg,
// thalamus.mjs) never reached the model at all. `bound_context` — bound by the
// thalamus at 900ms and written into the queue row — was never even asked for.
// Nothing in the prompt, the queue row, or the :4113 body said one character had
// been dropped, so the shelved insight reads as a full read of the moment.
//
// FIX: the door the WAKE path was repaired through earlier today —
// cortex.momentBlock — imported, not re-written. A bg_queue row IS wake-shaped
// ({spotlight, bound_context}, written by thalamus.mjs's appendBgQueue), so it
// fits with no adapter: the SKELETON (event_key, concept_tokens, salience,
// components, every bound-context header) is never cuttable, only free text is
// trimmed, the shares are water-filled, the block always parses, and a trimmed
// text carries a sibling `text_truncated` naming the MEASURED chars dropped.
// THE BUDGET DOES NOT MOVE: 600 is this drain's own pre-11-Aug number, kept to
// the character. Cortex's default is 2,500 and is deliberately NOT adopted here
// — how much of a 14k paste is worth a BACKGROUND lane's tokens is a spend
// question with his name on it, and this repair does not answer it.
// The trade is stated, not hidden: at 600 the skeleton + the absence-note cost
// prose, so that live row now delivers 261 text chars instead of ~580 — but the
// 580 were malformed JSON, blind to the concept, and silent about the loss.
const BG_MOMENT_BUDGET_CHARS = 600;   // NOT a new number — the pre-11-Aug drain door's own .slice(0, 600)

// frozen verbatim (LAYERING, never replace) — the pre-11-Aug-2026 drain door: one
// blind head-cut across the whole envelope with `text` serialised first. Kept
// runnable as the regression witness the selftest asserts against.
const bgMomentBlockLegacy = (spot) => JSON.stringify({ text: spot.text, event_key: spot.event_key, concept_tokens: spot.concept_tokens }).slice(0, 600);

async function drainBg(deps = {}) {
  const tone = deps.tone || currentTone();
  if (!tone.effects.dmn_allowed) return { ok: false, skipped: "tone is conserve — the drain rests too" };
  const rows = deps.readBgQueue ? deps.readBgQueue() : readLines(join(STATE_DIR, "bg_queue.jsonl"));
  const open = pendingBg(rows);
  if (!open.length) return { ok: true, drained: 0, note: "no suppressed thoughts waiting" };
  const board = deps.board || loadBoard();
  const keys = deps.keys || loadHippoKeys();
  const lanes = borrowableTanks(board, keys)
    .filter(l => deps.away === true || !["T1", "T2"].includes(l.tank.id))
    .map(l => ({ ...l, spent: 0 }));                 // audit 25 Jul: the drain must respect budgets too (see the lane pick below)
  if (!lanes.length) return { ok: false, skipped: "no borrowable lane — the thoughts keep waiting (never spend the core)" };
  const gen = deps.generate || defaultGen;
  const use = deps.recordUse || recordUse;
  // same law as the stadium: a gauge write is telemetry and may never kill the drain
  const safeUse = (id, units, naive) => { try { use(id, units, naive); } catch { } };
  // #7 — the drain spends the same subscription window; it meters too.
  const ledger = deps.appendLedger || ((row) => appendFileSync(BLEDGER, JSON.stringify(row) + "\n"));
  const meter = (job, r, laneId) => { try { ledger(ledgerRow(job, r, laneId, new Date())); } catch { } };
  // #8 — the drain had NO limit handling at all: a refusing engine burned all
  // BG_DRAIN_CAP jobs one after another to be told the same thing six times.
  const engine = { down: null, error: null };
  // D12 (9 Aug 2026): the one thalamus POST in this cluster with no abort — a hung
  // socket held the whole drain. 3s mirrors the family pattern (hook uses 250ms;
  // this lane is background so it can afford more, but never forever).
  const post = deps.post || (async (body) => {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 3000);
    try {
      const r = await fetch("http://127.0.0.1:4113/bg-drained", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
      return r.json();
    } finally { clearTimeout(t); }
  });
  const batch = open.slice(0, BG_DRAIN_CAP);
  let drained = 0;
  for (let i = 0; i < batch.length; i++) {
    const b = batch[i];
    // E2E audit 25 Jul 2026: this was `lanes[i % lanes.length]` — round-robin with
    // NO remaining-budget check, so a lane whose whole headroom was 1 could be
    // charged three drain jobs, past the reserve line. Keep the round-robin shape
    // (start at i, scan forward) but take only a lane that still has budget; when
    // none does, the remaining thoughts simply stay queued — honest retry, the
    // drain's own stated law, never a raid on the core.
    let lane = null;
    for (let k = 0; k < lanes.length; k++) { const cand = lanes[(i + k) % lanes.length]; if (cand.spent < cand.budget) { lane = cand; break; } }
    if (!lane) break;
    lane.spent++;
    const spot = b.spotlight || {};
    const r = await genSafe(() => gen(`A learning system's attention gate suppressed this moment (reason: ${b.reason} — it deserved deep thought but the deep lane was busy). Give it its second spotlight now, briefly.
THE MOMENT (bound by the thalamus. A \`text_truncated\` field, if present, states the MEASURED characters dropped at the door — where you see one, you are holding a fragment and must say so rather than read the opening as the whole):
${momentBlock(b, BG_MOMENT_BUDGET_CHARS)}
Output STRICT JSON, no fences: {"concept":"<the one concept this is really about>","insight":"<the short useful read he'd want when he next touches this ground, <=280 chars, honest, no hype>"}`, lane));
    safeUse(lane.tank.id, 1, 2500);
    meter("dmn_bg_drain", r, lane.tank.id);          // #7
    if (!r.ok) {
      // #8 — a Gemini wire 429 faults ITS tank; a Claude-side wall stops the
      // drain outright (the thoughts stay queued — this file's own honest-retry
      // law) and NEVER writes a Gemini fault it did not earn.
      if (geminiFault(r)) { try { (deps.record429 || record429)(lane.tank.id); } catch { } continue; }
      if (engineFault(r)) { engine.down = "claude"; engine.error = r.error || "plan/rate wall"; break; }
      continue;
    }
    try {
      const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
      const obj = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
      if (!obj.insight || String(obj.insight).length < 20) continue;   // a thin read never shelves
      const res = await post({ moment_id: b.moment_id, concept: obj.concept, insight: obj.insight, tokens: spot.concept_tokens || [] }).catch(() => null);
      if (res && res.ok) drained++;
    } catch { }
  }
  return { ok: true, drained, waiting: open.length - drained, engine_down: engine.down || null, engine_error: engine.error || null };
}

// ── WIRING AUDIT (11 Aug 2026) — ORPHAN_FIELD ───────────────────────────────
// drainBg has computed engine_down/engine_error since #8 hardened it, and BOTH
// call sites dropped them on the floor: `dmn drain` printed drained/waiting/note
// only, and the hourly pass printed under `if (bg.ok && bg.drained)` — a walled
// drain returns ok:true with drained:0, so that predicate was FALSE for exactly
// the outage it was supposed to report. Measured consequence: a conserve-tone
// mute, a no-borrowable-lane refusal, a Claude plan wall and a clean pass over an
// empty queue all produced THE SAME OUTPUT on the hourly lane — nothing. dream(),
// this organ's other half, has named its refusing engine on the `PARTIAL:` line
// since that same commit; the drain, hardened in the same breath, stayed mute.
// That is the false-reason class the 1 Aug 22-hour outage taught: an organ that
// is DOWN looking exactly like an organ that had nothing to do.
// ONE sentence, ONE builder, both call sites, exported for the suite — the next
// rot can only happen in one place, and an assertion now sits on it.
// SILENCE IS STILL EARNED, not lost: an hourly pass that found an empty queue
// says nothing (it fires 24×/day and a true no-op is not news). Anything else —
// a skip, a wall, a backlog that did not move — speaks. `dmn drain` was asked
// for by hand, so it answers even then (verbose).
// The 140-char error clip is NOT a new number: it is main()'s own dream-line
// clip, copied so both halves of the organ truncate a refusal identically.
const drainLine = (d, verbose = false) => {
  if (!d) return null;
  if (!d.ok) return `dmn: no drain — ${d.skipped}`;
  if (!d.drained && !d.waiting && !d.engine_down && !verbose) return null;
  return `dmn: second spotlight — ${d.drained} suppressed thought(s) drained`
    + (d.waiting ? `, ${d.waiting} waiting` : "")
    + (d.note ? ` (${d.note})` : "")
    + (d.engine_down ? ` · PARTIAL: the ${d.engine_down} engine refused mid-drain — ${String(d.engine_error).slice(0, 140)} · the rest stay queued (honest retry, never a raid on the core)` : "");
};

// ---------------------------------------------------------------------------
// dreamLegacy — the pre-M16 engine, FROZEN VERBATIM (layering, never replace):
// one tank (T7), up to 8 serial rollouts, no verification. Kept runnable as
// the fallback floor and the reference for what the stadium replaced.
// ---------------------------------------------------------------------------
async function dreamLegacy(deps = {}) {
  const now = deps.now || new Date();
  const tone = deps.tone || currentTone();
  if (!tone.effects.dmn_allowed) return { ok: false, skipped: "tone is conserve — a depleted captain rests; no dreaming" };
  if (!deps.force) {
    const a = deps.awayCheck ? await deps.awayCheck() : await isAway(deps);
    if (!a.away) return { ok: false, skipped: `not away (${a.why}) — the Rest Room only fires when he's gone` };
  }
  const weak = deps.weak || weakVector(deps);
  if (!weak.length) return { ok: false, skipped: "no real weak points on the bus — nothing honest to dream about" };
  const board = deps.board || loadBoard();
  const t7 = board.tanks.find(t => t.id === "T7");
  const head = headroomOf(t7);
  if (head < 4) return { ok: false, skipped: `T7 headroom ${head} < 4 — the dream only spends use-it-or-lose-it quota` };
  const nRoll = Math.min(MAX_ROLLOUTS, head, weak.length * 2);
  const gen = deps.generate || ((p) => generatePool(p, { models: ["gemini-flash-latest"], maxOutputTokens: 2048, json: true }));   // thinking models spend thoughts from the same budget
  const use = deps.recordUse || recordUse;
  const rollouts = [];
  for (let i = 0; i < nRoll; i++) {
    const w = weak[i % weak.length];
    const persona = PERSONAS[i % PERSONAS.length];
    const r = await gen(rolloutPrompt(w, persona));
    use("T7", 1, 3000);                              // measured spend + naive-shadow
    if (!r.ok) continue;
    try {
      const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
      const obj = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
      rollouts.push({ ...obj, concept: w.concept, persona });
    } catch { }
  }
  if (!rollouts.length) return { ok: false, skipped: "every rollout failed/dry — no dream tonight" };
  const clusters = clusterRollouts(rollouts).slice(0, 6);
  const out = { date: localDate(now), dreamed_at: now.toISOString(), rollouts: rollouts.length, entries: clusters.map(c => ({ concept: c.concept, stall_signature: c.stall_point, reframe: c.reframe_15s, drill: c.drill, votes: c.votes })), inert: true };
  (deps.write || ((o) => writeAtomic(PRECACHE, o)))(out);
  return { ok: true, entries: out.entries.length, rollouts: rollouts.length };
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const weakFix = [{ concept: "eval metrics", why: "danger zone" }, { concept: "context windows", why: "stalling" }];
  const boardFix = (head) => ({ tanks: [{ id: "T7", quota_est: 250, observed_ceiling: 0, used_today: 250 * 0.85 - head, enabled: true, key_index: 5 }] });
  const keysFix = ["k0", "k1", "k2", "k3", "k4", "k5"];
  const genOK = async (p) => ({ ok: true, text: p.includes("hostile staff-engineer") ? JSON.stringify({ verdict: "sound", why: "holds" }) : JSON.stringify({ stall_point: /eval/.test(p) ? "precision recall tradeoff at threshold" : "lost context after compaction", reframe_15s: "start from the confusion matrix, one cell at a time", drill: "hand-compute P/R on 10 rows" }) });
  // appendLedger is injected on every fixture: a selftest must never append a
  // real row to the shared brain_ledger (it would bill his live window for a test)
  const base = { force: true, tone: { effects: { dmn_allowed: true } }, weak: weakFix, board: boardFix(20), keys: keysFix, generate: genOK, recordUse: () => {}, record429: () => {}, write: () => {}, appendLedger: () => {}, now: new Date("2026-07-14T15:00:00") };

  // the gates (shared by both engines; exercised on the plan of record)
  assert("CONSERVE tone MUTES the dream (a depleted captain rests)", (await dream({ ...base, tone: { effects: { dmn_allowed: false } } })).skipped.includes("conserve"));
  assert("present captain → no dream (the Rest Room fires only when away)", (await dream({ ...base, force: false, awayCheck: async () => ({ away: false, why: "present" }) })).skipped.includes("not away"));
  assert("no REAL weak points → honest skip (never dreams fabricated cracks)", (await dream({ ...base, weak: [] })).skipped.includes("nothing honest"));
  assert("no lane headroom → no dream (use-it-or-lose-it only, $0 blast radius)", (await dream({ ...base, board: boardFix(2) })).skipped.includes("headroom"));

  // E2E audit 25 Jul 2026 — THE WEAK-POINT VECTOR must read the PRODUCER'S schema.
  // learning_state.mjs writes { id, fluency, velocity: { slope } }; the old code
  // looked for c.trend/c.trajectory/c.name, so the "stalling concepts" leg was dead
  // wire — a stalling concept could never reach a dream.
  {
    const wReal = weakVector({ calibration: null, twin: null, ls: { concepts: [
      { id: "attention", track: "concept", fluency: "🔴 learning", velocity: { slope: "stalling" } },
      { id: "rag", track: "concept", fluency: "🟢 fluent", velocity: { slope: "improving" } },
    ] } });
    assert("WEAK VECTOR: the producer's real schema (id + velocity.slope) feeds the dream", wReal.length === 1 && wReal[0].concept === "attention" && wReal[0].why.includes("stalling"));
    const wLegacy = weakVector({ calibration: null, twin: null, ls: { concepts: [{ name: "kv cache", trend: "regressing" }] } });
    assert("WEAK VECTOR: the legacy trend/name shape still reads (layering, never replace)", wLegacy.length === 1 && wLegacy[0].concept === "kv cache");
  }

  // WIRING AUDIT 11 Aug 2026 — THE TWIN LEG'S CONCEPT SLOT. It pushed the
  // market's PROSE `desc` into a field four organs read as a concept id
  // (rolloutPrompt's "known soft spot", setpiece.mjs:492 `concepts: [d.concept]`,
  // thalamus.mjs:900's registry join, scoreboard's JOIN-4 key). These three
  // assertions fail the moment prose can reach that slot again.
  {
    // the LIVE market shape, verbatim from twin.json 11 Aug 2026, forced into the band
    const behaviour = { markets: [{ id: "session_happened", desc: "a real study session happens today", p: 0.5, n_resolved: 15, alive: true }] };
    // capture.mjs:120's real registry shape — alias Maps, not the raw JSON
    const regFix = { loaded: true, conceptAlias: new Map([["hallucinations", "hallucinations"], ["hallucination", "hallucinations"]]), skillAlias: new Map() };
    const wB = weakVector({ calibration: null, ls: null, twin: behaviour, registry: regFix });
    assert("TWIN LEG: a BEHAVIOUR market at max uncertainty never reaches the dream — prose is not a concept id",
      wB.length === 0);
    assert("TWIN LEG (legacy pin): the frozen vector still emits the prose sentence, so the repair is a measured difference",
      weakVectorLegacy({ calibration: null, ls: null, twin: behaviour }).map(w => w.concept).join("") === "a real study session happens today");
    const named = { markets: [{ id: "halluc_held", desc: "he holds hallucination cold today", p: 0.5, n_resolved: 15, alive: true }] };
    assert("TWIN LEG: a market that DOES name canon still dreams — resolved to the registry id, not the sentence",
      (() => { const w = weakVector({ calibration: null, ls: null, twin: named, registry: regFix }); return w.length === 1 && w[0].concept === "hallucinations" && w[0].market === "halluc_held"; })());
    assert("TWIN LEG: an UNLOADED registry resolves nothing (dossierKey passes tokens through — that guard is the bug, one word at a time)",
      marketConcept({ id: "x", desc: "hallucination" }, { loaded: false }) === null);
  }

  // E2E audit 25 Jul 2026 — THE AFK CLOCK. aw-watcher-afk merges a continuous
  // absence into ONE event whose `timestamp` stays at the moment he left while
  // `duration` grows; measuring staleness from the START declared him "present"
  // after 6h, so the Rest Room went blind during the longest absences.
  {
    const mkFetch = (evt) => async (url) => String(url).includes("/events")
      ? { ok: true, json: async () => [evt] }
      : { ok: true, json: async () => ({ "aw-watcher-afk_desktop": { id: "aw-watcher-afk_desktop" } }) };
    const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
    const asleep8h = { timestamp: hoursAgo(8), duration: 8 * 3600 - 60, data: { status: "afk" } };
    assert("AFK CLOCK: an 8h continuous absence still reads AWAY (freshness rides the event's END)", (await isAway({ fetchFn: mkFetch(asleep8h) })).away === true);
    const stale = { timestamp: hoursAgo(4), duration: 3600, data: { status: "afk" } };   // AFK ended 3h ago — the watcher stopped reporting
    assert("AFK CLOCK: a stale AFK event is NOT away (never dream over his shoulder)", (await isAway({ fetchFn: mkFetch(stale) })).away === false);
    const atDesk = { timestamp: hoursAgo(0.01), duration: 30, data: { status: "not-afk" } };
    assert("AFK CLOCK: not-afk is present", (await isAway({ fetchFn: mkFetch(atDesk) })).away === false);
  }

  // E2E audit 25 Jul 2026 — the default lane generator must be ASYNC: the sync
  // claudeGen (execFileSync) blocked the event loop, making the stadium's
  // Promise.all "parallel lanes" strictly serial (and its return value un-.catch-able).
  // With ANTHROPIC_API_KEY set, claudegen refuses instantly — NO process is spawned.
  {
    const oldKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "sk-selftest-no-spawn";
    const d = defaultGen("probe", null);
    const isThenable = !!d && typeof d.then === "function";
    await Promise.resolve(d);
    if (oldKey === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = oldKey;
    assert("STADIUM: the default lane generator is ASYNC (a sync engine serializes every 'parallel' lane)", isThenable);
  }

  // M16 — THE DREAM STADIUM: parallel lanes, per-lane budgets, verification
  {
    const stadiumBoard = { tanks: [
      { id: "T2", name: "Watcher", region: "vision", key_index: 1, quota_est: 90, observed_ceiling: 0, used_today: 0, enabled: true },
      { id: "T5", name: "Scout", region: "research", key_index: 3, quota_est: 50, observed_ceiling: 0, used_today: 30, enabled: true },
      { id: "T7", name: "DMN", region: "default-mode", key_index: 5, quota_est: 250, observed_ceiling: 0, used_today: 0, enabled: true },
    ] };
    let saved = null; const spends = {};
    const r = await dream({ ...base, board: stadiumBoard, recordUse: (id) => { spends[id] = (spends[id] || 0) + 1; }, write: (o) => { saved = o; } });
    assert("STADIUM: the away-gate legalizes the borrow — rollouts fan across ALL idle lanes", r.ok && r.lanes.length === 3 && Object.keys(spends).length === 3);
    assert("STADIUM: 2 weak points × depth 25 = 50 rollouts (was 8 serial)", r.rollouts === 50 && r.rollouts <= MAX_ROLLOUTS_NIGHT);
    // E2E audit 25 Jul 2026: this check was named "never spends past its OWN measured
    // headroom" and then granted "+3" of slack — it asserted the very overspend it
    // claimed to forbid. T5's headroom is exactly floor(50·0.85)−30 = 12, rollouts AND
    // counter-rollouts included. No fudge factor: that is what the law says.
    assert("STADIUM: a lane never spends past its OWN measured headroom (verification included)",
      spends.T5 <= Math.floor(50 * 0.85) - 30 && spends.T2 <= Math.floor(90 * 0.85) && spends.T7 <= Math.floor(250 * 0.85));
    assert("BORROW: a lane is legal with NO Gemini key (rollouts ride claude -p — dead keys must not kill the Rest Room)",
      borrowableTanks(stadiumBoard, []).length === 3);
    assert("STADIUM: verification ran — entries land VERIFIED, engine stamped", saved.engine === "stadium" && saved.verified >= 1 && saved.entries.every(e => e.verified === true) && saved.inert === true);
    assert("clustering: same stall signature merges with votes", saved.entries.some(e => e.votes >= 2));
  }
  // the counter-rollout kills a broken reframe; a lane hiccup keeps-but-marks
  {
    const genBroken = async (p) => {
      if (p.includes("hostile staff-engineer")) return { ok: true, text: JSON.stringify({ verdict: p.includes("lost context") ? "broken" : "sound", why: "x" }) };
      return genOK(p);
    };
    let saved = null;
    const r = await dream({ ...base, generate: genBroken, write: (o) => { saved = o; } });
    assert("VERIFICATION: a broken reframe is DROPPED, never racked", r.ok && saved.entries.every(e => !e.stall_signature.includes("lost context")));
    const genHiccup = async (p) => p.includes("hostile staff-engineer") ? { ok: false } : genOK(p);
    let saved2 = null;
    await dream({ ...base, generate: genHiccup, write: (o) => { saved2 = o; } });
    assert("VERIFICATION: a lane hiccup keeps the draft but marks it unverified", saved2 && saved2.entries.length >= 1 && saved2.entries.every(e => e.verified === false));
    const genAllBroken = async (p) => p.includes("hostile staff-engineer") ? { ok: true, text: '{"verdict":"broken","why":"wrong"}' } : genOK(p);
    const rAB = await dream({ ...base, generate: genAllBroken, write: () => { throw new Error("must not write"); } });
    assert("VERIFICATION: all clusters broken → NO precache (better none than wrong)", rAB.ok === false && rAB.skipped.includes("wrong ammunition"));
  }
  // M16 — a 429'd lane stands down and the fuelboard LEARNS (starvation-guarded)
  {
    const twoLanes = { tanks: [
      { id: "T2", name: "Watcher", region: "vision", key_index: 1, quota_est: 90, observed_ceiling: 0, used_today: 0, enabled: true },
      { id: "T7", name: "DMN", region: "default-mode", key_index: 5, quota_est: 250, observed_ceiling: 0, used_today: 200, enabled: true },
    ] };
    const spends = {}, faults = [];
    const genDryT2 = async (p, lane) => {
      if (lane.tank.id === "T2" && !p.includes("hostile staff-engineer")) return { ok: false, status: 429 };
      return genOK(p);
    };
    const r = await dream({ ...base, board: twoLanes, generate: genDryT2, recordUse: (id) => { spends[id] = (spends[id] || 0) + 1; }, record429: (id) => faults.push(id), write: () => {} });
    assert("STADIUM: a wire-429 lane STANDS DOWN after one call (never burns its budget)", r.ok && spends.T2 <= 2 && faults.includes("T2"));
    assert("STADIUM: the surviving lane still dreams (dry pool ≠ dead dream)", r.rollouts >= 1 && r.lanes.includes("T7"));

    // E2E audit 25 Jul 2026 — the SUBSCRIPTION limit signal + the dead-engine raid.
    // claudeGen reports a plan/rate limit as `limit_hit` (it has no `status` field),
    // and when EVERY lane had stood down the old verification phase fell back to
    // `plan[i % plan.length]` and fired counter-rollouts through those dead lanes at
    // the engine that had just refused us. Here the only lane dies mid-pass on
    // limit_hit: the drafts must survive UNVERIFIED and not one counter may be fired.
    let counters = 0, calls = 0, savedDry = null;
    const genDiesLate = async (p) => {
      if (p.includes("hostile staff-engineer")) { counters++; return genOK(p); }
      return ++calls <= 3 ? genOK(p) : { ok: false, limit_hit: true };
    };
    const rDry = await dream({ ...base, generate: genDiesLate, recordUse: () => {}, record429: () => {}, write: (o) => { savedDry = o; } });
    assert("STADIUM: `limit_hit` stands the lane down (the claudeGen signal, not a wire 429)", rDry.ok && rDry.rollouts === 3);
    assert("STADIUM: every lane dry → ZERO counter-rollouts fired at a refusing engine (drafts kept unverified)",
      counters === 0 && savedDry && savedDry.entries.length >= 1 && savedDry.entries.every(e => e.verified === false));

    // a fuelboard write fault (tanks.json held by nightshift/council → EPERM) is
    // telemetry failing, not the dream failing — it must never kill the pass.
    let rThrow = null;
    try { rThrow = await dream({ ...base, recordUse: () => { throw new Error("EPERM: tanks.json busy"); }, record429: () => { throw new Error("EPERM"); }, write: () => {} }); }
    catch { rThrow = { ok: false, threw: true }; }
    assert("STADIUM: a fuelboard write fault never kills the dream (telemetry ≠ the dream)", rThrow.ok === true && rThrow.rollouts >= 1);

    // ── #8 · CROSS-ENGINE FAULT ATTRIBUTION (organism audit, 4 Aug 2026) ────
    // 1 Aug 01:48 IST: ONE `claude -p` error was written through record429 onto
    // FIVE Gemini tanks (five faults in 2.6s) whose Gemini quota was never spent.
    // fuelboard.mjs:96 froze them till local midnight and the Rest Room was down
    // ~22h reporting "idle-tank headroom 0" — a false reason for a false fault.
    {
      const fiveLanes = { tanks: ["T1", "T2", "T5", "T6", "T7"].map((id, i) => (
        { id, name: id, region: "r" + i, key_index: i, quota_est: 250, observed_ceiling: 0, used_today: 0, enabled: true })) };
      const faults5 = [], metered = [];
      let claudeCalls = 0;
      // the real shape claudegen returns on a plan wall: limit_hit, NO `status`
      const genClaudeWall = async () => { claudeCalls++; return { ok: false, limit_hit: true, limit_signal: "api_error_status", http_status: 429, error: "You've hit your weekly limit · resets 11:30pm", total_tokens: 12, duration_ms: 5 }; };
      const rWall = await dream({ ...base, board: fiveLanes, generate: genClaudeWall, recordUse: () => {}, record429: (id) => faults5.push(id), appendLedger: (row) => metered.push(row), write: () => { throw new Error("must not write"); } });
      assert("#8: a CLAUDE-side wall faults ZERO Gemini tanks (the 1 Aug five-tank kill cannot recur)", faults5.length === 0);
      // the lanes fan out CONCURRENTLY (Promise.all), so the first round of one
      // call per lane is already in flight before any answer comes back — the
      // guard stops everything AFTER that round. 5 lanes × 10 jobs each = 50
      // possible calls; the whole stadium stands down at 5, one per lane.
      assert("#8: the shared engine stands the WHOLE stadium down after one round (5 calls, not 50)",
        claudeCalls === fiveLanes.tanks.length && rWall.engine_down === "claude");
      assert("#8: the skip NAMES the engine and keeps the error text (forensics survive)",
        rWall.ok === false && rWall.skipped.includes("claude engine") && rWall.skipped.includes("NO Gemini tank") && String(rWall.engine_error).includes("weekly limit"));
      assert("#8: a GENUINE wire 429 still faults its own tank (the instrument is not disarmed)",
        geminiFault({ status: 429 }) === true && geminiFault({ ok: false, limit_hit: true }) === false && engineFault({ ok: false, limit_hit: true }) === true);
      // a thrown generator is an engine fault too, and its message is preserved
      const thrown = await genSafe(() => { throw new Error("spawn claude EINVAL"); });
      assert("#8: a THROWN engine error keeps its text (genSafe no longer swallows it)",
        thrown.ok === false && thrown.threw === true && thrown.error.includes("EINVAL") && engineFault(thrown) === true);

      // ── #7 · THE SPEND IS ON THE BRAIN WINDOW ────────────────────────────
      const rows = [];
      const rMet = await dream({ ...base, board: fiveLanes, appendLedger: (row) => rows.push(row), recordUse: () => {}, write: () => {} });
      assert("#7: every rollout AND every counter-rollout lands a brain_ledger row",
        rows.length === rMet.rollouts + rMet.entries && rows.filter(x => x.job === "dmn_rollout").length === rMet.rollouts);
      assert("#7: the rows are brain-shaped (engine/model/ok/limit_hit) so windowUsage sees them",
        rows.every(x => x.engine === "claude" && x.model === DMN_MODEL && "ok" in x && "limit_hit" in x && "total_tokens" in x && DMN_JOBS.includes(x.job)));
      assert("#7: an unreported token split is NULL and the total says it is an ESTIMATE (never a fake zero)",
        rows.every(x => x.input_tokens === null && x.output_tokens === null && x.tokens_estimated === true));
      assert("#7: the failing calls are metered too — a refusal is spend the window must see",
        metered.length === fiveLanes.tanks.length && metered.every(x => x.ok === false && x.limit_hit === true && x.job === "dmn_rollout")
        && new Set(metered.map(x => x.lane)).size === fiveLanes.tanks.length);
      // telemetry must never kill the dream (same law as the fuelboard write)
      const rLedgerThrow = await dream({ ...base, appendLedger: () => { throw new Error("EPERM: brain_ledger.jsonl busy"); }, recordUse: () => {}, write: () => {} });
      assert("#7: a ledger write fault never kills the dream (telemetry ≠ the dream)", rLedgerThrow.ok === true && rLedgerThrow.rollouts >= 1);
    }

    // #106 — the headroom skip is a have/need counter that names the real cause
    {
      const frozen = { tanks: [{ id: "T7", name: "DMN", region: "d", key_index: 5, quota_est: 250, observed_ceiling: 0, used_today: 0, enabled: true, last_429: "2026-07-14T01:48:00.000Z", day: localDate(new Date("2026-07-14T15:00:00")) }] };
      const rCold = await dream({ ...base, board: frozen });
      assert("#106: 'no headroom' shows have/need AND says the tank is FAULTED, not spent",
        rCold.ok === false && /headroom \d+\/\d+ needed/.test(rCold.skipped) && rCold.skipped.includes("FAULT stamp"));
    }
  }

  // M22 — THE BG DRAIN: second spotlight on idle lanes, folded back via :4113
  {
    const bgRows = [
      { moment_id: "bg1", status: "queued", reason: "capped", spotlight: { text: "i don't get attention scaling", concept_tokens: ["attention"] } },
      { moment_id: "bg2", status: "queued", reason: "refractory", spotlight: { text: "kv cache doubt again", concept_tokens: ["kv"] } },
      { moment_id: "bg0", status: "queued", reason: "capped", spotlight: { text: "already handled" } },
      { moment_id: "bg0", status: "drained" },
    ];
    const twoLanes = { tanks: [
      { id: "T5", name: "Scout", region: "research", key_index: 3, quota_est: 50, observed_ceiling: 0, used_today: 0, enabled: true },
      { id: "T7", name: "DMN", region: "default-mode", key_index: 5, quota_est: 250, observed_ceiling: 0, used_today: 0, enabled: true },
    ] };
    const posts = []; const spends = {};
    const genBG = async () => ({ ok: true, text: JSON.stringify({ concept: "attention", insight: "the suppressed read: caching kills recompute, the handshakes stay — hold that distinction" }) });
    const r = await drainBg({ appendLedger: () => {}, tone: { effects: { dmn_allowed: true } }, readBgQueue: () => bgRows, board: twoLanes, keys: keysFix, generate: genBG, recordUse: (id) => { spends[id] = (spends[id] || 0) + 1; }, post: async (b) => { posts.push(b); return { ok: true }; } });
    assert("DRAIN: open thoughts drained on idle lanes, folded back via :4113", r.ok && r.drained === 2 && posts.length === 2 && posts[0].moment_id === "bg1" && posts[0].tokens.includes("attention"));
    assert("DRAIN: already-drained entries never re-drain (event-sourced)", !posts.some(p => p.moment_id === "bg0"));
    assert("DRAIN: every spend recorded on ITS lane", Object.keys(spends).length >= 1);
    const rMute = await drainBg({ appendLedger: () => {}, tone: { effects: { dmn_allowed: false } }, readBgQueue: () => bgRows });
    assert("DRAIN: conserve tone mutes the drain too", rMute.ok === false && rMute.skipped.includes("conserve"));
    const t12 = { tanks: [
      { id: "T1", name: "Gaffer", region: "mouth", key_index: 0, quota_est: 90, observed_ceiling: 0, used_today: 0, enabled: true },
      { id: "T2", name: "Watcher", region: "vision", key_index: 1, quota_est: 90, observed_ceiling: 0, used_today: 0, enabled: true },
    ] };
    const rT12 = await drainBg({ appendLedger: () => {}, tone: { effects: { dmn_allowed: true } }, readBgQueue: () => bgRows, board: t12, keys: keysFix, generate: genBG, recordUse: () => {}, post: async () => ({ ok: true }) });
    assert("DRAIN: mouth/eyes lanes NEVER borrowed mid-day (pickTank's law)", rT12.ok === false && rT12.skipped.includes("never spend the core"));
    const rAway = await drainBg({ appendLedger: () => {}, away: true, tone: { effects: { dmn_allowed: true } }, readBgQueue: () => bgRows, board: t12, keys: keysFix, generate: genBG, recordUse: () => {}, post: async () => ({ ok: true }) });
    assert("DRAIN: away-time legalizes the borrow (same law as the stadium)", rAway.ok && rAway.drained === 2);
    const rDown = await drainBg({ appendLedger: () => {}, tone: { effects: { dmn_allowed: true } }, readBgQueue: () => bgRows, board: twoLanes, keys: keysFix, generate: genBG, recordUse: () => {}, post: async () => { throw new Error("nucleus down"); } });
    assert("DRAIN: thalamus down → thoughts stay queued (honest retry, nothing lost)", rDown.ok && rDown.drained === 0 && rDown.waiting === 2);
    const rNone = await drainBg({ appendLedger: () => {}, tone: { effects: { dmn_allowed: true } }, readBgQueue: () => [{ moment_id: "x", status: "queued" }, { moment_id: "x", status: "returned" }] });
    assert("DRAIN: empty queue → quiet no-op", rNone.ok && rNone.drained === 0 && rNone.note);

    // ── THE DOOR (wiring audit, 11 Aug 2026) ────────────────────────────────
    // These ride the PROMPT THE GENERATOR ACTUALLY RECEIVED, not the helper, so
    // they fail the moment the door is unwired again — which is exactly how the
    // 600-char blind cut survived from M22 to 11 Aug with nobody noticing.
    {
      const LONGDOUBT = `OPEN: mujhe attention ka scaling samajh nahi aata. ${"x".repeat(14000)} CLOSE: yahin pe atak gaya.`;
      const bigSpot = { modality: "voice", text: LONGDOUBT, event_key: "voice:doubt", concept_tokens: ["attention", "kv"], S: 0.65, comps: { surprise: 0.4 } };
      const bigRow = [{ moment_id: "bgBig", status: "queued", reason: "capped", spotlight: bigSpot,
        bound_context: [{ modality: "context", text: "Code.exe — attention.py", event_key: "context:Code.exe" }] }];
      let seen = "";
      const genSpy = async (p) => { seen = p; return { ok: true, text: JSON.stringify({ concept: "attention", insight: "the suppressed read: caching kills recompute, the handshakes stay — hold that distinction" }) }; };
      const rDoor = await drainBg({ appendLedger: () => {}, tone: { effects: { dmn_allowed: true } }, readBgQueue: () => bigRow, board: twoLanes, keys: keysFix, generate: genSpy, recordUse: () => {}, post: async () => ({ ok: true }) });
      assert("DOOR: a 14k moment still drains (the repair did not break the lane)", rDoor.ok && rDoor.drained === 1 && seen.length > 0);
      assert("DOOR: concept_tokens REACH the model — the field the recall-shelf keys on (the old 600-char cut dropped them entirely)",
        seen.includes("concept_tokens") && seen.includes("attention") && seen.includes("kv"));
      assert("DOOR: the skeleton survives whole — event_key, salience and the bound context all arrive",
        seen.includes("voice:doubt") && seen.includes("0.65") && seen.includes("context:Code.exe"));
      assert("DOOR: what is dropped is NAMED with a measured count, never silent",
        /\d+ of \d+ chars — \d+ DROPPED/.test(seen) && seen.includes("text_truncated"));
      const blk = momentBlock(bigRow[0], BG_MOMENT_BUDGET_CHARS);
      let parses = true; try { JSON.parse(blk); } catch { parses = false; }
      assert("DOOR: the served block is PARSEABLE JSON (the old slice ended mid-string literal)", parses);
      // the LIVE shape — the one moment that has ever entered bg_queue.jsonl carries
      // no bound context — fits the drain's own 600 and still delivers real prose.
      const liveShaped = { spotlight: bigSpot, bound_context: [] };
      const liveBlk = momentBlock(liveShaped, BG_MOMENT_BUDGET_CHARS);
      assert("DOOR: the budget did not move — still this drain's own 600, and the live moment shape fits it with prose to spare",
        BG_MOMENT_BUDGET_CHARS === 600 && liveBlk.length <= 600 && JSON.parse(liveBlk).spotlight.text.length > 0);
      // OPEN, HIS CALL (11 Aug 2026): with bound context attached, the skeleton plus
      // its absence-notes already exceed 600, so ZERO prose survives — the engine
      // rides over budget on purpose (structure over prose, cortex.mjs's own law) and
      // SAYS "0 of N chars" rather than dropping the structure silently. Raising this
      // door to cortex's 2,500 is the obvious cure and would 4× a background lane's
      // prompt spend, which is a number with the captain's name on it. Not guessed
      // here; this assertion pins the behaviour so the day he rules, it is one edit.
      assert("DOOR: skeleton-eats-the-budget is LOUD, never silent (the open question, pinned)",
        JSON.parse(blk).spotlight.text === "" && /0 of \d+ chars — \d+ DROPPED/.test(blk) && blk.length > BG_MOMENT_BUDGET_CHARS);
      const smallBlk = momentBlock({ spotlight: { text: "kv cache doubt again", concept_tokens: ["kv"] }, bound_context: [] }, BG_MOMENT_BUDGET_CHARS);
      assert("DOOR: a short moment still rides WHOLE, uncut and unmarked", smallBlk.includes("kv cache doubt again") && !smallBlk.includes("text_truncated"));
      let legacyParses = true; try { JSON.parse(bgMomentBlockLegacy(bigSpot)); } catch { legacyParses = false; }
      assert("DOOR: bgMomentBlockLegacy stays FROZEN verbatim as the witness — still tokenless, still mid-string",
        !bgMomentBlockLegacy(bigSpot).includes("concept_tokens") && legacyParses === false && bgMomentBlockLegacy(bigSpot).length === 600);
    }

    // ── THE VOICE (wiring audit, 11 Aug 2026) — ORPHAN_FIELD ────────────────
    // These ride the SENTENCE, not the field, because the field was never the
    // problem: drainBg computed engine_down honestly and both call sites binned
    // it. An assertion on `r.engine_down` would have stayed green through the
    // whole outage. Break the wire again — drop the PARTIAL clause, restore the
    // `ok && drained` predicate, swallow a skip — and these fail.
    {
      // a Claude plan wall mid-drain: engineFault = (limit_hit || threw) && not gemini
      const genWall = async () => ({ ok: false, limit_hit: true, error: "Claude usage limit reached — resets 22:00" });
      const rWallBg = await drainBg({ appendLedger: () => {}, tone: { effects: { dmn_allowed: true } }, readBgQueue: () => bgRows, board: twoLanes, keys: keysFix, generate: genWall, recordUse: () => {}, post: async () => ({ ok: true }) });
      assert("VOICE — THE DEFECT ITSELF, pinned: a walled drain returns ok:true with drained 0, so the old `bg.ok && bg.drained` call site was FALSE for exactly the outage it was meant to report",
        rWallBg.ok === true && rWallBg.drained === 0 && rWallBg.engine_down === "claude" && !(rWallBg.ok && rWallBg.drained));
      const wallLine = drainLine(rWallBg);
      assert("VOICE — the hourly pass now SPEAKS on a wall, and names the engine and its real error",
        typeof wallLine === "string" && wallLine.includes("PARTIAL") && wallLine.includes("claude") && wallLine.includes("usage limit reached"));
      assert("VOICE — and says the thoughts were kept, not lost (honest retry, never a raid on the core)",
        wallLine.includes("2 waiting") && wallLine.includes("stay queued"));
      // a skip is a reason, not a silence — all three skip shapes reach a human
      assert("VOICE — a conserve-tone mute is printed, not swallowed",
        String(drainLine(rMute)).includes("no drain") && String(drainLine(rMute)).includes("conserve"));
      assert("VOICE — a no-borrowable-lane refusal is printed, and is DISTINGUISHABLE from the conserve mute",
        String(drainLine(rT12)).includes("never spend the core") && drainLine(rT12) !== drainLine(rMute));
      // silence stays EARNED: only the true no-op is quiet, and only on the hourly lane
      assert("VOICE — an empty queue stays silent on the hourly pass (24 passes a day; a true no-op is not news)",
        drainLine(rNone) === null);
      assert("VOICE — but `dmn drain`, asked for by hand, always answers",
        String(drainLine(rNone, true)).includes("no suppressed thoughts waiting"));
      // a backlog that did not move is itself news, even with nothing drained
      assert("VOICE — a thalamus-down pass drained 0 yet still reports the 2 it is holding",
        String(drainLine(rDown)).includes("0 suppressed thought(s) drained") && String(drainLine(rDown)).includes("2 waiting"));
      assert("VOICE — ONE builder serves both call sites, so this can only rot in one place",
        typeof drainLine === "function");
    }
  }

  // clustering determinism
  {
    const rolls = [
      { stall_point: "precision recall tradeoff threshold", reframe_15s: "a", drill: "d", concept: "x" },
      { stall_point: "threshold precision-recall tradeoff!", reframe_15s: "b", drill: "d", concept: "x" },
      { stall_point: "kv cache growth unbounded", reframe_15s: "c", drill: "d", concept: "y" },
      { stall_point: "", reframe_15s: "junk", drill: "d" },
    ];
    const c = clusterRollouts(rolls);
    assert("normalized stall keys merge word-order/punctuation variants", c.length === 2 && c[0].votes === 2);
    assert("malformed rollouts dropped, never crash", c.every(x => x.stall_point));
  }
  // failure honesty
  assert("all rollouts dry → honest skip, precache untouched", (await dream({ ...base, generate: async (p) => p.includes("hostile") ? genOK(p) : { ok: false }, write: () => { throw new Error("must not write"); } })).skipped.includes("dry"));

  // dreamLegacy — the frozen floor still runs green (layering, never replace)
  {
    let saved = null, uses = 0;
    const genLegacy = async (p) => ({ ok: true, text: JSON.stringify({ stall_point: /eval/.test(p) ? "precision recall tradeoff at threshold" : "lost context after compaction", reframe_15s: "start from the confusion matrix, one cell at a time", drill: "hand-compute P/R on 10 rows" }) });
    const r = await dreamLegacy({ ...base, generate: genLegacy, recordUse: () => uses++, write: (o) => { saved = o; } });
    assert("LEGACY: the frozen serial engine still dreams (rollouts ≤ 8, T7 only)", r.ok && r.rollouts <= MAX_ROLLOUTS && uses === r.rollouts && saved.inert === true);
    assert("LEGACY: output shape unchanged (no engine stamp — the old contract)", saved.engine === undefined && saved.entries.every(e => e.reframe && e.drill));
  }

  // === KAAM 2 (10 Aug 2026) — THE NIGHT STOPS BEING DELETED =================
  {
    const E = (concept, stall, votes, verified) => ({ concept, stall_signature: stall, reframe: "r", drill: "d", votes, verified });
    const prior = { date: "2026-08-10", dreamed_at: "2026-08-10T01:00:00.000Z", rollouts: 25, passes_today: 1,
      entries: [E("hallucinations", "cannot name the measure", 2, true), E("hallucinations", "confuses grounding with RAG", 1, false)] };
    const fresh = { date: "2026-08-10", dreamed_at: "2026-08-10T02:00:00.000Z", rollouts: 25, verified: 1,
      entries: [E("hallucinations", "cannot name the measure", 3, false), E("embeddings", "thinks cosine is distance", 1, true)] };

    // 1 — THE DEFECT ITSELF, pinned on the frozen engine so it can never come back unnoticed.
    assert("KAAM2 — the FROZEN engine really did destroy the night: the prior file is not even read",
      mergePrecacheLegacy(prior, fresh).entries.length === 2
      && mergePrecacheLegacy(prior, fresh).entries.every(e => e.stall_signature !== "confuses grounding with RAG"));

    const m = mergePrecache(prior, fresh);
    // 2 — a repeat stall is a VOTE, not a duplicate.
    const repeat = m.entries.find(e => e.stall_signature === "cannot name the measure");
    assert("KAAM2 — a stall dreamed twice in one day MERGES and gains votes (2+3), keeping its first sighting",
      repeat.votes === 5 && repeat.passes === 2 && repeat.first_seen === "2026-08-10T01:00:00.000Z" && repeat.last_seen === "2026-08-10T02:00:00.000Z");
    // 3 — verified is a FLOOR. A pass that could not check does not un-verify a night.
    assert("KAAM2 — verified never goes backwards: this pass reported false, the entry stays verified",
      repeat.verified === true);
    // 4 — nothing from either side is lost.
    assert("KAAM2 — the earlier pass's OTHER stall survives, and the new pass's stall is added (3 total, none destroyed)",
      m.entries_seen_today === 3 && m.entries.some(e => e.stall_signature === "confuses grounding with RAG")
      && m.entries.some(e => e.concept === "embeddings") && m.merged === true && m.passes_today === 2);
    // 5 — the day's real cost is cumulative, not the last pass's.
    assert("KAAM2 — rollouts_today accumulates across passes (25+25), so the night's true cost is readable",
      m.rollouts_today === 50);
    // 6 — THE CUT ORDER, and that it cuts AFTER the merge.
    const many = { ...fresh, entries: [E("a", "s1", 9, false), E("b", "s2", 1, true), E("c", "s3", 1, true), E("d", "s4", 1, true), E("e", "s5", 1, true), E("f", "s6", 1, true), E("g", "s7", 1, true)] };
    const cut = mergePrecache({ date: "2026-08-10", dreamed_at: "2026-08-10T01:00:00.000Z", entries: [] }, many);
    assert("KAAM2 — VERIFIED outranks a higher-voted unverified entry at the cap (better no ammunition than wrong ammunition)",
      cut.entries.length === 6 && cut.entries.every(e => e.verified === true) && !cut.entries.some(e => e.stall_signature === "s1"));
    assert("KAAM2 — and the cap says out loud what it dropped, instead of dropping it silently",
      cut.entries_seen_today === 7);
    assert("KAAM2 — the cut order is one named function, so his stated order is one edit away",
      typeof cutOrder === "function" && [E("x", "x", 1, false), E("y", "y", 1, true)].sort(cutOrder)[0].verified === true);
    // 7 — the day boundary.
    const nextDay = mergePrecache(prior, { ...fresh, date: "2026-08-11" });
    assert("KAAM2 — a NEW day starts a clean sheet; the merge never drags yesterday forward",
      nextDay.merged === false && nextDay.passes_today === 1 && nextDay.entries.length === 2
      && !nextDay.entries.some(e => e.stall_signature === "confuses grounding with RAG"));
  }
  {
    // 8 — THE WEAK-VECTOR JOURNAL, on the REAL engine path with both new side
    // channels captured. This is the line that makes a week of dreams auditable
    // at all: today the DMN records nothing about what it aimed at, which is
    // exactly why the 9 Aug history can no longer be checked by anyone.
    const journal = [];
    let saved = null;
    await dream({ ...base, write: (o) => { saved = o; }, journalWeak: (row) => journal.push(row) });
    assert("KAAM2 — every pass appends ONE journal row naming what it aimed at, with its own cost",
      journal.length === 1 && journal[0].weak_vector.length === weakFix.length
      && journal[0].weak_vector[0].concept === "eval metrics" && journal[0].weak_vector[0].why === "danger zone"
      && typeof journal[0].rollouts === "number" && typeof journal[0].planned_rollouts === "number"
      && journal[0].date === localDate(base.now));
    assert("KAAM2 — and the precache carries the same vector, so the file explains itself without the journal",
      saved && Array.isArray(saved.weak_vector) && saved.weak_vector.map(w => w.concept).join(",") === "eval metrics,context windows");
    assert("KAAM2 — HERMETICITY: a redirected write carries the prior-read and the journal with it (a selftest can never touch live state)",
      saved.merged === false && saved.passes_today === 1);
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    const p = readJson(PRECACHE);
    console.log(p ? `dmn: precache ${p.date} — ${p.entries.length} predicted stall(s) loaded (${p.rollouts}${p.planned_rollouts ? `/${p.planned_rollouts} planned` : ""} rollouts${p.engine === "stadium" ? ` · stadium across ${(p.lanes || []).join("+")} · ${p.verified || 0} verified` : " · legacy"})${p.engine_down ? ` · PARTIAL: the ${p.engine_down} engine stood the stadium down (${String(p.engine_error).slice(0, 120)})` : ""} · INERT until M7 serves it through the earned-voice gate` : "dmn: no precache yet — it dreams when he's away");
    // #8's OTHER HALF, wired 11 Aug 2026. The drain's reason is stdout-only, and
    // the hourly task's stdout is not captured today — verified live this morning:
    // `schtasks /Query /TN ArsenalFC-DMN /V` still shows the bare pre-run_logged
    // /TR (`cmd /c cd /d <repo> && node scripts\dmn.mjs`), so its console closes
    // with the pass and there is no scripts\dmn.log at all. So the drain's new
    // sentence would land nowhere on the one lane that runs 24×/day. THE DURABLE
    // EVIDENCE of a drain that kept refusing is the queue it did not drain — read
    // it here, at the address a human actually opens. Read-only: thalamus.mjs owns
    // bg_queue.jsonl. No threshold is set on the backlog — the number that would
    // make one "too old" is his, and none is guessed here.
    const openBg = pendingBg(readLines(join(STATE_DIR, "bg_queue.jsonl")));
    if (!openBg.length) console.log("dmn: second-spotlight queue empty — every suppressed thought has had its second look");
    else {
      const ages = openBg.map(r => (Date.now() - new Date(r.ts || 0).getTime()) / 36e5).filter(h => Number.isFinite(h) && h >= 0);
      const oldest = ages.length ? Math.max(...ages) : null;
      console.log(`dmn: second-spotlight queue — ${openBg.length} suppressed thought(s) still waiting${oldest === null ? "" : `, oldest ${oldest < 24 ? `${oldest.toFixed(1)}h` : `${(oldest / 24).toFixed(1)}d`} old`} (a backlog that never moves IS the drain refusing; the reason rides the drain's own line)`);
    }
    // #7/#8 — THE ADDRESS. The DMN's spend and its outages now live in the shared
    // brain ledger; this is where a human reads them back. Before this, a Claude
    // refusal left only a `last_429` timestamp on the wrong instrument.
    const rows = readLines(BLEDGER).filter(r => DMN_JOBS.includes(r.job));
    if (!rows.length) console.log("dmn: brain-ledger rows for this organ: 0/0 — nothing metered yet (the spend is invisible to the budget until it dreams)");
    else {
      const today = localDate();
      // A row belongs to the day the captain lived, not the day UTC was having —
      // ts is ISO-UTC, `today` is local, so convert before comparing (the same IST
      // scar physio.mjs and fsrs.mjs both carry the fix for). (7 Aug 2026)
      const localDayOf = (ts) => { const d = new Date(String(ts || "")); return Number.isNaN(d.getTime()) ? String(ts || "").slice(0, 10) : localDate(d); };
      const mine = rows.filter(r => localDayOf(r.ts) === today);
      const tok = mine.reduce((a, r) => a + (r.total_tokens || 0), 0);
      const est = mine.filter(r => r.tokens_estimated).length;
      const fails = rows.filter(r => r.ok === false);
      const last = fails[fails.length - 1];
      console.log(`dmn: metered on the brain window — ${mine.length}/${rows.length} call(s) today, ${tok.toLocaleString()} tok${est ? ` (${est}/${mine.length} totals are length-ESTIMATES, not engine-reported)` : ""}`);
      console.log(last
        ? `dmn: last failed call ${last.ts} on ${last.lane || "?"} — limit_hit=${!!last.limit_hit}${last.limit_signal ? ` via ${last.limit_signal}` : ""}${last.http_status ? ` (HTTP ${last.http_status})` : ""} :: ${String(last.error || "").slice(0, 200)}`
        : `dmn: no failed calls on record (${rows.length} metered)`);
    }
    return;
  }
  if (mode === "drain") {
    const d = await drainBg({});
    console.log(drainLine(d, true));   // 11 Aug: he asked by hand, so it answers even when the answer is "nothing was waiting" — and now names a refusing engine
    return;
  }
  // the drain rides every pass first (cheap, ≤6, mouth/eyes lanes excluded mid-day)
  // 11 Aug 2026: the catch used to flatten every throw into the bare words "drain
  // error" — the same discard as the orphaned engine fields one line down, so a
  // crashed drain and a refused one read alike. The message rides now, clipped to
  // the organ's own 140.
  const bg = await drainBg({}).catch((e) => ({ ok: false, skipped: `drain error — ${String((e && e.message) || e).slice(0, 140)}` }));
  const bgLine = drainLine(bg);            // null ONLY for the true no-op (empty queue) — every skip/wall/backlog speaks
  if (bgLine) console.log(bgLine);
  const r = await dream({ force: process.argv.includes("--force") });
  console.log(r.ok
    ? `dmn: dreamed — ${r.entries} stall signature(s) from ${r.rollouts}/${r.planned_rollouts} planned rollouts across ${(r.lanes || []).join("+")} (${r.verified} verified; INERT ammunition for M7)${r.engine_down ? ` · PARTIAL: the ${r.engine_down} engine refused mid-pass — ${String(r.engine_error).slice(0, 140)}` : ""}`
    : `dmn: no dream — ${r.skipped}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { weakVector, weakVectorLegacy, marketConcept, isAway, dream, dreamLegacy, drainBg, borrowableTanks, clusterRollouts, rolloutPrompt, counterPrompt, PERSONAS, MAX_ROLLOUTS, MAX_ROLLOUTS_NIGHT, ROLLOUTS_PER_WEAK, BG_DRAIN_CAP,
  // audit 4 Aug 2026 — the new seams, exported so the doctor/other suites can
  // hold the fault-attribution (#8) and the meter (#7) to the same rules
  geminiFault, engineFault, ledgerRow, genSafe, DMN_JOBS, DMN_MODEL, MIN_STADIUM_BUDGET,
  // wiring audit 11 Aug 2026 — the drain's ONE voice, exported so the suite (and
  // any doctor) asserts on the sentence a human actually reads, not on a field
  // that a call site is free to throw away again
  drainLine };
