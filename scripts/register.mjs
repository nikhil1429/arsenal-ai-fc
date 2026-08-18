#!/usr/bin/env node
// ============================================================================
// register.mjs · ARSENAL AI FC — THE REGISTER CHECK (18 Aug 2026, OVERHAUL Block 4 · §9.4)
// ----------------------------------------------------------------------------
// HIS ASK, 18 Aug 2026: "my vocab checked against real-world used vocab". An
// interview is judged on the MECHANISM (the truth layer, gaffer_brain.mjs) — and,
// separately, on whether the candidate speaks the room's language. This organ is
// the second half, and it is PURE CODE around the judge's reading:
//
//   hedges    — COUNTED HERE, never by the model. The regex below is the scrimmage's
//               own hedge meter (dugout.mjs since 24 Jul 2026, "the ear's one legal
//               surface, measured off-mic"), MOVED here 18 Aug so ONE definition serves
//               the Gaffer's off-mic count and every banked answer alike (layering: moved,
//               not re-typed; dugout imports it back from here).
//   expected  — the industry terms a real panel would want in THIS answer. The JUDGE
//               names them, but ONLY from the ground it was already given (his interview
//               lines, the DOSSIER's red-flags and grammar, the sourced field questions);
//               validateRegister() DROPS and NAMES any term that is not in that corpus —
//               the intent-digest law: a label the input never contained is invented.
//   used      — which of those (and which key terms the judge heard) he actually said:
//               re-checked against his transcript here; a "used" term he never uttered
//               is dropped.
//   missing   — RECOMPUTED here as expected − said. The model's own `missing` is not
//               trusted; the answer to "did he say it" is a substring test, not a read.
//
// WHY A SEPARATE FILE. gaffer_brain.mjs holds, in its own selftest, "not one regex in
// this file tests HIS words" (his 15 Aug vocab-agnostic ruling: a GATE that decides by
// vocabulary fails both ways). The hedge meter is not a gate — it is a MEASUREMENT he
// designed and reads on the wall, and it never decides a verdict, a wake or a card. It
// still tests his words, so it lives here, named for what it is, and gaffer_brain
// imports the count.
//
// LAWS: PURE. Reads nothing, writes nothing, spends nothing. Every function is total:
//   any shape in, a legal register (or null) out. No number here is tuned — the caps
//   are the judge row's own field caps (gaffer_brain settled rows clip lists at 8).
// CLI: node scripts/register.mjs selftest · hedges "<text>"
// ============================================================================
import { pathToFileURL } from "node:url";

// THE HEDGE METER — verbatim the scrimmage's (dugout.mjs, 24 Jul 2026). Hinglish and
// English hedges in one list; `g` so `.match` counts every occurrence.
export const HEDGE_RE = /\b(shayad|matlab|i think|i guess|maybe|probably|sort of|kind of|hopefully|not sure|i feel like)\b/gi;
export const countHedges = (text) => (String(text || "").match(HEDGE_RE) || []).length;

// THE FIVE INTERVIEW-FACING TYPES — the ones a real panel hears. Declared once, read by
// gaffer_brain (which types get a `register` on their verdict).
export const REGISTER_TYPES = ["interview", "hidden_test", "adversarial", "scrimmage", "voice_rep"];
export const REGISTER_MAX_TERMS = 8;
export const REGISTER_TERM_MAX_CHARS = 40;

const norm = (s) => String(s == null ? "" : s).toLowerCase().replace(/\s+/g, " ").trim();
const cleanTerm = (t) => (typeof t === "string" ? norm(t).slice(0, REGISTER_TERM_MAX_CHARS) : "");
const uniq = (arr) => [...new Set(arr)];

// validateRegister(fromModel, { spoken, corpus }) → { used, expected, missing, hedges, dropped } | null
//   fromModel — whatever the judge returned under "register" (any shape)
//   spoken    — his answer, verbatim
//   corpus    — the text the judge was GIVEN (head + body): the only legal source of `expected`
// A missing/unusable model block still yields a register: hedges is code's and always
// present; expected/used empty; `dropped` names every term the validator refused and why.
export function validateRegister(fromModel, { spoken = "", corpus = "" } = {}) {
  const said = norm(spoken), ground = norm(corpus);
  const inSaid = (t) => !!t && said.includes(t);
  const inGround = (t) => !!t && ground.includes(t);
  const dropped = [];
  const m = fromModel && typeof fromModel === "object" && !Array.isArray(fromModel) ? fromModel : {};
  const rawExpected = Array.isArray(m.expected) ? m.expected : [];
  const rawUsed = Array.isArray(m.used) ? m.used : [];
  const expected = [];
  for (const raw of rawExpected.slice(0, REGISTER_MAX_TERMS * 2)) {
    const t = cleanTerm(raw);
    if (!t) continue;
    if (!inGround(t)) { dropped.push({ term: t, why: "not in the ground the judge was given — invented" }); continue; }
    expected.push(t);
  }
  const exp = uniq(expected).slice(0, REGISTER_MAX_TERMS);
  const used = [];
  for (const raw of rawUsed.slice(0, REGISTER_MAX_TERMS * 2)) {
    const t = cleanTerm(raw);
    if (!t) continue;
    if (!inSaid(t)) { dropped.push({ term: t, why: "marked used but he never said it" }); continue; }
    used.push(t);
  }
  // what he said of what was expected counts as used whether or not the model listed it
  for (const t of exp) if (inSaid(t)) used.push(t);
  const usedOut = uniq(used).slice(0, REGISTER_MAX_TERMS);
  const missing = exp.filter((t) => !inSaid(t));
  return { used: usedOut, expected: exp, missing, hedges: countHedges(spoken), dropped };
}

// THE ONE SPOKEN LINE at round close (his 7 Aug law: one line, at an anchor he already
// hits). Given every register of the round, the two terms the room most wanted and did
// not hear — or nothing, when nothing was missing. Deterministic: ties break by first
// appearance, so the same round always speaks the same line.
export function registerLine(registers = []) {
  const counts = new Map();
  for (const r of registers) for (const t of ((r && r.missing) || [])) counts.set(t, (counts.get(t) || 0) + 1);
  if (!counts.size) return null;
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => `"${t}"`);
  const hedges = registers.reduce((a, r) => a + ((r && r.hedges) || 0), 0);
  return `interviewer yeh ${top.length === 1 ? "shabd" : "do shabd"} sunna chahega: ${top.join(" · ")}${hedges ? ` — aur ${hedges} hedge${hedges === 1 ? "" : "s"} (shayad/maybe/i think) kaate ja sakte hain` : ""}`;
}

// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond, detail = "") => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ""}`); } };
  console.log("=== register.mjs selftest (§9.4, 18 Aug 2026) ===\n");

  // THE HEDGE METER — verbatim the scrimmage's, and dugout must import it back
  assert("HEDGES · the scrimmage's own assertion holds here verbatim — Hinglish + English hedges counted, a clean sentence counts 0",
    countHedges("CAPTAIN: Shayad yeh matlab I think sahi hai") === 3 && countHedges("CAPTAIN: cosine normalizes magnitude, full stop") === 0);
  assert("HEDGES · every occurrence counts, not every distinct word (the `g` flag is part of the meter)",
    countHedges("maybe yes maybe no, i think so, i think") === 4);
  assert("HEDGES · null/undefined/number in → 0 out, never a throw (total)", countHedges(null) === 0 && countHedges(undefined) === 0 && countHedges(42) === 0);

  // THE ACCEPTANCE THE PLAN NAMES: three hedges + one missing term → exactly that
  const CORPUS = `HIS OWN GROUND FOR "hallucinations": WHAT HE CALLS INTERVIEW-GRADE here: grounding beats scale · a retrieval-augmented answer cites its source · measure hallucination rate on a held-out set
EXTERNAL GROUND FOR "hallucinations": · How would you measure hallucination rate in production? [https://example.org/q]`;
  const SPOKEN = "shayad model ne bina source ke bola, matlab woh guess kar raha tha, i think hallucination rate naapna padega ek held-out set pe";
  const r1 = validateRegister({ used: ["hallucination rate", "held-out set"], expected: ["hallucination rate", "held-out set", "grounding"], missing: ["grounding", "held-out set"] }, { spoken: SPOKEN, corpus: CORPUS });
  assert("ACCEPTANCE · a fixture answer with THREE hedges and ONE missing term yields exactly {hedges:3, missing:['grounding']} — the model's own `missing` (which wrongly listed a said term) is not trusted",
    r1.hedges === 3 && JSON.stringify(r1.missing) === JSON.stringify(["grounding"]), JSON.stringify(r1));
  assert("ACCEPTANCE · used = what he actually said of the expected terms (re-checked against his transcript, not taken on the model's word)",
    JSON.stringify(r1.used) === JSON.stringify(["hallucination rate", "held-out set"]) && r1.dropped.length === 0, JSON.stringify(r1));

  // THE INTENT-DIGEST LAW: a term not in the corpus is DROPPED and NAMED
  const r2 = validateRegister({ used: ["chain-of-thought"], expected: ["grounding", "retrieval-augmented", "constitutional ai"] }, { spoken: SPOKEN, corpus: CORPUS });
  assert("LAW · an expected term the judge INVENTED (not in the ground it was given) is dropped and named — 'constitutional ai' never reaches his record",
    !r2.expected.includes("constitutional ai") && r2.dropped.some((d) => d.term === "constitutional ai" && /invented/.test(d.why)));
  assert("LAW · a term marked USED that he never said is dropped and named — a register cannot credit words he did not say",
    !r2.used.includes("chain-of-thought") && r2.dropped.some((d) => d.term === "chain-of-thought" && /never said/.test(d.why)));
  assert("LAW · …and the legal ones survive: expected keeps the two grounded terms, both missing because he said neither",
    JSON.stringify(r2.expected) === JSON.stringify(["grounding", "retrieval-augmented"]) && JSON.stringify(r2.missing) === JSON.stringify(["grounding", "retrieval-augmented"]) && r2.used.length === 0);

  // TOTAL: any shape in
  for (const junk of [null, undefined, "x", 3, [], { expected: "grounding" }, { used: 7 }]) {
    const r = validateRegister(junk, { spoken: SPOKEN, corpus: CORPUS });
    assert(`TOTAL · junk register block (${JSON.stringify(junk)}) still yields a legal register with hedges counted by code`,
      r && Array.isArray(r.used) && Array.isArray(r.expected) && Array.isArray(r.missing) && r.hedges === 3);
  }
  assert("CAPS · at most 8 terms per list, each ≤ 40 chars, case/whitespace-normalised, de-duplicated",
    (() => { const many = Array.from({ length: 20 }, (_, i) => `grounding ${i}`); const corpus = many.join(" · ") + " GROUNDING"; const r = validateRegister({ expected: [...many, "  Grounding ", "grounding"] }, { spoken: "", corpus }); return r.expected.length === 8 && r.expected.every((t) => t.length <= 40) && !r.expected.some((t, i) => r.expected.indexOf(t) !== i); })());
  assert("REGISTER_TYPES · exactly the five interview-facing types the plan names",
    REGISTER_TYPES.join(",") === "interview,hidden_test,adversarial,scrimmage,voice_rep");

  // THE ONE SPOKEN LINE
  assert("LINE · the round's line names the two most-missed terms and the hedge count — one line, deterministic",
    registerLine([r2, r1]) === `interviewer yeh do shabd sunna chahega: "grounding" · "retrieval-augmented" — aur 6 hedges (shayad/maybe/i think) kaate ja sakte hain`, registerLine([r2, r1]));
  assert("LINE · nothing missing anywhere → no line at all (silence over a fabricated ask)",
    registerLine([{ used: ["a"], expected: ["a"], missing: [], hedges: 0 }]) === null && registerLine([]) === null);
  assert("LINE · one missing term → 'shabd', not 'do shabd'; zero hedges → no hedge clause",
    registerLine([{ missing: ["grounding"], hedges: 0 }]) === `interviewer yeh shabd sunna chahega: "grounding"`);

  console.log(`\nregister selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = (process.argv[2] || "selftest").toLowerCase();
  if (mode === "selftest") selftest();
  else if (mode === "hedges") console.log(String(countHedges(process.argv.slice(3).join(" "))));
  else { console.error("usage: register.mjs selftest | hedges \"<text>\""); process.exit(1); }
}
