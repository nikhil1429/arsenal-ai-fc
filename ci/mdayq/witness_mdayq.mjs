#!/usr/bin/env node
// ============================================================================
// ci/mdayq/witness_mdayq.mjs — UNIT mdayq · TWO COLD QUESTIONS AT HIS DAY END, BANKED, THEN THE CLOSE (forks rows 1241 /
//   1242 / 1257; base ci/mdayq/BASE — the mbank build tip f635d68, PROVISIONAL by row 1269)
// ----------------------------------------------------------------------------
//   node ci/mdayq/witness_mdayq.mjs --org <dir> --base-org <dir> [--only "<id>,…"]
// CONTRACT (judged on --org; the build reads GREEN, the base reads RED). The clause logic lives in ONE file, the clause
// witness ci/witness/mdayq/witness_dayq.mjs (plants on copies under os.tmpdir(); its header is its contract): this file runs
// it over --org AND over --base-org, and a clause is GREEN here only when it is GREEN on --org and RED on --base-org — never
// a pass-through: a clause that also passes on the base proves nothing and reads RED here. Without --base-org the base leg
// is not run and the line says so (the clause still has to be GREEN on --org). The clause witness is read from this file's
// own repository when it is there (a seat run from a checkout), else from --org.
//   W1 KIND · W2 FENCE · W3 DUE (spec W6 carried inside it) · W4 ROW · W5 AXIS · W5L LOCK · W7 SKIP · W8 ORDER ·
//   W9 ANSWERED · W10 LEFT · W14 NOSESS · W15 CONT · W16 CLOSED · W17 READFAIL (the last three by row 1280 (2) / (3) /
//   (5)) — the clause witness's own, one line each (its header names each plant)
//   W11       SEAT (judged on --org only): every model spawn the plants drew was the refusing shim's, no API key in the env
//   BOUND     only the named files differ between --base-org and --org (scripts/forge_session.mjs · scripts/study_scope.mjs ·
//             scripts/teaching_gate.mjs · scripts/gaffer_brain.mjs · scripts/day.mjs · .claude/skills/learn/SKILL.md ·
//             .claude/skills/forge/SKILL.md · ci/witness/mdayq/ · ci/mdayq/), by text, CRLF folded
//   LAST      no node process naming this run's temp dir survives
// THE PORT CLASS (row 1053): no fixed port is bound, no service is named, nothing is POSTed, nothing restarts, no model is
// called (the clause witness puts a refusing `claude` / `gemini` shim first on its PATH and hands the sitting an ephemeral
// port nothing listens on). Every wait is a child's exit; the outer bound is the caller's. Runs on Windows too: no POSIX-only
// shell, every read split on \r?\n, no git repo is planted here (a repo the caller plants for --org / --base-org is made
// with core.autocrlf=false).
// LAST LINE: GREEN MDAYQ <what> · <n> clause(s) (exit 0) or RED MDAYQ · <clauses> (exit 1)
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
const UNIT = "MDAYQ", HERE = dirname(fileURLToPath(import.meta.url));
const NAMED = (f) => ["scripts/forge_session.mjs", "scripts/study_scope.mjs", "scripts/teaching_gate.mjs", "scripts/gaffer_brain.mjs", "scripts/day.mjs",
  ".claude/skills/learn/SKILL.md", ".claude/skills/forge/SKILL.md"].includes(f) || /^ci\/(witness\/mdayq|mdayq)\//.test(f);
const TMP = mkdtempSync(join(tmpdir(), "mdayq-witness-"));
const results = [];
const record = (id, ok, why) => { if (ONLY && !ONLY.includes(id) && id !== "LAST") return; results.push({ id, ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id}${why ? ` · ${why}` : ""}`); };

const CW = [join(HERE, "..", "witness", "mdayq", "witness_dayq.mjs"), join(ORG, "ci", "witness", "mdayq", "witness_dayq.mjs")].find((p) => existsSync(p)) || null;
console.log(`witness mdayq · org ${ORG}${BASE ? ` · base ${BASE}` : ""} · clause witness ${CW || "ABSENT"}`);
const IDS = ["W1", "W2", "W3", "W4", "W5", "W5L", "W7", "W8", "W9", "W10", "W14", "W15", "W16", "W17"];
const want = IDS.filter((id) => !ONLY || ONLY.includes(id));
const runOn = (tree) => {
  const r = spawnSync(process.execPath, [CW, "plants", "--tree", tree, "--tmp", TMP, ...(ONLY ? ["--only", want.join(",")] : [])], { cwd: TMP, encoding: "utf8", windowsHide: true });
  const got = new Map(); let seat = null;
  for (const l of String(r.stdout || "").split(/\r?\n/)) {
    const m = /^CLAUSE (.+?) (GREEN|RED)(?: · (.*))?$/.exec(l); if (m) got.set(m[1], { ok: m[2] === "GREEN", why: m[3] || "" });
    const s = /^SEAT W11 (GREEN|RED) · (.*)$/.exec(l); if (s) seat = { ok: s[1] === "GREEN", why: s[2] };
  }
  const tail = String(r.stdout || "").split(/\r?\n/).filter(Boolean).pop() || `(no output; exit ${r.status})`;
  return { got, seat, tail };
};
if (!CW) for (const id of want) record(id, false, "the clause witness ci/witness/mdayq/witness_dayq.mjs is in neither this checkout nor --org");
else {
  const head = runOn(ORG), base = BASE && want.length ? runOn(BASE) : null;
  for (const id of want) {
    const h = head.got.get(id), b = base ? base.got.get(id) : null;
    if (!h) { record(id, false, `not reported on --org (${head.tail.slice(0, 120)})`); continue; }
    if (!base) { record(id, h.ok, `org ${h.ok ? "GREEN" : "RED"} · base leg NOT RUN (no --base-org)${h.ok ? "" : ` · ${h.why.slice(0, 160)}`}`); continue; }
    if (!b) { record(id, false, `not reported on --base-org (${base.tail.slice(0, 120)})`); continue; }
    record(id, h.ok && !b.ok, `org ${h.ok ? "GREEN" : "RED"} · base ${b.ok ? "GREEN (a pass-through: the clause proves nothing)" : "RED"}${h.ok ? "" : ` · ${h.why.slice(0, 160)}`}`);
  }
  if (!ONLY || ONLY.includes("W11")) record("W11", !!(head.seat && head.seat.ok), head.seat ? `seat, org only · ${head.seat.why}` : `the clause witness printed no SEAT W11 line (${head.tail.slice(0, 120)})`);
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
console.log(`GREEN ${UNIT} the day end asks the two day-close questions by code before it closes, the bank keeps them as moment day_close rows that pay neither the axis-done gate nor the LOCK's negative-space count, and the close judges them · ${results.length} clause(s)`);
process.exit(0);
