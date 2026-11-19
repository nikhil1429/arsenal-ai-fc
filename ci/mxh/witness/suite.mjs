// clone this repo at a ref under os.tmpdir(), optionally apply a patch, npm ci, run the hermetic suite; print the tail.
import { mkdtempSync, writeFileSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path"; import { execSync, spawnSync } from "node:child_process";
const [repo, ref, patch, tag] = process.argv.slice(2);
const d = mkdtempSync(join(tmpdir(), `mxh-suite-${tag}-`));
execSync(`git clone -q --no-local "${repo}" "${d}" && git -C "${d}" checkout -q ${ref}`, { shell: "/bin/bash" });
if (patch && patch !== "-") execSync(`git -C "${d}" apply "${patch}"`);
execSync(`npm ci --ignore-scripts --no-audit --no-fund`, { cwd: d, stdio: "ignore" });
const r = spawnSync(process.execPath, ["scripts/organism_test.mjs", "all"], { cwd: d, encoding: "utf8", env: { ...process.env, ORGANISM_TEST_PROFILE: "hermetic", ANTHROPIC_API_KEY: "" }, maxBuffer: 1 << 28 });
writeFileSync(join(tmpdir(), `mxh-suite-${tag}.out`), String(r.stdout) + "\n--stderr--\n" + String(r.stderr));
console.log(d, "exit", r.status);
