#!/usr/bin/env node
// ci/mpast/run_mutants.mjs — unit mpast P3: one mutant per witness clause, each applied to a COPY of the build tree under
// os.tmpdir() and witnessed against the BASE tree; each must be RED by the clause that names it; the unmutated build tree (the
// control) must be GREEN. A mutant whose anchor is not found exactly once is NOT applied and counts as not killed.
// USAGE: node ci/mpast/run_mutants.mjs --org <build tree> --base-org <BASE tree>
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 only when k = n and GREEN)
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? resolve(process.argv[i + 1]) : null; };
const ORG = arg("--org"), BASE_ORG = arg("--base-org");
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mpast.mjs");
const PM = "scripts/postmatch.mjs";
const MUTANTS = [
  { clause: "MP1", why: "his close drops the machine block below his record (L9 broken)", file: PM,
    from: "pendingBalls, matchday, dateStr }) + keptBlock(machineKept);", to: "pendingBalls, matchday, dateStr });" },
  { clause: "MP2", why: "the absence line no longer reads as closed (parseMachineRecord ignores it)", file: PM,
    from: "  if (isAbsenceClosed(t)) return null;\n", to: "" },
  { clause: "MP3", why: "a future day is no longer refused", file: PM,
    from: "if (dateStr > today) refuse(", to: "if (false) refuse(" },
  { clause: "MP4", why: "the absence line carries a legal RESULT", file: PM,
    from: "a recorded decision (never re-asked; no RESULT, no matchday)`;", to: "a recorded decision (never re-asked; no RESULT, no matchday)\\nRESULT: PARTIAL`;" },
  { clause: "MP5", why: "season.json's row appended in close order, not inserted by date", file: PM,
    from: "if (at < 0) rows.push(row); else rows.splice(at, 0, row);", to: "rows.push(row);" },
  { clause: "MP6", why: "the KAL-line asked for every day", file: PM,
    from: "const kalAsked = (closed, today) => closed === today || closed === addDays(today, -1);", to: "const kalAsked = (closed, today) => true;" },
  { clause: "MP7", why: "a na on the card closes nothing", file: PM,
    from: "if (!card || card.answer !== \"na\") return { closed: [], misses: [] };", to: "if (true) return { closed: [], misses: [] };" },
  { clause: "MB1", why: "the morning close reaches the card step", file: PM,
    from: "else if (anchor === \"evening\") card = await dayCloseCard({ day, run });", to: "else card = await dayCloseCard({ day, run });" },
  { clause: "MB2", why: "the B1 window shut: the no-kept card names its own day only", file: PM,
    from: "const from = answered && !kept && addDays(keyDayOf(answered), 1) < day ? addDays(keyDayOf(answered), 1) : day;", to: "const from = day;" },
  { clause: "MB3", why: "the kept card's reline window moved off its own key's day", file: PM,
    from: "const open = openDaysOf(kept.key.slice(DAYCLOSE_FAMILY.length + 1), day, { dir });", to: "const open = openDaysOf(addDays(day, -1), day, { dir });" },
  { clause: "MB4", why: "the days that do not fit are dropped, never counted", file: PM,
    from: "${k < ds.length ? ` +${ds.length - k} more` : \"\"}", to: "" },
  { clause: "BOUND", why: "a byte outside the two named files", file: "scripts/daykey.mjs", from: null, to: "\n// mpast mutant: a byte outside the named files\n" },
  { clause: "LAST", why: "his full time spawns claude", file: PM,
    from: "  const now = clock.at;\n", to: "  const now = clock.at;\n  try { (await import(\"node:child_process\")).spawnSync(\"claude\", [\"-p\", \"mutant\"], { shell: true, stdio: \"ignore\" }); } catch {}\n" },
];
const lastLine = (s) => String(s || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) || "";
const witness = (org) => { const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE_ORG], { encoding: "utf8", windowsHide: true }); return { status: r.status, last: lastLine(r.stdout) }; };
const ROOT = mkdtempSync(join(tmpdir(), "mpast-mut-"));
let k = 0, control = "RED";
try {
  for (const [i, m] of MUTANTS.entries()) {
    const copy = join(ROOT, `m${i}`);
    cpSync(ORG, copy, { recursive: true, filter: (p) => { const rel = relative(ORG, p).split(sep).join("/"); return !(rel === "node_modules" || rel === ".git"); } });
    const f = join(copy, m.file), src = readFileSync(f, "utf8");
    if (m.from != null && src.split(m.from).length !== 2) { console.log(`  MISS ${m.clause} · the mutant's anchor is not in ${m.file} exactly once — not applied`); continue; }
    writeFileSync(f, m.from == null ? src + m.to : src.split(m.from).join(m.to));
    const w = witness(copy);
    const reds = /^RED MPAST · (.*)$/.exec(w.last);
    const ok = w.status === 1 && !!reds && reds[1].split(/\s+/).includes(m.clause);
    if (ok) k++;
    console.log(`  ${ok ? "RED by name" : "NOT KILLED "} ${m.clause} · ${m.why} · witness exit ${w.status} · ${w.last}`);
    rmSync(copy, { recursive: true, force: true });
  }
  const c = witness(ORG);
  control = c.status === 0 && /^GREEN MPAST /.test(c.last) ? "GREEN" : "RED";
  console.log(`  control · the build tree unmutated · witness exit ${c.status} · ${c.last}`);
} finally { try { rmSync(ROOT, { recursive: true, force: true }); } catch {} }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control}`);
process.exitCode = k === MUTANTS.length && control === "GREEN" ? 0 : 1;
