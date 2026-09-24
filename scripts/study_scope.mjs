#!/usr/bin/env node
// ============================================================================
// study_scope.mjs · ARSENAL AI FC — WHICH SESSION IS THE STUDY SESSION (23 Sep 2026)
//   THE TEACHING GATE, P1 · G0 (queue/SPEC_v2__2026-09-23_teaching-gate.md §2 G0,
//   ruled by the architect in RULING__TEACHING_GATE__2026-09-23_P0.md R7)
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. Every study organ keyed on ONE global file — forge_session.json
//   open ⇒ "he is studying" — and that file says nothing about WHICH session is his.
//   P0 measured the result over 14 days: 86 % of the audited turns were ENGINEERING
//   sessions (166 architect/runner turns, 51 other CLI turns, 35 Desktop study turns);
//   every flag on them was false by definition, and every engineering prompt was
//   handed ~2.3 KB of FORGE CONTRACT / TEACHING CONTRACT / TEACHING BAR and advanced
//   his "turn N/40" clock. A gate built on that surface would block engineering work.
//
// WHAT IT IS. A LEAF: node builtins only, writes nothing, imported by the dispatcher
//   (turn_hook.mjs), the auditor (teaching_audit.mjs), the contract (teaching_contract.mjs)
//   and, in P2, the gate and the rails. ONE predicate, used everywhere:
//     study ⇔ payload.session_id === sitting.host_session_id ∧ the sitting is open
//   (R7's words: "Scope test everywhere"). The host id is written by sitting.mjs's OWN
//   verbs (`host`, then `open` binds it) from a HOOK PAYLOAD — the model types no id.
//   A headless organ (ARSENAL_ORGAN=1) is never a study session.
//
// THE ONE LINE OUTSIDE SCOPE (ruled by the architect, forks row 256 (1), 23 Sep): once G0
//   lands, a study session that never ran the /learn boot gets ZERO teaching law — and his
//   idle Desktop session was exactly that when this landed. So `unboundMain` prints ONE
//   line, only when: not in scope ∧ a forge concept is open ∧ (the session's entrypoint is
//   claude-desktop — the measured study surface — OR its first human prompt is a learning-lane
//   opener: the /learn skill's OWN trigger list, read from its frontmatter, or a /learn|/forge
//   slash call). The widening is the architect's: the study reset line itself sends him to the
//   CLI with "learn". Engineering sessions (first prompt runner / architect / executor) never
//   see it. The wording names the boot ORDER (digest first, then the sitting) — naming the
//   sitting alone would teach the model to skip the digest. It is a pointer, never the block.
//
// LAWS: SOLE WRITER OF NOTHING · fail-closed on scope (anything unreadable = NOT study, so a
//   broken read can silence the study organs but can never gate an engineering session) ·
//   fail-silent on the line (a broken read prints nothing) · no process.exit on a hook path.
// WHO ELSE COULD ACT ON THIS OUTPUT? turn_hook.mjs (the gate on every study callee and the
//   `unbound` line, CALL shape) · teaching_audit.mjs (stamps scope on its rows through the
//   dispatcher's global) · teaching_contract.mjs (R8's windowed rank reads the row stamp and,
//   for unstamped rows, the transcript entrypoint) · P2's teaching_gate.mjs and rails G3.
// CASES: exported as scopeSelfCheck(), run by `node scripts/turn_hook.mjs selftest` (the
//   teaching_bar precedent — this leaf has no `selftest` verb of its own, so the suite's coverage
//   law is met by the entry that is already in organism:selftest). Its two CLI verbs, `scope` and
//   `unbound`, are read-only hand checks (the architect's adoption re-run uses them).
// ============================================================================
import { readFileSync, openSync, readSync, closeSync, statSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir, tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
export const STATE_DIR = join(ROOT, "dressing-room", "state");

// The dispatcher parks the verdict here for its callees (teaching_audit stamps its rows
// from it). A named global, like turn_hook's STDIN_HANDOFF, so it is greppable.
export const SCOPE_GLOBAL = "__ARSENAL_STUDY_SCOPE__";

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };

export function readSitting(dir = STATE_DIR) { return readJson(join(dir, "sitting.json")); }
export function readForge(dir = STATE_DIR) { return readJson(join(dir, "forge_session.json")); }

export function payloadOf(stdin) {
  try { const p = JSON.parse(String(stdin || "") || "{}"); return p && typeof p === "object" ? p : {}; } catch { return {}; }
}

export const sittingOpen = (s) => !!(s && typeof s === "object" && s.id && !s.closed_at);

/** THE PREDICATE (R7). Pure: payload, sitting and env are all passed in. */
export function studyScope({ payload = {}, sitting = null, env = {} } = {}) {
  const sid = payload && typeof payload.session_id === "string" ? payload.session_id : "";
  const host = sitting && typeof sitting.host_session_id === "string" ? sitting.host_session_id : "";
  const base = { study: false, session: sid || null, host: host || null, sitting_id: sitting && sitting.id ? sitting.id : null };
  if (env && env.ARSENAL_ORGAN === "1") return { ...base, why: "headless organ (ARSENAL_ORGAN=1)" };
  if (!sid) return { ...base, why: "no session_id on the hook payload" };
  if (!sittingOpen(sitting)) return { ...base, why: "no open sitting" };
  // THE TRANSITION GUARD (23 Sep 2026). The sitting file is written ONLY by the sitting daemon, and
  // a daemon keeps the build it booted with: the one running when G0 landed had no host fields and no
  // /host door, and restarting it needs an elevated console (his hand — it runs as the service user).
  // A G0 build writes the host keys on EVERY sitting it opens (null when unbound); an OPEN sitting with
  // the keys ABSENT can only come from the old build, and no session can ever be bound to it. Scoping
  // it strictly would silence every study organ in his next session — worse than before G0. So such a
  // sitting keeps the pre-G0 scope (every session) and says so; it dies the moment the daemon restarts.
  if (!Object.prototype.hasOwnProperty.call(sitting, "host_session_id")) return { ...base, study: true, legacy: true, why: "the open sitting was written by a pre-G0 daemon build (no host fields) — the old scope holds until the sitting daemon restarts" };
  if (!host) return { ...base, why: "the open sitting has no host session bound" };
  if (sid !== host) return { ...base, why: "this session is not the sitting's host" };
  return { ...base, study: true, why: "payload session is the open sitting's host" };
}

export function scopeFromHook(stdin, { dir = STATE_DIR, env = process.env } = {}) {
  return studyScope({ payload: payloadOf(stdin), sitting: readSitting(dir), env });
}

// ── WHERE A SESSION'S TRANSCRIPT LIVES, AND WHICH SURFACE IT RAN ON ─────────────
// Claude Code writes ~/.claude/projects/<the project path with every ":" "\" "/" as "-">/<id>.jsonl
// (this repo's folder is C--Users-nikhi-GitHub-arsenal-ai-fc; P0's scripts read it there).
export function projectSlug(root = ROOT) { return String(root).replace(/[:\\/]/g, "-"); }
export function transcriptPathFor(sessionId, { root = ROOT, home = homedir() } = {}) {
  if (!/^[0-9a-f-]{36}$/i.test(String(sessionId || ""))) return null;
  return join(home, ".claude", "projects", projectSlug(root), `${sessionId}.jsonl`);
}
/** The entrypoint a transcript was written under (claude-desktop · cli · sdk-…), read from
 *  its head only. null when unreadable or absent. MEASURED 23 Sep 2026: the field first appears at
 *  byte 20,365–21,877 of the four Desktop study transcripts (the SessionStart hook's own rows come
 *  first, ~6 KB of brief each), so a 16 KB head found NONE of them — 64 KB is 3× the deepest. */
export function entrypointOfTranscript(path, headBytes = 65536) {
  if (!path) return null;
  let fd = null;
  try {
    fd = openSync(path, "r");
    const buf = Buffer.alloc(headBytes);
    const n = readSync(fd, buf, 0, headBytes, 0);
    const m = /"entrypoint":"([a-z0-9-]+)"/i.exec(buf.subarray(0, n).toString("utf8"));
    return m ? m[1] : null;
  } catch { return null; } finally { if (fd !== null) { try { closeSync(fd); } catch { /* closed */ } } }
}
/** This hook process's surface: the harness env first (claims.mjs measured
 *  CLAUDE_CODE_ENTRYPOINT=claude-desktop on this machine), else the transcript's own head. */
export function entrypointOf({ env = process.env, transcriptPath = null } = {}) {
  const e = env && typeof env.CLAUDE_CODE_ENTRYPOINT === "string" ? env.CLAUDE_CODE_ENTRYPOINT.trim() : "";
  return e || entrypointOfTranscript(transcriptPath);
}

// ── THE LEARNING-LANE OPENERS — read from the skills, never typed here ─────────
// The /learn skill's frontmatter says: Use when the captain says "learn", "seekhna shuru", …
// — a start with NO concept named. That quoted list IS the trigger list; this reads it.
export const LEARN_SKILL = join(ROOT, ".claude", "skills", "learn", "SKILL.md");
export function learnTriggers(skillPath = LEARN_SKILL) {
  let src = "";
  try { src = readFileSync(skillPath, "utf8"); } catch { return []; }
  const desc = (/^description:\s*(.*)$/m.exec(src) || [])[1] || "";
  const clause = (/Use when the captain says(.*?)(?:—|$)/.exec(desc) || [])[1] || "";
  return [...clause.matchAll(/"([^"]+)"/g)].map((m) => m[1].trim().toLowerCase()).filter(Boolean);
}
// A slash call of either study skill arrives as `<command-name>/learn</command-name>` (or /forge).
const SLASH_STUDY = /<command-name>\/(learn|forge)\b/i;
/** Is this prompt a learning-lane opener? EXACT match on the trigger (after trimming case and end
 *  punctuation) — "continue the audit" is an executor's opener, and a prefix match would take it. */
export function isLearnOpener(text, triggers = learnTriggers()) {
  const raw = String(text || "");
  if (SLASH_STUDY.test(raw)) return true;
  const t = raw.replace(/<[^>]+>/g, " ").trim().toLowerCase().replace(/[\s.!?,…]+$/u, "").replace(/\s+/g, " ");
  return !!t && triggers.includes(t);
}
/** The session's FIRST human prompt, from the transcript head (the same rows P0's classifier
 *  skipped: meta rows, tool results, /clear and /model local-command rows). null when none yet. */
export function firstHumanPrompt(path, headBytes = 262144) {
  if (!path) return null;
  let fd = null, head = "";
  try { fd = openSync(path, "r"); const buf = Buffer.alloc(headBytes); const n = readSync(fd, buf, 0, headBytes, 0); head = buf.subarray(0, n).toString("utf8"); }
  catch { return null; } finally { if (fd !== null) { try { closeSync(fd); } catch { /* closed */ } } }
  for (const l of head.split("\n")) {
    let o; try { o = JSON.parse(l); } catch { continue; }
    if (!o || o.type !== "user" || o.isMeta) continue;
    const c = o.message && o.message.content;
    const t = typeof c === "string" ? c
      : Array.isArray(c) && !c.some((b) => b && b.type === "tool_result") ? c.filter((b) => b && b.type === "text").map((b) => b.text).join("\n") : "";
    if (t && !/^\s*<(local-command|command-name>\/(clear|model|effort|compact))/.test(t)) return t;
  }
  return null;
}

// ── THE ONE LINE OUTSIDE SCOPE ─────────────────────────────────────────────────
export function unboundLine({ scope = null, forge = null, entrypoint = null, opener = false } = {}) {
  if (!scope || scope.study) return null;
  if (!(forge && forge.concept && !forge.closed_at)) return null;
  if (entrypoint !== "claude-desktop" && !opener) return null;
  if (/headless organ/.test(String(scope.why || ""))) return null;
  const task = `${forge.concept}${forge.current_axis ? ` axis ${forge.current_axis}` : ""}`;
  return `STUDY SCOPE NOT BOUND (${scope.why}) — the /learn boot has not run in this session: \`node scripts/learn_digest.mjs\` FIRST, then \`node scripts/sitting.mjs open --surface code --no-spawn --task "${task}"\`, both before any teaching text. Until then no TEACHING BAR / CONTRACT / audit reaches this session.`;
}

/** The whole outside-scope decision over live state — the hook entry and the CLI both call it. */
export function unboundVerdict({ payload = {}, env = process.env, sitting = readSitting(), forge = readForge() } = {}) {
  const scope = studyScope({ payload, sitting, env });
  if (scope.study) return { scope, line: null, why: "in scope — the study blocks print instead" };
  if (!(forge && forge.concept && !forge.closed_at)) return { scope, line: null, why: "no forge concept is open" };   // the cheap test first: no transcript is read
  const tx = payload.transcript_path || transcriptPathFor(payload.session_id);
  const entrypoint = entrypointOf({ env, transcriptPath: tx });
  const opener = entrypoint === "claude-desktop" ? false : isLearnOpener(firstHumanPrompt(tx) ?? payload.prompt ?? "");
  const line = unboundLine({ scope, forge, entrypoint, opener });
  return { scope, line, entrypoint, opener, why: line ? "study surface, outside scope, concept open" : `silent — entrypoint ${entrypoint || "unknown"}, not a learning-lane opener` };
}

/** CALL-shape hook entry (turn_hook runs it only when the turn is NOT in scope). */
export async function unboundMain() {
  if (process.env.ARSENAL_ORGAN === "1") return;
  try {
    const stdin = typeof globalThis.__ARSENAL_HOOK_STDIN__ === "string" ? globalThis.__ARSENAL_HOOK_STDIN__ : "";
    const { line } = unboundVerdict({ payload: payloadOf(stdin) });
    if (line) console.log(line);
  } catch { /* a pointer line is never a reason to bite his prompt */ }
}

// ── HIS PROMPT, CLASSIFIED — TIER 0 (forks row 258 (2)(d), P2) ─────────────────────
// ONE classifier for what his message IS, so the skeleton's [PARK] line, the gate's "his non-study
// question passes" and the bank duty all read the same answer. Flags, never one label: his real
// messages mix (a33327c2 t3 is a complaint AND a gut-word answer; db82184b t12 an answer AND a
// question about the visualization ruling). The cases below are HIS OWN prompts from the five
// Desktop study transcripts P0 read (db82184b · c1d9abce · a33327c2 · e3316fbd · 9e29b88c).
//   gut        the gut-word he opened with (the trio, the retired English trio, and the typos he
//              actually types: "shaya -"), or one given as "gut word - pakka" mid-message
//   answer     a gut-word, or a reply to the gut-bearing moment the last teacher turn declared
//              (pehle_guess / jirah / sharp_check — ruling R3, narrowed by forks row 268, puts the trio
//              exactly there, so the reply is graded)
//   confusion  HIS OWN not-understanding, first person ("samajh nahi aaya", "understood nothing",
//              "did not understand the question") — never an answer about a model ("LLM does not
//              understand any language" is db82184b t3's ANSWER, one of P0's six false hits)
//   system     talk about the system, the method or the tools — the rules, the notes, the session,
//              the widget ruling, the language it teaches in — not about the concept
//   question   a study question he asked ("what is morphology?")
// kind: answer › confusion › system › question › other (a system flag riding an answer or a confusion
// does not make the message a park).
const GUT_LEAD = /^\s*(?:gut[\s-]*word\s*(?:is|=|:|-|—)?\s*)?(pakka|pakaa|pkka|shayad|shaya|shyad|shayd|pata\s*nahi|pata\s*nhi|knew|shaky|guessed)\b\s*[—–\-:,.;!]/i;
const GUT_INLINE = /\bgut[\s-]*word\s*(?:is|=|:|-|—)\s*(pakka|shayad|pata\s*nahi|knew|shaky|guessed)\b/i;
// after a sentence break: 9e29b88c t3 "gut word was in enlgish right? knew - sequence length will be 3"
const GUT_AFTER_BREAK = /(?:[?.!]\s+)(pakka|shayad|pata\s*nahi|knew|shaky|guessed)\s*[—–\-:]\s*\S/i;
// the whole message is "I don't know" — db82184b t4 "no idea bro", t5 "no idea" (P0 counted both as unbanked answers)
const NO_IDEA = /^(no\s+idea|pata\s+nahi|pata\s+nhi|idk)(\s+(bro|yaar|yar))?\s*[.!]*$/i;
// an acknowledgement is not an answer to a gut-bearing moment ("ok" after a pehle-guess banks nothing)
const ACK_ONLY = /^(ok|okay|haan|ha|han|yes|hmm+|theek|thik|chalo|done|next|aage|sure)\b[\s.!]*$/i;
const CONFUSED = /(samajh|samjh|smjh|smajh)\s*(nahi|nhi|nai|na)\s*(aa?ya|aa?ye|aa?\s*raha|aa?\s*rha|aa?\s*rahi)|\bnahi\s+samjh?a\b|\bunderstood\s+nothing\b|\bdid\s*n[o']?t\s+(get|understand)\b|\b(i|i\s+am|i'm)\s+(not\s+understanding|confused|lost)\b|\bi\s+do\s*n[o']?t\s+(get|understand)\b|\bclear\s+nahi\s+(hua|hai)\b|\bkuch\s+(samajh|smjh)\s+nahi\b/i;
const SYSTEM_TALK = /(?:^|\s)\/(learn|forge)\b|\b(ruling|rules?|notes?|sessions?|hooks?|widgets?|visuali[sz]ations?|pacer|organism|system|contract|skill|hinglish|hindi|gut[\s-]*words?|restart|re-start|new\s+session|keep\s+yourself\s+updated|mistakes?)\b/i;
// forks row 267: the classifier learns /full-time (its command tag reads "full-time") and "post match" — a CLOSING
// skips G3 and B.tools, because /full-time's own close organs are outside the study set
const CLOSING = /\b(done\s+for\s+today|full[\s-]*time|post[\s-]*match|aaj\s+ke\s+liye\s+bas|band\s+karo|let'?s\s+stop|stop\s+here)\b/i;
// forks row 268 (branch A): the sharp check carries the trio too — his 5 Sep study shape ("the ONE sharp check —
// gut pehle", forge REFERENCE step 3) and the bank door's GUT-WORD LAW, both later than the 30 Aug act
export const GUT_BEARING_MOMENTS = Object.freeze(["pehle_guess", "jirah", "sharp_check"]);
export function classifyPrompt(text, { prevMoments = [] } = {}) {
  const raw = String(text || "");
  const t = raw.replace(/<\/?(command-message|command-name|command-args|pasted_content)[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const m = GUT_LEAD.exec(t) || GUT_INLINE.exec(t) || GUT_AFTER_BREAK.exec(t);
  const gut = m ? m[1].toLowerCase().replace(/\s+/g, " ").replace(/^pata nhi$/, "pata nahi").replace(/^(shaya|shyad|shayd)$/, "shayad").replace(/^(pakaa|pkka)$/, "pakka")
    : NO_IDEA.test(t) ? "pata nahi" : null;
  // forge:R140 / HOW_HE_LEARNS R107 — his "nahi" to "samajh aaya — haan ya nahi?" is the not-understood answer, literally
  const nahiToCheck = (Array.isArray(prevMoments) ? prevMoments : []).includes("check_q") && /^(nahi|nhi|nai|na|no|nope)\b/i.test(t);
  const confusion = CONFUSED.test(t) || nahiToCheck;
  const closing = CLOSING.test(t);
  const system = closing || SYSTEM_TALK.test(t.replace(GUT_INLINE, " "));
  // a reply to a gut-bearing moment (the sharp check among them since row 268) is his answer
  const replyToGradedMoment = (Array.isArray(prevMoments) ? prevMoments : []).some((k) => GUT_BEARING_MOMENTS.includes(k));
  const answer = !!gut || (replyToGradedMoment && !!t && !ACK_ONLY.test(t) && !confusion && !system);
  const question = /\?/.test(t) && !answer;
  // confusion outranks system talk: a33327c2 t6 is "understood nothing … always tell me the gut words" — the
  // concept lesson restarts from zero (HOW_HE_LEARNS #9), it is not a park.
  const kind = answer ? "answer" : confusion ? "confusion" : system ? "system" : question ? "question" : t ? "other" : "empty";
  return { kind, gut, answer, confusion, system, closing, question };
}

// ── THE BANK'S MOMENTS — ONE predicate for the skeleton's [BANK] and the gate's B.bank (forks rows 264 (1) / 266) ──
// Forge row 53b STANDS (his 5 Sep approval, consistent with the 30 Aug ratified act): the bank is due at the
// axis's banked moments plus jirah, NEVER per idea. Each banked moment the gate reads has a NAME the last teacher
// turn declared — never an absence (row 266: an undeclared question is a quiz-dump under R2 (c), not a check):
//   JIRAH       — `moment jirah`, and his message is an answer;
//   SHARP CHECK — `moment sharp_check` (row 266, the fifth legal kind), and his message is an answer. Row 268
//                 (branch A) gives it the trio, like jirah, so every reply to it is due: gaffer_brain's own contract
//                 wants his gut-word BEFORE the answer ("GUT-WORD LAW: no gut-word, no rep"), and the trio line is
//                 where he commits it.
// The Bolo and the English interview line are held by their owner: forge_session's `axis <x> done` refuses
// without ≥ 1 Hinglish bank and ≥ 1 --register interview since the axis opened.
// A reply to a per-idea moment (pehle_guess · check_q · widget_gate) is re-welded, never banked (forge:R40 / R90):
// db82184b t3 t4 t5 t11 are that class.
export const BANKED_MOMENTS = Object.freeze(["jirah", "sharp_check"]);
export function bankDueAt({ cls = null, prevMoments = [] } = {}) {
  const prev = Array.isArray(prevMoments) ? prevMoments : [];
  const c = cls && typeof cls === "object" ? cls : {};
  if (prev.includes("jirah") && c.answer) return "answers the jirah your last turn declared";
  if (prev.includes("sharp_check") && c.answer) return "answers the sharp check your last turn declared";
  return null;
}

// ── THE STUDY SET — ONE home for G3's rails (rails.mjs, PreToolUse) and the gate's B.tools (teaching_gate, Stop) ──
// Moved here from teaching_gate (CURRENT.md's G3 line, forks rows 264 / 267): rails must not import the gate or the
// pacer (heavy, and a forge_session import before its turn_hook SHIM makes the shim a silent no-op), and two copies
// of one allowed set is the drift this whole lane exists to end. The owner CLIs a study turn may run (widened only by
// rows the rule table maps here: the act lane learn:R29, the doubt lane learn:R158, the close's own capture paste
// forge:R152/R153, the widget registry forge:R103, and the course track's chapter pointer learn:R35 / R136).
// Forks row 299 (24 Sep 2026): a BARE `forge_session.mjs` (no verb) is in — its default branch only prints the usage
// line, writes nothing — but only when nothing follows it except a 2>&1 and the end or a separator (no verb, no flag).
// Forks row 305 (24 Sep 2026): the drift law's verbs travel together — `teaching_contract.mjs list` (prints, no save())
// and `unhit-auto <id>` (writes only the contract's own owner file, as `flag` does) JOIN `flag`; add / drop /
// reset-turns / selftest, a bare teaching_contract, learnstate, state, tokenizer_play and captains_call stay OUT.
export const ALLOWED_CMD = /(learn_digest\.mjs|sitting\.mjs["']?\s+(open|status|host|touch|close)|forge_session\.mjs["']?\s+(pointer|moment|crack|axis|status|step|contract|resume|boot|start|close|lockchain)|forge_session\.mjs["']?(?=[ \t]*(?:2>&1[ \t]*)?(?:$|[;&|\r\n]))|gaffer_brain\.mjs["']?\s+(capture\s+(voice_rep|axis_weld)|judge[_-]round)|teaching_contract\.mjs["']?\s+(flag|list\b|unhit-auto\b)|judge[_-]round|deep\.mjs|rejirah\.mjs|acts\.mjs["']?\s+do\b|hippocampus\.mjs["']?\s+mark\s+doubt|capture\.mjs["']?\s+paste|heartbeat\.mjs|widget\.mjs["']?\s+(list|register)|samjhao\.mjs["']?\s+(open|plan|sweep|taught)|doubtminer\.mjs|mirror\.mjs|course\.mjs["']?\s+(at|done)\b)/i;
// an allowed organ named in a command that ALSO commits, installs, redirects into code/state or deletes is not a study call
export const UNSAFE_SHELL = /\bgit\s+(commit|push|add)\b|\bnpm\s|>\s*[\w./\\-]+\.(m?js|json|md)\b|Set-Content|Out-File|\brm\s/i;
export const CANON_READ_PATH = /(learning-layer[\\/]|\.claude[\\/]skills[\\/]|docs[\\/]archive[\\/]|dressing-room[\\/]state[\\/]capsules[\\/]|(^|[\\/])capsules[\\/]|dressing-room[\\/]state[\\/]forge_sessions?\.jsonl?$)/i;
export const SHELL_CANON_READ = /^\s*(grep|rg|sed\s+-n|head|tail|cat|Select-String|Get-Content)\b/i;
export const NEVER_READ = /(scripts[\\/][^\\/]+\.m?js$|[\\/]memory[\\/])/i;
// G3 (24 Sep 2026, forks row 283 (2)): the set was tested on the WHOLE string, so an allowed organ CHAINED to system
// work passed (`forge_session.mjs pointer x && node scripts/xray.mjs report`). Now EVERY segment must be in the set:
// the string splits on the shell's own separators OUTSIDE quotes (; && || | & newline — a `2>&1` is a redirect, not a
// separator), a command substitution ($( … ), backticks, <( … )) outside single quotes is never a study call, and a
// segment is an owner CLI of the set run by `node` in command position, a read of the canon, a bare `cd`, or — after a
// pipe — a text filter that names no path. Stricter only, by construction: the old whole-string test must pass first.
const CMD_SUBST = /\$\(|`|<\(/;
const NODE_HEAD = /^\s*(?:&\s*)?(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*(?:"[^"]*[\\/])?node(?:\.exe)?"?\s+/i;
const CD_ONLY = /^\s*(?:cd|Set-Location|pushd)(?:\s+(?:"[^"]*"|'[^']*'|[^\s"'&|;]+))?\s*$/i;
const PIPE_FILTER = /^\s*(?:head|tail|grep|rg|sort|uniq|wc|cut|tr|nl|findstr|Select-Object|Select-String|Out-String|Measure-Object)\b[^/\\]*$/i;
// G3 v2 (24 Sep 2026, forks row 297): NEUTRAL SEGMENTS — never a reason to refuse, never a reason to allow. (a) a
// read-only filter on an in-set organ's pipe that names no file and writes nothing; (b) a quoted-string or
// QUOTED-delimiter heredoc assignment whose every later use sits in an in-set organ's argument list. Any segment
// carrying an unquoted output redirect other than a descriptor dup (2>&1) is outside, neutral or not.
//   VAR=$(cat <<'EOF' … EOF) · VAR='…' · VAR="…" (no $( ${ or backtick) · PowerShell $VAR = @' … '@ · $VAR = '…'
const ASSIGN_FORMS = [
  { re: /([A-Za-z_][A-Za-z0-9_]*)=\$\([ \t]*cat[ \t]*<<[ \t]*(['"])([A-Za-z_][A-Za-z0-9_]*)\2[ \t]*\r?\n/y, body: "heredoc" },
  { re: /\$([A-Za-z_][A-Za-z0-9_]*)[ \t]*=[ \t]*@'[ \t]*\r?\n/y, body: "here-string" },
  { re: /([A-Za-z_][A-Za-z0-9_]*)='[^']*'/y },
  { re: /([A-Za-z_][A-Za-z0-9_]*)="(?:[^"\\`$]|\\[^`$]|\$(?![({]))*"/y },
  { re: /\$([A-Za-z_][A-Za-z0-9_]*)[ \t]*=[ \t]*'(?:[^']|'')*'/y },
];
const AFTER_ASSIGN = /[ \t]*(?:$|;|&&|\|\||\r?\n)/y;
/** A neutral-shaped assignment opening at c[i]: { name, end } — or null (then the ordinary scan judges it). */
function assignAt(c, i) {
  for (const f of ASSIGN_FORMS) {
    f.re.lastIndex = i;
    const m = f.re.exec(c);
    if (!m) continue;
    let end = f.re.lastIndex;
    if (f.body) {
      const delim = f.body === "heredoc" ? m[3] : null;
      let p = end, found = false;
      for (;;) {
        const nl = c.indexOf("\n", p), line = c.slice(p, nl < 0 ? c.length : nl).replace(/\r$/, "");
        if (delim ? line === delim : line.startsWith("'@")) { end = delim ? (nl < 0 ? c.length : nl) : p + 2; found = true; break; }
        if (nl < 0) break;
        p = nl + 1;
      }
      if (!found) return null;
      if (delim) { const close = /\s*\)/y; close.lastIndex = end; if (!close.exec(c)) return null; end = close.lastIndex; }
    }
    AFTER_ASSIGN.lastIndex = end;
    return AFTER_ASSIGN.test(c) ? { name: m[1], end } : null;
  }
  return null;
}
/** The command split on its unquoted separators: [{ text, piped, assign? }], or null when it carries a command
 *  substitution outside a neutral-shaped assignment (row 297 (1)(b)). */
export function shellSegments(cmd) {
  const c = String(cmd || "");
  const segs = []; let cur = "", q = null, piped = false;
  const push = (next) => { segs.push({ text: cur, piped }); cur = ""; piped = next; };
  for (let i = 0; i < c.length; i++) {
    const ch = c[i];
    if (q === "'") { cur += ch; if (ch === "'") q = null; continue; }
    if (q === '"') {
      if (ch === "\\" && i + 1 < c.length) { cur += ch + c[++i]; continue; }
      if (ch === "`" || (ch === "$" && c[i + 1] === "(")) return null;
      cur += ch; if (ch === '"') q = null; continue;
    }
    if (!cur.trim()) { const a = assignAt(c, i); if (a) { segs.push({ text: c.slice(i, a.end), piped, assign: a.name }); cur = ""; i = a.end - 1; continue; } }
    if (ch === "'" || ch === '"') { q = ch; cur += ch; continue; }
    if (CMD_SUBST.test(c.slice(i, i + 2))) return null;
    if (ch === "\n" || ch === ";") { push(false); continue; }
    if (ch === "&" && c[i + 1] === "&") { i++; push(false); continue; }
    if (ch === "|" && c[i + 1] === "|") { i++; push(false); continue; }
    if (ch === "|") { push(true); continue; }
    if (ch === "&" && (/[<>]$/.test(cur) || c[i + 1] === ">")) { cur += ch; continue; }   // 2>&1 · &> — a redirect
    if (ch === "&" && !cur.trim()) { cur += ch; continue; }                                // PowerShell's call operator
    if (ch === "&") { push(false); continue; }
    cur += ch;
  }
  push(false);
  return segs.filter((s) => s.text.trim() && s.text.trim() !== "&");
}
function segmentInStudySet({ text, piped }) {
  if (UNSAFE_SHELL.test(text)) return false;
  if (NODE_HEAD.test(text) && ALLOWED_CMD.test(text)) return true;
  if (SHELL_CANON_READ.test(text) && CANON_READ_PATH.test(text) && !NEVER_READ.test(text)) return true;
  if (!piped && CD_ONLY.test(text)) return true;
  return piped && PIPE_FILTER.test(text);
}
/** An unquoted output redirect (>, >>, &>, 2>file) — a descriptor dup (2>&1) or a discard (2>/dev/null, 2>$null, >NUL) is not one. */
function outRedirect(text) {
  let q = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === q) q = null; else if (q === '"' && ch === "\\") i++; continue; }
    if (ch === "'" || ch === '"') { q = ch; continue; }
    if (ch === ">" && !/^(?:&\d\b|>?\s*(?:\/dev\/null|\$null|NUL)(?![\w./\\-]))/i.test(text.slice(i + 1))) return true;
  }
  return false;
}
// the STRICT organ for the neutral rules: `node <script>` with the script FIRST (no -e / -p / flag, no env prefix), its
// basename opening an ALLOWED_CMD match — returns where the argument list starts, or -1
const ORGAN_HEAD = /^\s*(?:&\s*)?(?:"[^"]*[\\/])?node(?:\.exe)?"?\s+(?:"([^"]*)"|'([^']*)'|([^\s"'-][^\s"']*))(?=\s|$)/i;
const ALLOWED_AT_START = new RegExp(`^(?:${ALLOWED_CMD.source})`, "i");
function organArgsAt(text) {
  if (UNSAFE_SHELL.test(text) || outRedirect(text)) return -1;
  const m = ORGAN_HEAD.exec(text);
  if (!m) return -1;
  const base = (m[1] ?? m[2] ?? m[3]).replace(/^.*[\\/]/, "");
  if (!/\.mjs$/i.test(base) || /\$/.test(m[1] ?? m[2] ?? m[3])) return -1;
  return ALLOWED_AT_START.test(base + text.slice(m[0].length)) ? m[0].length : -1;
}
const inSetOrgan = (text) => organArgsAt(text) >= 0;
/** A filter's words, quote-aware ([{ w }]) — null on anything a read-only stdin filter never carries unquoted
 *  ($ * ? [ ] { } ~ ! < > ; \ ` ( ) & | #) or a double-quoted expansion. */
function filterWords(text) {
  const out = []; let cur = "", has = false, q = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q === "'") { if (ch === "'") q = null; else cur += ch; continue; }
    if (q === '"') { if (ch === '"') q = null; else if (ch === "$" || ch === "`") return null; else if (ch === "\\" && i + 1 < text.length) cur += text[++i]; else cur += ch; continue; }
    if (ch === "'" || ch === '"') { q = ch; has = true; continue; }
    if (/\s/.test(ch)) { if (has) out.push(cur); cur = ""; has = false; continue; }
    if (!/[\w.,:+=%@^/-]/.test(ch)) return null;
    cur += ch; has = true;
  }
  if (q) return null;
  if (has) out.push(cur);
  return out;
}
/** Short/long options by whitelist → { operands, opts: [[flag, value?]] }, or null on an option outside it. */
function parseOpts(args, { flags = "", valued = "", longFlags = [], longValued = [], numeric = false }) {
  const operands = [], opts = [];
  for (let i = 0, dd = false; i < args.length; i++) {
    const a = args[i];
    if (dd || a === "-" || !a.startsWith("-")) { operands.push(a); continue; }
    if (a === "--") { dd = true; continue; }
    if (numeric && /^-\d+$/.test(a)) { opts.push(["n", a.slice(1)]); continue; }
    if (a.startsWith("--")) {
      const eq = a.indexOf("="), k = eq < 0 ? a.slice(2) : a.slice(2, eq);
      if (eq < 0 && longFlags.includes(k)) { opts.push([k]); continue; }
      if (!longValued.includes(k)) return null;
      if (eq >= 0) opts.push([k, a.slice(eq + 1)]); else if (i + 1 < args.length) opts.push([k, args[++i]]); else return null;
      continue;
    }
    for (let j = 1; j < a.length; j++) {
      const f = a[j];
      if (flags.includes(f)) { opts.push([f]); continue; }
      if (!valued.includes(f)) return null;
      const v = a.slice(j + 1);
      if (v) opts.push([f, v]); else if (i + 1 < args.length) opts.push([f, args[++i]]); else return null;
      break;
    }
  }
  return { operands, opts };
}
/** A sed script that only prints: [addr[,addr]][!] p P = q Q {…} and s/…/…/[gpiI0-9] — never w W e r R or any other. */
function sedPrintsOnly(s) {
  let i = 0, depth = 0;
  const n = s.length, digits = () => { const st = i; while (i < n && /\d/.test(s[i])) i++; return i > st; };
  const regex = () => { i++; while (i < n && s[i] !== "/") { if (s[i] === "\\") i++; i++; } if (i >= n) return false; i++; if (s[i] === "I" || s[i] === "M") i++; return true; };
  const addr = () => {
    if (/\d/.test(s[i] || "")) { digits(); if (s[i] === "~") { i++; if (!digits()) return false; } return true; }
    if (s[i] === "$") { i++; return true; }
    if (s[i] === "/") return regex();
    return null;
  };
  for (;;) {
    while (i < n && /[\s;]/.test(s[i])) i++;
    if (i >= n) return depth === 0;
    if (s[i] === "}") { if (!depth) return false; depth--; i++; continue; }
    const a = addr();
    if (a === false) return false;
    if (a && s[i] === ",") { i++; if (s[i] === "+" || s[i] === "~") { i++; if (!digits()) return false; } else if (!addr()) return false; }
    while (s[i] === " ") i++;
    if (s[i] === "!") i++;
    while (s[i] === " ") i++;
    const cmd = s[i++];
    if (cmd === "{") { depth++; continue; }
    if (cmd === "p" || cmd === "P" || cmd === "=") continue;
    if (cmd === "q" || cmd === "Q") { digits(); continue; }
    if (cmd === "s") {
      const d = s[i++];
      if (!d || /[\s\\]/.test(d)) return false;
      for (let k = 0; k < 2; k++) { while (i < n && s[i] !== d) { if (s[i] === "\\") i++; i++; } if (i >= n) return false; i++; }
      while (i < n && /[gpiI0-9]/.test(s[i])) i++;
      continue;
    }
    return false;
  }
}
const COUNT = /^[+-]?\d+$/;
/** (a) THE NEUTRAL FILTERS, and only these — each reads stdin only (a FILE operand, -i, w/e, -o, -f, -r → not neutral). */
export const NEUTRAL_FILTERS = Object.freeze({
  sed: (a) => {
    const p = parseOpts(a, { flags: "nEr", valued: "e", longFlags: ["quiet", "silent", "regexp-extended"] });
    if (!p || !p.opts.some(([f]) => f === "n" || f === "quiet" || f === "silent")) return false;
    const scripts = p.opts.filter(([f]) => f === "e").map(([, v]) => v);
    if (!scripts.length && p.operands.length) scripts.push(p.operands.shift());
    return scripts.length > 0 && !p.operands.length && scripts.every(sedPrintsOnly);
  },
  head: (a) => { const p = parseOpts(a, { flags: "qv", valued: "nc", longValued: ["lines", "bytes"], numeric: true }); return !!p && !p.operands.length && p.opts.every(([, v]) => v === undefined || /^-?\d+$/.test(v)); },
  tail: (a) => { const p = parseOpts(a, { flags: "qv", valued: "nc", longValued: ["lines", "bytes"], numeric: true }); return !!p && !p.operands.length && p.opts.every(([, v]) => v === undefined || COUNT.test(v)); },
  grep: (a) => {
    const p = parseOpts(a, { flags: "ivncwxoEFPhHsq", valued: "emABC" });
    if (!p || p.opts.some(([f, v]) => "mABC".includes(f) && !/^\d+$/.test(v))) return false;
    return p.operands.length === (p.opts.some(([f]) => f === "e") ? 0 : 1);
  },
  cut: (a) => { const p = parseOpts(a, { flags: "sn", valued: "dfcb" }); return !!p && !p.operands.length; },
  wc: (a) => { const p = parseOpts(a, { flags: "lwcmL" }); return !!p && !p.operands.length; },
  sort: (a) => { const p = parseOpts(a, { flags: "nrufbhVgMsdi", valued: "kt" }); return !!p && !p.operands.length; },
  uniq: (a) => { const p = parseOpts(a, { flags: "cdui", valued: "fsw" }); return !!p && !p.operands.length && p.opts.every(([, v]) => v === undefined || /^\d+$/.test(v)); },
  tr: (a) => { const p = parseOpts(a, { flags: "dscC" }); return !!p && p.operands.length >= 1 && p.operands.length <= 2; },
  "select-object": (a) => a.length > 0 && a.length % 2 === 0 && a.every((w, i) => (i % 2 ? /^\d+(,\d+)*$/.test(w) : /^-(first|last|skip|index)$/i.test(w))),
  "select-string": (a) => a.length === 2 && /^-pattern$/i.test(a[0]),
});
function neutralFilter(text) {
  const w = filterWords(text);
  if (!w || !w.length) return false;
  const key = /^select-/i.test(w[0]) ? w[0].toLowerCase() : w[0];   // PowerShell names are case-blind, the unix ones are not
  return Object.hasOwn(NEUTRAL_FILTERS, key) && NEUTRAL_FILTERS[key](w.slice(1));
}
/** (b) every later use of the assignment's $VAR sits in an in-set organ's ARGUMENT list (never its script path). */
function assignNeutral(segs, k) {
  const use = new RegExp(`\\$\\{?(?:[A-Za-z]+:)?${segs[k].assign}(?![A-Za-z0-9_])`, "gi");
  for (let j = k + 1; j < segs.length; j++) {
    const hits = [...segs[j].text.matchAll(use)];
    if (!hits.length) continue;
    const at = segs[j].assign ? -1 : organArgsAt(segs[j].text);
    if (at < 0 || hits.some((h) => h.index < at)) return false;
  }
  return true;
}
/** Each segment's kind: "in" (G3's rule) · "neutral" (row 297 (1)) · "out". */
function segmentKinds(segs) {
  const kinds = [];
  let head = -1;
  segs.forEach((s, k) => {
    if (!s.piped) head = k;
    if (s.assign) { kinds.push(!s.piped && assignNeutral(segs, k) ? "neutral" : "out"); return; }
    if (outRedirect(s.text)) { kinds.push("out"); return; }
    if (segmentInStudySet(s)) { kinds.push("in"); return; }
    const onOrgan = s.piped && head >= 0 && inSetOrgan(segs[head].text) && kinds.slice(head, k).every((x) => x !== "out");
    kinds.push(onOrgan && neutralFilter(s.text) ? "neutral" : "out");
  });
  return kinds;
}
/** Is this shell command inside the study set? Every segment an owner CLI of the set or a read of the canon (never code,
 *  never memory) or NEUTRAL; a bare cd or a path-less pipe filter rides along; one segment of system work takes the whole
 *  call out; neutral segments alone (or with only a cd) are no study call. */
export function shellInStudySet(cmd) {
  const c = String(cmd || "");
  // the pre-G3 whole-string test still has to pass — so this can only ever refuse MORE (a gate only gets stricter)
  if (!((ALLOWED_CMD.test(c) && !UNSAFE_SHELL.test(c)) || (SHELL_CANON_READ.test(c) && CANON_READ_PATH.test(c) && !NEVER_READ.test(c)))) return false;
  const segs = shellSegments(c);
  if (!segs || !segs.length) return false;
  const kinds = segmentKinds(segs);
  return kinds.every((k) => k !== "out") && segs.some((s, k) => kinds[k] === "in" && (s.piped || !CD_ONLY.test(s.text)));
}
/** THE CHAIN RULE (row 297 (2)): a REFUSED command's study part to re-run alone — its neutral assignments and each
 *  in-set organ with the in-set / neutral filters of its pipe — so a capture or an axis call is never lost silently.
 *  [] when the command is in the set, carries a command substitution, or has no in-set organ. */
export function studyRerun(cmd) {
  const c = String(cmd || "");
  if (shellInStudySet(c)) return [];
  const segs = shellSegments(c);
  if (!segs) return [];
  const kinds = segmentKinds(segs), parts = [];
  let organs = 0;
  for (let k = 0; k < segs.length; k++) {
    if (segs[k].piped) continue;
    if (segs[k].assign) { if (kinds[k] === "neutral") parts.push(segs[k].text.trim()); continue; }
    if (!inSetOrgan(segs[k].text)) continue;
    const pipe = [segs[k].text.trim()];
    for (let j = k + 1; j < segs.length && segs[j].piped && kinds[j] !== "out"; j++) pipe.push(segs[j].text.trim());
    parts.push(pipe.join(" | ")); organs++;
  }
  if (!organs) return [];
  return shellInStudySet(parts.join("; ")) ? parts : parts.filter((p) => shellInStudySet(p));
}

// ── HIS LAST PROMPT, read from the transcript's TAIL — for a hook that has only the payload (rails, G3) ──
/** The text of a HUMAN user line (never a tool result, never a harness meta line). */
export const humanText = (o) => {
  if (!o || o.type !== "user" || o.isMeta) return null;
  const c = o.message && o.message.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c) && !c.some((b) => b && b.type === "tool_result")) return c.filter((b) => b && b.type === "text").map((b) => b.text).join("\n");
  return null;
};
export const SLASH_NOISE = /^\s*<(local-command|command-name>\/(clear|model|effort|compact))/;
/** His last prompt in this transcript, or null (unreadable, none in the tail). Reads at most tailBytes from the end. */
export function lastHumanPrompt(path, tailBytes = 262144) {
  let text = "";
  try {
    const size = statSync(String(path)).size;
    const fd = openSync(String(path), "r");
    try {
      const span = Math.min(size, tailBytes); const buf = Buffer.alloc(span);
      readSync(fd, buf, 0, span, size - span); text = buf.toString("utf8");
    } finally { closeSync(fd); }
  } catch { return null; }
  const lines = text.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    if (!l || l[0] !== "{" || !/"type":"user"/.test(l)) continue;
    let o; try { o = JSON.parse(l); } catch { continue; }
    const t = humanText(o);
    if (t !== null && !SLASH_NOISE.test(t)) return t;
  }
  return null;
}

// ── CLI — by hand only (the hook path is the CALL shape above); read-only, prints one JSON line ──
//   node scripts/study_scope.mjs scope   --session <id>                              → the predicate's verdict for that session
//   node scripts/study_scope.mjs unbound --session <id> [--transcript p] [--prompt "…"] [--entrypoint claude-desktop|cli]
//                                                                                     → the pointer line that session would get, or why it is silent
function cli() {
  const mode = (process.argv[2] || "").toLowerCase();
  const rest = process.argv.slice(3);
  const opt = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : undefined; };
  const payload = { session_id: opt("--session") || "", transcript_path: opt("--transcript") || null, prompt: opt("--prompt") || null };
  const env = opt("--entrypoint") ? { ...process.env, CLAUDE_CODE_ENTRYPOINT: opt("--entrypoint") } : process.env;
  if (mode === "scope") { console.log(JSON.stringify(studyScope({ payload, sitting: readSitting(), env }))); return; }
  if (mode === "unbound") { const v = unboundVerdict({ payload, env }); console.log(JSON.stringify({ study: v.scope.study, scope_why: v.scope.why, printed: v.line, why: v.why })); return; }
  console.log("study_scope: scope --session <id> | unbound --session <id> [--transcript p] [--prompt \"…\"] [--entrypoint e]   (read-only; the hook path is turn_hook's CALL shape)");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli();

// ── CASES (run by turn_hook.mjs selftest) ─────────────────────────────────────
export function scopeSelfCheck() {
  const cases = [];
  const check = (name, ok, detail = "") => cases.push({ name: `study_scope · ${name}`, ok: !!ok, detail });
  const HOST = "11111111-2222-3333-4444-555555555555", OTHER = "99999999-8888-7777-6666-555555555555";
  const open = { id: "sit_x", closed_at: null, host_session_id: HOST };
  check("the host session of an open sitting IS in scope", studyScope({ payload: { session_id: HOST }, sitting: open }).study === true);
  check("another session (the architect, a runner) is NOT in scope — the H3 class", studyScope({ payload: { session_id: OTHER }, sitting: open }).study === false);
  check("a closed sitting scopes nobody, its old host included", studyScope({ payload: { session_id: HOST }, sitting: { ...open, closed_at: "2026-09-23T00:00:00Z" } }).study === false);
  check("an open sitting with no host bound scopes nobody (fail-closed)", studyScope({ payload: { session_id: HOST }, sitting: { id: "sit_x", closed_at: null, host_session_id: null } }).study === false);
  check("TRANSITION — an OPEN sitting with the host keys ABSENT (only a pre-G0 daemon build writes that) keeps the old scope for every session and says so; closed, it scopes nobody",
    studyScope({ payload: { session_id: OTHER }, sitting: { id: "sit_old", closed_at: null } }).study === true
    && studyScope({ payload: { session_id: OTHER }, sitting: { id: "sit_old", closed_at: null } }).legacy === true
    && /pre-G0 daemon build/.test(studyScope({ payload: { session_id: OTHER }, sitting: { id: "sit_old", closed_at: null } }).why)
    && studyScope({ payload: { session_id: OTHER }, sitting: { id: "sit_old", closed_at: "2026-09-22T18:59:00Z" } }).study === false
    && studyScope({ payload: { session_id: OTHER }, sitting: { id: "sit_old", closed_at: null }, env: { ARSENAL_ORGAN: "1" } }).study === false);
  check("no sitting file scopes nobody", studyScope({ payload: { session_id: HOST }, sitting: null }).study === false);
  check("a payload with no session_id is never study", studyScope({ payload: {}, sitting: open }).study === false);
  check("a headless organ is never study, even carrying the host id", studyScope({ payload: { session_id: HOST }, sitting: open, env: { ARSENAL_ORGAN: "1" } }).study === false);
  check("unparseable stdin reads as an empty payload, never a throw", Object.keys(payloadOf("{not json")).length === 0 && scopeFromHook("{not json", { dir: join(HERE, "no-such-dir"), env: {} }).study === false);
  check("the transcript path is derived from the project folder the way P0 read it",
    projectSlug("C:\\Users\\nikhi\\GitHub\\arsenal-ai-fc") === "C--Users-nikhi-GitHub-arsenal-ai-fc"
    && transcriptPathFor(HOST, { root: "C:\\r", home: "H" }) === join("H", ".claude", "projects", "C--r", `${HOST}.jsonl`)
    && transcriptPathFor("not-an-id") === null);
  check("the surface is read from the env first, then from the transcript head, else null",
    entrypointOf({ env: { CLAUDE_CODE_ENTRYPOINT: "claude-desktop" } }) === "claude-desktop"
    && entrypointOf({ env: {}, transcriptPath: join(HERE, "no-such-file.jsonl") }) === null);
  const forge = { concept: "tokenization", current_axis: "c", closed_at: null };
  const notHost = studyScope({ payload: { session_id: OTHER }, sitting: open });
  const line = unboundLine({ scope: notHost, forge, entrypoint: "claude-desktop" });
  check("THE UNBOUND LINE fires on a Desktop session outside scope while a concept is open, naming the boot ORDER (digest first, then the sitting, with the live task) — row 256 (1)(b)",
    !!line && line.indexOf("learn_digest.mjs") >= 0 && line.indexOf("learn_digest.mjs") < line.indexOf("sitting.mjs open --surface code --no-spawn") && line.includes("tokenization axis c") && /before any teaching text/.test(line));
  check("…and on a CLI session whose first prompt was a learning-lane opener (row 256 (1)(a): the study reset line sends him to the CLI with 'learn')",
    !!unboundLine({ scope: notHost, forge, entrypoint: "cli", opener: true }));
  check("…and stays silent on a CLI engineering session, in scope, with no concept open, or for a headless organ",
    unboundLine({ scope: notHost, forge, entrypoint: "cli", opener: false }) === null
    && unboundLine({ scope: studyScope({ payload: { session_id: HOST }, sitting: open }), forge, entrypoint: "claude-desktop" }) === null
    && unboundLine({ scope: notHost, forge: { ...forge, closed_at: "x" }, entrypoint: "claude-desktop" }) === null
    && unboundLine({ scope: studyScope({ payload: { session_id: HOST }, sitting: open, env: { ARSENAL_ORGAN: "1" } }), forge, entrypoint: "claude-desktop" }) === null);
  check("…and it is ONE line, never a block", !!line && !line.includes("\n"));
  const trig = learnTriggers();
  check("the openers are READ from the /learn skill's own frontmatter (its quoted trigger list), never typed here",
    trig.includes("learn") && trig.includes("continue") && trig.includes("where was i") && trig.length >= 5, JSON.stringify(trig));
  check("an opener is an EXACT trigger or a /learn|/forge slash call — 'continue the audit' (an executor's), 'runner' and 'architect' are not",
    isLearnOpener("learn", trig) && isLearnOpener("  Continue. ", trig) && isLearnOpener("<command-message>learn</command-message>\n<command-name>/learn</command-name>", trig)
    && isLearnOpener("<command-name>/forge</command-name> embeddings", trig)
    && !isLearnOpener("continue the audit", trig) && !isLearnOpener("runner", trig) && !isLearnOpener("architect", trig) && !isLearnOpener("", trig));
  check("an unreadable skill file yields NO openers (the Desktop leg still stands), never a throw", learnTriggers(join(HERE, "no-such-skill.md")).length === 0);
  // THE CLASSIFIER (row 258 (2)(d)) — HIS OWN prompts from the five Desktop study transcripts P0 read, both ways.
  const K = (t, o) => classifyPrompt(t, o);
  check("CLASSIFY · a gut-word opener is an ANSWER, the typo he types included (db82184b t2 'shaya -', t3/t11 'pakka -', a33327c2 t12 'shayad -')",
    K("shaya - word level tokenization - out of vocab issue").gut === "shayad" && K("pakka - i think pay because it is repeated the most number of times").kind === "answer"
    && K("shayad - no, single character tokens can not explain the meaning").gut === "shayad");
  check("CLASSIFY · an answer ABOUT a model's not-understanding is not HIS confusion (db82184b t3 — one of P0's six false confusion hits)",
    K("pakka - no because a LLM model does not understand any language, it only understands numbers").confusion === false);
  check("CLASSIFY · 'no idea' is the pata-nahi answer (db82184b t4/t5, both unbanked in P0)", K("no idea bro").gut === "pata nahi" && K("no idea").kind === "answer");
  check("CLASSIFY · the gut given mid-message or after a question still banks (a33327c2 t3 'gut word - pakka', 9e29b88c t3 '… right? knew - …'), and the complaint riding it is flagged system",
    K("weren't you supposed to teach me in hinglish and not in hindi or english? gut word - pakka word-level --- ar, isto").gut === "pakka"
    && K("weren't you supposed to teach me in hinglish and not in hindi or english? gut word - pakka word-level").system === true
    && K("gut word was in enlgish right? knew - sequence length will be 3").kind === "answer");
  check("CLASSIFY · HIS confusion, first person, outranks the system talk riding it (c1d9abce t2, a33327c2 t6)",
    K("i am not understanding what am i supposed to answer? like did not understand the question").kind === "confusion"
    && K("i did not get it, understood nothing. i mean what is morphology? always tell me what are the gut words, bhai merko kuch smjh nahi aya").kind === "confusion");
  check("CLASSIFY · talk about the system, the notes, the ruling, a new session is SYSTEM (db82184b t12, e3316fbd t6, 9e29b88c t8, e3316fbd t4)",
    K("yes i got it its and bits, i think more will be clear by visualization right? are you following the visualization ruling correctly?").kind === "system"
    && K("before we start, can you please tell me how are you taking my notes topic and session agnostically when i start learning by command /learn ??").kind === "system"
    && K("bruh why don't you keep yourself updated with the entire /learn first on how to do it, you keep on doing mistakes").kind === "system"
    && K("Hi bro, i am starting my learning after 1 day and i forgot what were we doing?? can we please re-start?").kind === "system");
  check("CLASSIFY · a reply to a gut-bearing moment (pehle_guess / jirah / sharp_check) is an answer; to check_q, or a bare 'ok', it is not (db82184b t10 'A')",
    K("A", { prevMoments: ["pehle_guess"] }).kind === "answer" && K("word level issue is - vocab will be of a very big size", { prevMoments: ["jirah"] }).answer === true
    && K("A", { prevMoments: ["check_q"] }).answer === false && K("ok", { prevMoments: ["pehle_guess"] }).answer === false && K("A").answer === false);
  check("CLASSIFY · his \"nahi\" to a check_q is HIS confusion (forge:R140); \"nahi\" with no check_q before it is not",
    K("nahi", { prevMoments: ["check_q"] }).kind === "confusion" && K("nahi yaar, thoda aur", { prevMoments: ["check_q"] }).confusion === true && K("nahi").confusion === false);
  check("CLASSIFY · a study question is a QUESTION, not system talk (a33327c2 t2); an empty prompt is empty",
    K("ijust got this, what do i need to do?").kind === "question" && K("").kind === "empty" && K("<command-message>learn</command-message> <command-name>/learn</command-name>").system === true);
  // THE BANK'S MOMENTS (forks row 264 (1)): due at the jirah and the sharp check, never per idea.
  const B = (t, prev = []) => bankDueAt({ cls: K(t, { prevMoments: prev }), prevMoments: prev });
  check("BANK · a reply to a declared jirah is due, a gut-word one or not; a bare 'ok' to it is not",
    /jirah/.test(B("word level issue is - vocab will be of a very big size", ["jirah"]) || "") && /jirah/.test(B("pakka - pay", ["jirah"]) || "") && B("ok", ["jirah"]) === null);
  check("BANK · rows 266 / 268: a reply to a declared sharp_check is due, a gut-word one or not (it carries the trio like jirah) — and it is his answer (the classifier), whatever it opens with; a bare 'ok' to it is not",
    /sharp check/.test(B("shaya - word level tokenization - out of vocab issue", ["sharp_check"]) || "") && /sharp check/.test(B("no idea", ["sharp_check"]) || "")
    && /sharp check/.test(B("the vocab would be huge, so OOV", ["sharp_check"]) || "") && B("ok", ["sharp_check"]) === null
    && K("the vocab would be huge, so OOV", { prevMoments: ["sharp_check"] }).answer === true && GUT_BEARING_MOMENTS.includes("sharp_check"));
  check("BANK · row 266 retires the ABSENCE reading: a gut-word to a question that declared NO moment is not due (that question is a quiz-dump red, R2 (c))",
    B("shaya - word level tokenization - out of vocab issue") === null && B("no idea") === null && B("the vocab would be huge, so OOV") === null);
  check("BANK · a reply to a PER-IDEA moment is never due, gut-word or not — db82184b t3 t4 t5 t11 (P0's unbanked pehle_guess replies) and a check_q 'haan'",
    B("pakka - no because a LLM model does not understand", ["pehle_guess"]) === null && B("no idea bro", ["pehle_guess"]) === null && B("no idea", ["pehle_guess"]) === null
    && B("pakka - i think pay because it is repeated the most", ["pehle_guess"]) === null && B("haan", ["check_q"]) === null && B("A", ["widget_gate"]) === null
    && B("knew - sequence length will be 3", ["check_q", "check_q"]) === null);
  check("BANK · no answer, no bank: system talk, his confusion, an empty prompt, garbage input",
    B("are you following the visualization ruling correctly?") === null && B("samajh nahi aaya") === null && B("") === null && bankDueAt() === null && bankDueAt({ cls: "x", prevMoments: "y" }) === null);
  {
    const dir = mkdtempSync(join(tmpdir(), "study_scope-")); const tx = join(dir, "t.jsonl");
    try {
      writeFileSync(tx, [
        JSON.stringify({ type: "user", isMeta: true, message: { content: "<local-command-caveat>x</local-command-caveat>" } }),
        JSON.stringify({ type: "user", message: { content: "<command-name>/clear</command-name>" } }),
        "not json",
        JSON.stringify({ type: "user", entrypoint: "cli", message: { content: [{ type: "text", text: "learn" }] } }),
        JSON.stringify({ type: "user", message: { content: [{ type: "text", text: "runner" }] } }),
      ].join("\n"));
      check("the first HUMAN prompt skips meta rows, /clear rows and torn lines (P0's own skips); an absent file is null",
        firstHumanPrompt(tx) === "learn" && firstHumanPrompt(join(dir, "none.jsonl")) === null && entrypointOfTranscript(tx) === "cli");
      // G3 reads his LAST prompt from the tail: the last human line wins; a tool result, a meta row, /clear and a torn line never do
      writeFileSync(tx, [
        JSON.stringify({ type: "user", message: { content: "pakka - pay" } }),
        JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text: "ok" }] } }),
        JSON.stringify({ type: "user", message: { content: [{ type: "text", text: "<command-message>full-time</command-message>\n<command-name>/full-time</command-name>" }] } }),
        JSON.stringify({ type: "user", isMeta: true, message: { content: "the skill body" } }),
        JSON.stringify({ type: "user", message: { content: [{ type: "tool_result", content: "x" }] } }),
        JSON.stringify({ type: "user", message: { content: "<command-name>/compact</command-name>" } }),
        "{torn",
      ].join("\n"));
      check("LAST PROMPT (G3) · the last HUMAN line of the tail is his prompt — past a skill's meta body, a tool result, /compact and a torn line; an absent file is null",
        /\/full-time/.test(lastHumanPrompt(tx) || "") && lastHumanPrompt(join(dir, "none.jsonl")) === null && lastHumanPrompt(tx, 40) === null);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  // THE STUDY SET (G3 + B.tools, one home) — planted both ways
  check("STUDY SET · owner CLIs of the set pass (pointer, moment, voice_rep bank, course at/done — learn:R35 / R136); a canon read passes",
    shellInStudySet("node scripts/forge_session.mjs pointer \"axis c merge\"") && shellInStudySet("node \"$CLAUDE_PROJECT_DIR/scripts/forge_session.mjs\" moment sharp_check")
    && shellInStudySet("node scripts/gaffer_brain.mjs capture voice_rep tokenization:c --axis c --gut knew") && shellInStudySet("node scripts/course.mjs at 3") && shellInStudySet("node scripts/course.mjs done 3")
    && shellInStudySet("sed -n '120,160p' learning-layer/VISUAL_CONTRACT.md"));
  check("STUDY SET · system work is outside: xray, git, npm, an organ outside the set, a read of code or memory, an allowed organ chained to a commit, course ingest (not ruled in)",
    !shellInStudySet("node scripts/xray.mjs report") && !shellInStudySet("git status") && !shellInStudySet("npm test") && !shellInStudySet("node scripts/tokenizer_play.mjs train \"x\"")
    && !shellInStudySet("sed -n '1,40p' scripts/forge_session.mjs") && !shellInStudySet("cat C:/Users/nikhi/.claude/projects/x/memory/MEMORY.md")
    && !shellInStudySet("node scripts/forge_session.mjs pointer x && git commit -m y") && !shellInStudySet("node scripts/course.mjs ingest ch.txt") && !shellInStudySet(""));
  // G3 · CHAINING (forks row 283 (2)) — every segment must be in the set; planted both ways
  check("STUDY SET CHAIN · the study shapes still pass: a separator inside quotes, a head-of-chain cd, a 2>&1 redirect piped to head, a canon read piped to grep, PowerShell's & call",
    shellInStudySet('node scripts/forge_session.mjs pointer "axis c; merge && x"') && shellInStudySet("cd C:/x && node scripts/forge_session.mjs moment jirah")
    && shellInStudySet("node scripts/forge_session.mjs status 2>&1 | head -20") && shellInStudySet('sed -n "1,40p" learning-layer/HOW_HE_LEARNS.md | grep -n axis')
    && shellInStudySet("& node scripts\\sitting.mjs status"));
  check("STUDY SET CHAIN · an allowed organ CHAINED to system work is outside (&& ; & | newline), so is a command substitution, a pipe into a writer or into a path, an organ merely echoed, a bare cd",
    !shellInStudySet("node scripts/forge_session.mjs pointer x && node scripts/xray.mjs report") && !shellInStudySet("node scripts/forge_session.mjs pointer x; git status")
    && !shellInStudySet("node scripts/forge_session.mjs status & node scripts/xray.mjs") && !shellInStudySet("node scripts/forge_session.mjs pointer x | node scripts/xray.mjs")
    && !shellInStudySet("node scripts/forge_session.mjs pointer x\nnode scripts/xray.mjs") && !shellInStudySet('node scripts/forge_session.mjs pointer "$(node scripts/xray.mjs)"')
    && !shellInStudySet("node scripts/forge_session.mjs pointer `id`") && !shellInStudySet("node scripts/forge_session.mjs status | tee scripts/x.mjs")
    && !shellInStudySet("cat learning-layer/a.md | grep x scripts/a.mjs") && !shellInStudySet("echo forge_session.mjs pointer x") && !shellInStudySet("cd C:/x"));
  // G3 v2 · THE NEUTRAL SHAPES (forks row 297) — his lesson shapes of 22–23 Sep verbatim, planted both ways, forever (L9)
  const SHAPE_A = "said=$(cat <<'EOF'\nmujhe lagta hai subword beech ka rasta hai; word-level | vocab phat jaata hai\nEOF\n)\n"
    + 'node scripts/gaffer_brain.mjs capture voice_rep tokenization:b --axis b --gut knew --asked "Why do LLMs use subword tokenization instead of word-level or character-level?" --said "$said" --surface code --latency_ms 434963 --probe reconstruct --register interview && node scripts/forge_session.mjs axis b done';
  const SHAPE_A_PS = "$said = @'\nmujhe lagta hai; subword | beech ka\n'@\nnode scripts/gaffer_brain.mjs capture voice_rep tokenization:b --axis b --gut knew --said $said --surface code; node scripts/forge_session.mjs axis b done";
  const SHAPE_B = "node scripts/forge_session.mjs axis c now && node scripts/learn_digest.mjs | sed -n '/^POSITION/,/^THE TRAPS/p' | tail -n +2 | head -20";
  const SHAPE_B2 = 'cd "C:/Users/nikhi/GitHub/arsenal-ai-fc" && node scripts/forge_session.mjs 2>&1 | head -30';
  const CAPTURE_C = 'node scripts/gaffer_brain.mjs capture voice_rep tokenization:c --axis c --gut guessed --asked "ek round mein factory poore corpus ke saare adjacent pairs ek saath gin ke sirf sabse common ek pair jodti hai, ya ek-ek letter utha ke uske pairs ginti hai?" --said "pata nahi - i have no clue. i am confused about the jargons you are using, what do you mean by factory here?" --probe reconstruct --surface code';
  const SHAPE_C = `${CAPTURE_C}; node scripts/teaching_contract.mjs 2>&1 | Select-Object -First 40`;
  check("NEUTRAL (row 297) · ALLOW — shape A (his Bolo through a quoted heredoc, CRLF too) and its PowerShell here-string form · shape B (an organ piped into sed -n / tail / head) · status 2>&1 | head · Select-String -Pattern · quoted assignments read only by organs",
    shellInStudySet(SHAPE_A) && shellInStudySet(SHAPE_A.replace(/\n/g, "\r\n")) && shellInStudySet(SHAPE_A_PS) && shellInStudySet(SHAPE_B)
    && shellInStudySet("node scripts/forge_session.mjs status 2>&1 | head -30") && shellInStudySet("node scripts/learn_digest.mjs | Select-String -Pattern POSITION")
    && shellInStudySet("said='x y'; node scripts/forge_session.mjs pointer \"$said\"") && shellInStudySet('said="x y"; node scripts/forge_session.mjs pointer "$said"')
    && shellInStudySet("$said = 'it''s'; node scripts/forge_session.mjs pointer $said") && shellInStudySet("node scripts/learn_digest.mjs | sed -n 's/a/b/p' | grep -n 'THE TRAPS/x'"));
  // row 297 planted SHAPE_B2 as refused by the whole-string test; forks row 299 (24 Sep 2026) rules the verbless form IN
  check("BARE forge_session (row 299) · ALLOW — shape B2 verbatim (the 4 Sep lesson), the bare call alone and quoted, and with `status` as before; the whole-string test now names it",
    shellInStudySet(SHAPE_B2) && ALLOWED_CMD.test(SHAPE_B2) && shellInStudySet("node scripts/forge_session.mjs") && shellInStudySet('node "scripts/forge_session.mjs" 2>&1')
    && shellInStudySet(SHAPE_B2.replace("forge_session.mjs 2>&1", "forge_session.mjs status 2>&1")));
  check("BARE forge_session (row 299) · DENY — a verb or flag outside the set (selftest, --x, a stray word after 2>&1), a redirect to a file, chained to system work, a bare cd",
    !shellInStudySet("node scripts/forge_session.mjs selftest") && !shellInStudySet("node scripts/forge_session.mjs --no-rep-why x") && !shellInStudySet("node scripts/forge_session.mjs 2>&1 selftest")
    && !shellInStudySet("node scripts/forge_session.mjs > out.txt") && !shellInStudySet("node scripts/forge_session.mjs 2>err.txt") && !shellInStudySet("node scripts/forge_session.mjs; git status")
    && !shellInStudySet("node scripts/forge_session.mjs && node scripts/xray.mjs report") && !shellInStudySet("node scripts/forge_session.mjs | tee x.txt") && !shellInStudySet("cd C:/x"));
  check("ECHO (row 299's DENY half) · a bare echo/printf, a non-literal echo, an echo redirected, a substitution, an echo fed to node -e — all refused",
    !shellInStudySet("echo ---") && !shellInStudySet("printf x") && !shellInStudySet('echo "$said"; node scripts/forge_session.mjs status')
    && !shellInStudySet("echo x > f.txt; node scripts/forge_session.mjs status") && !shellInStudySet("echo $(whoami); node scripts/forge_session.mjs status")
    && !shellInStudySet('echo x | node -e "process.stdin.pipe(process.stdout)"') && !shellInStudySet("echo x | node scripts/forge_session.mjs status"));
  check("NEUTRAL · DENY — shape C (a capture chained to an out-of-set read) · sed -i · an organ redirected to a file (a discard to /dev/null or $null is no file) · tee · a filter with a FILE operand (alone, chained, piped) · sed w/e · sed -n with a file · a filter on a non-organ",
    !shellInStudySet(SHAPE_C) && !shellInStudySet("node scripts/learn_digest.mjs | sed -i s/a/b/") && !shellInStudySet("node scripts/forge_session.mjs status > out.txt")
    && !shellInStudySet("node scripts/learn_digest.mjs | tee x.txt") && !shellInStudySet("grep -n x scripts/rails.mjs") && !shellInStudySet("node scripts/forge_session.mjs status; grep -n x scripts/rails.mjs")
    && !shellInStudySet("node scripts/forge_session.mjs status | grep -n x scripts/rails.mjs") && !shellInStudySet("node scripts/learn_digest.mjs | sed -n '1,5w out.txt'")
    && !shellInStudySet("node scripts/learn_digest.mjs | sed -n '1e id'") && !shellInStudySet("node scripts/learn_digest.mjs | sed -n 1,5p notes.md")
    && !shellInStudySet("node scripts/forge_session.mjs status | head > x.txt") && !shellInStudySet("node scripts/xray.mjs report | sed -n '1,5p'")
    && !shellInStudySet("node scripts/forge_session.mjs status 2>/dev/nullx") && !shellInStudySet("node scripts/forge_session.mjs status >> NUL.txt")
    && shellInStudySet("node scripts/forge_session.mjs status 2>/dev/null") && shellInStudySet("node scripts/forge_session.mjs status 2>$null | Select-Object -First 5"));
  check("NEUTRAL · DENY — an assignment from any other command ($(curl …)), an UNQUOTED heredoc, a quoted heredoc fed to node -e (as a var or inline), $VAR read by a non-organ or in an organ's script path, an assignment alone or with only a cd, the 7 Sep engineering shape",
    !shellInStudySet('said=$(curl -s http://x); node scripts/gaffer_brain.mjs capture voice_rep t:c --said "$said"') && !shellInStudySet("said=$(cat <<EOF\nx\nEOF\n)\nnode scripts/gaffer_brain.mjs capture voice_rep t:c --said \"$said\"")
    && !shellInStudySet("code=$(cat <<'EOF'\nconsole.log(1)\nEOF\n)\nnode -e \"$code\" && node scripts/forge_session.mjs status") && !shellInStudySet("code=$(cat <<'EOF'\nconsole.log(1)\nEOF\n)\nnode -e \"$code\" scripts/forge_session.mjs status")
    && !shellInStudySet("node -e \"$(cat <<'EOF'\nconsole.log(1)\nEOF\n)\" && node scripts/forge_session.mjs status") && !shellInStudySet("said='x'; echo \"$said\"")
    && !shellInStudySet("said='x'; echo \"$said\"; node scripts/forge_session.mjs status") && !shellInStudySet("$said = 'x'; Get-Content learning-layer/$said; node scripts/forge_session.mjs status")
    && !shellInStudySet("d='/tmp/evil'; node \"$d/forge_session.mjs\" pointer x") && !shellInStudySet("said='forge_session.mjs pointer x'") && !shellInStudySet("said='forge_session.mjs pointer x'; cd y")
    && !shellInStudySet("said='x' | node scripts/forge_session.mjs status") && !shellInStudySet("node scripts/xray.mjs report"));
  const rC = studyRerun(SHAPE_C), rA = studyRerun(SHAPE_A.replace("axis b done", "axis b done; git status"));
  check("CHAIN RULE (row 297 (2)) · a refused command names its study part to re-run alone (shape C → the capture; shape A chained to git → its heredoc + capture + axis); an in-set command, a substitution or no organ names nothing",
    rC.length === 1 && rC[0] === CAPTURE_C && rA.length === 3 && rA[0].startsWith("said=$(cat <<'EOF'") && /--said "\$said"/.test(rA[1]) && rA[2] === "node scripts/forge_session.mjs axis b done"
    && shellInStudySet(rA.join("; ")) && studyRerun(SHAPE_A).length === 0 && studyRerun("node scripts/xray.mjs report").length === 0 && studyRerun('node scripts/forge_session.mjs pointer "$(id)"').length === 0,
    JSON.stringify({ rC, rA }));
  // forks row 305 (24 Sep 2026) — the drift law's verbs travel together; everything else named in the ruling stays out
  check("DRIFT LAW (row 305) · ALLOW — teaching_contract list, unhit-auto <id> (with --n), flag <id> --why (still)",
    shellInStudySet("node scripts/teaching_contract.mjs list") && shellInStudySet("node scripts/teaching_contract.mjs unhit-auto teach-12") && shellInStudySet("node scripts/teaching_contract.mjs unhit-auto teach-12 --n 2")
    && shellInStudySet('node scripts/teaching_contract.mjs flag teach-12 --why "x"') && shellInStudySet("node scripts/teaching_contract.mjs list 2>&1 | head -20"));
  check("DRIFT LAW (row 305) · DENY — add / drop / reset-turns / selftest, a verb that only STARTS with list, a bare teaching_contract (SHAPE_C still out), learnstate nextup / json, state, tokenizer_play (forge:R165), captains_call, list redirected to a file",
    !shellInStudySet('node scripts/teaching_contract.mjs add teach-99 "x"') && !shellInStudySet("node scripts/teaching_contract.mjs drop teach-12") && !shellInStudySet("node scripts/teaching_contract.mjs reset-turns")
    && !shellInStudySet("node scripts/teaching_contract.mjs selftest") && !shellInStudySet("node scripts/teaching_contract.mjs listx") && !shellInStudySet("node scripts/teaching_contract.mjs") && !shellInStudySet(SHAPE_C)
    && !shellInStudySet("node scripts/learnstate.mjs nextup") && !shellInStudySet("node scripts/learnstate.mjs json") && !shellInStudySet("node scripts/state.mjs")
    && !shellInStudySet("node scripts/tokenizer_play.mjs train \"x\"") && !shellInStudySet('node scripts/captains_call.mjs file --line "x"') && !shellInStudySet("node scripts/teaching_contract.mjs list > x.json"));
  check("CLOSING · /full-time's command tag, \"post match\" and \"full time\" are a CLOSING (G3 and B.tools stand down for the close organs, row 267); a study answer is not",
    classifyPrompt("<command-message>full-time</command-message>\n<command-name>/full-time</command-name>").closing === true && classifyPrompt("post match").closing === true
    && classifyPrompt("post-match karo").closing === true && classifyPrompt("ok full time").closing === true && classifyPrompt("pakka - pay kyunki repeat").closing === false);
  return { pass: cases.filter((c) => c.ok).length, fail: cases.filter((c) => !c.ok).length, cases };
}
