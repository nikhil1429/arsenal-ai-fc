#!/usr/bin/env node
// ============================================================================
// shadow.mjs · ARSENAL AI FC — THE ORGANISM: THE SHADOW ENGINE (U3b)
// ----------------------------------------------------------------------------
// WHAT:  Earned proactivity (L2 — the crown mechanism of the continuous-time
//        organism). The proactive mouth trains SILENTLY: every would-have-
//        spoken moment is logged as a SHADOW (never voiced); the evening pass
//        resolves each against what actually happened ("would it have
//        helped?"); an interruption-type earns VOICE only at proven shadow
//        hit-rate PLUS the captain's one-time spoken ratification — the
//        no-look-pass machinery pointed at the mouth.
// LAWS:  bias-to-silence (shadows are silent BY CONSTRUCTION) · RED = the
//        engine doesn't even shadow (rest is rest) · the captain's own
//        reminders are EXEMPT upstream (his voice echoed ≠ ping — dugout's
//        lane, not this engine's business) · nothing auto-ratifies: a proven
//        hit-rate only OPENS the door; his word walks through it · one shadow
//        per type per day (no spam even in the dark).
// WRITER OF: shadow_log.jsonl · proactivity_ledger.json (single-writer law)
// MODES: detect · score · ratify <type> [--captain] · unratify <type> · status · selftest
//
// SCORING IS DATE-SCOPED AND INDEPENDENTLY RUNNABLE (audit #52, 4 Aug 2026).
//   `score` used to select EVERY unresolved row ever logged while building its
//   facts from TODAY ONLY — so the first run after a gap would have judged an
//   18-Jul shadow against 4-Aug's rep times and written five fabricated verdicts
//   into a ledger whose whole purpose is to be believable. Each shadow is now
//   scored against the facts of ITS OWN local day, and only once that day's
//   evidence window has provably closed (see `maturity`). That makes `score`
//   safe to run on a schedule and safe to catch up — it no longer needs the
//   postmatch ritual, which is its only historical caller and has never run.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { supersedeReps } from "./capture.mjs";   // BLOCK 4 — a corrected verdict must stop counting HERE too; the sole writer of reps_log owns what supersession means

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const SHADOW_LOG = join(STATE_DIR, "shadow_log.jsonl");
const LEDGER = join(STATE_DIR, "proactivity_ledger.json");
const REPS_LOG = join(STATE_DIR, "reps_log.jsonl");
const PITCH_HIST = join(STATE_DIR, "pitch_read_history.jsonl");
const SCRIM_LOG = join(STATE_DIR, "dugout_scrimmage.jsonl");

// the candidate interruption-types being shadow-trained (from the captain's
// approved brainstorm; his own timed reminders are exempt and NOT here)
const TYPES = ["stoppage_next_drill", "wall_breaker", "due_at_kickoff", "scrimmage_door"];
const VOICE_GATE = { min_shadows: 10, min_hit_rate: 0.7 };   // proven, not vibes

// SCORING WINDOWS — every one of these is the value that was ALREADY hard-coded
// inline in the shipped scorer, lifted to a named key so it can be read, not
// guessed at. Nothing here is a new number:
//   STOPPAGE_WINDOW_MS   was `45 * 60000` inside scoreShadow's stoppage branch.
//   KICKOFF_DEADLINE     was the literal "12:00" inside its kickoff branch.
//   SPIN_WINDOW_ROWS/MIN were `.slice(-4)` and `>= 2` in main()'s fact builder.
const STOPPAGE_WINDOW_MS = 45 * 60000;
const KICKOFF_DEADLINE = "12:00";
const SPIN_WINDOW_ROWS = 4;
const SPIN_MIN_ROWS = 2;

const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
// THE CAPTAIN'S MIDNIGHT (IST sweep, 26 Jul 2026). reps_log and shadow_log both
// stamp `ts` as UTC ISO, but every comparison below is against localDate() = IST.
// Slicing the raw stamp buckets anything logged 00:00-05:30 IST into YESTERDAY:
// gatherWorld saw "0 reps today" during a night session, and the once-per-day
// dedupe set came back EMPTY so the same shadow re-fired every 10-minute tick all
// night. Same rule physio/touchline/scorer run — parse, then format in his day.
const localDayOf = (ts) => {
  const str = String(ts || "");
  if (!/[T ]/.test(str)) return str.slice(0, 10);
  const d = new Date(str);
  return Number.isFinite(d.getTime()) ? localDate(d) : str.slice(0, 10);
};

const hhmmOf = (now) => `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch { } return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch { } } } catch { } return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// DETECTION (pure) — would-have-spoken moments from the live bus
// world = { verdict, struggle_verdict, reps_today, last_rep_ago_min,
//           drills_pending, staged_scrimmage, hhmm }
// ---------------------------------------------------------------------------
function detectShadows(world, alreadyToday = new Set(), now = new Date()) {
  const out = [];
  if (String(world.verdict || "GREEN").toUpperCase() === "RED") return out;   // RED: not even shadows
  const push = (type, evidence, would) => { if (!alreadyToday.has(type)) out.push({ ts: now.toISOString(), type, evidence, would, resolved: false }); };

  if (world.struggle_verdict === "spinning")
    push("wall_breaker", "struggle=spinning", "the green-ball line — same crack, a different door is queued");
  if ((world.reps_today || 0) > 0 && (world.last_rep_ago_min ?? Infinity) >= 60 && world.hhmm >= "10:00" && world.hhmm <= "20:00" && world.drills_pending)
    push("stoppage_next_drill", `last rep ${world.last_rep_ago_min}min ago, drills pending`, "offer the next set piece at the stoppage");
  if (world.hhmm >= "10:30" && world.hhmm <= "12:00" && (world.reps_today || 0) === 0 && world.drills_pending)
    push("due_at_kickoff", "no reps by late morning, packet compiled", "the kickoff nudge — first ball is winnable");
  if (world.staged_scrimmage)
    push("scrimmage_door", "scout staged a scrimmage, trigger met", "offer the scrimmage door, once");
  return out;
}

// ---------------------------------------------------------------------------
// SCORING (pure) — evening resolution: would it have helped?
// dayFacts = { rep_times_iso: [..], spinning_persisted, first_rep_hhmm, scrimmage_played }
// ---------------------------------------------------------------------------
// FROZEN VERBATIM (CLAUDE.md layering law) — the engine that shipped 18 Jul →
// 4 Aug 2026. Superseded by scoreShadow below because its `due_at_kickoff`
// branch counted its own trigger as a hit (see the TAUTOLOGY GUARD there).
// Kept as the reference for what any pre-existing verdict was computed with.
// Not called on any live path.
function scoreShadowLegacy(moment, facts) {
  if (moment.type === "wall_breaker")
    return { hit: !!facts.spinning_persisted, basis: facts.spinning_persisted ? "spinning persisted — the line would have helped" : "he broke out himself — silence was right" };
  if (moment.type === "stoppage_next_drill") {
    const t0 = new Date(moment.ts).getTime();
    const resumed = (facts.rep_times_iso || []).some(t => { const ms = new Date(t).getTime() - t0; return ms > 0 && ms <= 45 * 60000; });
    return { hit: !resumed, basis: resumed ? "he resumed on his own inside 45min" : "no return inside 45min — the offer would have helped" };
  }
  if (moment.type === "due_at_kickoff") {
    const late = !facts.first_rep_hhmm || facts.first_rep_hhmm >= "12:00";
    return { hit: late, basis: late ? "kickoff slid past noon — the nudge would have helped" : "he kicked off soon after — no nudge needed" };
  }
  if (moment.type === "scrimmage_door")
    return { hit: !facts.scrimmage_played, basis: facts.scrimmage_played ? "he walked through the door himself" : "door stayed shut — the offer would have helped" };
  return { hit: false, basis: "unknown type — never counts a hit it can't explain" };
}

// PLAN OF RECORD. Identical to the legacy engine except that a verdict it
// cannot honestly derive now returns `{hit:null, unscorable:true}` instead of a
// hit — and an unscorable moment never enters the ledger's arithmetic.
function scoreShadow(moment, facts) {
  if (moment.type === "wall_breaker")
    return { hit: !!facts.spinning_persisted, basis: facts.spinning_persisted ? "spinning persisted — the line would have helped" : "he broke out himself — silence was right" };
  if (moment.type === "stoppage_next_drill") {
    const t0 = new Date(moment.ts).getTime();
    const resumed = (facts.rep_times_iso || []).some(t => { const ms = new Date(t).getTime() - t0; return ms > 0 && ms <= STOPPAGE_WINDOW_MS; });
    return { hit: !resumed, basis: resumed ? `he resumed on his own inside ${STOPPAGE_WINDOW_MS / 60000}min` : `no return inside ${STOPPAGE_WINDOW_MS / 60000}min — the offer would have helped` };
  }
  if (moment.type === "due_at_kickoff") {
    // TAUTOLOGY GUARD (audit #52, verifier's FIX CORRECTION 2). This shadow is
    // RAISED by "no reps by late morning" (detectShadows, :74). The legacy hit
    // test was `!first_rep_hhmm || first_rep_hhmm >= "12:00"` — so on a day he
    // logged nothing at all, the hit condition is satisfied by the very same
    // fact that raised the shadow. Scored that way the type reaches a ~100%
    // hit-rate purely by measuring idleness, and at 10 shadows it would open the
    // ratification door on no evidence whatsoever. A day with zero reps carries
    // no information about whether a nudge would have landed: refuse it.
    if (!facts.first_rep_hhmm)
      return { hit: null, unscorable: true, basis: "no rep logged at all that day — whether the nudge would have helped is UNMEASURABLE; refusing to score it as a hit (that would just be the trigger, counted twice)" };
    const late = facts.first_rep_hhmm >= KICKOFF_DEADLINE;
    return { hit: late, basis: late ? `first rep at ${facts.first_rep_hhmm}, past ${KICKOFF_DEADLINE} — the nudge would have helped` : `he kicked off at ${facts.first_rep_hhmm} — no nudge needed` };
  }
  if (moment.type === "scrimmage_door")
    return { hit: !facts.scrimmage_played, basis: facts.scrimmage_played ? "he walked through the door himself" : "door stayed shut — the offer would have helped" };
  return { hit: null, unscorable: true, basis: `unknown type '${moment.type}' — never counts a hit it can't explain` };
}

// ---------------------------------------------------------------------------
// FACT ASSEMBLY — per shadow-DAY, never "today" (audit #52, the critical bug)
// ---------------------------------------------------------------------------
// FROZEN VERBATIM (layering law) — the fact builder that lived inline in main()'s
// `score` branch. It is the bug: `reps` is filtered to localDate(now) and the
// struggle window is the last 4 history rows regardless of date, while the row
// selector above it took EVERY unresolved shadow ever logged. Kept so the defect
// is readable rather than merely described. NEVER CALL IT.
function gatherFactsLegacy(now) {
  const reps = readLines(REPS_LOG).filter(r => localDayOf(r.ts) === localDate(now));
  const hist = readLines(PITCH_HIST).slice(-4);
  return {
    rep_times_iso: reps.map(r => r.ts),
    first_rep_hhmm: reps.length ? hhmmOf(new Date(reps[0].ts)) : null,
    spinning_persisted: hist.filter(h => h.struggle === "spinning").length >= 2,
    scrimmage_played: reps.some(r => /scrimmage/i.test(r.note || "")),
  };
}

// PLAN OF RECORD (pure — sources injected so the selftest can prove the scoping).
// `day` is a captain-local YYYY-MM-DD. Every fact is drawn from that day only;
// the struggle window ends ON that day so a later "spinning" run cannot leak
// backwards into an older shadow's verdict.
function factsForDay(day, src = {}) {
  const reps = (src.reps || [])
    .filter(r => localDayOf(r.ts) === day)
    .sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  const hist = (src.history || [])
    .filter(h => String(h.date || "") <= day)
    .slice(-SPIN_WINDOW_ROWS);
  const scrimRows = (src.scrimmageRows || []).filter(r => localDayOf(r.ts) === day);
  return {
    day,
    rep_times_iso: reps.map(r => r.ts),
    first_rep_hhmm: reps.length ? hhmmOf(new Date(reps[0].ts)) : null,
    spinning_persisted: hist.filter(h => h.struggle === "spinning").length >= SPIN_MIN_ROWS,
    // two witnesses: a rep the dugout tagged (dugout.mjs:1129 writes
    // note:"scrimmage-voice") OR a hedge row from the scrimmage-mode ear.
    scrimmage_played: reps.some(r => /scrimmage/i.test(r.note || "")) || scrimRows.length > 0,
    // measurement receipts — so a zero in the ledger is readable as MEASURED
    // rather than as an organ that had nothing to look at (audit rule: never
    // render an unmeasured silence as a measured zero)
    have: { reps: reps.length, history_rows: hist.length, scrimmage_rows: scrimRows.length },
  };
}
const gatherFactsForDay = (day) => factsForDay(day, {
  reps: readLines(REPS_LOG), history: readLines(PITCH_HIST), scrimmageRows: readLines(SCRIM_LOG),
});

// MATURITY (pure) — is this shadow's evidence window provably closed? Scoring a
// moment before its window shuts is the same class of lie as scoring it against
// the wrong day: a 21:40 stoppage judged at 21:45 "never came back" is a verdict
// about 5 minutes dressed up as a verdict about 45.
function maturity(moment, now = new Date()) {
  const day = localDayOf(moment.ts);
  const today = localDate(now);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { mature: false, why: `unparseable timestamp '${moment.ts}' — cannot place it on a day, so it cannot be judged` };
  if (day > today) return { mature: false, why: `stamped ${day}, ahead of today (${today})` };
  if (day < today) return { mature: true, why: `${day} is closed — its facts are final` };
  // same day: only the types whose own window has demonstrably elapsed
  if (moment.type === "stoppage_next_drill") {
    const mins = Math.max(0, Math.round((now.getTime() - new Date(moment.ts).getTime()) / 60000));
    const need = STOPPAGE_WINDOW_MS / 60000;
    return mins >= need ? { mature: true, why: `${mins}/${need} min return window elapsed` } : { mature: false, why: `${mins}/${need} min of the return window elapsed` };
  }
  if (moment.type === "due_at_kickoff") {
    const nowHhmm = hhmmOf(now);
    return nowHhmm >= KICKOFF_DEADLINE ? { mature: true, why: `${nowHhmm} ≥ ${KICKOFF_DEADLINE} — the kickoff verdict is decidable` } : { mature: false, why: `it is ${nowHhmm}; the kickoff verdict is not decidable before ${KICKOFF_DEADLINE}` };
  }
  return { mature: false, why: "day-aggregate evidence — final only once the day closes" };
}

// ---------------------------------------------------------------------------
// LEDGER (pure) — hit-rates open the door; ONLY the captain's word walks through
// ---------------------------------------------------------------------------
function updateLedger(prev, resolvedMoments) {
  const led = prev && prev.types ? JSON.parse(JSON.stringify(prev)) : { types: {} };
  for (const t of TYPES) led.types[t] = led.types[t] || { shadows: 0, hits: 0, unscorable: 0, hit_rate: null, eligible: false, ratified: false, voice: false };
  for (const m of resolvedMoments) {
    const e = led.types[m.type]; if (!e) continue;
    e.unscorable = e.unscorable || 0;
    // an UNSCORABLE moment is counted as seen but never as evidence — it moves
    // neither the numerator nor the denominator of the gate (audit #52)
    if (m.unscorable || m.hit === null || m.hit === undefined) { e.unscorable += 1; continue; }
    e.shadows += 1; e.hits += m.hit ? 1 : 0;
  }
  for (const t of TYPES) {
    const e = led.types[t];
    e.unscorable = e.unscorable || 0;
    e.hit_rate = e.shadows ? Math.round(100 * e.hits / e.shadows) / 100 : null;
    e.eligible = e.shadows >= VOICE_GATE.min_shadows && (e.hit_rate || 0) >= VOICE_GATE.min_hit_rate;
    e.voice = !!(e.eligible && e.ratified);   // ratification NEVER survives losing eligibility
    // #106 — have/need, never the bare word. The counter IS the status.
    e.progress = `${e.shadows}/${VOICE_GATE.min_shadows} scorable shadows · ${e.hits} hit(s) · hit-rate ${e.hit_rate ?? "—"} (need ≥${VOICE_GATE.min_hit_rate})`
      + (e.unscorable ? ` · ${e.unscorable} unscorable (no evidence either way)` : "");
  }
  led.gate = VOICE_GATE;
  // HONESTY FLAG (audit rule: an unmeasured silence is not a measured zero).
  // Three live readers take this file — dugout.mjs:166, :540, :1082 — and until
  // `score` had a caller they read 0/10 as "trained and failed" when the truth
  // was "never scored". Say which it is, in the file itself.
  led.scored_total = TYPES.reduce((n, t) => n + led.types[t].shadows + led.types[t].unscorable, 0);
  led.never_scored = led.scored_total === 0;
  led.note = led.never_scored
    ? "no shadow has ever been scored — every 0 below is UNMEASURED, not a measured zero. Run: node scripts/shadow.mjs score"
    : null;
  led.updated = new Date().toISOString();
  return led;
}
// THE CAPTAIN'S OVERRIDE (11 Aug 2026 — HIS RULING, verbatim: "remove it right
// now. my adhd brain won't remember shit").
//
// The two-key gate below (eligible = shadow evidence · ratified = his word) was
// built so the machine could not nag him on a hunch. It assumes ONE thing that
// turned out to be false for him: that he would still be reminded some other way
// while the evidence accumulated. He will not — not remembering is the condition
// the organism exists to carry, and making him wait ~10 shadows to be told what
// is due asks his ADHD to cover for the machine's caution.
//
// So the FIRST key becomes overridable BY HIM and only by him. What is preserved:
//   · the second key still exists — an override is still HIS explicit word
//   · `eligible` is NOT faked; it stays the honest measurement it always was
//   · `overridden` is stamped so the ledger says WHY the mouth opened, and the
//     evidence lane keeps scoring underneath (if it later proves itself, the row
//     stops depending on the override)
//   · one word reverts it: `shadow.mjs unratify <type>`
// This is a captain's exception to a design law, recorded as one. It is NOT the
// law being deleted: an unratified type is still mute, and `score` still refuses
// to invent eligibility.
function ratifyType(led, type, opts = {}) {
  const e = led && led.types && led.types[type];
  if (!e) return { ok: false, why: `unknown type '${type}'` };
  if (!e.eligible && !opts.captain) {
    const unmeasured = led && led.never_scored ? " — and nothing has been scored yet, so that 0 is UNMEASURED, not a measured zero" : "";
    const unscorable = e.unscorable ? `, ${e.unscorable} unscorable` : "";
    return { ok: false, why: `not proven yet — ${e.shadows}/${VOICE_GATE.min_shadows} shadows${unscorable}, hit-rate ${e.hit_rate ?? "—"} (needs ≥${VOICE_GATE.min_hit_rate})${unmeasured}. His word can still open it: shadow.mjs ratify ${type} --captain` };
  }
  if (e.ratified) return { ok: false, why: "already ratified" };
  e.ratified = true; e.voice = true;
  if (!e.eligible) {
    e.overridden = { at: new Date().toISOString(), why: "captain's override, 11 Aug 2026 — evidence gate waived by his ruling; the shadow lane keeps scoring underneath" };
    return { ok: true, why: `OVERRIDDEN by the captain — the mouth is open for '${type}' WITHOUT shadow evidence (${e.shadows}/${VOICE_GATE.min_shadows} shadows). Revert: shadow.mjs unratify ${type}` };
  }
  return { ok: true, why: "ratified by the captain's word — the mouth is earned for this type" };
}

// The revert door. A ratification he can only add and never take back is not a
// ruling, it is a trap — and an OVERRIDE especially needs one, because it opened
// on his word alone with no evidence behind it.
function unratifyType(led, type) {
  const e = led && led.types && led.types[type];
  if (!e) return { ok: false, why: `unknown type '${type}'` };
  if (!e.ratified) return { ok: false, why: `'${type}' is not ratified — nothing to walk back` };
  e.ratified = false; e.voice = false;
  const wasOverride = !!e.overridden;
  delete e.overridden;
  return { ok: true, why: `'${type}' is MUTE again${wasOverride ? " (the captain's override is withdrawn)" : ""}` };
}

// ---------------------------------------------------------------------------
// selftest — fixtures only
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const now = new Date(2026, 6, 12, 11, 0, 0);

  // detection
  const spin = detectShadows({ verdict: "GREEN", struggle_verdict: "spinning", hhmm: "11:00" }, new Set(), now);
  assert("spinning → wall_breaker shadow (silent by construction)", spin.length === 1 && spin[0].type === "wall_breaker" && spin[0].resolved === false);
  assert("RED → not even shadows (rest is rest)", detectShadows({ verdict: "RED", struggle_verdict: "spinning", hhmm: "11:00" }, new Set(), now).length === 0);
  assert("one shadow per type per day (no spam in the dark)", detectShadows({ verdict: "GREEN", struggle_verdict: "spinning", hhmm: "11:00" }, new Set(["wall_breaker"]), now).length === 0);
  const stop = detectShadows({ verdict: "GREEN", reps_today: 5, last_rep_ago_min: 75, drills_pending: true, hhmm: "14:00" }, new Set(), now);
  assert("long stoppage with drills pending → next-drill shadow", stop.some(m => m.type === "stoppage_next_drill"));
  assert("no stoppage shadow while he's working (rep 10min ago)", detectShadows({ verdict: "GREEN", reps_today: 5, last_rep_ago_min: 10, drills_pending: true, hhmm: "14:00" }, new Set(), now).length === 0);
  assert("no reps by 10:30 + packet ready → kickoff shadow", detectShadows({ verdict: "GREEN", reps_today: 0, drills_pending: true, hhmm: "10:45" }, new Set(), now).some(m => m.type === "due_at_kickoff"));
  assert("staged scrimmage → door shadow", detectShadows({ verdict: "GREEN", staged_scrimmage: true, hhmm: "15:00" }, new Set(), now).some(m => m.type === "scrimmage_door"));

  // scoring
  const wb = { ts: now.toISOString(), type: "wall_breaker" };
  assert("wall_breaker HIT when spinning persisted", scoreShadow(wb, { spinning_persisted: true }).hit === true);
  assert("wall_breaker MISS when he broke out himself", scoreShadow(wb, { spinning_persisted: false }).hit === false);
  const sd = { ts: now.toISOString(), type: "stoppage_next_drill" };
  assert("stoppage MISS when he resumed inside 45min (silence was right)", scoreShadow(sd, { rep_times_iso: [new Date(now.getTime() + 20 * 60000).toISOString()] }).hit === false);
  assert("stoppage HIT when no return inside 45min", scoreShadow(sd, { rep_times_iso: [] }).hit === true);
  assert("kickoff HIT when first rep slid past noon", scoreShadow({ type: "due_at_kickoff" }, { first_rep_hhmm: "13:10" }).hit === true);
  assert("kickoff MISS when he kicked off himself", scoreShadow({ type: "due_at_kickoff" }, { first_rep_hhmm: "11:05" }).hit === false);
  assert("unknown type never counts a hit", scoreShadow({ type: "??" }, {}).hit !== true && scoreShadow({ type: "??" }, {}).unscorable === true);

  // #52 TAUTOLOGY GUARD — an absent day is not evidence
  const dk = { type: "due_at_kickoff" };
  assert("kickoff on a day with ZERO reps is UNSCORABLE, never a hit (the trigger is not the evidence)",
    scoreShadow(dk, { first_rep_hhmm: null }).unscorable === true && scoreShadow(dk, { first_rep_hhmm: null }).hit === null);
  assert("legacy engine frozen verbatim and still scores that day a HIT (this is what changed)",
    scoreShadowLegacy(dk, { first_rep_hhmm: null }).hit === true);

  // #52 DATE-SCOPING — facts come from the shadow's OWN day, never from today
  const srcs = {
    reps: [
      { ts: "2026-07-18T06:00:00.000Z", note: "" },
      { ts: "2026-08-02T04:00:00.000Z", note: "scrimmage-voice" },
    ],
    // 18 Jul sits at the END of a quiet run (1 spinning row in its last 4);
    // the spinning burst arrives AFTER it. Day-blind slicing would hand 18 Jul
    // the burst it never lived through — that is the leak being tested.
    history: [
      { date: "2026-07-15", struggle: "no_data" },
      { date: "2026-07-16", struggle: "no_data" },
      { date: "2026-07-17", struggle: "no_data" },
      { date: "2026-07-18", struggle: "spinning" },
      { date: "2026-08-01", struggle: "spinning" },
      { date: "2026-08-02", struggle: "spinning" },
    ],
    scrimmageRows: [{ ts: "2026-08-02T05:00:00.000Z" }],
  };
  const f18 = factsForDay("2026-07-18", srcs);
  const f02 = factsForDay("2026-08-02", srcs);
  assert("facts are drawn from the shadow's own day (18 Jul sees 1 rep, not 2 Aug's)",
    f18.rep_times_iso.length === 1 && f18.rep_times_iso[0] === "2026-07-18T06:00:00.000Z" && f18.have.reps === 1);
  assert("a later day's reps never leak backwards into an older shadow's verdict",
    !f18.rep_times_iso.includes("2026-08-02T04:00:00.000Z") && f18.scrimmage_played === false);
  assert("struggle window ENDS on the shadow's day — a later spinning burst cannot leak backwards (18 Jul: 1 of its last 4)",
    f18.spinning_persisted === false && f18.have.history_rows === SPIN_WINDOW_ROWS);
  assert("the SAME rows judged on 2 Aug do persist (3 of its last 4) — the window moved, the data did not",
    f02.spinning_persisted === true);
  assert("scrimmage has two witnesses (tagged rep OR the scrimmage-mode ear)", f02.scrimmage_played === true && f02.have.scrimmage_rows === 1);
  assert("evidence receipts ride with the facts (a zero is readable as measured)",
    typeof f18.have.reps === "number" && typeof f18.have.history_rows === "number");
  const dayBlind = gatherFactsLegacy(new Date(2026, 6, 18));
  assert("legacy day-blind builder kept in the file (frozen, uncalled)", typeof dayBlind === "object" && dayBlind.rep_times_iso !== undefined);

  // #52 MATURITY — never judge a window that has not closed
  const at2145 = new Date(2026, 6, 12, 21, 45, 0);
  assert("a closed day is scorable", maturity({ ts: new Date(2026, 6, 11, 11, 0).toISOString(), type: "wall_breaker" }, at2145).mature === true);
  assert("today's day-aggregate shadow is deferred until the day closes",
    maturity({ ts: new Date(2026, 6, 12, 11, 0).toISOString(), type: "wall_breaker" }, at2145).mature === false);
  assert("a stoppage 5 min old is NOT judged on a 45-min window (have/need in the reason)",
    (() => { const r = maturity({ ts: new Date(2026, 6, 12, 21, 40).toISOString(), type: "stoppage_next_drill" }, at2145); return r.mature === false && /5\/45 min/.test(r.why); })());
  assert("a stoppage past its 45-min window IS judged",
    maturity({ ts: new Date(2026, 6, 12, 20, 30).toISOString(), type: "stoppage_next_drill" }, at2145).mature === true);
  assert("kickoff undecidable before noon, decidable after",
    maturity({ ts: new Date(2026, 6, 12, 10, 45).toISOString(), type: "due_at_kickoff" }, new Date(2026, 6, 12, 11, 0)).mature === false
    && maturity({ ts: new Date(2026, 6, 12, 10, 45).toISOString(), type: "due_at_kickoff" }, at2145).mature === true);
  assert("a future-stamped or unparseable shadow is never scored",
    maturity({ ts: new Date(2026, 6, 20, 9, 0).toISOString(), type: "wall_breaker" }, at2145).mature === false
    && maturity({ ts: "garbage", type: "wall_breaker" }, at2145).mature === false);

  // #37 — the scout↔shadow field contract
  assert("#37 staged scrimmage with explicit trigger_met reads TRUE", stagedTriggerMet({ kind: "scrimmage", trigger_met: true }) === true);
  assert("#37 legacy scout.json shape ({kind,trigger,brief}) is honoured, not silently dropped",
    stagedTriggerMet({ kind: "scrimmage", trigger: "3 core concepts at DEFEND grade (threshold 3)" }) === true);
  assert("#37 an explicit trigger_met:false still means no", stagedTriggerMet({ kind: "scrimmage", trigger: "x", trigger_met: false }) === false);
  assert("#37 an empty/absent trigger is not a met trigger", stagedTriggerMet({ kind: "scrimmage" }) === false && stagedTriggerMet({ kind: "scrimmage", trigger: "  " }) === false);

  // ledger + the two-key gate
  let led = updateLedger(null, Array(9).fill({ type: "wall_breaker", hit: true }));
  assert("9 perfect shadows still NOT eligible (volume gate)", led.types.wall_breaker.eligible === false);
  led = updateLedger(led, [{ type: "wall_breaker", hit: true }]);
  assert("10th shadow at 100% → door OPENS (eligible)", led.types.wall_breaker.eligible === true && led.types.wall_breaker.voice === false);
  assert("eligibility alone NEVER voices (his word is the second key)", led.types.wall_breaker.voice === false);
  const r1 = ratifyType(led, "wall_breaker");
  assert("captain's ratification walks through the open door", r1.ok === true && led.types.wall_breaker.voice === true);
  const led2 = updateLedger(null, [{ type: "due_at_kickoff", hit: false }, { type: "due_at_kickoff", hit: true }]);
  const r2 = ratifyType(led2, "due_at_kickoff");
  assert("ratify REFUSED before the proof (honest refusal, with numbers)", r2.ok === false && r2.why.includes("not proven"));
  assert("hit-rate math honest", led2.types.due_at_kickoff.hit_rate === 0.5);

  // --- THE CAPTAIN'S OVERRIDE (11 Aug 2026 ruling) --------------------------
  // The refusal must TEACH the door, not just say no; the override must open the
  // mouth WITHOUT faking the evidence; and it must be walk-back-able. All three,
  // because an override that hides itself in the ledger is worse than no override.
  assert("the honest refusal now NAMES the captain's door instead of dead-ending him",
    /--captain/.test(r2.why));
  const ledOv = updateLedger(null, [{ type: "due_at_kickoff", hit: false }]);
  const rOv = ratifyType(ledOv, "due_at_kickoff", { captain: true });
  assert("OVERRIDE opens the mouth with zero evidence, on his word alone",
    rOv.ok === true && ledOv.types.due_at_kickoff.voice === true);
  assert("OVERRIDE never fakes the measurement — eligible stays honestly false",
    ledOv.types.due_at_kickoff.eligible === false);
  assert("OVERRIDE stamps WHY the mouth opened (a silent override is an unexplainable ledger)",
    !!ledOv.types.due_at_kickoff.overridden && /captain/i.test(ledOv.types.due_at_kickoff.overridden.why));
  const rUn = unratifyType(ledOv, "due_at_kickoff");
  assert("UNRATIFY walks it back — mute again, and the override stamp is gone",
    rUn.ok === true && ledOv.types.due_at_kickoff.voice === false
    && ledOv.types.due_at_kickoff.ratified === false && !ledOv.types.due_at_kickoff.overridden);
  assert("UNRATIFY on a mute type refuses honestly rather than pretending it did something",
    unratifyType(ledOv, "due_at_kickoff").ok === false);
  assert("OVERRIDE is opt-in only — a plain ratify on unproven evidence still refuses",
    ratifyType(updateLedger(null, [{ type: "scrimmage_door", hit: true }]), "scrimmage_door").ok === false);
  led.types.wall_breaker.hits = 2; led.types.wall_breaker.shadows = 10;
  const led3 = updateLedger(led, []);
  assert("voice REVOKED if the hit-rate decays (ratification can't outlive proof)", led3.types.wall_breaker.voice === false);

  // #52/#106 — unscorable moments and the unmeasured-vs-measured zero
  const ledU = updateLedger(null, [{ type: "due_at_kickoff", hit: null, unscorable: true }, { type: "due_at_kickoff", hit: null, unscorable: true }]);
  assert("unscorable moments move NEITHER numerator nor denominator of the gate",
    ledU.types.due_at_kickoff.shadows === 0 && ledU.types.due_at_kickoff.hits === 0 && ledU.types.due_at_kickoff.unscorable === 2);
  assert("but they are still counted and shown (seen ≠ evidence)", /2 unscorable/.test(ledU.types.due_at_kickoff.progress));
  const ledEmpty = updateLedger(null, []);
  assert("#106 an all-zero ledger says its zeros are UNMEASURED, not measured",
    ledEmpty.never_scored === true && /UNMEASURED/.test(ledEmpty.note));
  assert("#106 every type carries a have/need counter, not a bare word",
    TYPES.every(t => /^\d+\/10 scorable shadows/.test(ledEmpty.types[t].progress)));
  assert("#106 refusing ratification on an unscored ledger admits the 0 is unmeasured",
    /UNMEASURED/.test(ratifyType(ledEmpty, "wall_breaker").why));
  assert("a ledger with real evidence stops claiming it is unmeasured", ledU.never_scored === false && ledU.note === null);

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
// #37 — THE FIELD CONTRACT. This read used to be a bare `s.trigger_met`, a field
// scout.mjs has NEVER emitted (it emits `{kind, trigger, brief}`), so
// `staged_scrimmage` was false on every scrimmage the scout ever genuinely
// staged and the scrimmage_door shadow could not fire. scout.mjs now emits
// `trigger_met:true` explicitly and its selftest pins it. This reader accepts
// BOTH shapes so the scout.json already on disk — written by the old code — is
// not silently ignored: scout only ever pushes a staged row once its threshold
// has passed, so a row carrying a non-empty `trigger` string IS a met trigger.
// An explicit `trigger_met:false` still means no.
const stagedTriggerMet = (s) => s && (s.trigger_met === true || (s.trigger_met === undefined && typeof s.trigger === "string" && s.trigger.trim().length > 0));

function gatherWorld(now) {
  const reps = supersedeReps(readLines(join(STATE_DIR, "reps_log.jsonl"))).filter(r => localDayOf(r.ts) === localDate(now));
  const lastRep = reps.length ? new Date(reps[reps.length - 1].ts) : null;
  const drills = readJson(join(STATE_DIR, "drills.json")) || {};
  const pr = readJson(join(STATE_DIR, "pitch_read.json")) || {};
  return {
    verdict: (readJson(join(STATE_DIR, "readiness.json")) || {}).verdict || "GREEN",
    struggle_verdict: pr.struggle ? pr.struggle.verdict : "no_data",
    reps_today: reps.length,
    last_rep_ago_min: lastRep ? Math.round((now - lastRep) / 60000) : null,
    drills_pending: Array.isArray(drills.drills) && drills.drills.length > 0,
    staged_scrimmage: ((readJson(join(STATE_DIR, "scout.json")) || {}).staged || []).some(s => s.kind === "scrimmage" && stagedTriggerMet(s)),
    hhmm: hhmmOf(now),
  };
}

async function main() {
  const mode = (process.argv[2] || "detect").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const now = new Date();

  if (mode === "detect") {
    const today = localDate(now);
    const already = new Set(readLines(SHADOW_LOG).filter(l => localDayOf(l.ts) === today).map(l => l.type));
    const moments = detectShadows(gatherWorld(now), already, now);
    for (const m of moments) appendFileSync(SHADOW_LOG, JSON.stringify(m) + "\n");
    console.log(`shadow: ${moments.length} shadow(s) logged silently${moments.length ? " [" + moments.map(m => m.type).join(", ") + "]" : ""} — the mouth stays shut`);
    return;
  }
  if (mode === "score") {
    // DATE-SCOPED (audit #52). Each unresolved moment is judged against the facts
    // of its OWN local day, and only once that day's window has closed. Facts are
    // cached per day so a catch-up run over N days costs three file reads, not 3N.
    const unresolved = readLines(SHADOW_LOG).filter(l => !l.resolved);
    if (!unresolved.length) { console.log("shadow: nothing to score — 0 unresolved rows in shadow_log.jsonl"); return; }
    const factsCache = new Map();
    const resolved = [], deferred = [];
    for (const m of unresolved) {
      const mat = maturity(m, now);
      if (!mat.mature) { deferred.push({ type: m.type, day: localDayOf(m.ts), why: mat.why }); continue; }
      const day = localDayOf(m.ts);
      if (!factsCache.has(day)) factsCache.set(day, gatherFactsForDay(day));
      const facts = factsCache.get(day);
      const { hit, basis, unscorable } = scoreShadow(m, facts);
      m.resolved = true; m.hit = hit; m.basis = basis; m.scored_at = now.toISOString();
      m.scored_against_day = day;          // the receipt: WHICH day's facts judged it
      m.evidence_counts = facts.have;      // and how much evidence that day actually held
      if (unscorable) m.unscorable = true;
      resolved.push(m);
    }
    // MERGE-SAFE REWRITE. `detect` appends to this same file every 10 minutes;
    // the old truncate-and-write dropped any row appended while scoring ran.
    // Re-read, patch by (ts|type), write atomically.
    const keyOf = (l) => `${l.ts}|${l.type}`;
    const patch = new Map(resolved.map(m => [keyOf(m), m]));
    const fresh = readLines(SHADOW_LOG).map(l => patch.get(keyOf(l)) || l);
    if (fresh.length) writeAtomic(SHADOW_LOG, fresh.map(l => JSON.stringify(l)).join("\n") + "\n");
    const led = updateLedger(readJson(LEDGER), resolved);
    led.deferred = deferred;               // honesty: what was NOT scored, and why
    writeAtomic(LEDGER, led);
    const counted = resolved.filter(m => !m.unscorable);
    console.log(
      `shadow: scored ${resolved.length}/${unresolved.length} unresolved`
      + (counted.length ? ` [${counted.map(m => `${m.scored_against_day} ${m.type}:${m.hit ? "hit" : "miss"}`).join(", ")}]` : "")
      + (resolved.length - counted.length ? ` · ${resolved.length - counted.length} unscorable (no evidence either way — NOT counted as hits)` : "")
      + (deferred.length ? ` · ${deferred.length} deferred [${deferred.map(d => `${d.day} ${d.type}: ${d.why}`).join("; ")}]` : "")
      + " → proactivity_ledger.json"
    );
    return;
  }
  if (mode === "ratify") {
    const type = process.argv[3];
    // --captain = HIS override of the evidence gate (11 Aug 2026 ruling). Named,
    // not silent: the flag has to be typed, so nothing opens the mouth by accident.
    const captain = process.argv.includes("--captain");
    const led = readJson(LEDGER) || updateLedger(null, []);
    const r = ratifyType(led, type, { captain });
    if (r.ok) writeAtomic(LEDGER, led);
    console.log(`shadow: ratify ${type} → ${r.why}`);
    process.exit(r.ok ? 0 : 1);
  }
  if (mode === "unratify") {
    const type = process.argv[3];
    const led = readJson(LEDGER) || updateLedger(null, []);
    const r = unratifyType(led, type);
    if (r.ok) writeAtomic(LEDGER, led);
    console.log(`shadow: unratify ${type} → ${r.why}`);
    process.exit(r.ok ? 0 : 1);
  }
  if (mode === "status") {
    // #106 — every line is a have/need counter, and an unmeasured 0 says so.
    const onDisk = readJson(LEDGER);
    const led = onDisk || updateLedger(null, []);
    const unresolvedCount = readLines(SHADOW_LOG).filter(l => !l.resolved).length;
    if (!onDisk) console.log(`  (proactivity_ledger.json does not exist — nothing has ever been scored. ${unresolvedCount} shadow(s) sit unresolved in shadow_log.jsonl.)`);
    else if (led.note) console.log(`  (${led.note})`);
    for (const [t, e] of Object.entries(led.types))
      console.log(`  ${t}: ${e.progress || `${e.shadows}/${VOICE_GATE.min_shadows} scorable shadows · hit-rate ${e.hit_rate ?? "—"}`} · ${e.voice ? "VOICE EARNED" : e.eligible ? "door open, awaiting his word" : "training silently"}`);
    if (unresolvedCount) console.log(`  unresolved and awaiting a score run: ${unresolvedCount} shadow(s) — node scripts/shadow.mjs score`);
    if (Array.isArray(led.deferred) && led.deferred.length)
      for (const d of led.deferred) console.log(`  deferred · ${d.day} ${d.type}: ${d.why}`);
    return;
  }
  console.log("shadow: modes — detect · score · ratify <type> · status · selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export {
  detectShadows, scoreShadow, updateLedger, ratifyType, TYPES, VOICE_GATE,
  factsForDay, maturity, stagedTriggerMet,
  scoreShadowLegacy, gatherFactsLegacy,   // frozen predecessors (layering law)
};
