// unit mlaw2 · THE THROW SITES — a full-profile mode that throws on the empty plant leaves every LIVE assert after the throw
// unreached. This re-runs each named mode on a fresh planted tree and prints the organism_test.mjs line of the throw (the
// first stack frame in the suite file) and the error line (code's own text; scrubbed). A LIVE assert whose skipLive block
// holds that line needs a fixture by its own read; one whose block comes after it is BLOCKED.
//   node ci/mlaw2/tools/throws.mjs <sha> <mode> …
import { spawnSync } from "node:child_process";
import { plant, plantEnv, memberBound, lastLine } from "../plant.mjs";
const [sha, ...modes] = process.argv.slice(2);
for (const m of modes) { const d = plant(sha), { env } = await plantEnv(d); delete env.ORGANISM_TEST_PROFILE;
  const r = spawnSync(process.execPath, ["scripts/organism_test.mjs", m], { cwd: d, env, encoding: "utf8", timeout: memberBound(d) });
  const out = (r.stdout || "") + (r.stderr || ""); const at = out.match(/organism_test\.mjs:(\d+):\d+/);
  console.log(JSON.stringify({ mode: m, exit: r.status, throw_line: at ? Number(at[1]) : null, error: lastLine(out.split(/\r?\n/).filter((l) => /Error/.test(l)).slice(0, 1).join("\n") || "", d) })); }
