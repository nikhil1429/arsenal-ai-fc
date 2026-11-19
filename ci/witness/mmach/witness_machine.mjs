#!/usr/bin/env node
// ============================================================================
// ci/witness/mmach/witness_machine.mjs — UNIT mmach · THE MACHINE READS A BROKEN BRANCH RED, ITS CLEAN SIBLING GREEN,
//   AND READS BOTH WITH NO LOGIN (spec ci/mwit/MWIT_SPEC.md @ 88bf69d §B-machine; rulings forks rows 1162 / 1163)
//   SOLE WRITER of: NOTHING outside its own os.tmpdir() root. It never opens dressing-room/state.
// ----------------------------------------------------------------------------
// USAGE — the three CLAUSE READS (the form the receipt organ accepts, `node <tracked path> [plain args]`):
//   node ci/witness/mmach/witness_machine.mjs broken  [--org <dir>]
//   node ci/witness/mmach/witness_machine.mjs clean   [--org <dir>]
//   node ci/witness/mmach/witness_machine.mjs nologin [--org <dir>]
//     --org defaults to the tree this file sits in. Each reads the RECORD ci/witness/mmach/machine.json of --org
//     ({ broken: { branch, sha, base, planted_assert }, clean: { branch, sha, base } }, written once by the unit) and runs
//     --org's own scripts/ci_verdict.mjs <sha> as a CHILD (the one reader; no second reader is built here).
//     EXIT (spec §0): 0 the clause HOLDS · 1 RED, read and it does not hold · 2 UNREAD (a fact absent or unreadable).
//   broken   0 iff the child exits 1, its line reads RED, and EVERY required leg reads RED whose NEW reds are exactly
//            [planted_assert] (by name: the annotation carries the member name); a RED naming another, or GREEN → 1;
//            PENDING / NONE / UNREADABLE, or no record → 2.
//   clean    0 iff the child exits 0, its line reads GREEN and every leg reads GREEN with 0 new red, AND the record's clean
//            sibling shares the broken branch's base (same base, the break reverted); a RED leg or a sibling on another
//            base → 1; PENDING / NONE / UNREADABLE (exit 2 is NEVER green), or no record → 2.
//   nologin  static half first: --org's ci_verdict.mjs source carries an Authorization header or reads a token from the
//            env → 1. Then the child runs on the CLEAN sha with an env SCRUBBED of every *TOKEN* / GH_* / GITHUB_* key, of
//            every proxy key (a proxy stands between the reader and the API and can carry a credential the reader never
//            sees, so a read through one is not a signed-out read), and of the git credential path (GIT_CONFIG_NOSYSTEM,
//            an empty GIT_CONFIG_GLOBAL under the temp root, no askpass, no terminal prompt). 0 iff the child prints ONE
//            verdict line that the API answered (GREEN / RED / PENDING / NONE — a READ, whatever the verdict) and exits 0
//            or 1; UNREADABLE → 2. In a cloud whose only road out is a proxy, nologin therefore reads UNREAD (2), never
//            green — the signed-out read is a fact of his laptop (spec N4; row 1162 (5)).
//   Every child is bounded by the job's own timeout-minutes, READ from --org's .github/workflows/suite.yml (never typed);
//   unreadable → 2.
// USAGE — THE PLANTS (each clause both ways):
//   node ci/witness/mmach/witness_machine.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//     --org       the build tree (GREEN); --base-org the BASE tree (main at the cut, ci/mmach/BASE): RED on each clause
//     --only      run only these clause ids (the mutant runner's door); BOUND and LAST always run
// CONTRACT — every plant runs on a MINIMAL COPY under one os.tmpdir() root: the tree's scripts/ci_verdict.mjs, its
//   .github/workflows/suite.yml and (when the plant keeps it) its ci/witness/mmach/machine.json — nothing of
//   dressing-room/ is copied, read or printed. The network is PLANTED: the child is `node --import <preload> ci_verdict.mjs`,
//   the preload (written under the temp root, refused unless its plan and log paths lie under os.tmpdir()) replaces
//   globalThis.fetch with a planted GitHub API that answers from a plan file, logs every call's header NAMES and the token /
//   proxy env keys the child can see, and answers 401 if either is present. No port is bound, no service named, nothing
//   POSTed, nothing restarted (row 1053); no git repo is planted (core.autocrlf: nothing to init); every line read from a
//   process is split on \r?\n; BOUND hashes text with CRLF folded to LF; processes are listed through PowerShell on
//   Windows, /proc elsewhere. No model is called and none is named.
// CLAUSES:
//   B-machine:broken-red    BASE: no record → not 0. BUILD (planted API): both legs RED naming planted_assert → 0 · RED naming
//                           another → 1 · RED naming it plus another → 1 · one leg RED, one GREEN → 1 · GREEN → 1 ·
//                           in_progress → 2 · API 403 → 2 · no record → 2
//   B-machine:clean-green   BASE: no record → not 0. BUILD: both legs GREEN → 0 · one leg RED → 1 · API 403 (UNREADABLE,
//                           exit 2) → 2 · in_progress → 2 · no record → 2 · a sibling on another base → 1
//   B-machine:read-no-login BASE: no record → not 0. BUILD: planted GREEN with GITHUB_TOKEN, GH_TOKEN and HTTPS_PROXY set in
//                           the PARENT env → 0 and the planted API saw no token, no proxy key, no Authorization header,
//                           at most 3 calls · planted RED → 0 (a read) · API 403 → 2 · no record → 2 · a ci_verdict.mjs
//                           that sends an Authorization header → 1 (static half)
//   BOUND                   only ci/witness/mmach/** and ci/mmach/** differ between --org and --base-org
//   LAST                    no node process naming the temp root survives
// LAST LINE: GREEN MMACH <what> · <n> clause(s) (exit 0) or RED MMACH · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync, copyFileSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RECORD_REL = ["ci", "witness", "mmach", "machine.json"];
const VERDICT_REL = ["scripts", "ci_verdict.mjs"];
const SUITE_REL = [".github", "workflows", "suite.yml"];
const OWN_DIRS = ["ci/witness/mmach/", "ci/mmach/"];   // BOUND: the only paths this unit may change
const LEG_NAME = /^npm test · node (\d+)$/;
const HEX40 = /^[0-9a-f]{40}$/;
const CLAUSES = ["B-machine:broken-red", "B-machine:clean-green", "B-machine:read-no-login"];
const MODE_OF = { "B-machine:broken-red": "broken", "B-machine:clean-green": "clean", "B-machine:read-no-login": "nologin" };

const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };

// ── the record ───────────────────────────────────────────────────────────────────────────────────────────────────────
/** @param {string} org @returns {{ ok: true, rec: any } | { ok: false, why: string }} */
function readRecord(org) {
  const p = join(org, ...RECORD_REL);
  if (!existsSync(p)) return { ok: false, why: "no record (ci/witness/mmach/machine.json absent)" };
  let rec;
  try { rec = JSON.parse(readFileSync(p, "utf8")); } catch { return { ok: false, why: "the record does not parse" }; }
  const b = rec && rec.broken, c = rec && rec.clean;
  const str = (x) => typeof x === "string" && x.trim() !== "";
  if (!b || !c || !HEX40.test(String(b.sha)) || !HEX40.test(String(c.sha)) || !HEX40.test(String(b.base)) || !HEX40.test(String(c.base))
    || !str(b.branch) || !str(c.branch) || !str(b.planted_assert)) return { ok: false, why: "the record lacks a field (broken/clean · branch, 40-hex sha and base · planted_assert)" };
  return { ok: true, rec };
}

/** the job's own bound, READ from the tree's suite.yml (never typed) @param {string} org @returns {number|null} ms */
function boundMs(org) {
  try { const m = /timeout-minutes:\s*(\d+)/.exec(readFileSync(join(org, ...SUITE_REL), "utf8")); return m && Number(m[1]) > 0 ? Number(m[1]) * 60000 : null; } catch { return null; }
}

// ── the child env ────────────────────────────────────────────────────────────────────────────────────────────────────
const TOKENISH = (k) => /TOKEN/i.test(k) || /^GH_/i.test(k) || /^GITHUB_/i.test(k);
const PROXYISH = (k) => /^(https?|all|ftp|no)_proxy$/i.test(k) || /^NODE_USE_ENV_PROXY$/i.test(k) || /^GLOBAL_AGENT_/i.test(k);
/** @param {Record<string,string|undefined>} env @param {"broken"|"clean"|"nologin"} mode @param {string} root the temp root */
function childEnv(env, mode, root) {
  const out = {};
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined || TOKENISH(k)) continue;
    if (mode === "nologin" && (PROXYISH(k) || /ASKPASS/i.test(k) || /^GIT_CONFIG/i.test(k) || /^SSH_AUTH_SOCK$/i.test(k))) continue;
    out[k] = v;
  }
  if (mode === "nologin") {
    const empty = join(root, "gitconfig-empty");
    writeFileSync(empty, "");
    Object.assign(out, { GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: empty, GIT_TERMINAL_PROMPT: "0" });
  } else if (Object.keys(out).some((k) => /^https?_proxy$/i.test(k)) && !Object.keys(out).some((k) => /^NODE_USE_ENV_PROXY$/i.test(k))) {
    out.NODE_USE_ENV_PROXY = "1";   // the machine's declared road out (Node's fetch ignores HTTPS_PROXY without it, spec §1)
  }
  return out;
}

// ── the planted API (the preload) ────────────────────────────────────────────────────────────────────────────────────
const PRELOAD = `// planted by ci/witness/mmach/witness_machine.mjs — a fake GitHub API, no port, no network
import { readFileSync, appendFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { relative, isAbsolute, resolve } from "node:path";
const under = (p) => { try { const r = relative(realpathSync(tmpdir()), realpathSync(resolve(p))); return !!r && !r.startsWith("..") && !isAbsolute(r); } catch { return false; } };
const planP = process.env.MMACH_PLANT_PLAN, logP = process.env.MMACH_PLANT_LOG;
if (!planP || !logP || !under(planP) || !under(logP)) throw new Error("mmach plant: the plan and log doors are honoured only under os.tmpdir()");
const plan = JSON.parse(readFileSync(planP, "utf8"));
globalThis.fetch = async (url, init = {}) => {
  const h = init && init.headers ? (typeof init.headers.forEach === "function" ? (() => { const o = {}; init.headers.forEach((v, k) => { o[k] = v; }); return o; })() : init.headers) : {};
  const names = Object.keys(h).map((k) => k.toLowerCase());
  const tokenEnv = Object.keys(process.env).filter((k) => /TOKEN/i.test(k) || /^GH_/i.test(k) || /^GITHUB_/i.test(k));
  const proxyEnv = Object.keys(process.env).filter((k) => /^(https?|all)_proxy$/i.test(k));
  appendFileSync(logP, JSON.stringify({ url: String(url), headers: names, tokenEnv, proxyEnv }) + "\\n");
  if (names.includes("authorization") || tokenEnv.length) return new Response("", { status: 401 });
  if (plan.status) return new Response("", { status: plan.status });
  for (const [k, v] of plan.map) if (String(url).includes(k)) return new Response(JSON.stringify(v), { status: 200, headers: { "content-type": "application/json" } });
  return new Response("", { status: 404 });
};
`;

// ── the one reader, as a child ───────────────────────────────────────────────────────────────────────────────────────
/** run org's ci_verdict.mjs <sha>; with `plant`, through the planted API
 *  @param {string} org @param {string} sha @param {"broken"|"clean"|"nologin"} mode @param {string} root
 *  @param {{ plan?: any, env?: Record<string,string|undefined>, tag?: string }} [o] */
function runVerdict(org, sha, mode, root, o = {}) {
  const bound = boundMs(org);
  if (!bound) return { status: null, line: "", why: "the bound (suite.yml timeout-minutes) is unreadable", calls: [] };
  const env = childEnv(o.env || process.env, mode, root);
  const args = [];
  let logP = null;
  if (o.plan) {
    const d = join(root, `plant-${o.tag || mode}-${Math.random().toString(16).slice(2)}`);
    mkdirSync(d, { recursive: true });
    const pre = join(d, "preload.mjs"), planP = join(d, "plan.json");
    logP = join(d, "calls.jsonl");
    writeFileSync(pre, PRELOAD);
    writeFileSync(planP, JSON.stringify(o.plan));
    writeFileSync(logP, "");
    env.MMACH_PLANT_PLAN = planP; env.MMACH_PLANT_LOG = logP;
    args.push("--import", pathToFileURL(pre).href);
  }
  args.push(join(org, ...VERDICT_REL), sha);
  const r = spawnSync(process.execPath, args, { cwd: org, env, encoding: "utf8", timeout: bound, windowsHide: true });
  const lines = String(r.stdout || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const vl = lines.filter((l) => l.startsWith("ci_verdict "));
  const calls = logP ? readFileSync(logP, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)) : [];
  return { status: Number.isInteger(r.status) ? r.status : null, line: vl.length === 1 ? vl[0] : "", nlines: vl.length, why: r.error ? String(r.error.message) : "", calls };
}

/** the verdict line, parsed: { v, legs: [{ name, v, fresh: string[] }] } or null @param {string} line @param {string} sha */
export function parseLine(line, sha) {
  const m = /^ci_verdict ([0-9a-f]{7}) (GREEN|RED|PENDING|NONE|UNREADABLE) — (.*)$/.exec(String(line));
  if (!m || m[1] !== String(sha).slice(0, 7)) return null;
  const legs = [];
  if (m[2] === "GREEN" || m[2] === "RED") {
    const body = m[3].replace(/ \(\d+ calls?\)$/, "");
    for (const part of body.split(" | ")) {
      const lm = /^(npm test · node \d+): (GREEN|RED) \((.*)\) \[run \d+\]$/.exec(part);
      if (!lm || !LEG_NAME.test(lm[1])) return null;
      const nm = /(\d+) new red(?:: (.*))? · \d+ base red · /.exec(lm[3]);
      const fresh = nm && Number(nm[1]) > 0 && nm[2] !== undefined ? nm[2].split(" ; ") : [];
      if (nm && Number(nm[1]) !== fresh.length) return null;   // a count that disagrees with its names is not read
      legs.push({ name: lm[1], v: lm[2], fresh, noAnn: !nm });
    }
  }
  return { v: m[2], legs };
}

// ── THE THREE CLAUSE READS ───────────────────────────────────────────────────────────────────────────────────────────
/** @param {"broken"|"clean"|"nologin"} mode @param {string} org @param {string} root @param {{ plan?: any, env?: any, tag?: string }} [o]
 *  @returns {{ code: 0|1|2, why: string, calls?: any[] }} */
export function readClause(mode, org, root, o = {}) {
  if (mode === "nologin") {
    let src = null;
    try { src = readFileSync(join(org, ...VERDICT_REL), "utf8"); } catch { src = null; }
    if (src === null) return { code: 2, why: "scripts/ci_verdict.mjs is unreadable" };
    const hit = src.split(/\r?\n/).map((l, i) => ({ l, i })).find(({ l }) => /\bauthorization\b\s*["'`]?\s*:/i.test(l) || /process\.env\.[A-Za-z_]*(TOKEN|GH_|GITHUB_)/.test(l) || /process\.env\[\s*["'`][A-Za-z_]*(TOKEN|GH_|GITHUB_)/.test(l));
    if (hit) return { code: 1, why: `static half: ci_verdict.mjs:${hit.i + 1} sends a credential (an Authorization header or a token read from the env)` };
  }
  const rr = readRecord(org);
  if (!rr.ok) return { code: 2, why: rr.why };
  const { broken, clean } = rr.rec;
  if (mode === "clean" && clean.base !== broken.base) return { code: 1, why: `the clean sibling's base ${clean.base.slice(0, 7)} is not the broken branch's base ${broken.base.slice(0, 7)}` };
  if (mode === "clean" && clean.sha === broken.sha) return { code: 1, why: "the clean sibling is the broken commit itself" };
  const sha = mode === "broken" ? broken.sha : clean.sha;
  const r = runVerdict(org, sha, mode, root, o);
  const p = r.line ? parseLine(r.line, sha) : null;
  const say = (code, why) => ({ code, why: `${why} · child exit ${r.status} · ${r.line || "(no verdict line)"}`, calls: r.calls });
  if (r.status === null) return say(2, `the reader did not finish inside its bound${r.why ? ` (${r.why})` : ""}`);
  if (!p || r.nlines !== 1) return say(2, "the reader printed no single verdict line this witness can read");
  if (p.v === "UNREADABLE" || r.status === 2) return say(2, "UNREAD — the API was not read");
  if (p.v === "PENDING" || p.v === "NONE") return say(2, `UNREAD — the verdict is ${p.v}`);
  if (mode === "nologin") return (r.status === 0 || r.status === 1) ? say(0, `read signed-out (${p.v})`) : say(2, "an exit outside 0/1");
  if (mode === "broken") {
    if (r.status !== 1 || p.v !== "RED") return say(1, `the broken branch reads ${p.v}, not RED`);
    const named = p.legs.length > 0 && p.legs.every((l) => l.v === "RED" && l.fresh.length === 1 && l.fresh[0] === broken.planted_assert);
    return named ? say(0, `RED by name on every leg: ${broken.planted_assert}`) : say(1, `RED, but not every leg names exactly the planted assert (${broken.planted_assert}) as its one new red`);
  }
  if (r.status !== 0 || p.v !== "GREEN") return say(1, `the clean sibling reads ${p.v}, not GREEN`);
  return p.legs.length > 0 && p.legs.every((l) => l.v === "GREEN" && l.fresh.length === 0) ? say(0, "GREEN on every leg") : say(1, "a leg is not GREEN with 0 new red");
}

// ── the planted API's answers ────────────────────────────────────────────────────────────────────────────────────────
const RUNS = (st = "completed") => ({ check_runs: [{ id: 902, name: "npm test · node 24", status: st, conclusion: "success" }, { id: 901, name: "npm test · node 22", status: st, conclusion: "success" }, { id: 909, name: "another job", status: "completed" }] });
const ANN = (v, fresh, base) => [{ title: "BASE RED · suite 1/1", message: "x" }, { title: "B1 VERDICT · suite", message: `B1_VERDICT ${JSON.stringify({ v, base, new: fresh, base_red: 1, live: 1 })}` }];
const PLAN = (base, l22, l24, st) => ({ map: [["/check-runs?", RUNS(st)], ["/check-runs/901/", ANN(l22[0], l22[1], base)], ["/check-runs/902/", ANN(l24[0], l24[1], base)]] });

// ── the tree walk (BOUND) and the process sweep (LAST) ───────────────────────────────────────────────────────────────
function walk(root) {
  const out = new Map();
  const go = (d) => {
    for (const n of readdirSync(d)) {
      if (n === ".git" || n === "node_modules") continue;
      const p = join(d, n);
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) go(p);
      else if (st.isFile()) out.set(relative(root, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p).toString("latin1").replace(/\r\n/g, "\n"), "latin1").digest("hex"));
    }
  };
  go(root);
  return out;
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

// ── a minimal plant tree ─────────────────────────────────────────────────────────────────────────────────────────────
/** copy of <src>'s reader, bound and (optionally) record, under <into> @param {string} src @param {string} into @param {{ record?: boolean, recordOverride?: any, verdictSrc?: string }} o */
function plantTree(src, into, o = {}) {
  for (const rel of [VERDICT_REL, SUITE_REL]) {
    const from = join(src, ...rel);
    if (!existsSync(from)) continue;
    mkdirSync(join(into, ...rel.slice(0, -1)), { recursive: true });
    copyFileSync(from, join(into, ...rel));
  }
  if (o.verdictSrc !== undefined) writeFileSync(join(into, ...VERDICT_REL), o.verdictSrc);
  const rp = join(src, ...RECORD_REL);
  if (o.recordOverride !== undefined || (o.record !== false && existsSync(rp))) {
    mkdirSync(join(into, ...RECORD_REL.slice(0, -1)), { recursive: true });
    if (o.recordOverride !== undefined) writeFileSync(join(into, ...RECORD_REL), JSON.stringify(o.recordOverride, null, 2) + "\n");
    else copyFileSync(rp, join(into, ...RECORD_REL));
  }
  return into;
}

// ── THE PLANTS ───────────────────────────────────────────────────────────────────────────────────────────────────────
async function plants(ORG, BASE, only) {
  const T = mkdtempSync(join(tmpdir(), "mmach-"));
  const reds = [], greens = [];
  const clause = (id, ok, why) => { (ok ? greens : reds).push(id); console.log(`${ok ? "✓" : "✗"} ${id}${why ? ` — ${why}` : ""}`); };
  let n = 0;
  const tree = (src, o) => plantTree(src, join(T, `t${++n}`), o);
  try {
    const rr = readRecord(ORG);
    const rec = rr.ok ? rr.rec : null;
    const want = (only && only.length ? only : CLAUSES).filter((c) => CLAUSES.includes(c));
    for (const id of want) {
      const mode = /** @type {"broken"|"clean"|"nologin"} */ (MODE_OF[id]);
      const cases = [];
      const check = (name, got, exp, extra = true) => { const ok = got.code === exp && extra; cases.push(ok); console.log(`  ${ok ? "✓" : "✗"} ${id} · ${name} · exit ${got.code} (want ${exp}) — ${got.why}`); };
      // RED on the BASE: the base's own reader and record (none at the cut), the API planted as the build would want it
      const baseT = tree(BASE, {});
      const anySha = rec ? (mode === "broken" ? rec.broken.sha : rec.clean.sha) : "0".repeat(40);
      const baseGot = readClause(mode, baseT, T, { plan: PLAN(anySha, ["RED", rec ? [rec.broken.planted_assert] : []], ["RED", rec ? [rec.broken.planted_assert] : []]), tag: "base" });
      const baseRed = baseGot.code !== 0;
      cases.push(baseRed);
      console.log(`  ${baseRed ? "✓" : "✗"} ${id} · BASE (its own reader and record) · exit ${baseGot.code} (want not 0) — ${baseGot.why}`);
      if (!rec) { clause(id, false, `the build carries no readable record (${rr.ok ? "" : rr.why})`); continue; }
      const bs = rec.broken.base, A = rec.broken.planted_assert;
      const build = tree(ORG, {});
      const noRec = tree(ORG, { record: false });
      if (mode === "broken") {
        check("both legs RED naming the planted assert", readClause(mode, build, T, { plan: PLAN(bs, ["RED", [A]], ["RED", [A]]) }), 0);
        check("RED naming another assert", readClause(mode, build, T, { plan: PLAN(bs, ["RED", ["another assert · x"]], ["RED", ["another assert · x"]]) }), 1);
        check("RED naming it plus another", readClause(mode, build, T, { plan: PLAN(bs, ["RED", [A, "another assert · x"]], ["RED", [A, "another assert · x"]]) }), 1);
        check("one leg RED by name, one GREEN", readClause(mode, build, T, { plan: PLAN(bs, ["RED", [A]], ["GREEN", []]) }), 1);
        check("GREEN", readClause(mode, build, T, { plan: PLAN(bs, ["GREEN", []], ["GREEN", []]) }), 1);
        check("a leg in_progress (PENDING)", readClause(mode, build, T, { plan: PLAN(bs, ["RED", [A]], ["RED", [A]], "in_progress") }), 2);
        check("the API answers 403 (UNREADABLE)", readClause(mode, build, T, { plan: { status: 403, map: [] } }), 2);
        check("no record", readClause(mode, noRec, T, { plan: PLAN(bs, ["RED", [A]], ["RED", [A]]) }), 2);
      } else if (mode === "clean") {
        check("both legs GREEN", readClause(mode, build, T, { plan: PLAN(bs, ["GREEN", []], ["GREEN", []]) }), 0);
        check("one leg RED", readClause(mode, build, T, { plan: PLAN(bs, ["GREEN", []], ["RED", [A]]) }), 1);
        check("no network: the API answers 403 (UNREADABLE, exit 2 is never green)", readClause(mode, build, T, { plan: { status: 403, map: [] } }), 2);
        check("a leg in_progress (PENDING)", readClause(mode, build, T, { plan: PLAN(bs, ["GREEN", []], ["GREEN", []], "in_progress") }), 2);
        check("no record", readClause(mode, noRec, T, { plan: PLAN(bs, ["GREEN", []], ["GREEN", []]) }), 2);
        const other = tree(ORG, { recordOverride: { ...rec, clean: { ...rec.clean, base: "f".repeat(40) } } });
        check("a clean sibling on another base", readClause(mode, other, T, { plan: PLAN(bs, ["GREEN", []], ["GREEN", []]) }), 1);
      } else {
        const dirty = { ...process.env, GITHUB_TOKEN: "planted-not-a-token", GH_TOKEN: "planted-not-a-token", HTTPS_PROXY: "http://planted.invalid", https_proxy: "http://planted.invalid" };
        const g = readClause(mode, build, T, { plan: PLAN(bs, ["GREEN", []], ["GREEN", []]), env: dirty });
        const clean = (g.calls || []).length > 0 && (g.calls || []).length <= 3 && (g.calls || []).every((c) => !c.headers.includes("authorization") && c.tokenEnv.length === 0 && c.proxyEnv.length === 0);
        check(`planted GREEN, a token and a proxy in the PARENT env: the API saw none (${(g.calls || []).length} call(s))`, g, 0, clean);
        check("planted RED (a read, whatever the verdict)", readClause(mode, build, T, { plan: PLAN(bs, ["RED", [A]], ["RED", [A]]), env: dirty }), 0);
        check("the API answers 403 (UNREADABLE)", readClause(mode, build, T, { plan: { status: 403, map: [] } }), 2);
        check("no record", readClause(mode, noRec, T, { plan: PLAN(bs, ["GREEN", []], ["GREEN", []]) }), 2);
        const src = readFileSync(join(ORG, ...VERDICT_REL), "utf8");
        const withAuth = src.replace('"User-Agent": "ci-verdict-reader" }', '"User-Agent": "ci-verdict-reader", Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }');
        const authT = tree(ORG, { verdictSrc: withAuth });
        check("a ci_verdict.mjs that sends an Authorization header (static half)", readClause(mode, authT, T, { plan: PLAN(bs, ["GREEN", []], ["GREEN", []]) }), 1, withAuth !== src);
      }
      clause(id, cases.every(Boolean), "");
    }
    // BOUND
    if (!BASE || !existsSync(BASE)) clause("BOUND", false, "--base-org absent");
    else {
      const a = walk(BASE), b = walk(ORG), diff = [];
      for (const k of new Set([...a.keys(), ...b.keys()])) if (a.get(k) !== b.get(k)) diff.push(k);
      const stray = diff.filter((k) => !OWN_DIRS.some((d) => k.startsWith(d)));
      clause("BOUND", stray.length === 0, `${diff.length} path(s) differ${stray.length ? ` · outside the named files: ${stray.slice(0, 8).join(", ")}${stray.length > 8 ? " …" : ""}` : " · all under ci/witness/mmach/ or ci/mmach/"}`);
    }
  } finally {
    const live = namingProcs(T);
    for (const p of live) { try { process.kill(p); } catch {} }
    clause("LAST", live.length === 0, live.length ? `${live.length} node process(es) named the temp root (killed)` : "no node process names the temp root");
    try { rmSync(T, { recursive: true, force: true }); } catch {}
  }
  if (reds.length) { console.log(`RED MMACH · ${reds.join(", ")}`); return 1; }
  console.log(`GREEN MMACH the machine reads the broken branch RED by name, its clean sibling GREEN, both with no login (planted both ways) · ${greens.length} clause(s)`);
  return 0;
}

// ── main ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
async function main() {
  const mode = argv[0];
  if (mode === "broken" || mode === "clean" || mode === "nologin") {
    const org = resolve(arg("--org") || join(HERE, "..", "..", ".."));
    const root = mkdtempSync(join(tmpdir(), "mmach-read-"));
    let r;
    try { r = readClause(mode, org, root); } finally { try { rmSync(root, { recursive: true, force: true }); } catch {} }
    console.log(`MMACH ${mode} · ${["HOLDS", "RED", "UNREAD"][r.code]} — ${r.why}`);
    return r.code;
  }
  if (!arg("--org")) { console.log("RED MMACH · usage: broken|clean|nologin [--org <dir>] · or --org <dir> --base-org <dir> [--only <clauses>]"); return 1; }
  const only = arg("--only") ? String(arg("--only")).split(",").map((s) => s.trim()).filter(Boolean) : null;
  return plants(resolve(arg("--org")), arg("--base-org") ? resolve(arg("--base-org")) : "", only);
}
process.exitCode = await main();
