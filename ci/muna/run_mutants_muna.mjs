#!/usr/bin/env node
// ci/muna/run_mutants_muna.mjs — unit muna · ONE MUTANT PER WITNESS CLAUSE. Header = contract.
// USAGE: node ci/muna/run_mutants_muna.mjs --org <build tree>
//   Plants, under os.tmpdir(), a tree holding the build's scripts/land.mjs and scripts/muna.mjs; judges the UNMUTATED tree
//   first (the control: every clause GREEN), then for each mutant plants a fresh tree, applies ONE exact text edit to
//   scripts/muna.mjs (it refuses if the anchor is not found exactly once: a mutant that does not apply is not a mutant)
//   and judges it with the witness's own clause; the mutant counts only if the clause that names it reads RED.
//   No port, no service, no live state, no model call; the temp root is removed and no process naming it may survive.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED  (exit 0 iff k = n and GREEN)
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CLAUSES, survivors, cleanup } from "./witness_muna.mjs";

const F = "scripts/muna.mjs";
const LAND_CALL = "const r = child(argv, door.land_cwd || ROOT);";
const MUTANTS = [
  { clause: "U1", why: "the landing command is never run (a LANDED line printed without it)", from: LAND_CALL, to: 'const r = { code: 0, out: "", lines: ["LANDED " + pick.unit], last: "LANDED " + pick.unit };' },
  { clause: "U2", why: "every land ref is treated as adopted", from: "(a.go ? cand : refused)", to: "(true ? cand : refused)" },
  { clause: "U2b", why: "the gate is asked by unit only (today's sha-blind gate)", from: '[...door.gate, unit, "--sha", sha]', to: "[...door.gate, unit]" },
  { clause: "U3", why: "a NONE leg reads as green", from: 'green: v === "GREEN" && r.code === 0', to: 'green: v !== "RED"' },
  { clause: "U4", why: "a wait of the verb (a refusal no human must resolve) is carded", from: 'if (row && row.human && name !== "PUSH-REJECTED") c = card(', to: 'if (name !== "PUSH-REJECTED") c = card(' },
  { clause: "U5", why: "a tip whose parent is not origin main is picked (muna would act on a re-cut)", from: "if (ps.length === 1 && ps[0] === O) {", to: "if (ps.length === 1) {" },
  { clause: "U6", why: "a stacked tip is never named STACKED", from: 'shas.has(ps[0]) ? "STACKED" : "RE-CUT"', to: 'false ? "STACKED" : "RE-CUT"' },
  { clause: "U7", why: "the stop card's key loses its sha (one stop is no longer one key)", from: "`muna:stop:${pick.unit}:${pick.sha.slice(0, 12)}:${name}`", to: "`muna:stop:${pick.unit}:${name}`" },
  { clause: "U8", why: "muna cards the publish refusal the verb already carded", from: '&& name !== "PUSH-REJECTED")', to: "&& true)" },
  { clause: "U9", why: "the verb's count is ignored", from: 'if (!lic.ok) return say("STAND-DOWN"', to: 'if (false) return say("STAND-DOWN"' },
  { clause: "U10", why: "a hand-only refusal of the gate is reinterpreted as GO", from: "return { go: r.code === 0, row", to: "return { go: r.code === 0 || /hand-only/.test(r.last), row" },
  { clause: "U11", why: "muna runs the verb itself instead of the door's landing command", from: LAND_CALL, to: 'const r = nodeScript("land.mjs", [pick.unit, "--names-gate", names]);' },
  { clause: "U12", why: "the API-key refusal is dropped", from: "if (process.env.ANTHROPIC_API_KEY) {", to: "if (false) {" },
  { clause: "U13", why: "an absent names result does not leave the tip", from: "if (!existsSync(names)) {", to: "if (false) {" },
  { clause: "U14", why: "a landing with acts files no card", from: "if (acts) c = card(", to: "if (false) c = card(" },
];

const argv = process.argv.slice(2);
const org = argv.includes("--org") ? argv[argv.indexOf("--org") + 1] : null;
if (!org) { console.log("usage: node ci/muna/run_mutants_muna.mjs --org <build tree>"); process.exit(2); }
const root = mkdtempSync(join(tmpdir(), "muna-mutants-"));
const plant = (muna) => { const d = mkdtempSync(join(root, "t-")); mkdirSync(join(d, "scripts")); writeFileSync(join(d, "scripts", "land.mjs"), readFileSync(join(org, "scripts", "land.mjs"))); writeFileSync(join(d, F), muna); return d; };
const base = readFileSync(join(org, F), "utf8");
let k = 0, control = false;
try {
  const t0 = plant(base);
  const v0 = Object.fromEntries(Object.entries(CLAUSES).map(([c, fn]) => [c, fn(t0).ok]));
  control = Object.values(v0).every(Boolean);
  console.log(`control · ${Object.entries(v0).map(([c, ok]) => `${c} ${ok ? "GREEN" : "RED"}`).join(" · ")}`);
  for (const m of MUTANTS) {
    const hits = base.split(m.from).length - 1;
    if (hits !== 1) { console.log(`mutant ${m.clause} · NOT APPLIED (anchor found ${hits} time(s)) — ${m.why}`); continue; }
    const v = CLAUSES[m.clause](plant(base.replace(m.from, m.to)));
    if (!v.ok) k++;
    console.log(`mutant ${m.clause} · ${v.ok ? "SURVIVED" : "RED"} by its clause (${String(v.why).slice(0, 120)}) — ${m.why}`);
  }
} finally {
  const live = survivors() + survivors(root);
  if (live) { console.log(`LAST · ${live} process(es) name the temp dir`); control = false; }
  cleanup();
  try { rmSync(root, { recursive: true, force: true }); } catch { /* a lock is litter, not a verdict */ }
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && control ? 0 : 1);
