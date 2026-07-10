#!/usr/bin/env node
// ============================================================================
// capture.mjs · ARSENAL AI FC — AGENT #0: THE SHARED CAPTURE LAYER
// ----------------------------------------------------------------------------
// WHAT:  The single writer of dressing-room/state/reps_log.jsonl — one JSON
//        object per line, one line per study/drill "rep." Three downstream
//        agents READ it and compute their own view (never write it):
//          FSRS ← cards + review schedule · Calibration ← Brier/confidence gap
//          Nemesis ← ranked recurring misses.
// WHY:   FSRS, Calibration and Nemesis all need the SAME raw event (a rep with
//        a question, the captain's predicted confidence, and correct?). One
//        capture, three consumers — no brittle per-agent hooks (CONDUCTOR §7).
//
// CAPTURE-HOOK (the crux — how the captain's normal work becomes input):
//   The captain works only on Colab / Gems / NotebookLM (cloud — no silent local
//   hook is possible). Capture = a session-end structured report, two intake paths:
//     • paste  — Gems path: paste the Drill-Gem's session JSON array → append.
//     • pull   — Colab→Drive path (Option B): Colab auto-writes *.jsonl into a
//                Google-Drive-synced inbox; this reads new files → append → move
//                them to <inbox>/done. Requires Google Drive for Desktop.
//   (See MANUAL_WIRING.md for the exact Colab cell + Drill-Gem prompt.)
//
// INPUT CONTRACT (one rep, one JSON object):
//   { ts:string(ISO), surface:"gem"|"colab", concept:string, question:string,
//     confidence:"knew"|"shaky"|"guessed", correct:boolean, note?:string }
//   Dedup key = ts + question. Malformed reps are REJECTED (never coerced).
//
// OUTPUT SCHEMA: dressing-room/state/reps_log.jsonl — append-only JSONL, single
//   writer = this file. Missing/empty file is VALID (awaiting data) — consumers
//   treat absent as empty; this script NEVER fabricates a rep.
//
// MODES:
//   node capture.mjs paste [file]  — read JSON (array or object) from file/stdin → append
//   node capture.mjs pull          — ingest new *.jsonl from the Drive inbox → append → move to /done
//   node capture.mjs selftest      — baked-mock asserts (no real state touched) → ALL CHECKS PASSED
//
// RULES (CONDUCTOR §4): deterministic · zero LLM · no API key · Node 22 ESM ·
//   Windows-safe entry guard · atomic write (temp→rename) · empty-safe · never fabricate.
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const REPS_LOG  = join(STATE_DIR, "reps_log.jsonl");

// Colab→Drive inbox (Option B). Resolved from CONFIG, never a hardcoded user path:
//   1) env ARSENAL_REPS_INBOX  →  2) capture_config.json {"inbox":"..."}  →  3) unset = dormant.
// capture_config.json is machine-local (gitignored) — it holds THIS PC's My Drive path.
const CONFIG_PATH = join(STATE_DIR, "capture_config.json");
function resolveInbox() {
  if (process.env.ARSENAL_REPS_INBOX && process.env.ARSENAL_REPS_INBOX.trim()) return process.env.ARSENAL_REPS_INBOX.trim();
  try {
    if (existsSync(CONFIG_PATH)) {
      const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
      if (cfg && typeof cfg.inbox === "string" && cfg.inbox.trim()) return cfg.inbox.trim();
    }
  } catch { /* malformed config → treat as unconfigured, never crash */ }
  return null;
}

// ---------------------------------------------------------------------------
// validation — a rep is accepted ONLY if every required field is well-typed.
// ---------------------------------------------------------------------------
const SURFACES = new Set(["gem", "colab"]);
const CONFIDENCE = new Set(["knew", "shaky", "guessed"]);   // one gut-word, committed BEFORE the answer is revealed
function validateRep(o) {
  if (o === null || typeof o !== "object" || Array.isArray(o)) return { ok: false, error: "not an object" };
  if (typeof o.ts !== "string" || o.ts.trim() === "") return { ok: false, error: "ts missing/not-string" };
  if (!SURFACES.has(o.surface)) return { ok: false, error: `surface not gem|colab (${o.surface})` };
  if (typeof o.concept !== "string" || o.concept.trim() === "") return { ok: false, error: "concept missing/empty" };
  if (typeof o.question !== "string" || o.question.trim() === "") return { ok: false, error: "question missing/empty" };
  if (!CONFIDENCE.has(o.confidence)) return { ok: false, error: `confidence not knew|shaky|guessed (${o.confidence})` };
  if (typeof o.correct !== "boolean") return { ok: false, error: "correct not boolean" };
  if (o.note !== undefined && typeof o.note !== "string") return { ok: false, error: "note not string" };
  // clean rep — only schema fields, in fixed order
  const rep = { ts: o.ts, surface: o.surface, concept: o.concept, question: o.question, confidence: o.confidence, correct: o.correct };
  if (o.note !== undefined) rep.note = o.note;
  return { ok: true, rep };
}

const keyOf = (r) => JSON.stringify([r.ts, r.question]);

// ---------------------------------------------------------------------------
// load existing reps (defensive: skip unparseable lines; missing file = empty)
// ---------------------------------------------------------------------------
function loadReps(path) {
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    try { const o = JSON.parse(s); if (validateRep(o).ok) out.push(o); } catch { /* skip corrupt line */ }
  }
  return out;
}

// atomic write: temp file → rename (a parse-fail reads as missing, never half-written)
function writeAtomic(path, reps) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, reps.map((r) => JSON.stringify(r)).join("\n") + (reps.length ? "\n" : ""));
  renameSync(tmp, path);
}

// ingest candidates → validate + dedup (vs existing AND within batch) → atomic append.
// Returns counts. Writes ONLY when something is actually appended (no spurious empty file).
function ingest(path, candidates) {
  const existing = loadReps(path);
  const seen = new Set(existing.map(keyOf));
  const toAppend = [];
  let rejected = 0, duplicates = 0;
  const errors = [];
  for (const c of candidates) {
    const v = validateRep(c);
    if (!v.ok) { rejected++; errors.push(v.error); continue; }
    const k = keyOf(v.rep);
    if (seen.has(k)) { duplicates++; continue; }
    seen.add(k); toAppend.push(v.rep);
  }
  if (toAppend.length) writeAtomic(path, existing.concat(toAppend));
  return { appended: toAppend.length, rejected, duplicates, total: existing.length + toAppend.length, errors };
}

// parse a pasted blob into an array of candidate objects
function parseBlob(text) {
  const t = (text || "").trim();
  if (!t) return [];
  const j = JSON.parse(t);              // throws on malformed JSON → caller reports
  return Array.isArray(j) ? j : [j];
}

// ---------------------------------------------------------------------------
// pull: ingest new *.jsonl from the Drive inbox → move processed files to /done.
// Missing inbox = Drive not wired yet → 0 pulled, NO fabrication, exit 0.
// ---------------------------------------------------------------------------
function pullFromInbox(inboxPath, repsPath) {
  if (!existsSync(inboxPath)) {
    return { pulled: 0, files: 0, wired: false, note: `inbox not found (${inboxPath}) — Google Drive for Desktop not wired yet; nothing pulled` };
  }
  const files = readdirSync(inboxPath).filter((f) => f.toLowerCase().endsWith(".jsonl"));
  const doneDir = join(inboxPath, "done");
  let pulled = 0, rejected = 0, duplicates = 0;
  for (const f of files) {
    const full = join(inboxPath, f);
    const cands = [];
    for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
      const s = line.trim(); if (!s) continue;
      try { cands.push(JSON.parse(s)); } catch { rejected++; }
    }
    const r = ingest(repsPath, cands);
    pulled += r.appended; rejected += r.rejected; duplicates += r.duplicates;
    mkdirSync(doneDir, { recursive: true });
    renameSync(full, join(doneDir, f));
  }
  return { pulled, files: files.length, rejected, duplicates, wired: true, note: `pulled ${pulled} from ${files.length} file(s)` };
}

// ---------------------------------------------------------------------------
// selftest — baked mock in a temp dir; the real reps_log is NEVER touched.
// ---------------------------------------------------------------------------
function selftest() {
  const dir = join(tmpdir(), "arsenal_capture_selftest");
  mkdirSync(dir, { recursive: true });
  const p = join(dir, "reps_log.jsonl");
  if (existsSync(p)) rmSync(p);
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };

  const rep = (over) => ({ ts: "2026-07-11T09:00:00Z", surface: "gem", concept: "TDS", question: "what rate on 194C?", confidence: "knew", correct: true, ...over });

  // 1) empty-safe: load a non-existent log
  assert("empty-safe: missing log loads as 0 reps", loadReps(p).length === 0);

  // 2) valid-append
  let r = ingest(p, [rep(), rep({ ts: "2026-07-11T09:05:00Z", question: "q2" })]);
  assert("valid-append: 2 valid reps appended", r.appended === 2 && loadReps(p).length === 2);

  // 3) malformed-reject (missing ts, out-of-set confidence string, legacy numeric confidence, bad surface, missing concept, non-bool correct, note wrong type)
  const bad = [
    rep({ ts: undefined, question: "b1" }),
    rep({ confidence: "sure", question: "b2" }),   // out-of-set enum value
    rep({ confidence: 90, question: "b3" }),        // legacy numeric — now invalid
    rep({ surface: "notebook", question: "b4" }),
    rep({ concept: "", question: "b5" }),
    rep({ correct: "yes", question: "b6" }),
    rep({ note: 123, question: "b7" }),
  ];
  const before = loadReps(p).length;
  r = ingest(p, [rep({ ts: "2026-07-11T09:10:00Z", question: "good1" }), ...bad]);
  assert("malformed-reject: 7 rejected, only 1 valid appended", r.rejected === 7 && r.appended === 1 && loadReps(p).length === before + 1);

  // 3b) confidence enum: an out-of-set gut-word is REJECTED
  const er = ingest(p, [rep({ ts: "2026-07-11T09:12:00Z", question: "enumcheck", confidence: "sorta" })]);
  assert("enum-reject: confidence outside {knew,shaky,guessed} rejected", er.rejected === 1 && er.appended === 0);

  // 3c) all three enum gut-words accepted
  const okAll = ["knew", "shaky", "guessed"].every((c, i) => ingest(p, [rep({ ts: `2026-07-11T10:0${i}:00Z`, question: `enumok${i}`, confidence: c })]).appended === 1);
  assert("enum-accept: knew/shaky/guessed all valid", okAll);

  // 4) dedup (same ts+question)
  const dupRep = rep({ ts: "2026-07-11T09:00:00Z", question: "what rate on 194C?" });
  const cnt = loadReps(p).length;
  r = ingest(p, [dupRep]);
  assert("dedup: identical ts+question not re-appended", r.duplicates === 1 && r.appended === 0 && loadReps(p).length === cnt);

  // 5) no spurious file on empty ingest
  const p2 = join(dir, "reps_empty.jsonl");
  if (existsSync(p2)) rmSync(p2);
  ingest(p2, []);
  assert("empty-ingest: no file fabricated", !existsSync(p2));

  // 6) pull with missing inbox = dormant no-op (never fabricates)
  const pr = pullFromInbox(join(dir, "no_such_inbox"), p);
  assert("pull dormant: missing inbox → 0 pulled, wired=false", pr.pulled === 0 && pr.wired === false);

  rmSync(dir, { recursive: true, force: true });
  const passed = checks.every(([, ok]) => ok);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }

  if (mode === "paste") {
    const fileArg = process.argv[3];
    let text;
    if (fileArg) {
      if (!existsSync(fileArg)) { console.error(`paste: file not found: ${fileArg}`); process.exit(1); }
      text = readFileSync(fileArg, "utf8");
    } else if (!process.stdin.isTTY) {
      text = readFileSync(0, "utf8");                 // piped stdin
    } else {
      console.error("paste: provide a JSON file arg or pipe JSON via stdin.\n  node capture.mjs paste session.json"); process.exit(1);
    }
    let cands;
    try { cands = parseBlob(text); }
    catch (e) { console.error(`paste: not valid JSON — nothing ingested (${e.message})`); process.exit(1); }
    const r = ingest(REPS_LOG, cands);
    console.log(`paste: appended ${r.appended}, rejected ${r.rejected}, duplicates ${r.duplicates} → ${REPS_LOG} (total ${r.total})`);
    if (r.errors.length) console.log(`  rejected reasons: ${r.errors.slice(0, 10).join("; ")}`);
    process.exit(0);
  }

  if (mode === "pull") {
    const inbox = resolveInbox();
    if (!inbox) {
      console.log("pull: inbox not configured — set env ARSENAL_REPS_INBOX or capture_config.json {inbox:...}; nothing pulled.");
      process.exit(0);
    }
    const r = pullFromInbox(inbox, REPS_LOG);
    console.log(`pull: ${r.note}` + (r.wired ? ` (rejected ${r.rejected || 0}, duplicates ${r.duplicates || 0})` : ""));
    if (!r.wired) console.log(`  to enable: create ${inbox} (or fix ARSENAL_REPS_INBOX / capture_config.json), then enable task ArsenalFC-CapturePull.`);
    process.exit(0);
  }

  console.log("THE SHARED CAPTURE LAYER (Agent #0)\n  node capture.mjs paste [file]   append pasted Gem/Colab session JSON\n  node capture.mjs pull           ingest new reps from the Drive inbox\n  node capture.mjs selftest       run baked-mock checks");
  process.exit(0);
}

// Windows-safe entry guard (normalise argv[1] to a file:// URL, like timeaudit.mjs)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { validateRep, ingest, loadReps, pullFromInbox, keyOf };
