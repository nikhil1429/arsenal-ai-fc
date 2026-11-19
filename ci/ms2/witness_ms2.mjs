#!/usr/bin/env node
// ============================================================================
// ci/ms2/witness_ms2.mjs — WITNESS of unit ms2 (every landed unit judged at its LANDED sha; at head only what still binds)
// ----------------------------------------------------------------------------
// CONTRACT (forks rows 1121 / 1123 (2); spec ci/ms2/MS2_SPEC.md on claude/ms2-spec 929e7e6, THE RULING WINNING where they
// differ — ci/ms2/PROOF.md names each difference):
//   node ci/ms2/witness_ms2.mjs --org <build tree> --base-org <base tree> [--only <clause,…>]
// Every plant is a throwaway git repo under os.tmpdir(), made with core.autocrlf=false at init. A MEMBER plant holds the
// tree's scripts/organism_test.mjs and .github/workflows/suite.yml, a planted history (each commit's m.txt names it: P, L,
// X, HEAD …, dated in order so no walk is decided by a clock tie) with refs/remotes/origin/main set by update-ref, and a
// planted ci/pu/ (and ci/pv/) whose witness is a few lines of node: it appends {unit, org, base, git} to $MS2_MARK and prints
// the LAST line its plan names for that --org. The member runs over the PLANT, never over a real witness. A LAND plant
// (the ci/mland / ci/ms1 B3 shape) holds the tree's scripts/land.mjs and stubs (ci_verdict GREEN, sitting CLOSED, the
// tripwire passes, a keeper whose judgeHeld answers free and binds nothing), a bare origin, a seat and a laptop clone; every
// land call is --dry. THE PORT CLASS (row 1053): this witness binds no port, names no live service, POSTs nothing, restarts
// nothing; the member's own port doors are OS-picked. Every spawn is bounded by the job's own timeout-minutes read from the
// tree's .github/workflows/suite.yml (never typed here).
//   C1 · THE LANDED-COMMIT LEG
//   W-L1 READ      main P → L (`unit pu (`) → X, ci/pu/LANDED_ON = P → the L-leg's witness sees --org L, --base-org P
//   W-L2 RUN       P → L1 → L2 (both `unit pu (`) → X → --org L2 (F2 a: the newest of the run)
//   W-L3 SPOOF     P → L → X, X a merge whose 2nd parent is a seat commit `unit pu (` on P → --org L, never the seat commit
//   W-L4 INFLIGHT  main = P, HEAD = one commit `unit pu (` on P → --org HEAD
//   W-L5 NOTLANDED GUARD: no LANDED_ON → the head leg judged, ONE `  witness ‹pu› L · not landed` line on a build tree, no L assert
//   W-L6 FULL      the witness prints `RED PU · BOUND` at L → the L assert RED `red at L: BOUND` (nothing dropped)
//   W-L7 GITSIDE   the witness is GREEN at L iff `git -C <side> ls-files` answers on both sides → the L assert ok (F4 a)
//   W-L8 OFFMAIN   LANDED_ON names a commit off main's first-parent line → RED `its LANDED_ON is on main's first-parent line`
//   W-L9 SECONDS   one `  witness ‹pu› L <s> s · <LAST>` line
//   W-L10 PLUS     main P → `unit pq + pu (` → X → ‹pu›'s L is that shared commit (F6 b)
//   C3 · THE RE-BASE DOOR (row 1121 (3); main P → Lu `unit pu (` → Lv `unit pv (` → X, pv landed after pu)
//   W-R1 DROP      `DROP X1 · pv · row 9 · …`, head prints `RED PU · X1` → the head assert ok
//   W-R2 KEEPATL   the same DROP, L prints `RED PU · X1` → the L assert RED `red at L: X1` (the L-leg binds a DROP id)
//   W-R3 STALE     the same DROP, head GREEN → RED `REBASE ‹pu› · every DROP id is still red at head`
//   W-R4 ORDER     pv landed BEFORE pu → RED `REBASE ‹pu› · every line is valid`, and X1 is not dropped at head
//   W-R5 UNKNOWN   `DROP ZZ · pv …`, ZZ no quoted literal of the witness → RED INVALID
//   W-R6 NEWDEATH  DROP X1, head prints `RED PU · X1 X2` → the head assert RED naming X2 alone
//   W-R7 RECUT     `RECUT X1 · pv · row 9 · …`, head GREEN (the new form), L prints `RED PU · X1` → the L assert ok
//   W-R8 RECUTHEAD GUARD: the same RECUT, head prints `RED PU · X1` → the head assert RED (a RECUT never drops at head)
//   W-R9 PENDING   pv carries ci/pv/ and has not landed (its line rides pv's own landing, F3 b) → DROP X1 valid, head ok
//   C4 · THE TRIGGER (row 1121 (2))
//   W-T1 TRIGGER   ci/pu/ equal to origin/main's → ONE `  witness ‹pu› L · carried` line, the witness spawned once (head)
//   W-T2 CHANGED   ci/pu/ differs from origin/main's → the L assert present
//   W-T3 MERGEBASE FK8 A (row 1171): main moved on and changed ci/pu/ after the seat was cut; the seat's ci/pu/ equals the
//                  push's MERGE BASE → ONE carried line, the witness spawned once (a seat pays only for the dirs it changed)
//   C6 · THE LAND VERB WRITES THE CONTRACT (land.mjs step 5; origin main carries a ci/old/LANDED_ON unless said)
//   W-G1 SUBJECT   T's subject `wip` → REFUSED SUBJECT
//   W-G2 LANDEDON  ci/u1/LANDED_ON ≠ T's parent → REFUSED LANDED-ON
//   W-G3 GOOD      GUARD: `unit u1 (…)`, LANDED_ON = T's parent → DRY
//   W-G4 PLUS      `unit u1 + u2 (…)`, ci/u2/LANDED_ON ≠ T's parent → REFUSED LANDED-ON (every named unit shares the landing)
//   W-G5 PLUSOK    GUARD: the plus form, both LANDED_ON = T's parent → DRY
//   W-G6 BEFORE    GUARD: origin main with no LANDED_ON (before ms2 lands), subject `wip` → DRY (the law binds from ms2 on)
//   C7 · THE CARRY
//   W-C1 CARRY     static: every carried unit holds a 40-hex ci/<u>/LANDED_ON; inside this repository, each equals the parent
//                  of that unit's oldest `unit <u> (` commit on origin/main's first-parent line
// Each clause runs on --base-org (must be RED) and on --org (must be GREEN); a GUARD must be GREEN on both.
// BOUND: only scripts/organism_test.mjs, scripts/land.mjs, .claude/skills/runner/SKILL.md, ci/ms2/*, ci/<u>/LANDED_ON and
// ci/<u>/REBASE differ (text, CRLF folded to LF; dressing-room/state never compared, never read). LAST: no node process
// naming the temp dir survives.
// LAST LINE: GREEN MS2 every landed unit judged at its LANDED sha, at head only what still binds · <n> clause(s)  (exit 0)
//            RED MS2 · <clauses>  (exit 1)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync, mkdtempSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
if (!ORG || !BASE) { console.log("RED MS2 · usage: --org <dir> --base-org <dir>"); process.exit(1); }
const NAMED = ["scripts/organism_test.mjs", "scripts/land.mjs", ".claude/skills/runner/SKILL.md"];
const NAMED_CI = (p) => p.startsWith("ci/ms2/") || /^ci\/[a-z0-9-]+\/(LANDED_ON|REBASE)$/.test(p);
// the carried units that have landed on main (ms1's CARRIED list at c637496, ci/ms1/witness_ms1.mjs), each with a LANDED_ON (C7)
const CARRIED = ["mcr2", "mday", "mday2", "mdn2", "mdone", "mf2", "mf4", "mfac", "mfac-floor", "mgrd", "mgs", "mjd3", "mjd4", "mjd5", "mjd6", "mjd7", "mjud", "mland", "mlj", "mlv0", "mlv1", "mlv2", "mlv3", "mpast", "mpm", "mpool", "mport", "mr3", "mrf", "mrj", "mrt", "mrung", "mrv", "ms1", "mtail", "mtxt", "mtxt3", "mxw"];
const ROOT = mkdtempSync(join(os.tmpdir(), "witness-ms2-"));
let seq = 0;

const src = (tree, rel) => { try { return readFileSync(join(tree, ...rel.split("/")), "utf8"); } catch { return null; } };
const JOB_MS = (() => { const m = /timeout-minutes:\s*(\d+)/.exec(src(ORG, ".github/workflows/suite.yml") || ""); return m ? Number(m[1]) * 60000 : 0; })();
if (!JOB_MS) { console.log("RED MS2 · the tree carries no .github/workflows/suite.yml timeout-minutes (the bound)"); process.exit(1); }
const sp = (cmd, args, o = {}) => { const r = spawnSync(cmd, args, { encoding: "utf8", windowsHide: true, timeout: JOB_MS, maxBuffer: 1 << 26, ...o }); return { code: r.status, out: ((r.stdout || "") + (r.stderr || "")).replace(/\r\n/g, "\n") }; };
function git(cwd, args, env = null) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true, timeout: JOB_MS, env: env ? { ...process.env, ...env } : process.env });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.stderr}`);
  return (r.stdout || "").trim();
}
const cfg = (cwd) => { for (const [k, v] of [["user.name", "witness"], ["user.email", "witness@example.invalid"], ["core.autocrlf", "false"], ["commit.gpgsign", "false"]]) git(cwd, ["config", k, v]); };
const put = (dir, rel, text) => { const p = join(dir, ...rel.split("/")); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, text); };
const newDir = (tag) => { const d = join(ROOT, `${tag}${++seq}`); mkdirSync(d, { recursive: true }); return d; };
const init = (d) => { git(d, ["-c", "core.autocrlf=false", "init", "-q", "-b", "main"]); cfg(d); };

// ── the planted witness: its plan maps the --org tree's marker to a LAST line ("GREEN", "GIT", or the red ids) ──────────
const W = `import { readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const a = (k) => process.argv[process.argv.indexOf(k) + 1];
const org = a("--org"), base = a("--base-org");
const U = "@U@", PLAN = @PLAN@, IDS = ["X1", "X2", "G1"];
const m = (d) => { try { return readFileSync(join(d, "m.txt"), "latin1").split(/\\r?\\n/)[0]; } catch { return null; } };
const isGit = (d) => spawnSync("git", ["-C", d, "ls-files"], { encoding: "utf8", windowsHide: true }).status === 0;
const g = isGit(org) && isGit(base);
if (process.env.MS2_MARK) appendFileSync(process.env.MS2_MARK, JSON.stringify({ unit: U, org: m(org), base: m(base), git: g }) + "\\n");
let say = PLAN[m(org)] ?? PLAN["*"] ?? "GREEN";
if (say === "GIT") say = g ? "GREEN" : IDS[2];
if (say === "GREEN") { console.log("GREEN " + U + " planted · 1 clause(s)"); process.exit(0); }
console.log("RED " + U + " · " + say);
process.exit(1);
`;
const witness = (unit, plan = {}) => W.replace("@U@", unit.toUpperCase()).replace("@PLAN@", JSON.stringify(plan));

/** a member plant. steps: [{ tag, subject?, files?, parents?: tags (a merge), main?: true }] in order; the LAST step is HEAD.
 *  files values may name another step's sha as {sha: tag}. @returns {{ out, lines, marks, sha }} */
function memberRun(tree, steps, { mainAt }) {
  const ot = src(tree, "scripts/organism_test.mjs"), wf = src(tree, ".github/workflows/suite.yml");
  if (ot == null || wf == null) return { out: "(the tree has no organism_test.mjs / suite.yml)", lines: [], marks: [], sha: {} };
  const d = newDir("m");
  init(d);
  put(d, "scripts/organism_test.mjs", ot); put(d, ".github/workflows/suite.yml", wf);
  const sha = {};
  let t = 1700000000;
  for (const s of steps) {
    if (s.from) git(d, ["checkout", "-q", "--detach", sha[s.from]]);
    if (s.branch) git(d, ["checkout", "-q", "-B", s.branch]);
    const date = { GIT_AUTHOR_DATE: `${++t} +0000`, GIT_COMMITTER_DATE: `${t} +0000` };
    if (s.merge) git(d, ["merge", "-q", "--no-ff", "--no-commit", "-s", "ours", sha[s.merge]], date);
    put(d, "m.txt", `${s.tag}\n`);
    for (const [rel, v] of Object.entries(s.files || {})) {
      if (v === null) { rmSync(join(d, ...rel.split("/")), { force: true }); continue; }
      put(d, rel, typeof v === "string" ? v : `${sha[v.sha]}\n`);
    }
    git(d, ["add", "-A"]);
    git(d, ["commit", "-q", "--allow-empty", "--no-verify", "-m", s.subject || s.tag], date);
    sha[s.tag] = git(d, ["rev-parse", "HEAD"]);
  }
  git(d, ["update-ref", "refs/remotes/origin/main", sha[mainAt]]);
  const mark = join(ROOT, `${relative(ROOT, d)}.mark`);
  const e = { ...process.env, ORGANISM_TEST_PROFILE: "hermetic", GITHUB_ACTIONS: "true", GITHUB_WORKSPACE: d, MS2_MARK: mark };
  const r = sp(process.execPath, [join(d, "scripts", "organism_test.mjs"), "witnesses"], { cwd: d, env: e });
  let marks = []; try { marks = readFileSync(mark, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch {}
  return { out: r.out, lines: r.out.split("\n"), marks, sha };
}
const unitFiles = (u, plan, { base = "P", landed = "P", rebase = null } = {}) => {
  const f = { [`ci/${u}/witness_${u}.mjs`]: witness(u, plan), [`ci/${u}/BASE`]: { sha: base } };
  if (landed) f[`ci/${u}/LANDED_ON`] = { sha: landed };
  if (rebase) f[`ci/${u}/REBASE`] = rebase;
  return f;
};
const okLine = (o, what) => o.lines.some((l) => l.startsWith(`  ok   ${what}`));
const failAt = (o, what) => { const i = o.lines.findIndex((l) => l.startsWith(`  FAIL ${what}`)); return i > -1 ? `${o.lines[i]} ${o.lines[i + 1] || ""}`.replace(/\s+/g, " ") : ""; };
const has = (o, what) => o.lines.some((l) => l.startsWith(`  ok   ${what}`) || l.startsWith(`  FAIL ${what}`));
const HEADA = (u) => `WITNESS ‹${u}› · GREEN at head against its BASE`;
const LA = (u) => `WITNESS ‹${u}› · GREEN at its LANDED sha against its landing's parent`;
const Lmark = (o, u) => o.marks.filter((m) => m.unit === u.toUpperCase());
const tail = (o) => o.lines.filter(Boolean).slice(-2).join(" | ");
// the door's standard history: P → Lu (unit pu) → Lv (unit pv) → X → HEAD (a seat commit that carries the files)
const door = (t, puPlan, rebase, { order = "after", pvLanded = true } = {}) => {
  const pv = unitFiles("pv", {}, { landed: pvLanded ? (order === "after" ? "LU" : "P") : null });
  const pu = unitFiles("pu", puPlan, { landed: order === "after" ? "P" : "LV", rebase });
  const steps = order === "after"
    ? [{ tag: "P" }, { tag: "LU", subject: "unit pu (plant)" }, { tag: "LV", subject: "unit pv (plant)" }, { tag: "X" }, { tag: "HEAD", subject: "seat", files: { ...pu, ...pv } }]
    : [{ tag: "P" }, { tag: "LV", subject: "unit pv (plant)" }, { tag: "LU", subject: "unit pu (plant)" }, { tag: "X" }, { tag: "HEAD", subject: "seat", files: { ...pu, ...pv } }];
  return memberRun(t, steps, { mainAt: "X" });
};
const REB = (kind, id) => `${kind} ${id} · pv · row 9 · a planted overtake\n`;

// ── the land plant (every call --dry) ─────────────────────────────────────────────────────────────────────────
const VERDICT = `console.log("ci_verdict " + String(process.argv[2]).slice(0, 7) + " GREEN — planted [run 111]");\n`;
const SITTING = `console.log("sitting: daemon DOWN on :1 · file says no open sitting");\n`;
const ARCHIVIST = `console.log("tripwire: nothing that may not be published.");\n`;
const REC = `console.log("recorded");\n`;
// the stub keeper's port export, spelled in two pieces so the member's static B4 read of THIS witness never meets the name
const KEEPER = `export const ${"JUDGE_"}${"PORT"} = 0;\nexport const judgeHeld = async () => false;\n`;
function landDry(tree, { landedOnMain = true, subject, files }) {
  const land = src(tree, "scripts/land.mjs");
  if (land == null) return "(no land.mjs)";
  const dir = newDir("l"), origin = join(dir, "origin.git"), seed = join(dir, "seed"), laptop = join(dir, "laptop"), seat = join(dir, "seat");
  mkdirSync(seed, { recursive: true });
  git(dir, ["-c", "core.autocrlf=false", "init", "-q", "--bare", "-b", "main", origin]);
  init(seed);
  put(seed, "scripts/land.mjs", land); put(seed, "scripts/keeper.mjs", KEEPER);
  put(seed, "scripts/ci_verdict.mjs", VERDICT); put(seed, "scripts/sitting.mjs", SITTING);
  put(seed, "scripts/archivist.mjs", ARCHIVIST); put(seed, "scripts/captains_call.mjs", REC);
  put(seed, "README.md", "seed\n");
  put(seed, "ci/old/witness_old.mjs", "console.log('GREEN OLD planted · 1 clause(s)');\n"); put(seed, "ci/old/BASE", `${"a".repeat(40)}\n`);
  if (landedOnMain) put(seed, "ci/old/LANDED_ON", `${"a".repeat(40)}\n`);
  git(seed, ["add", "-A"]); git(seed, ["commit", "-q", "--no-verify", "-m", "seed"]);
  git(seed, ["remote", "add", "origin", origin]); git(seed, ["push", "-q", "origin", "main"]);
  for (const c of [laptop, seat]) { git(dir, ["clone", "-q", "-c", "core.autocrlf=false", origin, c]); cfg(c); }
  const P = git(seat, ["rev-parse", "HEAD"]);
  git(seat, ["checkout", "-q", "-B", "land/u1", "origin/main"]);
  const paths = [];
  for (const [p, t] of Object.entries(files)) { put(seat, p, t === "@P@" ? `${P}\n` : t); paths.push(p); }
  git(seat, ["add", "-A"]); git(seat, ["commit", "-q", "--no-verify", "-m", subject]);
  const T = git(seat, ["rev-parse", "HEAD"]);
  git(seat, ["push", "-q", "origin", "land/u1"]);
  const g = join(dir, "gate.json");
  writeFileSync(g, JSON.stringify({ sha: T, result: "PASS", paths: paths.filter((f) => f.startsWith("ci/")), list_sha256: "0".repeat(64) }));
  const r = sp(process.execPath, [join(laptop, "scripts", "land.mjs"), "u1", "--dry", "--names-gate", g], { cwd: laptop });
  return r.out.trim().split("\n").pop() || "";
}
const U1 = (landedOn = "@P@") => ({ "notes/x.txt": "x1\n", "ci/u1/witness_u1.mjs": "console.log('GREEN U1 planted · 1 clause(s)');\n", "ci/u1/BASE": `${"b".repeat(40)}\n`, "ci/u1/LANDED_ON": landedOn });

// ── the clauses ──────────────────────────────────────────────────────────────────────────────────────────────
const CLAUSES = {
  "W-L1 READ"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "L", subject: "unit pu (plant)" }, { tag: "X" }, { tag: "HEAD", subject: "seat", files: unitFiles("pu") }], { mainAt: "X" });
    const m = Lmark(o, "pu").find((x) => x.org !== "HEAD");
    return { ok: !!m && m.org === "L" && m.base === "P" && okLine(o, LA("pu")), why: m ? `the L-leg's witness saw --org ${m.org}, --base-org ${m.base}` : `no L-leg spawn · ${tail(o)}` };
  },
  "W-L2 RUN"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "L1", subject: "unit pu (one)" }, { tag: "L2", subject: "unit pu (two)" }, { tag: "X" }, { tag: "HEAD", subject: "seat", files: unitFiles("pu") }], { mainAt: "X" });
    const m = Lmark(o, "pu").find((x) => x.org !== "HEAD");
    return { ok: !!m && m.org === "L2" && m.base === "P", why: m ? `a two-commit landing: --org ${m.org}` : `no L-leg spawn · ${tail(o)}` };
  },
  "W-L3 SPOOF"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "L", subject: "unit pu (plant)" },
      { tag: "S", from: "P", branch: "seat", subject: "unit pu (a seat commit copying the grammar)" },
      { tag: "X", from: "L", branch: "main", merge: "S", subject: "merge of a seat branch" },
      { tag: "HEAD", subject: "seat", files: unitFiles("pu") }], { mainAt: "X" });
    const m = Lmark(o, "pu").find((x) => x.org !== "HEAD");
    return { ok: !!m && m.org === "L", why: m ? `a seat commit \`unit pu (\` merged as a 2nd parent: --org ${m.org}` : `no L-leg spawn · ${tail(o)}` };
  },
  "W-L4 INFLIGHT"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "HEAD", subject: "unit pu (in flight)", files: unitFiles("pu") }], { mainAt: "P" });
    const ms = Lmark(o, "pu");
    return { ok: ms.length === 2 && ms.every((m) => m.org === "HEAD") && okLine(o, LA("pu")), why: `spawns ${ms.length} (${ms.map((m) => m.org).join(", ")}) · L assert ${has(o, LA("pu"))}` };
  },
  "W-L5 NOTLANDED"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "X" }, { tag: "HEAD", subject: "seat", files: unitFiles("pu", {}, { landed: null }) }], { mainAt: "X" });
    const nl = o.lines.filter((l) => l === "  witness ‹pu› L · not landed — its L-leg runs at its landing").length;
    const isBuild = /landedLeg/.test(src(t, "scripts/organism_test.mjs") || "");
    return { ok: okLine(o, HEADA("pu")) && !has(o, LA("pu")) && Lmark(o, "pu").length === 1 && nl === (isBuild ? 1 : 0), guard: true, why: `head ok ${okLine(o, HEADA("pu"))} · not-landed lines ${nl} · spawns ${Lmark(o, "pu").length} · L assert ${has(o, LA("pu"))}` };
  },
  "W-L6 FULL"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "L", subject: "unit pu (plant)" }, { tag: "X" }, { tag: "HEAD", subject: "seat", files: unitFiles("pu", { L: "BOUND" }) }], { mainAt: "X" });
    const d = failAt(o, LA("pu"));
    return { ok: /red at L: BOUND$/.test(d), why: d || `no L red · ${tail(o)}` };
  },
  "W-L7 GITSIDE"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "L", subject: "unit pu (plant)" }, { tag: "X" }, { tag: "HEAD", subject: "seat", files: unitFiles("pu", { L: "GIT" }) }], { mainAt: "X" });
    const m = Lmark(o, "pu").find((x) => x.org === "L");
    return { ok: okLine(o, LA("pu")) && !!m && m.git, why: m ? `git -C <side> ls-files answers on both sides: ${m.git}` : `no L-leg spawn · ${tail(o)}` };
  },
  "W-L8 OFFMAIN"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "Q", from: "P", branch: "side" }, { tag: "L", from: "P", branch: "main", subject: "unit pu (plant)" }, { tag: "X" },
      { tag: "HEAD", subject: "seat", files: unitFiles("pu", {}, { landed: "Q" }) }], { mainAt: "X" });
    const d = failAt(o, "WITNESS ‹pu› · its LANDED_ON is on main's first-parent line (C1)");
    return { ok: !!d && Lmark(o, "pu").length === 1, why: d || `no off-main red · ${tail(o)}` };
  },
  "W-L9 SECONDS"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "L", subject: "unit pu (plant)" }, { tag: "X" }, { tag: "HEAD", subject: "seat", files: unitFiles("pu") }], { mainAt: "X" });
    const ok = o.lines.some((l) => /^ {2}witness ‹pu› L \d+(\.\d+)? s · GREEN PU planted · 1 clause\(s\)$/.test(l));
    return { ok, why: ok ? "one `  witness ‹pu› L <s> s · <LAST>` line" : `no L seconds line · ${tail(o)}` };
  },
  "W-L10 PLUS"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "L", subject: "unit pq + pu (a shared landing)" }, { tag: "X" }, { tag: "HEAD", subject: "seat", files: unitFiles("pu") }], { mainAt: "X" });
    const m = Lmark(o, "pu").find((x) => x.org !== "HEAD");
    return { ok: !!m && m.org === "L" && okLine(o, LA("pu")), why: m ? `\`unit pq + pu (\`: ‹pu›'s --org ${m.org}` : `no L-leg spawn · ${tail(o)}` };
  },
  "W-R1 DROP"(t) {
    const o = door(t, { HEAD: "X1" }, REB("DROP", "X1"));
    return { ok: okLine(o, HEADA("pu")), why: okLine(o, HEADA("pu")) ? "head `RED PU · X1`, X1 a valid DROP: the head assert ok" : failAt(o, HEADA("pu")) || tail(o) };
  },
  "W-R2 KEEPATL"(t) {
    const o = door(t, { HEAD: "X1", LU: "X1" }, REB("DROP", "X1"));
    const d = failAt(o, LA("pu"));
    return { ok: /red at L: X1$/.test(d), why: d || `no L red · ${tail(o)}` };
  },
  "W-R3 STALE"(t) {
    const o = door(t, {}, REB("DROP", "X1"));
    const d = failAt(o, "REBASE ‹pu› · every DROP id is still red at head");
    return { ok: /X1 · STALE/.test(d), why: d || `no STALE red · ${tail(o)}` };
  },
  "W-R4 ORDER"(t) {
    const o = door(t, { HEAD: "X1" }, REB("DROP", "X1"), { order: "before" });
    const d = failAt(o, "REBASE ‹pu› · every line is valid");
    return { ok: /INVALID line 1: the order is wrong/.test(d) && !!failAt(o, HEADA("pu")), why: d ? `${d} · X1 kept at head ${!!failAt(o, HEADA("pu"))}` : `no INVALID red · ${tail(o)}` };
  },
  "W-R5 UNKNOWN"(t) {
    const o = door(t, { HEAD: "X1" }, REB("DROP", "ZZ"));
    const d = failAt(o, "REBASE ‹pu› · every line is valid");
    return { ok: /INVALID line 1: ZZ is no quoted literal/.test(d), why: d || `no INVALID red · ${tail(o)}` };
  },
  "W-R6 NEWDEATH"(t) {
    const o = door(t, { HEAD: "X1 X2" }, REB("DROP", "X1"));
    const d = failAt(o, HEADA("pu"));
    return { ok: /red beyond BOUND: X2$/.test(d), why: d || `no head red · ${tail(o)}` };
  },
  "W-R7 RECUT"(t) {
    const o = door(t, { LU: "X1" }, REB("RECUT", "X1"));
    return { ok: okLine(o, LA("pu")) && okLine(o, HEADA("pu")), why: `L assert ok ${okLine(o, LA("pu"))} (L \`RED PU · X1\`, X1 re-cut) · head ok ${okLine(o, HEADA("pu"))}` };
  },
  "W-R8 RECUTHEAD"(t) {
    const o = door(t, { HEAD: "X1" }, REB("RECUT", "X1"));
    const d = failAt(o, HEADA("pu"));
    return { ok: /red beyond BOUND: X1$/.test(d), guard: true, why: d || `head not red · ${tail(o)}` };
  },
  "W-R9 PENDING"(t) {
    const o = door(t, { HEAD: "X1" }, REB("DROP", "X1"), { pvLanded: false });
    return { ok: okLine(o, HEADA("pu")) && !failAt(o, "REBASE ‹pu› · every line is valid"), why: `pv not landed (its line rides pv's landing): head ok ${okLine(o, HEADA("pu"))} · INVALID ${!!failAt(o, "REBASE ‹pu›")}` };
  },
  "W-T1 TRIGGER"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "L", subject: "unit pu (plant)", files: unitFiles("pu") }, { tag: "X" }, { tag: "HEAD", subject: "seat", files: { "notes/y.txt": "y\n" } }], { mainAt: "X" });
    const c = o.lines.filter((l) => /^ {2}witness ‹pu› L · carried — /.test(l)).length;
    return { ok: c === 1 && Lmark(o, "pu").length === 1 && !has(o, LA("pu")), why: `carried lines ${c} · spawns ${Lmark(o, "pu").length} · L assert ${has(o, LA("pu"))}` };
  },
  "W-T2 CHANGED"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "L", subject: "unit pu (plant)", files: unitFiles("pu") }, { tag: "X" }, { tag: "HEAD", subject: "seat", files: { "ci/pu/NOTE": "a changed ci dir\n" } }], { mainAt: "X" });
    return { ok: okLine(o, LA("pu")) && Lmark(o, "pu").length === 2, why: `L assert ${has(o, LA("pu"))} · spawns ${Lmark(o, "pu").length}` };
  },
  "W-T3 MERGEBASE"(t) {
    const o = memberRun(t, [{ tag: "P" }, { tag: "L", subject: "unit pu (plant)", files: unitFiles("pu") }, { tag: "M", subject: "main moves", files: { "ci/pu/NOTE": "main changed ci/pu after the seat's cut\n" } },
      { tag: "HEAD", from: "L", branch: "seat", subject: "seat", files: { "notes/y.txt": "y\n" } }], { mainAt: "M" });
    const c = o.lines.filter((l) => /^ {2}witness ‹pu› L · carried — /.test(l)).length;
    return { ok: c === 1 && Lmark(o, "pu").length === 1 && !has(o, LA("pu")), why: `carried lines ${c} · spawns ${Lmark(o, "pu").length} · L assert ${has(o, LA("pu"))}` };
  },
  "W-G1 SUBJECT"(t) { const l = landDry(t, { subject: "wip", files: U1() }); return { ok: /^REFUSED SUBJECT · u1 /.test(l), why: l }; },
  "W-G2 LANDEDON"(t) { const l = landDry(t, { subject: "unit u1 (plant)", files: U1(`${"c".repeat(40)}\n`) }); return { ok: /^REFUSED LANDED-ON · u1 /.test(l), why: l }; },
  "W-G3 GOOD"(t) { const l = landDry(t, { subject: "unit u1 (plant)", files: U1() }); return { ok: /^DRY u1 /.test(l), guard: true, why: l }; },
  "W-G4 PLUS"(t) {
    const l = landDry(t, { subject: "unit u1 + u2 (plant)", files: { ...U1(), "ci/u2/LANDED_ON": `${"d".repeat(40)}\n` } });
    return { ok: /^REFUSED LANDED-ON · u1 .*ci\/u2\/LANDED_ON/.test(l), why: l };
  },
  "W-G5 PLUSOK"(t) { const l = landDry(t, { subject: "unit u1 + u2 (plant)", files: { ...U1(), "ci/u2/LANDED_ON": "@P@" } }); return { ok: /^DRY u1 /.test(l), guard: true, why: l }; },
  "W-G6 BEFORE"(t) { const l = landDry(t, { landedOnMain: false, subject: "wip", files: U1() }); return { ok: /^DRY u1 /.test(l), guard: true, why: l }; },
  "W-C1 CARRY"(t) {
    const miss = [];
    for (const u of CARRIED) {
      const v = src(t, `ci/${u}/LANDED_ON`);
      if (v == null || !/^[0-9a-f]{40}\n$/.test(v)) { miss.push(`${u}: no 40-hex LANDED_ON`); continue; }
      const p = IN_REPO ? derivedP(u) : undefined;
      if (IN_REPO && p !== v.trim()) miss.push(`${u}: LANDED_ON ${v.slice(0, 7)} ≠ ${p ? p.slice(0, 7) : "no landing on main"}`);
    }
    return { ok: miss.length === 0, why: miss.length ? miss.slice(0, 4).join(" · ") + (miss.length > 4 ? ` … ${miss.length} in all` : "") : `${CARRIED.length} units carry LANDED_ON, ${IN_REPO ? "each the parent of its oldest landing on main's first-parent line" : "the history NAMED unreachable (no repository at the witness copy)"}` };
  },
};
const GUARDS = new Set(["W-L5 NOTLANDED", "W-R8 RECUTHEAD", "W-G3 GOOD", "W-G5 PLUSOK", "W-G6 BEFORE"]);

/** C7, inside this repository only: the parent of <u>'s oldest landing on origin/main's first-parent line (null = none) */
const HERE = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const IN_REPO = spawnSync("git", ["-C", HERE, "rev-parse", "--is-inside-work-tree"], { encoding: "utf8", windowsHide: true }).stdout?.trim() === "true"
  && spawnSync("git", ["-C", HERE, "rev-parse", "--verify", "-q", "refs/remotes/origin/main"], { windowsHide: true }).status === 0;
let LINE = null;
function derivedP(u) {
  if (!LINE) LINE = String(spawnSync("git", ["-C", HERE, "log", "--first-parent", "--format=%H%x09%s", "refs/remotes/origin/main", "--"], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 28 }).stdout || "")
    .split(/\r?\n/).filter(Boolean).map((l) => { const i = l.indexOf("\t"); return { h: l.slice(0, i), s: l.slice(i + 1) }; });
  const names = (s) => { const m = /^unit ([A-Za-z0-9-]+(?:\s*\+\s*[A-Za-z0-9-]+)*) \(/.exec(s); return m ? m[1].split("+").map((x) => x.trim()) : []; };
  let k = -1;
  LINE.forEach((c, i) => { if (names(c.s).includes(u)) k = i; });
  return k > -1 && LINE[k + 1] ? LINE[k + 1].h : null;
}
function files(dir) {
  const out = new Map();
  const walk = (d) => { for (const n of readdirSync(d)) { if (n === ".git" || n === "node_modules") continue; const p = join(d, n); if (statSync(p).isDirectory()) { if (relative(dir, p).split(sep).join("/") === "dressing-room/state") continue; walk(p); } else out.set(relative(dir, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p, "latin1").replace(/\r\n/g, "\n")).digest("hex")); } };
  walk(dir); return out;
}
function boundClause() {
  const a = files(BASE), b = files(ORG), diff = [];
  const all = [...new Set([...a.keys(), ...b.keys()])];
  const ig = spawnSync("git", ["-C", HERE, "check-ignore", "--no-index", "--stdin"], { input: all.join("\n") + "\n", encoding: "utf8", windowsHide: true, timeout: JOB_MS });
  for (const k of String(ig.stdout || "").split(/\r?\n/).filter(Boolean)) { a.delete(k); b.delete(k); }
  for (const k of new Set([...a.keys(), ...b.keys()])) if (a.get(k) !== b.get(k)) diff.push(k);
  const off = diff.filter((p) => !NAMED.includes(p) && !NAMED_CI(p));
  return { ok: off.length === 0 && diff.includes("scripts/organism_test.mjs"), why: off.length ? `off-bound: ${off.slice(0, 5).join(", ")}` : `${diff.length} differing path(s), all named` };
}
function survivors() {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true, timeout: JOB_MS });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.toLowerCase().includes(ROOT.toLowerCase()) && !l.includes("witness_ms2")).map((l) => Number(l.trim().split(" ")[0])).filter(Boolean);
  }
  const out = [];
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(ROOT)) out.push(Number(p)); } catch {}
  }
  return out;
}

const only = arg("--only");
const red = [];
try {
  for (const [name, fn] of Object.entries(CLAUSES)) {
    if (only && !only.split(",").includes(name)) continue;
    let onBase, onBuild;
    try { onBase = await fn(BASE); } catch (e) { onBase = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; }
    try { onBuild = await fn(ORG); } catch (e) { onBuild = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; }
    const guard = GUARDS.has(name);
    const pass = guard ? onBase.ok && onBuild.ok : !onBase.ok && onBuild.ok;
    console.log(`  ${pass ? "✓" : "✗"} ${name} · base ${onBase.ok ? (guard ? "GREEN (guard)" : "GREEN (does not discriminate)") : "RED"} · build ${onBuild.ok ? "GREEN" : "RED"} — ${onBuild.why}${guard && !onBase.ok ? ` · base: ${onBase.why}` : ""}`);
    if (!pass) red.push(name);
  }
  if (!only) { let b; try { b = boundClause(); } catch (e) { b = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; } console.log(`  ${b.ok ? "✓" : "✗"} BOUND · ${b.why}`); if (!b.ok) red.push("BOUND"); }
} finally {
  const left = survivors();
  console.log(`  ${left.length === 0 ? "✓" : "✗"} LAST · ${left.length} node process(es) naming the temp dir survive`);
  if (left.length) { red.push("LAST"); for (const p of left) { try { process.kill(p); } catch {} } }
  try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
}
const total = (only ? only.split(",").length : Object.keys(CLAUSES).length + 1) + 1;
console.log(red.length ? `RED MS2 · ${red.join(", ")}` : `GREEN MS2 every landed unit judged at its LANDED sha, at head only what still binds · ${total} clause(s)`);
process.exit(red.length ? 1 : 0);
