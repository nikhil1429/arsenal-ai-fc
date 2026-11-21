#!/usr/bin/env node
// ============================================================================
// ci/mbank/witness_mbank.mjs — UNIT mbank · THE BANK LINE TAKES HIS SPOKEN WORDS FROM THE PROMPT RECORD, ONE DOOR, A TURN ID
//   MINTED BY THE RECORD'S OWNER (forks rows 1189 (1) / 1194 / 1230)
// ----------------------------------------------------------------------------
//   node ci/mbank/witness_mbank.mjs --org <dir> --base-org <dir> [--only "<id>,…"]
// CONTRACT (judged on --org; the build reads GREEN, the base ci/mbank/BASE reads RED). The clause logic lives in ONE file,
// the clause witness ci/witness/mbank/witness_bank.mjs (plants on copies under os.tmpdir(); its header is its contract):
// this file runs it over --org AND over --base-org, and a clause is GREEN here only when it is GREEN on --org and RED on
// --base-org — never a pass-through: a clause that also passes on the base proves nothing and reads RED here. Without
// --base-org the base leg is not run and the line says so (the clause still has to be GREEN on --org). The clause witness
// is read from this file's own repository when it is there (a seat run from a checkout), else from --org.
//   B1 WORDS · B2 DRIFT · B3 ABSENT · B4 WHOLE · B5 GUT · B6 HEDGE · B7 TURN · B8 STDIN · B9 ONE DOOR · B10 ONCE ·
//   B11 READERS · B12 MCRK · B13 STAMP · B14 MINT · B15 PARALLEL · B16 AUDIT · B17 CRACK · B18 CLOCK · B19 BANKLINE — the clause witness's own, one line each (its header names each plant)
//   B20 LANE  (forks row 1265, mbank-10 a; a seat clause of THIS file, never of the clause witness, whose plants run in
//             mf2's hermetic copies where a LIVE lane must not execute) on a COPY of each tree (scripts, learning-layer,
//             package.json, its tracked dressing-room only, node_modules linked): `organism_test.mjs path` (the full profile,
//             its own sandbox) reads `ok` on each of the NINE A3 asserts of the zero-tax lane, AND a typed `--said` with no
//             prompt record is REFUSED at the code door on that same tree. RED on the old lane (6e5dca6: the nine FAIL), RED
//             on a base whose door banks a typed copy; GREEN on the build. The lane's own mirror.mjs step reaches the network
//             exactly as the suite's full profile does; this clause adds no port, no service, no POST
//   BOUND     only the named files differ between --base-org and --org (scripts/forge_session.mjs · scripts/teaching_audit.mjs ·
//             scripts/gaffer_brain.mjs · scripts/study_scope.mjs · scripts/teaching_bar.mjs · scripts/learn_digest.mjs ·
//             scripts/teaching_gate.mjs · scripts/notes_compiler.mjs · scripts/intent.mjs · scripts/organism_test.mjs (the A3
//             block of the path lane only, row 1265) · .claude/skills/forge/SKILL.md ·
//             .claude/skills/forge/REFERENCE.md · .claude/skills/learn/REFERENCE.md · ci/witness/mbank/ · ci/mbank/), by text,
//             CRLF folded
//   LAST      no node process naming this run's temp dir survives
// THE PORT CLASS (row 1053): no port is bound, no service is named, nothing is POSTed, nothing restarts, no model is
// called (the clause witness puts a refusing `claude` / `gemini` shim first on its PATH). Every wait is a child's exit;
// the outer bound is the caller's. Runs on Windows too: no POSIX-only shell, every read split on \r?\n, no git repo is
// planted here (a repo the caller plants for --org / --base-org is made with core.autocrlf=false).
// LAST LINE: GREEN MBANK <what> · <n> clause(s) (exit 0) or RED MBANK · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, readFileSync, existsSync, rmSync, readdirSync, mkdirSync, cpSync, symlinkSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const UNIT = "MBANK", HERE = dirname(fileURLToPath(import.meta.url));
const NAMED = (f) => ["scripts/forge_session.mjs", "scripts/teaching_audit.mjs", "scripts/gaffer_brain.mjs", "scripts/study_scope.mjs",
  "scripts/teaching_bar.mjs", "scripts/learn_digest.mjs", "scripts/teaching_gate.mjs", "scripts/notes_compiler.mjs", "scripts/intent.mjs", "scripts/organism_test.mjs",
  ".claude/skills/forge/SKILL.md", ".claude/skills/forge/REFERENCE.md", ".claude/skills/learn/REFERENCE.md"].includes(f) || /^ci\/(witness\/mbank|mbank)\//.test(f);
const TMP = mkdtempSync(join(tmpdir(), "mbank-witness-"));
const results = [];
const record = (id, ok, why) => { if (ONLY && !ONLY.includes(id) && id !== "LAST") return; results.push({ id, ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id}${why ? ` · ${why}` : ""}`); };

const CW = [join(HERE, "..", "witness", "mbank", "witness_bank.mjs"), join(ORG, "ci", "witness", "mbank", "witness_bank.mjs")].find((p) => existsSync(p)) || null;
console.log(`witness mbank · org ${ORG}${BASE ? ` · base ${BASE}` : ""} · clause witness ${CW || "ABSENT"}`);
const IDS = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11", "B12", "B13", "B14", "B15", "B16", "B17", "B18", "B19"];
const want = IDS.filter((id) => !ONLY || ONLY.includes(id));
const runOn = (tree) => {
  const r = spawnSync(process.execPath, [CW, "plants", "--tree", tree, "--tmp", TMP, ...(ONLY ? ["--only", want.join(",")] : [])], { cwd: TMP, encoding: "utf8", windowsHide: true });
  const got = new Map();
  for (const l of String(r.stdout || "").split(/\r?\n/)) { const m = /^CLAUSE (.+?) (GREEN|RED)(?: · (.*))?$/.exec(l); if (m) got.set(m[1], { ok: m[2] === "GREEN", why: m[3] || "" }); }
  const tail = String(r.stdout || "").split(/\r?\n/).filter(Boolean).pop() || `(no output; exit ${r.status})`;
  return { got, tail };
};
if (!CW) for (const id of want) record(id, false, "the clause witness ci/witness/mbank/witness_bank.mjs is in neither this checkout nor --org");
else if (want.length) {
  const head = runOn(ORG), base = BASE ? runOn(BASE) : null;
  for (const id of want) {
    const h = head.got.get(id), b = base ? base.got.get(id) : null;
    if (!h) { record(id, false, `not reported on --org (${head.tail.slice(0, 120)})`); continue; }
    if (!base) { record(id, h.ok, `org ${h.ok ? "GREEN" : "RED"} · base leg NOT RUN (no --base-org)${h.ok ? "" : ` · ${h.why.slice(0, 160)}`}`); continue; }
    if (!b) { record(id, false, `not reported on --base-org (${base.tail.slice(0, 120)})`); continue; }
    record(id, h.ok && !b.ok, `org ${h.ok ? "GREEN" : "RED"} · base ${b.ok ? "GREEN (a pass-through: the clause proves nothing)" : "RED"}${h.ok ? "" : ` · ${h.why.slice(0, 160)}`}`);
  }
}

// ── B20 LANE ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const NINE = ["A3 · ONE command banks an answer from a Code session", "A3 · a `--surface code` bank with NO axis is refused AT THE BANK DOOR",
  "A3 · the axis closes on his Bolo row + the interview line", "A3 · STEP 10 is STILL refused while the axes he closed were never GRILLED",
  "A3 · a jirah row nobody JUDGED is a question asked, not a grade", "A3 · STEP 10 opens once every done axis carries a JUDGED jirah row",
  "A3 · `close` refuses while banked answers carry no verdict", "A3 · once every banked answer has a verdict the close goes through",
  "A3 · a bypassed gate costs the session its method_clean"];
const laneEnv = () => { const e = { ...process.env }; for (const k of Object.keys(e)) if (/^ARSENAL_/i.test(k) || k === "CLAUDE_CODE_SESSION_ID" || k === "ORGANISM_TEST_PROFILE") delete e[k];
  e.TMPDIR = e.TEMP = e.TMP = TMP; return e; };
let laneSeq = 0;
function laneCopy(tree) {
  const d = join(TMP, `lane-${++laneSeq}`); mkdirSync(d, { recursive: true });
  for (const p of ["scripts", "learning-layer", "package.json"]) if (existsSync(join(tree, p))) cpSync(join(tree, p), join(d, p), { recursive: true });
  // his state is never copied: a git work tree gives only its TRACKED dressing-room files; an exported tree is tracked files only
  if (existsSync(join(tree, ".git"))) {
    const ls = spawnSync("git", ["-C", tree, "ls-files", "-z", "dressing-room"], { encoding: "utf8", windowsHide: true });
    for (const f of String(ls.stdout || "").split("\0").filter(Boolean)) { mkdirSync(dirname(join(d, f)), { recursive: true }); cpSync(join(tree, f), join(d, f)); }
  } else if (existsSync(join(tree, "dressing-room"))) cpSync(join(tree, "dressing-room"), join(d, "dressing-room"), { recursive: true });
  const nm = [join(tree, "node_modules"), join(HERE, "..", "..", "node_modules")].find((x) => existsSync(x));
  if (nm) symlinkSync(nm, join(d, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return d;
}
function lane(tree) {
  const d = laneCopy(tree);
  const r = spawnSync(process.execPath, [join(d, "scripts", "organism_test.mjs"), "path"], { cwd: d, env: laneEnv(), encoding: "utf8", windowsHide: true });
  const L = String(r.stdout || "").split(/\r?\n/);
  const nine = NINE.map((n) => ({ n, ok: L.some((l) => l.startsWith(`  ok   ${n}`)) }));
  // the door on the same tree, typed copy, no record: refused, nothing banked
  const st = join(d, "dressing-room", "state"); mkdirSync(st, { recursive: true });
  for (const f of ["teaching_audit_last.json", "gaffer_grade_queue.jsonl"]) rmSync(join(st, f), { force: true });
  const t = spawnSync(process.execPath, [join(d, "scripts", "gaffer_brain.mjs"), "capture", "voice_rep", "tokenization:a", "--axis", "a", "--gut", "knew",
    "--asked", "Pehla merge kaunsa pair hota hai?", "--said", "a typed copy of his answer", "--surface", "code"], { cwd: d, env: laneEnv(), input: "", encoding: "utf8", windowsHide: true });
  const closed = t.status === 1 && !existsSync(join(st, "gaffer_grade_queue.jsonl"));
  return { nine, closed, head: L.filter((l) => l.startsWith("organism_test:")).pop() || `(no headline; exit ${r.status})` };
}
if (!ONLY || ONLY.includes("B20")) {
  const h = lane(ORG), b = BASE ? lane(BASE) : null;
  const hOk = h.nine.every((x) => x.ok) && h.closed, bOk = b ? b.nine.every((x) => x.ok) && b.closed : null;
  const fails = h.nine.filter((x) => !x.ok).map((x) => x.n.slice(5, 45));
  record("B20", hOk && (b ? !bOk : true), `org: nine ok ${h.nine.filter((x) => x.ok).length}/9 · typed copy refused ${h.closed} · ${h.head}`
    + (b ? ` | base: nine ok ${b.nine.filter((x) => x.ok).length}/9 · typed copy refused ${b.closed}${bOk ? " (a pass-through)" : ""}` : " | base leg NOT RUN")
    + (fails.length ? ` · org FAIL: ${fails.join(" / ")}` : ""));
}

const walk = (root, dir = "", o = new Map()) => {
  let ents = []; try { ents = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return o; }
  for (const e of ents) {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (!dir && (e.name === "node_modules" || e.name === ".git")) continue;
    if (e.isDirectory()) walk(root, rel, o);
    else if (e.isFile()) { const b = readFileSync(join(root, rel)); const t = b.includes(0) ? b : Buffer.from(b.toString("utf8").replace(/\r\n/g, "\n")); o.set(rel, createHash("sha256").update(t).digest("hex")); }
  }
  return o;
};
if (BASE && (!ONLY || ONLY.includes("BOUND"))) {
  const a = walk(BASE), b = walk(ORG);
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED(f));
  record("BOUND", extra.length === 0, `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 12).join(", ")}${extra.length > 12 ? ` (+${extra.length - 12})` : ""}` : ""}`);
}
try { rmSync(TMP, { recursive: true, force: true }); } catch { /* a survivor holds a file: LAST names it */ }
{
  let table = "", why = "";
  try {
    table = process.platform === "win32"
      ? execFileSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8" })
      : execFileSync("ps", ["-eo", "args"], { encoding: "utf8" });
  } catch (e) { why = `process table unreadable: ${e.message}`; }
  const left = table.split(/\r?\n/).filter((l) => l.includes(TMP) && !/\bps -eo\b/.test(l));
  record("LAST", !why && left.length === 0, why || `${left.length} survivor(s)`);
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length) { console.log(`RED ${UNIT} · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN ${UNIT} the code-surface bank keeps HIS bytes from the prompt record through one door, refuses a drifted, absent, consumed or foreign record, reads his gut-word off his message, and the bank row, the crack row and the compiled crack item carry the turn id the record's owner minted · ${results.length} clause(s)`);
process.exit(0);
