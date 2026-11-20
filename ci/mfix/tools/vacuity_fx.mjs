// unit mfix — do the members unit mlaw2 EXCLUDED AS VACUOUS (claude/mlaw2-census cf1785c, census/SUMMARY.txt) stop being
// vacuous on a SYNTHETIC plant? For each, run on Z and on the synth.mjs `ids` transform of the named files, and count the
// two vacuity signs mlaw2's vacuity.mjs reads: a swallowed throw (the line "registry lanes table is EMPTY") and a
// "NOT MEASURED" line. Counts + exits only, never a line.
//   node ci/mfix/tools/vacuity_fx.mjs <sha> <file,file…> <organ…> > ci/mfix/census/vacuity_fx.jsonl
import { mk, suiteSource, cmdOf, WAIT, runIn, rm, SD, REPO } from "./lib.mjs";
import { writeFileSync } from "node:fs"; import { join } from "node:path"; import { execFileSync, spawn } from "node:child_process";
const [sha, filesArg, ...organs] = process.argv.slice(2); const files = filesArg.split(",");
const src = suiteSource(sha), cmd = cmdOf(sha, src), wait = WAIT(src);
const KEEP = new Set(["subject", "id", "version"]);
const tx = (v, k) => Array.isArray(v) ? (k === "rulings" ? [] : v.map((x) => tx(x, null))) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([kk, x]) => [kk, tx(x, kk)])) : typeof v === "string" ? (KEEP.has(k) ? v : "fx") : typeof v === "number" ? (v === 0 ? 0 : 1) : v;
const raw = (d, argv) => new Promise((res) => { const c = spawn(process.execPath, argv, { cwd: d, env: { ...process.env, HOME: d, ANTHROPIC_API_KEY: "" } }); let o = ""; c.stdout.on("data", (b) => { o += b; }); c.stderr.on("data", (b) => { o += b; }); const k = setTimeout(() => c.kill("SIGKILL"), wait); c.on("close", (code) => { clearTimeout(k); res({ code, o }); }); });
for (const o of organs) for (const side of ["Z", "S"]) {
  const d = mk(sha, "Z");
  if (side === "S") for (const f of files) { let base; try { base = JSON.parse(execFileSync("git", ["-C", REPO, "show", `${sha}:${SD}/${f}`], { encoding: "utf8", maxBuffer: 1 << 28 })); } catch { continue; } writeFileSync(join(d, SD, f), JSON.stringify(tx(base, null), null, 1)); }
  const r = await runIn(d, cmd(o), wait); const x = await raw(d, cmd(o)); rm(d);
  console.log(JSON.stringify({ organ: o, side, files: side === "S" ? files : [], exit: r.code, swallowed_empty_lanes: (x.o.match(/registry lanes table is EMPTY/g) || []).length, not_measured: (x.o.match(/NOT MEASURED/g) || []).length }));
}
