#!/usr/bin/env node
// ============================================================================
// ci/mdtl/witness_mdtl.mjs — UNIT mdtl (forks rows 1167 (2) / 1186): A RED WITNESS LEAVES ITS FAILING CLAUSE READABLE,
// FROM PUBLIC BYTES ONLY (shape A + R2; spec ci/mdtl/MDTL_SPEC.md on claude/mdtl-spec 9d5c9b8).
// CONTRACT:  node ci/mdtl/witness_mdtl.mjs --org <tree> --base-org <tree>
//   Each tree's scripts/, .github/ and package.json are COPIED under os.tmpdir() and made a git repo (core.autocrlf=false);
//   the copy's ci/ holds ONLY toy witnesses this file plants. In each copy the tree's OWN member runs
//   (`node scripts/organism_test.mjs witnesses`, GITHUB_ACTIONS=true · GITHUB_WORKSPACE=<copy> · ORGANISM_TEST_PROFILE=hermetic
//   planted in the child env only), then the copy's OWN `scripts/ci_verdict.mjs compare` against a planted all-green base
//   output, then the copy's OWN readVerdict on a PLANTED fetch built from those annotations. No network, no model call.
//   A planted "state file" (written by node under <tmp>/planted/dressing-room/state/) holds a random canary.
//   LEAVING = the member lines the --org tree's own suite.yml grep selects (the regex is read from the file) ∪ every line
//   compare prints (the annotations and the B1_VERDICT line) ∪ the reader's line.
//   D1 CAUSE      toy A (header claim `P1 · the planted clause claims one thing`, last line `RED TOY · P1`) is red, and its
//                 NEW RED annotation AND the reader line both carry `P1 · the planted clause claims one thing`.
//   D2 NO-LEAK    toy B reads the planted state file and prints the canary in its why, on stderr and as a clause id
//                 `Q<CANARY>`: the canary is in ZERO leaving lines, AND a `WITHHELD · …` cause IS readable for toy B.
//   D3 RULED      every toy's judged FAIL name and detail line, and its machine-line `unruled` entry, are byte-identical
//                 between the --base-org copy and the --org copy (a KNOWN_RED entry keeps its match). A guard: GREEN at base.
//   D4 GREEN-SILENT an all-green toy run's compare output is byte-identical between the two trees. A guard: GREEN at base.
//   D5 SECOND-CHECK a head output whose machine line carries a FORGED cause (a planted text in no source, no literal) is
//                 re-written by compare to WITHHELD: the forged text is in no leaving line and a WITHHELD cause is readable.
//   BOUND outside ci/, only scripts/witness_cause.mjs (new, present in --org), scripts/organism_test.mjs,
//         scripts/ci_verdict.mjs and package.json differ (by text, CRLF folded) — package.json by row 1186 F6 A.
//   LAST  no node process naming this run's temp dir survives.
// THE PORT CLASS (row 1053): nothing here binds a port, names a live service or POSTs; the member's own port doors are
// OS-picked. Every wait is bounded by the --org tree's own suite.yml timeout-minutes (read, never typed).
// LAST LINE: GREEN MDTL <what> · <n> clause(s) (exit 0) | RED MDTL · <clauses> (exit 1)
// Portable: no POSIX-only shell; every read is split on /\r?\n/; every git repo is made with core.autocrlf=false.
// ============================================================================
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, cpSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";

const T0 = Date.now();
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("RED MDTL · USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const TMP = mkdtempSync(join(tmpdir(), "mdtl-"));
const reds = [], greens = [];
const clause = (id, ok, line) => { (ok ? greens : reds).push(id); console.log(`${ok ? "GREEN" : "RED  "} ${id} · ${line}`); };
const lines = (s) => String(s).split(/\r?\n/);

// ── the bound: the --org tree's own job timeout-minutes (read, never typed) ──
const wf = (() => { try { return readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec(wf) || [])[1]);
const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());
// the log channel: the grep the head step applies, read from the --org tree's own suite.yml
const grepRe = (() => { const m = /grep -E "([^"]+)" "\$RUNNER_TEMP\/b1_head\.txt"/.exec(wf); try { return m ? new RegExp(m[1]) : null; } catch { return null; } })();
if (!(jobMin > 0) || !grepRe) {
  console.log(`RED   SETUP · the --org tree's suite.yml names ${jobMin > 0 ? "no head grep" : "no timeout-minutes"}`);
  try { rmSync(TMP, { recursive: true, force: true }); } catch { }
  console.log("RED MDTL · SETUP"); process.exit(1);
}

// ── the planted secrets: a canary in a planted state file, and a forged cause text ──
const HEX = randomBytes(8).toString("hex").toUpperCase();
const FORGED = `forged cause ${randomBytes(8).toString("hex")}`;
const stateDir = join(TMP, "planted", "dressing-room", "state");
mkdirSync(stateDir, { recursive: true });
const CANARY_FILE = join(stateDir, "canary.json");
writeFileSync(CANARY_FILE, JSON.stringify({ canary: HEX }));

const CLAIM = "the planted clause claims one thing";
const TOYS = {
  toy: [
    "#!/usr/bin/env node",
    "// CONTRACT: node ci/toy/witness_toy.mjs --org <tree> --base-org <tree> (a toy planted by unit mdtl's witness)",
    `//   P1 · ${CLAIM}`,
    "//   P2 · the planted clause that stays green",
    "//   BOUND a planted toy bounds nothing",
    "import process from \"node:process\";",
    "const clause = (id, ok, why) => console.log(`${ok ? \"GREEN\" : \"RED  \"} ${id} · ${why}`);",
    "clause(\"P1\", false, \"planted red\");",
    "clause(\"P2\", true, \"planted green\");",
    "console.log(\"RED TOY · P1\");",
    "process.exit(1);",
  ].join("\n"),
  toyb: [
    "#!/usr/bin/env node",
    "// CONTRACT: node ci/toyb/witness_toyb.mjs --org <tree> --base-org <tree> (a toy planted by unit mdtl's witness)",
    "//   P1 · toy B's one claim, which it never names",
    "//   BOUND a planted toy bounds nothing",
    "import { readFileSync } from \"node:fs\";",
    "const c = JSON.parse(readFileSync(String(process.env.MDTL_CANARY_FILE), \"utf8\")).canary;",
    "console.log(`RED   Q${c} · threw: ${c}`);",
    "console.error(c);",
    "console.log(`RED TOYB · Q${c}`);",
    "process.exit(1);",
  ].join("\n"),
  toyg: [
    "#!/usr/bin/env node",
    "// CONTRACT: node ci/toyg/witness_toyg.mjs --org <tree> --base-org <tree> (a toy planted by unit mdtl's witness)",
    "//   G1 · the planted toy is green",
    "//   BOUND a planted toy bounds nothing",
    "import process from \"node:process\";",
    "console.log(\"GREEN G1 · planted green\");",
    "console.log(\"GREEN TOYG the planted toy is green · 1 clause(s)\");",
    "process.exit(0);",
  ].join("\n"),
};

const git = (cwd, args) => spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-c", "user.name=witness", "-c", "user.email=witness@localhost", "-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8", windowsHide: true, timeout: left() });

/** a git copy of <tree>'s scripts/, .github/, package.json, with the named toys planted under ci/ (each with a BASE) */
function plantRepo(tree, into, toys) {
  mkdirSync(into, { recursive: true });
  for (const p of ["scripts", ".github", "package.json"]) if (existsSync(join(tree, p))) cpSync(join(tree, p), join(into, p), { recursive: true, filter: (s) => !/[\\/]node_modules([\\/]|$)/.test(s) });
  for (const t of toys) { mkdirSync(join(into, "ci", t), { recursive: true }); writeFileSync(join(into, "ci", t, `witness_${t}.mjs`), TOYS[t]); }
  const e = [git(into, ["init", "-q"]), git(into, ["add", "-A"]), git(into, ["commit", "-q", "-m", "planted"])].find((r) => r.status !== 0);
  if (e) return `git: ${String(e.stderr || e.error || "").trim().split(/\r?\n/)[0]}`;
  const sha = String(git(into, ["rev-parse", "HEAD"]).stdout || "").trim();
  for (const t of toys) writeFileSync(join(into, "ci", t, "BASE"), `${sha}\n`);
  const e2 = [git(into, ["add", "-A"]), git(into, ["commit", "-q", "-m", "planted BASE"])].find((r) => r.status !== 0);
  return e2 ? `git: ${String(e2.stderr || "").trim().split(/\r?\n/)[0]}` : null;
}

/** the copy's own member, then its own compare against a planted all-green base */
function member(repo) {
  const env = { ...process.env, GITHUB_ACTIONS: "true", GITHUB_WORKSPACE: repo, ORGANISM_TEST_PROFILE: "hermetic", MDTL_CANARY_FILE: CANARY_FILE };
  const r = spawnSync(process.execPath, [join("scripts", "organism_test.mjs"), "witnesses"], { cwd: repo, env, encoding: "utf8", windowsHide: true, timeout: left() });
  return `${r.stdout || ""}${r.stderr || ""}`;
}
const PLANTED_BASE = `ORGANISM_TEST_VERDICT ${JSON.stringify({ modes: ["witnesses"], pass: 1, fail: 0, exit: 0, reds: [], live: [], profile: "hermetic" })}\norganism_test: 1 passed, 0 failed\n`;
function compare(repo, headOut, tag) {
  const h = join(TMP, `${tag}.head.txt`), b = join(TMP, `${tag}.base.txt`);
  writeFileSync(h, headOut); writeFileSync(b, PLANTED_BASE);
  const r = spawnSync(process.execPath, [join("scripts", "ci_verdict.mjs"), "compare", "--head", h, "--base", b, "--label", "node toy", "--head-sha", "a".repeat(40), "--base-sha", "b".repeat(40)],
    { cwd: repo, encoding: "utf8", windowsHide: true, timeout: left() });
  return String(r.stdout || "");
}
const unesc = (s) => String(s).replace(/%0A/g, "\n").replace(/%0D/g, "\r").replace(/%3A/g, ":").replace(/%2C/g, ",").replace(/%25/g, "%");
/** the copy's own reader, on a planted fetch whose two legs carry these annotations */
async function reader(repo, cmpOut) {
  const anns = lines(cmpOut).map((l) => /^::(\w+) title=([^:]*)::(.*)$/.exec(l)).filter(Boolean).map((m) => ({ annotation_level: m[1], title: unesc(m[2]), message: unesc(m[3]) }));
  const runs = { check_runs: [{ id: 1, name: "npm test · node 22", status: "completed", conclusion: "failure" }, { id: 2, name: "npm test · node 24", status: "completed", conclusion: "failure" }] };
  try {
    const mod = await import(pathToFileURL(join(repo, "scripts", "ci_verdict.mjs")).href);
    const r = await mod.readVerdict("e".repeat(40), "planted/planted", async (p) => (p.includes("/annotations") ? anns : runs));
    return String(r.line);
  } catch (e) { return `reader threw: ${e instanceof Error ? e.message : String(e)}`; }
}
const leaving = (memberOut, cmpOut, readLine) => [...lines(memberOut).filter((l) => grepRe.test(l)), ...lines(cmpOut), readLine];
const judged = (out) => {
  const L = lines(out), got = [];
  L.forEach((l, i) => { if (/^ {2}FAIL WITNESS ‹/.test(l)) got.push(l, L[i + 1] || ""); });
  const m = L.find((l) => l.startsWith("ORGANISM_TEST_VERDICT "));
  let unruled = null;
  try { unruled = m ? JSON.parse(m.slice("ORGANISM_TEST_VERDICT ".length)).unruled.filter((u) => /^WITNESS ‹/.test(u.assert)) : null; } catch { unruled = null; }
  return JSON.stringify({ got, unruled });
};
const newRedOf = (cmpOut, unit) => lines(cmpOut).find((l) => l.startsWith("::error title=NEW RED") && l.includes(`WITNESS ‹${unit}›`)) || "";

// ── run both trees ──
const side = {};
for (const [k, tree] of [["org", ORG], ["base", BASE]]) {
  const red = join(TMP, k, "red"), green = join(TMP, k, "green");
  const e = plantRepo(tree, red, ["toy", "toyb"]) || plantRepo(tree, green, ["toyg"]);
  if (e) { side[k] = { err: e }; continue; }
  const out = member(red), cmp = compare(red, out, `${k}-red`), rd = await reader(red, cmp);
  const gOut = member(green), gCmp = compare(green, gOut, `${k}-green`);
  // D5's plant: the head output with its machine line's causes replaced by ONE forged entry
  const forgedOut = lines(out).map((l) => {
    if (!l.startsWith("ORGANISM_TEST_VERDICT ")) return l;
    try { const j = JSON.parse(l.slice("ORGANISM_TEST_VERDICT ".length)); j.causes = [`WITNESS ‹toy› · GREEN at head against its BASE · P1 · ${FORGED}`]; return `ORGANISM_TEST_VERDICT ${JSON.stringify(j)}`; } catch { return l; }
  }).join("\n");
  const fCmp = compare(red, forgedOut, `${k}-forged`), fRd = await reader(red, fCmp);
  side[k] = { out, cmp, rd, gOut, gCmp, fCmp, fRd };
}
const O = side.org, B = side.base;
const bad = O.err || B.err;
if (bad) clause("SETUP", false, `a copy could not be planted: ${bad}`);
else {
  // D1
  const ann = newRedOf(O.cmp, "toy");
  const inAnn = ann.includes(esc(`cause · P1 · ${CLAIM}`)), inRead = O.rd.includes(`P1 · ${CLAIM}`);
  clause("D1", inAnn && inRead, `toy A ${ann ? "is a NEW RED" : "is NOT a new red"} · its annotation names P1's claim ${inAnn} · the reader names it ${inRead}`);
  // D2
  const L2 = leaving(O.out, O.cmp, O.rd);
  const hits = L2.filter((l) => l.includes(HEX)).length;
  const onRunner = lines(O.out).filter((l) => l.includes(HEX)).length;   // the plant is real: the canary DID reach the runner
  const wB = newRedOf(O.cmp, "toyb").includes(esc("cause · WITHHELD · ")) && O.rd.includes("WITNESS ‹toyb› · GREEN at head against its BASE — cause: WITHHELD · ");
  clause("D2", onRunner > 0 && hits === 0 && wB, `${onRunner} runner line(s) carry the canary · ${L2.length} leaving line(s) · ${hits} naming it · toy B's WITHHELD cause readable ${wB}`);
  // D3
  const jo = judged(O.out), jb = judged(B.out);
  const any = JSON.parse(jo).got.length > 0;
  clause("D3", any && jo === jb, `toy FAIL names + detail lines + unruled entries ${jo === jb ? "byte-identical" : "DIFFER"} between the trees (${JSON.parse(jo).got.length / 2} judged red(s))`);
  // D4
  const g = O.gCmp === B.gCmp && /B1_VERDICT node toy GREEN/.test(O.gCmp);
  clause("D4", g, `an all-green toy run's compare output ${O.gCmp === B.gCmp ? "is byte-identical" : "DIFFERS"} between the trees · GREEN ${/B1_VERDICT node toy GREEN/.test(O.gCmp)}`);
  // D5
  const L5 = leaving(O.out, O.fCmp, O.fRd);
  const fh = L5.filter((l) => l.includes(FORGED)).length;
  const w5 = newRedOf(O.fCmp, "toy").includes(esc("cause · WITHHELD · ")) && O.fRd.includes("— cause: WITHHELD · ");
  clause("D5", fh === 0 && w5, `a forged cause: ${fh} leaving line(s) name its text · re-written to WITHHELD and readable ${w5}`);
}
function esc(s) { return String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A"); }

// ── BOUND: outside ci/, only the named files differ (by text, CRLF folded) ──
const ALLOWED = ["scripts/witness_cause.mjs", "scripts/organism_test.mjs", "scripts/ci_verdict.mjs", "package.json"];
function walk(root, dir = root, out = new Map()) {
  for (const n of readdirSync(dir)) {
    if (n === ".git" || n === "node_modules") continue;
    const p = join(dir, n), rel = relative(root, p).split("\\").join("/");
    if (rel === "ci" || rel.startsWith("ci/")) continue;
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(root, p, out);
    else if (st.isFile()) out.set(rel, p);
  }
  return out;
}
const wo = walk(ORG), wb = walk(BASE);
const differ = [...new Set([...wo.keys(), ...wb.keys()])].filter((f) => {
  const a = wo.get(f), b = wb.get(f);
  if (!a || !b) return true;
  return readFileSync(a, "utf8").replace(/\r\n/g, "\n") !== readFileSync(b, "utf8").replace(/\r\n/g, "\n");
}).sort();
const beyond = differ.filter((f) => !ALLOWED.includes(f));
const hasMod = wo.has("scripts/witness_cause.mjs");
clause("BOUND", beyond.length === 0 && hasMod, `${differ.length} file(s) differ outside ci/${differ.length ? `: ${differ.join(" ")}` : ""} · beyond the named ${beyond.length} · scripts/witness_cause.mjs in --org ${hasMod}`);

// ── LAST: no node process naming this run's temp dir survives ──
function naming(dir) {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true, timeout: left() });
    return lines(r.stdout || "").filter((l) => l.toLowerCase().includes(dir.toLowerCase())).map((l) => Number(l.trim().split(" ")[0])).filter((p) => p && p !== process.pid);
  }
  const out = [];
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(dir)) out.push(Number(p)); } catch { }
  }
  if (!existsSync("/proc")) {
    const r = spawnSync("ps", ["-eo", "pid=,args="], { encoding: "utf8", timeout: left() });
    for (const l of lines(r.stdout || "")) { const m = /^\s*(\d+)\s+(.*)$/.exec(l); if (m && m[2].includes(dir) && Number(m[1]) !== process.pid && !/^ps /.test(m[2])) out.push(Number(m[1])); }
  }
  return out;
}
const alive = naming(TMP);
clause("LAST", alive.length === 0, `${alive.length} node process(es) naming this run's temp dir`);
for (const p of alive) { try { process.kill(p); } catch { } }
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
if (reds.length) { console.log(`RED MDTL · ${reds.join(" ")}`); process.exit(1); }
console.log(`GREEN MDTL a red witness leaves its failing clause readable, from public bytes only · ${greens.length} clause(s)`);
process.exit(0);
