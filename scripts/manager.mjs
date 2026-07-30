// ============================================================================
// scripts/manager.mjs — THE MANAGER · Agent #1 (roster) / capstone (build).
//
// WHAT:  The deterministic wrapper — §9 THE SPLIT, Part 1. NO LLM lives in here.
//        It globs the state bus, staleness-checks it, computes ALL the numbers
//        (the ONLY numbers allowed downstream), assembles the formation-read +
//        compressed prompt, calls a PLUGGED llm() (M-1 default = stub ⇒ always
//        falls back), validates the output (template · line-cap · no-invented-
//        number), and writes team_sheet.md — the sheet appears UNCONDITIONALLY.
// SPLIT: Part 2 (Opus, judgment only) is M-3 — it swaps the stub for `claude -p`.
//        Opus never does math and never invents a number; it reasons over the
//        FEATURES this wrapper computed.  (THE_MANAGER §9.)
// LAW:   Bias-to-silence propagates UP — a null / awaiting_data agent field
//        NEVER produces a line.  The fallback skeleton doubles as the cold-start
//        (Matchday-1 · Introduction) sheet.  (THE_MANAGER §5, §11 Example A.)
// READS (dressing-room/state/, all missing/parse-fail ⇒ null, never throws):
//        readiness.json · timeaudit.json · cards.json · calibration.json ·
//        weaknesses.json · learning_state.json · season.json · season_read.json ·
//        buckets.json (targets only — for the timeaudit bridge) · captain_note.md ·
//        post_match/<yesterday>.md
// WRITES (sole writer): team_sheet.md · manager_notes.json (run log — NOT
//        matches_played; that increments at post-match, a later milestone).
// MODES: node scripts/manager.mjs            → generate today's team sheet (real state)
//        node scripts/manager.mjs selftest   → baked mocks (real state never touched)
// GUARDS (M-3): ANTHROPIC_API_KEY never set + Extra-Usage OFF = hard $100 ceiling.
// ENV:   ESM entry-check uses pathToFileURL(process.argv[1]).  Atomic temp→rename.
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync, renameSync, mkdtempSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
// the timeaudit schema bridge lives in heartbeat.mjs (it named the mismatch first)
// and is imported, never re-implemented — see timeFeature() below. No cycle:
// heartbeat imports nothing local, and brain.mjs is the only importer of this file.
import { timeauditBridge } from "./heartbeat.mjs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";   // selftest ONLY — spawns THIS file to prove the CLI guard

const __dirname = dirname(fileURLToPath(import.meta.url));
// Script-anchored (CWD-independent, matches fsrs/calibration) — override via stateDir / ARSENAL_STATE_DIR.
const DEFAULT_STATE = join(__dirname, "..", "dressing-room", "state");
const mkP = (dir) => (f) => join(dir, f);
// LOCAL date (matches the signal agents' localDate) — NEVER UTC toISOString (that skews vs local-stamped agents).
const todayISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shiftDay = (iso, n) => { const [y, m, dd] = iso.split("-").map(Number); const d = new Date(y, m - 1, dd); d.setDate(d.getDate() + n); return todayISO(d); };

// ---- load bus (missing / parse-fail ⇒ null, never throws) -------------------
function loadBus(P, today) {
  const readJSON = (f) => { try { return JSON.parse(readFileSync(P(f), "utf8")); } catch { return null; } };
  const readText = (f) => { try { return readFileSync(P(f), "utf8").trim(); } catch { return null; } };
  const yday = shiftDay(today, -1);
  return {
    readiness: readJSON("readiness.json"),
    timeaudit: readJSON("timeaudit.json"),
    cards: readJSON("cards.json"),
    calibration: readJSON("calibration.json"),
    weaknesses: readJSON("weaknesses.json"),
    learning_state: readJSON("learning_state.json"),
    season: readJSON("season.json"),
    season_read: readJSON("season_read.json"),         // M18 — the night's whole-season re-read
    // E2E audit (25 Jul 2026): needed by the timeaudit schema bridge below (buildingPctMin /
    // metaPctMax), exactly as heartbeat.mjs reads it. Config, not a signal ⇒ never staleness-gated.
    buckets: readJSON("buckets.json"),
    // THE TWO WITNESSES (30 Jul 2026). capsule_map = what the LOCKED capsules already
    // know (36 axes, 36 survived strike questions, a date-driven Re-Jirah schedule) —
    // richness the bus had never once read. shipped = artifacts produced, the second
    // witness beside the time camera, so a dark-camera day with work in it stops reading
    // as "you did nothing". Both are read-only here; the Manager only ever proposes.
    capsule_map: readJSON("capsule_map.json"),
    shipped: readJSON("shipped.json"),
    captain_note: readText("captain_note.md"),
    last_post_match: readText(join("post_match", yday + ".md")),
  };
}

// ---- staleness: a JSON source is fresh iff its `date` === today -------------
function readinessFresh(R, today) {
  if (R == null) return "missing";
  const day = R.day || R.date || null;                 // Goalkeeper stamps `day` (Oura sleep-day)
  if (!day) return "stale(?)";
  const lag = daysBetween(day, today);
  return (lag != null && lag >= 0 && lag <= 2) ? "fresh" : `stale(${day})`;   // Oura sync lag ≤2d is NORMAL
}
function staleness(bus, today) {
  const exact = (s) => s == null ? "missing" : (s.date === today ? "fresh" : `stale(${s.date || "?"})`);
  const map = { readiness: readinessFresh(bus.readiness, today) };
  for (const k of ["timeaudit", "cards", "calibration", "weaknesses", "learning_state"]) map[k] = exact(bus[k]);
  return map;
}

// ---- Season Arc phase (§6) — keyed on matches_played, regression-honest -----
function phaseFor(mp = 0) {
  if (mp <= 1) return { key: "introduction", emoji: "🤝", name: "Introduction" };
  if (mp <= 8) return { key: "building", emoji: "🌱", name: "Building Trust" };
  if (mp <= 25) return { key: "partnership", emoji: "🤜", name: "Partnership" };
  return { key: "brotherhood", emoji: "⚔️", name: "Brotherhood" };
}
function daysBetween(a, b) { const ms = Date.parse(b) - Date.parse(a); return Number.isFinite(ms) ? Math.round(ms / 86400000) : null; }

// ---- the timeaudit SCHEMA BRIDGE (E2E audit 25 Jul 2026) --------------------
// The Manager used to read timeaudit.json as {building_pct, building_target, meta_pct,
// on_track} — a shape NOTHING writes. The sole writer (timeaudit.mjs:191-206) emits
// {buckets:{Building:{pct},Meta:{pct}}, onTrack:boolean}; heartbeat.mjs:18-22 names this
// "the known schema mismatch" and bridges it into pulse.json — which manager.mjs never
// reads. Live result: F.time was all-null, the TIME report vanished from the sheet, and
// "Building null%/null%" was fed to the LLM as fact.
// LAYERING: the legacy flat read stays FIRST and untouched (legacy/dummy files still work);
// the real shape is bridged only when the flat fields are absent, mirroring heartbeat's
// timeauditBridge including the buckets.json targets (defaults 60 / 25).
// DE-DUPLICATED 26 Jul 2026: the bridge maths used to be COPIED here, because the
// fix agent that wrote it owned only this file and could not export from heartbeat.
// Two copies of one schema translation is a drift bug waiting to happen — the day
// buckets.json grows a third target, one of them silently disagrees with the other.
// heartbeat.mjs is the bridge's home (it named the mismatch first) and already
// exports it; this file now consumes that single source of truth and keeps ONLY
// the part that is genuinely its own: the legacy flat-shape passthrough.
function timeFeature(T, buckets) {
  if (!T) return null;
  // INSTRUMENTS DARK ≠ HE DID NOTHING (audit 30 Jul 2026 — the last existence-gate in this
  // function, the same class okWeak and okLS were fixed for). timeaudit.mjs writes
  // dataOk:false with every bucket at 0 when ActivityWatch is unreachable. Nothing consumed
  // that envelope, so an outage rendered as a hard "Building 0%/60% target — off track" and
  // handed Opus `on track: no` — the machine accusing him of a day it simply could not see.
  // A blind sensor reports blindness; it never reports a zero.
  if (T.dataOk === false) return { dark: true, why: T.note || "the time camera was unreachable — no reading, not a zero" };
  const flat = {
    building_pct: T.building_pct ?? null, building_target: T.building_target ?? null,
    meta_pct: T.meta_pct ?? null, on_track: T.on_track || null,
  };
  if (flat.building_pct != null || flat.meta_pct != null) return flat;   // legacy shape — verbatim
  if (!T.buckets) return flat;
  return timeauditBridge(T, buckets) || flat;                            // the ONE bridge, owned by heartbeat.mjs
}

// ---- FEATURES: the ONLY numbers allowed downstream. Everything null-safe. ----
// Bias-to-silence: a section is present ONLY when its agent is status "ok" with content.
// E2E audit (25 Jul 2026) — STALENESS IS NOW ENFORCED, not merely logged. staleness() was
// computed in runManager and then thrown away into manager_notes.json; every feature was
// built from the bus regardless of age. So a 5-day-old RED verdict kept cancelling GREEN
// days forever, and Friday's card counts rode Monday's sheet as today's numbers — the exact
// opposite of system.md's silence law ("a stale file means its number does not exist").
// `stale` is threaded in from runManager; a stale source degrades down the SAME null path a
// missing one already took, so bias-to-silence propagates for free. readiness keeps its ≤2d
// Oura-lag tolerance (readinessFresh) — that lag is normal, not staleness.
function computeFeatures(bus, today, stale = staleness(bus, today)) {
  const fresh = (k) => stale[k] === "fresh";
  const S = bus.season || {};
  const mp = Number.isInteger(S.matches_played) ? S.matches_played : 0;
  const phase = phaseFor(mp);
  const R = fresh("readiness") ? bus.readiness : null;   // stale body read ⇒ grind honored, not a stale verdict
  const T = fresh("timeaudit") ? bus.timeaudit : null;
  const okCards = fresh("cards") && bus.cards && bus.cards.status === "ok";
  const okCal = fresh("calibration") && bus.calibration && bus.calibration.status === "ok";
  // E2E audit (25 Jul 2026): the nemesis headline was consumed on presence ALONE — no status
  // gate, no freshness gate — although the block comment above already claimed status-ok was
  // the rule and cards/calibration honoured it. nemesis.mjs:237-242 deliberately emits a
  // headline while status="warming_up" / low_confidence=true (it is a floor signal for its own
  // consumers), so a 5-rep hunch rendered as a hard read in SQUAD REPORTS. system.md's silence
  // law is explicit: "warming_up means no headline".
  const okWeak = fresh("weaknesses") && bus.weaknesses && bus.weaknesses.status === "ok" && bus.weaknesses.low_confidence !== true;
  // AUDIT (30 Jul 2026) — the last existence-gate. `okLS` was `fresh && present`, and the
  // learning_state file ALWAYS exists, so at 2 reps its `warming_up` / low_confidence:true
  // formation (weak_connection, rejirah_due) rendered as a hard read — the same defect the
  // nemesis headline was fixed for five days earlier, in the same function. learning_state.mjs
  // suppresses its own axis rollups under warming_up for exactly this reason; the Manager now
  // honours that instead of reaching past it. Same shape as okWeak: status-ok AND not low-confidence.
  const okLS = fresh("learning_state") && bus.learning_state
    && bus.learning_state.status === "ok" && bus.learning_state.low_confidence !== true;
  // E2E audit (25 Jul 2026): R.safety was NEVER read and R.flags was only ever read as an
  // Array — but the real Goalkeeper writes flags as an OBJECT {clean, hr_low_confidence}
  // (oura_coach.mjs:422), so real flags always collapsed to [], and safety.refer_doctor with
  // its "SEE A DOCTOR" sentence (oura_coach.mjs:525-532) reached neither the sheet nor the
  // prompt. A doctor referral could sit in readiness.json under "ENERGY: GREEN — full ceiling".
  // Read from the RAW bus, NOT the staleness-gated R: per CLAUDE.md's medical boundary
  // ("sustained concerning physiology → DOCTOR-REFERRAL, full stop") a referral computed from
  // 3-day-old nights still stands. This file NEVER interprets it — it relays the Goalkeeper's
  // own sentence verbatim. The flags themselves stay in FEATURES only and are deliberately NOT
  // rendered/prompted: they are medication-influenced low-confidence signals and CLAUDE.md
  // forbids this system from commenting on them.
  const R0 = bus.readiness;
  const normFlags = (f) => Array.isArray(f) ? f                       // legacy/dummy shape — kept verbatim
    : (f && typeof f === "object") ? [...(f.clean || []), ...(f.hr_low_confidence || [])]
    : [];
  const safety = (R0 && R0.safety && R0.safety.refer_doctor)
    ? { refer_doctor: true, message: R0.safety.message || "SEE A DOCTOR — sustained concerning physiology. Take this to your physician." }
    : null;
  const kal = (() => { const pm = bus.last_post_match; if (!pm) return null; const m = pm.match(/KAL-?LINE\s*→\s*(.+)/i); return m ? m[1].trim() : null; })();
  return {
    date: today,
    matchday: mp + 1,                                  // today is the next match
    phase,
    season: {
      season_day: Number.isInteger(S.season_day) ? S.season_day : 1,
      matches_played: mp,
      trophy: S.trophy || "the trophy",
      trophy_state: S.trophy_state || "unlit",
      pipeline_item: S.pipeline_item || null,
      days_to_ship: S.target_ship ? daysBetween(today, S.target_ship) : null,
      paused_until: S.paused_until || null,
    },
    readiness: R ? {
      verdict: R.verdict || null, ceiling: R.ceiling || null,
      // real Goalkeeper: workType = array (not work_type_overlay); timing = object (not string) — normalise both
      work_type: Array.isArray(R.workType) ? R.workType : (R.work_type_overlay ? [R.work_type_overlay] : []),
      timing: R.timing || null,                        // object|string — rendered via shapeFromTiming()
      // E2E audit (25 Jul 2026): the real Goalkeeper writes the driver at tiers.verdict_driver
      // (oura_coach `tiers`), NOT signals.verdict_driver — so convergence was ALWAYS null on
      // live data and then read by nothing anyway. Both legacy paths kept; the real one added,
      // and it is now surfaced on the READINESS prompt line (see assemblePrompt).
      convergence: R.convergence || (R.tiers && R.tiers.verdict_driver) || (R.signals && R.signals.verdict_driver) || null,
      flags: normFlags(R.flags),
    } : null,                                          // missing/stale ⇒ grind honored downstream
    safety,                                            // doctor referral — outranks every other read
    time: timeFeature(T, bus.buckets),
    // status-gated like every other signal (never existence-gated — that was the whole
    // 30 Jul lesson). capsule_map is NOT staleness-gated: a capsule locked in June is not
    // stale, it is history, and its Re-Jirah debt only grows.
    capsules: bus.capsule_map && bus.capsule_map.status === "ok" ? {
      locked: bus.capsule_map.totals.capsules,
      strike_questions: bus.capsule_map.totals.strike_questions,
      rejirah_overdue: (bus.capsule_map.rejirah_overdue || []).slice(0, 3),
      cracked_axes: bus.capsule_map.totals.axes_cracked,
    } : null,
    // shipped carries timeaudit's own dataOk envelope: dark is reported as dark, never 0.
    shipped: bus.shipped && bus.shipped.status === "ok" ? {
      commits: bus.shipped.totals?.commits ?? null,
      new_files: bus.shipped.totals?.new_files ?? null,
      shipped: bus.shipped.shipped,
      events: (bus.shipped.artifact_events || []).map(e => e.kind),
    } : (bus.shipped && bus.shipped.status === "unreadable" ? { dark: true } : null),
    study: okCards ? {
      due_today: bus.cards.due_today ?? 0, overdue: bus.cards.overdue ?? 0,
      hardest_due: bus.cards.hardest_due || [],
    } : null,
    calibration: okCal ? {
      gap: bus.calibration.calibration_gap, trend: bus.calibration.trend || null,
      danger: bus.calibration.danger_zone || [],       // agent already gated to "ok"
    } : null,
    // Nemesis already surfaces these (Fork A3) — consume, never re-derive. null-safe.
    // Gated on okWeak (fresh + status ok + not low_confidence) — see the note above.
    headline: okWeak ? bus.weaknesses.headline : null,                // {id,topic,axis,one_line}|null
    axis_pattern: okWeak ? bus.weaknesses.axis_pattern : null,
    formation: okLS ? {
      maidan_stage_focus: bus.learning_state.maidan_stage_focus || null,
      weak_connection: bus.learning_state.weak_connection || null,
      python_fluency: bus.learning_state.python_fluency || {},
      rejirah_due: bus.learning_state.rejirah_due || [],
      core_vs_light: bus.learning_state.core_vs_light || {},          // {core,light} fixed keys
    } : null,
    captain_note: bus.captain_note || null,
    kal_line: kal,
    // M18 — the season re-read (bias-to-silence: fresh ≤7d AND non-empty, else null)
    season_read: (() => {
      const sr = bus.season_read;
      if (!sr || !sr.date) return null;
      const lag = daysBetween(sr.date, today);
      if (lag == null || lag < 0 || lag > 7) return null;
      const contradiction = (sr.contradictions || [])[0] || null;
      const edge = (sr.confusion_edges || [])[0] || null;
      const thread = (sr.open_threads || [])[0] || null;
      if (!contradiction && !edge && !thread) return null;
      return { date: sr.date, contradiction, edge, open_thread: thread };
    })(),
  };
}

// ---- formation-read INPUTS (§6.5) — candidates only; the LLM makes the pick --
function formationInputs(F) {
  const verdict = F.readiness?.verdict || "GREEN";      // missing readiness ⇒ grind honored
  const intensity = verdict === "RED" ? "rest/consolidate — floor only"
    : verdict === "AMBER" ? "consolidate one HELD connection (not first-exposure)"
    : "hardest connection at match-intensity (adversarial, cross-concept)";
  return {
    weak_handoff: F.formation?.weak_connection || null,
    top_weakness_line: F.headline?.one_line || null,
    axis_pattern: F.axis_pattern || null,
    due_high_leverage: (F.formation?.rejirah_due || [])[0] || null,
    intensity,
    shipping_candidate: F.season.pipeline_item,
  };
}

// ---- zero-hallucination: allowed-number set from EVERY numeric token in F ----
function allowedNumbers(F) {
  const set = new Set();
  const eat = (v) => {
    if (v == null) return;
    // E2E audit (25 Jul 2026): a negative feature stored only as "-45", but validate()'s
    // extractor is unsigned and can only ever yield "45" — so an HONEST sheet citing a
    // past-due ship date ("45 days past the ship date") was bounced as an invented number.
    // Store the magnitude too.
    if (typeof v === "number") { set.add(String(v)); if (v < 0) set.add(String(Math.abs(v))); return; }
    if (typeof v === "string") { (v.match(/\d+(?:\.\d+)?/g) || []).forEach((n) => set.add(n)); return; }
    if (Array.isArray(v)) return v.forEach(eat);
    if (typeof v === "object") return Object.values(v).forEach(eat);
  };
  eat(F);
  // E2E audit (25 Jul 2026): this used to whitelist EVERY integer 0-31 — which is precisely
  // the range a hallucinating LLM fabricates (card counts, day counts, rep counts, streaks,
  // small percentages). "cards due: 12 (+9 overdue)" invented from nothing passed the
  // zero-hallucination gate the repo advertises as physically rejecting a fake statistic
  // (system.md: "The validator will bounce the whole sheet for one invented digit").
  // Shrunk to 1-3, which are genuinely structural (list ordinals: "one/two/three", "1.").
  // Everything else must be traceable to a FEATURE — matchday, counts and dates all already
  // enter the set via eat(F) above, so no honest sheet loses anything.
  for (let i = 1; i <= 3; i++) set.add(String(i));     // list ordinals only
  return set;
}

// ---- assemble the compressed prompt (FEATURES + formation, NOT raw JSON) -----
// E2E audit (25 Jul 2026): the prompt starved the LLM of half the output contract, then the
// validator punished it for filling the gaps. system.md's contract (lines 452-469) demands a
// "{date}" header, a "🕐 SHAPE — his real peak windows, from the timing feature · never a
// generic clock", and a "🏆 {trophy line}" with an optional days-to-ship — NONE of which were
// serialized. The captain's note (precedence rung 7) and paused_until (rung 5) were computed
// into F and shown to nobody, so the master prompt's flagship "max mode on an AMBER body"
// reconciliation and "a paused season stays paused" could never physically fire. Freshness is
// also stated outright now, so the LLM can obey the silence law instead of guessing.
// Ordering follows system.md's precedence ladder: doctor → pause → body → the rest.
function assemblePrompt(F, fin, stale = {}) {
  const dts = F.season.days_to_ship;
  const shipTail = dts == null ? "" : (dts >= 0 ? ` · ${dts}d to ship` : ` · ship date passed by ${Math.abs(dts)}d — re-plan, never rush`);
  const drv = F.readiness?.convergence ? ` · driver: ${F.readiness.convergence}` : "";
  const dueHL = fin.due_high_leverage;
  return [
    `DATE: ${F.date}`,
    `PHASE: ${F.phase.emoji} ${F.phase.name} (matchday ${F.matchday}, ${F.season.matches_played} played)`,
    F.safety ? `DOCTOR REFERRAL — outranks every other read, render it verbatim, never interpret it: ${F.safety.message}` : null,
    F.season.paused_until ? `SEASON PAUSED until ${F.season.paused_until} — a paused season stays paused; propose no work.` : null,
    `READINESS: ${F.readiness ? `${F.readiness.verdict} · ${F.readiness.ceiling} · ${(F.readiness.work_type || []).join("; ")}${drv}` : "no verdict (grind honored)"}`,
    `SHAPE (his real windows — never a generic clock): ${shapeFromTiming(F.readiness?.timing)}`,
    `TIME: ${F.time && F.time.dark ? "instruments dark — the time camera was unreachable; do NOT read this as a zero"
      : F.time && F.time.building_pct != null ? `Building ${F.time.building_pct}%${F.time.building_target != null ? `/${F.time.building_target}%` : ""}${F.time.meta_pct != null ? ` · Meta ${F.time.meta_pct}%` : ""}${F.time.on_track ? ` · on track: ${F.time.on_track}` : ""}` : "no audit yet"}`,
    `CARDS: ${F.study ? `${F.study.due_today} due, ${F.study.overdue} overdue [${F.study.hardest_due.join(", ")}]` : "awaiting data"}`,
    `WEAKNESS: ${F.headline ? F.headline.one_line : "none surfaced (bias-to-silence)"}`,
    `AXIS PATTERN: ${F.axis_pattern?.note || "none"}`,
    `DANGER: ${F.calibration?.danger?.length ? F.calibration.danger.map((d) => d.topic).join(", ") : "none"}`,
    `FORMATION: ${F.formation?.weak_connection ? `weak handoff ${F.formation.weak_connection}` : "awaiting data"}`,
    `DUE (highest-leverage): ${dueHL ? `${dueHL.concept || dueHL}${dueHL.axis ? ` · axis ${dueHL.axis}` : ""}` : "none"}`,
    `INTENSITY: ${fin.intensity}`,
    `SHIPPING: ${fin.shipping_candidate || "n/a"}`,
    `TROPHY: ${F.season.trophy_state === "lit" ? "lit" : "unlit"} — ${F.season.pipeline_item || F.season.trophy}${shipTail}`,
    `KAL-LINE (yesterday — today's default until a HIGHER rung overrules it; quote it verbatim as line 2): ${F.kal_line || "none"}`,
    `CAPTAIN'S NOTE: ${F.captain_note || "none"}`,
    `SEASON RE-READ: ${F.season_read ? [F.season_read.contradiction ? `contradiction — "${F.season_read.contradiction.a}" vs "${F.season_read.contradiction.b}"` : null, F.season_read.edge ? `cross-week blur ${F.season_read.edge.from} ↔ ${F.season_read.edge.to}` : null, F.season_read.open_thread ? `never closed — ${F.season_read.open_thread.thread}` : null].filter(Boolean).join(" · ") : "none fresh"}`,
    `FRESHNESS: ${Object.entries(stale).map(([k, v]) => `${k}=${v}`).join(" · ") || "unknown"}  (anything not "fresh" was ALREADY nulled out above — do not reason around it)`,
    `TASK: write team_sheet.md per template, Gaffer voice, phase-appropriate. Use ONLY the numbers above.`,
  ].filter(Boolean).join("\n");
}

// ---- validate an LLM sheet: template + line-cap + no-invented-number ---------
const LINE_CAP = 40;
function validate(text, F) {
  if (!text || typeof text !== "string") return { ok: false, reason: "empty" };
  const lines = text.split("\n");
  if (lines.length > LINE_CAP) return { ok: false, reason: `line-cap (${lines.length}>${LINE_CAP})` };
  if (!/TEAM SHEET/.test(text) || !/COYG/.test(text)) return { ok: false, reason: "template markers missing" };
  const allowed = allowedNumbers(F);
  // E2E audit (25 Jul 2026): this used to blank out EVERY date and EVERY clock time before
  // the invented-number check, so the LLM could invent any deadline ("we ship by 2026-08-01")
  // or any window ("lights out by 22:45") and pass the gate — a fabricated deadline being
  // exactly the calendar-pressure failure mode Law 5 bans. No stripping now: legitimate dates
  // and times are already in the allowed set because eat(F) tokenises F.date ("2026-07-10" →
  // 2026/07/10) and the Goalkeeper's timing windows ("11:30–14:30" → 11/30/14/30). An invented
  // one contributes a token no feature produced, and bounces.
  const nums = text.match(/\d+(?:\.\d+)?/g) || [];
  const invented = nums.filter((n) => !allowed.has(n));
  if (invented.length) return { ok: false, reason: `invented number(s): ${[...new Set(invented)].join(", ")}` };
  return { ok: true };
}

// timing may be Goalkeeper's object {wake,peak1,dip,peak2,blocks} or a plain string — one line either way
function shapeFromTiming(timing) {
  if (!timing) return "one clean 90-min block in your peak, then reps";
  if (typeof timing === "string") return timing;
  const range = (s) => (typeof s === "string" ? s.split("(")[0].trim() : "");
  const peaks = [range(timing.peak1), range(timing.peak2)].filter(Boolean).join(" & ");
  const blocks = typeof timing.blocks === "string" ? timing.blocks : "";
  return peaks ? `peak windows ${peaks}${blocks ? "; " + blocks : ""}` : (blocks || "one clean 90-min block, then reps");
}

// the SQUAD-REPORTS time line — handles BOTH the legacy flat sentence and the bridged
// {pct, yes/no} shape (E2E audit 25 Jul 2026; the old code pushed `• ${on_track}` raw,
// which under the real schema would have rendered a bare "• no").
function timeReportLine(t) {
  if (!t) return null;
  if (t.dark) return `   • time: instruments dark — ${t.why} (no reading today, not a zero)`;
  if (t.building_pct == null) {
    return (typeof t.on_track === "string" && t.on_track !== "yes" && t.on_track !== "no") ? `   • ${t.on_track}` : null;
  }
  const tgt = t.building_target != null ? `/${t.building_target}% target` : "";
  const meta = t.meta_pct != null ? ` · Meta ${t.meta_pct}%` : "";
  const tail = t.on_track === "no" ? " — off track" : t.on_track === "yes" ? " — on track" : "";
  return `   • time: Building ${t.building_pct}%${tgt}${meta}${tail}`;
}

// ---- FALLBACK skeleton = deterministic sheet from F alone (also = cold-start) -
function fallbackSkeleton(F, fin, stale = {}) {
  const L = [];
  const dts = F.season.days_to_ship;
  // E2E audit (25 Jul 2026): render a PAST ship date as elapsed, not as a negative countdown.
  // The old `${dts}d to ship` produced "· -12d to ship" once target_ship slipped — confusing,
  // and read as exactly the countdown-clock pressure Law 5 bans ("a cabinet light, not a clock").
  const shipTail = dts == null ? "" : (dts >= 0 ? ` · ${dts}d to ship` : ` · ship date passed — reset it, no rush`);
  const trophyLine = `🏆 TROPHY: ${F.season.trophy_state === "lit" ? "🟢 lit" : "🔒 unlit"} — ${F.season.pipeline_item || F.season.trophy}${shipTail}`;

  L.push(`⚪🔴 TEAM SHEET — ${F.date} · Matchday ${F.matchday} · ${F.phase.emoji} ${F.phase.name}`);
  L.push("────────────────────────────────");
  // E2E audit (25 Jul 2026): a doctor referral could never reach the sheet at all (safety was
  // never read). It is now the first line under the header and outranks every other read —
  // CLAUDE.md: "sustained concerning physiology → DOCTOR-REFERRAL flag, full stop". Relayed
  // verbatim: this file is not a prescriber and never interprets it.
  if (F.safety) { L.push(`🏥 ${F.safety.message}`); L.push(""); }

  // E2E audit (25 Jul 2026): precedence rung 5 — "a paused season stays paused" — had NO data
  // path. paused_until was computed into F and read by nothing, so a deliberately paused season
  // (exams, illness) still got a full-intensity sheet proposing the pipeline item every morning.
  if (F.season.paused_until && F.date < F.season.paused_until) {
    L.push("THE GAFFER:");
    L.push(`Season's paused until ${F.season.paused_until}. That was your call and it stands — I'm not going to talk you out of your own decision. Nothing selected today.`);
    L.push("");
    L.push("🛟 FLOOR (never-zero): one file logged / one rep done. That's a won day.");
    L.push(trophyLine);
    L.push("────────────────────────────────");
    L.push("COYG. ⚪🔴");
    return L.join("\n");
  }

  // E2E audit (25 Jul 2026): the output contract's line 2 is the captain's KAL-line quoted
  // verbatim ("the first touch is his") — the old skeleton spent it on FLOOR instead, which
  // is a different concept entirely (the never-zero minimum), so yesterday's full deliverable
  // became today's "trivial" floor.
  if (F.kal_line) L.push(`"${F.kal_line}"`);
  L.push("THE GAFFER:");
  if (F.phase.key === "introduction") L.push("Captain. We start today. I don't know you yet — every day you show up, I learn you. Behaviour over reputation. Let's go to work.");
  else L.push("Captain. Fresh sheet. Control the controllables — one clean block, then the reps.");
  L.push("");
  // E2E audit (25 Jul 2026): the skeleton ignored a RED Governor verdict outright — ONE THING
  // still proposed the full shipping item while formationInputs had ALREADY computed
  // "rest/consolidate — floor only", a string that only leaked into the BENCHED suffix.
  // system.md rung 2: RED CANCELS the plan, it does not shade it.
  // And rung 6 (CONTINUITY): yesterday's KAL-line is today's DEFAULT until something higher
  // overrules it — so it leads the non-RED branch, ahead of the shipping candidate.
  const red = F.readiness?.verdict === "RED";
  const one = red
    ? "rest — the floor only. The body's verdict is RED; today's plan belongs to the physio."
    : (F.kal_line || fin.shipping_candidate || fin.weak_handoff || "the first brick of the trophy");
  L.push(`⚽ TODAY'S ONE THING: ${one}`);
  L.push(`   └ why this, not that: ${red ? "RED cancels the plan — rotation is how deep squads win. Rest days count as matches played."
    : F.kal_line ? "you pre-decided this last night with a clear head — continuity beats re-litigating the morning"
      : fin.weak_handoff ? "the weak handoff is the highest-leverage drill" : "it's the first brick; polish can wait"}`);
  L.push("");
  const rv = F.readiness?.verdict || "GREEN";
  const wt0 = F.readiness?.work_type?.[0] || null;
  L.push(`🔋 ENERGY: ${rv} — ${F.readiness?.ceiling || "full ceiling"}${wt0 ? " · " + wt0 : ""}`);
  L.push(`🕐 SHAPE: ${shapeFromTiming(F.readiness?.timing)}`);
  L.push(`🪑 BENCHED TODAY: no system-tinkering, no rig-tweaks — ${fin.intensity.includes("rest") ? "rest is the work today" : "build the thing"}`);
  L.push("");
  L.push("📋 SQUAD REPORTS (reconciled):");
  const rep = [];
  if (F.headline) rep.push(`   • ${F.headline.one_line}`);
  if (F.calibration?.danger?.length) rep.push(`   • confident-wrong: ${F.calibration.danger.map((d) => d.topic).join(", ")} → tighter interval`);
  if (F.study && (F.study.due_today || F.study.overdue)) rep.push(`   • cards due: ${F.study.due_today} (+${F.study.overdue} overdue)`);
  const tline = timeReportLine(F.time);
  if (tline) rep.push(tline);
  // THE SECOND WITNESS — artifacts beside hours. A dark camera plus real output is a WON
  // day, and until 30 Jul the sheet had no way to say so. Dark is named as dark, never 0.
  if (F.shipped?.dark) rep.push(`   • shipped: output sensor dark — no repo readable (blindness, not a zero)`);
  else if (F.shipped) {
    const ev = F.shipped.events?.length ? ` · ${F.shipped.events.join(" + ")}` : "";
    rep.push(F.shipped.shipped
      ? `   • shipped: ${F.shipped.commits} commit(s)${F.shipped.new_files ? `, ${F.shipped.new_files} new file(s)` : ""}${ev}`
      : `   • shipped: nothing committed yet today${ev}`);
  }
  // THE CAPSULES SPEAK — Re-Jirah is date-driven off lockedOn (FORGE_SPEC §4) and had never
  // reached a single surface. One line, worst debt first, with the ready-made probe count.
  if (F.capsules?.rejirah_overdue?.length) {
    const o = F.capsules.rejirah_overdue[0];
    rep.push(`   • Re-Jirah overdue: ${o.concept} ${o.overdue_days}d (${F.capsules.rejirah_overdue.length} concept(s)) — ${F.capsules.strike_questions} strike sawaal ready`);
  }
  if (F.season_read) {                                 // M18 — one line, the sharpest find first
    const sr = F.season_read;
    if (sr.contradiction) rep.push(`   • season re-read: "${sr.contradiction.a}" vs "${sr.contradiction.b}" — un-reconciled`);
    else if (sr.edge) rep.push(`   • season re-read: ${sr.edge.from} ↔ ${sr.edge.to} keep blurring across weeks`);
    else if (sr.open_thread) rep.push(`   • season re-read: still open — ${sr.open_thread.thread}`);
  }
  // E2E audit (25 Jul 2026) — the necessary companion to enforcing staleness above.
  // system.md rung 3 (INSTRUMENT INTEGRITY): a DARK referee is not the same thing as a
  // QUIET one. Bias-to-silence is for an agent that genuinely has nothing to say; a stale or
  // missing file must be NAMED, or the captain reads a bare sheet as "nothing to report"
  // instead of "the cameras were off". Restoring the instrument is the micro-task, in his verbs.
  // STALE only, never MISSING: a file that exists with numbers that are no longer true is a
  // dark camera; a file that was never written is the cold start (Matchday-1 exemplar), which
  // bias-to-silence and the "just you and me" line below already handle correctly.
  const dark = Object.entries(stale).filter(([, v]) => typeof v === "string" && v.startsWith("stale")).map(([k]) => k);
  if (dark.length) rep.push(`   • instruments dark — ${dark.join(", ")}. Their numbers don't exist today; one sensory pass brings the cameras back.`);
  if (!rep.length) rep.push("   • the rest of the squad reports in as we go — today it's just you and me.");
  for (const r of rep) L.push(r);
  L.push("");
  L.push(`🗣️ BOLO: ${F.headline ? `say one line out loud on ${F.headline.topic}` : "say one line out loud on today's why"}`);
  // FLOOR is the free man — the never-zero minimum. It is deliberately NOT the KAL-line
  // (E2E audit 25 Jul 2026): a floor that can be a full day's deliverable is not a floor.
  L.push("🛟 FLOOR (never-zero): one file logged / one rep done. That's a won day.");
  L.push(trophyLine);
  L.push("────────────────────────────────");
  L.push("COYG. ⚪🔴");
  return L.join("\n");
}

function writeAtomic(dir, path, text) {
  mkdirSync(dir, { recursive: true });
  // E2E audit (25 Jul 2026): the temp name used to be a FIXED `path + ".tmp"`. team_sheet.md
  // is written both by the brain daemon's manager_m3 job and by a direct `node manager.mjs`
  // run (a documented mode), so two overlapping runs shared one tmp path: the second write
  // clobbered the first's tmp mid-sequence, making one rename publish the OTHER run's bytes
  // or crash with ENOENT. Per-process tmp name ⇒ each run renames its own file.
  const tmp = `${path}.${process.pid}.tmp`; writeFileSync(tmp, text + "\n"); renameSync(tmp, path);
}

// ---- run: llm is INJECTED (default stub returns null ⇒ M-1 = fallback) -------
export async function runManager({ today = todayISO(), llm = async () => null, stateDir } = {}) {
  const dir = stateDir || process.env.ARSENAL_STATE_DIR || DEFAULT_STATE;
  const P = mkP(dir);
  const bus = loadBus(P, today);
  const stale = staleness(bus, today);
  const F = computeFeatures(bus, today, stale);        // E2E audit (25 Jul 2026): stale now GATES, not just logs
  const fin = formationInputs(F);
  const prompt = assemblePrompt(F, fin, stale);
  let sheet = null, source = "fallback", reason = "no-llm (M-1)";
  try {
    const out = await llm(prompt);
    const v = validate(out, F);
    if (v.ok) { sheet = out; source = "llm"; reason = "validated"; }
    else if (out != null) reason = `llm rejected: ${v.reason}`;
  } catch (e) { reason = `llm error: ${e.message}`; }
  if (!sheet) sheet = fallbackSkeleton(F, fin, stale);                // sheet appears UNCONDITIONALLY
  writeAtomic(dir, P("team_sheet.md"), sheet);
  const notes = { last_run: F.date, matchday: F.matchday, phase: F.phase.key, source, reason, staleness: stale };
  writeAtomic(dir, P("manager_notes.json"), JSON.stringify(notes, null, 2));
  return { sheet, source, reason, staleness: stale, features: F, prompt };
}

// ============================================================================
// selftest — baked mocks in a temp dir; the real state is NEVER touched.
// Fixtures below are VERBATIM real agent outputs (fsrs / calibration / nemesis /
// learning-state) captured on a rich rep-log + on the empty cold-start.
// ============================================================================
const FX = {
  rich: {
    cards: {"date":"2026-07-10","engine":"fsrs-6 (ts-fsrs 5.4.1)","request_retention":0.9,"total_cards":7,"due_today":0,"overdue":2,"hardest_due":["tool_use","chunking"],"status":"ok","generated_at":"2026-07-10T23:27:32.282Z"},
    calibration: {"date":"2026-07-10","calibration_gap":0.1932,"trend":"establishing baseline (37 reps)","overconfidence_rate":0.1923,"buckets":{"knew":{"n":26,"accuracy":0.8077},"shaky":{"n":9,"accuracy":0.3333},"guessed":{"n":2,"accuracy":0}},"danger_zone":[{"topic":"chunking","confidence":"high","accuracy":"low","axis":"f","note":"confident-wrong = the dangerous illusion → tighter interval"}],"total_reps":37,"status":"ok","low_confidence":false,"generated_at":"2026-07-10T23:27:32.338Z"},
    weaknesses: {"date":"2026-07-10","status":"ok","low_confidence":false,"headline":{"id":"chunking","topic":"chunking","axis":"f","one_line":"5× miss on chunking — axis f keeps breaking. today's #1 to scout — drill it before it drills you."},"axis_pattern":{"axis":"f","concepts":["chunking","retrieval","tool_use"],"strength":3,"note":"3 concepts (chunking, retrieval, tool_use) all break on axis f — the pattern is the opponent, not the topic. scout the KIND of thinking."},"weaknesses":[{"id":"chunking","topic":"chunking","recurrence":5,"last_seen":"2026-07-09","status":"open","evidence":["06-22 knew-wrong"],"axis":"f","score":2.6051}],"total_reps":37,"generated_at":"2026-07-10T23:27:32.372Z"},
    learning_state: {"date":"2026-07-10","generated_at":"2026-07-10T23:27:32.402Z","total_reps":37,"status":"ok","low_confidence":false,"maidan_stage_focus":"chunking → embeddings handoff","weak_connection":"chunking → embeddings (chunks → vectors)","python_fluency":{"pydantic":"🔴 learning","variables_types":"🔴 learning"},"rejirah_due":[{"concept":"tool_use","axis":"f (tradeoffs)","overdue_days":4},{"concept":"chunking","axis":"f (tradeoffs)","overdue_days":1}],"core_vs_light":{"core":"spine: 2/6 fluent","light":"0/1 fluent"}},
    // E2E audit (25 Jul 2026): the banner above claimed VERBATIM real agent output, but this
    // readiness fixture omitted the two blocks the real Goalkeeper always writes — `flags` (an
    // OBJECT, oura_coach.mjs:422) and `safety` (oura_coach.mjs:525-532) — which is exactly why
    // the flags-shape bug and the unread safety block survived a green suite. Restored.
    readiness: {"engine":"v2-recalibrated","day":"2026-07-10","verdict":"AMBER","ceiling":"MODERATE","workType":["RETRIEVE/REVIEW known material (encoding capacity reduced) — favour consolidation over first-exposure learning"],"timing":{"wake":"07:30","peak1":"11:30–14:30  (hardest adversarial work)","dip":"15:30–17:00  (admin, easy review)","peak2":"17:30–20:30  (second hard block)","blocks":"~90-min deep-focus blocks; break between"},"tiers":{"verdict_driver":"one sustained HIGH-confidence deviation (or two mixed) — not a red day"},"flags":{"clean":[],"hr_low_confidence":["RHR elevated vs baseline — medication-influenced, low weight (not counted)."]},"safety":{"consecutive_concerning_days":0,"low_spo2_persistent":false,"refer_doctor":false,"message":"No sustained red-flag physiology detected."}},
    // E2E audit (25 Jul 2026): there was NO timeaudit fixture at all — which is why the
    // Manager reading a schema nothing writes went unnoticed. This is the REAL Time-Auditor
    // shape (timeaudit.mjs:191-206), values from a live run.
    timeaudit: {"date":"2026-07-10","mode":"full","generatedAt":"2026-07-10T23:30:00.000Z","activeMinutes":134,"buckets":{"Learning":{"minutes":25,"pct":18.6,"top":"claude.ai 14m"},"Building":{"minutes":8,"pct":5.8,"top":"Code.exe 5m"},"Meta":{"minutes":101,"pct":75.5,"top":"youtube.com 57m"}},"productiveMinutes":33,"onTrack":false,"flags":["Building 5.8% < target 60%"],"dataOk":true,"note":""},
    season: {"phase":"partnership","season_day":14,"matches_played":12,"trophy":"FinOps Copilot live + eval-passing","trophy_state":"unlit","pipeline_item":"M1 extraction + Supabase (Building)","target_ship":"2026-08-20","paused_until":null},
  },
  cold: {
    cards: {"date":"2026-07-10","engine":"fsrs-6 (ts-fsrs 5.4.1)","request_retention":0.9,"total_cards":0,"due_today":0,"overdue":0,"hardest_due":[],"status":"awaiting_data","generated_at":"2026-07-10T23:28:02.795Z"},
    calibration: {"date":"2026-07-10","calibration_gap":null,"trend":"establishing baseline (0 reps)","overconfidence_rate":null,"buckets":{"knew":{"n":0,"accuracy":null},"shaky":{"n":0,"accuracy":null},"guessed":{"n":0,"accuracy":null}},"danger_zone":[],"total_reps":0,"status":"awaiting_data","low_confidence":true,"generated_at":"2026-07-10T23:28:02.831Z"},
    weaknesses: {"date":"2026-07-10","status":"awaiting_data","low_confidence":true,"headline":null,"axis_pattern":null,"weaknesses":[],"total_reps":0,"generated_at":"2026-07-10T23:28:02.860Z"},
    learning_state: {"date":"2026-07-10","generated_at":"2026-07-10T23:28:02.888Z","total_reps":0,"status":"awaiting_data","low_confidence":true,"maidan_stage_focus":null,"weak_connection":null,"python_fluency":{},"rejirah_due":[],"core_vs_light":{}},
    readiness: {"engine":"v2-recalibrated","day":"2026-07-10","verdict":"GREEN","ceiling":"HIGH","workType":["ENCODE: front-load new factual/declarative learning + memorisation","SYNTHESISE: creative synthesis, architecture / system-design, connecting concepts"],"timing":{"wake":"07:00","peak1":"11:00–14:00  (hardest adversarial work: mocks, timed system-design, novel problems)","dip":"15:00–16:30  (admin, email, easy review, MOVEMENT)","peak2":"17:00–20:00  (second hard block)","blocks":"~90-min deep-focus blocks; genuine non-screen break between; movement snack every 30–60 min"}},
    season: {"phase":"introduction","season_day":1,"matches_played":0,"trophy":"FinOps Copilot live + eval-passing","trophy_state":"unlit","pipeline_item":"M1 upload hub — accept one real invoice","target_ship":"2026-08-20","paused_until":null},
  },
};

async function selftest() {
  const TODAY = "2026-07-10";
  let pass = 0, fail = 0;
  const ok = (n, c) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ " + n); } };
  const stage = (kind) => {
    const dir = mkdtempSync(join(tmpdir(), "arsenal_manager_selftest_"));
    for (const [name, obj] of Object.entries(FX[kind])) {
      writeFileSync(join(dir, name + ".json"), JSON.stringify(obj));      // fixtures carry their own date/day
    }
    return dir;
  };

  // 1) COLD-START — the real state today (all agents awaiting_data)
  const coldDir = stage("cold");
  const cold = await runManager({ today: TODAY, stateDir: coldDir });
  // E2E audit (25 Jul 2026): was `ok(name, true)` — a tautology that could not fail. Now it
  // asserts a real, complete sheet came back.
  ok("cold: no crash on null/empty surface fields", typeof cold.sheet === "string" && /COYG/.test(cold.sheet));
  ok("cold: phase = Introduction (matches_played 0)", cold.features.phase.name === "Introduction");
  ok("cold: matchday = 1", cold.features.matchday === 1);
  ok("cold: NO weakness line (headline null ⇒ bias-to-silence)", !/•.*miss on/.test(cold.sheet));
  ok("cold: NO danger line (calibration awaiting)", !/confident-wrong/.test(cold.sheet));
  ok("cold: NO cards line (awaiting)", !/cards due/.test(cold.sheet));
  ok("cold: squad = 'just you and me' fallback line", /just you and me/.test(cold.sheet));
  ok("cold: no NaN/null/undefined leaked into sheet", !/(NaN|null|undefined)/.test(cold.sheet));
  ok("cold: trophy line present + unlit", /🏆 TROPHY: 🔒 unlit/.test(cold.sheet));
  ok("cold: template intact (header + COYG)", /TEAM SHEET/.test(cold.sheet) && /COYG/.test(cold.sheet));
  ok("cold: source = fallback (no LLM in M-1)", cold.source === "fallback");
  // E2E audit (25 Jul 2026): the old check called itself "manager_notes written with phase"
  // but only read two IN-MEMORY values — it never opened the file, so a broken notes write
  // (wrong path, bad serialization) still printed a tick. Both writes are now read back off
  // disk, which is also the only coverage writeAtomic has ever had.
  const coldNotes = JSON.parse(readFileSync(join(coldDir, "manager_notes.json"), "utf8"));
  ok("cold: manager_notes.json ON DISK carries phase/source/staleness", coldNotes.phase === "introduction" && coldNotes.source === "fallback" && coldNotes.last_run === TODAY && coldNotes.staleness.cards === "fresh");
  ok("cold: team_sheet.md ON DISK === the returned sheet (writeAtomic actually published)", readFileSync(join(coldDir, "team_sheet.md"), "utf8").trim() === cold.sheet.trim());
  ok("cold: NO [object Object] (timing object rendered, not stringified)", !/\[object Object\]/.test(cold.sheet));
  ok("cold: SHAPE renders a real window from timing object", /🕐 SHAPE:.*11:00/.test(cold.sheet));
  ok("cold: workType directive rendered in ENERGY", /🔋 ENERGY:.*ENCODE/.test(cold.sheet));
  ok("cold: readiness reads fresh (day===today, Oura-lag tolerant)", cold.staleness.readiness === "fresh");

  // 2) RICH — verbatim real agent outputs
  const rich = await runManager({ today: TODAY, stateDir: stage("rich") });
  ok("rich: phase = Partnership (matches_played 12)", rich.features.phase.name === "Partnership");
  ok("rich: matchday = 13", rich.features.matchday === 13);
  ok("rich: consumes nemesis headline VERBATIM (not re-derived)", rich.sheet.includes("5× miss on chunking"));
  ok("rich: danger line fires on chunking", /confident-wrong: chunking/.test(rich.sheet));
  ok("rich: cards line = 0 due (+2 overdue)", /cards due: 0 \(\+2 overdue\)/.test(rich.sheet));
  ok("rich: formation weak_connection in prompt", rich.prompt.includes("chunking → embeddings"));
  ok("rich: core_vs_light read as {core} fixed key (not dummy arbitrary)", rich.features.formation.core_vs_light.core === "spine: 2/6 fluent");
  ok("rich: AMBER intensity = consolidate held", rich.prompt.includes("consolidate one HELD"));
  ok("rich: no NaN/null/undefined leaked", !/(NaN|null|undefined)/.test(rich.sheet));
  ok("rich: NO [object Object] (timing object rendered)", !/\[object Object\]/.test(rich.sheet));
  ok("rich: workType (RETRIEVE) rendered in ENERGY", /🔋 ENERGY:.*RETRIEVE/.test(rich.sheet));

  // 2b) TIMEAUDIT SCHEMA BRIDGE (E2E audit 25 Jul 2026) — the Manager used to read a shape
  // nothing writes, so F.time was all-null on real data and "Building null%/null%" went to Opus.
  ok("rich: timeaudit REAL schema bridged (buckets.Building.pct, not the phantom flat key)",
    rich.features.time && rich.features.time.building_pct === 5.8 && rich.features.time.meta_pct === 75.5 && rich.features.time.on_track === "no");
  ok("rich: the time report reaches the sheet", /• time: Building 5\.8%\/60% target · Meta 75\.5% — off track/.test(rich.sheet));
  ok("rich: prompt TIME line is real (no 'null%' fed to the LLM)", /^TIME: Building 5\.8%\/60% · Meta 75\.5%/m.test(rich.prompt) && !/null%/.test(rich.prompt));

  // 2c) PROMPT COMPLETENESS — every contract line must be grounded in a wrapper feature
  // (E2E audit 25 Jul 2026: date, shape, trophy, due, axis, note and freshness were all absent,
  // so the LLM was ordered to render them and had to invent them).
  ok("prompt: DATE line present (contract header {date})", /^DATE: 2026-07-10$/m.test(rich.prompt));
  ok("prompt: SHAPE carries the REAL peak window, not a generic clock", /^SHAPE \(his real windows[^\n]*11:30/m.test(rich.prompt));
  ok("prompt: TROPHY + days-to-ship handed over", /^TROPHY: unlit — M1 extraction \+ Supabase \(Building\) · 41d to ship$/m.test(rich.prompt));
  ok("prompt: DUE + AXIS lines handed over", /^DUE \(highest-leverage\): tool_use · axis f \(tradeoffs\)$/m.test(rich.prompt) && /^AXIS PATTERN: 3 concepts/m.test(rich.prompt));
  ok("prompt: FRESHNESS map handed over so the LLM can obey the silence law", /^FRESHNESS: readiness=fresh/m.test(rich.prompt));
  ok("prompt: verdict_driver read from tiers (real Goalkeeper path), not the phantom signals path", /driver: one sustained HIGH-confidence deviation/.test(rich.prompt));

  // 2d) CAPTAIN'S NOTE — precedence rung 7 had no data path at all
  const cnDir = stage("rich");
  writeFileSync(join(cnDir, "captain_note.md"), "max mode today");
  const cn = await runManager({ today: TODAY, stateDir: cnDir });
  ok("captain-note: the captain's voice actually reaches the LLM (rung 7)", /^CAPTAIN'S NOTE: max mode today$/m.test(cn.prompt));

  // 3) ZERO-HALLUCINATION — invented number rejected ⇒ fallback
  const bad = await runManager({ today: TODAY, stateDir: stage("rich"), llm: async () => "⚪🔴 TEAM SHEET — 2026-07-10 · Matchday 13\nYou're 73% Building today.\nCOYG. ⚪🔴" });
  ok("guard: invented '73' rejected ⇒ falls back", bad.source === "fallback" && /invented number/.test(bad.reason));

  // 4) VALID LLM sheet (numbers ∈ FEATURES) ⇒ accepted
  const good = await runManager({ today: TODAY, stateDir: stage("rich"), llm: async () => "⚪🔴 TEAM SHEET — 2026-07-10 · Matchday 13\nCaptain, chunking has missed 5 times — today we scout it.\nCOYG. ⚪🔴" });
  ok("guard: clean sheet (5 ∈ features) accepted ⇒ source=llm", good.source === "llm");

  // 4a) the ORDINAL WHITELIST hole (E2E audit 25 Jul 2026): 0-31 used to be waved through
  // unconditionally — precisely the range a hallucinating LLM fabricates. Pick a small integer
  // that is provably NOT in this fixture's feature set, then prove it bounces.
  const smallTok = ["29", "27", "23", "19", "31"].find((n) => !allowedNumbers(rich.features).has(n)) || "29";
  const smallBad = await runManager({ today: TODAY, stateDir: stage("rich"), llm: async () => `⚪🔴 TEAM SHEET — 2026-07-10 · Matchday 13\nYou logged ${smallTok} reps yesterday.\nCOYG. ⚪🔴` });
  ok(`guard: invented small number '${smallTok}' (≤31) rejected — no more ordinal laundering`, smallBad.source === "fallback" && /invented number/.test(smallBad.reason));

  // 4b) the DATE/TIME strip hole (E2E audit 25 Jul 2026): validate() used to blank every date
  // and clock time before checking, so any invented deadline or window passed the "zero-
  // hallucination" gate. Real windows still pass (see `good` above, which carries 2026-07-10).
  const badTime = await runManager({ today: TODAY, stateDir: stage("rich"), llm: async () => "⚪🔴 TEAM SHEET — 2026-07-10 · Matchday 13\nLights out by 22:45, captain.\nCOYG. ⚪🔴" });
  ok("guard: invented clock time '22:45' rejected (times no longer blanket-stripped)", badTime.source === "fallback" && /invented number/.test(badTime.reason));

  // 4b) M18 — SEASON RE-READ: fresh read lands one line; stale is silent
  const srDir = stage("rich");
  writeFileSync(join(srDir, "season_read.json"), JSON.stringify({ date: TODAY, contradictions: [{ a: "kv cache fixes quadratic", b: "attention stays n-squared", where: "capsule vs dugout" }], open_threads: [], confusion_edges: [{ from: "tokenization", to: "embeddings", evidence: "3 sessions" }], note: "x" }));
  const sr = await runManager({ today: TODAY, stateDir: srDir });
  ok("season-read: fresh contradiction rides the sheet (one line)", /season re-read: .*un-reconciled/.test(sr.sheet));
  ok("season-read: the prompt carries the re-read for the LLM", /SEASON RE-READ: contradiction/.test(sr.prompt));
  const srStaleDir = stage("rich");
  writeFileSync(join(srStaleDir, "season_read.json"), JSON.stringify({ date: "2026-06-20", contradictions: [{ a: "x", b: "y" }], open_threads: [], confusion_edges: [] }));
  const srStale = await runManager({ today: TODAY, stateDir: srStaleDir });
  ok("season-read: a stale read (>7d) is SILENT (bias-to-silence)", srStale.features.season_read === null && !/season re-read/.test(srStale.sheet));

  // 5) MISSING readiness ⇒ grind honored, no crash, no RED-from-absence
  const nordDir = stage("rich");
  writeFileSync(join(nordDir, "readiness.json"), ""); // corrupt ⇒ parse-fail ⇒ null (simulates absence)
  const nord = await runManager({ today: TODAY, stateDir: nordDir });
  // E2E audit (25 Jul 2026): was `ok(name, true)` — a tautology. Now it asserts the absence
  // was actually detected AND a full sheet still came back.
  ok("missing-readiness: no crash", nord.staleness.readiness === "missing" && nord.features.readiness === null && /COYG/.test(nord.sheet));
  ok("missing-readiness: energy defaults GREEN (grind honored)", /🔋 ENERGY: GREEN/.test(nord.sheet));

  // 6) STALENESS — agents dated 07-10 flagged stale when today = 07-12
  const future = await runManager({ today: "2026-07-12", stateDir: stage("rich") });
  ok("staleness: cards flagged stale when today=07-12", /stale/.test(future.staleness.cards));
  // E2E audit (25 Jul 2026): staleness used to be computed and then IGNORED — it reached
  // manager_notes.json and nothing else, so Friday's numbers rode Monday's sheet as today's.
  ok("staleness: a stale agent is NULLED, not consumed (silence law)",
    future.features.study === null && future.features.headline === null && future.features.time === null && future.features.calibration === null);
  ok("staleness: no stale card count / stale nemesis headline on the sheet",
    !/cards due/.test(future.sheet) && !/5× miss on chunking/.test(future.sheet));
  // rung 3 — a nulled source must be NAMED, never silently blank (see fallbackSkeleton)
  ok("staleness: the dark instruments are named on the sheet, not silently dropped",
    /• instruments dark — timeaudit, cards, calibration, weaknesses, learning_state\./.test(future.sheet));
  // and the readiness ≤2d Oura tolerance still holds at exactly 2 days
  ok("staleness: readiness at 2d lag is STILL fresh (Oura sync lag is normal)", future.staleness.readiness === "fresh" && future.features.readiness !== null);

  // 6b) a STALE verdict must not keep cancelling good days
  const staleRedDir = stage("rich");
  writeFileSync(join(staleRedDir, "readiness.json"), JSON.stringify({ ...FX.rich.readiness, day: "2026-07-01", verdict: "RED", ceiling: "LOW" }));
  const staleRed = await runManager({ today: TODAY, stateDir: staleRedDir });
  ok("staleness: a 9-day-old RED verdict does NOT ride the sheet (grind honored instead)",
    /stale/.test(staleRed.staleness.readiness) && staleRed.features.readiness === null && /🔋 ENERGY: GREEN/.test(staleRed.sheet));

  // 6c) THE GOVERNOR — a FRESH RED cancels the plan, it does not merely shade it
  const redDir = stage("rich");
  writeFileSync(join(redDir, "readiness.json"), JSON.stringify({ ...FX.rich.readiness, verdict: "RED", ceiling: "LOW" }));
  const red = await runManager({ today: TODAY, stateDir: redDir });
  const redOne = red.sheet.split("\n").find((l) => l.startsWith("⚽ TODAY'S ONE THING")) || "";
  ok("RED: ONE THING becomes rest — the Governor cancels the plan", /^⚽ TODAY'S ONE THING: rest — the floor only/.test(redOne));
  ok("RED: the shipping candidate is SUPPRESSED from ONE THING, not footnoted", !/M1 extraction/.test(redOne));

  // 6d) DOCTOR REFERRAL + the flags OBJECT shape (E2E audit 25 Jul 2026: safety was never
  // read and flags-as-object always collapsed to [], so a referral could sit under "GREEN").
  const docDir = stage("rich");
  writeFileSync(join(docDir, "readiness.json"), JSON.stringify({
    ...FX.rich.readiness, verdict: "GREEN", ceiling: "HIGH",
    flags: { clean: ["temp deviation sustained"], hr_low_confidence: ["RHR elevated — medication-influenced"] },
    safety: { consecutive_concerning_days: 3, low_spo2_persistent: true, refer_doctor: true, message: "SEE A DOCTOR. Sustained concerning physiology (multi-day temp/respiratory/SpO2). This tool is not a diagnostician and will NOT suggest anything about medication or treatment — take this to your physician." },
  }));
  const doc = await runManager({ today: TODAY, stateDir: docDir });
  ok("safety: refer_doctor rides the sheet even under a GREEN verdict",
    doc.features.safety?.refer_doctor === true && /SEE A DOCTOR/.test(doc.sheet) && /🔋 ENERGY: GREEN/.test(doc.sheet));
  ok("safety: the referral reaches the LLM prompt too", /^DOCTOR REFERRAL/m.test(doc.prompt));
  ok("flags: object shape {clean, hr_low_confidence} normalised (always [] on real data before)", doc.features.readiness.flags.length === 2);

  // 6e) WARMING_UP — nemesis emits a headline while low-confidence; the sheet must stay silent
  const wuDir = stage("rich");
  writeFileSync(join(wuDir, "weaknesses.json"), JSON.stringify({ ...FX.rich.weaknesses, status: "warming_up", low_confidence: true }));
  const wu = await runManager({ today: TODAY, stateDir: wuDir });
  ok("warming_up: nemesis headline is SILENT (system.md: warming_up means no headline)",
    wu.features.headline === null && !/5× miss on chunking/.test(wu.sheet) && /^WEAKNESS: none surfaced/m.test(wu.prompt));

  // 6e-bis) WARMING_UP LEARNING-STATE — the last existence-gate (audit 30 Jul 2026).
  // learning_state.json always EXISTS, so its formation used to ride the sheet at 2 reps.
  const wlsDir = stage("rich");
  writeFileSync(join(wlsDir, "learning_state.json"),
    JSON.stringify({ ...FX.rich.learning_state, status: "warming_up", low_confidence: true }));
  const wls = await runManager({ today: TODAY, stateDir: wlsDir });
  ok("warming_up: learning_state formation is SILENT (weak handoff + rejirah_due withheld)",
    wls.features.formation === null
    && !/chunking → embeddings/.test(wls.sheet)
    && /^FORMATION: awaiting data/m.test(wls.prompt)
    && /^DUE \(highest-leverage\): none/m.test(wls.prompt));

  // 6e-ter) INSTRUMENTS DARK — an ActivityWatch outage must never render as a hard 0%
  // (audit 30 Jul 2026). This is exactly what timeaudit.mjs writes when AW is unreachable.
  const darkDir = stage("rich");
  writeFileSync(join(darkDir, "timeaudit.json"), JSON.stringify({
    date: TODAY, dataOk: false, note: "ActivityWatch unreachable",
    buckets: { Building: { pct: 0 }, Meta: { pct: 0 } }, onTrack: false,
  }));
  const dark = await runManager({ today: TODAY, stateDir: darkDir });
  ok("dark camera: reported as blindness, never as 'Building 0% — off track'",
    dark.features.time?.dark === true
    && /instruments dark/.test(dark.sheet)
    && !/Building 0%/.test(dark.sheet)
    && !/on track: no/.test(dark.prompt));

  // 6e-quater) THE TWO WITNESSES REACH THE SHEET (30 Jul 2026). An organ nothing reads is
  // the very defect these two were built to close — so prove they render, both ways.
  const wDir = stage("rich");
  writeFileSync(join(wDir, "capsule_map.json"), JSON.stringify({
    date: TODAY, status: "ok",
    totals: { capsules: 4, axes_present: 36, axes_cracked: 2, strike_questions: 36 },
    rejirah_overdue: [{ concept: "embeddings", overdue_days: 36, next_due: "2026-06-24", rounds_done: 0 }],
  }));
  writeFileSync(join(wDir, "shipped.json"), JSON.stringify({
    date: TODAY, status: "ok", dataOk: true, shipped: true,
    totals: { commits: 3, files_touched: 9, insertions: 200, deletions: 4, new_files: 2 },
    artifact_events: [{ kind: "capsule_locked", what: "hallucinations" }],
  }));
  const wit = await runManager({ today: TODAY, stateDir: wDir });
  ok("capsules speak: Re-Jirah debt + the ready-made probe count reach the sheet",
    /Re-Jirah overdue: embeddings 36d/.test(wit.sheet) && /36 strike sawaal ready/.test(wit.sheet));
  ok("shipped speaks: artifacts render beside hours, with the day's events",
    /shipped: 3 commit\(s\), 2 new file\(s\) · capsule_locked/.test(wit.sheet));

  // and the distinction that justifies the whole organ: dark ≠ zero
  const sdDir = stage("rich");
  writeFileSync(join(sdDir, "shipped.json"), JSON.stringify({ date: TODAY, status: "unreadable", dataOk: false, shipped: null, totals: null, artifact_events: [] }));
  const sd = await runManager({ today: TODAY, stateDir: sdDir });
  ok("a dark output sensor is named as blindness, never rendered as 0 commits",
    /output sensor dark/.test(sd.sheet) && !/shipped: 0 commit/.test(sd.sheet));

  // bias-to-silence still holds: an awaiting_data capsule map says nothing at all
  const qDir = stage("rich");
  writeFileSync(join(qDir, "capsule_map.json"), JSON.stringify({ date: TODAY, status: "awaiting_data", totals: { capsules: 0, strike_questions: 0, axes_cracked: 0 }, rejirah_overdue: [] }));
  const q = await runManager({ today: TODAY, stateDir: qDir });
  ok("no capsules ⇒ the sheet stays silent about Re-Jirah (bias-to-silence preserved)",
    q.features.capsules === null && !/Re-Jirah overdue/.test(q.sheet));

  // 6f) A PAUSED SEASON STAYS PAUSED (precedence rung 5 — previously unenforceable)
  const pauseDir = stage("rich");
  writeFileSync(join(pauseDir, "season.json"), JSON.stringify({ ...FX.rich.season, paused_until: "2026-07-25" }));
  const paused = await runManager({ today: TODAY, stateDir: pauseDir });
  ok("paused: no work proposed while the season is paused", /Season's paused until 2026-07-25/.test(paused.sheet) && !/TODAY'S ONE THING/.test(paused.sheet));
  ok("paused: the LLM is told as well", /^SEASON PAUSED until 2026-07-25/m.test(paused.prompt));

  // 6g) A PAST SHIP DATE — no negative countdown, and the magnitude is a legal number
  const pastDir = stage("rich");
  writeFileSync(join(pastDir, "season.json"), JSON.stringify({ ...FX.rich.season, target_ship: "2026-05-26" }));
  const past = await runManager({ today: TODAY, stateDir: pastDir });
  ok("past-ship: renders as elapsed, never as '· -45d to ship'",
    past.features.season.days_to_ship === -45 && !/-45d to ship/.test(past.sheet) && /ship date passed/.test(past.sheet));
  ok("past-ship: the magnitude is whitelisted (an honest '45 days past' no longer bounces)", allowedNumbers(past.features).has("45"));

  // 6h) THE KAL-LINE — contract line 2 ("the first touch is his") and precedence rung 6's
  // default for ONE THING. It used to be spent on FLOOR instead, so yesterday's full
  // deliverable became today's supposedly-trivial never-zero minimum (E2E audit 25 Jul 2026).
  const kalDir = stage("rich");
  mkdirSync(join(kalDir, "post_match"), { recursive: true });
  writeFileSync(join(kalDir, "post_match", "2026-07-09.md"), "MISS — data, not a verdict.\nKAL-LINE → finish the M1 extraction end-to-end\nCOYG. ⚪🔴");
  const kal = await runManager({ today: TODAY, stateDir: kalDir });
  ok("kal-line: quoted as sheet line 2 AND is the ONE THING default (rung 6 continuity)",
    kal.features.kal_line === "finish the M1 extraction end-to-end"
    && kal.sheet.split("\n")[2] === '"finish the M1 extraction end-to-end"'
    && /^⚽ TODAY'S ONE THING: finish the M1 extraction end-to-end$/m.test(kal.sheet));
  ok("kal-line: FLOOR stays the never-zero minimum, NOT yesterday's full deliverable",
    /^🛟 FLOOR \(never-zero\): one file logged/m.test(kal.sheet) && !/🛟 FLOOR[^\n]*M1 extraction/.test(kal.sheet));

  // 6i) CLI GUARD — a typo'd mode must never perform a live destructive regenerate.
  // Spawned against a throwaway state dir, so this is safe under the OLD behaviour too.
  const cliDir = mkdtempSync(join(tmpdir(), "arsenal_manager_selftest_"));
  let cliExit = 0;
  try { execFileSync(process.execPath, [fileURLToPath(import.meta.url), "sefltest"], { env: { ...process.env, ARSENAL_STATE_DIR: cliDir }, stdio: "pipe" }); }
  catch (e) { cliExit = typeof e.status === "number" ? e.status : -1; }
  ok("cli: a typo'd mode exits 1 and does NOT regenerate the sheet", cliExit === 1 && !existsSync(join(cliDir, "team_sheet.md")));

  // 7) DEFAULT date basis is LOCAL (not UTC) — stamp fixtures with the ACTUAL local today, pass NO today arg
  const LOCAL = todayISO();
  const localDir = mkdtempSync(join(tmpdir(), "arsenal_manager_selftest_"));
  for (const [name, obj] of Object.entries(FX.cold)) {
    const o = (name === "readiness") ? { ...obj, day: LOCAL } : { ...obj, date: LOCAL };
    writeFileSync(join(localDir, name + ".json"), JSON.stringify(o));
  }
  const def = await runManager({ stateDir: localDir });   // no `today` ⇒ uses local todayISO()
  ok("default-today: header uses LOCAL date (not UTC)", def.sheet.includes(LOCAL));
  ok("default-today: signal agent dated local-today reads fresh", def.staleness.cards === "fresh");
  ok("default-today: readiness (day=local-today) reads fresh", def.staleness.readiness === "fresh");

  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "FAILURES: " + fail} (${pass} passed, ${fail} failed)`);
  return fail === 0;
}

// ---- entry ------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  // E2E audit (25 Jul 2026): EVERY unrecognised argv fell straight through to a LIVE run.
  // A typo — `node scripts/manager.mjs sefltest` — silently regenerated the real
  // team_sheet.md with the stub llm (⇒ the plain fallback skeleton), overwriting the morning's
  // Opus sheet and rewriting manager_notes.json to source="fallback". A mistyped read-only
  // command must never be a destructive write. Bare invocation stays the only generate path.
  if (mode) { console.error("usage: node scripts/manager.mjs [selftest]   (bare = generate today's team sheet)"); process.exit(1); }
  const r = await runManager();
  console.log(r.sheet);
  console.error(`\n[source=${r.source} · ${r.reason}]`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
