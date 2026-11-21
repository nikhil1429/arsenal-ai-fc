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
// MODES: selftest
// CLI: node scripts/witness_cause.mjs selftest
// ============================================================================
import { pathToFileURL } from "node:url";

/** a clause id, the grammar organism_test.mjs boundIds already assumes */
export const ID = /^[A-Z][A-Z0-9-]*$/;
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
    if (!m || (indent !== null && m[1] !== indent) || out.has(m[2])) continue;
    out.set(m[2], m[3]);
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
  return ids;
}

/** the causes of ONE judged witness red. kind "killed" and "grammar" are the member's own reds; otherwise every token of
 *  <left> (the ids beyond BOUND) is kept only if it is a literal of <src>, and every other token becomes ONE WITHHELD entry.
 *  @param {{ left?: string, src?: string, kind?: "clauses"|"killed"|"grammar", code?: number|null }} a
 *  @returns {{ id: string, text: string }[]} */
export function causesOf({ left = "", src = "", kind = "clauses", code = null }) {
  if (kind === "killed") return [{ id: "KILLED", text: MEMBER.KILLED }];
  if (kind === "grammar") return [{ id: "GRAMMAR", text: `${MEMBER.GRAMMAR} (exit ${Number.isInteger(code) && /** @type {number} */ (code) >= 0 ? code : "none"})` }];
  const ids = idsInSource(src), out = [];
  let withheld = false;
  for (const t of [...new Set(String(left).split(/\s+/).filter(Boolean))]) {
    if (ID.test(t) && ids.has(t)) out.push({ id: t, text: claimOf(src, t) ?? NO_CLAIM });
    else withheld = true;
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
  const m = /^([A-Z][A-Z0-9-]*) · (.*)$/s.exec(s.slice(member.length + 3));
  if (!m || /[\r\n]/.test(m[2])) return withheld;
  const [, id, text] = m;
  const unit = unitOf(member);
  const ok = (id === WITHHELD && text === WITHHELD_TEXT) || (id === "KILLED" && text === MEMBER.KILLED) || (id === "GRAMMAR" && GRAMMAR_TEXT.test(text))
    || (!!unit && (() => { const src = String(readSrc(unit) || ""); return !!src && idsInSource(src).has(id) && text === (claimOf(src, id) ?? NO_CLAIM); })());
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
  console.log(`\nwitness_cause selftest: ${pass} passed, ${fail} failed`);
  console.log(fail ? "SELFTEST FAILED" : "ALL CHECKS PASSED");
  return fail ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || "";
  if (mode === "selftest") process.exitCode = selftest();
  else { console.log("witness_cause: selftest (a pure module; organism_test.mjs and ci_verdict.mjs import it)"); process.exitCode = 2; }
}
