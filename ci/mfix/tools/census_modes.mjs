// unit mfix (copied from claude/mlaw-spec da6d5e8 ci/mlaw/tools, re-run at the mfix base) — the LIVE asserts and LIVE modes. Runs organism_test.mjs in the FULL profile, one mode per spawn, in the
// two trees of census.mjs (Z = state planted EMPTY · T = the sha's tracked state), every door planted the same way.
// Mode `path` is NOT run: mirror.mjs fetches his gist (organism_test.mjs:210, mirror.mjs:157) — a live service.
// Each LIVE_ASSERTS key is matched against the printed assert names exactly as liveAssert() matches (fold digits to #,
// prefix or the 90-char cut). Prints one JSON row per key and per mode: verdicts only, never a detail line.
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync, readFileSync, readdirSync, chmodSync } from "node:fs";
import { join } from "node:path"; import { tmpdir } from "node:os"; import net from "node:net";
const REPO = "/home/user/arsenal-ai-fc", sha = process.argv[2] || "HEAD";
const SD = ["dressing-room", "state"].join("/");
const mk = (withState) => {
  const d = mkdtempSync(join(tmpdir(), `mfix-m${withState ? "T" : "Z"}-`));
  const tar = execFileSync("git", ["-C", REPO, "-c", "core.autocrlf=false", "archive", "--format=tar", sha], { maxBuffer: 1 << 30 });
  execFileSync("tar", ["-x", "-C", d, ...(withState ? [] : [`--exclude=${SD}`])], { input: tar, maxBuffer: 1 << 30 });
  mkdirSync(join(d, SD), { recursive: true });
  symlinkSync(join(REPO, "node_modules"), join(d, "node_modules"));
  const g = (...a) => execFileSync("git", ["-C", d, "-c", "user.email=s@l", "-c", "user.name=s", ...a], { stdio: "pipe" });
  g("init", "-q"); g("add", "-A"); g("commit", "-qm", "t", "--no-verify");
  return d;
};
const src = readFileSync(join(REPO, "scripts", "organism_test.mjs"), "utf8").split("\n");
const block = (name) => { const a = src.findIndex((l) => l.startsWith(`const ${name} = Object.freeze({`)); const b = src.findIndex((l, i) => i > a && l.startsWith("});"));
  return src.slice(a + 1, b).map((l, i) => ({ line: a + 2 + i, key: (l.match(/^\s+"([^"]+)":/) || l.match(/^\s+([\w-]+):/) || [])[1], why: (l.match(/:\s*"(.*)",\s*$/) || [])[1] })).filter((x) => x.key); };
const MODES = (src.join("\n").match(/const MODES = \{([^}]+)\}/) || [])[1].split(",").map((s) => s.trim()).filter((m) => m && m !== "path");
const fold = (n) => String(n).replace(/\d+/g, "#");
const keyOf = (keys, n) => { const f = fold(n); return keys.find((x) => f.startsWith(x) || f.slice(0, 90) === x); };
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const doors = [...new Set(readdirSync(join(REPO, "scripts")).filter((f) => f.endsWith(".mjs")).flatMap((f) => [...readFileSync(join(REPO, "scripts", f), "utf8").matchAll(/(?:process\.env\.|plantedPort\(")(ARSENAL_[A-Z_]*PORT)\b/g)].map((m) => m[1])))];
const shimDir = mkdtempSync(join(tmpdir(), "mfix-shim-"));
for (const b of ["claude", "gemini"]) { writeFileSync(join(shimDir, b), "#!/bin/sh\necho 'REFUSED: no live model call in a census (planted shim)' >&2\nexit 97\n"); chmodSync(join(shimDir, b), 0o755); }
const runMode = (d, mode) => new Promise(async (res) => {
  const home = mkdtempSync(join(tmpdir(), "mfix-home-"));
  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: join(home, "AppData"), TMPDIR: home, PATH: `${shimDir}:${process.env.PATH}` };
  delete env.ANTHROPIC_API_KEY; delete env.GITHUB_ACTIONS; delete env.ORGANISM_TEST_PROFILE; delete env.ARSENAL_ORGAN;
  for (const k of doors) env[k] = String(await freePort());
  const t0 = Date.now(); const c = spawn(process.execPath, ["scripts/organism_test.mjs", mode], { cwd: d, env, stdio: ["ignore", "pipe", "pipe"] });
  let out = ""; c.stdout.on("data", (b) => { out += b; }); c.stderr.on("data", (b) => { out += b; });
  c.on("close", (code) => { const asserts = out.split(/\r?\n/).map((l) => /^  (ok  |FAIL) (.*)$/.exec(l)).filter(Boolean).map((m) => ({ v: m[1].trim(), name: m[2] }));
    res({ code, s: (Date.now() - t0) / 1000, asserts, headline: (out.split(/\r?\n/).find((l) => l.startsWith("organism_test:")) || "").replace(/\s+/g, " ") }); });
});
const Z = mk(false), T = mk(true);
const keys = block("LIVE_ASSERTS");
const res = { Z: {}, T: {} };
for (const m of MODES) { const [z, t] = await Promise.all([runMode(Z, m), runMode(T, m)]); res.Z[m] = z; res.T[m] = t;
  console.error(`mode ${m}: Z exit ${z.code} (${z.asserts.length} asserts, ${z.s}s) · T exit ${t.code} (${t.asserts.length} asserts, ${t.s}s)`); }
for (const m of MODES) console.log(JSON.stringify({ kind: "mode", mode: m, Z: { code: res.Z[m].code, n: res.Z[m].asserts.length, fail: res.Z[m].asserts.filter((a) => a.v === "FAIL").length }, T: { code: res.T[m].code, n: res.T[m].asserts.length, fail: res.T[m].asserts.filter((a) => a.v === "FAIL").length } }));
for (const k of keys) { const find = (side) => { for (const m of MODES) { const hit = res[side][m].asserts.filter((a) => keyOf([k.key], a.name)); if (hit.length) return { mode: m, n: hit.length, v: hit.every((a) => a.v === "ok") ? "ok" : "FAIL" }; } return null; };
  console.log(JSON.stringify({ kind: "assert", line: k.line, key: k.key, why: k.why, Z: find("Z"), T: find("T") })); }
// the asserts of each mode that the hermetic profile names LIVE as a WHOLE mode (gates · lawpack · alive · atlas): every
// assert inside is a full-only member too.
for (const m of ["gates", "lawpack", "alive", "atlas"].filter((x) => MODES.includes(x)))
  for (const side of ["Z", "T"]) console.log(JSON.stringify({ kind: "mode-asserts", mode: m, side, rows: res[side][m].asserts.map((a) => `${a.v} ${fold(a.name).slice(0, 90)}`) }));
