// unit mxc plant P5 (gap 3, shadow): a nested local of the SAME NAME as a module const must not read the module path.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const STATE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "dressing-room", "state");
const OUTER = join(STATE_DIR, "p5_outer.json");
export function g() {
  const inner = () => { const OUTER = String(Date.now()); return readFileSync(OUTER, "utf8"); };
  return inner;
}
