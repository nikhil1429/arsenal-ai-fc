#!/usr/bin/env node
// ============================================================================
// ci/mxb/plant_mxb.mjs — UNIT mxb · the ONE planter of the witness, the mutant runner and the base tree
// ----------------------------------------------------------------------------
// CONTRACT — a plant is a COPY of a tree under a temp root the caller made (mkdtemp under os.tmpdir()):
//   copied     every top-level entry of the source EXCEPT .git, node_modules, ci/ (this unit's and every other unit's
//              witness dirs: equal on both sides, judged by nothing here) and dressing-room/state (never copied, never
//              read: the plant gets an EMPTY dressing-room/state — code public, data private)
//   linked     node_modules rides as ONE link (a junction on Windows, no privilege needed) to the first source that
//              holds node_modules/acorn (xray's parser), read only
//   eol        "crlf" rewrites every scripts/**/*.mjs to CRLF (the Windows checkout's shape); "lf" leaves the bytes
// No port, no service, no daemon, no model, no git repo planted, no wait. Pure node:fs (Windows and POSIX alike).
//
// CLI (the base tree for a run of the witness; the architect's own base checkout serves the same):
//   node ci/mxb/plant_mxb.mjs base --repo <dir> --sha <sha>
//     plants <repo> under a fresh os.tmpdir() root, then writes `git show <sha>:<path>` over every path that
//     `git diff --name-only <sha>` names outside ci/ and dressing-room/state (a path absent at <sha> is removed), so the
//     plant IS <sha>'s tree for every file the witness compares. Prints the plant's path as its LAST line.
// ============================================================================
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, symlinkSync, statSync, rmSync, mkdtempSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const slash = (p) => p.split(sep).join("/");
export const SKIP_TOP = new Set([".git", "node_modules", "ci"]);
export const isState = (rel) => rel === "dressing-room/state" || rel.startsWith("dressing-room/state/");
export const nodeModulesOf = (...dirs) => dirs.filter(Boolean).map((d) => join(d, "node_modules")).find((d) => existsSync(join(d, "acorn")));

export function plant(src, dst, { eol = "lf", nm } = {}) {
  mkdirSync(dst, { recursive: true });
  for (const e of readdirSync(src)) {
    if (SKIP_TOP.has(e)) continue;
    cpSync(join(src, e), join(dst, e), { recursive: true, filter: (p) => !isState(slash(relative(src, p))) });
  }
  mkdirSync(join(dst, "dressing-room", "state"), { recursive: true });
  const NM = nm || nodeModulesOf(src);
  if (NM) symlinkSync(NM, join(dst, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  if (eol === "crlf") toCrlf(join(dst, "scripts"));
  return dst;
}

export function toCrlf(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e), st = statSync(p);
    if (st.isDirectory()) toCrlf(p);
    else if (e.endsWith(".mjs")) writeFileSync(p, readFileSync(p, "utf8").replace(/\r?\n/g, "\r\n"));
  }
}

function baseCli() {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const repo = arg("--repo") ? resolve(arg("--repo")) : null, sha = arg("--sha");
  if (!repo || !sha) { console.log("plant_mxb: USAGE base --repo <dir> --sha <sha>"); process.exit(1); }
  const git = (...a) => spawnSync("git", ["-C", repo, ...a], { encoding: "buffer" });
  const names = String(git("diff", "--name-only", "--no-renames", sha).stdout || "").split(/\r?\n/).filter(Boolean)
    .filter((p) => !SKIP_TOP.has(p.split("/")[0]) && !isState(p));
  const dst = plant(repo, join(mkdtempSync(join(tmpdir(), "mxb-baseorg-")), "org"));
  for (const p of names) {
    const r = git("show", `${sha}:${p}`);
    if (r.status === 0) { mkdirSync(dirname(join(dst, p)), { recursive: true }); writeFileSync(join(dst, p), r.stdout); }
    else rmSync(join(dst, p), { force: true });
  }
  console.log(`plant_mxb: base ${sha} · ${names.length} path(s) re-written from ${sha}${names.length ? ` (${names.slice(0, 6).join(", ")})` : ""}`);
  console.log(dst);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href && process.argv[2] === "base") baseCli();
else if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) { console.log("plant_mxb: USAGE base --repo <dir> --sha <sha>"); process.exit(1); }
