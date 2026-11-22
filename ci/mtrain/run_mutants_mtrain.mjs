#!/usr/bin/env node
// ============================================================================
// ci/mtrain/run_mutants_mtrain.mjs — UNIT mtrain · THE MUTANTS (row 1313 (2): "Witness both ways, with mutants: a top that
// is not a descendant accepted; a merge between accepted; the verdict still read at the tip"), plus one per further clause
// ----------------------------------------------------------------------------
// USAGE: node ci/mtrain/run_mutants_mtrain.mjs
//   Builds two LF trees under os.tmpdir() (prefix mtrain-mut-) through a private index (core.autocrlf=false, core.eol=lf):
//   this clone's HEAD commit (the head) and ci/mtrain/BASE (the base). The HEAD commit is what is judged, never uncommitted
//   bytes. For each mutant, its ONE text replacement is applied to the head tree's scripts/land.mjs (it must match exactly
//   once, else the mutant is INVALID), the head tree's own ci/mtrain/witness_mtrain.mjs runs --org <head> --base-org <base>
//   --only <clause>, its clause line `  ✓|✗ <clause> · …` is read, and the replacement is undone. A mutant counts iff THAT
//   clause reads ✗. The control (no mutation, every clause) must end GREEN MTRAIN, exit 0.
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
const VERB = "scripts/land.mjs", WIT = "ci/mtrain/witness_mtrain.mjs";
const MUTANTS = [
  { id: "M1", clause: "NONDESC", from: "if (!oldest || oldest[1] !== T) return", to: "if (false) return",
    what: "a top that is not a descendant accepted (row 1313 (2))" },
  { id: "M2", clause: "MERGE", from: "if (merge) return", to: "if (false) return",
    what: "a merge between the tip and the top accepted (row 1313 (2))" },
  { id: "M3", clause: "TOP", from: "const v = verdictAt(tt ? /** @type {string} */ (tt.top) : T);", to: "const v = verdictAt(T);",
    what: "the verdict still read at the tip with the flag given (row 1313 (2))" },
  { id: "M4", clause: "TIP", from: "const v = verdictAt(tt ? /** @type {string} */ (tt.top) : T);", to: "const v = verdictAt(tt ? /** @type {string} */ (tt.top) : P);",
    what: "without the flag the verdict is no longer read at the tip (read at its parent)" },
  { id: "M5", clause: "FLAG", from: "if (at.length > 1) return", to: "if (false) return",
    what: "the flag given twice accepted (the first value read)" },
  { id: "M6", clause: "LEDGER", from: 'record({ unit, sha: T, outcome: "LANDED", name: "LANDED", human: false, ...topOf });', to: 'record({ unit, sha: T, outcome: "LANDED", name: "LANDED", human: false });',
    what: "the landing's ledger row drops the top" },
  { id: "M7", clause: "TRAIN", from: 'if (n !== 1) return stop(1, "REFUSED", "MULTI-COMMIT"', to: 'if (n !== 1 && !opt.trainTop) return stop(1, "REFUSED", "MULTI-COMMIT"',
    what: "under the flag a landing may be more than one commit (the train lands whole)" },
  { id: "M8", clause: "HEADER", from: "C1-TRAIN (row 1313 (1), unit mtrain) beside C1, never instead of it", to: "C1-TRAIN beside C1",
    what: "the header's law line no longer cites row 1313 (1)" },
];

function lfTree(sha, into) {
  mkdirSync(into, { recursive: true });
  const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", REPO, `--work-tree=${into}`, "checkout", "-q", sha, "--", "."],
    { encoding: "utf8", windowsHide: true, env: { ...process.env, GIT_INDEX_FILE: `${into}.index` } });
  rmSync(`${into}.index`, { force: true });
  if (r.status !== 0) throw new Error(`tree ${sha.slice(0, 12)}: ${lines(r.stderr)[0] || r.status}`);
}
/** @param {string} head @param {string} base @param {string|null} only */
function witness(head, base, only) {
  const r = spawnSync(process.execPath, [join(head, WIT), "--org", head, "--base-org", base, ...(only ? ["--only", only] : [])], { cwd: head, encoding: "utf8", windowsHide: true });
  const L = lines(r.stdout);
  /** @type {Record<string, string>} */
  const by = {};
  for (const l of L) { const m = /^\s+([✓✗]) ([A-Z]+(?: BOUND)?) · /.exec(l); if (m) by[m[2]] = m[1] === "✓" ? "HOLDS" : "RED"; }
  return { by, last: L.pop() || "", exit: r.status };
}

const T = mkdtempSync(join(tmpdir(), "mtrain-mut-"));
let k = 0, cg = false;
try {
  const head = join(T, "head"), base = join(T, "base");
  lfTree("HEAD", head);
  lfTree(lines(readFileSync(join(REPO, "ci", "mtrain", "BASE"), "utf8"))[0], base);
  const p = join(head, VERB), src = readFileSync(p, "utf8");
  for (const m of MUTANTS) {
    const hits = src.split(m.from).length - 1;
    if (hits !== 1) { console.log(`  ${m.id} INVALID · ${VERB}: the replacement matches ${hits} time(s), not once`); continue; }
    try {
      writeFileSync(p, src.replace(m.from, m.to));
      const c = witness(head, base, m.clause);
      const red = c.by[m.clause] === "RED";
      console.log(`  ${m.id} ${red ? "RED " : "LIVE"} by ${m.clause} (${c.by[m.clause] || "no clause line"} · ${c.last.slice(0, 48)}) · ${m.what}`);
      if (red) k++;
    } finally { writeFileSync(p, src); }
  }
  const c = witness(head, base, null);
  cg = c.exit === 0 && /^GREEN MTRAIN /.test(c.last);
  console.log(`  control ${cg ? "GREEN" : "RED"} · ${JSON.stringify(c.by)} · ${c.last.slice(0, 60)} · exit ${c.exit}`);
} finally {
  rmSync(T, { recursive: true, force: true });
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cg ? "GREEN" : "RED"}`);
process.exitCode = k === MUTANTS.length && cg ? 0 : 1;
