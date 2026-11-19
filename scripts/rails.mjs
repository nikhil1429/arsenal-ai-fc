#!/usr/bin/env node
// ============================================================================
// rails.mjs · ARSENAL AI FC — THE FACTORY GETS THE ORGANISM'S OWN DISCIPLINE
//   (THE ORGANISM AUDIT §10-C · rung S1(b)+(c), 20 Aug 2026)
//   SOLE WRITER of: dressing-room/state/rails_blind.jsonl — append-only, ONE row per blind call (forks rows 814 (1), 827 (1)).
//   SUPERSEDED BY ROW 814, kept as the record (L9: layered, never replaced): "This organ writes no file, ever — like
//   turn_hook.mjs. A rail that can write is a rail that can be part of the accident." Row 814 found the one file it must
//   write: on his Desktop day b2409cd2 this rail was BLIND on 20 of 56 calls and said so only on a stderr nobody reads, and a
//   gate that cannot count its own blindness is a mirror. It writes that count and nothing else, ever: no decision, no
//   payload, no other organ's state.
// ----------------------------------------------------------------------------
// THE ROOT THIS SERVES (§10, root B): **THE FACTORY IS LESS GUARDED THAN THE PRODUCT.**
//   Both token disasters happened in SESSIONS, not in the organism — the 16-agent fleet,
//   and the 19-Aug reading session at 505.02 lakh weighted (~2× the organism's whole
//   week). The organism has a gate, a ledger, owners and a suite; the sessions that BUILD
//   the organism had none of it. Prose in a work order cannot stop a session — a
//   PreToolUse hook can, because it runs BEFORE the permission modes, even under
//   --dangerously-skip-permissions.
//
// THREE RAILS, each one an accident that already happened
//   1. `fleet`      — a fan-out (Agent/Task/Workflow) whose prompt declares NO ceiling.
//                     LAW T's routing question was never asked by the 16-agent fleet or
//                     by the corpus agents of 19 Aug; both were "just a few agents".
//   2. `state`      — a session's EDITOR writing under dressing-room/state. The
//                     owners-only law says every state file has ONE writer and it is an
//                     organ's CLI (§10-D rule 4). An editor write is invisible to xray,
//                     to the selftests and to the owner's own validation.
//   3. `claude-p`   — `claude -p` fired from a session shell. That is the organism's
//                     OWN transport (L6), it bypasses the gate (L5) and its spend lands
//                     in nobody's ledger. (His 20 Aug 2026 switch-off was lifted by his
//                     30 Aug 2026 word — both cited: `grep -n "nothing burns tokens\|ORGANISM IS BACK ON"
//                     docs/archive/ORGANISM_AUDIT__2026-08-19.md`; the rail stands on the three above.)
//
// THE OVERRIDE, AND WHY IT IS IN THE COMMAND AND NOT IN THE ENVIRONMENT (§10-C):
//   "Rails carry a per-rung OVERRIDE, declared in that rung's micro-order — S12's canary
//   runs must never be blocked by S1's own rules." A hook cannot see a shell's private
//   environment, and an env var set once is an override that never expires. So the
//   override is a TOKEN INSIDE THE CALL ITSELF: `ARSENAL_RAILS_OVERRIDE=<rung>:<rail>`
//   (e.g. `ARSENAL_RAILS_OVERRIDE=S12:claude-p`). It is visible in the transcript, it
//   expires with the call, and the rail prints it — an override nobody can see later is
//   the same disease as no rail at all.
//
// WHAT A DENY COSTS: nothing. The tool never runs, the model is told why in one line,
//   and the line says how to comply. A rail that only says "no" gets removed.
// FAIL-OPEN, DELIBERATELY (the tripwire's own precedent): if this organ throws, the
//   tool call proceeds. A rail that blocks all work when it is itself broken is a rail
//   that gets uninstalled, and an uninstalled rail guards nothing.
//
// (c) THE ORDER-CHECKER, PRE-COMMIT. §3-C of the order: *"no reading can prove a
//   document is correct, however many times it is done"* — four readings each found
//   something the previous missed. So the check is mechanical and it now runs on every
//   commit, over EVERY order file, found BY PREDICATE (a docs/archive/*.md whose head
//   carries a RESUME HERE block) and never by a hardcoded list — that is S3's JUGAD
//   RULE honoured early: an order with a universal quantifier may not ship as a literal
//   subject list. Per-file exceptions are DECLARED IN THE DOCUMENT ITSELF:
//     <!-- order-check:absent-ok scripts/ghost.mjs -->
//   (ghost.mjs is a FINDING — a file named six times that does not exist — not a path.)
//
// LAWS: writes ONE file, its own blind ledger, and nothing else (row 814; "writes nothing" until then) · never rewrites a command · fail-open on its own error ·
//   every deny names the rail id, the reason, and the compliant form.
// THE ONE HAND-OFF (23 Sep 2026 · THE TEACHING GATE P1 · G0, architect ruling R7, forks row 255):
//   when a Bash/PowerShell call runs `sitting.mjs open` in COMMAND POSITION, this hook hands the
//   PAYLOAD's own session_id + transcript_path to `sitting.mjs host` — sitting's OWN verb writes
//   them (a pending stamp its `open` then binds). This organ still writes nothing; it is the only
//   process that can see the payload of the call that opens the study sitting, and the model must
//   never type an id. Bounded (5 s), silent on stdout, fail-open: a failed hand-off costs the call
//   nothing, and the `open` CLI's own harness id is the second path (sitting.mjs bindHost).
// G3 · THE STUDY RAIL (24 Sep 2026 · THE TEACHING GATE P2 concern 2 · forks row 283 (2) + CURRENT line 3):
//   HOW_HE_LEARNS #12 — no system/notes/tool work mid-concept — as a code path. It fires only when the call's
//   session HOSTS the open sitting (study_scope's R7 predicate: payload.session_id === sitting.host_session_id;
//   another terminal with the same sitting open gets no opinion) ∧ the sitting is not a pre-G0 legacy one ∧ his
//   last prompt is not a CLOSING. A shell call passes iff shellInStudySet (ONE home: study_scope.mjs); Write /
//   Edit / Agent / Task / Workflow are never in the set, with ONE door on the TARGET since forks row 811 (18 Oct 2026,
//   his word #150, the recap page G3 denied him): an editor call writing a lesson page into its OWN session's
//   scratchpad is a LESSON ARTIFACT (study_scope's lessonArtifactOf), allowed, said on stderr and counted by
//   study_rail_replay.mjs as its own verdict; every other Write / Edit stays out; every other tool gets no opinion. The rail id is
//   `study` and it is NOT overridable. THE ARCHITECT'S RULING ON THE 480 DENIES (row 283 (2), binding): the
//   replay over his study transcripts found 480 DENY of 634 calls, mostly engineering HE ORDERED mid-lesson —
//   so when his LAST PROMPT classifies "system" (the gate's own classifyPrompt, never a second one) the call is
//   ALLOWED as "captain's mid-lesson engineering": said on stderr and counted by study_rail_replay.mjs, never
//   blocked. #12 binds the model, not his order. The context read is FAIL-OPEN: any read error, no transcript,
//   no prompt in the tail → no opinion, never a deny.
// ROW 814 · THE BLIND RAIL IS COUNTED (13 Nov 2026 · forks rows 814, 822, 823; the design fixed by row 827 (1)). THE READ: the
//   hook's payload is read IN-PROCESS and bounded by SILENCE (session_meter's readStdinUntilSilence, zero spawns), because row
//   822 measured the old 300 ms deadline being spent by the drainer child's own node boot (14 of 50 payloads refused alone, 34
//   of 50 beside the hookify hook, the payload already in the pipe). THE COUNT: a call that still reads no payload is a BLIND
//   call — the same refusal line, the same fail-open allow, and ONE row { ts, why, read_ms, rail_ms (this process's uptime),
//   free_mb } appended to rails_blind.jsonl (recordBlind), so the blindness has a number and the rail's own duration beside it.
//   The ledger is BORN once (`rails.mjs born`: an exclusive create that never truncates) and a blind row never gives birth to
//   it: an unborn ledger refuses the row on one stderr line and the call proceeds. ARSENAL_RAILS_BLIND_FILE moves it ONLY
//   under the OS temp dir (the selftests' door); any other value is ignored. Target on a Desktop day: 0 rows.
// WHO ELSE COULD ACT ON THIS OUTPUT? .claude/settings.json PreToolUse (wired) ·
//   hooks/pre-commit (wired — tripwire first, then `orders`) · xray.mjs (reads this file
//   like any organ; it had no state edges by design until row 814 gave it its ledger) ·
//   study_rail_replay.mjs (reads rails_blind.jsonl: the blind calls per IST day beside its counts — wired, row 814) ·
//   organism_test.mjs laws (THE BLIND IS COUNTED · ONE WRITER — wired, row 814).
// CLI: node scripts/rails.mjs pretooluse | born | orders [--quiet] | decide <json> | selftest
// ============================================================================
import { readFileSync, existsSync, readdirSync, openSync, writeSync, closeSync, constants as FS } from "node:fs";   // row 814: the write half serves rails_blind.jsonl alone
import { execFileSync, spawnSync, spawn } from "node:child_process";
import { join, dirname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { freemem, tmpdir } from "node:os";
// THE STDIN DEADLINE (rung S5-R, 20 Aug 2026): session_meter's proven guard, imported —
// never a second implementation (§2: a universal need solved twice is the disease).
// ROW 827 (1): the hook's read is session_meter's silence-bounded reader, imported the same way; the deadline read stays for
// a direct in-process caller that hands nothing (pretooluse below), never on the hook path.
import { readStdinWithDeadline, readStdinUntilSilence } from "./session_meter.mjs";
// G3 — the study scope, the study set and his prompt's class, from the LEAF (never the gate or the pacer: heavy,
// and a forge_session import before turn_hook's shim makes the shim a silent no-op — study_scope's own note)
import { readSitting, studyScope, classifyPrompt, shellInStudySet, studyRerun, lastHumanPrompt, lessonArtifactOf } from "./study_scope.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

// ── THE RAILS ───────────────────────────────────────────────────────────────
export const FLEET_TOOLS = ["Agent", "Task", "Workflow"];
export const EDIT_TOOLS = ["Write", "Edit", "MultiEdit", "NotebookEdit", "Update"];
export const STATE_DIR_RE = /dressing-room[\/\\]state/i;
// An explicit ceiling = the word, then a number, close together. Any unit he uses
// ("ceiling: 2 lakh", "ceiling 4 agents", "ceiling — 8") satisfies it; a fan-out that
// never says the word does not.
export const CEILING_RE = /ceiling[^\n]{0,40}?\d/i;
// COMMAND POSITION ONLY, and this was learned the hard way ON THE FIRST DAY: the first
// live proof of this rail caught a canary that merely MENTIONED the string inside quotes,
// and minutes later the rail refused a session writing its own PROGRESS entry ABOUT the
// rail. A rail that blocks prose about itself is a rail that gets uninstalled by lunchtime.
// So the binary must sit where a shell would actually RUN it: start of the command, or
// after ; | & ( && ||, optionally behind inline VAR=value assignments.
export const CMD_POS = "(?:^|[\\n;|&(]|\\|\\||&&)\\s*(?:[A-Za-z_][A-Za-z0-9_]*=[^\\s]*\\s+)*";
export const CLAUDE_P_RE = new RegExp(`${CMD_POS}claude(?:\\.exe|\\.cmd)?\\s+(?:[^\\n;|&]*\\s)?(?:-p\\b|--print\\b)`, "i");
// the same rule for a shell write into state: the VERB must be in command position too
// `sed` IS NOT A WRITE UNLESS IT IS `-i` (S6-F · F-07, 28 Aug 2026). Every other verb here
// mutates by definition; sed does not — `sed -n '258p' file` is a pager, and it was the ONE
// proven false refusal: this rail denied THREE read-only commands during S6-R, and re-measuring
// them against this predicate showed two were never denied by it at all (their cause is NOT
// established and is recorded as open, not guessed). The rail's own message promises "reads are
// always fine"; that promise now holds for the case that broke it. In-place sed still REFUSES,
// and the selftest proves both directions — a rail that stopped biting is a weakened gate.
export const SED_IN_PLACE = `sed\\s+(?:-[^\\s-][^\\s]*\\s+)*-i`;
export const STATE_WRITE_RE = new RegExp(`(?:${CMD_POS}(?:rm|mv|cp|tee|truncate)\\s|${CMD_POS}${SED_IN_PLACE}|>>?\\s*[^\\s|]*dressing-room|Set-Content|Add-Content|Out-File)`, "i");
const OVERRIDE_RE = /ARSENAL_RAILS_OVERRIDE=([A-Za-z0-9_.-]+):([a-z-]+)/;

const textOf = (v) => { try { return typeof v === "string" ? v : JSON.stringify(v ?? ""); } catch { return String(v); } };

// PURE — the factory's decision, over a PreToolUse payload (the three rails of S1).
// RAIL 4 — THE WORKTREE LAW (forks rows 617 / 618, his word #117 "ok done", 12 Oct 2026). On 12 Oct his repo carried 13 scratch
// checkouts that no record named and whose sessions were gone (artifacts ledger 904). Every worktree of the organism is made
// THROUGH the tool, which records the hand and the purpose (WORKTREE_TOOL register --create) and removes it behind a gate.
// A bare add is refused in COMMAND POSITION only (prose about the rail passes: the CLAUDE-P lesson), whatever -c / -C / --flag
// options ride before the verb. It is refused when it targets the organism: its -C names an arsenal-ai-fc path, or with no -C
// the command names one or the shell's cwd is in it (or unknown: fail toward the law). An add on ANOTHER repo passes.
export const WORKTREE_TOOL = "C:/Users/nikhi/arsenal-audit-artifacts/campaign-2026-09/tools/v/worktree.mjs";
export const WORKTREE_ADD_RE = new RegExp(CMD_POS + "git(?:\\.exe)?(?:\\s+(?:-C\\s+(?:\"([^\"]*)\"|'([^']*)'|(\\S+))|-c\\s+\\S+|--[\\w-]+(?:=\\S+)?))*\\s+worktree\\s+add\\b", "i");
const ORGANISM_PATH_RE = /arsenal-ai-fc(?![\w-])/i;
const slashed = (s) => String(s || "").split(String.fromCharCode(92)).join("/");
export function worktreeAddOnOrganism(cmd, cwd) {
  const m = WORKTREE_ADD_RE.exec(String(cmd || ""));
  if (!m) return false;
  const dashC = m[1] ?? m[2] ?? m[3];
  if (dashC !== undefined) return ORGANISM_PATH_RE.test(slashed(dashC));
  if (ORGANISM_PATH_RE.test(slashed(cmd))) return true;
  return !cwd || ORGANISM_PATH_RE.test(slashed(cwd));
}

export function factoryDecide(payload = {}) {
  const tool = String(payload.tool_name || "");
  const input = payload.tool_input || {};
  const blob = textOf(input);
  const ov = OVERRIDE_RE.exec(blob);
  const allow = (why) => ({ decision: "allow", rail: null, why });
  const deny = (rail, why, fix) => {
    if (ov && ov[2] === rail) return { decision: "allow", rail, override: `${ov[1]}:${ov[2]}`, why: `RAIL ${rail} OVERRIDDEN by the rung's declared override ${ov[1]}:${ov[2]} — recorded, and it expires with this call` };
    return { decision: "deny", rail, why, fix, reason: `RAIL ${rail} — ${why}\n   FIX: ${fix}\n   (override, only if the rung's micro-order declares it: put ARSENAL_RAILS_OVERRIDE=<rung>:${rail} in the call itself)` };
  };

  // RAIL 1 — a fan-out with no declared ceiling.
  if (FLEET_TOOLS.includes(tool)) {
    const prompt = textOf(input.prompt ?? input.script ?? blob);
    if (!CEILING_RE.test(prompt) && !CEILING_RE.test(blob)) {
      return deny("fleet", "a fan-out was spawned with NO ceiling in its prompt — that is exactly the shape of the 16-agent fleet and of the 19-Aug corpus agents (505.02 lakh weighted, ~2× the organism's week)",
        "say the ceiling in the prompt, e.g. `ceiling: 2 lakh weighted` or `ceiling 4 agents`, or do the work in this session (LAW T: the cheapest tier that gives the same quality)");
    }
    return allow("fleet call carries a declared ceiling");
  }

  // RAIL 2 — a session's editor writing a state file.
  if (EDIT_TOOLS.includes(tool)) {
    const p = String(input.file_path || input.path || input.notebook_path || "");
    if (p && STATE_DIR_RE.test(p)) {
      return deny("state", `a session's EDITOR tried to write ${p} — every state file has ONE writer and it is an organ's CLI (the owners-only law · §10-D rule 4)`,
        "find the owner (`grep -rn \"SOLE WRITER\" scripts/*.mjs`) and go through its CLI; if no owner exists, that absence is the finding");
    }
    return allow("edit outside dressing-room/state");
  }

  // RAIL 2b + RAIL 3 — the shell.
  if (tool === "Bash" || tool === "PowerShell") {
    const cmd = String(input.command || "");
    if (CLAUDE_P_RE.test(cmd)) {
      return deny("claude-p", "`claude -p` from a session shell — that is the organism's OWN transport (L6), it runs outside the gate (L5), and its spend lands in no ledger",
        "if a lane must run, run it through its organ's CLI so the gate and the ledger see it; if this is a rung's canary, declare the override");
    }
    // a shell write into state is the same breach as an editor write, one layer down
    if (STATE_DIR_RE.test(cmd) && STATE_WRITE_RE.test(cmd)) {
      return deny("state", "a shell command writes/moves/deletes under dressing-room/state — same breach as an editor write, one layer down",
        "go through the owner organ's CLI (`grep -rn \"SOLE WRITER\" scripts/*.mjs`); reads are always fine");
    }
    // RAIL 4 — a bare git worktree add on the organism (the worktree law, forks rows 617 / 618)
    if (worktreeAddOnOrganism(cmd, payload.cwd)) {
      return deny("worktree", "a bare git worktree add on the organism repo: a checkout no record names outlives the session that made it (13 orphans found 12 Oct 2026, artifacts ledger 904; the worktree law, forks rows 617 / 618, his word #117)",
        "make it through the tool, which records the hand and the purpose: node " + WORKTREE_TOOL + " register --create <ref> --path <dir> --hand \"<name [ref]>\" --purpose \"<why>\" (and remove it with: node " + WORKTREE_TOOL + " remove --path <dir>)");
    }
    return allow("shell command clears every rail");
  }

  return allow("no rail covers this tool");
}

// ── G3 · THE STUDY RAIL ─────────────────────────────────────────────────────
// law-waiver:jugad the harness's own shell TOOL names, a closed wire vocabulary, never a subject list (forks row 649 (0))
export const SHELL_TOOLS = ["Bash", "PowerShell"];
export const STUDY_DENY = "park it: ek line, phir micro-question wapas";
/** What the study rail needs, read live: the scope verdict and — only in scope — his last prompt. FAIL-OPEN: null on any throw. */
export function studyContext(payload = {}, { dir = undefined, env = process.env } = {}) {
  try {
    const scope = studyScope({ payload, sitting: readSitting(dir), env });
    if (!scope.study || scope.legacy) return { scope, prompt: null };
    const tp = typeof payload.transcript_path === "string" ? payload.transcript_path : "";
    return { scope, prompt: tp ? lastHumanPrompt(tp) : null };
  } catch { return null; }
}
export const STUDY_LEARNSTATE_LINE = "study rail: learnstate is the boot's front door — mid-lesson re-run `node scripts/learn_digest.mjs` (or `node scripts/forge_session.mjs status`)";
export const studyRerunLine = (parts) => `study rail: re-run the study part alone → ${parts.join("; ")} ; park the rest: ek line, phir micro-question wapas`;
/** PURE — the study rail over a payload and its context. null = no opinion. */
export function studyRail(payload = {}, ctx = null) {
  const tool = String(payload.tool_name || "");
  const shell = SHELL_TOOLS.includes(tool);
  if (!shell && !EDIT_TOOLS.includes(tool) && !FLEET_TOOLS.includes(tool)) return null;   // outside the rail's matcher
  if (!ctx || !ctx.scope || !ctx.scope.study || ctx.scope.legacy) return null;           // not the sitting's host · legacy
  if (typeof ctx.prompt !== "string") return null;                                       // his prompt unreadable → fail-open
  const cls = classifyPrompt(ctx.prompt);
  if (cls.closing) return null;                                                          // /full-time's close organs run
  const cmd = shell ? String((payload.tool_input || {}).command || "") : "";
  if (shell && shellInStudySet(cmd)) return { decision: "allow", rail: "study", why: "inside the study set" };
  // forks row 811 (his #150): THE LESSON-ARTIFACT DOOR — a page FOR HIM in this session's own scratchpad is teaching, judged
  // on the TARGET by study_scope's one predicate; the factory's state rail has already run (decide), so state never gets here
  const lesson = !shell && EDIT_TOOLS.includes(tool) ? lessonArtifactOf(payload) : null;
  if (lesson) return { decision: "allow", rail: "study", lesson: true, why: lesson.why };
  const what = shell ? `\`${cmd.slice(0, 60)}\`` : tool;
  if (cls.kind === "system") return { decision: "allow", rail: "study", captain: true, why: `captain's mid-lesson engineering — his last prompt ordered it (class system), so ${what} runs; counted, never blocked (row 283 (2))` };
  const why = `${what} is system work mid-lesson and his last prompt did not order it (class ${cls.kind}) — HOW_HE_LEARNS #12 binds the model`;
  const fix = "name it in ONE line, park it, hand back the micro-question; if HE orders it, his word opens this rail (not overridable)";
  // forks row 297 (2): a study part chained to system work is named, so a capture or an axis call is never lost silently
  const rerun = shell ? studyRerun(cmd) : [];
  const again = rerun.length ? `\n   ${studyRerunLine(rerun)}` : "";
  // forks row 305 (24 Sep 2026): learnstate is the front-door read before the sitting opens; mid-lesson the pointer is the digest
  const digest = shell && /learnstate\.mjs/i.test(cmd) ? `\n   ${STUDY_LEARNSTATE_LINE}` : "";
  return { decision: "deny", rail: "study", why, fix, rerun, reason: `RAIL study — ${STUDY_DENY}\n   WHY: ${why}\n   FIX: ${fix}${again}${digest}` };
}

// THE WHOLE DECISION — the factory's rails first (a factory deny stands whatever the lesson), then the study rail.
// ctx undefined → read live (the hook); null → no study context (hermetic callers).
export function decide(payload = {}, ctx = undefined) {
  const f = factoryDecide(payload);
  if (f.decision === "deny") return f;
  let s = null;
  try { s = studyRail(payload, ctx === undefined ? studyContext(payload) : ctx); } catch { s = null; }   // fail-open
  if (!s) return f;
  return s.decision === "deny" ? s : { ...f, study: s };
}

// G0 · THE HAND-OFF'S PREDICATE — pure. `node` in command position (the CLAUDE-P rule's own
// CMD_POS, so a grep or a sentence ABOUT the command is never a call), then a path ending in
// sitting.mjs (bare, relative, or the quoted $CLAUDE_PROJECT_DIR form), then the `open` verb.
export const SITTING_OPEN_RE = new RegExp(`${CMD_POS}node(?:\\.exe)?\\s+"?[^\\s";|&]*sitting\\.mjs"?\\s+open\\b`, "i");
export function hostHandoff(payload = {}) {
  const tool = String(payload.tool_name || "");
  if (tool !== "Bash" && tool !== "PowerShell") return null;
  const cmd = String((payload.tool_input || {}).command || "");
  if (!SITTING_OPEN_RE.test(cmd)) return null;
  const sid = typeof payload.session_id === "string" ? payload.session_id : "";
  if (!/^[0-9a-f-]{36}$/i.test(sid)) return null;
  const tp = typeof payload.transcript_path === "string" ? payload.transcript_path : "";
  return ["host", "--session", sid, ...(tp ? ["--transcript", tp] : []), "--by", "rails pretooluse"];
}
const SITTING_CLI = join(HERE, "sitting.mjs");
const spawnHandoff = (args) => spawnSync(process.execPath, [SITTING_CLI, ...args], { cwd: ROOT, timeout: 5000, stdio: ["ignore", "ignore", "ignore"], windowsHide: true });

// ── unit mday (forks rows 1044 / 1050 F2 C + F7 A) · THE SKILL DOOR ────────────────────────────────────────────────────
// settings.json's PreToolUse matcher carries `Skill` from this unit. A Skill call naming the learn skill (the MODEL's invoke —
// a typed /learn arrives inline, measured on his laptop, and is the UserPromptSubmit door's) starts the day with the PAYLOAD's
// own ids: `day.mjs start --session <id> [--transcript <p>] --by hook:skill`. Two added clauses, by ruling F7:
//   · a Skill payload that is NOT learn passes UNTOUCHED — no decide(), no line, no hand-off, the normal permission flow;
//   · the Skill branch FAILS OPEN on its own error — a throw anywhere in it is swallowed and the call proceeds.
export function dayHandoff(payload = {}) {
  if (String(payload.tool_name || "") !== "Skill") return null;
  const ti = payload.tool_input || {};
  if (String(ti.skill || "") !== "learn") return null;
  const sid = typeof payload.session_id === "string" ? payload.session_id : "";
  if (!/^[0-9a-f-]{36}$/i.test(sid)) return null;
  const tp = typeof payload.transcript_path === "string" ? payload.transcript_path : "";
  return ["start", "--session", sid, ...(tp ? ["--transcript", tp] : []), "--by", "hook:skill"];
}
// DETACHED, never waited: a sitting's open gathers its context (sitting.mjs gatherPlanContext), which no hook bound should cut in
// half, and the Skill call must not wait on it. The child holds the owner lock for its own write; a second door JOINs.
const spawnDayHandoff = (args) => { const c = spawn(process.execPath, [join(HERE, "day.mjs"), ...args], { cwd: ROOT, detached: true, stdio: "ignore", windowsHide: true }); c.unref(); };

// ── ROW 814 · THE BLIND LEDGER — rails' one file (forks rows 814 (1), 822 (2), 827 (1)) ──────────────
// One row per BLIND call (a call the rail read no payload for): { ts, why, read_ms, rail_ms, free_mb } — the refusal's own why,
// how long the read waited, how long this process had lived (the rail's own duration, boot included: row 822 (2)), and the
// free memory at that instant (no organ logged it at runtime, so row 822 could not read the minutes of his 39 refusals).
export const RAILS_BLIND_FILE = join(ROOT, "dressing-room", "state", "rails_blind.jsonl");
export const RAILS_BLIND_ENV = "ARSENAL_RAILS_BLIND_FILE";
// PURE — which file a blind row goes to. The env door is honoured ONLY when it resolves strictly under the OS temp dir (the
// selftests' door; lexical, after resolve(), so `..` cannot climb out); any other value is ignored and the real ledger stands.
export function railsBlindFile(env = process.env) {
  const v = env && typeof env[RAILS_BLIND_ENV] === "string" ? env[RAILS_BLIND_ENV].trim() : "";
  if (!v) return RAILS_BLIND_FILE;
  const fold = (p) => (process.platform === "win32" ? p.toLowerCase() : p);
  const want = resolve(v);
  return fold(want).startsWith(fold(resolve(tmpdir())) + sep) ? want : RAILS_BLIND_FILE;
}
// ONE DOOR for the ledger's two writes, the birth and the append: one open, one write, one close.
function blindDoor(file, flag, text) {
  const fd = openSync(file, flag);
  try { if (text) writeSync(fd, text); } finally { closeSync(fd); }
}
const APPEND_NEVER_CREATE = FS.O_WRONLY | FS.O_APPEND;   // no O_CREAT: a blind row never gives birth to the ledger
const rowsOf = (file) => { try { return readFileSync(file, "utf8").split("\n").filter((l) => l.trim()).length; } catch { return null; } };
// Appends ONE row; NEVER throws — a failed write is one stderr line and the call proceeds (this rail's declared fail-open).
export function recordBlind({ why, readMs, env = process.env } = {}) {
  const file = railsBlindFile(env);
  try {
    const row = { ts: new Date().toISOString(), why: String(why || ""), read_ms: Number.isFinite(readMs) ? Math.round(readMs) : null, rail_ms: Math.round(process.uptime() * 1000), free_mb: Math.round(freemem() / 1048576) };
    blindDoor(file, APPEND_NEVER_CREATE, JSON.stringify(row) + "\n");
    return { ok: true, file, row };
  } catch (e) {
    const why2 = e && e.code === "ENOENT" ? "the ledger is not born — `node scripts/rails.mjs born`" : String((e && e.message) || e).slice(0, 160);
    try { process.stderr.write(`rails: blind row NOT recorded (${why2}) · ${file}\n`); } catch { /* the call proceeds either way */ }
    return { ok: false, file, why: why2 };
  }
}
// The ledger's BIRTH: created EMPTY by an exclusive create, never truncated — a second birth says `already born` and changes
// nothing. The CLI `born` prints this one line; exit 0 both ways (1 only when the birth itself fails, e.g. no state dir).
export function bornBlind({ env = process.env } = {}) {
  const file = railsBlindFile(env);
  try {
    blindDoor(file, "wx", "");
    return { born: true, file, line: `rails: born ${file} — empty, by an exclusive create (one row per blind call from here on, row 814)` };
  } catch (e) {
    if (e && e.code === "EEXIST") return { born: false, file, line: `rails: already born ${file} — ${rowsOf(file) ?? "?"} row(s), untouched (a birth never truncates)` };
    return { born: false, file, error: (e && e.code) || "error", line: `rails: born REFUSED — ${String((e && e.message) || e).slice(0, 160)}` };
  }
}
// A BLIND CALL (row 814): no payload ⇒ no decision, this rail's declared fail-open, now COUNTED. The refusal line is written
// FIRST — study_rail_replay counts a hook row blind by its stderr's first words — then the ledger row.
function blindCall(why, readMs) {
  process.stderr.write(`rails: REFUSED — ${why}. No payload ⇒ no decision; the tool call proceeds under the normal permission flow (this rail's declared fail-open). To exercise a rail by hand use \`node scripts/rails.mjs decide '<json>'\`.\n`);
  recordBlind({ why, readMs });
  return { decision: "allow", rail: null, why: `stdin refusal: ${why}` };
}

// THE HOOK — Claude Code's PreToolUse contract: a JSON decision on stdout, exit 0.
// ⛔ fd 0 IS NEVER READ BLINDLY (rung S5-R, 20 Aug 2026). The first version called
//   `readFileSync(0)` whenever stdin was not a TTY — the EXACT defect S5 STEP 0 fixed in
//   session_meter, alive in the rail organ itself, proven live at S5-R: `pretooluse` on a
//   non-closing pipe blocked the full timeout window (exit 124). The live hook path is
//   unchanged (Claude Code writes the payload and CLOSES stdin ⇒ the drain returns it);
//   only the hang case changes, from a forever-block into a LOUD fast refusal that
//   fail-opens — which is this rail's declared failure mode ("if this organ throws, the
//   tool proceeds"), now reached in 300 ms instead of never.
// ROW 827 (1): the HOOK no longer reads here. main()'s `pretooluse` reads fd 0 in-process, bounded by silence, and hands the
//   bytes on as `raw` — or the refusal as `refused` (its why names the silence bound) with `readMs`, which this function counts
//   as a BLIND call (blindCall: the same line, ONE ledger row, the same fail-open allow). It stays SYNCHRONOUS. The deadline
//   read below is kept for a direct caller that hands nothing (L9), and a refusal there is counted the same way.
export function pretooluse({ raw = null, refused = null, readMs = null, handoff = spawnHandoff, ctx = undefined, dayHand = spawnDayHandoff } = {}) {
  let payload = {};
  try {
    const handed = globalThis.__ARSENAL_HOOK_STDIN__;
    let text;
    if (raw !== null) text = raw;
    else if (typeof refused === "string") return blindCall(refused, readMs);
    else if (typeof handed === "string") text = handed;
    else if (process.stdin.isTTY) text = "";
    else {
      const t0 = performance.now();
      const r = readStdinWithDeadline();
      if (!r.ok) return blindCall(r.why, performance.now() - t0);
      text = r.raw;
    }
    payload = text && text.trim() ? JSON.parse(text) : {};
  } catch { payload = {}; }
  // unit mday (F7 A): the Skill branch, BEFORE decide() — every Skill call returns here, allowed and silent
  if (payload && payload.tool_name === "Skill") {
    const out = { decision: "allow", rail: null, why: "Skill — passes untouched" };
    try { const h = dayHandoff(payload); if (h) { dayHand(h); out.handoff = h; out.why = "Skill(learn) — the day's start handed to day.mjs"; } } catch (e) { out.why = `Skill branch failed open: ${String((e && e.message) || e).slice(0, 80)}`; }
    return out;
  }
  const d = decide(payload, ctx);
  if (d.decision === "deny") {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: d.reason } }) + "\n");
    return d;
  }
  if (d.override) process.stderr.write(`rails: ${d.why}\n`);
  if (d.study && (d.study.captain || d.study.lesson)) process.stderr.write(`rails: study · ${d.study.why}\n`);
  // G0 — only on an ALLOWED call (a denied one never runs, so it opens nothing).
  try { const h = hostHandoff(payload); if (h) { handoff(h); d.handoff = h; } } catch { /* fail-open: the call proceeds either way */ }
  return d;   // silence = the tool proceeds under the normal permission flow
}

// ── (c) THE ORDER-CHECKER — §3-C, mechanised, over every order file ─────────
export const ORDER_DIR = join(ROOT, "docs", "archive");
// BY PREDICATE, NEVER A LIST (S3's jugad rule): an order file is a docs/archive/*.md
// whose head carries the handoff block every order in this repo opens with.
export function orderFiles(dir = ORDER_DIR) {
  let names = []; try { names = readdirSync(dir); } catch { return []; }
  return names.filter((f) => f.endsWith(".md")).map((f) => join(dir, f))
    .filter((p) => { try { return readFileSync(p, "utf8").slice(0, 4000).includes("RESUME HERE"); } catch { return false; } });
}

// §3-C's own check asked only for a QUOTED verb, and it was wrong on its very first
// run here: `node scripts/organism_test.mjs suites` was reported missing because that
// organ dispatches through a lookup table (`const MODES = { …, suites, … }`), and the
// verb runs perfectly. §4's law binds this instrument like every other — a finding is a
// LEAD until one run verifies it, and that run said false. So the check NARROWS: a verb
// is present if it is quoted, OR is a function of that name, OR is a key in a dispatch
// object. A dashed verb cannot be an identifier, so only the quoted form counts there.
export function hasVerb(src, verb) {
  if (src.includes(JSON.stringify(verb)) || src.includes(`'${verb}'`) || src.includes(`\`${verb}\``)) return true;
  // THE ORGAN'S OWN CLI LINE is the third shape, and it caught a third false positive:
  // `fuelboard.mjs status` is the DEFAULT mode (no literal is ever compared), so a
  // literal-only check calls a working verb missing. Every organ here declares its verbs
  // on one `CLI:` line by convention — that declaration counts.
  // (the caller's own pattern limits a verb to [a-z-]+, so no escaping is possible here)
  if (/^[a-z-]+$/.test(verb)) for (const m of src.matchAll(/^\s*\/\/\s*CLI:.*$/gm)) if (new RegExp(`(?:^|[^A-Za-z0-9_-])${verb}(?:[^A-Za-z0-9_-]|$)`).test(m[0])) return true;
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(verb)) return false;
  return new RegExp(`(?:function\\s+${verb}\\s*\\(|[{,]\\s*${verb}\\s*[,}:])`).test(src);
}

// Does git track ANYTHING under this path's top-level directory? Memoised; a git that
// cannot answer leaves the check strict (the stricter direction is the safe one).
const _topCache = new Map();
export function tracksTop(rel, root = ROOT) {
  const top = String(rel).split("/")[0];
  if (!top || top === "." || top === "..") return true;
  if (_topCache.has(top)) return _topCache.get(top);
  let tracked = true;
  try { tracked = execFileSync("git", ["ls-files", "--", top], { cwd: root, encoding: "utf8", timeout: 8000, windowsHide: true }).trim().length > 0; } catch { tracked = true; }
  _topCache.set(top, tracked);
  return tracked;
}

export function checkOrder(path, { root = ROOT } = {}) {
  const bad = [];
  const fail = (m) => bad.push(m);
  let buf; try { buf = readFileSync(path); } catch (e) { return { path, problems: [`unreadable: ${String(e.message || e)}`] }; }
  const s = buf.toString("utf8");
  if (Buffer.compare(Buffer.from(s, "utf8"), buf) !== 0) fail("not valid UTF-8");
  if ((s.match(/\uFFFD/g) || []).length) fail("replacement chars — an edit corrupted bytes");
  if ((s.match(/^```/gm) || []).length % 2) fail("unbalanced code fence");
  // Every § reference resolves to a heading in the SAME document — but only for a
  // document that uses the §-heading convention itself. ORGANISM_OVERHAUL's §13/§19 point
  // at ANOTHER document's sections, and a checker that calls those "no such section"
  // is reporting its own assumption, not a defect (§4: an instrument's finding is a LEAD).
  const heads = new Set([...s.matchAll(/^##+\s+§([0-9A-Za-z-]+)/gm)].map((m) => m[1]));
  if (heads.size) for (const r of new Set([...s.matchAll(/§([0-9]+(?:-[0-9A-Za-z]+)?)/g)].map((m) => m[1]))) if (!heads.has(r)) fail(`references §${r} — no such section`);
  // paths the document declares ABSENT ON PURPOSE (a finding, not a path)
  const absentOk = new Set([...s.matchAll(/<!--\s*order-check:absent-ok\s+([^\s>]+)\s*-->/g)].map((m) => m[1]));
  for (const m of s.matchAll(/`([A-Za-z0-9_\/.-]+\.(?:mjs|md|json|jsonl|vbs|bat|ps1|yml|yaml))`/g)) {
    const rel = m[1];
    if (!rel.includes("/") || absentOk.has(rel)) continue;
    // A path under a top-level directory GIT DOES NOT TRACK is a runtime OUTPUT
    // (brain_out/, wall_out/, scout_reports/, cold/, a dated vault …), not a repo file.
    // Asking whether tonight's poster exists is not a document check; git decides this,
    // so the rule stays a rule and never becomes a hardcoded list of directories.
    if (!tracksTop(rel, root)) continue;
    if (!existsSync(join(root, rel))) fail(`names missing file ${rel}`);
  }
  // every `node scripts/X.mjs <verb>` exists AND the organ really has that verb
  for (const [, organ, verb] of s.matchAll(/node scripts\/([a-z_]+)\.mjs ([a-z-]+)/g)) {
    const f = join(root, "scripts", `${organ}.mjs`);
    if (!existsSync(f)) { fail(`command names scripts/${organ}.mjs — absent`); continue; }
    if (!hasVerb(readFileSync(f, "utf8"), verb)) fail(`${organ}.mjs has no verb ${verb}`);
  }
  return { path, problems: bad };
}

// WHICH ORDER THE COMMIT GATE BLOCKS ON. Every order file is CHECKED; the gate BLOCKS
// on the OPEN one. §10-H: "a closed record is never edited" — so a record's legacy
// findings may never hold his commits hostage, and they are reported as LEADS instead.
// 25 Aug 2026 (S5-R2 · architect ruling RULING__2026-08-25_0805-s5pre-1): the resolver reads
// a DECLARED contract line first — `ORDER-GATE: docs/archive/<name>.md` on its own line in
// CLAUDE.md. The legacy phrase match below was a load-bearing match on REWRITABLE PROSE and
// it died SILENTLY the day CLAUDE.md was reworded (dead 20-25 Aug: open null, blocking
// permanently 0, the pre-commit hook ran and could never say no — it let a real violation
// land). The legacy phrase STAYS as a fallback (L9 — layered, never replaced). The gate
// blocks on the ENGINEERING order only; other orders on-board via S10's registry row,
// never by a surprise blocking gate. S10 later absorbs this line as a registry pointer.
// The resolver is a PURE CORE (text in, relative path or null out) with a thin fs shell —
// the Q-8 precedent, same day: the selftest then proves the core on plain strings and adds
// no fs sinks for xray to lose track of. The LIVE wiring (file → core → gate → hook) was
// bite-proven end to end at S5-R2 and is recorded in the order's PROGRESS.
export function resolveOrderGate(s) {
  const g = /^ORDER-GATE:\s*(\S+\.md)\s*$/m.exec(s);
  if (g) return g[1];
  const m = /THE OPEN WORK ORDER:?\*{0,2}:?\s*`([^`]+\.md)`/.exec(s);
  return m ? m[1] : null;
}
export function openOrder(root = ROOT) {
  try {
    const rel = resolveOrderGate(readFileSync(join(root, "CLAUDE.md"), "utf8"));
    return rel ? join(root, rel) : null;
  } catch { return null; }
}

export function checkOrders({ dir = ORDER_DIR, root = ROOT } = {}) {
  const files = orderFiles(dir);
  const open = openOrder(root);
  const results = files.map((f) => ({ ...checkOrder(f, { root }), open: !!open && resolve(f) === resolve(open) }));
  return {
    files: files.length, results, open,
    problems: results.reduce((a, r) => a + r.problems.length, 0),
    blocking: results.filter((r) => r.open).reduce((a, r) => a + r.problems.length, 0),
  };
}

// ── SELFTEST — hermetic: synthetic payloads and a temp order file ───────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c, d) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${n}${c || !d ? "" : `\n      ${d}`}`); };
  const D = (tool, input) => decide({ tool_name: tool, tool_input: input }, null);   // hermetic: no study context

  // RAIL 1 — the fleet
  assert("FLEET — an Agent call with no ceiling in the prompt is DENIED",
    D("Agent", { prompt: "read the whole corpus and report" }).decision === "deny");
  assert("FLEET — the deny names the rail, the accident, and the compliant form",
    /RAIL fleet/.test(D("Agent", { prompt: "go" }).reason) && /ceiling: 2 lakh weighted/.test(D("Agent", { prompt: "go" }).reason));
  assert("FLEET — `ceiling: 2 lakh weighted` in the prompt is ALLOWED",
    D("Agent", { prompt: "read X. ceiling: 2 lakh weighted." }).decision === "allow");
  assert("FLEET — `ceiling 4 agents` is ALLOWED too (any unit he uses)",
    D("Task", { prompt: "fan out — ceiling 4 agents" }).decision === "allow");
  assert("FLEET — a Workflow script with no ceiling is DENIED (dozens of agents is the same class)",
    D("Workflow", { script: "export const meta = {}; parallel(...)" }).decision === "deny");
  assert("FLEET — the word alone, with no number, is NOT a ceiling",
    D("Agent", { prompt: "keep the ceiling in mind" }).decision === "deny");

  // RAIL 2 — the owners-only law at session level
  assert("STATE — an editor write under dressing-room/state is DENIED",
    D("Write", { file_path: "C:/x/dressing-room/state/sitting.json" }).decision === "deny");
  assert("STATE — Windows backslashes are the same path", D("Edit", { file_path: "C:\\x\\dressing-room\\state\\brain_ledger.jsonl" }).decision === "deny");
  assert("STATE — the deny sends him to the OWNER, not to a workaround",
    /SOLE WRITER/.test(D("Write", { file_path: "dressing-room/state/a.json" }).reason));
  assert("STATE — a write anywhere else is untouched", D("Write", { file_path: "scripts/foo.mjs" }).decision === "allow");
  assert("STATE — docs are untouched", D("Edit", { file_path: "docs/archive/ORGANISM_AUDIT__2026-08-19.md" }).decision === "allow");
  assert("STATE — a shell REDIRECT into state is DENIED (same breach, one layer down)",
    D("Bash", { command: "echo x > dressing-room/state/cards.json" }).decision === "deny");
  assert("STATE — READING a state file from the shell is always fine",
    D("Bash", { command: "cat dressing-room/state/cards.json | head -5" }).decision === "allow");
  assert("STATE — a document that merely TALKS about removing a state file is prose, not a write",
    D("Bash", { command: 'echo "the owner, not a session, may rm dressing-room/state/x.json"' }).decision === "allow");
  // S6-F · F-07 — PINNED BOTH WAYS. `sed` counted as a write regardless of its flags, so a
  // pager over a state path was refused with "reads are always fine" in the refusal text.
  assert("STATE — `sed -n` over a state path is a PAGER, not a write (F-07, 28 Aug 2026)",
    D("Bash", { command: "sed -n '258p' dressing-room/state/cards.json" }).decision === "allow");
  assert("STATE — …and `sed -i` on the same path still REFUSES (the fix narrows, it does not blunt)",
    D("Bash", { command: "sed -i 's/a/b/' dressing-room/state/cards.json" }).decision === "deny");
  assert("STATE — `sed -n` mid-chain, the shape that actually bit S6-R, is allowed",
    D("Bash", { command: "node x.mjs --probe dressing-room/state/afferent.jsonl write && sed -n '1,5p' scripts/learnstate.mjs" }).decision === "allow");
  assert("STATE — an owner CLI that writes its own state file is fine (it IS the owner)",
    D("Bash", { command: "node scripts/captains_call.mjs file --line 'x'" }).decision === "allow");

  // RAIL 3 — claude -p from a session shell
  assert("CLAUDE-P — `claude -p \"…\"` from a session shell is DENIED", D("Bash", { command: 'claude -p "summarise this"' }).decision === "deny");
  assert("CLAUDE-P — `--print` is the same call", D("Bash", { command: "claude --model haiku --print hi" }).decision === "deny");
  assert("CLAUDE-P — it is caught inside a pipeline too", D("Bash", { command: "cat x | claude -p 'go'" }).decision === "deny");
  assert("CLAUDE-P — an inline env assignment does not smuggle it past command position",
    D("Bash", { command: "ARSENAL_ORGAN=1 claude --print hi" }).decision === "deny");
  assert("CLAUDE-P — a short-circuited call is still a call in command position (the zero-risk canary)",
    D("Bash", { command: 'false && claude -p "canary"' }).decision === "deny");
  assert("CLAUDE-P — PROSE about the rail is NOT a call (it once refused a session writing its own PROGRESS entry)",
    D("Bash", { command: 'echo "the rail refuses claude -p from a session shell"' }).decision === "allow");
  assert("CLAUDE-P — a PowerShell call is the same call", D("PowerShell", { command: "claude -p 'go'" }).decision === "deny");
  assert("CLAUDE-P — the word `claude` in a path is NOT a call", D("Bash", { command: "ls ~/.claude/projects" }).decision === "allow");
  assert("CLAUDE-P — an organ's own CLI is never touched", D("Bash", { command: "node scripts/brain.mjs status" }).decision === "allow");

  // RAIL 4 — THE WORKTREE LAW (forks rows 617 / 618, his word #117), planted both ways
  assert("WORKTREE — a bare git worktree add (no -C, no cwd known) is DENIED", D("Bash", { command: "git worktree add --detach C:/tmp/wt HEAD" }).decision === "deny");
  assert("WORKTREE — git -C <the organism> worktree add is DENIED", D("Bash", { command: "git -C C:/Users/nikhi/GitHub/arsenal-ai-fc worktree add C:/tmp/wt main" }).decision === "deny");
  assert("WORKTREE — a -c option and a quoted -C do not smuggle it past", D("Bash", { command: 'git -c core.longpaths=true -C "C:/Users/nikhi/GitHub/arsenal-ai-fc" worktree add --detach C:/tmp/wt main' }).decision === "deny");
  assert("WORKTREE — a PowerShell call is the same call", D("PowerShell", { command: "git worktree add C:/tmp/wt main" }).decision === "deny");
  assert("WORKTREE — after cd into the organism in a chain it is still a call", D("Bash", { command: "cd C:/Users/nikhi/GitHub/arsenal-ai-fc && git worktree add ../wt main" }).decision === "deny");
  const wtd = D("Bash", { command: "git worktree add C:/tmp/wt main" });
  assert("WORKTREE — the deny names the rail and the tool's register verb", wtd.rail === "worktree" && /RAIL worktree/.test(wtd.reason) && /tools\/v\/worktree\.mjs register --create/.test(wtd.reason), JSON.stringify(wtd));
  assert("WORKTREE — the tool itself is never touched", D("Bash", { command: 'node C:/Users/nikhi/arsenal-audit-artifacts/campaign-2026-09/tools/v/worktree.mjs register --create main --path C:/tmp/wt --hand "x [aaaaaa]" --purpose "p"' }).decision === "allow");
  assert("WORKTREE — list and prune are not an add", D("Bash", { command: "git worktree list --porcelain" }).decision === "allow" && D("Bash", { command: "git worktree prune" }).decision === "allow");
  assert("WORKTREE — an add on ANOTHER repo (-C outside the organism) passes", D("Bash", { command: "git -C C:/Users/nikhi/arsenal-audit-artifacts worktree add C:/tmp/wt main" }).decision === "allow");
  assert("WORKTREE — the shell's cwd in another repo with no organism path passes", decide({ tool_name: "Bash", tool_input: { command: "git worktree add C:/tmp/wt main" }, cwd: "C:/Users/nikhi/arsenal-audit-artifacts" }, null).decision === "allow");
  assert("WORKTREE — the shell's cwd in the organism is DENIED", decide({ tool_name: "Bash", tool_input: { command: "git worktree add C:/tmp/wt main" }, cwd: "C:/Users/nikhi/GitHub/arsenal-ai-fc" }, null).decision === "deny");
  assert("WORKTREE — PROSE about the rail is NOT a call", D("Bash", { command: 'echo "the rail refuses git worktree add on the organism"' }).decision === "allow");
  assert("WORKTREE — the declared override opens this rail the same way", D("Bash", { command: "ARSENAL_RAILS_OVERRIDE=S12:worktree git worktree add C:/tmp/wt main" }).decision === "allow");

  // THE OVERRIDE — declared in the call, per rail, and it SAYS so
  const ov = D("Bash", { command: "ARSENAL_RAILS_OVERRIDE=S12:claude-p claude -p 'canary'" });
  assert("OVERRIDE — the rung's declared override lets its own canary through", ov.decision === "allow" && ov.override === "S12:claude-p", JSON.stringify(ov));
  assert("OVERRIDE — an override for a DIFFERENT rail does not open this one",
    D("Bash", { command: "ARSENAL_RAILS_OVERRIDE=S12:fleet claude -p 'no'" }).decision === "deny");
  assert("OVERRIDE — it opens the fleet rail the same way",
    D("Agent", { prompt: "go wide — ARSENAL_RAILS_OVERRIDE=S6:fleet" }).decision === "allow");

  // THE UNCOVERED TOOLS stay uncovered — a rail that denies everything gets uninstalled
  for (const t of ["Read", "Grep", "Glob", "WebSearch", "TodoWrite"]) assert(`PASS-THROUGH — ${t} is not a rail's business`, D(t, {}).decision === "allow");

  // THE HOOK SHAPE — Claude Code's PreToolUse contract, byte-checked
  const out = [];
  const w = process.stdout.write.bind(process.stdout);
  process.stdout.write = (s) => { out.push(s); return true; };
  try { pretooluse({ raw: JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Agent", tool_input: { prompt: "go" } }) }); } finally { process.stdout.write = w; }
  let j = null; try { j = JSON.parse(out.join("")); } catch { /* asserted next */ }
  assert("HOOK — a deny prints exactly the PreToolUse decision object",
    j && j.hookSpecificOutput && j.hookSpecificOutput.hookEventName === "PreToolUse" && j.hookSpecificOutput.permissionDecision === "deny" && /RAIL fleet/.test(j.hookSpecificOutput.permissionDecisionReason), out.join(""));
  const out2 = [];
  process.stdout.write = (s) => { out2.push(s); return true; };
  try { pretooluse({ raw: JSON.stringify({ tool_name: "Read", tool_input: { file_path: "x" } }) }); } finally { process.stdout.write = w; }
  assert("HOOK — an allow prints NOTHING (silence = the normal permission flow)", out2.join("") === "");
  const out3 = [];
  process.stdout.write = (s) => { out3.push(s); return true; };
  try { pretooluse({ raw: "{not json" }); } finally { process.stdout.write = w; }
  assert("HOOK — junk on stdin never blocks a tool call (fail-open, deliberately)", out3.join("") === "");

  // G0 (23 Sep 2026, ruling R7) — THE HAND-OFF, planted both ways
  {
    const SID = "0d9b6b3b-1111-2222-3333-444444444444";
    const P = (tool, command, extra = {}) => ({ tool_name: tool, tool_input: { command }, session_id: SID, transcript_path: "C:/t/x.jsonl", ...extra });
    const hit = (p) => !!hostHandoff(p);
    assert("G0 HAND-OFF — the /learn boot's own line hands the payload ids to `sitting.mjs host`",
      JSON.stringify(hostHandoff(P("Bash", 'node scripts/sitting.mjs open --surface code --no-spawn --task "tokenization axis c"')))
        === JSON.stringify(["host", "--session", SID, "--transcript", "C:/t/x.jsonl", "--by", "rails pretooluse"]));
    assert("G0 HAND-OFF — the anchored quoted path, a head-of-chain cd, and PowerShell are the same call",
      hit(P("Bash", 'node "$CLAUDE_PROJECT_DIR/scripts/sitting.mjs" open --surface code')) && hit(P("Bash", "cd C:/x && node scripts/sitting.mjs open")) && hit(P("PowerShell", "node scripts\\sitting.mjs open --no-spawn")));
    assert("G0 HAND-OFF — a mention is not a call (grep, echo, a quoted sentence), and another verb of sitting is not `open`",
      !hit(P("Bash", 'grep -n "node scripts/sitting.mjs open" .claude/skills/learn/SKILL.md')) && !hit(P("Bash", "echo run sitting.mjs open later"))
      && !hit(P("Bash", "node scripts/sitting.mjs status")) && !hit(P("Bash", "node scripts/sitting.mjs opener")));
    assert("G0 HAND-OFF — no session id on the payload (or a non-id) hands nothing; a non-shell tool hands nothing",
      !hit(P("Bash", "node scripts/sitting.mjs open", { session_id: undefined })) && !hit(P("Bash", "node scripts/sitting.mjs open", { session_id: "selftest" }))
      && !hostHandoff({ tool_name: "Write", tool_input: { file_path: "x", content: "node scripts/sitting.mjs open" }, session_id: SID }));
    assert("G0 HAND-OFF — no transcript on the payload still hands the session id",
      JSON.stringify(hostHandoff(P("Bash", "node scripts/sitting.mjs open", { transcript_path: undefined }))) === JSON.stringify(["host", "--session", SID, "--by", "rails pretooluse"]));
    const got = [], o4 = [];
    process.stdout.write = (s) => { o4.push(s); return true; };
    try {
      pretooluse({ raw: JSON.stringify(P("Bash", "node scripts/sitting.mjs open --surface code --no-spawn")), handoff: (a) => got.push(a) });
      pretooluse({ raw: JSON.stringify(P("Bash", "node scripts/sitting.mjs status")), handoff: (a) => got.push(a) });
      pretooluse({ raw: JSON.stringify(P("Bash", "claude -p go && node scripts/sitting.mjs open")), handoff: (a) => got.push(a) });
      pretooluse({ raw: JSON.stringify(P("Bash", "node scripts/sitting.mjs open")), handoff: () => { throw new Error("spawn failed"); } });
    } finally { process.stdout.write = w; }
    assert("G0 HOOK — the hook runs the hand-off exactly once for the open call, never for another verb, never for a DENIED call; stdout stays the decision alone",
      got.length === 1 && got[0][0] === "host" && got[0][2] === SID && o4.length === 1 && /RAIL claude-p/.test(o4[0]), JSON.stringify({ got, o4 }));
    assert("G0 HOOK — a hand-off that throws costs the call nothing (fail-open, no stdout)", o4.length === 1);
  }

  // G3 · THE STUDY RAIL (24 Sep 2026, forks row 283 (2)) — every clause planted both ways, on a pure ctx
  {
    const SID = "5dc8436e-f788-4483-bf15-564a89ec7aaf", OTHER = "9e29b88c-0000-1111-2222-333333333333";
    const IN = (prompt) => ({ scope: { study: true, why: "payload session is the open sitting's host" }, prompt });
    const ANSWER = "pakka - pay aur ment alag tokens", ORDERED = "ruk — pehle hook fix karo, rails ka system dekho", CLOSE = "<command-message>full-time</command-message>\n<command-name>/full-time</command-name>";
    const CP = ["claude", "-p", "go"].join(" ");   // built, so this file never carries the call in command position
    const P = (tool, input) => ({ tool_name: tool, tool_input: input, session_id: SID, transcript_path: "C:/t/x.jsonl" });
    const S = (tool, input, ctx) => decide(P(tool, input), ctx);
    const XRAY = { command: "node scripts/xray.mjs report" };
    const d0 = S("Bash", XRAY, IN(ANSWER));
    assert("STUDY — mid-lesson system work the model started (his last prompt an answer) is DENIED, rail `study`, and the reason opens with the park line",
      d0.decision === "deny" && d0.rail === "study" && d0.reason.split("\n")[0] === `RAIL study — ${STUDY_DENY}` && STUDY_DENY === "park it: ek line, phir micro-question wapas", JSON.stringify(d0));
    assert("STUDY — …and an owner CLI of the study set in the same lesson is ALLOWED (the rail names itself, no captain flag)",
      (() => { const d = S("Bash", { command: 'node scripts/forge_session.mjs pointer "axis c merge"' }, IN(ANSWER)); return d.decision === "allow" && d.study && d.study.rail === "study" && !d.study.captain; })());
    assert("STUDY — PowerShell is the same shell: outside the set DENIED, a canon read ALLOWED",
      S("PowerShell", { command: "git status" }, IN(ANSWER)).decision === "deny" && S("PowerShell", { command: "Get-Content learning-layer/HOW_HE_LEARNS.md | Select-Object -First 40" }, IN(ANSWER)).decision === "allow");
    assert("STUDY — an allowed organ CHAINED to system work is DENIED (the whole-string hole, closed); the organ alone passes",
      S("Bash", { command: "node scripts/forge_session.mjs pointer x && node scripts/xray.mjs report" }, IN(ANSWER)).decision === "deny"
      && S("Bash", { command: "node scripts/forge_session.mjs pointer x" }, IN(ANSWER)).decision === "allow");
    // G3 v2 · THE NEUTRAL SHAPES + THE CHAIN RULE (forks row 297) — at the rail, both ways
    const CAP_C = 'node scripts/gaffer_brain.mjs capture voice_rep tokenization:c --axis c --gut guessed --asked "ek round mein factory poore corpus ke saare adjacent pairs ek saath gin ke sirf sabse common ek pair jodti hai, ya ek-ek letter utha ke uske pairs ginti hai?" --said "pata nahi - i have no clue. i am confused about the jargons you are using, what do you mean by factory here?" --probe reconstruct --surface code';
    const dC = S("PowerShell", { command: `${CAP_C}; node scripts/teaching_contract.mjs 2>&1 | Select-Object -First 40` }, IN(ANSWER));
    assert("STUDY · CHAIN RULE — shape C (a capture chained to an out-of-set read) is DENIED and the deny text names the capture to re-run alone, then the park line",
      dC.decision === "deny" && dC.rerun.length === 1 && dC.rerun[0] === CAP_C && dC.reason.includes(`study rail: re-run the study part alone → ${CAP_C} ; park the rest: ek line, phir micro-question wapas`)
      && d0.rerun.length === 0 && !/re-run the study part/.test(d0.reason), JSON.stringify(dC));
    const BOLO = "said=$(cat <<'EOF'\npakka - subword beech ka rasta\nEOF\n)\nnode scripts/gaffer_brain.mjs capture voice_rep tokenization:b --axis b --gut knew --said \"$said\" --surface code && node scripts/forge_session.mjs axis b done";
    assert("STUDY · NEUTRAL — his Bolo through a quoted heredoc and an organ piped into sed -n | tail | head are ALLOWED mid-lesson; the 7 Sep shapes (xray, an Edit) stay DENIED",
      S("Bash", { command: BOLO }, IN(ANSWER)).decision === "allow" && S("Bash", { command: "node scripts/forge_session.mjs axis c now && node scripts/learn_digest.mjs | sed -n '/^POSITION/,/^THE TRAPS/p' | tail -n +2 | head -20" }, IN(ANSWER)).decision === "allow"
      && S("Bash", XRAY, IN(ANSWER)).decision === "deny" && S("Edit", { file_path: "scripts/rails.mjs" }, IN(ANSWER)).decision === "deny"
      && S("Bash", { command: "node scripts/learn_digest.mjs | sed -i s/a/b/" }, IN(ANSWER)).decision === "deny");
    const never = [["Write", { file_path: "scripts/foo.mjs", content: "x" }], ["Edit", { file_path: "learning-layer/NOTES.md" }], ["MultiEdit", { file_path: "scripts/a.mjs" }],
      ["Agent", { prompt: "read it — ceiling 2 agents" }], ["Task", { prompt: "go — ceiling 1 agent" }], ["Workflow", { script: "x — ceiling: 3 agents" }]];
    // ~~ (24 Sep 2026, rewritten by forks row 811 on 18 Oct 2026; kept, struck — L9) "STUDY — Write / Edit / MultiEdit / Agent / Task /
    // ~~ Workflow are NEVER in the set (a fleet WITH its ceiling clears the factory and is still denied mid-lesson)"
    assert("STUDY — Write / Edit / MultiEdit / Agent / Task / Workflow are NEVER in the set outside the lesson-artifact door of row 811 (a fleet WITH its ceiling clears the factory and is still denied mid-lesson; a Write into his repo or an Edit of his notes is still denied)",
      never.every(([t, i]) => S(t, i, IN(ANSWER)).decision === "deny" && S(t, i, IN(ANSWER)).rail === "study") && never.every(([t, i]) => S(t, i, null).decision === "allow"),
      JSON.stringify(never.map(([t, i]) => [t, S(t, i, IN(ANSWER)).decision])));
    // forks row 811 (his #150) — THE LESSON-ARTIFACT DOOR at the rail, both ways, on the measured recap page's shape
    {
      const TMPF = String(process.getBuiltinModule("node:os").tmpdir()).split(String.fromCharCode(92)).join("/");
      const PAD = (sid) => `${TMPF}/claude/C--Users-nikhi-GitHub-arsenal-ai-fc/${sid}/scratchpad`;
      const RECAP = { file_path: `${PAD(SID)}/inference__axis-a-kya-analogy__2026-10-18.html`, content: "<html>seven ideas</html>" };
      const dR = S("Write", RECAP, IN(ANSWER)), dE = S("Edit", { file_path: RECAP.file_path, old_string: "a", new_string: "b" }, IN(ANSWER));
      assert("STUDY · LESSON ARTIFACT (row 811) — his recap page written into THIS session's own scratchpad after his ANSWER is ALLOWED (rail study, the lesson flag, no captain flag), and so is an Edit of it",
        dR.decision === "allow" && dR.study && dR.study.rail === "study" && dR.study.lesson === true && !dR.study.captain && /lesson artifact/.test(dR.study.why)
        && dE.decision === "allow" && dE.study && dE.study.lesson === true, JSON.stringify([dR, dE]));
      assert("STUDY · LESSON ARTIFACT (row 811) — …both ways: the same page in ANOTHER session's scratchpad, a .mjs in his own scratchpad, a scripts/ page and a path climbing out are DENIED by the study rail; a state path is DENIED by the factory's state rail first",
        S("Write", { file_path: `${PAD(OTHER)}/r.html` }, IN(ANSWER)).rail === "study" && S("Write", { file_path: `${PAD(OTHER)}/r.html` }, IN(ANSWER)).decision === "deny"
        && S("Write", { file_path: `${PAD(SID)}/run.mjs` }, IN(ANSWER)).decision === "deny" && S("Write", { file_path: "scripts/recap.html" }, IN(ANSWER)).decision === "deny"
        && S("Write", { file_path: `${PAD(SID)}/../../../x.html` }, IN(ANSWER)).decision === "deny"
        && S("Write", { file_path: "dressing-room/state/recap.md" }, IN(ANSWER)).rail === "state");
      const errs = [], we = process.stderr.write, wo = process.stdout.write, outs = [];
      process.stderr.write = (s) => { errs.push(String(s)); return true; }; process.stdout.write = (s) => { outs.push(String(s)); return true; };
      try { pretooluse({ raw: JSON.stringify(P("Write", RECAP)), handoff: () => {}, ctx: IN(ANSWER) }); } finally { process.stderr.write = we; process.stdout.write = wo; }
      assert("STUDY · LESSON ARTIFACT (row 811) — THE HOOK says the door on stderr in ONE line and writes no decision on stdout (the Write proceeds)",
        outs.length === 0 && errs.length === 1 && /^rails: study · lesson artifact: inference__axis-a-kya-analogy__2026-10-18\.html/.test(errs[0]), JSON.stringify({ errs, outs }));
    }
    assert("STUDY — a tool outside the rail's matcher gets NO opinion (Read, Grep, Glob, WebSearch, TodoWrite, an MCP tool)",
      ["Read", "Grep", "Glob", "WebSearch", "TodoWrite", "mcp__organism-memory__recall"].every((t) => studyRail(P(t, {}), IN(ANSWER)) === null && S(t, {}, IN(ANSWER)).decision === "allow"));
    // forks row 305 (24 Sep 2026) — the drift law's verbs in, the rest out; learnstate's deny names the digest; parking rides MCP note
    const TC = (v) => S("Bash", { command: `node scripts/teaching_contract.mjs ${v}` }, IN(ANSWER)).decision;
    assert("STUDY · DRIFT LAW (row 305) — teaching_contract list / unhit-auto <id> / flag <id> --why are ALLOWED mid-lesson; add / drop / reset-turns / selftest and the bare call are DENIED",
      TC("list") === "allow" && TC("unhit-auto teach-12") === "allow" && TC('flag teach-12 --why "x"') === "allow"
      && ["add teach-99 x", "drop teach-12", "reset-turns", "selftest", ""].every((v) => TC(v) === "deny"));
    const dL = S("Bash", { command: "node scripts/learnstate.mjs nextup" }, IN(ANSWER)), dJ = S("Bash", { command: "node scripts/learnstate.mjs json" }, IN(ANSWER));
    assert("STUDY · LEARNSTATE (row 305) — learnstate nextup / json are DENIED mid-lesson and the reason names `node scripts/learn_digest.mjs` as the re-run; state / tokenizer_play / captains_call are DENIED without that line",
      dL.decision === "deny" && dL.reason.includes(STUDY_LEARNSTATE_LINE) && STUDY_LEARNSTATE_LINE.includes("node scripts/learn_digest.mjs") && dJ.decision === "deny" && dJ.reason.includes(STUDY_LEARNSTATE_LINE)
      && ["node scripts/state.mjs", 'node scripts/tokenizer_play.mjs train "x"', 'node scripts/captains_call.mjs file --line "x"'].every((c) => { const d = S("Bash", { command: c }, IN(ANSWER)); return d.decision === "deny" && !d.reason.includes("learn_digest"); })
      && !d0.reason.includes("learn_digest"), JSON.stringify(dL));
    assert("STUDY · PARKING (row 305) — the MCP `note` tool gets NO opinion from the rail (no deny, no count)",
      studyRail(P("mcp__organism-memory__note", { text: "park: xray later" }), IN(ANSWER)) === null
      && (() => { const d = S("mcp__organism-memory__note", { text: "park: xray later" }, IN(ANSWER)); return d.decision === "allow" && !d.study; })());
    const cap = S("Bash", XRAY, IN(ORDERED)), capW = S("Write", { file_path: "scripts/foo.mjs" }, IN(ORDERED));
    assert("STUDY · THE 480 RULING — his LAST PROMPT ordered system work (class system) → the same xray call and a Write are ALLOWED as captain's mid-lesson engineering, flagged for the count",
      classifyPrompt(ORDERED).kind === "system" && cap.decision === "allow" && cap.study.captain === true && /captain's mid-lesson engineering/.test(cap.study.why)
      && capW.decision === "allow" && capW.study.captain === true, JSON.stringify([cap, capW]));
    assert("STUDY · THE 480 RULING — …both ways: the same calls after his ANSWER, his confusion, a study question or an ack are DENIED",
      ["pakka - pay", "samajh nahi aaya", "what is morphology?", "ok"].every((p) => S("Bash", XRAY, IN(p)).decision === "deny" && S("Write", { file_path: "scripts/foo.mjs" }, IN(p)).decision === "deny"));
    assert("STUDY — a CLOSING (/full-time, \"post match\") stands the rail down for the close organs; the same organ on a study prompt is DENIED",
      studyRail(P("Bash", { command: "node scripts/postmatch.mjs --hit x" }), IN(CLOSE)) === null && studyRail(P("Bash", { command: "node scripts/postmatch.mjs --hit x" }), IN("post match")) === null
      && S("Bash", { command: "node scripts/postmatch.mjs --hit x" }, IN(ANSWER)).decision === "deny");
    assert("STUDY — NOT OVERRIDABLE: ARSENAL_RAILS_OVERRIDE=<rung>:study in the call opens nothing; a factory rail's own token still opens that rail",
      S("Bash", { command: "ARSENAL_RAILS_OVERRIDE=G3:study node scripts/xray.mjs report" }, IN(ANSWER)).decision === "deny"
      && S("Bash", { command: "ARSENAL_RAILS_OVERRIDE=S12:claude-p " + CP }, null).decision === "allow");
    assert("STUDY — a factory deny stands whatever the lesson (the claude-p and state rails after his order still bite)",
      S("Bash", { command: CP }, IN(ORDERED)).rail === "claude-p" && S("Write", { file_path: "dressing-room/state/x.json" }, IN(ORDERED)).rail === "state");
    assert("STUDY · SCOPE — not the host, a legacy (pre-G0) sitting, a null context, an unreadable prompt → NO opinion; the host with his prompt → an opinion",
      studyRail(P("Bash", XRAY), { scope: { study: false, why: "this session is not the sitting's host" }, prompt: ANSWER }) === null
      && studyRail(P("Bash", XRAY), { scope: { study: true, legacy: true }, prompt: ANSWER }) === null
      && studyRail(P("Bash", XRAY), null) === null && studyRail(P("Bash", XRAY), IN(null)) === null && studyRail(P("Bash", XRAY), IN(ANSWER)) !== null);
    assert("STUDY — FAIL-OPEN: a context that THROWS costs the call nothing (allow, no rail)",
      (() => { const d = decide(P("Bash", XRAY), { get scope() { throw new Error("boom"); } }); return d.decision === "allow" && !d.study; })());

    // studyContext over a temp state dir + transcript — the SCOPE GUARD read live, both ways
    const { mkdtempSync, writeFileSync, rmSync } = process.getBuiltinModule("node:fs");
    const tmp = mkdtempSync(join(process.getBuiltinModule("node:os").tmpdir(), "g3-rail-"));
    try {
      const tx = join(tmp, "t.jsonl");
      const SIT = (extra) => writeFileSync(join(tmp, "sitting.json"), JSON.stringify({ id: "sit_x", opened_at: "2026-09-24T00:00:00Z", closed_at: null, ...extra }));
      writeFileSync(tx, [JSON.stringify({ type: "user", message: { content: ORDERED } }), JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text: "ok" }] } }),
        JSON.stringify({ type: "user", message: { content: ANSWER } }), JSON.stringify({ type: "user", message: { content: [{ type: "tool_result", content: "x" }] } })].join("\n"));
      const CTX = (sid, t = tx) => studyContext({ session_id: sid, transcript_path: t }, { dir: tmp, env: {} });
      SIT({ host_session_id: SID, host_transcript_path: tx });
      const host = CTX(SID), other = CTX(OTHER);
      assert("STUDY · SCOPE GUARD — the sitting's HOST session is bound (its last HUMAN prompt read off the tail); ANOTHER session with the same sitting open gets NO opinion",
        host.scope.study === true && host.prompt === ANSWER && decide(P("Bash", XRAY), host).decision === "deny"
        && other.scope.study === false && other.prompt === null && decide({ ...P("Bash", XRAY), session_id: OTHER }, other).decision === "allow"
        && decide({ ...P("Bash", XRAY), session_id: OTHER }, { ...other, prompt: ANSWER }).decision === "allow", JSON.stringify({ host, other }));
      SIT({});
      const legacy = CTX(SID);
      SIT({ host_session_id: null });
      const unbound = CTX(SID);
      assert("STUDY · SCOPE GUARD — a sitting with NO host field (pre-G0 build) or a null host binds NO session: fail-open for all",
        legacy.scope.legacy === true && decide(P("Bash", XRAY), legacy).decision === "allow" && unbound.scope.study === false && decide(P("Bash", XRAY), unbound).decision === "allow");
      SIT({ host_session_id: SID, closed_at: "2026-09-24T01:00:00Z" });
      assert("STUDY · SCOPE GUARD — a CLOSED sitting binds nobody", decide(P("Bash", XRAY), CTX(SID)).decision === "allow");
      SIT({ host_session_id: SID });
      const absent = decide(P("Bash", XRAY), CTX(SID, join(tmp, "none.jsonl"))).decision;
      const noPath = decide(P("Bash", XRAY), studyContext({ session_id: SID }, { dir: tmp, env: {} })).decision;
      writeFileSync(join(tmp, "sitting.json"), "{torn");
      const torn = decide(P("Bash", XRAY), CTX(SID)).decision;
      assert("STUDY — FAIL-OPEN on the read: an absent transcript, no transcript path, a garbage sitting file → no opinion",
        absent === "allow" && noPath === "allow" && torn === "allow", JSON.stringify({ absent, noPath, torn }));
      SIT({ host_session_id: SID });
      assert("STUDY — a headless organ (ARSENAL_ORGAN=1) is never the study session",
        studyContext({ session_id: SID, transcript_path: tx }, { dir: tmp, env: { ARSENAL_ORGAN: "1" } }).scope.study === false);
    } finally { try { rmSync(tmp, { recursive: true, force: true }); } catch { /* temp */ } }

    // THE HOOK SHAPE for the study rail — a deny prints the PreToolUse object; a captain's order prints nothing on stdout
    const w5 = process.stdout.write.bind(process.stdout), e5 = process.stderr.write.bind(process.stderr);
    const o5 = [], e5o = [];
    process.stdout.write = (x) => { o5.push(x); return true; };
    process.stderr.write = (x) => { e5o.push(x); return true; };
    try {
      pretooluse({ raw: JSON.stringify(P("Bash", XRAY)), ctx: IN(ANSWER), handoff: () => {} });
      pretooluse({ raw: JSON.stringify(P("Bash", XRAY)), ctx: IN(ORDERED), handoff: () => {} });
    } finally { process.stdout.write = w5; process.stderr.write = e5; }
    let j5 = null; try { j5 = JSON.parse(o5[0] || ""); } catch { /* asserted */ }
    assert("STUDY HOOK — the deny is the PreToolUse decision object opening `RAIL study — park it…`; the captain's order prints NOTHING on stdout and one `captain's mid-lesson engineering` line on stderr",
      o5.length === 1 && j5 && j5.hookSpecificOutput.permissionDecision === "deny" && j5.hookSpecificOutput.permissionDecisionReason.startsWith(`RAIL study — ${STUDY_DENY}`)
      && e5o.length === 1 && /captain's mid-lesson engineering/.test(e5o[0]), JSON.stringify({ o5, e5o }));
  }

  // (c) THE ORDER-CHECKER
  const found = orderFiles();
  assert("ORDERS — order files are found BY PREDICATE (a RESUME HERE head), never by a list", found.length >= 1, JSON.stringify(found));
  const control = checkOrder(join(ROOT, "package.json"));   // no §, no fences — a real file as the control
  assert("ORDERS — package.json is clean (its `organism_test.mjs suites` is a DISPATCH-TABLE verb, not a missing one)",
    control.problems.length === 0, JSON.stringify(control.problems));
  assert("VERB — quoted, function, dispatch-table and CLI-line verbs all count; an absent one does not",
    hasVerb('if (mode === "week")', "week") && hasVerb("function brief() {}", "brief") && hasVerb("const M = { coverage, suites, alive };", "suites")
    && hasVerb("// CLI: node scripts/fuelboard.mjs [status|use|fault]\nconst x = 1;", "status") && !hasVerb("// CLI: node scripts/x.mjs [a|b]\nconst M = { coverage };", "zzz"));
  const { mkdtempSync, writeFileSync, rmSync } = process.getBuiltinModule("node:fs");
  const tmp = mkdtempSync(join(process.getBuiltinModule("node:os").tmpdir(), "orders-"));
  const f = join(tmp, "ORDER.md");
  writeFileSync(f, "# x\n\n## ▶ RESUME HERE\n\n## §1 · a\n\nsee §1 and §9. `scripts/nope.mjs` and `scripts/state.mjs`.\nrun `node scripts/state.mjs zzz` and `node scripts/state.mjs week`.\n\n```\nunbalanced\n");
  const r = checkOrder(f);
  const has = (re) => r.problems.some((p) => re.test(p));
  assert("ORDERS — catches a dangling §reference", has(/references §9/), JSON.stringify(r.problems));
  assert("ORDERS — catches a named file that does not exist", has(/missing file scripts\/nope\.mjs/), JSON.stringify(r.problems));
  assert("ORDERS — catches a command whose organ has no such verb", has(/state\.mjs has no verb zzz/), JSON.stringify(r.problems));
  assert("ORDERS — catches an unbalanced code fence", has(/unbalanced code fence/));
  assert("ORDERS — a verb the organ really has is NOT flagged", !r.problems.some((p) => /verb week/.test(p)));
  writeFileSync(f, "## ▶ RESUME HERE\n## §1 · a\n<!-- order-check:absent-ok scripts/ghost.mjs -->\n`scripts/ghost.mjs` is a FINDING, not a path. §1.\n");
  assert("ORDERS — a path the DOCUMENT declares absent-on-purpose is not a problem", checkOrder(f).problems.length === 0, JSON.stringify(checkOrder(f).problems));
  assert("ORDERS — the predicate finds the planted order in its own dir", orderFiles(tmp).length === 1);
  try { rmSync(tmp, { recursive: true, force: true }); } catch { /* temp */ }

  // THE ORDER-GATE CONTRACT LINE (S5-R2, 25 Aug 2026 — the ruled repair, pinned). The old
  // resolver matched rewritable prose and died silently when CLAUDE.md was reworded; these
  // three hold the repaired shape on the PURE core (no fs — the xray ratchet stays flat):
  // contract line wins, legacy phrase survives as fallback, and nothing-resolves is NULL
  // so the orders CLI can refuse loudly instead of passing.
  assert("ORDER-GATE — the declared contract line wins over the legacy phrase",
    resolveOrderGate("prose above\nORDER-GATE: docs/archive/REAL.md\nand THE OPEN WORK ORDER: `docs/archive/WRONG.md` still in prose\n") === "docs/archive/REAL.md");
  assert("ORDER-GATE — the legacy phrase still resolves when no contract line exists (L9 fallback)",
    resolveOrderGate("THE OPEN WORK ORDER: `docs/archive/LEGACY.md`\n") === "docs/archive/LEGACY.md");
  assert("ORDER-GATE — a CLAUDE.md with neither resolves to NULL (the CLI refuses on it, never shrugs)",
    resolveOrderGate("TWO WORK ORDERS ARE OPEN - prose only, the 20 Aug rewording, no contract line\n") === null);

  // THE HANG, PINNED (rung S5-R, 20 Aug 2026 — session_meter selftest #16's shape, on the
  // rail organ). `pretooluse` on a non-TTY fd 0 that never closes must REFUSE fast, never
  // block: the un-guarded read blocked the full timeout window when proven live at S5-R.
  // If this assertion ever goes red again, the deadline has been removed.
  // ROW 814 / 827 (1): the same pipe now ALSO leaves ONE blind row — in a TEMP ledger born first through the CLI and reached
  // by the env door under the OS temp dir. A selftest never touches his real ledger.
  const TMPD = process.getBuiltinModule("node:os").tmpdir();
  const blindTmp = mkdtempSync(join(TMPD, "rails-blind-"));
  const RAILS = fileURLToPath(import.meta.url);
  const ledgerAt = (name) => join(blindTmp, name);
  const cliBorn = (file) => spawnSync(process.execPath, [RAILS, "born"], { encoding: "utf8", timeout: 15000, windowsHide: true, env: { ...process.env, ARSENAL_RAILS_BLIND_FILE: file } });
  const ledgerRows = (f) => { try { return readFileSync(f, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return { torn: l }; } }); } catch { return null; } };
  const check = (n, f) => { let c = false, why = ""; try { c = !!f(); } catch (e) { why = `THREW: ${String((e && e.message) || e).slice(0, 200)}`; } assert(n, c, why); };
  const HANG_LEDGER = ledgerAt("hang.jsonl");
  cliBorn(HANG_LEDGER);
  const wrap = `const {spawn}=require("node:child_process");
const c=spawn(process.execPath,[process.env.__RAILS,"pretooluse"],{stdio:["pipe","ignore","ignore"]});
let done=false;const t0=Date.now();
c.on("exit",()=>{done=true;console.log(String(Date.now()-t0));process.exit(0)});
setTimeout(()=>{if(!done){try{c.kill()}catch{}console.log("HUNG");process.exit(0)}},5000);`;
  const hangProbe = spawnSync(process.execPath, ["-e", wrap], {
    encoding: "utf8", timeout: 15000, windowsHide: true,
    env: { ...process.env, __RAILS: fileURLToPath(import.meta.url), ARSENAL_RAILS_BLIND_FILE: HANG_LEDGER },
  });
  const hangMs = Number((hangProbe.stdout || "").trim());
  assert("NO HANG — `pretooluse` on a non-TTY pipe that never closes REFUSES instead of blocking forever (S5-R, pinned)",
    Number.isFinite(hangMs) && hangMs < 3000, `wrapper said: ${JSON.stringify((hangProbe.stdout || "").trim())}${hangProbe.error ? " · " + hangProbe.error.code : ""}`);
  check("BLIND COUNTED (row 814) — that never-closing pipe left exactly ONE row in the temp ledger, all five fields: ts · a why naming the silence bound · read_ms · rail_ms · free_mb",
    () => {
      const rows = ledgerRows(HANG_LEDGER), r = rows && rows[0];
      return rows.length === 1 && Object.keys(r).join() === "ts,why,read_ms,rail_ms,free_mb" && !Number.isNaN(Date.parse(r.ts))
        && /^no payload on fd 0 after 1000 ms of silence \(non-TTY, stdin never closed/.test(r.why)
        && [r.read_ms, r.rail_ms, r.free_mb].every(Number.isInteger) && r.read_ms >= 990 && r.rail_ms >= r.read_ms && r.free_mb > 0;
    });
  // THE SLOW WRITER (rows 814 (3), 822 (1)): the payload arrives at 800 ms and the writer HOLDS the pipe open — it must be READ
  const SLOW_LEDGER = ledgerAt("slow.jsonl");
  cliBorn(SLOW_LEDGER);
  const slow = `const {spawn}=require("node:child_process");
const c=spawn(process.execPath,[process.env.__RAILS,"pretooluse"],{stdio:["pipe","pipe","pipe"]});
let o="",e="";const t0=Date.now();c.stdout.on("data",(d)=>{o+=d});c.stderr.on("data",(d)=>{e+=d});
setTimeout(()=>{c.stdin.write(process.env.__PAYLOAD)},800);
c.on("close",()=>{console.log(JSON.stringify({ms:Date.now()-t0,o,e}));process.exit(0)});
setTimeout(()=>{try{c.kill()}catch{}console.log(JSON.stringify({hung:true,o,e}));process.exit(0)},6000);`;
  const slowProbe = spawnSync(process.execPath, ["-e", slow], {
    encoding: "utf8", timeout: 15000, windowsHide: true,
    env: { ...process.env, __RAILS: RAILS, ARSENAL_RAILS_BLIND_FILE: SLOW_LEDGER, __PAYLOAD: JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Agent", tool_input: { prompt: "go" } }) },
  });
  check("SLOW WRITER (row 814 (3)) — a payload sent at 800 ms on a pipe held OPEN is READ: the fleet deny JSON reaches stdout, nothing is refused, the temp ledger stays empty",
    () => {
      const w = JSON.parse(String(slowProbe.stdout || "").trim()), j = JSON.parse(w.o);
      return !w.hung && w.ms >= 800 && j.hookSpecificOutput.permissionDecision === "deny" && /RAIL fleet/.test(j.hookSpecificOutput.permissionDecisionReason)
        && !/REFUSED/.test(w.e) && ledgerRows(SLOW_LEDGER).length === 0;
    });
  check("BORN (row 814) — a birth is an exclusive create that never truncates: born, one row appended, born again says `already born` and the row is still there",
    () => {
      const env = { ARSENAL_RAILS_BLIND_FILE: ledgerAt("born.jsonl") };
      const b1 = bornBlind({ env }), rec = recordBlind({ why: "planted", readMs: 7, env }), b2 = bornBlind({ env });
      const rows = ledgerRows(env.ARSENAL_RAILS_BLIND_FILE);
      return b1.born === true && rec.ok === true && b2.born === false && /^rails: already born .* — 1 row\(s\), untouched/.test(b2.line)
        && rows.length === 1 && rows[0].why === "planted" && rows[0].read_ms === 7;
    });
  check("BORN CLI — `rails.mjs born` prints ONE line and exits 0 both ways (born, then already born), and the file it made is empty",
    () => {
      const f = ledgerAt("cli.jsonl"), r1 = cliBorn(f), r2 = cliBorn(f);
      const lines = (r) => String(r.stdout || "").split("\n").filter((l) => l.trim());
      return r1.status === 0 && r2.status === 0 && lines(r1).length === 1 && lines(r2).length === 1
        && /^rails: born /.test(lines(r1)[0]) && /^rails: already born /.test(lines(r2)[0]) && readFileSync(f, "utf8") === "";
    });
  check("UNBORN — a blind row never gives birth to the ledger: recordBlind on an unborn file refuses on ONE stderr line, creates nothing, never throws",
    () => {
      const f = ledgerAt("unborn.jsonl"), errs = [], we = process.stderr.write.bind(process.stderr);
      process.stderr.write = (s) => { errs.push(String(s)); return true; };
      let rec;
      try { rec = recordBlind({ why: "x", readMs: 1, env: { ARSENAL_RAILS_BLIND_FILE: f } }); } finally { process.stderr.write = we; }
      return rec.ok === false && errs.length === 1 && /^rails: blind row NOT recorded \(the ledger is not born/.test(errs[0]) && !existsSync(f);
    });
  check("BLIND FILE — ARSENAL_RAILS_BLIND_FILE is honoured ONLY under the OS temp dir; outside it, through `..`, beside it, or the temp dir itself, the real ledger stands (a pure resolver: nothing written)",
    () => {
      // "outside" is anchored at the filesystem root: the tree itself may live under the temp dir (a sandbox copy does)
      const inside = join(TMPD, "s814-x", "b.jsonl"), outside = resolve(sep, "s814-outside-the-temp-dir", "b.jsonl");
      return railsBlindFile({ ARSENAL_RAILS_BLIND_FILE: inside }) === resolve(inside)
        && railsBlindFile({ ARSENAL_RAILS_BLIND_FILE: outside }) === RAILS_BLIND_FILE
        && railsBlindFile({ ARSENAL_RAILS_BLIND_FILE: `${TMPD}${sep}..${sep}escape.jsonl` }) === RAILS_BLIND_FILE
        && railsBlindFile({ ARSENAL_RAILS_BLIND_FILE: `${TMPD}evil${sep}x.jsonl` }) === RAILS_BLIND_FILE
        && railsBlindFile({ ARSENAL_RAILS_BLIND_FILE: TMPD }) === RAILS_BLIND_FILE
        && railsBlindFile({}) === RAILS_BLIND_FILE && railsBlindFile({ ARSENAL_RAILS_BLIND_FILE: "  " }) === RAILS_BLIND_FILE
        && RAILS_BLIND_FILE === join(ROOT, "dressing-room", "state", "rails_blind.jsonl");
    });
  check("HOOK (row 827 (1)) — given `refused`, pretooluse (still synchronous) prints the refusal line naming the silence bound, records ONE blind row, and returns today's fail-open allow",
    () => {
      const f = ledgerAt("hook.jsonl"), WHY = "no payload on fd 0 after 1000 ms of silence (non-TTY, stdin never closed)";
      bornBlind({ env: { ARSENAL_RAILS_BLIND_FILE: f } });
      const errs = [], outs = [], we = process.stderr.write.bind(process.stderr), wo = process.stdout.write.bind(process.stdout), prev = process.env.ARSENAL_RAILS_BLIND_FILE;
      process.env.ARSENAL_RAILS_BLIND_FILE = f;
      process.stderr.write = (s) => { errs.push(String(s)); return true; };
      process.stdout.write = (s) => { outs.push(String(s)); return true; };
      let d;
      try { d = pretooluse({ refused: WHY, readMs: 1003, handoff: () => { throw new Error("a blind call hands nothing off"); } }); }
      finally { process.stderr.write = we; process.stdout.write = wo; if (prev === undefined) delete process.env.ARSENAL_RAILS_BLIND_FILE; else process.env.ARSENAL_RAILS_BLIND_FILE = prev; }
      const rows = ledgerRows(f);
      return d && typeof d.then !== "function" && d.decision === "allow" && d.rail === null && d.why === `stdin refusal: ${WHY}`
        && errs.length === 1 && errs[0].startsWith(`rails: REFUSED — ${WHY}. No payload ⇒ no decision;`) && outs.join("") === ""
        && rows.length === 1 && rows[0].why === WHY && rows[0].read_ms === 1003;
    });
  try { rmSync(blindTmp, { recursive: true, force: true }); } catch { /* temp */ }

  console.log(`rails selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

// ── CLI ─────────────────────────────────────────────────────────────────────
// THE HOOK'S READ (row 827 (1)) — the ONE async verb. The handed global or a TTY reads nothing (pretooluse takes them as
// before); otherwise fd 0 is read IN-PROCESS until EOF, the first whole JSON object, or STDIN_SILENCE_MS of silence — zero
// spawns — and handed on as `raw`, or as `refused` (a blind call, counted). Then the process EXITS once stdout and stderr
// are flushed (each wait capped at 2 s): a pipe that never closes must not hold it.
async function hook() {
  try {
    let r = null;
    if (typeof globalThis.__ARSENAL_HOOK_STDIN__ !== "string" && !process.stdin.isTTY) r = await readStdinUntilSilence();
    if (!r) pretooluse({});
    else if (r.ok) pretooluse({ raw: r.raw, readMs: r.ms });
    else pretooluse({ refused: r.why, readMs: r.ms });
  } catch { /* fail-open: the tool call proceeds under the normal permission flow */ }
  const flushed = (s) => new Promise((done) => { const cap = setTimeout(done, 2000); try { s.write("", () => { clearTimeout(cap); done(); }); } catch { clearTimeout(cap); done(); } });
  await flushed(process.stdout);
  await flushed(process.stderr);
  process.exit(0);
}

function main() {
  const mode = process.argv[2] || "";
  if (mode === "selftest") return selftest();
  if (mode === "pretooluse") { hook(); return; }
  if (mode === "born") { const b = bornBlind(); console.log(b.line); if (b.error) process.exitCode = 1; return; }
  if (mode === "decide") { console.log(JSON.stringify(decide(JSON.parse(process.argv[3] || "{}")), null, 1)); return; }
  if (mode === "orders") {
    const quiet = process.argv.includes("--quiet");
    const c = checkOrders();
    if (!c.files) { console.log("rails: no order file found in docs/archive (a docs/archive/*.md with a RESUME HERE head)"); return; }
    // THE RATCHET (same 25 Aug ruling, part iii): an open order that resolves to NOTHING —
    // or resolves to a file this checker never saw — is a REFUSAL, never a shrug. Five days
    // of "I found nothing" read as "everything is fine" and let a violation through.
    if (!c.results.some((r) => r.open)) {
      console.log("rails: ✗ NO OPEN ORDER RESOLVES — the commit gate refuses to run blind.");
      console.log(`       looked for: an \`ORDER-GATE: docs/archive/<name>.md\` line in CLAUDE.md (the contract),`);
      console.log("       then the legacy phrase THE OPEN WORK ORDER: `docs/archive/<name>.md` — and the resolved");
      console.log(`       file must be among the ${c.files} order file(s) checked. resolved: ${c.open || "null"}`);
      console.log("       Restore the ORDER-GATE line in CLAUDE.md; do not delete this check.");
      process.exit(1);
    }
    for (const r of c.results) {
      const name = r.path.replace(ROOT + sep, "");
      if (r.problems.length) {
        console.log(`rails: ${r.open ? "✗" : "·"} ${name}${r.open ? "  — THE OPEN ORDER (this blocks the commit)" : "  — a closed record: LEADS only, never a blocker (§10-H)"}`);
        for (const p of r.problems) console.log(`         ${r.open ? "X" : "·"} ${p}`);
      } else if (!quiet) console.log(`rails: ✓ ${name} — structurally clean${r.open ? " (the open order)" : ""}`);
    }
    if (c.blocking) { console.log(`rails: ${c.blocking} PROBLEM(S) in the OPEN order — §3-C's check, and it is a commit gate`); process.exit(1); }
    if (!quiet) console.log(`rails: ${c.files} order file(s) checked · open order clean · ${c.problems - c.blocking} lead(s) in closed records`);
    return;
  }
  console.log("rails: pretooluse | born | orders [--quiet] | decide <json> | selftest");
  process.exit(2);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
