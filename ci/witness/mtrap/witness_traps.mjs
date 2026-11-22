#!/usr/bin/env node
// ============================================================================
// ci/witness/mtrap/witness_traps.mjs — UNIT mtrap · THE BAR OF THREE DISTINCT TRAPS, CLAUSE BY CLAUSE, BY PLANTS
//   (spec ci/mtrap/MTRAP_SPEC.md on claude/mtrap-spec @ ed6402d §4; ruling forks row 1230 — where they differ the ruling
//    wins, and ci/mtrap/PROOF.md names each difference)
// ----------------------------------------------------------------------------
// USAGE
//   node ci/witness/mtrap/witness_traps.mjs plants [--tree <dir>] [--base-tree <dir>] [--only <id,…>] [--tmp <dir>]
//   --tree       the tree under test (default: this file's repository). Its scripts/ are COPIED for every plant.
//   --base-tree  the base tree (a git-archive of the unit's BASE). W1 (traps deep-equal), W2 (exit equal), W5 (every other
//                contract line equal), W7 (verdicts equal) and W9 (the base PASSES the capsule plant) read it; without it
//                those halves are not run, and each clause says so on its own line.
//   --tmp        an existing dir to plant under (the unit witness ci/mtrap/witness_mtrap.mjs hands its own, for LAST).
// CONTRACT
//   · Every plant is a COPY under os.tmpdir(): <tree>/scripts + package.json, node_modules linked, and a planted
//     dressing-room/state, archive and lanes written by THIS file's node code (writeFileSync; the archive through the
//     copy's own archivist writer). Nothing of his state is read but the TREE's TRACKED registry.json (learnstate's import
//     graph needs its lanes; ci/witness/mmeter/plant_day.mjs's precedent), parsed and re-written into the plant, never printed. The compiler is imported from the
//     copy and handed planted paths; the pacer, glance, status and the C22 read run as CHILDREN on the copy (spawnSync).
//   · The reader is the compiler's own stub (or a counting wrapper of it); no ARSENAL_* variable reaches a child unless
//     this file sets it to a path under the temp dir (ARSENAL_ARCHIVE, the planted archive), and the PATH carries a shim
//     for `claude` and `gemini` that refuses: no live model call can happen here.
//   · THE PORT CLASS (row 1053): no port is bound, no service is named, nothing is POSTed, nothing restarts; no network.
//     Every wait is a spawnSync that ends with its child; the outer bound is the caller's (the suite member's own
//     timeout-minutes). No timeout, budget or size is typed here.
//   · CRLF-proof: every read splits on \r?\n and strips a BOM; no POSIX-only shell; no git repo is planted.
// THE CLAUSES (each RED on base 5301f15, GREEN on the build). A THIN LESSON = an archived lesson whose teacher turns
//   carry two ```diff blocks (two crack traps), compiled by the copy's own compileDay.
//   W1 THIN      compile a thin lesson, gate it with a COUNTING reader: the reader is called 0 times, the result is op
//                not-gateable with have 2 · need 3 · owed 1 naming concept, axis and note id, no cold_gate row; the compiled
//                row is there, and (base tree) its note.traps deep-equal the base's compile of the same lesson
//   W2 CLI       the thin lesson through `notes_compiler.mjs fulltime --date D --stub --no-archive-run`: a stderr
//                not-gateable line, the summary's `1 not gateable`; (base tree) the exit equals the base's for the same plant
//   W3 DISTINCT  three diffs, two whose `-` lines fold equal; and a `+`-only diff (placeholder bait) plus two real ones:
//                both refused with have 2, the reader never called
//   W4 BAR       three distinct diffs: gateableOf exported and gateable, the reader called ONCE, one gate row written
//   W5 DOOR      an open pacer session (concept tokenization, step 3, axis a ON) with a thin live note of (tokenization, a)
//                on the ledger: `contract`'s axes line carries `note a: 2/3 traps — 1 trap owed`; (base tree) every other
//                contract line, and the axes line with that fragment taken out, equal the base's
//   W6 OLD       five 2-trap compiled rows (two of them superseded), each with a kept FAIL row: `gate --stub` per day,
//                `glance`, `status`, and C22 (askedFirst) — the ledger byte-identical after, glance NOT GATEABLE … kept
//                FAIL <id>, status names the live not-gateable notes, C22 counts `not gateable 5`
//   W7 TABLE     TRAP_BAR exported = 3; verdictOf over a fixed table of notes × replies gives the table's verdicts, and
//                (base tree) the base verdictOf's on the same table — the bar is not loosened
//   W8 TRUE      three five-trap notes with kept FAIL rows: glance `gate FAIL`, C22 counts `fail 3 · not gateable 0`
//   W9 CAPSULE   (row 1230 mtrap-3 b) a lesson with two diffs and a capsule holding ONE trap (its third trap is a capsule
//                trap): the build REFUSES it (have 2), and (base tree) the base's stub gate PASSES the same plant
//   SKILL        (mtrap-10 b) .claude/skills/forge/SKILL.md and .claude/skills/learn/SKILL.md each carry the trap-owed line
// OUTPUT: one `CLAUSE <id> GREEN|RED · <why>` line per clause, then `PLANTS mtrap · k of n plant(s) as expected` (exit 0
//   iff k === n).
// ============================================================================
import { mkdtempSync, mkdirSync, cpSync, symlinkSync, existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, dirname, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
if (argv[0] !== "plants") { console.log("witness_traps: usage — plants [--tree <dir>] [--base-tree <dir>] [--only <id,…>] [--tmp <dir>]"); process.exit(1); }
const TREE = resolve(arg("--tree") || join(HERE, "..", "..", "..")), BASE = arg("--base-tree") ? resolve(arg("--base-tree")) : null;
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const OWN_TMP = !arg("--tmp");
const TMP = arg("--tmp") ? mkdtempSync(join(resolve(arg("--tmp")), "traps-")) : mkdtempSync(join(tmpdir(), "mtrap-traps-"));
for (const k of Object.keys(process.env)) if (/^ARSENAL_/i.test(k)) delete process.env[k];

// the model shim: `claude` / `gemini` refuse on this PATH (the member's own shape)
const SHIM = join(TMP, "shim"); mkdirSync(SHIM);
for (const tool of ["claude", "gemini"]) {
  writeFileSync(join(SHIM, tool), "#!/bin/sh\necho \"REFUSED — no live model call in a witness (unit mtrap)\" >&2\nexit 1\n", { mode: 0o755 });
  writeFileSync(join(SHIM, `${tool}.cmd`), "@echo REFUSED — no live model call in a witness (unit mtrap) 1>&2\r\n@exit /b 1\r\n");
}
const ENV = (() => { const e = { ...process.env }; const pk = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH"; e[pk] = `${SHIM}${delimiter}${e[pk] || ""}`; return e; })();
const NM = [TREE, join(HERE, "..", "..", "..")].map((t) => join(t, "node_modules")).find((p) => existsSync(p)) || null;
const text = (p) => { try { return readFileSync(p, "utf8").replace(/^﻿/, ""); } catch { return null; } };
const sha = (p) => (existsSync(p) ? createHash("sha256").update(readFileSync(p)).digest("hex") : "absent");
const lines = (s) => String(s || "").split(/\r?\n/);
const fold = (s) => String(s || "").replace(/\s+/g, " ").trim();
const DAY = "2026-10-06";
const at = (m) => new Date(Date.UTC(2026, 9, 6, 4, 0, 0) + m * 60000).toISOString();   // 6 Oct 2026, 09:30 IST onwards
const NOGUARD = () => ({ ran: false, ok: true, why: "witness: the names guard is not under test" });
const H = "f1c7e000-0000-4000-8000-0000000000a1";

let seq = 0;
/** plant — a fresh copy of <tree>'s scripts under TMP with an empty planted state dir */
function plant(tree, name) {
  const dir = join(TMP, `${++seq}-${name}`);
  cpSync(join(tree, "scripts"), join(dir, "scripts"), { recursive: true });
  if (existsSync(join(tree, "package.json"))) cpSync(join(tree, "package.json"), join(dir, "package.json"));
  if (NM) symlinkSync(NM, join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const state = join(dir, "dressing-room", "state");
  mkdirSync(state, { recursive: true });
  writeFileSync(join(state, "concepts.json"), JSON.stringify({ concepts: { tokenization: { core_axes: ["d"] } } }) + "\n");
  // learnstate's import graph reads the registry's lanes at import (gate.mjs): the TREE's TRACKED registry.json is the one
  // thing of state copied (ci/witness/mmeter/plant_day.mjs's precedent) — parsed and re-written, never printed
  const reg = text(join(tree, "dressing-room", "state", "registry.json"));
  if (reg !== null) writeFileSync(join(state, "registry.json"), JSON.stringify(JSON.parse(reg)));
  const node = (script, args, extra = {}) => { const r = spawnSync(process.execPath, [join(dir, "scripts", script), ...args], { cwd: dir, env: { ...ENV, ...extra }, encoding: "utf8", windowsHide: true }); return { code: r.status, out: String(r.stdout || ""), err: String(r.stderr || "") }; };
  const ledger = join(state, "compiled_notes.jsonl");
  return { dir, state, node, ledger, imp: (f) => import(pathToFileURL(join(dir, "scripts", f)).href) };
}
/** lesson — an archived lesson on (tokenization, a) of DAY: teacher turns carrying `diffs` (each [galat lines, sahi lines]),
 *  his replies, the pacer's window, the sitting's host; archived by the copy's OWN archivist writer. Optional capsule. */
async function lesson(p, diffs, { capsule = null } = {}) {
  const arc = join(p.dir, "archive"), repo = join(p.dir, "repo"), lanes = join(repo, "dressing-room", "state");
  mkdirSync(lanes, { recursive: true });
  let ev = 0;
  const said = (m, t, source = "claude-code") => ({ event_id: `e${++ev}`, modality: "code", source, surface: "claude-code", session_id: H, text: t, tier: "private", moment: { forge_step: 3, forge_concept: "tokenization" }, v: 3, ts: at(m) });
  const words = [said(1, "[TECHNICAL LINE] A token is the unit of text a model reads.\n[EK CHECK] 'tokenization' kitne tokens?\npehle gut-word: knew · shaky · guessed", "claude-code-teaching"), said(2, "shaky — 1 token")];
  diffs.forEach(([g, s], i) => {
    const body = [...g.map((x) => `- ${x}`), ...s.map((x) => `+ ${x}`)].join("\n");
    words.push(said(3 + 2 * i, "```diff\n" + body + "\n```\nKahan atke? Apne shabdon mein batao.", "claude-code-teaching"), said(4 + 2 * i, `maine socha ${i + 1}, phir woh toot gaya`));
  });
  words.push(said(20, "Bolo — axis a apne shabdon mein, poora.", "claude-code-teaching"), said(21, "token woh tukda hai jo model ginta hai; 3 tukde, 12 letters"));
  writeFileSync(join(lanes, "afferent.jsonl"), words.map((r) => JSON.stringify(r)).join("\n") + "\n");
  writeFileSync(join(p.state, "forge_session.json"), JSON.stringify({ concept: "tokenization", started_at: at(0), updated_at: at(25), step: 3, axes_done: ["a"], axes_deferred: [],
    axes_now_at: { a: at(0.5) }, axes_marked_at: { a: { at: at(24), step: 3, jirah_before: 0 } }, current_axis: null }));
  writeFileSync(join(p.state, "sitting.json"), JSON.stringify({ id: "sit_w", opened_at: at(0), closed_at: null, host_session_id: H }));
  if (capsule) { mkdirSync(join(p.state, "capsules"), { recursive: true }); writeFileSync(join(p.state, "capsules", "tokenization.json"), JSON.stringify(capsule)); }
  const { initArchive, runArchive } = await p.imp("archivist.mjs");
  initArchive({ root: arc, repo, quiet: true, warn: () => {} });
  runArchive({ root: arc, repo, quiet: true, warn: () => {} });
  return { arc };
}
/** compile — the copy's own compileDay over the planted lesson */
async function compile(p, arc) {
  const nc = await p.imp("notes_compiler.mjs");
  const c = nc.compileDay({ date: DAY, stateDir: p.state, path: p.ledger, root: arc, correctionsPath: join(p.state, "notes_corrections.jsonl"), guard: NOGUARD, now: () => new Date(at(26)) });
  return { nc, c, rows: nc.readRows(p.ledger) };
}
/** gateCounting — the copy's own gateDay with a counting wrapper of its own stub reader */
async function gateCounting(p, nc) {
  let called = 0;
  const g = await nc.gateDay({ date: DAY, stateDir: p.state, path: p.ledger, guard: NOGUARD, now: () => new Date(at(27)),
    reader: async (n) => { called++; return { ok: true, reply: nc.stubReader(n), reader: "stub" }; } });
  return { g, called, rows: nc.readRows(p.ledger) };
}
const TWO = [[["ek word = ek token"], ["ek word kai tokens mein toot sakta hai"]], [["space token nahi hai"], ["space bhi token ka hissa hota hai"]]];
const trap = (from, bait, id) => ({ from, bait, truth: "t", id });
const noteOf = (traps) => ({ v: 1, concept: "tokenization", axis: "a", title: null, strike: { text: "A token is what?", from: "teacher check" }, weld: null, window: null,
  items: [{ mark: "N", kind: "bolo", at: at(5), rid: "r1", text: "his bolo" }, { mark: "T", kind: "technical_line", at: at(4), rid: "r2", text: "a line" }], bank: [], traps, corrections: [], gaps: [] });
const compiledRow = (id, day, axis, traps, extra = {}) => ({ v: 1, kind: "compiled", id, ts: `${day}T09:00:00.000Z`, day, concept: "tokenization", axis, compiler: "notes_compiler.mjs@1.0.0", sources: [`rid-${id}`], note: { ...noteOf(traps), axis }, content_sha: "0".repeat(64), ...extra });
const failRow = (id, of, day) => ({ v: 1, kind: "cold_gate", id, of, ts: `${day}T10:00:00.000Z`, day, verdict: "fail", traps_named: [], reader: "role:cold_reader/kept", role: "cold_reader", why: "kept (planted)" });
/** c22 — the copy's own learnstate askedFirst, in a child (its import graph stays out of this process) */
function c22(p, nowIso) {
  const src = `const m = await import(${JSON.stringify(pathToFileURL(join(p.dir, "scripts", "learnstate.mjs")).href)}); console.log(JSON.stringify(m.askedFirst(${JSON.stringify(p.state)}, ${Date.parse(nowIso)})));`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", src], { cwd: p.dir, env: ENV, encoding: "utf8", windowsHide: true });
  try { return JSON.parse(lines(r.stdout).filter(Boolean).pop()); } catch { return { absent: `(no reply; exit ${r.status}: ${fold(r.stderr).slice(0, 160)} · ${fold(r.stdout).slice(-120)})` }; }
}

const results = [];
const clause = async (id, fn) => {
  if (ONLY && !ONLY.includes(id)) return;
  let ok = false, why = "";
  try { const r = await fn(); ok = r === true || (r && r.ok === true); why = (r && r.why) || ""; }
  catch (e) { why = `threw: ${String((e && e.message) || e).split(/\r?\n/)[0].slice(0, 200)}`; }
  results.push({ id, ok });
  console.log(`CLAUSE ${id} ${ok ? "GREEN" : "RED"}${why ? ` · ${why}` : ""}`);
};
console.log(`witness_traps · tree ${TREE}${BASE ? ` · base ${BASE}` : " · no base tree"} · plants under ${TMP}`);

await clause("W1", async () => {
  const p = plant(TREE, "w1"); const { arc } = await lesson(p, TWO);
  const { nc, c, rows } = await compile(p, arc);
  const n = rows.find((r) => r.kind === "compiled");
  if (!c.ok || !n) return { ok: false, why: `compile ok ${c.ok} · ${JSON.stringify(c.results).slice(0, 160)}` };
  const { g, called, rows: after } = await gateCounting(p, nc);
  const r0 = (g.results || [])[0] || {};
  const gates = after.filter((r) => r.kind === "cold_gate");
  let eq = "base not given — traps deep-equal not judged";
  let eqOk = true;
  if (BASE) {
    const b = plant(BASE, "w1-base"); const bl = await lesson(b, TWO);
    const bn = (await compile(b, bl.arc)).rows.find((r) => r.kind === "compiled");
    // an archive record id (rid) is minted per archive, so the two compiles are compared on everything else of a trap
    const shape = (ts) => JSON.stringify(ts.map((t) => ({ ...t, rid: undefined })));
    eqOk = !!bn && shape(bn.note.traps) === shape(n.note.traps);
    eq = eqOk ? `note.traps deep-equal the base's compile (${n.note.traps.length})` : `note.traps DIFFER from the base's compile (${bn ? bn.note.traps.length : "none"} vs ${n.note.traps.length})`;
  }
  const ok = called === 0 && r0.op === "not-gateable" && r0.have === 2 && r0.need === 3 && r0.owed === 1 && /tokenization\/a/.test(r0.why || "") && (r0.why || "").includes(n.id)
    && gates.length === 0 && eqOk;
  return { ok, why: `reader called ${called} · op ${r0.op || "none"}${r0.have !== undefined ? ` have ${r0.have} need ${r0.need} owed ${r0.owed}` : ""} · ${gates.length} cold_gate row(s) · ${eq}` };
});

await clause("W2", async () => {
  const run = async (tree, name) => { const p = plant(tree, name); const { arc } = await lesson(p, TWO); return p.node("notes_compiler.mjs", ["fulltime", "--date", DAY, "--stub", "--no-archive-run"], { ARSENAL_ARCHIVE: arc }); };
  const h = await run(TREE, "w2");
  const errLine = lines(h.err).find((l) => /not-gateable/.test(l) && /2 of 3 distinct traps/.test(l));
  const sum = lines(h.out).find((l) => l.startsWith("notes_compiler:")) || "";
  let exitWhy = "base not given — exit not compared", exitOk = true;
  if (BASE) { const b = await run(BASE, "w2-base"); exitOk = b.code === h.code; exitWhy = `exit ${h.code} vs base ${b.code}`; }
  return { ok: !!errLine && /\/ 1 not gateable \(< 3 traps\)/.test(sum) && /0 pass \/ 0 fail/.test(sum) && exitOk,
    why: `stderr not-gateable ${errLine ? "named" : "ABSENT"} · summary ${fold(sum.replace(/^.*?· gate /, "gate ")).slice(0, 110)} · ${exitWhy}` };
});

await clause("W3", async () => {
  const folded = [[["ek word = ek token"], ["x"]], [["Ek  word =  ek TOKEN"], ["y"]], [["space token nahi hai"], ["z"]]];
  const plus = [[[], ["only a plus line"]], ...TWO];
  const out = [];
  for (const [name, diffs] of [["folded", folded], ["placeholder", plus]]) {
    const p = plant(TREE, `w3-${name}`); const { arc } = await lesson(p, diffs);
    const { nc, rows } = await compile(p, arc);
    const traps = (rows.find((r) => r.kind === "compiled") || { note: { traps: [] } }).note.traps.length;
    const { g, called } = await gateCounting(p, nc);
    const r0 = (g.results || [])[0] || {};
    out.push({ name, ok: called === 0 && r0.op === "not-gateable" && r0.have === 2 && traps === 3, why: `${name}: ${traps} trap id(s) · reader ${called} · op ${r0.op || "none"} have ${r0.have}` });
  }
  return { ok: out.every((o) => o.ok), why: out.map((o) => o.why).join(" | ") };
});

await clause("W4", async () => {
  const p = plant(TREE, "w4"); const { arc } = await lesson(p, [...TWO, [["har token ek word hai"], ["token subword bhi hai"]]]);
  const { nc, rows } = await compile(p, arc);
  const n = rows.find((r) => r.kind === "compiled");
  const q = typeof nc.gateableOf === "function" && n ? nc.gateableOf(n.note) : null;
  const { g, called, rows: after } = await gateCounting(p, nc);
  const gates = after.filter((r) => r.kind === "cold_gate");
  return { ok: !!q && q.gateable === true && q.have === 3 && called === 1 && gates.length === 1 && (g.results || [])[0].op === "gated",
    why: `gateableOf ${q ? `exported · have ${q.have} gateable ${q.gateable}` : "NOT EXPORTED"} · reader ${called} · ${gates.length} gate row(s) ${gates[0] ? gates[0].verdict : ""}` };
});

await clause("W5", async () => {
  const run = (tree, name) => {
    const p = plant(tree, name);
    for (const s of [["start", "tokenization"], ["step", "3"], ["axis", "a", "now"]]) { const r = p.node("forge_session.mjs", s); if (r.code !== 0) return { err: `${s.join(" ")} → exit ${r.code}: ${fold(r.err).slice(0, 120)}` }; }
    writeFileSync(p.ledger, JSON.stringify(compiledRow("n-w5", DAY, "a", [trap("crack", "a", "T1"), trap("crack", "b", "T2")])) + "\n");
    const r = p.node("forge_session.mjs", ["contract"]);
    return { lines: lines(r.out).filter((l) => l !== ""), code: r.code };
  };
  const h = run(TREE, "w5");
  if (h.err) return { ok: false, why: h.err };
  const FRAG = / · note a: 2\/3 traps — 1 trap owed \(from the lesson's own bait, never made up; a new day's note counts only the windows that touched its day\)/;
  const ax = h.lines.find((l) => /^ {2}axes:/.test(l)) || "";
  let eq = "base not given — other lines not compared", eqOk = true;
  if (BASE) {
    const b = run(BASE, "w5-base");
    if (b.err) return { ok: false, why: `base: ${b.err}` };
    const stripped = h.lines.map((l) => l.replace(FRAG, ""));
    eqOk = stripped.length === b.lines.length && stripped.every((l, i) => l === b.lines[i]);
    eq = eqOk ? `every other contract line equals the base's (${b.lines.length})` : `contract lines DIFFER from the base's beyond the fragment (${stripped.length} vs ${b.lines.length})`;
  }
  return { ok: FRAG.test(ax) && eqOk, why: `axes line ${FRAG.test(ax) ? "carries the owed fragment" : `has no owed fragment: ${fold(ax).slice(0, 100)}`} · ${eq}` };
});

await clause("W6", async () => {
  const p = plant(TREE, "w6");
  const days = ["2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17"], axes = ["a", "a", "a", "b", "b"];
  const thin = [trap("crack", "a", "T1"), trap("crack", "b", "T2")];
  const comp = days.map((d, i) => compiledRow(`n-old-${i + 1}`, d, axes[i], thin, i === 1 ? { supersedes: "n-old-1" } : i === 2 ? { supersedes: "n-old-2" } : {}));
  writeFileSync(p.ledger, [...comp, ...comp.map((n, i) => failRow(`g-old-${i + 1}`, n.id, days[i]))].map((r) => JSON.stringify(r)).join("\n") + "\n");
  const before = sha(p.ledger);
  for (const d of days) p.node("notes_compiler.mjs", ["gate", "--date", d, "--stub"]);
  const gl = days.map((d) => p.node("notes_compiler.mjs", ["glance", "--date", d]).out).join("\n");
  const st = p.node("notes_compiler.mjs", ["status"]).out;
  const a = c22(p, "2026-11-21T00:00:00.000Z");
  const keptOk = ["n-old-3", "n-old-4", "n-old-5"].every((id, i) => new RegExp(`gate NOT GATEABLE \\(2 of 3 traps · 1 owed\\) · kept FAIL g-old-${i + 3}`).test(gl));
  const ok = sha(p.ledger) === before && keptOk && /3 live note\(s\) not gateable/.test(st) && /not gateable 5 /.test(a.absent || "") && !a.note_id;
  return { ok, why: `ledger ${sha(p.ledger) === before ? "byte-identical" : "MOVED"} · glance kept-FAIL ${keptOk ? "named for the 3 live" : "ABSENT"} · status ${/live note\(s\) not gateable/.test(st) ? fold((/· (\d+ live note\(s\) not gateable)/.exec(st) || [])[1]) : "no count"} · C22 ${fold((/pass \d+ · fail \d+ · not gateable \d+/.exec(a.absent || "") || ["no count"])[0])}` };
});

await clause("W7", async () => {
  const nc = await plant(TREE, "w7").imp("notes_compiler.mjs");
  const notes = [noteOf([trap("crack", "a", "T1"), trap("crack", "b", "T2"), trap("crack", "c", "T3"), trap("correction", "d", "T4")]), noteOf([trap("crack", "a", "T1"), trap("crack", "b", "T2")])];
  const rep = (ids, o = {}) => ({ answer: "x", answer_from_note: true, rebuild: true, wrong: ids.map((t) => ({ text: `w ${t}`, trap: t })), ...o });
  const replies = [rep(["T1", "T2", "T3"]), rep(["T1", "T1", "T2"]), rep(["T1", "T2"]), rep(["T1", "T2", "T9"]), rep(["T1", "T2", "T3", "T4"]), rep(["T2", "T3", "T4"], { answer_from_note: false }), rep(["T1", "T2", "T4"], { rebuild: false })];
  const want = ["pass", "fail", "fail", "fail", "pass", "fail", "fail", "fail", "fail", "fail", "fail", "fail", "fail", "fail"];
  const got = notes.flatMap((n) => replies.map((r) => nc.verdictOf(n, r).verdict));
  let eq = "base not given — base verdicts not compared", eqOk = true;
  if (BASE) { const bc = await plant(BASE, "w7-base").imp("notes_compiler.mjs"); const bg = notes.flatMap((n) => replies.map((r) => bc.verdictOf(n, r).verdict)); eqOk = bg.join() === got.join(); eq = eqOk ? "equal to the base verdictOf on the table" : `DIFFER from the base: ${bg.join(",")}`; }
  return { ok: nc.TRAP_BAR === 3 && got.join() === want.join() && eqOk, why: `TRAP_BAR ${nc.TRAP_BAR === undefined ? "NOT EXPORTED" : nc.TRAP_BAR} · ${got.join(",")} · ${eq}` };
});

await clause("W8", async () => {
  const p = plant(TREE, "w8");
  const five = ["a", "b", "c", "d", "e"].map((b, i) => trap("crack", b, `T${i + 1}`));
  const days = ["2026-11-17", "2026-11-18", "2026-11-19"];
  const comp = days.map((d, i) => compiledRow(`n-true-${i + 1}`, d, "c", five));
  writeFileSync(p.ledger, [...comp, ...comp.map((n, i) => failRow(`g-true-${i + 1}`, n.id, days[i]))].map((r) => JSON.stringify(r)).join("\n") + "\n");
  const gl = days.map((d) => p.node("notes_compiler.mjs", ["glance", "--date", d]).out).join("\n");
  const a = c22(p, "2026-11-21T00:00:00.000Z");
  const glOk = (gl.match(/· gate FAIL · traps T1 T2 T3 T4 T5/g) || []).length === 3 && !/NOT GATEABLE/.test(gl);
  return { ok: glOk && /pass 0 · fail 3 · not gateable 0 /.test(a.absent || ""), why: `glance ${glOk ? "FAIL ×3, none not gateable" : "NOT three plain FAILs"} · C22 ${fold((/pass \d+ · fail \d+ · not gateable \d+/.exec(a.absent || "") || ["no count"])[0])}` };
});

await clause("W9", async () => {
  const cap = { id: "tokenization", title: "Tokenization", faultLines: [{ axis: "a", title: "what a token is", strike: "A token is what, exactly?", weld: "A token is the subword unit the tokenizer emits." }],
    traps: [{ bait: "a token is a character", wrong: "subwords", truth: "a token is a vocabulary entry" }] };
  const run = async (tree, name) => {
    const p = plant(tree, name); const { arc } = await lesson(p, TWO, { capsule: cap });
    const { nc, rows } = await compile(p, arc);
    const n = rows.find((r) => r.kind === "compiled");
    const g = await nc.gateDay({ date: DAY, stateDir: p.state, path: p.ledger, stub: true, guard: NOGUARD, now: () => new Date(at(27)) });
    return { n, r0: (g.results || [])[0] || {}, gates: nc.readRows(p.ledger).filter((r) => r.kind === "cold_gate") };
  };
  const h = await run(TREE, "w9");
  const third = h.n && h.n.note.traps[2] ? h.n.note.traps[2].from : "none";
  let b = null, bWhy = "base not given — the base's pass not judged";
  if (BASE) { b = await run(BASE, "w9-base"); bWhy = `base: ${b.gates.length} gate row(s) ${b.gates.map((x) => x.verdict).join(",") || "—"}`; }
  return { ok: third === "capsule" && h.r0.op === "not-gateable" && h.r0.have === 2 && h.gates.length === 0 && (!b || (b.gates.length === 1 && b.gates[0].verdict === "pass")),
    why: `third trap from ${third} · build op ${h.r0.op || "none"}${h.r0.have !== undefined ? ` have ${h.r0.have}` : ""} · ${h.gates.length} gate row(s) · ${bWhy}` };
});

await clause("SKILL", () => {
  const got = [".claude/skills/forge/SKILL.md", ".claude/skills/learn/SKILL.md"].map((f) => ({ f, ok: /trap owed/i.test(text(join(TREE, f)) || "") && /never write one to reach a count/i.test(text(join(TREE, f)) || "") }));
  return { ok: got.every((g) => g.ok), why: got.map((g) => `${g.f} ${g.ok ? "names" : "does NOT name"} the trap-owed line`).join(" · ") };
});

if (OWN_TMP) { try { rmSync(TMP, { recursive: true, force: true }); } catch { /* a survivor holds a file; the unit witness's LAST names it */ } }
const k = results.filter((r) => r.ok).length;
console.log(`PLANTS mtrap · ${k} of ${results.length} plant(s) as expected`);
process.exit(results.length > 0 && k === results.length ? 0 : 1);
