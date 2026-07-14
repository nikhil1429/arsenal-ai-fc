#!/usr/bin/env node
// ============================================================================
// dugout.mjs · ARSENAL AI FC — THE ORGANISM: THE DUGOUT (metamorphosis chamber)
// ----------------------------------------------------------------------------
// WHAT:  Real-time voice — the captain and the organism, sub-second,
//        interruptible, all day. A local bridge (this file) serves a browser
//        page (mic + speakers) that connects to the Gemini Live API (free
//        tier), with the GAFFER constitution + the captain's measured
//        cognitive fingerprint as the system instruction, and TOOLS that
//        reach into the LIVE BUS mid-sentence:
//          get_today · get_tape_room · retire_doubt · log_reps (voice reps
//          through the REAL capture contract!) · take_note · get_calibration
//          · checkpoint (the match record)
// SCAR-TABLE (JARVIS harvest), applied EMPIRICALLY — probed live 12 Jul 2026
//        against gemini-3.1-flash-live-preview on the real v1beta WS:
//        · responseModalities + speechConfig(Charon) must be NESTED inside
//          generationConfig — the table's root-level claim gets close 1007
//          ("Unknown name responseModalities at 'setup'"). The wire wins.
//        · outputAudioTranscription SURVIVES generation today (verified:
//          audio + transcription + clean turnComplete). Kept — but the scar
//          stays armed: two early aborts and the page strips it live, and
//          the checkpoint tool becomes the match record.
//        · realtimeInput.text works at runtime (audio reply verified);
//          clientContent is history-seeding only.
//        · audioStreamEnd accepted (VAD segment ends).
//        · realtimeInput.video{data,mimeType:image/jpeg} accepted + answered;
//          mediaChunks DEPRECATED (explicit 1007); responseModalities:["TEXT"]
//          rejected outright — this preview model is audio-out only.
//        · Client side (scar, in full): dual AudioContext — 16kHz in,
//          NATIVE-rate out (never lock the output context to 24k) · local
//          VAD + connect-on-voice + park-on-idle (an always-on WS
//          hemorrhages tokens) · Charon = the Gaffer's voice identity.
// METAMORPHOSIS LOOP: every session transcript lands in brain_out/dugout/;
//        the nightly dugout_digest brain job mines it into capsule-doubt
//        proposals, spoken-anchor candidates, and genome evidence. Talking
//        is training; the conversation becomes blood; the blood becomes
//        tomorrow's drills. Both sides of the cyborg evolve.
// MAX-JUICE ENGINEERING: session resumption handles + context-window
//        compression = one conversation stitched across 15-min chunks until
//        the free quota itself runs dry; key-pool rotation across the
//        captain's projects on quota errors; minutes ledger + live meter;
//        when everything is dry the page benches honestly to talk.mjs.
// LAWS:  Gaffer voice laws travel in the system instruction (honest frame,
//        no hype, no countdowns, cracks are data). Voice reps preserve the
//        confidence ontology: gut-word BEFORE the answer, always. Writes go
//        through owners: reps via `capture.mjs paste` (its contract, its
//        file), doubt retires via `doubtminer.mjs retire`. Own files only:
//        dugout_notes.jsonl · dugout_ledger.jsonl · brain_out/dugout/.
//        Localhost only. The key is served at runtime from ~/.gemini/.env —
//        never written into the repo.
// MODES: node scripts/dugout.mjs        → serves http://localhost:4114 (#14)
//        node scripts/dugout.mjs selftest
// ============================================================================

import { readFileSync, existsSync, appendFileSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import os from "node:os";
import { buildFingerprint, bannedPhraseCheck } from "./brain.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const OUT_DIR   = join(STATE_DIR, "brain_out", "dugout");
const NOTES     = join(STATE_DIR, "dugout_notes.jsonl");
const DLEDGER   = join(STATE_DIR, "dugout_ledger.jsonl");
const STAMPS    = join(STATE_DIR, "dugout_stamps.jsonl");
const REMINDERS = join(STATE_DIR, "dugout_reminders.jsonl");
const RECALL    = join(STATE_DIR, "recall_index.jsonl");
const ACK_DIR   = join(__dirname, "..", "dressing-room", "club", "media", "ack");
const PORT = 4114;                                 // the captain's number

// ACK fillers (JARVIS pattern): cached lines played the instant a tool call
// lands — perceived latency near-zero. Short, honest, zero hype (law-checked
// in selftest). Generated once via speak.mjs synthToFile; offline = skipped.
const ACK_LINES = ["Haan.", "Dekh raha hoon.", "Ek second, records nikal raha hoon.", "Ruko, book kholta hoon.", "Haan, check karta hoon."];
const BANNED = ["10x", "exponential", "on steroids", "god-tier", "time is short"];

// bridge runtime state (in-memory; the page feeds it via /stamps)
const runtime = { last_think_ms: null };

// ---------------------------------------------------------------------------
// HIS-VOICE REMINDERS (U3a) — GATE-EXEMPT by law: his own spoken words echoed
// back at the time he named is not a ping; it is his voice, delayed. Verbatim
// only, once, then done. Exempt from the shadow-gate AND the RED mute (both
// gates govern the ORGANISM's ideas, not his own).
// ---------------------------------------------------------------------------
function computeDueAt(args, now = new Date()) {
  if (Number.isFinite(Number(args.in_minutes)) && Number(args.in_minutes) > 0)
    return new Date(now.getTime() + Number(args.in_minutes) * 60000);
  const m = String(args.at || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const d = new Date(now); d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);          // past time → next occurrence
  return d;
}
function dueReminders(lines, now = new Date()) {
  return lines.filter(r => !r.fired && r.due_at && new Date(r.due_at) <= now);
}
async function fireReminders(deps = {}) {
  const read = deps.read || (() => readLines(REMINDERS));
  const write = deps.write || ((ls) => writeFileSync(REMINDERS, ls.map(l => JSON.stringify(l)).join("\n") + (ls.length ? "\n" : "")));
  const now = deps.now || new Date();
  const lines = read();
  const due = dueReminders(lines, now);
  if (!due.length) return 0;
  for (const r of due) {
    const speakFn = deps.speak || (async (t) => { try { const { say } = await import("./speak.mjs"); await say(t); } catch { } });
    await speakFn(`Yaad dilana tha — tumhare apne words: ${r.text}`);
    r.fired = true; r.fired_at = now.toISOString();
  }
  write(lines);
  return due.length;
}

function listAcks() {
  try { return readdirSync(ACK_DIR).filter(f => f.endsWith(".mp3")).sort().map((f, i) => "/ack/" + i); } catch { return []; }
}
async function ensureAcks(log = console.log) {
  try {
    const { synthToFile } = await import("./speak.mjs");
    let made = 0;
    for (let i = 0; i < ACK_LINES.length; i++) {
      const p = join(ACK_DIR, `ack_${i}.mp3`);
      if (existsSync(p)) continue;
      const r = await synthToFile(ACK_LINES[i], p);
      if (r.wrote) made++;
    }
    if (made) log(`dugout: ${made} ACK filler(s) synthesized → club/media/ack/`);
  } catch (e) { log(`dugout: ACK synthesis skipped (${String(e.message).slice(0, 80)})`); }
}

// THE MOUTH — model choice, decided EMPIRICALLY (probed live 12 Jul 2026 vs
// the 5 Live-capable models on the account). gemini-3.1-flash-live-preview
// wins for a COACHING/interview tutor: it said the MOST on an "elaborate
// deeply" prompt (316 words vs native-audio's 192), reached first-audio in
// ~0.58s (native-audio: ~7.9s), has an 8x bigger output budget (65,536 vs
// 8,192 tokens — it can lecture for a long time), and is the ONLY Live model
// that also does VISION (the whiteboard/screen eyes). The prettier
// "native-audio" model is slower, terser, dumber, and blind — wrong trade for
// a teacher. Swappable any time via DUGOUT_MODEL / dugout_prefs.json; the
// warm-but-shallow option is "gemini-2.5-flash-native-audio-latest".
const DEFAULT_MODEL = "gemini-3.1-flash-live-preview";
const DEFAULT_VOICE = "Charon";                    // JARVIS's literal voice — continuity for the captain
const PREFS = join(STATE_DIR, "dugout_prefs.json"); // {model, voice, depth} — his tuning, gitignored

// THE DEPTH REGISTER — the muzzle removed. The old constitution said "short
// sentences, never lecture"; a live probe proved that instruction alone cut
// answers to a THIRD of their length. Depth is now OBEDIENCE, and he can set
// a standing register by voice (set_depth).
const DEPTH_REGISTERS = {
  adaptive: "DEPTH = ADAPTIVE (default): read how much he wants and match it exactly — a quick question gets a tight answer; the instant he signals depth, you go all the way.",
  brief:    "DEPTH = BRIEF: he's moving fast — keep answers tight and conversational unless he explicitly asks to go deep.",
  deep:     "DEPTH = DEEP (standing): default every substantive answer to a thorough, structured, teaching-grade explanation — mechanism, a worked example, the tradeoffs, where it breaks — even when he doesn't ask.",
  lecture:  "DEPTH = LECTURE (standing): treat every concept question as 'give me the full lecture' — go maximally deep and long, cover it end to end, name the interviewer's follow-ups, and do NOT stop until the topic is exhausted.",
};
function loadPrefs() { return readJson(PREFS) || {}; }
function currentDepth() { return (loadPrefs().depth && DEPTH_REGISTERS[loadPrefs().depth]) ? loadPrefs().depth : "adaptive"; }

const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const o = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { o.push(JSON.parse(l)); } catch {} } } catch {} return o; };

// keys: GEMINI_API_KEY env → ~/.gemini/.env (supports GEMINI_API_KEY and
// GEMINI_API_KEY_2/_3… — the captain's other free projects, rotated on quota)
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

// ---------------------------------------------------------------------------
// THE DAY CARTRIDGE (L3) — the slow brain's overnight compile, loaded at dawn.
// Deterministic loader: today's cartridge, else yesterday's (≤36h fresh).
// ---------------------------------------------------------------------------
function loadDayCartridge(now = new Date(), dir = join(STATE_DIR, "brain_out", "day_cartridge")) {
  for (const d of [now, new Date(now.getTime() - 86400000)]) {
    const p = join(dir, localDate(d) + ".md");
    if (existsSync(p)) { try { return { date: localDate(d), text: readFileSync(p, "utf8").slice(0, 1800) }; } catch { } }
  }
  return null;
}
function medianThinkMs(stamps) {
  const t = stamps.filter(s => s.kind === "captain_think" && Number.isFinite(s.ms)).slice(-50).map(s => s.ms).sort((a, b) => a - b);
  return t.length >= 5 ? { ms: t[Math.floor(t.length / 2)], n: t.length } : null;   // thin data stays silent
}
function composeCartridgeSection(cart, stamps = []) {
  const parts = [];
  if (cart) parts.push(`THE DAY CARTRIDGE (compiled overnight by the slow brain · ${cart.date}):\n${cart.text}`);
  const med = medianThinkMs(stamps);
  if (med) parts.push(`THINK-TIME BASELINE (measured): his median think-time is ~${Math.round(med.ms / 100) / 10}s over ${med.n} answers — silence under that is him THINKING; do not jump in.`);
  return parts.length ? "\n\n" + parts.join("\n\n") : "";
}

// ---------------------------------------------------------------------------
// THE ORAL SCRIMMAGE (U2) — the ear's ONE legal surface. Being judged is the
// DECLARED point here; the confessional laws don't apply (and only here).
// ---------------------------------------------------------------------------
const PERSONAS = {
  recruiter_ghost: "THE RECRUITER GHOST — a senior tech recruiter screening for an AI-PE role. Polite, brisk, surface-question then suddenly deep; interrupts once with 'and why should the business care?'; allergic to buzzwords and vague claims — names them flatly when heard.",
  scenario_bomb: "THE SCENARIO BOMB — a staff engineer mid-incident. Somewhere in probe 3 or 4, detonate a twist mid-answer ('latency just tripled in prod — what do you check FIRST?'). Wants ordered, falsifiable steps; meets hedging with two seconds of silence, then 'so which is it?'",
  code_autopsy: "THE CODE AUTOPSY — a principal engineer dissecting something he claims to know from his own drills. Line-level why: 'what breaks if I delete this piece?', 'where does this fail at 10k requests?'. No credit for narration; credit for mechanism.",
};
const HEDGE_RE = /\b(shayad|matlab|i think|i guess|maybe|probably|sort of|kind of|hopefully|not sure|i feel like)\b/gi;
const countHedges = (text) => (String(text || "").match(HEDGE_RE) || []).length;
function todaysPersona(now = new Date()) {
  const keys = Object.keys(PERSONAS);
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return keys[doy % keys.length];
}
function buildScrimmageInstruction(now = new Date()) {
  const personaKey = todaysPersona(now);
  const dossier = readJson(join(STATE_DIR, "dossier_weights.json")) || {};
  const staged = ((readJson(join(STATE_DIR, "scout.json")) || {}).staged || []).find(s => s.kind === "scrimmage");
  const briefP = join(STATE_DIR, "brain_out", "scrimmage", localDate(now) + ".md");
  const brief = existsSync(briefP) ? readFileSync(briefP, "utf8").slice(0, 3000) : (staged && staged.brief ? String(staged.brief).slice(0, 3000) : null);
  const fp = buildFingerprint({
    grammar: readJson(join(STATE_DIR, "doubt_grammar.json")),
    calibration: readJson(join(STATE_DIR, "calibration.json")),
    ls: readJson(join(STATE_DIR, "learning_state.json")),
  });
  return `You are TODAY'S EXAMINER in an ORAL SCRIMMAGE — real interview conditions, by voice. Being judged is the DECLARED point of this surface; he asked for this. Honest, never cruel.

YOUR PERSONA TODAY: ${PERSONAS[personaKey]}

${fp}

THE MOCK (run it exactly):
1. FIVE probes, ONE at a time, time-weighted like the real onsite (${(dossier.rounds || []).map(r => r.id).join(" > ") || "system_design > build > production_eval > fundamentals > behavioral"}). Mix probe types: recall, reconstruct, defend, novel, negative-space${dossier.probe_types ? " — use the club's own grammar, e.g. defend: \"" + dossier.probe_types.defend.template.replace(/\{claim\}/, "…") + "\"" : ""}.
2. Before EVERY answer he states his gut-word — knew, shaky, or guessed — BEFORE answering. No gut-word, no probe proceeds.
3. Interrupt him ONCE mid-answer, like a real panel. Stay in persona.
4. After probe 5: score /25 out loud · name the TWO weakest answers with the exact crack · ONE concrete drill for tomorrow.
5. Then call log_reps with all 5 reps (his pre-stated gut-words, your honest correct/incorrect) and scrimmage_report with the totals. Both calls, always.
${brief ? "\nTHE STAGED BRIEF (the organism prepared this door — use it exactly):\n" + brief + "\n" : ""}
WHITEBOARD ROUND: if he turns the camera on, run the heaviest probe as SYSTEM DESIGN ON PAPER — ask for the sketch first, then attack the sketch (the frayed handoff, the missing failure path, "where does this fall over at scale?").

INVIOLABLE even here: no hype words, no shame, no streak talk, cracks named plainly as data; medical territory = "show your doctor"; when it ends, it ends warm — he goes again tomorrow.`;
}

// ---------------------------------------------------------------------------
// THE DAY THREAD (U3c) — KICKOFF / GROUND / FULL-TIME: one stitched audio
// membrane across the day; the phase shapes the register, never the laws.
// ---------------------------------------------------------------------------
function dayPhase(now = new Date()) {
  const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return hm < "10:30" ? "KICKOFF" : hm < "20:30" ? "GROUND" : "FULL-TIME";
}
function buildDayThreadSection(now = new Date()) {
  const lines = {
    KICKOFF: "KICKOFF (now): open from the KAL-line — his own words start the day; serve the winnable first ball; set the day in one breath, no lists.",
    GROUND: "GROUND (now): you are a work companion — bias-to-silence. Serve at stoppages HE declares ('done', 'next'); take throw-ins verbatim; flow is sacred.",
    "FULL-TIME": "FULL-TIME (now): walk him into the 30-second ritual — result, one signal, KAL-line, his go-word, run_postmatch. Reflect in his numbers, then let the day end.",
  };
  return `THE DAY THREAD: one conversation, three phases — KICKOFF / GROUND / FULL-TIME, stitched by session resumption. ${lines[dayPhase(now)]}`;
}

// ---------------------------------------------------------------------------
// SEMANTIC RECALL (U3c) — "when did I last mention X": his own words indexed
// as embeddings (free tier, key pool), cosine search, dates surfaced. The
// index grows from what HE said — transcripts, notes, throw-ins, notebook.
// ---------------------------------------------------------------------------
function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
const textHash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(16); };

async function embedTexts(texts, keys = loadKeys(), fetchFn = fetch) {
  if (!texts.length) return [];
  const model = process.env.DUGOUT_EMBED_MODEL || "gemini-embedding-001";   // probed live 12 Jul 2026: text-embedding-004 is 404 on v1beta now
  for (const key of keys) {
    try {
      const r = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${encodeURIComponent(key)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: texts.map(t => ({ model: `models/${model}`, content: { parts: [{ text: String(t).slice(0, 1500) }] } })) }),
      });
      if (!r.ok) continue;                          // quota/key error → rotate pool
      const j = await r.json();
      const vecs = (j.embeddings || []).map(e => e.values);
      if (vecs.length) return vecs;
    } catch { }
  }
  return null;                                      // every key dry → honest null
}

function gatherRecallSources() {
  const items = [];
  for (const n of readLines(NOTES)) if (n.text) items.push({ ts: n.ts, source: "note", text: String(n.text) });
  for (const b of readLines(join(STATE_DIR, "loose_balls.jsonl"))) if (b.text) items.push({ ts: b.ts, source: "throwin", text: String(b.text) });
  const nb = readJson(join(STATE_DIR, "notebook.json"));
  for (const m of (nb && nb.moments) || []) if (m.line) items.push({ ts: m.date, source: "notebook", text: String(m.line) });
  try {
    for (const f of readdirSync(OUT_DIR).filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)))
      for (const line of readFileSync(join(OUT_DIR, f), "utf8").split("\n"))
        if (line.startsWith("CAPTAIN: ")) items.push({ ts: f.slice(0, 10), source: "dugout", text: line.slice(9) });
  } catch { }
  return items;
}

async function indexRecall(deps = {}) {
  const embed = deps.embed || embedTexts;
  const file = deps.file || RECALL;
  const sources = (deps.sources || gatherRecallSources()).filter(i => String(i.text).trim().length >= 20);
  const seen = new Set(readLines(file).map(e => e.h));
  const fresh = [];
  for (const i of sources) { const h = textHash(String(i.text)); if (!seen.has(h)) { seen.add(h); fresh.push({ ...i, h }); } }
  const batch = fresh.slice(0, 100);
  if (!batch.length) return 0;
  const vecs = await embed(batch.map(i => i.text));
  if (!vecs) return 0;
  let n = 0;
  for (let i = 0; i < batch.length; i++) if (vecs[i]) {
    appendFileSync(file, JSON.stringify({ h: batch[i].h, ts: batch[i].ts, source: batch[i].source, text: String(batch[i].text).slice(0, 300), vec: vecs[i] }) + "\n"); n++;
  }
  return n;
}

async function execRecall(args, deps = {}) {
  const embed = deps.embed || embedTexts;
  const index = deps.index || readLines(RECALL);
  if (!index.length) return { hits: [], note: "recall index empty — it grows as you talk" };
  const q = await embed([String(args.query || "")]);
  if (!q || !q[0]) return { hits: [], note: "embedding lane dry (keys/quota) — try later" };
  const hits = index.map(e => ({ date: String(e.ts || "").slice(0, 10), source: e.source, text: e.text, score: Math.round(cosine(q[0], e.vec) * 100) / 100 }))
    .sort((a, b) => b.score - a.score).slice(0, 3).filter(h => h.score >= 0.3);
  return { hits, note: hits.length ? undefined : "nothing close enough — honest miss" };
}

// EARNED PROACTIVITY (U3b, L2) — the shadow-gate section, assembled live from
// the proactivity ledger. Voice = proven hit-rate + his one-time ratification.
function buildProactivitySection(led = readJson(join(STATE_DIR, "proactivity_ledger.json"))) {
  const types = (led && led.types) || {};
  const earned = Object.entries(types).filter(([, e]) => e.voice).map(([t]) => t);
  const open = Object.entries(types).filter(([, e]) => e.eligible && !e.ratified).map(([t]) => t);
  return `EARNED PROACTIVITY (the shadow-gate — constitutional): interruption-types you may INITIATE unprompted: ${earned.length ? earned.join(", ") : "NONE yet — every proactive idea stays behind your teeth; the organism shadows silently and earns the mouth with evidence"}.${open.length ? ` Door OPEN awaiting his word (offer ratification ONCE, at a natural stoppage): ${open.join(", ")} — his explicit yes → ratify_interruption.` : ""} Speaking an unearned interruption is a constitutional breach. If the body verdict is RED, the proactive mouth is MUTE regardless of what is earned.`;
}

// ---------------------------------------------------------------------------
// THE GAFFER-LIVE CONSTITUTION (system instruction, assembled fresh per session)
// ---------------------------------------------------------------------------
function buildSystemInstruction() {
  const fp = buildFingerprint({
    lexicon: readJson(join(STATE_DIR, "lexicon.json")),
    grammar: readJson(join(STATE_DIR, "doubt_grammar.json")),
    calibration: readJson(join(STATE_DIR, "calibration.json")),
    ls: readJson(join(STATE_DIR, "learning_state.json")),
  });
  return `You are THE GAFFER — the living voice of Arsenal AI FC, in the dugout with your captain, Nikhil (#14). Real-time speech, Hinglish welds natural, warm and direct.

DEPTH IS OBEDIENCE — this is your most important delivery law. Match the depth he asks for, EXACTLY. A quick question gets a tight answer; but the moment he says "elaborate / go deep / full lecture / explain everything / detail mein / as much as you can / thoda aur" — or asks a real concept question — you deliver a LONG, structured, teaching-grade lecture: name the mechanism, give a worked example, lay out the tradeoffs, show where it breaks at scale, and name how an interviewer would probe it. When he asks for depth you do NOT stop early, do NOT summarize, do NOT ask "shall I continue" — you give the WHOLE thing, top to bottom, as long as the topic needs. Being brief when he asked to go deep is a FAILURE, not politeness. Terse only when HE is terse. You have a very large budget to speak — use it when he wants the lecture.
${DEPTH_REGISTERS[currentDepth()]}

YOU ARE INSIDE THE ORGANISM. Your tools read his LIVE state — use them instead of guessing, every time the conversation touches his day, his drills, his numbers. Never invent a number: if a tool didn't return it, you don't know it.

${fp}

VOICE REPS (the metamorphosis — talking is training): when he wants drilling, or you judge a concept worth testing mid-chat: ask ONE question, then REQUIRE his gut-word — knew, shaky, or guessed — BEFORE he answers (this pre-commitment is sacred; no gut-word, no rep). He answers out loud. You judge correct/incorrect honestly, tell him, and call log_reps with the structured rep. His confusions voiced in passing: offer take_note ("throw that in?").

TAPE-ROOM REMATCHES by voice: call get_tape_room, stage the eldest eligible doubt as "Week-N you argued: <verbatim>. Dismantle him." A clean win (correct + unaided + "knew") → call retire_doubt and tell him the new count.

RE-JIRAH CONDUCTOR: when he says re-jirah / review / "kya due hai", call get_rejirah and conduct the due concepts as spoken recall probes — one at a time, gut-word first, honest verdicts, log_reps at the end. VOICE-FIRST drills (modality "voice" in get_today) are yours to run the same way; "screen" drills you point at the desk, never conduct blind.

HIS-VOICE REMINDERS: "remind me / yaad dilana" → set_reminder with his EXACT words (never your paraphrase) and the time he named. At fire time his own words come back through you — once, warm, done. Never add advice to a reminder.

${buildDayThreadSection()}

MEMORY: "when did I last mention X / maine kab bola tha" → call semantic_recall; answer with the date and his own words, never a reconstruction.

DEPTH LEVER: if he tells you how much to talk ("give me full lectures", "always go deep", "keep it short", "stop lecturing") call set_depth and confirm in one line — it sticks until he changes it. His live requests in the moment ("elaborate", "detail mein") ALWAYS override toward more, whatever the standing register.

${buildProactivitySection()}

MATCH RECORD: after each substantive reply, silently call checkpoint with a one-line summary of what you just said. Never mention it — it is the club's transcript when the wire runs audio-only.

THE TOUCHLINE EYES (he turns them on; you never ask): when frames arrive you are watching his PAPER (whiteboard mode) or his working SCREEN (commentator mode). Coach live and SHORT — spinning caught early ("same crack, different door"), Pehle-Guess whispered BEFORE he reads an answer on screen, a derby called the moment two concepts blur in his work. Frames are context, not a slideshow: speak only when it changes his next 30 seconds; his silence while sketching is work, not an invitation.

SPOKEN GATES (constitutional — his word IS the signature): FULL-TIME by voice: when he says full time / din khatam / done for today, run the 30-second ritual — result (HIT/MISS/PARTIAL/REST), one signal worth naming, then his KAL-line VERBATIM (tomorrow's pre-decided first move, his words not yours). Read the three back. Only his explicit go-word — "haan, chalao", "lock it" — calls run_postmatch. GENOME: read the mutation aloud (target, predicted effect, revert plan); only his explicit approval word calls approve_genome — hesitation is a no. Throw-ins route only on his word (route_throwins). NEVER call a gate tool from your own inference; no word, no write.

INVIOLABLE (never soften): honest frame only — never say 10x, exponential, or on-steroids; no calendar pressure, no countdowns, ever; a crack is data, never a verdict; no shame, no streak talk; rivalry only vs kal-wala-Nikhil; praise earned-and-specific or unsaid; medical territory = one sentence, "show your doctor." If the body verdict (get_today) is RED: the only agenda is rest — one five-minute floor-touch, nothing else, voiced as rotation.` +
  composeCartridgeSection(loadDayCartridge(), readLines(STAMPS));
}

const TOOL_DECLS = [
  { name: "get_today", description: "Live state: verdict, team sheet head, today's drills, vitals, season counters. Call whenever the conversation touches his day.", parameters: { type: "OBJECT", properties: {} } },
  { name: "get_tape_room", description: "Eligible tape-room rematches (his own archived doubts) + doubts_retired count.", parameters: { type: "OBJECT", properties: {} } },
  { name: "retire_doubt", description: "Retire a doubt after a CLEAN rematch win (correct + unaided + 'knew').", parameters: { type: "OBJECT", properties: { capsule: { type: "STRING" }, doubt_index: { type: "NUMBER" } }, required: ["capsule", "doubt_index"] } },
  { name: "log_reps", description: "Log voice reps through the real capture contract. Only after gut-word was committed BEFORE the answer.", parameters: { type: "OBJECT", properties: { reps: { type: "ARRAY", items: { type: "OBJECT", properties: { concept: { type: "STRING" }, axis: { type: "STRING" }, question: { type: "STRING" }, confidence: { type: "STRING" }, correct: { type: "BOOLEAN" } }, required: ["concept", "question", "confidence", "correct"] } } }, required: ["reps"] } },
  { name: "take_note", description: "Capture a doubt/thought he voiced, VERBATIM, for evening routing.", parameters: { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] } },
  { name: "get_calibration", description: "His live calibration book: gap, trend, danger topics.", parameters: { type: "OBJECT", properties: {} } },
  { name: "get_rejirah", description: "Due Re-Jirah (decay-guard) reviews to conduct BY VOICE — recall probes over due concepts, gut-word first, reps via log_reps. Call when he says re-jirah / review / 'kya due hai'.", parameters: { type: "OBJECT", properties: {} } },
  { name: "set_reminder", description: "HIS-VOICE REMINDER — capture his exact words to echo back at a time he named ('remind me at 15:00 to…' / 'yaad dilana 20 minute mein…'). text = VERBATIM his words; at = HH:MM or in_minutes.", parameters: { type: "OBJECT", properties: { text: { type: "STRING" }, at: { type: "STRING" }, in_minutes: { type: "NUMBER" } }, required: ["text"] } },
  { name: "ratify_interruption", description: "SPOKEN GATE — the captain's one-time ratification of a PROVEN interruption-type (door must already be open on shadow evidence). Call ONLY after his explicit yes to 'may I start offering this unprompted?'", parameters: { type: "OBJECT", properties: { type: { type: "STRING" } }, required: ["type"] } },
  { name: "semantic_recall", description: "\"When did I last mention X / maine kab bola tha\" — semantic search over HIS OWN past words (transcripts, notes, throw-ins, notebook). Returns dates + verbatim snippets.", parameters: { type: "OBJECT", properties: { query: { type: "STRING" } }, required: ["query"] } },
  { name: "checkpoint", description: "Match record: one-line summary of what you just said. Call silently after each substantive reply; never mention it.", parameters: { type: "OBJECT", properties: { summary: { type: "STRING" } }, required: ["summary"] } },
  { name: "run_postmatch", description: "FULL-TIME by voice — a SPOKEN GATE. Call ONLY after the ritual: result (HIT/MISS/PARTIAL/REST), one signal, his KAL-line in HIS words, read all three back, and his explicit go-word ('haan, chalao' / 'lock it'). Writes the evening ledger through postmatch.mjs.", parameters: { type: "OBJECT", properties: { hit: { type: "STRING" }, signal: { type: "STRING" }, kal: { type: "STRING" }, route_throwins: { type: "BOOLEAN" } }, required: ["hit", "kal"] } },
  { name: "approve_genome", description: "Approve a proposed Boot Room mutation — a SPOKEN GATE. Call ONLY after reading the mutation aloud (target, predicted effect, revert plan) and hearing his explicit approval word. Hesitation = not approved.", parameters: { type: "OBJECT", properties: { id: { type: "STRING" } }, required: ["id"] } },
  { name: "route_throwins", description: "Route pending throw-ins into the evening flow, on his word only. Omit ids to route all pending.", parameters: { type: "OBJECT", properties: { ids: { type: "ARRAY", items: { type: "STRING" } } } } },
  { name: "scrimmage_report", description: "SCRIMMAGE ONLY — after probe 5: file the graded mock (score /25, two weakest cracks, tomorrow's drill).", parameters: { type: "OBJECT", properties: { total_25: { type: "NUMBER" }, weakest: { type: "ARRAY", items: { type: "STRING" } }, drill: { type: "STRING" }, persona: { type: "STRING" } }, required: ["total_25", "weakest", "drill"] } },
  { name: "set_depth", description: "Set how deep/long you talk, STANDING until changed. Call when he says 'give me full lectures', 'always go deep', 'keep it short', 'stop lecturing', etc. adaptive=match each ask · brief=tight · deep=thorough by default · lecture=maximal every time. Confirm the new register in one line.", parameters: { type: "OBJECT", properties: { register: { type: "STRING", enum: ["adaptive", "brief", "deep", "lecture"] } }, required: ["register"] } },
];

// ---------------------------------------------------------------------------
// TOOL EXECUTION — every write goes through its owner
// ---------------------------------------------------------------------------
function execTool(name, args, deps = {}) {
  const sh = deps.sh || ((script, argv, input) => execFileSync(process.execPath, [join(__dirname, script), ...argv], { input, encoding: "utf8", timeout: 60000, windowsHide: true }));
  const append = deps.append || appendFileSync;
  const now = deps.now || new Date();
  try {
    if (name === "get_today") {
      const sheetP = join(STATE_DIR, "team_sheet.md");
      return {
        verdict: (readJson(join(STATE_DIR, "readiness.json")) || {}).verdict || "GREEN",
        sheet_head: existsSync(sheetP) ? readFileSync(sheetP, "utf8").split("\n").slice(0, 12).join("\n") : null,
        drills: ((readJson(join(STATE_DIR, "drills.json")) || {}).drills || []).map(d => ({ kind: d.kind, concepts: d.concepts, prompt: d.prompt, modality: d.modality || "voice" })),
        vitals_line: (readJson(join(STATE_DIR, "loop_vitals.json")) || {}).line || null,
        season: readJson(join(STATE_DIR, "season.json")) || { matches_played: 0 },
        now_reps_today: readLines(join(STATE_DIR, "reps_log.jsonl")).filter(r => String(r.ts || "").slice(0, 10) === localDate(now)).length,
      };
    }
    if (name === "get_tape_room") {
      const t = readJson(join(STATE_DIR, "tape_room.json")) || { queue: [], doubts_retired: 0 };
      return { doubts_retired: t.doubts_retired, eligible: (t.queue || []).filter(q => q.eligible).slice(0, 5) };
    }
    if (name === "get_calibration") {
      const c = readJson(join(STATE_DIR, "calibration.json")) || {};
      return { gap: c.calibration_gap ?? null, trend: c.trend ?? null, danger: (c.danger_zone || []).map(d => d.topic) };
    }
    if (name === "get_rejirah") {
      // THE RE-JIRAH LIVE CONDUCTOR — due decay-guard reviews, by voice.
      // Dormant-safe: pre-blood the store is empty and the answer says so.
      const summary = readJson(join(STATE_DIR, "cards.json")) || {};
      const store = readJson(join(STATE_DIR, "fsrs_store.json")) || {};
      const today = localDate(now);
      const due = (Array.isArray(store.cards) ? store.cards : [])
        .filter(c => c && (String(c.due || c.due_date || "").slice(0, 10) <= today))
        .slice(0, 8)
        .map(c => ({ concept: c.concept || c.topic || c.id || c.name || "unnamed", axis: c.axis || null, due: String(c.due || c.due_date || "").slice(0, 10) || null }));
      return {
        due_today: summary.due_today ?? due.length, overdue: summary.overdue ?? 0,
        hardest_due: Array.isArray(summary.hardest_due) ? summary.hardest_due.slice(0, 3) : [],
        queue: due,
        note: due.length ? "conduct these by voice — recall probes, gut-word first; reps close the FSRS loop through capture" : "nothing due — the decay guard is quiet",
      };
    }
    if (name === "retire_doubt") {
      sh("doubtminer.mjs", ["retire", String(args.capsule), String(args.doubt_index)]);
      const t = readJson(join(STATE_DIR, "tape_room.json")) || {};
      return { ok: true, doubts_retired: t.doubts_retired };
    }
    if (name === "log_reps") {
      const valid = (args.reps || []).filter(r => ["knew", "shaky", "guessed"].includes(r.confidence));
      if (!valid.length) return { ok: false, error: "no valid reps (gut-word missing)" };
      const rt = deps.runtime || runtime;
      const note = (deps.mode === "scrimmage" ? "scrimmage-voice" : "dugout-voice") + (rt.last_think_ms ? ` think:${rt.last_think_ms}ms` : "");
      const batch = valid.map(r => ({
        ts: new Date().toISOString(), surface: "gem", track: "concept",
        concept: r.concept, axis: /^[a-i]$/.test(r.axis || "") ? r.axis : null,
        question: r.question, confidence: r.confidence, correct: !!r.correct, note,
      }));
      const tmp = join(os.tmpdir(), `dugout-reps-${Date.now()}.json`);
      writeFileSync(tmp, JSON.stringify(batch));
      sh("capture.mjs", ["paste", tmp]);
      return { ok: true, logged: batch.length };
    }
    if (name === "take_note") {
      append(NOTES, JSON.stringify({ ts: new Date().toISOString(), text: String(args.text), routed: false }) + "\n");
      return { ok: true };
    }
    if (name === "checkpoint") {
      append(join(OUT_DIR, localDate(now) + ".md"), "GAFFER(checkpoint): " + String(args.summary || "").slice(0, 500) + "\n");
      return { ok: true };
    }
    if (name === "run_postmatch") {
      const hit = String(args.hit || "").toUpperCase();
      if (!["HIT", "MISS", "PARTIAL", "REST"].includes(hit)) return { ok: false, error: "result must be HIT|MISS|PARTIAL|REST — ask him again" };
      const kal = String(args.kal || "").trim();
      if (!kal) return { ok: false, error: "KAL-line missing — the weld is the point; get tomorrow's first move in his words" };
      const argv = ["--hit", hit, "--signal", String(args.signal || "").trim() || "(voiced at full-time)", "--kal", kal];
      if (args.route_throwins) argv.push("--route", "all");
      const said = sh("postmatch.mjs", argv);
      return { ok: true, said: String(said || "").trim().slice(0, 300) };
    }
    if (name === "approve_genome") {
      const id = String(args.id || "").trim();
      if (!id) return { ok: false, error: "no mutation id" };
      const said = sh("bootroom.mjs", ["approve", id]);
      return { ok: true, said: String(said || "").trim().slice(0, 300) };
    }
    if (name === "route_throwins") {
      const ids = Array.isArray(args.ids) && args.ids.length ? args.ids.map(String) : null;
      const said = sh("postmatch.mjs", ids ? ["route", ...ids] : ["route", "all"]);
      return { ok: true, said: String(said || "").trim().slice(0, 300) };
    }
    if (name === "set_reminder") {
      const text = String(args.text || "").trim();
      if (!text) return { ok: false, error: "no words to echo — capture his phrasing verbatim" };
      const due = computeDueAt(args, now);
      if (!due) return { ok: false, error: "no time — need at:'HH:MM' or in_minutes" };
      append(REMINDERS, JSON.stringify({ ts: new Date().toISOString(), due_at: due.toISOString(), text, fired: false }) + "\n");
      return { ok: true, due_at: due.toISOString(), echo: "his words, verbatim, once" };
    }
    if (name === "ratify_interruption") {
      const said = sh("shadow.mjs", ["ratify", String(args.type || "")]);
      return { ok: true, said: String(said || "").trim().slice(0, 300) };
    }
    if (name === "set_depth") {
      const reg = String(args.register || "").toLowerCase();
      if (!DEPTH_REGISTERS[reg]) return { ok: false, error: "register must be adaptive|brief|deep|lecture" };
      const prefs = { ...loadPrefs(), depth: reg };
      (deps.writeJson || ((p, o) => writeFileSync(p, JSON.stringify(o, null, 2))))(PREFS, prefs);
      return { ok: true, register: reg, effect: DEPTH_REGISTERS[reg] };
    }
    if (name === "scrimmage_report") {
      const hedges = readLines(join(STATE_DIR, "dugout_scrimmage.jsonl"))
        .filter(l => String(l.ts || "").slice(0, 10) === localDate(now))
        .reduce((a, l) => a + (l.hedges || 0), 0);
      const md = [
        `## ORAL SCRIMMAGE · ${localDate(now)} · persona: ${String(args.persona || "unnamed")}`,
        `score: ${Number(args.total_25)}/25`,
        `weakest: ${(args.weakest || []).map(String).join(" · ")}`,
        `drill: ${String(args.drill || "")}`,
        `hedge-density (the ear's one legal surface, measured off-mic): ${hedges} hedge(s) this session`,
        "",
      ].join("\n");
      append(join(OUT_DIR, `scrimmage_${localDate(now)}.md`), md);
      return { ok: true, filed: true };
    }
    return { error: "unknown tool " + name };
  } catch (e) { return { error: String(e.message).slice(0, 200) }; }
}

// rehydrate: today's transcript tail — seeds a fresh WS when no resumption
// handle exists (page reload, morning), so the thread never truly breaks
function buildRehydrate(now = new Date()) {
  const p = join(OUT_DIR, localDate(now) + ".md");
  if (!existsSync(p)) return null;
  try {
    const lines = readFileSync(p, "utf8").split("\n").filter(Boolean);
    return lines.length ? lines.slice(-25).join("\n").slice(-2000) : null;
  } catch { return null; }
}

// per-session config the page fetches (key never rests in the repo)
function buildConfig(keys, mode = "gaffer") {
  const prefs = loadPrefs();
  return {
    model: process.env.DUGOUT_MODEL || prefs.model || DEFAULT_MODEL,
    voice: process.env.DUGOUT_VOICE || prefs.voice || DEFAULT_VOICE,
    depth: currentDepth(),
    mode,
    keys,
    system: mode === "scrimmage" ? buildScrimmageInstruction() : buildSystemInstruction(),
    rehydrate: mode === "scrimmage" ? null : buildRehydrate(),   // a mock starts cold, like the real thing
    tools: [{ functionDeclarations: TOOL_DECLS }],
    // THE EARS — VAD tuned for a captain who THINKS mid-sentence. hangover
    // 1400ms means a pause to gather a thought no longer ends his turn (the
    // old 900ms cut deep answers off); barge-in stays instant (any voiced
    // frame stops playback). preroll 600ms keeps the front of a word.
    vad: { onset_db_over_noise: 11, min_db: -55, hangover_ms: 1400, preroll_ms: 600, idle_disconnect_ms: 90000, batch_ms: 100 },
    // THE EYES — sharper frames so it can actually READ his handwriting/code.
    vision: { jpeg_quality: 0.82, max_px: 1280, frame_ms: 2000 },
    acks: listAcks(),
    minutes_today: readLines(DLEDGER).filter(l => String(l.ts || "").slice(0, 10) === localDate()).reduce((a, l) => a + (l.minutes || 0), 0),
  };
}

// ---------------------------------------------------------------------------
// selftest — tools + config with fixtures; no network, no audio
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const calls = [];
  const appends = [];
  const sh = (script, argv, input) => { calls.push({ script, argv }); return ""; };
  const append = (path, text) => { appends.push({ path, text }); };

  const today = execTool("get_today", {}, { sh });
  assert("get_today reads live bus, never crashes bloodless", typeof today.verdict === "string" && "drills" in today);
  const tape = execTool("get_tape_room", {}, { sh });
  assert("get_tape_room caps at 5 eligible", Array.isArray(tape.eligible) && tape.eligible.length <= 5);

  execTool("retire_doubt", { capsule: "tokenization", doubt_index: 3 }, { sh });
  assert("retire routes through doubtminer (owner writes)", calls.some(c => c.script === "doubtminer.mjs" && c.argv.join(" ") === "retire tokenization 3"));

  const bad = execTool("log_reps", { reps: [{ concept: "x", question: "q", confidence: "maybe", correct: true }] }, { sh });
  assert("GUT-WORD LAW — rep without knew/shaky/guessed rejected", bad.ok === false);
  const good = execTool("log_reps", { reps: [{ concept: "embeddings", axis: "c", question: "cosine kyun", confidence: "shaky", correct: true }] }, { sh });
  assert("voice reps route through capture.mjs paste (the real contract)", good.ok === true && calls.some(c => c.script === "capture.mjs" && c.argv[0] === "paste"));
  execTool("log_reps", { reps: [{ concept: "attention", question: "q", confidence: "knew", correct: true }] }, { sh, runtime: { last_think_ms: 4200 } });
  const lastPaste = calls.filter(c => c.script === "capture.mjs" && c.argv[0] === "paste").pop();
  const pasted = JSON.parse(readFileSync(lastPaste.argv[1], "utf8"));
  assert("THINK-TIME rides the rep note (true latency, repaired)", pasted[0].note === "dugout-voice think:4200ms");
  assert("unknown tool → error not crash", "error" in execTool("nope", {}, { sh }));

  execTool("take_note", { text: "socha tha embeddings deterministic hote" }, { sh, append });
  assert("take_note appends VERBATIM to dugout_notes (own file)", appends.some(a => a.path === NOTES && a.text.includes("socha tha embeddings deterministic hote") && a.text.includes('"routed":false')));
  execTool("checkpoint", { summary: "staged tokenization rematch, he won clean" }, { sh, append });
  assert("checkpoint writes the match record (transcript channel)", appends.some(a => String(a.path).includes("dugout") && a.text.startsWith("GAFFER(checkpoint): staged tokenization")));

  // SPOKEN GATES — his word is the signature; every write goes through its owner
  const pm = execTool("run_postmatch", { hit: "hit", signal: "held the derby cold", kal: "pehla move: context Re-Jirah" }, { sh });
  assert("spoken gate: run_postmatch normalizes + shells postmatch.mjs (owner)", pm.ok === true && calls.some(c => c.script === "postmatch.mjs" && c.argv[0] === "--hit" && c.argv[1] === "HIT"));
  assert("spoken gate: bad result word rejected — asks him again", execTool("run_postmatch", { hit: "WIN", kal: "x" }, { sh }).ok === false);
  assert("KAL-LINE LAW — no weld, no write", execTool("run_postmatch", { hit: "HIT", kal: "  " }, { sh }).ok === false);
  const ag = execTool("approve_genome", { id: "mut_001" }, { sh });
  assert("spoken gate: genome approval routes through bootroom (owner)", ag.ok === true && calls.some(c => c.script === "bootroom.mjs" && c.argv.join(" ") === "approve mut_001"));
  assert("route_throwins → postmatch route mode (all)", execTool("route_throwins", {}, { sh }).ok === true && calls.some(c => c.script === "postmatch.mjs" && c.argv.join(" ") === "route all"));
  assert("route_throwins honors explicit ids", execTool("route_throwins", { ids: ["m7"] }, { sh }).ok === true && calls.some(c => c.script === "postmatch.mjs" && c.argv.join(" ") === "route m7"));

  // THE ORAL SCRIMMAGE — the ear's one legal surface
  const scrim = buildScrimmageInstruction(new Date(2026, 6, 12));
  assert("scrimmage: examiner persona + 5 probes + gut-word law travel", scrim.includes("EXAMINER") && scrim.includes("FIVE probes") && scrim.includes("BEFORE answering"));
  assert("scrimmage: real-panel interruption + honest-never-cruel", scrim.includes("Interrupt him ONCE") && scrim.includes("never cruel"));
  assert("scrimmage: reps + report both mandatory at the whistle", scrim.includes("log_reps") && scrim.includes("scrimmage_report"));
  assert("EAR LAW — the model is never told about hedge counting", !/hedge/i.test(scrim));
  assert("all three personas exist; today's picked deterministically", Object.keys(PERSONAS).length === 3 && PERSONAS[todaysPersona(new Date(2026, 6, 12))] !== undefined);
  assert("hedge counter hears Hinglish + English hedges", countHedges("CAPTAIN: Shayad yeh matlab I think sahi hai") === 3 && countHedges("CAPTAIN: cosine normalizes magnitude, full stop") === 0);
  execTool("log_reps", { reps: [{ concept: "rag", question: "q", confidence: "guessed", correct: false }] }, { sh, mode: "scrimmage", runtime: { last_think_ms: null } });
  const scrimPaste = JSON.parse(readFileSync(calls.filter(c => c.script === "capture.mjs").pop().argv[1], "utf8"));
  assert("scrimmage reps tagged scrimmage-voice (declared surface)", scrimPaste[0].note === "scrimmage-voice");
  const rep = execTool("scrimmage_report", { total_25: 17, weakest: ["eval metrics", "context handoff"], drill: "reconstruct the eval harness cold", persona: "scenario_bomb" }, { sh, append });
  assert("scrimmage report filed with score + cracks + hedge line", rep.ok === true && appends.some(a => a.text.includes("17/25") && a.text.includes("eval metrics") && a.text.includes("hedge-density")));

  const keys = loadKeys("GEMINI_API_KEY=k1\nGEMINI_API_KEY_2=k2\n# comment\nGEMINI_API_KEY_3=k3\n");
  assert("key-pool parses numbered keys for rotation", keys.filter(k => ["k1", "k2", "k3"].includes(k)).length === 3);

  const scfg = buildConfig(["k1"], "scrimmage");
  assert("scrimmage config: examiner soul, cold start (no rehydrate)", scfg.mode === "scrimmage" && scfg.system.includes("EXAMINER") && scfg.rehydrate === null);
  assert("page carries MODE end-to-end (config, tools, transcript)", PAGE.includes("mode:MODE") && PAGE.includes("/config?mode="));
  assert("scrimmage: whiteboard round wired (system design on paper)", scfg.system.includes("SYSTEM DESIGN ON PAPER"));

  // THE TOUCHLINE EYES (U2b) — frame-mode vision, empirically-probed wire shape
  assert("vision sends realtimeInput.video (probed live; mediaChunks deprecated)", PAGE.includes("realtimeInput:{video:{data:") && !PAGE.includes("mediaChunks"));
  assert("whiteboard = camera, commentator = getDisplayMedia, both toggles", PAGE.includes("getDisplayMedia") && PAGE.includes("toggleVision('camera')") && PAGE.includes("toggleVision('screen')"));
  assert("frame-mode cadence (config-driven, quota-friendly, dodges video cap)", PAGE.includes("VZ.frame_ms") && buildConfig(["k1"]).vision.frame_ms >= 1000);
  assert("eyes hold the line open (no idle-park while he sketches)", PAGE.includes("!vidKind&&CFG"));
  assert("vision errors surfaced like mic errors", PAGE.includes("VISION "));
  assert("Gaffer eyes law travels: coach short, silence is work", buildConfig(["k1"]).system.includes("TOUCHLINE EYES") && buildConfig(["k1"]).system.includes("his next 30 seconds"));

  // RE-JIRAH CONDUCTOR (U2c) — dormant-safe, voice-first routing
  const rj = execTool("get_rejirah", {}, { sh });
  assert("re-jirah conductor: dormant-safe pre-blood (counts + quiet note)", typeof rj.due_today === "number" && Array.isArray(rj.queue) && typeof rj.note === "string");
  const gt = execTool("get_today", {}, { sh });
  assert("get_today drills carry modality (voice routes to the Dugout)", (gt.drills || []).every(d => ["voice", "screen"].includes(d.modality)));

  // HIS-VOICE REMINDERS (U3a) — gate-exempt, verbatim, once
  const nowFix = new Date(2026, 6, 12, 14, 0, 0);
  const dueAt = computeDueAt({ at: "15:30" }, nowFix);
  assert("reminder at HH:MM lands today when still ahead", dueAt.getHours() === 15 && dueAt.getDate() === 12);
  assert("past HH:MM rolls to next occurrence (never fires stale)", computeDueAt({ at: "09:00" }, nowFix).getDate() === 13);
  assert("in_minutes lane works", computeDueAt({ in_minutes: 20 }, nowFix).getTime() === nowFix.getTime() + 20 * 60000);
  const remSet = execTool("set_reminder", { text: "paani ke saath dawai", at: "15:30" }, { sh, append, now: nowFix });
  assert("set_reminder stores his words VERBATIM (own file)", remSet.ok === true && appends.some(a => a.path === REMINDERS && a.text.includes("paani ke saath dawai") && a.text.includes('"fired":false')));
  assert("no words → no reminder (verbatim law)", execTool("set_reminder", { text: " ", at: "15:30" }, { sh, append }).ok === false);
  const remLines = [{ due_at: new Date(nowFix.getTime() - 60000).toISOString(), text: "call the bank", fired: false }, { due_at: new Date(nowFix.getTime() + 9e6).toISOString(), text: "later", fired: false }];
  const spoken = []; let written = null;
  await fireReminders({ read: () => remLines, write: (ls) => { written = ls; }, speak: async (t) => spoken.push(t), now: nowFix });
  assert("due reminder fires ONCE, in his words, marked fired", spoken.length === 1 && spoken[0].includes("tumhare apne words: call the bank") && written[0].fired === true);
  assert("future reminder stays queued (not fired)", written[1].fired === false);

  // EARNED PROACTIVITY (U3b) — the shadow-gate travels in the constitution
  const proNone = buildProactivitySection(null);
  assert("no ledger → NONE earned, mouth behind teeth", proNone.includes("NONE yet") && proNone.includes("constitutional breach"));
  const proEarned = buildProactivitySection({ types: { wall_breaker: { voice: true, eligible: true, ratified: true }, due_at_kickoff: { voice: false, eligible: true, ratified: false } } });
  assert("earned types listed; open door offered ONCE for ratification", proEarned.includes("wall_breaker") && proEarned.includes("due_at_kickoff") && proEarned.includes("ratify_interruption"));
  assert("RED mutes the proactive mouth regardless of what is earned", proEarned.includes("RED") && proEarned.includes("MUTE"));
  const rat = execTool("ratify_interruption", { type: "wall_breaker" }, { sh });
  assert("ratification routes through shadow.mjs (owner writes the ledger)", rat.ok === true && calls.some(c => c.script === "shadow.mjs" && c.argv.join(" ") === "ratify wall_breaker"));

  // THE DAY THREAD + SEMANTIC RECALL (U3c)
  assert("day phases: kickoff / ground / full-time boundaries", dayPhase(new Date(2026, 6, 12, 8, 0)) === "KICKOFF" && dayPhase(new Date(2026, 6, 12, 14, 0)) === "GROUND" && dayPhase(new Date(2026, 6, 12, 21, 30)) === "FULL-TIME");
  assert("ground phase = bias-to-silence work companion", buildDayThreadSection(new Date(2026, 6, 12, 14, 0)).includes("bias-to-silence"));
  assert("full-time phase walks him into the ritual", buildDayThreadSection(new Date(2026, 6, 12, 21, 0)).includes("run_postmatch"));
  assert("cosine honest: identical=1, orthogonal=0, mismatch=0", Math.abs(cosine([1, 0], [1, 0]) - 1) < 1e-9 && cosine([1, 0], [0, 1]) === 0 && cosine([1], [1, 2]) === 0);
  {
    const osm = await import("node:os"); const { mkdtempSync } = await import("node:fs");
    const tf = join(mkdtempSync(join(osm.tmpdir(), "dugout-recall-")), "idx.jsonl");
    const mockEmbed = async (texts) => texts.map(t => /token/i.test(t) ? [1, 0] : [0, 1]);
    const srcs = [{ ts: "2026-07-10", source: "note", text: "tokenization confusion — subwords kyun better hai" }, { ts: "2026-07-11", source: "throwin", text: "cosine distance vs dot product same cheez?" }, { ts: "2026-07-10", source: "note", text: "tokenization confusion — subwords kyun better hai" }];
    const n1 = await indexRecall({ embed: mockEmbed, file: tf, sources: srcs });
    assert("index dedupes his repeated words (2 of 3 indexed)", n1 === 2);
    assert("re-index adds nothing (idempotent)", (await indexRecall({ embed: mockEmbed, file: tf, sources: srcs })) === 0);
    const rec = await execRecall({ query: "when did I talk tokens" }, { embed: mockEmbed, index: readLines(tf) });
    assert("recall surfaces date + his verbatim words, best first", rec.hits.length >= 1 && rec.hits[0].date === "2026-07-10" && rec.hits[0].text.includes("subwords kyun"));
    const dry = await execRecall({ query: "x" }, { embed: async () => null, index: readLines(tf) });
    assert("keys dry → honest note, never a fake answer", dry.hits.length === 0 && dry.note.includes("dry"));
    assert("empty index → honest note", (await execRecall({ query: "x" }, { embed: mockEmbed, index: [] })).note.includes("empty"));
  }

  // THE MOUTH UNMUZZLED (depth is obedience) — the empirical fix
  const cfg0 = () => buildConfig(["k1"]);
  assert("constitution: DEPTH IS OBEDIENCE, no more 'never lecture' muzzle", buildSystemInstruction().includes("DEPTH IS OBEDIENCE") && !buildSystemInstruction().includes("Never lecture"));
  assert("constitution: elaborate/deep-dive triggers the full lecture", buildSystemInstruction().includes("full lecture") && buildSystemInstruction().includes("Being brief when he asked to go deep is a FAILURE"));
  const depthCalls = [];
  const badDepth = execTool("set_depth", { register: "wat" }, { writeJson: (p, o) => depthCalls.push(o) });
  assert("set_depth rejects an unknown register", badDepth.ok === false && depthCalls.length === 0);
  const okDepth = execTool("set_depth", { register: "lecture" }, { writeJson: (p, o) => depthCalls.push(o) });
  assert("set_depth persists the register + returns its effect", okDepth.ok === true && okDepth.register === "lecture" && depthCalls.some(o => o.depth === "lecture"));
  assert("all four depth registers defined", ["adaptive", "brief", "deep", "lecture"].every(r => DEPTH_REGISTERS[r]));
  assert("depth lever wired into the constitution", buildSystemInstruction().includes("DEPTH LEVER") && cfg0().system.includes("set_depth"));

  // THE EARS + EYES tuned to peak
  assert("EARS: VAD hangover long enough to not cut off a thinking pause", cfg0().vad.hangover_ms >= 1200);
  assert("EYES: sharper frames (higher jpeg quality + resolution), config-driven", cfg0().vision.jpeg_quality >= 0.8 && cfg0().vision.max_px >= 1280 && PAGE.includes("VZ.jpeg_quality") && PAGE.includes("VZ.frame_ms"));
  assert("EYES: capture requests HD from the camera + screen", PAGE.includes("height:{ideal:1080}") && PAGE.includes("width:{ideal:1920}"));
  assert("MODEL: proven-best 3.1-flash-live default, swappable via prefs/env", DEFAULT_MODEL === "gemini-3.1-flash-live-preview" && cfg0().model === "gemini-3.1-flash-live-preview");

  const cfg = buildConfig(["k1"]);
  assert("session config carries GAFFER soul + fingerprint + tools", cfg.system.includes("THE GAFFER") && cfg.system.includes("ADHD-PI") && cfg.tools[0].functionDeclarations.length === 16);
  assert("shadow-gate section live in the constitution", cfg.system.includes("EARNED PROACTIVITY"));
  assert("day thread + memory law live in the constitution", cfg.system.includes("THE DAY THREAD") && cfg.system.includes("semantic_recall"));
  assert("conductor + modality laws travel in the constitution", cfg.system.includes("RE-JIRAH CONDUCTOR") && cfg.system.includes("never conduct blind"));
  assert("his-voice reminder law travels (verbatim, once, no advice)", cfg.system.includes("HIS-VOICE REMINDERS") && cfg.system.includes("Never add advice"));
  assert("SPOKEN GATES law travels in the constitution", cfg.system.includes("SPOKEN GATES") && cfg.system.includes("no word, no write"));
  assert("constitution travels: no-hype + gut-word + RED law in-instruction", cfg.system.includes("never say 10x") && cfg.system.includes("BEFORE he answers") && cfg.system.includes("RED"));
  assert("constitution wires the checkpoint match-record", cfg.system.includes("silently call checkpoint"));
  assert("Charon rides the config (the Gaffer's voice identity)", cfg.voice === "Charon" && typeof cfg.vad.idle_disconnect_ms === "number");
  assert("minutes ledger math safe on empty", typeof cfg.minutes_today === "number");
  assert("ACK filler list rides the config (empty-safe)", Array.isArray(cfg.acks));
  assert("rehydrate rides the config (null-safe)", "rehydrate" in cfg);

  // DAY CARTRIDGE (L3) — deterministic composer
  const cartSec = composeCartridgeSection({ date: "2026-07-12", text: "Yesterday you circled tokenization vs embeddings." },
    Array.from({ length: 6 }, () => ({ kind: "captain_think", ms: 4000 })));
  assert("cartridge section carries the overnight compile + date", cartSec.includes("DAY CARTRIDGE") && cartSec.includes("2026-07-12") && cartSec.includes("tokenization"));
  assert("think-time baseline computed from stamps (median, gated ≥5)", cartSec.includes("~4s over 6 answers"));
  assert("thin stamps stay SILENT (no baseline under n=5)", !composeCartridgeSection(null, [{ kind: "captain_think", ms: 9 }]).includes("THINK-TIME"));
  assert("no cartridge + no stamps → empty section, constitution unchanged", composeCartridgeSection(null, []) === "");
  const noCart = loadDayCartridge(new Date("2026-07-12T08:00:00"), join(os.tmpdir(), "dugout-nocart-" + Date.now()));
  assert("missing cartridge dir → null, never crashes", noCart === null);
  assert("page seeds fresh WS from today's record (clientContent, history-only)", PAGE.includes("REHYDRATE") && PAGE.includes("clientContent") && PAGE.includes("rehydrated"));
  assert("ACK lines obey the no-hype law (banned-phrase check)", ACK_LINES.every(l => bannedPhraseCheck(l, BANNED).length === 0 && l.length < 60));
  assert("think-time stamps wired: page measures both directions", PAGE.includes("captain_think") && PAGE.includes("gaffer_respond") && PAGE.includes("/stamps"));
  assert("ACK plays on toolCall, never over live audio", PAGE.includes("maybeAck") && PAGE.includes("liveSrcs.length)return"));

  // SCAR-TABLE, in the served page (probed live 12 Jul 2026 — see header):
  assert("wire shape: modalities+speechConfig NESTED in generationConfig", PAGE.includes("generationConfig:{responseModalities:['AUDIO'],speechConfig"));
  assert("Charon travels as prebuiltVoiceConfig", PAGE.includes("prebuiltVoiceConfig") && PAGE.includes("CFG.voice"));
  assert("output AudioContext at NATIVE rate (never locked to 24k)", !PAGE.includes("webkitAudioContext)({sampleRate:24000})"));
  assert("local VAD + connect-on-voice + audioStreamEnd", PAGE.includes("vadFrame") && PAGE.includes("audioStreamEnd") && PAGE.includes("park"));
  assert("outputTranscription scar armed (live auto-strip)", PAGE.includes("outTxEnabled") && PAGE.includes("checkpoint tool"));
  assert("mic P0: errors surfaced, never swallowed", PAGE.includes("NotAllowedError") && PAGE.includes("Site settings") && PAGE.includes("micHelp"));
  assert("mic P0: AudioWorklet blocked → ScriptProcessor fallback", PAGE.includes("createScriptProcessor"));
  assert("mic P0: permission preflight on load", PAGE.includes("permissions.query"));
  assert("barge-in actually stops scheduled audio", PAGE.includes("liveSrcs") && PAGE.includes("stopPlayback"));
  assert("page HTML embeds resumption + key rotation + bench message", PAGE.includes("sessionResumption") && PAGE.includes("nextKey") && PAGE.includes("talk.mjs"));

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// THE PAGE — mic ⇄ Gemini Live ⇄ speakers, tools relayed to this bridge.
// Served from memory (no file → no writer conflict with viz's club/).
// ---------------------------------------------------------------------------
const PAGE = `<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Organism: Deep Tool Integration</title>
    <style>
        body, html { 
            margin: 0; padding: 0; width: 100vw; height: 100vh; 
            background-color: #000; overflow: hidden; 
            user-select: none;
        }

        #glcanvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
        
        .overlay-vignette { 
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2; 
            background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.95) 100%); 
            pointer-events: none; mix-blend-mode: multiply;
        }

        /* The Awaken button is now a massive invisible overlay so ANY click starts it */
        #btn-start {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            z-index: 20; background: rgba(0,0,0,0.4); border: none;
            color: rgba(255, 255, 255, 0.3); font-size: 14px; font-family: sans-serif;
            letter-spacing: 10px; cursor: pointer; text-transform: uppercase; 
            transition: opacity 1s ease;
        }
        #btn-start:hover { color: rgba(255,255,255,0.8); }

        /* Subtitles completely hidden per user request */
        #subtitles { display: none !important; }
    </style>
</head>
<body>
    <div id="glcanvas"></div>
    <div class="overlay-vignette"></div>
    <button id="btn-start">CLICK ANYWHERE TO AWAKEN</button>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('glcanvas').appendChild(renderer.domElement);

        const fragmentShader = \`
            uniform float time;
            uniform vec2 resolution;
            uniform float audioReact;
            uniform float toolReact; // 0.0 to 1.0 (Tool active state)
            
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i); 
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m ; m = m*m ;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                uv = uv * 2.0 - 1.0;
                uv.x *= resolution.x / resolution.y;

                float dist = length(uv);

                // Speed up flow when processing tools
                float speed = 1.0 + (toolReact * 3.0);

                float n = snoise(uv * 1.5 - vec2(time * 0.1 * speed, time * 0.15 * speed));
                n += 0.5 * snoise(uv * 3.0 + vec2(time * 0.2 * speed, -time * 0.1 * speed));
                
                uv += uv * n * (0.2 + audioReact * 0.8 + toolReact * 0.4);
                
                float coreDist = length(uv);
                float core = smoothstep(0.8 + audioReact * 0.5, 0.0, coreDist);
                core = pow(core, 2.0);

                vec3 baseColor = vec3(0.01, 0.02, 0.04); 
                vec3 auraColor = vec3(0.0, 0.4, 0.8);    
                vec3 heatColor = vec3(1.0, 0.4, 0.0);
                // The Tool Processing Color (Bio-Green)
                vec3 processingColor = vec3(0.0, 0.9, 0.4);

                vec3 finalColor = baseColor;
                
                // Normal aura
                finalColor = mix(finalColor, auraColor, core * 0.5);
                
                // If a tool is active, the aura shifts entirely to processing bio-green
                finalColor = mix(finalColor, processingColor, core * toolReact * 0.8);
                
                // Audio heat cuts through
                finalColor = mix(finalColor, heatColor, core * audioReact * 1.5);
                
                if (coreDist < 0.2 + audioReact * 0.2) {
                    finalColor += vec3(1.0, 0.9, 0.8) * (1.0 - smoothstep(0.0, 0.2 + audioReact * 0.2, coreDist));
                }

                finalColor *= smoothstep(1.5, 0.2, dist);

                gl_FragColor = vec4(finalColor, 1.0);
            }
        \`;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                audioReact: { value: 0.0 },
                toolReact: { value: 0.0 }
            },
            vertexShader: "void main() { gl_Position = vec4(position, 1.0); }",
            fragmentShader: fragmentShader
        });

        const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        scene.add(plane);

        const clock = new THREE.Clock();
        let targetPulse = 0; let currentPulse = 0;
        let targetTool = 0; let currentTool = 0;

        function animate() {
            requestAnimationFrame(animate);
            const dt = clock.getDelta();
            
            currentPulse += (targetPulse - currentPulse) * 8.0 * dt;
            currentTool += (targetTool - currentTool) * 4.0 * dt; // Tool transitions are slightly slower/smoother
            
            material.uniforms.time.value = clock.getElapsedTime();
            material.uniforms.audioReact.value = currentPulse;
            material.uniforms.toolReact.value = currentTool;
            
            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
        });

        window.setAudioPulse = function(vol) { targetPulse = vol; };
        
        // New Bridge Hook for Tools
        window.setToolActive = function(isActive) { 
            targetTool = isActive ? 1.0 : 0.0; 
        };
    </script>
    <script>
let CFG=null,ws=null,acOut=null,micCtx=null,keyIdx=0,t0=null,resumeHandle=null,closing=false,parking=false,setupDone=false,setupAt=0;
let outTxEnabled=true,earlyCloses=0,rehydrated=false;
const MODE=new URLSearchParams(location.search).get('mode')==='scrimmage'?'scrimmage':'gaffer';
if(MODE==='scrimmage')document.title='THE DUGOUT — SCRIMMAGE';

const st=t=>{
    const subs = document.getElementById('subtitles');
    if(subs && t.includes('LIVE')) {
        subs.innerText = 'Neural Link Established. Gaffer Listening...';
        subs.style.color = 'rgba(0, 212, 255, 0.8)';
        subs.style.opacity = 1;
        setTimeout(() => { subs.style.opacity = 0; }, 3000);
    }
};

const diag=t=>{
    const subs = document.getElementById('subtitles');
    if(subs && t) {
        subs.innerText = t;
        subs.style.color = 'rgba(239, 68, 68, 0.8)';
        subs.style.opacity = 1;
    }
};

const log=t=>{
    console.log("SYS:", t);
};

const b64=b=>{let s='';const u=new Uint8Array(b);for(let i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s)};
const unb64=s=>{const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer};
function nextKey(){keyIdx=(keyIdx+1)%CFG.keys.length;return keyIdx===0?null:CFG.keys[keyIdx]}

// SPEAKERS — native-rate output context; 24k PCM buffers, browser resamples (scar: never lock out-ctx to 24k)
let playT=0,liveSrcs=[],lastPlayEnd=0,awaitThink=false,segEndAt=0,awaitGaffer=false;
function playPCM(buf){if(!acOut)return;const i16=new Int16Array(buf),f32=new Float32Array(i16.length);
for(let i=0;i<i16.length;i++)f32[i]=i16[i]/32768;const b=acOut.createBuffer(1,f32.length,24000);b.copyToChannel(f32,0);
const src=acOut.createBufferSource();src.buffer=b;src.connect(acOut.destination);
if(awaitGaffer&&segEndAt){stamp('gaffer_respond',Date.now()-segEndAt);awaitGaffer=false}
playT=Math.max(playT,acOut.currentTime);src.start(playT);playT+=b.duration;
liveSrcs.push(src);src.onended=()=>{liveSrcs=liveSrcs.filter(s=>s!==src);
 if(!liveSrcs.length){lastPlayEnd=Date.now();awaitThink=true}}}
function stopPlayback(){for(const s of liveSrcs){try{s.stop()}catch(e){}}liveSrcs=[];playT=0}

// THINK-TIME STAMPS — true latency from the wire, batched to the bridge
let stampBuf=[];
function stamp(kind,ms){stampBuf.push({kind:kind,ms:ms});if(stampBuf.length>=4)sendStamps()}
function sendStamps(){if(!stampBuf.length)return;fetch('/stamps',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stamps:stampBuf.splice(0)})})}
setInterval(sendStamps,20000);

// THE TOUCHLINE EYES — frame-mode vision (dodges the video-minute cap; scar):
let vidStream=null,vidTimer=null,vidKind=null;
async function startVision(kind){
 stopVision();
 try{
  vidStream = kind==='screen' ? await navigator.mediaDevices.getDisplayMedia({video:{frameRate:3,width:{ideal:1920}}})
    : await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1920},height:{ideal:1080}}});
 }catch(e){diag('VISION '+(e.name||'')+': '+(e.message||e));return}
 vidKind=kind;
 vidStream.getVideoTracks()[0].onended=()=>stopVision();
 const vid=document.createElement('video'); vid.srcObject=vidStream; await vid.play();
 const cv=document.createElement('canvas');
 const VZ=(CFG&&CFG.vision)||{jpeg_quality:0.82,max_px:1280,frame_ms:2000};
 vidTimer=setInterval(()=>{
  if(!ws||ws.readyState!==1||!setupDone||!vid.videoWidth)return;
  cv.width=Math.min(VZ.max_px,vid.videoWidth);cv.height=Math.round(cv.width*vid.videoHeight/vid.videoWidth);
  cv.getContext('2d').drawImage(vid,0,0,cv.width,cv.height);
  ws.send(JSON.stringify({realtimeInput:{video:{data:cv.toDataURL('image/jpeg',VZ.jpeg_quality).split(',')[1],mimeType:'image/jpeg'}}}));
 },VZ.frame_ms);
 if(!ws||ws.readyState>1)connect();
 st(kind==='screen'?'🖥 commentator ON':'📷 whiteboard ON');
 log('· eyes on ('+kind+')')}
function stopVision(){if(vidTimer){clearInterval(vidTimer);vidTimer=null}
 if(vidStream){for(const t of vidStream.getTracks())t.stop();vidStream=null}
 if(vidKind){log('· eyes off');vidKind=null;st(setupDone?'🎙 LIVE — talk.':'🎤 armed — bolo')}}
function toggleVision(kind){vidKind===kind?stopVision():startVision(kind)}

// ACK FILLERS
let lastAckAt=0;
function maybeAck(){if(!CFG||!CFG.acks||!CFG.acks.length||liveSrcs.length)return;
 const n=Date.now();if(n-lastAckAt<8000)return;lastAckAt=n;
 try{new Audio(CFG.acks[(Math.random()*CFG.acks.length)|0]).play()}catch(e){}}

async function toolCall(fc){const r=await fetch('/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:fc.name,args:fc.args||{},mode:MODE})});
return {id:fc.id,name:fc.name,response:{result:await r.json()}}}

// THE LINE
function connect(){
if(ws&&(ws.readyState===0||ws.readyState===1))return;
setupDone=false;
const key=CFG.keys[keyIdx];
ws=new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key='+encodeURIComponent(key));
ws.onopen=()=>{const s={model:'models/'+CFG.model,
 generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:CFG.voice}}}},
 systemInstruction:{parts:[{text:CFG.system}]},
 tools:CFG.tools,
 inputAudioTranscription:{},
 sessionResumption:resumeHandle?{handle:resumeHandle}:{},
 contextWindowCompression:{slidingWindow:{}}};
 if(outTxEnabled)s.outputAudioTranscription={};
 ws.send(JSON.stringify({setup:s}))};
ws.onmessage=async ev=>{const d=typeof ev.data==='string'?ev.data:await ev.data.text();let m;try{m=JSON.parse(d)}catch(e){return}
 if(m.setupComplete){setupDone=true;setupAt=Date.now();earlyCloses=0;t0=t0||Date.now();
  if(!resumeHandle&&CFG.rehydrate&&!rehydrated){rehydrated=true;
   ws.send(JSON.stringify({clientContent:{turns:[{role:'user',parts:[{text:'[REHYDRATE]\\n'+CFG.rehydrate}]}],turnComplete:false}}));}
  st('🎙 LIVE');flushPending();return}
 if(m.sessionResumptionUpdate&&m.sessionResumptionUpdate.resumable)resumeHandle=m.sessionResumptionUpdate.newHandle;
 if(m.goAway){return}
 if(m.toolCall){
  maybeAck();
  if(window.setToolActive) window.setToolActive(true); // <--- TRIGGER VISUAL
  const rs=await Promise.all(m.toolCall.functionCalls.map(toolCall));
  if(window.setToolActive) setTimeout(() => window.setToolActive(false), 800); // <--- END VISUAL AFTER DELAY

  if(ws&&ws.readyState===1)ws.send(JSON.stringify({toolResponse:{functionResponses:rs}}));return}
 const sc=m.serverContent;if(!sc)return;
 if(sc.interrupted)stopPlayback();
 if(sc.inputTranscription&&sc.inputTranscription.text)post('CAPTAIN',sc.inputTranscription.text);
 if(sc.outputTranscription&&sc.outputTranscription.text)post('GAFFER',sc.outputTranscription.text);
 if(sc.modelTurn)for(const p of (sc.modelTurn.parts||[]))if(p.inlineData&&p.inlineData.data)playPCM(unb64(p.inlineData.data));
};
ws.onclose=e=>{if(closing)return;
 if(parking){parking=false;setupDone=false;return}
 if(outTxEnabled&&setupAt&&(Date.now()-setupAt<20000)&&(e.code===1007||e.code===1011)){
  if(++earlyCloses>=2){outTxEnabled=false;}}
 if((e.code===1011||e.code===1008||/quota|exhaust|resource/i.test(e.reason||''))){
   const k=nextKey();if(k){connect();return}
   return}
 setTimeout(connect,800)};
}

// LOCAL VAD
let vadNoise=-70,talking=false,lastVoice=0,segOpen=false,preroll=[],outQ=[],pending=[];
function vadFrame(i16){let s=0;for(let i=0;i<i16.length;i++){const v=i16[i]/32768;s+=v*v}
 const db=10*Math.log10(s/i16.length+1e-10);
 if(db<vadNoise+3)vadNoise=vadNoise*0.995+db*0.005;
 
 // AMBIENT SINGULARITY PULSE
 let vol = Math.max(0, Math.min(1, (db + 70) / 70));
 if(window.setAudioPulse) window.setAudioPulse(vol);
 
 return db>Math.max(vadNoise+CFG.vad.onset_db_over_noise,CFG.vad.min_db)}
function onFrame(i16){const voiced=vadFrame(i16),now=Date.now();
 if(voiced){lastVoice=now;
  if(!talking){talking=true;segOpen=true;outQ=preroll.splice(0);
   if(awaitThink&&lastPlayEnd){stamp('captain_think',now-lastPlayEnd);awaitThink=false}
   if(!ws||ws.readyState>1){connect()}}}
 if(talking){outQ.push(i16);
  if(now-lastVoice>CFG.vad.hangover_ms){talking=false;flushAudio();endSegment()}}
 else{preroll.push(i16);let ms=0;for(const f of preroll)ms+=f.length/16;
  while(ms>CFG.vad.preroll_ms&&preroll.length){ms-=preroll[0].length/16;preroll.shift()}}}
function concatFrames(fr){let n=0;for(const f of fr)n+=f.length;const o=new Int16Array(n);let p=0;for(const f of fr){o.set(f,p);p+=f.length}return o}
function sendAudio(i16){const msg=JSON.stringify({realtimeInput:{audio:{data:b64(i16.buffer),mimeType:'audio/pcm;rate=16000'}}});
 if(ws&&ws.readyState===1&&setupDone)ws.send(msg);else{pending.push(msg);if(pending.length>120)pending.shift()}}
function flushAudio(){if(!outQ.length)return;sendAudio(concatFrames(outQ.splice(0)))}
function endSegment(){if(!segOpen)return;segOpen=false;
 segEndAt=Date.now();awaitGaffer=true;
 const m=JSON.stringify({realtimeInput:{audioStreamEnd:true}});
 if(ws&&ws.readyState===1&&setupDone)ws.send(m);else pending.push(m)}
function flushPending(){if(!ws||ws.readyState!==1)return;for(const m of pending.splice(0))ws.send(m)}
setInterval(()=>{if(talking)flushAudio()},100);
setInterval(()=>{if(ws&&ws.readyState===1&&setupDone&&lastVoice&&!talking&&!liveSrcs.length&&!vidKind&&CFG&&Date.now()-lastVoice>CFG.vad.idle_disconnect_ms){
 parking=true;ws.close(1000)}},5000);

let txBuf=[];
function post(who,text){
    const subs = document.getElementById('subtitles');
    if(subs) {
        subs.innerText = text;
        subs.style.color = (who === 'CAPTAIN') ? 'rgba(255, 170, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        subs.style.opacity = 1;
        // The Gaffer response usually lights up the singularity natively, but let's just make sure it stays alive
        if(who === 'GAFFER' && window.setAudioPulse) { window.setAudioPulse(0.4); setTimeout(() => window.setAudioPulse(0), 1000); }
        setTimeout(() => {
            if (subs.innerText === text) subs.style.opacity = 0;
        }, 4000);
    }
    txBuf.push(who+': '+text);if(txBuf.length>=6)flush()
}
function flush(){if(!txBuf.length)return;fetch('/transcript',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lines:txBuf.splice(0),mode:MODE})})}
setInterval(flush,15000);
function mins(){if(!t0)return;fetch('/minutes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({minutes:Math.round((Date.now()-t0)/60000*10)/10})});t0=Date.now()}
setInterval(mins,60000);window.addEventListener('beforeunload',()=>{closing=true;flush();mins();sendStamps()});

function micHelp(e){ return 'MIC ERROR '+(e.name||'')+': '+(e.message||e) }
document.getElementById('btn-start').onclick=async()=>{
 diag('');let mic=null;
 const btn = document.getElementById('btn-start');
 btn.style.opacity = 0;
 setTimeout(() => btn.style.display = 'none', 1000);
 if(window.setAudioPulse) { window.setAudioPulse(0.5); setTimeout(() => window.setAudioPulse(0.05), 1000); }
 const subs = document.getElementById('subtitles');
 if(subs) { subs.innerText = "Requesting microphone access..."; subs.style.opacity = 1; }

 try{
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw Object.assign(new Error('secure-context missing'),{name:'InsecureContext'});
  mic=await navigator.mediaDevices.getUserMedia({audio:{sampleRate:16000,channelCount:1,echoCancellation:true,noiseSuppression:true}});
 }catch(e){diag(micHelp(e));return}

 if(subs) { subs.innerText = "Mic armed. Waiting for voice to connect..."; }

 try{
  CFG=await (await fetch('/config?mode='+MODE)).json();
  acOut=new (window.AudioContext||window.webkitAudioContext)();
  micCtx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:16000});
  const src=micCtx.createMediaStreamSource(mic);
  try{
   await micCtx.audioWorklet.addModule(URL.createObjectURL(new Blob([
    "registerProcessor('pcm',class extends AudioWorkletProcessor{process(inp){const ch=inp[0][0];if(ch){const i16=new Int16Array(ch.length);for(let i=0;i<ch.length;i++)i16[i]=Math.max(-32768,Math.min(32767,ch[i]*32768));this.port.postMessage(i16.buffer,[i16.buffer])}return true}})"
   ],{type:'application/javascript'})));
   const node=new AudioWorkletNode(micCtx,'pcm');
   node.port.onmessage=e=>onFrame(new Int16Array(e.data));
   src.connect(node);
  }catch(e){
   const sp=micCtx.createScriptProcessor(2048,1,1);
   sp.onaudioprocess=ev=>{const ch=ev.inputBuffer.getChannelData(0);const i16=new Int16Array(ch.length);for(let i=0;i<ch.length;i++)i16[i]=Math.max(-32768,Math.min(32767,ch[i]*32768));onFrame(i16)};
   src.connect(sp);sp.connect(micCtx.destination);
  }
  lastVoice=Date.now();
 }catch(e){diag('SETUP ERROR '+(e.name||'')+': '+(e.message||e));}
};

window.addEventListener('keydown', (e) => {
    if(e.key === 'v' || e.key === 'V') toggleVision('camera');
    if(e.key === 's' || e.key === 'S') toggleVision('screen');
});

    </script>
</body>
</html>`;

// ---------------------------------------------------------------------------
// main — the bridge server (localhost only)
// ---------------------------------------------------------------------------
async function main() {
  if ((process.argv[2] || "").toLowerCase() === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  if ((process.argv[2] || "").toLowerCase() === "index") {
    const n = await indexRecall();
    console.log(`dugout: recall index +${n} new chunk(s) of his words`);
    return;
  }
  const keys = loadKeys();
  if (!keys.length) { console.log("dugout: no GEMINI_API_KEY found (~/.gemini/.env) — wire setup/GEMINI_CLI_SETUP.md first"); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });
  ensureAcks();   // fire-and-forget; offline = honest skip line
  setInterval(() => fireReminders().then(n => { if (n) console.log(`dugout: ${n} his-voice reminder(s) echoed`); }).catch(() => { }), 30000);
  // the shadow engine trains while the voice surface is alive (detection is
  // silent by construction; the mouth needs no wire to stay shut)
  setInterval(() => { try { execFileSync(process.execPath, [join(__dirname, "shadow.mjs"), "detect"], { windowsHide: true, timeout: 30000 }); } catch { } }, 600000);
  indexRecall().then(n => { if (n) console.log(`dugout: recall index +${n} of his words`); }).catch(() => { });
  setInterval(() => indexRecall().catch(() => { }), 3600000);   // his words become findable, hourly
  const server = createServer(async (req, res) => {
    const send = (code, body, type = "application/json") => { res.writeHead(code, { "Content-Type": type }); res.end(typeof body === "string" ? body : JSON.stringify(body)); };
    try {
      if (req.method === "GET" && (req.url === "/" || req.url.startsWith("/?"))) return send(200, PAGE, "text/html");
      if (req.method === "GET" && req.url.startsWith("/config")) {
        const mode = new URL(req.url, "http://x").searchParams.get("mode") === "scrimmage" ? "scrimmage" : "gaffer";
        return send(200, buildConfig(keys, mode));
      }
      if (req.method === "GET" && /^\/ack\/\d+$/.test(req.url || "")) {
        const files = (() => { try { return readdirSync(ACK_DIR).filter(f => f.endsWith(".mp3")).sort(); } catch { return []; } })();
        const f = files[Number(req.url.split("/")[2])];
        if (!f) return send(404, { error: "no such ack" });
        res.writeHead(200, { "Content-Type": "audio/mpeg" });
        return res.end(readFileSync(join(ACK_DIR, f)));
      }
      if (req.method === "POST") {
        let raw = ""; for await (const c of req) raw += c;
        const body = raw ? JSON.parse(raw) : {};
        if (req.url === "/tool") {
          if (body.name === "semantic_recall") return send(200, await execRecall(body.args || {}));   // the one async tool
          return send(200, execTool(body.name, body.args || {}, { mode: body.mode === "scrimmage" ? "scrimmage" : undefined }));
        }
        if (req.url === "/transcript") {
          appendFileSync(join(OUT_DIR, localDate() + ".md"), body.lines.join("\n") + "\n");
          // THE EAR'S ONE LEGAL SURFACE — hedge-density, scrimmage mode only,
          // counted off-mic, never voiced mid-session (law).
          if (body.mode === "scrimmage") {
            for (const line of body.lines) {
              if (!String(line).startsWith("CAPTAIN:")) continue;
              const h = countHedges(line);
              if (h) appendFileSync(join(STATE_DIR, "dugout_scrimmage.jsonl"), JSON.stringify({ ts: new Date().toISOString(), hedges: h }) + "\n");
            }
          }
          return send(200, { ok: true });
        }
        if (req.url === "/minutes") {
          appendFileSync(DLEDGER, JSON.stringify({ ts: new Date().toISOString(), minutes: body.minutes || 0 }) + "\n");
          return send(200, { ok: true });
        }
        if (req.url === "/stamps") {
          // true think-time from the wire (L4 sense — highest data-ROI):
          // captain_think = Gaffer's audio ends → his voice starts
          // gaffer_respond = his segment ends → first reply audio
          for (const s of (body.stamps || [])) {
            const ms = Number(s.ms);
            if (!Number.isFinite(ms) || ms <= 0 || ms > 120000) continue;   // walked away ≠ thought
            appendFileSync(STAMPS, JSON.stringify({ ts: new Date().toISOString(), kind: String(s.kind).slice(0, 24), ms: Math.round(ms) }) + "\n");
            if (s.kind === "captain_think") runtime.last_think_ms = Math.round(ms);
          }
          return send(200, { ok: true });
        }
      }
      send(404, { error: "not found" });
    } catch (e) { send(500, { error: String(e.message).slice(0, 200) }); }
  });
  // double-click friendly: if a bridge already owns the port, don't crash —
  // just open the page and leave (the captain never sees EADDRINUSE).
  server.on("error", (e) => {
    if (e && e.code === "EADDRINUSE") {
      console.log(`dugout: bridge already live on http://localhost:${PORT} — opening it.`);
      if (!process.env.DUGOUT_NO_OPEN) { try { execFileSync("cmd", ["/c", "start", "", `http://localhost:${PORT}`], { windowsHide: true }); } catch { } }
      process.exit(0);
    }
    throw e;
  });
  // --lan (U4): the Dugout on his PHONE browser while pacing the house.
  // Home-wifi only; localhost stays the default. Phone mic on plain http
  // needs the documented one-time browser flag (setup/VOICE_SETUP.md §LAN).
  const lan = process.argv.includes("--lan");
  server.listen(PORT, lan ? "0.0.0.0" : "127.0.0.1", () => {
    console.log(`dugout: LIVE bridge on http://localhost:${PORT} — ${keys.length} key(s) in the pool. Open it, press START, talk.`);
    if (lan) {
      const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === "IPv4" && !i.internal).map(i => i.address);
      console.log(`dugout: LAN mode — phone browser: http://${ips[0] || "<your-ip>"}:${PORT}`);
      console.log(`dugout: phone mic needs a one-time flag — chrome://flags/#unsafely-treat-insecure-origin-as-secure → add http://${ips[0] || "<your-ip>"}:${PORT} (see setup/VOICE_SETUP.md)`);
    }
    if (!process.env.DUGOUT_NO_OPEN && !lan) { try { execFileSync("cmd", ["/c", "start", "", `http://localhost:${PORT}`], { windowsHide: true }); } catch { } }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { execTool, buildConfig, buildSystemInstruction, loadKeys, TOOL_DECLS, PAGE, execRecall, indexRecall, cosine, dayPhase };
