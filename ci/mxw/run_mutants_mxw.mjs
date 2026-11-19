#!/usr/bin/env node
// ci/mxw/run_mutants_mxw.mjs --org <build dir> --base-org <base dir>
// One mutant per witness clause (the spec's M1-M4 at e4013cb §6, plus one for each clause the build added): each is a COPY
// of --org under os.tmpdir() with ONE edit, and the witness, run with --only <that clause>, must read RED on the clause that
// names it. The control (the copy, unedited) runs the WHOLE witness and must read GREEN. The edit site is matched in the
// file's OWN line ending (CRLF-proof) and must be unique, or the mutant is NOT APPLIED and counts as surviving. A mutant
// marked `own` edits the witness and is judged by the edited copy. No git is planted; no port, service or model is touched.
// Nothing under --org is written; node_modules rides as a link; the state dir is not copied (the witness plants its own).
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = resolve(arg("--base-org") || ".");
const HERE = dirname(fileURLToPath(import.meta.url));
const SLOTS_OBJ = 'p.type === "ObjectPattern" ? p.properties.filter((q) => q.type === "Property" && q.value.type === "AssignmentPattern" && q.value.left.type === "Identifier").map((q) => [q.value.left.name, q.value.right]) : [];';
const MUTANTS = [
  { clause: "W1", file: "scripts/xray.mjs", what: "M1 seedDefaults back to identifier-only (= base)",
    from: "      for (const p of fn.params) for (const [name, right] of slots(p)) {", to: '      for (const p of fn.params) for (const [name, right] of (p.type === "AssignmentPattern" && p.left.type === "Identifier" ? [[p.left.name, p.right]] : [])) {' },
  { clause: "W2", file: "scripts/xray.mjs", what: "M3 a bare ObjectPattern is read, the `= {}` AssignmentPattern(ObjectPattern) is not unwrapped",
    from: '        : p.type === "AssignmentPattern" && p.left.type === "ObjectPattern" ? slots(p.left)\n', to: "" },
  { clause: "W3", file: "scripts/xray.mjs", what: "M4 a property with no default inherits the bag's last default (a slot invented)",
    from: SLOTS_OBJ, to: 'p.type === "ObjectPattern" ? p.properties.filter((q) => q.type === "Property").map((q, i, a) => { const d = [...a].reverse().find((z) => z.value.type === "AssignmentPattern"); return q.value.type === "AssignmentPattern" ? [q.value.left.name, q.value.right] : d && q.value.type === "Identifier" ? [q.value.name, d.value.right] : null; }).filter(Boolean) : [];' },
  { clause: "W4", file: "scripts/xray.mjs", what: "M2 slots() loses its `p = X` arm",
    from: '      const slots = (p) => p.type === "AssignmentPattern" && p.left.type === "Identifier" ? [[p.left.name, p.right]]\n        : p.type', to: "      const slots = (p) => p.type" },
  { clause: "W5", file: "scripts/notes_corrections.mjs", what: "the real writer's default moved into the body (a shape the F1 A reader does not claim)",
    from: 'export function add(p = {}, { path = LEDGER, now = new Date(), by = "cli" } = {}) {', to: 'export function add(p = {}, opts = {}) { const { path = LEDGER, now = new Date(), by = "cli" } = opts;' },
  { clause: "W6", file: "scripts/notes_corrections.mjs", what: "a SECOND writer of brief_log.jsonl through an options-bag default (Q2 + Q5 grow)",
    from: 'export function add(p = {}, { path = LEDGER, now = new Date(), by = "cli" } = {}) {', to: 'export function mxwSecond(t, { dir = join(__dirname, "..", "dressing-room", "state") } = {}) { appendFileSync(join(dir, "brief_log.jsonl"), t); }\nexport function add(p = {}, { path = LEDGER, now = new Date(), by = "cli" } = {}) {' },
  { clause: "BOUND", file: "CLAUDE.md", what: "a file beyond the named ones differs", from: "# CLAUDE.md — Arsenal AI FC", to: "# CLAUDE.md — Arsenal AI FC (mutant)" },
  { clause: "LAST", file: "ci/mxw/witness_mxw.mjs", own: true, what: "a child naming the temp root left alive at the sweep (it dies with the witness's stdin pipe)",
    from: "  const left = survivors();", to: '  spawn(NODE, ["-e", "process.stdin.resume()", T], { stdio: ["pipe", "ignore", "ignore"] });\n  const left = survivors();' },
  { clause: "LAST", file: "ci/mxw/witness_mxw.mjs", own: true, what: "(its import) spawn joins the child_process import", once: true,
    from: 'import { spawnSync } from "node:child_process";', to: 'import { spawnSync, spawn } from "node:child_process";' },
];

const T = mkdtempSync(join(tmpdir(), "mxw-mutants-"));
const nm = [join(ORG, "node_modules"), join(HERE, "..", "..", "node_modules")].find((p) => existsSync(join(p, "acorn")));
function copyOrg(name) {
  const to = join(T, name);
  const SD = "dressing-room/state";
  cpSync(ORG, to, { recursive: true, filter: (s) => { const r = relative(ORG, s).split(sep).join("/"); return !(r === ".git" || r.startsWith(".git/") || r === "node_modules" || r.startsWith("node_modules/") || r.startsWith(SD + "/")); } });
  mkdirSync(join(to, ...SD.split("/")), { recursive: true });
  if (nm) symlinkSync(nm, join(to, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return to;
}
/** apply one edit in the file's own line ending; null when the site is absent or not unique */
function edit(root, m) {
  const f = join(root, m.file);
  if (!existsSync(f)) return `${m.file} absent`;
  const src = readFileSync(f, "utf8"), crlf = src.includes("\r\n");
  const from = crlf ? m.from.replace(/\n/g, "\r\n") : m.from, to = crlf ? m.to.replace(/\n/g, "\r\n") : m.to;
  const n = src.split(from).length - 1;
  if (n !== 1) return `edit site found ${n} time(s) in ${m.file}`;
  writeFileSync(f, src.replace(from, () => to));
  return null;
}
const lastOf = (r) => String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
function witness(root, only) {
  const args = [join(root, "ci", "mxw", "witness_mxw.mjs"), "--org", root, "--base-org", BASE];
  if (only) args.push("--only", only);
  return spawnSync(process.execPath, args, { encoding: "utf8", windowsHide: true });
}

let killed = 0, n = 0;
const groups = [];
for (const m of MUTANTS) { if (m.once && groups.length) groups[groups.length - 1].push(m); else groups.push([m]); }
try {
  groups.forEach((g, i) => {
    n++;
    const root = copyOrg(`m${i}`);
    const bad = g.map((m) => edit(root, m)).find(Boolean);
    const m = g[0];
    if (bad) { console.log(`  SURVIVED ${m.clause} · ${m.what} — NOT APPLIED: ${bad}`); return; }
    const r = witness(root, m.clause), last = lastOf(r);
    const red = new RegExp(`^RED MXW · (.*)$`).exec(last);
    const ok = r.status === 1 && red && red[1].split(/\s+/).includes(m.clause);
    if (ok) killed++;
    console.log(`  ${ok ? "KILLED  " : "SURVIVED"} ${m.clause} · ${m.what} — ${last}`);
    rmSync(root, { recursive: true, force: true });
  });
  const c = witness(copyOrg("control"), null), cl = lastOf(c);
  const cOk = c.status === 0 && /^GREEN MXW /.test(cl);
  console.log(`  control — ${cl}`);
  console.log(`run_mutants: ${killed} of ${n} mutant(s) RED by the clause that names them · control ${cOk ? "GREEN" : "RED"}`);
  process.exitCode = killed === n && cOk ? 0 : 1;
} finally { rmSync(T, { recursive: true, force: true }); }
