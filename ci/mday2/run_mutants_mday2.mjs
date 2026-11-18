#!/usr/bin/env node
// ci/mday2/run_mutants_mday2.mjs --org <build dir> --base-org <base dir>
// One mutant per witness clause: each is a COPY of --org under os.tmpdir() with ONE edit, and the witness, run with
// --only <that clause>, must read RED on the clause that names it. The control (the copy, unedited) runs the WHOLE witness
// and must read GREEN. The edit site is matched in the file's OWN line ending (core.autocrlf) and must be unique, or the
// mutant is NOT APPLIED and counts as surviving. A mutant marked `own` edits the witness copy and is judged by it.
// Nothing under --org is written; .git, node_modules and the org's dressing-room/state are never copied (the witness plants
// its own). No git repo is planted, no port bound, no model called; every child is spawnSync, bounded by its own exit.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = resolve(arg("--base-org") || ".");
const WITNESS_REL = "ci/mday2/witness_mday2.mjs";
const MUTANTS = [
  { clause: "D1", file: "scripts/learn_digest.mjs", from: "· node scripts/day.mjs status shows it · never type the open yourself\");", to: "· node scripts/day.mjs status shows it · never type the open yourself — node scripts/sitting.mjs open --surface code\");", what: "the hand-typed sitting open put back on the boot line" },
  { clause: "D2", file: "scripts/learn_digest.mjs", from: "a second end says already closed)\");", to: "a second end says already closed) → node scripts/gaffer_brain.mjs judge-round\");", what: "a judge-round typed on the day end line" },
  { clause: "D3", file: "scripts/learn_digest.mjs", from: "push(\"  day end \" + END_LINE + \"", to: "push(\"  day end run node scripts/day.mjs end\" + \"", what: "the day end line typed here, not day.mjs's own END_LINE" },
  { clause: "D4", file: "scripts/learn_digest.mjs", from: "!/sitting\\.mjs open/.test(out) && !/judge-round/.test(out)", to: "true || !/sitting\\.mjs open/.test(out) && !/judge-round/.test(out)", what: "the selftest clause disarmed" },
  { clause: "BOUND", file: "scripts/day.mjs", from: "// CLI: node scripts/day.mjs start|end|answer|status|brief", to: "// CLI: node scripts/day.mjs start|end|answer|status|brief (mutant)", what: "a file beyond the named ones edited" },
  { clause: "LAST", own: true, file: WITNESS_REL, from: "const PLANT_SURVIVOR = false;", to: "const PLANT_SURVIVOR = true;", what: "a node process naming the temp dir left alive" },
];
const SKIP = new Set([".git", "node_modules"]);
const skipRel = (rel) => rel.split(sep).some((p) => SKIP.has(p)) || rel === join("dressing-room", "state") || rel.startsWith(join("dressing-room", "state") + sep);
const TMP = mkdtempSync(join(tmpdir(), "mday2-mutants-"));
const copy = (name) => { const d = join(TMP, name); cpSync(ORG, d, { recursive: true, filter: (src) => !skipRel(relative(ORG, src)) }); return d; };
const lastLine = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim()).pop() || "";
const witness = (wfile, org, only) => { const r = spawnSync(process.execPath, [wfile, "--org", org, "--base-org", BASE, ...(only ? ["--only", only] : [])], { encoding: "utf8", windowsHide: true }); return { status: r.status, out: String(r.stdout || "") }; };

let k = 0;
MUTANTS.forEach((m, i) => {
  const d = copy(`m${i}`);
  const f = join(d, m.file);
  const src = readFileSync(f, "utf8"), eol = src.includes("\r\n") ? "\r\n" : "\n";
  const from = m.from.replace(/\n/g, eol), to = m.to.replace(/\n/g, eol);
  if (src.split(from).length !== 2) { console.log(`  SURVIVED ${m.clause} · NOT APPLIED (edit site not unique) · ${m.what}`); return; }
  writeFileSync(f, src.replace(from, to));
  const wfile = m.own ? join(d, WITNESS_REL) : join(dirname(fileURLToPath(import.meta.url)), "witness_mday2.mjs");
  const r = witness(wfile, d, m.clause);
  const redByName = r.status === 1 && new RegExp(`^\\s*RED\\s+${m.clause} ·`, "m").test(r.out);
  if (redByName) k++;
  console.log(`  ${redByName ? "KILLED  " : "SURVIVED"} ${m.clause} · ${m.what} · witness: ${lastLine(r.out)}`);
});
const c = witness(join(dirname(fileURLToPath(import.meta.url)), "witness_mday2.mjs"), copy("control"), null);
const control = c.status === 0 && /^GREEN MDAY2 /.test(lastLine(c.out));
try { rmSync(TMP, { recursive: true, force: true }); } catch { /* best effort */ }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && control ? 0 : 1);
