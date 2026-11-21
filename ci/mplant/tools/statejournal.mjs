// unit mlaw2 · preload (NODE_OPTIONS=--import) — journal every fs touch under the PLANTED tree's state dir: the op, the
// path RELATIVE to that dir, and whether it existed. Never a byte of any file. Carried to grandchildren by NODE_OPTIONS.
// The journal is how the census measures VACUITY: a member green on the empty plant that tried to read state files that
// were absent may be green because it found nothing to judge.
import fs from "node:fs"; import { syncBuiltinESMExports } from "node:module"; import { resolve, relative, sep } from "node:path";
const LOG = process.env.MLAW2_STATE_JOURNAL, ROOTD = process.env.MLAW2_STATE_DIR ? resolve(process.env.MLAW2_STATE_DIR) : null;
const organ = (process.argv[1] || "").split(/[\\/]/).pop();
const orig = { appendFileSync: fs.appendFileSync, existsSync: fs.existsSync };
const j = (op, p) => {
  if (!LOG || !ROOTD || typeof p !== "string" && !(p instanceof URL)) return;
  let a; try { a = resolve(String(p instanceof URL ? p.pathname : p)); } catch { return; }
  if (a !== ROOTD && !a.startsWith(ROOTD + sep)) return;
  try { orig.appendFileSync(LOG, JSON.stringify({ organ, op, rel: relative(ROOTD, a).split(sep).join("/") || ".", exists: orig.existsSync(a) }) + "\n"); } catch { /* never break the member */ }
};
const READS = ["readFileSync", "existsSync", "statSync", "readdirSync", "openSync", "accessSync", "lstatSync"];
const WRITES = ["writeFileSync", "appendFileSync", "mkdirSync", "renameSync", "rmSync", "unlinkSync", "copyFileSync"];
for (const n of [...READS, ...WRITES]) { const f = fs[n]; if (typeof f !== "function") continue;
  fs[n] = function (p, ...rest) { j(READS.includes(n) ? `r:${n}` : `w:${n}`, p); return f.call(this, p, ...rest); }; }
for (const n of ["readFile", "writeFile", "appendFile", "readdir", "stat"]) { const f = fs.promises[n]; if (typeof f !== "function") continue;
  fs.promises[n] = function (p, ...rest) { j(/read|stat/.test(n) ? `r:${n}` : `w:${n}`, p); return f.call(this, p, ...rest); }; }
syncBuiltinESMExports();
