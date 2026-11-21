#!/usr/bin/env node
// ============================================================================
// ci/mpinr/witness_mpinr.mjs · THE WITNESS of unit mpin-read (forks row 1160 (1)) — header = contract
// ----------------------------------------------------------------------------
// USE:   node ci/mpinr/witness_mpinr.mjs --org <dir> --base-org <dir>
//   --org       the tree judged (the build, or the base to see it RED). Read only: its scripts/ and package.json are
//               COPIED under os.tmpdir() and every run happens on the copy. Neither tree needs to be a git repository.
//   --base-org  the base tree (main at the cut, ci/mpinr/BASE). ONLY-NAMED compares it to --org as DIRECTORIES (the
//               neutral machine's member hands over plain LF work trees, not repositories), and its
//               scripts/conductor.mjs declaration of STEP_TIMEOUT_MS is read HERE, by this file's own regex (not by
//               the module under test), as the bound of every probe child and the value KILLED compares against.
// CLAUSES (each RED on the base, GREEN on the build; one mutant each in ci/mpinr/run_mutants_mpinr.mjs):
//   SELFTEST   scripts/own_source.mjs exists and `node scripts/own_source.mjs selftest` exits 0 with
//              `own_source selftest: <n> passed, 0 failed`, n > 0.
//   SUITE      exactly ONE package.json suite chain (a script value holding `&& node scripts/`) runs
//              `node scripts/own_source.mjs selftest`.
//   NARROW     on a planted CRLF organ whose selftest carries the pinned token: the WHOLE file holds it (the old pin's
//              subject — GREEN whatever the code says), ownCode(fn main) does NOT when main holds it only in a comment,
//              does when main's code holds it; a missing anchor and the selftest block both THROW; and every narrow
//              target of spec Q1 (one per distinct selector) resolves on the judged tree, holding its pinned text.
//   KILLED     childRun hands the child THE ONE NAMED BOUND (equal to the base-org owner's declaration, read here), and
//              on a planted owner with a short bound a REAL hanging child is killed and reads RED, named KILLED.
//   GUARD      doorGuard records AND refuses every child_process door in the child; it refuses a dir outside os.tmpdir().
//   COPY       tempCopy copies scripts/ and only registry.json of the state dir, under os.tmpdir(); cleanup removes it.
//   LEAF       own_source.mjs imports node: builtins only (postmatch's CHILD_TIMEOUT_MS would close a cycle through the
//              organs that will import it — measured in PROOF.md).
//   ONLY-NAMED the judged tree differs from the base ONLY in scripts/own_source.mjs (added), package.json (one line: the
//              suite line with `&& node scripts/own_source.mjs selftest` appended), ci/mpinr/ and the effort receipt.
//   LAST       no node process naming this witness's temp root survives. The detector is planted both ways first: a
//              planted sleeper under the root is SEEN, then killed. A survivor is reported RED, then killed.
// THE PORT CLASS (row 1053): no port is bound, no service named, nothing POSTed, nothing restarted; every child wait is
//   bounded (spawnSync timeout = the bound read above). Every child's TMPDIR / TEMP / TMP points under the temp root.
// WINDOWS: node only, no POSIX shell; CRLF folded on every read; the process list is `ps` on POSIX and PowerShell's
//   Get-CimInstance on win32.
// LAST LINE: GREEN MPINR own_source module · <n> clause(s)   (exit 0)   ·   RED MPINR · <clauses>   (exit 1)
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync, cpSync, rmSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { spawnSync, spawn, execFileSync } from "node:child_process";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const ORG = arg("--org") && resolve(arg("--org")), BASE_ORG = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE_ORG || !existsSync(ORG) || !existsSync(BASE_ORG)) { console.error("usage: node ci/mpinr/witness_mpinr.mjs --org <dir> --base-org <dir>"); console.log("RED MPINR · USAGE"); process.exit(1); }
const fold = (s) => String(s).replace(/\r\n/g, "\n");

// The bound, read HERE from the base owner by this file's own regex.
const ownerLine = fold(readFileSync(join(BASE_ORG, "scripts", "conductor.mjs"), "utf8")).split("\n").find((l) => /^const STEP_TIMEOUT_MS = /.test(l)) || "";
const BOUND = Number((ownerLine.match(/^const STEP_TIMEOUT_MS = (\d+);/) || [])[1]);
if (!Number.isSafeInteger(BOUND) || BOUND <= 0) { console.log(`RED MPINR · BOUND-UNREADABLE (${ownerLine.trim() || "no declaration"})`); process.exit(1); }

const ROOT = mkdtempSync(join(tmpdir(), "mpinr-witness-"));
const ENV = { ...process.env, TMPDIR: ROOT, TEMP: ROOT, TMP: ROOT };
const COPY = join(ROOT, "org");
mkdirSync(COPY);
if (existsSync(join(ORG, "scripts"))) cpSync(join(ORG, "scripts"), join(COPY, "scripts"), { recursive: true });
if (existsSync(join(ORG, "package.json"))) cpSync(join(ORG, "package.json"), join(COPY, "package.json"));
const MOD = join(COPY, "scripts", "own_source.mjs");

const results = [];
const clause = (id, ok, detail) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "ok " : "RED"} ${id} — ${detail}`); };
const run = (args, opts = {}) => {
  const r = spawnSync(process.execPath, args, { encoding: "utf8", timeout: BOUND, windowsHide: true, env: ENV, cwd: ROOT, ...opts });
  return { status: r.status, out: fold(r.stdout || ""), err: fold(r.stderr || ""), timedOut: !!(r.error && r.error.code === "ETIMEDOUT") };
};

// THE PROBE: one file, one clause per child, each bounded; it prints one JSON line {ok, detail}.
const PROBE = join(ROOT, "probe.mjs");
writeFileSync(PROBE, String.raw`
import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { join, dirname, relative, isAbsolute } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
const [clause, mod, root, boundStr] = process.argv.slice(2);
const BOUND = Number(boundStr);
const say = (ok, detail) => { console.log(JSON.stringify({ ok: !!ok, detail })); process.exit(0); };
const throwsWith = (f, re) => { try { f(); return false; } catch (e) { return re.test(String(e && e.message)); } };
const under = (p) => { const r = relative(tmpdir(), p); return !!r && !r.startsWith("..") && !isAbsolute(r); };
if (!existsSync(mod)) say(false, "no scripts/own_source.mjs in the judged tree");
let M; try { M = await import(pathToFileURL(mod).href); } catch (e) { say(false, "own_source.mjs does not load: " + e.message); }
const box = mkdtempSync(join(tmpdir(), "mpinr-probe-"));
const tok = ["PIN", "TOKEN", String(process.pid)].join("_");
if (clause === "NARROW") {
  const organ = (mainBody) => ["// header", 'import { x } from "./x.mjs";', "function main() {", mainBody, "}", "function selftest() {",
    '  return /' + tok + '/.test(readFileSync(new URL(import.meta.url), "utf8"));', "}", ""].join("\r\n");
  const f = join(box, "organ.mjs");
  writeFileSync(f, organ("  // " + tok + " lives only in a comment here"));
  const whole = readFileSync(f, "utf8").includes(tok);
  let narrowFalse; try { narrowFalse = !M.ownCode(f, { fn: "main" }).includes(tok); } catch (e) { say(false, "ownCode threw on a plain main(): " + e.message); }
  writeFileSync(f, organ("  return " + JSON.stringify(tok) + ";"));
  let narrowTrue; try { narrowTrue = M.ownCode(f, { fn: "main" }).includes(tok); } catch (e) { say(false, "ownCode threw: " + e.message); }
  const refuseMissing = throwsWith(() => M.ownCode(f, { fn: "absent" }), /anchor/);
  const refuseSelf = throwsWith(() => M.ownCode(f, { fn: "selftest" }), /REFUSED/);
  const S = join(mod, "..");
  const targets = [["audit.mjs", { fn: "deal" }, "ttl_days"], ["audit.mjs", { fn: "runAudit" }, "--check"], ["awayday.mjs", { decl: "TAIL_BUDGET" }, "TAIL_BUDGET"],
    ["awayday.mjs", { fn: "checkLane" }, "captains_call.mjs"], ["dugout.mjs", { fn: "main" }, "/recital"], ["dugout.mjs", { imports: true }, "./gaffer_state.mjs"],
    ["forge_session.mjs", { header: true }, "SOLE WRITER of dressing-room/state/forge_session.json"], ["gaffer_brain.mjs", { decl: "VERIFY_TIMEOUT_MS" }, "VERIFY_TIMEOUT_MS"],
    ["gates.mjs", { fn: "main" }, "NOT MEASURED"], ["mutagen.mjs", { fn: "coveredFiles" }, "NODE_V8_COVERAGE"]];
  const missed = [];
  for (const [file, sel, needle] of targets) { try { if (!M.ownCode(join(S, file), sel).includes(needle)) missed.push(file + " " + JSON.stringify(sel) + " lacks it"); } catch (e) { missed.push(file + " " + JSON.stringify(sel) + " threw: " + e.message.slice(0, 80)); } }
  rmSync(box, { recursive: true, force: true });
  say(whole && narrowFalse && narrowTrue && refuseMissing && refuseSelf && missed.length === 0,
    "whole-file holds it " + whole + " · narrowed comment-only false " + narrowFalse + " · narrowed code true " + narrowTrue + " · missing throws " + refuseMissing + " · selftest refused " + refuseSelf + " · " + (targets.length - missed.length) + "/" + targets.length + " spec targets resolve" + (missed.length ? " [" + missed.join("; ") + "]" : ""));
}
if (clause === "KILLED") {
  const rec = [];
  const door = (...a) => { rec.push(a[2] && a[2].timeout); return { status: 0, signal: null, stdout: "", stderr: "" }; };
  try { M.childRun("x.mjs", [], { spawn: door }); } catch (e) { say(false, "childRun threw: " + e.message); }
  if (rec[0] !== BOUND) say(false, "the child's timeout is " + rec[0] + ", the owner declares " + BOUND + " — the real hang is not run");
  const fast = join(box, "fast");
  mkdirSync(fast);
  cpSync(mod, join(fast, "own_source.mjs"));
  writeFileSync(join(fast, "conductor.mjs"), "const STEP_TIMEOUT_MS = " + Math.max(1, Math.ceil(BOUND / 120)) + ";\r\n");
  const F = await import(pathToFileURL(join(fast, "own_source.mjs")).href);
  const kid = join(box, "hang.mjs");
  writeFileSync(kid, "setInterval(() => {}, 1 << 30);\n");
  const r = F.childRun(kid, []);
  rmSync(box, { recursive: true, force: true });
  say(r.killed && /^KILLED at the bound/.test(String(r.why)) && r.pass(() => true) === false,
    "timeout handed = " + rec[0] + " (owner " + BOUND + ") · planted-bound hang: killed " + r.killed + " · pass " + r.pass(() => true) + " · " + r.why);
}
if (clause === "GUARD") {
  const g = M.doorGuard(box);
  const kid = join(box, "spawner.mjs");
  writeFileSync(kid, 'import { execFileSync, spawnSync } from "node:child_process";\nlet n = 0;\nfor (const f of [() => execFileSync("git", ["--version"]), () => spawnSync("node", ["-v"])]) { try { f(); } catch { n++; } }\nconsole.log("refused " + n);\n');
  const r = M.childRun(kid, [], { preload: g.preload, env: { ...process.env, ...g.env } });
  const outside = throwsWith(() => M.doorGuard(join(dirname(tmpdir()), "mpinr-never-" + process.pid)), /REFUSED/);
  const rec = g.spawned();
  rmSync(box, { recursive: true, force: true });
  say(r.why === null && r.stdout.trim() === "refused 2" && rec.length === 2 && outside, "child says " + JSON.stringify(r.stdout.trim()) + " · recorded [" + rec.join(" | ") + "] · outside tmpdir refused " + outside + (r.why ? " · " + r.why : ""));
}
if (clause === "COPY") {
  const src = join(box, "src");
  mkdirSync(join(src, "scripts"), { recursive: true });
  mkdirSync(join(src, "dressing-room", "state"), { recursive: true });
  writeFileSync(join(src, "scripts", "a.mjs"), "export {};\n");
  for (const f of ["registry.json", "reps_log.jsonl", "secret.json"]) writeFileSync(join(src, "dressing-room", "state", f), "{}\n");
  const c = M.tempCopy({ root: src, prefix: "mpinr-copy-" });
  const shape = existsSync(join(c.scripts, "a.mjs")) && c.seeded === "registry.json" && under(c.box);
  c.cleanup();
  const gone = !existsSync(c.box);
  rmSync(box, { recursive: true, force: true });
  say(shape && gone, "state seeded [" + c.seeded + "] · scripts copied " + shape + " · under tmpdir " + under(c.box) + " · cleanup removed " + gone);
}
say(false, "unknown clause " + clause);
`);
const probe = (id) => {
  const r = run([PROBE, id, MOD, ROOT, String(BOUND)]);
  if (r.timedOut) return clause(id, false, `the probe ran past the bound ${BOUND} ms — killed`);
  let j = null; try { j = JSON.parse(r.out.trim().split("\n").pop() || ""); } catch { /* not JSON: named below */ }
  clause(id, j && j.ok, j ? j.detail : `probe exit ${r.status}: ${(r.err || r.out).split("\n")[0]}`);
};

console.log(`witness_mpinr · org ${ORG} · base-org ${BASE_ORG} · bound ${BOUND} ms (base conductor.mjs STEP_TIMEOUT_MS)`);

// LAST, planted both ways first: the detector must SEE a planted sleeper under the root.
const nodesNaming = () => {
  let out = "";
  try {
    out = process.platform === "win32"
      ? execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", timeout: BOUND, windowsHide: true })
      : execFileSync("ps", ["-A", "-o", "pid=,args="], { encoding: "utf8", timeout: BOUND });
  } catch (e) { return { ok: false, pids: [], why: "the process list did not read: " + e.message }; }
  const pids = fold(out).split("\n").map((l) => l.trim()).filter((l) => l.includes(ROOT)).map((l) => Number(l.split(/\s+/)[0])).filter((p) => p && p !== process.pid);
  return { ok: true, pids };
};
const sleeperFile = join(ROOT, "sleeper.mjs");
writeFileSync(sleeperFile, `setTimeout(() => {}, ${BOUND});\n`);
const sleeper = spawn(process.execPath, [sleeperFile], { detached: true, stdio: "ignore", windowsHide: true });
sleeper.unref();
let seen = false;
for (const until = Date.now() + BOUND; Date.now() < until && !seen;) { const s = nodesNaming(); if (!s.ok) break; seen = s.pids.includes(sleeper.pid); if (!seen) spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 200)"], { timeout: BOUND }); }
try { process.kill(sleeper.pid); } catch { /* already gone */ }

// SELFTEST
{
  if (!existsSync(MOD)) clause("SELFTEST", false, "no scripts/own_source.mjs in the judged tree");
  else {
    const r = run([MOD, "selftest"]);
    const last = (r.out.trim().split("\n").pop() || "").trim();
    const m = last.match(/^own_source selftest: (\d+) passed, 0 failed$/);
    clause("SELFTEST", r.status === 0 && m && Number(m[1]) > 0, `exit ${r.status}${r.timedOut ? " (KILLED at the bound)" : ""} · ${last || "(no output)"}`);
  }
}
// SUITE
{
  let pkg = {}; try { pkg = JSON.parse(readFileSync(join(COPY, "package.json"), "utf8")); } catch { /* no package.json: RED below */ }
  const chains = Object.entries(pkg.scripts || {}).filter(([, v]) => typeof v === "string" && v.includes("&& node scripts/"));
  const holding = chains.filter(([, v]) => v.split("&&").map((s) => s.trim()).includes("node scripts/own_source.mjs selftest")).map(([k]) => k);
  clause("SUITE", holding.length === 1, `${holding.length} of ${chains.length} suite chain(s) run it${holding.length ? ` (${holding.join(", ")})` : ""}`);
}
probe("NARROW");
probe("KILLED");
probe("GUARD");
probe("COPY");
// LEAF
{
  if (!existsSync(MOD)) clause("LEAF", false, "no scripts/own_source.mjs in the judged tree");
  else {
    const src = fold(readFileSync(MOD, "utf8"));
    const specs = [...src.matchAll(/^\s*import\s[^"'`;]*?["']([^"']+)["']/gm), ...src.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]);
    const foreign = specs.filter((s) => !s.startsWith("node:"));
    clause("LEAF", specs.length > 0 && foreign.length === 0, `${specs.length} import(s): ${[...new Set(specs)].join(", ")}${foreign.length ? ` — NOT a builtin: ${foreign.join(", ")}` : ""}`);
  }
}
// ONLY-NAMED
{
  try {
    // THE TWO TREES ARE COMPARED AS DIRECTORIES, never through git: the neutral machine's member (unit ms1) hands this witness
    // two LF trees built by `git --work-tree=<dir> checkout`, which are NOT repositories (first red: CI run 44880854795,
    // 21 Nov 2026). .git and node_modules are not the tree's content and are skipped; every other file is compared CRLF-folded.
    const SKIP = new Set([".git", "node_modules"]);
    const files = (root) => {
      const out = new Map();
      const walk = (rel) => {
        for (const d of readdirSync(join(root, rel), { withFileTypes: true })) {
          if (SKIP.has(d.name)) continue;
          const r = rel ? rel + "/" + d.name : d.name;
          if (d.isDirectory()) walk(r);
          else if (d.isFile()) out.set(r, fold(readFileSync(join(root, r), "latin1")));
        }
      };
      walk("");
      return out;
    };
    const A = files(BASE_ORG), B = files(ORG);
    const changed = [...new Set([...A.keys(), ...B.keys()])].filter((f) => A.get(f) !== B.get(f)).sort();
    const baseFile = join(ORG, "ci", "mpinr", "BASE");
    const base = existsSync(baseFile) ? fold(readFileSync(baseFile, "utf8")).trim() : "(no ci/mpinr/BASE)";
    const named = (f) => f === "scripts/own_source.mjs" || f === "package.json" || f.startsWith("ci/mpinr/") || f === "campaign-2026-09/receipts_effort/mpinr_00.json";
    const beyond = changed.filter((f) => !named(f));
    const added = B.has("scripts/own_source.mjs") && !A.has("scripts/own_source.mjs");
    const was = (A.get("package.json") || "").split("\n"), now = (B.get("package.json") || "").split("\n");
    const diffAt = was.length === now.length ? was.map((l, i) => (l === now[i] ? -1 : i)).filter((i) => i >= 0) : null;
    const oneLine = !!diffAt && diffAt.length === 1 && (() => {
      const a = was[diffAt[0]], b = now[diffAt[0]], tail = " && node scripts/own_source.mjs selftest";
      return a.endsWith('",') && b === a.slice(0, -2) + tail + '",';
    })();
    clause("ONLY-NAMED", added && oneLine && beyond.length === 0,
      `base ${base.slice(0, 7)} · own_source.mjs added ${added} · package.json one suite line ${oneLine} · ${changed.length} path(s) differ${beyond.length ? ` — BEYOND THE NAMED: ${beyond.join(", ")}` : ""}`);
  } catch (e) { clause("ONLY-NAMED", false, "the trees did not read: " + String(e.message).split("\n")[0]); }
}
// LAST
{
  const s = nodesNaming();
  for (const p of s.pids) { try { process.kill(p); } catch { /* gone */ } }
  clause("LAST", seen && s.ok && s.pids.length === 0, `detector saw the planted sleeper ${seen} · survivors naming the root: ${s.ok ? (s.pids.length ? s.pids.join(", ") + " (killed)" : "none") : s.why}`);
}
rmSync(ROOT, { recursive: true, force: true });
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length) { console.log(`RED MPINR · ${red.join(" · ")}`); process.exit(1); }
console.log(`GREEN MPINR own_source module · ${results.length} clause(s)`);
process.exit(0);
