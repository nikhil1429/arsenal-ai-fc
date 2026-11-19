import { tree } from "./tree.mjs"; import { spawnSync } from "node:child_process"; import { rmSync } from "node:fs";
for (const sha of process.argv.slice(2)) {
  const d = tree(sha); const t0 = Date.now();
  const env = { ...process.env }; delete env.ANTHROPIC_API_KEY; delete env.GITHUB_ACTIONS;
  const r = spawnSync(process.execPath, ["scripts/lawpack.mjs", "gate"], { cwd: d, env, encoding: "utf8", maxBuffer: 1 << 28 });
  const out = (r.stdout || "") + (r.stderr || "");
  const j = (out.match(/jugad-literal-subject-list (\d+)/) || [])[1];
  const dc = (out.match(/depcruise_errors (\d+)/) || [])[1];
  const last = out.trim().split("\n").pop();
  console.log(JSON.stringify({ sha: sha.slice(0,7), jugad: +j, depcruise: dc ? +dc : null, exit: r.status, s: (Date.now()-t0)/1000, last }));
  if (process.env.KEEP !== "1") rmSync(d, { recursive: true, force: true });
}
