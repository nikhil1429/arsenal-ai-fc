#!/usr/bin/env node
// ============================================================================================================
// ci/mrj/run_mutants_mrj.mjs — ONE MUTANT PER CLAUSE of ci/mrj/witness_mrj.mjs, plus a CONTROL. Header = contract.
//
//   node ci/mrj/run_mutants_mrj.mjs --org <build tree> --base-org <BASE tree>
//
// Each mutant is a fresh copy of --org under os.tmpdir() (never the live tree), changed by an exact string replace in
// node (no POSIX shell, CRLF-proof: the replace refuses if its anchor is not found once), then judged by THIS dir's
// witness_mrj.mjs with --base-org. A mutant counts only when the witness exits 1 and its LAST line names the mutant's
// clause; the CONTROL (no change) must read GREEN. No port, no daemon, no model call; every wait is bounded by the
// org's own timeout-minutes in .github/workflows/suite.yml (read, never typed).
//   MU-R1    postmatch.mjs: JUDGE_CHILD_MS drops the dispatch margin (a revert of unit mtail F-B)         → R1 M3
//   MU-R2    gaffer_brain.mjs: the first batch killed at `remaining` (a revert of unit mjd3's kill point) → R2 M5
//   MU-R3    gaffer_brain.mjs: judgeBatchSize ignores the kill floors (a revert of unit mjd2)              → R3 M6
//   MU-R4    the mjud witness's GREEN last line leaves the member's grammar                                 → R4 MEMBER
//   MU-R5    the ruled-red mjud entry owned by unit mrj is put back in KNOWN_RED                             → R5 KNOWN
//   MU-R6    the struck old text (~~…~~) leaves the mjud witness header                                      → R6 HEADER
//   MU-BOUND one organ file outside the named files moves (a comment line on scripts/brain.mjs)              → BOUND
//   MU-LAST  the mjud witness leaves a detached node child naming its own (temp) path behind                 → LAST
//            (the child polls for that path and exits once it is gone; the witness's LAST kills it as well)
// LAST LINE: `run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED` (exit 0 iff k = n
// and the control is GREEN, else exit 1).
// ============================================================================================================
import { mkdtempSync, cpSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
if (!ORG || !BASE_ORG) { console.log("run_mutants: USAGE --org <build tree> --base-org <BASE tree>"); process.exit(1); }
const wf = (() => { try { return readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec(wf) || [])[1]);
if (!(jobMin > 0)) { console.log("run_mutants: no timeout-minutes in the org's .github/workflows/suite.yml (no bound to read)"); process.exit(1); }
const T0 = Date.now(), left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());
const fwd = (p) => String(p).replace(/\\/g, "/");

const WJ = "ci/mjud/witness_mjud.mjs";
const SLEEPER = '\n{ const { spawn } = await import("node:child_process"); spawn(process.execPath, ["-e", "const fs=require(\'fs\');const p=process.argv[1];setInterval(()=>{if(!fs.existsSync(p))process.exit(0)},100)", HERE], { detached: true, stdio: "ignore", windowsHide: true }).unref(); }\n';
const MUTANTS = [
  { name: "MU-R1", clause: "R1 M3", edits: [["scripts/postmatch.mjs", "export const JUDGE_CHILD_MS = JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS;", "export const JUDGE_CHILD_MS = JUDGE_BUDGET_MS;"]] },
  { name: "MU-R2", clause: "R2 M5", edits: [["scripts/gaffer_brain.mjs", "budget_ms: sz.call_ms, batch:", "budget_ms: remaining, batch:"]] },
  { name: "MU-R3", clause: "R3 M6", edits: [["scripts/gaffer_brain.mjs", "const floor = floors.length ? Math.max(...floors) : null;", "const floor = null;"], ["scripts/gaffer_brain.mjs", "const seen = [...rates, ...floors];", "const seen = [...rates];"]] },
  { name: "MU-R4", clause: "R4 MEMBER", edits: [[WJ, "console.log(`GREEN MJUD ", "console.log(`GREEN MJUD-MUTANT "]] },
  { name: "MU-R5", clause: "R5 KNOWN", edits: [["scripts/organism_test.mjs", "const KNOWN_RED = [\n", 'const KNOWN_RED = [\n  { assert: "WITNESS ‹mjud› · GREEN at head against its BASE", detail: "red beyond BOUND: M3 CENSUS M5 F3-CLIP M6 MJD2", row: 1107, owner: "unit mrj", until: "mrj re-judges mjud M3, M5, M6 and lands it" },\n']] },
  { name: "MU-R6", clause: "R6 HEADER", edits: [[WJ, /~~/g, ""]] },
  { name: "MU-BOUND", clause: "BOUND", edits: [["scripts/brain.mjs", /$/, "\n// MU-BOUND (unit mrj mutant): one line outside the named files\n"]] },
  { name: "MU-LAST", clause: "LAST", edits: [[WJ, /\nprocess\.exit\(0\);\s*$/, `${SLEEPER}process.exit(0);\n`]] },
];
const TMP = mkdtempSync(join(tmpdir(), "mrj-mu-"));
const runOne = (m) => {
  const mu = join(TMP, m.name);
  cpSync(ORG, mu, { recursive: true, filter: (s) => !/^(node_modules|\.git)(\/|$)/.test(fwd(relative(ORG, s))) });
  for (const [f, from, to] of m.edits) {
    const p = join(mu, f), src = readFileSync(p, "utf8").replace(/\r\n/g, "\n");
    const n = typeof from === "string" ? src.split(from).length - 1 : (src.match(new RegExp(from.source, from.flags.includes("g") ? from.flags : from.flags + "g")) || []).length;
    if (typeof from === "string" ? n !== 1 : n < 1) return { last: `ANCHOR NOT FOUND (${n}) in ${f}`, code: null };
    writeFileSync(p, typeof from === "string" ? src.replace(from, to) : src.replace(from, to));
  }
  const r = spawnSync(process.execPath, [join(HERE, "witness_mrj.mjs"), "--org", mu, "--base-org", BASE_ORG], { encoding: "utf8", timeout: left(), windowsHide: true, maxBuffer: 1 << 26 });
  try { rmSync(mu, { recursive: true, force: true }); } catch { }
  return { last: String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).at(-1) || `(no line · exit ${r.status})`, code: r.status };
};
const c = runOne({ name: "CONTROL", edits: [] });
const controlOk = c.code === 0 && c.last.startsWith("GREEN MRJ ");
console.log(`CONTROL · ${c.last}`);
let k = 0;
for (const m of MUTANTS) {
  const r = runOne(m);
  const named = r.code === 1 && new RegExp(`^RED MRJ · (.* · )?${m.clause}( · |$)`).test(r.last);
  if (named) k++;
  console.log(`${m.name} (→ ${m.clause}) · ${r.last}${named ? "" : "   ← NOT RED BY ITS CLAUSE"}`);
}
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${controlOk ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && controlOk ? 0 : 1);
