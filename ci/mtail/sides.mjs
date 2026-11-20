#!/usr/bin/env node
// ci/mtail/sides.mjs — builds ONE side tree for the gates and the witness: `git archive <ref>` into <dir> (LF bytes as
// committed), then `git init` + ONE commit inside it, so the gates that read `git ls-files` (lawpack, organism_test laws)
// measure that tree. Never a worktree of the organism repo (the worktree rail). node_modules is linked (a junction on win32).
// USAGE: node ci/mtail/sides.mjs --ref <commit> --dir <dir under os.tmpdir()>
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ref = arg("--ref"), dir = arg("--dir") && resolve(arg("--dir"));
if (!ref || !dir) { console.error("usage: sides.mjs --ref <commit> --dir <dir>"); process.exit(2); }
if (!dir.startsWith(resolve(tmpdir()))) { console.error(`sides.mjs: REFUSED — ${dir} is not under ${tmpdir()}`); process.exit(2); }
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const tar = join(tmpdir(), `mtail-side-${process.pid}.tar`);
execFileSync("git", ["-C", ROOT, "archive", "--format=tar", "-o", tar, ref]);
execFileSync("tar", ["-xf", tar, "-C", dir]); rmSync(tar, { force: true });
const g = (...a) => execFileSync("git", ["-C", dir, ...a], { stdio: "pipe" });
g("init", "-q"); g("add", "-A");
g("-c", "user.name=mtail-side", "-c", "user.email=side@invalid", "-c", "commit.gpgsign=false", "commit", "-q", "--no-verify", "-m", `side ${ref}`);
const nm = join(ROOT, "node_modules");
if (existsSync(nm)) symlinkSync(nm, join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
console.log(`sides: ${ref} → ${dir}`);
