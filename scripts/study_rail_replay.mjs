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
//     ALLOW-lesson-artifact    a page for him written into the row's own session scratchpad (rails' lesson-artifact door,
//                              forks row 811, his #150); its own verdict, never folded into ALLOW; the row's sessionId
//                              rides the replayed payload as the hook's session_id does
//     none                     no opinion (a tool outside the rail's matcher, a CLOSING prompt, no prompt yet)
//   model-initiated share = DENY / (DENY + ALLOW-captain-ordered): of the system work done mid-lesson, how much
//   the model started. deny share = DENY / every call judged.
// LIMITS, SAID ONCE: a sitting opened in ANOTHER transcript (a JOIN, a Desktop host) is invisible here — only
//   the opening transcript is replayed; the factory rails (fleet / state / claude-p) are not re-judged.
// G3 v2 (forks row 297): a DENY names its study part to re-run alone (rails' studyRail `rerun`, the segment finder in
//   study_scope), and `--json` carries `calls` — one { file, ts, tool, verdict, cmd_head } per DENY and captain-ordered
//   call — so the runner can diff two replays call by call.
// THE TEACHING PASS (6 Oct 2026 · rung L4 · fate 58 REWRITE · forks rows 276, 553, 554 (3)). The rail counts said nothing
//   about the turn he complained about on 23 Sep (2efc490c: two check questions with no picture, then "why are not doing
//   visualization"). A second pass over the SAME transcripts now judges every turn — the assistant blocks after his human
//   prompt (study_scope's humanText, the prompt reader the rail pass uses) — by teaching_audit.mjs's ONE definition of a
//   new idea (newIdeaOf, IMPORTED, never copied) and its ONE picture-order reading (pictureOrder: a show_widget before the
//   turn's LAST text block). A new-idea turn whose picture is not first is a MISS, and the report prints ONE line beside
//   the rail counts: `picture-first misses N`; `--json` carries it (totals.picture_first_misses, per-file counts, and one
//   { file, ts, moment, picture } per miss). The WHOLE transcript is read, as the definition was validated
//   (pic_validate.mjs on 2efc490c): a new idea is its own scope (check_q is only ever declared while teaching; the
//   asli-naam anchor measured 5 of 5 genuine naming acts, 0 engineering prose), so a sitting opened in another transcript
//   cannot hide a miss. LIMIT, SAID ONCE: an engineering transcript that performs a real asli-naam act counts like any
//   other — the per-file lines name every file with a miss.
//   ROW 583 (4) (7 Oct 2026): the SITTING WINDOW rides the same line as a sub-count — `picture-first misses N · sitting
//   window M`, M <= N — counted from the rail's own `sitting.mjs open` to its `close` (the window the rail pass judges);
//   `--json` carries both (totals.picture_first_misses, totals.sitting_window_misses; in_sitting on every miss).
// THE BLIND PASS (13 Nov 2026 · forks rows 814 (1), 822 (2), 827 (1)). The study rail was BLIND on 20 of 56 PreToolUse Bash
//   calls of his Desktop day b2409cd2 and said so only on a stderr nobody reads. A third pass counts it over the WHOLE
//   transcript — the blind rail is a property of the HOOK, not of a sitting, so no sitting window applies: every attachment
//   row with hookEvent PreToolUse whose command names rails.mjs and pretooluse is a RAIL CALL, one whose stderr starts
//   `rails: REFUSED` is BLIND, and each is counted on its IST day (the row's timestamp + 5:30, session_meter's istDay — ONE
//   definition). Beside it, rails' own ledger (rails its sole writer) is read per IST day: NOT-BORN when the file is absent, a
//   malformed line counted `bad`, never thrown. The report prints ONE line, `study_rail_replay: rails blind B of C rail
//   call(s) · <day B/C, …> · ledger <NOT-BORN | day n, …>`; `--json` carries totals.rails_calls, totals.rails_blind,
//   totals.blind_by_day, totals.blind_ledger (null when not born) and each per[] entry its own rails_calls / rails_blind.
//   It reads each file once more, on its own, so the two passes above keep their one shared read untouched. Target: 0 blind.
// CLI: node scripts/study_rail_replay.mjs <dir-of-.jsonl | file.jsonl> [--json] | selftest
// ============================================================================
import { readFileSync, readdirSync, statSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { studyRail, studyRerunLine, SITTING_OPEN_RE, CMD_POS } from "./rails.mjs";
import { humanText, SLASH_NOISE } from "./study_scope.mjs";
import { newIdeaOf, pictureOrder, turnMoments } from "./teaching_audit.mjs";   // L4: THE new_idea definition + the picture order + the moments, each defined ONCE there
import { istDay } from "./session_meter.mjs";   // row 814: THE IST day (timestamp + 5:30), defined ONCE there
import { railsBlindFile } from "./rails.mjs";   // row 814: where rails' blind ledger lives, its sole writer's ONE answer

const SITTING_CLOSE_RE = new RegExp(`${CMD_POS}node(?:\\.exe)?\\s+"?[^\\s";|&]*sitting\\.mjs"?\\s+close\\b`, "i");
const STUDY_SCOPE = Object.freeze({ study: true, why: "replay — the transcript that opened the sitting is its host" });

/** Replay ONE transcript's text. Pure. */
export function replayTranscript(text, name = "") {
  const r = { file: name, opened: false, calls: 0, allow: 0, captain: 0, lesson: 0, deny: 0, none: 0, denied: [], ordered: [], list: [] };
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
      // row 811: the row's own session id rides the payload, as the hook's does — the lesson-artifact door reads it
      const payload = { tool_name: String(b.name || ""), tool_input: b.input || {}, ...(typeof o.sessionId === "string" ? { session_id: o.sessionId } : {}) };
      const cmd = String((payload.tool_input || {}).command || "");
      const opens = /^(Bash|PowerShell)$/.test(payload.tool_name) && SITTING_OPEN_RE.test(cmd);
      if (!open && !opens) continue;
      if (opens) { open = true; r.opened = true; }
      r.calls++;
      const d = studyRail(payload, { scope: STUDY_SCOPE, prompt });
      const what = `${payload.tool_name}${cmd ? `: ${cmd.slice(0, 80)}` : ""}`;
      // row 811: an editor call's head is its TARGET (it has no command), so a DENY Write names what it was writing
      const head = cmd || String((payload.tool_input || {}).file_path || "");
      const row = (verdict) => r.list.push({ file: name, ts: typeof o.timestamp === "string" ? o.timestamp : null, tool: payload.tool_name, verdict, cmd_head: head.slice(0, 120) });
      if (!d) r.none++;
      else if (d.decision === "deny") { r.deny++; r.denied.push(d.rerun && d.rerun.length ? `${what}\n        ↳ ${studyRerunLine(d.rerun)}` : what); row("DENY"); }
      else if (d.captain) { r.captain++; r.ordered.push(what); row("ALLOW-captain-ordered"); }
      else if (d.lesson) { r.lesson++; row("ALLOW-lesson-artifact"); }   // row 811: its own verdict, never folded into ALLOW
      else r.allow++;
      if (/^(Bash|PowerShell)$/.test(payload.tool_name) && SITTING_CLOSE_RE.test(cmd)) open = false;
    }
  }
  return r;
}

/** THE TEACHING PASS over ONE transcript's text (L4). Pure. A turn = the assistant blocks after his human prompt; each is
 *  judged by teaching_audit's newIdeaOf + pictureOrder (the readings the Stop row records), and a new idea whose picture
 *  is not first is a MISS, named with its prompt's clock, its moments and what its picture did. */
export function teachingPass(text, name = "") {
  const r = { file: name, turns: 0, new_ideas: 0, picture_first: 0, misses: 0, sitting_window_misses: 0, missed: [] };
  let cur = null, open = false;
  const judge = (t) => {
    if (!t) return;
    r.turns++;
    const moments = turnMoments(t.blocks), o = pictureOrder(t.blocks);
    if (!newIdeaOf({ moments, finalText: o.final_text })) return;
    r.new_ideas++;
    if (o.picture_first) { r.picture_first++; return; }
    r.misses++;
    if (t.inSitting) r.sitting_window_misses++;
    r.missed.push({ file: name, ts: t.ts, moment: moments.join(","), picture: o.picture_present ? "after the text" : "none", in_sitting: t.inSitting });
  };
  for (const line of String(text || "").split("\n")) {
    if (!line || line[0] !== "{") continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const h = humanText(o);
    if (h !== null) { if (!SLASH_NOISE.test(h)) { judge(cur); cur = { ts: typeof o.timestamp === "string" ? o.timestamp : null, blocks: [], inSitting: open }; } continue; }
    if (!cur || !o || o.type !== "assistant") continue;
    for (const b of (o.message && Array.isArray(o.message.content) ? o.message.content : [])) {
      if (!b) continue;
      // row 583 (4): THE SITTING WINDOW, the rail pass's own — it opens AT a `sitting.mjs open` call and shuts after a
      // `sitting.mjs close` call; a turn is inside it when the sitting was open at its prompt or at any of its blocks
      const sh = b.type === "tool_use" && /^(Bash|PowerShell)$/.test(String(b.name || ""));
      const cmd = sh && b.input && typeof b.input.command === "string" ? b.input.command : "";
      if (sh && SITTING_OPEN_RE.test(cmd)) open = true;
      if (open) cur.inSitting = true;
      if (b.type === "text" && String(b.text || "").trim()) cur.blocks.push({ kind: "text", text: b.text });
      else if (b.type === "tool_use") cur.blocks.push({ kind: "tool", name: String(b.name || ""), input: b.input || {} });
      if (sh && SITTING_CLOSE_RE.test(cmd)) open = false;
    }
  }
  judge(cur);
  return r;
}

/** THE BLIND PASS over ONE transcript's text (row 814). Pure. A rail call = an attachment row with hookEvent PreToolUse whose
 *  command names rails.mjs and pretooluse; BLIND = its stderr starts `rails: REFUSED`. The WHOLE transcript (a property of the
 *  hook, not of a sitting), per IST day; a row with no clock is counted under `no-day`, never dropped. */
export function blindPass(text, name = "") {
  const r = { file: name, rails_calls: 0, rails_blind: 0, by_day: {} };
  for (const line of String(text || "").split("\n")) {
    if (!line || line[0] !== "{" || !line.includes("pretooluse")) continue;   // a cheap gate before the parse: the command must name it
    let o; try { o = JSON.parse(line); } catch { continue; }
    const a = o && o.type === "attachment" && o.attachment && typeof o.attachment === "object" ? o.attachment : null;
    if (!a || a.hookEvent !== "PreToolUse") continue;
    const cmd = String(a.command || "");
    if (!/rails\.mjs/.test(cmd) || !/\bpretooluse\b/.test(cmd)) continue;
    const blind = String(a.stderr || "").startsWith("rails: REFUSED");
    const day = istDay(o.timestamp) || "no-day";
    const d = r.by_day[day] || (r.by_day[day] = { blind: 0, calls: 0 });
    r.rails_calls++; d.calls++;
    if (blind) { r.rails_blind++; d.blind++; }
  }
  return r;
}

/** RAILS' OWN LEDGER, per IST day (row 814). null when the file is absent: NOT-BORN. Else { rows, by_day: { day: n }, bad } —
 *  a line that is not one object with a readable `ts` is counted `bad`, never thrown; an unreadable file says so. */
export function blindLedgerByDay(file) {
  let text;
  try { text = readFileSync(file, "utf8"); } catch (e) { return e && e.code === "ENOENT" ? null : { rows: 0, by_day: {}, bad: 0, unreadable: (e && e.code) || "error" }; }
  const L = { rows: 0, by_day: {}, bad: 0 };
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let o = null; try { o = JSON.parse(line); } catch { /* counted below */ }
    const day = o && typeof o === "object" && !Array.isArray(o) ? istDay(o.ts) : null;
    if (!day) { L.bad++; continue; }
    L.rows++; L.by_day[day] = (L.by_day[day] || 0) + 1;
  }
  return L;
}

const share = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);
export function replayDir(target) {
  let files;
  const st = statSync(target);
  if (st.isDirectory()) files = readdirSync(target).filter((f) => f.endsWith(".jsonl")).sort().map((f) => join(target, f));
  else files = [target];
  // L4: the teaching pass reads the SAME text the rail pass reads — one read per file, two passes
  const per = files.map((f) => { try { const text = readFileSync(f, "utf8"); const { missed, file: _file, ...teaching } = teachingPass(text, basename(f)); return { ...replayTranscript(text, basename(f)), teaching, missed }; } catch (e) { return { file: basename(f), error: String(e.message || e) }; } });
  const T = { transcripts: files.length, with_sitting: 0, calls: 0, allow: 0, captain: 0, lesson: 0, deny: 0, none: 0 };
  for (const p of per) { if (p.error) continue; if (p.opened) T.with_sitting++; for (const k of ["calls", "allow", "captain", "lesson", "deny", "none"]) T[k] += p[k]; }
  T.judged = T.allow + T.captain + T.lesson + T.deny;
  T.model_initiated_share_pct = share(T.deny, T.deny + T.captain);
  T.deny_share_pct = share(T.deny, T.judged);
  // L4: the teaching pass's totals — picture_first_misses is the count rung L4's G1 reads
  T.turns = 0; T.new_ideas = 0; T.picture_first = 0; T.picture_first_misses = 0; T.sitting_window_misses = 0;
  for (const p of per) if (p.teaching) { T.turns += p.teaching.turns; T.new_ideas += p.teaching.new_ideas; T.picture_first += p.teaching.picture_first; T.picture_first_misses += p.teaching.misses; T.sitting_window_misses += p.teaching.sitting_window_misses; }
  // row 814: THE BLIND PASS — its own read of each readable file; each per[] entry carries its own counts, the totals the days
  T.rails_calls = 0; T.rails_blind = 0;
  const byDay = {};
  files.forEach((f, i) => {
    if (!per[i] || per[i].error) return;
    let b; try { b = blindPass(readFileSync(f, "utf8"), basename(f)); } catch { return; }
    per[i].rails_calls = b.rails_calls; per[i].rails_blind = b.rails_blind;
    T.rails_calls += b.rails_calls; T.rails_blind += b.rails_blind;
    for (const [d, v] of Object.entries(b.by_day)) { const t = byDay[d] || (byDay[d] = { blind: 0, calls: 0 }); t.blind += v.blind; t.calls += v.calls; }
  });
  T.blind_by_day = Object.fromEntries(Object.keys(byDay).sort().map((d) => [d, byDay[d]]));
  T.blind_ledger = blindLedgerByDay(railsBlindFile());
  const calls = per.flatMap((p) => p.list || []);
  const missed = per.flatMap((p) => p.missed || []);
  return { totals: T, per: per.map(({ list, missed: _m, ...p }) => p), calls, missed };
}

// a miss's clock, in his zone (every lane row's clock carries its zone, row 554 (4))
const istClock = (t) => { const d = new Date(t); return t && !Number.isNaN(d.getTime()) ? `${new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(d)} IST` : "no clock"; };

function printReport({ totals: T, per, missed = [] }) {
  for (const p of per) {
    if (p.error) { console.log(`  ! ${p.file} — unreadable: ${p.error}`); continue; }
    if (!p.opened) continue;
    console.log(`  ${p.file} · ${p.calls} call(s) after the open · ALLOW ${p.allow} · ALLOW-captain-ordered ${p.captain} · ALLOW-lesson-artifact ${p.lesson} · DENY ${p.deny} · no opinion ${p.none}`);
    for (const d of p.denied.slice(0, 5)) console.log(`      DENY    ${d}`);
    for (const d of p.ordered.slice(0, 3)) console.log(`      CAPTAIN ${d}`);
  }
  console.log(`study_rail_replay: ${T.transcripts} transcript(s), ${T.with_sitting} opened a sitting · ${T.calls} call(s) after an open · ALLOW ${T.allow} · ALLOW-captain-ordered ${T.captain} · ALLOW-lesson-artifact ${T.lesson} · DENY ${T.deny} · no opinion ${T.none}`);
  console.log(`  model-initiated share (DENY / (DENY + captain-ordered)): ${T.model_initiated_share_pct === null ? "n/a" : T.model_initiated_share_pct + "%"} · deny share of judged calls: ${T.deny_share_pct === null ? "n/a" : T.deny_share_pct + "%"}`);
  // L4 — the teaching pass, beside the rail counts: per file, then the misses by name, then ONE total line
  for (const p of per) if (p.teaching && p.teaching.new_ideas) console.log(`  ${p.file} · teaching: ${p.teaching.new_ideas} new-idea turn(s) of ${p.teaching.turns} · picture first ${p.teaching.picture_first} · missed ${p.teaching.misses} (${p.teaching.sitting_window_misses} in the sitting window)`);
  for (const m of missed.slice(0, 8)) console.log(`      MISS    ${m.file} · ${istClock(m.ts)} · moments [${m.moment}] · picture ${m.picture} · ${m.in_sitting ? "inside" : "outside"} the sitting window`);
  if (missed.length > 8) console.log(`      (+${missed.length - 8} more — --json lists every one)`);
  // row 583 (4): the WHOLE transcript's count, then the sitting window as a sub-count on the SAME line (M <= N)
  console.log(`study_rail_replay: picture-first misses ${T.picture_first_misses} · sitting window ${T.sitting_window_misses} · ${T.new_ideas} new-idea turn(s) of ${T.turns} in ${T.transcripts} transcript(s), ${T.picture_first} with the picture first (teaching_audit's ONE definition)`);
  // row 814: THE BLIND RAIL — ONE line, the whole transcripts per IST day, then rails' own ledger per IST day
  const L = T.blind_ledger;
  console.log(`study_rail_replay: rails blind ${T.rails_blind} of ${T.rails_calls} rail call(s) · ${Object.entries(T.blind_by_day || {}).map(([d, v]) => `${d} ${v.blind}/${v.calls}`).join(", ") || "no rail call"} · ledger ${L === null || L === undefined ? "NOT-BORN" : L.unreadable ? `UNREADABLE (${L.unreadable})` : `${Object.entries(L.by_day).map(([d, n]) => `${d} ${n}`).join(", ") || "born, 0 row(s)"}${L.bad ? ` (bad ${L.bad})` : ""}`}`);
}

// ── SELFTEST — a synthetic fixture under a temp dir ─────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c, d) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${n}${c || !d ? "" : `\n      ${d}`}`); };
  // L4 (6 Oct 2026) — THE CATCH-ALL: a throw is a ✗ line that NAMES it and the run still reaches its summary line (a crash
  // is never a verdict). `check` catches per case; the try below catches anything outside a named case.
  const check = (n, f) => { let c = false, why = ""; try { c = !!f(); } catch (e) { why = `THREW: ${String((e && e.message) || e).slice(0, 200)}`; } assert(n, c, why); };
  try {   // the catch-all opens here and closes above the summary line; the lines inside keep their indent
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
    // forks row 811 (his #150) — THE LESSON-ARTIFACT DOOR, replayed: the row's sessionId is the payload's session_id
    const SID = "b2409cd2-4663-4d4a-9013-5c62f8fe8118", PAD = `${tmpdir().split(String.fromCharCode(92)).join("/")}/claude/C--Users-nikhi-GitHub-arsenal-ai-fc/${SID}/scratchpad`;
    const W = (file_path, sid = SID) => JSON.stringify({ type: "assistant", sessionId: sid, timestamp: "2026-10-18T05:46:26.139Z", message: { content: [{ type: "tool_use", name: "Write", input: { file_path, content: "<html></html>" } }] } });
    const la = replayTranscript([U("padhai"), B("node scripts/sitting.mjs open --surface code --no-spawn"), RES(), U("pakka - x"),
      W(`${PAD}/inference__axis-a-kya-analogy__2026-10-18.html`), RES(), W("scripts/recap.html"), RES(), W(`${PAD}/r.html`, "64803bd4-8789-4567-a962-503473323b64"), RES()].join("\n"), "lesson.jsonl");
    assert("REPLAY (row 811) — his recap page into the row's own session scratchpad is ALLOW-lesson-artifact, its own verdict and its own `calls` row naming the target; a scripts/ page and another session's scratchpad stay DENY",
      la.lesson === 1 && la.deny === 2 && la.allow === 1 && la.captain === 0
      && la.list.filter((c) => c.verdict === "ALLOW-lesson-artifact").length === 1 && la.list.find((c) => c.verdict === "ALLOW-lesson-artifact").cmd_head === `${PAD}/inference__axis-a-kya-analogy__2026-10-18.html`.slice(0, 120)
      && la.list.filter((c) => c.verdict === "DENY").map((c) => c.cmd_head).includes("scripts/recap.html"), JSON.stringify(la.list));
  } finally { rmSync(dir, { recursive: true, force: true }); }
  // ── L4 · THE TEACHING PASS (fate 58 REWRITE · rows 554 (3), 561), planted BOTH ways ──
  {
    let k = 0;
    const H = (text) => JSON.stringify({ type: "user", message: { role: "user", content: text }, timestamp: `2026-09-23T14:${String(15 + (k++ % 44)).padStart(2, "0")}:00.000Z` });
    const SAY = (text) => JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text }] } });
    const MOM = (kind) => B(`node scripts/forge_session.mjs moment ${kind}`);
    const PIC = A("mcp__visualize__show_widget", { title: "token ID", widget_code: "<svg></svg>" });
    const NAAM = "Us chhapi hui list ka asli naam **VOCABULARY** hai, aur us number ka naam token ID hai.";
    const ASK = "Har shabd ek token ID banta hai. Batao, `token` kya hai?";
    const OPEN = () => [H("padhai shuru"), B("node scripts/sitting.mjs open --surface code --no-spawn"), RES(), SAY("Sitting khul gayi."), H("samjhao")];
    const misses = (body) => teachingPass([...OPEN(), ...body].join("\n")).misses;
    check("L4 · THE FOUR SHAPES rung L4's G1 replays, 0 1 1 0: a check_q turn, its picture before its last text = 0 · the same, the picture after = 1 · an asli-naam turn, no moment, no picture = 1 · a pehle_guess turn opening a term, no picture = 0",
      () => misses([MOM("check_q"), RES(), PIC, RES(), SAY(ASK)]) === 0 && misses([MOM("check_q"), RES(), SAY(ASK), PIC, RES()]) === 1
        && misses([SAY(NAAM)]) === 1 && misses([MOM("pehle_guess"), RES(), SAY(`${NAAM} Pehle guess karo: kitne token?`)]) === 0);
    check("L4 · row 583 (1) · THE WIDGET_GATE SHAPES rung L4's G1 now replays (G1e 0 · G1f 1): widget_gate is a DISPLAY moment, so a widget_gate turn opening a term by its asli naam is a new idea — its picture first = 0 · the same, its picture after = 1",
      () => misses([MOM("widget_gate"), RES(), PIC, RES(), SAY(NAAM)]) === 0 && misses([MOM("widget_gate"), RES(), SAY(NAAM), PIC, RES()]) === 1);
    check("L4 · a TEST moment is never a new idea: a sharp_check turn showing a picture, or a jirah beside check_q with none = 0 misses",
      () => misses([MOM("sharp_check"), RES(), PIC, RES(), SAY("Seedha sawaal: kitne token?")]) === 0 && misses([MOM("jirah"), MOM("check_q"), RES(), SAY(ASK)]) === 0);
    check("L4 · TWO TEXT BLOCKS around the picture: only the LAST text counts (text, picture, text = 0 · text, text, picture = 1)",
      () => misses([MOM("check_q"), RES(), SAY("Pehle yeh dekho."), PIC, RES(), SAY(ASK)]) === 0 && misses([MOM("check_q"), RES(), SAY("Pehle yeh dekho."), SAY(ASK), PIC, RES()]) === 1);
    const many = teachingPass([...OPEN(), MOM("check_q"), RES(), SAY(ASK), H("haan"), MOM("check_q"), RES(), PIC, RES(), SAY(ASK), H("aage"), SAY(NAAM),
      U("<command-name>/compact</command-name>"), H("ok"), SAY("Theek hai.")].join("\n"), "many.jsonl");
    check("L4 · every turn is judged ONCE, between his prompts (a tool result or a /compact line is no prompt): 5 turns · 3 new ideas · 1 picture first · 2 misses, each named by its prompt's clock, its moments and what its picture did",
      () => many.turns === 5 && many.new_ideas === 3 && many.picture_first === 1 && many.misses === 2
        && JSON.stringify(many.missed.map((m) => [m.moment, m.picture])) === JSON.stringify([["check_q", "none"], ["", "none"]]) && many.missed.every((m) => m.file === "many.jsonl" && /^2026-09-23T14:/.test(m.ts)));
    const d2 = mkdtempSync(join(tmpdir(), "l4-replay-"));
    try {
      writeFileSync(join(d2, "a.jsonl"), [...OPEN(), MOM("check_q"), RES(), SAY(ASK)].join("\n"));                                   // 1 miss
      writeFileSync(join(d2, "b.jsonl"), [...OPEN(), SAY(NAAM), H("x"), MOM("check_q"), RES(), PIC, RES(), SAY(ASK)].join("\n"));   // 1 miss · 1 picture first
      writeFileSync(join(d2, "c.jsonl"), [H("samjhao"), SAY(NAAM)].join("\n"));                                                        // 1 miss, never inside a sitting
      const cp = process.getBuiltinModule("node:child_process");
      const txt = cp.spawnSync(process.execPath, [fileURLToPath(import.meta.url), d2], { encoding: "utf8", timeout: 15000 });
      const js = cp.spawnSync(process.execPath, [fileURLToPath(import.meta.url), d2, "--json"], { encoding: "utf8", timeout: 15000 });
      let j = null; try { j = JSON.parse(js.stdout); } catch { /* asserted */ }
      const hits = String(txt.stdout || "").split("\n").filter((l) => /picture-first misses/.test(l));
      check("L4 · THE CLI prints ONE `picture-first misses N · sitting window M` line beside the rail counts (row 583 (4)) — the WHOLE directory 3, its sitting window 2; no per-file or MISS line repeats the phrase — and names each miss inside or outside the window",
        () => txt.status === 0 && hits.length === 1 && /^study_rail_replay: picture-first misses 3 · sitting window 2 · 4 new-idea turn\(s\)/.test(hits[0])
          && /picture-first misses ([0-9]+) · sitting window ([0-9]+)/.test(hits[0])
          && /study_rail_replay: 3 transcript\(s\)[^\n]*ALLOW/.test(txt.stdout) && (txt.stdout.match(/^\s+MISS\s/gm) || []).length === 3
          && (txt.stdout.match(/outside the sitting window/g) || []).length === 1);
      check("L4 · `--json` carries both: totals.picture_first_misses 3 and totals.sitting_window_misses 2 (of 4 new ideas), every per-file entry its teaching counts, and one { file, ts, moment, picture, in_sitting } per miss",
        () => js.status === 0 && j && j.totals.picture_first_misses === 3 && j.totals.sitting_window_misses === 2 && j.totals.new_ideas === 4 && j.totals.picture_first === 1
          && j.per.every((p) => p.teaching && typeof p.teaching.misses === "number" && typeof p.teaching.sitting_window_misses === "number" && !("missed" in p)) && Array.isArray(j.missed) && j.missed.length === 3
          && j.missed.every((m) => Object.keys(m).join() === "file,ts,moment,picture,in_sitting"));
    } finally { rmSync(d2, { recursive: true, force: true }); }
    const winText = [H("pehle"), SAY(NAAM),                                                                   // a miss before any sitting opens
      H("padhai shuru"), B("node scripts/sitting.mjs open --surface code --no-spawn"), RES(), SAY("Sitting khul gayi."),
      H("samjhao"), MOM("check_q"), RES(), SAY(ASK),                                                          // a miss inside the window
      H("bas"), B("node scripts/sitting.mjs close"), RES(), SAY("Sitting band."),
      H("ek aur"), SAY(NAAM)].join("\n");                                                                     // a miss after the close
    const win = teachingPass(winText, "w.jsonl"), never = teachingPass([H("samjhao"), SAY(NAAM)].join("\n"), "n.jsonl");
    check("L4 · row 583 (4) · the WHOLE transcript is N, the sitting window a sub-count M <= N from the rail's own `sitting.mjs open` to its `close`: a miss before the open and one after the close are outside it; a transcript that never opens a sitting has M = 0",
      () => win.misses === 3 && win.sitting_window_misses === 1 && JSON.stringify(win.missed.map((m) => m.in_sitting)) === JSON.stringify([false, true, false])
        && never.misses === 1 && never.sitting_window_misses === 0);
    check("L4 · ONE definition: this replay IMPORTS newIdeaOf from ./teaching_audit.mjs and defines no new-idea predicate of its own",
      () => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8"); return /import\s*\{[^}]*\bnewIdeaOf\b[^}]*\}\s*from\s*"\.\/teaching_audit\.mjs"/.test(src) && !/function\s+newIdeaOf\b/.test(src) && !/newIdeaOf\s*=/.test(src); });
  }
  // ── row 814 · THE BLIND PASS and rails' ledger, planted both ways ──
  {
    const RAIL = 'node "$CLAUDE_PROJECT_DIR/scripts/rails.mjs" pretooluse';
    const HOOK = (ts, command, stderr = "", stdout = "") => JSON.stringify({ type: "attachment", timestamp: ts, sessionId: "s", entrypoint: "claude-desktop",
      attachment: { type: "hook_success", hookName: "PreToolUse:Bash", hookEvent: "PreToolUse", toolUseID: "t", content: "", stdout, stderr, exitCode: 0, command, durationMs: 1031 } });
    const REFUSED = "rails: REFUSED — no payload on fd 0 within 300ms (non-TTY, stdin never closed). No payload ⇒ no decision; …";
    const tx = [
      HOOK("2026-10-17T18:27:51.892Z", RAIL, REFUSED),                                                        // 23:57 IST, 17 Oct — BLIND
      HOOK("2026-10-17T18:31:00.000Z", RAIL),                                                                 // 00:01 IST, 18 Oct (the 17th in UTC) — read
      HOOK("2026-10-18T05:00:00.000Z", RAIL, REFUSED),                                                        // 10:30 IST, 18 Oct — BLIND
      HOOK("2026-10-18T05:00:01.000Z", 'python3 "${CLAUDE_PLUGIN_ROOT}/hooks/pretooluse.py"', REFUSED, "{}"), // another PreToolUse hook — ignored, whatever it prints
      U("a prompt that quotes rails.mjs pretooluse and rails: REFUSED"),                                       // not an attachment row — ignored
    ].join("\n");
    check("BLIND (row 814) — three rail rows over two IST days (two REFUSED) beside another hook's PreToolUse row read 2 of 3: 17 Oct 1/1 · 18 Oct 1/2 (the 18:31Z row is the 18th in IST); the other hook and a prompt quoting the words count nothing",
      () => { const b = blindPass(tx, "b.jsonl"); return b.rails_calls === 3 && b.rails_blind === 2 && JSON.stringify(b.by_day) === JSON.stringify({ "2026-10-17": { blind: 1, calls: 1 }, "2026-10-18": { blind: 1, calls: 2 } }); });
    const led = mkdtempSync(join(tmpdir(), "s814-ledger-")), txd = mkdtempSync(join(tmpdir(), "s814-tx-"));
    try {
      const LEDGER = join(led, "blind.jsonl"), ABSENT = join(led, "absent.jsonl");
      const row = (ts) => JSON.stringify({ ts, why: "no payload on fd 0 after 1000 ms of silence (non-TTY, stdin never closed)", read_ms: 1000, rail_ms: 1400, free_mb: 610 });
      writeFileSync(LEDGER, [row("2026-10-17T18:27:52.000Z"), row("2026-10-17T18:31:00.000Z"), "{torn", "", row("2026-10-18T05:00:00.000Z"), JSON.stringify({ ts: "not a clock" })].join("\n") + "\n");
      check("BLIND LEDGER (row 814) — rails' ledger per IST day: 3 rows (17 Oct 1 · 18 Oct 2), a torn line and a row with no readable ts are `bad` 2, never thrown; an ABSENT file is null (NOT-BORN)",
        () => { const L = blindLedgerByDay(LEDGER); return L.rows === 3 && L.bad === 2 && JSON.stringify(L.by_day) === JSON.stringify({ "2026-10-17": 1, "2026-10-18": 2 }) && blindLedgerByDay(ABSENT) === null; });
      writeFileSync(join(txd, "b.jsonl"), tx);
      const cp = process.getBuiltinModule("node:child_process");
      const cli = (args, ledger) => cp.spawnSync(process.execPath, [fileURLToPath(import.meta.url), txd, ...args], { encoding: "utf8", timeout: 15000, env: { ...process.env, ARSENAL_RAILS_BLIND_FILE: ledger } });
      const txt = cli([], LEDGER), js = cli(["--json"], LEDGER), txtNB = cli([], ABSENT), jsNB = cli(["--json"], ABSENT);
      const blindLines = (r) => String(r.stdout || "").split("\n").filter((l) => /rails blind/.test(l));
      check("BLIND CLI (row 814) — the report gains EXACTLY ONE `rails blind` line (`rails blind 2 of 3 rail call(s) · 2026-10-17 1/1, 2026-10-18 1/2 · ledger 2026-10-17 1, 2026-10-18 2 (bad 2)`, or `ledger NOT-BORN`); `--json` carries totals.rails_calls · rails_blind · blind_by_day · blind_ledger (null when not born) and each per[] entry its own counts",
        () => {
          const j = JSON.parse(js.stdout), n = JSON.parse(jsNB.stdout), p = j.per.find((x) => x.file === "b.jsonl");
          return txt.status === 0 && blindLines(txt).length === 1
            && blindLines(txt)[0] === "study_rail_replay: rails blind 2 of 3 rail call(s) · 2026-10-17 1/1, 2026-10-18 1/2 · ledger 2026-10-17 1, 2026-10-18 2 (bad 2)"
            && blindLines(txtNB).length === 1 && / · ledger NOT-BORN$/.test(blindLines(txtNB)[0])
            && j.totals.rails_calls === 3 && j.totals.rails_blind === 2 && JSON.stringify(j.totals.blind_by_day) === JSON.stringify({ "2026-10-17": { blind: 1, calls: 1 }, "2026-10-18": { blind: 1, calls: 2 } })
            && j.totals.blind_ledger && j.totals.blind_ledger.rows === 3 && j.totals.blind_ledger.bad === 2 && n.totals.blind_ledger === null
            && p && p.rails_calls === 3 && p.rails_blind === 2;
        });
    } finally { rmSync(led, { recursive: true, force: true }); rmSync(txd, { recursive: true, force: true }); }
  }
  } catch (e) { fail++; console.log(`  ✗ THROW outside a named case — ${String((e && e.stack) || e).slice(0, 300)}`); }
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
