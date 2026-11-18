#!/usr/bin/env node
// ============================================================================
// run_mutants_mjd6.mjs — unit mjd6: ONE MUTANT PER CLAUSE of witness_mjd6.mjs, each on a copy of the build tree under os.tmpdir().
// CONTRACT:  node ci/mjd6/run_mutants_mjd6.mjs --org <build tree> --base-org <base tree>
//   control  the build tree unmutated                                         → the witness must be GREEN
//   S1       sync never runs the sweep                                        → S1 RED
//   S2       the sweep retires every live in-doubt card, settled or not       → S2 RED
//   S3       the sweep re-stamps a card it already retired (no settled check) → S3 RED
//   BOUND    a file beyond the two named ones is touched                      → BOUND RED
//   LAST     sync leaves a node process naming its tree behind                → LAST RED
// Every wait is bounded by a node start measured in this run; the LAST mutant's sleeper is killed by this runner after its
// witness has named it, so the runner itself leaves nothing behind. No port, no live service.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, appendFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mjd6.mjs");
const TMP = mkdtempSync(join(tmpdir(), "mjd6m-"));
const t0 = process.hrtime.bigint();
spawnSync(process.execPath, ["-e", ""], { encoding: "utf8" });
const nodeStartMs = Math.max(1, Number(process.hrtime.bigint() - t0) / 1e6);
const BOUND_MS = Math.ceil(nodeStartMs * 1000);          // the same measured scale the witness uses for one child
const WITNESS_BOUND_MS = BOUND_MS * 20;                   // a witness runs that many children at most (rounds, syncs, deals, listing)

const edit = (rel, from, to) => (tree) => {
  const p = join(tree, rel), s = readFileSync(p, "utf8");
  if (!s.includes(from)) throw new Error(`mutant anchor not found in ${rel}: ${from.slice(0, 60)}`);
  writeFileSync(p, s.replace(from, to));
};
const CC = "scripts/captains_call.mjs";
const MUTANTS = [
  { id: "S1", apply: edit(CC, "const next = sweepSettledFromDoubt(deriveCards(loadState(), gatherSources(), now), readLinesJson(GRADE_QUEUE), now).state;",
    "const next = deriveCards(loadState(), gatherSources(), now);") },
  { id: "S2", apply: edit(CC, "    if (!m || !settled.has(m[1])) continue;", "    if (!m) continue;") },
  { id: "S3", apply: (tree) => {
    edit(CC, "  for (const c of ((state && state.cards) || [])) {\n    if (!c || c.answer || c.retired_at) continue;\n    const m = /^judge:in-doubt:",
      "  for (const c of ((state && state.cards) || [])) {\n    if (!c || c.answer) continue;\n    const m = /^judge:in-doubt:")(tree);
    edit(CC, "    const r = retireCard(s, { key: c.key, why: SWEEP_WHY, now });",
      "    const r = retireCard({ ...s, cards: s.cards.map((x) => (x && x.key === c.key ? { ...x, retired_at: null } : x)) }, { key: c.key, why: SWEEP_WHY, now });")(tree);
  } },
  { id: "BOUND", apply: (tree) => appendFileSync(join(tree, "scripts", "capture.mjs"), "\n// mutant\n") },
  // the sleeper names this runner's TMP, so the runner can kill it after its witness has named it (LAST RED)
  { id: "LAST", apply: edit(CC, "function sync(now = new Date()) {\n",
    "function sync(now = new Date()) {\n  process.getBuiltinModule(\"node:child_process\").spawn(process.execPath, [\"-e\", \"setTimeout(()=>{}, " + BOUND_MS + ")\", __dirname, " + JSON.stringify(TMP) + "], { detached: true, stdio: \"ignore\" }).unref();\n") },
];

const runWitness = (tree) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", tree, "--base-org", BASE], { encoding: "utf8", timeout: WITNESS_BOUND_MS, windowsHide: true });
  const out = String(r.stdout || "").split(/\r?\n/).filter(Boolean);
  return { code: r.status, last: out[out.length - 1] || "", red: out.filter((l) => /^RED {3}/.test(l)).map((l) => l.split(" ").filter(Boolean)[1]) };
};
const copy = () => { const d = mkdtempSync(join(TMP, "m-")); cpSync(ORG, d, { recursive: true, verbatimSymlinks: true }); return d; };

const ctl = runWitness(copy());
console.log(`control · exit ${ctl.code} · ${ctl.last}`);
let k = 0;
for (const m of MUTANTS) {
  const t = copy();
  let r;
  try { m.apply(t); r = runWitness(t); } catch (e) { r = { code: null, last: String(e.message), red: [] }; }
  const hit = r.code === 1 && r.red.includes(m.id);
  if (hit) k++;
  console.log(`mutant ${m.id} · ${hit ? "RED by its clause" : "NOT caught"} · reds ${r.red.join(" ") || "none"} · ${r.last.replace(/\/[^\s]*mjd6-[A-Za-z0-9]+/g, "<tmp>/mjd6-*")}`);
}
const procs = () => (process.platform === "win32"
  ? (spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", timeout: BOUND_MS }).stdout || "")
  : (spawnSync("ps", ["-eo", "pid=,args="], { encoding: "utf8", timeout: BOUND_MS }).stdout || ""))
  .split(/\r?\n/).map((l) => l.trim()).filter((l) => l.includes(TMP) && !l.includes("Get-CimInstance") && !/ ps /.test(` ${l}`))
  .map((l) => Number(l.split(/\s+/)[0])).filter((n) => Number.isInteger(n) && n > 0 && n !== process.pid);
for (const pid of procs()) { try { process.kill(pid); } catch { } }
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
const ctlGreen = ctl.code === 0 && /^GREEN MJD6/.test(ctl.last);
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${ctlGreen ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && ctlGreen ? 0 : 1);
