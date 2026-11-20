#!/usr/bin/env node
// ============================================================================
// scripts/parked.mjs · ARSENAL AI FC — THE PARK LEDGER (unit mprk · forks rows 1173 (3) / 1190)
// ----------------------------------------------------------------------------
//   SOLE WRITER of dressing-room/state/parked.jsonl (gitignored — his words verbatim). Writes NOTHING else.
// ----------------------------------------------------------------------------
// WHAT: before this file a park was a sentence in a teacher reply ("naam lo, park karo, micro-question
//   wapas" — HOW_HE_LEARNS #12). Two lanes could KEEP its words (MCP `note`, the act tail's `note`), and
//   neither ever brought them back at an anchor or ever closed them: an item came back only if HE raised
//   it again — the design failure his own law names ("jo cheez use yaad rakhni pade, woh ek DESIGN
//   FAILURE hai"). Spec: ci/mprk/MPRK_SPEC.md @ 5e604bc (branch claude/mprk-spec); rulings row 1190.
// THE FLOW (no new act of his):
//   · WRITE — ONE door (row 1190 F4 a): the act lane's `park` verb. The teacher ends the reply that parks
//     the item with `<<ACT {"acts":[{"verb":"park","args":{"text":"<his words>"}}]}>>`; turn_hook stop →
//     acts stop spawns `parked.mjs add --door act --act <act id>` with his words on STDIN (never shell
//     quoting). The study rail is a PreToolUse rail and is never crossed: no tool call mid-concept.
//   · RETURN — captains_call.mjs source 6 reads openParks() READ-ONLY and mints ONE card per open park
//     (key `park:<id>`); the deck's ladder deals at most one card per anchor, rests a card dealt today,
//     and is silent while a fresh forge session is open (dealGuard). Rank 0, beside hand-filed (F1 a).
//   · CLOSE — only a close row closes a park: his haan / na on its card (captains_call runs `close`),
//     the act's undo (`acts.mjs undo <id>` → `close --by undo`), or at-source. baad never closes it, and
//     neither does time. Nothing expires; nothing is deleted or rewritten (L9).
// LEDGER (append-only, two row kinds):
//     {v:1, ev:"park",  id, ts, text, concept, axis, step, door, act, why}
//     {v:1, ev:"close", id, ts, by, why}          by ∈ haan | na | undo | at-source
//   A park is OPEN while no close row names its id. A second close of one id writes nothing.
//   `concept` / `axis` / `step` are READ-ONLY stamps from forge_session.json (forge_session.mjs is its
//   SOLE WRITER): its `concept`, `current_axis`, `step` — null for all three outside a session, or when
//   the session is closed or stale (the owner's own isStale predicate, imported, never re-derived).
// F5 (row 1190 (2)) — SAMJHAO's close-time parked LIST (samjhao:R91, "the close message includes the
//   parked list with reasons"). It ships (a): the list STAYS and reads from this owner (`close-list`).
//   (b) — the card surface SUPERSEDES the list, no list is shown — sits behind ONE switch,
//   LIST_SUPERSEDED_BY_CARDS, which is OFF. It is flipped only on HIS word, never by a session; on his
//   yes the SAMJHAO record's line is struck, not erased (that edit is the lander's, not this file's).
// F2 a: no backfill — the ledger starts empty; an import by pattern would be keyword routing.
// F6 a: the machine notices held back mid-lesson (turn_hook / learnstate "ORGANISM: N notice(s) parked")
//   are NOT his items and stay out of this unit — named here so they are not lost.
// SEAM: ARSENAL_PARKED_STATE_DIR — the selftest's and the witness's ONLY (the ARSENAL_CALL_STATE_DIR shape).
// No LLM, no key, no network: imports no http/net/fetch and posts nothing (not a `posts` verb).
// MODES: add [--door <d>] [--act <id>] [--why "…"]   (his words on stdin)
//        · close <id> --by <haan|na|undo|at-source> [--why "…"] · status · json · close-list · selftest
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isStale as forgeIsStale } from "./forge_session.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = process.env.ARSENAL_PARKED_STATE_DIR || join(__dirname, "..", "dressing-room", "state");
export const LEDGER = join(STATE_DIR, "parked.jsonl");            // this organ's ONE file (a module-level const so xray can resolve the sink)
const FORGE = join(STATE_DIR, "forge_session.json");               // READ-ONLY here; forge_session.mjs is its SOLE WRITER
export const CLOSE_BY = Object.freeze(["haan", "na", "undo", "at-source"]);
// F5 · THE ONE SWITCH (row 1190 (2)). OFF = (a): the close-time list stays, read from this owner.
// ON = (b): the card surface supersedes the list. Flipped only on his word — never by a session.
export const LIST_SUPERSEDED_BY_CARDS = false;

const ledgerOf = (dir) => (dir ? join(dir, "parked.jsonl") : LEDGER);
const forgeOf = (dir) => (dir ? join(dir, "forge_session.json") : FORGE);
const one = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const newId = (now) => `pk${now.getTime().toString(36)}${randomBytes(3).toString("hex")}`;
const isPark = (r) => !!r && r.ev === "park" && typeof r.id === "string" && r.id !== "" && typeof r.text === "string";
const isClose = (r) => !!r && r.ev === "close" && typeof r.id === "string" && r.id !== "" && CLOSE_BY.includes(r.by);

/** readRows(dir) → every parseable row, in order; an absent ledger is [] (no parks), never an error. */
export function readRows(dir = null) {
  const p = ledgerOf(dir);
  if (!existsSync(p)) return [];
  const out = [];
  for (const l of readFileSync(p, "utf8").split(/\r?\n/)) {
    if (!l.trim()) continue;
    try { out.push(JSON.parse(l)); } catch { /* a torn line is skipped, never fatal: the next append still lands */ }
  }
  return out;
}
/** fold(rows) → {parks: Map id→park, closes: Map id→first close} — PURE. */
export function fold(rows) {
  const parks = new Map(), closes = new Map();
  for (const r of rows || []) {
    if (isPark(r) && !parks.has(r.id)) parks.set(r.id, r);
    else if (isClose(r) && !closes.has(r.id)) closes.set(r.id, r);
  }
  return { parks, closes };
}
/** openParks(dir) → the open parks, oldest first (a park no close row names). Read-only. */
export function openParks(dir = null) {
  const { parks, closes } = fold(readRows(dir));
  return [...parks.values()].filter((p) => !closes.has(p.id)).sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
}
/** closedIds(dir) → the ids a close row names (the POSITIVE reading a retire-at-source needs). */
export function closedIds(dir = null) { return new Set(fold(readRows(dir)).closes.keys()); }
/** parkById(dir, id) → {park, close} | null. */
export function parkById(dir, id) {
  const { parks, closes } = fold(readRows(dir));
  const p = parks.get(String(id));
  return p ? { park: p, close: closes.get(p.id) || null } : null;
}

/** stampOf(forge, now) → {concept, axis, step}: the live session's stamps, or nulls (PURE). */
export function stampOf(forge, now = new Date()) {
  if (!forge || typeof forge !== "object" || !forge.concept || forge.closed_at || forgeIsStale(forge, now)) return { concept: null, axis: null, step: null };
  return { concept: String(forge.concept), axis: forge.current_axis ?? null, step: Number.isInteger(forge.step) ? forge.step : null };
}
const readForge = (dir) => { try { return JSON.parse(readFileSync(forgeOf(dir), "utf8")); } catch { return null; } };

function append(dir, row) {
  const p = ledgerOf(dir);
  mkdirSync(dirname(p), { recursive: true });
  appendFileSync(p, JSON.stringify(row) + "\n");
  // read back before ok is said (the resume_pointer rule): an append nobody can read is not a park
  const back = readRows(dir).some((r) => r && r.ev === row.ev && r.id === row.id && r.ts === row.ts);
  return back;
}

/** addPark(dir, {text, door, act, why}, now) → {ok, id?, why?} */
export function addPark(dir, { text = "", door = "cli", act = null, why = null } = {}, now = new Date()) {
  const t = String(text == null ? "" : text).replace(/(\r?\n)+$/, "");
  if (!t.trim()) return { ok: false, why: "no words — a park carries his words verbatim (stdin)" };
  const st = stampOf(readForge(dir), now);
  const row = { v: 1, ev: "park", id: newId(now), ts: now.toISOString(), text: t, ...st, door: one(door) || "cli", act: act ? one(act) : null, why: why ? one(why) : null };
  try { if (!append(dir, row)) return { ok: false, why: "the park row did not read back off the ledger" }; }
  catch (e) { return { ok: false, why: `append failed: ${one(e && e.message)}` }; }
  return { ok: true, id: row.id, row };
}
/** closePark(dir, id, {by, why}, now) → {ok, changed, why?} — a second close writes nothing. */
export function closePark(dir, id, { by = "", why = null } = {}, now = new Date()) {
  if (!CLOSE_BY.includes(by)) return { ok: false, changed: false, why: `--by must be one of ${CLOSE_BY.join("|")}` };
  const hit = parkById(dir, id);
  if (!hit) return { ok: false, changed: false, why: `no park ${id}` };
  if (hit.close) return { ok: true, changed: false, why: `park ${id} already closed (${hit.close.by} at ${hit.close.ts}) — nothing written`, park: hit.park };
  const row = { v: 1, ev: "close", id: hit.park.id, ts: now.toISOString(), by, why: why ? one(why) : null };
  try { if (!append(dir, row)) return { ok: false, changed: false, why: "the close row did not read back off the ledger" }; }
  catch (e) { return { ok: false, changed: false, why: `append failed: ${one(e && e.message)}` }; }
  return { ok: true, changed: true, park: hit.park, row };
}

/** closeListLines(open, forge, superseded) → the SAMJHAO close report's parked block (PURE; F5). */
export function closeListLines(open, forge, superseded = LIST_SUPERSEDED_BY_CARDS) {
  const since = forge && typeof forge.started_at === "string" ? forge.started_at : null;
  const mine = (open || []).filter((p) => !since || String(p.ts) >= since);
  if (superseded) return [`parked: no list (F5 b) — each open park returns as ONE Captain's Call card at his next anchor (${(open || []).length} open)`];
  if (!mine.length) return [`parked: none${since ? " this session" : ""}`];
  return [`parked (${mine.length})${since ? " this session" : ""} — each also returns as a card at his next anchor:`,
    ...mine.map((p) => `  · "${p.text}"${p.concept ? ` (${p.concept}${p.axis ? ` · axis ${p.axis}` : ""})` : ""}${p.why ? ` — ${p.why}` : ""}`)];
}
/** statusLine(dir, now) → ONE line (L10). */
export function statusLine(dir = null, now = new Date()) {
  const rows = readRows(dir), { parks, closes } = fold(rows);
  const open = [...parks.values()].filter((p) => !closes.has(p.id)).sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  const age = open.length ? Math.max(0, (now - Date.parse(open[0].ts)) / 36e5) : null;
  return `parked: ${open.length} open · ${closes.size} closed${age != null ? ` · oldest open ${age.toFixed(1)} h` : ""}`;
}

// ── SELFTEST — a scratch dir only; the live ledger untouched ──
function selftest() {
  let pass = 0, fail = 0;
  const check = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };
  console.log("=== parked.mjs selftest — a park is kept verbatim, returns as a card, and closes only on a close row ===\n");
  const dir = mkdtempSync(join(tmpdir(), "parked-st-"));
  try {
    const T = new Date("2026-11-20T06:00:00.000Z");
    check("an absent ledger is zero parks, not an error", openParks(dir).length === 0 && statusLine(dir, T) === "parked: 0 open · 0 closed");
    check("empty words are refused and nothing is written", !addPark(dir, { text: "  \n" }, T).ok && !existsSync(ledgerOf(dir)));
    const words = "yeh  tokenizer wala tool baad mein dekhna — \"quotes\" bhi";
    const a = addPark(dir, { text: words + "\n", door: "act", act: "a1" }, T);
    check("add keeps his words byte-for-byte (only the trailing newline goes)", a.ok && parkById(dir, a.id).park.text === words, JSON.stringify(a));
    check("outside a session the stamps are null", a.row.concept === null && a.row.axis === null && a.row.step === null);
    writeFileSync(forgeOf(dir), JSON.stringify({ concept: "embeddings", step: 3, current_axis: "c", started_at: T.toISOString(), updated_at: T.toISOString() }));
    const b = addPark(dir, { text: "notes ka format", why: "system talk mid-axis" }, new Date(T.getTime() + 60000));
    check("inside a fresh session the stamps are the session's concept / current_axis / step", b.ok && b.row.concept === "embeddings" && b.row.axis === "c" && b.row.step === 3);
    const forgeBytes = readFileSync(forgeOf(dir), "utf8");
    check("a stale session stamps nothing", stampOf(JSON.parse(forgeBytes), new Date(T.getTime() + 30 * 36e5)).concept === null);
    check("a closed session stamps nothing", stampOf({ ...JSON.parse(forgeBytes), closed_at: T.toISOString() }, T).concept === null);
    check("two open, oldest first", openParks(dir).map((p) => p.id).join() === [a.id, b.id].join());
    check("close refuses an unknown --by", !closePark(dir, a.id, { by: "later" }).ok);
    check("close refuses an unknown id", !closePark(dir, "pk-nope", { by: "na" }).ok);
    const c1 = closePark(dir, a.id, { by: "haan" }, T);
    check("close by haan writes ONE close row", c1.ok && c1.changed && parkById(dir, a.id).close.by === "haan");
    const n = readRows(dir).length;
    const c2 = closePark(dir, a.id, { by: "na" }, T);
    check("a second close writes nothing and keeps the first word", c2.ok && !c2.changed && readRows(dir).length === n && parkById(dir, a.id).close.by === "haan");
    check("open = the one no close row names; closedIds names the closed one", openParks(dir).length === 1 && openParks(dir)[0].id === b.id && closedIds(dir).has(a.id) && !closedIds(dir).has(b.id));
    check("the ledger only grows: park, park, close (append-only)", readRows(dir).map((r) => r.ev).join() === "park,park,close");
    check("the forge session file is never written by this organ", readFileSync(forgeOf(dir), "utf8") === forgeBytes);
    const f = JSON.parse(forgeBytes);
    const la = closeListLines(openParks(dir), f, false), lb = closeListLines(openParks(dir), f, true);
    check("F5 (a) switch OFF: the close list names this session's park with its reason", la.length === 2 && la[1].includes("\"notes ka format\"") && la[1].includes("system talk mid-axis"), la.join(" | "));
    check("F5 (b) switch ON: one line, no list, the card surface named", lb.length === 1 && /no list \(F5 b\)/.test(lb[0]) && !lb[0].includes("notes ka format"));
    check("F5 ships (a): the switch is OFF", LIST_SUPERSEDED_BY_CARDS === false);
    check("status is ONE line naming open, closed and the oldest open age", /^parked: 1 open · 1 closed · oldest open \d/.test(statusLine(dir, new Date(T.getTime() + 36e5))));
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    check("no network: no http / net / fetch import, nothing posted", !/from\s+["']node:(?:https?|net|dgram)["']/.test(src) && !/\bfetch\(/.test(src.replace(/\/\/.*$/gm, "")));
  } finally { try { rmSync(dir, { recursive: true, force: true }); } catch { /* the OS reaps a held temp file */ } }
  console.log(`\nparked selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

// ── CLI ──
function main() {
  const mode = (process.argv[2] || "status").toLowerCase();
  const flag = (n) => { const i = process.argv.indexOf("--" + n); const v = i > 0 ? process.argv[i + 1] : undefined; return v === undefined || String(v).startsWith("--") ? null : v; };
  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }
  if (mode === "add") {
    let text = ""; try { text = readFileSync(0, "utf8"); } catch { text = ""; }
    const r = addPark(null, { text, door: flag("door") || "cli", act: flag("act"), why: flag("why") });
    if (!r.ok) { console.error(`parked: not parked — ${r.why}`); process.exit(1); }
    console.log(JSON.stringify({ ok: true, id: r.id, concept: r.row.concept, axis: r.row.axis, open: openParks().length }));
    return;
  }
  if (mode === "close") {
    const r = closePark(null, process.argv[3], { by: flag("by") || "", why: flag("why") });
    if (!r.ok) { console.error(`parked: not closed — ${r.why}`); process.exit(1); }
    console.log(r.changed ? `parked: closed ${r.park.id} by ${r.row.by} — "${one(r.park.text)}"` : `parked: ${r.why}`);
    return;
  }
  if (mode === "status") { console.log(statusLine()); return; }
  if (mode === "json") { const { parks, closes } = fold(readRows()); console.log(JSON.stringify({ open: openParks(), parks: [...parks.values()], closes: [...closes.values()], list_superseded_by_cards: LIST_SUPERSEDED_BY_CARDS })); return; }
  if (mode === "close-list") { for (const l of closeListLines(openParks(), readForge(null))) console.log(l); return; }
  console.log("parked: add [--door d --act id --why …] (words on stdin) | close <id> --by <haan|na|undo|at-source> [--why …] | status | json | close-list | selftest");
  process.exit(2);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
