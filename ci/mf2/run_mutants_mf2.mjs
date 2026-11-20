#!/usr/bin/env node
// ci/mf2/run_mutants_mf2.mjs — forks row 1204 · THE TWO MUTANTS OF F3's LISTED ADMISSION, and a control.
// ----------------------------------------------------------------------------------------------------------------------
// USAGE: node ci/mf2/run_mutants_mf2.mjs --org <build tree> --base-org <base tree>
//   M-UNLISTED · the witness dir copied under the temp root with LIVE_ADMITTED.json emptied (`admitted: []`): the build's LIVE
//                name stands in no list ⇒ F3 must read RED.
//   M-JUDGED   · the base tree copied under the temp root with a one-row brain_ledger.jsonl planted (by node) in its state
//                dir, so the BASE hermetic run judges the asserts the listed name stands for ⇒ F3 must read RED (a LIVE name
//                may not hide asserts the base judged).
//   control    · the witness and both trees as given ⇒ F3 GREEN (the witness's other clauses are reported, not judged here:
//                BOUND is the bound class after main moved, forks row 1200 (2)).
//   A mutant counts when the witness exits 1 and its LAST line `RED MF2 · …` names F3. The three runs go concurrently, each
//   writing to a file. PORT CLASS: no port, no service, no POST, no restart; every plant under one temp root, removed after.
// LAST LINE: `run_mutants: <k> of 2 mutant(s) RED by the clause that names them · control GREEN|RED` (exit 0 iff k = 2 and
//   the control's F3 is GREEN).
// ----------------------------------------------------------------------------------------------------------------------
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync, openSync, closeSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE || !existsSync(ORG) || !existsSync(BASE)) { console.log("run_mutants: USAGE --org <build> --base-org <base>"); process.exit(1); }
const R = mkdtempSync(join(tmpdir(), "mf2-m-"));
const run = (wdir, org, base, log) => new Promise((res) => {
  const fd = openSync(log, "w");
  const c = spawn(process.execPath, [join(wdir, "witness_mf2.mjs"), "--org", org, "--base-org", base], { stdio: ["ignore", fd, fd], windowsHide: true });
  const done = (code) => { try { closeSync(fd); } catch {} const out = readFileSync(log, "utf8"); res({ code, out, last: out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop() || "(no last line)" }); };
  c.on("error", () => done(null)); c.on("exit", done);
});
let k = 0, control = "RED";
try {
  // M-UNLISTED: a copy of the witness dir, the list emptied
  const wU = join(R, "w-unlisted");
  cpSync(HERE, wU, { recursive: true });
  const L = JSON.parse(readFileSync(join(wU, "LIVE_ADMITTED.json"), "utf8"));
  writeFileSync(join(wU, "LIVE_ADMITTED.json"), JSON.stringify({ ...L, admitted: [] }, null, 2) + "\n");
  // M-JUDGED: a copy of the base tree with the ledger planted, so the base judges the listed asserts
  const bJ = join(R, "base-judged");
  cpSync(BASE, bJ, { recursive: true, verbatimSymlinks: true });
  mkdirSync(join(bJ, "dressing-room", "state"), { recursive: true });
  writeFileSync(join(bJ, "dressing-room", "state", "brain_ledger.jsonl"), "{}\n");
  const [u, j, c] = await Promise.all([
    run(wU, ORG, BASE, join(R, "unlisted.txt")),
    run(HERE, ORG, bJ, join(R, "judged.txt")),
    run(HERE, ORG, BASE, join(R, "control.txt")),
  ]);
  const f3 = (r) => (r.out.split(/\r?\n/).find((l) => /^(GREEN|RED {2}) F3 · /.test(l)) || "(no F3 line)");
  const names = (r, id) => r.code === 1 && /^RED MF2 · /.test(r.last) && r.last.slice("RED MF2 · ".length).split(/\s+/).includes(id);
  for (const [id, r] of [["M-UNLISTED", u], ["M-JUDGED", j]]) {
    const hit = names(r, "F3");
    if (hit) k++;
    console.log(`  ${hit ? "RED " : "MISS"} ${id} → ${r.last}\n         ${f3(r).slice(0, 400)}`);
  }
  control = /^GREEN F3 · /.test(f3(c)) ? "GREEN" : "RED";
  console.log(`  control → ${c.last}\n         ${f3(c).slice(0, 400)}`);
} finally { rmSync(R, { recursive: true, force: true }); }
console.log(`run_mutants: ${k} of 2 mutant(s) RED by the clause that names them · control ${control}`);
process.exit(k === 2 && control === "GREEN" ? 0 : 1);
