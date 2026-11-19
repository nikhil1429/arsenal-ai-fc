#!/usr/bin/env node
// ci/mact/lftree.mjs — UNIT mact · an LF tree of one commit, for the witness's --org / --base-org.
// USAGE: node ci/mact/lftree.mjs <sha> <dir>   (dir: created under os.tmpdir() by the caller, or named by it)
// CONTRACT: git archive with core.autocrlf=false + core.eol=lf (row 1036: bytes as stored, CRLF-proof on Windows): the COMMIT's
//   tracked files only (a gitignored file of his is never in a commit, so never in the tree; nothing is printed), extracted by node's
//   own tar reader below (no POSIX-only shell). No git repo is planted inside the tree. Prints ONE line: `lftree <sha> → <dir> · <n> file(s)`.
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
const [sha, dirArg] = process.argv.slice(2);
if (!sha || !dirArg) { console.log("lftree: usage <sha> <dir>"); process.exit(2); }
const dir = resolve(dirArg);
const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "archive", "--format=tar", sha, "--", "."], { maxBuffer: 1 << 30 });
if (r.status !== 0) { console.log(`lftree: git archive failed · ${String(r.stderr).trim().split(/\r?\n/)[0]}`); process.exit(1); }
const buf = r.stdout; let off = 0, n = 0, longName = null;
const str = (b) => b.toString("utf8").replace(/\0.*$/s, "");
while (off + 512 <= buf.length) {
  const h = buf.subarray(off, off + 512);
  if (h.every((x) => x === 0)) break;
  const size = parseInt(str(h.subarray(124, 136)).trim() || "0", 8), type = String.fromCharCode(h[156] || 48);
  const prefix = str(h.subarray(345, 500)), base = str(h.subarray(0, 100)), mode = parseInt(str(h.subarray(100, 108)).trim() || "644", 8);
  const body = buf.subarray(off + 512, off + 512 + size);
  off += 512 + Math.ceil(size / 512) * 512;
  if (type === "x" || type === "g") { const m = /\d+ path=([^\n]*)\n/.exec(body.toString("utf8")); if (type === "x" && m) longName = m[1]; continue; }
  if (type === "L") { longName = str(body); continue; }
  const name = longName || (prefix ? `${prefix}/${base}` : base); longName = null;
  const p = join(dir, name);
  if (type === "5") { mkdirSync(p, { recursive: true }); continue; }
  if (type !== "0" && type !== "\0") continue;   // a symlink in the tree is skipped (none is needed by acts / claims)
  mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, body); if (mode & 0o111) chmodSync(p, 0o755); n++;
}
console.log(`lftree ${sha} → ${dir} · ${n} file(s)`);
