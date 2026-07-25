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
  },
  grace_frac: 0.25,
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

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        expected_cadence_hours: { ...DEFAULTS.expected_cadence_hours, ...(j.expected_cadence_hours || {}) },
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
  return { organ: "fsrs", brier, n,
    note: brier === null ? "gated (needs n≥" + cfg.signal_table.min_n + ")"
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
  for (const [name, hrs] of Object.entries(cfg.expected_cadence_hours)) {
    const f = world.files[name];
    if (!f || !f.exists) continue;                       // never born → status quo
    const ageH = (nowMs - f.mtimeMs) / 3600000;
    if (ageH > hrs * (1 + cfg.grace_frac)) {
      bleeds.push({ organ: name.replace(".json", ""), kind: "stale",
        evidence: `${name} is ${round(ageH, 1)}h old (cadence ${hrs}h)`,
        line: `${name.replace(".json", "")} went quiet — its file is ${Math.round(ageH)}h old.` });
    }
  }

  // 2) EMITTED-BUT-NEVER-CONSUMED — a weakness headline no sheet ever surfaced.
  if (world.weaknesses && world.weaknesses.headline && world.weaknessesMtime) {
    if (!world.teamSheetMtime || world.teamSheetMtime < world.weaknessesMtime) {
      bleeds.push({ organ: "nemesis→manager", kind: "emitted_unconsumed",
        evidence: "weaknesses.headline set but team_sheet.md missing or older",
        line: "the scout filed a headline no sheet has carried yet." });
    }
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

  // 5) MIRROR-STALE handled by (1) via mirror_manifest.json cadence.

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
    signal_table.push({ organ, brier, hit_rate, n,
      note: brier !== null ? "brier over slip"
        : hit_rate !== null ? "hit-rate over resolved unpriced claims (this book writes no p)"
        : "gated (needs n≥" + cfg.signal_table.min_n + ")" });
  }

  return {
    date: localDate(now),
    status: "ok",
    low_confidence: false,
    generated_at: now.toISOString(),
    bleeds,
    speak_gates,
    signal_table,
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
    files[name] = existsSync(p) ? { exists: true, mtimeMs: statSync(p).mtimeMs } : { exists: false };
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
    looseBalls: readLines(join(STATE_DIR, "loose_balls.jsonl")),
    throwinState: readJson(join(STATE_DIR, "throwin_state.json")),
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
    fsrsStore: null, readinessCount: 0,
  };

  // healthy bloodless organism: nothing born, nothing bleeds, line null
  const quiet = compute({ ...base, files: { "cards.json": { exists: false } } }, cfg, now);
  assert("never-born files do NOT bleed (bloodless ≠ wounded)", quiet.bleeds.length === 0);
  assert("EXCEPTION-ONLY VOICE — line null when nothing bleeds", quiet.line === null);

  // stale bleed: existed, went quiet
  const stale = compute({ ...base, files: { "cards.json": { exists: true, mtimeMs: now.getTime() - 60 * H } } }, cfg, now);
  assert("existed-then-stale file bleeds", stale.bleeds.some(b => b.kind === "stale" && b.organ === "cards"));
  assert("line speaks when bleeding", typeof stale.line === "string");

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

  // emitted-unconsumed
  const emit = compute({ ...base, weaknesses: { headline: { topic: "chunking" } }, weaknessesMtime: 100, teamSheetMtime: 50 }, cfg, now);
  assert("headline older sheet → emitted_unconsumed bleed", emit.bleeds.some(b => b.kind === "emitted_unconsumed"));

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
  console.log(`physio: ${out.bleeds.length} bleed(s)${out.bleeds.length ? " — " + out.bleeds.map(b => b.kind).join(", ") : ""} · gates open: ${Object.entries(out.speak_gates).filter(([, v]) => v).map(([k]) => k).join(", ") || "none (awaiting blood)"} → ${VITALS}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

// fsrsSignalLegacy is exported, not orphaned: the layering law keeps the frozen
// v0 in the codebase (E2E audit 25 Jul 2026, finding 9faeef60), and an engine
// nothing can call is an engine nobody can compare the new one against.
export { compute, loadConfig, fsrsSignal, fsrsSignalLegacy };
