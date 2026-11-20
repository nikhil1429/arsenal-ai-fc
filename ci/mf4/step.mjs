#!/usr/bin/env node
// ci/mf4/step.mjs — run ONE command in a directory, keep its full output under ci/mf4/out/<name>.txt,
// and append ONE ledger row { ts, act, cmd, cwd, exit, last_line } to ci/mf4/LEDGER.jsonl. The last line is
// read back FROM THE FILE, never from memory. Usage:
//   node ci/mf4/step.mjs <name> <act> <cwd-label> <cwd> -- <cmd...>
// cwd-label is what the ledger shows (BASE / BUILD / a temp tree), never an absolute personal path.
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const [name, act, label, cwd, sep, ...cmd] = process.argv.slice(2);
if (!name || !act || !label || !cwd || sep !== "--" || !cmd.length) { console.log("usage: step.mjs <name> <act> <label> <cwd> -- <cmd...>"); process.exit(2); }
const r = spawnSync(cmd[0], cmd.slice(1), { cwd, encoding: "utf8", shell: process.platform === "win32", maxBuffer: 1 << 28 });
mkdirSync(join(HERE, "out"), { recursive: true });
const outFile = join(HERE, "out", `${name}.txt`);
writeFileSync(outFile, `$ ${cmd.join(" ")}   (in ${label})\n${r.stdout || ""}${r.stderr ? `\n--- stderr ---\n${r.stderr}` : ""}\n--- exit ${r.status} ---\n`);
const lines = String(r.stdout || "").split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim());
const last = lines.length ? lines[lines.length - 1] : "(no stdout)";
appendFileSync(join(HERE, "LEDGER.jsonl"), JSON.stringify({ ts: new Date().toISOString(), act, cmd: `${cmd.join(" ")}  [${label}]`, exit: r.status, last_line: last, out: `out/${name}.txt` }) + "\n");
console.log(`${name} · exit ${r.status} · ${last}`);
const check = readFileSync(outFile, "utf8").includes(last);
if (!check) process.exit(3);
