#!/usr/bin/env node
// ============================================================================
// run_mutants_mprk.mjs — unit MPRK: ONE mutant per clause of ci/mprk/witness_mprk.mjs, each must turn RED the clause that names it.
// CONTRACT:  node ci/mprk/run_mutants_mprk.mjs --org <build tree> --base-org <tree>
//   Each mutant copies <org> under os.tmpdir() (never .git; node_modules rides as a link), breaks ONE thing in the copy (a
//   tree file, or the copy's own witness source), and runs the copy's witness `--only "<its clause>"`: it must exit 1 with
//   the last line `RED MPRK · <its clause>`. The CONTROL runs the unmutated witness over <org>, every clause: it must exit 0
//   with a GREEN MPRK last line. No port is bound or typed. Every child runs with TMPDIR / TMP / TEMP under this run's temp
//   dir; after each mutant every node process naming that dir is killed (the LAST mutant plants one on purpose). Every spawn
//   is bounded by <org>'s job timeout-minutes, read from .github/workflows/suite.yml at run time, never typed.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED (exit 0 iff k = n and GREEN)
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, readdirSync, existsSync, symlinkSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const T0 = Date.now();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec((() => { try { return readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })()) || [])[1]);
if (!(jobMin > 0)) { console.log("run_mutants: 0 of 0 mutant(s) · control RED (no timeout-minutes in .github/workflows/suite.yml)"); process.exit(1); }
const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());
const TMP = mkdtempSync(join(tmpdir(), "mprkmut-"));

/** replace the first `from` (at or after `after`) with `to` in <tree>/<rel> @returns {string|null} why it failed */
const edit = (tree, rel, after, from, to) => {
  const p = join(tree, rel); let s; try { s = readFileSync(p, "utf8"); } catch { return `${rel} absent`; }
  const a = after ? s.indexOf(after) : 0; if (a < 0) return `anchor not found in ${rel}`;
  const i = s.indexOf(from, a); if (i < 0) return `site not found in ${rel}: ${from.slice(0, 60)}`;
  writeFileSync(p, s.slice(0, i) + to + s.slice(i + from.length)); return null;
};
const CC = "scripts/captains_call.mjs", AC = "scripts/acts.mjs", PK = "scripts/parked.mjs", WI = "ci/mprk/witness_mprk.mjs";
const MUTANTS = [
  { clause: "K1", what: "the `park` row dropped from acts.mjs OWNERS (renamed away)", m: (t) => edit(t, AC, null, '  park:     { organ: "parked.mjs",', '  parkOFF:  { organ: "parked.mjs",') },
  { clause: "K2", what: "captains_call.mjs writes parked.jsonl itself", m: (t) => edit(t, CC, null, 'const CALL = join(STATE_DIR, "captains_call.json");', 'const CALL = join(STATE_DIR, "captains_call.json");\nconst PARK_MUT = join(STATE_DIR, "parked.jsonl");\nif (process.env.MPRK_MUTANT_NEVER_SET) writeFileSync(PARK_MUT, "");') },
  { clause: "K3K4", what: "dealGuard ignores the fresh forge session", m: (t) => edit(t, CC, "export function dealGuard({", "if (forge && forge.concept && !forge.closed_at && !forgeIsStale(forge, now)) {", "if (false) {") },
  { clause: "K5", what: "deal emits every live park", m: (t) => edit(t, CC, 'if (mode === "deal") {', "    console.log(`🎴 CAPTAIN'S CALL${liveCount === 1 ? \"\" : ` [${c.id}]`}: ${c.line}`);",
    "    console.log(`🎴 CAPTAIN'S CALL${liveCount === 1 ? \"\" : ` [${c.id}]`}: ${c.line}`);\n    for (const x of s.cards.filter((x) => x !== c && x.source === \"parked\" && !x.answer && !x.retired_at)) console.log(`🎴 CAPTAIN'S CALL [${x.id}]: ${x.line}`);") },
  { clause: "K6", what: "the park dispatch never calls the owner's close", m: (t) => edit(t, CC, null, '[join(__dirname, "parked.mjs"), "close", action.id, "--by", action.by]', '[join(__dirname, "parked.mjs"), "status"]') },
  { clause: "K7", what: "baad writes a close row", m: (t) => edit(t, CC, "export function applyAnswer(", '  if (word === "baad") {\n',
    '  if (word === "baad") {\n    if (c.dispatch && c.dispatch.kind === "park") { try { execFileSync(process.execPath, [join(__dirname, "parked.mjs"), "close", c.dispatch.id, "--by", "na"]); } catch { } }\n') },
  { clause: "K8", what: "the park reverse returns argv:null", m: (t) => edit(t, AC, '  park:     { organ: "parked.mjs",', 'return id ? { argv: ["close", id[1], "--by", "undo"] }', 'return id ? { argv: null, why: "planted by run_mutants_mprk (K8)" }') },
  { clause: "F3", what: "park: left out of RETIRE_AT_SOURCE_KEYS", m: (t) => edit(t, CC, null, "export const RETIRE_AT_SOURCE_KEYS = [/^judge:in-doubt:[^\\s:]+$/, /^park:[^\\s:]+$/];", "export const RETIRE_AT_SOURCE_KEYS = [/^judge:in-doubt:[^\\s:]+$/];") },
  { clause: "K9", what: "parked.mjs add stamps forge_session.json", m: (t) => edit(t, PK, "export function addPark(", "  const st = stampOf(readForge(dir), now);\n", "  const st = stampOf(readForge(dir), now);\n  try { writeFileSync(forgeOf(dir), JSON.stringify(readForge(dir), null, 1)); } catch { }\n") },
  { clause: "F4", what: "the tail-only door guard dropped", m: (t) => edit(t, AC, null, '(door === "code" ? null :', '(true ? null :') },
  { clause: "F5", what: "the F5 switch shipped ON", m: (t) => edit(t, PK, null, "export const LIST_SUPERSEDED_BY_CARDS = false;", "export const LIST_SUPERSEDED_BY_CARDS = true;") },
  { clause: "SKILL", what: "forge/SKILL.md's park line names the note verb", m: (t) => edit(t, ".claude/skills/forge/SKILL.md", null, '"verb":"park"', '"verb":"note"') },
  { clause: "COVER", what: "parked's selftest unwired from its suite", m: (t) => edit(t, "package.json", null, "node scripts/parked.mjs selftest && ", "") },
  { clause: "BOUND", what: "scripts/sitting.mjs touched", m: (t) => { const p = join(t, "scripts", "sitting.mjs"); if (!existsSync(p)) return "sitting.mjs absent"; writeFileSync(p, readFileSync(p, "utf8") + "\n// planted by run_mutants_mprk (BOUND)\n"); return null; } },
  { clause: "LAST", what: "the witness leaves a node process naming its temp dir", m: (t) => {
    const e = edit(t, WI, null, 'import { spawnSync } from "node:child_process";', 'import { spawnSync, spawn as __mut } from "node:child_process";');
    return e || edit(t, WI, null, "// ── LAST ──\n{", '// ── LAST ──\n__mut(process.execPath, ["-e", "setInterval(() => {}, 1 << 30)", TMP], { detached: true, stdio: "ignore" }).unref();\n{');
  } },
];

const namingProcs = (dir) => {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true, timeout: left() });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.toLowerCase().includes(dir.toLowerCase())).map((l) => Number(l.trim().split(" ")[0])).filter((p) => p && p !== process.pid);
  }
  const out = [];
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(dir)) out.push(Number(p)); } catch { }
  }
  return out;
};
const copy = (src) => {
  const d = mkdtempSync(join(TMP, "m-"));
  cpSync(src, d, { recursive: true, verbatimSymlinks: true, filter: (p) => { const r = relative(src, p).split(/[\\/]/)[0]; return r !== ".git" && r !== "node_modules"; } });
  if (existsSync(join(src, "node_modules"))) symlinkSync(join(src, "node_modules"), join(d, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return d;
};
const witness = (tree, only) => {
  const ct = mkdtempSync(join(TMP, "ct-"));
  const env = { ...process.env, TMPDIR: ct, TMP: ct, TEMP: ct };
  const r = spawnSync(process.execPath, [join(tree, "ci", "mprk", "witness_mprk.mjs"), "--org", tree, "--base-org", BASE, ...(only ? ["--only", only] : [])], { cwd: tree, env, encoding: "utf8", timeout: left(), maxBuffer: 1 << 28, windowsHide: true });
  for (const p of namingProcs(ct)) { try { process.kill(p); } catch { } }
  const last = String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
  return { code: r.status, last };
};

let k = 0;
for (const mu of MUTANTS) {
  const t = copy(ORG);
  const e = await mu.m(t);
  const r = e ? { code: null, last: `mutation not applied: ${e}` } : witness(t, mu.clause);
  const ok = r.code === 1 && r.last === `RED MPRK · ${mu.clause}`;
  if (ok) k++;
  console.log(`${ok ? "RED  " : "MISS "} ${mu.clause} · ${mu.what} · ${r.last} (exit ${r.code})`);
  try { rmSync(t, { recursive: true, force: true }); } catch { }
}
const c = witness(ORG, null);
const cg = c.code === 0 && c.last.startsWith("GREEN MPRK ");
console.log(`control · ${c.last} (exit ${c.code})`);
for (const p of namingProcs(TMP)) { try { process.kill(p); } catch { } }
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cg ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && cg ? 0 : 1);
