#!/usr/bin/env node
// ci/mq3/witness_mq3.mjs — unit mq3 (forks row 1289 (1)) · THE WITNESS. Its header is its contract.
// ----------------------------------------------------------------------------------------------------------------------
// USAGE: node ci/mq3/witness_mq3.mjs --org <build tree> --base-org <base tree>
//   An org is any directory holding .github/workflows/suite.yml: a seat's LF tree of a commit, or the plain LF tree the
//   suite's WITNESSES member hands (no .git). The witness never runs in, writes to or reads the state of either org: it
//   COPIES each org's suite.yml under ONE temp root R (mkdtemp under os.tmpdir()) and judges the copies. CRLF-proof (every
//   line split on \r?\n), no POSIX-only shell, no dependency: the YAML read and GitHub's glob are both implemented here.
// THE LAW IT HOLDS (row 1289 (1)): a push to a seat's build or spec branch (claude/*-build, claude/*-spec) draws no run,
//   beside mciq's superseded/** and claude/*-queue; main, every land tip and every other branch still draw a run with both
//   legs. No gate is loosened: nothing lands except on a land tip's own two legs, both node versions.
// GLOB (GitHub's filter pattern cheat sheet, push branches): `*` = any run of characters except `/`; `**` = any run of
//   characters; `?` = zero or one of the preceding character; `+` = one or more of the preceding character; `[...]` = one
//   character of a set or range; `\` escapes; a leading `!` negates. In `branches` the patterns are read IN ORDER and the
//   LAST one that matches a ref decides (a `!` one excludes); a ref no pattern matches does not trigger. `branches-ignore`:
//   a ref triggers iff no pattern matches. No `branches` / `branches-ignore` under push: every branch triggers.
// THE NAMED REFS, each with its clause (BY NAME — the witness prints every ref with org and base verdicts):
//   MAIN   · `main` draws a run.
//   LAND   · `land/mjset`, `land/mq3-build`, `land/maud43-spec` draw a run (a land tip runs whatever its unit's name ends in:
//            an exclusion written wider than claude/ must never swallow one).
//   OTHER  · `claude/some-other-branch` and `ordinary-branch` draw a run (a claude/* branch with any other suffix, an
//            ordinary branch).
//   BUILD  · `claude/mbank-build` draws NO run. RED on the base (it runs there).
//   SPEC   · `claude/maud43-spec` draws NO run. RED on the base (it runs there).
//   IGNORE · `claude/mbank-queue` and `superseded/mgat-007676e` draw NO run (mciq's two, kept).
// AND:
//   LEGS   · every job whose strategy matrix names `node` names both 22 and 24, and npm-test is one of them.
//   KEEP   · the `pull_request` and `workflow_dispatch` trigger lines and the top-level `concurrency:` block are present and
//            BYTE-EQUAL (CRLF folded) to --base-org's (no base given = RED: the witness judges against a base or not at all).
// BOUND (seat-time, not a both-ways clause): every path whose bytes (CRLF folded to LF) differ between the two orgs,
//   node_modules and .git left out, is .github/workflows/suite.yml, ci/mciq/witness_mciq.mjs, ci/mciq/run_mutants_mciq.mjs
//   or a path under ci/mq3/. Only paths are printed.
// LAST: no process whose command line names R survives (from /proc on Linux, Get-CimInstance on Windows, ps elsewhere —
//   never through a shell); R is then removed.
// PORT CLASS (row 1053): binds no port, names no live service, POSTs nothing, restarts nothing, spawns no node child and
//   makes no model call. The one child it may spawn (the process read in LAST) carries a timeout derived from the npm-test
//   job's own timeout-minutes in the org's suite.yml — never a number typed here.
// EXIT / LAST LINE: `GREEN MQ3 <what> · <n> clause(s)` (exit 0) or `RED MQ3 · <clauses>` (exit 1).
// EXPORTS (for ci/mq3/run_mutants_mq3.mjs): CLAUSES · REFS · globRe(p) · readPush(text) · decide(push, ref).
// ----------------------------------------------------------------------------------------------------------------------
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, statSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

export const CLAUSES = ["MAIN", "LAND", "OTHER", "BUILD", "SPEC", "IGNORE", "LEGS", "KEEP", "BOUND", "LAST"];
const WF = join(".github", "workflows", "suite.yml");
/** the named refs, each with whether a push to it must draw a run and the clause that judges it */
export const REFS = [
  { ref: "main", run: true, clause: "MAIN" },
  { ref: "land/mjset", run: true, clause: "LAND" },
  { ref: "land/mq3-build", run: true, clause: "LAND" },
  { ref: "land/maud43-spec", run: true, clause: "LAND" },
  { ref: "claude/some-other-branch", run: true, clause: "OTHER" },
  { ref: "ordinary-branch", run: true, clause: "OTHER" },
  { ref: "claude/mbank-build", run: false, clause: "BUILD" },
  { ref: "claude/maud43-spec", run: false, clause: "SPEC" },
  { ref: "claude/mbank-queue", run: false, clause: "IGNORE" },
  { ref: "superseded/mgat-007676e", run: false, clause: "IGNORE" },
];
const NAMED = [/^\.github\/workflows\/suite\.yml$/, /^ci\/mciq\/witness_mciq\.mjs$/, /^ci\/mciq\/run_mutants_mciq\.mjs$/, /^ci\/mq3\//];
const REX = /[.*+?^${}()|[\]\\/]/g;

/** GitHub's filter glob → an anchored RegExp (the cheat sheet, header GLOB) @param {string} p */
export function globRe(p) {
  let s = "";
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === "\\" && i + 1 < p.length) { s += p[++i].replace(REX, "\\$&"); continue; }
    if (c === "*") { if (p[i + 1] === "*") { s += ".*"; i++; } else s += "[^/]*"; continue; }
    if ((c === "?" || c === "+") && s) { s += c; continue; }              // applies to the preceding character
    if (c === "[") { const j = p.indexOf("]", i + 1); if (j > i + 1) { s += `[${p.slice(i + 1, j).replace(/\\/g, "\\\\")}]`; i = j; continue; } }
    s += c.replace(REX, "\\$&");
  }
  return new RegExp(`^${s}$`);
}

const indent = (l) => /^ */.exec(l)[0].length;
/** a line with its comment removed (a `#` outside quotes that starts the line or follows a space) @param {string} l */
function strip(l) {
  let q = "";
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (q) { if (c === q) q = ""; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === "#" && (i === 0 || /\s/.test(l[i - 1]))) return l.slice(0, i).replace(/\s+$/, "");
  }
  return l.replace(/\s+$/, "");
}
const unq = (v) => { const t = v.trim(); return /^(["']).*\1$/.test(t) ? t.slice(1, -1) : t; };
/** a flow list `[a, "b"]` → items @param {string} v */
function flow(v) {
  const t = v.trim().replace(/^\[/, "").replace(/\]$/, "");
  const out = []; let cur = "", q = "";
  for (const c of t) {
    if (q) { if (c === q) q = ""; else cur += c; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === ",") { if (cur.trim()) out.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
/** the index range [from, to) of the block under the line at <i> (lines deeper than it) @param {string[]} L @param {number} i */
function blockEnd(L, i) {
  const d = indent(L[i]);
  let k = i + 1, last = i + 1;
  for (; k < L.length; k++) { if (!strip(L[k]).trim()) continue; if (indent(L[k]) <= d) break; last = k + 1; }
  return last;
}
/** the line index of key <key> among the direct children of [from, to) (null = top level) @param {string[]} L */
function childKey(L, from, to, key) {
  let d = -1;
  for (let k = from; k < to; k++) {
    const s = strip(L[k]);
    if (!s.trim()) continue;
    if (d < 0) d = indent(L[k]);
    if (indent(L[k]) !== d) continue;
    if (new RegExp(`^\\s*["']?${key.replace(/-/g, "\\-")}["']?\\s*:(\\s|$)`).test(s)) return k;
  }
  return -1;
}
/** a list value at the key line <k>: flow, block, or one scalar @param {string[]} L @param {number} k */
function listAt(L, k) {
  const v = strip(L[k]).replace(/^[^:]*:/, "").trim();
  if (v.startsWith("[")) return flow(v);
  if (v) return [unq(v)];
  const out = [];
  for (let q = k + 1; q < blockEnd(L, k); q++) { const s = strip(L[q]); if (/^\s*- /.test(s)) out.push(unq(s.replace(/^\s*- /, ""))); }
  return out;
}
/** the top-level `on:` key (YAML 1.1 may write it quoted) @param {string[]} L */
const onKey = (L) => L.findIndex((l) => /^["']?on["']?\s*:/.test(strip(l)));

/** the push filter of suite.yml: null = push is not a trigger @param {string} text */
export function readPush(text) {
  const L = String(text).split(/\r?\n/), o = onKey(L);
  if (o < 0) return null;
  const v = strip(L[o]).replace(/^[^:]*:/, "").trim();
  if (v) { const ev = v.startsWith("[") ? flow(v) : [unq(v)]; return ev.includes("push") ? {} : null; }
  const end = blockEnd(L, o), p = childKey(L, o + 1, end, "push");
  if (p < 0) return null;
  const pe = blockEnd(L, p), b = childKey(L, p + 1, pe, "branches"), ig = childKey(L, p + 1, pe, "branches-ignore");
  /** @type {{branches?: string[], ignore?: string[]}} */
  const r = {};
  if (b >= 0) r.branches = listAt(L, b);
  if (ig >= 0) r.ignore = listAt(L, ig);
  if (b < 0 && ig < 0 && (childKey(L, p + 1, pe, "tags") >= 0 || childKey(L, p + 1, pe, "tags-ignore") >= 0)) r.branches = [];
  return r;
}
/** does a push to <ref> draw a run? @param {ReturnType<typeof readPush>} push @param {string} ref */
export function decide(push, ref) {
  if (!push) return false;
  if (push.branches) {
    let hit = false;
    for (const p of push.branches) { const neg = p.startsWith("!"); if (globRe(neg ? p.slice(1) : p).test(ref)) hit = !neg; }
    return hit;
  }
  if (push.ignore) return !push.ignore.some((p) => globRe(p).test(ref));
  return true;
}
/** the KEEP text: the pull_request + workflow_dispatch trigger blocks and the top-level concurrency block @param {string} text */
export function keepText(text) {
  const L = String(text).split(/\r?\n/), o = onKey(L);
  const take = (k) => (k < 0 ? null : L.slice(k, blockEnd(L, k)).map((l) => l.replace(/\s+$/, "")).join("\n"));
  const end = o < 0 ? -1 : blockEnd(L, o);
  const pr = o < 0 ? null : take(childKey(L, o + 1, end, "pull_request"));
  const wd = o < 0 ? null : take(childKey(L, o + 1, end, "workflow_dispatch"));
  const cc = take(L.findIndex((l) => /^concurrency\s*:/.test(strip(l))));
  return { pr, wd, cc };
}
/** each job's matrix node list (null when it names none) and timeout-minutes @param {string} text */
export function readJobs(text) {
  const L = String(text).split(/\r?\n/), jk = L.findIndex((l) => /^jobs\s*:/.test(strip(l)));
  /** @type {Record<string, {node: string[]|null, timeout: number|null}>} */
  const jobs = {};
  if (jk < 0) return jobs;
  const end = blockEnd(L, jk);
  let d = -1;
  for (let k = jk + 1; k < end; k++) {
    if (!strip(L[k]).trim()) continue;
    if (d < 0) d = indent(L[k]);
    if (indent(L[k]) !== d) continue;
    const name = (/^\s*([\w-]+)\s*:/.exec(strip(L[k])) || [])[1];
    if (!name) continue;
    const je = blockEnd(L, k), st = childKey(L, k + 1, je, "strategy");
    const mx = st < 0 ? -1 : childKey(L, st + 1, blockEnd(L, st), "matrix");
    const nd = mx < 0 ? -1 : childKey(L, mx + 1, blockEnd(L, mx), "node");
    const tm = childKey(L, k + 1, je, "timeout-minutes");
    jobs[name] = { node: nd < 0 ? null : listAt(L, nd).map(String), timeout: tm < 0 ? null : Number(unq(strip(L[tm]).replace(/^[^:]*:/, ""))) || null };
  }
  return jobs;
}

/** path → sha256 of LF-folded bytes, node_modules and .git left out @param {string} root */
function hashes(root) {
  const m = new Map();
  const walk = (dir) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n), rel = relative(root, p).split(sep).join("/");
      if (rel === "node_modules" || rel === ".git" || rel.startsWith("node_modules/")) continue;
      let s; try { s = statSync(p); } catch { continue; }
      if (s.isDirectory()) walk(p);
      else if (s.isFile()) m.set(rel, createHash("sha256").update(readFileSync(p).toString("latin1").replace(/\r\n/g, "\n"), "latin1").digest("hex"));
    }
  };
  walk(root);
  return m;
}
/** processes whose command line names <dir> @param {string} dir @param {number} ms */
function naming(dir, ms) {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true, timeout: ms });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.toLowerCase().includes(dir.toLowerCase())).map((l) => Number(l.trim().split(" ")[0])).filter((p) => p && p !== process.pid);
  }
  if (existsSync("/proc")) {
    const out = [];
    for (const p of readdirSync("/proc")) {
      if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
      try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(dir)) out.push(Number(p)); } catch { /* gone */ }
    }
    return out;
  }
  const r = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8", timeout: ms });
  return String(r.stdout || "").split(/\r?\n/).filter((l) => l.includes(dir)).map((l) => Number(l.trim().split(/\s+/)[0])).filter((p) => p && p !== process.pid);
}

function main() {
  const a = process.argv.slice(2), arg = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  const org = arg("--org") ? resolve(String(arg("--org"))) : null, baseOrg = arg("--base-org") ? resolve(String(arg("--base-org"))) : null;
  if (!org || !existsSync(join(org, WF))) { console.log("RED MQ3 · ORG (no .github/workflows/suite.yml under --org)"); process.exit(1); }
  const R = mkdtempSync(join(tmpdir(), "mq3-"));
  /** @type {Record<string, {ok: boolean, why: string}>} */
  const v = {};
  try {
    mkdirSync(join(R, "org")); writeFileSync(join(R, "org", "suite.yml"), readFileSync(join(org, WF)));
    const hasBase = !!baseOrg && existsSync(join(baseOrg, WF));
    if (hasBase) { mkdirSync(join(R, "base")); writeFileSync(join(R, "base", "suite.yml"), readFileSync(join(/** @type {string} */ (baseOrg), WF))); }
    const ot = readFileSync(join(R, "org", "suite.yml"), "utf8"), bt = hasBase ? readFileSync(join(R, "base", "suite.yml"), "utf8") : null;
    const w = readPush(ot), b = bt === null ? undefined : readPush(bt);
    console.log(`MQ3 push filter · org ${JSON.stringify(w)} · base ${b === undefined ? "(none)" : JSON.stringify(b)}`);
    for (const r of REFS) {
      const got = decide(w, r.ref), was = b === undefined ? null : decide(b, r.ref);
      console.log(`  REF ${r.ref.padEnd(26)} · org ${got ? "draws a run" : "no run"} · base ${was === null ? "-" : was ? "draws a run" : "no run"} · must ${r.run ? "draw a run" : "draw no run"} (${r.clause})`);
    }
    for (const c of ["MAIN", "LAND", "OTHER", "BUILD", "SPEC", "IGNORE"]) {
      const bad = REFS.filter((r) => r.clause === c && decide(w, r.ref) !== r.run);
      v[c] = { ok: bad.length === 0, why: bad.map((r) => `${r.ref} ${r.run ? "draws no run" : "draws a run"}`).join(" · ") };
    }
    const jobs = readJobs(ot), legged = Object.entries(jobs).filter(([, j]) => j.node);
    const short = legged.filter(([, j]) => !(j.node?.includes("22") && j.node?.includes("24")));
    v.LEGS = { ok: !!jobs["npm-test"]?.node && short.length === 0, why: !jobs["npm-test"]?.node ? "npm-test names no node matrix" : short.map(([n, j]) => `${n} legs [${j.node}]`).join(" · ") };
    if (bt !== null) {
      const ko = keepText(ot), kb = keepText(bt);
      const bad = ["pr", "wd", "cc"].filter((k) => ko[k] === null || kb[k] === null || ko[k] !== kb[k]);
      v.KEEP = { ok: bad.length === 0, why: bad.map((k) => ({ pr: "pull_request", wd: "workflow_dispatch", cc: "concurrency" })[k] + (ko[k] === null ? " absent" : " differs from the base")).join(" · ") };
    } else v.KEEP = { ok: false, why: "no --base-org: nothing to judge against" };
    if (hasBase) {
      const ho = hashes(org), hb = hashes(/** @type {string} */ (baseOrg));
      const diff = [...new Set([...ho.keys(), ...hb.keys()])].filter((p) => ho.get(p) !== hb.get(p)).sort();
      const beyond = diff.filter((p) => !NAMED.some((re) => re.test(p)));
      v.BOUND = { ok: beyond.length === 0, why: `${beyond.length} path(s) beyond the named files: ${beyond.slice(0, 12).join(" · ")}${beyond.length > 12 ? ` (+${beyond.length - 12})` : ""}` };
      console.log(`MQ3 bound · ${diff.length} path(s) differ from --base-org · ${diff.length - beyond.length} named`);
    } else v.BOUND = { ok: false, why: "no --base-org" };
    const min = jobs["npm-test"]?.timeout || (bt !== null ? readJobs(bt)["npm-test"]?.timeout : 0) || 0;
    const left = min > 0 ? naming(R, min * 60000) : null;
    v.LAST = { ok: !!left && left.length === 0, why: !left ? "no npm-test timeout-minutes to bound the process read" : `pid(s) ${left.join(" ")}` };
  } finally {
    rmSync(R, { recursive: true, force: true });
  }
  const reds = CLAUSES.filter((c) => v[c] && !v[c].ok);
  for (const c of CLAUSES) if (v[c]) console.log(`  ${v[c].ok ? "ok  " : "FAIL"} MQ3 ${c}${v[c].ok ? "" : ` · ${v[c].why}`}`);
  if (reds.length) { console.log(`RED MQ3 · ${reds.join(", ")}`); process.exit(1); }
  console.log(`GREEN MQ3 a push to main, land/** and every other branch draws a run and claude/*-build, claude/*-spec, claude/*-queue and superseded/** draw none, both legs and the other triggers byte-kept · ${CLAUSES.length} clause(s)`);
  process.exit(0);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
