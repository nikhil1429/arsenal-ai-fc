#!/usr/bin/env node
// ============================================================================
// ci/mcon/run_mutants_mcon.mjs — UNIT mcon (forks row 1132 (3)) · the witness both ways, then ONE mutant per clause.
// USAGE: node ci/mcon/run_mutants_mcon.mjs --repo <git dir> --base <sha> [--build <ref>] [--modules <dir>]
//   --modules  a tree whose node_modules carries acorn for the census clause (default: --repo); passed to the witness
// CONTRACT — clones --repo TWICE under os.tmpdir(), each with `-c core.autocrlf=false` (row 1036), checks out --base and
//   --build (COMMITTED trees: a dirty work tree is never what is judged), and runs ci/mcon/witness_mcon.mjs:
//     control BASE   --org base  --base-org base  → must read RED on every clause but LAST
//     control BUILD  --org build --base-org base  → must read GREEN
//     mutant <id>    --org <copy of build, one planted edit> --base-org base --only <id> → must read RED naming <id>
//   No port is bound, no service named live, nothing POSTed or restarted, no model called. Every child is awaited by
//   spawnSync (returns on exit); the one planted orphan (mutant LAST) is killed by its printed pid, then LAST is re-checked.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
const REPO = resolve(opt("--repo") || "."), BASE_REF = opt("--base"), BUILD_REF = opt("--build") || "HEAD";
const MODULES = resolve(opt("--modules") || REPO);
if (!BASE_REF) { console.log("run_mutants: --base <sha> is required"); process.exit(2); }
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = mkdtempSync(join(tmpdir(), "mcon-mutants-"));
const git = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function clone(ref, name) {
  const d = join(ROOT, name);
  git(["clone", "-q", "-c", "core.autocrlf=false", "--no-checkout", REPO, d]);
  git(["-c", "core.autocrlf=false", "checkout", "-q", git(["rev-parse", ref], REPO)], d);
  return d;
}
const W = join(HERE, "witness_mcon.mjs");
function witness(org, base, only, env = {}) {
  const args = [W, "--org", org, "--base-org", base, "--modules", MODULES]; if (only) args.push("--only", only);
  const r = spawnSync(process.execPath, args, { encoding: "utf8", env: { ...process.env, ...env } });
  const lines = `${r.stdout || ""}`.split(/\r?\n/).filter(Boolean);
  return { code: r.status, last: lines[lines.length - 1] || "(no output)", out: lines };
}

const base = clone(BASE_REF, "base"), build = clone(BUILD_REF, "build");
console.log(`base  ${git(["rev-parse", "--short", "HEAD"], base)} · build ${git(["rev-parse", "--short", "HEAD"], build)}`);
const cb = witness(base, base), cg = witness(build, base);
console.log(`control BASE : ${cb.last} (exit ${cb.code})`);
console.log(`control BUILD: ${cg.last} (exit ${cg.code})`);
const baseReds = (cb.last.match(/^RED MCON · (.*)$/) || [, ""])[1].split(", ").filter(Boolean);
const EXPECT_BASE = ["F1", "F2", "F3", "F4", "C1", "ONE", "BOUND"];
const controlOK = cg.code === 0 && /^GREEN MCON /.test(cg.last) && cb.code === 1 && EXPECT_BASE.every((c) => baseReds.includes(c)) && !baseReds.includes("LAST");

const COND = "scripts/conductor.mjs";
const TAIL = "&& spawned.length === 0 && after === seeded;";
const MUTANTS = [
  { id: "F1", file: COND, why: "the repaired assert stops reading the guard's spawn record", edit: (s) => s.replace(TAIL, "&& after === seeded;") },
  { id: "F2", file: COND, why: "the NOTHING WAS RUN pin reads the file's own source again (self-satisfied)", edit: (s) => s.replace("&& out.some((l) => /^conductor: NOTHING WAS RUN/.test(l))", "&& /NOTHING WAS RUN/.test(readFileSync(join(REPO, \"scripts\", \"conductor.mjs\"), \"utf8\"))") },
  { id: "F3", file: COND, why: "the repaired assert stops comparing the copy's state dir", edit: (s) => s.replace(TAIL, "&& spawned.length === 0;") },
  { id: "F4", file: COND, why: "the repaired assert can no longer pass (the control selftest goes red)", edit: (s) => s.replace("const ranNothing = r.status === 0 &&", "const ranNothing = r.status === 0 && pass < 0 &&") },
  { id: "C1", file: COND, why: "a pin satisfied by its own literal added to the conductor selftest (it still passes)", edit: (s) => s.replace(TAIL, "&& spawned.length === 0 && after === seeded && /fallback guard refused/.test(readFileSync(join(REPO, \"scripts\", \"conductor.mjs\"), \"utf8\"));") },
  { id: "ONE", file: COND, why: "a comment OUTSIDE the S9 (6) block edited", edit: (s) => s.replace("// S9 — the fold's fallback, READ-ONLY.", "// S9 — the fold's fallback, read-only.") },
  { id: "BOUND", file: "scripts/state.mjs", why: "a file beyond the named ones edited", edit: (s) => `${s}\n// mcon mutant\n` },
  { id: "LAST", file: null, why: "a planted orphan node process naming the witness temp root", env: { MCON_PLANT_ORPHAN: "1" } },
];

let red = 0;
for (const m of MUTANTS) {
  const d = join(ROOT, `mut-${m.id}`);
  cpSync(build, d, { recursive: true, filter: (p) => relative(build, p).split(sep)[0] !== ".git" });
  let planted = true;
  if (m.file) { const p = join(d, m.file); const s = readFileSync(p, "utf8").replace(/\r\n/g, "\n"); const t = m.edit(s); planted = t !== s; writeFileSync(p, t); }
  const r = witness(d, base, m.id === "LAST" ? "ONE" : m.id, m.env || {});
  const orphan = r.out.map((l) => l.match(/planted orphan pid (\d+)/)).find(Boolean);
  if (orphan) { try { process.kill(Number(orphan[1])); } catch {} }
  const named = r.code === 1 && new RegExp(`^RED MCON · (.*\\b)?${m.id}\\b`).test(r.last);
  if (planted && named) red++;
  console.log(`  mutant ${m.id.padEnd(5)} ${planted ? "" : "(NOT PLANTED) "}${named ? "RED by its clause" : "NOT red by its clause"} · ${m.why} · ${r.last}`);
}

try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
let survivors = [];
try {
  const list = process.platform === "win32"
    ? execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8" })
    : execFileSync("ps", ["-eo", "pid,args"], { encoding: "utf8" });
  survivors = list.split(/\r?\n/).filter((l) => /mcon-(witness|mutants)-|conductor-fallback-/.test(l) && /node/.test(l) && !l.includes(` ${process.pid} `) && !l.includes("run_mutants_mcon"));
} catch (e) { survivors = [`(process list unreadable: ${e && e.message})`]; }
console.log(`LAST (runner): ${survivors.length ? `${survivors.length} node process(es) still name a temp root` : "no node process names a temp root"}`);
console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${controlOK && !survivors.length ? "GREEN" : "RED"}`);
process.exit(red === MUTANTS.length && controlOK && !survivors.length ? 0 : 1);
