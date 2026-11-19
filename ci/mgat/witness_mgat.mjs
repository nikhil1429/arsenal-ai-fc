#!/usr/bin/env node
// ============================================================================
// ci/mgat/witness_mgat.mjs · unit mgat (forks row 1145) · THE WITNESS. HEADER = CONTRACT.
//   usage: node ci/mgat/witness_mgat.mjs --org <dir> --base-org <dir> [--only W1,W3]
//     --org       the BUILD checkout (claude/mgat-build, or a mutant tree run_mutants_mgat.mjs plants)
//     --base-org  the BASE checkout: a git work tree whose HEAD is the cut (ci/mgat/BASE)
//     --org-only  (run_mutants_mgat.mjs only) judge each clause on --org alone; the last line then reads the org side
//   SOLE WRITER of: NOTHING outside os.tmpdir(). It never writes either checkout, never reads or copies a file
//   of dressing-room/state from either (every state it needs is PLANTED by this script under the temp dir), never
//   copies an untracked file (a gitignored credential stays where it is: only `git ls-files` paths are copied).
//
// THE CLAUSES (ci/mgat/MGAT_SPEC.md §4 at 370c5e6; where the ruling row 1145 differs, the ruling wins, named in PROOF.md).
// Each clause runs on a COPY of --base-org (it must read RED) and on a COPY of --org (it must read GREEN).
//   Plants: Z = state folder absent · E = present, empty · X = E plus registry.json holding a value no schema accepts.
//   W1  `gates.mjs report` on E: no-empty AT OR UNDER the tree's own frozen LINT_BASELINE["no-empty"], read from its
//       scripts/gates.mjs, never typed (ruling: "no-empty must read at or under its frozen baseline").
//   W2  per touched file, no more no-empty sites than at the PARENT of the rise that added them (the parents' bytes are
//       read with `git show` from --base-org's object store; an unreachable object is NAMED and the clause is RED).
//   W3  hermetic `organism_test.mjs gates` ENTERS the mode (a GATES assert, no `LIVE MODE gates`) and its reds name no
//       no-empty rise.
//   W4  the hermetic verdict is entered AND identical on Z and on X (state cannot move it).
//   W5  the ajv half still guards: the FULL profile on X fails BY a SCHEMA red on the planted registry.json, and hermetic
//       NAMES `gates schema half` LIVE.
//   W6  cortex: one `function releaseLock()`, called twice; the retire callback line holds no bare catch.
//   W7  ONE planted new empty catch turns the HERMETIC `gates` mode RED, by a no-empty rise (the next rise has a reader).
//   BOUND  only the named files differ between --org and --base-org (tracked files, line endings normalised).
//   LAST   no node process naming this run's temp dir survives.
// THE PORT CLASS (row 1053): no port is bound, no live service is named or POSTed at, nothing is restarted; every
//   child is spawnSync (it returns when the child exits) and no fixed budget is typed. No model is called.
// WINDOWS: no shell; paths by node:path; text split on /\r?\n/; node_modules linked as a junction; every git repo
//   planted is `git init` with core.autocrlf=false.
// LAST LINE: `GREEN MGAT <what> · <n> clause(s)` (exit 0) or `RED MGAT · <clauses>` (exit 1).
// ============================================================================
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, symlinkSync, rmSync, writeFileSync, appendFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path"; import { tmpdir } from "node:os";

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const ORG = opt("--org") && resolve(opt("--org")); const BASE = opt("--base-org") && resolve(opt("--base-org"));
if (!ORG || !BASE) { console.log("usage: node ci/mgat/witness_mgat.mjs --org <dir> --base-org <dir> [--only W1,...]"); console.log("RED MGAT · usage"); process.exit(1); }
const ALL = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];
const WANT = opt("--only") ? opt("--only").split(",") : ALL; const ORG_ONLY = argv.includes("--org-only");
const NAMED = ["scripts/groundsman.mjs", "scripts/cortex.mjs", "scripts/captains_call.mjs", "scripts/organism_test.mjs"];
const NAMED_DIR = "ci/mgat/";
const SD = "dressing-room/state";
// the rise parents (MGAT_SPEC.md §1.2, measured there by sites.mjs): the commit BEFORE each file's new no-empty sites
const RISE_PARENT = { "scripts/groundsman.mjs": "15edfec", "scripts/cortex.mjs": "4d166d3", "scripts/captains_call.mjs": "8c729c8" };
const RUN = mkdtempSync(join(tmpdir(), "mgat-wit-"));

const git = (dir, ...a) => execFileSync("git", ["-C", dir, "-c", "core.autocrlf=false", ...a], { encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "pipe"] });
const tracked = (dir) => git(dir, "ls-files", "-z").split("\0").filter(Boolean);
const modulesOf = (dir) => [join(dir, "node_modules"), join(ORG, "node_modules"), join(BASE, "node_modules")].find((p) => existsSync(p));
let seq = 0;
/** a plant: the tracked files of `src` (working-tree bytes), dressing-room/state never copied, then the state kind planted */
function plant(src, kind, { rise = false } = {}) {
  const d = join(RUN, `${src === ORG ? "org" : "base"}-${kind}-${++seq}`); mkdirSync(d, { recursive: true });
  for (const f of tracked(src)) { if (f === SD || f.startsWith(SD + "/")) continue; const p = join(src, f); if (!existsSync(p)) continue;
    mkdirSync(dirname(join(d, f)), { recursive: true }); writeFileSync(join(d, f), readFileSync(p)); }
  if (kind !== "Z") mkdirSync(join(d, SD), { recursive: true });
  if (kind === "X") writeFileSync(join(d, SD, "registry.json"), "123\n");
  const nm = modulesOf(src); if (nm) symlinkSync(nm, join(d, "node_modules"), "junction");
  if (rise) appendFileSync(join(d, "scripts", "groundsman.mjs"), "\nexport const mgatPlantedRise = () => { try { JSON.parse(\"x\"); } catch { } };\n");
  const g = (...a) => execFileSync("git", ["-C", d, "-c", "core.autocrlf=false", "-c", "user.email=seat@local", "-c", "user.name=seat", ...a], { stdio: "pipe" });
  g("init", "-q"); g("config", "core.autocrlf", "false"); g("add", "-A"); g("commit", "-qm", "plant", "--no-verify");
  return d;
}
const envOf = (profile) => { const e = { ...process.env }; delete e.ORGANISM_TEST_PROFILE; if (profile) e.ORGANISM_TEST_PROFILE = profile; return e; };
const node = (d, args, profile) => { const r = spawnSync(process.execPath, args, { cwd: d, encoding: "utf8", env: envOf(profile), maxBuffer: 1 << 28 }); return { code: r.status, out: (r.stdout || "") + (r.stderr || "") }; };
const lines = (s) => s.split(/\r?\n/);
const asserts = (out) => lines(out).filter((l) => /^  (ok  |FAIL|LIVE) /.test(l)).map((l) => l.trim());
const verdictOf = (out) => { const m = out.match(/^ORGANISM_TEST_VERDICT (.*)$/m); if (!m) return null; const v = JSON.parse(m[1]); return { pass: v.pass, fail: v.fail, reds: v.reds, live: v.live }; };
const once = (src, kind, fn, o) => { const d = plant(src, kind, o); try { return fn(d); } finally { rmSync(d, { recursive: true, force: true }); } };
const eslintCounts = (d, files) => { const r = spawnSync(process.execPath, [join(d, "node_modules", "eslint", "bin", "eslint.js"), ...files, "--format", "json"], { cwd: d, encoding: "utf8", maxBuffer: 1 << 28 });
  const rep = JSON.parse(r.stdout.slice(r.stdout.indexOf("["), r.stdout.lastIndexOf("]") + 1));
  return Object.fromEntries(rep.map((x) => [x.filePath.slice(d.length + 1).split("\\").join("/"), x.messages.filter((m) => m.ruleId === "no-empty").length])); };
const gatesBlock = (out) => { const L = lines(out); const i = L.findIndex((l) => /^  (ok  |FAIL) GATES —/.test(l)); return i < 0 ? "" : L.slice(i, i + 8).join("\n"); };

let parentCount = null;
const CL = {
  W1: (src) => once(src, "E", (d) => { const r = node(d, ["scripts/gates.mjs", "report"]); const ne = (r.out.match(/no-empty (\d+)/) || [])[1];
    const fz = (readFileSync(join(d, "scripts", "gates.mjs"), "utf8").match(/"no-empty": (\d+)/) || [])[1];
    return { ok: ne !== undefined && fz !== undefined && Number(ne) <= Number(fz), line: `gates report exit ${r.code} · no-empty ${ne} · frozen ${fz} (read from scripts/gates.mjs)` }; }),
  W2: (src) => {
    if (!parentCount) { parentCount = {}; once(BASE, "E", (d) => { for (const [f, p] of Object.entries(RISE_PARENT)) {
      let bytes = null; try { bytes = execFileSync("git", ["-C", BASE, "show", `${p}:${f}`], { maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "pipe"] }); } catch { parentCount[f] = null; continue; } /* the object is not in --base-org's store: named below */
      writeFileSync(join(d, f), bytes); parentCount[f] = eslintCounts(d, [f])[f]; } }); }
    const now = once(src, "E", (d) => eslintCounts(d, Object.keys(RISE_PARENT)));
    const ok = Object.keys(RISE_PARENT).every((f) => parentCount[f] !== null && now[f] <= parentCount[f]);
    return { ok, line: Object.keys(RISE_PARENT).map((f) => `${f.split("/")[1]} ${now[f]} (≤ ${parentCount[f] === null ? `UNREACHABLE ${RISE_PARENT[f]}` : parentCount[f]} at ${RISE_PARENT[f]})`).join(" · ") }; },
  W3: (src) => once(src, "E", (d) => { const r = node(d, ["scripts/organism_test.mjs", "gates"], "hermetic"); const a = asserts(r.out); const blk = gatesBlock(r.out);
    const entered = a.some((l) => /^(ok|FAIL) +GATES —/.test(l)) && !a.some((l) => /^LIVE MODE gates/.test(l)); const neRose = /no-empty/.test(blk.split(/\r?\n/).filter((l) => /RED|ROSE/.test(l)).join(" "));
    return { ok: entered && !neRose, line: `hermetic gates: ${a.filter((l) => /GATES|gates/.test(l)).map((l) => l.slice(0, 90)).join(" | ")}${neRose ? " · a no-empty rise is red" : ""}` }; }),
  W4: (src) => { const z = once(src, "Z", (d) => verdictOf(node(d, ["scripts/organism_test.mjs", "gates"], "hermetic").out)); const x = once(src, "X", (d) => verdictOf(node(d, ["scripts/organism_test.mjs", "gates"], "hermetic").out));
    const entered = !!z && !z.live.includes("MODE gates");
    return { ok: entered && JSON.stringify(z) === JSON.stringify(x), line: `hermetic verdict Z ${JSON.stringify(z && { pass: z.pass, fail: z.fail, live: z.live })} · X ${JSON.stringify(z) === JSON.stringify(x) ? "the same" : JSON.stringify(x && { pass: x.pass, fail: x.fail, live: x.live })}` }; },
  W5: (src) => { const fo = once(src, "X", (d) => node(d, ["scripts/organism_test.mjs", "gates"]).out); const f = verdictOf(fo); const h = once(src, "E", (d) => verdictOf(node(d, ["scripts/organism_test.mjs", "gates"], "hermetic").out));
    // the planted red must be the AJV half's own (a SCHEMA red naming the planted registry.json), not any other count that is red
    const schemaRed = !!f && f.reds.some((x) => /GATES/.test(x)) && /SCHEMA — registry\.json does NOT match/.test(fo);
    return { ok: !!f && f.fail > 0 && schemaRed && !!h && h.live.includes("gates schema half"), line: `full on X: fail ${f && f.fail} · SCHEMA red on the planted registry.json ${schemaRed ? "yes" : "no"} · hermetic LIVE ${JSON.stringify(h && h.live)}` }; },
  W6: (src) => { const s = readFileSync(join(src, "scripts", "cortex.mjs"), "utf8"); const calls = (s.match(/releaseLock\(\);/g) || []).length;
    const retire = lines(s).find((l) => /retire: \(\) => \{ exiting = true;/.test(l)) || "";
    return { ok: calls === 2 && /function releaseLock\(\)/.test(s) && !/catch \{ \}/.test(retire), line: `releaseLock() calls ${calls} · retire line bare catches ${(retire.match(/catch \{ \}/g) || []).length}` }; },
  W7: (src) => once(src, "E", (d) => { const r = node(d, ["scripts/organism_test.mjs", "gates"], "hermetic"); const a = asserts(r.out); const blk = gatesBlock(r.out);
    const red = a.some((l) => /^FAIL GATES —/.test(l)) && /LINT ROSE — no-empty/.test(blk);
    return { ok: red, line: `hermetic gates, one planted empty catch: ${a.filter((l) => /GATES|gates/.test(l)).map((l) => l.slice(0, 60)).join(" | ")}${(blk.match(/LINT ROSE — no-empty \d+/) || [""])[0] ? " · " + blk.match(/LINT ROSE — no-empty \d+[^.]*/)[0] : ""}` }; }, { rise: true }),
};

function bound() {
  const norm = (p) => readFileSync(p).toString("latin1").split("\r\n").join("\n");
  const a = new Set(tracked(ORG).filter((f) => !f.startsWith(SD + "/"))), b = new Set(tracked(BASE).filter((f) => !f.startsWith(SD + "/")));
  const diff = [];
  for (const f of new Set([...a, ...b])) { const pa = join(ORG, f), pb = join(BASE, f);
    const ea = a.has(f) && existsSync(pa), eb = b.has(f) && existsSync(pb); if (ea !== eb || (ea && norm(pa) !== norm(pb))) diff.push(f); }
  const out = diff.filter((f) => !NAMED.includes(f) && !f.startsWith(NAMED_DIR));
  return { ok: out.length === 0, line: `differing tracked files ${diff.length} · outside the named files ${out.length}${out.length ? ": " + out.slice(0, 8).join(" ") : ""}` };
}
function last() {
  let cmds = [];
  if (process.platform === "win32") { const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", maxBuffer: 1 << 26 }); cmds = lines(r.stdout || ""); }
  else if (existsSync("/proc")) for (const p of readdirSync("/proc")) { if (!/^\d+$/.test(p) || Number(p) === process.pid) continue; try { cmds.push(readFileSync(`/proc/${p}/cmdline`, "utf8").split("\0").join(" ")); } catch { /* a process that exited between readdir and read */ } }
  else { const r = spawnSync("ps", ["-Ao", "command"], { encoding: "utf8" }); cmds = lines(r.stdout || ""); }
  const left = cmds.filter((c) => c.includes(RUN) && /node/i.test(c));
  return { ok: left.length === 0, line: `node processes naming ${RUN}: ${left.length}` };
}

const res = {}; const both = (w, src) => { try { return CL[w](src); } catch (e) { return { ok: false, line: `THREW ${String(e && e.message).split(/\r?\n/)[0].slice(0, 160)}` }; } };
for (const w of WANT) {
  const b = ORG_ONLY ? { ok: false, line: "(not run: --org-only)" } : both(w, BASE), o = both(w, ORG);
  if (!ORG_ONLY) console.log(`${w} base ${b.ok ? "GREEN" : "RED  "} ${b.line}`); console.log(`${w} org  ${o.ok ? "GREEN" : "RED  "} ${o.line}`);
  res[w] = { base: b.ok, org: o.ok, ok: !b.ok && o.ok };
}
const B = bound(); console.log(`BOUND ${B.ok ? "GREEN" : "RED  "} ${B.line}`);
rmSync(RUN, { recursive: true, force: true });
const L = last(); console.log(`LAST ${L.ok ? "GREEN" : "RED  "} ${L.line}`);
const bad = WANT.filter((w) => !res[w].ok).map((w) => `${w}${res[w].org ? " (GREEN on base)" : " (RED on org)"}`);
if (!B.ok) bad.push("BOUND"); if (!L.ok) bad.push("LAST");
if (bad.length) { console.log(`RED MGAT · ${bad.join(" · ")}`); process.exitCode = 1; }
else { console.log(`GREEN MGAT gates hermetic half + six site fates · ${WANT.length} clause(s) · RED on base, GREEN on org · BOUND · LAST`); process.exitCode = 0; }
