#!/usr/bin/env node
// ci/mherm/witness_mherm.mjs — unit mherm (forks rows 1151 (3) / 1157) · THE WITNESS. Its header is its contract.
// ----------------------------------------------------------------------------------------------------------------------
// USAGE: node ci/mherm/witness_mherm.mjs --org <build checkout> --base-org <base checkout> [--bound-org <merge parent>]
//   An org is a git checkout (its HEAD is CLONED with core.autocrlf=false, so a Windows checkout plants LF bytes exactly as
//   committed) or a plain tree (the suite's WITNESSES member hands LF work trees with no .git: it is COPIED, node_modules
//   and .git left out, then `git init` + `git add -A` with core.autocrlf=false, no commit — the trees' own sandbox builds
//   from `git ls-files`). Into each planted tree it links a node_modules (the org's, else the other org's; a junction on
//   Windows). It never runs in, writes to or reads the state of either org. Every plant lives under ONE temp root R
//   (mkdtemp under os.tmpdir()); every state plant is written by node, never a shell.
// THE LAW IT HOLDS: a hermetic run reads nothing it did not plant, and everything it writes lives under its own temp dir.
//   Each tree is planted UNDER the temp dir it is run with (TMPDIR/TEMP/TMP = the tree's parent), the position a fresh
//   clone in %TEMP% or /tmp has on his laptop and the position that reddened the base.
// CLAUSES (each must read RED on the base plant and GREEN on the build plant):
//   W1 COLLAR   · the planted tree's `sandbox.mjs selftest`, run with TMPDIR/TEMP/TMP = the tree's parent (an ANCESTOR of
//                 the tree): exit 0, and the canary's two live-state targets in the tree (CANARY_MUST_NEVER_EXIST.json,
//                 brain_ledger.jsonl) never created.
//   W2 TREE     · `git status --porcelain --ignored` of the planted tree is the same before the two runs and after them.
//   W3 LEDGER   · `organism_test.mjs laws` (hermetic) on a fresh plant, without and then with a one-row brain_ledger.jsonl
//                 planted in the tree's state dir: the verdict lines (`^  (ok  |FAIL|LIVE) |^organism_test:`) are byte-equal.
//   W4 TEMP     · after the two runs the temp dir they were handed holds nothing but the tree.
//   W5 TWICE    · run 1 = `laws` then `suites`, run 2 = `laws`, both hermetic, on ONE plant: the two `laws` runs' verdict
//                 lines are byte-equal. Measured at base cebe3eb (ci/mherm/PROOF.md): the only verdict lines a second
//                 hermetic `all` changes are `laws` ones (the ten ledger asserts), and every file a run leaves (Q3 of the
//                 spec) is left by a `suites` member — so these two modes carry every cause, at about half the cost of
//                 `all`. The whole `all`, twice, is the workflow job `hermetic-twice` (suite.yml, F2 C).
//   W2 W4 W5 ride one plant and its two runs; W1 W3 ride a second plant (so the first plant's runs cannot feed them).
//   The two orgs' plants run concurrently, each child writing to a file (no pipe to fill).
// BOUND (not a both-ways clause): every path whose index blob differs between the build's plant and the BOUND org's is a
//   named file. The bound org is `--bound-org <dir>` when given (the build's merge parent after main moved: forks row
//   1200 (2), the clauses against ci/mherm/BASE, the bound against the parent), else the base org —
//   scripts/sandbox.mjs, scripts/organism_test.mjs, scripts/tone.mjs, scripts/audit_preload.mjs,
//   .github/workflows/suite.yml, or a path under ci/mherm/.
// LAST: no process whose command line names R survives (read from /proc on Linux, from Get-CimInstance on Windows, from ps
//   elsewhere — never through a shell); R is then removed.
// PORT CLASS (row 1053): the witness binds no port, names no live service, POSTs nothing and restarts nothing; the
//   selftests it runs plant their own ephemeral ports (listen 0) under their own temp dirs. It sets no wait of its own:
//   every child it spawns is the suite runner (whose run() bounds each member it spawns) or the sandbox selftest (whose
//   runIn() bounds each child it spawns). No live model call: a planted `claude`/`gemini` shim refuses at the head of PATH.
// EXIT / LAST LINE: `GREEN MHERM <what> · <n> clause(s)` (exit 0) or `RED MHERM · <clauses>` (exit 1).
// EXPORTS (for ci/mherm/run_mutants_mherm.mjs): plantTree(org, into, modules) · CLAUSES · survivors(root) · isRepo(dir).
// ----------------------------------------------------------------------------------------------------------------------
import { execFileSync, spawnSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, unlinkSync, realpathSync, writeFileSync, cpSync, openSync, closeSync } from "node:fs";
import { join, resolve, relative, sep, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

export const CLAUSES = ["W1 COLLAR", "W2 TREE", "W3 LEDGER", "W4 TEMP", "W5 TWICE"];
const NAMED = [/^scripts\/(sandbox|organism_test|tone|audit_preload)\.mjs$/, /^\.github\/workflows\/suite\.yml$/, /^ci\/mherm\//];
const VL = /^ {2}(ok {2}|FAIL|LIVE) |^organism_test:/;
const NL = /\r?\n/;
const vlines = (out) => String(out).split(NL).filter((l) => VL.test(l)).join("\n");
const git = (cwd, args) => spawnSync("git", ["-c", "core.autocrlf=false", ...args], { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, windowsHide: true });

/** true when <d> is the top of a git work tree (a seat checkout), false for a plain tree (the member's) @param {string} d */
export function isRepo(d) {
  const r = spawnSync("git", ["-C", d, "rev-parse", "--show-toplevel"], { encoding: "utf8", windowsHide: true });
  if (r.status !== 0) return false;
  try { return realpathSync(String(r.stdout).trim()).toLowerCase() === realpathSync(d).toLowerCase(); } catch { return false; }
}
/** plant <org> as <into>/tree: a clone of a checkout's HEAD, or a copy of a plain tree made a git repo (init + add, no
 *  commit); then link a node_modules (the org's, else <modules>) @returns {string} the planted tree */
export function plantTree(org, into, modules = null) {
  const dir = join(into, "tree"), src = resolve(org);
  mkdirSync(into, { recursive: true });
  if (isRepo(src)) execFileSync("git", ["-c", "core.autocrlf=false", "clone", "-q", "--no-local", "-c", "core.autocrlf=false", src, dir], { stdio: ["ignore", "pipe", "pipe"] });
  else {
    cpSync(src, dir, { recursive: true, filter: (s) => { const r = relative(src, s).split(sep)[0]; return r !== "node_modules" && r !== ".git"; } });
    for (const g of [["init", "-q"], ["add", "-A"]]) git(dir, g);
  }
  const mods = [join(src, "node_modules"), modules].find((p) => p && existsSync(p));
  if (mods) symlinkSync(realpathSync(mods), join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return dir;
}
/** path → index blob id of a planted tree @param {string} tree */
function blobs(tree) {
  const m = new Map();
  for (const l of String(git(tree, ["ls-files", "-s"]).stdout).split("\n")) {
    const x = /^\d+ ([0-9a-f]+) \d+\t(.+)$/.exec(l);
    if (x) m.set(x[2], x[1]);
  }
  return m;
}
/** the env of every child: hermetic profile, the preload of a parent collar dropped, temp dir = <tmp>, a refusing model shim
 *  @param {string} tmp @param {string} shim */
function childEnv(tmp, shim) {
  const e = { ...process.env, ORGANISM_TEST_PROFILE: "hermetic", TMPDIR: tmp, TEMP: tmp, TMP: tmp };
  delete e.NODE_OPTIONS;
  const pk = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
  e[pk] = `${shim}${delimiter}${e[pk] || ""}`;
  return e;
}
/** spawn node <args> in <cwd>, output to <log>; resolves to { code, out } @returns {Promise<{code: number|null, out: string}>} */
function runTo(args, cwd, env, log) {
  return new Promise((res) => {
    const fd = openSync(log, "w");
    const c = spawn(process.execPath, args, { cwd, env, stdio: ["ignore", fd, fd], windowsHide: true });
    const done = (code) => { try { closeSync(fd); } catch {} res({ code, out: readFileSync(log, "utf8") }); };
    c.on("error", () => done(null));
    c.on("exit", (code) => done(code));
  });
}
const status = (tree) => String(git(tree, ["status", "--porcelain", "--ignored"]).stdout);

/** every clause on one org's plants @returns {Promise<Record<string, {ok: boolean, why: string}>>} */
async function judgeOrg(org, other, R, side, shim) {
  /** @type {Record<string, {ok: boolean, why: string}>} */
  const v = {};
  const logs = join(R, "logs"); mkdirSync(logs, { recursive: true });
  const L = (n) => join(logs, `${side}.${n}.txt`);
  const otherMods = existsSync(join(other, "node_modules")) ? join(other, "node_modules") : null;
  // ── plant A: W2 · W4 · W5 ──
  const XA = join(R, `${side}-a`), A = plantTree(org, XA, otherMods), envA = childEnv(XA, shim);
  const st0 = status(A);
  const r1l = await runTo([join("scripts", "organism_test.mjs"), "laws"], A, envA, L("run1-laws"));
  const r1s = await runTo([join("scripts", "organism_test.mjs"), "suites"], A, envA, L("run1-suites"));
  const r2l = await runTo([join("scripts", "organism_test.mjs"), "laws"], A, envA, L("run2-laws"));
  const a = vlines(r1l.out), b = vlines(r2l.out);
  const head = (s) => s.split("\n").filter((l) => l.startsWith("organism_test:")).pop() || "(no headline)";
  v["W5 TWICE"] = { ok: a.length > 0 && a === b, why: `laws run 1: ${head(a)} · laws run 2: ${head(b)} · suites run 1: ${head(vlines(r1s.out))}` };
  const st1 = status(A), before = new Set(st0.split(NL));
  const grew = st1.split(NL).filter((l) => l && !before.has(l)), lost = st0.split(NL).filter((l) => l && !st1.split(NL).includes(l));
  v["W2 TREE"] = { ok: st0 === st1, why: grew.length || lost.length ? `after: ${[...grew, ...lost.map((l) => `(gone) ${l}`)].join(" · ")}` : "equal" };
  const left = readdirSync(XA).filter((n) => n !== "tree");
  v["W4 TEMP"] = { ok: left.length === 0, why: left.length ? `left in the run's temp dir: ${left.length} — ${left.slice(0, 8).join(" · ")}` : "empty" };
  // ── plant B: W3 · W1 ──
  const XB = join(R, `${side}-b`), B = plantTree(org, XB, otherMods), envB = childEnv(XB, shim);
  const ledger = join(B, "dressing-room", "state", "brain_ledger.jsonl");
  const canary = join(B, "dressing-room", "state", "CANARY_MUST_NEVER_EXIST.json");
  const w3a = await runTo([join("scripts", "organism_test.mjs"), "laws"], B, envB, L("w3-without"));
  mkdirSync(join(B, "dressing-room", "state"), { recursive: true });
  writeFileSync(ledger, "{}\n");
  const w3b = await runTo([join("scripts", "organism_test.mjs"), "laws"], B, envB, L("w3-with"));
  rmSync(ledger, { force: true });
  const p = vlines(w3a.out), q = vlines(w3b.out);
  v["W3 LEDGER"] = { ok: p.length > 0 && p === q, why: `without the plant: ${head(p)} · with it: ${head(q)}` };
  const w1 = await runTo([join("scripts", "sandbox.mjs"), "selftest"], B, envB, L("w1-sandbox"));
  const sh = String(w1.out).split(NL).filter((l) => /^sandbox: /.test(l)).pop() || "(no sandbox headline)";
  v["W1 COLLAR"] = { ok: w1.code === 0 && !existsSync(canary) && !existsSync(ledger),
    why: `exit ${w1.code} · ${sh}${existsSync(canary) ? " · the canary's live-state file was created in the tree" : ""}${existsSync(ledger) ? " · the canary appended the tree's brain_ledger" : ""}` };
  for (const t of [A, B]) { try { unlinkSync(join(t, "node_modules")); } catch {} }
  return v;
}

/** node processes whose command line names <dir> @param {string} dir @returns {number[]} */
export function survivors(dir) {
  const low = dir.toLowerCase();
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true });
    return String(r.stdout || "").split(NL).filter((l) => l.toLowerCase().includes(low)).map((l) => Number(l.trim().split(" ")[0])).filter((x) => x && x !== process.pid);
  }
  if (existsSync("/proc")) {
    const out = [];
    for (const p of readdirSync("/proc")) {
      if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
      try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").toLowerCase().includes(low)) out.push(Number(p)); } catch {}
    }
    return out;
  }
  const r = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
  return String(r.stdout || "").split(NL).filter((l) => l.toLowerCase().includes(low)).map((l) => Number(l.trim().split(/\s+/)[0])).filter((x) => x && x !== process.pid);
}

async function main() {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const org = arg("--org"), base = arg("--base-org"), boundOrg = arg("--bound-org");
  if (boundOrg && !existsSync(boundOrg)) { console.log("RED MHERM · USAGE (--bound-org names no dir)"); process.exit(1); }
  if (!org || !base || !existsSync(org) || !existsSync(base)) { console.log("RED MHERM · USAGE (--org <build> --base-org <base>, both existing dirs)"); process.exit(1); }
  const R = mkdtempSync(join(tmpdir(), "mherm-w-"));
  let reds = [], what = "";
  try {
    const shim = join(R, "shim"); mkdirSync(shim);
    for (const tool of ["claude", "gemini"]) {
      writeFileSync(join(shim, tool), `#!/bin/sh\necho "REFUSED — no live model call in a witness (unit mherm)" >&2\nexit 1\n`, { mode: 0o755 });
      writeFileSync(join(shim, `${tool}.cmd`), `@echo REFUSED — no live model call in a witness (unit mherm) 1>&2\r\n@exit /b 1\r\n`);
    }
    const [vb, vh] = await Promise.all([judgeOrg(base, org, R, "base", shim), judgeOrg(org, base, R, "build", shim)]);
    for (const c of CLAUSES) {
      const ok = !vb[c].ok && vh[c].ok;
      console.log(`  ${ok ? "ok  " : "FAIL"} ${c} · base ${vb[c].ok ? "GREEN" : "RED"} (${vb[c].why}) · build ${vh[c].ok ? "GREEN" : "RED"} (${vh[c].why})`);
      if (!ok) reds.push(c);
    }
    // BOUND — every path that differs between the two orgs is a named file (read from the W1/W3 plants' indexes)
    const bb = blobs(boundOrg ? plantTree(boundOrg, join(R, "bound")) : join(R, "base-b", "tree")), bh = blobs(join(R, "build-b", "tree"));
    const differ = [...new Set([...bb.keys(), ...bh.keys()])].filter((k) => bb.get(k) !== bh.get(k)).sort();
    const stray = differ.filter((p) => !NAMED.some((re) => re.test(p)));
    console.log(`  ${stray.length ? "FAIL" : "ok  "} BOUND · against ${boundOrg ? "the bound org (--bound-org)" : "the base org"} · ${differ.length} path(s) differ, each a named file${stray.length ? ` — NOT named: ${stray.join(", ")}` : `: ${differ.join(", ")}`}`);
    if (stray.length) reds.push("BOUND");
    what = `the hermetic run is a function of the tree (sandbox's own temp · the run's own temp · the ledger block LIVE · tone logs in its box · no collar temp allowance)`;
  } catch (e) {
    console.log(`  FAIL PLANT · ${e instanceof Error ? e.message.split(NL)[0] : String(e)}`);
    reds.push("PLANT");
  } finally {
    const left = survivors(R);
    for (const p of left) { try { process.kill(p); } catch {} }
    if (left.length) { console.log(`  FAIL LAST · ${left.length} process(es) named the temp root and were killed: ${left.join(", ")}`); reds.push("LAST"); }
    else console.log("  ok   LAST · no process names the temp root");
    try { rmSync(R, { recursive: true, force: true }); } catch {}
  }
  if (reds.length) { console.log(`RED MHERM · ${reds.join(", ")}`); process.exit(1); }
  console.log(`GREEN MHERM ${what} · ${CLAUSES.length} clause(s)`);
  process.exit(0);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
