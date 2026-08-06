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
//   capsule_map.json (audit #33 — where FSRS and FORGE's Re-Jirah agree/disagree)
// OUTPUT: dressing-room/state/drills.json (sole writer)
// MODES:  run (default: compile for tomorrow) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  rematch_template: "Week-{week} Nikhil argued: \"{doubt_verbatim}\" — he's across the table. Dismantle him. Bolo.",
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

const fill = (template, slots) => String(template || "").replace(/\{(\w+)\}/g, (_, k) => (slots[k] !== undefined ? slots[k] : `{${k}}`));

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
  return parts.length ? parts.join(" · ") : null;
}

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
      prompt: fill(dossier && dossier.rematch_template, { week: weeks, doubt_verbatim: d.q_verbatim }),
      source: `archived doubt #${d.doubt_index} on ${d.capsule} (locked ${d.locked_on || "?"})`,
      winnable: false, mode: "defend",
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
  const cgEdges = cg && Array.isArray(cg.edges) ? cg.edges : [];
  if (cgEdges.length) {
    const covered = new Set([
      ...pairs.map(p => pairKey(p.from, p.to)),
      ...srEdges.map(e => pairKey(e.from, e.to)),
    ]);
    const e = cgEdges.find(x => x && x.kind === "confused-with" && x.from && x.to && !covered.has(pairKey(x.from, x.to)));
    if (e) {
      const built = String(cg.generated_at || "").slice(0, 10) || "date unknown";
      out.push({
        kind: "graph_edge", probe_type_emoji: "🟡", concepts: [e.from, e.to],
        prompt: fill(dossier && dossier.contrast_template, { a: e.from, b: e.to, differentiator: "which one an interviewer means" }),
        source: `concept graph (${cgEdges.length} edges, built ${built}): ${e.from} ↔ ${e.to} marked confused-with`,
        winnable: false, mode: "reconstruct",
      });
    }
  }

  // DANGER-ZONE — knew-but-wrong → reconstruct probe on that exact topic+axis
  const dz = world.calibration && Array.isArray(world.calibration.danger_zone) ? world.calibration.danger_zone : [];
  if (dz.length) {
    const d = dz[0];
    out.push({
      kind: "reconstruct", probe_type_emoji: (probes.reconstruct && probes.reconstruct.emoji) || "🟡", concepts: [d.topic],
      prompt: fill(probes.reconstruct && probes.reconstruct.template, { question: `${d.topic}${d.axis ? " (axis " + d.axis + ")" : ""} — the one you were sure about` }),
      source: `danger_zone: knew-wrong on ${d.topic}`,
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
    out.push({
      kind: "recall", probe_type_emoji: (probes.recall && probes.recall.emoji) || "🔵", concepts: [due[0]],
      prompt: fill(probes.recall && probes.recall.template, { question: `${due[0]} — the core mechanism, cold` }),
      source: `hardest_due[0]`,
      winnable: false, mode: "recall",
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
function sprintCandidate(dossier, focus) {
  if (!focus || !focus.id) return null;
  const probes = (dossier && dossier.probe_types) || {};
  return {
    kind: "recall", probe_type_emoji: (probes.recall && probes.recall.emoji) || "🔵", concepts: [focus.id],
    prompt: fill(probes.recall && probes.recall.template, { question: `${focus.id} — the core mechanism, cold` }),
    source: `sprint current task${focus.code ? " " + focus.code : ""}: ${focus.task}`,
    winnable: false, mode: "recall", sprint_sourced: true,
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
      concept_graph_read: world.concept_graph
        ? { nodes: world.concept_graph.node_count ?? null, edges: world.concept_graph.edge_count ?? null, built: String(world.concept_graph.generated_at || "").slice(0, 10) || null }
        : null,
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
    const sc = sprintCandidate(dossier, focus);
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
    const pre = prereqsOf(d.concepts, world.concept_graph);
    return pre.length ? { ...withModality, prereqs: pre } : withModality;
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
    concept_graph_read: world.concept_graph
      ? { nodes: world.concept_graph.node_count ?? null, edges: world.concept_graph.edge_count ?? null, built: String(world.concept_graph.generated_at || "").slice(0, 10) || null }
      : null,
  };
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
    rematch_template: "Week-{week} Nikhil argued: \"{doubt_verbatim}\" — he's across the table. Dismantle him. Bolo.",
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
    const graph = { generated_at: "2026-07-11T03:00:00.000Z", node_count: 3, edge_count: 3,
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
  };
  // audit #72/#87/#33 — a missing input is NAMED, never silently treated as "no signal".
  // These three are new readers; if any is dark the packet still compiles, but the night's
  // log says which sense was closed rather than letting a quiet default look like a reading.
  for (const [name, val] of [["sprint.json", world.sprint], ["concept_graph.json", world.concept_graph], ["capsule_map.json", world.capsule_map]]) {
    if (!val) console.warn(`setpiece: WARN ${name} missing or MALFORMED → compiled without it (this is blindness, not an absence of signal).`);
  }
  const out = compile(world, cfg, ladderCfg, dossier, new Date());
  writeAtomic(OUT, out);
  console.log(`setpiece: ${out.drills.length} drill(s) for ${out.for} [${out.drills.map(d => d.kind).join(", ") || "none"}] · ladder ${out.ladder_verdict} → ${OUT}`);
  const sa = out.sprint_alignment || {};
  console.log(`  sprint ${sa.current_code || "-"} ${sa.current_task || "(none)"} → ${sa.covered === null ? "unresolvable" : sa.covered ? `covered by ${sa.drills_on_current} drill(s)` : "NOT COVERED"}${sa.note ? " · " + sa.note : ""}`);
  if (out.scheduler_note) console.log(`  schedulers: ${out.scheduler_note}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { compile, candidates, winnableOpener, loadConfig,
  // audit #32/#33/#72/#87 (2026-08-04): the headline-count reader, the sprint anchor, the
  // graph readers, the scheduler note, and both rankers (legacy frozen beside the live one).
  headlineCount, sprintFocus, sprintCandidate, prereqsOf, schedulerNote, rankPool, rankByDossierLegacy, dossierWeightOf };
