#!/usr/bin/env node
// ============================================================================
// ci/mdayv/run_mutants_mdayv.mjs — UNIT mdayv · THE MUTANTS (spec §4 M-V1…M-V8, plus row 1229's C4 settle and C5 floor)
// ----------------------------------------------------------------------------
// USAGE: node ci/mdayv/run_mutants_mdayv.mjs [--org <dir>] [--base-org <dir>] [--at <ISO instant>]
//   --org       the build tree (default: this file's repo)
//   --base-org  the base tree; absent, a detached git worktree of ci/mdayv/BASE is made under os.tmpdir() (core.autocrlf=false)
//               and removed at the end (git worktree remove --force) — no tracked file of the org moves
// Each mutant is ONE string edit on a COPY of the build (under os.tmpdir(), prefix mdayv-mut-; never .git), witnessed by
// ci/mdayv/witness_mdayv.mjs --only <its clause>; it must read RED and its RED line must name that clause. The control (the
// unedited copy, every clause) must read GREEN. M-W (the witness ignores its base: --base-org = the build itself) must read
// RED by its clause. An edit whose anchor string is absent counts as NOT RED (a mutant that did not apply proves nothing).
// THE PORT CLASS, CRLF, Windows: as the witness. Every child is spawnSync. No timeout, budget or size is typed.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync, rmSync, cpSync, symlinkSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const lines = (t) => String(t || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const slash = (p) => p.split(sep).join("/");
const a = process.argv.slice(2);
const opt = (k) => { const i = a.indexOf(k); return i >= 0 && a[i + 1] && !a[i + 1].startsWith("--") ? a[i + 1] : null; };
const ORG = opt("--org") ? resolve(opt("--org")) : resolve(HERE, "..", "..");
const AT = opt("--at");

const MUTANTS = [
  { id: "M-V1", clause: "V1", file: "scripts/day.mjs", from: "const meter = await meterFinal();", to: "const meter = null;", what: "the owner call dropped from start" },
  { id: "M-V2", clause: "V2", file: "scripts/conductor.mjs", from: `  { id: "meter-final",   at: "07:06", args: ["scripts/daily_green.mjs", "final"] },\n`, to: "", what: "the meter-final MORNING step deleted" },
  { id: "M-V3", clause: "V3", file: "scripts/daily_green.mjs", from: "  const root = fixture ? fixture.root : ROOT;\n  const st = join(root, \"dressing-room\", \"state\");\n  const ledger = fixture ? join(st, \"daily_green.jsonl\") : LEDGER;\n  const yesterday",
    to: "  try { const S = await import(\"./sitting.mjs\"); await S.closeDoor({ reason: \"mutant\" }); } catch { /* mutant */ }\n  const root = fixture ? fixture.root : ROOT;\n  const st = join(root, \"dressing-room\", \"state\");\n  const ledger = fixture ? join(st, \"daily_green.jsonl\") : LEDGER;\n  const yesterday", what: "final calls the sitting close door" },
  { id: "M-V4", clause: "V4", file: "scripts/daily_green.mjs", from: "  if (kept) {", to: "  if (false && kept) {", what: "the written-once guard dropped" },
  { id: "M-V5", clause: "V5", file: "scripts/daily_green.mjs", from: `read: read === "final" ? "final" : "provisional",`, to: `read: "final",`, what: "a plain run writes read final" },
  { id: "M-V6", clause: "V6", file: "scripts/daily_green.mjs", from: "for (let d = first > FINAL_FLOOR ? first : FINAL_FLOOR; d <= T;", to: "for (let d = T; d <= T;", what: "only --through is walked, not the gap" },
  { id: "M-V7", clause: "V7", file: "scripts/daily_green.mjs", from: "  if (T > yesterday) return", to: "  if (false && T > yesterday) return", what: "--through today accepted" },
  { id: "M-V8", clause: "V8", file: "scripts/daily_green.mjs", from: "    if (process.env.CLAUDE_CODE_REMOTE) {", to: "    if (false) {", what: "the cloud guard dropped" },
  { id: "M-V9", clause: "V9", file: "scripts/daily_green.mjs", from: "const unsettled = !set.settled && !ofDay.some((r) => r.unsettled) ? set.why : null;", to: "const unsettled = null;", what: "the settle check removed (C4)" },
  { id: "M-V10", clause: "V10", file: "scripts/daily_green.mjs", from: "for (let d = first > FINAL_FLOOR ? first : FINAL_FLOOR; d <= T;", to: "for (let d = first; d <= T;", what: "the floor removed (C5)" },
];

const ROOT = mkdtempSync(join(tmpdir(), "mdayv-mut-"));
let worktree = null;
function copyOrg(src, dst) {
  cpSync(src, dst, { recursive: true, filter: (p) => { const rel = slash(relative(src, p)); const top = rel.split("/")[0]; return !rel || !(top === ".git" || top === "node_modules" || rel === "dressing-room/state" || rel.startsWith("dressing-room/state/") || /\.log$/.test(rel)); } });
  if (existsSync(join(src, "node_modules"))) symlinkSync(join(src, "node_modules"), join(dst, "node_modules"), "junction");
  // the planters read the TRACKED registry from <org>/dressing-room/state — the one file of state a copy carries
  const reg = join(src, "dressing-room", "state", "registry.json");
  if (existsSync(reg)) { mkdirSync(join(dst, "dressing-room", "state"), { recursive: true }); cpSync(reg, join(dst, "dressing-room", "state", "registry.json")); }
}
const witness = (org, base, only) => {
  const args = [join(HERE, "witness_mdayv.mjs"), "--org", org, "--base-org", base, ...(only ? ["--only", only] : []), ...(AT ? ["--at", AT] : [])];
  const r = spawnSync(process.execPath, args, { encoding: "utf8", windowsHide: true });
  return { status: r.status, last: lines(r.stdout).at(-1) || lines(r.stderr).at(-1) || "" };
};
let k = 0, control = "RED";
try {
  let BASE_ORG = opt("--base-org") ? resolve(opt("--base-org")) : null;
  if (!BASE_ORG) {
    const sha = lines(readFileSync(join(ORG, "ci", "mdayv", "BASE"), "utf8"))[0];
    worktree = join(ROOT, "base");
    const r = spawnSync("git", ["-c", "core.autocrlf=false", "worktree", "add", "--detach", worktree, sha], { cwd: ORG, encoding: "utf8", windowsHide: true });
    if (r.status !== 0) throw new Error(`git worktree add ${sha.slice(0, 12)} failed: ${lines(r.stderr).at(-1)}`);
    if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(worktree, "node_modules"), "junction");
    BASE_ORG = worktree;
  }
  const C = join(ROOT, "control"); copyOrg(ORG, C);
  const c = witness(C, BASE_ORG, null);
  control = c.status === 0 && /^GREEN MDAYV /.test(c.last) ? "GREEN" : "RED";
  console.log(`  control · ${control} · ${c.last.slice(0, 160)}`);
  for (const m of MUTANTS) {
    const dir = join(ROOT, m.id); copyOrg(ORG, dir);
    const f = join(dir, m.file), src = readFileSync(f, "utf8");
    if (!src.includes(m.from)) { console.log(`  ${m.id} · NOT APPLIED — the anchor is absent from ${m.file} (${m.what})`); continue; }
    writeFileSync(f, src.replace(m.from, m.to));
    const r = witness(dir, BASE_ORG, m.clause);
    const red = r.status === 1 && /^RED MDAYV · /.test(r.last) && r.last.replace(/^RED MDAYV · /, "").split(", ").includes(m.clause);
    if (red) k++;
    console.log(`  ${m.id} · ${m.what} → ${red ? `RED by ${m.clause}` : "NOT RED by its clause"} · ${r.last.slice(0, 120)}`);
    rmSync(dir, { recursive: true, force: true });
  }
  // M-W — the witness ignores its base: the build handed as its own base must read RED by every clause it runs
  const w = witness(C, C, "V1");
  const wRed = w.status === 1 && /^RED MDAYV · /.test(w.last) && w.last.includes("V1");
  if (wRed) k++;
  console.log(`  M-W · the base read as the build → ${wRed ? "RED by V1" : "NOT RED"} · ${w.last.slice(0, 120)}`);
} catch (e) {
  console.log(`  ERROR · ${String(e && e.message || e).slice(0, 200)}`);
} finally {
  if (worktree) spawnSync("git", ["worktree", "remove", "--force", worktree], { cwd: ORG, encoding: "utf8", windowsHide: true });
  rmSync(ROOT, { recursive: true, force: true });
}
const n = MUTANTS.length + 1;
console.log(`run_mutants: ${k} of ${n} mutant(s) RED by the clause that names them · control ${control}`);
process.exitCode = k === n && control === "GREEN" ? 0 : 1;
