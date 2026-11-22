// unit mgat · `gates.mjs report` on the EMPTY plant (state dir present, empty) at <sha>; prints exit + the lint line + verdict lines.
import { tree } from "./tree.mjs"; import { spawnSync } from "node:child_process"; import { mkdirSync, rmSync } from "node:fs"; import { join } from "node:path";
const sha = process.argv[2]; const d = tree(sha); mkdirSync(join(d, "dressing-room", "state"), { recursive: true });
const r = spawnSync(process.execPath, ["scripts/gates.mjs", "report"], { cwd: d, encoding: "utf8" }); rmSync(d, { recursive: true, force: true });
const ls = (r.stdout + r.stderr).split("\n").filter((l) => /RED|ROSE|FELL|no-empty|gates/.test(l)).map((l) => l.trim().slice(0, 200));
console.log(ls.join("\n")); console.log(`mgat report ${sha}: exit ${r.status} · ${(ls.find((l) => /no-empty \d+/.test(l)) || "").match(/no-empty \d+[^·]*/)?.[0] || "?"}`);
