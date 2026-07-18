#!/usr/bin/env node
// ============================================================================
// mcp-memory.mjs · ARSENAL AI FC — THE ORGANISM-MEMORY MCP (working-memory P2)
// ----------------------------------------------------------------------------
// WHAT: a dependency-free stdio JSON-RPC 2.0 MCP server that gives ANY MCP host
//   (Claude Code via .mcp.json · Claude Desktop via its own config) a door into
//   the ONE working memory. Four tools:
//     · recall(query)      — semantic recall over his durable memory: ONE cosine
//                            surface merging episodes.jsonl + recall_index.jsonl
//                            at read time (lexical fallback when the pool is dry).
//     · note(kind,text)    — write a salient moment (doubt/win/preference/thread/
//                            note): kept in the MCP's own scribe_log AND routed
//                            through the thalamus door (:4113 = SOLE writer of the
//                            shared bus), so a Desktop confusion reaches the Gaffer.
//     · get_context()      — buildRehydrateCartridge() + the distiller working_set:
//                            "where he is right now", for session re-entry.
//     · remember_fact(text)— STAGES to identity_facts.pending.jsonl. NEVER canon;
//                            needs a separate human confirm (Law 4).
// LAWS: single-writer (the MCP owns scribe_log.jsonl + identity_facts.pending.jsonl
//   only; the thalamus stays sole writer of afferent) · reads are read-only · the
//   deep write path (remember_fact) proposes, never acts · repo is PUBLIC so the
//   moments live under the gitignored dressing-room/hippocampus/ — the machinery
//   ships, the moments never do.
// MODES: node scripts/mcp-memory.mjs           → the stdio MCP server (host-spawned)
//        node scripts/mcp-memory.mjs selftest  → baked-mock checks (no net, no live state)
// ============================================================================
import { readFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInterface } from "node:readline";
import { buildRehydrateCartridge, embedPool } from "./hippocampus.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT   = join(__dirname, "..");
const HIPPO  = join(ROOT, "dressing-room", "hippocampus");         // gitignored — his moments
const STATE  = join(ROOT, "dressing-room", "state");
const EPISODES      = join(HIPPO, "episodes.jsonl");
const RECALL_INDEX  = join(STATE, "recall_index.jsonl");           // his words, embedded (gitignored)
const WORKING_SET   = join(STATE, "working_set.json");             // the distiller's 4-slot whiteboard
const PENDING_FACTS = join(HIPPO, "identity_facts.pending.jsonl"); // staged facts (Law 4)
const SCRIBE_LOG    = join(HIPPO, "scribe_log.jsonl");             // the MCP's own note record
const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";

const NAME = "organism-memory", VERSION = "0.1.0", PROTOCOL = "2024-11-05";
const NOTE_KINDS = ["doubt", "win", "preference", "thread", "note"];

// ---- helpers (defensive: a missing/corrupt file reads as empty, never a throw) ----
const readJson  = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const out = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split(/\r?\n/)) { const s = l.trim(); if (s) try { out.push(JSON.parse(s)); } catch {} } } catch {} return out; };
const cosine = (a, b) => { if (!a || !b || a.length !== b.length) return 0; let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return (na && nb) ? d / (Math.sqrt(na) * Math.sqrt(nb)) : 0; };
const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
const words = (s) => String(s).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => (/[ऀ-ॿ]/.test(w) ? w.length >= 2 : w.length > 3));
const nowIso = (deps) => (deps.now || new Date()).toISOString();
function appendLine(p, obj) { mkdirSync(dirname(p), { recursive: true }); appendFileSync(p, JSON.stringify(obj) + "\n"); }

// ---- recall(query) — the shared cosine surface (episodes ⊕ recall_index), lexical fallback ----
async function recall(query, deps = {}) {
  const q = clip(query, 400);
  if (q.length < 2) return { hits: [], mode: "empty", note: "query too short" };
  const episodes = (deps.episodes || readLines(EPISODES)).filter(e => e && e.text);
  const index    = (deps.index    || readLines(RECALL_INDEX)).filter(r => r && r.text);
  const embed = deps.embed || embedPool;
  let qv = null;
  try { const e = await embed([q]); qv = e && e[0]; } catch { qv = null; }   // pool dry → honest lexical
  const pool = [
    ...episodes.map(e => ({ source: "episode", kind: e.kind || "episode", day: e.day || null, text: e.text, vec: e.vec })),
    ...index.map(r => ({ source: "recall", kind: r.kind || "word", day: r.day || null, text: r.text, vec: r.vec })),
  ];
  const k = deps.k || 3;
  if (qv) {
    const scored = pool.filter(h => Array.isArray(h.vec)).map(h => ({ source: h.source, kind: h.kind, day: h.day, text: h.text, score: cosine(qv, h.vec) }));
    const hits = scored.filter(h => h.score >= (deps.threshold || 0.55)).sort((a, b) => b.score - a.score).slice(0, k).map(h => ({ ...h, score: Math.round(h.score * 100) / 100 }));
    if (hits.length) return { hits, mode: "semantic" };
  }
  // lexical fallback: term overlap (pool dry, no vectors, or nothing over threshold)
  const qw = new Set(words(q));
  const hits = pool.map(h => ({ source: h.source, kind: h.kind, day: h.day, text: h.text, score: words(h.text).filter(w => qw.has(w)).length }))
    .filter(h => h.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
  return { hits, mode: "lexical" };
}

// ---- note(kind,text) — own scribe_log (never lost) + best-effort thalamus POST (shared bus) ----
async function defaultPost(evt) {
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 400);
    const r = await fetch(THALAMUS + "/afferent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(evt), signal: ctrl.signal });
    clearTimeout(to); return !!(r && r.ok);
  } catch { return false; }
}
async function note(kind, text, deps = {}) {
  const k = NOTE_KINDS.includes(kind) ? kind : "note";      // unknown kind degrades, never rejects
  const t = clip(text, 1200);
  if (!t) return { ok: false, error: "empty text" };
  const row = { ts: nowIso(deps), kind: k, text: t, source: "mcp" };
  (deps.append || ((o) => appendLine(SCRIBE_LOG, o)))(row);   // own file first — a note is never lost
  const post = deps.post || defaultPost;
  let posted = false;
  try { posted = await post({ modality: "desktop-study", source: "organism-memory", text: `[${k}] ${t}`, ts: row.ts }); } catch { posted = false; }
  return { ok: true, kind: k, staged_to: "scribe_log", posted };
}

// ---- get_context() — rehydrate cartridge ⊕ the distiller working_set (READ-only) ----
function getContext(deps = {}) {
  const cart = deps.cartridge ? deps.cartridge() : buildRehydrateCartridge();
  const ws = deps.ws !== undefined ? deps.ws : readJson(WORKING_SET);
  const parts = [];
  if (cart) parts.push(cart);
  if (ws && typeof ws === "object") {
    const line = [
      "concept: " + (ws.concept_in_motion || ws.concept || "—"),
      "open loop: " + (ws.open_loop || "—"),
      "left off: " + (ws.where_left_off || "—"),
      "next: " + (ws.next_step || ws.next_obvious_step || "—"),
    ].join(" · ");
    parts.push("WORKING SET (the distiller's live whiteboard):\n" + line);
  }
  return parts.length ? parts.join("\n\n") : "no context yet — the memory is empty.";
}

// ---- remember_fact(text) — STAGE only (Law 4: proposes, never acts on canon) ----
function rememberFactStaged(text, deps = {}) {
  const t = clip(text, 400);
  if (!t) return { ok: false, error: "empty text" };
  const row = { ts: nowIso(deps), text: t, status: "pending", source: "mcp" };
  (deps.append || ((o) => appendLine(PENDING_FACTS, o)))(row);
  return { ok: true, staged: true, note: "staged to identity_facts.pending.jsonl — needs your explicit confirm before it becomes canon (Law 4). Nothing was written to the identity ledger." };
}

// ---- the stdio JSON-RPC 2.0 server (MCP) ----
const TOOLS = [
  { name: "recall", description: "Semantic recall over the captain's durable memory (his past episodes + his embedded words). Returns his most relevant real moments — doubts, wins, threads — for a query. Read-only.", inputSchema: { type: "object", properties: { query: { type: "string", description: "what to recall about (a concept, a feeling, a thread)" } }, required: ["query"] } },
  { name: "note", description: "Write a salient moment into the shared working memory — a doubt he voiced, a win, a stated preference, an open thread, or a plain note. It is kept locally AND routed to the thalamus so it reaches every surface (Code, the Gaffer).", inputSchema: { type: "object", properties: { kind: { type: "string", enum: NOTE_KINDS, description: "doubt | win | preference | thread | note" }, text: { type: "string", description: "his words, verbatim where possible" } }, required: ["text"] } },
  { name: "get_context", description: "Rehydrate where the captain is right now: his identity cartridge + who-he-is + last durable episodes + the distiller's live working set. Call at the start of a session so you never ask him to re-explain.", inputSchema: { type: "object", properties: {} } },
  { name: "remember_fact", description: "STAGE a durable identity fact about the captain. It is NOT saved to canon — it waits in a pending file for his explicit confirmation (Law 4). Use for stable truths about who he is, not passing state.", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
];

async function dispatch(name, args, deps = {}) {
  args = args || {};
  if (name === "recall")        return await recall(args.query, deps);
  if (name === "note")          return await note(args.kind, args.text, deps);
  if (name === "get_context")   return getContext(deps);
  if (name === "remember_fact") return rememberFactStaged(args.text, deps);
  throw new Error("unknown tool: " + name);
}

function send(msg) { process.stdout.write(JSON.stringify(msg) + "\n"); }

async function handle(msg, deps = {}) {
  const { id, method, params } = msg || {};
  const isNotification = (id === undefined || id === null);
  // JSON-RPC 2.0: a notification (no id) NEVER gets a reply. Gate EVERY send on it —
  // so an id-less request-method (e.g. a stray `ping` with no id) can't emit an id-less frame.
  const reply = (payload) => { if (!isNotification) send({ jsonrpc: "2.0", id, ...payload }); };
  try {
    if (method === "notifications/initialized" || method === "initialized") return;   // pure notification → silent
    if (method === "initialize") return reply({ result: { protocolVersion: PROTOCOL, capabilities: { tools: {} }, serverInfo: { name: NAME, version: VERSION } } });
    if (method === "ping") return reply({ result: {} });
    if (method === "tools/list") return reply({ result: { tools: TOOLS } });
    if (method === "tools/call") {
      const out = await dispatch(params && params.name, params && params.arguments, deps);
      const text = typeof out === "string" ? out : JSON.stringify(out, null, 2);
      return reply({ result: { content: [{ type: "text", text }] } });
    }
    reply({ error: { code: -32601, message: "method not found: " + method } });
  } catch (e) {
    reply({ error: { code: -32603, message: String((e && e.message) || e) } });
  }
}

function serve() {
  const rl = createInterface({ input: process.stdin });
  rl.on("line", (line) => { const s = line.trim(); if (!s) return; let msg; try { msg = JSON.parse(s); } catch { return; } handle(msg); });
  rl.on("close", () => process.exit(0));
}

// ---- selftest (baked mocks — no network, no live-state writes) ----
async function selftest() {
  const checks = [];
  const assert = (n, c) => { checks.push(!!c); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const mockEmbed = async (ts) => ts.map(t => /attention/i.test(t) ? [1, 0, 0] : /cosine/i.test(t) ? [0, 1, 0] : [0, 0, 1]);
  const episodes = [
    { id: "e1", kind: "doubt", day: "2026-07-10", text: "attention scaling confuses me", vec: [1, 0, 0] },
    { id: "e2", kind: "win", day: "2026-07-11", text: "nailed cosine similarity", vec: [0, 1, 0] },
  ];
  const index = [{ kind: "word", day: "2026-07-12", text: "why attention is quadratic", vec: [0.94, 0.1, 0] }];

  const r = await recall("attention", { embed: mockEmbed, episodes, index, threshold: 0.5 });
  assert("recall: ONE semantic surface merges episodes + recall_index, cosine-ranked", r.mode === "semantic" && r.hits.length >= 1 && /attention/.test(r.hits[0].text));
  assert("recall: the attention episode wins (score ~1)", r.hits[0].source === "episode" && r.hits[0].score >= 0.9);
  const rl = await recall("cosine similarity", { embed: async () => { throw new Error("dry"); }, episodes, index });
  assert("recall: pool dry → lexical fallback still finds the cosine win", rl.mode === "lexical" && rl.hits.some(h => /cosine/.test(h.text)));
  assert("recall: a nothing query returns no hits, never a crash", (await recall("zzzq", { embed: async () => null, episodes, index })).hits.length === 0);

  let logged = null, postedEvt = null;
  const n = await note("doubt", "kv-cache feels like magic", { append: (o) => { logged = o; }, post: async (e) => { postedEvt = e; return true; }, now: new Date("2026-07-14T10:00:00Z") });
  assert("note: lands in the scribe log verbatim, kind preserved", logged && logged.text === "kv-cache feels like magic" && logged.kind === "doubt" && logged.source === "mcp");
  assert("note: routes to the thalamus door (modality desktop-study, [kind] tag)", postedEvt && postedEvt.modality === "desktop-study" && /\[doubt\]/.test(postedEvt.text) && n.posted === true);
  assert("note: unknown kind degrades to 'note', never rejected", (await note("vibe", "x", { append: () => {}, post: async () => false })).kind === "note");
  assert("note: thalamus down → still ok (own file already holds it)", (await note("win", "held the derby", { append: () => {}, post: async () => false })).ok === true);

  const ctx = getContext({ cartridge: () => "IDENTITY: he is the captain.", ws: { concept_in_motion: "hallucinations", open_loop: "why grounding fails", where_left_off: "detection strategies", next_step: "read the eval doc" } });
  assert("get_context: fuses rehydrate cartridge + the distiller working set", /IDENTITY/.test(ctx) && /hallucinations/.test(ctx) && /WORKING SET/.test(ctx));
  assert("get_context: empty memory → a valid line, never a crash", typeof getContext({ cartridge: () => null, ws: null }) === "string");

  let staged = null;
  const rf = rememberFactStaged("prefers Hinglish, direct — not a hype-man", { append: (o) => { staged = o; }, now: new Date("2026-07-14T10:00:00Z") });
  assert("remember_fact: STAGES with status pending — never writes canon (Law 4)", staged && staged.status === "pending" && rf.staged === true && /pending/.test(rf.note));

  // JSON-RPC framing — initialize / tools/list / tools/call / notification
  const sent = []; const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (s) => { try { sent.push(JSON.parse(String(s).trim())); } catch {} return true; };
  try {
    await handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
    await handle({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    await handle({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "recall", arguments: { query: "attention" } }, }, { embed: mockEmbed, episodes, index, threshold: 0.5 });
    await handle({ jsonrpc: "2.0", method: "notifications/initialized" });      // notification → silent
    await handle({ jsonrpc: "2.0", method: "ping" });                            // id-less request-method → also silent
    await handle({ jsonrpc: "2.0", id: 5, method: "bogus/method" });             // unknown → error
  } finally { process.stdout.write = orig; }
  assert("rpc: initialize returns protocolVersion + serverInfo(name)", sent[0] && sent[0].result && sent[0].result.serverInfo && sent[0].result.serverInfo.name === NAME);
  assert("rpc: tools/list advertises all 4 tools", sent[1] && sent[1].result && sent[1].result.tools.length === 4 && sent[1].result.tools.map(t => t.name).sort().join(",") === "get_context,note,recall,remember_fact");
  assert("rpc: tools/call returns MCP content blocks", sent[2] && sent[2].result && Array.isArray(sent[2].result.content) && sent[2].result.content[0].type === "text");
  assert("rpc: notifications + id-less request-methods draw NO reply (every frame carries an id)", sent.every(m => m.id !== undefined && m.id !== null));
  assert("rpc: unknown method → JSON-RPC error -32601", sent.find(m => m.id === 5) && sent.find(m => m.id === 5).error && sent.find(m => m.id === 5).error.code === -32601);

  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  serve();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { recall, note, getContext, rememberFactStaged, dispatch, handle, TOOLS };
