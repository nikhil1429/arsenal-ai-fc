#!/usr/bin/env node
// ============================================================================
// ci/ms1/witness_ms1.mjs — WITNESS of unit ms1 (every landed unit's witness rides the suite, judged against its own BASE)
// ----------------------------------------------------------------------------
// CONTRACT (forks rows 1054 / 1055 / 1066 / 1064 / 1065; spec ci/ms1/MS1_SPEC.md on claude/ms1-spec):
//   node ci/ms1/witness_ms1.mjs --org <build tree> --base-org <base tree> [--only <clause,…>]
// Every plant is a throwaway git repo under os.tmpdir(), made with core.autocrlf=false at init or clone; W-B1.2's plant then
// sets core.autocrlf=true and core.eol=crlf in its OWN config on purpose (the member's tree must come out LF regardless).
// A member plant holds the tree's scripts/organism_test.mjs, its .github/workflows/suite.yml (the bound the member reads) and
// a planted ci/<unit>/ whose witness is a few lines of node; the member runs over the PLANT, never over a real witness.
// A land plant (the ci/mlj sandbox shape) holds the tree's scripts/land.mjs and planted stubs (ci_verdict GREEN, sitting
// CLOSED, the archivist's tripwire passes, a keeper whose judgeHeld answers free and binds nothing), a bare origin and a
// laptop clone; every land call is --dry. THE PORT CLASS (row 1053): this witness binds no port and names no live service;
// the one door it plants (ARSENAL_JUDGE_PORT) is read back from the planted witness's env. Every spawn is bounded by the
// job's own timeout-minutes read from the tree's .github/workflows/suite.yml (never typed here).
//   B1.1 BASE     the member hands --base-org the BASE sha's tree and --org HEAD's (a marker only each one has)
//   B1.2 LF       a plant repo set to core.autocrlf=true + core.eol=crlf → both trees reach the witness with no \r
//   B1.3 NOCALC   static: witnesses()'s body names no merge-base, no HEAD^, no ^1 (the base is read, never computed)
//   B2.1 FULL     full profile → exactly ONE `  SKIP WITNESSES — ` line, no witness spawned, no assert
//   B2.2 LAPTOP   hermetic profile without GITHUB_ACTIONS → the same one line, nothing spawned
//   B2.3 NEUTRAL  hermetic + GITHUB_ACTIONS=true (F3 A) → the planted witness runs
//   B3.1 CARRIED  static on the tree: every landed unit's ci/<unit>/witness_<unit>.mjs with a 40-hex BASE, every BASE a
//                 commit of main's history, ci/mcr/ split (F9 B)
//   B3.2 NOCI     land.mjs, origin main carrying a ci/<unit>/BASE: a landing with no ci dir → REFUSED NO-CI-DIR
//   B3.3 CIDIR    the same origin: a landing carrying ci/<unit>/witness + BASE (names gate passed) → DRY (guard)
//   B3.4 BEFORE   an origin main with no ci/<unit>/BASE (before ms1 lands): no ci dir → DRY (guard: the law binds from ms1 on)
//   B3.5 GATE     F10 A: a new ci/<unit>/ file with no --names-gate result → REFUSED NAMES-GATE-ABSENT
//   B4.1 LISTEN   a planted witness that binds 4117 by a literal listen → its assert RED, naming 4117 and the witness line
//   B4.2 DERIVED  a planted organ's `export const PLANT_PORT = 4999` named by the witness → RED naming the ORGAN line
//   B4.3 ADMIT    listen(0, …) and ARSENAL_SITTING_PORT beside a spawn → admitted (the witness runs, ok)
//   B4.4 NOSPAWN  a refused witness is never spawned (its marker absent)
//   B4.5 DOOR     F5 B: a planted organ JUDGE_PORT with env door ARSENAL_JUDGE_PORT → admitted, and the witness's env
//                 carries a free port in that door (not the organ's literal)
//   B5.1 SECONDS  one `  witness ‹unit› <s> s · <LAST line>` per unit and one `  witnesses · <n> unit(s) · <s> s`
//   B5.2 NOFETCH  a BASE absent from the clone → RED `its BASE is in the clone`, and git never fetches (GIT_TRACE)
//   B6.1 NOBASE   a unit with a witness and no BASE → RED `carries a BASE file (B6)`
//   B6.2 SHORT    a 7-char BASE → RED
//   B6.3 SKIPWINS the missing-BASE plant on the laptop (no GITHUB_ACTIONS) → the skip line, no red
//   F1   BOUND    a witness whose LAST line is `RED PX · BOUND` (exit 1) → ok (F1 A: BOUND dropped)
//   F1W  BOUNDID  a witness whose BOUND id is `W6 BOUND` (its own literal) → ok
//   F11  BEHAVE   `RED PX · J4 BOUND` → FAIL naming J4 (F11 A: a behavioural red at head is a RED member)
//   R1   RULED    row 1107 (1)(c): a planted ‹mjd3› red exactly `J4` → RULED (row 1107, owner unit mr3), UNRULED 0
//   R2   STALE    the same member GREEN → its entry is STALE, exit 2 (a ruled entry whose member turns green is refused)
//   R3   NEWDEATH ‹mjd3› red `J1 J4` → UNRULED, exit 2 (a new clause red never hides under the ruled one)
//   V1   KEYOF    ci_verdict compare: head red WITNESS ‹mlv1› vs base red WITNESS ‹mlv0› → RED (F4 A)
// Each clause runs on --base-org (must be RED) and on --org (must be GREEN); a GUARD (B3.3, B3.4) must be GREEN on both.
// BOUND: only scripts/organism_test.mjs, scripts/land.mjs, scripts/ci_verdict.mjs and files under ci/ differ (text, CRLF
// folded to LF). LAST: no node process naming the temp dir survives.
// LAST LINE: GREEN MS1 every landed witness rides the suite · <n> clause(s)  (exit 0)  ·  RED MS1 · <clauses>  (exit 1)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
if (!ORG || !BASE) { console.log("RED MS1 · usage: --org <dir> --base-org <dir>"); process.exit(1); }
const NAMED = ["scripts/organism_test.mjs", "scripts/land.mjs", "scripts/ci_verdict.mjs"], NAMED_DIRS = ["ci/"];
// the landed units of ci/ms1/PROOF.md §0.2 (measured at the cut 3e3ce63, 18 Nov 2026), each carried by ms1's landing
const CARRIED = ["mcr2", "mday", "mdn2", "mdone", "mf2", "mf4", "mgrd", "mjd3", "mjd4", "mjd5", "mjd6", "mjud", "mland", "mlj", "mlv0", "mlv1", "mlv2", "mlv3", "mpast", "mpm", "mtail"];
const ROOT = mkdtempSync(join(os.tmpdir(), "witness-ms1-"));
let seq = 0;

const src = (tree, rel) => { try { return readFileSync(join(tree, ...rel.split("/")), "utf8"); } catch { return null; } };
// the bound: the job's own timeout-minutes, read from the tree under judgement (the member reads the same line)
const JOB_MS = (() => { const m = /timeout-minutes:\s*(\d+)/.exec(src(ORG, ".github/workflows/suite.yml") || ""); return m ? Number(m[1]) * 60000 : 0; })();
if (!JOB_MS) { console.log("RED MS1 · the tree carries no .github/workflows/suite.yml timeout-minutes (the bound)"); process.exit(1); }
const sp = (cmd, args, o = {}) => { const r = spawnSync(cmd, args, { encoding: "utf8", windowsHide: true, timeout: JOB_MS, ...o }); return { code: r.status, out: ((r.stdout || "") + (r.stderr || "")).replace(/\r\n/g, "\n") }; };
function git(cwd, args, ok = true) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true, timeout: JOB_MS });
  if (ok && r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.stderr}`);
  return { status: r.status, out: (r.stdout || "").trim() };
}
const cfg = (cwd) => { for (const [k, v] of [["user.name", "witness"], ["user.email", "witness@example.invalid"], ["core.autocrlf", "false"], ["commit.gpgsign", "false"]]) git(cwd, ["config", k, v]); };
const put = (dir, rel, text) => { const p = join(dir, ...rel.split("/")); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, text); };
const newDir = (tag) => { const d = join(ROOT, `${tag}${++seq}`); mkdirSync(d, { recursive: true }); return d; };
const init = (d) => { git(d, ["-c", "core.autocrlf=false", "init", "-q", "-b", "main"]); cfg(d); };
const commit = (d, m) => { git(d, ["add", "-A"]); git(d, ["commit", "-q", "-m", m]); return git(d, ["rev-parse", "HEAD"]).out; };

// ── the planted witnesses (node, a few lines each) ────────────────────────────────────────────────────────────
const W_HEAD = `import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const a = (k) => process.argv[process.argv.indexOf(k) + 1];
const org = a("--org"), base = a("--base-org");
const MODE = "@MODE@", U = "@U@";
if (process.env.MS1_MARK) writeFileSync(process.env.MS1_MARK, JSON.stringify({ org, base, door: process.env.ARSENAL_JUDGE_PORT || null }));
const m = (d) => { try { return readFileSync(join(d, "m.txt"), "latin1").split(/\\r?\\n/)[0]; } catch { return null; } };
const cr = (d) => { let n = 0; const w = (x) => { for (const f of readdirSync(x)) { const p = join(x, f); if (statSync(p).isDirectory()) w(p); else if (readFileSync(p, "latin1").includes("\\r")) n++; } }; w(d); return n; };
let ok = true;
if (MODE === "marker" || MODE === "lf") ok = m(base) === "BASE" && m(org) === "HEAD";
if (MODE === "lf") ok = ok && cr(base) === 0 && cr(org) === 0;
if (MODE === "redbound") { console.log("  ✗ BOUND · off-bound: a later landing"); console.log("RED " + U + " · BOUND"); process.exit(1); }
if (MODE === "redw6") { const id = "W6 BOUND"; console.log("RED " + U + " · " + id); process.exit(1); }
if (MODE === "redj4") { console.log("RED " + U + " · J4 BOUND"); process.exit(1); }
if (MODE === "redj4j1") { console.log("RED " + U + " · J1 J4 BOUND"); process.exit(1); }
console.log(ok ? "GREEN " + U + " planted · 1 clause(s)" : "RED " + U + " · P1");
process.exit(ok ? 0 : 1);
`;
// the refused fixture of B4.1 / B4.4, spelled in two pieces so the member's static read of THIS witness never meets it
const FIXED_BIND = "// a fixed bind\nconst s = { listen() {} }; s.lis" + "ten(4117, \"127.0.0.1\");\n";
const plantWitness = (unit, mode, extra = "") => W_HEAD.replace("@MODE@", mode).replace("@U@", unit.toUpperCase()) + extra;

/** a member plant: commit 1 (m.txt BASE), commit 2 (m.txt HEAD + the unit dirs, each BASE = commit 1 unless told) →
 *  run the tree's organism_test.mjs witnesses there. @returns {{ out: string, lines: string[], mark: any, trace: string }} */
function memberRun(tree, units, { env = {}, crlf = false, organs = {} } = {}) {
  const ot = src(tree, "scripts/organism_test.mjs"), wf = src(tree, ".github/workflows/suite.yml");
  if (ot == null || wf == null) return { out: "(the tree has no organism_test.mjs / suite.yml)", lines: [], mark: null, trace: "" };
  const d = newDir("m");
  init(d);
  git(d, ["remote", "add", "origin", join(ROOT, "nowhere.git")]);
  put(d, ".gitattributes", "* text=auto\n");
  put(d, "scripts/organism_test.mjs", ot); put(d, ".github/workflows/suite.yml", wf);
  if (crlf) { git(d, ["config", "core.autocrlf", "true"]); git(d, ["config", "core.eol", "crlf"]); }
  put(d, "m.txt", crlf ? "BASE\r\nline two\r\n" : "BASE\n");
  const c1 = commit(d, "base");
  put(d, "m.txt", crlf ? "HEAD\r\nline two\r\n" : "HEAD\n");
  for (const [rel, text] of Object.entries(organs)) put(d, rel, text);
  for (const [u, spec] of Object.entries(units)) {
    put(d, `ci/${u}/witness_${u}.mjs`, spec.witness);
    for (const [f, t] of Object.entries(spec.siblings || {})) put(d, `ci/${u}/${f}`, t);
    if (spec.base !== null) put(d, `ci/${u}/BASE`, spec.base === undefined ? `${c1}\n` : spec.base);
  }
  commit(d, "head");
  const mark = join(d, "..", `${relative(ROOT, d)}.mark`), trace = join(d, "..", `${relative(ROOT, d)}.trace`);
  const e = { ...process.env, ORGANISM_TEST_PROFILE: "hermetic", GITHUB_ACTIONS: "true", MS1_MARK: mark, GIT_TRACE: trace, ...env };
  for (const [k, v] of Object.entries(e)) if (v === undefined) delete e[k];
  const r = sp(process.execPath, [join(d, "scripts", "organism_test.mjs"), "witnesses"], { cwd: d, env: e });
  let m = null; try { m = JSON.parse(readFileSync(mark, "utf8")); } catch {}
  let t = ""; try { t = readFileSync(trace, "utf8"); } catch {}
  return { out: r.out, lines: r.out.split("\n"), mark: m, trace: t, c1 };
}
const okLine = (o, u, what) => o.lines.some((l) => l.startsWith(`  ok   WITNESS ‹${u}› · ${what}`));
const failLine = (o, u, what) => o.lines.findIndex((l) => l.startsWith(`  FAIL WITNESS ‹${u}› · ${what}`));
const failDetail = (o, u, what) => { const i = failLine(o, u, what); return i > -1 ? `${o.lines[i]} ${o.lines[i + 1] || ""}` : ""; };
const verdictOf = (o) => { const l = o.lines.find((x) => x.startsWith("ORGANISM_TEST_VERDICT ")); try { return l ? JSON.parse(l.slice("ORGANISM_TEST_VERDICT ".length)) : null; } catch { return null; } };
const tail = (o) => o.lines.filter(Boolean).slice(-2).join(" | ");

// ── the land plant (ci/mlj's sandbox shape, every call --dry) ─────────────────────────────────────────────────
const VERDICT = `console.log("ci_verdict " + String(process.argv[2]).slice(0, 7) + " GREEN — planted [run 111]");\n`;
const SITTING = `console.log("sitting: daemon DOWN on :1 · file says no open sitting");\n`;
const ARCHIVIST = `console.log("tripwire: nothing that may not be published.");\n`;
const REC = `console.log("recorded");\n`;
const KEEPER = `export const JUDGE_PORT = 0;\nexport const judgeHeld = async () => false;\n`;
function landPlant(tree, { mainBase }) {
  const land = src(tree, "scripts/land.mjs");
  if (land == null) return null;
  const dir = newDir("l"), origin = join(dir, "origin.git"), seed = join(dir, "seed"), laptop = join(dir, "laptop"), seat = join(dir, "seat");
  mkdirSync(seed, { recursive: true });
  git(dir, ["-c", "core.autocrlf=false", "init", "-q", "--bare", "-b", "main", origin]);
  init(seed);
  put(seed, "scripts/land.mjs", land); put(seed, "scripts/keeper.mjs", KEEPER);
  put(seed, "scripts/ci_verdict.mjs", VERDICT); put(seed, "scripts/sitting.mjs", SITTING);
  put(seed, "scripts/archivist.mjs", ARCHIVIST); put(seed, "scripts/captains_call.mjs", REC);
  put(seed, "README.md", "seed\n"); put(seed, "notes/x.txt", "x0\n");
  if (mainBase) { put(seed, "ci/old/witness_old.mjs", "console.log('GREEN OLD planted · 1 clause(s)');\n"); put(seed, "ci/old/BASE", `${"a".repeat(40)}\n`); }
  commit(seed, "seed");
  git(seed, ["remote", "add", "origin", origin]); git(seed, ["push", "-q", "origin", "main"]);
  for (const c of [laptop, seat]) { git(dir, ["clone", "-q", "-c", "core.autocrlf=false", origin, c]); cfg(c); }
  const branch = (unit, files) => {
    git(seat, ["fetch", "-q", "origin", "main"]); git(seat, ["checkout", "-q", "-B", `land/${unit}`, "origin/main"]);
    for (const [p, t] of Object.entries(files)) put(seat, p, t);
    const T = commit(seat, `unit ${unit}`);
    git(seat, ["push", "-q", "origin", `land/${unit}`]);
    return T;
  };
  const dry = (unit, gate = null) => {
    const args = [join(laptop, "scripts", "land.mjs"), unit, "--dry"];
    if (gate) { const g = join(dir, `gate-${unit}.json`); writeFileSync(g, JSON.stringify(gate)); args.push("--names-gate", g); }
    const r = sp(process.execPath, args, { cwd: laptop });
    return r.out.trim().split("\n").pop() || "";
  };
  return { branch, dry };
}

// ── the clauses ──────────────────────────────────────────────────────────────────────────────────────────────
const CLAUSES = {
  "B1.1 BASE"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker") } });
    const ok = okLine(o, "px", "GREEN at head against its BASE") && !!o.mark;
    return { ok, why: ok ? "--base-org held the BASE sha's marker, --org HEAD's" : `no ok line · ${tail(o)}` };
  },
  "B1.2 LF"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "lf") } }, { crlf: true });
    const ok = okLine(o, "px", "GREEN at head against its BASE");
    return { ok, why: ok ? "a core.autocrlf=true + core.eol=crlf repo reached the witness as two LF trees" : `${failDetail(o, "px", "GREEN at head") || tail(o)}` };
  },
  "B1.3 NOCALC"(t) {
    const s = src(t, "scripts/organism_test.mjs") || "";
    const i = s.indexOf("async function witnesses(");
    if (i < 0) return { ok: false, why: "no witnesses() in organism_test.mjs" };
    const body = s.slice(i, s.indexOf("\n}\n", i));
    const hit = ["merge-base", "HEAD^", "^1"].filter((x) => body.includes(x));
    return { ok: hit.length === 0, why: hit.length ? `the body names ${hit.join(", ")}` : `${body.split("\n").length} line(s), no merge-base / HEAD^ / ^1` };
  },
  "B2.1 FULL"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker") } }, { env: { ORGANISM_TEST_PROFILE: undefined, GITHUB_ACTIONS: undefined } });
    const skips = o.lines.filter((l) => /^ {2}SKIP WITNESSES — /.test(l)).length, asserts = o.lines.filter((l) => /^ {2}(ok {3}|FAIL )WITNESS/.test(l)).length;
    return { ok: skips === 1 && !o.mark && asserts === 0, why: `skip lines ${skips} · spawned ${!!o.mark} · witness asserts ${asserts}` };
  },
  "B2.2 LAPTOP"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker") } }, { env: { GITHUB_ACTIONS: undefined } });
    const skips = o.lines.filter((l) => /^ {2}SKIP WITNESSES — /.test(l)).length;
    return { ok: skips === 1 && !o.mark, why: `hermetic, no GITHUB_ACTIONS: skip lines ${skips} · spawned ${!!o.mark}` };
  },
  "B2.3 NEUTRAL"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker") } });
    return { ok: !!o.mark && !o.lines.some((l) => /SKIP WITNESSES/.test(l)), why: `hermetic + GITHUB_ACTIONS: spawned ${!!o.mark}` };
  },
  "B3.1 CARRIED"(t) {
    const miss = [];
    for (const u of CARRIED) {
      const b = src(t, `ci/${u}/BASE`);
      if (src(t, `ci/${u}/witness_${u}.mjs`) == null) miss.push(`${u}: no witness`);
      else if (b == null || !/^[0-9a-f]{40}\n$/.test(b)) miss.push(`${u}: no 40-hex BASE`);
      else if (isMainCommit(b.trim()) === false) miss.push(`${u}: BASE on no main commit (F6 B)`);
    }
    if (existsSync(join(t, "ci", "mcr"))) miss.push("ci/mcr/ not split (F9 B)");
    return { ok: miss.length === 0, why: miss.length ? miss.slice(0, 4).join(" · ") + (miss.length > 4 ? ` … ${miss.length} in all` : "") : `${CARRIED.length} units carried, ${IN_REPO ? "every BASE a main commit" : "main ancestry NAMED unreachable (no repository at the witness copy)"}` };
  },
  "B3.2 NOCI"(t) {
    const p = landPlant(t, { mainBase: true }); if (!p) return { ok: false, why: "no land.mjs" };
    p.branch("u1", { "notes/x.txt": "x1\n" });
    const l = p.dry("u1");
    return { ok: /^REFUSED NO-CI-DIR · u1 /.test(l), why: l };
  },
  "B3.3 CIDIR"(t) {
    const p = landPlant(t, { mainBase: true }); if (!p) return { ok: false, why: "no land.mjs" };
    const files = { "notes/x.txt": "x1\n", "ci/u1/witness_u1.mjs": "console.log('GREEN U1 planted · 1 clause(s)');\n", "ci/u1/BASE": `${"b".repeat(40)}\n` };
    const T = p.branch("u1", files);
    const l = p.dry("u1", { sha: T, result: "PASS", paths: Object.keys(files).filter((f) => f.startsWith("ci/")), list_sha256: "0".repeat(64) });
    return { ok: /^DRY u1 /.test(l), guard: true, why: l };
  },
  "B3.4 BEFORE"(t) {
    const p = landPlant(t, { mainBase: false }); if (!p) return { ok: false, why: "no land.mjs" };
    p.branch("u1", { "notes/x.txt": "x1\n" });
    const l = p.dry("u1");
    return { ok: /^DRY u1 /.test(l), guard: true, why: l };
  },
  "B3.5 GATE"(t) {
    const p = landPlant(t, { mainBase: true }); if (!p) return { ok: false, why: "no land.mjs" };
    p.branch("u1", { "notes/x.txt": "x1\n", "ci/u1/witness_u1.mjs": "console.log(1);\n", "ci/u1/BASE": `${"b".repeat(40)}\n` });
    const l = p.dry("u1");
    return { ok: /^REFUSED NAMES-GATE-ABSENT · u1 /.test(l), why: l };
  },
  "B4.1 LISTEN"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker", FIXED_BIND) } });
    const d = failDetail(o, "px", "binds no fixed service port (B4)");
    return { ok: /4117/.test(d) && /witness_px\.mjs:\d+/.test(d), why: d || tail(o) };
  },
  "B4.2 DERIVED"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker", `// names an organ's port\nconst P = "PLANT_PORT";\n`) } }, { organs: { "scripts/plant_organ.mjs": "export const PLANT_PORT = 4999;\n" } });
    const d = failDetail(o, "px", "binds no fixed service port (B4)");
    return { ok: /PLANT_PORT/.test(d) && /scripts\/plant_organ\.mjs:1/.test(d), why: d || tail(o) };
  },
  "B4.3 ADMIT"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker", `// an OS-picked bind and the sitting door\nconst s = { listen() {} }; s.listen(0, "127.0.0.1");\nconst env = { ARSENAL_SITTING_PORT: String(0) };\n`) } });
    return { ok: okLine(o, "px", "GREEN at head against its BASE") && !!o.mark, why: okLine(o, "px", "GREEN") ? "listen(0 and ARSENAL_SITTING_PORT admitted" : tail(o) };
  },
  "B4.4 NOSPAWN"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker", FIXED_BIND) } });
    return { ok: failLine(o, "px", "binds no fixed service port (B4)") > -1 && !o.mark, why: `refused ${failLine(o, "px", "binds no fixed") > -1} · spawned ${!!o.mark}` };
  },
  "B4.5 DOOR"(t) {
    const organ = "export const JUDGE_PORT = ((p) => (p > 0 ? p : 4118))(Number(process.env.ARSENAL_JUDGE_PORT));\n";
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker", `// reads the door's port through its export name: JUDGE_PORT\n`) } }, { organs: { "scripts/plant_keeper.mjs": organ }, env: { ARSENAL_JUDGE_PORT: undefined } });
    const door = o.mark && o.mark.door;
    return { ok: okLine(o, "px", "GREEN at head against its BASE") && /^\d+$/.test(String(door)) && door !== "4118", why: `admitted ${okLine(o, "px", "GREEN")} · the witness's ARSENAL_JUDGE_PORT ${door}` };
  },
  "B5.1 SECONDS"(t) {
    const o = memberRun(t, { pa: { witness: plantWitness("pa", "marker") }, pb: { witness: plantWitness("pb", "marker") } });
    const per = ["pa", "pb"].every((u) => o.lines.some((l) => new RegExp(`^ {2}witness ‹${u}› \\d+(\\.\\d+)? s · GREEN ${u.toUpperCase()} `).test(l)));
    const tot = o.lines.some((l) => /^ {2}witnesses · 2 unit\(s\) · \d+(\.\d+)? s$/.test(l));
    return { ok: per && tot, why: `per-unit lines ${per} · total line ${tot}` };
  },
  "B5.2 NOFETCH"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker"), base: `${"c".repeat(40)}\n` } });
    const red = failLine(o, "px", "its BASE is in the clone") > -1, fetched = /\bfetch\b/.test(o.trace);
    return { ok: red && !fetched && !o.mark, why: `RED its BASE is in the clone ${red} · git fetch in GIT_TRACE ${fetched} · spawned ${!!o.mark}` };
  },
  "B6.1 NOBASE"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker"), base: null } });
    return { ok: failLine(o, "px", "carries a BASE file (B6)") > -1 && !o.mark, why: failDetail(o, "px", "carries a BASE") || tail(o) };
  },
  "B6.2 SHORT"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker"), base: "abcdef1\n" } });
    return { ok: failLine(o, "px", "carries a BASE file (B6)") > -1 && !o.mark, why: failDetail(o, "px", "carries a BASE") || tail(o) };
  },
  "B6.3 SKIPWINS"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "marker"), base: null } }, { env: { GITHUB_ACTIONS: undefined } });
    const skips = o.lines.filter((l) => /^ {2}SKIP WITNESSES — /.test(l)).length;
    return { ok: skips === 1 && failLine(o, "px", "carries a BASE") < 0, why: `laptop: skip lines ${skips} · B6 red ${failLine(o, "px", "carries a BASE") > -1}` };
  },
  "F1 BOUND"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "redbound") } });
    return { ok: okLine(o, "px", "GREEN at head against its BASE"), why: okLine(o, "px", "GREEN") ? "RED PX · BOUND judged GREEN (BOUND dropped)" : failDetail(o, "px", "GREEN") || tail(o) };
  },
  "F1W BOUNDID"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "redw6") } });
    return { ok: okLine(o, "px", "GREEN at head against its BASE"), why: okLine(o, "px", "GREEN") ? "RED PX · W6 BOUND judged GREEN (the witness's own BOUND id)" : failDetail(o, "px", "GREEN") || tail(o) };
  },
  "F11 BEHAVE"(t) {
    const o = memberRun(t, { px: { witness: plantWitness("px", "redj4") } });
    const d = failDetail(o, "px", "GREEN at head against its BASE");
    return { ok: /red beyond BOUND: J4\b/.test(d), why: d || tail(o) };
  },
  "R1 RULED"(t) {
    const o = memberRun(t, { mjd3: { witness: plantWitness("mjd3", "redj4") } });
    const v = verdictOf(o), r = v && v.ruled.find((x) => x.assert === "WITNESS ‹mjd3› · GREEN at head against its BASE");
    return { ok: !!r && r.row === 1107 && r.owner === "unit mr3" && v.unruled.length === 0, why: v ? `ruled ${JSON.stringify(v.ruled)} · unruled ${v.unruled.length}` : tail(o) };
  },
  "R2 STALE"(t) {
    const o = memberRun(t, { mjd3: { witness: plantWitness("mjd3", "marker") } });
    const v = verdictOf(o);
    return { ok: !!v && v.stale.includes("WITNESS ‹mjd3› · GREEN at head against its BASE") && v.exit === 2, why: v ? `stale ${JSON.stringify(v.stale)} · exit ${v.exit}` : tail(o) };
  },
  "R3 NEWDEATH"(t) {
    const o = memberRun(t, { mjd3: { witness: plantWitness("mjd3", "redj4j1") } });
    const v = verdictOf(o), u = v && v.unruled.find((x) => x.assert === "WITNESS ‹mjd3› · GREEN at head against its BASE");
    return { ok: !!u && v.ruled.length === 0 && v.exit === 2, why: v ? `unruled ${JSON.stringify(v.unruled)} · exit ${v.exit}` : tail(o) };
  },
  "V1 KEYOF"(t) {
    const cv = join(t, "scripts", "ci_verdict.mjs");
    if (!existsSync(cv)) return { ok: false, why: "no ci_verdict.mjs" };
    const d = newDir("v"), line = (reds) => `ORGANISM_TEST_VERDICT ${JSON.stringify({ pass: 1, fail: reds.length, reds, live: [], profile: "hermetic" })}\n`;
    put(d, "head.txt", line(["WITNESS ‹mlv1› · GREEN at head against its BASE"])); put(d, "base.txt", line(["WITNESS ‹mlv0› · GREEN at head against its BASE"]));
    const r = sp(process.execPath, [cv, "compare", "--head", join(d, "head.txt"), "--base", join(d, "base.txt"), "--label", "node 22"], { cwd: d });
    return { ok: r.code === 1, why: `compare exit ${r.code} (‹mlv1› at head vs ‹mlv0› at the base)` };
  },
};
const GUARDS = new Set(["B3.3 CIDIR", "B3.4 BEFORE"]);

/** is <sha> on main's history in the repository this witness sits in (B3.1, F6 B); null = no repository here (the
 *  member runs a witness from a COPY of its dir under the temp dir: there the ancestry is NAMED unreachable, not guessed) */
const HERE = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const IN_REPO = spawnSync("git", ["-C", HERE, "rev-parse", "--is-inside-work-tree"], { encoding: "utf8", windowsHide: true }).stdout?.trim() === "true";
function isMainCommit(sha) {
  if (!IN_REPO) return null;
  for (const ref of ["origin/main", "main"]) if (spawnSync("git", ["-C", HERE, "merge-base", "--is-ancestor", sha, ref], { windowsHide: true }).status === 0) return true;
  return false;
}
function files(dir) {
  const out = new Map();
  const walk = (d) => { for (const n of readdirSync(d)) { if (n === ".git" || n === "node_modules") continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else out.set(relative(dir, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p, "latin1").replace(/\r\n/g, "\n")).digest("hex")); } };
  walk(dir); return out;
}
function boundClause() {
  const a = files(BASE), b = files(ORG), diff = [];
  // a gitignored file (a *.log an organ wrote at run time) is no landing path: the witness's OWN repo's .gitignore says so
  const all = [...new Set([...a.keys(), ...b.keys()])];
  const ig = spawnSync("git", ["-C", HERE, "check-ignore", "--no-index", "--stdin"], { input: all.join("\n") + "\n", encoding: "utf8", windowsHide: true, timeout: JOB_MS });
  for (const k of String(ig.stdout || "").split(/\r?\n/).filter(Boolean)) { a.delete(k); b.delete(k); }
  for (const k of new Set([...a.keys(), ...b.keys()])) if (a.get(k) !== b.get(k)) diff.push(k);
  const off = diff.filter((p) => !NAMED.includes(p) && !NAMED_DIRS.some((d) => p.startsWith(d)) && !p.startsWith("dressing-room/state/"));
  return { ok: off.length === 0 && diff.includes("scripts/organism_test.mjs"), why: off.length ? `off-bound: ${off.slice(0, 5).join(", ")}` : `${diff.length} differing path(s), all named` };
}
function survivors() {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true, timeout: JOB_MS });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.toLowerCase().includes(ROOT.toLowerCase()) && !l.includes("witness_ms1")).map((l) => Number(l.trim().split(" ")[0])).filter(Boolean);
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
    console.log(`  ${pass ? "✓" : "✗"} ${name} · base ${onBase.ok ? (guard ? "GREEN (guard)" : "GREEN (does not discriminate)") : "RED"} · build ${onBuild.ok ? "GREEN" : "RED"} — ${onBuild.why}`);
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
console.log(red.length ? `RED MS1 · ${red.join(", ")}` : `GREEN MS1 every landed witness rides the suite · ${total} clause(s)`);
process.exit(red.length ? 1 : 0);
