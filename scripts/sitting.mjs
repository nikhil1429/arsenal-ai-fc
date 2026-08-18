#!/usr/bin/env node
// ============================================================================
// sitting.mjs · ARSENAL AI FC — THE SITTING BRAIN (one mind behind every mouth)
// ----------------------------------------------------------------------------
// WHAT:  A resident daemon on http://127.0.0.1:4117 that RUNS a study sitting as a
//        state machine (L3: code drives, model composes, human speaks). It opens ONE
//        live Claude session per sitting (claudegen.session — stream-json, the head
//        cache-read after turn 1), pre-composes the sitting PLAN (map + units), and
//        then, per captain turn, either DELIVERS the next pre-composed unit (no model
//        call) or lets the model RESPOND (his doubt / his answer) — every unit lands in
//        sitting_out.jsonl and the mouth (dugout.mjs /deep → [SPEAK id=…]) speaks it and
//        acks it back through /spoken. The mouth never composes a lesson; the brain
//        never speaks. Built BLOCK 3 of ORGANISM_OVERHAUL__2026-08-18.md (§6, §16).
// LAWS:  SOLE WRITER of dressing-room/state/sitting.json (the open sitting: id, task,
//          route, plan[], cursor, stats — state.mjs reads it for the STATE line),
//          dressing-room/state/sitting_out.jsonl (APPEND-ONLY: `unit` rows the brain
//          composed + `ack` rows stamped on the mouth's /spoken — a unit is undelivered
//          iff no ack names it; nobody rewrites), dressing-room/state/sitting_log.jsonl
//          (the turn ledger: class · latency · tokens from stream-json usage · inputs
//          read — NEVER his words), dressing-room/state/sitting_reviews.jsonl (one row
//          per close; Block 4 fills the LLM fields, Block 3 writes the measured ones).
//        Everything else it touches goes THROUGH THE OWNER'S CLI, one funnel (`owner()`):
//          forge_session.mjs step|axis|moment|start|close (the pacer) · gaffer_brain.mjs
//          capture (the bank — model-free, judged at close by judge-round) · intent.mjs
//          close (§7.2) · captains_call.mjs file (ONE card, keyed) · brain.mjs
//          recordConsumption (import — the gate's C, stamped when a unit is SPOKEN).
//        WHO ELSE COULD ACT ON THIS OUTPUT? dugout.mjs (the mouth: /deep speak + /spoken +
//          /transcript → /turn) · state.mjs (STATE line reads sitting.json) · watchman
//          (`sitting-daemon-down`) · Block 4's review job · Block 5's prepare_tomorrow
//          (writes brain_out/prepare/<day>.json which `open` prefers over live assembly).
//        THE GATE (L5) — a unit's `src` lanes get a `sat` consumption row when the mouth
//          acks it: read-into-a-turn is not reached-him; SPOKEN is.
//        ONE OPEN SITTING — a second surface JOINS (surfaces[] += it), never forks.
//        NEVER BLOCKS THE MOUTH — /turn answers 202 at once; the unit lands async.
//        NO METERED KEY, EVER — the session refuses if ANTHROPIC_API_KEY is set.
//        HIS WORDS NEVER LAND IN A TRACKED FILE — sitting_out/log/reviews are gitignored;
//          sitting.json is tracked and carries the plan, never his transcript.
// FAILURE MODES (§6.7, each asserted in the selftest): child dies → ONE --resume with the
//   SAME head, mouth hears "ruko, wapas aa raha hoon" once · plan wall (limit_hit) →
//   DELIVER-ONLY (pre-composed units + bank via the gut-word he says; ONE card, keyed) ·
//   mouth/pool dies → sitting stays open, plan persists, next open resumes at cursor ·
//   two surfaces → join · idle 20 min → auto-close with review · daemon down → watchman
//   RED only if a sitting is open.
// TRANSPORT (probed 18 Aug 2026, numbers in claudegen.mjs session()): one stream-json
//   child per sitting at ONE effort (a per-spawn flag) — the child runs at effort.compose
//   because it composes the plan on its first turn and every deviation after; `respond`
//   latency is measured per turn into sitting_log and printed by `stats` (§6.6, §15).
// THE CONTROL TAIL (the model's ONLY lever on the machine — a PROPOSAL the driver
//   validates; AI proposes · code validates · human approves): the LAST line of every
//   model reply is  <<CTRL {"class":"respond|compose","bank":{"axis":"a","gut":"knew|shaky|guessed"}|null,"unit_done":true|false,"question_asked":true|false,"next":"deliver|wait"}>>
//   The tail is stripped before the text is spoken. bank is honoured ONLY when a
//   check-question is pending, the axis is legal for the route and the gut-word is in
//   the vocabulary — else refused and logged; a missing tail = respond, no bank, wait.
// PLAN FILE CONTRACT (Block 5 writes it, `open` prefers it): brain_out/prepare/<day>.json =
//   { "task": {"id","title"}, "route", "map", "units":[{step,axis,kind,text,question,est_seconds,src[]}] }
//   — re-checked for freshness at open (a task/route mismatch is not served stale).
// MODES: daemon | status | open [--surface voice|code] [--task "<title>"] [--route R] | turn --text "…" [--surface s]
//        | next | spoken <id> | close [--reason r] | review [--sitting id] [--force] [--dry] | plan | stats [--days N] | head [--out p] | selftest
// CLI:   node scripts/sitting.mjs <mode>   (env: ARSENAL_SITTING_STATE_DIR · ARSENAL_SITTING_PORT — selftest only)
// ============================================================================
import http from "node:http";
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, renameSync, statSync, mkdtempSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { tmpdir, homedir } from "node:os";
import { randomBytes } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE_DIR = process.env.ARSENAL_SITTING_STATE_DIR || join(ROOT, "dressing-room", "state");
const F = {
  sitting: () => join(STATE_DIR, "sitting.json"),
  out: () => join(STATE_DIR, "sitting_out.jsonl"),
  log: () => join(STATE_DIR, "sitting_log.jsonl"),
  reviews: () => join(STATE_DIR, "sitting_reviews.jsonl"),
  config: () => join(STATE_DIR, "sitting_config.json"),
  head: () => join(STATE_DIR, "brain_out", "sitting", "sitting_system.md"),
  prepare: (day) => join(STATE_DIR, "brain_out", "prepare", `${day}.json`),
};
export const PORT = Number(process.env.ARSENAL_SITTING_PORT || 4117);
export const SITTING_URL = `http://127.0.0.1:${PORT}`;
const TEXT_LOG = join(HERE, "sitting.log");            // *.log is gitignored; size-rotated like thalamus.log

// The vocabulary the driver validates the model's proposals against — the same three
// words capture.mjs / rejirah.mjs / gaffer_brain.mjs hold at their doors (GUT-WORD LAW).
export const GUT_WORDS = Object.freeze(["knew", "shaky", "guessed"]);
export const ROUTES = Object.freeze(["FORGE", "REJIRAH", "SCRIMMAGE", "PYTHON", "REVISION"]);
export const TURN_CLASSES = Object.freeze(["deliver", "respond", "compose", "judge"]);
export const SITTING_CTRL_GRAMMAR = '<<CTRL {"class":"respond|compose","bank":{"axis":"a-i","gut":"knew|shaky|guessed"}|null,"unit_done":true|false,"question_asked":true|false,"next":"deliver|wait"}>>';
const CTRL_RE = /<<CTRL\s*(\{[\s\S]*?\})\s*>>\s*$/;
const CONTINUE_RE = /^\s*(?:(?:haan|haa|han|ha|ok(?:ay)?|theek|thik|chalo|acha|accha)[,\s]+)?(haan|haa|han|ha|hmm+|hm+|ok(ay)?|theek( hai)?|thik( hai)?|aage( badho)?|next|chalo|continue|go( on)?|bolo|sahi( hai)?|yes|yeah|yep|samajh (aa )?gaya|samjha|got it|done|clear( hai)?|acha|accha|shuru( karo| karein| kar| ho jao)?|start( karo)?|let'?s (go|start))\s*[.!,]*\s*$/i;   // "haan shuru karo" (the live proof's first line) is a continue too
// while a BANKABLE question is pending, only an explicit skip moves on without an answer (his "aage" = "chhodo")
const SKIP_RE = /^\s*(skip( it)?|chhod(o| do)?|aage( badho)?|next( question)?|agla( sawaal)?|pata nahi[, ]*(aage|next|skip)|move on)\s*[.!,]*\s*$/i;
const GUT_RE = /\b(knew|shaky|guessed)\b|(pakka|pata (?:tha|hai)|confident|sure)|(shak|doubt|thoda|halka|kuch kuch)|(guess|andaaz|tukka|pata nahi)/i;
const gutFromText = (t) => {
  const m = GUT_RE.exec(String(t || ""));
  if (!m) return null;
  if (m[1]) return m[1].toLowerCase();
  if (m[2]) return "knew";
  if (m[3]) return "shaky";
  return "guessed";
};

// ── DEFAULT CONFIG (definitions + measured-pending hypotheses, per §5.4 — never a gate) ──
export const DEFAULT_CONFIG = Object.freeze({
  model: "opus",                       // L1: the largest model at contact. `fable` is the literal reading of L1 on this box — his call, a config key, no rebuild.
  effort: { compose: "high", respond: "high", judge: "max", _note: "one live child = ONE effort (a per-spawn flag, probed 18 Aug); the child runs at effort.compose. respond latency is MEASURED into sitting_log — §18: if p50 > 10 s, move respond down; never before the numbers." },
  transport: "stream",                 // stream (one child) · resume (one spawn per turn, ~7 s boot each — fallback) · deliver-only (no model)
  idle_close_min: 20,                  // §6.7 — a definition (his "bas" is the other close)
  turn_timeout_ms: 120000,
  unit_max_words: 110,                 // §6.3 "each ≤ ~100 words spoken" + slack
  plan_max_units: 16,
  head_ceiling_chars: 60000,           // §6.6 hypothesis: 15–20k tokens head — measured by `stats`
  latency_budget_s: { deliver: 1, respond: 8, compose: 25, judge: 40, _class: "hypothesis until 3.5's stats print" },
  claude_bin: null,                    // selftest/fixture only
  seat_words: 60,                      // a respond reply's spoken length target
});
export function loadConfig() {
  const c = readJson(F.config()) || {};
  return { ...DEFAULT_CONFIG, ...c, effort: { ...DEFAULT_CONFIG.effort, ...(c.effort || {}) }, latency_budget_s: { ...DEFAULT_CONFIG.latency_budget_s, ...(c.latency_budget_s || {}) } };
}

// ── small helpers ─────────────────────────────────────────────────────────────
function readJson(p) { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } }
function readRows(p) { try { return readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } }
function writeAtomic(p, obj) { mkdirSync(dirname(p), { recursive: true }); const tmp = `${p}.${process.pid}.tmp`; writeFileSync(tmp, JSON.stringify(obj, null, 2)); renameSync(tmp, p); }
function appendRow(p, row) { mkdirSync(dirname(p), { recursive: true }); appendFileSync(p, JSON.stringify(row) + "\n"); }
const nowISO = () => new Date().toISOString();
const istDay = (d = new Date()) => new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);   // his day is IST (captain profile tz)
const clip = (s, n) => { s = String(s ?? ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
const newId = () => `sit_${istDay().replace(/-/g, "")}_${new Date().toISOString().slice(11, 16).replace(":", "")}_${randomBytes(2).toString("hex")}`;
function log(m) {
  const line = `${nowISO()} ${m}`;
  try { console.error(line); } catch { }
  try { if (existsSync(TEXT_LOG) && statSync(TEXT_LOG).size > 2 * 1024 * 1024) { try { rmSync(TEXT_LOG + ".1", { force: true }); renameSync(TEXT_LOG, TEXT_LOG + ".1"); } catch { } } appendFileSync(TEXT_LOG, line + "\n"); } catch { }
}
const pct = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

// ── OWNER CLI FUNNEL — the one place another organ's file is reached (write side) ──
// Injectable (deps.owner) so the selftest records calls instead of spawning owners.
// ARSENAL_SITTING_DRY_OWNERS=1 (the LIVE PROOF, Block 3.5): the real claude child, the real plan, the
// real latencies — but every owner write is LOGGED, not executed, so a rehearsal never banks a rep
// into his truth layer ("never waste any of my data" cuts both ways: no fake data either).
const DRY_OWNERS = process.env.ARSENAL_SITTING_DRY_OWNERS === "1";
function ownerCli(file, args, input) {
  if (DRY_OWNERS) { log(`sitting: DRY owner call → ${file} ${args.join(" ")}${input ? ` (stdin ${String(input).length} chars)` : ""}`); return { ok: true, status: 0, out: `DRY ${file} ${args[0]}`, err: "" }; }
  const r = spawnSync(process.execPath, [join(HERE, file), ...args], { input: input == null ? undefined : String(input), encoding: "utf8", windowsHide: true, timeout: 20000, env: { ...process.env, ARSENAL_ORGAN: "1" } });
  return { ok: r.status === 0, status: r.status, out: String(r.stdout || "").trim(), err: String(r.stderr || "").trim().slice(0, 400) };
}

// THE CHILD'S CWD + ITS TRANSCRIPT. The live claude child runs with cwd = the OS temp dir
// (claudegen.session — so this repo's hooks never fire on it); the CLI keeps its transcript at
// ~/.claude/projects/<cwd with every non-alphanumeric → '-'>/<session_id>.jsonl (verified 18 Aug
// 2026 on the probe session). Handing that path to the pacer as `transcript_path` makes
// teaching_contract's context-fill line MEASURE THE SITTING'S OWN CONTEXT — his 5 Aug ask
// ("warn me BEFORE compaction") applies to a voice sitting exactly as to Claude Code — instead
// of printing an UNKNOWN that a model can turn into an invented number (the live proof's turn 2
// spoke "transcript context 109%" from nothing; that line is why this exists).
export const CHILD_CWD = tmpdir();
export function childTranscriptPath(sessionId, cwd = CHILD_CWD) {
  if (!sessionId) return null;
  return join(homedir(), ".claude", "projects", String(cwd).replace(/[^A-Za-z0-9]/g, "-"), `${sessionId}.jsonl`);
}
// ── THE PACER, in-process (turn_hook.runOrgan — the same three callees the Claude Code
// prompt hook runs, byte-for-byte the same code path). A daemon calls it every turn, and
// an ES module is evaluated ONCE per URL, so the importer busts the cache with a query
// (`?turn=n`) — the callee's own imports stay cached; only its top-level run repeats.
// ARSENAL_ORGAN is LIFTED for the call: the sitting IS his surface, and the pacer's own
// organ-guard would silence it (turn_hook's floors run under ARSENAL_ORGAN=1 by design).
async function pacerBlock(hisText, sittingId, turnNo, deps = {}, claudeSessionId = null) {
  if (deps.pacer) return deps.pacer(hisText, sittingId, turnNo);
  let th = null;
  try { th = await import("./turn_hook.mjs"); } catch (e) { return { text: "", failed: [{ file: "turn_hook.mjs", why: String(e && e.message || e).slice(0, 120) }] }; }
  const captured = [];
  const realWrite = process.stdout.write.bind(process.stdout);
  const savedOrgan = process.env.ARSENAL_ORGAN;
  delete process.env.ARSENAL_ORGAN;
  process.stdout.write = (chunk) => { captured.push(String(chunk)); return true; };
  const r = { ran: 0, failed: [] };
  const tp = childTranscriptPath(claudeSessionId);
  const stdin = JSON.stringify({ prompt: String(hisText || ""), session_id: sittingId, hook_event_name: "UserPromptSubmit", surface: "sitting", ...(tp && existsSync(tp) ? { transcript_path: tp } : {}) });
  const importer = (href) => import(`${href}?turn=${turnNo}_${Date.now()}`);
  try {
    await th.runOrgan("forge_session.mjs", "contract", { stdin, importer, stderr: () => { } }, r);
    await th.runOrgan("teaching_contract.mjs", "print", { stdin, importer, stderr: () => { } }, r);
    await th.runOrgan("hippocampus.mjs", "recall-hint", { stdin, importer, stderr: () => { } }, r);
  } finally {
    process.stdout.write = realWrite;
    if (savedOrgan !== undefined) process.env.ARSENAL_ORGAN = savedOrgan;
  }
  return { text: captured.join("").trim(), failed: r.failed };
}

// ── READS (all read-only) — what `open` looks at to route and pre-compose ─────
function readKickoff(deps = {}) {
  if (deps.kickoff) return deps.kickoff;
  const r = spawnSync(process.execPath, [join(HERE, "learnstate.mjs"), "json"], { encoding: "utf8", windowsHide: true, timeout: 20000, env: { ...process.env, ARSENAL_ORGAN: "1" } });
  try { return JSON.parse(String(r.stdout || "").trim() || "{}"); } catch { return {}; }
}
async function readNextup(deps = {}) {
  if (deps.nextup) return deps.nextup;
  try { const m = await import("./learnstate.mjs"); return m.nextup(STATE_DIR, Date.now()); } catch { return { winner: { name: "none", line: "", why: "" }, contenders: [] }; }
}
async function readCapsules(deps = {}) {
  if (deps.capsules) return deps.capsules;
  try { const m = await import("./deep.mjs"); return m.loadCapsules(join(STATE_DIR, "capsules")); } catch { return []; }
}
function readTopCard(deps = {}) {
  if (deps.topCard !== undefined) return deps.topCard;
  return null;   // the deck's picker is a MUTATING dealer on its own anchors; the sitting reads the STATE line's card via state.mjs at close, not here
}
function lastReview() { return mergeReviewRows(readRows(F.reviews())); }   // base row + the LLM row of the newest sitting, merged (Block 4)
function readIntentBrief(deps = {}) {
  if (deps.intents) return deps.intents;
  try { const r = spawnSync(process.execPath, [join(HERE, "intent.mjs"), "brief"], { encoding: "utf8", windowsHide: true, timeout: 10000 }); return String(r.stdout || "").trim().split("\n").filter(Boolean).slice(0, 6); } catch { return []; }
}
async function readCaptain(deps = {}) {
  if (deps.captain) return deps.captain;
  try { const m = await import("./captain.mjs"); const c = m.captain({ fresh: true }); return { tag: m.captainTag(c), profile: c }; } catch { return { tag: "the captain", profile: {} }; }
}

// ── ROUTE — the same table /learn drives (§6.3), read from state, never from chat ──
export function routeFor({ forge, nextup, kickoff, scout, capsules }, now = Date.now()) {
  const forgeOpen = !!(forge && forge.concept && !forge.closed_at);
  const forgeFresh = forgeOpen && (now - Date.parse(forge.started_at || "")) / 3600000 <= 18;
  const cur = kickoff && kickoff.cur ? kickoff.cur : null;
  const w = nextup && nextup.winner ? nextup.winner.name : "none";
  if (forgeFresh) return { route: "FORGE", concept: forge.concept, why: `forge session open @ step ${forge.step} — resume, kuch dobara nahi` };
  if (w === "rejirah-due") {
    const m = /'([^']+)'/.exec(nextup.winner.line || "");
    const concept = (m && m[1]) || null;
    return { route: "REJIRAH", concept, why: nextup.winner.why || "proof purana ho raha hai" };
  }
  if (scout && Array.isArray(scout.staged) && scout.staged.some((s) => s && s.kind === "scrimmage")) return { route: "SCRIMMAGE", concept: null, why: "scout ne scrimmage stage kiya hai" };
  if (cur && cur.track === "skill") return { route: "PYTHON", concept: String(cur.task || ""), why: "sprint ki current task Python track pe hai" };
  if (cur && cur.track === "concept") return { route: "FORGE", concept: String(cur.task || "").toLowerCase(), why: forgeOpen ? `purani forge session stale (>18h) — owner CLI se band, phir '${cur.task}' shuru` : "sprint ki current task ek concept hai — THE METHOD" };
  const last = (capsules || []).slice().sort((a, b) => String(b.lockedOn || "").localeCompare(String(a.lockedOn || "")))[0];
  return { route: "REVISION", concept: last ? last.id : null, why: last ? `koi khula loop nahi — aakhri locked capsule '${last.id}' pe samjhao` : "koi capsule nahi, koi task nahi" };
}

// ── PLAN — deterministic skeleton (deliver-only degrade + REJIRAH/REVISION need no model) ──
export function skeletonPlan({ route, concept, capsule, forge, kickoff }, cfg = DEFAULT_CONFIG) {
  const U = [];
  const push = (u) => U.push({ i: U.length, kind: "unit", step: null, axis: null, question: false, est_seconds: 20, src: [], ...u });
  const title = (capsule && capsule.title) || concept || (kickoff && kickoff.cur && kickoff.cur.task) || "aaj ka kaam";
  if (route === "REJIRAH" && capsule) {
    const axes = (capsule.faultLines || []).filter((a) => a && a.axis);
    push({ kind: "map", text: `Aaj ka plan — Re-Jirah, ${title}. Cold round: ${axes.length} axis, har axis pe pehle gut-word (knew, shaky ya guessed), phir tumhara jawab, main bank karta hoon — judge round ke end pe. Notes band. Shuru karein?`, question: true, est_seconds: 18, src: ["capsule"] });
    for (const a of axes) push({ kind: "question", axis: a.axis, text: `Axis ${a.axis} — ${a.title || ""}. Pehle gut-word bolo, phir jawab: ${a.strike || "(is axis pe strike-sawaal nahi likha)"}`, question: true, est_seconds: 15, src: ["capsule"] });
    push({ text: `Round poora. Ab main judge chalaata hoon aur tumhe agli sitting mein verdict milega — sitting band karne ke liye 'full time' bolo.`, est_seconds: 8 });
    return { map: U[0].text, units: U, source: "skeleton" };
  }
  if (route === "REVISION" && capsule) {
    const axes = (capsule.faultLines || []).filter((a) => a && a.weld);
    push({ kind: "map", text: `Aaj samjhao-revision — ${title}. ${axes.length} axis, har axis pe pehle tumhara ek-line jawab, phir tumhara locked weld verbatim, phir ek check-question. Chalein?`, question: true, est_seconds: 15, src: ["capsule"] });
    for (const a of axes) {
      push({ kind: "question", axis: a.axis, text: `Axis ${a.axis} — ${a.title || ""}. Gut-word, phir ek line mein: ${a.strike || a.title || ""}`, question: true, est_seconds: 12, src: ["capsule"] });
      push({ kind: "recital", axis: a.axis, text: clip(a.weld, 700), est_seconds: Math.max(10, Math.min(60, Math.round(words(a.weld) / 2.2))), src: ["capsule"] });
    }
    push({ text: `Revision poori — 'full time' bolo to band karta hoon.`, est_seconds: 6 });
    return { map: U[0].text, units: U, source: "skeleton" };
  }
  if (route === "PYTHON") {
    push({ kind: "map", text: `Python track — yeh CLOSE-PACKET loop Claude Code mein chalta hai (/learn). Voice se main sirf tumhare doubts sun sakta hoon; code wahi likhna hai. Koi doubt hai to bolo, warna 'full time'.`, est_seconds: 12 });
    return { map: U[0].text, units: U, source: "skeleton" };
  }
  // FORGE (or anything else) — THE METHOD's step skeleton; the model fills the units when it can
  const step = forge && forge.concept ? Number(forge.step || 0) : 0;
  push({ kind: "map", step, text: `Aaj ${title} — THE METHOD ke 12 kadam, step ${step} se. Har kadam ek idea, ek chhota check-question, tumhara gut-word pehle. Map yeh raha: pehle-guess → mechanism → axes a se i → traps → bridges → lock. Shuru?`, question: true, est_seconds: 20 });
  push({ kind: "question", step: Math.max(step, 1), text: `Pehle-Guess: bina padhe, ${title} kya hai — apne shabdon mein ek line? Gut-word pehle.`, question: true, est_seconds: 12 });
  push({ text: `Model abhi upalabdh nahi (window band ya child mar gaya) — main sirf plan ke units de sakta hoon. 'aage' bolo, ya 'full time'.`, est_seconds: 8 });
  return { map: U[0].text, units: U, source: "skeleton" };
}

// ── PLAN VALIDATION — the model's plan is a PROPOSAL; these are the checks it must pass ──
export function validatePlan(obj, { route, cfg = DEFAULT_CONFIG } = {}) {
  const why = [];
  if (!obj || typeof obj !== "object") return { ok: false, why: ["not an object"] };
  const map = String(obj.map || "").trim();
  if (!map || words(map) > 90) why.push("map missing or > 90 words");
  const units = Array.isArray(obj.units) ? obj.units : [];
  if (units.length < 2) why.push("fewer than 2 units");
  if (units.length > cfg.plan_max_units) why.push(`more than ${cfg.plan_max_units} units`);
  let lastStep = -1;
  const out = [];
  units.slice(0, cfg.plan_max_units).forEach((u, i) => {
    const text = String((u && u.text) || "").trim();
    if (!text) { why.push(`unit ${i} empty`); return; }
    if (words(text) > cfg.unit_max_words) why.push(`unit ${i} is ${words(text)} words (> ${cfg.unit_max_words})`);
    const step = u.step == null ? null : Number(u.step);
    if (step != null && (!Number.isInteger(step) || step < 0 || step > 11)) why.push(`unit ${i} step ${u.step} outside 0-11`);
    if (route === "FORGE" && step != null && step < lastStep) why.push(`unit ${i} step goes backwards (${lastStep}→${step})`);
    if (step != null) lastStep = step;
    const axis = u.axis == null ? null : String(u.axis).toLowerCase();
    if (axis != null && !/^[a-i]$/.test(axis)) why.push(`unit ${i} axis '${u.axis}' not a-i`);
    const question = !!u.question;
    if (question && !/[?？]/.test(text)) why.push(`unit ${i} says question:true but has no '?'`);
    const est = Number(u.est_seconds);
    // unit 0 IS the map (a start prompt, never a rep) — its kind wins over question:true
    out.push({ i, kind: i === 0 ? "map" : (question ? "question" : (u.kind === "recital" ? "recital" : "unit")), step, axis, text, question,
      est_seconds: Number.isFinite(est) && est > 0 ? Math.round(est) : Math.max(6, Math.round(words(text) / 2.2)), src: Array.isArray(u.src) ? u.src.map(String).slice(0, 4) : [] });
  });
  if (out.length && !/[?？]/.test(out[0].text) && route !== "PYTHON") why.push("the map (unit 0) must end by asking him to start (THE_GAFFER §9.2 — declare, then ask)");
  return { ok: why.length === 0, why, plan: why.length === 0 ? { map, units: out, source: "model" } : null };
}
export function parseCtrl(text) {
  const m = CTRL_RE.exec(String(text || ""));
  if (!m) return { spoken: String(text || "").trim(), ctrl: null, had_tail: false };
  let ctrl = null;
  try { ctrl = JSON.parse(m[1]); } catch { ctrl = null; }
  return { spoken: String(text || "").slice(0, m.index).trim(), ctrl, had_tail: !!ctrl };
}
export function classifyTurn(text, S) {
  const pq = S && S.pending_question;
  const hasNext = S && Array.isArray(S.plan) && S.cursor < S.plan.length;
  if (pq && pq.bankable) {                                          // a check-question is on the table
    if (SKIP_RE.test(String(text || "")) && hasNext) return "skip"; // his explicit "chhodo" — no rep, next unit
    return "respond";                                               // his answer → the model banks (or the gut-regex in deliver-only)
  }
  if (CONTINUE_RE.test(String(text || "")) && hasNext) return "deliver";   // "haan/aage" with a plan ahead → next unit, no model
  return "respond";
}

// ── THE DAEMON ────────────────────────────────────────────────────────────────
export function createSitting(deps = {}) {
  const cfg = deps.config || loadConfig();
  const owner = deps.owner || ((file, args, input) => ownerCli(file, args, input));
  const now = deps.now || (() => new Date());
  const idleMs = Number.isFinite(deps.idleMs) ? deps.idleMs : cfg.idle_close_min * 60000;
  let S = readJson(F.sitting());
  if (S && (S.closed_at || !S.id)) S = null;
  let session = null;                 // the live claudegen session (voice brain)
  let idleTimer = null;
  let cardedWall = false, saidResume = false;
  const queue = [];                   // serialised turn worker
  let working = false;
  const isOpen = () => !!(S && S.id && !S.closed_at);
  const save = () => { if (S) writeAtomic(F.sitting(), S); };
  const undelivered = () => {
    const rows = readRows(F.out());
    const acked = new Set(rows.filter((r) => r.kind === "ack").map((r) => r.id));
    return rows.filter((r) => r.kind === "unit" && (!S || r.sitting_id === S.id) && !acked.has(r.id));
  };
  const emit = (text, { cls = "deliver", est = null, src = [], question = false, planIndex = null, kind = "unit" } = {}) => {
    if (!S) return null;
    S.unit_seq = (S.unit_seq || 0) + 1;
    const row = { kind: "unit", id: `u_${S.id}_${S.unit_seq}`, sitting_id: S.id, ts: now().toISOString(), class: cls, unit_kind: kind, text: String(text).trim(),
      est_seconds: est ?? Math.max(4, Math.round(words(text) / 2.2)), src, question: !!question, plan_index: planIndex };
    appendRow(F.out(), row);
    S.stats.units_composed = (S.stats.units_composed || 0) + 1;
    // a question ARMS pending_question. The map's "shuru karein?" is a start prompt, not a rep — bankable:false;
    // a plan question unit or the model's own micro-question is bankable (his next line is an answer to bank).
    if (question) S.pending_question = { unit_id: row.id, text: row.text, axis: (planIndex != null && S.plan[planIndex] && S.plan[planIndex].axis) || S.forge_axis || null, asked_at: row.ts, bankable: kind !== "map" };
    return row;
  };
  const skipQuestion = (why) => { if (S && S.pending_question) { S.stats.skipped = (S.stats.skipped || 0) + 1; S.pending_question = null; log(`sitting: question skipped — ${why}`); } };
  const logTurn = (row) => appendRow(F.log(), { ts: now().toISOString(), sitting_id: S ? S.id : null, ...row });
  const armIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    if (!isOpen() || !(idleMs > 0)) return;
    idleTimer = setTimeout(() => { close({ reason: "idle" }).catch(() => { }); }, idleMs);
    if (idleTimer.unref) idleTimer.unref();
  };
  const declareToPacer = (unit) => {
    // THE METHOD's step changes are declared through the OWNER (forge_session.mjs), exactly as /forge does
    if (!S || S.route !== "FORGE" || !unit) return;
    const calls = [];
    if (unit.step != null && unit.step !== S.forge_step) { calls.push(["forge_session.mjs", ["step", String(unit.step)]]); S.forge_step = unit.step; }
    if (unit.axis && unit.axis !== S.forge_axis) { calls.push(["forge_session.mjs", ["axis", unit.axis, "now"]]); S.forge_axis = unit.axis; }
    if (unit.question && unit.kind !== "map") calls.push(["forge_session.mjs", ["moment", "check_q"]]);
    for (const [f, a] of calls) { const r = owner(f, a); S.stats.owner_calls = (S.stats.owner_calls || 0) + 1; if (!r.ok) log(`sitting: owner ${f} ${a.join(" ")} → ${r.status} ${r.err || r.out}`); }
  };
  const bank = (hisText, gut, source) => {
    // THE BANK — model-free, instant, judged at close by judge-round (owner CLI, gut-word law at ITS door too)
    if (!S || !S.pending_question) return { ok: false, why: "no pending question" };
    if (!S.pending_question.bankable) return { ok: false, why: "pending question is a start prompt (the map), not a rep" };
    if (!GUT_WORDS.includes(gut)) return { ok: false, why: `gut '${gut}' not in ${GUT_WORDS.join("|")}` };
    const axis = S.pending_question.axis;
    const concept = S.concept;
    if (!concept) return { ok: false, why: "no concept on this sitting" };
    let r;
    if (S.route === "REJIRAH" && axis) r = owner("gaffer_brain.mjs", ["capture", "axis_weld", `${concept}:${axis}`, "--gut", gut, "--note", `sitting ${S.id} · ${source}`], hisText);
    else r = owner("gaffer_brain.mjs", ["capture", "voice_rep", concept, "--gut", gut, "--asked", clip(S.pending_question.text, 1000), ...(axis ? ["--axis", axis] : []), "--note", `sitting ${S.id} · ${source}`], hisText);
    S.stats.owner_calls = (S.stats.owner_calls || 0) + 1;
    if (r.ok) { S.stats.banked = (S.stats.banked || 0) + 1; S.pending_question = null; }
    return { ok: r.ok, why: r.ok ? null : (r.err || r.out || `exit ${r.status}`) };
  };
  const reviewer = deps.reviewer || ((id) => { const c = spawn(process.execPath, [join(HERE, "sitting.mjs"), "review", "--sitting", id], { detached: true, stdio: "ignore", windowsHide: true, cwd: ROOT }); c.unref(); });
  const cardOnce = (line, key) => {
    if (cardedWall) return;
    cardedWall = true;
    owner("captains_call.mjs", ["file", "--line", line, "--key", key]);
  };
  const recordConsumption = deps.recordConsumption || (async (row) => { if (DRY_OWNERS) { log(`sitting: DRY consumption → ${row.job} ${row.kind}`); return { ok: true, dry: true }; } try { const b = await import("./brain.mjs"); return b.recordConsumption(row); } catch { return { ok: false }; } });
  const consumeSpoken = (unit) => {
    if (!unit || !Array.isArray(unit.src)) return;
    for (const lane of unit.src) {
      if (["capsule", "plan", "driver", "skeleton", "brain", "model"].includes(lane)) continue;   // not brain lanes
      try { const p = recordConsumption({ job: lane, kind: "sat", by: `sitting ${S ? S.id : "?"} (spoken)` }); if (p && p.catch) p.catch(() => { }); } catch { }
    }
  };
  // the head (system prompt) — assembled by context_manifest (Block 3.3), injectable for the selftest
  const assembleHead = async (ctx) => {
    if (deps.assembleHead) return deps.assembleHead(ctx);
    try { const m = await import("./context_manifest.mjs"); return m.assembleSittingSystem(ctx); } catch (e) { return { text: `You are THE SITTING BRAIN. (assembler unavailable: ${String(e && e.message || e).slice(0, 100)})\n${SITTING_CTRL_GRAMMAR}`, footer: "[sitting_system: assembler unavailable]", parts: [] }; }
  };
  const spawnBrain = async (resumeId = null) => {
    if (deps.session) return deps.session({ resume: resumeId, headFile: F.head(), cfg });
    const cg = await import("./claudegen.mjs");
    const s = cg.session({ systemPromptFile: F.head(), model: cfg.model, effort: cfg.effort.compose, resume: resumeId, timeoutMs: cfg.turn_timeout_ms, bin: cfg.claude_bin || undefined, cwd: CHILD_CWD });
    return s;
  };
  const composePlan = async (ctx) => {
    // ONE turn on the live child: the plan comes back as JSON, is VALIDATED, and the child keeps it in context
    const ask = [
      `COMPOSE THE PLAN for this sitting. Route ${ctx.route}${ctx.concept ? ` · concept '${ctx.concept}'` : ""}${ctx.forge && ctx.forge.concept ? ` · forge step ${ctx.forge.step} (steps done: ${(ctx.forge.steps_done || []).join(",")}; axes done: ${(ctx.forge.axes_done || []).join(",") || "none"})` : ""}.`,
      `Return ONLY JSON: {"map":"≤60 words spoken Hinglish — declare today's map first and END by asking him to start","units":[{"step":0-11|null,"axis":"a-i"|null,"kind":"unit|question|recital","text":"≤${cfg.unit_max_words} words spoken Hinglish, ONE idea","question":true|false,"est_seconds":n,"src":["capsule"|"night_coach"|"prepare"]}]}`,
      `Rules: 3–${cfg.plan_max_units} units · unit 0 IS the map · every question unit ends with '?' and asks for the gut-word first · steps never go backwards · analogies only from everyday physical things · one idea per unit · no markdown, no code fences.`,
    ].join("\n");
    let last = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const t0 = Date.now();
      const r = await session.send(attempt === 0 ? ask : `${ask}\nYour previous plan was refused: ${last.why.join("; ")}. Return the corrected JSON only.`);
      const lat = Date.now() - t0;
      const tokens = r.usage || null;
      if (S) { S.stats.tokens.input += (tokens && tokens.input) || 0; S.stats.tokens.output += (tokens && tokens.output) || 0; S.stats.tokens.cache_creation += (tokens && tokens.cache_creation) || 0; S.stats.tokens.cache_read += (tokens && tokens.cache_read) || 0; S.stats.by_class.compose++; S.stats.turns++; if (attempt === 0 && tokens && tokens.cache_creation != null) S.stats.head_tokens = tokens.cache_creation; }
      logTurn({ turn: S ? S.stats.turns : 0, class: "compose", surface: "brain", chars_in: ask.length, latency_ms: lat, tokens, model: cfg.model, effort: cfg.effort.compose, session_id: r.session_id, error: r.ok ? null : clip(r.error, 200), inputs_read: ctx.inputs_read || [] });
      if (!r.ok) return { ok: false, why: [clip(r.error, 200)], limit_hit: !!r.limit_hit, exited: !!r.exited };
      let obj = null;
      const txt = String(r.text || "").replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      try { obj = JSON.parse(txt); } catch { const m = /\{[\s\S]*\}/.exec(txt); if (m) { try { obj = JSON.parse(m[0]); } catch { } } }
      last = validatePlan(obj, { route: ctx.route, cfg });
      if (last.ok) return { ok: true, plan: last.plan };
      log(`sitting: plan refused (attempt ${attempt + 1}): ${last.why.join("; ")}`);
    }
    return { ok: false, why: last ? last.why : ["no plan"], limit_hit: false };
  };
  const attachBrain = async (ctx) => {
    // spawn the child, compose the plan (or take Block 5's), fall back to the skeleton — never leave the mouth silent
    const inputs = [];
    let plan = null;
    const day = istDay(now());
    const prep = readJson(F.prepare(day));
    if (prep && prep.units && prep.route === ctx.route && (!ctx.concept || String((prep.task && prep.task.title) || prep.task || "").toLowerCase().includes(String(ctx.concept).toLowerCase()))) {
      const v = validatePlan({ map: prep.map, units: prep.units }, { route: ctx.route, cfg });
      if (v.ok) { plan = { ...v.plan, source: "prepare" }; inputs.push(`brain_out/prepare/${day}.json`); }
    }
    let head = null;
    try {
      head = await assembleHead({ ...ctx, plan, ctrl_grammar: SITTING_CTRL_GRAMMAR, ceiling: cfg.head_ceiling_chars });
      mkdirSync(dirname(F.head()), { recursive: true }); writeFileSync(F.head(), head.text, "utf8");
      inputs.push(...(head.parts || []).filter((p) => p && p.present && p.file).map((p) => p.file));
    } catch (e) { log(`sitting: head assembly failed: ${String(e && e.message || e).slice(0, 200)}`); }
    S.head_chars = head ? head.text.length : 0;
    S.head_footer = head ? head.footer : null;
    S.inputs_read = inputs;
    if (!["FORGE", "REVISION", "REJIRAH", "SCRIMMAGE"].includes(ctx.route) && !plan) { S.plan = skeletonPlan(ctx, cfg).units; S.plan_source = "skeleton"; S.transport = "deliver-only"; return; }
    if (process.env.ANTHROPIC_API_KEY) { S.plan = (plan || skeletonPlan(ctx, cfg)).units; S.plan_source = plan ? "prepare" : "skeleton"; S.transport = "deliver-only"; log("sitting: ANTHROPIC_API_KEY set — the session refuses; deliver-only"); return; }
    try { session = await spawnBrain(null); } catch (e) { session = null; log(`sitting: spawn failed: ${String(e && e.message || e).slice(0, 200)}`); }
    S.claude_session_id = null;
    S.transport = session ? cfg.transport : "deliver-only";
    if (!plan && session) {
      // REJIRAH/REVISION plans are deterministic (his capsule is the material) — no compose spend; FORGE composes
      if (ctx.route === "REJIRAH" || ctx.route === "REVISION") { plan = skeletonPlan(ctx, cfg); plan.source = "capsule"; }
      else {
        const c = await composePlan({ ...ctx, inputs_read: inputs });
        if (c.ok) plan = c.plan;
        else {
          log(`sitting: compose failed → skeleton (${(c.why || []).join("; ")})`);
          if (c.limit_hit) { S.transport = "deliver-only"; cardOnce(`Sitting ${S.id}: Claude window band (limit) — sitting DELIVER-ONLY chal rahi hai (plan units + bank). Window khulte hi khud theek. Kuch karna nahi.`, `sitting:wall:${day}`); }
          if (c.exited) { S.transport = "deliver-only"; }
        }
      }
    }
    if (!plan) plan = skeletonPlan(ctx, cfg);
    S.claude_session_id = session ? session.session_id : null;
    S.plan = plan.units; S.plan_source = plan.source; S.plan_map = plan.map;
  };

  async function open({ surface = "voice", task = null, route = null } = {}) {
    if (isOpen()) {
      if (!S.surfaces.includes(surface)) S.surfaces.push(surface);
      S.last_turn_at = now().toISOString();
      // a voice mouth joining a code-only sitting gets the brain attached to the SAME state (one plan, one bank)
      if (surface === "voice" && !session && S.transport === "code") {
        const ctx = await gatherContext({ task, route });
        ctx.route = S.route; ctx.concept = S.concept;
        await attachBrain(ctx);
        if (S.plan && S.plan.length) { const u = S.plan[0]; const row = emit(u.text, { cls: "deliver", est: u.est_seconds, src: u.src, question: u.question, planIndex: 0, kind: u.kind }); S.cursor = 1; declareToPacer(u); S.stats.by_class.deliver++; logTurn({ turn: ++S.stats.turns, class: "deliver", surface, chars_in: 0, latency_ms: 0, tokens: null, unit: row && row.id }); }
      }
      save(); armIdle();
      return { ok: true, id: S.id, joined: true, surfaces: S.surfaces, plan_len: (S.plan || []).length, first_unit: null, route: S.route, task: S.task, transport: S.transport };
    }
    const ctx = await gatherContext({ task, route });
    S = {
      id: newId(), captain: ctx.captain.tag, surfaces: [surface], task: ctx.taskTitle, task_id: ctx.taskId, track: ctx.track, route: ctx.route, concept: ctx.concept, route_why: ctx.routeWhy,
      claude_session_id: null, transport: surface === "code" ? "code" : cfg.transport, opened_at: now().toISOString(), last_turn_at: now().toISOString(), closed_at: null, close_reason: null,
      plan: [], plan_source: null, plan_map: null, cursor: 0, unit_seq: 0, pending_question: null, forge_step: ctx.forge && ctx.forge.concept ? Number(ctx.forge.step || 0) : null, forge_axis: ctx.forge ? ctx.forge.current_axis || null : null,
      effort: { ...cfg.effort }, model: cfg.model, head_chars: 0, head_footer: null, inputs_read: [],
      stats: { turns: 0, by_class: { deliver: 0, respond: 0, compose: 0, judge: 0 }, tokens: { input: 0, output: 0, cache_creation: 0, cache_read: 0 }, latency_ms: { deliver: [], respond: [], compose: [], judge: [] }, units_composed: 0, units_delivered: 0, banked: 0, owner_calls: 0, head_tokens: null },
    };
    save();
    log(`sitting: OPEN ${S.id} · ${surface} · ${S.route} '${S.task}' — ${S.route_why}`);
    // the pacer session (FORGE): resume the same concept, or close a stale one through its owner and start
    if (S.route === "FORGE" && S.concept) {
      const f = ctx.forge;
      const open = !!(f && f.concept && !f.closed_at);
      const same = open && String(f.concept).toLowerCase() === String(S.concept).toLowerCase();
      if (!same) {
        if (open) { owner("forge_session.mjs", ["close"]); S.stats.owner_calls++; }
        const r = owner("forge_session.mjs", ["start", S.concept]); S.stats.owner_calls++;
        if (!r.ok) log(`sitting: forge start '${S.concept}' → ${r.status} ${r.err || r.out}`);
        S.forge_step = 0; S.forge_axis = null;
      }
    }
    let first = null;
    if (surface === "voice") {
      const ack = emit(`Sitting khul gayi — ${S.route} '${S.task || S.concept || ""}'. Ek second, plan bana raha hoon.`, { cls: "deliver", est: 6, src: ["driver"] });
      save();
      await attachBrain(ctx);
      if (S.plan && S.plan.length) {
        const u = S.plan[0];
        first = emit(u.text, { cls: "deliver", est: u.est_seconds, src: u.src, question: u.question, planIndex: 0, kind: u.kind });
        S.cursor = 1; declareToPacer(u); S.stats.by_class.deliver++;
        logTurn({ turn: ++S.stats.turns, class: "deliver", surface, chars_in: 0, latency_ms: 0, tokens: null, unit: first.id, inputs_read: S.inputs_read });
      }
      void ack;
    }
    save(); armIdle();
    return { ok: true, id: S.id, joined: false, surfaces: S.surfaces, route: S.route, task: S.task, plan_len: (S.plan || []).length, first_unit: first ? { id: first.id, text: first.text, est_seconds: first.est_seconds } : null, transport: S.transport, head_chars: S.head_chars };
  }

  async function gatherContext({ task, route } = {}) {
    const forge = readJson(join(STATE_DIR, "forge_session.json"));
    const kickoff = readKickoff(deps);
    const nextup = await readNextup(deps);
    const capsules = await readCapsules(deps);
    const scout = readJson(join(STATE_DIR, "scout.json"));
    const captain = await readCaptain(deps);
    const r = route && ROUTES.includes(String(route).toUpperCase()) ? { route: String(route).toUpperCase(), concept: null, why: "route given at open" } : routeFor({ forge, nextup, kickoff, scout, capsules }, now().getTime());
    const cur = kickoff && kickoff.cur ? kickoff.cur : null;
    let concept = r.concept || (cur && cur.track === "concept" ? String(cur.task || "").toLowerCase() : null);
    if (task && !r.concept) concept = String(task).toLowerCase();
    const capsule = concept ? capsules.find((c) => String(c.id).toLowerCase() === String(concept).toLowerCase() || String(c.title || "").toLowerCase() === String(concept).toLowerCase()) || null : null;
    // the head assembler is PURE given ctx — every state read happens HERE, in the organ that owns the sitting
    const day = istDay(now());
    const readText = (p) => { try { return readFileSync(p, "utf8"); } catch { return ""; } };
    return {
      forge, kickoff, nextup, capsules, capsule, scout, captain, route: r.route, routeWhy: r.why, concept, taskTitle: task || (capsule && capsule.title) || concept || (cur && cur.task) || null,
      taskId: cur ? cur.id : null, track: cur ? cur.track : null, topCard: readTopCard(deps), lastReview: lastReview(), intents: readIntentBrief(deps), stateDir: STATE_DIR, day,
      standing: readJson(join(STATE_DIR, "gaffer_standing.json")),
      nightCoachText: readText(join(STATE_DIR, "brain_out", "night_coach", `${day}.md`)),
      prepareText: readText(join(STATE_DIR, "brain_out", "prepare", `${day}.md`)),
    };
  }

  // ── /turn — 202 now, the unit lands async through the serialised worker ──
  function turn({ text, surface = "voice" } = {}) {
    if (!isOpen()) return { ok: false, error: "no open sitting", status: 409 };
    if (!String(text || "").trim()) return { ok: false, error: "empty text", status: 400 };
    S.last_turn_at = now().toISOString();
    const n = ++S.stats.turns;
    queue.push({ text: String(text), surface, n, at: Date.now() });
    save(); armIdle();
    setImmediate(work);
    return { ok: true, accepted: true, turn: n, status: 202 };
  }
  async function work() {
    if (working) return;
    working = true;
    try {
      while (queue.length && isOpen()) {
        const job = queue.shift();
        try { await runTurn(job); } catch (e) { log(`sitting: turn ${job.n} threw: ${String(e && e.stack || e).slice(0, 300)}`); }
      }
    } finally { working = false; }
  }
  const deliverNext = (surface, n, why) => {
    const u = S.plan[S.cursor];
    if (!u) return null;
    const row = emit(u.text, { cls: "deliver", est: u.est_seconds, src: u.src, question: u.question, planIndex: S.cursor, kind: u.kind });
    S.cursor++; declareToPacer(u); S.stats.by_class.deliver++; S.stats.latency_ms.deliver.push(0);
    logTurn({ turn: n, class: "deliver", surface, chars_in: 0, latency_ms: 0, tokens: null, unit: row.id, why });
    return row;
  };
  async function runTurn(job) {
    const cls = classifyTurn(job.text, S);
    if (cls === "deliver") { deliverNext(job.surface, job.n, "continue-word"); save(); return; }
    if (cls === "skip") { skipQuestion(`his word (turn ${job.n})`); logTurn({ turn: job.n, class: "deliver", surface: job.surface, chars_in: job.text.length, latency_ms: 0, tokens: null, why: "skip-word: question dropped, no rep" }); deliverNext(job.surface, job.n, "after-skip"); save(); return; }
    // RESPOND — his answer or his doubt
    if (S.transport === "deliver-only" || S.transport === "code" || !session) {
      // no model: bank on the gut-word he says; otherwise ask for it once, or hand him the next unit
      if (S.pending_question && S.pending_question.bankable) {
        const g = gutFromText(job.text);
        if (g) { const b = bank(job.text, g, "gut-regex (deliver-only)"); logTurn({ turn: job.n, class: "respond", surface: job.surface, chars_in: job.text.length, latency_ms: 0, tokens: null, mode: "deliver-only", banked: b.ok, why: b.why }); if (b.ok) { S.stats.by_class.respond++; if (S.cursor < S.plan.length) deliverNext(job.surface, job.n, "after-bank"); else emit("Bank ho gaya. Plan poora — 'full time' bolo.", { src: ["driver"] }); } else emit("Bank nahi hua — phir se: gut-word aur jawab, ek saath.", { src: ["driver"] }); }
        else { emit("Pehle gut-word bolo — knew, shaky ya guessed — phir jawab. (Chhodna ho to 'skip'.)", { src: ["driver"], est: 5 }); logTurn({ turn: job.n, class: "respond", surface: job.surface, chars_in: job.text.length, latency_ms: 0, tokens: null, mode: "deliver-only", why: "no gut-word" }); }
      } else if (S.cursor < S.plan.length) { deliverNext(job.surface, job.n, "deliver-only: no model for a doubt"); }
      else { emit("Abhi model available nahi — plan poora ho gaya. 'full time' bolo, ya doubt Claude Code sitting mein le jao.", { src: ["driver"] }); logTurn({ turn: job.n, class: "respond", surface: job.surface, chars_in: job.text.length, latency_ms: 0, tokens: null, mode: "deliver-only" }); }
      save(); return;
    }
    const t0 = Date.now();
    const pacer = await pacerBlock(job.text, S.id, job.n, deps, S.claude_session_id || (session && session.session_id) || null);
    const nextPreview = S.plan[S.cursor] ? clip(S.plan[S.cursor].text, 90) : "(plan poora)";
    const msg = [
      pacer.text ? pacer.text : "",
      `[SITTING ${S.id} · turn ${job.n} · surface ${job.surface} · route ${S.route}${S.concept ? ` '${S.concept}'` : ""} · plan ${S.cursor}/${S.plan.length} · pending_question: ${S.pending_question ? "YES (axis " + (S.pending_question.axis || "-") + "): " + clip(S.pending_question.text, 120) : "no"} · next unit: ${nextPreview}]`,
      `CAPTAIN: ${job.text}`,
      `[DRIVER: reply ≤ ${cfg.seat_words} spoken words, Hinglish, ONE idea; if he answered the pending question — do NOT grade it (bank, do not judge): acknowledge, take his gut-word (ask ONCE if missing), set bank in the tail; if he asked a doubt — answer it small and hand back a micro-question. The pacer lines above are for YOUR compliance — never read them out, never quote their numbers; the ONE exception is a CONTEXT WARNING, which you tell him in one plain sentence. End with the CTRL tail on its own last line: ${SITTING_CTRL_GRAMMAR}]`,
    ].filter(Boolean).join("\n");
    let r = await session.send(msg);
    let resumed = false;
    if (!r.ok && r.exited && !r.limit_hit) {
      // child died → ONE resume with the SAME head (the head is not persisted in the session — probed 18 Aug)
      log(`sitting: child died (${clip(r.error, 120)}) → resume ${S.claude_session_id || "(no id)"}`);
      if (!saidResume) { saidResume = true; emit("Ruko, wapas aa raha hoon.", { src: ["driver"], est: 3 }); }
      try { session = await spawnBrain(S.claude_session_id); resumed = true; r = await session.send(msg); } catch (e) { r = { ok: false, error: `resume spawn: ${String(e && e.message || e).slice(0, 120)}`, exited: true }; }
      if (r.ok && session) S.claude_session_id = session.session_id || S.claude_session_id;
    }
    const lat = Date.now() - t0;
    const tokens = r.usage || null;
    if (tokens) { S.stats.tokens.input += tokens.input || 0; S.stats.tokens.output += tokens.output || 0; S.stats.tokens.cache_creation += tokens.cache_creation || 0; S.stats.tokens.cache_read += tokens.cache_read || 0; if (S.stats.head_tokens == null && tokens.cache_creation > 2000) S.stats.head_tokens = tokens.cache_creation; }   // the head is written on the FIRST model turn, whatever its class
    if (!r.ok) {
      if (r.limit_hit) {
        S.transport = "deliver-only";
        cardOnce(`Sitting ${S.id}: Claude window band (limit_hit) — sitting DELIVER-ONLY chal rahi hai (plan units + gut-word bank). Window khulte hi khud theek. Kuch karna nahi.`, `sitting:wall:${istDay(now())}`);
        emit("Claude ki window abhi band hai — main plan ke units deta rahunga, tum gut-word ke saath jawab dete raho; judge baad mein.", { src: ["driver"] });
      } else if (r.exited) { S.transport = "deliver-only"; emit("Dimaag ka child do baar gira — plan-only mode. 'aage' bolo.", { src: ["driver"] }); }
      else emit("Ek second, phir se bolo — reply nahi bana.", { src: ["driver"], est: 3 });
      logTurn({ turn: job.n, class: "respond", surface: job.surface, chars_in: job.text.length, latency_ms: lat, tokens, model: cfg.model, effort: cfg.effort.compose, session_id: r.session_id || S.claude_session_id, error: clip(r.error, 200), resumed, pacer_failed: pacer.failed });
      save(); return;
    }
    const { spoken, ctrl, had_tail } = parseCtrl(r.text);
    const cls2 = ctrl && ctrl.class === "compose" ? "compose" : "respond";
    S.stats.by_class[cls2]++; S.stats.latency_ms[cls2].push(lat);
    let banked = null;
    if (ctrl && ctrl.bank && typeof ctrl.bank === "object") {
      const g = String(ctrl.bank.gut || "").toLowerCase();
      banked = bank(job.text, g, "model tail");
      if (!banked.ok) log(`sitting: bank refused — ${banked.why}`);
    }
    const spokenText = spoken || "Hmm.";
    // the model chose to move on without a bank → the pending question is DROPPED and named (never left dangling for the next line)
    if (ctrl && ctrl.next === "deliver" && S.pending_question && S.pending_question.bankable && !(banked && banked.ok)) skipQuestion(`model tail next=deliver without a bank (turn ${job.n})`);
    const asksAgain = !!(ctrl && ctrl.question_asked && /[?？]/.test(spokenText)) && !(S.pending_question && S.pending_question.bankable);
    emit(spokenText, { cls: cls2, src: ["brain"], question: asksAgain, kind: asksAgain ? "question" : "unit" });
    if (ctrl && ctrl.next === "deliver" && S.cursor < S.plan.length) deliverNext(job.surface, job.n, "model tail next=deliver");
    logTurn({ turn: job.n, class: cls2, surface: job.surface, chars_in: job.text.length, latency_ms: lat, tokens, model: cfg.model, effort: cfg.effort.compose, session_id: r.session_id || S.claude_session_id, had_tail, banked: banked ? banked.ok : null, bank_why: banked && !banked.ok ? banked.why : null, resumed, pacer_failed: pacer.failed, over_budget: lat > cfg.latency_budget_s[cls2] * 1000 });
    save();
  }

  function spoken({ id } = {}) {
    if (!id) return { ok: false, error: "id required", status: 400 };
    const rows = readRows(F.out());
    const unit = rows.find((r) => r.kind === "unit" && r.id === id);
    if (!unit) return { ok: false, error: "unknown unit id", status: 404 };
    if (rows.some((r) => r.kind === "ack" && r.id === id)) return { ok: true, already: true };
    appendRow(F.out(), { kind: "ack", id, sitting_id: unit.sitting_id, delivered_at: now().toISOString(), by: "dugout" });
    if (S && S.id === unit.sitting_id) { S.stats.units_delivered = (S.stats.units_delivered || 0) + 1; S.last_turn_at = now().toISOString(); save(); armIdle(); }
    consumeSpoken(unit);
    return { ok: true };
  }
  function next() {
    const u = undelivered();
    if (!u.length) return { ok: true, speak: null };
    const first = u[0];   // FIFO — the mouth speaks in plan order
    return { ok: true, speak: { id: first.id, text: first.text, est_seconds: first.est_seconds, question: !!first.question, class: first.class }, queued: u.length };
  }
  function status() {
    const und = isOpen() ? undelivered().length : 0;
    return { ok: true, open: isOpen(), id: S ? S.id : null, task: S ? S.task : null, route: S ? S.route : null, concept: S ? S.concept : null, surfaces: S ? S.surfaces : [], cursor: S ? S.cursor : 0, plan_len: S ? (S.plan || []).length : 0,
      undelivered: und, transport: S ? S.transport : null, claude_session_id: S ? S.claude_session_id : null, child_alive: !!(session && session.alive), opened_at: S ? S.opened_at : null, last_turn_at: S ? S.last_turn_at : null,
      pending_question: S && S.pending_question ? S.pending_question.unit_id : null, stats: S ? S.stats : null, pid: process.pid, uptime_ms: Math.round(process.uptime() * 1000), port: PORT, booted_at: BOOTED_AT, module_mtime_ms: MODULE_MTIME_MS };
  }
  async function close({ reason = "his_word" } = {}) {
    if (!isOpen()) return { ok: false, error: "no open sitting", status: 409 };
    if (idleTimer) clearTimeout(idleTimer);
    const t0 = Date.now();
    // 1. the judge — ONE opus call through the owner (only if something was banked); the sitting never grades
    let judge = null;
    if ((S.stats.banked || 0) > 0) {
      const r = owner("gaffer_brain.mjs", ["judge-round"]); S.stats.owner_calls++; S.stats.by_class.judge++; S.stats.latency_ms.judge.push(Date.now() - t0);
      // §9.4 (18 Aug 2026) — THE ONE SPOKEN LINE the judge closes a round with (its
      // last stdout line, prefixed 🗣) is kept WHOLE beside the clipped output, so the
      // next head can open with it ("pichhli baar interviewer yeh shabd sunna chahta
      // tha…"). Parsed off the owner's own machine-written prefix, never off his words.
      const rl = String(r.out || "").split(/\r?\n/).map((l) => l.trim()).find((l) => l.startsWith("🗣"));
      judge = { ok: r.ok, out: clip(r.out, 300), register_line: rl ? clip(rl.replace(/^🗣\s*/, ""), 240) : null };
    }
    // 2. the pacer — closed through the owner ONLY when the concept reached its lock (a concept spans sittings; a stale one is boot's call)
    let forgeStatus = null;
    if (S.route === "FORGE") {
      const f = readJson(join(STATE_DIR, "forge_session.json"));
      forgeStatus = f ? { concept: f.concept, step: f.step, steps_done: f.steps_done, axes_done: f.axes_done } : null;
      if (f && f.concept && !f.closed_at && Array.isArray(f.steps_done) && (f.steps_done.includes(10) || f.steps_done.includes(11))) { const r = owner("forge_session.mjs", ["close"]); S.stats.owner_calls++; forgeStatus.closed = r.ok; forgeStatus.coverage = clip(r.out, 600); }
    }
    // 3. the review row — measured fields now, the LLM fields (Block 4) null and NAMED as such
    const delivered = undelivered().length;
    const review = { kind: "sitting_review", sitting_id: S.id, closed_at: now().toISOString(), reason, route: S.route, concept: S.concept, task: S.task, surfaces: S.surfaces, transport: S.transport,
      turns: S.stats.turns, by_class: S.stats.by_class, units_composed: S.stats.units_composed, units_delivered: S.stats.units_delivered, units_undelivered_at_close: delivered, banked: S.stats.banked, cursor: S.cursor, plan_len: (S.plan || []).length, plan_source: S.plan_source,
      tokens: S.stats.tokens, head_tokens: S.stats.head_tokens, latency_p50_ms: { respond: pct(S.stats.latency_ms.respond, 0.5), compose: pct(S.stats.latency_ms.compose, 0.5) }, judge, forge: forgeStatus,
      drifts: null, his_asks: null, what_changes_next: null, plan_delta: null, _llm_fields: "null until Block 4's review job (sonnet/opus) fills them — a null is not a clean bill" };
    appendRow(F.reviews(), review);
    // 4. the session-intent line — through its owner (§7.2)
    const promised = S.plan_map ? clip(S.plan_map, 200) : `${S.route} '${S.task || S.concept || ""}'`;
    const shipped = `${S.stats.units_delivered}/${S.stats.units_composed} units spoken · ${S.stats.banked} banked · ${S.stats.turns} turns · ${reason}`;
    const ir = owner("intent.mjs", ["close", "--session", S.id, "--surface", S.surfaces.join("+"), "--promised", promised, "--shipped", shipped, "--by", "sitting"]);
    S.stats.owner_calls++;
    // 5. the child + the file
    if (session) { try { await session.close(); } catch { } session = null; }
    S.closed_at = now().toISOString(); S.close_reason = reason; S.pending_question = null;
    save();
    log(`sitting: CLOSE ${S.id} (${reason}) — ${shipped}${ir.ok ? "" : " · intent close FAILED"}`);
    // 6. THE REVIEW (§8, Block 4) — one model call in its OWN process (the daemon never blocks on a model);
    //    the LLM row lands beside the base row and the drifts reach the contract through its owner
    try { reviewer(S.id); } catch (e) { log(`sitting: review launch failed: ${String(e && e.message || e).slice(0, 120)}`); }
    const out = { ok: true, id: S.id, review, intent_ok: ir.ok };
    return out;
  }
  function plan() { return { ok: true, id: S ? S.id : null, map: S ? S.plan_map : null, source: S ? S.plan_source : null, cursor: S ? S.cursor : 0, units: S ? S.plan : [] }; }

  // HTTP — the doors
  let server = null;
  function serve(port = PORT, host = "127.0.0.1") {
    return new Promise((resolve, reject) => {
      server = http.createServer(async (req, res) => {
        const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
        try {
          const url = String(req.url || "/").split("?")[0];
          if (req.method === "GET" && url === "/status") return send(200, status());
          if (req.method === "GET" && url === "/next") return send(200, next());
          if (req.method === "GET" && url === "/plan") return send(200, plan());
          if (req.method === "POST") {
            let raw = ""; for await (const c of req) raw += c;
            let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch { return send(400, { ok: false, error: "bad json" }); }
            if (url === "/open") return send(200, await open(body));
            if (url === "/turn") { const r = turn(body); return send(r.status || 200, r); }
            if (url === "/spoken") { const r = spoken(body); return send(r.status || 200, r); }
            if (url === "/close") { const r = await close(body); return send(r.status || 200, r); }
          }
          return send(404, { ok: false, error: "no such door" });
        } catch (e) { return send(500, { ok: false, error: String(e && e.message || e).slice(0, 200) }); }
      });
      server.on("error", (e) => { if (e && e.code === "EADDRINUSE") { log(`sitting: another sitting brain holds :${port} — standing down.`); resolve({ ok: false, standing_down: true }); } else reject(e); });
      server.listen(port, host, () => { const p = server.address().port; log(`sitting: THE SITTING BRAIN live on http://${host}:${p}${isOpen() ? ` · resuming open sitting ${S.id} at cursor ${S.cursor}` : ""}`); if (isOpen()) armIdle(); resolve({ ok: true, port: p }); });
    });
  }
  function stop() { return new Promise((resolve) => { if (idleTimer) clearTimeout(idleTimer); if (session) { try { session.kill(); } catch { } } if (!server) return resolve(); server.close(() => resolve()); }); }
  return { open, turn, spoken, next, status, close, plan, serve, stop, context: (o) => gatherContext(o || {}), get state() { return S; }, get session() { return session; }, undelivered, _classify: (t) => classifyTurn(t, S) };
}
const BOOTED_AT = new Date().toISOString();
const MODULE_MTIME_MS = (() => { try { return statSync(fileURLToPath(import.meta.url)).mtimeMs; } catch { return null; } })();

// ── THE SITTING REVIEW (§8, BLOCK 4, 18 Aug 2026) — the loop he believes exists, closed ──
// After every close, ONE model call (sonnet by default; opus when the sitting was CRACKED — a
// judge verdict of cracked/missed on one of its banks) reads WHAT WAS SAID (the units), WHAT HE
// SAID (his CAPTAIN lines out of the child's own transcript — read-only, never copied into a
// tracked file), the pacer's coverage and the measured stats, and returns
//   { drifts:[{rule:<contract id>|"new", line?, why}], his_asks:[…], what_changes_next:[≤3], plan_delta }
// VALIDATED (rule ids ⊂ the contract's + "new"; short strings; ≤3 changes; a number that is not
// in the input corpus is DROPPED and NAMED — the intent-digest law), then written as a SECOND row
// `kind:"sitting_review_llm"` naming the sitting (append-only — a way back is a new row naming
// the old), and DISPATCHED: each known drift → `teaching_contract.mjs autohit <id> --why` (the
// existing auto lane, his 7 Aug ruling), each `new` → `teaching_contract.mjs add <slug> <line>`
// (the contract MUTATES, his 31 Jul requirement). `what_changes_next` reaches the NEXT sitting's
// head through the assembler's `review_of_last` part (lastReview() merges the two rows).
// HALF-MAP is DETERMINISTIC and runs before the model (the one he caught 6 Aug): a FORGE step in
// 3–6 that delivered units and never a check-question is a `half-map` drift — code measured it.
// Nothing about him is invented: an absent transcript = "his lines unavailable", said in the row.
export const REVIEW_MODEL = { default: "sonnet", cracked: "opus" };
export const HALF_MAP_STEPS = Object.freeze([3, 4, 5, 6]);   // forge_session's check_q window (its own law)
export function halfMapDrifts(units = [], route = "FORGE") {
  if (route !== "FORGE") return [];
  const byStep = new Map();
  for (const u of units) {
    if (!u || u.kind !== "unit" || u.plan_index == null) continue;
    const step = u.step; if (!HALF_MAP_STEPS.includes(step)) continue;
    const s = byStep.get(step) || { units: 0, questions: 0 };
    s.units++; if (u.question) s.questions++;
    byStep.set(step, s);
  }
  return [...byStep.entries()].filter(([, s]) => s.units > 0 && s.questions === 0).map(([step, s]) => ({ rule: "half-map", why: `step ${step}: ${s.units} unit(s) delivered, no check-question — THE METHOD required one there` }));
}
export function hisLinesFromTranscript(path) {
  // the child's transcript: user rows carry the driver's message; his words are the `CAPTAIN: …` line
  const out = [];
  let txt = "";
  try { txt = readFileSync(path, "utf8"); } catch { return { ok: false, lines: [], why: "transcript unavailable" }; }
  for (const line of txt.split("\n")) {
    if (!line.trim()) continue;
    let j = null; try { j = JSON.parse(line); } catch { continue; }
    if (!j || j.type !== "user" || !j.message) continue;
    const parts = Array.isArray(j.message.content) ? j.message.content : [{ type: "text", text: String(j.message.content || "") }];
    for (const p of parts) {
      if (!p || p.type !== "text") continue;
      const m = /^CAPTAIN: (.*)$/m.exec(String(p.text || ""));
      if (m) out.push(m[1].trim());
    }
  }
  return { ok: true, lines: out, why: null };
}
export function validateReview(obj, { ruleIds = [], corpus = "" } = {}) {
  const why = [];
  if (!obj || typeof obj !== "object") return { ok: false, why: ["not an object"], review: null };
  const nums = new Set((String(corpus).match(/\d+(?:[.,]\d+)?/g) || []));
  const clean = (s, n = 240) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
  const dropped = [];
  const keepIfNumbersKnown = (s) => { const found = (String(s).match(/\d+(?:[.,]\d+)?/g) || []); const bad = found.filter((x) => !nums.has(x)); if (bad.length) { dropped.push(`${clean(s, 60)} (number ${bad.join(",")} not in the input)`); return false; } return true; };
  const drifts = (Array.isArray(obj.drifts) ? obj.drifts : []).map((d) => (typeof d === "string" ? { rule: d } : d)).filter((d) => d && d.rule).map((d) => ({ rule: clean(d.rule, 40), line: d.line ? clean(d.line, 200) : null, why: clean(d.why || "", 240) }))
    .filter((d) => (ruleIds.includes(d.rule) || d.rule === "new") && keepIfNumbersKnown(d.why + " " + (d.line || "")));
  for (const d of (Array.isArray(obj.drifts) ? obj.drifts : [])) { const r = typeof d === "string" ? d : d && d.rule; if (r && r !== "new" && !ruleIds.includes(String(r))) why.push(`unknown rule '${clean(r, 40)}' dropped`); }
  const his_asks = (Array.isArray(obj.his_asks) ? obj.his_asks : []).map((s) => clean(s, 200)).filter((s) => s && keepIfNumbersKnown(s)).slice(0, 6);
  const what_changes_next = (Array.isArray(obj.what_changes_next) ? obj.what_changes_next : []).map((s) => clean(s, 200)).filter((s) => s && keepIfNumbersKnown(s)).slice(0, 3);
  const plan_delta = obj.plan_delta ? clean(obj.plan_delta, 300) : null;
  if (Array.isArray(obj.what_changes_next) && obj.what_changes_next.length > 3) why.push("what_changes_next > 3 — the rest dropped");
  const review = { drifts, his_asks, what_changes_next, plan_delta: plan_delta && keepIfNumbersKnown(plan_delta) ? plan_delta : null, dropped };
  return { ok: true, why, review };
}
export function buildReviewPrompt({ base, units, hisLines, rules, forge, halfMap }) {
  const U = units.filter((u) => u.kind === "unit").map((u, i) => `  ${i}. [${u.class}${u.question ? " · ?" : ""}${u.step != null ? ` · step ${u.step}` : ""}${u.axis ? ` · axis ${u.axis}` : ""}] ${clip(u.text, 300)}`).join("\n");
  const H = hisLines.ok ? (hisLines.lines.length ? hisLines.lines.map((l, i) => `  ${i}. ${clip(l, 300)}`).join("\n") : "  (he said nothing beyond continue-words)") : `  (his lines unavailable — ${hisLines.why})`;
  const R = rules.map((r) => `  ${r.id}: ${clip(r.line, 140)}`).join("\n");
  return [
    `You are the SITTING REVIEWER of a study organism. Read one closed sitting and return ONLY JSON — no prose, no fences.`,
    `THE SITTING: ${base.sitting_id} · route ${base.route} · concept ${base.concept || "-"} · reason ${base.reason} · turns ${base.turns} · units spoken ${base.units_delivered}/${base.units_composed} · banked ${base.banked} · plan ${base.cursor}/${base.plan_len} (${base.plan_source})${forge ? ` · forge step ${forge.step} axes done ${(forge.axes_done || []).join(",") || "none"}` : ""}.`,
    halfMap.length ? `MEASURED BY CODE ALREADY (do not repeat, do not contradict): ${halfMap.map((h) => h.why).join(" · ")}` : "",
    `WHAT THE BRAIN SAID (units, in order):\n${U || "  (none)"}`,
    `WHAT HE SAID (his lines, in order):\n${H}`,
    `THE TEACHING CONTRACT (rule ids you may name as drifts — anything else is "new"):\n${R}`,
    `RETURN: {"drifts":[{"rule":"<id>|new","line":"<only for new: the rule in one Hinglish line>","why":"<what happened, quoting his words if any>"}],"his_asks":["<things HE asked for that were not done, verbatim-ish>"],"what_changes_next":["<≤3 concrete changes for the NEXT sitting>"],"plan_delta":"<one line: what the plan should do differently, or null>"}`,
    `LAWS: name a drift ONLY where the units show it; never invent a number; if his lines are unavailable say so in his_asks as one item; ≤3 what_changes_next; Hinglish OK.`,
  ].filter(Boolean).join("\n\n");
}
export function mergeReviewRows(rows, sittingId = null) {
  // the base row + the LLM row (later rows override) for the newest sitting, or a named one
  const R = rows.filter((r) => r && r.sitting_id);
  const id = sittingId || (R.length ? R[R.length - 1].sitting_id : null);
  if (!id) return null;
  return R.filter((r) => r.sitting_id === id).reduce((acc, r) => ({ ...acc, ...r, kind: "sitting_review" }), {});
}
export async function reviewSitting(sittingId = null, deps = {}) {
  const rows = readRows(F.reviews());
  const base = rows.filter((r) => r.kind === "sitting_review" && (!sittingId || r.sitting_id === sittingId)).pop();
  if (!base) return { ok: false, why: "no closed sitting to review" };
  if (rows.some((r) => r.kind === "sitting_review_llm" && r.sitting_id === base.sitting_id) && !deps.force) return { ok: false, why: `${base.sitting_id} already reviewed` };
  const units = readRows(F.out()).filter((r) => r.sitting_id === base.sitting_id);
  const sJson = readJson(F.sitting());
  const claudeSid = sJson && sJson.id === base.sitting_id ? sJson.claude_session_id : null;
  const hisLines = deps.hisLines || (claudeSid ? hisLinesFromTranscript(childTranscriptPath(claudeSid)) : { ok: false, lines: [], why: "no claude session id on the sitting (code surface or deliver-only)" });
  const contract = deps.contract || readJson(join(STATE_DIR, "teaching_contract.json"));
  const rules = (contract && Array.isArray(contract.rules) ? contract.rules : []).map((r) => ({ id: r.id, line: r.line || r.text || "" }));
  const halfMap = halfMapDrifts(units, base.route);
  const forge = base.forge || null;
  const cracked = !!(base.judge && /cracked|missed/i.test(String(base.judge.out || "")));
  const model = deps.model || (cracked ? REVIEW_MODEL.cracked : REVIEW_MODEL.default);
  const prompt = buildReviewPrompt({ base, units, hisLines, rules, forge, halfMap });
  const gen = deps.gen || (async (p, m) => { const cg = await import("./claudegen.mjs"); return cg.claudeGen(p, m, 240000, ["--effort", "medium"]); });
  const t0 = Date.now();
  const r = await gen(prompt, model);
  let obj = null;
  if (r && r.ok && r.text) { const txt = String(r.text).replace(/^```(?:json)?\s*|\s*```$/g, "").trim(); try { obj = JSON.parse(txt); } catch { const m = /\{[\s\S]*\}/.exec(txt); if (m) { try { obj = JSON.parse(m[0]); } catch { } } } }
  const v = obj ? validateReview(obj, { ruleIds: rules.map((x) => x.id), corpus: prompt }) : { ok: false, why: [r && r.error ? clip(r.error, 200) : "no JSON from the model"], review: null };
  const review = v.review || { drifts: [], his_asks: [], what_changes_next: [], plan_delta: null, dropped: [] };
  // code-measured drifts ride FIRST and are never overruled by the model
  const drifts = [...halfMap, ...review.drifts.filter((d) => d.rule !== "half-map")];
  const row = { kind: "sitting_review_llm", sitting_id: base.sitting_id, ts: nowISO(), model, cracked, ok: !!(obj && v.ok), why: v.why || [], dropped: review.dropped,
    drifts, his_asks: review.his_asks, what_changes_next: review.what_changes_next, plan_delta: review.plan_delta,
    his_lines: hisLines.ok ? hisLines.lines.length : null, his_lines_why: hisLines.ok ? null : hisLines.why, latency_ms: Date.now() - t0,
    tokens: r && r.usage ? r.usage : (r ? { input: r.input_tokens, output: r.output_tokens, cache_creation: r.cache_creation_tokens, cache_read: r.cache_read_tokens } : null), error: r && !r.ok ? clip(r.error, 200) : null };
  if (!deps.dry) appendRow(F.reviews(), row);
  // DISPATCH through the owner — the contract mutates only by its own CLI
  const owner = deps.owner || ((file, args, input) => ownerCli(file, args, input));
  const dispatched = [];
  const known = new Set(rules.map((x) => x.id));
  for (const d of drifts) {
    if (d.rule === "new" && d.line) {
      const slug = String(d.line).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "sitting-drift";
      if (known.has(slug)) { const rr = owner("teaching_contract.mjs", ["autohit", slug, "--why", `sitting ${base.sitting_id}: ${d.why}`]); dispatched.push({ verb: "autohit", id: slug, ok: rr.ok }); }
      else { const rr = owner("teaching_contract.mjs", ["add", slug, d.line]); dispatched.push({ verb: "add", id: slug, ok: rr.ok }); if (rr.ok) known.add(slug); }
    } else if (known.has(d.rule)) {
      const rr = owner("teaching_contract.mjs", ["autohit", d.rule, "--why", `sitting ${base.sitting_id}: ${d.why}`]); dispatched.push({ verb: "autohit", id: d.rule, ok: rr.ok });
    } else if (d.rule === "half-map") {
      // the code-measured rule may not exist yet in his contract: it enters through the owner, once, then counts
      const rr = owner("teaching_contract.mjs", ["add", "half-map", "Har unit jahan METHOD check-question maangta hai (step 3–6), bina sawaal ke band nahi hoti — aadha map koi map nahi."]); dispatched.push({ verb: "add", id: "half-map", ok: rr.ok });
      if (rr.ok) { known.add("half-map"); const r2 = owner("teaching_contract.mjs", ["autohit", "half-map", "--why", `sitting ${base.sitting_id}: ${d.why}`]); dispatched.push({ verb: "autohit", id: "half-map", ok: r2.ok }); }
    }
  }
  return { ok: true, row, dispatched };
}

// ── STATS — latency per class + tokens, from the ledger (§6.6 / §15: printed, never re-derived) ──
export function stats({ days = 7, rows = null } = {}) {
  const all = rows || readRows(F.log());
  const since = Date.now() - days * 86400000;
  const R = all.filter((r) => r.ts && Date.parse(r.ts) >= since);
  const by = {};
  for (const c of TURN_CLASSES) by[c] = { n: 0, lat: [], tokens: { input: 0, output: 0, cache_creation: 0, cache_read: 0 } };
  const sittings = new Set();
  let heads = [];
  for (const r of R) {
    const c = TURN_CLASSES.includes(r.class) ? r.class : "respond";
    by[c].n++;
    if (Number.isFinite(r.latency_ms) && r.class !== "deliver") by[c].lat.push(r.latency_ms);
    if (r.tokens) for (const k of Object.keys(by[c].tokens)) by[c].tokens[k] += Number(r.tokens[k]) || 0;
    if (r.sitting_id) sittings.add(r.sitting_id);
    if (r.tokens && r.tokens.cache_creation > 2000 && !heads.some((h) => h.sid === r.sitting_id)) heads.push({ sid: r.sitting_id, n: r.tokens.cache_creation });   // the FIRST big write per sitting = the head
  }
  const total = Object.values(by).reduce((a, b) => a + b.tokens.input + b.tokens.output + b.tokens.cache_creation + b.tokens.cache_read, 0);
  const weighted = Object.values(by).reduce((a, b) => a + b.tokens.input + b.tokens.output * 5 + b.tokens.cache_creation * 1.25 + b.tokens.cache_read * 0.1, 0);
  const lines = [`sitting stats · last ${days} d · ${sittings.size} sitting(s) · ${R.length} turn row(s)`];
  for (const c of TURN_CLASSES) { const b = by[c]; lines.push(`  ${c.padEnd(8)} n ${String(b.n).padStart(3)} · latency p50 ${b.lat.length ? pct(b.lat, 0.5) + " ms" : "—"} · p90 ${b.lat.length ? pct(b.lat, 0.9) + " ms" : "—"} · tokens in ${b.tokens.input} out ${b.tokens.output} cc ${b.tokens.cache_creation} cr ${b.tokens.cache_read}`); }
  lines.push(`  head (first model turn's cache_creation, per sitting): ${heads.length ? heads.map((h) => h.n).join(", ") : "—"} · aware total ${total} · weighted (in 1×, out 5×, cc 1.25×, cr 0.1×) ${Math.round(weighted)}`);
  return { text: lines.join("\n"), by, sittings: sittings.size, turns: R.length, total, weighted: Math.round(weighted), heads: heads.map((h) => h.n) };
}

// ── CLI ───────────────────────────────────────────────────────────────────────
async function post(path, body, timeoutMs = 4000) {
  const r = await fetch(SITTING_URL + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}), signal: AbortSignal.timeout(timeoutMs) });
  return r.json();
}
async function get(path, timeoutMs = 2000) { const r = await fetch(SITTING_URL + path, { signal: AbortSignal.timeout(timeoutMs) }); return r.json(); }
async function daemonUp() { try { const s = await get("/status", 1200); return !!(s && s.ok); } catch { return false; } }
async function ensureDaemon() {
  if (await daemonUp()) return true;
  const c = spawn(process.execPath, [fileURLToPath(import.meta.url), "daemon"], { detached: true, stdio: "ignore", windowsHide: true, cwd: ROOT });
  c.unref();
  for (let i = 0; i < 12; i++) { await new Promise((r) => setTimeout(r, 500)); if (await daemonUp()) return true; }
  return false;
}
async function main() {
  const [mode, ...rest] = process.argv.slice(2);
  const opt = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : undefined; };
  switch ((mode || "").toLowerCase()) {
    case "daemon": {
      const d = createSitting();
      const r = await d.serve(PORT);
      if (!r.ok) process.exit(0);
      process.on("SIGINT", async () => { await d.stop(); process.exit(0); });
      return;
    }
    case "status": {
      const up = await daemonUp();
      if (!up) { const s = readJson(F.sitting()); console.log(`sitting: daemon DOWN on :${PORT} · file says ${s && s.id && !s.closed_at ? `OPEN ${s.route} '${s.task}' (${s.id}) — the plan persists; the next \`daemon\` resumes at cursor ${s.cursor}` : "no open sitting"} · start: node scripts/sitting.mjs daemon`); return; }
      const s = await get("/status");
      console.log(`sitting: ${s.open ? `OPEN ${s.route} '${s.task}' · ${s.id} · surfaces ${s.surfaces.join("+")} · plan ${s.cursor}/${s.plan_len} · undelivered ${s.undelivered} · transport ${s.transport} · child ${s.child_alive ? "alive" : "none"} · turns ${s.stats.turns} · banked ${s.stats.banked}` : "none open"} · daemon :${s.port} pid ${s.pid} up ${Math.round(s.uptime_ms / 1000)}s`);
      return;
    }
    case "open": {
      if (!(await ensureDaemon())) { console.error(`sitting: could not start the daemon on :${PORT}`); process.exit(1); }
      const r = await post("/open", { surface: opt("--surface") || "code", task: opt("--task") || null, route: opt("--route") || null }, 180000);
      console.log(r.ok ? `sitting: ${r.joined ? "JOINED" : "OPEN"} ${r.id} · ${r.route} '${r.task || ""}' · surfaces ${(r.surfaces || []).join("+")} · plan ${r.plan_len} unit(s) · transport ${r.transport}${r.first_unit ? `\n  first unit → ${clip(r.first_unit.text, 160)}` : ""}` : `sitting: open failed — ${r.error}`);
      return;
    }
    case "turn": { const r = await post("/turn", { text: opt("--text") || rest.filter((a) => !a.startsWith("--")).join(" "), surface: opt("--surface") || "code" }); console.log(JSON.stringify(r)); return; }
    case "next": { console.log(JSON.stringify(await get("/next"))); return; }
    case "spoken": { console.log(JSON.stringify(await post("/spoken", { id: rest[0] }))); return; }
    case "close": { const r = await post("/close", { reason: opt("--reason") || "his_word" }, 240000); console.log(r.ok ? `sitting: CLOSED ${r.id} — ${r.review.units_delivered}/${r.review.units_composed} units spoken · ${r.review.banked} banked · ${r.review.turns} turns${r.review.judge ? ` · judge ${r.review.judge.ok ? "ran" : "FAILED"}` : ""}` : `sitting: ${r.error}`); return; }
    case "plan": { const r = (await daemonUp()) ? await get("/plan") : { units: (readJson(F.sitting()) || {}).plan || [], map: (readJson(F.sitting()) || {}).plan_map }; console.log(`map: ${r.map || "—"}`); (r.units || []).forEach((u) => console.log(`  ${String(u.i).padStart(2)} ${u.kind.padEnd(8)} s${u.step ?? "-"} ${u.axis || "-"} ${u.question ? "?" : " "} ${u.est_seconds}s · ${clip(u.text, 120)}`)); return; }
    case "stats": { console.log(stats({ days: Number(opt("--days") || 7) }).text); return; }
    case "review": {
      const r = await reviewSitting(opt("--sitting") || null, { force: rest.includes("--force"), dry: rest.includes("--dry") });
      if (!r.ok) { console.log(`sitting: review — ${r.why}`); return; }
      console.log(`sitting: review ${r.row.sitting_id} · ${r.row.model}${r.row.cracked ? " (cracked)" : ""} · ${r.row.ok ? "ok" : "model output refused"} · drifts ${r.row.drifts.length} · his_asks ${r.row.his_asks.length} · changes ${r.row.what_changes_next.length}${r.row.dropped.length ? ` · dropped ${r.row.dropped.length} (invented numbers)` : ""} · dispatched ${r.dispatched.map((d) => `${d.verb}:${d.id}${d.ok ? "" : "!"}`).join(" ") || "—"} · ${r.row.latency_ms} ms`);
      for (const w of r.row.what_changes_next) console.log(`  → ${w}`);
      return;
    }
    case "head": {
      // print the head the brain WOULD get right now (read-only: gathers context, assembles, never opens)
      const d = createSitting();
      const ctx = await d.context({ task: opt("--task") || null, route: opt("--route") || null });
      const m = await import("./context_manifest.mjs");
      const r = await m.assembleSittingSystem({ ...ctx, plan: null, ctrl_grammar: SITTING_CTRL_GRAMMAR, ceiling: loadConfig().head_ceiling_chars, stateDir: STATE_DIR });
      const out = opt("--out");
      if (out) { writeFileSync(out, r.text, "utf8"); console.log(`sitting: head → ${out} (${r.text.length} chars)\n${r.footer}`); } else { console.log(r.text); console.error(r.footer); }
      return;
    }
    case "selftest": process.exit((await selftest()) ? 0 : 1);
    default:
      console.log("sitting.mjs — daemon | status | open [--surface voice|code] [--task \"…\"] [--route R] | turn --text \"…\" | next | spoken <id> | close [--reason r] | review [--sitting id] [--force] [--dry] | plan | stats [--days N] | head [--out p] | selftest");
  }
}

// ── SELFTEST — hermetic: temp state dir, fixture child that speaks stream-json, recorded owner calls, ephemeral port ──
async function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond, detail) => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; console.log(`  FAIL ${name}${detail ? `\n         ${detail}` : ""}`); } };
  console.log("=== sitting.mjs selftest (hermetic — temp state dir, fixture child, recorded owners, port 0) ===\n");
  const tmp = mkdtempSync(join(tmpdir(), "sitting-"));
  const stateBefore = existsSync(join(ROOT, "dressing-room", "state", "sitting.json")) ? statSync(join(ROOT, "dressing-room", "state", "sitting.json")).mtimeMs : null;
  // re-point the module's state dir for THIS process (the daemon under test runs in-process)
  const realState = STATE_DIR;
  const F0 = { ...F };
  const P = (name) => join(tmp, name);
  F.sitting = () => P("sitting.json"); F.out = () => P("sitting_out.jsonl"); F.log = () => P("sitting_log.jsonl"); F.reviews = () => P("sitting_reviews.jsonl"); F.config = () => P("sitting_config.json"); F.head = () => P("brain_out/sitting/sitting_system.md"); F.prepare = (day) => P(`brain_out/prepare/${day}.json`);
  const calls = [];
  const owner = (file, args, input) => {
    calls.push({ file, args, input: input == null ? null : String(input).slice(0, 80) });
    // the judge's recorded stdout ends on its §9.4 spoken line, like the real owner's does
    const out = file === "gaffer_brain.mjs" && args[0] === "judge-round" ? `gaffer_brain: 1 item(s) graded in ONE Opus call · types: voice_rep
  voice_rep     LANDED (gut guessed)  theek
  🗣 interviewer yeh shabd sunna chahega: "grounding"` : `${file} ${args[0]} ok`;
    return { ok: true, status: 0, out, err: "" };
  };
  // fixture session: answers with a plan JSON on the first send, then echo replies with a CTRL tail; DIE/WALL words steer failure modes
  const mkSession = (behaviour = {}) => {
    const seen = []; let spawned = 0;
    const factory = ({ resume }) => {
    let n = 0; let alive = true; const sid = resume || "fixture-session-1"; spawned++; const isResumed = spawned > 1;
    return {
      get alive() { return alive; }, get session_id() { return sid; }, transport: "stream",
      send: async (text) => {
        n++; seen.push(text);
        if (/COMPOSE THE PLAN/.test(text)) {
          if (behaviour.wallOnCompose) return { ok: false, limit_hit: true, http_status: 429, error: "You've hit your weekly limit", usage: { input: 1, output: 1, cache_creation: 0, cache_read: 100 }, session_id: sid };
          const bad = behaviour.badFirst && n === 1;
          const plan = bad ? { map: "no question here", units: [{ text: "x", question: true }] }
            : { map: "Aaj hallucinations — 3 kadam: kya hai, kyun hota hai, kaise pakdein. Har kadam ek idea, ek chhota sawaal. Shuru karein?", units: [
                { step: 1, kind: "unit", text: "Aaj hallucinations — 3 kadam: kya hai, kyun hota hai, kaise pakdein. Har kadam ek idea, ek chhota sawaal. Shuru karein?", question: true, est_seconds: 15, src: ["night_coach"] },
                { step: 1, kind: "question", text: "Pehle-Guess: bina padhe, hallucination kya hai — ek line? Gut-word pehle.", question: true, est_seconds: 10 },
                { step: 2, axis: "a", kind: "unit", text: "Hallucination matlab: model confident jawab deta hai jo sunne mein sahi lage par sach nahi — jaise dukaan-wala bina dekhe bole 'haan, stock mein hai'.", question: false, est_seconds: 14 },
                { step: 2, axis: "a", kind: "question", text: "Check: yeh dukaan-wale wali galti kis wajah se hoti hai — data ya training? Gut-word pehle.", question: true, est_seconds: 8 },
              ] };
          return { ok: true, text: JSON.stringify(plan), usage: { input: 2, output: 400, cache_creation: 9000, cache_read: 0 }, session_id: sid, duration_ms: 12 };
        }
        if (/DIE/.test(text) && !isResumed) { alive = false; return { ok: false, exited: true, error: "child exited (code 3) before answering", session_id: sid }; }
        if (/WALL/.test(text)) return { ok: false, limit_hit: true, http_status: 429, error: "You've hit your weekly limit", usage: { input: 1, output: 1, cache_creation: 0, cache_read: 9000 }, session_id: sid };
        const captain = (/CAPTAIN: (.*)/.exec(text) || [])[1] || "";
        const pendingYes = /pending_question: YES/.test(text);
        const gut = (/\b(knew|shaky|guessed)\b/i.exec(captain) || [])[1];
        const tail = pendingYes && gut ? `<<CTRL {"class":"respond","bank":{"axis":"a","gut":"${gut.toLowerCase()}"},"unit_done":true,"question_asked":false,"next":"deliver"}>>`
          : `<<CTRL {"class":"respond","bank":null,"unit_done":false,"question_asked":true,"next":"wait"}>>`;
        return { ok: true, text: `Theek — ${captain.slice(0, 30)}. Ek chhota sawaal: kyun? ${tail}`, usage: { input: 3, output: 40, cache_creation: 120, cache_read: 9000 }, session_id: sid, duration_ms: 20 };
      },
      close: async () => { alive = false; return 0; }, kill: () => { alive = false; },
    };
    };
    factory.seen = seen;
    return factory;
  };
  const capsule = { id: "hallucinations", title: "Hallucinations", lockedOn: "2026-06-15", reJirahDone: [], faultLines: [{ axis: "a", title: "Kya hai", strike: "Hallucination kya hai?", weld: "Model confident galat jawab deta hai." }, { axis: "b", title: "Kyun", strike: "Kyun hota hai?", weld: "Training data + sampling." }] };
  const baseDeps = {
    config: { ...DEFAULT_CONFIG, idle_close_min: 0 }, owner, kickoff: { cur: { id: "1-04", task: "Hallucinations", track: "concept" } }, nextup: { winner: { name: "sprint", line: "", why: "" }, contenders: [] },
    capsules: [capsule], captain: { tag: "Nikhil (#14)", profile: { name: "Nikhil" } }, intents: ["nothing open"], topCard: null,
    assembleHead: async (ctx) => ({ text: `HEAD route=${ctx.route} concept=${ctx.concept} plan=${ctx.plan ? ctx.plan.units.length : "none"}\n${ctx.ctrl_grammar}`, footer: "[sitting_system: fixture]", parts: [{ id: "kickoff", present: true, file: "learnstate json" }] }),
    pacer: async (text, id, n) => ({ text: `FORGE · step 1/12 · turn ${n}\nTEACHING CONTRACT · turn ${n}/40`, failed: [] }),
    recordConsumption: (row) => { calls.push({ file: "brain.recordConsumption", args: [row.job, row.kind], input: null }); return { ok: true }; },
    reviewer: (id) => { calls.push({ file: "sitting.review", args: [id], input: null }); },
  };
  const rc = (row) => calls.filter((c) => c.file === "brain.recordConsumption");
  const flushWork = async () => { await new Promise((r) => setTimeout(r, 60)); };
  try {
    // ── 1. OPEN (voice) → route FORGE from the sprint, plan composed by the model, first unit emitted, forge started through the owner ──
    const fx = mkSession();
    const d = createSitting({ ...baseDeps, session: fx });
    const srv = await d.serve(0);
    assert("daemon: serves on an ephemeral port in the selftest (port 0)", srv.ok && srv.port > 0);
    const base = `http://127.0.0.1:${srv.port}`;
    const P_ = (p, b) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ code: r.status, body: await r.json() }));
    const G_ = (p) => fetch(base + p).then(async (r) => ({ code: r.status, body: await r.json() }));
    const st0 = await G_("/status");
    assert("/status before open: open=false, the STALE-BUILD contract fields ride (booted_at · module_mtime_ms)", st0.code === 200 && st0.body.open === false && st0.body.booted_at && st0.body.module_mtime_ms);
    const t1 = await P_("/turn", { text: "hello", surface: "voice" });
    assert("/turn with no open sitting → 409 {ok:false}", t1.code === 409 && t1.body.ok === false);
    const o = await P_("/open", { surface: "voice" });
    const S = d.state;
    assert("open: routes FORGE from the sprint's current concept task (no forge session on disk) and names WHY", o.body.ok && o.body.route === "FORGE" && S.concept === "hallucinations" && /concept/.test(S.route_why));
    assert("open: THE PLAN is the model's (validated) — 4 units, map first, cursor moved past it, first unit returned to the mouth", o.body.plan_len === 4 && S.plan_source === "model" && S.cursor === 1 && o.body.first_unit && /Shuru karein\?/.test(o.body.first_unit.text));
    assert("open: the forge session was STARTED through its owner (`forge_session.mjs start hallucinations`), never by writing its file", calls.some((c) => c.file === "forge_session.mjs" && c.args[0] === "start" && c.args[1] === "hallucinations"));
    assert("open: the map unit declared step 1 to the pacer through the owner (`step 1`) and check_q was NOT declared for the map itself", calls.some((c) => c.file === "forge_session.mjs" && c.args.join(" ") === "step 1") && !calls.some((c) => c.file === "forge_session.mjs" && c.args[0] === "moment"));
    assert("open: the head was assembled and written (sitting_system.md) with the CTRL grammar in it; head_chars recorded", existsSync(F.head()) && readFileSync(F.head(), "utf8").includes("<<CTRL") && S.head_chars > 20);
    assert("open: sitting.json carries what state.mjs reads — id · task · route · opened_at, and NO closed_at", (() => { const f = readJson(F.sitting()); return f && f.id === S.id && f.task && f.route === "FORGE" && f.opened_at && f.closed_at === null; })());
    assert("open: the compose turn was LOGGED (class compose, tokens, head_tokens = turn-1 cache_creation 9000) — the numbers §6.6 wants", S.stats.head_tokens === 9000 && S.stats.by_class.compose === 1 && readRows(F.log()).some((r) => r.class === "compose" && r.tokens && r.tokens.cache_creation === 9000));
    // ── 2. /next → FIFO undelivered; /spoken acks; a unit's src lane gets a `sat` consumption row ──
    const n1 = await G_("/next");
    assert("/next: the OLDEST undelivered unit first (the open ack line, before the map) with id/text/est_seconds", n1.body.ok && n1.body.speak && /Sitting khul gayi/.test(n1.body.speak.text) && n1.body.speak.est_seconds > 0 && n1.body.queued === 2);
    const sp1 = await P_("/spoken", { id: n1.body.speak.id });
    const n2 = await G_("/next");
    assert("/spoken: acks the unit (append-only ack row) → /next moves to the map; ack twice = {already:true}; unknown id → 404", sp1.body.ok && n2.body.speak && /Shuru karein/.test(n2.body.speak.text) && (await P_("/spoken", { id: n1.body.speak.id })).body.already === true && (await P_("/spoken", { id: "u_nope" })).code === 404);
    await P_("/spoken", { id: n2.body.speak.id });
    assert("THE GATE: speaking the map (src night_coach) stamped ONE `sat` consumption row for that lane — spoken is reached, read is not", rc().length === 1 && rc()[0].args[0] === "night_coach" && rc()[0].args[1] === "sat");
    assert("append-only: sitting_out.jsonl has unit rows + ack rows and no rewrite (2 acks, 2 units: the open ack + the map)", readRows(F.out()).filter((r) => r.kind === "ack").length === 2 && readRows(F.out()).filter((r) => r.kind === "unit").length === 2);
    assert("the map's 'shuru karein?' is a START PROMPT: pending_question armed but NOT bankable (his 'haan' is a continue, never a rep)", !!S.pending_question && S.pending_question.bankable === false);
    // ── 3. /turn — 202 immediately; a continue-word DELIVERS the next unit with no model call; his answer to a pending question RESPONDS + banks via the owner ──
    const turnsBefore = S.stats.turns;
    const t2 = await P_("/turn", { text: "haan", surface: "voice" });
    await flushWork();
    assert("/turn: answers 202 at once ({accepted:true, turn:n}) — the mouth is never blocked", t2.code === 202 && t2.body.accepted === true && t2.body.turn === turnsBefore + 1, JSON.stringify(t2));
    assert("deliver: 'haan' with a plan ahead delivered unit 2 (Pehle-Guess question) with NO model call (respond count still 0) and declared `moment check_q` to the pacer", S.cursor === 2 && S.stats.by_class.deliver === 2 && S.stats.by_class.respond === 0 && calls.some((c) => c.file === "forge_session.mjs" && c.args.join(" ") === "moment check_q"));
    assert("deliver: a delivered question unit ARMS pending_question (his next line is an answer)", !!S.pending_question && /Pehle-Guess/.test(S.pending_question.text));
    await P_("/turn", { text: "shaky — model apne aap se galat baat bana leta hai jo sahi lagti hai", surface: "voice" });
    await flushWork();
    const bankCall = calls.find((c) => c.file === "gaffer_brain.mjs" && c.args[0] === "capture");
    assert("respond: his answer went to the model with the PACER BLOCK on top and the DRIVER note (pending_question: YES) — and the model's tail bank was honoured through the OWNER (`gaffer_brain capture voice_rep hallucinations --gut shaky --asked …`, his words on stdin)",
      !!bankCall && bankCall.args[1] === "voice_rep" && bankCall.args[2] === "hallucinations" && bankCall.args[bankCall.args.indexOf("--gut") + 1] === "shaky" && /Pehle-Guess/.test(bankCall.args[bankCall.args.indexOf("--asked") + 1]) && /shaky — model/.test(bankCall.input));
    assert("respond: the tail was STRIPPED from the spoken unit; the reply unit landed; pending_question cleared; tail next=deliver delivered unit 3 too", !S.pending_question && S.stats.banked === 1 && !readRows(F.out()).some((r) => r.kind === "unit" && /<<CTRL/.test(r.text)) && S.cursor === 3);
    assert("respond: the message the model saw carried the PACER BLOCK first (forge contract · teaching contract), then the SITTING line, then CAPTAIN:, then the DRIVER note with the CTRL grammar",
      (() => { const m = fx.seen.find((t) => /CAPTAIN: shaky/.test(t)); return m && m.indexOf("FORGE · step") === 0 && m.indexOf("TEACHING CONTRACT") < m.indexOf("[SITTING ") && m.indexOf("[SITTING ") < m.indexOf("CAPTAIN:") && m.indexOf("CAPTAIN:") < m.indexOf("[DRIVER:") && m.includes("<<CTRL"); })());
    assert("ledger: the respond turn row carries class · latency · tokens · had_tail · banked and NEVER his text", (() => { const rows = readRows(F.log()); const r = rows.find((x) => x.class === "respond"); return r && r.had_tail === true && r.banked === true && r.tokens && r.tokens.cache_read === 9000 && !JSON.stringify(r).includes("model apne aap"); })());
    // ── 4. bank REFUSED when no question is pending (a tail cannot invent a rep) ──
    const before = S.stats.banked;
    await P_("/turn", { text: "ek doubt: knew — kya yeh temperature se hota hai?", surface: "voice" });
    await flushWork();
    assert("bank law: a doubt turn with a gut-word but NO pending question banks NOTHING (a tail is a proposal; the driver holds the door) — and the model's own micro-question ARMS a bankable pending", S.stats.banked === before && !!S.pending_question && S.pending_question.bankable === true);
    // ── 5. ONE OPEN SITTING — a code surface JOINS ──
    const o2 = await P_("/open", { surface: "code" });
    assert("ONE OPEN SITTING: a second open (code) JOINS the first — same id, surfaces voice+code, nothing forked", o2.body.ok && o2.body.joined === true && o2.body.id === S.id && S.surfaces.includes("code") && S.surfaces.includes("voice"));
    // ── 6. child dies → ONE resume with the same head; mouth hears 'ruko' once ──
    await P_("/turn", { text: "DIE please", surface: "voice" });
    await flushWork();
    assert("§6.7 child dies → resumed by id ONCE (the resume send answered), 'Ruko, wapas aa raha hoon' emitted once", S.transport === "stream" && readRows(F.out()).filter((r) => r.kind === "unit" && /Ruko, wapas/.test(r.text)).length === 1 && readRows(F.log()).some((r) => r.resumed === true));
    // ── 7. plan wall → DELIVER-ONLY + ONE keyed card; his gut-word answer still banks by regex ──
    await P_("/turn", { text: "WALL now", surface: "voice" });
    await flushWork();
    assert("§6.7 limit_hit → transport DELIVER-ONLY, ONE card filed through captains_call with a key (never a second)", S.transport === "deliver-only" && calls.filter((c) => c.file === "captains_call.mjs").length === 1 && calls.find((c) => c.file === "captains_call.mjs").args.includes("--key"));
    const skippedBefore = S.stats.skipped || 0;
    await P_("/turn", { text: "aage", surface: "voice" });   // a bankable question is pending → "aage" is a SKIP (no rep) → unit 4 (a question) delivered → pending again
    await flushWork();
    assert("skip law: 'aage' while a bankable question is pending DROPS it (counted, no rep) and delivers the next unit", (S.stats.skipped || 0) === skippedBefore + 1 && S.cursor === 4 && !!S.pending_question && S.pending_question.bankable);
    const bankedBefore = S.stats.banked;
    await P_("/turn", { text: "guessed — data ki wajah se", surface: "voice" });
    await flushWork();
    assert("deliver-only: his answer with a spoken gut-word is BANKED by the regex lane (no model); plan exhausted → the close hint", S.stats.banked === bankedBefore + 1 && !S.pending_question && readRows(F.out()).some((r) => r.kind === "unit" && /Plan poora/.test(r.text)));
    // ── 8. close → judge through the owner (something was banked), review row with measured fields + NAMED null LLM fields, intent close through its owner, closed_at set ──
    const c = await P_("/close", { reason: "his_word" });
    assert("close: judge-round ran through the owner (gaffer_brain.mjs judge-round) because reps were banked; the sitting itself never graded", c.body.ok && calls.some((x) => x.file === "gaffer_brain.mjs" && x.args[0] === "judge-round"));
    assert("close: the review row is written (measured fields) and its LLM fields are null AND named as Block 4's", (() => { const r = readRows(F.reviews())[0]; return r && r.sitting_id === S.id && r.turns > 0 && r.drifts === null && /Block 4/.test(r._llm_fields) && r.head_tokens === 9000; })());
    assert("close (§9.4): the judge's ONE spoken line (🗣, the owner's last stdout line) is kept WHOLE on the review row as judge.register_line — so the next head can open with it", (() => { const r = readRows(F.reviews())[0]; return r && r.judge && r.judge.register_line === `interviewer yeh shabd sunna chahega: "grounding"`; })());
    assert("close: the session-intent line went through intent.mjs close --session <id> --promised … --shipped … --by sitting", calls.some((x) => x.file === "intent.mjs" && x.args[0] === "close" && x.args.includes("--session") && x.args.includes(S.id) && x.args.includes("--by")));
    assert("close: forge NOT closed (concept did not reach lock — a concept spans sittings) · sitting.json closed_at set · state.mjs would read 'none'", !calls.some((x) => x.file === "forge_session.mjs" && x.args[0] === "close") && readJson(F.sitting()).closed_at && (await G_("/status")).body.open === false);
    assert("close twice → 409", (await P_("/close", {})).code === 409);
    await d.stop();
    // ── 9. routes: REJIRAH (rejirah-due winner) builds a DETERMINISTIC plan from the capsule (no compose spend); REVISION when nothing is due; PYTHON for the skill track ──
    const rj = routeFor({ forge: null, nextup: { winner: { name: "rejirah-due", line: "Re-Jirah R2 'tokenization' (57d ripe)", why: "proof" } }, kickoff: { cur: { task: "Hallucinations", track: "concept" } }, scout: null, capsules: [] });
    assert("route: rejirah-due wins over the sprint (the kickoff's own order) and names the concept", rj.route === "REJIRAH" && rj.concept === "tokenization");
    const rev = routeFor({ forge: null, nextup: { winner: { name: "none" } }, kickoff: {}, scout: null, capsules: [capsule] });
    assert("route: nothing due, no task → REVISION over the last locked capsule", rev.route === "REVISION" && rev.concept === "hallucinations");
    assert("route: skill track → PYTHON (a Claude Code loop; voice takes doubts only)", routeFor({ forge: null, nextup: { winner: { name: "sprint" } }, kickoff: { cur: { task: "Python basics", track: "skill" } }, scout: null, capsules: [] }).route === "PYTHON");
    assert("route: a FRESH open forge session wins everything (one open loop first)", routeFor({ forge: { concept: "embeddings", step: 4, started_at: new Date().toISOString() }, nextup: { winner: { name: "rejirah-due", line: "'x'" } }, kickoff: {}, scout: null, capsules: [] }).route === "FORGE");
    const sk = skeletonPlan({ route: "REJIRAH", concept: "hallucinations", capsule }, DEFAULT_CONFIG);
    assert("skeleton REJIRAH: map + one strike-question per axis + close line, every question asks the gut-word first", sk.units.length === 4 && sk.units[1].question && /gut-word/.test(sk.units[1].text) && sk.units[1].axis === "a");
    // ── 10. plan validation — the model's plan is a PROPOSAL ──
    assert("validatePlan refuses: no '?' on a question unit · steps going backwards · > max words · < 2 units",
      !validatePlan({ map: "m?", units: [{ text: "a?", question: true }, { text: "no q", question: true }] }, { route: "FORGE" }).ok
      && !validatePlan({ map: "m?", units: [{ step: 3, text: "a?", question: true }, { step: 2, text: "b" }] }, { route: "FORGE" }).ok
      && !validatePlan({ map: "m?", units: [{ text: "w ".repeat(200) + "?", question: true }, { text: "b" }] }, { route: "FORGE" }).ok
      && !validatePlan({ map: "m?", units: [{ text: "only one?", question: true }] }, { route: "FORGE" }).ok);
    const d2 = createSitting({ ...baseDeps, session: mkSession({ badFirst: true }) });
    await d2.open({ surface: "voice" });
    assert("compose: a refused first plan is sent BACK with the validator's reasons and the second is taken (source model, 2 compose turns)", d2.state.plan_source === "model" && d2.state.stats.by_class.compose === 2);
    await d2.close({ reason: "his_word" }); await d2.stop();
    // ── 11. wall AT compose → skeleton plan, deliver-only, one card ──
    calls.length = 0;
    const d3 = createSitting({ ...baseDeps, session: mkSession({ wallOnCompose: true }) });
    const o3 = await d3.open({ surface: "voice" });
    assert("compose under the wall → the SKELETON plan (THE METHOD's steps) at deliver-only, one keyed card, mouth still has a first unit", o3.ok && d3.state.plan_source === "skeleton" && d3.state.transport === "deliver-only" && calls.filter((c) => c.file === "captains_call.mjs").length === 1 && o3.first_unit);
    await d3.close({ reason: "his_word" }); await d3.stop();
    // ── 12. idle auto-close ──
    const d4 = createSitting({ ...baseDeps, session: mkSession(), idleMs: 120 });
    await d4.open({ surface: "voice" });
    await new Promise((r) => setTimeout(r, 300));
    assert("§6.7 idle → auto-close with a review row (reason idle)", !!d4.state.closed_at && d4.state.close_reason === "idle" && readRows(F.reviews()).some((r) => r.reason === "idle"));
    await d4.stop();
    // ── 13. a code-only open registers the sitting with NO child and NO plan; state.mjs reads it OPEN ──
    calls.length = 0;
    const d5 = createSitting({ ...baseDeps, session: () => { throw new Error("must not spawn for a code sitting"); } });
    const o5 = await d5.open({ surface: "code" });
    assert("code surface: registers the sitting (transport code), spawns NO child, composes NO plan — the Claude Code session IS the driver (§6.5)", o5.ok && d5.state.transport === "code" && d5.state.plan.length === 0 && d5.session === null);
    const sm = await import("./state.mjs");
    const sf = sm.sittingFacts({ stateDir: tmp });
    assert("state.mjs reads the code sitting as OPEN FORGE 'Hallucinations' (the STATE line's own reader)", sf.open === true && sf.route === "FORGE" && /Hallucinations/i.test(sf.task));
    // a voice mouth joining the code sitting attaches the brain to the SAME state
    const d5b = createSitting({ ...baseDeps, session: mkSession() });
    const o5b = await d5b.open({ surface: "voice" });
    assert("join: a voice mouth joining a code-only sitting ATTACHES the brain to the same id (plan composed, first unit emitted, transport stream)", o5b.joined && o5b.id === d5.state.id && d5b.state.plan.length === 4 && d5b.state.transport === "stream" && d5b.state.surfaces.includes("voice"));
    await d5b.close({ reason: "his_word" }); await d5b.stop(); await d5.stop();
    // ── 14. stats print per class latency + tokens from the ledger ──
    const st = stats({ days: 1 });
    assert("stats: per-class counts + p50/p90 + tokens + head from sitting_log (§6.6 numbers are PRINTED, never re-derived)", /respond +n +\d+/.test(st.text) && st.heads.includes(9000) && st.weighted > 0);
    // ── 15. parseCtrl + classifyTurn + gut regex ──
    const pc = parseCtrl('Bolo bhai. <<CTRL {"class":"respond","bank":null,"unit_done":false,"question_asked":true,"next":"wait"}>>');
    assert("parseCtrl: strips the tail, parses JSON; a reply without a tail is spoken whole with ctrl null", pc.spoken === "Bolo bhai." && pc.ctrl.next === "wait" && parseCtrl("plain").ctrl === null && parseCtrl("plain").spoken === "plain");
    assert("gut regex: knew/shaky/guessed and their Hinglish tells; none → null", gutFromText("pakka pata tha") === "knew" && gutFromText("thoda shak hai") === "shaky" && gutFromText("tukka maara") === "guessed" && gutFromText("hmm") === null);
    // ── 15b. THE REVIEW LOOP (§8, Block 4) — deterministic half-map, his lines from the child's transcript, the model's JSON validated, drifts dispatched through the owner ──
    assert("close TRIGGERS the review (its own process — recorded here), once per closed sitting", calls.filter((c) => c.file === "sitting.review").length >= 1);
    const hm = halfMapDrifts([
      { kind: "unit", plan_index: 1, step: 3, question: false, text: "a" }, { kind: "unit", plan_index: 2, step: 3, question: false, text: "b" },
      { kind: "unit", plan_index: 3, step: 4, question: false, text: "c" }, { kind: "unit", plan_index: 4, step: 4, question: true, text: "d?" },
      { kind: "unit", plan_index: 5, step: 7, question: false, text: "e" }, { kind: "unit", plan_index: null, step: 5, question: false, text: "brain reply" },
    ], "FORGE");
    assert("half-map is MEASURED BY CODE: a FORGE step in 3–6 with units and no check-question drifts (step 3 yes · step 4 no · step 7 outside the window · a brain reply is not a plan unit)", hm.length === 1 && /step 3/.test(hm[0].why) && hm[0].rule === "half-map" && halfMapDrifts([{ kind: "unit", plan_index: 1, step: 3, question: false }], "REJIRAH").length === 0);
    const tpath = P("fake_transcript.jsonl");
    writeFileSync(tpath, [JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text: ["FORGE contract line", "[SITTING x]", "CAPTAIN: shaky — token ek tukda hai", "[DRIVER: …]"].join("\n") }] } }), JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "Le liya. <<CTRL {}>>" }] } }), JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text: "CAPTAIN: ek doubt — BPE kya hai?" }] } }), "not json"].join("\n"));
    const hl = hisLinesFromTranscript(tpath);
    assert("his lines come out of the child's transcript (user rows → the CAPTAIN: line only; the pacer/driver lines never), a torn row is skipped, an absent file says why", hl.ok && hl.lines.length === 2 && hl.lines[0] === "shaky — token ek tukda hai" && hl.lines[1] === "ek doubt — BPE kya hai?" && hisLinesFromTranscript(P("nope.jsonl")).ok === false);
    const vr = validateReview({ drifts: [{ rule: "one-idea", why: "3 ideas in unit 2" }, { rule: "made-up-rule", why: "x" }, { rule: "new", line: "Har naya shabd pehle kholo", why: "he asked what BPE is" }, "hinglish"], his_asks: ["BPE kya hai", "speed 40% slow karo"], what_changes_next: ["a", "b", "c", "d"], plan_delta: "shorter units, 12 not 16" }, { ruleIds: ["one-idea", "hinglish"], corpus: "unit 2 had 3 ideas · plan 12/16 units" });
    assert("validateReview: unknown rule DROPPED and named · 'new' with a line kept · a bare id kept · an invented number ('40%') DROPPED and named · what_changes_next clipped to 3 · plan_delta with known numbers kept",
      vr.review.drifts.length === 3 && vr.review.drifts.some((d) => d.rule === "new" && d.line) && vr.review.drifts.some((d) => d.rule === "hinglish") && vr.why.some((w) => /made-up-rule/.test(w)) && vr.review.his_asks.length === 1 && vr.review.dropped.some((d) => /40/.test(d)) && vr.review.what_changes_next.length === 3 && vr.review.plan_delta === "shorter units, 12 not 16");
    // a full reviewSitting on the closed fixture sitting: fixture gen returns JSON; owner calls recorded
    const rcalls = [];
    const rr = await reviewSitting(S.id, { force: true, dry: false, model: "sonnet", contract: { rules: [{ id: "one-idea", line: "EK idea" }, { id: "hinglish", line: "HINGLISH" }] }, hisLines: { ok: true, lines: ["shaky — model apne aap se galat"], why: null },
      gen: async (prompt, model) => ({ ok: true, text: JSON.stringify({ drifts: [{ rule: "one-idea", why: "unit 3 carried two ideas" }, { rule: "new", line: "Naya label pehli baar ek line mein kholo", why: "he asked what BPE meant" }], his_asks: ["BPE kya hai"], what_changes_next: ["open every new label first", "one idea per unit"], plan_delta: null }), usage: { input: 10, output: 20, cache_creation: 0, cache_read: 0 } }),
      owner: (file, args) => { rcalls.push({ file, args }); return { ok: true, status: 0, out: "ok", err: "" }; } });
    assert("reviewSitting: the LLM row lands beside the base row (append-only, names the sitting), model sonnet (not cracked), his lines counted", rr.ok && rr.row.kind === "sitting_review_llm" && rr.row.sitting_id === S.id && rr.row.model === "sonnet" && rr.row.his_lines === 1 && readRows(F.reviews()).some((r) => r.kind === "sitting_review_llm" && r.sitting_id === S.id));
    assert("reviewSitting: a KNOWN drift → `teaching_contract.mjs autohit one-idea --why …` (his 7 Aug auto lane); a NEW drift → `teaching_contract.mjs add <slug> <line>` (the contract MUTATES) — both through the OWNER, nothing written to its file", rcalls.some((c) => c.file === "teaching_contract.mjs" && c.args[0] === "autohit" && c.args[1] === "one-idea" && /sitting sit_/.test(c.args[3])) && rcalls.some((c) => c.file === "teaching_contract.mjs" && c.args[0] === "add" && /naya-label/.test(c.args[1]) && /pehli baar/.test(c.args[2])));
    const merged = mergeReviewRows(readRows(F.reviews()), S.id);
    assert("lastReview merges base + LLM rows for the sitting → the NEXT head's review_of_last carries what_changes_next", merged && merged.turns > 0 && Array.isArray(merged.what_changes_next) && merged.what_changes_next[0] === "open every new label first" && merged.drifts.length === 2);
    const rr2 = await reviewSitting(S.id, { gen: async () => { throw new Error("must not call"); } });
    assert("reviewSitting refuses to review the same sitting twice (a way back is a NEW row on --force, never a rewrite)", rr2.ok === false && /already reviewed/.test(rr2.why));
    // ── 16. HERMETIC — nothing outside tmp was touched ──
    const stateAfter = existsSync(join(realState, "sitting.json")) ? statSync(join(realState, "sitting.json")).mtimeMs : null;
    assert("HERMETIC: the live sitting.json is untouched (all writes went to the temp state dir)", stateBefore === stateAfter);
    assert("HERMETIC: no live owner was spawned (every owner call was recorded, none executed)", calls.every((c) => c.file.endsWith(".mjs") || c.file === "brain.recordConsumption" || c.file === "sitting.review"));
  } finally {
    Object.assign(F, F0);
    try { rmSync(tmp, { recursive: true, force: true }); } catch { }
  }
  console.log(`\nsitting selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(`sitting: ${e && e.stack || e}`); process.exit(1); });
