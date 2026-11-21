// unit mplant probe · `node ci/mplant/tools/probes/two.mjs <sha> [<preload.mjs>]`: sandbox.mjs selftest on ONE empty plant, optionally with an --import preload in NODE_OPTIONS; prints its FAIL lines and headline.
import { plant, plantEnv } from "../../plant.mjs";
import { spawnSync } from "node:child_process"; import { pathToFileURL } from "node:url";
const [sha, pre] = process.argv.slice(2);
const d = plant(sha, { copyModules: true, tag: "dbg" });
const { env } = await plantEnv(d, pre ? { NODE_OPTIONS: `--import=${pathToFileURL(pre).href}`, MLAW2_STATE_JOURNAL: d + "/../j.jsonl", MLAW2_STATE_DIR: d + "/dressing-room/state" } : {});
const r = spawnSync(process.execPath, ["scripts/sandbox.mjs", "selftest"], { cwd: d, env, encoding: "utf8" });
console.log((r.stdout + r.stderr).split("\n").filter(l => /FAIL|passed/.test(l)).join("\n"));
