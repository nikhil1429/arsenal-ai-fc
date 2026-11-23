#!/usr/bin/env node
// ci/mrehearse/run_mutants_mrehearse.mjs --org <build dir> --base-org <base dir>
// One mutant per witness clause (W1-W6, and BOUND under the named --base-org: row 1307 (1) (c)). Each is a COPY of --org's tracked files under os.tmpdir() (git ls-files; of the state
// dir only the tracked registry.json the plants read) with ONE edit; the witness of THAT copy, run with
// `plants --only <clause>`, must read RED on the clause that names it. The control (the copy, unedited) runs the WHOLE
// witness and must read GREEN. The edit site is matched in the file's OWN line ending and must be unique, or the mutant is
// NOT APPLIED and counts as surviving. A mutant marked `own` edits the witness and is judged by the edited copy.
// Nothing under --org is written. No port, no network, no model.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, mkdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = resolve(arg("--base-org") || ".");
const W = "ci/witness/mrehearse/witness_rehearse.mjs";
// the tracked tree of --org (so BOUND sees the same file set), minus the state dir but for the tracked registry.json the plants read
const FILES = String(spawnSync("git", ["-C", ORG, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 1 << 26 }).stdout || "").split("\0").filter(Boolean)
  .filter((f) => !f.startsWith("dressing-room/state/") || f === "dressing-room/state/registry.json")
  .filter((f) => { try { return statSync(join(ORG, f)).isFile(); } catch { return false; } });
const MUTANTS = [
  { clause: "W1", file: "scripts/rehearse.mjs", from: 'git(["rev-parse", "HEAD"], { encoding: "utf8" })', to: 'git(["rev-parse", "HEAD~"], { encoding: "utf8" })', what: "spec (d): the snapshot runs the OLD tree (HEAD~) and stamps it" },
  { clause: "W2", file: W, own: true, from: "if (!(at >= lo && at <= hi)) return", to: "if (false) return", what: "the night's window not read" },
  { clause: "W3", file: W, own: true, from: "if (rr.code_sha !== mark.head) return", to: "if (false) return", what: "code_sha not compared with the night's head" },
  { clause: "W4", file: "scripts/rehearse.mjs", from: "export const CARRIED = Object.freeze([9, 10, 11]);", to: "export const CARRIED = Object.freeze([]);", what: "F4 A dropped: 9-11 read off the snapshot's machine" },
  { clause: "W5", file: "scripts/rehearse.mjs", from: "if (!n || !n.begun || n.closed) return", to: "if (!n || n.closed) return", what: "a night no runner began is rehearsed" },
  { clause: "BOUND", file: W, own: true, from: 'export const UNIT_FILES = Object.freeze(["scripts/rehearse.mjs", "scripts/night.mjs", "ci/witness/mrehearse/", "ci/mrehearse/"]);', to: 'export const UNIT_FILES = Object.freeze(["scripts/rehearse.mjs", "ci/witness/mrehearse/", "ci/mrehearse/"]);', what: "BOUND under a named base: night.mjs (a file that differs) no longer counted as the unit's" },
  { clause: "W6", file: "scripts/rehearse.mjs", from: 'clauses.push({ n, status: s || "UNREAD" });', to: 'clauses.push({ n, status: s || "UNREAD", why: "reason" });', what: "the reason text reaches the log" },
];

function copyOrg(tmp, name) {
  const d = join(tmp, name);
  for (const f of FILES) { mkdirSync(dirname(join(d, f)), { recursive: true }); cpSync(join(ORG, f), join(d, f)); }
  return d;
}
const runW = (d, only) => {
  const r = spawnSync(process.execPath, [join(d, W), "plants", "--org", d, "--base-org", BASE, ...(only ? ["--only", only] : [])], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
  return { code: r.status, last: String(r.stdout || "").trim().split(/\r?\n/).pop() || "" };
};

const tmp = mkdtempSync(join(tmpdir(), "mrehearse-mut-"));
let k = 0, control = "RED";
try {
  MUTANTS.forEach((m, i) => {
    const d = copyOrg(tmp, `m${i}`);
    const p = join(d, m.file);
    const src = readFileSync(p, "utf8");
    const eol = src.includes("\r\n") ? "\r\n" : "\n";
    const from = m.from.replace(/\n/g, eol), to = m.to.replace(/\n/g, eol);
    const hits = src.split(from).length - 1;
    if (hits !== 1) { console.log(`  NOT APPLIED ${m.clause} · ${m.what} (site matched ${hits}×)`); return; }
    writeFileSync(p, src.replace(from, to));
    const r = runW(d, m.clause);
    const red = r.code === 1 && new RegExp(`^RED MREHEARSE · .*\\b${m.clause}\\b`).test(r.last);
    if (red) k++;
    console.log(`  ${red ? "RED (killed)" : "SURVIVED   "} ${m.clause} · ${m.what} · ${r.last}`);
    rmSync(d, { recursive: true, force: true });
  });
  const c = runW(copyOrg(tmp, "control"), null);
  control = c.code === 0 && /^GREEN MREHEARSE/.test(c.last) ? "GREEN" : "RED";
  console.log(`  control · ${c.last}`);
} finally { rmSync(tmp, { recursive: true, force: true }); }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control}`);
process.exitCode = k === MUTANTS.length && control === "GREEN" ? 0 : 1;
