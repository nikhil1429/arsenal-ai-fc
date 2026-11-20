// unit mfix — shared plumbing of the mfix measurement tools (the census.mjs recipe of claude/mlaw-spec da6d5e8,
// factored): LF trees of one sha under os.tmpdir(), every door planted, verdict counts only — never a line of output.
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync, readFileSync, readdirSync, chmodSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path"; import { tmpdir } from "node:os"; import net from "node:net";
import { fileURLToPath } from "node:url";
export const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const SD = ["dressing-room", "state"].join("/");
export const HERE = dirname(fileURLToPath(import.meta.url));
const git = (...a) => execFileSync("git", ["-C", REPO, "-c", "core.autocrlf=false", ...a], { maxBuffer: 1 << 30 });
// mode: "Z" empty state dir · "T" the sha's tracked state · {keep:[names]} only those tracked files · {plant:dir} a dir copied in
export function mk(sha, mode) {
  const d = mkdtempSync(join(tmpdir(), `mfix-t-`));
  execFileSync("tar", ["-x", "-C", d, ...(mode === "T" ? [] : [`--exclude=${SD}`])], { input: git("archive", "--format=tar", sha), maxBuffer: 1 << 30 });
  mkdirSync(join(d, SD), { recursive: true });
  if (mode && mode.keep && mode.keep.length) execFileSync("tar", ["-x", "-C", d], { input: git("archive", "--format=tar", sha, ...mode.keep.map((f) => `${SD}/${f}`)), maxBuffer: 1 << 30 });
  symlinkSync(join(REPO, "node_modules"), join(d, "node_modules"));
  const g = (...a) => execFileSync("git", ["-C", d, "-c", "user.email=s@l", "-c", "user.name=s", ...a], { stdio: "pipe" });
  g("init", "-q"); g("add", "-A"); g("commit", "-qm", "t", "--no-verify");
  return d;
}
export const tracked = (sha) => git("ls-tree", "--name-only", sha, SD + "/").toString().split("\n").filter(Boolean).map((p) => p.split("/").pop());
export function suiteSource(sha) { return git("show", `${sha}:scripts/organism_test.mjs`).toString().split("\n"); }
export function block(src, name) {
  const a = src.findIndex((l) => l.startsWith(`const ${name} = Object.freeze({`)); const b = src.findIndex((l, i) => i > a && l.startsWith("});"));
  return src.slice(a + 1, b).map((l, i) => ({ line: a + 2 + i, key: (l.match(/^\s+"([^"]+)":/) || l.match(/^\s+([\w-]+):/) || [])[1], why: (l.match(/:\s*"(.*)",\s*$/) || [])[1] })).filter((x) => x.key);
}
export function cmdOf(sha, src) {
  const pkg = JSON.parse(git("show", `${sha}:package.json`).toString());
  const SUITES = JSON.parse((src.join("\n").match(/const SUITE_NAMES = (\[[^\]]+\])/) || [])[1]);
  const segs = SUITES.map((n) => pkg.scripts[n] || "").flatMap((v) => String(v).split("&&").map((s) => s.trim())).filter((s) => s.startsWith("node scripts/"));
  return (organ) => { const s = segs.find((x) => x.split(/\s+/)[1] === `scripts/${organ}.mjs`); return s ? s.split(/\s+/).slice(1) : [`scripts/${organ}.mjs`, "selftest"]; };
}
export const WAIT = (src) => Number((src.join("\n").match(/const bound = opts\.timeout \|\| (\d+)/) || [])[1]);
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const doors = [...new Set(readdirSync(join(REPO, "scripts")).filter((f) => f.endsWith(".mjs")).flatMap((f) => [...readFileSync(join(REPO, "scripts", f), "utf8").matchAll(/(?:process\.env\.|plantedPort\(")(ARSENAL_[A-Z_]*PORT)\b/g)].map((m) => m[1])))];
const shimDir = mkdtempSync(join(tmpdir(), "mfix-shim-"));
for (const b of ["claude", "gemini"]) { writeFileSync(join(shimDir, b), "#!/bin/sh\necho 'REFUSED: no live model call in a census (planted shim)' >&2\nexit 97\n"); chmodSync(join(shimDir, b), 0o755); }
// run argv in tree d. probe: a jsonl path → the read-set probe preloads and journals there. Returns verdict counts only.
export const runIn = (d, argv, wait, { probe = null, extraEnv = {} } = {}) => new Promise(async (res) => {
  const home = mkdtempSync(join(tmpdir(), "mfix-home-"));
  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: join(home, "AppData"), TMPDIR: home, PATH: `${shimDir}:${process.env.PATH}`, ...extraEnv };
  delete env.ANTHROPIC_API_KEY; delete env.GITHUB_ACTIONS; delete env.ORGANISM_TEST_PROFILE; delete env.ARSENAL_ORGAN;
  for (const k of doors) env[k] = String(await freePort());
  if (probe) { env.NODE_OPTIONS = `--import ${new URL("file://" + join(HERE, "readprobe.mjs")).href}`; env.READPROBE_STATE = join(d, SD); env.READPROBE_OUT = probe; }
  const t0 = Date.now(); const c = spawn(process.execPath, argv, { cwd: d, env, stdio: ["ignore", "pipe", "pipe"] });
  let out = ""; c.stdout.on("data", (b) => { out += b; }); c.stderr.on("data", (b) => { out += b; });
  const kill = setTimeout(() => c.kill("SIGKILL"), wait);
  c.on("close", (code, sig) => { clearTimeout(kill); rmSync(home, { recursive: true, force: true });
    const nums = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
    const asserts = out.split(/\r?\n/).map((l) => /^  (ok  |FAIL) (.*)$/.exec(l)).filter(Boolean).map((m) => ({ v: m[1].trim(), name: m[2] }));
    const enoent = [...new Set([...out.matchAll(/ENOENT[^\n]*?([\w.-]+\.jsonl?)'/g)].map((m) => m[1]))];
    res({ code, sig, s: (Date.now() - t0) / 1000, pass: nums(/(\d+)\s+passed/), fail: nums(/(\d+)\s+failed/), enoent, asserts }); });
});
export const pool = async (items, n, fn) => { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; };
export const rm = (d) => rmSync(d, { recursive: true, force: true });
export const readRows = (p) => existsSync(p) ? readFileSync(p, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
