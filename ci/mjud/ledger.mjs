// ci/mjud/ledger.mjs — append ONE row to ci/mjud/LEDGER.jsonl: node ci/mjud/ledger.mjs <act> <cmd> <out-file | --line "text">
import { appendFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const [act, cmd, src, text] = process.argv.slice(2);
const last_line = src === "--line" ? text : readFileSync(src, "utf8").split(/\r?\n/).filter((l) => l.trim()).at(-1);
appendFileSync(join(dirname(fileURLToPath(import.meta.url)), "LEDGER.jsonl"), JSON.stringify({ ts: new Date().toISOString(), act, cmd, last_line }) + "\n");
console.log(last_line);
