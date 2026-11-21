// unit mplant · THE MEMBER SETS of a tree, read off its own source (no member is run, no state file is read).
//   node ci/mplant/tools/sets.mjs [<tree>] [--json]
// It prints, for the hermetic profile of <tree> (default: this checkout):
//   targets   = scripts/*.mjs with a selftest (organism_test.mjs hasSelftest, the regex copied off the tree's own line)
//   live      = the keys of LIVE_SELFTESTS (ci/mplant/plant.mjs liveTables, a verbatim copy of ci/mlaw2/plant.mjs)
//   suite     = the members of the three SUITE_NAMES chains of package.json
//   loopOnly  = targets not LIVE and in no suite: hermetic()'s loop spawns them and suites() never does
//   suiteNL   = suite members not LIVE (the mlaw2 --non-live contrast class)
// It reads source files and package.json only; it never opens a file under the state dir.
import { readFileSync, readdirSync } from "node:fs"; import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";
import { liveTables } from "../plant.mjs"; import { mask } from "./mask.mjs";
const HERE = dirname(fileURLToPath(import.meta.url));
const d = process.argv.slice(2).find((a) => !a.startsWith("--")) || join(HERE, "..", "..", "..");
const ot = readFileSync(join(d, "scripts", "organism_test.mjs"), "utf8");
const hs = ot.match(/const hasSelftest = \(f\) => \{ const src = readOrgan\(f\); return (.*?); \};/);
if (!hs) throw new Error("hasSelftest's line not found in organism_test.mjs: the copy below would be a guess");
const has = (src) => /['"`]selftest['"`]/.test(src) || /function selftest\(/.test(src);
const targets = readdirSync(join(d, "scripts")).filter((f) => f.endsWith(".mjs") && f !== "organism_test.mjs")
  .filter((f) => has(readFileSync(join(d, "scripts", f), "utf8"))).map((f) => f.slice(0, -4)).sort();
const live = new Set(liveTables(d).selftests.map((x) => x.key));
const pkg = JSON.parse(readFileSync(join(d, "package.json"), "utf8"));
const SUITES = JSON.parse((ot.match(/const SUITE_NAMES = (\[[^\]]+\])/) || [])[1]);
const suite = [...new Set(SUITES.flatMap((n) => [...String(pkg.scripts[n] || "").matchAll(/scripts\/([A-Za-z0-9_\-]+)\.mjs/g)].map((m) => m[1])))];
const suiteNL = suite.filter((o) => !live.has(o)).sort();
const loopOnly = targets.filter((o) => !live.has(o) && !suite.includes(o));
const out = { targets: targets.length, live: live.size, suite: suite.length, suiteNL, loopOnly, hermeticSpawned: [...new Set([...targets.filter((o) => !live.has(o)), ...suiteNL])].sort() };
// --raw keeps the real names (for a census tool's own use in-process: never redirect it into a committed file)
const M = process.argv.includes("--raw") ? (x) => x : mask;
if (process.argv.includes("--json")) console.log(JSON.stringify({ ...out, suiteNL: suiteNL.map(M), loopOnly: loopOnly.map(M), hermeticSpawned: out.hermeticSpawned.map(M) }));
else { console.log(`suite non-LIVE (${suiteNL.length}): ${suiteNL.map(M).join(" ")}`); console.log(`loop-only non-LIVE (${loopOnly.length}): ${loopOnly.map(M).join(" ")}`); }
console.error(`mplant sets: targets ${targets.length} · LIVE selftests ${live.size} · suite members ${suite.length} · suite non-LIVE ${suiteNL.length} · loop-only non-LIVE ${loopOnly.length} · hermetic spawns ${out.hermeticSpawned.length} distinct organs`);
