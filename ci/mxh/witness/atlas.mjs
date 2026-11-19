// in a hermetic copy: xray build → flow_atlas build → flow_atlas check; print the atlas sha (no content)
import { spawnSync } from "node:child_process"; import { readFileSync } from "node:fs"; import { createHash } from "node:crypto"; import { join } from "node:path";
const d = process.argv[2]; const run = (a) => spawnSync(process.execPath, a, { cwd: d, encoding: "utf8" });
run(["scripts/xray.mjs", "build"]); run(["scripts/flow_atlas.mjs", "build"]);
const c = run(["scripts/flow_atlas.mjs", "check"]);
const sha = (p) => createHash("sha256").update(readFileSync(join(d, ...p))).digest("hex").slice(0, 16);
console.log(JSON.stringify({ check_exit: c.status, check_last: String(c.stdout).trim().split("\n").pop(), atlas: sha(["dressing-room", "state", "flow_atlas.json"]) }));
