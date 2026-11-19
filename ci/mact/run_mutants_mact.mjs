#!/usr/bin/env node
// ============================================================================
// ci/mact/run_mutants_mact.mjs — UNIT mact · one mutant per clause of ci/mact/witness_mact.mjs
// ----------------------------------------------------------------------------
// USAGE: node ci/mact/run_mutants_mact.mjs --org <build dir> --base-org <base dir>
// CONTRACT: each mutant is a COPY of --org under os.tmpdir() (never .git, never node_modules; dressing-room/state carries only
//   the two tracked files the witness keeps) with ONE edit, read with CRLF folded to LF (row 1036). The edit's `from` must occur
//   EXACTLY once, or the mutant is NOT APPLIED and counts as surviving. The witness, run with --only <the clause that names it>,
//   must read RED on that clause. The CONTROL is the witness on the unedited --org, every clause, and must read GREEN.
//   No port, no service, no model call (the witness's own contract), no git planted. Nothing typed as a timeout.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
if (!ORG || !BASE) { console.log("run_mutants: usage --org <build> --base-org <base> · 0 of 0 mutant(s) · control RED"); process.exit(1); }
const WITNESS = join(HERE, "witness_mact.mjs");
const ROOT = mkdtempSync(join(tmpdir(), "mact-mut-"));
const slash = (p) => p.split(sep).join("/");
const KEEP = ["registry.json", "captain.json"];
const copy = (dst) => cpSync(ORG, dst, { recursive: true, filter: (p) => {
  const rel = slash(relative(ORG, p));
  if (!rel) return true;
  if ([".git", "node_modules"].includes(rel.split("/")[0])) return false;
  if (rel.startsWith("dressing-room/state/")) return KEEP.includes(rel.slice("dressing-room/state/".length));
  return true;
} });
const BASE_MINT = '`a${now.getTime().toString(36)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, "0")}`';
const MUTANTS = [
  { id: "M1", clause: "W1", file: "scripts/acts.mjs", why: "the act sequence never advances", from: "${(idSeq++).toString(36)}", to: "${(idSeq).toString(36)}" },
  { id: "M2", clause: "W2", file: "scripts/acts.mjs", why: "a validation-refused act mints without the sequence (the base shape)", from: "  const id = newId(now);\n", to: `  const id = v.ok ? newId(now) : ${BASE_MINT};\n` },
  { id: "M3", clause: "W3", file: "scripts/acts.mjs", why: "the sequence is a local of the mint (resets every call)", from: "${(idSeq++).toString(36)}", to: "${(() => { let s = 0; return s++; })().toString(36)}" },
  { id: "M4", clause: "W4", file: "scripts/acts.mjs", why: "the undo(pref) assert's guard removed (calls[10].argv on undefined throws, the base's crash line)", from: 'calls[10]?.argv?.join(" ") === "forget how_to_speak"', to: 'calls[10].argv.join(" ") === "forget how_to_speak"' },
  { id: "M5", clause: "W5", file: "scripts/acts.mjs", why: "the two-row test counts three (an id held by two rows passes)", from: "rows.filter((r) => r && r.id === id).length > 1;", to: "rows.filter((r) => r && r.id === id).length > 2;" },
  { id: "M6", clause: "W6", file: "scripts/claims.mjs", why: "the claims sequence never advances", from: "${(claimSeq++).toString(36)}", to: "${(claimSeq).toString(36)}" },
];
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const witness = (org, only) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE, ...(only ? ["--only", only] : [])], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
  return { status: r.status, out: lines(r.stdout) };
};
let killed = 0;
for (const m of MUTANTS) {
  const dir = join(ROOT, m.id); copy(dir);
  const f = join(dir, m.file), src = readFileSync(f, "utf8").replace(/\r\n/g, "\n");
  const hits = src.split(m.from).length - 1;
  if (hits !== 1) { console.log(`  SURVIVED ${m.id} (${m.clause}) · NOT APPLIED — \`from\` occurs ${hits} time(s) in ${m.file}`); rmSync(dir, { recursive: true, force: true }); continue; }
  writeFileSync(f, src.replace(m.from, () => m.to));
  const w = witness(dir, m.clause);
  const line = w.out.find((l) => new RegExp(`^\\s*(GREEN|RED)\\s+${m.clause} ·`).test(l)) || "";
  const red = /^\s*RED\s/.test(line) && w.status === 1;
  if (red) killed++;
  console.log(`  ${red ? "KILLED  " : "SURVIVED"} ${m.id} (${m.clause}) · ${m.why} · ${line.trim().slice(0, 220) || `no ${m.clause} line`} · last: ${w.out.at(-1) || ""}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = witness(ORG, null);
const ctl = c.status === 0 && /^GREEN MACT /.test(c.out.at(-1) || "");
console.log(`  CONTROL · ${c.out.at(-1) || "no line"}`);
try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* a file Windows still holds stays for the OS to reap */ }
console.log(`run_mutants: ${killed} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${ctl ? "GREEN" : "RED"}`);
process.exit(killed === MUTANTS.length && ctl ? 0 : 1);
