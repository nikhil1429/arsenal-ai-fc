#!/usr/bin/env node
// ============================================================================
// ci/mkp24/run_mutants_mkp24.mjs — unit mkp24's mutants, one per clause of ci/mkp24/witness_mkp24.mjs (forks row 1216).
// CONTRACT:  node ci/mkp24/run_mutants_mkp24.mjs [--org <tree>] [--base-org <tree>]
//   With no --org, the --org tree is this clone's HEAD; with no --base-org, it is ci/mkp24/BASE (until mdtl is on main there
//   is no BASE, row 1216 K-F4, and --base-org must be named). Each tree is built as an LF tree under os.tmpdir() through a
//   private index (core.autocrlf=false, core.eol=lf). Each mutant is a COPY of the --org tree with ONE planted edit (every
//   edit must match exactly once, or the mutant is NOT APPLIED and counts as not red); the witness (this dir's own) runs on
//   it against the --base-org tree and must go RED on the clause that names the mutant. The control (no edit) must read
//   GREEN. No fixed port, no live service, no network, no model call; every wait is bounded by the --org tree's own
//   suite.yml timeout-minutes (read, never typed).
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, rmSync, cpSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const T0 = Date.now();
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const WITNESS = join(HERE, "witness_mkp24.mjs");
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const TMP = mkdtempSync(join(tmpdir(), "mkp24-mut-"));
const done = (line, code) => { try { rmSync(TMP, { recursive: true, force: true }); } catch { /* held */ } console.log(line); process.exit(code); };

function lfTree(sha, into) {
  mkdirSync(into, { recursive: true });
  const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", REPO, `--work-tree=${into}`, "checkout", "-q", sha, "--", "."],
    { encoding: "utf8", windowsHide: true, env: { ...process.env, GIT_INDEX_FILE: `${into}.index` } });
  return r.status === 0 ? null : String(r.stderr || "").trim().split(/\r?\n/)[0];
}
let ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG) { ORG = join(TMP, "org"); const e = lfTree("HEAD", ORG); if (e) done(`run_mutants: the --org tree could not be built (${e})`, 1); }
if (!BASE) {
  if (!existsSync(join(HERE, "BASE"))) done("run_mutants: no ci/mkp24/BASE yet (row 1216 K-F4) — name --base-org", 1);
  BASE = join(TMP, "base");
  const e = lfTree(readFileSync(join(HERE, "BASE"), "utf8").trim(), BASE); if (e) done(`run_mutants: the --base-org tree could not be built (${e})`, 1);
}
const wf = (() => { try { return readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec(wf) || [])[1]);
if (!(jobMin > 0)) done("run_mutants: the --org tree's suite.yml names no timeout-minutes", 1);
const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());

const MUTANTS = [
  { id: "K1-m", clause: "K1 RETIRE-LATE", why: "T1 prints no CAUSE line", edits: [
    ["ci/mlv3/witness_mlv3.mjs", "  if (!ok) console.log(`CAUSE ${id.split(\" · \")[0]}", "  if (!ok && !id.startsWith(\"T1 \")) console.log(`CAUSE ${id.split(\" · \")[0]}"]] },
  { id: "K2-m", clause: "K2 NO-GAP", why: "T2's fates.pending branch maps to LOST", edits: [
    ["ci/mlv3/witness_mlv3.mjs", ": !drained ? \"DRAIN-LATE\" : \"NO-GAP\" };", ": !drained ? \"DRAIN-LATE\" : \"LOST\" };"]] },
  { id: "K3-m", clause: "K3 PORT", why: "mlv1's port-still-held branch maps to the keeper-exit code", edits: [
    ["ci/mlv1/witness_mlv1.mjs", "still held ${BOUND} ms after the kill`, code: \"NOT-UP-PORT\" };", "still held ${BOUND} ms after the kill`, code: \"NOT-UP-KEEPER\" };"]] },
  { id: "K4-m", clause: "K4 LOST", why: "T2's LOST and TWICE share one code", edits: [
    ["ci/mlv3/witness_mlv3.mjs", "code: !s2 ? (code2 || \"RESPAWN-LATE\") : lost ? \"LOST\" : twice ? \"TWICE\"", "code: !s2 ? (code2 || \"RESPAWN-LATE\") : lost ? \"TWICE\" : twice ? \"TWICE\""]] },
  { id: "K5-m", clause: "K5 UNPLANTED", why: "mlv1 prints a CAUSE line on a GREEN clause", edits: [
    ["ci/mlv1/witness_mlv1.mjs", "  if (!ok) console.log(`CAUSE ${id.split(\" · \")[0]}", "  if (ok || !ok) console.log(`CAUSE ${id.split(\" · \")[0]}"]] },
  { id: "K6-m", clause: "K6 NO-LEAK", why: "the code rule trusts the witness: an unknown CODE rides as its own text, and verifyCause keeps any `<CODE> · <text>`", edits: [
    ["scripts/witness_cause.mjs", "      if (!(CODE.test(k) && codes.has(k))) { withheld = true; continue; }", "      if (!(CODE.test(k) && codes.has(k))) { out.push({ id: hit, text: `${k} · ${k}` }); continue; }"],
    ["scripts/witness_cause.mjs", "      return !!c && codesOf(src).get(c[1]) === c[2];", "      return !!c;"]] },
  { id: "K7-m", clause: "K7 REPLAY", why: "causesOf matches one word at a time (no multi-word id)", edits: [
    ["scripts/witness_cause.mjs", "  const wide = Math.max(1, ...[...ids].map((i) => i.split(\" \").length));", "  const wide = 1;"]] },
  { id: "K8-m", clause: "K8 MRV", why: "mrv drops the inner code (every inner red reads INNER-RED)", edits: [
    ["ci/mrv/witness_mrv.mjs", "Object.hasOwn(CAUSES, (r.causes || {})[bad[0]] || \"\") ? r.causes[bad[0]] : \"INNER-RED\" };", "\"INNER-RED\" };"]] },
  { id: "BOUND-m", clause: "BOUND", why: "a third file outside ci/ is touched (scripts/keeper.mjs)", edits: [
    ["scripts/keeper.mjs", "export const KEEP_POLL_MS = ", "// a mutant's touch\nexport const KEEP_POLL_MS = "]] },
  { id: "LAST-m", clause: "LAST", why: "mlv1 leaves a detached node process naming its temp dir", edits: [
    ["ci/mlv1/witness_mlv1.mjs", "const TMP = mkdtempSync(join(tmpdir(), \"mlv1-witness-\"));\n", "const TMP = mkdtempSync(join(tmpdir(), \"mlv1-witness-\"));\nspawn(process.execPath, [\"-e\", \"setInterval(() => {}, 1 << 30)\", TMP], { detached: true, stdio: \"ignore\", windowsHide: true }).unref();\n"]] },
];

function run(tree) {
  const r = spawnSync(process.execPath, [WITNESS, "--org", tree, "--base-org", BASE], { encoding: "utf8", windowsHide: true, timeout: left() });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  const last = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
  return { code: r.status, last, out };
}
const control = run(ORG);
const cOk = control.code === 0 && /^GREEN MKP24 /.test(control.last);
console.log(`control · ${cOk ? "GREEN" : "RED"} · ${control.last}`);
let k = 0;
for (const m of MUTANTS) {
  const dir = join(TMP, m.id);
  cpSync(ORG, dir, { recursive: true, filter: (s) => !/[\\/](node_modules|\.git)([\\/]|$)/.test(s) });
  let applied = true;
  for (const [f, a, b] of m.edits) {
    const p = join(dir, f);
    const t = existsSync(p) ? readFileSync(p, "utf8") : "";
    if (t.split(a).length !== 2) { applied = false; break; }
    writeFileSync(p, t.replace(a, b));
  }
  const r = applied ? run(dir) : { code: null, last: "(not applied)", out: "" };
  const redBy = applied && r.code === 1 && new RegExp(`^RED MKP24 · (.*, )?${m.clause.replace(/[-]/g, "\\-")}(, |$)`).test(r.last);
  if (redBy) k++;
  console.log(`${m.id} · ${m.why} · ${applied ? "applied" : "NOT APPLIED"} · ${redBy ? `RED by ${m.clause}` : "NOT red by its clause"} · ${r.last}`);
  rmSync(dir, { recursive: true, force: true });
}
done(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cOk ? "GREEN" : "RED"}`, k === MUTANTS.length && cOk ? 0 : 1);
