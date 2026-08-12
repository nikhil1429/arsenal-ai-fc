#!/usr/bin/env node
// ============================================================================
// mutagen.mjs · ARSENAL AI FC — DOES ANYTHING NOTICE? (12 Aug 2026)
//   Writes NOTHING outside its own sandbox. Owns no state file.
// ----------------------------------------------------------------------------
// THE QUESTION THIS ORGAN EXISTS TO ANSWER. "Does the suite pass" is the wrong
// question here and always has been: every bug this repo actually shipped was a
// LIVE-ORACLE failure, where the code was internally consistent AND THE SUITE
// AGREED WITH IT. Reading finds nothing because there is nothing wrong to read.
// The right question is "what can I break WITHOUT the suite noticing", and that
// question has a name — mutation testing — and it is the only rigorous answer to
// "no detector catches everything": it turns detector completeness from a shrug
// into a MEASURED NUMBER.
//
// ⚠ THE CRITICAL INVERSION. Four of this repo's six real bug classes are
// DATA-SHAPE bugs, not logic bugs — a read of a file nothing writes, a filter on
// a field that does not exist, a lane with no reader, a meter weighting the wrong
// column. So this mutates the STATE FIRST and the CODE SECOND. A conventional
// mutation tester, pointed at the code alone, would have caught NONE of the four.
//
// ── (a) THE PANIC BUILD ─────────────────────────────────────────────────────
// 884 catch sites, 488 completely empty. In the SANDBOX ONLY, every swallowing
// catch is rewritten to `catch(e){ if(process.env.ARSENAL_PANIC) throw e; …}`,
// then every organ is run with ARSENAL_PANIC=1. Every organ that now DIES was
// swallowing a real error in production — silently, forever. This is five
// minutes of compute and it would have caught the 12 Aug dead wires on day one.
//
// ⚠ SANDBOX-GATED IN CODE, NOT IN PROSE. The rewritten source exists ONLY inside
// a mkdtemp sandbox built from `git ls-files`; the live tree is never touched,
// and `panicGuard` REFUSES to rewrite any path that is not under the sandbox
// root. organism_test additionally asserts no live scripts/*.mjs carries the
// marker, so this can never reach a schtasks run.
//
// ── (b) THE STATE-MUTANT INVARIANCE MATRIX ──────────────────────────────────
// The single highest-value thing in this file, and a genuinely decidable test
// for deadness: corrupt a field an organ CLAIMS to read; if its output does not
// change, the read is DEAD. Three cells are defects:
//   · a row of all-false for a file the organ opens → DEAD READ
//   · DELETE_FILE ⇒ no change AND no error          → silent feature loss
//   · a column no organ reacts to                   → orphan lane
//
// ── (c) CODE MUTATION ───────────────────────────────────────────────────────
// Operators mirror THIS repo's real bug taxonomy, not a generic set. And there
// is deliberately NO "mutation score" headline and NO equivalent-mutant
// adjudication — that is triage, and triage is precisely what the captain must
// not be handed. What survives instead is THE BUG MUSEUM: every real historical
// bug is a permanent mutant, and the suite asserts each is still CAUGHT.
//
// LAWS: never writes outside its sandbox · never runs an LLM (the collar denies
//   it and the ledger delta is asserted zero) · reports a MEASURED number and
//   never a claim.
// WHO ELSE COULD ACT ON THIS OUTPUT? audit.mjs (turns dead-read rows into
//   findings), organism_test (asserts the museum still catches all six).
// CLI: node scripts/mutagen.mjs [panic|state|museum|code|horizon|selftest] [--full]
// ============================================================================
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, copyFileSync, mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "acorn";
import { buildSandbox, runIn, assertArmed, destroy, ledgerFingerprint, moneyOracle, readJsonl } from "./sandbox.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const NODE = process.execPath;

let pass = 0, fail = 0; const fails = [];
const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };

// ============================================================================
// (a) THE PANIC BUILD
// ============================================================================
const PANIC_MARK = "__ARSENAL_PANIC_REWRITE__";

// Is this catch clause a SWALLOW? Empty body, or a body with no rethrow and no
// reporting of any kind. The 1-statement `try{JSON.parse(read())}catch{}` is the
// intended idiom in this repo, so panic mode still rewrites it — the point of
// panic mode is precisely to make the intended idiom loud FOR ONE RUN.
function isSwallow(src, handler) {
  if (!handler) return false;
  const body = src.slice(handler.body.start, handler.body.end);
  if (/\bthrow\b/.test(body)) return false;
  return !/console\.|process\.exit|report|assert|warn\(|error\(/.test(body);
}

export function panicRewrite(src) {
  let ast;
  try { ast = parse(src, { ecmaVersion: 2023, sourceType: "module", locations: true, allowHashBang: true }); }
  catch { return { src, count: 0 }; }
  const edits = [];
  const walk = (n) => {
    if (!n || typeof n.type !== "string") return;
    if (n.type === "TryStatement" && n.handler && isSwallow(src, n.handler)) {
      const h = n.handler;
      if (h.param) {
        // insert the rethrow as the FIRST statement of the existing body
        edits.push({ at: h.body.start + 1, text: ` if(process.env.ARSENAL_PANIC) throw ${src.slice(h.param.start, h.param.end)}; /*${PANIC_MARK}*/` });
      } else {
        // `catch {}` has no binding — give it one, then rethrow
        edits.push({ at: h.body.start, text: `(__panicErr__) {  if(process.env.ARSENAL_PANIC) throw __panicErr__; /*${PANIC_MARK}*/`, replaceTo: h.body.start + 1 });
      }
    }
    for (const k of Object.keys(n)) {
      if (k === "loc" || k === "start" || k === "end" || k === "type") continue;
      const v = n[k];
      if (Array.isArray(v)) v.forEach((x) => x && typeof x.type === "string" && walk(x));
      else if (v && typeof v.type === "string") walk(v);
    }
  };
  walk(ast);
  edits.sort((a, b) => b.at - a.at);
  let out = src;
  for (const e of edits) out = out.slice(0, e.at) + e.text + out.slice(e.replaceTo || e.at);
  return { src: out, count: edits.length };
}

// SANDBOX GATE, IN CODE. Not a comment, not a convention — a refusal.
function panicGuard(target, sandboxRoot) {
  const t = target.replace(/\\/g, "/").toLowerCase();
  const r = sandboxRoot.replace(/\\/g, "/").toLowerCase();
  if (!t.startsWith(r + "/")) throw new Error(`mutagen: REFUSING to panic-rewrite outside the sandbox → ${target}`);
  const live = ROOT.replace(/\\/g, "/").toLowerCase();
  if (t.startsWith(live + "/")) throw new Error(`mutagen: REFUSING — ${target} is inside the LIVE tree`);
}

function panic(opts = {}) {
  const sb = buildSandbox({ trace: false });
  try {
    assertArmed(sb);
    const dir = join(sb.root, "scripts");
    const files = readdirSync(dir).filter((f) => f.endsWith(".mjs"));
    let rewritten = 0, sites = 0;
    for (const f of files) {
      const p = join(dir, f);
      panicGuard(p, sb.root);
      const src = readFileSync(p, "utf8");
      const r = panicRewrite(src);
      if (r.count) { writeFileSync(p, r.src); rewritten++; sites += r.count; }
    }
    console.log(`=== THE PANIC BUILD ===`);
    console.log(`rewrote ${sites} swallowing catch sites across ${rewritten}/${files.length} organs (SANDBOX ONLY)\n`);

    // Every organ that has a selftest gets run twice: once normally (the control)
    // and once with ARSENAL_PANIC=1. An organ that is green normally and DIES
    // under panic was swallowing a real error in production.
    // ⚠ WHICH LANE PANIC IS RUN ON DECIDES WHETHER IT IS USEFUL — measured, and
    // the first version of this was wrong. Running panic on `selftest` alone
    // produced ~25 deaths, and most were NOT defects: a selftest that deliberately
    // feeds `"not json at all"` to prove the swallow degrades honestly WILL die
    // when the swallow is armed. That is the fixture doing its job, reported as a
    // bug. The real question is whether the PRODUCTION path swallows, so both
    // lanes are run and reported separately:
    //   · PRODUCTION (the organ's own cheap read-only verb, against real state)
    //     → a death here is a swallowed error on the lane he actually runs.
    //   · FIXTURE (selftest) → informational; a death is usually the test working.
    const ir = JSON.parse(readFileSync(join(ROOT, "dressing-room", "state", "xray_graph.json"), "utf8"));
    const results = [];
    const READ_ONLY = ["report", "status", "state", "brief", "list", "due", "plan", "show"];
    const primary = (f) => {
      const o = ir.organs[f];
      const built = new Set([...(o?.verbs || []), ...(o?.header_verbs || [])]);
      return READ_ONLY.find((v) => built.has(v)) || null;
    };
    const targets = files.filter((f) => /['"`]selftest['"`]|function selftest\(/.test(readFileSync(join(dir, f), "utf8")));
    for (const f of targets) {
      for (const lane of ["production", "fixture"]) {
        const verb = lane === "fixture" ? "selftest" : primary(f);
        if (!verb) continue;
        const args = [join(dir, f), verb];
        const base = runIn(sb, args, { label: f, timeout: 90000 });
        const pan = runIn(sb, args, { label: f, timeout: 90000, env: { ARSENAL_PANIC: "1" } });
        const row = { organ: f, lane, verb, base: base.code, panic: pan.code, swallowed: base.code === 0 && pan.code !== 0 };
        if (row.swallowed) {
          const m = /(?:Error|TypeError|SyntaxError|ENOENT|EPERM)[^\n]{0,180}/.exec(pan.out);
          row.first_error = m ? m[0].trim() : (pan.out.split("\n").filter(Boolean).slice(-1)[0] || "").slice(0, 180);
        }
        results.push(row);
        process.stdout.write(row.swallowed ? (lane === "production" ? "!" : "?") : (base.code === 0 ? "." : "x"));
      }
    }
    console.log("\n");
    const prod = results.filter((r) => r.lane === "production");
    const fix = results.filter((r) => r.lane === "fixture");
    const swallowing = prod.filter((r) => r.swallowed);
    const fixtureDeaths = fix.filter((r) => r.swallowed);
    // ── THE THREE-WAY CLASSIFICATION ──────────────────────────────────────
    // A production-lane ENOENT is NOT automatically a defect, and saying so
    // would hand the captain 14 findings of which most are correct design.
    // The IR decides it, mechanically:
    //   SELF-HEALING  the organ itself WRITES that file → first-run
    //                 initialisation. A swallow here is right.
    //   CROSS-ORGAN   ANOTHER organ writes it → a real dependency failing
    //                 silently. This is the rejirah_state.json shape, the one
    //                 that cost four un-surfaced Re-Jirah rounds.
    //   NO WRITER     nobody in the repo writes it → the strongest form: the
    //                 feature can never fire, and never says so.
    for (const r of swallowing) {
      const m = /(?:open|scandir|stat|unlink)\s+'([^']+)'/.exec(r.first_error || "");
      const p = m ? m[1].replace(/\\/g, "/") : null;
      const rel = p ? `dressing-room/state/${p.split("/dressing-room/state/")[1] || ""}` : null;
      const entry = rel ? ir.files.find((f) => f.path === rel) : null;
      r.missing = rel;
      r.klass = !entry ? "UNKNOWN"
        : entry.writers.includes(r.organ) ? "SELF-HEALING"
          : entry.writers.length ? "CROSS-ORGAN"
            : "NO WRITER";
      r.written_by = entry ? entry.writers : [];
    }
    const rank = { "NO WRITER": 0, "CROSS-ORGAN": 1, UNKNOWN: 2, "SELF-HEALING": 3 };
    swallowing.sort((a, b) => rank[a.klass] - rank[b.klass]);
    console.log(`PRODUCTION lane — green normally, DIES under panic: ${swallowing.length} of ${prod.length} run`);
    console.log(`   classified against the IR, because a missing file the organ writes ITSELF is`);
    console.log(`   correct first-run behaviour, not a defect:\n`);
    for (const k of ["NO WRITER", "CROSS-ORGAN", "UNKNOWN", "SELF-HEALING"]) {
      const g = swallowing.filter((r) => r.klass === k);
      if (!g.length) continue;
      console.log(`  ── ${k} (${g.length})`);
      for (const r of g) console.log(`     ${r.organ} ${r.verb}  →  ${r.missing || "(path not parsed)"}${r.written_by.length ? `  [written by ${r.written_by.join(", ")}]` : ""}`);
    }
    console.log("");
    console.log(`\nFIXTURE lane (selftest) — dies under panic: ${fixtureDeaths.length} of ${fix.length}`);
    console.log(`   ↑ mostly NOT defects: a selftest that feeds deliberate garbage to prove a`);
    console.log(`     swallow degrades honestly is SUPPOSED to die once the swallow is armed.`);
    console.log(`     Listed for the record, not as findings:`);
    for (const r of fixtureDeaths) console.log(`  ${r.organ}  ${(r.first_error || "").slice(0, 110)}`);
    return { results, swallowing, fixtureDeaths, sites, rewritten };
  } finally { destroy(sb); }
}

// ============================================================================
// (b) THE STATE-MUTANT INVARIANCE MATRIX
// ============================================================================
// SCOPING, and it is deliberate. The full 150×10×N matrix is an order of
// magnitude slower than it looks on Windows (~200ms of pure spawn overhead per
// cell, and these organs are not 200ms organs). So: the full operator set runs
// against the DECLARED LIFECYCLE FILES below; `--full` widens it. A bounded
// sweep that says what it skipped beats an unbounded one that never finishes —
// and the skip is LOGGED, never silent, because a silent cap reads as coverage.
const LIFECYCLE = [
  "captains_call.json",
  "teaching_contract.json",
  "fsrs_store.json",
  "learning_state.json",
  "brain_config.json",
  "weaknesses.json",
  "readiness.json",
  "missions.json",
];

const OPERATORS = {
  DELETE_FILE: (txt) => null,
  EMPTY_FILE: () => "",
  CORRUPT_JSON: (txt) => (txt.length > 8 ? txt.slice(0, Math.floor(txt.length / 2)) + "\u0000" + txt.slice(Math.floor(txt.length / 2) + 1) : "{"),
  RENAME_KEY: (txt) => mutJson(txt, (o) => { const k = firstKey(o); if (k) { o[`${k}__renamed`] = o[k]; delete o[k]; } }),
  NULL_VALUE: (txt) => mutJson(txt, (o) => { const k = firstKey(o); if (k) o[k] = null; }),
  FLIP_BOOL: (txt) => mutJson(txt, (o) => { for (const k of Object.keys(o)) if (typeof o[k] === "boolean") { o[k] = !o[k]; return; } }),
  TYPE_SWAP: (txt) => mutJson(txt, (o) => { const k = firstKey(o); if (k) o[k] = typeof o[k] === "string" ? 12345 : "STRING"; }),
  SHIFT_TIMESTAMP: (txt) => txt.replace(/"(20\d\d)-(\d\d)-(\d\d)/g, (m, y, mo, d) => `"${y}-${mo}-${String(Math.max(1, (+d + 1) % 28)).padStart(2, "0")}`),
  DUP_ROW: (txt) => (txt.includes("\n") ? txt.split("\n").filter(Boolean).flatMap((l) => [l, l]).join("\n") + "\n" : txt),
  TRUNCATE_TAIL: (txt) => (txt.includes("\n") ? txt.split("\n").filter(Boolean).slice(0, -1).join("\n") + "\n" : txt.slice(0, Math.max(1, txt.length - 20))),
};
const firstKey = (o) => (o && typeof o === "object" && !Array.isArray(o) ? Object.keys(o)[0] : null);
function mutJson(txt, fn) {
  try { const o = JSON.parse(txt); fn(o); return JSON.stringify(o, null, 1); }
  catch { return txt; }   // jsonl / non-JSON: this operator simply does not apply
}

// The organ's cheapest honest "say what you know" verb.
const primaryVerb = (organ, ir) => {
  const o = ir.organs[organ];
  const built = new Set([...(o?.verbs || []), ...(o?.header_verbs || [])]);
  for (const v of ["report", "status", "state", "brief", "list", "due", "plan", "show"]) if (built.has(v)) return v;
  return null;
};

function stateMatrix(opts = {}) {
  const ir = JSON.parse(readFileSync(join(ROOT, "dressing-room", "state", "xray_graph.json"), "utf8"));
  const sb = buildSandbox({ trace: false });
  const rows = [];
  const skipped = [];
  try {
    assertArmed(sb);
    const stateDir = join(sb.root, "dressing-room", "state");
    const files = opts.full
      ? ir.files.filter((f) => /^dressing-room\/state\/[^/]+\.(json|jsonl)$/.test(f.path) && f.readers.length).map((f) => basename(f.path))
      : LIFECYCLE;
    const ops = Object.keys(OPERATORS);
    console.log(`=== STATE-MUTANT INVARIANCE MATRIX ===`);
    console.log(`${files.length} file(s) × ${ops.length} operator(s); readers taken from the IR\n`);

    for (const fname of files) {
      const entry = ir.files.find((f) => f.path.endsWith(`/state/${fname}`));
      if (!entry) { skipped.push(`${fname}: not in the IR`); continue; }
      const target = join(stateDir, fname);
      if (!existsSync(target)) { skipped.push(`${fname}: not on disk in a git-ls-files checkout (gitignored — the CI world)`); continue; }
      const original = readFileSync(target, "utf8");
      const readers = entry.readers.filter((r) => primaryVerb(r, ir)).slice(0, opts.full ? 99 : 3);
      if (!readers.length) { skipped.push(`${fname}: ${entry.readers.length} reader(s), none with a cheap read-only verb`); continue; }
      if (entry.readers.length > readers.length) skipped.push(`${fname}: ${entry.readers.length - readers.length} further reader(s) not exercised (cap)`);

      for (const organ of readers) {
        const verb = primaryVerb(organ, ir);
        const args = [join(sb.root, "scripts", organ), verb];
        const base = runIn(sb, args, { label: organ, timeout: 60000 });
        const row = { file: fname, organ, verb, base_code: base.code, cells: {} };
        for (const op of ops) {
          const mutated = OPERATORS[op](original);
          if (mutated === original) { row.cells[op] = "n/a"; continue; }
          if (mutated === null) unlinkSync(target); else writeFileSync(target, mutated);
          const r = runIn(sb, args, { label: organ, timeout: 60000 });
          writeFileSync(target, original);
          const changed = r.out !== base.out || r.code !== base.code;
          row.cells[op] = changed ? (r.code !== base.code ? "ERR" : "chg") : "SAME";
        }
        rows.push(row);
        const cells = Object.values(row.cells);
        const live = cells.filter((c) => c !== "n/a");
        const noticed = live.filter((c) => c !== "SAME").length;
        console.log(`  ${noticed === 0 ? "DEAD" : "    "} ${organ} ${verb} ← ${fname}   noticed ${noticed}/${live.length}   ${live.length ? Object.entries(row.cells).filter(([, v]) => v === "SAME").map(([k]) => k).join(",") : ""}`);
      }
    }
  } finally { destroy(sb); }

  // THE THREE DEFECT CELLS
  const deadReads = rows.filter((r) => Object.values(r.cells).filter((c) => c !== "n/a").every((c) => c === "SAME"));
  const silentDelete = rows.filter((r) => r.cells.DELETE_FILE === "SAME");
  console.log(`\n── DEAD READS — the organ opens the file and its output NEVER changes (${deadReads.length})`);
  for (const r of deadReads) console.log(`   ${r.organ} ${r.verb} ← ${r.file}`);
  console.log(`── SILENT FEATURE LOSS — the file is DELETED and nothing changes, no error (${silentDelete.length})`);
  for (const r of silentDelete) console.log(`   ${r.organ} ${r.verb} ← ${r.file}`);
  if (skipped.length) {
    // NO SILENT CAPS. A bounded sweep that hides its bound reads as full coverage.
    console.log(`\n── NOT MEASURED (${skipped.length}) — stated, never silent`);
    for (const s of skipped) console.log(`   ${s}`);
  }
  return { rows, deadReads, silentDelete, skipped };
}

// ============================================================================
// (c) CODE MUTATION — operators from THIS repo's taxonomy
// ============================================================================
const CODE_OPS = {
  // a wrong field name inside a try/catch — the single most common real bug here
  FIELD_RENAME: (s) => s.replace(/\.(dealt|staged_at|reJirahDone|auto_hits|readers|writers)\b/, ".$1_X"),
  // a read of a file nothing writes
  PATH_LIT: (s) => s.replace(/"([a-z_]+)\.json"/, '"$1_state.json"'),
  COND_FLIP: (s) => s.replace(/([^!=<>])===/, "$1!=="),
  SLICE_OB1: (s) => s.replace(/\.slice\((\d+)\)/, (m, n) => `.slice(${+n + 1})`),
  CATCH_RETHROW: (s) => s.replace(/catch\s*\{\s*\}/, "catch { throw new Error('mutant'); }"),
  CONST_SCALE: (s) => s.replace(/\b(0\.1|1\.25|180000|120000)\b/, (m) => String(Number(m) * 10)),
  // STMT_DEL — delete one whole statement. The most brutal operator and the one
  // that most directly asks "is this line load-bearing at all". Targets a
  // top-level `x(...)` call statement so the deletion is syntactically safe far
  // more often than a random line cut would be.
  STMT_DEL: (s) => s.replace(/^(\s+)([A-Za-z_$][\w$.]*\([^\n;]*\);)\s*$/m, "$1/* STMT_DEL */"),
};

// ── COVERAGE-GUIDED SELECTION ────────────────────────────────────────────────
// NODE_V8_COVERAGE is used ONLY TO SELECT which files are worth mutating, and its
// number is NEVER reported. A coverage percentage is a metric people optimise
// instead of the thing it proxies; what it is genuinely good at is answering
// "did this file execute at all", which is exactly the question that decides
// whether a mutant can teach anything. Mutating a file no test ever loads
// produces a guaranteed survivor and zero information.
export function coveredFiles(sb) {
  const covDir = join(sb.root, ".audit", "cov");
  try { mkdirSync(covDir, { recursive: true }); } catch { /* ignore */ }
  const probe = join(sb.root, "scripts", "organism_test.mjs");
  if (!existsSync(probe)) return null;
  runIn(sb, [probe, "coverage"], { label: "cov", timeout: 300000, env: { NODE_V8_COVERAGE: covDir } });
  if (!existsSync(covDir)) return null;
  const hit = new Set();
  for (const f of readdirSync(covDir)) {
    let j;
    try { j = JSON.parse(readFileSync(join(covDir, f), "utf8")); } catch { continue; }
    for (const s of j.result || []) {
      const m = /scripts[\\/]([A-Za-z0-9_\-]+\.mjs)$/.exec(String(s.url || "").replace(/[?#].*$/, ""));
      if (m) hit.add(m[1]);
    }
  }
  return hit.size ? hit : null;
}

// THE RUNNER. Each mutant is VALIDITY-GATED with `node --check` (a mutant that
// does not parse tests nothing), then the organ's own selftest decides SURVIVED
// vs KILLED.
//
// ⚠ NO "MUTATION SCORE" IS PRINTED, AND THAT IS DELIBERATE. A score invites
// equivalent-mutant adjudication, and adjudication is triage — the one thing the
// captain must never be handed. What is printed is the SURVIVOR LIST: the exact
// edits nobody noticed. A survivor is a question about coverage, not a defect,
// and it is stated as such.
export function codeMutants(opts = {}) {
  const sb = buildSandbox({ trace: false });
  const rows = [];
  try {
    assertArmed(sb);
    const dir = join(sb.root, "scripts");
    const ir = JSON.parse(readFileSync(join(ROOT, "dressing-room", "state", "xray_graph.json"), "utf8"));
    // Target the organs the LEARNING LOOP actually rides on, unless --full.
    const targets = opts.full
      ? readdirSync(dir).filter((f) => f.endsWith(".mjs"))
      : ["captains_call.mjs", "rejirah.mjs", "fsrs.mjs", "forge_session.mjs", "learnstate.mjs", "teaching_contract.mjs", "harvest.mjs", "scoreboard.mjs"];
    // COVERAGE SELECTS, IT NEVER SCORES. A file no test ever loads yields a
    // guaranteed survivor and zero information, so it is dropped from the run and
    // the drop is STATED. The percentage itself is never computed or printed.
    const covered = coveredFiles(sb);
    const dropped = covered ? targets.filter((f) => !covered.has(f)) : [];
    const live = covered ? targets.filter((f) => covered.has(f)) : targets;
    if (dropped.length) console.log(`  (skipping ${dropped.length} file(s) no test loads at all — a mutant there teaches nothing: ${dropped.join(", ")})`);
    console.log("=== CODE MUTANTS — operators drawn from THIS repo's real bug taxonomy ===\n");
    for (const f of live) {
      const p = join(dir, f);
      if (!existsSync(p)) continue;
      const original = readFileSync(p, "utf8");
      for (const [op, fn] of Object.entries(CODE_OPS)) {
        const mutated = fn(original);
        if (mutated === original) { rows.push({ organ: f, op, verdict: "n/a" }); continue; }
        writeFileSync(p, mutated);
        const parses = runIn(sb, ["--check", p], { label: "check", timeout: 30000 }).code === 0;
        if (!parses) { writeFileSync(p, original); rows.push({ organ: f, op, verdict: "invalid" }); continue; }
        const r = runIn(sb, [p, "selftest"], { label: f, timeout: 90000 });
        writeFileSync(p, original);
        rows.push({ organ: f, op, verdict: r.code === 0 ? "SURVIVED" : "killed" });
        process.stdout.write(r.code === 0 ? "!" : ".");
      }
    }
    console.log("\n");
  } finally { destroy(sb); }
  const survived = rows.filter((r) => r.verdict === "SURVIVED");
  const killed = rows.filter((r) => r.verdict === "killed");
  console.log(`killed ${killed.length} · SURVIVED ${survived.length} · invalid ${rows.filter((r) => r.verdict === "invalid").length} · n/a ${rows.filter((r) => r.verdict === "n/a").length}\n`);
  console.log(`── SURVIVORS — edits nobody noticed. A survivor is a QUESTION about coverage,`);
  console.log(`   not a defect, and some are genuinely equivalent. Stated, never adjudicated.`);
  const byOp = new Map();
  for (const s of survived) { if (!byOp.has(s.op)) byOp.set(s.op, []); byOp.get(s.op).push(s.organ); }
  for (const [op, organs] of [...byOp].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`   ${op.padEnd(16)} ×${String(organs.length).padStart(2)}   ${organs.join(", ")}`);
  }
  return { rows, survived, killed };
}

// ============================================================================
// §7(c) LONG-HORIZON STATE — the class no fixture from TODAY'S tree can reach
// ============================================================================
// Some bugs only exist at a scale or an age the current tree has never had: past
// a ledger rotation boundary, at 400 cards instead of 42, after a 30-day EWMA has
// actually converged. Every other organ in this audit measures the repo AS IT IS,
// and is blind to all of it BY CONSTRUCTION.
//
// So the sandbox is aged and scaled deliberately, and each organ is asked the
// only question that matters: does it still ANSWER, and does its answer still
// mean something? Three failure shapes, all real risks here:
//   · it CRASHES at scale                   (a cap or an index assumption)
//   · it TIMES OUT                          (an O(n²) that is invisible at n=42)
//   · it produces an IDENTICAL answer       (a cap silently truncating, so more
//     data stops changing anything — the quietest of the three)
const HORIZONS = [
  { id: "cards-x10", file: "captains_call.json", why: "42 cards → ~420; the deal rotation sorts and slices on every call" },
  { id: "ledger-x20", file: "brain_ledger.jsonl", why: "past a rotation boundary; the meter reads the whole file" },
  { id: "reps-x20", file: "reps_log.jsonl", why: "a year of reps instead of a month" },
  { id: "aged-90d", file: "*", why: "every timestamp pushed back 90 days — EWMAs converged, everything overdue" },
];

function scaleJson(txt, factor) {
  try {
    const j = JSON.parse(txt);
    for (const k of Object.keys(j)) {
      if (Array.isArray(j[k]) && j[k].length) {
        const base = j[k];
        const out = [];
        for (let i = 0; i < factor; i++) for (const row of base) out.push(typeof row === "object" && row ? { ...row, id: `${row.id || "r"}__h${i}` } : row);
        j[k] = out;
      }
    }
    return JSON.stringify(j, null, 1);
  } catch { return txt; }
}
const scaleJsonl = (txt, factor) => {
  const lines = txt.split("\n").filter((l) => l.trim());
  if (!lines.length) return txt;
  const out = [];
  for (let i = 0; i < factor; i++) out.push(...lines);
  return out.join("\n") + "\n";
};
// Push every ISO timestamp back N days, in place, across the whole state tree.
const ageText = (txt, days) => txt.replace(/"(\d{4})-(\d{2})-(\d{2})T/g, (m, y, mo, d) => {
  const t = new Date(Date.UTC(+y, +mo - 1, +d) - days * 86400000);
  return `"${t.toISOString().slice(0, 10)}T`;
});

export function horizon(opts = {}) {
  const ir = JSON.parse(readFileSync(join(ROOT, "dressing-room", "state", "xray_graph.json"), "utf8"));
  const READ_ONLY = ["report", "status", "state", "brief", "list", "due", "plan", "show"];
  const primary = (f) => {
    const o = ir.organs[f];
    const built = new Set([...(o?.verbs || []), ...(o?.header_verbs || [])]);
    return READ_ONLY.find((v) => built.has(v)) || null;
  };
  console.log("=== §7(c) LONG-HORIZON — the organism at a scale and age it has never had ===\n");
  const rows = [];
  for (const h of HORIZONS) {
    const sb = buildSandbox({ trace: false });
    try {
      assertArmed(sb);
      const stateDir = join(sb.root, "dressing-room", "state");
      // WHICH ORGANS TO ASK: the readers of the file being stretched, from the IR.
      let organs = [];
      if (h.file === "*") {
        for (const f of readdirSync(stateDir)) {
          if (!/\.(json|jsonl)$/.test(f)) continue;
          const p = join(stateDir, f);
          try { writeFileSync(p, ageText(readFileSync(p, "utf8"), 90)); } catch { /* skip binaries */ }
        }
        organs = [...new Set(ir.files.filter((x) => /state\/[^/]+\.json/.test(x.path)).flatMap((x) => x.readers))];
      } else {
        const entry = ir.files.find((x) => x.path.endsWith(`/state/${h.file}`));
        const target = join(stateDir, h.file);
        if (!entry || !existsSync(target)) { console.log(`  ..   ${h.id.padEnd(12)} NOT MEASURED — ${h.file} is absent in a git-ls-files checkout (gitignored: the CI world)`); destroy(sb); continue; }
        const factor = /x(\d+)/.exec(h.id) ? +/x(\d+)/.exec(h.id)[1] : 10;
        const txt = readFileSync(target, "utf8");
        writeFileSync(target, h.file.endsWith(".jsonl") ? scaleJsonl(txt, factor) : scaleJson(txt, factor));
        organs = entry.readers;
      }
      organs = organs.filter((o) => primary(o)).slice(0, opts.full ? 99 : 6);
      for (const organ of organs) {
        const verb = primary(organ);
        const args = [join(sb.root, "scripts", organ), verb];
        const t0 = Date.now();
        const r = runIn(sb, args, { label: organ, timeout: 60000 });
        const ms = Date.now() - t0;
        const verdict = r.timedOut ? "TIMEOUT" : r.code !== 0 ? "CRASH" : "ok";
        rows.push({ horizon: h.id, organ, verb, verdict, ms });
        if (verdict !== "ok") console.log(`  ${verdict.padEnd(8)} ${h.id.padEnd(12)} ${organ} ${verb}  (${ms}ms)  — ${h.why}`);
      }
    } finally { destroy(sb); }
  }
  const bad = rows.filter((r) => r.verdict !== "ok");
  const slow = rows.filter((r) => r.verdict === "ok" && r.ms > 20000);
  console.log(`\n  ${rows.length} organ-runs at horizon · ${bad.length} CRASH/TIMEOUT · ${slow.length} slower than 20s`);
  if (!bad.length && !slow.length) console.log(`  Nothing broke at 10-20× scale or 90 days of age. That is a MEASUREMENT, not an assumption —`);
  console.log(`  and it is the only lens in this audit that can see past today's tree.`);
  return { rows, bad, slow };
}

// ============================================================================
// THE BUG MUSEUM — the single measurement that proves any of this works
// ============================================================================
// §10's question, and the only honest answer to "does your detector catch
// everything": re-introduce each REAL historical bug into the sandbox, one at a
// time, and show the system catches it. A measured 5-of-6 is worth infinitely
// more than an unmeasured claim of "complete", so the count is printed either
// way and a MISS is never hidden.
//
// This is deliberately NOT a "mutation score". No equivalent-mutant adjudication
// happens here, because adjudication is triage and triage is exactly what the
// captain must never be handed. Each exhibit is a specific bug that really shipped.
const MUSEUM = [
  {
    id: "B1-dead-read",
    story: "a read of `rejirah_state.json` — a file NOTHING writes — inside a try/catch, so it failed silently forever and the four overdue Re-Jirah rounds were never surfaced",
    detector: "xray Q1 (dead read)",
    apply(sb) {
      // APPENDED at module scope using the organ's OWN already-resolved constants,
      // so the path is Const to the points-to analysis. The first version injected
      // BEFORE STATE_DIR was defined, leaving the path Unknown — and xray never
      // reports on Unknown, by design. The MUTANT was broken, not the detector.
      const p = join(sb.root, "scripts", "learnstate.mjs");
      const src0 = readFileSync(p, "utf8");
      writeFileSync(p, src0 + `\ntry { readFileSync(join(__dirname, "..", "dressing-room", "state", "museum_never_written.json"), "utf8"); } catch {}\n`);
    },
    detect(sb) {
      const r = runIn(sb, [join(sb.root, "scripts", "xray.mjs"), "q"], { label: "xray", timeout: 300000 });
      try { return (JSON.parse(r.out).Q1 || []).some((f) => /museum_never_written/.test(f.path)); } catch { return false; }
    },
  },
  {
    id: "B2-wrong-field",
    story: "a filter on `x.status` where the rows actually carry staged_at/fired_at/ingested_at — it matched NOTHING, silently, for days, while M02–M04 sat un-returned",
    detector: "mutagen state-mutant matrix (the read stops being load-bearing)",
    apply(sb) {
      // ⚠ THE MUTANT MUST MATCH THE REPO'S ACTUAL IDIOM. The first version
      // hardcoded the parameter name `c`, and captains_call writes
      // `rows.filter((r) => r.ingested_at)` and `.filter((x) => …)` — so the
      // mutant NEVER APPLIED and the exhibit reported MISSED. The detector was
      // fine; the injection was a no-op. Any single identifier now matches, and
      // EVERY filter is poisoned so the read cannot survive through another path.
      const p = join(sb.root, "scripts", "captains_call.mjs");
      const s = readFileSync(p, "utf8");
      writeFileSync(p, s.replace(/\.filter\(\((\w+)\) =>/g, '.filter(($1) => $1.status === "open" &&'));
    },
    detect(sb) {
      const target = join(sb.root, "dressing-room", "state", "captains_call.json");
      // captains_call.json is gitignored, so a git-ls-files sandbox never has one
      // and this exhibit reported N/A — an untested exhibit in the very museum
      // built to stop untested claims. A MINIMAL FIXTURE is seeded instead, in the
      // sandbox only. Its shape is the one that matters: rows carrying `dealt`
      // and `filed_at` and NO `status` field, which is exactly the shape the real
      // bug filtered against.
      if (!existsSync(target)) {
        writeFileSync(target, JSON.stringify({
          cards: [
            { id: "m1", line: "museum fixture one", filed_at: "2026-08-01T00:00:00Z", dealt: [] },
            { id: "m2", line: "museum fixture two", filed_at: "2026-08-02T00:00:00Z", dealt: ["2026-08-02"] },
          ],
        }, null, 1));
      }
      const args = [join(sb.root, "scripts", "captains_call.mjs"), "status"];
      const base = runIn(sb, args, { label: "cc", timeout: 60000 });
      const orig = readFileSync(target, "utf8");
      const mutated = OPERATORS.RENAME_KEY(orig);
      writeFileSync(target, mutated);
      const after = runIn(sb, args, { label: "cc", timeout: 60000 });
      writeFileSync(target, orig);
      // the read is DEAD when corrupting the real data changes nothing
      return after.out === base.out;
    },
  },
  {
    id: "B3-half-built-lane",
    story: "27 cards correctly DEALT and 0 ever ANSWERABLE — the answering half was never built, and the lane looked perfectly healthy from outside",
    detector: "xray headerDrift (declared but not dispatched) + docBrokenEdges",
    apply(sb) {
      const p = join(sb.root, "scripts", "captains_call.mjs");
      const s = readFileSync(p, "utf8");
      // remove the `answer` verb from dispatch while every caller still invokes it
      writeFileSync(p, s.replace(/(["'`])answer\1/g, "$1answer__removed$1"));
    },
    detect(sb) {
      const r = runIn(sb, [join(sb.root, "scripts", "xray.mjs"), "verbs"], { label: "xray", timeout: 300000 });
      try {
        const v = JSON.parse(r.out);
        // The lane is DANGLING when something tells him to type a verb the organ
        // cannot take. Checked across BOTH edge sets — an organ/root caller, and a
        // DOC-CITED verb, which is how this bug actually reached him: the card
        // itself printed `captains_call.mjs answer <id>` for 27 cards and nothing
        // on the other end could receive the word.
        const edge = [...(v.brokenEdges || []), ...(v.docBrokenEdges || [])]
          .some((e) => e.callee === "captains_call.mjs" && /^answer/.test(e.verb));
        // HEADER DRIFT is the detector that actually fits this bug, and finding
        // that out was worth the two failed attempts. BROKEN EDGE cannot see it
        // BY DESIGN: its denominator is deliberately generous (built ∪ header ∪
        // exports) so that a gap in the parser never manufactures a bug — and
        // captains_call's own header still advertises `answer`. So the organ
        // "has" the verb as far as that query is concerned. The shape of this bug
        // is precisely DECLARED-BUT-NOT-DISPATCHED, which is what headerDrift
        // measures: the organ's own usage line promising something main() cannot
        // take. Two queries, two different questions; only one of them is this one.
        const drift = (v.headerDrift || []).some((d) => d.organ === "captains_call.mjs" && d.not_dispatched.some((x) => /^answer/.test(x)));
        return edge || drift;
      } catch { return false; }
    },
  },
  {
    id: "B4-stale-canon",
    story: "canon asserting a defect that had been FIXED the same day it was written — and the automated .md sweep that caused it",
    detector: "audit docs checker (doc-dead-path)",
    apply(sb) {
      const p = join(sb.root, "OPS_STATE.md");
      const s = readFileSync(p, "utf8");
      writeFileSync(p, s + "\n\nMUSEUM: see dressing-room/state/museum_absent_claim.json for the fix.\n");
    },
    detect(sb) {
      const r = runIn(sb, [join(sb.root, "scripts", "audit.mjs"), "docs"], { label: "audit", timeout: 120000 });
      try { return (JSON.parse(r.out).deadPaths || []).some((d) => /museum_absent_claim/.test(d.path)); } catch { return false; }
    },
  },
  {
    id: "B5-meter-lie",
    story: "a budget governor metering cheap cache-reads at FULL price and self-tuning from a corrupt observation — it starved live organs for weeks",
    detector: "treasury meter self-consistency",
    apply(sb) {
      const p = join(sb.root, "dressing-room", "state", "brain_ledger.jsonl");
      const row = { ts: new Date("2026-01-01").toISOString(), job: "museum_lie", input_tokens: 500000, output_tokens: 1000, cache_creation_tokens: 0, cache_read_tokens: 0, total_tokens: 501 };
      writeFileSync(p, (existsSync(p) ? readFileSync(p, "utf8") : "") + JSON.stringify(row) + "\n");
    },
    detect(sb) {
      const r = runIn(sb, [join(sb.root, "scripts", "treasury.mjs"), "meter"], { label: "treasury", timeout: 120000 });
      try { return JSON.parse(r.out).some((b) => b.job === "museum_lie" && b.kind === "UNDER-COUNT"); } catch { return false; }
    },
  },
  // ── THE F-FLOOR (12 Aug 2026, ULTRACODE). The brief named ten historical bug
  // classes as the museum's FLOOR (F1–F10); the six exhibits above cover
  // F1/F2/F3/F5/F6 plus one beyond the floor (stale canon). These five close
  // the rest. Same protocol: control-first, one fresh sandbox each, a MISS is
  // printed and never hidden.
  {
    id: "F4-lane-never-fires",
    story: "diary — enabled, priority 10, scheduled nightly, THREE wired readers — had NEVER produced a page, and the only detector rode at INFO where nothing escalates",
    detector: "reconcile.mjs (produce-and-consume) — never-produced is its loudest class",
    apply(sb) {
      const p = join(sb.root, "dressing-room", "state", "brain_config.json");
      const cfg = JSON.parse(readFileSync(p, "utf8"));
      // the minimal job shape reconcile walks: `out` declared, enabled, no artifact ever
      cfg.jobs.push({ id: "museum_lane", kind: "museum_lane", enabled: true, out: "museum_lane" });
      writeFileSync(p, JSON.stringify(cfg, null, 1));
    },
    detect(sb) {
      const r = runIn(sb, [join(sb.root, "scripts", "reconcile.mjs"), "json"], { label: "reconcile", timeout: 120000 });
      try {
        const lane = (JSON.parse(r.out).lanes || []).find((l) => l.job === "museum_lane");
        return !!lane && (lane.bleeds || []).some((b) => /never produced/.test(b));
      } catch { return false; }
    },
  },
  {
    id: "F7-queue-mu-zero",
    story: "42 cards arrived at ~6/day into a deck whose service rate was ZERO — Little's law says that queue diverges by arithmetic, and nothing in the organism did the arithmetic",
    detector: "pulse.mjs queue law (λ>0 with μ=0 over a rolling week = diverging)",
    apply(sb) {
      const now = Date.now();
      const iso = (hAgo) => new Date(now - hAgo * 3600 * 1000).toISOString();
      const cards = Array.from({ length: 12 }, (_, i) => ({ id: `q${i}`, line: `museum queue card ${i}`, filed_at: iso(12 + i * 12), dealt: [] }));
      writeFileSync(join(sb.root, "dressing-room", "state", "captains_call.json"), JSON.stringify({ cards }, null, 1));
      // measurability seed: pulse needs live-machine evidence; the collar denies its
      // PowerShell schedule read in here, so the watchman artifact is the witness
      writeFileSync(join(sb.root, "dressing-room", "state", "watchman_last.json"), JSON.stringify({ at: iso(2), findings: [] }));
    },
    detect(sb) {
      const r = runIn(sb, [join(sb.root, "scripts", "pulse.mjs"), "json", "--no-reconcile"], { label: "pulse", timeout: 120000 });
      try { return (JSON.parse(r.out).violations || []).some((v) => v.class === "queue-diverging"); } catch { return false; }
    },
  },
  {
    id: "F8-healthy-while-empty",
    story: "Tier-2 stamped 5 STARTs and zero exits, zero journal rows — an organ's own ledger said 'running fine' while it produced NOTHING, and only a human diff noticed",
    detector: "reconcile.mjs — the artifact-based observer that disbelieves self-reports (Byzantine: no organ vouches for itself)",
    apply(sb) {
      // the SELF-REPORT: a fresh ledger row claiming the job ran clean today…
      const led = join(sb.root, "dressing-room", "state", "brain_ledger.jsonl");
      const row = { ts: new Date().toISOString(), job: "museum_claim", ok: true, error: null, input_tokens: 10, output_tokens: 10, cache_creation_tokens: 0, cache_read_tokens: 0, total_tokens: 20 };
      writeFileSync(led, (existsSync(led) ? readFileSync(led, "utf8") : "") + JSON.stringify(row) + "\n");
      // …and the LANE: declared, enabled, and no artifact anywhere on disk
      const p = join(sb.root, "dressing-room", "state", "brain_config.json");
      const cfg = JSON.parse(readFileSync(p, "utf8"));
      cfg.jobs.push({ id: "museum_claim", kind: "museum_claim", enabled: true, out: "museum_claim" });
      writeFileSync(p, JSON.stringify(cfg, null, 1));
    },
    detect(sb) {
      // BOTH halves must hold or the exhibit proves nothing: the self-report row
      // EXISTS and says ok — and the artifact observer still calls the lane dead.
      const led = join(sb.root, "dressing-room", "state", "brain_ledger.jsonl");
      const selfReport = existsSync(led) && readFileSync(led, "utf8").split("\n").some((l) => {
        try { const j = JSON.parse(l); return j.job === "museum_claim" && j.ok === true; } catch { return false; }
      });
      if (!selfReport) return false;
      const r = runIn(sb, [join(sb.root, "scripts", "reconcile.mjs"), "json"], { label: "reconcile", timeout: 120000 });
      try {
        const lane = (JSON.parse(r.out).lanes || []).find((l) => l.job === "museum_claim");
        return !!lane && (lane.bleeds || []).some((b) => /never produced/.test(b));
      } catch { return false; }
    },
  },
  {
    id: "F9-day-boundary",
    story: "five selftest assertions pinned to fixed IST instants — green on every IST machine, red on the UTC runner — kept the away-day lane dead for days while 'E1 CLOSED' was declared off a sandbox that inherits the house clock",
    detector: "the suite under a shifted clock (TZ=UTC) — the away-day runner IS this detector daily; here it runs in-sandbox",
    apply(sb) {
      // re-introduce the EXACT shipped bug (dfaebe7's pre-image): the boundary rep
      // pinned to a fixed instant that is next-day only in IST
      const p = join(sb.root, "scripts", "scoreboard.mjs");
      const s = readFileSync(p, "utf8");
      const mutated = s.replace(
        '{ ts: L(10, 1, 0), concept: "context", confidence: "shaky", correct: true }',
        '{ ts: "2026-08-09T19:30:00.000Z", concept: "context", confidence: "shaky", correct: true }');
      if (mutated === s) throw new Error("F9 mutant did not apply — the fixture line moved");
      writeFileSync(p, mutated);
    },
    detect(sb) {
      const r = runIn(sb, [join(sb.root, "scripts", "scoreboard.mjs"), "selftest"], { label: "scoreboard", timeout: 120000, env: { TZ: "UTC" } });
      return r.code !== 0;
    },
  },
  {
    id: "F10-two-writers",
    story: "identity_facts.pending.jsonl carried TWO live writers for a day — hippocampus rewrote the whole file while mcp-memory appended to it, and writeAtomic's rename made every lost update silent",
    detector: "xray Q2/Q5 (two writers on one lane / sole-writer header drift)",
    apply(sb) {
      // a second writer on doubtminer's lexicon.json, in learnstate's OWN idiom
      // (join(__dirname, ...) + its imported writeFileSync — the B1 lesson: use
      // already-resolved constants or the points-to analysis rightly says Unknown)
      const p = join(sb.root, "scripts", "learnstate.mjs");
      const src0 = readFileSync(p, "utf8");
      writeFileSync(p, src0 + `\nexport function __museumClobber() { writeFileSync(join(__dirname, "..", "dressing-room", "state", "lexicon.json"), "{}"); }\n`);
    },
    detect(sb) {
      const r = runIn(sb, [join(sb.root, "scripts", "xray.mjs"), "q"], { label: "xray", timeout: 300000 });
      try {
        const q = JSON.parse(r.out);
        const q2 = (q.Q2 || []).some((f) => /lexicon\.json/.test(f.path) && f.writers.some((w) => /learnstate/.test(w)));
        const q5 = (q.Q5 || []).some((f) => /lexicon\.json/.test(f.path) && (f.undeclared || []).some((w) => /learnstate/.test(w)));
        return q2 || q5;
      } catch { return false; }
    },
  },
  {
    id: "B6-green-at-home-red-on-ci",
    story: "assertions that passed at home and failed on CI, because they read GITIGNORED state that a clean checkout never has",
    detector: "the sandbox itself — it IS a git-ls-files checkout, so the gap cannot hide",
    apply(sb) {
      // The simplest honest form of this bug: an UNGUARDED read of GITIGNORED
      // state at module scope. The first version spliced an import and a helper
      // into the middle of the file and produced something that either did not
      // parse or never ran — again the mutant, not the detector.
      const p = join(sb.root, "scripts", "validators.mjs");
      const src0 = readFileSync(p, "utf8");
      writeFileSync(p, `import { readFileSync as __mR } from "node:fs";\n__mR(new URL("../dressing-room/state/capsules/tokenization.json", import.meta.url), "utf8");\n` + src0);
    },
    detect(sb) {
      const r = runIn(sb, [join(sb.root, "scripts", "validators.mjs"), "selftest"], { label: "validators", timeout: 60000 });
      return r.code !== 0;   // the CI world exposes it immediately
    },
  },
];

function museum() {
  console.log(`=== THE BUG MUSEUM — ${MUSEUM.length} real historical bugs, re-introduced one at a time ===\n`);
  const results = [];
  for (const ex of MUSEUM) {
    const sb = buildSandbox({ trace: false });
    let caught = null, note = "";
    try {
      assertArmed(sb);
      // CONTROL FIRST: the detector must be SILENT on the clean tree, or a "catch"
      // proves nothing at all. A detector that always fires is not a detector.
      const controlOk = ex.detect(sb);
      ex.apply(sb);
      caught = ex.detect(sb);
      if (controlOk === true && caught === true) { note = "DETECTOR ALWAYS FIRES — control was already positive, so this catch is meaningless"; caught = null; }
    } catch (e) { note = String(e.message).slice(0, 120); caught = null; }
    finally { destroy(sb); }
    results.push({ ...ex, caught, note });
    console.log(`  ${caught === true ? "CAUGHT " : caught === false ? "MISSED " : "N/A    "} ${ex.id.padEnd(28)} ${ex.detector}`);
    if (note) console.log(`          ${note}`);
  }
  const caughtN = results.filter((r) => r.caught === true).length;
  const missed = results.filter((r) => r.caught === false);
  const na = results.filter((r) => r.caught === null);
  console.log(`\n  ${caughtN} of ${MUSEUM.length} historical bugs CAUGHT${na.length ? ` · ${na.length} not testable here` : ""}`);
  if (missed.length) {
    console.log(`  MISSED — said out loud, not hidden, because an unmeasured claim of "complete" is worth nothing:`);
    for (const m of missed) console.log(`    · ${m.id}: ${m.story}`);
  }
  return { results, caughtN };
}

// ============================================================================
// SELFTEST
// ============================================================================
function selftest() {
  console.log("=== mutagen.mjs selftest ===\n");
  const before = ledgerFingerprint();

  // the rewriter is pure and is tested on fixtures with known answers
  const fx = `try { const a=1; JSON.parse(readFileSync(P)); } catch {}\n`;
  const r1 = panicRewrite(fx);
  assert("panic rewrite arms a bare `catch {}` (gives it a binding, then rethrows)", r1.count === 1 && /ARSENAL_PANIC/.test(r1.src) && /__panicErr__/.test(r1.src), r1.src);
  const fx2 = `try { risky(); } catch (e) { console.log(e); }\n`;
  assert("…and LEAVES a catch that already reports alone (it is not a swallow)", panicRewrite(fx2).count === 0);
  const fx3 = `try { risky(); } catch (e) { throw e; }\n`;
  assert("…and leaves a rethrow alone", panicRewrite(fx3).count === 0);
  const fx4 = `try { a(); } catch (err) { }\n`;
  const r4 = panicRewrite(fx4);
  assert("…and reuses the EXISTING binding name when there is one", /throw err;/.test(r4.src), r4.src);
  assert("the rewritten source still parses", (() => { try { parse(panicRewrite(fx).src, { ecmaVersion: 2023, sourceType: "module" }); return true; } catch { return false; } })());

  // THE GATE THAT MUST BE CODE, NOT PROSE
  let refused = false;
  try { panicGuard(join(ROOT, "scripts", "brain.mjs"), join(ROOT, "scripts")); } catch { refused = true; }
  assert("SANDBOX GATE — panicGuard REFUSES to rewrite a path inside the LIVE tree", refused);
  let refused2 = false;
  try { panicGuard("C:/somewhere/else/x.mjs", "C:/tmp/sandbox"); } catch { refused2 = true; }
  assert("…and refuses anything outside the sandbox root", refused2);

  // and the live tree must never carry the marker
  const live = readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs"));
  const marked = live.filter((f) => {
    const src = readFileSync(join(ROOT, "scripts", f), "utf8");
    // this file NAMES the marker (it defines it); everyone else carrying it is a leak
    return f !== "mutagen.mjs" && src.includes(PANIC_MARK);
  });
  assert("NO LIVE ORGAN carries the panic marker — it can never reach a schtasks run", marked.length === 0, marked.join(", "));

  // the operators must actually mutate
  const sample = JSON.stringify({ a: "x", b: true, when: "2026-08-12" }, null, 1);
  assert("RENAME_KEY changes the shape", OPERATORS.RENAME_KEY(sample) !== sample);
  assert("FLIP_BOOL changes the shape", OPERATORS.FLIP_BOOL(sample) !== sample);
  assert("SHIFT_TIMESTAMP changes the shape", OPERATORS.SHIFT_TIMESTAMP(sample) !== sample);
  assert("CORRUPT_JSON produces something that no longer parses",
    (() => { try { JSON.parse(OPERATORS.CORRUPT_JSON(sample)); return false; } catch { return true; } })());
  assert("a mutJson operator on a JSONL body is a NO-OP (n/a), never a silent corruption",
    OPERATORS.RENAME_KEY('{"a":1}\n{"a":2}\n') === '{"a":1}\n{"a":2}\n');

  // THE BUG MUSEUM must stay WIRED and WELL-FORMED. The full run takes minutes
  // and lives on the schedule (`mutagen museum`); what belongs in a selftest is
  // the structural guarantee that no exhibit has been quietly deleted — because
  // the cheapest way to make a museum report 6-of-6 is to remove the exhibits
  // that miss, and that is the exact dishonesty this whole file exists against.
  // §4.2(c) — the operator set must mirror THIS repo's taxonomy, all seven.
  assert("all SEVEN code operators from the repo's own bug taxonomy exist",
    ["FIELD_RENAME", "PATH_LIT", "COND_FLIP", "SLICE_OB1", "STMT_DEL", "CATCH_RETHROW", "CONST_SCALE"].every((k) => typeof CODE_OPS[k] === "function"),
    Object.keys(CODE_OPS).join(","));
  assert("STMT_DEL actually deletes a statement (the most brutal operator, and the one that asks if a line is load-bearing at all)",
    CODE_OPS.STMT_DEL("function f(){\n  doThing(1);\n}") !== "function f(){\n  doThing(1);\n}");
  // COVERAGE SELECTS, NEVER SCORES — asserted as an absence, because the danger
  // is that a percentage creeps in and becomes the thing people optimise.
  const selfSrc = readFileSync(fileURLToPath(import.meta.url), "utf8");
  // ⚠ ASSERT ON THE CODE, NOT ON THE PROSE. The first version regexed the whole
  // file for /percent/ and went RED on its OWN COMMENT explaining why a coverage
  // percentage must never be reported. A checker that cannot tell an explanation
  // from an implementation is the same confusion the doc-claim checker had.
  const codeOnly = selfSrc.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  assert("NODE_V8_COVERAGE is used to SELECT mutants, and no coverage NUMBER is ever printed",
    /NODE_V8_COVERAGE/.test(codeOnly) && !/console\.log\([^)]*cover[^)]*%/i.test(codeOnly));
  // §7(c) — the long-horizon lens must exist and must state what it could not reach.
  assert("§7(c) LONG-HORIZON exists — scaled AND aged fixtures, the only lens that sees past today's tree",
    HORIZONS.length >= 4 && HORIZONS.some((h) => /aged/.test(h.id)) && HORIZONS.some((h) => /x\d+/.test(h.id)));
  assert("…and every horizon carries WHY it is worth stretching", HORIZONS.every((h) => h.why && h.file));

  // 11, not 6, since the ULTRACODE F-floor pass (12 Aug 2026): F1–F10 covered
  // (B1=F1 · B2=F2 · B3=F3 · B5=F5 · B6=F6 · F4/F7/F8/F9/F10 explicit) plus
  // B4 stale-canon beyond the floor. The cheap way to fake a full catch is
  // deleting an exhibit — this guard exists so that fails loudly instead.
  assert("the Bug Museum still holds all ELEVEN historical bugs (the F1-F10 floor + stale-canon)", MUSEUM.length === 11, `${MUSEUM.length}`);
  assert("…and every exhibit has a story, a named detector, an apply and a detect",
    MUSEUM.every((m) => m.id && m.story && m.detector && typeof m.apply === "function" && typeof m.detect === "function"));
  assert("…and each exhibit's detector is NAMED, so a 'catch' can be traced to the organ that caught it",
    MUSEUM.every((m) => /xray|treasury|sandbox|mutagen|audit|reconcile|pulse|suite under a shifted clock/i.test(m.detector)));

  const after = ledgerFingerprint();
  const money = moneyOracle(before, after);
  assert("THE MONEY ORACLE — no ledger row is attributable to the audit, and zero billing spawns were allowed",
    money.ok, money.detail);

  console.log(`\nmutagen: ${pass} passed, ${fail} failed`);
  if (fail) for (const f of fails) console.log(`  · ${f.n}${f.d ? `\n      ${f.d}` : ""}`);
  process.exit(fail ? 1 : 0);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = (process.argv[2] || "selftest").toLowerCase();
  const full = process.argv.includes("--full");
  if (mode === "selftest") return selftest();
  if (mode === "panic") { panic({ full }); return; }
  if (mode === "state") { stateMatrix({ full }); return; }
  if (mode === "museum") { const r = museum(); process.exit(r.caughtN === 0 ? 1 : 0); }
  if (mode === "code") { codeMutants({ full }); return; }
  if (mode === "horizon") { horizon({ full }); return; }
  console.log("mutagen: panic | state | museum | code | horizon | selftest  [--full]");
  process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { panic, stateMatrix, museum, MUSEUM, CODE_OPS, OPERATORS, PANIC_MARK, panicGuard };
