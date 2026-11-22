// unit mgat · the ledger hand: run ONE command, print its output, append {ts, act, cmd, last_line} to ci/mgat/LEDGER.jsonl.
// usage: node ci/mgat/tools/led.mjs <act> -- <cmd> [args...]   (no shell; argv passed as is)
import { spawnSync } from "node:child_process"; import { appendFileSync } from "node:fs"; import { join } from "node:path"; import { REPO } from "./tree.mjs";
const i = process.argv.indexOf("--"); const act = process.argv[2]; const cmd = process.argv.slice(i + 1);
const env = { ...process.env, ...Object.fromEntries((process.env.MGAT_ENV || "").split(" ").filter(Boolean).map((kv) => kv.split("="))) };
const r = spawnSync(cmd[0], cmd.slice(1), { cwd: REPO, encoding: "utf8", env, maxBuffer: 1 << 28 });
const out = (r.stdout || "") + (r.stderr || ""); process.stdout.write(out);
const last = out.trim().split("\n").filter(Boolean).pop() || `(no output, exit ${r.status})`;
appendFileSync(join(REPO, "ci", "mgat", "LEDGER.jsonl"), JSON.stringify({ ts: new Date().toISOString(), act, cmd: (process.env.MGAT_ENV ? process.env.MGAT_ENV + " " : "") + cmd.join(" "), exit: r.status, last_line: last.slice(0, 400) }) + "\n");
process.exitCode = r.status ?? 1;
