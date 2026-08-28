#!/usr/bin/env node
// ============================================================================
// gate.mjs · ARSENAL AI FC — THE GATE (consumption-gated spend, two-way, automatic)
//   ORGANISM_OVERHAUL__2026-08-18.md §5 · LAW L5. Built 18 Aug 2026 on his word
//   ("should we not kill anything … everything works correctly from now onwards
//   universally"). This file REPLACES every "sleep list" and "kill list", forever.
// ----------------------------------------------------------------------------
// THE RULE, ONE SENTENCE (§5.1):
//   An LLM lane runs iff (E) its required evidence exists, (C) its output has been
//   CONSUMED-BY-HIM within `window_days` or it is event-driven, and (F) it has not
//   failed `fail_streak` consecutive times; otherwise it is ASLEEP; an asleep lane
//   re-checks every scheduled slot and WAKES ITSELF the moment E∧C∧¬F holds again.
//
// WHY A HELPER AND NOT A LIST. On 18 Aug 2026 `brain status` showed 11 jobs billed
// on absent evidence (teamtalk_am 15/15 runs without season.json, dreams 19/20) and
// 10 on half-eaten inputs, ~90% of 6.12 crore tokens/week in the dark lane, ~0%
// reaching his ear. The natural repair is a list of organs to switch off — and a
// list is wrong IN KIND: those organs were starved of real data during the testing
// phase, not broken. The moment he does one /full-time or one real sitting, they
// have their evidence again and must come back on their own, with nobody editing a
// list. So the decision is a FUNCTION of the live evidence, never a table.
//
// PURE BY DESIGN. `decide()` takes every fact as an argument and returns a verdict;
// it opens no file, spawns nothing, and knows no clock but the `now` it is handed —
// which is what lets brain.mjs, nightshift.mjs and dmn.mjs share ONE definition of
// "asleep" and lets this selftest run without a live ledger. The two read helpers
// at the bottom (`consumptionOf`, `failStreakOf`) are pure folds over rows the
// caller has already read; the only I/O in this file is `readJsonl`, a convenience
// for callers, and it READS. THIS ORGAN WRITES NOTHING. The journal
// (brain_out/gate.jsonl), the consumption lane (consumption.jsonl) and the card
// belong to brain.mjs and captains_call.mjs — owners-only, unchanged.
//
// THRESHOLD CLASSES (§5.4, his 1 Aug + 13 Aug rulings): `window_days` and
// `fail_streak` are GUARDS and WINDOWS, never budgets and never calendar gates —
// a window says "consumed within N days counts", a guard stops one identical
// failure repeating. Neither waits for calendar time before letting a lane run:
// a lane with evidence and a first run has NEVER been asleep. Both defaults are
// provisional per the DAY-0 LAW; Block 9 sets them from seven real days of data.
//
// WHO ELSE COULD ACT ON THIS OUTPUT? brain.mjs (tick filters eligible jobs through
//   it; journals transitions; files the one card; `gate` CLI) · nightshift.mjs (per
//   lane, before spending) · dmn.mjs (evidence = real reps/rounds) · reconcile.mjs
//   (an asleep lane is resting by rule, not lying dead) · watchman.mjs
//   (gate-asleep INFO · gate-stuck RED).
// CLI: node scripts/gate.mjs [selftest]
// ============================================================================
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { laneRows as registryLaneRows } from "./registry.mjs";   // S10 FOLD — the consumer map's rows live in the registry proper

// ── DEFAULTS — three optional fields per job; absent = these (§5.3: no config
// edit is required to start) ─────────────────────────────────────────────────
export const GATE_DEFAULTS = Object.freeze({
  window_days: 14,          // WINDOW: consumed-by-him inside this ⇒ C holds (Block 9 re-fits from data)
  fail_streak: 5,           // GUARD: this many consecutive failures ⇒ F blocks until a wake or a success
  event: null,              // EVENT-DRIVEN: "lock" | "fulltime" | "sitting_close" | "missions_ingest" | "gem_sync" | … ⇒ C holds by construction
  consumers: [],            // explicit downstream jobs whose consumption counts as this job's (transitive C)
});
// THE CLOSED SET (§5.2). A caller cannot invent a new way of "reaching him" without changing the
// law HERE, in the one place it is written — which is why the two below are an edit to this line
// and not a string passed in from somewhere else.
//
// LOAD ZERO BLOCK 6 (19 Aug 2026) — `delivered` · `acked`. THE ROAD BECAME VISIBLE.
//   BLOCK 3 built the outbox: a producer never delivers, the relay is the only thing that reaches
//   him. But this file knew nothing about it — measured 19 Aug, `grep -c outbox gate.mjs` = 0 — so
//   a lane whose material the relay had ALREADY PUT IN FRONT OF HIM still failed C on "never
//   consumed by him since the lane began" and minted a card saying so. That is not a hypothetical:
//   outbox row omsz5p4c87w (produced_by brain:gaffer_claim_audit) was delivered via dugout at
//   2026-08-18T21:10:02.597Z, and card c74 was minted at 21:40:01.491Z saying nothing of that lane
//   ever reached him. THIRTY MINUTES. Six of the 28 open cards were that class.
//   `delivered` = the relay stamped the row onto a surface AS THAT SURFACE WAS BEING RENDERED to
//   him (relay() is called by the renderer, not by a daemon — that is what makes the stamp mean
//   "he was shown it" and not merely "it was queued"). It is the SAME standard as `briefed`, which
//   is already 153 of the 189 live consumption rows.
//   `acked` = he acted on it. Strictly stronger, and preferred when both exist.
// WHY THIS IS NOT THE WEAK-SIGNAL MISTAKE THE ORGANISM ALREADY REVERSED ONCE: brain.mjs's
//   mouthConsumption header records that counting "an mp3 ANNOUNCED inside a sent push" was weighed
//   and REVERSED — an announcement that a thing exists is not the thing in his ear. The difference
//   is exact: an announcement names an artifact he must then go and open; a delivered outbox row
//   CARRIES its own subject line and is rendered in full on the surface he is looking at. Nothing
//   is left for him to go and fetch. If a future surface ever relays without rendering, that
//   surface — not this list — is the defect.
export const CONSUMPTION_KINDS = Object.freeze(["spoken", "sat", "briefed", "carded", "opened", "pushed", "delivered", "acked"]);

// ── THE DECLARED CONSUMERS TABLE (rung S7, 28 Aug 2026 — HIS §1 CORRECTION, built) ──────────
// HIS WORDS, 19 Aug 2026: "the test shouldn't be 'did it reach HIM' but 'did it reach its right
// consumer, wherever that is in the organism' — useful things reach him usefully, everything else
// reaches whatever organ needs it."
//
// WHAT WAS ACTUALLY WRONG, measured before this was built (28 Aug 2026, not inherited):
//   `decide()` printed ONE sentence for every C failure — "never consumed by him since the lane
//   began (it has run, and nothing of it reached his ear, brief, card or eye)". For `dmn`, whose
//   material is eaten by thalamus.mjs and never by him, that sentence is FALSE ABOUT THE RIGHT
//   PARTY: it accuses him of not reading a thing that was never for him. And nothing anywhere
//   DECLARED who the right party was, so no verdict could name which consumer went quiet.
//   The audit order's §1 also predicted "the lanes whose right consumer IS another organ have no
//   way to pass C". Re-measured live at this rung, that half is TOO STRONG and is corrected here:
//   `ns_pre_answers` PASSES C today (4 thalamus rows, newest 1.5d) because `consumptionOf` folds
//   any row for the lane regardless of who stamped it. The defect was never the arithmetic — it
//   was that the arithmetic had no declaration to check itself against, and so lied in words.
//
// THE LAW THIS BUILDS (§1 of the audit order, verbatim):
//   Every lane declares its RIGHT CONSUMER — him, or a named organ. C holds when THAT consumer
//   consumed it. A lane whose consumer is an organ is never judged by whether it reached him.
//   RATCHET: no lane may run without a declared consumer; a lane whose declared consumer has not
//   consumed inside the window sleeps, and the card names WHICH consumer went quiet.
//
// ONE JUDGEMENT MADE HERE, RECORDED SO IT CAN BE REVERSED IN ONE PREDICATE (`consumerSatisfied`):
//   for an ORGAN-declared lane, a him-side consumption row STILL satisfies C. §1's last sentence
//   removes the him-TEST from organ lanes; it does not make reaching him a disqualification.
//   Reading it as exclusive was tried against the live data first and REFUSED: `night_coach`
//   (surface names setpiece.mjs) and `intent_digest` (surface names intent.mjs) are both stamped
//   `briefed` by learnstate's SessionStart brief — they demonstrably reach him — and an exclusive
//   reading puts both to sleep for "setpiece.mjs has not consumed it". That is the c74
//   false-negative class this organism already reversed once (see outboxConsumption in brain.mjs),
//   re-created on purpose. Reaching him is the terminal purpose of every chain; it is never worth
//   less than reaching the organ in the middle of it.
//
// WHY THE TABLE IS SMALL, AND WHY THAT IS THE POINT (§2's disease — the twin copy):
//   every lane the gate judges ALREADY declares its consumer, in its own row, as `surface`
//   (brain_config's 34 jobs; nightshift's NS_GATE; dmn's and selfknowledge's call sites). Copying
//   those declarations into a second table here would BE the disease this order exists to kill.
//   So the table holds rows ONLY for lanes that declare no surface anywhere — which is exactly
//   `outbox.LANES_NOT_IN_CONFIG`, the list §1 identified as "really a CONSUMER MAP". It MOVES
//   here (outbox re-exports a derived view; the prose is preserved to the byte) rather than being
//   copied. S10 folds these rows into the registry proper as `right_consumer`; S7 never waits.
export const CONSUMER_KINDS = Object.freeze(["him", "organ", "job"]);

// S10 FOLD: the rows below MOVED to the registry proper (registry.json `lanes`
// table — consumers as a SET, each with its own read-stamp, and a reach policy,
// per the pre-open ruling R1; every policy seeded "any" = the measured semantics,
// so no verdict moved). This export is now a DERIVED view over the registry —
// same shape, same keys, why-prose byte-preserved — exactly as this table itself
// was outbox's list moved here at S7. The literal object below is FROZEN as the
// S7 layer (L9) and doubles as the drift-lock fixture: the selftest asserts the
// registry-derived view and this frozen layer can never disagree.
// S10-F (29 Aug 2026): the registry's `lanes` table is WIDER than this map now. It also
// holds lanes whose consumer is declared SOMEWHERE ELSE — night_coach at its own call site
// (brain_config surface.where), brain_ledger in the IR as a shared append ledger. This table
// is, by its own definition above, the FALLBACK for lanes that declare nothing anywhere, so
// the derived view SELECTS: a row that names WHERE it is declared is not an off-road row.
// The selection is the row's own field, never a list kept here — a second list is exactly
// the twin-copy disease this fold exists to end.
function laneConsumersFromRegistry() {
  const all = registryLaneRows();
  if (!all.length) throw new Error("gate: the registry lanes table is EMPTY/unreachable — the consumer map cannot be derived; seed registry.json (S10) before any lane is judged");
  const rows = all.filter((r) => !r.declared_elsewhere);
  return Object.freeze(Object.fromEntries(rows.map((r) => [r.subject, Object.freeze({
    subject: r.subject, schema_owner: r.schema_owner,
    right_consumer: Object.freeze({
      kind: r.consumer_kind || ((r.consumers || []).some((c) => c && c.kind === "him") ? "him" : "organ"),
      names: Object.freeze((r.consumers || []).filter((c) => c && c.name).map((c) => c.name)),
      ...(r.consumer_retired ? { retired: true } : {}),
    }),
    witness: r.witness, why: r.why,
  })])));
}
export const LANE_CONSUMERS = laneConsumersFromRegistry();
export const LANE_CONSUMERS_S7_LAYER = Object.freeze({
  dmn_rollout:          { subject: "dmn_rollout",          schema_owner: "dmn.mjs",           right_consumer: { kind: "organ", names: ["dmn.mjs", "physio.mjs", "council.mjs"] }, witness: "scripts/outbox.mjs LANES_NOT_IN_CONFIG (moved here at S7)", why: "feeds dmn.mjs / physio.mjs / council.mjs — the default-mode rollout, never a file he opens" },
  dmn_counter:          { subject: "dmn_counter",          schema_owner: "dmn.mjs",           right_consumer: { kind: "organ", names: ["dmn.mjs", "council.mjs"] },               witness: "scripts/outbox.mjs LANES_NOT_IN_CONFIG (moved here at S7)", why: "feeds dmn.mjs / council.mjs — the counter behind the rollout" },
  ns_probe_bank:        { subject: "ns_probe_bank",        schema_owner: "nightshift.mjs",    right_consumer: { kind: "organ", names: ["nightshift.mjs", "dugout.mjs"] },          witness: "scripts/nightshift.mjs NS_GATE.ns_probe_bank.surface",      why: "feeds nightshift.mjs / dugout.mjs — he meets it AS a scrimmage, and dugout stamps its consumption" },
  ns_distractors:       { subject: "ns_distractors",       schema_owner: "nightshift.mjs",    right_consumer: { kind: "organ", names: ["nightshift.mjs", "dugout.mjs"] },          witness: "scripts/nightshift.mjs NS_GATE.ns_distractors.surface",     why: "feeds nightshift.mjs / dugout.mjs — he meets it inside get_rejirah, which stamps its consumption" },
  ns_pre_answers:       { subject: "ns_pre_answers",       schema_owner: "nightshift.mjs",    right_consumer: { kind: "organ", names: ["thalamus.mjs", "dugout.mjs"] },            witness: "consumption.jsonl — 4 rows stamped by thalamus, newest 2026-08-26", why: "feeds thalamus.mjs / dugout.mjs — pre-answers for the mouth, never read as a file" },
  ns_grade_probes:      { subject: "ns_grade_probes",      schema_owner: "nightshift.mjs",    right_consumer: { kind: "organ", names: ["nightshift.mjs"] },                        witness: "scripts/outbox.mjs LANES_NOT_IN_CONFIG (moved here at S7)", why: "feeds nightshift.mjs — the shift grades its own probes" },
  cortex_wake:          { subject: "cortex_wake",          schema_owner: "cortex.mjs",        right_consumer: { kind: "organ", names: ["cortex.mjs", "council.mjs"] },             witness: "scripts/outbox.mjs LANES_NOT_IN_CONFIG (moved here at S7)", why: "feeds cortex.mjs / council.mjs — a wake is machinery, not a message" },
  cortex_consolidate:   { subject: "cortex_consolidate",   schema_owner: "cortex.mjs",        right_consumer: { kind: "organ", names: ["cortex.mjs", "nightshift.mjs"] },          witness: "scripts/outbox.mjs LANES_NOT_IN_CONFIG (moved here at S7)", why: "feeds cortex.mjs / nightshift.mjs — consolidation is internal" },
  thalamus_adjudicator: { subject: "thalamus_adjudicator", schema_owner: "thalamus.mjs",      right_consumer: { kind: "organ", names: ["thalamus.mjs"] },                          witness: "scripts/outbox.mjs LANES_NOT_IN_CONFIG (moved here at S7)", why: "feeds thalamus.mjs — the bus adjudicates its own signals" },
  council_chair:        { subject: "council_chair",        schema_owner: "council.mjs",       right_consumer: { kind: "organ", names: ["council.mjs"] },                           witness: "scripts/outbox.mjs LANES_NOT_IN_CONFIG (moved here at S7)", why: "feeds council.mjs — the council's own chair turn" },
  gaffer_judge:         { subject: "gaffer_judge",         schema_owner: "gaffer_brain.mjs",  right_consumer: { kind: "organ", names: ["gaffer_brain.mjs"] },                      witness: "scripts/outbox.mjs LANES_NOT_IN_CONFIG (moved here at S7)", why: "feeds gaffer_brain.mjs — it reaches him AS the conversation, which is a surface the relay does not own" },
  gaffer_verify:        { subject: "gaffer_verify",        schema_owner: "gaffer_brain.mjs",  right_consumer: { kind: "organ", names: ["gaffer_brain.mjs", "scout.mjs"] },         witness: "scripts/outbox.mjs LANES_NOT_IN_CONFIG (moved here at S7)", why: "feeds gaffer_brain.mjs / scout.mjs — same: the Gaffer's own reasoning inside a sitting" },
  mission_m03:          { subject: "mission_m03",          schema_owner: "scout.mjs",         right_consumer: { kind: "organ", names: ["scout.mjs"] },                             witness: "scripts/outbox.mjs LANES_NOT_IN_CONFIG (moved here at S7)", why: "feeds scout.mjs — the mission lane carries its own returns and its own cards" },
  haiku_pulse:          { subject: "haiku_pulse",          schema_owner: "brain.mjs",         right_consumer: { kind: "organ", names: [], retired: true },                         witness: "commit 4f94805",                                            why: "RETIRED on purpose (commit 4f94805) — 98% of 32,480 tok/pulse was boot tax" },
  selfknowledge:        { subject: "selfknowledge",        schema_owner: "selfknowledge.mjs", right_consumer: { kind: "organ", names: ["dugout.mjs"] },                            witness: "scripts/selfknowledge.mjs regenIfChanged surface",          why: "feeds dugout.mjs get_organism, which stamps its consumption directly" },
});

// Every `<name>.mjs` named in a declaration, deduped, in the order written. The ONE place the
// organism turns a declaration's prose into organ names — SHAPE 7 (a predicate assuming a
// material shape), so it is MEASURED, never assumed: the selftest proves it over every row of
// the table AND over every live consumption `by` string.
export function organsNamedIn(text) {
  return [...new Set((String(text || "").match(/[a-z][a-z0-9_]*\.mjs/gi) || []).map((x) => x.toLowerCase()))];
}

// declaredConsumer(subject, {surface, downstream}) → the lane's `right_consumer`, or null.
// RESOLUTION ORDER, and it is deliberate: a lane's OWN declaration at its call site (`surface`)
// outranks the gate's table, because that is where the lane's author writes it and where it can
// never fall out of step with the lane. The table is the FALLBACK for lanes that declare nothing
// anywhere — the off-road ledger lanes. Where both exist they must AGREE, and the selftest
// asserts it (two declarations allowed to diverge is the twin-copy signature §2 names).
//   surface.kind human_file | sheet | media  → him
//   surface.kind job_input                   → job   (names = the downstream jobs the runner resolved)
//   surface.kind code                        → organ (names = the .mjs the surface itself points at)
// A `code` surface written without the `scripts/` prefix (`agenda`, `dreams` — "brain.mjs tick …")
// is caught by the same pattern; one that names no organ at all falls through to the table, and
// then to null, and then the ratchet sleeps the lane.
export function declaredConsumer(subject, { surface = null, downstream = null, table = LANE_CONSUMERS } = {}) {
  const s = surface && typeof surface === "object" ? surface : null;
  if (s && s.kind) {
    if (s.kind === "human_file" || s.kind === "sheet" || s.kind === "media") return { kind: "him", names: [], via: `surface.${s.kind}` };
    if (s.kind === "job_input") return { kind: "job", names: Array.isArray(downstream) ? downstream.filter((x) => typeof x === "string" && x) : [], via: "surface.job_input" };
    if (s.kind === "code") {
      const names = organsNamedIn(s.where);
      if (names.length) return { kind: "organ", names, via: "surface.code" };
    }
  }
  const row = table && Object.prototype.hasOwnProperty.call(table, subject) ? table[subject] : null;
  if (row && row.right_consumer) return { ...row.right_consumer, via: "gate.LANE_CONSUMERS", why: row.why };
  return null;
}

// consumerMatches(by, names) — did one of the named organs stamp this row? The consumption lane's
// `by` is the stamper's own sentence ("thalamus pre-answer hit (cosine)", "dugout get_organism",
// "learnstate brief (SessionStart)"): it opens with the organ's basename. Word-bounded on purpose
// — `dmn` must not match `dmn_rollout`, because a lane is not its own consumer.
export function consumerMatches(by, names) {
  const b = String(by || "").toLowerCase();
  if (!b) return false;
  return (names || []).some((n) => {
    const base = String(n || "").toLowerCase().replace(/\.mjs$/, "");
    return base ? new RegExp(`(^|[^a-z0-9_])${base}([^a-z0-9_]|$)`).test(b) : false;
  });
}

// consumerLabel(c) — the words the verdict, the journal and the card use for a declared consumer.
export function consumerLabel(c) {
  if (!c) return "nobody (no consumer declared)";
  if (c.retired) return "nobody — the lane is RETIRED";
  if (c.kind === "him") return "him";
  const n = (c.names || []).join(" / ");
  return n || (c.kind === "job" ? "its downstream job(s) — none declared" : "an organ — none named");
}

// consumerSatisfied(consumer, cons, {ageDays, windowDays}) → {ok, detail}. THE ONE PREDICATE the
// judgement recorded in the header lives in; reverse it here and nowhere else.
export function consumerSatisfied(consumer, cons, { ageDays = null, windowDays = GATE_DEFAULTS.window_days } = {}) {
  const c = cons || {};
  const who = consumerLabel(consumer);
  // A declaration that NAMES NOBODY is not a declaration — it is the shrug the ratchet exists to
  // refuse. `him` needs no names (he is the name); a retired lane declares that nobody may eat it.
  if (!consumer || (consumer.kind !== "him" && !consumer.retired && !(consumer.names || []).length)) {
    return { ok: false, detail: "NO CONSUMER DECLARED — the ratchet: a lane may not run until something names who must eat its output (its own surface.kind, or a gate.LANE_CONSUMERS row)" };
  }
  if (consumer.retired) return { ok: false, detail: `the lane is RETIRED (${consumer.why || "declared retired"}) — nothing may consume it, and nothing may spend on it` };
  // A him-lane keeps the sentence he already knows, word for word — the correction was never about
  // his lanes, and changing familiar words for no reason is its own small cost (L7).
  if (ageDays === null) return { ok: false, detail: consumer.kind === "him"
    ? "never consumed by him since the lane began (it has run, and nothing of it reached his ear, brief, card or eye)"
    : `nothing has consumed it since the lane began — its declared consumer is ${who}` };
  if (ageDays > windowDays) return { ok: false, detail: consumer.kind === "him"
    ? `last consumed by him ${ageDays.toFixed(1)}d ago (${c.kind || "?"}) — outside the ${windowDays}d window`
    : `its declared consumer ${who} last consumed it ${ageDays.toFixed(1)}d ago (${c.kind || "?"}) — outside the ${windowDays}d window` };
  if (consumer.kind === "him") return { ok: true, detail: `consumed by him ${ageDays.toFixed(1)}d ago (${c.kind || "?"}${c.by ? " via " + c.by : ""}) — inside the ${windowDays}d window` };
  return { ok: true, detail: consumerMatches(c.by, consumer.names)
    ? `its declared consumer ${who} consumed it ${ageDays.toFixed(1)}d ago (${c.kind || "?"} via ${c.by}) — inside the ${windowDays}d window`
    : `reached him ${ageDays.toFixed(1)}d ago (${c.kind || "?"}${c.by ? " via " + c.by : ""}) — its declared consumer is ${who}, and reaching him is never worth less than reaching the organ in the middle` };
}


export function gateConfig(job) {
  const g = (job && job.gate && typeof job.gate === "object") ? job.gate : {};
  const n = (v, d) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : d);
  return {
    window_days: n(g.window_days, GATE_DEFAULTS.window_days),
    fail_streak: n(g.fail_streak, GATE_DEFAULTS.fail_streak),
    event: typeof g.event === "string" && g.event ? g.event : GATE_DEFAULTS.event,
    consumers: Array.isArray(g.consumers) ? g.consumers.filter((x) => typeof x === "string") : [],
  };
}

const ms = (iso) => { const t = Date.parse(iso || ""); return Number.isFinite(t) ? t : NaN; };
const DAY = 86400000;

// ── THE FOLD (overhaul §10 · Block 5.2, 18 Aug 2026) — the fourth letter, D ─────
// A job may declare `folded_into: "<job id>"` in brain_config.json: its work is now
// done by that TARGET lane (night_coach · day_cartridge · agenda · teamtalk_am ·
// midday_cartridge · capsule_premap fold into prepare_tomorrow — ONE plan a night is
// what he meets). His law is THE GATE, never a switch (`enabled:false` would be the
// kill list in a new coat), so a folded lane stays enabled and SLEEPS BY VERDICT:
//   D holds (the lane may run) iff it is NOT displaced — no fold declared, or the
//   fold target has NOT covered the day this lane serves. The RUNNER computes the
//   fact (brain.mjs foldStatus: the target's artifact for the serve day exists, or the
//   target is awake and still due for it) and hands it here as `fold`; this file only
//   turns it into the verdict, like E·C·F. A covered lane sleeps "on D — folded →
//   prepare_tomorrow"; the night the target fails or misses, D holds again and the
//   folded lane runs AS THE FALLBACK — nothing deleted, nobody edits a list. His
//   `na` / `gate wake` (forced.until) opens D too: reversibility beats every letter.
export function foldOf(job) {
  const f = job && job.folded_into;
  return typeof f === "string" && f.trim() ? f.trim() : null;
}

// ── THE VERDICT ──────────────────────────────────────────────────────────────
// decide({ job, evidence, consumption, failures, now, forced, fold }) →
//   { run, state: "awake"|"asleep", why: {E,C,F,D}, wakes_when, cfg }
//
//   fold        { target: string, covered: boolean, detail?: string } | null — the
//               runner's read of the fold (null / absent ⇒ D holds: not folded, or the
//               fold is open). `covered:true` ⇒ D fails ⇒ ASLEEP unless forced.until.
//
//   evidence    { ok?: boolean, required_absent?: string[], absent?: string[], detail?: string }
//               E holds iff ok !== false AND required_absent is empty. `undefined` ⇒ E
//               holds (a job that declares no evidence has nothing that can be absent —
//               the manager_m3 class). Only a REQUIRED absence sleeps a lane; optional
//               absences are reported, never a verdict (finding #64's trap: no ratio).
//   consumption { last_at?: ISO|null, kind?: string, by?: string, never_ran?: boolean,
//                 event_armed?: boolean }
//               C holds iff forced.until > now (his `na` on the card, or `brain gate
//               wake` — his door opens before every other clause, reversibility first)
//               · OR event-driven (cfg.event set) · OR never_ran (a lane must run ONCE
//               to be consumable — the first-run grace) · OR THE LANE'S DECLARED RIGHT
//               CONSUMER consumed it inside window_days (rung S7 — his §1 correction;
//               see consumerSatisfied). A lane with NO declared consumer FAILS C: the
//               ratchet, "no lane runs without a declared consumer".
//   consumer    { kind, names[] } | null | undefined — the lane's declared right
//               consumer. `undefined` ⇒ resolved here from the job's own `surface`
//               and the LANE_CONSUMERS table; `null` ⇒ the runner resolved nothing,
//               which is the ratchet. Only a runner that knows a job_input lane's
//               downstream jobs needs to pass this explicitly.
//   failures    { streak?: number } — F blocks iff streak >= fail_streak. `forced.once`
//               (a wake) overrides F for exactly one run; a success then clears the
//               streak on the ledger by itself, which is the only clear there is.
//   forced      { until?: ISO|null, once?: boolean } — the two wake mechanisms.
export function decide({ job, evidence, consumption, failures, now = new Date(), forced = null, fold = null, consumer = undefined } = {}) {
  const cfg = gateConfig(job);
  const nowMs = now instanceof Date ? now.getTime() : ms(now);
  const ev = evidence || {};
  const cons = consumption || {};
  const fl = failures || {};
  const fz = forced || {};
  const forcedUntilMs = ms(fz.until);
  const forcedLive = Number.isFinite(forcedUntilMs) && forcedUntilMs > nowMs;
  const foldTarget = (fold && typeof fold === "object" && fold.target) ? String(fold.target) : foldOf(job);

  // E — evidence
  const reqAbsent = Array.isArray(ev.required_absent) ? ev.required_absent : [];
  const E = ev.ok !== false && reqAbsent.length === 0;
  const Edetail = E
    ? (ev.detail || (reqAbsent.length === 0 && Array.isArray(ev.absent) && ev.absent.length ? `evidence present (optional absent: ${ev.absent.join(", ")})` : "evidence present"))
    : (ev.detail || (reqAbsent.length ? `REQUIRED evidence absent: ${reqAbsent.join(", ")}` : "evidence declared absent by the organ"));

  // C — consumed by ITS DECLARED RIGHT CONSUMER (or event-driven / first run / forced)
  const lastMs = ms(cons.last_at);
  const ageDays = Number.isFinite(lastMs) ? (nowMs - lastMs) / DAY : null;
  // `consumer` undefined ⇒ resolve it from what the lane itself declares. A runner that knows a
  // job_input lane's downstream jobs passes its own; `null` from a runner IS the ratchet firing.
  const who = consumer === undefined ? declaredConsumer(job && job.id, { surface: job && job.surface }) : consumer;
  let C, Cdetail;
  // EVENT lanes: the event opens the lane. `event_armed` undefined ⇒ the runner's own
  // trigger arms it (brain's trigger gate) and C holds by construction; `false` ⇒ the
  // runner measured that the event has NOT fired since the last run — then only a
  // consumption inside the window or a force opens it (a lock-driven probe bank that
  // a scrimmage keeps drawing from is still useful between locks).
  // RUNG S7 — HIS §1 CORRECTION. The order of these clauses is the law, and it changed here:
  //   HIS DOOR FIRST. `forced` used to sit behind the event clause; it now opens before every
  //   other C clause, because the ratchet below can refuse a lane on a DECLARATION and his hand
  //   must be able to open even that ("reversibility beats every letter" — the D branch already
  //   says so in as many words). Nothing else about the event clauses moved.
  //   THEN THE RATCHET: a lane with no declared consumer may not run at all.
  if (forcedLive) { C = true; Cdetail = `forced awake until ${new Date(forcedUntilMs).toISOString().slice(0, 16)}Z (his na / gate wake)`; }
  else if (!who || who.retired || (who.kind !== "him" && !(who.names || []).length)) { C = false; Cdetail = consumerSatisfied(who, cons, { ageDays, windowDays: cfg.window_days }).detail; }
  else if (cfg.event && cons.event_armed !== false) { C = true; Cdetail = `event-driven (${cfg.event}) — the event opens it, consumption is not the gate`; }
  else if (cfg.event && ageDays !== null && ageDays <= cfg.window_days) { C = true; Cdetail = `event ${cfg.event} has not fired since the last run, but the output was consumed ${ageDays.toFixed(1)}d ago (${cons.kind || "?"}) — inside the ${cfg.window_days}d window`; }
  else if (cfg.event) { C = false; Cdetail = `event ${cfg.event} has not fired since the last run${ageDays !== null ? `, and the last consumption was ${ageDays.toFixed(1)}d ago (outside ${cfg.window_days}d)` : ", and nothing of it was ever consumed"}`; }
  else if (cons.never_ran === true) { C = true; Cdetail = "first run — a lane must run once before anything of it can reach him"; }
  else { const r = consumerSatisfied(who, cons, { ageDays, windowDays: cfg.window_days }); C = r.ok; Cdetail = r.detail; }

  // F — failure streak
  const streak = typeof fl.streak === "number" && fl.streak > 0 ? fl.streak : 0;
  let F = streak < cfg.fail_streak, Fdetail;
  if (F) Fdetail = streak ? `${streak} consecutive failure(s) — under the ${cfg.fail_streak} guard` : "no failure streak";
  else if (fz.once) { F = true; Fdetail = `${streak} consecutive failure(s) ≥ ${cfg.fail_streak}, but a wake was asked for — this ONE run is allowed; a success clears the streak`; }
  else Fdetail = `${streak} consecutive failure(s) ≥ ${cfg.fail_streak} guard — the same failure must not repeat unattended`;

  // D — not displaced by a fold (Block 5.2). The runner's fact decides; a live C-force
  // (his `na` / `gate wake`) opens the fold too — reversibility outranks the design.
  let D = true, Ddetail;
  if (!foldTarget) Ddetail = "not folded into another lane";
  else if (fold && fold.covered === true && forcedLive) { D = true; Ddetail = `folded → ${foldTarget} and covered, but forced awake until ${new Date(forcedUntilMs).toISOString().slice(0, 16)}Z (his na / gate wake) — this lane runs beside the fold`; }
  else if (fold && fold.covered === true) { D = false; Ddetail = fold.detail || `folded → ${foldTarget}: the fold target covers this lane's day`; }
  else Ddetail = (fold && fold.detail) ? `folded → ${foldTarget}, fold OPEN — ${fold.detail}` : `folded → ${foldTarget}, but the runner reported no cover — the fold is OPEN and this lane decides on E·C·F`;

  const run = E && C && F && D;
  const state = run ? "awake" : "asleep";
  return {
    run, state, cfg,
    why: { E: { ok: E, detail: Edetail }, C: { ok: C, detail: Cdetail }, F: { ok: F, detail: Fdetail }, D: { ok: D, detail: Ddetail } },
    fold: foldTarget ? { target: foldTarget, covered: !D } : null,
    consumer: who,                                                   // S7: the verdict CARRIES its declared consumer — the journal, the card and `gate json` all name WHICH consumer went quiet
    wakes_when: run ? null : wakesWhen({ job, E, C, F, D, reqAbsent, cfg, foldTarget, consumer: who }),
  };
}

// The sentence on the card and in `brain status`: what has to happen for this lane
// to wake ITSELF. Derived from the job's own declarations, never a hand-written per-
// job string (a per-job table is the list this file exists to abolish).
export function wakesWhen({ job, E, C, F, D = true, reqAbsent = [], cfg = gateConfig(job), foldTarget = foldOf(job), consumer = undefined } = {}) {
  const who = consumer === undefined ? declaredConsumer(job && job.id, { surface: job && job.surface }) : consumer;
  const parts = [];
  if (!E) parts.push(reqAbsent.length ? `${reqAbsent.join(", ")} exists again` : "its evidence exists again");
  // S7 — the C clause names WHOSE reading opens the lane, because "its output reaches him" is the
  // wrong instruction for a lane that was never for him. An undeclared lane's clause is a
  // DECLARATION, not a reading: nothing he does opens it until its row names a consumer.
  if (!C && !who) parts.push(`something DECLARES its right consumer (its own surface.kind, or a row in gate.mjs LANE_CONSUMERS) — until then no reading of it can open this lane`);
  else if (!C && who && who.retired) parts.push(`nothing — the lane is RETIRED and is not meant to wake`);
  else if (!C && who && who.kind !== "him") parts.push(`its declared consumer ${consumerLabel(who)} consumes it (${consumptionHint(job)}) — or his 'na' on the card / \`brain gate wake ${job && job.id ? job.id : "<job>"}\` opens it for ${cfg.window_days}d`);
  else if (!C) parts.push(`its output reaches him (${consumptionHint(job)}) — or his 'na' on the card / \`brain gate wake ${job && job.id ? job.id : "<job>"}\` opens it for ${cfg.window_days}d`);
  if (!F) parts.push(`\`brain gate wake ${job && job.id ? job.id : "<job>"}\` runs it once (a success clears the ${cfg.fail_streak}-fail streak)`);
  if (!D) parts.push(`the fold opens by itself the night ${foldTarget || "its fold target"} fails or misses (this lane is the fallback) — or \`brain gate wake ${job && job.id ? job.id : "<job>"}\` runs it beside the fold for ${cfg.window_days}d`);
  return parts.join(" · ") || "n/a";
}

// Where THIS job's output would have to be seen — read off the job's own `surface`
// declaration (brain_config.json), the same field `brain status` prints.
export function consumptionHint(job) {
  const s = job && job.surface;
  if (!s || typeof s !== "object") return "no surface declared";
  const where = String(s.where || "");
  const organ = (where.match(/scripts\/([a-z_]+)\.mjs/i) || [])[1];
  switch (s.kind) {
    case "sheet": return "the sheet is pushed to his phone / opened at /matchday";
    case "media": return "the mp3 is announced inside a push that was sent";
    case "human_file": return "he opens the file (a card he answers, or the wall/`deep` prints it)";
    case "job_input": return "the job that eats it (downstream) reaches him";
    case "code": return organ ? `${organ}.mjs serves it into a brief, a sitting or his ear` : "the reader organ serves it to him";
    default: return where.slice(0, 60) || s.kind || "unknown surface";
  }
}

// ── PURE FOLDS OVER ROWS THE CALLER READ ─────────────────────────────────────
// consumptionOf(rows, keys, {before}) → { last_at, kind, by } for the newest row whose
// `job` or `lane` is in keys. Rows are the consumption lane's shape:
//   { ts, job?, lane?, kind, by, file? }
export function consumptionOf(rows, keys, { before = null } = {}) {
  const K = new Set((Array.isArray(keys) ? keys : [keys]).filter(Boolean));
  const cut = before ? ms(before) : Infinity;
  let best = null;
  for (const r of rows || []) {
    if (!r || typeof r !== "object") continue;
    if (!(K.has(r.job) || K.has(r.lane))) continue;
    if (!CONSUMPTION_KINDS.includes(r.kind)) continue;
    const t = ms(r.ts);
    if (!Number.isFinite(t) || t > cut) continue;
    if (!best || t > best.t) best = { t, last_at: r.ts, kind: r.kind, by: r.by || null };
  }
  return best ? { last_at: best.last_at, kind: best.kind, by: best.by } : { last_at: null, kind: null, by: null };
}

// failStreakOf(ledgerRows, jobId) → consecutive ok:false rows at the TAIL of this
// job's history. Rows without a boolean `ok` (budget:skip, agenda:skip, gate rows)
// are neither a failure nor a success and are skipped; a plan-limit row is not the
// job's fault and is skipped too (brain.mjs's own attempt rule).
// `jobId` may be ONE id or a list of ids (a lane whose ledger rows carry several job
// names — the DMN writes dmn_rollout + dmn_counter, the shift writes ns_*).
export function failStreakOf(rows, jobId) {
  const ids = new Set(Array.isArray(jobId) ? jobId : [jobId]);
  let streak = 0;
  for (let i = (rows || []).length - 1; i >= 0; i--) {
    const r = rows[i];
    if (!r || !ids.has(r.job) || typeof r.ok !== "boolean" || r.limit_hit === true) continue;
    if (r.ok === false) streak++; else break;
  }
  return streak;
}

// everRan(ledgerRows, jobId) → has this job EVER left a boolean-ok row (a real
// attempt, success or failure)? Skips (budget/agenda/gate) do not count as runs.
export function everRan(rows, jobId) {
  const ids = new Set(Array.isArray(jobId) ? jobId : [jobId]);
  return (rows || []).some((r) => r && ids.has(r.job) && typeof r.ok === "boolean");
}

// The one read helper (convenience for callers; brain/nightshift/dmn all already
// have their own readers — this exists so a caller with none can stay honest).
export function readJsonl(path) {
  try { return readFileSync(path, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }
  catch { return []; }
}

// ── SELFTEST — fixtures only; every check can fail ───────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) pass++; else fail++; console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const NOW = new Date("2026-08-18T04:00:00Z");
  const iso = (dAgo) => new Date(NOW.getTime() - dAgo * DAY).toISOString();
  const J = (id, extra = {}) => ({ id, surface: { kind: "code", where: "scripts/learnstate.mjs diaryLine()" }, ...extra });

  // defaults
  const cfg = gateConfig({ id: "x" });
  assert("DEFAULTS — window 14d · fail_streak 5 · event null · consumers [] when the job declares nothing (no config edit needed to start)",
    cfg.window_days === 14 && cfg.fail_streak === 5 && cfg.event === null && cfg.consumers.length === 0);
  assert("DEFAULTS — a job's own gate block overrides field by field, garbage is ignored",
    gateConfig({ gate: { window_days: 3, fail_streak: "nope", event: "lock", consumers: ["a", 5] } }).window_days === 3
    && gateConfig({ gate: { fail_streak: "nope" } }).fail_streak === 5
    && gateConfig({ gate: { event: "lock" } }).event === "lock"
    && gateConfig({ gate: { consumers: ["a", 5] } }).consumers.join() === "a");

  // §5.5 fixture 1 — required input absent ⇒ asleep; restored ⇒ awake, no human action
  const asleepE = decide({ job: J("teamtalk_am"), evidence: { required_absent: ["season.json"] }, consumption: { last_at: iso(1) }, failures: { streak: 0 }, now: NOW });
  const awakeE = decide({ job: J("teamtalk_am"), evidence: { required_absent: [] }, consumption: { last_at: iso(1) }, failures: { streak: 0 }, now: NOW });
  assert("§5.5/1 — REQUIRED evidence absent ⇒ ASLEEP with E named; the same lane with evidence back ⇒ AWAKE by itself",
    asleepE.run === false && asleepE.state === "asleep" && asleepE.why.E.ok === false && /season\.json/.test(asleepE.why.E.detail)
    && awakeE.run === true && awakeE.state === "awake");
  assert("§5.5/1 — an OPTIONAL absence is reported and never a verdict (finding #64's trap: no ratio, no majority guard)",
    decide({ job: J("t"), evidence: { absent: ["notebook.json"], required_absent: [] }, consumption: { last_at: iso(1) }, now: NOW }).run === true);
  assert("§5.5/1 — wakes_when names the missing file, derived from the declaration",
    /season\.json exists again/.test(asleepE.wakes_when));

  // §5.5 fixture 2 — 5 consecutive failures ⇒ asleep; a wake runs it once; success clears
  const rowsFail = [{ job: "x", ok: true }, ...Array.from({ length: 5 }, () => ({ job: "x", ok: false }))];
  assert("§5.5/2 — failStreakOf counts the TAIL only, skips non-boolean rows and limit_hit rows",
    failStreakOf(rowsFail, "x") === 5
    && failStreakOf([...rowsFail, { job: "x", budget_skip: true }], "x") === 5
    && failStreakOf([...rowsFail, { job: "x", ok: false, limit_hit: true }], "x") === 5
    && failStreakOf([...rowsFail, { job: "x", ok: true }], "x") === 0
    && failStreakOf(rowsFail, "y") === 0);
  const asleepF = decide({ job: J("x"), evidence: {}, consumption: { last_at: iso(1) }, failures: { streak: 5 }, now: NOW });
  const wokeF = decide({ job: J("x"), evidence: {}, consumption: { last_at: iso(1) }, failures: { streak: 5 }, now: NOW, forced: { once: true } });
  assert("§5.5/2 — streak 5 ⇒ ASLEEP on F; forced.once ⇒ this ONE run is allowed and says a success clears it",
    asleepF.run === false && asleepF.why.F.ok === false && wokeF.run === true && /ONE run/.test(wokeF.why.F.detail));
  assert("§5.5/2 — streak 4 stays under the guard (a guard, never a budget)",
    decide({ job: J("x"), evidence: {}, consumption: { last_at: iso(1) }, failures: { streak: 4 }, now: NOW }).run === true);

  // §5.5 fixture 3 — spoken 3d ago ⇒ awake; 15d ago ⇒ asleep; card 'na' ⇒ awake 14d
  const c3 = decide({ job: J("night_coach"), evidence: {}, consumption: { last_at: iso(3), kind: "spoken", by: "dugout" }, failures: {}, now: NOW });
  const c15 = decide({ job: J("night_coach"), evidence: {}, consumption: { last_at: iso(15), kind: "spoken", by: "dugout" }, failures: {}, now: NOW });
  const cNa = decide({ job: J("night_coach"), evidence: {}, consumption: { last_at: iso(15), kind: "spoken" }, failures: {}, now: NOW, forced: { until: iso(-14) } });
  assert("§5.5/3 — consumed (spoken) 3d ago ⇒ AWAKE; 15d ago ⇒ ASLEEP on C; his 'na' (forced until +14d) ⇒ AWAKE",
    c3.run === true && /spoken/.test(c3.why.C.detail) && c15.run === false && c15.why.C.ok === false && cNa.run === true && /forced awake/.test(cNa.why.C.detail));
  assert("§5.5/3 — an EXPIRED force is not a force",
    decide({ job: J("n"), evidence: {}, consumption: { last_at: iso(15) }, now: NOW, forced: { until: iso(1) } }).run === false);
  assert("§5.5/3 — the window is the job's own: window_days 30 keeps a 15d-old consumption awake",
    decide({ job: J("n", { gate: { window_days: 30 } }), evidence: {}, consumption: { last_at: iso(15) }, now: NOW }).run === true);

  // event-driven and first-run grace
  assert("EVENT — an event-driven lane passes C by construction (the event is the gate, not consumption)",
    decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: { last_at: null }, now: NOW }).why.C.ok === true);
  assert("FIRST RUN — a lane that has never run passes C (it must run once to be consumable); a lane that ran and was never consumed does NOT",
    decide({ job: J("prepare_tomorrow"), evidence: {}, consumption: { last_at: null, never_ran: true }, now: NOW }).run === true
    && decide({ job: J("teamtalk_pm"), evidence: {}, consumption: { last_at: null, never_ran: false }, now: NOW }).run === false);
  assert("EVENT + F — an event lane still sleeps on a 5-fail streak (the guard is universal)",
    decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: {}, failures: { streak: 5 }, now: NOW }).run === false);
  assert("EVENT MEASURED — event_armed:false (the runner saw no event since the last run) ⇒ ASLEEP unless consumed inside the window or forced; armed again ⇒ AWAKE",
    decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: { event_armed: false, last_at: null }, now: NOW }).run === false
    && /has not fired/.test(decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: { event_armed: false, last_at: null }, now: NOW }).why.C.detail)
    && decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: { event_armed: false, last_at: iso(3), kind: "sat" }, now: NOW }).run === true
    && decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: { event_armed: false, last_at: iso(30) }, now: NOW, forced: { until: iso(-1) } }).run === true
    && decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: { event_armed: true, last_at: null }, now: NOW }).run === true);

  // the folds
  const rows = [
    { ts: iso(20), job: "diary", kind: "briefed", by: "learnstate" },
    { ts: iso(2), lane: "day_cartridge", kind: "sat", by: "dugout" },
    { ts: iso(1), job: "diary", kind: "not-a-kind", by: "x" },
    { ts: "garbage", job: "diary", kind: "spoken" },
    { ts: iso(0.5), job: "diary", kind: "spoken", by: "dugout" },
  ];
  assert("consumptionOf — newest VALID row wins, by job OR lane, unknown kinds and undateable rows ignored",
    consumptionOf(rows, ["diary"]).kind === "spoken" && consumptionOf(rows, ["diary"]).by === "dugout"
    && consumptionOf(rows, ["day_cartridge"]).kind === "sat"
    && consumptionOf(rows, ["nothing"]).last_at === null);
  assert("consumptionOf — `before` cuts the fold (a decision replayed for a past slot sees only what was known then)",
    consumptionOf(rows, ["diary"], { before: iso(1) }).kind === "briefed");
  assert("everRan — boolean-ok rows are runs; skips are not",
    everRan([{ job: "a", budget_skip: true }], "a") === false && everRan([{ job: "a", ok: false }], "a") === true);
  assert("ALIASES — a lane whose rows carry several job names (dmn_rollout+dmn_counter) is one lane to everRan and failStreakOf",
    everRan([{ job: "dmn_rollout", ok: true }], ["dmn_rollout", "dmn_counter"]) === true
    && everRan([{ job: "dmn_rollout", ok: true }], "dmn") === false
    && failStreakOf([{ job: "dmn_rollout", ok: false }, { job: "dmn_counter", ok: false }], ["dmn_rollout", "dmn_counter"]) === 2);

  // THE FOLD — the fourth letter (Block 5.2)
  {
    const NC = J("night_coach", { folded_into: "prepare_tomorrow" });
    const base = { evidence: {}, consumption: { last_at: iso(1), kind: "briefed" }, failures: {}, now: NOW };
    const covered = decide({ ...base, job: NC, fold: { target: "prepare_tomorrow", covered: true, detail: "folded → prepare_tomorrow: its artifact for 2026-08-19 exists" } });
    const open = decide({ ...base, job: NC, fold: { target: "prepare_tomorrow", covered: false, detail: "its run for 2026-08-19 left no artifact (1 attempt, failed)" } });
    const noFact = decide({ ...base, job: NC });
    const plain = decide({ ...base, job: J("night_coach") });
    assert("FOLD — a folded lane whose target COVERED the day sleeps on D alone (E·C·F all hold), and the detail names the fold",
      covered.run === false && covered.why.E.ok && covered.why.C.ok && covered.why.F.ok && covered.why.D.ok === false
      && /folded → prepare_tomorrow/.test(covered.why.D.detail) && covered.fold && covered.fold.target === "prepare_tomorrow" && covered.fold.covered === true);
    assert("FOLD — the night the target fails or misses, D holds and the folded lane RUNS as the fallback (nothing deleted, no list edited); wakes_when says so",
      open.run === true && open.why.D.ok === true && /fold OPEN/.test(open.why.D.detail) && /left no artifact/.test(open.why.D.detail)
      && /fold opens by itself the night prepare_tomorrow fails or misses/.test(covered.wakes_when));
    assert("FOLD — a folded lane with NO runner fact is OPEN (fail-open: an unreadable fold never silences a lane); an unfolded lane says so",
      noFact.run === true && /fold is OPEN/.test(noFact.why.D.detail) && plain.why.D.ok === true && plain.why.D.detail === "not folded into another lane" && plain.fold === null);
    assert("FOLD — his `na` / `gate wake` (forced.until live) opens a COVERED fold — reversibility outranks the design; an expired force does not",
      decide({ ...base, job: NC, fold: { target: "prepare_tomorrow", covered: true }, forced: { until: iso(-14) } }).run === true
      && decide({ ...base, job: NC, fold: { target: "prepare_tomorrow", covered: true }, forced: { until: iso(1) } }).run === false);
    assert("FOLD — a covered fold never masks E/C/F: a lane asleep on C AND covered reports both letters",
      (() => { const v = decide({ job: NC, evidence: {}, consumption: { last_at: iso(30) }, failures: {}, now: NOW, fold: { target: "prepare_tomorrow", covered: true } }); return v.run === false && v.why.C.ok === false && v.why.D.ok === false; })());
    assert("foldOf — reads the job's own declaration, blanks are not folds",
      foldOf(NC) === "prepare_tomorrow" && foldOf({ folded_into: "  " }) === null && foldOf({}) === null && foldOf(null) === null);
  }

  // the sentences
  assert("consumptionHint — reads the job's own surface declaration, names the reader organ off its path",
    /learnstate\.mjs/.test(consumptionHint(J("d"))) && /phone|matchday/.test(consumptionHint({ surface: { kind: "sheet" } }))
    && /downstream/.test(consumptionHint({ surface: { kind: "job_input" } })) && consumptionHint({}) === "no surface declared");
  assert("wakesWhen — one clause per failed check, none for a passing one, and the CLI door is named on C and F",
    (() => { const w = wakesWhen({ job: J("x"), E: true, C: false, F: false }); return /gate wake x/.test(w) && !/exists again/.test(w) && w.split(" · ").length === 2; })());
  assert("PURITY — decide() with a string `now` and no failures/consumption objects still returns a total verdict (never throws)",
    (() => { try { const r = decide({ job: J("z"), now: "2026-08-18T00:00:00Z" }); return typeof r.run === "boolean" && r.why && r.why.C; } catch { return false; } })());

  // ── RUNG S7 · THE DECLARED CONSUMER (his §1 correction). Every check can fail. ──────────────
  const HIM = { kind: "code", where: "scripts/learnstate.mjs diaryLine()" };
  assert("S7 TABLE — every row is in the S6 core-row shape, and its key IS its subject (a row that cannot be found by its own name is a row S10 cannot migrate)",
    Object.entries(LANE_CONSUMERS).every(([k, r]) => r && r.subject === k && typeof r.schema_owner === "string" && /\.mjs$/.test(r.schema_owner)
      && r.right_consumer && CONSUMER_KINDS.includes(r.right_consumer.kind) && Array.isArray(r.right_consumer.names)
      && typeof r.witness === "string" && r.witness.length >= 10 && typeof r.why === "string" && r.why.length >= 25));
  assert("S7 TABLE — `names` and `why` CANNOT DRIFT APART: every organ the prose names is in names, and every name is in the prose (the twin-copy signature §2 names, made impossible)",
    Object.values(LANE_CONSUMERS).every((r) => {
      const inProse = organsNamedIn(r.why), declared = r.right_consumer.names;
      return inProse.length === declared.length && inProse.every((o) => declared.includes(o));
    }));
  assert("S7 TABLE — it holds ONLY lanes that declare no surface of their own (it is outbox's off-road CONSUMER MAP, moved — never a second copy of brain_config's 34 surfaces)",
    Object.keys(LANE_CONSUMERS).length === 15 && !Object.keys(LANE_CONSUMERS).includes("diary") && !Object.keys(LANE_CONSUMERS).includes("night_coach"));
  assert("S10 FOLD — the registry-derived view and the frozen S7 layer CANNOT DISAGREE (one copy: the rows moved to registry.json, this table derives, the layer is the drift-lock fixture)",
    JSON.stringify(LANE_CONSUMERS) === JSON.stringify(LANE_CONSUMERS_S7_LAYER));
  assert("S10-F — a lanes row that says WHERE it is declared stays OUT of this map, and the exclusion is the ROW'S OWN FIELD: night_coach and brain_ledger live in the registry now, and neither may leak into a table whose whole definition is \"declares nothing anywhere\"",
    (() => {
      const all = registryLaneRows();
      const elsewhere = all.filter((r) => r.declared_elsewhere);
      return elsewhere.length >= 2
        && elsewhere.every((r) => typeof r.declared_elsewhere === "string" && r.declared_elsewhere.trim() && !(r.subject in LANE_CONSUMERS))
        && all.filter((r) => !r.declared_elsewhere).length === Object.keys(LANE_CONSUMERS).length;
    })(), `${registryLaneRows().length} lanes rows, ${Object.keys(LANE_CONSUMERS).length} off-road`);

  // the derivation — a lane's OWN declaration answers first
  assert("S7 DERIVE — human_file / sheet / media ⇒ HIM; job_input ⇒ its downstream JOBS; code ⇒ the ORGAN the surface itself points at",
    declaredConsumer("x", { surface: { kind: "human_file", where: "brain_out/doubts/<d>.md" } }).kind === "him"
    && declaredConsumer("x", { surface: { kind: "sheet" } }).kind === "him"
    && declaredConsumer("x", { surface: { kind: "media" } }).kind === "him"
    && declaredConsumer("x", { surface: { kind: "job_input" }, downstream: ["day_cartridge", 7] }).names.join() === "day_cartridge"
    && declaredConsumer("x", { surface: HIM }).names.join() === "learnstate.mjs");
  assert("S7 DERIVE — a `code` surface written WITHOUT the scripts/ prefix still names its organ (the live `agenda` / `dreams` shape: \"brain.mjs tick …\")",
    declaredConsumer("agenda", { surface: { kind: "code", where: "brain.mjs tick agendaAllocationFor() → per-job lean/skip" } }).names.join() === "brain.mjs");
  assert("S7 DERIVE — no surface ⇒ the gate's own table answers; a lane in neither ⇒ NULL, and null is what the ratchet sleeps",
    declaredConsumer("cortex_wake").names.join() === "cortex.mjs,council.mjs"
    && declaredConsumer("cortex_wake").via === "gate.LANE_CONSUMERS"
    && declaredConsumer("a_lane_nobody_declared") === null);

  // the ratchet — the strictness this rung ADDS
  const undeclared = { id: "unowned_lane" };
  assert("S7 RATCHET — a lane with NO declared consumer FAILS C even with a consumption row minutes old, and the sentence asks for a DECLARATION, not a reading",
    (() => { const v = decide({ job: undeclared, evidence: {}, consumption: { last_at: iso(0.01), kind: "briefed", by: "learnstate" }, now: NOW });
      return v.run === false && v.why.C.ok === false && /NO CONSUMER DECLARED/.test(v.why.C.detail) && /DECLARES its right consumer/.test(v.wakes_when); })());
  assert("S7 RATCHET — it BITES BOTH WAYS: declare a consumer for that same lane and the same row opens it (the ratchet refuses undeclared lanes, never live ones)",
    decide({ job: { ...undeclared, surface: HIM }, evidence: {}, consumption: { last_at: iso(0.01), kind: "briefed", by: "learnstate" }, now: NOW }).run === true);
  assert("S7 RATCHET — a declaration that NAMES NOBODY is not a declaration: kind organ/job with an empty names[] is refused exactly like a missing row (the shrug the ratchet exists to catch), while `him` needs no name because he IS the name",
    decide({ job: { id: "shrug" }, evidence: {}, consumption: { last_at: iso(1), kind: "briefed", by: "learnstate" }, now: NOW, consumer: { kind: "organ", names: [] } }).why.C.ok === false
    && decide({ job: { id: "shrug" }, evidence: {}, consumption: { last_at: iso(1), kind: "briefed", by: "learnstate" }, now: NOW, consumer: { kind: "job", names: [] } }).why.C.ok === false
    && decide({ job: { id: "hisown" }, evidence: {}, consumption: { last_at: iso(1), kind: "briefed", by: "learnstate" }, now: NOW, consumer: { kind: "him", names: [] } }).why.C.ok === true);
  assert("S7 RATCHET — HIS DOOR still opens an undeclared lane (reversibility beats every letter, D's own rule); an EXPIRED force does not",
    decide({ job: undeclared, evidence: {}, consumption: { last_at: null }, now: NOW, forced: { until: iso(-14) } }).why.C.ok === true
    && decide({ job: undeclared, evidence: {}, consumption: { last_at: null }, now: NOW, forced: { until: iso(1) } }).why.C.ok === false);
  assert("S7 RATCHET — an EVENT lane is not exempt: no declared consumer ⇒ asleep, even event-armed (the event opens a lane, it does not excuse one)",
    decide({ job: { id: "unowned_event", gate: { event: "lock" } }, evidence: {}, consumption: {}, now: NOW }).why.C.ok === false);
  assert("S7 RETIRED — a lane declared RETIRED fails C on a fresh row and says nothing may spend on it (haiku_pulse: 98% of its tokens were boot tax)",
    (() => { const v = decide({ job: { id: "haiku_pulse" }, evidence: {}, consumption: { last_at: iso(0.5), kind: "briefed", by: "brain" }, now: NOW });
      return v.why.C.ok === false && /RETIRED/.test(v.why.C.detail) && /RETIRED/.test(v.wakes_when); })());

  // the verdict now judges — and SPEAKS — by the declared consumer
  const organLane = { id: "ns_pre_answers" };
  assert("S7 ORGAN C — a lane whose right consumer is an ORGAN passes C on a row that ORGAN stamped, and the detail names the organ instead of accusing him",
    (() => { const v = decide({ job: organLane, evidence: {}, consumption: { last_at: iso(1.5), kind: "sat", by: "thalamus pre-answer hit (cosine)" }, now: NOW });
      return v.why.C.ok === true && /declared consumer thalamus\.mjs/.test(v.why.C.detail) && !/consumed by him/.test(v.why.C.detail); })());
  assert("S7 ORGAN C — quiet consumer: outside the window the verdict names WHICH consumer went quiet, and never says 'nothing reached his ear' about a lane that was never for him",
    (() => { const v = decide({ job: organLane, evidence: {}, consumption: { last_at: iso(30), kind: "sat", by: "thalamus" }, now: NOW });
      return v.why.C.ok === false && /thalamus\.mjs/.test(v.why.C.detail) && !/his ear/.test(v.why.C.detail)
        && /declared consumer thalamus\.mjs \/ dugout\.mjs consumes it/.test(v.wakes_when); })());
  assert("S7 ORGAN C — never run and nobody has eaten it: the sentence still names the declared consumer, not him",
    (() => { const v = decide({ job: organLane, evidence: {}, consumption: { last_at: null, never_ran: false }, now: NOW });
      return v.why.C.ok === false && /nothing has consumed it since the lane began — its declared consumer is thalamus\.mjs \/ dugout\.mjs/.test(v.why.C.detail); })());
  assert("S7 THE JUDGEMENT (reversible in consumerSatisfied alone) — reaching HIM still satisfies an ORGAN-declared lane, and the detail says so out loud; this is what keeps night_coach and intent_digest awake on learnstate's brief",
    (() => { const v = decide({ job: { id: "night_coach", surface: { kind: "code", where: "scripts/setpiece.mjs readNightCoach()" } }, evidence: {}, consumption: { last_at: iso(2), kind: "briefed", by: "learnstate brief (SessionStart)" }, now: NOW });
      return v.why.C.ok === true && /reached him/.test(v.why.C.detail) && /declared consumer is setpiece\.mjs/.test(v.why.C.detail); })());
  assert("S7 — the verdict CARRIES its declared consumer, so the journal and the card can name it without re-deriving anything",
    decide({ job: organLane, evidence: {}, consumption: {}, now: NOW }).consumer.names.join() === "thalamus.mjs,dugout.mjs"
    && decide({ job: undeclared, evidence: {}, consumption: {}, now: NOW }).consumer === null);

  // the prose predicate — SHAPE 7, so it is measured, not assumed
  assert("S7 consumerMatches — word-bounded on purpose: `dmn` does not match `dmn_rollout` (a lane is not its own consumer); the real live `by` sentences DO match their organ",
    consumerMatches("dmn_rollout wrote it", ["dmn.mjs"]) === false
    && consumerMatches("dugout get_organism", ["dugout.mjs"]) === true
    && consumerMatches("thalamus pre-answer hit (cosine)", ["thalamus.mjs", "dugout.mjs"]) === true
    && consumerMatches("learnstate brief (SessionStart)", ["setpiece.mjs"]) === false
    && consumerMatches("", ["dugout.mjs"]) === false && consumerMatches("dugout", []) === false);
  assert("S7 consumerLabel — him · the organs by name · the retired lane · and the undeclared lane, each said in words a card can carry",
    consumerLabel({ kind: "him" }) === "him" && consumerLabel({ kind: "organ", names: ["a.mjs", "b.mjs"] }) === "a.mjs / b.mjs"
    && /RETIRED/.test(consumerLabel({ kind: "organ", names: [], retired: true })) && /no consumer declared/.test(consumerLabel(null)));

  assert("THIS ORGAN WRITES NOTHING — its source has no write call (the journal, the lane and the card belong to their owners)",
    !/writeFileSync|appendFileSync|renameSync|mkdirSync|unlinkSync/.test(readFileSync(new URL(import.meta.url), "utf8").replace(/^\/\/.*$/gm, "").replace(/assert\("THIS ORGAN WRITES NOTHING[^\n]*\n[^\n]*/m, "")));

  console.log(`\ngate selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || "selftest";
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  console.log("gate: pure helper — `node scripts/gate.mjs selftest`; the verdicts live in `node scripts/brain.mjs status` (GATE section)");
}
