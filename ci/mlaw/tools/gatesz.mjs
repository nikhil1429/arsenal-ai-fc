import { tree } from "./tree.mjs"; import { spawnSync } from "node:child_process"; import { mkdirSync } from "node:fs"; import { join } from "node:path";
const d = tree(process.argv[2]); mkdirSync(join(d, "dressing-room", "state"), { recursive: true });
const r = spawnSync(process.execPath, ["scripts/gates.mjs", "report"], { cwd: d, encoding: "utf8" });
console.log(r.status, (r.stdout + r.stderr).split("\n").filter((l) => /RED|ROSE|FAIL|gates:/.test(l)).map((l) => l.slice(0, 200)).join("\n"));
