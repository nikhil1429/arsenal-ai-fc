#!/usr/bin/env node
// ============================================================================
// ci/mtrain/witness_mtrain.mjs — WITNESS of unit mtrain (THE TRAIN TOP, scripts/land.mjs --train-top; row 1313 (1)/(2))
// ----------------------------------------------------------------------------
// CONTRACT (row 1313 (2), verbatim the order): the verb takes --train-top SHA; the verdict is then read at that sha instead
// of the tip, and only when the tip is on the top's first-parent chain and every commit between is single-parent; anything
// else REFUSED by name; the verb's ledger row carries the top. No other line of the verb moves.
//   node ci/mtrain/witness_mtrain.mjs --org <build tree> [--base-org <base tree>] [--only <clause,…>]
// Real git on planted repos under os.tmpdir() (every one made with core.autocrlf=false at init or clone): a bare origin, a
// "seat" clone that pushes land/<unit> and the train, a "laptop" clone (main checked out) that runs the tree's own
// scripts/land.mjs. Every other organ the verb calls is a PLANTED stub in the planted tree: ci_verdict answers GREEN only
// for the shas the env door MTRAIN_GREEN names ("ALL" = every sha) and logs the sha it was asked for; sitting answers
// closed; the tripwire passes; keeper's judge gate is free. No network, no port, no service, no model, no state of his.
//   TOP      a tip below a green top on a single-parent chain is judged AT THE TOP: LANDED, main == origin == the tip
//            (never the top), and the verdict was asked for the top only (the tip itself is RED)
//   NONDESC  a top that is not a descendant (a sibling off main; the tip's own parent) → REFUSED TRAIN-TOP-NOT-DESCENDANT,
//            main unmoved, no verdict asked (every sha GREEN, so an accepting verb would land)
//   MERGE    a merge commit between the tip and the top (and a top that is itself a merge, first parent the tip) →
//            REFUSED TRAIN-TOP-MERGE, main unmoved (every sha GREEN)
//   TIP      without the flag the verdict is read at the tip exactly as today (tip RED → VERDICT-RED · tip GREEN → LANDED,
//            asked for the tip) — and the same branch WITH the flag is read at the top
//   FLAG     the flag twice, empty, `=`-joined or followed by another flag → REFUSED TRAIN-TOP-FLAG · a top that does not
//            resolve → REFUSED TRAIN-TOP-UNRESOLVED (every sha GREEN; nothing lands)
//   LEDGER   the row of a landing and of a refusal carries train_top = the top's full sha · the row of a landing without the
//            flag has today's keys exactly (ts unit sha outcome name human)
//   TRAIN    one commit per landing stands: a two-commit land branch under the flag → REFUSED MULTI-COMMIT · three cars land
//            bottom-up, one per verb call, on the one green top (the last car IS the top)
//   HEADER   the verb's header carries the C1-TRAIN law line citing row 1313 (1) beside C1, C1's old sentence kept
//   TREE BOUND (seat-time, rows 1307 (1) / 1311 (1)): only scripts/land.mjs and ci/mtrain/ differ between --base-org and
//            --org; run with no --base-org it is never judged (there is no frozen sha to judge it against)
//   LAST     no node process naming the temp dir survives
// Each clause runs on --base-org (must be RED) and on --org (must be GREEN); with no --base-org, on --org only.
// LAST LINE: GREEN MTRAIN the verdict read at a train top · <n> clause(s) (exit 0) · RED MTRAIN · <clauses> (exit 1)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
if (!ORG) { console.log("RED MTRAIN · usage: --org <dir> [--base-org <dir>]"); process.exit(1); }
const NAMED = ["scripts/land.mjs"], NAMED_DIRS = ["ci/mtrain/"];
const ROOT = mkdtempSync(join(os.tmpdir(), "witness-mtrain-"));
let seq = 0;

function git(cwd, args, ok = true) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  if (ok && r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.stderr}`);
  return { status: r.status, out: (r.stdout || "").trim() };
}
const cfg = (cwd) => { for (const [k, v] of [["user.name", "witness"], ["user.email", "witness@example.invalid"], ["core.autocrlf", "false"], ["commit.gpgsign", "false"]]) git(cwd, ["config", k, v]); };
const put = (dir, rel, text) => { const p = join(dir, ...rel.split("/")); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, text); };
const read = (dir, rel) => { try { return readFileSync(join(dir, ...rel.split("/")), "utf8"); } catch { return null; } };

const VERDICT = `import { appendFileSync } from "node:fs";
const s = String(process.argv[2]); appendFileSync(process.env.MTRAIN_LOG, s + "\\n");
const g = String(process.env.MTRAIN_GREEN || ""); const v = g === "ALL" || g.split(",").includes(s) ? "GREEN" : "RED";
console.log("ci_verdict " + s.slice(0, 7) + " " + v + " — planted [run 111] [run 222]");
process.exitCode = v === "GREEN" ? 0 : 1;
`;
const SITTING = `console.log("sitting: daemon DOWN on :1 · file says no open sitting · planted");\n`;
const ARCHIVIST = `console.log("tripwire: nothing that may not be published.");\n`;
const KEEPER = "export const JUDGE_PORT = 0;\nexport const judgeHeld = async () => false;\n";
const REC = `console.log("planted");\n`;

function sandbox(tree) {
  const dir = join(ROOT, `s${++seq}`);
  const origin = join(dir, "origin.git"), seed = join(dir, "seed"), laptop = join(dir, "laptop"), seat = join(dir, "seat");
  mkdirSync(seed, { recursive: true });
  git(dir, ["-c", "core.autocrlf=false", "init", "-q", "--bare", "-b", "main", origin]);
  git(seed, ["-c", "core.autocrlf=false", "init", "-q", "-b", "main"]); cfg(seed);
  put(seed, "scripts/land.mjs", read(tree, "scripts/land.mjs") || "process.exitCode = 1;\n");
  put(seed, "scripts/ci_verdict.mjs", VERDICT); put(seed, "scripts/sitting.mjs", SITTING); put(seed, "scripts/archivist.mjs", ARCHIVIST);
  put(seed, "scripts/keeper.mjs", KEEPER); put(seed, "scripts/captains_call.mjs", REC);
  put(seed, "README.md", "seed\n"); put(seed, "notes/a.txt", "a0\n");
  git(seed, ["add", "-A"]); git(seed, ["commit", "-q", "-m", "seed"]);
  git(seed, ["remote", "add", "origin", origin]); git(seed, ["push", "-q", "origin", "main"]);
  for (const c of [laptop, seat]) { git(dir, ["clone", "-q", "-c", "core.autocrlf=false", origin, c]); cfg(c); }
  const log = join(dir, "verdicts.log");
  const asked = () => (read(dir, "verdicts.log") || "").split(/\r?\n/).filter(Boolean);
  const land = (args, green) => {
    writeFileSync(log, "");
    const r = spawnSync(process.execPath, [join(laptop, "scripts", "land.mjs"), ...args], { cwd: laptop, encoding: "utf8", windowsHide: true, env: { ...process.env, MTRAIN_LOG: log, MTRAIN_GREEN: green } });
    const o = ((r.stdout || "") + (r.stderr || "")).trim();
    return { code: r.status, out: o, last: o.split(/\r?\n/).pop() || "", asked: asked() };
  };
  const head = () => git(seat, ["rev-parse", "HEAD"]).out;
  const commit = (files, msg = "car") => { for (const [p, t] of Object.entries(files)) put(seat, p, t); git(seat, ["add", "-A"]); git(seat, ["commit", "-q", "-m", msg]); return head(); };
  /** the seat starts at origin main and makes n single-parent commits, each a car @param {number} n */
  const cars = (n) => { git(seat, ["fetch", "-q", "origin", "main"]); git(seat, ["checkout", "-q", "-B", "train", "origin/main"]); const out = []; for (let i = 1; i <= n; i++) out.push(commit({ [`notes/car${i}.txt`]: `car ${i}\n` }, `car ${i}`)); return out; };
  /** push a sha as land/<unit> (the car) and the train top as train/<name>, then the laptop fetches the train */
  const pushLand = (unit, at) => git(seat, ["push", "-q", "-f", "origin", `${at}:refs/heads/land/${unit}`]);
  const pushTrain = (at) => { git(seat, ["push", "-q", "-f", "origin", `${at}:refs/heads/train/top`]); git(laptop, ["fetch", "-q", "origin", "train/top"]); };
  const main = () => git(laptop, ["rev-parse", "main"]).out, originMain = () => git(origin, ["rev-parse", "main"]).out;
  const ledger = () => (read(laptop, ".git/land_ledger.jsonl") || "").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
  return { dir, laptop, seat, land, cars, commit, pushLand, pushTrain, main, originMain, ledger, git: (a) => git(seat, a) };
}
const landed = (s, r, T) => r.code === 0 && /^LANDED /.test(r.last) && s.main() === T && s.originMain() === T;
const refused = (s, r, name, m0) => r.code === 1 && new RegExp(`^REFUSED ${name}\\b`).test(r.last) && s.main() === m0 && s.originMain() === m0;

const CLAUSES = {
  TOP(tree) {
    const s = sandbox(tree); const [T, , TOP] = s.cars(3); s.pushLand("x", T); s.pushTrain(TOP);
    const r = s.land(["x", "--train-top", TOP], TOP);
    const ok = landed(s, r, T) && r.asked.length >= 1 && r.asked.every((x) => x === TOP);
    return { ok, why: `landed T ${landed(s, r, T)} · verdict asked for [${r.asked.map((x) => x.slice(0, 7)).join(" ")}] (top ${TOP.slice(0, 7)}) · ${r.last.slice(0, 70)}` };
  },
  NONDESC(tree) {
    const a = sandbox(tree); const m0 = a.main(); const [T] = a.cars(1); a.pushLand("x", T);
    a.git(["checkout", "-q", "-B", "side", "origin/main"]); const SIB = a.commit({ "notes/side.txt": "side\n" }, "sibling"); a.pushTrain(SIB);
    const r1 = a.land(["x", "--train-top", SIB], "ALL");
    const b = sandbox(tree); const n0 = b.main(); const [U] = b.cars(1); b.pushLand("x", U);
    const r2 = b.land(["x", "--train-top", n0], "ALL");   // the tip's own parent: an ancestor, never a descendant
    const ok = refused(a, r1, "TRAIN-TOP-NOT-DESCENDANT", m0) && r1.asked.length === 0 && refused(b, r2, "TRAIN-TOP-NOT-DESCENDANT", n0) && r2.asked.length === 0;
    return { ok, why: `sibling: ${r1.last.slice(0, 60)} · parent: ${r2.last.slice(0, 60)}` };
  },
  MERGE(tree) {
    const s = sandbox(tree); const m0 = s.main(); const [T] = s.cars(1); s.pushLand("x", T);
    s.git(["checkout", "-q", "-B", "side", "origin/main"]); const S = s.commit({ "notes/side.txt": "side\n" }, "side");
    s.git(["checkout", "-q", "train"]); s.git(["merge", "-q", "--no-ff", "-m", "a merge in the train", S]); const M = s.git(["rev-parse", "HEAD"]).out;
    const TOP = s.commit({ "notes/above.txt": "above\n" }, "above the merge"); s.pushTrain(TOP);
    const r1 = s.land(["x", "--train-top", TOP], "ALL");
    s.pushTrain(M);
    const r2 = s.land(["x", "--train-top", M], "ALL");   // the top itself a merge, first parent the tip
    const ok = refused(s, r1, "TRAIN-TOP-MERGE", m0) && refused(s, r2, "TRAIN-TOP-MERGE", m0) && r1.asked.length === 0 && r2.asked.length === 0;
    return { ok, why: `merge between: ${r1.last.slice(0, 60)} · merge top: ${r2.last.slice(0, 50)}` };
  },
  TIP(tree) {
    const a = sandbox(tree); const m0 = a.main(); const [T, TOP] = a.cars(2); a.pushLand("x", T); a.pushTrain(TOP);
    const r1 = a.land(["x"], TOP);
    const red = refused(a, r1, "VERDICT-RED", m0) && r1.asked.length >= 1 && r1.asked.every((x) => x === T);
    const r2 = a.land(["x"], T);
    const green = landed(a, r2, T) && r2.asked.every((x) => x === T);
    const b = sandbox(tree); const [U, UTOP] = b.cars(2); b.pushLand("x", U); b.pushTrain(UTOP);
    const r3 = b.land(["x", "--train-top", UTOP], UTOP);
    const moved = landed(b, r3, U) && r3.asked.length >= 1 && r3.asked.every((x) => x === UTOP);
    return { ok: red && green && moved, why: `no flag, tip RED → refused at the tip ${red} · tip GREEN → lands ${green} · with the flag read at the top ${moved} (${r3.last.slice(0, 50)})` };
  },
  FLAG(tree) {
    const cases = [];
    for (const [label, args, name] of [
      ["twice", (T) => ["x", "--train-top", T, "--train-top", T], "TRAIN-TOP-FLAG"],
      ["empty", () => ["x", "--train-top"], "TRAIN-TOP-FLAG"],
      ["joined", (T) => ["x", `--train-top=${T}`], "TRAIN-TOP-FLAG"],
      ["flag after", () => ["x", "--train-top", "--dry"], "TRAIN-TOP-FLAG"],
      ["unresolved", () => ["x", "--train-top", "0123456789abcdef0123456789abcdef01234567"], "TRAIN-TOP-UNRESOLVED"],
    ]) {
      const s = sandbox(tree); const m0 = s.main(); const [T, TOP] = s.cars(2); s.pushLand("x", T); s.pushTrain(TOP);
      const r = s.land(/** @type {any} */ (args)(TOP), "ALL");
      cases.push({ label, ok: refused(s, r, /** @type {string} */ (name), m0), last: r.last });
    }
    const bad = cases.filter((c) => !c.ok);
    return { ok: !bad.length, why: bad.length ? `not refused by name: ${bad.map((c) => `${c.label} (${c.last.slice(0, 50)})`).join(" · ")}` : `${cases.length} malformed flag(s) refused by name` };
  },
  LEDGER(tree) {
    const a = sandbox(tree); const [T, TOP] = a.cars(2); a.pushLand("x", T); a.pushTrain(TOP);
    const r1 = a.land(["x", "--train-top", TOP], TOP); const row1 = a.ledger().pop() || {};
    const b = sandbox(tree); const [U] = b.cars(1); b.pushLand("x", U);
    const b0 = b.main(); b.pushTrain(b0);
    b.land(["x", "--train-top", b0], "ALL"); const row2 = b.ledger().pop() || {};
    const c = sandbox(tree); const [V] = c.cars(1); c.pushLand("x", V);
    const r3 = c.land(["x"], V); const row3 = c.ledger().pop() || {};
    const today = ["ts", "unit", "sha", "outcome", "name", "human"];
    const a1 = landed(a, r1, T) && row1.outcome === "LANDED" && row1.sha === T && row1.train_top === TOP;
    const a2 = row2.outcome === "REFUSED" && row2.train_top === b0;
    const a3 = landed(c, r3, V) && JSON.stringify(Object.keys(row3)) === JSON.stringify(today);
    return { ok: a1 && a2 && a3, why: `landing row carries the top ${a1} · refusal row carries the top ${a2} · no-flag row is today's keys ${a3} (${Object.keys(row3).join(" ")})` };
  },
  TRAIN(tree) {
    const a = sandbox(tree); const m0 = a.main(); const [, C2, TOP] = a.cars(3); a.pushLand("x", C2); a.pushTrain(TOP);
    const r0 = a.land(["x", "--train-top", TOP], TOP);
    const one = refused(a, r0, "MULTI-COMMIT", m0);
    const s = sandbox(tree); const [T1, T2, T3] = s.cars(3); s.pushTrain(T3);
    const steps = [];
    for (const [unit, car] of [["c1", T1], ["c2", T2], ["c3", T3]]) { s.pushLand(unit, car); const r = s.land([unit, "--train-top", T3], T3); steps.push({ unit, ok: landed(s, r, car) && r.asked.every((x) => x === T3), last: r.last }); }
    const bottomUp = steps.every((x) => x.ok);
    return { ok: one && bottomUp, why: `two commits under the flag refused MULTI-COMMIT ${one} (${r0.last.slice(0, 40)}) · three cars bottom-up on one top ${steps.map((x) => `${x.unit} ${x.ok}`).join(" ")}` };
  },
  HEADER(tree) {
    const src = read(tree, "scripts/land.mjs") || "";
    const head = src.split(/\r?\n/).filter((l) => /^\/\//.test(l)).join("\n");
    const c1 = /C1 \(row 1023\) THE SHA JUDGED IS THE SHA LANDED/.test(head);
    const law = /C1-TRAIN \(row 1313 \(1\)/.test(head) && /beside C1, never instead of it/.test(head);
    return { ok: c1 && law, why: `C1 kept ${c1} · C1-TRAIN law line ${law}` };
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
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.includes(ROOT) && !l.includes("witness_mtrain")).length;
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
console.log(red.length ? `RED MTRAIN · ${red.join(", ")}` : `GREEN MTRAIN the verdict read at a train top · ${judged} clause(s)`);
process.exit(red.length ? 1 : 0);
