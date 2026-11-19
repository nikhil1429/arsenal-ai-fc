#!/usr/bin/env node
// ============================================================================
// ci/ms2/run_mutants_ms2.mjs — one mutant per clause of ci/ms2/witness_ms2.mjs, each RED by the clause that names it
//   node ci/ms2/run_mutants_ms2.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build's named files (scripts/organism_test.mjs, scripts/land.mjs,
// .github/workflows/suite.yml, ci/) with ONE edit, applied only if its anchor occurs exactly once (else the mutant itself
// is RED: an edit that cannot land proves nothing). The witness runs `--only <clause>` over it and must print
// `RED MS2 · <clause>`. A GUARD's mutant breaks what the guard holds, so it too must be RED. The control is the unedited
// copy over every clause at once: GREEN. BOUND and LAST are seat-time clauses and carry no mutant.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
if (!ORG || !BASE) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_ms2.mjs");
const OT = "scripts/organism_test.mjs", LAND = "scripts/land.mjs";
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-ms2-"));

/** [clause, file, anchor, replacement] — or [clause, null, relpath-to-delete] */
const MUTANTS = [
  ["W-L1 READ", OT, "(at.L), orgT)", "(ctx.head), orgT)"],
  ["W-L2 RUN", OT, "L: line[j].h, at: j }", "L: line[i - 1].h, at: i - 1 }"],
  ["W-L3 SPOOF", OT, '"log", "--first-parent", "--format=%H%x09%s", MAIN_REF', '"log", "--format=%H%x09%s", MAIN_REF'],
  ["W-L4 INFLIGHT", OT, 'if (head.p1 === P && named(head.s)) return { state: "inflight", P, L: head.h, at: -1 };\n  if (i === 0)', "if (i === 0)"],
  ["W-L5 NOTLANDED", OT, "{ console.log(`  witness ‹${unit}› L · not landed — its L-leg runs at its landing`); return; }", "{ return; }"],
  ["W-L6 FULL", OT, "judgeLast(r.out, r.code, unit, recutIds)", 'judgeLast(r.out, r.code, unit, [...recutIds, "BOUND"])'],
  ["W-L7 GITSIDE", OT, "const e = gitSide(ROOT, /** @type {string} */ (at.L), orgT) || gitSide(ROOT,", "const e = lfTree(ROOT, /** @type {string} */ (at.L), orgT) || lfTree(ROOT,"],
  ["W-L8 OFFMAIN", OT, ': { state: "offmain", P, why: `${P.slice(0, 7)} is not on', ': { state: "notlanded", P, why: `${P.slice(0, 7)} is not on'],
  ["W-L9 SECONDS", OT, "console.log(`  witness ‹${unit}› L ${secs} s · ${j.last}`);", ""],
  ["W-L10 PLUS", OT, 'm[1].split("+").map((x) => x.trim()) : []; };', '[m[1].split("+")[0].trim()] : []; };'],
  ["W-R1 DROP", OT, 'headLeg(ctx, unit, valid.filter((d) => d.kind === "DROP").map((d) => d.id))', "headLeg(ctx, unit, [])"],
  ["W-R2 KEEPATL", OT, 'landedLeg(ctx, unit, at, valid.filter((d) => d.kind === "RECUT").map((d) => d.id))', "landedLeg(ctx, unit, at, valid.map((d) => d.id))"],
  ["W-R3 STALE", OT, "assert(`REBASE ‹${unit}› · every DROP id", "if (false) assert(`REBASE ‹${unit}› · every DROP id"],
  ["W-R4 ORDER", OT, "if (!after) bad = ", "if (false) bad = "],
  ["W-R5 UNKNOWN", OT, "if (!(q('\"') || q(\"'\") || q(\"`\"))) bad =", "if (false) bad ="],
  ["W-R6 NEWDEATH", OT, 'assert(name("GREEN at head against its BASE"), j.ok,', 'assert(name("GREEN at head against its BASE"), j.ok || dropIds.length > 0,'],
  ["W-R7 RECUT", OT, 'landedLeg(ctx, unit, at, valid.filter((d) => d.kind === "RECUT").map((d) => d.id))', "landedLeg(ctx, unit, at, [])"],
  ["W-R8 RECUTHEAD", OT, 'headLeg(ctx, unit, valid.filter((d) => d.kind === "DROP").map((d) => d.id))', "headLeg(ctx, unit, valid.map((d) => d.id))"],
  ["W-R9 PENDING", OT, '} else if (o.state !== "none" && o.state !== "notlanded") bad =', "} else bad ="],
  ["W-T1 TRIGGER", OT, "if (!ciChanged(ROOT, unit)) {", "if (false) {"],
  ["W-T2 CHANGED", OT, "const ciChanged = (root, unit) => spawnSync(", "const ciChanged = (root, unit) => false && spawnSync("],
  ["W-G1 SUBJECT", LAND, 'if (!named.includes(unit)) return stop(1, "REFUSED", "SUBJECT"', 'if (false) return stop(1, "REFUSED", "SUBJECT"'],
  ["W-G2 LANDEDON", LAND, "|| !/^[0-9a-f]{40}$/.test(r.out) || r.out !== P)", "|| !/^[0-9a-f]{40}$/.test(r.out))"],
  ["W-G3 GOOD", LAND, "|| r.out !== P)", "|| r.out === P)"],
  ["W-G4 PLUS", LAND, "for (const n of named) {", "for (const n of [unit]) {"],
  ["W-G5 PLUSOK", LAND, 'const named = m ? m[1].split("+").map((x) => x.trim()) : [];', "const named = m ? [m[1]] : [];"],
  ["W-G6 BEFORE", LAND, ".some((p) => /^ci\\/[a-z0-9-]+\\/LANDED_ON$/.test(p))) {", ".some(() => true)) {"],
  ["W-C1 CARRY", null, "ci/mf2/LANDED_ON"],
];

function copyTree(dst) {
  for (const f of [OT, LAND, ".github/workflows/suite.yml"]) { mkdirSync(dirname(join(dst, f)), { recursive: true }); cpSync(join(ORG, f), join(dst, f)); }
  if (existsSync(join(ORG, "ci"))) cpSync(join(ORG, "ci"), join(dst, "ci"), { recursive: true });
}
const witness = (tree, only) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", tree, "--base-org", BASE, "--only", only], { encoding: "utf8", windowsHide: true });
  const out = ((r.stdout || "") + (r.stderr || "")).trim().split(/\r?\n/);
  return { code: r.status, last: out[out.length - 1] || "" };
};

let k = 0, control = "RED";
try {
  MUTANTS.forEach(([clause, file, anchor, repl], i) => {
    const d = join(ROOT, `m${i}`); copyTree(d);
    let applied = true;
    if (file === null) { try { rmSync(join(d, anchor)); } catch { applied = false; } }
    else {
      const p = join(d, file), s = readFileSync(p, "utf8"), n = s.split(anchor).length - 1;
      if (n !== 1) applied = false; else writeFileSync(p, s.replace(anchor, () => repl));
    }
    const r = applied ? witness(d, clause) : { code: null, last: "(the edit did not apply exactly once)" };
    const ok = applied && r.code === 1 && r.last === `RED MS2 · ${clause}`;
    if (ok) k++;
    console.log(`  ${ok ? "✓" : "✗"} μ ${clause} → ${r.last}`);
  });
  const c = join(ROOT, "control"); copyTree(c);
  const r = witness(c, MUTANTS.map((m) => m[0]).join(","));
  control = r.code === 0 && /^GREEN MS2 /.test(r.last) ? "GREEN" : "RED";
  console.log(`  ${control === "GREEN" ? "✓" : "✗"} control → ${r.last}`);
} finally { try { rmSync(ROOT, { recursive: true, force: true }); } catch {} }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control}`);
process.exit(k === MUTANTS.length && control === "GREEN" ? 0 : 1);
