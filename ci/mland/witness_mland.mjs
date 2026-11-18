#!/usr/bin/env node
// ============================================================================
// ci/mland/witness_mland.mjs — WITNESS of unit mland (THE LANDING VERB, scripts/land.mjs)
// ----------------------------------------------------------------------------
// CONTRACT (rulings row 1029 L1–L4 · C1–C3 · S1 · Q4 · corrections to steps 8 and 11; spec ci/mcr/B2_SPEC.md §2 + §6,
// clauses V1–V8, CR1–CR4, MUT, on branch claude/mcr-b2-spec):
//   node ci/mland/witness_mland.mjs --org <build tree> --base-org <base tree>
// Real git on copies under os.tmpdir(): a bare origin, a "seat" clone that pushes land/<unit>, a "laptop" clone (HIS
// tree, main checked out) that runs `node scripts/land.mjs`, an "other" clone that moves origin. The tree under
// judgement gives scripts/land.mjs, scripts/groundsman.mjs and scripts/daykey.mjs; every other organ the verb calls is
// a PLANTED stub (ci_verdict answers MLAND_V, sitting answers MLAND_S, archivist's tripwire refuses an oura credential
// path, captains_call/awayday record their argv). No network, no real card, no state of his.
//   V1  verdict RED → REFUSED VERDICT-RED, nothing moves · GREEN → LANDED, his main == origin main == T, and the verdict
//       was asked for T itself (C1: the sha judged is the sha landed)
//   V2  origin moved past T's parent → REFUSED MAIN-MOVED · equal → lands
//   V3  his main holds an unpushed state commit → REFUSED LOCAL-AHEAD · none → lands
//   V4  a dirty file at a path T changes → STOP DIRTY-PATH, main unmoved, his bytes unchanged · a dirty file elsewhere →
//       lands, his bytes unchanged
//   V5  origin refuses the push → PUSHED NO, his main STAYS at T (L4), ONE card, no --force anywhere in the verb ·
//       origin accepts → pushed
//   V6  a sitting OPEN → REFUSED SITTING-OPEN · closed → lands
//   V7  T touches dressing-room/state/ → REFUSED STATE-PATH; .claude/settings.json → REFUSED SETTINGS-PATH · neither → lands
//   V8  T touches package-lock.json + a file in a non-keeper unit's import closure → the line holds `npm ci` and that
//       unit as stale (printed, not run), the keeper unit named as retiring itself · T touches neither → none
//   CR1 a commit in H0..H1 touches a READS path → NO-CARRY · only other paths → CARRIES
//   CR2 a witness with no READS line → NO-CARRY · with one → CARRIES
//   CR3 a touch then its revert (empty diff) → NO-CARRY
//   CR4 the witness opens a repo file its list omits → INVALID LIST · opens only declared paths → VALID LIST
//   L2  two landings → `count` says 2 of 10 · a STOP a human resolves → 0 of 10
//   L3  two commits on the branch → REFUSED MULTI-COMMIT · one → lands
//   L4  his main holds a landing whose push was refused, origin still at its parent → the groundsman's night pushes it
//       (lawful, not held) · origin moved past it → idle LANDING-BEHIND, ONE card, nothing rewritten
//   Q4  a NEW ci/witness file with no names-gate result → REFUSED NAMES-GATE-ABSENT · with a PASS result over it → lands ·
//       a landed blob that IS the names list → REFUSED NAMES-LIST-PATH
//   S8  a LIVE witness RED at T → STOP LIVE-RED · GREEN → lands; the verb never says `worktree`
// Each clause runs on --base-org (must be RED) and on --org (must be GREEN). BOUND: only scripts/land.mjs,
// scripts/groundsman.mjs and ci/mland/ differ. LAST: no node process naming the temp dir survives.
// LAST LINE: GREEN MLAND landing verb · <n> clause(s)  (exit 0)  ·  RED MLAND · <clauses>  (exit 1)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
if (!ORG || !BASE) { console.log("RED MLAND · usage: --org <dir> --base-org <dir>"); process.exit(1); }
const NAMED = ["scripts/land.mjs", "scripts/groundsman.mjs"], NAMED_DIRS = ["ci/mland/"];
const ROOT = mkdtempSync(join(os.tmpdir(), "witness-mland-"));
const STATE = "dressing-room/state";
let seq = 0;

function git(cwd, args, ok = true) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  if (ok && r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.stderr}`);
  return { status: r.status, out: (r.stdout || "").trim() };
}
const cfg = (cwd) => { for (const [k, v] of [["user.name", "witness"], ["user.email", "witness@example.invalid"], ["core.autocrlf", "false"], ["commit.gpgsign", "false"]]) git(cwd, ["config", k, v]); };
const put = (dir, rel, text) => { const p = join(dir, ...rel.split("/")); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, text); };
const read = (dir, rel) => { try { return readFileSync(join(dir, ...rel.split("/")), "utf8"); } catch { return null; } };
const src = (tree, rel) => { try { return readFileSync(join(tree, ...rel.split("/")), "utf8"); } catch { return null; } };

const REC = `import { appendFileSync } from "node:fs";\nappendFileSync(process.env.MLAND_LOG, JSON.stringify(process.argv.slice(1)) + "\\n");\n`;
const VERDICT = REC + `const v = process.env.MLAND_V || "GREEN";\nconsole.log("ci_verdict " + String(process.argv[2]).slice(0, 7) + " " + v + " — planted [run 111] [run 222]");\nprocess.exitCode = v === "GREEN" ? 0 : 1;\n`;
const SITTING = `import "./sitlib.mjs";\nconst s = process.env.MLAND_S || "CLOSED";\nconsole.log(s === "OPEN" ? "sitting: OPEN study 'x' · s1 · daemon :1 pid 1 up 1s" : "sitting: daemon DOWN on :1 · file says no open sitting · start: node scripts/sitting.mjs daemon");\n`;
const ARCHIVIST = `import { spawnSync } from "node:child_process";\nconst r = spawnSync("git", ["diff", "--cached", "--name-only"], { encoding: "utf8" });\nconst bad = String(r.stdout || "").split(/\\r?\\n/).filter((p) => /oura_(secrets|tokens)\\.json$/.test(p));\nconsole.log(bad.length ? "tripwire: COMMIT REFUSED " + bad[0] : "tripwire: nothing that may not be published.");\nprocess.exitCode = bad.length ? 1 : 0;\n`;

function sandbox(tree) {
  const dir = join(ROOT, `s${++seq}`);
  const origin = join(dir, "origin.git"), seed = join(dir, "seed"), laptop = join(dir, "laptop"), seat = join(dir, "seat"), other = join(dir, "other");
  mkdirSync(seed, { recursive: true });
  git(dir, ["-c", "core.autocrlf=false", "init", "-q", "--bare", "-b", "main", origin]);   // autocrlf AT init/clone time: the laptop system gitconfig has core.autocrlf=true (architect, CLASS)
  git(seed, ["-c", "core.autocrlf=false", "init", "-q", "-b", "main"]); cfg(seed);
  for (const f of ["scripts/land.mjs", "scripts/groundsman.mjs", "scripts/daykey.mjs"]) { const t = src(tree, f); if (t != null) put(seed, f, t); }
  put(seed, "scripts/ci_verdict.mjs", VERDICT); put(seed, "scripts/sitting.mjs", SITTING); put(seed, "scripts/sitlib.mjs", "export const s = 1;\n");
  put(seed, "scripts/archivist.mjs", ARCHIVIST); put(seed, "scripts/captains_call.mjs", REC); put(seed, "scripts/awayday.mjs", REC);
  put(seed, "scripts/brain.mjs", `import { keep } from "./keeper.mjs";\nimport { s } from "./sitlib.mjs";\nkeep(s);\n`); put(seed, "scripts/keeper.mjs", "export const keep = () => 0;\nexport const JUDGE_PORT = 0;\nexport const judgeHeld = async () => false;\n");   // ms1 (row 1064 (3), the one ADDED edit): the stub answers land.mjs's judge gate (unit mlj)
  put(seed, "setup/services/ArsenalFC-Sitting.xml", "<service>\n  <arguments>scripts/sitting.mjs daemon</arguments>\n</service>\n");
  put(seed, "setup/services/ArsenalFC-Brain.xml", "<service>\n  <arguments>scripts/brain.mjs daemon</arguments>\n</service>\n");
  put(seed, `${STATE}/a.json`, "{\"a\":0}\n"); put(seed, "README.md", "seed\n"); put(seed, "notes/x.txt", "x0\n"); put(seed, "package-lock.json", "{}\n");
  git(seed, ["add", "-A"]); git(seed, ["commit", "-q", "-m", "seed"]);
  git(seed, ["remote", "add", "origin", origin]); git(seed, ["push", "-q", "origin", "main"]);
  for (const c of [laptop, seat, other]) { git(dir, ["clone", "-q", "-c", "core.autocrlf=false", origin, c]); cfg(c); }
  const log = join(dir, "calls.log");
  const env = (x = {}) => ({ ...process.env, MLAND_LOG: log, MLAND_V: "GREEN", MLAND_S: "CLOSED", ...x });
  const land = (args, x) => { const r = spawnSync(process.execPath, [join(laptop, "scripts", "land.mjs"), ...args], { cwd: laptop, encoding: "utf8", windowsHide: true, env: env(x) }); const o = ((r.stdout || "") + (r.stderr || "")).trim(); return { code: r.status, out: o, last: o.split(/\r?\n/).pop() || "" }; };
  const night = () => { const r = spawnSync(process.execPath, [join(laptop, "scripts", "groundsman.mjs"), "push"], { cwd: laptop, encoding: "utf8", windowsHide: true, env: env() }); return (r.stdout || "") + (r.stderr || ""); };
  const calls = () => (read(dir, "calls.log") || "").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
  const cards = () => calls().filter((a) => a.includes("file")).map((a) => a[a.indexOf("--key") + 1]);
  // the seat's branch: n commits on origin main, each writing files { path: text }
  const branch = (unit, ...commits) => {
    git(seat, ["fetch", "-q", "origin", "main"]); git(seat, ["checkout", "-q", "-B", `land/${unit}`, "origin/main"]);
    for (const files of commits) { for (const [p, t] of Object.entries(files)) put(seat, p, t); git(seat, ["add", "-A"]); git(seat, ["commit", "-q", "-m", `unit ${unit}`]); }
    git(seat, ["push", "-q", "-f", "origin", `land/${unit}`]);                 // the SEAT's own branch, never main
    return git(seat, ["rev-parse", "HEAD"]).out;
  };
  const moveOrigin = (rel, text) => { git(other, ["pull", "-q", "--ff-only"]); put(other, rel, text); git(other, ["add", "-A"]); git(other, ["commit", "-q", "-m", "origin moved"]); git(other, ["push", "-q", "origin", "main"]); return git(other, ["rev-parse", "HEAD"]).out; };
  const main = () => git(laptop, ["rev-parse", "main"]).out, originMain = () => git(origin, ["rev-parse", "main"]).out;
  const pull = () => git(laptop, ["pull", "-q", "--ff-only"]);
  return { dir, origin, laptop, seat, other, land, night, calls, cards, branch, moveOrigin, main, originMain, pull };
}
const okLand = (s, unit, files, args = [], x) => { const T = s.branch(unit, files); const r = s.land([unit, ...args], x); return { T, r, ok: r.code === 0 && /^LANDED /.test(r.last) && s.main() === T && s.originMain() === T }; };

const CLAUSES = {
  V1(tree) {
    const s = sandbox(tree); const m0 = s.main(); const T = s.branch("x", { "notes/x.txt": "x1\n" });
    const r = s.land(["x"], { MLAND_V: "RED" });
    const red = /^REFUSED VERDICT-RED/.test(r.last) && s.main() === m0 && s.originMain() === m0;
    const g = sandbox(tree); const G = okLand(g, "x", { "notes/x.txt": "x1\n" });
    const asked = g.calls().filter((a) => /ci_verdict\.mjs$/.test(a[0])).map((a) => a[1]);
    return { ok: red && G.ok && asked.length >= 1 && asked.every((x) => x === G.T), why: `red ${red} · green ${G.ok} · verdict asked for T ${asked.every((x) => x === G.T)} (${G.r.last.slice(0, 80)})` };
  },
  V2(tree) {
    const s = sandbox(tree); s.branch("x", { "notes/x.txt": "x1\n" }); s.moveOrigin("README.md", "moved\n"); s.pull(); const m0 = s.main();
    const r = s.land(["x"]);
    const red = /^REFUSED MAIN-MOVED/.test(r.last) && s.main() === m0;
    return { ok: red && okLand(sandbox(tree), "x", { "notes/x.txt": "x1\n" }).ok, why: `red ${red} (${r.last.slice(0, 60)})` };
  },
  V3(tree) {
    const s = sandbox(tree); s.branch("x", { "notes/x.txt": "x1\n" });
    put(s.laptop, `${STATE}/a.json`, "{\"a\":\"own\"}\n"); git(s.laptop, ["commit", "-q", "-am", "groundsman: unattended state push (laptop) — x"]); const m0 = s.main();
    const r = s.land(["x"]);
    const red = /^REFUSED LOCAL-AHEAD/.test(r.last) && s.main() === m0;
    return { ok: red && okLand(sandbox(tree), "x", { "notes/x.txt": "x1\n" }).ok, why: `red ${red} (${r.last.slice(0, 60)})` };
  },
  V4(tree) {
    const s = sandbox(tree); s.branch("x", { "README.md": "landed\n" }); const m0 = s.main();
    put(s.laptop, "README.md", "HIS DIRTY BYTES\n");
    const r = s.land(["x"]);
    const red = r.code === 3 && /^STOP DIRTY-PATH · x \w+ — README\.md/.test(r.last) && s.main() === m0 && read(s.laptop, "README.md") === "HIS DIRTY BYTES\n";
    const g = sandbox(tree); put(g.laptop, "notes/x.txt", "HIS OTHER DIRTY\n"); const G = okLand(g, "x", { "README.md": "landed\n" });
    const green = G.ok && read(g.laptop, "notes/x.txt") === "HIS OTHER DIRTY\n" && read(g.laptop, "README.md") === "landed\n";
    return { ok: red && green, why: `red ${red} · green ${green} (${r.last.slice(0, 60)})` };
  },
  V5(tree) {
    const s = sandbox(tree); const T = s.branch("x", { "notes/x.txt": "x1\n" }); const o0 = s.originMain();
    git(s.laptop, ["remote", "set-url", "--push", "origin", join(s.dir, "no-such-remote.git")]);   // origin refuses every push
    const r = s.land(["x"]);
    const body = src(tree, "scripts/land.mjs") || "";
    const red = r.code === 4 && /^PUSHED NO PUSH-REJECTED/.test(r.last) && s.main() === T && s.originMain() === o0
      && s.cards().filter((k) => k === "land:x:push").length === 1 && !/\["push"[^\]]*(--force|"-f"|--force-with-lease)/.test(body);
    git(s.laptop, ["remote", "set-url", "--push", "origin", s.origin]);
    const retry = s.land(["push", "x"]);
    const green = retry.code === 0 && s.originMain() === T && okLand(sandbox(tree), "x", { "notes/x.txt": "x1\n" }).ok;
    return { ok: red && green, why: `refused-push holds main at T ${red} · retry + accept ${green} (${r.last.slice(0, 60)})` };
  },
  V6(tree) {
    const s = sandbox(tree); s.branch("x", { "notes/x.txt": "x1\n" }); const m0 = s.main();
    const r = s.land(["x"], { MLAND_S: "OPEN" });
    const red = /^REFUSED SITTING-OPEN/.test(r.last) && s.main() === m0;
    return { ok: red && okLand(sandbox(tree), "x", { "notes/x.txt": "x1\n" }).ok, why: `red ${red}` };
  },
  V7(tree) {
    const s = sandbox(tree); s.branch("x", { [`${STATE}/a.json`]: "{\"a\":\"seat\"}\n" }); const r1 = s.land(["x"]);
    const t = sandbox(tree); t.branch("y", { ".claude/settings.json": "{}\n" }); const r2 = t.land(["y"]);
    const red = /^REFUSED STATE-PATH/.test(r1.last) && /^REFUSED SETTINGS-PATH/.test(r2.last) && s.originMain() !== git(s.seat, ["rev-parse", "HEAD"]).out;
    return { ok: red && okLand(sandbox(tree), "x", { "notes/x.txt": "x1\n" }).ok, why: `red ${red} (${r1.last.slice(0, 40)} | ${r2.last.slice(0, 40)})` };
  },
  V8(tree) {
    const s = sandbox(tree); const A = okLand(s, "x", { "package-lock.json": "{\"v\":2}\n", "scripts/sitlib.mjs": "export const s = 2;\n" });
    const a = A.ok && /npm ci/.test(A.r.last) && /stale units Sitting\b/.test(A.r.last) && /keepers retire themselves: Brain/.test(A.r.last);
    const B = okLand(sandbox(tree), "x", { "README.md": "only\n" });
    const b = B.ok && /acts none/.test(B.r.last) && /stale units none/.test(B.r.last);
    return { ok: a && b, why: `lock+closure ${a} (${A.r.last.slice(0, 120)}) · neither ${b}` };
  },
  CR1(tree) {
    const s = sandbox(tree); const W = join(s.dir, "w.mjs"); writeFileSync(W, "// READS: scripts/sitlib.mjs\nconsole.log('GREEN');\n");
    const H0 = s.main(); put(s.laptop, "scripts/sitlib.mjs", "export const s = 9;\n"); git(s.laptop, ["commit", "-q", "-am", "touch"]); const H1 = s.main();
    const t = sandbox(tree); const W2 = join(t.dir, "w.mjs"); writeFileSync(W2, "// READS: scripts/sitlib.mjs\nconsole.log('GREEN');\n");
    const K0 = t.main(); put(t.laptop, "README.md", "other\n"); git(t.laptop, ["commit", "-q", "-am", "other"]); const K1 = t.main();
    const red = s.land(["carry", W, H0, H1, "--green-at", H0]), green = t.land(["carry", W2, K0, K1, "--green-at", K0]);
    return { ok: red.code === 1 && /^NO-CARRY/.test(red.last) && green.code === 0 && /^CARRIES/.test(green.last), why: `${red.last.slice(0, 50)} | ${green.last.slice(0, 50)}` };
  },
  CR2(tree) {
    const s = sandbox(tree); const W = join(s.dir, "w.mjs"); writeFileSync(W, "// a witness with no declared list\nconsole.log('GREEN');\n");
    const W2 = join(s.dir, "w2.mjs"); writeFileSync(W2, "// READS: scripts/sitlib.mjs\nconsole.log('GREEN');\n");
    const H0 = s.main(); put(s.laptop, "README.md", "other\n"); git(s.laptop, ["commit", "-q", "-am", "other"]); const H1 = s.main();
    const red = s.land(["carry", W, H0, H1, "--green-at", H0]), green = s.land(["carry", W2, H0, H1, "--green-at", H0]);
    return { ok: red.code === 1 && /no READS line/.test(red.last) && green.code === 0 && /^CARRIES/.test(green.last), why: `${red.last.slice(0, 50)} | ${green.last.slice(0, 50)}` };
  },
  CR3(tree) {
    const s = sandbox(tree); const W = join(s.dir, "w.mjs"); writeFileSync(W, "// READS: scripts/sitlib.mjs\nconsole.log('GREEN');\n");
    const H0 = s.main(); const before = read(s.laptop, "scripts/sitlib.mjs");
    put(s.laptop, "scripts/sitlib.mjs", "export const s = 9;\n"); git(s.laptop, ["commit", "-q", "-am", "touch"]);
    put(s.laptop, "scripts/sitlib.mjs", before); git(s.laptop, ["commit", "-q", "-am", "revert"]); const H1 = s.main();
    const empty = git(s.laptop, ["diff", "--name-only", H0, H1]).out === "";
    const r = s.land(["carry", W, H0, H1, "--green-at", H0]);
    return { ok: empty && r.code === 1 && /^NO-CARRY/.test(r.last), why: `diff empty ${empty} · ${r.last.slice(0, 60)}` };
  },
  CR4(tree) {
    const s = sandbox(tree);
    const W = join(s.laptop, "ci", "w_bad.mjs"); put(s.laptop, "ci/w_bad.mjs", "// READS: scripts/sitlib.mjs\nimport { readFileSync } from \"node:fs\";\nreadFileSync(\"README.md\", \"utf8\");\nconsole.log('GREEN');\n");
    const W2 = join(s.laptop, "ci", "w_ok.mjs"); put(s.laptop, "ci/w_ok.mjs", "// READS: scripts/sitlib.mjs\nimport { readFileSync } from \"node:fs\";\nreadFileSync(\"scripts/sitlib.mjs\", \"utf8\");\nconsole.log('GREEN');\n");
    const red = s.land(["reads-probe", W]), green = s.land(["reads-probe", W2]);
    return { ok: red.code === 1 && /^INVALID LIST .*README\.md/.test(red.last) && green.code === 0 && /^VALID LIST/.test(green.last), why: `${red.last.slice(0, 60)} | ${green.last.slice(0, 50)}` };
  },
  L2(tree) {
    const s = sandbox(tree);
    const a = okLand(s, "a", { "notes/a.txt": "a\n" }), b = okLand(s, "b", { "notes/b.txt": "b\n" });
    const c2 = s.land(["count"]).last;
    s.branch("c", { "README.md": "c\n" }); put(s.laptop, "README.md", "dirty\n"); const st = s.land(["c"]);
    const c0 = s.land(["count"]).last;
    return { ok: a.ok && b.ok && /^unattended 2 of 10\b/.test(c2) && st.code === 3 && /^unattended 0 of 10\b/.test(c0), why: `${c2.slice(0, 22)} → after a STOP ${c0.slice(0, 22)}` };
  },
  L3(tree) {
    const s = sandbox(tree); const m0 = s.main(); s.branch("x", { "notes/x.txt": "x1\n" }, { "notes/x.txt": "x2\n" });
    const r = s.land(["x"]);
    const red = /^REFUSED MULTI-COMMIT/.test(r.last) && s.main() === m0;
    return { ok: red && okLand(sandbox(tree), "x", { "notes/x.txt": "x1\n" }).ok, why: `red ${red} (${r.last.slice(0, 50)})` };
  },
  L4(tree) {
    // planted by git alone (the base has no verb): his main fast-forwarded to a fetched land/x tip, origin still at its parent
    const s = sandbox(tree); const T = s.branch("x", { "notes/x.txt": "landed\n" });
    git(s.laptop, ["fetch", "-q", "origin", "main", "land/x"]); git(s.laptop, ["merge", "-q", "--ff-only", "origin/land/x"]);
    put(s.laptop, `${STATE}/a.json`, "{\"a\":\"night\"}\n");
    s.night();
    const o = s.originMain();
    const a = git(s.origin, ["merge-base", "--is-ancestor", T, o], false).status === 0 && !s.cards().some((k) => /^groundsman:held:/.test(k));
    const t = sandbox(tree); const T2 = t.branch("x", { "notes/x.txt": "landed\n" });
    git(t.laptop, ["fetch", "-q", "origin", "main", "land/x"]); git(t.laptop, ["merge", "-q", "--ff-only", "origin/land/x"]);
    const o0 = t.moveOrigin("README.md", "moved past\n");
    const out = t.night();
    const b = /LANDING-BEHIND/.test(out) && git(t.laptop, ["rev-parse", "main"]).out === T2 && t.originMain() === o0 && t.cards().filter((k) => /^groundsman:landing:/.test(k)).length === 1;
    return { ok: a && b, why: `night pushes the landing ${a} · origin moved → idle, one card ${b}` };
  },
  Q4(tree) {
    const s = sandbox(tree); const m0 = s.main(); s.branch("x", { "ci/witness/x.mjs": "// READS: scripts/sitlib.mjs\n" });
    const r1 = s.land(["x"]);
    const red1 = /^REFUSED NAMES-GATE-ABSENT/.test(r1.last) && s.main() === m0;
    const LIST = "a names list\n", h = createHash("sha256").update(LIST).digest("hex");
    const t = sandbox(tree); const T = t.branch("x", { "ci/witness/x.mjs": "// READS: scripts/sitlib.mjs\n", "notes/copy.txt": LIST });
    const gf = join(t.dir, "gate.json"); writeFileSync(gf, JSON.stringify({ sha: T, result: "PASS", paths: ["ci/witness/x.mjs"], list_sha256: h }));
    const r2 = t.land(["x", "--names-gate", gf]);
    const red2 = /^REFUSED NAMES-LIST-PATH/.test(r2.last);
    const g = sandbox(tree); const G = g.branch("x", { "ci/witness/x.mjs": "// READS: scripts/sitlib.mjs\n" });
    const gf2 = join(g.dir, "gate.json"); writeFileSync(gf2, JSON.stringify({ sha: G, result: "PASS", paths: ["ci/witness/x.mjs"], list_sha256: h }));
    const r3 = g.land(["x", "--names-gate", gf2]);
    const green = r3.code === 0 && g.originMain() === G;
    return { ok: red1 && red2 && green, why: `absent ${red1} · list blob ${red2} · gate PASS lands ${green}` };
  },
  S8(tree) {
    const s = sandbox(tree); s.branch("x", { "notes/x.txt": "x1\n" }); const m0 = s.main();
    const WR = join(s.dir, "live_red.mjs"); writeFileSync(WR, "console.log('RED LIVE · planted');\nprocess.exitCode = 1;\n");
    const r = s.land(["x", "--live", WR]);
    const red = r.code === 3 && /^STOP LIVE-RED/.test(r.last) && s.main() === m0;
    const g = sandbox(tree); const WG = join(g.dir, "live_green.mjs");
    writeFileSync(WG, "import { readFileSync } from 'node:fs'; import { join } from 'node:path';\nconst org = process.argv[process.argv.indexOf('--org') + 1];\nconsole.log(readFileSync(join(org, 'notes', 'x.txt'), 'utf8').trim() === 'x1' ? 'GREEN LIVE · at T' : 'RED LIVE · not T');\n");
    const G = okLand(g, "x", { "notes/x.txt": "x1\n" }, ["--live", WG]);
    const body = src(tree, "scripts/land.mjs") || "";
    return { ok: red && G.ok && body.length > 0 && !/["']worktree["']/.test(body), why: `red ${red} · green at T's bytes ${G.ok}` };
  },
};

function files(dir) {
  const out = new Map();
  const walk = (d) => { for (const n of readdirSync(d)) { if (n === ".git" || n === "node_modules") continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else out.set(relative(dir, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p)).digest("hex")); } };
  walk(dir); return out;
}
function bound() {
  const a = files(BASE), b = files(ORG), diff = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) if (a.get(k) !== b.get(k)) diff.push(k);
  const off = diff.filter((p) => !NAMED.includes(p) && !NAMED_DIRS.some((d) => p.startsWith(d)));
  return { ok: off.length === 0 && diff.includes("scripts/land.mjs"), why: off.length ? `off-bound: ${off.slice(0, 5).join(", ")}` : `${diff.length} differing path(s), all named` };
}
function survivors() {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.includes(ROOT) && !l.includes("witness_mland")).length;
  }
  let n = 0;
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(ROOT)) n++; } catch {}
  }
  return n;
}

const only = arg("--only");
const red = [];
try {
  for (const [name, fn] of Object.entries(CLAUSES)) {
    if (only && !only.split(",").includes(name)) continue;
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
const total = (only ? only.split(",").length : Object.keys(CLAUSES).length) + 2;
console.log(red.length ? `RED MLAND · ${red.join(", ")}` : `GREEN MLAND landing verb · ${total} clause(s)`);
process.exit(red.length ? 1 : 0);
