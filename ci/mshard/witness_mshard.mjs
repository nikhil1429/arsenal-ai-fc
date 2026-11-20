#!/usr/bin/env node
// ============================================================================
// ci/mshard/witness_mshard.mjs — WITNESS of unit mshard (the witnesses member split across jobs, and the fold)
// ----------------------------------------------------------------------------
// CONTRACT (forks rows 1171 (3) / 1188; spec ci/mshard/MSHARD_SPEC.md on claude/mshard-spec c82a0e6, the ruling wins):
//   node ci/mshard/witness_mshard.mjs --org <build tree> --base-org <base tree> [--only <clause,…>]
// Every plant is a COPY under os.tmpdir(): a member plant is a throwaway git repo (core.autocrlf=false at init) holding the
// tree's scripts/organism_test.mjs and .github/workflows/suite.yml (and, when a clause says so, a planted ci/mshard/TIMES)
// beside planted ci/<unit>/ dirs whose witnesses are a few lines of node; a fold plant is a copy of the tree's
// scripts/ci_verdict.mjs run over planted digests. The member runs with GITHUB_ACTIONS=true, ORGANISM_TEST_PROFILE=hermetic
// and GITHUB_WORKSPACE=<the plant> in the CHILD's env only. THE PORT CLASS (row 1053): this witness binds no port, names no
// live service, POSTs nothing and restarts nothing; a planted witness only writes its marker under the temp dir and prints
// its last line. Every spawn is bounded by the tree's own suite.yml timeout-minutes (read, never typed). Node and git only,
// no POSIX shell: it runs on Windows as on Linux, every text compared with CRLF folded.
//   W-S1  PLAN       `organism_test.mjs witness-plan` over 7 planted units: every unit in exactly one of n shards, n the
//                    length of the tree's suite.yml `shard:` list, two runs byte-identical
//   W-S2  COVER      the fold handed shards 1 and 3 of 3 → RED, naming `WITNESS SHARD 2/3`
//   W-S3  UNJUDGED   a part whose `judged` lacks a unit of its `plan` → RED naming that unit
//   W-S4  DOUBLE     a unit planned by two parts → RED naming that unit
//   W-S5  EQUIV      reds split over the suite digest and three parts → the same NEW RED / BASE RED lines, the same verdict,
//                    new reds and pass/fail sums as ONE head file holding every red
//   W-S6  SHA        a part naming another head sha → RED, naming the shard
//   W-S7  FAILCLOSED a head digest carrying WITNESS_PLAN and NO part → RED (exit 1)
//   W-S8  SHARDRUN   member plant, ORGANISM_WITNESS_SHARD=2: exactly shard 2's witnesses spawn, and ONE WITNESS_SHARD line
//                    names k 2, its plan and every unit judged
//   W-S9  BADDOOR    doors 0 · n+1 · x · 2/(n+2) · both doors at once → ONE named red each, no witness spawned
//   W-S10 ONEBOUND   every job of the tree's suite.yml carries one timeout-minutes, all equal and none above the base's;
//                    the tree's workflowLaws refuses a planted workflow with one job's bound raised
//   W-S11 LEGNAME    exactly one job name of suite.yml reads as a leg, every `node:` list equals REQUIRED_LEGS; the tree's
//                    workflowLaws refuses a planted shard job named `npm test · node N`
//   W-S12 HEADALL    the plan and the door block name no merge-base, diff, ciChanged or LANDED_ON; a unit whose ci dir is
//                    unchanged since an older commit is still planned and judged
//   W-S13 PRIVACY    `digest` of a raw output carrying a detail canary → the canary absent, no `detail` key, only machine
//                    lines, every leaf a name or a number; suite.yml uploads only the carry dir, written by digest + meta
//   W-S14 UNSHARDED  GUARD: both doors unset → the member's output on a plant equals the base tree's (seconds folded)
//   W-S15 LPT        a planted ci/mshard/TIMES: the plan is LPT over it (the heaviest first onto the lightest shard), a unit
//                    absent from it still planned, a row naming no unit of the tree named `stale`
//   W-S16 DOORLESS   no witness the member spawns sees a shard door in its env (its own plant meets the unsharded member)
//   W-S17 PLANRUN    member plant, ORGANISM_WITNESS_SHARDS=plan: ONE WITNESS_PLAN line (all units, the witness-plan shards),
//                    no witness spawned, no witness assert
//   W-S18 CAUSE      unit mdtl's `causes` ride the digest and the fold (the suite job's, then each part's, in order)
//   W-S19 TIMES      `ci_verdict.mjs times --from-log` prints the table (the largest seconds per unit, its header naming the
//                    command); the tree's ci/mshard/TIMES reads in that grammar
//   W-S20 WIRING     suite.yml: the shard job runs `organism_test.mjs witnesses` behind ORGANISM_WITNESS_SHARD, the suite
//                    job's head step carries ORGANISM_WITNESS_SHARDS, the leg needs both and runs `if: !cancelled()` with
//                    `--head-part`
//   W-S21 KREAD      K is read from suite.yml's `shard:` list: [1, 2] plans 2 shards, [1, 2, 3, 4] plans 4, [1, 3] is refused
// Each clause runs on --base-org (must be RED) and on --org (must be GREEN); the GUARD (W-S14) must be GREEN on both.
// BOUND: only .github/workflows/suite.yml, scripts/organism_test.mjs, scripts/ci_verdict.mjs and files under ci/mshard/ differ
// (text, CRLF folded). LAST: no node process naming the temp dir survives.
// LAST LINE: GREEN MSHARD the witnesses member split across jobs, folded by name · <n> clause(s)  (exit 0)
//            RED MSHARD · <clauses>  (exit 1)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
if (!ORG || !BASE) { console.log("RED MSHARD · usage: --org <dir> --base-org <dir>"); process.exit(1); }
const ONLY = arg("--only") ? String(arg("--only")).split(",").map((s) => s.trim()).filter(Boolean) : null;
const NAMED = [".github/workflows/suite.yml", "scripts/organism_test.mjs", "scripts/ci_verdict.mjs"], NAMED_DIRS = ["ci/mshard/"];
const ROOT = mkdtempSync(join(os.tmpdir(), "witness-mshard-"));
let seq = 0;

const src = (tree, rel) => { try { return readFileSync(join(tree, ...rel.split("/")), "utf8"); } catch { return null; } };
const lf = (s) => String(s).replace(/\r\n/g, "\n");
// the bound: the job's own timeout-minutes, read from the tree under judgement (the member reads the same line)
const JOB_MS = (() => { const m = /timeout-minutes:\s*(\d+)/.exec(src(ORG, ".github/workflows/suite.yml") || ""); return m ? Number(m[1]) * 60000 : 0; })();
if (!JOB_MS) { console.log("RED MSHARD · the tree carries no .github/workflows/suite.yml timeout-minutes (the bound)"); process.exit(1); }
const sp = (cmd, args, o = {}) => { const r = spawnSync(cmd, args, { encoding: "utf8", windowsHide: true, timeout: JOB_MS, maxBuffer: 1 << 26, ...o }); return { code: r.status, out: lf((r.stdout || "") + (r.stderr || "")) }; };
function git(cwd, args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true, timeout: JOB_MS });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.stderr}`);
  return String(r.stdout || "").trim();
}
const put = (dir, rel, text) => { const p = join(dir, ...rel.split("/")); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, text); };
const newDir = (tag) => { const d = join(ROOT, `${tag}${++seq}`); mkdirSync(d, { recursive: true }); return d; };
function init(d) {
  git(d, ["-c", "core.autocrlf=false", "init", "-q", "-b", "main"]);
  for (const [k, v] of [["user.name", "witness"], ["user.email", "witness@example.invalid"], ["core.autocrlf", "false"], ["commit.gpgsign", "false"]]) git(d, ["config", k, v]);
}
const commit = (d, m) => { git(d, ["add", "-A"]); git(d, ["commit", "-q", "-m", m]); return git(d, ["rev-parse", "HEAD"]); };
const DOORS = ["ORGANISM_WITNESS_SHARD", "ORGANISM_WITNESS_SHARDS"];
const baseEnv = () => { const e = { ...process.env }; for (const d of DOORS) delete e[d]; delete e.ANTHROPIC_API_KEY; return e; };

// ── the planted witness: it writes its marker (which doors its env carries) and prints its LAST line ─────────────────
const W = (u) => `import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const dir = process.env.MSHARD_MARK;
if (dir) { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, "${u}.json"), JSON.stringify({ doors: ${JSON.stringify(DOORS)}.filter((d) => d in process.env) })); }
console.log("GREEN ${u.toUpperCase()} planted · 1 clause(s)");
`;
const SEVEN = ["pa", "pb", "pc", "pd", "pe", "pf", "pg"];

/** a member plant: commit 1 (the `old` units), commit 2 (the rest), every BASE = commit 1. @returns the plant's paths */
function plant(tree, { units = SEVEN, old = [], times = null, wf = null } = {}) {
  const ot = src(tree, "scripts/organism_test.mjs"), w = wf ?? src(tree, ".github/workflows/suite.yml");
  if (ot == null || w == null) return null;
  const d = newDir("p");
  init(d);
  put(d, "scripts/organism_test.mjs", ot); put(d, ".github/workflows/suite.yml", w);
  if (times != null) put(d, "ci/mshard/TIMES", times);
  for (const u of old) put(d, `ci/${u}/witness_${u}.mjs`, W(u));
  put(d, "m.txt", "BASE\n");
  const c1 = commit(d, "base");
  for (const u of [...old, ...units]) put(d, `ci/${u}/BASE`, `${c1}\n`);
  for (const u of units) put(d, `ci/${u}/witness_${u}.mjs`, W(u));
  put(d, "m.txt", "HEAD\n");
  commit(d, "head");
  return { d, mark: join(ROOT, `mark${++seq}`) };
}
/** the plant's member, `witnesses` mode, with the doors handed in @param {any} p @param {Record<string, string>} doors */
function member(p, doors = {}) {
  const env = { ...baseEnv(), ORGANISM_TEST_PROFILE: "hermetic", GITHUB_ACTIONS: "true", GITHUB_WORKSPACE: p.d, MSHARD_MARK: p.mark, ...doors };
  const r = sp(process.execPath, [join(p.d, "scripts", "organism_test.mjs"), "witnesses"], { cwd: p.d, env });
  const marks = existsSync(p.mark) ? readdirSync(p.mark).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort() : [];
  const doorsSeen = marks.flatMap((u) => { try { return JSON.parse(readFileSync(join(p.mark, `${u}.json`), "utf8")).doors; } catch { return ["(unreadable marker)"]; } });
  return { ...r, lines: r.out.split("\n"), marks, doorsSeen };
}
const planOf = (p) => {
  const r = sp(process.execPath, [join(p.d, "scripts", "organism_test.mjs"), "witness-plan"], { cwd: p.d, env: baseEnv() });
  const l = r.out.split("\n").find((x) => x.startsWith("WITNESS_PLAN "));
  let j = null; try { j = l ? JSON.parse(l.slice("WITNESS_PLAN ".length)) : null; } catch { j = null; }
  return { ...r, plan: j, line: l || "" };
};
const lineJson = (lines, tag) => { const l = lines.find((x) => x.startsWith(tag)); try { return l ? JSON.parse(l.slice(tag.length)) : null; } catch { return null; } };
const fails = (o) => o.lines.filter((l) => l.startsWith("  FAIL "));
const witnessAsserts = (o) => o.lines.filter((l) => /^ {2}(ok {3}|FAIL )WITNESS ‹/.test(l));
const tail = (o) => o.out.trim().split("\n").filter(Boolean).slice(-2).join(" | ");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const kOf = (tree) => { const m = /^\s*shard:\s*\[([^\]]*)\]/m.exec(src(tree, ".github/workflows/suite.yml") || ""); return m ? m[1].split(",").map((s) => s.trim()).filter(Boolean).length : 0; };

// ── the fold plant: a copy of the tree's ci_verdict.mjs over planted digests ──────────────────────────────────────────
const H = "c".repeat(40);
function cvCopy(tree) {
  const s = src(tree, "scripts/ci_verdict.mjs");
  if (s == null) return null;
  const d = newDir("v");
  put(d, "scripts/ci_verdict.mjs", s);
  const wf = src(tree, ".github/workflows/suite.yml");
  if (wf != null) put(d, ".github/workflows/suite.yml", wf);
  return join(d, "scripts", "ci_verdict.mjs");
}
const V = (reds, extra = {}) => `ORGANISM_TEST_VERDICT ${JSON.stringify({ modes: ["all"], pass: 7, fail: reds.length, exit: reds.length ? 1 : 0, ruled: [], unruled: reds.map((r) => ({ assert: r, detail: null })), stale: [], invalid: [], profile: "hermetic", reds, live: ["L1"], ...extra })}`;
const PLAN3 = (units = ["pa", "pb", "pc", "pd"], shards = [["pa", "pd"], ["pb"], ["pc"]]) => `WITNESS_PLAN ${JSON.stringify({ n: 3, head: H, units, shards, unknown: [], stale: [] })}`;
const PART = (k, plan, { reds = [], judged = plan, head = H, causes = null } = {}) => `${V(reds, { modes: ["witnesses"], live: [], ...(causes ? { causes } : {}) })}\nWITNESS_SHARD ${JSON.stringify({ k, n: 3, head, plan, judged, secs: Object.fromEntries(plan.map((u) => [u, 2.5])) })}\n`;
/** compare over planted files @param {string} cv @param {string} headText @param {string[]} parts @param {string} [baseText] */
function compare(cv, headText, parts, baseText = V([])) {
  const d = newDir("c");
  writeFileSync(join(d, "head.txt"), headText); writeFileSync(join(d, "base.txt"), baseText);
  const args = [cv, "compare", "--head", join(d, "head.txt"), "--base", join(d, "base.txt"), "--label", "node 22", "--head-sha", H, "--base-sha", "d".repeat(40)];
  parts.forEach((t, i) => { writeFileSync(join(d, `part${i}.txt`), t); args.push("--head-part", join(d, `part${i}.txt`)); });
  const r = sp(process.execPath, args, { env: baseEnv() });
  const ann = r.out.split("\n").find((l) => l.includes("::B1_VERDICT ")) || "";
  let payload = null;
  try { payload = JSON.parse(decodeURIComponent(ann.slice(ann.indexOf("::B1_VERDICT ") + "::B1_VERDICT ".length).replace(/%(?![0-9A-F]{2})/g, "%25"))); } catch { payload = null; }
  return { ...r, lines: r.out.split("\n").filter(Boolean), payload };
}
const named = (c, what) => c.code === 1 && c.lines.some((l) => l.startsWith("::error title=NEW RED") && l.includes(what));
const imp = async (tree) => { const cv = cvCopy(tree); if (!cv) return null; try { return await import(pathToFileURL(cv).href); } catch { return null; } };

// ── the clauses ──────────────────────────────────────────────────────────────────────────────────────────────────
const cache = new Map();
const once = (key, f) => { if (!cache.has(key)) cache.set(key, f()); return cache.get(key); };
const shardRun = (t) => once(`shard:${t}`, () => { const p = plant(t); if (!p) return null; const pl = planOf(p); return { pl, o: member(p, { ORGANISM_WITNESS_SHARD: "2" }) }; });
const CLAUSES = {
  "W-S1 PLAN"(t) {
    const p = plant(t); if (!p) return { ok: false, why: "no organism_test.mjs / suite.yml" };
    const a = planOf(p), b = planOf(p), n = kOf(t);
    if (a.code !== 0 || !a.plan) return { ok: false, why: `witness-plan → exit ${a.code}: ${tail(a)}` };
    const flat = a.plan.shards.flat();
    const ok = n >= 2 && a.plan.n === n && a.plan.shards.length === n && flat.length === SEVEN.length && same([...flat].sort(), SEVEN) && same(a.plan.units, SEVEN) && a.out === b.out;
    return { ok, why: `n ${a.plan.n} (suite.yml shard list ${n}) · ${a.plan.shards.map((s) => s.length).join("/")} · union ${new Set(flat).size} of ${SEVEN.length} · byte-identical ${a.out === b.out}` };
  },
  "W-S2 COVER"(t) {
    const cv = cvCopy(t); if (!cv) return { ok: false, why: "no ci_verdict.mjs" };
    const c = compare(cv, `${V([])}\n${PLAN3()}`, [PART(1, ["pa", "pd"]), PART(3, ["pc"])]);
    return { ok: named(c, "WITNESS SHARD 2/3"), why: `exit ${c.code} · ${c.lines.filter((l) => l.includes("NEW RED")).length} new red line(s)${named(c, "WITNESS SHARD 2/3") ? " naming WITNESS SHARD 2/3" : ""}` };
  },
  "W-S3 UNJUDGED"(t) {
    const cv = cvCopy(t); if (!cv) return { ok: false, why: "no ci_verdict.mjs" };
    const c = compare(cv, `${V([])}\n${PLAN3()}`, [PART(1, ["pa", "pd"], { judged: ["pa"] }), PART(2, ["pb"]), PART(3, ["pc"])]);
    return { ok: named(c, "WITNESS ‹pd›") && !named(c, "WITNESS ‹pa›"), why: `exit ${c.code} · names ‹pd› ${named(c, "WITNESS ‹pd›")} · names ‹pa› ${named(c, "WITNESS ‹pa›")}` };
  },
  "W-S4 DOUBLE"(t) {
    const cv = cvCopy(t); if (!cv) return { ok: false, why: "no ci_verdict.mjs" };
    const c = compare(cv, `${V([])}\n${PLAN3()}`, [PART(1, ["pa", "pd"]), PART(2, ["pb", "pa"]), PART(3, ["pc"])]);
    return { ok: named(c, "WITNESS ‹pa›"), why: `exit ${c.code} · names ‹pa› ${named(c, "WITNESS ‹pa›")}` };
  },
  "W-S5 EQUIV"(t) {
    const cv = cvCopy(t); if (!cv) return { ok: false, why: "no ci_verdict.mjs" };
    const base = V(["B0"]);
    const folded = compare(cv, `${V(["S1", "B0"])}\n${PLAN3()}`, [PART(1, ["pa", "pd"], { reds: ["A1"] }), PART(2, ["pb"], { reds: ["B1", "B2"] }), PART(3, ["pc"], { reds: ["C1"] })], base);
    const one = compare(cv, V(["S1", "B0", "A1", "B1", "B2", "C1"], { pass: 28, live: ["L1"] }), [], base);
    const strip = (c) => c.lines.filter((l) => !l.includes("B1_VERDICT"));
    const pick = (p) => p && { v: p.v, new: p.new, base_red: p.base_red, fixed: p.fixed, pass: p.pass, fail: p.fail };
    const ok = folded.code === one.code && same(strip(folded), strip(one)) && !!folded.payload && same(pick(folded.payload), pick(one.payload));
    return { ok, why: `exit ${folded.code}/${one.code} · red lines equal ${same(strip(folded), strip(one))} · payload ${JSON.stringify(pick(folded.payload))} vs ${JSON.stringify(pick(one.payload))}` };
  },
  "W-S6 SHA"(t) {
    const cv = cvCopy(t); if (!cv) return { ok: false, why: "no ci_verdict.mjs" };
    const c = compare(cv, `${V([])}\n${PLAN3()}`, [PART(1, ["pa", "pd"]), PART(2, ["pb"], { head: "e".repeat(40) }), PART(3, ["pc"])]);
    return { ok: named(c, "WITNESS SHARD 2/3 · judged the head"), why: `exit ${c.code} · names the head ${named(c, "WITNESS SHARD 2/3 · judged the head")}` };
  },
  "W-S7 FAILCLOSED"(t) {
    const cv = cvCopy(t); if (!cv) return { ok: false, why: "no ci_verdict.mjs" };
    const c = compare(cv, `${V([])}\n${PLAN3()}`, []);
    return { ok: c.code === 1 && !!c.payload && c.payload.v === "RED", why: `a plan line and no part → exit ${c.code} · verdict ${c.payload ? c.payload.v : "(none)"}` };
  },
  "W-S8 SHARDRUN"(t) {
    const r = shardRun(t); if (!r) return { ok: false, why: "no organism_test.mjs / suite.yml" };
    const want = r.pl.plan ? [...r.pl.plan.shards[1]].sort() : null, line = lineJson(r.o.lines, "WITNESS_SHARD ");
    const ok = !!want && want.length > 0 && same(r.o.marks, want) && !!line && line.k === 2 && same([...line.plan].sort(), want) && same([...line.judged].sort(), want) && r.o.lines.filter((l) => l.startsWith("WITNESS_SHARD ")).length === 1;
    return { ok, why: `spawned ${r.o.marks.join(",") || "(none)"} · shard 2 of the plan ${want ? want.join(",") : "(no plan)"} · WITNESS_SHARD ${line ? `k ${line.k} judged ${line.judged.join(",")}` : "(absent)"}` };
  },
  "W-S9 BADDOOR"(t) {
    const n = kOf(t) || 3, bad = [{ ORGANISM_WITNESS_SHARD: "0" }, { ORGANISM_WITNESS_SHARD: String(n + 1) }, { ORGANISM_WITNESS_SHARD: "x" }, { ORGANISM_WITNESS_SHARD: `2/${n + 2}` }, { ORGANISM_WITNESS_SHARD: "1", ORGANISM_WITNESS_SHARDS: "plan" }];
    const res = bad.map((doors) => { const p = plant(t, { units: ["pa", "pb", "pc"] }); if (!p) return { ok: false, w: "no tree" }; const o = member(p, doors); const f = fails(o); return { ok: o.marks.length === 0 && f.length === 1 && f[0].startsWith("  FAIL WITNESSES · the shard door names a shard of the plan"), w: `${JSON.stringify(doors)} spawned ${o.marks.length} · fails ${f.length}` }; });
    return { ok: res.every((x) => x.ok), why: res.map((x) => x.w).join(" · ") };
  },
  async "W-S10 ONEBOUND"(t) {
    const wf = lf(src(t, ".github/workflows/suite.yml") || ""), bw = lf(src(BASE, ".github/workflows/suite.yml") || "");
    const bounds = [...wf.matchAll(/^\s*timeout-minutes:\s*(\d+)\s*$/gm)].map((m) => Number(m[1]));
    const baseBound = Number((/timeout-minutes:\s*(\d+)/.exec(bw) || [])[1]);
    const jobs = [...(wf.split(/^jobs:\s*$/m)[1] || "").matchAll(/^ {2}[a-z0-9_-]+:\s*$/gm)].length;
    const cv = await imp(t);
    if (!cv || typeof cv.workflowLaws !== "function") return { ok: false, why: `the tree's ci_verdict.mjs exports no workflowLaws · bounds ${bounds.join(",")} over ${jobs} job(s)` };
    const lastRaised = (() => { const all = [...wf.matchAll(/^(\s*timeout-minutes:\s*)(\d+)\s*$/gm)]; const m = all[all.length - 1]; return m ? wf.slice(0, m.index) + `${m[1]}${Number(m[2]) + 1}` + wf.slice(/** @type {number} */ (m.index) + m[0].length) : wf; })();
    const own = cv.workflowLaws(wf).every(([, c]) => c), refused = !cv.workflowLaws(lastRaised).every(([, c]) => c);
    const ok = bounds.length === jobs && jobs > 0 && bounds.every((b) => b === bounds[0] && b <= baseBound) && own && refused;
    return { ok, why: `bounds ${bounds.join(",")} over ${jobs} job(s), base ${baseBound} · the tree's laws hold ${own} · a raised last bound refused ${refused}` };
  },
  async "W-S11 LEGNAME"(t) {
    const wf = lf(src(t, ".github/workflows/suite.yml") || "");
    const cv = await imp(t);
    if (!cv || typeof cv.workflowLaws !== "function" || !Array.isArray(cv.REQUIRED_LEGS)) return { ok: false, why: "the tree's ci_verdict.mjs exports no workflowLaws" };
    const lists = [...wf.matchAll(/^\s*node:\s*\[([^\]]*)\]/gm)].map((m) => m[1].split(",").map((x) => x.trim()).filter(Boolean).map((n) => `npm test · node ${n}`));
    const legs = [...wf.matchAll(/^ {4}name:\s*(.+?)\s*$/gm)].map((m) => m[1]).filter((n) => /^npm test · node /.test(n));
    const evil = wf.replace(/^( {4}name:\s*)witnesses · node (\$\{\{ matrix\.node \}\}).*$/m, "$1npm test · node $2");
    const refused = evil !== wf && !cv.workflowLaws(evil).every(([, c]) => c);
    const ok = lists.length >= 3 && lists.every((l) => same(l, cv.REQUIRED_LEGS)) && legs.length === 1 && cv.workflowLaws(wf).every(([, c]) => c) && refused;
    return { ok, why: `node lists ${lists.length} · leg-named jobs ${legs.length} · a shard job named as a leg refused ${refused}` };
  },
  "W-S12 HEADALL"(t) {
    const s = lf(src(t, "scripts/organism_test.mjs") || "");
    const a = s.indexOf("function witnessPlan("), b = s.indexOf("// unit mshard: the doors"), bEnd = s.indexOf("const secsOf = {};", b);
    if (a < 0 || b < 0 || bEnd < 0) return { ok: false, why: "no witnessPlan / door block in organism_test.mjs" };
    const body = s.slice(a, s.indexOf("\n}\n", a)) + s.slice(b, bEnd);
    const hit = ["merge-base", "diff", "ciChanged", "LANDED_ON", "HEAD^", "HEAD~"].filter((x) => body.includes(x));
    const p = plant(t, { units: ["pa", "pb"], old: ["po"] }); if (!p) return { ok: false, why: "no tree" };
    const pl = planOf(p);
    const k = pl.plan ? pl.plan.shards.findIndex((x) => x.includes("po")) + 1 : 0;
    const o = k ? member(p, { ORGANISM_WITNESS_SHARD: String(k) }) : null;
    const line = o ? lineJson(o.lines, "WITNESS_SHARD ") : null;
    const ok = hit.length === 0 && k > 0 && !!o && o.marks.includes("po") && !!line && line.judged.includes("po");
    return { ok, why: `${hit.length ? `the plan names ${hit.join(", ")}` : "the plan names no diff"} · the unchanged unit ‹po› in shard ${k || "(none)"} · spawned ${o ? o.marks.includes("po") : false} · judged ${line ? line.judged.includes("po") : false}` };
  },
  async "W-S13 PRIVACY"(t) {
    const cv = cvCopy(t); if (!cv) return { ok: false, why: "no ci_verdict.mjs" };
    const CANARY = `CANARY${process.pid}${Date.now()}`;
    const raw = `${V(["R1"]).replace('"detail":null', `"detail":"${CANARY}"`).replace('"profile"', `"extra":"${CANARY}","profile"`)}\n  FAIL R1\n         ${CANARY}\n${PART(2, ["pb"]).split("\n")[1]}\nplain line ${CANARY}\n`;
    const d = newDir("x"); writeFileSync(join(d, "raw.txt"), raw);
    const r = sp(process.execPath, [cv, "digest", join(d, "raw.txt")], { env: baseEnv() });
    const lines = r.out.split("\n").filter(Boolean);
    const leafs = (x) => x === null || typeof x === "string" || typeof x === "number" || (Array.isArray(x) ? x.every(leafs) : typeof x === "object" && Object.values(x).every(leafs));
    const parsed = lines.map((l) => { try { return JSON.parse(l.slice(l.indexOf(" ") + 1)); } catch { return undefined; } });
    const wf = lf(src(t, ".github/workflows/suite.yml") || "");
    const uploads = [...wf.matchAll(/uses: actions\/upload-artifact@[^\n]*\n(?:\s+[^\n]*\n)*?\s+path:\s*([^\n]+?)\s*\n/g)].map((m) => m[1]);
    const writes = [...wf.matchAll(/> "\$RUNNER_TEMP\/b1_carry\/[^"]+"/g)].map((m) => m[0]);
    const carryOnly = uploads.length > 0 && uploads.every((u) => u === "${{ runner.temp }}/b1_carry/") && writes.length > 0
      && [...wf.matchAll(/^.*\$RUNNER_TEMP\/b1_carry\/[^"]*".*$/gm)].every((m) => /ci_verdict\.mjs digest |^\s*\{ echo "head=|mkdir -p /.test(m[0]) || !/>/.test(m[0]));
    const ok = r.code === 0 && lines.length === 2 && !r.out.includes(CANARY) && !r.out.includes('"detail"') && lines.every((l) => /^(ORGANISM_TEST_VERDICT|WITNESS_SHARD) \{/.test(l)) && parsed.every((x) => x !== undefined && leafs(x)) && carryOnly;
    return { ok, why: `digest exit ${r.code} · ${lines.length} line(s) · canary ${r.out.includes(CANARY) ? "LEAKED" : "absent"} · detail key ${r.out.includes('"detail"')} · uploads ${uploads.join(",") || "(none)"} · carry writes ${writes.length} by digest/meta only ${carryOnly}` };
  },
  "W-S14 UNSHARDED"(t) {
    const run = (tree) => { const p = plant(tree, { units: ["pa", "pb", "pc"] }); if (!p) return null; const o = member(p); return { o, text: o.lines.join("\n").replace(/\d+(\.\d+)?/g, "#") }; };
    const a = run(t), b = run(BASE);
    if (!a || !b) return { ok: false, why: "no tree" };
    const ok = a.text === b.text && same(a.o.marks, ["pa", "pb", "pc"]) && !a.o.lines.some((l) => /^WITNESS_(PLAN|SHARD) /.test(l));
    return { ok, why: `output equals the base's ${a.text === b.text} · spawned ${a.o.marks.join(",")} · machine shard lines ${a.o.lines.filter((l) => /^WITNESS_(PLAN|SHARD) /.test(l)).length}` };
  },
  "W-S15 LPT"(t) {
    const times = "# planted\npa 100\npb 60\npc 50\npd 40\npe 10\npf 5\ngone 7\n";
    const p = plant(t, { units: ["pa", "pb", "pc", "pd", "pe", "pf", "px"], times, wf: lf(src(t, ".github/workflows/suite.yml") || "").replace(/^(\s*shard:\s*)\[[^\]]*\]/m, "$1[1, 2, 3]") });
    if (!p) return { ok: false, why: "no tree" };
    const pl = planOf(p);
    // LPT by hand over the planted table, heaviest first onto the lightest shard (a tie: the lower k); px, absent from the
    // table, weighs the mean of the tree's rows (265/6 ≈ 44.2): pa 100→1 · pb 60→2 · pc 50→3 · px 44.2→3 (50) · pd 40→2 (60)
    // · pe 10→3 (94.2 < 100, 100) · pf 5→1 (100 = 100, the lower k)
    const want = [["pa", "pf"], ["pb", "pd"], ["pc", "pe", "px"]];
    const got = pl.plan ? pl.plan.shards : null;
    const ok = !!got && same(got, want) && same(pl.plan.unknown, ["px"]) && same(pl.plan.stale, ["gone"]);
    return { ok, why: `plan ${JSON.stringify(got)} (LPT ${JSON.stringify(want)}) · unknown ${pl.plan ? pl.plan.unknown.join(",") : "-"} · stale ${pl.plan ? pl.plan.stale.join(",") : "-"}` };
  },
  "W-S16 DOORLESS"(t) {
    const r = shardRun(t); if (!r) return { ok: false, why: "no tree" };
    return { ok: r.o.marks.length > 0 && r.o.doorsSeen.length === 0, why: `${r.o.marks.length} witness(es) spawned under ORGANISM_WITNESS_SHARD=2 · doors in their env ${r.o.doorsSeen.join(",") || "none"}` };
  },
  "W-S17 PLANRUN"(t) {
    const p = plant(t); if (!p) return { ok: false, why: "no tree" };
    const pl = planOf(p), o = member(p, { ORGANISM_WITNESS_SHARDS: "plan" }), line = lineJson(o.lines, "WITNESS_PLAN ");
    const ok = !!line && !!pl.plan && same(line.units, SEVEN) && same(line.shards, pl.plan.shards) && o.marks.length === 0 && witnessAsserts(o).length === 0 && fails(o).length === 0;
    return { ok, why: `WITNESS_PLAN ${line ? `${line.units.length} unit(s), shards equal witness-plan ${!!pl.plan && same(line.shards, pl.plan.shards)}` : "(absent)"} · spawned ${o.marks.length} · witness asserts ${witnessAsserts(o).length}` };
  },
  async "W-S18 CAUSE"(t) {
    const cv = await imp(t);
    if (!cv || typeof cv.mergeParts !== "function" || typeof cv.digest !== "function") return { ok: false, why: "the tree's ci_verdict.mjs exports no mergeParts / digest" };
    const dg = cv.digest(PART(1, ["pa", "pd"], { causes: ["WITNESS ‹pa› · P1 · a planted claim"] })).join("\n");
    const m = cv.mergeParts(`${V([], { causes: ["c0"] })}\n${PLAN3()}`, [dg, PART(2, ["pb"], { causes: ["c2"] }), PART(3, ["pc"])]);
    const got = m && m.suite ? m.suite.causes : null;
    const ok = same(got, ["c0", "WITNESS ‹pa› · P1 · a planted claim", "c2"]);
    return { ok, why: `folded causes ${JSON.stringify(got)}` };
  },
  "W-S19 TIMES"(t) {
    const cv = cvCopy(t); if (!cv) return { ok: false, why: "no ci_verdict.mjs" };
    const d = newDir("t");
    writeFileSync(join(d, "a.log"), "2026-11-20T00:00:00Z   ok   WITNESS ‹pa› · ran in 5.0 s (B5)\n  ok   WITNESS ‹pb› · ran in 3.5 s (B5)\n");
    writeFileSync(join(d, "b.log"), "  ok   WITNESS ‹pa› · ran in 9.0 s (B5)\n  ok   WITNESS ‹pa› · GREEN at head against its BASE\n");
    const r = sp(process.execPath, [cv, "times", "--from-log", join(d, "a.log"), "--from-log", join(d, "b.log")], { env: baseEnv() });
    const lines = r.out.split("\n").filter(Boolean);
    const table = lf(src(t, "ci/mshard/TIMES") || "").split("\n").filter(Boolean);
    const tableOk = table.length > 1 && table[0].startsWith("# ci/mshard/TIMES · ") && table[0].includes("node scripts/ci_verdict.mjs times") && table.slice(1).every((l) => /^[a-z0-9-]+ \d+(\.\d+)?$/.test(l));
    const ok = r.code === 0 && lines.length === 3 && lines[0].startsWith("# ci/mshard/TIMES · ") && lines[1] === "pa 9.0" && lines[2] === "pb 3.5" && tableOk;
    return { ok, why: `times → ${lines.slice(1).join(" · ") || tail(r)} · the tree's TIMES ${table.length - 1} row(s) in grammar ${tableOk}` };
  },
  "W-S20 WIRING"(t) {
    const wf = lf(src(t, ".github/workflows/suite.yml") || "");
    const job = (id) => { const m = new RegExp(`^ {2}${id}:\\s*$([\\s\\S]*?)(?=^ {2}[a-z0-9_-]+:\\s*$|(?![\\s\\S]))`, "m").exec(wf); return m ? m[1] : ""; };
    const sh = job("witnesses"), su = job("suite"), leg = job("npm-test");
    const checks = {
      shard: /ORGANISM_WITNESS_SHARD: \$\{\{ matrix\.shard \}\}/.test(sh) && /node scripts\/organism_test\.mjs witnesses /.test(sh) && /^\s*shard:\s*\[/m.test(sh),
      plan: /ORGANISM_WITNESS_SHARDS: plan/.test(su) && /node scripts\/organism_test\.mjs all /.test(su),
      leg: /^ {4}name: npm test · node \$\{\{ matrix\.node \}\}\s*$/m.test(leg) && /needs: \[suite, witnesses\]/.test(leg) && /if: \$\{\{ !cancelled\(\) \}\}/.test(leg) && /--head-part/.test(leg) && /ci_verdict\.mjs compare /.test(leg),
    };
    return { ok: Object.values(checks).every(Boolean), why: Object.entries(checks).map(([k, v]) => `${k} ${v}`).join(" · ") };
  },
  "W-S21 KREAD"(t) {
    const wf = lf(src(t, ".github/workflows/suite.yml") || "");
    const at = (list) => { const w = /^\s*shard:\s*\[/m.test(wf) ? wf.replace(/^(\s*shard:\s*)\[[^\]]*\]/m, `$1[${list}]`) : wf; const p = plant(t, { wf: w }); return p ? planOf(p) : null; };
    const two = at("1, 2"), four = at("1, 2, 3, 4"), gap = at("1, 3");
    const ok = !!two && !!four && !!gap && !!two.plan && two.plan.n === 2 && two.plan.shards.length === 2 && !!four.plan && four.plan.n === 4 && four.plan.shards.length === 4 && gap.code === 1 && !gap.plan;
    return { ok, why: `[1, 2] → ${two && two.plan ? two.plan.n : "-"} · [1, 2, 3, 4] → ${four && four.plan ? four.plan.n : "-"} · [1, 3] → exit ${gap ? gap.code : "-"}` };
  },
};
const GUARDS = new Set(["W-S14 UNSHARDED"]);

// ── BOUND: only the named files differ (text, CRLF folded) ─────────────────────────────────────────────────────────────
function files(dir) {
  const out = [];
  const walk = (d) => { for (const f of readdirSync(d)) { if (f === ".git" || f === "node_modules") continue; const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else out.push(relative(dir, p).split("\\").join("/")); } };
  walk(dir);
  return out;
}
function boundClause() {
  const a = new Set(files(ORG)), b = new Set(files(BASE));
  const diff = [...new Set([...a, ...b])].filter((f) => { const x = a.has(f) ? lf(readFileSync(join(ORG, f), "latin1")) : null, y = b.has(f) ? lf(readFileSync(join(BASE, f), "latin1")) : null; return x !== y; }).sort();
  const beyond = diff.filter((f) => !NAMED.includes(f) && !NAMED_DIRS.some((p) => f.startsWith(p)));
  return { ok: beyond.length === 0, why: beyond.length ? `beyond the named files: ${beyond.slice(0, 8).join(", ")}${beyond.length > 8 ? ` (+${beyond.length - 8})` : ""}` : `${diff.length} file(s) differ, every one named` };
}
/** node processes whose command line names the temp dir */
function survivors() {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true, timeout: JOB_MS });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.toLowerCase().includes(ROOT.toLowerCase())).map((l) => Number(l.trim().split(" ")[0])).filter((p) => p && p !== process.pid);
  }
  const out = [];
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(ROOT)) out.push(Number(p)); } catch {}
  }
  return out;
}

const red = [];
let total = 0;
try {
  for (const [name, f] of Object.entries(CLAUSES)) {
    if (ONLY && !ONLY.includes(name)) continue;
    total++;
    const res = {};
    for (const [side, tree] of [["base", BASE], ["build", ORG]]) {
      cache.clear();
      try { res[side] = await f(tree); } catch (e) { res[side] = { ok: false, why: `threw: ${String(e && e.message ? e.message : e).split("\n")[0]}` }; }
    }
    const pass = GUARDS.has(name) ? res.base.ok && res.build.ok : !res.base.ok && res.build.ok;
    console.log(`  ${pass ? "✓" : "✗"} ${name}${GUARDS.has(name) ? " (guard)" : ""} · base ${res.base.ok ? "GREEN" : "RED"} (${res.base.why}) · build ${res.build.ok ? "GREEN" : "RED"} (${res.build.why})`);
    if (!pass) red.push(name);
  }
  if (!ONLY) { total++; let b; try { b = boundClause(); } catch (e) { b = { ok: false, why: `threw: ${String(e && e.message ? e.message : e).split("\n")[0]}` }; } console.log(`  ${b.ok ? "✓" : "✗"} BOUND · ${b.why}`); if (!b.ok) red.push("BOUND"); }
} finally {
  if (!ONLY) total++;
  const left = survivors();
  for (const p of left) { try { process.kill(p); } catch {} }
  if (!ONLY) { console.log(`  ${left.length === 0 ? "✓" : "✗"} LAST · ${left.length} node process(es) naming the temp dir survive`); if (left.length) red.push("LAST"); }
  try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
}
console.log(red.length ? `RED MSHARD · ${red.join(", ")}` : `GREEN MSHARD the witnesses member split across jobs, folded by name · ${total} clause(s)`);
process.exit(red.length ? 1 : 0);
