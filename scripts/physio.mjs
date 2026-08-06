#!/usr/bin/env node
// ============================================================================
// physio.mjs · ARSENAL AI FC — THE ORGANISM: THE PHYSIO (proprioception)
// ----------------------------------------------------------------------------
// WHAT:  The organ that knows the organism has never had blood (THE_ORGANISM
//        §IV.1). Audits the boundary itself: files stale beyond cadence,
//        signal emitted-but-never-consumed, effort spent-but-uncaptured
//        ("we played but the cameras were off"), throw-ins that stopped
//        arriving, a mirror that stopped syncing. Owns the SPEAK-GATES every
//        fitted organ defers to, and the per-organ signal table.
// WHY:   Trust, not tokens, is the real coupling substrate. The loop must feel
//        its own anemia before anything is allowed to speak as if fed —
//        and repairing the loop must never be the captain's chore.
// CONSTITUTIONAL (each selftested):
//   · EXCEPTION-ONLY VOICE — vitals.line is null unless something bleeds.
//   · GOVERNOR EXEMPT — the Goalkeeper/Governor NEVER appears in the signal
//     table. A safety brake that can be relegated by a Brier score is a brake
//     that will one day be off when the crash comes.
//   · NEVER-BORN ≠ BLEEDING — a file that has never existed on a bloodless
//     organism is status quo, not a wound. Only files that have EXISTED and
//     gone stale bleed.
//   · Throw-in watching is DELIVERY-failure only (poller wired but silent) —
//     usage is never a captain metric.
//
// INPUT:  physio_config.json (canon) · the whole bus (read-only, mtimes+JSON)
// OUTPUT: dressing-room/state/loop_vitals.json (sole writer)
// MODES:  run (default) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "physio_config.json");
const VITALS    = join(STATE_DIR, "loop_vitals.json");

const DEFAULTS = {
  expected_cadence_hours: {
    "readiness.json": 30, "cards.json": 30, "calibration.json": 30, "weaknesses.json": 30,
    "learning_state.json": 30, "timeaudit.json": 30, "pulse.json": 30, "mirror_manifest.json": 30,
    "drills.json": 30, "twin.json": 30, "pitch_read.json": 30,
    // THE TWO ORGANS THE BLEED DETECTOR COULD NOT SEE (audit #108, 6 Aug 2026).
    // Both had been dead for days with nothing anywhere able to raise it:
    //  · team_sheet.md — the MANAGER'S ONLY OUTPUT, the capstone of the whole build
    //    order, frozen at 2026-08-01 ("Matchday 1 · Introduction ... I don't know you
    //    yet") while the Dugout served it to him every morning as today's sheet. It
    //    was absent from this table entirely, so its death was structurally unraisable.
    //  · brain_out/nightshift/gem_cartridge.md — the night lane last ran 2 Aug and
    //    missed four consecutive nights with LastTaskResult 0 each time. `grep -n
    //    nightshift scripts/physio.mjs` returned ZERO hits: the vitals organ had no
    //    check for it at all, so it could have stayed dead indefinitely. This is the
    //    feedstock for the Gem, the scout pack and the distractor banks.
    // 30 is NOT a new number — it is the value every other daily organ in this table
    // already carries (a missed morning plus its catch-up window). Both files are .md,
    // which readJson returns null for, so they fall back to mtime staleness — correct
    // here, because for these two "when was it last written" IS the health question.
    "team_sheet.md": 30,
    "brain_out/nightshift/gem_cartridge.md": 30,
  },
  grace_frac: 0.25,
  // A legitimate lag is not a bleed. The Oura pull is a day or two behind by nature
  // (same ≤2d tolerance manager.mjs honours), so readiness content may trail without
  // the organ being broken. Everything else is expected to say something new when it
  // writes. (audit 30 Jul 2026 — content-vs-mtime staleness)
  content_lag_tolerance_hours: { "readiness.json": 48 },
  effort_uncaptured: { min_learning_minutes: 120 },
  throwin_gap_days: 4,
  signal_table: { min_n: 20 },
  gates: {
    twin_voice_min_resolutions: 30,
    doubt_clusters: { min_capsules: 4, min_doubts: 60 },
    bootroom_min_reps: 200,
    apni_ghadi: { min_cards: 8, min_reps_per_card: 4 },
    body_archive_min_days: 84,
  },
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const round = (x, d = 4) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

// A REP BELONGS TO THE DAY THE CAPTAIN LIVED, NOT THE DAY UTC WAS HAVING.
// E2E audit (25 Jul 2026, finding 87f8f8da): §3 compared `String(r.ts).slice(0,10)`
// — the UTC calendar day — against localDate(now), which is IST (UTC+5:30).
// Rep stamps are plain `new Date().toISOString()` (throwin.mjs, and the cartridge
// capture contract), so EVERY rep captured between 00:00 and 05:30 IST carries
// yesterday's UTC day. A night-shift session therefore read as "0 reps today"
// and the physio accused him of playing with the cameras off on the very day he
// captured the most — the one accusation that must never be false, since it asks
// for work. Date-only stamps are taken literally: they carry no clock to convert.
const repLocalDay = (ts) => {
  const s = String(ts || "");
  if (!/[T ]/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? localDate(d) : s.slice(0, 10);
};

// LAST-WINS OVER AN APPEND-ONLY LEDGER — scorer.mjs's own canon ("the truth
// function reads LAST-WINS per (book,type,date,claim), never both"), which the
// physio was not honouring. E2E audit (25 Jul 2026, finding 029c3bae): when late
// reps flip a twin resolution, the scorer APPENDS a correction row rather than
// editing the old one, so one market-day can sit in slip.jsonl twice with
// opposite `hit`. Counting raw rows let a single corrected day pay the
// 30-resolution twin_voice gate twice AND put both the miss and the hit into the
// Brier — a gate opening on volume that never happened, scored against events
// that never happened twice. Later row wins, exactly as the scorer intends.
const lastWinsSlip = (rows) => {
  const m = new Map();
  for (const s of rows) m.set(`${s.book}|${s.type}|${s.date}|${s.claim}`, s);
  return [...m.values()];
};

// FSRS-6 forgetting curve, ts-fsrs's default decay (w[20] = 0.1542):
//   R(t) = (1 + FACTOR·t/S)^DECAY,  FACTOR chosen so R(S) = 0.9 exactly.
const FSRS_DECAY  = -0.1542;
const FSRS_FACTOR = Math.pow(0.9, 1 / FSRS_DECAY) - 1;
const retrievability = (elapsedDays, stability) =>
  Math.pow(1 + FSRS_FACTOR * Math.max(0, elapsedDays) / Math.max(Number(stability) || 0.1, 0.1), FSRS_DECAY);

// fsrs.mjs's normId, CLONED rather than imported on purpose: importing fsrs.mjs
// would drag ts-fsrs into this process, and the organ whose whole job is to
// report anemia must not itself die because a node_module went missing.
const normId = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");

// ---------------------------------------------------------------------------
// FUEL (ORGANISM AUDIT #93, physio side) — no health surface read tank state
// ---------------------------------------------------------------------------
// `grep -n "tank|fuel" scripts/physio.mjs` returned ZERO before this, and
// /organism-doctor never touched it either, while T1 (the mouth) and T2 (the
// Watcher) sat COLD from a 429 storm. The Dugout voice had no fuel and no organ
// in the body said so. The physio is the proprioception organ; an empty tank is
// exactly the kind of thing proprioception is for.
//
// TWO RULES, both taken from fuelboard.mjs rather than invented here:
//  · USABLE is fuelboard.mjs:203's own definition — state ∈ {HOT, WARM}. No new
//    threshold is introduced; there is no number to guess.
//  · A tanks.json whose `day` is not today is NOT today's reading. fuelboard's
//    loadBoard() day-resets used_today/last_429 at local midnight, so a stored
//    "COLD" from two days ago would read HOT the moment the board is next
//    loaded. Reporting it as current would be exactly the "unmeasured silence
//    rendered as a measured zero" this audit exists to kill. So a stale board is
//    reported as stale and NEVER bleeds.
// tanks.json is read RAW and read-only. fuelboard.mjs is deliberately NOT
// imported and `fuelboard.mjs status` is deliberately NOT shelled: status does a
// read-modify-WRITE of tanks.json under the tank lock, and a health probe must
// never mutate the thing it is measuring.
const USABLE_TANK_STATES = ["HOT", "WARM"];      // fuelboard.mjs:203, verbatim

function fuelRead(tanksJson, tankRegistry, now) {
  if (!tanksJson || !tanksJson.tanks || typeof tanksJson.tanks !== "object") return null;  // never born ≠ bleeding
  const today = localDate(now);
  const states = {};
  for (const [id, t] of Object.entries(tanksJson.tanks)) states[id] = (t && typeof t.state === "string") ? t.state : "unknown";
  const reading_is_today = tanksJson.day === today;
  const usable = Object.entries(states).filter(([, s]) => USABLE_TANK_STATES.includes(s)).map(([id]) => id);
  const cold = Object.entries(states).filter(([, s]) => s === "COLD").map(([id]) => id);
  // which tank is the mouth is DATA, not a constant: fuelboard_config.json's own
  // registry names it by region. Fall back to fuelboard.mjs's documented
  // DEFAULT_TANKS mapping (T1 Gaffer = region "mouth") only if the registry is
  // unreadable — and say which source was used.
  const reg = (tankRegistry && Array.isArray(tankRegistry.tanks)) ? tankRegistry.tanks : null;
  const mouthTank = reg ? (reg.find(t => t && t.region === "mouth") || {}).id || null : "T1";
  return {
    day: tanksJson.day || null,
    reading_is_today,
    mouth_tank: mouthTank,
    mouth_state: mouthTank ? (states[mouthTank] || "unknown") : null,
    states, usable, cold,
    source: reg ? "fuelboard_config.json registry" : "fuelboard.mjs DEFAULT_TANKS (registry unreadable)",
    note: reading_is_today
      ? `${usable.length}/${Object.keys(states).length} tanks usable (HOT/WARM) as of today`
      : `NOT TODAY'S READING — the fuel board was last written ${tanksJson.day || "(no day stamp)"}; these states are what stood then, and fuelboard day-resets at local midnight`,
  };
}

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        expected_cadence_hours: { ...DEFAULTS.expected_cadence_hours, ...(j.expected_cadence_hours || {}) },
        content_lag_tolerance_hours: { ...DEFAULTS.content_lag_tolerance_hours, ...(j.content_lag_tolerance_hours || {}) },
        grace_frac: typeof j.grace_frac === "number" ? j.grace_frac : DEFAULTS.grace_frac,
        effort_uncaptured: { ...DEFAULTS.effort_uncaptured, ...(j.effort_uncaptured || {}) },
        throwin_gap_days: typeof j.throwin_gap_days === "number" ? j.throwin_gap_days : DEFAULTS.throwin_gap_days,
        signal_table: { ...DEFAULTS.signal_table, ...(j.signal_table || {}) },
        gates: { ...DEFAULTS.gates, ...(j.gates || {}) },
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

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => {
  const out = [];
  try {
    if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) {
      if (!l.trim()) continue;
      try { out.push(JSON.parse(l)); } catch { /* corrupt line skipped */ }
    }
  } catch { }
  return out;
};

// ---------------------------------------------------------------------------
// FSRS SIGNAL ROW — v0 frozen verbatim (layering law), new engine beside it
// ---------------------------------------------------------------------------
// v0, kept exactly as it shipped: this is what every loop_vitals.json written
// before 25 Jul 2026 reported, so the number stays readable in hindsight.
// Superseded by fsrsSignal below; not called by compute any more.
function fsrsSignalLegacy(world, cfg) {
  let brier = null, n = 0;
  if (world.fsrsStore && Array.isArray(world.fsrsStore.cards) && world.reps.length) {
    // score: for each rep on a card AFTER its first review, FSRS "predicted"
    // retrievability proxy — honest v0: use overdue-vs-outcome (due passed &
    // rep correct?) as binary forecast 0.9/0.5; gated hard below min_n.
    const dueByConcept = new Map(world.fsrsStore.cards.map(c => [c.id, c.due]));
    const scored = [];
    for (const r of world.reps) {
      if (r.track !== "concept" || typeof r.correct !== "boolean") continue;
      const due = dueByConcept.get(String(r.concept || "").toLowerCase());
      if (!due) continue;
      const p = new Date(r.ts) <= new Date(due) ? 0.9 : 0.5;   // before due: high retention predicted
      scored.push((p - (r.correct ? 1 : 0)) ** 2);
    }
    n = scored.length;
    if (n >= cfg.signal_table.min_n) brier = round(scored.reduce((a, b) => a + b, 0) / n, 4);
  }
  return { organ: "fsrs", brier, n, note: brier === null ? "gated (needs n≥" + cfg.signal_table.min_n + ")" : "brier vs due-day outcomes" };
}

// E2E audit (25 Jul 2026, finding 9faeef60) — why v0 had to be superseded: it
// scored every HISTORICAL rep against the card's CURRENT `due`, i.e. the next
// review scheduled after the latest fsrs recompute, which is almost always in
// the future. So `rep.ts <= due` was true for essentially every rep, p collapsed
// to the constant 0.9, the 0.5 branch was all but unreachable, and the row
// published as "brier vs due-day outcomes" was really mean((0.9 − correct)²) —
// an accuracy proxy wearing a forecast's name, read as forecast quality by the
// captain and volume-gated on by the Boot Room. (It also keyed reps with a bare
// toLowerCase, so a stray space in `concept` silently dropped the rep.)
// fsrs_store.json keeps no per-review history, so the honest reconstruction
// available INSIDE this organ is FSRS's own forgetting curve replayed in ts
// order: for each rep after a card's first, predict R over the gap since that
// card's previous rep. Stability is the card's CURRENT stability — the only one
// on disk — and the note says so, so the number is never read as more than it is.
function fsrsSignal(world, cfg) {
  let brier = null, n = 0;
  const cards = world.fsrsStore && Array.isArray(world.fsrsStore.cards) ? world.fsrsStore.cards : [];
  if (cards.length && world.reps.length) {
    const stabilityById = new Map(cards.map(c => [normId(c.id != null ? c.id : c.concept || ""), Number(c.stability)]));
    const byCard = new Map();
    for (const r of world.reps) {
      if (r.track !== "concept" || typeof r.correct !== "boolean") continue;
      const id = normId(r.concept || "");
      const S = stabilityById.get(id);
      if (!Number.isFinite(S) || S <= 0) continue;         // new/unknown card: no curve to forecast with
      const t = new Date(r.ts).getTime();
      if (!Number.isFinite(t)) continue;
      if (!byCard.has(id)) byCard.set(id, []);
      byCard.get(id).push({ t, correct: r.correct, S });
    }
    const scored = [];
    for (const reps of byCard.values()) {
      reps.sort((a, b) => a.t - b.t);
      for (let i = 1; i < reps.length; i++) {              // a card's first rep has no interval to forecast over
        const p = retrievability((reps[i].t - reps[i - 1].t) / 86400000, reps[i].S);
        scored.push((p - (reps[i].correct ? 1 : 0)) ** 2);
      }
    }
    n = scored.length;
    if (n >= cfg.signal_table.min_n) brier = round(scored.reduce((a, b) => a + b, 0) / n, 4);
  }
  // ORGANISM AUDIT #104/#106 — the note used to read "gated (needs n≥20)", which
  // says the bar and hides the climb. `7/20` says both. The gate itself is
  // UNCHANGED (still cfg.signal_table.min_n, still no brier below it).
  return { organ: "fsrs", brier, n,
    note: brier === null ? `${n}/${cfg.signal_table.min_n} forecasts — brier lands at ${cfg.signal_table.min_n}`
      : "brier vs FSRS retrievability over the gap since that card's previous rep (current stability used as proxy — the store keeps no per-review history)" };
}

// ---------------------------------------------------------------------------
// pure core — every input injected so the selftest owns the world
// ---------------------------------------------------------------------------
function compute(world, cfg, now = new Date()) {
  // world: { files:{name:{exists,mtimeMs}}, reps:[], timeaudit, weaknesses, teamSheetMtime,
  //          weaknessesMtime, looseBalls:[], throwinState, capsules:[{doubts:[]}...],
  //          slip:[], fsrsStore, readinessCount, readinessDay, bodyDaysSeen:[] }
  const bleeds = [];
  const nowMs = now.getTime();

  // 0) DOCTOR-REFERRAL — the one health escalation that must NEVER die silently
  //    in a JSON file (the Goalkeeper computes it; every surface keys off the
  //    verdict alone, and the flag is independent of the verdict). Message
  //    only, never a number, never an interpretation — the hard law.
  if (world.referDoctor) {
    bleeds.push({ organ: "goalkeeper", kind: "doctor_referral",
      evidence: "readiness.safety.refer_doctor is set (sustained pattern)",
      line: "the Goalkeeper filed a doctor-referral — a sustained pattern worth showing your doctor. Full stop." });
  }

  // 0b) THE WEEKLY RITUALS — the Gaffer's mouth says WHEN; the captain never
  //     has to remember /gem-sync or /genome himself (anti-ADHD law).
  if (world.gemSyncDue) {
    bleeds.push({ organ: "gem", kind: "gem_sync_due", evidence: world.gemSyncDue,
      line: "gem-sync is due — say /gem-sync jab 5 minute mile; your pocket examiner deserves tonight's cartridge." });
  }
  if (world.genomePending) {
    bleeds.push({ organ: "bootroom", kind: "genome_pending", evidence: "a proposed mutation sits unreviewed in mutations.jsonl",
      line: "the boot room filed a proposal — /genome for your word when ready." });
  }

  // 1) STALE — only files that have EXISTED bleed (never-born ≠ bleeding).
  // AUDIT (30 Jul 2026): this read MTIME ONLY. A file rewritten on schedule with
  // unchanged, days-old CONTENT therefore looked perfectly fresh — physio reported
  // "no bleed" on readiness.json while tone.mjs, which reads the verdict's own stamp,
  // called the same file "Governor stale (61h)". Two organs, one file, opposite answers.
  // The honest age is the OLDER of the two: a touched file with stale content is stale.
  // Per-file `content_lag_tolerance_hours` keeps a LEGITIMATE lag legitimate — the Oura
  // pull is a day or two behind by nature (the same ≤2d tolerance manager.mjs applies),
  // and that lag is normal, not a bleed.
  for (const [name, hrs] of Object.entries(cfg.expected_cadence_hours)) {
    const f = world.files[name];
    if (!f || !f.exists) continue;                       // never born → status quo
    const mtimeAgeH = (nowMs - f.mtimeMs) / 3600000;
    const cadenceLimit = hrs * (1 + cfg.grace_frac);
    // The tolerance REPLACES the cadence limit for this file; it does not stack on top of it.
    // (regression audit 30 Jul 2026: subtracting the 48h tolerance from content age BEFORE
    // comparing to cadence+grace made the real silence window 30×1.25+48 = 85.5h — the organ
    // whose job is to notice a dead instrument would have said nothing for most of a week,
    // while the comment claimed it matched manager.mjs's ≤2d rule. Now readiness bleeds at
    // exactly >48h of content age, which IS that rule.)
    const tol = (cfg.content_lag_tolerance_hours || {})[name] || 0;
    const contentLimit = Math.max(cadenceLimit, tol);
    const contentAgeH = Number.isFinite(f.contentMs) ? (nowMs - f.contentMs) / 3600000 : null;
    const mtimeStale = mtimeAgeH > cadenceLimit;
    const contentStale = contentAgeH !== null && contentAgeH > contentLimit;
    if (mtimeStale || contentStale) {
      const byContent = contentStale && !mtimeStale;
      bleeds.push({ organ: name.replace(".json", ""), kind: "stale",
        evidence: byContent
          ? `${name} was written ${round(mtimeAgeH, 1)}h ago but its CONTENT is ${round(contentAgeH, 1)}h old (limit ${round(contentLimit, 1)}h)`
          : `${name} is ${round(mtimeAgeH, 1)}h old (cadence ${hrs}h)`,
        line: byContent
          ? `${name.replace(".json", "")} is writing on time but saying nothing new — its content is ${Math.round(contentAgeH)}h old.`
          : `${name.replace(".json", "")} went quiet — its file is ${Math.round(mtimeAgeH)}h old.` });
    }
  }

  // 1b) PHANTOM TOPICS — a rep whose concept is not in the registry.
  // capture.mjs has always SET unregistered:true and now NAMES it on stdout, but the lane
  // that actually produces his reps (dugout voice → execFileSync, output discarded) throws
  // that stdout away, and CapturePull runs unattended 14×/day. A defect only visible on a
  // console nobody reads is still invisible. The bus is the surface that always gets read.
  // (regression audit 30 Jul 2026)
  const phantoms = [...new Set((world.reps || []).filter(r => r && r.unregistered).map(r => r.concept))];
  if (phantoms.length) {
    bleeds.push({ organ: "capture", kind: "unregistered_concept",
      evidence: `reps_log holds ${phantoms.length} concept(s) absent from concepts.json: ${phantoms.slice(0, 5).join(", ")}`,
      line: `${phantoms.slice(0, 3).join(", ")} — yeh concepts.json mein nahi hain, toh inke reps apna alag phantom topic bana rahe hain. Registry mein add karo.` });
  }

  // 2) EMITTED-BUT-NEVER-CONSUMED — a weakness headline no sheet ever surfaced.
  //
  // ORGANISM AUDIT #70 (4 Aug 2026) — THE FALSE ALARM. The old test was
  // `headline present && (sheet missing || sheet.mtime < weaknesses.mtime)`, and
  // it was wrong twice:
  //
  //  (a) IT ACCUSED THE MANAGER OF OBEYING THE LAW. nemesis.mjs deliberately
  //      emits a headline while status="warming_up" / low_confidence=true (it is
  //      a floor signal for its own consumers), and manager.mjs:167 refuses to
  //      carry it in exactly that case — `okWeak = fresh && status==="ok" &&
  //      low_confidence !== true` — because system.md's silence law says
  //      "warming_up means no headline", and manager.mjs:769 selftests it. Live
  //      right now: weaknesses.json is status "warming_up", low_confidence true,
  //      total_reps 9 — and loop_vitals.json carried the emitted_unconsumed
  //      bleed anyway. The physio was reporting the silence law as a wound.
  //
  //  (b) IT COMPARED CLOCKS, NOT CONTENT. weaknesses.json is rewritten by the
  //      08:39 heartbeat EVERY day, unchanged headline included, which bumps its
  //      mtime past a sheet that already carried that exact line. So a headline
  //      the sheet is literally printing (manager.mjs:489 pushes
  //      `F.headline.one_line` verbatim) re-registered as an orphan the next
  //      morning, forever.
  //
  // The honest orphan test: the headline must be CONSUMABLE by the manager's own
  // rule, and the sheet must not already carry it. Text beats mtime when the text
  // is available; the mtime comparison survives as the fallback for when the
  // sheet cannot be read. No new threshold, no lowered bar — a genuine orphan
  // (a status-ok headline on a sheet that never printed it) still bleeds.
  const wk = world.weaknesses;
  const headline = (wk && wk.headline) ? wk.headline : null;
  // mirrors manager.mjs:167 `okWeak` exactly — the consumer's own trust gate
  const headlineConsumable = !!(headline && wk.status === "ok" && wk.low_confidence !== true);
  const oneLine = (headline && typeof headline.one_line === "string") ? headline.one_line : null;
  const sheetText = typeof world.teamSheetText === "string" ? world.teamSheetText : null;
  const sheetCarries = !!(sheetText && oneLine && sheetText.includes(oneLine));
  const sheetOlder = !world.teamSheetMtime || world.teamSheetMtime < world.weaknessesMtime;
  if (headlineConsumable && world.weaknessesMtime && !sheetCarries && sheetOlder) {
    bleeds.push({ organ: "nemesis→manager", kind: "emitted_unconsumed",
      evidence: sheetText === null
        ? "weaknesses.headline is status-ok but team_sheet.md is missing"
        : "weaknesses.headline is status-ok, and team_sheet.md neither carries its one_line nor postdates it",
      line: "the scout filed a headline no sheet has carried yet." });
  }

  // 3) EFFORT-UNCAPTURED — hours in the Learning bucket, zero reps in the log.
  //    The audit is evidence for TODAY only if it is STAMPED today — the 07:30
  //    run must never pair yesterday's minutes with a day that hasn't started
  //    (a false accusation at dawn). No today-stamp ⇒ no accusation, ever.
  const ta = world.timeaudit;
  const today = localDate(now);
  const learnMin = ta && ta.date === today && ta.buckets && ta.buckets.Learning && typeof ta.buckets.Learning.minutes === "number"
    ? ta.buckets.Learning.minutes : null;
  if (learnMin !== null && learnMin >= cfg.effort_uncaptured.min_learning_minutes) {
    // repLocalDay, not a UTC slice — see its comment (E2E audit 25 Jul 2026,
    // finding 87f8f8da): the timeaudit's `date` is a LOCAL day, so the reps it
    // is weighed against must be counted on the same clock.
    const repsToday = world.reps.filter(r => repLocalDay(r.ts) === today).length;
    if (repsToday === 0) {
      bleeds.push({ organ: "capture", kind: "effort_uncaptured",
        evidence: `${learnMin} Learning minutes today, 0 reps in the log`,
        line: "we played but the cameras were off — one paste, captain." });
    }
  }

  // 4) THROW-IN GAP — delivery failure only: poller wired, stream previously
  //    flowed, now silent past the gap. Usage is never a captain metric.
  if (world.throwinState && world.throwinState.wired && world.looseBalls.length > 0) {
    const lastTs = Math.max(...world.looseBalls.map(b => new Date(b.ts).getTime() || 0));
    const gapDays = (nowMs - lastTs) / 86400000;
    if (gapDays > cfg.throwin_gap_days) {
      bleeds.push({ organ: "throwin", kind: "throwin_gap",
        evidence: `poller wired; last delivery ${round(gapDays, 1)}d ago`,
        line: "the throw-in line may be dropping balls — check the phone shortcut once." });
    }
  }

  // 4b) THE WAKE-GATE VERDICT, SURFACED (audit #108, 6 Aug 2026).
  //     The night shift's wind-tunnel replays every recorded decision and files a
  //     verdict to brain_out/nightshift/gate_tune_<date>.md — and NOTHING read that
  //     file. On 6 Aug it said OUT OF BAND: 0.33 wakes/day against its own [1, 8]
  //     over 5,940 replayed decisions, and — correctly — proposed NO change, because
  //     no config in its 24-point grid clears hysteresis. Its own conclusion is that
  //     the fault is in what REACHES the gate (the salience score), not the
  //     thresholds. That is a real finding the captain should see, and it was buried
  //     in a markdown file with no reader.
  //     THIS ORGAN REPORTS IT AND NEVER TUNES IT. No threshold is read from here and
  //     none is proposed: his standing rule is that no number is chosen before 30-45
  //     days of real data, and the data behind THIS verdict was produced while the
  //     thalamus was running two-day-old code with every salience repair inert. The
  //     honest move is to look again after real use, not to tune against a broken
  //     measurement. The band is the tuner's own, quoted — not invented here.
  if (world.gateTune && world.gateTune.out_of_band) {
    const g = world.gateTune;
    bleeds.push({
      organ: "wake-gate", kind: "gate_out_of_band",
      evidence: `wind tunnel: ${g.wakes_per_day} wakes/day vs its own band [${(g.band || []).join(", ")}] over ${g.decisions} replayed decision(s)${g.days ? ` across ${g.days}d` : ""}`,
      line: "the wake-gate is below its own floor and the tuner could not fix it with thresholds — it points at the SCORE reaching the gate. Look again after 30-45 days of real use; do not tune it now.",
    });
  }

  // 5) MIRROR-STALE handled by (1) via mirror_manifest.json cadence.

  // 6) FUEL — ORGANISM AUDIT #93. The mouth running dry is a body fact, and the
  //    body organ is the one that should say it. Bleeds ONLY on a reading that
  //    is actually today's (see fuelRead's comment: a stale board is not a cold
  //    board, it is an unread board — and an unread board is reported, not
  //    accused). No number is invented: "usable" is fuelboard's own HOT/WARM.
  const fuel = fuelRead(world.tanks, world.tankRegistry, now);
  if (fuel && fuel.reading_is_today) {
    if (fuel.usable.length === 0) {
      bleeds.push({ organ: "fuelboard", kind: "fuel_dry",
        evidence: `0/${Object.keys(fuel.states).length} tanks usable (HOT/WARM) — ${fuel.cold.length ? "COLD: " + fuel.cold.join(", ") : "none HOT/WARM"}`,
        line: "every fuel tank is cold — the voice has nothing to speak with until the quota resets at midnight." });
    } else if (fuel.mouth_tank && !USABLE_TANK_STATES.includes(fuel.mouth_state)) {
      bleeds.push({ organ: "fuelboard", kind: "mouth_cold",
        evidence: `${fuel.mouth_tank} (the mouth) reads ${fuel.mouth_state}; still usable: ${fuel.usable.join(", ")}`,
        line: "the Gaffer's own tank is cold — the voice will be failing over or falling silent." });
    }
  }

  // SPEAK-GATES — computed from real volumes; fitted organs defer to these.
  // A gate counts MARKET-DAYS, not ledger rows: lastWinsSlip collapses the
  // scorer's appended corrections (E2E audit 25 Jul 2026, finding 029c3bae) so a
  // day whose verdict flipped cannot buy the captain's trust twice.
  const twinResolutions = {};
  for (const s of lastWinsSlip(world.slip.filter(s => s.book === "twin" && s.resolved))) twinResolutions[s.type] = (twinResolutions[s.type] || 0) + 1;
  const totalDoubts = world.capsules.reduce((n, c) => n + (Array.isArray(c.doubts) ? c.doubts.length : 0), 0);
  const maturedCards = world.fsrsStore && Array.isArray(world.fsrsStore.cards)
    ? world.fsrsStore.cards.filter(c => (c.reps || 0) >= cfg.gates.apni_ghadi.min_reps_per_card).length : 0;

  // BODY-ARCHIVE — the gate that could never open. E2E audit (25 Jul 2026,
  // finding aff39f83): it asks for 84 days of body history but read
  // readiness.json's `nights`, which oura_coach derives from a HARDCODED 45-day
  // fetch window (fetchNights(45)) — structurally capped at 45, so an 84-day
  // gate was unreachable by construction and the body-archive organ would have
  // stayed constitutionally mute no matter how many seasons the ring was worn.
  // Nothing on the bus accumulates body-days, and the physio may not write
  // another organ's file — but it IS the sole writer of loop_vitals.json, so it
  // keeps its own ledger there: the distinct readiness days it has witnessed,
  // fed back in on the next run as world.bodyDaysSeen. The gate takes whichever
  // source knows more, the ledger or the rolling window, so the number is
  // monotone, never below what Oura can already prove, and can actually reach 84.
  const bodyDays = new Set((Array.isArray(world.bodyDaysSeen) ? world.bodyDaysSeen : []).filter(d => ISO_DAY.test(String(d))));
  if (ISO_DAY.test(String(world.readinessDay || ""))) bodyDays.add(String(world.readinessDay));
  const body_days_seen = [...bodyDays].sort().slice(-730);      // two seasons of memory is plenty
  const bodyArchiveDays = Math.max(body_days_seen.length, world.readinessCount || 0);

  const speak_gates = {
    twin_voice: Object.values(twinResolutions).some(n => n >= cfg.gates.twin_voice_min_resolutions),
    doubt_clusters: world.capsules.length >= cfg.gates.doubt_clusters.min_capsules && totalDoubts >= cfg.gates.doubt_clusters.min_doubts,
    bootroom_mutation: world.reps.length >= cfg.gates.bootroom_min_reps,
    apni_ghadi: maturedCards >= cfg.gates.apni_ghadi.min_cards,
    body_archive: bodyArchiveDays >= cfg.gates.body_archive_min_days,
  };

  // ORGANISM AUDIT #102/#103/#104/#106 — THE UNGATE, have/need from rep 1.
  // A closed gate used to publish one bit: `false`. "9 reps of the 200 this organ
  // is waiting for" and "you will never see this" are the same bit, and the
  // captain was shown the second when the truth was the first. Every gate now
  // carries its OWN counter beside the boolean.
  //
  // NO GATE IS LOWERED and no number is introduced: every `need` below is read
  // straight out of cfg (physio_config.json), the same value that decides the
  // boolean on the line above. The vocabulary (have / need / open) is the one
  // scripts/limits.mjs already uses for exactly this purpose.
  //
  // speak_gates stays a flat map of BOOLEANS — bootroom.mjs:256 reads
  // `vitals.speak_gates.bootroom_mutation` as a boolean and must not be broken.
  // The counters ride alongside, in their own key.
  const counter = (have, need, unit) => ({ have, need, open: have >= need, unit, line: `${have}/${need} ${unit}` });
  const bestTwinType = Object.values(twinResolutions).length ? Math.max(...Object.values(twinResolutions)) : 0;
  const speak_gate_counters = {
    twin_voice: counter(bestTwinType, cfg.gates.twin_voice_min_resolutions, "resolutions on one claim-type"),
    doubt_clusters: {
      capsules: counter(world.capsules.length, cfg.gates.doubt_clusters.min_capsules, "capsules"),
      doubts: counter(totalDoubts, cfg.gates.doubt_clusters.min_doubts, "doubts"),
      open: speak_gates.doubt_clusters,
      line: `${world.capsules.length}/${cfg.gates.doubt_clusters.min_capsules} capsules · ${totalDoubts}/${cfg.gates.doubt_clusters.min_doubts} doubts`,
    },
    bootroom_mutation: counter(world.reps.length, cfg.gates.bootroom_min_reps, "reps"),
    apni_ghadi: counter(maturedCards, cfg.gates.apni_ghadi.min_cards, `cards with ≥${cfg.gates.apni_ghadi.min_reps_per_card} reps`),
    body_archive: counter(bodyArchiveDays, cfg.gates.body_archive_min_days, "body-days witnessed"),
  };

  // SIGNAL TABLE — per-organ predictive scoring; FSRS Brier is the one fit
  // legitimate from day one (built for n=1), still volume-gated.
  // GOVERNOR CONSTITUTIONALLY EXEMPT — never in this table (see header).
  const signal_table = [];
  signal_table.push(fsrsSignal(world, cfg));
  for (const organ of ["twin", "gaffer"]) {
    // LAST-WINS first (finding 029c3bae): a corrected market-day is ONE event,
    // and the Brier must score the verdict that stood, not both verdicts.
    const resolved = lastWinsSlip(world.slip.filter(s => s.book === organ && s.resolved));
    const priced = resolved.filter(s => typeof s.p === "number");
    const nPriced = priced.length;
    const brier = nPriced >= cfg.signal_table.min_n
      ? round(priced.reduce((a, s) => a + (s.p - (s.hit ? 1 : 0)) ** 2, 0) / nPriced, 4) : null;
    // THE GAFFER'S ROW WAS DEAD WIRING. E2E audit (25 Jul 2026, finding
    // 4ee75ad6): this row demanded a numeric `p`, but scorer.mjs — the sole
    // writer of slip.jsonl — creates every gaffer proposal with p:null
    // (gafferPropose) and the matured copy spreads `...s`, so no gaffer row has
    // ever carried a price or ever will. n sat at 0 forever while the note read
    // "gated", i.e. "not enough data yet" — a lie that would have survived a
    // thousand resolved drills, and the one row the Boot Room volume-gates on.
    // A gaffer bet is an UNPRICED binary claim ("reps will land on this
    // concept"), so it is scored the way unpriced binary claims are scored:
    // hit-rate. The Brier path stays above, untouched, for any book that does
    // carry p (the twin does) — and takes precedence the day the gaffer gets one.
    const unpriced = resolved.filter(s => typeof s.p !== "number" && typeof s.hit === "boolean");
    const nUnpriced = unpriced.length;
    const hit_rate = brier === null && nUnpriced >= cfg.signal_table.min_n
      ? round(unpriced.filter(s => s.hit).length / nUnpriced, 4) : null;
    const n = brier !== null ? nPriced : hit_rate !== null ? nUnpriced : Math.max(nPriced, nUnpriced);
    // ORGANISM AUDIT #104/#106 — have/need, not the bare word "gated".
    signal_table.push({ organ, brier, hit_rate, n,
      note: brier !== null ? "brier over slip"
        : hit_rate !== null ? "hit-rate over resolved unpriced claims (this book writes no p)"
        : `${n}/${cfg.signal_table.min_n} resolved — brier (priced) or hit-rate (unpriced) lands at ${cfg.signal_table.min_n}` });
  }

  // ORGANISM AUDIT #69 — `status: "ok"` and `low_confidence: false` USED TO BE
  // HERE, as literals, computed from nothing, sitting directly above a populated
  // `bleeds` array. talk.mjs:44 clips this file's first 400 characters into the
  // voice prompt, and those 400 characters were literally `"status":"ok"`
  // followed by the bleed — the model was handed a contradiction and asked to
  // speak from it.
  //
  // BOTH FIELDS ARE DELETED, not repaired, and that is deliberate:
  //  · They had ZERO readers. Verified repo-wide: dugout.mjs:1057 takes `.line`,
  //    viz.mjs:1215 takes the object and reads `.bleeds`, bootroom.mjs:255-256
  //    takes `.speak_gates.bootroom_mutation`, talk.mjs:44 clips the raw text.
  //    ORGANISM_ANATOMY.md:149-153 documents the loop_vitals contract and never
  //    mentions either field. They were vestigial.
  //  · Computing them was the TRAP. In this codebase status/low_confidence is a
  //    DATA-SUFFICIENCY pair, not a health verdict (calibration.mjs:29-30,
  //    learning_state.mjs:511), and manager.mjs:159/:167 pattern-matches that
  //    exact vocabulary. Inventing a `"bleeding"` value would have silently
  //    changed what the Manager trusts. The audit's instruction was explicit:
  //    delete the field, do not extend the enum.
  //
  // What replaces them at the top of the file is a COUNT, not a verdict —
  // derived, unambiguous, and inside talk.mjs's 400-char window without talk.mjs
  // having to change (that file belongs to another organ's owner).
  const summary = bleeds.length
    ? `${bleeds.length} bleed(s): ${bleeds.map(b => b.kind).join(", ")}`
    : "no bleeds";

  return {
    date: localDate(now),
    summary,
    generated_at: now.toISOString(),
    bleeds,
    speak_gates,
    speak_gate_counters,
    signal_table,
    // ORGANISM AUDIT #93 — tank state now HAS a health address. null when
    // tanks.json has never existed (never-born ≠ bleeding).
    fuel,
    // ORGANISM AUDIT #98 — the Boot Room's weekly line used to die in a closing
    // cmd window, so "did the genome run?" was unanswerable and /organism-doctor
    // read `Last Result: 0` and called it green. bootroom.mjs now appends one
    // row per run to bootroom_log.jsonl; this is that row's ADDRESS — loop_vitals
    // is already opened by the matchday skill and by brain_config's job inputs.
    // null (never run / no ledger) is reported as null, never as a green zero.
    genome: (world.genomeLastRun && typeof world.genomeLastRun === "object")
      ? { last_run: world.genomeLastRun.at || null, outcome: world.genomeLastRun.outcome || null,
          counter: world.genomeLastRun.counter || null, reason: world.genomeLastRun.reason || null }
      : null,
    // the physio's own body-day ledger, read back on the next run (finding
    // aff39f83) — the only accumulating record of days the ring reported
    body_days_seen,
    line: bleeds.length ? bleeds[0].line : null,     // EXCEPTION-ONLY VOICE
  };
}

function gatherWorld() {
  const fileNames = Object.keys(loadConfig().expected_cadence_hours);
  const files = {};
  for (const name of fileNames) {
    const p = join(STATE_DIR, name);
    if (!existsSync(p)) { files[name] = { exists: false }; continue; }
    // contentMs = what the file SAYS about itself, independent of when it was touched.
    // `generated_at` is the precise stamp; `day`/`date` is day-granularity, so anchor it
    // at START of that day — the conservative (older) reading, never a flattering one.
    const j = readJson(p);
    const stamp = j && (j.generated_at || j.day || j.date);
    // A day-granularity stamp is anchored at the END of its day: a file stamped TODAY is
    // 0h old whatever the clock says. Anchoring at midnight (the first cut) accused an
    // organ written 0h ago of holding "20h-old content" every evening — and loop_vitals'
    // line is spoken aloud by the Gaffer. (regression audit 30 Jul 2026)
    const isDay = /^\d{4}-\d{2}-\d{2}$/.test(String(stamp));
    const t = stamp ? Date.parse(isDay ? `${stamp}T23:59:59` : String(stamp)) : NaN;
    // sanity bound: a garbage stamp V8 happens to coerce ("2026" → year 2026, "5" → 2001)
    // must NOT become "content is 222788h old". Out of range ⇒ fall back to mtime alone.
    const ageH = (Date.now() - t) / 3600000;
    const usable = Number.isFinite(t) && ageH > -36 && ageH < 24 * 400;
    files[name] = { exists: true, mtimeMs: statSync(p).mtimeMs, contentMs: usable ? t : undefined };
  }
  const capsDir = join(STATE_DIR, "capsules");
  const capsules = existsSync(capsDir)
    ? readdirSync(capsDir).filter(f => f.endsWith(".json")).map(f => readJson(join(capsDir, f))).filter(Boolean)
    : [];
  const tsPath = join(STATE_DIR, "team_sheet.md");
  const wkPath = join(STATE_DIR, "weaknesses.json");
  const readiness = readJson(join(STATE_DIR, "readiness.json"));
  return {
    files,
    reps: readLines(join(STATE_DIR, "reps_log.jsonl")),
    timeaudit: readJson(join(STATE_DIR, "timeaudit.json")),
    weaknesses: readJson(wkPath),
    weaknessesMtime: existsSync(wkPath) ? statSync(wkPath).mtimeMs : null,
    teamSheetMtime: existsSync(tsPath) ? statSync(tsPath).mtimeMs : null,
    // ORGANISM AUDIT #70 — the orphan test reads the sheet's TEXT, because a
    // sheet that literally prints the headline has consumed it whatever the
    // mtimes say. null (unreadable) falls back to the mtime comparison.
    teamSheetText: (() => { try { return existsSync(tsPath) ? readFileSync(tsPath, "utf8") : null; } catch { return null; } })(),
    // ORGANISM AUDIT #93 — RAW read of tanks.json. Never `fuelboard.mjs status`
    // (it read-modify-writes the file under the tank lock), never an import of
    // fuelboard.mjs (the anemia organ must not inherit another organ's deps).
    tanks: readJson(join(STATE_DIR, "tanks.json")),
    tankRegistry: readJson(join(STATE_DIR, "fuelboard_config.json")),
    // ORGANISM AUDIT #98 — the last row of the Boot Room's own run ledger.
    // Read-only; physio never writes it (bootroom.mjs is its single writer).
    genomeLastRun: (() => { const rows = readLines(join(STATE_DIR, "bootroom_log.jsonl")); return rows.length ? rows[rows.length - 1] : null; })(),
    looseBalls: readLines(join(STATE_DIR, "loose_balls.jsonl")),
    throwinState: readJson(join(STATE_DIR, "throwin_state.json")),
    // the LATEST filed shift's gate verdict — read-only; nightshift.mjs is its single
    // writer. Reads the newest shift_*.json rather than today's, because a lane that
    // missed four nights (as it had, 2-6 Aug) must still be able to report its last
    // real verdict instead of going quiet exactly when something is wrong.
    gateTune: (() => {
      try {
        const dir = join(STATE_DIR, "brain_out", "nightshift");
        const f = readdirSync(dir).filter(x => /^shift_\d{4}-\d{2}-\d{2}\.json$/.test(x)).sort().pop();
        return f ? ((readJson(join(dir, f)) || {}).jobs || {}).gate_tune || null : null;
      } catch { return null; }
    })(),
    capsules,
    slip: readLines(join(STATE_DIR, "slip.jsonl")),
    fsrsStore: readJson(join(STATE_DIR, "fsrs_store.json")),
    readinessCount: readiness && typeof readiness.nights === "number" ? readiness.nights : 0,
    // BODY-DAY LEDGER (finding aff39f83): `nights` is capped at oura_coach's
    // 45-day fetch window, so the 84-day body_archive gate needs a source that
    // accumulates. The physio owns loop_vitals.json, so it reads its own last
    // ledger back and adds today's readiness day. A torn-token run (ok:false)
    // contributes nothing — an unanswered ring is not a day of body history.
    bodyDaysSeen: (readJson(VITALS) || {}).body_days_seen || [],
    readinessDay: readiness && readiness.ok !== false && typeof readiness.day === "string" ? readiness.day : null,
    referDoctor: !!(readiness && readiness.safety && readiness.safety.refer_doctor === true),
    // THE WEEKLY RITUALS — the machine holds the calendar so he never has to
    gemSyncDue: (() => {
      const s = readJson(join(STATE_DIR, "gem_sync_stamp.json"));
      if (!s || !s.at) return "no sync on record — the pocket examiner runs on an old cartridge";
      const days = (Date.now() - Date.parse(s.at)) / 86400000;
      return Number.isFinite(days) && days >= 7 ? `last synced ${Math.floor(days)} day(s) ago` : null;
    })(),
    genomePending: (() => {
      const last = {};
      for (const m of readLines(join(STATE_DIR, "mutations.jsonl"))) if (m && m.id) last[m.id] = m;
      return Object.values(last).some(m => m.status === "proposed");
    })(),
  };
}

// ---------------------------------------------------------------------------
// selftest — fixture world; no real state touched
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = loadConfig("__no_such__");
  const now = new Date(2026, 6, 12, 21, 30, 0);
  const H = 3600000;
  const base = {
    files: {}, reps: [], timeaudit: null, weaknesses: null, weaknessesMtime: null,
    teamSheetMtime: null, looseBalls: [], throwinState: null, capsules: [], slip: [],
    fsrsStore: null, readinessCount: 0, gateTune: null,
  };

  // healthy bloodless organism: nothing born, nothing bleeds, line null
  const quiet = compute({ ...base, files: { "cards.json": { exists: false } } }, cfg, now);
  assert("never-born files do NOT bleed (bloodless ≠ wounded)", quiet.bleeds.length === 0);
  assert("EXCEPTION-ONLY VOICE — line null when nothing bleeds", quiet.line === null);

  // audit #108 — THE WAKE-GATE VERDICT IS REPORTED, NEVER TUNED.
  // The tuner's own out-of-band finding lived in a markdown file nothing read.
  // This organ surfaces it and proposes nothing: no threshold is read from the
  // verdict, and an in-band gate must stay silent so the line keeps its meaning.
  {
    const oob = compute({ ...base, gateTune: { out_of_band: true, wakes_per_day: 0.33, band: [1, 8], decisions: 5940, days: 18 } }, cfg, now);
    const b = oob.bleeds.find(x => x.kind === "gate_out_of_band");
    assert("#108 an OUT-OF-BAND wake-gate is surfaced as a bleed (it had no reader at all)", !!b);
    assert("#108 the evidence quotes the tuner's OWN band and sample size, inventing nothing",
      b && /0\.33 wakes\/day/.test(b.evidence) && /\[1, 8\]/.test(b.evidence) && /5940 replayed/.test(b.evidence));
    assert("#108 it REPORTS, never proposes a threshold — and says to re-measure, not to tune",
      b && /do not tune it now/i.test(b.line));
    assert("#108 an IN-BAND gate stays silent (the line only ever speaks on exception)",
      compute({ ...base, gateTune: { out_of_band: false, wakes_per_day: 4, band: [1, 8], decisions: 900 } }, cfg, now).bleeds.every(x => x.kind !== "gate_out_of_band"));
    assert("#108 a night lane that never filed a shift cannot fabricate a gate verdict",
      compute({ ...base, gateTune: null }, cfg, now).bleeds.every(x => x.kind !== "gate_out_of_band"));
  }

  // stale bleed: existed, went quiet
  const stale = compute({ ...base, files: { "cards.json": { exists: true, mtimeMs: now.getTime() - 60 * H } } }, cfg, now);
  assert("existed-then-stale file bleeds", stale.bleeds.some(b => b.kind === "stale" && b.organ === "cards"));
  assert("line speaks when bleeding", typeof stale.line === "string");

  // CONTENT-STALE (audit 30 Jul 2026) — written on time, saying nothing new.
  // This is the disagreement tone.mjs could see and physio could not.
  const freshFile = { exists: true, mtimeMs: now.getTime() - 1 * H };
  const contentStale = compute({ ...base, files: { "cards.json": { ...freshFile, contentMs: now.getTime() - 90 * H } } }, cfg, now);
  const csb = contentStale.bleeds.find(b => b.kind === "stale" && b.organ === "cards");
  assert("a file touched on schedule with 90h-old CONTENT still bleeds", !!csb);
  assert("the evidence names the real cause, not the mtime", /CONTENT is/.test(csb.evidence) && /writing on time but saying nothing new/.test(csb.line));
  const contentFresh = compute({ ...base, files: { "cards.json": { ...freshFile, contentMs: now.getTime() - 2 * H } } }, cfg, now);
  assert("fresh content + fresh mtime = no bleed", !contentFresh.bleeds.some(b => b.kind === "stale"));
  // the Oura lag is legitimate and must NOT read as a wound
  const ouraLag = compute({ ...base, files: { "readiness.json": { ...freshFile, contentMs: now.getTime() - 44 * H } } }, cfg, now);
  assert("readiness' documented ≤2d Oura lag is tolerated, not called a bleed",
    !ouraLag.bleeds.some(b => b.kind === "stale" && b.organ === "readiness"));
  // THE TOLERANCE REPLACES THE CADENCE LIMIT, IT DOES NOT STACK ON IT (the C2 regression:
  // 30×1.25 + 48 = 85.5h of silence on a dead Oura, while claiming to be manager's ≤2d rule)
  const oura50 = compute({ ...base, files: { "readiness.json": { ...freshFile, contentMs: now.getTime() - 50 * H } } }, cfg, now);
  assert("readiness bleeds at >48h of content age — the documented rule, not 85.5h",
    oura50.bleeds.some(b => b.kind === "stale" && b.organ === "readiness"));
  const oura46 = compute({ ...base, files: { "readiness.json": { ...freshFile, contentMs: now.getTime() - 46 * H } } }, cfg, now);
  assert("and stays quiet just under it (46h)", !oura46.bleeds.some(b => b.kind === "stale" && b.organ === "readiness"));

  // PHANTOM TOPICS bleed on the bus, not just on a console nobody reads
  const ph = compute({ ...base, reps: [{ concept: "pandas dataframes", unregistered: true }, { concept: "embeddings" }] }, cfg, now);
  assert("an unregistered concept in reps_log bleeds by NAME",
    ph.bleeds.some(b => b.kind === "unregistered_concept" && /pandas dataframes/.test(b.evidence)));
  assert("registered concepts never bleed as phantoms",
    !compute({ ...base, reps: [{ concept: "embeddings" }] }, cfg, now).bleeds.some(b => b.kind === "unregistered_concept"));

  // THE WEEKLY RITUALS — the machine remembers, the mouth reminds
  const rit = compute({ ...base, gemSyncDue: "last synced 8 day(s) ago", genomePending: true }, cfg, now);
  assert("gem-sync due rides the vitals (he never has to remember)", rit.bleeds.some(b => b.kind === "gem_sync_due"));
  assert("a pending genome proposal is SAID, not buried", rit.bleeds.some(b => b.kind === "genome_pending"));

  // DOCTOR-REFERRAL — the flag must ride the vitals, never die in a file
  const refer = compute({ ...base, referDoctor: true }, cfg, now);
  assert("DOCTOR-REFERRAL rides the vitals to every surface (full stop)", refer.bleeds.some(b => b.kind === "doctor_referral") && typeof refer.line === "string");
  assert("the referral line carries a message, never a number", !/\d/.test(refer.bleeds.find(b => b.kind === "doctor_referral").line));

  // effort uncaptured (the real producer always stamps date — mocks match it)
  const effort = compute({ ...base, timeaudit: { date: "2026-07-12", buckets: { Learning: { minutes: 180 } } }, reps: [] }, cfg, now);
  assert("cameras-were-off bleed on effort without reps", effort.bleeds.some(b => b.kind === "effort_uncaptured" && b.line.includes("cameras were off")));
  const effortOk = compute({ ...base, timeaudit: { date: "2026-07-12", buckets: { Learning: { minutes: 180 } } }, reps: [{ ts: "2026-07-12T10:00:00Z", track: "concept", correct: true, concept: "x" }] }, cfg, now);
  assert("no effort bleed when reps flowed", !effortOk.bleeds.some(b => b.kind === "effort_uncaptured"));
  const effortDawn = compute({ ...base, timeaudit: { date: "2026-07-11", buckets: { Learning: { minutes: 180 } } }, reps: [] }, cfg, now);
  assert("DAWN GUARD — yesterday's minutes never accuse a day that hasn't started", !effortDawn.bleeds.some(b => b.kind === "effort_uncaptured"));

  // emitted-unconsumed — ORGANISM AUDIT #70. The old fixture omitted `status`
  // entirely, so it asserted the alarm on a headline the Manager is forbidden to
  // consume: it proved the false positive rather than the behaviour.
  const okHeadline = { status: "ok", low_confidence: false, headline: { topic: "chunking", one_line: "5× miss on chunking — axis f keeps breaking." } };
  const emit = compute({ ...base, weaknesses: okHeadline, weaknessesMtime: 100, teamSheetMtime: 50 }, cfg, now);
  assert("a status-ok headline on an older sheet → emitted_unconsumed bleed", emit.bleeds.some(b => b.kind === "emitted_unconsumed"));
  const emitNoSheet = compute({ ...base, weaknesses: okHeadline, weaknessesMtime: 100, teamSheetMtime: null }, cfg, now);
  assert("...and a missing sheet is still an orphan", emitNoSheet.bleeds.some(b => b.kind === "emitted_unconsumed" && /missing/.test(b.evidence)));
  // (a) the manager's silence law is NOT a wound: nemesis emits a headline while
  // warming_up on purpose, manager.mjs:167 refuses it on purpose. This is the
  // bleed that was live in loop_vitals.json on 4 Aug 2026 against 9 reps.
  const warmingHeadline = compute({ ...base, weaknesses: { status: "warming_up", low_confidence: true, headline: { topic: "hallucinations", one_line: "2× miss on hallucinations" } }, weaknessesMtime: 100, teamSheetMtime: 50 }, cfg, now);
  assert("a warming_up headline is NOT an orphan — the Manager is obeying the silence law",
    !warmingHeadline.bleeds.some(b => b.kind === "emitted_unconsumed"));
  const lowConf = compute({ ...base, weaknesses: { status: "ok", low_confidence: true, headline: { topic: "x", one_line: "y" } }, weaknessesMtime: 100, teamSheetMtime: 50 }, cfg, now);
  assert("...and neither is a low_confidence headline (manager.mjs:167's own pair)",
    !lowConf.bleeds.some(b => b.kind === "emitted_unconsumed"));
  // (b) content beats clocks: the daily heartbeat rewrite bumps weaknesses.json's
  // mtime past a sheet that is literally printing the line.
  const carried = compute({ ...base, weaknesses: okHeadline, weaknessesMtime: 100, teamSheetMtime: 50,
    teamSheetText: "TEAM SHEET\n   • 5× miss on chunking — axis f keeps breaking.\nCOYG." }, cfg, now);
  assert("a sheet that PRINTS the one_line has consumed it, whatever the mtimes say",
    !carried.bleeds.some(b => b.kind === "emitted_unconsumed"));
  const notCarried = compute({ ...base, weaknesses: okHeadline, weaknessesMtime: 100, teamSheetMtime: 50,
    teamSheetText: "TEAM SHEET\n   • instruments dark — nothing about chunking here.\nCOYG." }, cfg, now);
  assert("a real orphan still bleeds when the sheet is readable and silent",
    notCarried.bleeds.some(b => b.kind === "emitted_unconsumed" && /neither carries/.test(b.evidence)));

  // FUEL — ORGANISM AUDIT #93. No health surface read tank state; physio had
  // zero "tank" hits while T1/T2 sat COLD.
  const tanksToday = (states) => ({ day: localDate(now), tanks: Object.fromEntries(Object.entries(states).map(([k, v]) => [k, { state: v }])) });
  const registry = { tanks: [{ id: "T1", region: "mouth" }, { id: "T2", region: "vision" }, { id: "T7", region: "default-mode" }] };
  const dry = compute({ ...base, tanks: tanksToday({ T1: "COLD", T2: "COLD", T7: "COLD" }), tankRegistry: registry }, cfg, now);
  assert("all tanks cold TODAY → fuel_dry bleeds (the voice has nothing to speak with)",
    dry.bleeds.some(b => b.kind === "fuel_dry") && dry.fuel.usable.length === 0);
  const mouthCold = compute({ ...base, tanks: tanksToday({ T1: "COLD", T2: "HOT", T7: "HOT" }), tankRegistry: registry }, cfg, now);
  assert("the MOUTH tank cold bleeds on its own, named from the registry not a constant",
    mouthCold.bleeds.some(b => b.kind === "mouth_cold") && mouthCold.fuel.mouth_tank === "T1");
  const fuelOk = compute({ ...base, tanks: tanksToday({ T1: "HOT", T2: "WARM", T7: "HOT" }), tankRegistry: registry }, cfg, now);
  assert("HOT/WARM tanks never bleed (fuelboard.mjs:203's own definition of usable)",
    !fuelOk.bleeds.some(b => /fuel|mouth/.test(b.kind)) && fuelOk.fuel.usable.length === 3);
  // HONESTY: a board written two days ago is an UNREAD board, not a cold one —
  // fuelboard day-resets last_429 at local midnight, so yesterday's COLD is not
  // today's state and must never be reported as if it were.
  const staleBoard = compute({ ...base, tanks: { day: "2026-07-10", tanks: { T1: { state: "COLD" } } }, tankRegistry: registry }, cfg, now);
  assert("a stale fuel board is reported as NOT TODAY'S READING and never bleeds",
    !staleBoard.bleeds.some(b => /fuel|mouth/.test(b.kind)) &&
    staleBoard.fuel.reading_is_today === false && /NOT TODAY'S READING/.test(staleBoard.fuel.note));
  assert("a tanks.json that never existed is null, not a wound (never-born ≠ bleeding)",
    compute(base, cfg, now).fuel === null);

  // GENOME — ORGANISM AUDIT #98. The Boot Room's weekly line vanished into a
  // closing cmd window; bootroom.mjs now leaves a row, and this is its address.
  const gen = compute({ ...base, genomeLastRun: { at: "2026-07-12T14:30:00.000Z", day: "2026-07-12", mode: "run", outcome: "gate_closed", reason: "9/200 reps — the genome is listening, not proposing yet (speak-gate on volume)", counter: { have: 9, need: 200, kind: "volume_gate" } } }, cfg, now);
  assert("the Boot Room's last run reaches a surface a human already opens",
    gen.genome.outcome === "gate_closed" && gen.genome.counter.have === 9 && gen.genome.counter.need === 200);
  assert("a genome that has never run reports null, never a green zero",
    compute(base, cfg, now).genome === null);

  // ORGANISM AUDIT #69 — the literal pair is GONE, and what sits at the top of
  // the file inside talk.mjs's 400-char clip is a count, not a verdict.
  assert("loop_vitals no longer carries the zero-information status/low_confidence pair",
    !("status" in emit) && !("low_confidence" in emit));
  assert("the first 400 chars talk.mjs clips now open with an honest bleed count",
    JSON.stringify(emit).slice(0, 400).includes('"summary":"1 bleed(s): emitted_unconsumed"'));
  assert("...and 'no bleeds' when nothing bleeds (never a false alarm either way)",
    compute(base, cfg, now).summary === "no bleeds");

  // throw-in gap: wired + flowed + silent
  const gap = compute({ ...base, throwinState: { wired: true }, looseBalls: [{ ts: new Date(now.getTime() - 6 * 86400000).toISOString() }] }, cfg, now);
  assert("wired+flowed+silent → throwin_gap (delivery, not usage)", gap.bleeds.some(b => b.kind === "throwin_gap"));
  const noGap = compute({ ...base, throwinState: { wired: false }, looseBalls: [] }, cfg, now);
  assert("unwired poller never bleeds (usage never coached)", !noGap.bleeds.some(b => b.kind === "throwin_gap"));

  // LOCAL-DAY REPS — E2E audit (25 Jul 2026, finding 87f8f8da). A rep captured
  // at 02:00 IST carries YESTERDAY's UTC day, but it belongs to the local day
  // the captain actually played — the day timeaudit.date names. Both fixtures
  // are built off the LOCAL clock so they mean the same thing on any machine.
  const taToday = { date: "2026-07-12", buckets: { Learning: { minutes: 180 } } };
  const atLocal = (d, h, m) => new Date(2026, 6, d, h, m, 0).toISOString();
  const oneRep = (ts) => [{ ts, track: "concept", correct: true, concept: "x" }];
  const dawnRep = compute({ ...base, timeaudit: taToday, reps: oneRep(atLocal(12, 2, 0)) }, cfg, now);
  assert("a 02:00-local rep counts for TODAY (a UTC slice files it yesterday)", !dawnRep.bleeds.some(b => b.kind === "effort_uncaptured"));
  // ...and the counting stays TIGHT: last night's rep must not silence today.
  const staleRep = compute({ ...base, timeaudit: taToday, reps: oneRep(atLocal(11, 23, 0)) }, cfg, now);
  assert("yesterday's 23:00 rep does NOT count for today (the fix widens nothing)", staleRep.bleeds.some(b => b.kind === "effort_uncaptured"));

  // speak gates
  // Slip fixtures carry `date` + `claim` like the real ledger does — without
  // them all 31 rows collapse to one identity under the LAST-WINS dedupe the
  // scorer's canon requires (finding 029c3bae), which is a fixture artefact,
  // never a property of slip.jsonl.
  const slipDay = (i) => localDate(new Date(2026, 5, 1 + i));
  const gates = compute({ ...base,
    slip: Array.from({ length: 31 }, (_, i) => ({ date: slipDay(i), book: "twin", type: "floor_touched", claim: "floor touched", resolved: true, hit: i % 2 === 0, p: 0.6 })),
    capsules: [{ doubts: Array(20).fill({ q: "q", a: "a" }) }, { doubts: Array(20).fill({ q: "q", a: "a" }) }, { doubts: Array(15).fill({ q: "q", a: "a" }) }, { doubts: Array(10).fill({ q: "q", a: "a" }) }],
    reps: Array(250).fill({ ts: "2026-07-01T00:00:00Z", track: "concept", correct: true, concept: "x" }),
  }, cfg, now);
  assert("twin_voice gate opens at 30 resolutions", gates.speak_gates.twin_voice === true);
  assert("doubt_clusters gate opens at 4 capsules + 60 doubts", gates.speak_gates.doubt_clusters === true);
  assert("bootroom gate opens at 200 reps", gates.speak_gates.bootroom_mutation === true);
  assert("body_archive gate closed below 84 days", gates.speak_gates.body_archive === false);
  const gatesClosed = compute(base, cfg, now);
  assert("all gates closed on bloodless organism", Object.values(gatesClosed.speak_gates).every(v => v === false));

  // THE UNGATE — ORGANISM AUDIT #102/#103/#104/#106. A shut gate must publish
  // its CLIMB, not just its verdict. Every `need` below is read from cfg, so a
  // lowered gate would break these — they cannot be satisfied by relaxing a bar.
  const ungate = compute({ ...base,
    reps: Array.from({ length: 9 }, () => ({ ts: "2026-07-01T00:00:00Z", track: "concept", correct: true, concept: "x" })),
    fsrsStore: { cards: [{ id: "a", stability: 1, reps: 4 }, { id: "b", stability: 1, reps: 2 }] },
    capsules: [{ doubts: Array(30).fill({ q: "q" }) }],
    slip: Array.from({ length: 12 }, (_, i) => ({ date: slipDay(i), book: "twin", type: "floor_touched", claim: "c", resolved: true, hit: true, p: 0.6 })),
  }, cfg, now);
  const C = ungate.speak_gate_counters;
  assert("#102 boot room shows its n from rep 1 (9/200 reps), never a bare false",
    C.bootroom_mutation.line === `9/${cfg.gates.bootroom_min_reps} reps` && C.bootroom_mutation.open === false);
  assert("#103 apni ghadi shows have/need in matured CARDS, and names the maturity bar",
    C.apni_ghadi.have === 1 && C.apni_ghadi.need === cfg.gates.apni_ghadi.min_cards &&
    C.apni_ghadi.unit === `cards with ≥${cfg.gates.apni_ghadi.min_reps_per_card} reps`);
  assert("twin + doubt-cluster + body-archive gates all carry counters too",
    C.twin_voice.line === `12/${cfg.gates.twin_voice_min_resolutions} resolutions on one claim-type` &&
    C.doubt_clusters.line === `1/${cfg.gates.doubt_clusters.min_capsules} capsules · 30/${cfg.gates.doubt_clusters.min_doubts} doubts` &&
    C.body_archive.need === cfg.gates.body_archive_min_days);
  assert("every counter's `open` agrees with the boolean gate it stands beside (no drift)",
    Object.entries(ungate.speak_gates).every(([k, v]) => C[k].open === v));
  assert("speak_gates stays a flat boolean map — bootroom.mjs:256 reads it as one",
    Object.values(ungate.speak_gates).every(v => typeof v === "boolean"));
  // #104/#106 — the signal table says "7/20", not the bare word "gated".
  assert("#104 signal-table rows show n/min_n instead of the word 'gated'",
    ungate.signal_table.every(r => (r.brier !== null || r.hit_rate !== null) || new RegExp(`^${r.n}/${cfg.signal_table.min_n} `).test(r.note)) &&
    !ungate.signal_table.some(r => /^gated/.test(r.note)));
  assert("...and the gate itself is NOT lowered — no brier below min_n",
    ungate.signal_table.every(r => r.brier === null || r.n >= cfg.signal_table.min_n));

  // BODY-ARCHIVE — finding aff39f83: readiness.nights is structurally capped at
  // 45 by oura_coach's fetch window, so an 84-day gate could never open off it.
  const archDays = Array.from({ length: 90 }, (_, i) => localDate(new Date(2026, 3, 1 + i)));
  const arch = compute({ ...base, readinessCount: 45, bodyDaysSeen: archDays, readinessDay: "2026-07-12" }, cfg, now);
  assert("body_archive opens on the physio's OWN day-ledger, not the capped 45-night window", arch.speak_gates.body_archive === true);
  assert("the ledger grows by the day witnessed (tomorrow's run remembers today)", arch.body_days_seen.includes("2026-07-12") && arch.body_days_seen.length === 91);

  // LAST-WINS — finding 029c3bae: the scorer APPENDS a correction row when late
  // reps flip a twin resolution, so one market-day can appear twice with
  // opposite verdicts. It must buy neither double volume nor double scoring.
  const twin20 = Array.from({ length: 20 }, (_, i) => ({ date: slipDay(i), book: "twin", type: "floor_touched", claim: "floor touched", resolved: true, hit: false, p: 0.6 }));
  const corrected = compute({ ...base, slip: [...twin20, ...twin20.slice(0, 5).map(s => ({ ...s, hit: true }))] }, cfg, now);
  const twinRow = corrected.signal_table.find(s => s.organ === "twin");
  assert("25 slip rows over 20 market-days score as 20", twinRow.n === 20);
  assert("...and the CORRECTED verdict is the one scored", twinRow.brier === round((15 * 0.36 + 5 * 0.16) / 20, 4));
  const inflated = compute({ ...base, slip: (() => { const r = Array.from({ length: 29 }, (_, i) => ({ date: slipDay(i), book: "twin", type: "floor_touched", claim: "floor touched", resolved: true, hit: true, p: 0.6 })); return [...r, { ...r[0], hit: false }]; })() }, cfg, now);
  assert("a correction never pays the twin_voice gate twice (29 days ≠ 30)", inflated.speak_gates.twin_voice === false);

  // THE GAFFER'S ROW — finding 4ee75ad6: scorer.mjs writes EVERY gaffer row with
  // p:null, so a p-only Brier left the row permanently n=0 and lying "gated".
  const gafSlip = Array.from({ length: 24 }, (_, i) => ({ date: slipDay(i), book: "gaffer", type: "drill:recall", claim: "embeddings", resolved: true, hit: i % 4 !== 0, p: null }));
  const gafRow = compute({ ...base, slip: gafSlip }, cfg, now).signal_table.find(s => s.organ === "gaffer");
  assert("the gaffer's book scores on hit-rate (p:null is all the scorer ever writes)", gafRow.n === 24 && gafRow.hit_rate === 0.75);
  assert("...so a full gaffer book never reports itself 'gated'", !/gated/.test(gafRow.note));

  // FSRS — finding 9faeef60: v0 measured every rep against the card's CURRENT
  // due, so p was the constant 0.9 and the "brier" was accuracy in a costume.
  // A 1-day-stability card answered a year late must be forecast LOW, not 0.9.
  const fsrsWorld = {
    fsrsStore: { cards: [{ id: "embeddings", concept: "embeddings", stability: 1, due: "2027-01-01T00:00:00.000Z", reps: 21 }] },
    reps: Array.from({ length: 21 }, (_, i) => ({ ts: new Date(Date.UTC(2024, 0, 1 + i * 365)).toISOString(), track: "concept", correct: false, concept: "  Embeddings " })),
  };
  const fsrsRow = compute({ ...base, ...fsrsWorld }, cfg, now).signal_table.find(s => s.organ === "fsrs");
  assert("fsrs scores INTERVALS not the current due-date, and normId's the concept (21 reps → 20 forecasts)", fsrsRow.n === 20);
  assert("a year-late rep on a 1-day-stability card is forecast LOW (v0's constant 0.9 scored 0.81)", fsrsRow.brier !== null && fsrsRow.brier < 0.3);

  // signal table: GOVERNOR EXEMPT + gating
  assert("GOVERNOR EXEMPT — never in the signal table", !gates.signal_table.some(s => /governor|goalkeeper|oura|readiness/i.test(s.organ)));
  assert("twin brier computed at n≥20", gates.signal_table.find(s => s.organ === "twin").brier !== null);
  assert("fsrs brier gated below n", gatesClosed.signal_table.find(s => s.organ === "fsrs").brier === null);

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const cfg = loadConfig();
  const out = compute(gatherWorld(), cfg, new Date());
  writeAtomic(VITALS, out);
  // ORGANISM AUDIT #106 — stdout stops saying "none (awaiting blood)" and starts
  // saying how far away each closed gate is. Same numbers as the file; no organ
  // has to be opened to read the climb.
  const shut = Object.entries(out.speak_gate_counters)
    .filter(([k]) => out.speak_gates[k] === false)
    .map(([k, c]) => `${k} ${c.line}`);
  const open = Object.entries(out.speak_gates).filter(([, v]) => v).map(([k]) => k);
  console.log(`physio: ${out.summary}${out.fuel ? ` · fuel ${out.fuel.reading_is_today ? `${out.fuel.usable.length}/${Object.keys(out.fuel.states).length} tanks usable` : `board last read ${out.fuel.day} (not today)`}` : ""} → ${VITALS}`);
  console.log(`physio: gates open: ${open.join(", ") || "none yet"}${shut.length ? ` · climbing: ${shut.join(" · ")}` : ""}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

// fsrsSignalLegacy is exported, not orphaned: the layering law keeps the frozen
// v0 in the codebase (E2E audit 25 Jul 2026, finding 9faeef60), and an engine
// nothing can call is an engine nobody can compare the new one against.
// gatherWorld is exported so a health surface can take a READ-ONLY preview of
// the vitals without shelling `physio.mjs run` (which writes loop_vitals.json).
// It performs no writes of any kind — readJson / readLines / statSync only.
export { compute, loadConfig, fsrsSignal, fsrsSignalLegacy, gatherWorld, fuelRead };
