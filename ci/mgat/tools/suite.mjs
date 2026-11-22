// unit mgat · THE SEAT'S SUITE MEASUREMENT: `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all` on a temp tree
// of <sha> carrying its TRACKED state (what the neutral machine's checkout carries), as is (base) or with build.mjs applied.
// Prints the headline, the reds and the LIVE names; writes nothing outside os.tmpdir(). usage: node ci/mgat/tools/suite.mjs <sha> <base|build>
import { REPO } from "./tree.mjs"; import { applyBuild } from "./build.mjs"; import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, symlinkSync, rmSync } from "node:fs"; import { join } from "node:path"; import { tmpdir } from "node:os";
const [s0, target = "base"] = process.argv.slice(2); const sha = execFileSync("git", ["-C", REPO, "rev-parse", "--short=7", s0], { encoding: "utf8" }).trim();
const d = mkdtempSync(join(tmpdir(), `mgat-s-${target}-`));
execFileSync("tar", ["-x", "-C", d], { input: execFileSync("git", ["-C", REPO, "-c", "core.autocrlf=false", "archive", "--format=tar", sha], { maxBuffer: 1 << 30 }), maxBuffer: 1 << 30 });
symlinkSync(join(REPO, "node_modules"), join(d, "node_modules")); if (target === "build") applyBuild(d);
const g = (...a) => execFileSync("git", ["-C", d, "-c", "core.autocrlf=false", "-c", "user.email=seat@local", "-c", "user.name=seat", ...a], { stdio: "pipe" });
g("init", "-q"); g("add", "-A"); g("commit", "-qm", "plant", "--no-verify");
const env = { ...process.env, ORGANISM_TEST_PROFILE: "hermetic" };
const r = spawnSync(process.execPath, ["scripts/organism_test.mjs", "all"], { cwd: d, encoding: "utf8", env, maxBuffer: 1 << 30 }); rmSync(d, { recursive: true, force: true });
const out = (r.stdout || "") + (r.stderr || ""); const m = out.match(/^ORGANISM_TEST_VERDICT (.*)$/m); const v = m ? JSON.parse(m[1]) : null;
if (v) { console.log(`reds (${v.reds.length}): ${JSON.stringify(v.reds.map((x) => x.slice(0, 110)))}`); console.log(`live (${v.live.length}): ${JSON.stringify(v.live)}`); }
console.log(`mgat suite ${sha} ${target}: exit ${r.status} · ${(out.match(/^organism_test: .*$/m) || ["(no headline)"])[0]}`);
