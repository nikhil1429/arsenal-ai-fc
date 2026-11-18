#!/usr/bin/env node
// ci/mf4/run_mutants.mjs — P3 of unit mf4. ONE mutant per witness clause, each a copy of --org under os.tmpdir() with
// ONE exact edit (the edit must apply, or the mutant is RED as "did not apply"); each must be RED BY THE CLAUSE THAT
// NAMES IT in witness_mf4.mjs's own output. The control (the unmutated --org) must be GREEN.
//   node ci/mf4/run_mutants.mjs --org <build tree> --base-org <base tree>
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? resolve(args[i + 1]) : null; };
const ORG = opt("--org"), BASE = opt("--base-org");
if (!ORG || !BASE) { console.log("run_mutants: usage --org <build tree> --base-org <base tree>"); process.exit(2); }
const DG = "scripts/daily_green.mjs";
const MUTANTS = [
  { clause: "W1 CANARY", what: "the canary reads N-A instead of RED", file: DG, from: "canary = R(`NO SITTING: learn session", to: "canary = NA(`NO SITTING: learn session" },
  { clause: "W2 SITTING", what: "the learn read also runs on a day WITH a sitting", file: DG, from: "if (sd.known && !sd.study) {", to: "if (sd.known) {" },
  { clause: "W3 NEITHER", what: "every archive-named session counts as a learn session", file: DG, from: "const sessions = ev.sessions.filter((s) => s.sources.includes(\"transcript\")).map((s) => s.id);", to: "const sessions = named.sessions;" },
  { clause: "W4 SELFTEST", what: "one MF4 selftest clause is lost (renamed away)", file: DG, from: "\"MF4 PRIVACY — ", to: "\"MF4 PRIVATE — " },
  { clause: "W5 STREAK", what: "the canary day stays non-study, so the streak skips it", file: DG, from: "sd = { known: true, study: true, why: `NO SITTING REGISTERED", to: "sd = { known: true, study: false, why: `NO SITTING REGISTERED" },
  { clause: "W6 BOUND", what: "a file outside the named one is edited", file: "scripts/state.mjs", append: "\n// mf4 mutant: an edit outside the named file\n" },
  { clause: "W7 LAST", what: "the CLI spawns claude (--version only; the fake is first on PATH)", file: DG, from: "async function main() {", to: "async function main() { spawnSync(\"claude\", [\"--version\"], { shell: true });" },
];
const witness = (org) => {
  const r = spawnSync(process.execPath, [join(HERE, "witness_mf4.mjs"), "--org", org, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
  const lines = String(r.stdout || "").split(/\r?\n/).filter((l) => l.trim());
  return { exit: r.status, lines, last: lines[lines.length - 1] || "(no output)" };
};
let red = 0;
for (const m of MUTANTS) {
  const T = mkdtempSync(join(tmpdir(), "mf4-mutant-"));
  const org = join(T, "org");
  cpSync(ORG, org, { recursive: true });
  const p = join(org, m.file);
  const src = readFileSync(p, "utf8");
  let applied;
  if (m.append) { writeFileSync(p, src + m.append); applied = true; }
  else { applied = src.split(m.from).length === 2; if (applied) writeFileSync(p, src.replace(m.from, m.to)); }
  if (!applied) { console.log(`  RED   ${m.clause} mutant DID NOT APPLY (${m.what})`); rmSync(T, { recursive: true, force: true }); continue; }
  const w = witness(org);
  const named = w.lines.find((l) => l.includes(` ${m.clause} · `)) || "";
  const byName = w.exit === 1 && /^\s*RED\s/.test(named) && w.last.startsWith("RED MF4 ·") && w.last.includes(m.clause);
  if (byName) red++;
  console.log(`  ${byName ? "ok  " : "MISS"} mutant ${m.clause} (${m.what}) → exit ${w.exit} · ${w.last}`);
  rmSync(T, { recursive: true, force: true });
}
const c = witness(ORG);
const controlGreen = c.exit === 0 && c.last.startsWith("GREEN MF4");
console.log(`  ${controlGreen ? "ok  " : "MISS"} control (the unmutated --org) → exit ${c.exit} · ${c.last}`);
console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${controlGreen ? "GREEN" : "RED"}`);
process.exit(red === MUTANTS.length && controlGreen ? 0 : 1);
