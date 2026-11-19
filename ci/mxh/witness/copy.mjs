// mxh hermetic copy: `git archive <ref>` of this checkout, unpacked under os.tmpdir(), then
// `npm ci --ignore-scripts` inside it. Prints the copy's path only. Reads/prints no file content.
// usage: node ci/mxh/witness/copy.mjs <repo> [ref=HEAD]
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
const repo = process.argv[2] || process.cwd();
const ref = process.argv[3] || "HEAD";
const dir = mkdtempSync(join(tmpdir(), "mxh-hermetic-"));
execSync(`git -C "${repo}" archive ${ref} | tar -x -C "${dir}"`, { stdio: "inherit", shell: "/bin/bash" });
execSync(`npm ci --ignore-scripts --no-audit --no-fund`, { cwd: dir, stdio: ["ignore", "ignore", "inherit"] });
console.log(dir);
