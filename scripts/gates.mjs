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
export const TYPE_BASELINE = { checked_organs: 13, soft_errors: 303 };
export const HARD_LINT_RULES = ["no-undef"];
export const LINT_BASELINE = { "no-empty": 267, "no-unused-vars": 87, warnings: 2 };

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
function selftest() {
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

  console.log(`gates selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}

// ── CLI ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = process.argv[2] || "report";
  if (mode === "selftest") return selftest();
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
  const j = judge(m);
  for (const r of j.reds) console.log(`  RED  ${r}`);
  for (const f of j.falls) console.log(`  ok   ${f}`);
  console.log(j.ok ? "gates: GREEN — nothing rose, and the undefined-symbol families are 0 on both sides" : `gates: ${j.reds.length} RED — a gate may only get stricter (§10-D rule 6)`);
  process.exit(j.ok ? 0 : 1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
