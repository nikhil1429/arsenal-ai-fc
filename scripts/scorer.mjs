#!/usr/bin/env node
// ============================================================================
// scorer.mjs · ARSENAL AI FC — THE ORGANISM: THE EVENING SCORER (the Slip)
// ----------------------------------------------------------------------------
// WHAT:  The metabolism's second half (THE_ORGANISM §IV.1). ONE ledger
//        (slip.jsonl), three books scored by ONE arithmetic: the CAPTAIN's
//        calibration (daily ECE snapshot), the TWIN's sealed bets, the
//        GAFFER's coaching moves (drill proposals maturing over a horizon).
//        Plus the No-Look Pass: trust tiers computed from validated hit-rates.
// WHY:   Without scored bets, both self-models are astrology. Calibration
//        stops being a private virtue and becomes the metabolism the whole
//        organism runs on.
// CONSTITUTIONAL (each selftested):
//   · ONE ARITHMETIC — the exported ece() from calibration.mjs scores the
//     captain's book; Brier scores the twin's and gaffer's. Same format,
//     same ledger, both directions.
//   · NEVER GUESS A RESOLUTION — a bet whose instrument is dark is SKIPPED
//     with evidence "instrument dark", never resolved by assumption.
//   · DESCRIPTIVE, NEVER LEVER-RANKING — gaffer tallies carry no rank field;
//     they are context for the Opus call, not an automated policy.
//   · NOTHING AUTO-PROMOTES — a tier crossing the no-look threshold gets
//     pending_ratification:true; the captain ratifies once, out loud.
//
// INPUT (read-only): predictions.jsonl · calibration.json · reps_log.jsonl ·
//   timeaudit.json · pitch_read.json · drills.json · post_match/<date>.md
// OUTPUT: slip.jsonl (append; sole writer) + trust_tiers.json (sole writer)
// MODES:  run (default: resolve matured + snapshot + propose; accepts
//         --date=YYYY-MM-DD to name the ledger day) · ratify <type> (the
//         captain's one word, the only path to no_look) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ece } from "./calibration.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "scorer_config.json");
const SLIP      = join(STATE_DIR, "slip.jsonl");
const TIERS     = join(STATE_DIR, "trust_tiers.json");

const DEFAULTS = {
  session_min_minutes: 45,
  first_focus_deadline: "09:30",
  trust: { no_look_min_hit_rate: 0.9, no_look_min_n: 20 },
  gaffer_horizon_days: 3,
  targets: { knew: 0.95, shaky: 0.65, guessed: 0.30 },
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const round = (x, d = 4) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        session_min_minutes: typeof j.session_min_minutes === "number" ? j.session_min_minutes : DEFAULTS.session_min_minutes,
        first_focus_deadline: j.first_focus_deadline || DEFAULTS.first_focus_deadline,
        trust: { ...DEFAULTS.trust, ...(j.trust || {}) },
        gaffer_horizon_days: typeof j.gaffer_horizon_days === "number" ? j.gaffer_horizon_days : DEFAULTS.gaffer_horizon_days,
        targets: { ...DEFAULTS.targets, ...(j.targets || {}) },
      };
    }
  } catch { /* malformed → defaults */ }
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch {}
  return out;
};

// ---------------------------------------------------------------------------
// pure core
// ---------------------------------------------------------------------------
// "N rep(s)" WHERE N WAS NEVER THE REP COUNT — ORGANISM audit #96 (2026-08-04).
// main() accumulates repsByDate[d] as a Set of CONCEPT NAMES and passed its `.size` as
// world.repsOnDate, which this rendered as "N rep(s)". Live proof: reps_log.jsonl holds
// SEVEN reps on 2026-07-31 (all on `hallucinations`) and the slip row reads
// {"date":"2026-07-31","type":"floor_touched","hit":true,"evidence":"1 rep(s)"} — wrong on
// both populated days, and evening_voice/2026-07-31.md quotes the wrong number verbatim
// back at him. Five brain jobs ingest slip.jsonl, so the wrong figure is what the LLM sees.
// The Set MUST stay exactly as it is — gafferMature's membership test (`set.has(...)`) is
// the whole reason it is a Set of concepts. So the row count rides in PARALLEL, as
// world.repRowsOnDate, with identical null semantics, and is used only for the sentence.
// A caller that does not supply it (any pre-audit fixture) gets the old string byte for
// byte — this can never silently print "undefined rep(s)".
function repsEvidence(world) {
  const rows = typeof world.repRowsOnDate === "number" ? world.repRowsOnDate : null;
  const tail = world.postmatchHit ? " + post-match HIT" : "";
  return rows === null
    ? `${world.repsOnDate} rep(s)${tail}`                                  // legacy caller: no row counter
    : `${rows} rep(s) on ${world.repsOnDate} concept(s)${tail}`;
}

// TWIN resolutions for a given date — never guessed; dark instrument = skip.
function resolveTwin(preds, world, dateStr, cfg) {
  const out = [];
  const todays = preds.filter(p => p.date === dateStr);
  for (const p of todays) {
    let hit = null, evidence = null;
    if (p.market === "floor_touched") {
      if (world.repsOnDate !== null) {
        // THE VERDICT is unchanged: world.repsOnDate is a Set SIZE, and a Set is non-empty
        // exactly when the row count is, so the hit gate below is identical either way.
        hit = world.repsOnDate > 0 || world.postmatchHit === true;
        evidence = repsEvidence(world);
      }
      else if (world.postmatchHit !== null) { hit = world.postmatchHit; evidence = "post-match verdict"; }
    } else if (p.market === "session_happened") {
      if (world.activeMinutes !== null) { hit = world.activeMinutes >= cfg.session_min_minutes; evidence = `${world.activeMinutes} active min (need ${cfg.session_min_minutes})`; }
    } else if (p.market === "first_focus_by_0930") {
      if (world.firstFocusKnown) { hit = world.firstFocusBy0930; evidence = world.firstFocusEvidence; }
    }
    if (hit === null) { out.push({ skipped: true, market: p.market, reason: "instrument dark" }); continue; }
    out.push({ date: dateStr, book: "twin", type: p.market, claim: p.market, p: p.p, horizon_days: 0, resolved: true, hit, evidence });
  }
  return out;
}

// CAPTAIN book: daily ECE snapshot; hit = gap narrowed vs previous snapshot.
function captainSnapshot(calibration, prevSnapshots, dateStr) {
  if (!calibration || typeof calibration.calibration_gap !== "number") return null;
  if (prevSnapshots.some(s => s.date === dateStr)) return null;         // idempotent per day
  const prev = prevSnapshots[prevSnapshots.length - 1];
  const hit = prev && typeof prev.gap === "number" ? calibration.calibration_gap <= prev.gap : true;
  return { date: dateStr, book: "captain", type: "calibration_gap", claim: "gap holds or narrows",
    p: null, gap: calibration.calibration_gap, horizon_days: 1, resolved: true, hit,
    evidence: prev ? `gap ${prev.gap} → ${calibration.calibration_gap}` : `first snapshot: ${calibration.calibration_gap}` };
}

// GAFFER book: (a) append today's drills as unresolved proposals;
// (b) mature proposals ≥ horizon old: hit = reps landed on those concepts.
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
// A PACKET'S IDENTITY IS ITS OWN PLAY DAY, NOT THE RUN CLOCK.
// E2E audit (25 Jul 2026, HIGH): proposals were stamped `date: dateStr` — the
// scorer RUN date — while drills.json carries `for`, the day the packet is FOR.
// setpiece compiles day D's packet at 21:40 on D-1, but INSTALL_TASKS fires the
// scorer at 21:35 and the full-time skill runs it AGAIN (before setpiece, then
// setpiece rewrites the file). So one packet got stamped D-1 by the late D-1 run
// and D by the next evening's 21:35 run; the dedupe key `date|claim` saw two
// different keys ⇒ ONE coaching move, TWO bets on the gaffer's book, and the two
// copies mature on different days with different verdicts. Stamping the packet's
// own `for` day makes re-runs over the same packet collapse onto one row by
// construction, and puts the play day inside the maturation window (below).
function packetDay(drills, dateStr) {
  const d = drills && (drills.for || drills.date);
  return ISO_DAY.test(String(d || "")) ? String(d) : dateStr;
}
function gafferPropose(drills, existing, dateStr) {
  if (!drills || !Array.isArray(drills.drills) || !drills.drills.length) return [];
  const day = packetDay(drills, dateStr);
  // resolved rows count as "already proposed" too — the ledger is append-only, so
  // a matured bet's original stays resolved:false forever; keying off unresolved
  // rows alone would let a retired proposal be re-opened by a stale packet.
  const already = new Set(existing.filter(s => s.book === "gaffer").map(s => `${s.date}|${s.claim}`));
  // ...and the batch dedupes against ITSELF. `already` was built from `existing`
  // only, so two drills in ONE packet naming the same concept (setpiece happily
  // emits a recall and a second recall on "inference") emitted two identical
  // rows in a single run — the same coaching move counted twice in the trust
  // tier. Found while verifying the E2E audit's double-proposal finding
  // (25 Jul 2026): the live slip carries doubled unresolved rows on 07-21,
  // 07-22 and 07-23, all same-date pairs the existing-only key could not see.
  const seen = new Set(already);
  return drills.drills.filter(d => d.kind !== "floor_touch").map(d => ({
    date: day, book: "gaffer", type: "drill:" + d.kind,
    claim: (d.concepts || []).join("+") || d.kind, p: null,
    horizon_days: 3, resolved: false, hit: null, evidence: d.source || null,
  })).filter(e => {
    const k = `${e.date}|${e.claim}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function gafferMature(existing, repsByDate, dateStr, horizonDays) {
  const out = [];
  // THE LEDGER IS APPEND-ONLY: a matured proposal's resolved copy is a NEW row
  // and the original stays resolved:false forever. Retirement therefore means
  // "a resolved row with the same (date|claim) already exists" — without this,
  // every proposal re-matures and re-appends on EVERY run, forever.
  const retired = new Set(existing.filter(s => s.book === "gaffer" && s.resolved).map(s => `${s.date}|${s.claim}`));
  for (const s of existing) {
    if (s.book !== "gaffer" || s.resolved) continue;
    if (retired.has(`${s.date}|${s.claim}`)) continue;
    const age = Math.round((new Date(dateStr) - new Date(s.date)) / 86400000);
    if (age < (s.horizon_days || horizonDays)) continue;
    const concepts = String(s.claim || "").split("+").filter(Boolean);
    let played = false;
    // THE WINDOW OPENS ON THE PLAY DAY ITSELF (i=0), not the morning after.
    // E2E audit (25 Jul 2026, HIGH — same defect as the run-date stamp above):
    // the scan started at i=1, so reps landed on the very day the packet was FOR
    // scored as "no reps on it". A drill done on the day it was set is the whole
    // point of setting it; missing it made the gaffer's book read as coaching
    // that never lands. Widening the window can only turn a fabricated MISS into
    // an honest HIT — it can never flip a real HIT to a MISS.
    for (let i = 0; i <= (s.horizon_days || horizonDays); i++) {
      const d = localDate(new Date(new Date(s.date).getTime() + i * 86400000));
      const set = repsByDate[d];
      if (set && concepts.some(c => set.has(c.toLowerCase()))) { played = true; break; }
    }
    out.push({ ...s, resolved: true, hit: played, evidence: (s.evidence || "") + ` | matured d+${age}: ${played ? "reps landed" : "no reps on it"}` });
  }
  return out;
}

// THE FIRST-FOCUS INSTRUMENT — a morning question needs a morning measurement.
// E2E audit (25 Jul 2026, HIGH): main() resolved this market with
//   firstFocusBy0930 = pr.tunnel.state !== "wall" && pr.tunnel.wall_minutes_today === 0
// but touchline's `tunnel.state` is a read of the LAST 45 MINUTES at whatever
// time it last ran (~21:0x by the 21:35 scorer) and `wall_minutes_today` accrues
// across the WHOLE day. Neither field records WHEN the first Learning-bucket
// focus landed. So a captain who opened Colab at 09:00 and hit one 15-minute
// window-hopping wall at 15:00 was stamped a MISS on a market he won — an
// evening proxy wearing a morning measurement's clothes. The live ledger shows
// the damage: first_focus_by_0930 sits at n=5, hit_rate 0.0, five fabricated
// MISSes the twin was then scored and re-calibrated against. That is a GUESS,
// and NEVER-GUESS-A-RESOLUTION outranks having a verdict.
// NOW: only a stamp captured AT the morning resolves it — pitch_read (or its
// tunnel block) must carry `first_focus_at` ("HH:MM" or an ISO instant) or an
// explicit boolean `first_focus_by`. No such instrument exists yet, so the
// market is DARK and resolveTwin skips it with "instrument dark" until whoever
// owns touchline.mjs stamps one. The deadline is now cfg.first_focus_deadline
// (it was loaded and never read; main() hardcoded 09:30 beside it).
function parseHHMM(s, fallbackMin = 9 * 60 + 30) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || "").trim());
  if (!m) return fallbackMin;
  const h = Number(m[1]), mi = Number(m[2]);
  if (!(h >= 0 && h <= 23 && mi >= 0 && mi <= 59)) return fallbackMin;
  return h * 60 + mi;
}
function stampMinutes(v) {
  const s = String(v || "").trim();
  if (!s) return null;
  const hm = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (hm) return parseHHMM(s, null);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.getHours() * 60 + d.getMinutes();
}
function firstFocusRead(pr, dateStr, now, cfg) {
  const DARK = { known: false, hit: null, evidence: null };
  const deadlineMin = parseHHMM(cfg && cfg.first_focus_deadline);
  // unjudgeable before the deadline — unless the ledger day is already over
  // (post-midnight full-time), in which case the morning is long settled.
  const dayOver = localDate(now) !== dateStr;
  if (!dayOver && now.getHours() * 60 + now.getMinutes() < deadlineMin) return DARK;
  if (!pr || pr.date !== dateStr) return DARK;
  const t = pr.tunnel || {};
  const flag = typeof pr.first_focus_by === "boolean" ? pr.first_focus_by
    : (typeof t.first_focus_by === "boolean" ? t.first_focus_by : null);
  if (flag !== null) return { known: true, hit: flag, evidence: pr.first_focus_evidence || t.first_focus_evidence || "pitch_read first_focus_by stamp" };
  const at = pr.first_focus_at || t.first_focus_at || null;
  const min = stampMinutes(at);
  if (min === null) return DARK;
  const hhmm = (n) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
  return { known: true, hit: min <= deadlineMin, evidence: `first Learning focus stamped ${hhmm(min)} (deadline ${hhmm(deadlineMin)})` };
}
// FROZEN VERBATIM — the pre-audit expression, kept as the record of what the
// market used to be resolved by. Reference only; nothing in the run path calls
// it, and it must never resolve a bet again.
function firstFocusFromTunnelLegacy(pr) {
  return !!(pr && pr.tunnel && pr.tunnel.state !== "wall" && pr.tunnel.wall_minutes_today === 0);
}

// THE LEDGER DAY vs THE CALENDAR DAY.
// E2E audit (25 Jul 2026, MEDIUM): the design (see main) leans on full-time
// re-appending a correction row over the premature 21:35 verdict. But main()
// derived `today = localDate(now)` off the wall clock, so a full-time run after
// midnight computed the NEXT calendar date: yesterday's twin bets were no longer
// in `todays`, the 23:50 reps keyed to yesterday were invisible, post_match/
// <yesterday>.md was never opened — the premature "0 rep(s)" MISS could never be
// corrected, and the correction mechanism the whole append-only design rests on
// silently stopped existing for exactly the nights he worked late. The captain's
// day ends when he closes it, not at 00:00: anything before the cutoff still
// belongs to yesterday's book.
const LEDGER_DAY_CUTOFF_HOUR = 4;
function ledgerDate(now, cutoffHour = LEDGER_DAY_CUTOFF_HOUR) {
  if (now.getHours() >= cutoffHour) return localDate(now);
  return localDate(new Date(now.getTime() - 86400000));
}

// THE RETIRED-RESOLVER QUARANTINE — ORGANISM audit #95 (2026-08-04).
// trust_tiers.json ships {"type":"first_focus_by_0930","n":5,"hit_rate":0}. All five rows
// (07-18, 07-21, 07-22, 07-23, 07-25, every one hit:false) were resolved by
// firstFocusFromTunnelLegacy — the evening tunnel proxy the 25 Jul audit RETIRED and froze
// two functions up, precisely because it answered a morning question with a 21:35 reading.
// Since the retirement the market has been correctly DARK: firstFocusRead refuses to answer
// without a genuine morning stamp, no organ writes first_focus_at, and so ZERO honest rows
// exist. A 0.0 hit-rate over a market that has never once been honestly measured is not a
// weak result — it is a fabricated one, and rule 4 of this repair says an unmeasured
// silence must never render as a measured zero.
//
// We do NOT rewrite slip.jsonl. It is append-only and those rows are the historical record
// of a bug; deleting them would destroy the evidence that the bug happened. Instead the
// tier REFUSES to count a row whose resolver no longer exists, and says so in the tier
// itself. Identification is by the resolver's own EVIDENCE SIGNATURE, not by a date:
// the retired proxy wrote "N window-switches, M Learning-min in last 45min"; the live
// resolver writes "first Learning focus stamped HH:MM (deadline HH:MM)" or the pitch_read
// stamp note. So the day touchline finally stamps a morning, new rows count automatically
// and the old ones stay quarantined — no cutoff to maintain, nothing to guess.
const RETIRED_RESOLVERS = [{
  book: "twin",
  type: "first_focus_by_0930",
  // evidence written by the CURRENT resolver (firstFocusRead) — anything else on this
  // market predates the retirement and cannot be evidence about anything.
  live_evidence: /first Learning focus stamped|first_focus_by stamp/i,
  why: "resolved by the retired evening tunnel proxy (firstFocusFromTunnelLegacy, frozen 25 Jul); no morning instrument has ever stamped first_focus_at, so this market has never been honestly measured",
}];
function retiredResolverFor(row) {
  for (const r of RETIRED_RESOLVERS) {
    if (row.book === r.book && row.type === r.type && !r.live_evidence.test(String(row.evidence || ""))) return r;
  }
  return null;
}

// TRUST TIERS — rolling per-type hit-rate; nothing auto-promotes.
function computeTiers(slip, cfg, prevTiers, now) {
  // the slip is append-only, so a corrected resolution (e.g. full-time flips a
  // premature 21:35 MISS to HIT) is a LATER row with the same identity — the
  // truth function reads LAST-WINS per (book,type,date,claim), never both.
  const lastWins = new Map();
  for (const s of slip) {
    if (!s.resolved || typeof s.hit !== "boolean") continue;
    lastWins.set(`${s.book}|${s.type}|${s.date}|${s.claim}`, s);
  }
  const byType = {};
  let quarantinedTotal = 0;
  for (const s of lastWins.values()) {
    const b = (byType[s.type] = byType[s.type] || { hits: [], quarantined: 0, why: null });
    const retired = retiredResolverFor(s);                  // audit #95
    if (retired) { b.quarantined++; quarantinedTotal++; b.why = retired.why; continue; }
    b.hits.push(s.hit);
  }
  const prevMap = new Map(((prevTiers && prevTiers.tiers) || []).map(t => [t.type, t]));
  const tiers = Object.entries(byType).map(([type, b]) => {
    const n = b.hits.length;
    // n === 0 with rows on the books means EVERY row was quarantined. hit_rate is null —
    // an unmeasured market, stated as unmeasured. It must never render as 0.
    const hit_rate = n ? round(b.hits.filter(Boolean).length / n, 4) : null;
    const qualifies = n >= cfg.trust.no_look_min_n && hit_rate !== null && hit_rate >= cfg.trust.no_look_min_hit_rate;
    const prev = prevMap.get(type);
    const ratified = prev ? prev.no_look === true && prev.pending_ratification === false : false;
    return {
      type, n, hit_rate,
      no_look: qualifies && ratified,                       // only a ratified tier renders bare
      pending_ratification: qualifies && !ratified,          // the captain says the word once
      // audit #95: the tier carries its own exclusions. A reader that ignores these fields
      // sees n/hit_rate that are already honest; a reader that reads them learns why.
      quarantined: b.quarantined,
      quarantine_reason: b.quarantined ? b.why : null,
    };
  });
  return {
    date: localDate(now), status: tiers.length ? "ok" : "awaiting_data", low_confidence: false,
    generated_at: now.toISOString(), tiers,
    quarantined_rows: quarantinedTotal,
  };
}

// THE DOOR THE CAPTAIN WALKS THROUGH — `node scorer.mjs ratify <type>`.
// E2E audit (25 Jul 2026, MEDIUM): computeTiers renders `no_look: qualifies &&
// ratified` where ratified is read back out of trust_tiers.json — of which the
// scorer is the SOLE writer, and which it only ever writes from computeTiers.
// So no_look could only ever be true if it was ALREADY true: a cold-start
// deadlock. A tier could cross the threshold, sit at pending_ratification:true
// forever, and the captain's word had nothing to land on — "the captain ratifies
// once, out loud" was a constitutional promise with no receiver. This mode is
// the receiver, mirroring shadow.mjs's `ratify <type>`. It still cannot promote
// anything on its own: the door must already be open (pending_ratification), and
// because computeTiers recomputes `qualifies` every run, a ratification whose
// hit-rate later decays goes dark again — ratification never outlives its proof.
function ratifyTier(prevTiers, type) {
  if (!prevTiers || !Array.isArray(prevTiers.tiers) || !prevTiers.tiers.length)
    return { ok: false, why: "no scored tiers yet — the scorer has not written trust_tiers.json" };
  const t = prevTiers.tiers.find(x => x.type === type);
  if (!t) return { ok: false, why: `unknown tier '${type}' — known: ${prevTiers.tiers.map(x => x.type).join(", ")}` };
  if (t.no_look === true) return { ok: false, why: `'${type}' is already ratified` };
  if (t.pending_ratification !== true) return { ok: false, why: `not proven yet — n=${t.n}, hit-rate ${t.hit_rate}; the door is shut and nothing auto-promotes` };
  t.no_look = true; t.pending_ratification = false;
  return { ok: true, why: `ratified by the captain's word — '${type}' renders bare (no-look) from now on`, doc: prevTiers };
}

// ---------------------------------------------------------------------------
// selftest — fixtures only
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = loadConfig("__no_such__");
  const now = new Date(2026, 6, 12, 21, 35, 0);
  const today = "2026-07-12";

  // ONE ARITHMETIC — imported ece() works exactly as calibration's
  const reps = [
    { confidence: "knew", correct: true }, { confidence: "knew", correct: true },
    { confidence: "knew", correct: false }, { confidence: "guessed", correct: false },
  ];
  // hand-computed: (3/4)·|2/3−0.95| + (1/4)·|0−0.30| = 0.2125 + 0.075 = 0.2875
  const gap = ece(reps, cfg.targets);
  assert("ONE ARITHMETIC — imported ece() computes (0.2875 hand fixture)", round(gap) === 0.2875);

  // twin resolution
  const preds = [
    { date: today, market: "floor_touched", p: 0.5 },
    { date: today, market: "session_happened", p: 0.5 },
    { date: today, market: "first_focus_by_0930", p: 0.5 },
  ];
  const world1 = { repsOnDate: 2, repRowsOnDate: 7, postmatchHit: null, activeMinutes: 120, firstFocusKnown: true, firstFocusBy0930: false, firstFocusEvidence: "wall until 10:05" };
  const res1 = resolveTwin(preds, world1, today, cfg);
  assert("floor_touched resolves on reps", res1.find(r => r.type === "floor_touched").hit === true);
  assert("session_happened resolves on active minutes", res1.find(r => r.type === "session_happened").hit === true);
  assert("first_focus resolves only from a KNOWN instrument", res1.find(r => r.type === "first_focus_by_0930").hit === false);

  // E2E audit 25 Jul 2026 (HIGH) — the first-focus market must never be answered
  // by an evening tunnel read. It is a morning question; only a morning stamp.
  {
    const evening = { date: today, tunnel: { state: "clear", wall_minutes_today: 0, evidence: "3 window-switches, 22 Learning-min in last 45min" } };
    const ffDark = firstFocusRead(evening, today, now, cfg);
    assert("NEVER GUESS — the 21:35 tunnel read is NOT a morning instrument ⇒ dark", ffDark.known === false && ffDark.hit === null);
    assert("...and the frozen legacy proxy would have answered it anyway (the bug, preserved)", firstFocusFromTunnelLegacy(evening) === true);
    const walled = { date: today, first_focus_at: "09:05", tunnel: { state: "wall", wall_minutes_today: 15 } };
    assert("a 09:05 stamp is a HIT even after a 15:00 wall (wall_minutes ≠ start time)", firstFocusRead(walled, today, now, cfg).hit === true);
    assert("a 10:40 stamp is an honest MISS", firstFocusRead({ date: today, first_focus_at: "10:40" }, today, now, cfg).hit === false);
    assert("before the deadline the market is unjudgeable, stamp or no stamp", firstFocusRead(walled, today, new Date(2026, 6, 12, 8, 0, 0), cfg).known === false);
    assert("the deadline comes from config, not a hardcoded 09:30", firstFocusRead({ date: today, first_focus_at: "10:00" }, today, now, { ...cfg, first_focus_deadline: "10:30" }).hit === true);
    assert("a stale pitch_read (yesterday's) is dark", firstFocusRead({ date: "2026-07-11", first_focus_at: "09:00" }, today, now, cfg).known === false);
  }

  // E2E audit 25 Jul 2026 (MEDIUM) — the ledger day is the captain's day, and it
  // does not end at 00:00; the post-midnight full-time must still close it.
  assert("evening run scores the day it is in", ledgerDate(new Date(2026, 6, 12, 21, 35, 0)) === "2026-07-12");
  assert("LEDGER DAY: a 00:15 full-time still closes YESTERDAY's book (else no correction is possible)", ledgerDate(new Date(2026, 6, 13, 0, 15, 0)) === "2026-07-12");
  assert("past the 04:00 cutoff the new day owns the ledger", ledgerDate(new Date(2026, 6, 13, 4, 0, 0)) === "2026-07-13");

  // ORGANISM audit #96 (2026-08-04) — "N rep(s)" where N was the CONCEPT count.
  // Live: 7 reps on 2026-07-31, all on `hallucinations`, filed as "1 rep(s)".
  {
    const ev = res1.find(r => r.type === "floor_touched").evidence;
    assert("#96 the slip says how many REPS landed and on how many concepts (was '1 rep(s)' for 7)",
      ev === "7 rep(s) on 2 concept(s)");
    assert("#96 the hit VERDICT is untouched — a Set size >0 exactly when the row count is",
      resolveTwin(preds, { ...world1, repsOnDate: 1, repRowsOnDate: 7 }, today, cfg).find(r => r.type === "floor_touched").hit === true
      && resolveTwin(preds, { ...world1, repsOnDate: 0, repRowsOnDate: 0, postmatchHit: null }, today, cfg).find(r => r.type === "floor_touched").hit === false);
    assert("#96 a caller with no row counter still gets the exact legacy string (never 'undefined rep(s)')",
      resolveTwin(preds, { repsOnDate: 2, postmatchHit: null, activeMinutes: null, firstFocusKnown: false }, today, cfg)
        .find(r => r.type === "floor_touched").evidence === "2 rep(s)");
    assert("#96 the post-match witness still rides on the end of the sentence",
      resolveTwin(preds, { ...world1, postmatchHit: true }, today, cfg).find(r => r.type === "floor_touched").evidence === "7 rep(s) on 2 concept(s) + post-match HIT");
  }

  // NEVER GUESS — dark instruments skip
  const dark = resolveTwin(preds, { repsOnDate: null, repRowsOnDate: null, postmatchHit: null, activeMinutes: null, firstFocusKnown: false }, today, cfg);
  assert("NEVER GUESS — dark instrument ⇒ skipped with reason", dark.every(r => r.skipped && r.reason === "instrument dark"));

  // captain snapshot: narrowing = hit; idempotent
  const snap1 = captainSnapshot({ calibration_gap: 0.2 }, [], today);
  assert("first captain snapshot is a hit (baseline)", snap1.hit === true && snap1.gap === 0.2);
  const snap2 = captainSnapshot({ calibration_gap: 0.15 }, [{ date: "2026-07-11", gap: 0.2 }], today);
  assert("gap narrowed ⇒ hit", snap2.hit === true);
  const snap3 = captainSnapshot({ calibration_gap: 0.3 }, [{ date: "2026-07-11", gap: 0.2 }], today);
  assert("gap widened ⇒ miss (honest)", snap3.hit === false);
  assert("snapshot idempotent per day", captainSnapshot({ calibration_gap: 0.1 }, [{ date: today, gap: 0.2 }], today) === null);

  // gaffer propose + mature
  const drills = { drills: [{ kind: "derby", concepts: ["tokenization", "embeddings"], source: "confused ×4" }, { kind: "floor_touch", concepts: [] }] };
  const props = gafferPropose(drills, [], today);
  assert("gaffer proposals appended unresolved (floor_touch excluded)", props.length === 1 && props[0].resolved === false);
  assert("gaffer propose idempotent", gafferPropose(drills, props, today).length === 0);
  const repsByDate = { "2026-07-11": new Set(["embeddings"]) };
  const matured = gafferMature([{ date: "2026-07-09", book: "gaffer", type: "drill:derby", claim: "tokenization+embeddings", horizon_days: 3, resolved: false }], repsByDate, "2026-07-12", 3);
  assert("gaffer proposal matures at horizon: reps landed ⇒ hit", matured.length === 1 && matured[0].hit === true);
  const maturedMiss = gafferMature([{ date: "2026-07-09", book: "gaffer", type: "drill:derby", claim: "chunking", horizon_days: 3, resolved: false }], repsByDate, "2026-07-12", 3);
  assert("no reps in horizon ⇒ honest miss", maturedMiss[0].hit === false);
  assert("young proposals left unresolved", gafferMature([{ date: today, book: "gaffer", type: "drill:derby", claim: "x", horizon_days: 3, resolved: false }], {}, today, 3).length === 0);

  // E2E audit 25 Jul 2026 (HIGH) — ONE packet is ONE bet, stamped with the day
  // it is FOR. setpiece writes day D's packet at 21:40 on D-1; the scorer sees
  // that same file at full-time on D-1 AND at 21:35 on D.
  {
    const packet = { date: "2026-07-13", for: "2026-07-13", drills: [{ kind: "derby", concepts: ["tokenization"], source: "confused ×4" }] };
    const lateOnDMinus1 = gafferPropose(packet, [], "2026-07-12");
    assert("proposal carries the packet's PLAY day, not the scorer run date", lateOnDMinus1[0].date === "2026-07-13");
    assert("the same packet seen on two runs ⇒ ONE bet, not two", gafferPropose(packet, lateOnDMinus1, "2026-07-13").length === 0);
    const resolvedCopy = { ...lateOnDMinus1[0], resolved: true, hit: true };
    assert("a matured packet is never re-proposed by a stale drills.json", gafferPropose(packet, [lateOnDMinus1[0], resolvedCopy], "2026-07-16").length === 0);
    assert("a packet with no `for`/`date` falls back to the run date (nothing regresses)", gafferPropose({ drills: packet.drills }, [], "2026-07-12")[0].date === "2026-07-12");
    const doubled = { for: "2026-07-13", drills: [{ kind: "recall", concepts: ["inference"] }, { kind: "recall", concepts: ["inference"] }] };
    assert("two drills on the SAME concept in ONE packet ⇒ ONE bet (live slip doubled 07-21/22/23)", gafferPropose(doubled, [], "2026-07-13").length === 1);
    // and the window must open ON the play day — a drill done the day it was set
    const onDay = gafferMature([{ date: "2026-07-13", book: "gaffer", type: "drill:derby", claim: "tokenization", horizon_days: 3, resolved: false }],
      { "2026-07-13": new Set(["tokenization"]) }, "2026-07-16", 3);
    assert("reps ON the play day count — the maturation window no longer starts a day late", onDay.length === 1 && onDay[0].hit === true);
  }

  // trust tiers
  // THE RETIREMENT LAW — a matured proposal never re-matures (append-only ledger)
  {
    const proposal = { date: "2026-07-09", book: "gaffer", type: "drill:recall", claim: "embeddings", horizon_days: 3, resolved: false, hit: null };
    const rbd = { "2026-07-10": new Set(["embeddings"]) };
    const m1 = gafferMature([proposal], rbd, today, 3);
    assert("a ripe proposal matures once (hit on reps landed)", m1.length === 1 && m1[0].resolved === true && m1[0].hit === true);
    const m2 = gafferMature([proposal, m1[0]], rbd, today, 3);
    assert("RETIREMENT: the resolved copy retires the original — no re-maturing, ever", m2.length === 0);
  }
  // LAST-WINS — a correction row (full-time flips the premature 21:35 read) replaces, never double-counts
  {
    const rows = [
      { date: today, book: "twin", type: "floor_touched", claim: "floor_touched", resolved: true, hit: false },
      { date: today, book: "twin", type: "floor_touched", claim: "floor_touched", resolved: true, hit: true },
    ];
    const t = computeTiers(rows, cfg, null, now).tiers.find(x => x.type === "floor_touched");
    assert("LAST-WINS: a corrected resolution counts once, as the correction", t.n === 1 && t.hit_rate === 1);
  }

  const slip = Array.from({ length: 25 }, (_, i) => ({ date: "2026-07-" + String(i + 1).padStart(2, "0"), claim: "c" + i, type: "drill:recall", book: "gaffer", resolved: true, hit: i !== 0 }));
  const tiers1 = computeTiers(slip, cfg, null, now);
  const t = tiers1.tiers.find(x => x.type === "drill:recall");
  assert("tier crossing threshold ⇒ pending_ratification, NOT no_look", t.pending_ratification === true && t.no_look === false);
  const tiers2 = computeTiers(slip, cfg, { tiers: [{ type: "drill:recall", no_look: true, pending_ratification: false }] }, now);
  assert("ratified tier renders no_look", tiers2.tiers.find(x => x.type === "drill:recall").no_look === true);
  assert("DESCRIPTIVE LAW — no rank/lever fields anywhere", !JSON.stringify(tiers1).match(/"rank"|"lever"/));
  assert("empty slip ⇒ awaiting_data", computeTiers([], cfg, null, now).status === "awaiting_data");

  // E2E audit 25 Jul 2026 (MEDIUM) — the ratification deadlock: no_look could
  // only ever be true if it was already true. Here is the door, and its lock.
  {
    const pend = computeTiers(slip, cfg, null, now);
    assert("ratify refuses an unknown tier", ratifyTier(pend, "drill:nope").ok === false);
    assert("ratify REFUSED before the proof (door shut ⇒ nothing auto-promotes)", ratifyTier(computeTiers(slip.slice(0, 3), cfg, null, now), "drill:recall").ok === false);
    const said = ratifyTier(pend, "drill:recall");
    assert("THE CAPTAIN'S WORD LANDS: pending_ratification → no_look (was unreachable)", said.ok === true && pend.tiers.find(x => x.type === "drill:recall").no_look === true && pend.tiers.find(x => x.type === "drill:recall").pending_ratification === false);
    assert("the ratification survives the next scoring run", computeTiers(slip, cfg, pend, now).tiers.find(x => x.type === "drill:recall").no_look === true);
    assert("ratify refuses a second time (the word is said once)", ratifyTier(pend, "drill:recall").ok === false);
    // ratification cannot outlive its proof — decay re-shuts the door
    const decayed = slip.map((s, i) => ({ ...s, hit: i % 2 === 0 }));
    assert("a decayed hit-rate revokes no_look (proof outranks the word)", computeTiers(decayed, cfg, pend, now).tiers.find(x => x.type === "drill:recall").no_look === false);
  }

  // ORGANISM audit #95 (2026-08-04) — five fabricated MISSes welded into a trust tier.
  {
    // the live rows, verbatim in shape: the retired tunnel proxy's evidence signature.
    const ghosts = ["2026-07-18", "2026-07-21", "2026-07-22", "2026-07-23", "2026-07-25"].map((d, i) => ({
      date: d, book: "twin", type: "first_focus_by_0930", claim: "first_focus_by_0930",
      resolved: true, hit: false, evidence: `${i * 30} window-switches, 0 Learning-min in last 45min`,
    }));
    const g = computeTiers(ghosts, cfg, null, now);
    const ff = g.tiers.find(x => x.type === "first_focus_by_0930");
    assert("#95 a market resolved only by a RETIRED instrument reports hit_rate null, never 0",
      ff.hit_rate === null && ff.n === 0 && ff.quarantined === 5 && g.quarantined_rows === 5);
    assert("#95 ...and the tier says WHY, on its own face", /retired evening tunnel proxy/.test(ff.quarantine_reason));
    assert("#95 a null hit-rate can never qualify for no_look (the door stays shut)",
      ff.no_look === false && ff.pending_ratification === false);
    // THE LEDGER IS NOT REWRITTEN — the rows stay; only the tier refuses to count them.
    assert("#95 the append-only ledger is untouched — quarantine is a READ-side refusal",
      ghosts.length === 5 && ghosts.every(r => r.resolved === true));
    // the day a real morning instrument lands, its rows count automatically — no date cutoff
    const honest = ghosts.concat([{ date: "2026-08-04", book: "twin", type: "first_focus_by_0930", claim: "first_focus_by_0930",
      resolved: true, hit: true, evidence: "first Learning focus stamped 09:05 (deadline 09:30)" }]);
    const h = computeTiers(honest, cfg, null, now).tiers.find(x => x.type === "first_focus_by_0930");
    assert("#95 an honestly-measured row counts the moment it exists (no cutoff to maintain)",
      h.n === 1 && h.hit_rate === 1 && h.quarantined === 5);
    assert("#95 markets with a live producer are NOT quarantined (no collateral damage)",
      computeTiers(slip, cfg, null, now).tiers.find(x => x.type === "drill:recall").quarantined === 0
      && computeTiers(slip, cfg, null, now).quarantined_rows === 0);
    assert("#95 the pitch_read stamp evidence is also recognised as live",
      computeTiers([{ date: today, book: "twin", type: "first_focus_by_0930", claim: "first_focus_by_0930", resolved: true, hit: true,
        evidence: "pitch_read first_focus_by stamp" }], cfg, null, now).tiers[0].n === 1);
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  // argv: flags (--date=YYYY-MM-DD) are parsed out so `mode` stays the first
  // bare word — `run` (default) · `selftest` · `ratify <type>`.
  const argv = process.argv.slice(2);
  const bare = argv.filter(a => !a.startsWith("--"));
  const mode = (bare[0] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const cfg = loadConfig();
  const now = new Date();
  if (mode === "ratify") {
    // E2E audit 25 Jul 2026 — the receiver for the captain's one word (see
    // ratifyTier). Reads and rewrites trust_tiers.json only; touches no ledger.
    const r = ratifyTier(readJson(TIERS), String(bare[1] || ""));
    console.log(`scorer ratify: ${r.ok ? "✓" : "✗"} ${r.why}`);
    if (r.ok) writeAtomic(TIERS, r.doc);
    process.exit(r.ok ? 0 : 1);
  }
  // THE LEDGER DAY, not the calendar day (see ledgerDate): a full-time run at
  // 00:15 is still closing YESTERDAY's book, and that is precisely the run whose
  // job is to correct the premature 21:35 verdicts. `--date=YYYY-MM-DD` lets the
  // full-time skill name the day explicitly when it knows better.
  const dateArg = argv.map(a => (/^--date=(\d{4}-\d{2}-\d{2})$/.exec(a) || [])[1]).find(Boolean) || null;
  const today = dateArg || ledgerDate(now);
  const slip = readLines(SLIP);
  const preds = readLines(join(STATE_DIR, "predictions.jsonl"));
  const reps = readLines(join(STATE_DIR, "reps_log.jsonl"));
  const repsByDate = {};
  // audit #96: the ROW counter, built in the same loop off the same key, so it can never
  // drift from the Set. The Set is untouched — gafferMature needs concept membership.
  const repRowsByDate = {};
  for (const r of reps) {
    // reps stamp ts in UTC ISO; the day boundary is the CAPTAIN'S midnight —
    // localDate() of the parsed instant keys a 00:45 IST rep to the right day
    const parsed = r.ts ? new Date(r.ts) : null;
    const d = parsed && !Number.isNaN(parsed.getTime()) ? localDate(parsed) : String(r.ts || "").slice(0, 10);
    (repsByDate[d] = repsByDate[d] || new Set()).add(String(r.concept || "").toLowerCase());
    repRowsByDate[d] = (repRowsByDate[d] || 0) + 1;
  }
  const ta = readJson(join(STATE_DIR, "timeaudit.json"));
  const pr = readJson(join(STATE_DIR, "pitch_read.json"));
  const pmPath = join(STATE_DIR, "post_match", today + ".md");
  const pmText = existsSync(pmPath) ? readFileSync(pmPath, "utf8") : null;
  // NEVER-GUESS-A-RESOLUTION: a stale instrument is a DARK instrument.
  // timeaudit dated yesterday must not resolve today's session_happened, and
  // first-focus is unjudgeable before the deadline or before kickoff.
  const taFresh = ta && ta.date === today ? ta : null;
  // E2E audit 25 Jul 2026: the old `deadlinePassed` const hardcoded 09:30 while
  // cfg.first_focus_deadline sat unread two lines away; the deadline (and the
  // whole first-focus question) now lives inside firstFocusRead, which refuses to
  // answer at all without a genuine morning stamp.
  const ff = firstFocusRead(pr, today, now, cfg);
  // audit #96 — IDENTICAL null semantics on both counters, derived from one expression so
  // they cannot diverge: null means "reps_log.jsonl does not exist" (a dark instrument),
  // 0 means "the file exists and holds nothing for today" (a measured zero).
  const noReps = existsSync(join(STATE_DIR, "reps_log.jsonl")) ? 0 : null;
  const world = {
    repsOnDate: reps.length ? (repsByDate[today] ? repsByDate[today].size : 0) : noReps,
    repRowsOnDate: reps.length ? (repRowsByDate[today] || 0) : noReps,
    postmatchHit: pmText ? /\b(HIT|PARTIAL)\b/.test(pmText) : null,
    activeMinutes: taFresh && typeof taFresh.productiveMinutes === "number" ? taFresh.productiveMinutes
      : (taFresh && taFresh.buckets ? ["Learning", "Building"].reduce((a, b) => a + ((taFresh.buckets[b] && taFresh.buckets[b].minutes) || 0), 0) : null),
    firstFocusKnown: ff.known,
    firstFocusBy0930: ff.hit,
    firstFocusEvidence: ff.evidence,
  };

  const newRows = [];
  // scorer runs twice a day BY DESIGN (21:35 task + full-time) — a market
  // already resolved today re-appends ONLY as a correction (the hit flipped);
  // an identical verdict never lands twice. computeTiers reads last-wins.
  const twinPrior = new Map(slip.filter(s => s.book === "twin" && s.resolved).map(s => [`${s.date}|${s.type}`, s.hit]));
  newRows.push(...resolveTwin(preds, world, today, cfg).filter(r => !r.skipped)
    .filter(r => !twinPrior.has(`${r.date}|${r.type}`) || twinPrior.get(`${r.date}|${r.type}`) !== r.hit));
  const prevSnaps = slip.filter(s => s.book === "captain" && s.type === "calibration_gap");
  // a calibration file from another day is a dead instrument — no snapshot
  const cal = readJson(join(STATE_DIR, "calibration.json"));
  const snap = captainSnapshot(cal && cal.date === today ? cal : null, prevSnaps, today);
  if (snap) newRows.push(snap);
  const maturedRaw = gafferMature(slip, repsByDate, today, cfg.gaffer_horizon_days);
  newRows.push(...maturedRaw);
  newRows.push(...gafferPropose(readJson(join(STATE_DIR, "drills.json")), slip, today));

  if (newRows.length) {
    mkdirSync(dirname(SLIP), { recursive: true });
    appendFileSync(SLIP, newRows.map(r => JSON.stringify(r)).join("\n") + "\n");
  }
  const fullSlip = slip.concat(newRows);
  const tiers = computeTiers(fullSlip, cfg, readJson(TIERS), now);
  writeAtomic(TIERS, tiers);
  const resolved = newRows.filter(r => r.resolved).length;
  console.log(`scorer: ${resolved} resolution(s), ${newRows.length - resolved} proposal(s) appended · slip=${fullSlip.length} rows → ${TIERS}`);
  // audit #95: an excluded row is never silently excluded.
  if (tiers.quarantined_rows) {
    console.log(`  quarantined ${tiers.quarantined_rows} row(s) resolved by a retired instrument (kept in slip.jsonl, refused by the tiers):`);
    for (const t of tiers.tiers) if (t.quarantined) console.log(`    ${t.type}: ${t.quarantined} row(s), n=${t.n}, hit_rate=${t.hit_rate === null ? "null (never honestly measured)" : t.hit_rate} — ${t.quarantine_reason}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { resolveTwin, captainSnapshot, gafferPropose, gafferMature, computeTiers, loadConfig,
  firstFocusRead, firstFocusFromTunnelLegacy, ledgerDate, ratifyTier, packetDay,
  // audit #95/#96 (2026-08-04): the honest rep sentence and the retired-resolver refusal.
  repsEvidence, retiredResolverFor, RETIRED_RESOLVERS };
