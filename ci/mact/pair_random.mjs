// ci/mact/pair_random.mjs — UNIT mact · a preload (node --import): MACT_PAIR="j,k" makes the k-th Math.random call of this process
// return EXACTLY the value the j-th returned (ONE forced collision of the random bucket). Every other call i returns the middle of
// bucket i of the mints' 1296 (call i → bucket i mod 1296), so no draw collides by chance: the sweep is exact, never a draw.
// MACT_COUNT_FILE, when set, receives the number of Math.random calls this process made (written at exit, synchronously).
import { writeFileSync } from "node:fs";
const [j, k] = String(process.env.MACT_PAIR || "").split(",").map((x) => (x === "" ? NaN : Number(x)));
let n = 0;
const at = (i) => ((i % 1296) + 0.5) / 1296;
Math.random = () => { const i = n++; return i === k && Number.isFinite(j) ? at(j) : at(i); };
if (process.env.MACT_COUNT_FILE) process.on("exit", () => { try { writeFileSync(process.env.MACT_COUNT_FILE, String(n)); } catch { /* the count is a measurement; a miss reads as absent */ } });
