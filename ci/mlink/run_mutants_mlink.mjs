#!/usr/bin/env node
// ============================================================================
// ci/mlink/run_mutants_mlink.mjs — UNIT mlink · THE MUTANTS (forks row 1311 (4), one per clause of ci/mlink/witness_mlink.mjs)
// ----------------------------------------------------------------------------
// USAGE: node ci/mlink/run_mutants_mlink.mjs
//   Builds two LF trees under os.tmpdir() (prefix mlink-mut-) through a private index (core.autocrlf=false, core.eol=lf):
//   this clone's HEAD commit (the head) and ci/mlink/BASE (the base). No node_modules rides: the witness plants its own.
//   The HEAD commit is what is judged, never uncommitted bytes. For each mutant, its ONE text replacement is applied in the
//   head tree's scripts/organism_test.mjs (it must match exactly once, else the mutant is INVALID), the head tree's own
//   ci/mlink/witness_mlink.mjs runs --org <head> --base-org <base>, its clause line `  <clause> · … → HOLDS|RED` is read,
//   and the replacement is undone. A mutant counts iff THAT clause reads RED. The control (no mutation) must end GREEN MLINK.
//     M1 · L:no-copy      the old cpSync restored (a copy through the link)
//     M2 · L:real-target  the realpath dropped (the tree's node_modules a link to the LINK, never the real folder)
//     M3 · L:junction     the win32 branch made a plain symlink with no type (EPERM without the privilege)
// No port, no network, no model, no service; every child is spawnSync; the trees are removed before exit.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 iff k === n, GREEN)
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const lines = (t) => String(t || "").split(/\r?\n/).filter((l) => l.trim());
const SUITE = "scripts/organism_test.mjs", WIT = "ci/mlink/witness_mlink.mjs";
const MUTANTS = [
  { id: "M1", clause: "L:no-copy", from: 'linkNodeModules(join(ROOT, "node_modules"), join(d, "node_modules"));',
    to: 'cpSync(join(ROOT, "node_modules"), join(d, "node_modules"), { recursive: true });', what: "the old cpSync restored: a copy through the link" },
  { id: "M2", clause: "L:real-target", from: 'symlinkSync(realpathSync(src), dest, process.platform === "win32" ? "junction" : "dir");',
    to: 'symlinkSync(src, dest, process.platform === "win32" ? "junction" : "dir");', what: "the realpath dropped: a link to the link" },
  { id: "M3", clause: "L:junction", from: 'symlinkSync(realpathSync(src), dest, process.platform === "win32" ? "junction" : "dir");',
    to: 'symlinkSync(realpathSync(src), dest, process.platform === "win32" ? undefined : "dir");', what: "the win32 branch a plain symlink with no type" },
];

function lfTree(sha, into) {
  mkdirSync(into, { recursive: true });
  const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", REPO, `--work-tree=${into}`, "checkout", "-q", sha, "--", "."],
    { encoding: "utf8", windowsHide: true, env: { ...process.env, GIT_INDEX_FILE: `${into}.index` } });
  rmSync(`${into}.index`, { force: true });
  if (r.status !== 0) throw new Error(`tree ${sha.slice(0, 12)}: ${lines(r.stderr)[0] || r.status}`);
}
function witness(head, base) {
  const r = spawnSync(process.execPath, [join(head, WIT), "--org", head, "--base-org", base], { cwd: head, encoding: "utf8", windowsHide: true });
  const L = lines(r.stdout);
  const by = {};
  for (const l of L) { const m = /^\s+(L:[a-z-]+|BOUND|LAST) · .* → (HOLDS|RED)$/.exec(l); if (m) by[m[1]] = m[2]; }
  return { by, last: L.pop() || lines(r.stderr).pop() || "", exit: r.status };
}

const T = mkdtempSync(join(tmpdir(), "mlink-mut-"));
let k = 0, cg = false;
try {
  const head = join(T, "head"), base = join(T, "base");
  const baseSha = lines(readFileSync(join(REPO, "ci", "mlink", "BASE"), "utf8"))[0];
  lfTree("HEAD", head);
  lfTree(baseSha, base);
  const p = join(head, SUITE), src = readFileSync(p, "utf8");
  for (const m of MUTANTS) {
    const hits = src.split(m.from).length - 1;
    if (hits !== 1) { console.log(`  ${m.id} INVALID · ${SUITE}: the replacement matches ${hits} time(s), not once`); continue; }
    try {
      writeFileSync(p, src.replace(m.from, m.to));
      const c = witness(head, base);
      const red = c.by[m.clause] === "RED";
      if (red) k++;
      console.log(`  ${m.id} ${red ? "RED " : "LIVE"} by ${m.clause} (${c.by[m.clause] || "no clause line"} · ${c.last.slice(0, 60)}) · ${m.what}`);
    } finally { writeFileSync(p, src); }
  }
  const c = witness(head, base);
  cg = c.exit === 0 && /^GREEN MLINK /.test(c.last);
  console.log(`  control ${cg ? "GREEN" : "RED"} · ${JSON.stringify(c.by)} · ${c.last.slice(0, 60)} · exit ${c.exit}`);
} finally { rmSync(T, { recursive: true, force: true }); }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cg ? "GREEN" : "RED"}`);
process.exitCode = k === MUTANTS.length && cg ? 0 : 1;
