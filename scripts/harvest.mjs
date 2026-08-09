#!/usr/bin/env node
// ============================================================================
// scripts/harvest.mjs · ARSENAL AI FC — THE GEMINI HARVEST NERVE (P7)
// ----------------------------------------------------------------------------
// BUILT 9 Aug 2026 on his verbatim word: "yes lets build p1 p2 p3 p7 to the
// peak of its powers and make sure data flows everywhere wherever it is
// required." Until today the Gemini surface was the organism's blind eye — the
// teaching happened on a page this machine never saw, and the watchman printed
// that boundary every night. This organ closes it TO THE EXTENT HE HARVESTS:
// after a Gem sitting he says "harvest", the /harvest skill reads the whole
// conversation out of his Chrome, parses it into turns, and hands the turns to
// THIS owner — which posts each one through the thalamus door (:4113/afferent,
// the ONLY lawful writer of afferent.jsonl) as:
//     his turns  → { modality: "gemini", source: "gemini-study" }
//     Gem turns  → { modality: "gemini", source: "gemini-study-teaching" }
// Provenance law (thalamus_config.json, amended same day under the same word):
// gemini-study sits in self_sources, gemini-study-teaching in self_deny_sources
// — his Gemini doubts score as HIS voice, the Gem's answers never do.
//
// OWNER: this file is the SOLE writer of dressing-room/state/harvest_log.jsonl
// (its append-only delivery ledger — the mcp-memory scribe pattern: the organ
// records what it delivered, so a thalamus-down night loses nothing; `resync`
// re-posts the unacked rows). It writes NOTHING else. afferent.jsonl is reached
// only through the POST door.
//
// DEDUP — MEASURED AT BUILD TIME, NOT ASSUMED: the thalamus door has NO content
// dedup (thalamus.mjs ingest() appends unconditionally before scoring;
// habituation only damps SALIENCE, never the disk row). So dedup lives HERE,
// two layers: (1) this ledger — a turn_hash already posted:true never re-posts,
// which makes re-harvesting a continued conversation safe (old turns skip, new
// turns land); (2) the bus itself — any gemini-lane row already in
// afferent.jsonl (or its monthly archives afferent.YYYY-MM.jsonl — the roll is
// boot-armed and this reader must survive it) with the same text hash skips.
//
// BURST LAW: the thalamus binds co-temporal same-modality events into one
// moment (binding_ms 900) and habituates repeats per signal key. A harvested
// sitting is N distinct turns, not one moment — so every turn carries its own
// event_key (gemini:<conv>:<idx>) and posts are SPACED (~150ms) so a 40-turn
// sitting does not collapse into two bound moments with a flattened tail.
//
// CLI:
//   node scripts/harvest.mjs ingest --file <turns.json>   ← the skill's hand-off
//   node scripts/harvest.mjs resync                       ← re-post failed rows
//   node scripts/harvest.mjs status                       ← lane counts, honest
//   node scripts/harvest.mjs selftest                     ← fixtures only, zero live writes
//
// ingest --file shape (the skill writes this to a scratch file):
//   { "conversation": "<title or stable id of the Gem sitting>",
//     "turns": [ { "who": "him" | "gem", "text": "..." }, ... ] }
// ============================================================================
import { readFileSync, existsSync, appendFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";
const LEDGER = "harvest_log.jsonl";

// same scrub as hooks/afferent-post.mjs — nothing secret leaves for the bus
const SECRET_RE = /sk-[a-z0-9-]{12,}|api[_-]?key\s*[:=]|password\s*[:=]|secret\s*[:=]|token\s*[:=]|BEGIN [A-Z ]*PRIVATE KEY/i;
const MIN_CHARS = 3;
const POST_SPACING_MS = 150;
const POST_TIMEOUT_MS = 400;

const sha1 = (s) => createHash("sha1").update(String(s), "utf8").digest("hex");
const turnHash = (text) => sha1(String(text).replace(/\s+/g, " ").trim().toLowerCase());
const convKeyOf = (conversation) => sha1(String(conversation).trim().toLowerCase()).slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readLines(p) {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch { } } } catch { }
  return out;
}

// ---------------------------------------------------------------------------
// the bus's existing gemini-lane text hashes — ROLL-SAFE: the thalamus renames
// afferent.jsonl to afferent.YYYY-MM.jsonl at boot on a month boundary, so this
// reads the live file AND every archived sibling (the same trap brain.mjs's
// readLinesTail closes; every reader that forgets it goes blind one morning).
export function busTurnHashes(stateDir = STATE_DIR) {
  const hashes = new Set();
  let files = [];
  try {
    files = readdirSync(stateDir).filter((f) => /^afferent(\.\d{4}-\d{2})?\.jsonl$/.test(f));
  } catch { }
  for (const f of files) {
    for (const r of readLines(join(stateDir, f))) {
      if (r && (r.source === "gemini-study" || r.source === "gemini-study-teaching") && r.text) {
        hashes.add(turnHash(r.text));
      }
    }
  }
  return hashes;
}

export function ledgerRows(stateDir = STATE_DIR) {
  return readLines(join(stateDir, LEDGER));
}

// validate the skill's hand-off; returns { ok, why } | { ok, conversation, turns }
export function validatePayload(payload) {
  if (!payload || typeof payload !== "object") return { ok: false, why: "payload is not an object" };
  const conversation = String(payload.conversation || "").trim();
  if (!conversation) return { ok: false, why: "conversation missing — the sitting needs a name" };
  if (!Array.isArray(payload.turns) || !payload.turns.length) return { ok: false, why: "turns[] missing or empty" };
  const turns = [];
  for (const t of payload.turns) {
    if (!t || typeof t !== "object") return { ok: false, why: "a turn is not an object" };
    const who = String(t.who || "").trim();
    if (who !== "him" && who !== "gem") return { ok: false, why: `turn.who must be "him" or "gem", got "${who}"` };
    turns.push({ who, text: String(t.text || "").trim() });
  }
  return { ok: true, conversation, turns };
}

async function postOne(evt, fetchFn) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), POST_TIMEOUT_MS);
    const res = await fetchFn(THALAMUS + "/afferent", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evt), signal: ctrl.signal,
    });
    clearTimeout(t);
    let S = null;
    try { const j = await res.json(); if (j && typeof j.S === "number") S = j.S; } catch { }
    return { posted: true, S };
  } catch {
    return { posted: false, S: null };
  }
}

// the core — everything injectable so the selftest never touches live state or net.
// Returns the delta: { posted, his, gem, skipped_dupe, skipped_scrub, failed }
export async function ingestTurns(payload, deps = {}) {
  const stateDir = deps.stateDir || STATE_DIR;
  const fetchFn = deps.fetchFn || fetch;
  const sleepFn = deps.sleepFn || sleep;
  const nowIso = deps.nowIso || (() => new Date().toISOString());

  const v = validatePayload(payload);
  if (!v.ok) return { error: v.why };

  const convKey = convKeyOf(v.conversation);
  const seenOnBus = deps.busHashes !== undefined ? deps.busHashes : busTurnHashes(stateDir);
  const ledger = ledgerRows(stateDir);
  const alreadyPosted = new Set(ledger.filter((r) => r.posted).map((r) => r.turn_hash));

  mkdirSync(stateDir, { recursive: true });
  const delta = { posted: 0, his: 0, gem: 0, skipped_dupe: 0, skipped_scrub: 0, failed: 0 };
  let idx = -1;
  for (const turn of v.turns) {
    idx += 1;
    if (turn.text.length < MIN_CHARS || SECRET_RE.test(turn.text)) { delta.skipped_scrub += 1; continue; }
    const h = turnHash(turn.text);
    if (alreadyPosted.has(h) || seenOnBus.has(h)) { delta.skipped_dupe += 1; continue; }
    const source = turn.who === "him" ? "gemini-study" : "gemini-study-teaching";
    const evt = {
      modality: "gemini", source, text: turn.text, ts: nowIso(),
      conversation: v.conversation, event_key: `gemini:${convKey}:${idx}`,
    };
    const r = await postOne(evt, fetchFn);
    appendFileSync(join(stateDir, LEDGER), JSON.stringify({
      ts: evt.ts, conv: v.conversation, conv_key: convKey, idx, who: turn.who,
      source, text: turn.text, turn_hash: h, posted: r.posted, S: r.S,
    }) + "\n", "utf8");
    if (r.posted) {
      delta.posted += 1; delta[turn.who === "him" ? "his" : "gem"] += 1;
      alreadyPosted.add(h);
    } else delta.failed += 1;
    if (idx < v.turns.length - 1) await sleepFn(POST_SPACING_MS);
  }
  return delta;
}

// re-post every ledger row whose delivery never landed (thalamus was down/slow).
// A turn_hash that ANY later row delivered is settled — only truly unacked rows retry.
export async function resync(deps = {}) {
  const stateDir = deps.stateDir || STATE_DIR;
  const fetchFn = deps.fetchFn || fetch;
  const sleepFn = deps.sleepFn || sleep;
  const rows = ledgerRows(stateDir);
  const settled = new Set(rows.filter((r) => r.posted).map((r) => r.turn_hash));
  const pending = rows.filter((r) => !r.posted && !settled.has(r.turn_hash));
  const delta = { retried: pending.length, posted: 0, still_failed: 0 };
  for (const row of pending) {
    const r = await postOne({
      modality: "gemini", source: row.source, text: row.text, ts: row.ts,
      conversation: row.conv, event_key: `gemini:${row.conv_key}:${row.idx}`,
    }, fetchFn);
    appendFileSync(join(stateDir, LEDGER), JSON.stringify({ ...row, ts: row.ts, posted: r.posted, S: r.S, resync: true }) + "\n", "utf8");
    if (r.posted) { delta.posted += 1; settled.add(row.turn_hash); } else delta.still_failed += 1;
    await sleepFn(POST_SPACING_MS);
  }
  return delta;
}

export function laneStatus(stateDir = STATE_DIR) {
  const rows = ledgerRows(stateDir);
  const posted = rows.filter((r) => r.posted);
  const convs = new Set(posted.map((r) => r.conv_key));
  const settled = new Set(posted.map((r) => r.turn_hash));
  const pending = rows.filter((r) => !r.posted && !settled.has(r.turn_hash)).length;
  const last = posted.length ? posted[posted.length - 1].ts : null;
  return {
    sittings: convs.size,
    turns_posted: posted.length,
    his: posted.filter((r) => r.who === "him").length,
    gem: posted.filter((r) => r.who === "gem").length,
    pending_resync: pending,
    last_posted: last,
  };
}

// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
  return (async () => {
    const { mkdtempSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const dir = mkdtempSync(join(tmpdir(), "harvest-"));
    const noNet = () => { throw new Error("selftest must never touch the network"); };
    const okFetch = async () => ({ json: async () => ({ ok: true, S: 0.42 }) });
    const downFetch = async () => { throw new Error("ECONNREFUSED"); };
    const fast = async () => { };
    const T = "2026-08-09T12:00:00.000Z";
    const deps = { stateDir: dir, sleepFn: fast, nowIso: () => T };

    // shape law
    assert("payload without a conversation name is refused", validatePayload({ turns: [{ who: "him", text: "x" }] }).ok === false);
    assert("payload with an unknown who is refused", validatePayload({ conversation: "c", turns: [{ who: "bot", text: "x" }] }).ok === false);
    assert("empty turns[] is refused", validatePayload({ conversation: "c", turns: [] }).ok === false);

    // the his/gem → source split, and the delta arithmetic
    const p1 = { conversation: "hallucinations sitting", turns: [
      { who: "him", text: "attention scaling samajh nahi aaya poora" },
      { who: "gem", text: "chalo step by step dekhte hain kaise scale hota hai" },
    ] };
    const d1 = await ingestTurns(p1, { ...deps, fetchFn: okFetch, busHashes: new Set() });
    assert("two turns post, split his/gem correctly", d1.posted === 2 && d1.his === 1 && d1.gem === 1 && d1.failed === 0);
    const led1 = ledgerRows(dir);
    assert("ledger carries both rows with source split + S from the door", led1.length === 2
      && led1[0].source === "gemini-study" && led1[1].source === "gemini-study-teaching" && led1[0].S === 0.42);
    assert("event_key is per-turn (gemini:<conv>:<idx>) — the burst law", led1[0].idx === 0 && led1[1].idx === 1 && led1[0].conv_key === convKeyOf("hallucinations sitting"));

    // dedup layer 1: own ledger — a re-harvest of the same sitting posts nothing
    const d2 = await ingestTurns(p1, { ...deps, fetchFn: noNet, busHashes: new Set() });
    assert("re-harvest of an already-delivered sitting skips both turns, zero POSTs", d2.posted === 0 && d2.skipped_dupe === 2);

    // dedup layer 1b: a CONTINUED sitting posts only the new tail
    const p1b = { conversation: "hallucinations sitting", turns: [...p1.turns, { who: "him", text: "ab grounding wala part phir se khol" }] };
    const d2b = await ingestTurns(p1b, { ...deps, fetchFn: okFetch, busHashes: new Set() });
    assert("continued sitting: old turns skip, only the new turn posts", d2b.posted === 1 && d2b.skipped_dupe === 2);

    // dedup layer 2: the bus itself (incl. a rolled archive) — roll-safe by construction
    writeFileSync(join(dir, "afferent.2026-07.jsonl"), JSON.stringify({ modality: "gemini", source: "gemini-study", text: "purana wala doubt jo pichle mahine bus pe gaya" }) + "\n");
    writeFileSync(join(dir, "afferent.jsonl"), JSON.stringify({ modality: "code", source: "claude-code", text: "not a gemini row" }) + "\n");
    const bus = busTurnHashes(dir);
    assert("bus hash set reads the ROLLED archive too, and only gemini-lane rows", bus.size === 1 && bus.has(turnHash("purana wala doubt jo pichle mahine bus pe gaya")));
    const d3 = await ingestTurns({ conversation: "c2", turns: [{ who: "him", text: "purana wala doubt jo pichle mahine bus pe gaya" }] }, { ...deps, fetchFn: noNet });
    assert("a turn already on the bus never re-posts", d3.posted === 0 && d3.skipped_dupe === 1);

    // scrub + floor
    const d4 = await ingestTurns({ conversation: "c3", turns: [
      { who: "him", text: "ok" },
      { who: "him", text: "mera api_key = sk-abcdefghijklmnop hai kya karu" },
    ] }, { ...deps, fetchFn: noNet, busHashes: new Set() });
    assert("sub-3-char and secret-bearing turns are scrubbed, never posted, never ledgered", d4.posted === 0 && d4.skipped_scrub === 2 && ledgerRows(dir).filter((r) => r.conv === "c3").length === 0);

    // thalamus down → posted:false in the ledger, then resync delivers
    const d5 = await ingestTurns({ conversation: "c4", turns: [{ who: "him", text: "thalamus so raha tha jab yeh bola" }] }, { ...deps, fetchFn: downFetch, busHashes: new Set() });
    assert("a down thalamus records the turn as UNDELIVERED, never lost", d5.failed === 1 && ledgerRows(dir).some((r) => r.conv === "c4" && r.posted === false));
    const r1 = await resync({ ...deps, fetchFn: okFetch });
    assert("resync re-posts exactly the unacked row and settles it", r1.retried === 1 && r1.posted === 1);
    const r2 = await resync({ ...deps, fetchFn: noNet });
    assert("a settled lane has nothing to resync (no double delivery)", r2.retried === 0);

    // status is derived, honest, and counts sittings not rows
    const st = laneStatus(dir);
    // 2 sittings have DELIVERED rows (p1 and c4); c2 was all-dupe and c3 all-scrubbed,
    // and a sitting that delivered nothing is not a harvested sitting.
    assert("status: sittings/turns/his/gem derive from the ledger, pending 0 after resync", st.sittings === 2 && st.pending_resync === 0 && st.his + st.gem === st.turns_posted);

    console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "SELFTEST FAILED"} (${pass} passed, ${fail} failed)\n`);
    return fail === 0;
  })();
}

// ---------------------------------------------------------------------------
async function main() {
  const mode = process.argv[2] || "status";
  const argAfter = (flag) => { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : null; };

  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }

  if (mode === "ingest") {
    const file = argAfter("--file");
    let payload = null;
    try { payload = JSON.parse(file ? readFileSync(file, "utf8") : readFileSync(0, "utf8")); }
    catch { console.error("harvest: payload unreadable — ingest --file <turns.json> (ya stdin pe JSON)"); process.exit(1); }
    const d = await ingestTurns(payload);
    if (d.error) { console.error(`harvest: refused — ${d.error}`); process.exit(1); }
    console.log(`harvest: ${d.posted} turn(s) posted (his ${d.his} · gem ${d.gem}) · ${d.skipped_dupe} already on the bus · ${d.skipped_scrub} scrubbed · ${d.failed} undelivered${d.failed ? " (thalamus down? → node scripts/harvest.mjs resync)" : ""}`);
    process.exit(0);
  }

  if (mode === "resync") {
    const d = await resync();
    console.log(`harvest: resync — ${d.retried} pending, ${d.posted} delivered, ${d.still_failed} still undelivered`);
    process.exit(0);
  }

  if (mode === "status") {
    const s = laneStatus();
    if (!s.turns_posted && !s.pending_resync) console.log("harvest: lane exists (since 9 Aug 2026), zero sittings harvested yet — after a Gem sitting, say \"harvest\".");
    else console.log(`harvest: ${s.sittings} sitting(s) · ${s.turns_posted} turns on the bus (his ${s.his} · gem ${s.gem}) · pending resync ${s.pending_resync} · last ${s.last_posted || "—"}`);
    process.exit(0);
  }

  console.error("harvest: modes — ingest --file <p> | resync | status | selftest");
  process.exit(1);
}
main().catch((e) => { console.error(`harvest: ${String(e && e.message)}`); process.exit(1); });
