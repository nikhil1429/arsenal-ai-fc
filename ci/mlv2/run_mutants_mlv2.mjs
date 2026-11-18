#!/usr/bin/env node
// ci/mlv2/run_mutants_mlv2.mjs --org <build dir> --base-org <base dir>
// One mutant per witness clause: each is a COPY of --org under os.tmpdir() with ONE edit, and the witness must read
// RED on the clause that names it. The control (the copy, unedited) must read GREEN. The state dir rides as a byte
// copy made by this script (never printed); node_modules rides as a link. Nothing under --org is written.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = resolve(arg("--base-org") || ".");
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mlv2.mjs");
const MUTANTS = [
  { clause: "C1", file: "scripts/cortex.mjs", from: "idle: () => inflight.size === 0 && !exiting,", to: "idle: () => false,", what: "the worker never reads itself idle (it never retires)" },
  { clause: "C2", file: "scripts/cortex.mjs", from: "idle: () => inflight.size === 0 && !exiting,", to: "idle: () => !exiting,", what: "the idle predicate ignores a lane in flight" },
  { clause: "C3", file: "scripts/cortex.mjs", from: "retirer = await retireWhenIdle({ name: \"cortex\",", to: "retirer = await retireWhenIdle({ judge: async () => false, name: \"cortex\",", what: "cortex's retire stops reading the judge port" },
  { clause: "K5", file: "scripts/cortex.mjs", from: "      try { lock.close(); } catch { }\n      process.exit(KEEP_EXIT.RETIRED);", to: "      try { lock.close(); } catch { }\n      process.exit(0);", what: "the restart door exits clean again (the K5 hole)" },
  { clause: "XML", file: "scripts/daemon_watchdog.mjs", from: 'args: ["scripts/cortex.mjs"]', to: 'args: ["scripts/cortex.mjs", "daemon-worker"]', what: "the service arguments change shape (a reinstall by his hand)" },
];
const ROOT = mkdtempSync(join(tmpdir(), "mlv2-mutants-"));
const copyOrg = (name) => {
  const d = join(ROOT, name);
  for (const p of [["scripts"], ["setup"], ["package.json"], ["dressing-room", "state"]]) if (existsSync(join(ORG, ...p))) cpSync(join(ORG, ...p), join(d, ...p), { recursive: true, filter: (s) => !/\.log$/.test(s) });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(d, "node_modules"), "junction");
  return d;
};
const run = (org) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE], { encoding: "utf8" });
  const lines = String(r.stdout || "").split(/\r?\n/).filter(Boolean);
  return { code: r.status, lines, last: lines[lines.length - 1] || "" };
};
let red = 0;
for (const m of MUTANTS) {
  const d = copyOrg(`m-${m.clause}`);
  const p = join(d, m.file), s = readFileSync(p, "utf8");
  // CRLF-PROOF (architect class note, 18 Nov 2026): a checkout under core.autocrlf=true has CRLF lines, so a
  // multi-line edit site is matched in the file's OWN line ending, never assumed LF
  const eol = s.includes("\r\n") ? "\r\n" : "\n";
  m.from = m.from.replace(/\r?\n/g, eol); m.to = m.to.replace(/\r?\n/g, eol);
  if (s.split(m.from).length !== 2) { console.log(`  MUTANT ${m.clause} NOT APPLIED — the edit site is not unique in ${m.file}`); continue; }
  writeFileSync(p, s.replace(m.from, m.to));
  const r = run(d);
  const named = r.lines.find((l) => new RegExp(`^\\s+(GREEN|RED)\\s+${m.clause} `).test(l)) || "";
  const ok = r.code === 1 && /^\s+RED\s/.test(named);
  if (ok) red++;
  console.log(`  mutant ${m.clause} (${m.what}): ${ok ? "RED by its clause" : "SURVIVED"} · ${r.last}`);
}
const c = run(copyOrg("control"));
const control = c.code === 0 && /^GREEN MLV2/.test(c.last);
console.log(`  control: ${c.last}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(red === MUTANTS.length && control ? 0 : 1);
