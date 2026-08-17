#!/usr/bin/env node
// ============================================================================
// learning_state.mjs · ARSENAL AI FC — AGENT #4: LEARNING-STATE (the Maidan)
// ----------------------------------------------------------------------------
// WHAT:  The fluency / positional map — per concept & skill fluency-state
//        (🔴🟡🟢), velocity/trajectory, per-axis rollup, Re-Jirah decay-due,
//        edge-map, confusion-pairs, and the Maidan field-formation. The learning
//        layer's positional read for the Manager. CONSUMER only (never writes reps).
// WHY:   FSRS says WHEN to review, Calibration says how HONEST, Nemesis says the
//        recurring KIND-of-thinking. Learning-state says WHERE you stand and which
//        way you're moving — the shape, so the Manager can pick the sharpest block.
//
// NIDHI BOUNDARY (law): tracks OUTCOMES / STATE only (WHAT/SHAPE/INTENSITY/DONE).
//   HOW you learn — pedagogy, drill mechanics, learning-order — is UNTOUCHED.
//   v0 SEED: stage/handoff STRUCTURE is real domain architecture; the fluency/runnable
//   THRESHOLDS are v0 hypotheses in config, calibrated at first R1 run (lossless re-run).
//
// INPUTS (reads-only; each missing ⇒ graceful skip, never crash):
//   reps_log.jsonl          — fluency, velocity, edge, confusions (BOTH tracks)
//   fsrs_store.json         — per-card `due` → rejirah_due (decay stays FSRS-owned; we only join axis)
//        ⚠ NAME COLLISION (audit #10, 4 Aug 2026): the field below is called
//        `rejirah_due` but it is **FSRS's rep schedule**, NOT the FORGE capsule's
//        Re-Jirah. They answer different questions and neither overrides the other:
//        FSRS = which REP to drill next (rep-driven, per-card); capsule Re-Jirah =
//        which locked CAPSULE needs a fresh 9-axis defence (lockedOn-driven,
//        per-capsule, owned by capsule_bridge.mjs). The name was borrowed and has
//        confused every reader since. It is NOT renamed here — several organs read
//        this key — but nothing downstream may treat it as the capsule schedule.
//   concepts.json           — axis authority + bucket + `core` flag + canonicalize
//   learning_state_config.json — thresholds + Maidan structure (missing ⇒ built-in defaults)
//   forge_session.json      — the FORGE pacer's live position (read-only; forge_session.mjs owns it)
//   forge_sessions.jsonl    — append-only history of ENDED forge sessions (read-only, same owner)
//
// OUTPUT: dressing-room/state/learning_state.json (single writer; TRACKED in the public
//   repo — his 9 Aug 2026 ruling, verbatim: "i do not care putting my data in the public
//   repo". This header claimed "gitignored — derived PII" while the file was tracked.)
//   Manager §10 surface fields (maidan_stage_focus, weak_connection, python_fluency,
//   rejirah_due, core_vs_light) + rich additive (concepts[], axes[], maidan{}, position{}).
//
// FLUENCY LADDER: 🔴 learning → 🟡 held (≥held_streak consecutive correct) →
//   🟢 fluent (≥fluent_streak consecutive COLD-FAST). cold-fast = correct ∧ knew ∧
//   (latency ≤ fast | latency absent) ∧ (skill ⇒ aided:false). A miss resets toward 🔴;
//   a correct-but-slow rep drops 🟢→🟡 (held ≠ fluent). aided:true never earns skill 🟢.
//
// MODES: recompute (default) · selftest
// RULES (CONDUCTOR §4): deterministic · zero-LLM · no API key · Node 22 ESM · Windows-safe
//   entry guard · atomic write (temp→rename) · empty-safe · never fabricate · matches house style.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { supersedeReps } from "./capture.mjs";   // BLOCK 4 — the SOLE WRITER of reps_log owns what supersession means

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const REPS_LOG   = join(STATE_DIR, "reps_log.jsonl");
const FSRS_STORE = join(STATE_DIR, "fsrs_store.json");
const CONCEPTS   = join(STATE_DIR, "concepts.json");
const CFG_PATH   = join(STATE_DIR, "learning_state_config.json");
const OUT        = join(STATE_DIR, "learning_state.json");
// read-only, owned by forge_session.mjs — see the FORGE POSITION section below
const FORGE_SESSION = join(STATE_DIR, "forge_session.json");
const FORGE_HISTORY = join(STATE_DIR, "forge_sessions.jsonl");

const DEFAULTS = {
  thresholds: { held_streak: 2, fluent_streak: 3, latency_fast_ms: 8000, stage_runnable_frac: 0.75, warming_up_min_reps: 12, stall_reps: 6 },
  maidan: {
    stages: [
      { id: "fundamentals", label: "Fundamentals", order: 1, concepts: ["tokenization"] },
      { id: "rag_pipeline", label: "RAG pipeline", order: 2, concepts: ["chunking", "embeddings", "retrieval", "rag_eval"] },
      { id: "agents", label: "Agents", order: 3, concepts: ["tool_use"] },
    ],
    handoffs: [
      { from: "tokenization", to: "embeddings", label: "text → vectors" },
      { from: "chunking", to: "embeddings", label: "chunks → vectors" },
      { from: "embeddings", to: "retrieval", label: "vectors → top-k" },
      { from: "retrieval", to: "rag_eval", label: "results → eval" },
    ],
  },
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const CONF = new Set(["knew", "shaky", "guessed"]);
const TRACKS = new Set(["concept", "skill"]);
const normText = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
const numOr = (x, d) => (typeof x === "number" && !Number.isNaN(x) ? x : d);
const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
// isoDate = UTC calendar-date slice. FROZEN (layering law) — it no longer feeds
// `last_seen`. E2E audit (25 Jul 2026) caught it disagreeing with the envelope
// `date`, which is localDate(now) i.e. IST: capture.mjs stamps ts as ISO-UTC, so
// every rep logged between 00:00 and 05:30 IST sliced back to the PREVIOUS UTC day.
// A 01:00 IST drill on 22 Jul emitted date:"2026-07-22" but last_seen:"2026-07-21",
// so any consumer asking "drilled today?" by comparing the two saw a concept that
// was in fact drilled hours ago as untouched. Kept for callers that want the UTC day.
const isoDate = (ts) => String(ts).slice(0, 10);
// localDayOf = the LOCAL calendar day of a rep timestamp — same wall clock the
// envelope `date` runs on, so last_seen and date are directly comparable.
// (E2E audit 25 Jul 2026 fix; unparseable ts falls back to the old slice.)
const localDayOf = (ts) => { const d = new Date(ts); return Number.isNaN(d.getTime()) ? isoDate(ts) : localDate(d); };
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

const RANK  = { learning: 0, held: 1, fluent: 2 };
const LABEL = { learning: "🔴 learning", held: "🟡 held", fluent: "🟢 fluent" };
const EMOJI = { learning: "🔴", held: "🟡", fluent: "🟢" };

// sanitizeMaidan — E2E audit (25 Jul 2026): loadConfig used to swallow j.maidan
// WHOLESALE the moment `stages` was an Array, checking nothing inside it. One
// malformed stage (e.g. the `concepts:` line dropped while hand-editing thresholds
// during R1 calibration) still passed that gate and then threw TypeError inside
// compute — `s.concepts.slice()` in stageSkeleton and `members.filter(...)` in the
// stage rollup — so the 08:45 recompute exited non-zero and learning_state.json
// quietly went stale: the Manager kept reading yesterday's positional map with no
// error anywhere. Now every stage/handoff is shape-checked, a stage with no usable
// concepts degrades to an empty (awaiting_data) stage instead of exploding, and if
// NOTHING survives we fall back to the built-in Maidan rather than an empty field.
function sanitizeMaidan(m, fallback) {
  const src = (m && typeof m === "object") ? m : {};
  const stages = (Array.isArray(src.stages) ? src.stages : [])
    .filter((s) => s && typeof s === "object" && typeof s.id === "string" && s.id.trim() !== "")
    .map((s) => ({
      ...s,
      label: typeof s.label === "string" ? s.label : s.id,
      concepts: (Array.isArray(s.concepts) ? s.concepts : []).filter((c) => typeof c === "string" && c.trim() !== ""),
    }));
  if (!stages.length) return JSON.parse(JSON.stringify(fallback));
  const handoffs = (Array.isArray(src.handoffs) ? src.handoffs : [])
    .filter((h) => h && typeof h === "object" && typeof h.from === "string" && typeof h.to === "string")
    .map((h) => ({ ...h, label: typeof h.label === "string" ? h.label : `${h.from} → ${h.to}` }));
  return { ...src, stages, handoffs };
}

function loadConfig(path = CFG_PATH) {
  const d = DEFAULTS;
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      const t = j.thresholds || {};
      return {
        thresholds: {
          held_streak: numOr(t.held_streak, d.thresholds.held_streak),
          fluent_streak: numOr(t.fluent_streak, d.thresholds.fluent_streak),
          latency_fast_ms: numOr(t.latency_fast_ms, d.thresholds.latency_fast_ms),
          stage_runnable_frac: numOr(t.stage_runnable_frac, d.thresholds.stage_runnable_frac),
          warming_up_min_reps: numOr(t.warming_up_min_reps, d.thresholds.warming_up_min_reps),
          stall_reps: numOr(t.stall_reps, d.thresholds.stall_reps),
        },
        // was: (j.maidan && Array.isArray(j.maidan.stages)) ? j.maidan : d.maidan
        // — array-ness of `stages` said nothing about the stages themselves (E2E audit 25 Jul 2026).
        maidan: sanitizeMaidan(j.maidan, d.maidan),
      };
    }
  } catch { /* malformed ⇒ defaults */ }
  return JSON.parse(JSON.stringify(d));
}

function loadRegistry(path = CONCEPTS) {
  const reg = { conceptAlias: new Map(), skillAlias: new Map(), axes: {}, conceptMeta: {}, skillMeta: {}, loaded: false };
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      reg.axes = j.axes || {};
      for (const [id, def] of Object.entries(j.concepts || {})) { reg.conceptMeta[id] = def || {}; reg.conceptAlias.set(normText(id), id); for (const a of (def?.aliases || [])) reg.conceptAlias.set(normText(a), id); }
      for (const [id, def] of Object.entries(j.skills || {})) { reg.skillMeta[id] = def || {}; reg.skillAlias.set(normText(id), id); for (const a of (def?.aliases || [])) reg.skillAlias.set(normText(a), id); }
      reg.loaded = true;
    }
  } catch { /* malformed ⇒ loaded false */ }
  return reg;
}
const EMPTY_REG = { conceptAlias: new Map(), skillAlias: new Map(), axes: {}, conceptMeta: {}, skillMeta: {}, loaded: false };

const canonId = (r, reg) => {
  const key = normText(r.concept);
  const map = r.track === "skill" ? reg.skillAlias : reg.conceptAlias;
  return map.has(key) ? map.get(key) : key;
};
const coreOf = (id, track, reg) => ((track === "skill" ? reg.skillMeta[id] : reg.conceptMeta[id])?.core === true);
const axisLabel = (reg, ax) => (ax ? (reg.axes[ax] ? `${ax} (${reg.axes[ax]})` : ax) : null);

function validRep(r) {
  return r && typeof r === "object" && typeof r.ts === "string" && !Number.isNaN(Date.parse(r.ts))
    && CONF.has(r.confidence) && typeof r.correct === "boolean"
    && typeof r.concept === "string" && r.concept.trim() !== "" && TRACKS.has(r.track);
}
function loadReps(path) {
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) { const s = line.trim(); if (!s) continue; try { const o = JSON.parse(s); if (validRep(o)) out.push(o); } catch { /* skip */ } }
  // BLOCK 4 (17 Aug 2026) — a corrected verdict must stop counting here too, or the
  // fluency ladder keeps stepping on a verdict that was already taken back.
  // capture.mjs is the SOLE WRITER of reps_log, so supersession is its definition,
  // imported rather than re-implemented in each of the four private readers.
  return supersedeReps(out);
}
function loadFsrsCards(path = FSRS_STORE) {
  try { if (existsSync(path)) { const j = JSON.parse(readFileSync(path, "utf8")); if (Array.isArray(j.cards)) return j.cards; } } catch { /* skip */ }
  return [];
}
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// ---------------------------------------------------------------------------
// FORGE POSITION — the pacer's live position, projected onto the bus (READ-ONLY)
// ---------------------------------------------------------------------------
// WHY IT EXISTS (1 Aug 2026): forge_session.json had exactly ONE reader — the
// script that writes it. dugout.mjs (THE GAFFER, the organ that talks to him in
// real time) opens ~30 state files and that was never one of them, so the voice
// answering "where was I?" could not name the concept on the table or the step it
// was on — while the answer sat on disk two directories away. Learning-state
// already answers WHERE HE STANDS across concepts; where he stands RIGHT NOW is
// the same question at a shorter timescale, so the projection rides this file
// instead of a new organ. The SINGLE-WRITER law is untouched: forge_session.mjs
// still owns both files and we only ever read them — a one-way afferent nerve,
// the same pattern mirror.mjs uses.
//
// WHY A COPY AND NOT AN IMPORT: forge_session.mjs dispatches its CLI at MODULE
// SCOPE — it has no `import.meta.url === argv[1]` entry guard (this file does,
// at the bottom). Importing it would run its `switch (mode)` against OUR argv, so
// a plain `node scripts/learning_state.mjs selftest` would fire forge_session's
// OWN selftest and process.exit() before a single rep was read. So we read the
// JSON and duplicate the three small constants below. Copies drift — but a drifted
// copy shows up as the Gaffer naming a step the pacer's own contract line does
// not, which is loud and cheap. A coupling that can hijack the process is neither.
//
// TOPIC-AGNOSTIC BY CONSTRUCTION: nothing here knows a concept name. The concept
// is whatever string the pacer wrote; every axis list is derived from a..i.
const FORGE_STEPS = [                                     // THE METHOD, verbatim order
  "TIME-BOX", "DARAAR-MAP", "PEHLE-GUESS", "SAMJHAO", "DIKHAO", "SAATH-KARO",
  "AKELE-KARO", "BOLO", "CALIBRATE", "JIRAH", "LOCK", "RE-JIRAH",
];
const FORGE_AXES = "abcdefghi".split("");
const FORGE_STALE_HOURS = 18;               // forge_session: "a study session does not span a night"

// The shape is CONSTANT — present in every output, on every path, whether or not
// a session exists. A consumer that has to branch on `position` being absent will
// eventually forget to, and the Gaffer would then read `undefined.concept`.
const emptyPosition = () => ({
  session_open: false, concept: null, step: null, step_name: null,
  axes_done: [], axes_deferred: [], axes_left: [], axes_ungraded: [],
  started_at: null, stale: false, stale_as_of: null, last_closed: null,
});

// last_closed rides the LAST history row and is populated INDEPENDENTLY of whether
// a session is open — "what did he finish last" and "what is he on now" are two
// different questions and the Gaffer asks both.
//
// ORGANISM AUDIT #29 (4 Aug 2026) — CONFIRMED, AND NOW LOAD-BEARING. The audit found
// this block correct and unread: `grep -rn last_closed` over scripts/, .claude/ and
// hooks/ returned only this file. brain.mjs reads ls.position but gates the whole
// block on session_open and never reaches here, so the one artifact of yesterday's
// teaching — what he actually finished, which steps ran, which axes are still
// untouched — reached no surface. brain.mjs's buildFingerprint is being wired to it.
// THE PRODUCER-SIDE CONTRACT, stated so a future edit cannot quietly break it:
//   · last_closed is set BEFORE every early return in projectPosition, so it rides
//     the missing-session, junk-session, closed-session AND open-session paths;
//   · it rides both compute() paths, including the zero-reps one — a first-ever
//     session is exactly when the previous close is the only thing there is to say;
//   · null means "no valid history row", never "there is a session open". Those two
//     are different facts and a consumer must be able to tell them apart.
// Each clause is asserted in the selftest under "#29".
//
// FROZEN VERBATIM (layering law, CLAUDE.md) — the 4 Aug 2026 projection, the one that
// carried coverage and dropped every PACING field. Called by NOTHING on the live path;
// the selftest holds it as the regression witness, so if the four fields are ever
// dropped again the diff against this function is the proof.
function projectLastClosedLegacy(row) {
  if (!row || typeof row !== "object" || Array.isArray(row) || typeof row.concept !== "string") return null;
  const arr = (x) => (Array.isArray(x) ? x.slice() : []);
  return {
    concept: row.concept,
    ended_at: typeof row.ended_at === "string" ? row.ended_at : null,
    steps_ran: arr(row.steps_ran), steps_missed: arr(row.steps_missed),
    axes_done: arr(row.axes_done), axes_deferred: arr(row.axes_deferred), axes_untouched: arr(row.axes_untouched),
  };
}

// WIRING AUDIT, 10 Aug 2026 — THE ANTI-FORGERY SIGNAL HAD NO WIRE.
// forge_session.mjs's coverage() stamps four things at every close that nothing but
// its own close report and boot line could ever see: `elapsed_min` and
// `axis_marks_span_min` (THE TWO CLOCKS — forge_session.mjs:383-389, "a twelve-step
// session in 1.4 minutes with every axis marked in the same second is theatre"),
// `check_q_refused` (the quiz-dump counter), and `core_missing` (the CORE axis the
// method forbids deferring). `grep -rn` over scripts/ for all four returned hits in
// forge_session.mjs and NOWHERE else, while all four sat in 8/8 live rows on disk —
// one of them elapsed_min 5.2, which is exactly the shape the two clocks exist to
// catch. This function is the ONLY cross-organ reader of forge_sessions.jsonl, so
// the drop happened here: durable on disk, invisible to the bus.
//
// REPORTED, NEVER THRESHOLDED — carried forward verbatim from the producer's own
// rule. No cutoff is invented here and none may be: there is no calibrated body of
// closed sessions to derive one from, and a guessed "under N minutes is theatre"
// would be the exact over-build this repo keeps undoing. The consumer states the
// numbers; the judgement stays his.
//
// ABSENT IS NOT ZERO. Rows written before these fields existed have no `check_q_refused`
// and no `core_missing`. Defaulting them to 0 / [] would turn "not recorded" into the
// positive claims "no quiz-dump attempts" and "CORE fully closed" — a laundered fact,
// the same direction projectPosition refuses when it downgrades a malformed grade to
// ungraded. Missing ⇒ null, and a consumer must be able to tell the two apart.
function projectLastClosed(row) {
  if (!row || typeof row !== "object" || Array.isArray(row) || typeof row.concept !== "string") return null;
  const arr = (x) => (Array.isArray(x) ? x.slice() : []);
  const num = (x) => (Number.isFinite(x) ? x : null);     // producer writes null on an unparseable started_at
  return {
    concept: row.concept,
    ended_at: typeof row.ended_at === "string" ? row.ended_at : null,
    steps_ran: arr(row.steps_ran), steps_missed: arr(row.steps_missed),
    axes_done: arr(row.axes_done), axes_deferred: arr(row.axes_deferred), axes_untouched: arr(row.axes_untouched),
    // THE TWO CLOCKS — the only two facts in a forge row that cannot be typed by hand.
    elapsed_min: num(row.elapsed_min),
    axis_marks_span_min: num(row.axis_marks_span_min),
    // The quiz-dump counter and the CORE gap: the method's two hard refusals, made
    // legible to every organ that reads the bus instead of only to the close report.
    check_q_refused: Number.isInteger(row.check_q_refused) ? row.check_q_refused : null,
    core_missing: Array.isArray(row.core_missing) ? row.core_missing.slice() : null,
  };
}

// PURE — hand it the parsed session object (or null) and the last history row (or
// null). No disk, so the selftest drives every branch. `now` takes a Date or ms.
function projectPosition(raw, lastRow, now) {
  const nowMs = (now instanceof Date) ? now.getTime() : Number(now);
  const pos = emptyPosition();
  pos.last_closed = projectLastClosed(lastRow);
  // missing · unreadable · not an object · no concept ⇒ there is no position to report
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || typeof raw.concept !== "string" || raw.concept.trim() === "") return pos;
  if (raw.closed_at) return pos;              // a closed session is history, not a position

  const arr = (x) => (Array.isArray(x) ? x : []);
  const axes_done = arr(raw.axes_done).filter((a) => FORGE_AXES.includes(a));
  const axes_deferred = arr(raw.axes_deferred).filter((a) => FORGE_AXES.includes(a));
  // MIRROR THE PACER'S OWN REPAIR rather than inventing a second answer:
  // forge_session's load() clamps a mangled step to 0 before it builds the contract
  // line, so a file holding step:99 makes the pacer say TIME-BOX. Projecting null
  // here would have the Gaffer and the contract contradicting each other about the
  // same file on the same turn, and he would have to adjudicate. One organ, one answer.
  const step = Number.isInteger(raw.step) && raw.step >= 0 && raw.step < FORGE_STEPS.length ? raw.step : 0;
  // STALE mirrors forge_session's STALE_HOURS notion: a session older than that is
  // not being paced any more (its contract goes silent). Unparseable/absent
  // started_at ⇒ stale, the same "repair toward silence" direction the pacer takes.
  const t0 = Date.parse(typeof raw.started_at === "string" ? raw.started_at : "");
  const stale = !Number.isFinite(t0) || !Number.isFinite(nowMs) || ((nowMs - t0) / 3600000) > FORGE_STALE_HOURS;
  // UNGRADED, verbatim from forge_session's coverage(): an axis needs a jirah
  // BEFORE its own mark, and it may not SHARE that jirah with another axis — nine
  // axes marked after one `moment jirah` are nine ungraded claims, not nine grades.
  // Malformed provenance drops to 0, which downgrades the axis to ungraded: the safe
  // direction, because a default that laundered a self-rating into a grade is exactly
  // what the pacer refuses to do.
  const marks = (raw.axes_marked_at && typeof raw.axes_marked_at === "object" && !Array.isArray(raw.axes_marked_at)) ? raw.axes_marked_at : {};
  const jb = (a) => { const m = marks[a]; return (m && typeof m === "object" && !Array.isArray(m) && Number.isInteger(m.jirah_before) && m.jirah_before >= 0) ? m.jirah_before : 0; };
  const axes_ungraded = axes_done.filter((a) => !(jb(a) >= 1 && !axes_done.some((b) => b !== a && jb(b) === jb(a))));

  return {
    ...pos,
    session_open: true,
    concept: raw.concept.trim(),
    step, step_name: FORGE_STEPS[step],
    axes_done, axes_deferred,
    // DERIVED, never stored: the pacer writes only done + deferred, so "left" is
    // whatever the nine axes still owe. Anything else would go stale on the next mark.
    axes_left: FORGE_AXES.filter((a) => !axes_done.includes(a) && !axes_deferred.includes(a)),
    axes_ungraded,
    started_at: typeof raw.started_at === "string" ? raw.started_at : null,
    stale,
    // A FROZEN BOOLEAN OUTLIVES ITS TRUTH (added 1 Aug 2026, from the review of this
    // very block). `stale` is judged at RECOMPUTE time, but this file is rewritten by
    // the 08:45 heartbeat — not per turn. A session that started at 12:25 and was
    // projected fresh at 21:14 crosses STALE_HOURS at 06:25 with nothing rewriting the
    // file, so for hours the bus asserts a LIVE session the OWNING organ has already
    // declared dead: forge_session's contract has gone silent while this still says
    // session_open && !stale. That is not staleness, it is an inversion. Stamping WHEN
    // the judgement was made makes the snapshot self-describing: a consumer that cares
    // about the live answer recomputes from started_at (which is right here) instead of
    // trusting a boolean older than the fact it describes.
    stale_as_of: Number.isFinite(nowMs) ? new Date(nowMs).toISOString() : null,
  };
}

// DISK — both readers are total: a missing, truncated or hand-mangled file is an
// absent position, never an exception. learning_state.mjs runs unattended at 08:45
// and its output feeds hook-reachable organs; a broken pacer file must never be
// able to stop the positional map from being written.
function loadForgeSession(path = FORGE_SESSION) {
  try { if (existsSync(path)) { const j = JSON.parse(readFileSync(path, "utf8")); if (j && typeof j === "object" && !Array.isArray(j)) return j; } } catch { /* unreadable ⇒ no position */ }
  return null;
}
// LAST VALID ROW WINS and a mangled line is skipped — the same rule forge_session's
// own lastHistory() uses. The file is append-only, so the tail is the newest close.
function loadForgeLastClosed(path = FORGE_HISTORY) {
  try {
    if (!existsSync(path)) return null;
    let last = null;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) { const s = line.trim(); if (!s) continue; try { const o = JSON.parse(s); if (o && o.concept) last = o; } catch { /* a mangled line is skipped, never fatal */ } }
    return last;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// per-id fluency + velocity (reps of ONE id, any order)
// ---------------------------------------------------------------------------
function isColdFast(r, cfg) {
  const latOK = (r.latency_ms == null) || (r.latency_ms <= cfg.thresholds.latency_fast_ms);
  const aidedOK = (r.track === "concept") || (r.aided === false);     // aided-gating: skill 🟢 needs aided:false
  return r.correct && r.confidence === "knew" && latOK && aidedOK;
}
function idFluency(reps, cfg) {
  const sorted = reps.slice().sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  const states = [];
  let correctStreak = 0, coldFastStreak = 0;
  for (const r of sorted) {
    if (!r.correct) { correctStreak = 0; coldFastStreak = 0; }
    else { correctStreak++; if (isColdFast(r, cfg)) coldFastStreak++; else coldFastStreak = 0; }
    states.push(coldFastStreak >= cfg.thresholds.fluent_streak ? "fluent" : correctStreak >= cfg.thresholds.held_streak ? "held" : "learning");
  }
  const n = states.length;
  const final = n ? states[n - 1] : "learning";
  // reps_to_state = 1-based index where the final contiguous run began
  let k = n - 1; while (k >= 0 && states[k] === final) k--;
  const reps_to_state = n ? (k + 2) : 0;
  // velocity
  const ranks = states.map((s) => RANK[s]);
  const maxBefore = ranks.slice(0, -1).reduce((m, x) => Math.max(m, x), -1);
  let lastAdvance = -1; for (let i = 1; i < n; i++) if (ranks[i] > ranks[i - 1]) lastAdvance = i;
  const repsSinceAdvance = lastAdvance < 0 ? n : (n - 1 - lastAdvance);
  const finalRank = n ? ranks[n - 1] : 0;
  const regressing = finalRank < maxBefore;
  const stalled = !regressing && finalRank < 2 && repsSinceAdvance >= cfg.thresholds.stall_reps;
  const slope = regressing ? "regressing" : stalled ? "stalling" : (lastAdvance >= 0 && repsSinceAdvance < cfg.thresholds.stall_reps) ? "improving" : "holding";
  // dominant miss/rep axis (concept-track, non-null)
  const axc = {}; for (const r of sorted) if (r.track === "concept" && r.axis) axc[r.axis] = (axc[r.axis] || 0) + 1;
  const domAxis = Object.entries(axc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
  // latest edge
  let edge = null; for (const r of sorted) if (r.edge != null) edge = r.edge;
  // last_seen is LOCAL-day (was isoDate = UTC slice) so it lines up with the envelope
  // `date` — see localDayOf. (E2E audit 25 Jul 2026.)
  //
  // ORGANISM AUDIT #101/#106 (4 Aug 2026): the two TRAILING streaks are returned as
  // well. They were computed here all along and thrown away at the return, which is
  // why "why is nothing fluent yet?" had no answer anywhere on the bus — the ladder
  // could only ever say 🔴, never "1 of the 3 cold-fast reps it needs". Additive.
  return {
    state: final, reps: n, last_seen: n ? localDayOf(sorted[n - 1].ts) : null,
    velocity: { slope, reps_to_state, stalled }, domAxis, edge,
    correct_streak: correctStreak, cold_fast_streak: coldFastStreak,
  };
}

// ---------------------------------------------------------------------------
// THE UNGATE (organism audit #101 + #106, 4 Aug 2026)
// ---------------------------------------------------------------------------
// His verbatim ask: "i can not wait for so many days for gates to be opened."
// NOTHING BELOW LOWERS A GATE. warming_up_min_reps stays 12, held_streak stays 2,
// fluent_streak stays 3 — inventing a maidan focus from nine reps would be the
// lying failure mode this audit exists to hunt. What changes is that the refusal
// stops being a word and becomes an arithmetic he can watch move: `9/12 reps`, with
// the withheld fields NAMED, and with the per-concept streak gates carrying their
// OWN n (the audit's sharpest number — "2 cold-fast reps in six weeks" — was
// nowhere on the bus, so the slowest gate in the organism was also the most invisible).
//
// `status` / `low_confidence` are UNCHANGED: manager.mjs:194 gates on
// `status === "ok" && low_confidence !== true`, and re-spelling that enum would
// break the gate rather than open it. The counter is additive, beside them.
function buildGate(N, th, fluencies) {
  const open = N >= th.warming_up_min_reps;
  const best = (pick) => fluencies.reduce((m, f) => Math.max(m, pick(f) || 0), 0);
  const bestCorrect = best((f) => f.correct_streak);
  const bestColdFast = best((f) => f.cold_fast_streak);
  return {
    have: N, need: th.warming_up_min_reps, unit: "reps",
    line: `${N}/${th.warming_up_min_reps} reps`,
    open,
    // NAMED, not implied. learning_state.mjs suppresses exactly these two under
    // low_confidence and emits axes / core_vs_light / rejirah_due / python_fluency
    // unconditionally — a fact manager.mjs:164's old comment had backwards.
    withheld: open ? [] : ["weak_connection", "maidan_stage_focus"],
    emitted_regardless: ["axes", "core_vs_light", "rejirah_due", "python_fluency", "concepts", "position"],
    sub: [
      { name: "weak_connection", have: N, need: th.warming_up_min_reps, unit: "reps", line: `${N}/${th.warming_up_min_reps} reps`, open },
      { name: "maidan_stage_focus", have: N, need: th.warming_up_min_reps, unit: "reps", line: `${N}/${th.warming_up_min_reps} reps`, open },
      // per-concept ladder gates: the BEST live streak across every entity, so the
      // number answers "how close is anything at all to advancing?"
      { name: "any concept → 🟡 held", have: bestCorrect, need: th.held_streak, unit: "correct in a row", line: `${bestCorrect}/${th.held_streak} correct in a row`, open: bestCorrect >= th.held_streak },
      { name: "any concept → 🟢 fluent", have: bestColdFast, need: th.fluent_streak, unit: "cold-fast in a row", line: `${bestColdFast}/${th.fluent_streak} cold-fast in a row`, open: bestColdFast >= th.fluent_streak },
    ],
  };
}

// ---------------------------------------------------------------------------
// full compute
// ---------------------------------------------------------------------------
// forgeSession / forgeLastRow are TRAILING + OPTIONAL: compute() is exported and a
// pre-existing 5-arg caller must keep working unchanged (layering, never replace).
// It gets the constant empty block, so the field is never missing — only empty.
// The RAW inputs come in and the projection happens HERE, so a caller cannot hand
// the bus a hand-shaped `position` that never passed the rules above.
function compute(reps, fsrsCards, reg, cfg, now, forgeSession = null, forgeLastRow = null) {
  const N = reps.length;
  const date = localDate(now);
  const generated_at = new Date(now).toISOString();
  const nowMs = (now instanceof Date ? now.getTime() : now);
  const th = cfg.thresholds;
  const position = projectPosition(forgeSession, forgeLastRow, nowMs);

  // compute() is EXPORTED, so a caller (selftest, the Manager, a future agent) can hand
  // it a cfg that never passed through loadConfig's sanitizer. E2E audit (25 Jul 2026):
  // a stage without `concepts` used to throw TypeError here and kill the whole recompute.
  // Same shape contract as sanitizeMaidan, applied defensively at the point of use.
  const cfgStages   = (cfg.maidan?.stages   || []).filter((s) => s && typeof s === "object");
  const cfgHandoffs = (cfg.maidan?.handoffs || []).filter((h) => h && typeof h === "object");
  const stageMembers = (s) => (Array.isArray(s.concepts) ? s.concepts : []);

  // Maidan skeleton from config (canon structure — present even when empty)
  const stageSkeleton = () => cfgStages.map((s) => ({ id: s.id, label: s.label, concepts: stageMembers(s).slice(), runnable_frac: 0, status: "awaiting_data" }));

  if (N === 0) {
    return {
      date, generated_at, total_reps: 0, status: "awaiting_data", low_confidence: true,
      maidan_stage_focus: null, weak_connection: null, python_fluency: {}, rejirah_due: [], core_vs_light: {},
      concepts: [], axes: [],
      maidan: { stages: stageSkeleton(), handoffs: cfgHandoffs.map((h) => ({ from: h.from, to: h.to, combined_fluency: EMOJI.learning })) },
      gate: buildGate(0, th, []),        // #101/#106 — "0/12 reps", never a bare word

      // rides the zero-reps path too: a first-ever forge session is EXACTLY when
      // there are no reps yet, and that is the moment the Gaffer most needs to know
      // where he is standing.
      position,
    };
  }

  // group reps by TRACK + canonical id.
  // E2E audit (25 Jul 2026): this used to key on the id ALONE, but concept and skill are
  // separate namespaces (capture.mjs canonicalises per track), so the same id can legally
  // live in both — e.g. concept "embeddings" and a Colab skill "embeddings". When that
  // happened every rep of BOTH tracks fell into one group whose `track` was whichever rep
  // the log happened to hold first, and the entity then surfaced in ONLY that track:
  // python_fluency silently lost the skill (or concepts[] lost the concept), rep counts
  // doubled, and the fluency ladder mixed aided-gated skill reps with concept reps.
  // Keyed by track now (fsrs.mjs already track-filters before grouping); the raw id rides
  // along in the value so every downstream surface still emits the bare id.
  const groupKey = (track, id) => `${track}␟${id}`;
  const byId = new Map();
  for (const r of reps) { const id = canonId(r, reg); const key = groupKey(r.track, id); if (!byId.has(key)) byId.set(key, { id, track: r.track, reps: [] }); byId.get(key).reps.push(r); }
  const fl = new Map();
  for (const g of byId.values()) fl.set(groupKey(g.track, g.id), { id: g.id, track: g.track, core: coreOf(g.id, g.track, reg), ...idFluency(g.reps, cfg) });
  // concept-track lookup by bare id — the Maidan, the axis rollup and the FSRS join all
  // speak concept ids (fsrs.mjs makes cards from concept-track reps only).
  const flConcept = (id) => fl.get(groupKey("concept", id));

  // confusion-pairs (global) + attach per concept
  const pairCount = new Map();
  for (const r of reps) if (r.confused_with != null) { const from = canonId(r, reg); const key = `${from}␟${r.confused_with}`; pairCount.set(key, (pairCount.get(key) || 0) + 1); }
  const confusion_pairs = [...pairCount.entries()].map(([k, count]) => { const [from, to] = k.split("␟"); return { from, to, count }; }).sort((a, b) => b.count - a.count || a.from.localeCompare(b.from));

  // concepts[] (track concept)
  const concepts = [];
  for (const f of fl.values()) if (f.track === "concept") {
    const id = f.id;                                    // bare id (map key is track␟id now)
    concepts.push({
      id, track: "concept", axis: f.domAxis, fluency: LABEL[f.state], core: f.core, reps: f.reps, last_seen: f.last_seen,
      velocity: f.velocity, edge: f.edge,
      confusions: confusion_pairs.filter((p) => p.from === id).map((p) => ({ with: p.to, count: p.count })),
    });
  }
  concepts.sort((a, b) => (RANK[b.fluency.split(" ")[1] === "fluent" ? "fluent" : b.fluency.includes("held") ? "held" : "learning"] - RANK[a.fluency.split(" ")[1] === "fluent" ? "fluent" : a.fluency.includes("held") ? "held" : "learning"]) || a.id.localeCompare(b.id));

  // python_fluency (track skill)
  const python_fluency = {};
  for (const f of fl.values()) if (f.track === "skill") python_fluency[f.id] = LABEL[f.state];

  // per-axis rollup (concept-track)
  const axisConcepts = {};   // axis -> Set of concept ids
  for (const r of reps) if (r.track === "concept" && r.axis) { (axisConcepts[r.axis] ||= new Set()).add(canonId(r, reg)); }
  // rejirah_due (join fsrs due<now + concept dominant axis)
  const rejirah_due = [];
  for (const c of fsrsCards) {
    if (!c || c.due == null) continue;
    const dueMs = Date.parse(c.due); if (Number.isNaN(dueMs) || dueMs >= nowMs) continue;
    const id = c.id || normText(c.concept || "");
    const f = flConcept(id);                            // concept-track join (E2E audit 25 Jul 2026)
    rejirah_due.push({ concept: c.concept ?? id, axis: axisLabel(reg, f?.domAxis || null), overdue_days: Math.floor((nowMs - dueMs) / 86400000) });
  }
  rejirah_due.sort((a, b) => b.overdue_days - a.overdue_days);
  const dueCountByAxis = {}; for (const c of fsrsCards) { if (!c || c.due == null) continue; const dueMs = Date.parse(c.due); if (Number.isNaN(dueMs) || dueMs >= nowMs) continue; const f = flConcept(c.id || normText(c.concept || "")); if (f?.domAxis) dueCountByAxis[f.domAxis] = (dueCountByAxis[f.domAxis] || 0) + 1; }

  const axes = [];
  for (const ax of Object.keys(axisConcepts).sort()) {
    const ids = [...axisConcepts[ax]];
    const counts = { learning: 0, held: 0, fluent: 0 };
    for (const id of ids) counts[flConcept(id)?.state || "learning"]++;
    const total = ids.length;
    axes.push({ axis: ax, label: reg.axes[ax] || null, fluent_frac: total ? round(counts.fluent / total) : 0, counts, due_count: dueCountByAxis[ax] || 0 });
  }

  // edge-map
  const edge_map = {};
  for (const f of fl.values()) if (f.track === "concept" && f.edge != null) edge_map[f.id] = f.edge;

  // Maidan stages + handoffs (stage members + handoff endpoints are concept ids)
  const stateEmojiOf = (id) => EMOJI[flConcept(id)?.state || "learning"];
  const rankOf = (id) => RANK[flConcept(id)?.state || "learning"];
  const stages = cfgStages.map((s) => {
    const members = stageMembers(s);                    // was s.concepts — crashed if absent (E2E audit 25 Jul 2026)
    const withReps = members.filter((id) => flConcept(id) != null);
    const fluent = members.filter((id) => flConcept(id)?.state === "fluent").length;
    const runnable_frac = members.length ? round(fluent / members.length) : 0;
    const status = runnable_frac >= th.stage_runnable_frac ? "runnable" : (withReps.length ? "building" : "awaiting_data");
    return { id: s.id, label: s.label, concepts: members.slice(), runnable_frac, status };
  });
  const handoffs = cfgHandoffs.map((h) => ({ from: h.from, to: h.to, label: h.label, combined_fluency: EMOJI[Object.keys(RANK).find((k) => RANK[k] === Math.min(rankOf(h.from), rankOf(h.to)))] }));
  // weak_connection = lowest combined; prefer both-core spine
  let weakHandoff = null;
  for (const h of cfgHandoffs) {
    const combined = Math.min(rankOf(h.from), rankOf(h.to));
    const bothCore = coreOf(h.from, "concept", reg) && coreOf(h.to, "concept", reg);
    const cand = { h, combined, bothCore };
    if (!weakHandoff || combined < weakHandoff.combined || (combined === weakHandoff.combined && bothCore && !weakHandoff.bothCore)) weakHandoff = cand;
  }
  let weak_connection = weakHandoff ? `${weakHandoff.h.from} → ${weakHandoff.h.to} (${weakHandoff.h.label})` : null;
  let maidan_stage_focus = weakHandoff ? `${weakHandoff.h.from} → ${weakHandoff.h.to} handoff` : null;

  // core_vs_light (concepts with reps)
  const conceptFl = [...fl.values()].filter((f) => f.track === "concept");
  const coreIds = conceptFl.filter((f) => f.core);
  const lightIds = conceptFl.filter((f) => !f.core);
  const fluentFrac = (arr) => `${arr.filter((f) => f.state === "fluent").length}/${arr.length} fluent`;
  const core_vs_light = {
    core: coreIds.length ? `spine: ${fluentFrac(coreIds)}` : "spine: no reps yet",
    light: lightIds.length ? fluentFrac(lightIds) : "no light concepts drilled",
  };

  // envelope health + bias-to-silence
  const status = N < th.warming_up_min_reps ? "warming_up" : "ok";
  const low_confidence = status !== "ok";
  if (low_confidence) { weak_connection = null; maidan_stage_focus = null; }   // suppress headline until enough data

  return {
    date, generated_at, total_reps: N, status, low_confidence,
    gate: buildGate(N, th, [...fl.values()]),      // #101/#106 — the have/need counter
    maidan_stage_focus, weak_connection, python_fluency, rejirah_due, core_vs_light,
    edge_map, confusion_pairs,
    concepts, axes,
    maidan: { stages, handoffs },
    // #29 — UNCONDITIONAL on every path, open session or not. See projectLastClosed.
    position,
  };
}

// ---------------------------------------------------------------------------
// selftest
// ---------------------------------------------------------------------------
function selftest() {
  const cfg = loadConfig("__no_cfg__");            // ⇒ DEFAULTS
  const reg = loadRegistry("__no_reg__");          // start with NO registry (graceful path)
  // a loaded registry for axis/core tests
  const REG = { conceptAlias: new Map(), skillAlias: new Map(), axes: { e: "limits/failure-modes", f: "tradeoffs" }, conceptMeta: { chunking: { core: true }, embeddings: { core: true }, retrieval: { core: true }, rag_eval: { core: true }, tokenization: { core: true } }, skillMeta: { pydantic: { core: true } }, loaded: true };
  const now = new Date(2026, 7, 1, 12, 0, 0);
  const nowMs = now.getTime();
  const checks = [];
  const assert = (n, c) => { checks.push([n, !!c]); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  let T = 0;
  const ts = (d = 0) => new Date(Date.parse("2026-07-01T00:00:00Z") + d * 86400000 + (T++) * 60000).toISOString();
  const rp = (o) => ({ ts: ts(o.day), surface: o.track === "skill" ? "colab" : "gem", track: o.track || "concept", concept: o.concept, axis: ("axis" in o) ? o.axis : (o.track === "skill" ? null : "f"), question: `q${T}`, confidence: o.confidence || "knew", correct: o.correct !== false, latency_ms: ("lat" in o) ? o.lat : null, aided: ("aided" in o) ? o.aided : (o.track === "skill" ? false : null), confused_with: o.confused_with ?? null, edge: o.edge ?? null });
  const cf = (concept, over = {}) => rp({ concept, confidence: "knew", correct: true, lat: 100, ...over });        // cold-fast
  const findC = (o, id) => o.concepts.find((c) => c.id === id);

  // 1) empty-safe
  const e0 = compute([], [], REG, cfg, now);
  assert("empty-safe: awaiting_data, lists empty, maidan skeleton present", e0.status === "awaiting_data" && e0.concepts.length === 0 && e0.rejirah_due.length === 0 && e0.maidan.stages.length === 3 && e0.maidan.stages[0].status === "awaiting_data");

  // 2) fluency ladder: 3 cold-fast ⇒ 🟢
  assert("fluency ladder: cold-fast streak ⇒ 🟢 fluent", findC(compute([cf("chunking"), cf("chunking"), cf("chunking")], [], REG, cfg, now), "chunking")?.fluency === "🟢 fluent");
  // 3) held≠fluent: correct-but-SLOW stays 🟡
  assert("held≠fluent: correct-but-slow ⇒ 🟡 held", findC(compute([rp({ concept: "chunking", lat: 20000 }), rp({ concept: "chunking", lat: 20000 }), rp({ concept: "chunking", lat: 20000 })], [], REG, cfg, now), "chunking")?.fluency === "🟡 held");
  // 4) regression: a miss drops the state
  assert("regression: miss after fluent drops state", findC(compute([cf("chunking"), cf("chunking"), cf("chunking"), rp({ concept: "chunking", correct: false, confidence: "shaky" })], [], REG, cfg, now), "chunking")?.fluency === "🔴 learning");
  // 5) aided-gating: skill fluent requires aided:false
  const skAided = compute([cf("pydantic", { track: "skill", aided: true }), cf("pydantic", { track: "skill", aided: true }), cf("pydantic", { track: "skill", aided: true })], [], REG, cfg, now);
  assert("aided-gating: aided:true streak ⇒ NOT 🟢 (skill)", skAided.python_fluency.pydantic !== "🟢 fluent");
  assert("aided-gating: aided:false streak ⇒ 🟢 (skill)", compute([cf("pydantic", { track: "skill", aided: false }), cf("pydantic", { track: "skill", aided: false }), cf("pydantic", { track: "skill", aided: false })], [], REG, cfg, now).python_fluency.pydantic === "🟢 fluent");
  // 6) latency-absent path: knew+correct ⇒ 🟢 via proxy
  assert("latency-absent: knew+correct streak ⇒ 🟢", findC(compute([rp({ concept: "chunking" }), rp({ concept: "chunking" }), rp({ concept: "chunking" })], [], REG, cfg, now), "chunking")?.fluency === "🟢 fluent");
  // 7) velocity: improving vs stalling
  const impr = findC(compute([rp({ concept: "chunking", correct: false }), cf("chunking"), cf("chunking")], [], REG, cfg, now), "chunking");
  assert("velocity: improving detected", impr?.velocity.slope === "improving");
  const stall = findC(compute(Array.from({ length: 7 }, () => rp({ concept: "chunking", correct: false, confidence: "guessed" })), [], REG, cfg, now), "chunking");
  assert("velocity: stalling detected (no advance in stall_reps)", stall?.velocity.slope === "stalling" && stall.velocity.stalled === true);
  // 8) per-axis rollup counts + fluent_frac
  const axmock = compute([...[cf("chunking"), cf("chunking"), cf("chunking")], rp({ concept: "retrieval", axis: "f", correct: true }), rp({ concept: "retrieval", axis: "f", correct: false })], [], REG, cfg, now);
  const axf = axmock.axes.find((a) => a.axis === "f");
  assert("per-axis rollup: counts + fluent_frac", axf && axf.counts.fluent === 1 && axf.counts.learning === 1 && Math.abs(axf.fluent_frac - 0.5) < 1e-9);
  // 9) rejirah_due: overdue + axis join; fsrs_store missing ⇒ []
  const cards = [{ id: "retrieval", concept: "retrieval", due: "2026-07-30T00:00:00Z" }];   // 2 days before now
  const rj = compute([rp({ concept: "retrieval", axis: "e", correct: true }), rp({ concept: "retrieval", axis: "e", correct: false })], cards, REG, cfg, now).rejirah_due;
  assert("rejirah_due: overdue_days + axis label from join", rj.length === 1 && rj[0].overdue_days === 2 && rj[0].axis === "e (limits/failure-modes)");
  assert("rejirah_due: fsrs_store missing ⇒ []", compute([cf("chunking")], [], REG, cfg, now).rejirah_due.length === 0);
  // 10) edge-map: latest edge per concept wins
  const em = compute([rp({ concept: "chunking", edge: "old edge" }), rp({ concept: "chunking", edge: "newest edge" })], [], REG, cfg, now);
  assert("edge-map: latest edge wins", em.edge_map.chunking === "newest edge");
  // 11) confusion-pairs: counts + rank
  const cp = compute([rp({ concept: "chunking", correct: false, confused_with: "tokenization" }), rp({ concept: "chunking", correct: false, confused_with: "tokenization" }), rp({ concept: "retrieval", correct: false, confused_with: "embeddings" })], [], REG, cfg, now);
  assert("confusion-pairs: counted + ranked", cp.confusion_pairs[0].from === "chunking" && cp.confusion_pairs[0].to === "tokenization" && cp.confusion_pairs[0].count === 2);
  assert("confusion-pairs attached to concept entry", findC(cp, "chunking").confusions[0]?.with === "tokenization");
  // 12) Maidan: runnable_frac + weak_connection derivation (need ok: ≥warming_up_min_reps)
  const big = [];
  for (const c of ["chunking", "embeddings", "retrieval", "rag_eval"]) { big.push(cf(c), cf(c), cf(c)); }   // all 4 fluent, 12 reps
  const mv = compute(big, [], REG, cfg, now);
  assert("Maidan: full stage ⇒ runnable", mv.maidan.stages.find((s) => s.id === "rag_pipeline").status === "runnable" && mv.maidan.stages.find((s) => s.id === "rag_pipeline").runnable_frac === 1);
  assert("Maidan: weak_connection surfaces at ok volume", typeof mv.weak_connection === "string" && typeof mv.maidan_stage_focus === "string");
  // 13) warming_up suppresses headline
  const wu = compute([cf("chunking"), cf("chunking"), cf("chunking")], [], REG, cfg, now);
  assert("warming_up: <min_reps ⇒ low_confidence + weak_connection null (suppressed)", wu.status === "warming_up" && wu.low_confidence === true && wu.weak_connection === null);
  // 14) Manager surface fields present + §10 shape
  assert("Manager surface fields present", ["maidan_stage_focus", "weak_connection", "python_fluency", "rejirah_due", "core_vs_light"].every((k) => k in mv) && typeof mv.core_vs_light.core === "string");
  // 15) concepts.json / config missing ⇒ graceful (raw ids, no crash, no axis label)
  const g = compute([cf("brandnew"), cf("brandnew"), cf("brandnew")], [{ id: "brandnew", concept: "brandnew", due: "2026-07-30T00:00:00Z" }], EMPTY_REG, cfg, now);
  assert("registry missing ⇒ graceful (raw id, bare axis letter, no crash)", findC(g, "brandnew")?.fluency === "🟢 fluent" && g.rejirah_due[0]?.axis === "f");

  // 16) last_seen rides the LOCAL day — regression for the E2E audit (25 Jul 2026) find that
  //     it was a UTC slice: a 00:30 IST rep stamped the PREVIOUS day while the envelope
  //     `date` said today, so "drilled today?" consumers saw a fresh concept as untouched.
  //     Both ends of the day are checked so the assertion bites east AND west of UTC.
  const localRep = (y, mo, d, h, mi) => ({ ts: new Date(y, mo, d, h, mi, 0).toISOString(), surface: "gem", track: "concept", concept: "chunking", axis: "f", question: "tz", confidence: "knew", correct: true, latency_ms: 100, aided: null, confused_with: null, edge: null });
  const tzNoon  = new Date(2026, 6, 22, 12, 0, 0);
  const tzEarly = compute([localRep(2026, 6, 22, 0, 30)], [], REG, cfg, tzNoon);
  const tzLate  = compute([localRep(2026, 6, 22, 23, 30)], [], REG, cfg, tzNoon);
  assert("last_seen = LOCAL day of the rep (agrees with envelope date at both ends of the day)",
    tzEarly.date === "2026-07-22" && findC(tzEarly, "chunking")?.last_seen === "2026-07-22" && findC(tzLate, "chunking")?.last_seen === "2026-07-22");

  // 17) malformed Maidan config must DEGRADE, never throw (E2E audit 25 Jul 2026): a stage
  //     that lost its `concepts:` line used to pass loadConfig's array-only gate and then
  //     TypeError inside compute, so the 08:45 recompute died and the state file went stale.
  const badMaidan = { stages: [{ id: "agents", label: "Agents" }, { id: "rag", concepts: ["chunking", 7] }, null, { label: "no id" }], handoffs: [{ from: "chunking", to: "embeddings" }, "junk"] };
  const sm = sanitizeMaidan(JSON.parse(JSON.stringify(badMaidan)), DEFAULTS.maidan);
  assert("config sanitizer: concepts-less stage kept as empty, id-less/null stages + junk handoffs dropped",
    sm.stages.length === 2 && sm.stages[0].concepts.length === 0 && sm.stages[1].concepts.length === 1 && sm.handoffs.length === 1 && typeof sm.handoffs[0].label === "string");
  let badThrew = false, badEmpty = null, badOut = null;
  try { const badCfg = { thresholds: cfg.thresholds, maidan: badMaidan }; badEmpty = compute([], [], REG, badCfg, now); badOut = compute([cf("chunking")], [], REG, badCfg, now); } catch { badThrew = true; }
  assert("malformed stage ⇒ empty stage + awaiting_data, recompute never throws (empty AND populated paths)",
    !badThrew && badEmpty?.maidan.stages[0].concepts.length === 0 && badOut?.maidan.stages.find((s) => s.id === "agents")?.status === "awaiting_data" && badOut?.maidan.stages.find((s) => s.id === "rag")?.status === "building");

  // 18) concept + skill sharing one id are SEPARATE entities (E2E audit 25 Jul 2026): grouping
  //     keyed on the bare id merged both namespaces into whichever track appeared first, so
  //     python_fluency silently lost the skill and the concept's rep count doubled.
  const col = compute([cf("embeddings"), cf("embeddings"), cf("embeddings"),
    cf("embeddings", { track: "skill", aided: false }), cf("embeddings", { track: "skill", aided: false }), cf("embeddings", { track: "skill", aided: false })], [], REG, cfg, now);
  assert("track namespaces: concept + skill sharing an id do not merge",
    col.python_fluency.embeddings === "🟢 fluent" && findC(col, "embeddings")?.reps === 3 && findC(col, "embeddings")?.track === "concept");

  // 19) FORGE POSITION (1 Aug 2026) — forge_session.json's only reader was the script
  //     that writes it, so the Gaffer could not name the concept or the step the
  //     captain was standing on. Everything below is driven with plain objects: the
  //     projection is pure, so no disk and no live bus file is touched.
  //     The concepts here are DELIBERATELY nonsense — a projection that ever needed a
  //     real concept name to work would be a hardcode, and these asserts would catch it.
  const T0 = Date.parse("2026-08-01T09:00:00Z");
  const openSess = {
    concept: "zzq_widget_theory", started_at: "2026-08-01T08:00:00Z", updated_at: "2026-08-01T08:30:00Z",
    step: 3, steps_done: [0, 1, 2, 3], axes_done: ["a", "b"], axes_deferred: ["g"],
    // a and b each sit behind their OWN jirah (1 then 2) — that is what makes them graded
    axes_marked_at: { a: { at: "2026-08-01T08:20:00Z", step: 3, jirah_before: 1 }, b: { at: "2026-08-01T08:25:00Z", step: 3, jirah_before: 2 } },
    question_moments: { pehle_guess: 2, widget_gate: 0, check_q: 1, jirah: 2 },
  };
  const histRow = { concept: "qqx_prior_concept", ended_at: "2026-07-31T12:25:21.402Z", ended_by: "close",
    steps_ran: [0, 1, 2, 3, 4, 5], steps_missed: [6, 7, 8, 9, 10, 11],
    axes_done: ["a", "b", "c"], axes_deferred: [], axes_untouched: ["d", "e", "f", "g", "h", "i"] };

  const pOpen = projectPosition(openSess, null, T0);
  assert("position: an OPEN session projects concept + step + step_name + axes + started_at",
    pOpen.session_open === true && pOpen.concept === "zzq_widget_theory" && pOpen.step === 3
    && pOpen.step_name === "SAMJHAO" && pOpen.axes_done.join("") === "ab" && pOpen.axes_deferred.join("") === "g"
    && pOpen.started_at === "2026-08-01T08:00:00Z" && pOpen.stale === false && pOpen.last_closed === null);

  // A frozen `stale` can outlive its truth, so the judgement carries its own clock:
  // stale_as_of is stamped on EVERY path (empty block included) so a consumer can see
  // how old the verdict is and recompute from started_at instead of trusting it.
  assert("position: `stale` is stamped with WHEN it was judged, on both paths",
    pOpen.stale_as_of === new Date(T0).toISOString()
    && Object.prototype.hasOwnProperty.call(projectPosition(null, null, T0), "stale_as_of")
    && projectPosition(null, null, T0).stale_as_of === null);

  // axes_left must be DERIVED — same session, two different done/deferred splits, and
  // a third with nothing marked. A hardcoded list cannot satisfy all three.
  const leftOf = (done, deferred) => projectPosition({ ...openSess, axes_done: done, axes_deferred: deferred, axes_marked_at: {} }, null, T0).axes_left.join("");
  assert("position: axes_left is DERIVED from a..i minus done minus deferred, never stored",
    pOpen.axes_left.join("") === "cdefhi" && leftOf(["i"], []) === "abcdefgh"
    && leftOf([], ["a", "b", "c", "d", "e", "f", "g", "h", "i"]) === "" && leftOf([], []) === "abcdefghi");

  assert("position: MISSING/unreadable/junk forge_session ⇒ session_open false, empty lists, no throw",
    [null, undefined, "not an object", [1, 2], {}, { concept: "   " }].every((bad) => {
      const p = projectPosition(bad, null, T0);
      return p.session_open === false && p.concept === null && p.step === null && p.step_name === null
        && p.axes_done.length === 0 && p.axes_left.length === 0 && p.stale === false && p.last_closed === null;
    }));

  const pClosed = projectPosition({ ...openSess, closed_at: "2026-08-01T08:45:00Z" }, histRow, T0);
  assert("position: a CLOSED session is not a position, but last_closed still rides the bus",
    pClosed.session_open === false && pClosed.concept === null
    && pClosed.last_closed?.concept === "qqx_prior_concept" && pClosed.last_closed.ended_at === histRow.ended_at
    && pClosed.last_closed.steps_ran.length === 6 && pClosed.last_closed.axes_untouched.join("") === "defghi");

  // ungraded mirrors forge_session's coverage(): a jirah is per-axis and cannot be
  // shared — two axes marked behind the SAME jirah are two claims, not two grades.
  const ungradedWith = (marks) => projectPosition({ ...openSess, axes_marked_at: marks }, null, T0).axes_ungraded.join("");
  assert("position: axes_ungraded mirrors the pacer — own jirah grades, a SHARED jirah does not, junk/absent provenance ⇒ ungraded",
    pOpen.axes_ungraded.length === 0
    && ungradedWith({ a: { at: "x", step: 3, jirah_before: 1 }, b: { at: "x", step: 3, jirah_before: 1 } }) === "ab"
    && ungradedWith({ a: { at: "x", step: 3, jirah_before: 0 }, b: { at: "x", step: 3, jirah_before: 2 } }) === "a"
    && ungradedWith({}) === "ab"
    && ungradedWith({ a: { jirah_before: "many" }, b: null }) === "ab");

  assert("position: STALE mirrors the pacer's 18h notion (18h fresh · 19h stale · no started_at ⇒ stale)",
    projectPosition({ ...openSess, started_at: new Date(T0 - 17 * 3600000).toISOString() }, null, T0).stale === false
    && projectPosition({ ...openSess, started_at: new Date(T0 - 19 * 3600000).toISOString() }, null, T0).stale === true
    && projectPosition({ ...openSess, started_at: undefined }, null, T0).stale === true
    && projectPosition({ ...openSess, started_at: undefined }, null, T0).session_open === true);

  assert("position: a mangled step is repaired to the pacer's own answer (0 TIME-BOX), never left undefined",
    projectPosition({ ...openSess, step: 99 }, null, T0).step_name === "TIME-BOX"
    && projectPosition({ ...openSess, step: "3" }, null, T0).step === 0
    && projectPosition({ ...openSess, axes_done: ["a", "zz", 7], axes_deferred: null }, null, T0).axes_done.join("") === "a");

  // and it must actually reach the OUTPUT — on both compute() paths, including zero reps.
  const posEmpty = compute([], [], REG, cfg, now, openSess, histRow);
  const posFull  = compute([cf("chunking")], [], REG, cfg, now, openSess, histRow);
  assert("position rides learning_state.json on BOTH compute paths (0 reps and populated)",
    posEmpty.position.session_open === true && posEmpty.position.step_name === "SAMJHAO"
    && posFull.position.concept === "zzq_widget_theory" && posFull.position.last_closed?.concept === "qqx_prior_concept");
  assert("BACKWARD-COMPAT — a 5-arg compute() caller still works and gets the constant EMPTY block, never a missing field",
    "position" in compute([cf("chunking")], [], REG, cfg, now)
    && compute([cf("chunking")], [], REG, cfg, now).position.session_open === false
    && compute([], [], REG, cfg, now).position.last_closed === null);
  assert("EMPTY-SAFE ON DISK — both forge readers return null for a missing path and never throw",
    loadForgeSession("__no_such_forge_session__") === null && loadForgeLastClosed("__no_such_forge_history__") === null);

  // --- ORGANISM AUDIT #101 / #106 (4 Aug 2026): THE UNGATE -------------------
  {
    const nine = [];   // the captain's live n today: 9 concept reps, nothing fluent
    for (const c of ["hallucinations", "embeddings", "chunking"]) for (let i = 0; i < 3; i++) nine.push(rp({ concept: c, confidence: "guessed", correct: false }));
    const u9 = compute(nine, [], REG, cfg, now);
    assert("#101 nine reps say '9/12 reps' with the denominator, beside (not instead of) the machine status",
      u9.gate.line === "9/12 reps" && u9.gate.have === 9 && u9.gate.need === 12 && u9.gate.open === false
      && u9.status === "warming_up" && u9.low_confidence === true);
    assert("#101 the silence NAMES the two fields it withholds — and names what it emits anyway",
      u9.gate.withheld.join(",") === "weak_connection,maidan_stage_focus"
      && u9.weak_connection === null && u9.maidan_stage_focus === null
      && u9.gate.emitted_regardless.includes("axes"));
    // the manager's old comment claimed the axis rollups were suppressed under
    // warming_up. They never were, and the counter must not repeat the lie.
    assert("#101 axes / core_vs_light / rejirah_due really ARE emitted under warming_up (the suppression is only the two headlines)",
      Array.isArray(u9.axes) && u9.axes.length > 0 && typeof u9.core_vs_light.core === "string" && Array.isArray(u9.rejirah_due));
    assert("#101 an empty ledger reads 0/12 (never a silently-confident zero)",
      compute([], [], REG, cfg, now).gate.line === "0/12 reps" && compute([], [], REG, cfg, now).gate.open === false);
    assert("#101 NO GATE WAS LOWERED — 11 reps still withholds the headline, it just says 11/12",
      (() => { const e = compute(nine.concat([rp({ concept: "chunking" }), rp({ concept: "chunking" })]), [], REG, cfg, now); return e.gate.line === "11/12 reps" && e.gate.open === false && e.weak_connection === null; })());
    assert("#101 the gate opens from live data and the headline appears (12 reps, unchanged threshold)",
      mv.gate.open === true && mv.gate.line === "12/12 reps" && typeof mv.weak_connection === "string" && mv.gate.withheld.length === 0);

    // THE SLOWEST GATE IN THE ORGANISM, finally visible: the audit's own number was
    // "2 cold-fast reps in six weeks" and no surface carried it.
    const twoColdFast = compute([cf("chunking"), cf("chunking")], [], REG, cfg, now);
    const cfGate = twoColdFast.gate.sub.find((s) => s.name === "any concept → 🟢 fluent");
    const heldGate = twoColdFast.gate.sub.find((s) => s.name === "any concept → 🟡 held");
    assert("#101 the per-concept ladder gates carry their OWN n — '2/3 cold-fast in a row', not silence",
      cfGate.have === 2 && cfGate.need === 3 && cfGate.open === false && cfGate.line === "2/3 cold-fast in a row"
      && heldGate.have === 2 && heldGate.open === true);
    assert("#101 a miss resets the streak counter, so the number is live and not a high-water mark",
      compute([cf("chunking"), cf("chunking"), rp({ concept: "chunking", correct: false, confidence: "guessed" })], [], REG, cfg, now)
        .gate.sub.find((s) => s.name === "any concept → 🟢 fluent").have === 0);

    // the counter reads the CONFIG, never a literal — a captain who edits the
    // threshold must see his own number or the counter is decoration
    const cfg20 = { thresholds: { ...cfg.thresholds, warming_up_min_reps: 20 }, maidan: cfg.maidan };
    assert("#101 the counter reads the live config (warming_up_min_reps 20 ⇒ 9/20)",
      compute(nine, [], REG, cfg20, now).gate.line === "9/20 reps");
  }

  // --- ORGANISM AUDIT #29 (4 Aug 2026): last_closed rides EVERY path ---------
  // Confirmed correct by the audit and about to acquire its first consumer
  // (brain.mjs buildFingerprint). These assertions are the producer-side contract:
  // a future edit that drops it on any branch fails here, loudly.
  {
    const T29 = Date.parse("2026-08-01T09:00:00Z");
    const row = { concept: "qqx_prior_concept", ended_at: "2026-07-31T12:25:21.402Z", steps_ran: [0, 1, 2], steps_missed: [3], axes_done: ["a"], axes_deferred: [], axes_untouched: ["b"] };
    const open29 = { concept: "zzq_live", started_at: "2026-08-01T08:00:00Z", step: 2, axes_done: [], axes_deferred: [] };
    const paths = {
      open: projectPosition(open29, row, T29),
      closed: projectPosition({ ...open29, closed_at: "2026-08-01T08:45:00Z" }, row, T29),
      missing: projectPosition(null, row, T29),
      junk: projectPosition("not an object", row, T29),
      stale: projectPosition({ ...open29, started_at: "2026-07-01T00:00:00Z" }, row, T29),
    };
    assert("#29 last_closed rides EVERY projection branch — open, closed, missing, junk and stale",
      Object.values(paths).every((p) => p.last_closed && p.last_closed.concept === "qqx_prior_concept" && p.last_closed.ended_at === row.ended_at));
    assert("#29 ...including the branch that matters most: a session OPEN and a prior close, both true at once",
      paths.open.session_open === true && paths.open.concept === "zzq_live" && paths.open.last_closed.steps_ran.length === 3);
    assert("#29 null last_closed means 'no valid history row', NEVER 'a session is open' (two different facts)",
      projectPosition(open29, null, T29).last_closed === null
      && projectPosition(null, { nonsense: true }, T29).last_closed === null
      && projectPosition(null, null, T29).last_closed === null);
    assert("#29 it reaches learning_state.json on BOTH compute paths, zero reps included",
      compute([], [], REG, cfg, now, open29, row).position.last_closed?.concept === "qqx_prior_concept"
      && compute([cf("chunking")], [], REG, cfg, now, open29, row).position.last_closed?.concept === "qqx_prior_concept");

    // --- WIRING AUDIT (10 Aug 2026): THE TWO CLOCKS CROSS THE BUS ------------
    // These four were written to every forge_sessions.jsonl row and read by no organ
    // in the repo. This is the wire; break it and this fails.
    const paced = { ...row, elapsed_min: 5.2, axis_marks_span_min: 0, check_q_refused: 2, core_missing: ["d"] };
    const lcPaced = projectLastClosed(paced);
    assert("WIRE · the two clocks, the quiz-dump counter and the CORE gap all reach position.last_closed",
      lcPaced.elapsed_min === 5.2 && lcPaced.axis_marks_span_min === 0
      && lcPaced.check_q_refused === 2 && lcPaced.core_missing.join("") === "d");
    assert("WIRE · and they survive the whole compute path onto learning_state.json",
      (() => { const p = compute([], [], REG, cfg, now, open29, paced).position.last_closed;
        return p.elapsed_min === 5.2 && p.axis_marks_span_min === 0 && p.check_q_refused === 2 && p.core_missing.join("") === "d"; })());
    assert("WIRE · REPORTED, NEVER THRESHOLDED — a 5.2-minute twelve-step close is passed through, not judged",
      !Object.prototype.hasOwnProperty.call(lcPaced, "theatre") && !Object.prototype.hasOwnProperty.call(lcPaced, "method_clean_verdict")
      && projectLastClosed({ ...paced, elapsed_min: 900 }).elapsed_min === 900);
    assert("WIRE · ABSENT IS NOT ZERO — a pre-field row reports null, never 'no refusals' / 'CORE closed'",
      projectLastClosed(row).check_q_refused === null && projectLastClosed(row).core_missing === null
      && projectLastClosed(row).elapsed_min === null && projectLastClosed(row).axis_marks_span_min === null);
    assert("WIRE · a real 0 is preserved as 0 and never collapsed into the absent case",
      projectLastClosed({ ...row, check_q_refused: 0, core_missing: [] }).check_q_refused === 0
      && projectLastClosed({ ...row, check_q_refused: 0, core_missing: [] }).core_missing.length === 0);
    assert("WIRE · the FROZEN pre-repair projection is the witness: it still drops all four",
      projectLastClosedLegacy(paced).elapsed_min === undefined && projectLastClosedLegacy(paced).check_q_refused === undefined
      && projectLastClosedLegacy(paced).core_missing === undefined && projectLastClosedLegacy(paced).concept === "qqx_prior_concept");
  }

  const passed = checks.every(([, c]) => c);
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
  const cards = loadFsrsCards();
  const out = compute(reps, cards, reg, cfg, new Date(), loadForgeSession(), loadForgeLastClosed());
  writeAtomic(OUT, out);
  // the position clause is APPENDED, never replacing the existing line — the 08:45
  // log is how an operator sees whether the pacer was actually picked up this run.
  const p = out.position;
  const posBit = p.session_open
    ? ` · position ${p.concept} step ${p.step} ${p.step_name}${p.stale ? " (stale)" : ""}`
    : (p.last_closed ? ` · position none (last ${p.last_closed.concept})` : " · position none");
  // #106 — lead with the counter. `${have}/${need} reps` beats `warming_up` because
  // it tells him how many more, and the withheld list tells him what he is buying.
  const gateBit = out.gate.open ? out.gate.line : `${out.gate.line} (withholding ${out.gate.withheld.join(", ")})`;
  console.log(`learning-state: ${gateBit} — concepts ${out.concepts.length} · skills ${Object.keys(out.python_fluency).length} · due ${out.rejirah_due.length} · focus ${out.maidan_stage_focus || "-"}${posBit}  →  ${OUT}`);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { compute, idFluency, isColdFast, buildGate, loadReps, loadConfig, loadRegistry, loadFsrsCards, projectPosition, projectLastClosed, projectLastClosedLegacy, loadForgeSession, loadForgeLastClosed };
