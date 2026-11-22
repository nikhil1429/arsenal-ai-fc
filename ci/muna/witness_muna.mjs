#!/usr/bin/env node
// ============================================================================
// ci/muna/witness_muna.mjs — WITNESS of unit muna (LANDING WITH NO SESSION AWAKE, scripts/muna.mjs)
// ----------------------------------------------------------------------------
// CONTRACT (ruling row 1301 over spec ci/muna/MUNA_SPEC.md §7, on branch claude/muna-spec 639ffbc):
//   node ci/muna/witness_muna.mjs --org <build tree> --base-org <base tree> [--only U1,U2…]
// Real git on copies under os.tmpdir(): a bare origin, a "laptop" clone (HIS tree, main checked out) that runs
// `node scripts/muna.mjs pass`, a "seat" clone that pushes land/<unit>, an "other" clone that moves origin. The tree
// under judgement gives scripts/muna.mjs and scripts/land.mjs (the verb, unchanged). Every other organ is a PLANTED
// stub: ci_verdict answers from MUNA_V_FILE (sha → verdict, the reader's ENV DOOR), sitting answers MUNA_S, archivist's
// tripwire refuses an oura credential path, keeper answers judgeHeld=false, captains_call records its argv. Lane M's
// sha gate and landing wrapper are PLANTED outside the laptop tree and named by the planted door file
// .git/muna_door.json; the units ledger is a planted JSONL under the temp dir. The L2 licence is planted as ten LANDED
// rows in the laptop's .git/land_ledger.jsonl. No network (origin is a path), no model call, no port, no live state;
// every wait is a child's own exit.
//   U1  an adopted tip on origin main with GREEN legs → muna LANDED, his main == origin main == T, through the door's command
//   U2  a green land tip with NO adoption → muna IDLE, nothing moves, no verdict asked, no landing command run
//   U2b adopted at another sha (the tip re-pushed after adoption) → IDLE, not landed (the gate is asked --sha <T>)
//   U3  adopted, a RED leg → WAIT, not landed · a NONE leg → WAIT, not landed; no landing command run
//   U4  adopted, green, a sitting OPEN → the verb runs once and REFUSES SITTING-OPEN, kept, no card; CLOSED next pass → lands
//   U5  adopted, origin moved past T's parent → LEFT RE-CUT named by status, no landing command, origin's land ref unchanged
//   U6  A adopted on main, B adopted stacked on A → pass 1 lands A only (one command), status names STACKED B; pass 2 lands B
//   U7  a dirty file at a path T changes → STOP DIRTY-PATH, exactly ONE card keyed muna:stop:<unit>:<sha12>:DIRTY-PATH;
//       pass 2 STANDS DOWN (the verb's count is 0), no second card, no second command
//   U8  origin refuses the publish → the verb's own card land:<unit>:push is the ONLY card; muna files none
//   U9  the verb's count below its N (a human row after the planted landings) → STAND-DOWN: no gate, no command
//   U10 a unit adopted with the HAND-ONLY mark → the sha gate REFUSES, muna IDLE, not landed (row 1301 (5))
//   U11 the landing command comes from the door: the door's wrapper is called with the unit, row and names file and
//       lands · a door naming a command that refuses → nothing lands (muna never runs a verb of its own)
//   U12 ANTHROPIC_API_KEY set → refused at the door, no gate asked · muna.mjs names no model cli, no forced flag, no
//       publish verb of its own, no listener
//   U13 no names result for the tip → LEFT NO-NAMES-RESULT, not landed · a names directory inside the work tree → NO-DOOR,
//       one card muna:door
//   U14 a landing whose acts list is not empty (package-lock.json) → ONE card muna:acts:<unit>:<sha12> · empty → no card
// Each clause runs on --base-org (must be RED) and on --org (must be GREEN). BOUND: only scripts/muna.mjs, ci/muna/ and
// the two setup installer files differ. LAST: no node process naming the temp dir survives.
// LAST LINE: GREEN MUNA landing with no session awake · <n> clause(s)  (exit 0)  ·  RED MUNA · <clauses>  (exit 1)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync, appendFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import os from "node:os";

let ROOT = null;
const tmpRoot = () => (ROOT ||= mkdtempSync(join(os.tmpdir(), "witness-muna-")));
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

const REC = (who) => `import { appendFileSync } from "node:fs";\nappendFileSync(process.env.MUNA_LOG, JSON.stringify({ who: ${JSON.stringify(who)}, argv: process.argv.slice(2) }) + "\\n");\n`;
const VERDICT = REC("verdict") + `import { readFileSync } from "node:fs";\nlet m = {}; try { m = JSON.parse(readFileSync(process.env.MUNA_V_FILE, "utf8")); } catch {}\nconst sha = String(process.argv[2]);\nconst v = m[sha] || "GREEN";\nconsole.log("ci_verdict " + sha.slice(0, 7) + " " + v + " — planted [run 111] [run 222]");\nprocess.exitCode = v === "GREEN" ? 0 : 1;\n`;
const SITTING = `const s = process.env.MUNA_S || "CLOSED";\nconsole.log(s === "OPEN" ? "sitting: OPEN study 'x' · s1" : "sitting: file says no open sitting");\n`;
const ARCHIVIST = `import { spawnSync } from "node:child_process";\nconst r = spawnSync("git", ["diff", "--cached", "--name-only"], { encoding: "utf8" });\nconst bad = String(r.stdout || "").split(/\\r?\\n/).filter((p) => /oura_(secrets|tokens)\\.json$/.test(p));\nconsole.log(bad.length ? "tripwire: COMMIT REFUSED " + bad[0] : "tripwire: nothing that may not be published.");\nprocess.exitCode = bad.length ? 1 : 0;\n`;
const KEEPER = "export const JUDGE_PORT = 0;\nexport const judgeHeld = async () => false;\n";
// lane M's SHA GATE, planted (row 1301 (1)): GO only when the unit's LAST adopted event names that exact sha, no landed
// event carries it, not withdrawn, not hand-only. Asked with no --sha it answers by UNIT ONLY (today's gate, measured).
const GATE = REC("gate") + `import { readFileSync } from "node:fs";\nconst [file, unit, flag, sha] = process.argv.slice(2);\nconst rows = readFileSync(file, "utf8").split(/\\r?\\n/).filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.unit === unit);\nconst ad = rows.filter((r) => r.event === "adopted"); const last = ad[ad.length - 1];\nconst why = !last ? "never adopted" : flag === "--sha" && last.sha !== sha ? "adopted at another sha" : last.hand_only ? "hand-only" : rows.some((r) => r.event === "landed" && r.sha === last.sha) ? "already landed" : rows.slice(rows.lastIndexOf(last)).some((r) => r.event === "withdrawn") ? "withdrawn" : null;\nif (why) { console.log("REFUSED " + unit + " · " + why); process.exit(1); }\nconsole.log("GO " + unit + " " + String(last.sha).slice(0, 7) + " row " + last.row);\n`;
// lane M's LANDING WRAPPER, planted: <unit> --row <n> -- <verb args…>; records, then runs the BARE VERB in its cwd
const WRAP = REC("wrap") + `import { spawnSync } from "node:child_process";\nimport { join } from "node:path";\nconst a = process.argv.slice(2); const unit = a[0]; const rest = a.slice(a.indexOf("--") + 1);\nconst r = spawnSync(process.execPath, [join(process.cwd(), "scripts", "land.mjs"), unit, ...rest], { cwd: process.cwd(), encoding: "utf8" });\nprocess.stdout.write(String(r.stdout || "") + String(r.stderr || ""));\nprocess.exitCode = r.status;\n`;
const NOLAND = REC("noland") + `console.log("REFUSED DOOR-PLANT · this door's command lands nothing");\nprocess.exitCode = 1;\n`;

export function sandbox(tree) {
  const dir = join(tmpRoot(), `s${++seq}`);
  const origin = join(dir, "origin.git"), seed = join(dir, "seed"), laptop = join(dir, "laptop"), seat = join(dir, "seat"), other = join(dir, "other");
  const units = join(dir, "units.jsonl"), names = join(dir, "names"), log = join(dir, "calls.log"), vfile = join(dir, "verdicts.json");
  mkdirSync(seed, { recursive: true }); mkdirSync(names, { recursive: true }); writeFileSync(units, ""); writeFileSync(vfile, "{}");
  git(dir, ["-c", "core.autocrlf=false", "init", "-q", "--bare", "-b", "main", origin]);
  git(seed, ["-c", "core.autocrlf=false", "init", "-q", "-b", "main"]); cfg(seed);
  for (const f of ["scripts/muna.mjs", "scripts/land.mjs"]) { const t = src(tree, f); if (t != null) put(seed, f, t); }
  put(seed, "scripts/ci_verdict.mjs", VERDICT); put(seed, "scripts/sitting.mjs", SITTING); put(seed, "scripts/archivist.mjs", ARCHIVIST);
  put(seed, "scripts/keeper.mjs", KEEPER); put(seed, "scripts/captains_call.mjs", REC("card"));
  put(seed, "README.md", "seed\n"); put(seed, "notes/x.txt", "x0\n"); put(seed, "package-lock.json", "{}\n");
  git(seed, ["add", "-A"]); git(seed, ["commit", "-q", "-m", "seed"]);
  git(seed, ["remote", "add", "origin", origin]); git(seed, ["push", "-q", "origin", "main"]);
  for (const c of [laptop, seat, other]) { git(dir, ["clone", "-q", "-c", "core.autocrlf=false", origin, c]); cfg(c); }
  for (const [n, t] of [["gate.mjs", GATE], ["wrap.mjs", WRAP], ["noland.mjs", NOLAND]]) writeFileSync(join(dir, n), t);
  const gitDir = join(laptop, ".git");
  const door = (x = {}) => writeFileSync(join(gitDir, "muna_door.json"), JSON.stringify({ gate: [process.execPath, join(dir, "gate.mjs"), units], gate_cwd: dir, land: [process.execPath, join(dir, "wrap.mjs"), "{unit}", "--row", "{row}", "--", "--names-gate", "{names}"], land_cwd: laptop, names_dir: names, ...x }));
  door();
  const t0 = Date.now() - 3600e3;
  writeFileSync(join(gitDir, "land_ledger.jsonl"), Array.from({ length: 10 }, (_, i) => JSON.stringify({ ts: new Date(t0 + i).toISOString(), unit: `p${i}`, sha: "0".repeat(40), outcome: "LANDED", name: "LANDED", human: false })).join("\n") + "\n");
  const env = (x = {}) => { const e = { ...process.env, MUNA_LOG: log, MUNA_V_FILE: vfile, MUNA_S: "CLOSED", ...x }; delete e.ANTHROPIC_API_KEY; if (x.ANTHROPIC_API_KEY) e.ANTHROPIC_API_KEY = x.ANTHROPIC_API_KEY; return e; };
  const run = (mode, x) => { const r = spawnSync(process.execPath, [join(laptop, "scripts", "muna.mjs"), mode], { cwd: laptop, encoding: "utf8", windowsHide: true, env: env(x) }); const o = ((r.stdout || "") + (r.stderr || "")).trim(); return { code: r.status, out: o, last: o.split(/\r?\n/).pop() || "" }; };
  const muna = (x) => run("pass", x), status = (x) => run("status", x);
  const count = () => { const r = spawnSync(process.execPath, [join(laptop, "scripts", "land.mjs"), "count"], { cwd: laptop, encoding: "utf8", env: env() }); return String(r.stdout || "").trim(); };
  const calls = () => (read(dir, "calls.log") || "").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
  const of = (who) => calls().filter((c) => c.who === who).map((c) => c.argv);
  const cards = () => of("card").filter((a) => a[0] === "file").map((a) => a[a.indexOf("--key") + 1]);
  const branch = (unit, files, from = "origin/main") => {
    git(seat, ["fetch", "-q", "origin"]); git(seat, ["checkout", "-q", "-B", `land/${unit}`, from]);
    for (const [p, t] of Object.entries(files)) put(seat, p, t);
    git(seat, ["add", "-A"]); git(seat, ["commit", "-q", "-m", `unit ${unit}`]);
    git(seat, ["push", "-q", "-f", "origin", `land/${unit}`]);                 // the SEAT's own branch, never main
    return git(seat, ["rev-parse", "HEAD"]).out;
  };
  const adopt = (unit, sha, x = {}) => appendFileSync(units, JSON.stringify({ unit, event: "adopted", sha, row: 9000 + seq, ...x }) + "\n");
  const namesFor = (unit, sha) => writeFileSync(join(names, `${unit}_${sha}.json`), JSON.stringify({ sha, result: "PASS", paths: [], list_sha256: "0".repeat(64) }));
  const ready = (unit, files, from) => { const T = branch(unit, files, from); adopt(unit, T); namesFor(unit, T); return T; };
  const verdicts = (m) => writeFileSync(vfile, JSON.stringify(m));
  const moveOrigin = (rel, text) => { git(other, ["pull", "-q", "--ff-only"]); put(other, rel, text); git(other, ["add", "-A"]); git(other, ["commit", "-q", "-m", "origin moved"]); git(other, ["push", "-q", "origin", "main"]); return git(other, ["rev-parse", "HEAD"]).out; };
  const main = () => git(laptop, ["rev-parse", "main"]).out, originMain = () => git(origin, ["rev-parse", "main"]).out;
  const landRef = (u) => git(origin, ["rev-parse", `refs/heads/land/${u}`]).out;
  return { dir, laptop, gitDir, names, units, muna, status, count, calls, of, cards, branch, adopt, namesFor, ready, verdicts, moveOrigin, main, originMain, landRef, door, pull: () => git(laptop, ["pull", "-q", "--ff-only"]) };
}
const landed = (s, T, r) => r.code === 0 && /^muna LANDED /.test(r.last) && s.main() === T && s.originMain() === T;

export const CLAUSES = {
  U1(tree) {
    const s = sandbox(tree); const T = s.ready("x", { "notes/x.txt": "x1\n" });
    const r = s.muna(); const w = s.of("wrap");
    const ok = landed(s, T, r) && w.length === 1 && w[0][0] === "x";
    return { ok, why: `landed ${landed(s, T, r)} · door command calls ${w.length} (${r.last.slice(0, 90)})` };
  },
  U2(tree) {
    const s = sandbox(tree); const m0 = s.main(); s.branch("x", { "notes/x.txt": "x1\n" });
    const r = s.muna();
    const ok = r.code === 0 && /^muna IDLE /.test(r.last) && s.main() === m0 && s.originMain() === m0 && s.of("verdict").length === 0 && s.of("wrap").length === 0 && s.of("gate").length === 1;
    return { ok, why: `${r.last.slice(0, 90)} · verdicts ${s.of("verdict").length} · commands ${s.of("wrap").length}` };
  },
  U2b(tree) {
    const s = sandbox(tree); const m0 = s.main(); const T0 = s.ready("x", { "notes/x.txt": "x1\n" });
    const T1 = s.branch("x", { "notes/x.txt": "x2\n" }); s.namesFor("x", T1);   // re-pushed after adoption: adopted names T0
    const r = s.muna(); const g = s.of("gate");
    const ok = T0 !== T1 && r.code === 0 && /^muna IDLE /.test(r.last) && s.main() === m0 && s.of("wrap").length === 0 && g.length === 1 && g[0].includes("--sha") && g[0][g[0].indexOf("--sha") + 1] === T1;
    return { ok, why: `${r.last.slice(0, 90)} · gate asked ${JSON.stringify(g.map((a) => a.slice(1)))}` };
  },
  U3(tree) {
    const out = [];
    for (const v of ["RED", "NONE"]) {
      const s = sandbox(tree); const m0 = s.main(); const T = s.ready("x", { "notes/x.txt": "x1\n" }); s.verdicts({ [T]: v });
      const r = s.muna();
      out.push(r.code === 0 && new RegExp(`^muna WAIT · x \\w+ verdict ${v}`).test(r.last) && s.main() === m0 && s.of("wrap").length === 0 ? "ok" : `${v}: ${r.last.slice(0, 80)}`);
    }
    return { ok: out.every((x) => x === "ok"), why: out.join(" · ") };
  },
  U4(tree) {
    const s = sandbox(tree); const m0 = s.main(); const T = s.ready("x", { "notes/x.txt": "x1\n" });
    const r1 = s.muna({ MUNA_S: "OPEN" });
    const kept = r1.code === 0 && /^muna WAIT · REFUSED SITTING-OPEN · x/.test(r1.last) && s.main() === m0 && s.of("wrap").length === 1 && s.cards().length === 0;
    const r2 = s.muna();
    return { ok: kept && landed(s, T, r2), why: `kept ${kept} (${r1.last.slice(0, 70)}) · then ${r2.last.slice(0, 50)}` };
  },
  U5(tree) {
    const s = sandbox(tree); const T = s.ready("x", { "notes/x.txt": "x1\n" }); const o1 = s.moveOrigin("README.md", "moved\n"); s.pull();
    const r = s.muna(); const st = s.status();
    const ok = r.code === 0 && /^muna LEFT .*RE-CUT x/.test(r.last) && /RE-CUT x/.test(st.last) && s.of("wrap").length === 0 && s.main() === o1 && s.landRef("x") === T;
    return { ok, why: `${r.last.slice(0, 90)} · status ${st.last.slice(0, 60)}` };
  },
  U6(tree) {
    const s = sandbox(tree); const A = s.ready("a", { "notes/a.txt": "a\n" }); const B = s.ready("b", { "notes/b.txt": "b\n" }, "land/a");
    const r1 = s.muna(); const st = s.status(); const one = s.of("wrap").length === 1 && landed(s, A, r1) && /STACKED b/.test(st.last);
    s.pull(); const r2 = s.muna(); const two = s.of("wrap").length === 2 && landed(s, B, r2);
    return { ok: one && two, why: `pass 1 ${one} (${st.last.slice(0, 60)}) · pass 2 ${two} (${r2.last.slice(0, 60)})` };
  },
  U7(tree) {
    const s = sandbox(tree); const m0 = s.main(); const T = s.ready("x", { "README.md": "landed\n" }); put(s.laptop, "README.md", "HIS DIRTY BYTES\n");
    const r1 = s.muna(); const r2 = s.muna(); const k = s.cards();
    const ok = /^muna STOP · STOP DIRTY-PATH · x/.test(r1.last) && /^muna STAND-DOWN /.test(r2.last) && k.length === 1 && k[0] === `muna:stop:x:${T.slice(0, 12)}:DIRTY-PATH`
      && s.of("wrap").length === 1 && s.main() === m0 && read(s.laptop, "README.md") === "HIS DIRTY BYTES\n" && /^unattended 0 of /.test(s.count());
    return { ok, why: `${r1.last.slice(0, 60)} · ${r2.last.slice(0, 40)} · cards ${JSON.stringify(k)}` };
  },
  U8(tree) {
    const s = sandbox(tree); s.ready("x", { "notes/x.txt": "x1\n" });
    git(s.laptop, ["remote", "set-url", "--push", "origin", join(s.dir, "no-such-remote.git")]);
    const r = s.muna(); const k = s.cards();
    const ok = r.code === 0 && /^muna STOP · PUSHED NO PUSH-REJECTED · x/.test(r.last) && k.length === 1 && k[0] === "land:x:push";
    return { ok, why: `${r.last.slice(0, 70)} · cards ${JSON.stringify(k)}` };
  },
  U9(tree) {
    const s = sandbox(tree); const m0 = s.main(); s.ready("x", { "notes/x.txt": "x1\n" });
    appendFileSync(join(s.gitDir, "land_ledger.jsonl"), JSON.stringify({ ts: new Date().toISOString(), unit: "q", sha: null, outcome: "STOP", name: "DIRTY-PATH", human: true }) + "\n");
    const r = s.muna();
    const ok = r.code === 0 && /^muna STAND-DOWN /.test(r.last) && s.of("gate").length === 0 && s.of("wrap").length === 0 && s.main() === m0;
    return { ok, why: r.last.slice(0, 90) };
  },
  U10(tree) {
    const s = sandbox(tree); const m0 = s.main(); const T = s.branch("x", { "notes/x.txt": "x1\n" }); s.adopt("x", T, { hand_only: true }); s.namesFor("x", T);
    const r = s.muna();
    const ok = r.code === 0 && /^muna IDLE /.test(r.last) && s.main() === m0 && s.of("wrap").length === 0 && s.of("gate").length === 1;
    return { ok, why: r.last.slice(0, 90) };
  },
  U11(tree) {
    const s = sandbox(tree); const T = s.ready("x", { "notes/x.txt": "x1\n" });
    const r = s.muna(); const w = s.of("wrap");
    const viaDoor = landed(s, T, r) && w.length === 1 && w[0][0] === "x" && w[0][1] === "--row" && /^\d+$/.test(w[0][2]) && w[0].includes(join(s.names, `x_${T}.json`));
    const n = sandbox(tree); const m0 = n.main(); n.ready("x", { "notes/x.txt": "x1\n" }); n.door({ land: [process.execPath, join(n.dir, "noland.mjs"), "{unit}"] });
    const r2 = n.muna();
    const refused = r2.code === 0 && /DOOR-PLANT/.test(r2.last) && n.of("noland").length === 1 && n.main() === m0 && n.originMain() === m0;
    return { ok: viaDoor && refused, why: `via door ${viaDoor} · a refusing door lands nothing ${refused} (${r2.last.slice(0, 60)})` };
  },
  U12(tree) {
    const s = sandbox(tree); s.ready("x", { "notes/x.txt": "x1\n" });
    const r = s.muna({ ANTHROPIC_API_KEY: "planted-not-a-key" });
    const refused = r.code === 1 && /^muna REFUSED · ANTHROPIC_API_KEY/.test(r.last) && s.of("gate").length === 0;
    const body = src(tree, "scripts/muna.mjs");
    const clean = body != null && !/\bclaude\b/i.test(body) && !/["'`]--force["'`]/.test(body) && !/["'`]push["'`]/.test(body) && !/\.listen\(|createServer/.test(body);
    return { ok: refused && clean, why: `refused ${refused} · source clean ${clean}` };
  },
  U13(tree) {
    const s = sandbox(tree); const m0 = s.main(); const T = s.branch("x", { "notes/x.txt": "x1\n" }); s.adopt("x", T);
    const r = s.muna();
    const left = r.code === 0 && /^muna LEFT · no names result x_/.test(r.last) && s.main() === m0 && s.of("wrap").length === 0;
    const n = sandbox(tree); n.ready("x", { "notes/x.txt": "x1\n" }); n.door({ names_dir: join(n.laptop, ".git", "names") });
    const r2 = n.muna();
    const inside = r2.code === 0 && /^muna NO-DOOR · the names directory is inside the work tree/.test(r2.last) && JSON.stringify(n.cards()) === JSON.stringify(["muna:door"]) && n.of("wrap").length === 0;
    return { ok: left && inside, why: `left ${left} (${r.last.slice(0, 50)}) · inside ${inside} (${r2.last.slice(0, 50)})` };
  },
  U14(tree) {
    const s = sandbox(tree); const T = s.ready("x", { "package-lock.json": "{\"v\":1}\n" });
    const r = s.muna(); const k = s.cards();
    const one = landed(s, T, r) && k.length === 1 && k[0] === `muna:acts:x:${T.slice(0, 12)}`;
    const n = sandbox(tree); const T2 = n.ready("y", { "notes/y.txt": "y\n" }); const r2 = n.muna();
    const none = landed(n, T2, r2) && n.cards().length === 0;
    return { ok: one && none, why: `acts card ${one} (${JSON.stringify(k)}) · none when empty ${none}` };
  },
};

function files(dir) {
  const out = new Map();
  const walk = (d) => { for (const n of readdirSync(d)) { if (n === ".git" || n === "node_modules") continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else out.set(relative(dir, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p)).digest("hex")); } };
  walk(dir); return out;
}
const NAMED = ["scripts/muna.mjs", "setup/INSTALL_CYBORG_TASKS.ps1", "setup/UNINSTALL_CYBORG_TASKS.ps1"], NAMED_DIRS = ["ci/muna/"];
function bound(BASE, ORG) {
  const a = files(BASE), b = files(ORG), diff = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) if (a.get(k) !== b.get(k)) diff.push(k);
  const off = diff.filter((p) => !NAMED.includes(p) && !NAMED_DIRS.some((d) => p.startsWith(d)));
  return { ok: off.length === 0 && diff.includes("scripts/muna.mjs"), why: off.length ? `off-bound: ${off.slice(0, 5).join(", ")}` : `${diff.length} differing path(s), all named` };
}
export function survivors(root = ROOT) {
  if (!root) return 0;
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.includes(root) && !l.includes("witness_muna")).length;
  }
  let n = 0;
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(root)) n++; } catch {}
  }
  return n;
}
export function cleanup() { if (ROOT) { try { rmSync(ROOT, { recursive: true, force: true }); } catch {} ROOT = null; } }

function mainCli() {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
  const ORG = arg("--org"), BASE = arg("--base-org");
  if (!ORG || !BASE) { console.log("RED MUNA · usage: --org <dir> --base-org <dir>"); return 1; }
  const only = arg("--only");
  const red = [];
  let n = 0;
  try {
    for (const [name, fn] of Object.entries(CLAUSES)) {
      if (only && !only.split(",").includes(name)) continue;
      n++;
      let onBase, onBuild;
      try { onBase = fn(BASE); } catch (e) { onBase = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; }
      try { onBuild = fn(ORG); } catch (e) { onBuild = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; }
      const pass = !onBase.ok && onBuild.ok;
      console.log(`  ${pass ? "✓" : "✗"} ${name} · base ${onBase.ok ? "GREEN (does not discriminate)" : "RED"} · build ${onBuild.ok ? "GREEN" : "RED"} — ${onBuild.why}`);
      if (!pass) red.push(name);
    }
    const b = bound(BASE, ORG);
    console.log(`  ${b.ok ? "✓" : "✗"} BOUND · ${b.why}`);
    if (!b.ok) red.push("BOUND");
  } finally {
    const live = survivors();
    console.log(`  ${live === 0 ? "✓" : "✗"} LAST · ${live} node process(es) naming the temp dir survive`);
    if (live) red.push("LAST");
    cleanup();
  }
  console.log(red.length ? `RED MUNA · ${red.join(", ")}` : `GREEN MUNA landing with no session awake · ${n + 2} clause(s)`);
  return red.length ? 1 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(mainCli());
