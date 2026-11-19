// mxw witness (planted both ways): a temp tree under os.tmpdir() holding ONE xray.mjs (base or build) and ONE fixture organ.
// Nothing here touches the repo; the tree is removed before the verdict prints.
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { join } from "node:path"; import { tmpdir } from "node:os"; import { pathToFileURL } from "node:url";
const [xraySrc, nodeModules] = process.argv.slice(2);
const T = mkdtempSync(join(tmpdir(), "mxw-witness-"));
mkdirSync(join(T, "scripts")); copyFileSync(xraySrc, join(T, "scripts", "xray.mjs")); symlinkSync(nodeModules, join(T, "node_modules"));
writeFileSync(join(T, "package.json"), JSON.stringify({ name: "mxw-witness", type: "module", scripts: {} }));
const SD = ["dressing-room", "state"].join("/");
writeFileSync(join(T, "scripts", "fixture_bag.mjs"), `
import { appendFileSync } from "node:fs"; import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE = join(__dirname, "..", "dressing-room", "state");
export const LEDGER = join(STATE, "w1_bag.jsonl");
function appendChecked(path, row) { appendFileSync(path, JSON.stringify(row) + "\\n"); }
export function add(p = {}, { path = LEDGER, now = 0 } = {}) { return appendChecked(path, p); }           // W1: notes_corrections.mjs:106 shape
export function record(t, { dir = STATE } = {}) { appendFileSync(join(dir, "w2_dir.jsonl"), t); }          // W2: learnstate.mjs:794 shape
export function noDefault(t, { path } = {}) { appendFileSync(path, t); }                                    // W3: no default => nothing invented
export function plain(t, path = join(STATE, "w4_plain.jsonl")) { appendFileSync(path, t); }                // W4: the shape seedDefaults already reads
`);
const x = await import(pathToFileURL(join(T, "scripts", "xray.mjs")).href);
const ir = x.build();
const mine = ir.files.filter((f) => f.writers.includes("fixture_bag.mjs")).map((f) => f.path);
const w = (n) => mine.includes(`${SD}/${n}`);
const out = { W1: w("w1_bag.jsonl"), W2: w("w2_dir.jsonl"), W3_nothing_invented: mine.every((p) => /\/w[124]_[a-z]+\.jsonl$/.test(p)), W4: w("w4_plain.jsonl") };
rmSync(T, { recursive: true, force: true });
console.log(JSON.stringify(out));
