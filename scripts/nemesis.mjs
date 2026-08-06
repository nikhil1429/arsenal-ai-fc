#!/usr/bin/env node
// ============================================================================
// nemesis.mjs · ARSENAL AI FC — AGENT #3: NEMESIS (self-scout)
// ----------------------------------------------------------------------------
// WHAT:  Surfaces the ONE recurring "kind of thinking" that keeps breaking — the
//        cross-concept AXIS pattern no per-card view can see — as a self-SCOUT
//        report, never a shame-list. A CONSUMER of reps_log.jsonl (Agent #0);
//        never writes it. Single writer of weaknesses.json (Fork A3: Nemesis
//        writes the FILE, the Manager writes the surfaced team-sheet LINE —
//        exactly the FSRS→cards.json / Calibration→calibration.json precedent).
// WHY:   Recurrence is FSRS's job; confident-wrong is Calibration's. Nemesis's
//        UNIQUE signal = misses on different concepts CLUSTERING on one axis
//        ("tokenization+chunking+retrieval all break on axis-e / failure-modes")
//        → the nemesis is a KIND OF THINKING, not a topic. That is the payoff
//        for capturing `axis` from day 1. Frame = self-scout; no hype/10x.
//
// MISS-SIGNAL (Fork B — what COUNTS, grouped per topic; guessed-wrong alone does NOT):
//   RELAPSE         — correct earlier, later incorrect (replay reps in ts order per concept)
//   confident-wrong — correct=false AND confidence="knew"
//   shaky-wrong     — correct=false AND confidence="shaky"   (Calibration excludes this; it lands here)
//   guessed-wrong with no relapse ⇒ NOT a miss (that recurrence is FSRS's job — no duplication)
//   BOTH tracks count (a Python relapse is real); axis-clustering is concept-track ONLY.
//
// RANKING (Fork C): per-entry score = recency-weighted recurrence (halflife decay).
//   headline = single highest-score OPEN weakness (or null — bias-to-silence).
//   axis_pattern (CEILING) surfaces ONLY when BOTH: (i) distinct concepts on one axis ≥
//   axis_cluster_min_concepts AND (ii) total_reps ≥ warming_up_min_reps. Else null.
// HEALED (Fork D): last healed_clean_streak reps clean + no knew-wrong ⇒ status:"closed"
//   (kept as history — beaten opponent = trophy — off active rank; pruned after closed_prune_days).
//
// INPUT (reads-only; reps_log is the SOLE truth source — calibration.json NOT read):
//   dressing-room/state/reps_log.jsonl  (Agent #0, both tracks)
//   dressing-room/state/concepts.json   (canon vocab — axis authority + alias normalize;
//                                        MISSING ⇒ raw topic id + axis null, still runs)
//
// OUTPUT: dressing-room/state/weaknesses.json (single writer; gitignored — derived PII):
//   canonical (THE_MANAGER §4/§5/§10): weaknesses:[{id,topic,recurrence,last_seen,status,evidence[]}]
//   additive: date, generated_at, total_reps, status(envelope), low_confidence, headline,
//   axis_pattern{axis,concepts[],strength,note}, per-entry {axis, axis_counts, score},
//   gate{reps_have,reps_need,met,short_by} + status_line (audit #100/#106: every gate word
//   ships its own have/need counter; the gate itself is unchanged).
//   evidence[] entries are "MM-DD HH:MM axis X type" — one distinguishable receipt per
//   miss (audit #31). `axis` is a STRICT mode: a tie names no axis and says so.
//   id = STABLE topic-derived slug (never positional; grouping is per TRACK+topic, so the id
//   carries a track suffix ONLY when the same topic exists on both tracks). recurrence = RAW int;
//   score = weighted float. last_seen / evidence dates are the captain's LOCAL day, like `date`.
//
// MODES: recompute (default) · selftest
// RULES (CONDUCTOR §4): deterministic · zero-LLM · no API key · Node 22 ESM · Windows-safe
//   entry guard · atomic write (temp→rename) · empty-safe · never fabricate · matches fsrs/calibration.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const REPS_LOG  = join(STATE_DIR, "reps_log.jsonl");
const WEAK      = join(STATE_DIR, "weaknesses.json");
const CFG_PATH  = join(STATE_DIR, "nemesis_config.json");     // canon (committed)
const CONCEPTS_PATH = join(STATE_DIR, "concepts.json");       // canon (committed)

const DEFAULTS = {
  axis_cluster_min_concepts: 3, recency_halflife_days: 10, warming_up_min_reps: 20,
  healed_clean_streak: 3, closed_prune_days: 30,
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const CONF   = new Set(["knew", "shaky", "guessed"]);
const TRACKS = new Set(["concept", "skill"]);
const normText = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
const slugify  = (s) => normText(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "topic";
const round = (x, d = 4) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);
const numOr = (x, dflt) => (typeof x === "number" && !Number.isNaN(x) ? x : dflt);
const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
// LEGACY (frozen verbatim, layering rule): raw UTC-slice date labels. E2E audit 25 Jul 2026
// (5de388f9) found these mislabel the captain's real reps — capture.mjs stores ts as UTC "Z"
// (both real rows in reps_log.jsonl are "…T19:00:29Z" = 00:30 IST the NEXT day), so a rep done
// between 00:00–05:29 IST was stamped with YESTERDAY while the envelope `date` is local: the
// morning sheet showed a weakness "last seen" a day before the session that produced it.
const mmdd = (ts) => String(ts).slice(5, 10);
const isoDate = (ts) => String(ts).slice(0, 10);
// LIVE path: label misses by the captain's LOCAL calendar day (same clock as `date`).
const localIsoDate = (ts) => localDate(new Date(Date.parse(ts)));
const localMmdd = (ts) => localIsoDate(ts).slice(5);
// ORGANISM AUDIT #31 (2026-08-04): the clock-time half of a distinguishable receipt.
const localHhmm = (ts) => {
  const d = new Date(Date.parse(ts));
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

function loadConfig(path = CFG_PATH) {
  const d = DEFAULTS;
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        axis_cluster_min_concepts: numOr(j.axis_cluster_min_concepts, d.axis_cluster_min_concepts),
        recency_halflife_days: numOr(j.recency_halflife_days, d.recency_halflife_days),
        warming_up_min_reps: numOr(j.warming_up_min_reps, d.warming_up_min_reps),
        healed_clean_streak: numOr(j.healed_clean_streak, d.healed_clean_streak),
        closed_prune_days: numOr(j.closed_prune_days, d.closed_prune_days),
      };
    }
  } catch { /* malformed config → defaults */ }
  return { ...d };
}

// registry: concepts.json is the AXIS AUTHORITY. loaded=false ⇒ axis null everywhere (capsule).
function loadRegistry(path = CONCEPTS_PATH) {
  const reg = { conceptAlias: new Map(), skillAlias: new Map(), loaded: false };
  try {
    if (existsSync(path)) {
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
    }
  } catch { /* malformed registry → loaded stays false */ }
  return reg;
}
const EMPTY_REG = { conceptAlias: new Map(), skillAlias: new Map(), loaded: false };

const topicOf = (r, reg) => {
  const key = normText(r.concept);
  const map = r.track === "skill" ? reg.skillAlias : reg.conceptAlias;
  return map.has(key) ? map.get(key) : key;
};

function validRep(r) {
  return r && typeof r === "object"
    && typeof r.ts === "string" && !Number.isNaN(Date.parse(r.ts))
    && CONF.has(r.confidence)
    && typeof r.correct === "boolean"
    && typeof r.concept === "string" && r.concept.trim() !== ""
    && TRACKS.has(r.track);
}

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
// core
// ---------------------------------------------------------------------------
// qualifying misses for ONE topic's reps (ts order). axisEnabled gates axis capture.
function analyzeTopic(reps, axisEnabled) {
  const sorted = reps.slice().sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  let seenCorrect = false;
  const misses = [];   // { ts, type, axis }
  for (const r of sorted) {
    if (r.correct) { seenCorrect = true; continue; }
    const relapse = seenCorrect;
    const qualifies = relapse || r.confidence === "knew" || r.confidence === "shaky";
    if (!qualifies) continue;                       // guessed-wrong w/o relapse ⇒ FSRS's job, skip
    const type = relapse ? "relapse" : (r.confidence === "knew" ? "knew-wrong" : "shaky-wrong");
    const axis = (axisEnabled && r.track === "concept" && r.axis) ? r.axis : null;
    misses.push({ ts: r.ts, type, axis });
  }
  return { sorted, misses };
}

// LEGACY (frozen verbatim, layering rule): alphabetical-tiebreak "mode". ORGANISM audit
// #31 (2026-08-04) found this reports a WINNER where the data holds a TIE — the live
// hallucinations entry split its two misses a/c one apiece and the headline read
// "axis a keeps breaking", an accusation the receipts cannot support. Reference only;
// nothing on the run path calls it.
function modeAxisLegacy(misses) {
  const c = {};
  for (const m of misses) if (m.axis) c[m.axis] = (c[m.axis] || 0) + 1;
  const s = Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return s.length ? s[0][0] : null;
}

// per-axis tally for one topic's misses — the auditable half of the axis claim.
function axisCounts(misses) {
  const c = {};
  for (const m of misses) if (m.axis) c[m.axis] = (c[m.axis] || 0) + 1;
  return c;
}

// LIVE path: an axis is only "the axis that keeps breaking" if it STRICTLY out-counts
// every other axis. A 1-1 split names no opponent, so it reports null and the headline
// drops the axis clause rather than inventing a pattern. This never lowers a gate: it
// only refuses a claim the misses do not carry. axis_counts ships alongside so the
// split is visible instead of merely absent.
function modeAxis(misses) {
  const c = axisCounts(misses);
  const s = Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (!s.length) return null;
  if (s.length > 1 && s[1][1] === s[0][1]) return null;   // TIE ⇒ no single axis keeps breaking
  return s[0][0];
}

function isHealed(sorted, cfg) {
  const k = cfg.healed_clean_streak;
  if (sorted.length < k) return false;
  const lastK = sorted.slice(-k);
  const allClean = lastK.every((r) => r.correct);
  const noKnewWrong = lastK.every((r) => !(r.confidence === "knew" && !r.correct));
  return allClean && noKnewWrong;
}

function scoreOf(misses, nowMs, halflifeDays) {
  let s = 0;
  for (const m of misses) {
    // E2E audit 25 Jul 2026 (60e9b317): ageDays was UNCLAMPED, so a rep whose ts is in the
    // FUTURE gave a NEGATIVE age and 0.5^negative = 2^(|age|/halflife) — one rep a year ahead
    // scored ~2^36 ≈ 7e10 and owned "today's #1 to scout" forever, drowning every real miss.
    // That input is reachable: reps arrive as PASTED session JSON and capture.mjs validateRep
    // only checks ts is a non-empty string, so a Gem-emitted wrong YEAR flows straight through.
    // Clamp at 0 ⇒ a future / clock-skewed rep is scored as "just now" (weight 1), never more.
    const ageDays = Math.max(0, (nowMs - Date.parse(m.ts)) / 86400000);
    s += Math.pow(0.5, ageDays / halflifeDays);
  }
  return s;
}

// THE RECEIPT. ORGANISM audit #31 (2026-08-04).
// LEGACY (frozen verbatim, layering rule): day + type only. Live weaknesses.json shipped
// `["07-31 relapse","07-31 relapse"]` for TWO different reps ten minutes apart on TWO
// different axes (a at 14:36, c at 14:46) — a receipt that cannot tell its own entries
// apart cannot make "2× miss" auditable, and the per-miss axis survived NOWHERE else in
// the output (modeAxis collapses it). Reference only; nothing on the run path calls it.
function evidenceLineLegacy(m) { return `${localMmdd(m.ts)} ${m.type}`; }
// LIVE path: day + local clock time + the miss's own axis + type. Every field is already
// in the miss object (analyzeTopic pushes {ts,type,axis}); nothing new is measured, so
// this can never fabricate. A skill-track / registry-absent miss has no axis and simply
// omits the clause — it never prints "axis null".
function evidenceLine(m) {
  const when = `${localMmdd(m.ts)} ${localHhmm(m.ts)}`;
  return m.axis ? `${when} axis ${m.axis} ${m.type}` : `${when} ${m.type}`;
}

function headlineLine(e) {
  const ax = e.axis ? ` — axis ${e.axis} keeps breaking` : "";
  return `${e.recurrence}× miss on ${e.topic}${ax}. today's #1 to scout — drill it before it drills you.`;
}
function axisPatternNote(axis, concepts) {
  return `${concepts.length} concepts (${concepts.join(", ")}) all break on axis ${axis} — the pattern is the opponent, not the topic. scout the KIND of thinking.`;
}

// THE HAVE/NEED COUNTER — ORGANISM audit #100 + #106 (2026-08-04).
// The bare word "warming_up" told the captain nothing: not how far off the gate is, not
// whether it is moving, not what the gate even is. It reads as "come back later" when the
// truth is "9 of the 20 reps the AXIS-PATTERN ceiling needs — and the headline below is
// already live". The gate is NOT lowered here (axis_pattern still needs
// warming_up_min_reps); only its distance is now stated.
// `status` keeps its exact enum vocabulary — manager.mjs:159 matches `status === "ok"`
// verbatim, and the trap list is explicit that pattern-matched vocabularies must not be
// re-spelled. The counter rides ALONGSIDE it as gate{} + status_line.
function gateOf(N, cfg) {
  const need = cfg.warming_up_min_reps;
  const met = N >= need;
  const head = N === 0 ? "awaiting_data" : met ? "ok" : "warming_up";
  return {
    gate: { reps_have: N, reps_need: need, met, short_by: met ? 0 : need - N },
    status_line: met
      ? `${head} — ${N}/${need} reps (axis-pattern gate met)`
      : `${head} — ${N}/${need} reps toward the axis-pattern gate${N > 0 ? "; the headline below is live from rep 1" : ""}`,
  };
}

function compute(reps, cfg, reg, now) {
  const N = reps.length;
  const date = localDate(now);
  const generated_at = new Date(now).toISOString();
  const nowMs = now instanceof Date ? now.getTime() : now;
  if (N === 0) {
    return { date, status: "awaiting_data", ...gateOf(0, cfg), low_confidence: true, headline: null, axis_pattern: null, weaknesses: [], total_reps: 0, generated_at };
  }

  // group by TRACK + topic.
  // E2E audit 25 Jul 2026 (540b2b43): this keyed on the topic NAME alone, but concepts.json
  // keeps concepts{} and skills{} as SEPARATE namespaces (and unregistered concept reps fall
  // back to the raw string), so the same word on both tracks — skill "parsers" in Colab vs a
  // concept-track Gem question on parsers — collapsed into ONE bucket. That fused timeline
  // INVENTED relapses across tracks (correct on the skill → wrong on the concept read as a
  // relapse) and stamped the entry with whichever track's rep happened to arrive first, which
  // then decided axis-eligibility. Separate namespaces ⇒ separate weaknesses.
  const byTopic = new Map();
  for (const r of reps) {
    const topic = topicOf(r, reg);
    const key = `${r.track}\u0000${topic}`;   // NUL join: no normalized topic can contain it
    if (!byTopic.has(key)) byTopic.set(key, { reps: [], track: r.track, topic });
    byTopic.get(key).reps.push(r);
  }

  let entries = [];
  for (const g of byTopic.values()) {
    const topic = g.topic;
    const { sorted, misses } = analyzeTopic(g.reps, reg.loaded);
    if (!misses.length) continue;                    // no qualifying miss ⇒ not a weakness (never fabricate)
    const healed = isHealed(sorted, cfg);
    const lastTs = misses[misses.length - 1].ts;
    entries.push({
      id: slugify(topic), topic,
      recurrence: misses.length,                     // RAW int
      last_seen: localIsoDate(lastTs),               // LOCAL day (audit 5de388f9), not the UTC slice
      status: healed ? "closed" : "open",
      evidence: misses.map(evidenceLine),             // audit #31: day + time + axis + type
      axis: modeAxis(misses),                         // null for skill / no-axis / registry-absent / TIE
      axis_counts: axisCounts(misses),                // audit #31: the split behind `axis` (may be {})
      score: round(scoreOf(misses, nowMs, cfg.recency_halflife_days)),
      _track: g.track,
      _last_ts: lastTs,                               // raw ts kept for time math (see prune below)
    });
  }

  // prune long-stale CLOSED entries (open never pruned).
  // Audit 25 Jul 2026 (5de388f9): this re-parsed last_seen as a bare date = UTC midnight, which
  // is a different instant from the rep itself and now that last_seen is LOCAL would drift by an
  // offset. Age the entry off its raw miss ts — the only unambiguous instant we hold.
  entries = entries.filter((e) => e.status !== "closed" || (nowMs - Date.parse(e._last_ts)) / 86400000 <= cfg.closed_prune_days);

  // id de-collision (audit 25 Jul 2026 · 540b2b43, consequence of splitting the tracks): ids stay
  // the bare topic slug — STABLE — unless the SAME topic now exists on both tracks. Then the
  // concept-track entry keeps the bare id ("concept" < "skill") and the other takes a track suffix,
  // so weaknesses[] can never ship two rows the Manager would resolve to one id.
  const takenIds = new Set();
  for (const e of entries.slice().sort((a, b) => a.id.localeCompare(b.id) || a._track.localeCompare(b._track) || a.topic.localeCompare(b.topic))) {
    if (!takenIds.has(e.id)) { takenIds.add(e.id); continue; }
    let cand = `${e.id}-${e._track}`, n = 2;
    while (takenIds.has(cand)) cand = `${e.id}-${e._track}-${n++}`;   // paranoia: two topics slugging alike on one track
    e.id = cand; takenIds.add(cand);
  }

  // envelope health
  const status = N < cfg.warming_up_min_reps ? "warming_up" : "ok";
  const low_confidence = status !== "ok";

  // headline = highest-score OPEN weakness (floor signal; bias-to-silence ⇒ null if none)
  const open = entries.filter((e) => e.status === "open").sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const headline = open.length ? { id: open[0].id, topic: open[0].topic, axis: open[0].axis, one_line: headlineLine(open[0]) } : null;

  // axis_pattern = CEILING — volume-gated (total_reps ≥ warming_up_min_reps) + ≥ min distinct concepts on one axis
  let axis_pattern = null;
  if (N >= cfg.warming_up_min_reps) {
    const byAxis = new Map();
    for (const e of open) if (e._track === "concept" && e.axis) {
      if (!byAxis.has(e.axis)) byAxis.set(e.axis, new Set());
      byAxis.get(e.axis).add(e.topic);
    }
    let best = null;
    for (const [ax, set] of byAxis) {
      const cnt = set.size;
      if (cnt >= cfg.axis_cluster_min_concepts && (!best || cnt > best.cnt || (cnt === best.cnt && ax < best.axis))) {
        best = { axis: ax, cnt, concepts: [...set].sort() };
      }
    }
    if (best) axis_pattern = { axis: best.axis, concepts: best.concepts, strength: best.cnt, note: axisPatternNote(best.axis, best.concepts) };
  }

  // final weaknesses[]: open-first, then score desc — strip internal _track
  const weaknesses = entries
    .sort((a, b) => (a.status === "open" ? 0 : 1) - (b.status === "open" ? 0 : 1) || b.score - a.score || a.id.localeCompare(b.id))
    .map((e) => ({ id: e.id, topic: e.topic, recurrence: e.recurrence, last_seen: e.last_seen, status: e.status, evidence: e.evidence, axis: e.axis, axis_counts: e.axis_counts, score: e.score }));

  return { date, status, ...gateOf(N, cfg), low_confidence, headline, axis_pattern, weaknesses, total_reps: N, generated_at };
}

// ---------------------------------------------------------------------------
// selftest — baked mocks (no real state touched)
// ---------------------------------------------------------------------------
function selftest() {
  const cfg = loadConfig("__no_such_config__");    // ⇒ DEFAULTS
  const REG = { conceptAlias: new Map(), skillAlias: new Map(), loaded: true };   // axis authority present
  const now = new Date(2026, 7, 1, 12, 0, 0);
  const nowIso = "2026-08-01T09:00:00Z";
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  let T = 0;
  const at = (day) => new Date(Date.parse("2026-07-01T00:00:00Z") + day * 86400000 + (T++) * 60000).toISOString();
  const mk = (o) => ({ ts: o.ts || at(o.day ?? 0), surface: o.track === "skill" ? "colab" : "gem", track: o.track || "concept", concept: o.concept, axis: ("axis" in o) ? o.axis : (o.track === "skill" ? null : "a"), question: o.q || `q${T}`, confidence: o.confidence || "knew", correct: !!o.correct });
  const find = (w, id) => w.weaknesses.find((e) => e.id === id);

  // 1) empty-safe
  const e0 = compute([], cfg, REG, now);
  assert("empty-safe: awaiting_data, weaknesses [], headline null", e0.status === "awaiting_data" && e0.weaknesses.length === 0 && e0.headline === null);

  // 2) relapse vs never-learned
  const m2 = [
    mk({ concept: "relapser", confidence: "shaky", correct: true, day: 0 }), mk({ concept: "relapser", confidence: "guessed", correct: false, day: 5 }), // correct→wrong = relapse
    ...[0, 1, 2].map((d) => mk({ concept: "neverlearned", confidence: "guessed", correct: false, day: d })), // always guessed-wrong ⇒ NOT (FSRS's)
  ];
  const r2 = compute(m2, cfg, REG, now);
  assert("relapse qualifies; always-guessed-wrong does NOT (FSRS)", !!find(r2, "relapser") && !find(r2, "neverlearned"));

  // 3) confident-wrong (knew+wrong, no prior) qualifies
  assert("confident-wrong (knew+wrong) qualifies", !!find(compute([mk({ concept: "cw", confidence: "knew", correct: false })], cfg, REG, now), "cw"));
  // 4) shaky-wrong qualifies
  assert("shaky-wrong qualifies (Calibration-excluded lands here)", !!find(compute([mk({ concept: "sw", confidence: "shaky", correct: false })], cfg, REG, now), "sw"));
  // 5) guessed-wrong-only does NOT
  assert("guessed-wrong-only does NOT qualify", !find(compute([mk({ concept: "gw", confidence: "guessed", correct: false })], cfg, REG, now), "gw"));

  // 6) recency-weighting: equal recurrence, recent out-ranks old (headline by score)
  const m6 = [
    mk({ concept: "recent", confidence: "knew", correct: false, ts: "2026-07-30T09:00:00Z" }), mk({ concept: "recent", confidence: "knew", correct: false, ts: "2026-07-31T09:00:00Z" }),
    mk({ concept: "oldone", confidence: "knew", correct: false, ts: "2026-06-01T09:00:00Z" }), mk({ concept: "oldone", confidence: "knew", correct: false, ts: "2026-06-02T09:00:00Z" }),
  ];
  const r6 = compute(m6, cfg, REG, now);
  assert("recency-weighting: recent out-ranks equal-count old (headline)", r6.headline?.topic === "recent" && find(r6, "recent").recurrence === 2 && find(r6, "oldone").recurrence === 2);

  // 7) id-stability across recomputes
  const idA = compute(m6, cfg, REG, now).weaknesses.find((e) => e.topic === "recent").id;
  const idB = compute(m6, cfg, REG, now).weaknesses.find((e) => e.topic === "recent").id;
  assert("id-stability: same topic ⇒ same slug id", idA === "recent" && idA === idB);

  // 8) recurrence RAW int, score separate float
  const e8 = find(r6, "recent");
  assert("recurrence is RAW int; score is a separate weighted float", Number.isInteger(e8.recurrence) && e8.recurrence === 2 && typeof e8.score === "number" && Math.abs(e8.score - e8.recurrence) > 1e-9);

  // 9) axis-cluster: 3 concepts on axis e ⇒ axis_pattern=e strength 3; mixed ⇒ null
  const relOn = (c, ax) => [mk({ concept: c, axis: ax, confidence: "knew", correct: true, day: 0 }), mk({ concept: c, axis: ax, confidence: "shaky", correct: false, day: 3 })];
  const filler = Array.from({ length: 14 }, (_, i) => mk({ concept: "filler", axis: "a", confidence: "knew", correct: true, day: 10 + i }));
  const clusterE = [...relOn("tokenization", "e"), ...relOn("chunking", "e"), ...relOn("retrieval", "e"), ...filler]; // N=20
  const r9 = compute(clusterE, cfg, REG, now);
  assert("axis-cluster: 3 concepts on e ⇒ axis_pattern e, strength 3", r9.axis_pattern?.axis === "e" && r9.axis_pattern?.strength === 3 && r9.axis_pattern.concepts.length === 3);
  const mixed = [...relOn("tokenization", "e"), ...relOn("chunking", "f"), ...relOn("retrieval", "c"), ...filler];
  assert("axis-cluster: mixed axes ⇒ axis_pattern null", compute(mixed, cfg, REG, now).axis_pattern === null);

  // 10) axis_pattern volume-gated (total_reps < warming_up_min_reps ⇒ null even with a cluster)
  const clusterNoVol = [...relOn("tokenization", "e"), ...relOn("chunking", "e"), ...relOn("retrieval", "e")]; // N=6 < 20
  assert("axis_pattern volume-gated: N<min_reps ⇒ null", compute(clusterNoVol, cfg, REG, now).axis_pattern === null);

  // 11) skill relapse ⇒ weakness, axis null, never in axis_pattern
  const r11 = compute([...clusterE, mk({ concept: "async", track: "skill", confidence: "knew", correct: true, day: 0 }), mk({ concept: "async", track: "skill", confidence: "shaky", correct: false, day: 4 })], cfg, REG, now);
  assert("skill relapse ⇒ weakness (axis null), not in axis_pattern", find(r11, "async")?.axis === null && !(r11.axis_pattern?.concepts || []).includes("async"));

  // 12) healed ⇒ status closed, retained, off headline
  const m12 = [
    mk({ concept: "healed", confidence: "knew", correct: true, day: 0 }), mk({ concept: "healed", confidence: "shaky", correct: false, day: 2 }), // relapse
    mk({ concept: "healed", confidence: "knew", correct: true, day: 5 }), mk({ concept: "healed", confidence: "knew", correct: true, day: 6 }), mk({ concept: "healed", confidence: "knew", correct: true, day: 7 }), // last 3 clean
  ];
  const r12 = compute(m12, cfg, REG, now);
  assert("healed ⇒ status closed, retained, not headline", find(r12, "healed")?.status === "closed" && r12.headline?.topic !== "healed");

  // 13) single-focus: one headline object (or null)
  assert("single-focus: exactly one headline object", r9.headline && typeof r9.headline === "object" && "id" in r9.headline);

  // 14) receipts non-empty — AND DISTINGUISHABLE (ORGANISM audit #31, 2026-08-04).
  //     The old assertion only checked length > 0, which is why the live file could ship
  //     ["07-31 relapse","07-31 relapse"] for two different reps on two different axes and
  //     stay green. A receipt whose entries cannot be told apart is not a receipt.
  assert("receipts: every real entry has non-empty evidence[]", r9.weaknesses.length > 0 && r9.weaknesses.every((e) => Array.isArray(e.evidence) && e.evidence.length > 0));
  assert("receipts: one receipt per miss (recurrence and evidence[] never disagree)",
    r9.weaknesses.every((e) => e.evidence.length === e.recurrence));
  {
    // the exact live shape: same topic, same LOCAL day, two misses ten minutes apart on
    // two different axes. Under the old template both rendered "07-31 relapse".
    const sameDay = compute([
      mk({ concept: "hallucinations", axis: "a", confidence: "knew", correct: true,  ts: "2026-07-30T21:58:00Z" }),
      mk({ concept: "hallucinations", axis: "a", confidence: "knew", correct: false, ts: "2026-07-31T14:36:00Z" }),
      mk({ concept: "hallucinations", axis: "c", confidence: "knew", correct: false, ts: "2026-07-31T14:46:00Z" }),
    ], cfg, REG, now);
    const ev = find(sameDay, "hallucinations").evidence;
    assert("receipts: two same-day misses on DIFFERENT axes render as DIFFERENT strings",
      ev.length === 2 && new Set(ev).size === 2 && ev.every((s) => /axis [a-i]/.test(s)) && ev.some((s) => /axis a /.test(s)) && ev.some((s) => /axis c /.test(s)));
    assert("receipts carry the miss's own clock time, not just the day",
      ev.every((s) => /^\d{2}-\d{2} \d{2}:\d{2} /.test(s)) && new Set(ev.map((s) => s.slice(0, 11))).size === 2);
    // ...and the axis claim above them stops being a coin-flip: 1-1 is a TIE, not a mode.
    assert("a 1-1 axis split reports NO single axis (was: alphabetical winner 'a keeps breaking')",
      find(sameDay, "hallucinations").axis === null && !/axis .* keeps breaking/.test(sameDay.headline.one_line));
    assert("...and the split itself is shown, not merely withheld",
      JSON.stringify(find(sameDay, "hallucinations").axis_counts) === JSON.stringify({ a: 1, c: 1 }));
    assert("the frozen legacy mode still picks the alphabetical winner (the bug, preserved)",
      modeAxisLegacy([{ axis: "a" }, { axis: "c" }]) === "a");
    // a genuine majority still names its opponent
    const major = compute([
      mk({ concept: "majority", axis: "a", confidence: "knew", correct: false, ts: "2026-07-31T10:00:00Z" }),
      mk({ concept: "majority", axis: "a", confidence: "knew", correct: false, ts: "2026-07-31T11:00:00Z" }),
      mk({ concept: "majority", axis: "c", confidence: "knew", correct: false, ts: "2026-07-31T12:00:00Z" }),
    ], cfg, REG, now);
    assert("a STRICT majority axis is still named (the fix refuses ties, not evidence)",
      find(major, "majority").axis === "a");
  }

  // 14b) THE HAVE/NEED COUNTER (ORGANISM audit #100/#106) — the gate's distance is stated,
  //      the gate itself is unchanged, and the headline is live below it from rep 1.
  {
    const one = compute([mk({ concept: "firstrep", confidence: "knew", correct: false })], cfg, REG, now);
    assert("audit #100: nemesis speaks from rep 1 — a headline exists at n=1", one.headline !== null && one.total_reps === 1);
    assert("audit #106: the status line is a have/need counter, never a bare gate word",
      /\b1\/20 reps\b/.test(one.status_line) && one.gate.reps_have === 1 && one.gate.reps_need === cfg.warming_up_min_reps && one.gate.short_by === 19);
    assert("the gate is NOT lowered — axis_pattern still withheld below min_reps", one.axis_pattern === null && one.status === "warming_up");
    assert("gate.met flips only at the real threshold (r9 has N=20)", r9.gate.met === true && r9.gate.short_by === 0 && /20\/20 reps/.test(r9.status_line));
    assert("the empty envelope also counts, never a bare 'awaiting_data'",
      e0.gate.reps_have === 0 && /0\/20 reps/.test(e0.status_line));
  }

  // 15) schema: canonical keys present + typed
  const s = find(r9, "tokenization");
  assert("schema: {id,topic,recurrence,last_seen,status,evidence[]} present", typeof s.id === "string" && typeof s.topic === "string" && Number.isInteger(s.recurrence) && /^\d{4}-\d{2}-\d{2}$/.test(s.last_seen) && ["open", "closed"].includes(s.status) && Array.isArray(s.evidence));

  // 16) concepts.json absent ⇒ raw topic + axis null
  const r16 = compute([...relOn("tokenization", "e"), ...relOn("chunking", "e"), ...relOn("retrieval", "e"), ...filler], cfg, EMPTY_REG, now);
  assert("concepts.json absent ⇒ axis null + no axis_pattern", find(r16, "tokenization")?.axis === null && r16.axis_pattern === null);

  // --- E2E audit 25 Jul 2026 regressions -----------------------------------
  // 17) tracks are SEPARATE namespaces (540b2b43). Old grouping keyed on the topic name only,
  //     so these two reps fused into one bucket: one entry, recurrence 2, track of whoever
  //     landed first. Now: two entries, one miss each, the concept one axis-eligible.
  const m17 = [
    mk({ concept: "parsers", track: "skill",   confidence: "knew", correct: false, day: 0 }),
    mk({ concept: "parsers", track: "concept", confidence: "knew", correct: false, day: 3 }),
  ];
  const p17 = compute(m17, cfg, REG, now).weaknesses.filter((e) => e.topic === "parsers");
  assert("track-split: same topic on both tracks ⇒ TWO entries, distinct ids, neither inflated",
    p17.length === 2 && new Set(p17.map((e) => e.id)).size === 2 && p17.every((e) => e.recurrence === 1)
    && !!p17.find((e) => e.axis === "a") && !!p17.find((e) => e.axis === null));

  // 17b) and the fused timeline INVENTED relapses: a correct Colab skill rep used to make the
  //      later concept miss read as "relapse". It is a plain knew-wrong — different namespace.
  const c17 = compute([
    mk({ concept: "parsers", track: "skill",   confidence: "knew", correct: true,  day: 0 }),
    mk({ concept: "parsers", track: "concept", confidence: "knew", correct: false, day: 3 }),
  ], cfg, REG, now).weaknesses.filter((e) => e.topic === "parsers");
  assert("track-split: a skill-track correct never fabricates a concept-track relapse",
    c17.length === 1 && c17[0].evidence[0].endsWith("knew-wrong"));

  // 18) future-dated ts cannot hijack the headline (60e9b317). Unclamped, this single miss
  //     scored 0.5^(-351/10) ≈ 2^35 and buried a real five-miss grind forever.
  const r18 = compute([
    mk({ concept: "futurerep", confidence: "knew", correct: false, ts: "2027-07-18T09:00:00Z" }),
    ...[0, 1, 2, 3, 4].map((d) => mk({ concept: "realgrind", confidence: "knew", correct: false, ts: new Date(Date.parse("2026-07-25T09:00:00Z") + d * 86400000).toISOString() })),
  ], cfg, REG, now);
  assert("future-dated ts is clamped: one bad-year rep cannot out-score a real recurrence",
    r18.headline?.topic === "realgrind" && find(r18, "futurerep").score <= 1 + 1e-9);

  // 19) date labels are LOCAL, not the UTC slice (5de388f9). Two boundary reps: 23:30Z lands on
  //     the NEXT local day east of UTC (the captain's IST 00:00–05:29 window — where his real
  //     reps live), 00:30Z on the PREVIOUS local day west of it. Discriminates in any non-UTC
  //     zone; on a box literally set to UTC the two labellings are identical by definition.
  const lateNight = "2026-07-17T23:30:00Z", earlyAm = "2026-07-17T00:30:00Z";
  const r19 = compute([
    mk({ concept: "latenight", confidence: "knew", correct: false, ts: lateNight }),
    mk({ concept: "earlyam",   confidence: "knew", correct: false, ts: earlyAm }),
  ], cfg, REG, now);
  const expLate = localDate(new Date(Date.parse(lateNight))), expEarly = localDate(new Date(Date.parse(earlyAm)));
  // (evidence[] now carries day + LOCAL clock time + axis + type — audit #31 — so the
  //  expected string is rebuilt from the same local clock rather than pinned to a literal.)
  const expLateHm = localHhmm(lateNight);
  assert("local-date: last_seen + evidence use the rep's LOCAL day, not the UTC slice of ts",
    find(r19, "latenight").last_seen === expLate && find(r19, "earlyam").last_seen === expEarly
    && find(r19, "latenight").evidence[0] === `${expLate.slice(5)} ${expLateHm} axis a knew-wrong`);

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
  const cfg = loadConfig();
  const reg = loadRegistry();
  const reps = loadReps(REPS_LOG);
  const out = compute(reps, cfg, reg, new Date());
  writeAtomic(WEAK, out);
  const hl = out.headline ? out.headline.topic : "-";
  const ap = out.axis_pattern
    ? `axis ${out.axis_pattern.axis}×${out.axis_pattern.strength}`
    : `- (needs ${out.gate.reps_have}/${out.gate.reps_need} reps)`;   // audit #106: have/need, never a bare gate word
  console.log(`nemesis: ${out.status_line} — weaknesses ${out.weaknesses.length} · headline ${hl} · axis_pattern ${ap}  →  ${WEAK}`);
  process.exit(0);
}

// Windows-safe entry guard (like fsrs.mjs / calibration.mjs)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { compute, analyzeTopic, isHealed, scoreOf, loadReps, loadConfig, loadRegistry, topicOf, slugify,
  // audit #31/#100/#106 (2026-08-04): receipt builder + axis mode + the have/need counter,
  // with both retired engines kept beside their replacements (layering law).
  evidenceLine, evidenceLineLegacy, modeAxis, modeAxisLegacy, axisCounts, gateOf };
