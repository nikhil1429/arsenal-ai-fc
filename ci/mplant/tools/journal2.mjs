// unit mplant · preload (NODE_OPTIONS=--import) — the mlaw2 statejournal (ci/mplant/tools/statejournal.mjs, a verbatim copy)
// widened to TWO watched dirs: MPLANT_WATCH = JSON [{ "tag": "plant", "dir": "<plant>/dressing-room/state" },
// { "tag": "checkout", "dir": "<the checkout>/dressing-room/state" }]. Every fs touch under either is journaled to
// MPLANT_JOURNAL as { organ, tag, op, rel, exists } — the op, the path RELATIVE to that dir, whether it existed. Never a byte.
// Carried to grandchildren by NODE_OPTIONS. The "checkout" tag is how a witness proves a member spawned from the plant read
// NOTHING of the checkout's state dir.
import fs from "node:fs"; import { syncBuiltinESMExports } from "node:module"; import { resolve, relative, sep } from "node:path";
const LOG = process.env.MPLANT_JOURNAL;
let W = []; try { W = JSON.parse(process.env.MPLANT_WATCH || "[]").map((w) => ({ tag: w.tag, dir: resolve(w.dir) })); } catch { W = []; }
const organ = (process.argv[1] || "").split(/[\\/]/).pop();
const orig = { appendFileSync: fs.appendFileSync, existsSync: fs.existsSync };
const j = (op, p) => {
  if (!LOG || !W.length || typeof p !== "string" && !(p instanceof URL)) return;
  let a; try { a = resolve(String(p instanceof URL ? p.pathname : p)); } catch { return; }
  for (const w of W) {
    if (a !== w.dir && !a.startsWith(w.dir + sep)) continue;
    try { orig.appendFileSync(LOG, JSON.stringify({ organ, tag: w.tag, op, rel: relative(w.dir, a).split(sep).join("/") || ".", exists: orig.existsSync(a) }) + "\n"); } catch { /* never break the member */ }
  }
};
const READS = ["readFileSync", "existsSync", "statSync", "readdirSync", "openSync", "accessSync", "lstatSync", "createReadStream", "watch", "watchFile"];
const WRITES = ["writeFileSync", "appendFileSync", "mkdirSync", "renameSync", "rmSync", "unlinkSync", "copyFileSync", "cpSync", "createWriteStream", "truncateSync"];
for (const n of [...READS, ...WRITES]) { const f = fs[n]; if (typeof f !== "function") continue;
  fs[n] = function (p, ...rest) { j(READS.includes(n) ? `r:${n}` : `w:${n}`, p); if (n === "cpSync" || n === "renameSync" || n === "copyFileSync") j(`w:${n}:dst`, rest[0]); return f.call(this, p, ...rest); }; }
for (const n of ["readFile", "writeFile", "appendFile", "readdir", "stat", "open", "access", "mkdir", "rm", "unlink", "rename", "cp"]) { const f = fs.promises[n]; if (typeof f !== "function") continue;
  fs.promises[n] = function (p, ...rest) { j(/read|stat|open|access/.test(n) ? `r:${n}` : `w:${n}`, p); return f.call(this, p, ...rest); }; }
syncBuiltinESMExports();
