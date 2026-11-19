#!/usr/bin/env node
// ============================================================================
// ci/mtxt3/run_mutants_mtxt3.mjs — UNIT mtxt3 (forks row 1124 (3)) · the witness both ways, then ONE mutant per clause.
// USAGE: node ci/mtxt3/run_mutants_mtxt3.mjs --repo <git dir> --base <sha> [--build <ref>]   (build defaults to HEAD)
// CONTRACT — clones --repo TWICE under os.tmpdir(), each with `-c core.autocrlf=false` (row 1036), checks out --base and
//   --build (COMMITTED trees: a dirty work tree is never what is judged), and runs ci/mtxt3/witness_mtxt3.mjs:
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
const ROOT = mkdtempSync(join(tmpdir(), "mtxt3-mutants-"));
const git = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function clone(ref, name) {
  const d = join(ROOT, name);
  git(["clone", "-q", "-c", "core.autocrlf=false", "--no-checkout", REPO, d]);
  git(["-c", "core.autocrlf=false", "checkout", "-q", git(["rev-parse", ref], REPO)], d);
  return d;
}
const W = join(HERE, "witness_mtxt3.mjs");
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
const baseReds = (cb.last.match(/^RED MTXT3 · (.*)$/) || [, ""])[1].split(", ").filter(Boolean);
const EXPECT_BASE = ["O1", "O2", "K1", "K2", "A1", "M1", "T1", "T2", "G1", "N1", "BOUND"];
const controlOK = cg.code === 0 && /^GREEN MTXT3 /.test(cg.last) && cb.code === 1 && EXPECT_BASE.every((c) => baseReds.includes(c)) && !baseReds.includes("LAST");

const SVC = "scripts/services.mjs", COND = "scripts/conductor.mjs";
const MUTANTS = [
  { id: "O1", file: SVC, why: "the switch-off back in a services.mjs selftest assert LABEL (text-only)", edit: (s) => s.replace("a running row is flagged ⚠ RUNNING, not reported as health", "a running row is flagged against the switch-off, not reported as health") },
  { id: "O2", file: COND, why: "the S12 claim back in the conductor.mjs fallback console line", edit: (s) => s.replace("Arming the firing is his word.", "S12 arms the firing, on his word.") },
  { id: "K1", file: SVC, why: "a CODE token changed in services.mjs (no string, no comment)", edit: (s) => s.replace("rows.length - miss.length}/", "rows.length - miss.length + 0}/") },
  { id: "K2", file: COND, why: "a CODE token changed in conductor.mjs (no string, no comment)", edit: (s) => s.replace("const askedFor = day || (report && report.day_key) || null;", "const askedFor = day || (report && report.day_key) || null || null;") },
  { id: "A1", file: SVC, why: "a services selftest assert CHECK changed (the selftest still passes)", edit: (s) => s.replace("!!inst && /start= demand/", "inst && /start= demand/") },
  { id: "M1", file: "scripts/state.mjs", why: "another file pins a renamed assert label", edit: (s) => `${s}\n// THE INSTALLER STARTS NOTHING — every service installs start=demand, every logon task registers DISABLED, and no start verb is emitted\n` },
  { id: "T1", file: SVC, why: "a string the services selftest asserts on changed (text-only)", edit: (s) => s.replace("⚠ RUNNING as an OS unit: ${run", "RUNNING as an OS unit: ${run") },
  { id: "T2", file: COND, why: "a string the conductor selftest asserts on changed (foldLine's COVERED, text-only)", edit: (s) => s.replace("step(s) COVERED by the fold", "step(s) covered by the fold") },
  { id: "G1", file: COND, why: "the cited grep no longer finds his 30 Aug word", edit: (s) => s.replace("tokens\\|ORGANISM IS BACK ON\" docs/archive/ORGANISM_AUDIT__2026-08-19.md).\n// \`fallback\`", "tokens\\|ORGANISM IS BACK UP\" docs/archive/ORGANISM_AUDIT__2026-08-19.md).\n// \`fallback\`") },
  { id: "N1", file: COND, why: "a live count/state typed into a new conductor comment line", edit: (s) => s.replace("is explicit about waking lanes. What runs now:", "is explicit about waking lanes. Today 4 lanes run. What runs now:") },
  { id: "BOUND", file: "scripts/state.mjs", why: "a file beyond the named ones edited", edit: (s) => `${s}\n// mtxt3 mutant\n` },
  { id: "LAST", file: null, why: "a planted orphan node process naming the witness temp root", env: { MTXT3_PLANT_ORPHAN: "1" } },
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
  const named = r.code === 1 && new RegExp(`^RED MTXT3 · (.*\\b)?${m.id}\\b`).test(r.last);
  if (planted && named) red++;
  console.log(`  mutant ${m.id.padEnd(5)} ${planted ? "" : "(NOT PLANTED) "}${named ? "RED by its clause" : "NOT red by its clause"} · ${m.why} · ${r.last}`);
}

try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
let survivors = [];
try {
  const list = process.platform === "win32"
    ? execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8" })
    : execFileSync("ps", ["-eo", "pid,args"], { encoding: "utf8" });
  survivors = list.split(/\r?\n/).filter((l) => /mtxt3-(witness|mutants)-/.test(l) && /node/.test(l) && !l.includes(` ${process.pid} `) && !l.includes("run_mutants_mtxt3"));
} catch (e) { survivors = [`(process list unreadable: ${e && e.message})`]; }
console.log(`LAST (runner): ${survivors.length ? `${survivors.length} node process(es) still name a temp root` : "no node process names a temp root"}`);
console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${controlOK && !survivors.length ? "GREEN" : "RED"}`);
process.exit(red === MUTANTS.length && controlOK && !survivors.length ? 0 : 1);
