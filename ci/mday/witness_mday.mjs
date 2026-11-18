#!/usr/bin/env node
// ============================================================================
// ci/mday/witness_mday.mjs — UNIT mday · ONE START, ONE END, NOTHING FOR HIM TO REMEMBER (forks rows 1044 / 1050)
// ----------------------------------------------------------------------------
// USAGE: node ci/mday/witness_mday.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base 669200d reads RED on the clauses it lacks)
//   --base-org  the BASE tree (main 669200d) — BOUND needs it; absent, BOUND is RED
//   --only      run only the groups holding these clause ids (the mutant runner's door); BOUND and LAST always run
// CONTRACT — every plant runs on a COPY of --org under os.tmpdir() (never .git, never node_modules — that rides as a link),
//   with its OWN dressing-room/state (EMPTY but for the plant: nothing of his is copied, nothing printed), its own HOME /
//   USERPROFILE / ARSENAL_ARCHIVE under the same temp root, a FREE PORT with no daemon on it (the daemon DOWN, as on his box)
//   except in F10, which runs a REAL keeper (`sitting.mjs daemon`) on its own free port. A FAKE `claude` (+ claude.cmd) sits
//   FIRST on PATH and logs any spawn (a planted model, never a live call). No git repo is planted (core.autocrlf, row 1036:
//   nothing to clone or init), every line read from a process is split on \r?\n, BOUND hashes text with CRLF folded to LF,
//   and processes are listed through PowerShell on Windows, `ps` elsewhere. No timeout, budget or ratio is typed: SLACK is one
//   node start measured in this run; a detached hand-off is awaited within the measured run of the same verb plus SLACK; the
//   evening clock is the last study turn plus the quiet minutes postmatch DECLARES (read from its own source) plus SLACK.
// CLAUSES (spec ci/mday/MDAY_SPEC.md @ 9421614 R1-R7; rulings row 1050 F1-F10 — where they differ, the ruling wins):
//   F4    each of scorer / setpiece / viz run TWICE on one day: idempotent ⇔ the 2nd run rewrites no byte; day.mjs's
//         EVENING_ORGANS runs an idempotent organ at end AND answer, a non-idempotent one on answer ONLY
//   W1.1  daemon down, a /learn prompt through the UserPromptSubmit hook → sitting.json open, host = the payload's session
//   W1.2  /learn twice, same session → ONE sitting id, surfaces unchanged
//   W1.3  /learn from a SECOND session the same day → JOIN (same id), the host MOVES to the new /learn session, the line says so
//   W1.4  a prompt that only MENTIONS /learn → nothing opens
//   W2.1  one `end` → sitting closed, D's machine record (close anchor), ONE card line — in that order (each owner's stamp)
//   W2.2  `end` twice → exit 0, "already closed", every state byte AND mtime identical
//   W2.3  `end` from a non-host session while his sitting is open → REFUSED, the line names the night close, nothing written
//   W2.4  static: learn/SKILL.md, REFERENCE.md §4, full-time/SKILL.md type no judge-round before the close; CLAUDE.md carries the end line
//   W2.5  static (L6): day.mjs spawns no claude, imports no model resolver, holds no phrase list of his words
//   W3.1  `end` and no answer → D's record exists, no RESULT, "his word not given", the sitting closed, exit 0
//   W3.2  `end` then `answer --hit HIT --kal k` → HIS RESULT on top, the machine record byte-identical below
//   W3.3  an answer with no end first → accepted, D carries his RESULT (kept guard)
//   W4.1  a /learn day never closed → the EVENING autoclose writes D's record and files ONE keyed card
//   W4.2  then the MORNING step → nothing new (bytes)                                                  (kept guard)
//   W4.3  a day closed by `end` → the evening writes nothing and reads it closed ("nothing new")
//   W5.1  `end` prints exactly ONE card line
//   W5.2  the next session's start + /learn → that card shown ONCE                                     (kept guard)
//   W5.3  at that `end` the deck holds ≥2 live cards (a hand-filed one + the day-close card) — still ONE line
//   W6.1  after the hook's start → study_scope: study true, not legacy
//   W6.2  study true before `end` (his sitting open), false after it, why "no open sitting"
//   W6.3  a non-host session the same day → study false                                                (kept guard)
//   W7.0  static (F7): settings.json's PreToolUse matcher carries Skill; rails' Skill branch sits before decide()
//   W7.1  PreToolUse(Skill learn), the start planted SLOWER than one measured start + SLACK → the detached child is awaited
//         ITSELF (no process naming the plant root, the owner lock gone; LAST's bound) and the sitting opens with the payload's host
//   W7.2  (after W7.1's wait resolved) PreToolUse(Skill other) → nothing printed, no child left, nothing opened (untouched)
//   W7.3  the Skill branch's own throw → allow, nothing printed, the why says it failed open
//   W8    the two code counts (F8 A): planted records → `day.mjs status` names missed-close and false-close exactly
//   W9    F9: the SessionStart sequence prints the end line while today's sitting is open, and not once it is closed
//   W10   F10: daemon UP → `day.mjs start` goes through the POST door ONLY (the daemon's own /status holds the host) and the
//         local door REFUSES while it answers (sitting.json untouched)
//   BOUND only the named files differ from --base-org (ci/mday/** is this unit's own output)
//   LAST  no node process naming the temp root survives (fake-claude spawns are counted and printed, planted)
// LAST LINE: GREEN MDAY <what> · <n> clause(s) (exit 0) or RED MDAY · <clauses> (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync, symlinkSync, chmodSync } from "node:fs";
import { join, resolve, relative, sep, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, spawn, execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",") : null;
if (!ORG || !existsSync(join(ORG, "scripts", "sitting.mjs"))) { console.log("RED MDAY · USAGE (--org <dir> with scripts/sitting.mjs)"); process.exit(1); }
const UNIT = "MDAY";
const NAMED = ["scripts/day.mjs", "scripts/sitting.mjs", "scripts/turn_hook.mjs", "scripts/rails.mjs", "scripts/postmatch.mjs",
  ".claude/settings.json", ".claude/skills/learn/SKILL.md", ".claude/skills/learn/REFERENCE.md", ".claude/skills/full-time/SKILL.md", "CLAUDE.md"];
const SKIP_TOP = new Set([".git", "node_modules"]);
const ROOT = mkdtempSync(join(tmpdir(), "mday-wit-"));
const slash = (p) => p.split(sep).join("/");
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
const want = (...ids) => !ONLY || ids.some((i) => ONLY.includes(i));
const t0 = Date.now(); spawnSync(process.execPath, ["-e", "0"]); const SLACK = Math.max(1, Date.now() - t0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const istDay = (d = new Date()) => new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);

// ── THE COPY (one per side) and its fresh state per group ──────────────────────────────────────────────────────────────
function copyOrg(src, dst) {
  cpSync(src, dst, { recursive: true, filter: (p) => {
    const rel = slash(relative(src, p));
    if (!rel) return true;
    if (SKIP_TOP.has(rel.split("/")[0])) return false;
    return !(rel === "dressing-room/state" || rel.startsWith("dressing-room/state/")) && !/\.log$/.test(rel);
  } });
  if (existsSync(join(src, "node_modules"))) symlinkSync(join(src, "node_modules"), join(dst, "node_modules"), "junction");
}
const FAKE = join(ROOT, "fakebin"), CLAUDE_LOG = join(ROOT, "claude_spawns.log");
mkdirSync(FAKE, { recursive: true });
writeFileSync(join(FAKE, "claude"), `#!/bin/sh\necho "spawn $*" >> "$MDAY_FAKE_CLAUDE_LOG"\nexit 1\n`);
chmodSync(join(FAKE, "claude"), 0o755);
writeFileSync(join(FAKE, "claude.cmd"), `@echo spawn %* >> "%MDAY_FAKE_CLAUDE_LOG%"\r\n@exit /b 1\r\n`);
const COPY = join(ROOT, "org");
copyOrg(ORG, COPY);
const STATE = join(COPY, "dressing-room", "state");
let GEN = 0, PORT = 0, HOME = "", ARCHIVE = "", MAXMS = 0;
async function fresh() {
  rmSync(STATE, { recursive: true, force: true }); mkdirSync(STATE, { recursive: true });
  GEN++; HOME = join(ROOT, `home-${GEN}`); ARCHIVE = join(ROOT, `archive-${GEN}`); mkdirSync(HOME, { recursive: true });
  PORT = await freePort();   // nothing listens on it: the daemon is DOWN
}
function env(extra = {}) {
  const e = { ...process.env };
  for (const k of ["ANTHROPIC_API_KEY", "ARSENAL_ORGAN", "ARSENAL_DAY_KEY", "ARSENAL_AUTOCLOSE_CLOCK", "ARSENAL_AUTOCLOSE_DEADLINE", "ARSENAL_SITTING_STATE_DIR", "ARSENAL_CALL_STATE_DIR", "CLAUDE_CODE_SESSION_ID", "CLAUDE_CODE_ENTRYPOINT", "ARSENAL_SITTING_DRY_OWNERS"]) delete e[k];
  const pathKey = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
  return { ...e, [pathKey]: `${FAKE}${delimiter}${e[pathKey] || ""}`, TZ: "Asia/Kolkata" /* his laptop's clock: postmatch dates by the LOCAL day */, HOME, USERPROFILE: HOME, ARSENAL_ARCHIVE: ARCHIVE, ARSENAL_SITTING_PORT: String(PORT), MDAY_FAKE_CLAUDE_LOG: CLAUDE_LOG, ...extra };
}
function node(args, { sid = null, input, extra = {} } = {}) {
  const t = Date.now();
  const r = spawnSync(process.execPath, args.map((a, i) => (i === 0 ? join(COPY, a) : a)), { cwd: COPY, encoding: "utf8", windowsHide: true, input, env: env({ ...(sid ? { CLAUDE_CODE_SESSION_ID: sid } : {}), ...extra }) });
  const ms = Date.now() - t; if (ms > MAXMS) MAXMS = ms;
  return { status: r.status, stdout: String(r.stdout || ""), stderr: String(r.stderr || ""), ms };
}
const payload = (sid, prompt, ev = "UserPromptSubmit") => JSON.stringify({ hook_event_name: ev, session_id: sid, transcript_path: join(HOME, `${sid}.jsonl`), cwd: COPY, prompt });
const hookPrompt = (sid, prompt) => node(["scripts/turn_hook.mjs", "prompt"], { sid, input: payload(sid, prompt) });
const hookStart = (sid) => node(["scripts/turn_hook.mjs", "start"], { sid, input: JSON.stringify({ hook_event_name: "SessionStart", session_id: sid, transcript_path: join(HOME, `${sid}.jsonl`), cwd: COPY, source: "startup" }) });
const HAS_DAY = () => existsSync(join(COPY, "scripts", "day.mjs"));
// the day's END as the tree has it: day.mjs end on a tree that carries it; the base's prose path otherwise (the sitting's close,
// then postmatch with no answer — the two commands the /learn skill and /full-time typed at the base)
function endDay(sid) {
  if (HAS_DAY()) return node(["scripts/day.mjs", "end"], { sid });
  const a = node(["scripts/sitting.mjs", "close", "--reason", "fulltime"], { sid }), b = node(["scripts/postmatch.mjs"], { sid });
  return { status: b.status, stdout: a.stdout + b.stdout, stderr: a.stderr + b.stderr, ms: a.ms + b.ms, base: true };
}
function answerDay(sid, args) {
  if (HAS_DAY()) return node(["scripts/day.mjs", "answer", ...args], { sid });
  return node(["scripts/postmatch.mjs", ...args], { sid });
}
const readJ = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const sitting = () => readJ(join(STATE, "sitting.json"));
const isOpen = (s) => !!(s && s.id && !s.closed_at);
const pmFile = (d) => join(STATE, "post_match", `${d}.md`);
const pmText = (d) => (existsSync(pmFile(d)) ? readFileSync(pmFile(d), "utf8") : null);
const liveCards = () => { const c = readJ(join(STATE, "captains_call.json")); return c && Array.isArray(c.cards) ? c.cards.filter((x) => !x.answer && !x.retired_at) : []; };
const HIS = /^RESULT:\s*(HIT|MISS|PARTIAL|LOAD-MANAGED)/m;   // HIS result, postmatch's own reading (HIS_RESULT_RE)
const cardLines = (s) => lines(s).filter((l) => l.startsWith("🎴"));
function snap(dir = STATE, acc = new Map(), top = dir) {
  let ents = []; try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) { const p = join(dir, e.name); if (e.isDirectory()) snap(p, acc, top); else { const st = statSync(p); acc.set(slash(relative(top, p)), `${createHash("sha256").update(readFileSync(p)).digest("hex")}:${st.mtimeMs}`); } }
  return acc;
}
const changed = (a, b) => [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k));
const scope = (sid) => { const r = node(["scripts/study_scope.mjs", "scope", "--session", sid]); try { return JSON.parse(lines(r.stdout).at(-1)); } catch { return { study: null, why: `unreadable: ${r.stdout.slice(0, 80)}${r.stderr.slice(0, 80)}` }; } };
// THE STUDY TURNS: his rows on the afferent lane (source claude-code, his session), archived by archivist's OWN writer
function plantTurns(sid, n = 3) {
  node(["scripts/archivist.mjs", "init"]);
  const now = Date.now();
  const rows = [];
  for (let i = 0; i < n; i++) rows.push({ event_id: `mday-${GEN}-${i}`, modality: "code", source: "claude-code", surface: "claude-code", session_id: sid, text: `planted study turn ${i} haan samjha`, tier: "private", moment: { forge_step: 3, forge_concept: "planted", cwd: "x" }, v: 3, ts: new Date(now - (n - i) * SLACK).toISOString() });
  writeFileSync(join(STATE, "afferent.jsonl"), rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  node(["scripts/archivist.mjs", "run"]);
  return rows.at(-1).ts;
}
const handCard = () => node(["scripts/captains_call.mjs", "file", "--line", "planted hand card (witness mday)", "--key", `mday-witness:${GEN}`]);
const quietMin = () => Number((/const AUTOCLOSE_QUIET_MIN = (\d+);/.exec(readFileSync(join(COPY, "scripts", "postmatch.mjs"), "utf8")) || [])[1]);
const autoclose = (day, anchor, clockMs) => node(["scripts/postmatch.mjs", "autoclose", "--date", day, "--anchor", anchor], { extra: { ARSENAL_AUTOCLOSE_CLOCK: new Date(clockMs).toISOString() } });

// the process table (PowerShell on Windows, ps elsewhere) — every node process whose command line names the plant root
const listing = () => (process.platform === "win32"
  ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
  : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" }));
const survivors = () => lines(listing().stdout).filter((l) => l.includes(ROOT) && !/\bps -eo\b/.test(l));
// ruling row 1067 (2): a DETACHED child is awaited ITSELF — no process naming the plant root alive AND the owner lock gone —
// bounded the way LAST is (the longest single run this witness measured, plus SLACK), never on one timing sample
async function waitChild() {
  const t = Date.now(), end = t + MAXMS + SLACK;
  const busy = () => survivors().length > 0 || existsSync(join(STATE, "sitting.json.lock"));
  while (busy() && Date.now() < end) await sleep(SLACK);
  return { settled: !busy(), ms: Date.now() - t };
}
// THE PLANTED SLOW START (row 1067 (2) item 3): a preload, handed through NODE_OPTIONS, delays ONLY `day.mjs start` by
// MDAY_PLANT_START_DELAY_MS before the module runs; every other node process starts as it always does
const DELAY_PRELOAD = join(ROOT, "slow_start.mjs");
writeFileSync(DELAY_PRELOAD, `const ms = Number(process.env.MDAY_PLANT_START_DELAY_MS || 0);\nif (ms > 0 && /day\\.mjs$/.test(process.argv[1] || "") && process.argv[2] === "start") await new Promise((r) => setTimeout(r, ms));\n`);
const slowEnv = (ms) => ({ NODE_OPTIONS: `--import "${pathToFileURL(DELAY_PRELOAD).href}"`, MDAY_PLANT_START_DELAY_MS: String(ms) });

console.log(`witness mday · org ${ORG} · slack ${SLACK} ms (one node start, measured) · day ${istDay()} (IST)`);
const kids = [];
let exitCode = 1;
try {
  const D = istDay();

  // ── F4 — the twice-run byte clause, per organ, on a planted day ──────────────────────────────────────────────────────
  if (want("F4")) {
    await fresh();
    // the organs need a day to read: --org's tracked state rides as a BYTE copy into the copy (never printed; nothing of his
    // leaves the temp root), so each organ runs its real path twice on the same day
    cpSync(join(ORG, "dressing-room", "state"), STATE, { recursive: true, filter: (p) => !/\.log$/.test(p) });
    const measured = {};
    for (const o of ["scorer.mjs", "setpiece.mjs", "viz.mjs"]) {
      const r1 = node([`scripts/${o}`]); const a = snap(join(COPY, "dressing-room"));
      const r2 = node([`scripts/${o}`]); const b = snap(join(COPY, "dressing-room"));
      const bytes = changed(new Map([...a].map(([k, v]) => [k, v.split(":")[0]])), new Map([...b].map(([k, v]) => [k, v.split(":")[0]])));
      measured[o] = { idem: r1.status === 0 && r2.status === 0 && bytes.length === 0, files: bytes.length, exit: `${r1.status}/${r2.status}` };
    }
    let declared = null;
    if (HAS_DAY()) { try { declared = (await import(pathToFileURL(join(COPY, "scripts", "day.mjs")).href)).EVENING_ORGANS; } catch (e) { declared = null; } }
    const agree = !!declared && ["scorer.mjs", "setpiece.mjs", "viz.mjs"].every((f) => { const d = declared.find((x) => x.file === f); return d && d.on.includes("answer") && d.on.includes("end") === measured[f].idem; });
    clause("F4", agree, `${Object.entries(measured).map(([f, m]) => `${f.replace(/\.mjs$/, "")} ${m.idem ? "IDEMPOTENT" : `NOT idempotent (${m.files} file(s) rewritten, exit ${m.exit})`}`).join(" · ")} · day.mjs EVENING_ORGANS ${declared ? declared.map((x) => `${x.file.replace(/\.mjs$/, "")}→${x.on.join("+")}`).join(", ") : "ABSENT"}${declared && !agree ? " — DISAGREES with the measurement" : ""}`);
  }

  // ── W1 + W6.1/W6.3 + W9 — the start ───────────────────────────────────────────────────────────────────────────────────
  if (want("W1.1", "W1.2", "W1.3", "W6.1", "W6.3", "W9")) {
    await fresh();
    const A = randomUUID(), B = randomUUID();
    const h1 = hookPrompt(A, "/learn");
    const s1 = sitting();
    clause("W1.1", isOpen(s1) && s1.host_session_id === A, `daemon down, /learn through the prompt hook → ${isOpen(s1) ? `sitting ${s1.id} open · host ${s1.host_session_id === A ? "= the payload's session" : `${String(s1.host_session_id).slice(0, 8)} (NOT the payload's)`}` : "NO sitting registered"} · ${lines(h1.stdout).find((l) => l.startsWith("day:")) || "no day line"}`);
    const sc = scope(A);
    clause("W6.1", sc.study === true && sc.legacy !== true, `study_scope after the start: study ${sc.study}${sc.legacy ? " (LEGACY)" : ""} · ${sc.why}`);
    const st = hookStart(randomUUID());
    const dayLine = lines(st.stdout).find((l) => l.startsWith("DAY:")) || "";
    const h2 = hookPrompt(A, "/learn");
    const s2 = sitting();
    clause("W1.2", isOpen(s2) && s1 && s2.id === s1.id && JSON.stringify(s2.surfaces) === JSON.stringify(s1.surfaces), `/learn twice, same session → ${s2 && s1 ? `${s2.id === s1.id ? "ONE id" : `a SECOND id ${s2.id}`} · surfaces ${JSON.stringify(s1.surfaces)} → ${JSON.stringify(s2.surfaces)}` : "no sitting"} · ${lines(h2.stdout).find((l) => l.startsWith("day:")) || "no day line"}`);
    const sc3 = scope(B);
    clause("W6.3", sc3.study === false, `a non-host session the same day: study ${sc3.study} · ${sc3.why}`);
    const h3 = hookPrompt(B, "/learn");
    const s3 = sitting(), l3 = lines(h3.stdout).find((l) => l.startsWith("day:")) || "";
    clause("W1.3", isOpen(s3) && s1 && s3.id === s1.id && s3.host_session_id === B && /JOINED/.test(l3) && /host moved/.test(l3), `/learn from a second session → ${s3 && s1 ? `${s3.id === s1.id ? "JOINED the same id" : "a NEW id"} · host ${s3.host_session_id === B ? "moved to the new /learn session" : s3.host_session_id === A ? "STAYED on the first" : "neither"}` : "no sitting"} · ${l3.slice(0, 140) || "no day line"}`);
    if (HAS_DAY()) node(["scripts/day.mjs", "end"], { sid: B });
    const st2 = hookStart(randomUUID());
    const after = lines(st2.stdout).find((l) => l.startsWith("DAY:")) || "";
    clause("W9", !!dayLine && /day\.mjs end/.test(dayLine) && !after && /node scripts\/day\.mjs end/.test(readFileSync(join(COPY, "CLAUDE.md"), "utf8")),
      `SessionStart while today's sitting is open: ${dayLine ? "the end line printed" : "NO end line"} · after the close: ${after ? "STILL printed" : "silent"} · CLAUDE.md ${/node scripts\/day\.mjs end/.test(readFileSync(join(COPY, "CLAUDE.md"), "utf8")) ? "carries" : "LACKS"} the line · CLAUDE.md ${Buffer.byteLength(readFileSync(join(COPY, "CLAUDE.md"), "utf8"))} bytes (its header states ≤ 8 KB)`);
  }
  if (want("W1.4")) {
    await fresh();
    const A = randomUUID();
    hookPrompt(A, "kal /learn ke baad kya hua tha, yaad hai?");
    const s = sitting();
    clause("W1.4", !s, `a prompt that only MENTIONS /learn → ${s ? `sitting ${s.id} OPENED` : "nothing opened"}`);
  }

  // ── W2 / W3.1 / W3.2 / W4.3 / W5.1 / W5.3 / W6.2 — one end, on a day with study turns, a hand card ──────────────────────
  if (want("W2.1", "W2.2", "W3.1", "W3.2", "W4.3", "W5.1", "W5.3", "W6.2")) {
    await fresh();
    const A = randomUUID();
    hookPrompt(A, "/learn");
    const last = plantTurns(A);
    handCard();
    const sc0 = scope(A);
    const e1 = endDay(A);
    const s = sitting(), rec = pmText(D) || "";
    const cb = /^CLOSED-BY: code · (\w+) anchor · (\S+)$/m.exec(rec);
    const deck = readJ(join(STATE, "captains_call.json"));
    const dealt = deck && Array.isArray(deck.cards) ? deck.cards.flatMap((c) => c.dealt || []).sort().at(-1) : null;
    const ordered = !!s && !!s.closed_at && !!cb && cb[1] === "close" && Date.parse(cb[2]) >= Date.parse(s.closed_at) && !!dealt && Date.parse(dealt) >= Date.parse(cb[2]);
    clause("W2.1", e1.status === 0 && ordered && cardLines(e1.stdout).length === 1, `one end → exit ${e1.status} · sitting ${s && s.closed_at ? `closed ${s.closed_at}` : "NOT closed"} · record ${cb ? `${cb[1]} anchor at ${cb[2]}` : "NONE"} · card dealt ${dealt || "never"} · ${ordered ? "in that order" : "NOT in that order"}`);
    clause("W3.1", e1.status === 0 && !!rec && !HIS.test(rec) && /his word not given/.test(rec) && !!s && !!s.closed_at, `closed with no answer → exit ${e1.status} · record ${rec ? "written" : "NONE"}${HIS.test(rec) ? " WITH a RESULT of his" : ""}${/his word not given/.test(rec) ? " · his word named absent" : ""} · sitting ${s && s.closed_at ? "closed" : "open"}`);
    clause("W5.1", cardLines(e1.stdout).length === 1, `the end printed ${cardLines(e1.stdout).length} card line(s)`);
    clause("W5.3", liveCards().length >= 2 && cardLines(e1.stdout).length === 1, `the deck held ${liveCards().length} live card(s) at that end · ${cardLines(e1.stdout).length} printed`);
    const sc = scope(A);
    clause("W6.2", sc0.study === true && sc.study === false && sc.why === "no open sitting", `study_scope before the end: study ${sc0.study} → after it: study ${sc.study} · ${sc.why}`);
    const before = snap();
    const e2 = endDay(A);
    const diff = changed(before, snap());
    clause("W2.2", e2.status === 0 && diff.length === 0 && /already closed/.test(e2.stdout), `the second end → exit ${e2.status} · ${diff.length} state file(s) changed (bytes or mtime)${diff.length ? `: ${diff.slice(0, 4).join(", ")}` : ""} · ${(lines(e2.stdout).find((l) => /already|day:/.test(l)) || lines(e2.stdout + e2.stderr).at(-1) || "").slice(0, 120)}`);
    const b2 = snap();
    const ev = autoclose(D, "evening", Date.parse(last) + quietMin() * 60000 + SLACK);
    const evd = changed(b2, snap());
    const evl = lines(ev.stdout).find((l) => l.startsWith("autoclose ·")) || lines(ev.stdout + ev.stderr).at(-1) || "";
    clause("W4.3", ev.status === 0 && evd.length === 0 && /nothing new|closed by his word/.test(evl), `the evening after the end → ${evd.length} file(s) changed · ${evl.slice(0, 140)}`);
    const machine = pmText(D) || "";
    const an = answerDay(A, ["--hit", "HIT", "--signal", "planted", "--kal", "planted kal", "--date", D]);
    const up = pmText(D) || "";
    const kept = up.indexOf("\nMACHINE CLOSE (kept, L9)\n");
    clause("W3.2", an.status === 0 && /^RESULT:\s*HIT/m.test(up) && kept > 0 && up.slice(kept + "\nMACHINE CLOSE (kept, L9)\n".length) === machine && up.search(HIS) < kept,
      `end, then his answer → exit ${an.status} · ${/^RESULT:\s*HIT/m.test(up) ? "HIS RESULT on top" : "no RESULT of his"} · the machine record ${kept > 0 ? (up.slice(kept + "\nMACHINE CLOSE (kept, L9)\n".length) === machine ? "byte-identical below" : "CHANGED below") : "NOT kept"}${an.status ? ` · ${(lines(an.stdout + an.stderr).at(-1) || "").slice(0, 100)}` : ""}`);
  }
  if (want("W2.3")) {
    await fresh();
    const A = randomUUID(), E = randomUUID();
    hookPrompt(A, "/learn");
    const before = snap();
    const r = HAS_DAY() ? node(["scripts/day.mjs", "end"], { sid: E }) : endDay(E);
    const diff = changed(before, snap());
    clause("W2.3", r.status !== 0 && diff.length === 0 && /REFUSED/.test(r.stdout) && /night close/.test(r.stdout) && isOpen(sitting()), `end from a non-host session → exit ${r.status} · ${diff.length} state file(s) changed · ${(lines(r.stdout + r.stderr).at(-1) || "").slice(0, 150)}`);
  }
  if (want("W3.3")) {
    await fresh();
    const A = randomUUID();
    const r = answerDay(A, ["--hit", "PARTIAL", "--signal", "planted", "--kal", "planted kal"]);
    const t = pmText(D) || "";
    clause("W3.3", r.status === 0 && /^RESULT:\s*PARTIAL/m.test(t), `an answer with no end first → exit ${r.status} · ${/^RESULT:\s*PARTIAL/m.test(t) ? "D carries his RESULT" : "NO result recorded"}`);
  }

  // ── W4.1 / W4.2 — a /learn day never closed, then the night ─────────────────────────────────────────────────────────
  if (want("W4.1", "W4.2")) {
    await fresh();
    const A = randomUUID();
    hookPrompt(A, "/learn");
    const last = plantTurns(A);
    const evAt = Date.parse(last) + quietMin() * 60000 + SLACK;
    const ev = autoclose(D, "evening", evAt);
    const rec = pmText(D) || "";
    const evl = lines(ev.stdout).find((l) => l.startsWith("autoclose ·")) || "";
    const cards = liveCards().filter((c) => String(c.key || "").includes(D));
    clause("W4.1", ev.status === 0 && /^CLOSED-BY: code · evening anchor/m.test(rec) && cards.length === 1, `never closed, the evening step → ${rec ? "D's record written" : "NOTHING written"} · ${cards.length} keyed card(s) of ${D} · ${evl.slice(0, 120)}`);
    const before = snap();
    const mo = autoclose(D, "morning", evAt + SLACK);
    const diff = changed(before, snap());
    clause("W4.2", mo.status === 0 && diff.length === 0, `then the morning step → ${diff.length} file(s) changed · ${(lines(mo.stdout).find((l) => l.startsWith("autoclose ·")) || "").slice(0, 120)}`);
  }

  // ── W5.2 — the card at the next session's /learn, once ───────────────────────────────────────────────────────────────
  if (want("W5.2")) {
    await fresh();
    const A = randomUUID(), N = randomUUID();
    hookPrompt(A, "/learn");
    plantTurns(A);
    handCard();
    endDay(A);
    const st = hookStart(N), lp = hookPrompt(N, "/learn");
    const shown = cardLines(st.stdout + "\n" + lp.stdout);
    clause("W5.2", shown.length === 1, `the next session's start + /learn showed ${shown.length} card line(s)`);
  }

  // ── W2.4 / W2.5 / W7.0 — static ────────────────────────────────────────────────────────────────────────────────────
  if (want("W2.4")) {
    const rd = (p) => { try { return readFileSync(join(COPY, p), "utf8").replace(/\r\n/g, "\n"); } catch { return ""; } };
    const learn = rd(".claude/skills/learn/SKILL.md"), ref = rd(".claude/skills/learn/REFERENCE.md"), ft = rd(".claude/skills/full-time/SKILL.md"), cl = rd("CLAUDE.md");
    const step5 = (/^5\. Day end[\s\S]*?(?=\n## |\n\d\. )/m.exec(learn) || [""])[0];
    const s4 = ref.slice(ref.indexOf("## 4. DAY-END CLOSE"), ref.indexOf("\n## ", ref.indexOf("## 4. DAY-END CLOSE") + 5));
    const bad = [/judge-round/.test(step5) && "learn/SKILL.md step 5", /judge-round/.test(s4) && "REFERENCE.md §4", /`node scripts\/gaffer_brain\.mjs judge-round`/.test(ft) && "full-time/SKILL.md"].filter(Boolean);
    const line = /node scripts\/day\.mjs end/.test(cl);
    clause("W2.4", bad.length === 0 && line && /day\.mjs end/.test(step5), `${bad.length ? `a typed judge-round before the close in ${bad.join(", ")}` : "no typed judge-round before the close"} · CLAUDE.md ${line ? "carries" : "LACKS"} the end line · learn step 5 ${/day\.mjs end/.test(step5) ? "points at day.mjs end" : "does NOT point at day.mjs end"}`);
  }
  if (want("W2.5")) {
    const src = HAS_DAY() ? readFileSync(join(COPY, "scripts", "day.mjs"), "utf8") : "";
    const code = src.split(/\r?\n/).filter((l) => !/^\s*\/\//.test(l)).join("\n");
    const spawnsClaude = /["'`]claude["'`]|claude\s+-p/.test(code), resolver = /from\s+["'`]\.\/(models|claudegen|acts|intent)\.mjs["'`]|resolveIntent|import\(.*(models|claudegen|acts)\.mjs/.test(code);
    const phrase = [...code.matchAll(/\/((?:\\.|[^/\n])+)\/([a-z]*)/g)].some((m) => /\|/.test(m[1]) && /[a-z]{2,}\s*[a-z]*\|[a-z]/i.test(m[1]) && /i/.test(m[2]));
    clause("W2.5", !spawnsClaude && !resolver && !phrase, `day.mjs ${HAS_DAY() ? "" : "(absent at this tree) "}· spawns claude ${spawnsClaude ? "YES" : "no"} · model resolver ${resolver ? "YES" : "no"} · a phrase list of his words ${phrase ? "YES" : "no"}`);
  }

  // ── W7 — the Skill door ─────────────────────────────────────────────────────────────────────────────────────────────
  if (want("W7.0", "W7.1", "W7.2", "W7.3")) {
    const set = readJ(join(COPY, ".claude", "settings.json")) || {};
    const m = (((set.hooks || {}).PreToolUse || [])[0] || {}).matcher || "";
    const rails = readFileSync(join(COPY, "scripts", "rails.mjs"), "utf8").replace(/\r\n/g, "\n");
    const p0 = rails.indexOf("export function pretooluse("), body = rails.slice(p0, rails.indexOf("\n}\n", p0));
    const skillFirst = body.indexOf('payload.tool_name === "Skill"') > 0 && body.indexOf('payload.tool_name === "Skill"') < body.indexOf("const d = decide(payload, ctx);");
    clause("W7.0", m.split("|").includes("Skill") && skillFirst, `settings PreToolUse matcher ${m.split("|").includes("Skill") ? "carries Skill" : "LACKS Skill"} · rails' Skill branch ${skillFirst ? "sits before decide()" : "ABSENT before decide()"}`);
    // THE OLD BOUND — one synchronous run of the same verb plus SLACK (the single timing sample the ruling retired). The slow
    // plant delays the start by MORE than it, so a wait that trusts the sample reads the sitting before the child opens it.
    await fresh();
    let oldBound = SLACK;
    if (HAS_DAY()) { const m0 = node(["scripts/day.mjs", "start", "--session", randomUUID(), "--by", "witness-measure"]); oldBound = m0.ms + SLACK; }
    const delay = oldBound + SLACK;
    // the slow start, measured once synchronously on a scratch state, so the LAST-shaped bound (MAXMS) covers it by measurement
    await fresh();
    if (HAS_DAY()) node(["scripts/day.mjs", "start", "--session", randomUUID(), "--by", "witness-measure-slow"], { extra: slowEnv(delay) });
    const rail = (pl, extra = {}) => node(["scripts/rails.mjs", "pretooluse"], { input: JSON.stringify(pl), extra });
    const waitOpen = async (sid, bound) => { const end = Date.now() + bound; for (;;) { const s = sitting(); if (isOpen(s) && s.host_session_id === sid) return s; if (Date.now() > end) return s; await sleep(SLACK); } };
    void waitOpen;   // the retired single-sample wait, kept for the mutant that brings it back (row 1067 (2) item 3)
    await fresh();
    const K = randomUUID();
    const r1 = rail({ hook_event_name: "PreToolUse", tool_name: "Skill", tool_input: { skill: "learn" }, session_id: K, transcript_path: join(HOME, `${K}.jsonl`) }, slowEnv(delay));
    const w1 = await waitChild(); const s1 = sitting();
    clause("W7.1", r1.status === 0 && !/"deny"/.test(r1.stdout) && w1.settled && w1.ms > oldBound && isOpen(s1) && s1.host_session_id === K,
      `PreToolUse(Skill learn), the start planted SLOW by ${delay} ms (the old single-sample bound was ${oldBound} ms) → exit ${r1.status} · the detached child ${w1.settled ? `settled after ${w1.ms} ms (process gone, lock gone)` : `NOT settled within ${MAXMS + SLACK} ms`} · ${isOpen(s1) ? `sitting open, host ${s1.host_session_id === K ? "= the payload's session" : "OTHER"}` : "NO sitting"}`);
    // W7.2 starts only after W7.1's wait has resolved (row 1067 (2) item 2)
    await fresh();
    const O = randomUUID();
    const before = snap();
    const r2 = rail({ hook_event_name: "PreToolUse", tool_name: "Skill", tool_input: { skill: "forge" }, session_id: O, transcript_path: join(HOME, `${O}.jsonl`) });
    const w2 = await waitChild();
    const diff = changed(before, snap()).filter((k) => !k.startsWith("rails_blind"));
    clause("W7.2", r2.status === 0 && r2.stdout.trim() === "" && w2.settled && !sitting() && diff.length === 0, `PreToolUse(Skill forge) → exit ${r2.status} · stdout ${r2.stdout.trim() ? "PRINTED" : "empty"} · children ${w2.settled ? "settled" : "NOT settled"} · ${sitting() ? "a sitting OPENED" : "nothing opened"} · ${diff.length} state file(s) changed`);
    const probe = join(ROOT, "w73.mjs");
    writeFileSync(probe, `import { pathToFileURL } from "node:url";\nconst m = await import(pathToFileURL(process.argv[2]).href);\nconst out = []; const w = process.stdout.write.bind(process.stdout); process.stdout.write = (c) => { out.push(String(c)); return true; };\nlet d = null, threw = null;\ntry { d = m.pretooluse({ raw: JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Skill", tool_input: { skill: "learn" }, session_id: "${randomUUID()}" }), dayHand: () => { throw new Error("planted hand-off failure"); } }); } catch (e) { threw = String(e && e.message || e); }\nprocess.stdout.write = w;\nconsole.log(JSON.stringify({ decision: d && d.decision, why: d && d.why, printed: out.join(""), threw }));\n`);
    const r3 = spawnSync(process.execPath, [probe, join(COPY, "scripts", "rails.mjs")], { cwd: COPY, encoding: "utf8", env: env() });
    let v = {}; try { v = JSON.parse(lines(r3.stdout).at(-1)); } catch { v = { threw: `unreadable: ${(r3.stdout + r3.stderr).slice(0, 120)}` }; }
    clause("W7.3", !v.threw && v.decision === "allow" && v.printed === "" && /failed open/.test(String(v.why || "")), `the Skill branch's own throw → ${v.threw ? `THREW: ${String(v.threw).slice(0, 80)}` : `${v.decision} · printed ${v.printed ? "SOMETHING" : "nothing"} · ${String(v.why || "").slice(0, 90)}`}`);
  }

  // ── W8 — the two code counts (F8 A) ───────────────────────────────────────────────────────────────────────────────
  if (want("W8")) {
    await fresh();
    const H = randomUUID(), d1 = "2099-01-01", d2 = "2099-01-02", d3 = "2099-01-03", d4 = "2099-01-04";
    const rev = (id, day, hh, reason, closeHh) => ({ kind: "sitting_review", sitting_id: id, opened_at: `${day}T${hh}:00:00.000+05:30`, closed_at: `${day}T${closeHh}:00:00.000+05:30`, reason, host_session_id: H });
    // d1: closed by end (fulltime), then ANOTHER sitting of the same host the same day (a false close) · d2: idle-closed, closed by the
    // evening anchor (a missed close) · d3: end, the close anchor, nothing after · d4: idle-closed, closed by the morning anchor (missed)
    writeFileSync(join(STATE, "sitting_reviews.jsonl"), [rev("s1", d1, "10", "fulltime", "12"), rev("s2", d1, "13", "idle", "14"), rev("s3", d2, "10", "idle", "11"), rev("s4", d3, "10", "fulltime", "11"), rev("s5", d4, "10", "idle", "11")].map((r) => JSON.stringify(r)).join("\n") + "\n");
    mkdirSync(join(STATE, "post_match"), { recursive: true });
    writeFileSync(join(STATE, "post_match", `${d2}.md`), `planted\nCLOSED-BY: code · evening anchor · ${d2}T17:00:00.000Z\n`);
    writeFileSync(join(STATE, "post_match", `${d3}.md`), `planted\nCLOSED-BY: code · close anchor · ${d3}T06:00:00.000Z\n`);
    writeFileSync(join(STATE, "post_match", `${d4}.md`), `planted\nCLOSED-BY: code · morning anchor · ${d4}T02:00:00.000Z\n`);
    const r = HAS_DAY() ? node(["scripts/day.mjs", "status"]) : { status: 1, stdout: "" };
    const l = lines(r.stdout).find((x) => /missed-close/.test(x)) || "";
    clause("W8", /missed-close 2\/4 learn day/.test(l) && /false-close 1\/2 end/.test(l), `day.mjs status → ${l.slice(0, 170) || "NO counts line"}`);
  }

  // ── W10 — daemon up: the POST door only (F10) ─────────────────────────────────────────────────────────────────────
  if (want("W10")) {
    await fresh();
    // the daemon's worker reads the lane registry at boot (gate.mjs) — that ONE tracked file rides as a byte copy, never printed
    if (existsSync(join(ORG, "dressing-room", "state", "registry.json"))) cpSync(join(ORG, "dressing-room", "state", "registry.json"), join(STATE, "registry.json"));
    const out = [];
    const k = spawn(process.execPath, [join(COPY, "scripts", "sitting.mjs"), "daemon"], { cwd: COPY, env: env(), stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    kids.push(k); k.stdout.on("data", (d) => out.push(String(d))); k.stderr.on("data", (d) => out.push(String(d)));
    const status = async (ms) => { try { const r = await fetch(`http://127.0.0.1:${PORT}/status`, ms ? { signal: AbortSignal.timeout(ms) } : {}); return await r.json(); } catch { return null; } };
    // the first boot is unbounded by design (nothing is measured yet): a closed port refuses at once, and a keeper that exits ends it
    const b0 = Date.now(); let up = null;
    for (;;) { up = await status(); if (up && up.ok) break; if (k.exitCode != null || /a crash \(exit/.test(out.join(""))) break; await sleep(SLACK); }
    const boot = Date.now() - b0;
    if (!up || !up.ok) clause("W10", false, `the planted daemon never answered (${out.join("").split(/\r?\n/).slice(-2).join(" | ")})`);
    else {
      const A = randomUUID();
      const r = HAS_DAY() ? node(["scripts/day.mjs", "start", "--session", A, "--by", "witness"]) : hookPrompt(A, "/learn");
      const st = await status(boot + SLACK);
      const fileBefore = existsSync(join(STATE, "sitting.json")) ? readFileSync(join(STATE, "sitting.json"), "utf8") : null;
      const probe = join(ROOT, "w10.mjs");
      writeFileSync(probe, `import { pathToFileURL } from "node:url";\nconst m = await import(pathToFileURL(process.argv[2]).href);\nif (typeof m.openLocal !== "function") { console.log(JSON.stringify({ absent: true })); process.exit(0); }\nconst r = await m.openLocal({ surface: "code", session: "${randomUUID()}", by: "witness w10" });\nconsole.log(JSON.stringify({ ok: r.ok, door: r.door, error: r.error }));\nprocess.exit(0);\n`);
      const p = spawnSync(process.execPath, [probe, join(COPY, "scripts", "sitting.mjs")], { cwd: COPY, encoding: "utf8", env: env() });
      let v = {}; try { v = JSON.parse(lines(p.stdout).at(-1)); } catch { v = { error: (p.stdout + p.stderr).slice(0, 100) }; }
      const fileAfter = existsSync(join(STATE, "sitting.json")) ? readFileSync(join(STATE, "sitting.json"), "utf8") : null;
      const ok = !!st && st.open === true && st.host_session_id === A && /door post/.test(r.stdout) && v.ok === false && v.door === "refused" && fileAfter === fileBefore;
      clause("W10", ok, `daemon up → start ${/door post/.test(r.stdout) ? "through the POST door" : `NOT through the POST door (${(lines(r.stdout).at(-1) || "").slice(0, 60)})`} · the daemon's /status: ${st ? `open ${st.open} · host ${st.host_session_id === A ? "= the payload's" : String(st.host_session_id).slice(0, 8)}` : "no answer"} · the local door while it answers: ${v.absent ? "ABSENT" : v.ok === false ? `refused (${String(v.error || "").slice(0, 60)})` : "WROTE"} · sitting.json ${fileAfter === fileBefore ? "untouched by it" : "CHANGED"}`);
    }
    if (process.platform === "win32") { try { execFileSync("taskkill", ["/PID", String(k.pid), "/T", "/F"], { stdio: "ignore" }); } catch { /* gone */ } } else k.kill("SIGTERM");
    await new Promise((r) => (k.exitCode != null || k.signalCode != null ? r() : k.once("exit", r)));
  }

  // ── BOUND ─────────────────────────────────────────────────────────────────────────────────────────────────────────
  if (!BASE_ORG) clause("BOUND", false, "no --base-org given");
  else {
    const OUT = (rel) => rel.startsWith("ci/mday/") || rel.startsWith("dressing-room/state/");
    const walk = (dir, acc = new Map(), top = dir) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name), rel = slash(relative(top, p));
        if (SKIP_TOP.has(rel.split("/")[0]) || OUT(rel) || /\.log$/.test(rel)) continue;
        const st = statSync(p);
        if (st.isDirectory()) walk(p, acc, top); else acc.set(rel, createHash("sha256").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex"));
      }
      return acc;
    };
    const a = walk(ORG), b = walk(BASE_ORG);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    clause("BOUND", extra.length === 0, `${diff.length} file(s) differ from --base-org${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 6).join(", ")}` : ""}`);
  }
  exitCode = 0;
} catch (e) {
  clause("WITNESS", false, `threw: ${String((e && e.stack) || e).split(/\r?\n/).slice(0, 3).join(" | ").slice(0, 300)}`);
} finally {
  for (const k of kids) { if (k.exitCode == null && k.signalCode == null) { try { k.kill("SIGKILL"); } catch { /* gone */ } } }
}

// ── LAST ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  // a detached child (the close's review launch, sitting.mjs review — its own process by design; a Skill hand-off) finishes on
  // its own: awaited in SLACK steps, bounded by the longest single run this witness measured plus SLACK — never a typed number
  let left = survivors(); const end = Date.now() + MAXMS + SLACK;
  while (left.length && Date.now() < end) { await sleep(SLACK); left = survivors(); }
  const spawns = existsSync(CLAUDE_LOG) ? lines(readFileSync(CLAUDE_LOG, "utf8")).length : 0;
  rmSync(ROOT, { recursive: true, force: true });
  clause("LAST", left.length === 0, `${left.length} node process(es) naming the temp root survive · the fake claude logged ${spawns} spawn(s) (planted; no live model)`);
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length || exitCode) { console.log(`RED ${UNIT} · ${red.join(", ") || "WITNESS"}`); process.exit(1); }
console.log(`GREEN ${UNIT} /learn opens his day by code and one end closes it, safe twice, never waiting on his answer · ${results.length} clause(s)`);
process.exit(0);
