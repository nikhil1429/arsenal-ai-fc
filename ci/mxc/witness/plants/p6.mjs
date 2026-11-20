// unit mxc plant P6 (row 1175 (5), the watchman probeWakeEconomy shape, watchman.mjs:1917-1926): a function's DEFAULT
// writer is an arrow behind a logical-or, `const write = deps.writeCfg || ((f) => { const p = join(…); … renameSync(…, p) })`.
// Twice: under a `probe*` name (the fixture words decide its class) and under a neutral name (live by any vocabulary).
import { writeFileSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const STATE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "dressing-room", "state");
export function probeRefit(deps = {}) {
  const write = deps.writeCfg || ((f) => { const p = join(STATE_DIR, "p6_probe_cfg.json"); writeFileSync(p + ".tmp" + process.pid, String(f)); renameSync(p + ".tmp" + process.pid, p); return f; });
  return write(1);
}
export function refitTune(deps = {}) {
  const write = deps.writeCfg || ((f) => { const p = join(STATE_DIR, "p6_tune_cfg.json"); writeFileSync(p + ".tmp" + process.pid, String(f)); renameSync(p + ".tmp" + process.pid, p); return f; });
  return write(1);
}
