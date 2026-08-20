#!/usr/bin/env node
// @ts-check
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
//        the cognition jobs ride the CLAUDE subscription lane under ONE
//        shift-wide call budget (enforced ACROSS jobs, not merely declared per
//        job) and bill no Gemini tank; the shift's one genuine Gemini spend
//        (the season re-read, T5) is gated on T5's own headroom — E2E audit
//        25 Jul 2026 · every output validated by code, junk rejected · all
//        outputs land in gitignored
//        brain_out/nightshift/ (job 7: gitignored answer_cache.jsonl — its
//        sole writer; it names his doubts) · zero writes to any organ's file.
// MODES: node scripts/nightshift.mjs [--force] · field-probes [concept...] · status · selftest
// ============================================================================

import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generatePool, embedPool } from "./hippocampus.mjs";
// 17 Jul: cognition rides Claude (the Gemini free tier shrank to ~20 req/day and
// starved the night). generatePool stays imported for the PHYSICS lanes only:
// the 400k-char season re-read (1M context) and embeddings.
import { claudeGen, ledgerForensics } from "./claudegen.mjs";

// LADDER G1 (9 Aug 2026): THE NIGHT SHIFT METERS ITSELF. Five claudeGen sites,
// zero ledger rows — the governor's window never saw this lane's spend at all.
// Every default generate now lands the same row shape brain.mjs writes, on the
// SHARED brain ledger, 4-field honest totals included (claudegen G1). Injected
// deps in the selftest bypass this wrapper, so tests stay hermetic.
// WIRING AUDIT (10 Aug 2026, pass 2) — THE FOURTH HONESTY FIELD, and the row
// gets a NAME so it can be tested. The forensics trio landed this morning (see
// below); `tokens_estimated` did not, and this was the last Claude-lane writer
// omitting it — dmn.mjs:107 and council.mjs stamp it, this row did not.
// Measured on the live brain_ledger.jsonl the same night: 4,559 rows, 3,239
// carrying no such key at all, 50 of them this lane's (`ns_*`), 0 stamped.
// WHY IT IS NOT COSMETIC: claudegen.mjs:132 falls back to a LENGTH ESTIMATE
// ((prompt+text).length/4) whenever the CLI returns no usage block — and
// parseErr ALWAYS does — while brain.mjs windowUsage:256 sums total_tokens
// blind. Unstamped, a length-guess and a measured number are the same row to
// the governor that rations the window. 0 of the 50 ns_ rows have failed yet,
// so the lie is LATENT, not yet told: the first failed night shift tells it.
// The derivation is dmn.mjs:107's, byte for byte, so the two lanes can never
// disagree about what "estimated" means (a result that never carried the flag
// and reported no components is an estimate — never a measured zero).
function nsLedgerRow(r, model, jobLabel, now = new Date()) {
  return {
    ts: now.toISOString(), job: jobLabel, engine: "claude", model,
    input_tokens: r.input_tokens ?? null, output_tokens: r.output_tokens ?? null,
    cache_creation_tokens: r.cache_creation_tokens ?? null, cache_read_tokens: r.cache_read_tokens ?? null,
    total_tokens: r.total_tokens || 0,
    tokens_estimated: r.tokens_estimated !== false && !(r.input_tokens || r.output_tokens),
    duration_ms: r.duration_ms || 0,
    ok: !!r.ok, error: r.error || null, limit_hit: !!r.limit_hit,
    // #8 FORENSICS, WIRED 10 Aug 2026 (wiring audit). claudegen has computed
    // http_status / limit_signal / error_envelope on every failure since
    // 4 Aug and this row literal copied none of them across — so a failed
    // night left a timestamp and a truncated message, and brain.mjs's
    // dead-brain alarm had nothing to name the cause with. ONE shape, defined
    // once in claudegen.ledgerForensics (dmn.mjs's ledgerRow spreads the same).
    ...ledgerForensics(r),
  };
}
const genLedgered = async (prompt, model, jobLabel, extraArgs = []) => {
  const r = await claudeGen(prompt, model, undefined, extraArgs);
  try {
    const { appendFileSync: app } = await import("node:fs");
    const { join: j2 } = await import("node:path");
    app(j2(STATE_DIR, "brain_ledger.jsonl"), JSON.stringify(nsLedgerRow(r, model, jobLabel)) + "\n");
  } catch (e) { swallow("an unmetered call is still a made call — never fail the job on the meter", e); }
  return r;
};
import { loadBoard, headroomOf, recordUse } from "./fuelboard.mjs";
import { currentTone } from "./tone.mjs";
import { indexRecall } from "./dugout.mjs";
import { indexEpisodes } from "./hippocampus.mjs";
// job 7 rides the brain's own honest-frame validator (proven code, reused)
import { loadConfig as loadBrainConfig, bannedPhraseCheck, headroom as brainHeadroom, gateVerdictForLane, gateTransition, gateCardsForTick } from "./brain.mjs";   // gateVerdictForLane/gateTransition: THE GATE (18 Aug 2026) — the verdict is gate.mjs's, the journal and the card stay brain's
// job 6 (the wind tunnel) replays the gate's own recorded decisions
import { loadConfig as loadThalamusConfig } from "./thalamus.mjs";
import { captain } from "./captain.mjs";   // Block 2 §7.3
import { dayKey, addDays } from "./daykey.mjs";   // Block 6 — THE DAY-KEY LAW: NightShift 02:40 keys its SLOT's day in a catch-up burst
import { swallow } from "./swallow.mjs";   // Block 7 — SWALLOW + PANIC (§14.2): every fs-guarding silent catch is declared

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const OUT_DIR   = join(STATE_DIR, "brain_out", "nightshift");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch (e) { swallow("readJson: readFileSync(p) unreadable → null", e);} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch (e) { swallow("readLines: readFileSync(p) unreadable → o", e);} return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

// min_headroom (30) is the RETIRED whole-shift T7 gate — kept in the shape so no
// consumer of CAPS breaks, but nothing reads it since the E2E audit (25 Jul 2026)
// re-pointed the gate at the lane each job actually spends. shift_call_budget is
// the sum of the per-job caps: 6 probes + 6×4 grades + 6 distractors + 1+25 pre-answers.
const CAPS = { probe_concepts: 6, probes_per_concept: 5, distractor_concepts: 6, min_headroom: 30, pre_answer_max: 25, min_gemini_headroom: 1, shift_call_budget: 62 };
const PROBE_TYPES = ["recall", "reconstruct", "defend", "novel", "negative-space"];

// ---------------------------------------------------------------------------
// E2E audit 25 Jul 2026 — THE FUELBOARD MISBILLING. Since the 17 Jul migration
// (see the note at the imports) jobs 1 / 1b / 2 / 7 ride claudeGen — the Claude
// MAX SUBSCRIPTION — yet every one of them still charged a GEMINI tank: up to
// ~56 units on T7 (the DMN's gemini-flash key) plus 6 on T5 (the Scout's pro
// key) per night for calls that never touch a Gemini key. Two real harms: the
// fuelboard read fiction (the gauge showed T7 burnt by work it never did), and
// the admission gate metered a resource this shift no longer spends, so a day
// of honest DMN traffic silently cancelled the whole night. The Claude lane is
// a subscription, not a tank — it is metered by the brain's own window ledger,
// never here — so its spends ride a NON-TANK lane id that the fuelboard never
// sees. Genuine Gemini spends (the season re-read on T5) still bill normally.
// NOTE (open, needs fuelboard.mjs): the naive-shadow multiplier only counts
// tank-billed calls, so the Claude lane's shadow tokens go unrecorded until the
// board grows a Claude lane of its own. Under-reporting a saving beats
// inventing a Gemini spend.
// ---------------------------------------------------------------------------
const CLAUDE_LANE = "CLAUDE_MAX";
const meterUse = (lane, units = 1, naiveTokens = 0) => (lane === CLAUDE_LANE
  ? { ok: true, lane, billed: false }              // subscription — nothing to meter on the board
  : recordUse(lane, units, naiveTokens));

// E2E audit 25 Jul 2026 — THE BUDGET THAT WASN'T. The shift checked headroom
// ONCE, before job 1, then made up to ~62 LLM calls with no re-check: the
// header's "hard-capped per job" was true only per job, never across the shift,
// so the measured budget could be spent nearly twice over. One budget object now
// travels with the deps: every LLM call must TAKE from it, and a job that finds
// it empty stops where it stands (partial work still files — half a probe bank
// beats none). Standalone job calls (and the selftest) get the unlimited one.
// ---- C3.8 · THE NIGHT RESERVE (12 Aug 2026) --------------------------------
// The shift budget above caps CALLS (62) and has never capped TOKENS. Like the
// DMN before it, this lane gated on a call count and on free-tier tank headroom,
// and never once on the paid window — `grep headroom scripts/nightshift.mjs`
// finds only `headroomOf(t5)`, which is a Gemini tank.
//
// WHAT THAT COST, MEASURED — and it explains BOTH of the organism's remaining
// starvation bugs at once. The shift runs at 02:40; `diary` and
// `cortex consolidate` both run at 03:00, right behind it. In the 5h window
// ending 03:00 on 12 Aug the organism had spent 27,34,271 cost-weighted against
// an overnight cap of 26,12,500 — already over — and the single biggest line in
// that window was `ns_pre_answers` at 6,16,346. So:
//   · `cortex consolidate` failed EVERY day with "no-headroom (0/50000 needed)"
//   · `diary` (enabled, priority 10, 03:00) has NEVER PRODUCED A PAGE —
//     reconcile has reported "diary: never produced — diary/ does not exist"
//     for as long as the finding has existed.
// Neither is broken. Both were drunk under the table by the job in front of them.
//
// THE FIX IS A RESERVE, NOT A CUT. The night SHOULD drain the window (C3.5) —
// it just may not drain it to zero while jobs it does not own are still queued
// behind it. Every term below is measured, none chosen:
//   cortex_consolidate  50,000  (its own stated floor, quoted in its own error)
//   the late brain jobs 49,991  (p90 of 96 real non-DMN non-nightshift jobs,
//                                ledger 9-12 Aug; median 29,478)
//   one more late job   49,991  (the same p90 — agenda, teamtalk and the diary's
//                                own siblings share the 03:00 tail)
// → 150,000, floored to that from 149,982. Re-derive with `brain.mjs spend`.
const NIGHT_RESERVE = 150000;
// the ledger is ~5,000 rows; re-reading it on all 62 takes would be wasteful, and
// the window cannot move meaningfully inside thirty seconds of one shift.
const RESERVE_CACHE_MS = 30000;

// the live reader, kept separate from makeBudget so the budget stays pure and every
// existing selftest keeps working without a ledger on disk. Fails OPEN, loudly in
// code but silently at runtime: a governor that will not load must never be the
// reason the night produced nothing.
function liveWindowAllowed() {
  try {
    const cfg = loadBrainConfig();
    const led = readLines(join(STATE_DIR, "brain_ledger.jsonl"));
    const q = readJson(join(STATE_DIR, "brain_queue.json")) || {};
    return brainHeadroom(cfg, led, q, new Date()).allowed;
  } catch (e) { swallow("liveWindowAllowed: readLines(join(STATE_DIR, \"brain_ledger.jsonl\")) unreadable → Infinity", e); return Infinity; }
}

function makeBudget(n, windowFn = null) {
  return { left: Number.isFinite(n) ? Math.max(0, Math.floor(n)) : Infinity, spent: 0,
           starved: 0, _at: 0, _allowed: Infinity,
           allowedNow() {
             if (!windowFn) return Infinity;
             const t = Date.now();
             if (t - this._at < RESERVE_CACHE_MS) return this._allowed;
             this._at = t;
             try { this._allowed = windowFn(); } catch { this._allowed = Infinity; }   // fail-OPEN
             return this._allowed;
           },
           take() {
             if (this.left <= 0) return false;
             // the reserve binds BEFORE the call count: a shift with calls left but
             // no window is exactly the case that starved the two 03:00 jobs.
             if (this.allowedNow() < NIGHT_RESERVE) { this.starved++; return false; }
             this.left--; this.spent++; return true;
           } };
}
const NO_BUDGET = { left: Infinity, spent: 0, take: () => true };

// concepts worth drilling: weak first, locked capsules as the floor (Re-Jirah fodder)
//
// WIRING AUDIT (10 Aug 2026) — THE DANGER ZONE ARRIVES STAMPED WITH ITS TRACK, and this
// door threw the stamp away. calibration.mjs:189-198 split the namespace on 25 Jul for
// exactly one reason, in its own words: "the entry also carried no track, so the Manager
// could not tell which domain was in danger". Both consumers of this list — probeBank:173
// and distractorBank:261 — spend LLM calls making 9-AXIS CONCEPT-grammar probes, and
// GEMINI_LOOP.md §11.3 hard-refuses that grammar on the Python track ("Forge-9-axis-capsule
// Python pe KABHI nahi — skill hai, decay-prone concept nahi"). So a skill-track danger
// topic (live example: `pydantic`, which sorts FIRST because worst knew-accuracy leads)
// became an examiner probe with an axis on it, and came back through capture.mjs as
// track:"concept" — poisoning the very split that stamp exists to protect. Skill danger is
// not dropped in silence: gemCartridge names the exclusion in the shift record, and the
// captain already reads it on the sheet (manager.mjs dangerLine, same audit, same day).
// `d.track || "concept"` keeps pre-25-Jul entries behaving exactly as before — the same
// default manager.mjs takes; no entry changes meaning, only skill-stamped ones are held back.
function drillConcepts(deps = {}) {
  const out = [];
  const cal = deps.calibration !== undefined ? deps.calibration : readJson(join(STATE_DIR, "calibration.json"));
  for (const d of (cal && cal.danger_zone) || []) {
    if (String(d.track || "concept") === "skill") continue;
    out.push({ concept: d.topic || d.concept, why: "danger zone" });
  }
  const ls = deps.ls !== undefined ? deps.ls : readJson(join(STATE_DIR, "learning_state.json"));
  for (const c of ((ls && ls.concepts) || [])) if (["stalling", "regressing", "learning"].includes(String(c.trend || c.trajectory || c.stage || ""))) out.push({ concept: c.name || c.concept, why: c.trend || c.stage });
  try {
    for (const f of (deps.capsuleFiles || readdirSync(join(STATE_DIR, "capsules")).filter(f => f.endsWith(".json"))))
      out.push({ concept: f.replace(".json", ""), why: "locked capsule (decay-guard drilling)" });
  } catch (e) { swallow("drillConcepts: readdirSync(join(STATE_DIR, \"capsules\")) unreadable → ignored", e); }
  const seen = new Set();
  return out.filter(c => c.concept && !seen.has(c.concept) && seen.add(c.concept));
}

// ---------------------------------------------------------------------------
// JOB 1c — THE FIELD PROBES (11 Aug 2026, HIS RULING: the probe bank's questions
// are "andaaze, asli sawaal nahi" — resolve it).
//
// THE DEFECT. probeBank below asks Sonnet to *invent* what an interviewer would
// ask. That is a model's prior about interviews, not the interview. He caught it
// himself, and he is right: he is training to survive a real room, and a probe
// nobody has ever been asked is a probe that cannot fail him honestly.
//
// WHY IT COULD NOT BE BUILT BEFORE, AND WHY IT CAN NOW. Real questions need the
// actual internet. The organism's only outward arm was the Gemini missions desk,
// which is a HUMAN surface — he has to fire it. That is exactly the ADHD tax he
// ruled out ("everything in the organism which do not need me, keep me free").
// Measured live on 11 Aug: `claude -p --allowedTools WebSearch` returns real,
// sourced interview questions on the Max subscription. So this lane needs nobody.
//
// THREE PROPERTIES, all deliberate:
//   1. AUTOMATIC FOR EVERY FUTURE TOPIC. It walks drillConcepts() — the same list
//      probeBank uses, which already includes every locked capsule. A concept
//      locked next month is researched the first night after, with no edit here
//      and nothing for him to remember. That is the "no jugaad" requirement made
//      structural rather than promised.
//   2. A QUESTION WITHOUT A SOURCE IS NOT A FIELD QUESTION. Every item must carry
//      at least one http(s) source or it is dropped. Without that rule this job
//      degrades silently into probeBank — the model inventing again, now wearing
//      the word "real". The rule IS the feature.
//   3. IT REFRESHES, IT DOES NOT RE-ASK. A concept already banked inside
//      FIELD_REFRESH_DAYS is skipped, so the nightly cost is the NEW topics plus
//      the slow rotation of the old ones — not the whole syllabus every night.
//      (The night that starved the diary is one day old; this lane must not
//      become the next thing eating that budget.)
// ---------------------------------------------------------------------------
const FIELD_PROBES_FILE = "field_probes.json";        // cumulative, in OUT_DIR (nightshift owns it)
const FIELD_REFRESH_DAYS = 30;
const FIELD_MAX_PER_NIGHT = 3;                        // new/stale concepts per shift — a floor on the spend
const FIELD_MIN_QS = 3;

const isHttpUrl = (s) => typeof s === "string" && /^https?:\/\/\S+$/i.test(s.trim());

// Exported for the selftest: the whole value of this job lives in what it REFUSES.
export function validateFieldItems(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => ({
      q: typeof x?.q === "string" ? x.q.trim() : (typeof x?.question === "string" ? x.question.trim() : ""),
      sources: Array.isArray(x?.sources) ? x.sources.filter(isHttpUrl) : [],
    }))
    .filter((x) => x.q.length > 15 && x.q.length <= 400 && x.sources.length > 0);
}

// Stale = never fetched, or fetched longer ago than the refresh window. Written as
// its own function so the selftest can pin "never fetched" and "fetched today"
// without a clock in the test.
export function fieldStale(entry, now, days = FIELD_REFRESH_DAYS) {
  if (!entry || !entry.fetched) return true;
  const t = new Date(entry.fetched).getTime();
  if (!Number.isFinite(t)) return true;
  return (now.getTime() - t) > days * 86400000;
}

async function fieldProbes(deps = {}) {
  const now = deps.now || new Date();
  const gen = deps.generateField
    || ((p) => genLedgered(p, "sonnet", "ns_field_probes", ["--allowedTools", "WebSearch"]));
  const budget = deps.budget || NO_BUDGET;
  const prior = deps.priorField !== undefined ? deps.priorField : (readJson(join(OUT_DIR, FIELD_PROBES_FILE)) || { concepts: {} });
  const bank = { ...(prior.concepts || {}) };
  const concepts = (deps.concepts || drillConcepts(deps));
  const todo = concepts.filter((c) => c.concept && fieldStale(bank[c.concept], now)).slice(0, FIELD_MAX_PER_NIGHT);
  let spent = 0, added = 0, refused = 0;

  for (const c of todo) {
    if (!budget.take()) break;
    const r = await gen(
      `Search the web for REAL interview questions that have actually been asked about "${c.concept}" in AI Engineer / AI Product Engineer / ML Engineer interviews. Prefer interview-experience write-ups, company-specific guides and question banks over generic blog posts. Do NOT invent questions: every question must come from a page you actually read, and must carry that page's URL.\nReturn STRICT JSON only, no prose, no code fences:\n{"questions":[{"q":"<the question as asked>","sources":["<https url>"]}]}`
    );
    spent++;
    if (!r || !r.ok) { refused++; continue; }
    let items = [];
    try {
      const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
      items = validateFieldItems(JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw).questions);
    } catch { items = []; }
    // Too few sourced questions is a REFUSAL, not a thin success: a bank entry
    // stamped today blocks the refresh for a month, so a bad night must not
    // masquerade as a fetched one.
    if (items.length < FIELD_MIN_QS) { refused++; continue; }
    bank[c.concept] = { fetched: now.toISOString(), why: c.why, questions: items };
    added++;
  }
  return { bank, spent, added, refused, considered: todo.length, total_concepts: Object.keys(bank).length };
}

// ---------------------------------------------------------------------------
// JOB 1d — THE ROUND READ (11 Aug 2026). HIS design, not mine: asked whether the
// deep grade should block the live voice, he said no — "opus se answer aane mein
// time lagega aur gaffer will wait ... ideally i should just give my revision to
// gaffer and everything should be evaluated and given to me after some time."
// He is right, and he is right for a reason worth writing down:
//
//   ONE OPUS PASS OVER THE WHOLE ROUND BEATS NINE LIVE ONES — not because it is
//   cheaper (it is), but because it can see ACROSS the axes. "You dropped the
//   mechanism on c and f both, and said knew on both" is the finding Re-Jirah
//   exists for, and an axis-at-a-time judge can never produce it.
//
// The live verdict stays Flash's: fast, in the flow, and enough to keep the round
// moving. This runs after, on the night, over the grades AND his actual spoken
// answers from the day's Gaffer transcript.
//
// WHY IT IS SAFE TO BE WRONG HERE: it writes a READ, not a grade. It cannot move
// an axis, a due date or a streak — rejirah.mjs owns those and this never calls
// it. The worst a bad read can do is be unhelpful prose in a file.
// ---------------------------------------------------------------------------
const ROUND_READ_MIN_AXES = 3;

// Exported for the selftest. The whole job hinges on picking the RIGHT rows: axis
// grades from today only, and never a round-close row (kind:"round-close" carries
// no axis and would silently inflate the count).
export function todaysGrades(rows, day) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => r && r.axis && r.kind !== "round-close"
    && typeof r.ts === "string" && r.ts.slice(0, 10) === day);
}

export function validateRoundRead(o) {
  if (!o || typeof o !== "object") return null;
  const arr = (k) => (Array.isArray(o[k]) ? o[k].filter((x) => typeof x === "string" && x.trim().length > 10).slice(0, 6) : []);
  const patterns = arr("patterns"), next = arr("next");
  const overconfident = Array.isArray(o.overconfident)
    ? o.overconfident.filter((x) => typeof x === "string" && /^[a-i]$/.test(x.trim())).map((x) => x.trim()) : [];
  // A read with no pattern AND no next step is not a read — it is filler, and
  // filler in this file would teach him to stop opening it.
  if (!patterns.length && !next.length) return null;
  return { patterns, overconfident, next, note: typeof o.note === "string" ? o.note.slice(0, 400) : null };
}

async function roundRead(deps = {}) {
  const day = deps.day || dayKey(deps.now || new Date());
  const rows = deps.rejirahRows !== undefined ? deps.rejirahRows : readLines(join(STATE_DIR, "rejirah_log.jsonl"));
  const graded = todaysGrades(rows, day);
  if (graded.length < ROUND_READ_MIN_AXES) {
    return { skipped: `only ${graded.length} axis grade(s) today — a round read needs ≥${ROUND_READ_MIN_AXES}`, read: null, spent: 0 };
  }
  const gen = deps.generateDeep || ((p) => genLedgered(p, "opus", "ns_round_read"));
  // His spoken answers live in the day's Gaffer transcript. Tail it: the round is
  // the END of the sitting, and the whole file can be tens of thousands of chars.
  let transcript = "";
  try {
    const t = deps.transcript !== undefined ? deps.transcript
      : readFileSync(join(STATE_DIR, "brain_out", "dugout", `${day}.md`), "utf8");
    transcript = String(t || "").slice(-12000);
  } catch (e) { swallow("roundRead: readFileSync(join(STATE_DIR, \"brain_out\", \"dugout\", `$…) unreadable → transcript = \"\"", e); transcript = ""; }

  const grid = graded.map((r) => `${r.concept} · axis ${r.axis} · ${r.result} · he said "${r.gut}" BEFORE answering`).join("\n");
  const r = await gen(
`You are reading ONE Re-Jirah round for ${captain().name}, an ADHD-PI engineer training for an AI Product Engineer interview. He answered these axes OUT LOUD, cold, notes closed. A machine already gave each axis a live held/cracked verdict; your job is the thing that verdict CANNOT do — read ACROSS the axes for the shared shape.

THE GRID (axis, live verdict, and the gut-word he committed BEFORE answering):
${grid}

HIS ACTUAL SPOKEN ANSWERS (tail of today's transcript; may be partial):
${transcript || "(no transcript on disk for today — judge from the grid alone and say so in note)"}

Look for, in this order:
1. CROSS-AXIS PATTERNS — the same failure shape on more than one axis (e.g. "gave the definition, skipped the mechanism, on both c and f"). This is the whole point; a per-axis remark is worthless here.
2. OVERCONFIDENCE — axes where he said "knew" and it cracked. That cell is the dangerous one.
3. WHAT TO HIT NEXT — concrete, one line each, tied to an axis.
Be honest and specific. Never praise. If the transcript is thin, say so rather than inventing a pattern.

Return STRICT JSON only, no prose, no fences:
{"patterns":["..."],"overconfident":["c"],"next":["..."],"note":"one honest sentence"}`
  );
  if (!r || !r.ok) return { skipped: "the deep read did not return", read: null, spent: 1 };
  let read = null;
  try {
    const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
    read = validateRoundRead(JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw));
  } catch { read = null; }
  if (!read) return { skipped: "the deep read came back unusable (no pattern, no next step)", read: null, spent: 1 };
  return { skipped: null, read: { ...read, day, axes: graded.length, grid: graded.map((g) => ({ concept: g.concept, axis: g.axis, result: g.result, gut: g.gut })) }, spent: 1 };
}

// ---------------------------------------------------------------------------
// JOB 1 — THE PROBE BANK (validated JSON; junk rejected per-item)
// ---------------------------------------------------------------------------
async function probeBank(deps = {}) {
  const gen = deps.generate || ((p) => genLedgered(p, "sonnet", "ns_probe_bank"));
  const use = deps.recordUse || meterUse;
  const budget = deps.budget || NO_BUDGET;
  const grammar = deps.grammar !== undefined ? deps.grammar : readJson(join(STATE_DIR, "dossier_weights.json"));
  const concepts = (deps.concepts || drillConcepts(deps)).slice(0, CAPS.probe_concepts);
  const bank = {};
  let spent = 0;
  for (const c of concepts) {
    if (!budget.take()) break;                       // E2E audit 25 Jul 2026: the shift-wide budget binds here too
    const r = await gen(`Generate exactly ${CAPS.probes_per_concept} INTERVIEW PROBES for the concept "${c.concept}" for an AI Product Engineer candidate. One per type: ${PROBE_TYPES.join(", ")}. negative-space = "when would you NOT use it". Output STRICT JSON array, no fences: [{"type":"...","probe":"<the question, <=200 chars, interviewer voice>"}]${grammar && grammar.probe_types ? `\nMatch this club's probe grammar where possible: ${JSON.stringify(Object.keys(grammar.probe_types))}` : ""}`);
    use(CLAUDE_LANE, 1, 3000); spent++;              // claudeGen — subscription lane, never a Gemini tank
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
// E2E audit 25 Jul 2026: claudeGen is SYNCHRONOUS (execFileSync) and returns a
// plain object — calling .catch() on it is a TypeError that kills the whole pass
// the instant the LLM lane actually works. A thunk + try/catch tolerates BOTH a
// sync return and a promise, so injected async deps keep working too.
const genSafe = async (fn) => { try { return await fn(); } catch { return { ok: false }; } };
async function gradeProbes(bank, deps = {}) {
  const use = deps.recordUse || meterUse;
  const budget = deps.budget || NO_BUDGET;
  // haiku plays the hot seats (mechanical, ×24/night), sonnet plays the pro.
  // NOTE: claude CLI has no temperature flag — the GRADE.temp knob is retired;
  // natural sampling variance still separates contested from settled ground.
  const genHot = deps.generateHot || ((p) => genLedgered(p, "haiku", "ns_grade_probes"));
  const genPro = deps.generatePro || ((p) => genLedgered(p, "sonnet", "ns_grade_probes"));
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
      if (!budget.take()) break;                     // E2E audit 25 Jul 2026: the shift-wide budget binds here too
      const r = await genSafe(() => genHot(q));
      use(CLAUDE_LANE, 1, 2000); spent++;            // haiku on the subscription — T7 was pure fiction post-17-Jul
      if (r.ok && r.text) answers.push(r.text);
    }
    if (budget.take()) {
      const rp = await genSafe(() => genPro(q));
      use(CLAUDE_LANE, 1, 2000); spent++;            // the "pro" seat is claudeGen sonnet now, NOT the Scout's T5 key
      if (rp.ok && rp.text) answers.push(rp.text);
    }
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
  const gen = deps.generate || ((p) => genLedgered(p, "sonnet", "ns_distractors"));
  const use = deps.recordUse || meterUse;
  const budget = deps.budget || NO_BUDGET;
  const grammar = deps.grammar !== undefined ? deps.grammar : readJson(join(STATE_DIR, "doubt_grammar.json"));
  const shapes = ((grammar && grammar.clusters) || []).map(c => c.shape || c.name).filter(Boolean).slice(0, 5);
  const concepts = (deps.concepts || drillConcepts(deps)).slice(0, CAPS.distractor_concepts);
  const bank = {};
  let spent = 0;
  for (const c of concepts) {
    if (!budget.take()) break;                       // E2E audit 25 Jul 2026: the shift-wide budget binds here too
    const r = await gen(`For the concept "${c.concept}", write exactly 3 DISTRACTORS — answers that are PLAUSIBLE-BUT-WRONG in ways a learner actually gets wrong${shapes.length ? ` (this learner's real confusion shapes: ${shapes.join("; ")})` : ""}. Output STRICT JSON array, no fences: [{"distractor":"<the wrong-but-tempting claim, <=160 chars>","why_wrong":"<the precise crack, <=120 chars>"}]`);
    use(CLAUDE_LANE, 1, 2500); spent++;              // claudeGen — subscription lane, never a Gemini tank
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
    `# THE SCOUT PACK · ${dayKey(now)}`,
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
  const caps = deps.capsuleFiles || (() => { try { return readdirSync(join(STATE_DIR, "capsules")).filter(f => f.endsWith(".json")).map(f => f.replace(".json", "")); } catch (e) { swallow("gemCartridge: readdirSync(join(STATE_DIR, \"capsules\")) unreadable → []", e); return []; } })();
  const bank = deps.probeBank || readJson(join(OUT_DIR, `probe_bank_${dayKey(now)}.json`));
  // LADDER G10 (9 Aug 2026): the revived capsule_premap joins the cartridge —
  // the night's repeatable filler. The viz-style i<=2 day-lookback is MANDATORY,
  // not decoration: premap files land under the SHIFT day, minutes AFTER this
  // very job's own write, so tonight's cartridge reads the newest of three days.
  const premap = deps.premap !== undefined ? deps.premap : (() => {
    for (let i = 0; i <= 2; i++) {
      const dk = addDays(dayKey(now), -i);   // Block 6 — day-key
      try { const t = readFileSync(join(STATE_DIR, "brain_out", "premap", `${dk}.md`), "utf8"); if (t.trim()) return { day: dk, text: t }; } catch (e) { swallow("gemCartridge: readFileSync(join(STATE_DIR, \"brain_out\", \"premap\", `$…) unreadable → ignored", e); }
    }
    return null;
  })();
  // WIRING AUDIT (10 Aug 2026) — the cartridge's return contract is HARDCODED
  // `"track":"concept"` with an `"axis":"a-i"` on every rep (see RULES below), so anything
  // named on the "drill these HARDEST" line comes back as a CONCEPT rep. The line took
  // `.topic` alone, and calibration's danger zone carries BOTH tracks (calibration.mjs:189-198)
  // — so a Python skill topic was drilled by the concept examiner and re-entered reps_log
  // mislabelled, which is the one thing the 25 Jul namespace split exists to prevent. It is
  // also a §11.3 breach: the 9-axis grammar is never run on Python. THIS GEM IS THE CONCEPT
  // EXAMINER, so skill-track danger is withheld from its text entirely (naming it here and
  // asking the model not to probe it would still leave the mislabelled rep one disobeyed
  // instruction away) and the withholding is NAMED in the shift record below — the machine
  // face, per the Captain's Call. He already sees the skill entry on the sheet, track-stamped,
  // via manager.mjs dangerLine. The AXIS the same producer computes rides along now too: it
  // exists on concept entries only (calibration.mjs:216-223) and is passed through verbatim,
  // never computed here. Default `|| "concept"` = pre-25-Jul entries behave exactly as before.
  const dz = ((cal && cal.danger_zone) || []).filter((d) => d && (d.topic || d.concept));
  const dzConcept = dz.filter((d) => String(d.track || "concept") !== "skill");
  const dzSkill = dz.filter((d) => String(d.track || "concept") === "skill");
  const md = [
    `# GEM CARTRIDGE · ${dayKey(now)} — paste into your Gem's instructions (your own data → your own Google account)`,
    "",
    `You are my interview examiner. Locked concepts (probe these for decay): ${caps.join(", ") || "none yet"}.`,
    who && who.fingerprint ? `Where I stand right now: ${who.fingerprint}` : "",
    ((who && who.open_threads) || []).length ? `Open threads to attack: ${who.open_threads.join(" · ")}` : "",
    dzConcept.length ? `My confident-but-wrong zone (drill these HARDEST): ${dzConcept.map(d => `${d.topic || d.concept}${d.axis ? ` — axis ${d.axis} is the kind of thinking that keeps breaking, attack that` : ""}`).join(", ")}` : "",
    "",
    "RULES: one probe at a time · demand my gut-word (knew/shaky/guessed) BEFORE I answer · honest verdicts, no flattery · after each session output a JSON array of reps, EVERY item exactly: {\"surface\":\"gem\",\"track\":\"concept\",\"concept\":\"...\",\"axis\":\"a-i\",\"question\":\"...\",\"confidence\":\"knew|shaky|guessed\",\"correct\":true|false} so I can paste it into my capture system.",
    bank && Object.keys(bank.bank || bank).length ? `\nFRESH PROBES (tonight's bank — use these first):\n${Object.entries(bank.bank || bank).slice(0, 4).map(([c, v]) => `- ${c}: ${(v.probes || []).slice(0, 2).map(p => p.probe).join(" · ")}`).join("\n")}` : "",
    premap ? `\nPRE-MAPPED FAULT-LINES (the night's read of where he will crack — probe these, from ${premap.day}):\n${premap.text.slice(0, 1200)}` : "",
  ].filter(Boolean).join("\n");
  // #106 — the shift record used to log this job as the literal `{ ok: true }`,
  // written unconditionally right after the file write, so it could never be
  // anything but true: a status that cannot fail measures nothing. What the
  // captain actually needs to know is what went INTO the cartridge his examiner
  // will run on — an empty one still writes fine and still says "ok".
  const probeConcepts = bank ? Object.keys(bank.bank || bank).length : 0;
  return {
    md,
    // `danger_topics` keeps its name and its job — how many danger topics FILLED this
    // cartridge — which is now the concept-track count, because those are the only ones that
    // reach the text (see the wiring note above). `danger_skill_withheld` names the rest, so
    // an entry the concept examiner must not touch is still counted and still auditable
    // rather than vanishing between two organs. (10 Aug 2026 wiring audit.)
    filled: { capsules: caps.length, probe_concepts: probeConcepts, has_fingerprint: !!(who && who.fingerprint), open_threads: ((who && who.open_threads) || []).length, danger_topics: dzConcept.length, danger_skill_withheld: dzSkill.map(d => d.topic || d.concept), premap_day: premap ? premap.day : null },   // G10 — the accounting sees the premap too
  };
}

// ---------------------------------------------------------------------------
// JOB 6 — M21 THE WIND TUNNEL (report-only: the gate NEVER retunes itself).
// Every ledger row already carries S, headroom_frac, key, ts — so any tier
// config can be replayed EXACTLY, offline, in milliseconds. The ε-band is
// ONE-SIDED (it mirrors the live gate) and its near-misses resolve DOWN in
// replay (the tiny model's verdict is unknowable offline — conservative,
// stated in the proposal). Output rides the boot room's own mutation grammar
// so the captain reviews it like any gene.
// ---------------------------------------------------------------------------
const TUNNEL = { band: [1, 8], min_sample: 200, hysteresis_frac: 0.9, hysteresis_abs: 0.5 };

// E2E audit 25 Jul 2026: THE TUNNEL REPLAYED A GATE THAT NO LONGER EXISTS.
// This replay used a SYMMETRIC ε-band, checked BEFORE the wake test, so every
// score in [τ1, τ1+ε) was resolved DOWN to tier 1 — the exact behaviour the
// live thalamus abandoned on 18 Jul (thalamus.mjs: "ONE-SIDED epsilon"), and
// abandoned precisely because his real voiced doubts sit just above the bar and
// were being demoted to a fail-closed coin flip. A tunnel that replays the OLD
// gate mis-states reality twice over: it reports wakes that really happened as
// ε-adjudications, and then files a tuning proposal whose evidence is fiction.
// It now mirrors the live ladder exactly: the two FREE gates (refractory, cap)
// are read first, at/above the bar WAKES outright, and only a near-MISS below
// the bar — and only when not already gated — counts as a paid adjudication.
// replayGateLegacy below is the pre-fix engine, frozen verbatim (layering).
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
    const ts = new Date(r.ts || 0).getTime();
    const last = wakeKeys.get(r.key);
    const inRefractory = last !== undefined && ts - last < refractoryMin * 60000;
    const atCap = wakesToday >= capPerDay;
    let tier = r.S < tiers.tau0 ? 0 : 1;
    if (r.S >= t1) tier = 2;                                         // at/above the bar wakes outright (live, 18 Jul)
    else if (t1 - r.S < tiers.epsilon && !inRefractory && !atCap) {   // only a near-MISS is worth a paid verdict
      m.adjudications++; tier = Math.max(tier, 1);                   // resolved DOWN offline — conservative
    }
    if (tier === 2) {
      if (inRefractory) { m.refractory++; tier = 1; }
      else if (atCap) { m.capped++; tier = 1; }
      else { m.wakes++; wakesToday++; wakeKeys.set(r.key, ts); }
    }
    if (tier === 0) m.tier0++; else if (tier === 1) m.tier1++;
  }
  m.days = Math.max(1, days.size);
  m.wakes_per_day = Math.round((m.wakes / m.days) * 100) / 100;
  return m;
}

// replayGateLegacy — the pre-audit symmetric-band replay, FROZEN VERBATIM
// (layering): kept so any older wind-tunnel proposal can be re-derived exactly
// as it was filed. Nothing calls it in the live path.
function replayGateLegacy(rows, tiers, refractoryMin = 45, capPerDay = 15) {
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
    // ── #73 · "GATE HEALTHY" WAS A LIE ────────────────────────────────────
    // Reproduced against the live salience ledger on the audit: 5,280 rows,
    // base replay {wakes: 6, days: 14, wakes_per_day: 0.43}, base score 59,
    // best grid 57 — and the file on disk said "GATE HEALTHY". It said so
    // because hysteresis had nothing to do with the BAND: it only asks "did the
    // grid clearly beat the current config?" When the answer is no, the old
    // code declared health — for a gate running at 0.43 wakes/day against its
    // OWN declared [1, 8]. Not-improvable is not the same as healthy.
    // Health is now measured against the band the tunnel itself declares, and
    // "out of band with no config that fixes it" is reported as exactly that.
    const inBand = base.wakes_per_day >= t.band[0] && base.wakes_per_day <= t.band[1];
    const date = dayKey(opts.now || new Date());
    const bestLine = best ? `${best.metrics.wakes_per_day} wakes/day (score ${best.score})` : "— (no candidate config cleared the shape rules)";
    const why = inBand
      ? `the gate is IN BAND and near-optimal on ${usable.length} replayed decisions — ${base.wakes_per_day} wakes/day inside [${t.band[0]}, ${t.band[1]}] (current score ${baseScore}, best grid ${best ? best.score : "—"})`
      : `OUT OF BAND: ${base.wakes_per_day} wakes/day against this tunnel's own [${t.band[0]}, ${t.band[1]}], over ${usable.length} replayed decisions. Nothing is proposed because no config in the ${cands.length}-point grid clears hysteresis — the best it found is ${bestLine}. A gate below its own floor that the grid cannot lift is NOT healthy; it points at what reaches the gate (the SCORE), not at the thresholds.`;
    const md = [
      `# GATE ${inBand ? "HEALTHY" : "OUT OF BAND"} · ${date} (report-only — thalamus_config.json is YOURS)`,
      "",
      `- measured: ${base.wakes_per_day} wakes/day · ${base.capped} capped · ${base.refractory} refractory-suppressed · ${base.adjudications} ε-adjudications over ${base.days} day(s), ${usable.length} decisions (score ${baseScore})`,
      `- this tunnel's own healthy band: [${t.band[0]}, ${t.band[1]}] wakes/day → measured ${base.wakes_per_day} sits ${inBand ? "INSIDE" : "OUTSIDE"} it`,
      `- best config found in the ${cands.length}-point grid: ${bestLine}`,
      `- current tiers: ${JSON.stringify(cur)}`,
      "",
      inBand
        ? "No change proposed: the gate is inside its band and the grid cannot clearly beat it."
        : "No change proposed, and that is NOT a clean bill of health — see above. The grid only moves tau0/tau1_base/epsilon; if none of them lifts the wake rate, the shortfall is upstream of the thresholds (what scores at all), which no tier edit can fix.",
      "",
      "PRESENTATION ONLY. This file's target (thalamus_config.json → tiers) sits outside the Boot Room's mutation grammar and `validateMutation` would reject it, so there is deliberately NO auto-apply path anywhere. The gate NEVER retunes itself.",
    ].join("\n");
    return { proposal: null, healthy: inBand, out_of_band: !inBand, why, md, base, best, band: t.band, grid_size: cands.length };
  }
  const date = dayKey(opts.now || new Date());
  const changed = Object.keys(cur).filter(k => best.tiers[k] !== cur[k]);
  const proposal = {
    id: `wt-${date}-${changed.join("-") || "tiers"}`,
    target: "thalamus_config.json → tiers",
    diff: { old: { ...cur }, new: { ...best.tiers } },
    evidence: [
      `deterministic replay of ${usable.length} real gate decisions over ${base.days} day(s) — zero LLM`,
      `current tiers: ${base.wakes_per_day} wakes/day · ${base.capped} capped · ${base.adjudications} ε-adjudications (score ${baseScore})`,
      `proposed tiers: ${best.metrics.wakes_per_day} wakes/day · ${best.metrics.capped} capped · ${best.metrics.adjudications} ε-adjudications (score ${best.score})`,
      `one-sided ε-band replayed exactly as the live gate runs it (at/above τ1 wakes); only near-MISSES adjudicate and they resolve DOWN in replay (the adjudicator's live verdicts are unknowable offline — conservative)`,
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
  const lines = [`# GATE TUNE PROPOSAL · ${dayKey(now)} (report-only — thalamus_config.json changes are YOURS to approve)`, "", `sample: last ${recent.length} decisions · wakes ${wakes} · capped ${capped} · refractory ${refr} · ε-band ${adjUp + adjDown} (up ${adjUp} / down ${adjDown})`];
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
// ── #1 · THE THIRD CUT — PROVENANCE, NOT MODALITY ───────────────────────────
// One wire, three cuts: thalamus.mjs:218 (the self gate), thalamus.mjs:172
// (deriveVoiceTokens) and THIS line. The pre-answer corpus filtered
// `a.modality === "voice"`, and the voice bridge has been silent since 30 Jul —
// so the engine that predicts tomorrow's doubts was reading a dead channel while
// 502 rows of his own typed doubts sat in the same file.
// The gate is now PROVENANCE: whose words are these?
//   HIS      · voice (the bridge) · claude-code (what he types) ·
//              organism-memory (an MCP note he wrote himself)
//   NOT HIS  · claude-code-teaching — the COACH'S OWN OUTPUT. Measured 4 Aug
//              2026: 342 rows of it, 215 in the last 7 days. Feeding the
//              assistant's own prose back in as "his doubts" would make the
//              engine predict itself. This one is a hard deny, never a default.
// Legacy shape (layering): the 271 voice afferents carry NO `source` field at
// all, so modality "voice" maps to provenance "voice" and keeps reading.
// gemini pair added 9 Aug 2026 (P7 harvest lane): `gemini-study` is HIS turns from
// a harvested Gem sitting, `gemini-study-teaching` is the Gem's answers — hard deny.
const HIS_SOURCES = new Set(["voice", "claude-code", "organism-memory", "gemini-study"]);
const NOT_HIS_SOURCES = new Set(["claude-code-teaching", "gemini-study-teaching"]);
function provenanceOf(a) {
  if (!a) return "";
  const s = String(a.source || "").toLowerCase();
  if (s) return s;
  return String(a.modality || "").toLowerCase() === "voice" ? "voice" : "";
}
function isHisWords(a) {
  if (!a || !a.text) return false;
  const p = provenanceOf(a);
  if (NOT_HIS_SOURCES.has(p)) return false;
  return HIS_SOURCES.has(p);
}

function preAnswerMaterial(deps = {}, now = new Date()) {
  const grammar = deps.grammar !== undefined ? deps.grammar : readJson(join(STATE_DIR, "doubt_grammar.json"));
  const clusters = ((grammar && grammar.clusters) || []).map(c => ({ shape: c.shape, examples: (c.examples || []).slice(0, 3).map(e => e.q_first_80 || "").filter(Boolean) }));
  const weekAgo = now.getTime() - 7 * 86400000;
  const aff = (deps.afferents || readLines(join(STATE_DIR, "afferent.jsonl"))).filter(a => new Date(a.ts || 0).getTime() >= weekAgo);
  const his = aff.filter(isHisWords);
  const voiced = his.map(a => String(a.text).slice(0, 120)).slice(-30);
  // ── #56 · REPORT THE CORPUS, DO NOT ASSUME IT ─────────────────────────────
  // The voice corpus empties for good once the 30 Jul batch falls out of the
  // 7-day window, and :724 recorded NOTHING about what fed the prediction — so
  // this input could degrade to zero with no signal anywhere. The composition
  // now travels out with the material and lands on the shift record (the shift
  // record is read by `nightshift status` and by dugout.mjs:1215/:1238), so a
  // dry corpus is VISIBLE the day it happens instead of the week after.
  const bySource = {};
  for (const a of aff) { const p = provenanceOf(a) || `(no source · ${a.modality || "?"})`; bySource[p] = (bySource[p] || 0) + 1; }
  const composition = {
    window_days: 7,
    afferents_in_window: aff.length,
    his_turns_in_window: his.length,
    voiced_turns_in_window: aff.filter(a => String(a.modality || "").toLowerCase() === "voice" && a.text).length,
    typed_turns_in_window: his.filter(a => provenanceOf(a) === "claude-code").length,
    used_in_prompt: voiced.length,
    excluded_not_his: aff.filter(a => a.text && NOT_HIS_SOURCES.has(provenanceOf(a))).length,
    by_source: bySource,
  };
  const tokens = {};
  for (const a of aff) for (const t of a.concept_tokens || []) tokens[t] = (tokens[t] || 0) + 1;
  const hotTokens = Object.entries(tokens).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);
  const cards = deps.cards !== undefined ? deps.cards : readJson(join(STATE_DIR, "cards.json"));
  const due = ((cards && (cards.hardest_due || cards.due || [])) || []).map(d => typeof d === "string" ? d : (d.concept || d.topic)).filter(Boolean).slice(0, 8);
  const cal = deps.calibration !== undefined ? deps.calibration : readJson(join(STATE_DIR, "calibration.json"));
  const danger = ((cal && cal.danger_zone) || []).map(d => d.topic || d.concept).filter(Boolean);
  const who = deps.who !== undefined ? deps.who : readJson(join(__dirname, "..", "dressing-room", "hippocampus", "who_he_is.json"));
  const threads = ((who && who.open_threads) || []).slice(0, 5);
  // `voiced` keeps its name so every existing consumer/fixture reads unchanged
  // (layering); `his_words` is the honest alias now that typed doubts ride too.
  return { clusters, voiced, his_words: voiced, composition, hotTokens, due, danger, threads };
}

async function preAnswerEngine(deps = {}) {
  const now = deps.now || new Date();
  // thinking models spend thoughts from the SAME output budget — the 25-item
  // predict needs real room or the wire returns an empty candidate (probed live)
  const gen = deps.generate || ((p, big) => genLedgered(p, "sonnet", "ns_pre_answers"));
  const use = deps.recordUse || meterUse;
  const budget = deps.budget || NO_BUDGET;
  const material = deps.material || preAnswerMaterial(deps, now);
  // #56 — the corpus report rides EVERY return, including the skips. A skip
  // caused by a dry corpus is exactly the case that must not be silent.
  const corpus = material.composition || { window_days: 7, his_turns_in_window: (material.voiced || []).length, used_in_prompt: (material.voiced || []).length, note: "composition not measured (material injected)" };
  if (!(material.clusters.length || material.voiced.length || material.due.length || material.danger.length || material.threads.length)) {
    return { ok: false, skipped: "no real signal on the bus — never predict doubts from nothing", corpus };
  }
  // E2E audit 25 Jul 2026: the shift-wide budget is checked BEFORE the predict
  // call — a prediction with no budget left to answer it is a wasted call.
  if (!budget.take()) return { ok: false, skipped: "shift call budget spent — the cache waits for tomorrow's headroom", corpus };
  // 1 — PREDICT (one call): the doubts he is MOST LIKELY to voice next
  const pr = await gen(`You predict the NEXT doubts of one specific learner (an AI Product Engineer candidate) from his real signals. His confusion SHAPES (mined from his real captured doubts): ${JSON.stringify(material.clusters).slice(0, 2500)}. His last-7-days OWN WORDS — spoken and typed, ${(material.voiced || []).length} turn(s) (never the coach's replies): ${JSON.stringify(material.voiced).slice(0, 3000)}. Concepts hot this week: ${material.hotTokens.join(", ") || "—"}. Due for review (decay risk): ${material.due.join(", ") || "—"}. Confident-but-wrong zone: ${material.danger.join(", ") || "—"}. Open threads: ${material.threads.join(" · ") || "—"}.
Predict the ${CAPS.pre_answer_max} doubts he is MOST LIKELY to voice next — concrete, first-person, in his idiom (Hinglish fine), each anchored to one concept. ONLY learning doubts on his interview arc (LLMs, RAG, evals, systems, his locked concepts decaying); IGNORE anything about building or configuring the organism/tooling itself (Claude, Gemini accounts, schedulers, APIs, tasks) — that is machinery talk, not a doubt worth pre-answering. Output STRICT JSON array, no fences: [{"concept":"<one concept>","doubt":"<the doubt as HE would voice it, 15-140 chars>"}]`, true);
  use(CLAUDE_LANE, 1, 4000);                         // claudeGen — subscription lane, never a Gemini tank
  if (!pr.ok) return { ok: false, skipped: "prediction lane dry — no cache tonight", corpus };
  let predicted = [];
  try {
    const raw = String(pr.text); const s = raw.indexOf("["), e = raw.lastIndexOf("]");
    predicted = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw)
      .filter(d => d && typeof d.doubt === "string" && d.doubt.length >= 12 && typeof d.concept === "string" && d.concept)
      .slice(0, CAPS.pre_answer_max);
  } catch { }
  if (!predicted.length) return { ok: false, skipped: "prediction unparseable — junk never enters the cache", corpus };
  // 2 — ANSWER each in the DOSSIER grammar (validated per-item; junk rejected)
  const banned = deps.bannedPhrases !== undefined ? deps.bannedPhrases : (((loadBrainConfig() || {}).guards || {}).banned_phrases || []);
  const entries = [];
  let spent = 1;
  for (const d of predicted) {
    if (!budget.take()) break;                       // E2E audit 25 Jul 2026: the shift-wide budget binds here too
    // CACHE-ORDERED, 15 Aug 2026 — STABLE FIRST, VOLATILE LAST. Measured on the
    // live brain_ledger over the trailing 7 days: ns_pre_answers, 38 calls,
    // 703,407 tokens, cache_creation 666,729 and cache_read EXACTLY ZERO — every
    // call re-established a prefix and not one call ever read one back. The old
    // wording opened with the varying doubt and put the fixed DOSSIER grammar
    // after it, so there was no shared prefix to cache at all. This is the same
    // law the Watcher's prompt obeys (scripts/gaffer_brain.mjs, buildWatcherPrompt)
    // and the same one the work order states: keep stable content at the START,
    // changing content at the END.
    // TWO HONEST CAVEATS, both worth writing down rather than discovering twice:
    //   · the SAVING is a hypothesis until the ledger says otherwise. The verdict
    //     arrives on the next night run and needs no one to remember it — the rows
    //     are already there: filter brain_ledger.jsonl for job ns_pre_answers and
    //     read cache_read_tokens. Zero again means the binding constraint is the
    //     provider's minimum cacheable prefix, not this ordering, and the next step
    //     is a bigger shared prefix rather than a different order.
    //   · the CONTENT is byte-identical — same instructions, same doubt, same
    //     concept, same output contract. Only the order changed, and putting his
    //     doubt LAST also puts it closest to the answer, which is the better place
    //     for it on any reading.
    const r = await gen(`Answer a learner's doubt COMPLETELY, in the club's DOSSIER grammar.
Structure (dense, ≤170 words, no preamble): (1) the mechanism, named plainly; (2) one worked micro-example with real small numbers; (3) where it breaks / the limit; (4) the trade-off a staff engineer would name; (5) ONE reframe that dissolves this exact confusion, speakable, Hinglish welds welcome. Honest frame only — never hype, never a shame word. Output STRICT JSON, no fences: {"answer":"<the full answer>"}
THE DOUBT (his voice): "${d.doubt}" — concept: ${d.concept}.`);
    use(CLAUDE_LANE, 1, 3500); spent++;              // claudeGen — subscription lane, never a Gemini tank
    if (!r.ok) continue;
    try {
      const raw = String(r.text); const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
      const obj = JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
      const answer = String(obj.answer || "");
      if (answer.length < 80) continue;                        // too thin to pre-load
      if (bannedPhraseCheck(answer, banned).length) continue;  // honest frame or nothing
      entries.push({ id: `pa_${dayKey(now)}_${entries.length}`, date: dayKey(now), concept: String(d.concept).slice(0, 80), doubt: String(d.doubt).slice(0, 200), answer: answer.slice(0, 1400), vec: null });
    } catch { }
  }
  if (!entries.length) return { ok: false, skipped: "every answer failed validation — cache untouched", corpus };
  // 3 — EMBED the doubts (T6 lane) so the thalamus can cosine-attach; dry →
  // vec null, the serve side's word-overlap floor still works (layering)
  const embed = deps.embed || embedPool;
  const vecs = await embed(entries.map(e => `${e.concept}: ${e.doubt}`)).catch(() => null);
  let embedded = 0;
  if (vecs) entries.forEach((e, i) => { if (vecs[i]) { e.vec = vecs[i]; embedded++; } });
  (deps.writeCache || ((rows) => writeAtomic(join(STATE_DIR, "answer_cache.jsonl"), rows.map(x => JSON.stringify(x)).join("\n") + "\n")))(entries);
  return { ok: true, predicted: predicted.length, answered: entries.length, embedded, spent, corpus };
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
  } catch (e) { swallow("seasonCorpus: readdirSync(dir) unreadable → ignored", e); }
  push("DOUBT GRAMMAR", JSON.stringify(deps.grammar !== undefined ? deps.grammar : readJson(join(STATE_DIR, "doubt_grammar.json"))));
  const aff = deps.afferents || readLines(join(STATE_DIR, "afferent.jsonl"));
  push("AFFERENTS (his voiced words + machine events)", aff.filter(a => a.text).map(a => `[${String(a.ts || "").slice(0, 10)} ${a.modality}] ${a.text}`).join("\n"));
  try {
    const dir = join(STATE_DIR, "brain_out", "dugout");
    const files = (deps.transcriptFiles || readdirSync(dir).filter(x => x.endsWith(".md"))).slice(-21);
    const lines = [];
    for (const f of files) lines.push(...readFileSync(join(dir, f), "utf8").split("\n").filter(l => l.startsWith("CAPTAIN: ")).map(l => `[${f.replace(".md", "")}] ${l}`));
    push("DUGOUT (his own lines, 3 weeks)", lines.join("\n"));
  } catch (e) { swallow("seasonCorpus: readdirSync(dir) unreadable → ignored", e); }
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
  const gen = deps.generate || ((p) => generatePool(p, { role: "pro", maxOutputTokens: 16384, json: true }));   // LAW M (18 Aug 2026): role pro → falls back to text with a receipt when pro has no free tier
  const use = deps.recordUse || meterUse;            // the ONE genuine Gemini spend of the shift — T5 is billed for real
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
    date: dayKey(now), generated_at: now.toISOString(), model: r.model, corpus_chars: corpus.length,
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
// ---------------------------------------------------------------------------
// THE GATE (ORGANISM_OVERHAUL 18 Aug 2026 §5.3) — the shift's three LLM lanes
// answer to the same E∧C∧¬F verdict every brain job answers to. Same helper
// (gate.mjs via brain.mjs), same journal (brain_out/gate.jsonl), same card door.
//   ns_probe_bank  · event "lock": a capsule locked since the last bank (or a scrimmage
//                    drew from the bank inside the window — the Dugout's scrimmage
//                    /config stamps `sat`) · evidence = concepts to probe
//   ns_distractors · window: get_rejirah rode them into a voice round (`sat`)
//                  · evidence = his doubt-grammar shapes + concepts
//   ns_pre_answers · window: the thalamus matched a pre-answer to a live doubt (`sat`)
//                  · evidence = real signal on the bus (the engine's own material check)
// NOT gated, on purpose: field_probes (its own refresh law; the sourced ground §9.1
// needs), round_read (judge_night — kept unchanged), embed_backfill/scout_pack/
// gem_cartridge/gate_tune (zero-LLM), season_read (the free T5 pool — free-tier
// quota is not the paid window; usefulness is metered through the sheet it feeds).
// An asleep lane prints ONE line into the shift record and spends nothing.
// ---------------------------------------------------------------------------
const NS_GATE = {
  ns_probe_bank: { gate: { event: "lock" }, surface: { kind: "code", where: "scripts/dugout.mjs buildScrimmageInstruction (probe bank) + get_rejirah" } },
  ns_distractors: { gate: {}, surface: { kind: "code", where: "scripts/dugout.mjs get_rejirah (distractors ride each due concept)" } },
  ns_pre_answers: { gate: {}, surface: { kind: "code", where: "scripts/thalamus.mjs matchPreAnswer → the mouth's hint" } },
};
// "a capsule was locked since the last probe bank" — measured off two mtimes this
// organ already reads: the newest capsule mirror file vs the newest probe_bank_*.json.
// No bank yet ⇒ armed (the first bank is the lock event of every capsule so far).
// "a capsule changed since the last bank" — by CONTENT, not mtime: the mirror's own
// manifest carries a sha256 per capsule id (mirror.mjs, sole writer), and every bank
// written under the gate records the shas it saw. Changed sha ⇒ a lock/edit landed ⇒
// armed. No bank yet, or a pre-gate bank with no fingerprint ⇒ armed (runs once, then
// gates). Both reads are injectable, so the suite touches no disk.
export function capsuleShaMap(manifest) {
  const out = {};
  for (const [id, r] of Object.entries((manifest && manifest.per_id) || {})) if (r && r.ok && r.sha256) out[id] = r.sha256;
  return out;
}
function newestBankRecord() {
  try {
    const names = readdirSync(OUT_DIR).filter((f) => /^probe_bank_\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    const n = names.pop();
    return n ? { ...(readJson(join(OUT_DIR, n)) || {}), file: n } : null;
  } catch (e) { swallow("newestBankRecord: readdirSync(OUT_DIR) unreadable → null", e); return null; }
}
export function lockSinceLastProbeBank({ manifest = readJson(join(STATE_DIR, "mirror_manifest.json")), lastBank = newestBankRecord() } = {}) {
  if (!lastBank) return { armed: true, why: "no probe bank on disk yet (the first bank is every capsule's lock event)" };
  const then = lastBank.capsule_shas && typeof lastBank.capsule_shas === "object" ? lastBank.capsule_shas : null;
  if (!then) return { armed: true, why: `the last bank (${lastBank.date || lastBank.file}) recorded no capsule fingerprint — first bank under the gate` };
  const now = capsuleShaMap(manifest);
  const changed = [...new Set([...Object.keys(now), ...Object.keys(then)])].filter((id) => now[id] !== then[id]);
  return changed.length
    ? { armed: true, why: `capsule(s) changed since the last bank (${lastBank.date || lastBank.file}): ${changed.join(", ")}` }
    : { armed: false, why: `no capsule changed since the last bank (${lastBank.date || lastBank.file})` };
}
function nsGate(lane, { evidence, event_armed, deps, now, collect }) {
  // hermetic seam: the suite hands a verdict function; the live path asks the owner
  if (deps.gateVerdict) return deps.gateVerdict(lane, { evidence, event_armed });
  const spec = NS_GATE[lane] || { gate: {}, surface: null };
  const v = gateVerdictForLane(lane, { evidence, gate: spec.gate, event_armed, now, surface: spec.surface });
  // journal on transition; the CARD is collected and filed ONCE per shift (below) —
  // three lanes sleeping on the same night for the same reason is one question, not three
  try { gateTransition(lane, v, { now, by: "nightshift", collectCards: collect }); } catch { /* the journal must never cost the shift */ }
  return v;
}
const asleepRecord = (v) => ({ asleep: true, why: ["E", "C", "F"].filter((k) => !v.why[k].ok).join("+"), detail: ["E", "C", "F"].filter((k) => !v.why[k].ok).map((k) => `${k}: ${v.why[k].detail}`).join(" · "), wakes_when: v.wakes_when, spent: 0 });

async function runShift(deps = {}) {
  const now = deps.now || new Date();
  const tone = deps.tone || currentTone();
  if (!deps.force && !isOvernight(now)) return { ok: false, skipped: "not overnight — the shift works while he sleeps (--force to override)" };
  // --force MEANS FORCE, ON BOTH GATES (audit #108, 6 Aug 2026). The overnight gate
  // above honoured --force and this one did not, so the two skips were indistinguishable
  // from the outside: the night lane had been silently dead for four days (2→6 Aug, last
  // shift 02-08, LastTaskResult 0 every time) and a --force recovery run would ALSO have
  // returned `skipped` on any conserve day, reading as the same nothing. The rest law is
  // real and stays the default — a depleted captain's machine also rests — but a manual
  // recovery run must be able to say "I know, run it anyway", and must SAY that it did.
  if (tone.arousal === "conserve" && !deps.force) return { ok: false, skipped: "conserve tone — a depleted captain's machine also rests (--force to override)" };
  const forcedThroughRest = tone.arousal === "conserve" && !!deps.force;
  const board = deps.board || loadBoard();
  // E2E audit 25 Jul 2026: this was ONE gate on T7 (a gemini-flash key the
  // post-17-Jul shift never spends) that killed the ENTIRE night — probe bank,
  // distractors, pre-answers, the season read — whenever the daytime DMN had
  // drained it. The cognition jobs ride the Claude subscription: they are bounded
  // by the shift-wide call budget below, not by a Gemini tank. T5 (the season
  // re-read's real spend) is metered where it is actually spent, at that job.
  const t5 = board.tanks.find(t => t.id === "T5");
  const geminiDry = t5 ? headroomOf(t5) < CAPS.min_gemini_headroom : false;
  // C3.8 — the shift's calls now answer to the WINDOW as well as to the call count.
  // Injected, so every existing selftest stays hermetic (they pass their own budget
  // or the unlimited one) and no assertion below suddenly needs a live ledger.
  const budget = deps.budget || makeBudget(CAPS.shift_call_budget, deps.windowFn || liveWindowAllowed);
  const jobDeps = { ...deps, budget };
  const day = dayKey(now);   // Block 6 — the SHIFT day = the 02:40 slot's day, not the wake hour's
  // Recorded on the shift itself, so a forced run through the rest law is legible in
  // the filed report months later and can never be mistaken for a normal night.
  const out = { date: day, jobs: {}, ...(forcedThroughRest ? { forced_through_conserve: true } : {}) };
  const write = deps.write || ((name, content) => writeAtomic(join(OUT_DIR, name), content));

  const sleptNow = [];   // THE GATE — cards collected across the three lanes, filed ONCE below
  // THE GATE — probe bank (event "lock" · evidence = concepts to probe)
  const pbConcepts = deps.concepts || drillConcepts(deps);
  const lockEv = deps.lockEvent || lockSinceLastProbeBank();
  const gPB = nsGate("ns_probe_bank", { evidence: pbConcepts.length ? { ok: true, detail: `${pbConcepts.length} concept(s) to probe` } : { ok: false, detail: "no locked/weak concept to probe" }, event_armed: !!lockEv.armed, deps, now, collect: sleptNow });
  let pb = { bank: {}, spent: 0 };
  if (!gPB.run) {
    out.jobs.probe_bank = asleepRecord(gPB);
  } else {
    pb = await probeBank(jobDeps);
    const gr = Object.keys(pb.bank).length ? await gradeProbes(pb.bank, jobDeps) : { graded: 0, spent: 0 };   // M23 — grade BEFORE the bank is filed
    if (Object.keys(pb.bank).length) write(`probe_bank_${day}.json`, { date: day, bank: pb.bank, capsule_shas: capsuleShaMap(deps.manifest !== undefined ? deps.manifest : readJson(join(STATE_DIR, "mirror_manifest.json"))) });   // THE GATE — the fingerprint the next lock-event check compares against
    out.jobs.probe_bank = { concepts: Object.keys(pb.bank).length, spent: pb.spent, graded: gr.graded, grade_spent: gr.spent, lock_event: lockEv.why };
  }

  // JOB 1c — the field probes. Written to ONE cumulative file, not a day-stamped
  // one: this bank is the organism's standing memory of what the real world asks,
  // and a reader must never have to guess which night's file is current.
  const fp = await fieldProbes(jobDeps);
  if (Object.keys(fp.bank).length) write(FIELD_PROBES_FILE, { updated: new Date().toISOString(), concepts: fp.bank });
  out.jobs.field_probes = { researched: fp.added, refused: fp.refused, considered: fp.considered, spent: fp.spent, concepts_banked: fp.total_concepts };

  // JOB 1d — the round read. Day-stamped: this one IS about a particular day's
  // round, unlike the field bank, and conflating them would lose the history.
  const rr = await roundRead({ ...jobDeps, day });
  if (rr.read) write(`round_read_${day}.json`, rr.read);
  out.jobs.round_read = rr.read
    ? { axes: rr.read.axes, patterns: rr.read.patterns.length, overconfident: rr.read.overconfident, spent: rr.spent, file: `round_read_${day}.json` }
    : { skipped: rr.skipped, spent: rr.spent };

  // THE GATE — distractors (window · evidence = his doubt-grammar shapes + concepts)
  {
    const grammar = deps.grammar !== undefined ? deps.grammar : readJson(join(STATE_DIR, "doubt_grammar.json"));
    const shapes = (grammar && Array.isArray(grammar.clusters)) ? grammar.clusters.length : 0;
    const gDB = nsGate("ns_distractors", { evidence: shapes && pbConcepts.length ? { ok: true, detail: `${shapes} confusion shape(s) × ${pbConcepts.length} concept(s)` } : { ok: false, detail: shapes ? "no concept to distract on" : "doubt_grammar.json has no clusters — distractors need HIS confusion shapes" }, deps, now, collect: sleptNow });
    if (!gDB.run) out.jobs.distractors = asleepRecord(gDB);
    else {
      const db = await distractorBank(jobDeps);
      if (Object.keys(db.bank).length) write(`distractor_bank_${day}.json`, { date: day, bank: db.bank });
      out.jobs.distractors = { concepts: Object.keys(db.bank).length, spent: db.spent };
    }
  }

  let backfilled = 0;
  if (!deps.skipBackfill) {
    const idxRecall = deps.indexRecall || indexRecall;
    // E2E audit 26 Jul 2026: indexRecall returns 0 for BOTH "nothing left to embed"
    // and "the Dugout's hourly tick holds the lock right now", so this loop used to
    // abandon the whole night's backfill on a simple timing collision. It now asks
    // (via the status out-channel) and waits the lock out a bounded number of times.
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    let lockRetries = 0;
    for (let i = 0; i < 20; i++) {
      const status = {};
      const n = await idxRecall({ status }).catch(() => 0);
      backfilled += n;
      if (n) continue;
      if (status.locked && lockRetries < 3) { lockRetries++; await sleep(deps.lockRetryMs ?? 3000); i--; continue; }
      break;                                            // genuinely nothing left to embed
    }
    // E2E audit 25 Jul 2026: indexEpisodes() reads ALL of episodes.jsonl, awaits a
    // multi-second embed round-trip, then REWRITES THE WHOLE FILE by rename — and
    // it ran here at 03:00, the same minute the hourly ArsenalFC-HippoIndex task
    // runs the identical pass, while any live daemon can still markMoment-append.
    // Whatever landed inside that window was silently erased by the rename: a lost
    // moment leaves no error, only a hole in his memory. The hourly indexer already
    // owns that lane, so the shift no longer competes for the file. The path stays
    // (layering) behind an explicit opt-in, for the day the schtask dies.
    if (deps.backfillEpisodes) backfilled += await (deps.indexEpisodes || indexEpisodes)().catch(() => 0);
  }
  out.jobs.embed_backfill = { chunks: backfilled };

  const sp = scoutPack(deps, now);
  write("scout_pack.md", sp.md);
  out.jobs.scout_pack = { prompts: sp.prompts };

  const gc = gemCartridge({ ...deps, probeBank: Object.keys(pb.bank).length ? { bank: pb.bank } : undefined }, now);
  write("gem_cartridge.md", gc.md);
  // #106 — what the cartridge actually carries, not a literal that cannot fail
  out.jobs.gem_cartridge = { ...gc.filled, empty: !(gc.filled.capsules || gc.filled.probe_concepts || gc.filled.has_fingerprint || gc.filled.danger_topics || gc.filled.premap_day) };   // G10 — premap counts as filling

  // E3 (9 Aug 2026): the ledger rolls at 2 MB now — read the .1 generation too,
  // so the tunnel's 200-decision sample survives a roll that happened yesterday.
  const rows = deps.ledgerRows || [
    ...readLines(join(STATE_DIR, "salience_ledger.jsonl.1")),
    ...readLines(join(STATE_DIR, "salience_ledger.jsonl")),
  ];
  const wt = windTunnel(rows, deps.thalamusCfg || loadThalamusConfig(), { now, ...(deps.tunnel || {}) });
  // ── #73 · GIVE THE WIND TUNNEL AN ADDRESS ─────────────────────────────────
  // gate_tune_<date>.md has been written nightly since 20 Jul with no reader
  // anywhere in the repo. Deleting it is not an option (rule: never delete an
  // organ because nobody reads it — give it an address), and a mutation lane is
  // not an option either (the TRAP: its target would be rejected by the Boot
  // Room's validateMutation, so any wiring must be presentation-only). The
  // address is the SHIFT RECORD: shift_<date>.json is read back by
  // `nightshift status` and by dugout.mjs:1215/:1238, so the verdict and its
  // numbers now reach a surface without inventing an auto-apply path.
  if (wt.proposal) {
    write(`wind_tunnel_${day}.json`, wt.proposal);
    write(`gate_tune_${day}.md`, wt.md);
    out.jobs.gate_tune = { proposed: true, engine: "wind_tunnel", wakes_per_day: wt.base.wakes_per_day, band: (deps.tunnel && deps.tunnel.band) || TUNNEL.band, in_band: false, decisions: wt.base.rows, file: `gate_tune_${day}.md` };
  } else if (wt.md) {
    // the tunnel had its sample and filed a verdict — healthy OR out-of-band
    write(`gate_tune_${day}.md`, wt.md);
    out.jobs.gate_tune = { engine: "wind_tunnel", healthy: !!wt.healthy, out_of_band: !!wt.out_of_band, wakes_per_day: wt.base.wakes_per_day, band: wt.band, in_band: !!wt.healthy, decisions: wt.base.rows, days: wt.base.days, file: `gate_tune_${day}.md`, why: wt.why };
  } else {
    const gt = gateTuneReport(rows, now);            // the frozen heuristic floor (layering)
    if (gt.md) write(`gate_tune_${day}.md`, gt.md);
    out.jobs.gate_tune = gt.md ? { proposed: true, engine: "legacy", file: `gate_tune_${day}.md` } : { silent: gt.why };
  }
  // LADDER B5 (9 Aug 2026) — the applier's nightly score ride. gate_tune.mjs is
  // the declared owner of applied tier mutations (window · min-events extend ·
  // out-of-band auto-revert). This is a CALL, not a write — the owner does its
  // own writing; nothing here touches thalamus_config. Fail-soft: a missing or
  // erroring scorer is recorded, never fatal to the shift.
  if (!deps.skipGateTuneScore) {
    try {
      const { execFileSync } = await import("node:child_process");
      const sout = execFileSync(process.execPath, [join(__dirname, "gate_tune.mjs"), "score"], { encoding: "utf8", timeout: 30000 });
      out.jobs.gate_tune_score = { ran: true, said: String(sout).trim().slice(0, 200) };
    } catch (e) {
      out.jobs.gate_tune_score = { ran: false, error: String((e && e.message) || e).slice(0, 160) };
    }
  }

  // THE GATE — pre-answers (window · evidence = the engine's own material check)
  {
    const material = deps.material || preAnswerMaterial(deps, now);
    const signal = !!(material && ((material.clusters || []).length || (material.voiced || []).length || (material.due || []).length || (material.danger || []).length || (material.threads || []).length));
    const gPA = nsGate("ns_pre_answers", { evidence: signal ? { ok: true, detail: "real signal on the bus (clusters/voiced/due/danger/threads)" } : { ok: false, detail: "no real signal on the bus — never predict doubts from nothing" }, deps, now, collect: sleptNow });
    if (!gPA.run) out.jobs.pre_answers = asleepRecord(gPA);
    else {
      const pa = await preAnswerEngine({ ...jobDeps, material });
      // #56 — the corpus report rides the record on BOTH paths. "0 of his own turns
      // in the window" is now a number on a surface, not an unstated assumption.
      out.jobs.pre_answers = pa.ok
        ? { predicted: pa.predicted, answered: pa.answered, embedded: pa.embedded, spent: pa.spent, corpus: pa.corpus }
        : { skipped: pa.skipped, corpus: pa.corpus };
    }
  }

  // the season re-read is the shift's ONE genuine Gemini call — it, and only it,
  // answers to T5's headroom (E2E audit 25 Jul 2026: the gate now meters the
  // resource the job actually spends)
  const sr = geminiDry
    ? { ok: false, skipped: `T5 headroom ${headroomOf(t5)} < ${CAPS.min_gemini_headroom} — the long-context lane is spent; yesterday's read stands` }
    : await seasonReRead(jobDeps);
  out.jobs.season_read = sr.ok ? { model: sr.model, contradictions: sr.contradictions, open_threads: sr.open_threads, edges: sr.edges } : { skipped: sr.skipped };

  // THE GATE — one card for the whole shift, however many lanes slept tonight
  if (sleptNow.length && !deps.gateVerdict) { try { gateCardsForTick(sleptNow, now, { threshold: 1, label: "nightshift" }); } catch { } }
  out.gate = { asleep: sleptNow.map((c) => c.lane) };
  write(`shift_${day}.json`, out);
  return { ok: true, ...out };
}

async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const genProbes = async () => ({ ok: true, text: JSON.stringify(PROBE_TYPES.map(t => ({ type: t, probe: `a solid ${t} probe with enough length to pass validation` }))) });
  const genBad = async () => ({ ok: true, text: '[{"type":"vibes","probe":"x"},{"probe":123}]' });
  const base = { force: true, windowFn: () => Infinity,   /* C3.8 — the shift now answers to the window; every fixture stays HERMETIC by declaring an unlimited one rather than reading the live ledger */ tone: { arousal: "open", effects: {} }, board: { tanks: [{ id: "T7", quota_est: 250, observed_ceiling: 0, used_today: 0, enabled: true, key_index: 5 }] }, recordUse: () => {}, skipBackfill: true, write: () => {}, ledgerRows: [], concepts: [{ concept: "tokenization", why: "capsule" }], grammar: null, calibration: null, ls: null, who: null, dossier: null, capsuleFiles: ["tokenization.json"], afferents: [], cards: null, bannedPhrases: ["10x"], thalamusCfg: { tiers: { tau0: 0.25, tau1_base: 0.55, epsilon: 0.08, budget_k: 0.35 }, refractory_min: 45, wake_cap_per_day: 15 }, corpus: "", generateHot: async () => ({ ok: true, text: "the same words answer every hot sample identically here" }), generatePro: async () => ({ ok: true, text: "the same words answer every hot sample identically here" }),
    // 11 Aug 2026 — JOB 1c/1d MUST BE STUBBED HERE, and this line is the scar.
    // Shipped without them, `base` fell through to the REAL generators: the suite
    // fired live `claude -p --allowedTools WebSearch` calls, three per run, ~16k
    // tokens and ~14s each (measured off brain_ledger.jsonl, job "ns_field_probes").
    // Three consequences, all real: it broke this repo's "mock tests use no live
    // credentials" law; it spent his subscription every time anyone ran the suite;
    // and the added ~45s pushed organism_test's 120s per-member timeout over the
    // edge, so the watchman reported `suite-red` for a suite whose members all pass.
    // A new job that calls out MUST arrive with its stub in the same commit.
    generateField: async () => ({ ok: true, text: JSON.stringify({ questions: [] }) }),
    generateDeep: async () => { throw new Error("selftest: the round read must never reach a live model"); },
    priorField: { concepts: {} }, rejirahRows: [],
    // THE GATE (18 Aug 2026) — HERMETIC by injection: the fixtures above test the
    // lanes' own behaviour, so the gate answers AWAKE for them; the gate's own wire
    // is held by the block below, which injects asleep verdicts and reads the record.
    // lockEvent is injected too, so no fixture reads live capsule/bank mtimes.
    gateVerdict: () => ({ run: true, state: "awake", why: { E: { ok: true }, C: { ok: true }, F: { ok: true } }, wakes_when: null }),
    lockEvent: { armed: true, why: "fixture" },
    now: new Date("2026-07-15T02:45:00") };

  // ── THE GATE (overhaul §5.3) — the three LLM lanes answer to it ─────────────
  {
    const asleepV = (k) => ({ run: false, state: "asleep", why: { E: { ok: k !== "E", detail: "e" }, C: { ok: k !== "C", detail: "never consumed" }, F: { ok: k !== "F", detail: "f" } }, wakes_when: "its output reaches him" });
    const asked = [];
    let probeCalls = 0, distCalls = 0, paCalls = 0;
    const r = await runShift({ ...base,
      generate: async (p) => { if (/probe/i.test(p) && !/distractor/i.test(p)) probeCalls++; else if (/distractor/i.test(p)) distCalls++; else paCalls++; return genProbes(); },
      gateVerdict: (lane, { evidence, event_armed }) => { asked.push({ lane, evidence, event_armed }); return lane === "ns_probe_bank" ? asleepV("C") : lane === "ns_pre_answers" ? asleepV("E") : { run: true, state: "awake", why: { E: { ok: true }, C: { ok: true }, F: { ok: true } } }; },
      material: { clusters: [], voiced: [], hotTokens: [], due: [], danger: [], threads: [] },
    });
    assert("GATE — every one of the three LLM lanes ASKS the gate, with its own evidence and (probe bank) the lock event",
      asked.map((a) => a.lane).sort().join() === "ns_distractors,ns_pre_answers,ns_probe_bank"
      && asked.find((a) => a.lane === "ns_probe_bank").event_armed === true
      && asked.find((a) => a.lane === "ns_probe_bank").evidence.ok === true
      && asked.find((a) => a.lane === "ns_pre_answers").evidence.ok === false);
    assert("GATE — an ASLEEP lane spends nothing and leaves ONE honest line in the shift record (why + wakes_when); an AWAKE lane runs exactly as before",
      r.jobs.probe_bank.asleep === true && r.jobs.probe_bank.why === "C" && /never consumed/.test(r.jobs.probe_bank.detail) && r.jobs.probe_bank.spent === 0 && probeCalls === 0
      && r.jobs.pre_answers.asleep === true && r.jobs.pre_answers.why === "E"
      && r.jobs.distractors.asleep === undefined);
    assert("GATE — the gem cartridge still builds when the probe bank slept (an asleep upstream is an empty input, never a crash)",
      r.jobs.gem_cartridge && typeof r.jobs.gem_cartridge.empty === "boolean");
    // the lock event, on injected reads (no disk: this organ's static footprint stays flat)
    const M = (shas) => ({ per_id: Object.fromEntries(Object.entries(shas).map(([id, sha]) => [id, { ok: true, sha256: sha }])) });
    assert("LOCK EVENT — no bank on disk ⇒ armed (the first bank is every capsule's lock event)",
      lockSinceLastProbeBank({ manifest: M({ tokenization: "a" }), lastBank: null }).armed === true);
    assert("LOCK EVENT — a pre-gate bank with no fingerprint ⇒ armed once (then it gates)",
      lockSinceLastProbeBank({ manifest: M({ tokenization: "a" }), lastBank: { date: "2026-07-15", bank: {} } }).armed === true);
    assert("LOCK EVENT — same shas as the last bank ⇒ NOT armed (nothing locked or edited since)",
      lockSinceLastProbeBank({ manifest: M({ tokenization: "a", embeddings: "b" }), lastBank: { date: "2026-07-15", capsule_shas: { tokenization: "a", embeddings: "b" } } }).armed === false);
    assert("LOCK EVENT — a changed sha, a new capsule, or a vanished one ⇒ armed, and the why NAMES the capsule(s)",
      /embeddings/.test(lockSinceLastProbeBank({ manifest: M({ tokenization: "a", embeddings: "c" }), lastBank: { date: "2026-07-15", capsule_shas: { tokenization: "a", embeddings: "b" } } }).why)
      && /inference/.test(lockSinceLastProbeBank({ manifest: M({ tokenization: "a", inference: "z" }), lastBank: { date: "2026-07-15", capsule_shas: { tokenization: "a" } } }).why)
      && lockSinceLastProbeBank({ manifest: M({ tokenization: "a" }), lastBank: { date: "2026-07-15", capsule_shas: { tokenization: "a", embeddings: "b" } } }).armed === true);
    assert("LOCK EVENT — capsuleShaMap reads only ok rows with a sha; the live default never throws",
      Object.keys(capsuleShaMap({ per_id: { a: { ok: true, sha256: "x" }, b: { ok: false, sha256: "y" }, c: { ok: true } } })).join() === "a"
      && typeof lockSinceLastProbeBank().armed === "boolean");
    // the live path (no injection) reaches the owner's verdict function — grep-held,
    // because a hermetic suite cannot run it without a live ledger
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    assert("GATE — the live path calls brain's gateVerdictForLane + gateTransition (owner-held journal/card), and the three lanes carry a declared gate/surface",
      /gateVerdictForLane\(lane, \{ evidence, gate: spec\.gate, event_armed, now, surface: spec\.surface \}\)/.test(src)
      && /gateTransition\(lane, v, \{ now, by: "nightshift", collectCards: collect \}\)/.test(src)
      && /gateCardsForTick\(sleptNow, now, \{ threshold: 1, label: "nightshift" \}\)/.test(src)
      && ["ns_probe_bank", "ns_distractors", "ns_pre_answers"].every((l) => NS_GATE[l] && NS_GATE[l].surface));
  }

  // ── THE LEDGER ROW: the whole honest shape, or the governor is lied to ─────
  // Fixtures are claudegen's own outputs, verbatim in shape (claudegen.mjs:134
  // parseOut / :150 parseErr). This block goes red the moment a field is dropped
  // off the row again — which is exactly how the four honesty fields spent weeks
  // being computed and thrown away at this door (measured 10 Aug 2026: 50 ns_
  // rows, 0 carrying tokens_estimated / http_status / limit_signal / error_envelope).
  {
    const measured = nsLedgerRow({ ok: true, total_tokens: 14907, input_tokens: 2, output_tokens: 471, cache_creation_tokens: 14434, cache_read_tokens: 0, tokens_estimated: false, duration_ms: 16220, limit_hit: false, http_status: null, limit_signal: "none", error: null, error_envelope: null }, "sonnet", "ns_probe_bank", new Date("2026-07-15T02:45:00"));
    assert("LEDGER ROW: a MEASURED total says so, and the cache pair survives the door",
      measured.tokens_estimated === false && measured.cache_creation_tokens === 14434 && measured.total_tokens === 14907 && measured.job === "ns_probe_bank");
    // the shape claudegen hands back when the CLI returned no usage block: the
    // total is (prompt+text).length/4 — a GUESS that windowUsage sums as spend.
    const est = nsLedgerRow({ ok: true, total_tokens: 500, input_tokens: null, output_tokens: null, cache_creation_tokens: null, cache_read_tokens: null, tokens_estimated: true, duration_ms: 900, limit_hit: false, http_status: null, limit_signal: "none", error: null, error_envelope: null }, "sonnet", "ns_pre_answers", new Date("2026-07-15T02:45:00"));
    assert("LEDGER ROW: a LENGTH-ESTIMATED total is stamped as one (a guess must never read as a measurement)",
      est.tokens_estimated === true && est.input_tokens === null && est.total_tokens === 500);
    // the failure path — the one the dead-brain alarm reads (brain.mjs:662/679)
    const envelope = '{"type":"result","is_error":true,"api_error_status":429,"session_id":"ns-1","result":"You\'ve hit your weekly limit · resets Aug 12"}';
    const wall = nsLedgerRow({ ok: false, total_tokens: 0, tokens_estimated: true, duration_ms: 700, limit_hit: true, http_status: 429, limit_signal: "api_error_status", error: "You've hit your weekly limit · resets Aug 12", error_envelope: envelope }, "sonnet", "ns_grade_probes", new Date("2026-07-15T02:45:00"));
    assert("LEDGER ROW: a failed night is NAMEABLE — 429 vs 500 vs timeout rides the row, envelope included",
      wall.http_status === 429 && wall.limit_signal === "api_error_status" && wall.error_envelope === envelope && wall.limit_hit === true && wall.tokens_estimated === true);
  }

  // gates
  assert("daytime → no shift (it works while he sleeps)", (await runShift({ ...base, force: false, now: new Date("2026-07-15T14:00:00") })).skipped.includes("not overnight"));
  assert("conserve tone → no shift (the machine rests too)", (await runShift({ ...base, force: false, now: new Date("2026-07-15T02:45:00"), tone: { arousal: "conserve", effects: {} } })).skipped.includes("conserve"));
  // audit #108: --force must clear BOTH gates. Before this, the overnight gate honoured
  // --force and the conserve gate did not, so a recovery run on a conserve day returned
  // the same silent `skipped` as the four-day-dead lane it was meant to rescue.
  {
    const forced = await runShift({ ...base, generate: genProbes, tone: { arousal: "conserve", effects: {} } });
    assert("#108 --force overrides the conserve gate too (a recovery run is possible on a rest day)", !forced.skipped);
    assert("#108 a run forced through the rest law SAYS so on the filed shift", forced.forced_through_conserve === true);
    assert("#108 a normal shift carries no such flag (the marker is never noise)",
      (await runShift({ ...base, generate: genProbes })).forced_through_conserve === undefined);
    assert("#108 the conserve skip message now names the override", (await runShift({ ...base, force: false, now: new Date("2026-07-15T02:45:00"), tone: { arousal: "conserve", effects: {} } })).skipped.includes("--force"));
  }
  // E2E audit 25 Jul 2026: a drained T7 used to cancel the WHOLE night, though
  // the cognition lane is the Claude subscription and spends no Gemini at all.
  {
    const dryT7 = await runShift({ ...base, generate: genProbes, board: { tanks: [{ id: "T7", quota_est: 30, observed_ceiling: 0, used_today: 29, enabled: true, key_index: 5 }] } });
    assert("a drained GEMINI DMN tank never cancels the CLAUDE-lane shift", dryT7.ok === true && dryT7.jobs.probe_bank.concepts === 1);
    const dryT5 = await runShift({ ...base, generate: genProbes, corpus: "x".repeat(5000), board: { tanks: [
      { id: "T5", quota_est: 50, observed_ceiling: 0, used_today: 50, enabled: true, key_index: 3 },
      { id: "T7", quota_est: 250, observed_ceiling: 0, used_today: 0, enabled: true, key_index: 5 },
    ] } });
    assert("the season re-read (the shift's ONE real Gemini spend) answers to T5's own headroom", dryT5.ok === true && dryT5.jobs.season_read.skipped.includes("T5 headroom"));
  }

  // the jobs
  // --- JOB 1d: THE ROUND READ (11 Aug 2026) ---------------------------------
  // Pinned hardest: it must never mistake a round-close row for an axis, and it
  // must REFUSE filler — a read with nothing in it would teach him to stop
  // opening the file, which is worse than no read at all.
  {
    const DAY = "2026-08-11";
    const rows = [
      { ts: `${DAY}T18:00:00Z`, concept: "embeddings", axis: "a", result: "held", gut: "knew" },
      { ts: `${DAY}T18:05:00Z`, concept: "embeddings", axis: "c", result: "cracked", gut: "knew" },
      { ts: `${DAY}T18:09:00Z`, concept: "embeddings", axis: "f", result: "cracked", gut: "shaky" },
      { ts: `${DAY}T18:12:00Z`, concept: "embeddings", kind: "round-close" },
      { ts: "2026-08-10T18:00:00Z", concept: "context", axis: "a", result: "held", gut: "knew" },
    ];
    assert("ROUND READ — picks today's AXIS grades only: yesterday is out, and a round-close row is not an axis",
      todaysGrades(rows, DAY).length === 3 && todaysGrades(rows, DAY).every(r => /^[acf]$/.test(r.axis)));
    const thin = await roundRead({ day: DAY, rejirahRows: rows.slice(0, 2), transcript: "", generateDeep: async () => { throw new Error("must not call opus for a 2-axis day"); } });
    assert("ROUND READ — under the floor it SKIPS and says the number (no Opus call on a two-axis day)",
      thin.read === null && thin.spent === 0 && /2 axis grade/.test(thin.skipped));
    const good = await roundRead({
      day: DAY, rejirahRows: rows, transcript: "…his spoken answers…",
      generateDeep: async () => ({ ok: true, text: JSON.stringify({ patterns: ["definition given, mechanism dropped, on both c and f"], overconfident: ["c"], next: ["re-open c: derive the vector, do not describe it"], note: "one honest sentence about the round" }) }),
    });
    assert("ROUND READ — a real read carries the cross-axis pattern, the overconfident cell and the grid it judged",
      good.read.patterns.length === 1 && good.read.overconfident[0] === "c"
      && good.read.axes === 3 && good.read.grid.length === 3 && good.read.grid[1].gut === "knew");
    assert("ROUND READ — FILLER IS REFUSED: no pattern and no next step is not a read",
      validateRoundRead({ patterns: [], overconfident: ["c"], next: [], note: "hi" }) === null);
    assert("ROUND READ — an invented axis label cannot enter the overconfident list",
      validateRoundRead({ patterns: ["a real pattern sentence here"], overconfident: ["c", "zz", "axis f"], next: [] }).overconfident.join(",") === "c");
    const bad = await roundRead({ day: DAY, rejirahRows: rows, transcript: "", generateDeep: async () => ({ ok: true, text: "not json at all" }) });
    assert("ROUND READ — unusable output writes NOTHING and says so (a garbled night is not a finding)",
      bad.read === null && /unusable/.test(bad.skipped));
    const dead = await roundRead({ day: DAY, rejirahRows: rows, transcript: "", generateDeep: async () => ({ ok: false }) });
    assert("ROUND READ — a failed call is honest silence, never an empty read", dead.read === null && /did not return/.test(dead.skipped));
  }

  // --- JOB 1c: THE FIELD PROBES (11 Aug 2026) -------------------------------
  // The whole worth of this job is what it REFUSES, so that is what is pinned
  // hardest: a question with no source is an invented question wearing the word
  // "real", and a thin night must not stamp a fetch date that blocks the refresh
  // for a month.
  {
    const NOWF = new Date("2026-08-11T22:00:00Z");
    const ok2 = [
      { q: "Explain HNSW versus IVF and when you would pick each in production.", sources: ["https://example.com/a"] },
      { q: "Your embedding model changed dimensions mid-quarter — how do you migrate?", sources: ["https://example.com/b"] },
      { q: "Why does pure vector search fail on exact IDs and rare proper nouns?", sources: ["https://example.com/c"] },
    ];
    assert("FIELD — a question with NO source is DROPPED (this is the entire difference from probeBank)",
      validateFieldItems([...ok2, { q: "Some plausible-sounding invented interview question here", sources: [] }]).length === 3);
    assert("FIELD — a non-http 'source' is not a source",
      validateFieldItems([{ q: "A long enough question to pass the length floor here", sources: ["my training data"] }]).length === 0);
    assert("FIELD — a stub question is dropped even WITH a source",
      validateFieldItems([{ q: "what is it", sources: ["https://example.com/a"] }]).length === 0);
    assert("FIELD — `question` is accepted as an alias for `q` (the model writes both shapes)",
      validateFieldItems([{ question: "Explain HNSW versus IVF and when you would pick each.", sources: ["https://example.com/a"] }]).length === 1);
    assert("FIELD — never fetched = stale; fetched now = fresh (the refresh window is real)",
      fieldStale(undefined, NOWF) === true
      && fieldStale({ fetched: NOWF.toISOString() }, NOWF) === false
      && fieldStale({ fetched: "2026-01-01T00:00:00Z" }, NOWF) === true);
    assert("FIELD — a garbage `fetched` counts as stale, never as fresh (a bad date must not block a refresh forever)",
      fieldStale({ fetched: "not-a-date" }, NOWF) === true);

    const fdeps = { now: NOWF, priorField: { concepts: {} }, concepts: [{ concept: "embeddings", why: "locked capsule" }] };
    const thin = await fieldProbes({ ...fdeps, generateField: async () => ({ ok: true, text: JSON.stringify({ questions: [ok2[0]] }) }) });
    assert("FIELD — a THIN night is REFUSED, not banked (a fetch stamp would block the retry for a month)",
      thin.added === 0 && thin.refused === 1 && !thin.bank.embeddings);
    const good = await fieldProbes({ ...fdeps, generateField: async () => ({ ok: true, text: "```json\n" + JSON.stringify({ questions: ok2 }) + "\n```" }) });
    assert("FIELD — a real return is banked WITH its fetch date and its sources, fences and all",
      good.added === 1 && good.bank.embeddings.questions.length === 3
      && good.bank.embeddings.fetched === NOWF.toISOString()
      && good.bank.embeddings.questions[0].sources[0] === "https://example.com/a");
    const fresh = await fieldProbes({
      ...fdeps,
      priorField: { concepts: { embeddings: { fetched: NOWF.toISOString(), questions: ok2 } } },
      generateField: async () => { throw new Error("must not be called for a fresh concept"); },
    });
    assert("FIELD — an already-fresh concept is NOT re-asked (the nightly cost is new topics, not the whole syllabus)",
      fresh.spent === 0 && fresh.considered === 0 && fresh.total_concepts === 1);
    const failed = await fieldProbes({ ...fdeps, generateField: async () => ({ ok: false, text: "" }) });
    assert("FIELD — a failed call banks NOTHING (silence is never a fetch)",
      failed.added === 0 && Object.keys(failed.bank).length === 0);
    assert("FIELD — every FUTURE locked capsule is picked up with no edit here: the concept list is drillConcepts', which reads capsules/ live",
      /deps\.concepts \|\| drillConcepts\(deps\)/.test(readFileSync(fileURLToPath(import.meta.url), "utf8").split("async function fieldProbes")[1].slice(0, 900)));
  }

  {
    const writes = {};
    // Built once and named, so the no-live-call guard below can inspect the EXACT
    // object the shift receives — `generate` is supplied here and not in `base`,
    // and a guard that reads `base` alone would have passed while missing it.
    const shiftDeps = { ...base, generate: genProbes, write: (n, c) => { writes[n] = c; } };
    const r = await runShift(shiftDeps);
    assert("the shift runs all eight jobs and files the shift record", r.ok && writes["shift_2026-07-15.json"] && r.jobs.probe_bank && r.jobs.gem_cartridge && "pre_answers" in r.jobs && "season_read" in r.jobs);
    assert("JOB 1c — the field probes ride the shift record too (a job with no record is a job nobody can audit)",
      "field_probes" in r.jobs);
    assert("JOB 1d — the round read rides the shift record, and says WHY when it skips",
      "round_read" in r.jobs && (r.jobs.round_read.skipped || r.jobs.round_read.axes));
    // THE NO-LIVE-CALL GUARD (11 Aug 2026 scar). Every job in `base` that can reach
    // a model must be stubbed there. Shipped without these, the suite fired three
    // real `claude -p --allowedTools WebSearch` calls per run — his tokens, on every
    // test — and the extra ~45s tripped organism_test's 120s per-member timeout, so
    // the watchman cried suite-red about a suite whose members all pass. Asserted on
    // `base` itself rather than on call counts: the failure mode is a MISSING stub,
    // and this is the shape that catches the next job added without one.
    assert("NO LIVE CALLS — every model-reaching job is stubbed in the deps the shift actually receives",
      ["generate", "generateHot", "generatePro", "generateField", "generateDeep"]
        .every((k) => typeof shiftDeps[k] === "function"));
    assert("probe bank: one per grammar type, validated, dated", writes["probe_bank_2026-07-15.json"].bank.tokenization.probes.length === 5);
    assert("distractors: one call is attempted per drill concept", r.jobs.distractors.spent >= 1);
    assert("scout pack: ready-to-paste Deep Research prompts for the Pro lane", writes["scout_pack.md"].includes("Deep-research") && writes["scout_pack.md"].includes("paste"));
    assert("gem cartridge: gut-word law + reps-JSON contract travel to the phone", writes["gem_cartridge.md"].includes("knew/shaky/guessed") && writes["gem_cartridge.md"].includes("paste"));
    // #106 — the shift record said `{ok:true}` unconditionally: a status that
    // cannot fail. It now counts what actually went into the cartridge.
    assert("#106: the gem-cartridge record is a have/need count, not a literal that cannot fail",
      r.jobs.gem_cartridge.ok === undefined && r.jobs.gem_cartridge.capsules === 1 && r.jobs.gem_cartridge.probe_concepts === 1 && r.jobs.gem_cartridge.empty === false);
    const bare = gemCartridge({ who: null, calibration: null, capsuleFiles: [], probeBank: undefined }, new Date("2026-07-15T02:45:00"));
    assert("#106: an EMPTY cartridge says it is empty (it still writes, and still would have said ok)",
      bare.filled.capsules === 0 && bare.filled.probe_concepts === 0 && bare.filled.has_fingerprint === false);
    // WIRING AUDIT (10 Aug 2026) — the cartridge's rep contract is hardcoded track:"concept",
    // so whatever this text names comes back a concept rep. A skill-track danger topic must
    // therefore never appear in it, must still be COUNTED (withheld ≠ vanished), and the axis
    // calibration computes for concept entries must actually arrive at the examiner.
    const mixedCart = gemCartridge({ who: null, capsuleFiles: [], probeBank: undefined, premap: null, calibration: { danger_zone: [
      { topic: "pydantic", track: "skill", confidence: "high", accuracy: "low" },
      { topic: "chunking", track: "concept", confidence: "high", accuracy: "low", axis: "f" },
    ] } }, new Date("2026-07-15T02:45:00"));
    assert("#wire: skill-track danger is WITHHELD from the concept examiner's cartridge, named in the record, and the concept entry arrives WITH its axis",
      !mixedCart.md.includes("pydantic") && mixedCart.md.includes("chunking") && mixedCart.md.includes("axis f")
      && mixedCart.filled.danger_topics === 1 && mixedCart.filled.danger_skill_withheld[0] === "pydantic"
      && mixedCart.md.includes('"track":"concept"'));
    assert("gate tuner: silent under 20 decisions (no early false alarms)", r.jobs.gate_tune.silent && r.jobs.gate_tune.silent.includes("20"));
  }
  // validation honesty
  {
    const pb = await probeBank({ ...base, generate: genBad });
    assert("junk probes REJECTED per-item (code validates, junk never banked)", Object.keys(pb.bank).length === 0);
  }
  // JOB 2 — the personalization the old check never looked at (E2E audit 25 Jul
  // 2026: it asserted only `spent >= 1`, with grammar null and a probe-shaped
  // generator, so it passed while banking nothing and personalizing nothing —
  // deleting the confusion-shape interpolation would not have moved it).
  {
    let seenPrompt = null;
    const genD = async (p) => { seenPrompt = p; return { ok: true, text: JSON.stringify([{ distractor: "the KV cache makes attention linear because the keys are already computed", why_wrong: "the new token still meets every cached key — n handshakes remain" }]) }; };
    const db = await distractorBank({ ...base, generate: genD, grammar: { clusters: [{ shape: "scale_intuition_failure" }, { shape: "cache_means_free" }] }, concepts: [{ concept: "kv cache", why: "capsule" }] });
    assert("distractors: HIS OWN confusion shapes ride the prompt (the feature, not just the call)", seenPrompt.includes("scale_intuition_failure") && seenPrompt.includes("cache_means_free"));
    assert("distractors: valid items are banked with their why_wrong crack", db.bank["kv cache"] && db.bank["kv cache"].length === 1 && db.bank["kv cache"][0].why_wrong.includes("handshakes"));
  }
  // THE SHIFT-WIDE CALL BUDGET (E2E audit 25 Jul 2026: one headroom check before
  // job 1, then ~62 spends with no re-check — the cap was declared, not enforced)
  {
    const b1 = makeBudget(2);
    const pb = await probeBank({ ...base, generate: genProbes, budget: b1, concepts: [{ concept: "a", why: "w" }, { concept: "b", why: "w" }, { concept: "c", why: "w" }, { concept: "d", why: "w" }] });
    assert("BUDGET: a job STOPS where the budget ends (partial work still files)", pb.spent === 2 && Object.keys(pb.bank).length === 2 && b1.left === 0);
    const rB = await runShift({ ...base, generate: genProbes, budget: makeBudget(1) });
    assert("BUDGET: it travels ACROSS jobs — grading and distractors stop too", rB.jobs.probe_bank.spent === 1 && rB.jobs.probe_bank.grade_spent === 0 && rB.jobs.distractors.spent === 0);

    // ---- C3.8 · THE NIGHT RESERVE — the fix for BOTH remaining starvations ----
    // The shift capped CALLS and never TOKENS, so it drank the window dry at 02:40
    // and the two 03:00 jobs behind it starved: `cortex consolidate` failed EVERY
    // day with "no-headroom (0/50000 needed)", and `diary` — enabled, priority 10 —
    // has NEVER PRODUCED A PAGE. Measured in the 5h window ending 03:00 on 12 Aug:
    // 27,34,271 spent against a 26,12,500 cap, biggest line ns_pre_answers 6,16,346.
    {
      const rich = makeBudget(10, () => 5000000);
      assert("C3.8/NIGHT — with the window open, the shift spends its calls exactly as before",
        rich.take() === true && rich.take() === true && rich.left === 8 && rich.starved === 0);
      const dry = makeBudget(10, () => NIGHT_RESERVE - 1);
      assert("C3.8/NIGHT — with the window at the reserve, the shift STOPS even though it has 10 calls left (a call count is not a token budget)",
        dry.take() === false && dry.left === 10 && dry.starved === 1);
      assert("C3.8/NIGHT — and the reserve binds BEFORE the call count, which is the exact case that starved the 03:00 jobs",
        dry.spent === 0);
      // every term of the reserve is measured; none is chosen.
      assert("C3.8/NIGHT — the reserve is DERIVED: cortex's own 50,000 floor + two late-job p90s of 49,991 (96 real jobs, ledger 9-12 Aug)",
        NIGHT_RESERVE === 150000);
      // FAIL-OPEN: a governor that will not load must never be the reason the night
      // produced nothing. This is the same contract the DMN's fourth gate carries.
      const broken = makeBudget(3, () => { throw new Error("brain_ledger.jsonl unreadable"); });
      assert("C3.8/NIGHT — FAIL-OPEN: an unreadable governor does not silence the night shift", broken.take() === true && broken.left === 2);
      const none = makeBudget(3);
      assert("C3.8/NIGHT — and a budget with NO window reader behaves exactly as it always did (every older fixture is untouched)",
        none.take() === true && none.left === 2 && none.starved === 0);
      // the reading is cached: 62 takes must not re-parse a 5,000-row ledger 62 times
      let reads = 0;
      const cached = makeBudget(5, () => { reads++; return 5000000; });
      cached.take(); cached.take(); cached.take();
      assert("C3.8/NIGHT — the window reading is cached for the shift, so the gate costs one ledger read, not one per call", reads === 1);
    }
  }
  // THE EMBED BACKFILL RACE (E2E audit 25 Jul 2026: indexEpisodes rewrites the
  // whole of episodes.jsonl and ran head-on into the hourly HippoIndex task)
  {
    let ep = 0;
    const r = await runShift({ ...base, generate: genProbes, skipBackfill: false, indexRecall: async () => 0, indexEpisodes: async () => { ep++; return 3; } });
    assert("BACKFILL: the shift never rewrites episodes.jsonl (the hourly indexer owns it)", ep === 0 && r.jobs.embed_backfill.chunks === 0);
    const rOpt = await runShift({ ...base, generate: genProbes, skipBackfill: false, backfillEpisodes: true, indexRecall: async () => 0, indexEpisodes: async () => { ep++; return 3; } });
    assert("BACKFILL: the episodes lane survives behind an explicit opt-in (layering)", ep === 1 && rOpt.jobs.embed_backfill.chunks === 3);
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
    // E2E audit 25 Jul 2026: this used to assert the MISBILLING (6×T7 + 2×T5) —
    // Gemini tanks charged for calls that ride the Claude subscription. The
    // assertion encoded the bug, so it now states the law instead.
    assert("GRADING: every spend rides the CLAUDE lane — no Gemini tank is billed for it", spends.filter(s => s === CLAUDE_LANE).length === 8 && spends.every(s => s !== "T7" && s !== "T5"));
    // the real claudeGen is SYNCHRONOUS and returns a PLAIN OBJECT: the old
    // `await genHot(q).catch(...)` threw "catch is not a function" and killed the
    // whole shift the instant the LLM lane actually worked (E2E audit 25 Jul 2026)
    const bankSync = { z: { why: "w", probes: [{ type: "novel", probe: "a sync-lane probe long enough to pass validation" }] } };
    let syncCalls = 0;
    const rSync = await gradeProbes(bankSync, {
      generateHot: () => ({ ok: true, text: ++syncCalls % 2 ? "attention scales quadratically because pairwise handshakes multiply across positions" : "a completely different framing regarding memory bandwidth saturation limits here" }),
      generatePro: () => ({ ok: true, text: "a third entirely distinct answer about compiler kernel fusion throughput ceilings" }),
      recordUse: () => {},
    });
    assert("GRADING: a SYNCHRONOUS generator (the real claudeGen shape) grades, never throws", rSync.graded === 1 && bankSync.z.probes[0].difficulty > 0.5);
    const rThrow = await gradeProbes({ t: { why: "w", probes: [{ type: "novel", probe: "a throwing-lane probe long enough to pass" }] } }, { generateHot: () => { throw new Error("EINVAL spawn claude"); }, generatePro: () => { throw new Error("EINVAL"); }, recordUse: () => {} });
    assert("GRADING: a THROWING generator degrades to ungraded, never kills the shift", rThrow.graded === 0);
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
    // WIRING AUDIT (10 Aug 2026) — the live shape that broke it: worst knew-accuracy leads,
    // and that was `pydantic` (track "skill"). It became a 9-axis concept probe and returned
    // through capture stamped track:"concept". Both halves are asserted: the skill entry never
    // reaches the concept probe list, and the concept entry behind it still does — a filter
    // that swallowed everything would pass a one-sided check.
    const mixed = drillConcepts({ calibration: { danger_zone: [
      { topic: "pydantic", track: "skill", confidence: "high", accuracy: "low" },
      { topic: "chunking", track: "concept", confidence: "high", accuracy: "low", axis: "f" },
    ] }, ls: null, capsuleFiles: [] });
    assert("#wire: a skill-track danger topic NEVER becomes a 9-axis concept probe (§11.3), the concept behind it still does",
      !mixed.some(x => x.concept === "pydantic") && mixed.some(x => x.concept === "chunking"));
    assert("#wire: an untracked (pre-25-Jul) danger entry is still drilled — the default is concept, nothing changes meaning",
      drillConcepts({ calibration: { danger_zone: [{ topic: "eval metrics" }] }, ls: null, capsuleFiles: [] })[0].concept === "eval metrics");
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
    // E2E audit 25 Jul 2026: the replay used a SYMMETRIC ε-band checked BEFORE
    // the wake test, so a score already AT/ABOVE the bar was resolved DOWN to
    // tier 1 — the gate the live thalamus abandoned on 18 Jul. His real voiced
    // doubts sit exactly there; the tunnel was calling his wakes "adjudications"
    // and filing proposals on evidence that never happened.
    const above = replayGate([{ day: "2026-07-01", ts: "2026-07-01T10:00:00Z", S: 0.58, headroom_frac: 1, key: "voice:in-band" }], thal.tiers, 45, 15);
    assert("REPLAY: ONE-SIDED ε — at/above the bar WAKES (mirrors the live 18 Jul gate)", above.wakes === 1 && above.adjudications === 0);
    const below = replayGate([{ day: "2026-07-01", ts: "2026-07-01T10:00:00Z", S: 0.50, headroom_frac: 1, key: "voice:near-miss" }], thal.tiers, 45, 15);
    assert("REPLAY: only a near-MISS below the bar adjudicates, and resolves DOWN", below.wakes === 0 && below.adjudications === 1 && below.tier1 === 1);
    const gated = replayGate([
      { day: "2026-07-01", ts: "2026-07-01T10:00:00Z", S: 0.75, headroom_frac: 1, key: "voice:same" },
      { day: "2026-07-01", ts: "2026-07-01T10:10:00Z", S: 0.50, headroom_frac: 1, key: "voice:same" },
    ], thal.tiers, 45, 15);
    assert("REPLAY: a refractory-gated near-miss buys no verdict (the free gates read first)", gated.wakes === 1 && gated.adjudications === 0);
    assert("REPLAY: the pre-audit symmetric band stays frozen beside it (layering)", replayGateLegacy([{ day: "2026-07-01", ts: "2026-07-01T10:00:00Z", S: 0.58, headroom_frac: 1, key: "voice:in-band" }], thal.tiers, 45, 15).wakes === 0);

    // ── #73 · "GATE HEALTHY" FOR A STARVED GATE ─────────────────────────────
    // Live on the audit: 5,280 rows, 0.43 wakes/day against the tunnel's own
    // [1, 8], base score 59, best grid 57 — hysteresis blocked the proposal and
    // the file said GATE HEALTHY. Hysteresis is disabled here (frac 0, abs 0) to
    // reproduce that exact state deterministically: nothing can ever be filed,
    // so the ONLY question left is whether the verdict tells the truth.
    {
      const blocked = { hysteresis_frac: 0, hysteresis_abs: 0, now: new Date("2026-07-15T02:45:00") };
      const starved = windTunnel(mkRows(), thal, blocked);         // 0 wakes/day — below the floor
      assert("#73: a gate BELOW its own floor is never called healthy, even when nothing can be proposed",
        starved.proposal === null && starved.healthy === false && starved.out_of_band === true && starved.base.wakes_per_day < starved.band[0]);
      assert("#73: the report says OUT OF BAND, shows the band, and says WHY nothing was filed",
        starved.md.includes("# GATE OUT OF BAND") && starved.md.includes("[1, 8]") && starved.md.includes("OUTSIDE")
        && starved.md.includes("NOT a clean bill of health") && starved.why.includes("OUT OF BAND"));
      assert("#73: the TRAP is respected — the surfacing is presentation-only, with no apply path",
        starved.md.includes("PRESENTATION ONLY") && starved.md.includes("validateMutation") && starved.md.includes("NEVER retunes itself"));
      const inband = windTunnel(healthyRows, thal, blocked);       // 3 wakes/day — inside the band
      assert("#73: an in-band gate that the grid cannot beat IS healthy (the honest half still works)",
        inband.proposal === null && inband.healthy === true && inband.out_of_band === false && inband.md.includes("# GATE HEALTHY"));
      // …and the verdict reaches a surface (rule 5: an organ needs an address)
      const writes = {};
      const rG = await runShift({ ...base, generate: genProbes, ledgerRows: mkRows(), tunnel: blocked, write: (n, c) => { writes[n] = c; } });
      assert("#73: the gate verdict lands on the SHIFT RECORD — the surface status/dugout already read",
        rG.jobs.gate_tune.out_of_band === true && rG.jobs.gate_tune.wakes_per_day === 0 && rG.jobs.gate_tune.in_band === false
        && Array.isArray(rG.jobs.gate_tune.band) && rG.jobs.gate_tune.decisions === 260
        && writes["gate_tune_2026-07-15.md"].includes("OUT OF BAND"));
    }
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
    // CACHE ORDER (15 Aug 2026) — held on the REAL prompt this engine sends, not on
    // a copy of it. Measured cause: 38 calls, cache_creation 666,729, cache_read 0.
    // The instructions must come first and HIS doubt last, or there is no shared
    // prefix for the provider to cache. Asserted structurally so a future reword
    // cannot quietly put the volatile half back in front.
    {
      let answerPrompt = null;
      await preAnswerEngine({ material, generate: async (p) => { if (!p.includes("Predict the")) answerPrompt = p; return genPA(p); }, recordUse: () => {}, embed: async (ts) => ts.map(() => [1, 0]), writeCache: () => {}, bannedPhrases: [], now: new Date("2026-07-15T02:50:00") });
      const iDoubt = answerPrompt.indexOf("kv cache hai toh");
      const iGrammar = answerPrompt.indexOf("DOSSIER grammar");
      assert("PRE-ANSWER · CACHE ORDER: the stable DOSSIER instructions come FIRST and his volatile doubt LAST (38 calls had cache_read 0 with this the other way round)",
        iGrammar >= 0 && iDoubt > iGrammar && iDoubt > answerPrompt.length * 0.75);
      assert("PRE-ANSWER · …and nothing was LOST in the reorder: the doubt, the concept, all five structure points and the output contract are all still in the prompt",
        /kv cache hai toh/.test(answerPrompt) && /concept: kv cache/.test(answerPrompt)
        && ["the mechanism", "worked micro-example", "where it breaks", "trade-off", "reframe"].every((s) => answerPrompt.includes(s))
        && answerPrompt.includes('{"answer":"<the full answer>"}'));
    }
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
  // ── #1 (third cut) · PROVENANCE, NOT MODALITY ─────────────────────────────
  // The corpus filtered `modality === "voice"` and voice died on 30 Jul, so the
  // pre-answer engine was reading a dead channel while 502 rows of his typed
  // doubts sat in the same file. Measured 4 Aug: {code|claude-code 502,
  // code|claude-code-teaching 342, voice 271, desktop-study|organism-memory 6}.
  {
    const now7 = new Date("2026-08-04T02:00:00Z");
    const t = (d) => new Date(now7.getTime() - d * 86400000).toISOString();
    const aff = [
      { modality: "voice", text: "spoken doubt (no source field — the legacy shape)", ts: t(1) },
      { modality: "code", source: "claude-code", text: "bhai i am not understanding what are you following to teach me", ts: t(1) },
      { modality: "desktop-study", source: "organism-memory", text: "a doubt he noted himself through the MCP", ts: t(2) },
      { modality: "code", source: "claude-code-teaching", text: "All four of my files green. The fleet is still running", ts: t(1) },
      { modality: "context", source: "activitywatch", text: "claude.exe · Claude", ts: t(1) },
      { modality: "pulse", source: "haiku-pulse", text: "pulse flagged (reasoning-hard): x", ts: t(1) },
      { modality: "code", source: "claude-code", text: "too old to ride", ts: t(30) },
    ];
    const m = preAnswerMaterial({ afferents: aff, grammar: null, cards: null, calibration: null, who: null }, now7);
    assert("#1: his TYPED doubts now ride the pre-answer corpus (the third cut is closed)",
      m.voiced.some(x => x.includes("not understanding")));
    assert("#1: the legacy voice shape (no `source` field at all) still rides — layering, nothing lost",
      m.voiced.some(x => x.includes("spoken doubt")));
    assert("#1: an organism-memory note is his words too", m.voiced.some(x => x.includes("noted himself")));
    assert("#1: claude-code-TEACHING is a hard deny — the coach's own prose never becomes 'his doubt'",
      !m.voiced.some(x => x.includes("files green")) && m.composition.excluded_not_his === 1);
    assert("#1: window titles and machine pulses are still not his words",
      !m.voiced.some(x => x.includes("claude.exe")) && !m.voiced.some(x => x.includes("pulse flagged")) && m.voiced.length === 3);
    // ── #56 · THE CORPUS IS REPORTED, NOT ASSUMED ───────────────────────────
    assert("#56: the composition is measured — his turns, voiced vs typed, and what was excluded",
      m.composition.window_days === 7 && m.composition.his_turns_in_window === 3
      && m.composition.voiced_turns_in_window === 1 && m.composition.typed_turns_in_window === 1
      && m.composition.used_in_prompt === 3 && m.composition.afferents_in_window === 6
      && m.composition.by_source["activitywatch"] === 1);
    // the 6-7 Aug case the audit predicted: voice falls out of the window
    const dry = preAnswerMaterial({ afferents: [{ modality: "context", source: "activitywatch", text: "chrome.exe", ts: t(1) }], grammar: null, cards: null, calibration: null, who: null }, now7);
    assert("#56: a DRY corpus reports zero explicitly (an unmeasured silence is never a measured zero)",
      dry.voiced.length === 0 && dry.composition.his_turns_in_window === 0 && dry.composition.voiced_turns_in_window === 0 && dry.composition.afferents_in_window === 1);
    // and it survives all the way onto the shift record, on the SKIP path too
    const rDry = await preAnswerEngine({ material: { ...dry, clusters: [], due: [], danger: [], threads: [] }, generate: async () => { throw new Error("must not be called"); }, bannedPhrases: [] });
    assert("#56: the skip carries the corpus report with it (the dry case is the one that must be visible)",
      rDry.ok === false && rDry.corpus && rDry.corpus.his_turns_in_window === 0);
    const writes2 = {};
    const rShift = await runShift({ ...base, generate: genProbes, afferents: [], write: (n, c) => { writes2[n] = c; } });
    assert("#56: the shift record carries it too — dugout.mjs:1215 and `status` read that file",
      rShift.jobs.pre_answers.corpus && rShift.jobs.pre_answers.corpus.his_turns_in_window === 0);
  }

  // JOB 8 — M18 THE SEASON RE-READ
  {
    const goodRead = { contradictions: [{ a: "week 1: kv cache fixes quadratic attention", b: "week 3: attention stays n-squared with the cache", where: "capsule context vs dugout 07-12" }], open_threads: [{ thread: "does compaction lose the capsule anchors?", first_seen: "dugout 07-13" }], confusion_edges: [{ from: "tokenization", to: "embeddings", evidence: "blurred in 3 sessions" }], note: "the season circles context economics." };
    const corpus = "x".repeat(5000);
    let saved = null, spent = 0;
    const r = await seasonReRead({ corpus, generate: async () => ({ ok: true, text: JSON.stringify(goodRead), model: "gemini-flash-latest" })   /* models-literal-ok: a fixture's stamped model, not a call */, recordUse: (id, u, naive) => { spent = naive; }, writeRead: (o) => { saved = o; }, bannedPhrases: ["10x"], now: new Date("2026-07-15T03:00:00") });
    assert("SEASON RE-READ: one long-context call → dated, model-stamped read", r.ok && saved.date === "2026-07-15" && saved.model === "gemini-flash-latest" && saved.contradictions.length === 1);   /* models-literal-ok: fixture stamp */
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
  // FIELD PROBES ON DEMAND (11 Aug 2026). The job runs inside the 02:40 shift, but
  // he revises during the DAY and a round tonight would otherwise face an empty
  // bank — "wait for tomorrow" is exactly the shape of tax his standing rule bans.
  // Same owner, same validator, same refusals as the nightly path: this is a
  // second DOOR to one job, never a second copy of it. Writes the same cumulative
  // file, so a day-run and a night-run cannot disagree about what is banked.
  if (mode === "field-probes") {
    const only = process.argv.slice(3).filter((a) => !a.startsWith("--"));
    const concepts = only.length ? only.map((c) => ({ concept: c, why: "asked for by hand" })) : undefined;
    // THE GOVERNOR APPLIES TO THIS DOOR TOO (11 Aug 2026, same evening it shipped).
    // Written without this check, the by-hand door passed NO_BUDGET and therefore
    // walked straight past the window governor that every other Claude-lane job
    // obeys. Measured within the hour: the 5h window stood at 31,36,293 against a
    // 16,00,000 ceiling — 196% — with allowed_now at ZERO, and cortex's daily
    // ConceptGraph pass was already refusing itself for exactly that reason. A
    // convenience door that can starve the organs is not a convenience.
    // --force is his explicit override, and it says what it is overriding.
    const force = process.argv.includes("--force");
    try {
      const { headroom, loadConfig: loadBrainCfg } = await import("./brain.mjs");
      const hr = headroom(loadBrainCfg(), readLines(join(STATE_DIR, "brain_ledger.jsonl")),
        readJson(join(STATE_DIR, "brain_queue.json")) || {}, new Date());
      const allowed = Number(hr && (hr.allowed_now ?? hr.allowed)) || 0;
      if (allowed <= 0 && !force) {
        console.log(`field-probes: REFUSED — no window headroom (allowed_now ${allowed}). The governor every other Claude job obeys applies here too.`);
        console.log(`  the window drains on its own (rolling 5h). Re-run later, or override with --force if you accept starving the budgeted organs.`);
        return;
      }
      if (allowed <= 0) console.log(`field-probes: --force — running with ZERO headroom; budgeted organs (cortex/diary/night shift) may starve tonight.`);
    } catch (e) { swallow("governor unreadable — do not block the door on the meter", e); }
    const r = await fieldProbes({ concepts, now: new Date() });
    if (Object.keys(r.bank).length) {
      writeAtomic(join(OUT_DIR, FIELD_PROBES_FILE), { updated: new Date().toISOString(), concepts: r.bank });
    }
    console.log(`field-probes: researched ${r.added} · refused ${r.refused} · considered ${r.considered} · banked total ${r.total_concepts}`);
    for (const [c, e] of Object.entries(r.bank)) console.log(`  ${c}: ${e.questions.length} sourced question(s) · fetched ${String(e.fetched).slice(0, 10)}`);
    return;
  }
  if (mode === "gem-stamp") {
    // D9 (9 Aug 2026, launch worklist): gem_sync_stamp.json finally gets an OWNER.
    // The gem-sync skill used to write it via a raw `node -e` — a self-documented
    // ownerless state write awaiting a ruling. The Gem's cartridges are this
    // organ's produce, so the sync stamp is this organ's record. physio reads it.
    const p = join(STATE_DIR, "gem_sync_stamp.json");
    const tmp = `${p}.tmp${process.pid}`;
    writeFileSync(tmp, JSON.stringify({ at: new Date().toISOString() }, null, 1));
    renameSync(tmp, p);
    console.log(`nightshift: gem sync stamped — ${p}`);
    // THE GATE (§5.2 "opened", 18 Aug 2026): a gem-sync is HIM pasting the cartridge into
    // his Gem — the ns_gem_cartridge lane reached him, and with it (gate.consumers on
    // capsule_premap in brain_config) the premap that fed it. Through the owner's helper.
    try { const { recordConsumption } = await import("./brain.mjs"); recordConsumption({ lane: "ns_gem_cartridge", kind: "opened", by: "gem-sync (nightshift gem-stamp)" }); } catch { }
    return;
  }
  if (mode === "status") {
    const s = readJson(join(OUT_DIR, `shift_${dayKey()}.json`));
    console.log(s ? `nightshift: last shift ${s.date} — ${JSON.stringify(s.jobs)}` : "nightshift: no shift filed today");
    if (s && s.jobs) {
      // #56 — the pre-answer corpus, in words, every time it is asked
      const c = (s.jobs.pre_answers || {}).corpus;
      if (c) console.log(`nightshift: pre-answer corpus — ${c.his_turns_in_window} of HIS turn(s) in the last ${c.window_days}d (${c.voiced_turns_in_window} voiced · ${c.typed_turns_in_window} typed), ${c.used_in_prompt} rode the prompt, ${c.excluded_not_his} coach-authored row(s) excluded, out of ${c.afferents_in_window} afferent(s)${c.his_turns_in_window === 0 ? "  ← DRY: the engine predicted from shapes/FSRS alone, not from his words" : ""}`);
      // #73 — the wind tunnel's verdict, with its own band beside it
      const g = s.jobs.gate_tune;
      if (g && g.wakes_per_day !== undefined) console.log(`nightshift: gate — ${g.wakes_per_day} wakes/day vs its own band [${(g.band || [])[0]}, ${(g.band || [])[1]}] over ${g.decisions} decision(s) → ${g.proposed ? "PROPOSAL FILED (report-only)" : g.in_band ? "in band" : "OUT OF BAND, and no grid config fixes it"} · see brain_out/nightshift/${g.file}`);
      else if (g && g.silent) console.log(`nightshift: gate — silent (${g.silent})`);
    }
    return;
  }
  const r = await runShift({ force: process.argv.includes("--force") });
  console.log(r.ok ? `nightshift: shift complete — ${JSON.stringify(r.jobs)}` : `nightshift: ${r.skipped}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { runShift, probeBank, distractorBank, scoutPack, gemCartridge, gateTuneReport, windTunnel, replayGate, replayGateLegacy, tunnelScore, preAnswerEngine, preAnswerMaterial, seasonReRead, seasonCorpus, validateSeasonRead, gradeProbes, answerVariance, drillConcepts, isOvernight, makeBudget, CAPS, CLAUDE_LANE, TUNNEL, SEASON_CAPS, GRADE,
  // wiring audit 10 Aug 2026 — the ledger row is a NAMED pure builder now, so the
  // governor's row shape is assertable from outside instead of living inside an
  // append-only side effect nobody could test (dmn.mjs's ledgerRow precedent)
  nsLedgerRow,
  // audit 4 Aug 2026 — #1/#56 seams: the provenance gate is now testable from
  // outside, so the thalamus side of the same wire can assert the SAME rule
  isHisWords, provenanceOf, HIS_SOURCES, NOT_HIS_SOURCES };
