#!/usr/bin/env node
// ============================================================================
// scripts/harness_text.mjs · ARSENAL AI FC — THE HARNESS'S WRAPPER NAMES, IN ONE HOME (rows 852 (2) · 858 (1), 13 Nov 2026)
// ----------------------------------------------------------------------------
// WHAT: the ONLY home of the names of the text the Claude Code harness writes into his lanes as if it were a turn of his:
//   · HARNESS_WRAPPERS — ELEMENT names: a background task's completion, another session's message, a reminder. Each one
//     arrives as `<name …>` … `</name>`, attributes allowed, over many lines.
//   · HARNESS_MARKERS  — LINE-START PREFIXES: the client's own marker for a turn he interrupted.
//   Two frozen lists of names and NOTHING THAT MATCHES. Every reader derives its OWN match shape from these lists:
//     hooks/afferent-post.mjs     isHarnessText  — removes every whole element and every marker line; under 3 characters
//                                                  left = the harness's text, never his (dropped before the spool write)
//     scripts/exchanges.mjs       isSystemBlock  — start-anchored: `<name` for each wrapper, the marker for each prefix
//     scripts/teaching_audit.mjs  HARNESS_PROMPT — start-anchored: `<name` then whitespace or `>`, the marker for each prefix
//   No reader keeps a name literal of its own (row 858 (1)). THE NEXT WRAPPER IS A ONE-LINE CHANGE HERE, and all three
//   readers know it at once.
// WHY ONE HOME: on 13 Nov his Desktop study logged two task-notification blocks as HIS words, and nothing knew
//   cross-session-message, because the same names lived in three separate lists (exchanges.mjs isSystemBlock,
//   teaching_audit.mjs HARNESS_PROMPT, and the list the brief first gave the hook) and each had drifted on its own. Three
//   lists of the same names is the patch shape his global law forbids.
// LAWS: NO IMPORT of its own — the capture nerve loads it on his keystroke, inside the hook's 250 ms budget. WRITES NO FILE
//   and reads none; importing it runs nothing (the selftest runs only as `node scripts/harness_text.mjs selftest`). A name
//   here is a NAME, never a pattern: no match shape lives in this file, so no reader inherits another reader's shape.
// WHO ELSE ACTS ON THIS: the three readers above, each planting every name in its own selftest. A reader that grows a name
//   list of its own is a fourth list: fold it here instead.
// CLI: node scripts/harness_text.mjs selftest
// ============================================================================

// law-waiver:jugad the harness's wrapper NAMES, the one home every reader derives its match from (row 858 (1)), never a subject list
export const HARNESS_WRAPPERS = Object.freeze(["task-notification", "cross-session-message", "system-reminder"]);
// law-waiver:jugad the client's interrupted MARKER, a line-start prefix, the one home every reader derives from (row 858 (1)), never a subject list
export const HARNESS_MARKERS = Object.freeze(["[Request interrupted"]);

// ── SELFTEST — the lists are the contract: frozen, non-empty, no duplicate, no whitespace ──────────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const check = (name, cond) => { if (cond) pass++; else fail++; console.log(`  ${cond ? "ok  " : "FAIL"} ${name}`); };
  const lists = { HARNESS_WRAPPERS, HARNESS_MARKERS };
  for (const [name, list] of Object.entries(lists)) {
    check(`${name} is a FROZEN array — no reader can add a name at run time, only this file can`, Array.isArray(list) && Object.isFrozen(list));
    check(`${name} is NON-EMPTY — an empty list would make every reader's match silently match nothing`, list.length > 0);
    check(`${name} holds strings only, each non-empty — a name, never a pattern object`, list.every((x) => typeof x === "string" && x.length > 0));
    check(`${name} has NO DUPLICATE — one name, one entry`, new Set(list).size === list.length);
    check(`${name} has NO SURROUNDING WHITESPACE and no line break — a reader builds its shape from each entry verbatim`, list.every((x) => x === x.trim() && !/[\r\n]/.test(x)));
  }
  check("the two lists share no entry — an element name is never also a line prefix", !HARNESS_WRAPPERS.some((x) => HARNESS_MARKERS.includes(x)));
  check("every wrapper is an ELEMENT NAME with NO WHITESPACE at all (letters, digits, '-'), so `<name` and `</name>` are exact", HARNESS_WRAPPERS.every((x) => /^[a-z][a-z0-9-]*$/.test(x)));
  console.log(`\n${fail ? `harness_text: ${fail} CHECK(S) FAILED of ${pass + fail}` : `harness_text: ALL CHECKS PASSED ${pass}`}`);
  return fail === 0;
}

// ── THE ENTRYPOINT GUARD — importing this module runs NOTHING (no import, so the path is compared by hand) ─────────────
const selfPath = () => {
  if (import.meta.filename) return import.meta.filename;
  const p = decodeURIComponent(new URL(import.meta.url).pathname);
  return /^\/[A-Za-z]:\//.test(p) ? p.slice(1) : p;
};
const samePath = (a, b) => String(a || "").replace(/\\/g, "/").toLowerCase() === String(b || "").replace(/\\/g, "/").toLowerCase();
const INVOKED_DIRECTLY = typeof process === "object" && Array.isArray(process.argv) && !!process.argv[1] && samePath(process.argv[1], selfPath());
if (INVOKED_DIRECTLY) {
  if ((process.argv[2] || "") === "selftest") process.exit(selftest() ? 0 : 1);
  console.log("harness_text: selftest   (the harness's wrapper names, one home; it writes nothing)");
  process.exit(2);
}
