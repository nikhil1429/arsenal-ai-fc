#!/usr/bin/env node
// ci/mday/run_mutants_mday.mjs --org <build dir> --base-org <base dir>
// One mutant per witness clause (the spec's μ list, plus one for each clause the rulings added): each is a COPY of --org under
// os.tmpdir() with ONE edit, and the witness, run with --only <that clause>, must read RED on the clause that names it. The
// control (the copy, unedited) runs the WHOLE witness and must read GREEN. The edit site is matched in the file's OWN line
// ending (core.autocrlf, row 1036) and must be unique (a mutant marked `own` edits the witness and is judged by the edited copy), or the mutant is NOT APPLIED and counts as surviving. No git is planted.
// Nothing under --org is written; node_modules rides as a link; the state dir is not copied (the witness plants its own).
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = resolve(arg("--base-org") || ".");
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mday.mjs");
const MUTANTS = [
  { clause: "F4", file: "scripts/day.mjs", from: 'Object.freeze({ file: "scorer.mjs", on: Object.freeze(["answer"]) }),', to: 'Object.freeze({ file: "scorer.mjs", on: Object.freeze(["end", "answer"]) }),', what: "a non-idempotent organ promoted to run at end" },
  { clause: "W1.1", file: "scripts/turn_hook.mjs", from: '  if (learnCommandOf(typeof opts.stdin === "string" ? opts.stdin : "")) await runOrgan("day.mjs", "start", { ...opts, call: "hookMain", extraArgs: ["--by", "hook:prompt"] }, r);\n', to: "", what: "μ1.1 the prompt hook's day start dropped" },
  { clause: "W1.2", file: "scripts/sitting.mjs", from: "  if (S && (S.closed_at || !S.id)) S = null;", to: "  S = null;", what: "μ1.2 an open always creates (no JOIN)" },
  { clause: "W1.3", file: "scripts/sitting.mjs", from: "      bindHost(env_session);   // G0: the session that runs `open` now is the study session", to: "      // (mutant: no rebind)", what: "μ1.3 a JOIN keeps the first host" },
  { clause: "W1.4", file: "scripts/turn_hook.mjs", from: "return /^\\/learn(?![\\w-])/.test(t)", to: "return /\\/learn(?![\\w-])/.test(t)", what: "μ1.4 /learn matched anywhere in the prompt" },
  { clause: "W2.1", file: "scripts/day.mjs", from: "  await closeSitting();\n  await machineHalf();", to: "  await machineHalf();\n  await closeSitting();", what: "μ2.1 steps 2 and 3 swapped" },
  { clause: "W2.2", file: "scripts/day.mjs", from: 'if (!isOpen(s) && s && s.close_reason === "fulltime" && dayOf(s.closed_at) === D) {', to: "if (false) {", what: "μ2.2 the owner's already-stamp not read" },
  { clause: "W2.3", file: "scripts/day.mjs", from: "if (isOpen(s) && s.host_session_id && s.host_session_id !== envSession) {", to: "if (false) {", what: "μ2.3 the scope guard dropped" },
  { clause: "W2.4", file: ".claude/skills/learn/SKILL.md", from: "5. Day end — when HE means", to: "5. Day end: `node scripts/gaffer_brain.mjs judge-round` → when HE means", what: "μ2.4 the prose judge-round left in place" },
  { clause: "W2.5", file: "scripts/day.mjs", from: "const HANDOFF = ", to: "const HIS_END = /end the day|bas/i; void HIS_END;\nconst HANDOFF = ", what: "μ2.5 a matcher of his words added" },
  { clause: "W3.1", file: "scripts/day.mjs", from: "  await closeSitting();\n  await machineHalf();", to: "  await closeSitting();\n  if (!process.env.MDAY_HIS_ANSWER) return { ok: false, code: 1, lines: [\"day: waiting on his answer\"] };\n  await machineHalf();", what: "μ3.1 the end awaits his answer before the machine half" },
  { clause: "W3.2", file: "scripts/postmatch.mjs", from: "const keptBlock = (machine) => (machine ? `\\n${MACHINE_KEPT}\\n${machine}` : \"\");", to: "const keptBlock = () => \"\";", what: "μ3.2 the answer rewrites (drops) the machine record" },
  { clause: "W4.1", file: "scripts/sitting.mjs", from: "    if (session) { const h = d.host({ session, transcript, by }); if (!h.ok) return h; }\n    return d.open({ surface, task, route, env_session: session });", to: "    return d.open({ surface, task, route, env_session: null });", what: "μ4.1 the local open leaves the host null" },
  { clause: "W4.3", file: "scripts/postmatch.mjs", from: "const CLOSED_BY_RE = /^CLOSED-BY: code · (evening|morning|close) anchor · (\\S+)$/m;", to: "const CLOSED_BY_RE = /^CLOSED-BY: code · (evening|morning) anchor · (\\S+)$/m;", what: "μ4.2 the close anchor not counted as a close" },
  { clause: "W5.1", file: "scripts/day.mjs", from: '  const deal = await ownerRun("captains_call.mjs", ["deal"]);\n  const card =', to: '  const deal = await ownerRun("captains_call.mjs", ["status"]);\n  const card =', what: "μ5.1 the end prints status, not the deal" },
  { clause: "W5.2", file: "scripts/day.mjs", from: "  return { ok: true, r, line: `day: START", to: "  process.stdout.write((await ownerRun(\"captains_call.mjs\", [\"deal\"])).stdout);\n  return { ok: true, r, line: `day: START", what: "μ5.2 the start re-deals unconditionally" },
  { clause: "W6.1", file: "scripts/sitting.mjs", from: "    S.host_session_id = pick.session; S.host_transcript_path", to: "    delete S.host_session_id; S.host_transcript_path", what: "μ6.1 the sitting written without the host_session_id key (legacy scope)" },
  { clause: "W6.2", file: "scripts/day.mjs", from: "  await closeSitting();\n  await machineHalf();", to: "  await machineHalf();", what: "μ6.2 the end skips the sitting's close" },
  { clause: "W7.0", file: ".claude/settings.json", from: "Agent|Task|Workflow|Skill\"", to: "Agent|Task|Workflow\"", what: "F7 the matcher loses Skill" },
  { clause: "W7.1", file: "scripts/rails.mjs", from: 'if (String(ti.skill || "") !== "learn") return null;', to: 'if (String(ti.skill || "") !== "learn-x") return null;', what: "the Skill door misses learn" },
  { clause: "W7.1", file: "ci/mday/witness_mday.mjs", own: true, from: "const w1 = await waitChild(); const s1 = sitting();", to: "const w1 = { settled: true, ms: oldBound + 1 }; const s1 = await waitOpen(K, oldBound);", what: "row 1067 (2): the child wait removed — back to the single timing sample" },
  { clause: "W7.2", file: "scripts/rails.mjs", from: 'if (String(ti.skill || "") !== "learn") return null;', to: "", what: "a Skill that is not learn is handed off too" },
  { clause: "W7.3", file: "scripts/rails.mjs", from: "    try { const h = dayHandoff(payload); if (h) { dayHand(h); out.handoff = h; out.why = \"Skill(learn) — the day's start handed to day.mjs\"; } } catch (e) { out.why = `Skill branch failed open: ${String((e && e.message) || e).slice(0, 80)}`; }", to: "    { const h = dayHandoff(payload); if (h) { dayHand(h); out.handoff = h; out.why = \"Skill(learn) — the day's start handed to day.mjs\"; } }", what: "the Skill branch no longer fails open" },
  { clause: "W8", file: "scripts/day.mjs", from: "/^CLOSED-BY: code · (evening|morning) anchor · /m.test(", to: "/^CLOSED-BY: code · (close) anchor · /m.test(", what: "the missed-close count reads the wrong anchor" },
  { clause: "W9", file: "scripts/turn_hook.mjs", from: '  await runOrgan("day.mjs", "brief", { ...opts, call: "hookMain" }, r);\n', to: "", what: "the SessionStart end line dropped" },
  { clause: "W10", file: "scripts/sitting.mjs", from: "  if (await (deps.daemonUp || daemonUp)()) return { ok: false, status: 409, door: \"refused\"", to: "  if (false) return { ok: false, status: 409, door: \"refused\"", what: "the local door writes while the daemon answers" },
];
const ROOT = mkdtempSync(join(tmpdir(), "mday-mutants-"));
const copyOrg = (name) => {
  const d = join(ROOT, name);
  cpSync(ORG, d, { recursive: true, filter: (p) => { const r = relative(ORG, p).split(sep).join("/"); const top = r.split("/")[0]; return top !== ".git" && top !== "node_modules" && !(r === "dressing-room/state" || r.startsWith("dressing-room/state/")) || r === "dressing-room/state" || r === "dressing-room/state/registry.json"; } });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(d, "node_modules"), "junction");
  return d;
};
const run = (org, only, witness = WITNESS) => {
  const r = spawnSync(process.execPath, [witness, "--org", org, "--base-org", BASE, ...(only ? ["--only", only] : [])], { encoding: "utf8" });
  const lines = String(r.stdout || "").split(/\r?\n/).filter(Boolean);
  return { code: r.status, lines, last: lines[lines.length - 1] || "" };
};
let red = 0;
for (const m of MUTANTS) {
  const d = copyOrg(`m-${m.clause}`);
  const p = join(d, m.file), s = readFileSync(p, "utf8");
  const eol = s.includes("\r\n") ? "\r\n" : "\n";
  const from = m.from.replace(/\r?\n/g, eol), to = m.to.replace(/\r?\n/g, eol);
  if (s.split(from).length !== 2) { console.log(`  mutant ${m.clause} NOT APPLIED — the edit site is not unique in ${m.file}`); rmSync(d, { recursive: true, force: true }); continue; }
  writeFileSync(p, s.replace(from, () => to));
  // a mutant of the WITNESS itself (row 1067 (2) item 3) is judged by the mutated copy's own witness
  const r = run(d, m.clause, m.own ? join(d, "ci", "mday", "witness_mday.mjs") : WITNESS);
  const named = r.lines.find((l) => new RegExp(`^\\s+(GREEN|RED)\\s+${m.clause.replace(".", "\\.")} `).test(l)) || "";
  const ok = r.code === 1 && /^\s+RED\s/.test(named);
  if (ok) red++;
  console.log(`  mutant ${m.clause} (${m.what}): ${ok ? "RED by its clause" : "SURVIVED"} · ${named.trim().slice(0, 160) || r.last}`);
  rmSync(d, { recursive: true, force: true });
}
const c = run(copyOrg("control"), null);
const control = c.code === 0 && /^GREEN MDAY/.test(c.last);
console.log(`  control: ${c.last}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(red === MUTANTS.length && control ? 0 : 1);
