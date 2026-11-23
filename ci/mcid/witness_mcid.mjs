#!/usr/bin/env node
// ============================================================================
// ci/mcid/witness_mcid.mjs — WITNESS of unit mcid (NO-CI-DIR ALSO HOLDS ON A CLAUSE WITNESS, scripts/land.mjs step 5; row 1321 (1))
// ----------------------------------------------------------------------------
// CONTRACT (row 1321 (1), verbatim the order): NO-CI-DIR also holds when the landing carries a 40-hex ci/UNIT/BASE, touches
// ci/UNIT, and carries at least one ci/witness/UNIT/witness_NAME.mjs, the path the clauses member runs. Nothing else in the
// verb moves; a landing with neither witness is refused as today.
//   node ci/mcid/witness_mcid.mjs --org <build tree> [--base-org <base tree>] [--only <clause,…>]
// Real git on planted repos under os.tmpdir() (every one made with core.autocrlf=false at init or clone): a bare origin whose
// main already carries a ci/<unit>/BASE (so the law binds), a "seat" clone that pushes land/<unit>, a "laptop" clone (main
// checked out) that runs the tree's own scripts/land.mjs with a planted --names-gate result (PASS for the commit's new ci/
// files). Every other organ the verb calls is a PLANTED stub in the planted tree: ci_verdict answers GREEN for every sha,
// sitting answers closed, the tripwire passes, keeper's judge gate is free. No network, no port, no service, no model, no
// state of his. "Accepted" = LANDED (main == origin == T); "refused" = REFUSED NO-CI-DIR with main unmoved.
//   CLAUSE   a landing carrying only a clause witness of ITS OWN unit (ci/witness/u1/witness_a.mjs) plus a 40-hex ci/u1/BASE
//            is accepted (RED on the base: there it is REFUSED NO-CI-DIR)
//   UNIT     a landing carrying the unit witness ci/u1/witness_u1.mjs (and the underscore spelling for a hyphen unit) plus
//            BASE is accepted — today's path kept — and CLAUSE holds beside it
//   NEITHER  a landing with neither witness (BASE only, plus a file elsewhere) is REFUSED NO-CI-DIR — and CLAUSE holds
//   OTHER    a landing whose only clause witness is ANOTHER unit's (ci/witness/u2/witness_a.mjs) is REFUSED NO-CI-DIR — and
//            CLAUSE holds
//   BASEHEX  a clause-witness landing whose ci/u1/BASE is not 40-hex (and one with no BASE) is REFUSED NO-CI-DIR — and CLAUSE
//            holds
//   TOUCH    a clause-witness landing that touches nothing under ci/u1/ (BASE already on main) is REFUSED NO-CI-DIR — and
//            CLAUSE holds
//   NAME     a clause witness only by the member's path and NAME [a-z0-9_-]+: witness_.mjs · witness_a.txt · a nested
//            sub/witness_a.mjs · run_a.mjs are each REFUSED NO-CI-DIR — and CLAUSE holds
//   HEADER   the verb's header carries the amendment citing row 1321 (1) beside NO-CI-DIR, the old sentence kept
//   TREE BOUND (seat-time, rows 1307 (1) / 1311 (1)): only scripts/land.mjs and ci/mcid/ differ between --base-org and --org;
//            run with no --base-org it is never judged (there is no frozen sha to judge it against)
//   LAST     no node process naming the temp dir survives
// Each clause runs on --base-org (must be RED) and on --org (must be GREEN); with no --base-org, on --org only.
// LAST LINE: GREEN MCID NO-CI-DIR holds on a clause witness · <n> clause(s) (exit 0) · RED MCID · <clauses> (exit 1)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
if (!ORG) { console.log("RED MCID · usage: --org <dir> [--base-org <dir>]"); process.exit(1); }
const NAMED = ["scripts/land.mjs"], NAMED_DIRS = ["ci/mcid/"];
const ROOT = mkdtempSync(join(os.tmpdir(), "witness-mcid-"));
const HEX = "0123456789abcdef0123456789abcdef01234567";
let seq = 0;

function git(cwd, args, ok = true) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  if (ok && r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.stderr}`);
  return { status: r.status, out: (r.stdout || "").trim() };
}
const cfg = (cwd) => { for (const [k, v] of [["user.name", "witness"], ["user.email", "witness@example.invalid"], ["core.autocrlf", "false"], ["commit.gpgsign", "false"]]) git(cwd, ["config", k, v]); };
const put = (dir, rel, text) => { const p = join(dir, ...rel.split("/")); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, text); };
const read = (dir, rel) => { try { return readFileSync(join(dir, ...rel.split("/")), "utf8"); } catch { return null; } };

const VERDICT = `console.log("ci_verdict " + String(process.argv[2]).slice(0, 7) + " GREEN — planted [run 111] [run 222]");\n`;
const SITTING = `console.log("sitting: daemon DOWN on :1 · file says no open sitting · planted");\n`;
const ARCHIVIST = `console.log("tripwire: nothing that may not be published.");\n`;
const KEEPER = "export const JUDGE_PORT = 0;\nexport const judgeHeld = async () => false;\n";
const REC = `console.log("planted");\n`;
const WIT = `console.log("GREEN PLANTED · 1 clause(s)");\n`;

/** @param {string} tree @param {Record<string,string>} [extra] files main already carries */
function sandbox(tree, extra = {}) {
  const dir = join(ROOT, `s${++seq}`);
  const origin = join(dir, "origin.git"), seed = join(dir, "seed"), laptop = join(dir, "laptop"), seat = join(dir, "seat");
  mkdirSync(seed, { recursive: true });
  git(dir, ["-c", "core.autocrlf=false", "init", "-q", "--bare", "-b", "main", origin]);
  git(seed, ["-c", "core.autocrlf=false", "init", "-q", "-b", "main"]); cfg(seed);
  put(seed, "scripts/land.mjs", read(tree, "scripts/land.mjs") || "process.exitCode = 1;\n");
  put(seed, "scripts/ci_verdict.mjs", VERDICT); put(seed, "scripts/sitting.mjs", SITTING); put(seed, "scripts/archivist.mjs", ARCHIVIST);
  put(seed, "scripts/keeper.mjs", KEEPER); put(seed, "scripts/captains_call.mjs", REC);
  put(seed, "README.md", "seed\n"); put(seed, "ci/seed/BASE", `${HEX}\n`);   // main carries a ci/<unit>/BASE: NO-CI-DIR binds
  for (const [p, t] of Object.entries(extra)) put(seed, p, t);
  git(seed, ["add", "-A"]); git(seed, ["commit", "-q", "-m", "seed"]);
  git(seed, ["remote", "add", "origin", origin]); git(seed, ["push", "-q", "origin", "main"]);
  for (const c of [laptop, seat]) { git(dir, ["clone", "-q", "-c", "core.autocrlf=false", origin, c]); cfg(c); }
  const main = () => git(laptop, ["rev-parse", "main"]).out, originMain = () => git(origin, ["rev-parse", "main"]).out;
  /** one landing of <unit> carrying <files>: the seat commits ONE commit on origin main, pushes land/<unit>, the laptop runs the verb
   * @param {string} unit @param {Record<string,string>} files */
  const land = (unit, files) => {
    const m0 = main();
    git(seat, ["fetch", "-q", "origin", "main"]); git(seat, ["checkout", "-q", "-B", `w-${unit}`, "origin/main"]);
    for (const [p, t] of Object.entries(files)) put(seat, p, t);
    git(seat, ["add", "-A"]); git(seat, ["commit", "-q", "-m", `landing ${unit}`]);
    const T = git(seat, ["rev-parse", "HEAD"]).out;
    git(seat, ["push", "-q", "-f", "origin", `${T}:refs/heads/land/${unit}`]);
    const fresh = git(seat, ["diff-tree", "--no-commit-id", "-r", "--name-only", "--no-renames", "--diff-filter=A", `${T}^`, T]).out.split(/\r?\n/).filter((p) => p.startsWith("ci/"));
    const ng = join(dir, `names-${unit}.json`);
    writeFileSync(ng, JSON.stringify({ sha: T, result: "PASS", paths: fresh, list_sha256: "0".repeat(64) }));
    const r = spawnSync(process.execPath, [join(laptop, "scripts", "land.mjs"), unit, "--names-gate", ng], { cwd: laptop, encoding: "utf8", windowsHide: true });
    const o = ((r.stdout || "") + (r.stderr || "")).trim();
    const last = o.split(/\r?\n/).pop() || "";
    const accepted = r.status === 0 && /^LANDED /.test(last) && main() === T && originMain() === T;
    const refused = r.status === 1 && /^REFUSED NO-CI-DIR\b/.test(last) && main() === m0 && originMain() === m0;
    return { accepted, refused, last };
  };
  return { land };
}

/** the core plant of the row: a clause witness of ITS OWN unit plus a 40-hex BASE, nothing else of ci/<unit>/ */
const core = (tree) => sandbox(tree).land("u1", { "ci/u1/BASE": `${HEX}\n`, "ci/witness/u1/witness_a.mjs": WIT });
/** @param {string} tree @param {[string, Record<string,string>, Record<string,string>?][]} cases label, landing files, main's extra files */
function refusedAll(tree, cases) {
  const c = core(tree);
  const bad = [];
  for (const [label, files, extra] of cases) { const r = sandbox(tree, extra || {}).land("u1", files); if (!r.refused) bad.push(`${label} (${r.last.slice(0, 50)})`); }
  return { ok: c.accepted && !bad.length, why: `the clause-witness landing accepted ${c.accepted} · ${bad.length ? `not refused NO-CI-DIR: ${bad.join(" · ")}` : `${cases.length} landing(s) refused NO-CI-DIR`}` };
}

const CLAUSES = {
  CLAUSE(tree) {
    const c = core(tree);
    return { ok: c.accepted, why: `own-unit clause witness + 40-hex BASE → ${c.last.slice(0, 80)}` };
  },
  UNIT(tree) {
    const c = core(tree);
    const a = sandbox(tree).land("u1", { "ci/u1/BASE": `${HEX}\n`, "ci/u1/witness_u1.mjs": WIT });
    const b = sandbox(tree).land("u-1", { "ci/u-1/BASE": `${HEX}\n`, "ci/u-1/witness_u_1.mjs": WIT });
    return { ok: c.accepted && a.accepted && b.accepted, why: `unit witness accepted ${a.accepted} · underscore spelling accepted ${b.accepted} · clause witness accepted ${c.accepted}` };
  },
  NEITHER(tree) {
    return refusedAll(tree, [["BASE only", { "ci/u1/BASE": `${HEX}\n`, "notes/x.txt": "x\n" }]]);
  },
  OTHER(tree) {
    return refusedAll(tree, [["another unit's clause witness", { "ci/u1/BASE": `${HEX}\n`, "ci/witness/u2/witness_a.mjs": WIT }],
      ["a unit whose name extends this one", { "ci/u1/BASE": `${HEX}\n`, "ci/witness/u12/witness_a.mjs": WIT }]]);
  },
  BASEHEX(tree) {
    return refusedAll(tree, [["BASE not 40-hex", { "ci/u1/BASE": "not-a-sha\n", "ci/witness/u1/witness_a.mjs": WIT }],
      ["no BASE", { "ci/u1/notes.txt": "n\n", "ci/witness/u1/witness_a.mjs": WIT }]]);
  },
  TOUCH(tree) {
    return refusedAll(tree, [["touches only ci/witness/u1/", { "ci/witness/u1/witness_a.mjs": WIT }, { "ci/u1/BASE": `${HEX}\n` }]]);
  },
  NAME(tree) {
    const B = { "ci/u1/BASE": `${HEX}\n` };
    return refusedAll(tree, [["witness_.mjs", { ...B, "ci/witness/u1/witness_.mjs": WIT }], ["witness_a.txt", { ...B, "ci/witness/u1/witness_a.txt": WIT }],
      ["nested sub/witness_a.mjs", { ...B, "ci/witness/u1/sub/witness_a.mjs": WIT }], ["run_a.mjs", { ...B, "ci/witness/u1/run_a.mjs": WIT }]]);
  },
  HEADER(tree) {
    const src = read(tree, "scripts/land.mjs") || "";
    const head = src.split(/\r?\n/).filter((l) => /^\/\//.test(l)).join("\n");
    const old = /NO-CI-DIR \(unit ms1 · row 1066 F7 A\): once main carries a ci\/<unit>\/BASE/.test(head) && /or that touches nothing under ci\/<unit>\/, is REFUSED\./.test(head);
    const law = /NO-CI-DIR · THE CLAUSE WITNESS \(unit mcid · row 1321 \(1\)\) beside it, the sentence above kept/.test(head) && /ci\/witness\/<unit>\/witness_NAME\.mjs/.test(head);
    return { ok: old && law, why: `old NO-CI-DIR sentence kept ${old} · the row 1321 (1) amendment ${law}` };
  },
};

function files(dir) {
  const out = new Map();
  const walk = (d) => { for (const n of readdirSync(d)) { if (n === ".git" || n === "node_modules") continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else out.set(relative(dir, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p)).digest("hex")); } };
  walk(dir); return out;
}
function bound() {
  const a = files(/** @type {string} */ (BASE)), b = files(ORG), diff = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) if (a.get(k) !== b.get(k)) diff.push(k);
  const off = diff.filter((p) => !NAMED.includes(p) && !NAMED_DIRS.some((d) => p.startsWith(d)));
  return { ok: off.length === 0 && diff.includes("scripts/land.mjs"), why: off.length ? `off-bound: ${off.slice(0, 5).join(", ")}${off.length > 5 ? ` (+${off.length - 5})` : ""}` : `${diff.length} differing path(s), all named` };
}
function survivors() {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.includes(ROOT) && !l.includes("witness_mcid")).length;
  }
  let n = 0;
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(ROOT)) n++; } catch { /* exited between readdir and read */ }
  }
  return n;
}

const only = arg("--only");
const red = [];
let judged = 0;
try {
  for (const [name, fn] of Object.entries(CLAUSES)) {
    if (only && !only.split(",").includes(name)) continue;
    judged++;
    let onBase = null, onBuild;
    if (BASE) { try { onBase = fn(BASE); } catch (e) { onBase = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; } }
    try { onBuild = fn(ORG); } catch (e) { onBuild = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; }
    const pass = (!onBase || !onBase.ok) && onBuild.ok;
    console.log(`  ${pass ? "✓" : "✗"} ${name} · base ${!onBase ? "not given" : onBase.ok ? "GREEN (does not discriminate)" : "RED"} · build ${onBuild.ok ? "GREEN" : "RED"} — ${onBuild.why}`);
    if (!pass) red.push(name);
  }
  if (BASE && !only) {
    judged++;
    const b = bound();
    console.log(`  ${b.ok ? "✓" : "✗"} TREE BOUND · ${b.why}`);
    if (!b.ok) red.push("TREE BOUND");
  } else console.log(`  · TREE BOUND not judged — ${BASE ? "--only names the clauses" : "no --base-org: BOUND is never judged against a frozen sha (row 1307 (1))"}`);
} finally {
  const n = survivors();
  console.log(`  ${n === 0 ? "✓" : "✗"} LAST · ${n} node process(es) naming the temp dir survive`);
  if (n) red.push("LAST");
  judged++;
  try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* the OS reclaims the temp dir */ }
}
console.log(red.length ? `RED MCID · ${red.join(", ")}` : `GREEN MCID NO-CI-DIR holds on a clause witness · ${judged} clause(s)`);
process.exit(red.length ? 1 : 0);
