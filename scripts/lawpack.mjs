#!/usr/bin/env node
// @ts-check
// ============================================================================
// lawpack.mjs · ARSENAL AI FC — THE LAW PACK: THE ORGANISM'S OWN LAWS, MECHANISED
//   (THE ORGANISM AUDIT §10-C · rung S3, 20 Aug 2026)
//   SOLE WRITER of: NOTHING. It measures and it judges. It never edits a source file,
//   never edits a baseline, never touches state — a gate that can write is a gate that
//   can be part of the accident (rails.mjs's rule, and gates.mjs's before it).
// ----------------------------------------------------------------------------
// LAW T, TIER 0, THIRD LAYER. S2 bought the two universal nets — a symbol that does not
// exist (tsc) and three named lint classes (eslint). Neither of them knows anything about
// THIS organism. This rung buys the half that is ours: five laws only this repo has,
// expressed as ast-grep YAML rules over the real AST in laws/, plus knip and
// dependency-cruiser for the two questions a pattern matcher cannot ask.
//
// THE SPLIT, AND IT IS LAW T'S RULE VERBATIM. "Where a hand-rolled scan and an industry
// tool disagree, the industry tool wins; the hand-rolled one narrows to what only this
// organism can know." So:
//   · ast-grep finds the SHAPE — on the parsed tree, where a model id inside a comment is
//     not a hit and a `catch {}` is a catch_clause, not a regex over characters.
//   · THIS FILE applies the KNOWLEDGE — who is the declared SOLE WRITER of which state
//     file, which eight lanes are production, what a waiver looks like, which literals are
//     LABELS rather than model ids (imported from models.mjs, never re-listed here).
// Nothing is deleted (L9): xray's Q2/Q5, models.mjs `check` and swallow/mutagen all keep
// running exactly as they did. Their headers now say which half is theirs.
//
// WHY A RATCHET AND NOT A TARGET — S2's argument, worth re-stating because it is the reason
// this gate will still exist in a month. The five laws have hundreds of sites between them.
// Driving them to zero is twelve migrations (§9 Shape 1) and a registry (rung S10) — this
// rung's FORBIDDEN line. A gate nobody can satisfy gets deleted, and a deleted gate guards
// nothing. So the numbers are FROZEN where they were found and the only law is DIRECTION:
//   · every frozen count may only FALL
//   · a rule id that is not in the baseline arrives with NOTHING grandfathered
//   · the gate never edits its own baseline — a self-lowering baseline is a gate that
//     quietly stopped guarding (treasury.mjs's rule: a number this repo has not ruled on
//     is a RULING, never an auto-fix)
// This is §10-D rule 6 made mechanical, for the third time: a gate may only get stricter.
//
// LEADS ARE NOT REDS (§4 binds every new instrument). knip's orphan exports and
// dependency-cruiser's orphan modules are printed and counted, never failed on: in an
// organism whose organs are CLIs, "nobody imports this" is the NORMAL case, and a gate
// that goes red on the normal case teaches people to ignore it. dependency-cruiser's three
// ERROR rules — cycles, unresolvable imports, a devDependency reaching an organ — are real
// defects and they do gate.
//
// VERSIONS, RECORDED HERE BY §10-G (pinned EXACT in package.json, lockfile committed):
//   @ast-grep/cli 0.45.1 · knip 6.32.2 · dependency-cruiser 18.2.0 — all three taken at
//   LATEST, because unlike S2's typescript pin nothing here constrains a peer. Each was
//   checked against the RUNTIME first (Node 22.14): knip declares ^20.19 || >=22.12 and
//   dependency-cruiser ^22 || ^24 || >=26, so both are inside this machine's major.
//
// A BARE CHECKOUT IS NOT A FAILURE — pulse.mjs's shape, kept: no node_modules ⇒ NOT
// MEASURABLE HERE and exit 0. Measurability is an answer; silence is not.
//
// LAWS: writes nothing outside a throwaway temp dir in its own selftest · measures before
//   it judges · every RED names file:line · a fallen count is reported, never pocketed ·
//   A DEAD INSTRUMENT IS RED, NEVER GREEN (L2).
// L2 (6 Oct 2026 · fate 35 · capability C30, honest instruments · gates.txt:16): scan() captured
//   ast-grep's exit code and measure() threw it away, and parseSg returns [] for any non-JSON
//   output — so a broken rule YAML, a config error or a crash scored ZERO findings on every law,
//   judge() returned ok and printed a FALL for each one telling the next session to tighten its
//   baseline to 0. The same shape for dependency-cruiser: unparseable or ABSENT, it scored 0 against
//   a baseline of 7 and asked for the import-cycle gate to be retired. measure() now reads each
//   tool's health (sgHealth · depcruise's own parse + code) and judgeMeasured() turns a DEAD tool
//   into a RED that names it and drops every FALL its zeros would have printed; an ABSENT
//   dependency-cruiser is NOT MEASURED (named), never a fallen count.
// WHO ELSE COULD ACT ON THIS OUTPUT? organism_test.mjs (`lawpack` mode — wired, so the law
//   pack rides npm test) · xray.mjs (its IR resolves the sites this file can only see
//   syntactically) · rung S6's registry spec (every finding here carries a witness).
// CLI: node scripts/lawpack.mjs [report|gate|leads|rules|selftest]
// ============================================================================
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const RULES_DIR = join(ROOT, "laws");
const SGCONFIG = join(ROOT, "sgconfig.yml");
const NM = join(ROOT, "node_modules");

/** The five rule ids that must exist in laws/ — the pack IS the law, so a missing rule is a RED. */
export const RULE_IDS = ["owners-only-state-write", "law-m-literal-model", "jugad-literal-subject-list", "trailing-n-slice", "bare-catch", "receipt-testimony-read", "tum-not-tu-prose", "import-time-registry-read"];

/** THE EIGHT PRODUCTION LANES — §14.2's own list, and it is swallow.mjs's, not a new one.
 *  (That this list is itself a literal is recorded on purpose: it is a §9 Shape-1 instance
 *  living in swallow.mjs's header, and rung S10's registry is where it stops being one.
 *  Writing the laws down is what makes that visible instead of comfortable.) */
export const PRODUCTION_LANES = ["brain", "dugout", "thalamus", "cortex", "nightshift", "dmn", "conductor", "watchman"];

const FS_IO = /\b(readFileSync|writeFileSync|appendFileSync|readdirSync|existsSync|statSync|renameSync|unlinkSync|rmSync|mkdirSync|readFile|writeFile|appendFile|readJson|writeJson|readJsonl|appendJsonl)\b/;
const RECENCY = /(Date\.now|new Date|Date\.parse|\bts\b|_at\b|\bsince\b|ageH|ageMin|days?Ago|olderThan|freshness|stale)/;
const LANE_SIGNATURE = /(propos|critique|ratif|auto-revert|allowlist|mutation|his word|approve|tune)/i;
/** A site declares itself out with a comment marker — the form §9 asked for, made machine-readable. */
export const WAIVER = (rule) => new RegExp("law-waiver:" + rule + "\\b");

// ── THE FROZEN BASELINES — measured 20 Aug 2026; they may only move one way ──
// Every number below was READ before it was frozen, and what each one contains is written
// down, because a frozen number nobody can explain is a number the next session deletes.
//   owners-only 0 — 11 write sites reach the state dir by syntax; NONE is a non-owner. Seven
//     more are `mkdirSync(STATE_DIR)`, which syntax cannot resolve to a file; they are handed
//     to xray's IR (Q2/Q5, both 0 today) rather than guessed at.
//   law-m 1 — watchman.mjs:1067 builds a LIVE command line naming `claude-opus-5`. models.mjs's
//     own `check` is gemini-only and could never see it; this is LAW T's promise paying off on
//     day one. Nine other hits were selftest fixtures and now DECLARE themselves with the word
//     this repo already uses (`models-literal-ok`) rather than being hidden inside a bigger
//     baseline. The Claude-side roster is rung S10's line (§10-G), so the fix is not this rung's.
//   jugad 102 — const-bound arrays of plain names, 74 of them inside a file that has a
//     proposal / critique / ratification lane. §9 SHAPE 1 named twelve by hand; the shape is
//     ten times bigger. Two of the 102 are in THIS file (RULE_IDS, PRODUCTION_LANES) and they
//     are deliberately NOT waived — the law pack is not exempt from the law pack.
//   trailing-n 7 — row windows with no recency compare. 131 raw sites narrowed to 7 by reading
//     the three shapes that are not this disease (see judgeTrailingN). physio.mjs:856 is the
//     weakest of the seven: it sorts by date first, so its window is at least ordered.
//   bare-catch 38 — empty catches guarding fs I/O inside the eight production lanes
//     (dugout 11 · watchman 9 · brain 6 · dmn 5 · cortex 3 · nightshift 2 · thalamus 2 ·
//     conductor 0). The other 229 belong to eslint's frozen no-empty count: 38 + 229 = 267,
//     which IS eslint's number to the unit. Two instruments, one disagreement, zero drift.
//   depcruise 7 — import cycles: brain↔sitting↔state and context_manifest↔learnstate↔brain.
export const BASELINE = {
  "owners-only-state-write": 0,
  "import-time-registry-read": 2,   // forks row 661 (2), 13 Oct 2026: EXTENDED past the literal subjectsOf (ast-grep) to ANY derived reader, any alias and same-file wrappers (importReads), frozen at 2 by name: bootroom.mjs:60 rowOf (a loud refusal by its owner's design) + gate.mjs:158 LANE_CONSUMERS via laneConsumersFromRegistry -> laneRows (row 653's MISS 1); may only fall · forks row 605 (1), 12 Oct 2026: born at 0, its eleven subjectsOf sites moved to lazySubjects in the same act
  "unguarded-dispatch": 4,   // forks row 661 (2) / (4), 13 Oct 2026: a NEW law beside it, frozen at 4 by name: a module-level CLI switch on process.argv runs at IMPORT with the importer's argv: outwork_audit.mjs:421 (run -> gather -> slotPassed) + teaching_contract.mjs:1701 / 1713 / 1903 (doneConcepts -> preCyborg); each moves under the entry-identity main guard by its owner, 4 to 0
  "raw-nul-in-source": 0,   // forks row 616, 12 Oct 2026: a NEW law; the four raw NUL bytes (acts, calibration, dmn, rejirah; forks row 653 A2) became the \u0000 escape in the same act
  "law-m-literal-model": 0,   // S10 §10-G: watchman.mjs:1067's live literal moved into models.mjs CLAUDE_ROLES (the resolver, where a name may live) — same resolved string, no model change
  "jugad-literal-subject-list": 90,    // forks rows 649 (0) / 658 (13 Oct 2026): 97 measured at 0964b97 (7 new since 4aa426d froze 91, 1 gone) − the 7 fixed at their sites = 90, frozen DOWN · S10 ratchet (a2): 102 −1 shadow(#1) −1 tasks KINDS(#5) −2 CORE_AXES twins(#12) −3 calibration(r13) −2 acts(r14) −2 distiller INTERACTIVE+AMBIENT(r15; LEGACY stays frozen AND counted — honesty over score)
  // S11 RATCHET 7 → 0 (29 Aug 2026), and the seven were SPLIT by reading every one:
  //   THREE WERE REAL §9 SHAPE 4 and are now GATED by daykey.withinDays/recentRows —
  //     viz:383 the wall's kal-lines · postmatch:178 the season form strip ·
  //     touchline:320 the weak-foot streak read. Each filters to a calendar WINDOW
  //     first and only then caps, and postmatch now SAYS the record is old rather
  //     than drawing a fortnight-old glyph strip under the words "current run".
  //   FOUR WERE NOT SHAPE 4 and carry a DECLARED law-waiver:trailing-n with its why —
  //     gaffer_state:380 · postmatch:265 · physio:856 are WRITE-SIDE CAPS (they keep
  //     the newest N and discard older, the opposite of treating an old window as new),
  //     and gaffer_state:525 reads standing instructions the code itself declares
  //     non-expiring, where a recency gate would silently drop his own standing word.
  "trailing-n-slice": 0,
  "bare-catch": 37,   // RUNG A (30 Aug 2026): the drain's new gate-journal catch was written with swallow("why", e) from birth, and the ratchet took the point back — tightened on the spot, never left as slack a later edit could spend
  // SHAPE 8, frozen at S10 (29 Aug 2026), every one READ before freezing:
  //   archive_audit:808 (.ok off a lane receipt) · capture:1618/:1640 (.n off saved
  //   rows — both inside selftest blocks) · timeaudit:588 (.ok off its own tmp) ·
  //   outwork_audit:403 (.counts off its own last-run file). May only FALL; a
  //   display-only read declares itself `receipt-ok`.
  "receipt-testimony-read": 5,
  // ROW 68 (e), 6 Sep 2026 — born at ZERO, the day the last five prose sites were moved to "tum" by
  // hand (the judge's card prose · the atlas banner · learnstate's footer · rejirah's close line ·
  // the rematch voice line). His word, 30 Aug 2026: "Bro are again referring me as tera tu." A
  // baseline of 0 is the class fix: the ratchet refuses the first string that brings it back.
  "tum-not-tu-prose": 0,
  depcruise_errors: 7,
};

/** ast-grep ships a per-platform NATIVE binary. Find the real executable, never the .bin shim:
 *  Node 22 refuses to spawn a .cmd without a shell (the 2024 argument-injection fix), and a shell
 *  hop is exactly the kind of invisible layer this repo keeps getting bitten by. */
export function sgBin() {
  const c = [
    join(NM, "@ast-grep", "cli", "ast-grep.exe"),
    join(NM, "@ast-grep", "cli-win32-x64-msvc", "ast-grep.exe"),
    join(NM, "@ast-grep", "cli", "ast-grep"),
    join(NM, ".bin", "ast-grep"),
  ];
  for (const p of c) if (existsSync(p)) return p;
  return null;
}

export const available = () => Boolean(sgBin()) && existsSync(RULES_DIR) && existsSync(SGCONFIG);

const runTool = (file, args, opts = {}) => {
  try { return { out: execFileSync(file, args, { cwd: ROOT, encoding: "utf8", timeout: 600000, windowsHide: true, maxBuffer: 128 * 1024 * 1024, ...opts }), code: 0, signal: null }; }
  catch (e) { const x = /** @type {any} */ (e); return { out: `${(x && x.stdout) || ""}${(x && x.stderr) || ""}`, code: (x && typeof x.status === "number") ? x.status : 1, signal: (x && x.signal) || null }; }
};

// ── MEASURE: ast-grep → raw matches ─────────────────────────────────────────
/** @param {string} json */
export function parseSg(json) {
  const s = String(json || "").trim();
  if (!s || !s.includes("[")) return [];
  let rows;
  try { rows = JSON.parse(s.slice(s.indexOf("["), s.lastIndexOf("]") + 1)); } catch { return []; }
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    rule: r.ruleId || r.rule_id || "(unnamed)",
    file: String(r.file || "").replace(/\\/g, "/"),
    // ast-grep's JSON range is 0-indexed; every line this organ prints is 1-indexed, like every other organ's
    line: ((r.range && r.range.start && r.range.start.line) || 0) + 1,
    text: String(r.text || ""),
  }));
}

export function scan({ bin = sgBin(), paths = ["scripts", "hooks"], cwd = ROOT, config = SGCONFIG } = {}) {
  if (!bin) return { matches: [], raw: "", code: null, signal: null };
  const r = runTool(bin, ["scan", "--config", config, "--json=compact", ...paths], { cwd });
  return { matches: parseSg(r.out), raw: r.out, code: r.code, signal: r.signal };
}

// ── L2 · THE INSTRUMENT'S OWN HEALTH (fate 35, gates.txt:16) ─────────────────────────────────────
// ast-grep's legal codes, measured on @ast-grep/cli 0.45.1 (6 Oct 2026): 0 = scanned (no
// error-severity match) · 1 = scanned, error-severity matches found — both print a JSON array.
// 6 = its config could not be read · 8 = a rule file does not parse — the scan never happened.
// DEAD = a signal · an exit outside {0, 1} · output with no JSON array in it (nothing was measured).
const SG_LIVE = [0, 1];
/** @param {{raw?:string, code?:number|null, signal?:string|null}} sc */
export function sgHealth(sc) {
  const raw = String((sc && sc.raw) || "");
  const tail = raw.trim().slice(-300) || "(no output)";
  const code = sc && typeof sc.code === "number" ? sc.code : null;
  if (sc && sc.signal) return { tool: "ast-grep", live: false, code, why: `killed by ${sc.signal} — raw tail: ${tail}` };
  if (typeof code !== "number" || !SG_LIVE.includes(code)) return { tool: "ast-grep", live: false, code, why: `exited ${code}, outside its legal codes (${SG_LIVE.join("/")}) — raw tail: ${tail}` };
  let isArray = false;
  try { isArray = raw.includes("[") && Array.isArray(JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1))); } catch { /* not a JSON array: named below */ }
  if (!isArray) return { tool: "ast-grep", live: false, code, why: `exited ${code} with no JSON array — it measured nothing — raw tail: ${tail}` };
  return { tool: "ast-grep", live: true, code, why: null };
}

// ── THE ORGANISM'S OWN KNOWLEDGE ────────────────────────────────────────────
/** Every "SOLE WRITER of x.json" header, read exactly the way xray.mjs reads them — one law, one parse. */
export function declaredOwners({ dirs = ["scripts", "hooks"], root = ROOT } = {}) {
  const owners = new Map();
  for (const d of dirs) {
    let files = [];
    try { files = readdirSync(join(root, d)); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith(".mjs")) continue;
      let head = "";
      try { head = readFileSync(join(root, d, f), "utf8").slice(0, 12000); } catch { continue; }
      for (const m of head.matchAll(/(?:SOLE WRITER|sole writer|Single writer|single writer|SINGLE WRITER)[^\n]{0,160}/g))
        for (const fm of m[0].matchAll(/([A-Za-z0-9_\-.]+\.(?:json|jsonl))/g)) {
          if (!owners.has(fm[1])) owners.set(fm[1], new Set());
          owners.get(fm[1]).add(f);
        }
    }
  }
  return owners;
}

const srcCache = new Map();
export function srcOf(file) {
  if (srcCache.has(file)) return srcCache.get(file);
  let s = "";
  try { s = readFileSync(join(ROOT, file), "utf8"); } catch { /* unreadable = judged as empty; it shows up as a miss, never as a pass */ }
  srcCache.set(file, s);
  return s;
}
const linesAround = (src, line, before, after) => String(src).split(/\r?\n/).slice(Math.max(0, line - 1 - before), line + after).join("\n");
const waived = (src, line, rule) => WAIVER(rule).test(linesAround(src, line, 6, 1));

// ── THE FIVE JUDGEMENTS. Each is PURE: (matches, knowledge) → findings ──────
/** owners-only: a state write inside an organ that is not that file's declared SOLE WRITER. */
export function judgeOwners(matches, owners, { read = srcOf } = {}) {
  const findings = [], unresolved = [];
  for (const m of matches.filter((x) => x.rule === "owners-only-state-write")) {
    const organ = basename(m.file);
    const named = [...m.text.matchAll(/([A-Za-z0-9_\-.]+\.(?:json|jsonl))/g)].map((x) => x[1]);
    if (!named.length) { unresolved.push({ ...m, why: "path built from variables — xray's IR resolves this class, syntax cannot" }); continue; }
    for (const n of named) {
      const own = owners.get(n);
      if (!own || own.has(organ)) continue;                        // undeclared file, or the owner itself writing
      if (waived(read(m.file), m.line, "owners-only")) continue;
      findings.push({ ...m, why: `${organ} writes ${n}, declared SOLE WRITER ${[...own].join(", ")}` });
    }
  }
  return { findings, unresolved };
}

/** LAW M: a model id as a STRING, outside the resolver. LABELS + the declaration word come from models.mjs. */
export function judgeLawM(matches, { labels = new Set(), literalOk = "models-literal-ok", read = srcOf } = {}) {
  const findings = [], declared = [];
  for (const m of matches.filter((x) => x.rule === "law-m-literal-model")) {
    if (basename(m.file) === "models.mjs") continue;               // the resolver is the one place a name may live
    const tok = (m.text.match(/[A-Za-z0-9][A-Za-z0-9.\-]*/g) || []).find((t) => /^(gemini|claude|gpt)-/.test(t)) || m.text;
    if (labels.has(tok)) continue;                                 // a LABEL is not a model id — models.mjs owns that list
    if (linesAround(read(m.file), m.line, 0, 0).includes(literalOk)) { declared.push({ ...m, literal: tok }); continue; }
    findings.push({ ...m, literal: tok, why: `literal model id "${tok}" outside models.mjs — LAW M says a ROLE, never a name` });
  }
  return { findings, declared };
}

/** THE JUGAD RULE: a subject set shipped as a literal array of names. */
export function judgeJugad(matches, { read = srcOf } = {}) {
  const findings = [];
  for (const m of matches.filter((x) => x.rule === "jugad-literal-subject-list")) {
    const inner = m.text.slice(m.text.indexOf("[") + 1, m.text.lastIndexOf("]"));
    if (!inner.trim()) continue;
    // ONLY a list of plain names counts. An array holding objects, calls or numbers is a
    // structure, not a subject list, and calling it a jugad would flood the gate into disuse.
    if (/[{}()]/.test(inner)) continue;
    const items = inner.split(",").map((s) => s.trim()).filter(Boolean);
    if (!items.length || !items.every((s) => /^(["'`]).*\1$/.test(s))) continue;
    const src = read(m.file);
    if (waived(src, m.line, "jugad")) continue;
    const name = (m.text.match(/const\s+([A-Za-z0-9_$]+)/) || [])[1] || "?";
    findings.push({ ...m, name, items: items.length, lane: LANE_SIGNATURE.test(src.slice(0, 12000)),
      why: `const ${name} = [${items.length} literal name(s)] — his law: "do not create jugad, do permanent stuff"` });
  }
  return { findings };
}

/** SHAPE 8 (S10): a self-declared count read straight off a parsed receipt — testimony,
 *  not measurement, until the consumer recomputes it. A display-only read declares
 *  itself with `receipt-ok` near the line; everything else is the frozen shape. */
export function judgeReceiptTestimony(matches, { read = srcOf } = {}) {
  const findings = [];
  for (const m of matches.filter((x) => x.rule === "receipt-testimony-read")) {
    const src = read(m.file);
    if (waived(src, m.line, "receipt")) continue;
    findings.push({ ...m, why: "a count-word read directly off parsed JSON — SHAPE 8: a receipt is testimony until recomputed (declare display-only reads with receipt-ok)" });
  }
  return { findings };
}

/** ROW 68 (e): a familiar second-person form inside a STRING the organism composes for him — his register is
 *  "tum" (30 Aug 2026). The YAML rule already skips lexicon entries, regex alternations and his own quoted
 *  phrases by shape (no whitespace before the word inside the string); a selftest fixture that quotes a PAST
 *  turn in the old register declares itself with law-waiver:tum <why>. */
export function judgeTum(matches, { read = srcOf } = {}) {
  const findings = [];
  for (const m of matches.filter((x) => x.rule === "tum-not-tu-prose")) {
    if (waived(read(m.file), m.line, "tum")) continue;
    findings.push({ ...m, why: `a "tu/tera" form in prose the organism says to him — his register is "tum" (30 Aug 2026; row 68 (e))` });
  }
  return { findings };
}

/** SHAPE 4: a trailing-N read with nothing in its neighbourhood that asks how OLD the window is. */
export function judgeTrailingN(matches, { read = srcOf } = {}) {
  const findings = [];
  for (const m of matches.filter((x) => x.rule === "trailing-n-slice")) {
    const src = read(m.file);
    if (waived(src, m.line, "trailing-n")) continue;
    // NARROWED BY READING THE SITES, before this rule was trusted (§4 binds new instruments,
    // and gates.mjs had to do the same with TS2551/2561 one rung earlier). §9 SHAPE 4 is about
    // a WINDOW OF ROWS treated as recent. Three shapes are not that, and all three were read
    // in the source before being cut:
    //   · a STRING operation — acts.mjs:405 takes the text after "HE SAID:"
    //   · a TRUNCATION FOR DISPLAY inside a template literal — audit.mjs:656/663 trim a path
    //     into a `why` message; a message has no age to check
    //   · a process's captured OUTPUT — sandbox.mjs:340 keeps the last 300 chars of stdout
    const recv = m.text.slice(0, m.text.lastIndexOf(".slice"));
    if (/\.(split|join|replace|trim|toString)\(|^String\(/.test(recv)) continue;
    if (/\.(out|stdout|stderr|text|raw|msg|message)$/.test(recv)) continue;
    if (/\$\{[^{}]*\.slice\(-\d/.test(linesAround(src, m.line, 0, 0))) continue;
    if (RECENCY.test(linesAround(src, m.line, 25, 25))) continue;  // the enclosing neighbourhood already asks
    findings.push({ ...m, why: "the last N rows are not the RECENT rows — nothing within 25 lines compares a time" });
  }
  return { findings };
}

/** §14.2: a bare catch in a production lane, guarding fs I/O, that never declares through swallow(). */
export function judgeBareCatch(matches, { lanes = PRODUCTION_LANES, read = srcOf } = {}) {
  const findings = [], elsewhere = [];
  for (const m of matches.filter((x) => x.rule === "bare-catch")) {
    const organ = basename(m.file).replace(/\.mjs$/, "");
    if (!lanes.includes(organ)) { elsewhere.push(m); continue; }   // eslint's frozen no-empty count owns these
    if (!FS_IO.test(linesAround(read(m.file), m.line, 12, 0))) { elsewhere.push(m); continue; }
    findings.push({ ...m, why: `${organ} is a production lane and this catch guards fs I/O — §14.2 says swallow("why", e)` });
  }
  return { findings, elsewhere };
}

// ── THE RATCHET — gates.mjs's judge(), same law, third instrument ────────────
/** @param {Record<string,number>} counts */
/** judgeImportTimeRead — forks row 605 (1), 12 Oct 2026. ast-grep already found the SHAPE (subjectsOf outside
 *  every function body, so it runs when ANY file imports the module); this law carries no waiver, because the
 *  fix is always the same one token: lazySubjects() reads the row at first use and throws the same loud error there.
 *  @param {{rule:string, file:string, line:number}[]} matches */
export function judgeImportTimeRead(matches, ig = null) {
  // forks row 661 (2), 13 Oct 2026: the law now counts the acorn judge's sites too (importReads below: ANY derived reader,
  // any alias, same-file wrappers), and the ast-grep subjectsOf rule stays beside it. One site is counted once: an ast-grep
  // match at a file:line the judge already holds (as a read or as an unguarded dispatch) is that site, never a second one.
  const own = (ig && ig.findings) || [], dispatch = (ig && ig.dispatch) || [];
  const held = new Set([...own, ...dispatch].map((x) => `${x.file}:${x.line}`));
  const sg = matches.filter((x) => x.rule === "import-time-registry-read" && !held.has(`${x.file}:${x.line}`))
    .map((x) => ({ file: x.file, line: x.line, via: "subjectsOf", reader: "subjectsOf", why: "subjectsOf runs at IMPORT — every importer dies on this row; use lazySubjects()" }));
  return { findings: [...own, ...sg], dispatch };
}

// ── IMPORT-TIME READS THROUGH ANY DOOR (forks rows 653 / 660 / 661, 13 Oct 2026) ─────────────
// The ast-grep rule sees one literal name, subjectsOf. A read through rowOf, laneRows or any other registry reader, under an
// alias (`rowOf as r`), or through a same-file wrapper (`const X = w()` where w calls laneRows) runs at import just the same:
// gate.mjs:158's LANE_CONSUMERS threw on every importer that way (row 653's MISS 1) and no rule saw it. The census
// (artifacts cloud/s660/wrapper_census.mjs) measured the class at his HEAD 1ea62c3: six sites. This judge is LAW T's
// hand-rolled half: the parse is acorn's (a real AST; acorn and acorn-walk are both in package.json), the knowledge is ours —
//   · READERS are DERIVED from registry.mjs at judge time, never listed (registryReaders);
//   · THE MAIN GUARD is the entry-identity check, ruled as written (row 661 (1)): an `if` whose test reads import.meta or
//     process.argv[1], inline or through a top-level const that holds it (forge_session's INVOKED_DIRECTLY). Code behind it
//     runs only when the file is the entry, so its reads are not import-time;
//   · A DISPATCH on process.argv (inline, or through a top-level const bound from it: `const cmd = process.argv[2]`) is NOT a
//     guard: it runs at import with the IMPORTER's argv. Its reads are their own law, unguarded-dispatch (row 661 (2)), because
//     the fix is different: the switch moves under the entry-identity guard (row 661 (4)).
// A DEAD INSTRUMENT IS RED (L2): no acorn, an unreadable registry.mjs, or a file naming registry.mjs that acorn cannot parse is
// named by judgeMeasured, never scored as a clean zero.

/** acornKit — acorn + acorn-walk, loaded at first use, so a bare checkout still imports this file (no node_modules: NOT MEASURABLE).
 *  @returns {{acorn:any, walk:any, why:string|null}} */
export function acornKit() {
  try {
    const req = createRequire(import.meta.url);
    return { acorn: req("acorn"), walk: req("acorn-walk"), why: null };
  } catch (e) { return { acorn: null, walk: null, why: `acorn could not load (${String(e).slice(0, 120)})` }; }
}
const parseModule = (/** @type {any} */ acorn, /** @type {string} */ src) => acorn.parse(src, { ecmaVersion: "latest", sourceType: "module", locations: true, allowHashBang: true, allowAwaitOutsideFunction: true });
const GUARD_TEXT = /import\.meta|process\.argv\[1\]/;
const ARGV_TEXT = /process\.argv/;
/** A body runs at its call, never at import: the module-level walk and the reader derivation never descend into one. */
const SKIP_FN = {
  FunctionDeclaration() { /* not descended */ },
  FunctionExpression() { /* not descended */ },
  ArrowFunctionExpression() { /* not descended */ },
  MethodDefinition() { /* not descended */ },
  ClassBody() { /* not descended */ },
};

/** registryReaders — the reader set, DERIVED from registry.mjs at judge time (row 661 (3)): every exported function whose
 *  parameter defaults read REGISTRY_PATH AND whose own body, outside its nested functions, makes a call. A lazy view that only
 *  builds a closure (lazySubjects) reads nothing at the call, so it is not a reader: by its shape, never by its name.
 *  @param {{root?:string, kit?:{acorn:any, walk:any, why:string|null}}} [o] @returns {Set<string>} */
export function registryReaders({ root = ROOT, kit = acornKit() } = {}) {
  const src = readFileSync(join(root, "scripts", "registry.mjs"), "utf8");
  const out = new Set();
  for (const n of parseModule(kit.acorn, src).body) {
    const d = n.type === "ExportNamedDeclaration" ? n.declaration : null;
    if (!d || d.type !== "FunctionDeclaration" || !d.id) continue;
    if (!/REGISTRY_PATH/.test(src.slice(d.params.length ? d.params[0].start : d.start, d.body.start))) continue;
    let calls = 0;
    kit.walk.recursive(d.body, null, { ...SKIP_FN, CallExpression(/** @type {any} */ c, /** @type {any} */ st, /** @type {any} */ go) { calls++; go(c.callee, st); for (const a of c.arguments) go(a, st); } });
    if (calls) out.add(d.id.name);
  }
  return out;
}

/** importReads — every MODULE-LEVEL call (outside every function body, outside the entry-identity main guard) that reaches a
 *  registry reader: directly by any reader name or alias, through a namespace import, or through a same-file local function
 *  that calls one (transitively). A call inside a top-level dispatch on process.argv goes to `dispatch`, never to `findings`.
 *  @param {{root?:string, dirs?:string[], readers?:Set<string>|null, kit?:{acorn:any, walk:any, why:string|null}}} [o] */
export function importReads({ root = ROOT, dirs = ["scripts", "hooks"], readers = null, kit = acornKit() } = {}) {
  const dead = (/** @type {string} */ why) => ({ live: false, why, readers: [], files: 0, parseErrors: [], findings: [], dispatch: [] });
  if (!kit.acorn) return dead(kit.why || "acorn absent");
  let R = readers;
  if (!R) {
    try { R = registryReaders({ root, kit }); }
    catch (e) { return dead(`registry.mjs could not be read for its readers (${String(e).slice(0, 120)})`); }
  }
  /** @type {string[]} */
  const list = [];
  const walkDir = (/** @type {string} */ d) => {
    for (const e of readdirSync(join(root, d), { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) { if (e.name !== "legacy" && e.name !== "node_modules") walkDir(p); }
      else if (e.name.endsWith(".mjs")) list.push(p);
    }
  };
  for (const d of dirs) if (existsSync(join(root, d))) walkDir(d);
  const findings = [], dispatch = [], parseErrors = [];
  let files = 0;
  for (const rel of list) {
    if (rel === "scripts/registry.mjs") continue;
    const src = readFileSync(join(root, rel), "utf8");
    if (!/registry\.mjs/.test(src)) continue;   // a static import names the file: no name, no import to judge
    let ast;
    try { ast = parseModule(kit.acorn, src); }
    catch (e) { parseErrors.push(`${rel} · ${String((e && e.message) || e).slice(0, 120)}`); continue; }
    files++;
    const local = new Map(), ns = new Set();   // local name -> the reader it imports · namespace imports of registry.mjs
    for (const n of ast.body) if (n.type === "ImportDeclaration" && /(^|\/)registry\.mjs$/.test(n.source.value)) for (const s of n.specifiers) {
      if (s.type === "ImportSpecifier" && R.has(s.imported.name)) local.set(s.local.name, s.imported.name);
      if (s.type === "ImportNamespaceSpecifier") ns.add(s.local.name);
    }
    if (!local.size && !ns.size) continue;
    const guards = new Set(), argv = new Set();   // top-level consts holding the entry identity · top-level consts bound from process.argv
    for (const n of ast.body) if (n.type === "VariableDeclaration") for (const v of n.declarations) if (v.id.type === "Identifier" && v.init) {
      const t = src.slice(v.init.start, v.init.end);
      if (GUARD_TEXT.test(t)) guards.add(v.id.name); else if (ARGV_TEXT.test(t)) argv.add(v.id.name);
    }
    const isGuard = (/** @type {any} */ s) => s.type === "IfStatement" && (GUARD_TEXT.test(src.slice(s.test.start, s.test.end)) || (s.test.type === "Identifier" && guards.has(s.test.name)));
    const isDispatch = (/** @type {any} */ s) => {
      const t = s.type === "IfStatement" ? s.test : s.type === "SwitchStatement" ? s.discriminant : null;
      if (!t) return false;
      if (ARGV_TEXT.test(src.slice(t.start, t.end))) return true;
      let hit = false;
      kit.walk.simple(t, { Identifier(/** @type {any} */ i) { if (argv.has(i.name)) hit = true; } });
      return hit;
    };
    const readerOf = (/** @type {any} */ c) => c.type === "Identifier" && local.has(c.name) ? local.get(c.name)
      : (c.type === "MemberExpression" && c.object.type === "Identifier" && ns.has(c.object.name) && c.property.type === "Identifier" && R.has(c.property.name) ? c.property.name : null);
    const fns = new Map();   // same-file local functions: declarations, and top-level const f = () => … / function () {}
    for (const n of ast.body) {
      const d = n.type === "ExportNamedDeclaration" && n.declaration ? n.declaration : n;
      if (d.type === "FunctionDeclaration" && d.id) fns.set(d.id.name, d);
      if (d.type === "VariableDeclaration") for (const v of d.declarations) if (v.id.type === "Identifier" && v.init && (v.init.type === "ArrowFunctionExpression" || v.init.type === "FunctionExpression")) fns.set(v.id.name, v.init);
    }
    const calls = new Map();   // function name -> { r: the readers it calls, l: the local functions it calls }
    for (const [name, f] of fns) {
      const r = new Set(), l = new Set();
      kit.walk.full(f.body, (/** @type {any} */ n) => { if (n.type === "CallExpression") { const x = readerOf(n.callee); if (x) r.add(x); else if (n.callee.type === "Identifier" && fns.has(n.callee.name)) l.add(n.callee.name); } });
      calls.set(name, { r, l });
    }
    /** @type {(name: string, seen?: Set<string>) => string[]|null} */
    const reaches = (name, seen = new Set()) => {
      if (seen.has(name)) return null;
      seen.add(name);
      const c = calls.get(name);
      if (!c) return null;
      if (c.r.size) return [name, [...c.r][0]];
      for (const l of c.l) { const p = reaches(l, seen); if (p) return [name, ...p]; }
      return null;
    };
    for (const stmt of ast.body) {
      if (isGuard(stmt)) continue;
      const d = stmt.type === "ExportNamedDeclaration" && stmt.declaration ? stmt.declaration : stmt;
      if (d.type === "FunctionDeclaration" || d.type === "ImportDeclaration") continue;
      const into = isDispatch(stmt) ? dispatch : findings;
      kit.walk.recursive(d, null, { ...SKIP_FN, CallExpression(/** @type {any} */ n, /** @type {any} */ st, /** @type {any} */ go) {
        const x = readerOf(n.callee);
        const p = x ? null : (n.callee.type === "Identifier" && fns.has(n.callee.name) ? reaches(n.callee.name) : null);
        if (x || p) {
          const via = x ? src.slice(n.callee.start, n.callee.end) : p.join(" -> ");
          into.push({ file: rel, line: n.loc.start.line, via, reader: x || p[p.length - 1],
            why: into === dispatch ? `a module-level CLI dispatch on process.argv runs at IMPORT with the importer's argv and reaches ${via}; move it under the entry-identity main guard`
              : `a registry read at IMPORT through ${via} — every importer runs it; read it inside the function that needs it, or lazySubjects()` });
        }
        go(n.callee, st);
        for (const a of n.arguments) go(a, st);
      } });
    }
  }
  return { live: true, why: null, readers: [...R].sort(), files, parseErrors, findings, dispatch };
}

// ── RAW NUL BYTES IN SOURCE (forks row 616, 12 Oct 2026) ─────────────────────
// acts.mjs, calibration.mjs, dmn.mjs and rejirah.mjs each carried ONE raw NUL byte inside a template literal,
// as a key separator (the 12 Oct census named the first two; this law found the other two, forks row 653 A2).
// Byte 0 makes ripgrep, grep and every tool built on them call the whole file BINARY and skip it: the 12 Oct
// census of import-time registry reads missed both files that way, though ast-grep (a parser) still saw them.
// So no tracked text file carries byte 0; a separator is written as its escape and the runtime string is the
// same. A byte scan, not an ast-grep rule: this defect lives below the parsed tree. A git that cannot list the
// tree is a DEAD instrument (judgeMeasured), never a clean zero.
export const NUL_EXTS = /\.(mjs|cjs|js|ts|json|jsonl|md|yml|yaml|ps1|sh|txt|html|css)$/i;
/** @param {{root?:string, files?:string[]|null}} [o] */
export function rawNulFiles({ root = ROOT, files = null } = {}) {
  let list = files;
  if (!list) {
    try { list = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split(String.fromCharCode(0)).filter(Boolean); }
    catch (e) { return { live: false, why: `git ls-files failed (${String(e).slice(0, 120)})`, findings: [] }; }
  }
  const findings = [];
  for (const f of list.filter((x) => NUL_EXTS.test(x))) {
    let b;
    try { b = readFileSync(join(root, f)); } catch { continue; }   // tracked but deleted in the work tree: nothing to read
    const i = b.indexOf(0);
    if (i >= 0) findings.push({ file: f, line: b.subarray(0, i).toString("utf8").split("\n").length, why: "a raw NUL byte — write it as the \\u0000 escape" });
  }
  return { live: true, why: null, findings };
}

export function judge(counts, base = BASELINE) {
  const reds = [], falls = [];
  for (const [k, b] of Object.entries(base)) {
    const now = counts[k] ?? 0;
    if (now > b) reds.push(`${k} ROSE — ${now}, baseline ${b}. A gate may only get stricter (§10-D rule 6).`);
    else if (now < b) falls.push(`${k} FELL — ${now} (baseline ${b}); tighten BASELINE["${k}"] to ${now}.`);
  }
  for (const [k, n] of Object.entries(counts)) {
    if (k in base || !n) continue;
    reds.push(`NEW LAW ${k} ×${n} is not in the frozen baseline — a new rule's findings are never grandfathered.`);
  }
  return { ok: reds.length === 0, reds, falls };
}

// ── knip + dependency-cruiser ───────────────────────────────────────────────
// Both of these are plain JS entry points, so they ride process.execPath exactly the way
// gates.mjs rides tsc and eslint — one runtime, no shell, no PATH, no .cmd shim.
const jsEntry = (...p) => { const f = join(NM, ...p); return existsSync(f) ? f : null; };

export function depcruise() {
  const bin = jsEntry("dependency-cruiser", "bin", "dependency-cruise.mjs");
  if (!bin) return { available: false, errors: [], leads: [], raw: "" };
  const r = runTool(process.execPath, [bin, "--config", ".dependency-cruiser.cjs", "--output-type", "json", "scripts", "hooks"]);
  let v = [], parsed = false;
  try { v = ((JSON.parse(r.out.slice(r.out.indexOf("{"), r.out.lastIndexOf("}") + 1)).summary) || {}).violations || []; parsed = Array.isArray(v); }
  catch { /* unparseable: L2 — judgeMeasured names it DEAD with this tail, never a silent zero */ }
  return {
    available: true,
    errors: v.filter((x) => x.rule && x.rule.severity === "error"),
    leads: v.filter((x) => x.rule && x.rule.severity !== "error"),
    // L2: was `Array.isArray(v)` — true even when the parse FAILED (v stays []), so this field could
    // never say no. It now says whether dependency-cruiser's answer actually parsed.
    parsed: parsed && !r.signal,
    code: r.code,
    raw: r.out.slice(0, 300),
  };
}

export function knipLeads() {
  const bin = jsEntry("knip", "bin", "knip.js");
  if (!bin) return { available: false, leads: [] };
  const r = runTool(process.execPath, [bin, "--reporter", "json", "--no-exit-code"]);
  let j = null;
  try { j = JSON.parse(r.out.slice(r.out.indexOf("{"), r.out.lastIndexOf("}") + 1)); }
  catch { /* knip prints nothing parseable when it is clean */ }
  const leads = [];
  for (const f of (j && j.files) || []) leads.push({ kind: "unused file", file: String(f) });
  for (const [file, issues] of Object.entries((j && j.issues) || {}))
    for (const kind of ["exports", "types", "duplicates", "unlisted"])
      for (const e of (issues && issues[kind]) || []) leads.push({ kind: `orphan ${kind.replace(/s$/, "")}`, file, name: (e && e.name) || String(e), line: (e && e.line) || 0 });
  return { available: true, leads };
}

// ── MEASURE-ALL ─────────────────────────────────────────────────────────────
export async function measure({ withDepcruise = true, scanFn = scan, depcruiseFn = depcruise, rawNulFn = rawNulFiles, importFn = importReads } = {}) {
  // L2 (fate 35): the scan's EXIT CODE is read beside its output — sgHealth — never thrown away.
  const sc = scanFn();
  const { matches, raw } = sc;
  const sg = sgHealth(sc);
  const owners = declaredOwners();
  let labels = new Set(), literalOk = "models-literal-ok";
  try {
    const M = await import(pathToFileURL(join(HERE, "models.mjs")).href);
    labels = M.LABELS || labels;
    literalOk = M.LITERAL_OK || literalOk;
  } catch { /* models.mjs unreadable → LAW M judged without its allowlist, which can only OVER-report */ }
  const o = judgeOwners(matches, owners);
  const m = judgeLawM(matches, { labels, literalOk });
  const j = judgeJugad(matches);
  const t = judgeTrailingN(matches);
  const c = judgeBareCatch(matches);
  const rt = judgeReceiptTestimony(matches);
  const tm = judgeTum(matches);
  const ig = importFn();   // forks row 661: the acorn judge over scripts/ and hooks/ (any reader, alias or wrapper; dispatches apart)
  const ir = judgeImportTimeRead(matches, ig);
  const nul = rawNulFn();
  const dc = withDepcruise ? depcruiseFn() : { available: false, errors: [], leads: [] };
  const counts = {
    "owners-only-state-write": o.findings.length,
    "law-m-literal-model": m.findings.length,
    "jugad-literal-subject-list": j.findings.length,
    "trailing-n-slice": t.findings.length,
    "bare-catch": c.findings.length,
    "receipt-testimony-read": rt.findings.length,
    "tum-not-tu-prose": tm.findings.length,
    "import-time-registry-read": ir.findings.length,
    "unguarded-dispatch": ir.dispatch.length,
    "raw-nul-in-source": nul.findings.length,
    depcruise_errors: dc.available ? dc.errors.length : 0,
  };
  return { matches, counts, o, m, j, t, c, rt, tm, ir, ig, nul, dc, raw, sg, rulesPresent: RULE_IDS.filter((id) => existsSync(join(RULES_DIR, `${id}.yml`))) };
}

/** judgeMeasured — L2 (fate 35): the ratchet over a REAL measurement. A dead ast-grep is a RED that names
 *  it, and none of the seven laws it feeds may print a FALL; a dead dependency-cruiser is a RED too; an
 *  ABSENT one is NOT MEASURED — named in `notes`, never a fallen count. Everything else is judge()'s.
 *  @param {{counts:Record<string,number>, sg?:{tool:string, live:boolean, code:number|null, why:string|null}, dc?:{available?:boolean, parsed?:boolean, code?:number|null, raw?:string}, nul?:{live:boolean, why:string|null}, ig?:{live:boolean, why:string|null, parseErrors:string[]}}} m */
export function judgeMeasured(m, base = BASELINE) {
  const j = judge(m.counts, base);
  const reds = [...j.reds], notes = [];
  let falls = [...j.falls];
  const sgKeys = Object.keys(base).filter((k) => k !== "depcruise_errors");
  if (m.sg && !m.sg.live) {
    reds.unshift(`INSTRUMENT DEAD — ast-grep: ${m.sg.why}. None of the ${sgKeys.length} laws it feeds is judged; a dead scan's zero is not a fall.`);
    falls = falls.filter((f) => !sgKeys.some((k) => f.startsWith(`${k} FELL`)));
  }
  if (m.nul && !m.nul.live) {
    reds.push(`INSTRUMENT DEAD — the raw-NUL byte scan: ${m.nul.why}. raw-nul-in-source is not judged; an unread tree is not a clean one.`);
    falls = falls.filter((f) => !f.startsWith("raw-nul-in-source FELL"));
  }
  const dc = m.dc || {};
  if (m.ig && (!m.ig.live || (m.ig.parseErrors || []).length)) {
    // forks row 661: the import-graph judge feeds two laws; dead (no acorn, no registry.mjs) or blind (a file naming registry.mjs
    // that acorn cannot parse), it is RED by name, and neither law may print a FALL its missing sites would have made.
    reds.push(!m.ig.live
      ? `INSTRUMENT DEAD — the import-graph judge: ${m.ig.why}. import-time-registry-read and unguarded-dispatch are not judged; an unparsed tree is not a clean one.`
      : `INSTRUMENT BLIND — acorn could not parse ${m.ig.parseErrors.length} file(s) that name registry.mjs (${m.ig.parseErrors.slice(0, 3).join(" | ")}); their import-time reads are unseen, never zero.`);
    falls = falls.filter((f) => !f.startsWith("import-time-registry-read FELL") && !f.startsWith("unguarded-dispatch FELL"));
  }
  if (dc.available && !dc.parsed) {
    reds.push(`INSTRUMENT DEAD — dependency-cruiser: exited ${dc.code} and its answer did not parse — raw: ${String(dc.raw || "").trim().slice(0, 200) || "(no output)"}. depcruise_errors is not judged.`);
    falls = falls.filter((f) => !f.startsWith("depcruise_errors FELL"));
  } else if (!dc.available) {
    notes.push("depcruise_errors NOT MEASURED — dependency-cruiser is absent here; a missing tool is never a fallen count");
    falls = falls.filter((f) => !f.startsWith("depcruise_errors FELL"));
  }
  return { ok: reds.length === 0, reds, falls, notes };
}

// ── THE PLANT — the rung's DONE-PROOF, and it runs on EVERY selftest ────────
// "DONE-PROOF: every rule proven to BITE on a planted violation, then green." A proof that
// only happened once, on the day it was built, is a story. This one is a TEST: a throwaway
// project is built in the OS temp dir, carrying a copy of the real laws/ and sgconfig.yml
// (never a second copy of the rules — the file under test IS the shipped file), one planted
// violation per rule is written into it, ast-grep is run there, and every rule must bite.
// The repo is never touched, and the temp dir is removed whether the test passes or fails.
export const PLANTS = {
  "owners-only-state-write": 'import { writeFileSync } from "node:fs";\nexport const p = () => writeFileSync("dressing-room/state/brain_config.json", "{}");\n',
  "law-m-literal-model": 'export const M = "gemini-2.5-flash";\n',   // models-literal-ok — THE PLANT: the violation this rule must bite on
  "jugad-literal-subject-list": 'const TYPES = ["alpha", "beta", "gamma"];\nexport default TYPES;\n',
  "trailing-n-slice": "export const tail = (rows) => rows.slice(-50);\n",
  "bare-catch": "export const p = (f) => { try { f(); } catch {} };\n",
  "import-time-registry-read": 'import { subjectsOf } from "./registry.mjs";\nexport const KINDS = subjectsOf("plant_kinds");\nexport const later = () => subjectsOf("plant_kinds");\n',   // line 2 must bite; line 3 (inside a function) must not
  "receipt-testimony-read": 'import { readFileSync } from "node:fs";\nexport const gate = () => JSON.parse(readFileSync("receipt.json", "utf8")).count;\n',
  "tum-not-tu-prose": "export const say = (x) => `Ye faisla tera hai, machine ka nahi — ${x}`;\n",   // law-waiver:tum — THE PLANT: the violation this rule must bite on (row 68 (e))
};

/** THE IMPORT-GRAPH PLANTS (forks row 661 (3)) — the census's five fixture modules, verbatim (artifacts cloud/s660/wrapper_census.mjs).
 *  Every selftest writes them into a throwaway tree and judges them with importReads, against the readers derived from the REAL
 *  registry.mjs: a wrapper read bites, an alias read bites, a dispatch read is a dispatch, and the guarded and lazy reads do not. */
export const IMPORT_PLANTS = {
  "a_wrapper.mjs": 'import { laneRows } from "./registry.mjs";\nfunction w() { return laneRows(); }\nexport const X = w();\n',
  "b_guarded.mjs": 'import { laneRows } from "./registry.mjs";\nfunction main() { return laneRows(); }\nif (process.argv[1] && import.meta.url.endsWith(process.argv[1])) main();\n',
  "c_dispatch.mjs": 'import { preCyborg } from "./registry.mjs";\nfunction run() { return preCyborg({}); }\nconst cmd = process.argv[2];\nif (cmd === "run") run();\n',
  "d_lazy.mjs": 'import { lazySubjects } from "./registry.mjs";\nexport const D = lazySubjects("act_doors");\nexport function f() { return D.length; }\n',
  "e_alias.mjs": 'import { rowOf as r } from "./registry.mjs";\nexport const M = r("mechanisms", "x");\n',
};

export function plantAndScan({ bin = sgBin() } = {}) {
  if (!bin) return null;
  const dir = mkdtempSync(join(tmpdir(), "arsenal-lawpack-"));
  try {
    mkdirSync(join(dir, "laws"), { recursive: true });
    mkdirSync(join(dir, "scripts"), { recursive: true });
    for (const f of readdirSync(RULES_DIR)) if (f.endsWith(".yml")) copyFileSync(join(RULES_DIR, f), join(dir, "laws", f));
    copyFileSync(SGCONFIG, join(dir, "sgconfig.yml"));
    for (const [id, code] of Object.entries(PLANTS)) writeFileSync(join(dir, "scripts", `plant_${id.replace(/-/g, "_")}.mjs`), code);
    const { matches } = scan({ bin, paths: ["scripts"], cwd: dir, config: join(dir, "sgconfig.yml") });
    return matches;
  } finally { try { rmSync(dir, { recursive: true, force: true }); } catch { /* a temp dir the OS will reap anyway */ } }
}

// ── SELFTEST ────────────────────────────────────────────────────────────────
async function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c, d) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${n}${c || !d ? "" : `\n      ${d}`}`); };

  // 1 · THE PACK IS THE LAW — a missing rule file is a missing law
  for (const id of RULE_IDS) assert(`RULE FILE — laws/${id}.yml is on disk`, existsSync(join(RULES_DIR, `${id}.yml`)));
  assert("CONFIG — sgconfig.yml points ast-grep at laws/", existsSync(SGCONFIG) && /ruleDirs/.test(readFileSync(SGCONFIG, "utf8")));

  // 2 · THE RATCHET, driven on synthetic numbers — hermetic, no tool spawned
  const base = Object.fromEntries(Object.entries(BASELINE));
  assert("BASELINE — the measured day-one state is GREEN (a gate red on arrival is never adopted)", judge({ ...base }).ok);
  for (const k of Object.keys(BASELINE)) {
    const rose = { ...base }; rose[k] = base[k] + 1;
    assert(`RATCHET — one more ${k} than the baseline is RED`, !judge(rose).ok);
  }
  const fell = { ...base, "trailing-n-slice": Math.max(0, base["trailing-n-slice"] - 1) };
  const jf = judge(fell);
  assert("RATCHET — fewer is GREEN, and the gate SAYS to tighten the constant (a fall is never pocketed)",
    jf.ok && (base["trailing-n-slice"] === 0 || jf.falls.some((f) => f.includes("trailing-n-slice FELL"))), JSON.stringify(jf.falls));
  assert("NEW LAW — a rule id that is not in the frozen baseline cannot arrive with findings forgiven",
    !judge({ ...base, "some-new-law": 2 }).ok && judge({ ...base, "some-new-law": 2 }).reds.some((r) => /NEW LAW some-new-law/.test(r)));

  // 3 · THE JUDGEMENTS, on synthetic matches — every law proven in both directions
  const owners = new Map([["brain_config.json", new Set(["brain.mjs"])]]);
  const read = () => "";
  const oBad = judgeOwners([{ rule: "owners-only-state-write", file: "scripts/viz.mjs", line: 9, text: 'writeFileSync(join(STATE_DIR, "brain_config.json"), s)' }], owners, { read });
  assert("OWNERS — a non-owner writing a declared file is a finding, and it names both organs",
    oBad.findings.length === 1 && /viz\.mjs writes brain_config\.json/.test(oBad.findings[0].why), JSON.stringify(oBad.findings));
  const oOk = judgeOwners([{ rule: "owners-only-state-write", file: "scripts/brain.mjs", line: 9, text: 'writeFileSync(join(STATE_DIR, "brain_config.json"), s)' }], owners, { read });
  assert("OWNERS — the declared SOLE WRITER writing its own file is NOT a finding", oOk.findings.length === 0);
  const oVar = judgeOwners([{ rule: "owners-only-state-write", file: "scripts/x.mjs", line: 1, text: "writeFileSync(p, s)" }], owners, { read });
  assert("OWNERS — a path built from variables is UNRESOLVED and handed to xray, never guessed",
    oVar.findings.length === 0 && oVar.unresolved.length === 1);
  const oWaived = judgeOwners([{ rule: "owners-only-state-write", file: "scripts/viz.mjs", line: 2, text: 'writeFileSync("dressing-room/state/brain_config.json", s)' }], owners,
    { read: () => "// law-waiver:owners-only the migration lane, declared\nwriteFileSync(...)\n" });
  assert("OWNERS — a DECLARED waiver above the site clears it (the form §9 asked for)", oWaived.findings.length === 0);

  const mBad = judgeLawM([{ rule: "law-m-literal-model", file: "scripts/brain.mjs", line: 3, text: '"gemini-2.5-flash"' }], { labels: new Set(), read });   // models-literal-ok — selftest fixture
  assert("LAW M — a literal model id outside models.mjs is a finding, and the finding names the literal",
    mBad.findings.length === 1 && mBad.findings[0].literal === "gemini-2.5-flash", JSON.stringify(mBad.findings));   // models-literal-ok — selftest fixture
  assert("LAW M — the resolver itself may name models (it is the one place a name may live)",
    judgeLawM([{ rule: "law-m-literal-model", file: "scripts/models.mjs", line: 3, text: '"gemini-2.5-flash"' }], { read }).findings.length === 0);   // models-literal-ok — selftest fixture
  assert("LAW M — a LABEL is not a model id, and the list comes from models.mjs, never from here",
    judgeLawM([{ rule: "law-m-literal-model", file: "scripts/x.mjs", line: 3, text: '"gemini-flash"' }], { labels: new Set(["gemini-flash"]), read }).findings.length === 0);
  const mDecl = judgeLawM([{ rule: "law-m-literal-model", file: "scripts/x.mjs", line: 1, text: '"gemini-2.0-pro"' }], { read: () => '"gemini-2.0-pro"  // models-literal-ok fixture\n' });
  assert("LAW M — a fixture line that DECLARES itself is recorded, not failed", mDecl.findings.length === 0 && mDecl.declared.length === 1);

  const jBad = judgeJugad([{ rule: "jugad-literal-subject-list", file: "scripts/shadow.mjs", line: 47, text: 'const TYPES = ["a", "b", "c"]' }], { read: () => "// proposal lane\n" });
  assert("JUGAD — a const bound to a list of plain names is a finding, and it is marked as sitting in a ratification lane",
    jBad.findings.length === 1 && jBad.findings[0].items === 3 && jBad.findings[0].lane === true, JSON.stringify(jBad.findings));
  assert("JUGAD — an array of OBJECTS is a structure, not a subject list (a flooded gate gets deleted)",
    judgeJugad([{ rule: "jugad-literal-subject-list", file: "scripts/x.mjs", line: 1, text: 'const X = [{ a: 1 }, { a: 2 }]' }], { read }).findings.length === 0);
  assert("JUGAD — an array of numbers is not a subject list either",
    judgeJugad([{ rule: "jugad-literal-subject-list", file: "scripts/x.mjs", line: 1, text: "const X = [1, 2, 3]" }], { read }).findings.length === 0);
  assert("JUGAD — a DECLARED waiver clears the site",
    judgeJugad([{ rule: "jugad-literal-subject-list", file: "scripts/x.mjs", line: 2, text: 'const X = ["a"]' }], { read: () => "// law-waiver:jugad the wire protocol's own names\nconst X = [\"a\"]\n" }).findings.length === 0);

  const tBad = judgeTrailingN([{ rule: "trailing-n-slice", file: "scripts/x.mjs", line: 1, text: "rows.slice(-50)" }], { read: () => "const m = rows.slice(-50);\n" });
  assert("TRAILING-N — a trailing window with no time compare anywhere near it is a finding", tBad.findings.length === 1);
  assert("TRAILING-N — a window whose neighbourhood DOES compare a time is already gated",
    judgeTrailingN([{ rule: "trailing-n-slice", file: "scripts/x.mjs", line: 2, text: "rows.slice(-50)" }],
      { read: () => "const cut = Date.now() - 864e5;\nconst m = rows.slice(-50).filter((r) => r.t > cut);\n" }).findings.length === 0);
  assert("TRAILING-N — a split() is a string operation, not a row window, and has no age to check",
    judgeTrailingN([{ rule: "trailing-n-slice", file: "scripts/x.mjs", line: 1, text: 'String(p).split("HE SAID:").slice(-2)' }], { read: () => "x" }).findings.length === 0);
  assert("TRAILING-N — a DECLARED waiver clears the site (daemon_watchdog's deliberate window)",
    judgeTrailingN([{ rule: "trailing-n-slice", file: "scripts/x.mjs", line: 2, text: "h.slice(-20)" }],
      { read: () => "// law-waiver:trailing-n a bounded history window, oldest-first, by design\nh.slice(-20)\n" }).findings.length === 0);

  const cBad = judgeBareCatch([{ rule: "bare-catch", file: "scripts/brain.mjs", line: 2, text: "catch {}" }], { read: () => "try { readFileSync(p) }\ncatch {}\n" });
  assert("BARE CATCH — a production lane swallowing fs I/O with no reason is a finding", cBad.findings.length === 1);
  assert("BARE CATCH — the same shape OUTSIDE the eight production lanes belongs to eslint's frozen no-empty count",
    judgeBareCatch([{ rule: "bare-catch", file: "scripts/viz.mjs", line: 2, text: "catch {}" }], { read: () => "try { readFileSync(p) }\ncatch {}\n" }).findings.length === 0);
  assert("BARE CATCH — a bare catch that guards no fs I/O is not this law's finding",
    judgeBareCatch([{ rule: "bare-catch", file: "scripts/brain.mjs", line: 2, text: "catch {}" }], { read: () => "try { JSON.parse(s) }\ncatch {}\n" }).findings.length === 0);

  // 4 · THE PARSER, on ast-grep's real output shape (0-indexed lines in, 1-indexed out)
  const p = parseSg(JSON.stringify([{ ruleId: "bare-catch", file: "scripts\\brain.mjs", range: { start: { line: 41, column: 2 } }, text: "catch {}" }]));
  assert("PARSE — ast-grep's 0-indexed line becomes the 1-indexed line every other organ prints",
    p.length === 1 && p[0].line === 42 && p[0].file === "scripts/brain.mjs", JSON.stringify(p));
  assert("PARSE — no output is no matches, never a crash", parseSg("").length === 0 && parseSg("nonsense").length === 0);

  // 4b · L2 (6 Oct 2026, fate 35 · gates.txt:16) — A DEAD INSTRUMENT IS RED, NEVER GREEN. measure() is
  // driven with an injected scan / dependency-cruiser carrying each tool's exact output AND exit code.
  {
    const noDc = () => ({ available: false, errors: [], leads: [], raw: "" });
    const deadSg = await measure({ scanFn: () => ({ matches: [], raw: "Error: Cannot parse rule laws/bare-catch.yml\nHelp: The file is not a valid ast-grep rule.", code: 8, signal: null }), depcruiseFn: noDc });
    const jd = judgeMeasured(deadSg);
    assert("L2 · DEAD INSTRUMENT · an ast-grep that exits 8 (a rule YAML that does not parse) is RED by name — and not ONE of the seven laws prints a FALL telling a session to lower its baseline to 0",
      !jd.ok && /^INSTRUMENT DEAD — ast-grep: exited 8/.test(jd.reds[0]) && !jd.falls.some((f) => / FELL /.test(f)), JSON.stringify(jd));
    const cfgSg = judgeMeasured(await measure({ scanFn: () => ({ matches: [], raw: "Error: Cannot read configuration.", code: 6, signal: null }), depcruiseFn: noDc }));
    assert("L2 · DEAD INSTRUMENT · an ast-grep that cannot read its sgconfig (exit 6) is RED too — the scan never happened",
      !cfgSg.ok && /^INSTRUMENT DEAD — ast-grep: exited 6/.test(cfgSg.reds[0]));
    const liveSg = await measure({ scanFn: () => ({ matches: [], raw: "[]", code: 0, signal: null }), depcruiseFn: noDc });
    const liveErr = await measure({ scanFn: () => ({ matches: parseSg('[{"ruleId":"bare-catch","file":"scripts/x.mjs","range":{"start":{"line":1}},"text":"catch {}"}]'), raw: '[{"ruleId":"bare-catch","file":"scripts/x.mjs","range":{"start":{"line":1}},"text":"catch {}"}]', code: 1, signal: null }), depcruiseFn: noDc });
    assert("L2 · LIVE · exit 0 with [] and exit 1 with a JSON array (error-severity matches) are MEASUREMENTS — no instrument is dead, and the ratchet judges them as before",
      liveSg.sg.live === true && liveErr.sg.live === true && !judgeMeasured(liveSg).reds.some((r) => /INSTRUMENT DEAD/.test(r)) && !judgeMeasured(liveErr).reds.some((r) => /INSTRUMENT DEAD/.test(r)));
    const sameOut = (/** @type {number} */ code) => sgHealth({ raw: "[]", code, signal: null }).live;
    assert("L2 · measure() READS THE ast-grep EXIT CODE (it was captured and thrown away) — the SAME [] is a clean scan under exit 0 and a DEAD one under exit 8",
      sameOut(0) === true && sameOut(8) === false);
    const dcDead = judgeMeasured(await measure({ scanFn: () => ({ matches: [], raw: "[]", code: 0, signal: null }), depcruiseFn: () => ({ available: true, errors: [], leads: [], parsed: false, code: 1, raw: "ERROR: config file .dependency-cruiser.cjs not found" }) }));
    const dcAbsent = judgeMeasured(liveSg);
    assert("L2 · a dependency-cruiser whose answer does not parse is RED by name; an ABSENT one is NOT MEASURED — and neither prints 'depcruise_errors FELL … tighten to 0'",
      !dcDead.ok && dcDead.reds.some((r) => /^INSTRUMENT DEAD — dependency-cruiser/.test(r)) && !dcDead.falls.some((f) => /depcruise_errors FELL/.test(f))
      && dcAbsent.notes.some((n) => /depcruise_errors NOT MEASURED/.test(n)) && !dcAbsent.falls.some((f) => /depcruise_errors FELL/.test(f)), JSON.stringify({ dcDead, dcAbsent }));
  }

  // 4b · RAW NUL BYTES (forks row 616), both ways, over a throwaway tree — never the repo
  {
    const nd = mkdtempSync(join(tmpdir(), "arsenal-lawpack-nul-"));
    try {
      writeFileSync(join(nd, "dirty.mjs"), "export const k = (a, b) => `${a}" + String.fromCharCode(0) + "${b}`;\n");
      writeFileSync(join(nd, "clean.mjs"), "export const k = (a, b) => `${a}\\u0000${b}`;\n");
      writeFileSync(join(nd, "image.png"), Buffer.from([137, 80, 78, 71, 0, 0, 0, 13]));
      const n1 = rawNulFiles({ root: nd, files: ["dirty.mjs", "clean.mjs", "image.png"] });
      assert("RAW NUL — a raw byte 0 in a text file is a finding with its file and line; its escape is not; a binary type is never read",
        n1.live && n1.findings.length === 1 && n1.findings[0].file === "dirty.mjs" && n1.findings[0].line === 1, JSON.stringify(n1.findings));
      const n0 = rawNulFiles({ root: nd, files: ["clean.mjs"] });
      assert("RAW NUL — the escaped separator alone is clean (zero findings)", n0.live && n0.findings.length === 0);
      const nDead = rawNulFiles({ root: join(nd, "not-a-repo") });
      assert("RAW NUL — a tree git cannot list is a DEAD instrument, never a clean zero",
        !nDead.live && judgeMeasured({ counts: { ...base }, nul: nDead }).reds.some((r) => /INSTRUMENT DEAD — the raw-NUL byte scan/.test(r)));
    } finally { try { rmSync(nd, { recursive: true, force: true }); } catch { /* a temp dir the OS will reap anyway */ } }
  }

  // 4c · IMPORT-TIME READS THROUGH ANY DOOR (forks row 661 (3)) — the census's six claims, planted both ways, on every run
  {
    const kit = acornKit();
    if (kit.acorn) {
      const R = registryReaders({ kit });
      assert("IMPORT GRAPH — READERS are derived from registry.mjs at judge time: laneRows, rowOf, preCyborg and slotPassed in, the lazy view lazySubjects out (by its shape, never its name)",
        R.has("laneRows") && R.has("rowOf") && R.has("preCyborg") && R.has("slotPassed") && !R.has("lazySubjects"), [...R].join(", "));
      const gd = mkdtempSync(join(tmpdir(), "arsenal-lawpack-ig-"));
      try {
        mkdirSync(join(gd, "scripts"), { recursive: true });
        for (const [f, code] of Object.entries(IMPORT_PLANTS)) writeFileSync(join(gd, "scripts", f), code);
        const ig = importReads({ root: gd, readers: R, kit });
        const at = (/** @type {string} */ f) => ig.findings.filter((x) => x.file === `scripts/${f}`);
        const dp = (/** @type {string} */ f) => ig.dispatch.filter((x) => x.file === `scripts/${f}`);
        assert("IMPORT GRAPH — a module-level call through a same-file wrapper IS a read (w -> laneRows)",
          at("a_wrapper.mjs").length === 1 && at("a_wrapper.mjs")[0].via === "w -> laneRows" && dp("a_wrapper.mjs").length === 0, JSON.stringify(ig.findings));
        assert("IMPORT GRAPH — the same read behind the entry-identity main guard is NOT (0)",
          at("b_guarded.mjs").length === 0 && dp("b_guarded.mjs").length === 0);
        assert("IMPORT GRAPH — a dispatch on process.argv is not a guard: its read is an unguarded-dispatch, never an import-time read",
          dp("c_dispatch.mjs").length === 1 && at("c_dispatch.mjs").length === 0, JSON.stringify(ig.dispatch));
        assert("IMPORT GRAPH — a module-level lazySubjects view reads nothing at import (0)",
          at("d_lazy.mjs").length === 0 && dp("d_lazy.mjs").length === 0);
        assert("IMPORT GRAPH — a direct read by another reader name under an ALIAS counts (rowOf as r)",
          at("e_alias.mjs").length === 1 && at("e_alias.mjs")[0].reader === "rowOf");
        const u = judgeImportTimeRead([{ rule: "import-time-registry-read", file: "scripts/c_dispatch.mjs", line: 4 }, { rule: "import-time-registry-read", file: "scripts/z.mjs", line: 2 }], ig);
        assert("IMPORT GRAPH — one site is counted once: an ast-grep subjectsOf match at a site the judge holds as a dispatch is not a second read; one it does not hold is",
          u.findings.length === ig.findings.length + 1 && u.findings.some((x) => x.file === "scripts/z.mjs") && !u.findings.some((x) => x.file === "scripts/c_dispatch.mjs") && u.dispatch.length === ig.dispatch.length, JSON.stringify(u));
      } finally { try { rmSync(gd, { recursive: true, force: true }); } catch { /* a temp dir the OS will reap anyway */ } }
      const igDead = judgeMeasured({ counts: { ...base, "import-time-registry-read": 0, "unguarded-dispatch": 0 }, ig: { live: false, why: "acorn could not load (planted)", parseErrors: [] } });
      assert("IMPORT GRAPH — a judge with no acorn is a DEAD instrument: RED by name, and neither of its laws prints a FALL to 0",
        !igDead.ok && igDead.reds.some((r) => /INSTRUMENT DEAD — the import-graph judge/.test(r)) && !igDead.falls.some((f) => /import-time-registry-read FELL|unguarded-dispatch FELL/.test(f)), JSON.stringify(igDead));
      const igBlind = judgeMeasured({ counts: { ...base }, ig: { live: true, why: null, parseErrors: ["scripts/x.mjs · Unexpected token (1:4)"] } });
      assert("IMPORT GRAPH — a file naming registry.mjs that acorn cannot parse is a BLIND instrument, RED by name, never a clean zero",
        !igBlind.ok && igBlind.reds.some((r) => /INSTRUMENT BLIND — acorn could not parse 1 file/.test(r)), JSON.stringify(igBlind));
    } else {
      assert("BARE CHECKOUT — no acorn, so the import-graph plants are skipped and SAID (measurability is an answer)", true);
    }
  }

  // 5 · THE PLANT — every rule proven to BITE, on every run, in a throwaway project
  if (available()) {
    const m2 = plantAndScan();
    const bit = new Set((m2 || []).map((x) => x.rule));
    for (const id of RULE_IDS) assert(`PLANT — ${id} BITES on a planted violation (the rung's DONE-proof, run every time)`, bit.has(id), `rules that bit: ${[...bit].join(", ") || "none"}`);
    const irLines = (m2 || []).filter((x) => x.rule === "import-time-registry-read").map((x) => x.line);
    assert("PLANT — import-time-registry-read bites the module-level read ONLY (line 2), never the read inside a function (line 3)", irLines.join(",") === "2", `lines that bit: ${irLines.join(",") || "none"}`);
  } else {
    assert("BARE CHECKOUT — no ast-grep binary, so the plant test is skipped and SAID (measurability is an answer)", true);
  }

  console.log(`lawpack selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

// ── CLI ─────────────────────────────────────────────────────────────────────
async function main() {
  const mode = process.argv[2] || "report";
  if (mode === "selftest") return selftest();
  if (mode === "rules") {
    for (const id of RULE_IDS) console.log(`  ${existsSync(join(RULES_DIR, `${id}.yml`)) ? "✓" : "✗"} laws/${id}.yml`);
    console.log(`ast-grep: ${sgBin() || "ABSENT"}`);
    return;
  }
  if (!available()) {
    console.log("lawpack: NOT MEASURABLE HERE — no ast-grep (node_modules absent). `npm ci` installs the pinned pack; a bare checkout is not a failure.");
    return;
  }
  const m = await measure();
  if (mode === "leads") {
    const k = knipLeads();
    console.log(`lawpack leads · knip ${k.available ? `${k.leads.length} orphan(s)` : "ABSENT"} · depcruise ${m.dc.available ? `${m.dc.leads.length} informational` : "ABSENT"} · owners UNRESOLVED-by-syntax ${m.o.unresolved.length} (xray's IR owns that class)`);
    for (const l of k.leads.slice(0, 40)) console.log(`  LEAD ${l.kind} · ${l.file}${l.line ? `:${l.line}` : ""}${l.name ? ` · ${l.name}` : ""}`);
    if (k.leads.length > 40) console.log(`  … ${k.leads.length - 40} more`);
    for (const l of m.dc.leads.slice(0, 20)) console.log(`  LEAD ${l.rule.name} · ${l.from}`);
    return;
  }
  const miss = RULE_IDS.filter((id) => !m.rulesPresent.includes(id));
  const j = judgeMeasured(m);   // L2 (fate 35): the tools' health first — a dead instrument is RED, never green
  if (miss.length) j.reds.push(`RULE MISSING — ${miss.join(", ")} — the pack IS the law, so a missing rule file is a missing law.`);
  console.log(`lawpack · ${m.matches.length} raw match(es) over ${m.rulesPresent.length}/${RULE_IDS.length} rules · findings: ` +
    Object.entries(m.counts).map(([k2, v]) => `${k2} ${v}`).join(" · "));
  console.log(`  frozen: ${Object.entries(BASELINE).map(([k2, v]) => `${k2} ${v}`).join(" · ")}`);
  if (mode === "report") {
    const top = (label, rows) => { if (rows.length) console.log(`  ${label}`); for (const r of rows.slice(0, 6)) console.log(`      ${r.file}:${r.line} — ${r.why}`); if (rows.length > 6) console.log(`      … ${rows.length - 6} more`); };
    top("OWNERS-ONLY", m.o.findings);
    top("LAW M", m.m.findings);
    top("JUGAD", m.j.findings.filter((f) => f.lane));
    top("TRAILING-N", m.t.findings);
    top("BARE CATCH", m.c.findings);
    top("IMPORT-TIME REGISTRY READ", m.ir.findings);
    top("UNGUARDED DISPATCH", m.ir.dispatch);
    top("RAW NUL", m.nul.findings);
    if (m.dc.available) for (const e of m.dc.errors.slice(0, 8)) console.log(`      DEPCRUISE ${e.rule.name} · ${e.from} → ${e.to}`);
  }
  for (const r of j.reds) console.log(`  RED  ${r}`);
  for (const f of j.falls) console.log(`  ok   ${f}`);
  for (const n of j.notes) console.log(`  --   ${n}`);
  const ok = j.ok && !miss.length;
  console.log(ok ? "lawpack: GREEN — no law's finding count rose, and every rule is on disk" : `lawpack: ${j.reds.length} RED — a gate may only get stricter (§10-D rule 6)`);
  process.exit(ok ? 0 : 1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
