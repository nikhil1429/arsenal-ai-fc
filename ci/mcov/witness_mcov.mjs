#!/usr/bin/env node
// ci/mcov/witness_mcov.mjs — unit mcov (forks row 1137 (5)) · THE WITNESS. Its header is its contract.
// ----------------------------------------------------------------------------------------------------------------------
// USAGE: node ci/mcov/witness_mcov.mjs --org <build checkout> --base-org <base checkout>
//   Each org is a git checkout. The witness CLONES each one's HEAD under os.tmpdir() (`git clone` with
//   core.autocrlf=false, so a Windows checkout plants LF bytes exactly as committed), links the org's node_modules into
//   the clone (a junction on Windows; the base falls back to the build's when it has none), and judges every clause on
//   each clone. It never runs in, writes to or reads the state of either org: it reads only `git ls-files -s` (BOUND).
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
// BOUND (not a both-ways clause): every path whose index blob differs between the two orgs is a named file —
//   package.json, scripts/organism_test.mjs, the four organs' files, or a path under ci/mcov/.
// LAST: no process whose command line names the witness's temp root survives (read from /proc on Linux, from
//   Get-CimInstance on Windows, from ps elsewhere — never through a shell); the temp root is then removed.
// PORT CLASS (row 1053): the witness binds no port, names no live service, POSTs nothing and restarts nothing; the
//   selftests it runs plant their own ephemeral ports (listen 0) under their own temp dirs. It sets no wait of its own:
//   every child it spawns is the suite runner, whose own run() bounds each member it spawns.
// EXIT / LAST LINE: `GREEN MCOV <what> · <n> clause(s)` (exit 0) or `RED MCOV · <clauses>` (exit 1).
// EXPORTS (for ci/mcov/run_mutants_mcov.mjs): plantClone(org, into) · judge(dir) · CLAUSES · survivors(root).
// ----------------------------------------------------------------------------------------------------------------------
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { parse } from "acorn";
import { simple } from "acorn-walk";

export const CLAUSES = ["C1 COVERAGE", "C2 HERMETIC", "C3 LIVE-NAMED", "C4 VERB", "C5 ONE RECORD"];
const SUITE_NAMES = ["organism:selftest", "squad:selftest", "audit:selftest"];
const FOUR = ["deck_lint", "home_pin", "probe", "study_scope"];
const HERMETIC_FOUR = ["deck_lint", "probe", "study_scope"];
const NAMED = [/^package\.json$/, /^scripts\/organism_test\.mjs$/, /^scripts\/(deck_lint|home_pin|probe|study_scope)\.mjs$/, /^ci\/mcov\//];
const NL = /\r?\n/;
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const childEnv = () => { const e = { ...process.env, ORGANISM_TEST_PROFILE: "hermetic" }; delete e.NODE_OPTIONS; return e; };

/** clone org's HEAD into `into` with core.autocrlf=false and link a node_modules @returns {string} the clone dir */
export function plantClone(org, into, fallbackModules = null) {
  const dir = join(into, "tree");
  execFileSync("git", ["-c", "core.autocrlf=false", "clone", "-q", "-c", "core.autocrlf=false", resolve(org), dir], { stdio: ["ignore", "pipe", "pipe"] });
  const mods = [join(resolve(org), "node_modules"), fallbackModules].find((p) => p && existsSync(p));
  if (mods) symlinkSync(realpathSync(mods), join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return dir;
}

const node = (dir, args) => { const r = spawnSync(process.execPath, args, { cwd: dir, env: childEnv(), encoding: "utf8", windowsHide: true, maxBuffer: 1 << 28 }); return { code: r.status, out: (r.stdout || "") + (r.stderr || "") }; };

/** judge every clause on one planted tree @returns {Record<string, {green: boolean, why: string}>} */
export function judge(dir) {
  const v = {};
  const cov = node(dir, [join("scripts", "organism_test.mjs"), "coverage"]);
  const covOk = /^ {2}ok {3}EVERY organ with a selftest is wired into a suite/m.test(cov.out);
  const orphan = cov.out.split(NL).find((l) => /orphaned:/.test(l));
  v["C1 COVERAGE"] = { green: covOk && !orphan, why: orphan ? orphan.trim() : covOk ? "wired, no orphan" : "coverage assert line absent" };
  const su = node(dir, [join("scripts", "organism_test.mjs"), "suites"]);
  const missing = HERMETIC_FOUR.filter((o) => !new RegExp(`^ {2}ok {3}SUITE MEMBER · ${o} selftest exits 0$`, "m").test(su.out));
  v["C2 HERMETIC"] = { green: missing.length === 0, why: missing.length ? `not judged green: ${missing.join(", ")}` : `${HERMETIC_FOUR.join(", ")} judged ok` };
  const liveLine = /^ {2}LIVE selftest home_pin — not run/m.test(su.out), judged = /SUITE MEMBER · home_pin /.test(su.out);
  v["C3 LIVE-NAMED"] = { green: liveLine && !judged, why: judged ? "home_pin judged as a hermetic member" : liveLine ? "home_pin named LIVE" : "home_pin neither named nor run" };
  const ss = node(dir, [join("scripts", "study_scope.mjs"), "selftest"]);
  const last = ss.out.split(NL).filter(Boolean).pop() || "";
  const m = /^study_scope selftest: (\d+) passed, 0 failed$/.exec(last);
  v["C5 ONE RECORD"] = oneRecord(dir);
  v["C4 VERB"] = { green: ss.code === 0 && !!m && Number(m[1]) > 0, why: `exit ${ss.code} · last line: ${last.slice(0, 140)}` };
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

/** paths whose index blob differs between two orgs @returns {string[]} */
function differing(a, b) {
  const blobs = (d) => new Map(git(d, ["-c", "core.quotepath=false", "ls-files", "-s"]).split(NL).filter(Boolean).map((l) => { const [meta, p] = l.split("\t"); return [p, meta.split(" ")[1]]; }));
  const A = blobs(a), B = blobs(b);
  return [...new Set([...A.keys(), ...B.keys()])].filter((p) => A.get(p) !== B.get(p)).sort();
}

function main() {
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
    const buildMods = existsSync(join(resolve(org), "node_modules")) ? join(resolve(org), "node_modules") : null;
    const vb = judge(plantClone(base, mkdtempSync(join(root, "base-")), buildMods));
    const vh = judge(plantClone(org, mkdtempSync(join(root, "build-"))));
    for (const c of CLAUSES) {
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
  console.log(`GREEN MCOV the four coverage orphans wired in package.json, each in its profile · ${CLAUSES.length} clause(s)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
