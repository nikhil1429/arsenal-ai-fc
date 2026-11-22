#!/usr/bin/env node
// ============================================================================
// ci/mtrap/witness_mtrap.mjs — UNIT mtrap · A NOTE UNDER THE BAR OF THREE DISTINCT TRAPS IS REFUSED AT THE GATE, BY NAME,
//   WITH ITS COUNT, BEFORE ANY READER IS PAID (forks rows 1198 / 1230)
// ----------------------------------------------------------------------------
//   node ci/mtrap/witness_mtrap.mjs --org <dir> --base-org <dir> [--only "<id>,…"]
// CONTRACT (judged on --org; the build reads GREEN, the base 5301f15 reads RED). The clause logic lives in ONE file, the
// clause witness ci/witness/mtrap/witness_traps.mjs (plants on copies under os.tmpdir(); its header is its contract): this
// file runs it over --org with --base-org as its base tree, re-prints each CLAUSE line in this grammar, and adds the two
// seat-time clauses. The clause witness is read from this file's own repository when it is there (a seat run from a
// checkout), else from --org (the suite member copies only ci/mtrap/ beside it) — never a pass-through: it is always run
// over --org, so the base leg judges the base's own compiler, pacer and C22.
//   W1 THIN · W2 CLI · W3 DISTINCT · W4 BAR · W5 DOOR · W6 OLD · W7 TABLE · W8 TRUE · W9 CAPSULE · SKILL — the clause
//   witness's own, one line each (its header names each plant)
//   BOUND     only the named files differ between --base-org and --org (scripts/notes_compiler.mjs ·
//             scripts/forge_session.mjs · scripts/learnstate.mjs · .claude/skills/forge/SKILL.md ·
//             .claude/skills/learn/SKILL.md · ci/witness/mtrap/ · ci/mtrap/), by text, CRLF folded
//   LAST      no node process naming this run's temp dir survives
// THE PORT CLASS (row 1053): no port is bound, no service is named, nothing is POSTed, nothing restarts, no model is
// called (the clause witness puts a refusing `claude` / `gemini` shim first on its PATH). Every wait is a child's exit;
// the outer bound is the caller's (the suite member's derived `left`). Runs on Windows too: no POSIX-only shell, every
// read split on \r?\n, every git repo (none is planted here) would be made with core.autocrlf=false.
// LAST LINE: GREEN MTRAP <what> · <n> clause(s) (exit 0) or RED MTRAP · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, readFileSync, existsSync, rmSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const UNIT = "MTRAP", HERE = dirname(fileURLToPath(import.meta.url));
const NAMED = (f) => ["scripts/notes_compiler.mjs", "scripts/forge_session.mjs", "scripts/learnstate.mjs", ".claude/skills/forge/SKILL.md",
  ".claude/skills/learn/SKILL.md"].includes(f) || /^ci\/(witness\/mtrap|mtrap)\//.test(f);
const TMP = mkdtempSync(join(tmpdir(), "mtrap-witness-"));
const results = [];
const record = (id, ok, why) => { if (ONLY && !ONLY.includes(id) && id !== "LAST") return; results.push({ id, ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id}${why ? ` · ${why}` : ""}`); };

const CW = [join(HERE, "..", "witness", "mtrap", "witness_traps.mjs"), join(ORG, "ci", "witness", "mtrap", "witness_traps.mjs")].find((p) => existsSync(p)) || null;
console.log(`witness mtrap · org ${ORG}${BASE ? ` · base ${BASE}` : ""} · clause witness ${CW || "ABSENT"}`);
const IDS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "SKILL"];
const want = IDS.filter((id) => !ONLY || ONLY.includes(id));
if (!CW) for (const id of want) record(id, false, "the clause witness ci/witness/mtrap/witness_traps.mjs is in neither this checkout nor --org");
else if (want.length) {
  const r = spawnSync(process.execPath, [CW, "plants", "--tree", ORG, ...(BASE ? ["--base-tree", BASE] : []), "--tmp", TMP, ...(ONLY ? ["--only", want.join(",")] : [])],
    { cwd: TMP, encoding: "utf8", windowsHide: true });
  const got = new Map();
  for (const l of String(r.stdout || "").split(/\r?\n/)) { const m = /^CLAUSE (.+?) (GREEN|RED)(?: · (.*))?$/.exec(l); if (m) got.set(m[1], { ok: m[2] === "GREEN", why: m[3] || "" }); }
  const tail = String(r.stdout || "").split(/\r?\n/).filter(Boolean).pop() || `(no output; exit ${r.status})`;
  for (const id of want) { const g = got.get(id); record(id, !!g && g.ok, g ? g.why : `not reported by the clause witness (${tail.slice(0, 120)}${r.stderr ? ` · ${String(r.stderr).split(/\r?\n/)[0].slice(0, 120)}` : ""})`); }
}

const walk = (root, dir = "", o = new Map()) => {
  let ents = []; try { ents = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return o; }
  for (const e of ents) {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (!dir && (e.name === "node_modules" || e.name === ".git")) continue;
    if (e.isDirectory()) walk(root, rel, o);
    else if (e.isFile()) { const b = readFileSync(join(root, rel)); const t = b.includes(0) ? b : Buffer.from(b.toString("utf8").replace(/\r\n/g, "\n")); o.set(rel, createHash("sha256").update(t).digest("hex")); }
  }
  return o;
};
if (BASE && (!ONLY || ONLY.includes("BOUND"))) {
  const a = walk(BASE), b = walk(ORG);
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED(f));
  record("BOUND", extra.length === 0, `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 12).join(", ")}${extra.length > 12 ? ` (+${extra.length - 12})` : ""}` : ""}`);
}
try { rmSync(TMP, { recursive: true, force: true }); } catch { /* a survivor holds a file: LAST names it */ }
{
  let table = "", why = "";
  try {
    table = process.platform === "win32"
      ? execFileSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8" })
      : execFileSync("ps", ["-eo", "args"], { encoding: "utf8" });
  } catch (e) { why = `process table unreadable: ${e.message}`; }
  const left = table.split(/\r?\n/).filter((l) => l.includes(TMP) && !/\bps -eo\b/.test(l));
  record("LAST", !why && left.length === 0, why || `${left.length} survivor(s)`);
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length) { console.log(`RED ${UNIT} · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN ${UNIT} a note under the bar of three distinct traps (cracks and corrections of this lesson, by folded bait, capsule traps never counted) is refused at the gate by name with its count before any reader is paid, no row written, old verdicts read not gateable beside their kept rows, the owed count rides the pacer's axes line · ${results.length} clause(s)`);
process.exit(0);
