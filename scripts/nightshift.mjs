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
//        7. PRE-ANSWER ENGINE (M17) — predicts his 15-25 likely NEXT doubts
//                          (doubt-grammar shapes + 7-day afferents + FSRS-due
//                          + danger zone), answers each in the DOSSIER's own
//                          grammar on the free pool, embeds, and loads
//                          answer_cache.jsonl — tomorrow's doubt arrives
//                          ALREADY ANSWERED (the thalamus cosine-attaches it
//                          as a non-spoken hint; the mouth gate decides).
// LAWS:  fires overnight (or --force) · conserve tone = no shift (rest) ·
//        spends ONLY fuelboard headroom, hard-capped per job · every output
//        validated by code, junk rejected · all outputs land in gitignored
//        brain_out/nightshift/ (job 7: gitignored answer_cache.jsonl — its
//        sole writer; it names his doubts) · zero writes to any organ's file.
// MODES: node scripts/nightshift.mjs [--force] · status · selftest
// ============================================================================

import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generatePool, embedPool } from "./hippocampus.mjs";
import { loadBoard, headroomOf, recordUse } from "./fuelboard.mjs";
import { currentTone } from "./tone.mjs";
import { indexRecall } from "./dugout.mjs";
import { indexEpisodes } from "./hippocampus.mjs";
// job 7 rides the brain's own honest-frame validator (proven code, reused)
import { loadConfig as loadBrainConfig, bannedPhraseCheck } from "./brain.mjs";

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

const CAPS = { probe_concepts: 6, probes_per_concept: 5, distractor_concepts: 6, min_headroom: 30, pre_answer_max: 25 };
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
// JOB 7 — THE PRE-ANSWER ENGINE (M17): his doubt arrives already answered.
// Predict the 15-25 doubts he is most likely to voice next (from REAL signal
// only), answer each in the DOSSIER grammar on the free pool, embed the
// doubts, load answer_cache.jsonl. The thalamus serves it (cosine-attach,
// non-spoken, mouth gate untouched) — zero latency, zero Opus, rep captured
// while the confusion is hot. Sole writer of answer_cache.jsonl.
// ---------------------------------------------------------------------------
function preAnswerMaterial(deps = {}, now = new Date()) {
  const grammar = deps.grammar !== undefined ? deps.grammar : readJson(join(STATE_DIR, "doubt_grammar.json"));
  const clusters = ((grammar && grammar.clusters) || []).map(c => ({ shape: c.shape, examples: (c.examples || []).slice(0, 3).map(e => e.q_first_80 || "").filter(Boolean) }));
  const weekAgo = now.getTime() - 7 * 86400000;
  const aff = (deps.afferents || readLines(join(STATE_DIR, "afferent.jsonl"))).filter(a => new Date(a.ts || 0).getTime() >= weekAgo);
  const voiced = aff.filter(a => a.modality === "voice" && a.text).map(a => String(a.text).slice(0, 120)).slice(-30);
  const tokens = {};
  for (const a of aff) for (const t of a.concept_tokens || []) tokens[t] = (tokens[t] || 0) + 1;
  const hotTokens = Object.entries(tokens).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);
  const cards = deps.cards !== undefined ? deps.cards : readJson(join(STATE_DIR, "cards.json"));
  const due = ((cards && (cards.hardest_due || cards.due || [])) || []).map(d => typeof d === "string" ? d : (d.concept || d.topic)).filter(Boolean).slice(0, 8);
  const cal = deps.calibration !== undefined ? deps.calibration : readJson(join(STATE_DIR, "calibration.json"));
  const danger = ((cal && cal.danger_zone) || []).map(d => d.topic || d.concept).filter(Boolean);
  const who = deps.who !== undefined ? deps.who : readJson(join(__dirname, "..", "dressing-room", "hippocampus", "who_he_is.json"));
  const threads = ((who && who.open_threads) || []).slice(0, 5);
  return { clusters, voiced, hotTokens, due, danger, threads };
}

async function preAnswerEngine(deps = {}) {
  const now = deps.now || new Date();
  // thinking models spend thoughts from the SAME output budget — the 25-item
  // predict needs real room or the wire returns an empty candidate (probed live)
  const gen = deps.generate || ((p, big) => generatePool(p, { models: ["gemini-flash-latest"], maxOutputTokens: big ? 16384 : 8192, json: true }));
  const use = deps.recordUse || recordUse;
  const material = deps.material || preAnswerMaterial(deps, now);
  if (!(material.clusters.length || material.voiced.length || material.due.length || material.danger.length || material.threads.length)) {
    return { ok: false, skipped: "no real signal on the bus — never predict doubts from nothing" };
  }
  // 1 — PREDICT (one call): the doubts he is MOST LIKELY to voice next
  const pr = await gen(`You predict the NEXT doubts of one specific learner (an AI Product Engineer candidate) from his real signals. His confusion SHAPES (mined from his real captured doubts): ${JSON.stringify(material.clusters).slice(0, 2500)}. His last-7-days spoken fragments: ${JSON.stringify(material.voiced).slice(0, 3000)}. Concepts hot this week: ${material.hotTokens.join(", ") || "—"}. Due for review (decay risk): ${material.due.join(", ") || "—"}. Confident-but-wrong zone: ${material.danger.join(", ") || "—"}. Open threads: ${material.threads.join(" · ") || "—"}.
Predict the ${CAPS.pre_answer_max} doubts he is MOST LIKELY to voice next — concrete, first-person, in his idiom (Hinglish fine), each anchored to one concept. Output STRICT JSON array, no fences: [{"concept":"<one concept>","doubt":"<the doubt as HE would voice it, 15-140 chars>"}]`, true);
  use("T7", 1, 4000);
  if (!pr.ok) return { ok: false, skipped: "prediction lane dry — no cache tonight" };
  let predicted = [];
  try {
    const raw = String(pr.text); const s = raw.indexOf("["), e = raw.lastIndexOf("]");
    predicted = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw)
      .filter(d => d && typeof d.doubt === "string" && d.doubt.length >= 12 && typeof d.concept === "string" && d.concept)
      .slice(0, CAPS.pre_answer_max);
  } catch { }
  if (!predicted.length) return { ok: false, skipped: "prediction unparseable — junk never enters the cache" };
  // 2 — ANSWER each in the DOSSIER grammar (validated per-item; junk rejected)
  const banned = deps.bannedPhrases !== undefined ? deps.bannedPhrases : (((loadBrainConfig() || {}).guards || {}).banned_phrases || []);
  const entries = [];
  let spent = 1;
  for (const d of predicted) {
    const r = await gen(`Answer this learner's doubt COMPLETELY, in the club's DOSSIER grammar. The doubt (his voice): "${d.doubt}" — concept: ${d.concept}.
Structure (dense, ≤170 words, no preamble): (1) the mechanism, named plainly; (2) one worked micro-example with real small numbers; (3) where it breaks / the limit; (4) the trade-off a staff engineer would name; (5) ONE reframe that dissolves this exact confusion, speakable, Hinglish welds welcome. Honest frame only — never hype, never a shame word. Output STRICT JSON, no fences: {"answer":"<the full answer>"}`);
    use("T7", 1, 3500); spent++;
    if (!r.ok) continue;
    try {
      const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
      const obj = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
      const answer = String(obj.answer || "");
      if (answer.length < 80) continue;                        // too thin to pre-load
      if (bannedPhraseCheck(answer, banned).length) continue;  // honest frame or nothing
      entries.push({ id: `pa_${localDate(now)}_${entries.length}`, date: localDate(now), concept: String(d.concept).slice(0, 80), doubt: String(d.doubt).slice(0, 200), answer: answer.slice(0, 1400), vec: null });
    } catch { }
  }
  if (!entries.length) return { ok: false, skipped: "every answer failed validation — cache untouched" };
  // 3 — EMBED the doubts (T6 lane) so the thalamus can cosine-attach; dry →
  // vec null, the serve side's word-overlap floor still works (layering)
  const embed = deps.embed || embedPool;
  const vecs = await embed(entries.map(e => `${e.concept}: ${e.doubt}`)).catch(() => null);
  let embedded = 0;
  if (vecs) entries.forEach((e, i) => { if (vecs[i]) { e.vec = vecs[i]; embedded++; } });
  (deps.writeCache || ((rows) => writeAtomic(join(STATE_DIR, "answer_cache.jsonl"), rows.map(x => JSON.stringify(x)).join("\n") + "\n")))(entries);
  return { ok: true, predicted: predicted.length, answered: entries.length, embedded, spent };
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

  const pa = await preAnswerEngine(deps);
  out.jobs.pre_answers = pa.ok ? { predicted: pa.predicted, answered: pa.answered, embedded: pa.embedded, spent: pa.spent } : { skipped: pa.skipped };

  write(`shift_${day}.json`, out);
  return { ok: true, ...out };
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const genProbes = async () => ({ ok: true, text: JSON.stringify(PROBE_TYPES.map(t => ({ type: t, probe: `a solid ${t} probe with enough length to pass validation` }))) });
  const genBad = async () => ({ ok: true, text: '[{"type":"vibes","probe":"x"},{"probe":123}]' });
  const base = { force: true, tone: { arousal: "open", effects: {} }, board: { tanks: [{ id: "T7", quota_est: 250, observed_ceiling: 0, used_today: 0, enabled: true, key_index: 5 }] }, recordUse: () => {}, skipBackfill: true, write: () => {}, ledgerRows: [], concepts: [{ concept: "tokenization", why: "capsule" }], grammar: null, calibration: null, ls: null, who: null, dossier: null, capsuleFiles: ["tokenization.json"], afferents: [], cards: null, bannedPhrases: ["10x"], now: new Date("2026-07-15T02:45:00") };

  // gates
  assert("daytime → no shift (it works while he sleeps)", (await runShift({ ...base, force: false, now: new Date("2026-07-15T14:00:00") })).skipped.includes("not overnight"));
  assert("conserve tone → no shift (the machine rests too)", (await runShift({ ...base, tone: { arousal: "conserve", effects: {} } })).skipped.includes("conserve"));
  assert("no T7 headroom → nothing to convert", (await runShift({ ...base, board: { tanks: [{ id: "T7", quota_est: 30, observed_ceiling: 0, used_today: 29, enabled: true, key_index: 5 }] } })).skipped.includes("headroom"));

  // the jobs
  {
    const writes = {};
    const r = await runShift({ ...base, generate: genProbes, write: (n, c) => { writes[n] = c; } });
    assert("the shift runs all seven jobs and files the shift record", r.ok && writes["shift_2026-07-15.json"] && r.jobs.probe_bank && r.jobs.gem_cartridge && "pre_answers" in r.jobs);
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

  // JOB 7 — THE PRE-ANSWER ENGINE (M17)
  {
    const material = { clusters: [{ shape: "scale_intuition_failure", examples: ["per step compute cost"] }], voiced: ["kv cache samajh nahi aata"], hotTokens: ["attention"], due: ["context windows"], danger: ["eval metrics"], threads: [] };
    const genPA = async (p) => p.includes("Predict the") ?
      { ok: true, text: JSON.stringify([{ concept: "kv cache", doubt: "kv cache hai toh attention quadratic kyun?" }, { concept: "x", doubt: "short" }]) } :
      { ok: true, text: JSON.stringify({ answer: "The cache stores K and V for every PAST token so you skip recomputing them — but the NEW token still takes a dot product against all n of them. Example: n=4, the 5th token does 4 handshakes; caching saved the re-derivation, not the meetings." }) };
    let saved = null, uses = 0;
    const r = await preAnswerEngine({ material, generate: genPA, recordUse: () => uses++, embed: async (ts) => ts.map(() => [1, 0]), writeCache: (rows) => { saved = rows; }, bannedPhrases: ["10x"], now: new Date("2026-07-15T02:50:00") });
    assert("PRE-ANSWER: predicts doubts, answers in DOSSIER grammar, embeds, caches", r.ok && saved.length === 1 && Array.isArray(saved[0].vec) && saved[0].doubt.includes("quadratic") && saved[0].answer.includes("handshakes"));
    assert("PRE-ANSWER: junk predictions rejected per-item (doubt too short)", r.predicted === 1 && r.answered === 1);
    assert("PRE-ANSWER: every spend recorded on the free pool", uses === r.spent && r.spent === 2);
    const rB = await preAnswerEngine({ material, generate: async (p) => p.includes("Predict the") ? { ok: true, text: JSON.stringify([{ concept: "c", doubt: "why does this scale so badly here?" }]) } : { ok: true, text: JSON.stringify({ answer: "This will 10x your intuition about scaling, honestly. ".repeat(4) }) }, recordUse: () => {}, embed: async () => null, writeCache: () => { throw new Error("must not write"); }, bannedPhrases: ["10x"], now: new Date("2026-07-15T02:50:00") });
    assert("PRE-ANSWER: banned-phrase answers REJECTED (honest frame or nothing)", rB.ok === false && rB.skipped.includes("validation"));
    const rE = await preAnswerEngine({ material: { clusters: [], voiced: [], hotTokens: [], due: [], danger: [], threads: [] }, generate: async () => { throw new Error("must not be called"); }, bannedPhrases: [] });
    assert("PRE-ANSWER: no real signal → honest skip (never predicts from nothing)", rE.ok === false && rE.skipped.includes("nothing"));
    let savedDry = null;
    const rD = await preAnswerEngine({ material, generate: genPA, recordUse: () => {}, embed: async () => null, writeCache: (rows) => { savedDry = rows; }, bannedPhrases: [], now: new Date("2026-07-15T02:50:00") });
    assert("PRE-ANSWER: embed lane dry → cache still lands (vec null, overlap floor serves)", rD.ok && savedDry[0].vec === null && rD.embedded === 0);
  }
  // job 7 material: only the last 7 days of afferents ride
  {
    const m = preAnswerMaterial({ afferents: [
      { modality: "voice", text: "old doubt", ts: "2026-07-01T10:00:00Z" },
      { modality: "voice", text: "fresh doubt", ts: "2026-07-14T10:00:00Z", concept_tokens: ["kv"] },
    ], grammar: null, cards: null, calibration: null, who: null }, new Date("2026-07-15T02:00:00"));
    assert("PRE-ANSWER material: 7-day afferent window, hot tokens counted", m.voiced.length === 1 && m.voiced[0] === "fresh doubt" && m.hotTokens.includes("kv"));
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

export { runShift, probeBank, distractorBank, scoutPack, gemCartridge, gateTuneReport, preAnswerEngine, preAnswerMaterial, drillConcepts, isOvernight, CAPS };
