// unit mfix — THE CODE-COUPLED KEYS of a config file, measured the way coupled.mjs measures registry rows: start with
// every top-level key of <file> VERBATIM, turn keys SYNTHETIC one at a time (synth.mjs's transform on that key's value)
// while the member stays green. What is left verbatim is what its asserts need real. The member's other plant files ride
// verbatim beside it (their synthesis is measured apart). Names + exits only.
//   node ci/mfix/tools/coupled_keys.mjs <sha> <organ> <file> [other,files] >> ci/mfix/census/coupled_keys.jsonl
import { mk, suiteSource, cmdOf, WAIT, runIn, rm, SD, REPO } from "./lib.mjs";
import { writeFileSync } from "node:fs"; import { join } from "node:path"; import { execFileSync } from "node:child_process";
const [sha, organ, file, othersArg] = process.argv.slice(2); const others = (othersArg || "").split(",").filter(Boolean);
const src = suiteSource(sha), cmd = cmdOf(sha, src), wait = WAIT(src);
const base = JSON.parse(execFileSync("git", ["-C", REPO, "show", `${sha}:${SD}/${file}`], { encoding: "utf8", maxBuffer: 1 << 28 }));
const KEEP = new Set(["subject", "id", "version"]);
const tx = (v, k) => {
  if (Array.isArray(v)) return k === "rulings" ? [] : v.map((x) => tx(x, null));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([kk, x]) => [kk, tx(x, kk)]));
  if (typeof v === "string") return KEEP.has(k) ? v : "fx";
  if (typeof v === "number") return v === 0 ? 0 : 1;
  return v;
};
const keys = Object.keys(base);
const green = async (real) => { const d = mk(sha, { keep: [file, ...others] });
  writeFileSync(join(d, SD, file), JSON.stringify(Object.fromEntries(keys.map((k) => [k, real.includes(k) ? base[k] : tx(base[k], k)])), null, 1));
  const r = await runIn(d, cmd(organ), wait); rm(d); return r.code === 0; };
let real = [...keys]; const start = await green(real);
if (start) for (const k of keys) { const w = real.filter((x) => x !== k); if (await green(w)) real = w; }
console.log(JSON.stringify({ organ, file, others, keys: keys.length, all_real_green: start, real_keys: start ? real : null }));
