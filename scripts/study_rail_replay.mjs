#!/usr/bin/env node
// ============================================================================
// study_rail_replay.mjs · ARSENAL AI FC — THE STUDY RAIL, REPLAYED OVER HIS TRANSCRIPTS
//   (24 Sep 2026 · G3, THE TEACHING GATE P2 concern 2 · forks row 283 (2) + CURRENT line 3)
//   SOLE WRITER of: NOTHING. Reads .jsonl transcripts, prints one report.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. The architect ruled the rail on a replay (480 DENY of 634 calls, mostly engineering HE
//   ordered mid-lesson). His transcripts live on the laptop, never in a cloud seat, so the runner re-runs the
//   SAME measurement there against the rail as built — rails.mjs studyRail, never a copy of its logic.
// WHAT IT COUNTS. Per transcript, from the first `sitting.mjs open` in command position (rails' own
//   SITTING_OPEN_RE — the transcript that opened the sitting is its host) until a `sitting.mjs close`: every
//   tool call, judged by studyRail with his LAST HUMAN prompt before it (study_scope's humanText, the same
//   /clear·/compact skips as lastHumanPrompt):
//     ALLOW                    inside the study set
//     ALLOW-captain-ordered    outside the set, his last prompt classified "system" — counted, never blocked
//     DENY                     outside the set, model-initiated
//     none                     no opinion (a tool outside the rail's matcher, a CLOSING prompt, no prompt yet)
//   model-initiated share = DENY / (DENY + ALLOW-captain-ordered): of the system work done mid-lesson, how much
//   the model started. deny share = DENY / every call judged.
// LIMITS, SAID ONCE: a sitting opened in ANOTHER transcript (a JOIN, a Desktop host) is invisible here — only
//   the opening transcript is replayed; the factory rails (fleet / state / claude-p) are not re-judged.
// G3 v2 (forks row 297): a DENY names its study part to re-run alone (rails' studyRail `rerun`, the segment finder in
//   study_scope), and `--json` carries `calls` — one { file, ts, tool, verdict, cmd_head } per DENY and captain-ordered
//   call — so the runner can diff two replays call by call.
// CLI: node scripts/study_rail_replay.mjs <dir-of-.jsonl | file.jsonl> [--json] | selftest
// ============================================================================
import { readFileSync, readdirSync, statSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { studyRail, studyRerunLine, SITTING_OPEN_RE, CMD_POS } from "./rails.mjs";
import { humanText, SLASH_NOISE } from "./study_scope.mjs";

const SITTING_CLOSE_RE = new RegExp(`${CMD_POS}node(?:\\.exe)?\\s+"?[^\\s";|&]*sitting\\.mjs"?\\s+close\\b`, "i");
const STUDY_SCOPE = Object.freeze({ study: true, why: "replay — the transcript that opened the sitting is its host" });

/** Replay ONE transcript's text. Pure. */
export function replayTranscript(text, name = "") {
  const r = { file: name, opened: false, calls: 0, allow: 0, captain: 0, deny: 0, none: 0, denied: [], ordered: [], list: [] };
  let open = false, prompt = null;
  for (const line of String(text || "").split("\n")) {
    if (!line || line[0] !== "{") continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const t = humanText(o);
    if (t !== null) { if (!SLASH_NOISE.test(t)) prompt = t; continue; }
    if (!o || o.type !== "assistant") continue;
    const content = o.message && Array.isArray(o.message.content) ? o.message.content : [];
    for (const b of content) {
      if (!b || b.type !== "tool_use") continue;
      const payload = { tool_name: String(b.name || ""), tool_input: b.input || {} };
      const cmd = String((payload.tool_input || {}).command || "");
      const opens = /^(Bash|PowerShell)$/.test(payload.tool_name) && SITTING_OPEN_RE.test(cmd);
      if (!open && !opens) continue;
      if (opens) { open = true; r.opened = true; }
      r.calls++;
      const d = studyRail(payload, { scope: STUDY_SCOPE, prompt });
      const what = `${payload.tool_name}${cmd ? `: ${cmd.slice(0, 80)}` : ""}`;
      const row = (verdict) => r.list.push({ file: name, ts: typeof o.timestamp === "string" ? o.timestamp : null, tool: payload.tool_name, verdict, cmd_head: cmd.slice(0, 120) });
      if (!d) r.none++;
      else if (d.decision === "deny") { r.deny++; r.denied.push(d.rerun && d.rerun.length ? `${what}\n        ↳ ${studyRerunLine(d.rerun)}` : what); row("DENY"); }
      else if (d.captain) { r.captain++; r.ordered.push(what); row("ALLOW-captain-ordered"); }
      else r.allow++;
      if (/^(Bash|PowerShell)$/.test(payload.tool_name) && SITTING_CLOSE_RE.test(cmd)) open = false;
    }
  }
  return r;
}

const share = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);
export function replayDir(target) {
  let files;
  const st = statSync(target);
  if (st.isDirectory()) files = readdirSync(target).filter((f) => f.endsWith(".jsonl")).sort().map((f) => join(target, f));
  else files = [target];
  const per = files.map((f) => { try { return replayTranscript(readFileSync(f, "utf8"), basename(f)); } catch (e) { return { file: basename(f), error: String(e.message || e) }; } });
  const T = { transcripts: files.length, with_sitting: 0, calls: 0, allow: 0, captain: 0, deny: 0, none: 0 };
  for (const p of per) { if (p.error) continue; if (p.opened) T.with_sitting++; for (const k of ["calls", "allow", "captain", "deny", "none"]) T[k] += p[k]; }
  T.judged = T.allow + T.captain + T.deny;
  T.model_initiated_share_pct = share(T.deny, T.deny + T.captain);
  T.deny_share_pct = share(T.deny, T.judged);
  const calls = per.flatMap((p) => p.list || []);
  return { totals: T, per: per.map(({ list, ...p }) => p), calls };
}

function printReport({ totals: T, per }) {
  for (const p of per) {
    if (p.error) { console.log(`  ! ${p.file} — unreadable: ${p.error}`); continue; }
    if (!p.opened) continue;
    console.log(`  ${p.file} · ${p.calls} call(s) after the open · ALLOW ${p.allow} · ALLOW-captain-ordered ${p.captain} · DENY ${p.deny} · no opinion ${p.none}`);
    for (const d of p.denied.slice(0, 5)) console.log(`      DENY    ${d}`);
    for (const d of p.ordered.slice(0, 3)) console.log(`      CAPTAIN ${d}`);
  }
  console.log(`study_rail_replay: ${T.transcripts} transcript(s), ${T.with_sitting} opened a sitting · ${T.calls} call(s) after an open · ALLOW ${T.allow} · ALLOW-captain-ordered ${T.captain} · DENY ${T.deny} · no opinion ${T.none}`);
  console.log(`  model-initiated share (DENY / (DENY + captain-ordered)): ${T.model_initiated_share_pct === null ? "n/a" : T.model_initiated_share_pct + "%"} · deny share of judged calls: ${T.deny_share_pct === null ? "n/a" : T.deny_share_pct + "%"}`);
}

// ── SELFTEST — a synthetic fixture under a temp dir ─────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c, d) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${n}${c || !d ? "" : `\n      ${d}`}`); };
  const U = (content) => JSON.stringify({ type: "user", message: { content } });
  const META = (content) => JSON.stringify({ type: "user", isMeta: true, message: { content } });
  const RES = () => JSON.stringify({ type: "user", message: { content: [{ type: "tool_result", content: "x" }] } });
  const A = (name, input) => JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name, input }] } });
  const B = (command) => A("Bash", { command });
  const study = [
    U("runner: fix the pacer"), B("node scripts/xray.mjs report"),                                   // before the open — not counted
    U("learn"), B("node scripts/learn_digest.mjs"), RES(),
    B('node scripts/sitting.mjs open --surface code --no-spawn --task "tokenization axis c"'), RES(),   // 1 ALLOW (the open)
    U("pakka - pay aur ment"), B('node scripts/forge_session.mjs pointer "axis c merge"'), RES(),   // 2 ALLOW
    B("node scripts/xray.mjs report"), RES(),                                                         // 3 DENY
    A("Write", { file_path: "scripts/foo.mjs", content: "x" }), RES(),                                // 4 DENY
    JSON.stringify({ type: "assistant", timestamp: "2026-09-23T10:00:00.000Z", message: { content: [{ type: "tool_use", name: "Bash", input: { command: "node scripts/forge_session.mjs pointer x && git status" } }] } }),   // 5 DENY (chained)
    "{torn",
    U("ruk — pehle hook fix karo, rails ka system dekho"), B("node scripts/xray.mjs report"), RES(),   // 6 CAPTAIN
    A("Edit", { file_path: "scripts/rails.mjs" }), RES(),                                             // 7 CAPTAIN
    META("a skill body that says system"), U("<command-name>/compact</command-name>"),               // skipped: the prompt stays his order
    B("npm test"), RES(),                                                                             // 8 CAPTAIN
    A("Read", { file_path: "learning-layer/HOW_HE_LEARNS.md" }),                                      // 9 none (outside the matcher)
    U("<command-message>full-time</command-message>\n<command-name>/full-time</command-name>"),
    B("node scripts/postmatch.mjs --hit x"), RES(),                                                   // 10 none (closing)
    B("node scripts/sitting.mjs close"), RES(),                                                       // 11 none (closing) — closes
    U("pakka - x"), B("node scripts/xray.mjs report"),                                                // after close — not counted
  ].join("\n");
  const engineering = [U("runner"), B("node scripts/xray.mjs report"), A("Write", { file_path: "scripts/a.mjs" })].join("\n");
  const dir = mkdtempSync(join(tmpdir(), "g3-replay-"));
  try {
    writeFileSync(join(dir, "study.jsonl"), study);
    writeFileSync(join(dir, "eng.jsonl"), engineering);
    writeFileSync(join(dir, "notes.txt"), "not a transcript");
    const R = replayDir(dir), T = R.totals, s = R.per.find((p) => p.file === "study.jsonl");
    assert("REPLAY — only .jsonl files are read; a transcript that never opens a sitting counts nothing",
      T.transcripts === 2 && T.with_sitting === 1 && R.per.find((p) => p.file === "eng.jsonl").calls === 0, JSON.stringify(T));
    assert("REPLAY — counting starts AT the open and stops after `sitting.mjs close` (11 calls)", s.calls === 11, JSON.stringify(s));
    assert("REPLAY — ALLOW 2 (the open, a pointer) · DENY 3 (xray, a Write, a pointer chained to git) · ALLOW-captain-ordered 3 (after his system order: xray, Edit, npm) · no opinion 3 (Read, two closing calls)",
      s.allow === 2 && s.deny === 3 && s.captain === 3 && s.none === 3, JSON.stringify(s));
    assert("REPLAY — the prompt skips a meta row and /compact (his order still stands); a torn line is skipped",
      s.ordered.some((w) => /npm test/.test(w)) && s.denied.some((w) => /git status/.test(w)), JSON.stringify(s));
    assert("REPLAY — model-initiated share = DENY/(DENY+captain) = 50%; deny share of judged = 3/8 = 37.5%",
      T.model_initiated_share_pct === 50 && T.deny_share_pct === 37.5, JSON.stringify(T));
    assert("REPLAY — a single file path works the same as its dir", replayDir(join(dir, "study.jsonl")).totals.deny === 3);
    assert("REPLAY (row 297) — a DENY that chained a study part names it to re-run alone; a DENY with none names nothing",
      s.denied.some((w) => w.includes("↳ study rail: re-run the study part alone → node scripts/forge_session.mjs pointer x ; park the rest"))
      && s.denied.filter((w) => w.includes("↳")).length === 1, JSON.stringify(s.denied));
    assert("REPLAY (row 297) — `calls` lists every DENY and captain-ordered call as { file, ts, tool, verdict, cmd_head }, in order (3 DENY + 3 captain; ts from the transcript row, null when absent)",
      R.calls.length === 6 && R.calls.filter((c) => c.verdict === "DENY").length === 3 && R.calls.filter((c) => c.verdict === "ALLOW-captain-ordered").length === 3
      && R.calls.every((c) => c.file === "study.jsonl" && Object.keys(c).join() === "file,ts,tool,verdict,cmd_head")
      && R.calls[2].ts === "2026-09-23T10:00:00.000Z" && R.calls[2].cmd_head === "node scripts/forge_session.mjs pointer x && git status" && R.calls[0].ts === null && R.calls[1].tool === "Write"
      && !("list" in s), JSON.stringify(R.calls));
    const cli = process.getBuiltinModule("node:child_process").spawnSync(process.execPath, [fileURLToPath(import.meta.url), dir, "--json"], { encoding: "utf8", timeout: 15000 });
    let j = null; try { j = JSON.parse(cli.stdout); } catch { /* asserted */ }
    assert("REPLAY CLI — `--json` prints the same totals as one JSON object, with the per-call list", j && j.totals && j.totals.deny === 3 && j.totals.captain === 3 && Array.isArray(j.calls) && j.calls.length === 6, cli.stdout + cli.stderr);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  console.log(`study_rail_replay selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

function main() {
  const [arg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (arg === "selftest") return selftest();
  if (!arg) { console.log("study_rail_replay: <dir-of-.jsonl | file.jsonl> [--json] | selftest"); process.exit(2); }
  const R = replayDir(arg);
  if (process.argv.includes("--json")) console.log(JSON.stringify(R));
  else printReport(R);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
