#!/usr/bin/env node
// ============================================================================
// ci/witness/mcrk/witness_crack.mjs — UNIT mcrk · THE CRACK ROW, CLAUSE BY CLAUSE, BY PLANTS
//   (spec ci/mcrk/MCRK_SPEC.md on claude/mcrk-spec @ 02c6f57 §5; ruling forks row 1189 — where they differ the ruling
//    wins, and ci/mcrk/PROOF.md names each difference)
// ----------------------------------------------------------------------------
// USAGE
//   node ci/witness/mcrk/witness_crack.mjs plants [--tree <dir>] [--base-tree <dir>] [--only <id,…>] [--tmp <dir>]
//   --tree       the tree under test (default: this file's repository). Its scripts/ are COPIED for every plant.
//   --base-tree  the base tree (a git-archive of the unit's BASE): CODEC BOUND and K2c read it; without it CODEC BOUND
//                is not run (said on its own line) and K2c writes its session file with --tree's own code.
//   --tmp        an existing dir to plant under (the unit witness ci/mcrk/witness_mcrk.mjs hands its own, for LAST).
// CONTRACT
//   · Every plant is a COPY under os.tmpdir(): <tree>/scripts + package.json, node_modules linked, and a planted
//     dressing-room/state written by THIS file's node code (writeFileSync) — the repository's own state dir is never
//     opened. Every organ runs as a CHILD on that copy (spawnSync; the pacer's STATE_DIR is its own copy's), or is
//     imported from the copy (notes_compiler, teaching_gate, study_scope) and handed planted paths.
//   · No ARSENAL_* variable reaches a child (each is deleted from the env), and the PATH carries a shim for `claude`
//     and `gemini` that refuses: no live model call can happen here.
//   · THE PORT CLASS (row 1053): no port is bound, no service is named, nothing is POSTed, nothing restarts; no network.
//     Every wait is a spawnSync that ends with its child; the outer bound is the caller's (the suite member's own
//     timeout-minutes). No timeout, budget or size is typed here.
//   · CRLF-proof: every read splits on \r?\n and strips a BOM; no POSIX-only shell; no git repo is planted.
// THE CLAUSES (each RED on base 5759cce, GREEN on the build)
//   K1 VERB      an open session (axis c ON, a check_q moment), then his prompt record → `crack` exits 0 and writes exactly
//                ONE row: words byte-equal to prompt.text, concept, axis and moment of the session
//   K2 SESSION   K1's plant: forge_session.json, forge_sessions.jsonl, resume_pointer.jsonl, relocks.jsonl and
//                teaching_audit_last.json are byte-equal before and after the call (absent stays absent), AND the row exists
//   CODEC BOUND  (spec K2b) load · save · blank · need · live · apply and the STEPS / AXES / MOMENTS literals are byte-equal
//                --base-tree to --tree, AND --tree exports crackRow. A seat-time clause (base vs build), so the suite
//                member drops it like BOUND
//   K2c BASEFILE a session file written by the BASE code (start · step 3 · axis c now · pointer) reads under --tree to
//                the same `status` as under the base, and `contract` = the base's lines with the one crack carrier added
//   K3 REFUSE    (a) no prompt record (d) a stale session (e) a closed session: each exits 1 with its own named line and no
//                cracks.jsonl. NARROWED IN PLACE by forks row 1243 (1) / row 1258 F6 A: legs (b) his prompt before the
//                session's only moment and (c) no axis ON are INVERTED by ruling — they now WRITE his words with the gap
//                named; their inverted assertions live in ci/witness/mcrk2/witness_crack_gap.mjs (G2 / G3), never skipped
//   K3b ONCE     `crack` twice on one prompt: the second says `already written <id>`, exit 0, and the file holds 1 row
//   K4 MOMENT    axis b with pehle_guess · check_q · check_q (refused) · jirah, then axis c with pehle_guess · check_q ·
//                check_q (refused): the row's moment is check_q and moment_at is the LAST NON-refused entry on axis c
//   K5 STAMP     buildNote over [teacher q · his answer · teacher ```diff] with the row: the crack item carries moment,
//                words and crack_id, and galat/sahi deep-equal the base build's for the same ex
//   K6 NODIFF    a row whose turn holds no ```diff, plus a later diff with no row: an item with galat [] and sahi [] and the
//                named gap; the row-less diff item carries no moment
//   K7 C18       axis b (pehle_guess), then axis c (check_q); `crack` on that plant, then compileDay over a planted archive root: the mcap c18 predicate
//                (b37ebfc:ci/witness/mcap/witness_capability.mjs:205-225, replicated — ci/witness/mcap/ is not touched)
//                finds a live note of the day with a crack item: legal moment, fold(words) === fold(his reply), one diff
//   K8 CARRIERS  `contract` on an open session names `forge_session.mjs crack`; forge/SKILL.md, learn/SKILL.md and
//                forge/REFERENCE.md each name it; study_scope ALLOWED_CMD admits `node scripts/forge_session.mjs crack`
//   K9 UNKNOWN   (row 1189 (8)) an unknown pacer verb exits 1 naming the verb, writing nothing; the bare call exits 0
// OUTPUT: one `CLAUSE <id> GREEN|RED · <why>` line per clause, then `PLANTS mcrk · k of n plant(s) as expected` (exit 0
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
if (argv[0] !== "plants") { console.log("witness_crack: usage — plants [--tree <dir>] [--base-tree <dir>] [--only <id,…>] [--tmp <dir>]"); process.exit(1); }
const TREE = resolve(arg("--tree") || join(HERE, "..", "..", "..")), BASE = arg("--base-tree") ? resolve(arg("--base-tree")) : null;
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const OWN_TMP = !arg("--tmp");
const TMP = arg("--tmp") ? mkdtempSync(join(resolve(arg("--tmp")), "crack-")) : mkdtempSync(join(tmpdir(), "mcrk-crack-"));
for (const k of Object.keys(process.env)) if (/^ARSENAL_/i.test(k)) delete process.env[k];

// the model shim: `claude` / `gemini` refuse on this PATH (the member's own shape)
const SHIM = join(TMP, "shim"); mkdirSync(SHIM);
for (const tool of ["claude", "gemini"]) {
  writeFileSync(join(SHIM, tool), "#!/bin/sh\necho \"REFUSED — no live model call in a witness (unit mcrk)\" >&2\nexit 1\n", { mode: 0o755 });
  writeFileSync(join(SHIM, `${tool}.cmd`), "@echo REFUSED — no live model call in a witness (unit mcrk) 1>&2\r\n@exit /b 1\r\n");
}
// unit mcrk2 (forks row 1258 F2 C; FORK mcrk2-F6w in ci/mcrk2/PROOF.md): the crack verb now reads his words through
// readHisPrompt with the CALLING session's id, so the seat's own CLAUDE_CODE_SESSION_ID must never reach a plant whose prompt
// record was written by "sess-witness" — the child has no session id, the shape of the neutral machine
const ENV = (() => { const e = { ...process.env }; delete e.CLAUDE_CODE_SESSION_ID; const pk = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH"; e[pk] = `${SHIM}${delimiter}${e[pk] || ""}`; return e; })();
const NM = [TREE, join(HERE, "..", "..", "..")].map((t) => join(t, "node_modules")).find((p) => existsSync(p)) || null;
const text = (p) => { try { return readFileSync(p, "utf8").replace(/^\uFEFF/, ""); } catch { return null; } };
const sha = (p) => (existsSync(p) ? createHash("sha256").update(readFileSync(p)).digest("hex") : "absent");
const lines = (s) => String(s || "").split(/\r?\n/);
const fold = (s) => String(s || "").replace(/\s+/g, " ").trim();
const SAID = "shaky — ek word ek token hota hai\n  (jaise 'tokenization' = 1)";

let seq = 0;
/** plant — a fresh copy of <tree>'s scripts under TMP with an empty planted state dir */
function plant(tree, name) {
  const dir = join(TMP, `${++seq}-${name}`);
  cpSync(join(tree, "scripts"), join(dir, "scripts"), { recursive: true });
  if (existsSync(join(tree, "package.json"))) cpSync(join(tree, "package.json"), join(dir, "package.json"));
  if (NM) symlinkSync(NM, join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const state = join(dir, "dressing-room", "state");
  mkdirSync(state, { recursive: true });
  // the canon a contract needs (registry.mjs coreAxes reads concepts.json first): planted, never his
  writeFileSync(join(state, "concepts.json"), JSON.stringify({ concepts: { tokenization: { core_axes: ["d"] } } }) + "\n");
  const run = (...a) => { const r = spawnSync(process.execPath, [join(dir, "scripts", "forge_session.mjs"), ...a], { cwd: dir, env: ENV, encoding: "utf8", windowsHide: true }); return { code: r.status, out: String(r.stdout || ""), err: String(r.stderr || ""), all: `${r.stdout || ""}${r.stderr || ""}` }; };
  const at = (f) => join(state, f);
  const json = (f) => { try { return JSON.parse(text(at(f))); } catch { return null; } };
  const write = (f, o) => writeFileSync(at(f), typeof o === "string" ? o : JSON.stringify(o, null, 2) + "\n");
  const cracks = () => { const t = text(at("cracks.jsonl")); return t === null ? null : lines(t).filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return { torn: l }; } }); };
  const prompt = (txt = SAID, when = new Date()) => write("teaching_audit_last.json", { prompt: { text: txt, step: 3, moments: 1, reps: 0, session_id: "sess-witness", at: when.toISOString() }, checked_rules: [] });
  return { dir, state, run, at, json, write, cracks, prompt };
}
/** open — the real pacer path to an open session on axis c with one check_q */
function open(p, { axis = "c", moments = ["check_q"] } = {}) {
  const steps = [["start", "tokenization"], ["step", "3"], ["axis", axis, "now"], ...moments.map((m) => ["moment", m])];
  for (const s of steps) { const r = p.run(...s); if (r.code !== 0 && !(s[0] === "moment" && /ONE check-question already spent/.test(r.err))) return { ok: false, why: `${s.join(" ")} → exit ${r.code}: ${fold(r.all).slice(0, 160)}` }; }
  return { ok: true };
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
const imp = async (dir, f) => import(pathToFileURL(join(dir, "scripts", f)).href);

console.log(`witness_crack · tree ${TREE}${BASE ? ` · base ${BASE}` : " · no base tree"} · plants under ${TMP}`);

await clause("K1", () => {
  const p = plant(TREE, "k1"); const o = open(p); if (!o.ok) return o;
  p.prompt();
  const r = p.run("crack"), rows = p.cracks();
  if (r.code !== 0 || !rows || rows.length !== 1) return { ok: false, why: `crack exit ${r.code} · rows ${rows ? rows.length : "no cracks.jsonl"} · ${fold(r.all).slice(0, 120)}` };
  const w = rows[0];
  return { ok: w.words === SAID && w.concept === "tokenization" && w.axis === "c" && w.moment === "check_q" && w.kind === "crack",
    why: `1 row · words ${w.words === SAID ? "byte-equal" : "DIFFER"} · ${w.concept} axis ${w.axis} moment ${w.moment}` };
});

await clause("K2", () => {
  const p = plant(TREE, "k2"); const o = open(p); if (!o.ok) return o;
  p.prompt();
  const files = ["forge_session.json", "forge_sessions.jsonl", "resume_pointer.jsonl", "relocks.jsonl", "teaching_audit_last.json"];
  const before = files.map((f) => sha(p.at(f)));
  const r = p.run("crack");
  const after = files.map((f) => sha(p.at(f))), rows = p.cracks() || [];
  const moved = files.filter((f, i) => before[i] !== after[i]);
  return { ok: rows.length === 1 && moved.length === 0, why: `crack exit ${r.code} · rows ${rows.length} · ${moved.length ? `MOVED: ${moved.join(", ")}` : `${files.length} file(s) byte-equal (absent stays absent)`}` };
});

if (BASE) await clause("CODEC BOUND", () => {
  const grab = (src, name) => {
    const fn = new RegExp(`^(?:export )?function ${name}\\(`, "m").exec(src);
    if (fn) { const a = fn.index; return src.slice(a, src.indexOf("\n}\n", a) + 2); }
    const ar = new RegExp(`^(?:export )?const ${name} = `, "m").exec(src);
    if (!ar) return null;
    const a = ar.index, end = src.slice(a).match(/\n(?:\}\)?|\]);?\n|;\n/);
    return end ? src.slice(a, a + end.index + end[0].length) : src.slice(a, src.indexOf("\n", a));
  };
  const t = text(join(TREE, "scripts", "forge_session.mjs")).replace(/\r\n/g, "\n"), b = text(join(BASE, "scripts", "forge_session.mjs")).replace(/\r\n/g, "\n");
  const names = ["load", "save", "blank", "need", "live", "apply", "STEPS", "AXES", "MOMENTS"];
  const bad = names.filter((n) => { const x = grab(t, n), y = grab(b, n); return x === null || y === null || x !== y; });
  const has = /^export function crackRow\(/m.test(t);
  return { ok: bad.length === 0 && has, why: `${names.length - bad.length} of ${names.length} codec bodies byte-equal${bad.length ? ` · DIFFER: ${bad.join(", ")}` : ""} · crackRow ${has ? "exported" : "ABSENT"}` };
});
else console.log("CLAUSE CODEC BOUND not run — no --base-tree (a base-vs-build clause)");

await clause("K2c", () => {
  const writer = plant(BASE || TREE, "k2c-base");
  const o = open(writer, { moments: [] }); if (!o.ok) return o;
  const pr = writer.run("pointer", "token ka id kaun deta hai — tokenizer ya model?"); if (pr.code !== 0) return { ok: false, why: `pointer → exit ${pr.code}` };
  const reader = plant(TREE, "k2c-build");
  writeFileSync(reader.at("forge_session.json"), readFileSync(writer.at("forge_session.json")));
  const sB = writer.run("status"), sT = reader.run("status"), cB = writer.run("contract"), cT = reader.run("contract");
  const CARRIER = /\s·\scrack → ```diff likho to usi turn mein: node scripts\/forge_session\.mjs crack \(no args\)/;
  const bl = lines(cB.out).filter(Boolean), tl = lines(cT.out).filter(Boolean);
  const carried = tl.filter((l) => CARRIER.test(l)).length;
  const sameStatus = sB.out === sT.out && sT.code === 0 && sT.out.length > 0;
  // the carrier is stripped on BOTH sides: with no --base-tree the writer is --tree's own code and carries it too
  const sameRest = tl.length === bl.length && tl.every((l, i) => l.replace(CARRIER, "") === bl[i].replace(CARRIER, ""));
  return { ok: sameStatus && sameRest && carried === 1, why: `status ${sameStatus ? "identical" : "DIFFERS"} · contract ${tl.length} line(s) vs base ${bl.length} · ${sameRest ? "base lines kept" : "a base line CHANGED"} · crack carrier on ${carried} line(s)` };
});

await clause("K3", () => {
  // forks row 1243 (1) / row 1258 F6 A: (b) and (c) are no longer refusals — their inverted legs are mcrk2's G2 / G3
  const cases = [];
  const expect = (name, p, re) => { const r = p.run("crack"); const ok = r.code === 1 && re.test(r.err) && !existsSync(p.at("cracks.jsonl")); cases.push(`${name} ${ok ? "refused" : `NOT REFUSED (exit ${r.code}${existsSync(p.at("cracks.jsonl")) ? ", a row written" : ""})`}`); return ok; };
  const a = plant(TREE, "k3a"); if (!open(a).ok) return { ok: false, why: "setup (a)" };
  const okA = expect("(a) no prompt record", a, /his words are not on disk/);
  const d = plant(TREE, "k3d"); if (!open(d).ok) return { ok: false, why: "setup (d)" };
  const sd = d.json("forge_session.json"), old = new Date(Date.now() - 3 * 86400000).toISOString();
  d.write("forge_session.json", { ...sd, started_at: old, updated_at: old }); d.prompt();
  const okD = expect("(d) stale session", d, /is stale/);
  const e = plant(TREE, "k3e"); if (!open(e).ok) return { ok: false, why: "setup (e)" };
  e.write("forge_session.json", { ...e.json("forge_session.json"), closed_at: new Date().toISOString() }); e.prompt();
  const okE = expect("(e) closed session", e, /was closed/);
  return { ok: okA && okD && okE, why: `${cases.join(" · ")} · (b)/(c) narrowed out by row 1243 (their inverted legs: mcrk2 G2 / G3)` };
});

await clause("K3b", () => {
  const p = plant(TREE, "k3b"); const o = open(p); if (!o.ok) return o;
  p.prompt();
  const r1 = p.run("crack"), r2 = p.run("crack"), rows = p.cracks() || [];
  const id = rows[0] && rows[0].id;
  return { ok: r1.code === 0 && r2.code === 0 && rows.length === 1 && !!id && r2.out.includes(`already written ${id}`), why: `first exit ${r1.code} · second exit ${r2.code}${id && r2.out.includes(`already written ${id}`) ? ` · "already written ${id}"` : ""} · rows ${rows.length}` };
});

await clause("K4", () => {
  const p = plant(TREE, "k4");
  const steps = [["start", "tokenization"], ["step", "3"], ["axis", "b", "now"], ["moment", "pehle_guess"], ["moment", "check_q"], ["moment", "check_q"], ["moment", "jirah"],
    ["axis", "c", "now"], ["moment", "pehle_guess"], ["moment", "check_q"], ["moment", "check_q"]];
  for (const s of steps) p.run(...s);
  const log = (p.json("forge_session.json") || {}).moments_log || [];
  const want = log.filter((m) => m.axis === "c" && !m.refused).at(-1);
  if (!want || !log.some((m) => m.axis === "c" && m.refused)) return { ok: false, why: `the plant did not build its log (${log.length} entr(ies))` };
  p.prompt();
  const r = p.run("crack"), w = (p.cracks() || [])[0];
  return { ok: r.code === 0 && !!w && w.moment === want.kind && w.moment_at === want.at && w.axis === "c",
    why: w ? `moment ${w.moment} at ${w.moment_at === want.at ? "the last non-refused c entry" : `${w.moment_at} (want ${want.at})`}` : `no row (exit ${r.code})` };
});

const T0 = Date.now() - 3600000, iso = (m) => new Date(T0 + m * 60000).toISOString();
// the archive's copy of his reply differs from the prompt record by whitespace (as a harness copy can): the row's words,
// not the archive's, are what the crack item must carry
const EXK = [{ role: "teacher", at: iso(1), rid: "r-k1", text: "Ek word kitne tokens banata hai?" }, { role: "him", at: iso(2), rid: "r-k2", text: fold(SAID) },
  { role: "teacher", at: iso(3), rid: "r-k3", text: "```diff\n- ek word = ek token\n+ ek word = ek ya zyada tokens (subwords)\n```\nKahan atke the?" }];
const ROW = { v: 1, kind: "crack", id: "ck-witness-0001", at: iso(2.5), concept: "tokenization", axis: "c", moment: "check_q", moment_at: iso(1.5), words: SAID, prompt_at: iso(2) };

await clause("K5", async () => {
  const p = plant(TREE, "k5"), N = await imp(p.dir, "notes_compiler.mjs");
  const ref = BASE ? await imp(plant(BASE, "k5-base").dir, "notes_compiler.mjs") : N;
  const it = N.buildNote({ concept: "tokenization", axis: "c", ex: EXK, cracks: [ROW] }).items.filter((i) => i.kind === "crack");
  const rf = ref.buildNote({ concept: "tokenization", axis: "c", ex: EXK }).items.filter((i) => i.kind === "crack");
  const x = it[0] || {}, y = rf[0] || {};
  const diffKept = it.length === 1 && rf.length === 1 && JSON.stringify(x.galat) === JSON.stringify(y.galat) && JSON.stringify(x.sahi) === JSON.stringify(y.sahi);
  return { ok: diffKept && x.moment === "check_q" && x.words === SAID && x.crack_id === ROW.id, why: `${it.length} crack item(s) · moment ${x.moment || "none"} · words ${x.words === SAID ? "his, verbatim" : "ABSENT"} · crack_id ${x.crack_id || "none"} · diff ${diffKept ? "the base build's" : "CHANGED"}` };
});

await clause("K6", async () => {
  const N = await imp(plant(TREE, "k6").dir, "notes_compiler.mjs");
  const ex = [EXK[0], EXK[1], { role: "teacher", at: iso(3), rid: "r-k3", text: "Kahan atke the? Apne words mein bolo." }, { role: "him", at: iso(4), rid: "r-k4", text: "maine socha har word alag" },
    { role: "teacher", at: iso(5), rid: "r-k5", text: "```diff\n- har word alag token\n+ subwords bhi token hote hain\n```\nSamajh aaya — haan ya nahi?" }];
  const note = N.buildNote({ concept: "tokenization", axis: "c", ex, cracks: [ROW] });
  const cr = note.items.filter((i) => i.kind === "crack");
  const empty = cr.find((i) => i.crack_id === ROW.id), rowless = cr.find((i) => i.rid === "r-k5");
  const gap = (note.gaps || []).some((g) => g.startsWith(`crack row ${ROW.id} has no`));
  const ok = !!empty && empty.galat.length === 0 && empty.sahi.length === 0 && gap && !!rowless && !("moment" in rowless) && rowless.galat.length > 0;
  return { ok, why: `row item ${empty ? `galat ${empty.galat.length} · sahi ${empty.sahi.length}` : "ABSENT"} · gap ${gap ? "named" : "ABSENT"} · the row-less diff ${rowless ? ("moment" in rowless ? "STAMPED" : "unstamped") : "absent"}` };
});

await clause("K7", async () => {
  const p = plant(TREE, "k7");
  for (const st of [["start", "tokenization"], ["step", "3"], ["axis", "b", "now"], ["moment", "pehle_guess"], ["axis", "c", "now"], ["moment", "check_q"]]) {
    const x = p.run(...st); if (x.code !== 0) return { ok: false, why: `${st.join(" ")} → exit ${x.code}` };
  }
  const s = p.json("forge_session.json");
  // the clocks of the turn, in order: the teacher's question (at its declared moment) · his reply · `crack` · the ```diff turn
  const q = new Date(Date.parse((s.moments_log || []).at(-1).at)), prm = new Date(Math.max(Date.now(), q.getTime() + 1));
  p.prompt(SAID, prm);
  const r = p.run("crack");
  const tDiff = new Date();
  const N = await imp(p.dir, "notes_compiler.mjs"), G = await imp(p.dir, "teaching_gate.mjs");
  const D = N.noteDay({ ts: tDiff.toISOString() });
  const arc = join(p.dir, "archive"), [y, m, d] = D.split("-"), laneDir = join(arc, "data", "afferent", y, m);
  mkdirSync(laneDir, { recursive: true });
  const rec = (rid, t, source, txt) => ({ rid, ts_utc: t.toISOString(), payload: { source, text: txt, session_id: "sess-witness", moment: { forge_concept: s.concept } } });
  writeFileSync(join(laneDir, `${d}.jsonl`), [rec("rid-k7-1", q, "claude-code-teaching", "Ek word kitne tokens banata hai?"), rec("rid-k7-2", prm, "claude-code", SAID),
    rec("rid-k7-3", tDiff, "claude-code-teaching", "```diff\n- ek word = ek token\n+ ek word = ek ya zyada tokens (subwords)\n```\nKahan atke the?")].map((x) => JSON.stringify(x)).join("\n") + "\n");
  const ledger = join(p.state, "compiled_notes.jsonl");
  const c = N.compileDay({ date: D, stateDir: p.state, path: ledger, root: arc, guard: () => ({ ran: false, ok: true, why: "witness: no guard on a plant" }) });
  // THE c18 PREDICATE (b37ebfc:ci/witness/mcap/witness_capability.mjs:205-225): his broken answer's capture `spoken` is
  // his reply (the plant banks it verbatim), so its crack row must be in a live compiled note of D for the same concept/axis
  const spoken = SAID;
  const live = N.noteState(N.readRows(ledger)).live.filter((n) => N.noteDay(n) === D);
  const hit = live.some((n) => n.concept === "tokenization" && n.axis === "c" && Array.isArray(n.note && n.note.items) && n.note.items.some((it) => it && it.kind === "crack"
    && G.MOMENT_KINDS.includes(it.moment) && typeof it.words === "string" && fold(it.words) === fold(spoken) && Array.isArray(it.galat) && it.galat.length > 0 && Array.isArray(it.sahi) && it.sahi.length > 0));
  return { ok: r.code === 0 && hit, why: `crack exit ${r.code} · compile ${c.ok ? (c.results || []).map((x) => x.op).join("/") || "nothing" : `refused (${c.why})`} · c18 ${hit ? "0 (the broken answer has its crack row)" : "1 (RED · without a crack row)"}` };
});

await clause("K8", async () => {
  const p = plant(TREE, "k8"); const o = open(p); if (!o.ok) return o;
  const ct = p.run("contract"), inContract = /node scripts\/forge_session\.mjs crack/.test(ct.out);
  const skills = [".claude/skills/forge/SKILL.md", ".claude/skills/learn/SKILL.md", ".claude/skills/forge/REFERENCE.md"].map((f) => [f, /forge_session\.mjs crack/.test(text(join(TREE, f)) || "")]);
  const S = await imp(p.dir, "study_scope.mjs"), admits = S.ALLOWED_CMD instanceof RegExp && S.ALLOWED_CMD.test("node scripts/forge_session.mjs crack");
  const ok = inContract && skills.every(([, h]) => h) && admits;
  return { ok, why: `contract ${inContract ? "names it" : "SILENT"} · ${skills.map(([f, h]) => `${f.split("/").slice(-2).join("/")} ${h ? "names it" : "SILENT"}`).join(" · ")} · rails ${admits ? "admits it" : "REFUSES it"}` };
});

await clause("K9", () => {
  const p = plant(TREE, "k9"); const o = open(p); if (!o.ok) return o;
  const before = sha(p.at("forge_session.json"));
  const r = p.run("no-such-verb"), bare = p.run();
  const ok = r.code === 1 && /unknown verb "no-such-verb"/.test(r.err) && sha(p.at("forge_session.json")) === before && !existsSync(p.at("cracks.jsonl")) && bare.code === 0;
  return { ok, why: `unknown verb → exit ${r.code}${/unknown verb "no-such-verb"/.test(r.err) ? " named" : " NOT named"} · bare → exit ${bare.code}` };
});

if (OWN_TMP) { try { rmSync(TMP, { recursive: true, force: true }); } catch { /* a survivor holds a file */ } }
const k = results.filter((r) => r.ok).length;
console.log(`PLANTS mcrk · ${k} of ${results.length} plant(s) as expected`);
process.exit(results.length > 0 && k === results.length ? 0 : 1);
