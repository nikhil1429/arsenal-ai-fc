// witness variants for the mrv measurement (scratch only). Plant chosen at run time by env MRV_PLANT:
//   p1 — I2's re-started keeper boots one measured BOOT slower (a busy wait in its first process only, NODE_OPTIONS --import)
//   p2 — the killed worker's port outlives the kill by one measured BOOT (taskkill /T /F's teardown lag, modelled)
//   p3 — the clause before I3 leaves no keeper up (a red I2's state, modelled)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
const [root, out] = process.argv.slice(2);
const src = readFileSync(join(root, "ci/mlv1/witness_mlv1.mjs"), "utf8");
const KILL = "  await killTree(keeper);\n  const id = \"s-mlv1-planted\";";
const START2 = "  keeper = startKeeper();\n  const s1 = await waitFor(async () => { const s = await portUp(); return s && s.open ? s : null; }, BOUND);";
const I3 = "  const s1 = await portUp(); if (!s1) { await killTree(judge); return { ok: false, why: \"no daemon up\" }; }";
const J = "  const judge = spawn(process.execPath";
for (const a of [KILL, START2, I3, J]) if (!src.includes(a)) throw new Error(`anchor missing: ${a.slice(0, 50)}`);
const freeHere = `const freeHere = () => new Promise((res) => { const s = createServer(); s.once("error", () => res(false)); s.listen(PORT, "127.0.0.1", () => s.close(() => res(true))); });`;
const p1 = `  if (process.env.MRV_PLANT === "p1") { ENV.MRV_P1 = join(TMP, "p1-once"); ENV.MRV_P1_MS = String(BOUNDS.boot); ENV.NODE_OPTIONS = \`--import=data:text/javascript,\${encodeURIComponent('import {existsSync,writeFileSync} from "node:fs"; const f = process.env.MRV_P1; if (f && !existsSync(f)) { writeFileSync(f, ""); const e = Date.now() + Number(process.env.MRV_P1_MS); while (Date.now() < e); }')}\`; }   // MRV PLANT p1`;
const p2 = `  if (process.env.MRV_PLANT === "p2") { const h = createServer(); await new Promise((r) => h.listen(PORT, "127.0.0.1", r)); setTimeout(() => h.close(), BOUNDS.boot); }   // MRV PLANT p2`;
const p3 = `  if (process.env.MRV_PLANT === "p3") await killTree(keeper);   // MRV PLANT p3\n`;
const r2 = `  { ${freeHere} if (!(await waitFor(freeHere, BOUND))) return { ok: false, why: \`:\${PORT} still held \${BOUND} ms after the kill\` }; }   // MRV REPAIR I2 (b): the port binds before the next keeper starts`;
// r1: the re-start is a BOOT, waited like the first one: it ends on an EVENT (up and open · the keeper's own "keeper waiting" line · its exit), never on one sample's clock
const r1 = `  keeper = startKeeper();
  let s1 = null;
  for (;;) { const s = await portUp(); if (s && s.open) { s1 = s; break; } if (keeper.exitCode != null || out.some((l) => /keeper waiting/.test(l))) break; await sleep(SLACK); }   // MRV REPAIR I2 (a)`;
const r3 = `  let s1 = await portUp();
  if (!s1 || s1.open) { await killTree(keeper); { const sf = join(SDIR, "sitting.json"); if (existsSync(sf)) { const d = JSON.parse(readFileSync(sf, "utf8")); if (!d.closed_at) writeFileSync(sf, JSON.stringify({ ...d, closed_at: new Date().toISOString(), close_reason: "planted-by-I3" })); } } { ${freeHere} await waitFor(freeHere, BOUND); } keeper = startKeeper(); s1 = null; for (;;) { const s = await portUp(); if (s && !s.open) { s1 = s; break; } if (keeper.exitCode != null || out.some((l) => /keeper waiting/.test(l))) break; await sleep(SLACK); } }   // MRV REPAIR I3: its own idle keeper
  if (!s1) { await killTree(judge); return { ok: false, why: "no daemon up" }; }`;
const build = ({ a = false, b = false, c = false }) => src
  .replace(KILL, `  await killTree(keeper);\n${p2}\n${b ? r2 + "\n" : ""}  const id = "s-mlv1-planted";`)
  .replace(START2, `${p1}\n${a ? r1 : START2}\n  if (ENV.NODE_OPTIONS && process.env.MRV_PLANT === "p1") delete ENV.NODE_OPTIONS;`)
  .replace(J, p3 + J)
  .replace(I3, c ? r3 : I3);
const v = { base: build({}), repaired: build({ a: true, b: true, c: true }), "mutant-i2a": build({ b: true, c: true }), "mutant-i2b": build({ a: true, c: true }), "mutant-i3": build({ a: true, b: true }) };
for (const [k, s] of Object.entries(v)) { mkdirSync(join(out, k), { recursive: true }); writeFileSync(join(out, k, "witness_mlv1.mjs"), s); copyFileSync(join(root, "ci/mlv1/BASE"), join(out, k, "BASE")); }
console.log("variants", Object.keys(v).join(" "));
