#!/usr/bin/env node
// ci/mcov/witness_mcov.mjs — unit mcov (forks row 1137 (5)) · THE WITNESS. Its header is its contract.
// ----------------------------------------------------------------------------------------------------------------------
// USAGE: node ci/mcov/witness_mcov.mjs --org <build checkout> --base-org <base checkout>
//   An org is a git checkout (a seat's tree: the witness CLONES its HEAD, `git clone` with core.autocrlf=false, so a
//   Windows checkout plants LF bytes exactly as committed) or a plain tree (the suite's WITNESSES member hands LF work trees
//   with no .git: the witness COPIES it, node_modules and .git left out; row 1182 (2)). Into each planted tree it links a
//   node_modules (the org's, else the other org's; a junction on Windows) and loads acorn from THAT tree, never from beside
//   this file, because the member runs the witness from a copy of its dir. It never runs in, writes to or reads the state of
//   either org: BOUND reads `git ls-files -s` of two checkouts, or the bytes of two plain trees.
// CLAUSES (each must read RED on the base clone and GREEN on the build clone):
//   C1 COVERAGE   · `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs coverage` prints
//                   `ok   EVERY organ with a selftest is wired into a suite` and no `orphaned:` line.
//   C2 HERMETIC   · the hermetic `suites` mode judges deck_lint, probe and study_scope, each by its own
//                   `ok   SUITE MEMBER · <organ> selftest exits 0` line.
//   C3 LIVE-NAMED · the same `suites` run names home_pin `LIVE selftest home_pin — not run` (it reads state/captain.json)
//                   and never judges it as a hermetic member.
//   C4 VERB       · `node scripts/study_scope.mjs selftest` exits 0 and its last line is
//                   `study_scope selftest: <n> passed, 0 failed` with n > 0 (its own cases, not the usage line).
//   C5 ONE RECORD · (forks row 1143 (1)) each of the four is named by EXACTLY ONE package.json suite string, and the suite
//                   file (scripts/organism_test.mjs) lists no member names: no array literal in it (parsed with acorn)
//                   holds two or more string elements that are, exactly, names of package.json suite members. A spawn
//                   argv naming one organ is not a list; a second list of member names beside the one record is.
//   C6 SLOW-GREEN · (forks row 1151 (1) (b)) a planted suite member whose selftest sleeps the run helper's DEFAULT bound
//                   (read from the planted tree's own `opts.timeout || <n>`, never typed here) and then exits 0 is judged
//                   `ok   SUITE MEMBER · mcov_slow selftest exits 0` by the hermetic `suites` mode: a member's wait is a
//                   hang guard, not a race.
//   C7 HANG-NAMED · (row 1151 (1) (a)) a planted suite member that never exits is red, and its red is NAMED: the member's
//                   FAIL detail and the roll-up both say `killed by the suite bound (<bound> ms)` with a bound above the
//                   helper's default — never a bare non-zero exit.
//   ONE planted tree per org carries every clause (row 1182 (2)): two plant files under scripts/ and two members appended
//   to that tree's organism:selftest string (both carry a selftest verb and sit in one string, so C1 and C5 are unmoved by
//   them). Its `suites` run is handed ORGANISM_TEST_MEMBER_BOUND_MS = twice the helper default: a door the build's suite file
//   honours only to LOWER the member bound, so the hang is killed at that bound and the neutral job never spends the whole
//   long bound on a plant; the base's suite file has no door and kills both plants at its default. The two trees' suites
//   runs go concurrently, each writing to a file (no pipe to fill while the other tree's clauses run).
// BOUND (not a both-ways clause): every path whose index blob differs between the two orgs is a named file —
//   package.json, scripts/organism_test.mjs, the four organs' files, or a path under ci/mcov/.
// LAST: no process whose command line names the witness's temp root survives (read from /proc on Linux, from
//   Get-CimInstance on Windows, from ps elsewhere — never through a shell); the temp root is then removed.
// PORT CLASS (row 1053): the witness binds no port, names no live service, POSTs nothing and restarts nothing; the
//   selftests it runs plant their own ephemeral ports (listen 0) under their own temp dirs. It sets no wait of its own:
//   every child it spawns is the suite runner, whose own run() bounds each member it spawns.
// EXIT / LAST LINE: `GREEN MCOV <what> · <n> clause(s)` (exit 0) or `RED MCOV · <clauses>` (exit 1).
// EXPORTS (for ci/mcov/run_mutants_mcov.mjs): plantTree(org, into, modules) · judgeAll(dir) · CLAUSES · BOUND_CLAUSES · survivors(root).
// ----------------------------------------------------------------------------------------------------------------------
import { execFileSync, spawnSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, realpathSync, writeFileSync, cpSync, openSync, closeSync, statSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

export const CLAUSES = ["C1 COVERAGE", "C2 HERMETIC", "C3 LIVE-NAMED", "C4 VERB", "C5 ONE RECORD"];
export const BOUND_CLAUSES = ["C6 SLOW-GREEN", "C7 HANG-NAMED"];
const SUITE_NAMES = ["organism:selftest", "squad:selftest", "audit:selftest"];
const FOUR = ["deck_lint", "home_pin", "probe", "study_scope"];
const HERMETIC_FOUR = ["deck_lint", "probe", "study_scope"];
const NAMED = [/^package\.json$/, /^scripts\/organism_test\.mjs$/, /^scripts\/(deck_lint|home_pin|probe|study_scope)\.mjs$/, /^ci\/mcov\//];
const NL = /\r?\n/;
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const childEnv = () => { const e = { ...process.env, ORGANISM_TEST_PROFILE: "hermetic" }; delete e.NODE_OPTIONS; return e; };

/** true when <d> is the top of a git work tree (a seat checkout), false for a plain tree (the member's) @param {string} d */
function isRepo(d) {
  const r = spawnSync("git", ["-C", d, "rev-parse", "--show-toplevel"], { encoding: "utf8", windowsHide: true });
  if (r.status !== 0) return false;
  try { return realpathSync(String(r.stdout).trim()).toLowerCase() === realpathSync(d).toLowerCase(); } catch { return false; }
}
/** plant <org> under <into>: a clone of a checkout's HEAD (core.autocrlf=false), or a copy of a plain tree; then link a
 *  node_modules (the org's, else <modules>) @returns {string} the planted dir */
export function plantTree(org, into, modules = null) {
  const dir = join(into, "tree"), src = resolve(org);
  if (isRepo(src)) execFileSync("git", ["-c", "core.autocrlf=false", "clone", "-q", "-c", "core.autocrlf=false", src, dir], { stdio: ["ignore", "pipe", "pipe"] });
  else cpSync(src, dir, { recursive: true, filter: (s) => { const r = relative(src, s).split(sep)[0]; return r !== "node_modules" && r !== ".git"; } });
  const mods = [join(src, "node_modules"), modules].find((p) => p && existsSync(p));
  if (mods) symlinkSync(realpathSync(mods), join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return dir;
}

const node = (dir, args) => { const r = spawnSync(process.execPath, args, { cwd: dir, env: childEnv(), encoding: "utf8", windowsHide: true, maxBuffer: 1 << 28 }); return { code: r.status, out: (r.stdout || "") + (r.stderr || "") }; };

/** plant the slow and the hanging member into a planted tree @returns {number} the run helper's default bound, NaN if unreadable */
function plantBoundMembers(dir) {
  const dm = /opts\.timeout \|\| (\d+)/.exec(readFileSync(join(dir, "scripts", "organism_test.mjs"), "utf8"));
  const def = dm ? Number(dm[1]) : NaN;
  if (!Number.isFinite(def)) return def;
  writeFileSync(join(dir, "scripts", "mcov_slow.mjs"), `// planted by ci/mcov/witness_mcov.mjs: sleeps the run helper's default bound, then exits 0\nif (process.argv[2] === "selftest") setTimeout(() => { console.log("mcov_slow selftest: slept the helper default, exit 0"); }, ${def});\n`);
  writeFileSync(join(dir, "scripts", "mcov_hang.mjs"), "// planted by ci/mcov/witness_mcov.mjs: never exits; only the suite runner's bound ends it\nif (process.argv[2] === \"selftest\") setInterval(() => {}, 1 << 30);\n");
  const pj = join(dir, "package.json");
  writeFileSync(pj, readFileSync(pj, "utf8").replace(/("organism:selftest": "[^"]*)"/, (_, s) => `${s} && node scripts/mcov_slow.mjs selftest && node scripts/mcov_hang.mjs selftest"`));
  return def;
}

/** judge EVERY clause on one planted tree (it is changed: the two bound members are planted into it first)
 *  @param {string} dir @returns {Promise<Record<string, {green: boolean, why: string}>>} */
export async function judgeAll(dir) {
  const v = {};
  const def = plantBoundMembers(dir);
  // the suites run starts first, to a file: it holds the slow and the hanging plant, so it is the long pole
  const log = join(dir, "..", "suites.txt"), fd = openSync(log, "w");
  const env = { ...childEnv(), ...(Number.isFinite(def) ? { ORGANISM_TEST_MEMBER_BOUND_MS: String(def * 2) } : {}) };
  const done = new Promise((res) => { const ch = spawn(process.execPath, [join("scripts", "organism_test.mjs"), "suites"], { cwd: dir, env, stdio: ["ignore", fd, fd], windowsHide: true }); ch.on("close", () => { closeSync(fd); res(readFileSync(log, "utf8")); }); });
  const cov = node(dir, [join("scripts", "organism_test.mjs"), "coverage"]);
  const covOk = /^ {2}ok {3}EVERY organ with a selftest is wired into a suite/m.test(cov.out);
  const orphan = cov.out.split(NL).find((l) => /orphaned:/.test(l));
  v["C1 COVERAGE"] = { green: covOk && !orphan, why: orphan ? orphan.trim() : covOk ? "wired, no orphan" : "coverage assert line absent" };
  const ss = node(dir, [join("scripts", "study_scope.mjs"), "selftest"]);
  const last = ss.out.split(NL).filter(Boolean).pop() || "";
  const m = /^study_scope selftest: (\d+) passed, 0 failed$/.exec(last);
  v["C4 VERB"] = { green: ss.code === 0 && !!m && Number(m[1]) > 0, why: `exit ${ss.code} · last line: ${last.slice(0, 140)}` };
  v["C5 ONE RECORD"] = oneRecord(dir);
  const su = await done;
  const missing = HERMETIC_FOUR.filter((o) => !new RegExp(`^ {2}ok {3}SUITE MEMBER · ${o} selftest exits 0$`, "m").test(su));
  v["C2 HERMETIC"] = { green: missing.length === 0, why: missing.length ? `not judged green: ${missing.join(", ")}` : `${HERMETIC_FOUR.join(", ")} judged ok` };
  const liveLine = /^ {2}LIVE selftest home_pin — not run/m.test(su), judged = /SUITE MEMBER · home_pin /.test(su);
  v["C3 LIVE-NAMED"] = { green: liveLine && !judged, why: judged ? "home_pin judged as a hermetic member" : liveLine ? "home_pin named LIVE" : "home_pin neither named nor run" };
  const L = su.split(NL);
  if (!Number.isFinite(def)) { for (const k of BOUND_CLAUSES) v[k] = { green: false, why: "the run helper's default bound is not readable in this tree" }; return v; }
  const slowOk = /^ {2}ok {3}SUITE MEMBER · mcov_slow selftest exits 0$/m.test(su);
  const si = L.findIndex((l) => /FAIL SUITE MEMBER · mcov_slow /.test(l));
  v["C6 SLOW-GREEN"] = { green: slowOk, why: slowOk ? `slept ${def} ms (the helper default) and was judged ok` : si >= 0 ? `judged red: ${L[si].trim()} ${(L[si + 1] || "").trim()}`.slice(0, 200) : "mcov_slow never judged" };
  const i = L.findIndex((l) => /^ {2}FAIL SUITE MEMBER · mcov_hang selftest exits 0/.test(l));
  const detail = i >= 0 ? (L[i + 1] || "").trim() : "";
  const km = /killed by the suite bound \((\d+) ms\)/.exec(detail);
  const rollup = /mcov_hang: killed by the suite bound \(\d+ ms\)/.test(su);
  const named = i >= 0 && !!km && Number(km[1]) > def && rollup;
  v["C7 HANG-NAMED"] = { green: named, why: i < 0 ? "mcov_hang never judged red" : named ? `named: ${detail.slice(0, 120)} · roll-up names it` : `not named: detail "${detail.slice(0, 100)}" · roll-up ${rollup ? "names it" : "does not name a kill"}` };
  return v;
}

/** C5 — the four in exactly one package.json suite string, and no member list in the suite file */
function oneRecord(dir) {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const members = new Set(), times = new Map(FOUR.map((f) => [f, 0]));
  for (const n of SUITE_NAMES) {
    const named = new Set([...String(pkg.scripts?.[n] || "").matchAll(/scripts\/([A-Za-z0-9_\-]+)\.mjs/g)].map((m) => m[1]));
    for (const m of named) { members.add(m); if (times.has(m)) times.set(m, times.get(m) + 1); }
  }
  const notOnce = FOUR.filter((f) => times.get(f) !== 1).map((f) => `${f} in ${times.get(f)} suite string(s)`);
  const lists = [];
  // acorn from the PLANTED tree's node_modules: the member runs this file from a copy of ci/mcov/, beside no node_modules
  let parse, simple;
  try { const req = createRequire(join(dir, "package.json")); ({ parse } = req("acorn")); ({ simple } = req("acorn-walk")); }
  catch (e) { return { green: false, why: `acorn is not loadable from the planted tree (${String(e && e.code || e).slice(0, 60)})` }; }
  const ast = parse(readFileSync(join(dir, "scripts", "organism_test.mjs"), "utf8"), { ecmaVersion: "latest", sourceType: "module", locations: true });
  simple(ast, { ArrayExpression(n) {
    const names = n.elements.filter((e) => e && e.type === "Literal" && typeof e.value === "string" && members.has(e.value)).map((e) => e.value);
    if (names.length >= 2) lists.push(`organism_test.mjs:${n.loc.start.line} [${names.join(", ")}]`);
  } });
  const why = [...notOnce, ...lists.map((l) => `member list ${l}`)];
  return { green: why.length === 0, why: why.length ? why.join(" · ") : "one record: package.json only, no member list in the suite file" };
}

/** every live process whose command line names `root` (never through a shell) @returns {string[]} */
export function survivors(root) {
  const needle = realpathSync(root);
  const out = [];
  try {
    if (process.platform === "linux") {
      for (const p of readdirSync("/proc")) {
        if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
        let cmd = ""; try { cmd = readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " "); } catch { continue; }
        if (cmd.includes(needle) || cmd.includes(root)) out.push(`${p} ${cmd.slice(0, 160)}`);
      }
    } else if (process.platform === "win32") {
      const t = execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8" });
      for (const l of t.split(NL)) if (l.includes(needle) || l.includes(root)) { const pid = Number(l.split(" ")[0]); if (pid !== process.pid) out.push(l.slice(0, 160)); }
    } else {
      const t = execFileSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
      for (const l of t.split(NL)) if (l.includes(needle) || l.includes(root)) { const pid = Number(l.trim().split(" ")[0]); if (pid !== process.pid) out.push(l.trim().slice(0, 160)); }
    }
  } catch (e) { out.push(`process table unreadable: ${String(e && e.message || e).slice(0, 120)}`); }
  return out;
}

/** paths whose content differs between two orgs: index blobs of two checkouts, else the bytes of two plain trees
 *  (node_modules and .git left out) @returns {string[]} */
function differing(a, b) {
  if (!(isRepo(a) && isRepo(b))) {
    const files = (root) => { const m = new Map(); const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f), r = relative(root, p).split(sep).join("/"); if (r === "node_modules" || r === ".git") continue; let s; try { s = statSync(p); } catch { continue; } if (s.isDirectory()) walk(p); else if (s.isFile()) m.set(r, createHash("sha256").update(readFileSync(p)).digest("hex")); } }; walk(root); return m; };
    const A = files(resolve(a)), B = files(resolve(b));
    return [...new Set([...A.keys(), ...B.keys()])].filter((p) => A.get(p) !== B.get(p)).sort();
  }
  const blobs = (d) => new Map(git(d, ["-c", "core.quotepath=false", "ls-files", "-s"]).split(NL).filter(Boolean).map((l) => { const [meta, p] = l.split("\t"); return [p, meta.split(" ")[1]]; }));
  const A = blobs(a), B = blobs(b);
  return [...new Set([...A.keys(), ...B.keys()])].filter((p) => A.get(p) !== B.get(p)).sort();
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const org = opt("--org"), base = opt("--base-org");
  if (!org || !base) { console.log("usage: node ci/mcov/witness_mcov.mjs --org <build checkout> --base-org <base checkout>"); process.exit(2); }
  const root = mkdtempSync(join(tmpdir(), "mcov-witness-"));
  const reds = [];
  try {
    const diff = differing(org, base);
    const outside = diff.filter((p) => !NAMED.some((r) => r.test(p)));
    console.log(`BOUND · ${diff.length} path(s) differ between the orgs: ${diff.join(", ") || "(none)"}`);
    if (outside.length) { console.log(`BOUND · RED — outside the named files: ${outside.join(", ")}`); reds.push("BOUND"); }
    const mods = [org, base].map((d) => join(resolve(d), "node_modules")).find((p) => existsSync(p)) || null;
    const [vb, vh] = await Promise.all([judgeAll(plantTree(base, mkdtempSync(join(root, "base-")), mods)), judgeAll(plantTree(org, mkdtempSync(join(root, "build-")), mods))]);
    for (const c of [...CLAUSES, ...BOUND_CLAUSES]) {
      const ok = !vb[c].green && vh[c].green;
      console.log(`${ok ? "HOLDS" : "BROKEN"} ${c} · base ${vb[c].green ? "GREEN" : "RED"} (${vb[c].why}) · build ${vh[c].green ? "GREEN" : "RED"} (${vh[c].why})`);
      if (!ok) reds.push(c);
    }
  } finally {
    const live = survivors(root);
    if (live.length) { console.log(`LAST · RED — ${live.length} process(es) name the temp dir: ${live.join(" | ")}`); reds.push("LAST"); }
    else console.log("LAST · no process names the temp dir");
    try { rmSync(root, { recursive: true, force: true }); } catch { /* a locked temp file on Windows is litter, not a verdict */ }
  }
  if (reds.length) { console.log(`RED MCOV · ${reds.join(", ")}`); process.exit(1); }
  console.log(`GREEN MCOV the four coverage orphans wired in package.json, each in its profile, a member's kill named · ${CLAUSES.length + BOUND_CLAUSES.length} clause(s)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
