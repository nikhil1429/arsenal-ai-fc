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
//   ladder_config.json · dossier_weights.json · setpiece_config.json (canon)
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
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };

const fill = (template, slots) => String(template || "").replace(/\{(\w+)\}/g, (_, k) => (slots[k] !== undefined ? slots[k] : `{${k}}`));

// ---------------------------------------------------------------------------
// pure core
// ---------------------------------------------------------------------------
// candidate sources, in priority order; each returns a drill or null.
function candidates(world, dossier) {
  const probes = (dossier && dossier.probe_types) || {};
  const out = [];

  // TAPE-ROOM rematch — past-self as opponent, the cheapest build in the vision
  const q = world.tape_room && Array.isArray(world.tape_room.queue) ? world.tape_room.queue.filter(x => x.eligible) : [];
  if (q.length) {
    const d = q[0];
    const weeks = d.locked_on ? Math.max(1, Math.round((Date.now() - new Date(d.locked_on)) / (7 * 86400000))) : 2;
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

  // NEMESIS — the KIND of thinking (axis pattern first, else headline)
  const wk = world.weaknesses;
  if (wk && (wk.axis_pattern || wk.headline)) {
    const ax = wk.axis_pattern;
    const topic = ax ? `${ax.concepts.join(" · ")} (axis ${ax.axis})` : wk.headline.topic;
    out.push({
      kind: "rejirah", probe_type_emoji: (probes.defend && probes.defend.emoji) || "🟣", concepts: ax ? ax.concepts : [wk.headline.topic],
      prompt: fill(probes.defend && probes.defend.template, { claim: `your read of ${topic}` }),
      source: ax ? `axis_pattern strength ${ax.strength}` : `nemesis headline ×${wk.headline.recurrence || "?"}`,
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
  const verdict = (world.readiness && typeof world.readiness.verdict === "string") ? world.readiness.verdict.toUpperCase() : "GREEN";
  const tier = (ladderCfg && ladderCfg[verdict]) || (ladderCfg && ladderCfg.GREEN) || { drill_modes_allowed: ["recall", "reconstruct", "defend", "novel", "negative_space"], max_drills: 3 };
  const withheld = [];

  // RED: exactly one five-minute floor-touch. Nothing else. Mercy, disclosed.
  if (verdict === "RED") {
    withheld.push("full drill packet withheld (ladder RED — rest is the work today)");
    withheld.push("nemesis-sourced content withheld (RED mercy, disclosed here)");
    return {
      date: tomorrowStr(now), for: tomorrowStr(now), status: "ok", low_confidence: false,
      generated_at: now.toISOString(), ladder_verdict: verdict,
      drills: [{
        kind: "floor_touch", probe_type_emoji: "🛟", concepts: [],
        prompt: `One ${cfg.floor_touch_minutes}-minute touch: open the field, one green concept, one sentence out loud. That is a won day.`,
        source: "ladder RED", winnable: true, mode: "floor_touch",
      }],
      withheld, bench_note: null,
    };
  }

  let pool = candidates(world, dossier);

  // DOSSIER-WEIGHTED SELECTION (compressed season): a drill whose concepts sit
  // on heavier interview rounds outranks equal candidates. Weights from
  // dossier_weights.json via concepts.json buckets — measured ground, not vibes.
  if (dossier && dossier.rounds && world.registry) {
    const roundW = Object.fromEntries(dossier.rounds.map(r => [r.id, r.weight]));
    const weightOf = (concept) => {
      const c = world.registry.concepts && world.registry.concepts[concept];
      const buckets = c && c.bucket ? [c.bucket] : (world.registry.skills && world.registry.skills[concept] ? ["skills"] : []);
      return buckets.flatMap(b => (dossier.bucket_round_map && dossier.bucket_round_map[b]) || [])
        .reduce((a, r) => a + (roundW[r] || 0), 0);
    };
    pool = pool.map((d, i) => ({ d, i, w: Math.max(0, ...(d.concepts || []).map(weightOf)) }))
      .sort((a, b) => b.w - a.w || a.i - b.i)      // weight first, stable on ties
      .map(x => x.d);
  }

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

  return {
    date: tomorrowStr(now), for: tomorrowStr(now), status: drills.length ? "ok" : "awaiting_data",
    low_confidence: false, generated_at: now.toISOString(), ladder_verdict: verdict,
    drills: drills.slice(0, maxN),
    withheld,
    bench_note: trimmed > 0 ? `${trimmed} more compiled and benched — doable by doing these first` : null,
  };
}

// ---------------------------------------------------------------------------
// selftest — fixture world
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = loadConfig("__no_such__");
  const ladderCfg = JSON.parse(readFileSync(join(STATE_DIR, "ladder_config.json"), "utf8"));
  const dossier = JSON.parse(readFileSync(join(STATE_DIR, "dossier_weights.json"), "utf8"));
  const now = new Date(2026, 6, 12, 21, 40, 0);

  const world = {
    readiness: { verdict: "GREEN" },
    tape_room: { queue: [{ capsule: "embeddings", doubt_index: 3, q_verbatim: "maine socha KV cache layers share karta hai", locked_on: "2026-06-21", eligible: true }] },
    learning_state: {
      confusion_pairs: [{ from: "tokenization", to: "embeddings", count: 4 }],
      concepts: [{ id: "inference", fluency: "🟢 fluent" }, { id: "chunking", fluency: "🔴 learning" }],
    },
    calibration: { danger_zone: [{ topic: "context", confidence: "high", accuracy: "low", axis: "e" }] },
    weaknesses: { headline: { topic: "chunking", recurrence: 3 }, axis_pattern: { axis: "e", concepts: ["tokenization", "chunking", "retrieval"], strength: 3 }, weaknesses: [{ topic: "rlhf", status: "closed" }] },
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

  // WAR-ROOM taper + DOSSIER weighting (compressed season)
  const registry = { concepts: { context: { bucket: "2-rag" }, chunking: { bucket: "2-rag" } }, skills: {} };
  const wrWorld = { ...world, registry, scout: { war_room: { active: true, mode: "taper" } } };
  const wr = compile(wrWorld, cfg, ladderCfg, dossier, now);
  assert("war-room: only match-condition drills survive (defend/novel/⚫/rematch)", wr.drills.slice(1).every(d => ["defend", "novel", "negative_space"].includes(d.mode) || d.kind === "tape_room"));
  assert("war-room taper disclosed, voiced as taper never countdown", wr.withheld.some(w => w.includes("sleep is training")) && !JSON.stringify(wr).match(/days (left|remaining)|countdown/i));
  assert("war-room defers to the ladder (AMBER body still wins)", compile({ ...wrWorld, readiness: { verdict: "AMBER" } }, cfg, ladderCfg, dossier, now).drills.slice(1).every(d => d.mode === "recall" || d.kind === "opener"));
  const weighted = compile({ ...world, registry }, cfg, ladderCfg, dossier, now);
  assert("dossier weighting runs without breaking the winnable-first law", weighted.drills[0].winnable === true);

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
  };
  const out = compile(world, cfg, ladderCfg, dossier, new Date());
  writeAtomic(OUT, out);
  console.log(`setpiece: ${out.drills.length} drill(s) for ${out.for} [${out.drills.map(d => d.kind).join(", ") || "none"}] · ladder ${out.ladder_verdict} → ${OUT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { compile, candidates, winnableOpener, loadConfig };
