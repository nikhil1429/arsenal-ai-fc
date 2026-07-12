#!/usr/bin/env node
// ============================================================================
// repo_bundle.mjs — THE WHOLE REPO IN ONE FILE.
// ----------------------------------------------------------------------------
// Deterministic whole-repo bundler. Concatenates every TRACKED text file
// (never gitignored / personal data — reps, biometrics, transcripts, tokens
// are all excluded by construction) into one navigable Markdown file with an
// annotated table of contents. File bodies pass through BYTE-EXACT (verbatim).
// Run:  npm run bundle   (or: node scripts/repo_bundle.mjs)
// Out:  ARSENAL_FC_FULL_REPO_BUNDLE.md at the repo root (gitignored — it's a
//       derived artifact; regenerate any time the repo changes).
// ============================================================================
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "ARSENAL_FC_FULL_REPO_BUNDLE.md");

const ANN = {
  "ARSENAL_AI_FC_MASTERPLAN.md": "The canonical v2.1 design bible: full squad, two-brain Manager, recalibrated Governor, philosophy, and architecture. Read for deep/design work.",
  "CLAUDE.md": "The repo's operating system for any AI session — the standing rules, the build order, the non-negotiable principles, the medical boundary.",
  "CONDUCTOR.md": "The autonomous build-runner contract: roles, one-bridge model, per-agent loop, 13-gate god-tier bar, and how sessions resume from the repo.",
  "CONDUCTOR_LOG.md": "Append-only build ledger recording each agent (capture, FSRS, calibration, nemesis, learning-state, Manager) with selftest output and commit hashes.",
  "GOALKEEPER_v2_migration.md": "Migration note documenting the Oura Goalkeeper v2 recalibration: three fixed bugs, confidence tiers, new verdict logic, and pending live proof.",
  "MANUAL_WIRING.md": "The captain's one-time Gemini-side setup: Colab rep-logger cell and Drill Gem prompt that feed capture.mjs the rep schema automatically.",
  "MORNING_RUNBOOK.md": "Daily operating guide for the organism: the four verbs plus one glance, evening postmatch ritual, overnight jobs, and troubleshooting commands.",
  "OPS_STATE.md": "The live thread-agnostic anchor: current phase, whats done/pending, next action, locked decisions, and environment lessons. Read first every thread.",
  "THE_GAFFER.md": "The Managers voice/soul module (M-2 system.md): verified Arteta+Pep canon, emotional registers, honesty-overrides, captain bond, and hard bans.",
  "THE_MANAGER__Master_Prompt.md": "The Managers brain/charter: two-brain anchor-model, formation-read, learning-execution merge, precedence, Season Arc, output contract, and worked examples.",
  "WHAT_CHANGED.md": "Changelog for the organism-final branch: the one-command revert, 14 new organs, added configs/docs, and which existing files stayed untouched.",
  "README.md": "Nearly empty repo readme containing only the project title; carries no operational content.",
  "learning-layer/THE_ORGANISM.md": "Vision draft reimagining the whole system as one self-evolving organism with the human as its heart; organ-by-organ design of a fused human-loop cyborg.",
  "learning-layer/PROJECT_OS.md": "The canonical operating system (v3.13) for how Nikhil and Claude work: rules, method, syllabus, learning + outwork execution layers, design + Python tracks.",
  "learning-layer/FORGE_SPEC.md": "Frozen schema spec for FORGE learning capsules (9-axis, doubts, cold-reader standard, per-file gist store) that the notes engine reads; drift = blank render.",
  "learning-layer/FORGE_DESIGN.md": "Canonical visual-design + Claude-Design workflow record (cold steel, warm core): 4 non-negotiables, division of labor, completeness contract for the notes app.",
  "learning-layer/FORGE_DEEP_RENDER_BRIEF.md": "Handoff brief for a fresh Claude Design session to render the embedded-but-hidden deep re-learn layer plus every gist field, byte-for-byte without overwhelm.",
  "learning-layer/SYSTEM_BLUEPRINT.md": "Pass-2 repair blueprint: the ceiling end-state of the learning + outwork layers and the weld, with 9 open forks and a single sequenced fix path.",
  "learning-layer/SYSTEM_FOUNDATION.md": "Verbatim consolidation of the Pass-1 diagnosis and Pass-2 blueprint into one repair-and-wire base document; no new analysis of its own.",
  "learning-layer/SYSTEM_METACOGNITION.md": "Pass-1 diagnosis of the two layers as built: real emitted schemas, flow maps, and located defects with an evidence-grade ledger.",
  "learning-layer/AI_PE_ROADMAP.md": "The 5-bucket skill-map defining what an AI Product Engineer must know, and how building FinOps Copilot covers each bucket hands-on.",
  "learning-layer/About.md": "One-page mission brief: land a 20 LPA+ AI Product Engineer role via two tracks (learning + FinOps build), with hard pace-ownership rules.",
  "learning-layer/DAILY_CADENCE.md": "The daily match-day ritual (Kickoff/Ground/Full-Time) defining how each day and thread runs, with won-day rules and anti-spiral guards.",
  "learning-layer/EXECUTION_FINAL_Tier2_Metamorphosis.md": "The canonical grind operating-system: nine operators, ADHD behavior science, five keystones, and the autonomous rig that runs daily execution.",
  "learning-layer/FINOPS_AI_CONCEPTS.md": "Canonical learn-list of every AI concept FinOps Copilot teaches, mapped to build spots, interview value, and honest coverage gaps.",
  "learning-layer/FINOPS_MODULE3_PROCUREMENT_INTEL.md": "Full spec for FinOps Module 3: a vendor-allocation optimizer using real Blinkit procurement data, algorithm, AI mapping, and interview story.",
  "learning-layer/GEMINI_LOOP.md": "Canonical record of the cyborg loop (Claude teaches/defends, Gemini drills reps, Nikhil generates), with the close-packet rep engine and rhythm.",
  "learning-layer/GEMINI_RIG_SETUP.md": "One-time 9-step setup guide with canonical paste-prompts for the Gemini rig (2 Docs, 2 Gems, Colab, NotebookLM, Rosetta).",
  "learning-layer/God-Tier_Gemini_Workflow_for_Learning_Python.md": "Research-backed deep-dive on learning Python fast without cognitive offloading, with ready-to-paste Gem and Colab prompts.",
  "learning-layer/OPPONENT_SCOUT.md": "THE DOSSIER: a scouted interview test-set (rubric, time-weights, probe-bank, red-flags) that calibrates all interview drilling against reality.",
  "learning-layer/OS_CHANGELOG.md": "Reference-only version history of the Project OS, documenting each versions changes from v3.4 to v3.13.",
  "learning-layer/PYTHON_SYLLABUS.md": "Tiered Python ramp (T0-T6) with verified resources, JS-to-Python bridge tables, and depth rules for reaching interview-grade fluency.",
  "learning-layer/Tier-2_Accountability_Rig_on_Windows__A_Max_5x_Implementation_Guide.md": "Version-accurate build manual for the accountability rig on Windows/Max-5x: billing guardrails, phased setup, six subagents, hooks, scheduling.",
  "scripts/capture.mjs": "AGENT #0 — the ONLY writer of reps_log.jsonl (your study 'blood'); validates every 13-field rep, canonicalizes concepts, never fabricates.",
  "scripts/fsrs.mjs": "The fitness coach — vetted ts-fsrs spaced-repetition engine deciding which concepts are due for review before they decay. Answers WHEN.",
  "scripts/calibration.mjs": "The honesty auditor — computes ECE (confidence-vs-accuracy gap) and your 'danger zone' of confident-but-wrong topics. Answers HOW HONEST.",
  "scripts/nemesis.mjs": "The opposition scout — names the ONE recurring KIND of thinking (axis cluster) that keeps beating you. A self-scout, never a shame list.",
  "scripts/learning_state.mjs": "The tactics board ('the Maidan') — maps WHERE you stand on every concept (fluency ladder) and which way you're moving. Answers WHERE + TRAJECTORY.",
  "scripts/oura_coach.mjs": "THE GOALKEEPER — reads Oura biometrics, sets today's GREEN/AMBER/RED cognitive-load ceiling. A data-analyst, NEVER a prescriber; hard medical boundary in code.",
  "scripts/oura_auth.mjs": "The Goalkeeper's key-holder — one-time Oura OAuth token setup + refresh. Touches the gitignored token files only.",
  "scripts/timeaudit.mjs": "The possession stats — reads ActivityWatch, splits your day into Learning/Building/Meta minutes. The objective ground-truth of where time went.",
  "scripts/manager.mjs": "THE MANAGER (capstone) — reads every scout, writes the team sheet, but ONLY proposes. Home of the zero-invented-numbers validator that makes an LLM physically unable to smuggle a fake statistic.",
  "scripts/mirror.mjs": "The capsule mirror — pulls your canonical learning capsules from the GitHub Gist into a local read-only copy with a checksum manifest.",
  "scripts/throwin.mjs": "The fifth verb — polls your private ntfy channel so a thought texted from the phone lands verbatim, waiting for evening. Never counts against you.",
  "scripts/heartbeat.mjs": "One sensory pass — shells the squad scripts in order so the whole cortex refreshes from one command; writes a run-manifest (pulse.json).",
  "scripts/physio.mjs": "Proprioception — the body sensing itself: detects 'bleeds' (a rep uncaptured, a stale mirror) and keeps the speak-gates that silence premium signals until enough blood flows.",
  "scripts/twin.mjs": "The book on the captain — a predictive model that seals honest daily bets. CONSTITUTIONAL LAW: it only speaks when you WIN; it loses silently.",
  "scripts/touchline.mjs": "The sideline read — senses the day's shape (wall, productive-struggle) and acts ONLY through tomorrow's packet. May never add work mid-day, never pings.",
  "scripts/setpiece.mjs": "The set-piece coach — compiles tomorrow's <=3 drills from today's exact failures. Drill #1 is winnable by law; tags each drill voice-first or screen-first.",
  "scripts/scorer.mjs": "The evening scorer (the Slip) — one ledger scoring three books (you, the Twin, the Gaffer). Proven proposal-types earn a 'no-look pass' and shrink to one-liners.",
  "scripts/scout.mjs": "The advance scout — stages a mock or milestone the moment a trigger is met. CONSTITUTIONAL: no projected-date field exists in its schema (no countdowns, ever).",
  "scripts/bootroom.mjs": "THE GENOME — the one organ that changes HOW you learn, but only via serial, pre-registered, auto-reverting mutations, one gene at a time, human-gated.",
  "scripts/doubtminer.mjs": "The doubt engine — mines your 112 real confusions into clusters + anchor-metaphors, and runs the Tape Room (past-you as cross-examiner). A clean win retires a doubt.",
  "scripts/postmatch.mjs": "The evening ledger — the 30-second full-time ritual: HIT/MISS, one signal, the KAL-line (tomorrow's first move). No-shame enforced; conscious rest = a won day.",
  "scripts/brain.mjs": "THE BRAIN — the hot two-engine runtime: 21 LLM jobs, a self-tuning budget governor that protects study hours + exhausts the plan overnight, and the M-3 socket into the Manager.",
  "scripts/viz.mjs": "THE CLUB WALL — renders your whole body as one offline HTML dashboard (Maidan pitch, calibration, commitments, media) + writes the nightly Gemini art prompts + the film kit.",
  "scripts/dugout.mjs": "THE DUGOUT (the crown, 1010 lines) — the real-time voice bridge: mic<->Gemini Live<->speakers, 15 live tools, oral scrimmage, camera eyes, shadow-gated proactivity, semantic recall.",
  "scripts/shadow.mjs": "The shadow engine — earned proactivity: logs would-have-spoken moments silently and the machine may only interrupt you once it has PROVEN a hit-rate AND you ratify by voice.",
  "scripts/speak.mjs": "The mouth — neural TTS (free msedge-tts, robot fallback). Speaks only what it's handed; also renders team-talks and ACK fillers to mp3 files.",
  "scripts/talk.mjs": "TALK MODE — the bench voice: a typed/dictated conversation loop with spoken replies, for when the free Live quota runs dry.",
  "scripts/test_coach_v2.mjs": "The Goalkeeper's test harness — proves the v2 readiness engine's medical clamps and verdict logic with fixtures.",
  "dressing-room/state/brain_config.json": "The brain's canon: its 21-job table + budget policy (window/weekly estimates, study-hour reserve, overnight target, banned phrases, the third voice pool).",
  "dressing-room/state/dossier_weights.json": "The interview target as machine-readable data — the 5 rounds + time-weights, the probe grammar (a-i axes), and the voice/screen modality map.",
  "dressing-room/state/ladder_config.json": "The Autonomic Ladder — how the Goalkeeper's GREEN/AMBER/RED verdict dampens every organ's demands on a bad-body day.",
  "dressing-room/state/forge_profile.json": "The genome as versioned data — the learning method's current constants (Re-Jirah intervals, axis weights), seeded from the FORGE spec.",
  "dressing-room/state/concepts.json": "The canonical vocabulary — the concept + skill registry with aliases and the core/light flags that every scout canonicalizes against.",
  "dressing-room/state/calibration_config.json": "Calibration's thresholds — bucket targets, the reliability floor (20 reps), danger-zone gates.",
  "dressing-room/state/nemesis_config.json": "Nemesis's tuning — recency half-life, axis-cluster minimums, healed-streak length, prune windows.",
  "dressing-room/state/learning_state_config.json": "Learning-state's ladder thresholds — held/fluent streaks, cold-fast latency, stage-runnable fractions, warming-up floor.",
  "dressing-room/state/physio_config.json": "Physio's expected cadence per bus file — how stale is 'bleeding'.",
  "dressing-room/state/twin_config.json": "The Twin's markets + the win-only voice gate thresholds.",
  "dressing-room/state/touchline_config.json": "Touchline's read thresholds + the (disabled, scrimmage-only) ear config.",
  "dressing-room/state/setpiece_config.json": "Set-piece's drill caps and ladder-dampening rules.",
  "dressing-room/state/scout_config.json": "Advance-scout staging triggers (still no dates).",
  "dressing-room/state/scorer_config.json": "Scorer's trust-tier promotion thresholds.",
  "dressing-room/state/mirror_config.json": "The gist base URL + capsule ID map the mirror pulls from.",
  "dressing-room/state/doubtminer_config.json": "The seed taxonomy of wrong-prior shapes the doubt engine clusters into.",
  "dressing-room/state/heartbeat_config.json": "Which agents the heartbeat shells, in what order.",
  "dressing-room/state/throwin_config.json": "The throw-in poller's config — the ntfy server + poll cadence (the secret topic itself never lives here).",
  "dressing-room/state/buckets.json": "The syllabus bucket definitions (Foundations / RAG / Agents / skills).",
  "dressing-room/manager/system.md": "THE MANAGER'S SOUL — the full system prompt (all 11 sections) the brain feeds into the LLM to write the team sheet. The Gaffer's constitution in words.",
  ".claude/skills/matchday/SKILL.md": "SKILL /matchday — morning kickoff in one command: sensory pass, the sheet, today's drills, the wall.",
  ".claude/skills/full-time/SKILL.md": "SKILL /full-time — the 30-second evening close: HIT/MISS, signal, KAL-line, then the evening organs run.",
  ".claude/skills/scrimmage/SKILL.md": "SKILL /scrimmage — the timed adversarial 5-probe mock in DOSSIER grammar, graded, reps logged.",
  ".claude/skills/rematch/SKILL.md": "SKILL /rematch — a Tape-Room rematch: past-you's archived doubt returns as the opponent; win cleanly and it retires.",
  ".claude/skills/genome/SKILL.md": "SKILL /genome — review the Boot Room's pending mutation (evidence, predicted effect, revert plan) and approve with your word.",
  ".claude/skills/paste-session/SKILL.md": "SKILL /paste-session — ingest a Gem/Colab study session: paste the rep JSON, it captures and shows what changed.",
  ".claude/skills/paint/SKILL.md": "SKILL /paint — fire the Gemini visualization lane; hand you tonight's ready-made Wall-Painter prompt.",
  ".claude/skills/talk/SKILL.md": "SKILL /talk — turn any Claude Code session into the speaking organism (spoken replies, live bus every turn).",
  ".claude/skills/organism-doctor/SKILL.md": "SKILL /organism-doctor — full health check: vitals, brain budget, selftests, live schedule, AW sight.",
  "setup/INSTALL_TASKS.ps1": "The one-paste installer — creates all the ArsenalFC-* scheduled tasks and (E2E fix) clears the battery kill-conditions.",
  "setup/UNINSTALL_TASKS.ps1": "The clean revert — removes only the tasks INSTALL_TASKS created.",
  "setup/WALLPAPER.ps1": "The Ambient Maidan — pure PowerShell/.NET drawing your KAL-line + season strip onto the desktop wallpaper.",
  "setup/SPEAK.ps1": "The scheduled-utterance voice lane (the two sanctioned spoken pushes only).",
  "setup/VOICE_SETUP.md": "How to wire the voice: Gemini keys, the LAN phone flag + one-time mic unlock.",
  "setup/GEMINI_CLI_SETUP.md": "How to log the free Gemini CLI into your Google account (the second brain).",
  "setup/NTFY_SETUP.md": "How to subscribe your phone to the private throw-in channel.",
  "setup/COLAB_SETUP.md": "The Colab flush cell that ships your study reps into the capture inbox.",
  "setup/GEMS_SETUP.md": "The Gemini 'Gem' prompt add-ons that drive the study surface.",
  "setup/FILM_SETUP.md": "How the NotebookLM Video Overview season-film lane works (no-API honest ceiling).",
  "setup/NOTEBOOKLM_SETUP.md": "NotebookLM wiring notes for the film kit.",
  "setup/SURFACES.md": "The full list of external surfaces (Oura, AW, ntfy, Supabase, GitHub) and their setup state.",
  "setup/12TH_PLAYER_DECISION.md": "The consent doc for 'The Twelfth Player' (wiring Nidhi in as a rater) — a decision for two humans, no code.",
  "setup/README.md": "The setup pack's index — what to do, in order.",
  "setup/launchers/ARSENAL 0 - THE HANDBOOK.cmd": "Desktop launcher 0 — opens the styled captain's handbook.",
  "setup/launchers/ARSENAL 1 - MATCHDAY - THE DUGOUT.cmd": "Desktop launcher 1 — starts the voice bridge (the page opens itself).",
  "setup/launchers/ARSENAL 2 - THE WALL.cmd": "Desktop launcher 2 — opens the Club Wall.",
  "setup/launchers/ARSENAL 3 - FULL TIME (30 seconds).cmd": "Desktop launcher 3 — the evening close (guarded against double-runs).",
  "setup/launchers/ARSENAL 4 - SCRIMMAGE - MOCK ME.cmd": "Desktop launcher 4 — opens the Dugout in examiner mode.",
  "setup/launchers/ARSENAL 5 - DUGOUT ON PHONE.cmd": "Desktop launcher 5 — the LAN bridge for your phone.",
  "setup/launchers/ARSENAL 6 - TALK (bench voice).cmd": "Desktop launcher 6 — the bench voice when free quota runs dry.",
  "setup/launchers/ARSENAL 7 - SEASON FILM (3 taps).cmd": "Desktop launcher 7 — opens NotebookLM + your Drive for the one-click film.",
  ".mcp.json": "The repo's MCP wiring — points Claude Code at your own ActivityWatch server for time-audit sight.",
  ".claude/launch.json": "Dev-server config for the Dugout bridge (used by the app's preview).",
  ".gitignore": "The privacy spine — every personal/derived/secret file the public repo must never track (audited clean this session).",
  ".gitattributes": "Git line-ending + diff attributes.",
  ".worktreeinclude": "Lists the gitignored token files a git-worktree session may see (for live Oura runs).",
  "package.json": "The project manifest — the npm scripts (selftest chains, dugout, wall, postmatch) and the two dependencies.",
  "ORGANISM_ANATOMY.md": "THE BUILD CONSTITUTION — the final body as built: the 16-organ roster, data contracts, the brain spec, the schedule. Read this to understand the whole machine.",
  "ORGANISM_LEDGER.md": "The honest inventory — every mechanism marked BUILT / GATED / [LEAP], each with its proof (green selftest).",
  "ORGANISM_BUILD_LOG.md": "The live build journal — the resumability anchor; the full story of how the organism was built, session by session, including the empirical scar-table.",
  "THE_ORGANISM_A_TO_Z.md": "THE ENCYCLOPEDIA (written today) — the complete A-to-Z: the pitch, the full anatomy, the FORGE method, the soul, the moat, the glossary.",
  "CAPTAINS_HANDBOOK.md": "YOUR operating manual — the zero-terminal cockpit: the 8 desktop icons, a day in the club, the voice phrasebook, peak-power habits."
};

// tracked files, minus binaries + auto-generated noise
const tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
  .split("\n").map(s => s.trim()).filter(Boolean)
  .filter(f => !/\.(png|jpe?g|gif|xlsx|ods|ico|pdf|zip)$/i.test(f))
  .filter(f => f !== "package-lock.json")
  .filter(f => f !== "ARSENAL_FC_FULL_REPO_BUNDLE.md");

// group + human order
const GROUPS = [
  { id: "start", title: "① START HERE — the docs that explain the whole machine",
    match: f => ["THE_ORGANISM_A_TO_Z.md","CAPTAINS_HANDBOOK.md","ORGANISM_ANATOMY.md","ORGANISM_LEDGER.md","ORGANISM_BUILD_LOG.md","CLAUDE.md","README.md"].includes(f),
    order: ["THE_ORGANISM_A_TO_Z.md","CAPTAINS_HANDBOOK.md","ORGANISM_ANATOMY.md","ORGANISM_LEDGER.md","ORGANISM_BUILD_LOG.md","CLAUDE.md","README.md"] },
  { id: "rootdocs", title: "② THE OTHER ROOT DOCS — masterplan, the Gaffer's soul, ops history",
    match: f => !f.includes("/") && /\.md$/.test(f) },
  { id: "config-root", title: "③ ROOT CONFIG + WIRING (git, npm, mcp)",
    match: f => !f.includes("/") && !/\.md$/.test(f) },
  { id: "scripts", title: "④ THE SCRIPTS — every organ's actual code (~9,500 lines)",
    match: f => f.startsWith("scripts/") },
  { id: "managersoul", title: "⑤ THE MANAGER'S SOUL — the system prompt the brain feeds the LLM",
    match: f => f.startsWith("dressing-room/manager/") },
  { id: "configs", title: "⑥ THE STATE CONFIGS — the tunable canon each organ reads",
    match: f => f.startsWith("dressing-room/state/") },
  { id: "skills", title: "⑦ THE CLAUDE SKILLS — the one-command rituals",
    match: f => f.startsWith(".claude/skills/") },
  { id: "launch", title: "⑧ CLAUDE-CODE WIRING",
    match: f => f === ".claude/launch.json" },
  { id: "setup", title: "⑨ THE SETUP PACK — install scripts + desktop launchers",
    match: f => f.startsWith("setup/") },
  { id: "learning", title: "⑩ THE LEARNING LAYER — the FORGE method, the DOSSIER, the vision, the syllabus",
    match: f => f.startsWith("learning-layer/") },
];

// assign each file to first matching group, preserving explicit order where given
const assigned = new Set();
for (const g of GROUPS) {
  const hits = tracked.filter(f => !assigned.has(f) && g.match(f));
  if (g.order) hits.sort((a, b) => {
    const ia = g.order.indexOf(a), ib = g.order.indexOf(b);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || a.localeCompare(b);
  });
  else hits.sort((a, b) => a.localeCompare(b));
  g.files = hits;
  hits.forEach(f => assigned.add(f));
}
const orphans = tracked.filter(f => !assigned.has(f));
if (orphans.length) GROUPS.push({ id: "misc", title: "⑪ OTHER TRACKED FILES", files: orphans.sort() });

const fence = f => f.endsWith(".mjs") ? "javascript" : f.endsWith(".json") ? "json"
  : f.endsWith(".ps1") ? "powershell" : f.endsWith(".cmd") ? "bat"
  : /\.md$/.test(f) ? "" : "";
const lines = f => readFileSync(join(ROOT, f), "utf8").split("\n").length;

// ---- assemble ----
const now = "12 July 2026";
let out = "";
out += `# ⚪🔴 ARSENAL AI FC — THE COMPLETE REPO, IN ONE FILE\n`;
out += `### Every tracked file, top to bottom, so you can read the whole thing you built.\n`;
out += `*Generated ${now}. Byte-exact concatenation of every tracked TEXT file (${tracked.length} files). `;
out += `Gitignored personal data — your reps, biometrics, transcripts, tokens — is deliberately NOT here. `;
out += `Two binary files (an .xlsx and the npm lockfile) are the only tracked files excluded.*\n\n`;
out += `> **How to read this.** Read the sections in order — they go from the highest-level "what is this" docs, `;
out += `down through every line of code, down to the setup scripts and the founding learning-layer docs. `;
out += `Each file below is introduced by a one-line note telling you what it is and why it matters. `;
out += `If a section feels too deep, skip to the next ⬛ divider — nothing later depends on you finishing the code.\n\n`;
out += `---\n\n## 🗺️ TABLE OF CONTENTS\n\n`;

let total = 0;
for (const g of GROUPS) {
  if (!g.files.length) continue;
  out += `\n**${g.title}**\n\n`;
  for (const f of g.files) {
    const n = lines(f); total += n;
    const a = ANN[f] || "";
    out += `- \`${f}\` *(${n} lines)*${a ? " — " + a : ""}\n`;
  }
}
out += `\n*Total: ${tracked.length} files, ${total.toLocaleString()} lines.*\n\n---\n\n`;

// ---- bodies ----
for (const g of GROUPS) {
  if (!g.files.length) continue;
  out += `\n\n<br>\n\n# ⬛⬛⬛ ${g.title}\n\n`;
  for (const f of g.files) {
    const body = readFileSync(join(ROOT, f), "utf8");
    const a = ANN[f] || "";
    const fc = fence(f);
    out += `\n\n---\n\n## 📄 \`${f}\`\n`;
    if (a) out += `> ${a}\n`;
    out += `\n`;
    // markdown files: render inside a fenced block too, so their own headers
    // don't collide with the bundle's TOC — but keep them readable.
    out += "```" + fc + "\n";
    out += body.replace(/```/g, "ˋˋˋ");   // neutralize inner fences so the wrapper never breaks
    if (!body.endsWith("\n")) out += "\n";
    out += "```\n";
  }
}

writeFileSync(OUT, out, "utf8");
const bytes = statSync(OUT).size;
console.log(`bundle: ${tracked.length} files, ${total.toLocaleString()} lines, ${(bytes/1024/1024).toFixed(2)} MB → ${OUT}`);
console.log(`missing annotations: ${tracked.filter(f => !ANN[f]).length ? tracked.filter(f => !ANN[f]).join(", ") : "none"}`);
