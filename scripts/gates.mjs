#!/usr/bin/env node
// @ts-check
// ============================================================================
// gates.mjs · ARSENAL AI FC — THE TIER-0 GATES: TYPE + LINT, AS A RATCHET
//   (THE ORGANISM AUDIT §10-C · rung S2, 20 Aug 2026)
//   SOLE WRITER of: NOTHING. It measures and it judges; it never edits a baseline,
//   never rewrites a source file, and never touches state.
// ----------------------------------------------------------------------------
// LAW T, TIER 0, in its purest form: this costs ZERO model tokens and is BETTER than
// any model at the one job it does — telling you a symbol does not exist BEFORE the
// organ runs. The class it exists for is the `readJsonl()` ReferenceError: a name that
// was never defined, on a path nothing exercised until 03:00, in an organ whose selftest
// was green. A model reading 105 organs would cost lakhs and still miss one; `tsc` finds
// it in 12 seconds, every commit, forever.
//
// WHY A RATCHET AND NOT A TARGET. Measured the day this was built: 303 checkJs
// diagnostics across the 12 hottest organs and 354 lint errors across all of them — of
// which 267 are `catch {}`, the silent-swallow class swallow.mjs already counts. Driving
// those to zero is a TypeScript rewrite, which is this rung's FORBIDDEN line. A gate
// nobody can satisfy gets deleted, and a deleted gate guards nothing. So the numbers are
// FROZEN where they were found, and the only law is direction:
//   · the undefined-symbol family must be **0**, always — it is 0 today and may never rise
//   · every frozen count **may only FALL**
//   · the number of @ts-check'd organs **may only GROW**
// This is §10-D rule 6 made mechanical: a gate may only get stricter.
//
// THE BASELINES LIVE IN THIS FILE, by the rung's own words ("baseline counts recorded
// inside the gate"). When a number falls, the gate SAYS SO and a session tightens the
// constant in the same commit — the gate never edits itself, because a self-lowering
// baseline is a gate that quietly stops guarding (treasury.mjs's rule: a number this repo
// has not ruled on is a RULING, never an auto-fix).
//
// A BARE CHECKOUT IS NOT A FAILURE. Without node_modules there is no tsc and no eslint,
// so the gate answers NOT MEASURABLE HERE and exits 0 — pulse.mjs's established shape.
// Measurability is an answer; silence is not.
//
// VERSIONS, RECORDED HERE BY §10-G (pinned EXACT in package.json, lockfile committed):
//   typescript 6.0.3 — NOT 7.0.2, which is latest: typescript-eslint 8.67.0 declares
//     `typescript >=4.8.4 <6.1.0`, so taking latest would break the pair this rung asks
//     for. That is the version POLICY working, not a downgrade; the next version rung
//     re-asks the question.
//   eslint 10.8.1 · typescript-eslint 8.67.0 · globals 17.11.0
//   @types/node 22.20.1 — pinned to the RUNTIME's major (Node 22.14), never to latest:
//     types ahead of the runtime bless APIs this machine does not have. Node 24 lands at
//     S8 step 0 and its types move in that same version commit.
//
// LAWS: writes nothing · measures before it judges · every RED names the file:line ·
//   a fallen count is reported, never silently pocketed · ARSENAL_ORGAN=1 changes nothing
//   (this organ is only ever run by a human or by npm test).
// WHO ELSE COULD ACT ON THIS OUTPUT? organism_test.mjs (`gates` mode — wired, so both
//   gates ride `npm test`) · S3's law pack (ast-grep rules join the same ratchet shape).
// CLI: node scripts/gates.mjs [report|types|lint|selftest]
// ============================================================================
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const TSC = join(ROOT, "node_modules", "typescript", "bin", "tsc");
const ESLINT = join(ROOT, "node_modules", "eslint", "bin", "eslint.js");
const AJV = join(ROOT, "node_modules", "ajv", "lib", "ajv.js");
export const SCHEMA_DIR = join(ROOT, "schemas");
export const STATE_DIR_G = join(ROOT, "dressing-room", "state");

// ── THE FROZEN BASELINES — measured 20 Aug 2026, and they may only move one way ──
/** THE "THIS NAME DOES NOT EXIST" FAMILY, and nothing else: TS2304 cannot-find-name ·
 *  2552 cannot-find-name-did-you-mean · 2307 cannot-find-module · 2686 undefined UMD
 *  global · 2662/2663 a bare name that is really an instance/static member. Every one is
 *  a symbol that IS NOT THERE — a ReferenceError waiting for the path to be walked.
 *  NARROWED ON ITS FIRST LIVE RUN (§4 binds this instrument too): 2551 and 2561 were in
 *  this list and produced three immediate false positives — `loadSessionHandle({ model, … })`
 *  in dugout.mjs, where the callee's very first destructured parameter IS `model`; TS simply
 *  could not infer it (no default, no annotation) and called the literal excess. Both codes
 *  are PROPERTY checks on an object literal, not symbol lookups, so they belong in the frozen
 *  soft count. Verified by reading the callee before the list was cut, not after. */
export const HARD_TYPE_CODES = [2304, 2552, 2307, 2686, 2662, 2663];
// TIGHTENED 20 Aug 2026 (rung S3): 13 → 14. `scripts/lawpack.mjs` arrived carrying its own
// `// @ts-check` and produced ZERO new diagnostics, so the checked list grew and the soft count
// did not move. The gate ASKED for this constant to be raised and a session raised it, in the
// same commit — which is the whole design: the gate never edits its own baseline.
export const TYPE_BASELINE = { checked_organs: 14, soft_errors: 298 };   // RUNG A (30 Aug 2026): 303 -> 298. Giving `decide()`, `setGateForce` and `journalForce` explicit defaults for their no-default params fixed five diagnostics of the SAME class (a destructured param with no default vanishes from the `= {}` type, so every call site that passes it is a phantom "unknown property"). Ratcheted on the spot: slack a later edit could spend is not a gate.
export const HARD_LINT_RULES = ["no-undef"];
export const LINT_BASELINE = { "no-empty": 267, "no-unused-vars": 87, warnings: 2 };
// ── S11 · THE THIRD TIER-0 TOOL: ajv, JSON-Schema per state file ────────────
// The owners-only law answers WHO may write each state file. Nothing answered WHAT
// lands there — so a sole writer with a bug writes valid JSON that is not a valid
// anything, and every reader downstream finds out one crash at a time. schemas/ holds
// one draft-07 schema per file; a file that HAS one must validate, always, as a RED.
// THE RATCHET, same shape as its two neighbours: the count may only RISE, and this
// gate never edits its own baseline — a session raises it in the commit that adds the
// schema. Started at 4 (registry · captains_call · models · laws_register), the four
// whose shapes S10 and S11 have just finished pinning down in code.
export const SCHEMA_BASELINE = 4;

export const available = () => existsSync(TSC) && existsSync(ESLINT);

// ── PURE: tsc's stdout → the numbers ────────────────────────────────────────
/** @param {string} out */
export function parseTsc(out) {
  const byCode = /** @type {Record<string, number>} */ ({});
  const hard = [];
  let total = 0;
  for (const line of String(out).split(/\r?\n/)) {
    const m = /^(.+?)\((\d+),(\d+)\): error TS(\d+): (.*)$/.exec(line);
    if (!m) continue;
    total++;
    const code = Number(m[4]);
    byCode[code] = (byCode[code] || 0) + 1;
    if (HARD_TYPE_CODES.includes(code)) hard.push({ file: m[1], line: Number(m[2]), code, why: m[5] });
  }
  return { total, byCode, hard };
}

// ── PURE: eslint's JSON → the numbers ───────────────────────────────────────
/** @param {any[]} report */
export function parseEslint(report) {
  const byRule = /** @type {Record<string, number>} */ ({});
  const hard = [];
  let errors = 0, warnings = 0;
  for (const f of Array.isArray(report) ? report : []) {
    for (const m of f.messages || []) {
      const rule = m.ruleId || "(directive)";
      byRule[rule] = (byRule[rule] || 0) + 1;
      if (m.severity === 2) errors++; else warnings++;
      if (HARD_LINT_RULES.includes(rule)) hard.push({ file: f.filePath, line: m.line, rule, why: m.message });
    }
  }
  return { errors, warnings, byRule, hard };
}

// ── PURE: the ratchet itself. This is the whole law, and the selftest drives it ──
/**
 * @param {{types:{total:number,hard:any[],checked:number}, lint:{errors:number,warnings:number,byRule:Record<string,number>,hard:any[]}}} m
 */
export function judge(m, { typeBase = TYPE_BASELINE, lintBase = LINT_BASELINE } = {}) {
  const reds = [], falls = [];
  // 1 · the undefined-symbol family is 0, always
  if (m.types.hard.length) reds.push(`TYPE HARD — ${m.types.hard.length} undefined-symbol error(s); this family must be 0:\n` +
    m.types.hard.slice(0, 8).map((h) => `           ${h.file}:${h.line} TS${h.code} ${h.why}`).join("\n"));
  for (const h of m.lint.hard) reds.push(`LINT HARD — no-undef at ${h.file}:${h.line} — ${h.why}`);
  // 2 · the checked list may only GROW
  if (m.types.checked < typeBase.checked_organs) reds.push(`TYPE LIST SHRANK — ${m.types.checked} organs carry \`@ts-check\`, baseline ${typeBase.checked_organs}. The list may only grow.`);
  else if (m.types.checked > typeBase.checked_organs) falls.push(`TYPE LIST GREW — ${m.types.checked} organs checked (baseline ${typeBase.checked_organs}); tighten TYPE_BASELINE.checked_organs to ${m.types.checked}.`);
  // 3 · every frozen count may only FALL
  const soft = m.types.total - m.types.hard.length;
  if (soft > typeBase.soft_errors) reds.push(`TYPE COUNT ROSE — ${soft} checkJs diagnostics, baseline ${typeBase.soft_errors}. A gate may only get stricter (§10-D rule 6).`);
  else if (soft < typeBase.soft_errors) falls.push(`TYPE COUNT FELL — ${soft} (baseline ${typeBase.soft_errors}); tighten TYPE_BASELINE.soft_errors to ${soft}.`);
  for (const [rule, base] of Object.entries(lintBase)) {
    if (rule === "warnings") continue;
    const now = m.lint.byRule[rule] || 0;
    if (now > base) reds.push(`LINT ROSE — ${rule} ${now}, baseline ${base}. A gate may only get stricter.`);
    else if (now < base) falls.push(`LINT FELL — ${rule} ${now} (baseline ${base}); tighten LINT_BASELINE["${rule}"] to ${now}.`);
  }
  if (m.lint.warnings > lintBase.warnings) reds.push(`LINT WARNINGS ROSE — ${m.lint.warnings}, baseline ${lintBase.warnings}.`);
  // 4 · a rule that appears out of nowhere is a new class, not a free pass
  for (const [rule, n] of Object.entries(m.lint.byRule)) {
    if (rule === "(directive)" || HARD_LINT_RULES.includes(rule) || rule in lintBase) continue;
    reds.push(`LINT NEW CLASS — ${rule} ×${n} is not in the frozen baseline; a new rule's findings are never grandfathered.`);
  }
  return { ok: reds.length === 0, reds, falls };
}

// ── S11 · SCHEMA VALIDATION (pure over injected results; ajv is loaded lazily) ──
/** judgeSchemas — a file WITH a schema must validate; the schema'd count may only rise.
 *
 * ⚠ `state_missing` MEANT TWO DIFFERENT THINGS UNDER ONE NAME (bead af-beh, 2 Sep 2026), and this
 * is what it cost: `node scripts/gates.mjs selftest` was 20 passed / 0 failed at home and
 * 19 / 1 in a fresh clone of the same commit, with the evidence line
 * "captains_call.json: state missing · models.json: state missing". Both of those files are
 * GITIGNORED BY HIS DESIGN (.gitignore:397 and :467), so no checkout — cloud or local — will ever
 * carry them, and their absence there is evidence of exactly nothing. The member is inside
 * `organism:selftest`, which the away-day CI lane runs, so this red exits 1 in the cloud and
 * nowhere else. It was NAMED by that lane itself on the run for da841a6 — the second member the
 * repaired annotation has named, after af-kih.
 * THE TWO MEANINGS, NOW SPLIT:
 *   · a TRACKED state file that is gone → a broken checkout → still a RED, untouched.
 *   · a GITIGNORED state file absent from a checkout → correct by his own ruling → a NAMED SKIP.
 * THE SHAPE IS THIS CAMPAIGN'S OWN RULING, taken verbatim from bead af-2it: "a suite member whose
 * verdict depends on [something absent] is not a ratchet — it should degrade to a NAMED skip
 * ('… this member measured nothing') rather than a red". Never a red, and never a silent pass:
 * a skip is counted and named, and a run where EVERYTHING skipped must not read green.
 * STRICTLY MORE PRECISE, NOT WEAKER: at home nothing changes (both files exist), a tracked file
 * that vanishes is still red, and when git cannot answer the row falls back to red — uncertainty
 * resolves to the strict side, the same rule awayday.mjs follows ("silence must never look green").
 * The count ratchet still counts SCHEMAS, which do not move, so SCHEMA_BASELINE stays 4.
 */
export function judgeSchemas(results, { base = SCHEMA_BASELINE } = {}) {
  const reds = [], falls = [], skips = [];
  for (const r of results) {
    if (r.not_in_checkout) { skips.push(`${r.file} is not in this checkout (gitignored by design) — NOT MEASURED, not passed`); continue; }
    if (r.state_missing) { reds.push(`SCHEMA — ${r.file} has a schema and NO state file; a schema for a file that does not exist is a claim nothing can check`); continue; }
    if (r.schema_broken) { reds.push(`SCHEMA — ${r.file}'s schema does not compile (${r.schema_broken}); an unrunnable gate reads GREEN by absence`); continue; }
    if (!r.valid) reds.push(`SCHEMA — ${r.file} does NOT match schemas/${r.file}.schema.json:\n           ${r.errors.slice(0, 6).join("\n           ")}`);
  }
  if (results.length < base) reds.push(`SCHEMA COUNT FELL — ${results.length} state file(s) schema'd, baseline ${base}. The list may only grow (§10-D rule 6).`);
  else if (results.length > base) falls.push(`SCHEMA COUNT GREW — ${results.length} schema'd (baseline ${base}); tighten SCHEMA_BASELINE to ${results.length}.`);
  // A RUN THAT MEASURED NOTHING MUST NOT READ GREEN. If every schema'd file is out of the
  // checkout there is no evidence here at all, and saying so is the whole point of a named skip.
  if (results.length && skips.length === results.length) {
    falls.push(`SCHEMA NOT MEASURED — all ${results.length} schema'd state file(s) are out of this checkout; this member measured NOTHING`);
  }
  return { ok: reds.length === 0, reds, falls, skips, measured: results.length - skips.length };
}

/** validateState — reads schemas/, validates each named state file. Returns one row per
 *  schema; never throws, because a gate that dies is a gate that cannot say NO.
 *  `tracked` is the seam the selftest drives: a Set of state filenames git carries, or null
 *  meaning "git could not answer", which keeps every absent file RED (af-beh). Its DEFAULT is the
 *  live git read, so production takes the real answer and only a test can supply another. */
// IS THIS PATH CARRIED BY A CHECKOUT AT ALL? (af-beh, 2 Sep 2026.) Read from git, LIVE — never a
// hand-written list of "files that may be missing", which is the exact jugad LAW PACK's own rule
// refuses and which would rot the day he ignores a fifth file. `git ls-files` is the same move
// awayday.mjs's exposure() already makes to answer the mirror question about this repo.
// FAIL-CLOSED: if git cannot answer — not on PATH, not a work tree, a timeout — this returns null
// and every caller keeps today's RED. An unanswerable question must never resolve to a pass.
function trackedStateFiles(deps = {}) {
  try {
    const out = deps.gitLs || execFileSync("git", ["ls-files", "--", "dressing-room/state"],
      { encoding: "utf8", cwd: ROOT, windowsHide: true, timeout: 30000, stdio: ["ignore", "pipe", "ignore"] });
    return new Set(String(typeof out === "function" ? out() : out).split(/\r?\n/)
      .map((l) => l.trim()).filter(Boolean).map((p) => p.split("/").pop()));
  } catch { return null; }
}

export async function validateState({ schemaDir = SCHEMA_DIR, stateDir = STATE_DIR_G, tracked = trackedStateFiles() } = {}) {
  const out = [];
  // Read ONCE for the whole pass, not per row: one git call in the default above, and every row
  // asks the same answer.
  const trackedSet = tracked;
  let Ajv; try { ({ default: Ajv } = await import(pathToFileURL(AJV).href)); } catch { return out; }   // no node_modules ⇒ NOT MEASURABLE, same as tsc/eslint
  let names = []; try { names = readdirSync(schemaDir).filter((f) => f.endsWith(".schema.json")); } catch { return out; }
  for (const sf of names.sort()) {
    const file = sf.replace(/\.schema\.json$/, "");
    const row = { file, valid: false, errors: [], state_missing: false, schema_broken: null, not_in_checkout: false };
    let validate;
    try { validate = new Ajv({ allErrors: true, strict: false }).compile(JSON.parse(readFileSync(join(schemaDir, sf), "utf8"))); }
    catch (e) { row.schema_broken = String((e && e.message) || e).slice(0, 160); out.push(row); continue; }
    const target = join(stateDir, file);
    // ABSENT, AND WHY IT IS ABSENT — the split af-beh exists for. A file git does not track can
    // never be in a checkout, so its absence is a fact about the checkout, not a defect. A TRACKED
    // file that is missing is still exactly the red this rule was written for, and `trackedSet ===
    // null` (git could not answer) also keeps that red — the strict side wins every tie.
    if (!existsSync(target)) {
      row.state_missing = true;
      row.not_in_checkout = trackedSet !== null && !trackedSet.has(file);
      out.push(row); continue;
    }
    let data; try { data = JSON.parse(readFileSync(target, "utf8")); }
    catch (e) { row.errors = [`the file is not parseable JSON: ${String((e && e.message) || e).slice(0, 120)}`]; out.push(row); continue; }
    row.valid = !!validate(data);
    if (!row.valid) row.errors = (validate.errors || []).map((e) => `${e.dataPath || e.instancePath || "(root)"} ${e.message}`);
    out.push(row);
  }
  return out;
}

// ── MEASURE (spawns the two tools; they write nothing) ──────────────────────
export function checkedOrgans() {
  let n = 0;
  for (const dir of ["scripts", "hooks"]) {
    let files = []; try { files = readdirSync(join(ROOT, dir)); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith(".mjs")) continue;
      try { if (/^\/\/\s*@ts-check\s*$/m.test(readFileSync(join(ROOT, dir, f), "utf8").slice(0, 400))) n++; } catch { /* unreadable = not checked */ }
    }
  }
  return n;
}

const spawn = (args) => {
  try { return { out: execFileSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", timeout: 600000, windowsHide: true, maxBuffer: 64 * 1024 * 1024 }), code: 0 }; }
  catch (e) { return { out: `${(e && e.stdout) || ""}${(e && e.stderr) || ""}`, code: (e && e.status) || 1 }; }
};

export function measure() {
  const tsc = spawn([TSC, "-p", join(ROOT, "tsconfig.json"), "--noEmit"]);
  const t = parseTsc(tsc.out);
  const es = spawn([ESLINT, "scripts", "hooks", "--format", "json"]);
  let report = [];
  try { report = JSON.parse(es.out.slice(es.out.indexOf("["), es.out.lastIndexOf("]") + 1)); } catch { /* judged as zero below, and the raw tail is printed */ }
  const l = parseEslint(report);
  return { types: { ...t, checked: checkedOrgans() }, lint: l, raw: { tsc: tsc.out, eslint: es.out } };
}

// ── SELFTEST — hermetic: the ratchet is driven on synthetic numbers, no tools spawned ──
async function selftest() {
  let pass = 0, fail = 0;
  const assert = (n, c, d) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${n}${c || !d ? "" : `\n      ${d}`}`); };
  // the fixture IS the frozen baseline, derived — a selftest that hardcodes the numbers
  // goes red every time the ratchet legitimately tightens, which teaches people to ignore it.
  const base = { types: { total: TYPE_BASELINE.soft_errors, hard: [], checked: TYPE_BASELINE.checked_organs },
    lint: { errors: LINT_BASELINE["no-empty"] + LINT_BASELINE["no-unused-vars"], warnings: LINT_BASELINE.warnings, byRule: { "no-empty": LINT_BASELINE["no-empty"], "no-unused-vars": LINT_BASELINE["no-unused-vars"] }, hard: [] } };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  assert("BASELINE — the measured day-one state is GREEN (a gate that is red on arrival is never adopted)", judge(base).ok);

  // the readJsonl class — the whole reason this gate exists
  const undef = clone(base);
  undef.types.hard = [{ file: "scripts/x.mjs", line: 42, code: 2304, why: "Cannot find name 'readJsonl'." }];
  const ju = judge(undef);
  assert("HARD TYPE — one undefined symbol is RED, and the RED names the file, the line and the symbol",
    !ju.ok && /TYPE HARD/.test(ju.reds[0]) && /scripts\/x\.mjs:42/.test(ju.reds[0]) && /readJsonl/.test(ju.reds[0]), JSON.stringify(ju.reds));
  assert("HARD TYPE — the undefined-symbol family is the cannot-find set, and 2339 (property on a loose object) is NOT in it",
    HARD_TYPE_CODES.includes(2304) && HARD_TYPE_CODES.includes(2307) && !HARD_TYPE_CODES.includes(2339));

  const nu = clone(base);
  nu.lint.hard = [{ file: "scripts/y.mjs", line: 7, rule: "no-undef", why: "'foo' is not defined." }];
  assert("HARD LINT — a single no-undef anywhere in the 105 is RED", !judge(nu).ok);

  // the ratchet, both directions
  const rose = clone(base); rose.types.total = TYPE_BASELINE.soft_errors + 1;
  assert("RATCHET — one more checkJs diagnostic than the baseline is RED", !judge(rose).ok);
  const fell = clone(base); fell.types.total = TYPE_BASELINE.soft_errors - 3;
  const jf = judge(fell);
  assert("RATCHET — fewer is GREEN, and the gate SAYS to tighten the constant (a fall is never pocketed silently)",
    jf.ok && jf.falls.some((f) => f.includes(`TYPE COUNT FELL — ${TYPE_BASELINE.soft_errors - 3}`)), JSON.stringify(jf.falls));
  const lintRose = clone(base); lintRose.lint.byRule["no-empty"] = LINT_BASELINE["no-empty"] + 1;
  assert("RATCHET — one more silent swallow than the baseline is RED", !judge(lintRose).ok);
  const lintFell = clone(base); lintFell.lint.byRule["no-empty"] = 200;
  assert("RATCHET — swallows falling is GREEN and reported", judge(lintFell).ok && judge(lintFell).falls.some((f) => /no-empty 200/.test(f)));

  // the list may only grow
  const shrank = clone(base); shrank.types.checked = TYPE_BASELINE.checked_organs - 1;
  assert("LIST — removing a `@ts-check` pragma is RED (the checked list may only grow)", !judge(shrank).ok);
  const grew = clone(base); grew.types.checked = TYPE_BASELINE.checked_organs + 1;
  assert("LIST — adding one is GREEN and asks for the constant to be raised", judge(grew).ok && judge(grew).falls.some((f) => /TYPE LIST GREW/.test(f)));

  // a NEW rule's findings are never grandfathered
  const newRule = clone(base); newRule.lint.byRule["no-fallthrough"] = 3;
  assert("NEW CLASS — a rule that is not in the frozen baseline cannot arrive with findings already forgiven",
    !judge(newRule).ok && judge(newRule).reds.some((r) => /LINT NEW CLASS — no-fallthrough/.test(r)));

  // the parsers, on real tool output shapes
  const t = parseTsc("scripts/a.mjs(10,5): error TS2304: Cannot find name 'readJsonl'.\nscripts/b.mjs(1,1): error TS2339: Property 'x' does not exist on type '{}'.\nnot an error line");
  assert("PARSE tsc — counts every error, splits hard from soft, keeps file:line", t.total === 2 && t.hard.length === 1 && t.hard[0].line === 10 && t.byCode[2339] === 1, JSON.stringify(t));
  const l = parseEslint([{ filePath: "a.mjs", messages: [{ ruleId: "no-undef", severity: 2, line: 3, message: "'q' is not defined." }, { ruleId: "no-empty", severity: 2, line: 9, message: "Empty block statement." }, { ruleId: null, severity: 1, line: 1, message: "Unused eslint-disable directive." }] }]);
  assert("PARSE eslint — errors, warnings and per-rule counts, with no-undef pulled out as hard",
    l.errors === 2 && l.warnings === 1 && l.byRule["no-empty"] === 1 && l.hard.length === 1, JSON.stringify(l));

  // the live pragma count really is at least the baseline (cheap, no tool spawn)
  assert(`LIVE — ${checkedOrgans()} organ(s) carry \`@ts-check\` on disk, baseline ${TYPE_BASELINE.checked_organs}`, checkedOrgans() >= TYPE_BASELINE.checked_organs);
  assert("BARE CHECKOUT — the gate can say whether it is measurable at all", typeof available() === "boolean");

  // ── S11 · THE SCHEMA GATE (ajv), judged on synthetic rows then RUN for real ──
  const okRow = (f) => ({ file: f, valid: true, errors: [], state_missing: false, schema_broken: null });
  const four = ["a.json", "b.json", "c.json", "d.json"].map(okRow);
  assert("SCHEMA — four valid files at the baseline is GREEN", judgeSchemas(four, { base: 4 }).ok);
  assert("SCHEMA — a state file that does NOT match its schema is RED, and the RED quotes the failing paths",
    (() => { const bad = [...four.slice(0, 3), { file: "d.json", valid: false, errors: ["/cards/0 should have required property id"], state_missing: false, schema_broken: null }];
      const jj = judgeSchemas(bad, { base: 4 }); return !jj.ok && /d\.json does NOT match/.test(jj.reds[0]) && /required property id/.test(jj.reds[0]); })());
  assert("SCHEMA — a schema whose FILE is missing is RED (a claim nothing can check), and a schema that will not compile is RED too (an unrunnable gate reads GREEN by absence)",
    !judgeSchemas([...four.slice(0, 3), { file: "d.json", valid: false, errors: [], state_missing: true, schema_broken: null }], { base: 4 }).ok
    && !judgeSchemas([...four.slice(0, 3), { file: "d.json", valid: false, errors: [], state_missing: false, schema_broken: "unknown keyword" }], { base: 4 }).ok);
  assert("SCHEMA RATCHET — deleting a schema is RED (the list may only grow); adding one is GREEN and ASKS for the constant to be raised",
    !judgeSchemas(four.slice(0, 3), { base: 4 }).ok
    && judgeSchemas([...four, okRow("e.json")], { base: 4 }).ok
    && judgeSchemas([...four, okRow("e.json")], { base: 4 }).falls.some((f) => /SCHEMA COUNT GREW — 5/.test(f)));
  {
    // and the LIVE four, actually validated — an unrun gate is a hypothesis.
    // ⚠ THE SKIP IS PART OF THE CLAIM NOW (af-beh). This read `every(r => … && !r.state_missing)`,
    // which was 20/0 here and 19/1 in a fresh clone of the same commit, because two of the four
    // state files are gitignored by his design and a checkout cannot carry them. The member now
    // says how many it actually MEASURED and names what it could not — never a red for a file that
    // was never going to be there, and never a silent pass either.
    const live = await validateState({});
    const lj = judgeSchemas(live);
    const outOf = live.filter((r) => r.not_in_checkout).map((r) => r.file);
    assert(`SCHEMA LIVE — ${live.length} schema(s) on disk, every one compiling and every state file THIS CHECKOUT CARRIES matching it (measured ${lj.measured}${outOf.length ? ` · not in this checkout: ${outOf.join(", ")}` : ""})`,
      live.length >= SCHEMA_BASELINE && live.every((r) => r.not_in_checkout || (r.valid && !r.schema_broken && !r.state_missing)),
      live.filter((r) => !r.valid && !r.not_in_checkout).map((r) => `${r.file}: ${r.schema_broken || r.errors.slice(0, 2).join(" | ") || "state missing"}`).join(" · "));

    // ── af-beh — THE SPLIT ITSELF, ON FIXTURES, BOTH DIRECTIONS ──────────────────────────────
    const goneRow = (f) => ({ file: f, valid: false, errors: [], state_missing: true, schema_broken: null, not_in_checkout: true });
    const missingRow = (f) => ({ file: f, valid: false, errors: [], state_missing: true, schema_broken: null, not_in_checkout: false });
    assert("af-beh — a gitignored state file absent from a checkout is a NAMED SKIP, not a red: it is counted out of `measured`, it is named in `skips`, and it never becomes a pass",
      (() => { const j = judgeSchemas([...four.slice(0, 3), goneRow("d.json")], { base: 4 });
               return j.ok && j.measured === 3 && j.skips.length === 1 && /d\.json is not in this checkout/.test(j.skips[0]); })());
    assert("af-beh — …and a TRACKED state file that is missing is STILL RED. That is the law this rule was written for and it is not touched",
      !judgeSchemas([...four.slice(0, 3), missingRow("d.json")], { base: 4 }).ok);
    assert("af-beh — a run where EVERY schema'd file is out of the checkout does not read green: it says it measured NOTHING",
      (() => { const j = judgeSchemas(["a.json", "b.json", "c.json", "d.json"].map(goneRow), { base: 4 });
               return j.measured === 0 && j.falls.some((f) => /measured NOTHING/.test(f)); })());
    assert("af-beh — WHEN GIT CANNOT ANSWER, THE ROW STAYS RED: an unanswerable question resolves to the strict side, never to a pass (the same rule awayday.mjs follows for a failed read)",
      (await validateState({ tracked: null })).every((r) => !r.not_in_checkout));
    assert("af-beh — the tracked set is READ FROM GIT, never a hand-written list of files that may be absent (that list would rot the day he ignores a fifth one)",
      (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
               const fn = src.slice(src.indexOf("function trackedStateFiles"), src.indexOf("export async function validateState"));
               return /git", \["ls-files"/.test(fn) && !/captains_call|models\.json/.test(fn); })());
    assert("af-beh — and the report line NAMES what it could not measure, because '2/2 match' alone is a smaller truth wearing a bigger number",
      (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
               return /NOT MEASURED — not in this checkout/.test(src) && /sj\.measured/.test(src); })());
  }

  console.log(`gates selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

// ── CLI ─────────────────────────────────────────────────────────────────────
async function main() {
  const mode = process.argv[2] || "report";
  if (mode === "selftest") return await selftest();
  if (!available()) {
    console.log("gates: NOT MEASURABLE HERE — no node_modules (tsc/eslint absent). `npm ci` installs the pinned toolchain; a bare checkout is not a failure.");
    return;
  }
  const m = measure();
  const soft = m.types.total - m.types.hard.length;
  if (mode === "types" || mode === "report") {
    console.log(`gates types  · ${m.types.checked} organ(s) @ts-check'd (baseline ${TYPE_BASELINE.checked_organs}, may only grow) · undefined-symbol family ${m.types.hard.length} (must be 0) · other checkJs diagnostics ${soft} (baseline ${TYPE_BASELINE.soft_errors}, may only fall)`);
    if (mode === "types") { const j = judge(m); for (const r of j.reds) console.log(`  RED  ${r}`); for (const f of j.falls) console.log(`  ok   ${f}`); process.exit(j.ok ? 0 : 1); }
  }
  if (mode === "lint" || mode === "report") {
    const top = Object.entries(m.lint.byRule).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(" · ") || "none";
    console.log(`gates lint   · ${m.lint.errors} error(s) · ${m.lint.warnings} warning(s) · ${top} (frozen: ${Object.entries(LINT_BASELINE).map(([k, v]) => `${k} ${v}`).join(" · ")})`);
    if (mode === "lint") { const j = judge(m); for (const r of j.reds) console.log(`  RED  ${r}`); for (const f of j.falls) console.log(`  ok   ${f}`); process.exit(j.ok ? 0 : 1); }
  }
  // S11 · the third TIER-0 tool. Its rows are printed even when everything passes,
  // because "4 state files have a schema" is a number that must be visible to rise.
  const sr = await validateState({});
  const sj = judgeSchemas(sr);
  if (mode === "schemas" || mode === "report") {
    // THE SKIPPED FILES ARE NAMED IN THE LINE, not just excluded from it (af-beh). "2/2 match" with
    // no further word would be a smaller truth wearing a bigger number — the reader has to be able
    // to see that two of the four were never measured, and which two.
    const gone = sr.filter((r) => r.not_in_checkout).map((r) => r.file);
    console.log(`gates schema · ${sr.filter((r) => r.valid).length}/${sj.measured} state file(s) match their schema (baseline ${SCHEMA_BASELINE}, may only grow)`
      + (gone.length ? ` · ${gone.length} NOT MEASURED — not in this checkout: ${gone.join(", ")}` : "")
      + (sr.length ? "" : " — NOT MEASURABLE (no ajv / no schemas/)"));
    if (mode === "schemas") { for (const r of sj.reds) console.log(`  RED  ${r}`); for (const f of sj.falls) console.log(`  ok   ${f}`); process.exit(sj.ok ? 0 : 1); }
  }
  const j = judge(m);
  const reds = [...j.reds, ...sj.reds], falls = [...j.falls, ...sj.falls];
  for (const r of reds) console.log(`  RED  ${r}`);
  for (const f of falls) console.log(`  ok   ${f}`);
  const ok = j.ok && sj.ok;
  console.log(ok ? "gates: GREEN — nothing rose, the undefined-symbol families are 0 on both sides, and every schema'd state file matches" : `gates: ${reds.length} RED — a gate may only get stricter (§10-D rule 6)`);
  process.exit(ok ? 0 : 1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
