#!/usr/bin/env node
// ============================================================================
// run_mutants_mhot.mjs — unit MHOT: ONE mutant per clause of ci/mhot/witness_mhot.mjs, each must turn RED the clause that names it.
// CONTRACT:  node ci/mhot/run_mutants_mhot.mjs --org <build tree> --base-org <tree>
//   Each mutant copies <org> under os.tmpdir() (node_modules rides as a link, never copied), breaks ONE thing in the copy (a
//   tree file, or the copy's own witness source), and runs the copy's witness `--only <its clause>` over the copy: it must exit
//   1 with the last line `RED MHOT · <its clause>` (BOUND and LAST always run, so they must stay green under every other
//   mutant). The CONTROL runs the unmutated witness over <org>, every clause: it must exit 0 with a GREEN MHOT last line.
//   No port is bound, nothing is POSTed, nothing restarted. Every child runs with TMPDIR / TMP / TEMP under this run's temp
//   dir; after each mutant every node process naming that dir is killed (the LAST mutant plants one on purpose). Every spawn
//   is bounded by <org>'s job timeout-minutes, read from .github/workflows/suite.yml at run time, never typed. Every git
//   repo the witness plants is made with core.autocrlf=false; this runner plants none.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED (exit 0 iff k = n and GREEN)
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, readdirSync, existsSync, mkdirSync, unlinkSync, symlinkSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const T0 = Date.now();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec((() => { try { return readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })()) || [])[1]);
if (!(jobMin > 0)) { console.log("run_mutants: 0 of 0 mutant(s) · control RED (no timeout-minutes in .github/workflows/suite.yml)"); process.exit(1); }
const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());
const TMP = mkdtempSync(join(tmpdir(), "mhotmut-"));
const CT = join(TMP, "childtmp"); mkdirSync(CT);

/** replace the first `from` (at or after `after`) with `to` in <tree>/<rel> @returns {string|null} why it failed */
const edit = (tree, rel, after, from, to) => {
  const p = join(tree, rel); let s; try { s = readFileSync(p, "utf8"); } catch { return `${rel} absent`; }
  const a = after ? s.indexOf(after) : 0; if (a < 0) return `anchor not found in ${rel}`;
  const i = s.indexOf(from, a); if (i < 0) return `site not found in ${rel}: ${from.slice(0, 60)}`;
  writeFileSync(p, s.slice(0, i) + to + s.slice(i + from.length)); return null;
};
const OT = "scripts/organism_test.mjs", W = "ci/mhot/witness_mhot.mjs";
const MUTANTS = [
  { clause: "H1", what: "the member-file door also appends a roster line to one shared spot in organism_test.mjs", m: (t) => edit(t, W, null,
    "const addMember = (d, tree, name) => (isRoll(tree) ? fileAdd(d, name) : stringAdd(d, name));",
    "const addMember = (d, tree, name) => (isRoll(tree) ? (fileAdd(d, name), tableAdd(d, name, \"a roster line\")) : stringAdd(d, name));") },
  { clause: "H2", what: "the LIVE move goes back to a shared table line (the member file's live untouched)", m: (t) => edit(t, W, null,
    "const addLiveMember = (d, tree, name) => (isRoll(tree) ? fileAdd(d, name, \"planted LIVE (H2)\") :",
    "const addLiveMember = (d, tree, name) => (isRoll(tree) ? (fileAdd(d, name, \"planted LIVE (H2)\"), tableAdd(d, name, \"planted LIVE (H2)\")) :")
    || edit(t, W, null, "const unLive = (d, tree, name) => (isRoll(tree) ? fileAdd(d, name, null) :", "const unLive = (d, tree, name) => (isRoll(tree) ? tableDel(d, name) :") },
  { clause: "H3", what: "suiteRoll skips every file of organism:selftest", m: (t) => edit(t, OT, "export function suiteRoll", "    members.push({ organ, suite: j.suite", "    if (j.suite === \"organism:selftest\") continue;\n    members.push({ organ, suite: j.suite") },
  { clause: "H4", what: "suites() stops at the first red member", m: (t) => edit(t, OT, "function suites() {", "    assert(`SUITE MEMBER · ${m} selftest exits 0`, r.code === 0);\n", "    assert(`SUITE MEMBER · ${m} selftest exits 0`, r.code === 0);\n    if (r.code !== 0) break;\n") },
  { clause: "H5", what: "chain runs every member (no stop at a red)", m: (t) => edit(t, OT, "function chain(suite) {", "    if (r.status !== 0) {", "    if (r.status !== 0 && false) {") },
  { clause: "H6", what: "audit.mjs keeps its own copy of the three suite names", m: (t) => edit(t, "scripts/audit.mjs", null, "    \"suite members\": () => {\n", "    \"suite members\": () => {\n      const own = [\"organism:selftest\", \"squad:selftest\", \"audit:selftest\"]; void own;\n") },
  { clause: "H7", what: "the member file of test_coach_v2 is dropped", m: (t) => { const p = join(t, "suite", "members", "test_coach_v2.json"); if (!existsSync(p)) return "test_coach_v2.json absent"; unlinkSync(p); return null; } },
  { clause: "H8", what: "suiteRoll returns an empty roll with NO defect when the directory is absent", m: (t) => edit(t, OT, "export function suiteRoll", "    defects.push({ file: MEMBERS_REL, why: `no member directory", "    if (Date.now() > 0) return { members, defects };\n    defects.push({ file: MEMBERS_REL, why: `no member directory") },
  { clause: "H9", what: "mpool P left un-re-cut (the strings only)", m: (t) => edit(t, "ci/mpool/witness_mpool.mjs", null, "    return n + rolled === 1;", "    return n === 1;") },
  { clause: "BOUND", what: "scripts/sitting.mjs touched (one organ byte beyond the named)", m: (t) => { const p = join(t, "scripts", "sitting.mjs"); if (!existsSync(p)) return "sitting.mjs absent"; writeFileSync(p, readFileSync(p, "utf8") + "\n// planted by run_mutants_mhot (BOUND)\n"); return null; } },
  { clause: "LAST", what: "the witness leaves a node process naming its temp dir", m: (t) => {
    const e = edit(t, W, null, 'import { spawnSync } from "node:child_process";', 'import { spawnSync, spawn as __mut } from "node:child_process";');
    return e || edit(t, W, null, "  // ── LAST ──\n", '  // ── LAST ──\n  __mut(process.execPath, ["-e", "setInterval(() => {}, 1 << 30)", TMP], { detached: true, stdio: "ignore" }).unref();\n  spawnSync(process.execPath, ["-e", "0"]);\n');
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
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(dir)) out.push(Number(p)); } catch { /* raced */ }
  }
  return out;
};
const slash = (p) => p.split(sep).join("/");
/** a copy of <org> under <into>: node_modules rides as a link */
function copy(into) {
  cpSync(ORG, into, { recursive: true, filter: (p) => { const rel = slash(relative(ORG, p)); return rel !== "node_modules" && rel !== ".git"; } });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
}
const childEnv = () => { const e = { ...process.env, TMPDIR: CT, TMP: CT, TEMP: CT }; for (const k of Object.keys(e)) if (/^ARSENAL_|^CLAUDE_CODE_/.test(k) || k === "ANTHROPIC_API_KEY") delete e[k]; return e; };
const runWitness = (tree, only) => {
  const r = spawnSync(process.execPath, [join(tree, W), "--org", tree, "--base-org", BASE, ...(only ? ["--only", only] : [])], { encoding: "utf8", windowsHide: true, timeout: left(), env: childEnv(), cwd: TMP, maxBuffer: 1 << 26 });
  const out = String(r.stdout || "") + String(r.stderr || "");
  return { code: r.status, last: out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "" };
};

let k = 0;
try {
  for (const mu of MUTANTS) {
    const t = join(TMP, `m-${mu.clause.toLowerCase()}`);
    copy(t);
    const why = await mu.m(t);
    if (why) { console.log(`  FAIL M-${mu.clause} · the mutant did not apply: ${why}`); rmSync(t, { recursive: true, force: true }); continue; }
    const r = runWitness(t, mu.clause);
    for (const p of namingProcs(TMP)) { try { process.kill(p); } catch { /* gone */ } }
    const ok = r.code === 1 && r.last === `RED MHOT · ${mu.clause}`;
    if (ok) k++;
    console.log(`  ${ok ? "ok  " : "FAIL"} M-${mu.clause} · ${mu.what} → exit ${r.code} · ${r.last}`);
    try { unlinkSync(join(t, "node_modules")); } catch { /* not linked */ }
    rmSync(t, { recursive: true, force: true });
  }
  const c = runWitness(ORG, null);
  var control = c.code === 0 && /^GREEN MHOT /.test(c.last);
  console.log(`  ${control ? "ok  " : "FAIL"} CONTROL · the unmutated witness over --org → exit ${c.code} · ${c.last}`);
} finally {
  for (const p of namingProcs(TMP)) { try { process.kill(p); } catch { /* gone */ } }
  rmSync(TMP, { recursive: true, force: true });
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && control ? 0 : 1);
