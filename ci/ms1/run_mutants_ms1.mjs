#!/usr/bin/env node
// ============================================================================
// ci/ms1/run_mutants_ms1.mjs — one mutant per clause of ci/ms1/witness_ms1.mjs, each RED by the clause that names it
//   node ci/ms1/run_mutants_ms1.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build's named files (scripts/organism_test.mjs, land.mjs, ci_verdict.mjs,
// .github/workflows/suite.yml, ci/) with ONE edit, applied only if its anchor occurs exactly once (else the mutant itself
// is RED: an edit that cannot land proves nothing). The witness runs `--only <clause>` over it and must print
// `RED MS1 · <clause>`. The control is the unedited copy over every clause at once: GREEN. BOUND and LAST are seat-time
// clauses and carry no mutant.
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
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_ms1.mjs");
const OT = "scripts/organism_test.mjs", LAND = "scripts/land.mjs", CV = "scripts/ci_verdict.mjs";
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-ms1-"));

/** [clause, file, anchor, replacement] — or [clause, null, relpath-to-delete] */
const MUTANTS = [
  ["B1.1 BASE", OT, '"--base-org", baseT]', '"--base-org", orgT]'],
  ["B1.2 LF", OT, '"-c", "core.eol=lf", ', ""],
  ["B1.3 NOCALC", OT, "e2 = lfTree(ROOT, base, baseT);", 'e2 = lfTree(ROOT, base, baseT); spawnSync("git", ["-C", ROOT, "merge-base", "HEAD", "origin/main"], { windowsHide: true });'],
  ["B2.1 FULL", OT, "{ console.log(WITNESS_SKIP); return; }", "{ return; }"],
  ["B2.2 LAPTOP", OT, 'PROFILE === "hermetic" && process.env.GITHUB_ACTIONS === "true"', 'PROFILE === "hermetic"'],
  ["B2.3 NEUTRAL", OT, 'if (!(PROFILE === "hermetic" && process.env.GITHUB_ACTIONS === "true"))', 'if ((PROFILE === "hermetic" && process.env.GITHUB_ACTIONS === "true"))'],
  ["B3.1 CARRIED", null, "ci/mf2/BASE"],
  ["B3.2 NOCI", LAND, ".some((p) => /^ci\\/[a-z0-9-]+\\/BASE$/.test(p))) {", ".some(() => false)) {"],
  ["B3.3 CIDIR", LAND, "|| !touched.some((p) => p.startsWith(`ci/${unit}/`)))", "|| true)"],
  ["B3.4 BEFORE", LAND, "if (lines(git([\"ls-tree\", \"-r\", \"--name-only\", P, \"--\", \"ci\"]).out).some(", "if (true || lines(git([\"ls-tree\", \"-r\", \"--name-only\", P, \"--\", \"ci\"]).out).some("],
  ["B3.5 GATE", LAND, 'const WITNESS_DIR = "ci/";', 'const WITNESS_DIR = "ci/witness/";'],
  ["B4.1 LISTEN", OT, 'if (n) { const o = ports.literal.find((p) => p.port === n[1]); hits.push(', 'if (false) { const o = ports.literal.find((p) => p.port === n[1]); hits.push('],
  ["B4.2 DERIVED", OT, "for (const p of ports.named) if (!p.door && new RegExp", 'for (const p of [{ name: "JUDGE_PORT", door: "ARSENAL_JUDGE_PORT", at: "scripts/keeper.mjs:92" }]) if (!p.door && new RegExp'],
  ["B4.3 ADMIT", OT, "const n = /\\blisten\\(\\s*([1-9]\\d{0,4})\\b/.exec(l);\n      if (n) { const o", "const n = /\\blisten\\(\\s*(\\d{1,5})\\b/.exec(l);\n      if (n) { const o"],
  ["B4.4 NOSPAWN", OT, 'assert(name("binds no fixed service port (B4)"), false, hits.join(" · ")); continue; }', 'assert(name("binds no fixed service port (B4)"), false, hits.join(" · ")); }'],
  ["B4.5 DOOR", OT, "for (const p of ports.named) if (p.door) env[p.door] = String(await freePort());", ""],
  ["B5.1 SECONDS", OT, "console.log(`  witness ‹${unit}› ${secs} s · ${j.last}`);", ""],
  ["B5.2 NOFETCH", OT, "const inClone = spawnSync(", 'spawnSync("git", ["-C", ROOT, "fetch", "-q", "origin", base], { windowsHide: true });\n    const inClone = spawnSync('],
  ["B6.1 NOBASE", OT, "if (baseText === null || !/^[0-9a-f]{40}\\r?\\n?$/.test(baseText))", "if (baseText === null) continue;\n    if (!/^[0-9a-f]{40}\\r?\\n?$/.test(baseText))"],
  ["B6.2 SHORT", OT, "!/^[0-9a-f]{40}\\r?\\n?$/.test(baseText)", "!/^[0-9a-f]{7,40}\\r?\\n?$/.test(baseText)"],
  ["B6.3 SKIPWINS", OT, '{ console.log(WITNESS_SKIP); return; }', "{ console.log(WITNESS_SKIP); }"],
  ["F1 BOUND", OT, "for (const id of bids) rest =", "for (const id of []) rest ="],
  ["F1W BOUNDID", OT, '...[...src.matchAll(/["\'`]((?:[A-Z][A-Z0-9-]*\\s+)?BOUND)["\'`]/g)].map((m) => m[1])', ""],
  ["F11 BEHAVE", OT, 'const left = rest.replace(/[\\s,·]+/g, " ").trim();', 'const left = "";'],
  ["R1 RULED", OT, '{ assert: "WITNESS ‹mjd3› · GREEN at head against its BASE", detail: "red beyond BOUND: J4", row: 1107,', '{ assert: "WITNESS ‹mjd3› · GREEN at head against its BASE", detail: "red beyond BOUND: J4", row: 1106,'],
  ["R2 STALE", OT, "const stale = list.filter((e) => ok(e) && passed.includes(e.assert)).map((e) => e.assert);", "const stale = [];"],
  ["R3 NEWDEATH", OT, '(e.detailRe ? new RegExp(e.detailRe).test(f.detail || "") : (e.detail ?? "") === (f.detail ?? ""))', "(true)"],
  ["V1 KEYOF", CV, '.map((p, i) => (i % 2 ? p : p.replace(/\\d+/g, "#")))', '.map((p) => p.replace(/\\d+/g, "#"))'],
];

function copyTree(dst) {
  for (const f of [OT, LAND, CV, ".github/workflows/suite.yml"]) { mkdirSync(dirname(join(dst, f)), { recursive: true }); cpSync(join(ORG, f), join(dst, f)); }
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
    const ok = applied && r.code === 1 && r.last === `RED MS1 · ${clause}`;
    if (ok) k++;
    console.log(`  ${ok ? "✓" : "✗"} μ ${clause} → ${r.last}`);
  });
  const c = join(ROOT, "control"); copyTree(c);
  const r = witness(c, MUTANTS.map((m) => m[0]).join(","));
  control = r.code === 0 && /^GREEN MS1 /.test(r.last) ? "GREEN" : "RED";
  console.log(`  ${control === "GREEN" ? "✓" : "✗"} control → ${r.last}`);
} finally { try { rmSync(ROOT, { recursive: true, force: true }); } catch {} }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control}`);
process.exit(k === MUTANTS.length && control === "GREEN" ? 0 : 1);
