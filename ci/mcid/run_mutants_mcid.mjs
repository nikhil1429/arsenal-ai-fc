#!/usr/bin/env node
// ============================================================================
// ci/mcid/run_mutants_mcid.mjs — UNIT mcid · THE MUTANTS (row 1321 (1): "Witness both ways with mutants: neither witness
// accepted; a clause witness of ANOTHER unit accepted; BASE not 40-hex accepted"), plus one per further clause
// ----------------------------------------------------------------------------
// USAGE: node ci/mcid/run_mutants_mcid.mjs
//   Builds two LF trees under os.tmpdir() (prefix mcid-mut-) through a private index (core.autocrlf=false, core.eol=lf):
//   this clone's HEAD commit (the head) and ci/mcid/BASE (the base). The HEAD commit is what is judged, never uncommitted
//   bytes. For each mutant, its ONE text replacement is applied to the head tree's scripts/land.mjs (it must match exactly
//   once, else the mutant is INVALID), the head tree's own ci/mcid/witness_mcid.mjs runs --org <head> --base-org <base>
//   --only <clause>, its clause line `  ✓|✗ <clause> · …` is read, and the replacement is undone. A mutant counts iff THAT
//   clause reads ✗. The control (no mutation, every clause) must end GREEN MCID, exit 0.
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
const VERB = "scripts/land.mjs", WIT = "ci/mcid/witness_mcid.mjs";
const MUTANTS = [
  { id: "M1", clause: "NEITHER", from: "if ((!has(w) && !cw) || !baseOk", to: "if ((!has(w) && !cw && false) || !baseOk",
    what: "a landing with neither witness accepted (row 1321 (1))" },
  { id: "M2", clause: "OTHER", from: ".some((p) => p.startsWith(`ci/witness/${unit}/`) && /^witness_[a-z0-9_-]+\\.mjs$/.test(p.slice(`ci/witness/${unit}/`.length)));",
    to: ".length >= 0 && lines(git([\"ls-tree\", \"-r\", \"--name-only\", T, \"--\", \"ci/witness/\"]).out).some((p) => /^ci\\/witness\\/[a-z0-9-]+\\/witness_[a-z0-9_-]+\\.mjs$/.test(p));",
    what: "a clause witness of ANOTHER unit accepted (row 1321 (1))" },
  { id: "M3", clause: "BASEHEX", from: "/^[0-9a-f]{40}$/.test(git([\"cat-file\", \"blob\", `${T}:${b}`]).out)", to: "true",
    what: "a BASE that is not 40-hex (or none) accepted (row 1321 (1))" },
  { id: "M4", clause: "CLAUSE", from: "if ((!has(w) && !cw) || !baseOk", to: "if (!has(w) || !baseOk",
    what: "the clause witness no longer holds the law (the verb as before row 1321 (1))" },
  { id: "M5", clause: "UNIT", from: "if ((!has(w) && !cw) || !baseOk", to: "if (!cw || !baseOk",
    what: "the unit witness no longer holds the law (only a clause witness does)" },
  { id: "M6", clause: "TOUCH", from: "|| !touched.some((p) => p.startsWith(`ci/${unit}/`)))", to: ")",
    what: "a landing that touches nothing under ci/<unit>/ accepted" },
  { id: "M7", clause: "NAME", from: "/^witness_[a-z0-9_-]+\\.mjs$/.test(p.slice(", to: "/\\.mjs$/.test(p.slice(",
    what: "a clause witness by any .mjs name, nested or not, accepted" },
  { id: "M8", clause: "HEADER", from: "NO-CI-DIR · THE CLAUSE WITNESS (unit mcid · row 1321 (1)) beside it", to: "NO-CI-DIR · THE CLAUSE WITNESS beside it",
    what: "the header's amendment no longer cites row 1321 (1)" },
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

const T = mkdtempSync(join(tmpdir(), "mcid-mut-"));
let k = 0, cg = false;
try {
  const head = join(T, "head"), base = join(T, "base");
  lfTree("HEAD", head);
  lfTree(lines(readFileSync(join(REPO, "ci", "mcid", "BASE"), "utf8"))[0], base);
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
  cg = c.exit === 0 && /^GREEN MCID /.test(c.last);
  console.log(`  control ${cg ? "GREEN" : "RED"} · ${JSON.stringify(c.by)} · ${c.last.slice(0, 60)} · exit ${c.exit}`);
} finally {
  rmSync(T, { recursive: true, force: true });
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cg ? "GREEN" : "RED"}`);
process.exitCode = k === MUTANTS.length && cg ? 0 : 1;
