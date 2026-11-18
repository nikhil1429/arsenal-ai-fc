#!/usr/bin/env node
// ci/mfac-floor/run_mutants_mfac_floor.mjs --org <build dir> --base-org <base dir>
// One mutant (or more) per clause of witness_mfac_floor.mjs: each a COPY of --org under os.tmpdir() with its edit(s), judged by
// the witness with --only <clause>, which must read RED on the clause that names it. The control (unedited) runs the WHOLE
// witness and must read GREEN. Edit sites are matched in the file's own line ending and must be unique, or the mutant is NOT
// APPLIED and counts as surviving. A mutant marked `own` edits the witness and is judged by the edited copy. Nothing under
// --org is written; node_modules rides as a link; the state dir is not copied. Any node process naming a floor-witness temp
// root left by the LAST mutant is ended.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = resolve(arg("--base-org") || ".");
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mfac_floor.mjs");
const N = "scripts/night.mjs";
const MUTANTS = [
  { clause: "F4.1", what: "the placeholder restored (the ruled floor withdrawn)", edits: [[N, "memory_floor_mb: 1536 });", "memory_floor_mb: FLOOR_UNSET });"]] },
  { clause: "F4.1", what: "the floor's line loses its ruling rows", edits: [[N, "   // forks row 1103 · the 1.5 GB line of row 477 (5)", ""]] },
  { clause: "F4.2", what: "the floor check made strict (a reading AT the line refused)", edits: [[N, "if (!(free >= floor)) {", "if (!(free > floor)) {"]] },
  { clause: "F4.2", what: "the placeholder restored — the shipped floor no longer passes", edits: [[N, "memory_floor_mb: 1536 });", "memory_floor_mb: FLOOR_UNSET });"]] },
  { clause: "F4.3", what: "only the named placeholder refuses (a string floor passes)", edits: [[N, 'if (typeof floor !== "number" || !Number.isFinite(floor) || floor <= 0) return', "if (floor === FLOOR_UNSET) return"]] },
  { clause: "F4.3", what: "the selftest clause reverted to the placeholder assertion", edits: [[N, 'ok("a non-number floor refuses', 'ok("the shipped floor is the placeholder']] },
  { clause: "BOUND", what: "a file beyond scripts/night.mjs edited (day.mjs)", edits: [["scripts/day.mjs", "#!/usr/bin/env node\n", "#!/usr/bin/env node\n// mutant\n"]] },
  { clause: "LAST", what: "a node process naming the temp root left alive", own: true, only: "F4.1", edits: [["ci/mfac-floor/witness_mfac_floor.mjs", 'const STATE = join(COPY, "dressing-room", "state");\n', 'const STATE = join(COPY, "dressing-room", "state");\n(await import("node:child_process")).spawn(process.execPath, ["-e", "setInterval(() => {}, 2147483647)", ROOT], { detached: true, stdio: "ignore" }).unref();\n']] },
];
const ROOT = mkdtempSync(join(tmpdir(), "mfacfloor-mutants-"));
const copyOrg = (name) => {
  const d = join(ROOT, name);
  cpSync(ORG, d, { recursive: true, filter: (p) => { const r = relative(ORG, p).split(sep).join("/"); const top = r.split("/")[0]; return top !== ".git" && top !== "node_modules" && !(r === "dressing-room/state" || r.startsWith("dressing-room/state/")); } });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(d, "node_modules"), "junction");
  return d;
};
const run = (org, only, witness = WITNESS) => {
  const r = spawnSync(process.execPath, [witness, "--org", org, "--base-org", BASE, ...(only ? ["--only", only] : [])], { encoding: "utf8" });
  const lines = String(r.stdout || "").split(/\r?\n/).filter(Boolean);
  return { code: r.status, lines, last: lines[lines.length - 1] || "" };
};
const listing = () => (process.platform === "win32"
  ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true })
  : spawnSync("ps", ["-eo", "pid,args"], { encoding: "utf8" }));
const reap = () => { let n = 0; for (const l of String(listing().stdout || "").split(/\r?\n/)) { const m = /^\s*(\d+)\s+(.*)$/.exec(l); if (m && /^"?\S*node(\.exe)?"?\s/i.test(m[2]) && /mfacfloor-wit-/.test(m[2]) && Number(m[1]) !== process.pid) { try { process.kill(Number(m[1])); n++; } catch { /* gone */ } } } return n; };
let red = 0, i = 0;
for (const m of MUTANTS) {
  const d = copyOrg(`m-${i++}`);
  let applied = true;
  for (const [file, from0, to0] of m.edits) {
    const p = join(d, file), s = readFileSync(p, "utf8");
    const eol = s.includes("\r\n") ? "\r\n" : "\n";
    const from = from0.replace(/\r?\n/g, eol), to = to0.replace(/\r?\n/g, eol);
    if (s.split(from).length !== 2) { applied = false; console.log(`  mutant ${m.clause} (${m.what}) NOT APPLIED — the edit site is not unique in ${file}`); break; }
    writeFileSync(p, s.replace(from, () => to));
  }
  if (!applied) { rmSync(d, { recursive: true, force: true }); continue; }
  const r = run(d, m.only || m.clause, m.own ? join(d, "ci", "mfac-floor", "witness_mfac_floor.mjs") : WITNESS);
  const named = r.lines.find((l) => new RegExp(`^\\s+(GREEN|RED)\\s+${m.clause.replace(".", "\\.")} `).test(l)) || "";
  const ok = r.code === 1 && /^\s+RED\s/.test(named);
  if (ok) red++;
  console.log(`  mutant ${m.clause} (${m.what}): ${ok ? "RED by its clause" : "SURVIVED"} · ${named.trim().slice(0, 140) || r.last}`);
  const reaped = reap();
  if (reaped) console.log(`    (ended ${reaped} planted process(es) naming a witness temp root)`);
  rmSync(d, { recursive: true, force: true });
}
const c = run(copyOrg("control"), null);
const control = c.code === 0 && /^GREEN MFAC-FLOOR/.test(c.last);
console.log(`  control: ${c.last}`);
reap();
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(red === MUTANTS.length && control ? 0 : 1);
