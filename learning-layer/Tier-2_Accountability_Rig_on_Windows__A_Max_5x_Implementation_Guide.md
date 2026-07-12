# The Tier‑2 Accountability Rig on Windows — A Version‑Accurate, Max‑5x‑Only Implementation Guide

*Reconciliation note (OS v3.13, 08 Jul 2026): this guide is the build-manual for the **OUTWORK EXECUTION LAYER** (peer of the LEARNING EXECUTION LAYER). Three OS "football-naming" cross-refs are wired into Appendix B without changing the build: the **examiner** agent is **THE SCRIMMAGE** — it grades against **THE DOSSIER** (`OPPONENT_SCOUT.md`), specifically its §4 probe-bank and §1 time-weights, so the old generic 0-5 rubric is dead; the **scout** agent is **THE SCOUT** — its weekly diff FEEDS THE DOSSIER via the §9 closed-loop; **curriculum** is a surfacing-arm that reads the Re-Jirah controller + the Progress-Tracker fluency-states (it keeps no decay-model of its own); and **ledger-keeper** is the single canonical mistake-store (the Gemini learning-packet watch-list is its mirror, not a second truth). Code identifiers are kept as-is, so the Appendix A master prompt, the Appendix C hooks, the phased build (Phase 0-8), and every version-verified `schtasks`/billing fact are byte-unchanged. The billing note was already aligned to the paused / verify-live state.*

## TL;DR
- **You can build almost the entire rig inside your $100/month Max 5x plan with zero metered billing** — because Anthropic *paused* the June 15, 2026 "Agent SDK credit split" on the day it was due to go live (The New Stack: "Anthropic has hit pause on a billing change… pulling back on the very day it was scheduled to go live"), and it remains paused as of July 2026. Interactive Claude Code, Claude Desktop, Cowork, Desktop scheduled tasks, `/loop`, AND cloud Routines all draw from your regular subscription pool; nothing here requires a metered credit **as long as you never set `ANTHROPIC_API_KEY` and never turn on "usage credits" overflow.**
- **Full auto‑scaffolding is real but partial:** a single master prompt makes Claude Code write all six subagent files, the hook scripts, `settings.json`, and even generate the Windows `schtasks` commands. The unavoidable manual steps are OS/GUI‑level: installing ActivityWatch, the browser extension, editing the Claude *Desktop* JSON, approving MCP servers, creating the Desktop scheduled tasks, and running the Task Scheduler commands.
- **The single biggest cost trap is the API key, not the features.** Scheduled runs count against your normal usage limits (Max daily *routine* cap = 15/day per Anthropic's official launch blog); if you exhaust limits, runs are simply *rejected* — not silently billed — unless you deliberately enable pay‑as‑you‑go. Leave overflow off and you have a hard $100 ceiling.

## Key Findings

### Billing: what is and isn't included in Max 5x (verified, July 2026)
- Anthropic's May 14, 2026 announcement would have moved Agent SDK, `claude -p`, GitHub Actions, and third‑party SDK apps onto a separate metered dollar credit — **$20 Pro / $100 Max 5x / $200 Max 20x, no rollover, one‑time claim required** (InfoWorld; Zed Industries estimated subscriptions had effectively subsidized agent usage by ~15–30× versus API pricing). **On June 15, 2026 Anthropic paused this before it took effect.** Anthropic's own subscriber notice: "For now, nothing has changed: Claude Agent SDK, `claude -p`, and third‑party app usage still draw from your subscription's usage limits… When we have an update, we'll share it before anything takes effect." It is still paused as of July 2026.
- **Interactive surfaces are permanently on the subscription** (Anthropic help center, "Use the Claude Agent SDK with your Claude plan"): "Using Claude Code in the terminal or your IDE continues to use your subscription usage limits exactly as before"; "Web, desktop, and mobile chat continue to use subscription usage limits"; and the (paused) credit explicitly excluded Claude Cowork.
- **Local scheduling is on the subscription:** Desktop scheduled tasks and CLI `/loop` run as ordinary local Claude Code sessions. Per Anthropic's docs FAQ: "Do scheduled tasks count against my usage limits? Yes. Each run starts a full Claude Code session… Max and Enterprise plans have more headroom."
- **Cloud Routines are on the subscription too, with a daily cap** (code.claude.com/docs/en/routines): "Routines draw down subscription usage the same way interactive sessions do… When a routine hits the daily cap or your subscription usage limit, organizations with usage credits turned on can keep running routines on metered overage. Without usage credits, additional runs are rejected until the window resets." Anthropic's official "Introducing routines in Claude Code" blog states: "Pro users can run up to 5 routines per day, Max users can run up to 15 routines per day, and Team and Enterprise users can run up to 25 routines per day."
- **The only two ways to cross into metered billing:** (1) setting `ANTHROPIC_API_KEY`/`ANTHROPIC_AUTH_TOKEN` in your shell (overrides subscription auth → per‑token API billing); (2) turning on "Extra Usage"/"usage credits" overflow in Settings → Billing. Avoid both to stay 100% within $100.

### Scheduling: which mechanism to use for the 9 AM / 8 PM AI tasks
Claude Code offers four scheduling surfaces. For Nikhil on Windows, the correct choice for the "kickoff" and "audit" AI tasks is **Desktop scheduled tasks (local Routines)**, because they persist across restarts, run on the local machine with access to ActivityWatch on `localhost:5600` and local files, and stay on the subscription. Verified facts:
- Desktop scheduled tasks are macOS/Windows only (not Linux) — fine for Windows.
- They fire only while the Desktop app is open and the computer is awake; a sleeping machine skips the run, with one catch‑up on wake for the most recently missed time. Enable "Keep computer awake" in Settings → Desktop app → General.
- Prompts are stored at `%USERPROFILE%\.claude\scheduled-tasks\<task-name>\SKILL.md` as YAML‑frontmatter + body, so they're editable and version‑controllable.
- Each run gets a deterministic stagger of up to ~10 minutes after the scheduled time.
- `/loop` is **session‑scoped** (dies when you close the terminal) and requires Claude Code v2.1.72+ — wrong tool for a durable daily rig. **Cloud Routines** require GitHub repos + Claude Code on the web and run in a sandbox that cannot reach `localhost:5600`, so they're unsuitable for the ActivityWatch audit.

Because AI scheduling depends on the app being open and the machine awake, the **ntfy belt via Windows Task Scheduler is the deterministic backstop** — it fires regardless of whether Claude is running.

### Subagents (current syntax, verified against official docs at v2.1.198+)
- Subagents are Markdown files with YAML frontmatter; only `name` and `description` are required. Location: project `.claude\agents\` or user `%USERPROFILE%\.claude\agents\`.
- Full current frontmatter fields: `name`, `description`, `tools`, `disallowedTools`, `model` (`sonnet`/`opus`/`haiku`/`fable`/full ID/`inherit`), `permissionMode` (`default`/`acceptEdits`/`auto`/`dontAsk`/`bypassPermissions`/`plan`), `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory` (`user`/`project`/`local`), `background`, `effort`, `isolation`, `color`, `initialPrompt`.
- **MCP access:** subagents inherit the main conversation's MCP tools by default, so once the ActivityWatch MCP is added to Claude Code, the Auditor uses it automatically. You may also scope a server to one subagent via the `mcpServers` field.
- **Persistent memory** (for the Ledger‑keeper) is first‑class: `memory: project` gives a directory `.claude\agent-memory\<name>\` with a curated `MEMORY.md` (first 200 lines / 25 KB injected) that survives across sessions; `memory: user` stores under `%USERPROFILE%\.claude\agent-memory\<name>\`.
- As of v2.1.198 the `/agents` interactive wizard was removed; you create subagents by asking Claude or editing files directly.

### Hooks (current schema, verified)
- Hooks live in `settings.json` — user scope `%USERPROFILE%\.claude\settings.json` or project `.claude\settings.json`.
- Structure: `{ "hooks": { "<Event>": [ { "matcher": "<ToolPattern>", "hooks": [ { "type": "command", "command": "...", "timeout": 30 } ] } ] } }`. Matcher is omitted for `SessionStart`, `Stop`, `UserPromptSubmit`, etc.
- Handler types: `command`, `prompt` (LLM judgment, Haiku by default), `agent`, and `http`.
- Exit codes: 0 = proceed; **2 = block** (stderr fed back to Claude); 1 = non‑blocking error. For a `Stop` hook, exit 2 forces Claude to keep working.
- **Windows specifics:** `command` hooks run through Git Bash by default; a hook can instead run PowerShell by adding `"shell": "powershell"` to the entry. CRLF line endings break `#!/usr/bin/env bash` shebangs. The most portable pattern is invoking a script via **`node`** (Node ships with Claude Code) — used in Appendix C.
- `SessionStart` stdout is injected into Claude's context — ideal for auto‑loading state (curl a gist + cat local files).

### ActivityWatch + MCP on Windows
- Install ActivityWatch via the Windows installer (autostart is configured automatically). `aw-qt` tray app starts `aw-server`, `aw-watcher-window`, and `aw-watcher-afk`; web UI at `http://localhost:5600`.
- The browser watcher (`aw-watcher-web`) is a separate install — the official "ActivityWatch Web Watcher" extension for Chrome/Edge/Firefox — and requires ActivityWatch already running.
- MCP server: **`activitywatch-mcp-server`** by 8bitgentleman (maintainer Matt Vogel; ~68 GitHub stars). Install globally: `npm install -g activitywatch-mcp-server`. It connects to `http://localhost:5600` by default; the README notes "To override the standard localhost connection, use the environment variable `AW_API_BASE` or the `--aw-api-base` flag" — needed only under WSL, where "the AW server running in Windows will not be available at 127.0.0.1."
- **Windows npx gotcha:** local stdio MCP servers run via `npx` require a `cmd /c` wrapper on native Windows or they fail with "Connection closed." A global install avoids `npx` entirely (and dodges the known bug where `claude mcp add … cmd /c npx …` mangles the `/c` token).

### The RemoteCTO timelog plugin
- Install: `/plugin marketplace add RemoteCTO/claude-plugins-marketplace` then `/plugin install timelog`. It logs sessions/prompts/projects/tickets as JSONL to `~/.claude/timelog/`, works cross‑platform (Node ships with Claude Code), needs no config for basic use. `/timelog:backfill` imports past transcripts. A per‑project regex (`projectPattern` in `~/.claude/timelog/config.json`) fixes the "everything lumped under one project" problem if you launch Claude from a parent directory.

### ntfy belt
- `ntfy.sh` publishes a phone push via a simple HTTP POST: `curl -d "message" ntfy.sh/<topic>`. The topic name is effectively a password (no signup), so keep `nikhil-jarvis` private. Title via `-H "Title: ..."`, priority via `-H "Priority: high"`.
- `curl.exe` ships with Windows 10/11 by default. Windows Task Scheduler (`schtasks /create`) fires it at fixed wall‑clock times independent of any AI.

---

## Details — The Phased Build

### Phase 0 — Prerequisites & cost guardrails (manual)
**Goal:** a clean Windows environment that can never accidentally bill you.
1. Confirm Node.js 18+ (`node --version`) and Git for Windows (provides Git Bash) are installed.
2. Log in with your **Max** account only: `claude logout` then `claude login`; do **not** add Console/API credentials. This stops the "API credit" prompt from ever appearing.
3. Verify no key is set — in PowerShell: `echo $env:ANTHROPIC_API_KEY` (should be blank).
4. Settings → Billing: leave **Extra Usage / usage credits OFF** (hard stop instead of metered spillover).
5. Monitor with `/status` in Claude Code and at claude.ai/settings/usage.

**Checkpoint:** `claude --version` ≥ 2.1.198; `echo $env:ANTHROPIC_API_KEY` blank.

### Phase 1 — ActivityWatch + browser watcher (manual)
1. Install ActivityWatch from the GitHub releases Windows installer; launch `aw-qt`.
2. Open `http://localhost:5600`; confirm window + AFK data appears within a few minutes.
3. Install the "ActivityWatch Web Watcher" extension (Chrome Web Store / Firefox Add‑ons); confirm an `aw-watcher-web-*` bucket appears.

**Checkpoint:** UI lists `aw-watcher-window_<host>`, `aw-watcher-afk_<host>`, and `aw-watcher-web-*`.

### Phase 2 — ActivityWatch MCP server → Claude Desktop AND Claude Code
1. Global install (avoids the npx wrapper problem):
```
npm install -g activitywatch-mcp-server
```
2. **Claude Desktop (manual JSON edit):** open `%APPDATA%\Claude\claude_desktop_config.json` and set:
```json
{
  "mcpServers": {
    "activitywatch": {
      "command": "activitywatch-mcp-server",
      "args": []
    }
  }
}
```
Restart Claude Desktop; confirm the MCP tools load.
3. **Claude Code (CLI):** add at user scope:
```
claude mcp add activitywatch -s user -- activitywatch-mcp-server
```
If you must use the npx form on native Windows, wrap it: `claude mcp add activitywatch -s user -- cmd /c npx -y activitywatch-mcp-server` (the global‑install path above avoids the `/c`‑mangling bug).
4. Verify in Claude Code: `/mcp`, then ask "What ActivityWatch buckets do I have?"

**Checkpoint:** both clients list the `activitywatch` server and return your bucket list.

### Phase 3 — Master build prompt (Claude Code auto‑scaffolds the rig)
Create `C:\Users\Nikhil\jarvis`, `cd` in, run `claude`, paste **Appendix A**. Claude writes every file; you review and approve.

**Checkpoint:** `.claude\agents\` holds six `.md` files; `%USERPROFILE%\.claude\settings.json` holds the hooks block; `scripts\` holds the hook scripts.

### Phase 4 — The six subagents
See **Appendix B** for full contents.

### Phase 5 — The hooks
See **Appendix C**. Node‑based for Windows portability.

### Phase 6 — AI scheduled tasks (Desktop, on subscription)
1. In Claude *Desktop* → **Routines** (sidebar) → **New routine** → **Local** (this is a Desktop scheduled task on your machine, not a cloud routine).
2. **Kickoff:** name "Morning kickoff", working folder = rig folder, Weekdays 09:00, prompt: *"Run the daily kickoff: load state, summarize yesterday's audit, set today's Building target, and list the first task."*
3. **Audit:** "Evening audit", Weekdays 20:00, prompt: *"Use the auditor subagent to run today's 3‑bucket audit from ActivityWatch, then have the distribution subagent draft the build‑log post."*
4. Settings → Desktop app → General → enable **Keep computer awake**.
5. Verify with **Run now** on each.

**Checkpoint:** both tasks appear under "Scheduled"; "Run now" produces a correct session; prompts are stored under `%USERPROFILE%\.claude\scheduled-tasks\`.

### Phase 7 — Deterministic ntfy belt (Windows Task Scheduler)
1. Install the ntfy phone app; subscribe to topic `nikhil-jarvis`.
2. In an **elevated Command Prompt** (`curl.exe` is built into Windows 10/11):
```
schtasks /create /tn "jarvis-9am" /sc weekly /d MON,TUE,WED,THU,FRI /st 09:00 /tr "curl -H \"Title: Kickoff\" -H \"Priority: high\" -d \"9 AM: state your Building target and start\" ntfy.sh/<old-topic-redacted>"

schtasks /create /tn "jarvis-8pm" /sc weekly /d MON,TUE,WED,THU,FRI /st 20:00 /tr "curl -H \"Title: Audit\" -H \"Priority: high\" -d \"8 PM: run /audit and log the day\" ntfy.sh/<old-topic-redacted>"
```
(`/d MON,TUE,WED,THU,FRI` restricts to weekdays; add `SAT` for Mon–Sat.)
3. Test: `schtasks /run /tn "jarvis-9am"` — phone should buzz.

**Checkpoint:** `schtasks /query /tn "jarvis-9am"` shows the task and the phone receives the push.

### Phase 8 — Per‑project build‑time logging (timelog plugin)
Inside Claude Code:
```
/plugin marketplace add RemoteCTO/claude-plugins-marketplace
/plugin install timelog
```
Restart Claude Code; confirm a JSONL file in `%USERPROFILE%\.claude\timelog\`.

---

## Appendix A — The single master build prompt (paste into Claude Code)

```
You are scaffolding my "Tier-2 accountability rig" in the CURRENT working directory on Windows.
Node ships with Claude Code, so write all hook scripts in Node (.mjs) invoked via `node`,
NOT bash — this avoids CRLF/Git-Bash breakage on Windows. Use os.homedir()/path.join(), never
hardcode separators. Do the following, showing me each file before writing and asking approval:

1. Create these folders: .claude\agents, .claude\hooks, state.

2. Create SIX subagent files in .claude\agents\ EXACTLY as specified below (I will paste the
   frontmatter+body specs from the guide's Appendix B). Only `name` and `description` are
   required; include the extra fields shown. Do not invent tools.

3. Create .claude\settings.json with a hooks block containing:
   - SessionStart -> node .claude/hooks/session-start.mjs  (loads state gist + local state files)
   - PostToolUse matcher "Edit|Write|MultiEdit" -> node .claude/hooks/post-edit-test.mjs
   - Stop -> node .claude/hooks/stop-guard.mjs  (blocks fabricated numbers / placeholders, exit 2)
   Write the three .mjs scripts in .claude\hooks\ per Appendix C.

4. Create a /audit slash command (.claude\commands\audit.md) that invokes the auditor subagent,
   then the distribution subagent.

5. Print—but DO NOT run—the two `schtasks /create` commands for the 9am/8pm ntfy pushes to
   topic nikhil-jarvis (I will run them myself in an elevated prompt).

Confirm at the end which steps still require me to act manually (installing ActivityWatch,
editing Claude Desktop JSON, approving MCP, creating Desktop scheduled tasks, running schtasks).
```

## Appendix B — The six subagent files (`.claude\agents\*.md`)

**auditor.md**
```markdown
---
name: auditor
description: Reads ActivityWatch time data and produces the daily 3-bucket audit (Learning / Building / Meta), compares Building against target, and flags multi-week focus decline. Use for /audit and the evening scheduled task.
tools: Read, Write, Bash
mcpServers:
  - activitywatch
memory: project
model: sonnet
---
You are the Auditor. Each run:
1. Query ActivityWatch (via the activitywatch MCP tools) for today's window, AFK, and web buckets.
   Use a single AQL string per query array element (do not split statements across array elements).
2. Classify active (not-AFK) time into three buckets:
   - Learning: docs, courses, reading, note-taking.
   - Building: editors/IDEs, terminals, Claude Code, running/testing code.
   - Meta: email, chat, planning, admin, browsing that isn't learning.
3. Report minutes and % per bucket. Compare Building against the target in MEMORY.md
   (default: >=60% Building over a rolling 2-week window).
4. Append today's Building % to MEMORY.md. If Building share has dropped for 3 consecutive
   weeks, flag a "SLIDE" prominently.
5. Never fabricate numbers. If a bucket is empty or data is missing, say so explicitly.
Update your memory with recurring app->bucket mappings you learn.
```

**examiner.md**
```markdown
---
name: examiner
description: Adversarial mock interviewer (= THE SCRIMMAGE). Grills me one question at a time and grades me against THE DOSSIER (OPPONENT_SCOUT.md) — its §4 probe-bank and §1 time-weights, not a generic 0-5 rubric. Use when I ask to be tested or to prep for interviews.
tools: Read, Write
memory: project
model: sonnet
---
You are the Examiner (a.k.a. THE SCRIMMAGE), a demanding but fair technical interviewer. Each session:
1. Read state\OPPONENT_SCOUT.md — THE DOSSIER, the opponent test-set. Draw your questions from its §4 probe-bank and weight your coverage by its §1 time-weights (probe the heaviest-weighted areas most). If state\target-role.md exists, use it only to choose which slice of the Dossier to focus on.
2. Ask ONE question at a time, taken from the probe-bank; do not reveal the rubric.
3. Grade each answer against the Dossier's §4 per-probe criteria — the generic 0-5 on correctness/depth/communication/edge-case is DEAD; use the Dossier's own standard for that probe-type.
4. After 5 questions, give a total weighted by the §1 time-weights, the two weakest probe-areas, and a concrete drill for each.
Do not be flattering. Do not accept vague answers—push for specifics.
```

**ledger-keeper.md**
```markdown
---
name: ledger-keeper
description: The single canonical store of my repeat mistakes and their fixes across all projects (the Gemini learning-packet watch-list is its packet-shaped mirror, not a separate truth). Use proactively whenever a mistake, bug pattern, or bad habit recurs, and when I ask "have I done this before".
tools: Read, Write
memory: user
model: haiku
---
You are the Ledger-keeper. Maintain a durable record of recurring mistakes.
On each invocation:
1. Read MEMORY.md.
2. If given a new mistake, record it with: date, category, one-line description, the fix,
   and increment a recurrence count if it matches an existing entry.
3. When asked, surface the top repeat offenders and whether they are trending down.
Keep entries terse. Curate MEMORY.md so it never exceeds the injected limit.
This MEMORY.md is the ONE canonical mistake-store; the watch-list injected into Gemini learning-packets is its packet-shaped mirror (same truth, different projection), never a second record.
```

**scout.md**
```markdown
---
name: scout
description: Weekly web-search field-scan of the job market for my target role (= THE SCOUT). Its weekly diff FEEDS THE DOSSIER (OPPONENT_SCOUT.md) via the §9 closed-loop. Use for the weekly market scan; safe to run as a cloud routine since it needs only web access.
tools: WebSearch, Read, Write
memory: project
model: sonnet
---
You are the Scout. Weekly:
1. Read state\target-role.md for role, location, and seniority.
2. Search for current postings and required skills for that role.
3. Produce: the 5 most-requested skills this week, any NEW skill appearing vs. last run
   (compare against MEMORY.md), and 3 concrete postings worth reading.
4. Save this week's skill list to MEMORY.md for next-week diffing.
5. Write this week's NEW-skill diff into THE DOSSIER (state\OPPONENT_SCOUT.md) via its §9 closed-loop, so the test-set stays current with real market signal — this is exactly what THE SCRIMMAGE later grades against.
Cite each claim with the source. Do not invent postings or salaries.
```

**curriculum.md**
```markdown
---
name: curriculum
description: Surfaces what I should revise next by reading two real sources of truth — the Re-Jirah controller and the Progress-Tracker fluency-states; it keeps NO decay-model of its own. Use during kickoff to pick today's single revision topic.
tools: Read, Write
memory: project
model: sonnet
---
You are the Curriculum agent — a SURFACING arm, not a decay model. Do NOT invent your own confidence scores or spaced-rep schedule.
1. Read the two real sources of truth: (a) the Re-Jirah controller's per-axis due-state for foundations concepts, and (b) the Progress-Tracker fluency-states for Python subtopics (🔴 Learning / 🟡 Held / 🟢 Fluent).
2. From those, identify the single highest-value item due today — most decayed, longest overdue, or weakest fluency.
3. Surface that one topic plus one quick self-check question.
4. After I confirm review, write only a pointer + date to MEMORY.md (which topic surfaced, when) — MEMORY.md is a cache, never your own confidence ledger.
Never surface more than one primary topic per day.
```

**distribution.md**
```markdown
---
name: distribution
description: Drafts a daily build-log / LinkedIn post from today's work and prepares (but does not push) a git commit. Use at the end of the evening audit.
tools: Read, Write, Bash
model: sonnet
---
You are the Distribution agent. Each run:
1. Read today's auditor output and the git log/diff for the current repo.
2. Draft a 120-180 word build-log post: what I built, what I learned, one honest struggle.
   Plain first-person voice, no hype, no fabricated metrics.
3. Stage changes and PREPARE a conventional-commit message. Print `git commit` for me to run;
   do NOT push. Never invent numbers not present in the audit or the diff.
```

## Appendix C — The three hook scripts (Node, Windows‑safe) and `settings.json`

**`.claude\settings.json`** (project scope; use `%USERPROFILE%\.claude\settings.json` for global)
```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "node .claude/hooks/session-start.mjs", "timeout": 20 } ] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write|MultiEdit",
        "hooks": [ { "type": "command", "command": "node .claude/hooks/post-edit-test.mjs", "timeout": 120 } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "node .claude/hooks/stop-guard.mjs", "timeout": 20 } ] }
    ]
  }
}
```

**`.claude\hooks\session-start.mjs`** — auto‑loads state (gist + local files). Its stdout is injected into Claude's context.
```javascript
import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const GIST_URL = process.env.JARVIS_GIST_URL || ""; // e.g. https://gist.githubusercontent.com/.../raw
let out = "## Jarvis state loaded at session start\n";

if (GIST_URL) {
  try {
    const gist = execSync(`curl -fsSL "${GIST_URL}"`, { encoding: "utf8" });
    out += "\n### Remote state (gist)\n" + gist.slice(0, 4000) + "\n";
  } catch { out += "\n(gist fetch failed — continuing with local state)\n"; }
}

const stateDir = join(process.cwd(), "state");
if (existsSync(stateDir)) {
  for (const f of readdirSync(stateDir)) {
    try { out += `\n### state/${f}\n` + readFileSync(join(stateDir, f), "utf8").slice(0, 2000) + "\n"; }
    catch {}
  }
}
process.stdout.write(out);   // injected as additionalContext
process.exit(0);
```

**`.claude\hooks\post-edit-test.mjs`** — runs tests after code edits. Reads the hook JSON from stdin.
```javascript
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

let raw = ""; process.stdin.on("data", d => raw += d);
process.stdin.on("end", () => {
  // Only run if the project has a test script
  if (!existsSync("package.json")) process.exit(0);
  try {
    const pkg = JSON.parse(execSync("type package.json", { shell: "cmd.exe", encoding: "utf8" }));
    if (!pkg.scripts || !pkg.scripts.test) process.exit(0);
  } catch { process.exit(0); }
  try {
    execSync("npm test", { stdio: "pipe", encoding: "utf8" });
    process.exit(0);
  } catch (e) {
    process.stderr.write("Tests failed after edit:\n" + (e.stdout || e.message).slice(0, 3000));
    process.exit(2);  // block; feedback returned to Claude
  }
});
```

**`.claude\hooks\stop-guard.mjs`** — blocks unresolved placeholders / fabricated‑number markers in the final turn.
```javascript
import { readFileSync } from "node:fs";

let raw = ""; process.stdin.on("data", d => raw += d);
process.stdin.on("end", () => {
  let input = {}; try { input = JSON.parse(raw); } catch {}
  if (input.stop_hook_active) process.exit(0); // avoid infinite loop

  let text = "";
  try { text = readFileSync(input.transcript_path, "utf8"); } catch { process.exit(0); }
  // Look only at the tail of the transcript (last assistant turn)
  const tail = text.slice(-6000);
  const banned = [/TODO/i, /\bTBD\b/i, /\bXXX\b/i, /<placeholder>/i, /\[insert[^\]]*\]/i, /\bFIXME\b/i];
  const hit = banned.find(r => r.test(tail));
  if (hit) {
    process.stderr.write(`Blocked: unresolved placeholder/fabrication marker detected (${hit}). Resolve it before finishing.`);
    process.exit(2);  // forces Claude to keep working
  }
  process.exit(0);
});
```
> Note: `stop-guard` is intentionally conservative. Tune the `banned` list to your needs; an always‑blocking Stop hook would loop forever, which is why `stop_hook_active` is checked first.

---

## Recommendations
1. **Build strictly in order 0→1→2, verifying each checkpoint, before writing any AI config.** The rig is worthless if ActivityWatch data or the MCP link isn't confirmed. Only then run the master prompt (Phase 3).
2. **Treat the ntfy belt as the source of truth for "did I show up."** The AI tasks are best‑effort (need the app open + PC awake); the `schtasks`/ntfy pushes are deterministic. If you often close the Desktop app, you *could* also drive the audit via a Windows‑Task‑Scheduler + `claude -p` headless call — **but that is the single feature to watch**: it works on the subscription today, yet `claude -p` is exactly what the *paused* metered split targeted. Prefer Desktop tasks; keep headless as a fallback only.
3. **Encode the Building target and slide rule in the auditor's `MEMORY.md`** (default: ≥ 60% Building over a rolling 2‑week window; flag "slide" if Building share falls 3 consecutive weeks). Revisit monthly.
4. **Cost tripwires that change the plan:** if you hit usage limits *before* 8 PM, lower the scheduled task's model to Sonnet/Haiku and reduce `effort`; if runs get **rejected** (not billed), that confirms overflow is correctly off — the desired state. Only consider Max 20x if interactive work is being starved by the scheduled jobs. If you ever see an actual charge, immediately check for a stray `ANTHROPIC_API_KEY` and that "usage credits" is off.

## Caveats
- **Unavoidable manual steps (Claude Code cannot do these):** installing ActivityWatch and its browser extension; editing `%APPDATA%\Claude\claude_desktop_config.json`; approving MCP servers in each client; creating/confirming the Desktop scheduled tasks in the GUI; running the `schtasks` commands in an elevated shell (Claude can *generate* them, you run them); installing the ntfy phone app and subscribing; granting Windows/PowerShell permissions.
- **Cloud Routines are unsuitable for the ActivityWatch audit** — they run in an Anthropic cloud sandbox that cannot reach `localhost:5600`. Use them only for web‑only work like the Scout's market scan, subject to the **15/day Max cap**.
- **The billing picture can change.** The Agent SDK/`claude -p`/GitHub Actions metered split is *paused, not cancelled*; Anthropic committed to advance notice before shipping a revised version. Interactive Claude Code, Desktop tasks, `/loop`, and Cowork are the safe core; anything driven through `claude -p` headless or the Agent SDK is the part that could later become metered.
- **Routines are a research preview** — the 15/day Max cap and behavior may change.
- **Windows hook fragility:** CRLF line endings, Git‑Bash path translation, and PowerShell execution policy (`Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`) are the common failure points; the Node‑based scripts in Appendix C minimize these. If a hook silently no‑ops, check line endings and that `node` is on PATH.
- **Version note:** subagent/hook syntax verified against Claude Code docs at v2.1.198–2.1.200 (as of July 7, 2026). Fields like `memory`, `background`, and `isolation` are recent — confirm `claude --version` supports them. The ActivityWatch MCP AQL quirk (all statements in one string per array element) is a documented source of query errors; the auditor prompt already accounts for it.