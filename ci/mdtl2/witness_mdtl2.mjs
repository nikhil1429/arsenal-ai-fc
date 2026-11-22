#!/usr/bin/env node
// ============================================================================
// ci/mdtl2/witness_mdtl2.mjs — UNIT mdtl2 (forks rows 1186 (2) F7 A / 1207 (1) / 1220): EVERY NO-CAUSE RED THAT IS NOT A
// WITNESS RED LEAVES ITS CAUSE, FROM PUBLIC BYTES ONLY (spec ci/mdtl2/MDTL2_SPEC.md on claude/mdtl2-spec d39e060).
// CONTRACT:  node ci/mdtl2/witness_mdtl2.mjs --org <tree> --base-org <tree>
//   Each tree's scripts/, .github/ and package.json are COPIED under os.tmpdir() and made a git repo (core.autocrlf=false); the
//   copy's package.json suites name ONLY the toy members this file plants, and its ci/ holds only planted toy witnesses. A
//   node_modules (the --org tree's, else the --base-org tree's) is LINKED into each copy, never copied, and unlinked before the
//   copy is removed. In each copy the tree's OWN `scripts/organism_test.mjs <mode>` runs (GITHUB_ACTIONS=true ·
//   GITHUB_WORKSPACE=<copy> · ORGANISM_TEST_PROFILE=hermetic in the child env only), then the copy's OWN
//   `scripts/ci_verdict.mjs compare` against a planted all-green base output, then the copy's OWN readVerdict on a PLANTED
//   fetch. No network, no model call. A planted "state file" (written by node under <tmp>/planted/dressing-room/state/) holds
//   a hex canary and a numeric canary; it reaches a toy through the env door MDTL2_CANARY_FILE only.
//   LEAVING = the member lines the --org tree's own suite.yml grep selects (the regex is read from the file) ∪ every line
//   compare prints (the annotations and the B1_VERDICT line) ∪ the reader's line, over every run below.
//   E1  MEMBER      toy_member's NEW RED message and its reader line read `exit 1 · FAIL the toy member planted check fails on
//                   purpose · and 2 more` (F2 B: the first failing check, as a literal of its own source, and a count).
//   E2  NO-LEAK     the hex canary, the numeric canary and the word salad are in 0 leaving lines (the canary DID reach the
//                   runner), AND toy_canary's WITHHELD cause and toy_salad's skeleton `the toy check read …` are readable.
//   E3  ROLLUP      the roll-up's cause names `toy_member · exit 1` and none of its raw tail (F9 A).
//   E4  PATH        the coverage orphan plant: the tracked orphan `toy_orphan` is readable in the cause, and the untracked
//                   scripts/c<canary>.mjs is in no leaving line (F5 A).
//   E5  THROW       package.json opens with a canary, so `coverage` throws: `SyntaxError · scripts/organism_test.mjs:<n>` is
//                   readable, and no canary prefix of 2 or more characters leaves.
//   E6  CLAUSE      a toy clause witness: `P1 RED · 0/1 plant(s) · <its claim>` is readable, and `Q<canary>` is WITHHELD.
//   E7  HEADLESS    a head output with no machine line: a forged last section `── <canary>` reads `(head)` WITHHELD in the
//                   payload (the canary in no leaving line); a head cut before its machine line reads its literal section.
//   E8  READER      a planted leg with no verdict annotation: the reader prints `step npm test · hermetic · head · failure` in
//                   ONE more call (4), and `step (unnamed) · failure` for a canary step name (F6 A).
//   E9  SECOND-CHECK every red of every run, its machine-line cause replaced by a FORGED one of the right grammar: compare
//                   re-writes each to red_cause's WITHHELD literal, and the forged bytes are in no leaving line.
//   E10 RULED       every toy FAIL name, its detail line and its machine-line `unruled` entry are byte-identical between the
//                   two trees, in the suites and the clauses runs (a KNOWN_RED entry keeps its match). A guard: GREEN at base.
//   E11 GREEN-SILENT an all-green toy run's compare output is byte-identical between the two trees. A guard.
//   E12 MDTL-INTACT mdtl's own D1 plant (a `WITNESS ‹toy›` red with `P1 · …`) reads byte-identical on both trees. A guard.
//   BOUND outside ci/, only scripts/red_cause.mjs (new, present in --org), scripts/organism_test.mjs, scripts/ci_verdict.mjs
//         and package.json differ (by text, CRLF folded).
//   LAST  no node process naming this run's temp dir survives.
//   SETUP the --org tree's suite.yml names its timeout-minutes and its head grep, a node_modules with acorn is found, and
//         every copy is planted (else RED).
// THE PORT CLASS (row 1053): nothing here binds a port, names a live service, POSTs or restarts anything; the member's own port
// doors are OS-picked. Every wait is bounded by the --org tree's own suite.yml timeout-minutes (read, never typed).
// LAST LINE: GREEN MDTL2 <what> · <n> clause(s) (exit 0) | RED MDTL2 · <clauses> (exit 1)
// Portable: no POSIX-only shell; every read is split on /\r?\n/; every git repo is made with core.autocrlf=false.
// ============================================================================
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, cpSync, mkdirSync, existsSync, symlinkSync, unlinkSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { randomBytes, randomInt } from "node:crypto";
import { pathToFileURL } from "node:url";

const T0 = Date.now();
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("RED MDTL2 · USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const TMP = mkdtempSync(join(tmpdir(), "mdtl2-"));
const reds = [], greens = [];
const clause = (id, ok, line) => { (ok ? greens : reds).push(id); console.log(`${ok ? "GREEN" : "RED  "} ${id} · ${line}`); };
const lines = (s) => String(s).split(/\r?\n/);
const esc = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const unesc = (s) => String(s).replace(/%0A/g, "\n").replace(/%0D/g, "\r").replace(/%3A/g, ":").replace(/%2C/g, ",").replace(/%25/g, "%");

// ── the bound and the log channel: the --org tree's own suite.yml (read, never typed) ──
const wf = (() => { try { return readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec(wf) || [])[1]);
const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());
const grepRe = (() => { const m = /grep -E "([^"]+)" "\$RUNNER_TEMP\/b1_head\.txt"/.exec(wf); try { return m ? new RegExp(m[1]) : null; } catch { return null; } })();
const NM = [join(ORG, "node_modules"), join(BASE, "node_modules"), join(process.cwd(), "node_modules")].find((p) => existsSync(join(p, "acorn")));
const fin = (code, last) => { try { rmSync(TMP, { recursive: true, force: true }); } catch { } console.log(last); process.exit(code); };
if (!(jobMin > 0) || !grepRe || !NM) {
  console.log(`RED   SETUP · ${!(jobMin > 0) ? "the --org suite.yml names no timeout-minutes" : !grepRe ? "the --org suite.yml names no head grep" : "no node_modules with acorn beside either tree"}`);
  fin(1, "RED MDTL2 · SETUP");
}

// ── the planted secrets ──
const HEX = randomBytes(8).toString("hex").toUpperCase();
const NUM = String(randomInt(100000, 999999)) + String(randomInt(100000, 999999));
const ORPHAN = `c${randomBytes(8).toString("hex")}`;
const THROWN = `ZQXJ${randomBytes(6).toString("hex").toUpperCase()}`;
const FHEX = randomBytes(8).toString("hex");
const WORDS = ["member", "planted", "selftest", "verdict", "suite", "witness", "toy", "exits"];
const SALAD = WORDS.map((w) => [randomInt(1 << 30), w]).sort((a, b) => a[0] - b[0]).map((x) => x[1]).join(" ") + ` ${FHEX.slice(0, 4)}`;
const stateDir = join(TMP, "planted", "dressing-room", "state");
mkdirSync(stateDir, { recursive: true });
const CANARY_FILE = join(stateDir, "canary.json");
writeFileSync(CANARY_FILE, JSON.stringify({ canary: HEX, num: NUM, salad: SALAD }));

const LIT = "the toy member planted check fails on purpose";
const CLAIM = "the planted clause claims one thing";
const toyMember = (order) => [
  "#!/usr/bin/env node",
  "// a toy suite member planted by unit mdtl2's witness: it reads the planted state file through its env door",
  "import { readFileSync } from \"node:fs\";",
  "const s = JSON.parse(readFileSync(String(process.env.MDTL2_CANARY_FILE), \"utf8\"));",
  "const ok = (n, c) => console.log(`  ${c ? \"✓\" : \"✗\"} ${n}`);",
  "if (process.argv[2] === \"selftest\") {",
  "  ok(\"the toy member's passing check\", true);",
  ...order.map((k) => ({ lit: `  ok("${LIT}", false);`, canary: "  ok(`${s.canary} ${s.num}`, false);", salad: "  ok(`the toy check read ${s.salad}`, false);" })[k]),
  "  console.error(s.canary);",
  "  process.exit(1);",
  "}",
].join("\n");
const TOYG = ["#!/usr/bin/env node", "// a green toy member planted by unit mdtl2's witness", "if (process.argv[2] === \"selftest\") console.log(\"  ✓ the green toy passes\");"].join("\n");
const ORPHAN_SRC = ["#!/usr/bin/env node", "// an unwired toy organ with a selftest (unit mdtl2's coverage plant)", "if (process.argv[2] === \"selftest\") console.log(\"ok\");"].join("\n");
const TOYC = [
  "#!/usr/bin/env node",
  "// CONTRACT: node ci/witness/toyc/witness_toyc.mjs plants (a toy clause witness planted by unit mdtl2's witness)",
  `//   P1 · ${CLAIM}`,
  "//   BOUND a planted toy bounds nothing",
  "import { readFileSync } from \"node:fs\";",
  "const s = JSON.parse(readFileSync(String(process.env.MDTL2_CANARY_FILE), \"utf8\"));",
  "console.log(\"CLAUSE P1 RED · 0/1 plant(s)\");",
  "console.log(`CLAUSE Q${s.canary} RED · 0/1 plant(s)`);",
  "console.log(\"PLANTS toyc · 0 of 2 plant(s) as expected\");",
  "process.exit(1);",
].join("\n");
const TOYW = [   // mdtl's own D1 toy (ci/mdtl/witness_mdtl.mjs), for E12
  "#!/usr/bin/env node",
  "// CONTRACT: node ci/toy/witness_toy.mjs --org <tree> --base-org <tree> (a toy planted by unit mdtl2's witness, after mdtl's D1)",
  `//   P1 · ${CLAIM}`,
  "//   P2 · the planted clause that stays green",
  "//   BOUND a planted toy bounds nothing",
  "import process from \"node:process\";",
  "const clause = (id, ok, why) => console.log(`${ok ? \"GREEN\" : \"RED  \"} ${id} · ${why}`);",
  "clause(\"P1\", false, \"planted red\");",
  "clause(\"P2\", true, \"planted green\");",
  "console.log(\"RED TOY · P1\");",
  "process.exit(1);",
].join("\n");

const git = (cwd, args) => spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-c", "user.name=witness", "-c", "user.email=witness@localhost", "-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8", windowsHide: true, timeout: left() });
const linked = [];
/** a git copy of <tree>'s scripts/, .github/, package.json; <files> planted (path → text), the suites set to <members> */
function plantRepo(tree, into, { members, files = {}, pkgPrefix = "", untracked = {} }) {
  mkdirSync(into, { recursive: true });
  for (const p of ["scripts", ".github", "package.json"]) if (existsSync(join(tree, p))) cpSync(join(tree, p), join(into, p), { recursive: true, filter: (s) => !/[\\/]node_modules([\\/]|$)/.test(s) });
  const pkg = JSON.parse(readFileSync(join(into, "package.json"), "utf8"));
  // RE-CUT by unit mhot (forks row 1309 (1), MHOT-M2 = A, row 1204 (1)'s shape), an ADDED edit: ~~the suites set to <members> in
  // the package.json strings~~ → the members planted by THE TREE'S OWN DOOR. Where <tree> holds suite/members (the member roll,
  // unit mhot), the planted repo gets suite/members with exactly one member file per planted member (organism:selftest, argv
  // ["selftest"]), and the tree's own chain strings stand; where it does not, the strings as before. Never both.
  if (existsSync(join(tree, "suite", "members"))) {
    mkdirSync(join(into, "suite", "members"), { recursive: true });
    for (const m of members) writeFileSync(join(into, "suite", "members", `${m}.json`), JSON.stringify({ suite: "organism:selftest", argv: ["selftest"], live: null }) + "\n");
  } else for (const n of ["organism:selftest", "squad:selftest", "audit:selftest"]) pkg.scripts[n] = n === "organism:selftest" ? members.map((m) => `node scripts/${m}.mjs selftest`).join(" && ") : "";
  writeFileSync(join(into, "package.json"), pkgPrefix + JSON.stringify(pkg, null, 2));
  for (const [p, t] of Object.entries(files)) { mkdirSync(join(into, p, ".."), { recursive: true }); writeFileSync(join(into, p), t); }
  const e = [git(into, ["init", "-q"]), git(into, ["add", "-A"]), git(into, ["commit", "-q", "-m", "planted"])].find((r) => r.status !== 0);
  if (e) return `git: ${String(e.stderr || e.error || "").trim().split(/\r?\n/)[0]}`;
  if (files["ci/toy/witness_toy.mjs"]) {
    writeFileSync(join(into, "ci", "toy", "BASE"), `${String(git(into, ["rev-parse", "HEAD"]).stdout || "").trim()}\n`);
    const e2 = [git(into, ["add", "-A"]), git(into, ["commit", "-q", "-m", "planted BASE"])].find((r) => r.status !== 0);
    if (e2) return `git: ${String(e2.stderr || "").trim().split(/\r?\n/)[0]}`;
  }
  for (const [p, t] of Object.entries(untracked)) writeFileSync(join(into, p), t);   // never added: untracked at head
  symlinkSync(/** @type {string} */ (NM), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  linked.push(join(into, "node_modules"));
  return null;
}
/** the copy's own suite, one mode */
function member(repo, mode) {
  const env = { ...process.env, GITHUB_ACTIONS: "true", GITHUB_WORKSPACE: repo, ORGANISM_TEST_PROFILE: "hermetic", MDTL2_CANARY_FILE: CANARY_FILE };
  const r = spawnSync(process.execPath, [join("scripts", "organism_test.mjs"), mode], { cwd: repo, env, encoding: "utf8", windowsHide: true, timeout: left(), maxBuffer: 1 << 28 });
  return `${r.stdout || ""}${r.stderr || ""}`;
}
const PLANTED_BASE = `ORGANISM_TEST_VERDICT ${JSON.stringify({ modes: ["planted"], pass: 1, fail: 0, exit: 0, reds: [], live: [], profile: "hermetic" })}\norganism_test: 1 passed, 0 failed\n`;
let nth = 0;
function compare(repo, headOut) {
  const h = join(TMP, `c${++nth}.head.txt`), b = join(TMP, `c${nth}.base.txt`);
  writeFileSync(h, headOut); writeFileSync(b, PLANTED_BASE);
  const r = spawnSync(process.execPath, [join("scripts", "ci_verdict.mjs"), "compare", "--head", h, "--base", b, "--label", "node toy", "--head-sha", "a".repeat(40), "--base-sha", "b".repeat(40)],
    { cwd: repo, encoding: "utf8", windowsHide: true, timeout: left(), maxBuffer: 1 << 28 });
  return String(r.stdout || "");
}
const annsOf = (cmpOut) => lines(cmpOut).map((l) => /^::(\w+) title=([^:]*)::(.*)$/.exec(l)).filter(Boolean).map((m) => ({ annotation_level: m[1], title: unesc(m[2]), message: unesc(m[3]) }));
/** the copy's own reader on a planted fetch; <plan> maps a path fragment to its answer */
async function reader(repo, plan) {
  let calls = 0;
  try {
    const mod = await import(pathToFileURL(join(repo, "scripts", "ci_verdict.mjs")).href);
    const r = await mod.readVerdict("e".repeat(40), "planted/planted", async (p) => { calls++; for (const [k, v] of plan) if (p.includes(k)) return v; throw new Error("unplanted"); });
    return { line: String(r.line), calls };
  } catch (e) { return { line: `reader threw: ${e instanceof Error ? e.message : String(e)}`, calls }; }
}
const RUNS = { check_runs: [{ id: 1, name: "npm test · node 22", status: "completed", conclusion: "failure" }, { id: 2, name: "npm test · node 24", status: "completed", conclusion: "failure" }] };
const legsWith = (anns) => [["/check-runs?", RUNS], ["/annotations", anns]];
const grepOf = (out) => lines(out).filter((l) => grepRe.test(l));
const payloadOf = (cmpOut) => { const l = lines(cmpOut).find((x) => /^::\w+ title=B1 VERDICT/.test(x)) || ""; try { return JSON.parse(unesc(l.replace(/^::\w+ title=[^:]*::B1_VERDICT /, ""))); } catch { return {}; } };
const newRed = (cmpOut, re) => lines(cmpOut).filter((l) => l.startsWith("::error title=NEW RED") && re.test(unesc(l.replace(/^::error title=[^:]*::/, "")).split("\n")[0])).map((l) => unesc(l.replace(/^::error title=[^:]*::/, ""))).join("\n");
const machine = (out) => { const l = lines(out).find((x) => x.startsWith("ORGANISM_TEST_VERDICT ")); try { return l ? JSON.parse(l.slice("ORGANISM_TEST_VERDICT ".length)) : null; } catch { return null; } };
const WITHHELD = "WITHHELD · a cause that is not public bytes of its own tracked source was withheld";
const forgedFor = (red) => (/^SUITE MEMBER · /.test(red) ? `exit 1 · FAIL forged cause ${FHEX}` : /^all \d+ /.test(red) ? `f${FHEX} · exit 1` : /^MODE /.test(red) ? `SyntaxError · scripts/f${FHEX}.mjs:1`
  : /^CLAUSE WITNESS /.test(red) ? `P1 RED · 0/1 plant(s) · forged cause ${FHEX}` : `… f${FHEX} …`);
const forge = (out) => lines(out).map((l) => {
  if (!l.startsWith("ORGANISM_TEST_VERDICT ")) return l;
  const j = JSON.parse(l.slice("ORGANISM_TEST_VERDICT ".length));
  j.causes = j.reds.filter((r) => !/^WITNESS ‹/.test(r)).map((r) => `${r} · ${forgedFor(r)}`);
  return `ORGANISM_TEST_VERDICT ${JSON.stringify(j)}`;
}).join("\n");

// ── run both trees ──
const side = {};
for (const [k, tree] of [["org", ORG], ["base", BASE]]) {
  const red = join(TMP, k, "red"), thr = join(TMP, k, "throw"), green = join(TMP, k, "green");
  const e = plantRepo(tree, red, {
    members: ["toy_member", "toy_canary", "toy_salad"],
    files: { "scripts/toy_member.mjs": toyMember(["lit", "canary", "salad"]), "scripts/toy_canary.mjs": toyMember(["canary", "lit"]), "scripts/toy_salad.mjs": toyMember(["salad", "lit"]),
      "scripts/toy_orphan.mjs": ORPHAN_SRC, "ci/witness/toyc/witness_toyc.mjs": TOYC, "ci/toy/witness_toy.mjs": TOYW },
    untracked: { [`scripts/${ORPHAN}.mjs`]: ORPHAN_SRC },
  }) || plantRepo(tree, thr, { members: ["toy_member"], pkgPrefix: THROWN }) || plantRepo(tree, green, { members: ["toyg"], files: { "scripts/toyg.mjs": TOYG } });
  if (e) { side[k] = { err: e }; continue; }
  const S = {};
  for (const mode of ["suites", "coverage", "clauses", "witnesses"]) { const out = member(red, mode); S[mode] = { out, cmp: compare(red, out) }; }
  S.throw = { out: member(thr, "coverage") }; S.throw.cmp = compare(thr, S.throw.out);
  S.green = { out: member(green, "suites") }; S.green.cmp = compare(green, S.green.out);
  for (const m of ["suites", "coverage", "clauses", "throw"]) S[m].fCmp = compare(m === "throw" ? thr : red, forge(S[m].out));
  S.rd = await reader(red, legsWith(annsOf(S.suites.cmp)));
  // E7: a head with no machine line — a forged last section, and a head cut before its machine line
  const cut = S.suites.out.slice(0, Math.max(0, S.suites.out.indexOf("ORGANISM_TEST_VERDICT ")));
  S.h1 = compare(red, `── SUITES — every member\n── ${HEX} ──\nthe run died here\n`); S.h2 = compare(red, cut);
  // E8: a leg with no verdict annotation, its job's failed step planted
  const job = (name) => ({ steps: [{ name: "Set up job", conclusion: "success" }, { name, conclusion: "failure" }, { name: "Complete job", conclusion: "success" }] });
  const ann2 = annsOf(S.green.cmp);
  S.r8a = await reader(red, [["/check-runs?", RUNS], ["/check-runs/1/", []], ["/check-runs/2/", ann2], ["/actions/jobs/1", job("npm test · hermetic · head")]]);
  S.r8b = await reader(red, [["/check-runs?", RUNS], ["/check-runs/1/", []], ["/check-runs/2/", ann2], ["/actions/jobs/1", job(HEX)]]);
  side[k] = S;
}
const bad = side.org.err || side.base.err;
clause("SETUP", !bad, bad ? `a copy could not be planted: ${bad}` : `both trees planted · the bound (${jobMin} min) and the head grep read from the --org suite.yml · node_modules linked`);
if (!bad) {
  const O = side.org, B = side.base;
  const all = (S) => [...["suites", "coverage", "clauses", "witnesses", "throw", "green"].flatMap((m) => [...grepOf(S[m].out), ...lines(S[m].cmp), ...lines(S[m].fCmp || "")]),
    S.rd.line, ...lines(S.h1), ...lines(S.h2), S.r8a.line, S.r8b.line];
  const leaving = all(O);
  // E1
  const E1T = `exit 1 · FAIL ${LIT} · and 2 more`;
  const m1 = newRed(O.suites.cmp, /^SUITE MEMBER · toy_member selftest exits 0$/);
  const e1a = m1.includes(`\ncause · ${E1T}`), e1b = O.rd.line.includes(`SUITE MEMBER · toy_member selftest exits 0 — cause: ${E1T}`);
  clause("E1", e1a && e1b, `toy_member ${m1 ? "is a NEW RED" : "is NOT a new red"} · its NEW RED message reads the literal check ${e1a} · the reader line reads it ${e1b}`);
  // E2
  const onRunner = lines(O.suites.out).filter((l) => l.includes(HEX)).length;
  const hits = (s) => leaving.filter((l) => l.includes(s)).length;
  const wC = newRed(O.suites.cmp, /^SUITE MEMBER · toy_canary /).includes(`\ncause · exit 1 · ${WITHHELD} · and 1 more`);
  const sS = newRed(O.suites.cmp, /^SUITE MEMBER · toy_salad /).includes("\ncause · exit 1 · FAIL the toy check read … · and 1 more");
  clause("E2", onRunner > 0 && hits(HEX) === 0 && hits(NUM) === 0 && hits(SALAD) === 0 && wC && sS,
    `${onRunner} runner line(s) carry the canary · ${leaving.length} leaving line(s): hex ${hits(HEX)} · numeric ${hits(NUM)} · salad ${hits(SALAD)} · toy_canary WITHHELD readable ${wC} · toy_salad skeleton readable ${sS}`);
  // E3
  const m3 = newRed(O.suites.cmp, /^all \d+ hermetic suite members pass/);
  const e3 = m3.includes("\ncause · toy_member · exit 1") && !m3.includes(" | ");
  clause("E3", e3, `the roll-up ${m3 ? "is a NEW RED" : "is NOT a new red"} · its cause names toy_member · exit 1 and no tail ${e3}`);
  // E4
  const m4 = newRed(O.coverage.cmp, /^EVERY organ with a selftest is wired into a suite/);
  const e4 = /\ncause · [^\n]*\btoy_orphan\b/.test(m4) && hits(ORPHAN) === 0;
  clause("E4", e4, `the orphan red ${m4 ? "is a NEW RED" : "is NOT a new red"} · the tracked orphan readable ${/\ncause · [^\n]*\btoy_orphan\b/.test(m4)} · the untracked canary orphan in ${hits(ORPHAN)} leaving line(s)`);
  // E5
  const m5 = newRed(O.throw.cmp, /^MODE coverage · ran to its end/);
  const e5a = /\ncause · SyntaxError · scripts\/organism_test\.mjs:\d+(\n|$)/.test(m5), pre = hits(THROWN.slice(0, 2));
  clause("E5", e5a && pre === 0, `the throw ${m5 ? "is a NEW RED" : "is NOT a new red"} · SyntaxError · scripts/organism_test.mjs:<n> readable ${e5a} · a 2-character canary prefix in ${pre} leaving line(s)`);
  // E6
  const m6 = newRed(O.clauses.cmp, /^CLAUSE WITNESS · ci\/witness\/toyc\/witness_toyc\.mjs plants/);
  const e6 = m6.includes(`\ncause · P1 RED · 0/1 plant(s) · ${CLAIM}`) && m6.includes(`\ncause · ${WITHHELD}`) && !m6.includes(HEX);
  clause("E6", e6, `the clause witness ${m6 ? "is a NEW RED" : "is NOT a new red"} · P1 and its claim readable, Q<canary> WITHHELD ${e6}`);
  // E7
  const p1 = payloadOf(O.h1), p2 = payloadOf(O.h2);
  const e7 = JSON.stringify((p1.cause || {})["(head)"]) === JSON.stringify([WITHHELD]) && JSON.stringify((p2.cause || {})["(head)"]) === JSON.stringify(["last section · SUITES — every member run INDEPENDENTLY (one red never hides the rest)"]);
  clause("E7", e7, `a head with no machine line: forged section ${JSON.stringify((p1.cause || {})["(head)"] || null) === JSON.stringify([WITHHELD]) ? "WITHHELD" : "NOT withheld"} · the literal section ${JSON.stringify((p2.cause || {})["(head)"] || null)}`);
  // E8
  const e8 = O.r8a.line.includes("step npm test · hermetic · head · failure") && O.r8a.calls === 4 && O.r8b.line.includes("step (unnamed) · failure");
  clause("E8", e8, `the reader on a leg with no verdict: workflow step named ${O.r8a.line.includes("step npm test · hermetic · head · failure")} in ${O.r8a.calls} call(s) · a canary step (unnamed) ${O.r8b.line.includes("step (unnamed) · failure")}`);
  // E9
  const forgedReds = ["suites", "coverage", "clauses", "throw"].flatMap((m) => ((machine(O[m].out) || { reds: [] }).reds).filter((r) => !/^WITNESS ‹/.test(r)).map((r) => [m, r]));
  const rewritten = forgedReds.filter(([m, r]) => lines(O[m].fCmp).some((l) => l.startsWith("::error title=NEW RED") && unesc(l.replace(/^::error title=[^:]*::/, "")).startsWith(`${r}\ncause · ${WITHHELD}`))).length;
  const fh = hits(FHEX);
  clause("E9", forgedReds.length > 0 && rewritten === forgedReds.length && fh === 0, `${forgedReds.length} red(s) given a forged cause of the right grammar · ${rewritten} re-written to WITHHELD · the forged bytes in ${fh} leaving line(s)`);
  // E10
  const judged = (out) => {
    const L = lines(out), got = [];
    L.forEach((l, i) => { if (/^ {2}FAIL /.test(l)) got.push(l, /^ {9}/.test(L[i + 1] || "") ? L[i + 1] : ""); });
    const j = machine(out);
    return JSON.stringify({ got, unruled: j ? j.unruled : null, reds: j ? j.reds : null });
  };
  const j10 = ["suites", "clauses"].map((m) => [judged(O[m].out), judged(B[m].out)]);
  const e10 = j10.every(([a, b]) => a === b && JSON.parse(a).got.length > 0);
  clause("E10", e10, `toy FAIL names + detail lines + unruled entries ${e10 ? "byte-identical" : "DIFFER"} between the trees (suites, clauses: ${j10.map(([a]) => JSON.parse(a).got.length / 2).join(" + ")} judged red(s))`);
  // E11
  const e11 = O.green.cmp === B.green.cmp && /B1_VERDICT node toy GREEN/.test(O.green.cmp);
  clause("E11", e11, `an all-green toy run's compare output ${O.green.cmp === B.green.cmp ? "is byte-identical" : "DIFFERS"} between the trees · GREEN ${/B1_VERDICT node toy GREEN/.test(O.green.cmp)}`);
  // E12
  const w12 = (S) => newRed(S.witnesses.cmp, /^WITNESS ‹toy› · GREEN at head against its BASE$/);
  const e12 = w12(O) !== "" && w12(O) === w12(B) && w12(O).includes(`\ncause · P1 · ${CLAIM}`);
  clause("E12", e12, `mdtl's D1 plant ${w12(O) === w12(B) ? "reads byte-identical" : "DIFFERS"} on the two trees · P1's claim readable ${w12(O).includes(`\ncause · P1 · ${CLAIM}`)}`);
}

// ── BOUND: outside ci/, only the named files differ (by text, CRLF folded) ──
const ALLOWED = ["scripts/red_cause.mjs", "scripts/organism_test.mjs", "scripts/ci_verdict.mjs", "package.json"];
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
const hasMod = wo.has("scripts/red_cause.mjs");
clause("BOUND", beyond.length === 0 && hasMod, `${differ.length} file(s) differ outside ci/${differ.length ? `: ${differ.join(" ")}` : ""} · beyond the named ${beyond.length} · scripts/red_cause.mjs in --org ${hasMod}`);

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
for (const l of linked) { try { unlinkSync(l); } catch { } }
if (reds.length) fin(1, `RED MDTL2 · ${reds.join(" ")}`);
fin(0, `GREEN MDTL2 every no-cause red that is not a witness red leaves its cause, from public bytes only · ${greens.length} clause(s)`);
