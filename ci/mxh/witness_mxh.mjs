#!/usr/bin/env node
// ============================================================================
// ci/mxh/witness_mxh.mjs — UNIT mxh · the sole-writer header parser (F2 + the clause rule, F6 A), Q6 SILENT
//   report-only (F5, F8 A, F11 A) and the N1 parameter mask (F12 B) — forks rows 1122 (1) / 1123 (1) / 1128 (3) / 1138 (1)
// ----------------------------------------------------------------------------
// USAGE: node ci/mxh/witness_mxh.mjs --org <dir> --base-org <dir>
//   --org       the tree to witness: its scripts/xray.mjs is judged (the build reads GREEN; the base reads RED on W1-W7)
//   --base-org  the BASE tree (ci/mxh/BASE) — BOUND needs it; absent, BOUND is RED
// CONTRACT — every plant lives under ONE os.tmpdir() root (mkdtemp; env door MXH_WITNESS_TMP moves its parent, for the mutant runner) and is removed at the end. The judged xray.mjs is
//   COPIED, never edited. dressing-room/state in every plant is an EMPTY dir: nothing of his is copied, read or printed;
//   the live copy (W6) carries --org's scripts/ and package.json only. node_modules is never copied: it rides as a link
//   (junction on Windows) from the first of --org, --base-org, this witness's own repo that holds node_modules/acorn.
//   xray's build() + queries() run in a SYNCHRONOUS child node (spawnSync: each wait is bounded by the child's own exit;
//   no timeout, budget or size is typed). No port is bound, no service named, no daemon touched or restarted, nothing
//   POSTed, no git repo planted, no model called (ANTHROPIC_API_KEY is blanked in the child). Output: paths and organ
//   names only. CRLF-proof: every plant is judged TWICE, once with LF organs and once with the same organs in CRLF, and
//   a clause is GREEN only when both agree; every line read from a process is split on \r?\n; BOUND folds CRLF to LF;
//   the process table is read through PowerShell on Windows, `ps` elsewhere (no POSIX-only shell).
// CLAUSES (spec ci/mxh/MXH_SPEC.md @ e57b893 §4, ruled by row 1138 (1)):
//   W1 boundary      `SOLE WRITER of …/w1_lane.jsonl` is declared AS .jsonl, and a planted second writer is a Q5 row
//   W2 same-line     "d2.mjs stays the sole writer of w2_lane.jsonl" in c2.mjs is NOT c2's claim; d2's own is kept
//   W3 wrapped       the two cross-line shapes (distiller.mjs:27-28, gaffer_brain.mjs:109-110) are NOT e3's claims
//   W4 nothing lost  a true claim after a `;` clause naming another organ, and after a full stop on the line above
//   W5 Q6 SILENT     a declared file with no writer is reported; a fixture path of the same basename neither hides
//                    nor fakes the state lane (every path with the basename is read)
//   W6 live          on --org's real scripts/: .jsonl declarations exist, and every Q5 row's declarer writes that file
//   W7 N1            a parameter SHADOWS a same-name module const (a destructured no-default slot, a plain parameter
//                    with no caller): no invented writer fact
//   BOUND            only scripts/xray.mjs differs from --base-org (ci/mxh/** is this unit's own output)
//   LAST             no node process naming the temp root survives
// LAST LINE: GREEN MXH <what> · <n> clause(s) (exit 0) or RED MXH · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, mkdirSync, copyFileSync, cpSync, writeFileSync, readFileSync, existsSync, symlinkSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
if (!ORG || !existsSync(join(ORG, "scripts", "xray.mjs"))) { console.log("RED MXH · USAGE (--org <dir> with scripts/xray.mjs)"); process.exit(1); }
const NAMED = ["scripts/xray.mjs"];
const OWN = "ci/mxh/";
const SKIP_TOP = new Set([".git", "node_modules"]);
const SELF_REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NM = [ORG, BASE_ORG, SELF_REPO].filter(Boolean).map((d) => join(d, "node_modules")).find((d) => existsSync(join(d, "acorn")));
const ROOT = mkdtempSync(join(process.env.MXH_WITNESS_TMP || tmpdir(), "mxh-wit-"));   // the env door: the mutant runner points it under ITS temp root
const slash = (p) => p.split(sep).join("/");
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
const SD = ["dressing-room", "state"];
const link = (dst) => symlinkSync(NM, join(dst, "node_modules"), process.platform === "win32" ? "junction" : "dir");

function plant(name, organs, eol) {
  const P = join(ROOT, name);
  mkdirSync(join(P, "scripts"), { recursive: true }); mkdirSync(join(P, ...SD), { recursive: true });
  copyFileSync(join(ORG, "scripts", "xray.mjs"), join(P, "scripts", "xray.mjs"));
  link(P);
  writeFileSync(join(P, "package.json"), JSON.stringify({ name: "mxh-plant", type: "module", scripts: {} }));
  for (const [f, src] of Object.entries(organs)) writeFileSync(join(P, "scripts", f), eol === "crlf" ? src.replace(/\r?\n/g, "\r\n") : src);
  return P;
}
let KID = 0;
function facts(P) {
  const f = join(ROOT, `child_${++KID}.mjs`);
  writeFileSync(f, `const x = await import(${JSON.stringify(pathToFileURL(join(P, "scripts", "xray.mjs")).href)});
const ir = x.build(); const q = x.queries(ir);
console.log(JSON.stringify({
  declared: ir.declared_sole_writers.map((d) => d.organ + ">" + d.file),
  writers: Object.fromEntries(ir.files.map((f) => [f.path, f.writers])),
  Q5: q.Q5.map((r) => ({ path: r.path, by: r.declared_by, und: r.undeclared })),
  Q6: q.Q6 ? q.Q6.map((r) => r.declared_by + ">" + r.file) : null,
  p7: ir.files.filter((f) => f.writers.includes("p7.mjs")).map((f) => f.path.split("/").pop()).sort() }));`);
  const r = spawnSync(process.execPath, [f], { cwd: P, encoding: "utf8", windowsHide: true, env: { ...process.env, ANTHROPIC_API_KEY: "" } });
  const last = lines(r.stdout).pop() || "";
  try { return JSON.parse(last); } catch { return { error: `exit ${r.status}: ${lines(r.stderr).slice(-1)[0] || "no JSON"}` }; }
}

const H = 'import { appendFileSync, readFileSync } from "node:fs";\nimport { join, dirname } from "node:path";\nimport { fileURLToPath } from "node:url";\nconst HERE = dirname(fileURLToPath(import.meta.url));\nconst STATE = join(HERE, "..", "dressing-room", "state");\n';
const W = (name) => `export function w_${name.replace(/\W/g, "_")}(t) { appendFileSync(join(STATE, "${name}"), t); }\n`;
const R = (name) => `export function r_${name.replace(/\W/g, "_")}() { return readFileSync(join(STATE, "${name}"), "utf8"); }\n`;
const ORGANS = {
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
  "p7.mjs": `// p7 — fixture\n${H}const path = join(STATE, "w7_shadow.jsonl");\nconst file = join(STATE, "w7b_plain.jsonl");\nexport function noDefault(t, { path } = {}) { appendFileSync(path, t); }\nexport function plainShadow(file) { appendFileSync(file, "x"); }\n`,
};

/** each clause judged on one fact set → [ok, why] */
function judge(F) {
  const has = (s) => F.declared.includes(s);
  const q5 = (p) => F.Q5.filter((r) => r.path.endsWith("/" + p));
  const q6 = F.Q6 || [];
  return {
    W1: [has("a1.mjs>w1_lane.jsonl") && q5("w1_lane.jsonl").some((r) => r.by === "a1.mjs" && r.und.includes("z1.mjs")),
      `declared a1>w1_lane.jsonl ${has("a1.mjs>w1_lane.jsonl")} · Q5 row ${q5("w1_lane.jsonl").length}`],
    W2: [has("d2.mjs>w2_lane.jsonl") && !has("c2.mjs>w2_lane.jsonl") && q5("w2_lane.jsonl").length === 0,
      `d2 ${has("d2.mjs>w2_lane.jsonl")} · c2 ${has("c2.mjs>w2_lane.jsonl")} · Q5 ${q5("w2_lane.jsonl").length}`],
    W3: [has("f3.mjs>w3_lane.jsonl") && has("f3.mjs>w3b_lane.jsonl") && !has("e3.mjs>w3_lane.jsonl") && !has("e3.mjs>w3b_lane.jsonl"),
      `f3 ${has("f3.mjs>w3_lane.jsonl")}/${has("f3.mjs>w3b_lane.jsonl")} · e3 ${has("e3.mjs>w3_lane.jsonl")}/${has("e3.mjs>w3b_lane.jsonl")}`],
    W4: [has("g4.mjs>w4_cfg.json") && has("g4.mjs>w4b_lane.jsonl"), `w4_cfg ${has("g4.mjs>w4_cfg.json")} · w4b ${has("g4.mjs>w4b_lane.jsonl")}`],
    W5: [F.Q6 !== null && q6.includes("k5.mjs>w5_silent.jsonl") && !q6.includes("m5.mjs>w5_held.jsonl"),
      F.Q6 === null ? "no Q6 in queries()" : `k5 reported ${q6.includes("k5.mjs>w5_silent.jsonl")} · m5 reported ${q6.includes("m5.mjs>w5_held.jsonl")}`],
    W7: [!F.p7.includes("w7_shadow.jsonl") && !F.p7.includes("w7b_plain.jsonl"), `p7 invented writer facts: ${F.p7.join(", ") || "none"}`],
  };
}

let threw = false;
try {
  if (!NM) {
    for (const id of ["W1", "W2", "W3", "W4", "W5", "W6", "W7"]) clause(id, false, "no node_modules/acorn under --org, --base-org or this witness's repo");
  } else {
    // ── W1-W5, W7: the plant, LF and CRLF ──────────────────────────────────────
    const sides = ["lf", "crlf"].map((eol) => ({ eol, F: facts(plant(`plant_${eol}`, ORGANS, eol)) }));
    for (const id of ["W1", "W2", "W3", "W4", "W5", "W7"]) {
      const v = sides.map(({ eol, F }) => (F.error ? [false, `${eol}: ${F.error}`] : [judge(F)[id][0], `${eol}: ${judge(F)[id][1]}`]));
      clause(id, v.every((x) => x[0]), v.map((x) => x[1]).join(" | "));
    }
    // ── W6: --org's own scripts/ with an EMPTY state ────────────────────────────
    const L = join(ROOT, "live");
    mkdirSync(join(L, ...SD), { recursive: true });
    cpSync(join(ORG, "scripts"), join(L, "scripts"), { recursive: true, filter: (p) => !/\.log$/.test(p) });
    if (existsSync(join(ORG, "package.json"))) copyFileSync(join(ORG, "package.json"), join(L, "package.json"));
    link(L);
    const G = facts(L);
    if (G.error) clause("W6", false, G.error);
    else {
      const jsonl = G.declared.filter((d) => d.endsWith(".jsonl")).length;
      const bad = G.Q5.filter((r) => !(G.writers[r.path] || []).includes(r.by));
      clause("W6", jsonl > 0 && bad.length === 0, `declared .jsonl ${jsonl} · Q5 rows ${G.Q5.length} · rows whose declarer writes nothing there ${bad.length}${bad.length ? " (" + bad.map((r) => r.by + ">" + r.path.split("/").pop()).join(", ") + ")" : ""} · Q6 ${G.Q6 === null ? "absent" : G.Q6.length}`);
    }
  }
  // ── BOUND ─────────────────────────────────────────────────────────────────────
  if (!BASE_ORG) clause("BOUND", false, "no --base-org given");
  else {
    const walk = (dir, acc = new Map(), top = dir) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name), rel = slash(relative(top, p));
        if (SKIP_TOP.has(rel.split("/")[0]) || rel.startsWith(OWN) || rel === "dressing-room/state" || rel.startsWith("dressing-room/state/") || /\.log$/.test(rel)) continue;
        const st = statSync(p);
        if (st.isDirectory()) walk(p, acc, top); else acc.set(rel, createHash("sha256").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex"));
      }
      return acc;
    };
    const a = walk(ORG), b = walk(BASE_ORG);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    clause("BOUND", extra.length === 0, `${diff.length} file(s) differ from --base-org${diff.length ? ` (${diff.slice(0, 6).join(", ")})` : ""}${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 6).join(", ")}` : ""}`);
  }
} catch (e) {
  threw = true;
  clause("WITNESS", false, `threw: ${lines(String((e && e.stack) || e)).slice(0, 3).join(" | ")}`);
}

// ── LAST ──────────────────────────────────────────────────────────────────────
{
  const listing = process.platform === "win32"
    ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" });
  const left = lines(listing.stdout).filter((l) => l.includes(ROOT) && !/\bps -eo\b/.test(l));
  rmSync(ROOT, { recursive: true, force: true });
  clause("LAST", left.length === 0 && listing.status === 0, `${left.length} node process(es) naming the temp root survive${listing.status === 0 ? "" : " · the process table could not be read"} · the temp root removed`);
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length || threw) { console.log(`RED MXH · ${red.join(" ") || "WITNESS"}`); process.exit(1); }
console.log(`GREEN MXH a sole-writer header declares only its own clause, .jsonl included, Q6 names the silent ones, a parameter shadows · ${results.length} clause(s)`);
process.exit(0);
