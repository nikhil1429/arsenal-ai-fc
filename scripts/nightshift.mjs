#!/usr/bin/env node
// ============================================================================
// nightshift.mjs · ARSENAL AI FC — THE NIGHT SHIFT (the idle-quota drain)
// ----------------------------------------------------------------------------
// WHAT:  The brain's oldest law — "unused capacity is wasted sharpness" —
//        finally applied to the FREE GEMINI POOL. Today the organism spends
//        <1% of ~1,600+ free units/day; the rest evaporates at midnight.
//        This organ converts that evaporating quota into curriculum, nightly:
//        1. PROBE BANK   — K interview probes per weak/locked concept, in the
//                          DOSSIER's own grammar → tomorrow's scrimmage and
//                          Re-Jirah never repeat themselves.
//        2. DISTRACTORS  — plausible-but-wrong options built from HIS OWN
//                          confusion shapes (doubt_grammar) → personalized
//                          retrieval practice, the highest-value drill design.
//        3. EMBED BACKFILL — drains the embedding lane until every historical
//                          word of his is searchable (zero LLM, pure quota).
//        4. SCOUT PACK   — ready-to-paste DEEP RESEARCH prompts for the Pro
//                          account (T5 is a HUMAN surface — no API exists; the
//                          organism's max is perfect preparation + ingestion).
//        5. GEM CARTRIDGE — a paste-ready system brief for his Gemini Gem
//                          (his examiner-on-the-phone), refreshed from the
//                          live bus so the Gem always knows today's state.
//        6. GATE TUNE    — reads the salience ledger and DRAFTS threshold
//                          suggestions (report-only: AI proposes · code
//                          validates · HUMAN approves — the gate never
//                          retunes itself).
// LAWS:  fires overnight (or --force) · conserve tone = no shift (rest) ·
//        spends ONLY fuelboard headroom, hard-capped per job · every output
//        validated by code, junk rejected · all outputs land in gitignored
//        brain_out/nightshift/ · zero writes to any organ's file.
// MODES: node scripts/nightshift.mjs [--force] · status · selftest
// ============================================================================

import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generatePool } from "./hippocampus.mjs";
import { loadBoard, headroomOf, recordUse } from "./fuelboard.mjs";
import { currentTone } from "./tone.mjs";
import { indexRecall } from "./dugout.mjs";
import { indexEpisodes } from "./hippocampus.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const OUT_DIR   = join(STATE_DIR, "brain_out", "nightshift");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const CAPS = { probe_concepts: 6, probes_per_concept: 5, distractor_concepts: 6, min_headroom: 30 };
const PROBE_TYPES = ["recall", "reconstruct", "defend", "novel", "negative-space"];

// concepts worth drilling: weak first, locked capsules as the floor (Re-Jirah fodder)
function drillConcepts(deps = {}) {
  const out = [];
  const cal = deps.calibration !== undefined ? deps.calibration : readJson(join(STATE_DIR, "calibration.json"));
  for (const d of (cal && cal.danger_zone) || []) out.push({ concept: d.topic || d.concept, why: "danger zone" });
  const ls = deps.ls !== undefined ? deps.ls : readJson(join(STATE_DIR, "learning_state.json"));
  for (const c of ((ls && ls.concepts) || [])) if (["stalling", "regressing", "learning"].includes(String(c.trend || c.trajectory || c.stage || ""))) out.push({ concept: c.name || c.concept, why: c.trend || c.stage });
  try {
    for (const f of (deps.capsuleFiles || readdirSync(join(STATE_DIR, "capsules")).filter(f => f.endsWith(".json"))))
      out.push({ concept: f.replace(".json", ""), why: "locked capsule (decay-guard drilling)" });
  } catch { }
  const seen = new Set();
  return out.filter(c => c.concept && !seen.has(c.concept) && seen.add(c.concept));
}

// ---------------------------------------------------------------------------
// JOB 1 — THE PROBE BANK (validated JSON; junk rejected per-item)
// ---------------------------------------------------------------------------
async function probeBank(deps = {}) {
  const gen = deps.generate || ((p) => generatePool(p, { models: ["gemini-flash-latest"], maxOutputTokens: 3000, json: true }));
  const use = deps.recordUse || recordUse;
  const grammar = deps.grammar !== undefined ? deps.grammar : readJson(join(STATE_DIR, "dossier_weights.json"));
  const concepts = (deps.concepts || drillConcepts(deps)).slice(0, CAPS.probe_concepts);
  const bank = {};
  let spent = 0;
  for (const c of concepts) {
    const r = await gen(`Generate exactly ${CAPS.probes_per_concept} INTERVIEW PROBES for the concept "${c.concept}" for an AI Product Engineer candidate. One per type: ${PROBE_TYPES.join(", ")}. negative-space = "when would you NOT use it". Output STRICT JSON array, no fences: [{"type":"...","probe":"<the question, <=200 chars, interviewer voice>"}]${grammar && grammar.probe_types ? `\nMatch this club's probe grammar where possible: ${JSON.stringify(Object.keys(grammar.probe_types))}` : ""}`);
    use("T7", 1, 3000); spent++;
    if (!r.ok) continue;
    try {
      const raw = String(r.text); const s = raw.indexOf("["), e = raw.lastIndexOf("]");
      const arr = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
      const valid = arr.filter(p => p && typeof p.probe === "string" && p.probe.length > 15 && PROBE_TYPES.includes(p.type));
      if (valid.length) bank[c.concept] = { why: c.why, probes: valid.slice(0, CAPS.probes_per_concept) };
    } catch { }
  }
  return { bank, spent };
}

// ---------------------------------------------------------------------------
// JOB 2 — PERSONALIZED DISTRACTORS (his own confusion shapes make the wrong answers)
// ---------------------------------------------------------------------------
async function distractorBank(deps = {}) {
  const gen = deps.generate || ((p) => generatePool(p, { models: ["gemini-flash-latest"], maxOutputTokens: 2500, json: true }));
  const use = deps.recordUse || recordUse;
  const grammar = deps.grammar !== undefined ? deps.grammar : readJson(join(STATE_DIR, "doubt_grammar.json"));
  const shapes = ((grammar && grammar.clusters) || []).map(c => c.shape || c.name).filter(Boolean).slice(0, 5);
  const concepts = (deps.concepts || drillConcepts(deps)).slice(0, CAPS.distractor_concepts);
  const bank = {};
  let spent = 0;
  for (const c of concepts) {
    const r = await gen(`For the concept "${c.concept}", write exactly 3 DISTRACTORS — answers that are PLAUSIBLE-BUT-WRONG in ways a learner actually gets wrong${shapes.length ? ` (this learner's real confusion shapes: ${shapes.join("; ")})` : ""}. Output STRICT JSON array, no fences: [{"distractor":"<the wrong-but-tempting claim, <=160 chars>","why_wrong":"<the precise crack, <=120 chars>"}]`);
    use("T7", 1, 2500); spent++;
    if (!r.ok) continue;
    try {
      const raw = String(r.text); const s = raw.indexOf("["), e = raw.lastIndexOf("]");
      const arr = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
      const valid = arr.filter(d => d && typeof d.distractor === "string" && typeof d.why_wrong === "string" && d.distractor.length > 10);
      if (valid.length) bank[c.concept] = valid.slice(0, 3);
    } catch { }
  }
  return { bank, spent };
}

// ---------------------------------------------------------------------------
// JOB 4 — THE SCOUT PACK (deterministic; the Pro account is a HUMAN surface)
// ---------------------------------------------------------------------------
function scoutPack(deps = {}, now = new Date()) {
  const dossier = deps.dossier !== undefined ? deps.dossier : readJson(join(STATE_DIR, "dossier_weights.json"));
  const cal = deps.calibration !== undefined ? deps.calibration : readJson(join(STATE_DIR, "calibration.json"));
  const who = deps.who !== undefined ? deps.who : readJson(join(__dirname, "..", "dressing-room", "hippocampus", "who_he_is.json"));
  const cracks = [...((cal && cal.danger_zone) || []).map(d => d.topic || d.concept), ...((who && who.recent_cracks) || [])].filter(Boolean).slice(0, 3);
  const threads = ((who && who.open_threads) || []).slice(0, 2);
  const rounds = ((dossier && dossier.rounds) || []).map(r => r.id).join(", ") || "system_design, build, production_eval, fundamentals";
  const prompts = [];
  if (cracks.length) prompts.push(`Deep-research the current (2026) industry best practice, common interview probes, and production war stories around: ${cracks.join("; ")}. For each: the mechanism, the top-3 interviewer follow-ups at AI Product Engineer level, and one real incident/postmortem worth citing.`);
  if (threads.length) prompts.push(`Deep-research this open technical question end to end, with primary sources and the 2026 state of the art: ${threads.join(" · ")}. End with the 5-sentence answer a staff engineer would accept.`);
  prompts.push(`Deep-research the current AI Product Engineer interview landscape in India (₹20-25 LPA band, 2026): the live round formats (${rounds}), what changed in the last 6 months, and the 10 most-asked build/eval questions with model answers.`);
  const md = [
    `# THE SCOUT PACK · ${localDate(now)}`,
    `*Ready-to-paste DEEP RESEARCH prompts for the Pro account (T5 — a human surface; no API exists, and that's fine: perfect preparation is the machine's half). Run → export/copy the result → throw-in or paste-session it back; the doubtminer and capture take it from there.*`,
    "",
    ...prompts.map((p, i) => `## Prompt ${i + 1}\n\`\`\`\n${p}\n\`\`\`\n`),
  ].join("\n");
  return { md, prompts: prompts.length };
}

// ---------------------------------------------------------------------------
// JOB 5 — THE GEM CARTRIDGE (his examiner-on-the-phone, always current)
// ---------------------------------------------------------------------------
function gemCartridge(deps = {}, now = new Date()) {
  const who = deps.who !== undefined ? deps.who : readJson(join(__dirname, "..", "dressing-room", "hippocampus", "who_he_is.json"));
  const cal = deps.calibration !== undefined ? deps.calibration : readJson(join(STATE_DIR, "calibration.json"));
  const caps = deps.capsuleFiles || (() => { try { return readdirSync(join(STATE_DIR, "capsules")).filter(f => f.endsWith(".json")).map(f => f.replace(".json", "")); } catch { return []; } })();
  const bank = deps.probeBank || readJson(join(OUT_DIR, `probe_bank_${localDate(now)}.json`));
  const md = [
    `# GEM CARTRIDGE · ${localDate(now)} — paste into your Gem's instructions (your own data → your own Google account)`,
    "",
    `You are my interview examiner. Locked concepts (probe these for decay): ${caps.join(", ") || "none yet"}.`,
    who && who.fingerprint ? `Where I stand right now: ${who.fingerprint}` : "",
    ((who && who.open_threads) || []).length ? `Open threads to attack: ${who.open_threads.join(" · ")}` : "",
    ((cal && cal.danger_zone) || []).length ? `My confident-but-wrong zone (drill these HARDEST): ${cal.danger_zone.map(d => d.topic || d.concept).join(", ")}` : "",
    "",
    "RULES: one probe at a time · demand my gut-word (knew/shaky/guessed) BEFORE I answer · honest verdicts, no flattery · after each session output a JSON array of reps: [{\"concept\",\"axis\",\"question\",\"confidence\",\"correct\"}] so I can paste it into my capture system.",
    bank && Object.keys(bank.bank || bank).length ? `\nFRESH PROBES (tonight's bank — use these first):\n${Object.entries(bank.bank || bank).slice(0, 4).map(([c, v]) => `- ${c}: ${(v.probes || []).slice(0, 2).map(p => p.probe).join(" · ")}`).join("\n")}` : "",
  ].filter(Boolean).join("\n");
  return { md };
}

// ---------------------------------------------------------------------------
// JOB 6 — GATE TUNE (report-only: the gate NEVER retunes itself)
// ---------------------------------------------------------------------------
function gateTuneReport(rows, now = new Date()) {
  const recent = rows.slice(-200);
  if (recent.length < 20) return { md: null, why: `only ${recent.length} gate decisions — the tuner stays silent under 20 (an early false alarm is worse than a missed one)` };
  const wakes = recent.filter(r => r.tier === 2).length;
  const capped = recent.filter(r => r.outcome === "capped").length;
  const refr = recent.filter(r => r.outcome === "refractory").length;
  const adjUp = recent.filter(r => r.outcome === "adjudicated_up").length;
  const adjDown = recent.filter(r => r.outcome === "adjudicated_down").length;
  const lines = [`# GATE TUNE PROPOSAL · ${localDate(now)} (report-only — thalamus_config.json changes are YOURS to approve)`, "", `sample: last ${recent.length} decisions · wakes ${wakes} · capped ${capped} · refractory ${refr} · ε-band ${adjUp + adjDown} (up ${adjUp} / down ${adjDown})`];
  if (capped > wakes) lines.push(`- the daily wake_cap bound ${capped} genuine surprises — consider wake_cap_per_day +5 OR tau1_base +0.05 (fewer, sharper wakes).`);
  if (refr > wakes * 2) lines.push(`- refractory suppressed ${refr} repeats — the same doubts keep re-firing; that's a CURRICULUM signal (drill them), not a threshold problem.`);
  if (adjDown > 3 * Math.max(1, adjUp)) lines.push(`- the ε-band adjudicator says no ${adjDown}:${adjUp} — tau1_base likely sits ~ε too low; consider +${(0.02).toFixed(2)}.`);
  if (wakes === 0) lines.push(`- ZERO wakes in the sample — either a quiet stretch (fine) or tau1 too high for real life; watch one more week before touching anything.`);
  if (lines.length === 3) lines.push(`- the gate looks healthy; no change proposed.`);
  return { md: lines.join("\n"), why: null };
}

// ---------------------------------------------------------------------------
// THE SHIFT
// ---------------------------------------------------------------------------
function isOvernight(now = new Date()) { const h = now.getHours(); return h >= 1 && h < 7; }
async function runShift(deps = {}) {
  const now = deps.now || new Date();
  const tone = deps.tone || currentTone();
  if (!deps.force && !isOvernight(now)) return { ok: false, skipped: "not overnight — the shift works while he sleeps (--force to override)" };
  if (tone.arousal === "conserve") return { ok: false, skipped: "conserve tone — a depleted captain's machine also rests" };
  const board = deps.board || loadBoard();
  const t7 = board.tanks.find(t => t.id === "T7");
  if (headroomOf(t7) < CAPS.min_headroom) return { ok: false, skipped: `T7 headroom ${headroomOf(t7)} < ${CAPS.min_headroom} — nothing idle to convert` };
  const day = localDate(now);
  const out = { date: day, jobs: {} };
  const write = deps.write || ((name, content) => writeAtomic(join(OUT_DIR, name), content));

  const pb = await probeBank(deps);
  if (Object.keys(pb.bank).length) write(`probe_bank_${day}.json`, { date: day, bank: pb.bank });
  out.jobs.probe_bank = { concepts: Object.keys(pb.bank).length, spent: pb.spent };

  const db = await distractorBank(deps);
  if (Object.keys(db.bank).length) write(`distractor_bank_${day}.json`, { date: day, bank: db.bank });
  out.jobs.distractors = { concepts: Object.keys(db.bank).length, spent: db.spent };

  let backfilled = 0;
  if (!deps.skipBackfill) {
    for (let i = 0; i < 20; i++) { const n = await indexRecall().catch(() => 0); backfilled += n; if (!n) break; }
    backfilled += await indexEpisodes().catch(() => 0);
  }
  out.jobs.embed_backfill = { chunks: backfilled };

  const sp = scoutPack(deps, now);
  write("scout_pack.md", sp.md);
  out.jobs.scout_pack = { prompts: sp.prompts };

  const gc = gemCartridge({ ...deps, probeBank: Object.keys(pb.bank).length ? { bank: pb.bank } : undefined }, now);
  write("gem_cartridge.md", gc.md);
  out.jobs.gem_cartridge = { ok: true };

  const gt = gateTuneReport(deps.ledgerRows || readLines(join(STATE_DIR, "salience_ledger.jsonl")), now);
  if (gt.md) write(`gate_tune_${day}.md`, gt.md);
  out.jobs.gate_tune = gt.md ? { proposed: true } : { silent: gt.why };

  write(`shift_${day}.json`, out);
  return { ok: true, ...out };
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const genProbes = async () => ({ ok: true, text: JSON.stringify(PROBE_TYPES.map(t => ({ type: t, probe: `a solid ${t} probe with enough length to pass validation` }))) });
  const genBad = async () => ({ ok: true, text: '[{"type":"vibes","probe":"x"},{"probe":123}]' });
  const base = { force: true, tone: { arousal: "open", effects: {} }, board: { tanks: [{ id: "T7", quota_est: 250, observed_ceiling: 0, used_today: 0, enabled: true, key_index: 5 }] }, recordUse: () => {}, skipBackfill: true, write: () => {}, ledgerRows: [], concepts: [{ concept: "tokenization", why: "capsule" }], grammar: null, calibration: null, ls: null, who: null, dossier: null, capsuleFiles: ["tokenization.json"], now: new Date("2026-07-15T02:45:00") };

  // gates
  assert("daytime → no shift (it works while he sleeps)", (await runShift({ ...base, force: false, now: new Date("2026-07-15T14:00:00") })).skipped.includes("not overnight"));
  assert("conserve tone → no shift (the machine rests too)", (await runShift({ ...base, tone: { arousal: "conserve", effects: {} } })).skipped.includes("conserve"));
  assert("no T7 headroom → nothing to convert", (await runShift({ ...base, board: { tanks: [{ id: "T7", quota_est: 30, observed_ceiling: 0, used_today: 29, enabled: true, key_index: 5 }] } })).skipped.includes("headroom"));

  // the jobs
  {
    const writes = {};
    const r = await runShift({ ...base, generate: genProbes, write: (n, c) => { writes[n] = c; } });
    assert("the shift runs all six jobs and files the shift record", r.ok && writes["shift_2026-07-15.json"] && r.jobs.probe_bank && r.jobs.gem_cartridge);
    assert("probe bank: one per grammar type, validated, dated", writes["probe_bank_2026-07-15.json"].bank.tokenization.probes.length === 5);
    assert("distractors: personalized shape rides when grammar exists", r.jobs.distractors.spent >= 1);
    assert("scout pack: ready-to-paste Deep Research prompts for the Pro lane", writes["scout_pack.md"].includes("Deep-research") && writes["scout_pack.md"].includes("paste"));
    assert("gem cartridge: gut-word law + reps-JSON contract travel to the phone", writes["gem_cartridge.md"].includes("knew/shaky/guessed") && writes["gem_cartridge.md"].includes("paste"));
    assert("gate tuner: silent under 20 decisions (no early false alarms)", r.jobs.gate_tune.silent && r.jobs.gate_tune.silent.includes("20"));
  }
  // validation honesty
  {
    const pb = await probeBank({ ...base, generate: genBad });
    assert("junk probes REJECTED per-item (code validates, junk never banked)", Object.keys(pb.bank).length === 0);
  }
  // the tuner speaks with data
  {
    const rows = Array.from({ length: 60 }, (_, i) => ({ tier: i % 10 === 0 ? 2 : 1, outcome: i % 10 === 0 ? "wake" : i % 3 === 0 ? "capped" : "enrich" }));
    const gt = gateTuneReport(rows);
    assert("with 20+ decisions the tuner PROPOSES (report-only, human approves)", gt.md && gt.md.includes("report-only") && gt.md.includes("wake_cap"));
    const quiet = gateTuneReport(Array.from({ length: 30 }, () => ({ tier: 0, outcome: "reflex" })));
    assert("zero wakes → 'watch a week', never a knee-jerk retune", quiet.md.includes("watch one more week"));
  }
  // concept sourcing
  {
    const c = drillConcepts({ calibration: { danger_zone: [{ topic: "eval metrics" }] }, ls: { concepts: [{ name: "rag", trend: "stalling" }] }, capsuleFiles: ["tokenization.json", "embeddings.json"] });
    assert("concepts: danger zone > stalling > locked capsules, deduped", c[0].concept === "eval metrics" && c[1].concept === "rag" && c.some(x => x.concept === "tokenization"));
    assert("Day-0 floor: locked capsules alone still make a bank (dormant-safe)", drillConcepts({ calibration: null, ls: null, capsuleFiles: ["context.json"] }).length === 1);
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    const s = readJson(join(OUT_DIR, `shift_${localDate()}.json`));
    console.log(s ? `nightshift: last shift ${s.date} — ${JSON.stringify(s.jobs)}` : "nightshift: no shift filed today");
    return;
  }
  const r = await runShift({ force: process.argv.includes("--force") });
  console.log(r.ok ? `nightshift: shift complete — ${JSON.stringify(r.jobs)}` : `nightshift: ${r.skipped}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { runShift, probeBank, distractorBank, scoutPack, gemCartridge, gateTuneReport, drillConcepts, isOvernight, CAPS };
