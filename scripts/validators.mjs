// ============================================================================
// validators.mjs · ARSENAL AI FC — THE ONE ZERO-HALLUCINATION VALIDATOR
// ----------------------------------------------------------------------------
// WHY THIS FILE EXISTS (2 Aug 2026 audit, finding #59):
//   `allowedNumbers` had drifted into THREE implementations — manager.mjs:285,
//   brain.mjs:517 and viz.mjs:131 — and only the manager's carried the 25 Jul
//   fix. The other two still whitelisted EVERY integer 0–31, which is precisely
//   the range a hallucinating LLM fabricates (card counts, rep counts, streaks,
//   small percentages). So the exact string the manager's own comment names as
//   the reason the fix exists — "cards due: 12 (+9 overdue)" — passed the gate
//   on all six `no_new_numbers` jobs, INCLUDING both team-talk mp3s and the
//   Dugout's `day_cartridge` system instruction. The repo advertises the
//   opposite: "the validator will bounce the whole sheet for one invented digit."
//
//   They also blanket-stripped every date and every clock time before the check
//   (brain.mjs:522, viz.mjs:138), so an LLM could invent any deadline
//   ("we ship by 2026-08-01") or any window ("lights out by 22:45") and pass —
//   a fabricated deadline being exactly the calendar-pressure failure mode the
//   manager's Law 5 bans. The manager stopped stripping on 25 Jul; the other two
//   never did.
//
// THE LAW: "use ONLY the numbers you were shown." A digit the wrapper itself put
// in front of the model is, by definition, not invented — so `shown` (the
// assembled prompt) is eaten too. Everything else must trace to a real feature.
//
// LAYERING (CLAUDE.md): this file does not replace the manager's engine — it IS
// the manager's engine, lifted verbatim so three call sites cannot drift again.
// manager.mjs delegates here and keeps its own selftest, which still passes.
// ============================================================================

// Comma-grouped thousands are ONE number, not two (audit finding #60).
// "10,000" used to extract as ["10","000"] and bounce as `invented number: 000`
// — a number the model never invented, it was handed. 33,824 Opus tokens were
// discarded on 31 Jul for exactly this (drill_forge, brain_ledger 16:30:28).
//
// The lookaround form is deliberate. The naive `/,(?=\d{3}\b)/g` breaks Indian
// lakh/crore grouping ("1,00,000" → the "00" group is 2 digits, not 3) and this
// captain writes in Hinglish about Indian-format numbers.
const GROUPING_COMMA = /(?<=\d),(?=\d)/g;
export const dropGroupingCommas = (s) => String(s ?? "").replace(GROUPING_COMMA, "");

// Every numeric token, unsigned — the shape every extractor here agrees on.
const NUM_RE = /\d+(?:\.\d+)?/g;

/**
 * The allowed-number set: every numeric token reachable from `data`, plus every
 * numeric token in `shown` (the text the LLM was actually handed).
 *
 * @param {*} data   the features/inputs object the job was built from
 * @param {string} shown  the assembled prompt (optional but strongly advised)
 * @returns {Set<string>}
 */
export function allowedNumbers(data, shown = "") {
  const set = new Set();
  const eat = (v) => {
    if (v == null) return;
    if (typeof v === "number") {
      if (!Number.isFinite(v)) return;
      set.add(String(v));
      // E2E audit (25 Jul 2026): a negative feature stored only as "-45", but the
      // extractor is unsigned and can only ever yield "45" — so an HONEST sheet
      // citing a past-due ship date ("45 days past the ship date") was bounced as
      // an invented number. Store the magnitude too.
      if (v < 0) set.add(String(Math.abs(v)));
      // Float normalisation only (NOT integer rounding): brain's inputs carry
      // weights like 0.4375 and a faithful quote of one must not bounce on a
      // float-repr difference. Integer rounding is deliberately NOT added — it
      // would put "0" in the set for every fraction, which is laundering.
      const r4 = Math.round(v * 10000) / 10000;
      set.add(String(r4));
      if (r4 < 0) set.add(String(Math.abs(r4)));
      return;
    }
    if (typeof v === "string") {
      for (const n of dropGroupingCommas(v).match(NUM_RE) || []) set.add(n);
      return;
    }
    if (Array.isArray(v)) return v.forEach(eat);
    if (typeof v === "object") return Object.values(v).forEach(eat);
  };
  eat(data);

  // THE PROMPT MAY NOT CONTRADICT ITS OWN VALIDATOR (1 Aug 2026 audit, observed
  // live). shapeFromTiming() is shared by assemblePrompt and fallbackSkeleton, so
  // with the Goalkeeper stale the wrapper INJECTED "one clean 90-min block" into
  // the prompt and then bounced the finished sheet for containing 90 — while the
  // skeleton it published instead carried that same 90. 48,464 Opus tokens
  // discarded, the sheet silently downgraded, and the morning push suppressed, on
  // every day the body read was dark. Eating `shown` enforces the rule that was
  // always written ("use ONLY the numbers you were shown") instead of a stricter
  // one nobody wrote. This does NOT loosen the guard: every digit in `shown`
  // already traces to a computed feature or to a literal the wrapper authored.
  if (shown) eat(String(shown));

  // E2E audit (25 Jul 2026): this used to whitelist EVERY integer 0–31. Shrunk to
  // 1–3, which are genuinely structural (list ordinals: "one/two/three", "1.").
  // Everything else must be traceable to a FEATURE — matchday, counts and dates
  // all already enter the set via eat(data), so no honest output loses anything.
  for (let i = 1; i <= 3; i++) set.add(String(i));
  return set;
}

/**
 * Reject any numeric token in `text` that is not traceable to `data` or `shown`.
 * Dates and clock times are deliberately NOT stripped — see the header.
 *
 * @returns {{ok: true} | {ok: false, bad: string, all: string[]}}
 */
export function noNewNumbers(text, data, shown = "") {
  const allowed = allowedNumbers(data, shown);
  const hay = dropGroupingCommas(text);
  const invented = (hay.match(NUM_RE) || []).filter((n) => !allowed.has(n));
  if (invented.length) {
    const uniq = [...new Set(invented)];
    return { ok: false, bad: uniq[0], all: uniq };
  }
  return { ok: true };
}

/**
 * quotes_only: every quoted segment must appear verbatim in the input.
 *
 * Audit finding #61: the old pattern was /"([^"]{12,})"/g — the ≥12-char floor
 * lived INSIDE the pair matcher, so any anchor shorter than 12 chars desynced the
 * pairing and the regex happily matched from the CLOSING quote of one phrase to
 * the OPENING quote of the next, capturing the annotation text between them as if
 * it were a quote. `lexicon_mine` went 0-for-115 (548,556 tokens in 7 days) and
 * was unwinnable, because his own lexicon holds "one picture" (11), "tera finops"
 * (11) and "naya sawaal" (11) — all under the floor.
 *
 * Fix: pair quotes SEQUENTIALLY (1st↔2nd, 3rd↔4th), then apply the length floor
 * to each resolved pair. Short quotes are now skipped, not desynced.
 */
export function quotesOnly(text, inputData, minLen = 12) {
  const hay = JSON.stringify(inputData);
  const parts = String(text ?? "").split('"');
  // split on '"' → odd indices are the insides of sequential pairs.
  for (let i = 1; i < parts.length; i += 2) {
    const seg = parts[i];
    if (seg.length < minLen) continue;          // below the floor: not our business
    if (!hay.includes(seg)) {
      return { ok: false, bad: seg.slice(0, 40) };
    }
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// selftest
// ---------------------------------------------------------------------------
export function selftest() {
  let pass = 0, fail = 0;
  const ok = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };

  // --- the drift that started it (#59) -------------------------------------
  const F = { matchday: 7, cards: { due: 4 } };
  ok("THE 0-31 HOLE IS CLOSED: an invented 'cards due: 12 (+9 overdue)' bounces",
    noNewNumbers("cards due: 12 (+9 overdue)", F).ok === false);
  ok("...and it names the invented token, not a generic failure",
    noNewNumbers("cards due: 12 (+9 overdue)", F).bad === "12");
  ok("an honest number that IS in the features passes",
    noNewNumbers("matchday 7 · 4 cards due", F).ok === true);
  ok("list ordinals 1-3 still pass (structural, not laundering)",
    noNewNumbers("1. first  2. second  3. third", F).ok === true);
  ok("but 4 as a bare ordinal does NOT (it must trace to a feature)",
    noNewNumbers("4. fourth", { matchday: 7 }).ok === false);

  // --- dates and times are no longer blanket-stripped (#59) -----------------
  ok("an INVENTED deadline bounces (dates are not stripped)",
    noNewNumbers("we ship by 2026-08-01", F).ok === false);
  ok("an INVENTED clock time bounces (times are not stripped)",
    noNewNumbers("lights out by 22:45", F).ok === false);
  ok("an honest date that came from the features passes",
    noNewNumbers("on 2026-08-01", { date: "2026-08-01" }).ok === true);

  // --- comma grouping (#60) ------------------------------------------------
  ok("'10,000' is ONE number, not '10' and '000'",
    noNewNumbers("the wall shows 10,000 tokens", { tokens: 10000 }).ok === true);
  ok("Indian lakh grouping '1,00,000' survives too",
    noNewNumbers("that is 1,00,000 rupees", { amt: 100000 }).ok === true);
  ok("a comma-grouped number that is NOT in the data still bounces",
    noNewNumbers("the wall shows 99,999 tokens", { tokens: 10000 }).ok === false);
  ok("a comma-grouped number inside a STRING input is eaten whole",
    noNewNumbers("10,000", { note: "budget is 10,000 tokens" }).ok === true);

  // --- `shown` threading (#59) ---------------------------------------------
  ok("a digit the WRAPPER put in the prompt is not 'invented'",
    noNewNumbers("one clean 90-min block", {}, "aim for one clean 90-min block").ok === true);
  ok("...but without `shown` that same digit correctly bounces",
    noNewNumbers("one clean 90-min block", {}).ok === false);

  // --- negatives (25 Jul regression) ---------------------------------------
  ok("a negative feature whitelists its magnitude ('45 days past')",
    allowedNumbers({ days_to_ship: -45 }).has("45"));

  // --- quotes_only pairing (#61) -------------------------------------------
  const lex = { phrases: ["one picture", "tera finops", "the whole machine is one long sentence"] };
  ok("QUOTES: a short anchor no longer desyncs the pairing",
    quotesOnly('"one picture" (4× · context+emb) and "tera finops" (×2)', lex).ok === true);
  ok("QUOTES: a genuinely non-verbatim long quote is still caught",
    quotesOnly('he said "this phrase was never in the input at all"', lex).ok === false);
  ok("QUOTES: a long verbatim quote passes",
    quotesOnly('"the whole machine is one long sentence"', lex).ok === true);
  ok("QUOTES: the OLD regex would have failed this exact case (regression witness)",
    (String('"one picture" (4× · context+emb) and "tera finops" (×2)').match(/"([^"]{12,})"/g) || []).length > 0);

  // --- float normalisation, and the laundering that is NOT allowed ---------
  ok("a float feature is quotable at 4dp",
    allowedNumbers({ w: 0.43750001 }).has("0.4375"));
  ok("integer rounding is NOT laundered in ('0' is not free)",
    allowedNumbers({ w: 0.44 }).has("0") === false);

  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "FAILURES: " + fail} (${pass} passed, ${fail} failed)`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  if ((process.argv[2] || "").toLowerCase() === "selftest") process.exit(selftest() ? 0 : 1);
  console.error("usage: node scripts/validators.mjs selftest");
  process.exit(1);
}
