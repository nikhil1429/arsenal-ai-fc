#!/usr/bin/env node
// ============================================================================
// blackbox.mjs · ARSENAL AI FC — RUNTIME TRUTH (12 Aug 2026)
//   Writes NOTHING outside its own sandbox. Owns no state file.
// ----------------------------------------------------------------------------
// WHY A SECOND TRUTH. xray.mjs is sound only up to its own unresolved_sinks
// budget (4,677 of them). Static analysis cannot see a path built from a date, a
// config value, or a network response — and this organism builds paths that way
// constantly. So the static graph is checked against a RUNTIME one, and the
// interesting findings are precisely the DISAGREEMENTS:
//   · runtime edge NOT in the static graph → hidden coupling the IR cannot see
//   · static edge NEVER exercised          → dead code, or an untested lane
// Neither organ can find those alone. That is the whole argument for building
// both instead of trusting either.
//
// HOW. The same `--import` preload the sandbox already uses, in TRACE mode. It
// propagates through NODE_OPTIONS to every grandchild, so when heartbeat shells
// its chain of eight the whole tree instruments itself with no cooperation from
// the organs. Recorded per run: every path opened for read or write, every
// ENOENT, every spawn, exit code, wall clock.
//
// THE FINDING THIS ORGAN EXISTS FOR — SILENT SUCCESS. An organ that exits 0
// while touching nothing, or exits 0 having swallowed an ENOENT on a file it
// needs, is the exact shape of every bug this repo shipped in the last week: the
// Re-Jirah line reading `rejirah_state.json`, a file nothing creates, inside a
// try/catch — green forever, and the briefing simply never mentioned the four
// overdue rounds. Exit code 0 is not evidence of work. TOUCHING THE FILE IS.
//
// FAULT INJECTION. Remove a state file, corrupt a JSON, and hold the four
// localhost daemons unreachable (the collar does this by construction — see E1),
// then assert the organ DEGRADES HONESTLY rather than lying. An organ that says
// nothing is wrong while its input is gone is worse than one that crashes.
//
// LAWS: read-only on the live tree · never runs an LLM (the collar denies the
//   spawn and the ledger delta is asserted zero) · reports what it MEASURED and
//   marks what it did not reach.
// WHO ELSE COULD ACT ON THIS OUTPUT? audit.mjs (silent-success rows become
//   findings), herd.mjs (wall-clock per organ feeds the contention model),
//   treasury.mjs (spawn edges bound the token lanes). All three wired.
// CLI: node scripts/blackbox.mjs [run|reconcile|chaos|selftest] [--full]
// ============================================================================
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildSandbox, runIn, assertArmed, destroy, ledgerFingerprint, moneyOracle, readJsonl } from "./sandbox.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const IR_PATH = join(ROOT, "dressing-room", "state", "xray_graph.json");

let pass = 0, fail = 0; const fails = [];
const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };

const loadIR = () => (existsSync(IR_PATH) ? JSON.parse(readFileSync(IR_PATH, "utf8")) : null);

// Map a traced ABSOLUTE sandbox path back to the repo-relative name the static
// IR uses, so the two graphs are actually comparable. Without this every runtime
// edge looks "new" and the reconciliation is noise.
const toRepoRel = (p, sandboxRoot) => {
  const s = String(p).replace(/\\/g, "/");
  const r = sandboxRoot.replace(/\\/g, "/");
  if (s.toLowerCase().startsWith(r.toLowerCase() + "/")) return s.slice(r.length + 1);
  // NESTED SANDBOXES ARE REAL AND THEY BROKE THE RECONCILIATION. The audit organs
  // build their own sandbox, and when blackbox traces THEM that inner sandbox has
  // a different mkdtemp root — so the same file appeared twice, once relative and
  // once absolute, and every one of those absolute twins counted as "hidden
  // coupling the static IR cannot see". 386 hidden edges, mostly one file counted
  // two ways. Any arsenal-* temp root is folded back to the repo-relative name.
  const m = /arsenal(?:-audit|-test|_[a-z]+)?-?[A-Za-z0-9_]*\/(.*)$/.exec(s);
  if (m) return m[1];
  return s;
};

// THE OBSERVER IS NOT THE OBSERVED. The audit's own organs build sandboxes, read
// the IR and spawn children by design; including them makes the audit's loudest
// finding be itself. Excluded by name, and the exclusion is stated, not silent.
const AUDIT_ORGANS = new Set(["sandbox.mjs", "xray.mjs", "mutagen.mjs", "blackbox.mjs", "treasury.mjs", "herd.mjs", "audit.mjs", "audit_preload.mjs", "organism_test.mjs"]);

const primaryVerb = (organ, ir) => {
  const o = ir.organs[organ];
  const built = new Set([...(o?.verbs || []), ...(o?.header_verbs || [])]);
  for (const v of ["report", "status", "state", "brief", "list", "due", "plan", "show"]) if (built.has(v)) return v;
  return null;
};

// ── THE RUN ──────────────────────────────────────────────────────────────────
export function run(opts = {}) {
  const ir = loadIR();
  if (!ir) throw new Error("blackbox: no IR — run `node scripts/xray.mjs build` first");
  const sb = buildSandbox({ trace: true });
  const runs = [];
  try {
    assertArmed(sb);
    const organs = readdirSync(join(sb.root, "scripts")).filter((f) => f.endsWith(".mjs")).sort();
    console.log(`=== BLACKBOX — RUNTIME TRUTH ===`);
    console.log(`tracing ${organs.length} organs inside the collar (four localhost daemons unreachable BY CONSTRUCTION)\n`);

    for (const f of organs) {
      const verb = primaryVerb(f, ir);
      // selftest is the one verb every organ agrees on; the primary read-only
      // verb is run too where one exists, because a selftest exercises fixtures
      // and the primary verb exercises HIS REAL STATE.
      for (const v of ["selftest", verb].filter(Boolean)) {
        const t0 = Date.now();
        const before = readJsonl(sb.trace).length;
        const r = runIn(sb, [join(sb.root, "scripts", f), v], { label: `${f}::${v}`, timeout: 90000 });
        const rows = readJsonl(sb.trace).slice(before).filter((x) => x.organ === `${f}::${v}`);
        runs.push({
          organ: f, verb: v, code: r.code, ms: Date.now() - t0, timedOut: !!r.timedOut,
          reads: [...new Set(rows.filter((x) => x.ev === "read").map((x) => toRepoRel(x.path, sb.root)))],
          writes: [...new Set(rows.filter((x) => x.ev === "write").map((x) => toRepoRel(x.path, sb.root)))],
          enoent: [...new Set(rows.filter((x) => x.ev === "ENOENT" || x.ev === "missing").map((x) => toRepoRel(x.path, sb.root)))],
          spawns: rows.filter((x) => x.ev === "spawn").map((x) => basename(String(x.file))),
          denied: rows.filter((x) => x.ev === "DENIED").map((x) => x.kind),
        });
        process.stdout.write(r.code === 0 ? "." : "x");
      }
    }
    console.log("\n");
  } finally { destroy(sb); }
  return { runs };
}

// ── THE THREE QUESTIONS ──────────────────────────────────────────────────────
export function analyse(res, ir) {
  const runs = res.runs.filter((r) => !AUDIT_ORGANS.has(r.organ));
  // 1. SILENT SUCCESS. Exit 0 is not evidence of work.
  const silent = runs.filter((r) => r.code === 0 && r.reads.length === 0 && r.writes.length === 0 && !r.spawns.length);

  // 2. SWALLOWED ENOENT — exited 0 having failed to find something it opened.
  //    This is bug class 1's runtime signature, and it is DECIDABLE — but it is
  //    only a DEFECT after the same three-way classification the panic build
  //    needed. 63 raw rows was not 63 bugs: most were an organ probing for state
  //    it writes itself (correct), or a deliberate `__no_such_*` negative fixture.
  const NEGATIVE_PROBE = /__no_such|__[a-z_]+_selftest|no-such-dir|CANARY/i;
  const writerOf = (p) => { const f = ir.files.find((x) => x.path === p); return f ? f.writers : null; };
  const swallowedEnoent = runs
    .filter((r) => r.code === 0 && r.enoent.length)
    .map((r) => {
      const real = r.enoent
        .filter((p) => /dressing-room\/state\//.test(p) && !NEGATIVE_PROBE.test(p) && !r.writes.includes(p))
        .map((p) => {
          const w = writerOf(p);
          return {
            path: p,
            klass: w === null ? "UNKNOWN" : w.includes(r.organ) ? "SELF-HEALING" : w.length ? "CROSS-ORGAN" : "NO WRITER",
            writers: w || [],
          };
        })
        // SELF-HEALING is correct design (first run, no state yet), never a finding
        .filter((x) => x.klass !== "SELF-HEALING");
      return { ...r, real };
    })
    .filter((r) => r.real.length);

  // 3. STATIC vs RUNTIME
  const staticEdges = new Set();
  for (const [organ, o] of Object.entries(ir.organs)) {
    if (AUDIT_ORGANS.has(organ)) continue;
    for (const x of o.reads) staticEdges.add(`${organ}|R|${x.path}`);
    for (const x of o.writes) staticEdges.add(`${organ}|W|${x.path}`);
  }
  const runtimeEdges = new Set();
  for (const r of runs) {
    for (const p of r.reads) runtimeEdges.add(`${r.organ}|R|${p}`);
    for (const p of r.writes) runtimeEdges.add(`${r.organ}|W|${p}`);
  }
  const hidden = [...runtimeEdges].filter((e) => !staticEdges.has(e) && /dressing-room\/state\//.test(e));
  const unexercised = [...staticEdges].filter((e) => !runtimeEdges.has(e) && /dressing-room\/state\//.test(e));
  return { silent, swallowedEnoent, hidden, unexercised, staticEdges: staticEdges.size, runtimeEdges: runtimeEdges.size };
}

function report(opts) {
  const ir = loadIR();
  const res = run(opts);
  const a = analyse(res, ir);
  const slow = res.runs.filter((r) => !AUDIT_ORGANS.has(r.organ)).sort((x, y) => y.ms - x.ms).slice(0, 10);

  console.log(`── SILENT SUCCESS — exit 0 while touching NOTHING (${a.silent.length})`);
  console.log(`   exit code 0 is not evidence of work; touching the file is.`);
  for (const r of a.silent.slice(0, 20)) console.log(`   ${r.organ} ${r.verb}   ${r.ms}ms`);
  console.log(`\n── SWALLOWED ENOENT — exit 0 having failed to find state it opened (${a.swallowedEnoent.length})`);
  console.log(`   this is the runtime signature of the rejirah_state.json class of bug.`);
  for (const k of ["NO WRITER", "CROSS-ORGAN", "UNKNOWN"]) {
    const g = a.swallowedEnoent.flatMap((r) => r.real.filter((x) => x.klass === k).map((x) => ({ organ: r.organ, verb: r.verb, ...x })));
    if (!g.length) continue;
    console.log(`   ── ${k} (${g.length})`);
    for (const x of g.slice(0, 12)) console.log(`      ${x.organ} ${x.verb} → ${x.path}${x.writers.length ? `  [written by ${x.writers.join(", ")}]` : ""}`);
  }
  console.log(`\n── HIDDEN COUPLING — a runtime edge the static IR cannot see (${a.hidden.length})`);
  for (const e of a.hidden.slice(0, 20)) console.log(`   ${e.replace(/\|/g, "  ")}`);
  console.log(`\n── UNEXERCISED — a static edge no run ever touched (${a.unexercised.length})`);
  for (const e of a.unexercised.slice(0, 15)) console.log(`   ${e.replace(/\|/g, "  ")}`);
  console.log(`\n── SLOWEST (wall clock feeds herd.mjs's contention model)`);
  for (const r of slow) console.log(`   ${String(r.ms).padStart(7)}ms  ${r.organ} ${r.verb}${r.timedOut ? "  ⏱ TIMED OUT" : ""}`);
  console.log(`\nstatic edges ${a.staticEdges} · runtime edges ${a.runtimeEdges} · runs ${res.runs.length}`);
  return { res, a };
}

// ── CHAOS ────────────────────────────────────────────────────────────────────
// An organ that says nothing is wrong while its input is GONE is worse than one
// that crashes, because the silence is indistinguishable from health.
function chaos() {
  const ir = loadIR();
  const sb = buildSandbox({ trace: true });
  const rows = [];
  try {
    assertArmed(sb);
    const stateDir = join(sb.root, "dressing-room", "state");
    const targets = readdirSync(stateDir).filter((f) => f.endsWith(".json")).slice(0, 12);
    console.log("=== CHAOS — does the organ DEGRADE HONESTLY, or does it lie? ===\n");
    for (const fname of targets) {
      const entry = ir.files.find((f) => f.path.endsWith(`/state/${fname}`));
      if (!entry || !entry.readers.length) continue;
      const organ = entry.readers.find((r) => primaryVerb(r, ir));
      if (!organ) continue;
      const verb = primaryVerb(organ, ir);
      const p = join(stateDir, fname);
      const original = readFileSync(p, "utf8");
      const base = runIn(sb, [join(sb.root, "scripts", organ), verb], { label: organ, timeout: 60000 });
      unlinkSync(p);
      const gone = runIn(sb, [join(sb.root, "scripts", organ), verb], { label: organ, timeout: 60000 });
      writeFileSync(p, "{ this is not json");
      const bad = runIn(sb, [join(sb.root, "scripts", organ), verb], { label: organ, timeout: 60000 });
      writeFileSync(p, original);
      const honest = (r) => r.code !== 0 || /missing|not found|absent|no |none|empty|unavailable|ENOENT|cannot|—/i.test(r.out);
      rows.push({ file: fname, organ, verb, gone_honest: honest(gone), bad_honest: honest(bad), gone_same: gone.out === base.out, bad_same: bad.out === base.out });
      const bad_ = rows[rows.length - 1];
      console.log(`  ${bad_.gone_same || bad_.bad_same ? "LIES" : "    "} ${organ} ${verb} ← ${fname}   deleted:${bad_.gone_same ? "IDENTICAL OUTPUT" : "reacted"}  corrupt:${bad_.bad_same ? "IDENTICAL OUTPUT" : "reacted"}`);
    }
  } finally { destroy(sb); }
  const liars = rows.filter((r) => r.gone_same || r.bad_same);
  console.log(`\n${liars.length} organ(s) produce BYTE-IDENTICAL output with their input deleted or corrupted.`);
  console.log(`That is not resilience — it is a read that was never load-bearing.`);
  return rows;
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────
function selftest() {
  console.log("=== blackbox.mjs selftest ===\n");
  const before = ledgerFingerprint();
  const ir = loadIR();
  assert("the static IR exists to reconcile against", !!ir, "run `node scripts/xray.mjs build`");

  const sb = buildSandbox({ trace: true });
  try {
    assertArmed(sb);
    // A KNOWN-ANSWER PROBE. If the tracer cannot see a write it was told to make,
    // every "silent success" it reports later is meaningless.
    const probe = join(sb.root, ".audit", "probe2.mjs");
    writeFileSync(probe, `
import { writeFileSync, renameSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const d = join(process.cwd(), "dressing-room", "state");
const p = join(d, "__blackbox_probe__.json");
writeFileSync(p + ".tmp", "{}");
renameSync(p + ".tmp", p);
readFileSync(p, "utf8");
try { readFileSync(join(d, "__blackbox_absent__.json"), "utf8"); } catch {}
console.log("probe done");
`);
    const r = runIn(sb, [probe], { label: "probe2" });
    const rows = readJsonl(sb.trace).filter((x) => x.organ === "probe2");
    const writes = rows.filter((x) => x.ev === "write").map((x) => x.path);
    const reads = rows.filter((x) => x.ev === "read").map((x) => x.path);
    const enoent = rows.filter((x) => x.ev === "ENOENT").map((x) => x.path);

    assert("the tracer sees a write", writes.some((p) => /__blackbox_probe__\.json$/.test(p)), JSON.stringify(writes));
    assert("THE writeAtomic RULE holds at RUNTIME TOO — rename(tmp,p) is recorded as a write to p, not to p.tmp",
      writes.some((p) => /__blackbox_probe__\.json$/.test(p)) && !writes.some((p) => /\.tmp$/.test(p)), JSON.stringify(writes));
    assert("the tracer sees a read", reads.some((p) => /__blackbox_probe__\.json$/.test(p)));
    assert("the tracer records a SWALLOWED ENOENT — the runtime signature of the dead-read class",
      enoent.some((p) => /__blackbox_absent__\.json$/.test(p)) && r.code === 0, JSON.stringify(enoent));
    assert("…and the process still exited 0, which is exactly why exit codes cannot be the oracle", r.code === 0);

    // the analyser must actually classify that shape
    const fake = { runs: [
      { organ: "a.mjs", verb: "report", code: 0, ms: 1, reads: [], writes: [], enoent: [], spawns: [], denied: [] },
      { organ: "b.mjs", verb: "report", code: 0, ms: 1, reads: ["dressing-room/state/x.json"], writes: [], enoent: ["dressing-room/state/gone.json"], spawns: [], denied: [] },
    ] };
    const a = analyse(fake, { organs: { "a.mjs": { reads: [], writes: [] }, "b.mjs": { reads: [], writes: [] } }, files: [] });
    assert("SILENT SUCCESS is classified (exit 0, touched nothing)", a.silent.length === 1 && a.silent[0].organ === "a.mjs");
    assert("SWALLOWED ENOENT is classified (exit 0, state file missing)", a.swallowedEnoent.length === 1);
    assert("HIDDEN COUPLING is classified (runtime edge absent from the static IR)", a.hidden.length >= 1);
  } finally { destroy(sb); }

  const after = ledgerFingerprint();
  const money = moneyOracle(before, after);
  assert("THE MONEY ORACLE — no ledger row is attributable to the audit, and zero billing spawns were allowed",
    money.ok, money.detail);
  console.log(`\nblackbox: ${pass} passed, ${fail} failed`);
  if (fail) for (const f of fails) console.log(`  · ${f.n}${f.d ? `\n      ${f.d}` : ""}`);
  process.exit(fail ? 1 : 0);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = (process.argv[2] || "selftest").toLowerCase();
  const full = process.argv.includes("--full");
  if (mode === "selftest") return selftest();
  if (mode === "run" || mode === "reconcile") { report({ full }); return; }
  if (mode === "chaos") { chaos(); return; }
  console.log("blackbox: run | reconcile | chaos | selftest");
  process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
