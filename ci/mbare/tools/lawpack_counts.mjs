// unit mbare · THE LAW PACK COUNTS (row 1130 (2)) — `node scripts/lawpack.mjs gate` run on an LF plant of <sha> (no state
// file is read by the pack: it scans source), printing the gate's own `findings:` line and its exit. Never typed.
//   node ci/mbare/tools/lawpack_counts.mjs <sha> …
import { spawnSync } from "node:child_process"; import { rmSync } from "node:fs";
import { plant, plantEnv, memberBound } from "./plant.mjs";
for (const sha of process.argv.slice(2)) {
  const d = plant(sha, { tag: "LP" }); const { env, home } = await plantEnv(d);
  const r = spawnSync(process.execPath, ["scripts/lawpack.mjs", "gate"], { cwd: d, env, encoding: "utf8", timeout: memberBound(d) });
  const out = (r.stdout || "") + (r.stderr || "");
  const line = out.split(/\r?\n/).find((x) => /^lawpack · .* · findings: /.test(x)) || "(no findings line)";
  console.log(`${sha} · exit ${r.status} · ${line}`);
  rmSync(d, { recursive: true, force: true }); rmSync(home, { recursive: true, force: true });
}
