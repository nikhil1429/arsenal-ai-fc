#!/usr/bin/env node
// ============================================================================
// thalamus.mjs · ARSENAL AI FC — THE THALAMUS (the relay nucleus + reticular gate)
// ----------------------------------------------------------------------------
// WHAT:  The one organ the body was missing (CYBORG_BRAIN.md §4): a persistent
//        localhost daemon on :4113 where EVERY sense lands — voice turns from
//        the Dugout, vision frame-hashes, bus deltas (a new rep, a Governor
//        transition, a due card, a Twin market resolving). It BINDS co-temporal
//        events into single "moments" (window B≈900ms, winner-take-all
//        spotlight), scores each moment's SALIENCE deterministically
//        (microseconds, zero-LLM), and rations the two brains on a ladder:
//          S < τ0                 → TIER-0  reflex already handled it (free)
//          τ0 ≤ S < τ1_eff        → TIER-1  enrichment lane (free)
//          S ≥ τ1_eff (+ gates)   → TIER-2  WAKE OPUS via wake.json → cortex.mjs
//          |S − τ1_eff| < ε       → ONE tiny-model adjudication, at most once
//        BUDGET COUPLING: τ1_eff = τ1_base + k·(1 − window_headroom_frac) from
//        brain.mjs's REAL ledger (the same guarded observed_window_ceiling) —
//        when the Claude window runs low the wake bar rises by itself.
// SALIENCE (§4.3):
//        S = clamp01(wpe·PE + wnov·NOV + wgov·GOV + werr·ERR + wself·SELF
//                    + wdead·DEAD − whab·HAB)
//        PE   Shannon surprisal −log2(p_obs) vs the Twin's book (or base rate)
//        NOV  unseen concept token / first-time confusion pair
//        GOV  Governor transition magnitude (readiness.json READ-ONLY — the
//             medical clamp: biometrics weight ATTENTION, never drive verdicts)
//        ERR  a "knew" rep that came back wrong — the calibration break
//        SELF the captain names a doubt out loud
//        DEAD a due card / staged scrimmage (time-pressure as salience)
//        HAB  per-(modality,signal_key) exponential habituation — a flapping
//             Governor or a repeated frame CANNOT re-fire the deep brain
//        EXCLUDED BY CONSTRUCTION: prosody, tone, emotion, agitation — any such
//        field is STRIPPED at the door before an event even lands in the log.
// LAWS:  single writer — this file alone writes afferent.jsonl · workspace.json
//        · salience_ledger.jsonl · wake.json · wake_queue.jsonl (M14: wakes
//        QUEUE, never clobber — wake.json is the latest-wake mirror; cortex
//        answers arrive THROUGH :4113/deep-answer, never as a file write).
//        All five are gitignored
//        (they carry his words/moments; the public repo holds machinery only).
//        The gate decides what gets THOUGHT ABOUT, never what gets SAID —
//        outbound speech still passes the shadow ratify-gate + win-only law.
//        No metered key: the adjudicator rides the free Gemini pool; the deep
//        lane is claude -p (Max) in cortex.mjs. Localhost only.
// MODES: node scripts/thalamus.mjs            → daemon on http://127.0.0.1:4113
//        node scripts/thalamus.mjs selftest   → deterministic bar (§4.7)
//        node scripts/thalamus.mjs status     → workspace + today's gate ledger
// ----------------------------------------------------------------------------
// ORGANISM REPAIR 4 Aug 2026 — THE NUCLEUS HEARS HIM (issues #1 #2 #6 #9 #10 #106).
// Five cuts, all in this file, all layered (the old engine is frozen beside the
// new one everywhere it was replaced):
//   #1  SELF fired on `modality === "voice"` only, and voice has been silent
//       since 30 Jul. Measured: 3,099 `code:` moments in salience_ledger, max S
//       = 0.000, no exceptions. The gate is now PROVENANCE-based
//       (cfg.self_sources) — his mic, his Claude Code prompts, his MCP notes —
//       and NEVER `claude-code-teaching` (cfg.self_deny_sources: that stream is
//       the machine's own answers, not him). deriveVoiceTokens was voice-gated
//       for the same reason, so even a self=1 code moment would have stalled at
//       0.45 with nov=0; it now runs on the same provenance set.
//   #2  The haiku pulse could not reach even tier 0: its arithmetic ceiling was
//       0.24375 against tau0 = 0.25, because every `pulse:*` event_key fell to
//       base_rates.default = 0.5 — i.e. a RARE event scored as maximally
//       UNSURPRISING. base_rates now supports `prefix:*` keys and carries a
//       MEASURED pulse rate (see thalamus_config.json). New ceiling 0.32029.
//   #6  The DMN precache join ran raw window-title words ("google", "chrome")
//       against concept names — 0 of 95 historical stalls matched. The legacy
//       matcher is frozen; a CANON join (dossierKey/conceptRegistry, already
//       owned by this file) runs behind it, falling back to sprint.json's
//       current concept when the stall's own words name nothing canonical.
//   #9  Expired whisper / pre_answer / bg_hint / mouth_hint were carried
//       forward unconditionally and rebroadcast on every bound moment, so
//       workspace.json advertised a pre-answer whose 3-minute window had closed
//       two days earlier. They are dropped at the source now, and the drop is
//       logged.
//   #10 Every D.log went to a closed handle (setup/hidden_run.vbs, no redirect),
//       so the moment-loss alarm and the whisper/pre-answer attach flags existed
//       nowhere. There is now a real rotating log file AND — because a log is
//       not a measurement — every ledger row carries an `engines` tri-state so
//       "has the pre-answer engine ever fired?" is answerable by grep.
//   #106 `status` reports have/need counters, never a bare word.
// ============================================================================

import { readFileSync, existsSync, appendFileSync, mkdirSync, writeFileSync, renameSync, statSync, watch, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createServer } from "node:http";
// M8-FIX 1 Aug 2026 — the canon matcher itself, not a copy of it (see THE
// DOSSIER TAKES ONLY CANON below). capture.mjs owns concepts.json; this is a
// read-only borrow of its two pure resolvers, so the normalisation scars baked
// into normText (fold `_`/`-` first, THEN trim — non-idempotence there once
// fabricated reps onto a real FSRS card) can never drift between the organs.
import { loadRegistry, canonicalize } from "./capture.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Captured ONCE, at module load — this is the mtime of the code actually running in
// this process, which is what /status must report. See the /status handler for why.
const MODULE_MTIME_MS = (() => { try { return statSync(fileURLToPath(import.meta.url)).mtimeMs; } catch { return null; } })();
const BOOTED_AT = new Date().toISOString();
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CONFIG    = join(STATE_DIR, "thalamus_config.json");
const AFFERENT  = join(STATE_DIR, "afferent.jsonl");
const WORKSPACE = join(STATE_DIR, "workspace.json");
const SLEDGER   = join(STATE_DIR, "salience_ledger.jsonl");
const WAKE      = join(STATE_DIR, "wake.json");
const WQUEUE    = join(STATE_DIR, "wake_queue.jsonl");     // M14 — the overlap: wakes QUEUE, never clobber
const BGQUEUE   = join(STATE_DIR, "bg_queue.jsonl");       // M22 — suppress the WAKE, never the THOUGHT
const DOSSIER   = join(STATE_DIR, "dossier.json");
const CONCEPTS  = join(STATE_DIR, "concepts.json");        // canon vocab — capture.mjs owns it; this nucleus READS
const ACACHE    = join(STATE_DIR, "answer_cache.jsonl");   // M17 — nightshift owns it; this nucleus READS
const SPRINT    = join(STATE_DIR, "sprint.json");          // #6 — the curriculum spine; READ-ONLY (sprintsync owns it)
const LOGFILE   = join(__dirname, "thalamus.log");         // #10 — the diagnostics that had nowhere to land (*.log is gitignored)
const PORT = 4113;                                  // one below the Dugout's 4114

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const DEFAULT_CONFIG = {
  // calibrated so: a voiced doubt on a fresh concept (self+nov) or a
  // confident-wrong rep on a fresh concept (err+nov) crosses τ1 → wake;
  // a Governor flip or due-card alone NEVER wakes opus (attention, not verdict)
  // #2(c) — `pulse` is a REAL named component (computed + ledgered on every
  // moment) whose weight is 0.00: the CURRENT value, preserved exactly, because
  // the arithmetic proves no positive value is safe today and the captain's
  // standing order forbids inventing one. Shown work, from the live config:
  //   to admit a pulse on the pulse term ALONE (nov is noise until #3 lands):
  //     w_pe·pe_pulse + w_pulse ≥ tau0  →  0.12029 + w_pulse ≥ 0.25  →  w_pulse ≥ 0.12971
  //   to keep the trap shut (a sentinel must NEVER wake Opus by itself):
  //     w_pe·pe_pulse + w_nov·1 + w_pulse < tau1_base  →  0.32029 + w_pulse < 0.40  →  w_pulse < 0.07971
  //   0.12971 > 0.07971 — the two requirements are INCOMPATIBLE at the live
  //   weights, so a weighted pulse term cannot do the job the base-rate fix
  //   (#2a) already does. It stays at 0 and stays MEASURED: comps.pulse lands
  //   in every ledger row, and `status` prints the have/need. What would set it:
  //   a verdict source — 0 of 131 escalations has ever reached a human or an
  //   adjudicator verdict, so its precision is unknown, not low.
  weights: { pe: 0.35, nov: 0.20, gov: 0.25, err: 0.45, self: 0.45, dead: 0.15, hab: 0.40, pulse: 0.00 },
  tiers: { tau0: 0.25, tau1_base: 0.55, epsilon: 0.08, budget_k: 0.35 },
  binding_ms: 900,
  refractory_min: 45,
  // M14 — wake_cap_per_day is the HARD ceiling (humane clamp); the EFFECTIVE
  // cap derives live from the real window: floor(allowed_tokens / est_per_wake),
  // floored at wake_cap_min so the day's sharpest surprise always has a lane
  // (the cortex's headroom lock is the second gate). Folklore 15 is dead.
  wake_cap_per_day: 15,
  wake_cap_min: 2,
  hab: { tau_ms: 600000, saturation: 4 },
  // #2(a) — base_rates now understands `prefix:*` keys (longest prefix wins, so
  // the lookup is order-independent). `default: 0.5` is the WORST possible prior
  // for a rare machine event: surprisal(0.5, 4 bits) = 0.25, halved for weak
  // evidence = 0.125 — a rare escalation scored as maximally unsurprising. The
  // live table (dressing-room/state/thalamus_config.json) carries the measured
  // pulse rate; this default block stays as the hermetic fallback.
  pe: { norm_bits: 4, base_rates: { default: 0.5 } },
  adjudicator: { model: "gemini-flash-lite-latest", enabled: true },
  deep: { deadline_ms: 45000, min_headroom_tokens: 50000, max_thinking_tokens: 16000, timeout_ms: 300000, concurrency: 2, est_tokens_per_wake: 40000, queue_ttl_min: 30 },
  // M17 — the pre-answer serve side: cosine bar, the free overlap floor, and
  // the one embed call's hard timeout (dry/slow → the floor, never a stall).
  // scan-fix 15 Jul: bar raised 0.60→0.66, overlap 2→3 — common Hinglish
  // words were crossing the old floor and attaching irrelevant lectures.
  pre_answer: { enabled: true, threshold: 0.66, min_overlap: 3, embed_timeout_ms: 4000 },
  // #6 — the DMN precache join. `legacy_raw` is the original word-overlap
  // matcher, kept first and unchanged (layering law); `canon_join` and
  // `sprint_fallback` are the repair, and either can be switched off without
  // touching code if the whisper lane ever turns noisy.
  whisper: { legacy_raw: true, canon_join: true, sprint_fallback: true },
  // #1 — SELF is gated on PROVENANCE, not modality. `voice` is the synthetic
  // provenance of a mic afferent (live voice rows carry no `source` field at
  // all — measured across all 271). The deny list wins over the allow list:
  // `claude-code-teaching` is the Stop-hook stream, i.e. the organism's OWN
  // answers (hooks/afferent-post.mjs:56) — scoring the machine's confidence
  // language as HIS doubt is exactly the self-talk scar the capture guard
  // exists to close.
  self_sources: ["voice", "claude-code", "organism-memory"],
  self_deny_sources: ["claude-code-teaching"],
  // #10 — the diagnostics that had nowhere to land. Rotation size is DERIVED,
  // not guessed: salience_ledger.jsonl holds 5,481 bound moments over 16 days =
  // 342.6 moments/day, and the worst case is one ~160-byte log line per moment
  // → 54.8 KB/day. 30 days of that worst case = 1,644,480 B ≈ 1,650,000.
  // `keep: 1` — one rotated generation, so the disk cost is bounded at ~3.3 MB.
  log: { enabled: true, max_bytes: 1650000, keep: 1 },
  // scan-fix 15 Jul: the gate was DEAF to how he actually talks — Latin-only
  // markers while the ASR ships Devanagari, so genuine confusion scored S=0
  // and only the canned English phrase ever woke the deep brain. His real
  // voice, both scripts:
  self_markers: ["i don't get", "don't understand", "samajh nahi", "samajh nahin", "samajh mein nahi", "samajh na", "clear nahi", "confus", "kyun nahi aata", "kaise kaam", "kaise hota", "kya hota", "matlab kya", "stuck hoon", "atka hua", "doubt hai", "doubt aa", "yeh kaise", "wait, why", "wait why", "makes no sense", "समझ नहीं", "समझ में नहीं", "नहीं समझ", "समझा नहीं", "कैसे काम", "क्यों नहीं", "मतलब क्या", "डाउट"],
};
function loadConfig() {
  const c = readJson(CONFIG);
  if (!c) return DEFAULT_CONFIG;
  return {
    ...DEFAULT_CONFIG, ...c,
    weights: { ...DEFAULT_CONFIG.weights, ...(c.weights || {}) },
    tiers: { ...DEFAULT_CONFIG.tiers, ...(c.tiers || {}) },
    hab: { ...DEFAULT_CONFIG.hab, ...(c.hab || {}) },
    // deep-merge pe so a live table that omits base_rates still gets `default`
    pe: { ...DEFAULT_CONFIG.pe, ...(c.pe || {}), base_rates: { ...DEFAULT_CONFIG.pe.base_rates, ...((c.pe || {}).base_rates || {}) } },
    pre_answer: { ...DEFAULT_CONFIG.pre_answer, ...(c.pre_answer || {}) },
    deep: { ...DEFAULT_CONFIG.deep, ...(c.deep || {}) },
    whisper: { ...DEFAULT_CONFIG.whisper, ...(c.whisper || {}) },      // #6
    log: { ...DEFAULT_CONFIG.log, ...(c.log || {}) },                  // #10
  };
}

// ---------------------------------------------------------------------------
// #10 — THE LOG THAT SURVIVES THE CLOAK.
// ArsenalFC-Thalamus runs as `wscript setup/hidden_run.vbs node scripts/thalamus.mjs`
// and hidden_run.vbs ends in `sh.Run cmd, 0, False` — window style 0, no
// redirect. So every D.log() call in this file wrote to a closed handle: the
// moment-loss alarm (added by a prior audit BECAUSE a loss had no log), the
// whisper/pre-answer attach flags, the WAKE line. `find . -name "*.log"` listed
// eight organs and neither the thalamus nor the cortex.
// Append-only, size-rotated, best-effort: a log that cannot be written must
// never become the failure it was installed to record (tone.mjs:58's law).
// ---------------------------------------------------------------------------
function rotateLogIfNeeded(cfg) {
  try {
    const max = (cfg.log && cfg.log.max_bytes) || DEFAULT_CONFIG.log.max_bytes;
    if (!existsSync(LOGFILE)) return;
    if (statSync(LOGFILE).size < max) return;
    renameSync(LOGFILE, LOGFILE + ".1");             // keep: 1 — one generation back
  } catch { /* rotation is best-effort; a busy handle must not stop the write */ }
}
// THE CLOAK AND THE LOGGER FIGHT OVER THE SAME FILE (audit #108 verify pass, 6 Aug 2026).
// hidden_run.vbs launches each daemon as `cmd /c <cmd> >> "scripts/<organ>.log" 2>&1`,
// which holds an EXCLUSIVE Windows handle on that file for the daemon's whole life. So
// every appendFileSync to it throws — and this function swallowed the throw, which is
// correct as a policy (a log must never be the failure) but meant the ONE diagnostic
// that exists nowhere else, the moment-loss reason #10 was built to capture, was lost
// exactly while the organ was healthy and running. The defect was invisible for two
// days because the daemons were DEAD; restarting them is what made it observable.
// Fix: fall back to stdout. Under the cloak, stdout IS this same file (the `>>`
// redirect), so the line still lands; run bare, it lands on the console. Either way it
// is no longer silently dropped. `logTarget` is exported so the selftest can prove the
// append path on a file nothing else holds, instead of racing the live daemon.
function fileLog(cfg, msg, target = LOGFILE) {
  if (cfg.log && cfg.log.enabled === false) return;
  const line = `${new Date().toISOString()} ${String(msg)}\n`;
  try {
    rotateLogIfNeeded(cfg);
    appendFileSync(target, line, "utf8");
    return "file";
  } catch {
    // the file is held (we are running under the cloak, or another process owns it)
    try { process.stdout.write(line); return "stdout"; } catch { return null; }
  }
}

// ---------------------------------------------------------------------------
// THE DOOR — sanitation. The affect firewall's first brick: no prosody/emotion
// field may even ENTER the nucleus. Stripped before logging, scoring, binding.
// ---------------------------------------------------------------------------
const AFFECT_FIELDS = ["prosody", "emotion", "tone", "affect", "stress", "agitation", "mood", "sentiment"];
// A spoken doubt arrives as {modality:'voice', text} with NO concept_tokens, so
// novelty could never fire and nothing keyed the capsule / pre-answer match — a
// fresh-concept doubt scored self-only (0.45) and stalled. Derive the concept
// words from his speech (drop function words + the doubt-markers themselves) so a
// NEW concept lights novelty (self+nov=0.65) and the deep prompt finds its capsule.
const VOICE_STOP = new Set("what why how does is are the this that these those mean means meaning understand get got dont cant work works working about when where which would could should have has had will your you and but for not was were with from into then than some just like really actually thing kind sort okay haan theek hua kya kyu kyun kaise kaam karta karti karna karo karke bata batao samajh samjha samjhao nahi nahin naa aaya aata aati aaye gaya gayi hota hoti hona matlab mujhe muje tum tumhe aap yeh woh thoda toh bhi bilkul sab kuch wala wale wali mera meri raha rahi rahe liye".split(/\s+/));
// E2E audit 25 Jul 2026: this derivation was STILL Latin-only (`/[^a-z0-9]+/`)
// long after the 15 Jul scan-fix taught the MATCHERS both scripts — so a fully
// Devanagari doubt ("यार ये अटेंशन समझ नहीं आ रहा", which is exactly how the ASR
// ships his speech, see the self_markers note above) produced ZERO tokens: NOV
// could never light, the moment scored self-only 0.45, and the moment the budget
// lifted τ1_eff past 0.45 his realest doubts stopped reaching Opus entirely.
// Two scripts, one derivation: split on letters/digits AND combining marks
// (\p{M} — matras ARE marks; leaving them out of the word class shreds a
// Devanagari word into consonant crumbs), Devanagari words counting from 2 chars
// like tokWords does, with a Devanagari stop-list mirroring VOICE_STOP and the
// doubt-markers' own words so the marker never becomes the "concept".
const DEVA_STOP = new Set("यह ये वो वह वे इस उस जो कि की का के को में से पर और या भी तो न ना नहीं नही मत अरे यार अच्छा ठीक क्या क्यों क्यूँ क्यूं कैसे कैसा कैसी कब कहाँ कहां कौन कितना कितनी है हैं हूँ हूं था थी थे हो होता होती होते होना हुआ हुई गया गयी गई गए रहा रही रहे रहना समझ समझा समझी समझना समझाओ समझाना मतलब बात बातें कर करता करती करते करना करो करके बता बताओ बताना डाउट कुछ सब बहुत थोड़ा ज़्यादा ज्यादा मुझे मुझको मेरा मेरी मेरे तुम तुझे आप अपना अभी अब फिर वाला वाली वाले लिए लिये चल चलो एक दो साथ बिल्कुल शायद असल असली सवाल जवाब".split(/\s+/));
const isDevanagari = (w) => /[ऀ-ॿ]/.test(w);
function deriveVoiceTokens(text) {
  const seen = new Set(), out = [];
  for (const w of String(text || "").toLowerCase().split(/[^\p{L}\p{N}\p{M}]+/u)) {
    if (!w || seen.has(w)) continue;
    if (isDevanagari(w) ? (w.length < 2 || DEVA_STOP.has(w)) : (w.length < 4 || VOICE_STOP.has(w))) continue;
    seen.add(w); out.push(w); if (out.length >= 4) break;
  }
  return out;
}
// E2E audit 25 Jul 2026: the door swept only TOP-LEVEL keys, so any nested
// carrier — {meta:{emotion:"agitated"}}, or the richer ASR payload a Cochlea
// upgrade would ship, {analysis:{prosody:{...},stress:0.9}} — walked through
// intact, was appended verbatim to afferent.jsonl and broadcast inside
// workspace.moment.spotlight where every region reads it. The affect firewall is
// a BOUNDARY, not a surface wipe: sweep the whole object (depth-limited, arrays
// included) before anything is logged, scored or bound.
function stripAffect(v, depth = 0) {
  if (Array.isArray(v)) return depth >= 8 ? [] : v.map(x => stripAffect(x, depth + 1));
  if (v && typeof v === "object") {
    if (depth >= 8) return {};
    const o = {};
    for (const [k, val] of Object.entries(v)) { if (AFFECT_FIELDS.includes(k.toLowerCase())) continue; o[k] = stripAffect(val, depth + 1); }
    return o;
  }
  return v;
}
// ---------------------------------------------------------------------------
// #1 — PROVENANCE, NOT MODALITY. The one wire, cut in two places in this file.
// `modality` describes the PIPE ("voice", "code", "desktop-study"); `source`
// describes WHO SPOKE. The nucleus only ever wanted the second question, and
// asking the first is what made his entire Claude Code stream — 3,099 bound
// moments, max S 0.000 — unscoreable by construction.
// Live voice afferents carry no `source` field at all (measured: all 271), so a
// voice modality IS its own provenance. Everything else must name itself.
// The deny list wins: `claude-code-teaching` is the Stop hook, the organism's
// own answers coming back through the door.
// ---------------------------------------------------------------------------
function provenanceOf(evt) {
  const s = String((evt && evt.source) || "").toLowerCase();
  if (s) return s;
  return evt && evt.modality === "voice" ? "voice" : "";
}
function isHisVoice(evt, cfg) {
  const p = provenanceOf(evt);
  if (!p) return false;
  const deny = cfg.self_deny_sources || DEFAULT_CONFIG.self_deny_sources;
  if (deny.includes(p)) return false;
  const allow = cfg.self_sources || DEFAULT_CONFIG.self_sources;
  return allow.includes(p);
}
// sanitizeAfferent is called from ingest() (which has cfg) and from the
// selftest/exports (which historically did not) — cfg defaults so every legacy
// caller keeps working verbatim.
function sanitizeAfferent(evt, cfg = DEFAULT_CONFIG) {
  const e = stripAffect({ ...evt });     // was a top-level-only delete loop — see stripAffect
  // enrich HIS turns with derived concept tokens (novelty + capsule matching).
  // Was `e.modality === "voice"` — the second cut of the #1 wire: a code
  // afferent got no tokens, so nov was 0 and even a self=1 typed doubt stalled
  // at 0.45 instead of the 0.65 a fresh-concept doubt is worth.
  if (isHisVoice(e, cfg) && e.text && !(Array.isArray(e.concept_tokens) && e.concept_tokens.length)) {
    const toks = deriveVoiceTokens(e.text);
    if (toks.length) e.concept_tokens = toks;
  }
  return e;
}

// ---------------------------------------------------------------------------
// SALIENCE COMPONENTS — each ∈ [0,1], deterministic, zero-LLM
// ---------------------------------------------------------------------------
function surprisalPE(pObs, normBits) { return clamp01(-Math.log2(Math.max(1e-6, Math.min(1, pObs))) / normBits); }

// #2(a) — base-rate lookup with `prefix:*` support. The haiku pulse does not
// emit one event_key: brain.mjs:354 builds `pulse:${firstToken}`, so the live
// bus carries 30 distinct keys (`pulse:need`, `pulse:isko`, `pulse:escalate`…)
// and an exact-match table could never cover them. Exact key first, then the
// LONGEST matching wildcard (longest-prefix-wins makes the answer independent
// of key order in the JSON), then `default`.
function baseRateFor(eventKey, table) {
  const t = table || {};
  if (t[eventKey] !== undefined) return t[eventKey];
  let bestLen = -1, bestVal;
  for (const k of Object.keys(t)) {
    if (!k.endsWith("*")) continue;
    const pre = k.slice(0, -1);
    if (String(eventKey).startsWith(pre) && pre.length > bestLen) { bestLen = pre.length; bestVal = t[k]; }
  }
  return bestLen >= 0 ? bestVal : t.default;
}

function computeComponents(evt, ctx) {
  // ctx: { cfg, markets(id→p), seen:Set, hab:Map, now }
  const { cfg } = ctx;
  const comps = { pe: 0, nov: 0, gov: 0, err: 0, self: 0, dead: 0, hab: 0, pulse: 0 };

  // PE — the Twin's book first; Laplace base-rate table second
  if (evt.market_id && ctx.markets && ctx.markets[evt.market_id] !== undefined) {
    const p = ctx.markets[evt.market_id];
    const pObs = evt.observed === false ? 1 - p : p;
    comps.pe = surprisalPE(pObs, cfg.pe.norm_bits);
  } else if (evt.p_obs !== undefined) {           // pre-resolved probability (slip rows)
    comps.pe = surprisalPE(evt.p_obs, cfg.pe.norm_bits);
  } else if (evt.event_key) {
    const base = baseRateFor(evt.event_key, cfg.pe.base_rates) ?? cfg.pe.base_rates.default;   // #2(a) — `prefix:*` aware
    comps.pe = surprisalPE(evt.observed === false ? 1 - base : base, cfg.pe.norm_bits) * 0.5; // base-rate PE is weak evidence
  }

  // NOV — unseen concept / first-time confusion pair
  const tokens = Array.isArray(evt.concept_tokens) ? evt.concept_tokens.map(t => String(t).toLowerCase()) : [];
  if (tokens.some(t => !ctx.seen.has(t))) comps.nov = 1;
  if (evt.confused_with && !ctx.seen.has(`pair:${String(evt.confused_with).toLowerCase()}`)) comps.nov = 1;

  // GOV — transition magnitude only; readiness is READ-ONLY attention weight
  if (evt.gov_from && evt.gov_to && evt.gov_from !== evt.gov_to) {
    comps.gov = (evt.gov_from === "RED" || evt.gov_to === "RED") ? 1 : 0.5;
  }

  // ERR — the calibration break (confident-and-wrong is the most teachable instant)
  if (evt.rep && evt.rep.correct === false) {
    comps.err = evt.rep.confidence === "knew" ? 1 : evt.rep.confidence === "shaky" ? 0.4 : 0.15;
  }

  // SELF — he names the doubt.
  // FROZEN, for the record (the layering law): the gate used to read
  //   `if (evt.modality === "voice" && text && cfg.self_markers.some(...))`
  // and the mic went silent on 30 Jul. selfLegacy() below preserves it verbatim
  // so the two can always be compared on the same event; the provenance gate is
  // the plan of record. See #1 in the header.
  const text = String(evt.text || "").toLowerCase();
  if (isHisVoice(evt, cfg) && text && cfg.self_markers.some(m => text.includes(m))) comps.self = 1;

  // #2(c) — the sentinel term. The haiku pulse already PAID an LLM call to read
  // his stream and say "reasoning-hard"; the nucleus records that verdict on
  // every moment so it is countable. Its weight is 0.00 (see DEFAULT_CONFIG) —
  // this is instrumentation with an address, not a live term.
  if (evt.modality === "pulse" || String(evt.event_key || "").startsWith("pulse:")) comps.pulse = 1;

  // DEAD — due work as time-pressure (voicing still obeys the humane clamp)
  if (Number.isFinite(evt.due_count) && evt.due_count > 0) comps.dead = clamp01(evt.due_count / 5);
  if (evt.staged_scrimmage) comps.dead = 1;

  // VISION — a changed surface carries novelty proportional to how much changed
  if (evt.modality === "vision" && Number.isFinite(evt.hamming)) comps.nov = Math.max(comps.nov, clamp01(evt.hamming / 24));

  // HAB — exponential habituation per (modality, signal_key)
  const key = signalKey(evt);
  const h = ctx.hab.get(key);
  if (h) {
    const dt = Math.max(0, ctx.now - h.ts);
    const decayed = h.h * Math.exp(-dt / cfg.hab.tau_ms);
    comps.hab = clamp01(decayed / cfg.hab.saturation);
  }
  return comps;
}
// THE FROZEN SELF GATE (#1). Kept verbatim so the change is auditable and
// reversible, and so nightshift's replay can ask "what did the OLD gate say
// about this row?" without archaeology. Nothing in the live path calls it.
function selfLegacy(evt, cfg) {
  const text = String((evt && evt.text) || "").toLowerCase();
  return (evt && evt.modality === "voice" && text && (cfg.self_markers || DEFAULT_CONFIG.self_markers).some(m => text.includes(m))) ? 1 : 0;
}
function salience(comps, w) {
  // `|| 0` on the new pulse term: salience() is exported and the selftest builds
  // weight objects by hand — a missing key must read as "off", never NaN.
  return clamp01(w.pe * comps.pe + w.nov * comps.nov + w.gov * comps.gov + w.err * comps.err + w.self * comps.self + w.dead * comps.dead
    + (w.pulse || 0) * (comps.pulse || 0) - w.hab * comps.hab);
}
function signalKey(evt) {
  if (evt.event_key) return `${evt.modality}:${evt.event_key}`;
  if (evt.modality === "vision") return `vision:${evt.kind || "screen"}`;
  const t = Array.isArray(evt.concept_tokens) && evt.concept_tokens.length ? evt.concept_tokens[0] : String(evt.text || "").slice(0, 40);
  return `${evt.modality}:${String(t).toLowerCase()}`;
}

// budget coupling — the wake bar rises as the real Claude window drains
function tau1Effective(cfg, headroomFrac) {
  return cfg.tiers.tau1_base + cfg.tiers.budget_k * (1 - clamp01(headroomFrac));
}

// ---------------------------------------------------------------------------
// M17 — THE PRE-ANSWER match (deterministic): cosine first (needs both vecs),
// the free word-overlap floor second. No match → null — NEVER improvise an
// answer; the cache either drafted this exact doubt last night or it didn't.
// ---------------------------------------------------------------------------
function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
// scan-fix 15 Jul: every matcher tokenized with /[^a-z0-9]+/ — Devanagari
// text produced ZERO words, so pre-answers, bg recall-matches and precache
// whispers were all script-blind. Unicode words, both scripts, one helper:
function tokWords(text) {
  return String(text || "").toLowerCase().split(/[^\p{L}\p{N}]+/u)
    .filter(w => (/[ऀ-ॿ]/.test(w) ? w.length >= 2 : w.length > 3));
}
// ---------------------------------------------------------------------------
// M14 — THE OVERLAP: the wake QUEUE (event-sourced, append-only, single-writer).
// A "pending" row opens a wake; a later served/declined/expired row for the
// same moment closes it. pendingWakes() reduces the log to the open set —
// read-only consumers (cortex, dugout) import this, never write the file.
// ---------------------------------------------------------------------------
function pendingWakes(rows) {
  const open = new Map();
  for (const r of rows || []) {
    if (!r || !r.moment_id) continue;
    if (r.status === "pending") open.set(r.moment_id, r);
    else open.delete(r.moment_id);
  }
  return [...open.values()];
}
// M22 — the background queue's open set (queued minus drained/returned)
function pendingBg(rows) {
  const open = new Map();
  for (const r of rows || []) {
    if (!r || !r.moment_id) continue;
    if (r.status === "queued") open.set(r.moment_id, r);
    else open.delete(r.moment_id);
  }
  return [...open.values()];
}
// M22 — the recall-match: does the current spotlight touch a held background
// thought? Exact concept-token hit or ≥2 shared >3-char words. Free, in-memory.
function matchBg(evt, bgItems) {
  const tokens = new Set((evt.concept_tokens || []).map(t => String(t).toLowerCase()));
  const words = new Set(tokWords(`${(evt.concept_tokens || []).join(" ")} ${evt.text || ""}`));
  for (const b of bgItems || []) {
    const bTokens = (b.tokens || []).map(t => String(t).toLowerCase());
    if (bTokens.some(t => tokens.has(t))) return b;
    const bWords = tokWords(`${b.concept || ""} ${b.insight || ""}`);
    if (bWords.filter(w => words.has(w)).length >= 2) return b;
  }
  return null;
}
// M14 — the effective daily wake cap derives from the REAL window, floored so
// the day's sharpest surprise always has a lane; wake_cap_per_day stays the
// hard humane ceiling. Folklore is dead; the ledger decides.
function wakeCapToday(cfg, allowedTokens) {
  const derived = Math.floor(Math.max(0, allowedTokens) / Math.max(1, cfg.deep.est_tokens_per_wake));
  return Math.min(cfg.wake_cap_per_day, Math.max(cfg.wake_cap_min, derived));
}

function matchPreAnswer(evt, cache, qv, cfg) {
  if (!Array.isArray(cache) || !cache.length) return null;
  let best = null;
  if (Array.isArray(qv)) {
    for (const e of cache) {
      if (!Array.isArray(e.vec)) continue;
      const s = cosine(qv, e.vec);
      if (s >= cfg.pre_answer.threshold && (!best || s > best.score)) best = { entry: e, score: s, via: "cosine" };
    }
  }
  if (!best) {
    const qw = new Set(tokWords(`${(evt.concept_tokens || []).join(" ")} ${evt.text || ""}`));
    for (const e of cache) {
      const ew = tokWords(String(e.concept + " " + e.doubt));
      const overlap = ew.filter(w => qw.has(w)).length;
      if (overlap >= cfg.pre_answer.min_overlap && (!best || overlap > best.score)) best = { entry: e, score: overlap, via: "overlap" };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// M8-FIX (1 Aug 2026) — THE DOSSIER TAKES ONLY CANON.
// presence.mjs posts its stall afferent with concept_tokens = the most frequent
// words of the WINDOW TITLES he was thrashing between; its own header calls
// them "a hint of what he was in", and it is RIGHT to send them — the precache
// match (M7) and the bg recall-match key off that hint. But the dossier write
// below took every one of those tokens as a concept, so on 31 Jul 2026 20:14
// his day's posterior grew rows named "google", "chrome", "labelbox".
// dossier.json is the OPPONENT_SCOUT test-set that shapes scrimmage grammar:
// left alone, the captain eventually gets quizzed on "chrome".
// The fix follows capture.mjs's precedent exactly — resolve the token against
// the hand-curated canon registry (case-fold + alias lookup, capture's OWN
// canonicalize) and let only a resolving token open a dossier row.
// SCOPE IS DELIBERATELY ONE WRITE: the hint keeps flowing everywhere it flows
// today — the afferent log, the salience ledger, the workspace broadcast, NOV,
// HAB, binding, the precache/bg matchers. ONLY dossier.concepts is filtered.
// And a stall is still a stall: stalls_today and the capacity nudge count the
// episode whether or not its words were canon (they measure thrash, not topic).
// ---------------------------------------------------------------------------
const EMPTY_REGISTRY = { conceptAlias: new Map(), skillAlias: new Map(), loaded: false };
let regCache = { key: "", reg: EMPTY_REGISTRY };
function conceptRegistry() {
  // The daemon runs for days and the canon is edited BY HAND, so a restart must
  // not be the price of registering a concept — but re-parsing the file per
  // token would be absurd. mtime+size keyed: one stat per dossier write, a
  // re-parse only when he actually changed it. Any failure (missing, held,
  // malformed) → the empty registry, which downstream means the OLD behaviour.
  try {
    const st = statSync(CONCEPTS);
    const key = `${st.mtimeMs}:${st.size}`;
    if (key !== regCache.key) regCache = { key, reg: loadRegistry(CONCEPTS) };
    return regCache.reg;
  } catch { return EMPTY_REGISTRY; }
}
// raw token → the canonical dossier key, or null when it is not canon at all.
// Both vocabularies count: a dossier row is study GROUND, not a track-scoped
// rep, and a hands-on skill id (fastapi) is as testable as a concept id.
// No registry → the pre-fix behaviour, verbatim (capture's law: a missing
// registry is never allowed to block a write).
function dossierKey(tok, reg) {
  if (!reg || !reg.loaded) return String(tok).toLowerCase();
  const c = canonicalize(tok, "concept", reg);
  if (!c.unregistered) return c.canonical;
  const s = canonicalize(tok, "skill", reg);
  return s.unregistered ? null : s.canonical;
}

// ---------------------------------------------------------------------------
// THE NUCLEUS — binding + gate. Pure-ish: every side effect goes through deps,
// so the selftest drives it with an injected clock and captured writes.
// ---------------------------------------------------------------------------
function createNucleus(cfg, deps = {}) {
  const D = {
    now: deps.now || (() => Date.now()),
    appendAfferent: deps.appendAfferent || ((row) => appendFileSync(AFFERENT, JSON.stringify(row) + "\n")),
    appendLedger: deps.appendLedger || ((row) => appendFileSync(SLEDGER, JSON.stringify(row) + "\n")),
    writeWorkspace: deps.writeWorkspace || ((o) => writeAtomic(WORKSPACE, o)),
    writeWake: deps.writeWake || ((o) => writeAtomic(WAKE, o)),
    // M14 — wakes QUEUE (append), they never clobber; wake.json stays as the
    // latest-wake mirror so every pre-queue reader keeps working (layering)
    appendWakeQueue: deps.appendWakeQueue || ((row) => appendFileSync(WQUEUE, JSON.stringify(row) + "\n")),
    // M22 — the second spotlight: a suppressed wake's THOUGHT is queued here
    appendBgQueue: deps.appendBgQueue || ((row) => appendFileSync(BGQUEUE, JSON.stringify(row) + "\n")),
    markets: deps.markets || (() => { const t = readJson(join(STATE_DIR, "twin.json")); const m = {}; for (const mk of (t && t.markets) || []) m[mk.id] = mk.p; return m; }),
    headroomFrac: deps.headroomFrac || defaultHeadroomFrac,
    allowedTokens: deps.allowedTokens || defaultAllowedTokens,   // M14 — the live cap rides the real ledger
    // M5 — neuromodulation: the tone's τ1 bump (conserve raises the wake bar)
    toneBump: deps.toneBump || (() => { const t = readJson(join(STATE_DIR, "tone.json")); return (t && t.effects && Number.isFinite(t.effects.tau1_bump)) ? t.effects.tau1_bump : 0; }),
    // M7 — the Rest Room's ammunition (read-only; dmn.mjs owns the file)
    precache: deps.precache || (() => readJson(join(STATE_DIR, "dmn_precache.json"))),
    // M17 — the night's answer cache (read-only; nightshift.mjs owns the file)
    answerCache: deps.answerCache || (() => readLines(ACACHE)),
    // M17 — ONE embed per doubt-shaped moment (free T6 lane, hard timeout;
    // dry/slow → null and the overlap floor serves — never a stall)
    embedText: deps.embedText || (async (text) => {
      try {
        const { embedPool } = await import("./hippocampus.mjs");
        const v = await Promise.race([embedPool([text]), new Promise(res => setTimeout(() => res(null), cfg.pre_answer.embed_timeout_ms))]);
        return (v && v[0]) || null;
      } catch { return null; }
    }),
    // M8 — the Living Dossier (this nucleus is its sole writer)
    writeDossier: deps.writeDossier || ((o) => writeAtomic(DOSSIER, o)),
    // M8-FIX — the canon vocabulary the dossier is filtered against (read-only).
    // Injected like tone/precache/answerCache so the selftest pins its OWN
    // vocabulary: concepts.json is hand-curated canon the captain edits, and a
    // check that rode it would go red on code that never changed.
    conceptRegistry: deps.conceptRegistry || conceptRegistry,
    // #6 — the fallback join key. sprint.json is the curriculum spine and is
    // Sheet-driven + single-writer (sprintsync owns it); this is a READ.
    // working_set.concept_in_motion was measured to overlap the precache on
    // nothing; sprint.progress.current.task is "Hallucinations" today and the
    // live dmn_precache.json holds 3 of 5 entries on `hallucinations`.
    sprintConcept: deps.sprintConcept || (() => {
      const s = readJson(SPRINT);
      return (s && s.progress && s.progress.current && s.progress.current.task) ? String(s.progress.current.task) : null;
    }),
    adjudicate: deps.adjudicate || adjudicateLive,
    schedule: deps.schedule || ((ms, fn) => setTimeout(fn, ms)),
    readWake: deps.readWake || (() => readJson(WAKE)),
    log: deps.log || (() => {}),
  };
  const N = {
    buffer: [], flushTimer: null,
    seen: new Set(), hab: new Map(), wakeKeys: new Map(), lastPhash: new Map(),
    wakesToday: 0, wakeDate: localDate(new Date(D.now())),
    workspace: readJson(WORKSPACE) || { version: 0, moment: null, deep: null },
    dossier: readJson(DOSSIER) || { date: null, concepts: {}, stalls_today: 0, capacity_nudge: null },
    adjudications: 0,
  };

  async function ingest(raw) {
    const now = D.now();
    // THE AFFECT FIREWALL (§5.1) — an affect-modality event (the Cochlea's
    // lane) may become AT MOST a timing/softening hint for the mouth, held
    // ephemerally in the workspace, then discarded. It is NEVER logged,
    // NEVER scored, and structurally cannot reach any file the Governor,
    // Twin, or genome read (the thalamus writes only its own four files).
    if (raw && raw.modality === "affect") {
      const hint = /strain|flat|tired|heavy/i.test(String(raw.signal || ""))
        ? "soften — shorter turns, offer the floor-touch gently"
        : "ease the pace a touch";
      N.workspace = { ...N.workspace, version: (N.workspace.version || 0) + 1, updated_at: new Date(now).toISOString(), mouth_hint: { hint, expires: new Date(now + 120000).toISOString() } };
      D.writeWorkspace(N.workspace);
      return { firewalled: true };
    }
    const evt = sanitizeAfferent(raw, cfg);        // #1 — the derivation gate reads cfg.self_sources now
    evt.ts = evt.ts || new Date(now).toISOString();
    // vision: the page sends only a 64-bit perceptual hash (raw pixels never
    // persist); salience of a frame = Hamming distance from the last one
    if (evt.modality === "vision" && evt.phash) {
      const k = evt.kind || "screen";
      const prev = N.lastPhash.get(k);
      evt.hamming = prev === undefined ? 64 : phashHamming(prev, evt.phash);
      N.lastPhash.set(k, evt.phash);
      delete evt.phash;                              // the hash itself needn't persist either
    }
    // vision static-frame gate: distance ~0 = filtered at the door, free
    if (evt.modality === "vision" && Number.isFinite(evt.hamming) && evt.hamming <= 1) return { filtered: true };
    D.appendAfferent(evt);
    const comps = computeComponents(evt, { cfg, markets: D.markets(), seen: N.seen, hab: N.hab, now });
    // habituation charges AFTER scoring; novelty burns AFTER scoring
    const key = signalKey(evt);
    const h = N.hab.get(key) || { h: 0, ts: now };
    const dt = Math.max(0, now - h.ts);
    N.hab.set(key, { h: h.h * Math.exp(-dt / cfg.hab.tau_ms) + 1, ts: now });
    for (const t of evt.concept_tokens || []) N.seen.add(String(t).toLowerCase());
    if (evt.confused_with) N.seen.add(`pair:${String(evt.confused_with).toLowerCase()}`);
    N.buffer.push({ evt, comps, S: salience(comps, cfg.weights), key, at: now });
    // E2E audit 25 Jul 2026: this catch was BLIND (`() => {}`) — and flush()
    // splices the buffer before it scores anything, so a single throw (a Windows
    // renameSync EPERM while Drive-sync/AV/an editor holds workspace.json open is
    // the everyday cause) made his moment vanish with no tier, no wake, no ledger
    // row and not one line of log to find it by. It says so now.
    if (!N.flushTimer) N.flushTimer = D.schedule(cfg.binding_ms, () => flush().catch(e => D.log(`thalamus: flush failed — ${(e && e.message) || e}`)));
    return { ok: true, S: N.buffer[N.buffer.length - 1].S };
  }

  // temporal binding — winner-take-all spotlight; co-temporal cross-modality or
  // shared concept token fuses; unlinked same-modality events become their own moments
  function bindGroups(buf) {
    const groups = [];
    let rest = buf.slice().sort((a, b) => b.S - a.S);
    while (rest.length) {
      const spot = rest.shift();
      const spotTokens = new Set((spot.evt.concept_tokens || []).map(t => String(t).toLowerCase()));
      const linked = [], unlinked = [];
      for (const e of rest) {
        const share = (e.evt.concept_tokens || []).some(t => spotTokens.has(String(t).toLowerCase()));
        (e.evt.modality !== spot.evt.modality || share) ? linked.push(e) : unlinked.push(e);
      }
      groups.push({ spotlight: spot, context: linked });
      rest = unlinked;
    }
    return groups;
  }

  // E2E audit 25 Jul 2026: flush() was RE-ENTRANT across its own awaits (the ≤15s
  // adjudicator, the ≤4s embed). While one flush sat parked, the next binding
  // window fired a second flush that ran to completion and broadcast the LIVE
  // spotlight — then the parked one resumed and overwrote it with an OLDER moment
  // at a HIGHER version, pinning the Dugout page to a moment he had already moved
  // past. The same interleaving let both flushes read the pre-increment wake
  // counter and blow the day's humane Opus cap. Flushes now CHAIN: one moment at
  // a time, in arrival order. flushOnce is the original engine, behaviour intact.
  let flushChain = Promise.resolve();
  function flush() {
    const p = flushChain.then(flushOnce, flushOnce);
    flushChain = p.then(() => { }, () => { });      // a failed flush must never wedge the chain
    return p;
  }
  async function flushOnce() {
    N.flushTimer = null;
    const buf = N.buffer.splice(0);
    if (!buf.length) return [];
    const now = D.now();
    const today = localDate(new Date(now));
    if (today !== N.wakeDate) { N.wakeDate = today; N.wakesToday = 0; }
    const frac = D.headroomFrac();
    const t1 = tau1Effective(cfg, frac) + D.toneBump();   // budget coupling + neuromodulation
    const capToday = wakeCapToday(cfg, D.allowedTokens()); // M14 — ledger-true, folklore dead
    const results = [];
    // E2E audit 25 Jul 2026: the buffer is SPLICED before any of this runs, so one
    // throw used to take every remaining bound moment of the window with it —
    // silently. The everyday cause on this machine is a renameSync EPERM while
    // Drive-sync / AV / an open editor holds workspace.json for a beat. Each group
    // now stands alone: a failed write costs ONE moment, and it says so in the log.
    for (const g of bindGroups(buf)) {
      try {
        const r = await runGroup(g, { now, today, frac, t1, capToday });
        if (r) results.push(r);
      } catch (e) {
        D.log(`thalamus: a bound moment was LOST mid-flush (${(e && e.message) || e}) — the rest of this window still lands`);
      }
    }
    D.writeDossier(N.dossier);
    return results;
  }

  // one bound moment, start to finish: the ladder, the gates, the attachments,
  // the broadcast, the ledger, the dossier. Split out of flush() by the E2E audit
  // (25 Jul 2026) so a throw here cannot take its sibling moments down with it.
  async function runGroup(g, { now, today, frac, t1, capToday }) {
    const S = g.spotlight.S;
    const momentId = `m_${now}_${Math.abs(hash32(g.spotlight.key + S))}`;
    let tier = S < cfg.tiers.tau0 ? 0 : 1;
    let outcome = tier === 0 ? "reflex" : "enrich";
    let adjudicated = false;
    // E2E audit 25 Jul 2026: the two FREE gates are read BEFORE the ladder now.
    // They used to run only AFTER the ε-band's paid ~15s adjudication, so a
    // moment already inside its refractory window, or already past the day's
    // cap, still bought a verdict that was going to be demoted regardless — and
    // the ledger then carried adjudicated:true on an outcome of "refractory".
    // A gated near-miss now simply takes the adjudicator's own fail-closed
    // default (no wake) without paying a CLI cold-start for it.
    const lastWake = N.wakeKeys.get(g.spotlight.key);
    const inRefractory = lastWake !== undefined && now - lastWake < cfg.refractory_min * 60000;
    const atCap = N.wakesToday >= capToday;
    // ONE-SIDED epsilon (fix 18 Jul): a score already AT/ABOVE the bar wakes
    // outright — it is NEVER handed to the fail-closed adjudicator. The grey
    // band only catches near-MISSES just below the bar. (Before, a bare voiced
    // doubt sat exactly on 0.45, landed inside the symmetric ±band around a
    // 0.42 bar, and got silently demoted to a 15s haiku coin-flip that defaults
    // to no-wake — so his real doubts almost never reached Opus.)
    if (S >= t1) { tier = 2; outcome = "wake"; }
    else if (t1 - S < cfg.tiers.epsilon && !inRefractory && !atCap) {
      adjudicated = true; N.adjudications++;
      const hard = await D.adjudicate(g.spotlight.evt, S).catch(() => false);
      if (hard) { tier = 2; outcome = "adjudicated_up"; } else { tier = Math.max(tier, 1); outcome = "adjudicated_down"; }
    }
    if (tier === 2) {
      if (inRefractory) { tier = 1; outcome = "refractory"; }
      else if (atCap) { tier = 1; outcome = "capped"; }
      // E2E audit 25 Jul 2026: the wake slot is RESERVED here, at the gate. It
      // used to be claimed ~70 lines below, on the FAR side of the ≤4s embed
      // await — two flushes interleaving on that await both read the same
      // pre-increment counter and both woke Opus, past the humane cap. (flush()
      // is serialized now too; this is the second lock, not the first.)
      else { N.wakesToday++; N.wakeKeys.set(g.spotlight.key, now); }
      // M22 — THE SECOND SPOTLIGHT: suppress the WAKE, never the THOUGHT.
      // A refractory/capped moment earned deep attention and lost only the
      // Opus lane — it queues for the idle-tank drain instead of dying.
      if (outcome === "refractory" || outcome === "capped") {
        D.appendBgQueue({ moment_id: momentId, ts: new Date(now).toISOString(), status: "queued", reason: outcome, spotlight: { ...g.spotlight.evt, S: g.spotlight.S }, bound_context: g.context.map(c => ({ modality: c.evt.modality, text: c.evt.text, event_key: c.evt.event_key })) });
        D.log(`thalamus: ${outcome} moment queued for the second spotlight — the thought survives the gate`);
      }
    }
    const moment = {
      moment_id: momentId, ts: new Date(now).toISOString(), tier,
      modalities: [...new Set([g.spotlight.evt.modality, ...g.context.map(c => c.evt.modality)])],
      spotlight: { ...g.spotlight.evt, S, comps: g.spotlight.comps },
      context: g.context.map(c => ({ ...c.evt, S: c.S })),
    };
    // M7 — PREDICTIVE PRESENCE: a stall moment queries the Rest Room's
    // precache — the intervention was drafted HOURS ago, so it lands with
    // ZERO model latency, inside the stuck→gone window. Attaching it here
    // is NOT speech: the mouth gate (earned voice + RED/conserve mute)
    // still decides at the bridge whether it may ever be said.
    // #9 — EXPIRY IS AT THE SOURCE. These four slots used to be carried forward
    // UNCONDITIONALLY and rebroadcast on every bound moment, so live
    // workspace.json advertised a pre_answer whose 3-minute window closed on
    // 30 Jul — re-serialized into thousands of broadcasts since. Every consumer
    // guards on `expires`, so nothing stale was ever spoken; the damage was that
    // the state file MISREPORTED the organism's condition, which is the exact
    // class of lie this audit exists to end. A missing `expires` reads as alive
    // (defensive: only a real, past deadline may drop a payload).
    const alive = (o) => !!o && (!o.expires || new Date(o.expires).getTime() > now);
    const carry = (o, name) => { if (o && !alive(o)) { D.log(`thalamus: dropped an EXPIRED ${name} from the workspace (expired ${o.expires}) — the broadcast now reports the truth`); return null; } return o || null; };
    let whisper = carry(N.workspace.whisper, "whisper");
    let engWhisper = "skip", engPre = "skip";      // #10 — tri-states, never an unmeasured silence
    if (String(g.spotlight.evt.event_key || "").startsWith("stall:")) {
      const pc = D.precache();
      const entries = (pc && pc.entries) || [];
      const hintWords = new Set([...(g.spotlight.evt.concept_tokens || []).map(t => String(t).toLowerCase()), ...tokWords(String(g.spotlight.evt.text || ""))]);
      let best = null, via = null;
      // defensive: a hand-built cfg (selftest fixtures, a future caller) must
      // never throw INSIDE a bound moment — a throw here costs the moment.
      const wcfg = cfg.whisper || DEFAULT_CONFIG.whisper;
      // ---- LANE 1 (FROZEN): the original raw word-overlap matcher, verbatim.
      // It has matched 0 of 95 historical stalls — presence.mjs fills
      // concept_tokens with WINDOW-TITLE words ("google","chrome","antigravity")
      // and this joins them against concept NAMES — but it is left first and
      // untouched, because it is the one that fires when presence's producer
      // side is repaired to send real concepts.
      if (wcfg.legacy_raw !== false) {
        for (const e of entries) {
          const ew = tokWords(String(e.concept + " " + e.stall_signature));
          const overlap = ew.filter(w => hintWords.has(w)).length;
          if (overlap >= 1 && (!best || overlap > best.overlap)) { best = { ...e, overlap }; via = "raw"; }
        }
      }
      // ---- LANE 2 (#6, the repair): CANONICAL join. Push both sides through
      // the dossierKey()/conceptRegistry() filter this file already owns (see
      // THE DOSSIER TAKES ONLY CANON) so "chrome" resolves to nothing and
      // "hallucination" resolves to the registered id `hallucinations`. If the
      // stall's own words name no canon at all — the measured everyday case —
      // fall back to the sprint's CURRENT concept: he stalled while he was
      // supposed to be on today's ground, and that is a defensible prior, said
      // out loud in the log rather than smuggled.
      if (!best && wcfg.canon_join !== false) {
        const reg = D.conceptRegistry();
        const canonOf = (words) => { const s = new Set(); for (const w of words) { const id = dossierKey(w, reg); if (id) s.add(id); } return s; };
        let hintCanon = canonOf([...hintWords]);
        let fellBack = false;
        if (!hintCanon.size && wcfg.sprint_fallback !== false) {
          const sc = D.sprintConcept();
          const id = sc ? dossierKey(String(sc).toLowerCase(), reg) : null;
          if (id) { hintCanon = new Set([id]); fellBack = true; }
        }
        if (hintCanon.size) {
          for (const e of entries) {
            const eCanon = canonOf([String(e.concept || "").toLowerCase(), ...tokWords(String(e.concept || ""))]);
            const overlap = [...eCanon].filter(id => hintCanon.has(id)).length;
            if (overlap >= 1 && (!best || overlap > best.overlap)) { best = { ...e, overlap }; via = fellBack ? "sprint" : "canon"; }
          }
        }
      }
      if (best) {
        whisper = { type: "wall_breaker", concept: best.concept, reframe: best.reframe, drill: best.drill, matched_via: via, moment_id: momentId, ts: moment.ts, expires: new Date(now + 180000).toISOString() };
        engWhisper = "hit";
        D.log(`thalamus: stall matched the Rest Room's precache via ${via} on "${best.concept}" — whisper loaded (zero-latency), the mouth gate decides`);
      } else {
        engWhisper = entries.length ? "miss" : "dry";
        D.log(`thalamus: stall found NO precache match (${entries.length} entr${entries.length === 1 ? "y" : "ies"} on offer) — no whisper, never improvise one`);
      }
    }
    // M17 — THE PRE-ANSWER ENGINE, serve side: a doubt-shaped moment (a
    // voiced SELF or a confident-wrong rep) checks the night's answer_cache.
    // The answer was drafted HOURS ago on the free pool — it attaches with
    // zero latency and zero Opus. Attaching is NOT speech (recall-hint
    // pattern): the Gaffer weaves it only if it earns the turn; no gate moved.
    let preAnswer = carry(N.workspace.pre_answer, "pre-answer");     // #9
    if (cfg.pre_answer.enabled && tier >= 1 && (g.spotlight.comps.self > 0 || g.spotlight.comps.err > 0)) {
      const cache = D.answerCache() || [];
      if (cache.length) {
        const qtext = `${(g.spotlight.evt.concept_tokens || []).join(" ")} ${g.spotlight.evt.text || ""}`.trim();
        const qv = cache.some(e => Array.isArray(e.vec)) ? await D.embedText(qtext).catch(() => null) : null;
        const hit = matchPreAnswer(g.spotlight.evt, cache, qv, cfg);
        if (hit) {
          preAnswer = { type: "pre_answer", concept: hit.entry.concept, doubt: hit.entry.doubt, answer: hit.entry.answer, matched_via: hit.via, score: Math.round(hit.score * 100) / 100, moment_id: momentId, ts: moment.ts, expires: new Date(now + 180000).toISOString() };
          engPre = "hit";
          D.log(`thalamus: doubt matched the night's answer_cache (${hit.via}) — pre-answer attached, zero Opus; the mouth decides`);
        } else {
          engPre = "miss";
          D.log(`thalamus: doubt queried the night's answer_cache (${cache.length} drafted) — NO match, no pre-answer (never improvise an answer)`);
        }
      } else {
        // #10 / HONESTY: an empty cache is an UNMEASURED SILENCE, not a miss.
        // Rendering it as "no match" is exactly how "has the pre-answer engine
        // ever fired?" became unanswerable.
        engPre = "dry";
        D.log(`thalamus: doubt reached the pre-answer engine but the night's answer_cache is EMPTY — this is a dry corpus, not a miss`);
      }
    }
    // M22 — THE RECALL-MATCH: he just touched ground a suppressed thought
    // lives on — the drained insight returns NOW, zero switching cost.
    // Consumed on return (a background thought speaks its piece once).
    let bgHint = carry(N.workspace.bg_hint, "second-spotlight hint");   // #9
    const bgHeld = Array.isArray(N.workspace.bg) ? N.workspace.bg : [];
    const bgMatch = matchBg(g.spotlight.evt, bgHeld);
    if (bgMatch) {
      bgHint = { type: "second_spotlight", concept: bgMatch.concept, insight: bgMatch.insight, from_moment: bgMatch.moment_id, moment_id: momentId, ts: moment.ts, expires: new Date(now + 180000).toISOString() };
      N.workspace = { ...N.workspace, bg: bgHeld.filter(b => b.moment_id !== bgMatch.moment_id) };
      D.appendBgQueue({ moment_id: bgMatch.moment_id, status: "returned", at: moment.ts, to_moment: momentId });
      D.log(`thalamus: second spotlight returned — a suppressed thought on "${bgMatch.concept}" met its recall-match`);
    }
    // THE BROADCAST IS THE WRITE — version-stamped; every region subscribes
    // E2E audit 25 Jul 2026: this rebuild lists its fields explicitly and USED TO
    // OMIT `deep_recent` — so every ordinary moment broadcast wiped the last-3
    // served Opus answers that serveDeep() (below, ~L550) maintains, and the
    // Dugout page reads to inject answers he hasn't seen yet. That is exactly the
    // "lost deep answer" scar this list was built to close, reopened from the side.
    N.workspace = { version: (N.workspace.version || 0) + 1, updated_at: moment.ts, moment, deep: N.workspace.deep || null, deep_recent: Array.isArray(N.workspace.deep_recent) ? N.workspace.deep_recent : [], whisper, pre_answer: preAnswer, bg: Array.isArray(N.workspace.bg) ? N.workspace.bg : [], bg_hint: bgHint, mouth_hint: carry(N.workspace.mouth_hint, "mouth hint") };
    D.writeWorkspace(N.workspace);
    if (tier === 2) {
      // (the slot itself was reserved at the gate above — E2E audit 25 Jul 2026)
      const wakeRow = { moment_id: momentId, ts: moment.ts, status: "pending", deadline_ms: (cfg.deep && cfg.deep.deadline_ms) || 45000, spotlight: moment.spotlight, bound_context: moment.context };
      D.appendWakeQueue(wakeRow);                  // M14 — the QUEUE is the contract: a second wake never clobbers a pending one
      D.writeWake(wakeRow);                        // the latest-wake mirror (layering — pre-queue readers keep working)
      D.log(`thalamus: WAKE → opus (S=${S.toFixed(2)} ≥ τ1=${t1.toFixed(2)}, ${N.wakesToday}/${capToday} today — cap is ledger-derived)`);
    }
    // #10 — THE ATTACH FLAGS GET AN ADDRESS. A log answers "what happened at
    // 14:02"; it cannot answer "has the pre-answer engine EVER fired?" — and
    // that question was unanswerable across the organism's whole life. The
    // ledger is append-only, single-writer (this file), and already read by
    // nightshift's wind tunnel and the Dugout's gate panel, so the tri-states
    // ride it. "skip" = never queried · "dry" = queried, the corpus was EMPTY
    // (an unmeasured silence, NOT a zero) · "miss" = queried and genuinely no
    // match · "hit" = attached. `provenance` lands too, because #1's whole
    // premise was that nobody could see which stream a moment came from.
    D.appendLedger({
      ts: moment.ts, day: today, moment_id: momentId, tier, S: Math.round(S * 1000) / 1000,
      comps: roundComps(g.spotlight.comps), key: g.spotlight.key, modalities: moment.modalities,
      tau1_eff: Math.round(t1 * 1000) / 1000, headroom_frac: Math.round(frac * 1000) / 1000, outcome, adjudicated,
      provenance: provenanceOf(g.spotlight.evt) || null,
      engines: { whisper: engWhisper, pre_answer: engPre, bg: bgMatch ? "hit" : (bgHeld.length ? "miss" : "skip") },
    });

    // M8 — THE LIVING DOSSIER: a live Bayesian-ish posterior over his day,
    // updated from every salience event. Built ONLY from counts (prosody is
    // structurally absent — it never entered the nucleus). The capacity
    // nudge can only ever LOWER demand — never raise, never touch RED.
    if (N.dossier.date !== today) N.dossier = { date: today, concepts: {}, stalls_today: 0, capacity_nudge: null };
    const evt = g.spotlight.evt;
    const reg = D.conceptRegistry();
    // the first-3 selection is untouched; only NON-CANON tokens are dropped out
    // of it, and only here — see THE DOSSIER TAKES ONLY CANON above.
    for (const tok of (evt.concept_tokens || []).map(t => String(t).toLowerCase()).slice(0, 3)) {
      const id = dossierKey(tok, reg);
      if (id === null) continue;                     // an ambient window-title word: a hint elsewhere, a concept nowhere
      const c = N.dossier.concepts[id] = N.dossier.concepts[id] || { stalls: 0, errs: 0, wins: 0, doubts: 0, last_ts: null };
      if (c.doubts === undefined) c.doubts = 0;      // a dossier written before #1 has no doubts key
      if (String(evt.event_key || "").startsWith("stall:")) c.stalls++;
      if (evt.rep && evt.rep.correct === false) c.errs++;
      if (evt.rep && evt.rep.correct === true) c.wins++;
      // #1 — the prize. Until today a doubt he TYPED scored zero and left no
      // trace anywhere; the dossier is the organism's posterior over his day and
      // it is where "what confuses him, on the surface he actually works on"
      // belongs. Counts only — the affect firewall never let anything else in.
      if (g.spotlight.comps.self > 0) c.doubts++;
      c.last_ts = moment.ts;
    }
    if (String(evt.event_key || "").startsWith("stall:")) N.dossier.stalls_today++;
    N.dossier.capacity_nudge = N.dossier.stalls_today >= 3 ? "lower" : null;   // only-lower, by construction
    N.dossier.updated_at = moment.ts;
    return { moment_id: momentId, tier, S, outcome };
  }

  // the deep answer flows back THROUGH the nucleus (single-writer preserved).
  // scan-fix 15 Jul: the single `deep` slot LOST answers live (two lanes, 5s
  // apart — the first 6k-token read silently overwritten). `deep` stays as the
  // latest (compat); `deep_recent` keeps the last 3 served answers so the page
  // can inject each unseen one. Stale reads die at the bridge (10-min TTL).
  function foldDeepAnswer(body) {
    const cur = N.workspace;
    const entry = { moment_id: String(body.moment_id || ""), text: body.declined ? null : String(body.text || "").slice(0, 4000), declined: !!body.declined, reason: body.reason || null, provenance: body.provenance || "opus", ts: new Date(D.now()).toISOString() };
    const recent = (Array.isArray(cur.deep_recent) ? cur.deep_recent : []).filter(d => d.moment_id !== entry.moment_id);
    if (!entry.declined && entry.text) recent.push({ moment_id: entry.moment_id, text: entry.text, provenance: entry.provenance, ts: entry.ts });
    while (recent.length > 3) recent.shift();
    N.workspace = {
      ...cur, version: (cur.version || 0) + 1, updated_at: new Date(D.now()).toISOString(),
      deep: entry, deep_recent: recent,
    };
    D.writeWorkspace(N.workspace);
    // M14 — the resolution row CLOSES the wake in the queue (event-sourced)
    D.appendWakeQueue({ moment_id: String(body.moment_id || ""), status: body.declined ? "declined" : "served", at: new Date(D.now()).toISOString(), reason: body.reason || null });
    const wake = D.readWake();
    if (wake && wake.moment_id === body.moment_id) {
      D.writeWake({ consumed: { moment_id: wake.moment_id, at: new Date(D.now()).toISOString(), status: body.declined ? "declined" : "served" } });  // consumed-on-success, like brain_queue.triggers
    }
    return { ok: true, version: N.workspace.version };
  }

  // M22 — a drained background thought folds in THROUGH the nucleus (single-
  // writer preserved: the DMN posts, only this file writes workspace/bg_queue)
  function foldBgDrained(body) {
    const id = String(body.moment_id || "");
    if (!id || !body.insight) return { ok: false, error: "a drained thought needs moment_id + insight" };
    const held = (Array.isArray(N.workspace.bg) ? N.workspace.bg : []).filter(b => b.moment_id !== id);
    held.push({ moment_id: id, concept: String(body.concept || "").slice(0, 80), insight: String(body.insight || "").slice(0, 400), tokens: Array.isArray(body.tokens) ? body.tokens.slice(0, 6) : [], ts: new Date(D.now()).toISOString() });
    while (held.length > 10) held.shift();             // FIFO cap — the shelf stays small
    N.workspace = { ...N.workspace, version: (N.workspace.version || 0) + 1, updated_at: new Date(D.now()).toISOString(), bg: held };
    D.writeWorkspace(N.workspace);
    D.appendBgQueue({ moment_id: id, status: "drained", at: new Date(D.now()).toISOString() });
    return { ok: true, held: held.length };
  }

  return { ingest, flush, foldDeepAnswer, foldBgDrained, state: N, cfg };
}
function hash32(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; }
// Hamming distance between two 16-hex-char (64-bit) perceptual hashes
function phashHamming(a, b) {
  let d = 0;
  for (let i = 0; i < 16; i++) {
    let x = (parseInt(String(a)[i] || "0", 16) ^ parseInt(String(b)[i] || "0", 16));
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
}
const roundComps = (c) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(v * 100) / 100]));

// window headroom straight from the brain's guarded budget accounting
function defaultHeadroomFrac() {
  try {
    // lazy import keeps selftest free of brain.mjs I/O
    const { headroom, loadConfig: loadBrainCfg } = brainMod || {};
    if (!headroom) return 1;
    const cfg = loadBrainCfg();
    const hr = headroom(cfg, readLines(join(STATE_DIR, "brain_ledger.jsonl")), readJson(join(STATE_DIR, "brain_queue.json")) || {}, new Date());
    return hr.cap > 0 ? clamp01((hr.cap - hr.used) / hr.cap) : 0;
  } catch { return 0.5; }   // unknown budget → lean conservative, not open
}
// M14 — the same guarded accounting, in TOKENS (feeds the live wake cap)
function defaultAllowedTokens() {
  try {
    const { headroom, loadConfig: loadBrainCfg } = brainMod || {};
    if (!headroom) return 0;
    const cfg = loadBrainCfg();
    const hr = headroom(cfg, readLines(join(STATE_DIR, "brain_ledger.jsonl")), readJson(join(STATE_DIR, "brain_queue.json")) || {}, new Date());
    return Math.max(0, hr.allowed || 0);
  } catch { return 0; }     // unknown budget → the cap floors at wake_cap_min
}
let brainMod = null;

// the ONLY sub-Opus paid thought: one Flash-Lite adjudication in the ε-band
async function adjudicateLive(evt, S) {
  const cfg = loadConfig();
  if (!cfg.adjudicator.enabled) return false;
  const q = `A personal learning system must decide if a moment needs its EXPENSIVE deep-reasoning brain or the free reflex is enough. Moment: ${JSON.stringify({ modality: evt.modality, text: String(evt.text || "").slice(0, 300), event_key: evt.event_key || null }).slice(0, 500)}. Is this a genuinely reasoning-hard moment (conceptual confusion, strategy question, contradiction) rather than routine chat/logging? Answer with exactly one word: yes or no.`;
  // 17 Jul: the adjudicator rides Claude (haiku, one word, async — the gate's
  // event loop never blocks). 15s ceiling: the CLI cold-starts slower than a
  // REST call. Any failure → the same conservative verdict as ever: no wake.
  try {
    const { claudeGenAsync } = await import("./claudegen.mjs");
    const r = await claudeGenAsync(q, "haiku", 15000);
    const text = String(r.text || "").trim().toLowerCase();
    if (r.ok && text) return text.startsWith("y");
  } catch { }
  return false;                                     // engine dry/slow → conservative: no wake
}

// ---------------------------------------------------------------------------
// THE BUS NERVE — fs.watch on the state dir turns machine events into afferents
// (event-driven, near-zero cost; 60s poll as the Windows fs.watch safety net)
// ---------------------------------------------------------------------------
// E2E audit 25 Jul 2026: firstToday used to slice the UTC calendar date straight
// out of an ISO-Z rep timestamp (`x.ts.slice(0,10)`) and compare it to the LOCAL
// date. This machine is IST (+5:30): between 00:00 and 05:30 every rep written
// "today" still carries YESTERDAY's UTC date, so no prior rep ever matched, and
// every late-night rep re-flagged firstToday — firing the "session_happened"
// market a second time and feeding the Twin a phantom surprise on a book it had
// already resolved. One zone: convert, then compare.
const repLocalDay = (ts) => { const d = new Date(ts || NaN); return Number.isNaN(d.getTime()) ? String(ts || "").slice(0, 10) : localDate(d); };
function createBusWatcher(nucleus, deps = {}) {
  const snap = {
    verdict: (readJson(join(STATE_DIR, "readiness.json")) || {}).verdict || null,
    reps: readLines(join(STATE_DIR, "reps_log.jsonl")).length,
    slip: readLines(join(STATE_DIR, "slip.jsonl")).length,
    due: (readJson(join(STATE_DIR, "cards.json")) || {}).due_today || 0,
  };
  const today = () => localDate(new Date());
  function sweep() {
    const out = [];
    const r = readJson(join(STATE_DIR, "readiness.json"));
    const v = (r || {}).verdict || null;
    if (v && snap.verdict && v !== snap.verdict) out.push({ modality: "bus", source: "readiness", event_key: `gov:${snap.verdict}->${v}`, gov_from: snap.verdict, gov_to: v });
    if (v) snap.verdict = v;
    const reps = readLines(join(STATE_DIR, "reps_log.jsonl"));
    if (reps.length > snap.reps) {
      const fresh = reps.slice(snap.reps);
      const firstToday = !reps.slice(0, snap.reps).some(x => repLocalDay(x.ts) === today());   // local-vs-local (see repLocalDay)
      fresh.forEach((rep, i) => out.push({
        modality: "bus", source: "reps", event_key: `rep:${rep.concept || "?"}`,
        concept_tokens: rep.concept ? [rep.concept] : [], rep: { confidence: rep.confidence, correct: rep.correct },
        market_id: firstToday && i === 0 ? "session_happened" : undefined, observed: true,
      }));
      snap.reps = reps.length;
    }
    const slip = readLines(join(STATE_DIR, "slip.jsonl"));
    if (slip.length > snap.slip) {
      for (const row of slip.slice(snap.slip)) if (row.book === "twin" && row.resolved && Number.isFinite(row.p)) {
        const c = Math.max(row.p, 1 - row.p);
        out.push({ modality: "bus", source: "slip", event_key: `twin:${row.type}`, p_obs: row.hit ? c : 1 - c });
      }
      snap.slip = slip.length;
    }
    const due = (readJson(join(STATE_DIR, "cards.json")) || {}).due_today || 0;
    if (due > snap.due) out.push({ modality: "bus", source: "fsrs", event_key: "dead:due", due_count: due });
    snap.due = due;
    return out;
  }
  const fire = () => { for (const e of sweep()) nucleus.ingest(e).catch(() => {}); };
  let deb = null;
  try { watch(STATE_DIR, () => { clearTimeout(deb); deb = setTimeout(fire, 250); }); } catch { }
  setInterval(fire, 60000);
  return { sweep, snap };
}

// ---------------------------------------------------------------------------
// selftest — the §4.7 bar, deterministic, injected afferents, zero network
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  // E2E audit 25 Jul 2026: the bar was read LIVE from dressing-room/state/
  // thalamus_config.json — a file whose own header INVITES the captain to retune
  // it through the genome flow. So the wake-path checks below were testing the
  // KNOB, not the code: nudge tau1_base to 0.50 and check 2b goes red while the
  // one-sided-ε logic it guards is perfectly intact. The bar these checks were
  // written against now lives HERE, built from DEFAULT_CONFIG and pinned (the M5
  // block has always pinned its own — this is the same discipline, file-wide).
  const liveCfg = loadConfig();
  const cfg = { ...DEFAULT_CONFIG, tiers: { ...DEFAULT_CONFIG.tiers, tau1_base: 0.40, epsilon: 0.10 } };
  assert("SELFTEST HERMETIC: the checks' bar is pinned in this file, not read from the tunable config",
    cfg.tiers.tau1_base === 0.40 && cfg.tiers.epsilon === 0.10 && cfg.weights.self === DEFAULT_CONFIG.weights.self && cfg !== liveCfg);
  assert("the LIVE config still parses and merges (it just doesn't set the test's bar)",
    !!liveCfg && Number.isFinite(liveCfg.tiers.tau1_base) && Number.isFinite(liveCfg.tiers.epsilon) && Array.isArray(liveCfg.self_markers));

  // M8-FIX — the canon vocabulary the dossier checks ride, PINNED here for the
  // same reason the bar above is: dressing-room/state/concepts.json is
  // hand-curated and grows weekly, so a check that read it would go red the day
  // he registers or renames something. The KEYS are built through capture's own
  // normaliser (against an empty registry, canonicalize returns exactly
  // normText(raw)) so the fixture can never drift from the matcher it tests.
  const normKey = (s) => canonicalize(s, "concept", { conceptAlias: new Map(), skillAlias: new Map() }).canonical;
  const bakeReg = (concepts, skills = {}) => {
    const reg = { conceptAlias: new Map(), skillAlias: new Map(), loaded: true };
    for (const [id, al] of Object.entries(concepts)) { reg.conceptAlias.set(normKey(id), id); for (const a of al) reg.conceptAlias.set(normKey(a), id); }
    for (const [id, al] of Object.entries(skills)) { reg.skillAlias.set(normKey(id), id); for (const a of al) reg.skillAlias.set(normKey(a), id); }
    return reg;
  };
  const testReg = bakeReg({ attention: [], tokenization: ["bpe"], embeddings: [] }, { fastapi: [] });

  // harness: virtual clock + captured writes + injected markets/headroom/adjudicator
  function rig(over = {}) {
    let t = 1000000;
    const wr = { afferents: [], ledger: [], workspaces: [], wakes: [], queue: [], bgQueue: [], logs: [], adjCalls: 0 };
    const n = createNucleus(over.cfg || cfg, {
      now: () => t,
      appendAfferent: (r) => wr.afferents.push(r), appendLedger: (r) => wr.ledger.push(r),
      // failWorkspaceFor makes ONE moment's write throw — the Windows EPERM the
      // E2E audit (25 Jul 2026) found could silently eat a whole binding window
      writeWorkspace: (o) => { if (over.failWorkspaceFor && o.moment && o.moment.spotlight && o.moment.spotlight.event_key === over.failWorkspaceFor) throw new Error("EPERM: workspace.json held open"); wr.workspaces.push(JSON.parse(JSON.stringify(o))); },
      writeWake: (o) => wr.wakes.push(JSON.parse(JSON.stringify(o))),
      log: (m) => wr.logs.push(String(m)),
      appendWakeQueue: (r) => wr.queue.push(JSON.parse(JSON.stringify(r))),
      appendBgQueue: (r) => wr.bgQueue.push(JSON.parse(JSON.stringify(r))),
      markets: () => over.markets || { session_happened: 0.9 },
      headroomFrac: () => (over.frac !== undefined ? over.frac : 1),
      allowedTokens: () => (over.allowedTokens !== undefined ? over.allowedTokens : 800000),
      // adjDelayMs lets a test PARK a flush mid-await (the re-entrancy rig)
      adjudicate: async () => { wr.adjCalls++; if (over.adjDelayMs) await new Promise(r => setTimeout(r, over.adjDelayMs)); return over.adjVerdict || false; },
      schedule: () => null,                          // manual flush in tests
      readWake: () => (wr.wakes.length ? wr.wakes[wr.wakes.length - 1] : null),
      toneBump: () => (over.toneBump !== undefined ? over.toneBump : 0),   // hermetic — the real tone.json never leaks in
      precache: () => (over.precache !== undefined ? over.precache : null),
      answerCache: () => (over.answerCache !== undefined ? over.answerCache : []),   // hermetic — the real cache never leaks in
      sprintConcept: () => (over.sprintConcept !== undefined ? over.sprintConcept : null),  // #6 — hermetic; the live sprint.json never leaks in
      // wakesAtEmbed snapshots the wake counter AT the embed await — that await is
      // the window two interleaved flushes used to race through (E2E audit 25 Jul 2026)
      embedText: async () => { wr.embedCalls = (wr.embedCalls || 0) + 1; wr.wakesAtEmbed = n.state.wakesToday; return over.embedVec !== undefined ? over.embedVec : null; },
      writeDossier: (o) => { wr.dossier = JSON.parse(JSON.stringify(o)); },
      conceptRegistry: () => (over.registry !== undefined ? over.registry : testReg),   // hermetic — the live canon never leaks in
    });
    n.state.dossier = { date: null, concepts: {}, stalls_today: 0, capacity_nudge: null };
    n.state.workspace = { version: 0, moment: null, deep: null };
    return { n, wr, tick: (ms) => { t += ms; }, now: () => t };
  }

  // (1) a low-p Twin event outscores a predicted one
  {
    const { n } = rig({ markets: { m1: 0.9 } });
    const predicted = await n.ingest({ modality: "bus", event_key: "k1", market_id: "m1", observed: true });
    const against = await n.ingest({ modality: "bus", event_key: "k2", market_id: "m1", observed: false });
    assert("PE: the event the Twin bet AGAINST outscores the predicted one", against.S > predicted.S && predicted.S < 0.1);
  }

  // (2) a repeated event is refractory-suppressed — no double-wake
  {
    const { n, wr, tick } = rig({ markets: { m1: 0.9 } });
    // a doubt voiced against a confident Twin bet — reliably S ≥ τ1 both times
    const hot = { modality: "voice", text: "i don't get attention scaling", market_id: "m1", observed: false, event_key: "doubt:attention" };
    await n.ingest({ ...hot }); let r = await n.flush();
    assert("a genuine surprise wakes opus (TIER-2 → wake.json)", r[0].tier === 2 && wr.wakes.length === 1 && wr.wakes[0].status === "pending");
    tick(5 * 60000);                                  // 5 min later, same signal
    await n.ingest({ ...hot }); r = await n.flush();
    assert("REFRACTORY: the same surprise cannot re-fire the deep brain", r[0].tier === 1 && r[0].outcome === "refractory" && wr.wakes.length === 1);
  }

  // (2b) THE WAKE-PATH FIX (18 Jul) — his spoken doubts must reach Opus again
  {
    // voice enrichment: a spoken doubt gains concept tokens; the markers drop
    const enr = sanitizeAfferent({ modality: "voice", text: "Jumping ka matlab kya hai mujhe samajh nahi aaya" });
    assert("VOICE TOKENS: a spoken doubt derives its concept, drops the doubt-markers", Array.isArray(enr.concept_tokens) && enr.concept_tokens.includes("jumping") && !enr.concept_tokens.includes("matlab") && !enr.concept_tokens.includes("samajh"));
    // REGRESSION (E2E audit 25 Jul 2026): the derivation was Latin-only, so a
    // fully-Devanagari doubt — how the ASR actually ships his speech — yielded NO
    // tokens: nov stayed 0, S sat at self-only 0.45, and any budget-raised bar
    // silently swallowed his realest doubts.
    const deva = sanitizeAfferent({ modality: "voice", text: "यार ये अटेंशन समझ नहीं आ रहा" });
    assert("VOICE TOKENS (Devanagari): a spoken doubt in his own script derives its concept too", Array.isArray(deva.concept_tokens) && deva.concept_tokens.includes("अटेंशन") && !deva.concept_tokens.includes("समझ") && !deva.concept_tokens.includes("नहीं"));
    const { n: nD, wr: wrD } = rig({ adjVerdict: false });   // adjudicator would say NO-WAKE
    const rD = await nD.ingest({ modality: "voice", text: "यार ये अटेंशन समझ नहीं आ रहा" });
    await nD.flush();
    assert("a FRESH-concept Devanagari doubt lights NOV and wakes Opus (self+nov=0.65)", rD.S >= 0.64 && wrD.wakes.length === 1);
    // ONE-SIDED epsilon: a bare self-doubt (S≈0.45, no novelty) at the 0.40 bar
    // must WAKE outright — never handed to the no-wake adjudicator.
    const { n, wr } = rig({ adjVerdict: false });     // adjudicator would say NO-WAKE
    n.state.seen.add("attention");                    // already-known concept → nov=0, no prior ingest → hab=0, so S≈self only
    await n.ingest({ modality: "voice", text: "attention mujhe samajh nahi aaya", concept_tokens: ["attention"] });
    const rb = await n.flush();
    assert("ONE-SIDED epsilon: a bare voiced self-doubt at the bar WAKES, never demoted to the coin-flip", rb[0].tier === 2 && rb[0].outcome === "wake" && wr.adjCalls === 0);
    // a FRESH concept doubt (self+nov≈0.65) wakes even on a drained budget
    const { n: n2 } = rig({ adjVerdict: false, frac: 0.5 });   // drained → bar ~0.575
    await n2.ingest({ modality: "voice", text: "embeddings kaise kaam karta hai mujhe samajh nahi aaya" });
    const rc = await n2.flush();
    assert("VOICE NOVELTY: a fresh-concept spoken doubt wakes Opus even on a half-drained budget", rc[0].tier === 2);
  }

  // (3) τ1_effective rises as the window drains
  {
    const full = tau1Effective(cfg, 1), empty = tau1Effective(cfg, 0);
    assert("BUDGET COUPLING: wake bar rises as headroom → 0", empty > full && Math.abs(empty - (cfg.tiers.tau1_base + cfg.tiers.budget_k)) < 1e-9);
    const { n, wr } = rig({ frac: 0 });               // window empty
    await n.ingest({ modality: "voice", text: "i don't get attention", concept_tokens: ["attention"] });
    const r = await n.flush();
    assert("an empty window demotes a would-be wake to the free lane", r[0].tier < 2 && wr.wakes.length === 0);
  }

  // (4) voice+frame+bus inside B fuse into ONE moment, winner-take-all
  {
    const { n, wr, tick } = rig();
    await n.ingest({ modality: "vision", kind: "screen", hamming: 30 });
    tick(200);
    await n.ingest({ modality: "voice", text: "wait, why does attention scale like this", concept_tokens: ["attention"] });
    tick(200);
    await n.ingest({ modality: "bus", source: "fsrs", event_key: "dead:due", due_count: 2, concept_tokens: ["attention"] });
    const r = await n.flush();
    const m = wr.workspaces[wr.workspaces.length - 1].moment;
    assert("BINDING: three senses in 900ms = ONE moment, three modalities", r.length === 1 && m.modalities.length === 3);
    assert("winner-take-all: the doubt is the spotlight, the rest bound context", m.spotlight.modality === "voice" && m.context.length === 2);
    assert("the broadcast IS the write: workspace version-stamped upward", wr.workspaces.every((w, i) => w.version === i + 1));
  }

  // (5) prosody/emotion are ignored — stripped at the door, never scored
  {
    const { n, wr } = rig();
    const clean = await n.ingest({ modality: "voice", text: "cosine question", concept_tokens: ["cosine"] });
    const { n: n2, wr: wr2 } = rig();
    const affect = await n2.ingest({ modality: "voice", text: "cosine question", concept_tokens: ["cosine"], prosody: { stress: 0.99 }, emotion: "agitated", tone: "flat" });
    assert("AFFECT FIREWALL: prosody/emotion change NOTHING in the score", Math.abs(clean.S - affect.S) < 1e-12);
    assert("affect fields never even land in the afferent log", !JSON.stringify(wr2.afferents).match(/prosody|emotion|agitated|"tone"/i) && wr.afferents.length === 1);
    // REGRESSION (E2E audit 25 Jul 2026): the door swept TOP-LEVEL keys only, so a
    // nested carrier (a richer ASR payload, a meta blob) sailed through into
    // afferent.jsonl and into workspace.moment.spotlight. The firewall is a
    // boundary — depth must not buy passage — and non-affect data must survive it.
    const nested = sanitizeAfferent({ modality: "voice", text: "cosine question", concept_tokens: ["cosine"], meta: { emotion: "frustrated", turn: 7 }, asr: { analysis: { prosody: { stress: 0.9 }, words: 3 }, alts: [{ text: "cosine", tone: "flat" }] } });
    assert("AFFECT FIREWALL: NESTED prosody/emotion/tone is stripped too (the door sweeps deep)",
      !JSON.stringify(nested).match(/prosody|emotion|frustrated|stress|"tone"|flat/i) && nested.meta.turn === 7 && nested.asr.analysis.words === 3 && nested.asr.alts[0].text === "cosine");
  }

  // (6) the ambiguous band calls the tiny model AT MOST once
  {
    const t1 = tau1Effective(cfg, 1);
    // one-sided band (18 Jul): a NEAR-MISS just BELOW the bar is the only case
    // that pays the adjudicator (a score above the bar wakes outright).
    const w = { ...cfg.weights, self: t1 - 0.02 };    // engineer S just under the bar, inside ε
    const cfgBand = { ...cfg, weights: w };
    const { n, wr } = rig({ cfg: cfgBand, adjVerdict: true });
    await n.ingest({ modality: "voice", text: "i don't get x", concept_tokens: [] });
    const r = await n.flush();
    assert("ε-band: a near-miss below the bar → ONE adjudication, verdict yes → TIER-2", wr.adjCalls === 1 && r[0].tier === 2 && r[0].outcome === "adjudicated_up");
    const { n: n3, wr: wr3 } = rig();
    await n3.ingest({ modality: "bus", event_key: "boring" }); await n3.flush();
    assert("clear cases never pay the adjudicator", wr3.adjCalls === 0);
  }

  // the door + the gates
  {
    const { n, wr } = rig();
    const f = await n.ingest({ modality: "vision", kind: "screen", hamming: 0 });
    assert("static screen = hamming 0 = filtered at the door, free", f.filtered === true && wr.afferents.length === 0);
    const { n: nv, wr: wrv } = rig();
    await nv.ingest({ modality: "vision", kind: "screen", phash: "ffffffffffffffff" });
    const same = await nv.ingest({ modality: "vision", kind: "screen", phash: "ffffffffffffffff" });
    const changed = await nv.ingest({ modality: "vision", kind: "screen", phash: "00000000ffffffff" });
    assert("phash: identical frame filtered; changed surface carries salience", same.filtered === true && !changed.filtered && changed.S > 0);
    assert("raw hash never persists in the afferent log (hash-in, distance-only)", !JSON.stringify(wrv.afferents).includes("ffffffffffffffff") && phashHamming("ffffffffffffffff", "0000000000000000") === 64);
    // THE AFFECT FIREWALL (M3): affect in → at most a mouth hint out, then gone
    const { n: na, wr: wra } = rig();
    const fw = await na.ingest({ modality: "affect", signal: "voice sounds strained", source: "cochlea" });
    const wsA = wra.workspaces[wra.workspaces.length - 1];
    assert("AFFECT FIREWALL: affect → a timing hint in the workspace, nothing more", fw.firewalled === true && wsA.mouth_hint && wsA.mouth_hint.hint.includes("soften"));
    assert("affect is NEVER logged, NEVER scored, NEVER bound", wra.afferents.length === 0 && wra.ledger.length === 0 && wra.wakes.length === 0);
    // E2E audit 25 Jul 2026: this check could not fail — `expires > epoch` is true
    // of every timestamp ever written, so a TTL regression (120s → 12h, leaking a
    // stale softening hint across his whole day) would have shipped green. Assert
    // the actual window, the way the whisper/pre-answer checks do.
    assert("the hint self-expires in exactly 120s (ephemeral by construction)", new Date(wsA.mouth_hint.expires) - new Date(wsA.updated_at) === 120000);
    assert("GOV magnitudes: any RED transition = 1.0, GREEN↔AMBER = 0.5",
      computeComponents({ modality: "bus", gov_from: "AMBER", gov_to: "RED" }, { cfg, markets: {}, seen: new Set(), hab: new Map(), now: 0 }).gov === 1 &&
      computeComponents({ modality: "bus", gov_from: "GREEN", gov_to: "AMBER" }, { cfg, markets: {}, seen: new Set(), hab: new Map(), now: 0 }).gov === 0.5);
    assert("ERR: knew-but-wrong = 1.0 (the calibration break), shaky-wrong = 0.4",
      computeComponents({ modality: "bus", rep: { confidence: "knew", correct: false } }, { cfg, markets: {}, seen: new Set(), hab: new Map(), now: 0 }).err === 1 &&
      computeComponents({ modality: "bus", rep: { confidence: "shaky", correct: false } }, { cfg, markets: {}, seen: new Set(), hab: new Map(), now: 0 }).err === 0.4);
  }

  // wake cap + deep-answer fold (consumed-on-success)
  {
    const capCfg = { ...cfg, wake_cap_per_day: 1, refractory_min: 0 };
    const { n, wr, tick } = rig({ cfg: capCfg });
    await n.ingest({ modality: "voice", text: "i don't get tokenization", concept_tokens: ["tokenization"] }); await n.flush();
    tick(60000);
    await n.ingest({ modality: "voice", text: "i don't get embeddings", concept_tokens: ["embeddings"] });
    const r2 = await n.flush();
    assert("hard daily wake_cap: the second wake is capped to the free lane", wr.wakes.length === 1 && r2[0].outcome === "capped");
    const mid = wr.wakes[0].moment_id;
    const fold = n.foldDeepAnswer({ moment_id: mid, text: "the deep read", provenance: "opus" });
    const wsp = wr.workspaces[wr.workspaces.length - 1];
    assert("deep answer folds THROUGH the thalamus into workspace.deep", fold.ok && wsp.deep && wsp.deep.text === "the deep read" && wsp.deep.moment_id === mid);
    const lastWake = wr.wakes[wr.wakes.length - 1];
    assert("wake.json is CONSUMED-on-success (like brain_queue.triggers)", lastWake.consumed && lastWake.consumed.moment_id === mid && lastWake.consumed.status === "served");
    // REGRESSION (E2E audit 25 Jul 2026): the served answer must SURVIVE the next
    // ordinary broadcast. The workspace rebuild omitted deep_recent, so a single
    // following moment erased the answers he paid Opus for, before the page showed them.
    assert("a served deep answer enters deep_recent", Array.isArray(wsp.deep_recent) && wsp.deep_recent.some(d => d.moment_id === mid));
    tick(60000);
    await n.ingest({ modality: "voice", text: "ok now something completely unrelated", concept_tokens: ["other"] });
    await n.flush();
    const after = wr.workspaces[wr.workspaces.length - 1];
    assert("DEEP ANSWERS SURVIVE the next broadcast (the lost-answer scar stays shut)", Array.isArray(after.deep_recent) && after.deep_recent.some(d => d.moment_id === mid));
  }

  // M14 — THE OVERLAP: wakes QUEUE (the clobber scar is dead) + ledger-true cap
  {
    const capCfg = { ...cfg, refractory_min: 0 };
    const { n, wr, tick } = rig({ cfg: capCfg });
    await n.ingest({ modality: "voice", text: "i don't get tokenization", concept_tokens: ["tokenization"] }); await n.flush();
    tick(60000);
    await n.ingest({ modality: "voice", text: "i don't get embeddings", concept_tokens: ["embeddings"] }); await n.flush();
    const open = pendingWakes(wr.queue);
    assert("TWO tier-2 moments → BOTH pending in the queue (the clobber is DEAD)", open.length === 2 && open[0].moment_id !== open[1].moment_id);
    assert("wake.json stays as the latest-wake MIRROR (pre-queue readers live)", wr.wakes.length === 2 && wr.wakes[1].moment_id === open[1].moment_id);
    const fold = n.foldDeepAnswer({ moment_id: open[0].moment_id, text: "deep read one", provenance: "opus" });
    const openAfter = pendingWakes(wr.queue);
    assert("a served resolution CLOSES only its own wake (event-sourced)", fold.ok && openAfter.length === 1 && openAfter[0].moment_id === open[1].moment_id);
    assert("wake cap derives from the REAL window (800k → hard ceiling 15 binds)", wakeCapToday(cfg, 800000) === 15);
    assert("a draining window SHRINKS the cap (120k → 3 wakes)", wakeCapToday(cfg, 120000) === 3);
    assert("an empty window floors at wake_cap_min (the sharpest surprise keeps a lane)", wakeCapToday(cfg, 0) === cfg.wake_cap_min);
    const { n: nCap, wr: wrCap, tick: tickCap } = rig({ cfg: capCfg, allowedTokens: 80000 });   // derived cap = 2
    await nCap.ingest({ modality: "voice", text: "i don't get tokenization", concept_tokens: ["tokenization"] }); await nCap.flush();
    tickCap(60000);
    await nCap.ingest({ modality: "voice", text: "i don't get embeddings", concept_tokens: ["embeddings"] }); await nCap.flush();
    tickCap(60000);
    await nCap.ingest({ modality: "voice", text: "i don't get attention", concept_tokens: ["attention"] });
    const r3 = await nCap.flush();
    assert("the LIVE cap gates the third wake on an 80k window (2 allowed, 3rd capped)", wrCap.queue.filter(q => q.status === "pending").length === 2 && r3[0].outcome === "capped");
  }

  // M7 — PREDICTIVE PRESENCE: stall × precache = a zero-latency whisper LOADED (never spoken here)
  {
    const pc = { entries: [{ concept: "attention scaling", stall_signature: "quadratic attention kv cache confusion", reframe: "kv cache kills recompute, not the n² handshakes — separate the two costs", drill: "hand-count attention ops for n=4" }] };
    const { n, wr } = rig({ precache: pc });
    await n.ingest({ modality: "bus", source: "presence", event_key: "stall:leading-edge", stall: true, text: "tab-thrash forming: 38 switches", concept_tokens: ["attention", "scaling"] });
    await n.flush();
    const wsp = wr.workspaces[wr.workspaces.length - 1];
    assert("a stall moment pulls the Rest Room's draft into the workspace, instantly", wsp.whisper && wsp.whisper.type === "wall_breaker" && wsp.whisper.reframe.includes("kv cache"));
    assert("the whisper expires (the stuck→gone window is 3 minutes)", new Date(wsp.whisper.expires) - new Date(wsp.updated_at) === 180000);
    const { n: n2, wr: wr2 } = rig({ precache: { entries: [{ concept: "unrelated topic", stall_signature: "nothing shared here", reframe: "x", drill: "y" }] } });
    await n2.ingest({ modality: "bus", source: "presence", event_key: "stall:leading-edge", stall: true, text: "thrash", concept_tokens: ["attention"] });
    await n2.flush();
    assert("no precache match → NO whisper (never improvise an intervention)", wr2.workspaces[wr2.workspaces.length - 1].whisper === null);
    const { n: n3, wr: wr3 } = rig({ precache: pc });
    await n3.ingest({ modality: "voice", text: "normal chat about attention", concept_tokens: ["attention"] });
    await n3.flush();
    assert("a NON-stall moment never touches the precache (whispers are for the gap)", wr3.workspaces[wr3.workspaces.length - 1].whisper === null);
  }

  // M5 — neuromodulation: a conserve tone raises the wake bar whole-brain
  // (hermetic tau: the LIVE gate is captain-tunable — 17 Jul handbrake-off
  // dropped it to 0.40 — so this test pins its own bar instead of riding it)
  {
    const cfgM5 = { ...cfg, tiers: { ...cfg.tiers, tau1_base: 0.58, epsilon: 0.08 } };
    const { n, wr } = rig({ toneBump: 0.10, cfg: cfgM5 });   // conserve: τ1 0.52 → 0.62
    await n.ingest({ modality: "voice", text: "i don't get attention", concept_tokens: ["attention"] });
    const rT = await n.flush();
    assert("NEUROMODULATION: conserve tone (+0.10) demotes a borderline wake", rT[0].tier < 2 && wr.wakes.length === 0);
    const { n: nO, wr: wrO } = rig({ toneBump: 0, cfg: cfgM5 });
    await nO.ingest({ modality: "voice", text: "i don't get attention", concept_tokens: ["attention"] });
    const rO = await nO.flush();
    assert("the SAME moment wakes opus at nominal tone (the knob is real)", rO[0].tier === 2 && wrO.wakes.length === 1);
  }

  // M8 — THE LIVING DOSSIER: counts only, only-lower, day-scoped
  {
    const { n, wr, tick } = rig({ precache: null });
    await n.ingest({ modality: "bus", source: "reps", event_key: "rep:attention", concept_tokens: ["attention"], rep: { confidence: "knew", correct: false } }); await n.flush();
    tick(60000);
    await n.ingest({ modality: "bus", source: "reps", event_key: "rep:attention", concept_tokens: ["attention"], rep: { confidence: "knew", correct: true } }); await n.flush();
    assert("DOSSIER: errs and wins tracked per concept, intra-day", wr.dossier.concepts.attention.errs === 1 && wr.dossier.concepts.attention.wins === 1);
    for (let i = 0; i < 3; i++) { tick(60000); await n.ingest({ modality: "bus", source: "presence", event_key: "stall:leading-edge", concept_tokens: ["attention"] }); await n.flush(); }
    assert("DOSSIER: 3 stalls → capacity nudge, and it can ONLY say 'lower'", wr.dossier.stalls_today === 3 && wr.dossier.capacity_nudge === "lower");
    assert("DOSSIER: built from counts alone — no affect field can exist in it", !JSON.stringify(wr.dossier).match(/prosody|emotion|mood|stress/i));
    // E2E audit 25 Jul 2026: this check could not fail — its second disjunct
    // (`typeof date === "string"`) is true of every run, and the first was in fact
    // FALSE under the rig's epoch clock, which is why the escape hatch was there.
    // So the claimed behaviour (a new day RESETS the posterior) was never tested.
    // Tick the virtual clock across midnight and assert the rollover for real.
    const day1 = wr.dossier.date;
    tick(24 * 3600000);
    await n.ingest({ modality: "bus", source: "reps", event_key: "rep:attention", concept_tokens: ["attention"], rep: { confidence: "knew", correct: true } });
    await n.flush();
    assert("DOSSIER: a new day RESETS the posterior (date rolls, stalls_today back to 0, concepts fresh)",
      typeof day1 === "string" && wr.dossier.date !== day1 && wr.dossier.stalls_today === 0 && wr.dossier.capacity_nudge === null && wr.dossier.concepts.attention.stalls === 0 && wr.dossier.concepts.attention.wins === 1);
  }

  // M8-FIX (1 Aug 2026) — THE DOSSIER TAKES ONLY CANON. presence's stall hint is
  // window-TITLE words ("a hint of what he was in"), and on 31 Jul it grew him a
  // posterior with rows named google / chrome / labelbox — the scrimmage test-set
  // learning the browser he stalled in. The hint must keep flowing everywhere;
  // only this one write is filtered.
  {
    const { n, wr, tick } = rig();
    await n.ingest({ modality: "bus", source: "presence", event_key: "stall:leading-edge", stall: true, text: "tab-thrash forming: 38 switches in 12min", concept_tokens: ["google", "chrome", "labelbox"] });
    await n.flush();
    assert("DOSSIER CANON: browser-title words never become concepts", Object.keys(wr.dossier.concepts).length === 0);
    assert("DOSSIER CANON: a stall is still a stall — stalls_today counts an episode with unregistered hints", wr.dossier.stalls_today === 1);
    assert("THE HINT STILL FLOWS: the afferent log and the workspace broadcast carry the raw tokens verbatim",
      wr.afferents[0].concept_tokens.join(",") === "google,chrome,labelbox"
      && wr.workspaces[wr.workspaces.length - 1].moment.spotlight.concept_tokens.includes("chrome"));
    assert("THE HINT STILL SCORES: an unregistered token still lights NOV (only the dossier is filtered)", wr.ledger[0].comps.nov === 1);
    tick(60000);
    await n.ingest({ modality: "bus", source: "reps", event_key: "rep:attention", concept_tokens: ["attention"], rep: { confidence: "knew", correct: false } });
    await n.flush();
    assert("DOSSIER CANON: a REGISTERED concept still lands, counts intact", wr.dossier.concepts.attention && wr.dossier.concepts.attention.errs === 1);
    tick(60000);
    await n.ingest({ modality: "bus", source: "reps", event_key: "rep:bpe", concept_tokens: ["BPE"], rep: { confidence: "knew", correct: true } });
    await n.flush();
    assert("DOSSIER CANON: an ALIAS folds to its canonical id (capture's own matcher, no second dialect)",
      wr.dossier.concepts.tokenization && wr.dossier.concepts.tokenization.wins === 1 && !wr.dossier.concepts.bpe);
    tick(60000);
    await n.ingest({ modality: "voice", text: "fastapi ka dependency injection samajh nahi aaya", concept_tokens: ["fastapi"] });
    await n.flush();
    assert("DOSSIER CANON: a registered SKILL id is real ground too (both vocabularies count)", !!wr.dossier.concepts.fastapi);
    // registry missing / held / malformed → the PRE-FIX behaviour, verbatim
    const { n: nR, wr: wrR } = rig({ registry: EMPTY_REGISTRY });
    await nR.ingest({ modality: "bus", source: "presence", event_key: "stall:leading-edge", concept_tokens: ["google", "chrome"] });
    await nR.flush();
    assert("NO REGISTRY → the OLD behaviour verbatim (write everything; a dry registry never blocks a write)",
      !!wrR.dossier.concepts.chrome && !!wrR.dossier.concepts.google && wrR.dossier.stalls_today === 1);
    assert("dossierKey: alias→id · ambient word→null · no registry→pass-through",
      dossierKey("BPE", testReg) === "tokenization" && dossierKey("chrome", testReg) === null && dossierKey("Chrome", EMPTY_REGISTRY) === "chrome");
  }

  // M17 — THE PRE-ANSWER ENGINE serve side: doubt × cache = zero-latency attach
  {
    const cache = [
      { id: "pa1", concept: "kv cache", doubt: "kv cache hai toh attention quadratic kyun", answer: "the cache kills recompute, not the handshakes", vec: [1, 0] },
      { id: "pa2", concept: "unrelated", doubt: "something else entirely different", answer: "x", vec: [0, 1] },
    ];
    const { n, wr } = rig({ answerCache: cache, embedVec: [0.98, 0.05] });
    await n.ingest({ modality: "voice", text: "i don't get kv cache attention quadratic", concept_tokens: ["attention"] });
    await n.flush();
    const wsp = wr.workspaces[wr.workspaces.length - 1];
    assert("a voiced doubt pulls the night's pre-answer into the workspace (cosine)", wsp.pre_answer && wsp.pre_answer.matched_via === "cosine" && wsp.pre_answer.answer.includes("recompute"));
    assert("the pre-answer expires (the confusion-hot window is 3 minutes)", new Date(wsp.pre_answer.expires) - new Date(wsp.updated_at) === 180000);
    const { n: n2, wr: wr2 } = rig({ answerCache: cache, embedVec: null });
    await n2.ingest({ modality: "voice", text: "i don't get why the kv cache leaves attention quadratic", concept_tokens: ["attention"] });
    await n2.flush();
    const wsp2 = wr2.workspaces[wr2.workspaces.length - 1];
    assert("embed lane dry → the free word-overlap floor still attaches", wsp2.pre_answer && wsp2.pre_answer.matched_via === "overlap");
    const { n: n3, wr: wr3 } = rig({ answerCache: cache, embedVec: [1, 0] });
    await n3.ingest({ modality: "bus", event_key: "dead:due", due_count: 2 });
    await n3.flush();
    assert("a NON-doubt moment never queries the cache (pre-answers are for doubts)", (wr3.embedCalls || 0) === 0 && wr3.workspaces[wr3.workspaces.length - 1].pre_answer === null);
    const { n: n4, wr: wr4 } = rig({ answerCache: [{ id: "z", concept: "zzz", doubt: "totally unrelated matter", answer: "x", vec: [0, 1] }], embedVec: [1, 0] });
    await n4.ingest({ modality: "voice", text: "i don't get positional encodings at all", concept_tokens: ["positional"] });
    await n4.flush();
    assert("no cache match → NO pre-answer (never improvise an answer)", wr4.workspaces[wr4.workspaces.length - 1].pre_answer === null);
    // #9 (ORGANISM REPAIR 4 Aug 2026) — THE CARRY-FORWARD PATH, previously
    // UNTESTED. Live workspace.json (v5,274) still advertised a pre_answer whose
    // 3-minute window closed on 30 Jul, re-serialized into every broadcast
    // since. Seed exactly that shape and prove the next moment drops it.
    const { n: n5, wr: wr5 } = rig({ answerCache: [] });
    n5.state.workspace = {
      version: 5274, moment: null, deep: null,
      pre_answer: { type: "pre_answer", concept: "temperature", answer: "two days dead", ts: "1970-01-01T00:00:00.000Z", expires: "1970-01-01T00:03:00.000Z" },
      whisper: { type: "wall_breaker", concept: "stale", expires: "1970-01-01T00:03:00.000Z" },
      bg_hint: { type: "second_spotlight", concept: "stale", expires: "1970-01-01T00:03:00.000Z" },
      mouth_hint: { hint: "soften", expires: "1970-01-01T00:02:00.000Z" },
    };
    await n5.ingest({ modality: "bus", event_key: "anything", concept_tokens: ["zzz"] });
    await n5.flush();
    const stale = wr5.workspaces[wr5.workspaces.length - 1];
    assert("#9 EXPIRY AT THE SOURCE: a dead pre-answer/whisper/bg-hint/mouth-hint is DROPPED, not rebroadcast forever",
      stale.pre_answer === null && stale.whisper === null && stale.bg_hint === null && stale.mouth_hint === null);
    assert("#9: the drop is LOGGED (a silent clean-up would be the same lie in the other direction)",
      wr5.logs.filter(l => /dropped an EXPIRED/.test(l)).length === 4);
    // and a LIVE payload must still survive — expiry clears, it does not wipe
    const { n: n6, wr: wr6 } = rig({ answerCache: [] });
    // the rig's virtual clock starts at t = 1,000,000 — this window is still open
    n6.state.workspace = { version: 1, moment: null, deep: null, pre_answer: { type: "pre_answer", concept: "live", expires: new Date(1000000 + 180000).toISOString() } };
    await n6.ingest({ modality: "bus", event_key: "anything2", concept_tokens: ["yyy"] });
    await n6.flush();
    assert("#9: a payload still INSIDE its window is carried forward untouched", wr6.workspaces[wr6.workspaces.length - 1].pre_answer.concept === "live");
  }

  // M22 — THE SECOND SPOTLIGHT: suppress the WAKE, never the THOUGHT
  {
    const capCfg = { ...cfg, refractory_min: 0 };
    const { n, wr, tick } = rig({ cfg: capCfg, allowedTokens: 80000 });   // live cap = 2
    for (const c of ["tokenization", "embeddings", "attention"]) {
      await n.ingest({ modality: "voice", text: `i don't get ${c}`, concept_tokens: [c] });
      await n.flush(); tick(60000);
    }
    const queued = wr.bgQueue.filter(b => b.status === "queued");
    assert("a CAPPED moment queues its thought (never lost)", queued.length === 1 && queued[0].reason === "capped" && queued[0].spotlight.text.includes("attention"));
    // refractory also queues (a live market keeps S high on the repeat)
    const { n: n2, wr: wr2, tick: t2 } = rig({ markets: { m1: 0.9 } });
    const hot = { modality: "voice", text: "i don't get attention scaling", market_id: "m1", observed: false, event_key: "doubt:attention" };
    await n2.ingest({ ...hot }); await n2.flush();
    t2(5 * 60000);
    await n2.ingest({ ...hot }); await n2.flush();
    assert("a REFRACTORY moment queues its thought too", wr2.bgQueue.some(b => b.status === "queued" && b.reason === "refractory"));
    // the drain folds in THROUGH the nucleus; the shelf is capped
    const fold = n.foldBgDrained({ moment_id: queued[0].moment_id, concept: "attention", insight: "the n-squared cost is the meetings, not the recompute", tokens: ["attention"] });
    assert("a drained thought folds into workspace.bg (single-writer intact)", fold.ok && wr.workspaces[wr.workspaces.length - 1].bg.length === 1);
    assert("the drain is LEDGERED (queued → drained rows)", wr.bgQueue.some(b => b.status === "drained" && b.moment_id === queued[0].moment_id));
    // the recall-match: touching that ground returns the thought, consumed
    tick(60000);
    await n.ingest({ modality: "voice", text: "attention waali baat phir se", concept_tokens: ["attention"] });
    await n.flush();
    const wsp = wr.workspaces[wr.workspaces.length - 1];
    assert("the RECALL-MATCH returns the thought at zero switching cost", wsp.bg_hint && wsp.bg_hint.type === "second_spotlight" && wsp.bg_hint.insight.includes("meetings"));
    assert("a returned thought is CONSUMED (speaks its piece once)", wsp.bg.length === 0 && wr.bgQueue.some(b => b.status === "returned"));
    // no match → nothing returns
    const { n: n3, wr: wr3 } = rig();
    n3.state.workspace.bg = [{ moment_id: "m_x", concept: "quantization", insight: "unrelated", tokens: ["quantization"] }];
    await n3.ingest({ modality: "voice", text: "completely different cricket chat today", concept_tokens: [] });
    await n3.flush();
    assert("no recall-match → the thought stays on the shelf", wr3.workspaces[wr3.workspaces.length - 1].bg.length === 1 && !wr3.workspaces[wr3.workspaces.length - 1].bg_hint);
    // pendingBg reducer
    const open = pendingBg([{ moment_id: "a", status: "queued" }, { moment_id: "b", status: "queued" }, { moment_id: "a", status: "drained" }]);
    assert("pendingBg: drained rows close their entry, others stay open", open.length === 1 && open[0].moment_id === "b");
  }

  // SCAN-FIX 15 Jul — THE GATE HEARS HINGLISH (both scripts, no shibboleth)
  {
    const { n } = rig();
    const deva = await n.ingest({ modality: "voice", text: "यार ये समझ नहीं आ रहा कि अटेंशन क्यों नहीं लीनियर होता", concept_tokens: ["attention-linear"] });
    assert("a Devanagari doubt fires SELF (the gate is no longer script-blind)", deva.S >= 0.6);
    const hinglish = await n.ingest({ modality: "voice", text: "kv cache ka matlab kya hota hai actually", concept_tokens: ["kv-fresh"] });
    assert("a Latin-Hinglish doubt fires SELF too (matlab kya)", hinglish.S >= 0.6);
    const plain = await n.ingest({ modality: "voice", text: "chalo aaj ka session shuru karte hain", concept_tokens: [] });
    assert("plain chat still scores low (markers, not paranoia)", plain.S < 0.3);
    // unicode matchers: a Devanagari turn reaches a cached pre-answer via overlap
    const cache = [{ id: "pa", concept: "अटेंशन क्वाड्रेटिक", doubt: "अटेंशन क्वाड्रेटिक क्यों रहता है कैश के बाद भी", answer: "the meetings stay", vec: null }];
    const hit = matchPreAnswer({ concept_tokens: [], text: "अटेंशन क्वाड्रेटिक क्यों है अभी भी कैश के साथ" }, cache, null, { pre_answer: { threshold: 0.66, min_overlap: 3 } });
    assert("the overlap floor works in Devanagari (unicode tokens)", hit && hit.via === "overlap");
    const bgHit = matchBg({ concept_tokens: [], text: "टोकनाइज़ेशन सबवर्ड वाला डाउट फिर से" }, [{ moment_id: "b1", concept: "टोकनाइज़ेशन सबवर्ड", insight: "सबवर्ड split का सवाल", tokens: [] }]);
    assert("the bg recall-match works in Devanagari too", bgHit && bgHit.moment_id === "b1");
    assert("the tightened floor rejects thin overlap (2 shared words < 3)", matchPreAnswer({ concept_tokens: [], text: "kv cache discussion generally" }, [{ id: "x", concept: "kv cache", doubt: "unrelated thing entirely", answer: "x", vec: null }], null, { pre_answer: { threshold: 0.66, min_overlap: 3 } }) === null);
  }

  // E2E AUDIT 25 Jul 2026 — the flush lane: serialized, gated free-first, and the
  // wake slot claimed before the await it used to be raced across
  {
    const t1v = tau1Effective(cfg, 1);                                   // the pinned bar, headroom full
    // (a) RE-ENTRANCY: flush A parks on the ~15s adjudicator; a newer moment
    // flushes meanwhile. The parked one used to resume and stamp its OLDER moment
    // over the live spotlight at a HIGHER version — the page froze on stale ground.
    const bandCfg = { ...cfg, weights: { ...cfg.weights, self: t1v - 0.02 } };   // lands inside ε, so A must adjudicate
    const { n, wr } = rig({ cfg: bandCfg, adjVerdict: false, adjDelayMs: 30 });
    await n.ingest({ modality: "voice", text: "i don't get x", concept_tokens: [] });
    const pA = n.flush();
    await new Promise(r => setImmediate(r));                             // let A splice the buffer and park on the adjudicator
    await n.ingest({ modality: "bus", event_key: "later", concept_tokens: ["later"] });
    const pB = n.flush();
    await Promise.all([pA, pB]);
    const last = wr.workspaces[wr.workspaces.length - 1].moment;
    assert("FLUSH SERIALIZED: a parked older moment can no longer overwrite the newer broadcast", last.spotlight.event_key === "later" && wr.workspaces.length === 2);
    // (b) ε-BAND ECONOMY: the free gates run BEFORE the paid call. Cap = 0 here,
    // so the verdict was always going to be thrown away — it must never be bought.
    const cappedCfg = { ...cfg, wake_cap_per_day: 0, weights: { ...cfg.weights, self: t1v - 0.02 } };
    const { n: nE, wr: wrE } = rig({ cfg: cappedCfg, adjVerdict: true });
    await nE.ingest({ modality: "voice", text: "i don't get x", concept_tokens: [] });
    const rE = await nE.flush();
    assert("ε-BAND ECONOMY: an already-capped near-miss never pays the adjudicator", wrE.adjCalls === 0 && rE[0].tier === 1 && rE[0].outcome === "enrich");
    // (c) the wake slot is reserved AT THE GATE — the embed await below it was the
    // window two interleaved flushes both walked through on the same counter.
    const { n: nR, wr: wrR } = rig({ answerCache: [{ id: "z", concept: "attention", doubt: "attention kya hai", answer: "x", vec: [1, 0] }], embedVec: [1, 0] });
    await nR.ingest({ modality: "voice", text: "i don't get attention", concept_tokens: ["attention"] });
    await nR.flush();
    assert("WAKE SLOT RESERVED at the gate, not on the far side of the ≤4s embed await", wrR.embedCalls === 1 && wrR.wakesAtEmbed === 1 && wrR.wakes.length === 1);
    // (c2) GROUP ISOLATION: the buffer is spliced before anything is scored, so a
    // single throwing write (Drive-sync/AV/editor holding workspace.json → EPERM)
    // used to take every remaining bound moment of the window with it, silently.
    const { n: nT, wr: wrT } = rig({ failWorkspaceFor: "boom" });
    await nT.ingest({ modality: "bus", event_key: "boom", gov_from: "AMBER", gov_to: "RED" });        // higher S → spotlight of group 1
    await nT.ingest({ modality: "bus", event_key: "survivor", gov_from: "GREEN", gov_to: "AMBER" });  // its own group
    const rT = await nT.flush();
    assert("GROUP ISOLATION: one failed write costs ONE moment — its siblings still land, and the loss is LOGGED",
      rT.length === 1 && wrT.ledger.length === 1 && wrT.ledger[0].key === "bus:survivor" && wrT.logs.some(l => /LOST mid-flush/.test(l)));
    // (d) rep timestamps are compared in ONE zone — the 00:00-05:30 IST blind spot
    const midnightLocal = new Date(2026, 6, 12, 0, 30, 0);               // 00:30 LOCAL on 12 Jul
    const lateLocal = new Date(2026, 6, 12, 23, 30, 0);                  // 23:30 LOCAL on 12 Jul
    assert("REP DAY: a UTC-Z rep timestamp is dated in LOCAL time (session_happened stops re-firing at night)",
      repLocalDay(midnightLocal.toISOString()) === "2026-07-12" && repLocalDay(lateLocal.toISOString()) === "2026-07-12" && repLocalDay("junk") === "junk" && repLocalDay(undefined) === "");
  }

  // habituation decays — after a long silence the same signal can fire again
  {
    const { n, tick } = rig();
    const e1 = await n.ingest({ modality: "bus", event_key: "gov:GREEN->AMBER", gov_from: "GREEN", gov_to: "AMBER" }); await n.flush();
    const e2 = await n.ingest({ modality: "bus", event_key: "gov:GREEN->AMBER", gov_from: "GREEN", gov_to: "AMBER" }); await n.flush();
    tick(cfg.hab.tau_ms * 12);
    const e3 = await n.ingest({ modality: "bus", event_key: "gov:GREEN->AMBER", gov_from: "GREEN", gov_to: "AMBER" });
    assert("HAB: a flapping signal decays; a long-quiet signal recovers", e2.S < e1.S && e3.S > e2.S);
  }

  // =========================================================================
  // ORGANISM REPAIR 4 Aug 2026 — #1 THE NUCLEUS HEARS HIM (provenance, not modality)
  // The central claim, asserted directly: an afferent shaped EXACTLY like a real
  // row off his Claude Code stream must clear tau0. Live shape, measured — every
  // one of the 502 `claude-code` afferents has exactly these five keys:
  //   {modality, source, text, cwd, ts}
  // and the whole stream scored 0.000 across 3,099 bound moments.
  // =========================================================================
  {
    const typed = { modality: "code", source: "claude-code", text: "i am confused, after every agents work will be completed then where are we standing?? clear the picture for me", cwd: "arsenal-ai-fc", ts: "2026-07-31T11:40:00.000Z" };
    const { n, wr } = rig({ adjVerdict: false });         // the adjudicator would say NO — this must not need it
    const r = await n.ingest({ ...typed });
    const rr = await n.flush();
    assert("#1 THE CLAIM: a real-shaped typed doubt from Claude Code now scores ABOVE tau0 (it scored 0.000 for 3,099 moments)",
      r.S > cfg.tiers.tau0 && wr.ledger[0].comps.self === 1);
    assert("#1: and it clears the wake bar outright — self 0.45 + a fresh concept 0.20 = 0.65 ≥ τ1 0.40, no coin-flip",
      Math.abs(r.S - 0.65) < 1e-9 && rr[0].tier === 2 && wr.adjCalls === 0);
    assert("#1 (second cut): the code afferent DERIVES concept tokens now — without them nov=0 and even self=1 stalls at 0.45",
      Array.isArray(wr.afferents[0].concept_tokens) && wr.afferents[0].concept_tokens.length > 0 && wr.ledger[0].comps.nov === 1);
    // THE DENY LIST — the Stop hook is the organism answering itself.
    const { n: nT, wr: wrT } = rig();
    const teach = await nT.ingest({ modality: "code", source: "claude-code-teaching", text: "here is why your confusion about attention is normal — i don't get why people find it hard", cwd: "arsenal-ai-fc" });
    await nT.flush();
    assert("#1 DENY: `claude-code-teaching` (the machine's OWN answers) never fires SELF and never derives tokens",
      teach.S === 0 && wrT.ledger[0].comps.self === 0 && !wrT.afferents[0].concept_tokens);
    // his MCP notes route as modality desktop-study / source organism-memory —
    // measured: all 6 such moments scored S = 0.000
    const { n: nM } = rig();
    const note = await nM.ingest({ modality: "desktop-study", source: "organism-memory", text: "[doubt] grounding kaise kaam karta hai mujhe samajh nahi aaya" });
    assert("#1: an organism-memory note (modality desktop-study) is HIS voice too — it scores", note.S > cfg.tiers.tau0);
    // NOT WIDENED, on purpose (THE TRAPS): "bhai i am not understanding …" — one
    // of the four doubts the audit quotes — is caught only because the same
    // message happens to contain "confusion" later on. `not understanding` is
    // genuinely absent from self_markers. The captain's standing instruction is
    // that the channel was dead, not the filter; the filter is re-measurable now
    // that the channel is open, and widening it before that measurement exists
    // would be exactly the guess the standing order forbids.
    assert("#1: the marker list is UNCHANGED — a real gap (`not understanding`) is recorded, not silently patched",
      cfg.self_markers.length === liveCfg.self_markers.length && !cfg.self_markers.includes("not understanding")
      && computeComponents({ modality: "code", source: "claude-code", text: "bhai i am not understanding what are you following" }, { cfg, markets: {}, seen: new Set(), hab: new Map(), now: 0 }).self === 0);
    // an unnamed stream stays out: provenance must be positively claimed
    const { n: nU } = rig();
    const unk = await nU.ingest({ modality: "code", source: "some-future-integration", text: "i don't get this at all" });
    assert("#1: an UNLISTED provenance still scores 0 — the gate is an allow-list, not a guess", unk.S === 0);
    assert("#1: provenanceOf — source wins, a bare voice row is its own provenance, everything else must name itself",
      provenanceOf({ modality: "code", source: "claude-code" }) === "claude-code" && provenanceOf({ modality: "voice", text: "x" }) === "voice" && provenanceOf({ modality: "context" }) === "");
    // THE LAYERING LAW: the old gate is frozen, not deleted, and still says what it always said
    assert("#1 LAYERING: selfLegacy (the frozen voice-only gate) is preserved verbatim and disagrees exactly where it always did",
      selfLegacy({ modality: "voice", text: "i don't get attention" }, cfg) === 1 && selfLegacy(typed, cfg) === 0 && isHisVoice(typed, cfg) === true);
  }

  // ORGANISM REPAIR — #2 THE PULSE CAN REACH THE LADDER (measured base rate)
  {
    assert("#2 base-rate lookup: exact key wins · `prefix:*` matches · longest prefix wins · default is the last resort",
      baseRateFor("pulse:need", { default: 0.5, "pulse:*": 0.148695 }) === 0.148695
      && baseRateFor("pulse:need", { default: 0.5, "pulse:need": 0.9, "pulse:*": 0.148695 }) === 0.9
      && baseRateFor("pulse:escalate", { default: 0.5, "p*": 0.3, "pulse:*": 0.148695 }) === 0.148695
      && baseRateFor("gov:GREEN->AMBER", { default: 0.5, "pulse:*": 0.148695 }) === 0.5);
    // the pinned bar carries the same MEASURED rate the live config does:
    // brain_ledger.jsonl → 881 haiku_pulse rows, 131 escalated → p = 0.148695
    const pulseCfg = { ...cfg, pe: { ...cfg.pe, base_rates: { ...cfg.pe.base_rates, "pulse:*": 0.148695 } } };
    // the live shape, measured across all 131 pulse afferents
    const pulseEvt = { modality: "pulse", source: "haiku-pulse", text: "pulse flagged (reasoning-hard): Core architectural question about teaching depth", concept_tokens: ["moments", "combined", "trust", "break"], event_key: "pulse:moments" };
    const { n: nOld } = rig({ cfg });                      // no pulse entry → the 0.5 coin-flip default
    const rOld = await nOld.ingest({ ...pulseEvt });
    assert("#2 THE WALL, reproduced: on the 0.5 default the pulse ceiling is 0.24375 — BELOW tau0 0.25, by 0.006",
      Math.abs(rOld.S - 0.24375) < 1e-9 && rOld.S < cfg.tiers.tau0);
    const { n: nNew, wr: wrNew } = rig({ cfg: pulseCfg });
    const rNew = await nNew.ingest({ ...pulseEvt });
    const rp = await nNew.flush();
    assert("#2(a) THE WALL IS DOWN: the measured base rate lifts the same pulse to 0.32029 — above tau0, into the enrichment lane",
      Math.abs(rNew.S - 0.32029) < 1e-4 && rNew.S > cfg.tiers.tau0 && rp[0].tier >= 1);
    assert("#2 THE TRAP STAYS SHUT: the pulse does NOT wake Opus by itself — it lands in the ε-band and the fail-closed adjudicator decides",
      rNew.S < cfg.tiers.tau1_base && wrNew.adjCalls === 1 && rp[0].outcome === "adjudicated_down" && wrNew.wakes.length === 0);
    assert("#2 and it stays well below what HIS OWN doubt is worth (0.320 vs 0.650) — the sentinel never outranks him",
      rNew.S < 0.45);
    assert("#2(c): weights.pulse is a real, named, LEDGERED component pinned at 0.00 — instrumentation, not a live term",
      cfg.weights.pulse === 0 && wrNew.ledger[0].comps.pulse === 1 && salience({ pe: 0, nov: 0, gov: 0, err: 0, self: 0, dead: 0, hab: 0, pulse: 1 }, cfg.weights) === 0);
    assert("#2(c): salience() survives a hand-built weight object with no pulse key (never NaN)",
      salience({ pe: 0, nov: 1, gov: 0, err: 0, self: 0, dead: 0, hab: 0, pulse: 1 }, { pe: 0.35, nov: 0.2, gov: 0.25, err: 0.45, self: 0.45, dead: 0.15, hab: 0.4 }) === 0.2);
    // the LIVE table must carry a measured rate — the ceiling arithmetic above
    // is worthless if dressing-room/state/thalamus_config.json still leaves the
    // pulse standing on the coin-flip default. This checks the CONFIG, on purpose.
    assert("#2(a) LIVE CONFIG: the shipped base_rates table no longer leaves `pulse:*` on the 0.5 coin-flip",
      baseRateFor("pulse:moments", liveCfg.pe.base_rates) < 0.5 && baseRateFor("gov:x", liveCfg.pe.base_rates) === 0.5);
  }

  // ORGANISM REPAIR — #6 THE DMN PRECACHE GETS A JOIN KEY THAT CAN BIND
  {
    // the live shapes, both measured. presence.mjs sends window-title words:
    //   {"event_key":"stall:leading-edge","text":"tab-thrash forming: 55 switches in 9min",
    //    "concept_tokens":["notepad","claude","pulse","important"]}
    // dmn_precache.json holds {concept:"hallucinations", stall_signature:"..."}
    const pc = { entries: [{ concept: "hallucinations", stall_signature: "Walk me through the exact trace of a hallucination in prod", reframe: "grounding is a retrieval problem before it is a model problem", drill: "trace one output back to its source span" }] };
    const stall = { modality: "bus", source: "presence", event_key: "stall:leading-edge", stall: true, text: "tab-thrash forming: 55 switches in 9min", concept_tokens: ["notepad", "claude", "pulse", "important"] };
    const reg6 = bakeReg({ hallucinations: ["hallucination", "grounding"], attention: [] });
    // (a) the OLD behaviour, reproduced: raw window-title words vs concept names
    const { n: nA, wr: wrA } = rig({ precache: pc, registry: reg6, sprintConcept: null, cfg: { ...cfg, whisper: { legacy_raw: true, canon_join: false, sprint_fallback: false } } });
    await nA.ingest({ ...stall }); await nA.flush();
    assert("#6 THE MISS, reproduced: the legacy raw join matches 0 — browser chrome words against concept names",
      wrA.workspaces[wrA.workspaces.length - 1].whisper === null && wrA.ledger[0].engines.whisper === "miss");
    // (b) the repair: nothing in the stall is canon → fall back to the sprint's concept
    const { n: nB, wr: wrB } = rig({ precache: pc, registry: reg6, sprintConcept: "Hallucinations" });
    await nB.ingest({ ...stall }); await nB.flush();
    const wsB = wrB.workspaces[wrB.workspaces.length - 1];
    assert("#6 SPRINT FALLBACK: window-title words name nothing canonical → the sprint's CURRENT concept becomes the join key, and the whisper loads",
      wsB.whisper && wsB.whisper.concept === "hallucinations" && wsB.whisper.matched_via === "sprint" && wrB.ledger[0].engines.whisper === "hit");
    assert("#6: the assumption is SAID OUT LOUD — matched_via rides the payload and the log names the route",
      wrB.logs.some(l => /via sprint on "hallucinations"/.test(l)));
    // (c) when the stall DOES name canon ground, that wins — no fallback needed
    const { n: nC, wr: wrC } = rig({ precache: pc, registry: reg6, sprintConcept: "attention" });
    await nC.ingest({ ...stall, concept_tokens: ["chrome", "grounding", "notepad"] }); await nC.flush();
    const wsC = wrC.workspaces[wrC.workspaces.length - 1];
    assert("#6 CANON JOIN: an alias inside the stall's own hint (grounding→hallucinations) beats the fallback",
      wsC.whisper && wsC.whisper.matched_via === "canon" && wsC.whisper.concept === "hallucinations");
    // (d) the fallback is a JOIN KEY, not a licence to improvise
    const { n: nD, wr: wrD } = rig({ precache: { entries: [{ concept: "a real study session happens today", stall_signature: "what does the Twin verify", reframe: "x", drill: "y" }] }, registry: reg6, sprintConcept: "Hallucinations" });
    await nD.ingest({ ...stall }); await nD.flush();
    assert("#6: a precache entry that names no registered concept still matches NOTHING — the fallback opens a door, it does not force one",
      wrD.workspaces[wrD.workspaces.length - 1].whisper === null);
    // (e) the frozen lane still wins when presence's producer side is repaired
    const { n: nE, wr: wrE } = rig({ precache: { entries: [{ concept: "attention scaling", stall_signature: "quadratic attention kv cache", reframe: "r", drill: "d" }] }, registry: reg6, sprintConcept: "Hallucinations" });
    await nE.ingest({ ...stall, concept_tokens: ["attention", "scaling"] }); await nE.flush();
    assert("#6 LAYERING: the original raw matcher is still FIRST and still fires the day presence sends real concepts",
      wrE.workspaces[wrE.workspaces.length - 1].whisper.matched_via === "raw");
  }

  // ORGANISM REPAIR — #10 THE DIAGNOSTICS SURVIVE, AND THE FLAGS BECOME COUNTABLE
  {
    // A log answers "what happened at 14:02". It cannot answer "has the
    // pre-answer engine EVER fired?" — which was, in fact, unanswerable. The
    // tri-state on the ledger row is the answer, and it never renders an
    // unmeasured silence (an EMPTY corpus) as a measured zero (a miss).
    const { n: nS, wr: wrS } = rig({ answerCache: [] });
    await nS.ingest({ modality: "bus", event_key: "dead:due", due_count: 2 }); await nS.flush();
    assert("#10: a moment that never asked reports `skip` — not a zero", wrS.ledger[0].engines.pre_answer === "skip" && wrS.ledger[0].engines.whisper === "skip");
    const { n: nDry, wr: wrDry } = rig({ answerCache: [] });
    await nDry.ingest({ modality: "code", source: "claude-code", text: "i am confused about hallucination grounding" }); await nDry.flush();
    assert("#10 HONESTY: a doubt that reached an EMPTY answer_cache reports `dry`, never `miss` — an unmeasured silence is not a measured zero",
      wrDry.ledger[0].engines.pre_answer === "dry" && wrDry.logs.some(l => /dry corpus, not a miss/.test(l)));
    const { n: nMiss, wr: wrMiss } = rig({ answerCache: [{ id: "z", concept: "zzz", doubt: "totally unrelated matter", answer: "x", vec: null }] });
    await nMiss.ingest({ modality: "code", source: "claude-code", text: "i am confused about hallucination grounding" }); await nMiss.flush();
    assert("#10: a doubt against a STOCKED cache that genuinely does not match reports `miss` — a different fact, recorded as one",
      wrMiss.ledger[0].engines.pre_answer === "miss");
    assert("#10: the provenance rides the ledger row too — `who spoke` was invisible in 5,481 rows",
      wrMiss.ledger[0].provenance === "claude-code" && wrS.ledger[0].provenance === null);
    // the moment-loss alarm — the one diagnostic that exists nowhere else —
    // still fires (covered above) AND now has somewhere to land:
    assert("#10: the log file target is inside the repo and gitignored (*.log), so his words never reach the public remote",
      /thalamus\.log$/.test(LOGFILE) && LOGFILE.includes("scripts"));
    assert("#10: rotation is size-derived and disabling the log is a no-op, never a throw",
      DEFAULT_CONFIG.log.max_bytes === 1650000 && fileLog({ log: { enabled: false } }, "must not write") === undefined);
    // THE ONE NON-HERMETIC CHECK IN THIS FILE, and it is deliberate: #10's whole
    // claim is "the diagnostics now have somewhere to land", and a test that
    // never writes the file proves nothing about that. One append-only line into
    // a gitignored, size-rotated log the organ owns.
    // Proven on a PRIVATE target, not the live thalamus.log. Writing to the real one
    // raced the running daemon, whose cloak (`cmd /c ... >> scripts/thalamus.log`)
    // holds an exclusive handle — so this assertion went red whenever the organism
    // was actually HEALTHY, which is the worst possible polarity for a health check.
    const stamp = `selftest heartbeat ${Date.now()}`;
    const tgt = join(tmpdir(), `thalamus_selftest_${process.pid}.log`);
    try { if (existsSync(tgt)) rmSync(tgt); } catch { }
    const where = fileLog(loadConfig(), stamp, tgt);
    assert("#10 PROOF: a diagnostic written through fileLog actually LANDS on disk (this is the whole of #10)",
      where === "file" && existsSync(tgt) && readFileSync(tgt, "utf8").includes(stamp));
    // …and the new half: when the target IS held (the live-daemon case), the line must
    // still reach stdout — which under the cloak is that same file — never vanish.
    {
      const held = join(tmpdir(), "thalamus_selftest_dir_as_file");
      try { mkdirSync(held, { recursive: true }); } catch { }   // a directory: append always throws
      const chunks = [];
      const realWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = (c) => { chunks.push(String(c)); return true; };
      let fellBackTo;
      try { fellBackTo = fileLog(loadConfig(), stamp, held); } finally { process.stdout.write = realWrite; }
      assert("#10 a HELD log target falls back to stdout — the diagnostic is never silently dropped",
        fellBackTo === "stdout" && chunks.join("").includes(stamp));
      try { rmSync(held, { recursive: true, force: true }); } catch { }
    }
    try { rmSync(tgt, { force: true }); } catch { }
  }

  // ORGANISM REPAIR — #106 STATUS IS A HAVE/NEED COUNTER
  {
    const rows = [
      { day: "2026-08-04", tier: 0, S: 0, key: "code:x", comps: { self: 0, pulse: 0 }, engines: { whisper: "skip", pre_answer: "skip", bg: "skip" }, provenance: "claude-code" },
      { day: "2026-08-04", tier: 2, S: 0.65, key: "code:confused", comps: { self: 1, pulse: 0 }, engines: { whisper: "skip", pre_answer: "dry", bg: "skip" }, provenance: "claude-code" },
      { day: "2026-08-04", tier: 1, S: 0.32, key: "pulse:moments", comps: { self: 0, pulse: 1 }, engines: { whisper: "skip", pre_answer: "skip", bg: "skip" }, provenance: "haiku-pulse" },
    ];
    const out = buildStatus(rows, rows, { version: 12, deep: null, deep_recent: [] }, cfg);
    assert("#106: every line is have/need — tiers against the cap, self against the stream, engines against instrumented rows",
      /tier2 1\/15 \(wakes\/hard cap\)/.test(out) && /self channel\s+: 1\/3 moments/.test(out) && /1\/2 code moments now score above zero \(before the #1 repair: 0\/2\)/.test(out) && /pulse sentinel : 1\/1 escalations/.test(out));
    assert("#106 HONESTY: an empty deep lane says WHY it is empty instead of printing a dash",
      /never asked/.test(out) && !/deep=—/.test(out));
    assert("#106: rows written before the #10 repair are reported as UNMEASURED, never as zero",
      /UNMEASURED, not zero/.test(buildStatus([], [{ day: "d", tier: 0, S: 0, key: "code:x", comps: { self: 0 } }], {}, cfg)));
    assert("#106: statusReport() runs against the LIVE files without throwing", typeof statusReport() === "string" && statusReport().startsWith("thalamus:"));
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// #106 / #10 — STATUS IS A HAVE/NEED COUNTER, NEVER A WORD.
// The old line printed tier counts and `deep=—`, and a dash cannot distinguish
// "the deep lane has never been asked" from "it answered and the answer was
// consumed". Every line below now shows the numerator AND what would move it.
// Pure: takes rows, returns a string, so the selftest can drive it.
// ---------------------------------------------------------------------------
function buildStatus(rows, allRows, w, cfg) {
  const L = [];
  const byTier = rows.reduce((a, r) => { a[r.tier] = (a[r.tier] || 0) + 1; return a; }, {});
  const t2 = byTier[2] || 0;
  const capHard = cfg.wake_cap_per_day;
  L.push(`thalamus: workspace v${w.version || 0} · today ${rows.length} moment(s) — tier0 ${byTier[0] || 0}/${rows.length} · tier1 ${byTier[1] || 0}/${rows.length} · tier2 ${t2}/${capHard} (wakes/hard cap)`);
  // the deep lane — "—" used to mean three different things
  const deep = w.deep ? (w.deep.declined ? `declined (${w.deep.reason || "no reason recorded"})` : "served") : "never asked (0 answers have come back through :4113/deep-answer)";
  L.push(`  deep lane      : ${deep} · deep_recent ${(Array.isArray(w.deep_recent) ? w.deep_recent : []).length}/3 held`);
  // #1 — the typed lane. This is the number the whole repair exists to move.
  const scored = allRows.filter(r => r.comps && r.comps.self > 0);
  const codeRows = allRows.filter(r => String(r.key || "").startsWith("code:"));
  const codeScored = codeRows.filter(r => (r.S || 0) > 0);
  L.push(`  self channel   : ${scored.length}/${allRows.length} moments lifetime have fired SELF · from the typed lane ${codeScored.length}/${codeRows.length} code moments now score above zero (before the #1 repair: 0/${codeRows.length})`);
  // #10 — the two engines whose firing history was unanswerable
  const eng = (name) => {
    const seen = allRows.filter(r => r.engines && r.engines[name] !== undefined);
    const c = (v) => seen.filter(r => r.engines[name] === v).length;
    if (!seen.length) return `no instrumented rows yet (every row predates the #10 repair — this is UNMEASURED, not zero)`;
    return `hit ${c("hit")} · miss ${c("miss")} · corpus dry ${c("dry")} · not queried ${c("skip")} — over ${seen.length}/${allRows.length} instrumented rows`;
  };
  L.push(`  whisper engine : ${eng("whisper")}`);
  L.push(`  pre-answer eng : ${eng("pre_answer")}`);
  // #2 — the sentinel term, with the counter that would let it be set
  const pulseRows = allRows.filter(r => (r.comps && r.comps.pulse > 0) || String(r.key || "").startsWith("pulse:"));
  const pulseLive = pulseRows.filter(r => r.tier >= 1).length;
  L.push(`  pulse sentinel : ${pulseLive}/${pulseRows.length} escalations reached tier≥1 · weight ${(cfg.weights.pulse ?? 0).toFixed(2)} (need a verdict source before it can be raised — 0 of ${pulseRows.length} has ever been humanly or adjudicator-verdicted; safe ceiling ${(cfg.tiers.tau1_base - 0.32029).toFixed(3)})`);
  // #10 — is the log actually landing?
  let logState = "MISSING — no diagnostic has been written yet";
  try { if (existsSync(LOGFILE)) logState = `${statSync(LOGFILE).size}/${cfg.log.max_bytes} bytes before rotation`; } catch { }
  L.push(`  diagnostics    : ${LOGFILE} — ${logState}`);
  return L.join("\n");
}
function statusReport() {
  const cfg = loadConfig();
  const w = readJson(WORKSPACE) || {};
  const all = readLines(SLEDGER);
  const rows = all.filter(r => (r.day || String(r.ts || "").slice(0, 10)) === localDate());
  return buildStatus(rows, all, w, cfg);
}

// ---------------------------------------------------------------------------
// main — the relay daemon (localhost only)
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  if (mode === "status") { console.log(statusReport()); return; }
  brainMod = await import("./brain.mjs");
  const cfg = loadConfig();
  // #10 — console.log alone went to a closed handle under hidden_run.vbs. Both,
  // always: the console for a foreground run, the file for the cloak.
  const log = (m) => { console.log(m); fileLog(cfg, m); };
  const nucleus = createNucleus(cfg, { log });
  // boot re-seed: yesterday's tail keeps NOV/HAB honest across restarts
  for (const row of readLines(AFFERENT).slice(-500)) {
    for (const t of row.concept_tokens || []) nucleus.state.seen.add(String(t).toLowerCase());
  }
  nucleus.state.wakesToday = readLines(SLEDGER).filter(r => (r.day || String(r.ts || "").slice(0, 10)) === localDate() && r.tier === 2).length;
  createBusWatcher(nucleus);
  const server = createServer(async (req, res) => {
    const send = (code, body) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
    try {
      if (req.method === "GET" && req.url === "/status") {
        // THE BUILD STAMP (audit #108, 6 Aug 2026). Node caches a module at load, so a
        // resident daemon keeps executing the code it booted with FOREVER — nothing in
        // the organism restarts it. Measured: this process booted 04-08 16:43:34 while
        // this file was rewritten 45 minutes later at 17:28:30, so every 4-Aug salience
        // repair (token derivation, the SELF gate, provenance logging) sat inert on disk
        // for two days. The morning conductor certified it healthy the whole time,
        // because it probes the PORT and a port cannot tell you what build answers it.
        // So the daemon now states its own build, and the conductor compares it against
        // the file. `module_mtime_ms` is read once at boot on purpose: reading it live
        // would report the file's current state, which is exactly the thing being tested.
        return send(200, { ok: true, version: nucleus.state.workspace.version, wakes_today: nucleus.state.wakesToday, wake_cap: cfg.wake_cap_per_day, tau1_eff: Math.round(tau1Effective(cfg, defaultHeadroomFrac()) * 1000) / 1000, module_mtime_ms: MODULE_MTIME_MS, booted_at: BOOTED_AT });
      }
      if (req.method === "GET" && req.url === "/workspace") return send(200, nucleus.state.workspace);
      if (req.method === "POST") {
        let raw = ""; for await (const c of req) raw += c;
        const body = raw ? JSON.parse(raw) : {};
        if (req.url === "/afferent") return send(200, await nucleus.ingest(body));
        if (req.url === "/deep-answer") return send(200, nucleus.foldDeepAnswer(body));
        if (req.url === "/bg-drained") return send(200, nucleus.foldBgDrained(body));   // M22
      }
      send(404, { error: "not found" });
    } catch (e) { send(500, { error: String(e.message).slice(0, 200) }); }
  });
  server.on("error", (e) => {
    if (e && e.code === "EADDRINUSE") { console.log(`thalamus: nucleus already live on :${PORT} — standing down.`); process.exit(0); }
    throw e;
  });
  server.listen(PORT, "127.0.0.1", () => log(`thalamus: relay nucleus LIVE on http://127.0.0.1:${PORT} — τ0=${cfg.tiers.tau0} τ1=${cfg.tiers.tau1_base}+${cfg.tiers.budget_k}·(1−headroom) ε=${cfg.tiers.epsilon} · B=${cfg.binding_ms}ms · wake cap ${cfg.wake_cap_per_day}/day · SELF on provenance [${(cfg.self_sources || []).join(", ")}], never [${(cfg.self_deny_sources || []).join(", ")}]`));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { computeComponents, salience, tau1Effective, signalKey, sanitizeAfferent, createNucleus, createBusWatcher, surprisalPE, loadConfig, phashHamming, matchPreAnswer, pendingWakes, pendingBg, matchBg, wakeCapToday, dossierKey, conceptRegistry, baseRateFor, provenanceOf, isHisVoice, selfLegacy, buildStatus, statusReport };
