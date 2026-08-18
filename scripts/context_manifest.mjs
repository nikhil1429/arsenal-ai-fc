#!/usr/bin/env node
// ============================================================================
// context_manifest.mjs · ARSENAL AI FC — THE SESSIONSTART ASSEMBLER (audit #107)
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. Three separate repairs — the hippocampus splice (31 Jul), the
// teaching card (31 Jul), the Re-Jirah line and the course brief (4 Aug) — each fixed
// a real "this never reached the session" defect the same way: by adding one more
// splice inside learnstate.mjs's brief(). That function now performs seven jobs, and
// the pattern had started to produce its own bug class:
//
//   MEASURED 5 Aug 2026 — the hippocampus cartridge is 4,157 characters and the brief
//   carried MEMO_MAX = 2,200 of them. 1,957 characters of his durable memory were
//   dropped at every single SessionStart, silently, with no line saying so. And the
//   PENDING IDENTITY FACTS queue — which mcp-memory.mjs surfaces precisely because
//   "staged facts rotted invisibly forever" — had no path into the brief at all.
//
// The size was never the problem: 7.3k characters is ~1% of the context window. The
// problem was SILENT loss. So this module does not add an eighth splice. It makes the
// question "did everything arrive?" answerable:
//
//   1. EVERY PART IS MEASURED. Each context source is a provider with a byte count.
//   2. THE BUDGET IS EXPLICIT, and spent worst-priority-first, so a squeeze trims the
//      most expendable part rather than whatever happens to be last in the string.
//   3. WHAT WAS TRIMMED OR MISSING IS NAMED, in a footer, every time. A missing leg
//      and an empty leg are different facts — the same law get_context already applies
//      (grep -n "A missing leg is named, never silently absent" scripts/mcp-memory.mjs).
//      One law, now applied at both doors.
//
// CITATIONS ARE GREPS HERE, NOT LINE NUMBERS (dead-wire sweep, 11 Aug 2026). This file's
// comments carried 15 `<file>:<line>` citations and MEASURED today, 12 of them no longer
// pointed at what they name. learnstate has grown ~350 lines since they were written, so
// every one of its seven moved; organism_test's two moved; dugout's landed on a BLANK line.
// The worst was the one the tracer scored as a hit: mcp-memory's still resolves to code —
// the pending-facts block — but not to the missing-vs-empty law it was cited for, and a
// citation that resolves READS VERIFIED. This repo's whole method is verify-by-line, so a
// rotted citation does not merely fail to help: it argues the documented defect was never
// real, or sends the next repair at the wrong line. Same producer-with-no-consumer shape
// this module was built to abolish — evidence written down that nothing ever re-checked.
// The form is now the one CLAUDE.md itself switched to when fsrs.mjs's :143 rotted:
// `grep -n "<needle>" scripts/<file>.mjs` — pasteable, and it moves WITH the code. And it
// is no longer a convention: selftest() resolves EVERY anchor in this file against the real
// files on disk, and bans the bare line-number form, so the next one to rot fails the suite
// instead of quietly misleading a session.
//
// LAWS INHERITED (unchanged):
//   · READ-ONLY. Writes nothing. The single-writer law is untouched.
//   · REPAIR TOWARD SILENCE. Every provider is wrapped; a provider that throws is
//     recorded as ERROR and the rest of the brief renders exactly as before.
//   · ORGAN-SAFE. Callers must apply their own ARSENAL_ORGAN guard BEFORE calling
//     this — a headless `claude -p` organ prompt must never carry his memory.
//   · FROZEN BELOW. learnstate.mjs's brief() is untouched and still renders the
//     memory and card blocks in their canonical positions (above the LAWS line).
//     This module decides HOW MUCH each gets and REPORTS what it spent.
//
// MODES: node scripts/context_manifest.mjs         → the assembled brief itself (the
//                                                    default; CARRIES HIS MEMORY)
//        node scripts/context_manifest.mjs footer  → the manifest line only, as prose
//        node scripts/context_manifest.mjs ledger  → THE SAME ACCOUNTING AS STRUCTURE:
//                                                    one JSON line, and NEVER the text
//        node scripts/context_manifest.mjs sitting [--route R] [--concept c]
//                                                  → the SITTING BRAIN's head (sitting_system.md,
//                                                    Block 3 §6.4/§16 — assembleSittingSystem below)
//        node scripts/context_manifest.mjs selftest
// ============================================================================
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE = join(ROOT, "dressing-room", "state");
const PENDING_FACTS = join(ROOT, "dressing-room", "hippocampus", "identity_facts.pending.jsonl");

// THE CEILING — approved 5 Aug 2026 (D2) at 12,000, RE-DERIVED 18 Aug 2026 (OVERHAUL
// Block 1, §7.4/§13: "SessionStart brief < 6 KB"). The 5 Aug reasoning stands — bytes
// were never the binding constraint, ATTENTION is — and the overhaul applies it: every
// session start already calls the organism-memory MCP `get_context` (CLAUDE.md, step 1),
// which serves the WHOLE cartridge, the whole pending queue and the whole teaching card;
// the brief's copies of those were a second, budgeted, truncated rendering of the same
// store. Under 6 KB the brief keeps what get_context does NOT carry — the STATE line
// (learnstate prepends it OUTSIDE this ceiling) and the ORIENTATION (kickoff) — plus the
// card at its own cap, and squeezes pending facts and memory worst-priority-first, NAMING
// every cut in the footer, each cut carrying its own pointer to get_context.
// DERIVED, in BYTES (the DoD is `learnstate.mjs brief | wc -c` < 6,000): this module
// counts CHARS, and the brief is Hinglish with `·` `—` `✓` and emoji, so bytes run ahead
// of chars — MEASURED 18 Aug 2026: 5,507 chars assembled → 5,775 bytes (+268); the STATE
// line learnstate prepends outside this ceiling was 365 bytes. 6,000 − 400 (state line,
// one clipped line, measured 365) − 300 (multibyte inflation, measured 268) ⇒ 5,300.
// MEASURED the morning it changed: 12,000 → assembled 10,708 (orientation 2,762 · card
// 1,431 · pending 1,127 · memory 4,804) · 5,300 → the footer names what went, and the
// whole printed brief lands under 6,000 bytes.
export const CEILING = 5_300;
export const CEILING_LEGACY = 12_000; // the 5 Aug ceiling, frozen for the record (layering)
export const FOOTER_RESERVE = 260;    // the manifest line must always fit — it is the point
// MEMORY under the tight ceiling (18 Aug 2026). Two numbers, both derived, neither a guess:
//   MEMORY_CAP   — the most the cartridge may take: everything the ceiling leaves after the
//                  footer reserve. It was 6,000 of 12,000 ("headroom, not a trim"); with a
//                  live orientation + card the room is now a few hundred chars, and with a
//                  fixture orientation the whole 4,157-char cartridge still fits — so the
//                  47%-bug assertion keeps meaning what it meant: NO SILENT CUT, ever.
//   MEMORY_FLOOR — the least the cartridge keeps when pending facts are budgeted BEFORE it
//                  (assemble step 3 used to subtract the whole 6,000 cap here, which under
//                  5,300 would starve the pending queue to zero — a floor larger than the
//                  whole). Now it reserves exactly the pointer tail plus one head line of
//                  the ledger, so a squeezed brief always says WHERE the memory went
//                  (`get_context`) instead of hard-cutting the cartridge mid-word. Defined
//                  below MEMO_TAIL, from its measured length — no invented number.
export const MEMORY_CAP = CEILING - FOOTER_RESERVE;
export const MEMORY_CAP_LEGACY = 6_000;   // the 5 Aug value, frozen for the record
// …and since 11 Aug 2026 the reserve is MEASURED against, not merely assumed: the printed
// `assembled N` figure counts the footer itself, so a footer that outgrows 260 (DROPPED +
// render_probe + UNREADABLE notes stack fast) shows up as N > ceiling instead of hiding.

// ONE CLIP, TWO POINTERS (dead-wire sweep, 11 Aug 2026). The tail is now a parameter
// because the card's cut moved here from learnstate (see §2): memory's tail is this
// file's original wording, byte-for-byte, and the card's is verbatim the one its OWN owner
// writes — grep -n "full evidence in learning-layer" scripts/learnstate.mjs — so a card cut
// here does not send him to the memory door for the rest of it. Nothing about the memory
// path changes: the default IS the old string.
const MEMO_TAIL = "\n… (truncated — full recall via the organism-memory MCP `get_context`)";
const CARD_TAIL = "\n… (truncated — full evidence in learning-layer/HOW_HE_LEARNS.md)";
// The cartridge's first line is its own head — "THE LEDGER OF SELF (facts he told you to
// hold — ALWAYS present, never guessed):" — 79 chars, measured 18 Aug 2026:
// grep -n "THE LEDGER OF SELF (facts he told you to hold" scripts/hippocampus.mjs
// Floor = that head + the pointer tail.
export const MEMORY_FLOOR = 79 + MEMO_TAIL.length;
// THE TAIL LIVES INSIDE THE CAP (audit 16 Aug 2026 — the baseline RED that stopped the
// truth layer before its first line). This was `s.slice(0, n) + tail`, i.e. a function
// called "clip to n" that returns n + tail.length, EVERY time it fires. MEASURED on live
// state that morning: memCap 5,999 → memory came back 6,070, the brief assembled at
// 12,005 against a 12,000 ceiling, and the suite went red on the one end-to-end ceiling
// check this organism owns. The 71 characters were never anybody's to spend: the budget
// above sets aside FOOTER_RESERVE precisely so the footer fits, and this helper quietly
// spent past every reservation the caller made.
// It is the SAME SHAPE as the two defects already recorded in this file — the 6 Aug
// `trimmed` fix and the 10 Aug `memFull` fix — a cut that misreports its own size, here
// misreporting it to the BUDGET rather than to the reader. NO NEW ENGINE, nothing frozen:
// the parts, their order and both tails are byte-identical; only the arithmetic is true.
// A cap too small to hold the notice takes a hard cut instead — a truncation marker that
// itself overflows is the same bug in a smaller coat.
const clipTo = (s, n, tail = MEMO_TAIL) => {
  if (typeof s !== "string" || s.length <= n) return s;
  return n <= tail.length ? s.slice(0, Math.max(0, n)) : s.slice(0, n - tail.length) + tail;
};

// ── PENDING IDENTITY FACTS ───────────────────────────────────────────────────
// Law 4: remember_fact STAGES, it never writes canon. mcp-memory.mjs surfaces this
// queue because a staged fact with no surface to be confirmed on is a fact that rots.
// get_context was the only door that showed it, and get_context is a call a model has
// to remember to make — which is the exact failure mode this whole audit is about.
// THE THREE STATES ARE THREE FACTS (audit 6 Aug 2026). This module's own header says
// "a missing leg and an empty leg are different facts" — and then rendered a file that
// does not exist, a healthy queue with nothing in it, and an unreadable file as the SAME
// footer string, `pending_facts MISSING (0 staged)`. Its selftest pinned that. The word
// MISSING on a queue that is simply empty reads as breakage; the word EMPTY on a file
// that is genuinely gone reads as fine. Each now says which one it is.
//
// THE DOOR WAS CUTTING THE VERY THING IT EXISTS TO SHOW (audit 10 Aug 2026). This block
// rendered `.slice(0, 160)` per row — no ellipsis, no field naming the loss — and only
// `rows.slice(-5)` of them while the header printed the FULL count. MEASURED against the
// live queue that morning: all 3 staged rows are EXACTLY 400 characters, so 720 characters
// of HIS OWN RULINGS were dropped at every SessionStart, cut mid-word — row 0 lost "i do
// not rush things, i execute them perfectly", row 1 lost the Gaffer-ban removal — and the
// block then told the session to ask him to confirm or drop a fact it had shown 40% of.
// A silent cut, inside the module built to abolish silent cuts. Same shape as the capsule
// door in dugout.mjs — JSON.stringify + cut at 220 — found the same day:
// grep -n "each whole axis object and cut the STRING at 220" scripts/dugout.mjs
//
// A QUEUE THAT WILL NOT PARSE IS NOT AN EMPTY QUEUE (audit 10 Aug 2026). The per-line
// reader below swallowed every JSON.parse failure in a bare `catch {}`, so a truncated
// append or an encoding-mangled file produced zero rows — and zero rows fell straight
// into the `EMPTY` return, the word this block's own header three paragraphs up reserves
// for "a healthy queue with nothing in it". A corrupt staging queue therefore read as
// FINE at every SessionStart, forever, with `pending_facts EMPTY (0 staged)` in the
// footer: exactly the rot that surfacing this queue at all (Law 4) was built to prevent,
// and the same shape as the three silent-loss defects already named in this file. The
// damage is worst precisely when it matters most — the rows are HIS OWN RULINGS awaiting
// his word, and a lost one is never asked about again.
// UNREADABLE ROWS ARE NOW COUNTED, and the count decides the word: nothing parsed and
// something was there → ERROR; nothing there at all → EMPTY. A PARTIAL corruption (some
// rows readable, some not) still renders — a readable fact must never be held hostage to
// an unreadable neighbour — but the block AND the footer both name the rows they could
// not read, the same way a budget squeeze already names what it hid.
// NO NEW ENGINE, so nothing new is frozen: the renderer below is byte-for-byte the
// 10 Aug one and pendingFactsBlockLegacy stays the frozen pre-repair door. What changed
// is CLASSIFICATION — which is how the EMPTY/MISSING/ERROR split itself landed on 6 Aug,
// also without a freeze. The legacy keeps the old swallow on purpose: it is the control
// the selftest measures this door against.
//
// THE 160 IS GONE, NOT RE-TUNED — no new number replaces it. Every row is ALREADY clipped
// to 400 characters by its OWNER at the staging door — two hits, the live door and its
// frozen legacy: grep -n "clip(text, 400)" scripts/mcp-memory.mjs — and the same clip is in
// the hippocampus, which calls 400 "not a new number either":
// grep -n "400 is not a new number either" scripts/hippocampus.mjs
// So a second cut here was a cut on top of a cut, and the only one nobody named. What bounds this block
// instead is a BUDGET the caller derives from the constants already in this file — see
// assemble() step 3 — and when that budget bites, the block AND the footer both say by how
// much. The pre-repair renderer is frozen verbatim below as pendingFactsBlockLegacy
// (LAYERING law: the old engine stays in the same file, named, so flipping back is one edit).
export function pendingFactsBlock(path = PENDING_FACTS, budget = Infinity) {
  try {
    if (!existsSync(path)) return { present: false, state: "MISSING", text: "", count: 0, shown: 0, hidden: 0, cut: 0, bad: 0 };
    const rows = [];
    let bad = 0;                                    // rows that are DAMAGE, not absence — see the note above
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const s = line.trim();
      if (!s) continue;
      let j = null;
      try { j = JSON.parse(s); } catch { bad++; continue; }        // truncated append / mangled encoding
      if (!j || typeof j !== "object") { bad++; continue; }        // a bare scalar is not a staged fact
      if ((j.status || "pending") !== "pending") continue;         // confirmed or dropped = healthily gone
      if (!j.text) { bad++; continue; }                            // claims pending, carries nothing
      rows.push(j);
    }
    // NOTHING PARSED but something WAS there → the file is unreadable, not empty. ERROR is
    // its own word here precisely so the footer stops saying "healthy" over a rotting queue.
    if (!rows.length) return { present: false, state: bad ? "ERROR" : "EMPTY", text: "", count: 0, shown: 0, hidden: 0, cut: 0, bad, error: !!bad };

    const head = `--- PENDING IDENTITY FACTS — ${rows.length} staged, awaiting HIS word (Law 4: nothing is canon until he says so) ---`;
    const foot = `  → ask him to confirm or drop each; only he promotes it (hippocampus.mjs is the single writer).`;
    const frame = (p, body) => `  · "${body}"   (staged ${String(p.ts || "").slice(0, 10) || "?"})`;
    const mark = (n) => `… (+${n} chars cut — full text via the organism-memory MCP \`get_context\`)`;
    const hiddenLine = (n) => `  · … ${n} older staged fact${n === 1 ? "" : "s"} not shown (budget) — get_context serves the whole queue.`;
    // PARTIAL DAMAGE IS SPOKEN, not swallowed: readable rows still render (a good fact is
    // never held hostage to a broken neighbour), and the broken ones are named right here
    // where he can act on them, because only the owner may touch that file.
    const badLine = (n) => `  · !! ${n} row${n === 1 ? "" : "s"} UNREADABLE (corrupt/truncated JSON) — those staged facts cannot be shown; hippocampus.mjs owns the file.`;

    // Room is spent NEWEST-FIRST, which is exactly the priority slice(-5) already had; what
    // changes is that whatever it cannot afford is NAMED instead of vanishing. The worst-case
    // "not shown" line is reserved up front, so the reserve can only go unspent, never
    // overdrawn — this block must never lie about its own size to the manifest. The damage
    // line is reserved the same way, and only when there IS damage, so a clean queue pays
    // nothing for it.
    let room = budget - head.length - foot.length - hiddenLine(rows.length).length
      - (bad ? badLine(bad).length + 1 : 0) - 2;
    const kept = [];
    let cut = 0, i = rows.length - 1;
    for (; i >= 0; i--) {
      const p = rows[i];
      const full = String(p.text).replace(/\s+/g, " ").trim();
      const cost = frame(p, full).length + 1;
      if (cost <= room) { kept.unshift(frame(p, full)); room -= cost; continue; }
      // It will not fit whole. Clip only as far as the budget FORCES, and say by how much.
      // mark(full.length) is the widest that marker can ever be, so this can never overrun.
      const spare = room - (frame(p, "").length + 1) - mark(full.length).length;
      if (spare > 0) {
        cut += full.length - spare;
        kept.unshift(frame(p, full.slice(0, spare) + mark(full.length - spare)));
        room = 0;
        i--;                                        // this row IS rendered; only older ones are hidden
      }
      break;
    }
    const hidden = i + 1;
    // THE COLLAPSED FORM (18 Aug 2026, Block 3 — measured on live state that morning: the block
    // spent 284 chars of a 5,300 ceiling to show ZERO facts — head + foot + "4 not shown" —
    // and that ceremony was exactly what starved the intents block to nothing). A block that
    // carries no fact says its count and its pointer in ONE line; the count and the pointer
    // ARE the whole point of the block, the head/foot frame is not.
    if (!kept.length) {
      const one = `--- PENDING IDENTITY FACTS: ${rows.length} staged, none shown here (budget) — get_context serves the whole queue; only he promotes (hippocampus.mjs)${bad ? ` · !! ${bad} row(s) UNREADABLE` : ""} ---`;
      return { present: true, state: "ok", count: rows.length, shown: 0, hidden: rows.length, cut: 0, bad, collapsed: true, text: one };
    }
    // A budget too small even for head+foot is pathological (it can only come from an absurd
    // ceiling), and the honest answer there is still to speak: the header count and the
    // "not shown" line are the whole point of the block. The manifest's `assembled X/ceiling`
    // reports the true size either way, so an overrun is visible rather than silent.
    return {
      present: true,
      state: "ok",
      count: rows.length,
      shown: kept.length,
      hidden,
      cut,
      bad,
      text: [head, ...kept, ...(hidden ? [hiddenLine(hidden)] : []), ...(bad ? [badLine(bad)] : []), foot].join("\n"),
    };
  } catch { return { present: false, state: "ERROR", text: "", count: 0, shown: 0, hidden: 0, cut: 0, bad: 0, error: true }; }
}

// FROZEN 10 Aug 2026 — the pre-repair renderer, verbatim (LAYERING law, precedents:
// hippocampus.mjs identityCartridgeLegacy · dugout.mjs capsuleProjectionLegacy ·
// fsrs.mjs buildStoreLegacy). Kept because the selftest above measures the new door
// AGAINST it: the assertion that would catch a re-introduced cut is "the legacy loses
// characters on the live queue and the new one does not", and that assertion needs the
// old engine to still be runnable, not merely described in a comment.
function pendingFactsBlockLegacy(path = PENDING_FACTS) {
  try {
    if (!existsSync(path)) return { present: false, state: "MISSING", text: "", count: 0 };
    const rows = [];
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const s = line.trim();
      if (!s) continue;
      try { const j = JSON.parse(s); if (j && j.text && (j.status || "pending") === "pending") rows.push(j); } catch {}
    }
    if (!rows.length) return { present: false, state: "EMPTY", text: "", count: 0 };
    const shown = rows.slice(-5).map((p) =>
      `  · "${String(p.text).replace(/\s+/g, " ").trim().slice(0, 160)}"   (staged ${String(p.ts || "").slice(0, 10) || "?"})`);
    return {
      present: true,
      state: "ok",
      count: rows.length,
      text: `--- PENDING IDENTITY FACTS — ${rows.length} staged, awaiting HIS word (Law 4: nothing is canon until he says so) ---\n`
        + shown.join("\n")
        + `\n  → ask him to confirm or drop each; only he promotes it (hippocampus.mjs is the single writer).`,
    };
  } catch { return { present: false, state: "ERROR", text: "", count: 0, error: true }; }
}

// ── THE ASSEMBLER ────────────────────────────────────────────────────────────
// deps are injectable so the selftest never needs the real disk, the real
// hippocampus, or a network.
export async function assemble(deps = {}) {
  const dir = deps.dir || STATE;
  const now = deps.now || Date.now();
  const ceiling = Number.isFinite(deps.ceiling) ? deps.ceiling : CEILING;
  const spent = [];
  // `state` is the WORD the footer prints: ok · EMPTY · MISSING · ERROR. It defaults from
  // `present` so every existing caller keeps its old meaning, and only the parts that can
  // genuinely be empty-but-healthy pass an explicit one.
  const record = (id, present, bytes, note, state) =>
    spent.push({ id, present, bytes, note: note || null, state: state || (present ? "ok" : "MISSING") });

  const ls = deps.learnstate || await import("./learnstate.mjs");
  const brief = ls.brief;

  // 1. ORIENTATION — the frozen brief with no memory and no card. brief()'s own
  //    selftest pins this as byte-for-byte the pre-31-Jul brief, so it is the one
  //    part whose size we can treat as a fixed floor.
  let base = "";
  try { base = brief(dir, now, null, null); record("orientation", true, base.length); }
  catch (e) { record("orientation", false, 0, "ERROR " + (e && e.message), "ERROR"); }

  // 2. TEACHING CARD — single-sourced from HOW_HE_LEARNS.md via learnstate's parser.
  // THREE STATES, ON THIS LEG TOO (audit 11 Aug 2026). This catch was `catch { card = null; }`
  // and the note was a flat string picked off `!!card`, so a THROW out of loadTeachingCard —
  // a mangled HOW_HE_LEARNS.md, a parser that blew up — rendered the identical footer word as
  // a file that simply has no marker in it. Same shape as the memory leg at §4 and the same law
  // this module already applies twice: to pending_facts on 6 Aug ("a missing leg and an empty leg
  // are different facts") and to render_probe on 10 Aug. It had never been applied to either of
  // the module's own two primary legs — the ones the whole assembler exists to deliver.
  // The error MESSAGE rides the note, because "which way did it break" is the first thing anyone
  // asks and it was being thrown away at the catch.
  //
  // THE CARD WAS CLIPPED BY A NUMBER THIS MODULE COULD NOT SEE (dead-wire sweep, 11 Aug 2026).
  // The call below was `ls.loadTeachingCard()` — bare — and learnstate cut at its own private
  // CARD_MAX (1800) and handed back the SHORT string, which `record` then billed as the card's
  // true size with the note hardcoded null. So this leg could never print TRIMMED: the identical
  // defect the memory leg carried until 10 Aug, where `TRIMMED from 1523` was reported on a cut
  // from 3,856. The 5 Aug audit moved MEMO_MAX's authority to this module and the 10 Aug repair
  // made memory pass NO_CAP and clip locally; CARD_MAX got neither, even though learnstate
  // exports it saying, in its own words, that it "rides along so a consumer can state the cap it
  // is honouring instead of inventing its own" — grep -n "CARD_MAX rides along" scripts/learnstate.mjs
  // — and the export has been sitting there unread. The consumer never asked. MEASURED 11 Aug: the
  // live card body is 1,431 chars against the 1800 cap, so it does NOT bite today — this is the
  // seventeen-rule card growing that would have made the footer lie, silently, exactly once.
  //
  // NO NEW NUMBER IS INVENTED. The cap is learnstate's OWN CARD_MAX, now read across the export
  // that exists for it; if that export is ever unreadable this module does not guess a
  // replacement — it takes the card whole, SAYS so in the note, and lets the pending and memory
  // budgets below (which are derived and which already self-report) do the squeezing out loud.
  // NO NEW ENGINE, so nothing is frozen: same call as the 6 Aug `trimmed` fix and the 10 Aug
  // `memFull` fix, both of which corrected this module's accounting in place. The parser, the
  // parts, their order and the clipped output are untouched — only the reported number and the
  // place the scissors live change.
  const NO_CAP = Number.MAX_SAFE_INTEGER;   // not a threshold: loadTeachingCard/loadMemory clip
                                            // only when length > cap, so "hand it over whole"
  const cardCap = Number.isFinite(ls.CARD_MAX) ? ls.CARD_MAX : NO_CAP;
  let card = null, cardFull = 0, cardClipped = false, cardErr = null;
  try {
    card = deps.card !== undefined ? deps.card : ls.loadTeachingCard(undefined, NO_CAP);
    // Only a caller injecting deps.card can state a pre-cut size we did not read ourselves —
    // the same precedence deps.memoryFullLength gets at §4.
    cardFull = deps.cardFullLength !== undefined ? deps.cardFullLength : (card ? card.length : 0);
    if (card && card.length > cardCap) { card = clipTo(card, cardCap, CARD_TAIL); cardClipped = true; }
  }
  catch (e) { card = null; cardErr = (e && e.message) || String(e); }
  // The note no longer re-prints the state word: the footer already renders `card <state>` ahead
  // of it, so `MISSING (marker or file absent)` was shipping as `card MISSING (MISSING (marker or
  // file absent))` at every SessionStart. Measured 11 Aug 2026, both legs.
  record("card", !!card, card ? card.length : 0,
    card
      ? cardClipped ? `TRIMMED from ${cardFull} — cap ${cardCap}`
        : cardCap === NO_CAP ? "no cap declared (learnstate.CARD_MAX unreadable) — card taken whole"
        : null
      : cardErr ? `loadTeachingCard threw (${cardErr})` : "marker or file absent",
    card ? "ok" : cardErr ? "ERROR" : "MISSING");

  // OVERHEAD IS MEASURED, NOT GUESSED (audit 6 Aug 2026). This was `3 * 90` — a hunch,
  // against his standing rule of 1 Aug: no number goes in by guess. brief() renders its
  // wrapper/label lines only when memory and card are TRUTHY, so a one-character probe
  // of each yields the exact wrapper cost: (probe render − base) − the 2 probe chars.
  // MOVED ABOVE STEP 3 on 10 Aug 2026: both budgets below are derived from it now, and
  // the pending budget is computed first. The probe itself is unchanged.
  let overhead = 3 * 90;                          // fallback only if the probe cannot render
  // THE PROBE'S SILENCE WAS ITS OWN DEFECT (audit 10 Aug 2026). This catch was empty. But the
  // probe IS the truthy path — `brief(dir, now, "X", "Y")` is the same call shape §5 makes with
  // the real memory and card — so a probe that throws is the EARLIEST honest warning that the
  // final render will drop both, and it also silently reinstated the 270-char hunch this very
  // block was written to abolish. Recorded ONLY on failure, so a healthy footer stays
  // byte-identical to every footer printed before today.
  try { const probe = brief(dir, now, "X", "Y"); if (probe && probe.length > base.length) overhead = probe.length - base.length - 2; }
  catch (e) { record("render_probe", false, 0, `truthy-path render threw (${(e && e.message) || e}) — overhead fell back to ${overhead}`, "ERROR"); }

  // 3. PENDING FACTS — computed before memory so its cost is known to the budget.
  // ITS BUDGET IS DERIVED, NOT CHOSEN (audit 10 Aug 2026, the 160-char cut above): it is
  // whatever the ceiling still holds once orientation, the card, memory's reserved floor
  // and the footer reserve are set aside — every term already a constant in this file, so
  // no threshold is invented. RAN 10 Aug on live state: budget 2,551 against a 1,487-char
  // full render of all 3 staged rows, memory unchanged at 3,856 — nothing was cut then, and
  // the day it is, the block's own "not shown"/"chars cut" lines and this footer both say so.
  // 18 Aug 2026 (ceiling 12,000 → 5,300): the term subtracted here was MEMORY_CAP — the
  // cartridge's whole 6,000 headroom — which under 5,300 exceeds the ceiling and would
  // budget the pending queue at ZERO forever. It is MEMORY_FLOOR now (the ledger's head
  // line + the get_context pointer): his rulings awaiting his word are budgeted BEFORE the
  // background cartridge that get_context serves whole anyway, and memory still always
  // keeps its pointer. Same order of parts, same footer grammar; only the reserve is true.
  // THE INTENTS FLOOR (18 Aug 2026, Block 3 — the Block-2 DoD "a new session's brief lists
  // yesterday's open intents" was FAILING on live state the very next session: pending
  // facts rendered 284 chars to say "4 NOT SHOWN" and intents got 0 (`intents 0 (1 open,
  // NONE SHOWN — budget)`), because pending was budgeted first and intents had no floor —
  // the one leg an earlier leg could zero). Like MEMORY_FLOOR: when the owner has intents,
  // its header + first line are reserved OUT of the pending budget. DERIVED from the
  // owner's own lines (their measured lengths), never a chosen number.
  const intentsLinesEarly = await (async () => { try { const l = deps.intents !== undefined ? deps.intents : (await import("./intent.mjs")).briefLines({}); return Array.isArray(l) ? l : []; } catch { return []; } })();
  // Block 8 (18 Aug 2026, §16 8g): the floor is the header + TWO intent rows (three lines), not one —
  // measured on the 18 Aug 16:40 IST SessionStart: `intents 0 (5 open, NONE SHOWN — budget)` with a
  // 1,431-char card and a 2,748-char orientation; a one-row floor reserved out of the PENDING budget
  // was still zeroed at render because the room there was computed AFTER pending and memory's floor.
  // So the floor is now also HELD AT RENDER (§3b): the intents leg gets at least this many chars and
  // memory (budgeted after it, with its own floor) absorbs the difference. Still DERIVED from the
  // owner's own line lengths, never a chosen number.
  const INTENTS_FLOOR_ROWS = 2;
  const INTENTS_FLOOR = intentsLinesEarly.length >= 2
    ? intentsLinesEarly.slice(0, 1 + INTENTS_FLOOR_ROWS).reduce((n, l) => n + l.length + 1, 0)
    : 0;
  const pendBudget = Math.max(0, ceiling - base.length - (card ? card.length : 0)
    - MEMORY_FLOOR - INTENTS_FLOOR - FOOTER_RESERVE - overhead);
  let pend = deps.pending !== undefined ? deps.pending : pendingFactsBlock(PENDING_FACTS, pendBudget);
  // A HEADER THAT SHOWS NO FACT YIELDS TO HIS ASKS (18 Aug 2026, evening — the live RED above).
  // pendingFactsBlock at budget 0 still renders its ~139-char collapsed header ("N staged, none
  // shown — get_context serves the queue"). That header carries no ruling; the footer prints the
  // same count and the same pointer. When it is the one thing standing between the intents floor
  // (his open asks) and the ceiling, the header steps aside — the ledger row stays `pending_facts 0
  // (N staged, N NOT SHOWN — budget; header yielded to intents)`, present:false so the render below
  // skips it. Order of parts is untouched: pending still ranks first whenever it shows a fact.
  let pendYielded = false;
  if (pend.present && pend.collapsed && INTENTS_FLOOR > 0) {
    const roomWith = ceiling - base.length - (card ? card.length : 0) - (pend.text.length + 1) - FOOTER_RESERVE - overhead;
    if (roomWith < INTENTS_FLOOR && roomWith + pend.text.length + 1 >= INTENTS_FLOOR) {
      pend = { ...pend, present: false, yielded: true, text: "" }; pendYielded = true;
    }
  }
  if (pendYielded) record("pending_facts", true, 0, `${pend.count} staged, ${pend.hidden} NOT SHOWN — budget; header yielded to intents`, "ok");
  else
  // UNREADABLE ROWS RIDE THE FOOTER (audit 10 Aug 2026). The reader can now tell damage from
  // absence, but a classification nobody prints is the producer-with-no-consumer shape all over
  // again — this footer is the only surface the SessionStart brief actually carries, so the
  // count lands here in both shapes: `ERROR (N rows UNREADABLE — nothing parsed)` when the whole
  // queue is rubble, and `… , N rows UNREADABLE` alongside the staged count when only some is.
  record("pending_facts", !!pend.present, pend.present ? pend.text.length : 0,
    pend.present
      ? `${pend.count} staged`
        + (pend.hidden ? `, ${pend.hidden} NOT SHOWN — budget` : "")
        + (pend.cut ? `, ${pend.cut} chars CUT — budget` : "")
        + (pend.bad ? `, ${pend.bad} rows UNREADABLE` : "")
      : pend.bad ? `${pend.bad} rows UNREADABLE — nothing parsed` : "0 staged",
    pend.state);

  // 3b. SESSION INTENTS (OVERHAUL Block 2 · §7.2, 18 Aug 2026) — the last five OPEN
  //     intents (his asks, what shipped, what is still open) from intent.mjs's own
  //     `briefLines()` — ≤ 6 lines by that owner's contract. Budgeted BEFORE memory
  //     (an unmet ask outranks background recall that get_context serves whole) and
  //     AFTER pending facts (his rulings awaiting his word). Its cap is DERIVED from
  //     the owner's shape, not chosen: 6 lines × the owner's own line width. When the
  //     ceiling cannot hold every line, whole lines are dropped from the END (never a
  //     mid-line cut) and the footer says how many. THREE STATES, like every leg:
  //     EMPTY = nothing open (healthy) · MISSING = the owner is unreachable · ERROR
  //     = it threw (message in the note). The digest job's consumption stamp rides
  //     the printed block (learnstate: `intent_digest briefed`), so a squeezed-out
  //     block is honestly NOT consumption.
  const INTENTS_MAX_LINES = 6, INTENTS_LINE_WIDTH = 160;   // the owner's shape: ≤6 lines, each ≤ ~160 chars
  const INTENTS_CAP = INTENTS_MAX_LINES * INTENTS_LINE_WIDTH;
  let intentsText = "", intentsShown = 0, intentsTotal = 0, intentsErr = null, intentsState = "EMPTY";
  try {
    const lines = intentsLinesEarly;   // read ONCE (above, for the floor); the same rows render here
    if (Array.isArray(lines) && lines.length) {
      intentsTotal = lines.length;
      // Block 8: the floor is HELD here — header + INTENTS_FLOOR_ROWS rows at least (memory, budgeted after, absorbs it)
      // 18 Aug 2026 (evening, suite RED on live state: `assembled 5399/5300`): the floor was held
      // AGAINST THE CEILING — `Math.max(INTENTS_FLOOR, …)` with no upper bound — so once orientation
      // grew (2,748 → 3,035 chars: the sitting line, the Gaffer lines) the floor pushed the whole brief
      // past 5,300. Block 8's own words say who absorbs it: MEMORY. So the floor is held against the
      // room memory would otherwise get (nonMemRoom), never against the ceiling itself: the intents leg
      // gets min(floor, everything-but-memory) at least, and the ceiling stays the ceiling.
      const nonMemRoom = ceiling - base.length - (card ? card.length : 0) - (pend.present ? pend.text.length + 1 : 0) - FOOTER_RESERVE - overhead;
      const room = Math.max(Math.min(INTENTS_FLOOR, nonMemRoom), Math.min(INTENTS_CAP, nonMemRoom - MEMORY_FLOOR));
      const kept = [];
      let used = 0;
      for (const l of lines) { if (used + l.length + 1 > room) break; kept.push(l); used += l.length + 1; }
      // the header alone is not an intent — a block that lost every intent line reads as squeezed out
      if (kept.length >= 2) { intentsText = kept.join("\n"); intentsShown = kept.length; intentsState = "ok"; }
      else { intentsShown = 0; intentsState = "ok"; }
    }
  } catch (e) { intentsErr = (e && e.message) || String(e); intentsState = "ERROR"; }
  record("intents", intentsShown > 0, intentsText.length,
    intentsErr ? `intent.mjs threw (${intentsErr})`
      : intentsTotal === 0 ? "nothing open"
      : intentsShown === 0 ? `${intentsTotal - 1} open, NONE SHOWN — budget`
      : intentsShown < intentsTotal ? `${intentsShown - 1} of ${intentsTotal - 1} open shown — budget`
      : `${intentsTotal - 1} open`,
    intentsState);

  // 4. MEMORY — gets whatever is left, which today is all of it. THE WHOLE POINT:
  //    the cap is computed from the budget rather than being a constant that silently
  //    ate 47% of the cartridge, and if it ever DOES bite, the footer says so.
  const room = ceiling - base.length - (card ? card.length : 0) - (pend.present ? pend.text.length : 0)
    - (intentsText ? intentsText.length + 1 : 0)   // Block 2: the intents block is spent before memory
    - FOOTER_RESERVE - overhead;
  const memCap = Math.max(0, Math.min(MEMORY_CAP, room));
  let memory = null, memFull = 0, clipped = false, memErr = null;
  try {
    // THE FULL LENGTH IS READ BEFORE THE CUT, NOT AFTER (audit 10 Aug 2026). This
    // module used to call `loadMemory(memCap)` — which does its OWN clip
    // (grep -n "raw.slice(0, n)" scripts/learnstate.mjs)
    // and returns the already-shortened string — and then measured memFull off that return
    // value. So memFull WAS the trimmed length, and the footer printed `TRIMMED from N`
    // where N equalled the trimmed size itself: a cut from 1523 to 1523. RAN 10 Aug on live
    // state: true cartridge 3,856 chars, assemble({ceiling:6000}) → `memory 1523 (TRIMMED
    // from 1523 — budget)`. 2,333 characters gone, reported as zero characters gone — the
    // third time this exact silent-loss shape has been found inside this module's own ledger
    // (see the two notes below), and the one place it is least excusable. The live path never
    // hit it in the suite because only the selftest injected deps.memoryFullLength (4157),
    // so every assertion ran green straight over the defect.
    //
    // NO_CAP is not a threshold and not a guess — it is a sentinel derived from loadMemory's
    // own contract: it clips only when `raw.length > n`, so any n no string can exceed means
    // "hand me the cartridge whole". The budget is then spent HERE, by clipTo, which is where
    // learnstate already says it belongs — "the party which knows the whole budget
    // (context_manifest.mjs) decides the share, and says out loud whenever it had to cut"
    // (grep -n "party which knows the whole budget" scripts/learnstate.mjs).
    // Output is byte-identical to before; only the reported number becomes true.
    const NO_CAP = Number.MAX_SAFE_INTEGER;
    memory = deps.memory !== undefined ? deps.memory : await ls.loadMemory(NO_CAP);
    // deps.memoryFullLength stays honoured FIRST: a caller injecting deps.memory hands us a
    // string we did not read, so only it can state the pre-cut size.
    memFull = deps.memoryFullLength !== undefined ? deps.memoryFullLength : (memory ? memory.length : 0);
    // TRIMMED IS TRACKED, NOT INFERRED (audit 6 Aug 2026). It used to be computed as
    // `memFull > memory.length` AFTER clipping — but clipTo appends a ~70-char "…
    // (truncated)" tail, so whenever the overflow was smaller than that tail the clipped
    // string came out LONGER than the original and the comparison read false. Real loss,
    // reported as no loss: the exact silent-drop this module exists to abolish, reproduced
    // inside its own accounting. The flag is now set where the cut happens.
    if (memory && memory.length > memCap) { memory = clipTo(memory, memCap); clipped = true; }
  } catch (e) { memory = null; memErr = (e && e.message) || String(e); }
  const trimmed = clipped || !!(memory && memFull > memory.length);
  // A THROW IS NOT AN ABSENCE — AND THIS IS THE LEG WHERE IT COSTS MOST (audit 11 Aug 2026).
  // This catch was `catch { memory = null; }` and the note read `MISSING (hippocampus
  // unreadable)` off `!memory` alone, so the day episodes.jsonl goes corrupt or
  // buildRehydrateCartridge throws, his SessionStart footer says exactly what it says when
  // there is simply nothing stored yet — and the reason is discarded at the catch. RAN before
  // the repair, injecting a loadMemory that throws vs one that returns null: both printed
  // `memory MISSING (MISSING (hippocampus unreadable))`, IDENTICAL, and the doubled MISSING is
  // the second half of the same bug (the footer already prints the state word).
  // "hippocampus unreadable" was itself the wrong word for the common case: null is what
  // loadMemory returns for an ORGAN run and for a store with nothing in it, neither of which
  // is unreadable. MISSING now says only what is true, ERROR carries the message.
  // NO NEW ENGINE, so nothing is frozen: this is a CLASSIFICATION change, which is how the
  // EMPTY/MISSING/ERROR split itself landed on pending_facts (6 Aug) and on render_probe
  // (10 Aug) — the parts, their order and the footer's grammar are untouched.
  record("memory", !!memory, memory ? memory.length : 0,
    memory ? (trimmed ? `TRIMMED from ${memFull} — budget` : null)
      : memErr ? `loadMemory threw (${memErr})` : "nothing returned (empty store, or an organ run)",
    memory ? "ok" : memErr ? "ERROR" : "MISSING");

  // 5. RENDER. brief() places memory and card in their canonical slots (above LAWS);
  //    this module never re-orders them, it only decides how much they get.
  //
  // THE LEDGER IS RECONCILED AGAINST THE TEXT THAT ACTUALLY SHIPPED (audit 10 Aug 2026).
  // Every row above was recorded BEFORE this render and nothing ever checked them against
  // it. So the fallback below — `catch { text = base }`, and `base` is by definition the
  // render with NO memory and NO card — dropped both legs while the footer, computed from
  // those stale rows, certified both as delivered. RAN 10 Aug with a stub brief() that
  // throws only on the truthy path (which is precisely how this fails in life: a bug in
  // the memory or card block cannot show up in the `base` probe, because that probe passes
  // nulls): text contained neither leg, footer read
  //   `orientation 13 · card 99 · pending_facts EMPTY (0 staged) · memory 3856 · assembled 13/12000`
  //   (that `13` is the pre-11-Aug body-only figure; the same run today prints the whole
  //   shipped length — see the fixed point below. The lie it exposes is unchanged.)
  // — the manifest's one job, inverted, at the single moment it matters most.
  //
  // The fallback itself is UNCHANGED — a brief must never be the thing that breaks
  // SessionStart, the same law learnstate repeats at every one of its own providers:
  // grep -n "a brief must never be the thing that breaks SessionStart" scripts/learnstate.mjs
  // What changes is that the ledger stops being an assumption and becomes an observation:
  // brief() splices both legs VERBATIM and joins on "\n" —
  // grep -n "L.push(memory)" scripts/learnstate.mjs · grep -n "L.push(card)" scripts/learnstate.mjs
  // — so "is it in the delivered string?" is an exact, cheap test, not a heuristic. That also
  // catches the wider class, not just the throw: any future brief() that silently ignores
  // an argument now reads DROPPED instead of being billed as sent.
  let text, renderErr = null;
  try { text = brief(dir, now, memory, card); }
  catch (e) { text = base; renderErr = (e && e.message) || String(e); }
  const reconcile = (id, part) => {
    if (!part || (typeof text === "string" && text.includes(part))) return;
    const row = spent.find((s) => s.id === id);
    if (!row) return;
    row.present = false; row.bytes = 0; row.state = "DROPPED";
    row.note = renderErr
      ? `render threw (${renderErr}) — fell back to orientation-only`
      : "not present in the rendered brief";
  };
  reconcile("memory", memory);
  reconcile("card", card);
  if (pend.present) text += "\n" + pend.text;
  // THE CEILING IS A HARD GUARANTEE, NOT A BUDGET ESTIMATE (18 Aug 2026, evening). Every budget
  // above is derived from FOOTER_RESERVE and a measured overhead; when the live parts still add
  // up past the ceiling (the 5,399/5,300 RED), the last thing added is the first thing trimmed —
  // whole intent rows from the END, never a mid-line cut, the header last — and the ledger says
  // how many. Same law the sitting head already applies (grep -n "whole vs the ceiling" below).
  {
    const bodyBefore = text;
    let rows = intentsText ? intentsText.split("\n") : [];
    const fits = () => {
      const t = rows.length ? bodyBefore + "\n" + rows.join("\n") : bodyBefore;
      return t.length + 1 + FOOTER_RESERVE <= ceiling || rows.length === 0;
    };
    let droppedRows = 0;
    while (!fits()) { rows.pop(); droppedRows++; }
    if (droppedRows) {
      if (rows.length < 2) { rows = []; }   // the header alone is not an intent
      intentsText = rows.join("\n");
      const row = spent.find((s) => s.id === "intents");
      if (row) {
        row.bytes = intentsText.length; row.present = rows.length > 0;
        row.note = rows.length ? `${rows.length - 1} of ${intentsTotal - 1} open shown — ceiling` : `${intentsTotal - 1} open, NONE SHOWN — ceiling`;
      }
    }
  }
  if (intentsText) text += "\n" + intentsText;   // Block 2 §7.2 — after his rulings, before the footer

  // THE NUMBER THAT SHIPS IS THE SIZE THAT SHIPPED (audit 11 Aug 2026). One line, two holes:
  //   (a) `total` was `text.length + FOOTER_RESERVE` — the RESERVE, never the footer. RAN on
  //       live state today: body 8,998 · footer 117 · returned string 9,116 · `total` said
  //       9,258. A third number, matching neither the body nor the brief, wrong by 142.
  //   (b) It had NO consumer. The SessionStart path takes `out.text` only —
  //       grep -n "let out = await assemble(" scripts/learnstate.mjs (a `let` since the 18 Aug BYTE GUARD re-assembles once when the whole brief overruns 6,000 bytes) — and the suite reads the
  //       PRINTED footer: grep -n "reports its byte manifest" scripts/organism_test.mjs
  //       So the wrong estimate was computed and discarded at every SessionStart. And the
  //       printed `assembled` figure was the BODY, footer excluded, which means the one ceiling
  //       check this organism owns —
  //       grep -n "stays inside the declared ceiling" scripts/organism_test.mjs
  //       — was measuring the brief MINUS the manifest line: structurally blind to a
  //       FOOTER_RESERVE overrun, i.e. to exactly the failure the reserve exists to prevent.
  // The repair wires the two together instead of adding an organ: the footer prints the TRUE
  // delivered length, so that existing suite assertion becomes a real end-to-end ceiling check,
  // and `total` is that same number rather than an estimate of it — `total === (returned
  // text).length` by construction, which is what the new selftest pins.
  //
  // SELF-REFERENCE, SOLVED BY FIXED POINT, NOT BY A GUESS: the printed number counts the line
  // that prints it. f(n) = text.length + 1 + render(n).length is non-decreasing in n (only the
  // digit count moves) and we start at text.length, which is below the answer, so the climb is
  // monotone and adds at most one digit per pass. 8 passes is DERIVED, not chosen: the ceiling
  // is 12,000 and even the un-budgeted fallback is one brief, so the figure can never carry the
  // 8 digits that would be needed to outlast the loop.
  // NO NEW ENGINE, so nothing is frozen — same call as the 6 Aug `trimmed` fix and the 10 Aug
  // `memFull` fix, both of which corrected this module's accounting in place: the parts, their
  // order and the footer's wording are untouched; only the number becomes true.
  const manifestHead = `[context manifest: ${spent.map((s) =>
    `${s.id} ${s.state === "ok" ? s.bytes : s.state}${s.note ? ` (${s.note})` : ""}`).join(" · ")}`;
  const render = (n) => `${manifestHead} · assembled ${n}/${ceiling}]`;
  let n = text.length;
  for (let i = 0; i < 8; i++) { const next = text.length + 1 + render(n).length; if (next === n) break; n = next; }
  const footer = render(n);
  const total = text.length + 1 + footer.length;   // the "\n" the return joins on is part of what ships
  return { text: text + "\n" + footer, manifest: spent, bytes: text.length, ceiling, total, footer };
}

// ── THE LEDGER, REACHABLE (dead-wire repair, 11 Aug 2026) ────────────────────
// assemble() has returned {manifest, bytes, ceiling, total, footer} since 5 Aug and the
// ONE production caller reads `.text` and nothing else — grep -n "out.text" scripts/learnstate.mjs
// — so every structured field this module computes was consumed only by the selftest that
// computes it, and the 11 Aug repair that made `total` truthful gave it no consumer at all,
// which was half of the defect that repair itself named in the comment above.
//
// The proof it stayed unreachable is the shape the ONE would-be consumer had to take: the
// suite re-parses the PRINTED footer with /assembled (\d+)\/(\d+)/ — a regex over prose —
// grep -n "stays inside the declared ceiling" scripts/organism_test.mjs
// — for the single ceiling check this organism owns. It could not do
// otherwise: that file's own header law is "spawns organs as CHILD PROCESSES (never
// imports them, so a top-level side effect cannot leak in)", and until today there was no
// out-of-process door onto the structure. Same for the watchman and the captain's call,
// the other two organs that would want to act on a DROPPED/ERROR/UNREADABLE leg.
//
// This is that door, and it is deliberately NOT a new organ — it is one read-only verb on
// the organ that already owns the accounting, the same shape `context.mjs status` took
// when its readout was wired to the doctor on 11 Aug.
//
// WHAT IT OMITS IS THE POINT: `text`. The default verb prints the assembled brief, which
// IS his durable memory, his teaching card and his staged rulings — the module's own
// ORGAN-SAFE law says a headless organ prompt must never carry that. The ledger answers
// "did everything arrive?" with byte counts and state words alone, so a suite, a watchman
// or a doctor can read it without any of them ever holding his memory. Nothing is
// computed here and no verdict is invented: this is assemble()'s return, minus one field.
export function ledgerOf(r) {
  const { text, ...ledger } = r;   // named, not filtered silently — `text` is the omission
  return ledger;
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────
// ============================================================================
// THE SITTING BRAIN's HEAD — sitting_system.md (BLOCK 3, 18 Aug 2026 · §6.4 last bullet, §16)
// ----------------------------------------------------------------------------
// The second document this module assembles. The Dugout constitution shrank to persona +
// honesty + the five delivery laws + SPEAK + card + tool hints (≤ 2,000 tokens, guarded in
// dugout's selftest); everything a STRONG model should read ONCE and keep cached — the
// teaching card, THE_GAFFER's persona/honesty/delivery sections, the captain profile, the
// kickoff, the PLAN, his capsule, the last sitting's review, judged standing, night coach +
// prepare, the session intents — moves HERE, into the head of the ONE live session
// sitting.mjs opens per sitting (claudegen.session; the head is cache-READ after turn 1).
// SAME DISCIPLINE AS THE BRIEF: parts in a fixed order, each with a cap, whole lines dropped
// from the end of the LOWEST-priority part first, every cut NAMED in a footer that is the
// last line. CEILING 60,000 chars ≈ 15k tokens (§6.6 hypothesis — sitting.mjs stats prints
// the measured head from turn-1 cache_creation; Block 9 sets it from data).
// THE TRUTH-LAYER FENCE RIDES INTO THE HEAD: on a REJIRAH (cold) route the capsule digest
// carries the STRIKES and withholds the WELDS — a cold round the brain could whisper is not
// cold. REVISION (samjhao over a locked capsule) gets the welds: there the weld IS the lesson.
// Nothing here is a law by itself — the pacer block (forge contract · teaching contract ·
// recall hint) rides at the top of EVERY user turn (sitting.mjs prepends it in-process), and
// the driver validates every proposal the model makes (its CTRL tail).
// PURE GIVEN ITS CONTEXT: every state read (kickoff, capsule, standing rows, night coach,
// prepare, the last review, the intents) is done by the CALLER (sitting.mjs gatherContext —
// the organ that owns the sitting) and handed in on `ctx`; this file reads only THE_GAFFER.md
// (a repo file at a constant path) and the teaching card through learnstate's own parser.
// That keeps the assembler hermetic (its selftest needs no disk) and keeps this organ's
// xray sink count where it was.
export const SITTING_CEILING = 60_000;
export const SITTING_PARTS = Object.freeze([
  // id · cap (chars) · drop priority (higher = dropped FIRST when the whole exceeds the ceiling)
  { id: "role", cap: 3_000, drop: 0 },
  { id: "how_he_learns", cap: 4_000, drop: 1 },
  { id: "gaffer_law", cap: 18_000, drop: 3 },   // §0+§2+§3+§5+§9 measured 16,168 on 18 Aug 2026 — the cap keeps §9 (the delivery laws) WHOLE
  { id: "captain", cap: 600, drop: 2 },
  { id: "agenda", cap: 6_000, drop: 2 },       // LAW A (18 Aug 2026): his explicit asks for THIS sitting + what prepare_on_request prepared for them — served FIRST, dropped late
  { id: "kickoff", cap: 3_000, drop: 5 },
  { id: "plan", cap: 12_000, drop: 4 },
  { id: "capsule", cap: 14_000, drop: 6 },
  { id: "review_of_last", cap: 900, drop: 7 },
  { id: "intents", cap: 900, drop: 8 },
  { id: "standing", cap: 900, drop: 9 },
  { id: "night_coach", cap: 4_000, drop: 10 },
  { id: "pacer_note", cap: 700, drop: 0 },
]);
const GAFFER_FILE = join(ROOT, "THE_GAFFER.md");
const GAFFER_SECTIONS = ["§0", "§2", "§3", "§5", "§9"];   // persona · the bond · the register · honesty overrides · the five delivery laws
export function gafferLawText(src) {
  const text = typeof src === "string" ? src : (() => { try { return readFileSync(GAFFER_FILE, "utf8"); } catch { return ""; } })();
  if (!text) return "";
  // a section = its `## §N — …` heading line up to the next `## ` heading (the `---` rulers inside stay; a trailing one goes)
  const heads = [...text.matchAll(/^## [^\n]*/gm)].map((m) => ({ at: m.index, line: m[0] }));
  const out = [];
  for (const sec of GAFFER_SECTIONS) {
    const i = heads.findIndex((h) => h.line.startsWith(`## ${sec} `) || h.line.startsWith(`## ${sec}—`) || h.line.startsWith(`## ${sec} —`));
    if (i < 0) continue;
    const end = i + 1 < heads.length ? heads[i + 1].at : text.length;
    out.push(text.slice(heads[i].at, end).replace(/\n---\s*$/, "").trim());
  }
  return out.join("\n\n").trim();
}
function takeLines(text, cap) {
  // whole lines, from the top, up to cap chars; returns {text, cut:boolean, full:number}
  const s = String(text || "").trim();
  if (s.length <= cap) return { text: s, cut: false, full: s.length };
  const lines = s.split("\n");
  const kept = [];
  let n = 0;
  for (const l of lines) { if (n + l.length + 1 > cap) break; kept.push(l); n += l.length + 1; }
  return { text: kept.join("\n"), cut: true, full: s.length };
}
export function capsuleDigestFor(c, route) {
  if (!c) return "";
  const L = [`CAPSULE '${c.id}' — ${c.title || c.id} · locked ${c.lockedOn || "?"} · Re-Jirah rounds done: ${(Array.isArray(c.reJirahDone) ? c.reJirahDone : []).join(", ") || "none"}`];
  if (c.hook) L.push(`HOOK (his): ${String(c.hook).trim()}`);
  if (route !== "REJIRAH" && c.mechanism) L.push(`MECHANISM (his own words, locked): ${String(c.mechanism).trim()}`);
  const axes = Array.isArray(c.faultLines) ? c.faultLines : [];
  if (axes.length) {
    L.push(route === "REJIRAH"
      ? `THE NINE AXES — COLD ROUND: strikes only. The welds are WITHHELD on purpose (a cold round you could whisper is not cold); the judge holds them, not you.`
      : `THE NINE AXES — his strike-question and his LOCKED WELD per axis (the weld is SACRED prose: recite it verbatim when the plan says recital; never re-emit it "improved"):`);
    for (const a of axes) {
      if (!a || !a.axis) continue;
      L.push(`  ${a.axis}) ${a.title || ""} — STRIKE: ${String(a.strike || "").trim() || "(none written)"}${a.status ? ` · status ${a.status}` : ""}`);
      if (route !== "REJIRAH" && a.weld) L.push(`     WELD: ${String(a.weld).trim()}`);
    }
  }
  if (route !== "REJIRAH") {
    const traps = (Array.isArray(c.traps) ? c.traps : []).map((t) => (typeof t === "string" ? t : [t && t.bait, t && t.wrong].filter(Boolean).join(" — "))).filter(Boolean).slice(0, 7);
    if (traps.length) L.push(`KNOWN PITS he wrote for himself (bait — why it tempts him; the way out is not here on purpose):\n${traps.map((t) => `  · ${t}`).join("\n")}`);
    const bridges = (Array.isArray(c.bridges) ? c.bridges : []).map((b) => (typeof b === "string" ? b : [b && b.to, b && b.line].filter(Boolean).join(": "))).filter(Boolean).slice(0, 6);
    if (bridges.length) L.push(`BRIDGES to what he already holds:\n${bridges.map((b) => `  · ${b}`).join("\n")}`);
    if (Array.isArray(c.doubts) && c.doubts.length) L.push(`HIS OWN DOUBTS on this capsule (${c.doubts.length}): ${c.doubts.slice(0, 5).map((d) => (typeof d === "string" ? d : (d && (d.text || d.doubt)) || "")).filter(Boolean).join(" · ")}`);
  }
  return L.join("\n");
}
export async function assembleSittingSystem(ctx = {}) {
  const ceiling = Number.isFinite(ctx.ceiling) ? ctx.ceiling : SITTING_CEILING;
  const learnstate = ctx.learnstate || await import("./learnstate.mjs").catch(() => null);   // the card's OWN parser (single-sourced, its own tail)
  const route = ctx.route || "FORGE";
  const spent = [];
  const parts = {};
  const record = (id, present, text, note, file) => { spent.push({ id, present, bytes: present ? text.length : 0, note: note || null, file: file || null }); parts[id] = present ? text : ""; };
  const capOf = (id) => SITTING_PARTS.find((p) => p.id === id).cap;
  const put = (id, text, file) => {
    const t = String(text || "").trim();
    if (!t) return record(id, false, "", "EMPTY", file);
    const k = takeLines(t, capOf(id));
    record(id, true, k.text, k.cut ? `TRIMMED from ${k.full} — cap ${capOf(id)}` : null, file);
  };
  const cfgWords = Number.isFinite(ctx.unit_max_words) ? ctx.unit_max_words : 110;
  const seat = Number.isFinite(ctx.seat_words) ? ctx.seat_words : 60;
  // 1. role
  put("role", [
    `You are THE SITTING BRAIN of Arsenal AI FC — the one mind behind every mouth of ${ctx.captain && ctx.captain.tag ? ctx.captain.tag : "the captain"}'s study organism. A voice mouth (THE GAFFER, Gemini Live) speaks EXACTLY the units you compose; you never speak, it never composes.`,
    `L3 · CODE DRIVES, YOU COMPOSE, HE SPEAKS: the driver (sitting.mjs) runs THE METHOD as a state machine, prepends the PACER BLOCK to every user turn (forge contract · teaching contract · his recalled words) — that block is LAW, obey it before anything here — and executes every write through the owners' CLIs. You never write files, never run tools; you PROPOSE through the control tail and the driver validates.`,
    `THE UNIT LAW: one reply = ONE unit ≤ ${cfgWords} spoken words (a respond turn ≤ ${seat}), his Hinglish (technical words stay English), ONE idea, everyday-physical analogies only (food, house, shop, city — never geometry), and where THE METHOD allows, ONE check-question at the end that asks for his GUT-WORD first (knew | shaky | guessed).`,
    `THE MAP LAW (THE_GAFFER §9.2): declare the map before you walk it — parts, order, what he holds at the end — then "you are here" at every stop. DHEEMA IS NOT CHHOTA: slow = one thing, small steps; never longer, always deeper.`,
    `BANK, DO NOT JUDGE: when he answers a check-question you acknowledge, take the gut-word (ask ONCE if it is missing), set bank in the tail, and move — you never grade him live, never say "correct/galat" as a verdict; the truth layer judges at close. "Samajh nahi aaya" is LITERAL: stop, restart that one idea from zero, do not advance. Never place his level above his own.`,
    `HONESTY (THE_GAFFER §5, §9.3): "ye mujhe abhi yaad nahi" is a legal answer; a confident guess is not. If the pacer says a step is not yet legal, do not take it.`,
    `THE CONTROL TAIL — the LAST line of EVERY reply, exactly: ${ctx.ctrl_grammar || '<<CTRL {"class":"respond|compose","bank":{"axis":"a-i","gut":"knew|shaky|guessed"}|null,"unit_done":true|false,"question_asked":true|false,"next":"deliver|wait"}>>'}  · class=compose when you wrote a NEW unit off-plan · bank ONLY when he actually answered the pending check-question with a gut-word · next=deliver when the next pre-composed unit should follow your reply now, wait when you asked something and need his line.`,
    `WHEN ASKED TO COMPOSE THE PLAN: return ONLY the JSON the driver describes (map + units) — the units are what the mouth will speak in order; write them as spoken Hinglish, each ≤ ${cfgWords} words, from HIS capsule, the pacer's METHOD order and the kickoff below; step numbers never go backwards.`,
  ].join("\n"));
  // 2. how he learns — the SAME card learnstate/get_context serve (its own parser + tail)
  let card = "";
  try { card = learnstate && learnstate.loadTeachingCard ? learnstate.loadTeachingCard(undefined, capOf("how_he_learns") - 200) : ""; } catch { card = ""; }
  put("how_he_learns", card ? `HOW HE LEARNS (evidence from his own words — learning-layer/HOW_HE_LEARNS.md; OBSERVED, not preferences he stated; #1 and #12 break him most):\n${card}` : "", "learning-layer/HOW_HE_LEARNS.md");
  // 3. THE_GAFFER §0-§3/§5/§9 — the same law the mouth's constitution keeps, so two mouths speak one law
  put("gaffer_law", (() => { const g = gafferLawText(ctx.gafferText); return g ? `THE GAFFER — persona, bond, register, honesty overrides, the five delivery laws (THE_GAFFER.md §0 §2 §3 §5 §9 — the mouth's constitution holds the same; you compose IN this voice):\n${g}` : ""; })(), "THE_GAFFER.md");
  // 4. captain profile
  const cp = ctx.captain && ctx.captain.profile ? ctx.captain.profile : {};
  put("captain", `THE CAPTAIN: ${ctx.captain && ctx.captain.tag ? ctx.captain.tag : "the captain"}${cp.full_name ? ` · ${cp.full_name}` : ""} · tz ${cp.tz || "Asia/Kolkata"} · language ${cp.language || "Hinglish"} · voice ${cp.voice || "—"} · ADHD-PI: one idea per message, "you are here" every turn.`, "dressing-room/state/captain.json");
  // 5. kickoff (learnstate json + nextup)
  const k = ctx.kickoff || {};
  const cur = k.cur || null;
  const nu = ctx.nextup && ctx.nextup.winner ? ctx.nextup.winner : null;
  // 4b. LAW A (MODELS + ACTS Block 2, 18 Aug 2026) — HIS AGENDA: the acts he asked for (acts.mjs verb agenda →
  //     sitting agenda add) are the FIRST thing this sitting does; the material prepare_on_request (Opus, on his
  //     ask) prepared for them rides beneath. Rows handed in by the caller (sitting.mjs gatherContext).
  const ag = Array.isArray(ctx.agenda) ? ctx.agenda : [];
  const prepd = String(ctx.preparedText || "");
  put("agenda", ag.length || prepd ? [ag.length ? `HIS AGENDA FOR THIS SITTING (his explicit asks, verbatim — do these FIRST, before the plan; say "ho gaya" only when a receipt exists):\n${ag.map((a, i) => `${i + 1}. ${a.text}`).join("\n")}` : "", prepd ? `PREPARED FOR HIS AGENDA (brain job prepare_on_request, on his ask — use it, do not re-derive):\n${prepd.trim()}` : ""].filter(Boolean).join("\n\n") : "", "dressing-room/state/sitting_agenda.jsonl");
  put("kickoff", [
    `KICKOFF (from state, never from chat) — route ${route}${ctx.concept ? ` · concept '${ctx.concept}'` : ""}${ctx.routeWhy ? ` · why: ${ctx.routeWhy}` : ""}`,
    cur ? `CURRENT TASK: ${cur.id || ""} ${cur.task || ""} [${cur.track || ""}]${Array.isArray(cur.subtopics) && cur.subtopics.length ? ` — ${cur.subtopics.slice(0, 6).join(" · ")}` : ""}` : "CURRENT TASK: (none on the sprint)",
    k.modeLine ? `MODE: ${k.modeLine}` : "",
    nu ? `PEHLA KAAM (kickoff's own ranking): ${nu.line}${nu.why ? ` — kyun: ${nu.why}` : ""}` : "",
    k.ws && (k.ws.where_left_off || k.ws.open_loop) ? `LAST SESSION: ${k.ws.where_left_off || ""}${k.ws.open_loop ? ` · OPEN LOOP: ${k.ws.open_loop}` : ""}` : "",
    Array.isArray(k.watch) && k.watch.length ? `WATCH-LIST (his repeat weak spots): ${k.watch.join(" · ")}` : "",
    ctx.forge && ctx.forge.concept ? `FORGE SESSION ON DISK: '${ctx.forge.concept}' step ${ctx.forge.step} · steps done ${(ctx.forge.steps_done || []).join(",")} · axes done ${(ctx.forge.axes_done || []).join(",") || "none"} · current axis ${ctx.forge.current_axis || "—"}${ctx.forge.closed_at ? " · CLOSED" : ""}` : "",
  ].filter(Boolean).join("\n"), "learnstate json");
  // 6. plan
  const plan = ctx.plan && Array.isArray(ctx.plan.units) ? ctx.plan : null;
  put("plan", plan
    ? `THE PLAN (pre-composed${plan.source ? ` · ${plan.source}` : ""}; the driver delivers these in order — you fill gaps, you never re-order):\nMAP: ${plan.map || ""}\n${plan.units.map((u, i) => `  ${i}. [step ${u.step ?? "-"} · axis ${u.axis || "-"} · ${u.kind || "unit"}${u.question ? " · ?" : ""} · ${u.est_seconds || "?"}s] ${u.text}`).join("\n")}`
    : `THE PLAN: not composed yet — your FIRST turn will ask you to compose it (map + units as JSON). Until then, nothing is spoken.`);
  // 7. capsule
  put("capsule", capsuleDigestFor(ctx.capsule, route), ctx.capsule ? `dressing-room/state/capsules/${ctx.capsule.id}.json` : null);
  // 8. review of last sitting (Block 4 fills what_changes_next)
  const rv = ctx.lastReview || null;
  put("review_of_last", rv ? `LAST SITTING (${rv.sitting_id || "?"} · ${rv.route || ""} '${rv.concept || rv.task || ""}' · closed ${rv.closed_at || "?"} · ${rv.reason || ""}): ${rv.turns ?? "?"} turns · ${rv.units_delivered ?? "?"}/${rv.units_composed ?? "?"} units spoken · ${rv.banked ?? "?"} banked${Array.isArray(rv.what_changes_next) && rv.what_changes_next.length ? `\nWHAT CHANGES THIS TIME (its review): ${rv.what_changes_next.join(" · ")}` : "\n(no LLM review yet — Block 4)"}${rv.judge && rv.judge.register_line ? `\nTHE ROOM'S WORDS LAST TIME (the judge's register line, §9.4): ${rv.judge.register_line} — say it ONCE, early, then move on; never a lecture on vocabulary.` : ""}` : "", "dressing-room/state/sitting_reviews.jsonl");
  // 9. session intents (§7.2)
  put("intents", Array.isArray(ctx.intents) && ctx.intents.length ? `HIS LAST SESSIONS' ASKS (session-intent memory):\n${ctx.intents.slice(0, 6).join("\n")}` : "", "dressing-room/state/session_intent.jsonl");
  // 10. judged standing (0 rows after Block 0's purge — a law enters only by a judgment) — rows handed in by the caller
  const standing = ctx.standing;
  const rows = standing && Array.isArray(standing.laws) ? standing.laws : (Array.isArray(standing) ? standing : []);
  put("standing", rows.length ? `STANDING (judged by THE WATCHER, ${rows.length}): ${rows.slice(0, 8).map((r) => (typeof r === "string" ? r : (r && (r.line || r.text || r.law)) || "")).filter(Boolean).join(" · ")}` : "", "dressing-room/state/gaffer_standing.json");
  // 11. night coach + prepare (the dark lane's output — its `sat` consumption stamps when a unit that carries it is SPOKEN) — text handed in by the caller
  const day = ctx.day || new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  const nc = String(ctx.nightCoachText || "");
  const pr = String(ctx.prepareText || "");
  put("night_coach", [nc ? `NIGHT COACH (${day} — the misconceptions the night mapped; a unit that carries one names src "night_coach"):\n${nc.trim()}` : "", pr ? `PREPARED SITTING (${day} — Block 5's prepare_tomorrow; src "prepare"):\n${pr.trim()}` : ""].filter(Boolean).join("\n\n"), `brain_out/night_coach/${day}.md`);
  // 12. pacer note
  put("pacer_note", `THE PACER RIDES EVERY TURN: the first lines of every user message are the driver's pacer block — FORGE contract (which METHOD step is legal now, axes, question-moments left), TEACHING CONTRACT (drift-ranked rules), RECALL (his own past words when they earn the turn) — then a [SITTING …] line (cursor, pending question, next unit), then "CAPTAIN: …" (his words), then a [DRIVER: …] note. Obey the pacer over this head when they disagree.`);
  // ── the whole vs the ceiling: drop from the highest drop-priority part first, whole lines from its end ──
  const order = [...SITTING_PARTS].sort((a, b) => b.drop - a.drop);
  const render = () => SITTING_PARTS.map((p) => parts[p.id]).filter(Boolean).join("\n\n");
  const footerOf = (n) => `[sitting_system: ${spent.map((s) => `${s.id} ${s.present ? s.bytes : "EMPTY"}${s.note && s.note !== "EMPTY" ? ` (${s.note})` : ""}`).join(" · ")} · assembled ${n}/${ceiling}]`;
  let text = render();
  for (const p of order) {
    if (text.length + 1 + footerOf(text.length).length <= ceiling) break;
    if (!parts[p.id] || p.drop === 0) continue;                 // role + pacer_note never cut (drop 0)
    const need = text.length + 1 + footerOf(text.length).length - ceiling;
    const before = parts[p.id].length;
    const lines = parts[p.id].split("\n");
    let dropped = 0;
    while (lines.length && dropped < need) { dropped += lines.pop().length + 1; }   // a part may go to nothing — named, never silent
    parts[p.id] = lines.join("\n");
    const s = spent.find((x) => x.id === p.id);
    if (before - parts[p.id].length > 0) { s.bytes = parts[p.id].length; s.note = `${s.note ? s.note + "; " : ""}CUT ${before - parts[p.id].length} for the ceiling${parts[p.id] ? "" : " (all)"}`; }
    text = render();
  }
  // fixed-point footer (its own length counts)
  let n = text.length;
  for (let i = 0; i < 8; i++) { const next = text.length + 1 + footerOf(n).length; if (next === n) break; n = next; }
  const footer = footerOf(n);
  return { text: `${text}\n${footer}`, footer, parts: spent, bytes: text.length, ceiling, route };
}

function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; console.log(`  FAIL ${n}`); } };

  // A stub learnstate: brief() places memory/card exactly where the real one does, so
  // the ordering invariants below are asserted against the real CONTRACT, not the real disk.
  const stub = {
    brief: (d, n, mem, card) => ["KICKOFF", mem ? "HIS MEMORY\n" + mem : "", card ? "HOW TO TEACH HIM\n" + card : "", "LAWS:"].filter(Boolean).join("\n"),
    loadTeachingCard: () => "1. one idea",
    loadMemory: async (cap) => "M".repeat(Math.min(4157, cap)),
    CARD_MAX: 1800,   // the live owner's declared share — grep -n "CARD_MAX   =" scripts/learnstate.mjs
                      // — the stub mirrors the real module so a healthy footer here reads as a
                      // healthy footer there
  };
  const run = (over = {}) => assemble({ learnstate: stub, pending: { present: false, text: "", count: 0 }, memoryFullLength: 4157, ...over });

  return (async () => {
    const r = await run();
    assert("ASSEMBLES — orientation, card and memory all land in one text",
      r.text.includes("KICKOFF") && r.text.includes("HIS MEMORY") && r.text.includes("HOW TO TEACH HIM"));
    assert("THE 47% BUG IS CLOSED — the full 4,157-char cartridge now fits inside the ceiling",
      r.manifest.find((m) => m.id === "memory").bytes === 4157);
    assert("CANONICAL ORDER — memory and card still sit ABOVE the LAWS line",
      r.text.indexOf("HIS MEMORY") < r.text.indexOf("LAWS:") && r.text.indexOf("HOW TO TEACH HIM") < r.text.indexOf("LAWS:"));
    assert("FOOTER — every provider is named with its byte count and the total against the ceiling",
      /context manifest:/.test(r.footer) && /memory 4157/.test(r.footer) && /card 11/.test(r.footer)
      && new RegExp(`assembled \\d+/${CEILING}`).test(r.footer));
    const tight = await assemble({ learnstate: stub, pending: { present: false, text: "", count: 0 }, memoryFullLength: 4157, ceiling: 900 });
    const tm = tight.manifest.find((m) => m.id === "memory");
    assert("SQUEEZE — under a 900-char ceiling memory is cut, and the cut is NAMED, never silent",
      tm.bytes < 4157 && /TRIMMED from 4157/.test(tm.note || ""));
    assert("SQUEEZE — orientation survives the squeeze intact (it is the floor)",
      tight.text.includes("KICKOFF") && tight.manifest.find((m) => m.id === "orientation").present === true);

    // Block 8 (18 Aug 2026, 8g) — THE INTENTS FLOOR IS HELD AT RENDER: a fat card + a big
    // orientation under the live ceiling used to zero the intents leg (`5 open, NONE SHOWN`).
    // Fixture: 5 open intents, a 1,400-char card, orientation ~2,700, ceiling 5,300 (the live
    // shape of the 18 Aug 16:40 IST SessionStart) ⇒ header + 2 rows land, memory absorbs, and
    // the whole thing still sits inside the ceiling.
    {
      const fatStub = { ...stub, brief: (d, n, mem, card) => ["KICKOFF " + "o".repeat(2700), mem ? "HIS MEMORY\n" + mem : "", card ? "HOW TO TEACH HIM\n" + card : "", "LAWS:"].filter(Boolean).join("\n"), loadTeachingCard: () => "c".repeat(1400) };
      const intents = ["HIS LAST SESSIONS' ASKS (session-intent memory):", ...[1, 2, 3, 4, 5].map((i) => `2026-08-1${i} · ask ${i}: ` + "x".repeat(90))];
      const fl = await assemble({ learnstate: fatStub, pending: { present: true, count: 4, text: "--- PENDING IDENTITY FACTS — 4 staged (4 NOT SHOWN — budget) ---" }, memoryFullLength: 4157, intents, ceiling: 5300 });
      const im = fl.manifest.find((m) => m.id === "intents");
      assert("INTENTS FLOOR — with a 1,400-char card and a 2,700-char orientation under a 5,300 ceiling, at least TWO intent rows still land (was: 0 shown)",
        im && im.present && /(2|3|4|5) of 5 open shown|5 open/.test(im.note || "") && fl.text.includes("ask 1:") && fl.text.includes("ask 2:"), im ? `${im.bytes} ${im.note}` : "no intents row");
      assert("INTENTS FLOOR — memory absorbs the floor and the brief still lands INSIDE the ceiling (the floor is not an overrun)",
        fl.total <= 5300 && fl.manifest.find((m) => m.id === "memory").bytes < 4157, `total ${fl.total} memory ${fl.manifest.find((m) => m.id === "memory").bytes}`);
    }

    const noMem = await assemble({ learnstate: stub, memory: null, pending: { present: false, text: "", count: 0 } });
    assert("A MISSING LEG IS NAMED, never silently absent",
      /memory MISSING/.test(noMem.footer) && !noMem.text.includes("HIS MEMORY"));
    const noCard = await assemble({ learnstate: stub, card: null, pending: { present: false, text: "", count: 0 }, memoryFullLength: 4157 });
    assert("A MISSING CARD is named too, and the rest of the brief still renders",
      /card MISSING/.test(noCard.footer) && noCard.text.includes("KICKOFF"));

    const withPend = await assemble({ learnstate: stub, memoryFullLength: 4157,
      pending: { present: true, count: 2, text: "--- PENDING IDENTITY FACTS — 2 staged ---\n  · \"x\"" } });
    assert("PENDING FACTS REACH THE SESSION — the queue that only get_context used to show",
      withPend.text.includes("PENDING IDENTITY FACTS") && /pending_facts \d+ \(2 staged\)/.test(withPend.footer));
    assert("…and zero staged facts render NOTHING (a queue that is empty must stay quiet)",
      !(await run()).text.includes("PENDING IDENTITY FACTS"));
    // THE THREE STATES ARE THREE FACTS — the law this module states in its own header,
    // now held at the door instead of collapsed into one word.
    const empt = await assemble({ learnstate: stub, memoryFullLength: 4157, pending: { present: false, state: "EMPTY", text: "", count: 0 } });
    assert("EMPTY ≠ MISSING — a healthy queue with nothing in it reads EMPTY, not MISSING",
      /pending_facts EMPTY \(0 staged\)/.test(empt.footer));
    const gone = await assemble({ learnstate: stub, memoryFullLength: 4157, pending: { present: false, state: "MISSING", text: "", count: 0 } });
    assert("MISSING ≠ EMPTY — a file that is genuinely absent still reads MISSING",
      /pending_facts MISSING/.test(gone.footer));
    const err = await assemble({ learnstate: stub, memoryFullLength: 4157, pending: { present: false, state: "ERROR", text: "", count: 0, error: true } });
    assert("ERROR is its own word — an unreadable queue never hides behind 'empty'",
      /pending_facts ERROR/.test(err.footer));
    assert("the LIVE pending reader reports one of the three states, never a bare boolean",
      ["ok", "EMPTY", "MISSING", "ERROR"].includes(pendingFactsBlock().state));
    // THE CLIP-TAIL TRAP: overflow smaller than clipTo's ~70-char tail used to make the
    // clipped string LONGER than the original, so `trimmed` read false on a real cut.
    const tail = await assemble({ learnstate: { ...stub, loadMemory: async () => "M".repeat(4157) },
      pending: { present: false, text: "", count: 0 }, memoryFullLength: 4157, ceiling: 900 });
    assert("A CUT IS ALWAYS NAMED — even when the truncation notice is longer than the overflow",
      /TRIMMED from 4157/.test(tail.manifest.find((m) => m.id === "memory").note || ""));
    // ── A CLIP THAT OVERSHOOTS ITS CAP IS NOT A CLIP (16 Aug 2026) ───────────
    // The trap above pinned that the cut is NAMED. Nothing pinned that the cut
    // FITS — and it did not: `clipTo` returned cap + tail on every call, which is
    // how a brief budgeted at 12,000 shipped at 12,005. Both tails are asserted,
    // because the card leg calls the same helper with the other one, and a fix
    // that held for only one of them would have gone red here in a week.
    assert("THE CLIP FITS ITS CAP — both tails, at a cap the notice cannot escape",
      clipTo("M".repeat(9000), 500).length === 500
      && clipTo("M".repeat(9000), 500, CARD_TAIL).length === 500);
    assert("…and a cap smaller than the notice takes a hard cut rather than overflowing to fit the notice",
      clipTo("M".repeat(900), 12).length === 12);
    assert("…while anything already inside its cap is returned untouched, byte for byte",
      clipTo("MMM", 500) === "MMM" && clipTo("M".repeat(500), 500).length === 500);
    // THE END-TO-END LAW, on the LIVE brief rather than a fixture: the number the
    // footer prints is the number that ships, and it is inside the ceiling. This
    // is the assertion organism_test owns from the outside; owning it HERE too is
    // what makes this module's own suite able to catch its own arithmetic.
    const shipped = await assemble({});
    assert("THE BRIEF THAT SHIPS IS INSIDE THE CEILING — total is the delivered length, and it fits",
      shipped.total === shipped.text.length && shipped.total <= shipped.ceiling);

    // THE FULL LENGTH IS READ BEFORE THE CUT (audit 10 Aug 2026). Every assertion above
    // injects deps.memoryFullLength — which is exactly why the suite ran green for weeks
    // over a live path that measured the cartridge AFTER learnstate had already trimmed it.
    // These two inject NOTHING and use a loadMemory that behaves like the real one
    // (grep -n "async function loadMemory" scripts/learnstate.mjs): it clips at the cap it is
    // GIVEN and appends its own tail,
    // so its return value can never reveal the pre-cut size. If the live call ever goes
    // back to handing loadMemory a budget, `TRIMMED from N` collapses to the trimmed
    // length again and both of these fail.
    const REAL_TAIL = "\n… (truncated — full recall via the organism-memory MCP `get_context`)";
    const CARTRIDGE = 9000;   // > MEMORY_CAP, so the cut is forced no matter what the ceiling leaves
    const realish = { ...stub,
      loadMemory: async (cap) => { const raw = "M".repeat(CARTRIDGE); return raw.length > cap ? raw.slice(0, cap) + REAL_TAIL : raw; } };
    const live = await assemble({ learnstate: realish, pending: { present: false, text: "", count: 0 }, ceiling: 3000 });
    const lm = live.manifest.find((m) => m.id === "memory");
    assert("TRIMMED NAMES THE PRE-CUT SIZE — the live path measures the cartridge WHOLE, never its own trimmed return",
      /TRIMMED from 9000 —/.test(lm.note || "") && lm.bytes < CARTRIDGE);
    assert("NO CUT IS EVER REPORTED AS A CUT FROM ITSELF — `TRIMMED from N` with N = the trimmed size is the tautology this killed",
      Number((/TRIMMED from (\d+)/.exec(lm.note || "") || [])[1]) > lm.bytes);

    // ── THE SAME LAW, ON THE CARD LEG (dead-wire sweep, 11 Aug 2026) ─────────
    // The wire that broke: this module called `ls.loadTeachingCard()` bare, so learnstate cut
    // at its private CARD_MAX and returned the SHORT string, and the row recorded that
    // post-clip length with the note hardcoded null. `TRIMMED` was unreachable on this leg —
    // the memory defect above, still live, one leg over, for the eight days since it was fixed
    // there. Latent today (live card 1,431 < 1800) and permanent the day the card grows.
    // The stub below behaves like the REAL parser
    // (grep -n "function loadTeachingCard" scripts/learnstate.mjs): it clips at the cap
    // it is GIVEN and appends its own tail, so its return can never reveal the pre-cut size.
    // Both assertions fail the moment the call goes back to passing no cap.
    const BIG_CARD = 5000;    // > the owner's 1800, so the cut is forced whatever the ceiling leaves
    const cardish = { ...stub,
      loadTeachingCard: (p, cap = 1800) => { const raw = "C".repeat(BIG_CARD); return raw.length > cap ? raw.slice(0, cap) + CARD_TAIL : raw; } };
    const bigCard = await assemble({ learnstate: cardish, memoryFullLength: 4157,
      pending: { present: false, state: "EMPTY", text: "", count: 0 } });
    const bc = bigCard.manifest.find((m) => m.id === "card");
    assert("CARD · TRIMMED NAMES THE PRE-CUT SIZE — the door reads the card WHOLE and reports what it cut FROM, and against which cap",
      /TRIMMED from 5000 — cap 1800/.test(bc.note || "") && bc.bytes < BIG_CARD);
    assert("CARD · NO CUT REPORTED AS A CUT FROM ITSELF — a bare loadTeachingCard() call makes this collapse to `from <the clipped size>`",
      Number((/TRIMMED from (\d+)/.exec(bc.note || "") || [])[1]) > bc.bytes);
    // 18 Aug 2026 (ceiling 12,000 → 5,300): with a 1,800-char card the cartridge no longer
    // fits beside it, so MEMO_TAIL may now legitimately appear ONCE — as memory's OWN named
    // cut, never as the card's. The law is unchanged: the card's cut points at the card's source.
    {
      const bm = bigCard.manifest.find((m) => m.id === "memory");
      const memoTails = bigCard.text.split(MEMO_TAIL).length - 1;
      assert("CARD · A CUT MADE HERE POINTS AT THE CARD'S OWN SOURCE, never the memory door (MEMO_TAIL appears only as memory's own named cut, if at all)",
        bigCard.text.includes(CARD_TAIL) && memoTails === (/TRIMMED/.test(bm.note || "") ? 1 : 0));
    }
    // NO CAP IS EVER INVENTED: an owner that stops declaring CARD_MAX gets the card whole and
    // a note saying exactly that — never a number this module made up.
    const noCap = await assemble({ learnstate: { ...cardish, CARD_MAX: undefined }, memoryFullLength: 4157,
      pending: { present: false, state: "EMPTY", text: "", count: 0 } });
    const nc = noCap.manifest.find((m) => m.id === "card");
    assert("CARD · NO GUESSED CAP — with the owner's CARD_MAX unreadable the card is taken whole and the footer SAYS so",
      nc.bytes === BIG_CARD && /no cap declared \(learnstate.CARD_MAX unreadable\)/.test(nc.note || ""));

    const broken = await assemble({ learnstate: { ...stub, loadMemory: async () => { throw new Error("boom"); } },
      pending: { present: false, text: "", count: 0 } });
    // AMENDED 11 Aug 2026: this asserted `/memory MISSING/` on a THROW — i.e. it PINNED the
    // defect below as correct behaviour, which is why the suite ran green over it for a week.
    // The law it was written to protect (a throwing provider never breaks the brief) is
    // unchanged and still asserted; what it may no longer accept is the throw reading MISSING.
    assert("REPAIR TOWARD SILENCE — a provider that THROWS never breaks the brief",
      broken.text.includes("KICKOFF") && /memory ERROR \(loadMemory threw \(boom\)\)/.test(broken.footer));

    // ── A THROW IS NOT AN ABSENCE, ON THE TWO PRIMARY LEGS (audit 11 Aug 2026) ─
    // The wire that broke: both `catch`es discarded the error and both notes were picked off
    // truthiness alone, so a corrupt hippocampus and an empty one printed the same word — the
    // module's own "three states are three facts" law, applied to pending_facts and to
    // render_probe, never applied to memory or card. These fail the moment either catch goes
    // back to swallowing, and the null cases are asserted alongside so the fix cannot be a
    // blanket rename of MISSING to ERROR.
    const memNull = await assemble({ learnstate: { ...stub, loadMemory: async () => null },
      pending: { present: false, state: "EMPTY", text: "", count: 0 } });
    assert("MEMORY · THROW ≠ ABSENCE — a throwing hippocampus reads ERROR and never the same word as an empty one",
      /memory ERROR/.test(broken.footer) && /memory MISSING/.test(memNull.footer)
      && broken.manifest.find((m) => m.id === "memory").note !== memNull.manifest.find((m) => m.id === "memory").note);
    assert("MEMORY · THE REASON SURVIVES THE CATCH — the thrown message rides the footer, it is not discarded",
      /loadMemory threw \(boom\)/.test(broken.footer));
    const cardThrew = await assemble({ learnstate: { ...stub, loadTeachingCard: () => { throw new Error("card parser blew up"); } },
      memoryFullLength: 4157, pending: { present: false, state: "EMPTY", text: "", count: 0 } });
    assert("CARD · THROW ≠ ABSENCE — a throwing loadTeachingCard reads ERROR with its message, a marker-less file still reads MISSING",
      /card ERROR \(loadTeachingCard threw \(card parser blew up\)\)/.test(cardThrew.footer)
      && /card MISSING \(marker or file absent\)/.test(noCard.footer));
    assert("…and a card that throws still leaves the rest of the brief standing (REPAIR TOWARD SILENCE)",
      cardThrew.text.includes("KICKOFF") && cardThrew.text.includes("HIS MEMORY"));
    // THE DOUBLED WORD: the footer renders `<id> <state> (<note>)`, so a note that re-prints
    // its own state shipped as `memory MISSING (MISSING (hippocampus unreadable))` every day.
    assert("NO STATE WORD IS PRINTED TWICE — the note explains the state, it never repeats it",
      !/(MISSING|ERROR|EMPTY|DROPPED) \((MISSING|ERROR|EMPTY|DROPPED)\b/.test(memNull.footer + noCard.footer + broken.footer + cardThrew.footer));
    assert("REPAIR TOWARD SILENCE — a broken orientation still yields a string, never a crash",
      typeof (await assemble({ learnstate: { ...stub, brief: () => { throw new Error("x"); } },
        pending: { present: false, text: "", count: 0 } })).text === "string");

    // ── THE LEDGER MUST MATCH THE TEXT (audit 10 Aug 2026) ───────────────────
    // Every assertion above this line reads the footer while the render SUCCEEDED, so not
    // one of them could see the fallback at §5 lie. These do. The stub below is the shape
    // this fails in life: `base` renders fine (it is called with nulls) and only the truthy
    // path throws, so the bug is invisible to every earlier probe.
    const truthyThrows = { ...stub,
      brief: (d, n, mem, card) => { if (mem || card) throw new Error("truthy path blew up"); return "KICKOFF\nLAWS:"; } };
    const dropped = await assemble({ learnstate: truthyThrows, memoryFullLength: 4157,
      pending: { present: false, state: "EMPTY", text: "", count: 0 } });
    assert("A DROPPED LEG IS NEVER BILLED AS DELIVERED — when the render falls back to orientation-only, the footer says DROPPED, not a byte count",
      !dropped.text.includes("HIS MEMORY") && !dropped.text.includes("HOW TO TEACH HIM")
      && /memory DROPPED \(render threw/.test(dropped.footer) && /card DROPPED \(render threw/.test(dropped.footer)
      && dropped.manifest.find((m) => m.id === "memory").bytes === 0
      && dropped.manifest.find((m) => m.id === "card").bytes === 0);
    assert("…and the fallback still yields the orientation brief — a lying footer is fixed by telling the truth, never by breaking SessionStart",
      dropped.text.includes("KICKOFF"));
    assert("THE PROBE'S FAILURE IS SPOKEN — the truthy-path probe is the earliest warning of exactly this, and its catch is no longer empty",
      /render_probe ERROR \(truthy-path render threw/.test(dropped.footer));
    // The wider class, no throw involved: a brief() that simply ignores an argument.
    const eatsCard = await assemble({ learnstate: { ...stub, brief: (d, n, mem) => stub.brief(d, n, mem, null) },
      memoryFullLength: 4157, pending: { present: false, state: "EMPTY", text: "", count: 0 } });
    assert("A SILENTLY IGNORED LEG READS DROPPED TOO — the ledger is an observation of the delivered text, not an assumption about it",
      /card DROPPED \(not present in the rendered brief\)/.test(eatsCard.footer)
      && /memory 4157/.test(eatsCard.footer) && eatsCard.text.includes("HIS MEMORY"));
    assert("NO FALSE POSITIVES — a healthy assembly never says DROPPED or render_probe",
      !/DROPPED/.test(r.footer) && !/render_probe/.test(r.footer));

    // ── THE REPORTED SIZE IS THE SHIPPED SIZE (audit 11 Aug 2026) ────────────
    // The wire that broke: `total` was text.length + FOOTER_RESERVE — an estimate nobody
    // read, of a thing nobody measured — and the PRINTED figure was the body with the footer
    // left out, so the suite's ceiling check could not see a reserve overrun
    // (grep -n "stays inside the declared ceiling" scripts/organism_test.mjs).
    // These run against a healthy assembly, a squeezed one and a note-heavy one (whose footer
    // is longest, which is precisely when the old formula was furthest from the truth).
    for (const [name, x] of [["healthy", r], ["squeezed", tight], ["note-heavy", dropped]]) {
      assert(`TOTAL IS THE SHIPPED SIZE — ${name}: total === the length of the string assemble() actually returns`,
        x.total === x.text.length);
      assert(`THE FOOTER PRINTS THAT SAME SIZE — ${name}: \`assembled N\` counts the manifest line that prints it, so the suite's ceiling check measures the WHOLE brief`,
        Number((/assembled (\d+)\//.exec(x.footer) || [])[1]) === x.text.length);
    }
    // ── THE LEDGER HAS A DOOR (dead-wire repair, 11 Aug 2026) ───────────────
    // The other half of the 11 Aug defect: `total` was made truthful and given no consumer.
    // These pin the door itself — every field survives it, and the ONE field that must not.
    const lg = ledgerOf(r);
    assert("LEDGER — every structured field assemble() computes survives the door (manifest · bytes · ceiling · total · footer)",
      Array.isArray(lg.manifest) && lg.manifest.length === r.manifest.length
      && lg.bytes === r.bytes && lg.ceiling === r.ceiling && lg.total === r.total && lg.footer === r.footer);
    assert("LEDGER — `text` is the one omission, and it is the reason the door is safe: no consumer's stdout ever holds his memory",
      !("text" in lg) && !JSON.stringify(lg).includes("HIS MEMORY"));
    // The regression, stated as itself: bytes + FOOTER_RESERVE is not the answer and never was.
    assert("THE OLD ESTIMATE IS GONE — total is no longer bytes + FOOTER_RESERVE (a 142-char lie on live state, 11 Aug 2026)",
      r.total !== r.bytes + FOOTER_RESERVE && dropped.total !== dropped.bytes + FOOTER_RESERVE);
    // AN OVERRUN MUST BE VISIBLE — the only reason any of this matters. Under an absurd
    // ceiling the brief plus its manifest line cannot fit, and the printed figure says so
    // instead of hiding behind a body-only count.
    const over = await assemble({ learnstate: stub, memoryFullLength: 4157,
      pending: { present: false, state: "EMPTY", text: "", count: 0 }, ceiling: 100 });
    // The suite check it feeds is named by its own assertion text, not by a line number:
    // organism_test's 'stays inside the declared ceiling' (named for 12,000 until 18 Aug 2026; the number now rides the footer).
    assert("AN OVERRUN IS VISIBLE — when brief+footer exceeds the ceiling the printed figure exceeds it too, which is what the suite's ceiling check asserts against",
      Number((/assembled (\d+)\/(\d+)/.exec(over.footer) || [])[1]) > 100 && over.total === over.text.length);

    // the real reader, against the real file
    const pf = pendingFactsBlock(join(HERE, "__no_such_file__.jsonl"));
    assert("PENDING READER — a missing file is 0 staged, never a throw", pf.present === false && pf.count === 0);
    assert("PENDING READER — the LIVE file parses (or is honestly absent)",
      typeof pendingFactsBlock().count === "number");

    // ── THE 160-CHAR DOOR (audit 10 Aug 2026) ────────────────────────────────
    // The wire that broke: the block cut every staged fact at 160 chars and showed only
    // the newest 5, while the header printed the full count. These four run against a
    // FIXTURE that reproduces the live queue's shape — 7 rows at the owner's own 400-char
    // staging clip — plus the live file itself, and each fails the moment a cut returns.
    const fx = join(tmpdir(), `arsenal_pending_fixture_${process.pid}.jsonl`);
    // 400 = the owner's staging clip: grep -n "clip(text, 400)" scripts/mcp-memory.mjs
    const FULL = "R".repeat(399) + "!";
    writeFileSync(fx, Array.from({ length: 7 }, (_, k) =>
      JSON.stringify({ ts: `2026-08-0${k + 1}T00:00:00.000Z`, text: `F${k}` + FULL.slice(2), status: "pending", source: "mcp" })).join("\n") + "\n", "utf8");
    try {
      const wide = pendingFactsBlock(fx, 20_000);
      assert("NO PER-ROW CUT — a 400-char staged fact reaches him WHOLE (the 160 is gone)",
        wide.text.includes(`F0${FULL.slice(2)}`) && wide.cut === 0);
      assert("EVERY STAGED ROW REACHES HIM — 7 staged, 7 rendered (slice(-5) is gone)",
        wide.shown === 7 && wide.hidden === 0 && wide.count === 7);
      const old = pendingFactsBlockLegacy(fx);
      assert("MEASURED AGAINST THE FROZEN ENGINE — the legacy door loses what this one keeps",
        old.text.length < wide.text.length && !old.text.includes(`F0${FULL.slice(2)}`));
      const squeezed = pendingFactsBlock(fx, 1_000);
      assert("A SQUEEZE IS NAMED, NEVER SILENT — hidden rows and cut chars both self-report",
        squeezed.count === 7 && (squeezed.hidden > 0 || squeezed.cut > 0)
        && (squeezed.hidden ? /not shown \(budget\)/.test(squeezed.text) : true)
        && (squeezed.cut ? /chars cut/.test(squeezed.text) : true));
    } finally { try { unlinkSync(fx); } catch {} }

    // ── A CORRUPT QUEUE IS NOT AN EMPTY QUEUE (audit 10 Aug 2026) ─────────────
    // The wire that broke: the per-line `catch {}` swallowed every parse failure, so a file
    // of nothing but rubble produced zero rows and returned state EMPTY — the word reserved
    // for a healthy queue with nothing in it. Every assertion above ran green over it, because
    // every one of them fed the reader well-formed rows. These four feed it damage. The first
    // is the one that would have caught it on day one; the third measures the new door against
    // the FROZEN legacy, which still swallows, so it can only pass while the two differ.
    const cx = join(tmpdir(), `arsenal_pending_corrupt_${process.pid}.jsonl`);
    writeFileSync(cx, ['{"ts":"2026-08-10T00:00:00.000Z","text":"his ruling","stat',   // truncated append
                       "not json at all",
                       '"a bare string"'].join("\n") + "\n", "utf8");
    const mx = join(tmpdir(), `arsenal_pending_mixed_${process.pid}.jsonl`);
    writeFileSync(mx, [JSON.stringify({ ts: "2026-08-09T00:00:00.000Z", text: "readable ruling A", status: "pending" }),
                       '{"ts":"2026-08-10T00:00:00.000Z","text":"half-written rul',
                       JSON.stringify({ ts: "2026-08-10T01:00:00.000Z", text: "readable ruling B", status: "pending" }),
                       JSON.stringify({ ts: "2026-08-08T00:00:00.000Z", text: "already answered", status: "confirmed" })].join("\n") + "\n", "utf8");
    try {
      const rubble = pendingFactsBlock(cx, 20_000);
      assert("A CORRUPT QUEUE READS ERROR, NEVER EMPTY — rows that will not parse are damage, not absence",
        rubble.state === "ERROR" && rubble.bad === 3 && rubble.count === 0 && rubble.error === true);
      // NO FALSE ALARM: a file of blank lines, and a file whose every row was already
      // answered, are both HEALTHY-and-empty. If those started reading ERROR the fix would
      // have traded a silent lie for a noisy one.
      writeFileSync(cx + ".empty", "\n\n", "utf8");
      writeFileSync(cx + ".done", JSON.stringify({ ts: "2026-08-08T00:00:00.000Z", text: "answered", status: "confirmed" }) + "\n", "utf8");
      assert("…and a genuinely empty queue still reads EMPTY — the fix must not turn every quiet queue into an alarm",
        pendingFactsBlock(cx + ".empty").state === "EMPTY" && pendingFactsBlock(cx + ".empty").bad === 0
        && pendingFactsBlock(cx + ".done").state === "EMPTY" && pendingFactsBlock(cx + ".done").bad === 0
        && pendingFactsBlock(join(tmpdir(), `arsenal_pending_none_${process.pid}.jsonl`)).state === "MISSING");
      const legacyRubble = pendingFactsBlockLegacy(cx);
      assert("MEASURED AGAINST THE FROZEN ENGINE — the legacy door still calls the same rubble 'EMPTY'",
        legacyRubble.state === "EMPTY" && legacyRubble.state !== rubble.state);
      const mixed = pendingFactsBlock(mx, 20_000);
      assert("PARTIAL DAMAGE — readable facts still render, the unreadable one is NAMED, and a confirmed row is not miscounted as broken",
        mixed.state === "ok" && mixed.count === 2 && mixed.bad === 1
        && mixed.text.includes("readable ruling A") && mixed.text.includes("readable ruling B")
        && /1 row UNREADABLE/.test(mixed.text));
      const corruptOut = await assemble({ learnstate: stub, memoryFullLength: 4157, pending: rubble });
      const mixedOut = await assemble({ learnstate: stub, memoryFullLength: 4157, pending: mixed });
      assert("THE DAMAGE REACHES THE SESSION — the footer carries the unreadable count in both shapes, not just the return value",
        /pending_facts ERROR \(3 rows UNREADABLE — nothing parsed\)/.test(corruptOut.footer)
        && /pending_facts \d+ \(2 staged, 1 rows UNREADABLE\)/.test(mixedOut.footer));
    } finally { for (const p of [cx, cx + ".empty", cx + ".done", mx]) { try { unlinkSync(p); } catch {} } }

    // THE LIVE WIRE: whatever is staged on disk right now must arrive through the real
    // assembler with NOTHING LOST SILENTLY. This is the assertion that would have caught
    // the 160-char cut on day one.
    //
    // ⚠ REPAIRED 15 Aug 2026, and the repair is the interesting part. Until today this was
    // ONE assertion — "every staged fact's full text is in the real brief" — and it went RED
    // on live state the moment his staging queue outgrew what a 12,000-char brief can hold.
    // MEASURED that morning: 5 staged facts (2,323 chars rendered) against a derived pending
    // budget of 972, so the footer read `pending_facts 972 (5 staged, 3 NOT SHOWN — budget,
    // 241 chars CUT — budget)` and the assertion failed. Nothing was broken. The parts were:
    //   orientation 2,918 · card 1,431 · memory 5,695 · ceiling 12,000
    // — the queue physically does not fit, and the design already SAYS so: CLAUDE.md calls
    // this brief "a BUDGETED SNAPSHOT (12k chars, worst-priority-first), not the full store",
    // the block's own header reserves a `hiddenLine` for exactly this, and the file's other
    // assertion three above is literally named "A SQUEEZE IS NAMED, NEVER SILENT".
    //
    // So the old wording asserted an invariant this module never promised, and it only ever
    // passed because the queue happened to be short. It also could not tell the two failures
    // apart — a SILENT code cut (the real defect: the 160-char slice, the `slice(-5)`) and an
    // ACCOUNTED budget squeeze — which is the same "a test that mocks the part that breaks"
    // shape this repo keeps finding. Worse, it is UNFALSIFIABLE at home in one direction:
    // dressing-room/hippocampus/ is gitignored (.gitignore:181), so on the away-day lane the
    // queue is MISSING, the first clause short-circuits, and CI is green over any regression
    // here forever. The three assertions below replace it and are collectively STRICTER — the
    // engine is still held to zero loss of its own, and the budget path, which was never
    // checked at all, is now held to exact accounting.
    //
    // NOT LOST, EITHER: a fact squeezed out of the brief is not gone. It rides the card deck
    // one card per anchor (captains_call c52/c55 are two of these staged facts, dealt and
    // waiting on his word) and get_context serves the whole queue live — which is what the
    // block's own "not shown" line already tells the reader to do.
    const livePend = pendingFactsBlock();                       // NO budget — the engine alone
    const liveOut = await assemble({});
    const stagedFull = !existsSync(PENDING_FACTS) ? [] :
      readFileSync(PENDING_FACTS, "utf8").split(/\r?\n/).filter((l) => l.trim())
        .map((l) => { try { return JSON.parse(l); } catch { return null; } })
        .filter((j) => j && j.text && (j.status || "pending") === "pending")
        .map((j) => String(j.text).replace(/\s+/g, " ").trim());

    // (a) THE ENGINE STILL CUTS NOTHING OF ITS OWN. Unbudgeted, every staged fact renders
    // whole — this is the 160-char / slice(-5) defect's own assertion, and it is the half
    // that must never be allowed to depend on how many facts happen to be staged.
    assert("THE ENGINE CUTS NOTHING OF ITS OWN — unbudgeted, every staged fact renders whole (the 160-char cut and the slice(-5) both die here)",
      livePend.state !== "ok"
      || (livePend.cut === 0 && livePend.hidden === 0 && livePend.count === stagedFull.length
        && stagedFull.every((t) => livePend.text.includes(t))));

    // (b) ROOM IS SPENT NEWEST-FIRST. This is what makes a squeeze survivable — the ruling
    // he gave most recently, the one a session is most likely to need, is the LAST to go.
    // ⚠ RE-STATED 18 Aug 2026 (OVERHAUL Block 1, ceiling 12,000 → 5,300). Until today this
    // read "under the REAL budget the newest ruling arrives whole" — and MEASURED that morning
    // the real budget is orientation 2,762 + card 1,431 + wrapper overhead 419 + footer
    // reserve 260 + memory floor 149 = 5,021 of 5,300, leaving 279 for the queue: below even
    // one 400-char ruling with the block's own head/foot. Nothing is broken and nothing is
    // silent — the block prints `4 staged, 4 NOT SHOWN — budget` with the get_context pointer,
    // and every staged fact ALSO rides the card deck one per anchor (c52/c55) — but the old
    // sentence promised an invariant the 6 KB brief cannot keep, so it is now two: (b1) the
    // newest-first LAW, on a fixture ceiling where it is decidable; (b2) the LIVE brief either
    // carries the newest ruling whole or NAMES exactly what it could not (the same "accounted,
    // never silent" clause (c) already holds it to).
    const liveP = liveOut.manifest.find((m) => m.id === "pending_facts");
    {
      const roomy = pendingFactsBlock(PENDING_FACTS, 3_000);   // a budget the newest ruling always fits
      assert("ROOM IS SPENT NEWEST-FIRST — under a budget that holds at least one ruling, the NEWEST is the one shown whole (fixture budget 3,000)",
        roomy.state !== "ok" || !stagedFull.length
        || roomy.text.includes(stagedFull[stagedFull.length - 1]));
      const newestWhole = !stagedFull.length || liveOut.text.includes(stagedFull[stagedFull.length - 1]);
      assert(`UNDER THE REAL BUDGET the newest ruling arrives whole OR its absence is NAMED with the get_context pointer — never silent (live: ${newestWhole ? "whole" : (liveP.note || "").replace(/^\d+ staged/, "not whole —")})`,
        liveP.state !== "ok" || newestWhole
        || (/NOT SHOWN|chars CUT/.test(liveP.note || "") && /get_context/.test(liveOut.text)));
    }

    // (c) AND WHATEVER THE BUDGET TOOK IS ACCOUNTED EXACTLY, IN BOTH PLACES. The footer's
    // numbers must equal what the block actually did: N hidden ⇒ the block's own "not shown"
    // line says N and exactly count−N−(1 if clipped) facts are present WHOLE; K chars cut ⇒
    // the clip markers in the rendered text sum to K. A drift between the two is the silent
    // loss this file exists to abolish, wearing the accounting's clothes.
    {
      const note = liveP.note || "";
      const hidden = Number((note.match(/(\d+) NOT SHOWN/) || [])[1] || 0);
      const cut = Number((note.match(/(\d+) chars CUT/) || [])[1] || 0);
      const markSum = [...liveOut.text.matchAll(/\(\+(\d+) chars cut/g)].reduce((n, m) => n + Number(m[1]), 0);
      const whole = stagedFull.filter((t) => liveOut.text.includes(t)).length;
      assert(`A SQUEEZE IS ACCOUNTED EXACTLY — footer and block agree, and only the budget ever cuts (live: ${stagedFull.length} staged, ${hidden} hidden, ${cut} cut)`,
        liveP.state !== "ok"
        || (markSum === cut
          // Block 3 (18 Aug 2026): a block that shows ZERO facts renders the COLLAPSED one-line form — its count is the accounting
          && (hidden === 0 || liveOut.text.includes(`… ${hidden} older staged fact${hidden === 1 ? "" : "s"} not shown (budget)`) || liveOut.text.includes(`PENDING IDENTITY FACTS: ${hidden} staged, none shown here (budget)`)
            // 18 Aug 2026 evening: the collapsed header YIELDED to the intents floor — the footer alone carries the count (`N NOT SHOWN — budget; header yielded to intents`), the block is absent by design
            || /header yielded to intents/.test(note))
          && whole === stagedFull.length - hidden - (cut ? 1 : 0)));
    }

    // ── THE LIVE CARD WIRE (dead-wire sweep, 11 Aug 2026) ────────────────────
    // Every card assertion above runs on a stub. These run on the REAL owner, because the
    // defect was not in the logic — it was in the CALL: a cap the budget-owner could not see.
    // If learnstate stops exporting CARD_MAX, or the parser stops taking a caller's cap, this
    // module is silently back to billing a clipped card as whole and nothing else would notice.
    const realLs = await import("./learnstate.mjs");
    // Why it is exported, in the owner's words: grep -n "CARD_MAX rides along" scripts/learnstate.mjs
    assert("LIVE · THE OWNER DECLARES THE SHARE — learnstate exports a finite CARD_MAX, which is the whole reason it is exported",
      Number.isFinite(realLs.CARD_MAX));
    const wholeCard = realLs.loadTeachingCard(undefined, Number.MAX_SAFE_INTEGER);
    const tinyCard = realLs.loadTeachingCard(undefined, 50);
    assert("LIVE · THE PARSER TAKES A CALLER'S CAP — the whole card is reachable, and a small cap really bites",
      typeof wholeCard === "string" && wholeCard.length > 50
      && typeof tinyCard === "string" && tinyCard.length < wholeCard.length && tinyCard.includes("truncated"));
    const liveCard = liveOut.manifest.find((m) => m.id === "card");
    assert("LIVE · THE CARD LEG'S BYTES ARE THE CARD THAT SHIPPED — and a cut, if the seventeen rules ever outgrow the cap, is NAMED",
      liveCard.state !== "ok"
      || (liveCard.bytes === (wholeCard.length > realLs.CARD_MAX ? realLs.CARD_MAX + CARD_TAIL.length : wholeCard.length)
        && (wholeCard.length > realLs.CARD_MAX
          ? new RegExp(`TRIMMED from ${wholeCard.length} — cap ${realLs.CARD_MAX}`).test(liveCard.note || "")
          : liveCard.note === null)
        && liveOut.text.includes(wholeCard.slice(0, Math.min(wholeCard.length, realLs.CARD_MAX)))));

    // ── EVERY CITATION IN THIS FILE STILL RESOLVES (dead-wire sweep, 11 Aug 2026) ─
    // The wire that broke: this file's comments carried 17 `<file>:<line>` citations and 14 of
    // them no longer pointed at what they name. That is a producer — the written evidence —
    // with NO consumer: nothing in the organism ever re-read a citation to see if it still
    // landed, which is the precise shape this module was built to abolish, reproduced in its
    // own header. Two of the fourteen were added by a same-day repair and were wrong within
    // the hour (one named a comment about a different file, one named a `console.log`), which
    // is the argument against the FORM, not against whoever wrote them: a line number cannot
    // survive a file that grows, and learnstate has grown ~350 lines since these were written.
    //
    // This assertion is the missing consumer. It resolves every anchor against the real file
    // on disk and NAMES the ones that failed, so a rotted citation tells you which one it is
    // instead of merely that one exists. The pattern is assembled by concatenation so it can
    // never match its own source line, and the `<file>` template in this module's header is
    // skipped for free (`<` is not a filename character).
    const SELF = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const ANCHOR = new RegExp('grep -n ' + '"([^"]+)" ' + '(scripts/[a-z_-]+\\.mjs)', "g");
    const cited = [...SELF.matchAll(ANCHOR)].map(([, needle, file]) => ({ needle, file }));
    const deadCites = cited.filter(({ needle, file }) => {
      try { return !readFileSync(join(ROOT, file), "utf8").includes(needle); } catch { return true; }
    });
    assert(`EVERY CITATION RESOLVES — all ${cited.length} grep anchors in this file still find their code on disk`
      + (deadCites.length ? ` · DEAD: ${deadCites.map((d) => `${d.file} <${d.needle}>`).join(" | ")}` : ""),
      cited.length > 0 && deadCites.length === 0);
    // NOT A COUNT THRESHOLD, AND NOT A GUESS — the five files this module cites as evidence,
    // by name. A bare "some anchors exist" floor would pass a wholesale strip of the trail;
    // this fails if the evidence for any one organ whose defect is documented here is deleted.
    for (const f of ["learnstate.mjs", "organism_test.mjs", "mcp-memory.mjs", "hippocampus.mjs", "dugout.mjs"]) {
      assert(`THE TRAIL TO ${f} SURVIVES — its defect notes here still carry a resolvable anchor`,
        cited.some((c) => c.file.endsWith(f)));
    }
    // …and the rot-prone form stays banned in THIS file. A bare line number does not fail
    // loudly when it goes wrong: it lands on unrelated code and reads verified, which is
    // strictly worse than a citation that is obviously absent. Same call CLAUDE.md made for
    // itself when fsrs.mjs's :143 rotted — it dropped the number and kept the grep.
    assert("NO BARE LINE-NUMBER CITATIONS — the form that rotted 14 times in this file is not allowed back in",
      !new RegExp('[a-z_-]+\\' + '.mjs:[0-9]').test(SELF));

    // ── THE SITTING BRAIN's HEAD (Block 3, 18 Aug 2026) — hermetic: fixture state dir, fixture card, fixture GAFFER text ──
    {
      // pure given ctx: no disk at all — the state reads are the caller's (sitting.mjs)
      const gaffer = "# THE GAFFER\n\n## §0 — WHO HE IS\nenergy-giver, not a cheerleader.\n\n---\n\n## §1 — CANON\nnot in the head\n\n## §2 — THE CAPTAIN BOND\nyou are the skipper\n\n## §3 — THE EMOTIONAL REGISTER\nwarmth and standard\n\n## §4 — SEASON\nno\n\n## §5 — THE THREE HONESTY-OVERRIDES\nsay I don't know\n\n## §9 — THE DELIVERY LAWS\n§9.1 PACE · §9.2 DECLARE THE MAP\n";
      const capsule = { id: "tokenization", title: "Tokenization", lockedOn: "2026-06-15", reJirahDone: ["2026-06-18"], mechanism: "text → tukde → IDs", faultLines: [{ axis: "a", title: "Kya hai", strike: "Token kya hai?", weld: "Token = vocab ka tukda; ID milta hai." }, { axis: "b", title: "BPE", strike: "BPE kaise merge karta hai?", weld: "Frequent pairs merge hote hain." }], traps: [{ bait: "token = word", wrong: "nahi", truth: "subword" }] };
      const base = { gafferText: gaffer, day: "2026-08-18", nightCoachText: "- misconception: hallucination = bug\n- lesson: rate naapte kaise hain", standing: { laws: [] }, learnstate: { loadTeachingCard: (p, cap) => "1. Give ONE new idea per message." }, captain: { tag: "Nikhil (#14)", profile: { tz: "Asia/Kolkata", language: "Hinglish", voice: "Charon" } },
        kickoff: { cur: { id: "1-04", task: "Hallucinations", track: "concept" }, modeLine: "FORGE", ws: { where_left_off: "probe turn", open_loop: "push?" }, watch: ["hallucinations (a)"] }, nextup: { winner: { name: "sprint", line: "1-04 Hallucinations", why: "plan of record" } },
        intents: ["2026-08-18 code · 1 turn · build"], lastReview: null, capsule, ctrl_grammar: "<<CTRL {…}>>", concept: "tokenization" };
      const rev = await assembleSittingSystem({ ...base, route: "REVISION", plan: { map: "Aaj revision?", source: "capsule", units: [{ step: null, axis: "a", kind: "question", text: "Axis a?", question: true, est_seconds: 10 }] } });
      assert("SITTING HEAD · parts in ORDER (role → how_he_learns → gaffer_law → captain → kickoff → plan → capsule → … → pacer_note) and the footer is the LAST line, naming every part",
        rev.text.indexOf("You are THE SITTING BRAIN") < rev.text.indexOf("HOW HE LEARNS") && rev.text.indexOf("HOW HE LEARNS") < rev.text.indexOf("## §0") && rev.text.indexOf("## §0") < rev.text.indexOf("THE CAPTAIN:") && rev.text.indexOf("THE CAPTAIN:") < rev.text.indexOf("KICKOFF") && rev.text.indexOf("KICKOFF") < rev.text.indexOf("THE PLAN (pre-composed") && rev.text.indexOf("THE PLAN (pre-composed") < rev.text.indexOf("CAPSULE 'tokenization'") && rev.text.indexOf("CAPSULE") < rev.text.indexOf("THE PACER RIDES") && rev.text.trim().endsWith("]") && /\[sitting_system: role \d+ · how_he_learns \d+ · gaffer_law \d+ · captain \d+ · agenda EMPTY · kickoff \d+ · plan \d+ · capsule \d+ · review_of_last EMPTY · intents \d+ · standing EMPTY · night_coach \d+ · pacer_note \d+ · assembled \d+\/60000\]$/.test(rev.footer));
      assert("SITTING HEAD · THE_GAFFER §0 §2 §3 §5 §9 ride and §1/§4 do NOT (the same law the mouth's constitution keeps, nothing more)",
        rev.text.includes("## §0") && rev.text.includes("## §2") && rev.text.includes("## §3") && rev.text.includes("## §5") && rev.text.includes("## §9") && !rev.text.includes("## §1 ") && !rev.text.includes("## §4"));
      assert("SITTING HEAD · REVISION carries the WELDS (the weld IS the lesson) and the plan units numbered with step/axis/kind", rev.text.includes("WELD: Token = vocab ka tukda") && /0\. \[step - · axis a · question · \? · 10s\] Axis a\?/.test(rev.text));
      const cold = await assembleSittingSystem({ ...base, route: "REJIRAH", plan: null });
      assert("SITTING HEAD · REJIRAH (cold) carries the STRIKES and WITHHOLDS the welds + mechanism + traps — the truth-layer fence rides into the head", cold.text.includes("STRIKE: Token kya hai?") && !cold.text.includes("WELD:") && !cold.text.includes("MECHANISM (his own words") && !cold.text.includes("KNOWN PITS") && /WITHHELD on purpose/.test(cold.text) && /THE PLAN: not composed yet/.test(cold.text));
      assert("SITTING HEAD · night coach + standing + intents come from ctx (the caller reads state; fixture: night coach present, standing EMPTY named, intents present)", cold.text.includes("NIGHT COACH (2026-08-18") && /standing EMPTY/.test(cold.footer) && cold.text.includes("HIS LAST SESSIONS' ASKS"));
      const tight = await assembleSittingSystem({ ...base, route: "REVISION", plan: null, ceiling: 3_600 });
      assert("SITTING HEAD · a tight ceiling CUTS whole lines from the lowest-priority parts first (night_coach/standing/intents before capsule before plan…), NAMES every cut in the footer, lands ≤ ceiling, role + pacer_note never cut",
        tight.text.length <= 3_600 && /CUT \d+ for the ceiling/.test(tight.footer) && tight.text.includes("You are THE SITTING BRAIN") && tight.text.includes("THE PACER RIDES") && !/role \d+ \(CUT/.test(tight.footer) && !/pacer_note \d+ \(CUT/.test(tight.footer));
      const bare = await assembleSittingSystem({ gafferText: "", learnstate: { loadTeachingCard: () => "" }, route: "FORGE" });
      assert("SITTING HEAD · with nothing on disk every absent part is EMPTY in the footer and the head still has role + kickoff + pacer_note (never a blank head)", /how_he_learns EMPTY/.test(bare.footer) && /gaffer_law EMPTY/.test(bare.footer) && bare.text.includes("You are THE SITTING BRAIN") && bare.text.includes("KICKOFF") && bare.text.includes("THE PACER RIDES"));
      const live = gafferLawText();
      assert("SITTING HEAD · LIVE THE_GAFFER.md parses into the five sections (a renamed heading here goes red the same second)", /## §0 —/.test(live) && /## §2 —/.test(live) && /## §3 —/.test(live) && /## §5 —/.test(live) && /## §9 —/.test(live) && !/## §1 —/.test(live) && live.length > 5000);
      // §9.4 (18 Aug 2026) — the judge's ONE spoken register line rides the next head off the review row
      const withReg = await assembleSittingSystem({ ...base, route: "REVISION", plan: null, lastReview: { sitting_id: "s1", route: "REJIRAH", concept: "tokenization", closed_at: "2026-08-18T05:00:00Z", reason: "his_word", turns: 4, units_delivered: 3, units_composed: 5, banked: 2, what_changes_next: ["open every new label first"], judge: { ok: true, out: "…", register_line: `interviewer yeh shabd sunna chahega: "grounding"` } } });
      assert("SITTING HEAD · review_of_last carries the judge's register line (§9.4) beside what_changes_next — said once, early, never a lecture",
        /THE ROOM'S WORDS LAST TIME/.test(withReg.text) && withReg.text.includes(`sunna chahega: "grounding"`) && /say it ONCE, early/.test(withReg.text) && withReg.text.includes("WHAT CHANGES THIS TIME (its review): open every new label first"));
    }

    console.log(`\ncontext_manifest selftest: ${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  })();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = (process.argv[2] || "show").toLowerCase();
  if (mode === "selftest") selftest();
  else if (mode === "sitting") {
    // the SITTING BRAIN's head as it would be assembled right now — read-only, gathered by sitting.mjs's own context reader
    (async () => {
      const opt = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : undefined; };
      const sm = await import("./sitting.mjs");
      const d = sm.createSitting({});
      const ctx = await d.context({ task: opt("--task") || null, route: opt("--route") || null });
      const r = await assembleSittingSystem({ ...ctx, plan: null, ctrl_grammar: sm.SITTING_CTRL_GRAMMAR });
      console.log(r.text);
    })();
  }
  // `ledger` is ONE JSON line so a child-spawning consumer can JSON.parse the last line
  // and stop regexing a sentence. `footer` (prose) is untouched — layering, not replacing.
  else assemble().then((r) => console.log(
    mode === "ledger" ? JSON.stringify(ledgerOf(r))
      : mode === "footer" ? r.footer
        : r.text));
}
