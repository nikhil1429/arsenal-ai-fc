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
//        6. GATE TUNE    — M21 THE WIND TUNNEL: a deterministic counterfactual
//                          REPLAY of the salience ledger over a grid of tier
//                          configs (zero LLM, ms-fast) → a bootroom-grammar
//                          proposal with evidence, predicted effect, metric
//                          and revert. Report-only: AI/code proposes · HUMAN
//                          applies to thalamus_config.json — the gate never
//                          retunes itself. Under 200 decisions the frozen
//                          heuristic (gateTuneReport) still reports (layering).
//        8. SEASON RE-READ (M18) — the impossible coach: the ENTIRE corpus
//                          (capsules · his transcripts · afferents · episodes)
//                          rides ONE long-context call nightly → contradictions,
//                          open-never-closed threads, cross-week confusion
//                          edges → season_read.json (sole writer) → the
//                          Manager's sheet + set-piece drills consume it.
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
// job 6 (the wind tunnel) replays the gate's own recorded decisions
import { loadConfig as loadThalamusConfig } from "./thalamus.mjs";

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
// JOB 1b — M23 DIFFICULTY GRADING: the bank answers its own probes, k=3 at
// t=0.9 on the free lane + 1 pro attempt (403 on free keys → flash, honest).
// The VARIANCE across the answers is the difficulty: when four attempts
// diverge, the probe sits on contested ground — exactly where a scrimmage
// earns the most. Probes sort hardest-first; the scrimmage takes from the top.
// Only the scrimmage's own ground (novel / negative-space) is graded, capped.
// ---------------------------------------------------------------------------
const GRADE = { probes_per_night: 6, k: 3, temp: 0.9 };
function answerVariance(answers) {
  if (!answers || answers.length < 2) return 0;
  let sum = 0, n = 0;
  for (let i = 0; i < answers.length; i++) for (let j = i + 1; j < answers.length; j++) {
    const A = new Set(String(answers[i]).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 4));
    const B = new Set(String(answers[j]).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 4));
    const inter = [...A].filter(w => B.has(w)).length;
    const uni = new Set([...A, ...B]).size || 1;
    sum += 1 - inter / uni; n++;
  }
  return Math.round((sum / n) * 100) / 100;           // 0 = every attempt agrees · 1 = disjoint ground
}
async function gradeProbes(bank, deps = {}) {
  const use = deps.recordUse || recordUse;
  const genHot = deps.generateHot || ((p) => generatePool(p, { models: ["gemini-flash-latest"], maxOutputTokens: 2048, temperature: GRADE.temp }));
  const genPro = deps.generatePro || ((p) => generatePool(p, { models: ["gemini-3.1-pro-preview", "gemini-flash-latest"], maxOutputTokens: 2048 }));
  const targets = [];
  for (const [concept, v] of Object.entries(bank || {})) for (const pr of v.probes || []) {
    if (["novel", "negative-space"].includes(pr.type)) targets.push({ concept, probe: pr });
  }
  const batch = targets.slice(0, GRADE.probes_per_night);
  let spent = 0, graded = 0;
  for (const t of batch) {
    const q = `Answer this interview probe as a strong AI Product Engineer candidate, in ≤120 words, no preamble: "${t.probe.probe}"`;
    const answers = [];
    for (let i = 0; i < GRADE.k; i++) {
      const r = await genHot(q).catch(() => ({ ok: false }));
      use("T7", 1, 2000); spent++;
      if (r.ok && r.text) answers.push(r.text);
    }
    const rp = await genPro(q).catch(() => ({ ok: false }));
    use("T5", 1, 2000); spent++;
    if (rp.ok && rp.text) answers.push(rp.text);
    if (answers.length >= 2) { t.probe.difficulty = answerVariance(answers); t.probe.graded = answers.length; graded++; }
  }
  // hardest ground first — every consumer naturally takes from the top
  for (const v of Object.values(bank || {})) if (v.probes) v.probes.sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0));
  return { graded, spent };
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
// JOB 6 — M21 THE WIND TUNNEL (report-only: the gate NEVER retunes itself).
// Every ledger row already carries S, headroom_frac, key, ts — so any tier
// config can be replayed EXACTLY, offline, in milliseconds. The ε-band
// resolves DOWN in replay (the tiny model's verdict is unknowable offline —
// conservative, stated in the proposal). Output rides the boot room's own
// mutation grammar so the captain reviews it like any gene.
// ---------------------------------------------------------------------------
const TUNNEL = { band: [1, 8], min_sample: 200, hysteresis_frac: 0.9, hysteresis_abs: 0.5 };

function replayGate(rows, tiers, refractoryMin = 45, capPerDay = 15) {
  const wakeKeys = new Map();
  const days = new Set();
  const m = { wakes: 0, capped: 0, refractory: 0, adjudications: 0, tier0: 0, tier1: 0, rows: 0 };
  let wakesToday = 0, curDay = null;
  for (const r of rows || []) {
    if (!r || !Number.isFinite(r.S)) continue;
    m.rows++;
    const day = r.day || String(r.ts || "").slice(0, 10);
    days.add(day);
    if (day !== curDay) { curDay = day; wakesToday = 0; }
    const hf = Math.max(0, Math.min(1, Number.isFinite(r.headroom_frac) ? r.headroom_frac : 1));
    const t1 = tiers.tau1_base + (tiers.budget_k || 0) * (1 - hf);
    let tier = r.S < tiers.tau0 ? 0 : 1;
    if (Math.abs(r.S - t1) < tiers.epsilon) { m.adjudications++; tier = Math.max(tier, 1); }
    else if (r.S >= t1) tier = 2;
    if (tier === 2) {
      const ts = new Date(r.ts || 0).getTime();
      const last = wakeKeys.get(r.key);
      if (last && ts - last < refractoryMin * 60000) { m.refractory++; tier = 1; }
      else if (wakesToday >= capPerDay) { m.capped++; tier = 1; }
      else { m.wakes++; wakesToday++; wakeKeys.set(r.key, ts); }
    }
    if (tier === 0) m.tier0++; else if (tier === 1) m.tier1++;
  }
  m.days = Math.max(1, days.size);
  m.wakes_per_day = Math.round((m.wakes / m.days) * 100) / 100;
  return m;
}
function tunnelScore(m, band) {
  const pen = m.wakes_per_day < band[0] ? band[0] - m.wakes_per_day : m.wakes_per_day > band[1] ? m.wakes_per_day - band[1] : 0;
  return Math.round((pen * 100 + m.capped * 2 + m.adjudications) * 100) / 100;
}
function windTunnel(rows, thalCfg, opts = {}) {
  const t = { ...TUNNEL, ...opts };
  const usable = (rows || []).filter(r => r && Number.isFinite(r.S));
  if (usable.length < t.min_sample) return { proposal: null, why: `only ${usable.length} gate decisions — the tunnel needs ${t.min_sample} (an early retune is worse than a late one)` };
  const cur = thalCfg.tiers;
  const refr = thalCfg.refractory_min || 45, cap = thalCfg.wake_cap_per_day || 15;
  const base = replayGate(usable, cur, refr, cap);
  const baseScore = tunnelScore(base, t.band);
  // the grid — tiers only; budget_k is the budget-coupling LAW's knob, his call
  const cands = [];
  for (const d0 of [-0.05, 0, 0.05]) for (const d1 of [-0.08, -0.04, 0, 0.04, 0.08]) for (const eps of [0.04, 0.08, 0.12]) {
    const tau0 = Math.round((cur.tau0 + d0) * 100) / 100, tau1 = Math.round((cur.tau1_base + d1) * 100) / 100;
    if (tau0 < 0.05 || tau0 > 0.5 || tau1 < tau0 + 0.15 || tau1 > 0.95) continue;
    cands.push({ tau0, tau1_base: tau1, epsilon: eps, budget_k: cur.budget_k });
  }
  let best = null;
  for (const c of cands) {
    const m = replayGate(usable, c, refr, cap);
    const s = tunnelScore(m, t.band);
    if (!best || s < best.score) best = { tiers: c, metrics: m, score: s };
  }
  // hysteresis — a near-tie never files; the gate must be CLEARLY better
  if (!best || best.score >= baseScore * t.hysteresis_frac - t.hysteresis_abs) {
    return { proposal: null, healthy: true, why: `the gate is near-optimal on ${usable.length} replayed decisions (current score ${baseScore}, best grid ${best ? best.score : "—"})`, base };
  }
  const date = localDate(opts.now || new Date());
  const changed = Object.keys(cur).filter(k => best.tiers[k] !== cur[k]);
  const proposal = {
    id: `wt-${date}-${changed.join("-") || "tiers"}`,
    target: "thalamus_config.json → tiers",
    diff: { old: { ...cur }, new: { ...best.tiers } },
    evidence: [
      `deterministic replay of ${usable.length} real gate decisions over ${base.days} day(s) — zero LLM`,
      `current tiers: ${base.wakes_per_day} wakes/day · ${base.capped} capped · ${base.adjudications} ε-adjudications (score ${baseScore})`,
      `proposed tiers: ${best.metrics.wakes_per_day} wakes/day · ${best.metrics.capped} capped · ${best.metrics.adjudications} ε-adjudications (score ${best.score})`,
      `ε-band resolved DOWN in replay (the adjudicator's live verdicts are unknowable offline — conservative)`,
    ],
    predicted_effect: `wakes/day moves toward the [${t.band[0]}, ${t.band[1]}] band with fewer suppressed surprises and fewer paid adjudications`,
    metric: { name: "wakes_per_day_band", min_events: t.min_sample, window_days: 14, band: t.band },
    review_after_days: 14,
    revert_diff: { new: { ...cur } },
    status: "proposed", proposed_on: date, engine: "wind_tunnel",
    human_note: "apply by editing thalamus_config.json tiers, then restart the thalamus — the gate NEVER retunes itself",
  };
  const md = [
    `# WIND TUNNEL PROPOSAL · ${date} (report-only — thalamus_config.json is YOURS)`,
    "",
    ...proposal.evidence.map(e => `- ${e}`),
    "",
    `PROPOSED: ${JSON.stringify(proposal.diff.new)}`,
    `REVERT:   ${JSON.stringify(proposal.revert_diff.new)}`,
    `Apply → watch ${proposal.review_after_days} days → keep only if wakes/day sits in [${t.band[0]}, ${t.band[1]}].`,
  ].join("\n");
  return { proposal, md, base, best };
}

// gateTuneReport — the pre-M21 heuristic, FROZEN VERBATIM (layering): it still
// speaks when the tunnel lacks its 200-decision sample (its own floor is 20).
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
Predict the ${CAPS.pre_answer_max} doubts he is MOST LIKELY to voice next — concrete, first-person, in his idiom (Hinglish fine), each anchored to one concept. ONLY learning doubts on his interview arc (LLMs, RAG, evals, systems, his locked concepts decaying); IGNORE anything about building or configuring the organism/tooling itself (Claude, Gemini accounts, schedulers, APIs, tasks) — that is machinery talk, not a doubt worth pre-answering. Output STRICT JSON array, no fences: [{"concept":"<one concept>","doubt":"<the doubt as HE would voice it, 15-140 chars>"}]`, true);
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
// JOB 8 — M18 THE SEASON RE-READ: the coach no human could be — he re-reads
// the WHOLE season every night. The entire corpus rides ONE long-context call
// on the Scout lane: Pro first (403s on free keys until the Pro-tank linking
// — Part D, the captain's call), honest degrade to flash-latest (still 1M).
// AI proposes · the validator accepts or YESTERDAY'S READ STANDS.
// Sole writer of season_read.json (gitignored — it quotes his words).
// ---------------------------------------------------------------------------
const SEASON_CAPS = { corpus_chars: 400000, per_source: 120000, arrays: 8, str: 300 };
const AFFECT_RX = /prosody|emotion|mood|agitat|stress_level/i;

function seasonCorpus(deps = {}) {
  const parts = [];
  const push = (name, text) => { if (text) parts.push(`\n===== ${name} =====\n${String(text).slice(0, SEASON_CAPS.per_source)}`); };
  try {
    const dir = join(STATE_DIR, "capsules");
    for (const f of (deps.capsuleFiles || readdirSync(dir).filter(x => x.endsWith(".json"))))
      push(`CAPSULE ${f}`, deps.capsuleText ? deps.capsuleText(f) : readFileSync(join(dir, f), "utf8"));
  } catch { }
  push("DOUBT GRAMMAR", JSON.stringify(deps.grammar !== undefined ? deps.grammar : readJson(join(STATE_DIR, "doubt_grammar.json"))));
  const aff = deps.afferents || readLines(join(STATE_DIR, "afferent.jsonl"));
  push("AFFERENTS (his voiced words + machine events)", aff.filter(a => a.text).map(a => `[${String(a.ts || "").slice(0, 10)} ${a.modality}] ${a.text}`).join("\n"));
  try {
    const dir = join(STATE_DIR, "brain_out", "dugout");
    const files = (deps.transcriptFiles || readdirSync(dir).filter(x => x.endsWith(".md"))).slice(-21);
    const lines = [];
    for (const f of files) lines.push(...readFileSync(join(dir, f), "utf8").split("\n").filter(l => l.startsWith("CAPTAIN: ")).map(l => `[${f.replace(".md", "")}] ${l}`));
    push("DUGOUT (his own lines, 3 weeks)", lines.join("\n"));
  } catch { }
  const eps = deps.episodes || readLines(join(__dirname, "..", "dressing-room", "hippocampus", "episodes.jsonl"));
  push("EPISODES", eps.map(e => `[${e.day} ${e.kind}] ${e.text}`).join("\n"));
  push("WHO HE IS", JSON.stringify(deps.who !== undefined ? deps.who : readJson(join(__dirname, "..", "dressing-room", "hippocampus", "who_he_is.json"))));
  const balls = deps.throwins || readLines(join(STATE_DIR, "loose_balls.jsonl"));
  push("THROW-INS (stray thoughts, verbatim)", balls.map(b => `[${String(b.ts || "").slice(0, 10)}] ${b.text || b.message || ""}`).join("\n"));
  return parts.join("\n").slice(0, SEASON_CAPS.corpus_chars);
}

function validateSeasonRead(obj, banned) {
  if (!obj || typeof obj !== "object") return "not an object";
  for (const k of ["contradictions", "open_threads", "confusion_edges"]) if (!Array.isArray(obj[k])) return `missing array ${k}`;
  const flat = JSON.stringify(obj);
  if (bannedPhraseCheck(flat, banned).length) return "banned phrase";
  if (AFFECT_RX.test(flat)) return "affect leaked";
  if (!obj.contradictions.length && !obj.open_threads.length && !obj.confusion_edges.length) return "empty read";
  return null;
}

async function seasonReRead(deps = {}) {
  const now = deps.now || new Date();
  const gen = deps.generate || ((p) => generatePool(p, { models: ["gemini-3.1-pro-preview", "gemini-flash-latest"], maxOutputTokens: 16384, json: true }));
  const use = deps.recordUse || recordUse;
  const corpus = deps.corpus !== undefined ? deps.corpus : seasonCorpus(deps);
  if (corpus.length < 2000) return { ok: false, skipped: "corpus too thin to re-read — the season is days old, not weeks" };
  const r = await gen(`You are re-reading a learner's ENTIRE season tonight — every capsule he locked, every word he voiced, every doubt he logged (below). You are the coach no human could be: you re-read three weeks every night. Find ONLY what is genuinely in the text:
1. CONTRADICTIONS — places where his understanding in one week contradicts another (quote both sides, name where).
2. OPEN-NEVER-CLOSED THREADS — questions he raised and never resolved anywhere later.
3. CROSS-WEEK CONFUSION EDGES — pairs of concepts he keeps blurring across sessions (from/to + one line of evidence).
Honest frame only, no hype, no mood/emotion inference of ANY kind. Cap each list at ${SEASON_CAPS.arrays}. Output STRICT JSON, no fences:
{"contradictions":[{"a":"<his week-X claim>","b":"<his week-Y claim>","where":"<capsule/transcript>"}],"open_threads":[{"thread":"<the unresolved question>","first_seen":"<when/where>"}],"confusion_edges":[{"from":"<concept>","to":"<concept>","evidence":"<one line>"}],"note":"<one honest sentence on the season's shape>"}

THE CORPUS:
${corpus}`);
  use("T5", 1, Math.round(corpus.length / 4));
  if (!r.ok) return { ok: false, skipped: "the long-context lane is dry — yesterday's read stands" };
  let obj;
  try {
    const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
    obj = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
  } catch { return { ok: false, skipped: "unparseable read — yesterday's stands" }; }
  const banned = deps.bannedPhrases !== undefined ? deps.bannedPhrases : (((loadBrainConfig() || {}).guards || {}).banned_phrases || []);
  const bad = validateSeasonRead(obj, banned);
  if (bad) return { ok: false, skipped: `validator rejected: ${bad} — yesterday's read stands` };
  const trim = (arr, keys) => (arr || []).slice(0, SEASON_CAPS.arrays).map(x => Object.fromEntries(keys.map(k => [k, String(x[k] || "").slice(0, SEASON_CAPS.str)])));
  const out = {
    date: localDate(now), generated_at: now.toISOString(), model: r.model, corpus_chars: corpus.length,
    contradictions: trim(obj.contradictions, ["a", "b", "where"]),
    open_threads: trim(obj.open_threads, ["thread", "first_seen"]),
    confusion_edges: trim(obj.confusion_edges, ["from", "to", "evidence"]),
    note: String(obj.note || "").slice(0, 500),
  };
  (deps.writeRead || ((o) => writeAtomic(join(STATE_DIR, "season_read.json"), o)))(out);
  return { ok: true, model: r.model, contradictions: out.contradictions.length, open_threads: out.open_threads.length, edges: out.confusion_edges.length, corpus_chars: corpus.length };
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
  const gr = Object.keys(pb.bank).length ? await gradeProbes(pb.bank, deps) : { graded: 0, spent: 0 };   // M23 — grade BEFORE the bank is filed
  if (Object.keys(pb.bank).length) write(`probe_bank_${day}.json`, { date: day, bank: pb.bank });
  out.jobs.probe_bank = { concepts: Object.keys(pb.bank).length, spent: pb.spent, graded: gr.graded, grade_spent: gr.spent };

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

  const rows = deps.ledgerRows || readLines(join(STATE_DIR, "salience_ledger.jsonl"));
  const wt = windTunnel(rows, deps.thalamusCfg || loadThalamusConfig(), { now, ...(deps.tunnel || {}) });
  if (wt.proposal) {
    write(`wind_tunnel_${day}.json`, wt.proposal);
    write(`gate_tune_${day}.md`, wt.md);
    out.jobs.gate_tune = { proposed: true, engine: "wind_tunnel" };
  } else if (wt.healthy) {
    write(`gate_tune_${day}.md`, `# GATE HEALTHY · ${day}\n${wt.why}`);
    out.jobs.gate_tune = { healthy: true, engine: "wind_tunnel" };
  } else {
    const gt = gateTuneReport(rows, now);            // the frozen heuristic floor (layering)
    if (gt.md) write(`gate_tune_${day}.md`, gt.md);
    out.jobs.gate_tune = gt.md ? { proposed: true, engine: "legacy" } : { silent: gt.why };
  }

  const pa = await preAnswerEngine(deps);
  out.jobs.pre_answers = pa.ok ? { predicted: pa.predicted, answered: pa.answered, embedded: pa.embedded, spent: pa.spent } : { skipped: pa.skipped };

  const sr = await seasonReRead(deps);
  out.jobs.season_read = sr.ok ? { model: sr.model, contradictions: sr.contradictions, open_threads: sr.open_threads, edges: sr.edges } : { skipped: sr.skipped };

  write(`shift_${day}.json`, out);
  return { ok: true, ...out };
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const genProbes = async () => ({ ok: true, text: JSON.stringify(PROBE_TYPES.map(t => ({ type: t, probe: `a solid ${t} probe with enough length to pass validation` }))) });
  const genBad = async () => ({ ok: true, text: '[{"type":"vibes","probe":"x"},{"probe":123}]' });
  const base = { force: true, tone: { arousal: "open", effects: {} }, board: { tanks: [{ id: "T7", quota_est: 250, observed_ceiling: 0, used_today: 0, enabled: true, key_index: 5 }] }, recordUse: () => {}, skipBackfill: true, write: () => {}, ledgerRows: [], concepts: [{ concept: "tokenization", why: "capsule" }], grammar: null, calibration: null, ls: null, who: null, dossier: null, capsuleFiles: ["tokenization.json"], afferents: [], cards: null, bannedPhrases: ["10x"], thalamusCfg: { tiers: { tau0: 0.25, tau1_base: 0.55, epsilon: 0.08, budget_k: 0.35 }, refractory_min: 45, wake_cap_per_day: 15 }, corpus: "", generateHot: async () => ({ ok: true, text: "the same words answer every hot sample identically here" }), generatePro: async () => ({ ok: true, text: "the same words answer every hot sample identically here" }), now: new Date("2026-07-15T02:45:00") };

  // gates
  assert("daytime → no shift (it works while he sleeps)", (await runShift({ ...base, force: false, now: new Date("2026-07-15T14:00:00") })).skipped.includes("not overnight"));
  assert("conserve tone → no shift (the machine rests too)", (await runShift({ ...base, tone: { arousal: "conserve", effects: {} } })).skipped.includes("conserve"));
  assert("no T7 headroom → nothing to convert", (await runShift({ ...base, board: { tanks: [{ id: "T7", quota_est: 30, observed_ceiling: 0, used_today: 29, enabled: true, key_index: 5 }] } })).skipped.includes("headroom"));

  // the jobs
  {
    const writes = {};
    const r = await runShift({ ...base, generate: genProbes, write: (n, c) => { writes[n] = c; } });
    assert("the shift runs all eight jobs and files the shift record", r.ok && writes["shift_2026-07-15.json"] && r.jobs.probe_bank && r.jobs.gem_cartridge && "pre_answers" in r.jobs && "season_read" in r.jobs);
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

  // JOB 1b — M23 DIFFICULTY GRADING: variance = difficulty, hardest first
  {
    const bank = { tokenization: { why: "capsule", probes: [
      { type: "recall", probe: "a recall probe long enough to pass validation" },
      { type: "novel", probe: "a novel probe long enough to pass validation" },
      { type: "negative-space", probe: "a negative space probe long enough to pass" },
    ] } };
    let hotCalls = 0, proCalls = 0;
    const spends = [];
    const r = await gradeProbes(bank, {
      generateHot: async () => { hotCalls++; return { ok: true, text: hotCalls % 2 ? "attention scales quadratically because pairwise handshakes multiply across positions" : "completely different framing about memory bandwidth saturation limits hardware" }; },
      generatePro: async () => { proCalls++; return { ok: true, text: "a third entirely distinct answer regarding compiler kernels fusion throughput" }; },
      recordUse: (id) => spends.push(id),
    });
    assert("GRADING: k=3 hot + 1 pro answers per scrimmage-ground probe", r.graded === 2 && hotCalls === 6 && proCalls === 2);
    assert("GRADING: divergent answers = HIGH difficulty (contested ground)", bank.tokenization.probes.find(p => p.type === "novel").difficulty > 0.5);
    assert("GRADING: probes sort hardest-first (the scrimmage takes from the top)", ["novel", "negative-space"].includes(bank.tokenization.probes[0].type) && bank.tokenization.probes[bank.tokenization.probes.length - 1].type === "recall");
    assert("GRADING: hot spends on T7, the pro attempt on T5", spends.filter(s => s === "T7").length === 6 && spends.filter(s => s === "T5").length === 2);
    // consensus ground = low difficulty
    const bank2 = { x: { why: "w", probes: [{ type: "novel", probe: "another probe long enough to pass validation" }] } };
    await gradeProbes(bank2, { generateHot: async () => ({ ok: true, text: "identical answer words every single time repeated verbatim consistently" }), generatePro: async () => ({ ok: true, text: "identical answer words every single time repeated verbatim consistently" }), recordUse: () => {} });
    assert("GRADING: consensus answers = LOW difficulty (settled ground)", bank2.x.probes[0].difficulty < 0.1);
    // dry lanes → ungraded, never crash; recall probes never graded (cap discipline)
    const bank3 = { y: { why: "w", probes: [{ type: "novel", probe: "yet another probe long enough to pass" }, { type: "recall", probe: "recall probe long enough to pass validation" }] } };
    const rDry = await gradeProbes(bank3, { generateHot: async () => ({ ok: false }), generatePro: async () => ({ ok: false }), recordUse: () => {} });
    assert("GRADING: dry lanes → probe stays ungraded (never fabricate a grade)", rDry.graded === 0 && bank3.y.probes.every(p => p.difficulty === undefined));
    assert("GRADING: variance math — clones 0, disjoint ~1", answerVariance(["same words here always", "same words here always"]) === 0 && answerVariance(["alpha bravo charlie delta echoes", "zulu yankee xylophone whiskey victor"]) === 1);
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

  // JOB 6 — M21 THE WIND TUNNEL: replay → grid → bootroom-grammar proposal
  {
    const thal = { tiers: { tau0: 0.25, tau1_base: 0.55, epsilon: 0.08, budget_k: 0.35 }, refractory_min: 45, wake_cap_per_day: 15 };
    const mkRows = () => {
      const rows = [];
      for (let d = 1; d <= 5; d++) {
        const day = `2026-07-0${d}`;
        for (let i = 0; i < 50; i++) rows.push({ day, ts: `${day}T10:${String(i % 60).padStart(2, "0")}:00Z`, S: 0.30, headroom_frac: 1, key: `bus:filler${i}` });
        rows.push({ day, ts: `${day}T11:00:00Z`, S: 0.53, headroom_frac: 1, key: `voice:doubt-a-${d}` });
        rows.push({ day, ts: `${day}T15:00:00Z`, S: 0.53, headroom_frac: 1, key: `voice:doubt-b-${d}` });
      }
      return rows;
    };
    const wt = windTunnel(mkRows(), thal, { now: new Date("2026-07-15T02:45:00") });
    assert("TUNNEL: a starving gate (0 wakes/day, ε-band churn) yields a PROPOSAL", wt.proposal && wt.base.wakes_per_day === 0 && wt.best.metrics.wakes_per_day >= 1);
    assert("TUNNEL: the proposal rides the boot room's grammar (all 8 fields)", ["id", "target", "diff", "evidence", "predicted_effect", "metric", "review_after_days", "revert_diff"].every(k => k in wt.proposal) && wt.proposal.status === "proposed");
    assert("TUNNEL: the revert is the CURRENT config, byte-equal", JSON.stringify(wt.proposal.revert_diff.new) === JSON.stringify(thal.tiers));
    assert("TUNNEL: evidence carries real replay numbers + the ε-band caveat", wt.proposal.evidence.some(e => e.includes("260")) && wt.proposal.evidence.some(e => e.includes("replay")) && wt.proposal.evidence.some(e => e.includes("unknowable offline")));
    assert("TUNNEL: report-only — the human applies it (the gate never retunes itself)", wt.proposal.human_note.includes("NEVER retunes") && wt.md.includes("YOURS"));
    // a healthy gate files nothing
    const healthyRows = [];
    for (let d = 1; d <= 5; d++) {
      const day = `2026-07-0${d}`;
      for (let i = 0; i < 50; i++) healthyRows.push({ day, ts: `${day}T10:00:00Z`, S: 0.10, headroom_frac: 1, key: `bus:f${i}` });
      for (let w = 0; w < 3; w++) healthyRows.push({ day, ts: `${day}T1${w}:30:00Z`, S: 0.75, headroom_frac: 1, key: `voice:hot-${d}-${w}` });
    }
    const wtH = windTunnel(healthyRows, thal, {});
    assert("TUNNEL: a healthy gate (in-band, no churn) files NO proposal", wtH.proposal === null && wtH.healthy === true);
    // the statistical floor
    const wtS = windTunnel(mkRows().slice(0, 50), thal, {});
    assert("TUNNEL: under 200 decisions → silent (an early retune is worse than late)", wtS.proposal === null && wtS.why.includes("200"));
    // replay honors refractory (same key, minutes apart, one wake)
    const rf = replayGate([
      { day: "2026-07-01", ts: "2026-07-01T10:00:00Z", S: 0.75, headroom_frac: 1, key: "voice:same" },
      { day: "2026-07-01", ts: "2026-07-01T10:10:00Z", S: 0.75, headroom_frac: 1, key: "voice:same" },
    ], thal.tiers, 45, 15);
    assert("REPLAY: refractory suppression replays exactly (1 wake, 1 suppressed)", rf.wakes === 1 && rf.refractory === 1);
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

  // JOB 8 — M18 THE SEASON RE-READ
  {
    const goodRead = { contradictions: [{ a: "week 1: kv cache fixes quadratic attention", b: "week 3: attention stays n-squared with the cache", where: "capsule context vs dugout 07-12" }], open_threads: [{ thread: "does compaction lose the capsule anchors?", first_seen: "dugout 07-13" }], confusion_edges: [{ from: "tokenization", to: "embeddings", evidence: "blurred in 3 sessions" }], note: "the season circles context economics." };
    const corpus = "x".repeat(5000);
    let saved = null, spent = 0;
    const r = await seasonReRead({ corpus, generate: async () => ({ ok: true, text: JSON.stringify(goodRead), model: "gemini-flash-latest" }), recordUse: (id, u, naive) => { spent = naive; }, writeRead: (o) => { saved = o; }, bannedPhrases: ["10x"], now: new Date("2026-07-15T03:00:00") });
    assert("SEASON RE-READ: one long-context call → dated, model-stamped read", r.ok && saved.date === "2026-07-15" && saved.model === "gemini-flash-latest" && saved.contradictions.length === 1);
    assert("SEASON RE-READ: the naive-shadow records the real corpus size", spent === Math.round(corpus.length / 4) && saved.corpus_chars === 5000);
    let kept = true;
    const rB = await seasonReRead({ corpus, generate: async () => ({ ok: true, text: JSON.stringify({ ...goodRead, note: "10x season!" }) }), recordUse: () => {}, writeRead: () => { kept = false; }, bannedPhrases: ["10x"] });
    assert("SEASON RE-READ: banned phrase → REJECTED, yesterday's read stands", rB.ok === false && rB.skipped.includes("banned") && kept);
    const rA = await seasonReRead({ corpus, generate: async () => ({ ok: true, text: JSON.stringify({ ...goodRead, note: "his mood seemed low all week" }) }), recordUse: () => {}, writeRead: () => { kept = false; }, bannedPhrases: [] });
    assert("SEASON RE-READ: affect inference → REJECTED (never enters the bus)", rA.ok === false && rA.skipped.includes("affect") && kept);
    const rE = await seasonReRead({ corpus, generate: async () => ({ ok: true, text: '{"contradictions":[],"open_threads":[],"confusion_edges":[]}' }), recordUse: () => {}, writeRead: () => { kept = false; }, bannedPhrases: [] });
    assert("SEASON RE-READ: an empty read never overwrites a real one", rE.ok === false && rE.skipped.includes("empty") && kept);
    assert("SEASON RE-READ: a days-old season honestly refuses to pretend", (await seasonReRead({ corpus: "tiny", generate: async () => { throw new Error("no"); } })).skipped.includes("thin"));
    const c = seasonCorpus({ capsuleFiles: [], grammar: { clusters: [] }, afferents: [{ ts: "2026-07-14T10:00:00Z", modality: "voice", text: "kv cache doubt" }], transcriptFiles: [], episodes: [{ day: "2026-07-13", kind: "doubt", text: "softmax why" }], who: { fingerprint: "attention arc" }, throwins: [{ ts: "2026-07-12T10:00:00Z", text: "check flash attention" }] });
    assert("SEASON corpus: every organ's words ride, sectioned + capped", c.includes("AFFERENTS") && c.includes("kv cache doubt") && c.includes("softmax why") && c.includes("flash attention") && c.length <= 400000);
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

export { runShift, probeBank, distractorBank, scoutPack, gemCartridge, gateTuneReport, windTunnel, replayGate, tunnelScore, preAnswerEngine, preAnswerMaterial, seasonReRead, seasonCorpus, validateSeasonRead, gradeProbes, answerVariance, drillConcepts, isOvernight, CAPS, TUNNEL, SEASON_CAPS, GRADE };
