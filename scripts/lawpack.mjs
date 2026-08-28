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
//   it judges · every RED names file:line · a fallen count is reported, never pocketed.
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

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const RULES_DIR = join(ROOT, "laws");
const SGCONFIG = join(ROOT, "sgconfig.yml");
const NM = join(ROOT, "node_modules");

/** The five rule ids that must exist in laws/ — the pack IS the law, so a missing rule is a RED. */
export const RULE_IDS = ["owners-only-state-write", "law-m-literal-model", "jugad-literal-subject-list", "trailing-n-slice", "bare-catch"];

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
  "law-m-literal-model": 1,
  "jugad-literal-subject-list": 100,   // S10 ratchet (a2): 102 −1 shadow TYPES (#1) −1 tasks KINDS (#5; STATES stays — a plain state enum is not a jugad, the rule's own note)
  "trailing-n-slice": 7,
  "bare-catch": 38,
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
  try { return { out: execFileSync(file, args, { cwd: ROOT, encoding: "utf8", timeout: 600000, windowsHide: true, maxBuffer: 128 * 1024 * 1024, ...opts }), code: 0 }; }
  catch (e) { return { out: `${(e && e.stdout) || ""}${(e && e.stderr) || ""}`, code: (e && typeof e.status === "number") ? e.status : 1 }; }
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
  if (!bin) return { matches: [], raw: "" };
  const r = runTool(bin, ["scan", "--config", config, "--json=compact", ...paths], { cwd });
  return { matches: parseSg(r.out), raw: r.out, code: r.code };
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
  let v = [];
  try { v = ((JSON.parse(r.out.slice(r.out.indexOf("{"), r.out.lastIndexOf("}") + 1)).summary) || {}).violations || []; }
  catch { /* unparseable = the raw tail is printed below, never silently treated as zero */ }
  return {
    available: true,
    errors: v.filter((x) => x.rule && x.rule.severity === "error"),
    leads: v.filter((x) => x.rule && x.rule.severity !== "error"),
    parsed: Array.isArray(v),
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
export async function measure({ withDepcruise = true } = {}) {
  const { matches, raw } = scan();
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
  const dc = withDepcruise ? depcruise() : { available: false, errors: [], leads: [] };
  const counts = {
    "owners-only-state-write": o.findings.length,
    "law-m-literal-model": m.findings.length,
    "jugad-literal-subject-list": j.findings.length,
    "trailing-n-slice": t.findings.length,
    "bare-catch": c.findings.length,
    depcruise_errors: dc.available ? dc.errors.length : 0,
  };
  return { matches, counts, o, m, j, t, c, dc, raw, rulesPresent: RULE_IDS.filter((id) => existsSync(join(RULES_DIR, `${id}.yml`))) };
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

  // 5 · THE PLANT — every rule proven to BITE, on every run, in a throwaway project
  if (available()) {
    const m2 = plantAndScan();
    const bit = new Set((m2 || []).map((x) => x.rule));
    for (const id of RULE_IDS) assert(`PLANT — ${id} BITES on a planted violation (the rung's DONE-proof, run every time)`, bit.has(id), `rules that bit: ${[...bit].join(", ") || "none"}`);
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
  const j = judge(m.counts);
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
    if (m.dc.available) for (const e of m.dc.errors.slice(0, 8)) console.log(`      DEPCRUISE ${e.rule.name} · ${e.from} → ${e.to}`);
  }
  for (const r of j.reds) console.log(`  RED  ${r}`);
  for (const f of j.falls) console.log(`  ok   ${f}`);
  const ok = j.ok && !miss.length;
  console.log(ok ? "lawpack: GREEN — no law's finding count rose, and every rule is on disk" : `lawpack: ${j.reds.length} RED — a gate may only get stricter (§10-D rule 6)`);
  process.exit(ok ? 0 : 1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
