#!/usr/bin/env node
// ============================================================================
// ci/mt1/witness_mt1.mjs — UNIT mt1 · THE SINGLE-SAMPLE RETIRE WAIT TAKES T2's REPAIR (forks rows 1139 (1) / 1276), witness-only
// ----------------------------------------------------------------------------
//   node ci/mt1/witness_mt1.mjs --org <dir> --base-org <dir> [--only "<id>,…"]
// CONTRACT (judged on --org; the build reads GREEN, the base ci/mt1/BASE reads RED). The unit edits ONLY three witness
// files, so each clause runs the tree's OWN unit witness (ci/<u>/witness_<u>.mjs of --org, and of --base-org for the base
// leg) as a child, on a COPY of that tree under os.tmpdir():
//   (every copy skips node_modules and .git, and takes only the TRACKED dressing-room files: his state never enters a copy)
//   PLAIN-<u>   the build's witness on an UNPLANTED copy of --org reads GREEN on its last line (no clause loosened, none red)
//               AND each of its changed clauses reads GREEN printing `retire <ms> · respawn <ms>` (the base prints neither)
//   P-<u>-<id>  THE PLANT, one per changed clause: a copy of the tree whose scripts/keeper.mjs waits, before each RESPAWN,
//               as long as the worker it replaces ran (the keeper's own measured `ran`; no number is typed) — a respawn
//               slower than one first-boot sample, the neutral machine's shape. On the build the clause reads GREEN and
//               prints `retire <ms> · respawn <ms>`; on the base the same clause reads RED (the single-sample wait).
//               mlv1: I1 · I2 · I3 · mlv2: C1 · C2 · C3 · K5 · mlv3: T1 · T3 · T4
//   BOUND       only ci/mlv1/witness_mlv1.mjs · ci/mlv2/witness_mlv2.mjs · ci/mlv3/witness_mlv3.mjs · ci/mt1/ differ
//               between --base-org and --org (by text, CRLF folded; node_modules and .git skipped)
//   LAST        no node process naming this run's temp dir survives
// THE PORT CLASS (row 1053): this file binds no port and names no service. The unit witnesses it runs plant their own
// ports, and mlv2 / mlv3 hold the real :4112 / :4113 with counting listeners for their own LIVE-SAFE clause, as each
// already does in the suite — so no two of them run at once (each is a spawnSync that ends with its child). No model is
// called (each unit witness plants its own refusing key). No timeout, budget or size is typed here.
// Runs on Windows too: no POSIX-only shell, every read split on \r?\n, no git repo is planted.
// LAST LINE: GREEN MT1 <what> · <n> clause(s) (exit 0) or RED MT1 · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, readdirSync, cpSync, symlinkSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const UNIT = "MT1", HERE = dirname(fileURLToPath(import.meta.url));
const CHANGED = Object.freeze({ mlv1: ["I1", "I2", "I3"], mlv2: ["C1", "C2", "C3", "K5"], mlv3: ["T1", "T3", "T4"] });
const NAMED = (f) => ["ci/mlv1/witness_mlv1.mjs", "ci/mlv2/witness_mlv2.mjs", "ci/mlv3/witness_mlv3.mjs"].includes(f) || /^ci\/mt1\//.test(f);
const TMP = mkdtempSync(join(tmpdir(), "mt1-witness-"));
const results = [];
const want = (id) => !ONLY || ONLY.includes(id);
const record = (id, ok, why) => { if (!want(id) && id !== "LAST") return; results.push({ id, ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id}${why ? ` · ${why}` : ""}`); };
const NM = [join(ORG, "node_modules"), join(HERE, "..", "..", "node_modules")].find((p) => existsSync(p)) || null;

// THE PLANT: the keeper waits, before each respawn, as long as the worker it replaces ran (its own measured `ran`)
const SPAWN = "      child = spawn(worker); spawns++;";
const RAN = "      const ran = now() - t0, d = decide(";
function plantKeeper(src) {
  const s = String(src).replace(/\r\n/g, "\n");
  if (s.split(SPAWN).length !== 2 || s.split(RAN).length !== 2) return null;
  const body = s.replace(SPAWN, "      if (spawns > 0) { await sleep(__mt1Ran, () => stopping); if (stopping) continue; }   // PLANTED: a respawn slower than one first-boot sample; a stop during it stops, as at the loop head\n" + SPAWN)
      .replace(RAN, "      const ran = (__mt1Ran = now() - t0), d = decide(");
  // after the shebang line, if there is one (a line before `#!` is a syntax error)
  const nl = body.startsWith("#!") ? body.indexOf("\n") + 1 : 0;
  return body.slice(0, nl) + "let __mt1Ran = 0;   // PLANTED by ci/mt1 (a copy under os.tmpdir() only)\n" + body.slice(nl);
}
let seq = 0;
function copyTree(tree, planted) {
  const d = join(TMP, `${++seq}-${planted ? "planted" : "plain"}`);
  for (const e of readdirSync(tree)) if (e !== "node_modules" && e !== ".git" && e !== "dressing-room") cpSync(join(tree, e), join(d, e), { recursive: true });
  // dressing-room: only its TRACKED files (a work tree's `git ls-files`; an exported tree holds tracked files only) — his state never enters
  if (existsSync(join(tree, ".git"))) {
    const ls = spawnSync("git", ["-C", tree, "ls-files", "-z", "dressing-room"], { encoding: "utf8", windowsHide: true });
    for (const f of String(ls.stdout || "").split("\0").filter(Boolean)) { mkdirSync(dirname(join(d, f)), { recursive: true }); cpSync(join(tree, f), join(d, f)); }
  } else if (existsSync(join(tree, "dressing-room"))) cpSync(join(tree, "dressing-room"), join(d, "dressing-room"), { recursive: true });
  mkdirSync(join(d, "dressing-room", "state"), { recursive: true });
  if (NM) symlinkSync(NM, join(d, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  if (planted) {
    const k = join(d, "scripts", "keeper.mjs"), p = plantKeeper(readFileSync(k, "utf8"));
    if (p === null) return { dir: d, why: "the plant's anchors are not in scripts/keeper.mjs exactly once" };
    writeFileSync(k, p);
  }
  return { dir: d, why: "" };
}
const childEnv = () => { const e = { ...process.env }; for (const k of Object.keys(e)) if (/^ARSENAL_/i.test(k)) delete e[k]; e.TMPDIR = e.TEMP = e.TMP = TMP; return e; };
/** run tree T's own unit witness <u> on a copy of T → {lines, last, code, why} */
function runUnit(tree, u, planted) {
  const w = join(tree, "ci", u, `witness_${u}.mjs`);
  if (!existsSync(w)) return { lines: [], last: "", code: null, why: `${u}: no witness in the tree` };
  const c = copyTree(tree, planted);
  if (c.why) return { lines: [], last: "", code: null, why: c.why };
  const r = spawnSync(process.execPath, [w, "--org", c.dir], { cwd: c.dir, env: childEnv(), encoding: "utf8", windowsHide: true });
  const lines = String(r.stdout || "").split(/\r?\n/);
  return { lines, last: lines.filter(Boolean).pop() || `(no output; exit ${r.status})`, code: r.status, why: "" };
}
const clauseOf = (run, id) => { const l = run.lines.find((x) => new RegExp(`^  (GREEN|RED  ) ${id} `).test(x)); return l ? { ok: /^  GREEN/.test(l), line: l.trim() } : null; };
const TIMED = /retire \d+ ms · respawn \d+ ms/;

console.log(`witness mt1 · org ${ORG}${BASE ? ` · base ${BASE}` : ""}`);
for (const [u, ids] of Object.entries(CHANGED)) {
  const pids = ids.map((id) => `P-${u}-${id}`);
  if (want(`PLAIN-${u}`)) {
    const p = runUnit(ORG, u, false);
    const timed = ids.filter((id) => { const c = clauseOf(p, id); return !!c && c.ok && TIMED.test(c.line); });
    record(`PLAIN-${u}`, p.code === 0 && new RegExp(`^GREEN ${u.toUpperCase()} `).test(p.last) && timed.length === ids.length,
      `${p.why || p.last.slice(0, 100)} · changed clauses GREEN with their retire/respawn times ${timed.length}/${ids.length}`);
  }
  if (!pids.some(want)) continue;
  const h = runUnit(ORG, u, true), b = BASE ? runUnit(BASE, u, true) : null;
  for (const id of ids) {
    const cid = `P-${u}-${id}`; if (!want(cid)) continue;
    const hc = clauseOf(h, id), bc = b ? clauseOf(b, id) : null;
    const hOk = !!hc && hc.ok && TIMED.test(hc.line);
    const bOk = b ? !!bc && bc.ok : null;
    record(cid, hOk && (b ? bOk === false : true),
      `org ${hc ? (hc.ok ? "GREEN" : "RED") : `not reported (${h.why || h.last.slice(0, 80)})`}${hc ? ` · ${(hc.line.match(TIMED) || ["no retire/respawn timing"])[0]}` : ""}`
      + (b ? ` | base ${bc ? (bc.ok ? "GREEN (the plant did not bite)" : "RED") : `not reported (${b.why || b.last.slice(0, 80)})`}` : " | base leg NOT RUN")
      + (hc && !hc.ok ? ` · ${hc.line.slice(0, 160)}` : ""));
  }
}

const walk = (root, dir = "", o = new Map()) => {
  let ents = []; try { ents = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return o; }
  for (const e of ents) {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (!dir && (e.name === "node_modules" || e.name === ".git" || e.name === "dressing-room")) continue;
    if (e.isDirectory()) walk(root, rel, o);
    else if (e.isFile()) { const bf = readFileSync(join(root, rel)); const t = bf.includes(0) ? bf : Buffer.from(bf.toString("utf8").replace(/\r\n/g, "\n")); o.set(rel, createHash("sha256").update(t).digest("hex")); }
  }
  return o;
};
if (BASE && want("BOUND")) {
  const a = walk(BASE), b = walk(ORG);
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED(f));
  record("BOUND", extra.length === 0, `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 12).join(", ")}` : ""}`);
}
try { rmSync(TMP, { recursive: true, force: true }); } catch { /* a survivor holds a file: LAST names it */ }
{
  let table = "", why = "";
  try {
    table = process.platform === "win32"
      ? execFileSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8" })
      : execFileSync("ps", ["-eo", "args"], { encoding: "utf8" });
  } catch (e) { why = `process table unreadable: ${e.message}`; }
  const left = table.split(/\r?\n/).filter((l) => l.includes(TMP) && !/\bps -eo\b/.test(l));
  record("LAST", !why && left.length === 0, why || `${left.length} survivor(s)`);
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length) { console.log(`RED ${UNIT} · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN ${UNIT} every retire clause of the mlv1, mlv2 and mlv3 witnesses keeps its retire bound and waits for the respawned boot by an event, printing both times, and holds under a respawn slower than one first-boot sample · ${results.length} clause(s)`);
process.exit(0);
