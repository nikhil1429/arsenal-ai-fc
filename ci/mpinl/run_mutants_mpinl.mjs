#!/usr/bin/env node
// ci/mpinl/run_mutants_mpinl.mjs --org <build dir> --base-org <base dir> [--modules <dir>]
// One mutant per witness clause: each is a COPY of --org under os.tmpdir() (no .git, no node_modules — the witness links its
// own) with ONE edit, and the witness, run with --only <that clause>, must read RED on the clause that names it. The control
// (the copy, unedited) runs the WHOLE witness and must read GREEN. An edit site is matched in the file's OWN line ending
// (core.autocrlf, row 1036) and must be unique, or the mutant is NOT APPLIED and counts as surviving. A mutant marked `own`
// edits the witness copy and is judged by that edited witness. Every child is bounded by WITNESS_TIMEOUT_MS read from its
// owner (scripts/rung_receipt.mjs), never typed. Nothing under --org is written.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = resolve(arg("--base-org") || ".");
const MODS = arg("--modules") ? resolve(arg("--modules")) : null;
const WITNESS_REL = "ci/mpinl/witness_mpinl.mjs";
const { WITNESS_TIMEOUT_MS } = await import(pathToFileURL(join(BASE, "scripts", "rung_receipt.mjs")).href);
// a witness run is several bounded children in a row: the runner bounds it by the witness bound times (mutants + 1).
// The copy keeps the state dir so BOUND compares like with like; its content is never read here or printed.
const LAW = "scripts/lawpack.mjs";
const MUTANTS = [
  { clause: "W1", file: LAW, from: '    "own-literal-pin": olp.findings.length,\n', to: "", what: "the key dropped from counts" },
  { clause: "W1u", file: LAW, from: '"own-source-pin-unresolved": olp.unresolved.length,', to: '"own-source-pin-unresolved": olp.unresolved.length + olp.ownAssert.length,', what: "the unresolved key also counts the listed own-assert" },
  { clause: "W2", file: LAW, from: "  for (const [k, b] of Object.entries(base)) {", to: '  for (const [k, b] of Object.entries(base).filter(([k0]) => k0 !== "own-literal-pin")) {', what: "judge() skips the key" },
  { clause: "W2u", file: LAW, from: 'else if (waived(raw, p.line, "own-literal-pin")) declared.push(p);', to: "else declared.push(p);", what: "every unresolved site read as waived" },
  { clause: "W3", file: LAW, from: "if (!kit.acorn || !kit.walk) return { live: false,", to: "if (!kit.acorn || !kit.walk) return { live: true,", what: "the dead branch returns a live 0" },
  { clause: "W4 BOUND", file: LAW, re: /"own-literal-pin": (\d+),\n  "own-source-pin-unresolved"/, to: (m) => `"own-literal-pin": ${Number(m[1]) + 1},\n  "own-source-pin-unresolved"`, what: "the baseline typed one higher than the tree's read" },
  { clause: "W5", file: LAW, from: "    if (olpReadFile(node)) return", to: "    if (node.type === \"CallExpression\" && node.arguments && node.arguments.length && olpSelfPath(node.arguments[0], own, selfIds)) return { a: 0, b: src.length, drop: null };\n    if (olpReadFile(node)) return", what: "range() treats any call on a self path as the whole file" },
  { clause: "W6", file: LAW, from: 'return under !== "unresolved" && !under.drop && drop && f.arguments.length === 1 ? { a: under.a, b: under.b, drop } : "unresolved";', to: "return null;", what: "the comment filter read as not-self" },
  { clause: "F7 BOUND", file: LAW, from: 'export function ownLiteralPins({ root = ROOT, dirs = ["scripts", "hooks"],', to: 'export function ownLiteralPins({ root = ROOT, dirs = ["scripts"],', what: "the walk loses hooks/" },
  // forks row 1316 (1): the nine rows of ci/mpinl/AMENDMENT_1315.md §3 (V1-V3 · P1a/P1b · G3a/G3b · L1 here; L2 is "W4 BOUND" above)
  { clause: "V1", file: "scripts/ci_verdict.mjs", from: "const baseline = head && head.lawpack && base && (!base.lawpack || Object.keys(head.lawpack).some((k) => !(k in base.lawpack))) ? await frozenBaseline() : null;", to: "const baseline = head && head.lawpack && base && !base.lawpack ? await frozenBaseline() : null;", what: "R2 reverted: the baseline loaded only when the base printed no line" },
  { clause: "V2", file: "scripts/ci_verdict.mjs", from: "const b = baseLp && law in baseLp ? baseLp[law] : baseline && Number.isSafeInteger(baseline[law]) ? baseline[law] : 0;", to: "const b = baseline && Number.isSafeInteger(baseline[law]) ? baseline[law] : baseLp && law in baseLp ? baseLp[law] : 0;", what: "R1 prefers the baseline over the base's own count" },
  { clause: "V3", file: "scripts/ci_verdict.mjs", from: "const b = baseLp && law in baseLp ? baseLp[law] : baseline && Number.isSafeInteger(baseline[law]) ? baseline[law] : 0;", to: "const b = baseLp && law in baseLp ? baseLp[law] : baseline && Number.isSafeInteger(baseline[law]) ? baseline[law] : h;", what: "the fallback becomes the head's own count" },
  { clause: "P1a", file: "ci/mlaw/witness_mlaw.mjs", from: "o.n[k] > (k in b.n ? b.n[k] : bornOf(k))", to: "o.n[k] > (b.n[k] ?? 0)", what: "mlaw :195 back to ?? 0" },
  { clause: "P1b", file: "ci/mlaw/witness_mlaw.mjs", from: "tables && Object.keys(BB).every((k) => BO[k] === BB[k]) && ", to: "tables && ", what: "mlaw's per-key equality dropped" },
  { clause: "G3a", file: "ci/mrung/witness_mrung.mjs", from: "(k in b.c ? a.c[k] > b.c[k] : a.c[k] > bornOf(k))", to: "(!(k in b.c) || a.c[k] > b.c[k])", what: "mrung :288 back to !(k in b.c) ||" },
  { clause: "G3b", file: "ci/mrung/witness_mrung.mjs", from: "Number.isSafeInteger(TA[k]) ? TA[k] : 0);", to: "Number.isSafeInteger(TA[k]) ? a.c[k] : 0);", what: "bornOf returns the --org count" },
  { clause: "L1", file: LAW, from: "    reds.push(`NEW LAW ${k}", to: "    if (false) reds.push(`NEW LAW ${k}", what: "the ratchet forgives a count with no BASELINE key" },
  { clause: "BOUND", file: "scripts/xray.mjs", from: "#!/usr/bin/env node\n", to: "#!/usr/bin/env node\n// mutant: a byte beyond the named files\n", what: "a file beyond the named set edited" },
  { clause: "LAST", file: WITNESS_REL, own: true, from: "  // LAST — no node process naming the temp root survives (listed, killed if found, and RED)\n", to: "  // LAST — no node process naming the temp root survives (listed, killed if found, and RED)\n  spawn(process.execPath, [\"-e\", `setTimeout(() => {}, ${BOUND_MS})`, ROOT], { detached: true, stdio: \"ignore\" }).unref();\n", extra: [{ from: 'import { spawnSync } from "node:child_process";', to: 'import { spawnSync, spawn } from "node:child_process";' }], what: "the witness leaves a node child naming the temp root" },
];

function copy() {
  const d = mkdtempSync(join(tmpdir(), "mpinl-m-"));
  cpSync(ORG, d, { recursive: true, filter: (s) => { const r = relative(ORG, s).split(sep).join("/"); return !(r === ".git" || r.startsWith(".git/") || r === "node_modules" || r.startsWith("node_modules/")); } });
  return d;
}
function edit(text, from, to) {
  const crlf = text.includes("\r\n");
  const f = crlf ? from.replace(/\n/g, "\r\n") : from, t = crlf ? to.replace(/\n/g, "\r\n") : to;
  return text.split(f).length === 2 ? text.replace(f, () => t) : null;
}
function apply(dir, mu) {
  const p = join(dir, mu.file);
  if (!existsSync(p)) return false;
  let s = readFileSync(p, "utf8");
  if (mu.re) { const m = mu.re.exec(s.replace(/\r\n/g, "\n")); if (!m || s.includes("\r\n")) return false; s = s.replace(mu.re, () => mu.to(m)); }
  else { s = edit(s, mu.from, mu.to); if (s === null) return false; }
  for (const x of mu.extra || []) { s = edit(s, x.from, x.to); if (s === null) return false; }
  writeFileSync(p, s);
  return true;
}
function witness(dir, only, ownWitness) {
  const w = ownWitness ? join(dir, WITNESS_REL) : join(dirname(fileURLToPath(import.meta.url)), "witness_mpinl.mjs");
  const args = [w, "--org", dir, "--base-org", BASE, ...(MODS ? ["--modules", MODS] : []), ...(only ? ["--only", only] : [])];
  const r = spawnSync(process.execPath, args, { encoding: "utf8", timeout: WITNESS_TIMEOUT_MS * (MUTANTS.length + 1), maxBuffer: 64 * 1024 * 1024, windowsHide: true });
  const out = (r.stdout || "").split(/\r?\n/).filter(Boolean);
  return { last: out[out.length - 1] || `(no output; ${r.error ? r.error.code : r.signal})`, out };
}

let k = 0;
const PICK = process.argv.includes("--pick") ? new Set(process.argv[process.argv.indexOf("--pick") + 1].split(",")) : null;
for (const mu of MUTANTS.filter((m) => !PICK || PICK.has(m.clause))) {
  const d = copy();
  try {
    if (!apply(d, mu)) { console.log(`  SURVIVED ${mu.clause} · ${mu.what} — NOT APPLIED (edit site not unique or absent)`); continue; }
    const r = witness(d, mu.clause, mu.own);
    const red = /^RED MPINL · /.test(r.last) && r.last.replace(/^RED MPINL · /, "").split(", ").includes(mu.clause);
    if (red) k++;
    console.log(`  ${red ? "KILLED  " : "SURVIVED"} ${mu.clause} · ${mu.what} → ${r.last}`);
  } finally { rmSync(d, { recursive: true, force: true }); }
}
const cd = copy();
let control;
try { control = witness(cd, null, false); } finally { rmSync(cd, { recursive: true, force: true }); }
const cg = /^GREEN MPINL /.test(control.last);
console.log(`  control → ${control.last}`);
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cg ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && cg ? 0 : 1);
