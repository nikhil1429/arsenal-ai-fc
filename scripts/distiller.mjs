#!/usr/bin/env node
// ============================================================================
// distiller.mjs · ARSENAL AI FC — THE WORKING SET (Phase 1, the ADHD-tax remover)
// ----------------------------------------------------------------------------
// WHAT: a cheap continuous pass that keeps a ~1KB externalized 4-slot working
//   memory ALWAYS current, so the captain's prefrontal cortex never carries
//   context across a surface switch. The 4 slots (his measured limit):
//     · concept_in_motion  — what he's actually working/learning right now
//     · open_loop          — the unfinished thread / the doubt still hanging
//     · where_left_off     — the last concrete thing, so re-entry is a READ
//     · next_step          — the obvious next move (never invented; from drills)
// ENGINE: the FREE Gemini-flash pool (hippocampus.generatePool) — ZERO Max budget
//   — with a DETERMINISTIC FLOOR built from the raw stream so the set is never
//   empty or broken even when the pool is dry. (Registered as fuelboard tank T8.)
// LAWS: SINGLE WRITER of working_set.json. Reads afferent.jsonl + workspace.json
//   + presence_log.jsonl + drills.json READ-ONLY (single-writer law intact).
//   Never invents a next_step — it comes from drills.json or stays empty.
// MODES: run (default) · selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const WORKING_SET = join(STATE_DIR, "working_set.json");

const INTERACTIVE = ["voice", "code", "desktop-study", "note", "context", "throwin"];
const DOUBT_RE = /\?|kyun|kyu|samajh|confus|doubt|nahi aa|stuck|matlab|difference|kaise|why|how does/i;

function readLines(p) {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch {}
  return out;
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const clampStr = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

// the freshest slice of what he's been doing, newest last
function recentStream(dir = STATE_DIR, n = 25) {
  return readLines(join(dir, "afferent.jsonl"))
    .filter(a => INTERACTIVE.includes(a.modality) && String(a.text || "").trim().length > 2)
    .slice(-n)
    .map(a => ({ ts: a.ts, modality: a.modality, text: clampStr(a.text, 400) }));
}

// DETERMINISTIC FLOOR — honest, never fabricated. Fills every slot from real data
// so the working set is always usable even with no LLM.
function deterministicSet(stream, presence, drills) {
  const last = stream[stream.length - 1];
  const lastDoubt = [...stream].reverse().find(s => DOUBT_RE.test(s.text));
  const pull = (presence || []).slice().reverse().find(r => Array.isArray(r.pull_words) && r.pull_words.length);
  const nextDrill = drills && Array.isArray(drills.drills) && drills.drills[0]
    ? (drills.drills[0].concept || drills.drills[0].title || "") : "";
  return {
    concept_in_motion: last ? clampStr(last.text, 80) : (pull ? clampStr(pull.pull_words.join(" "), 60) : ""),
    open_loop: lastDoubt ? clampStr(lastDoubt.text, 160) : "",
    where_left_off: last ? clampStr(last.text, 200) : "",
    next_step: clampStr(nextDrill, 120),
  };
}

function buildPrompt(stream, workspace) {
  const lines = stream.map(s => `[${String(s.ts).slice(11, 16)} ${s.modality}] ${s.text}`).join("\n");
  const moment = workspace && workspace.moment ? JSON.stringify(workspace.moment).slice(0, 600) : "(none)";
  return `You maintain a captain's WORKING MEMORY — 4 slots, his measured limit. Read his recent activity and return ONLY a JSON object with exactly these string keys, each <= 160 chars, in HIS register (Hinglish ok), grounded ONLY in the activity below (never invent facts or numbers):
{"concept_in_motion":"what he is actually working on / learning right now","open_loop":"the unfinished thread or the doubt still hanging (empty string if none)","where_left_off":"the last concrete thing he did, so re-entry is a glance","next_step":"the obvious next move IF one is clearly implied, else empty string"}
No preamble, no markdown, JSON only.

CURRENT MOMENT: ${moment}

RECENT ACTIVITY (oldest first):
${lines || "(quiet — no recent interactive activity)"}`;
}

// Truncation-proof: extract each field on its own so a response cut off mid-JSON
// (maxOutputTokens) still yields every slot that finished, instead of parsing to
// nothing. Returns null only when NOTHING parsed (then the deterministic floor stands).
function parseSet(text) {
  const s = String(text || "");
  const field = (k) => {
    const m = s.match(new RegExp('"' + k + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"'));
    return m ? clampStr(m[1].replace(/\\"/g, '"').replace(/\\[nrt]/g, " "), 200) : "";
  };
  const set = {
    concept_in_motion: field("concept_in_motion"), open_loop: field("open_loop"),
    where_left_off: field("where_left_off"), next_step: field("next_step"),
  };
  return (set.concept_in_motion || set.open_loop || set.where_left_off || set.next_step) ? set : null;
}

// LLM value wins where present; the deterministic floor fills every gap.
function merge(llm, floor) {
  const out = {};
  for (const k of ["concept_in_motion", "open_loop", "where_left_off", "next_step"]) out[k] = (llm && llm[k]) || floor[k] || "";
  return out;
}

async function distill(deps = {}) {
  const dir = deps.dir || STATE_DIR;
  const stream = deps.stream || recentStream(dir);
  const presence = deps.presence || readLines(join(dir, "presence_log.jsonl")).slice(-12);
  const drills = deps.drills !== undefined ? deps.drills : readJson(join(dir, "drills.json"));
  const workspace = deps.workspace !== undefined ? deps.workspace : readJson(join(dir, "workspace.json"));
  const floor = deterministicSet(stream, presence, drills);
  let llm = null, engine = "deterministic";
  if (stream.length && deps.gen !== null) {
    try {
      const r = await (deps.gen || defaultGen)(buildPrompt(stream, workspace));
      const text = typeof r === "string" ? r : (r && r.text);
      if (text) { llm = parseSet(text); if (llm) engine = "gemini-flash"; }
    } catch { /* pool dry → floor stands */ }
  }
  const slots = merge(llm, floor);
  return { ...slots, engine, sources: stream.length, last_surface: stream.length ? stream[stream.length - 1].modality : null };
}

async function defaultGen(prompt) {
  const { generatePool } = await import("./hippocampus.mjs");
  // NOT json-mode: it returned empty on the flash model live; the prompt asks for
  // JSON and parseSet extracts the {…} block from whatever comes back (robust).
  return generatePool(prompt, { models: ["gemini-flash-latest"], maxOutputTokens: 2048, temperature: 0.2 });
}

function summaryLine(set) {
  const bits = [];
  if (set.concept_in_motion) bits.push(`on: ${set.concept_in_motion}`);
  if (set.open_loop) bits.push(`open: ${set.open_loop}`);
  if (set.next_step) bits.push(`next: ${set.next_step}`);
  return bits.join(" · ") || "(quiet)";
}

async function run(now = new Date()) {
  const set = await distill({});
  const out = { ts: now.toISOString(), ...set, summary: summaryLine(set) };
  writeAtomic(WORKING_SET, out);
  console.log(`distiller: working_set updated (${set.engine}, ${set.sources} sources) — ${out.summary}`);
  return out;
}

async function selftest() {
  const checks = [];
  const assert = (n, c) => { checks.push(!!c); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const stream = [
    { ts: "2026-07-18T10:00:00Z", modality: "code", text: "explain embeddings vs tokenization" },
    { ts: "2026-07-18T10:05:00Z", modality: "voice", text: "cosine similarity samajh nahi aaya, kyun use karte hain?" },
  ];
  const drills = { drills: [{ concept: "attention mechanism" }] };

  // deterministic floor — honest, never empty when data exists
  const floor = deterministicSet(stream, [], drills);
  assert("FLOOR — where_left_off = the last concrete thing", floor.where_left_off.includes("cosine similarity"));
  assert("FLOOR — open_loop catches the hanging doubt", DOUBT_RE.test(floor.open_loop) && floor.open_loop.includes("cosine"));
  assert("FLOOR — next_step comes from drills, never invented", floor.next_step === "attention mechanism");
  assert("FLOOR — empty stream yields empty slots, never a crash", deterministicSet([], [], null).where_left_off === "");

  // parse + merge
  const good = parseSet('{"concept_in_motion":"embeddings","open_loop":"why cosine","where_left_off":"asked about cosine","next_step":""}');
  assert("PARSE — clean JSON parses to the 4 slots", good && good.concept_in_motion === "embeddings");
  assert("PARSE — junk text returns null (floor takes over)", parseSet("sorry I can't do that") === null);
  const merged = merge(good, floor);
  assert("MERGE — LLM wins where present, floor fills the gap (next_step)", merged.concept_in_motion === "embeddings" && merged.next_step === "attention mechanism");

  // distill — mocked LLM, no network
  const set = await distill({ dir: "no-dir", stream, presence: [], drills, workspace: null, gen: async () => '{"concept_in_motion":"embeddings","open_loop":"why cosine similarity","where_left_off":"","next_step":""}' });
  assert("DISTILL — LLM path fills slots + floor covers where_left_off", set.engine === "gemini-flash" && set.concept_in_motion === "embeddings" && set.where_left_off.includes("cosine"));
  const setDry = await distill({ dir: "no-dir", stream, presence: [], drills, workspace: null, gen: async () => { throw new Error("pool dry"); } });
  assert("DISTILL — pool dry → deterministic floor stands, never breaks", setDry.engine === "deterministic" && setDry.where_left_off.includes("cosine"));
  const setEmpty = await distill({ dir: "no-dir", stream: [], presence: [], drills: null, workspace: null, gen: null });
  assert("DISTILL — no activity → empty but valid set", setEmpty.sources === 0 && typeof setEmpty.concept_in_motion === "string");

  assert("SUMMARY — reads as one glanceable line", summaryLine(set).includes("on:") && summaryLine(set).includes("open:"));

  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  await run();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { distill, deterministicSet, parseSet, merge, recentStream, buildPrompt, summaryLine, run };
