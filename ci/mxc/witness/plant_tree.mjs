#!/usr/bin/env node
// plant_tree.mjs — unit mxc: a temp tree under os.tmpdir() that COPIES scripts/ and SYMLINKS every other top-level
// entry of the repo (read only); --xray <file> replaces the tree's scripts/xray.mjs. --mini <dir> instead plants a MINI
// tree: scripts/xray.mjs + every scripts/*.mjs of <dir>, a stub package.json (rootSets reads it), node_modules linked.
// Nothing under the repo is written. Prints the tree's path as its LAST line.
import { mkdtempSync, cpSync, symlinkSync, readdirSync, copyFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const repo = resolve(arg("--repo") || ".");
const T = mkdtempSync(join(tmpdir(), `mxc-${arg("--tag") || "t"}-`));
if (arg("--mini")) {
  mkdirSync(join(T, "scripts"));
  copyFileSync(join(repo, "scripts", "xray.mjs"), join(T, "scripts", "xray.mjs"));
  for (const f of readdirSync(arg("--mini"))) if (f.endsWith(".mjs")) copyFileSync(join(arg("--mini"), f), join(T, "scripts", f));
  writeFileSync(join(T, "package.json"), JSON.stringify({ name: "mxc-mini", private: true, scripts: {} }));
  symlinkSync(join(repo, "node_modules"), join(T, "node_modules"), "junction");
} else {
  for (const e of readdirSync(repo)) {
    if (e === ".git") continue;
    if (e === "scripts") cpSync(join(repo, e), join(T, e), { recursive: true });
    else symlinkSync(join(repo, e), join(T, e), "junction");
  }
}
if (arg("--xray")) copyFileSync(resolve(arg("--xray")), join(T, "scripts", "xray.mjs"));
console.log(T);
