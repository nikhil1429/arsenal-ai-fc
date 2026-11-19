#!/usr/bin/env node
// ============================================================================
// ci/mtxt/run_mutants_mtxt.mjs — UNIT mtxt · the witness both ways, then ONE mutant per clause.
// USAGE: node ci/mtxt/run_mutants_mtxt.mjs --repo <git dir> --base <sha> [--build <ref>]   (build defaults to HEAD)
// CONTRACT — clones --repo TWICE under os.tmpdir(), each with `-c core.autocrlf=false` (row 1036), checks out --base and
//   --build (COMMITTED trees: a dirty work tree is never what is judged), and runs ci/mtxt/witness_mtxt.mjs:
//     control BASE   --org base  --base-org base  → must read RED (every clause but LAST)
//     control BUILD  --org build --base-org base  → must read GREEN
//     mutant <id>    --org <copy of build, one planted edit> --base-org base --only <id> → must read RED naming <id>
//   No port is bound, no service named live, nothing POSTed or restarted, no model called. Every child is awaited by
//   spawnSync (returns on exit); the one planted orphan (mutant LAST) is killed by its printed pid, then LAST is re-checked.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
const REPO = resolve(opt("--repo") || "."), BASE_REF = opt("--base"), BUILD_REF = opt("--build") || "HEAD";
if (!BASE_REF) { console.log("run_mutants: --base <sha> is required"); process.exit(2); }
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = mkdtempSync(join(tmpdir(), "mtxt-mutants-"));
const git = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function clone(ref, name) {
  const d = join(ROOT, name);
  git(["clone", "-q", "-c", "core.autocrlf=false", "--no-checkout", REPO, d]);
  git(["-c", "core.autocrlf=false", "checkout", "-q", git(["rev-parse", ref], REPO)], d);
  return d;
}
const W = join(HERE, "witness_mtxt.mjs");
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
const baseReds = (cb.last.match(/^RED MTXT · (.*)$/) || [, ""])[1].split(", ").filter(Boolean);
const EXPECT_BASE = ["S1", "S2", "S3", "S4", "C1", "C2", "C3", "C4", "N1", "BOUND"];
const controlOK = cg.code === 0 && /^GREEN MTXT /.test(cg.last) && cb.code === 1 && EXPECT_BASE.every((c) => baseReds.includes(c)) && !baseReds.includes("LAST");

const SVC = "scripts/services.mjs", MD = "CLAUDE.md";
const MUTANTS = [
  { id: "S1", file: SVC, why: "the stale sentence back, as a comment", edit: (s) => s.replace("export function statusLine(rows) {", "// the organism is supposed to be OFF until S12\nexport function statusLine(rows) {") },
  { id: "S2", file: SVC, why: "the 30 Aug word dropped from the RUNNING line", edit: (s) => s.replace("lifted by his 30 Aug 2026 word", "lifted by his later word") },
  { id: "S3", file: SVC, why: "a CODE token changed (no string, no comment)", edit: (s) => s.replace("rows.length - miss.length}/", "rows.length - miss.length + 0}/") },
  { id: "S4", file: SVC, why: "a string the selftest asserts on changed (text-only, so S3 stays GREEN)", edit: (s) => s.replace("⚠ RUNNING as an OS unit: ${run", "RUNNING as an OS unit: ${run") },
  { id: "C1", file: MD, why: "the stale switch-off words back in the paragraph", edit: (s) => s.replace("— both words, cited:", "— THE ORGANISM IS SWITCHED OFF:") },
  { id: "C2", file: MD, why: "the cited grep no longer finds the 30 Aug word", edit: (s) => s.replace("\\|ORGANISM IS BACK ON\"", "\\|ORGANISM IS BACK UP\"") },
  { id: "C3", file: MD, why: "another line of CLAUDE.md moved (same length)", edit: (s) => s.replace("## The ten laws (each is a code path — verify, never recall)", "## The ten laws (each is a code path — verify, never RECALL)") },
  { id: "C4", file: MD, why: "the paragraph grew past the base's byte count", edit: (s) => s.replace("(his machine, not a cloud).", "(his machine, not a cloud session, which cannot run any of them at all, ever, by design).") },
  { id: "N1", file: MD, why: "a live state claim typed into the paragraph", edit: (s) => s.replace("What runs NOW\n", "Services Running NOW\n") },
  { id: "BOUND", file: "scripts/state.mjs", why: "a file beyond the named ones edited", edit: (s) => `${s}\n// mtxt mutant\n` },
  { id: "LAST", file: null, why: "a planted orphan node process naming the witness temp root", env: { MTXT_PLANT_ORPHAN: "1" } },
];

let red = 0;
for (const m of MUTANTS) {
  const d = join(ROOT, `mut-${m.id}`);
  cpSync(build, d, { recursive: true, filter: (p) => !p.includes(`${join(build, ".git")}`) });
  let planted = true;
  if (m.file) { const p = join(d, m.file); const s = readFileSync(p, "utf8"); const t = m.edit(s); planted = t !== s; writeFileSync(p, t); }
  const r = witness(d, base, m.id === "LAST" ? "S1" : m.id, m.env || {});
  const orphan = r.out.map((l) => l.match(/planted orphan pid (\d+)/)).find(Boolean);
  if (orphan) { try { process.kill(Number(orphan[1])); } catch {} }
  const named = r.code === 1 && new RegExp(`^RED MTXT · (.*\\b)?${m.id}\\b`).test(r.last);
  if (planted && named) red++;
  console.log(`  mutant ${m.id.padEnd(5)} ${planted ? "" : "(NOT PLANTED) "}${named ? "RED by its clause" : "NOT red by its clause"} · ${m.why} · ${r.last}`);
}

try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
let survivors = [];
try {
  const list = process.platform === "win32"
    ? execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8" })
    : execFileSync("ps", ["-eo", "pid,args"], { encoding: "utf8" });
  survivors = list.split(/\r?\n/).filter((l) => /mtxt-(witness|mutants)-/.test(l) && /node/.test(l) && !l.includes(` ${process.pid} `) && !l.includes("run_mutants_mtxt"));
} catch (e) { survivors = [`(process list unreadable: ${e && e.message})`]; }
console.log(`LAST (runner): ${survivors.length ? `${survivors.length} node process(es) still name a temp root` : "no node process names a temp root"}`);
console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${controlOK && !survivors.length ? "GREEN" : "RED"}`);
process.exit(red === MUTANTS.length && controlOK && !survivors.length ? 0 : 1);
