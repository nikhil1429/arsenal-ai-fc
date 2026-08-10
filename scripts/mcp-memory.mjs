#!/usr/bin/env node
// ============================================================================
// mcp-memory.mjs · ARSENAL AI FC — THE ORGANISM-MEMORY MCP (working-memory P2)
// ----------------------------------------------------------------------------
// WHAT: a dependency-free stdio JSON-RPC 2.0 MCP server that gives ANY MCP host
//   (Claude Code via .mcp.json · Claude Desktop via its own config) a door into
//   the ONE working memory. Four tools:
//     · recall(query)      — semantic recall over his durable memory: ONE cosine
//                            surface merging episodes.jsonl + recall_index.jsonl
//                            + the MCP's own scribe_log at read time, deduped
//                            (lexical fallback when the pool is dry).
//     · note(kind,text)    — write a salient moment (doubt/win/preference/thread/
//                            note): kept in the MCP's own scribe_log, routed
//                            through the thalamus door (:4113 = SOLE writer of the
//                            shared bus) so a Desktop confusion reaches the Gaffer,
//                            AND — for the kinds the hippocampus knows — handed to
//                            markMoment (its owner-writer) so the moment becomes a
//                            real, recallable episode even when the bus is down.
//     · get_context()      — buildRehydrateCartridge() + the distiller working_set
//                            + the teaching card: "where he is right now" AND how
//                            to teach him, for session re-entry.
//     · remember_fact(text)— STAGES to identity_facts.pending.jsonl. NEVER canon;
//                            needs a separate human confirm (Law 4). Since
//                            10 Aug 2026 it does NOT write that file itself — it
//                            hands the text to its OWNER, hippocampus.mjs.
// LAWS: single-writer — this server owns scribe_log.jsonl and NOTHING ELSE. The
//   thalamus stays sole writer of afferent; hippocampus.mjs is sole writer of
//   dressing-room/hippocampus/*, identity_facts.pending.jsonl included.
//   THAT LAST CLAUSE IS A REPAIR, 10 Aug 2026: this header used to claim the MCP
//   owned the pending file, while hippocampus.mjs:33 claimed all of hippocampus/ —
//   two files each declaring themselves the owner, so the docs could not even name
//   the conflict. The modes conflicted too: this organ APPENDED a staged row while
//   the hippocampus REWRITES every row on a promote/drop, so a rewrite racing an
//   append silently dropped a staged fact (the lost update; see the frozen legacy
//   at rememberFactStagedLegacy). It sat flagged-but-unrepaired in
//   ARSENAL_AI_FC_MASTERPLAN.md:142, ORGANISM_ANATOMY.md:112 and CYBORG_BRAIN.md:257,
//   all three ending "needs the captain's ruling". He ruled: ONE OWNER, and this
//   organ goes through its door.
//   · reads are read-only · the deep write path (remember_fact) proposes, never
//   acts · repo is PUBLIC so the moments live under the gitignored
//   dressing-room/hippocampus/ — the machinery ships, the moments never do.
// MODES: node scripts/mcp-memory.mjs           → the stdio MCP server (host-spawned)
//        node scripts/mcp-memory.mjs resync    → re-post notes whose thalamus POST failed
//        node scripts/mcp-memory.mjs selftest  → baked-mock checks (no net, no live state)
// ============================================================================
import { readFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInterface } from "node:readline";
// 10 Aug 2026 — the shell-to-owner lane for remember_fact. The precedent is
// dugout.mjs:1363's `sh(script, argv, input)`, which is how the Dugout already
// drives THIS organ's `mark` / `remember` / `forget` (dugout.mjs:1684-1692).
import { execFileSync } from "node:child_process";
import { buildRehydrateCartridge, embedPool, markMoment } from "./hippocampus.mjs";
// AUDIT 4 Aug 2026 (#14): the seventeen-rule cold-start card reached the
// SessionStart brief and nothing else, while CLAUDE.md names `get_context` as
// THE session-start call — so the mandated door was the one with no teaching
// rules behind it. Same parser, same document, same markers: REUSED, not
// forked. learnstate.mjs writes nothing and its main() is entry-point-gated, so
// importing it here is a pure read.
import { loadTeachingCard } from "./learnstate.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT   = join(__dirname, "..");
const HIPPO  = join(ROOT, "dressing-room", "hippocampus");         // gitignored — his moments
const STATE  = join(ROOT, "dressing-room", "state");
const EPISODES      = join(HIPPO, "episodes.jsonl");
const RECALL_INDEX  = join(STATE, "recall_index.jsonl");           // his words, embedded (gitignored)
const WORKING_SET   = join(STATE, "working_set.json");             // the distiller's 4-slot whiteboard
const PENDING_FACTS = join(HIPPO, "identity_facts.pending.jsonl"); // staged facts (Law 4) — READ-ONLY from here since 10 Aug 2026; hippocampus.mjs owns the write
const SCRIBE_LOG    = join(HIPPO, "scribe_log.jsonl");             // the MCP's own note record
const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";

const NAME = "organism-memory", VERSION = "0.1.0", PROTOCOL = "2024-11-05";
const NOTE_KINDS = ["doubt", "win", "preference", "thread", "note"];
// mirrors hippocampus.mjs KINDS (not exported there) — the kinds markMoment will
// accept as a real episode. "note" is ours alone: it stays scribe-only.
const HIPPO_KINDS = ["doubt", "win", "preference", "thread"];
// E2E audit (25 Jul 2026): the thalamus POST aborted at 400ms — very tight for a
// local HTTP round-trip on a machine that is also running the daemon stack, so a
// perfectly healthy door was being reported dead. 2.5s, env-overridable.
const POST_TIMEOUT_MS = Number(process.env.ARSENAL_MCP_POST_TIMEOUT_MS || 2500);

// ---- helpers (defensive: a missing/corrupt file reads as empty, never a throw) ----
const readJson  = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => { const out = []; try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split(/\r?\n/)) { const s = l.trim(); if (s) try { out.push(JSON.parse(s)); } catch {} } } catch {} return out; };
const cosine = (a, b) => { if (!a || !b || a.length !== b.length) return 0; let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return (na && nb) ? d / (Math.sqrt(na) * Math.sqrt(nb)) : 0; };
const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
const words = (s) => String(s).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => (/[ऀ-ॿ]/.test(w) ? w.length >= 2 : w.length > 3));
const nowIso = (deps) => (deps.now || new Date()).toISOString();
function appendLine(p, obj) { mkdirSync(dirname(p), { recursive: true }); appendFileSync(p, JSON.stringify(obj) + "\n"); }

// ---- recall(query) — the shared cosine surface (episodes ⊕ recall_index ⊕ scribe_log), lexical fallback ----
// E2E audit (25 Jul 2026): the same sentence genuinely lives on more than one
// surface — the Gaffer marks a doubt as an episode AND the nightly backfill
// embeds the identical transcript line into recall_index — and the merge took
// top-k with no dedupe, so ONE moment could eat 2 of the 3 hit slots and crowd
// out the other two things he actually said. Dedupe on normalised text BEFORE
// slicing to k: keep the highest-scoring copy, ties break toward the episode
// (it carries kind + day; a recall_index row usually carries neither).
const SURFACE_RANK = { episode: 0, note: 1, recall: 2 };
const normText = (s) => String(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
function dedupeTopK(scored, k) {
  const seen = new Set(), out = [];
  for (const h of scored.slice().sort((a, b) => (b.score - a.score) || ((SURFACE_RANK[a.source] ?? 9) - (SURFACE_RANK[b.source] ?? 9)))) {
    const key = normText(h.text);
    if (!key || seen.has(key)) continue;
    seen.add(key); out.push(h);
    if (out.length >= k) break;
  }
  return out;
}
async function recall(query, deps = {}) {
  const q = clip(query, 400);
  if (q.length < 2) return { hits: [], mode: "empty", note: "query too short" };
  const episodes = (deps.episodes || readLines(EPISODES)).filter(e => e && e.text);
  const index    = (deps.index    || readLines(RECALL_INDEX)).filter(r => r && r.text);
  // E2E audit (25 Jul 2026): recall read episodes ⊕ recall_index ONLY, so every
  // note() row that never became an episode — plain kind:"note", or a markMoment
  // the paraphrase-guard refused — was unreachable FOREVER: repo-wide, scribe_log
  // had literally zero readers. It is now a third surface. It carries no vec
  // (nothing embeds it), so it rides the lexical pass; the kinds that DO become
  // episodes (see note()) get their vectors from the hourly `hippocampus index`
  // sweep and rank semantically like any other moment. `_ack` delivery rows carry
  // no text, so the .text filter keeps them out of the pool.
  const scribe   = (deps.scribe   || readLines(SCRIBE_LOG)).filter(s => s && s.text);
  const embed = deps.embed || embedPool;
  let qv = null;
  try { const e = await embed([q]); qv = e && e[0]; } catch { qv = null; }   // pool dry → honest lexical
  const pool = [
    ...episodes.map(e => ({ source: "episode", kind: e.kind || "episode", day: e.day || null, text: e.text, vec: e.vec })),
    ...index.map(r => ({ source: "recall", kind: r.kind || "word", day: r.day || null, text: r.text, vec: r.vec })),
    ...scribe.map(s => ({ source: "note", kind: s.kind || "note", day: s.day || String(s.ts || "").slice(0, 10) || null, text: s.text, vec: s.vec })),
  ];
  const k = deps.k || 3;
  if (qv) {
    const scored = pool.filter(h => Array.isArray(h.vec)).map(h => ({ source: h.source, kind: h.kind, day: h.day, text: h.text, score: cosine(qv, h.vec) }));
    const hits = dedupeTopK(scored.filter(h => h.score >= (deps.threshold || 0.55)), k).map(h => ({ ...h, score: Math.round(h.score * 100) / 100 }));
    if (hits.length) return { hits, mode: "semantic" };
  }
  // lexical fallback: term overlap (pool dry, no vectors, or nothing over threshold)
  const qw = new Set(words(q));
  const hits = dedupeTopK(pool.map(h => ({ source: h.source, kind: h.kind, day: h.day, text: h.text, score: words(h.text).filter(w => qw.has(w)).length }))
    .filter(h => h.score > 0), k);
  return { hits, mode: "lexical" };
}

// ---- note(kind,text) — own scribe_log (never lost) + best-effort thalamus POST (shared bus) ----
async function defaultPost(evt) {
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), POST_TIMEOUT_MS);
    const r = await fetch(THALAMUS + "/afferent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(evt), signal: ctrl.signal });
    clearTimeout(to); return !!(r && r.ok);
  } catch { return false; }
}
async function note(kind, text, deps = {}) {
  const k = NOTE_KINDS.includes(kind) ? kind : "note";      // unknown kind degrades, never rejects
  const t = clip(text, 1200);
  if (!t) return { ok: false, error: "empty text" };
  const row = { ts: nowIso(deps), kind: k, text: t, source: "mcp" };
  const append = deps.append || ((o) => appendLine(SCRIBE_LOG, o));
  append(row);   // own file first — a note is never lost
  // E2E audit (25 Jul 2026): THE DEAD END. The row landed in scribe_log (which
  // NOTHING in the repo read) and one fire-and-forget POST; on failure it still
  // answered ok:true, so a doubt voiced in Desktop while the daemon stack was
  // down reached nothing at all — no afferent, no episode, no recall, ever.
  // Two doors now, and neither replaces the scribe row above:
  //   (1) the DURABLE door — kinds the hippocampus knows (doubt|win|preference|
  //       thread) are handed to markMoment, the OWNER-writer of episodes, so the
  //       moment becomes a real recallable episode whatever the bus is doing.
  //       markMoment is durable-first (appends before it embeds) and keeps its own
  //       verbatim/paraphrase guard — a refusal just leaves us with the scribe row,
  //       which recall() now reads too.
  //   (2) the BUS door — the thalamus POST, unchanged in spirit (the MCP still
  //       never writes the shared bus itself), but its outcome is RECORDED as an
  //       append-only `_ack` row on failure, so resyncScribeLog can retry it.
  // When a test injects `append`, the default mark degrades to a no-op: an
  // injected writer must NEVER reach the captain's real episodes.jsonl.
  const mark = deps.mark || (deps.append ? (async () => ({ ok: false, error: "test-mode: episode write suppressed" })) : markMoment);
  const post = deps.post || defaultPost;
  let posted = false, episode = null;
  try { posted = await post({ modality: "desktop-study", source: "organism-memory", text: `[${k}] ${t}`, ts: row.ts }); } catch { posted = false; }
  // …and it hands markMoment an embed no-op on purpose: the vector is NOT this
  // process's job. It keeps the tool call instant (no 15s-per-key pool round trip
  // inside a Desktop tool call) and — more importantly — stops the MCP from ever
  // running patchEpisodeVec, which rewrites episodes.jsonl whole. The hourly
  // `hippocampus index` sweep back-fills the vector, exactly as markMoment's own
  // header promises. Append-only from here; the rewriter stays the hippocampus.
  const markDeps = deps.markDeps || { embed: async () => null };
  if (HIPPO_KINDS.includes(k)) {
    try { const m = await mark(k, t, markDeps); if (m && m.ok) episode = m.id || null; } catch { episode = null; }
  }
  if (!posted) append({ ts: nowIso(deps), kind: "_ack", ref: row.ts, posted: false, episode });   // append-only delivery record → resync retries it
  const out = { ok: true, kind: k, staged_to: "scribe_log", posted, episode };
  if (!posted) out.warning = episode
    ? "the thalamus door was shut — the moment IS durable (it became an episode) but the live bus never saw it; `node scripts/mcp-memory.mjs resync` re-posts it."
    : "the thalamus door was shut and this kind does not become an episode — it is held in scribe_log (recallable, lexically) until a resync. Tell him it did not reach the live bus.";
  return out;
}

// ---- resync — the retry path a failed POST never had (append-only, no rewrites) ----
// E2E audit (25 Jul 2026): a refused POST had NO retry anywhere, so a note taken
// while the thalamus was down never reached the shared bus. A `_ack posted:false`
// row is the open ticket; a later `_ack posted:true` for the same ref closes it.
// Nothing is rewritten — scribe_log stays a pure append-only log.
async function resyncScribeLog(deps = {}) {
  const rows = deps.rows || readLines(SCRIBE_LOG);
  const open = new Set();
  for (const a of rows) {
    if (!a || a.kind !== "_ack" || !a.ref) continue;
    if (a.posted === true) open.delete(a.ref); else open.add(a.ref);
  }
  const pending = rows.filter(r => r && r.text && open.has(r.ts));
  const append = deps.append || ((o) => appendLine(SCRIBE_LOG, o));
  const post = deps.post || defaultPost;
  let reposted = 0;
  for (const r of pending) {
    let ok = false;
    try { ok = await post({ modality: "desktop-study", source: "organism-memory", text: `[${r.kind}] ${r.text}`, ts: r.ts }); } catch { ok = false; }
    if (ok) { append({ ts: nowIso(deps), kind: "_ack", ref: r.ts, posted: true }); reposted++; }
  }
  return { pending: pending.length, reposted };
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
  // E2E audit (25 Jul 2026): remember_fact staged to identity_facts.pending.jsonl
  // and told him it "needs your explicit confirm" — but repo-wide NOTHING ever read
  // that file, so there was no surface on which the confirm could happen and staged
  // facts rotted invisibly forever. get_context is the one door every session opens,
  // so the queue is surfaced HERE, in his face, at every re-entry. Law 4 intact: this
  // ASKS for his word, it never takes it — promotion to canon belongs to the
  // hippocampus (the single writer of identity_facts.json), not to this server.
  const pend = (deps.pending !== undefined ? deps.pending : readLines(PENDING_FACTS))
    .filter(p => p && p.text && (p.status || "pending") === "pending");
  if (pend.length) {
    const shown = pend.slice(-5).map(p => `  · "${clip(p.text, 160)}"   (staged ${String(p.ts || "").slice(0, 10) || "?"})`);
    parts.push(`PENDING IDENTITY FACTS — ${pend.length} staged, awaiting HIS word (Law 4: nothing is canon until he says so):\n${shown.join("\n")}\n  → ask him to confirm or drop each; only he promotes it.`);
  }
  // D11 (9 Aug 2026, launch worklist): open _ack tickets were invisible — the retry
  // lane existed (`resync`) but nothing SAID there was something to retry, so a note
  // written while the thalamus was down waited forever. Same open-set derivation as
  // resyncScribeLog; the one door every session opens now names the backlog.
  try {
    const srows = deps.scribe !== undefined ? deps.scribe : readLines(SCRIBE_LOG);
    const openAcks = new Set();
    for (const a of srows) {
      if (!a || a.kind !== "_ack" || !a.ref) continue;
      if (a.posted === true) openAcks.delete(a.ref); else openAcks.add(a.ref);
    }
    const waiting = srows.filter(r => r && r.text && openAcks.has(r.ts)).length;
    if (waiting) parts.push(`UNDELIVERED MOMENTS — ${waiting} note(s) never reached the live bus (thalamus was down when they were written). They are durable here, but the working memory has not seen them: run \`node scripts/mcp-memory.mjs resync\`.`);
  } catch { /* surfacing must never break the door */ }
  // #14 — THE TEACHING CARD. Framed exactly as learnstate.mjs:177-181 frames it
  // in the SessionStart brief, so a session that arrives through either door
  // gets the same rules in the same words. REPAIR TOWARD SILENCE: a missing
  // file, a missing marker or an empty block yields null and this block simply
  // does not appear — get_context degrades to precisely what it printed before.
  let card = null;
  try { card = deps.card !== undefined ? deps.card : loadTeachingCard(); } catch { card = null; }
  if (card && typeof card === "string" && card.trim()) {
    parts.push(`HOW TO TEACH HIM (evidence from his own words — learning-layer/HOW_HE_LEARNS.md; these are OBSERVED, not preferences he stated):\n${card}`);
  }
  // #106 — get_context is the mandated session-start door, so it must be able to
  // say what it actually carried. A missing leg is named, never silently absent:
  // "0 durable episodes" and "who_he_is unreadable" are different facts.
  const carried = [
    `cartridge ${cart ? "yes" : "MISSING"}`,
    `working set ${ws && typeof ws === "object" ? "yes" : "MISSING"}`,
    `teaching card ${card ? "yes" : "MISSING"}`,
    `${pend.length} pending fact(s)`,
  ].join(" · ");
  if (!parts.length) return `no context yet — the memory is empty. [carried: ${carried}]`;
  return parts.join("\n\n") + `\n\n[get_context carried: ${carried}]`;
}

// ---- remember_fact(text) — STAGE only (Law 4: proposes, never acts on canon) ----
// LEGACY (frozen verbatim, layering law) — the DIRECT-APPEND staging path, live
// from this server's first day until 10 Aug 2026. Kept because the shape of the
// bug should stay readable next to its fix. The append below is a perfectly safe
// write on its own; it was never safe BESIDE hippocampus.mjs:357, which rewrites
// every row of the same file when he promotes or drops a staged fact. THE LOST
// UPDATE: the hippocampus reads all rows at T · this line appends at T+1 · the
// hippocampus renames its stale copy over the file at T+2 — and the fact he just
// asked to be remembered is gone, with no error anywhere and nothing to retry.
// writeAtomic protected against a TORN file, never against this. NO CALLER POINTS
// HERE; it survives only as the record of what the race looked like.
function rememberFactStagedLegacy(text, deps = {}) {
  const t = clip(text, 400);
  if (!t) return { ok: false, error: "empty text" };
  const row = { ts: nowIso(deps), text: t, status: "pending", source: "mcp" };
  (deps.append || ((o) => appendLine(PENDING_FACTS, o)))(row);
  return { ok: true, staged: true, note: "staged to identity_facts.pending.jsonl — needs your explicit confirm before it becomes canon (Law 4). Nothing was written to the identity ledger." };
}
// 60s is dugout.mjs:1363's own number for this exact shell-to-owner call — the
// one that already drives `hippocampus.mjs remember` — not a new one chosen here.
// It is SYNCHRONOUS, like that precedent: remember_fact fires rarely and by hand,
// the child only appends one line, and a stdio MCP serves one tool call at a time
// anyway — so the block costs nothing a real user can feel, and the alternative
// (an async child) would put a promise in a path whose whole job is to be certain.
const OWNER_TIMEOUT_MS = 60000;
// 10 AUG 2026 — SINGLE-WRITER REPAIR (his ruling). The text now goes to the OWNER
// of dressing-room/hippocampus/*, exactly as dugout.mjs:1684-1692 hands this same
// organ its marks and facts. Nothing HE sees changes: the return shape and the
// note below are byte-identical to the legacy's, and the row the owner writes is
// byte-identical too (hippocampus.mjs stagePendingFact keeps {ts,text,status,
// source} in that key order and the same 400-char clip — asserted both sides).
// THE `ts` NOW COMES FROM THE CHILD'S CLOCK, which is why `deps.now` no longer
// reaches this path — the writer stamps its own row, as every other owner does.
// FAILURE IS LOUD AND THERE IS NO FALLBACK: writing the file here on an error
// would restore the very race this repair removes, so a refused staging comes
// back ok:false with the real reason. A fact he asked to be remembered is never
// dropped silently.
function rememberFactStaged(text, deps = {}) {
  const t = clip(text, 400);
  if (!t) return { ok: false, error: "empty text" };
  const sh = deps.sh || ((script, argv, input) => execFileSync(process.execPath, [join(__dirname, script), ...argv], { input, encoding: "utf8", timeout: OWNER_TIMEOUT_MS, windowsHide: true }));
  let said = "", threw = null;
  try {
    said = String(sh("hippocampus.mjs", ["stage-pending", "--source", "mcp"], t) || "");
  } catch (e) {
    // the owner exits non-zero on a refusal (same as promote/drop-pending) and
    // still prints its JSON verdict on stdout — read it rather than lose it
    said = String((e && e.stdout) || "");
    threw = String((e && (e.stderr || e.message)) || e).trim();
  }
  let verdict = null;
  for (const line of said.split(/\r?\n/).map(l => l.trim()).filter(Boolean)) {
    try { const j = JSON.parse(line); if (j && typeof j === "object") verdict = j; } catch { }   // last JSON line wins
  }
  if (!verdict || verdict.ok !== true) {
    const why = (verdict && verdict.error) || threw || said.trim() || "the staging door answered nothing";
    return { ok: false, error: `NOT staged — hippocampus.mjs (the owner of identity_facts.pending.jsonl) refused: ${why}. Nothing was written; tell him the fact was not remembered.` };
  }
  return { ok: true, staged: true, note: "staged to identity_facts.pending.jsonl — needs your explicit confirm before it becomes canon (Law 4). Nothing was written to the identity ledger." };
}

// ---- the stdio JSON-RPC 2.0 server (MCP) ----
const TOOLS = [
  { name: "recall", description: "Semantic recall over the captain's durable memory (his past episodes + his embedded words). Returns his most relevant real moments — doubts, wins, threads — for a query. Read-only.", inputSchema: { type: "object", properties: { query: { type: "string", description: "what to recall about (a concept, a feeling, a thread)" } }, required: ["query"] } },
  { name: "note", description: "Write a salient moment into the shared working memory — a doubt he voiced, a win, a stated preference, an open thread, or a plain note. It is kept locally, routed to the thalamus so it reaches every surface (Code, the Gaffer), and (for doubt/win/preference/thread) written as a durable episode he can be reminded of later. If the reply carries a `warning`, tell him — the live bus did not see it.", inputSchema: { type: "object", properties: { kind: { type: "string", enum: NOTE_KINDS, description: "doubt | win | preference | thread | note" }, text: { type: "string", description: "his words, verbatim where possible" } }, required: ["text"] } },
  { name: "get_context", description: "Rehydrate where the captain is right now: his identity cartridge (every fact DATED — a fact is true as of its date, not automatically today) + who-he-is (labelled RIGHT NOW only when it was consolidated today, otherwise AS OF its date with its age) + last durable episodes + the distiller's live working set + the teaching card of how he learns. Call at the start of a session so you never ask him to re-explain.", inputSchema: { type: "object", properties: {} } },
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
      // E2E audit (25 Jul 2026): tool dispatch shared the outer catch, so ANY tool
      // failure — including a host simply mis-naming a tool ("remember") — came back
      // as JSON-RPC -32603, a PROTOCOL error. The host then showed a generic
      // server-error toast and the model never saw the reason, so it could not
      // self-correct. MCP (2024-11-05, the version this server pins) draws the line
      // the other way round: an execution failure is a normal result carrying
      // isError:true and readable text. Protocol error frames stay reserved for
      // malformed requests — the outer catch still owns those.
      try {
        const out = await dispatch(params && params.name, params && params.arguments, deps);
        const text = typeof out === "string" ? out : JSON.stringify(out, null, 2);
        return reply({ result: { content: [{ type: "text", text }] } });
      } catch (e) {
        return reply({ result: { content: [{ type: "text", text: String((e && e.message) || e) }], isError: true } });
      }
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

  // every recall call pins `scribe: []` (or its own rows): the selftest must stay
  // hermetic now that scribe_log is a real read surface — his live notes must never
  // be able to change a check's answer. (E2E audit 25 Jul 2026.)
  const r = await recall("attention", { embed: mockEmbed, episodes, index, scribe: [], threshold: 0.5 });
  assert("recall: ONE semantic surface merges episodes + recall_index, cosine-ranked", r.mode === "semantic" && r.hits.length >= 1 && /attention/.test(r.hits[0].text));
  assert("recall: the attention episode wins (score ~1)", r.hits[0].source === "episode" && r.hits[0].score >= 0.9);
  const rl = await recall("cosine similarity", { embed: async () => { throw new Error("dry"); }, episodes, index, scribe: [] });
  assert("recall: pool dry → lexical fallback still finds the cosine win", rl.mode === "lexical" && rl.hits.some(h => /cosine/.test(h.text)));
  assert("recall: a nothing query returns no hits, never a crash", (await recall("zzzq", { embed: async () => null, episodes, index, scribe: [] })).hits.length === 0);

  let logged = null, postedEvt = null;
  const n = await note("doubt", "kv-cache feels like magic", { append: (o) => { logged = o; }, post: async (e) => { postedEvt = e; return true; }, now: new Date("2026-07-14T10:00:00Z") });
  assert("note: lands in the scribe log verbatim, kind preserved", logged && logged.text === "kv-cache feels like magic" && logged.kind === "doubt" && logged.source === "mcp");
  assert("note: routes to the thalamus door (modality desktop-study, [kind] tag)", postedEvt && postedEvt.modality === "desktop-study" && /\[doubt\]/.test(postedEvt.text) && n.posted === true);
  assert("note: unknown kind degrades to 'note', never rejected", (await note("vibe", "x", { append: () => {}, post: async () => false })).kind === "note");
  assert("note: thalamus down → still ok (own file already holds it)", (await note("win", "held the derby", { append: () => {}, post: async () => false })).ok === true);

  // — E2E audit (25 Jul 2026) regressions: the note dead end —
  const scribe = [
    { ts: "2026-07-13T09:00:00.000Z", kind: "note", text: "grounding in RAG still feels hand-wavy" },
    { ts: "2026-07-13T09:00:01.000Z", kind: "_ack", ref: "2026-07-13T09:00:00.000Z", posted: false, episode: null },
  ];
  const rs = await recall("grounding", { embed: async () => { throw new Error("dry"); }, episodes, index, scribe });
  assert("recall: scribe_log is a THIRD surface — a plain note is no longer unreachable", rs.hits.some(h => h.source === "note" && /grounding/.test(h.text)) && !rs.hits.some(h => h.kind === "_ack"));
  const dupIndex = [{ kind: "word", day: "2026-07-11", text: "nailed cosine similarity", vec: [0, 1, 0] }, ...index];
  const rd = await recall("cosine", { embed: mockEmbed, episodes, index: dupIndex, scribe: [], threshold: 0.5 });
  assert("recall: one sentence living on two surfaces takes ONE slot, and the episode copy wins", rd.hits.length === 1 && rd.hits[0].source === "episode" && /cosine/.test(rd.hits[0].text));

  let marked = null, ack = null;
  const nEp = await note("doubt", "why does grounding fail", {
    append: (o) => { if (o.kind === "_ack") ack = o; },
    post: async () => false,
    mark: async (mk, mt) => { marked = { kind: mk, text: mt }; return { ok: true, id: "ep1" }; },
    now: new Date("2026-07-14T10:00:00Z"),
  });
  assert("note: a doubt reaches the hippocampus OWNER-writer → a real, recallable episode", marked && marked.kind === "doubt" && marked.text === "why does grounding fail" && nEp.episode === "ep1");
  assert("note: a refused POST is ticketed (_ack posted:false) + surfaced as a warning, not masked ok:true", ack && ack.posted === false && ack.ref === "2026-07-14T10:00:00.000Z" && /resync/.test(nEp.warning || ""));
  assert("note: a plain 'note' kind never becomes an episode (hippocampus does not know that kind)", (await note("note", "stray thought", { append: () => {}, post: async () => true, mark: async () => { throw new Error("must not be called"); } })).episode === null);

  const acks = [];
  const rr = await resyncScribeLog({
    rows: [
      { ts: "2026-07-14T10:00:00.000Z", kind: "doubt", text: "why does grounding fail", source: "mcp" },
      { ts: "2026-07-14T10:00:01.000Z", kind: "_ack", ref: "2026-07-14T10:00:00.000Z", posted: false },
      { ts: "2026-07-14T11:00:00.000Z", kind: "win", text: "held the derby", source: "mcp" },
      { ts: "2026-07-14T11:00:01.000Z", kind: "_ack", ref: "2026-07-14T11:00:00.000Z", posted: false },
      { ts: "2026-07-14T11:30:00.000Z", kind: "_ack", ref: "2026-07-14T11:00:00.000Z", posted: true },
    ],
    post: async (e) => { acks.push(e); return true; }, append: () => {}, now: new Date("2026-07-15T00:00:00Z"),
  });
  assert("resync: an open ticket is re-posted once; a ticket already closed is left alone", rr.pending === 1 && rr.reposted === 1 && acks.length === 1 && /\[doubt\]/.test(acks[0].text));

  const ctx = getContext({ pending: [], card: null, cartridge: () => "IDENTITY: he is the captain.", ws: { concept_in_motion: "hallucinations", open_loop: "why grounding fails", where_left_off: "detection strategies", next_step: "read the eval doc" } });
  assert("get_context: fuses rehydrate cartridge + the distiller working set", /IDENTITY/.test(ctx) && /hallucinations/.test(ctx) && /WORKING SET/.test(ctx));
  assert("get_context: empty memory → a valid line, never a crash", typeof getContext({ cartridge: () => null, ws: null, pending: [], card: null }) === "string");
  const ctxP = getContext({ cartridge: () => "IDENTITY: he is the captain.", ws: null, card: null, pending: [
    { ts: "2026-07-12T08:00:00Z", text: "prefers full lectures, not fragments", status: "pending" },
    { ts: "2026-07-12T09:00:00Z", text: "a fact he already ruled on", status: "confirmed" },
  ] });
  assert("get_context: staged identity facts are surfaced for his word — they can no longer rot unseen", /PENDING IDENTITY FACTS — 1 staged/.test(ctxP) && /full lectures/.test(ctxP) && !/already ruled on/.test(ctxP));

  // — AUDIT 4 Aug 2026 (#14): the mandated session-start door carries the card —
  const ctxC = getContext({ cartridge: () => "IDENTITY: he is the captain.", ws: null, pending: [], card: "1. Give ONE new idea per message.\n2. Hinglish, not shuddh Hindi." });
  assert("get_context #14: the teaching card ARRIVES through the door CLAUDE.md actually mandates",
    /HOW TO TEACH HIM/.test(ctxC) && /ONE new idea per message/.test(ctxC) && /Hinglish/.test(ctxC));
  assert("get_context #14: the card is framed as OBSERVED evidence and names its source file — same words as the SessionStart brief",
    /OBSERVED, not preferences he stated/.test(ctxC) && /HOW_HE_LEARNS\.md/.test(ctxC));
  assert("get_context #14: REPAIR TOWARD SILENCE — no card → the payload is byte-identical to what it printed before",
    getContext({ cartridge: () => "IDENTITY: he is the captain.", ws: null, pending: [], card: null }) === getContext({ cartridge: () => "IDENTITY: he is the captain.", ws: null, pending: [], card: "" })
    && !/HOW TO TEACH HIM/.test(getContext({ cartridge: () => "IDENTITY: he is the captain.", ws: null, pending: [], card: null })));
  // ONE parser, not a fork: the card get_context serves is the very function
  // learnstate.mjs uses for the brief, against the real shipped document.
  const { loadTeachingCard } = await import("./learnstate.mjs");
  const realCard = loadTeachingCard();
  assert("get_context #14: it REUSES learnstate's parser (one source of truth) and the shipped HOW_HE_LEARNS.md really parses",
    typeof loadTeachingCard === "function" && !!realCard && /^1\. Give ONE new idea/m.test(realCard)
    && getContext({ cartridge: () => "X", ws: null, pending: [] }).includes(realCard));
  // #106 — every leg it carried, or did not, is named
  const ctxCount = getContext({ cartridge: () => "IDENTITY: x", ws: null, pending: [], card: null });
  assert("get_context #106: it reports what it CARRIED — a missing leg is named, not silently absent",
    /\[get_context carried: cartridge yes · working set MISSING · teaching card MISSING · 0 pending fact\(s\)\]/.test(ctxCount));
  assert("get_context #106: the empty-memory line carries the same counter (an empty door still says what it looked for)",
    /carried: cartridge MISSING/.test(getContext({ cartridge: () => null, ws: null, pending: [], card: null })));

  // — 10 AUG 2026, SINGLE-WRITER REPAIR: remember_fact goes through the OWNER —
  const NOTE = "staged to identity_facts.pending.jsonl — needs your explicit confirm before it becomes canon (Law 4). Nothing was written to the identity ledger.";
  let shCall = null;
  const rf = rememberFactStaged("  prefers Hinglish,\n  direct — not a hype-man  ", {
    sh: (script, argv, input) => { shCall = { script, argv, input }; return JSON.stringify({ ok: true, staged: true, ts: "2026-08-10T12:32:24.372Z", text: input }) + "\n"; },
  });
  assert("remember_fact: it hands the text to hippocampus.mjs (the OWNER) on stdin — this server no longer writes the pending file at all",
    shCall && shCall.script === "hippocampus.mjs" && shCall.argv.join(" ") === "stage-pending --source mcp" && shCall.input === "prefers Hinglish, direct — not a hype-man");
  assert("remember_fact: STAGES with the SAME return shape and the SAME note he actually reads (Law 4, byte for byte)",
    rf.ok === true && rf.staged === true && rf.note === NOTE && rf.note === rememberFactStagedLegacy("x", { append: () => {} }).note);
  assert("remember_fact: the shipped function carries NO write of its own — the race cannot come back through this door",
    !/appendLine/.test(rememberFactStaged.toString()) && !/appendFileSync/.test(rememberFactStaged.toString()) && !/PENDING_FACTS/.test(rememberFactStaged.toString()));
  assert("remember_fact: empty text is still refused HERE, before a child is ever spawned",
    rememberFactStaged("   ", { sh: () => { throw new Error("must not be called"); } }).error === "empty text");
  const blown = rememberFactStaged("a fact he asked me to hold", { sh: () => { throw new Error("spawn ENOENT"); } });
  assert("remember_fact: a failed shell-out is ok:false with the REAL error — never a silent drop, and never a fallback write",
    blown.ok === false && /spawn ENOENT/.test(blown.error) && /NOT staged/.test(blown.error) && blown.staged === undefined);
  const refused = rememberFactStaged("a fact he asked me to hold", { sh: () => JSON.stringify({ ok: false, error: "empty text" }) });
  const exited = rememberFactStaged("a fact he asked me to hold", { sh: () => { const e = new Error("Command failed"); e.status = 1; e.stdout = JSON.stringify({ ok: false, error: "empty text" }) + "\n"; throw e; } });
  assert("remember_fact: the owner's own refusal is passed through — including when it exits 1 and the verdict rides in the throw",
    refused.ok === false && /empty text/.test(refused.error) && exited.ok === false && /empty text/.test(exited.error));
  // SHAPE PARITY, across the two files: what the owner writes must equal what the
  // frozen legacy wrote. This is the regression that matters — three real facts
  // were staged through the OLD path earlier today and are still awaiting his word.
  const { stagePendingFact } = await import("./hippocampus.mjs");
  let ownerRow = null, legacyRow = null;
  stagePendingFact("  prefers Hinglish,\n  direct — not a hype-man  ", { append: (o) => { ownerRow = o; }, now: new Date("2026-08-10T12:32:24.372Z"), source: "mcp" });
  rememberFactStagedLegacy("  prefers Hinglish,\n  direct — not a hype-man  ", { append: (o) => { legacyRow = o; }, now: new Date("2026-08-10T12:32:24.372Z") });
  assert("remember_fact: the OWNER's row is byte-identical to the legacy's — same keys, same order, same clip (nothing downstream changes)",
    JSON.stringify(ownerRow) === JSON.stringify(legacyRow) && legacyRow.status === "pending" && legacyRow.source === "mcp" && ownerRow.text.length <= 400);
  assert("remember_fact: the legacy direct-append path is FROZEN in place, not deleted (layering law)",
    typeof rememberFactStagedLegacy === "function" && /appendLine\(PENDING_FACTS/.test(rememberFactStagedLegacy.toString()));

  // JSON-RPC framing — initialize / tools/list / tools/call / notification
  const sent = []; const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (s) => { try { sent.push(JSON.parse(String(s).trim())); } catch {} return true; };
  try {
    await handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
    await handle({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    await handle({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "recall", arguments: { query: "attention" } }, }, { embed: mockEmbed, episodes, index, scribe: [], threshold: 0.5 });
    await handle({ jsonrpc: "2.0", method: "notifications/initialized" });      // notification → silent
    await handle({ jsonrpc: "2.0", method: "ping" });                            // id-less request-method → also silent
    await handle({ jsonrpc: "2.0", id: 5, method: "bogus/method" });             // unknown → error
    await handle({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "remember", arguments: {} } });  // bad tool NAME → tool error, not protocol error
  } finally { process.stdout.write = orig; }
  assert("rpc: initialize returns protocolVersion + serverInfo(name)", sent[0] && sent[0].result && sent[0].result.serverInfo && sent[0].result.serverInfo.name === NAME);
  assert("rpc: tools/list advertises all 4 tools", sent[1] && sent[1].result && sent[1].result.tools.length === 4 && sent[1].result.tools.map(t => t.name).sort().join(",") === "get_context,note,recall,remember_fact");
  assert("rpc: tools/call returns MCP content blocks", sent[2] && sent[2].result && Array.isArray(sent[2].result.content) && sent[2].result.content[0].type === "text");
  assert("rpc: notifications + id-less request-methods draw NO reply (every frame carries an id)", sent.every(m => m.id !== undefined && m.id !== null));
  assert("rpc: unknown method → JSON-RPC error -32601", sent.find(m => m.id === 5) && sent.find(m => m.id === 5).error && sent.find(m => m.id === 5).error.code === -32601);
  const badTool = sent.find(m => m.id === 6);
  assert("rpc: a bad TOOL name is a tool result with isError (readable by the model), not a -32603 protocol error", badTool && !badTool.error && badTool.result && badTool.result.isError === true && /unknown tool/.test(badTool.result.content[0].text));

  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  // E2E audit (25 Jul 2026): the manual/scheduled drain for notes whose thalamus
  // POST was refused. Safe to run any time — it only re-posts open `_ack` tickets.
  if (mode === "resync") { console.log(JSON.stringify(await resyncScribeLog())); return; }
  serve();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export {
  recall, note, resyncScribeLog, getContext, rememberFactStaged, dispatch, handle, TOOLS,
  // frozen legacy (layering law) — the direct-append staging path, kept readable
  // beside its fix; nothing calls it (10 Aug 2026 single-writer repair)
  rememberFactStagedLegacy,
};
