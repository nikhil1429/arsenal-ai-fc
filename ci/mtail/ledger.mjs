#!/usr/bin/env node
// ci/mtail/ledger.mjs — appends ONE JSON row per step to ci/mtail/LEDGER.jsonl: { ts, act, cmd, last_line }.
// USAGE: node ci/mtail/ledger.mjs --act <what> --cmd "<command>" (--last "<line>" | --from <output file>)
// With --from, last_line is the last non-empty line of that file (read from the file, never retyped).
import { appendFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const act = arg("--act"), cmd = arg("--cmd");
let last = arg("--last");
if (arg("--from")) last = readFileSync(arg("--from"), "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) || "";
if (!act || !cmd || last == null) { console.error("usage: ledger.mjs --act <a> --cmd <c> (--last <l> | --from <file>)"); process.exit(2); }
const row = { ts: new Date().toISOString(), act, cmd, last_line: last };
appendFileSync(join(dirname(fileURLToPath(import.meta.url)), "LEDGER.jsonl"), JSON.stringify(row) + "\n");
console.log(JSON.stringify(row));
