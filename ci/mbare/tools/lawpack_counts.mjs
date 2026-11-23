// unit mbare · THE LAW PACK COUNTS (row 1130 (2)) — `node scripts/lawpack.mjs gate` run on an LF plant of <sha> (no state
// file is read by the pack: it scans source), printing the gate's own `findings:` line and its exit; then `node scripts/gates.mjs
// report` on the same plant, its lint and type lines and its last line (the tsc / ESLint ratchets). Never typed.
//   node ci/mbare/tools/lawpack_counts.mjs <sha> …
import { spawnSync } from "node:child_process"; import { rmSync } from "node:fs";
import { plant, plantEnv, memberBound } from "./plant.mjs";
for (const sha of process.argv.slice(2)) {
  const d = plant(sha, { tag: "LP" }); const { env, home } = await plantEnv(d);
  const r = spawnSync(process.execPath, ["scripts/lawpack.mjs", "gate"], { cwd: d, env, encoding: "utf8", timeout: memberBound(d) });
  const out = (r.stdout || "") + (r.stderr || "");
  const line = out.split(/\r?\n/).find((x) => /^lawpack · .* · findings: /.test(x)) || "(no findings line)";
  console.log(`${sha} · exit ${r.status} · ${line}`);
  const g = spawnSync(process.execPath, ["scripts/gates.mjs", "report"], { cwd: d, env, encoding: "utf8", timeout: memberBound(d) });
  const gl = ((g.stdout || "") + (g.stderr || "")).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  console.log(`${sha} · gates report exit ${g.status} · ${gl.filter((x) => /^gates (lint|types?)\b|TYPE COUNT|LINT ROSE|checkJs/.test(x)).join(" | ")} | ${gl[gl.length - 1]}`);
  rmSync(d, { recursive: true, force: true }); rmSync(home, { recursive: true, force: true });
}
