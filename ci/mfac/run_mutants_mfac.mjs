#!/usr/bin/env node
// ci/mfac/run_mutants_mfac.mjs --org <build dir> --base-org <base dir>
// One mutant per witness clause (the spec's μ list, re-read through the rulings of row 1069): each is a COPY of --org under
// os.tmpdir() with its edit(s), and the witness, run with --only <that clause>, must read RED on the clause that names it.
// The control (the copy, unedited) runs the WHOLE witness and must read GREEN. Every edit site is matched in the file's OWN
// line ending (core.autocrlf) and must be unique, or the mutant is NOT APPLIED and counts as surviving. A mutant marked
// `own` edits the witness and is judged by the edited copy. No git is planted; nothing under --org is written; node_modules
// rides as a link; the state dir is not copied (the witness plants its own). No mutant executes a ref move: the W3.2 edit
// adds an UNCALLED function. LAST: the process table is read for any node process naming a witness temp root of this run,
// and each one is ended (the LAST mutant plants exactly one).
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = resolve(arg("--base-org") || ".");
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mfac.mjs");
const N = "scripts/night.mjs", DAY = "scripts/day.mjs";
const MUTANTS = [
  { clause: "F4", what: "the floor typed from a live reading instead of the refusing placeholder", edits: [[N, "export const NIGHT_CONFIG = Object.freeze({ memory_floor_mb: FLOOR_UNSET });", "export const NIGHT_CONFIG = Object.freeze({ memory_floor_mb: Math.floor(freemem() / 1048576) });"]] },
  { clause: "W1.1", what: "μ1.1 the day end's step 5a dropped", edits: [[DAY, 'const night = await ownerRun("night.mjs", ["arm", "--day", D, "--by", "day.end"]);', 'const night = { status: 0, stdout: "night: (mutant) not armed", stderr: "" };']] },
  { clause: "W1.2", what: "μ1.2 the already path arms (and the organ forgets it was armed)", edits: [
    [N, 'if (rows().some((r) => r.kind === "armed" && r.day === day)) return', "if (false) return"],
    [DAY, "    return { ok: true, already: true, code: 0, lines:", '    await ownerRun("night.mjs", ["arm", "--day", D, "--by", "day.end"]);\n    return { ok: true, already: true, code: 0, lines:']] },
  { clause: "W1.3", what: "μ1.3 wait exits 0 unconditionally", edits: [[N, 'const n = await waitFor(o, { since: opt("--since") });', 'const n = { day: "now" };']] },
  { clause: "W1.4", what: "μ1.4 any hand arms (the evening close too)", edits: [[N, 'if (by !== "day.end") return', "if (!by) return"]] },
  { clause: "W1.5", what: "μ1.5 the organ gains a claude spawn to check", edits: [[N, "/** the hold: resolves", '// mutant\nconst CHECK = () => spawnSync("claude", ["-p", "check"]); void CHECK;\n/** the hold: resolves']] },
  { clause: "W2.1", what: "the begun check inverted (a begun night is refused)", edits: [[N, "    if (!n.begun) return { code: 1, out: \"NO not-begun", "    if (n.begun) return { code: 1, out: \"NO not-begun"]] },
  { clause: "W2.2", what: "μ2.1 may ignores the sitting", edits: [[N, "if (sittingOpen()) return", "if (false) return"]] },
  { clause: "W2.3", what: "may forgets to ask for an armed night", edits: [[N, '    if (!n) return { code: 1, out: "NO not-armed', '    if (false) return { code: 1, out: "NO not-armed']] },
  { clause: "W2.4", what: "μ2.3 may --act land takes the launch road", edits: [[N, 'if (act === "land") return', 'if (act === "never") return']] },
  { clause: "W3.1", what: "a landed mark accepted at night", edits: [[N, 'if (kind === "landed") return', 'if (kind === "never") return'], [N, '["launch", "return", "land-ready", "fork", "red"]', '["launch", "return", "land-ready", "fork", "red", "landed"]']] },
  { clause: "W3.2", what: "μ3.1 / μ6.1 the organ gains a ref move (an uncalled function — never executed)", edits: [[N, "/** the hold: resolves", '// mutant\nconst sendNight = () => spawnSync("git", ["push"]); void sendNight;\n/** the hold: resolves']] },
  { clause: "W4.1", what: "μ4.1 may ignores stopped rows", edits: [[N, "    if (n.stopped) return { code: 1, out: `NO stopped:", "    if (false) return { code: 1, out: `NO stopped:"]] },
  { clause: "W4.2", what: "μ4.2 the memory compare inverted", edits: [[N, "if (!(free >= floor)) {", "if (free >= floor && !(free >= floor)) {"]] },
  { clause: "W4.3", what: "μ4.3 a red mark not counted", edits: [[N, 'if (kind === "red" && !n.stopped) append(', "if (false) append("], [N, '    if (n.reds) return { code: 1, out: "NO red" };\n', ""]] },
  { clause: "W4.4", what: "μ4.4 a fork mark stops the whole night", edits: [[N, 'if (kind === "red" && !n.stopped) append({ day: n.day, kind: "stopped", reason: "red"', 'if ((kind === "red" || kind === "fork") && !n.stopped) append({ day: n.day, kind: "stopped", reason: "red"']] },
  { clause: "W4.5", what: "the learn start does not close the night", edits: [[DAY, "  const night = await closeNight();", "  const night = null;"]] },
  { clause: "W5.1", what: "μ5.1 one line per mark, and the start prints every line the close gives", edits: [[DAY, 'return n.stdout.split(/\\r?\\n/).find((l) => l.startsWith("NIGHT ")) || null;', 'return n.stdout.split(/\\r?\\n/).filter((l) => l.trim()).join("\\n") || null;'], [N, "  return { code: 0, out: lineOf(nightOf(rows())) };", "  return { code: 0, out: [lineOf(nightOf(rows())), ...n.marks.map((m) => `NIGHT mark ${m.mark}`)].join(\"\\n\") };"]] },
  { clause: "W5.2", what: "μ5.2 the card filed without its key", edits: [[N, '"file", "--key", key, "--line"', '"file", "--line"']] },
  { clause: "W5.3", what: "μ5.3 a card always filed", edits: [[N, "if (waitingFor > 0) card =", "if (waitingFor >= 0) card ="]] },
  { clause: "W5.4", what: "μ5.4 a line printed when nothing was armed", edits: [[N, 'if (!n) return { code: 0, out: "" };', 'if (!n) return { code: 0, out: "NIGHT none: never armed" };']] },
  { clause: "W5.5", what: "a row carries a words field", edits: [[N, 'append({ day, kind: "armed", by });', 'append({ day, kind: "armed", by, words: "planted" });']] },
  { clause: "W6.2", what: "μ6.2 the line skips launch marks", edits: [[N, 'launched: count("launch")', "launched: 0"]] },
  { clause: "W7", what: "FORK 1 undone: night.mjs selftest leaves the package.json suite", edits: [["package.json", " && node scripts/night.mjs selftest\"", "\""]] },
  { clause: "W8", what: "the runner skill loses THE NIGHT section's land ceiling", edits: [[".claude/skills/runner/SKILL.md", "**Never land at night**", "**Land when ready**"]] },
  { clause: "W9", what: "the merge drops mpool's pool call from the start", edits: [[DAY, "${rolled}${poolNote} · the day ends", "${rolled} · the day ends"]] },
  { clause: "BOUND", what: "a file beyond the named ones edited (land.mjs)", edits: [["scripts/land.mjs", "#!/usr/bin/env node\n", "#!/usr/bin/env node\n// mutant\n"]] },
  { clause: "LAST", what: "a node process naming the temp root left alive", own: true, only: "W1.3", edits: [["ci/mfac/witness_mfac.mjs", "    kids.push(w);\n", '    kids.push(w);\n    spawn(process.execPath, ["-e", "setInterval(() => {}, 2147483647)", ROOT], { detached: true, stdio: "ignore" }).unref();\n']] },
];
const ROOT = mkdtempSync(join(tmpdir(), "mfac-mutants-"));
const copyOrg = (name) => {
  const d = join(ROOT, name);
  cpSync(ORG, d, { recursive: true, filter: (p) => { const r = relative(ORG, p).split(sep).join("/"); const top = r.split("/")[0]; return top !== ".git" && top !== "node_modules" && !(r === "dressing-room/state" || r.startsWith("dressing-room/state/")); } });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(d, "node_modules"), "junction");
  return d;
};
const run = (org, only, witness = WITNESS) => {
  const r = spawnSync(process.execPath, [witness, "--org", org, "--base-org", BASE, ...(only ? ["--only", only] : [])], { encoding: "utf8" });
  const lines = String(r.stdout || "").split(/\r?\n/).filter(Boolean);
  return { code: r.status, lines, last: lines[lines.length - 1] || "" };
};
const listing = () => (process.platform === "win32"
  ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true })
  : spawnSync("ps", ["-eo", "pid,args"], { encoding: "utf8" }));
const reap = () => { let n = 0; for (const l of String(listing().stdout || "").split(/\r?\n/)) { const m = /^\s*(\d+)\s+(.*)$/.exec(l); if (m && /^"?\S*node(\.exe)?"?\s/i.test(m[2]) && /mfac-wit-/.test(m[2]) && Number(m[1]) !== process.pid) { try { process.kill(Number(m[1])); n++; } catch { /* gone */ } } } return n; };
let red = 0;
for (const m of MUTANTS) {
  const d = copyOrg(`m-${m.clause}`);
  let applied = true;
  for (const [file, from0, to0] of m.edits) {
    const p = join(d, file), s = readFileSync(p, "utf8");
    const eol = s.includes("\r\n") ? "\r\n" : "\n";
    const from = from0.replace(/\r?\n/g, eol), to = to0.replace(/\r?\n/g, eol);
    if (s.split(from).length !== 2) { applied = false; console.log(`  mutant ${m.clause} NOT APPLIED — the edit site is not unique in ${file}`); break; }
    writeFileSync(p, s.replace(from, () => to));
  }
  if (!applied) { rmSync(d, { recursive: true, force: true }); continue; }
  const r = run(d, m.only || m.clause, m.own ? join(d, "ci", "mfac", "witness_mfac.mjs") : WITNESS);
  const named = r.lines.find((l) => new RegExp(`^\\s+(GREEN|RED)\\s+${m.clause.replace(".", "\\.")} `).test(l)) || "";
  const ok = r.code === 1 && /^\s+RED\s/.test(named);
  if (ok) red++;
  console.log(`  mutant ${m.clause} (${m.what}): ${ok ? "RED by its clause" : "SURVIVED"} · ${named.trim().slice(0, 140) || r.last}`);
  const reaped = reap();
  if (reaped) console.log(`    (ended ${reaped} planted process(es) naming a witness temp root)`);
  rmSync(d, { recursive: true, force: true });
}
const c = run(copyOrg("control"), null);
const control = c.code === 0 && /^GREEN MFAC/.test(c.last);
console.log(`  control: ${c.last}`);
reap();
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(red === MUTANTS.length && control ? 0 : 1);
