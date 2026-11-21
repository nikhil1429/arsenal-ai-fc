#!/usr/bin/env node
// ci/mf2/run_mutants_mf2.mjs — forks rows 1204 / 1205 (3) · THE MUTANTS OF F3's TWO DOORS, and a control.
// ----------------------------------------------------------------------------------------------------------------------
// USAGE: node ci/mf2/run_mutants_mf2.mjs --org <build tree> --base-org <base tree>   (the build's new LIVE name is the one
//   door 2 lists today; the mutants take that door, or both, away)
//   M-D1-NOPARTNER · door 1: the witness dir copied with LIVE_ADMITTED.json emptied (`admitted: []`), and the build tree declares
//                no LIVE_NARROWS partner for its new LIVE name ⇒ F3 RED, its line naming `no narrowed partner declared`.
//   M-D2-UNLISTED  · door 2: the list's one entry renamed to a name the build does not print, so the build's new LIVE name is
//                unlisted ⇒ F3 RED, its line naming door 2 admitting `none`.
//   M-D2-JUDGED    · door 2: the base tree copied under the temp root with a one-row brain_ledger.jsonl planted (by node) in its state
//                dir, so the BASE hermetic run judges the asserts the listed name stands for ⇒ F3 must read RED (a LIVE name
//                may not hide asserts the base judged) ⇒ F3 RED, its line naming `the BASE judged`.
//   control    · the witness and both trees as given ⇒ F3 GREEN (the witness's other clauses are reported, not judged here:
//                BOUND is the bound class after main moved, forks row 1200 (2)).
//   A mutant counts when the witness exits 1, its LAST line `RED MF2 · …` names F3, and the F3 line carries the mutant's own
//   reason (so each door is seen refusing, not the other). The four runs go concurrently, each
//   writing to a file. PORT CLASS: no port, no service, no POST, no restart; every plant under one temp root, removed after.
// LAST LINE: `run_mutants: <k> of 3 mutant(s) RED by the clause that names them · control GREEN|RED` (exit 0 iff k = 2 and
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
  const L = JSON.parse(readFileSync(join(HERE, "LIVE_ADMITTED.json"), "utf8"));
  const wdir = (id, admitted) => { const d = join(R, `w-${id}`); cpSync(HERE, d, { recursive: true }); writeFileSync(join(d, "LIVE_ADMITTED.json"), JSON.stringify({ ...L, admitted }, null, 2) + "\n"); return d; };
  const wD1 = wdir("d1", []);
  const wU = wdir("d2u", L.admitted.map((e) => ({ ...e, live: "MF2 MUTANT · a LIVE name the build does not print" })));
  // M-D2-JUDGED: a copy of the base tree with the ledger planted, so the base judges the listed asserts
  const bJ = join(R, "base-judged");
  cpSync(BASE, bJ, { recursive: true, verbatimSymlinks: true });
  mkdirSync(join(bJ, "dressing-room", "state"), { recursive: true });
  writeFileSync(join(bJ, "dressing-room", "state", "brain_ledger.jsonl"), "{}\n");
  const [d1, u, j, c] = await Promise.all([
    run(wD1, ORG, BASE, join(R, "d1.txt")),
    run(wU, ORG, BASE, join(R, "unlisted.txt")),
    run(HERE, ORG, bJ, join(R, "judged.txt")),
    run(HERE, ORG, BASE, join(R, "control.txt")),
  ]);
  const f3 = (r) => (r.out.split(/\r?\n/).find((l) => /^(GREEN|RED {2}) F3 · /.test(l)) || "(no F3 line)");
  const names = (r, id) => r.code === 1 && /^RED MF2 · /.test(r.last) && r.last.slice("RED MF2 · ".length).split(/\s+/).includes(id);
  for (const [id, r, why] of [["M-D1-NOPARTNER", d1, "no narrowed partner declared"], ["M-D2-UNLISTED", u, "door 2 admitted (row-listed, none of their asserts judged by the base): none"], ["M-D2-JUDGED", j, "the BASE judged"]]) {
    const hit = names(r, "F3") && /^RED +F3 · /.test(f3(r)) && f3(r).includes(why);
    if (hit) k++;
    console.log(`  ${hit ? "RED " : "MISS"} ${id} → ${r.last}\n         ${f3(r).slice(0, 600)}`);
  }
  control = /^GREEN F3 · /.test(f3(c)) ? "GREEN" : "RED";
  console.log(`  control → ${c.last}\n         ${f3(c).slice(0, 600)}`);
} finally { rmSync(R, { recursive: true, force: true }); }
console.log(`run_mutants: ${k} of 3 mutant(s) RED by the clause that names them · control ${control}`);
process.exit(k === 3 && control === "GREEN" ? 0 : 1);
