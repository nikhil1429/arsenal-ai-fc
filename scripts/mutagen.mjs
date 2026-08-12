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
// CLI: node scripts/mutagen.mjs [panic|state|museum|code|selftest] [--full]
// ============================================================================
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, copyFileSync } from "node:fs";
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
};

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
  if (mode === "code") { console.log(Object.keys(CODE_OPS).join("\n")); return; }
  console.log("mutagen: panic | state | code | selftest  [--full]");
  process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { panic, stateMatrix, CODE_OPS, OPERATORS, PANIC_MARK, panicGuard };
