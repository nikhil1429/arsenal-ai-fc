// unit mlaw2 · THE ASSERT + MODE CENSUS (forks row 1205 (1) (a)). Runs organism_test.mjs in the FULL profile (that is the
// only profile that judges a LIVE member), one mode per spawn, in Z = the planted tree (state EMPTY, no fixture) and in
// T = the contrast tree (the sha's tracked state). Each LIVE_ASSERTS key (read off the tree's own source, file:line) is
// matched against the printed assert names exactly as liveAssert() matches them (digits folded to #, prefix or 90-char cut).
// Mode `path` is NEVER run: mirror.mjs reaches his gist over the network (the port class forbids a live service).
// Z rows keep the assert's printed name (the plant holds none of his bytes); T rows keep the FOLDED name and the verdict
// only. Each mode spawn waits the suite's member bound, read off organism_test.mjs.
//   node ci/mlaw2/tools/census_asserts.mjs <sha> [mode …]
import { spawn } from "node:child_process"; import { join } from "node:path";
import { plant, plantEnv, memberBound, liveTables } from "../plant.mjs";
const pos = process.argv.slice(2), sha = pos[0] || "HEAD";
const Z0 = plant(sha, { tag: "Z0" }); const BOUND = memberBound(Z0); const tables = liveTables(Z0);
const ASSERT_MODES = ["integrity", "laws", "hermetic"];
const LIVE_MODES = tables.modes.map((m) => m.key).filter((m) => m !== "path");
const MODES = pos.slice(1).length ? pos.slice(1) : [...ASSERT_MODES, ...LIVE_MODES];
const fold = (n) => String(n).replace(/\d+/g, "#");
const keyOf = (keys, n) => { const f = fold(n); return keys.find((x) => f.startsWith(x) || f.slice(0, 90) === x); };
const runMode = (d, mode) => new Promise(async (res) => {
  const { env } = await plantEnv(d); delete env.ORGANISM_TEST_PROFILE;   // FULL profile: the one that judges a LIVE member
  const t0 = Date.now(); const c = spawn(process.execPath, ["scripts/organism_test.mjs", mode], { cwd: d, env, stdio: ["ignore", "pipe", "pipe"] });
  let out = ""; c.stdout.on("data", (b) => { out += b; }); c.stderr.on("data", (b) => { out += b; });
  let killed = false; const kill = setTimeout(() => { killed = true; c.kill("SIGKILL"); }, BOUND);
  c.on("close", (code) => { clearTimeout(kill);
    const asserts = out.split(/\r?\n/).map((l) => /^  (ok  |FAIL) (.*)$/.exec(l)).filter(Boolean).map((m) => ({ v: m[1].trim(), name: m[2] }));
    const last = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop() || "";
    res({ code, killed, s: Math.round((Date.now() - t0) / 100) / 10, asserts, last }); });
});
const res = { Z: {}, T: {} };
for (const m of MODES) {
  const [z, t] = await Promise.all([runMode(plant(sha), m), runMode(plant(sha, { trackedState: true }), m)]);
  res.Z[m] = z; res.T[m] = t;
  console.log(JSON.stringify({ kind: "mode", mode: m, Z: { code: z.code, killed: z.killed, s: z.s, n: z.asserts.length, fail: z.asserts.filter((a) => a.v === "FAIL").length, last: z.last.slice(0, 200) },
    T: { code: t.code, killed: t.killed, s: t.s, n: t.asserts.length, fail: t.asserts.filter((a) => a.v === "FAIL").length } }));
  if (LIVE_MODES.includes(m)) for (const side of ["Z", "T"]) console.log(JSON.stringify({ kind: "mode-asserts", mode: m, side,
    rows: res[side][m].asserts.map((a) => `${a.v} ${side === "Z" ? a.name.slice(0, 160) : fold(a.name).slice(0, 90)}`) }));
}
for (const k of tables.asserts) {
  const find = (side) => { for (const m of MODES.filter((x) => ASSERT_MODES.includes(x))) { const hit = (res[side][m] || { asserts: [] }).asserts.filter((a) => keyOf([k.key], a.name));
    if (hit.length) return { mode: m, n: hit.length, v: hit.every((a) => a.v === "ok") ? "ok" : "FAIL", ...(side === "Z" ? { names: hit.map((a) => a.name.slice(0, 200)) } : {}) }; } return null; };
  console.log(JSON.stringify({ kind: "assert", line: k.line, key: k.key, why: k.why, Z: find("Z"), T: find("T") }));
}
console.error(`mlaw2 assert census ${sha}: modes ${MODES.join(",")} · ${tables.asserts.length} LIVE asserts · bound read off organism_test.mjs`);
