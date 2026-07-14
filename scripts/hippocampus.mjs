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
// LAWS:  single writer of dressing-room/hippocampus/* (ALL gitignored — his
//        moments never touch the public repo). Facts verbatim, byte-exact.
//        remember/forget fire on HIS words only (the Dugout constitution
//        carries the gate; this organ enforces shape). Layering: the batch
//        recall_index.jsonl + indexRecall() stay untouched as the back-fill
//        floor — this is the live layer on top.
// MODES: mark <kind>  (text on stdin) · remember (stdin) · forget <id> ·
//        index · consolidate [--force] · consolidate-store · cartridge ·
//        recall "<text>" · selftest
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
async function embedPool(texts, keys = loadKeys(), fetchFn = fetch) {
  if (!texts.length) return [];
  const model = process.env.HIPPO_EMBED_MODEL || "gemini-embedding-001";
  for (const key of keys) {
    try {
      const r = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${encodeURIComponent(key)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: texts.map(t => ({ model: `models/${model}`, content: { parts: [{ text: String(t).slice(0, 1500) }] } })) }),
      });
      if (!r.ok) continue;
      const j = await r.json();
      const vecs = (j.embeddings || []).map(e => e.values);
      if (vecs.length) return vecs;
    } catch { }
  }
  return null;
}
// models walk a fallback ladder (preview churn law: probed live 14 Jul 2026 —
// bare "gemini-3.1-flash" is NOT on the wire; the -latest aliases survive churn)
async function generatePool(prompt, { models, maxOutputTokens = 2048, json = false, keys = loadKeys(), fetchFn = fetch } = {}) {
  const ladder = models || [process.env.HIPPO_GEN_MODEL, "gemini-3.1-pro-preview", "gemini-flash-latest"].filter(Boolean);
  let lastStatus = null;                              // M16 — callers with a PINNED key learn WHY it failed (429 = lane dry)
  for (const model of ladder) {
    for (const key of keys) {
      try {
        const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 120000);
        const gc = { maxOutputTokens, temperature: 0.4 };
        if (json) gc.responseMimeType = "application/json";   // the wire enforces JSON, not the prompt
        const r = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: gc }),
        });
        clearTimeout(t);
        if (!r.ok) { lastStatus = r.status; continue; }
        const j = await r.json();
        const text = (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.map(p => p.text || "").join("");
        if (text) return { ok: true, text, model, error: null };
      } catch { }
    }
  }
  return { ok: false, text: null, error: "every key dry on every model", status: lastStatus };
}

// ---------------------------------------------------------------------------
// L1 — THE SCRIBE
// ---------------------------------------------------------------------------
async function markMoment(kind, text, deps = {}) {
  const k = String(kind || "").toLowerCase();
  if (!KINDS.includes(k)) return { ok: false, error: `kind must be ${KINDS.join("|")}` };
  const t = String(text || "").trim();
  if (!t) return { ok: false, error: "no words — a moment is his words, verbatim" };
  const embed = deps.embed || embedPool;
  const append = deps.append || ((row) => { mkdirSync(HIPPO_DIR, { recursive: true }); appendFileSync(EPISODES, JSON.stringify(row) + "\n"); });
  const now = deps.now || new Date();
  const vecs = await embed([t]).catch(() => null);
  const row = { id: textHash(t + now.toISOString()), ts: now.toISOString(), day: localDate(now), kind: k, text: t.slice(0, 500), vec: (vecs && vecs[0]) || null, recalls: 0 };
  append(row);
  return { ok: true, id: row.id, embedded: !!row.vec };
}
// embed-pending sweep — offline moments get their vectors when the pool wakes
async function indexEpisodes(deps = {}) {
  const embed = deps.embed || embedPool;
  const file = deps.file || EPISODES;
  const rows = readLines(file);
  const pending = rows.filter(r => !r.vec);
  if (!pending.length) return 0;
  const vecs = await embed(pending.map(r => r.text));
  if (!vecs) return 0;
  let n = 0;
  pending.forEach((r, i) => { if (vecs[i]) { r.vec = vecs[i]; n++; } });
  (deps.write || ((rs) => writeAtomic(file, rs.map(x => JSON.stringify(x)).join("\n") + "\n")))(rows);
  return n;
}

// ---------------------------------------------------------------------------
// L2 — THE LEDGER OF SELF (captain-gated at the mouth; shape enforced here)
// ---------------------------------------------------------------------------
function rememberFact(text, deps = {}) {
  const t = String(text || "").trim();
  if (!t) return { ok: false, error: "no words to remember" };
  const facts = (deps.read || (() => readJson(FACTS)))() || { facts: [] };
  if (facts.facts.some(f => f.text === t)) return { ok: true, id: facts.facts.find(f => f.text === t).id, note: "already held" };
  if (facts.facts.length >= FACTS_CAP) return { ok: false, error: `the ledger holds ${FACTS_CAP} facts max — forget one first (it must stay small enough to ALWAYS be present)` };
  const f = { id: textHash(t), ts: (deps.now || new Date()).toISOString(), text: t.slice(0, 240) };
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
function identityCartridge(facts = readJson(FACTS)) {
  const list = (facts && facts.facts) || [];
  if (!list.length) return "";
  return `THE LEDGER OF SELF (facts he told you to hold — ALWAYS present, never guessed):\n${list.map(f => `- ${f.text} [${f.id}]`).join("\n")}`;
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
function gatherDayMaterial(now = new Date(), deps = {}) {
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
async function consolidate(deps = {}) {
  const gen = deps.generate || generatePool;
  const now = deps.now || new Date();
  const material = deps.material || gatherDayMaterial(now);
  const old = (deps.readWho || (() => readJson(WHO)))();
  if (!material.episodes.length && !material.captain_lines.length && !deps.force) {
    return { ok: false, skipped: true, reason: "no fresh material — the old who_he_is stands" };
  }
  const prompt = `You maintain a ~1.5KB "who he is right now" file for a personal AI coach. Distill ONLY from the material below (his own words — invent NOTHING). Output STRICT JSON, no markdown fences, exactly these keys:
{"fingerprint": "<2-3 sentences: where he stands right now — concepts in motion, current arc>", "open_threads": ["<unfinished thought/doubt he'll want picked back up>"], "recent_wins": ["<specific, earned>"], "recent_cracks": ["<named plainly as data, never shame>"], "voice_tuning": "<one sentence: how he's been wanting the coach to talk lately>", "do_not": ["<things he's signaled to stop doing>"]}
Honest frame only (no hype words). No health/mood/emotion inference of ANY kind. Arrays ≤5 items, each ≤140 chars.

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
  return { ok: true, date: out.date, threads: obj.open_threads.length };
}
function whoCartridge(who = readJson(WHO)) {
  if (!who || !who.fingerprint) return "";
  return `WHO HE IS RIGHT NOW (consolidated ${who.date}): ${who.fingerprint}\nOpen threads: ${(who.open_threads || []).join(" · ") || "—"}\nRecent wins: ${(who.recent_wins || []).join(" · ") || "—"}\nVoice tuning: ${who.voice_tuning || "—"}${(who.do_not || []).length ? `\nDo not: ${who.do_not.join(" · ")}` : ""}`;
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
  const words = new Set(t.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  for (const th of (who && who.open_threads) || []) {
    const overlap = String(th).toLowerCase().split(/\W+/).filter(w => words.has(w)).length;
    if (overlap >= 3 && !best) best = { score: 0.56, id: "thread:" + textHash(String(th)), kind: "thread", day: who.date, text: String(th) };
  }
  if (!best) return null;
  return { id: best.id, kind: best.kind, text: best.text, hint: `${best.kind} · ${best.day} · his words: "${best.text}"`, score: Math.round(best.score * 100) / 100 };
}

// ---------------------------------------------------------------------------
// L0 — THE REHYDRATOR cartridge (identity + who + last-N durable episodes)
// ---------------------------------------------------------------------------
function buildRehydrateCartridge(deps = {}) {
  const parts = [];
  const idc = identityCartridge(deps.facts !== undefined ? deps.facts : readJson(FACTS));
  if (idc) parts.push(idc);
  const whc = whoCartridge(deps.who !== undefined ? deps.who : readJson(WHO));
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
    const ok = await markMoment("doubt", "tokenization feels like magic not math", { append: r => rows.push(r), embed: mockEmbed, now: new Date("2026-07-14T10:00:00Z") });
    assert("SCRIBE: moment lands verbatim + embedded + day-stamped", ok.ok && ok.embedded && rows[0].text === "tokenization feels like magic not math" && rows[0].day && rows[0].kind === "doubt");
    const off = await markMoment("win", "held the derby", { append: r => rows.push(r), embed: async () => null });
    assert("SCRIBE: pool dry → moment still lands (vec null, sweep later)", off.ok && rows[1].vec === null);
  }
  // the embed-pending sweep
  {
    let written = null;
    const rows = [{ id: "a", text: "tokenization thing", vec: null }, { id: "b", text: "done", vec: [1, 0] }];
    const tmp = join(os.tmpdir(), `hippo-test-${Date.now()}.jsonl`);
    writeFileSync(tmp, rows.map(r => JSON.stringify(r)).join("\n") + "\n");
    const n = await indexEpisodes({ embed: mockEmbed, file: tmp, write: (rs) => { written = rs; } });
    assert("sweep embeds ONLY the pending rows (idempotent by shape)", n === 1 && written[0].vec && written[1].vec[0] === 1);
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
    assert("who cartridge reads back threads + tuning", whoCartridge(goodWho).includes("kv-cache") && whoCartridge(goodWho).includes("full lectures"));
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
  }

  // L0 — the rehydrator cartridge
  {
    const cart = buildRehydrateCartridge({ facts: { facts: [{ id: "f1", text: "mornings best" }] }, who: { date: "2026-07-14", fingerprint: "attention arc", open_threads: ["kv"], recent_wins: [], voice_tuning: "deep", do_not: [] }, episodes: [{ kind: "doubt", day: "2026-07-13", text: "softmax why" }] });
    assert("REHYDRATOR: identity + who + episodes in ONE cartridge", cart.includes("LEDGER OF SELF") && cart.includes("WHO HE IS") && cart.includes("softmax why"));
    assert("REHYDRATOR: empty organ → null (dormant-safe, no noise)", buildRehydrateCartridge({ facts: null, who: null, episodes: [] }) === null);
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
  if (mode === "index") { console.log(`hippocampus: ${await indexEpisodes()} pending episode(s) embedded`); return; }
  if (mode === "recall") { console.log(JSON.stringify(await recallReflex(process.argv.slice(3).join(" ")))); return; }
  if (mode === "cartridge") { console.log(buildRehydrateCartridge() || "(the organ is empty — it fills as he talks)"); return; }
  if (mode === "consolidate") {
    const r = await consolidate({ force: process.argv.includes("--force") });
    console.log(`hippocampus: consolidate → ${r.ok ? `who_he_is ${r.date} (${r.threads} open threads)` : (r.reason || r.error)}`);
    return;
  }
  if (mode === "consolidate-store") {
    const r = consolidateStore();
    console.log(`hippocampus: store → hot ${r.hot} · sharded ${r.sharded} · forgotten ${r.cold} (moved, never deleted)`);
    return;
  }
  console.log("hippocampus.mjs — mark <kind> | remember | forget <id> | index | recall \"...\" | cartridge | consolidate [--force] | consolidate-store | selftest");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { markMoment, indexEpisodes, rememberFact, forgetFact, identityCartridge, whoCartridge, consolidate, validateWho, recallReflex, buildRehydrateCartridge, consolidateStore, memoryStrength, generatePool, embedPool, loadKeys as loadHippoKeys };
