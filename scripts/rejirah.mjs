#!/usr/bin/env node
// ============================================================================
// rejirah.mjs · ARSENAL AI FC — THE RE-JIRAH CONTROLLER (v0, audit #107)
// ----------------------------------------------------------------------------
// WHAT WAS BROKEN. `deep.mjs due` opened the Re-Jirah queue perfectly and nothing
// could ever close it. Measured 5 Aug 2026: four locked capsules, 36/36 axes carrying
// 80,511 characters of his own defended prose, and THREE of the four with
// `reJirahDone: []` — never re-tempered once, 34-42 days overdue. A cold round could
// be run but its RESULT had nowhere to land, so the loop had no back edge.
//
// WHY NOT WRITE INTO THE CAPSULE. FORGE_SPEC reserves per-axis `axisType` / `nextDue`
// / `lastResult` / `calibrationGap` / `fluencyState` and capsule-level `edgeMap` /
// `confusionPairs`, and planned to POPULATE them on the first R1 run. That plan means
// editing 36 immutable capsules whose prose is sacred — the exact corruption risk the
// immutability law exists to prevent, taken 36 times. So (captain's ruling D3, 5 Aug
// 2026) THE CAPSULE IS NEVER TOUCHED: results go to an append-only log beside it, and
// every reserved field becomes DERIVED. Recompute is lossless, the sacred prose is
// unreachable from here, and a wrong constant costs a re-run rather than a rewrite.
//
// THE ARBITER (captain's ruling D4). Two schedulers used to emit dates and
// capsule_bridge could only report the disagreement. They were answering different
// questions:
//     FSRS (cards.json)  = WHEN a concept comes back.        <- scheduler of record
//     THIS FILE          = WHICH AXES, and HOW HARD.         <- never emits a concept date
// So there is no conflict left to resolve, only a division of labour to honour.
//
// LAWS: single writer of rejirah_log.jsonl · reads capsules READ-ONLY · no LLM ·
//   every threshold below is a v0 HYPOTHESIS and is either taken from an organ that
//   already owns it or derived from canon in the comment beside it — none is invented.
// CLI: grade <concept> <axis> held|cracked [--gut w] [--cold false] | state [concept]
//    | due | selftest
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE = join(HERE, "..", "dressing-room", "state");
const CAPSULES = join(STATE, "capsules");
const LOG = join(STATE, "rejirah_log.jsonl");
const PROFILE = join(STATE, "forge_profile.json");
const CARDS = join(STATE, "cards.json");

const AXES = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
const RESULTS = ["held", "cracked"];
const GUTS = ["knew", "shaky", "guessed"];

// AXIS-TYPING (controller-v0 knob 2). NOT invented: each type is read straight off
// that axis's own definition in PROJECT_OS §THE 9 AXES. "kya hai" is a cold fact →
// recall. "kyun / reinvent the need from scratch", "mechanism", "math + RANGE" are all
// derive-live → reconstruct. "tradeoffs X-vs-Y", "one DEFENDABLE decision" and
// "explain 3 ways to a skeptical senior" are judgment under pressure → defend.
export const AXIS_TYPE = {
  a: "recall", b: "reconstruct", c: "reconstruct", d: "reconstruct",
  e: "recall", f: "defend", g: "defend", h: "recall", i: "defend",
};

// ROUND-MODE ESCALATION (knob 4) — the three modes canon already names.
const ROUND_MODE = ["R-early (gentle cold)", "R-mid (adversarial + traps + counterfactual)", "R-late (timed mini-mock, axes mixed, cross-concept)"];

// CALIBRATION TARGETS — borrowed verbatim from calibration.mjs, which owns them.
// Duplicating a number is how two organs drift; naming its owner is how they don't.
const GUT_TARGET = { knew: 0.95, shaky: 0.65, guessed: 0.30 };

// FLUENCY LADDER — the same rule learning_state.mjs applies to reps: 2 consecutive
// clean → held, 3 → fluent. Latency is not observable on a spoken cold round, so the
// 🟢 rung here is CONSECUTIVE-CLEAN only and says so; it never claims speed it did not
// measure.
const HELD_AT = 2, FLUENT_AT = 3;

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const nowIso = (d = new Date()) => d.toISOString();

export function readLog(path = LOG) {
  const out = [];
  try {
    if (!existsSync(path)) return out;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const s = line.trim(); if (!s) continue;
      try { const j = JSON.parse(s); if (j && j.concept && j.axis) out.push(j); } catch {}
    }
  } catch {}
  return out;
}

export function loadCapsules(dir = CAPSULES) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json"))
    .map((f) => readJson(join(dir, f))).filter((c) => c && c.id)
    .sort((a, b) => String(a.num || "").localeCompare(String(b.num || "")));
}

// ── THE WRITE PATH ───────────────────────────────────────────────────────────
// VALIDATED BEFORE IT IS WRITTEN, in capture.mjs's spirit: a malformed row is
// refused loudly rather than appended and discovered months later. `cold` defaults
// true because controller-v0 knob 1 is ALWAYS-COLD — a warm round is the exception
// and must be declared, never assumed.
export function buildRow(input = {}, deps = {}) {
  const concept = String(input.concept || "").toLowerCase().trim();
  const axis = String(input.axis || "").toLowerCase().trim();
  const result = String(input.result || "").toLowerCase().trim();
  const gut = input.gut === undefined || input.gut === null ? null : String(input.gut).toLowerCase().trim();
  if (!concept) return { ok: false, why: "concept is required" };
  if (!AXES.includes(axis)) return { ok: false, why: `axis must be a single letter a-i (got "${input.axis}")` };
  if (!RESULTS.includes(result)) return { ok: false, why: `result must be held|cracked (got "${input.result}")` };
  if (gut !== null && !GUTS.includes(gut)) return { ok: false, why: `gut must be knew|shaky|guessed (got "${input.gut}")` };
  const known = deps.capsuleIds || loadCapsules().map((c) => c.id);
  const row = {
    ts: nowIso(deps.now ? new Date(deps.now) : new Date()),
    concept, axis, result,
    gut,                                   // null = no gut-word was committed. NEVER inferred from the result:
    cold: input.cold === false ? false : true,   // deriving it would force gut==result and kill the overconfidence signal.
    round: Number.isInteger(input.round) ? input.round : null,
    source: input.source || "deep",
  };
  return { ok: true, row, unregistered: !known.includes(concept) };
}

export function append(row, path = LOG) {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(row) + "\n");
  return true;
}

// ── THE DERIVED STATE (the reserved fields, computed not stored) ─────────────
// PER-AXIS ADAPTIVE INTERVAL (knob 3, SM-2-lite): a clean hold EXPANDS to the next
// interval in the profile's ladder; a crack RESETS to the first. Global +3d/+2wk/+6wk
// is replaced per axis, which is the whole point of the knob. With no history at all
// the axis inherits the capsule's own lockedOn schedule, so a never-graded axis is
// never silently treated as fresh.
export function axisState(capsule, axis, rows, intervals, now = new Date()) {
  const hist = rows.filter((r) => r.concept === capsule.id && r.axis === axis)
    .sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  const last = hist.length ? hist[hist.length - 1] : null;

  let streak = 0;
  for (let i = hist.length - 1; i >= 0; i--) { if (hist[i].result === "held") streak++; else break; }
  const fluencyState = streak >= FLUENT_AT ? "🟢 fluent (consecutive-clean only — speed not measured here)"
    : streak >= HELD_AT ? "🟡 held" : "🔴 learning";

  // CALIBRATION-GAP as a control signal (controller-v0 mechanic 2): confident AND
  // cracked is the dangerous illusion, so it tightens the interval and bumps the mode.
  let calibrationGap = null;
  if (last && last.gut) {
    const gap = +(GUT_TARGET[last.gut] - (last.result === "held" ? 1 : 0)).toFixed(2);
    calibrationGap = { gut: last.gut, result: last.result, gap,
      flag: last.gut === "knew" && last.result === "cracked" ? "OVERCONFIDENT — tighten + bump mode"
        : last.gut === "guessed" && last.result === "held" ? "underconfident — he knows more than he claims"
        : "aligned" };
  }

  // The rung is the CONSECUTIVE-hold streak, not the lifetime hold count: an axis that
  // held twice, cracked, then held once is on rung 1 — the crack really did cost the
  // ground it had gained, which is the point of a reset.
  const idx = Math.min(Math.max(0, streak - 1), intervals.length - 1);
  const anchor = last ? new Date(last.ts) : new Date(String(capsule.lockedOn || "") + "T00:00:00Z");
  let nextDue = null, overdueDays = null;
  if (!Number.isNaN(anchor.getTime())) {
    const step = (last && last.result === "cracked") ? intervals[0] : intervals[idx];
    const d = new Date(anchor.getTime() + step * 86400000);
    nextDue = d.toISOString().slice(0, 10);
    overdueDays = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000));
  }
  const roundsDone = hist.length;
  return {
    axis,
    axisType: AXIS_TYPE[axis],
    rounds: roundsDone,
    lastResult: last ? last.result : null,
    lastAt: last ? last.ts : null,
    streak,
    fluencyState,
    calibrationGap,
    nextDue,
    overdueDays,
    mode: ROUND_MODE[Math.min(roundsDone, ROUND_MODE.length - 1)],
    // A confident crack is the one case canon says to escalate immediately.
    escalate: !!(calibrationGap && calibrationGap.flag.startsWith("OVERCONFIDENT")),
  };
}

export function conceptState(capsule, rows, intervals, now = new Date()) {
  const axes = AXES.map((a) => axisState(capsule, a, rows, intervals, now));
  // EDGE-MAP — the honest knowledge boundary, DERIVED: an axis he has held cold is one
  // he can defend; one never graded is not a weakness, it is simply unmeasured, and
  // saying so is the difference between an edge-map and a shame-list.
  const edgeMap = {
    can_defend: axes.filter((x) => x.lastResult === "held").map((x) => x.axis),
    cracked: axes.filter((x) => x.lastResult === "cracked").map((x) => x.axis),
    unmeasured: axes.filter((x) => x.rounds === 0).map((x) => x.axis),
  };
  // CONFUSION-PAIRS stay null until there is real cross-concept error data. Bias to
  // silence: one false alarm is worse than one missed alarm (the repo's own rule).
  const cracked = rows.filter((r) => r.result === "cracked");
  const distinct = new Set(cracked.map((r) => r.concept));
  const confusionPairs = (cracked.length >= 6 && distinct.size >= 2)
    ? [...distinct].slice(0, 4).map((c) => ({ with: c, seen: cracked.filter((r) => r.concept === c).length }))
    : null;
  return {
    concept: capsule.id, lockedOn: capsule.lockedOn || null, axes, edgeMap, confusionPairs,
    confusion_gate: confusionPairs ? null : `needs >=6 cracked rows across >=2 concepts (have ${cracked.length} / ${distinct.size})`,
  };
}

// ── THE ARBITER (D4) ─────────────────────────────────────────────────────────
// FSRS says WHEN. This says WHICH AXES and HOW HARD. It reads cards.json but never
// writes a concept-level date of its own, so the two worlds can no longer disagree —
// they answer different questions by construction.
export function dueReport(caps, rows, intervals, cards, now = new Date()) {
  const byConcept = new Map();
  const hardest = (cards && Array.isArray(cards.hardest_due)) ? cards.hardest_due : [];
  for (const c of caps) {
    const st = conceptState(c, rows, intervals, now);
    const axes = st.axes.filter((a) => a.overdueDays !== null && a.overdueDays > 0)
      .sort((a, b) => (b.escalate - a.escalate) || (b.overdueDays - a.overdueDays));
    if (axes.length) byConcept.set(c.id, { concept: c.id, axes, fsrs_rank: hardest.indexOf(c.id) });
  }
  // Order by FSRS's opinion when it has one (it owns WHEN), else by depth of overdue.
  return [...byConcept.values()].sort((a, b) => {
    const ar = a.fsrs_rank < 0 ? 99 : a.fsrs_rank, br = b.fsrs_rank < 0 ? 99 : b.fsrs_rank;
    return ar - br || (b.axes[0].overdueDays - a.axes[0].overdueDays);
  });
}

function intervalsOf() {
  const p = readJson(PROFILE) || {};
  return Array.isArray(p.rejirah_intervals_days) && p.rejirah_intervals_days.length
    ? p.rejirah_intervals_days : [3, 14, 42];
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}`); } };
  const IV = [3, 14, 42];
  const NOW = new Date("2026-08-05T12:00:00Z");
  const cap = { id: "embeddings", lockedOn: "2026-06-21" };
  const row = (axis, result, gut, ts) => ({ concept: "embeddings", axis, result, gut, cold: true, ts });

  assert("VALIDATION — a good row is built and stamped",
    buildRow({ concept: "embeddings", axis: "a", result: "held", gut: "shaky" }, { capsuleIds: ["embeddings"] }).ok);
  assert("VALIDATION — axis must be ONE letter a-i; the literal 'a-i' is refused (capture.mjs's own scar)",
    !buildRow({ concept: "e", axis: "a-i", result: "held" }).ok && !buildRow({ concept: "e", axis: "z", result: "held" }).ok);
  assert("VALIDATION — result must be held|cracked, gut must be a real gut-word",
    !buildRow({ concept: "e", axis: "a", result: "ok" }).ok
    && !buildRow({ concept: "e", axis: "a", result: "held", gut: "fine" }).ok);
  assert("ALWAYS-COLD is the DEFAULT (knob 1) and a warm round must be declared",
    buildRow({ concept: "e", axis: "a", result: "held" }).row.cold === true
    && buildRow({ concept: "e", axis: "a", result: "held", cold: false }).row.cold === false);
  assert("GUT IS NEVER INFERRED — no gut-word stays null, it is not back-filled from the result",
    buildRow({ concept: "e", axis: "a", result: "held" }).row.gut === null);
  assert("UNREGISTERED IS FLAGGED, never silently accepted",
    buildRow({ concept: "ghost", axis: "a", result: "held" }, { capsuleIds: ["embeddings"] }).unregistered === true);

  const clean2 = [row("a", "held", "shaky", "2026-07-01T00:00:00Z"), row("a", "held", "knew", "2026-07-20T00:00:00Z")];
  const s2 = axisState(cap, "a", clean2, IV, NOW);
  assert("LADDER — two consecutive holds reach 🟡, three reach 🟢",
    s2.fluencyState.startsWith("🟡")
    && axisState(cap, "a", [...clean2, row("a", "held", "knew", "2026-07-30T00:00:00Z")], IV, NOW).fluencyState.startsWith("🟢"));
  assert("LADDER — a crack breaks the streak back to 🔴",
    axisState(cap, "a", [...clean2, row("a", "cracked", "knew", "2026-08-01T00:00:00Z")], IV, NOW).fluencyState.startsWith("🔴"));
  assert("KNOB 3 — a clean hold EXPANDS the interval, a crack RESETS it to the first rung",
    (() => {
      const held = axisState(cap, "a", clean2, IV, NOW).nextDue;
      const crk = axisState(cap, "a", [...clean2, row("a", "cracked", "shaky", "2026-08-01T00:00:00Z")], IV, NOW).nextDue;
      return held === "2026-08-03" && crk === "2026-08-04";   // 20 Jul +14 vs 1 Aug +3
    })());
  assert("KNOB 2 — axis typing comes off the axis definitions (d reconstructs, f defends, a recalls)",
    AXIS_TYPE.d === "reconstruct" && AXIS_TYPE.f === "defend" && AXIS_TYPE.a === "recall");
  assert("MECHANIC 2 — confident-and-cracked is flagged OVERCONFIDENT and escalates",
    (() => { const s = axisState(cap, "a", [row("a", "cracked", "knew", "2026-08-01T00:00:00Z")], IV, NOW);
      return s.calibrationGap.flag.startsWith("OVERCONFIDENT") && s.escalate === true; })());
  assert("MECHANIC 2 — guessed-and-held reads as UNDER-confident, not as a win to inflate",
    axisState(cap, "a", [row("a", "held", "guessed", "2026-08-01T00:00:00Z")], IV, NOW).calibrationGap.flag.startsWith("underconfident"));
  assert("NO GUT-WORD -> NO GAP (never fabricated)",
    axisState(cap, "a", [row("a", "held", null, "2026-08-01T00:00:00Z")], IV, NOW).calibrationGap === null);
  assert("KNOB 4 — the round mode escalates R-early -> R-mid -> R-late with rounds done",
    axisState(cap, "a", [], IV, NOW).mode.startsWith("R-early")
    && axisState(cap, "a", clean2, IV, NOW).mode.startsWith("R-late"));
  assert("NEVER-GRADED — an ungraded axis inherits the capsule's own lockedOn schedule, never 'fresh'",
    (() => { const s = axisState(cap, "b", [], IV, NOW); return s.rounds === 0 && s.nextDue === "2026-06-24" && s.overdueDays > 40; })());

  const cs = conceptState(cap, clean2, IV, NOW);
  assert("EDGE-MAP — derived: what he can defend, what cracked, what is simply UNMEASURED",
    cs.edgeMap.can_defend.includes("a") && cs.edgeMap.unmeasured.includes("b") && !cs.edgeMap.unmeasured.includes("a"));
  assert("CONFUSION-PAIRS stay null behind their gate, and the gate says have/need",
    cs.confusionPairs === null && /have 0 \/ 0/.test(cs.confusion_gate));
  assert("THE CAPSULE IS NEVER MUTATED — the input object is byte-identical after a full derive",
    JSON.stringify(cap) === JSON.stringify({ id: "embeddings", lockedOn: "2026-06-21" }));

  const caps = [cap, { id: "inference", lockedOn: "2026-06-24" }];
  const rep = dueReport(caps, clean2, IV, { hardest_due: ["inference", "embeddings"] }, NOW);
  assert("ARBITER — FSRS owns the ORDER of concepts; this organ only supplies axes + mode",
    rep[0].concept === "inference" && rep.every((r) => !("nextDue" in r)));
  assert("A FRESH CRACK IS NOT INSTANTLY OVERDUE — the reset schedules it TIGHT (3d), it does not nag today",
    (() => { const s = axisState(cap, "c", [row("c", "cracked", "knew", "2026-08-04T00:00:00Z")], IV, NOW);
      return s.nextDue === "2026-08-07" && s.overdueDays === 0 && s.escalate === true; })());
  assert("ARBITER — within a concept, an escalated (confident-crack) axis outranks a MORE overdue but unmeasured one",
    (() => { const rows = [row("c", "cracked", "knew", "2026-07-01T00:00:00Z")];
      const r = dueReport([cap], rows, IV, {}, NOW);           // axis b is 42d overdue, axis c is 32d + escalated
      const b = r[0].axes.find((x) => x.axis === "b");
      return r[0].axes[0].axis === "c" && b && b.overdueDays > r[0].axes[0].overdueDays; })());
  assert("EMPTY LOG — no rows means every axis falls back to the capsule schedule, never a crash",
    dueReport(caps, [], IV, null, NOW).length === 2);
  assert("READER IS SAFE — a missing log file reads as zero rows",
    readLog(join(HERE, "__no_such_log__.jsonl")).length === 0);
  // UNRUN = HYPOTHESIS. The write path is exercised for real, against a temp file, so
  // "the loop now has a back edge" is a demonstrated fact and not a claim in a comment.
  assert("THE BACK EDGE — a graded round is appended, read back, and CHANGES the derived state",
    (() => {
      const p = join(mkdtempSync(join(tmpdir(), "rejirah-")), "log.jsonl");
      const before = axisState(cap, "a", readLog(p), IV, NOW);
      const b1 = buildRow({ concept: "embeddings", axis: "a", result: "held", gut: "shaky" }, { capsuleIds: ["embeddings"], now: "2026-08-05T10:00:00Z" });
      append(b1.row, p);
      const after = axisState(cap, "a", readLog(p), IV, NOW);
      return before.rounds === 0 && before.lastResult === null
        && after.rounds === 1 && after.lastResult === "held" && after.nextDue === "2026-08-08"
        && readLog(p).length === 1;
    })());
  assert("APPEND-ONLY — a second grade adds a row and never rewrites the first",
    (() => {
      const p = join(mkdtempSync(join(tmpdir(), "rejirah2-")), "log.jsonl");
      append(buildRow({ concept: "embeddings", axis: "a", result: "cracked", gut: "knew", now: "2026-07-01T00:00:00Z" }, { capsuleIds: ["embeddings"], now: "2026-07-01T00:00:00Z" }).row, p);
      append(buildRow({ concept: "embeddings", axis: "a", result: "held", gut: "shaky" }, { capsuleIds: ["embeddings"], now: "2026-08-05T10:00:00Z" }).row, p);
      const rows = readLog(p);
      return rows.length === 2 && rows[0].result === "cracked" && rows[1].result === "held";
    })());

  console.log(`\nrejirah selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const mode = String(cmd || "").toLowerCase();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);

  const intervals = intervalsOf();
  const caps = loadCapsules();
  const rows = readLog();
  const now = new Date();

  if (mode === "grade") {
    const flag = (n) => { const i = rest.indexOf("--" + n); return i >= 0 ? rest[i + 1] : undefined; };
    const built = buildRow({
      concept: rest[0], axis: rest[1], result: rest[2],
      gut: flag("gut"), cold: flag("cold") === "false" ? false : true,
    }, { capsuleIds: caps.map((c) => c.id) });
    if (!built.ok) { console.error(`rejirah: ${built.why}`); process.exit(1); }
    append(built.row);
    const st = axisState(caps.find((c) => c.id === built.row.concept) || { id: built.row.concept }, built.row.axis, [...rows, built.row], intervals, now);
    console.log(`rejirah: ${built.row.concept} ${built.row.axis} ${built.row.result}`
      + (built.row.gut ? ` (gut ${built.row.gut})` : " (no gut-word committed)")
      + ` → ${st.fluencyState} · round ${st.rounds} · next due ${st.nextDue || "?"}`
      + (st.escalate ? "  ⛔ OVERCONFIDENT — tighten the interval and bump the mode" : ""));
    if (built.unregistered) console.log(`  ⚠ "${built.row.concept}" is not a locked capsule — say so; concepts.json is hand-curated canon.`);
    return;
  }

  if (mode === "state") {
    const want = String(rest[0] || "").toLowerCase();
    for (const c of caps) {
      if (want && c.id !== want) continue;
      const st = conceptState(c, rows, intervals, now);
      console.log(`\n${c.id}  (locked ${st.lockedOn})`);
      for (const a of st.axes) {
        console.log(`  ${a.axis} ${String(a.axisType).padEnd(11)} rounds ${a.rounds} · ${a.lastResult || "ungraded"}`
          + ` · ${a.fluencyState.split(" ")[0]} · due ${a.nextDue || "?"}${a.overdueDays ? ` (${a.overdueDays}d overdue)` : ""}`
          + (a.escalate ? "  ⛔" : ""));
      }
      console.log(`  edge-map → defend ${st.edgeMap.can_defend.join("") || "—"} · cracked ${st.edgeMap.cracked.join("") || "—"} · unmeasured ${st.edgeMap.unmeasured.join("") || "—"}`);
      if (!st.confusionPairs) console.log(`  confusion-pairs: ${st.confusion_gate}`);
    }
    return;
  }

  if (mode === "due" || !mode) {
    const rep = dueReport(caps, rows, intervals, readJson(CARDS), now);
    if (!rep.length) { console.log("\nrejirah: kuch due nahi.\n"); return; }
    console.log(`\n== RE-JIRAH — AXES DUE ==   (FSRS says WHEN · this says WHICH AXES + HOW HARD)\n`);
    for (const r of rep) {
      console.log(`${r.concept}${r.fsrs_rank >= 0 ? `  [FSRS hardest #${r.fsrs_rank + 1}]` : ""}`);
      for (const a of r.axes.slice(0, 4)) {
        console.log(`   ${a.axis} · ${a.axisType} · ${a.mode} · ${a.overdueDays}d overdue${a.escalate ? "  ⛔ confident-crack" : ""}`);
      }
      console.log("");
    }
    console.log(`  Cold sawaal: \`node scripts/deep.mjs due\`   ·   Result likho: \`node scripts/rejirah.mjs grade <concept> <axis> held|cracked --gut <word>\`\n`);
    return;
  }
  console.log("rejirah: grade <concept> <axis> held|cracked [--gut knew|shaky|guessed] [--cold false] | state [concept] | due | selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { selftest, intervalsOf };
