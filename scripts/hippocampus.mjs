#!/usr/bin/env node
// ============================================================================
// hippocampus.mjs · ARSENAL AI FC — THE HIPPOCAMPUS (the durable memory organ)
// ----------------------------------------------------------------------------
// WHAT:  The five-layer memory (CYBORG_BRAIN.md §6). The live Gemini session
//        is DELIBERATELY lossy (sliding-window compression, M0); containment
//        is not the session's job — it is THIS organ's:
//        L1 THE SCRIBE      mark_moment(kind,text) — salient moments written
//                           the MOMENT they happen → hippocampus/episodes.jsonl
//                           + embedded on the free pool (async, no audio stall)
//        L2 LEDGER OF SELF  identity_facts.json — "remember I…" facts, captain-
//                           gated (his explicit word only, surfaced never
//                           silent), injected UNCONDITIONALLY every session
//        L3 CONSOLIDATOR    nightly "who he is right now" → who_he_is.json
//                           (~1-2KB) on the free Gemini lane; AI proposes, a
//                           STRICT schema validator + banned-phrase check
//                           accepts or the old file stands. Prosody NEVER
//                           enters it (validator enforces).
//        L4 RECALL REFLEX   recallReflex(turnText) — embed the turn, cosine vs
//                           episodes + open threads; ≥ threshold → a NON-SPOKEN
//                           hint the Gaffer weaves ONLY if it earns the turn
//        L0 REHYDRATOR      buildRehydrateCartridge() — on reload/rotation the
//                           Dugout prepends: ALL identity facts + who_he_is +
//                           last-N durable episodes. The session forgets
//                           freely; the organ remembers.
// M10:   consolidate-store — month-sharding + FSRS-style biological forgetting
//        (prune to cold shards, never delete); recall stays O(recent).
// E2E:   audit 25 Jul 2026 — L1 is now genuinely DURABLE-FIRST (append, THEN
//        embed: a stalled pool can no longer eat a moment), and L4 finally
//        COUNTS its recalls — via an append-only recall_bumps.jsonl that the
//        hourly `index` sweep folds in (the FSRS stretch inside memoryStrength
//        was dead wiring until now: nothing ever wrote anything but 0).
// LAWS:  single writer of dressing-room/hippocampus/* (ALL gitignored — his
//        moments never touch the public repo). Facts verbatim, byte-exact.
//        remember/forget fire on HIS words only (the Dugout constitution
//        carries the gate; this organ enforces shape). Layering: the batch
//        recall_index.jsonl + indexRecall() stay untouched as the back-fill
//        floor — this is the live layer on top.
// MODES: mark <kind>  (text on stdin) · remember (stdin) · forget <id> ·
//        index · consolidate [--force] · consolidate-store · cartridge ·
//        recall "<text>" · recall-hint "<text>" · selftest
// AUDIT (4 Aug 2026, organism repair G4 "MEMORY THAT ARRIVES TRUE"):
//   #13 identityCartridge dropped the stored `ts` at render, so a 17-Jul
//       assertion read identically to today's at every consumer. It now dates
//       every fact and prints its age.
//   #15 whoCartridge asserted "RIGHT NOW" over a file that may be days old
//       (consolidate() early-returns on the normal no-material day). It now
//       degrades by age, copying tone.mjs:101's law — age may only ever
//       DEGRADE a claim, never lift one.
//   #16 the narrator-voice guard needed a closed verb enumeration, so
//       "He flagged…" / "Captain asked…" walked straight in. Now the leading
//       third-person SUBJECT is enough.
//   #17 gatherDayMaterial saw only episodes + dugout CAPTAIN: lines, both of
//       which have gone dry — so who_he_is FROZE. A LEARNING-ARC filter over
//       afferent.jsonl is the third source (see learningArcTurns: measured, it
//       admits his concept talk and rejects his machine-building talk, which
//       the consolidator prompt at :303 explicitly bans).
//   #18 the per-turn recall reflex was voice-only. recallReflexLexical() is a
//       NETWORK-FREE, WRITE-FREE twin a UserPromptSubmit hook can afford.
// ============================================================================

import { readFileSync, existsSync, appendFileSync, mkdirSync, writeFileSync, renameSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const HIPPO_DIR = join(__dirname, "..", "dressing-room", "hippocampus");
const EPISODES  = join(HIPPO_DIR, "episodes.jsonl");
const FACTS     = join(HIPPO_DIR, "identity_facts.json");
const WHO       = join(HIPPO_DIR, "who_he_is.json");
const COLD_DIR  = join(HIPPO_DIR, "cold");

const KINDS = ["doubt", "win", "preference", "thread"];
const FACTS_CAP = 40;                               // the ledger stays TINY — always injectable
const RECALL_THRESHOLD = 0.55;
const BANNED = ["10x", "exponential", "on steroids", "god-tier", "time is short"];
const DAY_MS = 86400000;
// Whole CALENDAR days between a stamp and now. Used by every age surface below,
// so the arithmetic is stated once.
// Day granularity, not clock granularity, on purpose: these ages sit next to a
// printed YYYY-MM-DD, and clock-granularity made two facts stamped the same
// morning render as "17d ago" and "18d ago" side by side — arithmetic that
// looks like a bug even when it isn't. It also matches how `who.date` is
// produced in the first place (localDate(now), a LOCAL calendar day), so the
// comparison is like-for-like instead of drifting by a timezone offset.
// Returns null when the stamp is unreadable — an unknown age is NEVER rendered
// as 0 (honesty: unmeasured ≠ measured zero).
function ageInDays(stampish, now = new Date()) {
  const day = String(stampish || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const a = Date.parse(day + "T00:00:00Z");
  const b = Date.parse(localDate(now) + "T00:00:00Z");
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / DAY_MS);
}

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const textHash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(16); };
function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// key pool + REST lanes (per-organ helper by repo idiom; rotates on quota)
function loadKeys(envText = null) {
  const keys = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY.trim());
  const envPath = join(os.homedir(), ".gemini", ".env");
  const text = envText !== null ? envText : (existsSync(envPath) ? readFileSync(envPath, "utf8") : "");
  for (const line of text.split("\n")) {
    const m = line.match(/^GEMINI_API_KEY(_\d+)?\s*=\s*(.+)$/);
    if (m && m[2].trim() && !keys.includes(m[2].trim())) keys.push(m[2].trim());
  }
  return keys;
}
// E2E audit (25 Jul 2026): this fetch had NO AbortController at all — unlike
// generatePool's 120s. A stalled endpoint (TCP accepted, never answers) hung it
// forever, PER KEY, and every caller inherited that hang: the Dugout's scribe
// tool runs this organ via execFileSync with a 60s kill, so the child died mid-
// flight and the captain's moment vanished. A recall embed is a sub-second call;
// 15s is already generous. Timer cleared in `finally` (a thrown fetch used to
// leave the timer armed — same class of leak as generatePool below).
const EMBED_TIMEOUT_MS = Number(process.env.HIPPO_EMBED_TIMEOUT_MS || 15000);
const EMBED_BATCH_CAP = 100;                        // Gemini batchEmbedContents hard cap: 100 requests/call
async function embedPool(texts, keys = loadKeys(), fetchFn = fetch) {
  if (!texts.length) return [];
  const model = process.env.HIPPO_EMBED_MODEL || "gemini-embedding-001";
  for (const key of keys) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), EMBED_TIMEOUT_MS);
    try {
      const r = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${encodeURIComponent(key)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
        body: JSON.stringify({ requests: texts.map(t => ({ model: `models/${model}`, content: { parts: [{ text: String(t).slice(0, 1500) }] } })) }),
      });
      if (!r.ok) continue;
      const j = await r.json();
      const vecs = (j.embeddings || []).map(e => e.values);
      if (vecs.length) return vecs;
    } catch { } finally { clearTimeout(timer); }
  }
  return null;
}
// models walk a fallback ladder (preview churn law: probed live 14 Jul 2026 —
// bare "gemini-3.1-flash" is NOT on the wire; the -latest aliases survive churn)
async function generatePool(prompt, { models, maxOutputTokens = 2048, json = false, keys = loadKeys(), fetchFn = fetch, temperature = 0.4 } = {}) {
  const ladder = models || [process.env.HIPPO_GEN_MODEL, "gemini-3.1-pro-preview", "gemini-flash-latest"].filter(Boolean);
  let lastStatus = null;                              // M16 — callers with a PINNED key learn WHY it failed (429 = lane dry)
  for (const model of ladder) {
    for (const key of keys) {
      // E2E audit (25 Jul 2026): the timer was declared INSIDE the try and only
      // cleared on the success path, so a fetch that throws instantly (Wi-Fi
      // down → ECONNREFUSED/DNS) left one armed 120s timer per key × per model.
      // Six orphaned handles kept the event loop alive: the 02:10 consolidate
      // printed "every key dry" in <1s then sat there for two minutes. Hoisted
      // out of the try and cleared in `finally`.
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 120000);
      try {
        const gc = { maxOutputTokens, temperature };  // M23 — hot sampling for difficulty grading
        if (json) gc.responseMimeType = "application/json";   // the wire enforces JSON, not the prompt
        const r = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: gc }),
        });
        if (!r.ok) { lastStatus = r.status; continue; }
        const j = await r.json();
        const text = (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.map(p => p.text || "").join("");
        if (text) return { ok: true, text, model, error: null };
      } catch { } finally { clearTimeout(t); }
    }
  }
  return { ok: false, text: null, error: "every key dry on every model", status: lastStatus };
}

// ---------------------------------------------------------------------------
// L1 — THE SCRIBE
// ---------------------------------------------------------------------------
// THE VERBATIM LAW — the narrator-voice guard.
// LEGACY (15 Jul → 4 Aug 2026), frozen verbatim per the layering law. It
// required a CLOSED VERB ENUMERATION after the subject, so it only ever caught
// the handful of verbs someone thought of on the day:
const NARRATOR_RE_LEGACY = /^\s*(he|she|the captain|captain|nikhil)('s|’s|\s+(is|was|has|had|says|said|wants|wanted|feels|felt|thinks|thought))\b/i;
// AUDIT 4 Aug 2026 (#16): two rows walked past it and now sit in the cartridge
// every single session — "He flagged my confusion about being 'on a call with
// Nidhi'…" and "Captain asked definitively who was talking to Nidhi…". Neither
// "flagged" nor "asked" was enumerated. Both are the coach narrating its OWN
// error, both are tagged kind:"doubt" (the class reserved for HIS confusion),
// and in the SessionStart brief they are 2 of MEMO_EPISODES=6 slots.
// The fix is the one the audit named: the leading third-person SUBJECT is
// already sufficient evidence — a moment that OPENS by naming him in the third
// person is a paraphrase whatever verb follows. The subject list is unchanged
// (widening it to "they"/"the user" would start refusing his own sentences —
// "they keep saying attention is all you need" is HIS voice, not a narrator's).
// The two live rows themselves are NOT removed here: episodes.jsonl is his
// memory and Law 4 makes deletion his word, not this organ's. This guard stops
// the next one. Selftest pins both verbatim strings.
const NARRATOR_RE = /^\s*(he|she|the captain|captain|nikhil)(['’]s\b|\s+\p{L})/iu;
async function markMoment(kind, text, deps = {}) {
  const k = String(kind || "").toLowerCase();
  if (!KINDS.includes(k)) return { ok: false, error: `kind must be ${KINDS.join("|")}` };
  const t = String(text || "").trim();
  if (!t) return { ok: false, error: "no words — a moment is his words, verbatim" };
  // scan-fix 15 Jul: the model banked its own third-person paraphrase as
  // "his verbatim words" and recall later QUOTED it back as him. Hard-reject
  // narrator voice — a moment is first-person or it is not a moment.
  if (NARRATOR_RE.test(t)) {
    return { ok: false, error: "that is a paraphrase ABOUT him — pass what HE said, first person, verbatim" };
  }
  const embed = deps.embed || embedPool;
  const append = deps.append || ((row) => { mkdirSync(HIPPO_DIR, { recursive: true }); appendFileSync(EPISODES, JSON.stringify(row) + "\n"); });
  // E2E audit (25 Jul 2026): the embed used to be AWAITED **before** the append,
  // so a hung pool ate the moment outright — the Dugout calls this via
  // execFileSync with a 60s kill, the child died inside the fetch and nothing
  // was ever written. The header always promised "written the MOMENT they
  // happen + embedded async"; now the code actually does that. Order is now
  // DURABLE-FIRST: append with vec:null, then best-effort embed and patch the
  // row in place. If the patch never happens (dry pool / crash) the hourly
  // `index` sweep back-fills the vector — the moment itself is already safe.
  // When a test injects `append`, the default patch is a no-op: an injected
  // writer must NEVER cause a write to the captain's real episodes.jsonl.
  const patch = deps.patch || (deps.append ? (() => true) : ((row) => patchEpisodeVec(row.id, row.vec)));
  const now = deps.now || new Date();
  const row = { id: textHash(t + now.toISOString()), ts: now.toISOString(), day: localDate(now), kind: k, text: t.slice(0, 500), vec: null, recalls: 0 };
  append(row);                                      // ← the moment is durable from HERE, whatever the network does
  let embedded = false;
  try {
    const vecs = await embed([t]);
    if (vecs && vecs[0]) { row.vec = vecs[0]; embedded = patch(row) !== false; }
  } catch { }
  return { ok: true, id: row.id, embedded, durable: true };
}
// single writer of episodes.jsonl (this organ) → an in-place rewrite is safe;
// the hot set is O(recent) by consolidateStore, so this stays cheap.
function patchEpisodeVec(id, vec, file = EPISODES) {
  try {
    const rows = readLines(file);
    const hit = rows.find(r => r.id === id);
    if (!hit) return false;
    hit.vec = vec;
    writeAtomic(file, rows.map(x => JSON.stringify(x)).join("\n") + "\n");
    return true;
  } catch { return false; }
}
// embed-pending sweep — offline moments get their vectors when the pool wakes
// E2E audit (25 Jul 2026): this sent the ENTIRE pending list as one
// batchEmbedContents call. Past 100 rows the wire rejects it (400), embedPool
// walks every key, returns null, and the sweep reported a bare "0" — byte-
// identical to a healthy empty backlog. So a week of offline marking became a
// backlog that could never drain and never said so. Two fixes: chunk to the
// 100-request cap, and report failures distinguishably. indexEpisodes keeps its
// number return (nightshift.mjs:560 sums it) — the detail lives beside it.
async function indexEpisodesDetailed(deps = {}) {
  const embed = deps.embed || embedPool;
  const file = deps.file || EPISODES;
  const rows = readLines(file);
  // this sweep IS the single writer of episodes.jsonl — so it is also where the
  // per-turn recall journal gets folded in (see bumpRecall below).
  const recalls = applyRecallBumps(rows, deps);
  const pending = rows.filter(r => !r.vec);
  let n = 0, failed = 0;
  for (let i = 0; i < pending.length; i += EMBED_BATCH_CAP) {
    const chunk = pending.slice(i, i + EMBED_BATCH_CAP);
    const vecs = await embed(chunk.map(r => r.text));
    if (!vecs) { failed += chunk.length; continue; }  // this chunk stays pending; the next sweep retries it
    chunk.forEach((r, j) => { if (vecs[j]) { r.vec = vecs[j]; n++; } else failed++; });
  }
  if (n || recalls) {
    (deps.write || ((rs) => writeAtomic(file, rs.map(x => JSON.stringify(x)).join("\n") + "\n")))(rows);
    // clear the journal only when it was the real one AND we really persisted
    if (recalls && !deps.bumps && !deps.write) { try { writeFileSync(RECALL_BUMPS, ""); } catch { } }
  }
  return { ok: failed === 0, embedded: n, pending: pending.length, failed, recalls };
}
async function indexEpisodes(deps = {}) { return (await indexEpisodesDetailed(deps)).embedded; }

// ---------------------------------------------------------------------------
// L2 — THE LEDGER OF SELF (captain-gated at the mouth; shape enforced here)
// ---------------------------------------------------------------------------
const FACT_MAX_CHARS = 240;
function rememberFact(text, deps = {}) {
  // E2E audit (25 Jul 2026): dedupe compared the FULL input against the stored
  // row, which was already truncated to 240 — so any fact longer than that
  // never matched itself and re-appended on every re-utterance, while
  // id = textHash(FULL text) gave all the copies the SAME id (forget one, the
  // twins stay). Truncate ONCE, up front, so compare + id + stored text are the
  // same string. Existing rows keep their old ids: dedupe matches on text.
  const t = String(text || "").trim().slice(0, FACT_MAX_CHARS);
  if (!t) return { ok: false, error: "no words to remember" };
  const facts = (deps.read || (() => readJson(FACTS)))() || { facts: [] };
  if (facts.facts.some(f => f.text === t)) return { ok: true, id: facts.facts.find(f => f.text === t).id, note: "already held" };
  if (facts.facts.length >= FACTS_CAP) return { ok: false, error: `the ledger holds ${FACTS_CAP} facts max — forget one first (it must stay small enough to ALWAYS be present)` };
  const f = { id: textHash(t), ts: (deps.now || new Date()).toISOString(), text: t };
  facts.facts.push(f);
  (deps.write || ((o) => writeAtomic(FACTS, o)))(facts);
  return { ok: true, id: f.id };
}
function forgetFact(id, deps = {}) {
  const facts = (deps.read || (() => readJson(FACTS)))() || { facts: [] };
  const before = facts.facts.length;
  facts.facts = facts.facts.filter(f => f.id !== String(id));
  if (facts.facts.length === before) return { ok: false, error: "no such fact id" };
  (deps.write || ((o) => writeAtomic(FACTS, o)))(facts);
  return { ok: true, forgotten: id };
}
// LEGACY (frozen verbatim, layering law) — the undated renderer. Kept so the
// shape of the bug stays readable next to its fix; no caller points here.
function identityCartridgeLegacy(facts = readJson(FACTS)) {
  const list = (facts && facts.facts) || [];
  if (!list.length) return "";
  return `THE LEDGER OF SELF (facts he told you to hold — ALWAYS present, never guessed):\n${list.map(f => `- ${f.text} [${f.id}]`).join("\n")}`;
}
// AUDIT 4 Aug 2026 (#13) — THE UNDATEDNESS *IS* THE BUG.
// Every fact row has carried a `ts` since the day it was written, and this
// renderer threw it away. The consequence, live: the two facts in the ledger
// were both written 17 Jul — "this is the first day that we are working
// together on the organism" and "I am bringing my friend to whom you need to
// explain everything" — and they arrive at the top of every session, in the
// slot labelled ALWAYS PRESENT, reading exactly like something he said this
// morning. A 15-day-old instruction to re-explain everything from scratch is
// indistinguishable from a live one, at all three doors (`cartridge`, the
// SessionStart brief, and the MCP `get_context`).
// No threshold is invented here. Nothing is hidden, nothing expires, no fact is
// scored "stale" by a guessed cut-off — the render simply stops discarding a
// field it already holds, and states the age as arithmetic. Retiring a fact
// stays HIS call (`hippocampus.mjs forget <id>`, Law 4).
function identityCartridge(facts = readJson(FACTS), now = new Date()) {
  const list = (facts && facts.facts) || [];
  if (!list.length) return "";
  const line = (f) => {
    const age = ageInDays(f.ts, now);
    const day = String(f.ts || "").slice(0, 10);
    // an unreadable/absent ts is said out loud, never rendered as "today"
    const stamp = !day ? "undated — provenance unknown"
      : age === null ? `${day} · age unreadable`
      : age <= 0 ? `${day} · today`
      : `${day} · ${age}d ago`;
    return `- (${stamp}) ${f.text} [${f.id}]`;
  };
  return `THE LEDGER OF SELF (facts he told you to hold — ALWAYS present, never guessed).\nEach carries the day HE said it: a fact is true AS OF ITS DATE, not automatically true today. Nothing here expires on its own — only he retires a fact (\`hippocampus.mjs forget <id>\`).\n${list.map(line).join("\n")}`;
}

// ---------------------------------------------------------------------------
// L3 — THE CONSOLIDATOR (nightly; AI proposes · code validates · old file stands on failure)
// ---------------------------------------------------------------------------
const WHO_KEYS = ["fingerprint", "open_threads", "recent_wins", "recent_cracks", "voice_tuning", "do_not"];
function validateWho(obj) {
  if (!obj || typeof obj !== "object") return "not an object";
  for (const k of WHO_KEYS) if (!(k in obj)) return `missing ${k}`;
  if (!Array.isArray(obj.open_threads) || !Array.isArray(obj.recent_wins) || !Array.isArray(obj.recent_cracks) || !Array.isArray(obj.do_not)) return "threads/wins/cracks/do_not must be arrays";
  const flat = JSON.stringify(obj).toLowerCase();
  for (const b of BANNED) if (flat.includes(b)) return `banned phrase: ${b}`;
  for (const p of ["prosody", "emotion", "tone_of_voice", "agitat", "stress_level", "mood"]) if (flat.includes(p)) return `affect leaked: ${p}`;
  if (JSON.stringify(obj).length > 4000) return "too big — this must load at the top of EVERY session";
  return null;
}
// LEGACY (frozen verbatim, layering law) — the two-surface gatherer. Both of
// its surfaces went dry (dugout transcripts stop 30 Jul; 16 episodes in 16
// days), which is why who_he_is froze. No caller points here.
function gatherDayMaterialLegacy(now = new Date(), deps = {}) {
  const days = [localDate(now), localDate(new Date(now.getTime() - 86400000))];
  const eps = readLines(deps.episodes || EPISODES).filter(e => days.includes(e.day)).slice(-40);
  const outDir = deps.outDir || join(STATE_DIR, "brain_out", "dugout");
  let talk = [];
  try {
    for (const d of days) {
      const p = join(outDir, d + ".md");
      if (existsSync(p)) talk.push(...readFileSync(p, "utf8").split("\n").filter(l => l.startsWith("CAPTAIN: ")).slice(-60));
    }
  } catch { }
  const cal = readJson(deps.calibration || join(STATE_DIR, "calibration.json")) || {};
  return { episodes: eps, captain_lines: talk.slice(-80), calibration: { gap: cal.calibration_gap ?? null, trend: cal.trend ?? null } };
}

// ---------------------------------------------------------------------------
// #17 — THE LEARNING-ARC FILTER (the consolidator's third source)
// ---------------------------------------------------------------------------
// THE TRAP, and why this is not `recallWorthy`:
// The obvious fix is "pipe afferent.jsonl's claude-code rows through the same
// quality bar the recall indexer uses (dugout.mjs:455 recallWorthy)". Measured
// on the live file, that fix makes who_he_is WORSE, not better:
//   1 Aug — 24 of his typed turns · 21 pass recallWorthy · 7,400 chars, into a
//   12,000-char material budget — and every one of the 24 is machine-building
//   talk (ntfy pushes, laptop RAM, session archiving, lexicon_mine, the pulse,
//   numerical limits, pipeline status). That is EXACTLY the category the
//   consolidator prompt below bans in its own words: "Talk about building/
//   configuring the machine itself (tools, accounts, schedulers, APIs) is
//   background noise — never let it become the fingerprint."
// So the third source needs an ARC filter, not a QUALITY filter: does this turn
// carry his contact with a CONCEPT, or with the machine?
//
// Both halves are read from canon already committed in this repo — nothing here
// is a hand-written vocabulary:
//   · ADMIT  ← dressing-room/state/concepts.json (26 concepts + 12 skills + 86
//     aliases = the hand-curated canon capture.mjs normalises reps against) plus
//     sprint.json's current task. If a turn names none of them it is not about
//     the syllabus.
//   · VETO   ← the machine lexicon below. A turn that names the machine at all
//     is out; the bar is ZERO machine words, not a ratio, so there is no
//     invented cut-off to defend.
//   · VETO   ← organ-prompt shape, same two-layer idea as hooks/afferent-post.mjs
//     :36-39 (second-person role framing PLUS an organism marker), widened to
//     the imperative openers used by organ prompts that predate that guard.
//
// MEASURED, live corpus (502 claude-code rows, 18 Jul – 4 Aug):
//   recallWorthy alone → 458 rows / 293,464 chars
//   this filter        →  14 rows /   3,123 chars   (3.1% of rows, 1.1% of chars)
// Per day, the days that matter:
//   1 Aug  24 raw → 21 recallWorthy (7,400 ch) → 0 arc   ← the audit's exact case
//   30 Jul 77 raw → 52 recallWorthy (10,146 ch) → 3 arc (537 ch)
//   31 Jul 70 raw → 63 recallWorthy (15,388 ch) → 4 arc (1,688 ch)
//   2 Aug  31 raw → 29 recallWorthy (5,630 ch) → 3 arc (334 ch)
// What it lets through reads like: "hallucination is that LLM model creates a
// well written correct structure of the answer but inside of it everything is
// mostly incorrect", "nahi abhi nahi smjha, pehle ye batao ye hallucination
// mein jo ye proabibilty se pick horaha hain this is inference and sampling
// work done right?", "bhai embeddings aur tokenization ka farq samjha de".
// What it blocks reads like: "is everything pushed to the main??", "ntfy ka
// exact channel batao", "install any plugins, mcp servers, tools".
const AFFERENT      = join(STATE_DIR, "afferent.jsonl");
const CONCEPTS_JSON = join(STATE_DIR, "concepts.json");
const SPRINT_JSON   = join(STATE_DIR, "sprint.json");
// The machine lexicon. Every entry is a thing this repo IS (an organ name, a
// state-file extension, a scheduler, a delivery channel) or a git/ops verb —
// i.e. the "tools, accounts, schedulers, APIs" the prompt already names. It is
// matched on WHOLE WORDS only: "ram" must not fire inside "program", and
// "token" is deliberately absent because tokenization is a concept.
const MACHINE_WORDS = [
  "commit", "commits", "push", "pushed", "repo", "repos", "branch", "merge", "git",
  "deploy", "install", "plugin", "plugins", "mcp", "server", "servers",
  "schtasks", "scheduler", "cron", "selftest", "script", "scripts", "hook", "hooks",
  "agent", "agents", "organism", "ntfy", "config", "laptop", "ram", "folder",
  "audit", "pipeline", "wallpaper", "gaffer", "dugout", "thalamus", "hippocampus",
  "nightshift", "cyborg", "json", "jsonl", "mjs", "colab", "gem", "gems",
  "sheet", "dashboard", "instagram", "youtube",
];
const ORGAN_PREAMBLE_RE = /^\s*(you are|you build|you maintain|you predict|you write|you generate|generate exactly|write exactly|for the concept)\b/i;
const ORGAN_MARKER_RE   = /ARSENAL AI FC|exocortex|the captain\b|STRICT JSON|personal learning brain|this learner|the learner('s)?\b|output json|return json/i;
// normalised, space-padded: every lookup below is a whole-word containment test
const padNorm = (s) => " " + String(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim() + " ";
// The quality floor is dugout.mjs:455 `recallWorthy`, restated here rather than
// imported: dugout.mjs is the voice bridge (a 3k-line HTTP server), and the
// 02:10 consolidator must not load it to read four lines of arithmetic.
function arcQualityFloor(text) {
  const t = String(text).trim();
  if (t.length < 20) return false;
  if (t.split(/\s+/).filter(w => w.length > 1).length < 4) return false;   // shards carry no signal
  const deva = (t.match(/[ऀ-ॿ]/g) || []).length;
  if (deva / t.length > 0.3) return false;                                  // transliterated-ASR garble
  if (/^[,.;:\-–—]/.test(t)) return false;                                  // mid-sentence fragment
  return true;
}
// the canon vocabulary, read from the committed registry (never hand-listed)
function conceptVocabulary(deps = {}) {
  const out = new Set();
  const add = (s) => { const n = padNorm(s).trim(); if (n) out.add(" " + n + " "); };
  const reg = deps.concepts !== undefined ? deps.concepts : readJson(CONCEPTS_JSON);
  for (const group of ["concepts", "skills"]) {
    for (const [id, def] of Object.entries((reg && reg[group]) || {})) {
      add(id);
      for (const a of (def && def.aliases) || []) add(a);
    }
  }
  const sprint = deps.sprint !== undefined ? deps.sprint : readJson(SPRINT_JSON);
  const cur = (sprint && sprint.progress && sprint.progress.current) || null;
  if (cur && cur.task) add(cur.task);
  return [...out];
}
function learningArcVerdict(text, vocab) {
  const t = String(text || "");
  if (!arcQualityFloor(t)) return { ok: false, why: "below the quality floor" };
  if (ORGAN_PREAMBLE_RE.test(t) && ORGAN_MARKER_RE.test(t)) return { ok: false, why: "an organ's own prompt, not his words" };
  const n = padNorm(t);
  const machine = MACHINE_WORDS.filter(w => n.includes(" " + w + " "));
  if (machine.length) return { ok: false, why: `machine talk (${machine.slice(0, 3).join(", ")})` };
  const concepts = vocab.filter(c => n.includes(c)).map(c => c.trim());
  if (!concepts.length) return { ok: false, why: "touches no concept in the canon" };
  return { ok: true, concepts };
}
// Per-row clip and row cap are NOT new numbers: 500 is the exact clip
// markMoment already applies to an episode (`text.slice(0, 500)` above), so an
// afferent turn can never outweigh a real marked moment; 40 is the exact window
// episodes already get in this function (`.slice(-40)`). Measured peak on the
// real corpus is 4 arc rows in a day, so 40 is a safety net at 10× the observed
// peak, not a budget — and the have/need counter beside it says so out loud.
const ARC_ROW_CHARS = 500;
const ARC_MAX_ROWS  = 40;
function learningArcTurns(now = new Date(), deps = {}) {
  const days = deps.days || [localDate(now), localDate(new Date(now.getTime() - DAY_MS))];
  const rows = deps.afferent || readLines(AFFERENT);
  const vocab = deps.vocab || conceptVocabulary(deps);
  // HIS words only. `claude-code-teaching` is the coach's own output and must
  // never become his fingerprint (same law as the paraphrase guard at L1).
  const mine = rows.filter(r => r && r.source === "claude-code" && r.modality === "code"
    && days.includes(String(r.ts || "").slice(0, 10)));
  const seen = new Set(), kept = [];
  for (const r of mine) {
    const v = learningArcVerdict(r.text, vocab);
    if (!v.ok) continue;
    const text = String(r.text).trim().slice(0, ARC_ROW_CHARS);
    const key = padNorm(text);
    if (seen.has(key)) continue;                    // he repeats himself when a turn fails; one copy is the signal
    seen.add(key);
    kept.push({ day: String(r.ts).slice(0, 10), concepts: v.concepts, text });
  }
  return {
    turns: kept.slice(-ARC_MAX_ROWS),
    scanned: mine.length,
    kept: kept.length,
    vocab_size: vocab.length,
    // #106 — a have/need counter, never a bare status word. A ZERO here means
    // "measured zero on N scanned turns", which is a different fact from "the
    // file was not there" (vocab_size 0 says that instead).
    counter: `${Math.min(kept.length, ARC_MAX_ROWS)}/${mine.length} of his typed turns are learning-arc (canon vocab: ${vocab.length} terms)`,
  };
}
// FOUND WHILE FIXING #17, not in the audit — and it silently nullifies both the
// audit's fix and mine, so it is fixed here:
// consolidate() sends `JSON.stringify(material).slice(0, 12000)` to the model.
// An episode row carries its EMBEDDING — `vec`, a 3,072-float array — and
// JSON.stringify emits fields in insertion order (id, ts, day, kind, text, vec),
// so the vector lands INSIDE the budget. Measured on the live file, for the
// 31 Jul/1 Aug window: 6 episodes → 238,169 chars of material, first `"vec"` at
// index 356, and the 12,000-char cut ends mid-float-array. That is ONE episode's
// text followed by 11,644 characters of numbers — every other episode, every
// captain line, the calibration and (after #17) every learning-arc turn were
// being truncated away before the model ever saw them.
// The consolidator reads WORDS. Project to the three fields the prompt asks
// about and the whole window fits with room to spare.
const forPrompt = (e) => ({ day: e.day, kind: e.kind, text: e.text });
function gatherDayMaterial(now = new Date(), deps = {}) {
  const days = [localDate(now), localDate(new Date(now.getTime() - DAY_MS))];
  const eps = readLines(deps.episodes || EPISODES).filter(e => days.includes(e.day)).slice(-40).map(forPrompt);
  const outDir = deps.outDir || join(STATE_DIR, "brain_out", "dugout");
  let talk = [];
  try {
    for (const d of days) {
      const p = join(outDir, d + ".md");
      if (existsSync(p)) talk.push(...readFileSync(p, "utf8").split("\n").filter(l => l.startsWith("CAPTAIN: ")).slice(-60));
    }
  } catch { }
  const cal = readJson(deps.calibration || join(STATE_DIR, "calibration.json")) || {};
  const arc = deps.arc !== undefined ? deps.arc : learningArcTurns(now, deps);
  return {
    episodes: eps,
    captain_lines: talk.slice(-80),
    calibration: { gap: cal.calibration_gap ?? null, trend: cal.trend ?? null },
    learning_arc: arc.turns,
    learning_arc_counter: arc.counter,
  };
}
async function consolidate(deps = {}) {
  const gen = deps.generate || generatePool;
  const now = deps.now || new Date();
  const material = deps.material || gatherDayMaterial(now);
  const old = (deps.readWho || (() => readJson(WHO)))();
  // #17 — the arc turns count as fresh material. Before this, the two wired
  // surfaces (episodes, dugout CAPTAIN: lines) were BOTH dry on a normal day,
  // so this early-return was the normal path and who_he_is simply froze — while
  // whoCartridge kept announcing it as "RIGHT NOW" (#15).
  const arcRows = (material.learning_arc || []).length;
  if (!material.episodes.length && !material.captain_lines.length && !arcRows && !deps.force) {
    return {
      ok: false, skipped: true,
      // honesty: say WHAT was measured, not just that nothing happened
      reason: `no fresh material — 0 episodes, 0 captain lines, 0 learning-arc turns (${material.learning_arc_counter || "arc filter did not run"}) — the old who_he_is stands`,
      have: { episodes: 0, captain_lines: 0, learning_arc: 0 },
    };
  }
  const prompt = `You maintain a ~1.5KB "who he is right now" file for a personal AI coach. Distill ONLY from the material below (his own words — invent NOTHING). HIS LEARNING IDENTITY COMES FIRST: concepts in motion, doubts, wins and cracks on his AI-interview arc. Talk about building/configuring the machine itself (tools, accounts, schedulers, APIs) is background noise — never let it become the fingerprint. Output STRICT JSON, no markdown fences, exactly these keys:
{"fingerprint": "<2-3 sentences: where he stands right now — concepts in motion, current arc>", "open_threads": ["<unfinished thought/doubt he'll want picked back up>"], "recent_wins": ["<specific, earned>"], "recent_cracks": ["<named plainly as data, never shame>"], "voice_tuning": "<one sentence: how he's been wanting the coach to talk lately>", "do_not": ["<things he's signaled to stop doing>"]}
Honest frame only (no hype words). No health/mood/emotion inference of ANY kind. Arrays ≤5 items, each ≤140 chars.
MATERIAL KEYS: "episodes" = moments marked verbatim · "captain_lines" = his voice-bridge turns · "learning_arc" = his own typed turns that named a concept from the syllabus canon (already filtered — machine-building talk was removed before you saw it) · "calibration" = his gut-vs-truth gap.

YESTERDAY'S WHO (for continuity, update don't restart): ${JSON.stringify(old || {}).slice(0, 1200)}
THE MATERIAL:
${JSON.stringify(material).slice(0, 12000)}`;
  const r = await gen(prompt, { maxOutputTokens: 4096, json: true });   // 3.x pro spends thinking tokens too — budget generously
  if (!r.ok) return { ok: false, error: r.error, note: "lane dry — the old who_he_is stands" };
  let obj;
  try {
    const raw = String(r.text).replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
    const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
    obj = JSON.parse(s >= 0 && e > s ? raw.slice(s, e + 1) : raw);
  } catch { return { ok: false, error: "unparseable JSON — the old who_he_is stands" }; }
  const bad = validateWho(obj);
  if (bad) return { ok: false, error: `validator rejected: ${bad} — the old who_he_is stands` };
  const out = { date: localDate(now), generated_at: now.toISOString(), ...obj };
  (deps.writeWho || ((o) => writeAtomic(WHO, o)))(out);
  return {
    ok: true, date: out.date, threads: obj.open_threads.length,
    // #106 — what it was actually built from, on the surface a human reads
    have: { episodes: material.episodes.length, captain_lines: material.captain_lines.length, learning_arc: arcRows },
    arc_counter: material.learning_arc_counter || null,
  };
}
// LEGACY (frozen verbatim, layering law) — the undegraded renderer. It printed
// "RIGHT NOW" over a file of any age; the date rode along as decoration and
// nothing read it. No caller points here.
function whoCartridgeLegacy(who = readJson(WHO)) {
  if (!who || !who.fingerprint) return "";
  return `WHO HE IS RIGHT NOW (consolidated ${who.date}): ${who.fingerprint}\nOpen threads: ${(who.open_threads || []).join(" · ") || "—"}\nRecent wins: ${(who.recent_wins || []).join(" · ") || "—"}\nVoice tuning: ${who.voice_tuning || "—"}${(who.do_not || []).length ? `\nDo not: ${who.do_not.join(" · ")}` : ""}`;
}
// AUDIT 4 Aug 2026 (#15) — STALE-SAFE, copying tone.mjs:101's law verbatim:
// AGE MAY ONLY EVER DEGRADE A CLAIM, NEVER LIFT ONE.
// consolidate() early-returns on any day with no fresh material, which — until
// #17 above — was the NORMAL day. Reproduced from the real episode/dugout
// histogram: for ten consecutive days (21–30 Jul) this cartridge would have
// asserted "WHO HE IS RIGHT NOW (consolidated 2026-07-20)" into the live voice
// prompt (dugout.mjs:796) and into every `get_context` (mcp-memory.mjs:202) —
// day-scoped instructions ("do not do X today") framed as current.
// Three states, and only ONE of them can say RIGHT NOW:
//   today            → "RIGHT NOW"
//   older            → "AS OF <date> (Nd old — verify before acting)"
//   unreadable/ahead → "AS OF <date> (age unreadable — verify before acting)"
// An unreadable or future date degrades like an old one; it never lifts to
// RIGHT NOW, because unknown age is not evidence of freshness.
// Nothing is dropped. The audit's "delete do_not past 48h" half was rejected by
// its own verifier as heuristic (the consolidator is not asked for day-scoped
// items, so "today" only leaks in sometimes) — dropping data on a guess would
// trade a stale claim for a missing one. The day-scoped arrays are LABELLED
// with the same as-of date instead, so the reader can judge them.
function whoCartridge(who = readJson(WHO), now = new Date()) {
  if (!who || !who.fingerprint) return "";
  const age = ageInDays(who.date, now);
  const fresh = age === 0;
  const head = fresh
    ? `WHO HE IS RIGHT NOW (consolidated ${who.date})`
    : `WHO HE IS AS OF ${who.date || "(undated)"} (${age === null || age < 0 ? "age unreadable" : `${age}d old`} — this is HISTORY, verify before acting on it)`;
  const asOf = fresh ? "" : ` (as of ${who.date || "?"} — day-scoped items may have expired)`;
  return `${head}: ${who.fingerprint}\nOpen threads${asOf}: ${(who.open_threads || []).join(" · ") || "—"}\nRecent wins: ${(who.recent_wins || []).join(" · ") || "—"}\nVoice tuning: ${who.voice_tuning || "—"}${(who.do_not || []).length ? `\nDo not${asOf}: ${who.do_not.join(" · ")}` : ""}`;
}
// the same verdict as a datum, for any surface that wants a flag rather than a
// sentence (dugout.mjs:1099 emits `who_he_is_date` bare, seven lines under a
// `tone_stale` boolean — see cross-file note in the repair report).
function whoStale(who = readJson(WHO), now = new Date()) {
  if (!who || !who.fingerprint) return { present: false, stale: true, age_days: null };
  const age = ageInDays(who.date, now);
  return { present: true, stale: !(age === 0), age_days: age, date: who.date || null };
}

// ---------------------------------------------------------------------------
// L4 — THE THALAMIC RECALL REFLEX (per-turn; win-only, never theatre)
// ---------------------------------------------------------------------------
async function recallReflex(turnText, deps = {}) {
  const t = String(turnText || "").trim();
  if (t.length < 15) return null;                   // tiny turns carry no recall signal
  const episodes = (deps.episodes || readLines(EPISODES)).filter(e => e.vec);
  const who = deps.who !== undefined ? deps.who : readJson(WHO);
  if (!episodes.length && !(who && (who.open_threads || []).length)) return null;
  const embed = deps.embed || embedPool;
  const q = await embed([t]).catch(() => null);
  if (!q || !q[0]) return null;                     // lane dry → honest silence
  let best = null;
  for (const e of episodes) {
    const s = cosine(q[0], e.vec);
    if (s >= (deps.threshold || RECALL_THRESHOLD) && (!best || s > best.score)) best = { score: s, id: e.id, kind: e.kind, day: e.day, text: e.text };
  }
  // open threads match lexically (few, short — no embedding round-trip needed)
  // scan-fix 15 Jul: \W+ split was Devanagari-blind — Unicode words, both scripts
  const uniWords = (s) => String(s).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => (/[ऀ-ॿ]/.test(w) ? w.length >= 2 : w.length > 3));
  const words = new Set(uniWords(t));
  for (const th of (who && who.open_threads) || []) {
    const overlap = uniWords(th).filter(w => words.has(w)).length;
    if (overlap >= 3 && !best) best = { score: 0.56, id: "thread:" + textHash(String(th)), kind: "thread", day: who.date, text: String(th) };
  }
  if (!best) return null;
  // E2E audit (25 Jul 2026): `recalls` was DEAD WIRING — memoryStrength stretches
  // stability by it, but nothing on the whole repo ever wrote anything but the
  // literal 0. So a doubt he circled back to six times decayed exactly like one
  // he never touched again, and consolidate-store retired it to cold. A surfaced
  // episode IS a review — count it here, where the reflex actually fires.
  // Once per DAY, not per turn: the same episode surfacing five times in one
  // session is one review, not five (unbounded stretch = never forgotten).
  // A lexical "thread:" hit is not an episode row — nothing to bump.
  if (!String(best.id).startsWith("thread:")) {
    const bump = deps.bump || (deps.episodes ? (() => false) : bumpRecall);
    try { bump(best.id, localDate(deps.now || new Date())); } catch { }
  }
  return { id: best.id, kind: best.kind, text: best.text, hint: `${best.kind} · ${best.day} · his words: "${best.text}"`, score: Math.round(best.score * 100) / 100 };
}
// ---------------------------------------------------------------------------
// #18 — L4b: THE LEXICAL RECALL REFLEX (the twin a HOOK can afford)
// ---------------------------------------------------------------------------
// recallReflex above has exactly one runtime caller — dugout.mjs:2928, gated on
// `body.modality === "voice"`. Voice went quiet on 30 Jul; the surface he
// actually works on (Claude Code) gets memory ONCE, at SessionStart, and never
// again for the next five hours. The obvious fix — "add a UserPromptSubmit hook
// that calls recallReflex" — is refused here, for two measured reasons:
//   (a) IT WOULD BLOCK THE EDITOR. recallReflex embeds the turn. embedPool walks
//       loadKeys() (10 keys, measured) at EMBED_TIMEOUT_MS = 15s each, so a dry
//       or 429'd pool is up to ~150 SECONDS with his cursor frozen. The capture
//       nerve on the same hook chain states the law it would break —
//       hooks/afferent-post.mjs:10, "NEVER blocks the session: hard ~250ms".
//   (b) IT WOULD WRITE HIS FSRS STATE FROM A HOOK. recallReflex's default
//       `bump` is bumpRecall, which appends to the journal the sweep folds into
//       `recalls` — and `recalls` STRETCHES the forgetting curve
//       (memoryStrength). A hook firing on every keystroke-turn would inflate
//       the review count of whatever happens to be lexically near his prompt,
//       and a memory that is "reviewed" every turn is a memory that never
//       decays. NOTHING HERE CALLS bumpRecall. That is deliberate and load-
//       bearing, not an omission.
// So this twin is pure disk + arithmetic: no fetch, no key ladder, no write to
// episodes.jsonl and no write to recall_bumps.jsonl. It scores the SAME two
// surfaces the embedded reflex does (durable episodes ⊕ who_he_is open threads)
// with a binary bag-of-words cosine over the same Unicode word split.
//
// THE BAR IS DERIVED, NOT GUESSED. This organ already fixes one lexical bar —
// the open-thread rule at recallReflex above: "≥ 3 distinct content words
// overlap". Expressed in the metric THIS path scores in — |A∩B| / √(|A|·|B|) —
// against the material that rule was written for (an open_thread runs ~8-12
// content words, matched against a turn of similar size), that same bar is
//     3 / √(10 · 10) = 0.30.
// So 0.30 is not a new number: it is the bar this file already ships, restated
// in a normalised metric. The normalisation is the whole point — measured on
// the real corpus (210 of his claude-code turns, 30 Jul–4 Aug, against the live
// 16 episodes + who_he_is open threads), the RAW ≥3 overlap fires on 88/210 =
// 42% of turns (long episodes win on length alone: that is theatre, not
// recall), while the same bar normalised fires on 7/193 = 3.6%, and the top
// three are all genuine — his ADHD-PI teaching preference, his "two things per
// thread" rule, and his restart-hallucinations thread.
// Env-overridable so he can retune it from data rather than from an argument.
const LEXICAL_HINT_MIN = Number(process.env.HIPPO_LEXICAL_HINT_MIN || 0.30);
const RECALL_HINTS = join(HIPPO_DIR, "recall_hints.jsonl");
const hintWords = (s) => String(s).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => (/[ऀ-ॿ]/.test(w) ? w.length >= 2 : w.length > 3));
function bowCosine(a, b) { let o = 0; for (const w of a) if (b.has(w)) o++; return (a.size && b.size) ? o / Math.sqrt(a.size * b.size) : 0; }
function recallReflexLexical(turnText, deps = {}) {
  const t = String(turnText || "").trim();
  const min = deps.threshold !== undefined ? deps.threshold : LEXICAL_HINT_MIN;
  if (t.length < 15) return { hit: null, scored: 0, best: 0, min, why: "turn too short (<15 chars) — the same floor the embedded reflex uses" };
  const q = new Set(hintWords(t));
  if (q.size < 3) return { hit: null, scored: 0, best: 0, min, why: "fewer than 3 content words" };
  const episodes = deps.episodes || readLines(EPISODES);
  const who = deps.who !== undefined ? deps.who : readJson(WHO);
  let best = null, bestScore = 0, scored = 0;
  for (const e of episodes) {
    if (!e || !e.text) continue;
    scored++;
    const s = bowCosine(q, new Set(hintWords(e.text)));
    // ties break toward the MORE RECENT moment — an old duplicate never wins
    if (s > bestScore || (s === bestScore && best && String(e.day || "") > String(best.day || ""))) {
      if (s > 0) { bestScore = s; best = { id: e.id, kind: e.kind, day: e.day, text: e.text }; }
    }
  }
  for (const th of (who && who.open_threads) || []) {
    scored++;
    const s = bowCosine(q, new Set(hintWords(th)));
    if (s > bestScore) { bestScore = s; best = { id: "thread:" + textHash(String(th)), kind: "thread", day: (who && who.date) || null, text: String(th) }; }
  }
  const score = Math.round(bestScore * 100) / 100;
  if (!best || bestScore < min) return { hit: null, scored, best: score, min, why: `nothing over the bar (best ${score} < ${min})` };
  return {
    hit: { ...best, score, hint: `${best.kind} · ${best.day} · his words: "${String(best.text).slice(0, 300)}"` },
    scored, best: score, min, why: "earned",
  };
}
// The ONLY write on this path, and only when a hint is actually EARNED. It is
// not bumpRecall (see (b) above) — it is an observability journal, so "has the
// hint ever fired?" is answerable at all. Silent turns write nothing, so the
// file grows at the measured fire rate (~3.6% of turns), not per turn: that is
// what keeps it from becoming another unbounded log.
function logRecallHint(row, file = RECALL_HINTS) {
  try { mkdirSync(dirname(file), { recursive: true }); appendFileSync(file, JSON.stringify(row) + "\n"); return true; } catch { return false; }
}
// The bump is an APPEND-ONLY JOURNAL, not an edit of episodes.jsonl. Why: the
// reflex fires in-process inside the Dugout on every turn, while `hippocampus.mjs
// mark` runs as a separate child — two read-modify-writes of the same file would
// clobber each other and could drop a freshly marked moment. An O_APPEND line
// cannot. The hourly `index` sweep (the single writer) folds the journal in.
const RECALL_BUMPS = join(HIPPO_DIR, "recall_bumps.jsonl");
function bumpRecall(id, today = localDate(), file = RECALL_BUMPS) {
  try {
    if (!id || String(id).startsWith("thread:")) return false;   // a thread is not an episode row
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, JSON.stringify({ id, day: today }) + "\n");
    return true;
  } catch { return false; }
}
// fold the journal into the rows (mutates in place; caller persists + clears).
// One stretch per episode per DAY — five surfacings in one session is ONE review.
function applyRecallBumps(rows, deps = {}) {
  const journal = (deps.bumps || readLines(RECALL_BUMPS)).filter(b => b && b.id && b.day).sort((a, b) => String(a.day).localeCompare(String(b.day)));
  if (!journal.length) return 0;
  const byId = new Map(rows.map(r => [r.id, r]));
  const seen = new Set();
  let applied = 0;
  for (const b of journal) {
    const key = b.id + "|" + b.day;
    if (seen.has(key)) continue;
    seen.add(key);
    const r = byId.get(b.id);
    // monotonic, so a replay can never double-count: the journal is cleared only
    // after a successful persist, and a crash in between would otherwise re-fold.
    // (id absent = pruned to a cold shard — nothing to stretch, drop it.)
    if (!r || String(b.day) <= String(r.last_recall_day || "")) continue;
    r.recalls = (r.recalls || 0) + 1;
    r.last_recall_day = b.day;
    applied++;
  }
  return applied;
}

// ---------------------------------------------------------------------------
// L0 — THE REHYDRATOR cartridge (identity + who + last-N durable episodes)
// ---------------------------------------------------------------------------
function buildRehydrateCartridge(deps = {}) {
  const parts = [];
  const now = deps.now || new Date();
  const idc = identityCartridge(deps.facts !== undefined ? deps.facts : readJson(FACTS), now);
  if (idc) parts.push(idc);
  const whc = whoCartridge(deps.who !== undefined ? deps.who : readJson(WHO), now);
  if (whc) parts.push(whc);
  const eps = (deps.episodes || readLines(EPISODES)).slice(-(deps.n || 8));
  if (eps.length) parts.push(`DURABLE EPISODES (the Scribe's last ${eps.length} — real, verbatim):\n${eps.map(e => `- [${e.kind} · ${e.day}] ${e.text}`).join("\n")}`);
  return parts.length ? parts.join("\n\n") : null;
}

// ---------------------------------------------------------------------------
// M10 — CONSOLIDATE-STORE: month shards + biological forgetting (prune = move
// to cold, NEVER delete). The hot working set stays O(recent).
// ---------------------------------------------------------------------------
function memoryStrength(e, now = new Date()) {
  const ageDays = Math.max(0, (now - new Date(e.ts)) / 86400000);
  // FSRS-flavoured: base ~30d half-life-ish; each recall stretches it; a stated
  // preference decays 3× slower (identity-adjacent). Hot ≥0.25 ≈ 6 weeks fresh.
  const stability = 30 * (1 + (e.recalls || 0) * 2) * (e.kind === "preference" ? 3 : 1);
  return Math.exp(-ageDays / stability);
}
function consolidateStore(deps = {}) {
  const now = deps.now || new Date();
  const rows = deps.episodes || readLines(EPISODES);
  if (!rows.length) return { ok: true, hot: 0, sharded: 0, cold: 0 };
  const thisMonth = localDate(now).slice(0, 7);
  const hot = [], byMonth = {}, cold = [];
  for (const e of rows) {
    const strength = memoryStrength(e, now);
    const month = String(e.day || "").slice(0, 7) || "unknown";
    if (month === thisMonth || strength >= (deps.keep_threshold || 0.25)) hot.push(e);
    else if (strength >= (deps.cold_threshold || 0.05)) (byMonth[month] = byMonth[month] || []).push(e);
    else cold.push(e);
  }
  const writes = deps.write || ((p, rs) => writeAtomic(p, rs.map(x => JSON.stringify(x)).join("\n") + "\n"));
  let sharded = 0;
  for (const [m, rs] of Object.entries(byMonth)) {
    const p = join(COLD_DIR, `episodes_${m}.jsonl`);
    const existing = deps.readShard ? deps.readShard(m) : readLines(p);
    const seen = new Set(existing.map(r => r.id));
    writes(p, existing.concat(rs.filter(r => !seen.has(r.id))));
    sharded += rs.length;
  }
  if (cold.length) {
    const p = join(COLD_DIR, "episodes_forgotten.jsonl");
    const existing = deps.readForgotten ? deps.readForgotten() : readLines(p);
    const seen = new Set(existing.map(r => r.id));
    writes(p, existing.concat(cold.filter(r => !seen.has(r.id))));
  }
  writes(deps.hotPath || EPISODES, hot);
  return { ok: true, hot: hot.length, sharded, cold: cold.length };
}

// ---------------------------------------------------------------------------
// selftest
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const mockEmbed = async (ts) => ts.map(t => /token/i.test(t) ? [1, 0] : /cosine|embed/i.test(t) ? [0.9, 0.44] : [0, 1]);

  // L1 — the Scribe
  {
    const rows = [];
    const bad = await markMoment("vibe", "x", { append: r => rows.push(r), embed: mockEmbed });
    assert("SCRIBE: unknown kind rejected (doubt|win|preference|thread only)", bad.ok === false && rows.length === 0);
    // scan-fix 15 Jul: the VERBATIM LAW has teeth now — narrator voice rejected
    const para = await markMoment("doubt", "He's actively questioning if I am updating memory", { append: r => rows.push(r), embed: mockEmbed });
    assert("SCRIBE: a third-person paraphrase is REJECTED (his words or nothing)", para.ok === false && para.error.includes("first person") && rows.length === 0);
    // AUDIT 4 Aug 2026 (#16) — THE TWO ESCAPEES, verbatim from episodes.jsonl.
    // Both are the coach narrating its OWN error, both tagged kind:"doubt" (the
    // class reserved for HIS confusion), both live in every cartridge today —
    // 2 of the 8 rehydrate slots, 2 of MEMO_EPISODES=6 in the SessionStart
    // brief. The old guard let them in because "flagged" and "asked" were not
    // in its verb enumeration. Pinned here so the next one cannot walk in.
    const ESCAPEE_1 = "He flagged my confusion about being 'on a call with Nidhi' when I was actually reading his state update.";
    const ESCAPEE_2 = "Captain asked definitively who was talking to Nidhi; I need to clarify it was HIS conversation, not mine.";
    const e1 = await markMoment("doubt", ESCAPEE_1, { append: r => rows.push(r), embed: mockEmbed });
    const e2 = await markMoment("doubt", ESCAPEE_2, { append: r => rows.push(r), embed: mockEmbed });
    assert("SCRIBE #16: 'He flagged…' and 'Captain asked…' — the two rows that ARE in his cartridge right now — are now REJECTED",
      e1.ok === false && e2.ok === false && rows.length === 0);
    assert("SCRIBE #16: and the OLD guard genuinely let both through (this is the regression, not a tautology)",
      NARRATOR_RE_LEGACY.test(ESCAPEE_1) === false && NARRATOR_RE_LEGACY.test(ESCAPEE_2) === false && NARRATOR_RE_LEGACY.test("He said the thing") === true);
    // …and the widening must not start refusing HIS voice. These are real
    // first-person openers from the live corpus and from his Hinglish.
    const hisVoice = [
      "hello, i am confused about how attention works",
      "hallucination tab hota hai jab model grounded nahi hai",
      "shaky and guessed mein kya difference hain??",
      "captaincy ka matlab kya hota hai in this context",     // "captain" only as a prefix of a longer word
    ];
    const kept = [];
    for (const v of hisVoice) kept.push((await markMoment("doubt", v, { append: () => {}, embed: mockEmbed })).ok);
    assert("SCRIBE #16: the wider guard still accepts HIS first-person voice (no over-rejection)", kept.every(Boolean));
    const ok = await markMoment("doubt", "tokenization feels like magic not math", { append: r => rows.push(r), embed: mockEmbed, now: new Date("2026-07-14T10:00:00Z") });
    assert("SCRIBE: moment lands verbatim + embedded + day-stamped", ok.ok && ok.embedded && rows[0].text === "tokenization feels like magic not math" && rows[0].day && rows[0].kind === "doubt");
    const off = await markMoment("win", "held the derby", { append: r => rows.push(r), embed: async () => null });
    assert("SCRIBE: pool dry → moment still lands (vec null, sweep later)", off.ok && rows[1].vec === null);
    // E2E audit 25 Jul 2026 — ORDER is the fix: durable append BEFORE the embed.
    // A hung pool (the dugout kills the child at 60s) must never eat a moment.
    let order = null, embedStarted = false;
    const hung = await markMoment("doubt", "does my moment survive a hung embedding pool", {
      append: r => { order = embedStarted ? "after-embed" : "before-embed"; rows.push(r); },
      embed: async () => { embedStarted = true; await new Promise(r => setTimeout(r, 10)); return null; },
    });
    assert("SCRIBE: the durable append happens BEFORE the embed round-trip (a stalled pool can never eat a moment)", hung.ok && hung.durable === true && order === "before-embed" && rows[2].vec === null);
    // …and the other half of the same audit finding: the embed fetch itself was
    // un-abortable. Injected fetchFn — no wire is touched here.
    const timersBefore = process.getActiveResourcesInfo().filter(r => r === "Timeout").length;
    let sawSignal;
    const nulled = await embedPool(["x"], ["k1", "k2"], async (_u, o) => { sawSignal = o.signal; return { ok: false }; });
    assert("embedPool carries an AbortSignal per key and clears its timer (it could hang forever before)", nulled === null && sawSignal instanceof AbortSignal && sawSignal.aborted === false && process.getActiveResourcesInfo().filter(r => r === "Timeout").length <= timersBefore);
  }
  // the embed-pending sweep
  {
    let written = null;
    const rows = [{ id: "a", text: "tokenization thing", vec: null }, { id: "b", text: "done", vec: [1, 0] }];
    const tmp = join(os.tmpdir(), `hippo-test-${Date.now()}.jsonl`);
    writeFileSync(tmp, rows.map(r => JSON.stringify(r)).join("\n") + "\n");
    const n = await indexEpisodes({ embed: mockEmbed, file: tmp, write: (rs) => { written = rs; } });
    assert("sweep embeds ONLY the pending rows (idempotent by shape)", n === 1 && written[0].vec && written[1].vec[0] === 1);
    // E2E audit 25 Jul 2026 — a 100+ backlog used to go out as ONE oversized
    // batch, get 400 on every key, and report a bare "0" forever. Chunk to the
    // wire cap, and make a failed sweep readable as failure, not as "nothing to do".
    const many = Array.from({ length: 250 }, (_, i) => ({ id: "p" + i, text: "pending moment " + i, vec: null }));
    const tmpBig = join(os.tmpdir(), `hippo-batch-${Date.now()}.jsonl`);
    writeFileSync(tmpBig, many.map(r => JSON.stringify(r)).join("\n") + "\n");
    const sizes = [];
    const wireCapped = async (ts) => { sizes.push(ts.length); return ts.length > 100 ? null : ts.map(() => [0, 1]); };
    const big = await indexEpisodesDetailed({ embed: wireCapped, file: tmpBig, write: () => { } });
    assert("sweep chunks to the 100-request wire cap (a 100+ backlog used to fail forever)", big.embedded === 250 && sizes.length === 3 && sizes.every(s => s <= EMBED_BATCH_CAP));
    const dryRun = await indexEpisodesDetailed({ embed: async () => null, file: tmpBig, write: () => { } });
    assert("sweep tells 'nothing pending' apart from 'every batch failed'", dryRun.pending === 250 && dryRun.failed === 250 && dryRun.ok === false && (await indexEpisodesDetailed({ embed: mockEmbed, file: tmp, write: () => { } })).ok === true);
    // the sweep is the single writer, so it is also where the recall journal lands
    const tmpFull = join(os.tmpdir(), `hippo-full-${Date.now()}.jsonl`);
    writeFileSync(tmpFull, JSON.stringify({ id: "b", text: "done", vec: [1, 0] }) + "\n");
    let folded = null;
    const withBumps = await indexEpisodesDetailed({ embed: async () => { throw new Error("nothing pending — the pool must not be touched"); }, file: tmpFull, bumps: [{ id: "b", day: "2026-07-20" }], write: (rs) => { folded = rs; } });
    assert("sweep folds the recall journal even with NOTHING pending, and spends no pool call", withBumps.recalls === 1 && withBumps.embedded === 0 && folded.find(r => r.id === "b").recalls === 1);
  }

  // L2 — the Ledger of Self
  {
    let store = { facts: [] };
    const deps = { read: () => store, write: (o) => { store = o; }, now: new Date("2026-07-14T10:00:00Z") };
    const r1 = rememberFact("main Delhi mein rehta hoon, mornings are my best hours", deps);
    assert("LEDGER: fact held verbatim with an id", r1.ok && store.facts[0].text.includes("Delhi") && store.facts[0].id);
    const r2 = rememberFact("main Delhi mein rehta hoon, mornings are my best hours", deps);
    assert("LEDGER: duplicate fact not doubled (already held)", r2.note === "already held" && store.facts.length === 1);
    for (let i = 0; store.facts.length < FACTS_CAP; i++) rememberFact(`fact ${i}`, deps);
    const over = rememberFact("one too many", deps);
    assert(`LEDGER: hard cap at ${FACTS_CAP} — must stay small enough to ALWAYS inject`, over.ok === false && over.error.includes("forget"));
    const gone = forgetFact(r1.id, deps);
    assert("LEDGER: forget removes by id, surfaced", gone.ok && !store.facts.some(f => f.id === r1.id));
    assert("LEDGER: forget unknown id is an honest error", forgetFact("nope", deps).ok === false);
    const cart = identityCartridge({ facts: [{ id: "x1", text: "mornings are my best hours" }] });
    assert("cartridge carries EVERY fact, marked always-present", cart.includes("ALWAYS present") && cart.includes("mornings"));
    assert("no facts → empty cartridge, constitution unchanged", identityCartridge({ facts: [] }) === "");
  }
  // AUDIT 4 Aug 2026 (#13) — the stored `ts` was silently discarded at render,
  // so a 17-Jul assertion arrived looking exactly like something he said today.
  // Reproduced with the LIVE fact texts (identity_facts.json, both ts 17 Jul).
  {
    const NOW = new Date("2026-08-04T10:00:00Z");
    const live = { facts: [
      { id: "fb5d5a86", ts: "2026-07-17T22:00:00.000Z", text: "this is the first day that we are working together on the organism" },
      { id: "88e5349a", ts: "2026-07-17T22:15:00.000Z", text: "I am bringing my friend to whom you need to explain everything" },
    ] };
    const dated = identityCartridge(live, NOW);
    // 17 Jul → 4 Aug = 18 calendar days. Arithmetic, not a label.
    assert("LEDGER #13: a 17-Jul fact ARRIVES DATED and aged — it can no longer pass as today's word",
      dated.includes("(2026-07-17 · 18d ago)") && dated.includes("first day that we are working together") && !/\(2026-07-17 · today\)/.test(dated));
    assert("LEDGER #13: the header says a fact is true AS OF ITS DATE, and that only HE retires one (Law 4)",
      dated.includes("true AS OF ITS DATE") && dated.includes("forget <id>"));
    const today = identityCartridge({ facts: [{ id: "t1", ts: "2026-08-04T02:00:00.000Z", text: "aaj se hallucinations" }] }, NOW);
    assert("LEDGER #13: a fact written TODAY reads 'today', not '0d ago'", today.includes("(2026-08-04 · today)"));
    // assert on the FACT LINE, not the whole block — the header legitimately
    // contains the word "today" ("not automatically true today").
    const factLine = (c) => c.split("\n").filter(l => l.startsWith("- ")).join("\n");
    const undated = factLine(identityCartridge({ facts: [{ id: "u1", text: "no timestamp at all" }] }, NOW));
    const junk = factLine(identityCartridge({ facts: [{ id: "u2", ts: "not-a-date", text: "junk stamp" }] }, NOW));
    assert("LEDGER #13: an absent/unreadable ts is SAID OUT LOUD — an unmeasured age is never rendered as fresh",
      undated === "- (undated — provenance unknown) no timestamp at all [u1]"
      && junk === "- (not-a-date · age unreadable) junk stamp [u2]");
    // the frozen legacy is still the old renderer, verbatim (layering law)
    assert("LEDGER #13: the legacy undated renderer is frozen in place, not deleted",
      identityCartridgeLegacy(live) === `THE LEDGER OF SELF (facts he told you to hold — ALWAYS present, never guessed):\n- ${live.facts[0].text} [fb5d5a86]\n- ${live.facts[1].text} [88e5349a]`);
  }
  // E2E audit 25 Jul 2026 — dedupe used to compare the FULL input against the
  // already-truncated stored row, so long facts duplicated under ONE shared id.
  {
    let store = { facts: [] };
    const deps = { read: () => store, write: (o) => { store = o; }, now: new Date("2026-07-14T10:00:00Z") };
    const long = "the interview arc runs through retrieval and evals, and " + "detail ".repeat(40);
    const a = rememberFact(long, deps);
    const b = rememberFact(long, deps);
    assert("LEDGER: a >240-char fact dedupes against its OWN stored (truncated) form — no twins sharing one id", long.length > 240 && a.ok && b.note === "already held" && b.id === a.id && store.facts.length === 1 && store.facts[0].id === textHash(store.facts[0].text));
  }

  // L3 — the Consolidator (AI proposes · code validates)
  {
    const goodWho = { fingerprint: "Deep in attention mechanics, tokenization locked.", open_threads: ["why kv-cache doesn't fix quadratic attention"], recent_wins: ["retired the softmax doubt"], recent_cracks: ["eval metrics still shaky"], voice_tuning: "wants full lectures, no fragments", do_not: ["stop suggesting breaks mid-flow"] };
    let written = null;
    const mat = { episodes: [{ day: "2026-07-14", kind: "doubt", text: "kv cache doubt" }], captain_lines: ["CAPTAIN: kv cache samajh nahi aaya"], calibration: {} };
    const ok = await consolidate({ generate: async () => ({ ok: true, text: "```json\n" + JSON.stringify(goodWho) + "\n```" }), material: mat, readWho: () => null, writeWho: (o) => { written = o; }, now: new Date("2026-07-14T02:00:00Z") });
    assert("CONSOLIDATOR: valid JSON (even fenced) → who_he_is written + dated", ok.ok && written.fingerprint.includes("attention") && written.date === "2026-07-14");
    let kept = true;
    const bad1 = await consolidate({ generate: async () => ({ ok: true, text: "not json at all" }), material: mat, readWho: () => goodWho, writeWho: () => { kept = false; } });
    assert("CONSOLIDATOR: unparseable → REJECTED, the old file stands", bad1.ok === false && kept);
    const bad2 = await consolidate({ generate: async () => ({ ok: true, text: JSON.stringify({ ...goodWho, fingerprint: "10x growth mindset unlocked" }) }), material: mat, readWho: () => goodWho, writeWho: () => { kept = false; } });
    assert("CONSOLIDATOR: banned phrase → REJECTED (honest frame in the validator)", bad2.ok === false && bad2.error.includes("banned") && kept);
    const bad3 = await consolidate({ generate: async () => ({ ok: true, text: JSON.stringify({ ...goodWho, voice_tuning: "his stress_level seemed high" }) }), material: mat, readWho: () => goodWho, writeWho: () => { kept = false; } });
    assert("CONSOLIDATOR: affect inference → REJECTED (prosody never enters memory)", bad3.ok === false && bad3.error.includes("affect") && kept);
    const bad4 = await consolidate({ generate: async () => ({ ok: true, text: JSON.stringify({ fingerprint: "x" }) }), material: mat, readWho: () => goodWho, writeWho: () => { kept = false; } });
    assert("CONSOLIDATOR: missing schema keys → REJECTED", bad4.ok === false && kept);
    const skip = await consolidate({ generate: async () => { throw new Error("must not be called"); }, material: { episodes: [], captain_lines: [], calibration: {} }, readWho: () => goodWho, writeWho: () => {} });
    assert("CONSOLIDATOR: no fresh material → skips, spends nothing", skip.skipped === true);
    assert("who cartridge reads back threads + tuning", whoCartridge({ ...goodWho, date: "2026-07-14" }, new Date("2026-07-14T09:00:00Z")).includes("kv-cache") && whoCartridge({ ...goodWho, date: "2026-07-14" }, new Date("2026-07-14T09:00:00Z")).includes("full lectures"));
    // AUDIT 4 Aug 2026 (#17) — learning-arc turns are FRESH MATERIAL. Before
    // this, both wired surfaces were dry on a normal day, so the early-return
    // WAS the normal path and who_he_is simply froze at its last good date.
    let arcWritten = null;
    const arcOnly = await consolidate({
      generate: async () => ({ ok: true, text: JSON.stringify(goodWho) }),
      material: { episodes: [], captain_lines: [], calibration: {}, learning_arc: [{ day: "2026-07-14", concepts: ["hallucination"], text: "hallucination tab hota hai jab model grounded nahi hai" }], learning_arc_counter: "1/24 of his typed turns are learning-arc (canon vocab: 122 terms)" },
      readWho: () => goodWho, writeWho: (o) => { arcWritten = o; }, now: new Date("2026-07-14T02:00:00Z"),
    });
    assert("CONSOLIDATOR #17: learning-arc turns alone UNFREEZE the consolidation (0 episodes, 0 captain lines)",
      arcOnly.ok === true && arcWritten && arcOnly.have.learning_arc === 1 && arcOnly.have.episodes === 0);
    assert("CONSOLIDATOR #106: the result carries a have/need counter, not a bare status word",
      /1\/24 of his typed turns/.test(arcOnly.arc_counter || ""));
    const skip2 = await consolidate({ generate: async () => { throw new Error("must not be called"); }, material: { episodes: [], captain_lines: [], calibration: {}, learning_arc: [], learning_arc_counter: "0/24 of his typed turns are learning-arc (canon vocab: 122 terms)" }, readWho: () => goodWho, writeWho: () => {} });
    assert("CONSOLIDATOR: a skip states WHAT was measured — an honest zero, not a silent one",
      skip2.skipped === true && /0 episodes, 0 captain lines, 0 learning-arc turns/.test(skip2.reason) && /0\/24 of his typed turns/.test(skip2.reason));
    // FOUND 4 Aug 2026 (not in the audit): the 12,000-char material budget was
    // being eaten by a single episode's 3,072-float embedding. Measured live:
    // the 31 Jul/1 Aug window stringified to 238,169 chars with the first "vec"
    // at index 356 — one episode's text, then 11,644 chars of numbers.
    const fatEpisode = { id: "e", ts: "2026-07-14T01:00:00Z", day: "2026-07-14", kind: "doubt", text: "kv cache doubt", vec: Array.from({ length: 3072 }, () => 0.0123456789), recalls: 0 };
    const tmpEps = join(os.tmpdir(), `hippo-mat-${Date.now()}.jsonl`);
    writeFileSync(tmpEps, JSON.stringify(fatEpisode) + "\n" + JSON.stringify({ ...fatEpisode, id: "e2", text: "second real moment" }) + "\n");
    const mat2 = gatherDayMaterial(new Date("2026-07-14T12:00:00Z"), { episodes: tmpEps, outDir: join(os.tmpdir(), "no-such-dugout-dir"), calibration: join(os.tmpdir(), "no-such-cal.json"), afferent: [], concepts: null, sprint: null });
    const matJson = JSON.stringify(mat2);
    assert("CONSOLIDATOR: episode EMBEDDINGS never reach the prompt — the whole window fits in the 12,000-char budget",
      JSON.stringify([fatEpisode]).length > 12000 && matJson.length < 12000 && !matJson.includes("0.0123456789")
      && mat2.episodes.length === 2 && mat2.episodes[1].text === "second real moment");
  }
  // AUDIT 4 Aug 2026 (#15) — STALE-SAFE: age may only ever DEGRADE, never lift.
  {
    const who = { date: "2026-07-20", fingerprint: "FP", open_threads: ["t"], recent_wins: [], voice_tuning: "v", do_not: ["Do not do X today"] };
    const fresh = whoCartridge({ ...who, date: "2026-08-04" }, new Date("2026-08-04T10:00:00Z"));
    assert("WHO #15: consolidated TODAY is the only state allowed to say RIGHT NOW",
      fresh.startsWith("WHO HE IS RIGHT NOW (consolidated 2026-08-04)") && !fresh.includes("AS OF"));
    // the reproduced 10-day window: 21-30 Jul the cartridge asserted "RIGHT NOW"
    // over a 2026-07-20 consolidation, into the voice prompt and get_context.
    const stale = whoCartridge(who, new Date("2026-07-30T10:00:00Z"));
    assert("WHO #15: a 10-day-old consolidation STOPS claiming RIGHT NOW and states its age",
      !stale.includes("RIGHT NOW") && stale.includes("WHO HE IS AS OF 2026-07-20") && stale.includes("10d old") && stale.includes("verify before acting"));
    assert("WHO #15: nothing is DROPPED on a guess — the day-scoped arrays survive, labelled with their as-of date",
      stale.includes("Do not do X today") && stale.includes("Do not (as of 2026-07-20") && stale.includes("Open threads (as of 2026-07-20"));
    const junk = whoCartridge({ ...who, date: "not-a-date" }, new Date("2026-07-30T10:00:00Z"));
    const ahead = whoCartridge({ ...who, date: "2026-09-01" }, new Date("2026-07-30T10:00:00Z"));
    assert("WHO #15: an unreadable OR future date degrades too — unknown age is never evidence of freshness",
      !junk.includes("RIGHT NOW") && junk.includes("age unreadable") && !ahead.includes("RIGHT NOW") && ahead.includes("age unreadable"));
    assert("WHO #15: whoStale exposes the same verdict as a datum for flag-shaped surfaces",
      whoStale(who, new Date("2026-07-30T10:00:00Z")).stale === true && whoStale(who, new Date("2026-07-30T10:00:00Z")).age_days === 10
      && whoStale({ ...who, date: "2026-07-30" }, new Date("2026-07-30T10:00:00Z")).stale === false
      && whoStale(null).present === false);
    assert("WHO #15: the legacy undegraded renderer is frozen in place, not deleted",
      whoCartridgeLegacy(who).startsWith("WHO HE IS RIGHT NOW (consolidated 2026-07-20)"));
  }

  // L4 — the recall reflex
  {
    const eps = [{ id: "e1", kind: "doubt", day: "2026-07-10", text: "tokenization subwords doubt", vec: [1, 0], recalls: 0 }, { id: "e2", kind: "win", day: "2026-07-11", text: "unrelated", vec: [0, 1], recalls: 0 }];
    const hit = await recallReflex("wait tokens and subwords again, how does tokenization split", { episodes: eps, who: null, embed: mockEmbed });
    assert("REFLEX: a related turn surfaces HIS OWN past words with the date", hit && hit.id === "e1" && hit.hint.includes("2026-07-10") && hit.hint.includes("subwords"));
    const miss = await recallReflex("completely different topic about cricket scores today", { episodes: eps, who: null, embed: async (ts) => ts.map(() => [-1, 0.2]) });
    assert("REFLEX: below threshold → honest null (never forced theatre)", miss === null);
    const dry = await recallReflex("wait tokens subwords tokenization split how", { episodes: eps, who: null, embed: async () => null });
    assert("REFLEX: lane dry → silence, never a fake recall", dry === null);
    const th = await recallReflex("why does the kv cache not fix quadratic attention scaling", { episodes: [], who: { date: "2026-07-14", open_threads: ["why kv-cache doesn't fix quadratic attention scaling"] }, embed: mockEmbed });
    assert("REFLEX: an open thread resurfaces when he circles back", th && th.kind === "thread" && th.text.includes("kv-cache"));
    assert("REFLEX: tiny turns never trigger a lookup", (await recallReflex("haan ok", { episodes: eps, embed: async () => { throw new Error("no"); } })) === null);
    // E2E audit 25 Jul 2026 — `recalls` was dead wiring: memoryStrength stretches
    // stability by it but NOTHING ever wrote anything but 0, so a doubt he kept
    // circling back to decayed like one he'd abandoned. The reflex counts it now.
    const bumps = [];
    const counted = await recallReflex("wait tokens and subwords again, how does tokenization split", { episodes: eps, who: null, embed: mockEmbed, bump: (id, day) => bumps.push([id, day]), now: new Date("2026-07-14T10:00:00Z") });
    assert("REFLEX: a surfaced episode gets its recall COUNTED (the FSRS stretch was never wired)", counted && counted.id === "e1" && bumps.length === 1 && bumps[0][0] === "e1" && bumps[0][1] === "2026-07-14");
    const tbumps = [];
    await recallReflex("why does the kv cache not fix quadratic attention scaling", { episodes: [], who: { date: "2026-07-14", open_threads: ["why kv-cache doesn't fix quadratic attention scaling"] }, embed: mockEmbed, bump: (id) => tbumps.push(id) });
    assert("REFLEX: a lexical THREAD hit has no episode row — nothing bumped", tbumps.length === 0);
    // the bump is APPEND-ONLY (the reflex runs inside the Dugout while `mark`
    // runs as a child — two rewrites of episodes.jsonl would clobber a moment).
    const tmpB = join(os.tmpdir(), `hippo-bump-${Date.now()}.jsonl`);
    const wrote = [bumpRecall("e1", "2026-07-14", tmpB), bumpRecall("e1", "2026-07-14", tmpB), bumpRecall("e1", "2026-07-15", tmpB), bumpRecall("thread:abc", "2026-07-15", tmpB)];
    const journal = readLines(tmpB);
    assert("REFLEX: the bump only ever APPENDS (no read-modify-write race with a concurrent mark)", wrote.join() === "true,true,true,false" && journal.length === 3 && journal[0].id === "e1");
    // one stretch per DAY: the same episode surfacing five times in a session is
    // one review, not five (per-turn counting = a memory that never decays).
    const target = [{ id: "e1", ts: "2026-07-10T10:00:00Z", kind: "doubt", day: "2026-07-10", text: "tokenization subwords doubt", vec: [1, 0], recalls: 0 }];
    const applied = applyRecallBumps(target, { bumps: journal.concat([{ id: "pruned-to-cold", day: "2026-07-15" }]) });
    assert("REFLEX: the sweep folds the journal — ONE stretch per day, replay-safe, unknown ids dropped", applied === 2 && target[0].recalls === 2 && target[0].last_recall_day === "2026-07-15" && applyRecallBumps(target, { bumps: journal }) === 0);
    const strengthened = memoryStrength(target[0], new Date("2026-08-20T00:00:00Z")) > memoryStrength({ ...target[0], recalls: 0 }, new Date("2026-08-20T00:00:00Z"));
    assert("REFLEX: counted recalls actually STRETCH the forgetting curve (the whole point of the wiring)", strengthened);
  }
  // E2E audit 25 Jul 2026 — generatePool's 120s abort timer was cleared ONLY on
  // the success path, so a fetch that throws (Wi-Fi down) left one armed timer
  // per key × per model holding the event loop open ~2 min after the work ended.
  {
    const liveTimers = () => process.getActiveResourcesInfo().filter(r => r === "Timeout").length;
    const before = liveTimers();
    const dry = await generatePool("x", { models: ["m1", "m2"], keys: ["k1", "k2", "k3"], fetchFn: async () => { throw new Error("ECONNREFUSED"); } });
    assert("GEN: a thrown fetch leaks NO 120s abort timer (the nightly used to hang 2 min after finishing)", dry.ok === false && liveTimers() <= before);
  }

  // L0 — the rehydrator cartridge
  {
    const cart = buildRehydrateCartridge({ facts: { facts: [{ id: "f1", text: "mornings best" }] }, who: { date: "2026-07-14", fingerprint: "attention arc", open_threads: ["kv"], recent_wins: [], voice_tuning: "deep", do_not: [] }, episodes: [{ kind: "doubt", day: "2026-07-13", text: "softmax why" }], now: new Date("2026-07-14T10:00:00Z") });
    assert("REHYDRATOR: identity + who + episodes in ONE cartridge", cart.includes("LEDGER OF SELF") && cart.includes("WHO HE IS") && cart.includes("softmax why"));
    assert("REHYDRATOR: empty organ → null (dormant-safe, no noise)", buildRehydrateCartridge({ facts: null, who: null, episodes: [] }) === null);
    // both age fixes must survive the fusion — this is the object get_context
    // and the SessionStart brief actually hand to a session.
    const aged = buildRehydrateCartridge({
      facts: { facts: [{ id: "f1", ts: "2026-07-17T22:00:00Z", text: "this is the first day that we are working together on the organism" }] },
      who: { date: "2026-07-20", fingerprint: "attention arc", open_threads: ["kv"], recent_wins: [], voice_tuning: "deep", do_not: ["do not X today"] },
      episodes: [], now: new Date("2026-07-30T10:00:00Z"),
    });
    // 17 Jul → 30 Jul = 13 calendar days.
    assert("REHYDRATOR #13+#15: the fused cartridge dates the facts AND refuses to call a 10-day-old who_he_is 'RIGHT NOW'",
      aged.includes("(2026-07-17 · 13d ago)") && aged.includes("WHO HE IS AS OF 2026-07-20") && aged.includes("10d old") && !aged.includes("RIGHT NOW"));
  }

  // AUDIT 4 Aug 2026 (#17) — THE LEARNING-ARC FILTER.
  // The trap: `recallWorthy` alone admits his machine-building talk, which the
  // consolidator prompt explicitly bans. Both fixture sets below are VERBATIM
  // rows from the live afferent.jsonl.
  {
    const vocab = conceptVocabulary({
      concepts: { concepts: { hallucinations: { aliases: ["hallucination", "grounding"] }, inference: { aliases: ["sampling"] }, tokenization: { aliases: ["tokenizer", "bpe"] }, embeddings: { aliases: [] } }, skills: { python_basics: { aliases: ["python"] } } },
      sprint: { progress: { current: { task: "Hallucinations" } } },
    });
    // 4 concept ids + 5 concept aliases + 1 skill id + 1 skill alias = 11; the
    // sprint's current task ("Hallucinations") normalises onto an id already in
    // the set, so it adds nothing — which is itself the point: one canon.
    assert("ARC: the vocabulary is READ from the committed canon, never hand-listed",
      vocab.length === 11 && vocab.includes(" hallucination ") && vocab.includes(" bpe ") && vocab.includes(" python basics "));
    const ARC_YES = [
      "hallucination is that LLM model creates a well written correct structure of the answer but inside of it everything is mostly incorrect",
      "nahi abhi nahi smjha, pehle ye batao ye hallucination mein jo ye proabibilty se pick horaha hain this is inference and sampling work done right?",
      "bhai embeddings aur tokenization ka farq samjha de",
      "knew - no this is not hallucination because LLM output is grounded (total was mentioned by the user in the prompt)",
    ];
    const ARC_NO = [
      "ntfy ka exact channel batao, let me subscribe and send a throw in that finally stepped into cyborg organism",
      "is everything pushed to the main?? merko smjh nahi aya ki kya kia hain bro, thoda detail mein smjhao",
      "i am turning on ultracode now, do the research again for both layers, install any plugins, mcp servers, tools for this i do not care.",
      "haan ok",                                             // below the quality floor
      ", can you be able to",                                // mid-sentence fragment
      "please continue the work",                            // no concept in the canon
    ];
    assert("ARC: his CONCEPT turns are admitted (verbatim rows from afferent.jsonl)", ARC_YES.every(t => learningArcVerdict(t, vocab).ok === true));
    assert("ARC: his MACHINE-BUILDING turns are refused — the exact category hippocampus.mjs:303 bans", ARC_NO.every(t => learningArcVerdict(t, vocab).ok === false));
    assert("ARC: the refusal says WHY, so a dropped turn is auditable, not silent",
      /machine talk/.test(learningArcVerdict(ARC_NO[0], vocab).why) && /quality floor/.test(learningArcVerdict("haan ok", vocab).why) && /no concept/.test(learningArcVerdict(ARC_NO[5], vocab).why));
    // whole-word matching: "ram" must not fire inside "program"/"Instagram",
    // and "token" must not fire as "tokenization" (it is not a canon alias).
    assert("ARC: the machine lexicon matches WHOLE WORDS — 'program'/'Instagram' are not 'ram'",
      learningArcVerdict("i want to program the hallucination detector by hand from scratch today", vocab).ok === true);
    // an organ's own prompt must never become his fingerprint
    assert("ARC: an organ's own prompt is refused (second-person role framing + an organism marker)",
      learningArcVerdict('For the concept "tokenization", write exactly 3 DISTRACTORS for this learner. Output JSON.', vocab).ok === false);
    // the teaching stream is the coach's words, not his — it must never enter
    const afferent = [
      { ts: "2026-07-14T09:00:00Z", source: "claude-code", modality: "code", text: ARC_YES[0] },
      { ts: "2026-07-14T09:01:00Z", source: "claude-code", modality: "code", text: ARC_YES[0] },   // he repeats himself
      { ts: "2026-07-14T09:02:00Z", source: "claude-code-teaching", modality: "code", text: ARC_YES[1] },
      { ts: "2026-07-14T09:03:00Z", source: "claude-code", modality: "code", text: ARC_NO[0] },
      { ts: "2026-07-11T09:04:00Z", source: "claude-code", modality: "code", text: ARC_YES[2] },   // outside the 2-day window
    ];
    const arc = learningArcTurns(new Date("2026-07-14T23:00:00Z"), { afferent, vocab });
    assert("ARC: only HIS rows, only the 2-day window, deduped — the coach's own teaching stream never enters",
      arc.turns.length === 1 && arc.turns[0].text === ARC_YES[0] && arc.scanned === 3);
    assert("ARC #106: the result is a have/need counter — a zero here is a MEASURED zero over N scanned turns",
      arc.counter === "1/3 of his typed turns are learning-arc (canon vocab: 11 terms)");
    const none = learningArcTurns(new Date("2026-07-14T23:00:00Z"), { afferent: [afferent[3]], vocab });
    assert("ARC: a day of pure machine talk yields 0 — and SAYS 0/1, not silence", none.turns.length === 0 && none.counter.startsWith("0/1"));
    assert("ARC: a missing afferent/registry degrades to empty, never a throw",
      learningArcTurns(new Date(), { afferent: [], concepts: null, sprint: null }).turns.length === 0);
    // per-row clip = markMoment's own 500 (an arc turn can never outweigh a
    // marked moment); row cap = the same .slice(-40) episodes already get
    const longRow = "hallucination detection " + "aur grounding ka farq samjha de bhai ".repeat(60);
    const clipped = learningArcTurns(new Date("2026-07-14T23:00:00Z"), { afferent: [{ ts: "2026-07-14T09:00:00Z", source: "claude-code", modality: "code", text: longRow }], vocab });
    assert("ARC: a runaway paste is clipped to the SAME 500 chars markMoment gives an episode", clipped.turns[0].text.length === ARC_ROW_CHARS && ARC_ROW_CHARS === 500);
    const many = Array.from({ length: 60 }, (_, i) => ({ ts: "2026-07-14T09:00:00Z", source: "claude-code", modality: "code", text: `hallucination doubt number ${i} about grounding and detection` }));
    const capped = learningArcTurns(new Date("2026-07-14T23:00:00Z"), { afferent: many, vocab });
    assert("ARC: the row cap is the window episodes already get (40), and the counter still reports the true have",
      capped.turns.length === ARC_MAX_ROWS && ARC_MAX_ROWS === 40 && capped.kept === 60 && capped.counter.startsWith("40/60"));
  }

  // AUDIT 4 Aug 2026 (#18) — the HOOK-SAFE lexical reflex.
  {
    const eps = [
      { id: "e1", kind: "preference", day: "2026-08-01", text: "mujhe aaise padhao jaise mein samajh pau, adhd pi hain, ek baar mein ek hi idea do" },
      { id: "e2", kind: "win", day: "2026-07-11", text: "unrelated cricket scores yesterday evening" },
    ];
    const who = { date: "2026-08-01", open_threads: ["why kv-cache doesn't fix quadratic attention scaling"] };
    const hit = recallReflexLexical("hang on, merko aaise bataya karo jaise mein samajh pau, adhd pi hain", { episodes: eps, who });
    assert("REFLEX-LEX #18: a related turn surfaces HIS OWN past words, with the date and the score",
      hit.hit && hit.hit.id === "e1" && hit.hit.hint.includes("2026-08-01") && hit.hit.score >= hit.min);
    const miss = recallReflexLexical("what is the weather in delhi tomorrow afternoon please", { episodes: eps, who });
    assert("REFLEX-LEX #18: below the bar → honest silence, and it SAYS what it measured (never a bare null)",
      miss.hit === null && miss.scored === 3 && typeof miss.best === "number" && /nothing over the bar/.test(miss.why));
    assert("REFLEX-LEX #18: tiny turns never trigger a lookup (same <15-char floor as the embedded reflex)",
      recallReflexLexical("haan ok", { episodes: eps, who }).hit === null && recallReflexLexical("haan ok", { episodes: eps, who }).scored === 0);
    const th = recallReflexLexical("why does the kv cache not fix quadratic attention scaling exactly", { episodes: [], who });
    assert("REFLEX-LEX #18: an open thread resurfaces when he circles back", th.hit && th.hit.kind === "thread" && th.hit.id.startsWith("thread:"));
    // THE TWO HARD CONSTRAINTS from the audit, asserted rather than asserted-to.
    // (a) NO NETWORK: an embed pool that throws must never be reachable, so the
    //     ~150s dry-ladder stall cannot happen on the hook path.
    // (b) NO bumpRecall: this must not stretch his forgetting curve from a hook.
    const journalBefore = readLines(RECALL_BUMPS).length;
    let poolTouched = false;
    const origFetch = globalThis.fetch;
    globalThis.fetch = () => { poolTouched = true; throw new Error("the hook path must never reach the wire"); };
    let threw = null;
    try { recallReflexLexical("hang on, merko aaise bataya karo jaise mein samajh pau, adhd pi hain", { episodes: eps, who }); } catch (e) { threw = e; } finally { globalThis.fetch = origFetch; }
    assert("REFLEX-LEX #18(a): the hook path is NETWORK-FREE — it cannot stall ~150s on a dry embed ladder",
      threw === null && poolTouched === false && typeof recallReflexLexical === "function" && recallReflexLexical.constructor.name === "Function");
    assert("REFLEX-LEX #18(b): a hook hit writes NOTHING to the recall-bump journal — his FSRS stretch is never driven from a hook",
      readLines(RECALL_BUMPS).length === journalBefore && !/bumpRecall/.test(recallReflexLexical.toString()));
    // and it must be fast enough to live on a 250ms hook chain (afferent-post.mjs:10)
    const bigEps = Array.from({ length: 400 }, (_, i) => ({ id: "b" + i, kind: "doubt", day: "2026-07-0" + (i % 9), text: `some remembered moment number ${i} about grounding detection and retrieval quality` }));
    const t0 = Date.now();
    for (let i = 0; i < 20; i++) recallReflexLexical("merko grounding aur detection ka farq samajh nahi aa raha hai bhai", { episodes: bigEps, who });
    const perCall = (Date.now() - t0) / 20;
    assert(`REFLEX-LEX #18: 400 episodes scored in ${perCall.toFixed(1)}ms/call — inside afferent-post.mjs's 250ms law`, perCall < 250);
  }

  // M10 — sharding + biological forgetting
  {
    const now = new Date("2026-07-14T12:00:00Z");
    const eps = [
      { id: "new", ts: "2026-07-13T10:00:00Z", day: "2026-07-13", kind: "doubt", text: "fresh", recalls: 0 },
      { id: "oldstrong", ts: "2026-03-01T10:00:00Z", day: "2026-03-01", kind: "preference", text: "kept by recalls", recalls: 5 },
      { id: "oldmid", ts: "2026-05-20T10:00:00Z", day: "2026-05-20", kind: "doubt", text: "sharded", recalls: 0 },
      { id: "ancient", ts: "2025-09-01T10:00:00Z", day: "2025-09-01", kind: "doubt", text: "forgotten", recalls: 0 },
    ];
    const writes = {};
    const r = consolidateStore({ now, episodes: eps, write: (p, rs) => { writes[p] = rs; }, readShard: () => [], readForgotten: () => [], hotPath: "HOT" });
    assert("M10: this-month + strong memories stay HOT", r.ok && writes.HOT.some(e => e.id === "new") && writes.HOT.some(e => e.id === "oldstrong"));
    assert("M10: mid-strength memories shard by month (moved, not deleted)", Object.keys(writes).some(p => p.includes("2026-05")) && r.sharded === 1);
    assert("M10: the forgetting curve retires ancient noise to cold, never deletes", Object.keys(writes).some(p => p.includes("forgotten")) && r.cold === 1);
    assert("M10: recall working set = hot only (O(recent) by construction)", writes.HOT.length === 2);
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  const stdin = () => { try { return readFileSync(0, "utf8"); } catch { return ""; } };
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "mark") { console.log(JSON.stringify(await markMoment(process.argv[3], stdin()))); return; }
  if (mode === "remember") { console.log(JSON.stringify(rememberFact(stdin()))); return; }
  if (mode === "forget") { console.log(JSON.stringify(forgetFact(process.argv[3]))); return; }
  // E2E audit (25 Jul 2026): "0 pending episode(s) embedded" used to mean BOTH
  // "healthy, nothing to do" and "the batch was rejected on every key". Say which.
  if (mode === "index") {
    const r = await indexEpisodesDetailed();
    console.log(`hippocampus: ${r.embedded}/${r.pending} pending episode(s) embedded${r.recalls ? ` · ${r.recalls} recall(s) counted` : ""}${r.failed ? ` · ${r.failed} FAILED (pool dry or batch rejected) — backlog stands, next sweep retries` : ""}`);
    return;
  }
  if (mode === "recall") { console.log(JSON.stringify(await recallReflex(process.argv.slice(3).join(" ")))); return; }
  // #18 — the HOOK-SAFE door. Read-only w.r.t. memory state, network-free, and
  // silent unless a hint is earned: a UserPromptSubmit hook's stdout is injected
  // into his prompt, so an unearned line would be noise in every single turn.
  // `--explain` is the human door: it prints the have/need counter (what was
  // scored, what the best score was, what the bar is) so a silence is readable
  // as a MEASURED silence and not as "did this ever run?".
  // MEASURED, live: node boot + import + scoring 18 surfaces = 142-198 ms wall
  // clock per invocation (3 runs), i.e. inside afferent-post.mjs's 250 ms law
  // but not by a wide margin — nearly all of it is node's own start-up, not
  // this organ (scoring alone is 2.6 ms at 400 episodes, selftest-measured).
  // The scan stays bounded because consolidateStore keeps episodes.jsonl
  // O(recent) by construction; if that invariant ever breaks, this is the first
  // thing to re-measure.
  if (mode === "recall-hint") {
    const explain = process.argv.includes("--explain");
    const argText = process.argv.slice(3).filter(a => a !== "--explain").join(" ");
    // A Claude Code UserPromptSubmit hook delivers its payload as JSON on
    // stdin, exactly as hooks/afferent-post.mjs:44-53 reads it — accept that
    // shape so the hook needs no shell quoting (which mangles his Hinglish).
    const stdinText = () => {
      let raw = ""; try { raw = readFileSync(0, "utf8"); } catch { return ""; }
      try { const j = JSON.parse(raw || "{}"); return String(j.prompt || j.text || ""); } catch { return raw; }
    };
    const text = argText || stdinText();
    const r = recallReflexLexical(text);
    if (r.hit) {
      logRecallHint({ ts: new Date().toISOString(), id: r.hit.id, kind: r.hit.kind, day: r.hit.day, score: r.hit.score });
      console.log(`RECALL (his own past words, ${r.hit.score} lexical match — weave it only if it earns the turn): ${r.hit.hint}`);
    }
    if (explain) console.log(`  [recall-hint: ${r.hit ? "1" : "0"}/${r.scored} surfaces over the bar · best ${r.best} · bar ${r.min} · ${r.why}]`);
    return;
  }
  if (mode === "cartridge") { console.log(buildRehydrateCartridge() || "(the organ is empty — it fills as he talks)"); return; }
  if (mode === "consolidate") {
    const r = await consolidate({ force: process.argv.includes("--force") });
    const have = r.have ? ` [from ${r.have.episodes} episode(s) · ${r.have.captain_lines} captain line(s) · ${r.have.learning_arc} learning-arc turn(s)]` : "";
    console.log(`hippocampus: consolidate → ${r.ok ? `who_he_is ${r.date} (${r.threads} open threads)` : (r.reason || r.error)}${have}`);
    if (r.arc_counter) console.log(`  ${r.arc_counter}`);
    return;
  }
  // the arc filter, inspectable on its own — "what would tonight's consolidate
  // actually see?" must be answerable without waiting for 02:10.
  if (mode === "arc") {
    const a = learningArcTurns();
    console.log(`hippocampus: learning-arc → ${a.counter}`);
    for (const t of a.turns) console.log(`  [${t.day} · ${t.concepts.join("|")}] ${t.text.replace(/\s+/g, " ").slice(0, 160)}`);
    return;
  }
  if (mode === "consolidate-store") {
    const r = consolidateStore();
    console.log(`hippocampus: store → hot ${r.hot} · sharded ${r.sharded} · forgotten ${r.cold} (moved, never deleted)`);
    return;
  }
  console.log("hippocampus.mjs — mark <kind> | remember | forget <id> | index | recall \"...\" | recall-hint \"...\" [--explain] | arc | cartridge | consolidate [--force] | consolidate-store | selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export {
  markMoment, indexEpisodes, indexEpisodesDetailed, rememberFact, forgetFact,
  identityCartridge, whoCartridge, whoStale, consolidate, validateWho, recallReflex,
  bumpRecall, applyRecallBumps, buildRehydrateCartridge, consolidateStore,
  memoryStrength, generatePool, embedPool, loadKeys as loadHippoKeys,
  // #17 — exported so the recall indexer (dugout.mjs gatherRecallSources /
  // nightshift.mjs embed_backfill) can adopt the SAME tighter-than-recallWorthy
  // bar for #19 in one line, instead of a second filter drifting away from this
  // one. See the cross-file note in the repair report.
  gatherDayMaterial, learningArcTurns, learningArcVerdict, conceptVocabulary,
  // #18 — the hook-safe reflex. Network-free, and it never touches bumpRecall.
  recallReflexLexical,
  // frozen legacies (layering law) — kept readable beside their replacements
  identityCartridgeLegacy, whoCartridgeLegacy, gatherDayMaterialLegacy, NARRATOR_RE_LEGACY,
};
