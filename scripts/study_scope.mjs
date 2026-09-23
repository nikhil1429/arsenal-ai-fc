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
import { readFileSync, openSync, readSync, closeSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
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
//              (pehle_guess / jirah — ruling R3 puts the trio exactly there, so the reply is graded)
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
const CLOSING = /\b(done\s+for\s+today|full\s+time|aaj\s+ke\s+liye\s+bas|band\s+karo|let'?s\s+stop|stop\s+here)\b/i;
export const GUT_BEARING_MOMENTS = Object.freeze(["pehle_guess", "jirah"]);
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
  const replyToGutMoment = (Array.isArray(prevMoments) ? prevMoments : []).some((k) => GUT_BEARING_MOMENTS.includes(k));
  const answer = !!gut || (replyToGutMoment && !!t && !ACK_ONLY.test(t) && !confusion && !system);
  const question = /\?/.test(t) && !answer;
  // confusion outranks system talk: a33327c2 t6 is "understood nothing … always tell me the gut words" — the
  // concept lesson restarts from zero (HOW_HE_LEARNS #9), it is not a park.
  const kind = answer ? "answer" : confusion ? "confusion" : system ? "system" : question ? "question" : t ? "other" : "empty";
  return { kind, gut, answer, confusion, system, closing, question };
}

// ── THE BANK'S MOMENTS — ONE predicate for the skeleton's [BANK] and the gate's B.bank (forks row 264 (1)) ──
// Forge row 53b STANDS (his 5 Sep approval, consistent with the 30 Aug ratified act): the bank is due at the
// axis's banked moments plus jirah, NEVER per idea; P0's R5 narrows to those moments. Of the four, two are
// readable on a turn:
//   JIRAH       — the last teacher turn declared `moment jirah` and his message is an answer;
//   SHARP CHECK — "gut pehle, answer typed" (forge REFERENCE step 3): a gut-word answer to a question that
//                 declared NO per-idea moment (the sharp check is banked through capture, never logged as a moment).
// The other two — the Bolo and the English interview line — are held by their owner: forge_session's
// `axis <x> done` refuses without ≥ 1 Hinglish bank and ≥ 1 --register interview since the axis opened.
// A reply to a per-idea moment is re-welded in the turn and never banked (forge:R40 / R90) — db82184b t3 t4 t5
// t11 (the pehle_guess replies P0 counted unbanked) are exactly that class, and none of them is due here.
export const PER_IDEA_MOMENTS = Object.freeze(["pehle_guess", "check_q", "widget_gate"]);
export function bankDueAt({ cls = null, prevMoments = [] } = {}) {
  const prev = Array.isArray(prevMoments) ? prevMoments : [];
  const c = cls && typeof cls === "object" ? cls : {};
  if (prev.includes("jirah") && c.answer) return "answers the jirah your last turn declared";
  if (c.gut && !prev.some((k) => PER_IDEA_MOMENTS.includes(k))) return "gives a gut-word at the sharp check";
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
  check("CLASSIFY · a reply to a gut-bearing moment (pehle_guess / jirah) is an answer; to check_q, or a bare 'ok', it is not (db82184b t10 'A')",
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
  check("BANK · a gut-word answer to a question that declared no per-idea moment is the SHARP CHECK — due (db82184b t2 'shaya -', banked in P0)",
    /sharp check/.test(B("shaya - word level tokenization - out of vocab issue") || "") && /sharp check/.test(B("no idea")) );
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
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  return { pass: cases.filter((c) => c.ok).length, fail: cases.filter((c) => !c.ok).length, cases };
}
