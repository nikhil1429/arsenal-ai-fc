// unit mlaw Q2 — the census of LIVE selftests. For each organ named in organism_test.mjs's LIVE_SELFTESTS (read off the
// tree's own source, never typed), run its suite command (package.json's chain segment, or `selftest`) in TWO trees of
// one sha under os.tmpdir():  Z = the state dir planted EMPTY (zero plant; none of his bytes)  ·  T = the sha's tracked
// state copied in (the contrast: what the full profile reads on a fresh clone). Every door planted: HOME / USERPROFILE /
// APPDATA / TMP under the temp dir, a refusing claude + gemini shim first on PATH, ANTHROPIC_API_KEY and GITHUB_ACTIONS
// removed, every `export const *PORT` env door handed an OS-picked port (listen 0, read, released). The wait per run is
// organism_test.mjs's own run() default, read off its source. Output: one JSON row per organ: exit + pass/fail counts
// only — never a line of the organ's output (a detail line can quote a state file).
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync, readFileSync, readdirSync, chmodSync, existsSync } from "node:fs";
import { join } from "node:path"; import { tmpdir } from "node:os"; import net from "node:net";
const REPO = "/home/user/arsenal-ai-fc", sha = process.argv[2] || "HEAD", only = process.argv.slice(3);
const SD = ["dressing-room", "state"].join("/");
const mk = (withState, keep = null) => {
  const d = mkdtempSync(join(tmpdir(), `mlaw-c${withState ? "T" : "Z"}-`));
  const tar = execFileSync("git", ["-C", REPO, "-c", "core.autocrlf=false", "archive", "--format=tar", sha], { maxBuffer: 1 << 30 });
  execFileSync("tar", ["-x", "-C", d, ...(withState ? [] : [`--exclude=${SD}`])], { input: tar, maxBuffer: 1 << 30 });
  if (keep) { const t2 = execFileSync("git", ["-C", REPO, "archive", "--format=tar", sha, ...keep.map((f) => `${SD}/${f}`)], { maxBuffer: 1 << 30 }); execFileSync("tar", ["-x", "-C", d], { input: t2 }); }
  mkdirSync(join(d, SD), { recursive: true });
  symlinkSync(join(REPO, "node_modules"), join(d, "node_modules"));
  const g = (...a) => execFileSync("git", ["-C", d, "-c", "user.email=s@l", "-c", "user.name=s", ...a], { stdio: "pipe" });
  g("init", "-q"); g("add", "-A"); g("commit", "-qm", "t", "--no-verify");
  return d;
};
const src = readFileSync(join(REPO, "scripts", "organism_test.mjs"), "utf8").split("\n");
const block = (name) => { const a = src.findIndex((l) => l.startsWith(`const ${name} = Object.freeze({`)); const b = src.findIndex((l, i) => i > a && l.startsWith("});"));
  return src.slice(a + 1, b).map((l, i) => ({ line: a + 2 + i, key: (l.match(/^\s+"([^"]+)":/) || l.match(/^\s+([\w-]+):/) || [])[1], why: (l.match(/:\s*"(.*)",\s*$/) || [])[1] })).filter((x) => x.key); };
const WAIT = Number((src.join("\n").match(/timeout: opts\.timeout \|\| (\d+)/) || [])[1]);
const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
const SUITES = JSON.parse((src.join("\n").match(/const SUITE_NAMES = (\[[^\]]+\])/) || [])[1]);
const segs = SUITES.map((n) => pkg.scripts[n] || "").flatMap((v) => String(v).split("&&").map((s) => s.trim())).filter((s) => s.startsWith("node scripts/"));
const cmdOf = (organ) => { const s = segs.find((x) => x.split(/\s+/)[1] === `scripts/${organ}.mjs`); return s ? s.split(/\s+/).slice(1) : [`scripts/${organ}.mjs`, "selftest"]; };
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const doors = [...new Set(readdirSync(join(REPO, "scripts")).filter((f) => f.endsWith(".mjs")).flatMap((f) => [...readFileSync(join(REPO, "scripts", f), "utf8").matchAll(/(?:process\.env\.|plantedPort\(")(ARSENAL_[A-Z_]*PORT)\b/g)].map((m) => m[1])))];
const shimDir = mkdtempSync(join(tmpdir(), "mlaw-shim-"));
for (const b of ["claude", "gemini"]) { writeFileSync(join(shimDir, b), "#!/bin/sh\necho 'REFUSED: no live model call in a census (planted shim)' >&2\nexit 97\n"); chmodSync(join(shimDir, b), 0o755); }
const runOne = (d, organ) => new Promise(async (res) => {
  const home = mkdtempSync(join(tmpdir(), "mlaw-home-"));
  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: join(home, "AppData"), TMPDIR: home, PATH: `${shimDir}:${process.env.PATH}` };
  delete env.ANTHROPIC_API_KEY; delete env.GITHUB_ACTIONS; delete env.ORGANISM_TEST_PROFILE; delete env.ARSENAL_ORGAN;
  for (const k of doors) env[k] = String(await freePort());
  const t0 = Date.now(); const c = spawn(process.execPath, cmdOf(organ), { cwd: d, env, stdio: ["ignore", "pipe", "pipe"] });
  let out = ""; c.stdout.on("data", (b) => { out += b; }); c.stderr.on("data", (b) => { out += b; });
  const kill = setTimeout(() => c.kill("SIGKILL"), WAIT);
  c.on("close", (code, sig) => { clearTimeout(kill);
    const nums = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
    res({ code, sig, s: (Date.now() - t0) / 1000, pass: nums(/(\d+)\s+passed/), fail: nums(/(\d+)\s+failed/), refusedShim: /REFUSED: no live model call/.test(out), eaddr: /EADDRINUSE|ECONNREFUSED/.test(out), win: /powershell|cmd\.exe|schtasks|ENOENT/i.test(out) }); });
});
const tracked = execFileSync("git", ["-C", REPO, "ls-tree", "--name-only", sha, SD + "/"], { encoding: "utf8" }).split("\n").filter(Boolean).map((p) => p.split("/").pop());
const Zfail = new Set(JSON.parse("[" + readFileSync("census_sf.jsonl", "utf8").trim().split("\n").join(",") + "]").filter((r) => r.Z.code !== 0 && r.T.code === 0).map((r) => r.organ));
const organs = block("LIVE_SELFTESTS").filter((x) => Zfail.has(x.key));
// ddmin-lite: the smallest superset of the reason-named files that turns the organ green (one-at-a-time removal)
for (const organ of only) { const o = block("LIVE_SELFTESTS").find((x) => x.key === organ);
  const named = [...o.why.matchAll(/state\/([\w.-]+\.jsonl?)/g)].map((m) => m[1]).filter((f) => tracked.includes(f));
  let set = [...tracked]; const ok = async (s2) => (await runOne(mk(false, s2), organ)).code === 0;
  if (!(await ok(set))) { console.log(JSON.stringify({ organ, minimal: null })); continue; }
  for (const f of tracked.filter((x) => !named.includes(x))) { const t = set.filter((x) => x !== f); if (await ok(t)) set = t; }
  console.log(JSON.stringify({ organ, line: o.line, named, extra: set.filter((x) => !named.includes(x)), minimal: set }));
}
process.exit(0);
const pool = async (items, n, fn) => { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; };
const rows = await pool(organs, 4, async (o) => { const named = [...o.why.matchAll(/state\/([\w.-]+\.jsonl?)/g)].map((m) => m[1]);
  const keep = named.filter((f) => tracked.includes(f)); const R = mk(false, keep.length ? keep : null); const r = await runOne(R, o.key);
  const row = { organ: o.key, line: o.line, named, keep, untracked: named.filter((f) => !tracked.includes(f)), truncated: /…/.test(o.why), R: r };
  console.log(JSON.stringify(row)); return row; });
console.error(`census-R ${sha}: ${rows.length} Z-red/T-green LIVE selftests · R (only the reason-named files) exit 0: ${rows.filter((r) => r.R.code === 0).length} · wait ${WAIT} ms (organism_test.mjs run() default) · doors ${doors.join(",")}`);
