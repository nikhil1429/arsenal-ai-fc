// unit mgat · THE WITNESS. Clauses W1..W7 over a target: `base` (the sha as is), `build` (build.mjs EDITS applied) or a
// mutant M1..M7 (the build minus one clause's reason). Every tree is a temp dir under os.tmpdir(); state is PLANTED there by
// this script (never a shell write): Z = state folder absent · E = present, empty · T = the commit's tracked state ·
// X = T plus registry.json overwritten with a value no schema object accepts (the ajv half's planted red).
// No port is bound, nothing live is named, no model is called. Bounded waits: every child is spawnSync (it returns).
// usage: node ci/mgat/tools/witness.mjs <sha> <base|build|M1..M7> [W1,W2,...]
import { REPO } from "./tree.mjs"; import { applyBuild, MUTANTS } from "./build.mjs"; import { sitesAt } from "./sites.mjs";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, symlinkSync, rmSync, writeFileSync, appendFileSync, readFileSync } from "node:fs"; import { join } from "node:path"; import { tmpdir } from "node:os";

const [sha0, target = "build", only] = process.argv.slice(2);
const sha = execFileSync("git", ["-C", REPO, "rev-parse", "--short=7", sha0], { encoding: "utf8" }).trim();
const want = only ? only.split(",") : ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];
const SD = ["dressing-room", "state"];

function plant(kind, { rise = false } = {}) {
  const d = mkdtempSync(join(tmpdir(), `mgat-w-${target}-${kind}-`));
  const tar = execFileSync("git", ["-C", REPO, "-c", "core.autocrlf=false", "archive", "--format=tar", sha], { maxBuffer: 1 << 30 });
  const ex = kind === "T" || kind === "X" ? [] : ["--exclude=" + SD.join("/"), "--exclude=" + SD.join("/") + "/*"];
  execFileSync("tar", ["-x", "-C", d, ...ex], { input: tar, maxBuffer: 1 << 30 });
  if (kind === "E") mkdirSync(join(d, ...SD), { recursive: true });
  if (kind === "X") writeFileSync(join(d, ...SD, "registry.json"), "123\n");
  symlinkSync(join(REPO, "node_modules"), join(d, "node_modules"));
  if (target !== "base") applyBuild(d, target === "build" ? null : target);
  if (rise) appendFileSync(join(d, "scripts", "groundsman.mjs"), "\nexport const mgatPlantedRise = () => { try { JSON.parse(\"x\"); } catch { } };\n");
  const g = (...a) => execFileSync("git", ["-C", d, "-c", "core.autocrlf=false", "-c", "user.email=seat@local", "-c", "user.name=seat", ...a], { stdio: "pipe" });
  g("init", "-q"); g("add", "-A"); g("commit", "-qm", "plant", "--no-verify");
  return d;
}
const envOf = (profile) => { const e = { ...process.env }; delete e.ORGANISM_TEST_PROFILE; if (profile) e.ORGANISM_TEST_PROFILE = profile; return e; };
const node = (d, args, profile) => { const r = spawnSync(process.execPath, args, { cwd: d, encoding: "utf8", env: envOf(profile), maxBuffer: 1 << 28 }); return { code: r.status, out: (r.stdout || "") + (r.stderr || "") }; };
const asserts = (out) => out.split("\n").filter((l) => /^  (ok  |FAIL|LIVE) /.test(l)).map((l) => l.trim().slice(0, 140));
const verdictOf = (out) => { const m = out.match(/^ORGANISM_TEST_VERDICT (.*)$/m); if (!m) return null; const v = JSON.parse(m[1]); return { pass: v.pass, fail: v.fail, reds: v.reds, live: v.live }; };
const once = (kind, fn, o) => { const d = plant(kind, o); try { return fn(d); } finally { rmSync(d, { recursive: true, force: true }); } };
const parentCount = {};
const CL = {
  W1: () => once("E", (d) => { const r = node(d, ["scripts/gates.mjs", "report"]); const ne = (r.out.match(/no-empty (\d+)/) || [])[1]; const base = (readFileSync(join(d, "scripts/gates.mjs"), "utf8").match(/"no-empty": (\d+)/) || [])[1];
    return { ok: r.code === 0 && ne === base, line: `gates report exit ${r.code} · no-empty ${ne} · frozen ${base}` }; }),
  W2: () => { // per file: no more no-empty sites than at the parent of the rise that added its new ones
    const rises = { "scripts/groundsman.mjs": "15edfec", "scripts/cortex.mjs": "4d166d3", "scripts/captains_call.mjs": "8c729c8" };
    for (const [f, p] of Object.entries(rises)) parentCount[f] ??= sitesAt(p).filter((s) => s.file === f).length;
    const now = once("E", (d) => { const r = spawnSync(process.execPath, [join(d, "node_modules/eslint/bin/eslint.js"), ...Object.keys(rises), "--format", "json"], { cwd: d, encoding: "utf8", maxBuffer: 1 << 28 });
      const rep = JSON.parse(r.stdout.slice(r.stdout.indexOf("["), r.stdout.lastIndexOf("]") + 1)); return Object.fromEntries(rep.map((x) => [x.filePath.slice(d.length + 1), x.messages.filter((m) => m.ruleId === "no-empty").length])); });
    const ok = Object.keys(rises).every((f) => now[f] <= parentCount[f]);
    return { ok, line: Object.keys(rises).map((f) => `${f.split("/")[1]} ${now[f]} (≤ ${parentCount[f]} at ${rises[f]})`).join(" · ") }; },
  W3: () => once("E", (d) => { const r = node(d, ["scripts/organism_test.mjs", "gates"], "hermetic"); const a = asserts(r.out);
    const ok = a.some((l) => /^ok +GATES —/.test(l)) && !a.some((l) => /^LIVE MODE gates/.test(l));
    return { ok, line: `hermetic gates: ${a.filter((l) => /GATES|gates/.test(l)).join(" | ").slice(0, 300)}` }; }),
  W4: () => { const z = once("Z", (d) => verdictOf(node(d, ["scripts/organism_test.mjs", "gates"], "hermetic").out)); const x = once("X", (d) => verdictOf(node(d, ["scripts/organism_test.mjs", "gates"], "hermetic").out));
    const entered = z && !z.live.includes("MODE gates");
    return { ok: !!entered && JSON.stringify(z) === JSON.stringify(x), line: `hermetic verdict Z ${JSON.stringify(z)} · X ${JSON.stringify(x)}` }; },
  W5: () => { const f = once("X", (d) => verdictOf(node(d, ["scripts/organism_test.mjs", "gates"]).out)); const h = once("E", (d) => verdictOf(node(d, ["scripts/organism_test.mjs", "gates"], "hermetic").out));
    const ok = !!f && f.fail > 0 && !!h && h.live.includes("gates schema half");
    return { ok, line: `full on X: fail ${f && f.fail} · hermetic LIVE ${JSON.stringify(h && h.live)}` }; },
  W6: () => once("E", (d) => { const s = readFileSync(join(d, "scripts/cortex.mjs"), "utf8"); const calls = (s.match(/releaseLock\(\);/g) || []).length; const retire = s.split("\n").find((l) => /retire: \(\) => \{ exiting = true;/.test(l)) || "";
    return { ok: calls === 2 && /function releaseLock\(\)/.test(s) && !/catch \{ \}/.test(retire), line: `releaseLock() calls ${calls} · retire line bare catches ${(retire.match(/catch \{ \}/g) || []).length}` }; }),
};
// W7 plants one new empty catch (the rise the neutral reader must now see)
CL.W7 = () => { const d = plant("E", { rise: true }); try { const r = node(d, ["scripts/organism_test.mjs", "gates"], "hermetic"); const a = asserts(r.out);
  return { ok: a.some((l) => /^FAIL GATES —/.test(l)), line: `hermetic gates, one planted empty catch: ${a.filter((l) => /GATES|gates/.test(l)).join(" | ").slice(0, 200)}` }; } finally { rmSync(d, { recursive: true, force: true }); } };

const res = {};
for (const w of want) { let r; try { r = CL[w](); } catch (e) { r = { ok: false, line: `THREW ${String(e.message).slice(0, 160)}` }; } res[w] = r.ok ? "GREEN" : "RED"; console.log(`${w} ${r.ok ? "GREEN" : "RED  "} ${r.line}`); }
console.log(`mgat witness ${sha} ${target}${MUTANTS[target] ? ` (${MUTANTS[target].why})` : ""}: ${want.map((w) => `${w} ${res[w]}`).join(" · ")}`);
