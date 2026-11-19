#!/usr/bin/env node
// unit mxb · the witness's tree planter (spec seat; builds nothing in the repo).
// Plants ONE temp tree under os.tmpdir(): scripts/ copied, every other top-level entry of the repo a SYMLINK (read
// only — xray lists names, it never reads a state file's content), and scripts/xray.mjs replaced by --xray when given.
// No port, no service, no spawn, no wait. Prints the tree's path on its last line.
//   node ci/mxb/witness/plant_tree.mjs --repo <dir> [--xray <file>] [--tag <word>]
// --plant-p10: instead, a MINI tree (scripts/xray.mjs + one planted organ) for clause W10, the fixture boundary.
import { mkdtempSync, cpSync, readdirSync, symlinkSync, copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const repo = resolve(arg("--repo") || ".");
const xray = arg("--xray");
const tag = (arg("--tag") || "tree").replace(/[^a-z0-9-]/gi, "");
const t = mkdtempSync(join(tmpdir(), `mxb-${tag}-`));

if (process.argv.includes("--plant-p10")) {
  // P10 — a selftest builds an object value pointing at a TEST dir and hands it to a production reader. The reader
  // records its sink under its OWN ctx, so without the fixture-site rule the test dir lands as a live lane.
  mkdirSync(join(t, "scripts"), { recursive: true });
  symlinkSync(join(repo, "node_modules"), join(t, "node_modules"));   // xray's parser (acorn), read only
  writeFileSync(join(t, "package.json"), JSON.stringify({ name: "mxb-p10", private: true, scripts: {} }) + "\n");   // rootSets reads it unguarded
  copyFileSync(xray || join(repo, "scripts", "xray.mjs"), join(t, "scripts", "xray.mjs"));
  writeFileSync(join(t, "scripts", "p10.mjs"), [
    'import { readFileSync } from "node:fs";',
    'import { join, dirname } from "node:path";',
    'import { fileURLToPath } from "node:url";',
    'const HERE = dirname(fileURLToPath(import.meta.url));',
    'const STATE_DIR = join(HERE, "..", "dressing-room", "state");',
    'export function facts({ stateDir = STATE_DIR } = {}) { return readFileSync(join(stateDir, "p10_live.json"), "utf8"); }',
    'function selftest() { const bare = join(HERE, "p10_testdir"); return facts({ stateDir: bare }); }',
    'if (process.argv[2] === "selftest") selftest();',
    "",
  ].join("\n"));
} else {
  for (const e of readdirSync(repo)) {
    if (e === ".git") continue;
    if (e === "scripts") cpSync(join(repo, e), join(t, e), { recursive: true });
    else symlinkSync(join(repo, e), join(t, e));
  }
  if (xray) copyFileSync(xray, join(t, "scripts", "xray.mjs"));
}
console.log(t);
