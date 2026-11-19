#!/usr/bin/env node
// ci/mrv/measure_mlv1.mjs — UNIT mrv (forks row 1119 (4) F-d) · A MEASUREMENT INSTRUMENT, NOT A WITNESS, NOT A BUILD.
// Runs the landed ci/mlv1 witness N times at --head against its own ci/mlv1/BASE, each run on FRESH LF trees made here
// (git -c core.autocrlf=false -c core.eol=lf checkout into os.tmpdir(), the suite's own lfTree shape at
// scripts/organism_test.mjs:2811), the claude/gemini shims on PATH (no live model call), every organ port door planted
// with an OS-picked port (never a fixed one, row 1053), and records each clause's GREEN/RED and its why line.
// It never touches dressing-room/state of any tree but its own temp copies, and removes every temp tree it made.
//   node ci/mrv/measure_mlv1.mjs --root <repo> --head <sha> --n <runs> --out <jsonl outside the repo> [--node <exe>] [--witness <path>]
// LAST LINE: MRV MEASURE · node <v> · <n> run(s) · I1 <r>/<n> · I2 <r>/<n> · I3 <r>/<n> · XML <r>/<n> · BOUND <r>/<n> · LAST <r>/<n> red
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, appendFileSync, rmSync, existsSync, readdirSync, cpSync, symlinkSync } from "node:fs";
import { join, resolve, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createServer } from "node:net";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ROOT = resolve(arg("--root") || "."), HEAD = arg("--head") || "HEAD", N = Number(arg("--n") || 1), OUT = arg("--out"), NODE = arg("--node") || process.execPath;
const WIT = arg("--witness");
if (!OUT) { console.log("MRV MEASURE · REFUSED · --out <jsonl> is required"); process.exit(2); }
const git = (...a) => spawnSync("git", ["-C", ROOT, ...a], { encoding: "utf8" });
const head = git("rev-parse", "--verify", "-q", `${HEAD}^{commit}`).stdout.trim();
const base = readFileSync(join(ROOT, "ci", "mlv1", "BASE"), "utf8").trim();
const lfTree = (sha, into) => { mkdirSync(into, { recursive: true }); const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", ROOT, `--work-tree=${into}`, "checkout", "-q", sha, "--", "."], { encoding: "utf8", env: { ...process.env, GIT_INDEX_FILE: `${into}.index` } }); return r.status === 0 ? null : r.stderr; };
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const doors = (tree) => { const o = []; for (const f of readdirSync(join(tree, "scripts")).filter((x) => x.endsWith(".mjs"))) for (const l of readFileSync(join(tree, "scripts", f), "utf8").split(/\r?\n/)) { const m = /^export const ([A-Z_]*PORT) = (.*)$/.exec(l); const d = m && (/process\.env\.([A-Z0-9_]+)/.exec(m[2]) || [])[1]; if (d) o.push(d); } return [...new Set(o)]; };
const ver = spawnSync(NODE, ["-v"], { encoding: "utf8" }).stdout.trim();
const tally = {};
for (let k = 0; k < N; k++) {
  const tmp = mkdtempSync(join(tmpdir(), "mrv-mlv1-"));
  try {
    const org = join(tmp, "org"), bas = join(tmp, "base"), shim = join(tmp, "shim"), wd = join(tmp, "w");
    const e = lfTree(head, org) || lfTree(base, bas); if (e) throw new Error(`tree: ${e}`);
    const nm = join(ROOT, "node_modules"); if (existsSync(nm)) for (const t of [org, bas]) symlinkSync(nm, join(t, "node_modules"), "dir");
    mkdirSync(shim); for (const t of ["claude", "gemini"]) writeFileSync(join(shim, t), `#!/bin/sh\necho "REFUSED — no live model call (unit mrv)" >&2\nexit 1\n`, { mode: 0o755 });
    const env = { ...process.env, PATH: `${shim}${delimiter}${process.env.PATH}` };
    delete env.ANTHROPIC_API_KEY;
    for (const d of doors(org)) env[d] = String(await freePort());
    cpSync(WIT ? resolve(WIT, "..") : join(ROOT, "ci", "mlv1"), join(wd, "ci", "mlv1"), { recursive: true });
    const wfile = WIT ? join(wd, "ci", "mlv1", WIT.split(/[\\/]/).pop()) : join(wd, "ci", "mlv1", "witness_mlv1.mjs");
    const t0 = Date.now();
    const r = spawnSync(NODE, [wfile, "--org", org, "--base-org", bas], { cwd: wd, env, encoding: "utf8" });
    const out = String(r.stdout || "") + String(r.stderr || "");
    const lines = out.split(/\r?\n/);
    const cl = {};
    for (const l of lines) { const m = /^\s+(GREEN|RED)\s+(\S+)(?: \S+)? · .*?(?: · (.*))?$/.exec(l); if (m) cl[m[2]] = { ok: m[1] === "GREEN", why: (l.split(" · ").slice(2).join(" · ") || "").slice(0, 300) }; }
    const meta = { slack: Number((/slack (\d+) ms/.exec(out) || [])[1]), boot: Number((/first keeper up in (\d+) ms/.exec(out) || [])[1]), bound: Number((/bounded by (\d+) ms/.exec(out) || [])[1]) };
    const row = { ts: new Date().toISOString(), node: ver, run: k + 1, head: head.slice(0, 7), base: base.slice(0, 7), exit: r.status, secs: (Date.now() - t0) / 1000, ...meta, clauses: cl, last: lines.filter(Boolean).pop() };
    appendFileSync(OUT, JSON.stringify(row) + "\n");
    for (const [id, c] of Object.entries(cl)) { tally[id] = tally[id] || [0, 0]; tally[id][1]++; if (!c.ok) tally[id][0]++; }
    console.log(`run ${k + 1}/${N} · ${row.last}`);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}
console.log(`MRV MEASURE · node ${ver} · ${N} run(s) · ${Object.entries(tally).map(([id, [r, t]]) => `${id} ${r}/${t}`).join(" · ")} red`);
