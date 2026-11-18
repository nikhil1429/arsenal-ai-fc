#!/usr/bin/env node
// ============================================================================
// ci/mgrd/witness_mgrd.mjs — WITNESS of unit mgrd (THE STATE PUSH MEETS ORIGIN)
// ----------------------------------------------------------------------------
// CONTRACT (ruling row 1029 (3); spec ci/mcr/B2_SPEC.md §4, clauses G1–G3 on branch claude/mcr-b2-spec):
//   node ci/mgrd/witness_mgrd.mjs --org <build tree> --base-org <base tree>
// Every plant is REAL git on copies under os.tmpdir(): a bare repo as origin, a "laptop" clone that runs
// `node scripts/groundsman.mjs push` (the unattended state push, task ArsenalFC-Groundsman-Push), and a second
// clone that moves origin. The tree under judgement contributes scripts/groundsman.mjs and scripts/daykey.mjs only;
// scripts/captains_call.mjs and scripts/awayday.mjs are planted RECORDERS (they write the argv they were given to a
// log under the temp dir — no card is ever really filed, no network is touched).
//   G1  own state commits + origin moved by a NON-state commit → rebuilt on origin's head by plumbing, pushed, own state
//       bytes intact, origin's commit an ancestor, no force; AND origin moved a STATE path → idle STATE-CONFLICT,
//       nothing rewritten, ONE card key (the same key on a second night).
//   G2  no own commit + origin moved → fast-forward, a dirty state file's bytes carried, pushed; AND a dirty path that
//       origin moved → idle DIRTY-PATH, his bytes unchanged, HEAD unmoved, ONE card key.
//   G3  the fetch comes EVERY night before staging: on a night with nothing to stage the tracking ref still meets
//       origin; and a foreign unpushed commit is still HELD (refused, no push) after the fetch.
// Each clause runs on --base-org (must be RED: the base never fetched) and on --org (must be GREEN).
// BOUND: only scripts/groundsman.mjs and ci/mgrd/ differ between the two trees.
// LAST: no node process naming the temp dir survives.
// LAST LINE: GREEN MGRD state push meets origin · <n> clause(s)  (exit 0)  ·  RED MGRD · <clauses>  (exit 1)
// ============================================================================
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync, copyFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
if (!ORG || !BASE) { console.log("RED MGRD · usage: --org <dir> --base-org <dir>"); process.exit(1); }
const NAMED = ["scripts/groundsman.mjs"], NAMED_DIRS = ["ci/mgrd/"];
const ROOT = mkdtempSync(join(os.tmpdir(), "witness-mgrd-"));
const STATE = "dressing-room/state";
let seq = 0;

function git(cwd, args, ok = true) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  if (ok && r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.stderr}`);
  return { status: r.status, out: (r.stdout || "").trim(), err: r.stderr || "" };
}
const cfg = (cwd) => { for (const [k, v] of [["user.name", "witness"], ["user.email", "witness@example.invalid"], ["core.autocrlf", "false"], ["commit.gpgsign", "false"]]) git(cwd, ["config", k, v]); };
const put = (dir, rel, text) => { const p = join(dir, ...rel.split("/")); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, text); };
const read = (dir, rel) => { try { return readFileSync(join(dir, ...rel.split("/")), "utf8"); } catch { return null; } };
const RECORDER = `import { appendFileSync } from "node:fs";\nappendFileSync(process.env.MGRD_LOG, JSON.stringify(process.argv.slice(1)) + "\\n");\n`;

// one sandbox per plant: origin (bare) · seed history · laptop clone · other clone
function sandbox(tree) {
  const dir = join(ROOT, `s${++seq}`);
  const origin = join(dir, "origin.git"), seed = join(dir, "seed"), laptop = join(dir, "laptop"), other = join(dir, "other");
  mkdirSync(seed, { recursive: true });
  git(dir, ["init", "-q", "--bare", "-b", "main", origin]);
  git(seed, ["init", "-q", "-b", "main"]); cfg(seed);
  for (const f of ["scripts/groundsman.mjs", "scripts/daykey.mjs"]) put(seed, f, readFileSync(join(tree, ...f.split("/")), "utf8"));
  put(seed, "scripts/captains_call.mjs", RECORDER); put(seed, "scripts/awayday.mjs", RECORDER);
  put(seed, `${STATE}/a.json`, "{\"a\":0}\n"); put(seed, `${STATE}/b.json`, "{\"b\":0}\n"); put(seed, `${STATE}/c.json`, "{\"c\":0}\n");
  put(seed, "README.md", "seed\n"); put(seed, "notes/x.txt", "x0\n");
  git(seed, ["add", "-A"]); git(seed, ["commit", "-q", "-m", "seed"]);
  git(seed, ["remote", "add", "origin", origin]); git(seed, ["push", "-q", "origin", "main"]);
  for (const c of [laptop, other]) { git(dir, ["clone", "-q", origin, c]); cfg(c); }
  const log = join(dir, "calls.log");
  const night = () => {
    const r = spawnSync(process.execPath, [join(laptop, "scripts", "groundsman.mjs"), "push"], { cwd: laptop, encoding: "utf8", windowsHide: true, env: { ...process.env, MGRD_LOG: log } });
    return (r.stdout || "") + (r.stderr || "");
  };
  const cards = () => (read(dir, "calls.log") || "").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)).filter((a) => a.includes("file"))
    .map((a) => a[a.indexOf("--key") + 1]);
  const moveOrigin = (rel, text, msg) => { put(other, rel, text); git(other, ["add", "-A"]); git(other, ["commit", "-q", "-m", msg]); git(other, ["push", "-q", "origin", "main"]); return git(other, ["rev-parse", "HEAD"]).out; };
  const ownCommit = (rel, text) => { put(laptop, rel, text); git(laptop, ["add", "--", rel]); git(laptop, ["commit", "-q", "-m", "groundsman: unattended state push (laptop) — his 9 Aug 2026 ruling, receipt in pushOnlyPass"]); return git(laptop, ["rev-parse", "HEAD"]).out; };
  const originHead = () => git(origin, ["rev-parse", "main"]).out;
  const isAnc = (a, b, cwd = laptop) => git(cwd, ["merge-base", "--is-ancestor", a, b], false).status === 0;
  return { dir, origin, laptop, other, night, cards, moveOrigin, ownCommit, originHead, isAnc };
}

// ── the clauses: each returns { ok, why } for one tree ─────────────────────────
const CLAUSES = {
  G1(tree) {
    // (a) own state commit + origin moved by a NON-state commit → rebuilt, pushed
    const s = sandbox(tree);
    const moved = s.moveOrigin("notes/x.txt", "x1 landed\n", "a landing moved origin");
    s.ownCommit(`${STATE}/a.json`, "{\"a\":\"own\"}\n");
    put(s.laptop, `${STATE}/b.json`, "{\"b\":\"tonight\"}\n");
    const out = s.night();
    const head = git(s.laptop, ["rev-parse", "HEAD"]).out, o = s.originHead();
    const shown = (rel) => git(s.origin, ["show", `main:${rel}`], false).out;
    const a = o === head && s.isAnc(moved, o, s.origin) && shown(`${STATE}/a.json`) === "{\"a\":\"own\"}" && shown(`${STATE}/b.json`) === "{\"b\":\"tonight\"}"
      && shown("notes/x.txt") === "x1 landed" && read(s.laptop, "notes/x.txt") === "x1 landed\n"
      && git(s.origin, ["log", "--format=%s", "main"]).out.split("\n").filter((x) => x.startsWith("groundsman: unattended")).length === 2;
    // (b) origin moved a STATE path + own state commit → idle STATE-CONFLICT, nothing rewritten, ONE key
    const t = sandbox(tree);
    const o0 = t.moveOrigin(`${STATE}/c.json`, "{\"c\":\"elsewhere\"}\n", "a state commit from elsewhere");
    const own = t.ownCommit(`${STATE}/a.json`, "{\"a\":\"own\"}\n");
    const out2 = t.night(); t.night();
    const k = t.cards().filter((x) => /^groundsman:conflict:/.test(x));
    const b = /STATE-CONFLICT/.test(out2) && git(t.laptop, ["rev-parse", "HEAD"]).out === own && t.originHead() === o0 && k.length >= 1 && new Set(k).size === 1;
    return { ok: a && b, why: `rebuilt+pushed ${a} (${out.split(/\r?\n/).find((l) => /push-only/.test(l)) || "?"}) · conflict idles one key ${b}` };
  },
  G2(tree) {
    // (a) no own commit, origin moved, a dirty state file → ff, the dirty bytes carried, then pushed
    const s = sandbox(tree);
    const moved = s.moveOrigin("README.md", "moved\n", "a landing moved origin");
    put(s.laptop, `${STATE}/a.json`, "{\"a\":\"dirty\"}\n");
    s.night();
    const o = s.originHead();
    const a = s.isAnc(moved, o, s.origin) && git(s.origin, ["show", `main:${STATE}/a.json`], false).out === "{\"a\":\"dirty\"}"
      && git(s.laptop, ["rev-parse", "HEAD"]).out === o && read(s.laptop, "README.md") === "moved\n";
    // (b) a dirty path that origin moved → idle DIRTY-PATH, his bytes and HEAD unmoved, ONE key
    const t = sandbox(tree);
    const h0 = git(t.laptop, ["rev-parse", "HEAD"]).out;
    const o0 = t.moveOrigin("README.md", "moved\n", "a landing moved origin");
    put(t.laptop, "README.md", "HIS WORK IN PROGRESS\n");
    const out = t.night(); t.night();
    const k = t.cards().filter((x) => /^groundsman:dirty:/.test(x));
    const b = /DIRTY-PATH README\.md/.test(out) && read(t.laptop, "README.md") === "HIS WORK IN PROGRESS\n" && git(t.laptop, ["rev-parse", "HEAD"]).out === h0
      && t.originHead() === o0 && k.length >= 1 && new Set(k).size === 1;
    return { ok: a && b, why: `ff+pushed ${a} · dirty idles one key ${b}` };
  },
  G3(tree) {
    // (a) a night with nothing to stage still FETCHES: the tracking ref meets origin
    const s = sandbox(tree);
    const moved = s.moveOrigin("notes/x.txt", "x2\n", "moved");
    s.night();
    const a = git(s.laptop, ["rev-parse", "refs/remotes/origin/main"]).out === moved;
    // (b) a foreign unpushed commit is still HELD after the fetch: refused, the held card, no push
    const t = sandbox(tree);
    const o0 = t.originHead();
    put(t.laptop, "notes/x.txt", "foreign\n"); git(t.laptop, ["commit", "-q", "-am", "a runner's held landing"]);
    put(t.laptop, `${STATE}/a.json`, "{\"a\":\"t\"}\n");
    t.night();
    const b = t.originHead() === o0 && t.cards().some((x) => /^groundsman:held:/.test(x));
    return { ok: a && b, why: `fetched on a quiet night ${a} · held still refuses ${b}` };
  },
};

// ── BOUND: only the named files differ ─────────────────────────────────────────
function files(dir) {
  const out = new Map();
  const walk = (d) => { for (const n of readdirSync(d)) { if (n === ".git" || n === "node_modules") continue; const p = join(d, n); const st = statSync(p); if (st.isDirectory()) walk(p); else out.set(relative(dir, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p)).digest("hex")); } };
  walk(dir); return out;
}
function bound() {
  const a = files(BASE), b = files(ORG), diff = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) if (a.get(k) !== b.get(k)) diff.push(k);
  const off = diff.filter((p) => !NAMED.includes(p) && !NAMED_DIRS.some((d) => p.startsWith(d)));
  return { ok: off.length === 0 && diff.includes("scripts/groundsman.mjs"), why: off.length ? `off-bound: ${off.slice(0, 5).join(", ")}` : `${diff.length} differing path(s), all named` };
}
function survivors() {
  const needle = ROOT;
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.includes(needle) && !l.includes("witness_mgrd")).length;
  }
  let n = 0;
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { const c = readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " "); if (c.includes(needle)) n++; } catch {}
  }
  return n;
}

const red = [];
try {
  for (const [name, fn] of Object.entries(CLAUSES)) {
    let onBase, onBuild;
    try { onBase = fn(BASE); } catch (e) { onBase = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; }
    try { onBuild = fn(ORG); } catch (e) { onBuild = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; }
    const pass = !onBase.ok && onBuild.ok;
    console.log(`  ${pass ? "✓" : "✗"} ${name} · base ${onBase.ok ? "GREEN (does not discriminate)" : "RED"} · build ${onBuild.ok ? "GREEN" : "RED"} — ${onBuild.why}`);
    if (!pass) red.push(name);
  }
  const b = bound();
  console.log(`  ${b.ok ? "✓" : "✗"} BOUND · ${b.why}`);
  if (!b.ok) red.push("BOUND");
} finally {
  const n = survivors();
  console.log(`  ${n === 0 ? "✓" : "✗"} LAST · ${n} node process(es) naming the temp dir survive`);
  if (n) red.push("LAST");
  try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
}
const total = Object.keys(CLAUSES).length + 2;
console.log(red.length ? `RED MGRD · ${red.join(", ")}` : `GREEN MGRD state push meets origin · ${total} clause(s)`);
process.exit(red.length ? 1 : 0);
