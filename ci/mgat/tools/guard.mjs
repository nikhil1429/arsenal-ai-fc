// unit mgat · the BEHAVIOUR GUARD (not a witness clause: it is GREEN on base by construction). Each touched organ's own
// selftest on the base tree and on the build tree, both on the T plant (the commit's TRACKED state, in a temp tree under
// os.tmpdir(); cortex's selftest reads registry.json, so the E plant only shows it dying the same way twice), hermetic env.
// The build must not change any organ's own verdict. usage: node ci/mgat/tools/guard.mjs <sha>
import { REPO } from "./tree.mjs"; import { applyBuild } from "./build.mjs"; import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, symlinkSync, rmSync } from "node:fs"; import { join } from "node:path"; import { tmpdir } from "node:os";
const sha = execFileSync("git", ["-C", REPO, "rev-parse", "--short=7", process.argv[2] || "HEAD"], { encoding: "utf8" }).trim();
const mk = (build) => { const d = mkdtempSync(join(tmpdir(), `mgat-g-${build ? "build" : "base"}-`));
  execFileSync("tar", ["-x", "-C", d], { input: execFileSync("git", ["-C", REPO, "-c", "core.autocrlf=false", "archive", "--format=tar", sha], { maxBuffer: 1 << 30 }), maxBuffer: 1 << 30 });
  mkdirSync(join(d, "dressing-room", "state"), { recursive: true }); symlinkSync(join(REPO, "node_modules"), join(d, "node_modules")); if (build) applyBuild(d); return d; };
const env = { ...process.env, ORGANISM_TEST_PROFILE: "hermetic" };
const last = (o) => (o.trim().split("\n").filter((l) => /selftest|passed|failed|ok|FAIL/i.test(l)).pop() || "").slice(0, 160);
let same = 0; const organs = ["groundsman", "cortex", "captains_call"];
for (const o of organs) {
  const r = [false, true].map((b) => { const d = mk(b); const x = spawnSync(process.execPath, [`scripts/${o}.mjs`, "selftest"], { cwd: d, encoding: "utf8", env, maxBuffer: 1 << 28 }); rmSync(d, { recursive: true, force: true }); return { code: x.status, last: last((x.stdout || "") + (x.stderr || "")) }; });
  const eq = r[0].code === r[1].code && r[0].last === r[1].last; if (eq) same++;
  console.log(`${o} selftest · base exit ${r[0].code} «${r[0].last}» · build exit ${r[1].code} «${r[1].last}» · ${eq ? "SAME" : "DIFFERS"}`);
}
console.log(`mgat guard ${sha}: ${same} of ${organs.length} organ selftests unchanged by the build`);
