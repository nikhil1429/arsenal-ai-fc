#!/usr/bin/env node
// ============================================================================
// ci/mxh/witness/witness_mxh.mjs — UNIT mxh · the sole-writer header parser (F2) + Q6 SILENT (F5)
// ----------------------------------------------------------------------------
// USAGE: node ci/mxh/witness/witness_mxh.mjs --xray <xray.mjs to judge> --tree <a tree with node_modules/acorn>
//          [--live]   also run W6 on a copy of --tree's scripts/ with the judged xray.mjs swapped in
// CONTRACT: every plant lives under os.tmpdir() (mkdtemp) and is removed at the end; the judged file is COPIED,
//   never edited; dressing-room/state in every plant is an EMPTY dir (nothing of his is copied or printed); xray's
//   build() + queries() run in a synchronous child node (spawnSync: each wait bounded by the child's own exit, no
//   timeout typed); no port bound, no service named, no daemon touched, no model called.
// CLAUSES (ci/mxh/MXH_SPEC.md §4):
//   W1 boundary  `SOLE WRITER of …/w1_lane.jsonl` is declared AS .jsonl, and a planted second writer is a Q5 row
//   W2 same-line prose  "d2.mjs stays the sole writer of w2_lane.jsonl" in c2.mjs is NOT c2's claim; d2's own is
//   W3 wrapped prose  the two cross-line shapes (distiller.mjs:27-28, gaffer_brain.mjs:109-110) are NOT e3's claims
//   W4 nothing lost  a true claim after a `;` clause naming another organ, and after a full stop on the line above
//   W5 Q6 SILENT  a declared file with no writer is reported; a selftest fixture path of the same basename neither
//                 hides nor fakes the state lane (every path with the basename is read)
//   W6 live  on the real scripts/: declarations of .jsonl exist, and every Q5 row's declarer is itself a writer
// LAST LINE: GREEN MXH · <n> clause(s) (exit 0) or RED MXH · <ids> (exit 1)
// ============================================================================
import { mkdtempSync, mkdirSync, copyFileSync, cpSync, writeFileSync, existsSync, symlinkSync, rmSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const XRAY = arg("--xray") && resolve(arg("--xray")), TREE = arg("--tree") && resolve(arg("--tree"));
const LIVE = process.argv.includes("--live");
const T = mkdtempSync(join(tmpdir(), "mxh-witness-"));
const results = [];
const clause = (id, ok, why = "") => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id}${why ? " — " + why : ""}`); };
const SD = ["dressing-room", "state"];

function tree(name, organs) {
  const P = join(T, name);
  mkdirSync(join(P, "scripts"), { recursive: true }); mkdirSync(join(P, ...SD), { recursive: true });
  copyFileSync(XRAY, join(P, "scripts", "xray.mjs"));
  symlinkSync(join(TREE, "node_modules"), join(P, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  writeFileSync(join(P, "package.json"), JSON.stringify({ name: "mxh-plant", type: "module", scripts: {} }));
  for (const [f, src] of Object.entries(organs)) writeFileSync(join(P, "scripts", f), src);
  return P;
}
function facts(P) {
  const f = join(T, `child_${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(f, `const x = await import(${JSON.stringify(pathToFileURL(join(P, "scripts", "xray.mjs")).href)});
const ir = x.build(); const q = x.queries(ir);
console.log(JSON.stringify({
  declared: ir.declared_sole_writers.map((d) => d.organ + ">" + d.file),
  writers: Object.fromEntries(ir.files.map((f) => [f.path, f.writers])),
  Q5: q.Q5.map((r) => ({ path: r.path, by: r.declared_by, und: r.undeclared })),
  Q6: q.Q6 ? q.Q6.map((r) => r.declared_by + ">" + r.file) : null }));`);
  const r = spawnSync(process.execPath, [f], { cwd: P, encoding: "utf8", windowsHide: true, env: { ...process.env, ANTHROPIC_API_KEY: "" } });
  const last = String(r.stdout || "").split(/\r?\n/).filter((s) => s.trim()).pop() || "";
  try { return JSON.parse(last); } catch { return { error: `exit ${r.status}: ${String(r.stderr || "").split(/\r?\n/).filter(Boolean).slice(-1)[0] || "no JSON"}` }; }
}
const H = 'import { appendFileSync, readFileSync } from "node:fs";\nimport { join, dirname } from "node:path";\nimport { fileURLToPath } from "node:url";\nconst HERE = dirname(fileURLToPath(import.meta.url));\nconst STATE = join(HERE, "..", "dressing-room", "state");\n';
const W = (name) => `export function w_${name.replace(/\W/g, "_")}(t) { appendFileSync(join(STATE, "${name}"), t); }\n`;
const R = (name) => `export function r_${name.replace(/\W/g, "_")}() { return readFileSync(join(STATE, "${name}"), "utf8"); }\n`;

if (!XRAY || !existsSync(XRAY) || !TREE || !existsSync(join(TREE, "node_modules", "acorn"))) {
  console.log("RED MXH · usage: --xray <file> --tree <dir with node_modules/acorn>"); process.exit(1);
}

// ── PLANT W1–W5 (one tree, fixture organs only) ──────────────────────────────
const P = tree("plant", {
  "a1.mjs": `// a1 — fixture\n//   SOLE WRITER of dressing-room/state/w1_lane.jsonl (append-only)\n${H}${W("w1_lane.jsonl")}`,
  "z1.mjs": `// z1 — fixture: a planted SECOND writer of a1's lane\n${H}${W("w1_lane.jsonl")}`,
  "c2.mjs": `// c2 — fixture\n// THE ROAD, READ: d2.mjs stays the sole writer of w2_lane.jsonl, and c2 only reads it.\n${H}${R("w2_lane.jsonl")}`,
  "d2.mjs": `// d2 — fixture\n//   SOLE WRITER of dressing-room/state/w2_lane.jsonl\n${H}${W("w2_lane.jsonl")}`,
  "e3.mjs": `// e3 — fixture\n// the shared tail reader owned by f3.mjs (the ledger's\n// sole writer). w3_lane.jsonl rolls monthly, so e3 reads every month.\n// the JUDGE hands each verdict to f3.mjs through its own CLI,\n// because that organ is the sole writer of w3b_lane.jsonl and derives the rest.\n${H}${R("w3_lane.jsonl")}${R("w3b_lane.jsonl")}`,
  "f3.mjs": `// f3 — fixture\n//   SOLE WRITER of dressing-room/state/w3_lane.jsonl and w3b_lane.jsonl\n${H}${W("w3_lane.jsonl")}${W("w3b_lane.jsonl")}`,
  "g4.mjs": `// g4 — fixture\n//   a tank names a ROLE, and its model is READ through h4.mjs at read time;\n//   \`config migrate\` is the SOLE WRITER of w4_cfg.json.\n// the import below is h4.mjs's reader, nothing more.\n// A8 — SOLE WRITER of dressing-room/state/w4b_lane.jsonl, the re-lock ledger\n${H}${W("w4_cfg.json")}${W("w4b_lane.jsonl")}`,
  "h4.mjs": `// h4 — fixture\n${H}`,
  "k5.mjs": `// k5 — fixture\n//   SOLE WRITER of dressing-room/state/w5_silent.jsonl (declared, never written)\n${H}`,
  "m5.mjs": `// m5 — fixture\n//   SOLE WRITER of dressing-room/state/w5_held.jsonl\n${H}${W("w5_held.jsonl")}`,
  "n5.mjs": `// n5 — fixture: a selftest path of the SAME basename, read, never written\n${H}export function fx() { return readFileSync(join(HERE, "w5_held.jsonl"), "utf8"); }\n`,
});
const F = facts(P);
if (F.error) for (const id of ["W1", "W2", "W3", "W4", "W5"]) clause(id, false, F.error);
else {
  const has = (s) => F.declared.includes(s);
  const q5 = (p) => F.Q5.filter((r) => r.path.endsWith("/" + p));
  clause("W1", has("a1.mjs>w1_lane.jsonl") && q5("w1_lane.jsonl").some((r) => r.by === "a1.mjs" && r.und.includes("z1.mjs")),
    `declared a1>w1_lane.jsonl ${has("a1.mjs>w1_lane.jsonl")} · Q5 row ${q5("w1_lane.jsonl").length}`);
  clause("W2", has("d2.mjs>w2_lane.jsonl") && !has("c2.mjs>w2_lane.jsonl") && q5("w2_lane.jsonl").length === 0,
    `d2 ${has("d2.mjs>w2_lane.jsonl")} · c2 ${has("c2.mjs>w2_lane.jsonl")} · Q5 ${q5("w2_lane.jsonl").length}`);
  clause("W3", has("f3.mjs>w3_lane.jsonl") && has("f3.mjs>w3b_lane.jsonl") && !has("e3.mjs>w3_lane.jsonl") && !has("e3.mjs>w3b_lane.jsonl"),
    `f3 ${has("f3.mjs>w3_lane.jsonl")}/${has("f3.mjs>w3b_lane.jsonl")} · e3 ${has("e3.mjs>w3_lane.jsonl")}/${has("e3.mjs>w3b_lane.jsonl")}`);
  clause("W4", has("g4.mjs>w4_cfg.json") && has("g4.mjs>w4b_lane.jsonl"),
    `w4_cfg ${has("g4.mjs>w4_cfg.json")} · w4b ${has("g4.mjs>w4b_lane.jsonl")}`);
  const q6 = F.Q6 || [];
  clause("W5", F.Q6 !== null && q6.includes("k5.mjs>w5_silent.jsonl") && !q6.includes("m5.mjs>w5_held.jsonl"),
    F.Q6 === null ? "no Q6 in queries()" : `k5 ${q6.includes("k5.mjs>w5_silent.jsonl")} · m5 ${q6.includes("m5.mjs>w5_held.jsonl")}`);
}

// ── LIVE W6 ──────────────────────────────────────────────────────────────────
if (LIVE) {
  const L = join(T, "live");
  mkdirSync(join(L, ...SD), { recursive: true });
  cpSync(join(TREE, "scripts"), join(L, "scripts"), { recursive: true });
  copyFileSync(XRAY, join(L, "scripts", "xray.mjs"));
  for (const f of ["package.json"]) if (existsSync(join(TREE, f))) copyFileSync(join(TREE, f), join(L, f));
  symlinkSync(join(TREE, "node_modules"), join(L, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const G = facts(L);
  if (G.error) clause("W6", false, G.error);
  else {
    const jsonl = G.declared.filter((d) => d.endsWith(".jsonl")).length;
    const bad = G.Q5.filter((r) => !(G.writers[r.path] || []).includes(r.by));
    clause("W6", jsonl > 0 && bad.length === 0, `declared .jsonl ${jsonl} · Q5 rows whose declarer writes nothing there ${bad.length}${bad.length ? " (" + bad.map((r) => r.by + ">" + r.path.split("/").pop()).join(", ") + ")" : ""}`);
  }
}

rmSync(T, { recursive: true, force: true });
const red = results.filter((r) => !r.ok).map((r) => r.id);
console.log(red.length ? `RED MXH · ${red.join(" ")}` : `GREEN MXH · ${results.length} clause(s)`);
process.exit(red.length ? 1 : 0);
