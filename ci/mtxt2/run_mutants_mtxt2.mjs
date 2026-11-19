#!/usr/bin/env node
// ============================================================================
// ci/mtxt2/run_mutants_mtxt2.mjs — UNIT mtxt2 · the witness both ways, then ONE mutant per clause.
// USAGE: node ci/mtxt2/run_mutants_mtxt2.mjs --repo <git dir> --base <sha> [--build <ref>]   (build defaults to HEAD)
// CONTRACT — clones --repo TWICE under os.tmpdir(), each with `-c core.autocrlf=false` (row 1036), checks out --base and
//   --build (COMMITTED trees: a dirty work tree is never what is judged), and runs ci/mtxt2/witness_mtxt2.mjs:
//     control BASE   --org base  --base-org base  → must read RED on every clause but LAST
//     control BUILD  --org build --base-org base  → must read GREEN
//     mutant <id>    --org <copy of build, one planted edit> --base-org base --only <id> → must read RED naming <id>
//   No port is bound, no service named live, nothing POSTed or restarted, no model called. Every child is awaited by
//   spawnSync (returns on exit); the one planted orphan (mutant LAST) is killed by its printed pid, then LAST is re-checked.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
const REPO = resolve(opt("--repo") || "."), BASE_REF = opt("--base"), BUILD_REF = opt("--build") || "HEAD";
if (!BASE_REF) { console.log("run_mutants: --base <sha> is required"); process.exit(2); }
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = mkdtempSync(join(tmpdir(), "mtxt2-mutants-"));
const git = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function clone(ref, name) {
  const d = join(ROOT, name);
  git(["clone", "-q", "-c", "core.autocrlf=false", "--no-checkout", REPO, d]);
  git(["-c", "core.autocrlf=false", "checkout", "-q", git(["rev-parse", ref], REPO)], d);
  return d;
}
const W = join(HERE, "witness_mtxt2.mjs");
function witness(org, base, only, env = {}) {
  const args = [W, "--org", org, "--base-org", base]; if (only) args.push("--only", only);
  const r = spawnSync(process.execPath, args, { encoding: "utf8", env: { ...process.env, ...env } });
  const lines = `${r.stdout || ""}`.split(/\r?\n/).filter(Boolean);
  return { code: r.status, last: lines[lines.length - 1] || "(no output)", out: lines };
}

const base = clone(BASE_REF, "base"), build = clone(BUILD_REF, "build");
console.log(`base  ${git(["rev-parse", "--short", "HEAD"], base)} · build ${git(["rev-parse", "--short", "HEAD"], build)}`);
const cb = witness(base, base), cg = witness(build, base);
console.log(`control BASE : ${cb.last} (exit ${cb.code})`);
console.log(`control BUILD: ${cg.last} (exit ${cg.code})`);
const baseReds = (cb.last.match(/^RED MTXT2 · (.*)$/) || [, ""])[1].split(", ").filter(Boolean);
const EXPECT_BASE = ["O1", "O2", "K1", "K2", "T1", "T2", "D1", "G1", "N1", "BOUND"];
const controlOK = cg.code === 0 && /^GREEN MTXT2 /.test(cg.last) && cb.code === 1 && EXPECT_BASE.every((c) => baseReds.includes(c)) && !baseReds.includes("LAST");

const SVC = "scripts/services.mjs", RAILS = "scripts/rails.mjs";
const MUTANTS = [
  { id: "O1", file: SVC, why: "an S12 claim back in a services.mjs installer string", edit: (s) => s.replace("(disabled — enabling it is his word;", "(disabled — S12 enables it on his word;") },
  { id: "O2", file: RAILS, why: "the switched-off clause back in a rails.mjs comment", edit: (s) => s.replace("the rail stands on the three above.)", "the organism is SWITCHED OFF until S12.)") },
  { id: "K1", file: SVC, why: "a CODE token changed in services.mjs (no string, no comment)", edit: (s) => s.replace("rows.length - miss.length}/", "rows.length - miss.length + 0}/") },
  { id: "K2", file: RAILS, why: "a CODE token changed in rails.mjs (no string, no comment)", edit: (s) => s.replace("if (CLAUDE_P_RE.test(cmd)) {", "if (CLAUDE_P_RE.test(cmd) && cmd) {") },
  { id: "T1", file: SVC, why: "a string the services selftest asserts on changed (text-only, so K1 stays GREEN)", edit: (s) => s.replace("⚠ RUNNING as an OS unit: ${run", "RUNNING as an OS unit: ${run") },
  { id: "T2", file: RAILS, why: "a string the rails selftest asserts on changed (text-only)", edit: (s) => s.replace('export const STUDY_DENY = "park it: ek line, phir micro-question wapas";', 'export const STUDY_DENY = "park it: ek line";') },
  { id: "D1", file: RAILS, why: "the claude-p deny reason lost its ledger reason (text-only)", edit: (s) => s.replace("it runs outside the gate (L5), and its spend lands in no ledger\",", "it runs outside the gate (L5)\",") },
  { id: "G1", file: RAILS, why: "the cited grep no longer finds his 30 Aug word", edit: (s) => s.replace("tokens\\|ORGANISM IS BACK ON\"\n", "tokens\\|ORGANISM IS BACK UP\"\n") },
  { id: "N1", file: SVC, why: "a live state claim typed into a new installer line", edit: (s) => s.replace("never this file's.\n//   Off by his", "never this file's.\n//   Today 5 services Running. Off by his") },
  { id: "BOUND", file: "scripts/state.mjs", why: "a file beyond the named ones edited", edit: (s) => `${s}\n// mtxt2 mutant\n` },
  { id: "LAST", file: null, why: "a planted orphan node process naming the witness temp root", env: { MTXT2_PLANT_ORPHAN: "1" } },
];

let red = 0;
for (const m of MUTANTS) {
  const d = join(ROOT, `mut-${m.id}`);
  cpSync(build, d, { recursive: true, filter: (p) => !p.includes(`${join(build, ".git")}`) });
  let planted = true;
  if (m.file) { const p = join(d, m.file); const s = readFileSync(p, "utf8").replace(/\r\n/g, "\n"); const t = m.edit(s); planted = t !== s; writeFileSync(p, t); }
  const r = witness(d, base, m.id === "LAST" ? "O1" : m.id, m.env || {});
  const orphan = r.out.map((l) => l.match(/planted orphan pid (\d+)/)).find(Boolean);
  if (orphan) { try { process.kill(Number(orphan[1])); } catch {} }
  const named = r.code === 1 && new RegExp(`^RED MTXT2 · (.*\\b)?${m.id}\\b`).test(r.last);
  if (planted && named) red++;
  console.log(`  mutant ${m.id.padEnd(5)} ${planted ? "" : "(NOT PLANTED) "}${named ? "RED by its clause" : "NOT red by its clause"} · ${m.why} · ${r.last}`);
}

try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
let survivors = [];
try {
  const list = process.platform === "win32"
    ? execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8" })
    : execFileSync("ps", ["-eo", "pid,args"], { encoding: "utf8" });
  survivors = list.split(/\r?\n/).filter((l) => /mtxt2-(witness|mutants)-/.test(l) && /node/.test(l) && !l.includes(` ${process.pid} `) && !l.includes("run_mutants_mtxt2"));
} catch (e) { survivors = [`(process list unreadable: ${e && e.message})`]; }
console.log(`LAST (runner): ${survivors.length ? `${survivors.length} node process(es) still name a temp root` : "no node process names a temp root"}`);
console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${controlOK && !survivors.length ? "GREEN" : "RED"}`);
process.exit(red === MUTANTS.length && controlOK && !survivors.length ? 0 : 1);
