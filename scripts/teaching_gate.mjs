#!/usr/bin/env node
// ============================================================================
// teaching_gate.mjs · ARSENAL AI FC — THE TEACHING GATE (G2), a Stop hook of its own (23 Sep 2026)
//   queue/SPEC_v2__2026-09-23_teaching-gate.md §2 G2 · ruled by the architect in
//   RULING__TEACHING_GATE__2026-09-23_P0.md (R1–R12) and forks rows 255 / 256 / 258 / 259.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. His word, 23 Sep 2026: "i want every session in claude code on claude desktop
//   to follow everything /learn says everytime in every session and in every turn … please do not
//   do shallow work". Until today every teaching rule reached the model as PROSE (the skills, the
//   contract, the bar) and every check COUNTED — none blocked. P0 measured what that buys on his
//   last five Desktop sessions: 17 of 35 teacher turns drifted, 14 of 35 lost text above a tool
//   call on his screen, 6 of 7 of his graded answers were never banked. Prose read once drowns by
//   turn forty; a count read at night changes nothing in the turn he is sitting in.
//
// WHAT IT IS. A Stop hook in ITS OWN PROCESS (the claims.mjs pattern — the three Stop hooks run in
//   parallel, so a gate cannot ride another organ's process). It reads:
//     · the payload (session_id, transcript_path, last_assistant_message, stop_hook_active),
//     · THIS turn out of the transcript: every block since his last prompt, text AND tool_use
//       (no other hook parses tool_use — every duty rule was unmeasurable before this),
//     · the previous teacher turn's declared moments (for the bank duty) and the session's earlier
//       backticked names (for "new"), and the UserPromptSubmit hook's own latency line,
//   runs the CHECKS below and, on an ABSENCE red, answers {"decision":"block","reason":"PATCH — …"} ONCE:
//   ≤ 6 add-shaped fix lines in drift-rank order. A PRESENCE red never blocks — it is logged and counted
//   (forks row 272: a block cannot retract what he already sees; it can only ADD). On stop_hook_active it
//   judges only the segment after the block message, allows, and logs what survived.
//   TIER 0: zero model tokens. Every check is a count, a presence or a state comparison.
//
// SCOPE (G0, R7). It gates ONLY the study session: payload.session_id === the open sitting's
//   host_session_id (study_scope.mjs, the one predicate). The pre-G0 TRANSITION scope never gates —
//   it covers every session, and a gate on it would block engineering work (P0's H3 class).
//   OUTSIDE scope it has ONE job (row 256 (1)(c)): the unbound nudge as a ONCE-PER-SESSION block —
//   a Desktop (or learn-opened CLI) session with a forge concept open and no sitting bound is told
//   the boot order once. Everything else outside scope is silent and writes nothing.
//
// NEVER BLOCKS (v2 §2 G2): a non-study session · stop_hook_active (the second pass) · his message
//   classified SYSTEM talk (study_scope.classifyPrompt, row 258 (2)(d)) — then only the three
//   MECHANICAL checks stay (text above a tool is lost on his screen; a tool outside the study set;
//   AskUserQuestion), because those are not style: they are what he sees and what ran.
//   A park message passes by construction (one line + the micro-question is inside every check).
//
// THE CHECKS ARE THE RULE TABLE'S TARGETS. learning-layer/teaching_gate/RULE_TABLE.json maps every
//   A/B/C/D row of TEACHING_GATE__RULES.jsonl (the 925-row canon inventory, copied beside it) to a
//   check id below or to an EXEMPTION with its reason; the selftest's COMPLETENESS clause refuses
//   an unmapped row and a mapping to a check id that does not exist. A rule not in the table does
//   not exist for the gate — the table is checked, never remembered.
//
// LAWS. Fail-OPEN (a throw allows the turn and logs the error: a checker that can break his session
//   is worse than the drift it catches) · SOLE WRITER of dressing-room/state/teaching_gate.jsonl and
//   nothing else (it reads sitting.json, forge_session.json and the transcript; it writes no organ's
//   file) · no process.exit on the hook path · a gate only gets stricter.
// WHO ELSE COULD ACT ON THIS OUTPUT? Claude Code (the block makes the model ADD a patch below the reply he already sees) · P3's
//   proof reads teaching_gate.jsonl (blocks per turn, false blocks, hook ms) · P4's judge ranking
//   will replace RANK below.
// CASES: `node scripts/teaching_gate.mjs selftest` — planted both ways for every family, the
//   completeness clause, the scope proofs, and the hook spawned end to end on a temp state dir.
// ============================================================================
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync, mkdtempSync, rmSync, statSync, openSync, readSync, closeSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { studyScope, readSitting, readForge, payloadOf, classifyPrompt, unboundVerdict, GUT_BEARING_MOMENTS, BANKED_MOMENTS, bankDueAt, shellInStudySet, humanText, CANON_READ_PATH, NEVER_READ } from "./study_scope.mjs";
import { countTables, namedPosition, countForm, opensTerm, hindiMarkerCount, technicalLine, intensityCheck } from "./teaching_audit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
// ARSENAL_GATE_STATE_DIR is the selftest's seam and nothing else's (the teaching_audit precedent).
const STATE_DIR = process.env.ARSENAL_GATE_STATE_DIR || join(ROOT, "dressing-room", "state");
export const GATE_LOG = (dir = STATE_DIR) => join(dir, "teaching_gate.jsonl");
export const RULE_TABLE_PATH = join(ROOT, "learning-layer", "teaching_gate", "RULE_TABLE.json");
export const RULES_PATH = join(ROOT, "learning-layer", "teaching_gate", "RULES.jsonl");
const TRANSCRIPT_MAX = 16 * 1024 * 1024;   // the largest Desktop study transcript P0 read is 2.75 MB

// ── THE CHECK CATALOGUE — id → family + MOUTH + the fix line ─────────────────────
// Families: A the message text · B this turn's tool calls · C state · D the session's boot.
// THE MOUTH (forks row 272, his word #20, 23 Sep 2026: "why am i getting every output … two times on my screen??").
//   A Stop-hook block NEVER retracts the reply already rendered on his screen: Claude Code keeps it and appends the
//   continuation below it. So a block may PATCH, never REWRITE — and only a red a PATCH can cure may block:
//   patch  = ABSENCE — something is missing that ONE added line (≤ 3 lines in all) or ONE tool call supplies. BLOCKS,
//            and its fix line is add-shaped: it says what to ADD, never what to take out or send again.
//   count  = PRESENCE — the violation is already on his screen; a block changes nothing he sees and doubles what he
//            reads. LOGGED and drift-COUNTED, never blocked; its fix line rides the next turn ("agle turn se").
//   Detection is unchanged: every red still lands on the log and the drift count. Only the mouth changed. A red site
//   may name a narrower mouth for a case of its id (a trio on a check_q is PRESENCE; a missing trio is ABSENCE).
export const CHECKS = Object.freeze({
  "A.table": { fam: "A", mouth: "count", fix: "table nahi — mechanism text mein, numbered trace ke saath (his word, twice: tables confuse him)" },
  "A.sections": { fam: "A", mouth: "count", fix: "ek heading YA ek rule — dono nahi, aur ek se zyada nahi" },
  "A.one-question": { fam: "A", mouth: "count", fix: "sirf EK question sentence (\"haan ya nahi?\" usi ka hissa hai; \"Aur kyun?\" doosra sawaal hai)" },
  "A.question-last": { fam: "A", mouth: "count", fix: "check-question AAKHRI ho — uske baad sirf EK line: gut trio ya khali skeleton \"maine socha ___, phir ___\"" },
  "A.gut-by-moment": { fam: "A", mouth: "patch", fix: "jodo EK line — pehle_guess / sharp_check / jirah: \"pehle gut-word: pakka / shayad / pata nahi\" · check_q: \"samajh aaya — haan ya nahi?\" (check_q par gut-word kabhi nahi)" },
  "A.gut-trio": { fam: "A", mouth: "patch", fix: "jodo EK line: \"pehle gut-word: pakka / shayad / pata nahi\" — teeno naam (knew / shaky / guessed kabhi nahi)" },
  "A.new-terms": { fam: "A", mouth: "count", fix: "ek message mein sirf EK naya `backticked` naam — baaki agle turn ke liye" },
  "A.neev-pehle": { fam: "A", mouth: "patch", fix: "jodo EK line jo woh naam kholti hai, colon form mein: `X`: … (sirf wahi naam jo khula nahi)" },
  "A.codes-at-him": { fam: "A", mouth: "count", fix: "id / command / code usse mat dikhao — poori baat plain words mein" },
  "A.position": { fam: "A", mouth: "patch", fix: "jodo EK position line NAAM se: concept › axis › idea (jaise \"Tokenization › axis c › pair-merge\")" },
  "A.count-form": { fam: "A", mouth: "count", fix: "\"idea 2 of 4\" jaisa count nahi — position sirf naam se" },
  "A.emoji": { fam: "A", mouth: "count", fix: "emoji sirf ✅ ❌ ⚠ ⭐ — message mein ≤ 2, ek line mein ≤ 1" },
  "A.emoji-diff": { fam: "A", mouth: "count", fix: "uske jawab ki galti ❌ se nahi, ```diff se kaato (+ sahi / - galat) — ✅ / ❌ diff ke SAATH chal sakte hain, uski JAGAH kabhi nahi" },
  "A.backticks": { fam: "A", mouth: "count", fix: "backticks sirf naamon ke liye: message mein ≤ 3 alag naam, ek paragraph mein ≤ 1" },
  "A.bold": { fam: "A", mouth: "count", fix: "bold ek paragraph mein ≤ 1 (sirf wahi ek load-bearing word)" },
  "A.diff": { fam: "A", mouth: "count", fix: "sirf EK ```diff, ≤ 4 lines, har line + (sahi) ya - (galat), bagal mein prose" },
  "A.blockquote": { fam: "A", mouth: "count", fix: "blockquote ≤ 1, aur usme check-question ya koi naam nahi" },
  "A.tum": { fam: "A", mouth: "count", fix: "\"tum\" bolo — tu / tera / tujhe nahi" },
  "A.too-hindi": { fam: "A", mouth: "count", fix: "Hindi content word ki jagah English content word (Hindi sirf glue)" },
  "A.too-english": { fam: "A", mouth: "count", fix: "Hinglish: English content words, Hindi glue (hai, ka, mein, toh …) — poora English sirf interview line" },
  "A.gamify": { fam: "A", mouth: "count", fix: "XP / streak / drift / ms-seconds ke figure usse mat dikhao" },
  "A.markdown": { fam: "A", mouth: "count", fix: "raw HTML, kbd, footnote, task list, mermaid / log fence, KaTeX colour, data-URI image, hex swatch nahi" },
  "A.his-level": { fam: "A", mouth: "count", fix: "\"you already know\" / \"tumhe pata hi hai\" family nahi — uska level uske apne shabdon se" },
  "A.list-length": { fam: "A", mouth: "count", fix: "ek list level mein ≤ 4 items (≤ 4 naye units hawa mein)" },
  "A.text-last": { fam: "B", mouth: "patch", fix: "tool ke upar ka text uski Desktop screen se GAYAB hua — uska zaroori hissa ≤ 3 lines mein jodo; aage se saare tools PEHLE, text AAKHIR mein" },
  "A.ran-line": { fam: "A", mouth: "patch", fix: "jodo EK line jo batati hai kya chala (jaise \"bank kiya · pointer set\")" },
  "A.confusion-literal": { fam: "A", mouth: "count", fix: "woh confused hai: wahi naam dobara, koi naya `naam` nahi, step / axis mat badlo — zero se, chhote qadam" },
  "A.hype": { fam: "A", mouth: "count", fix: "hype / khali praise nahi — crack data hai, verdict nahi; praise sirf earned + specific" },
  "A.medical": { fam: "A", mouth: "patch", fix: "jodo EK line: \"apne doctor ko dikhao\" — dawai / dose / diagnosis par khud interpret kabhi nahi" },
  "A.layers": { fam: "A", mouth: "patch", fix: "jodo EK interview-ready English technical line usi naye naam ke liye (dukaan → asli naam → technical line)" },
  "A.intensity": { fam: "A", mouth: "patch", fix: "jodo EK line: axis ka depth · breadth · interaction verdict (maximum tha ya nahi)" },
  "A.closed-axis": { fam: "A", mouth: "count", fix: "band ho chuka axis dobara mat padhao — position line abhi ke axis ki ho" },
  "A.ask-where": { fam: "A", mouth: "count", fix: "usse mat poochho woh kahan tha, na kuch paste karne ko kaho — state se padho" },
  "A.bank-line": { fam: "A", mouth: "patch", fix: "jodo EK line: \"bank mein gaya · axis <x> · judge shaam ko\" — koi verdict nahi, koi seconds nahi" },
  "A.blame": { fam: "A", mouth: "count", fix: "galat MODEL ko kaato, usse nahi — \"yahan sabka dimaag ek taraf jaata hai\", \"tumne galat socha\" kabhi nahi" },
  "A.no-grill": { fam: "A", mouth: "count", fix: "teaching turn par grilling / reinvent-from-scratch nahi — woh jirah round ka kaam hai" },
  "A.urgency": { fam: "A", mouth: "count", fix: "pace uska hai — \"time kam hai\" / jaldi / deadline / per-day cap kabhi nahi" },
  "A.his-data": { fam: "A", mouth: "count", fix: "example uska data ho (invoice, FinOps, Blinkit) — hello world / foo / Alice nahi" },
  "A.repeat-line": { fam: "A", mouth: "count", fix: "usse koi line dohraane ko mat do — woh apne shabdon mein bolega" },
  "A.emdash": { fam: "A", mouth: "count", fix: "em-dash ki deewar nahi — paragraph mein ≤ 2, message mein ≤ 4" },
  "A.text-fence": { fam: "A", mouth: "count", fix: "```text fence sirf symbols / ids / arrows ke liye, Hinglish bahar — aur concept mein ek hi baar" },
  "A.buying": { fam: "A", mouth: "count", fix: "kharidaari ki baat ek line mein park — koi price, koi link nahi" },
  "B.bank": { fam: "B", mouth: "patch", fix: "abhi bank karo, EK tool: node scripts/gaffer_brain.mjs capture voice_rep <concept>:<axis> --axis <a-i> [--gut <USKA gut-word>] --asked \"…\" --said \"…\" --surface code [--latency_ms <hook line ka number>] · phir EK line: \"bank mein gaya · axis <x> · judge shaam ko\"" },
  "B.bank-per-idea": { fam: "B", mouth: "count", fix: "\"samajh aaya\" check ka jawab per-idea hai — bank NAHI hota; bank sirf axis ke moments par (sharp check · Bolo · interview line) aur jirah par" },
  "B.bank-verbatim": { fam: "B", mouth: "count", fix: "bank line mein --gut uska apna gut-word (pakka→knew · shayad→shaky · pata nahi→guessed) — usne gut-word nahi diya to --gut kabhi type mat karo, --said uske shabd verbatim, --asked tumhara sawaal verbatim" },
  "B.latency": { fam: "B", mouth: "count", fix: "--latency_ms wahi number jo hook line ne diya (VERBATIM) — nahi padh sakte to flag hata do" },
  "B.moment": { fam: "B", mouth: "patch", fix: "abhi EK tool: node scripts/forge_session.mjs moment check_q|pehle_guess|widget_gate|jirah|sharp_check — text mein kuch nahi jodna" },
  "B.moment-kind": { fam: "B", mouth: "patch", fix: "abhi EK tool: legal moment declare karo (pehle_guess · check_q · widget_gate · jirah · sharp_check) — text mein kuch nahi jodna" },
  "B.askuser": { fam: "B", mouth: "count", fix: "AskUserQuestion nahi — ek sawaal text mein, woh khud type karega" },
  "B.whole-read": { fam: "B", mouth: "count", fix: "poori file mat padho (REFERENCE / SAMJHAO_MERGED / VISUAL_CONTRACT / forge SKILL / scripts / memory) — digest jo section bataye, sirf wahi, offset+limit se" },
  "B.tools": { fam: "B", mouth: "count", fix: "mid-concept system / tool kaam nahi — park it: ek line, phir micro-question wapas" },
  "B.judge-once": { fam: "B", mouth: "count", fix: "judge_round ek sitting mein EK hi baar" },
  // forks row 276 (1)(d), his word #22 ("pictures first then text, combine them both"): B.widget's ABSENCE case — a new
  // idea taught at step 3 with no picture in its turn — is a patch (one show_widget call cures it); its PRESENCE cases
  // (the widget's style, more than 12 in a session) narrow to count at their red sites and carry WIDGET_STYLE_FIX
  "B.widget": { fam: "B", mouth: "patch", fix: "abhi EK tool: mcp__visualize__show_widget — is naye idea ki PICTURE (pehle picture, phir text, dono); text mein kuch nahi jodna" },
  "D.digest-first": { fam: "D", mouth: "patch", fix: "abhi chalao: node scripts/learn_digest.mjs — text mein kuch nahi jodna, jab tak uski screen tumhara sawaal na badle" },
  "D.sitting-first": { fam: "D", mouth: "patch", fix: "abhi kholo: node scripts/sitting.mjs open --surface code --no-spawn --task \"<concept> axis <x>\" — text mein kuch nahi jodna" },
  "D.start-once": { fam: "D", mouth: "count", fix: "forge_session start dobara nahi, --force kabhi nahi — khuli session RESUME karo (pointer se)" },
  "D.digest-whole": { fam: "D", mouth: "patch", fix: "abhi digest POORA chalao: node scripts/learn_digest.mjs (head / tail / Select-Object ke bina) — text mein kuch nahi jodna" },
  "D.first-screen": { fam: "D", mouth: "count", fix: "pehli screen: ≤ 6 lines (resume ke baad 3 lines + pointer ka sawaal), koi STALE / drift / resumed / missed / health nahi" },
  "D.pacer": { fam: "D", mouth: "patch", fix: "abhi pacer chalao: node scripts/forge_session.mjs resume — kuch mat jodo, jab tak uski line tumhara sawaal na badle" },
  "D.unbound": { fam: "D", mouth: "patch", fix: "(the unbound nudge — its line is study_scope.unboundLine)" },
});
export const MOUTHS = Object.freeze(["patch", "count"]);
// THE PATCH OPENER (row 272 (1)) — the first line of every block; it never says REWRITE and never asks for the turn again
export const PATCH_OPENER = "PATCH — tumhara jawab uski screen par hai aur rahega; kuch bhi dobara mat bhejo; sirf yeh jodo (≤ 3 lines):";

// DRIFT RANK — the order the fix lines print in. Until P4's judge ranking lands this is P0's own
// measured order on his last five Desktop sessions (text lost above a tool 14/35 · neev-pehle and
// one-idea 2.86 per 10 turns · bank 6 of 7 missed · too-Hindi 12/35 · position), then the rest in
// catalogue order. A measured order, not a preference; P4 replaces it with the judge's.
export const RANK = Object.freeze(["D.unbound", "D.digest-first", "D.sitting-first", "A.text-last", "B.bank", "B.tools", "A.one-question", "A.new-terms", "A.neev-pehle",
  "A.too-hindi", "A.question-last", "A.gut-by-moment", "A.gut-trio", "B.moment", "A.confusion-literal", "A.position", "A.count-form", "A.codes-at-him"]);
const rankOf = (id) => { const i = RANK.indexOf(id); return i >= 0 ? i : RANK.length + Object.keys(CHECKS).indexOf(id); };
// B.widget's presence cases carry their own fix line (the catalogue's is the absence's add-shaped one, row 276 (1)(d))
// forks row 305 (24 Sep 2026): the test-moment presence case's own fix line, verbatim from the ruling
export const TEST_MOMENT_FIX = "test moment: sawaal seedha, picture nahi";
export const WIDGET_STYLE_FIX = "widget: Lexend 400/500, max-width 34em, stepper = peeche / aage / shuru se + arrow keys, koi autoplay nahi, answer tiles nahi";
export const MAX_FIX_LINES = 6;

// ── TEXT HELPERS (pure) ────────────────────────────────────────────────────────
const FENCE = /```[\s\S]*?```/g;
const noFences = (t) => String(t || "").replace(FENCE, "\n");
const QUOTED = /"[^"\n]{0,400}"|\u201c[^\u201d\n]{0,400}\u201d/g;
/** Prose for counting: fences out, inline code → a word, quoted spans → a word, blockquote lines out. */
export function prose(text, { keepQuotes = false } = {}) {
  let t = noFences(text).replace(/`[^`\n]*`/g, " TERM ");
  if (!keepQuotes) t = t.replace(QUOTED, " QUOTE ");
  return t.split("\n").map((l) => (/^\s*>/.test(l) ? "" : l)).join("\n");   // blanked, not dropped: line numbers stay aligned
}
const lines = (t) => String(t || "").split("\n");
const paragraphs = (t) => noFences(t).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const words = (s) => String(s || "").toLowerCase().replace(/[*_`~#>()[\]"'“”.,!?:;—–]/g, " ").split(/\s+/).filter(Boolean);

/** R2 (a): question SENTENCES addressed to him; an answer-set restatement ("haan ya nahi?", "(1) ya (2)?",
 *  "pakka, shayad ya pata nahi?" — ≤ 5 words joined by ya / or / slash) is part of the question it restates. */
export function questionSentences(text) {
  const out = [];
  lines(prose(text)).forEach((line, li) => {
    for (const s of line.split(/(?<=[?!.])\s+/)) {
      const t = s.trim();
      if (!/\?[*_)\]"'\u201d]*$/.test(t)) continue;
      const w = words(t);
      const option = w.length <= 5 && (w.includes("ya") || w.includes("or") || /\//.test(t));
      out.push({ text: t, line: li, option });
    }
  });
  return out;
}
export function questionCount(text) {
  const q = questionSentences(text);
  const main = q.filter((x) => !x.option).length;
  return main > 0 ? main : q.length > 0 ? 1 : 0;
}
export const TRIO_RX = /pakka[\s\S]{0,40}shayad[\s\S]{0,40}pata\s+nahi/i;
const ENGLISH_TRIO = /\bknew\b[\s\S]{0,30}\bshaky\b|\bshaky\b[\s\S]{0,30}\bguessed\b/i;
const GUT_ASK = /\bgut[\s-]*word\b/i;
const SKELETON_LINE = /_{3,}|\.\.\.\s*$|…\s*$/;

/** R2 (b): the lines that follow the LAST question sentence (0 or 1 allowed; the one must be the trio or a skeleton). */
export function afterLastQuestion(text) {
  const ls = lines(noFences(text));
  const pl = lines(prose(text));
  let last = -1;
  pl.forEach((l, i) => { if (/\?[*_)\]"'\u201d]*\s*$/.test(l.trim()) || /\?[*_)\]"'\u201d]*\s/.test(l)) last = i; });
  if (last < 0) return null;
  const tail = [];
  const lastLine = pl[last];
  const qEnd = lastLine.lastIndexOf("?");
  const rest = ls[last] !== undefined ? pl[last].slice(qEnd + 1).replace(/^[*_)\]"'\u201d]+/, "").trim() : "";
  if (rest) tail.push(rest);
  for (let i = last + 1; i < ls.length; i++) if (ls[i].trim()) tail.push(ls[i].trim());
  return tail;
}

// R4 — the name lane. A backticked string is a NAME unless it is a token EXAMPLE (a substring of a longer
// word or quoted string in the same message: `un` `believ` `able` from "unbelievable") or a CODE (an id or a command).
const ID_RX = /^(?=[^\s]*[a-z])(?=[^\s]*\d)[a-z0-9_-]{8,}$/i;
// visual:R69 — a backtick holds a TERM: ≤ 3 words, no "/", no file extension; anything else is code at him
const CODE_RX = /[(){}=<>;\\/]|\.[a-z]{1,5}$|\.m?js\b|\.json\b|^node\s|^npm\s|^git\s|--[a-z]|^(\S+\s+){3,}\S+$/i;
const BARE_ID_RX = /\b(act|rul|row|sit|cap)-[a-z0-9]{6,}\b/i;
export function backticked(text) {
  const t = noFences(text);
  return [...t.matchAll(/`([^`\n]+)`/g)].map((m) => m[1].trim()).filter(Boolean);
}
export function tokenExample(term, text) {
  const low = String(term).toLowerCase();
  if (low.length > 12 || /\s/.test(low)) return false;
  const esc = low.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rest = noFences(text).replace(/`[^`\n]*`/g, " ").toLowerCase();
  // a PIECE of a longer word — never the word itself inflected ("merges" does not make `merge` a token piece)
  for (const m of rest.matchAll(new RegExp(`[a-z0-9]*${esc}[a-z0-9]*`, "g"))) {
    const w = m[0];
    if (w === low) continue;
    if (w.startsWith(low) && /^(s|es|d|ed|ing|er|ers)$/.test(w.slice(low.length))) continue;
    return true;
  }
  return false;
}
export const isCode = (term) => ID_RX.test(term) || CODE_RX.test(term);
/** R4 (i): the colon form OPENS — "`X`: …", "- X: …", "`X` — …" on the line of the first use; plus the audit's own opening forms. */
export function opensInMessage(text, term) {
  const esc = String(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const colon = new RegExp(`(\`${esc}\`|^\\s*[-*]\\s+\\**${esc}\\**)\\s*(:|—|–|-\\s)`, "im");
  return colon.test(noFences(text)) || opensTerm(text, term);
}

// R6 — TOO-HINDI: a table that only grows (removals need his word). Seed from R6 + the 35 Desktop turns.
export const TOO_HINDI = Object.freeze({
  akshar: "character / letter", shabd: "word", shabdon: "words", niyam: "rule", sira: "end", sire: "ends", siron: "ends",
  shabdkosh: "vocabulary", bhram: "hallucination", antargat: "embedding", nishkarsh: "inference",
});
/** R6 exemptions: inside quotes · after "jaise" in the same sentence · a ```diff minus line · a blockquote of HIS words. */
export function tooHindiHits(text) {
  const hits = [];
  if (/[\u0900-\u097F]/.test(prose(text))) hits.push("Devanagari script");
  for (const line of lines(prose(text))) {
    for (const sent of line.split(/(?<=[?!.])\s+/)) {
      const cut = sent.search(/\bjaise\b/i);
      const scan = cut >= 0 ? sent.slice(0, cut) : sent;
      for (const w of words(scan)) if (Object.prototype.hasOwnProperty.call(TOO_HINDI, w)) hits.push(w);
    }
  }
  return [...new Set(hits)];
}
const TUM_RX = /\b(tu|tera|teri|tere|tujhe|tujhko|tujhse)\b/i;
const HIS_LEVEL_RX = /\b(dormant|you already know|you already understand|as you know|obviously|of course you|this should be easy|trivially|needless to say|goes without saying|you'll recall|you'?re not at zero|already (an )?(expert|pro))\b|tumhe\s+(toh\s+)?pata\s+hi\s+hai|tum\s+(toh\s+)?(already\s+)?jaante\s+hi\s+ho|yeh\s+toh\s+tumhe\s+aata\s+hai|tumhe\s+yaad\s+hi\s+hoga|\byaad\s+hoga\b|pehle\s+se\s+pata|tujhe\s+aata\s+hai|zero\s+pe\s+nahi/i;
// visual:R23-R25 — no points economy, no latency figure, no organism health on a study screen ("RED" only in capitals)
const GAMIFY_RX = /\b(XP|streaks?|badges?|level[\s-]?up|drift|selftest|daemon|watchman|organism\s+health)\b|\b\d+(\.\d+)?\s*(ms|milliseconds?|seconds?|secs?)\b/i;
const RED_WORD = /\bRED\b/;
const EMOJI_OK = new Set(["✅", "❌", "⚠", "⭐"]);
const EMOJI_RX = /\p{Extended_Pictographic}/gu;
const EMOJI_ONE = /\p{Extended_Pictographic}/u;   // no /g: .test on a global regex carries lastIndex between calls
const MARKDOWN_BAD = [/<\/?(div|span|br|kbd|sup|sub|details|summary|img|p|table|font|b|i|u|mark)\b[^>]*>/i, /\[\^[^\]]+\]/, /^\s*[-*]\s+\[[ xX]\]/m, /```(mermaid|log)\b/i, /\\(color|textcolor)\{/, /\$\$/, /data:image\//i,
  /!\[[^\]]*\]\(/, /(^|[^!])\[[^\]\n]+\]\([^)\n]+\)/, /==[^=\n]+==/, /(^|[^*\w])\*[^*\s][^*\n]*[^*\s]\*(?!\*)/m];
const HYPE_RX = /\b(great job|amazing|awesome|zabardast|shabash|shandaar|fantastic|brilliant|well done|badhiya|superb|you'?re doing great)\b/i;
const MEDICAL_RX = /\b(dose|dosage|medication|medicine|dawai|dawa|diagnos\w*|prescri\w*|\d+\s*mg)\b/i;
const ASK_WHERE_RX = /\b(kahaa?n\s+the|where\s+were\s+we|kahaa?n\s+tak\s+pahunche|kya\s+padha\s+tha|where\s+did\s+we\s+(stop|leave\s+off)|paste\s+(karo|kar\s+do|kijiye)|paste\s+(it|this|the\s+file)\s+here)\b/i;
const BLAME_RX = /\btumne\s+(pichli\s+baar\s+)?(yeh\s+)?galat\b|\bpichli\s+baar\s+galat\b|\btumhari\s+galti\b|\byou\s+(were\s+wrong|thought\s+last\s+time)\b|\byour\s+mistake\b/i;
const GRILL_RX = /\b(reinvent|from\s+scratch|scratch\s+se|grill)\b/i;
const URGENCY_RX = /\b(time\s+kam\s+hai|jaldi\s+karo|jaldi\s+se\s+khatam|hurry|deadline|kal\s+tak|aaj\s+itna\s+hi|one\s+axis\s+per\s+day)\b/i;
const TOY_DATA_RX = /\b(hello\s+world|foo|lorem\s+ipsum|alice|bob)\b/i;
const REPEAT_RX = /\b(repeat\s+karo|dohraa?o|yeh\s+line\s+bolo|repeat\s+after\s+me|say\s+after\s+me)\b/i;
const BUYING_PROMPT = /\b(buy|buying|kharid\w*|khareed\w*|price|laptop|headphones?|earbuds|monitor|keyboard|amazon|flipkart)\b/i;
const PRICE_OR_LINK = /₹\s?\d|\bRs\.?\s?\d|\$\s?\d|https?:\/\//i;
const LOSS_WORDS = /\b(STALE|drift|resumed\s+\d|skipped|missed|health)\b|🔴/;
const GUT_TO_FLAG = { pakka: "knew", shayad: "shaky", "pata nahi": "guessed", knew: "knew", shaky: "shaky", guessed: "guessed" };
const normWords = (s) => String(s || "").toLowerCase().replace(/\\["']/g, "").replace(/[^a-z0-9ऀ-ॿ₹]+/g, " ").trim();
const argOf = (cmd, flag) => { const m = new RegExp(`${flag}\\s+(?:"((?:[^"\\\\]|\\\\.)*)"|'([^']*)'|(\\S+))`).exec(cmd); return m ? (m[1] ?? m[2] ?? m[3]) : null; };
const HEX_SWATCH = /(^|\s)#[0-9a-f]{6}\b/i;

// ── THE TRANSCRIPT — this turn, the one before it, and the session so far ─────────
function readTail(path, max = TRANSCRIPT_MAX) {
  const size = statSync(path).size; const span = Math.min(size, max);
  const fd = openSync(path, "r");
  try { const buf = Buffer.alloc(span); readSync(fd, buf, 0, span, size - span); return buf.toString("utf8"); } finally { closeSync(fd); }
}
/** Parse a transcript (text) into prompts and ordered assistant blocks. Torn lines are skipped. */
// The Stop-hook block message, as Claude Code writes it into the transcript: a META user row whose text opens
// "Stop hook feedback:" (measured on edc4eb0d / 0bd91c84, 23 Sep 2026). The second pass's turn begins after it.
const HOOK_FEEDBACK = /^\s*Stop hook feedback\b/i;
const metaText = (o) => { const c = o && o.message && o.message.content; return typeof c === "string" ? c : Array.isArray(c) ? c.filter((b) => b && b.type === "text").map((b) => b.text).join("\n") : ""; };
export function parseTranscript(raw) {
  const prompts = []; const blocks = []; const hooks = []; const feedbacks = [];
  let seq = 0;
  for (const l of String(raw || "").split("\n")) {
    if (!l || l[0] !== "{") continue;
    if (!/"type":"(user|assistant|attachment)"/.test(l)) continue;
    let o; try { o = JSON.parse(l); } catch { continue; }
    seq++;
    if (o.type === "user") {
      const t = humanText(o);
      if (t !== null && !/^\s*<(local-command|command-name>\/(clear|model|effort|compact))/.test(t)) prompts.push({ seq, text: t, ts: o.timestamp || null });
      else if (o.isMeta && HOOK_FEEDBACK.test(metaText(o))) feedbacks.push({ seq });
      continue;
    }
    if (o.type === "attachment") {
      const a = o.attachment || {};
      if (a.hookEvent === "UserPromptSubmit") hooks.push({ seq, text: `${a.content || ""}\n${a.stdout || ""}` });
      continue;
    }
    const c = o.message && o.message.content;
    if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (!b) continue;
      if (b.type === "text" && String(b.text || "").trim()) blocks.push({ seq, kind: "text", text: b.text });
      else if (b.type === "tool_use") blocks.push({ seq, kind: "tool", name: b.name, input: b.input || {} });
    }
  }
  return { prompts, blocks, hooks, feedbacks };
}
/** Split into { prompt, turn, prevTurn, before, hookText }. */
export function turnsOf(parsed, { afterFeedback = false } = {}) {
  const P = parsed.prompts;
  const last = P.length ? P[P.length - 1] : null;
  const prev = P.length > 1 ? P[P.length - 2] : null;
  const after = (s) => parsed.blocks.filter((b) => b.seq > s);
  // forks row 272 (3): on the second pass the turn BEGINS at the block message — the reply above it is already on
  // his screen and was judged by the first pass; judging it again read a phantom A.text-last on 8 of 10 second passes
  const fb = afterFeedback && last ? (parsed.feedbacks || []).filter((f) => f.seq > last.seq).pop() : null;
  const turn = last ? after(fb ? fb.seq : last.seq) : parsed.blocks.slice();
  const prevTurn = last && prev ? parsed.blocks.filter((b) => b.seq > prev.seq && b.seq < last.seq) : [];
  // forks row 305 (24 Sep 2026): the turn TWO back (between the prompt before his previous one and it) — the dodge
  // reading needs it; empty when the read tail holds no earlier prompt
  const prev2 = P.length > 2 ? P[P.length - 3] : null;
  const prev2Turn = prev && prev2 ? parsed.blocks.filter((b) => b.seq > prev2.seq && b.seq < prev.seq) : [];
  const before = last ? parsed.blocks.filter((b) => b.seq < last.seq) : [];
  const hookText = last ? parsed.hooks.filter((h) => h.seq > last.seq).map((h) => h.text).join("\n") : "";
  const f0 = P.length ? P[0].seq : 0, f1 = P.length > 1 ? P[1].seq : Infinity;
  const firstTurn = parsed.blocks.filter((b) => b.seq > f0 && b.seq < f1);
  return { prompt: last ? last.text : "", prompts: P.map((p) => p.text), turn, prevTurn, prev2Turn, before, all: parsed.blocks, firstTurn, hookText };
}

// ── TOOL-CALL READERS ────────────────────────────────────────────────────────────
const cmdOf = (b) => (b && b.kind === "tool" && b.input && typeof b.input.command === "string" ? b.input.command : "");
const shell = (b) => b.kind === "tool" && /^(Bash|PowerShell)$/.test(b.name);
export function momentsOf(turn) {
  const out = [];
  for (const b of turn) if (shell(b)) for (const m of cmdOf(b).matchAll(/forge_session\.mjs["']?\s+moment\s+([A-Za-z_-]+)/g)) out.push(m[1]);
  return out;
}
const ran = (turn, rx) => turn.some((b) => shell(b) && rx.test(cmdOf(b)));
const VOICE_REP = /gaffer_brain\.mjs["']?\s+capture\s+voice_rep\b/i;
// The fence: forge_session's own MOMENTS (the pacer owns the kinds; a copy here keeps the Stop hook from loading the
// pacer — importing it would also make its turn_hook SHIM a silent no-op). The selftest asserts the two are equal.
// FIVE since forks row 266 (sharp_check).
export const MOMENT_KINDS = Object.freeze(["pehle_guess", "check_q", "widget_gate", "jirah", "sharp_check"]);

// THE STUDY SET (G3's allowed set, read after the fact for the tools no PreToolUse rail sees). ONE home since P2
// concern 2: study_scope.mjs (ALLOWED_CMD, the unsafe-shell fence, the canon-read paths — shellInStudySet), which
// G3's rails read at PreToolUse; the Read / Grep / Glob half below stays here (the rails' matcher never sees them,
// row 264 (4)).
const FORGE_SKILL = /forge[\\/]SKILL\.md$/i;
const WHOLE_READ_NAMED = /(REFERENCE\.md|SAMJHAO_MERGED__2026-08-30\.md|VISUAL_CONTRACT\.md|forge[\\/]SKILL\.md)$/i;
const FREE_TOOLS = /^(ToolSearch|TodoWrite|Skill|mcp__visualize__read_me|mcp__visualize__show_widget)$|bank_answer|judge_round/;
/** Every tool call of the turn outside the study set, and every whole-file read of a named canon file. */
export function toolFindings(turn, { step = null } = {}) {
  const outside = []; const whole = [];
  for (const b of turn) {
    if (b.kind !== "tool") continue;
    const name = String(b.name || "");
    if (FREE_TOOLS.test(name)) continue;
    if (shell(b)) {
      const c = cmdOf(b);
      if (shellInStudySet(c)) continue;
      outside.push(`${name}: ${c.slice(0, 60)}`); continue;
    }
    if (name === "Read") {
      const p = String(b.input.file_path || "");
      // learn:R36 — on a step-3 SAMJHAO turn the digest + the hook are enough: no read of forge/SKILL.md at all
      if (NEVER_READ.test(p) || (WHOLE_READ_NAMED.test(p) && !(b.input.offset && b.input.limit)) || (step === 3 && FORGE_SKILL.test(p))) { whole.push(p.split(/[\\/]/).slice(-2).join("/")); continue; }
      if (CANON_READ_PATH.test(p)) continue;
      outside.push(`Read: ${p.split(/[\\/]/).slice(-2).join("/")}`); continue;
    }
    if (name === "Grep" || name === "Glob") {
      const p = String(b.input.path || b.input.pattern || "");
      if (CANON_READ_PATH.test(p) && !NEVER_READ.test(p)) continue;
      outside.push(`${name}: ${p.slice(0, 60)}`); continue;
    }
    outside.push(name);
  }
  return { outside, whole };
}
/** VISUAL_CONTRACT's checkable half on a show_widget call (the rest is the judge's). */
export function widgetFindings(turn) {
  const out = [];
  for (const b of turn) {
    if (b.kind !== "tool" || !/show_widget/.test(String(b.name))) continue;
    const code = String(b.input.widget_code || b.input.html || "");
    if (!/Lexend/.test(code)) out.push("font is not Lexend");
    if (!/max-width\s*:\s*(34em|62ch)/i.test(code)) out.push("no max-width: 34em");
    if (/\bautoplay\b|setInterval\s*\(/i.test(code)) out.push("autoplay / setInterval");
    const stepper = /\baage\b|\bnext\b/i.test(code) && /<button/i.test(code);
    if (stepper && !(/\bpeeche\b/i.test(code) && /\baage\b/i.test(code) && /shuru\s+se/i.test(code) && /ArrowLeft/.test(code) && /ArrowRight/.test(code))) out.push("a stepper without peeche / aage / shuru se + arrow keys");
    if (stepper && !/disabled/.test(code)) out.push("end controls not disabled (disabled, never hidden)");
    if (/type\s*=\s*["']?(radio|checkbox)|<select\b/i.test(code)) out.push("answer inputs (tap-to-answer)");
    if (/\b(XP|streaks?|badges?|points)\b/.test(code)) out.push("a points economy");
  }
  return out;
}

// ── THE DECISION — pure: everything it reads is passed in ────────────────────────
/**
 * @param {object} o
 * @param {object} o.payload   the Stop payload
 * @param {object|null} o.sitting  sitting.json
 * @param {object|null} o.forge    forge_session.json
 * @param {string|null} o.transcript the transcript's raw text (null = unreadable)
 * @param {Array} o.logRows   this gate's own earlier rows (for once-per-session blocks)
 * @param {object} o.env
 */
export function decide({ payload = {}, sitting = null, forge = null, transcript = null, logRows = [], env = {}, unbound = null } = {}) {
  const allow = (why, extra = {}) => ({ decision: "allow", why, reds: [], ...extra });
  if (String(env.ARSENAL_ORGAN || "") === "1") return allow("headless organ", { scope: "organ" });
  const scope = studyScope({ payload, sitting, env });
  const sid = String(payload.session_id || "");
  const mine = (logRows || []).filter((r) => r && r.session === sid);
  const secondPass = payload.stop_hook_active === true;
  if (!scope.study || scope.legacy) {
    // OUTSIDE SCOPE — the one job: the unbound nudge, ONCE per session (row 256 (1)(c)).
    const v = unbound || { line: null };
    if (!v.line || secondPass) return allow(scope.legacy ? "transition scope (pre-G0 sitting) — never gated" : "not the study session", { scope: "out", quiet: true });
    if (mine.some((r) => r.nudged)) return allow("unbound nudge already given in this session", { scope: "out", quiet: true });
    return { decision: "block", scope: "out", nudged: true, reds: ["D.unbound"], reason: `${PATCH_OPENER}\n  · D.unbound: yeh tools abhi chalao, text mein kuch nahi jodna — ${v.line}` };
  }
  if (transcript === null) return allow("in scope, transcript unreadable — fail open", { scope: "study", error: "transcript unreadable" });
  const T = turnsOf(parseTranscript(transcript), { afterFeedback: secondPass });
  const finalText = String(payload.last_assistant_message || "").trim() || (T.turn.filter((b) => b.kind === "text").pop() || { text: "" }).text;
  const prevMoments = momentsOf(T.prevTurn);
  const cls = classifyPrompt(T.prompt, { prevMoments });
  const moments = momentsOf(T.turn);
  const moment = moments.length ? moments[moments.length - 1] : null;
  const reds = []; const why = {}; const mouthOf = {}; const fixOf = {}; const mechanical = new Set();
  // a red site may name a narrower mouth for one case of its id (row 272 (2)); otherwise the catalogue's. A site that
  // narrows may also carry its case's own fix line (row 276 (1)(d)); otherwise the catalogue's.
  const red = (id, detail, mouth = null, fix = null) => { if (!reds.includes(id)) { reds.push(id); why[id] = detail; mouthOf[id] = mouth || (CHECKS[id] && CHECKS[id].mouth) || "count"; if (fix) fixOf[id] = fix; } };
  const fixLine = (id) => fixOf[id] || (CHECKS[id] ? CHECKS[id].fix : id);

  // ── MECHANICAL — on every study turn, system talk included ──
  const turnBlocks = T.turn.slice();
  const lastText = [...turnBlocks].reverse().findIndex((b) => b.kind === "text");
  const lastTextIdx = lastText < 0 ? -1 : turnBlocks.length - 1 - lastText;
  const textAbove = turnBlocks.some((b, i) => b.kind === "text" && turnBlocks.slice(i + 1).some((x) => x.kind === "tool") && !(i === lastTextIdx && String(b.text).trim() === finalText));
  // forks row 275 (2): the MOUTH is decided by what stands AFTER the last tool call. PATCH iff the lesson vanished —
  // the turn does not end on text, or the text after the last tool is shorter in words than the text above the tools
  // (the 22 Sep shape). COUNT when the lesson stands on his screen and only a line above a tool was lost (5dc8436e
  // turn 3, 24 Sep: a patch there re-sent a sentence he had already read — the double his word #20 banned).
  // The payload's last_assistant_message is the reply on his screen: when the transcript has not caught up with it,
  // it still stands after the last tool.
  if (textAbove) {
    const lastToolIdx = turnBlocks.map((b) => b.kind).lastIndexOf("tool");
    const wordsIn = (t) => String(t).split(/\s+/).filter(Boolean).length;
    const aboveTexts = turnBlocks.slice(0, lastToolIdx).filter((b) => b.kind === "text").map((b) => String(b.text).trim());
    const postTexts = turnBlocks.slice(lastToolIdx + 1).filter((b) => b.kind === "text").map((b) => String(b.text).trim());
    if (finalText && !postTexts.includes(finalText) && !aboveTexts.includes(finalText)) postTexts.push(finalText);
    const postWords = postTexts.reduce((n, t) => n + wordsIn(t), 0), aboveWords = aboveTexts.reduce((n, t) => n + wordsIn(t), 0);
    const vanished = !postTexts.length || postWords < aboveWords;
    red("A.text-last", vanished ? `a text block sits above a tool call and the lesson did not stand after the last tool (${postWords} words after, ${aboveWords} above)`
      : `a text block sits above a tool call; the lesson stands after the last tool (${postWords} words after, ${aboveWords} above) — counted, never patched (row 275)`, vanished ? "patch" : "count");
    mechanical.add("A.text-last");
  }
  const tf = toolFindings(T.turn, { step: forge && Number.isInteger(forge.step) ? forge.step : null });
  if (T.turn.some((b) => b.kind === "tool" && b.name === "AskUserQuestion")) red("B.askuser", "AskUserQuestion was called");
  // forks row 267: his prompt is a CLOSING (/full-time, "post match") → the close organs run; B.tools stands down, as G3 does
  if (tf.outside.length && !cls.closing) red("B.tools", tf.outside.slice(0, 3).join(" · "));
  if (tf.whole.length) red("B.whole-read", tf.whole.slice(0, 3).join(" · "));

  const d = { secondPass, cls: cls.kind, moment, prevMoments };
  if (cls.kind !== "system") {
    // ── A · the message ──
    const text = finalText;
    const qn = questionCount(text);
    const teaching = qn > 0 || !!moment;
    if (countTables(text) >= 1) red("A.table", `${countTables(text)} table(s)`);
    const pr = noFences(text);
    const heads = (pr.match(/^#{1,6}\s+\S/gm) || []).length, rules = (pr.match(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/gm) || []).length;
    if (heads + rules > 1) red("A.sections", `${heads} heading(s) + ${rules} rule(s)`);
    if (qn > 1) red("A.one-question", `${qn} question sentences: ${questionSentences(text).filter((x) => !x.option).map((x) => x.text.slice(0, 40)).join(" | ")}`);
    const tail = afterLastQuestion(text);
    if (tail) {
      const gutAllowed = GUT_BEARING_MOMENTS.includes(moment);
      const okTail = tail.length === 0 || (tail.length === 1 && ((gutAllowed && TRIO_RX.test(tail[0])) || SKELETON_LINE.test(tail[0])));
      if (!okTail) red("A.question-last", `${tail.length} line(s) after the last question: "${tail.join(" / ").slice(0, 80)}"`);
    }
    const hasTrio = TRIO_RX.test(text), gutAsk = GUT_ASK.test(prose(text, { keepQuotes: false }));
    // the trio rides pehle_guess, the sharp check and jirah (row 254 (3)(b) as narrowed by forks row 268)
    if (GUT_BEARING_MOMENTS.includes(moment) && !hasTrio) red("A.gut-by-moment", `moment ${moment} needs the trio pakka / shayad / pata nahi as the last line`);
    if (moment === "check_q" && (hasTrio || gutAsk)) red("A.gut-by-moment", "moment check_q forbids the gut-word ask", "count");   // the ask is already on his screen
    if (moment === "check_q" && !(/samajh\s+aaya/i.test(text) && /haan\s+ya\s+na(hi)?/i.test(text))) red("A.gut-by-moment", "a check_q question ends \"samajh aaya — haan ya nahi\"");
    if ((gutAsk && !hasTrio) || ENGLISH_TRIO.test(prose(text))) red("A.gut-trio", "a gut-word ask that does not name pakka / shayad / pata nahi");
    // the name lane (R4 + learn:R21)
    const seen = new Set();
    for (const b of T.before) if (b.kind === "text") for (const n of backticked(b.text)) seen.add(n.toLowerCase());
    const names = [...new Set(backticked(text))];
    const codes = names.filter((n) => isCode(n));
    if (codes.length || BARE_ID_RX.test(prose(text))) red("A.codes-at-him", codes.slice(0, 3).map((c) => `\`${c}\``).join(" ") || String(prose(text).match(BARE_ID_RX)[0]));
    const realNames = names.filter((n) => !isCode(n) && !tokenExample(n, text));
    const fresh = realNames.filter((n) => !seen.has(n.toLowerCase()));
    if (fresh.length > 1) red("A.new-terms", `${fresh.length} new names: ${fresh.slice(0, 4).join(", ")}`);
    const unopened = fresh.filter((n) => !opensInMessage(text, n));
    if (unopened.length) red("A.neev-pehle", `unopened: ${unopened.slice(0, 3).join(", ")}`);
    if (realNames.length > 3) red("A.backticks", `${realNames.length} distinct backticked names`);
    else if (paragraphs(text).some((p) => new Set(backticked(p).filter((n) => !isCode(n) && !tokenExample(n, text))).size > 1)) red("A.backticks", "more than one backticked name in a paragraph");
    // position + count
    if (teaching && !namedPosition(text)) red("A.position", "no position line by name");
    const cf = countForm(text); if (cf) red("A.count-form", cf.match);
    // the surface grammar
    const emo = [...String(text).matchAll(EMOJI_RX)].map((m) => m[0]);
    if (emo.some((e) => !EMOJI_OK.has(e)) || emo.length > 2 || lines(text).some((l) => (l.match(EMOJI_RX) || []).length > 1)) red("A.emoji", `emoji: ${emo.join(" ")}`);
    if (emo.length && (new Set(emo).size < emo.length || lines(text).some((l, i, L) => i > 0 && EMOJI_ONE.test(l.trim().slice(0, 2)) && EMOJI_ONE.test(String(L[i - 1]).trim().slice(0, 2))))) red("A.emoji", "an emoji repeated or used as a bullet");
    const bolds = paragraphs(text).map((p) => p.match(/\*\*[^*\n]+\*\*/g) || []);
    if (bolds.some((b) => b.length > 1)) red("A.bold", "two bold spans in one paragraph");
    else if (bolds.flat().some((b) => !/[›>→»]/.test(b) && b.replace(/\*/g, "").trim().split(/\s+/).length > 2)) red("A.bold", "a bold span longer than two words");
    const diffs = [...String(text).matchAll(/```diff\n([\s\S]*?)```/g)];
    const diffBad = diffs.some((m) => { const L = m[1].split("\n").filter((x) => x.trim()); return L.length > 4 || L.some((x) => !/^[+-]/.test(x) || /^(---|\+\+\+)\s/.test(x) || /^[+-]\s*[-*•]\s/.test(x)); });
    const proseBeside = noFences(text).replace(/\s+/g, " ").trim().length >= 20;
    if (diffs.length > 1 || diffBad || (diffs.length && !proseBeside) || (diffs.length && !cls.answer && cls.kind !== "confusion")) red("A.diff", `${diffs.length} diff fence(s)${diffs.length && !cls.answer && cls.kind !== "confusion" ? " with no answer of his to correct" : ""}`);
    // forks row 264 (2) — learn:R60 stands, his 7 Sep word "both": on a reply to HIS answer, a wrong marked ❌
    // is a correction, and a correction rides a ```diff — the closed four go ALONGSIDE it, never INSTEAD of it.
    // A ✅ alone confirms, it corrects nothing; a ❌ in teaching prose with no answer of his is not a correction.
    if (cls.answer && !diffs.length && lines(noFences(text)).some((l) => l.includes("❌"))) red("A.emoji-diff", "a correction carried by ❌ with no ```diff block");
    const bq = pr.split(/\n\s*\n/).filter((p) => /^\s*>/m.test(p));
    const hisWords = normWords(T.prompts.join(" \n "));
    const bqNotHis = bq.some((p) => { const w = normWords(p.replace(/^\s*>\s?/gm, "")); return w && !hisWords.includes(w); });
    if (bq.length > 1 || bq.some((p) => /\?/.test(p) && qn <= 1 && questionSentences(text).length === 0) || bq.some((p) => /`[^`]+`|⭐/.test(p)) || bqNotHis) red("A.blockquote", `${bq.length} blockquote(s)${bqNotHis ? " — not his own words played back" : ""}`);
    if (TUM_RX.test(prose(text))) red("A.tum", String(prose(text).match(TUM_RX)[0]));
    const hi = tooHindiHits(text);
    if (hi.length) red("A.too-hindi", hi.map((w) => TOO_HINDI[w] ? `${w} → ${TOO_HINDI[w]}` : w).join(" · "));
    if (teaching && hindiMarkerCount(prose(text)) === 0 && prose(text).replace(/\s+/g, " ").length > 300) red("A.too-english", "no Hindi glue in a teaching message");
    if (GAMIFY_RX.test(prose(text)) || RED_WORD.test(prose(text))) red("A.gamify", String((prose(text).match(GAMIFY_RX) || prose(text).match(RED_WORD))[0]));
    const P_ = prose(text);
    if (HYPE_RX.test(P_)) red("A.hype", P_.match(HYPE_RX)[0]);
    if (MEDICAL_RX.test(P_) && !/doctor/i.test(text)) red("A.medical", P_.match(MEDICAL_RX)[0]);
    if (ASK_WHERE_RX.test(P_)) red("A.ask-where", P_.match(ASK_WHERE_RX)[0]);
    if (BLAME_RX.test(P_)) red("A.blame", P_.match(BLAME_RX)[0]);
    if (["check_q", "pehle_guess", "widget_gate"].includes(moment) && GRILL_RX.test(P_)) red("A.no-grill", `${P_.match(GRILL_RX)[0]} on a ${moment} turn`);
    if (URGENCY_RX.test(P_)) red("A.urgency", P_.match(URGENCY_RX)[0]);
    if (TOY_DATA_RX.test(String(text).replace(/`[^`\n]*`/g, " "))) red("A.his-data", String(text).match(TOY_DATA_RX)[0]);
    if (REPEAT_RX.test(P_)) red("A.repeat-line", P_.match(REPEAT_RX)[0]);
    const dashes = (s) => (String(s).match(/—/g) || []).length;
    if (dashes(noFences(text)) > 4 || paragraphs(text).some((p) => dashes(p) > 2)) red("A.emdash", `${dashes(noFences(text))} em-dashes`);
    const textFences = [...String(text).matchAll(/```text\n([\s\S]*?)```/g)];
    const earlierFences = T.before.filter((b) => b.kind === "text" && /```text\n/.test(b.text)).length;
    if (textFences.some((m) => hindiMarkerCount(m[1]) > 0) || (textFences.length && textFences.length + earlierFences > 1)) red("A.text-fence", textFences.length + earlierFences > 1 ? "a second ```text walk this session" : "Hinglish inside a ```text fence");
    if (BUYING_PROMPT.test(T.prompt) && PRICE_OR_LINK.test(text)) red("A.buying", "a price or a link on a buying topic");
    // the lesson checks that read the forge state: a closed axis re-taught, the intensity line at an axis close, the layers
    const lesson = !!(forge && forge.concept && !forge.closed_at);
    const posAxis = (/\baxis\s+([a-i])\b/i.exec(P_) || [])[1];
    if (lesson && posAxis && Array.isArray(forge.axes_done) && forge.axes_done.includes(posAxis.toLowerCase()) && posAxis.toLowerCase() !== String(forge.current_axis || "").toLowerCase()) red("A.closed-axis", `axis ${posAxis} is done`);
    if (ran(T.turn, /forge_session\.mjs["']?\s+axis\s+[a-i]\s+done\b/i) && !intensityCheck(text)) red("A.intensity", "an axis closed with no depth / breadth / interaction verdict");
    if (lesson && fresh.some((n) => opensInMessage(text, n)) && !technicalLine(text)) red("A.layers", "a name opened with no English technical line");
    if (MARKDOWN_BAD.some((rx) => rx.test(noFences(text))) || HEX_SWATCH.test(prose(text))) red("A.markdown", "forbidden markdown");
    if (HIS_LEVEL_RX.test(prose(text))) red("A.his-level", String(prose(text).match(HIS_LEVEL_RX)[0]));
    const listRuns = []; let run = null;
    for (const l of lines(noFences(text))) {
      const m = /^(\s*)([-*+]|\d+[.)])\s+/.exec(l);
      if (m) { const ind = m[1].length; if (run && run.ind === ind) run.n++; else { run = { ind, n: 1 }; listRuns.push(run); } }
      else if (l.trim() && !/^\s{2,}/.test(l)) run = null;
    }
    if (listRuns.some((r) => r.n > 4)) red("A.list-length", `a list level of ${Math.max(...listRuns.map((r) => r.n))} items`);
    // the ran-line (v2 §3 (a)): tools ran → the first line names one of them
    const ranTools = T.turn.filter((b) => b.kind === "tool" && !/^(ToolSearch|TodoWrite|Skill|mcp__visualize__read_me)$/.test(b.name));
    if (ranTools.length) {
      const first = (lines(text).find((l) => l.trim()) || "").toLowerCase();
      const said = ranTools.some((b) => {
        const c = cmdOf(b).toLowerCase(), n = String(b.name).toLowerCase();
        if (VOICE_REP.test(c)) return /bank/.test(first);
        if (/forge_session\.mjs["']?\s+pointer/.test(c)) return /pointer/.test(first);
        if (/forge_session\.mjs["']?\s+moment/.test(c)) return /moment|pointer|check|set/.test(first);
        if (/forge_session\.mjs["']?\s+(axis|step)/.test(c)) return /axis|step/.test(first);
        if (/learn_digest/.test(c)) return /digest/.test(first);
        if (/sitting\.mjs/.test(c)) return /sitting/.test(first);
        if (/show_widget/.test(n)) return /widget|tasveer|visual|picture|diagram/.test(first);
        return /\b(chala|chalaya|kiya|ran|set|padh|dekha|read)\b/.test(first);
      });
      if (!said) red("A.ran-line", `tools ran (${ranTools.map((b) => b.name).slice(0, 3).join(", ")}) and the first line does not name any`);
    }
    // confusion is literal (v2 §3 (f))
    if (cls.kind === "confusion") {
      const prevNames = new Set(T.prevTurn.filter((b) => b.kind === "text").flatMap((b) => backticked(b.text)).map((n) => n.toLowerCase()));
      if (fresh.length) red("A.confusion-literal", `a NEW name on his confusion: ${fresh[0]}`);
      else if (ran(T.turn, /forge_session\.mjs["']?\s+(step|axis)\s/i)) red("A.confusion-literal", "the step / axis moved on his confusion");
      else if (prevNames.size && !names.some((n) => prevNames.has(n.toLowerCase()))) red("A.confusion-literal", "the name he was confused by is not carried");
    }
    // ── B · the duties ──
    // THE BANK (forks row 264 (1)): forge row 53b STANDS — due at the axis's banked moments plus jirah, never
    // per idea. ONE predicate with the skeleton's [BANK] (study_scope.bankDueAt): a reply to the jirah or the
    // sharp check the last turn declared (both carry the trio, row 268). The Bolo and the interview line are owner-held
    // (forge_session `axis <x> done` refuses without them).
    const reps = T.turn.filter((b) => shell(b) && VOICE_REP.test(cmdOf(b)));
    const due = bankDueAt({ cls, prevMoments });
    if (due) {
      // forks row 305 (24 Sep 2026) — THE NON-ANSWER PATH, model-declared, never a word list: his reply to a declared
      // sharp_check / jirah with no voice_rep is NOT B.bank when this turn RE-DECLARES the same moment kind and carries
      // ONE question line (the bank is due on his next reply). The SECOND consecutive re-declare of that moment with no
      // bank between is the dodge: B.bank, counted. Neither → the patch, unchanged. The turn two back is turnsOf's.
      const dueKind = prevMoments.includes("jirah") ? "jirah" : "sharp_check";
      const redeclared = !reps.length && moments.includes(dueKind) && qn === 1;
      const prev2Moments = momentsOf(T.prev2Turn);
      const prevDue = T.prompts.length > 1 ? bankDueAt({ cls: classifyPrompt(T.prompts[T.prompts.length - 2], { prevMoments: prev2Moments }), prevMoments: prev2Moments }) : null;
      const prevKind = prev2Moments.includes("jirah") ? "jirah" : "sharp_check";
      const dodge = redeclared && !!prevDue && prevKind === dueKind && !T.prevTurn.some((b) => shell(b) && VOICE_REP.test(cmdOf(b)));
      if (dodge) red("B.bank", `his message ${due}, and this turn re-declared ${dueKind} a second time in a row with no bank between (the dodge, row 305)`, "count");
      else if (!reps.length && !redeclared) red("B.bank", `his message ${due} and no voice_rep ran`);
      const hook = /latency:\s*(\d+)\s*ms/.exec(T.hookText || "");
      if (reps.length && hook) {
        const got = /--latency_ms\s+["']?(\d+)/.exec(cmdOf(reps[0]));
        if (got && got[1] !== hook[1]) red("B.latency", `--latency_ms ${got[1]} but the hook line said ${hook[1]}`);
      }
    }
    // forge:R40 / R90 — per-idea answers are re-welded, never banked. Held where it is unambiguous: a bank on the
    // reply to a check_q (the "samajh aaya — haan ya nahi" check R3 keys, which carries no gut-word). A pehle_guess
    // reply is NOT held here: the step-2 cold guesses are reps by the method and the gate may not key the step (R3).
    // A bank that names its own moment (--probe / --register) is the teacher's declared axis moment, not a per-idea one.
    if (reps.length && prevMoments.includes("check_q") && !prevMoments.includes("jirah") && reps.some((b) => !/--(probe|register)\s/.test(cmdOf(b)))) red("B.bank-per-idea", "a bank on his reply to a check_q");
    // every bank of this turn, whatever made it due: his gut-word, his words, your question — verbatim (learn:R154, forge:R41/R92)
    if (reps.length) {
      const c = cmdOf(reps[0]);
      const gutFlag = argOf(c, "--gut"), said = argOf(c, "--said"), asked = argOf(c, "--asked");
      const prevText = normWords(T.prevTurn.filter((b) => b.kind === "text").map((b) => b.text).join(" \n "));
      const hisText = normWords(T.prompt);
      const bad = [];
      if (cls.gut && gutFlag && GUT_TO_FLAG[cls.gut] && gutFlag !== GUT_TO_FLAG[cls.gut]) bad.push(`--gut ${gutFlag} but he said ${cls.gut}`);
      // forks row 270 (A): a --gut on a message that carries NO gut-word is an invented calibration — the same
      // fabrication class as a typed latency. Measured before it landed: 0 of the 10 banks in the Desktop study
      // transcripts carried one (every --gut there was his own word).
      if (!cls.gut && gutFlag) bad.push(`--gut ${gutFlag} but his message carries no gut-word (an invented calibration)`);
      if (said === null) bad.push("no --said");
      else if (!hisText.includes(normWords(said)) || normWords(said).length < 0.6 * hisText.length) bad.push("--said is not his words verbatim");
      if (asked !== null && prevText && !prevText.includes(normWords(asked))) bad.push("--asked is not your question verbatim");
      if (bad.length) red("B.bank-verbatim", bad.join(" · "));
      if (!(/bank\s+mein\s+gaya/i.test(text) && /judge\s+shaam/i.test(text))) red("A.bank-line", "a bank ran and the message does not say \"bank mein gaya · axis <x> · judge shaam ko\"");
    }
    if (qn > 0 && !moment && !ran(T.turn, /forge_session\.mjs["']?\s+pointer\b/i)) red("B.moment", "a question-ending turn declared no moment and set no pointer");
    const badKinds = moments.filter((k) => !MOMENT_KINDS.includes(k));
    if (badKinds.length) red("B.moment-kind", badKinds.join(", "));
    const judges = T.all.filter((b) => b.kind === "tool" && (/judge[_-]round/.test(String(b.name)) || /judge[_-]round/.test(cmdOf(b)))).length;
    // forks row 276 (1)(d), his word #22 ("pictures first then text, combine them both"): at step 3 a turn that TEACHES
    // an idea (it declares check_q) carries that idea's picture in the same turn. Its ABSENCE is what one show_widget
    // call cures, so it patches; it is judged first so the presence cases below never mask it. A pehle_guess, sharp
    // check or jirah turn is a test before or after the teaching — a picture there would give the answer away.
    const pictured = T.turn.some((b) => b.kind === "tool" && /show_widget/.test(String(b.name)));
    if (forge && forge.step === 3 && moments.includes("check_q") && !pictured) red("B.widget", "a new idea was taught (check_q declared) with no picture in its turn — picture first, then text (his word #22, row 276)", "patch");
    // forks row 305 (24 Sep 2026), his word: A TEST MOMENT CARRIES NO PICTURE — a show_widget in a turn that declares
    // sharp_check or jirah and no check_q is a PRESENCE red (already on his screen: counted). Disjoint from the absence
    // case above by construction (that one needs check_q, this one its absence), so neither masks the other.
    if (pictured && !moments.includes("check_q") && moments.some((k) => BANKED_MOMENTS.includes(k))) red("B.widget", `a picture in a test moment (${moments.filter((k) => BANKED_MOMENTS.includes(k)).join(", ")} declared)`, "count", TEST_MOMENT_FIX);
    if (T.all.filter((b) => b.kind === "tool" && /show_widget/.test(String(b.name))).length > 12) red("B.widget", "more than 12 widgets in this session (~10-12 a day, at moments)", "count", WIDGET_STYLE_FIX);
    if (judges > 1) red("B.judge-once", `${judges} judge_round calls in this session`);
    const wf = widgetFindings(T.turn);
    if (wf.length) red("B.widget", wf.join(" · "), "count", WIDGET_STYLE_FIX);
  }
  // ── D · the boot, ONCE per session (the first in-scope stop) ──
  if (!mine.some((r) => r.d_checked)) {
    d.d_checked = true;
    const tools = T.all.filter((b) => b.kind === "tool" && !/^(ToolSearch|Skill|TodoWrite)$/.test(b.name));
    // row 272 (2): a boot step that NEVER ran is an absence (run it now, add nothing); one that ran in the wrong
    // order is already past — it is counted, never blocked (a block cannot re-order what happened)
    const digestRan = T.all.some((b) => shell(b) && /learn_digest\.mjs/.test(cmdOf(b)));
    if (tools.length && !/learn_digest\.mjs/.test(cmdOf(tools[0]))) red("D.digest-first", `the first tool was ${tools[0].name}${cmdOf(tools[0]) ? `: ${cmdOf(tools[0]).slice(0, 50)}` : ""}`, digestRan ? "count" : "patch");
    const openIdx = T.all.findIndex((b) => shell(b) && /sitting\.mjs["']?\s+open\b/.test(cmdOf(b)));
    const teachIdx = T.all.findIndex((b) => b.kind === "text" && (/\?/.test(prose(b.text)) || prose(b.text).length > 300));
    if (teachIdx >= 0 && (openIdx < 0 || openIdx > teachIdx)) red("D.sitting-first", "teaching text came before the sitting opened", openIdx < 0 ? "patch" : "count");
    const openCmd = openIdx >= 0 ? cmdOf(T.all[openIdx]) : "";
    const pacerIdx = T.all.findIndex((b) => (shell(b) && /forge_session\.mjs["']?\s+(resume|start|boot)\b/.test(cmdOf(b))) || (b.kind === "tool" && b.name === "Skill" && /forge/.test(JSON.stringify(b.input || {}))));
    if (openCmd && !(/--no-spawn\b/.test(openCmd) && /--surface\s+code\b/.test(openCmd))) red("D.sitting-first", "the sitting opened without --surface code --no-spawn", "count");
    else if (openIdx >= 0 && pacerIdx > openIdx) red("D.sitting-first", "the sitting opened before the pacer (resume / start) ran", "count");
    const lesson0 = !!(forge && forge.concept && !forge.closed_at);
    if (lesson0 && teachIdx >= 0 && (pacerIdx < 0 || pacerIdx > teachIdx)) red("D.pacer", "teaching text before forge_session resume / start", pacerIdx < 0 ? "patch" : "count");
    const starts = T.all.filter((b) => shell(b) && /forge_session\.mjs["']?\s+start\b/.test(cmdOf(b)));
    if (starts.length > 1 || starts.some((b) => /--force\b/.test(cmdOf(b)))) red("D.start-once", `${starts.length} forge_session start call(s)${starts.some((b) => /--force\b/.test(cmdOf(b))) ? ", one with --force" : ""}`);
    const digestCmd = (T.all.find((b) => shell(b) && /learn_digest\.mjs/.test(cmdOf(b))) || null);
    if (digestCmd && /learn_digest\.mjs[^\n]*(\|\s*(head|tail|Select-Object\s+-(First|Last))|-TotalCount)/i.test(cmdOf(digestCmd))) red("D.digest-whole", "the digest was cut by a pipe");
    const firstText = (T.firstTurn.filter((b) => b.kind === "text").pop() || {}).text || (T.prompts.length <= 1 ? finalText : "");
    if (firstText) {
      const n = lines(noFences(firstText)).filter((l) => l.trim()).length;
      const resumed = T.firstTurn.some((b) => shell(b) && /forge_session\.mjs["']?\s+resume\b/.test(cmdOf(b)));
      if (n > (resumed ? 4 : 6) || LOSS_WORDS.test(firstText)) red("D.first-screen", `the first screen is ${n} line(s)${LOSS_WORDS.test(firstText) ? ` and carries "${firstText.match(LOSS_WORDS)[0]}"` : ""}`);
    }
  }
  const ordered = reds.slice().sort((a, b) => rankOf(a) - rankOf(b));
  if (!ordered.length) return { decision: "allow", scope: "study", why: "clean", reds: [], ...d };
  const patch = ordered.filter((id) => mouthOf[id] === "patch");
  const counted = ordered.filter((id) => mouthOf[id] !== "patch");
  if (secondPass) {
    // forks row 272 (3): only the segment after the block message was judged. A PRESENCE red there is the patch's
    // own; an ABSENCE red survives only when the first pass named it too — a patch is additive, so a line it had no
    // need to carry (the position line already above it on his screen) is not missing
    const first = [...mine].reverse().find((r) => r && !r.second_pass && r.decision === "block");
    const firstReds = first && Array.isArray(first.reds) ? first.reds : null;
    // the MECHANICAL reds (what the segment itself ran, or lost above its own tool call) are the patch's own and survive
    const surviving = ordered.filter((id) => mouthOf[id] !== "patch" || mechanical.has(id) || (firstReds !== null && firstReds.includes(id)));
    return { decision: "allow", scope: "study", why: "second pass — the gate speaks once; the segment after the block message was judged and what survived is logged", reds: surviving, surviving: true, detail: why, ...d };
  }
  // forks row 272 (2): PRESENCE only — already on his screen; a block would change nothing he sees and double what he reads
  if (!patch.length) return { decision: "allow", scope: "study", why: "presence reds only — logged and drift-counted, never blocked (row 272 (2))", reds: ordered, patch, counted, detail: why, ...d };
  const room = MAX_FIX_LINES - (counted.length ? 1 : 0);
  const shown = patch.slice(0, room);
  const reason = [PATCH_OPENER,
    ...shown.map((id) => `  · ${id}: ${fixLine(id)}${why[id] ? `  [${String(why[id]).slice(0, 120)}]` : ""}`),
    ...(patch.length > shown.length ? [`  (+${patch.length - shown.length} more to add: ${patch.slice(shown.length).join(", ")})`] : []),
    ...(counted.length ? [`  AGLE TURN SE (is turn mein inhe mat chhedo): ${counted.slice(0, 4).map((id) => `${id} — ${fixLine(id).split(" — ")[0]}`).join(" · ")}${counted.length > 4 ? ` (+${counted.length - 4})` : ""}`] : []),
    "  Tools pehle, phir sirf yeh naye lines — upar wala jawab kabhi dohrao mat."].join("\n");
  return { decision: "block", scope: "study", reds: ordered, patch, counted, reason, why, detail: why, ...d };
}

// ── THE HOOK — Claude Code's Stop contract: a JSON decision on stdout, exit 0 ─────
function readLogRows(dir = STATE_DIR) {
  const p = GATE_LOG(dir);
  if (!existsSync(p)) return [];
  let raw = ""; try { raw = readTail(p, 512 * 1024); } catch { return []; }
  const out = []; for (const l of raw.split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch { /* torn */ } }
  return out;
}
export function stopHook({ raw = null, env = process.env, dir = STATE_DIR, now = new Date() } = {}) {
  const t0 = Date.now();
  let payload = {};
  try {
    const handed = globalThis.__ARSENAL_HOOK_STDIN__;
    const text = raw !== null ? raw : typeof handed === "string" ? handed : process.stdin.isTTY ? "" : readFileSync(0, "utf8");
    payload = payloadOf(text);
  } catch { payload = {}; }
  let d;
  try {
    const sitting = readSitting(dir), forge = readForge(dir);
    const scope = studyScope({ payload, sitting, env });
    const inScope = scope.study && !scope.legacy;
    let transcript = null;
    if (inScope) { try { const p = String(payload.transcript_path || ""); transcript = p && existsSync(p) ? readTail(p) : null; } catch { transcript = null; } }
    const unbound = inScope ? null : unboundVerdict({ payload, env, sitting, forge });
    d = decide({ payload, sitting, forge, transcript, logRows: readLogRows(dir), env, unbound });
  } catch (e) { d = { decision: "allow", scope: "error", reds: [], why: "the gate threw and fails OPEN", error: String((e && e.message) || e).slice(0, 200) }; }
  d.ms = Date.now() - t0;
  if (!d.quiet) {
    try {
      mkdirSync(dir, { recursive: true });
      appendFileSync(GATE_LOG(dir), JSON.stringify({ ts: now.toISOString(), session: payload.session_id || null, sitting: (readSitting(dir) || {}).id || null, decision: d.decision, scope: d.scope, reds: d.reds || [], patch: d.patch || [], counted: d.counted || [], cls: d.cls || null, moment: d.moment || null, second_pass: !!d.secondPass, surviving: !!d.surviving, d_checked: !!d.d_checked, nudged: !!d.nudged, ms: d.ms, error: d.error || null }) + "\n");
    } catch { /* the log is never a reason to bite his turn */ }
  }
  if (d.decision === "block") process.stdout.write(JSON.stringify({ decision: "block", reason: d.reason }) + "\n");
  return d;
}

// ── THE RULE TABLE + THE COMPLETENESS LAW (v2 §1) ───────────────────────────────
export const EXEMPTION_KINDS = Object.freeze(["duplicate", "his-decline", "not-per-turn", "one-time-record", "owner-held", "judge", "superseded", "other-lane"]);
export function readRules(p = RULES_PATH) {
  try { return readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l)); } catch { return null; }
}
export function readRuleTable(p = RULE_TABLE_PATH) { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } }
/** Every A/B/C/D row mapped to a check that exists, or exempted with a kind + reason; E rows go to the judge. */
export function completeness(rules, table) {
  const map = (table && table.map) || {};
  const unmapped = [], badCheck = [], badExempt = [], mapped = [], exempt = [];
  for (const r of rules || []) {
    if (!/^[ABCD]$/.test(r.check)) continue;
    const e = map[r.id];
    if (!e) { unmapped.push(r.id); continue; }
    if (e.check) {
      const ids = Array.isArray(e.check) ? e.check : [e.check];
      if (ids.some((id) => !CHECKS[id])) badCheck.push(`${r.id} → ${ids.join("+")}`); else mapped.push(r.id);
    } else if (e.exempt) {
      if (!EXEMPTION_KINDS.includes(e.exempt) || !String(e.why || "").trim()) badExempt.push(r.id); else exempt.push(r.id);
    } else unmapped.push(r.id);
  }
  const abcd = (rules || []).filter((r) => /^[ABCD]$/.test(r.check)).length;
  return { abcd, mapped: mapped.length, exempt: exempt.length, unmapped, badCheck, badExempt, green: !unmapped.length && !badCheck.length && !badExempt.length && abcd > 0 };
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
const assert = (n, c, d = "") => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}${d ? `\n         ${String(d).slice(0, 400)}` : ""}`); } };

const HOST = "11111111-2222-3333-4444-555555555555", ARCH = "a8909716-3d43-4752-b3af-40613f4814d4";
const SIT = { id: "sit_t", closed_at: null, host_session_id: HOST };
const FORGE = { concept: "tokenization", current_axis: "c", step: 3, closed_at: null };
const row = (o) => JSON.stringify(o);
const U = (text) => row({ type: "user", message: { role: "user", content: text } });
const TXT = (text) => row({ type: "assistant", message: { content: [{ type: "text", text }] } });
const TOOL = (name, input) => row({ type: "assistant", message: { content: [{ type: "tool_use", name, input }] } });
const BASH = (command) => TOOL("Bash", { command });
const HOOK = (content) => row({ type: "attachment", attachment: { type: "hook_success", hookEvent: "UserPromptSubmit", content } });
const BOOT = [U("<command-message>learn</command-message> <command-name>/learn</command-name>"), BASH("node scripts/learn_digest.mjs"), BASH("node scripts/forge_session.mjs resume"), BASH("node scripts/sitting.mjs open --surface code --no-spawn --task \"tokenization axis c\"")];
const GOOD = [
  "pointer set · check_q declared",
  "**Tokenization › axis c › pair-merge**",
  "Dukaan mein sabse zyada bikne wali cheez ko ek hi shelf milti hai — wahi idea yahan hai.",
  "`merge`: do sabse common padosi pieces ko ek naya piece bana dena.",
  "In English: BPE repeatedly merges the most frequent adjacent pair into a new token.",
  "",
  "Toh \"tea tea teen\" mein pehla merge kaunsa pair hoga — samajh aaya, haan ya nahi?",
].join("\n");
// the idea's picture FIRST (forks row 276 (1)(d)): a clean widget — Lexend, 34em, no stepper, no inputs
const PIC = TOOL("mcp__visualize__show_widget", { title: "pair_merge", widget_code: "<style>.w{font-family:Lexend;max-width:34em}</style><div class=w>tea tea teen: sabse common padosi pair</div>" });
const TURN_OK = [PIC, BASH("node scripts/forge_session.mjs moment check_q"), BASH("node scripts/forge_session.mjs pointer \"axis c merge\"")];
const run = (prompt, turnRows, final, { prev = [], payload = {}, logRows = [{ session: HOST, d_checked: true }], sitting = SIT, before = BOOT, hook = null, forge = FORGE } = {}) => {
  const rows = [...before, ...prev, U(prompt), ...(hook ? [HOOK(hook)] : []), ...turnRows, ...(final !== null ? [TXT(final)] : [])];
  return decide({ payload: { session_id: HOST, transcript_path: "x", last_assistant_message: final, ...payload }, sitting, forge, transcript: rows.join("\n"), logRows, env: {} });
};
const has = (d, id) => (d.reds || []).includes(id);

async function selftest() {
  console.log("=== teaching_gate.mjs selftest — the gate BLOCKS every planted family with its id, and never outside the study session ===\n");
  // 0 — scope
  const good = run("ok", TURN_OK, GOOD);
  assert("SCOPE · a clean study turn (tools first, the ran-line, position by name, one colon-opened name, one question ending the check_q form) is ALLOWED", good.decision === "allow" && good.reds.length === 0, JSON.stringify(good.reds) + " " + JSON.stringify(good.why || ""));
  const arch = decide({ payload: { session_id: ARCH, last_assistant_message: "Tables:\n| a | b |\n|---|---|\nDone? And more?" }, sitting: SIT, forge: FORGE, transcript: "", env: {}, unbound: { line: null } });
  assert("SCOPE · the ARCHITECT's session (not the host) is never gated, whatever it writes (R7 proof clause, planted)", arch.decision === "allow" && arch.quiet === true);
  const legacy = decide({ payload: { session_id: ARCH, last_assistant_message: "x? y?" }, sitting: { id: "old", closed_at: null }, forge: FORGE, transcript: "", env: {}, unbound: { line: null } });
  assert("SCOPE · the pre-G0 TRANSITION scope (every session) is never gated — it would block engineering work", legacy.decision === "allow");
  assert("SCOPE · a headless organ is never gated", decide({ payload: { session_id: HOST, last_assistant_message: "a? b?" }, sitting: SIT, forge: FORGE, transcript: "", env: { ARSENAL_ORGAN: "1" } }).decision === "allow");
  assert("SCOPE · in scope with the transcript unreadable → fail OPEN, named", decide({ payload: { session_id: HOST }, sitting: SIT, forge: FORGE, transcript: null, env: {} }).decision === "allow");
  // 1 — the unbound nudge, once per session
  const nudge = decide({ payload: { session_id: ARCH }, sitting: null, forge: FORGE, transcript: "", env: {}, unbound: { line: "STUDY SCOPE NOT BOUND — learn_digest first, then sitting open" }, logRows: [] });
  const nudge2 = decide({ payload: { session_id: ARCH }, sitting: null, forge: FORGE, transcript: "", env: {}, unbound: { line: "STUDY SCOPE NOT BOUND" }, logRows: [{ session: ARCH, nudged: true }] });
  const nudge3 = decide({ payload: { session_id: ARCH, stop_hook_active: true }, sitting: null, forge: FORGE, transcript: "", env: {}, unbound: { line: "STUDY SCOPE NOT BOUND" }, logRows: [] });
  assert("NUDGE · an unbound study surface is BLOCKED once with the boot-order line (row 256 (1)(c)); the second time, and on stop_hook_active, it passes",
    nudge.decision === "block" && /learn_digest first/.test(nudge.reason) && nudge.nudged === true && nudge2.decision === "allow" && nudge3.decision === "allow");
  // 2 — stop_hook_active never blocks, logs the survivors
  const second = run("ok", TURN_OK, GOOD.replace("haan ya nahi?", "haan ya nahi? Aur kyun?"), { payload: { stop_hook_active: true } });
  assert("SECOND PASS · stop_hook_active never blocks; the surviving drift is kept for the log", second.decision === "allow" && second.surviving === true && has(second, "A.one-question"));
  // 3 — the question form (R2)
  const two = run("ok", TURN_OK, GOOD.replace("haan ya nahi?", "haan ya nahi? Aur kyun?"));
  assert("R2 · \"(…)? Aur kyun?\" is TWO questions → A.one-question is DETECTED and counted — a PRESENCE red, never a block (row 272 (2))",
    two.decision === "allow" && has(two, "A.one-question") && (two.counted || []).includes("A.one-question") && !two.reason, JSON.stringify([two.decision, two.reds, two.counted]));
  // forks row 272 — THE PATCH LAW, planted both ways
  {
    const presence = run("ok", TURN_OK, GOOD.replace("\n\nToh", "\n\n| a | b |\n|---|---|\n| x | y |\n\nToh"));
    const absence = run("ok", [BASH("node scripts/forge_session.mjs pointer \"axis c merge\"")], GOOD.replace("pointer set · check_q declared", "pointer set"));
    const noMoment = run("ok", [BASH("node scripts/forge_session.mjs status")], GOOD.replace("pointer set · check_q declared", "status padha"));
    assert("row 272 (2) · PRESENCE (a table already on his screen) → A.table DETECTED + counted, the turn ALLOWED; ABSENCE (a check-question with no moment declared and no pointer) → B.moment BLOCKS with a patch",
      presence.decision === "allow" && has(presence, "A.table") && (presence.counted || []).includes("A.table")
      && noMoment.decision === "block" && has(noMoment, "B.moment") && (noMoment.patch || []).includes("B.moment") && absence.decision === "allow",
      JSON.stringify([presence.decision, presence.reds, noMoment.decision, noMoment.reds, absence.reds]));
    assert("row 272 (1) · the block reason opens PATCH, never says REWRITE, never asks for the turn again, and lists only ABSENCE ids as fix lines",
      noMoment.reason.startsWith(PATCH_OPENER) && !/REWRITE|give the turn again|rewritten|re-?send/i.test(noMoment.reason)
      && noMoment.reason.split("\n").filter((l) => /^\s+· /.test(l)).every((l) => CHECKS[l.trim().slice(2).split(":")[0]].mouth === "patch"), noMoment.reason);
    const bad = Object.entries(CHECKS).filter(([, c]) => !MOUTHS.includes(c.mouth)).map(([id]) => id);
    const presenceFixAsksRemoval = Object.entries(CHECKS).filter(([, c]) => c.mouth === "patch" && /\b(hatao|hata do|dobara bhejo|rewrite)\b/i.test(c.fix)).map(([id]) => id);
    assert(`row 272 (2) · every one of the ${Object.keys(CHECKS).length} checks names its mouth in the table (patch | count), and no PATCH fix line asks to remove or re-send`,
      bad.length === 0 && presenceFixAsksRemoval.length === 0, JSON.stringify({ bad, presenceFixAsksRemoval }));
    const trioOnCheck = run("ok", TURN_OK, GOOD.replace("samajh aaya, haan ya nahi?", "samajh aaya, haan ya nahi?\npehle gut-word: pakka / shayad / pata nahi"));
    assert("row 272 (2) · one id, two cases: a trio ON a check_q is already on his screen (counted, allowed); a sharp_check with its trio MISSING is added (blocks)",
      has(trioOnCheck, "A.gut-by-moment") && trioOnCheck.decision === "allow"
      && run("ok", [BASH("node scripts/forge_session.mjs moment sharp_check"), BASH("node scripts/forge_session.mjs pointer x")], "pointer set\n**Tokenization › axis c › pair-merge**\nAxis c ka sharp check: pehla merge kaunsa pair hoga, aur kyun?").decision === "block",
      JSON.stringify([trioOnCheck.decision, trioOnCheck.reds]));
  }
  // forks row 272 (3) — THE SECOND PASS judges only the segment after the block message, planted both ways
  {
    const FEEDBACK = row({ type: "user", isMeta: true, message: { role: "user", content: `Stop hook feedback:\n${PATCH_OPENER}\n  · B.moment: …` } });
    const firstReply = TXT(GOOD.replace("pointer set · check_q declared", "status padha"));
    const logRows = [{ session: HOST, d_checked: true }, { session: HOST, decision: "block", second_pass: false, reds: ["B.moment"] }];
    const rows = (patchRows) => [...BOOT, U("ok"), BASH("node scripts/forge_session.mjs status"), firstReply, FEEDBACK, ...patchRows].join("\n");
    const clean = decide({ payload: { session_id: HOST, last_assistant_message: "check_q declared", stop_hook_active: true }, sitting: SIT, forge: FORGE, transcript: rows([BASH("node scripts/forge_session.mjs moment check_q"), TXT("check_q declared")]), logRows, env: {} });
    const lossy = decide({ payload: { session_id: HOST, last_assistant_message: "check_q declared", stop_hook_active: true }, sitting: SIT, forge: FORGE, transcript: rows([TXT("ek line upar"), BASH("node scripts/forge_session.mjs moment check_q"), TXT("check_q declared")]), logRows, env: {} });
    const whole = turnsOf(parseTranscript(rows([BASH("node scripts/forge_session.mjs moment check_q"), TXT("check_q declared")])));
    assert("row 272 (3) · second pass: the first reply above the block message is NOT re-judged — no phantom A.text-last, no phantom absence red; a text above a tool INSIDE the patch still reds A.text-last",
      clean.decision === "allow" && !has(clean, "A.text-last") && !has(clean, "A.position") && !has(clean, "B.moment")
      && lossy.decision === "allow" && has(lossy, "A.text-last") && whole.turn.some((b) => b.kind === "text" && /status padha/.test(b.text)),
      JSON.stringify([clean.reds, lossy.reds]));
  }
  assert("R2 · \"… kaunsa? Haan ya nahi?\" is ONE (the answer-set restatement is part of it)", questionCount("Pehla merge kaunsa pair hoga? Haan ya nahi?") === 1 && questionCount("(1) word-level ya (2) char-level?") === 1);
  const trailing = run("ok", TURN_OK, GOOD + "\nAur haan, agle turn mein trace karenge.");
  assert("R2 (b) · a non-trio, non-skeleton line after the question → A.question-last", has(trailing, "A.question-last"));
  const skel = run("ok", TURN_OK, GOOD + "\nmaine socha ___, phir ___ ne toda");
  assert("R2 (b) · ONE blank-skeleton line after the question passes", !has(skel, "A.question-last"), JSON.stringify(skel.reds));
  const noMoment = run("ok", [], "tool chala nahi\n**Tokenization › axis c › merge**\nKya samjhe — samajh aaya, haan ya nahi?");
  assert("R2 (c) · a question-ending turn with no moment and no pointer → B.moment", has(noMoment, "B.moment"));
  // 4 — gut by moment (R3)
  const pg = [BASH("node scripts/forge_session.mjs moment pehle_guess")];
  const pgNoTrio = run("ok", pg, "moment set\n**Tokenization › axis c › merge**\nTumhara guess: \"tea tea\" mein kaunsa pair pehle judega?");
  const pgTrio = run("ok", pg, "moment set\n**Tokenization › axis c › merge**\nTumhara guess: \"tea tea\" mein kaunsa pair pehle judega?\npehle gut-word: pakka / shayad / pata nahi");
  assert("R3 · pehle_guess REQUIRES the trio as the one line after the question; with it, the turn passes", has(pgNoTrio, "A.gut-by-moment") && !has(pgTrio, "A.gut-by-moment") && !has(pgTrio, "A.question-last"), JSON.stringify(pgTrio.reds));
  const cqTrio = run("ok", TURN_OK, GOOD + "\npehle gut-word: pakka / shayad / pata nahi");
  assert("R3 · check_q FORBIDS the trio (forge:R89)", has(cqTrio, "A.gut-by-moment"));
  const wrongTrio = run("ok", pg, "moment set\n**Tokenization › axis c › merge**\nKaunsa pair? Pehle ek gut-word bolo — knew, shaky, ya guessed");
  assert("learn:R41 · the English trio (knew / shaky / guessed) → A.gut-trio (9e29b88c t7)", has(wrongTrio, "A.gut-trio"));
  // 5 — the name lane (R4, learn:R21)
  const twoNew = run("ok", TURN_OK, GOOD.replace("`merge`: do", "`merge`: do").replace("In English:", "`vocab size`: kitne pieces. In English:"));
  assert("learn:R21 · two NEW backticked names in one message → A.new-terms (db82184b t2)", has(twoNew, "A.new-terms"));
  const unopened = run("ok", TURN_OK, GOOD.replace("`merge`: do sabse common padosi pieces ko ek naya piece bana dena.", "Ab `embedding` ki baat karte hain, woh sab badal deta hai."));
  assert("R4 · a new name used without an opening → A.neev-pehle (e3316fbd t2, TRUE class)", has(unopened, "A.neev-pehle"));
  assert("R4 (i) · the colon form OPENS; (iii) `un` `believ` `able` from \"unbelievable\" are token EXAMPLES, not names",
    opensInMessage("`merge`: do pieces ko jodna", "merge") && opensInMessage("- merge: do pieces", "merge") && tokenExample("un", "word \"unbelievable\" ke tukde `un` `believ` `able`") && tokenExample("believ", "\"unbelievable\""));
  const ids = run("ok", TURN_OK, GOOD.replace("samajh aaya", "(receipt `amuco1j1yec`) samajh aaya"));
  assert("R4 (iv) · a backticked id at him → A.codes-at-him, never an unopened name (a33327c2 t10)", has(ids, "A.codes-at-him") && !has(ids, "A.neev-pehle"), JSON.stringify(ids.reds));
  const seenBefore = run("ok", TURN_OK, GOOD.replace("`merge`: do sabse common padosi pieces ko ek naya piece bana dena.", "Wahi `merge` phir se, ab dhyaan se."), { before: [...BOOT, TXT("`merge`: do pieces ko jodna. Samajh aaya — haan ya nahi?")] });
  assert("learn:R21 · a name opened EARLIER in this session is not new, needs no re-opening", !has(seenBefore, "A.new-terms") && !has(seenBefore, "A.neev-pehle"), JSON.stringify(seenBefore.reds));
  // 6 — position + count
  const noPos = run("ok", TURN_OK, GOOD.replace("**Tokenization › axis c › pair-merge**\n", ""));
  assert("learn:R26 · a teaching turn with no position line by name → A.position (a33327c2 t9)", has(noPos, "A.position"));
  const cnt = run("ok", TURN_OK, GOOD.replace("pair-merge**", "pair-merge (idea 2 of 4)**"));
  assert("act-mt2kgn09 · \"idea 2 of 4\" → A.count-form", has(cnt, "A.count-form"));
  // 7 — the surface grammar
  const grammar = [
    ["A.table", GOOD + "\n\n| a | b |\n|---|---|\n| 1 | 2 |"],
    ["A.sections", "## One\n" + GOOD + "\n\n---\n## Two"],
    ["A.emoji", GOOD.replace("pointer set", "pointer set 🚀")],
    ["A.bold", GOOD.replace("Dukaan mein sabse", "**Dukaan** mein **sabse**")],
    ["A.diff", GOOD + "\n```diff\n+ a\n+ b\n- c\n- d\n+ e\n```"],
    ["A.blockquote", GOOD + "\n\n> ek\n\nbeech\n\n> do"],
    ["A.tum", GOOD.replace("Toh \"tea", "Tu bata, \"tea")],
    ["A.too-hindi", GOOD.replace("Dukaan mein sabse", "Har akshar aur har shabd ko niyam se")],
    ["A.gamify", GOOD.replace("pointer set", "pointer set · +10 XP")],
    ["A.markdown", GOOD.replace("Dukaan", "<kbd>Dukaan</kbd>")],
    ["A.his-level", GOOD.replace("Dukaan mein", "Yeh toh tumhe pata hi hai, dukaan mein")],
    ["A.list-length", GOOD + "\n\n- a\n- b\n- c\n- d\n- e"],
    ["A.too-english", "pointer set · check_q declared\n**Tokenization › axis c › pair-merge**\nThe tokenizer looks at every adjacent pair of symbols in the training corpus, counts how often each pair occurs, and merges the most frequent pair into a brand new symbol, then it repeats the counting and merging until the vocabulary reaches the size that was chosen before training started, which is why frequent words end up as single tokens. Does this make sense?"],
  ];
  grammar.push(
    ["A.hype", GOOD.replace("Dukaan mein", "Zabardast! Dukaan mein")],
    ["A.medical", GOOD.replace("Dukaan mein", "Apni dawai ki dose kam karke dekho. Dukaan mein")],
    ["A.ask-where", GOOD.replace("Dukaan mein", "Pichli baar hum kahan the? Dukaan mein")],
    ["A.blame", GOOD.replace("Dukaan mein", "Tumne pichli baar yeh galat socha tha. Dukaan mein")],
    ["A.urgency", GOOD.replace("Dukaan mein", "Time kam hai, chalo. Dukaan mein")],
    ["A.his-data", GOOD.replace("Dukaan mein", "\"hello world\" lo. Dukaan mein")],
    ["A.repeat-line", GOOD.replace("Dukaan mein", "Yeh line bolo mere saath. Dukaan mein")],
    ["A.emdash", GOOD.replace("Dukaan mein", "Ek — do — teen — dukaan mein")],
    ["A.text-fence", GOOD + "\n```text\npay pay → yeh merge hota hai\n```"],
    ["A.codes-at-him", GOOD.replace("samajh aaya", "(`scripts/forge_session.mjs`) samajh aaya")],
    ["A.markdown", GOOD.replace("Dukaan mein", "[dekho](https://x.y) dukaan mein")],
    ["A.bold", GOOD.replace("Dukaan mein sabse", "**Dukaan mein sabse zyada** bikne")],
    ["A.emoji", GOOD.replace("pointer set", "pointer set ✅").replace("In English:", "✅ In English:")],
  );
  for (const [id, text] of grammar) { const r = run("ok", TURN_OK, text); assert(`GRAMMAR · ${id} blocks its planted shape, and the clean message does not carry it`, has(r, id) && !has(good, id), JSON.stringify(r.reds)); }
  // the lesson checks that read state or the turn's shape
  const grill = run("ok", TURN_OK, GOOD.replace("Dukaan mein", "Ab isko scratch se reinvent karo. Dukaan mein"));
  assert("forge:R65 · grilling (reinvent from scratch) on a check_q turn → A.no-grill", has(grill, "A.no-grill"));
  const buy = run("kaunsa laptop lun is course ke liye?", [], "Parked. Yeh wala ₹85,000 ka hai: https://shop.x\n**Tokenization › axis c › merge**\nWapas merge par — samajh aaya, haan ya nahi?");
  assert("HOW_HE_LEARNS #14 · a price and a link on his buying question → A.buying", has(buy, "A.buying"));
  const closedAxis = run("ok", TURN_OK, GOOD.replace("axis c", "axis a"), { forge: { ...FORGE, axes_done: ["a", "b"] } });
  assert("learn:R106 · a position line on a DONE axis → A.closed-axis; the current axis is fine", has(closedAxis, "A.closed-axis") && !has(run("ok", TURN_OK, GOOD, { forge: { ...FORGE, axes_done: ["a", "b"] } }), "A.closed-axis"));
  const axisDone = run("ok", [BASH("node scripts/forge_session.mjs axis c done"), ...TURN_OK], "axis c done · pointer set\n" + GOOD.split("\n").slice(1).join("\n"));
  const axisDoneOk = run("ok", [BASH("node scripts/forge_session.mjs axis c done"), ...TURN_OK], "axis c done · pointer set\nIntensity: depth maximum, breadth theek, interaction poori.\n" + GOOD.split("\n").slice(1).join("\n"));
  assert("learn:R99 · an axis closed with no depth / breadth / interaction verdict → A.intensity; with it, no", has(axisDone, "A.intensity") && !has(axisDoneOk, "A.intensity"), JSON.stringify(axisDoneOk.reds));
  const noTech = run("ok", TURN_OK, GOOD.replace("In English: BPE repeatedly merges the most frequent adjacent pair into a new token.", "Bas itna hi."));
  assert("learn:R24 · a name opened with no English technical line → A.layers", has(noTech, "A.layers"));
  const forgeRead = run("ok", [TOOL("Read", { file_path: "C:/r/.claude/skills/forge/SKILL.md", offset: 30, limit: 20 }), ...TURN_OK], "padh liya · " + GOOD);
  assert("learn:R36 · any read of forge/SKILL.md on a step-3 turn → B.whole-read", has(forgeRead, "B.whole-read"));
  const radio = run("ok", [TOOL("mcp__visualize__show_widget", { widget_code: "<link href='Lexend'><style>.w{max-width:34em}</style><input type=radio name=a>" }), ...TURN_OK], "widget dikhaya · " + GOOD);
  assert("VISUAL_CONTRACT §3 · a widget with radio answers → B.widget (tap-to-answer, NEVER)", has(radio, "B.widget"));
  // the boot, once
  const bootRows = (xs) => [U("learn"), ...xs];
  const cut = run("ok", TURN_OK, GOOD, { before: bootRows([BASH("node scripts/learn_digest.mjs | head -40"), BASH("node scripts/forge_session.mjs resume"), BASH("node scripts/sitting.mjs open --surface code --no-spawn")]), logRows: [] });
  assert("learn:R4 · the digest cut by a pipe → D.digest-whole", has(cut, "D.digest-whole"));
  const spawn = run("ok", TURN_OK, GOOD, { before: bootRows([BASH("node scripts/learn_digest.mjs"), BASH("node scripts/forge_session.mjs resume"), BASH("node scripts/sitting.mjs open --surface code")]), logRows: [] });
  const early = run("ok", TURN_OK, GOOD, { before: bootRows([BASH("node scripts/learn_digest.mjs"), BASH("node scripts/sitting.mjs open --surface code --no-spawn"), BASH("node scripts/forge_session.mjs resume")]), logRows: [] });
  assert("learn:R77 / R68 · the sitting opened without --no-spawn, or before the pacer → D.sitting-first", has(spawn, "D.sitting-first") && has(early, "D.sitting-first"));
  const noPacer = run("ok", TURN_OK, GOOD, { before: bootRows([BASH("node scripts/learn_digest.mjs"), BASH("node scripts/sitting.mjs open --surface code --no-spawn"), TXT("Chalo — tokenization kya karta hai?")]), logRows: [] });
  assert("learn:R120 · teaching text on an open concept with no forge_session resume / start → D.pacer", has(noPacer, "D.pacer"));
  const force = run("ok", TURN_OK, GOOD, { before: bootRows([BASH("node scripts/learn_digest.mjs"), BASH("node scripts/forge_session.mjs start tokenization --force"), BASH("node scripts/sitting.mjs open --surface code --no-spawn")]), logRows: [] });
  assert("learn:R71 · forge_session start --force → D.start-once", has(force, "D.start-once"));
  const bigScreen = run("ok", TURN_OK, GOOD, { before: bootRows([BASH("node scripts/learn_digest.mjs"), BASH("node scripts/forge_session.mjs resume"), BASH("node scripts/sitting.mjs open --surface code --no-spawn"), TXT("a\nb\nc\nd\ne — STALE 3 din\nf?")]), logRows: [] });
  const okScreen = run("ok", TURN_OK, GOOD, { before: bootRows([BASH("node scripts/learn_digest.mjs"), BASH("node scripts/forge_session.mjs resume"), BASH("node scripts/sitting.mjs open --surface code --no-spawn"), TXT("Tokenization › axis c › pair-merge\nAgla: trace card\nAb ek pair gino.\nTea tea teen mein pehla pair kaunsa?")]), logRows: [] });
  assert("learn:R67 / R80 / R88 · a first screen past 4 lines after resume, carrying STALE → D.first-screen; three lines + the pointer question passes",
    has(bigScreen, "D.first-screen") && !has(okScreen, "D.first-screen"), JSON.stringify(okScreen.reds));
  const quoted = run("ok", TURN_OK, GOOD.replace("Dukaan mein sabse", "Maine pehle \"akshar\" aur \"shabd\" likha tha, galat tha — dukaan mein sabse"));
  assert("R6 · the words QUOTED in an apology are exempt (a33327c2 t3); \"jaise shabd\" is exempt", !has(quoted, "A.too-hindi") && tooHindiHits("Hindi words jaise shabd aur akshar mat use karo").length === 0, JSON.stringify(quoted.reds));
  // 8 — the Desktop trap (R9) and the ran-line
  const above = run("ok", [TXT(GOOD), ...TURN_OK], "pointer set");
  assert("R9 · the lesson ABOVE the tools and a short tail after them → A.text-last BLOCKS as a patch (H8: 14 of 35 Desktop turns; the 22 Sep shape)", above.decision === "block" && has(above, "A.text-last") && (above.patch || []).includes("A.text-last"), JSON.stringify([above.reds, above.patch]));
  // forks row 275 (2), planted both ways: a narration line above a tool while the whole lesson stands after the last
  // tool (5dc8436e turn 3, 24 Sep) is COUNTED — detection unchanged, never a block, so no patch re-sends what he read
  const narration = run("ok", [TXT("Ek minute, pointer set kar raha hoon"), ...TURN_OK], GOOD);
  assert("row 275 · a narration above a tool with the lesson standing after the last tool → A.text-last is logged and COUNTED, never patched",
    narration.decision === "allow" && has(narration, "A.text-last") && !(narration.patch || []).includes("A.text-last") && (narration.counted || []).includes("A.text-last"), JSON.stringify([narration.decision, narration.reds, narration.patch, narration.counted]));
  const endsOnTool = run("ok", [TXT("Ek minute, pointer set kar raha hoon"), TXT(GOOD), ...TURN_OK], null, { payload: { last_assistant_message: "" } });
  const lagging = run("ok", [TXT("Ek minute, pointer set kar raha hoon"), ...TURN_OK], null, { payload: { last_assistant_message: GOOD } });
  assert("row 275 · a turn that does not end on text → PATCH; a reply the transcript has not caught up with (payload only) still stands after the last tool → COUNT",
    (endsOnTool.patch || []).includes("A.text-last") && has(lagging, "A.text-last") && !(lagging.patch || []).includes("A.text-last"), JSON.stringify([endsOnTool.reds, endsOnTool.patch, lagging.reds, lagging.patch]));
  assert("R9 · tools first, the whole text last → passes (the clean turn)", !has(good, "A.text-last"));
  const noRan = run("ok", TURN_OK, GOOD.replace("pointer set · check_q declared\n", ""));
  assert("v2 §3 (a) · tools ran and the first line names none → A.ran-line", has(noRan, "A.ran-line"));
  // 9 — the bank duty (R5) + latency
  const SHARP = [BASH("node scripts/forge_session.mjs moment sharp_check"), TXT("Axis c ka sharp check: pehla merge kaunsa pair hoga, aur kyun?\npehle gut-word: pakka / shayad / pata nahi")];
  const ans = run("pakka - pay kyunki woh sabse zyada repeat hota hai", TURN_OK, GOOD, { prev: SHARP });
  const absent = run("pakka - pay kyunki woh sabse zyada repeat hota hai", TURN_OK, GOOD);
  const gutless = run("pay, kyunki woh sabse zyada repeat hota hai", TURN_OK, GOOD, { prev: SHARP });
  const ackOnly = run("ok", TURN_OK, GOOD, { prev: SHARP });
  assert("rows 266 / 268 · his reply to a DECLARED sharp_check with no voice_rep → B.bank, a gut-word one or not (the sharp check carries the trio like jirah, row 268); the same words to an undeclared question (the retired absence reading), or a bare 'ok', are not due",
    has(ans, "B.bank") && has(gutless, "B.bank") && !has(absent, "B.bank") && !has(ackOnly, "B.bank"), JSON.stringify([ans.reds, gutless.reds, absent.reds, ackOnly.reds]));
  const REP = "node scripts/gaffer_brain.mjs capture voice_rep tokenization:c --axis c --gut knew --asked \"Pehla merge kaunsa pair?\" --said \"pay kyunki woh sabse zyada repeat hota hai\" --surface code --latency_ms 204218";
  const PREV_Q = [BASH("node scripts/forge_session.mjs moment jirah"), TXT("Jirah: Pehla merge kaunsa pair?\npehle gut-word: pakka / shayad / pata nahi")];
  const banked = run("pakka - pay kyunki woh sabse zyada repeat hota hai", [BASH(REP), ...TURN_OK], "bank mein gaya · axis c · judge shaam ko · pointer set\n" + GOOD.split("\n").slice(1).join("\n"), { hook: "latency: 204218 ms since your last message ended", prev: PREV_Q });
  assert("R5 · banked through voice_rep: his gut, his words and your question VERBATIM, the hook's latency, the bank line → no B.bank / B.latency / B.bank-verbatim / A.bank-line", !has(banked, "B.bank") && !has(banked, "B.latency") && !has(banked, "B.bank-verbatim") && !has(banked, "A.bank-line"), JSON.stringify(banked.reds) + JSON.stringify(banked.why));
  const wrongGut = run("pakka - pay kyunki woh sabse zyada repeat hota hai", [BASH(REP.replace("--gut knew", "--gut shaky")), ...TURN_OK], "bank mein gaya · axis c · judge shaam ko\n" + GOOD, { prev: PREV_Q });
  const reworded = run("pakka - pay kyunki woh sabse zyada repeat hota hai", [BASH(REP.replace("--said \"pay kyunki woh sabse zyada repeat hota hai\"", "--said \"pay is most frequent\"")), ...TURN_OK], "bank mein gaya · axis c · judge shaam ko\n" + GOOD, { prev: PREV_Q });
  const noLine = run("pakka - pay kyunki woh sabse zyada repeat hota hai", [BASH(REP), ...TURN_OK], "bank kiya · " + GOOD, { prev: PREV_Q });
  assert("learn:R154 / forge:R92 · --gut shaky on HIS pakka, and a reworded --said → B.bank-verbatim; a bank with no \"bank mein gaya … judge shaam ko\" → A.bank-line",
    has(wrongGut, "B.bank-verbatim") && has(reworded, "B.bank-verbatim") && has(noLine, "A.bank-line") && !has(noLine, "B.bank-verbatim"), JSON.stringify([wrongGut.why, reworded.why, noLine.why]));
  // forks row 270 (A), planted both ways: his answer carries NO gut-word and the bank types --gut knew → invented;
  // the same gut-less answer banked with no --gut (the door refuses it, the attempt is the lawful act), or his own pakka → not
  const GUTLESS = "pay kyunki woh sabse zyada repeat hota hai";
  const invented = run(GUTLESS, [BASH(REP), ...TURN_OK], "bank mein gaya · axis c · judge shaam ko\n" + GOOD, { prev: PREV_Q });
  const noGutFlag = run(GUTLESS, [BASH(REP.replace("--gut knew ", "")), ...TURN_OK], "bank mein gaya · axis c · judge shaam ko\n" + GOOD, { prev: PREV_Q });
  assert("row 270 (A) · a --gut on his gut-less answer → B.bank-verbatim (an invented calibration, the typed-latency class); no --gut on it, or --gut knew on HIS pakka → no B.bank-verbatim",
    has(invented, "B.bank-verbatim") && /invented calibration/.test(JSON.stringify(invented.detail)) && !has(noGutFlag, "B.bank-verbatim") && !has(banked, "B.bank-verbatim") && !has(noGutFlag, "B.bank"),
    JSON.stringify([invented.reds, invented.detail, noGutFlag.reds, banked.reds]));
  const lat = run("pakka - pay", [BASH("node scripts/gaffer_brain.mjs capture voice_rep tokenization:c --axis c --gut knew --latency_ms 5000"), ...TURN_OK], "bank kiya · " + GOOD, { hook: "latency: 204218 ms since your last message ended", prev: SHARP });
  assert("R5 · a latency that is not the hook's number → B.latency", has(lat, "B.latency"));
  // forks row 305 (24 Sep 2026) — THE NON-ANSWER PATH, planted both ways (his reply of 24 Sep verbatim), sharp_check and jirah
  {
    const COMPLAINT = "bruh directly ask me questions, why giving me this picture?", AGAIN = "phir wahi? seedha sawaal pucho bas";
    const redeclare = (k) => [BASH(`node scripts/forge_session.mjs moment ${k}`), BASH("node scripts/forge_session.mjs pointer \"axis c merge\"")];
    const REQ = "moment set · pointer set\n**Tokenization › axis c › pair-merge**\nSeedha sawaal: \"tea tea teen\" mein pehla merge kaunsa pair hoga, aur kyun?\npehle gut-word: pakka / shayad / pata nahi";
    const TWOQ = REQ.replace("aur kyun?", "aur kyun? Aur doosra kaunsa?");
    for (const [k, PREV] of [["sharp_check", SHARP], ["jirah", PREV_Q]]) {
      const once = run(COMPLAINT, redeclare(k), REQ, { prev: PREV });
      const twice = run(AGAIN, redeclare(k), REQ, { prev: [...PREV, U(COMPLAINT), ...redeclare(k), TXT(REQ)] });
      const bankedBetween = run(AGAIN, redeclare(k), REQ, { prev: [...PREV, U(COMPLAINT), BASH(REP.replace("--gut knew ", "")), ...redeclare(k), TXT("bank mein gaya · axis c · judge shaam ko\n" + REQ)] });
      const neither = run(COMPLAINT, TURN_OK, GOOD, { prev: PREV });
      const twoQ = run(COMPLAINT, redeclare(k), TWOQ, { prev: PREV });
      const otherKind = run(COMPLAINT, redeclare(k === "jirah" ? "sharp_check" : "jirah"), REQ, { prev: PREV });
      const bankedNow = run("pakka - pay kyunki woh sabse zyada repeat hota hai", [BASH(REP), ...TURN_OK], "bank mein gaya · axis c · judge shaam ko · pointer set\n" + GOOD.split("\n").slice(1).join("\n"), { prev: PREV });
      assert(`row 305 · ${k} · (a) his reply, then this turn RE-DECLARES ${k} with ONE question and no voice_rep → no B.bank (allowed once; the bank is due on his next reply)`,
        !has(once, "B.bank") && once.cls === "answer" && once.moment === k, JSON.stringify([once.cls, once.reds, once.detail]));
      assert(`row 305 · ${k} · (b) the SECOND consecutive re-declare with no bank between → B.bank, mouth COUNT (the dodge) — never a patch; a bank between resets it`,
        has(twice, "B.bank") && (twice.counted || []).includes("B.bank") && !(twice.patch || []).includes("B.bank") && /dodge/.test(JSON.stringify(twice.detail)) && !has(bankedBetween, "B.bank"),
        JSON.stringify([twice.reds, twice.patch, twice.counted, bankedBetween.reds]));
      assert(`row 305 · ${k} · (c) neither re-declared nor banked → B.bank PATCH (as live main); a re-declare with TWO questions or of ANOTHER kind is no re-declare → PATCH`,
        (neither.patch || []).includes("B.bank") && (twoQ.patch || []).includes("B.bank") && (otherKind.patch || []).includes("B.bank"), JSON.stringify([neither.reds, twoQ.reds, otherKind.reds]));
      assert(`row 305 · ${k} · (e) a banked reply → no B.bank (as live main)`, !has(bankedNow, "B.bank"), JSON.stringify(bankedNow.reds));
    }
  }
  // forks row 305 (24 Sep 2026), his word — A TEST MOMENT CARRIES NO PICTURE, planted both ways against the absence case
  {
    const TEST_TXT = "moment set · pointer set\n**Tokenization › axis c › pair-merge**\nSeedha sawaal: \"tea tea teen\" mein pehla merge kaunsa pair hoga, aur kyun?\npehle gut-word: pakka / shayad / pata nahi";
    const PTR = BASH("node scripts/forge_session.mjs pointer \"axis c merge\"");
    const picSharp = run("ok", [PIC, BASH("node scripts/forge_session.mjs moment sharp_check"), PTR], TEST_TXT);
    const picJirah = run("ok", [PIC, BASH("node scripts/forge_session.mjs moment jirah"), PTR], TEST_TXT);
    const picJirahNoTrio = run("ok", [PIC, BASH("node scripts/forge_session.mjs moment jirah"), PTR], TEST_TXT.replace("\npehle gut-word: pakka / shayad / pata nahi", ""));
    const noPicSharp = run("ok", [BASH("node scripts/forge_session.mjs moment sharp_check"), PTR], TEST_TXT);
    const picCheck = run("ok", TURN_OK, GOOD);
    const noPicCheck = run("ok", [BASH("node scripts/forge_session.mjs moment check_q"), PTR], GOOD);
    assert("row 305 · (f) show_widget + a declared sharp_check / jirah and no check_q → B.widget, mouth COUNT (presence — never a block on its own), the fix line verbatim; no picture on the same test turn → no B.widget",
      TEST_MOMENT_FIX === "test moment: sawaal seedha, picture nahi" && has(picSharp, "B.widget") && (picSharp.counted || []).includes("B.widget") && picSharp.decision === "allow"
      && has(picJirah, "B.widget") && (picJirah.counted || []).includes("B.widget") && !has(noPicSharp, "B.widget")
      && picJirahNoTrio.decision === "block" && picJirahNoTrio.reason.includes(`B.widget — ${TEST_MOMENT_FIX}`), JSON.stringify([picSharp.reds, picSharp.counted, picJirah.reds, noPicSharp.reds, picJirahNoTrio.reason]));
    assert("row 305 · (f) the same widget + check_q at step 3 → no presence red; check_q at step 3 with no widget → the ABSENCE patch (as live main) — neither case masks the other",
      !has(picCheck, "B.widget") && has(noPicCheck, "B.widget") && (noPicCheck.patch || []).includes("B.widget"), JSON.stringify([picCheck.reds, noPicCheck.reds, noPicCheck.patch]));
  }
  // forks row 264 (1): forge row 53b STANDS — the bank is due at the jirah and the sharp check, never per idea
  const prevOf = (k) => [BASH(`node scripts/forge_session.mjs moment ${k}`), TXT("sawaal?")];
  const replyJ = run("A", TURN_OK, GOOD, { prev: prevOf("jirah") });
  const replyPG = run("A", TURN_OK, GOOD, { prev: prevOf("pehle_guess") });
  const gutPG = run("pakka - pay kyunki woh sabse zyada repeat hota hai", TURN_OK, GOOD, { prev: prevOf("pehle_guess") });
  assert("row 264 (1) · a reply to a declared JIRAH → B.bank; a reply to a per-idea pehle_guess — gut-word or not (db82184b t3 t4 t5 t11) — or to a check_q is NOT due",
    has(replyJ, "B.bank") && !has(replyPG, "B.bank") && !has(gutPG, "B.bank") && !has(run("A", TURN_OK, GOOD, { prev: prevOf("check_q") }), "B.bank"), JSON.stringify([replyJ.reds, replyPG.reds, gutPG.reds]));
  const REP_PLAIN = "node scripts/gaffer_brain.mjs capture voice_rep tokenization:c --axis c --gut knew --said \"haan\" --surface code";
  const perIdea = run("haan", [BASH(REP_PLAIN), ...TURN_OK], "bank mein gaya · axis c · judge shaam ko · pointer set\n" + GOOD.split("\n").slice(1).join("\n"), { prev: prevOf("check_q") });
  const perIdeaProbe = run("haan", [BASH(REP_PLAIN + " --probe recall"), ...TURN_OK], "bank mein gaya · axis c · judge shaam ko · pointer set\n" + GOOD.split("\n").slice(1).join("\n"), { prev: prevOf("check_q") });
  const jirahBank = run("pay", [BASH(REP_PLAIN.replace("--said \"haan\"", "--said \"pay\"")), ...TURN_OK], "bank mein gaya · axis c · judge shaam ko · pointer set\n" + GOOD.split("\n").slice(1).join("\n"), { prev: prevOf("jirah") });
  assert("forge:R40 / R90 · a bank on his reply to a check_q → B.bank-per-idea; a bank naming its moment (--probe), or at the jirah, is not",
    has(perIdea, "B.bank-per-idea") && !has(perIdeaProbe, "B.bank-per-idea") && !has(jirahBank, "B.bank-per-idea"), JSON.stringify([perIdea.reds, perIdeaProbe.reds, jirahBank.reds]));
  // forks row 264 (2): learn:R60 — ✅ / ❌ ride ALONGSIDE the diff, never instead of it
  const ANS = "shayad - pay kyunki woh sabse zyada repeat hota hai";
  const tail = GOOD.split("\n").slice(1).join("\n");
  const emojiOnly = run(ANS, [BASH(REP), ...TURN_OK], `bank mein gaya · axis c · judge shaam ko · pointer set\n❌ pay nahi, "tea" pehle judega\n${tail}`);
  const emojiDiff = run(ANS, [BASH(REP), ...TURN_OK], `bank mein gaya · axis c · judge shaam ko · pointer set\n❌ ek jagah galti hai, yahan dekho:\n\`\`\`diff\n- pay pehle judega\n+ "te" pehle judega\n\`\`\`\n${tail}`);
  const confirmOnly = run(ANS, [BASH(REP), ...TURN_OK], `bank mein gaya · axis c · judge shaam ko · pointer set\n✅ sahi pakda — pay hi\n${tail}`);
  const proseContrast = run("ok", TURN_OK, GOOD.replace("Dukaan mein sabse", "❌ letters se nahi, pieces se. Dukaan mein sabse"));
  assert("row 264 (2) · a correction of HIS answer carried by ❌ with no ```diff → A.emoji-diff; with the diff beside it, a ✅ alone, or a ❌ in teaching prose with no answer of his → no",
    has(emojiOnly, "A.emoji-diff") && !has(emojiDiff, "A.emoji-diff") && !has(confirmOnly, "A.emoji-diff") && !has(proseContrast, "A.emoji-diff"), JSON.stringify([emojiOnly.reds, emojiDiff.reds, confirmOnly.reds, proseContrast.reds]));
  // 10 — tools outside the study set, whole reads, AskUserQuestion, judge once, widget, moment kinds
  const grep = run("ok", [TOOL("Grep", { pattern: "x", path: "C:/Users/nikhi/GitHub/arsenal-ai-fc/scripts" }), ...TURN_OK], "grep chala · " + GOOD);
  assert("forge:R171 · a Grep over scripts/ mid-concept → B.tools (db82184b t9)", has(grep, "B.tools"));
  const CLOSE_ORGANS = [BASH("node scripts/postmatch.mjs --hit \"axis c\""), BASH("node scripts/captains_call.mjs deal")];
  const closeTurn = run("<command-message>full-time</command-message>\n<command-name>/full-time</command-name>", CLOSE_ORGANS, "full time · post match likh diya");
  const organsMidStudy = run("ok", [...CLOSE_ORGANS, ...TURN_OK], "post match chala · " + GOOD);
  assert("row 267 · his prompt is a CLOSING (/full-time) → its close organs run with no B.tools; the same organs on a study turn → B.tools (planted both ways)",
    !has(closeTurn, "B.tools") && has(organsMidStudy, "B.tools"), JSON.stringify([closeTurn.reds, organsMidStudy.reds]));
  const canon = run("ok", [TOOL("Read", { file_path: "C:/r/learning-layer/VISUAL_CONTRACT.md", offset: 100, limit: 30 }), ...TURN_OK], "padh liya · " + GOOD);
  assert("learn:R3 · a canon SECTION read (offset + limit) is inside the study set", !has(canon, "B.tools") && !has(canon, "B.whole-read"), JSON.stringify(canon.reds));
  const whole = run("ok", [TOOL("Read", { file_path: "C:/r/learning-layer/VISUAL_CONTRACT.md" }), ...TURN_OK], "padh liya · " + GOOD);
  assert("learn:R2 · a WHOLE read of VISUAL_CONTRACT → B.whole-read (db82184b t12)", has(whole, "B.whole-read"));
  const ask = run("ok", [TOOL("AskUserQuestion", { questions: [] }), ...TURN_OK], "set · " + GOOD);
  assert("AskUserQuestion in a study turn → B.askuser", has(ask, "B.askuser"));
  const kinds = run("ok", [BASH("node scripts/forge_session.mjs moment quiz"), BASH("node scripts/forge_session.mjs pointer x")], GOOD);
  const sharpTrio = run("ok", [BASH("node scripts/forge_session.mjs moment sharp_check"), BASH("node scripts/forge_session.mjs pointer x")], "pointer set\n**Tokenization › axis c › pair-merge**\nAxis c ka sharp check: \"tea tea teen\" mein pehla merge kaunsa pair hoga, aur kyun?\npehle gut-word: pakka / shayad / pata nahi");
  const sharpBare = run("ok", [BASH("node scripts/forge_session.mjs moment sharp_check"), BASH("node scripts/forge_session.mjs pointer x")], "pointer set\n**Tokenization › axis c › pair-merge**\nAxis c ka sharp check: \"tea tea teen\" mein pehla merge kaunsa pair hoga, aur kyun?");
  assert("C · the fence, planted BOTH ways (rows 266 / 268): a moment outside the five → B.moment-kind; sharp_check WITH the trio as its last line is legal and clean; a sharp_check with no trio → A.gut-by-moment (row 254 (3)(b) narrowed by row 268)",
    has(kinds, "B.moment-kind") && sharpTrio.reds.length === 0 && has(sharpBare, "A.gut-by-moment") && !has(sharpBare, "B.moment-kind"), JSON.stringify([sharpTrio.reds, sharpTrio.why, sharpBare.reds]));
  const w = run("ok", [TOOL("mcp__visualize__show_widget", { widget_code: "<div style='font-family:Arial'><button>aage</button></div><script>setInterval(()=>{},9)</script>" }), ...TURN_OK], "widget dikhaya · " + GOOD);
  assert("VISUAL_CONTRACT · a widget without Lexend / 34em, with autoplay and a half stepper → B.widget", has(w, "B.widget"));
  // forks row 276 (1)(d), his word #22 — PICTURE FIRST, planted both ways: a step-3 teaching turn (check_q) with no
  // picture PATCHES with one show_widget call; the same turn with its picture is clean; a test turn (pehle_guess) and a
  // step-4 turn never owe one; the style case stays a PRESENCE and carries the style fix, never the absence's
  const TEACH_NO_PIC = TURN_OK.filter((b) => b !== PIC);
  const noPic = run("ok", TEACH_NO_PIC, GOOD);
  const withPic = run("ok", TURN_OK, GOOD);
  const guessNoPic = run("ok", [BASH("node scripts/forge_session.mjs moment pehle_guess"), BASH("node scripts/forge_session.mjs pointer \"axis c merge\"")], "pointer set · pehle_guess declared\nTokenization › axis c › pair-merge\nTumhara guess: \"tea tea\" mein kaunsa pair pehle judega?\npehle gut-word: pakka / shayad / pata nahi");
  const step4NoPic = run("ok", TEACH_NO_PIC, GOOD, { forge: { ...FORGE, step: 4 } });
  assert("row 276 · a step-3 teaching turn (check_q) with NO picture → B.widget BLOCKS as a patch whose fix is one show_widget call; with its picture first → no B.widget",
    noPic.decision === "block" && (noPic.patch || []).includes("B.widget") && /show_widget/.test(noPic.reason || "") && !has(withPic, "B.widget"), JSON.stringify([noPic.reds, noPic.patch, withPic.reds]));
  assert("row 276 · a pehle_guess turn and a step-4 turn owe no per-idea picture (a test turn must not give the answer away; step 4 has its concept widget)",
    !has(guessNoPic, "B.widget") && !has(step4NoPic, "B.widget"), JSON.stringify([guessNoPic.reds, step4NoPic.reds]));
  assert("row 276 · the widget's STYLE stays a presence: counted, never patched, and its AGLE TURN SE line carries the style fix, never the absence's",
    has(w, "B.widget") && !(w.patch || []).includes("B.widget") && (w.counted || []).includes("B.widget") && (!w.reason || /B\.widget — widget: Lexend/.test(w.reason)), JSON.stringify([w.decision, w.patch, w.counted, (w.reason || "").split("\n").filter((l) => /AGLE/.test(l))]));
  const j2 = run("ok", [TOOL("mcp__organism-memory__judge_round", {}), ...TURN_OK], "set · " + GOOD, { before: [...BOOT, TOOL("mcp__organism-memory__judge_round", {})] });
  assert("B · a second judge_round in the session → B.judge-once", has(j2, "B.judge-once"));
  // 11 — system talk passes (mechanical checks only), confusion is literal
  const sys = run("bruh why don't you keep yourself updated with the entire /learn first, you keep on doing mistakes", [], "Haan, galti meri. Parked.\n\n| a | b |\n|---|---|\nKya hum wapas merge par chalein? Aur kaise?");
  assert("SYSTEM · his system talk (9e29b88c t8) is never style-gated — tables, two questions pass", sys.decision === "allow", JSON.stringify(sys.reds));
  const sysAbove = run("are you following the visualization ruling correctly?", [TXT("dekh raha hoon"), TOOL("Grep", { pattern: "x", path: "C:/r/scripts" })], "Parked.");
  assert("SYSTEM · …but text above a tool and a tool outside the study set still BLOCK (what he sees, what ran)", has(sysAbove, "A.text-last") && has(sysAbove, "B.tools") && !has(sysAbove, "A.position"));
  const conf = run("i did not get it, understood nothing", TURN_OK, GOOD.replace("`merge`: do", "`BPE`: byte pair encoding. `merge`: do"), { prev: [TXT("`merge`: jodna. Samajh aaya — haan ya nahi?")] });
  assert("v2 §3 (f) · on HIS confusion a NEW name → A.confusion-literal", has(conf, "A.confusion-literal"));
  const confOk = run("i did not get it, understood nothing", TURN_OK, GOOD.replace("`merge`: do sabse common padosi pieces ko ek naya piece bana dena.", "Wahi `merge`, zero se: do pieces ko ek banana."), { prev: [TXT("`merge`: jodna. Samajh aaya — haan ya nahi?")] });
  assert("v2 §3 (f) · the same name carried, nothing new, no step move → passes", !has(confOk, "A.confusion-literal"), JSON.stringify(confOk.reds));
  // 12 — D, once per session
  const noDigest = run("ok", TURN_OK, GOOD, { before: [U("learn"), BASH("node scripts/forge_session.mjs status"), BASH("node scripts/sitting.mjs open --surface code")], logRows: [] });
  assert("D · the session's first tool was not learn_digest → D.digest-first (on the first in-scope stop only)", has(noDigest, "D.digest-first") && noDigest.d_checked === true && !has(run("ok", TURN_OK, GOOD, { before: [U("learn"), BASH("node scripts/forge_session.mjs status")], logRows: [{ session: HOST, d_checked: true }] }), "D.digest-first"));
  const teachFirst = run("ok", TURN_OK, GOOD, { before: [U("learn"), BASH("node scripts/learn_digest.mjs"), TXT("Chalo shuru: tokenization kya hai, pata hai?"), BASH("node scripts/sitting.mjs open")], logRows: [] });
  assert("D · teaching text before the sitting opened → D.sitting-first", has(teachFirst, "D.sitting-first"));
  // 13 — the reason: ranked, capped, names the ids
  // the text above the tool outweighs the tail after it, so A.text-last is a patch here (row 275 (2))
  const many = run("pakka - x", [TXT("upar poora jawab tha jo tool ke upar likha gaya aur uski Desktop screen se gayab ho gaya"), TOOL("Grep", { pattern: "x", path: "C:/r/scripts" })], "## a\n---\nTu bata? Aur? Kyun? `embedding` `byte` 🚀🚀🚀", { prev: SHARP });
  const shown = (many.reason || "").split("\n").filter((l) => /^\s+· /.test(l));
  assert("REASON · the PATCH lines are the ABSENCE reds only, in drift-rank order (text-last, then bank); the PRESENCE reds ride ONE 'agle turn se' line; ≤ 6 lines of fixes",
    many.decision === "block" && shown.length >= 2 && shown.length <= MAX_FIX_LINES && /A\.text-last/.test(shown[0]) && /B\.bank/.test(shown[1])
    && shown.every((l) => CHECKS[l.trim().slice(2).split(":")[0]].mouth === "patch") && /AGLE TURN SE[^\n]*A\.one-question/.test(many.reason) && !/REWRITE/.test(many.reason), many.reason);
  assert("REASON · every red id is a catalogue id with a fix line", (many.reds || []).every((id) => CHECKS[id] && CHECKS[id].fix));
  // 13b — THE SKELETON NEVER TEACHES THE VIOLATION (forks row 264 (3)). The G1 skeleton's own examples, copied
  // exactly as it renders them — the ran-line, the bank line, the position label, the check_q ending, the gut
  // line, the blank line — are run through THIS gate on the turns they belong to, and must draw ZERO reds.
  // Imported here only (the hook path never loads teaching_bar).
  {
    const bar = await import("./teaching_bar.mjs");
    const sk = bar.barLines(FORGE, 1, [], { bank: bankDueAt({ cls: { answer: true, gut: "pakka" }, prevMoments: ["sharp_check"] }) }).join("\n");
    // THE FENCE HAS ONE HOME (row 266): the pacer's MOMENTS = this gate's MOMENT_KINDS = the kinds the skeleton tells
    // the model to declare. Read here, in the selftest only — the hook path never loads the pacer.
    const pacer = await import("./forge_session.mjs");
    const skKinds = ((/moment ((?:[a-z_]+\|)+[a-z_]+)`?\s*$/m.exec(sk.split("\n").find((l) => /\[EK CHECK\]/.test(l)) || "") || [])[1] || "").split("|");
    const same = (a, b) => a.length === b.length && a.every((k) => b.includes(k));
    assert(`FENCE · the pacer's ${pacer.MOMENTS.length} legal kinds = the gate's MOMENT_KINDS = the kinds the skeleton's [EK CHECK] prints (sharp_check included, row 266)`,
      Array.isArray(pacer.MOMENTS) && same(pacer.MOMENTS, [...MOMENT_KINDS]) && same(skKinds, [...MOMENT_KINDS]) && pacer.MOMENTS.includes("sharp_check"), JSON.stringify({ pacer: pacer.MOMENTS, gate: MOMENT_KINDS, skeleton: skKinds }));
    const q = (rx) => { const m = rx.exec(sk); return m ? m[1] : null; };
    const ranLine = q(/first line names it: "([^"]+)"/), bankLine = q(/the text's first line: "([^"]+)"/);
    const position = (q(/\[POSITION\] (.+?) — never a count/) || "").replace("<the idea, BY NAME>", "pair-merge");
    const checkEnd = q(/check_q → end "([^"]+)"/), gutLine = q(/ONE line after it: "([^"]+)"/), blankLine = q(/blank line after it: "([^"]+)"/);
    const got = [ranLine, bankLine, position, checkEnd, gutLine, blankLine];
    assert("SKELETON · its six examples are read off the rendered skeleton (ran-line · bank line · position · check_q ending · gut line · blank line)",
      got.every((x) => typeof x === "string" && x.length > 3 && !x.includes("<")), JSON.stringify(got));
    const lesson = [position, "Dukaan mein sabse zyada bikne wali cheez ko ek hi shelf milti hai — wahi idea yahan hai.", "`merge`: do sabse common padosi pieces ko ek naya piece bana dena.", "In English: BPE repeatedly merges the most frequent adjacent pair into a new token.", ""].join("\n");
    // the skeleton's line 0 orders the idea's picture FIRST on a teaching turn (row 276 (1)(d)) — its check_q turns carry it
    const moment = (k) => [...(k === "check_q" ? [PIC] : []), BASH(`node scripts/forge_session.mjs moment ${k}`), BASH("node scripts/forge_session.mjs pointer \"axis c merge\"")];
    const turns = {
      check_q: run("ok", moment("check_q"), `${ranLine}\n${lesson}\nToh "tea tea teen" mein pehla merge kaunsa pair hoga, ${checkEnd}?`),
      bank: run("pakka - pay kyunki woh sabse zyada repeat hota hai", [BASH(REP), ...moment("check_q")], `${bankLine} · ${ranLine}\n${lesson}\nToh "tea tea teen" mein pehla merge kaunsa pair hoga, ${checkEnd}?`, { prev: SHARP }),
      sharp_check: run("ok", moment("sharp_check"), `${ranLine}\n${position}\nAxis c ka sharp check: "tea tea teen" mein pehla merge kaunsa pair hoga, aur kyun?\n${gutLine}`),
      pehle_guess: run("ok", moment("pehle_guess"), `${ranLine}\n${position}\nTumhara guess: "tea tea" mein kaunsa pair pehle judega?\n${gutLine}`),
      widget_gate: run("ok", moment("widget_gate"), `${ranLine}\n${position}\n"tea tea" mein kaunsa pair pehle judega?\n${blankLine}`),
    };
    const dirty = Object.entries(turns).filter(([, d]) => d.reds.length);
    // the control: P1's label ("tokenization > c > …", no "axis") is what this case caught on 23 Sep — it must stay red
    const oldLabel = run("ok", moment("check_q"), `${ranLine}\n${lesson.replace(position, "tokenization > c > pair-merge")}\nToh "tea tea teen" mein pehla merge kaunsa pair hoga, ${checkEnd}?`);
    assert("SKELETON · every example it teaches passes the gate with ZERO reds on its own turn (check_q · a sharp-check bank · sharp_check · pehle_guess · widget_gate); P1's bare-letter label stays red (the control)",
      got.every(Boolean) && dirty.length === 0 && has(oldLabel, "A.position"), dirty.map(([k, d]) => `${k}: ${d.reds.join(" ")} ${JSON.stringify(d.why)}`).join(" | ") + ` · control ${JSON.stringify(oldLabel.reds)}`);
  }
  // 14 — the transcript reader
  const parsed = parseTranscript([U("a"), TXT("t1"), BASH("x"), "torn {", U("b"), HOOK("latency: 5 ms"), TXT("t2")].join("\n"));
  const T = turnsOf(parsed);
  assert("TRANSCRIPT · this turn = the blocks after his last prompt; the previous turn and the hook line are split out; torn lines skipped",
    T.prompt === "b" && T.turn.length === 1 && T.turn[0].text === "t2" && T.prevTurn.length === 2 && /latency: 5/.test(T.hookText));
  // 15 — the completeness law
  const rules = readRules(); const table = readRuleTable();
  const c = completeness(rules, table);
  assert(`COMPLETENESS · every A/B/C/D row of RULES.jsonl is mapped to a check that exists or exempted with a kind + reason (${c.mapped} mapped · ${c.exempt} exempt · ${c.unmapped.length} unmapped of ${c.abcd})`,
    !!rules && !!table && c.green, `unmapped ${c.unmapped.slice(0, 8).join(", ")} · bad check ${c.badCheck.slice(0, 4).join(", ")} · bad exempt ${c.badExempt.slice(0, 4).join(", ")}`);
  const planted = completeness([{ id: "x:R1", check: "A" }, { id: "x:R2", check: "B" }, { id: "x:R3", check: "E" }], { map: { "x:R1": { check: "A.nope" } } });
  assert("COMPLETENESS · PLANTED: an unmapped row and a mapping to a check that does not exist are both REFUSED; E rows are the judge's",
    !planted.green && planted.unmapped.includes("x:R2") && planted.badCheck.length === 1 && planted.abcd === 2);
  // 16 — the hook, end to end (spawned, temp state dir), and its time
  const dir = mkdtempSync(join(tmpdir(), "teaching_gate-"));
  try {
    writeFileSync(join(dir, "sitting.json"), JSON.stringify(SIT)); writeFileSync(join(dir, "forge_session.json"), JSON.stringify(FORGE));
    // the lesson above the tools, a two-word tail after them: the 22 Sep shape, a patch (row 275 (2))
    const tx = join(dir, "t.jsonl"); writeFileSync(tx, [...BOOT, U("ok"), TXT(GOOD), ...TURN_OK, TXT("pointer set")].join("\n"));
    // the surface is pinned: run from a Desktop session, the inherited entrypoint would make the unbound nudge fire here
    const env = { ...process.env, ARSENAL_GATE_STATE_DIR: dir, ARSENAL_ORGAN: "", CLAUDE_CODE_ENTRYPOINT: "cli" };
    const archTx = join(dir, "arch.jsonl"); writeFileSync(archTx, U("architect"));
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "stop"], { input: JSON.stringify({ session_id: HOST, transcript_path: tx, last_assistant_message: "pointer set", hook_event_name: "Stop" }), env, encoding: "utf8", timeout: 20000 });
    const ms = Date.now() - t0;
    let out = null; try { out = JSON.parse(r.stdout); } catch { /* none */ }
    const log = readFileSync(GATE_LOG(dir), "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert("HOOK · spawned on a planted study payload it prints ONE block decision naming A.text-last, exits 0, and logs the row", r.status === 0 && out && out.decision === "block" && /A\.text-last/.test(out.reason) && log.length === 1 && log[0].decision === "block" && log[0].reds.includes("A.text-last"), `${r.status} ${r.stdout} ${r.stderr}`);
    assert("HOOK · row 272 (1): the spawned block opens PATCH, never says REWRITE, never asks for the turn again; the log row splits patch from counted",
      out && out.reason.startsWith(PATCH_OPENER) && !/REWRITE|give the turn again|rewritten/i.test(out.reason) && Array.isArray(log[0].patch) && log[0].patch.includes("A.text-last") && Array.isArray(log[0].counted), out ? out.reason : r.stdout);
    const r2 = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "stop"], { input: JSON.stringify({ session_id: ARCH, transcript_path: archTx, last_assistant_message: "x? y?" }), env, encoding: "utf8", timeout: 20000 });
    assert("HOOK · the architect's payload: silent stdout, exit 0, and NOTHING written", r2.status === 0 && r2.stdout.trim() === "" && readFileSync(GATE_LOG(dir), "utf8").trim().split("\n").length === 1);
    const r3 = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "stop"], { input: "{not json", env, encoding: "utf8", timeout: 20000 });
    assert("HOOK · garbage stdin → silent, exit 0 (fail open, never a throw)", r3.status === 0 && r3.stdout.trim() === "");
    console.log(`  info hook wall time on this laptop (spawn included): ${ms} ms · in-process decide: ${log[0].ms} ms`);
    assert("HOOK · the in-process decision is well under the < 1 s budget (R10)", log[0].ms < 500, `${log[0].ms} ms`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  console.log(`\nteaching_gate selftest: ${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
}

// ── CLI ──────────────────────────────────────────────────────────────────────────
//   node scripts/teaching_gate.mjs stop        (the Stop hook; reads the payload on stdin)
//   node scripts/teaching_gate.mjs check --session <id> --transcript <path>   (by hand, read-only: the decision JSON, nothing logged)
//   node scripts/teaching_gate.mjs table       (the completeness count)
//   node scripts/teaching_gate.mjs selftest
function cli() {
  const [cmd, ...rest] = process.argv.slice(2);
  const opt = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : undefined; };
  if (cmd === "stop") { stopHook(); return; }
  if (cmd === "selftest") { selftest().catch((e) => { console.log(`  FAIL the selftest threw: ${(e && e.stack) || e}`); console.log(`\nteaching_gate selftest: ${pass} passed, ${fail + 1} failed`); process.exitCode = 1; }); return; }
  if (cmd === "table") { const c = completeness(readRules(), readRuleTable()); console.log(`teaching_gate table: ${c.abcd} A/B/C/D rows · ${c.mapped} mapped · ${c.exempt} exempt · ${c.unmapped.length} unmapped · ${c.badCheck.length} bad check · ${c.badExempt.length} bad exemption · ${c.green ? "GREEN" : "RED"}`); if (!c.green) { console.log(`  unmapped: ${c.unmapped.slice(0, 40).join(" ")}`); process.exitCode = 1; } return; }
  if (cmd === "check") {
    const tp = opt("--transcript"); const sid = opt("--session");
    let transcript = null; try { transcript = tp ? readTail(tp) : null; } catch { transcript = null; }
    const sitting = opt("--as-host") ? { id: "sit_check", closed_at: null, host_session_id: sid } : readSitting();
    const d = decide({ payload: { session_id: sid, transcript_path: tp }, sitting, forge: readForge(), transcript, logRows: [], env: {}, unbound: { line: null } });
    console.log(JSON.stringify({ decision: d.decision, scope: d.scope, reds: d.reds, why: d.why, cls: d.cls, moment: d.moment }));
    return;
  }
  console.log("teaching_gate.mjs — stop | check --session <id> --transcript <path> [--as-host 1] | table | selftest");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli();
