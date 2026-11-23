#!/usr/bin/env node
// ============================================================================
// ci/mcollar/run_mutants_mcollar.mjs — UNIT mcollar · THE MUTANTS (forks row 1244, mplant F9 A)
// ----------------------------------------------------------------------------
// USAGE: node ci/mcollar/run_mutants_mcollar.mjs
//   Builds two LF trees under os.tmpdir() (prefix mcollar-mut-) through a private index (core.autocrlf=false, core.eol=lf):
//   this clone's HEAD commit (the head) and ci/mcollar/BASE (the base). The HEAD commit is what is judged, never uncommitted
//   bytes. For each mutant, its text replacements are applied in the head tree (each must match exactly once, else the
//   mutant is INVALID), the head tree's own ci/mcollar/witness_mcollar.mjs runs --org <head> --base-org <base>, its clause
//   line `  <clause> · … → HOLDS|RED` is read, and the file is restored. A mutant counts iff THAT clause reads RED.
//   The control (no mutation) must end GREEN MCOLLAR, exit 0.
//   M3 mutates the UNIT witness itself (the base check dropped) and runs with --org and --base-org BOTH the head: the true
//   witness reads that RED by M:preload (the head is not open at base); the pass-through would not — it counts iff the
//   mutant's last line differs from the true one's RED.
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
const COLLAR = "scripts/audit_preload.mjs", WIT = "ci/mcollar/witness_mcollar.mjs";
const SYNC = '  require_("module").syncBuiltinESMExports();\n';
const FIRST_PATCH = '  ["writeFileSync", "appendFileSync", "mkdirSync",';
const MUTANTS = [
  { id: "M1", clause: "M:preload", file: COLLAR, edits: [[SYNC, ""]],
    what: "the re-sync line removed: a caller preload of node:fs freezes the facade and the write goes through" },
  { id: "M2", clause: "M:preload", file: COLLAR, edits: [[SYNC, ""], [FIRST_PATCH, SYNC + FIRST_PATCH]],
    what: "the re-sync line moved before the patches: the facade is synced to the ORIGINAL functions" },
];
const UNIT_M = { id: "M3", clause: "M:preload", file: WIT, edits: [["const ok = denied(hB) && denied(hP) && denied(bB) && holeAtBase;", "const ok = denied(hB) && denied(hP);"]],
  what: "the UNIT witness ignores the base (a pass-through): the head read as its own base must stay RED" };

function lfTree(sha, into) {
  mkdirSync(into, { recursive: true });
  const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", REPO, `--work-tree=${into}`, "checkout", "-q", sha, "--", "."],
    { encoding: "utf8", windowsHide: true, env: { ...process.env, GIT_INDEX_FILE: `${into}.index` } });
  rmSync(`${into}.index`, { force: true });
  if (r.status !== 0) throw new Error(`tree ${sha.slice(0, 12)}: ${lines(r.stderr)[0] || r.status}`);
}
function witness(head, org, base) {
  const r = spawnSync(process.execPath, [join(head, WIT), "--org", org, "--base-org", base], { cwd: head, encoding: "utf8", windowsHide: true });
  const L = lines(r.stdout);
  const by = {};
  for (const l of L) { const m = /^\s+(M:[a-z-]+) · .* → (HOLDS|RED)$/.exec(l); if (m) by[m[1]] = m[2]; }
  return { by, last: L.pop() || "", exit: r.status };
}
function apply(src, edits) {
  let s = src;
  for (const [from, to] of edits) {
    const n = s.split(from).length - 1;
    if (n !== 1) return { why: `the replacement ${JSON.stringify(from.trim().slice(0, 40))} matches ${n} time(s), not once` };
    s = s.replace(from, () => to);
  }
  return { s };
}

const T = mkdtempSync(join(tmpdir(), "mcollar-mut-"));
let k = 0, cg = false;
try {
  const head = join(T, "head"), base = join(T, "base");
  const baseSha = lines(readFileSync(join(REPO, "ci", "mcollar", "BASE"), "utf8"))[0];
  lfTree("HEAD", head);
  lfTree(baseSha, base);
  for (const m of [...MUTANTS, UNIT_M]) {
    const p = join(head, m.file), src = readFileSync(p, "utf8");
    const a = apply(src, m.edits);
    if (!a.s) { console.log(`  ${m.id} INVALID · ${m.file}: ${a.why}`); continue; }
    try {
      writeFileSync(p, a.s);
      let red;
      if (m === UNIT_M) {
        const mut = witness(head, head, head);
        writeFileSync(p, src);
        const truth = witness(head, head, head);
        const trueRed = truth.exit === 1 && truth.by[m.clause] === "RED" && /^RED MCOLLAR · /.test(truth.last);
        red = trueRed && mut.last !== truth.last;
        console.log(`  ${m.id} ${red ? "RED " : "LIVE"} by ${m.clause} (true: ${truth.last.slice(0, 48)} · mutant: ${mut.last.slice(0, 48)}) · ${m.what}`);
      } else {
        const c = witness(head, head, base);
        red = c.by[m.clause] === "RED";
        console.log(`  ${m.id} ${red ? "RED " : "LIVE"} by ${m.clause} (${c.by[m.clause] || "no clause line"} · ${c.last.slice(0, 48)}) · ${m.what}`);
      }
      if (red) k++;
    } finally { writeFileSync(p, src); }
  }
  const c = witness(head, head, base);
  cg = c.exit === 0 && /^GREEN MCOLLAR /.test(c.last);
  console.log(`  control ${cg ? "GREEN" : "RED"} · ${JSON.stringify(c.by)} · ${c.last.slice(0, 60)} · exit ${c.exit}`);
} finally {
  rmSync(T, { recursive: true, force: true });
}
const n = MUTANTS.length + 1;
console.log(`run_mutants: ${k} of ${n} mutant(s) RED by the clause that names them · control ${cg ? "GREEN" : "RED"}`);
process.exitCode = k === n && cg ? 0 : 1;
