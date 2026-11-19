#!/usr/bin/env node
// ci/mport/run_mutants_mport.mjs --org <build dir> --base-org <base dir>
// One mutant per witness clause (P1, P2, P3): each is a COPY of --org under os.tmpdir() (its tracked + unignored files; of
// dressing-room/state only registry.json, the one file the import chain needs; no git is planted, so core.autocrlf has
// nothing to clone or init) with ONE single-line edit, and the witness, run with --only <that clause>, must read RED on the
// clause that names it. The control (the copy, unedited) runs the WHOLE witness and must read GREEN. Each edit site must
// occur exactly once in its file, or the mutant is NOT APPLIED and counts as surviving. Nothing under --org is written; every
// child wait is bounded by keeper.mjs's own KEEP_POLL_MS (read from --org, never typed); no port is bound, no daemon started.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, cpSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = resolve(arg("--base-org") || ".");
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mport.mjs");
const { KEEP_POLL_MS } = await import(pathToFileURL(join(ORG, "scripts", "keeper.mjs")).href);
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const MUTANTS = [
  { clause: "P1", file: "scripts/keeper.mjs", from: "  const p = under ? Number(env[name]) : NaN;", to: "  const p = Number(env[name]);", what: "the guard dropped: the env name read wherever keeper sits" },
  { clause: "P2", file: "scripts/keeper.mjs", from: "  const p = under ? Number(env[name]) : NaN;", to: "  const p = NaN;", what: "the door shut: a planted tree reads the fixed ports too" },
  { clause: "P3", file: "scripts/thalamus.mjs", from: 'const PORT = plantedPort("ARSENAL_THALAMUS_PORT", 4113);', to: 'const PORT = ((n) => (Number.isInteger(n) && n > 0 && n < 65536 ? n : 4113))(Number(process.env.ARSENAL_THALAMUS_PORT));', what: "thalamus re-grows its own port read beside the one door" },
];
const ST = ["dressing-room", "state"].join("/") + "/";
const files = lines(spawnSync("git", ["-C", ORG, "ls-files", "-co", "--exclude-standard"], { encoding: "utf8", maxBuffer: 1 << 28 }).stdout)
  .filter((f) => (!f.startsWith(ST) || f === ST + "registry.json") && existsSync(join(ORG, f)));
const plant = () => {
  const d = mkdtempSync(join(tmpdir(), "mport-mut-"));
  for (const f of files) { mkdirSync(dirname(join(d, f)), { recursive: true }); cpSync(join(ORG, f), join(d, f)); }
  return d;
};
const witness = (org, only) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE, ...(only ? ["--only", only] : [])], { encoding: "utf8", timeout: KEEP_POLL_MS, windowsHide: true });
  const out = lines(r.stdout);
  return { code: r.status, last: out[out.length - 1] || `no output (${r.signal || r.status})`, out };
};
let killed = 0;
for (const m of MUTANTS) {
  const d = plant(), p = join(d, m.file), src = readFileSync(p, "utf8");
  const n = src.split(m.from).length - 1;
  if (n !== 1) { console.log(`✗ ${m.clause} · NOT APPLIED (${n} site(s)) · ${m.what}`); rmSync(d, { recursive: true, force: true }); continue; }
  writeFileSync(p, src.replace(m.from, m.to));
  const w = witness(d, m.clause), named = w.out.some((l) => l.startsWith(`✗ ${m.clause} `));
  const red = w.code === 1 && named && /^RED MPORT · .*\bP\d/.test(w.last) && w.last.includes(m.clause);
  if (red) killed++;
  console.log(`${red ? "✓" : "✗"} ${m.clause} · ${m.what} · witness: ${w.last}`);
  rmSync(d, { recursive: true, force: true });
}
const d = plant(), c = witness(d, null);
rmSync(d, { recursive: true, force: true });
const ctl = c.code === 0 && /^GREEN MPORT /.test(c.last);
console.log(`control · witness: ${c.last}`);
console.log(`run_mutants: ${killed} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${ctl ? "GREEN" : "RED"}`);
process.exit(killed === MUTANTS.length && ctl ? 0 : 1);
