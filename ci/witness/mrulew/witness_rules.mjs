#!/usr/bin/env node
// @ts-check
// ============================================================================
// ci/witness/mrulew/witness_rules.mjs · unit mrulew · clause C:rule-witnesses (MWIT spec 88bf69d, UNITS row 10;
// forks rows 1162 / 1163). A ci-only witness: it edits no organ, writes no state file, binds no port, calls no model.
//
// THE CONTRACT (this header is it):
//   node ci/witness/mrulew/witness_rules.mjs [--org <dir>]
//       THE CLAUSE READ (the receipt organ's witness command). Every teaching rule id the live state holds has a
//       witness in ci/witness/mrulew/rule_witness.json, that command parses by rung_receipt.mjs parseWitness, and it
//       is planted BOTH WAYS: `<cmd> --plant red` exits 1 and `<cmd> --plant clean` exits 0.
//       exit 0 HOLDS · 1 RED (a rule without a witness, an unparseable one, a one-way one, or no map at all)
//       · 2 UNREAD (the live rules file is absent or unreadable — on the cloud it is absent: never the seed, never green).
//       The rule ids are read through the OWNER's CLI (`teaching_contract.mjs list`, sole writer of
//       teaching_contract.json, scripts/teaching_contract.mjs:46); the file's path is read off the owner's own
//       `const STATE = join(ROOT, …)` line, never typed here. The owner's load() falls back to its seed when the file is
//       absent (:945-947), so the witness checks the file exists and parses first: a seed is not his rules.
//   node ci/witness/mrulew/witness_rules.mjs rule <id> --plant red|clean [--org <dir>]
//       ONE RULE's witness, run on a planted turn from the map's `plants.<id>`: the org tree's own pure checker
//       (teaching_audit.mjs auditTurn, or pictureFacts + pictureDrift for a plant that carries `blocks`, or
//       crackGapDrift for a plant that carries `crackRows` — unit mcrk2's crack-gap, forks row 1298 (1)) judges it. exit 1 when the checker names <id> (the rule reads RED), 0 when it does not, 2 when the
//       checker cannot be imported. A rule with no plant exits 1 (not witnessed). Without --plant: 2 (the real-day
//       verdict of a rule is teaching_audit's own lane, never this witness's).
//   node ci/witness/mrulew/witness_rules.mjs plants [--org <dir>]
//       THE PLANTS (unit mmeter's suite member runs this mode, row 1162 (2)): the clause read on planted trees under
//       os.tmpdir(), every case both ways. Exit 0 iff every case reads its expected exit.
//   node ci/witness/mrulew/witness_rules.mjs --org <dir> --base-org <dir>
//       THE BOTH-WAYS JUDGE: the clause on a planted tree of --org reads 0 and on one of --base-org reads 1, the
//       plants hold on --org, BOUND (only the named files differ BASE..HEAD, read in this repo's git) and LAST (no node
//       process naming the temp dir survives). Without --base-org the base tree is built from ci/mrulew/BASE.
//   Its LAST line: GREEN MRULEW <what> · <n> clause(s) (exit 0) or RED MRULEW · <clauses> (exit 1).
// Planted trees: a copy of <org>/scripts plus <org>/ci/witness/mrulew under one mkdtemp root, git init with
// core.autocrlf=false, the ci dir added (parseWitness reads git ls-files), the rules file written by this node script
// under that root only. Every child is bounded by rung_receipt.mjs WITNESS_TIMEOUT_MS (read from its owner).
// CRLF-proof: every read splits /\r?\n/; Windows-safe: no shell, process.execPath, junction for node_modules.
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, cpSync, readdirSync, symlinkSync, unlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const REL = ["ci", "witness", "mrulew"];
const SELF = [...REL, "witness_rules.mjs"].join("/");
const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const ORG = resolve(flag("--org") || join(HERE, "..", "..", ".."));
const mapPath = (org) => join(org, ...REL, "rule_witness.json");
const readJ = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return undefined; } };
const imp = async (org, f) => import(pathToFileURL(join(org, "scripts", f)).href);
const lastLine = (s) => String(s || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop() || "";

/** the owner's STATE path, read off its own source line (never typed) */
function statePath(org) {
  let src = "";
  try { src = readFileSync(join(org, "scripts", "teaching_contract.mjs"), "utf8"); } catch { return null; }
  const m = /^const STATE = join\(ROOT,((?:\s*"[^"]+",?)+)\);/m.exec(src);
  return m ? join(org, ...[...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])) : null;
}
/** rule ids through the owner's CLI `list` (read-only) */
function listIds(org, bound) {
  const r = spawnSync(process.execPath, [join(org, "scripts", "teaching_contract.mjs"), "list"], { cwd: org, encoding: "utf8", windowsHide: true, timeout: bound });
  if (r.status !== 0) return null;
  const lines = String(r.stdout).split(/\r?\n/);
  const n = Number((/· rules (\d+) ·/.exec(lines[0] || "") || [])[1]);
  const ids = lines.slice(1).map((l) => (/^ {2}(\S+)\s+hits=/.exec(l) || [])[1]).filter(Boolean);
  return Number.isFinite(n) && ids.length === n ? ids : null;
}

// ── THE CLAUSE ─────────────────────────────────────────────────────────────────────────────────────────────────
async function clause(org) {
  let rr;
  try { rr = await imp(org, "rung_receipt.mjs"); } catch (e) { return { exit: 2, line: `RULE-WITNESSES UNREAD · rung_receipt.mjs not importable (${String(e && e.message).slice(0, 80)})` }; }
  const bound = rr.WITNESS_TIMEOUT_MS;
  if (!(bound > 0)) return { exit: 2, line: "RULE-WITNESSES UNREAD · no WITNESS_TIMEOUT_MS from rung_receipt.mjs (an unbounded wait is refused)" };
  const sp = statePath(org);
  if (!sp) return { exit: 2, line: "RULE-WITNESSES UNREAD · the owner's STATE line is not readable in teaching_contract.mjs" };
  if (!existsSync(sp)) return { exit: 2, line: "RULE-WITNESSES UNREAD · the live teaching rules file is absent here (his laptop holds it; never the seed)" };
  const st = readJ(sp);
  if (!st || !Array.isArray(st.rules)) return { exit: 2, line: "RULE-WITNESSES UNREAD · the live teaching rules file does not parse" };
  const ids = listIds(org, bound);
  if (!ids || ids.length !== st.rules.length) return { exit: 2, line: "RULE-WITNESSES UNREAD · the owner's list did not read the file's rules" };
  const map = readJ(mapPath(org));
  const cmds = map && map.rules && typeof map.rules === "object" ? map.rules : null;
  if (!cmds) return { exit: 1, line: `RULE-WITNESSES RED · no rule witness map (${REL.join("/")}/rule_witness.json) · ${ids.length} rule(s) unwitnessed` };
  const bad = [];
  let unread = false;
  for (const id of ids) {
    const cmd = cmds[id];
    if (typeof cmd !== "string") { bad.push(`${id}(none)`); continue; }
    const p = rr.parseWitness(cmd);
    if (!p.ok) { bad.push(`${id}(unparsed)`); continue; }
    const run = (w) => spawnSync(process.execPath, [...p.argv, "--plant", w], { cwd: org, encoding: "utf8", windowsHide: true, timeout: bound }).status;
    const red = run("red"), clean = run("clean");
    if (red === 2 || clean === 2) unread = true;
    if (!(red === 1 && clean === 0)) bad.push(`${id}(red ${red} clean ${clean})`);
  }
  if (unread) return { exit: 2, line: `RULE-WITNESSES UNREAD · a rule's checker could not be read · ${bad.join(" ")}` };
  return bad.length
    ? { exit: 1, line: `RULE-WITNESSES RED · ${ids.length} rule(s) · ${ids.length - bad.length} witnessed both ways · not: ${bad.join(" ")}` }
    : { exit: 0, line: `RULE-WITNESSES HOLDS · ${ids.length} rule(s) · every one witnessed both ways` };
}

// ── ONE RULE ───────────────────────────────────────────────────────────────────────────────────────────────────
async function rule(org, id, which) {
  if (which !== "red" && which !== "clean") return { exit: 2, line: `RULE ${id} UNREAD · a rule witness runs on a plant only (--plant red|clean); its real-day verdict is teaching_audit's lane` };
  const map = readJ(mapPath(org));
  const plant = map && map.plants && map.plants[id] && map.plants[id][which];
  if (!plant || typeof plant !== "object") return { exit: 1, line: `RULE ${id} RED · no ${which} plant` };
  let ta;
  try { ta = await imp(org, "teaching_audit.mjs"); } catch (e) { return { exit: 2, line: `RULE ${id} UNREAD · teaching_audit.mjs not importable (${String(e && e.message).slice(0, 80)})` }; }
  let named;
  try {
    if (Array.isArray(plant.crackRows)) { const d = ta.crackGapDrift({ rows: plant.crackRows, sessionId: plant.sessionId, promptAt: plant.promptAt, turnId: plant.turnId || null }); named = !!d && d.rule === id; }
    else if (Array.isArray(plant.blocks)) { const d = ta.pictureDrift(ta.pictureFacts(plant.blocks, plant.lastMessage || "")); named = !!d && d.rule === id; }
    else {
      const { session = {}, ...rest } = plant;
      const res = ta.auditTurn({ ...rest, session: { concept: "plant-concept", step: 4, question_moments: {}, axes_done: [], ...session } });
      named = (res.drifts || []).some((d) => d.rule === id);
    }
  } catch (e) { return { exit: 2, line: `RULE ${id} UNREAD · the checker threw (${String(e && e.message).slice(0, 100)})` }; }
  return named ? { exit: 1, line: `RULE ${id} RED · the checker names it on the ${which} plant` } : { exit: 0, line: `RULE ${id} CLEAN · the checker does not name it on the ${which} plant` };
}

// ── THE PLANTS ─────────────────────────────────────────────────────────────────────────────────────────────────
const git = (cwd, args) => spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", ...args], { cwd, encoding: "utf8", windowsHide: true });
/** a planted tree: <src>/scripts + <src>/ci/witness/mrulew (if any) + the map edit + the rules file */
async function plantTree(root, name, src, { rules = null, raw = null, edit = null, extra = null } = {}) {
  const t = join(root, name);
  cpSync(join(src, "scripts"), join(t, "scripts"), { recursive: true });
  // the TRACKED registry the checker's coreAxes reads (registry.mjs REGISTRY_PATH, its owner's path, never typed) — read
  // from <src> and re-planted under the temp root (the MWIT planter's own method, spec §1)
  const reg = await registryRel(src);
  if (reg && existsSync(join(src, reg))) { mkdirSync(dirname(join(t, reg)), { recursive: true }); cpSync(join(src, reg), join(t, reg)); }
  if (existsSync(join(src, "node_modules"))) symlinkSync(join(src, "node_modules"), join(t, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const wd = join(src, ...REL);
  if (existsSync(wd)) cpSync(wd, join(t, ...REL), { recursive: true }); else mkdirSync(join(t, ...REL), { recursive: true });
  if (edit) { const m = readJ(mapPath(t)) || {}; edit(m); writeFileSync(mapPath(t), JSON.stringify(m, null, 2) + "\n"); }
  if (git(t, ["init", "-q"]).status !== 0) throw new Error("git init refused");
  git(t, ["config", "core.autocrlf", "false"]);
  git(t, ["add", "--", "ci"]);
  if (extra) extra(t);   // after the add: an untracked file stays untracked
  const sp = statePath(t);
  if (sp && (rules || raw !== null)) { mkdirSync(dirname(sp), { recursive: true }); writeFileSync(sp, raw !== null ? raw : JSON.stringify({ version: 1, rules: rules.map((id) => ({ id, line: `planted ${id}`, hits: 0, last_hit: null, born: null })) }, null, 2) + "\n"); }
  return t;
}
/** REGISTRY_PATH relative to its tree, read from <src>'s own registry.mjs in a child (its module path, env door unset) */
async function registryRel(src) {
  const env = { ...process.env }; delete env.ARSENAL_REGISTRY;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", `import(${JSON.stringify(pathToFileURL(join(src, "scripts", "registry.mjs")).href)}).then((m) => console.log(m.REGISTRY_PATH))`], { cwd: src, env, encoding: "utf8", windowsHide: true });
  const abs = lastLine(r.stdout);
  if (r.status !== 0 || !abs) return null;
  const rel = abs.startsWith(src) ? abs.slice(src.length).replace(/^[\\/]+/, "") : null;
  return rel || null;
}
const runClause = (t, bound) => { const r = spawnSync(process.execPath, [join(t, ...REL, "witness_rules.mjs"), "--org", t], { cwd: t, encoding: "utf8", windowsHide: true, timeout: bound }); return { exit: r.status, last: lastLine(r.stdout) }; };
const selfIn = (t) => join(t, ...REL, "witness_rules.mjs");

async function plants(org, root) {
  let rr;
  try { rr = await imp(org, "rung_receipt.mjs"); } catch { return { ok: false, unread: true, lines: ["PLANTS UNREAD · rung_receipt.mjs not importable"] }; }
  const bound = rr.WITNESS_TIMEOUT_MS;
  // the seed ids, from the OWNER's list on a tree with no rules file (its load() returns the seed there)
  const t0 = await plantTree(root, "seed", org);
  const seed = listIds(t0, bound);
  if (!seed || !seed.length) return { ok: false, unread: true, lines: ["PLANTS UNREAD · the owner's seed ids are not readable"] };
  const own = (t) => { cpSync(join(HERE, "witness_rules.mjs"), selfIn(t)); };   // the witness under judgement is THIS file
  const cases = [
    ["P-ALL", 0, { rules: seed }],
    ["P-UNMAPPED", 1, { rules: [...seed, "plant-unmapped"] }],
    ["P-NOSTATE", 2, {}],
    ["P-TORN", 2, { raw: "{" }],
    ["P-ONEWAY", 1, { rules: seed, edit: (m) => { m.plants[seed[0]].clean = m.plants[seed[0]].red; } }],
    ["P-UNTRACKED", 1, { rules: seed, edit: (m) => { m.rules[seed[0]] = `node ${REL.join("/")}/untracked.mjs rule ${seed[0]}`; }, extra: (t) => cpSync(selfIn(t), join(t, ...REL, "untracked.mjs")) }],
    ["P-NOMAP", 1, { rules: seed, extra: (t) => rmSync(mapPath(t), { force: true }) }],
  ];
  const lines = [], bad = [];
  for (const [id, want, o] of cases) {
    let r;
    try {
      const ex = o.extra;
      const t = await plantTree(root, id, org, { ...o, extra: (tt) => { own(tt); if (ex) ex(tt); } });
      r = runClause(t, bound);
    } catch (e) { r = { exit: null, last: `plant refused: ${String(e && e.message).slice(0, 80)}` }; }
    const ok = r.exit === want;
    if (!ok) bad.push(id);
    lines.push(`  ${ok ? "ok  " : "FAIL"} ${id} · want ${want} · got ${r.exit} · ${r.last}`);
  }
  return { ok: !bad.length, bad, lines, n: cases.length, seed: seed.length };
}

// ── BOUND · LAST · the base tree ───────────────────────────────────────────────────────────────────────────────
const CLAUSES = ["PLANTS", "RULE-WITNESSES", "BOUND", "LAST"];
const ALLOWED = [/^ci\/mrulew\//, /^ci\/witness\/mrulew\//, /^campaign-2026-09\/receipts_effort\/mrulew_00\.json$/];
function boundRead() {
  const repo = join(HERE, "..", "..", "..");
  const base = (() => { try { return readFileSync(join(repo, "ci", "mrulew", "BASE"), "utf8").trim(); } catch { return ""; } })();
  if (!/^[0-9a-f]{40}$/.test(base)) return { ok: false, why: "no ci/mrulew/BASE here" };
  const r = spawnSync("git", ["-C", repo, "diff", "--name-only", base, "HEAD"], { encoding: "utf8", windowsHide: true });
  if (r.status !== 0) return { ok: false, why: "BASE..HEAD not readable in git here" };
  const out = String(r.stdout).split(/\r?\n/).filter(Boolean).filter((f) => !ALLOWED.some((rx) => rx.test(f)));
  return { ok: !out.length, why: out.length ? `beyond the named files: ${out.join(" ")}` : "only the named files differ" };
}
function baseTree(root) {
  const repo = join(HERE, "..", "..", "..");
  const base = (() => { try { return readFileSync(join(repo, "ci", "mrulew", "BASE"), "utf8").trim(); } catch { return ""; } })();
  const into = join(root, "base-src");
  mkdirSync(into, { recursive: true });
  const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", repo, `--work-tree=${into}`, "checkout", "-q", base, "--", "scripts"],
    { encoding: "utf8", windowsHide: true, env: { ...process.env, GIT_INDEX_FILE: join(root, "base.index") } });
  if (r.status !== 0) return null;
  if (existsSync(join(repo, "node_modules"))) symlinkSync(join(repo, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return into;
}
function namingProcs(dir) {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.toLowerCase().includes(dir.toLowerCase())).map((l) => Number(l.trim().split(" ")[0])).filter((p) => p && p !== process.pid);
  }
  const out = [];
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(dir)) out.push(Number(p)); } catch {}
  }
  return out;
}
/** remove a temp root; the node_modules links first (never followed) */
function sweep(root) {
  const walk = (d, depth) => { if (depth > 2) return; for (const f of (() => { try { return readdirSync(d); } catch { return []; } })()) { const p = join(d, f); if (f === "node_modules") { try { unlinkSync(p); } catch {} } else walk(p, depth + 1); } };
  walk(root, 0);
  try { rmSync(root, { recursive: true, force: true }); } catch {}
}

// ── MAIN ───────────────────────────────────────────────────────────────────────────────────────────────────────
async function main() {
  if (argv[0] === "rule") { const r = await rule(ORG, argv[1], flag("--plant")); console.log(r.line); process.exit(r.exit); }
  const judge = argv.includes("--base-org") || argv[0] === "judge";
  if (argv[0] !== "plants" && !judge) { const r = await clause(ORG); console.log(r.line); process.exit(r.exit); }
  const root = mkdtempSync(join(tmpdir(), "mrulew-"));
  const reds = [];
  let what = "";
  try {
    const p = await plants(ORG, root);
    for (const l of p.lines) console.log(l);
    // unit mmeter's member (scripts/organism_test.mjs clauseWitnesses) reads this line: k of n plant cases as expected
    console.log(`PLANTS mrulew · ${(p.n || 0) - ((p.bad || []).length)} of ${p.n || 0} plant(s) as expected`);
    if (!judge) {
      console.log(p.ok ? `GREEN MRULEW plants · ${p.n} case(s) both ways · ${p.seed} seed rule(s) witnessed (exit 0)` : `RED MRULEW · PLANTS ${(p.bad || []).join(" ") || "UNREAD"}`);
      process.exitCode = p.ok ? 0 : 1;
      return;
    }
    if (!p.ok) reds.push("PLANTS");
    // the clause both ways: a seeded tree of --org reads 0, one of --base-org reads 1
    const bsrc = flag("--base-org") ? resolve(/** @type {string} */ (flag("--base-org"))) : baseTree(root);
    let rr;
    try { rr = await imp(ORG, "rung_receipt.mjs"); } catch { rr = null; }
    const bound = rr && rr.WITNESS_TIMEOUT_MS;
    const t0 = join(root, "seed");
    const seed = bound ? listIds(t0, bound) : null;
    if (!seed || !bsrc) reds.push("RULE-WITNESSES");
    else {
      const head = runClause(await plantTree(root, "J-HEAD", ORG, { rules: seed, extra: (t) => cpSync(join(HERE, "witness_rules.mjs"), selfIn(t)) }), bound);
      const baseT = await plantTree(root, "J-BASE", bsrc, { rules: seed, extra: (t) => { mkdirSync(join(t, ...REL), { recursive: true }); cpSync(join(HERE, "witness_rules.mjs"), selfIn(t)); } });
      // the base tree's own map (absent at the cut) is what is judged: the witness file is only the reader
      if (!existsSync(join(bsrc, ...REL, "rule_witness.json"))) rmSync(mapPath(baseT), { force: true });
      const base = runClause(baseT, bound);
      console.log(`  clause at head · exit ${head.exit} · ${head.last}`);
      console.log(`  clause at base · exit ${base.exit} · ${base.last}`);
      if (!(head.exit === 0 && base.exit === 1)) reds.push("RULE-WITNESSES");
      what = `rule witnesses (${seed.length} seed rule(s): base ${base.exit} → head ${head.exit})`;
    }
    const b = boundRead();
    console.log(`  BOUND · ${b.why}`);
    if (!b.ok) reds.push("BOUND");
  } finally {
    for (const pid of namingProcs(root)) { try { process.kill(pid); } catch {} }
    const left = namingProcs(root);
    sweep(root);
    if (judge) {
      console.log(`  LAST · ${left.length} node process(es) naming the temp dir`);
      if (left.length) reds.push("LAST");
      if (reds.length) { console.log(`RED MRULEW · ${reds.join(" ")}`); process.exitCode = 1; }
      else { console.log(`GREEN MRULEW ${what} · plants both ways · ${CLAUSES.length} clause(s) (exit 0)`); process.exitCode = 0; }
    }
  }
}
main();
