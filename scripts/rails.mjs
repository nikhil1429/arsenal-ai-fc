#!/usr/bin/env node
// ============================================================================
// rails.mjs · ARSENAL AI FC — THE FACTORY GETS THE ORGANISM'S OWN DISCIPLINE
//   (THE ORGANISM AUDIT §10-C · rung S1(b)+(c), 20 Aug 2026)
//   SOLE WRITER of: NOTHING. This organ writes no file, ever — like turn_hook.mjs.
//   A rail that can write is a rail that can be part of the accident.
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
//                     in nobody's ledger. The organism is also SWITCHED OFF until S12.
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
// LAWS: writes nothing · never rewrites a command · fail-open on its own error ·
//   every deny names the rail id, the reason, and the compliant form.
// WHO ELSE COULD ACT ON THIS OUTPUT? .claude/settings.json PreToolUse (wired) ·
//   hooks/pre-commit (wired — tripwire first, then `orders`) · xray.mjs (reads this file
//   like any organ; it has no state edges by design).
// CLI: node scripts/rails.mjs pretooluse | orders [--quiet] | decide <json> | selftest
// ============================================================================
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join, dirname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// THE STDIN DEADLINE (rung S5-R, 20 Aug 2026): session_meter's proven guard, imported —
// never a second implementation (§2: a universal need solved twice is the disease).
import { readStdinWithDeadline } from "./session_meter.mjs";

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
export const STATE_WRITE_RE = new RegExp(`(?:${CMD_POS}(?:rm|mv|cp|tee|truncate|sed)\\s|>>?\\s*[^\\s|]*dressing-room|Set-Content|Add-Content|Out-File)`, "i");
const OVERRIDE_RE = /ARSENAL_RAILS_OVERRIDE=([A-Za-z0-9_.-]+):([a-z-]+)/;

const textOf = (v) => { try { return typeof v === "string" ? v : JSON.stringify(v ?? ""); } catch { return String(v); } };

// PURE — the whole decision, over a PreToolUse payload. This is the function the
// selftest drives; the CLI is a thin shell around it.
export function decide(payload = {}) {
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
      return deny("claude-p", "`claude -p` from a session shell — that is the organism's OWN transport (L6), it runs outside the gate (L5), its spend lands in no ledger, and the organism is SWITCHED OFF until S12",
        "if a lane must run, run it through its organ's CLI so the gate and the ledger see it; if this is a rung's canary, declare the override");
    }
    // a shell write into state is the same breach as an editor write, one layer down
    if (STATE_DIR_RE.test(cmd) && STATE_WRITE_RE.test(cmd)) {
      return deny("state", "a shell command writes/moves/deletes under dressing-room/state — same breach as an editor write, one layer down",
        "go through the owner organ's CLI (`grep -rn \"SOLE WRITER\" scripts/*.mjs`); reads are always fine");
    }
    return allow("shell command clears every rail");
  }

  return allow("no rail covers this tool");
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
export function pretooluse({ raw = null } = {}) {
  let payload = {};
  try {
    const handed = globalThis.__ARSENAL_HOOK_STDIN__;
    let text;
    if (raw !== null) text = raw;
    else if (typeof handed === "string") text = handed;
    else if (process.stdin.isTTY) text = "";
    else {
      const r = readStdinWithDeadline();
      if (!r.ok) {
        process.stderr.write(`rails: REFUSED — ${r.why}. No payload ⇒ no decision; the tool call proceeds under the normal permission flow (this rail's declared fail-open). To exercise a rail by hand use \`node scripts/rails.mjs decide '<json>'\`.\n`);
        return { decision: "allow", rail: null, why: `stdin refusal: ${r.why}` };
      }
      text = r.raw;
    }
    payload = text && text.trim() ? JSON.parse(text) : {};
  } catch { payload = {}; }
  const d = decide(payload);
  if (d.decision === "deny") {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: d.reason } }) + "\n");
    return d;
  }
  if (d.override) process.stderr.write(`rails: ${d.why}\n`);
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
// The open order is not a list in this file either: CLAUDE.md names it, in one line,
// and CLAUDE.md is canon (`THE OPEN WORK ORDER: \`docs/archive/X.md\``).
export function openOrder(root = ROOT) {
  try {
    const m = /THE OPEN WORK ORDER:?\*{0,2}:?\s*`([^`]+\.md)`/.exec(readFileSync(join(root, "CLAUDE.md"), "utf8"));
    return m ? join(root, m[1]) : null;
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
  const D = (tool, input) => decide({ tool_name: tool, tool_input: input });

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

  // THE HANG, PINNED (rung S5-R, 20 Aug 2026 — session_meter selftest #16's shape, on the
  // rail organ). `pretooluse` on a non-TTY fd 0 that never closes must REFUSE fast, never
  // block: the un-guarded read blocked the full timeout window when proven live at S5-R.
  // If this assertion ever goes red again, the deadline has been removed.
  const wrap = `const {spawn}=require("node:child_process");
const c=spawn(process.execPath,[process.env.__RAILS,"pretooluse"],{stdio:["pipe","ignore","ignore"]});
let done=false;const t0=Date.now();
c.on("exit",()=>{done=true;console.log(String(Date.now()-t0));process.exit(0)});
setTimeout(()=>{if(!done){try{c.kill()}catch{}console.log("HUNG");process.exit(0)}},5000);`;
  const hangProbe = spawnSync(process.execPath, ["-e", wrap], {
    encoding: "utf8", timeout: 15000, windowsHide: true,
    env: { ...process.env, __RAILS: fileURLToPath(import.meta.url) },
  });
  const hangMs = Number((hangProbe.stdout || "").trim());
  assert("NO HANG — `pretooluse` on a non-TTY pipe that never closes REFUSES instead of blocking forever (S5-R, pinned)",
    Number.isFinite(hangMs) && hangMs < 3000, `wrapper said: ${JSON.stringify((hangProbe.stdout || "").trim())}${hangProbe.error ? " · " + hangProbe.error.code : ""}`);

  console.log(`rails selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

// ── CLI ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = process.argv[2] || "";
  if (mode === "selftest") return selftest();
  if (mode === "pretooluse") { pretooluse({}); return; }
  if (mode === "decide") { console.log(JSON.stringify(decide(JSON.parse(process.argv[3] || "{}")), null, 1)); return; }
  if (mode === "orders") {
    const quiet = process.argv.includes("--quiet");
    const c = checkOrders();
    if (!c.files) { console.log("rails: no order file found in docs/archive (a docs/archive/*.md with a RESUME HERE head)"); return; }
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
  console.log("rails: pretooluse | orders [--quiet] | decide <json> | selftest");
  process.exit(2);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
