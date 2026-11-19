// unit mxc plant P3 (gap 3): a nested closure's local built from its ENCLOSING function's bound parameter.
import { appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const STATE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "dressing-room", "state");
export function record(path, n) {
  const fail = (why) => { const side = path + ".side.jsonl"; appendFileSync(side, why + "\n"); };
  if (n < 0) fail("negative");
}
record(join(STATE_DIR, "p3.jsonl"), 1);
