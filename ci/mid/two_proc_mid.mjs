#!/usr/bin/env node
// ci/mid/two_proc_mid.mjs — unit mid (forks row 1148 (2)) · Q3's measurement: does a process-local sequence close the
// TWO-PROCESS case? Spawns two node children against a tree; each mints ONE act and ONE claim through the organ's own
// mint, on ONE planted clock with Math.random pinned (the 1-in-1296 draw made certain). Every ledger is a temp file
// (the acts exec and append are stubbed; the claim ledger is under os.tmpdir()). No port, no owner, no model call.
// Then the same two children compute the PROPOSED shared mint (process identity beside the sequence) on the same clock,
// as a model of the shape — the build, not this file, puts it in the organs.
// Usage: node ci/mid/two_proc_mid.mjs [--org <tree root>]   Last line: `TWO_PROC · acts <same|differ> · claims <..> · proposed <..>`.
import { mkdtempSync, existsSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const argOf = (f) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(argOf("--org") || join(import.meta.dirname, "..", ".."));
const T = mkdtempSync(join(tmpdir(), "mid-2proc-"));
const REG_SRC = join(ORG, "dressing-room", "state", "registry.json");
if (existsSync(REG_SRC)) copyFileSync(REG_SRC, join(T, "registry.json"));
const env = { ...process.env, ARSENAL_REGISTRY: join(T, "registry.json"), ARSENAL_OUTBOX_LEDGER: join(T, "o.jsonl"), ARSENAL_TASKS_LEDGER: join(T, "t.jsonl") };
delete env.ANTHROPIC_API_KEY;
const child = `
const NOW = new Date("2026-11-19T06:00:00.000Z");
Math.random = () => 0;
const A = await import(${JSON.stringify(pathToFileURL(join(ORG, "scripts", "acts.mjs")).href)});
const C = await import(${JSON.stringify(pathToFileURL(join(ORG, "scripts", "claims.mjs")).href)});
const a = A.dispatch({ door: "cli", verb: "note", args: { text: "one", kind: "thread" } }, { now: NOW, append: () => true, exec: () => ({ ok: true, out: "{}" }) });
const k = C.fileClaim({ claim: "x", cmd: "true", now: NOW, ledger: process.argv[1], runner: () => ({ status: 0, stdout: "" }) });
// the PROPOSED shape (a model): <prefix><ms36><pid36><seq36><bucket2>, the pid36 fixed-width so the parts read back
let seq = 0; const pid36 = process.pid.toString(36).padStart(4, "0");
const proposed = "a" + NOW.getTime().toString(36) + pid36 + (seq++).toString(36) + Math.floor(Math.random() * 1296).toString(36).padStart(2, "0");
console.log(JSON.stringify({ act: a.id, claim: k.row.id, proposed, pid: process.pid }));
`;
const run = (n) => { const r = spawnSync(process.execPath, ["--input-type=module", "-e", child, join(T, `k${n}.jsonl`)], { encoding: "utf8", env, cwd: T, timeout: 60000 }); const line = String(r.stdout || "").trim().split("\n").at(-1); try { return JSON.parse(line); } catch { return { error: String(r.stderr || r.stdout).slice(0, 300) }; } };
const p1 = run(1), p2 = run(2);
console.log(`child 1 · ${JSON.stringify(p1)}`);
console.log(`child 2 · ${JSON.stringify(p2)}`);
const v = (k) => (p1[k] && p2[k] ? (p1[k] === p2[k] ? "SAME" : "differ") : "ERROR");
console.log(`TWO_PROC · acts ${v("act")} · claims ${v("claim")} · proposed ${v("proposed")} · tree ${ORG}`);
