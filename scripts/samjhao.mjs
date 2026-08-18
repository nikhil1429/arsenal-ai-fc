#!/usr/bin/env node
// ============================================================================
// samjhao.mjs · ARSENAL AI FC — LOAD ZERO, BLOCK 2: SAMJHAO (19 Aug 2026)
//   SOLE WRITER of dressing-room/state/samjhao.jsonl (gitignored — state, not code).
//   Writes NOTHING else: the task id comes from tasks.mjs, his answers become reps
//   through capture.mjs, the post-samjhao Re-Jirah is announced through sitting.mjs.
//   READS ONLY: dressing-room/state/capsules/*.json (mirror.mjs is their sole writer;
//   a capsule is IMMUTABLE and this organ never touches one).
// ----------------------------------------------------------------------------
// THE THREE THINGS, AND WHY THIS IS THE MIDDLE ONE (his words, 19 Aug 2026):
//   FORGE    = a new concept learned from zero — THE METHOD's 12 steps, 9 axes graded,
//              the capsule gets LOCKED. forge_session.mjs owns it. Not this organ.
//   SAMJHAO  = REVISION — re-opening his OWN locked notes, in depth, interactively,
//              because he has forgotten them. Nothing new is taught. THIS ORGAN.
//   RE-JIRAH = the revision TEST — cold, questions only, graded. rejirah.mjs owns it.
//   Pipeline: FORGE (learn) -> SAMJHAO (revise) -> RE-JIRAH (test).
//
// HIS WORDS THIS EXISTS FOR (18 Aug 2026): "I cannot do rejirah. I have said it a lot of
//   times that I have forgotten every single thing what I have studied till now. So I want
//   the full depth." And (19 Aug): "re-jirah nahi, samjhao — only for 4 topics which are
//   covered 2 months ago because i forgot them; after samjhao i will give re jirah, but yes
//   samjhao should happen for every future topic as well."
//   (That route ruling is STAGED, not canon — Law 4: only he promotes it.)
//
// WHY A SESSION AND NOT A DOCUMENT: passive re-reading is exactly what already failed — he
//   read it and forgot it. A page cannot interact. So samjhao is a SESSION and its residue
//   becomes his notes — notes made of HIS OWN ANSWERS, not of someone's prose.
//
// THE CEILING FEATURES (LOAD_ZERO §4), each a code path here:
//   A · DOUBT LEDGER — every doubt he ever raised on the topic is listed OPEN at the start,
//       and the samjhao may not close while ONE is open. "No stone uncovered" becomes a
//       COUNT (12/26), not a feeling. `close` refuses and names the number.
//   B · PREDICT-THEN-REVEAL — every unit asks for HIS GUESS before it opens (his rule #15,
//       generalised). `answer` is REFUSED before `guess`. What he retrieves sticks; what he
//       reads does not — which is the whole reason samjhao exists.
//   C · EVERY ANSWER IS A REP — gut-word (knew|shaky|guessed) BEFORE the answer, his own law,
//       enforced here exactly as capture.mjs enforces it. Reps go to capture.mjs (never
//       written here), so samjhao PRODUCES the calibration evidence that schedules the
//       Re-Jirah he promised. He never has to remember to take it.
//   D · SURFACE-AGNOSTIC — a unit is a DATA OBJECT, never prose. The Gaffer speaks it, Claude
//       Code renders it, Gemini carries it. He was talking to the GAFFER about samjhao (L2).
//   E · RESUMABLE — the session id IS a tasks.mjs task id (kind `samjhao`, INTERACTIVE), so
//       "samjhao tokenization" asked twice RESUMES one session; stop at unit 7 in the dugout,
//       resume at unit 7 anywhere.
//   F · NO NEW FACTS — a unit may only assert what is in HIS capsule. Held mechanically by
//       validators.mjs (noNewNumbers + quotesOnly) against the capsule itself. Anything the
//       capsule cannot supply (a JS->Python bridge, an analogy the weld never wrote) is
//       LABELLED in `needs[]` for a composing surface to fill — never invented here.
//
// THE mechanism_head DECISION (LOAD_ZERO §4, explicit): tokenization's capsule head is
//   withheld on a REJIRAH route so a cold round stays cold (brain.mjs:3036). His new route is
//   samjhao FIRST, Re-Jirah after — so SAMJHAO OPENS IT, and the Re-Jirah that follows is
//   generated FRESH AND COLD on the re-activated material. Keeping the old withholding would
//   gut the samjhao. That is why `reveal.mechanism_head` is always the capsule's own head.
// NEVER: teach something the capsule does not hold - write a capsule - grade an axis (that is
//   Re-Jirah) - run the 12 steps (that is FORGE) - close with a doubt still open - accept an
//   answer with no gut-word - accept an answer before the guess.
// LEDGER ROWS: {ev, id|of, ts, concept, unit, doubt, text, gut, correct, units, doubts}
// CLI: node scripts/samjhao.mjs plan <concept> [--json]   (the units + doubt ledger, no session)
//      | open <concept> [--json] | next <concept|id> [--json] | status <concept|id> [--json]
//      | guess <id> --unit <n> --text "..." --gut knew|shaky|guessed
//      | answer <id> --unit <n> --text "..." --gut <w> [--correct true|false]
//      | doubt <id> --n <k> --text "..." --gut <w>
//      | close <id> | verify <concept> | list | selftest
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, rmSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { noNewNumbers, quotesOnly } from "./validators.mjs";

const SELF = fileURLToPath(import.meta.url);
const __dirname = dirname(SELF);
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
export const SAMJHAO_LEDGER = process.env.ARSENAL_SAMJHAO_LEDGER || join(STATE_DIR, "samjhao.jsonl");
export const CAPSULE_DIR = process.env.ARSENAL_CAPSULE_DIR || join(STATE_DIR, "capsules");

export const GUT_WORDS = ["knew", "shaky", "guessed"];          // his own law — same vocabulary capture.mjs refuses outside of
export const THE_FOUR = ["tokenization", "embeddings", "inference", "context"];   // §4 scope now; then every future topic

const clip = (s, n = 4000) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
const readRows = (p = SAMJHAO_LEDGER) => { try { if (!existsSync(p)) return []; return readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };

export function loadCapsule(concept, dir = CAPSULE_DIR) {
  const want = String(concept || "").toLowerCase();
  try {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
      const id = String(j.id || f.replace(/\.json$/, "")).toLowerCase();
      if (id === want || id.startsWith(want) || want.startsWith(id)) return j;
    }
  } catch { /* no mirror on this machine — the caller says so */ }
  return null;
}

// -- THE UNIT — one idea, fully opened, assembled from HIS capsule (never composed here) ----
// The order is learning-layer/HOW_HE_LEARNS.md turned into a data structure (LOAD_ZERO §4):
//   1 name in one line · 2 mechanism + numbered trace · 3 he runs it by hand · 4 everyday
//   analogy (never geometry) · 5 JS->Python bridge · 6 ONE check-question · 7 you are here.
// Every field carries `source`, so "where did this come from" is answerable for each one.
const analogyOf = (weld) => { const m = /(?:^|[.—-]\s*)analogy\s*[:—-]\s*(.+)$/is.exec(String(weld || "")); return m ? clip(m[1], 400) : null; };
const traceOf = (weld) => String(weld || "").split(/(?=\b\d+\)|\b\d+\.\s)/).map((s) => clip(s, 300)).filter((s) => /^\d/.test(s));

export function planUnits(cap) {
  const axes = cap && Array.isArray(cap.faultLines) ? cap.faultLines : [];
  const traps = (cap && Array.isArray(cap.traps) ? cap.traps : []).filter((t) => t && t.bait);
  const bridges = cap && Array.isArray(cap.bridges) ? cap.bridges : [];
  const total = axes.length;
  return axes.map((a, i) => {
    const weld = String(a.weld || "");
    const trap = traps[i] || null;
    const bridge = trap ? null : (bridges[i - traps.length] || null);
    const analogy = analogyOf(weld);
    const needs = [];
    if (!analogy) needs.push("analogy");
    needs.push("js_bridge");                                     // no capsule carries one — a composing surface fills it, labelled
    return {
      n: i + 1, axis: a.axis, title: a.title || null, status: a.status || null,
      you_are_here: `unit ${i + 1} of ${total} - ${total - i - 1} baaki`,
      // B · PREDICT-THEN-REVEAL: his own strike is the question, asked BEFORE anything opens
      predict: { ask: a.strike || null, law: "gut-word pehle bolo: knew | shaky | guessed - baad mein badalta nahi" },
      // the revision itself: HIS locked answer, quoted; the head is OPEN here by §4's decision
      reveal: { weld: weld || null, mechanism_head: clip(cap.mechanism, 600) || null, analogy, trace: traceOf(weld) },
      trap: trap ? { bait: trap.bait, wrong: trap.wrong || null, truth: trap.truth || null } : null,
      bridge: bridge ? { to: bridge.to, q: bridge.q || null, a: bridge.a || null } : null,
      // 6 · ONE check-question, and it comes from HIS OWN capsule too
      check: trap ? `Yeh sahi hai ya galat, aur kyun — "${clip(trap.bait, 200)}"` : (bridge && bridge.q ? bridge.q : null),
      js_bridge: null, needs,
      source: { capsule: cap.id, lockedOn: cap.lockedOn || null, from: `faultLines[${i}]${trap ? ` + traps[${i}]` : bridge ? ` + bridges[${i - traps.length}]` : ""}` },
    };
  });
}

/** A · THE DOUBT LEDGER — every doubt he ever raised on this topic, open until HE closes it */
export function planDoubts(cap) {
  const d = cap && Array.isArray(cap.doubts) ? cap.doubts : [];
  return d.map((x, i) => ({ n: i + 1, q: x.q || null, a: x.a || null, source: `doubts[${i}]` }));
}

export function plan(concept, dir = CAPSULE_DIR) {
  const cap = loadCapsule(concept, dir);
  if (!cap) return { ok: false, why: `no locked capsule for "${concept}" — samjhao revises HIS OWN notes, so without a capsule there is nothing to revise (FORGE it first)` };
  if (!cap.lockedOn) return { ok: false, why: `capsule "${cap.id}" is not locked (no lockedOn) — samjhao revises LOCKED notes only` };
  const units = planUnits(cap), doubts = planDoubts(cap);
  if (!units.length) return { ok: false, why: `capsule "${cap.id}" has no faultLines — nothing to open` };
  return { ok: true, concept: cap.id, title: cap.title || cap.id, lockedOn: cap.lockedOn, units, doubts, capsule: cap };
}

/**
 * F · NO NEW FACTS — verify a plan asserts nothing absent from the capsule.
 * Reuses the organism's own validators rather than inventing a second truth-check.
 */
export function verifyPlan(p) {
  if (!p.ok) return p;
  const cap = p.capsule;
  const bad = [];
  for (const u of p.units) {
    const text = [u.title, u.predict.ask, u.reveal.weld, u.reveal.mechanism_head, u.reveal.analogy, u.trap && u.trap.truth, u.bridge && u.bridge.a, u.check].filter(Boolean).join(" \n ");
    const n = noNewNumbers(text, cap, "");
    if (!n.ok) bad.push({ unit: u.n, kind: "new-number", bad: n.bad });
    const q = quotesOnly(text, cap, 12);
    if (!q.ok) bad.push({ unit: u.n, kind: "unsourced-quote", bad: q.bad });
  }
  return { ok: bad.length === 0, checked: p.units.length, bad };
}

// -- the owners this organ speaks THROUGH (never around) ---------------------
function owner(organ, argv, deps = {}) {
  if (deps.exec) return deps.exec(organ, argv);
  const r = spawnSync(process.execPath, [join(__dirname, organ), ...argv.map(String)], { encoding: "utf8", timeout: 60000, windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "1" } });
  return { ok: r.status === 0, out: String(r.stdout || ""), err: String(r.stderr || ""), status: r.status };
}
function appendRow(row, deps = {}) {
  if (deps.append) return deps.append(row);
  const path = deps.ledger || SAMJHAO_LEDGER;
  try { mkdirSync(dirname(path), { recursive: true }); appendFileSync(path, JSON.stringify(row) + "\n"); return true; } catch { return false; }
}
const rowsOf = (deps) => (deps.rows ? deps.rows : readRows(deps.ledger || SAMJHAO_LEDGER));

/** the session is the FOLD of its rows — same shape as tasks.mjs, so it resumes anywhere */
export function foldSessions(rows) {
  const by = new Map();
  for (const r of rows || []) {
    if (!r || !r.ev) continue;
    if (r.ev === "open") { if (!by.has(r.id)) by.set(r.id, { id: r.id, concept: r.concept, opened_at: r.ts, units: r.units, doubts: r.doubts, guessed: new Set(), answered: new Set(), closed_doubts: new Set(), reps: 0, closed_at: null }); continue; }
    const s = by.get(r.of); if (!s) continue;
    if (r.ev === "guess") s.guessed.add(r.unit);
    else if (r.ev === "answer") { s.answered.add(r.unit); s.reps += 1; }
    else if (r.ev === "doubt") { s.closed_doubts.add(r.doubt); s.reps += 1; }
    else if (r.ev === "close") s.closed_at = r.ts;
  }
  return by;
}
export const sessionOf = (id, rows = readRows()) => foldSessions(rows).get(id) || null;
export function sessionForConcept(concept, rows = readRows()) {
  const all = [...foldSessions(rows).values()].filter((s) => s.concept === String(concept || "").toLowerCase());
  return all.filter((s) => !s.closed_at).slice(-1)[0] || all.slice(-1)[0] || null;
}

/** open — the session id IS a tasks.mjs task id (E · RESUMABLE); asking twice resumes one */
export function open(concept, deps = {}) {
  const now = deps.now || new Date();
  const p = plan(concept, deps.capsuleDir || CAPSULE_DIR);
  if (!p.ok) return p;
  const t = owner("tasks.mjs", ["create", "--kind", "samjhao", "--subject", p.concept, "--door", deps.door || "cli", "--by", "captain", "--json"], deps);
  let task = null;
  try { task = JSON.parse((t.out || "").trim().split("\n").slice(-1)[0]); } catch { /* named below */ }
  if (!t.ok || !task || !task.id) return { ok: false, why: `the task layer would not give this samjhao an id (${clip(t.err || t.out, 160)}) — without one it could not be resumed on another surface` };
  const existing = sessionOf(task.id, rowsOf(deps));
  if (existing) return { ok: true, resumed: true, id: task.id, plan: p, session: existing, why: `samjhao for ${p.concept} is already open as ${task.id} — resuming, not restarting` };
  appendRow({ ev: "open", id: task.id, ts: now.toISOString(), concept: p.concept, units: p.units.length, doubts: p.doubts.length }, deps);
  return { ok: true, resumed: false, id: task.id, plan: p, session: sessionOf(task.id, rowsOf(deps)) };
}

/** next — the next unit to SERVE, as data. Predict first; the reveal is withheld until he guesses. */
export function next(id, deps = {}) {
  const s = sessionOf(id, rowsOf(deps));
  if (!s) return { ok: false, why: `no samjhao session ${id}` };
  const p = plan(s.concept, deps.capsuleDir || CAPSULE_DIR);
  if (!p.ok) return p;
  const unit = p.units.find((u) => !s.answered.has(u.n));
  if (!unit) {
    const openD = p.doubts.filter((d) => !s.closed_doubts.has(d.n));
    if (openD.length) return { ok: true, phase: "doubts", done: p.doubts.length - openD.length, total: p.doubts.length, doubt: openD[0], you_are_here: `doubts ${p.doubts.length - openD.length}/${p.doubts.length} - ${openD.length} baaki` };
    return { ok: true, phase: "close", why: "every unit answered and every doubt closed — `samjhao close` ab legal hai" };
  }
  const guessed = s.guessed.has(unit.n);
  // B · PREDICT-THEN-REVEAL is enforced in the DATA, not just in the gate: before his guess the
  // surface literally cannot read the weld, so no mouth can leak it by accident.
  return guessed
    ? { ok: true, phase: "reveal", unit, you_are_here: unit.you_are_here }
    : { ok: true, phase: "predict", you_are_here: unit.you_are_here, unit: { n: unit.n, axis: unit.axis, title: unit.title, you_are_here: unit.you_are_here, predict: unit.predict, reveal: "(withheld — pehle apna guess do)", trap: null, bridge: null, check: null, needs: unit.needs, source: unit.source } };
}

const gutOk = (g) => GUT_WORDS.includes(String(g || "").toLowerCase());

export function guess(id, unitN, text, gut, deps = {}) {
  const now = deps.now || new Date();
  const s = sessionOf(id, rowsOf(deps));
  if (!s) return { ok: false, why: `no samjhao session ${id}` };
  if (s.closed_at) return { ok: false, why: `samjhao ${id} is closed` };
  if (!gutOk(gut)) return { ok: false, why: `gut-word chahiye — ${GUT_WORDS.join("|")} (his own law; capture.mjs refuses the same omission)` };
  if (!clip(text, 2)) return { ok: false, why: "guess ka text chahiye — a blank guess is not a prediction" };
  const n = Number(unitN);
  if (s.guessed.has(n)) return { ok: false, why: `unit ${n} ka guess pehle hi aa chuka — ek unit, ek prediction` };
  appendRow({ ev: "guess", of: id, ts: now.toISOString(), unit: n, text: clip(text, 2000), gut: String(gut).toLowerCase() }, deps);
  return { ok: true, unit: n, session: sessionOf(id, rowsOf(deps)) };
}

/** answer — C · EVERY ANSWER IS A REP. Refused before the guess (B is a law, not a suggestion). */
export function answer(id, unitN, text, gut, correct, deps = {}) {
  const now = deps.now || new Date();
  const s = sessionOf(id, rowsOf(deps));
  if (!s) return { ok: false, why: `no samjhao session ${id}` };
  if (s.closed_at) return { ok: false, why: `samjhao ${id} is closed` };
  const n = Number(unitN);
  if (!s.guessed.has(n)) return { ok: false, why: `unit ${n} ka GUESS pehle chahiye — predict-then-reveal (§4-B): jo woh khud nikaalta hai wahi tikta hai, jo padhta hai woh nahi` };
  if (!gutOk(gut)) return { ok: false, why: `gut-word chahiye — ${GUT_WORDS.join("|")}` };
  if (!clip(text, 2)) return { ok: false, why: "answer ka text chahiye" };
  if (s.answered.has(n)) return { ok: false, why: `unit ${n} ka answer pehle hi aa chuka` };
  const p = plan(s.concept, deps.capsuleDir || CAPSULE_DIR);
  const unit = p.ok ? p.units.find((u) => u.n === n) : null;
  // the rep goes to capture.mjs — this organ never writes a rep, so the gut-word law has ONE writer
  const rep = owner("capture.mjs", ["rep", "--concept", s.concept, "--axis", (unit && unit.axis) || "a", "--q", clip((unit && unit.check) || (unit && unit.predict.ask) || "samjhao unit", 200), "--gut", String(gut).toLowerCase(), "--correct", correct === false ? "false" : "true"], deps);
  appendRow({ ev: "answer", of: id, ts: now.toISOString(), unit: n, text: clip(text, 2000), gut: String(gut).toLowerCase(), correct: correct !== false, rep_ok: !!rep.ok, rep_said: clip(rep.out || rep.err, 200) }, deps);
  return { ok: true, unit: n, rep_ok: !!rep.ok, rep_said: clip(rep.out || rep.err, 200), session: sessionOf(id, rowsOf(deps)) };
}

/** A · a doubt closes ONLY on his own answer */
export function closeDoubt(id, doubtN, text, gut, deps = {}) {
  const now = deps.now || new Date();
  const s = sessionOf(id, rowsOf(deps));
  if (!s) return { ok: false, why: `no samjhao session ${id}` };
  if (s.closed_at) return { ok: false, why: `samjhao ${id} is closed` };
  if (!gutOk(gut)) return { ok: false, why: `gut-word chahiye — ${GUT_WORDS.join("|")}` };
  if (!clip(text, 2)) return { ok: false, why: "doubt HIS OWN answer se band hota hai — khaali text se nahi (§4-A)" };
  const n = Number(doubtN);
  const p = plan(s.concept, deps.capsuleDir || CAPSULE_DIR);
  if (p.ok && !p.doubts.some((d) => d.n === n)) return { ok: false, why: `doubt ${n} is not in ${s.concept}'s ledger (1..${p.doubts.length})` };
  if (s.closed_doubts.has(n)) return { ok: false, why: `doubt ${n} pehle hi band hai` };
  const rep = owner("capture.mjs", ["rep", "--concept", s.concept, "--axis", "a", "--q", clip((p.ok && (p.doubts.find((d) => d.n === n) || {}).q) || `doubt ${n}`, 200), "--gut", String(gut).toLowerCase(), "--correct", "true"], deps);
  appendRow({ ev: "doubt", of: id, ts: now.toISOString(), doubt: n, text: clip(text, 2000), gut: String(gut).toLowerCase(), rep_ok: !!rep.ok }, deps);
  return { ok: true, doubt: n, session: sessionOf(id, rowsOf(deps)) };
}

/**
 * BURNED AXES — the coldness guarantee, as a CODE PATH (19 Aug 2026).
 *
 * THE HOLE THIS CLOSES, measured the same night this organ shipped: samjhao OPENS the weld
 * (§4's explicit decision), and `deep.mjs due` serves the capsule's `faultLines[].strike`
 * VERBATIM — the exact question samjhao just used as its predict prompt before showing him the
 * answer. So the Re-Jirah that follows a samjhao would have been WARM, not cold, and §4's
 * "generated fresh and cold on the re-activated material" was living only in an agenda row's
 * prose. Law 4: a law is a code path or it does not exist.
 *
 * An axis is BURNED from the moment he GUESSES on its unit, because that is the moment `next`
 * starts returning the weld. Burning is per (concept, axis) and carries the date, so a cold
 * server can say WHY it will not reuse the old question instead of silently serving it.
 * This organ only STATES the fact; deep.mjs decides what to serve. Owners stay separate.
 */
export function burnedAxes(concept, rows = readRows(), capsuleDir = CAPSULE_DIR) {
  const want = String(concept || "").toLowerCase();
  const p = plan(want, capsuleDir);
  if (!p.ok) return [];
  const byUnit = new Map(p.units.map((u) => [u.n, u.axis]));
  const mine = new Set([...foldSessions(rows).values()].filter((s) => s.concept === p.concept).map((s) => s.id));
  const out = new Map();
  for (const r of rows || []) {
    if (!r || r.ev !== "guess" || !mine.has(r.of)) continue;
    const axis = byUnit.get(Number(r.unit));
    if (axis && !out.has(axis)) out.set(axis, { axis, at: r.ts });
  }
  return [...out.values()];
}

/** progress — the count that replaces the feeling */
export function progressOf(id, deps = {}) {
  const s = sessionOf(id, rowsOf(deps));
  if (!s) return { ok: false, why: `no samjhao session ${id}` };
  const p = plan(s.concept, deps.capsuleDir || CAPSULE_DIR);
  const units = p.ok ? p.units.length : s.units, doubts = p.ok ? p.doubts.length : s.doubts;
  const openDoubts = p.ok ? p.doubts.filter((d) => !s.closed_doubts.has(d.n)) : [];
  return { ok: true, id, concept: s.concept, units_done: s.answered.size, units, doubts_closed: s.closed_doubts.size, doubts, open_doubts: openDoubts.map((d) => d.n), reps: s.reps, closed_at: s.closed_at, line: `samjhao ${s.concept}: units ${s.answered.size}/${units} - doubts ${s.closed_doubts.size}/${doubts} - reps ${s.reps}${s.closed_at ? " - CLOSED" : ""}` };
}

/**
 * close — THE RATCHET. Refused while ONE doubt is open, or one unit unanswered.
 * On success: the task is finished through tasks.mjs, and the post-samjhao RE-JIRAH is put on
 * the next sitting's agenda through sitting.mjs — FRESH AND COLD on the re-activated material
 * (LOAD_ZERO §4). Samjhao never grades an axis; grading is rejirah.mjs's alone.
 */
export function close(id, deps = {}) {
  const now = deps.now || new Date();
  const pr = progressOf(id, deps);
  if (!pr.ok) return pr;
  if (pr.closed_at) return { ok: false, why: `samjhao ${id} already closed at ${pr.closed_at}` };
  if (pr.units_done < pr.units) return { ok: false, why: `abhi ${pr.units - pr.units_done} unit baaki hain (${pr.units_done}/${pr.units}) — samjhao adhoora band nahi hota`, progress: pr };
  if (pr.doubts_closed < pr.doubts) return { ok: false, why: `${pr.doubts - pr.doubts_closed} doubt abhi KHULE hain (${pr.doubts_closed}/${pr.doubts}) — har doubt uske apne jawab se band hota hai, tabhi "koi pathar ulta nahi chhoda" ek GINTI banti hai (§4-A)`, progress: pr, open_doubts: pr.open_doubts };
  const fin = owner("tasks.mjs", ["finish", id, "--receipt", `samjhao ${pr.concept}: units ${pr.units}/${pr.units} - doubts ${pr.doubts}/${pr.doubts} - reps ${pr.reps}`], deps);
  const ag = owner("sitting.mjs", ["agenda", "add", "--text", `RE-JIRAH ${pr.concept} — samjhao ho chuka (${pr.doubts}/${pr.doubts} doubts band, ${pr.reps} reps). Ab cold round: sawaal RE-ACTIVATED material pe FRESH banao, purane strikes dobara mat poochho.`], deps);
  appendRow({ ev: "close", of: id, ts: now.toISOString(), concept: pr.concept, units: pr.units, doubts: pr.doubts, reps: pr.reps, task_finished: !!fin.ok, rejirah_agenda: !!ag.ok }, deps);
  return { ok: true, progress: { ...pr, closed_at: now.toISOString() }, task_finished: !!fin.ok, rejirah_agenda: !!ag.ok, why: `samjhao ${pr.concept} band — agla kadam Re-Jirah, cold aur fresh (${ag.ok ? "agenda pe chadh gaya" : "agenda row NAHI chadhi: " + clip(ag.err || ag.out, 120)})` };
}

// -- the board ---------------------------------------------------------------
export function stats(rows = readRows()) {
  const all = [...foldSessions(rows).values()];
  const openS = all.filter((s) => !s.closed_at);
  return { n: all.length, open: openS.length, closed: all.length - openS.length, reps: all.reduce((n, s) => n + s.reps, 0), concepts: all.map((s) => s.concept), last: all.slice(-1)[0] || null };
}
export const boardLine = (s = stats()) => `samjhao ${s.n} session(s) - open ${s.open} - closed ${s.closed} - reps ${s.reps}${s.concepts.length ? ` - ${[...new Set(s.concepts)].join(",")}` : ""}`;

// -- SELFTEST ----------------------------------------------------------------
let pass = 0, failed = 0;
const assert = (name, cond, extra = "") => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { failed++; console.log(`  FAIL ${name}${extra ? ` — ${extra}` : ""}`); } };

function selftest() {
  console.log("samjhao.mjs selftest — LOAD ZERO BLOCK 2 (SAMJHAO = revision of HIS locked notes)\n");
  const now = new Date("2026-08-19T03:00:00Z");

  // 1. the plan, off the REAL capsules — all four topics must be runnable (§5 DoD)
  const runnable = THE_FOUR.map((c) => ({ c, p: plan(c) }));
  assert("all four topics have a runnable samjhao (tokenization - embeddings - inference - context)",
    runnable.every((r) => r.p.ok && r.p.units.length === 9 && r.p.doubts.length > 0),
    runnable.map((r) => `${r.c}:${r.p.ok ? r.p.units.length + "u/" + r.p.doubts.length + "d" : r.p.why}`).join(" | "));
  assert("a concept with no locked capsule is REFUSED — samjhao revises HIS notes, it never teaches from zero (that is FORGE)",
    !plan("quantum_chromodynamics").ok && /FORGE it first/.test(plan("quantum_chromodynamics").why || ""));

  const tok = plan("tokenization");
  const u1 = tok.units[0];
  assert("a unit is a DATA OBJECT with the 7 parts of HOW_HE_LEARNS in order, and every part names its source (§4-D)",
    u1.n === 1 && u1.axis === "a" && u1.predict.ask && u1.reveal.weld && u1.check && u1.you_are_here === "unit 1 of 9 - 8 baaki" && /faultLines\[0\]/.test(u1.source.from));
  assert("§4 DECISION — samjhao OPENS mechanism_head (a REJIRAH route withholds it; keeping that here would gut the revision)",
    !!u1.reveal.mechanism_head && !/withheld/i.test(u1.reveal.mechanism_head) && u1.reveal.mechanism_head.startsWith("AI sirf numbers"));
  assert("the predict question is HIS OWN strike and the reveal is HIS OWN weld — nothing is composed by this organ",
    u1.predict.ask === tok.capsule.faultLines[0].strike && u1.reveal.weld === tok.capsule.faultLines[0].weld);
  assert("what the capsule cannot supply is LABELLED in needs[], never invented (§4-F)", u1.needs.includes("js_bridge") && u1.js_bridge === null);
  assert("the analogy is EXTRACTED from his own weld when he wrote one", typeof u1.reveal.analogy === "string" && /dictionary/.test(u1.reveal.analogy));
  assert("the doubt ledger is every doubt he ever raised on the topic, numbered (§4-A)", tok.doubts.length === 26 && tok.doubts[0].q && /strawberry/.test(tok.doubts[0].q));

  // 2. F · NO NEW FACTS, held by the organism's own validators, on all four
  const verdicts = THE_FOUR.map((c) => ({ c, v: verifyPlan(plan(c)) }));
  assert("§4-F NO NEW FACTS — every unit of all four topics asserts only what the capsule holds (noNewNumbers + quotesOnly)",
    verdicts.every((r) => r.v.ok), verdicts.filter((r) => !r.v.ok).map((r) => `${r.c}: ${JSON.stringify(r.v.bad.slice(0, 2))}`).join(" | "));

  // 3. the session: gates, the ledger, resumability — against an injected sink and fake owners
  const rows = [];
  const calls = [];
  const deps = { rows, append: (r) => { rows.push(r); return true; }, now,
    exec: (organ, argv) => { calls.push({ organ, argv }); return organ === "tasks.mjs" && argv[0] === "create" ? { ok: true, out: '{"ok":true,"id":"tSAMJ01","replay":false,"state":"queued"}' } : { ok: true, out: `${organ} ok` }; } };
  const o = open("tokenization", deps);
  assert("open() takes its id FROM THE TASK LAYER (kind samjhao) so it can be resumed on any surface (§4-E)",
    o.ok && o.id === "tSAMJ01" && calls[0].organ === "tasks.mjs" && calls[0].argv.slice(0, 5).join(" ") === "create --kind samjhao --subject tokenization", JSON.stringify(calls[0] || {}));
  const o2 = open("tokenization", deps);
  assert("...and opening the SAME samjhao again RESUMES it — one session, never a second", o2.ok && o2.resumed && o2.id === o.id);

  const n1 = next("tSAMJ01", deps);
  assert("next() serves the PREDICT phase first, and the weld is NOT EVEN IN THE DATA until he guesses (§4-B, held in the payload, not just the gate)",
    n1.phase === "predict" && n1.unit.predict.ask && n1.unit.reveal === "(withheld — pehle apna guess do)" && n1.unit.check === null);
  assert("an ANSWER before the GUESS is refused — predict-then-reveal is a law here, not a suggestion",
    !answer("tSAMJ01", 1, "kuch bhi", "knew", true, deps).ok && /GUESS pehle chahiye/.test(answer("tSAMJ01", 1, "x", "knew", true, deps).why));
  assert("a guess with NO gut-word is refused, exactly as capture.mjs refuses a rep without one", !guess("tSAMJ01", 1, "token = tukda", null, deps).ok);
  assert("a guess with an out-of-vocabulary gut-word is refused", !guess("tSAMJ01", 1, "token = tukda", "maybe", deps).ok);
  assert("a real guess lands", guess("tSAMJ01", 1, "token = vocab ka tukda + ID", "shaky", deps).ok);
  const n2 = next("tSAMJ01", deps);
  assert("...and only THEN does next() reveal — the weld, the open mechanism head, the trap and the check-question", n2.phase === "reveal" && n2.unit.reveal.weld && n2.unit.check && n2.unit.trap);

  // THE COLDNESS GUARANTEE — the hole this closes was measured the night this organ shipped:
  // deep.mjs served faultLines[].strike verbatim, i.e. the exact question samjhao opens the weld
  // for. Without this, the Re-Jirah AFTER a samjhao would be WARM while calling itself COLD.
  const burnedNow = burnedAxes("tokenization", rows, CAPSULE_DIR);
  assert("a guessed unit BURNS its axis — the fact is stated with a date, so a cold server can refuse to reuse that strike (§4: the Re-Jirah after is FRESH and COLD)",
    burnedNow.length === 1 && burnedNow[0].axis === "a" && !!burnedNow[0].at, JSON.stringify(burnedNow));
  assert("...and an axis he has NOT reached is not burned — only what was actually opened", !burnedNow.some((b) => b.axis === "b"));

  const a1 = answer("tSAMJ01", 1, "text -> tukde -> IDs; kaam ID-list pe khatam", "shaky", true, deps);
  const repCall = calls.find((c) => c.organ === "capture.mjs");
  assert("C · EVERY ANSWER IS A REP — it goes through capture.mjs (this organ never writes a rep, so the gut-word law keeps ONE writer)",
    a1.ok && repCall && repCall.argv[0] === "rep" && repCall.argv.includes("--gut") && repCall.argv[repCall.argv.indexOf("--gut") + 1] === "shaky" && repCall.argv.includes("tokenization"));

  // 4. THE RATCHET — a samjhao may not close while a doubt is open
  const c1 = close("tSAMJ01", deps);
  assert("close is REFUSED with units still unanswered, and says how many", !c1.ok && /8 unit baaki/.test(c1.why), c1.why);
  for (let i = 2; i <= 9; i++) { guess("tSAMJ01", i, `guess ${i}`, "guessed", deps); answer("tSAMJ01", i, `answer ${i}`, "guessed", true, deps); }
  const c2 = close("tSAMJ01", deps);
  assert("THE RATCHET: every unit answered but doubts still open ⇒ close REFUSED, with the COUNT (§4-A: a feeling becomes a number)",
    !c2.ok && /26 doubt abhi KHULE hain \(0\/26\)/.test(c2.why), c2.why);
  assert("a doubt cannot be closed by a blank — it closes on HIS OWN answer only", !closeDoubt("tSAMJ01", 1, "", "knew", deps).ok);
  assert("a doubt outside the ledger is refused", !closeDoubt("tSAMJ01", 999, "x", "knew", deps).ok);
  for (let i = 1; i <= 26; i++) closeDoubt("tSAMJ01", i, `doubt ${i} ka jawab`, "knew", deps);
  const pr = progressOf("tSAMJ01", deps);
  assert("the board counts what he actually closed — 9/9 units, 26/26 doubts, 35 reps", pr.units_done === 9 && pr.doubts_closed === 26 && pr.reps === 35, pr.line);

  const c3 = close("tSAMJ01", deps);
  const finCall = calls.filter((c) => c.organ === "tasks.mjs" && c.argv[0] === "finish").slice(-1)[0];
  const agCall = calls.filter((c) => c.organ === "sitting.mjs").slice(-1)[0];
  assert("close now succeeds, finishes the TASK through its owner, and puts the post-samjhao RE-JIRAH on the next sitting's agenda — FRESH and COLD on re-activated material (§4)",
    c3.ok && finCall && finCall.argv[1] === "tSAMJ01" && agCall && agCall.argv.slice(0, 2).join(" ") === "agenda add" && /FRESH/.test(agCall.argv[3]) && /purane strikes dobara mat poochho/.test(agCall.argv[3]), JSON.stringify({ fin: !!finCall, ag: agCall && agCall.argv[3] }));
  assert("...and samjhao NEVER grades an axis — no rejirah.mjs grade call anywhere in the session (grading is the Re-Jirah's alone)",
    !calls.some((c) => c.organ === "rejirah.mjs"));
  assert("a closed samjhao does not close twice", !close("tSAMJ01", deps).ok);

  // 5. resumability across a REAL file, and hermeticity
  const dir = mkdtempSync(join(tmpdir(), "arsenal_samjhao_"));
  const ledger = join(dir, "samjhao.jsonl");
  const rdeps = { ledger, now, exec: (organ, argv) => ({ ok: true, out: organ === "tasks.mjs" && argv[0] === "create" ? '{"ok":true,"id":"tSAMJ02","replay":false,"state":"queued"}' : "ok" }) };
  open("embeddings", rdeps);
  guess("tSAMJ02", 1, "vector", "shaky", rdeps);
  answer("tSAMJ02", 1, "meaning-vector", "shaky", true, rdeps);
  const resumed = next("tSAMJ02", { ledger, capsuleDir: CAPSULE_DIR });   // a DIFFERENT reader, no shared memory
  assert("E · RESUMABLE — stop after unit 1, and a different surface reading only the ledger picks up at unit 2",
    resumed.ok && resumed.phase === "predict" && resumed.unit.n === 2, JSON.stringify({ phase: resumed.phase, n: resumed.unit && resumed.unit.n }));
  assert("HERMETICITY — the selftest wrote only into tmpdir, never onto the state bus",
    !readRows(join(STATE_DIR, "samjhao.jsonl")).some((r) => r.id === "tSAMJ02" || r.of === "tSAMJ02"));
  // a GUESS is a prediction, not an answer — §4-C says every ANSWER is a rep, so one answered
  // unit is one rep. The guess is what makes the answer worth counting, not a second rep.
  assert("the board line reads in one line, and a guess is NOT counted as a rep — only his answers are",
    /samjhao 1 session\(s\) - open 1 - closed 0 - reps 1/.test(boardLine(stats(readRows(ledger)))), boardLine(stats(readRows(ledger))));
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* tmp */ }

  console.log(`\nsamjhao: ${pass} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

// -- CLI ----------------------------------------------------------------------
const flag = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] !== undefined && !String(process.argv[i + 1]).startsWith("--") ? process.argv[i + 1] : (i > 0 ? true : d); };
const has = (n) => process.argv.includes(`--${n}`);
const resolveId = (arg) => { const s = sessionOf(arg); if (s) return arg; const byC = sessionForConcept(String(arg || "").toLowerCase()); return byC ? byC.id : arg; };

if (process.argv[1] && process.argv[1].endsWith("samjhao.mjs")) {
  const mode = process.argv[2] || "list";
  const arg = process.argv[3];
  if (mode === "selftest") selftest();
  else if (mode === "plan" || mode === "verify") {
    const p = plan(arg);
    if (!p.ok) { console.log(`samjhao: ${p.why}`); process.exit(1); }
    if (mode === "verify") { const v = verifyPlan(p); console.log(v.ok ? `samjhao: ${p.concept} — ${v.checked} unit(s), NO NEW FACTS (noNewNumbers + quotesOnly vs his own capsule)` : `samjhao: ${p.concept} — ${v.bad.length} unsourced assertion(s): ${JSON.stringify(v.bad.slice(0, 3))}`); process.exit(v.ok ? 0 : 1); }
    if (has("json")) console.log(JSON.stringify({ concept: p.concept, lockedOn: p.lockedOn, units: p.units, doubts: p.doubts }));
    else {
      console.log(`SAMJHAO PLAN · ${p.title} · capsule locked ${p.lockedOn} · ${p.units.length} unit(s) · ${p.doubts.length} doubt(s) in the ledger`);
      p.units.forEach((u) => console.log(`  ${u.n}. [${u.axis}] ${u.title}\n       guess pehle: ${clip(u.predict.ask, 120)}\n       check: ${clip(u.check, 110)}`));
      console.log(`  doubt ledger: ${p.doubts.length} — samjhao tab tak band nahi hota jab tak har ek uske apne jawab se band na ho`);
    }
  }
  else if (mode === "open") {
    const r = open(arg, { door: flag("door") || "cli" });
    if (!r.ok) { console.log(`samjhao: ${r.why}`); process.exit(1); }
    console.log(has("json") ? JSON.stringify({ ok: true, id: r.id, resumed: !!r.resumed, concept: r.plan.concept, units: r.plan.units.length, doubts: r.plan.doubts.length })
      : `samjhao: ${r.resumed ? "RESUME" : "open"} ${r.id} · ${r.plan.title} · ${r.plan.units.length} unit · ${r.plan.doubts.length} doubt${r.why ? ` (${r.why})` : ""}`);
  }
  else if (mode === "next") {
    const r = next(resolveId(arg), {});
    if (!r.ok) { console.log(`samjhao: ${r.why}`); process.exit(1); }
    if (has("json")) console.log(JSON.stringify(r));
    else if (r.phase === "close") console.log(`samjhao: ${r.why}`);
    else if (r.phase === "doubts") console.log(`DOUBT ${r.doubt.n} (${r.you_are_here})\n  ${r.doubt.q}\n  → apna jawab do: samjhao doubt <id> --n ${r.doubt.n} --text "..." --gut knew|shaky|guessed`);
    else if (r.phase === "predict") console.log(`UNIT ${r.unit.n} [${r.unit.axis}] ${r.unit.title} · ${r.you_are_here}\n  PEHLE GUESS: ${r.unit.predict.ask}\n  ${r.unit.predict.law}\n  → samjhao guess <id> --unit ${r.unit.n} --text "..." --gut <word>`);
    else console.log(`UNIT ${r.unit.n} [${r.unit.axis}] ${r.unit.title} · ${r.you_are_here}\n  MECHANISM: ${clip(r.unit.reveal.mechanism_head, 400)}\n  TERA APNA WELD: ${clip(r.unit.reveal.weld, 900)}${r.unit.reveal.analogy ? `\n  ANALOGY: ${r.unit.reveal.analogy}` : ""}${r.unit.trap ? `\n  TRAP: ${r.unit.trap.bait}\n    sach: ${r.unit.trap.truth}` : ""}\n  CHECK: ${r.unit.check}\n  → samjhao answer <id> --unit ${r.unit.n} --text "..." --gut <word>`);
  }
  else if (mode === "guess" || mode === "answer") {
    const id = resolveId(arg);
    const r = mode === "guess" ? guess(id, flag("unit"), flag("text"), flag("gut"), {})
      : answer(id, flag("unit"), flag("text"), flag("gut"), flag("correct") === "false" ? false : true, {});
    console.log(r.ok ? `samjhao: ok ${mode} unit ${r.unit}${r.rep_ok === false ? " (⚠ rep capture.mjs tak nahi pahuncha)" : mode === "answer" ? " · rep captured" : ""}` : `samjhao: ${r.why}`);
    process.exit(r.ok ? 0 : 1);
  }
  else if (mode === "doubt") {
    const r = closeDoubt(resolveId(arg), flag("n"), flag("text"), flag("gut"), {});
    console.log(r.ok ? `samjhao: ok doubt ${r.doubt} band` : `samjhao: ${r.why}`);
    process.exit(r.ok ? 0 : 1);
  }
  else if (mode === "status") {
    const r = progressOf(resolveId(arg), {});
    if (!r.ok) { console.log(`samjhao: ${r.why}`); process.exit(1); }
    console.log(has("json") ? JSON.stringify(r) : `${r.line}${r.open_doubts.length ? `\n  khule doubts: ${r.open_doubts.slice(0, 20).join(", ")}${r.open_doubts.length > 20 ? " …" : ""}` : ""}`);
  }
  else if (mode === "close") {
    const r = close(resolveId(arg), {});
    console.log(r.ok ? `samjhao: ${r.why}` : `samjhao: ${r.why}`);
    process.exit(r.ok ? 0 : 1);
  }
  else if (mode === "list") {
    const s = stats();
    console.log(boardLine(s));
    [...foldSessions(readRows()).values()].forEach((x) => console.log(`  ${x.id} · ${x.concept} · units ${x.answered.size}/${x.units} · doubts ${x.closed_doubts.size}/${x.doubts}${x.closed_at ? " · CLOSED" : ""}`));
    if (!s.n) console.log(`  (koi samjhao nahi khula — shuru: node scripts/samjhao.mjs open ${THE_FOUR[0]})`);
  }
  else console.log(`samjhao: plan|verify <concept> | open <concept> | next <concept|id> | guess|answer <id> --unit n --text "..." --gut knew|shaky|guessed | doubt <id> --n k --text "..." --gut w | status <concept|id> | close <id> | list | selftest`);
}
