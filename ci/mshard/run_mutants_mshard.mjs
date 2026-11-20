#!/usr/bin/env node
// ============================================================================
// ci/mshard/run_mutants_mshard.mjs — one mutant per clause of ci/mshard/witness_mshard.mjs, each RED by the clause that names it
//   node ci/mshard/run_mutants_mshard.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build's named files (scripts/organism_test.mjs, scripts/ci_verdict.mjs,
// .github/workflows/suite.yml, ci/mshard/) with its edits, each applied only if its anchor occurs exactly once (else the
// mutant itself is RED: an edit that cannot land proves nothing). The witness runs `--only <clause>` over it and must print
// `RED MSHARD · <clause>`. The control is the unedited copy over every clause at once: GREEN. BOUND and LAST are seat-time
// clauses and carry no mutant. Every spawn is bounded by the tree's own suite.yml timeout-minutes (read, never typed).
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
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mshard.mjs");
const OT = "scripts/organism_test.mjs", CV = "scripts/ci_verdict.mjs", WF = ".github/workflows/suite.yml";
const JOB_MS = (() => { try { const m = /timeout-minutes:\s*(\d+)/.exec(readFileSync(join(ORG, WF), "utf8")); return m ? Number(m[1]) * 60000 : 0; } catch { return 0; } })();
if (!JOB_MS) { console.log("run_mutants: the org carries no suite.yml timeout-minutes (no bound to read)"); process.exit(1); }
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-mshard-"));

/** [clause, [[file, anchor, replacement], …]] */
const MUTANTS = [
  ["W-S1 PLAN", [[OT, "for (const u of order) { let k = 0;", "for (const u of order.slice(0, -1)) { let k = 0;"]]],
  ["W-S2 COVER", [[CV, "if (!mine.length) { reds.push(`${tag} · produced its machine line (unit mshard)`); for", "if (!mine.length) { for"]]],
  ["W-S3 UNJUDGED", [[CV, "if (!jd.has(u) || !mineWant.has(u)) red(u);", "if (!mineWant.has(u)) red(u);"]]],
  ["W-S4 DOUBLE", [[CV, "if (!jd.has(u) || !mineWant.has(u)) red(u);", "if (!jd.has(u)) red(u);"], [CV, "for (const u of units) if (seen.get(u) !== 1) red(u);", "for (const u of units) if (!seen.get(u)) red(u);"]]],
  ["W-S5 EQUIV", [[CV, "pass += v.pass; fail += v.fail; all.push(...v.reds);", "pass += v.pass; fail += v.fail; if (k < n) all.push(...v.reds);"]]],
  ["W-S6 SHA", [[CV, "if (String(s.head) !== String(plan.head) || Number(s.n) !== n)", "if (Number(s.n) !== n)"]]],
  ["W-S7 FAILCLOSED", [[CV, "if (!plan && !partTexts.length) return { suite: head, shards: null };", "if (!partTexts.length) return { suite: head, shards: null };"]]],
  ["W-S8 SHARDRUN", [[OT, "    units = plan.shards[k - 1];\n", "    void plan.shards[k - 1];\n"]]],
  ["W-S9 BADDOOR", [[OT, "    if (!plan || !n || !good) {\n      assert(", "    if (!plan || !n || !good) { return;\n      assert("]]],
  ["W-S10 ONEBOUND", [[CV, "bounds.every((b) => b === bounds[0])", "bounds.length > 0"]]],
  ["W-S11 LEGNAME", [[CV, "legLike.length === 1],", "legLike.length >= 1],"]]],
  ["W-S12 HEADALL", [[OT, "const order = [...units].sort(", 'const order = [...units].filter((u) => spawnSync("git", ["-C", ROOT, "diff", "--quiet", "HEAD~1", "HEAD", "--", "ci/" + u], { windowsHide: true }).status !== 0).sort(']]],
  ["W-S13 PRIVACY", [[CV, "out.push(`${TAGS.verdict}${JSON.stringify(d)}`);", "out.push(`${TAGS.verdict}${JSON.stringify(v)}`);"]]],
  ["W-S14 UNSHARDED", [[OT, "  /** @type {Record<string, number>} */\n  const secsOf = {};", "  console.log(\"WITNESS_PLAN {}\");\n  /** @type {Record<string, number>} */\n  const secsOf = {};"]]],
  ["W-S15 LPT", [[OT, "w(b) - w(a) ||", "w(a) - w(b) ||"]]],
  ["W-S16 DOORLESS", [[OT, "      for (const d of Object.keys(env).filter(isShardDoor)) delete env[d];   // unit mshard: a witness's own plant meets the unsharded member\n", ""]]],
  ["W-S17 PLANRUN", [[OT, "if (doorN !== undefined) { console.log(`WITNESS_PLAN ${", "if (doorN !== undefined) { console.log(`WITNESS_PLAN_ ${"]]],
  ["W-S18 CAUSE", [[CV, "live.push(...v.live); causes.push(...v.causes);", "live.push(...v.live);"]]],
  ["W-S19 TIMES", [[CV, "max[u] = Math.max(max[u] ?? 0, v);", "max[u] = Math.min(max[u] ?? v, v);"]]],
  ["W-S20 WIRING", [[WF, "    if: ${{ !cancelled() }}", "    if: ${{ success() }}"]]],
  ["W-S21 KREAD", [[OT, "return ks.length > 0 && ks.every((s, i) => s === String(i + 1)) ? ks.length : null;", "return ks.length > 0 && ks.every((s, i) => s === String(i + 1)) ? 3 : null;"]]],
];

function copyTree(dst) {
  for (const f of [OT, CV, WF]) { mkdirSync(dirname(join(dst, f)), { recursive: true }); cpSync(join(ORG, f), join(dst, f)); }
  if (existsSync(join(ORG, "ci", "mshard"))) cpSync(join(ORG, "ci", "mshard"), join(dst, "ci", "mshard"), { recursive: true });
}
const witness = (tree, only) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", tree, "--base-org", BASE, "--only", only], { encoding: "utf8", windowsHide: true, timeout: JOB_MS, maxBuffer: 1 << 26 });
  const out = ((r.stdout || "") + (r.stderr || "")).trim().split(/\r?\n/);
  return { code: r.status, last: out[out.length - 1] || "" };
};

let k = 0, control = "RED";
try {
  MUTANTS.forEach(([clause, edits], i) => {
    const d = join(ROOT, `m${i}`); copyTree(d);
    let applied = true;
    for (const [file, anchor, repl] of edits) {
      const p = join(d, file), s = readFileSync(p, "utf8").replace(/\r\n/g, "\n"), n = s.split(anchor).length - 1;
      if (n !== 1) { applied = false; break; }
      writeFileSync(p, s.replace(anchor, () => repl));
    }
    const r = applied ? witness(d, clause) : { code: null, last: "(an edit did not apply exactly once)" };
    const ok = applied && r.code === 1 && r.last === `RED MSHARD · ${clause}`;
    if (ok) k++;
    console.log(`  ${ok ? "✓" : "✗"} μ ${clause} → ${r.last}`);
  });
  const c = join(ROOT, "control"); copyTree(c);
  const r = witness(c, MUTANTS.map((m) => m[0]).join(","));
  control = r.code === 0 && /^GREEN MSHARD /.test(r.last) ? "GREEN" : "RED";
  console.log(`  ${control === "GREEN" ? "✓" : "✗"} control → ${r.last}`);
} finally { try { rmSync(ROOT, { recursive: true, force: true }); } catch {} }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control}`);
process.exit(k === MUTANTS.length && control === "GREEN" ? 0 : 1);
