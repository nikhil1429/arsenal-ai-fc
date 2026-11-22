#!/usr/bin/env node
// ci/mciq/witness_mciq.mjs — unit mciq (forks row 1256 (2)) · THE WITNESS. Its header is its contract.
// ----------------------------------------------------------------------------------------------------------------------
// USAGE: node ci/mciq/witness_mciq.mjs --org <build tree> --base-org <base tree>
//   An org is any directory holding .github/workflows/suite.yml: a seat's LF tree of a commit, or the plain LF tree the
//   suite's WITNESSES member hands (no .git). The witness never runs in, writes to or reads the state of either org: it
//   COPIES each org's suite.yml under ONE temp root R (mkdtemp under os.tmpdir()) and judges the copies. CRLF-proof (every
//   line split on \r?\n), no POSIX-only shell, no dependency: the YAML read and GitHub's glob are both implemented here.
// THE LAW IT HOLDS (row 1256 (2)): a push to the superseded namespace or to a cloud seat's queue branch draws no run;
//   everything that can land or be adopted still runs both legs — main, land tips, ~~build tips, spec tips,~~ every other ref.
//   RE-CUT by unit mq3 (row 1289 (1), 22 Nov 2026): a seat's build tip (claude/*-build) and spec tip (claude/*-spec) draw no
//   push run either — no landing reads them; the land verb reads the land tip's own two legs.
//   The gate is not loosened: no ref that is ever judged loses a leg.
// GLOB (GitHub's filter pattern cheat sheet, push branches): `*` = any run of characters except `/`; `**` = any run of
//   characters; `?` = zero or one of the preceding character; `+` = one or more of the preceding character; `[...]` = one
//   character of a set or range; `\` escapes; a leading `!` negates. In `branches` the patterns are read IN ORDER and the
//   LAST one that matches a ref decides (a `!` one excludes); a ref no pattern matches does not trigger. `branches-ignore`:
//   a ref triggers iff no pattern matches. Neither key under push (or `on: push`): every branch triggers.
// THE NAMED REFS: main · land/mbank · ~~claude/mbank-build · claude/mjset-spec ·~~ ordinary-branch (must trigger) ·
//   claude/mbank-queue · superseded/mgat-007676e (must not) · RE-CUT by unit mq3: claude/mbank-build · claude/mjset-spec
//   (must not).
// CLAUSES (judged on --org; --base-org is the reference):
//   MAIN   · `main` triggers a push run.
//   LAND   · `land/mbank` triggers (row 1256 (2), named: a land tip is what lands).
//   BUILD  · ~~`claude/mbank-build`, `claude/mjset-spec` and `ordinary-branch` trigger.~~ RE-CUT by unit mq3 (row 1289 (1)):
//            `ordinary-branch` triggers; `claude/mbank-build` and `claude/mjset-spec` do NOT. RED on the base (both run there).
//   IGNORE · `claude/mbank-queue` and `superseded/mgat-007676e` do NOT trigger. RED on the base (both trigger there).
//   LEGS   · every job whose strategy matrix names `node` names both 22 and 24, and npm-test is one of them.
//   KEEP   · pull_request and workflow_dispatch are still triggers, and the concurrency group is keyed by github.ref —
//            and both hold on --base-org (no base given = RED: the witness judges against a base or not at all).
// BOUND (seat-time, not a both-ways clause): every path whose bytes (CRLF folded to LF) differ between the two orgs,
//   node_modules and .git left out, is .github/workflows/suite.yml or a path under ci/mciq/. Only paths are printed.
// LAST: no process whose command line names R survives (from /proc on Linux, Get-CimInstance on Windows, ps elsewhere —
//   never through a shell); R is then removed.
// PORT CLASS (row 1053): binds no port, names no live service, POSTs nothing, restarts nothing, spawns no node child and
//   makes no model call. Every child it spawns (the process read in LAST) carries a timeout derived from the npm-test
//   job's own timeout-minutes in the org's suite.yml — never a number typed here.
// EXIT / LAST LINE: `GREEN MCIQ <what> · <n> clause(s)` (exit 0) or `RED MCIQ · <clauses>` (exit 1).
// EXPORTS (for ci/mciq/run_mutants_mciq.mjs): CLAUSES · REFS · globRe(p) · triggers(yamlText, ref) · readWorkflow(text).
// ----------------------------------------------------------------------------------------------------------------------
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, statSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

export const CLAUSES = ["MAIN", "LAND", "BUILD", "IGNORE", "LEGS", "KEEP", "BOUND", "LAST"];
const WF = join(".github", "workflows", "suite.yml");
/** the named refs, each with what it must do and the clause that judges it */
export const REFS = [
  { ref: "main", run: true, clause: "MAIN" },
  { ref: "land/mbank", run: true, clause: "LAND" },
  { ref: "claude/mbank-build", run: false, clause: "BUILD" },   // ~~run: true~~ RE-CUT by unit mq3 (row 1289 (1))
  { ref: "claude/mjset-spec", run: false, clause: "BUILD" },    // ~~run: true~~ RE-CUT by unit mq3 (row 1289 (1))
  { ref: "ordinary-branch", run: true, clause: "BUILD" },
  { ref: "claude/mbank-queue", run: false, clause: "IGNORE" },
  { ref: "superseded/mgat-007676e", run: false, clause: "IGNORE" },
];
const NAMED = [/^\.github\/workflows\/suite\.yml$/, /^ci\/mciq\//];

/** GitHub's filter glob → an anchored RegExp (the cheat sheet, header GLOB) @param {string} p */
export function globRe(p) {
  let s = "";
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === "\\" && i + 1 < p.length) { s += p[++i].replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"); continue; }
    if (c === "*") { if (p[i + 1] === "*") { s += ".*"; i++; } else s += "[^/]*"; continue; }
    if (c === "?" || c === "+") { s += c; continue; }                    // applies to the preceding character, as in RegExp
    if (c === "[") { const j = p.indexOf("]", i + 1); if (j > i) { s += `[${p.slice(i + 1, j).replace(/\\/g, "\\\\")}]`; i = j; continue; } }
    s += c.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  }
  return new RegExp(`^${s}$`);
}
/** strip quotes from a YAML scalar @param {string} v */
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
const indent = (l) => /^ */.exec(l)[0].length;
const strip = (l) => l.replace(/\s+#.*$/, "").replace(/^\s*#.*$/, "");
/** the block of lines under the key at <i> (deeper than its indent) @param {string[]} L @param {number} i */
function block(L, i) {
  const d = indent(L[i]), out = [];
  for (let k = i + 1; k < L.length; k++) { if (!strip(L[k]).trim()) continue; if (indent(L[k]) <= d) break; out.push(L[k]); }
  return out;
}
/** a key's value inside a block: scalar, flow list, block list, or a mapping (lines) @param {string[]} B @param {string} key */
function keyIn(B, key) {
  if (!B.length) return undefined;
  const d = Math.min(...B.map(indent));
  for (let k = 0; k < B.length; k++) {
    const l = strip(B[k]);
    if (indent(B[k]) !== d) continue;
    const m = new RegExp(`^\\s*["']?${key.replace(/[-]/g, "\\-")}["']?\\s*:(.*)$`).exec(l);
    if (!m) continue;
    const v = m[1].trim();
    if (v.startsWith("[")) return { list: flow(v) };
    if (v && v !== "|" && v !== ">") return { scalar: unq(v) };
    const sub = block(B, k);
    if (sub.length && /^\s*- /.test(strip(sub[0]))) return { list: sub.map(strip).filter((x) => /^\s*- /.test(x)).map((x) => unq(x.replace(/^\s*- /, ""))) };
    return { map: sub };
  }
  return undefined;
}
/** the parts of suite.yml this witness judges @param {string} text */
export function readWorkflow(text) {
  const L = String(text).split(/\r?\n/);
  const top = L.map((l, i) => ({ l: strip(l), i })).filter((x) => x.l.trim() && indent(x.l) === 0);
  const root = top.map((x) => L[x.i]);
  const all = L.filter((l) => strip(l).trim());
  const on = keyIn(root.length ? all : [], "on") || keyIn(all, "true");
  /** @type {{events: string[], push: {branches?: string[], ignore?: string[]} | null}} */
  const r = { events: [], push: null };
  if (on?.scalar) { r.events = [on.scalar]; if (on.scalar === "push") r.push = {}; }
  else if (on?.list) { r.events = on.list; if (on.list.includes("push")) r.push = {}; }
  else if (on?.map) {
    const d = Math.min(...on.map.map(indent));
    r.events = on.map.filter((l) => indent(l) === d).map((l) => (/^\s*["']?([\w-]+)["']?\s*:/.exec(strip(l)) || [])[1]).filter(Boolean);
    const p = keyIn(on.map, "push");
    if (p) {
      r.push = {};
      if (p.map) {
        const b = keyIn(p.map, "branches"), ig = keyIn(p.map, "branches-ignore");
        if (b) r.push.branches = b.list || (b.scalar ? [b.scalar] : []);
        if (ig) r.push.ignore = ig.list || (ig.scalar ? [ig.scalar] : []);
        if (!b && !ig && (keyIn(p.map, "tags") || keyIn(p.map, "tags-ignore"))) r.push.branches = [];   // tags only: no branch runs
      }
    }
  }
  const conc = keyIn(all, "concurrency");
  const group = conc?.map ? keyIn(conc.map, "group")?.scalar || "" : conc?.scalar || "";
  // the jobs, each with its matrix's node list (when it names one)
  const jobs = {};
  const jk = L.findIndex((l) => /^jobs\s*:/.test(strip(l)));
  if (jk >= 0) {
    const J = block(L, jk), d = Math.min(...J.map(indent));
    J.forEach((l, k) => {
      if (indent(l) !== d) return;
      const name = (/^\s*([\w-]+)\s*:/.exec(strip(l)) || [])[1];
      if (!name) return;
      const own = []; for (let q = k + 1; q < J.length && indent(J[q]) > d; q++) own.push(J[q]);
      const st = keyIn(own, "strategy"), mx = st?.map ? keyIn(st.map, "matrix") : undefined, node = mx?.map ? keyIn(mx.map, "node") : undefined;
      jobs[name] = { node: node ? (node.list || [node.scalar]).map(String) : null, timeout: Number(keyIn(own, "timeout-minutes")?.scalar) || null };
    });
  }
  return { ...r, group, jobs };
}
/** does a push to <ref> trigger the workflow? @param {ReturnType<typeof readWorkflow>} w @param {string} ref */
export function decide(w, ref) {
  if (!w.push) return false;
  if (w.push.branches) {
    let hit = false;
    for (const p of w.push.branches) { const neg = p.startsWith("!"); if (globRe(neg ? p.slice(1) : p).test(ref)) hit = !neg; }
    return hit;
  }
  if (w.push.ignore) return !w.push.ignore.some((p) => globRe(p).test(ref));
  return true;
}
/** @param {string} text @param {string} ref */
export const triggers = (text, ref) => decide(readWorkflow(text), ref);

/** path → sha256 of LF-folded bytes, node_modules and .git left out @param {string} root */
function hashes(root) {
  const m = new Map();
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n), rel = relative(root, p).split(sep).join("/");
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
  if (!org || !existsSync(join(org, WF))) { console.log(`RED MCIQ · ORG (no ${WF.split(sep).join("/")} under --org)`); process.exit(1); }
  const R = mkdtempSync(join(tmpdir(), "mciq-"));
  /** @type {Record<string, {ok: boolean, why: string}>} */
  const v = {};
  try {
    mkdirSync(join(R, "org")); writeFileSync(join(R, "org", "suite.yml"), readFileSync(join(org, WF)));
    const hasBase = !!baseOrg && existsSync(join(baseOrg, WF));
    if (hasBase) { mkdirSync(join(R, "base")); writeFileSync(join(R, "base", "suite.yml"), readFileSync(join(baseOrg, WF))); }
    const w = readWorkflow(readFileSync(join(R, "org", "suite.yml"), "utf8"));
    const b = hasBase ? readWorkflow(readFileSync(join(R, "base", "suite.yml"), "utf8")) : null;
    console.log(`MCIQ push filter · org ${JSON.stringify(w.push)} · base ${b ? JSON.stringify(b.push) : "(none)"}`);
    for (const r of REFS) {
      const got = decide(w, r.ref), was = b ? decide(b, r.ref) : null;
      console.log(`  TRIGGER ${r.ref.padEnd(26)} · org ${got ? "runs" : "no run"} · base ${was === null ? "-" : was ? "runs" : "no run"} · must ${r.run ? "run" : "not run"} (${r.clause})`);
    }
    for (const c of ["MAIN", "LAND", "BUILD", "IGNORE"]) {
      const bad = REFS.filter((r) => r.clause === c && decide(w, r.ref) !== r.run);
      v[c] = { ok: bad.length === 0, why: bad.map((r) => `${r.ref} ${r.run ? "draws no run" : "draws a run"}`).join(" · ") };
    }
    const legged = Object.entries(w.jobs).filter(([, j]) => j.node);
    const short = legged.filter(([, j]) => !(j.node.includes("22") && j.node.includes("24")));
    v.LEGS = { ok: !!w.jobs["npm-test"]?.node && short.length === 0, why: !w.jobs["npm-test"]?.node ? "npm-test names no node matrix" : short.map(([n, j]) => `${n} legs [${j.node}]`).join(" · ") };
    const keep = (x) => x.events.includes("pull_request") && x.events.includes("workflow_dispatch") && /github\.ref\b/.test(x.group);
    v.KEEP = { ok: !!b && keep(w) && keep(b), why: !b ? "no --base-org: nothing to judge against" : `org events [${w.events}] group "${w.group}" · base events [${b.events}] group "${b.group}"` };
    if (hasBase) {
      const ho = hashes(org), hb = hashes(/** @type {string} */ (baseOrg));
      const diff = [...new Set([...ho.keys(), ...hb.keys()])].filter((p) => ho.get(p) !== hb.get(p)).sort();
      const beyond = diff.filter((p) => !NAMED.some((re) => re.test(p)));
      v.BOUND = { ok: beyond.length === 0, why: `${beyond.length} path(s) beyond the named files: ${beyond.slice(0, 12).join(" · ")}${beyond.length > 12 ? ` (+${beyond.length - 12})` : ""}` };
      console.log(`MCIQ bound · ${diff.length} path(s) differ from --base-org · ${diff.length - beyond.length} named`);
    } else v.BOUND = { ok: false, why: "no --base-org" };
    const min = w.jobs["npm-test"]?.timeout || b?.jobs["npm-test"]?.timeout || 0;
    const left = min > 0 ? naming(R, min * 60000) : null;
    v.LAST = { ok: !!left && left.length === 0, why: !left ? "no npm-test timeout-minutes to bound the process read" : `pid(s) ${left.join(" ")}` };
  } finally {
    rmSync(R, { recursive: true, force: true });
  }
  const reds = CLAUSES.filter((c) => v[c] && !v[c].ok);
  for (const c of CLAUSES) if (v[c]) console.log(`  ${v[c].ok ? "ok  " : "FAIL"} MCIQ ${c}${v[c].ok ? "" : ` · ${v[c].why}`}`);
  if (reds.length) { console.log(`RED MCIQ · ${reds.join(", ")}`); process.exit(1); }
  // ~~GREEN MCIQ the push trigger runs main, land/**, claude/*-build, claude/*-spec and every other branch and draws no run for superseded/** or claude/*-queue~~ (RE-CUT by unit mq3)
  console.log(`GREEN MCIQ the push trigger runs main, land/** and every other branch and draws no run for superseded/**, claude/*-queue, claude/*-build or claude/*-spec, both legs and the other triggers kept · ${CLAUSES.length} clause(s)`);
  process.exit(0);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
