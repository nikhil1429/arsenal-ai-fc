import { tree } from "./tree.mjs"; import { spawnSync, execFileSync } from "node:child_process"; import { mkdirSync, rmSync } from "node:fs"; import { join } from "node:path";
const shas = execFileSync("git", ["-C", "/home/user/arsenal-ai-fc", "rev-list", "--first-parent", "--reverse", "origin/main"], { encoding: "utf8" }).trim().split("\n");
const memo = {}; const ne = (i) => { if (memo[i] !== undefined) return memo[i]; const d = tree(shas[i]); mkdirSync(join(d, "dressing-room", "state"), { recursive: true });
  const out = spawnSync(process.execPath, ["scripts/gates.mjs", "report"], { cwd: d, encoding: "utf8" }).stdout; rmSync(d, { recursive: true, force: true });
  const m = out.match(/no-empty (\d+), baseline (\d+)/) || out.match(/no-empty[^\d]*(\d+)/); const v = m ? +m[1] : null; const b = (out.match(/baseline (\d+)/) || [])[1];
  console.log(JSON.stringify({ i, sha: shas[i].slice(0, 7), no_empty: v, baseline_line: (out.split("\n").find((l) => /no-empty/.test(l)) || "").trim().slice(0, 160) })); return (memo[i] = v); };
// every commit's count (cheap enough to measure all, like Q1)
for (let i = 0; i < shas.length; i++) ne(i);
