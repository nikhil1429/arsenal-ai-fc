// unit mlaw2 · THE SELFTEST CENSUS (forks row 1205 (1) (a)). For each organ in LIVE_SELFTESTS (read off the tree's own
// organism_test.mjs, file:line), run the SUITE's own command for it (memberCmd: `selftest`, test_coach_v2 bare) in:
//   Z = the planted tree (ci/mlaw2/plant.mjs, state dir EMPTY, no fixture) — under the statejournal.mjs preload
//   T = the contrast tree (the sha's tracked state) — exit and counts only, never a line of its output (his bytes)
// Each spawn takes plantEnv(): home doors under a temp dir, refusing model shims, OS-picked ports, the profile hermetic.
// Its wait is the suite's member bound read off organism_test.mjs. One JSON row per organ on stdout.
//   node ci/mlaw2/tools/census_selftests.mjs <sha> [organ …] [--serial]
import { spawn } from "node:child_process"; import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path"; import { tmpdir, cpus } from "node:os"; import { pathToFileURL, fileURLToPath } from "node:url";
import { plant, plantEnv, memberCmd, memberBound, liveTables, INPUTS } from "../plant.mjs";
const args = process.argv.slice(2), serial = args.includes("--serial"), pos = args.filter((a) => !a.startsWith("--"));
const sha = pos[0] || "HEAD", only = pos.slice(1);
const PRE = pathToFileURL(join(fileURLToPath(new URL(".", import.meta.url)), "statejournal.mjs")).href;
const Z0 = plant(sha, { tag: "Z0" });   // read the tables and the bound off ONE plant; every member then gets FRESH trees
const BOUND = memberBound(Z0);
const counts = (out) => {
  const L = out.split(/\r?\n/);
  const ok = L.filter((l) => /^\s*(ok|✓|✔|PASS)\b/.test(l)).length, bad = L.filter((l) => /^\s*(FAIL|✗|✘|not ok)\b/.test(l)).length;
  const p = out.match(/(\d+)\s+passed/), f = out.match(/(\d+)\s+failed/);
  return { ok, bad, lines: L.filter((l) => l.trim()).length, passed: p ? Number(p[1]) : null, failed: f ? Number(f[1]) : null };
};
const runOne = (d, organ, journal) => new Promise(async (res) => {
  const extra = journal ? { NODE_OPTIONS: `--import=${PRE}`, MLAW2_STATE_JOURNAL: journal, MLAW2_STATE_DIR: join(d, INPUTS.state_dir) } : {};
  const { env } = await plantEnv(d, extra);
  const t0 = Date.now(); const c = spawn(process.execPath, memberCmd(organ), { cwd: d, env, stdio: ["ignore", "pipe", "pipe"] });
  let out = ""; c.stdout.on("data", (b) => { out += b; }); c.stderr.on("data", (b) => { out += b; });
  let killed = false; const kill = setTimeout(() => { killed = true; c.kill("SIGKILL"); }, BOUND);
  c.on("close", (code) => { clearTimeout(kill);
    const last = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop() || "";
    res({ code, killed, s: Math.round((Date.now() - t0) / 100) / 10, ...counts(out), out, last, shim: /REFUSED: no live model call/.test(out) }); });
});
const readJ = (p) => existsSync(p) ? readFileSync(p, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
const organs = liveTables(Z0).selftests.filter((x) => !only.length || only.includes(x.key));
const pool = async (items, n, fn) => { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; };
const N = serial ? 1 : Math.max(1, Math.min(4, Math.floor(cpus().length / 2)));
const jdir = mkdtempSync(join(tmpdir(), "mlaw2-j-"));
const rows = await pool(organs, N, async (o) => {
  const jp = join(jdir, `${o.key}.jsonl`);
  // a FRESH Z and T per member: a member that writes under the state dir must never become the next member's fixture
  const z = await runOne(plant(sha), o.key, jp); const t = await runOne(plant(sha, { trackedState: true }), o.key, null);
  const J = readJ(jp), rel = (f) => [...new Set(J.filter(f).map((x) => x.rel.replace(/\d+/g, "#")))].sort();   // digit runs folded: a dated file name is one name
  const row = { organ: o.key, line: o.line, cmd: memberCmd(o.key).join(" "), why: o.why,
    Z: { code: z.code, killed: z.killed, s: z.s, ok: z.ok, bad: z.bad, lines: z.lines, passed: z.passed, failed: z.failed, shim: z.shim, last: z.last.slice(0, 200) },
    T: { code: t.code, killed: t.killed, s: t.s, ok: t.ok, bad: t.bad, lines: t.lines, passed: t.passed, failed: t.failed },
    journal: { absent_reads: rel((x) => x.op.startsWith("r:") && !x.exists && x.rel !== "."), present_reads: rel((x) => x.op.startsWith("r:") && x.exists && x.rel !== "."), writes: rel((x) => x.op.startsWith("w:")) } };
  console.log(JSON.stringify(row)); return row;
});
console.error(`mlaw2 census ${sha}: ${rows.length} LIVE selftests · Z exit 0 ${rows.filter((r) => r.Z.code === 0).length} · T exit 0 ${rows.filter((r) => r.T.code === 0).length} · pool ${N} · bound read off organism_test.mjs`);
