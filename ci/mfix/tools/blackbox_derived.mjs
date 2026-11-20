// unit mfix — blackbox on an EMPTY plant with node_modules COPIED (not linked: mlaw2 cf1785c found its cpSync refuses a
// linked dir) and xray_graph.json derived by its owner (`xray.mjs build`), against the same without the derivation.
//   node ci/mfix/tools/blackbox_derived.mjs <sha>
import { mk, suiteSource, cmdOf, WAIT, runIn, rm, REPO } from "./lib.mjs";
import { rmSync, cpSync } from "node:fs"; import { join } from "node:path"; import { execFileSync } from "node:child_process";
const sha = process.argv[2] || "HEAD"; const src = suiteSource(sha), cmd = cmdOf(sha, src), wait = WAIT(src);
for (const derive of [false, true]) {
  const d = mk(sha, "Z"); rmSync(join(d, "node_modules")); cpSync(join(REPO, "node_modules"), join(d, "node_modules"), { recursive: true });
  // the temp tree's own index tracked the link (mk() links before `git add -A`): untrack it, as a checkout never tracks it
  execFileSync("git", ["-C", d, "rm", "-q", "--cached", "node_modules"]); execFileSync("git", ["-C", d, "-c", "user.email=s@l", "-c", "user.name=s", "commit", "-qm", "untrack node_modules", "--no-verify"]);
  const pre = derive ? (await runIn(d, ["scripts/xray.mjs", "build"], wait)).code : null;
  const r = await runIn(d, cmd("blackbox"), wait); rm(d);
  console.log(JSON.stringify({ organ: "blackbox", plant: derive ? "xray_graph.json owner-derived" : "empty", node_modules: "copied", pre_exit: pre, exit: r.code, failed: r.asserts.filter((a) => a.v === "FAIL").length }));
}
