#!/usr/bin/env node
// @ts-check
// ============================================================================
// witness_cause.mjs · ARSENAL AI FC — A RED WITNESS LEAVES ITS FAILING CLAUSE READABLE (unit mdtl, forks row 1186)
//   SOLE WRITER of: NOTHING. Pure exports; it reads only the text a caller hands it, and prints only in `selftest`.
// ----------------------------------------------------------------------------
// WHY IT EXISTS. On the neutral machine a red witness showed up as an assert NAME only (`WITNESS ‹mf2› · GREEN at head
// against its BASE`): its clause and reason stayed on the runner, because the detail line has no safety rule — a planted
// witness that reads a planted state file gets its canary out through the clause-id channel (the spec's M6). So the
// detail is never printed. Instead a CAUSE is built ONLY from bytes that are already public (row 1186 F2 R2):
//   · a clause id that is a LITERAL of the witness's own tracked source (a quoted string that opens with it, or a header
//     claim line) — any other token becomes ONE `WITHHELD` entry, and the token itself never leaves;
//   · that clause's ONE-LINE CLAIM, read from the witness's own tracked header (struck `~~` text skipped, L9);
//   · the member's own literals (below), and digit runs.
// Two checks by two files: scripts/organism_test.mjs builds causes with causesOf(); scripts/ci_verdict.mjs re-reads the
// witness source and keeps a cause only if verifyCause() rebuilds it byte for byte, else it is WITHHELD. Shape C (opt-in
// CAUSE codes in a witness) is NOT built here (row 1186 F2). No length, size or bound is typed in this file.
// UNIT mkp24 (forks row 1216 K-F2 C0 · K-F3 A · K-F10 A), ONE edit of this module:
//   · K-F10 A, the multi-word clause id: a header claim line whose id runs up to its column gap (two spaces or more, or
//     ` · `) and a quoted literal `"<ID>( <ID>)* · "` name the WHOLE id (`T1 IDLE`, `M1 PORTHELD`); causesOf matches the
//     judged ids GREEDILY, the longest known id first. judgeLast (scripts/organism_test.mjs) is untouched, so the judged
//     name and detail stay byte-identical and every KNOWN_RED entry keeps its match.
//   · K-F2 C0, the code rule: a witness may print `CAUSE <ID> <CODE>` before a red clause line; it is kept only when <ID>
//     is a judged red id and <CODE> (the CODE grammar: no digits) is a key of the `const CAUSES = { … }` literal of the
//     witness's OWN tracked source, and the text that leaves is THAT literal's value (no digits), re-read from the source by
//     both checks, never the witness's stdout. Any other CAUSE line on a red id becomes the one WITHHELD entry.
// MODES: selftest
// CLI: node scripts/witness_cause.mjs selftest
// ============================================================================
import { pathToFileURL } from "node:url";

/** a clause id, the grammar organism_test.mjs boundIds already assumes */
export const ID = /^[A-Z][A-Z0-9-]*$/;
/** unit mkp24 (K-F10 A): a clause id of one word or more, each of the ID grammar, one space apart */
export const IDS = /^[A-Z][A-Z0-9-]*(?: [A-Z][A-Z0-9-]*)*$/;
/** unit mkp24 (K-F2 C0): a cause code, a key of the witness's own CAUSES literal — no digits */
export const CODE = /^[A-Z][A-Z-]*$/;
export const WITHHELD = "WITHHELD";
export const WITHHELD_TEXT = "a clause id that is not a literal of the witness's own source was withheld";
export const NO_CLAIM = "(no header claim for this id in its source)";
/** the member's own literals: the reds organism_test.mjs makes itself, never a witness's bytes */
export const MEMBER = {
  GRAMMAR: "the LAST line is not the witness grammar",
  KILLED: "killed at the member's bound (suite.yml timeout-minutes)",
};
const GRAMMAR_TEXT = /^the LAST line is not the witness grammar \(exit (?:\d+|none)\)$/;

/** the header: every line before the first `import` line @param {string} src */
const headerLines = (src) => {
  const L = String(src).split(/\r?\n/);
  const end = L.findIndex((l) => /^import\s/.test(l));
  return end < 0 ? L : L.slice(0, end);
};

/** every header claim line, the FIRST per id: `//<indent><ID> · <text>` or `//<indent><ID><space><text>`. The indent is the
 *  one the header's own BOUND claim uses (derived, never typed; any indent when the header names no BOUND). A line that
 *  carries `~~`, or sits inside a struck span, is skipped.
 *  @param {string} src @returns {Map<string, string>} */
export function claimLines(src) {
  const H = headerLines(src);
  const b = H.map((l) => /^\/\/(\s+)(?:[A-Z][A-Z0-9-]*\s+·\s+)*BOUND\b/.exec(l)).find(Boolean);
  const indent = b ? b[1] : null;
  /** @type {Map<string, string>} */
  const out = new Map();
  let struck = false;
  for (const l of H) {
    const marks = (l.match(/~~/g) || []).length;
    if (marks || struck) { if (marks % 2) struck = !struck; continue; }
    const m = /^\/\/(\s+)([A-Z][A-Z0-9-]*)(?:\s+·\s+|\s+)(\S.*?)\s*$/.exec(l);
    if (!m || (indent !== null && m[1] !== indent)) continue;
    if (!out.has(m[2])) out.set(m[2], m[3]);
    // unit mkp24 (K-F10 A): the multi-word id runs up to its column gap; its first word keeps the claim it had above
    const w = /^\/\/\s+([A-Z][A-Z0-9-]*(?: [A-Z][A-Z0-9-]*)+)(?:\s+·\s+|\s{2,})(\S.*?)\s*$/.exec(l);
    if (w && !out.has(w[1])) out.set(w[1], w[2]);
  }
  return out;
}

/** the one-line claim of <id> in <src>, or null @param {string} src @param {string} id */
export const claimOf = (src, id) => claimLines(src).get(id) ?? null;

/** every id that is a literal of <src>: a quoted string that IS the id or opens with it, and every header claim id
 *  @param {string} src @returns {Set<string>} */
export function idsInSource(src) {
  const ids = new Set(claimLines(src).keys());
  for (const m of String(src).matchAll(/(["'`])([A-Z][A-Z0-9-]*)(?=\1|[\s·,:])/g)) ids.add(m[2]);
  for (const m of String(src).matchAll(/(["'`])([A-Z][A-Z0-9-]*(?: [A-Z][A-Z0-9-]*)+)(?=\1| · )/g)) ids.add(m[2]);   // unit mkp24 (K-F10 A)
  return ids;
}

/** unit mkp24 (K-F2 C0): the codes of <src>'s own `const CAUSES = { "<CODE>": "<text>", … }` literal — a key of the CODE
 *  grammar with a text carrying no digit, no quote, no backslash and no line break; the first per key
 *  @param {string} src @returns {Map<string, string>} */
export function codesOf(src) {
  const out = new Map();
  const m = /(?:^|\n)const CAUSES = \{([^}]*)\}/.exec(String(src));
  if (!m) return out;
  for (const p of m[1].matchAll(/"([^"\\\r\n]*)"\s*:\s*"([^"\\\r\n]*)"/g)) if (CODE.test(p[1]) && !/\d/.test(p[2]) && !out.has(p[1])) out.set(p[1], p[2]);
  return out;
}

/** the causes of ONE judged witness red. kind "killed" and "grammar" are the member's own reds; otherwise the tokens of
 *  <left> (the ids beyond BOUND) are matched GREEDILY against the literal ids of <src>, the longest first (unit mkp24,
 *  K-F10 A); each matched id keeps its header claim, then (K-F2 C0) the CODE of every `CAUSE <that id> <CODE>` line of
 *  <cause> whose CODE is a key of <src>'s CAUSES literal, as `<CODE> · <that literal's text>`. Every token that is no
 *  literal, and every CAUSE line on a matched id whose CODE is no key, becomes ONE WITHHELD entry; a CAUSE line on an id
 *  that is not a judged red is dropped.
 *  @param {{ left?: string, src?: string, kind?: "clauses"|"killed"|"grammar", code?: number|null, cause?: string[] }} a
 *  @returns {{ id: string, text: string }[]} */
export function causesOf({ left = "", src = "", kind = "clauses", code = null, cause = [] }) {
  if (kind === "killed") return [{ id: "KILLED", text: MEMBER.KILLED }];
  if (kind === "grammar") return [{ id: "GRAMMAR", text: `${MEMBER.GRAMMAR} (exit ${Number.isInteger(code) && /** @type {number} */ (code) >= 0 ? code : "none"})` }];
  const ids = idsInSource(src), codes = codesOf(src), out = [], seen = new Set();
  const wide = Math.max(1, ...[...ids].map((i) => i.split(" ").length));
  const said = [...cause].map((l) => /^CAUSE (\S.*?) (\S+)$/.exec(String(l).trim())).filter(Boolean);
  const toks = String(left).split(/\s+/).filter(Boolean);
  let withheld = false;
  for (let i = 0; i < toks.length;) {
    let hit = null;
    for (let n = Math.min(wide, toks.length - i); n >= 1 && !hit; n--) { const c = toks.slice(i, i + n).join(" "); if (IDS.test(c) && ids.has(c)) hit = c; }
    if (!hit) { withheld = true; i++; continue; }
    i += hit.split(" ").length;
    if (seen.has(hit)) continue;
    seen.add(hit);
    out.push({ id: hit, text: claimOf(src, hit) ?? NO_CLAIM });
    const kept = new Set();
    for (const m of said.filter((x) => /** @type {RegExpExecArray} */ (x)[1] === hit)) {
      const k = /** @type {RegExpExecArray} */ (m)[2];
      if (!(CODE.test(k) && codes.has(k))) { withheld = true; continue; }
      if (!kept.has(k)) { kept.add(k); out.push({ id: hit, text: `${k} · ${codes.get(k)}` }); }
    }
  }
  if (withheld) out.push({ id: WITHHELD, text: WITHHELD_TEXT });
  return out;
}

/** a cause as the machine line carries it @param {string} member @param {{ id: string, text: string }} c */
export const causeText = (member, c) => `${member} · ${c.id} · ${c.text}`;

/** the unit a member name names: the text inside ‹ › @param {string} name */
export const unitOf = (name) => (/‹([a-z0-9-]+)›/.exec(String(name)) || [])[1] || null;

/** the witness file paths a unit may use (organism_test.mjs witnessFile's two spellings), root-relative @param {string} unit */
export const sourcePaths = (unit) => [...new Set([`ci/${unit}/witness_${unit}.mjs`, `ci/${unit}/witness_${unit.replace(/-/g, "_")}.mjs`])];

/** THE SECOND CHECK (made by ci_verdict.mjs, a different file): <line> must start with one of <reds> and rebuild byte for
 *  byte from the unit's own source (or be a member literal); otherwise it becomes that member's WITHHELD cause. A line
 *  that names no red is dropped. @param {string} line @param {string[]} reds @param {(unit: string) => string} readSrc
 *  @returns {{ member: string, cause: string } | null} */
export function verifyCause(line, reds, readSrc) {
  const s = String(line);
  const member = [...reds].sort((a, b) => b.length - a.length).find((r) => s.startsWith(`${r} · `));
  if (!member) return null;
  const withheld = { member, cause: `${WITHHELD} · ${WITHHELD_TEXT}` };
  const m = /^([A-Z][A-Z0-9-]*(?: [A-Z][A-Z0-9-]*)*) · (.*)$/s.exec(s.slice(member.length + 3));   // unit mkp24: a multi-word id
  if (!m || /[\r\n]/.test(m[2])) return withheld;
  const [, id, text] = m;
  const unit = unitOf(member);
  const ok = (id === WITHHELD && text === WITHHELD_TEXT) || (id === "KILLED" && text === MEMBER.KILLED) || (id === "GRAMMAR" && GRAMMAR_TEXT.test(text))
    || (!!unit && (() => {
      const src = String(readSrc(unit) || "");
      if (!src || !idsInSource(src).has(id)) return false;
      if (text === (claimOf(src, id) ?? NO_CLAIM)) return true;
      const c = /^([A-Z][A-Z-]*) · (.*)$/s.exec(text);   // unit mkp24 (K-F2 C0): a code's text is re-read from the source
      return !!c && codesOf(src).get(c[1]) === c[2];
    })());
  return ok ? { member, cause: `${id} · ${text}` } : withheld;
}

function selftest() {
  let pass = 0, fail = 0;
  const ok = (name, cond) => { if (cond) pass++; else fail++; console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const src = [
    "#!/usr/bin/env node",
    "// CONTRACT: node ci/toy/witness_toy.mjs --org <tree> --base-org <tree>",
    "//   P1 · the planted clause claims one thing",
    "//        P9 a continuation line at another indent is never a claim",
    "//   P2   a claim with no separator",
    "//   P3 · ~~a struck claim~~",
    "//   P4 · ~~a struck span that opens here",
    "//        and closes here~~",
    "//   P4 · the claim that replaced it",
    "//   BOUND outside ci/, only the named files differ.",
    "import { x } from \"y\";",
    "clause(\"P1\", ok, why); clause('P2', ok, why); clause(`P5 · x`, ok, why); const s = \"//   P6 · not a header line\";",
  ].join("\r\n");
  ok("claimOf reads the header claim (` · ` and whitespace forms), CRLF-proof", claimOf(src, "P1") === "the planted clause claims one thing" && claimOf(src, "P2") === "a claim with no separator");
  ok("claimOf: a line at another indent than BOUND's is no claim; a line after the first import is no claim", claimOf(src, "P9") === null && claimOf(src, "P6") === null);
  ok("claimOf skips struck text (a ~~ line, a struck span) and reads the line that replaced it (L9)", claimOf(src, "P3") === null && claimOf(src, "P4") === "the claim that replaced it");
  const ids = idsInSource(src);
  ok("idsInSource: clause literals (\" ' `) and header claim ids", ["P1", "P2", "P5", "P4", "BOUND"].every((i) => ids.has(i)) && !ids.has("Q1234ABCD"));
  const c1 = causesOf({ left: "P1 P5", src });
  ok("causesOf: a literal id keeps its header claim, a literal with no claim says so", c1.length === 2 && c1[0].text === "the planted clause claims one thing" && c1[1].text === NO_CLAIM);
  const CAN = "Q0F3A9C1D77E2B4";
  const c2 = causesOf({ left: `P1 ${CAN} ${CAN}X`, src });
  ok("causesOf: a token that is not a literal of the source becomes ONE WITHHELD entry and never leaves", c2.length === 2 && c2[1].id === WITHHELD && !JSON.stringify(c2).includes(CAN));
  ok("causesOf: the member's own reds are member literals (killed · grammar with the exit's digits, or none)",
    causesOf({ kind: "killed" })[0].text === MEMBER.KILLED && causesOf({ kind: "grammar", code: 3 })[0].text.endsWith("(exit 3)") && causesOf({ kind: "grammar", code: null })[0].text.endsWith("(exit none)"));
  const M = "WITNESS ‹toy› · GREEN at head against its BASE";
  const read = (u) => (u === "toy" ? src : "");
  const v1 = verifyCause(causeText(M, c1[0]), [M], read);
  ok("verifyCause keeps a cause that rebuilds from the unit's own source", !!v1 && v1.member === M && v1.cause === "P1 · the planted clause claims one thing");
  const forged = "a forged text that sits in no source";
  ok("verifyCause: a forged text, an id not in the source, a text with a line break, each becomes WITHHELD",
    [`${M} · P1 · ${forged}`, `${M} · ${CAN} · ${NO_CLAIM}`, `${M} · P1 · the planted clause claims one thing\nmore`].every((l) => { const v = verifyCause(l, [M], read); return !!v && v.cause.startsWith(`${WITHHELD} · `) && !v.cause.includes(forged) && !v.cause.includes(CAN); }));
  ok("verifyCause: a member literal and WITHHELD pass; a line naming no red is dropped; an unreadable source withholds",
    verifyCause(causeText(M, causesOf({ kind: "killed" })[0]), [M], read)?.cause.startsWith("KILLED") === true
    && verifyCause(causeText(M, c2[1]), [M], read)?.cause === `${WITHHELD} · ${WITHHELD_TEXT}` && verifyCause(`NOT A RED · P1 · x`, [M], read) === null
    && verifyCause(causeText(M, c1[0]), [M], () => "")?.cause.startsWith(WITHHELD) === true);
  ok("unitOf / sourcePaths: the unit inside ‹ ›, both witness spellings", unitOf(M) === "toy" && sourcePaths("mfac-floor").length === 2 && sourcePaths("mf2").length === 1);
  // unit mkp24 (forks row 1216 K-F10 A · K-F2 C0)
  const msrc = [
    "#!/usr/bin/env node",
    "//   T1 IDLE      spool drained: a write retires the worker.",
    "//   T2 ONCE      a stream lands once.",
    "//   M1 RESTART   the restart claim",
    "//   M1 PORTHELD  the port-held claim",
    "//   LIVE-SAFE    the live ports are safe",
    "//   XML · BOUND · LAST  as in every unit.",
    "import { x } from \"y\";",
    "const CAUSES = {",
    "  \"RETIRE-LATE\": \"no RETIRING line by the bound\",",
    "  \"LOST\": \"an event never landed\",",
    "  \"DIGIT-TEXT\": \"a text with 4112 in it\",",
    "};",
    "clause(\"T1 IDLE · spool drained\", f); clause(\"T2 ONCE · once\", f); clause(\"M1 PORTHELD · port\", f); clause(\"LIVE-SAFE · safe\", f);",
  ].join("\r\n");
  const r1 = causesOf({ left: "T1 IDLE LIVE-SAFE", src: msrc });
  ok("mkp24 K-F10 · a multi-word id is matched whole, longest first: `T1 IDLE LIVE-SAFE` gives T1 IDLE and LIVE-SAFE, no WITHHELD",
    r1.length === 2 && r1[0].id === "T1 IDLE" && r1[0].text === "spool drained: a write retires the worker." && r1[1].id === "LIVE-SAFE" && !r1.some((c) => c.id === WITHHELD));
  const r2 = causesOf({ left: "M1 PORTHELD", src: msrc });
  ok("mkp24 K-F10 · `M1 PORTHELD` gives its OWN claim (not M1 RESTART's); the first word keeps its old claim", r2.length === 1 && r2[0].id === "M1 PORTHELD" && r2[0].text === "the port-held claim" && claimOf(msrc, "M1") === "RESTART   the restart claim");
  ok("mkp24 C0 · codesOf reads the CAUSES literal: CODE-grammar keys, a text with a digit is no code", codesOf(msrc).get("RETIRE-LATE") === "no RETIRING line by the bound" && codesOf(msrc).has("LOST") && !codesOf(msrc).has("DIGIT-TEXT") && codesOf(src).size === 0);
  const r3 = causesOf({ left: "T1 IDLE T2 ONCE", src: msrc, cause: ["CAUSE T1 IDLE RETIRE-LATE", "CAUSE T2 ONCE LOST\r", "CAUSE T2 ONCE LOST", "CAUSE M1 PORTHELD LOST"] });
  ok("mkp24 C0 · a CAUSE code that is a key rides its red id as `<CODE> · <the literal's text>`; a CAUSE on a green id is dropped",
    JSON.stringify(r3) === JSON.stringify([{ id: "T1 IDLE", text: "spool drained: a write retires the worker." }, { id: "T1 IDLE", text: "RETIRE-LATE · no RETIRING line by the bound" }, { id: "T2 ONCE", text: "a stream lands once." }, { id: "T2 ONCE", text: "LOST · an event never landed" }]));
  const r4 = causesOf({ left: "T1 IDLE", src: msrc, cause: [`CAUSE T1 IDLE ${CAN}`, "CAUSE T1 IDLE DIGIT-TEXT", "CAUSE T1 IDLE NOT-A-KEY"] });
  ok("mkp24 C0 · a CAUSE whose code is no key (a canary, a digit text, an unknown code) becomes ONE WITHHELD and never leaves",
    r4.length === 2 && r4[1].id === WITHHELD && !JSON.stringify(r4).includes(CAN) && !JSON.stringify(r4).includes("4112"));
  const MM = "WITNESS ‹mtoy› · GREEN at head against its BASE", mread = (u) => (u === "mtoy" ? msrc : "");
  ok("mkp24 · verifyCause rebuilds a multi-word claim and a code's text from the source; a forged code text is WITHHELD",
    verifyCause(causeText(MM, r1[0]), [MM], mread)?.cause === "T1 IDLE · spool drained: a write retires the worker."
    && verifyCause(causeText(MM, r3[1]), [MM], mread)?.cause === "T1 IDLE · RETIRE-LATE · no RETIRING line by the bound"
    && verifyCause(`${MM} · T1 IDLE · RETIRE-LATE · ${forged}`, [MM], mread)?.cause === `${WITHHELD} · ${WITHHELD_TEXT}`
    && verifyCause(`${MM} · T1 IDLE · DIGIT-TEXT · a text with 4112 in it`, [MM], mread)?.cause === `${WITHHELD} · ${WITHHELD_TEXT}`);
  console.log(`\nwitness_cause selftest: ${pass} passed, ${fail} failed`);
  console.log(fail ? "SELFTEST FAILED" : "ALL CHECKS PASSED");
  return fail ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || "";
  if (mode === "selftest") process.exitCode = selftest();
  else { console.log("witness_cause: selftest (a pure module; organism_test.mjs and ci_verdict.mjs import it)"); process.exitCode = 2; }
}
