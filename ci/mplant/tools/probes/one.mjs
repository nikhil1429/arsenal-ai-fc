// unit mplant probe · `node ci/mplant/tools/probes/one.mjs <sha> <sandbox verb>`: sandbox.mjs <verb> on ONE empty plant (node_modules copied, no preload); prints the plant path and the output tail, the plant path masked.
import { plant, plantEnv } from "../../plant.mjs";
import { spawnSync } from "node:child_process";
const d = plant(process.argv[2], { copyModules: true, tag: "dbg" });
const { env } = await plantEnv(d, {});
const r = spawnSync(process.execPath, ["scripts/sandbox.mjs", ...process.argv.slice(3)], { cwd: d, env, encoding: "utf8" });
console.log(d); console.log((r.stdout + r.stderr).split(d).join("<plant>").slice(-2500));
