#!/usr/bin/env node
// ============================================================================
// scripts/resume_pointer.mjs · ARSENAL AI FC — THE RESUME POINTER (rung L3 · fate 52, U3)
// ----------------------------------------------------------------------------
// WHAT: the verb rung L3 found UNBUILT (15 Oct 2026). When a study session STOPS, a
//   POINTER is written — the exact unanswered micro-question where he stopped; the next
//   session OPENS by consuming it, at that question, with nothing repeated. Before this
//   file the question lived only inside forge_session.json (`resume_pointer`, row 68 (b)):
//   the newest replaced the older, nothing recorded that an open ever read it, and a day
//   he stopped and came back left no trace any witness could count. The rung witness
//   (cloud/ml3/witness/rung_L3.mjs) read `RED S7 no pointer consumed` on his tree.
//
// LAWS:
//   · SOLE WRITER of dressing-room/state/resume_pointer.jsonl. Nothing else writes it.
//     forge_session.mjs CALLS `write` at its stop paths and `consume` at its open paths;
//     learnstate.mjs READS `latest` and never consumes (SessionStart also opens
//     engineering sessions — a kickoff that consumed would spend his question on a
//     session that never asked it).
//   · APPEND-ONLY, TWO ROW KINDS, NEVER A REWRITE (forks row 551 (1), the witness's CLASS A):
//       {v:1, kind:"written",  id, written_at, concept, step, axis, question, session_id}   at a stop
//       {v:1, kind:"consumed", id, of, consumed_at, by}                                      at an open
//     `of` names the written pointer's id. A written row is never touched again: an open
//     APPENDS its consumption. No row ever carries both written_at and consumed_at.
//   · ONE OPEN POINTER PER CONCEPT — the NEWEST written pointer, while no consumption names
//     it. A newer write supersedes an older one (the older stays on the ledger as a record,
//     L9), so a consumed pointer can never be followed by a stale one resurfacing.
//   · A consume with NO open pointer writes NOTHING and says so; a SECOND consume of one
//     pointer writes nothing (it is no longer open). A consumption is lawful only when the
//     pointer it names was written at or before it.
//   · A FAILED APPEND RETURNS ok:false — never a bare catch that reports ok. The row is read
//     back off the disk before ok:true is said (the sl2 bank-write rule, gaffer_brain).
//   · TIMES ARE ISO. EVERY DAY KEY IS IST (Asia/Kolkata), NEVER UTC — `istDay` below is the
//     witness's own K, and learnstate keys its days through it.
//   · No LLM, no key, no network. Every read is fail-closed for a WRITE and fail-silent for
//     `latest` (it rides SessionStart, where a reader must never bite the session).
// MODES: write --concept <c> --question "<q>" [--step <0-11>] [--axis <a-i>] [--session <id>]
//        · consume [--concept <c>] [--by <who>] · latest [--concept <c>] [--json] · selftest
// ============================================================================
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const LEDGER = join(__dirname, "..", "dressing-room", "state", "resume_pointer.jsonl");
// One clause, one question — forge_session.mjs POINTER_MAX, the same number for the same thing.
export const QUESTION_MAX = 280;
const AXES = "abcdefghi".split("");
const STEP_MAX = 11;   // THE METHOD's steps 0-11 (forge_session.mjs STEPS)

/** istDay — the IST (Asia/Kolkata) day of an instant, "YYYY-MM-DD", or null. Never UTC: at 00:10 IST
 *  the UTC slice still says yesterday, which is exactly the briefed-row defect (learning-loop.txt:47). */
export const istDay = (t) => {
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};
const newId = (prefix, now) => `${prefix}-${now.getTime().toString(36)}-${randomBytes(3).toString("hex")}`;
const isWritten = (r) => !!r && r.kind === "written" && typeof r.id === "string" && r.id !== "" && typeof r.written_at === "string" && !("consumed_at" in r);
const isConsumed = (r) => !!r && r.kind === "consumed" && typeof r.of === "string" && r.of !== "" && typeof r.consumed_at === "string" && !("written_at" in r);

// ---------------------------------------------------------------------------
// READ — a mangled line is skipped, never fatal (an append-only file is wrong only at a torn tail)
// ---------------------------------------------------------------------------
/** readRows — every parseable row in ledger order (= write order). Absent file ⇒ []. Throws only when the
 *  file EXISTS and cannot be read — the caller decides: a write refuses, `latest` goes silent. */
export function readRows(path = LEDGER) {
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { const o = JSON.parse(line); if (o && typeof o === "object" && !Array.isArray(o)) out.push(o); } catch { /* a torn line is skipped */ }
  }
  return out;
}

/** pointerState — PURE. For `concept` (or every concept): the newest written pointer, the consumption that
 *  names it (if any), and the OPEN pointer = that newest one while nothing names it.
 *  @param {any[]} rows @param {{concept?: string|null}} [opts] */
export function pointerState(rows, { concept = null } = {}) {
  const c = concept ? String(concept).trim().toLowerCase() : null;
  const written = (rows || []).filter(isWritten).filter((r) => !c || String(r.concept || "").toLowerCase() === c);
  const newest = written.length ? written[written.length - 1] : null;
  const consumed = newest ? ((rows || []).filter(isConsumed).find((x) => x.of === newest.id) || null) : null;
  return { open: newest && !consumed ? newest : null, newest, consumed };
}

// ---------------------------------------------------------------------------
// APPEND — checked: the row is on disk, read back, or the answer is ok:false
// ---------------------------------------------------------------------------
function appendChecked(path, row) {
  const line = JSON.stringify(row);
  try {
    mkdirSync(dirname(path), { recursive: true });
    // a torn tail (no final newline) would glue this row onto it: start a fresh line first
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

// ---------------------------------------------------------------------------
// THE THREE VERBS
// ---------------------------------------------------------------------------
/** write — a pointer at a STOP. One written row, appended and verified; nothing else changes.
 *  @param {{concept?: string|null, question?: string|null, step?: number|string|null, axis?: string|null, session_id?: string|null}} [p]
 *  @param {{path?: string, now?: Date}} [opts]
 *  @returns {{ok:true,row:any}|{ok:false,why:string}} */
export function write(p = {}, { path = LEDGER, now = new Date() } = {}) {
  const concept = String((p && p.concept) || "").trim().toLowerCase();
  const question = String((p && p.question) || "").replace(/\s+/g, " ").trim();
  const stepRaw = p ? p.step : null;
  const step = stepRaw === null || stepRaw === undefined || stepRaw === "" ? null
    : (/^\d+$/.test(String(stepRaw).trim()) ? Number(String(stepRaw).trim()) : NaN);
  const axis = p && p.axis !== null && p.axis !== undefined && p.axis !== "" ? String(p.axis).trim().toLowerCase() : null;
  const session_id = p && typeof p.session_id === "string" && p.session_id.trim() ? p.session_id.trim() : null;
  if (!concept) return { ok: false, why: "a pointer names its concept (--concept)" };
  if (!question) return { ok: false, why: "a pointer is the exact unanswered micro-question — an empty one is the old fallback in disguise" };
  if (question.length > QUESTION_MAX) return { ok: false, why: `the question is ${question.length} chars — one clause (at most ${QUESTION_MAX}); a paragraph is a re-teach, not a pointer` };
  if (step !== null && !(Number.isInteger(step) && step >= 0 && step <= STEP_MAX)) return { ok: false, why: `step is 0-${STEP_MAX} or absent (${stepRaw})` };
  if (axis !== null && !AXES.includes(axis)) return { ok: false, why: `axis is a-i or absent (${p.axis})` };
  const row = { v: 1, kind: "written", id: newId("p", now), written_at: now.toISOString(), concept, step, axis, question, session_id };
  const w = appendChecked(path, row);
  return w.ok ? { ok: true, row } : { ok: false, why: w.why };
}

/** latest — READ-ONLY, never throws: the open pointer (for `concept`, or the newest across concepts), with
 *  the newest written row and the consumption that names it, so a reader can say WHY there is none.
 *  @param {{path?: string, concept?: string|null}} [opts] */
export function latest({ path = LEDGER, concept = null } = {}) {
  let rows;
  try { rows = readRows(path); } catch (e) { return { pointer: null, newest: null, consumed: null, why: "ledger-unreadable", detail: String((e && e.message) || e).slice(0, 160) }; }
  const st = pointerState(rows, { concept });
  return { pointer: st.open, newest: st.newest, consumed: st.consumed, why: st.open ? "open" : (st.newest ? "already-consumed" : "no-pointer") };
}

/** consume — an OPEN consumes the open pointer by APPENDING one consumed row naming it. No open pointer ⇒
 *  NOTHING is written and the answer says why; a second consume of one pointer finds it no longer open.
 *  @param {{concept?: string|null, by?: string}} [q] @param {{path?: string, now?: Date}} [opts]
 *  @returns {{ok:true,wrote:true,pointer:any,row:any}|{ok:false,wrote:false,why:string,pointer:null,newest?:any,consumed?:any}} */
export function consume({ concept = null, by = "cli" } = {}, { path = LEDGER, now = new Date() } = {}) {
  let rows;
  try { rows = readRows(path); } catch (e) { return { ok: false, wrote: false, pointer: null, why: `ledger-unreadable (${String((e && e.message) || e).slice(0, 120)}) — nothing consumed` }; }
  const st = pointerState(rows, { concept });
  if (!st.open) {
    return { ok: false, wrote: false, pointer: null, newest: st.newest, consumed: st.consumed,
      why: st.newest ? `already-consumed — the newest pointer${concept ? ` for '${String(concept).toLowerCase()}'` : ""} (${st.newest.id}) was consumed at ${st.consumed.consumed_at} by ${st.consumed.by || "?"}; a second consume of one pointer writes nothing`
        : `no-pointer — no pointer was ever written${concept ? ` for '${String(concept).toLowerCase()}'` : ""}; nothing to consume` };
  }
  if (!(Date.parse(st.open.written_at) <= now.getTime())) {
    return { ok: false, wrote: false, pointer: null, why: `written-after-now — pointer ${st.open.id} is dated ${st.open.written_at}, after this open; a consumption must follow the pointer it names` };
  }
  const row = { v: 1, kind: "consumed", id: newId("c", now), of: st.open.id, consumed_at: now.toISOString(), by: String(by || "cli").slice(0, 80) };
  const w = appendChecked(path, row);
  return w.ok ? { ok: true, wrote: true, pointer: st.open, row } : { ok: false, wrote: false, pointer: null, why: w.why };
}

/** describe — one line for a written pointer, the same words at every door. */
export const describe = (p) => `${p.concept}${p.axis ? ` · axis ${p.axis}` : ""}${p.step !== null && p.step !== undefined ? ` · step ${p.step}` : ""} · written ${p.written_at} (IST ${istDay(p.written_at)}) · "${p.question}"`;

// ---------------------------------------------------------------------------
// SELFTEST — every path under tmpdir(), never dressing-room/state (a test that reads his day is not a test)
// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (d, c) => { if (c) { pass++; console.log("  ✓ " + d); } else { fail++; console.log("  ✗ " + d); } };
  const dir = mkdtempSync(join(tmpdir(), "resume-pointer-"));
  const P = (n) => join(dir, n);
  const bytes = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);
  const T = (min) => new Date(Date.parse("2026-10-06T03:00:00.000Z") + min * 60000);   // 08:30 IST on 6 Oct
  try {
    // ── WRITE ──────────────────────────────────────────────────────────────
    const L1 = P("w.jsonl");
    const w1 = write({ concept: "Tokenization", step: 3, axis: "a", question: "  token ka id   kaun deta hai — tokenizer ya model? ", session_id: "forge:2026-10-06T02:00:00.000Z" }, { path: L1, now: T(0) });
    const r1 = readRows(L1);
    assert("WRITE — one written row: v 1, kind written, its own id, written_at ISO, the concept lowercased, step, axis, the question whitespace-collapsed, the session id",
      w1.ok && r1.length === 1 && r1[0].v === 1 && r1[0].kind === "written" && /^p-/.test(r1[0].id) && r1[0].written_at === T(0).toISOString()
      && r1[0].concept === "tokenization" && r1[0].step === 3 && r1[0].axis === "a" && r1[0].question === "token ka id kaun deta hai — tokenizer ya model?"
      && r1[0].session_id === "forge:2026-10-06T02:00:00.000Z" && !("consumed_at" in r1[0]));
    const before1 = bytes(L1);
    const refusals = [
      write({ concept: "tokenization", question: "   " }, { path: L1, now: T(1) }),
      write({ concept: "tokenization", question: "x".repeat(QUESTION_MAX + 1) }, { path: L1, now: T(1) }),
      write({ concept: "", question: "q" }, { path: L1, now: T(1) }),
      write({ concept: "tokenization", question: "q", axis: "z" }, { path: L1, now: T(1) }),
      write({ concept: "tokenization", question: "q", step: 12 }, { path: L1, now: T(1) }),
      write({ concept: "tokenization", question: "q", step: "3a" }, { path: L1, now: T(1) }),
    ];
    assert("WRITE REFUSES — an empty question, a paragraph, no concept, a bad axis, a step out of 0-11 or not a number: each ok:false with its why, and the ledger is byte-identical",
      refusals.every((r) => r.ok === false && typeof r.why === "string" && r.why.length > 0) && bytes(L1) === before1);
    // A FAILED APPEND — the ledger's directory is a FILE, so mkdir/append must fail
    writeFileSync(P("blocker"), "a file, not a directory");
    const wf = write({ concept: "tokenization", question: "q" }, { path: join(P("blocker"), "resume_pointer.jsonl"), now: T(2) });
    assert("A FAILED APPEND IS ok:false — never a bare catch that reports ok (the path under a FILE cannot be written; the answer carries the why)",
      wf.ok === false && /append failed/.test(wf.why) && !("row" in wf));

    // ── LATEST (read-only) ─────────────────────────────────────────────────
    const lt = latest({ path: L1, concept: "tokenization" });
    assert("LATEST — the newest written pointer for the concept, why 'open'; READ-ONLY: the ledger is byte-identical after it",
      lt.pointer && lt.pointer.id === r1[0].id && lt.why === "open" && bytes(L1) === before1);
    assert("LATEST never throws and says why: a missing ledger is 'no-pointer', another concept's pointer is not this concept's",
      latest({ path: P("absent.jsonl") }).why === "no-pointer" && latest({ path: L1, concept: "embeddings" }).pointer === null
      && !existsSync(P("absent.jsonl")));

    // ── CONSUME APPENDS (CLASS A) ──────────────────────────────────────────
    const pre = bytes(L1);
    const c1 = consume({ concept: "tokenization", by: "forge_session resume" }, { path: L1, now: T(30) });
    const post = bytes(L1);
    const r2 = readRows(L1);
    assert("CONSUME APPENDS, NEVER REWRITES (CLASS A) — the ledger before the consume is a byte-prefix of the ledger after it, the written row is byte-identical, the new last row is kind consumed with of = the written id, consumed_at ISO and by; no row carries both written_at and consumed_at",
      c1.ok && c1.wrote && post.startsWith(pre) && post.length > pre.length && r2.length === 2
      && JSON.stringify(r2[0]) === JSON.stringify(r1[0])
      && r2[1].v === 1 && r2[1].kind === "consumed" && /^c-/.test(r2[1].id) && r2[1].of === r1[0].id && r2[1].consumed_at === T(30).toISOString()
      && r2[1].by === "forge_session resume" && !("written_at" in r2[1])
      && r2.every((x) => !("written_at" in x && "consumed_at" in x)));
    assert("CONSUME hands back the pointer it consumed, so the open can say the question first",
      c1.pointer && c1.pointer.question === r1[0].question && c1.row && c1.row.of === c1.pointer.id);

    // ── A SECOND CONSUME OF ONE POINTER WRITES NOTHING ─────────────────────
    const pre2 = bytes(L1);
    const c2 = consume({ concept: "tokenization", by: "forge_session start" }, { path: L1, now: T(40) });
    assert("A SECOND CONSUME OF ONE POINTER WRITES NOTHING — ok:false, wrote:false, why already-consumed naming the first consumption, and the ledger is byte-identical",
      c2.ok === false && c2.wrote === false && /^already-consumed/.test(c2.why) && c2.why.includes(r1[0].id) && bytes(L1) === pre2 && readRows(L1).length === 2);
    assert("…and LATEST agrees: no open pointer, why already-consumed, the consumption named",
      (() => { const l = latest({ path: L1, concept: "tokenization" }); return l.pointer === null && l.why === "already-consumed" && l.consumed && l.consumed.of === r1[0].id; })());

    // ── NO OPEN POINTER WRITES NOTHING AND SAYS SO ─────────────────────────
    const L0 = P("empty.jsonl");
    const c0 = consume({ concept: "tokenization" }, { path: L0, now: T(5) });
    assert("A CONSUME WITH NO OPEN POINTER WRITES NOTHING AND SAYS SO — no ledger, no file created; why no-pointer",
      c0.ok === false && c0.wrote === false && /^no-pointer/.test(c0.why) && !existsSync(L0));

    // ── ONE OPEN POINTER PER CONCEPT ───────────────────────────────────────
    const L2 = P("many.jsonl");
    const a1 = write({ concept: "tokenization", step: 3, axis: "a", question: "q-a" }, { path: L2, now: T(0) });
    const e1 = write({ concept: "embeddings", step: 3, axis: "c", question: "q-emb" }, { path: L2, now: T(1) });
    const a2 = write({ concept: "tokenization", step: 3, axis: "b", question: "q-b" }, { path: L2, now: T(2) });
    const ca = consume({ concept: "tokenization", by: "t" }, { path: L2, now: T(3) });
    assert("ONE OPEN POINTER PER CONCEPT — a newer write supersedes an older one: the open consumes the NEWEST (q-b), and the older (q-a) never resurfaces after it",
      a1.ok && e1.ok && a2.ok && ca.ok && ca.pointer.question === "q-b"
      && latest({ path: L2, concept: "tokenization" }).pointer === null && consume({ concept: "tokenization", by: "t" }, { path: L2, now: T(4) }).wrote === false);
    assert("…and another concept's pointer is untouched by it (embeddings still open; with no concept, LATEST is the newest written row across concepts)",
      latest({ path: L2, concept: "embeddings" }).pointer && latest({ path: L2, concept: "embeddings" }).pointer.id === e1.row.id
      && latest({ path: L2 }).newest.id === a2.row.id && latest({ path: L2 }).pointer === null);

    // ── LAWFUL ORDER ───────────────────────────────────────────────────────
    const L3 = P("order.jsonl");
    write({ concept: "tokenization", question: "q-future" }, { path: L3, now: T(60) });
    const pre3 = bytes(L3);
    const early = consume({ concept: "tokenization" }, { path: L3, now: T(10) });
    assert("A CONSUMPTION FOLLOWS THE POINTER IT NAMES — an open dated before the pointer is refused (written-after-now) and writes nothing",
      early.ok === false && /^written-after-now/.test(early.why) && bytes(L3) === pre3);
    assert("…and a lawful one is dated at or after the written_at it names (the witness's CLASS A order)",
      (() => { const ok = consume({ concept: "tokenization" }, { path: L3, now: T(60) }); return ok.ok && Date.parse(ok.row.consumed_at) >= Date.parse(ok.pointer.written_at); })());

    // ── A TORN TAIL ────────────────────────────────────────────────────────
    const L4 = P("torn.jsonl");
    writeFileSync(L4, JSON.stringify({ v: 1, kind: "written", id: "p-old", written_at: T(0).toISOString(), concept: "tokenization", step: 1, axis: null, question: "old", session_id: null }) + "\n{\"v\":1,\"kind\":\"writ");
    const wt = write({ concept: "tokenization", question: "after the tear" }, { path: L4, now: T(5) });
    assert("A TORN TAIL never glues a new row onto it — the write starts a fresh line, the torn line is skipped by the reader, never fatal",
      wt.ok && readRows(L4).length === 2 && readRows(L4)[1].question === "after the tear" && latest({ path: L4, concept: "tokenization" }).pointer.id === wt.row.id);

    // ── IST, NEVER UTC ─────────────────────────────────────────────────────
    assert("EVERY DAY KEY IS IST (Asia/Kolkata) — 18:40Z on 5 Oct is 00:10 IST on 6 Oct; 18:20Z is 23:50 IST on 5 Oct (the UTC slice would call both 5 Oct)",
      istDay("2026-10-05T18:40:00.000Z") === "2026-10-06" && istDay("2026-10-05T18:20:00.000Z") === "2026-10-05"
      && "2026-10-05T18:40:00.000Z".slice(0, 10) === "2026-10-05" && istDay("not a time") === null);
    assert("TIMES ARE ISO — written_at and consumed_at round-trip through Date as the same instant",
      readRows(L1).every((r) => { const t = r.written_at || r.consumed_at; return new Date(t).toISOString() === t; }));

    // ── THE CONTRACT IN THIS FILE'S OWN WORDS ──────────────────────────────
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const head = src.slice(0, src.indexOf("\nimport "));
    assert("SOLE WRITER — the header says so in the organism's own words, and names both row kinds and the IST law",
      head.includes("SOLE WRITER of dressing-room/state/resume_pointer.jsonl") && head.includes('kind:"written"') && head.includes('kind:"consumed"') && /IST \(Asia\/Kolkata\)/.test(head));
    const dispatch = src.slice(src.indexOf("switch (" + "mode) {"));
    const verbs = [...dispatch.matchAll(/^ {4}case "([a-z]+)":/gm)].map((m) => m[1]);
    const modes = head.slice(head.indexOf("// MODES:"));
    assert("DISPATCH DOC WIRE — the CLI dispatches write · consume · latest · selftest, and every verb it accepts is named in the header MODES block",
      ["write", "consume", "latest", "selftest"].every((v) => verbs.includes(v)) && verbs.every((v) => modes.includes(v)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(`\nresume_pointer selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const flag = (argv, k) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? "") : null; };
function main() {
  const [mode, ...rest] = process.argv.slice(2);
  switch (mode) {
    case "write": {
      const r = write({ concept: flag(rest, "--concept"), question: flag(rest, "--question"), step: flag(rest, "--step"), axis: flag(rest, "--axis"), session_id: flag(rest, "--session") });
      if (!r.ok) { console.error(`resume_pointer: REFUSED — ${r.why} (nothing written)`); process.exitCode = 1; break; }
      console.log(`resume_pointer: WRITTEN ${r.row.id} · ${describe(r.row)}`);
      break;
    }
    case "consume": {
      const r = consume({ concept: flag(rest, "--concept") || null, by: flag(rest, "--by") || "cli" });
      if (!r.ok) { console.log(`resume_pointer: nothing consumed — ${r.why} (nothing written)`); process.exitCode = 1; break; }
      console.log(`resume_pointer: CONSUMED ${r.pointer.id} (row ${r.row.id}, by ${r.row.by}) · ${describe(r.pointer)}`);
      break;
    }
    case "latest": {
      const l = latest({ concept: flag(rest, "--concept") || null });
      if (rest.includes("--json")) { console.log(JSON.stringify(l, null, 2)); break; }
      if (l.pointer) console.log(`resume_pointer: OPEN ${l.pointer.id} · ${describe(l.pointer)}`);
      else if (l.why === "already-consumed") console.log(`resume_pointer: no open pointer — the newest (${l.newest.id}) was consumed at ${l.consumed.consumed_at} by ${l.consumed.by || "?"}`);
      else console.log(`resume_pointer: no open pointer — ${l.why === "ledger-unreadable" ? `the ledger could not be read (${l.detail})` : "none was ever written"}`);
      break;
    }
    case "selftest": selftest(); break;
    default:
      console.log('resume_pointer: write --concept <c> --question "<q>" [--step <0-11>] [--axis <a-i>] [--session <id>] | consume [--concept <c>] [--by <who>] | latest [--concept <c>] [--json] | selftest');
      if (mode) process.exitCode = 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
