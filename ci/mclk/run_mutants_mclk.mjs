#!/usr/bin/env node
// ============================================================================
// ci/mclk/run_mutants_mclk.mjs — UNIT mclk · THE MUTANTS (forks row 1214 (3): "one mutant", plus one per further clause)
// ----------------------------------------------------------------------------
// USAGE: node ci/mclk/run_mutants_mclk.mjs
//   Builds two LF trees under os.tmpdir() (prefix mclk-mut-) through a private index (core.autocrlf=false, core.eol=lf):
//   this clone's HEAD commit (the head) and ci/mclk/BASE (the base), node_modules riding as a link (a junction on Windows).
//   The HEAD commit is what is judged, never uncommitted bytes. For each mutant, its ONE text replacement is applied in the
//   head tree (it must match exactly once, else the mutant is INVALID), the head tree's own ci/mclk/witness_mclk.mjs runs
//   --org <head> --base-org <base>, its clause line `  <clause> · … → HOLDS|RED` is read, and the replacement is undone.
//   A mutant counts iff THAT clause reads RED. The control (no mutation) must end GREEN MCLK, exit 0.
//   M3 mutates the UNIT witness itself (the base check dropped) and runs with --org and --base-org BOTH the head: the true
//   witness reads that RED by M:midnight (the head is not red at AFTER); the pass-through would not — it counts iff the
//   mutant's last line differs from the true one's RED.
// No port, no network, no model, no service; every child is spawnSync; the trees are removed before exit.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 iff k === n, GREEN)
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, existsSync, unlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const lines = (t) => String(t || "").split(/\r?\n/).filter((l) => l.trim());
const PLANT = "ci/witness/mmeter/plant_day.mjs", WIT = "ci/mclk/witness_mclk.mjs";
const MUTANTS = [
  { id: "M1", clause: "M:midnight", file: PLANT, from: "const at = (m = 1) => new Date(T - m * 60000).toISOString();",
    to: "const at = (m = 1) => new Date(now.getTime() - m * 60000).toISOString();",
    what: "the now-minus-minutes stamp restored (row 1214 (3)'s one mutant): a read at 00:02 IST stamps the previous IST day" },
  { id: "M2", clause: "M:one-instant", file: PLANT, from: 'NODE_OPTIONS: clockDoor(root, T) }', to: 'NODE_OPTIONS: process.env.NODE_OPTIONS || "" }',
    what: "the instant no longer handed to the meter child: the meter re-reads now (two reads of the clock)" },
];
const UNIT_M = { id: "M3", clause: "M:midnight", file: WIT, from: "const mid = allOk(hA) && allOk(hB) && someRed(bA);", to: "const mid = allOk(hA) && allOk(hB);",
  what: "the UNIT witness ignores the base (a pass-through): the head read as its own base must stay RED" };

function lfTree(sha, into) {
  mkdirSync(into, { recursive: true });
  const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", REPO, `--work-tree=${into}`, "checkout", "-q", sha, "--", "."],
    { encoding: "utf8", windowsHide: true, env: { ...process.env, GIT_INDEX_FILE: `${into}.index` } });
  rmSync(`${into}.index`, { force: true });
  if (r.status !== 0) throw new Error(`tree ${sha.slice(0, 12)}: ${lines(r.stderr)[0] || r.status}`);
  if (existsSync(join(REPO, "node_modules"))) symlinkSync(join(REPO, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
}
function witness(head, org, base) {
  const r = spawnSync(process.execPath, [join(head, WIT), "--org", org, "--base-org", base], { cwd: head, encoding: "utf8", windowsHide: true });
  const L = lines(r.stdout);
  const by = {};
  for (const l of L) { const m = /^\s+(M:[a-z-]+) · .* → (HOLDS|RED)$/.exec(l); if (m) by[m[1]] = m[2]; }
  return { by, last: L.pop() || "", exit: r.status };
}

const T = mkdtempSync(join(tmpdir(), "mclk-mut-"));
let k = 0, cg = false;
try {
  const head = join(T, "head"), base = join(T, "base");
  const baseSha = lines(readFileSync(join(REPO, "ci", "mclk", "BASE"), "utf8"))[0];
  lfTree("HEAD", head);
  lfTree(baseSha, base);
  for (const m of [...MUTANTS, UNIT_M]) {
    const p = join(head, m.file), src = readFileSync(p, "utf8");
    if (src.split(m.from).length !== 2) { console.log(`  ${m.id} INVALID · ${m.file}: the replacement matches ${src.split(m.from).length - 1} time(s), not once`); continue; }
    try {
      writeFileSync(p, src.replace(m.from, m.to));
      let red;
      if (m === UNIT_M) {
        const mut = witness(head, head, head);
        writeFileSync(p, src);
        const truth = witness(head, head, head);
        const trueRed = truth.exit === 1 && truth.by[m.clause] === "RED" && /^RED MCLK · /.test(truth.last);
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
  cg = c.exit === 0 && /^GREEN MCLK /.test(c.last);
  console.log(`  control ${cg ? "GREEN" : "RED"} · ${JSON.stringify(c.by)} · ${c.last.slice(0, 60)} · exit ${c.exit}`);
} finally {
  for (const t of ["head", "base"]) { try { unlinkSync(join(T, t, "node_modules")); } catch { /* no link */ } }
  rmSync(T, { recursive: true, force: true });
}
const n = MUTANTS.length + 1;
console.log(`run_mutants: ${k} of ${n} mutant(s) RED by the clause that names them · control ${cg ? "GREEN" : "RED"}`);
process.exitCode = k === n && cg ? 0 : 1;
