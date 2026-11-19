// unit mxc plant P2 (gap 2): a MODULE-scope const-arrow selftest whose read folds in pass 1.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const STATE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "dressing-room", "state");
const selftest = () => { try { return readFileSync(join(STATE_DIR, "p2_fixture.json"), "utf8"); } catch { return null; } };
if (process.argv[2] === "selftest") selftest();
