// unit mplant · THE NON-LIVE CENSUS (question 4). Every member the hermetic profile spawns today (ci/mplant/tools/sets.mjs:
// not in LIVE_SELFTESTS), run by the suite's own command (plant.mjs memberCmd) on up to three FRESH trees of <sha> each:
//   ZL = the empty plant, node_modules LINKED (plant.mjs default), NO preload
//   ZC = the empty plant, node_modules COPIED (plant.mjs copyModules), NO preload        ← THE VERDICT of question 4
//   ZJ = ZC under journal2.mjs (plant AND checkout state dirs journaled): the READS, never the verdict — an ESM preload that
//        imports node:fs ahead of the sandbox collar disarms the collar's write guard (ci/mplant/MPLANT_SPEC.md §3 F-A), so a
//        member that asserts its collar reds under ANY journal; its ZJ exit is recorded and never classed
//   T  = the same sha WITH its tracked state, node_modules copied, NO preload — exit only, never a line (his bytes)
// One JSON row per organ on stdout (organ names through mask.mjs). The wait is the suite's member bound read off the tree.
//   node ci/mplant/tools/census_nonlive.mjs <sha> [organ …] [--trees ZL,ZC,T] [--pool N]
import { spawn } from "node:child_process"; import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path"; import { tmpdir, cpus } from "node:os"; import { pathToFileURL, fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { plant, plantEnv, lastLine, memberCmd, memberBound, REPO, INPUTS } from "../plant.mjs";
import { mask } from "./mask.mjs";
const args = process.argv.slice(2), pos = args.filter((a, i) => !a.startsWith("--") && !/^--(trees|pool)$/.test(args[i - 1] || ""));
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const sha = pos[0] || "HEAD", only = pos.slice(1);
const TREES = opt("--trees", "ZL,ZC,ZJ,T").split(",");
const PRE = pathToFileURL(join(fileURLToPath(new URL(".", import.meta.url)), "journal2.mjs")).href;
const CHECKOUT_STATE = resolve(join(REPO, INPUTS.state_dir));
const sets = JSON.parse(execFileSync(process.execPath, [join(fileURLToPath(new URL(".", import.meta.url)), "sets.mjs"), REPO, "--json", "--raw"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const organs = sets.hermeticSpawned.filter((o) => !only.length || only.includes(o));
const Z0 = plant(sha, { tag: "Z0" }); const BOUND = memberBound(Z0); rmSync(Z0, { recursive: true, force: true });
const runOne = (d, organ, journal) => new Promise(async (res) => {
  const extra = journal ? { NODE_OPTIONS: `--import=${PRE}`, MPLANT_JOURNAL: journal, MPLANT_WATCH: JSON.stringify([{ tag: "plant", dir: join(d, INPUTS.state_dir) }, { tag: "checkout", dir: CHECKOUT_STATE }]) } : {};
  const { env } = await plantEnv(d, extra);
  const t0 = Date.now(); const c = spawn(process.execPath, memberCmd(organ), { cwd: d, env, stdio: ["ignore", "pipe", "pipe"] });
  let out = ""; c.stdout.on("data", (b) => { out += b; }); c.stderr.on("data", (b) => { out += b; });
  let killed = false; const kill = setTimeout(() => { killed = true; c.kill("SIGKILL"); }, BOUND);
  c.on("close", (code) => { clearTimeout(kill);
    const fails = out.split(/\r?\n/).filter((l) => /^\s*(FAIL|✗|not ok)\b/.test(l)).map((l) => lastLine(l, d).replace(/^FAIL\s+/, "")).slice(0, 4);
    res({ code, killed, s: Math.round((Date.now() - t0) / 100) / 10, last: lastLine(out, d), fails }); });
});
const readJ = (p) => existsSync(p) ? readFileSync(p, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
const pool = async (items, n, fn) => { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; };
const N = Number(opt("--pool", String(Math.max(1, Math.min(4, Math.floor(cpus().length / 2))))));
const jdir = mkdtempSync(join(tmpdir(), "mplant-j-"));
const fold = (J, tag, f) => [...new Set(J.filter((x) => x.tag === tag && f(x)).map((x) => x.rel.replace(/\d+/g, "#")))].sort();
const rows = await pool(organs, N, async (o) => {
  const row = { organ: mask(o), cmd: memberCmd(o).map(mask).join(" ") };
  for (const t of TREES) {
    const d = plant(sha, { trackedState: t === "T", copyModules: t !== "ZL", tag: t });
    const jp = t === "ZJ" ? join(jdir, `${o}.${t}.jsonl`) : null;
    const r = await runOne(d, o, jp);
    const J = jp ? readJ(jp) : [];
    row[t] = t === "T" ? { code: r.code, killed: r.killed, s: r.s } : t !== "ZJ" ? r : { code: r.code, killed: r.killed, s: r.s,
      plant: { absent_reads: fold(J, "plant", (x) => x.op.startsWith("r:") && !x.exists && x.rel !== "."), writes: fold(J, "plant", (x) => x.op.startsWith("w:")) },
      checkout: { touches: J.filter((x) => x.tag === "checkout").length, ops: fold(J, "checkout", () => true) } };
    rmSync(d, { recursive: true, force: true });
  }
  console.log(JSON.stringify(row)); return row;
});
const g = (t) => rows.filter((r) => r[t] && r[t].code === 0).length;
const ct = rows.filter((r) => TREES.some((t) => r[t] && r[t].checkout && r[t].checkout.touches > 0)).length;
console.error(`mplant non-LIVE census ${sha}: ${rows.length} members · ${TREES.map((t) => `${t} exit 0 ${g(t)}`).join(" · ")} · members touching the CHECKOUT's state dir from the plant ${ct} · pool ${N} · bound read off organism_test.mjs`);
