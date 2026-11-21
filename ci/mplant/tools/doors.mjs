// unit mplant · THE node_modules DOOR (question 3, mlaw2 §3 (c)). One member, three planted trees of <sha>, each empty-state,
// no preload, the plant.mjs env (ci/mplant/plant.mjs, a verbatim copy of ci/mlaw2/plant.mjs):
//   LB = LINK BEFORE the plant's commit (plant.mjs default): the link is COMMITTED — mode 120000 in `git ls-files -s`,
//        because .gitignore's `node_modules/` matches a directory and a symlink is not one to git
//   LA = LINK AFTER the plant's commit (the link taken out of the index, `git rm --cached`, recommitted): what
//        organism_test.mjs mhermClauses() does (`git add -A` first, the link second)
//   CP = node_modules COPIED (plant.mjs copyModules)
// Per tree: the member's exit, its last line (plant.mjs lastLine scrub), whether `git ls-files` lists node_modules, and
// the tree's node_modules kind. One JSON row per member on stdout.   node ci/mplant/tools/doors.mjs <sha> <organ> […]
import { spawnSync, execFileSync } from "node:child_process"; import { lstatSync, rmSync } from "node:fs"; import { join } from "node:path";
import { plant, plantEnv, lastLine, memberCmd, memberBound } from "../plant.mjs"; import { mask } from "./mask.mjs";
const [sha, ...organs] = process.argv.slice(2);
const g = (d, ...a) => execFileSync("git", ["-C", d, "-c", "core.autocrlf=false", "-c", "user.email=seat@local", "-c", "user.name=seat", ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const make = (door) => {
  const d = plant(sha, { copyModules: door === "CP", tag: door });
  if (door === "LA") { g(d, "rm", "-q", "--cached", "node_modules"); g(d, "commit", "-qm", "node_modules out of the index", "--no-verify"); }
  return d;
};
let bound = null;
for (const organ of organs) {
  const row = { organ: mask(organ) };
  for (const door of ["LB", "LA", "CP"]) {
    const d = make(door); bound = bound || memberBound(d);
    const { env } = await plantEnv(d, {});
    const r = spawnSync(process.execPath, memberCmd(organ), { cwd: d, env, encoding: "utf8", timeout: bound });
    row[door] = { code: r.status, killed: !!(r.error && r.error.code === "ETIMEDOUT"), last: lastLine((r.stdout || "") + (r.stderr || ""), d),
      tracked: g(d, "ls-files", "node_modules").trim() !== "", kind: lstatSync(join(d, "node_modules")).isSymbolicLink() ? "link" : "dir" };
    try { if (row[door].kind === "link") rmSync(join(d, "node_modules")); } catch { /* the link only, never its target */ }
    rmSync(d, { recursive: true, force: true });
  }
  console.log(JSON.stringify(row));
}
console.error(`mplant doors ${sha}: ${organs.length} member(s) · LB link-before-commit · LA link-after-commit · CP copied · bound read off organism_test.mjs`);
