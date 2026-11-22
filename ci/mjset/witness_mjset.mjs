#!/usr/bin/env node
// ============================================================================
// ci/mjset/witness_mjset.mjs — UNIT mjset · THE JUDGE THAT NEVER SETTLES: the estimator, the guard, the queue order, the kept
//   judge line, and the cost field (forks rows 1244 / 1245 / 1260 (2) / 1269)
// ----------------------------------------------------------------------------
//   node ci/mjset/witness_mjset.mjs --org <dir> --base-org <dir> [--only "<id>,…"]
// CONTRACT (judged on --org; the build reads GREEN, the base ci/mjset/BASE reads RED). The clause logic lives in ONE file,
// the clause witness ci/witness/mjset/witness_mjset.mjs (plants on copies under os.tmpdir(); its header is its contract):
// this file runs it over --org AND over --base-org, and a clause is GREEN here only when it is GREEN on --org and RED on
// --base-org — never a pass-through: a clause that also passes on the base proves nothing and reads RED here. Without
// --base-org the base leg is not run and the line says so (the clause still has to be GREEN on --org). The clause witness
// is read from this file's own repository when it is there (a seat run from a checkout), else from --org.
//   W1 SELF-BLOCK OPENS · W2 ONE-CAPTURE FLOOR · W3 A GUARD NOT A GATE · W4 NO LOOP · W5 THE ONE CARD · W6 RETRY AT THE NEXT
//   CARRIER · W7 PRE-CYBORG FATE · W8 HEAD-OF-LINE · W9 DRY TOUCHES NOTHING · W11 THE JUDGE LINE KEPT PER CARRIER · W12 SETTLED
//   NOTHING BY NAME · W13 THE COST FIELD · W14 THE FLOOR REFUSES — the clause witness's own, one line each (its header names each plant)
//   BOUND     only the named files differ between --base-org and --org (scripts/gaffer_brain.mjs · scripts/postmatch.mjs ·
//             scripts/claudegen.mjs (forks row 1279 (1), its ONE line) · ci/mtail/witness_mtail.mjs (forks row 1292 (2) (a), T4
//             re-cut in place) · ci/witness/mjset/ · ci/mjset/), by text, CRLF folded
//   LAST      no node process naming this run's temp dir survives
// THE PORT CLASS (row 1053): no port is bound, no service is named, nothing is POSTed, nothing restarts, no model is
// called (the clause witness puts a planted `claude` first on its PATH, and no judge round runs through the CLI door that
// holds the judge port). Every wait is a child's exit; the outer bound is the caller's. Runs on Windows too: no POSIX-only
// shell, every read split on \r?\n, no git repo is planted here (a repo the caller plants for --org / --base-org is made
// with core.autocrlf=false).
// LAST LINE: GREEN MJSET <what> · <n> clause(s) (exit 0) or RED MJSET · <clauses> (exit 1)
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
const UNIT = "MJSET", HERE = dirname(fileURLToPath(import.meta.url));
const NAMED = (f) => ["scripts/gaffer_brain.mjs", "scripts/postmatch.mjs", "scripts/claudegen.mjs", "ci/mtail/witness_mtail.mjs"].includes(f) || /^ci\/(witness\/mjset|mjset)\//.test(f);
const TMP = mkdtempSync(join(tmpdir(), "mjset-witness-"));
const results = [];
const record = (id, ok, why) => { if (ONLY && !ONLY.includes(id) && id !== "LAST") return; results.push({ id, ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id}${why ? ` · ${why}` : ""}`); };

const CW = [join(HERE, "..", "witness", "mjset", "witness_mjset.mjs"), join(ORG, "ci", "witness", "mjset", "witness_mjset.mjs")].find((p) => existsSync(p)) || null;
console.log(`witness mjset · org ${ORG}${BASE ? ` · base ${BASE}` : ""} · clause witness ${CW || "ABSENT"}`);
const IDS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W11", "W12", "W13", "W14"];
const want = IDS.filter((id) => !ONLY || ONLY.includes(id));
const runOn = (tree) => {
  const r = spawnSync(process.execPath, [CW, "plants", "--tree", tree, "--tmp", TMP, ...(ONLY ? ["--only", want.join(",")] : [])], { cwd: TMP, encoding: "utf8", windowsHide: true });
  const got = new Map();
  for (const l of String(r.stdout || "").split(/\r?\n/)) { const m = /^CLAUSE (\S+) (GREEN|RED)(?: · (.*))?$/.exec(l); if (m) got.set(m[1], { ok: m[2] === "GREEN", why: m[3] || "" }); }
  const tail = String(r.stdout || "").split(/\r?\n/).filter(Boolean).pop() || `(no output; exit ${r.status})`;
  return { got, tail };
};
if (!CW) for (const id of want) record(id, false, "the clause witness ci/witness/mjset/witness_mjset.mjs is in neither this checkout nor --org");
else if (want.length) {
  const head = runOn(ORG), base = BASE ? runOn(BASE) : null;
  for (const id of want) {
    const h = head.got.get(id), b = base ? base.got.get(id) : null;
    if (!h) { record(id, false, `not reported on --org (${head.tail.slice(0, 160)})`); continue; }
    if (!base) { record(id, h.ok, `org ${h.ok ? "GREEN" : "RED"} · base leg NOT RUN (no --base-org)${h.ok ? "" : ` · ${h.why.slice(0, 200)}`}`); continue; }
    if (!b) { record(id, false, `not reported on --base-org (${base.tail.slice(0, 160)})`); continue; }
    record(id, h.ok && !b.ok, `org ${h.ok ? "GREEN" : "RED"} · base ${b.ok ? "GREEN (a pass-through: the clause proves nothing)" : "RED"}${h.ok ? "" : ` · ${h.why.slice(0, 220)}`}`);
  }
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
console.log(`GREEN ${UNIT} the judge round always tries one capture (a floor never a fast observation, the guard once per round, a slow ok rate still RED), a declined capture goes behind the rest, a dry round calls nothing, the captures before his floor are set aside by a code row, every round that settles nothing says why, the day record keeps every judge try per carrier, the CLI's cost field rides the judge ledger row (null when the envelope has none), and an unreadable floor refuses the round · ${results.length} clause(s)`);
process.exit(0);
