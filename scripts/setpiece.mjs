#!/usr/bin/env node
// ============================================================================
// setpiece.mjs · ARSENAL AI FC — THE ORGANISM: THE SET-PIECE COACH
// ----------------------------------------------------------------------------
// WHAT:  The motor cortex (THE_ORGANISM §II 08:41, §VIII). Compiles TOMORROW's
//        ≤3 drills from YESTERDAY's exact failures — the captain's own words
//        passed back in the enemy's grammar (dossier_weights.json probe
//        templates): knew-but-wrong → 🟡 RECONSTRUCT probe · hot confusion
//        pair → DERBY fixture · archived doubt → TAPE-ROOM rematch ("Week-N
//        Nikhil argued X. Dismantle him.") · deferral streak → door-change
//        drill (Pehle-Guess mode — guessing is safe by design; the fear is
//        never named).
// WHY:   Without an actuator, every sensor is a diary. This is where reps
//        stop being wasted.
// CONSTITUTIONAL (each selftested):
//   · FIRST BALL WINNABLE — drills[0] is a 🟢-fluent or healed (trophy)
//     concept whenever one exists. No session in this body opens with his
//     failures.
//   · ≤3 DRILLS, ALWAYS. The autonomic ladder dampens further: AMBER →
//     recall-weight only, max 2; RED → exactly ONE five-minute floor-touch
//     and the nemesis-sourced content is WITHHELD (recorded for post-match
//     disclosure — mercy, disclosed later, never hidden).
//   · Prompts are COMPLETE deterministically (brain enrichment is optional
//     icing, never load-bearing). No dates/deadlines in any prompt string.
//
// INPUT (read-only): weaknesses.json · calibration.json · learning_state.json ·
//   cards.json · pitch_read.json · tape_room.json · readiness.json (verdict) ·
//   ladder_config.json · dossier_weights.json · setpiece_config.json (canon) ·
//   sprint.json (audit #87 — the curriculum this packet must not drift off) ·
//   concept_graph.json (audit #72 — cortex's nightly map; this is its ONLY reader) ·
//   capsule_map.json (audit #33 — where FSRS and FORGE's Re-Jirah agree/disagree; and
//     since the 10 Aug 2026 dead-wire sweep its `strike_bank` too — this file is that
//     bank's FIRST reader, see strikeFor())
//   dugout_scrimmage.jsonl (dead-wire sweep 11 Aug 2026 — the graded oral mock's
//     `kind:"report"` rows; setpiece is that row's FIRST and only consumer, and
//     the reason the scrimmage's "drill for tomorrow" now reaches a sheet at all.
//     Written by dugout.mjs, its single writer; shadow.mjs reads the same lane
//     for a different fact. See the GRADED MOCK block in candidates())
// OUTPUT: dressing-room/state/drills.json (sole writer)
// MODES:  run (default: compile for tomorrow) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// DEAD-WIRE SWEEP (11 Aug 2026) — cortex.mjs ends with these two symbols exported
// under the comment "so a consumer can assert the contract it relies on", and for a
// week NO file in the repo imported cortex.mjs at all. setpiece is that consumer: it
// is concept_graph.json's only reader (audit #72, one screen down) and it opened the
// file with a bare readJson — no version check, no age. The producer's own standard
// now reaches its only reader instead of sitting in an export nobody named.
// (cortex's main() is guarded by the argv[1] check, so this import runs no daemon.)
import { graphFreshness, CONCEPT_GRAPH_SCHEMA } from "./cortex.mjs";
import { captain } from "./captain.mjs";   // Block 2 §7.3 (18 Aug 2026): the rematch template names him from the profile, never a literal

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "setpiece_config.json");
const OUT       = join(STATE_DIR, "drills.json");

const DEFAULTS = { max_drills: 3, floor_touch_minutes: 5 };

// THE PROBE GRAMMAR FLOOR — E2E audit (25 Jul 2026, MEDIUM).
// dossier_weights.json is hand-maintained canon ("Content edits follow
// OPPONENT_SCOUT.md"), and readJson() returns null for MISSING and MALFORMED
// alike. Every templated candidate built its prompt through
// fill(dossier && dossier.X_template, ...) and fill() does String(t || "") — so
// ONE trailing comma in that file shipped a full packet whose prompts were the
// empty string, with status:"ok" and nothing on the console. The captain reads
// the sheet, not the JSON: a blank drill is a lost day he can't diagnose.
// The dossier now TUNES the wording; it can never be the thing that decides
// whether a prompt exists. (Weighting fields — rounds/bucket_round_map — are
// deliberately NOT floored: ranking is a nicety, a prompt is load-bearing.)
const DOSSIER_FLOOR = {
  probe_types: {
    recall:      { emoji: "🔵", template: "Cold, no notes — {question}. Bolo." },
    reconstruct: { emoji: "🟡", template: "Derive it live: {question}. Walk me through it — every handoff named." },
    defend:      { emoji: "🟣", template: "You chose {claim}. I think that's wrong. Defend it — or concede exactly where it breaks." },
    novel:       { emoji: "🔴", template: "Unseen: {scenario}. Before you touch a fix — what does 'wrong' mean here, and is anyone measuring it?" },
    negative_space: { emoji: "⚫", template: "Would you even use an LLM for {task}? 'A really good prompt' is not an architecture — where does deterministic code win?" },
  },
  contrast_template: "Both cold, back to back: {a} vs {b} — one sentence each, then the ONE difference that decides {differentiator}. Bolo.",
  rematch_template: "Week-{week} {name} argued: \"{doubt_verbatim}\" — he's across the table. Dismantle him. Bolo.",
  modality_map: { recall: "voice", defend: "voice", novel: "voice", negative_space: "voice", reconstruct: "screen", floor_touch: "voice" },
};
const DOSSIER_DEGRADED_NOTE = "probe grammar fell back to the embedded floor — dossier_weights.json is missing or malformed (prompts intact, dossier weighting off; fix the file)";

// Merges the live dossier over the floor and reports whether it had to fill any
// gap. Layering, not replacement: a healthy dossier comes back byte-identical in
// every field it defines, so nothing about today's phrasing changes.
function hydrateDossier(dossier) {
  const d = dossier && typeof dossier === "object" ? dossier : null;
  let degraded = !d;
  const merged = { ...(d || {}) };
  const given = (d && typeof d.probe_types === "object" && d.probe_types) || {};
  if (!d || typeof d.probe_types !== "object" || !d.probe_types) degraded = true;
  const probes = {};
  for (const k of Object.keys(DOSSIER_FLOOR.probe_types)) {
    const p = (given[k] && typeof given[k] === "object") ? given[k] : {};
    probes[k] = { ...DOSSIER_FLOOR.probe_types[k], ...p };
    if (!String(probes[k].template || "").trim()) { probes[k].template = DOSSIER_FLOOR.probe_types[k].template; degraded = true; }
    if (!String(probes[k].emoji || "").trim()) probes[k].emoji = DOSSIER_FLOOR.probe_types[k].emoji;
  }
  for (const k of Object.keys(given)) if (!probes[k]) probes[k] = given[k];   // captain-added probe types survive
  merged.probe_types = probes;
  for (const k of ["contrast_template", "rematch_template"]) {
    if (!String(merged[k] || "").trim()) { merged[k] = DOSSIER_FLOOR[k]; degraded = true; }
  }
  if (!merged.modality_map || typeof merged.modality_map !== "object") { merged.modality_map = DOSSIER_FLOOR.modality_map; degraded = true; }
  return { dossier: merged, degraded };
}

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const tomorrowStr = (now) => localDate(new Date(now.getTime() + 86400000));

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        max_drills: typeof j.max_drills === "number" ? Math.min(j.max_drills, 3) : DEFAULTS.max_drills,
        floor_touch_minutes: typeof j.floor_touch_minutes === "number" ? j.floor_touch_minutes : DEFAULTS.floor_touch_minutes,
      };
    }
  } catch { /* malformed → defaults */ }
  return { ...DEFAULTS };
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
// dead-wire sweep (11 Aug 2026) — this file had no jsonl reader because every
// input it had was a .json. dugout_scrimmage.jsonl is the first append-lane it
// reads; malformed lines are skipped, never thrown (the shadow.mjs readLines law).
const readLines = (p) => { try { if (existsSync(p)) return readFileSync(p, "utf8").split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch {} return []; };

const fill = (template, slots) => String(template || "").replace(/\{(\w+)\}/g, (_, k) => (slots[k] !== undefined ? slots[k] : `{${k}}`));

// ---------------------------------------------------------------------------
// P2 — THE NIGHT COACH's machine sibling (9 Aug 2026, his unleash word).
// brain_out/night_coach/<date>.json, produced overnight with serve:next_morning
// (the newest file is NAMED for the morning it teaches), read here by calendar
// lookback [today, yesterday] — the dugout.mjs probe-bank pattern, and the only
// shape that works when this compiles at 21:40 for tomorrow. The resolver IS
// the staleness gate: older than yesterday simply never resolves. Shape-checked
// because readJson cannot tell MISSING from MALFORMED, and an LLM-written file
// is exactly the class that arrives half-valid (the DOSSIER_FLOOR scar).
// License (header line 23): enrichment may TUNE wording/ranking/annotations —
// it never decides whether a prompt exists. So the night file ANNOTATES drills
// and stamps a read-receipt; it sources no drill of its own.
function readNightCoach(now = new Date(), dir = join(STATE_DIR, "brain_out/night_coach")) {
  for (const d of [localDate(now), localDate(new Date(now.getTime() - 86400000))]) {
    const nc = readJson(join(dir, d + ".json"));
    if (nc && Array.isArray(nc.misconceptions)) return { ...nc, _resolved_date: d };
  }
  return null;
}

// the annotation: attached ONLY when the overnight map names this drill's
// concept (same conditional law as prereqs — a coach-less bus is byte-identical)
function nightNoteFor(concepts, nc) {
  if (!nc || !Array.isArray(nc.misconceptions) || !Array.isArray(concepts) || !concepts.length) return null;
  const ids = concepts.map((c) => String(c).toLowerCase());
  for (const m of nc.misconceptions) {
    const c = String((m && m.concept) || "").toLowerCase().trim();
    if (!c) continue;
    if (ids.some((id) => id === c || id.includes(c) || c.includes(id))) {
      const note = [
        m.what_he_thinks ? `night coach — woh soch raha hai: ${m.what_he_thinks}` : null,
        m.whats_true ? `sach: ${m.whats_true}` : null,
      ].filter(Boolean).join(" · ");
      return note ? note.slice(0, 240) : null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// pure core
// ---------------------------------------------------------------------------
// E2E audit (25 Jul 2026, LOW): the council split drill shipped
// `concepts: [question.slice(0, 60)]` — a natural-language sentence in the slot
// every other organ reads as a registry id. scorer.gafferPropose() turns
// concepts into the gaffer book's CLAIM and gafferMature() resolves a hit by
// matching reps_log concept ids, so a council bet could only ever MISS: the
// Gaffer's trust tier was being taxed for a formatting choice, and the dossier
// weighting scored the sentence at weight 0. Resolve the question to real ids
// off the concepts.json registry (ids + aliases). If nothing resolves we ship
// NO concepts rather than a sentence — an unbettable claim is bad, a fake one
// that also poisons the ledger is worse.
function conceptsFromText(text, registry) {
  const t = String(text || "").toLowerCase();
  const reg = (registry && registry.concepts) || null;
  if (!t || !reg) return [];
  const hits = [];
  for (const id of Object.keys(reg)) {
    const names = [id, ...(Array.isArray(reg[id] && reg[id].aliases) ? reg[id].aliases : [])];
    // WORD BOUNDARIES, NOT SUBSTRINGS (audit 30 Jul 2026). A bare `includes` makes every
    // SHORT id a landmine in Hinglish: the alias `hal` fired inside *chalta / chal raha /
    // chalo* and tagged his own line ("kaun KAB chalta hai") as `hallucinations`, and
    // `vision` fires inside *division/television*. scorer.gafferPropose() then turns that
    // tag into a ledger CLAIM. The registry keeps growing and its ids keep getting shorter,
    // so this is fixed at the matcher, not by pruning aliases one at a time.
    const found = names.some(n => {
      const raw = String(n || "").toLowerCase().trim();
      if (!raw) return false;
      const variants = [...new Set([raw, raw.replace(/[_-]+/g, " ")])];
      return variants.some(v => {
        const esc = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // \b is wrong at a non-word edge (e.g. "top-k"), so anchor on non-word-or-string-edge
        return new RegExp(`(^|[^a-z0-9])${esc}($|[^a-z0-9])`, "i").test(t);
      });
    });
    if (found) hits.push(id);
  }
  return hits.slice(0, 3);
}

// SPRINT RECONCILIATION — ORGANISM audit #87 (2026-08-04).
// 10 of 10 matured gaffer bets are MISSES, and the delivery half is only part of it:
// the packet aimed at ground he was never going to walk. cards.json hardest_due[0] and
// pitch_read's weak-foot streak both name `inference` — 38 days "overdue" on a capsule
// with ZERO reps ever (overdue because never done, not because it decayed) — while
// sprint.json's current task has been 1-04 Hallucinations and the only real study in the
// window (7 reps, 30-31 Jul) was hallucinations, which the packet had never once drilled.
// Even PERFECT delivery scores 0/10 when the gaffer bets against the curriculum.
// This does not silence the decay sensors; it makes the sprint's current concept the
// FIRST rank key, and adds a candidate for it only when nothing else already covers it.
// Only the concept track resolves to a registry id — a Python/course task is real
// curriculum but is not a concepts.json concept and must never be forced into one.
function sprintFocus(world) {
  const cur = world && world.sprint && world.sprint.progress && world.sprint.progress.current;
  if (!cur || !cur.task) return { task: null, code: null, track: null, id: null };
  const track = String(cur.track || "").toLowerCase() || null;
  const ids = track === "concept" ? conceptsFromText(cur.task, world.registry) : [];
  return { task: String(cur.task), code: cur.id ? String(cur.id) : null, track, id: ids[0] || null };
}

// THE CONCEPT GRAPH — ORGANISM audit #72 (2026-08-04).
// cortex.mjs spends a nightly Opus pass building concept_graph.json (live: 38 nodes,
// 60 edges, `prereq` / `related` / `confused-with`) and until this change ZERO lines of
// code opened it. setpiece is the natural reader: a drill packet is exactly the place a
// map of how concepts connect earns its keep. Two addresses, so the graph reaches the
// packet on every night, not only the nights it happens to produce a candidate:
//   (1) a `graph_edge` contrast drill from a `confused-with` edge the day's own sensors
//       cannot see (learning_state.confusion_pairs only ever holds blurs he has ALREADY
//       logged; the graph predicts one he has not);
//   (2) `prereqs` annotated onto every drill whose concept the graph knows.
// NO freshness threshold is invented here: a prerequisite map is structural knowledge,
// not a dated observation, and the graph's build date is PRINTED in `source` so its age
// is visible rather than silently trusted.
//
// THE CONTRACT CHECK — dead-wire sweep, 11 Aug 2026. The paragraph above rules that
// AGE never blocks, and that ruling stands untouched: a prerequisite map is structural
// knowledge. But "no threshold" was implemented as "no check of any kind", and the two
// are not the same thing. Two separate facts, handled differently:
//   · SCHEMA — cortex's header says the shape "may not be renamed or reordered without
//     updating the reader in the same change", and stamps schema_version for exactly
//     that. A stamp this reader was not written against means the reader is the stale
//     one; it refuses to compile drills off a shape it cannot claim to understand, and
//     SAYS SO on the packet. This is not an invented number — it is cortex's own
//     CONCEPT_GRAPH_SCHEMA, imported, so the two move together or the selftest fails.
//   · AGE — never blocks, now VISIBLE, measured by cortex's graphFreshness (whose
//     standard is the DAILY cadence itself, not a number chosen here). The 4 Aug
//     comment promised the age would be visible; it printed the build DATE only, and
//     the reader of a drill sheet at 22:00 does not do date arithmetic. Live on 11 Aug
//     the graph was generated_at 2026-08-08 — two passes missed on no-headroom — and
//     nothing on the sheet said so.
function graphContract(graph, now = new Date()) {
  if (!graph) return { present: false, usable: false, schema_version: null, expects: CONCEPT_GRAPH_SCHEMA, age_days: null, fresh: null, note: null };
  const sv = Number.isInteger(graph.schema_version) ? graph.schema_version : null;
  const f = graphFreshness(now, { graph });
  const usable = sv === CONCEPT_GRAPH_SCHEMA;
  return {
    present: true, usable, schema_version: sv, expects: CONCEPT_GRAPH_SCHEMA,
    age_days: f.age_days, fresh: f.fresh,
    note: usable ? null
      : sv === null
        ? "concept_graph.json carries no schema_version — an unlabelled shape is not the contract this reader was written against"
        : `concept_graph.json is schema_version ${sv}, this reader implements ${CONCEPT_GRAPH_SCHEMA} — the reader is stale, not the map`,
  };
}
// the graph's read-receipt — ONE builder, so the RED envelope and the normal envelope
// cannot drift (the same-envelope-keys law). Until 11 Aug 2026 this object was written
// out literally in BOTH branches, which is how a contract field gets added to one of
// them and quietly missed on the other. nightCoachRead below is the pattern being
// followed here, not a new idea.
function conceptGraphRead(graph, gc) {
  if (!graph) return null;
  return {
    nodes: graph.node_count ?? null, edges: graph.edge_count ?? null,
    built: String(graph.generated_at || "").slice(0, 10) || null,
    // dead-wire sweep 11 Aug 2026 — proof the contract was checked, not just the file opened
    schema_version: gc.schema_version, expects: gc.expects, usable: gc.usable,
    age_days: gc.age_days, fresh: gc.fresh, contract_note: gc.note,
  };
}
const pairKey = (a, b) => [String(a || "").toLowerCase(), String(b || "").toLowerCase()].sort().join("|");
function prereqsOf(concepts, graph) {
  const edges = graph && Array.isArray(graph.edges) ? graph.edges : [];
  if (!edges.length) return [];
  const want = new Set((concepts || []).map(c => String(c).toLowerCase()));
  const out = [];
  for (const e of edges) {
    if (e && e.kind === "prereq" && e.from && e.to && want.has(String(e.to).toLowerCase())) out.push(String(e.from));
  }
  return [...new Set(out)].filter(c => !want.has(c.toLowerCase()));
}

// THE TWO SCHEDULERS, ON THE PACKET — ORGANISM audit #33 (2026-08-04).
// capsule_bridge computes where FORGE's date-driven Re-Jirah and the repo's FSRS agree
// and disagree. Until this change that computation was (a) wrong — it read FSRS's due
// list out of two INTEGER counters — and (b) read by nobody, which is why nobody noticed.
// It is fixed at the producer; this is the address. The evening packet is the natural
// home: it is the one nightly surface whose whole job is "what should tomorrow touch".
function schedulerNote(cm) {
  if (!cm || !cm.scheduler_disagreement) return null;
  const d = cm.scheduler_disagreement;
  const agree = Array.isArray(cm.scheduler_agreement) ? cm.scheduler_agreement : [];
  const only = (a) => (Array.isArray(a) ? a : []);
  const parts = [];
  if (agree.length) parts.push(`both schedulers say due: ${agree.join(", ")}`);
  if (only(d.capsule_says_due_fsrs_quiet).length) parts.push(`Re-Jirah only: ${d.capsule_says_due_fsrs_quiet.join(", ")}`);
  if (only(d.fsrs_says_due_capsule_quiet).length) parts.push(`FSRS only: ${d.fsrs_says_due_capsule_quiet.join(", ")}`);
  // carry the producer's own have/need counter through, never quietly drop it
  if (cm.fsrs_due_names_complete === false) {
    parts.push(`(FSRS named ${cm.fsrs_due_names_known}/${cm.fsrs_due_total} of its due cards — "Re-Jirah only" may over-report)`);
  }
  // THE HALF OF #33 THAT WAS WIRED AT THE PRODUCER AND NOWHERE ELSE (10 Aug 2026).
  // capsule_bridge has THREE FSRS states, not two: COMPLETE (true), TRUNCATED
  // (false — the branch above), and UNKNOWN (null — cards.json missing or
  // malformed, capsule_bridge.mjs:265-267). The `=== false` test above meant
  // UNKNOWN fell through every branch, and UNKNOWN is the dangerous one: with no
  // names read, `scheduler_agreement` and `fsrs_says_due_capsule_quiet` both go
  // empty and EVERY overdue capsule prints as "Re-Jirah only: X" — a positive
  // claim that FSRS is quiet about X, made on a night FSRS was never opened. The
  // producer computes the disclaimer for exactly this case and until now NO file
  // in the repo read the field (`grep -n fsrs_due_note scripts/*.mjs` returned
  // capsule_bridge alone): it lived only on capsule_bridge.mjs:415's console, and
  // its one automated invoker — heartbeat.mjs:146, via conductor.mjs:71 at 08:39 —
  // runs it with stdio:"pipe" and discards stdout. Built, correct, unread.
  // VERBATIM, never re-worded: the producer owns the words for its own state.
  // `else if` so the truncated case keeps its existing counter and never doubles.
  // Appended even when `parts` is otherwise empty, per this file's own law at
  // :606-608 — "a silent absence reads as 'nothing to say', which is the one
  // thing this organism is not allowed to fake".
  else if (cm.fsrs_due_note) parts.push(`⚠ ${cm.fsrs_due_note}`);
  // THE CAVEAT THAT REACHED NO READER — dead-wire sweep (10 Aug 2026).
  // capsule_bridge.mjs:207 writes `scheduler_disagreement_doc` on EVERY run: the one
  // sentence that stops a reader treating a disagreement as a FAULT — "EXPECTED, not an
  // error … neither overrides the other". `grep -rn scheduler_disagreement_doc` found it
  // repo-wide in exactly two places: the line that writes it, and the file it writes into.
  // This note composed its own sentence out of the arms and dropped the caveat, so on the
  // nights the two arms disagree — live today, tokenization Re-Jirah-only and
  // hallucinations FSRS-only, BOTH sides right, answering different questions — the packet
  // carried a bare contradiction with nothing on it saying that is normal. Same shape as
  // the fsrs_due_note wire above: built, correct, unread.
  // VERBATIM, never re-worded here: the producer owns the words for its own state.
  // GATE — derived from fields already on the map, no new threshold invented:
  //   · an arm must be non-empty (no disagreement ⇒ no caveat to give), AND
  //   · the FSRS side must have actually been READ. fsrs_due_names_complete is the
  //     producer's own true/false/UNKNOWN marker (capsule_bridge.mjs:265-267); on null,
  //     "Re-Jirah only: X" is not two schedulers disagreeing but one scheduler nobody
  //     opened, and calling that EXPECTED would be false reassurance — that night already
  //     carries the ⚠ disclaimer above, which says the opposite and must stand alone.
  // Missing field (a map written before this doc existed) ⇒ nothing added. Absence stays
  // absence; this file never invents another organ's sentence.
  const measured = cm.fsrs_due_names_complete === true || cm.fsrs_due_names_complete === false;
  const disagrees = only(d.capsule_says_due_fsrs_quiet).length > 0 || only(d.fsrs_says_due_capsule_quiet).length > 0;
  const doc = typeof cm.scheduler_disagreement_doc === "string" ? cm.scheduler_disagreement_doc.trim() : "";
  if (measured && disagrees && doc) parts.push(doc);
  return parts.length ? parts.join(" · ") : null;
}

// THE STRIKE BANK, SERVED — dead-wire sweep (2026-08-10).
// capsule_bridge.mjs:133-148 builds `strike_bank`: every axis question the captain has
// already survived, VERBATIM, sorted hardest-first (most overdue, then cracked before
// held). Its own header calls it "the single largest thing the bus was throwing away —
// the scout generates probes from scratch while 36 sit here". Measured today: 36
// entries, 6,434 bytes, rebuilt and re-sorted on every run — and `grep -rn strike_bank`
// found readers in exactly ONE file, capsule_bridge itself (its own emit line and its own
// selftest). A producer with no consumer is a black box, not a feedback loop.
// This is the address. setpiece already opens capsule_map.json (audit #33 wired the
// scheduler arms), and two of its recall prompts synthesised their question out of a bare
// concept id — `${due[0]} — the core mechanism, cold` — while HIS OWN interviewer question
// for that exact concept sat unread in the bank.
// LAWS OBEYED HERE, each of them load-bearing:
//   · CAPSULE PROSE IS SACRED. The strike is copied byte-for-byte and QUOTED — never
//     reworded, never trimmed, never summarised. Quoting is this file's own established
//     grammar for a verbatim captain string (rematch_template, :67, quotes
//     {doubt_verbatim} exactly this way). Nothing here writes to capsules/.
//   · NO INVENTED POLICY. "Which strike" is not decided here: the bank arrives already
//     ordered hardest-first and its producer's comment says that ordering exists "for a
//     consumer that wants one" (capsule_bridge.mjs:146). So the consumer takes the top
//     entry for that concept and nothing else — no rotation, no threshold, no re-scoring.
//     A same-concept repeat across nights is the producer's ordering speaking, and if the
//     captain wants it varied that is HIS call to make, not a number to guess here.
//   · ABSENCE STAYS ABSENCE. No capsule_map, no bank, or no entry for that concept ⇒
//     null, and the caller keeps its existing synthesised question BYTE-IDENTICAL.
function strikeFor(concept, capsuleMap) {
  const bank = capsuleMap && Array.isArray(capsuleMap.strike_bank) ? capsuleMap.strike_bank : [];
  const want = String(concept || "").toLowerCase().trim();
  if (!want || !bank.length) return null;
  const hit = bank.find(s => s && String(s.concept || "").toLowerCase() === want && String(s.strike || "").trim());
  return hit ? { strike: String(hit.strike), axis: hit.axis || null, status: hit.status || null } : null;
}
// The {question} slot for a cold recall: his own words when the bank has them, else the
// caller's stub, unchanged. Returns the strike alongside so the drill can carry its
// provenance (which axis, and JIRAH's grade on it) instead of the captain having to
// wonder where a question he half-recognises came from.
function recallQuestion(concept, capsuleMap, fallback) {
  const s = strikeFor(concept, capsuleMap);
  if (!s) return { question: fallback, strike: null };
  return { question: `${concept}${s.axis ? ` (axis ${s.axis})` : ""} — "${s.strike}"`, strike: s };
}
// the drill fields a served strike adds — kept in one place so both call sites agree
const strikeFields = (s) => (s ? { strike_axis: s.axis, strike_status: s.status, strike_verbatim: true } : {});
const strikeSource = (s) => (s ? ` · his own axis-${s.axis} strike served verbatim (capsule_map.strike_bank)` : "");

// THE RECURRENCE THAT WAS NEVER THERE — ORGANISM audit #32 (2026-08-04).
// This read `wk.headline.recurrence`. nemesis.mjs builds the headline as
// {id, topic, axis, one_line} and has NEVER emitted `recurrence` — the count lives one
// level up, on the matching weaknesses[] row (live value 2). So `"nemesis headline ×?"`
// shipped on EVERY run, and it is not a cosmetic string: scorer.mjs files it as the
// gaffer's ledger evidence, and slip.jsonl now carries two drill:rejirah rows whose
// receipt literally reads "nemesis headline ×?". Worse, this was the ONLY branch that
// has ever run — the axis_pattern alternative is gated at total_reps >= 20 and he is at 9.
// Resolve the count off the row the headline points at (both sides carry `id`), fall back
// to a headline-level `recurrence` if a future nemesis ever emits one, and when neither
// exists SAY SO IN WORDS rather than printing a "×?" that reads like a number.
function headlineCount(wk) {
  const hl = wk && wk.headline;
  if (!hl) return "(no headline)";
  const rows = Array.isArray(wk.weaknesses) ? wk.weaknesses : [];
  const row = rows.find(w => w && hl.id && w.id === hl.id) || rows.find(w => w && hl.topic && w.topic === hl.topic) || null;
  const n = (row && Number.isInteger(row.recurrence)) ? row.recurrence
    : (Number.isInteger(hl.recurrence) ? hl.recurrence : null);
  return n === null ? "(recurrence not reported by nemesis)" : `×${n}`;
}

// candidate sources, in priority order; each returns a drill or null.
// `now` is threaded in (E2E audit 25 Jul 2026, LOW): this used Date.now()
// directly for the tape-room week number, so compile()'s injected clock — the
// whole point of the pure-core/fixture contract — did NOT govern the rematch
// prompt. Its content drifted with the machine's wall clock (and was therefore
// never assertable), and a run stamped for a past date told the captain the
// wrong week. Default kept so existing callers of the export don't change.
function candidates(world, dossier, now = new Date()) {
  const probes = (dossier && dossier.probe_types) || {};
  const nowMs = (now instanceof Date && !Number.isNaN(now.getTime())) ? now.getTime() : Date.now();
  const out = [];

  // TAPE-ROOM rematch — past-self as opponent, the cheapest build in the vision
  const q = world.tape_room && Array.isArray(world.tape_room.queue) ? world.tape_room.queue.filter(x => x.eligible) : [];
  if (q.length) {
    const d = q[0];
    // NaN-guarded: an unparseable locked_on used to reach the prompt as
    // "Week-NaN Nikhil argued…" (E2E audit 25 Jul 2026) — fall back to the same
    // default the missing-date path already used.
    const lockedMs = d.locked_on ? new Date(d.locked_on).getTime() : NaN;
    const weeks = Number.isFinite(lockedMs) ? Math.max(1, Math.round((nowMs - lockedMs) / (7 * 86400000))) : 2;
    out.push({
      kind: "tape_room", probe_type_emoji: "🟣", concepts: [d.capsule],
      prompt: fill(dossier && dossier.rematch_template, { week: weeks, doubt_verbatim: d.q_verbatim, name: captain().name }),
      source: `archived doubt #${d.doubt_index} on ${d.capsule} (locked ${d.locked_on || "?"})`,
      winnable: false, mode: "defend",
    });
  }

  // THE REST ROOM (KAAM 2, 10 Aug 2026) — the night's best VERIFIED dream.
  // Three guards, each one deliberate:
  //  (a) THE SOURCE LINE SAYS WHEN IT WAS DREAMED. A drill sourced from a
  //      simulation must never read like a drill sourced from his own reps, and
  //      the only honest way to hold that line is to date it in the sentence he
  //      reads. Votes are shown too: they are how many independent rollouts
  //      landed on this same stall, which is the only evidence it carries.
  //  (b) IT IS EXPLICITLY CLASSED, NOT DEFAULTED THROUGH. mode "reconstruct"
  //      means the ladder drops it on AMBER (recall only) and on RED
  //      (floor_touch only) — deliberately, because this is the most SPECULATIVE
  //      source on the board and should be the first thing withheld when his
  //      body says rest. The existing AMBER/RED withholding already discloses it
  //      at post-match, so nothing is hidden. A dreamed drill is a GREEN-day drill.
  //  (c) UNVERIFIED IS NOT ELIGIBLE. Only entries the counter-rollout confirmed
  //      may reach him — this file's own "better no ammunition than wrong
  //      ammunition" law, applied at the consumer as well as the producer.
  //      An empty inventory says why, below, instead of a silent zero.
  //  (d) FRESHNESS GATES THE CANDIDATE, not just the note. The first cut of this
  //      lane checked the date only where the reason is WRITTEN, so a dream from
  //      any night still reached the sheet while the note said it had not — the
  //      lane would have served a week-old simulation as tonight's drill. The
  //      test that says "this branch was never entered" is the one that caught it.
  const dmn = world.dmn_precache && world.dmn_precache.date === localDate(now) ? world.dmn_precache : null;
  const dreamt = dmn && Array.isArray(dmn.entries) ? dmn.entries.filter(e => e.verified && e.drill && e.stall_signature) : [];
  if (dreamt.length) {
    const d = dreamt[0];   // already in cut order: verified → votes → recency
    const when = d.last_seen || dmn.dreamed_at || dmn.date || "?";
    out.push({
      kind: "rest_room", probe_type_emoji: "🔵", concepts: [d.concept],
      prompt: d.drill,
      source: `dreamed ${String(when).slice(0, 16).replace("T", " ")} · ${d.votes || 1} independent rollout(s) landed on this stall: "${d.stall_signature}" · SIMULATED, not from your reps`,
      winnable: false, mode: "reconstruct",
    });
  }

  // THE GRADED MOCK (dead-wire sweep, 11 Aug 2026) — the scrimmage's verdict,
  // which used to die on disk. dugout.mjs's scrimmage_report tool has always
  // been instructed (dugout.mjs:538) to name "ONE concrete drill for tomorrow"
  // after probe 5, and it filed that drill into brain_out/dugout/scrimmage_
  // <date>.md — a file NO organ in the repo opened. Tomorrow's drill sheet is
  // compiled here, so this is the address it was written to and never had.
  // Guards, deliberately the same three the Rest Room lane above carries:
  //  (a) FRESHNESS GATES THE CANDIDATE. Only a report stamped for TODAY feeds
  //      tomorrow's sheet — a drill named after last week's mock is a drill for
  //      a session he has already moved past. (The row carries its own captain-
  //      local `day`, written by the producer, so no clock is re-derived here.)
  //  (b) IT IS CLASSED "reconstruct", NOT DEFAULTED. The drill is free text an
  //      examiner authored under pressure; classing it recall would smuggle it
  //      past the AMBER ladder as if it were a light lap. reconstruct means the
  //      body still wins: AMBER (recall only) and RED (floor-touch only) both
  //      drop it, disclosed at post-match like everything else.
  //  (c) THE SOURCE LINE CARRIES THE GRADE, VERBATIM AND UNJUDGED. score/25 and
  //      the persona are the producer's own numbers — nothing here re-scores,
  //      re-weights or thresholds on them (no number is invented in this lane:
  //      a mock played today with a drill named IS the whole eligibility rule).
  const scrims = (world.scrimmage_rows || []).filter(r => r && r.kind === "report" && r.day === localDate(now) && String(r.drill || "").trim());
  if (scrims.length) {
    const s = scrims[scrims.length - 1];        // the day's most recent grading
    const cracks = (Array.isArray(s.weakest) ? s.weakest : []).map(String).filter(Boolean);
    out.push({
      kind: "scrimmage", probe_type_emoji: "🔴", concepts: cracks,
      prompt: String(s.drill),
      source: `graded mock ${s.day}${s.persona ? ` vs ${s.persona}` : ""} · ${Number.isFinite(Number(s.total_25)) ? `${Number(s.total_25)}/25` : "ungraded"}${cracks.length ? ` · weakest: ${cracks.join(" · ")}` : ""} · the examiner's own drill for tomorrow`,
      winnable: false, mode: "reconstruct",
    });
  }

  // DERBY — hottest confusion pair, interleaved discrimination
  const pairs = world.learning_state && Array.isArray(world.learning_state.confusion_pairs) ? world.learning_state.confusion_pairs : [];
  if (pairs.length) {
    const p = pairs[0];
    out.push({
      kind: "derby", probe_type_emoji: "🟡", concepts: [p.from, p.to],
      prompt: fill(dossier && dossier.contrast_template, { a: p.from, b: p.to, differentiator: "which one an interviewer means" }),
      source: `confused_with ×${p.count}: ${p.from} vs ${p.to}`,
      winnable: false, mode: "reconstruct",
    });
  }

  // M18 — SEASON RE-READ cross-week edge: the night's whole-season re-read saw
  // a blur the day's own sensors can't (they look back one day; it read three
  // weeks). Compiled like a derby; freshness is gated in compile().
  const srEdges = world.season_read && Array.isArray(world.season_read.confusion_edges) ? world.season_read.confusion_edges : [];
  if (srEdges.length) {
    const e = srEdges[0];
    out.push({
      kind: "season_edge", probe_type_emoji: "🟡", concepts: [e.from, e.to],
      prompt: fill(dossier && dossier.contrast_template, { a: e.from, b: e.to, differentiator: "which one an interviewer means" }),
      source: `season re-read: ${e.from} ↔ ${e.to} blur across weeks (${e.evidence || "seen in the corpus"})`,
      winnable: false, mode: "reconstruct",
    });
  }

  // CONCEPT GRAPH (audit #72) — a `confused-with` edge the day's own sensors cannot see.
  // Skipped when the pair is already covered by learning_state or the season re-read, so
  // the graph adds a blur nobody else named rather than a third copy of the same one.
  const cg = world.concept_graph;
  const gc = graphContract(cg, now);
  const cgEdges = cg && gc.usable && Array.isArray(cg.edges) ? cg.edges : [];
  if (cgEdges.length) {
    const covered = new Set([
      ...pairs.map(p => pairKey(p.from, p.to)),
      ...srEdges.map(e => pairKey(e.from, e.to)),
    ]);
    const e = cgEdges.find(x => x && x.kind === "confused-with" && x.from && x.to && !covered.has(pairKey(x.from, x.to)));
    if (e) {
      const built = String(cg.generated_at || "").slice(0, 10) || "date unknown";
      // 11 Aug 2026 — the age rides the source line in DAYS, not only as a date the
      // captain has to subtract at 22:00. graphFreshness (cortex's own, imported) is
      // where the number comes from; age never withholds the drill.
      const age = gc.age_days === null ? "" : gc.age_days <= 0 ? ", today's" : `, ${gc.age_days} day(s) old`;
      out.push({
        kind: "graph_edge", probe_type_emoji: "🟡", concepts: [e.from, e.to],
        prompt: fill(dossier && dossier.contrast_template, { a: e.from, b: e.to, differentiator: "which one an interviewer means" }),
        source: `concept graph (${cgEdges.length} edges, built ${built}${age}): ${e.from} ↔ ${e.to} marked confused-with`,
        winnable: false, mode: "reconstruct",
      });
    }
  }

  // DANGER-ZONE — knew-but-wrong → reconstruct probe on that exact topic+axis
  //
  // WIRING AUDIT (10 Aug 2026): this took `dz[0]` blind, and calibration sorts worst
  // knew-accuracy FIRST across BOTH tracks (calibration.mjs:226) — so a Python skill topic
  // could take the single danger slot and be drilled in DOSSIER concept grammar, with
  // `concepts: [d.topic]` claiming a concepts.json id a skill name does not have. This file
  // already knows better one screen up: sprintFocus:215-220 resolves registry ids for the
  // concept track ONLY. The track stamp calibration has carried since 25 Jul is what makes
  // that possible here too, and it was being ignored. Skipped skill entries are NOT silent —
  // they ride the drill's own `source` string, which is the line the captain reads on the
  // sheet. No Python drill is invented in their place: setpiece has no skill grammar, and
  // GEMINI_LOOP.md §11.3 keeps the Python close light on purpose. `|| "concept"` default
  // leaves pre-25-Jul entries behaving exactly as before.
  const dzAll = world.calibration && Array.isArray(world.calibration.danger_zone) ? world.calibration.danger_zone : [];
  const dzSkill = dzAll.filter((x) => x && String(x.track || "concept") === "skill");
  const d = dzAll.find((x) => x && String(x.track || "concept") !== "skill");
  if (d) {
    const skipNote = dzSkill.length ? ` (${dzSkill.length} skill-track entr${dzSkill.length === 1 ? "y" : "ies"} skipped — Python carries no axis grammar, §11.3)` : "";
    out.push({
      kind: "reconstruct", probe_type_emoji: (probes.reconstruct && probes.reconstruct.emoji) || "🟡", concepts: [d.topic],
      prompt: fill(probes.reconstruct && probes.reconstruct.template, { question: `${d.topic}${d.axis ? " (axis " + d.axis + ")" : ""} — the one you were sure about` }),
      source: `danger_zone: knew-wrong on ${d.topic}${skipNote}`,
      winnable: false, mode: "reconstruct",
    });
  }

  // M15 — THE COUNCIL SPLIT: two model families read the same question
  // disjointly. That divergence is curriculum — defend YOUR OWN read of it.
  const cf = world.council_flag;
  if (cf && cf.question) {
    // concepts must be registry ids, never the question text — see conceptsFromText
    const cfConcepts = (Array.isArray(cf.concepts) && cf.concepts.length)
      ? cf.concepts.slice(0, 3).map(String)                       // council.mjs may carry ids one day
      : conceptsFromText(cf.question, world.registry);
    out.push({
      kind: "council_split", probe_type_emoji: "🟣", concepts: cfConcepts,
      prompt: fill(probes.defend && probes.defend.template, { claim: `your own read of: "${cf.question}"` }),
      source: `council split across families (disagreement ${cf.disagreement})`,
      winnable: false, mode: "defend",
    });
  }

  // NEMESIS — the KIND of thinking (axis pattern first, else headline)
  const wk = world.weaknesses;
  if (wk && (wk.axis_pattern || wk.headline)) {
    const ax = wk.axis_pattern;
    const topic = ax ? `${ax.concepts.join(" · ")} (axis ${ax.axis})` : wk.headline.topic;
    out.push({
      kind: "rejirah", probe_type_emoji: (probes.defend && probes.defend.emoji) || "🟣", concepts: ax ? ax.concepts : [wk.headline.topic],
      prompt: fill(probes.defend && probes.defend.template, { claim: `your read of ${topic}` }),
      source: ax ? `axis_pattern strength ${ax.strength}` : `nemesis headline ${headlineCount(wk)}`,
      winnable: false, mode: "defend", nemesis_sourced: true,
    });
  }

  // WEAK-FOOT — change the door, never the pressure; never name the fear
  const streaks = world.pitch_read && world.pitch_read.weak_foot && Array.isArray(world.pitch_read.weak_foot.streaks) ? world.pitch_read.weak_foot.streaks : [];
  if (streaks.length) {
    const s = streaks[0];
    out.push({
      kind: "recall", probe_type_emoji: (probes.recall && probes.recall.emoji) || "🔵", concepts: [s.concept],
      prompt: `Pehle-Guess only — no stakes, no reveal until you commit: ${s.concept}. One cold guess on each of two axis questions. Guessing is the whole drill.`,
      source: `due-served streak ×${s.n} on ${s.concept} (door changed)`,
      winnable: false, mode: "recall",
    });
  }

  // DUE — plain recall on the hardest due card
  const due = world.cards && Array.isArray(world.cards.hardest_due) ? world.cards.hardest_due : [];
  if (due.length) {
    // dead-wire sweep 10 Aug 2026 — see strikeFor(): his own strike, verbatim, when the
    // bank has one for this concept; the old synthesised stub otherwise, unchanged.
    const q = recallQuestion(due[0], world.capsule_map, `${due[0]} — the core mechanism, cold`);
    out.push({
      kind: "recall", probe_type_emoji: (probes.recall && probes.recall.emoji) || "🔵", concepts: [due[0]],
      prompt: fill(probes.recall && probes.recall.template, { question: q.question }),
      source: `hardest_due[0]${strikeSource(q.strike)}`,
      winnable: false, mode: "recall", ...strikeFields(q.strike),
    });
  }

  return out;
}

// SPRINT FOCUS (audit #87) — the backstop candidate. Every candidate above is a reading of
// what BROKE; this one is a reading of what he is actually studying. It is deliberately NOT
// pushed here: compile() adds it only if the pool that SURVIVES the ladder and the war-room
// still fails to reach the curriculum. Building it here would have been the obvious fix and
// the wrong one — verified against live state on an AMBER evening, where the only candidate
// touching `hallucinations` was a `defend`-mode rejirah that AMBER then dropped, leaving a
// packet of two `inference` recalls and a sprint the packet never mentions.
// `capsuleMap` defaults to null (dead-wire sweep 10 Aug 2026) so the exported signature
// stays back-compatible: an existing caller that passes two arguments gets the identical
// synthesised question it always did.
function sprintCandidate(dossier, focus, capsuleMap = null) {
  if (!focus || !focus.id) return null;
  const probes = (dossier && dossier.probe_types) || {};
  const q = recallQuestion(focus.id, capsuleMap, `${focus.id} — the core mechanism, cold`);
  return {
    kind: "recall", probe_type_emoji: (probes.recall && probes.recall.emoji) || "🔵", concepts: [focus.id],
    prompt: fill(probes.recall && probes.recall.template, { question: q.question }),
    source: `sprint current task${focus.code ? " " + focus.code : ""}: ${focus.task}${strikeSource(q.strike)}`,
    winnable: false, mode: "recall", sprint_sourced: true, ...strikeFields(q.strike),
  };
}

// The dossier's own arithmetic, extracted verbatim from the old inline block so both the
// frozen legacy ranker and the live one compute weight identically.
function dossierWeightOf(concept, dossier, registry) {
  const roundW = Object.fromEntries((dossier.rounds || []).map(r => [r.id, r.weight]));
  const c = registry.concepts && registry.concepts[concept];
  const buckets = c && c.bucket ? [c.bucket] : (registry.skills && registry.skills[concept] ? ["skills"] : []);
  return buckets.flatMap(b => (dossier.bucket_round_map && dossier.bucket_round_map[b]) || [])
    .reduce((a, r) => a + (roundW[r] || 0), 0);
}

// LEGACY RANKER (frozen verbatim, layering rule): dossier interview-round weight only.
// It is correct arithmetic and stays available; it is no longer the plan of record because
// it has no opinion about the curriculum — which is how the gaffer came to bet `inference`
// for two straight weeks while the sprint said Hallucinations (audit #87). Not called on
// the run path; rankPool() below subsumes it as its third key.
function rankByDossierLegacy(pool, dossier, registry) {
  if (!(dossier && dossier.rounds && registry)) return pool;
  const roundW = Object.fromEntries(dossier.rounds.map(r => [r.id, r.weight]));
  const weightOf = (concept) => {
    const c = registry.concepts && registry.concepts[concept];
    const buckets = c && c.bucket ? [c.bucket] : (registry.skills && registry.skills[concept] ? ["skills"] : []);
    return buckets.flatMap(b => (dossier.bucket_round_map && dossier.bucket_round_map[b]) || [])
      .reduce((a, r) => a + (roundW[r] || 0), 0);
  };
  return pool.map((d, i) => ({ d, i, w: Math.max(0, ...(d.concepts || []).map(weightOf)) }))
    .sort((a, b) => b.w - a.w || a.i - b.i)      // weight first, stable on ties
    .map(x => x.d);
}

// LIVE RANKER — a single stable sort over three ORDERING keys. Deliberately no numeric
// thresholds and no invented weights (captain's standing order): each key is a yes/no
// derived from state already on the bus, and ties fall through to the next key and finally
// to the candidate's original priority index, so a bus with none of these signals ranks
// EXACTLY as the legacy ranker did.
//   1. on the sprint's current concept   — what he is actually studying (audit #87)
//   2. both schedulers call it due       — FSRS and FORGE's Re-Jirah agreeing is stronger
//                                          evidence than either alone (audit #33)
//   3. dossier interview-round weight    — the frozen legacy key, unchanged
//   4. original candidate order          — stable
function rankPool(pool, world, dossier, focus) {
  const agree = new Set((Array.isArray(world.capsule_map && world.capsule_map.scheduler_agreement)
    ? world.capsule_map.scheduler_agreement : []).map(s => String(s).toLowerCase()));
  const weighted = !!(dossier && dossier.rounds && world.registry);
  const lc = (d) => (d.concepts || []).map(c => String(c).toLowerCase());
  return pool.map((d, i) => ({
    d, i,
    onSprint: focus && focus.id && lc(d).includes(focus.id) ? 1 : 0,
    bothDue: agree.size && lc(d).some(c => agree.has(c)) ? 1 : 0,
    w: weighted ? Math.max(0, ...(d.concepts || []).map(c => dossierWeightOf(c, dossier, world.registry))) : 0,
  }))
    .sort((a, b) => b.onSprint - a.onSprint || b.bothDue - a.bothDue || b.w - a.w || a.i - b.i)
    .map(x => x.d);
}

// the winnable opener: 🟢-fluent concept or a healed trophy — else lightest recall.
function winnableOpener(world, dossier) {
  const probes = (dossier && dossier.probe_types) || {};
  const greens = world.learning_state && Array.isArray(world.learning_state.concepts)
    ? world.learning_state.concepts.filter(c => String(c.fluency || "").includes("🟢") || String(c.fluency || "").includes("fluent")) : [];
  const trophies = world.weaknesses && Array.isArray(world.weaknesses.weaknesses)
    ? world.weaknesses.weaknesses.filter(w => w.status === "closed") : [];
  if (greens.length) {
    const g = greens[0];
    return {
      kind: "opener", probe_type_emoji: (probes.recall && probes.recall.emoji) || "🔵", concepts: [g.id],
      prompt: fill(probes.recall && probes.recall.template, { question: `${g.id} — one clean lap, your best ground` }),
      source: `green ball: ${g.id} is 🟢`, winnable: true, mode: "recall",
    };
  }
  if (trophies.length) {
    const t = trophies[0];
    return {
      kind: "opener", probe_type_emoji: "🏆", concepts: [t.topic],
      prompt: `A healed one, for the first touch: ${t.topic}. One sentence on what used to break and doesn't anymore. Bolo.`,
      source: `healed trophy: ${t.topic} (closed)`, winnable: true, mode: "recall",
    };
  }
  return null; // caller may promote the lightest recall
}

function compile(world, cfg, ladderCfg, dossier, now = new Date()) {
  // E2E audit (25 Jul 2026): a missing/corrupt dossier used to produce prompt:""
  // everywhere and still say status:"ok". Floor the probe grammar first, and
  // carry the fact forward as low_confidence + a disclosure (never silent).
  const hyd = hydrateDossier(dossier);
  const dossierDegraded = hyd.degraded;
  dossier = hyd.dossier;
  // M18 — a stale season re-read (>7d) never steers tomorrow's drills
  if (world.season_read && world.season_read.date) {
    const lag = (now - new Date(world.season_read.date)) / 86400000;
    if (!(lag >= -1 && lag <= 7)) world = { ...world, season_read: null };
  }
  // M15 — a stale council flag (>2d) never steers them either
  if (world.council_flag && world.council_flag.date) {
    const lag = (now - new Date(world.council_flag.date)) / 86400000;
    if (!(lag >= -1 && lag <= 2)) world = { ...world, council_flag: null };
  }
  const verdict = (world.readiness && typeof world.readiness.verdict === "string") ? world.readiness.verdict.toUpperCase() : "GREEN";
  const tier = (ladderCfg && ladderCfg[verdict]) || (ladderCfg && ladderCfg.GREEN) || { drill_modes_allowed: ["recall", "reconstruct", "defend", "novel", "negative_space"], max_drills: 3 };
  const withheld = [];
  if (dossierDegraded) withheld.push(DOSSIER_DEGRADED_NOTE);
  // dead-wire sweep 11 Aug 2026 — the graph's contract, resolved ONCE per packet so the
  // candidate lane, the prereq lane and both read-receipts cannot disagree about it.
  const gcontract = graphContract(world.concept_graph, now);
  if (gcontract.present && !gcontract.usable) withheld.push(`concept graph withheld — ${gcontract.note}`);
  // KAAM 2 guard (c) — AN EMPTY INVENTORY WRITES ITS REASON, never a silent zero.
  // The Rest Room lane can be empty for four genuinely different reasons and they
  // are NOT the same news: it never dreamed, it dreamed a different day, it
  // dreamed and everything failed verification, or it is simply not wired. A
  // silent absence reads as "nothing to say", which is the one thing this
  // organism is not allowed to fake.
  {
    const p = world.dmn_precache;
    const verified = p && Array.isArray(p.entries) ? p.entries.filter(e => e.verified && e.drill) : [];
    if (!p) withheld.push("rest room: no dream on disk — it dreams only while you are away");
    // localDate(now), NOT tomorrowStr(now): the sheet is FOR tomorrow but the
    // dream is dreamed TONIGHT, so tonight's date is the one that means "fresh".
    else if (p.date !== localDate(now)) withheld.push(`rest room: the newest dream is for ${p.date}, not tonight — not served`);
    else if (!verified.length) withheld.push(`rest room: ${(p.entries || []).length} dream(s) tonight, ZERO survived verification — unverified ammunition is never served`);
  }
  // dead-wire sweep (11 Aug 2026) — the graded mock's lane obeys the same law:
  // AN EMPTY INVENTORY WRITES ITS REASON. "No scrimmage drill" has three
  // different meanings and they are not the same news — he never played one, he
  // played one on another day, or he played one today and the examiner named no
  // drill (which is the tool call going half-done, and the only one of the three
  // that is a defect worth seeing).
  {
    const reports = (world.scrimmage_rows || []).filter(r => r && r.kind === "report");
    const today = reports.filter(r => r.day === localDate(now));
    if (!reports.length) withheld.push("graded mock: no scrimmage has ever been filed — the lane fills the first time he plays one");
    else if (!today.length) withheld.push(`graded mock: the newest scrimmage is ${reports[reports.length - 1].day}, not today — its drill was for a session already past`);
    else if (!today.some(r => String(r.drill || "").trim())) withheld.push("graded mock: played today but the report named NO drill — nothing to compile (the examiner's call went half-done)");
  }
  // resolved before the RED branch so every packet — including a floor-touch one — carries
  // the same envelope keys. A consumer must never have to tell "absent" from "not today".
  const focus = sprintFocus(world);

  // RED: exactly one five-minute floor-touch. Nothing else. Mercy, disclosed.
  if (verdict === "RED") {
    withheld.push("full drill packet withheld (ladder RED — rest is the work today)");
    withheld.push("nemesis-sourced content withheld (RED mercy, disclosed here)");
    return {
      date: tomorrowStr(now), for: tomorrowStr(now), status: "ok", low_confidence: dossierDegraded,
      generated_at: now.toISOString(), ladder_verdict: verdict,
      drills: [{
        kind: "floor_touch", probe_type_emoji: "🛟", concepts: [],
        prompt: `One ${cfg.floor_touch_minutes}-minute touch: open the field, one green concept, one sentence out loud. That is a won day.`,
        source: "ladder RED", winnable: true, mode: "floor_touch",
      }],
      withheld, bench_note: null,
      sprint_alignment: {
        current_task: focus.task, current_code: focus.code, current_track: focus.track,
        concept_id: focus.id, covered: false, drills_on_current: 0,
        note: "ladder RED — the curriculum is deliberately not touched today (rest is the work)",
      },
      scheduler_note: schedulerNote(world.capsule_map),
      concept_graph_read: conceptGraphRead(world.concept_graph, gcontract),
      night_coach_read: nightCoachRead(world.night_coach),
    };
  }

  // SELECTION (audit #87 + #33 + the frozen dossier weighting) — see rankPool.
  let pool = rankPool(candidates(world, dossier, now), world, dossier, focus);

  // WAR-ROOM (scout.json flag, captain-logged interview inside taper window):
  // short sharp match-conditions only — DEFEND/NOVEL/NEGATIVE-SPACE polish and
  // rematches; nothing first-exposure. Voiced as taper, never as countdown.
  const warRoom = !!(world.scout && world.scout.war_room && world.scout.war_room.active) && verdict === "GREEN";
  if (warRoom) {
    const dropped = pool.filter(d => !["defend", "novel", "negative_space"].includes(d.mode) && d.kind !== "tape_room");
    if (dropped.length) withheld.push("war-room taper: first-exposure and long grinds benched — short sharp mocks; sleep is training now");
    pool = pool.filter(d => ["defend", "novel", "negative_space"].includes(d.mode) || d.kind === "tape_room");
  }

  // AMBER: recall-weight only (low executive load), nemesis headline still shown
  // per ladder_config, but heavy modes drop; cap per tier.
  if (verdict === "AMBER") {
    const dropped = pool.filter(d => d.mode !== "recall");
    if (dropped.length) withheld.push(`heavy drill modes withheld (ladder AMBER): ${[...new Set(dropped.map(d => d.kind))].join(", ")}`);
    pool = pool.filter(d => d.mode === "recall");
  }

  // THE SPRINT BACKSTOP (audit #87) — applied HERE, after the ladder and the war-room have
  // spoken, because those two filters are exactly what used to strip the curriculum out of
  // the packet without anyone noticing. It respects both: a mode neither of them allows is
  // never smuggled back in, and when that happens sprint_alignment says so in words rather
  // than quietly shipping an off-curriculum packet.
  const onFocusDrill = (d) => !!focus.id && (d.concepts || []).some(c => String(c).toLowerCase() === focus.id);
  const modeAllowed = (mode) =>
    (!Array.isArray(tier.drill_modes_allowed) || tier.drill_modes_allowed.includes(mode))
    && (verdict !== "AMBER" || mode === "recall")
    && (!warRoom || ["defend", "novel", "negative_space"].includes(mode));
  if (focus.id && !pool.some(onFocusDrill)) {
    const sc = sprintCandidate(dossier, focus, world.capsule_map);
    if (sc && modeAllowed(sc.mode)) pool = rankPool([sc, ...pool], world, dossier, focus);
  }

  const maxN = Math.min(cfg.max_drills, typeof tier.max_drills === "number" ? tier.max_drills : cfg.max_drills);
  const opener = winnableOpener(world, dossier);
  const drills = [];
  if (opener) drills.push(opener);
  for (const d of pool) {
    if (drills.length >= maxN) break;
    drills.push(d);
  }
  // no opener found and pool exists → promote first drill to winnable-lightest
  if (!opener && drills.length) drills[0] = { ...drills[0], winnable: true, source: drills[0].source + " (promoted to lightest opener)" };
  const trimmed = pool.length + (opener ? 1 : 0) - drills.length;

  const finalDrills = drills.slice(0, maxN).map(d => {
    // MODALITY ROUTING (dossier law, U2c): voice-first vs screen-first per mode
    const withModality = { ...d, modality: ((dossier && dossier.modality_map) || {})[d.mode] || "voice" };
    // audit #72 — the graph's second address: the ground this drill stands on. Only
    // attached when the graph actually knows something, so a graph-less bus is unchanged.
    // 11 Aug 2026: and only when the SHAPE is the contract this reader implements — an
    // off-contract `edges` array is not a prerequisite claim we may put in front of him.
    const pre = gcontract.usable ? prereqsOf(d.concepts, world.concept_graph) : [];
    const withPre = pre.length ? { ...withModality, prereqs: pre } : withModality;
    // P2 — the night coach's annotation, same conditional law: attached only when the
    // overnight map names this drill's concept. Rides beside the prompt, never inside it
    // (the prompt stays deterministic; LLM prose never enters a prompt string).
    const nn = nightNoteFor(d.concepts, world.night_coach);
    return nn ? { ...withPre, night_note: nn } : withPre;
  });
  // audit #87 — the packet states, on its own face, whether it reached the curriculum.
  // `covered: null` means "no sprint concept could be resolved", never a silent false.
  const onFocus = focus.id ? finalDrills.filter(onFocusDrill) : [];
  const sprint_alignment = {
    current_task: focus.task, current_code: focus.code, current_track: focus.track,
    concept_id: focus.id,
    covered: focus.id ? onFocus.length > 0 : null,
    drills_on_current: focus.id ? onFocus.length : null,
    note: !focus.task ? "sprint.json unreadable or carries no current task — packet compiled without a curriculum anchor"
      : focus.id
        ? (onFocus.length ? null
          : warRoom ? `war-room taper — the sprint concept (${focus.id}) is deliberately benched; short sharp match-conditions only`
            : `packet does not touch the sprint's current concept (${focus.id}) — nothing the ladder allows could carry it`)
        : `current task "${focus.task}" (track ${focus.track || "?"}) resolves to no concepts.json id — it cannot be ranked or bet on`,
  };
  return {
    date: tomorrowStr(now), for: tomorrowStr(now), status: drills.length ? "ok" : "awaiting_data",
    low_confidence: dossierDegraded, generated_at: now.toISOString(), ladder_verdict: verdict,
    drills: finalDrills,
    withheld,
    bench_note: trimmed > 0 ? `${trimmed} more compiled and benched — doable by doing these first` : null,
    sprint_alignment,
    // audit #33 — the two schedulers, on the surface the captain reads at night.
    scheduler_note: schedulerNote(world.capsule_map),
    // audit #72 — proof the nightly Opus map was opened, and how old it was when it was.
    // 11 Aug 2026 — "how old" is now a measured age from cortex's own graphFreshness,
    // plus the schema stamp this reader checked it against.
    concept_graph_read: conceptGraphRead(world.concept_graph, gcontract),
    // P2 — proof the night coach's map was opened, and which morning it was named for.
    night_coach_read: nightCoachRead(world.night_coach),
  };
}

// the read-receipt (both envelopes carry it — the same-envelope-keys law at the RED branch)
function nightCoachRead(nc) {
  return nc
    ? { date: nc._resolved_date || null, study_day: nc.study_day || null, misconceptions: (nc.misconceptions || []).length }
    : null;
}

// ---------------------------------------------------------------------------
// selftest — fixture world
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = loadConfig("__no_such__");
  // E2E audit (25 Jul 2026, LOW): this used to read the LIVE ladder_config.json
  // and dossier_weights.json and then assert their CONTENT (AMBER.max_drills===2,
  // the modality routing). Those files are explicitly tunable canon — only the
  // medical thresholds sit outside the genome — so the captain retuning AMBER to
  // 3 turned setpiece's selftest RED on code that had not changed, and the
  // organism doctor would have blamed this file. Code is now tested against
  // FIXTURES; the live files get one shape-only smoke check below.
  const ladderCfg = {
    GREEN: { drill_modes_allowed: ["recall", "reconstruct", "defend", "novel", "negative_space"], max_drills: 3, first_ball: "winnable_green" },
    AMBER: { drill_modes_allowed: ["recall"], max_drills: 2, first_ball: "winnable_green" },
    RED:   { drill_modes_allowed: ["floor_touch"], max_drills: 1, first_ball: "five_minute_floor_touch" },
  };
  const dossier = {
    rounds: [
      { id: "system_design", weight: 0.267 }, { id: "build", weight: 0.222 },
      { id: "production_eval", weight: 0.2 }, { id: "fundamentals", weight: 0.178 },
      { id: "behavioral", weight: 0.133 },
    ],
    bucket_round_map: {
      "1-fundamentals": ["fundamentals", "system_design"],
      "2-rag": ["system_design", "production_eval", "build"],
      "3-agents": ["system_design", "build"],
      skills: ["build", "production_eval"],
    },
    probe_types: {
      recall:      { emoji: "🔵", template: "Cold, no notes — {question}. Bolo." },
      reconstruct: { emoji: "🟡", template: "Derive it live: {question}. Walk me through it — every handoff named." },
      defend:      { emoji: "🟣", template: "You chose {claim}. I think that's wrong. Defend it — or concede exactly where it breaks." },
      novel:       { emoji: "🔴", template: "Unseen: {scenario}. What does 'wrong' mean here?" },
      negative_space: { emoji: "⚫", template: "Would you even use an LLM for {task}?" },
    },
    contrast_template: "Both cold, back to back: {a} vs {b} — one sentence each, then the ONE difference that decides {differentiator}. Bolo.",
    rematch_template: "Week-{week} {name} argued: \"{doubt_verbatim}\" — he's across the table. Dismantle him. Bolo.",
    modality_map: { recall: "voice", defend: "voice", novel: "voice", negative_space: "voice", reconstruct: "screen", floor_touch: "voice" },
  };
  const now = new Date(2026, 6, 12, 21, 40, 0);

  // the live bus still has to PARSE and carry the shape the code indexes into —
  // that is a real failure mode (a hand-edit that breaks JSON). Values are the
  // captain's to tune and are deliberately not asserted.
  const liveLadder = readJson(join(STATE_DIR, "ladder_config.json"));
  const liveDossier = readJson(join(STATE_DIR, "dossier_weights.json"));
  assert("live canon configs parse and carry the SHAPE the code needs (values stay tunable)",
    !!liveLadder && ["GREEN", "AMBER", "RED"].every(v => liveLadder[v] && Array.isArray(liveLadder[v].drill_modes_allowed) && typeof liveLadder[v].max_drills === "number")
    && !!liveDossier && !!liveDossier.probe_types && typeof liveDossier.rematch_template === "string"
    && typeof liveDossier.contrast_template === "string" && !!liveDossier.modality_map);

  const world = {
    readiness: { verdict: "GREEN" },
    tape_room: { queue: [{ capsule: "embeddings", doubt_index: 3, q_verbatim: "maine socha KV cache layers share karta hai", locked_on: "2026-06-21", eligible: true }] },
    learning_state: {
      confusion_pairs: [{ from: "tokenization", to: "embeddings", count: 4 }],
      concepts: [{ id: "inference", fluency: "🟢 fluent" }, { id: "chunking", fluency: "🔴 learning" }],
    },
    calibration: { danger_zone: [{ topic: "context", confidence: "high", accuracy: "low", axis: "e" }] },
    // ORGANISM audit #32 (2026-08-04): this fixture used to read
    //   weaknesses: { headline: { topic: "chunking", recurrence: 3 }, ... }
    // — a shape nemesis.mjs has NEVER emitted. It is why `source: "nemesis headline ×?"`
    // shipped to disk for weeks with a green suite. The fixture below is copied from the
    // real producer: headline = {id, topic, axis, one_line}, and `recurrence` lives on the
    // matching weaknesses[] row. If nemesis's schema moves again, this goes red first.
    weaknesses: {
      headline: { id: "chunking", topic: "chunking", axis: "e", one_line: "3× miss on chunking — axis e keeps breaking. today's #1 to scout — drill it before it drills you." },
      axis_pattern: { axis: "e", concepts: ["tokenization", "chunking", "retrieval"], strength: 3 },
      weaknesses: [
        { id: "chunking", topic: "chunking", recurrence: 3, last_seen: "2026-07-11", status: "open", evidence: ["07-11 09:12 axis e relapse"], axis: "e", score: 2.6 },
        { id: "rlhf", topic: "rlhf", recurrence: 2, last_seen: "2026-06-20", status: "closed", evidence: ["06-20 10:00 axis c knew-wrong"], axis: "c", score: 0.2 },
      ],
    },
    pitch_read: { weak_foot: { streaks: [{ concept: "retrieval", n: 3 }] } },
    cards: { hardest_due: ["context", "chunking"] },
  };

  const green = compile(world, cfg, ladderCfg, dossier, now);
  assert("GREEN compiles drills", green.drills.length > 0 && green.status === "ok");
  assert("≤3 DRILLS LAW", green.drills.length <= 3);
  assert("FIRST BALL WINNABLE — opener is the 🟢 concept", green.drills[0].winnable === true && green.drills[0].concepts.includes("inference"));
  assert("tape-room rematch uses the doubt VERBATIM", JSON.stringify(green.drills).includes("maine socha KV cache"));
  assert("drills compiled for TOMORROW", green.for === "2026-07-13");
  assert("no deadline language in prompts", !green.drills.some(d => /deadline|days left|time is short|hurry/i.test(d.prompt)));
  assert("bench note names what was benched (never silent)", green.bench_note === null || /benched/.test(green.bench_note));

  // === WIRING AUDIT (10 Aug 2026) — THE DANGER ZONE'S TRACK STAMP ==========
  // calibration sorts worst-knew-accuracy first across BOTH namespaces, so the top entry
  // is regularly a Python skill topic (live run: `pydantic` ahead of `chunking`). Asserted
  // on `candidates`, not `compile`, because the ≤3 law can bench a real candidate — testing
  // the survivor would hide the bug the day the ranker changed its mind.
  {
    const mixed = candidates({ ...world, calibration: { danger_zone: [
      { topic: "pydantic", track: "skill", confidence: "high", accuracy: "low" },
      { topic: "context", track: "concept", confidence: "high", accuracy: "low", axis: "e" },
    ] } }, dossier, now);
    const dc = mixed.filter(c => String(c.source || "").startsWith("danger_zone:"));
    assert("#wire: the danger drill skips the skill track (no Python in concept grammar), takes the concept behind it, and SAYS it skipped",
      dc.length === 1 && dc[0].concepts[0] === "context" && /1 skill-track entry skipped/.test(dc[0].source)
      && !JSON.stringify(mixed).includes("pydantic"));
    const allSkill = candidates({ ...world, calibration: { danger_zone: [{ topic: "pydantic", track: "skill", confidence: "high", accuracy: "low" }] } }, dossier, now);
    assert("#wire: a danger zone that is ALL skill-track makes no drill here (no Python grammar is invented — §11.3)",
      !allSkill.some(c => String(c.source || "").startsWith("danger_zone:")));
    const untracked = candidates({ ...world, calibration: { danger_zone: [{ topic: "context", confidence: "high", accuracy: "low", axis: "e" }] } }, dossier, now);
    assert("#wire: an untracked (pre-25-Jul) danger entry still drills exactly as before",
      untracked.some(c => String(c.source || "") === "danger_zone: knew-wrong on context"));
  }

  // === KAAM 2 (10 Aug 2026) — THE REST ROOM GETS AN ADDRESS ================
  // EVERY ONE OF THESE EXERCISES A BRANCH WITH A PRECACHE PRESENT. The first
  // version of this lane shipped with an undefined `todayKey` in the freshness
  // check — the whole suite stayed green because no fixture ever put a precache
  // on the bus, so the branch was never entered. It would have thrown on its
  // FIRST real run, tonight at 22:40, inside an evening chain that has never
  // fired. Fixtures that never enter the branch are not coverage.
  {
    const dreamt = (over = {}) => ({
      date: localDate(now), dreamed_at: "2026-07-14T20:00:00.000Z",
      entries: [{ concept: "hallucinations", stall_signature: "cannot name the measure", drill: "hand-label 10 outputs as grounded/not, then name the measure", votes: 3, verified: true, last_seen: "2026-07-14T20:00:00.000Z" }],
      ...over,
    });
    const withDream = compile({ ...world, dmn_precache: dreamt() }, cfg, ladderCfg, dossier, now);
    const dreamDrill = withDream.drills.find(d => d.kind === "rest_room");
    assert("KAAM2 — a VERIFIED dream reaches the sheet as one more candidate (no privilege, no new number)",
      !!dreamDrill && dreamDrill.concepts[0] === "hallucinations");
    assert("KAAM2 — guard (a): the source line DATES the dream and says it is SIMULATED, never his own reps",
      /dreamed 2026-07-14/.test(dreamDrill.source) && /SIMULATED, not from your reps/.test(dreamDrill.source)
      && /3 independent rollout\(s\)/.test(dreamDrill.source));
    assert("KAAM2 — guard (b): it is CLASSED, not defaulted — AMBER and RED both withhold it",
      compile({ ...world, dmn_precache: dreamt(), readiness: { verdict: "AMBER" } }, cfg, ladderCfg, dossier, now).drills.every(d => d.kind !== "rest_room")
      && compile({ ...world, dmn_precache: dreamt(), readiness: { verdict: "RED" } }, cfg, ladderCfg, dossier, now).drills.every(d => d.kind !== "rest_room"));
    const unver = compile({ ...world, dmn_precache: dreamt({ entries: [{ concept: "x", stall_signature: "s", drill: "d", votes: 9, verified: false }] }) }, cfg, ladderCfg, dossier, now);
    assert("KAAM2 — guard (c): an UNVERIFIED dream never reaches him, and the reason is written down",
      unver.drills.every(d => d.kind !== "rest_room")
      && (unver.withheld || []).some(w => /ZERO survived verification/.test(w)));
    const stale = compile({ ...world, dmn_precache: dreamt({ date: "2026-07-01" }) }, cfg, ladderCfg, dossier, now);
    assert("KAAM2 — THE todayKey BUG: a precache from another day is compared against TONIGHT's date and says so (this branch is what was never entered)",
      stale.drills.every(d => d.kind !== "rest_room")
      && (stale.withheld || []).some(w => /newest dream is for 2026-07-01, not tonight/.test(w)));
    assert("KAAM2 — no dream at all is absence with a reason, never a silent zero",
      (compile({ ...world, dmn_precache: null }, cfg, ladderCfg, dossier, now).withheld || []).some(w => /no dream on disk/.test(w)));
    assert("KAAM2 — the <=3 drill law survives the extra candidate", withDream.drills.length <= 3);
  }

  // === DEAD-WIRE SWEEP (11 Aug 2026) — THE GRADED MOCK REACHES THE SHEET =====
  // dugout.mjs graded a scrimmage /25, named the two weakest cracks and ONE
  // drill for tomorrow, wrote it to brain_out/dugout/scrimmage_<date>.md — and
  // no organ in the repo ever opened that file. These assertions fail the moment
  // that wire is cut again at EITHER end: the producer's row shape (asserted in
  // dugout.mjs's own suite) and this consumer's read of it.
  {
    const report = (over = {}) => ({
      ts: "2026-07-12T15:40:00.000Z", day: localDate(now), kind: "report", total_25: 17,
      weakest: ["eval metrics", "context handoff"],
      drill: "reconstruct the eval harness cold — every handoff named", persona: "scenario_bomb", ...over,
    });
    const withScrim = candidates({ ...world, scrimmage_rows: [{ ts: "2026-07-12T15:00:00.000Z", hedges: 3 }, report()] }, dossier, now);
    const sd = withScrim.find(d => d.kind === "scrimmage");
    assert("#wire: TODAY's graded mock reaches the drill pool — its drill is the prompt, its two cracks are the concepts",
      !!sd && sd.prompt === "reconstruct the eval harness cold — every handoff named"
      && sd.concepts.join("|") === "eval metrics|context handoff");
    assert("#wire: the source line carries the grade + persona verbatim, and nothing here re-scores it",
      /17\/25/.test(sd.source) && /scenario_bomb/.test(sd.source) && /graded mock/.test(sd.source));
    assert("#wire: a hedge row in the same lane is NOT a report (the additive row shape stays readable)",
      withScrim.filter(d => d.kind === "scrimmage").length === 1);
    assert("#wire: guard (b) — CLASSED reconstruct, so AMBER and RED both drop it (the body still wins)",
      sd.mode === "reconstruct"
      && compile({ ...world, scrimmage_rows: [report()], readiness: { verdict: "AMBER" } }, cfg, ladderCfg, dossier, now).drills.every(d => d.kind !== "scrimmage")
      && compile({ ...world, scrimmage_rows: [report()], readiness: { verdict: "RED" } }, cfg, ladderCfg, dossier, now).drills.every(d => d.kind !== "scrimmage"));
    const staleScrim = compile({ ...world, scrimmage_rows: [report({ day: "2026-07-01" })] }, cfg, ladderCfg, dossier, now);
    assert("#wire: guard (a) — a mock from another day never compiles, and the withheld line NAMES that day",
      staleScrim.drills.every(d => d.kind !== "scrimmage")
      && (staleScrim.withheld || []).some(w => /newest scrimmage is 2026-07-01, not today/.test(w)));
    const noDrill = compile({ ...world, scrimmage_rows: [report({ drill: "  " })] }, cfg, ladderCfg, dossier, now);
    assert("#wire: played today but NO drill named is a half-done tool call, said in words — never a silent zero",
      noDrill.drills.every(d => d.kind !== "scrimmage")
      && (noDrill.withheld || []).some(w => /named NO drill/.test(w)));
    assert("#wire: an empty lane is absence WITH a reason",
      (compile({ ...world, scrimmage_rows: [] }, cfg, ladderCfg, dossier, now).withheld || []).some(w => /no scrimmage has ever been filed/.test(w)));
    assert("#wire: the <=3 drill law survives this candidate too",
      compile({ ...world, scrimmage_rows: [report()] }, cfg, ladderCfg, dossier, now).drills.length <= 3);
  }
  assert("MODALITY ROUTING — every drill tagged voice/screen per dossier map", green.drills.every(d => ["voice", "screen"].includes(d.modality)));
  assert("recall/defend route VOICE, reconstruct routes SCREEN", green.drills.every(d => d.mode === "reconstruct" ? d.modality === "screen" : (d.mode === "recall" || d.mode === "defend") ? d.modality === "voice" : true));
  // E2E audit (25 Jul 2026, LOW): the week number must ride the INJECTED clock.
  // Doubt locked 2026-06-21, clock 2026-07-12 ⇒ Week-3. Under the old Date.now()
  // this climbed with the real calendar (Week-5 on the day the audit ran) —
  // which is precisely why no assertion could ever be written against it.
  assert("tape-room week number rides the INJECTED clock, not the wall clock", green.drills.some(d => d.kind === "tape_room" && d.prompt.includes("Week-3")));
  const badLock = compile({ readiness: { verdict: "GREEN" }, tape_room: { queue: [{ capsule: "kv-cache", doubt_index: 1, q_verbatim: "kuch bhi", locked_on: "not-a-date", eligible: true }] } }, cfg, ladderCfg, dossier, now);
  assert("an unparseable locked_on never reaches the prompt as Week-NaN", badLock.drills.length === 1 && !/NaN/.test(badLock.drills[0].prompt));

  const amber = compile({ ...world, readiness: { verdict: "AMBER" } }, cfg, ladderCfg, dossier, now);
  assert("AMBER → recall-weight only", amber.drills.slice(1).every(d => d.mode === "recall" || d.kind === "opener"));
  assert("AMBER → max 2 (ladder tier)", amber.drills.length <= 2);
  assert("AMBER withholding disclosed", amber.withheld.some(w => w.includes("AMBER")));

  const red = compile({ ...world, readiness: { verdict: "RED" } }, cfg, ladderCfg, dossier, now);
  assert("RED → exactly ONE floor-touch", red.drills.length === 1 && red.drills[0].kind === "floor_touch");
  assert("RED floor-touch is winnable + five-minute", red.drills[0].winnable === true && red.drills[0].prompt.includes("5-minute"));
  assert("RED nemesis withholding disclosed", red.withheld.some(w => w.includes("nemesis")));

  // no green, no trophy → promote lightest to winnable
  const bare = compile({ readiness: { verdict: "GREEN" }, cards: { hardest_due: ["context"] } }, cfg, ladderCfg, dossier, now);
  assert("no green anywhere → first drill promoted winnable", bare.drills.length >= 1 && bare.drills[0].winnable === true);

  // trophy opener when no green
  const trophyWorld = { readiness: { verdict: "GREEN" }, weaknesses: { weaknesses: [{ topic: "rlhf", status: "closed" }] }, cards: { hardest_due: ["context"] } };
  const trophy = compile(trophyWorld, cfg, ladderCfg, dossier, now);
  assert("healed trophy serves as opener when no 🟢 exists", trophy.drills[0].kind === "opener" && trophy.drills[0].concepts.includes("rlhf"));

  const empty = compile({}, cfg, ladderCfg, dossier, now);
  assert("bloodless world → awaiting_data, zero drills, no crash", empty.status === "awaiting_data" && empty.drills.length === 0);

  // MISSING / CORRUPT DOSSIER — E2E audit (25 Jul 2026, MEDIUM). One trailing
  // comma in the hand-maintained canon used to ship a packet of empty prompts
  // that still said status:"ok". The grammar floor makes the prompt exist; the
  // disclosure makes the breakage audible at post-match.
  {
    const nd = compile(world, cfg, ladderCfg, null, now);
    assert("corrupt/missing dossier still ships COMPLETE prompts (never an empty string)",
      nd.drills.length > 0 && nd.drills.every(d => String(d.prompt || "").trim().length > 20)
      && nd.drills.some(d => d.kind === "tape_room" && d.prompt.includes("maine socha KV cache")));
    assert("a floored dossier is DISCLOSED, never a silent 'ok'", nd.low_confidence === true && nd.withheld.some(w => /dossier/i.test(w)));
    assert("a floored dossier still routes modality (reconstruct → screen)", nd.drills.every(d => d.mode === "reconstruct" ? d.modality === "screen" : true));
    const healthy = compile(world, cfg, ladderCfg, dossier, now);
    assert("a HEALTHY dossier is untouched by the floor (no false alarm)", healthy.low_confidence === false && !healthy.withheld.some(w => /dossier/i.test(w)));
  }

  // M18 — the season re-read's cross-week edge becomes a drill; stale never rides
  {
    const srWorld = { ...world, season_read: { date: "2026-07-12", confusion_edges: [{ from: "context", to: "kv-cache", evidence: "blurred in 3 sessions" }] } };
    const srDrills = compile(srWorld, cfg, ladderCfg, dossier, now);
    assert("season re-read: a FRESH cross-week edge compiles as a drill candidate", JSON.stringify(srDrills).includes("season re-read") || srDrills.bench_note !== null);
    const bareSr = compile({ readiness: { verdict: "GREEN" }, season_read: { date: "2026-07-12", confusion_edges: [{ from: "context", to: "kv-cache", evidence: "x" }] } }, cfg, ladderCfg, dossier, now);
    assert("season re-read: the edge drill is real (contrast probe, both concepts)", bareSr.drills.some(d => d.kind === "season_edge" && d.concepts.includes("context") && d.concepts.includes("kv-cache")));
    const staleSr = compile({ readiness: { verdict: "GREEN" }, season_read: { date: "2026-06-01", confusion_edges: [{ from: "a", to: "b" }] } }, cfg, ladderCfg, dossier, now);
    assert("season re-read: a STALE read (>7d) never steers drills", !staleSr.drills.some(d => d.kind === "season_edge"));
    assert("season re-read: the ≤3 law survives the extra candidate", srDrills.drills.length <= 3);
  }

  // M15 — the council's cross-family split becomes a defend drill; stale never rides
  {
    const cfWorld = { readiness: { verdict: "GREEN" }, council_flag: { date: "2026-07-12", question: "is retrieval quality worth more than model size?", disagreement: 0.91 } };
    const cfDrills = compile(cfWorld, cfg, ladderCfg, dossier, now);
    assert("council split: a FRESH flag compiles as a defend drill", cfDrills.drills.some(d => d.kind === "council_split" && d.mode === "defend" && d.prompt.includes("retrieval quality")));
    const cfStale = compile({ readiness: { verdict: "GREEN" }, council_flag: { date: "2026-07-01", question: "x", disagreement: 0.9 } }, cfg, ladderCfg, dossier, now);
    assert("council split: a STALE flag (>2d) never steers drills", !cfStale.drills.some(d => d.kind === "council_split"));
    // E2E audit (25 Jul 2026, LOW): concepts[] is what scorer.gafferPropose()
    // claims on — a 60-char question sentence there could only ever MISS.
    const cfReg = { concepts: { retrieval: { bucket: "2-rag", aliases: ["retriever"] }, embeddings: { bucket: "1-fundamentals" } }, skills: {} };
    const cfIds = compile({ ...cfWorld, registry: cfReg }, cfg, ladderCfg, dossier, now);
    const cd = cfIds.drills.find(d => d.kind === "council_split");
    assert("council split bets on REGISTRY concept ids, never the raw question text",
      !!cd && cd.concepts.includes("retrieval") && cd.concepts.every(c => c.length <= 40 && !/\s/.test(c)));
    const cfNoReg = compile(cfWorld, cfg, ladderCfg, dossier, now).drills.find(d => d.kind === "council_split");
    assert("an unresolvable council question ships NO concepts, not a sentence", !!cfNoReg && cfNoReg.concepts.length === 0);
  }

  // WAR-ROOM taper + DOSSIER weighting (compressed season)
  const registry = { concepts: { context: { bucket: "2-rag" }, chunking: { bucket: "2-rag" } }, skills: {} };
  const wrWorld = { ...world, registry, scout: { war_room: { active: true, mode: "taper" } } };
  const wr = compile(wrWorld, cfg, ladderCfg, dossier, now);
  assert("war-room: only match-condition drills survive (defend/novel/⚫/rematch)", wr.drills.slice(1).every(d => ["defend", "novel", "negative_space"].includes(d.mode) || d.kind === "tape_room"));
  assert("war-room taper disclosed, voiced as taper never countdown", wr.withheld.some(w => w.includes("sleep is training")) && !JSON.stringify(wr).match(/days (left|remaining)|countdown/i));
  assert("war-room defers to the ladder (AMBER body still wins)", compile({ ...wrWorld, readiness: { verdict: "AMBER" } }, cfg, ladderCfg, dossier, now).drills.slice(1).every(d => d.mode === "recall" || d.kind === "opener"));
  const weighted = compile({ ...world, registry }, cfg, ladderCfg, dossier, now);
  assert("dossier weighting runs without breaking the winnable-first law", weighted.drills[0].winnable === true);

  // ORGANISM audit #32 — the nemesis source string. No assertion in this suite has ever
  // touched `source`, which is exactly how "nemesis headline ×?" reached disk (and then
  // slip.jsonl, as the gaffer's ledger evidence) on every run since 18 Jul.
  {
    const noAxis = { ...world, weaknesses: { ...world.weaknesses, axis_pattern: null } };
    const cands = candidates(noAxis, dossier, now);
    const rej = cands.find(d => d.kind === "rejirah");
    assert("#32 the headline branch reports the REAL recurrence (disk said 'nemesis headline ×?')",
      !!rej && rej.source === "nemesis headline ×3");
    assert("#32 ...and no compiled candidate anywhere still ships a bare '×?'",
      !/×\?/.test(JSON.stringify(cands)) && !/×\?/.test(JSON.stringify(compile(world, cfg, ladderCfg, dossier, now))));
    const axRej = candidates(world, dossier, now).find(d => d.kind === "rejirah");
    assert("#32 the axis_pattern branch is untouched by the fix", axRej.source === "axis_pattern strength 3");
    assert("#32 an unresolvable count says so in words rather than printing a fake number",
      headlineCount({ headline: { id: "x", topic: "x" }, weaknesses: [] }) === "(recurrence not reported by nemesis)"
      && headlineCount({ headline: { id: "x", topic: "x", recurrence: 4 }, weaknesses: [] }) === "×4");
    // and the fixture is pinned to the LIVE producer's SHAPE, so schema drift goes red here
    // first instead of on disk. Values are nemesis's to compute and are not asserted.
    const liveWeak = readJson(join(STATE_DIR, "weaknesses.json"));
    assert("#32 fixture mirrors the live producer: headline carries no `recurrence`, rows do",
      !liveWeak || ((!liveWeak.headline || !("recurrence" in liveWeak.headline))
        && (!Array.isArray(liveWeak.weaknesses) || liveWeak.weaknesses.every(w => Number.isInteger(w.recurrence)))));
  }

  // ORGANISM audit #87 — the packet must aim at the curriculum, not only at decay.
  {
    const reg87 = { concepts: { hallucinations: { bucket: "1-fundamentals", aliases: ["hal"] }, inference: { bucket: "1-fundamentals" }, context: { bucket: "1-fundamentals" } }, skills: {} };
    const sprint = { progress: { current: { id: "1-04", task: "Hallucinations", track: "concept" } } };
    // the live shape on 2-4 Aug: every decay sensor points at `inference` (0 reps ever),
    // the sprint says Hallucinations, and the packet used to contain no hallucinations at all.
    const drift = { readiness: { verdict: "GREEN" }, sprint, registry: reg87,
      cards: { hardest_due: ["inference"] },
      pitch_read: { weak_foot: { streaks: [{ concept: "inference", n: 7 }] } } };
    const aligned = compile(drift, cfg, ladderCfg, dossier, now);
    assert("#87 the sprint's current concept reaches the packet even when every sensor points elsewhere",
      aligned.drills.some(d => d.concepts.includes("hallucinations")) && aligned.sprint_alignment.covered === true && aligned.sprint_alignment.drills_on_current === 1);
    assert("#87 ...and it OUTRANKS the decay sensors rather than being benched",
      aligned.drills[0].concepts.includes("hallucinations"));
    assert("#87 the decay sensors are not silenced — inference still rides", aligned.drills.some(d => d.concepts.includes("inference")));
    const dup = compile({ ...drift, cards: { hardest_due: ["hallucinations"] }, pitch_read: null }, cfg, ladderCfg, dossier, now);
    assert("#87 no double-drilling: a sensor already on the sprint concept means no extra candidate",
      dup.drills.filter(d => d.concepts.includes("hallucinations")).length === 1);
    // THE REGRESSION THE LIVE BUS FOUND (2026-08-04, AMBER evening): the only candidate
    // touching the sprint concept was a `defend`-mode nemesis rejirah, AMBER drops every
    // non-recall mode, and the packet shipped two `inference` recalls and no hallucinations
    // at all. The backstop therefore runs AFTER the ladder, not before it.
    const amberDrift = compile({ ...drift, readiness: { verdict: "AMBER" },
      weaknesses: { headline: { id: "hallucinations", topic: "hallucinations", axis: "a", one_line: "x" },
        axis_pattern: null, weaknesses: [{ id: "hallucinations", topic: "hallucinations", recurrence: 2, status: "open" }] },
    }, cfg, ladderCfg, dossier, now);
    assert("#87 AMBER drops the defend-mode nemesis drill — the sprint concept still reaches the packet",
      amberDrift.sprint_alignment.covered === true && amberDrift.drills.some(d => d.concepts.includes("hallucinations") && d.mode === "recall"));
    assert("#87 ...and the AMBER law still holds (recall-weight only, tier cap respected)",
      amberDrift.drills.length <= 2 && amberDrift.drills.slice(1).every(d => d.mode === "recall"));
    const wrDrift = compile({ ...drift, scout: { war_room: { active: true, mode: "taper" } } }, cfg, ladderCfg, dossier, now);
    assert("#87 the war-room taper is NOT overridden — a benched curriculum is disclosed, not smuggled back",
      wrDrift.sprint_alignment.covered === false && /war-room taper/.test(wrDrift.sprint_alignment.note)
      && !wrDrift.drills.some(d => d.sprint_sourced));
    const skillTask = compile({ ...drift, sprint: { progress: { current: { id: "1-07", task: "Python basics (start)", track: "skill" } } } }, cfg, ladderCfg, dossier, now);
    assert("#87 a task with no registry id is NAMED as unbettable, never forced into a fake concept",
      skillTask.sprint_alignment.concept_id === null && /resolves to no concepts.json id/.test(skillTask.sprint_alignment.note));
    const noSprint = compile({ readiness: { verdict: "GREEN" }, cards: { hardest_due: ["context"] } }, cfg, ladderCfg, dossier, now);
    assert("#87 no sprint.json ⇒ covered is null (unknown), never a measured 'not covered'",
      noSprint.sprint_alignment.covered === null && /without a curriculum anchor/.test(noSprint.sprint_alignment.note));
    assert("#87 a RED packet still carries the same envelope keys (absent ≠ not-today)",
      "sprint_alignment" in compile({ ...drift, readiness: { verdict: "RED" } }, cfg, ladderCfg, dossier, now));
  }

  // ORGANISM audit #72 — concept_graph.json: a nightly Opus pass with zero readers.
  {
    // 11 Aug 2026: the fixture now carries schema_version, because the CONTRACT carries
    // it and a fixture that skips a contract field is how a reader gets away with never
    // checking one. Sourced from cortex's export, never a literal 1 typed in here.
    const graph = { schema_version: CONCEPT_GRAPH_SCHEMA, generated_at: "2026-07-11T03:00:00.000Z", node_count: 3, edge_count: 3,
      edges: [{ from: "tokenization", to: "chunking", kind: "confused-with" },
        { from: "tokenization", to: "context", kind: "prereq" },
        { from: "context", to: "inference", kind: "prereq" }] };
    const gw = { readiness: { verdict: "GREEN" }, concept_graph: graph, cards: { hardest_due: ["inference"] } };
    const g = compile(gw, cfg, ladderCfg, dossier, now);
    const ge = g.drills.find(d => d.kind === "graph_edge");
    assert("#72 concept_graph is READ — a confused-with edge compiles as a real contrast drill",
      !!ge && ge.concepts.includes("tokenization") && ge.concepts.includes("chunking") && ge.prompt.includes("tokenization"));
    assert("#72 the graph's build date is PRINTED, so its age is visible instead of trusted",
      ge.source.includes("2026-07-11") && g.concept_graph_read.built === "2026-07-11" && g.concept_graph_read.nodes === 3 && g.concept_graph_read.edges === 3);
    assert("#72 the graph's second address: prereqs ride on the drill that stands on them",
      g.drills.some(d => d.concepts.includes("inference") && Array.isArray(d.prereqs) && d.prereqs.includes("context")));
    assert("#72 an edge learning_state already knows is not drilled twice",
      !candidates({ ...gw, learning_state: { confusion_pairs: [{ from: "chunking", to: "tokenization", count: 4 }] } }, dossier, now).some(d => d.kind === "graph_edge"));
    const noGraph = compile({ readiness: { verdict: "GREEN" }, cards: { hardest_due: ["inference"] } }, cfg, ladderCfg, dossier, now);
    assert("#72 no graph ⇒ null read-receipt, no graph drill, no prereqs key, no crash",
      noGraph.concept_graph_read === null && !noGraph.drills.some(d => d.kind === "graph_edge") && !noGraph.drills.some(d => "prereqs" in d));

    // ── DEAD-WIRE SWEEP (11 Aug 2026) — cortex.mjs exported graphFreshness and
    // CONCEPT_GRAPH_SCHEMA "so a consumer can assert the contract it relies on", and for a
    // week nothing in the repo imported cortex.mjs. These four assertions are that wire:
    // delete the import and they stop compiling; stop USING the imports and they fail.
    assert("#DEADWIRE the reader gates on cortex's OWN exported schema number, not a literal",
      graphContract(graph, now).usable === true && graphContract(graph, now).expects === CONCEPT_GRAPH_SCHEMA
      && graphContract({ ...graph, schema_version: CONCEPT_GRAPH_SCHEMA + 1 }, now).usable === false);
    const offContract = compile({ ...gw, concept_graph: { ...graph, schema_version: CONCEPT_GRAPH_SCHEMA + 1 } }, cfg, ladderCfg, dossier, now);
    assert("#DEADWIRE an off-contract graph compiles NO drill and NO prereqs — and is NAMED, never silently dropped",
      !offContract.drills.some(d => d.kind === "graph_edge") && !offContract.drills.some(d => "prereqs" in d)
      && offContract.concept_graph_read.usable === false
      && offContract.withheld.some(w => /concept graph withheld/.test(w) && new RegExp(`schema_version ${CONCEPT_GRAPH_SCHEMA + 1}`).test(w)));
    assert("#DEADWIRE an UNSTAMPED graph is refused too — an unlabelled shape is not the contract",
      graphContract({ ...graph, schema_version: undefined }, now).usable === false
      && /no schema_version/.test(graphContract({ ...graph, schema_version: undefined }, now).note));
    // AGE: cortex's graphFreshness is the standard (its cadence, no number invented here),
    // it reaches BOTH the receipt and the captain-facing source line, and it NEVER blocks —
    // the 4 Aug ruling that a prerequisite map is structural knowledge stands.
    const truth = graphFreshness(now, { graph });
    assert("#DEADWIRE the AGE on the packet is cortex's graphFreshness, visible on the sheet, and never withholds",
      truth.age_days !== null && truth.fresh === false
      && g.concept_graph_read.age_days === truth.age_days && g.concept_graph_read.fresh === truth.fresh
      && ge.source.includes(`${truth.age_days} day(s) old`)
      && !g.withheld.some(w => /concept graph withheld/.test(w)));
    assert("#DEADWIRE the RED envelope carries the same contract keys as the normal one (one builder)",
      Object.keys(compile({ ...gw, readiness: { verdict: "RED" } }, cfg, ladderCfg, dossier, now).concept_graph_read).join(",")
        === Object.keys(g.concept_graph_read).join(","));
  }

  // ORGANISM audit #33 — capsule_bridge's two-schedulers report finally has an address.
  {
    const cm = { scheduler_agreement: ["embeddings"],
      scheduler_disagreement: { capsule_says_due_fsrs_quiet: ["tokenization"], fsrs_says_due_capsule_quiet: ["hallucinations"] },
      fsrs_due_names_complete: false, fsrs_due_names_known: 8, fsrs_due_total: 11 };
    const w33 = { readiness: { verdict: "GREEN" }, capsule_map: cm, cards: { hardest_due: ["context"] },
      pitch_read: { weak_foot: { streaks: [{ concept: "embeddings", n: 2 }] } } };
    const r33 = compile(w33, cfg, ladderCfg, dossier, now);
    assert("#33 the two schedulers reach the evening packet the captain actually reads",
      typeof r33.scheduler_note === "string" && /both schedulers say due: embeddings/.test(r33.scheduler_note)
      && /FSRS only: hallucinations/.test(r33.scheduler_note) && /Re-Jirah only: tokenization/.test(r33.scheduler_note));
    assert("#33 a truncated FSRS name list rides through as a have/need counter, never hidden",
      /8\/11/.test(r33.scheduler_note) && /may over-report/.test(r33.scheduler_note));
    assert("#33 agreement between the two schedulers RANKS a candidate up",
      r33.drills[0].concepts.includes("embeddings"));
    assert("#33 no capsule_map ⇒ scheduler_note null, never an invented agreement",
      compile({ readiness: { verdict: "GREEN" }, cards: { hardest_due: ["context"] } }, cfg, ladderCfg, dossier, now).scheduler_note === null);

    // DEAD-WIRE SWEEP (2026-08-10) — THE THIRD FSRS STATE HAD NO ADDRESS.
    // The `cm` above is HAND-MADE, which is the precise thing that let audit #33's
    // original bug live for weeks (capsule_bridge.mjs:349-352 names that lesson in
    // its own words). These fixtures are built by the PRODUCER itself, so a renamed
    // or dropped field on EITHER side of the wire fails here instead of shipping a
    // confidently wrong sentence onto the night's packet.
    const { build: cbBuild, fsrsDueFromCards } = await import("./capsule_bridge.mjs");
    const CB_INTERVALS = [3, 14, 42];                 // capsule_bridge DEFAULT_INTERVALS (FORGE_SPEC §4)
    const CB_TODAY = "2026-07-30";                    // same clock capsule_bridge's own suite uses
    const capFix = { id: "inference", lockedOn: "2026-06-24", status: "tempered", reJirahDone: [],
      faultLines: [{ axis: "a", status: "held", strike: "s" }] };
    const unknown = cbBuild([capFix], CB_INTERVALS, CB_TODAY, fsrsDueFromCards(null));
    assert("#33 UNKNOWN is a real THIRD producer state (null), not the truncated one and not a measured empty",
      unknown.fsrs_due_names_complete === null && typeof unknown.fsrs_due_note === "string"
      && unknown.scheduler_agreement.length === 0
      && unknown.scheduler_disagreement.fsrs_says_due_capsule_quiet.length === 0
      && unknown.scheduler_disagreement.capsule_says_due_fsrs_quiet.join() === "inference");
    const rUnknown = compile({ readiness: { verdict: "GREEN" }, capsule_map: unknown, cards: { hardest_due: ["context"] } }, cfg, ladderCfg, dossier, now);
    assert("#33 an UNREADABLE cards.json is DISCLOSED on the packet — \"Re-Jirah only\" never stands alone as a positive claim about a scheduler nobody opened",
      typeof rUnknown.scheduler_note === "string" && /Re-Jirah only: inference/.test(rUnknown.scheduler_note)
      && rUnknown.scheduler_note.includes(unknown.fsrs_due_note));
    assert("#33 the disclosure is the PRODUCER's own words, verbatim — this file re-words no other organ's state",
      rUnknown.scheduler_note.endsWith(unknown.fsrs_due_note));
    // …and the healthy night is untouched: a COMPLETE read still adds no disclaimer.
    const okMap = cbBuild([capFix], CB_INTERVALS, CB_TODAY, fsrsDueFromCards({ due_today: 0, overdue: 1, hardest_due: ["inference"] }));
    const rOk = compile({ readiness: { verdict: "GREEN" }, capsule_map: okMap, cards: { hardest_due: ["context"] } }, cfg, ladderCfg, dossier, now);
    assert("#33 a COMPLETE FSRS read carries no disclaimer (the healthy packet is unchanged by this wire)",
      okMap.fsrs_due_note === null && !/⚠/.test(rOk.scheduler_note || "")
      && /both schedulers say due: inference/.test(rOk.scheduler_note));

    // DEAD-WIRE SWEEP (2026-08-10) — `scheduler_disagreement_doc` REACHED NO READER.
    // Producer-built again, and shaped like the LIVE map on the day this was wired:
    // the capsule calls one concept due, FSRS calls a different one due, both are right.
    // These go RED if capsule_bridge drops/renames the field OR if schedulerNote stops
    // carrying it — which is precisely how it sat unread since 4 Aug.
    const disMap = cbBuild([capFix], CB_INTERVALS, CB_TODAY,
      fsrsDueFromCards({ due_today: 0, overdue: 1, hardest_due: ["hallucinations"] }));
    const rDis = compile({ readiness: { verdict: "GREEN" }, capsule_map: disMap, cards: { hardest_due: ["context"] } }, cfg, ladderCfg, dossier, now);
    assert("SWEEP a MEASURED disagreement carries the producer's \"EXPECTED, not an error\" caveat onto the packet — the sentence that stops a reader calling this a fault",
      typeof disMap.scheduler_disagreement_doc === "string" && disMap.scheduler_disagreement_doc.length > 0
      && /Re-Jirah only: inference/.test(rDis.scheduler_note) && /FSRS only: hallucinations/.test(rDis.scheduler_note)
      && rDis.scheduler_note.endsWith(disMap.scheduler_disagreement_doc));
    assert("SWEEP no disagreement ⇒ no caveat (it explains a contradiction; with none it is noise)",
      !rOk.scheduler_note.includes(okMap.scheduler_disagreement_doc));
    assert("SWEEP UNKNOWN withholds the caveat — one scheduler nobody opened is not two disagreeing, and the ⚠ that says so stays last",
      !rUnknown.scheduler_note.includes(unknown.scheduler_disagreement_doc)
      && rUnknown.scheduler_note.endsWith(unknown.fsrs_due_note));
    const { scheduler_disagreement_doc: _drop, ...noDoc } = disMap;
    assert("SWEEP an older map with no doc field invents nothing — absence stays absence, and the arms still ride",
      !("scheduler_disagreement_doc" in noDoc)
      && /FSRS only: hallucinations/.test(compile({ readiness: { verdict: "GREEN" }, capsule_map: noDoc, cards: { hardest_due: ["context"] } }, cfg, ladderCfg, dossier, now).scheduler_note)
      && !compile({ readiness: { verdict: "GREEN" }, capsule_map: noDoc, cards: { hardest_due: ["context"] } }, cfg, ladderCfg, dossier, now).scheduler_note.includes("EXPECTED"));
    // …and the LIVE producer contract on disk, exercised for real (capsule_bridge's own
    // suite does the same with cards.json). Shape only — the VALUES are capsule_bridge's
    // to compute and are deliberately not asserted. Unreadable map ⇒ skipped, never faked.
    const liveMap = readJson(join(STATE_DIR, "capsule_map.json"));
    assert("SWEEP the LIVE capsule_map on disk still carries the caveat this wire depends on (skipped if the map is unreadable)",
      !liveMap || (typeof liveMap.scheduler_disagreement_doc === "string" && liveMap.scheduler_disagreement_doc.length > 0));
  }

  // DEAD-WIRE SWEEP (2026-08-10) — THE STRIKE BANK HAD ZERO READERS.
  // 36 verbatim strike questions, rebuilt and re-sorted hardest-first on every
  // capsule_bridge run, read by nobody repo-wide while this file synthesised
  // `<concept> — the core mechanism, cold` for the same concept. These checks go RED the
  // day the bank stops reaching a drill, which is exactly how the wire died unseen before.
  {
    const STRIKE_A = "Embedding exactly kya hai, token ID se kaise alag cheez hai?";
    const bank = {
      strike_bank: [
        { concept: "embeddings", axis: "d", status: "cracked", strike: STRIKE_A, overdue_days: 47 },
        { concept: "embeddings", axis: "a", status: "held", strike: "second one, never served", overdue_days: 47 },
        { concept: "context", axis: "b", status: "held", strike: "context ka apna sawaal?", overdue_days: 40 },
      ],
    };
    const wS = { readiness: { verdict: "GREEN" }, capsule_map: bank, cards: { hardest_due: ["embeddings"] } };
    const rS = compile(wS, cfg, ladderCfg, dossier, now);
    const dS = rS.drills.find(d => d.strike_verbatim);
    assert("SWEEP the strike bank REACHES a drill — a hardest_due recall now carries his own question",
      !!dS && dS.concepts.includes("embeddings") && dS.mode === "recall");
    assert("SWEEP the strike travels VERBATIM inside the dossier's own recall grammar (prose is sacred)",
      dS.prompt.includes(STRIKE_A) && dS.prompt.startsWith("Cold, no notes —") && dS.prompt.endsWith("Bolo."));
    assert("SWEEP the bank's hardest-first order is OBEYED, not re-scored here (axis d, not axis a)",
      dS.strike_axis === "d" && dS.strike_status === "cracked" && !dS.prompt.includes("never served"));
    assert("SWEEP provenance is on the drill's face — which bank, which axis",
      /capsule_map\.strike_bank/.test(dS.source) && /axis-d/.test(dS.source) && /hardest_due\[0\]/.test(dS.source));
    // the second address: the sprint backstop candidate, which had the same synthesised stub
    const scS = sprintCandidate(dossier, { id: "context", code: "1-04", task: "Context windows" }, bank);
    assert("SWEEP the sprint backstop serves the bank too (its stub was the same synthesised line)",
      scS.strike_verbatim === true && scS.prompt.includes("context ka apna sawaal?") && scS.strike_axis === "b");
    assert("SWEEP back-compat — sprintCandidate with the OLD two-arg signature is byte-identical to before",
      sprintCandidate(dossier, { id: "context", code: "1-04", task: "Context windows" }).prompt
        === fill(dossier.probe_types.recall.template, { question: "context — the core mechanism, cold" }));
    // ABSENCE STAYS ABSENCE — three shapes of "no bank", none of which may fabricate one
    const noBank = compile({ readiness: { verdict: "GREEN" }, cards: { hardest_due: ["embeddings"] } }, cfg, ladderCfg, dossier, now);
    assert("SWEEP no capsule_map ⇒ the OLD synthesised question, byte-identical, and no strike_* keys",
      noBank.drills.some(d => d.prompt.includes("embeddings — the core mechanism, cold"))
      && !noBank.drills.some(d => "strike_verbatim" in d || "strike_axis" in d));
    assert("SWEEP a bank with no entry for THIS concept invents nothing (falls back, stays quiet)",
      !compile({ ...wS, capsule_map: { strike_bank: [{ concept: "tokenization", axis: "a", status: "held", strike: "x?" }] } },
        cfg, ladderCfg, dossier, now).drills.some(d => d.strike_verbatim));
    assert("SWEEP a malformed bank (not an array / empty strike) degrades to the stub, never crashes",
      strikeFor("embeddings", { strike_bank: "nope" }) === null
      && strikeFor("embeddings", { strike_bank: [{ concept: "embeddings", axis: "a", strike: "   " }] }) === null
      && strikeFor("embeddings", null) === null);
  }

  // P2 — THE NIGHT COACH (9 Aug 2026): annotation + receipt, never a drill source.
  {
    const nc = { date: "2026-08-10", study_day: "2026-08-09", _resolved_date: "2026-08-10",
      misconceptions: [{ concept: "context", evidence: "x", what_he_thinks: "prompt ek setting hai", whats_true: "prompt sirf text hai jo context window mein baithta hai" }],
      lesson: { concept: "context", samjhao_passes: ["p1"], widget_gates: [], check_question: "?" } };
    const nw = { readiness: { verdict: "GREEN" }, cards: { hardest_due: ["context"] }, night_coach: nc };
    const n1 = compile(nw, cfg, ladderCfg, dossier, now);
    assert("P2 night coach is READ — the receipt carries date/study_day/count",
      n1.night_coach_read && n1.night_coach_read.date === "2026-08-10" && n1.night_coach_read.misconceptions === 1);
    assert("P2 the annotation rides ONLY the drill whose concept the map names, beside the prompt never inside it",
      n1.drills.some(d => d.concepts.includes("context") && /night coach/.test(d.night_note || ""))
      && !n1.drills.some(d => d.night_note && (d.prompt || "").includes(d.night_note)));
    assert("P2 the night file sources NO drill of its own (enrichment license: tune, never load-bear)",
      !n1.drills.some(d => d.kind === "night_coach"));
    const n0 = compile({ readiness: { verdict: "GREEN" }, cards: { hardest_due: ["context"] } }, cfg, ladderCfg, dossier, now);
    assert("P2 no night file ⇒ null receipt, no night_note key anywhere, no crash",
      n0.night_coach_read === null && !n0.drills.some(d => "night_note" in d));
    assert("P2 a RED packet still carries the receipt key (absent ≠ not-today)",
      "night_coach_read" in compile({ ...nw, readiness: { verdict: "RED" } }, cfg, ladderCfg, dossier, now));
    assert("P2 a shapeless night file (no misconceptions[]) is degraded, never trusted",
      nightNoteFor(["context"], { lesson: {} }) === null);
  }

  // THE LAYERING LAW — the frozen dossier-only ranker is still here, and the live ranker
  // reduces to it EXACTLY when none of the new signals are present. This is the guarantee
  // that adding two rank keys changed no existing night's packet.
  {
    const reg = { concepts: { context: { bucket: "2-rag" }, chunking: { bucket: "2-rag" } }, skills: {} };
    const pool0 = candidates({ ...world, registry: reg }, dossier, now);
    const live = rankPool(pool0, { registry: reg }, dossier, { id: null }).map(d => d.kind + "|" + (d.concepts || []).join("+"));
    const legacy = rankByDossierLegacy(pool0, dossier, reg).map(d => d.kind + "|" + (d.concepts || []).join("+"));
    assert("with no sprint and no scheduler agreement the live ranker == the frozen legacy ranker",
      JSON.stringify(live) === JSON.stringify(legacy) && live.length === pool0.length);
  }

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
  const ladderCfg = readJson(join(STATE_DIR, "ladder_config.json"));
  const dossier = readJson(join(STATE_DIR, "dossier_weights.json"));
  // E2E audit (25 Jul 2026): readJson() can't tell "absent" from "trailing comma",
  // and a silent null used to mean empty prompts. compile() floors the grammar —
  // this is the console half, so the night's log names the broken file.
  if (!dossier) console.warn("setpiece: WARN dossier_weights.json missing or MALFORMED → probe grammar on the embedded floor, dossier weighting off. Fix the file (canon: learning-layer/OPPONENT_SCOUT.md).");
  const world = {
    readiness: readJson(join(STATE_DIR, "readiness.json")),
    tape_room: readJson(join(STATE_DIR, "tape_room.json")),
    learning_state: readJson(join(STATE_DIR, "learning_state.json")),
    calibration: readJson(join(STATE_DIR, "calibration.json")),
    weaknesses: readJson(join(STATE_DIR, "weaknesses.json")),
    pitch_read: readJson(join(STATE_DIR, "pitch_read.json")),
    cards: readJson(join(STATE_DIR, "cards.json")),
    scout: readJson(join(STATE_DIR, "scout.json")),
    registry: readJson(join(STATE_DIR, "concepts.json")),
    season_read: readJson(join(STATE_DIR, "season_read.json")),   // M18 — the night's re-read
    council_flag: readJson(join(STATE_DIR, "council_flag.json")), // M15 — cross-family split
    sprint: readJson(join(STATE_DIR, "sprint.json")),             // audit #87 — the curriculum
    concept_graph: readJson(join(STATE_DIR, "concept_graph.json")), // audit #72 — its only reader
    capsule_map: readJson(join(STATE_DIR, "capsule_map.json")),   // audit #33 — the two schedulers
    // KAAM 2 (10 Aug 2026) — THE REST ROOM FINALLY HAS AN ADDRESS. It dreamed
    // every night since 6 Aug and its best verified drill reached nobody: the
    // precache is INERT by design (it waits on the earned-voice gate, which is
    // at 2 of the 10 shadows it needs and only moves on a "spinning" verdict —
    // weeks away at best). The drill sheet is a surface that already exists, is
    // already ranked, and he already reads. No privilege and no new number: the
    // dream enters as one more candidate and wins or loses on the ordering keys
    // that were already there.
    dmn_precache: readJson(join(STATE_DIR, "dmn_precache.json")),
    night_coach: readNightCoach(new Date()),                      // P2 — the overnight misconception map
    // dead-wire sweep (11 Aug 2026) — the graded mock's own lane. Same shape of
    // repair as dmn_precache one line up: a producer that had been filing a
    // verdict + tomorrow's drill for weeks with no consumer anywhere in the repo.
    scrimmage_rows: readLines(join(STATE_DIR, "dugout_scrimmage.jsonl")),
  };
  // audit #72/#87/#33 — a missing input is NAMED, never silently treated as "no signal".
  // These three are new readers; if any is dark the packet still compiles, but the night's
  // log says which sense was closed rather than letting a quiet default look like a reading.
  for (const [name, val] of [["sprint.json", world.sprint], ["concept_graph.json", world.concept_graph], ["capsule_map.json", world.capsule_map], ["brain_out/night_coach/<date>.json", world.night_coach]]) {
    if (!val) console.warn(`setpiece: WARN ${name} missing or MALFORMED → compiled without it (this is blindness, not an absence of signal).`);
  }
  const out = compile(world, cfg, ladderCfg, dossier, new Date());
  writeAtomic(OUT, out);
  console.log(`setpiece: ${out.drills.length} drill(s) for ${out.for} [${out.drills.map(d => d.kind).join(", ") || "none"}] · ladder ${out.ladder_verdict} → ${OUT}`);
  const sa = out.sprint_alignment || {};
  console.log(`  sprint ${sa.current_code || "-"} ${sa.current_task || "(none)"} → ${sa.covered === null ? "unresolvable" : sa.covered ? `covered by ${sa.drills_on_current} drill(s)` : "NOT COVERED"}${sa.note ? " · " + sa.note : ""}`);
  if (out.scheduler_note) console.log(`  schedulers: ${out.scheduler_note}`);
  // dead-wire sweep 11 Aug 2026 — the night's log states the map's contract + age, so a
  // packet compiled off a two-day-old graph is a visible fact in scripts' output rather
  // than something only a JSON read would reveal. Never a reason to fail the run.
  const cgr = out.concept_graph_read;
  if (cgr) console.log(`  concept graph: ${cgr.nodes} nodes / ${cgr.edges} edges · built ${cgr.built}${cgr.age_days === null ? "" : ` (${cgr.age_days}d old${cgr.fresh ? ", today's" : ""})`} · schema ${cgr.schema_version} vs reader ${cgr.expects}${cgr.usable ? "" : ` → NOT USED: ${cgr.contract_note}`}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { compile, candidates, winnableOpener, loadConfig,
  // audit #32/#33/#72/#87 (2026-08-04): the headline-count reader, the sprint anchor, the
  // graph readers, the scheduler note, and both rankers (legacy frozen beside the live one).
  headlineCount, sprintFocus, sprintCandidate, prereqsOf, schedulerNote, rankPool, rankByDossierLegacy, dossierWeightOf,
  // dead-wire sweep (2026-08-10): capsule_bridge's strike_bank finally has a reader.
  strikeFor, recallQuestion };
