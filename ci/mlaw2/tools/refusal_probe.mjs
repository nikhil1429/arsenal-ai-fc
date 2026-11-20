// unit mlaw2 · REFUSAL PROBE — an assert that reads only `exit !== 0` is VACUOUS on the empty plant when the organ exits
// non-zero for a reason other than the law it names (a missing state file, a crash). This runs the GUT-WORD block's four
// commands (organism_test.mjs laws(), read off its source by the census, typed here only as the block's own argv) in a fresh
// planted tree and prints, per command, the exit and whether the refusal names the gut-word law or is a crash (the Z output
// is code's own text: the plant holds none of his bytes; scrubbed).   node ci/mlaw2/tools/refusal_probe.mjs <sha>
import { spawnSync } from "node:child_process"; import { join } from "node:path";
import { plant, plantEnv, lastLine } from "../plant.mjs";
const sha = process.argv[2] || "HEAD", d = plant(sha), { env } = await plantEnv(d); delete env.ORGANISM_TEST_PROFILE;
const CASES = [
  { line: 181, argv: ["capture.mjs", "rep", "--concept", "x", "--axis", "a", "--q", "t", "--correct", "true"] },
  { line: 182, argv: ["capture.mjs", "rep", "--concept", "x", "--axis", "a", "--q", "t", "--gut", "maybe", "--correct", "true"] },
  { line: 183, argv: ["rejirah.mjs", "grade", "embeddings", "a", "held"] },
  { line: 184, argv: ["rejirah.mjs", "grade", "embeddings", "a", "held", "--gut", "maybe"] },
];
for (const c of CASES) {
  const r = spawnSync(process.execPath, [join(d, "scripts", c.argv[0]), ...c.argv.slice(1)], { cwd: d, env, encoding: "utf8" });
  const out = (r.stdout || "") + (r.stderr || "");
  const crash = /^\s*at |^[A-Za-z]*Error: |ENOENT/m.test(out), law = /gut/i.test(out);
  console.log(JSON.stringify({ line: c.line, exit: r.status, names_gut_law: law, crash, last: lastLine(out, d) }));
}
