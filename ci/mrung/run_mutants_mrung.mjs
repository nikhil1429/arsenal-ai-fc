#!/usr/bin/env node
// ============================================================================
// ci/mrung/run_mutants_mrung.mjs — UNIT mrung · one mutant per witness clause (spec ci/mrung/MRUNG_SPEC.md §7, + M13 for W13, + M14 for G3 — ruling forks row 1130 (1))
// ----------------------------------------------------------------------------
// USAGE: node ci/mrung/run_mutants_mrung.mjs --org <build dir> --base-org <base dir>
// CONTRACT — each mutant is a COPY of --org under os.tmpdir() (its tracked and untracked-not-ignored files; never .git, never
//   node_modules — a link; never dressing-room/state) with ONE exact replacement in ONE named file (the anchor must occur
//   EXACTLY once, or the mutant is RED as unappliable). The witness then runs on it with --only <the clause the mutant names>;
//   a mutant is KILLED iff the witness exits 1 AND its last line names that clause. The control is the unmutated copy, every
//   clause: it must read GREEN. Nothing here binds a port, names a service, or calls a model; every child is a bounded spawnSync
//   of the witness, which bounds its own children.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync, statSync, symlinkSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const flag = (k) => { const i = argv.indexOf(k); return i > -1 ? argv[i + 1] : null; };
const ORG = flag("--org") ? resolve(flag("--org")) : null, BASE = flag("--base-org") ? resolve(flag("--base-org")) : null;
if (!ORG || !BASE) { console.log("run_mutants: 0 of 0 mutant(s) RED by the clause that names them · control RED (--org and --base-org are both required)"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mrung.mjs");

const MUTANTS = [
  { id: "M1", clause: "W1", file: "scripts/done.mjs", from: "  const plan = readPlan(campaign);\n", to: "  if (hand) return rungsLegacy(campaign, flag(\"--meter\") ? resolve(flag(\"--meter\")) : METER);\n  const plan = readPlan(campaign);\n" },
  { id: "M2", clause: "W2", file: "scripts/done.mjs", from: "if (!plan.clauses.length) return { read: false, hand, why: \"UNREAD (the plan v3 list holds no clause)\" };", to: "if (!plan.clauses.length) return { read: true, n: 0, g: 0, u: 0, r: 0, x: 0, hand, lg: 0, ln: 0, not: [], lnot: [], chain: \"holds\" };" },
  { id: "M3", clause: "W3", file: "scripts/rung_receipt.mjs", from: "const mine = rr.rows.filter((x) => x.row && x.row.key === key);\n  if (!mine.length) return { word: \"UNREAD\", why: \"no receipt\" };", to: "const mine = rr.rows.filter((x) => x.row && x.row.key === key);\n  if (!mine.length) return { word: \"RED\", why: \"no receipt\" };" },
  { id: "M4", clause: "W4", file: "scripts/rung_receipt.mjs", from: "head_sha: head, exit: r.exit, out_sha256: r.out_sha256 });", to: "head_sha: head, exit: 1, out_sha256: r.out_sha256 });" },
  { id: "M5", clause: "W5", file: "scripts/rung_receipt.mjs", from: "if (r.exit === 0) return", to: "if (false) return" },
  { id: "M6", clause: "W6", file: "scripts/rung_receipt.mjs", from: "if (!VERBS[verb].includes(k)) return", to: "if (!VERBS[verb].includes(k)) continue; if (false) return" },
  { id: "M7", clause: "W7", file: "scripts/day.mjs", from: "const full = rows.filter((r) => r.reason === \"fulltime\");", to: "const full = rows;" },
  { id: "M8", clause: "W8", file: "scripts/rung_receipt.mjs", from: "  const r = runWitness(w.argv);\n  const after = fileSha(meterPath);", to: "  const after = fileSha(meterPath);\n  const r = runWitness(w.argv);" },
  { id: "M9", clause: "W9", file: "scripts/rung_receipt.mjs", from: "const ok = brokenAt < 0 && r && typeof r === \"object\" && r.prev_sha256 === prev && r.row_sha256 === rowSha(r);", to: "const ok = !!r;" },
  { id: "M10", clause: "W10", file: "scripts/rung_receipt.mjs", from: "if (head === red.head_sha) return", to: "if (false) return" },
  { id: "M11", clause: "W11", file: "scripts/done.mjs", from: "const read = receiptsText !== undefined;", to: "const read = receiptsText !== undefined && !HERMETIC;" },
  { id: "M12", clause: "W12", file: "scripts/done.mjs", from: "import { readFileSync, readdirSync, existsSync } from \"node:fs\";", to: "import { readFileSync, readdirSync, existsSync, appendFileSync } from \"node:fs\";\nexport const touchReceipts = () => appendFileSync(RECEIPTS, \"\");" },
  { id: "M14", clause: "G3", file: "scripts/rung_receipt.mjs", from: "const LOOP_ROLES = Object.keys(LOOP_FLAGS);", to: "const LOOP_ROLES = [\"sheet\", \"page\", \"acts\", \"ladder\"];" },
  { id: "M13", clause: "W13", file: "scripts/rung_receipt.mjs", from: "head_sha: head, exit: r.exit, out_sha256: r.out_sha256 });", to: "head_sha: head, exit: r.exit, out_sha256: r.out_sha256, last_line: r.last });" },
];

const listed = (() => {
  const r = spawnSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: ORG, encoding: "utf8" });
  if (r.status !== 0) { console.log("run_mutants: 0 of 0 mutant(s) RED by the clause that names them · control RED (--org is not a git work tree)"); process.exit(1); }
  return r.stdout.split("\0").filter(Boolean).filter((rel) => !rel.startsWith("dressing-room/state/") && !rel.startsWith("node_modules/"));
})();
const copy = (name) => {
  const d = mkdtempSync(join(tmpdir(), `mrung-mutant-${name}-`));
  for (const rel of listed) { const s = join(ORG, rel); if (!existsSync(s) || statSync(s).isDirectory()) continue; mkdirSync(dirname(join(d, rel)), { recursive: true }); copyFileSync(s, join(d, rel)); }
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(d, "node_modules"), "junction");
  return d;
};
const witness = (org, only) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE, ...(only ? ["--only", only] : [])], { encoding: "utf8", windowsHide: true });
  const last = `${r.stdout || ""}`.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) || "";
  return { code: r.status, last };
};

let killed = 0;
for (const m of MUTANTS) {
  const d = copy(m.id);
  try {
    const p = join(d, m.file), src = readFileSync(p, "utf8"), n = src.split(m.from).length - 1;
    if (n !== 1) { console.log(`  ${m.id} ${m.clause} · NOT APPLIED (anchor found ${n} time(s) in ${m.file})`); continue; }
    writeFileSync(p, src.replace(m.from, m.to));
    const w = witness(d, m.clause);
    const ok = w.code === 1 && new RegExp(`^RED MRUNG · .*\\b${m.clause}\\b`).test(w.last);
    if (ok) killed++;
    console.log(`  ${m.id} ${m.clause} · ${ok ? "KILLED" : "SURVIVED"} · ${w.last.slice(0, 160)}`);
  } finally { rmSync(d, { recursive: true, force: true }); }
}
const c = copy("control");
let control;
try { control = witness(c, null); } finally { rmSync(c, { recursive: true, force: true }); }
const cOk = control.code === 0 && /^GREEN MRUNG /.test(control.last);
console.log(`  control · ${control.last.slice(0, 160)}`);
console.log(`run_mutants: ${killed} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cOk ? "GREEN" : "RED"}`);
process.exit(killed === MUTANTS.length && cOk ? 0 : 1);
