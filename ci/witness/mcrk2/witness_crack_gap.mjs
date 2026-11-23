#!/usr/bin/env node
// ============================================================================
// ci/witness/mcrk2/witness_crack_gap.mjs — UNIT mcrk2 · THE CRACK VERB NEVER LOSES HIS WORDS, CLAUSE BY CLAUSE, BY PLANTS
//   (spec ci/mcrk2/MCRK2_SPEC.md on claude/mcrk2-spec @ 9a6beb4 §2-§7 + §11; ruling forks rows 1243 / 1258 — where they
//    differ the ruling wins, and ci/mcrk2/PROOF.md names each difference)
// ----------------------------------------------------------------------------
// USAGE
//   node ci/witness/mcrk2/witness_crack_gap.mjs plants [--tree <dir>] [--base-tree <dir>] [--only <id,…>] [--tmp <dir>]
//   --tree       the tree under test (default: this file's repository). Its scripts/ (and its ci/witness/mcrk/) are COPIED
//                for every plant; every clause judges --tree's own code.
//   --base-tree  accepted for the unit witness's grammar; no clause here needs it (each clause is RED on the base's own code)
//   --tmp        an existing dir to plant under (the unit witness ci/mcrk2/witness_mcrk2.mjs hands its own, for LAST).
// CONTRACT
//   · Every plant is a COPY under os.tmpdir(): <tree>/scripts + package.json, node_modules linked, and a planted
//     dressing-room/state written by THIS file's node code (writeFileSync) — the repository's own state dir is never
//     opened. Every organ runs as a CHILD on that copy (spawnSync; each organ's STATE_DIR is its own copy's), or is imported
//     from the copy and handed planted paths.
//   · No ARSENAL_* variable reaches a child (each is deleted from the env; ARSENAL_AUDIT_NO_SPAWN=1 is SET on every child —
//     teaching_audit's own seam, so a planted Stop spawns nothing), CLAUDE_CODE_SESSION_ID is PLANTED per call (or deleted),
//     never the seat's, and the PATH carries a shim for `claude` and `gemini` that refuses: no live model call can happen.
//   · THE PORT CLASS (row 1053): no port is bound, no service is named, nothing is POSTed, nothing restarts; no network.
//     Every wait is a spawnSync that ends with its child; the outer bound is the caller's. No timeout, budget or size is typed.
//   · CRLF-proof: every read splits on \r?\n and strips a BOM; no POSIX-only shell; no git repo is planted.
//   · His words are never printed: a clause names their LENGTH and whether they are byte-equal, never the text.
// THE CLAUSES (each RED on the mbank build tip f635d68, GREEN on the build)
//   G2 UNDECLARED  axis d ON, no moment, his prompt → `crack` exit 0, ONE row: axis d, moment "undeclared", moment_at null,
//                  gap "moment-undeclared", gap_owner "teacher", words byte-equal; AND (the G1 guard leg) axis c with a
//                  check_q before his prompt → moment check_q, gap null
//   G3 NOAXIS      a session open at step 3, no `axis now`, his prompt → exit 0, ONE row: axis "none", the session's concept,
//                  gap "axis-none+moment-undeclared"; a moment logged with no axis before his answer → that moment, gap
//                  "axis-none" (F4-m); never null (F8 A)
//   G3b ORDER      no axis ON AND no prompt record → exit 1 "his words are not on disk", no cracks.jsonl (branch 4 is first)
//   G4 REFUSE      (a) no record (b) prompt before the session (c) blank text (d) a consumed record (e) the calling session
//                  S1 has no own record and the shared slot is S2's → each exit 1, its named line, no cracks.jsonl
//   G5 SESSION     the G2 plant: forge_session.json, forge_sessions.jsonl, resume_pointer.jsonl, relocks.jsonl and
//                  teaching_audit_last.json byte-equal before and after, AND the row exists
//   G6 GATE        his prompt through the real teaching_audit hook (session H), `crack` with CLAUDE_CODE_SESSION_ID = H → a gap
//                  row; teaching_gate's real stopHook on a planted bound sitting → reds ∋ C.crack-gap, its detail names the row,
//                  decision and every other red equal to the same plant with no crack row (it blocks nothing); its log row
//                  names the id (crack_gaps); the second Stop → no C.crack-gap (the once-latch); another session's gap → none
//   G7 DRIFT       the G6 plant, then teaching_audit's real Stop hook (session H) → its log row's drifts ∋ crack-gap, staged
//                  carries it, the evidence names the row and never his words; CHECKED_RULES ∋ crack-gap and, with no seed row
//                  in teaching_contract.mjs, SEED_GAP declares it; NO CARD: no captains_call* file is born in the plant
//   G8 NOTE        axis c ON, no moment, his prompt, `crack`, a teacher ```diff turn in a planted archive → compileDay ok, the
//                  note's crack item carries moment "undeclared", his words, gap; GAPS names "the teacher's miss" (no note blocked)
//   G9 SETTLE      axis-none rows through the verb, then compileDay: (i) a window of his session contains his prompt → the note
//                  of that axis carries it, axis_settled.by names the window; (ii) one `axis c now` inside the turn → axis c's
//                  note, by names the declaration; (iii) no axis in the ledger / two axes in the turn → in no note, the compile
//                  result names it unplaced with its why
//   G10 READERS    readCracks hands a gap row back unchanged (kind crack, gap kept); the verb's line prints GAP <gap>
//   G13 UNCHECKED  (forks row 1281 (2)) no calling session id → `crack` writes his words with gap "session-unchecked", owner
//                  "organism" (joined "+" with a teacher gap); teaching_gate counts C.crack-unchecked and allows; the teacher's
//                  drift counts only a teacher part; `start` writes calling_session_id_present, a boolean, never the id
//   G12 DOOR       the crack case reads his words only through readHisPrompt (no loadAuditLast, no `.prompt` read in the case);
//                  a session with its own record writes ITS words even when the shared slot is another session's
//   MCRK CARRY     the tree's ci/witness/mcrk/witness_crack.mjs narrows K3 citing row 1243 and its plants read k of k on the
//                  tree, with a planted seat session id in the parent env (its children must not inherit it)
// OUTPUT: one `CLAUSE <id> GREEN|RED · <why>` line per clause, then `PLANTS mcrk2 · k of n plant(s) as expected` (exit 0
//   iff k === n).
// ============================================================================
import { mkdtempSync, mkdirSync, cpSync, symlinkSync, existsSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { join, resolve, dirname, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
if (argv[0] !== "plants") { console.log("witness_crack_gap: usage — plants [--tree <dir>] [--base-tree <dir>] [--only <id,…>] [--tmp <dir>]"); process.exit(1); }
const TREE = resolve(arg("--tree") || join(HERE, "..", "..", ".."));
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const OWN_TMP = !arg("--tmp");
const TMP = arg("--tmp") ? mkdtempSync(join(resolve(arg("--tmp")), "crackgap-")) : mkdtempSync(join(tmpdir(), "mcrk2-crackgap-"));
for (const k of Object.keys(process.env)) if (/^ARSENAL_/i.test(k)) delete process.env[k];

const SHIM = join(TMP, "shim"); mkdirSync(SHIM);
for (const tool of ["claude", "gemini"]) {
  writeFileSync(join(SHIM, tool), "#!/bin/sh\necho \"REFUSED — no live model call in a witness (unit mcrk2)\" >&2\nexit 1\n", { mode: 0o755 });
  writeFileSync(join(SHIM, `${tool}.cmd`), "@echo REFUSED — no live model call in a witness (unit mcrk2) 1>&2\r\n@exit /b 1\r\n");
}
/** envOf — the child's env: the shim first on PATH, the session id PLANTED (or deleted), the audit's no-spawn seam set */
const envOf = (sid = null) => {
  const e = { ...process.env }; const pk = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
  e[pk] = `${SHIM}${delimiter}${e[pk] || ""}`;
  if (sid) e.CLAUDE_CODE_SESSION_ID = sid; else delete e.CLAUDE_CODE_SESSION_ID;
  e.ARSENAL_AUDIT_NO_SPAWN = "1";
  return e;
};
const NM = [TREE, join(HERE, "..", "..", "..")].map((t) => join(t, "node_modules")).find((p) => existsSync(p)) || null;
const text = (p) => { try { return readFileSync(p, "utf8").replace(/^﻿/, ""); } catch { return null; } };
const sha = (p) => (existsSync(p) ? createHash("sha256").update(readFileSync(p)).digest("hex") : "absent");
const lines = (s) => String(s || "").split(/\r?\n/);
const fold = (s) => String(s || "").replace(/\s+/g, " ").trim();
const SAID = "shaky — ek word ek token hota hai\n  (jaise 'tokenization' = 1)";
const HOST = "11111111-2222-3333-4444-555555555555", OTHER = "a8909716-3d43-4752-b3af-40613f4814d4";
// forks row 1281 (1): a witness plants its own session and names it — every pacer call runs as WSID, and the prompt record
// carries WSID's own entry, unless a clause names another (G4 (e), G6, G7, G12) or none (G13, the F12 leg)
const WSID = "sess-witness";

let seq = 0;
/** plant — a fresh copy of <tree>'s scripts under TMP with an empty planted state dir */
function plant(name) {
  const dir = join(TMP, `${++seq}-${name}`);
  cpSync(join(TREE, "scripts"), join(dir, "scripts"), { recursive: true });
  if (existsSync(join(TREE, "package.json"))) cpSync(join(TREE, "package.json"), join(dir, "package.json"));
  if (NM) symlinkSync(NM, join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const state = join(dir, "dressing-room", "state");
  mkdirSync(state, { recursive: true });
  writeFileSync(join(state, "concepts.json"), JSON.stringify({ concepts: { tokenization: { core_axes: ["d"] } } }) + "\n");
  const node = (file, a = [], { sid = null, input = undefined } = {}) => {
    const r = spawnSync(process.execPath, [join(dir, "scripts", file), ...a], { cwd: dir, env: envOf(sid), encoding: "utf8", windowsHide: true, ...(input !== undefined ? { input } : {}) });
    return { code: r.status, out: String(r.stdout || ""), err: String(r.stderr || ""), all: `${r.stdout || ""}${r.stderr || ""}` };
  };
  const run = (...a) => node("forge_session.mjs", a, { sid: WSID });
  const at = (f) => join(state, f);
  const json = (f) => { try { return JSON.parse(text(at(f))); } catch { return null; } };
  const write = (f, o) => writeFileSync(at(f), typeof o === "string" ? o : JSON.stringify(o, null, 2) + "\n");
  const cracks = () => { const t = text(at("cracks.jsonl")); return t === null ? null : lines(t).filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return { torn: l }; } }); };
  /** prompt — the planted session's record: the shared slot AND its own entry (prompts_by_session[WSID]), as teaching_audit writes them */
  const prompt = (txt = SAID, when = new Date(), extra = {}) => { const rec = { text: txt, step: 3, moments: 1, reps: 0, session_id: WSID, at: when.toISOString(), ...extra }; write("teaching_audit_last.json", { prompt: rec, prompts_by_session: { [WSID]: rec }, checked_rules: [] }); };
  /** promptShared — the shared slot only (a record written before unit mbank, or by a session with no readable id) */
  const promptShared = (txt = SAID, when = new Date()) => write("teaching_audit_last.json", { prompt: { text: txt, step: 3, moments: 1, reps: 0, session_id: WSID, at: when.toISOString() }, checked_rules: [] });
  /** hook — his prompt (or a Stop) through the REAL teaching_audit hook, as session sid */
  const hook = (sid, o) => node("teaching_audit.mjs", ["hook"], { sid, input: JSON.stringify({ session_id: sid, ...o }) });
  return { dir, state, node, run, at, json, write, cracks, prompt, promptShared, hook };
}
/** open — the real pacer path to an open session at step 3, optionally an axis and moments */
function open(p, { axis = null, moments = [] } = {}) {
  const steps = [["start", "tokenization"], ["step", "3"], ...(axis ? [["axis", axis, "now"]] : []), ...moments.map((m) => ["moment", m])];
  for (const s of steps) { const r = p.run(...s); if (r.code !== 0) return { ok: false, why: `${s.join(" ")} → exit ${r.code}: ${fold(r.all).slice(0, 160)}` }; }
  return { ok: true };
}
const later = (ms = 1) => new Date(Date.now() + ms);
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
const rowOf = (p, r) => { const rows = p.cracks(); return { r, rows, w: rows && rows.length === 1 ? rows[0] : null }; };

console.log(`witness_crack_gap · tree ${TREE} · plants under ${TMP}`);

await clause("G2", () => {
  const p = plant("g2"); const o = open(p, { axis: "d" }); if (!o.ok) return o;
  p.prompt(SAID, later());
  const { r, rows, w } = rowOf(p, p.run("crack"));
  if (r.code !== 0 || !w) return { ok: false, why: `undeclared: crack exit ${r.code} · rows ${rows ? rows.length : "no cracks.jsonl"} · ${fold(r.err).slice(0, 120)}` };
  const okU = w.words === SAID && w.axis === "d" && w.moment === "undeclared" && w.moment_at === null && w.gap === "moment-undeclared" && w.gap_owner === "teacher";
  const g = plant("g2-guard"); const og = open(g, { axis: "c", moments: ["check_q"] }); if (!og.ok) return og;
  g.prompt(SAID, later());
  const gr = rowOf(g, g.run("crack"));
  const okG = gr.r.code === 0 && !!gr.w && gr.w.moment === "check_q" && gr.w.gap === null && gr.w.gap_owner === null && gr.w.words === SAID;
  return { ok: okU && okG, why: `undeclared → axis ${w.axis} moment ${w.moment} moment_at ${w.moment_at} gap ${w.gap} owner ${w.gap_owner} · words ${w.words === SAID ? "byte-equal" : "DIFFER"} (${String(w.words || "").length} char(s)) · guard (check_q declared) → ${gr.w ? `moment ${gr.w.moment} gap ${gr.w.gap}` : `exit ${gr.r.code}`}` };
});

await clause("G3", () => {
  const p = plant("g3"); const o = open(p); if (!o.ok) return o;
  p.prompt(SAID, later());
  const { r, w } = rowOf(p, p.run("crack"));
  if (r.code !== 0 || !w) return { ok: false, why: `no axis: crack exit ${r.code} · ${fold(r.err).slice(0, 140)}` };
  const okN = w.words === SAID && w.axis === "none" && w.concept === "tokenization" && w.moment === "undeclared" && w.gap === "axis-none+moment-undeclared" && w.gap_owner === "teacher";
  const m = plant("g3-moment"); const om = open(m, { moments: ["pehle_guess"] }); if (!om.ok) return om;
  m.prompt(SAID, later());
  const mr = rowOf(m, m.run("crack"));
  const okM = mr.r.code === 0 && !!mr.w && mr.w.axis === "none" && mr.w.moment === "pehle_guess" && typeof mr.w.moment_at === "string" && mr.w.gap === "axis-none";
  return { ok: okN && okM, why: `no axis → axis ${w.axis} concept ${w.concept} moment ${w.moment} gap ${w.gap} · words ${w.words === SAID ? "byte-equal" : "DIFFER"} · a moment logged with no axis → ${mr.w ? `moment ${mr.w.moment} gap ${mr.w.gap}` : `exit ${mr.r.code}`}` };
});

await clause("G3b", () => {
  const p = plant("g3b"); const o = open(p); if (!o.ok) return o;
  const r = p.run("crack");
  const ok = r.code === 1 && /his words are not on disk/.test(r.err) && !existsSync(p.at("cracks.jsonl"));
  return { ok, why: `no axis and no prompt record → exit ${r.code} · ${/his words are not on disk/.test(r.err) ? "\"his words are not on disk\"" : `said: ${fold(r.err).slice(0, 100)}`}` };
});

await clause("G4", () => {
  const cases = [];
  const expect = (name, p, re, sid = WSID) => {
    const r = p.node("forge_session.mjs", ["crack"], { sid });
    const ok = r.code === 1 && re.test(r.err) && !existsSync(p.at("cracks.jsonl"));
    cases.push(`${name} ${ok ? "refused" : `NOT REFUSED (exit ${r.code}${existsSync(p.at("cracks.jsonl")) ? ", a row written" : ""})`}`);
    return ok;
  };
  const mk = (n) => { const p = plant(`g4${n}`); return open(p, { axis: "c", moments: ["check_q"] }).ok ? p : null; };
  const a = mk("a"); if (!a) return { ok: false, why: "setup (a)" };
  const okA = expect("(a) no record", a, /his words are not on disk/);
  const b = mk("b"); if (!b) return { ok: false, why: "setup (b)" };
  b.prompt(SAID, new Date(Date.parse(b.json("forge_session.json").started_at) - 60000));
  const okB = expect("(b) before the session", b, /his words are not on disk/);
  const c = mk("c"); if (!c) return { ok: false, why: "setup (c)" };
  c.prompt("   ", later());
  const okC = expect("(c) blank", c, /his words are not on disk/);
  const d = mk("d"); if (!d) return { ok: false, why: "setup (d)" };
  d.prompt(SAID, later(), { consumed_at: later(2).toISOString() });
  const okD = expect("(d) consumed", d, /already consumed by its Stop/);
  const e = mk("e"); if (!e) return { ok: false, why: "setup (e)" };
  e.write("teaching_audit_last.json", { prompt: { text: "runner: a parallel session's prompt", step: 3, session_id: OTHER, at: later().toISOString() }, checked_rules: [] });
  const okE = expect("(e) another session's slot, none of his own", e, /his words are not on disk/, HOST);
  return { ok: okA && okB && okC && okD && okE, why: cases.join(" · ") };
});

await clause("G5", () => {
  const p = plant("g5"); const o = open(p, { axis: "d" }); if (!o.ok) return o;
  p.prompt(SAID, later());
  const files = ["forge_session.json", "forge_sessions.jsonl", "resume_pointer.jsonl", "relocks.jsonl", "teaching_audit_last.json"];
  const before = files.map((f) => sha(p.at(f)));
  const r = p.run("crack");
  const after = files.map((f) => sha(p.at(f))), rows = p.cracks() || [];
  const moved = files.filter((f, i) => before[i] !== after[i]);
  return { ok: rows.length === 1 && moved.length === 0, why: `crack exit ${r.code} · rows ${rows.length} · ${moved.length ? `MOVED: ${moved.join(", ")}` : `${files.length} file(s) byte-equal (absent stays absent)`}` };
});

// the gate's transcript shape (teaching_gate.mjs selftest's own clean turn): boot, his prompt, the tools, the clean reply
const J = (o) => JSON.stringify(o);
const U = (t) => J({ type: "user", message: { role: "user", content: t } });
const TXT = (t) => J({ type: "assistant", message: { content: [{ type: "text", text: t }] } });
const TOOL = (name, input) => J({ type: "assistant", message: { content: [{ type: "tool_use", name, input }] } });
const BASH = (command) => TOOL("Bash", { command });
const GOOD = ["pointer set · check_q declared", "**Tokenization › axis c › pair-merge**",
  "Dukaan mein sabse zyada bikne wali cheez ko ek hi shelf milti hai — wahi idea yahan hai.",
  "`merge`: do sabse common padosi pieces ko ek naya piece bana dena.",
  "In English: BPE repeatedly merges the most frequent adjacent pair into a new token.", "",
  "Toh \"tea tea teen\" mein pehla merge kaunsa pair hoga — samajh aaya, haan ya nahi?"].join("\n");
const TX = [U("<command-message>learn</command-message> <command-name>/learn</command-name>"), BASH("node scripts/learn_digest.mjs"), BASH("node scripts/forge_session.mjs resume"),
  BASH("node scripts/sitting.mjs open --surface code --no-spawn --task \"tokenization axis c\""), U("ok"),
  TOOL("mcp__visualize__show_widget", { title: "pair_merge", widget_code: "<style>.w{font-family:Lexend;max-width:34em}</style><div class=w>tea tea teen: sabse common padosi pair</div>" }),
  BASH("node scripts/forge_session.mjs moment check_q"), BASH("node scripts/forge_session.mjs crack"), TXT(GOOD)].join("\n");
/** gapPlant — his prompt through the real hook (session HOST), then `crack` as HOST on axis d with no moment: one gap row */
function gapPlant(name) {
  const p = plant(name); const o = open(p, { axis: "d" }); if (!o.ok) return { p, o };
  const h = p.hook(HOST, { hook_event_name: "UserPromptSubmit", prompt: SAID });
  const k = p.node("forge_session.mjs", ["crack"], { sid: HOST });
  p.write("sitting.json", { id: "sit_witness", closed_at: null, host_session_id: HOST });
  p.write("teaching_gate.jsonl", J({ ts: new Date().toISOString(), session: HOST, decision: "allow", reds: [], d_checked: true }) + "\n");
  const tx = join(p.dir, "his-transcript.jsonl"); writeFileSync(tx, TX + "\n");
  return { p, o: { ok: h.code === 0 && k.code === 0, why: `prompt hook exit ${h.code} · crack exit ${k.code}: ${fold(k.all).slice(0, 140)}` }, tx };
}
const gateRows = (p) => lines(text(p.at("teaching_gate.jsonl")) || "").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return {}; } });

await clause("G6", async () => {
  const { p, o, tx } = gapPlant("g6"); if (!o.ok) return o;
  const row = (p.cracks() || [])[0] || {};
  const G = await imp(p.dir, "teaching_gate.mjs");
  const stop = (dir, sid = HOST) => G.stopHook({ raw: J({ hook_event_name: "Stop", session_id: sid, transcript_path: tx, last_assistant_message: GOOD }), env: {}, dir });
  // the control: the same plant with no crack row
  const c = gapPlant("g6-control"); if (!c.o.ok) return c.o;
  rmSync(c.p.at("cracks.jsonl"), { force: true });
  const ctl = stop(c.p.state);
  const d1 = stop(p.state);
  const log1 = gateRows(p).at(-1) || {};
  const d2 = stop(p.state);
  const reds1 = d1.reds || [], rest = reds1.filter((x) => x !== "C.crack-gap").sort().join(","), ctlReds = (ctl.reds || []).slice().sort().join(",");
  const detail = String(((d1.detail || d1.why || {})["C.crack-gap"]) || "");
  const named = reds1.includes("C.crack-gap") && detail.includes(String(row.id)) && /the teacher's miss/.test(detail);
  const noBlock = d1.decision === ctl.decision && rest === ctlReds;
  const latched = Array.isArray(log1.crack_gaps) && log1.crack_gaps.includes(row.id) && !(d2.reds || []).includes("C.crack-gap");
  // another session's gap row never reds this session's turn
  const x = gapPlant("g6-other"); if (!x.o.ok) return x.o;
  x.p.write("cracks.jsonl", (text(x.p.at("cracks.jsonl")) || "").split(/\r?\n/).filter((l) => l.trim()).map((l) => J({ ...JSON.parse(l), prompt_session_id: OTHER })).join("\n") + "\n");
  const dx = stop(x.p.state);
  const okOther = !(dx.reds || []).includes("C.crack-gap");
  return { ok: !!row.gap && named && noBlock && latched && okOther,
    why: `gap row ${row.gap || "NONE"} · red ${reds1.includes("C.crack-gap") ? "C.crack-gap" : "ABSENT"}${named ? " naming the row" : ""} · decision ${d1.decision} vs control ${ctl.decision}, other reds ${noBlock ? "equal" : `DIFFER (${rest} vs ${ctlReds})`} · log crack_gaps ${JSON.stringify(log1.crack_gaps || null)} · second Stop ${(d2.reds || []).includes("C.crack-gap") ? "RED AGAIN" : "quiet (latched)"} · another session's row ${okOther ? "quiet" : "REDS"}` };
});

await clause("G7", async () => {
  const { p, o } = gapPlant("g7"); if (!o.ok) return o;
  const row = (p.cracks() || [])[0] || {};
  const s = p.hook(HOST, { hook_event_name: "Stop", last_assistant_message: GOOD });
  const log = lines(text(p.at("teaching_audit.jsonl")) || "").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return {}; } }).filter((r) => r.session_id === HOST);
  const last = log.at(-1) || {};
  const i = (last.drifts || []).indexOf("crack-gap");
  const ev = i >= 0 ? String((last.evidence || [])[i] || "") : "";
  const staged = (last.staged || []).some((x) => x && x.rule === "crack-gap");
  const A = await imp(p.dir, "teaching_audit.mjs");
  // forks row 1281 (3): the ONE seed row is in teaching_contract.mjs and the declared gap is gone; the contract CLI on an
  // empty planted state lists the rule, and its autohit counts it (exit 0)
  const seeded = (text(join(p.dir, "scripts", "teaching_contract.mjs")) || "").includes('r("crack-gap"');
  const list = p.node("teaching_contract.mjs", ["list"]), hit = p.node("teaching_contract.mjs", ["autohit", "crack-gap", "--why", "witness plant"]);
  const cli = list.code === 0 && /crack-gap/.test(list.out) && hit.code === 0 && /"crack-gap" auto-counted/.test(hit.out);
  const declared = Array.isArray(A.CHECKED_RULES) && A.CHECKED_RULES.includes("crack-gap") && seeded && Array.isArray(A.SEED_GAP) && !A.SEED_GAP.includes("crack-gap") && cli;
  const cards = readdirSync(p.state).filter((f) => /^captains_call/i.test(f));
  const ok = s.code === 0 && i >= 0 && ev.includes(String(row.id)) && !ev.includes(SAID) && !ev.includes(fold(SAID)) && staged && declared && cards.length === 0;
  return { ok, why: `stop hook exit ${s.code} · drifts [${(last.drifts || []).join(",")}] · evidence ${i >= 0 ? (ev.includes(String(row.id)) ? "names the row" : "NO ROW") : "-"}${ev.includes(SAID) ? " · HIS WORDS IN EVIDENCE" : ""} · staged ${staged} · rule ${declared ? "seeded, the contract CLI lists and auto-counts it" : `NOT WIRED (seed ${seeded} · SEED_GAP ${Array.isArray(A.SEED_GAP) && A.SEED_GAP.includes("crack-gap") ? "still declares it" : "clear"} · list exit ${list.code} · autohit exit ${hit.code})`} · cards ${cards.length}` };
});

/** archiveTurn — the word lane of the archive for one IST day: records [{rid, at, role, text}] */
async function archive(p, recs, concept = "tokenization", sid = "sess-witness") {
  const N = await imp(p.dir, "notes_compiler.mjs");
  const arc = join(p.dir, "archive");
  const byDay = new Map();
  for (const r of recs) { const D = N.noteDay({ ts: r.at.toISOString() }); if (!byDay.has(D)) byDay.set(D, []); byDay.get(D).push(r); }
  for (const [D, rs] of byDay) {
    const [y, m, d] = D.split("-"), laneDir = join(arc, "data", "afferent", y, m); mkdirSync(laneDir, { recursive: true });
    writeFileSync(join(laneDir, `${d}.jsonl`), rs.map((r) => J({ rid: r.rid, ts_utc: r.at.toISOString(), payload: { source: r.role === "him" ? "claude-code" : "claude-code-teaching", text: r.text, session_id: sid, moment: { forge_concept: concept } } })).join("\n") + "\n");
  }
  // unit mg9 (forks rows 1314 (2) / 1315 (4)): the latest record time planted, so the compile is never handed a clock before it
  return { N, arc, lastAt: recs.reduce((m, r) => Math.max(m, r.at.getTime()), 0) };
}
const DIFF = "```diff\n- ek word = ek token\n+ ek word = ek ya zyada tokens (subwords)\n```\nKahan atke the?";
// unit mg9 (forks rows 1314 (2) / 1315 (4)) — THE WITNESS'S OWN WAIT, STRUCK IN PLACE (never deleted). It read:
//   ~~const compile = (N, p, arc, D) => N.compileDay({ date: D, stateDir: p.state, path: join(p.state, "compiled_notes.jsonl"), root: arc, guard: () => ({ ran: false, ok: true, why: "witness: no guard on a plant" }) });~~
//   compileDay read its OWN clock (`now()`), and the records planted for it are stamped up to 40 ms in the FUTURE
//   (`later(20)`, `later(40)`): a machine that reached the compile in under 20 ms dropped them (exchanges.mjs drops a record
//   after `now`), so G9 (ii) read NOT PLACED and G8 lost its diff — a race in the witness, not the product (ci/mcrk2/G9_50.txt).
// NOW the compile is handed a clock no earlier than the last record planted for it (and never before the real time):
const compile = (N, p, arc, D, lastAt = 0) => N.compileDay({ date: D, stateDir: p.state, path: join(p.state, "compiled_notes.jsonl"), root: arc,
  now: () => new Date(Math.max(Date.now(), lastAt + 1)), guard: () => ({ ran: false, ok: true, why: "witness: no guard on a plant" }) });
const liveNotes = (N, p, D) => N.noteState(N.readRows(join(p.state, "compiled_notes.jsonl"))).live.filter((n) => N.noteDay(n) === D);

await clause("G8", async () => {
  const p = plant("g8"); const o = open(p, { axis: "c" }); if (!o.ok) return o;
  const q = new Date(), prm = later(5);
  p.prompt(SAID, prm);
  const r = p.run("crack");
  const tDiff = later(10);
  const { N, arc, lastAt } = await archive(p, [{ rid: "rid-g8-1", at: q, role: "teacher", text: "Ek word kitne tokens banata hai?" }, { rid: "rid-g8-2", at: prm, role: "him", text: SAID }, { rid: "rid-g8-3", at: tDiff, role: "teacher", text: DIFF }]);
  const D = N.noteDay({ ts: tDiff.toISOString() });
  const c = compile(N, p, arc, D, lastAt);
  const note = liveNotes(N, p, D).find((n) => n.concept === "tokenization" && n.axis === "c");
  const it = note ? (note.note.items || []).find((x) => x.kind === "crack" && x.crack_id) : null;
  const gapLine = note ? (note.note.gaps || []).some((g) => /the teacher's miss, not his/.test(g) && it && g.includes(it.crack_id)) : false;
  const ok = r.code === 0 && c.ok === true && !!it && it.moment === "undeclared" && it.words === SAID && it.gap === "moment-undeclared" && it.galat.length > 0 && gapLine;
  return { ok, why: `crack exit ${r.code} · compile ${c.ok ? (c.results || []).map((x) => x.op).join("/") || "nothing" : `refused (${c.why})`} · crack item ${it ? `moment ${it.moment} · words ${it.words === SAID ? "his" : "ABSENT"} · gap ${it.gap} · diff ${it.galat.length ? "kept" : "EMPTY"}` : "ABSENT"} · GAPS ${gapLine ? "names the teacher's miss" : "SILENT"}` };
});

await clause("G9", async () => {
  const out = [];
  // (i) a window of his session contains his prompt: the session's axis b window is open, current_axis cleared (an old build)
  const a = plant("g9i"); if (!open(a, { axis: "b" }).ok) return { ok: false, why: "setup (i)" };
  a.write("forge_session.json", { ...a.json("forge_session.json"), current_axis: null });
  const pA = later(5); a.prompt(SAID, pA);
  const ka = a.run("crack"), ra = (a.cracks() || [])[0] || {};
  const tA = later(10);
  const A = await archive(a, [{ rid: "rid-g9i-1", at: pA, role: "him", text: SAID }, { rid: "rid-g9i-2", at: tA, role: "teacher", text: DIFF }]);
  const DA = A.N.noteDay({ ts: tA.toISOString() }); const cA = compile(A.N, a, A.arc, DA, A.lastAt);
  const nA = liveNotes(A.N, a, DA).find((n) => n.axis === "b"), iA = nA ? (nA.note.items || []).find((x) => x.crack_id === ra.id) : null;
  const okI = ka.code === 0 && ra.axis === "none" && !!iA && iA.axis_settled && iA.axis_settled.axis === "b" && /^axis window /.test(iA.axis_settled.by) && iA.words === SAID;
  out.push(`(i) ${okI ? "window → axis b" : `NOT PLACED (crack exit ${ka.code}, axis ${ra.axis}, note b ${nA ? "yes" : "no"}, ${cA.cracks || ""})`}`);
  // (ii) one `axis c now` inside the turn (after the crack call, before his next record)
  const b = plant("g9ii"); if (!open(b).ok) return { ok: false, why: "setup (ii)" };
  const pB = later(5); b.prompt(SAID, pB);
  const kb = b.run("crack"), rb = (b.cracks() || [])[0] || {};
  const ax = b.run("axis", "c", "now");
  const tB = later(20), nB0 = later(40);
  const B = await archive(b, [{ rid: "rid-g9ii-1", at: pB, role: "him", text: SAID }, { rid: "rid-g9ii-2", at: tB, role: "teacher", text: DIFF }, { rid: "rid-g9ii-3", at: nB0, role: "him", text: "achha, toh subwords" }]);
  const DB = B.N.noteDay({ ts: tB.toISOString() }); compile(B.N, b, B.arc, DB, B.lastAt);
  const nB = liveNotes(B.N, b, DB).find((n) => n.axis === "c"), iB = nB ? (nB.note.items || []).find((x) => x.crack_id === rb.id) : null;
  const okII = kb.code === 0 && ax.code === 0 && rb.axis === "none" && !!iB && iB.axis_settled && iB.axis_settled.axis === "c" && /declared in the turn/.test(iB.axis_settled.by);
  out.push(`(ii) ${okII ? "declared in the turn → axis c" : `NOT PLACED (crack exit ${kb.code}, axis ${rb.axis}, note c ${nB ? "yes" : "no"})`}`);
  // (iii) no axis in the ledger; two axes in the turn → in no note, named unplaced
  const c = plant("g9iii"); if (!open(c).ok) return { ok: false, why: "setup (iii)" };
  const pC = later(5); c.prompt(SAID, pC);
  const kc = c.run("crack"), rc = (c.cracks() || [])[0] || {};
  const C = await archive(c, [{ rid: "rid-g9iii-1", at: pC, role: "him", text: SAID }]);
  const DC = C.N.noteDay({ ts: pC.toISOString() }); const cC = compile(C.N, c, C.arc, DC, C.lastAt);
  const unC = (cC.unplaced || []).find((u) => u.id === rc.id);
  const inNoteC = liveNotes(C.N, c, DC).some((n) => (n.note.items || []).some((x) => x.crack_id === rc.id));
  const okIII = kc.code === 0 && !!unC && /no axis in the pacer ledger of its turn/.test(unC.why) && String(cC.cracks || "").includes(`${rc.id} (`) && !inNoteC;
  out.push(`(iii) none ${okIII ? "named unplaced" : `NOT NAMED (crack exit ${kc.code}, ${cC.cracks || "no cracks line"})`}`);
  const d = plant("g9iv"); if (!open(d).ok) return { ok: false, why: "setup (iv)" };
  const pD = later(5); d.prompt(SAID, pD);
  const kd = d.run("crack"), rd = (d.cracks() || [])[0] || {};
  d.run("axis", "c", "now"); d.run("axis", "d", "now");
  const tD = later(20), nD0 = later(40);
  const Dd = await archive(d, [{ rid: "rid-g9iv-1", at: pD, role: "him", text: SAID }, { rid: "rid-g9iv-2", at: tD, role: "teacher", text: DIFF }, { rid: "rid-g9iv-3", at: nD0, role: "him", text: "hmm" }]);
  const DD = Dd.N.noteDay({ ts: tD.toISOString() }); const cD = compile(Dd.N, d, Dd.arc, DD, Dd.lastAt);
  const unD = (cD.unplaced || []).find((u) => u.id === rd.id);
  const inNoteD = liveNotes(Dd.N, d, DD).some((n) => (n.note.items || []).some((x) => x.crack_id === rd.id));
  const okIV = kd.code === 0 && !!unD && /two axes declared in its turn/.test(unD.why) && !inNoteD;
  out.push(`(iv) two axes ${okIV ? "named unplaced" : `NOT NAMED (crack exit ${kd.code}, ${cD.cracks || "no cracks line"})`}`);
  return { ok: okI && okII && okIII && okIV, why: out.join(" · ") };
});

await clause("G10", async () => {
  const p = plant("g10"); const o = open(p, { axis: "d" }); if (!o.ok) return o;
  p.prompt(SAID, later());
  const r = p.run("crack");
  const F = await imp(p.dir, "forge_session.mjs");
  const back = F.readCracks(p.at("cracks.jsonl"));
  const w = back.rows && back.rows[0];
  // forks row 1281 (6): the close report's crack count names the gaps beside it
  const cl = p.run("close", "--no-rep-why", "witness plant: nothing is banked in a plant"), suffix = /cracks this session: 1 \(one row per broken answer[^\n]*\(1 with a named gap — the teacher's miss/.test(cl.out);
  const ok = r.code === 0 && !!w && w.kind === "crack" && w.gap === "moment-undeclared" && back.rows.length === 1 && /· GAP moment-undeclared \(the teacher's miss/.test(r.out) && !r.out.includes(SAID) && suffix && !cl.out.includes(SAID);
  return { ok, why: `crack exit ${r.code} · readCracks ${w ? `kind ${w.kind} gap ${w.gap}` : "NO ROW"} · the verb line ${/· GAP moment-undeclared/.test(r.out) ? "prints GAP" : "SILENT"}${r.out.includes(SAID) ? " · HIS WORDS ECHOED" : ""} · close report ${suffix ? "names the gap" : `SILENT (exit ${cl.code})`}` };
});

await clause("G13", async () => {
  // forks row 1281 (2), F12: no calling session id → never refused; gap session-unchecked, owner organism; the gate counts it
  // (C.crack-unchecked), the teacher's drift does not; the pacer's boolean says whether the id was present, once, no id
  const p = plant("g13"); const o = open(p, { axis: "c", moments: ["check_q"] }); if (!o.ok) return o;
  p.promptShared(SAID, later());
  const k = p.node("forge_session.mjs", ["crack"]), w = (p.cracks() || [])[0] || {};
  const q = plant("g13-teacher"); if (!open(q, { axis: "d" }).ok) return { ok: false, why: "setup (teacher+organism)" };
  q.promptShared(SAID, later());
  const kq = q.node("forge_session.mjs", ["crack"]), wq = (q.cracks() || [])[0] || {};
  const okRow = k.code === 0 && w.words === SAID && w.gap === "session-unchecked" && w.gap_owner === "organism"
    && kq.code === 0 && wq.gap === "moment-undeclared+session-unchecked" && wq.gap_owner === "teacher+organism";
  const G = await imp(p.dir, "teaching_gate.mjs"), A = await imp(p.dir, "teaching_audit.mjs");
  const sit = { id: "sit_witness", closed_at: null, host_session_id: HOST };
  const d = G.decide({ payload: { session_id: HOST, transcript_path: "x", last_assistant_message: GOOD }, sitting: sit, forge: p.json("forge_session.json"), transcript: TX, logRows: [{ session: HOST, d_checked: true }], env: {}, cracks: [{ ...w, prompt_session_id: HOST }] });
  const okGate = (d.reds || []).includes("C.crack-unchecked") && !(d.reds || []).includes("C.crack-gap") && d.decision === "allow";
  const okDrift = typeof A.crackGapDrift === "function" && A.crackGapDrift({ rows: [w], sessionId: w.prompt_session_id, promptAt: w.prompt_at }) === null
    && !!A.crackGapDrift({ rows: [wq], sessionId: wq.prompt_session_id, promptAt: wq.prompt_at });
  // the pacer's boolean: written at start, as a boolean only, never the id
  const n = plant("g13-absent"); n.node("forge_session.mjs", ["start", "tokenization"]);
  const sNo = n.json("forge_session.json") || {};
  const y = plant("g13-present"); y.node("forge_session.mjs", ["start", "tokenization"], { sid: HOST });
  const sYes = y.json("forge_session.json") || {};
  const yRaw = text(y.at("forge_session.json")) || "";
  const okPacer = sNo.calling_session_id_present === false && sYes.calling_session_id_present === true && !yRaw.includes(HOST);
  return { ok: okRow && okGate && okDrift && okPacer,
    why: `no id → exit ${k.code} gap ${w.gap} owner ${w.gap_owner} words ${w.words === SAID ? "kept" : "LOST"} · with a teacher gap → ${wq.gap} (${wq.gap_owner}) · gate ${okGate ? "counts C.crack-unchecked, allows" : `reds [${(d.reds || []).join(",")}] ${d.decision}`} · teacher drift ${okDrift ? "only for the teacher's part" : "WRONG"} · pacer boolean ${sNo.calling_session_id_present}/${sYes.calling_session_id_present}${yRaw.includes(HOST) ? " · THE ID WRITTEN" : ""}` };
});

await clause("G12", () => {
  const src = (text(join(TREE, "scripts", "forge_session.mjs")) || "").replace(/\r\n/g, "\n");
  const disp = src.slice(src.indexOf("switch (mode" + ") {"));
  const aC = disp.indexOf('    case "' + 'crack":'), blk = aC < 0 ? "" : disp.slice(aC, disp.indexOf('\n    case "', aC + 8)).split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  const door = /readHisPrompt\w*\(\{\s*since:[^}]*sessionId:\s*process\.env\.CLAUDE_CODE_SESSION_ID[^}]*fresh:\s*true\s*\}/.test(blk) && !/loadAuditLast\(/.test(blk) && !/\.prompt\b/.test(blk);
  // his own record wins over another session's shared slot
  const p = plant("g12"); if (!open(p, { axis: "c", moments: ["check_q"] }).ok) return { ok: false, why: "setup" };
  const h = p.hook(HOST, { hook_event_name: "UserPromptSubmit", prompt: SAID });
  p.hook(OTHER, { hook_event_name: "UserPromptSubmit", prompt: "architect: read the row and rule the fork" });
  const k = p.node("forge_session.mjs", ["crack"], { sid: HOST }), w = (p.cracks() || [])[0] || {};
  const own = h.code === 0 && k.code === 0 && w.words === SAID && w.prompt_session_id === HOST;
  return { ok: door && own, why: `the crack case ${door ? "reads only through readHisPrompt (since, the calling session id, fresh)" : "READS THE RECORD ITSELF"} · his own record over another session's slot ${own ? "→ his words" : `→ exit ${k.code}, words ${w.words === SAID ? "his" : "NOT HIS"}`}` };
});

await clause("MCRK CARRY", () => {
  const cw = join(TREE, "ci", "witness", "mcrk", "witness_crack.mjs");
  const src = text(cw) || "";
  const k3 = src.slice(src.indexOf('await clause("K3", () => {'), src.indexOf('await clause("K3b", () => {'));
  const cites = /row 1243/.test(k3) && !/no axis is ON/.test(k3) && !/no moment declared on axis/.test(k3);
  // the parent env carries a planted seat session id: the narrowed witness's children must not inherit it
  const env = { ...envOf(null), CLAUDE_CODE_SESSION_ID: "sess-seat-planted-mcrk2" };
  const r = spawnSync(process.execPath, [cw, "plants", "--tree", TREE, "--tmp", TMP], { cwd: TMP, env, encoding: "utf8", windowsHide: true });
  const last = lines(r.stdout).filter((l) => /^PLANTS mcrk · \d+ of \d+/.test(l)).pop() || "";
  const m = /· (\d+) of (\d+) plant/.exec(last);
  const green = r.status === 0 && !!m && m[1] === m[2] && Number(m[2]) > 0;
  return { ok: cites && green, why: `K3 ${cites ? "narrowed, cites row 1243" : "NOT NARROWED"} · ${last || `exit ${r.status}, no PLANTS line`}` };
});

if (OWN_TMP) { try { rmSync(TMP, { recursive: true, force: true }); } catch { /* a survivor holds a file */ } }
const k = results.filter((r) => r.ok).length;
console.log(`PLANTS mcrk2 · ${k} of ${results.length} plant(s) as expected`);
process.exit(results.length > 0 && k === results.length ? 0 : 1);
