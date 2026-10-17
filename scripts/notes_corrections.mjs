#!/usr/bin/env node
// ============================================================================
// scripts/notes_corrections.mjs · ARSENAL AI FC — THE CORRECTIONS LANE (rung L1 · NOTES_DESIGN §6, REQUIRED)
// ----------------------------------------------------------------------------
// WHY: the capsules are IMMUTABLE (their prose SACRED, mirror.mjs their only writer, the gist his paste) — and
//   one of them is wrong. The tokenization capsule (doubt 24, trap T3, two sites) states BPE at inference as
//   "greedy longest-match": that is WordPiece's algorithm; BPE replays its learned merges in order. He was
//   taught the correct mechanism with a diff block on 24 Sep 2026 (forks row 277 (b)). A locked capsule is
//   corrected by a layer ABOVE it, never by an edit: a dated, sourced corrections file, applied by the note
//   compiler at compile time FIRST, and read first by any session that teaches from a capsule. No compiled
//   note may serve a corrected claim as truth (row 550 (2), D-16 §6).
//
// LAWS:
//   · SOLE WRITER of dressing-room/state/notes_corrections.jsonl. Nothing else writes it; notes_compiler.mjs and
//     the teaching skills READ it (`active`, `matchesIn`, the `list` verb).
//   · APPEND-ONLY, one row kind, never a rewrite (L9):
//       {v:1, kind:"correction", id, ts, concept, axis, claim, match[], correct, source, taught_at, refs, by, supersedes?}
//     `claim` is the wrong line as it is served (verbatim), `match[]` the texts that identify it inside any line
//     (default: the claim itself), `correct` the right mechanism, `source` WHERE it was taught or ruled, and
//     `taught_at` the date. A correction that was itself wrong is SUPERSEDED by a newer row (`supersedes` names
//     it); the older row stays on the ledger as the record.
//   · DATED AND SOURCED OR REFUSED: no row without a concept, a claim, the correction, a source and a date.
//   · IDEMPOTENT: the same live correction (concept, axis, claim, correct) is never appended twice — re-running
//     the landing command says "already on the lane" and writes nothing.
//   · A FAILED APPEND RETURNS ok:false — never a bare catch that reports ok; the row is read back off the disk
//     before ok:true is said (resume_pointer.mjs's appendChecked, the sl2 bank-write rule).
//   · TIER 0: no model, no network, no key. Never another person's name, never a credential, in any row.
// MATCHING (the owner defines what a correction matches, one definition for every reader): a line carries a
//   correction iff, case-folded and with runs of whitespace collapsed, it contains one of the row's match[]
//   texts. Plain substrings — no regex a cold reader cannot read.
// WHO ELSE COULD ACT ON THIS OUTPUT? notes_compiler.mjs (applies it FIRST at every compile) · the learn and forge
//   skills (lane S: read `list --concept <c>` first when teaching from a capsule — FORK F-3 in the L1 proof) ·
//   the morning brief (an asked-first strike from a corrected note).
// CLI: node scripts/notes_corrections.mjs add --concept <c> --claim "<the wrong line>" --correct "<the right mechanism>"
//        --source "<where it was taught or ruled>" --taught YYYY-MM-DD [--axis a-i] [--match "<text>"]… [--refs "<sites>"]
//        [--supersedes <id>]
//      | list [--concept <c>] [--json] | selftest
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const LEDGER = join(__dirname, "..", "dressing-room", "state", "notes_corrections.jsonl");
const AXES = "abcdefghi".split("");
const newId = (now) => `c-${now.getTime().toString(36)}-${randomBytes(3).toString("hex")}`;
export const fold = (s) => String(s == null ? "" : s).toLowerCase().replace(/\s+/g, " ").trim();
const isCorrection = (r) => !!r && r.kind === "correction" && typeof r.id === "string" && r.id !== "" && typeof r.claim === "string" && typeof r.correct === "string";

// ---------------------------------------------------------------------------
// READ — a torn line is skipped, never fatal
// ---------------------------------------------------------------------------
/** readRows — every parseable row in ledger order. Absent file ⇒ []. Throws only when the file EXISTS and cannot
 *  be read — the caller decides (the compiler refuses to compile without its corrections: they are read FIRST). */
export function readRows(path = LEDGER) {
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { const o = JSON.parse(line); if (o && typeof o === "object" && !Array.isArray(o)) out.push(o); } catch { /* a torn line is skipped */ }
  }
  return out;
}

/** active — PURE. The live corrections for a concept (and axis): a row superseded by a newer row is not live.
 *  A row with axis null applies to every axis of its concept. */
export function active(rows, { concept = null, axis = null } = {}) {
  const c = concept ? String(concept).trim().toLowerCase() : null, a = axis ? String(axis).trim().toLowerCase() : null;
  const all = (rows || []).filter(isCorrection);
  const gone = new Set(all.map((r) => r.supersedes).filter((s) => typeof s === "string" && s));
  return all.filter((r) => !gone.has(r.id) && (!c || String(r.concept || "").toLowerCase() === c) && (!a || !r.axis || r.axis === a));
}

/** matchesIn — PURE. The live corrections a line carries (the one definition of "this line states that claim"). */
export function matchesIn(text, corrections) {
  const t = fold(text);
  if (!t) return [];
  return (corrections || []).filter((c) => (Array.isArray(c.match) && c.match.length ? c.match : [c.claim]).some((m) => fold(m) && t.includes(fold(m))));
}

// ---------------------------------------------------------------------------
// APPEND — checked: the row is on disk, read back, or the answer is ok:false
// ---------------------------------------------------------------------------
function appendChecked(path, row) {
  const line = JSON.stringify(row);
  try {
    mkdirSync(dirname(path), { recursive: true });
    const before = existsSync(path) ? readFileSync(path, "utf8") : "";
    appendFileSync(path, (before && !before.endsWith("\n") ? "\n" : "") + line + "\n", "utf8");
  } catch (e) {
    return { ok: false, why: `append failed (${String((e && e.message) || e).slice(0, 160)})` };
  }
  try {
    const back = readFileSync(path, "utf8").split(/\r?\n/).filter((l) => l.trim());
    if (back[back.length - 1] !== line) return { ok: false, why: "the row is not on disk after the append (read-back mismatch)" };
  } catch (e) {
    return { ok: false, why: `read-back failed (${String((e && e.message) || e).slice(0, 160)})` };
  }
  return { ok: true };
}

/** add — ONE correction row, dated and sourced, appended and verified.
 *  @returns {{ok:true,row:any,appended:boolean}|{ok:false,why:string}} */
export function add(p = {}, { path = LEDGER, now = new Date(), by = "cli" } = {}) {
  const s = (v) => (typeof v === "string" ? v.trim() : "");
  const concept = s(p.concept).toLowerCase(), claim = s(p.claim), correct = s(p.correct), source = s(p.source), taught = s(p.taught);
  const axis = s(p.axis).toLowerCase() || null, refs = s(p.refs) || null, supersedes = s(p.supersedes) || null;
  const match = (Array.isArray(p.match) ? p.match : []).map(s).filter(Boolean);
  if (!concept) return { ok: false, why: "a correction names its concept (--concept)" };
  if (!claim) return { ok: false, why: "a correction names the wrong line it corrects, verbatim (--claim)" };
  if (!correct) return { ok: false, why: "a correction states the right mechanism (--correct)" };
  if (!source) return { ok: false, why: "a correction is SOURCED — where it was taught or ruled (--source)" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(taught) || Number.isNaN(Date.parse(`${taught}T00:00:00Z`))) return { ok: false, why: "a correction is DATED — the day it was taught (--taught YYYY-MM-DD)" };
  if (axis !== null && !AXES.includes(axis)) return { ok: false, why: `axis is a-i or absent (${p.axis})` };
  if (fold(claim) === fold(correct)) return { ok: false, why: "the correction restates the claim — nothing is corrected" };
  let rows;
  try { rows = readRows(path); } catch (e) { return { ok: false, why: `the lane exists and cannot be read (${String((e && e.message) || e).slice(0, 120)}) — nothing written` }; }
  if (supersedes && !rows.some((r) => isCorrection(r) && r.id === supersedes)) return { ok: false, why: `--supersedes names no correction on the lane (${supersedes})` };
  const same = active(rows, { concept }).find((r) => (r.axis || null) === axis && fold(r.claim) === fold(claim) && fold(r.correct) === fold(correct));
  if (same && !supersedes) return { ok: true, row: same, appended: false };
  const row = { v: 1, kind: "correction", id: newId(now), ts: now.toISOString(), concept, axis, claim, match: match.length ? match : [claim], correct, source, taught_at: taught, refs, by, ...(supersedes ? { supersedes } : {}) };
  const w = appendChecked(path, row);
  return w.ok ? { ok: true, row, appended: true } : { ok: false, why: w.why };
}

// ---------------------------------------------------------------------------
// SELFTEST — temp ledgers under the OS temp dir, never the live lane
// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond, detail = "") => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; console.log(`  FAIL ${name}${detail ? `\n         ${detail}` : ""}`); } };
  console.log("=== NOTES CORRECTIONS SELFTEST — the corrections lane (NOTES_DESIGN §6) ===\n");
  const tmp = mkdtempSync(join(tmpdir(), "arsenal-corrections-test-"));
  const P = (n) => join(tmp, n), bytes = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);
  const T = (m) => new Date(Date.UTC(2026, 9, 6, 4, m, 0));
  try {
    const L = P("c.jsonl");
    const bpe = { concept: "Tokenization", claim: "BPE at inference = greedy longest-match", match: ["greedy longest-match", "greedy longest match"],
      correct: "Greedy longest-match is WordPiece's inference; BPE replays its learned merges in the order they were learned.", source: "fixture: a diff block taught in the session", taught: "2026-09-24", refs: "capsule doubt 24 · trap T3" };
    const a1 = add(bpe, { path: L, now: T(0) });
    const r1 = readRows(L);
    assert("ADD — one row: v 1, kind correction, its own id, ts, the concept lowercased, axis null (every axis), claim, match[], correct, source, taught_at",
      a1.ok && a1.appended && r1.length === 1 && r1[0].v === 1 && r1[0].kind === "correction" && /^c-/.test(r1[0].id) && r1[0].concept === "tokenization" && r1[0].axis === null
      && r1[0].match.length === 2 && r1[0].taught_at === "2026-09-24" && typeof r1[0].source === "string" && r1[0].ts === T(0).toISOString());
    const before = bytes(L);
    const again = add(bpe, { path: L, now: T(1) });
    assert("IDEMPOTENT — the same live correction is never appended twice (the landing command can be re-run)", again.ok && again.appended === false && again.row.id === r1[0].id && bytes(L) === before);
    const refusals = [
      add({ ...bpe, source: "" }, { path: L, now: T(2) }), add({ ...bpe, taught: "" }, { path: L, now: T(2) }), add({ ...bpe, taught: "24 Sep" }, { path: L, now: T(2) }),
      add({ ...bpe, claim: "" }, { path: L, now: T(2) }), add({ ...bpe, correct: "" }, { path: L, now: T(2) }), add({ ...bpe, concept: "" }, { path: L, now: T(2) }),
      add({ ...bpe, axis: "z" }, { path: L, now: T(2) }), add({ ...bpe, correct: bpe.claim }, { path: L, now: T(2) }), add({ ...bpe, supersedes: "c-nope" }, { path: L, now: T(2) }),
    ];
    assert("DATED AND SOURCED OR REFUSED — no source, no date, a non-ISO date, no claim, no correction, no concept, a bad axis, a restated claim, a supersede of nothing: each ok:false with its why, the lane byte-identical",
      refusals.every((r) => r.ok === false && typeof r.why === "string" && r.why.length > 0) && bytes(L) === before);
    const live = active(readRows(L), { concept: "tokenization", axis: "c" });
    assert("ACTIVE — an axis-null correction applies to every axis of its concept, and to no other concept",
      live.length === 1 && active(readRows(L), { concept: "embeddings" }).length === 0);
    assert("MATCHES — case-folded, whitespace-collapsed substrings; a line that never states the claim carries nothing",
      matchesIn("Inference par BPE ek GREEDY   longest match karta hai", live).length === 1 && matchesIn("BPE merges in learned order", live).length === 0 && matchesIn("", live).length === 0);
    const sup = add({ ...bpe, correct: "BPE at inference applies its learned merges by rank, lowest first; greedy longest-match is WordPiece.", supersedes: r1[0].id }, { path: L, now: T(3) });
    const rows2 = readRows(L);
    assert("SUPERSEDE APPENDS — a corrected correction is a NEW row naming the old; the old row stays byte-identical on the lane (L9) and leaves the live set",
      sup.ok && sup.appended && rows2.length === 2 && bytes(L).startsWith(before) && rows2[1].supersedes === r1[0].id
      && active(rows2, { concept: "tokenization" }).map((r) => r.id).join() === rows2[1].id);
    writeFileSync(P("blocker"), "a file, not a directory");
    const wf = add(bpe, { path: join(P("blocker"), "notes_corrections.jsonl"), now: T(4) });
    assert("A FAILED APPEND IS ok:false — never a bare catch that reports ok (the path under a FILE cannot be written)", wf.ok === false && /append failed/.test(wf.why) && !("row" in wf));
    assert("READ — a torn line is skipped, never fatal; an absent lane is []",
      (() => { const t = P("torn.jsonl"); writeFileSync(t, before + "{torn\n"); return readRows(t).length === 1 && readRows(P("absent.jsonl")).length === 0; })());
  } catch (e) { fail++; console.log(`  CRASH the selftest threw — ${String((e && e.message) || e).slice(0, 200)} (a crash is never a pass)`); }
  finally { rmSync(tmp, { recursive: true, force: true }); }
  console.log(`\nnotes_corrections selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const flag = (argv, k) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? "") : null; };
const flags = (argv, k) => argv.flatMap((a, i) => (a === k && i + 1 < argv.length ? [argv[i + 1]] : []));
function main() {
  const [mode, ...rest] = process.argv.slice(2);
  switch (mode) {
    case "add": {
      const r = add({ concept: flag(rest, "--concept"), axis: flag(rest, "--axis"), claim: flag(rest, "--claim"), correct: flag(rest, "--correct"), source: flag(rest, "--source"),
        taught: flag(rest, "--taught"), refs: flag(rest, "--refs"), supersedes: flag(rest, "--supersedes"), match: flags(rest, "--match") });
      if (!r.ok) { console.error(`notes_corrections: REFUSED — ${r.why} (nothing written)`); process.exitCode = 1; break; }
      console.log(r.appended ? `notes_corrections: RECORDED ${r.row.id} · ${r.row.concept}${r.row.axis ? `/${r.row.axis}` : ""} · taught ${r.row.taught_at} · "${r.row.claim}" is corrected`
        : `notes_corrections: already on the lane — ${r.row.id} (${r.row.concept}, taught ${r.row.taught_at}); nothing written`);
      break;
    }
    case "list": {
      let rows;
      try { rows = active(readRows(), { concept: flag(rest, "--concept") || null }); } catch (e) { console.error(`notes_corrections: the lane cannot be read (${String((e && e.message) || e).slice(0, 120)})`); process.exitCode = 1; break; }
      if (rest.includes("--json")) { console.log(JSON.stringify(rows, null, 1)); break; }
      if (!rows.length) { console.log("notes_corrections: no live correction"); break; }
      for (const r of rows) console.log(`${r.id} · ${r.concept}${r.axis ? `/${r.axis}` : ""} · taught ${r.taught_at} · WRONG: "${r.claim}" → ${r.correct} (${r.source})`);
      break;
    }
    case "selftest": selftest(); break;
    default:
      console.log('notes_corrections: add --concept <c> --claim "<wrong line>" --correct "<right mechanism>" --source "<where>" --taught YYYY-MM-DD [--axis a-i] [--match "<text>"]… [--refs "<sites>"] [--supersedes <id>] | list [--concept <c>] [--json] | selftest');
      if (mode) process.exitCode = 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
